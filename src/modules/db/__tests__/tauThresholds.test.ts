/**
 * TAU thresholds imported from the program pages on go.tau.ac.il
 * (snapshot: src/data/sources/tau-thresholds-2026-10-02.json) and the faculty-based score they use.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { evaluateTau } from '../../calculators/tau';
import { selectProgramSekem } from '../../calculators';

const tau = (academicData as any[]).find((i) => i.id === 'inst-6').programs as any[];
const byId = (id: string) => tau.find((p) => p.id === id);

describe('TAU official thresholds', () => {
	it('every sourced program is on TAU’s own 800 scale (no conversion) with a go.tau.ac.il source', () => {
		const sourced = tau.filter((p) => p.officialThreshold !== undefined);
		assert.ok(sourced.length >= 60, `expected ~63 sourced programs, got ${sourced.length}`);
		for (const p of sourced) {
			assert.equal(p.admissionThreshold, p.officialThreshold, p.fieldOfStudy);
			assert.ok(p.thresholdSource?.startsWith('https://go.tau.ac.il/'), p.fieldOfStudy);
			assert.ok(['general', 'management', 'engineering'].includes(p.relevantSekemType), p.fieldOfStudy);
		}
	});

	it('spot checks against go.tau.ac.il', () => {
		assert.equal(byId('prog-tau-0368-22').admissionThreshold, 705); // מדעי המחשב, this year
		assert.equal(byId('prog-tau-0368-22').relevantSekemType, 'engineering'); // exact sciences score
		assert.equal(byId('prog-tau-0512-74').admissionThreshold, 710); // הנדסת חשמל, this year
		assert.equal(byId('prog-tau-1411-81').admissionThreshold, 647); // משפטים
		assert.equal(byId('prog-tau-1411-81').relevantSekemType, 'general');
		assert.equal(byId('prog-tau-1221-51').relevantSekemType, 'management'); // ניהול
	});

	it('profile A (psych 714, 5u math+physics) clears CS via the exact-sciences score', () => {
		const res = evaluateTau({
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 95 }, { name: 'אנגלית', units: 5, grade: 92 },
				{ name: 'פיזיקה', units: 5, grade: 93 }, { name: 'מדעי המחשב', units: 5, grade: 90 },
				{ name: 'היסטוריה', units: 2, grade: 85 }, { name: 'אזרחות', units: 2, grade: 88 },
				{ name: 'תנ"ך', units: 2, grade: 80 }, { name: 'ספרות', units: 2, grade: 82 },
				{ name: 'הבעה עברית', units: 2, grade: 84 }
			],
			psychometricGeneral: 714
		} as any);
		const cs = byId('prog-tau-0368-22');
		const score = selectProgramSekem(res, cs.relevantSekemType, 'inst-6')!;
		assert.equal(score, (res.generalSekem as number) + 10); // +10 for 5u math & physics
		assert.ok(score >= cs.admissionThreshold);
	});
});
