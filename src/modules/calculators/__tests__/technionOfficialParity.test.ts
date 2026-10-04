import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { evaluateTechnion, calculateTechnionOptimalBagrut, detectTechnionScienceCluster } from '../technion';
import { computeOptimalAverage } from '../optimalAverage';
import type { CalculatorSubject, InstitutionCalculatorInput } from '../types';

const casesBytes = readFileSync(new URL('./fixtures/technion-official/cases.json', import.meta.url));
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const cases = JSON.parse(casesBytes.toString('utf8')) as {
    caseId: string; input: InstitutionCalculatorInput; academic_year: null;
    expected: Record<'bagrutAverage' | 'generalSekem', string | number>;
    provenance: { sha256: string; source_url: string; captured_at: string };
    test_response_artifact: string;
}[];
const subject = (name: string, units: number, grade: number): CalculatorSubject => ({ name, units, grade });

describe('Technion captured ordinary-calculator parity (no current-year claim)', () => {
    it('keeps the exact reviewed synthetic fixture set and source response hashes', () => {
        assert.equal(cases.length, 20);
        assert.equal(hash(readFileSync(new URL('./fixtures/technion-official/source-rules.html', import.meta.url))), '03fdcfbed330181115c164a559752788def22665cee1d00905e37287f8b5f93b');
        assert.equal(hash(casesBytes), 'c53f04ba3a4bc4bb597a3269a07676d5d2e8c1ce51b415b2f88ec87ca6d860d5');
        for (const c of cases) {
            assert.equal(c.academic_year, null);
            const raw = readFileSync(new URL(`./fixtures/technion-official/${c.provenance.sha256}.html`, import.meta.url));
            assert.equal(hash(raw), c.provenance.sha256, c.caseId);
            assert.equal(c.provenance.source_url, 'https://admissions.technion.ac.il/wp-content/plugins/technion-calculators/technion-calculators-sum.php');
        }
    });
    for (const c of cases) {
        it(`${c.caseId}: captured average and ordinary score`, () => {
            const result = evaluateTechnion(c.input);
            assert.equal(result.bagrutAverage, Number(c.expected.bagrutAverage));
            assert.equal(result.generalSekem, Number(c.expected.generalSekem));
        });
    }
    it('preserves raw precision internally and the existing displayed average', () => {
        const c = cases.find(c => c.caseId === 'technion-A-english61-P620')!;
        const result = calculateTechnionOptimalBagrut(c.input.bagrutSubjects);
        assert.equal(result.average, 106.7);
        assert.notEqual(result.rawAverage, result.average);
        assert.equal(evaluateTechnion(c.input).generalSekem, 80.8);
    });
    it('does not let a dropped science row donate an enlarged bonus to retained technology', () => {
        const mandatory = [subject('מתמטיקה', 5, 100), subject('אנגלית', 5, 100),
            ...['היסטוריה', 'אזרחות', 'תנ"ך', 'ספרות', 'הבעה עברית'].map(n => subject(n, 2, 100))];
        const rows = [...mandatory, subject('מדעי המחשב', 5, 100), subject('פיזיקה', 5, 60)];
        const result = calculateTechnionOptimalBagrut(rows);
        assert.equal(result.hasScienceCluster, false);
        assert.equal(result.average, 118.3);
        assert.equal(result.rawAverage, 3550 / 30);
        assert.deepEqual(result.droppedSubjects.map(s => s.name), ['פיזיקה']);
        assert.equal(result.breakdown!.find(s => s.name === 'מדעי המחשב')!.bonus, 25);
    });
    it('requires retained math and two domain-valid five-unit members for the cluster', () => {
        const valid = [subject('מתמטיקה', 5, 90), subject('פיזיקה', 5, 90), subject('מדעי המחשב', 5, 90)];
        assert.equal(detectTechnionScienceCluster(valid), true);
        for (const grade of [59, 101, NaN, Infinity]) {
            assert.equal(detectTechnionScienceCluster([valid[0], subject('פיזיקה', 5, grade), valid[2]]), false);
        }
        assert.equal(detectTechnionScienceCluster([valid[0], subject('פיזיקה', 6, 90), valid[2]]), false);
        assert.equal(detectTechnionScienceCluster(valid.slice(1)), false);
        assert.equal(detectTechnionScienceCluster([valid[0], subject('מדעי המחשב', 5, 90), subject('אלקטרוניקה', 5, 90)]), false);
    });
    it('keeps other institutions default rounding and their one-argument bonus callbacks', () => {
        const rows = [subject('required', 20, 80), subject('optional', 1, 90)];
        const base = { isMandatory: (name: string) => name === 'required', getBonus: () => 0, dropReason: 'test' };
        const old = computeOptimalAverage(rows, base);
        assert.equal(old.average, 80.48);
        const raw = computeOptimalAverage(rows, { ...base, decimals: null });
        assert.equal(raw.average, 1690 / 21);
        assert.deepEqual(old.includedSubjects, raw.includedSubjects);
    });
});
