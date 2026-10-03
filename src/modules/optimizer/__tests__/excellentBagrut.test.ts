/**
 * Technion "בגרות מצוינת" — admission without psychometric on per-subject bagrut conditions
 * (snapshot: src/data/sources/technion-excellent-bagrut-2026-10.json).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { evaluateExcellentBagrut, rawBagrutAverage } from '../excellentBagrut';
import { analyzeProgramGap } from '../../../utils/analysis/gapAnalyzer';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';

const technion = (academicData as any[]).find((i) => i.id === 'inst-48').programs as any[];
const prog = (id: string) => technion.find((p) => p.id === id);
const route = (id: string) => prog(id).admissionRoutes.excellentBagrut;

// Profile A from docs/threshold-collection/BRIEF.md
const A = [
	{ name: 'מתמטיקה', units: 5, grade: 95 }, { name: 'אנגלית', units: 5, grade: 92 },
	{ name: 'פיזיקה', units: 5, grade: 93 }, { name: 'מדעי המחשב', units: 5, grade: 90 },
	{ name: 'היסטוריה', units: 2, grade: 85 }, { name: 'אזרחות', units: 2, grade: 88 },
	{ name: 'תנ"ך', units: 2, grade: 80 }, { name: 'ספרות', units: 2, grade: 82 },
	{ name: 'הבעה עברית', units: 2, grade: 84 }
];

describe('Technion "בגרות מצוינת"', () => {
	it('is imported for 18 programs, each with a summary', () => {
		const withRoute = technion.filter((p) => p.admissionRoutes?.excellentBagrut);
		assert.equal(withRoute.length, 18);
		for (const p of withRoute) assert.ok(p.admissionRoutes.excellentBagrut.summary, p.fieldOfStudy);
	});

	it('plain average is units-weighted without bonuses', () => {
		assert.equal(rawBagrutAverage(A), 89.6);
	});

	it('physics: math + physics 5u ≥ 90 — profile A qualifies', () => {
		assert.equal(evaluateExcellentBagrut(route('prog-technion-45'), A).met, true);
	});

	it('aerospace needs a plain average of 90 — profile A (89.6) does not qualify, and says why', () => {
		const r = evaluateExcellentBagrut(route('prog-technion-11'), A);
		assert.equal(r.met, false);
		assert.match(r.missing.join(' '), /ממוצע בגרות ללא בונוסים 90/);
	});

	it('biology: needs biology (or biotech) 5u ≥ 90 plus another science, and the math condition', () => {
		const bio = [...A, { name: 'ביולוגיה', units: 5, grade: 91 }];
		assert.equal(evaluateExcellentBagrut(route('prog-technion-3'), A).met, false);
		assert.equal(evaluateExcellentBagrut(route('prog-technion-3'), bio).met, true);
		const math4u = (grade: number) => bio.map((s) => (s.name === 'מתמטיקה' ? { ...s, units: 4, grade } : s));
		assert.equal(evaluateExcellentBagrut(route('prog-technion-3'), math4u(82)).met, true); // 4u ≥ 80; physics is the 2nd science
		const low = evaluateExcellentBagrut(route('prog-technion-3'), math4u(75)); // 4u below 80
		assert.equal(low.met, false);
		assert.match(low.missing.join(' '), /מתמטיקה 5 יח״ל 70\+ או 4 יח״ל 80\+/);
	});

	it('a subject is counted for one condition only', () => {
		// chemistry track option "chemistry 90 + another science 90" can't use chemistry twice
		const onlyChem = [{ name: 'כימיה', units: 5, grade: 98 }, { name: 'מתמטיקה', units: 5, grade: 80 }];
		assert.equal(evaluateExcellentBagrut(route('prog-technion-32'), onlyChem).met, false);
	});

	it('the gap analysis admits through the route even when the sekem falls short', () => {
		const profile: any = { bagrutSubjects: A, psychometricGeneral: 0, mathUnits: 5, mathGrade: 95, physicsUnits: 5, physicsGrade: 93 };
		const res = calculateMultiInstitutionSekem(profile, ['technion'])[0];
		const gap = analyzeProgramGap({ institutionId: 'inst-48', institutionName: 'הטכניון', calculatorId: 'technion', program: prog('prog-technion-45') }, profile, res);
		assert.equal(gap.status, 'accepted');
		assert.equal(gap.admissionRoute, 'excellent_bagrut');
		assert.match(gap.admissionNote ?? '', /בגרות מצוינת/);
	});
});
