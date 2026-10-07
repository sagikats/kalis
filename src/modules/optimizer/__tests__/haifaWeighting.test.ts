/**
 * Haifa programs are scored with their faculty's official bagrut:psychometric weighting
 * (admissions.haifa.ac.il/score-calculation/), and the user's calculator runs (2026-10-07) are reproduced end to end.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import data from '../../../data/academicData.json';
import { calculateInstitution, selectProgramSekem } from '../../calculators';

const haifa = (data as any[]).find((i) => i.id === 'inst-5');
const program = (name: string) => haifa.programs.find((p: any) => p.fieldOfStudy === name && !p.notOffered);

// The profile of the runs: bagrut average 100 (ten 2-unit subjects at 100 with no bonus), Q150 / V100 / E100 = general 614
const subjects = Array.from({ length: 10 }, (_, i) => ({ name: `מקצוע ${i}`, units: 2, grade: 100 }));
const res = calculateInstitution('haifa', {
	bagrutSubjects: subjects,
	psychometricGeneral: 614,
	psychometricQuant: 150,
	psychometricVerbal: 100,
	psychometricEnglish: 100
});

describe('Haifa weighting per program', () => {
	it('the run profile has a bagrut average of 100', () => {
		assert.equal(res.bagrutAverage, 100);
	});

	for (const [name, expected] of [
		['מדעי המחשב', 658], ['מדעי הנתונים', 658], ['מערכות מידע', 658], ['מתמטיקה', 658],
		['סטטיסטיקה', 658], ['כלכלה', 658], ['ביופיזיקה', 658], ['פסיכולוגיה', 621]
	] as const) {
		it(`${name}: ${expected}, as on the Haifa calculator`, () => {
			const p = program(name);
			assert.equal(selectProgramSekem(res, p.relevantSekemType, 'haifa'), expected);
		});
	}

	it('every offered program has an official weighting', () => {
		const allowed = new Set(['engineering', 'haifa-1:2', 'haifa-humanities-1:2', 'haifa-1:3', 'haifa-1:7', 'haifa-3:7']);
		for (const p of haifa.programs.filter((p: any) => !p.notOffered)) {
			assert.ok(allowed.has(p.relevantSekemType), `${p.fieldOfStudy}: ${p.relevantSekemType}`);
		}
	});

	it('faculty rules: law 3:7, Ofakim 1:3, other humanities 1:2, sociology 1:3', () => {
		assert.equal(program('משפטים').relevantSekemType, 'haifa-3:7');
		assert.equal(program('אופקים').relevantSekemType, 'haifa-1:3');
		assert.equal(program('פילוסופיה').relevantSekemType, 'haifa-humanities-1:2');
		assert.equal(program('סוציולוגיה').relevantSekemType, 'haifa-1:3');
	});
});
