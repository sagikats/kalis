/**
 * Reichman thresholds from the official תשפ"ז table (src/data/sources/reichman-admission-table-tashpaz.json).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { evaluateReichman } from '../../calculators/reichman';
import { selectProgramSekem } from '../../calculators';

const runi = (academicData as any[]).find((i) => i.id === 'inst-38').programs as any[];
const byId = (id: string) => runi.find((p) => p.id === id);

describe('Reichman official thresholds', () => {
	it('sourced programs use the ציון מתואם scale and name the table year', () => {
		const sourced = runi.filter((p) => p.officialThreshold !== undefined);
		assert.ok(sourced.length >= 15);
		for (const p of sourced) {
			assert.equal(p.admissionThreshold, p.officialThreshold, p.fieldOfStudy);
			assert.ok(p.thresholdSource?.includes('תשפ"ז'), p.fieldOfStudy);
		}
		assert.equal(byId('prog-inst-38-3').admissionThreshold, 705); // מדעי המחשב
		assert.equal(byId('prog-inst-38-3').directBagrutMinAverage, 110);
		assert.equal(byId('prog-inst-38-3').admissionRoutes.psychometricOnlyMin, 720);
		assert.equal(byId('prog-inst-38-3').minPsychometricFloor, 660);
	});

	it('profile A (ציון מתואם 739.13 on runi.ac.il) clears CS', () => {
		const res = evaluateReichman({
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 95 }, { name: 'אנגלית', units: 5, grade: 92 },
				{ name: 'פיזיקה', units: 5, grade: 93 }, { name: 'מדעי המחשב', units: 5, grade: 90 },
				{ name: 'היסטוריה', units: 2, grade: 85 }, { name: 'אזרחות', units: 2, grade: 88 },
				{ name: 'תנ"ך', units: 2, grade: 80 }, { name: 'ספרות', units: 2, grade: 82 },
				{ name: 'הבעה עברית', units: 2, grade: 84 }
			],
			psychometricGeneral: 714
		});
		const score = selectProgramSekem(res, 'general', 'inst-38')!;
		assert.ok(Math.abs(score - 739) <= 1, `got ${score}`);
		assert.ok(score >= byId('prog-inst-38-3').admissionThreshold);
	});
});
