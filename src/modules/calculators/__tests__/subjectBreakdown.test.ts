/**
 * Per-subject breakdown of the optimal bagrut average (the "how was my score computed" panel):
 * bonus, effective score and whether each subject counted — recomputed on every change.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';

// The user's real profile (2026-10-03): TAU drops CS and systems programming while history 5u is high.
const subjects = (history: number) => [
	{ name: 'תנ"ך', units: 2, grade: 83 }, { name: 'ספרות עברית', units: 2, grade: 89 },
	{ name: 'אזרחות', units: 2, grade: 93 }, { name: 'היסטוריה / תע"י', units: 5, grade: history },
	{ name: 'הבעה עברית', units: 2, grade: 72 }, { name: 'אנגלית', units: 5, grade: 90 },
	{ name: 'מתמטיקה', units: 5, grade: 87 }, { name: 'פיזיקה', units: 5, grade: 96 },
	{ name: 'מדעי המחשב', units: 5, grade: 86 }, { name: 'תכנון ותכנות מערכות', units: 5, grade: 86 }
];
const tau = (history: number): any =>
	calculateMultiInstitutionSekem({ bagrutSubjects: subjects(history), psychometricGeneral: 714, mathUnits: 5, mathGrade: 87, physicsUnits: 5, physicsGrade: 96 } as any, ['tau'])[0];
const statusOf = (r: any, name: string) => r.subjectBreakdown.find((s: any) => s.name === name).status;

describe('Subject breakdown of the optimal average', () => {
	it('lists every subject with its bonus and effective score (TAU: CS 5u +20)', () => {
		const r = tau(91);
		assert.equal(r.subjectBreakdown.length, 10);
		const cs = r.subjectBreakdown.find((s: any) => s.name === 'מדעי המחשב');
		assert.equal(cs.bonus, 20);
		assert.equal(cs.effective, 106);
		assert.equal(statusOf(r, 'היסטוריה / תע"י'), 'mandatory');
		assert.equal(r.bagrutCap, 117);
	});

	it('drops CS while history keeps the average above 106, and brings it back when history falls to 50', () => {
		const high = tau(70);
		assert.ok(high.bagrutAverage > 106);
		assert.equal(statusOf(high, 'מדעי המחשב'), 'dropped');
		assert.equal(statusOf(high, 'תכנון ותכנות מערכות'), 'dropped');

		const low = tau(50);
		assert.equal(statusOf(low, 'מדעי המחשב'), 'included');
		assert.equal(statusOf(low, 'תכנון ותכנות מערכות'), 'included');
		assert.equal(statusOf(low, 'היסטוריה / תע"י'), 'mandatory'); // mandatory subjects never drop
	});

	it('the breakdown agrees with the dropped-subject list', () => {
		const r = tau(91);
		const dropped = r.subjectBreakdown.filter((s: any) => s.status === 'dropped').map((s: any) => s.name).sort();
		assert.deepEqual(dropped, [...(r.droppedSubjects ?? [])].sort());
	});
});
