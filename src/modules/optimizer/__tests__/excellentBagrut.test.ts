/**
 * Technion "בגרות מצוינת" — admission without psychometric on per-subject bagrut conditions
 * (snapshot: src/data/sources/technion-excellent-bagrut-2026-10.json).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { evaluateExcellentBagrut, rawBagrutAverage, requiredMathExamScore } from '../excellentBagrut';
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

	describe('"אפיק מקוצר" (informational alternative path)', () => {
		const weak: any = {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 80 }, { name: 'אנגלית', units: 4, grade: 80 },
				{ name: 'היסטוריה', units: 2, grade: 75 }, { name: 'אזרחות', units: 2, grade: 75 },
				{ name: 'תנ"ך', units: 2, grade: 75 }, { name: 'ספרות', units: 2, grade: 75 },
				{ name: 'הבעה עברית', units: 2, grade: 75 }, { name: 'ביולוגיה', units: 5, grade: 80 }
			],
			psychometricGeneral: 550, mathUnits: 4, mathGrade: 80, physicsUnits: 0, physicsGrade: 0
		};
		const analyze = (id: string, profile: any) => {
			const res = calculateMultiInstitutionSekem(profile, ['technion'])[0];
			return analyzeProgramGap({ institutionId: 'inst-48', institutionName: 'הטכניון', calculatorId: 'technion', program: prog(id) }, profile, res);
		};

		it('is imported for 24 programs with the published numbers', () => {
			assert.equal(technion.filter((p) => p.admissionRoutes?.shortTrack).length, 24);
			assert.deepEqual(prog('prog-technion-24').admissionRoutes.shortTrack, { firstSemesterAverageMin: 78, minCourseGrade: 70 });
			assert.equal(prog('prog-technion-45').admissionRoutes.shortTrack.firstSemesterAverageMin, 80);
			assert.equal(prog('prog-technion-33').admissionRoutes?.shortTrack, undefined); // CS isn't offered
		});

		it('is shown to an applicant who is not accepted, without changing the status', () => {
			const gap = analyze('prog-technion-24', weak);
			assert.notEqual(gap.status, 'accepted');
			const path = gap.alternativePaths?.find((p) => p.id === 'alt-short-track');
			assert.ok(path);
			assert.match(path!.description, /ממוצע 78\+/);
		});

		it('is not shown when the applicant is already accepted', () => {
			const profile: any = { bagrutSubjects: A, psychometricGeneral: 0, mathUnits: 5, mathGrade: 95, physicsUnits: 5, physicsGrade: 93 };
			assert.equal(analyze('prog-technion-45', profile).alternativePaths, undefined);
		});
	});

	describe('"בגרות ובחינת סיווג במתמטיקה" (exam replaces the psychometric)', () => {
		it('conversion matches the official table', () => {
			const table: Record<number, number> = { 100: 770, 96: 761, 92: 751, 88: 741, 84: 731, 80: 722, 76: 712, 72: 702, 68: 692, 64: 683, 60: 673, 56: 663 };
			const conv = prog('prog-technion-19').admissionRoutes.mathExam.conversion;
			for (const [score, eq] of Object.entries(table)) assert.equal(Math.round(Number(score) * conv.slope + conv.intercept), eq);
		});

		it('tells an eligible applicant without psychometric the exam score they need (EE, threshold 94: 99 → 768)', () => {
			const profile: any = { bagrutSubjects: A, psychometricGeneral: 0, mathUnits: 5, mathGrade: 95, physicsUnits: 5, physicsGrade: 93 };
			const res = calculateMultiInstitutionSekem(profile, ['technion'])[0];
			assert.equal(res.bagrutAverage, 111.1);
			const route = prog('prog-technion-19').admissionRoutes.mathExam;
			assert.deepEqual(requiredMathExamScore(route, 111.1, 94), { examScore: 99, psychometricEquivalent: 768 });
			const gap = analyzeProgramGap({ institutionId: 'inst-48', institutionName: 'הטכניון', calculatorId: 'technion', program: prog('prog-technion-19') }, profile, res);
			const path = gap.alternativePaths?.find((p) => p.id === 'alt-math-exam');
			assert.ok(path);
			assert.match(path!.description, /ציון 99 במבחן הסיווג/);
		});

		it('is not offered to programs missing from the official list (EE + math)', () => {
			assert.equal(prog('prog-technion-20').admissionRoutes?.mathExam, undefined);
		});
	});

	describe('"ראויים לקידום" (sekem discount)', () => {
		it('has the published discount per track', () => {
			assert.equal(prog('prog-technion-5').admissionRoutes.promotionBonus, 2); // הנדסה אזרחית
			assert.equal(prog('prog-technion-24').admissionRoutes.promotionBonus, 1); // הנדסת מכונות
			assert.equal(prog('prog-technion-19').admissionRoutes?.promotionBonus, undefined); // הנדסת חשמל: none
		});

		it('says when the discount would be enough (civil engineering: sekem 87 vs threshold 88, discount 2)', () => {
			const profile: any = { bagrutSubjects: A, psychometricGeneral: 673, mathUnits: 5, mathGrade: 95, physicsUnits: 5, physicsGrade: 93 };
			const res = calculateMultiInstitutionSekem(profile, ['technion'])[0];
			const gap = analyzeProgramGap({ institutionId: 'inst-48', institutionName: 'הטכניון', calculatorId: 'technion', program: prog('prog-technion-5') }, profile, res);
			assert.notEqual(gap.status, 'accepted');
			const path = gap.alternativePaths?.find((p) => p.id === 'alt-promotion');
			assert.ok(path);
			assert.match(path!.description, /סף 86/);
			assert.match(path!.description, /עומד בסף/);
		});
	});
});
