/**
 * The admission report, the regular calculator's admission panel, the track engine and the What-If simulator must
 * judge every program the same way. They all go through analyzeProgramGap (status, official routes and conditions)
 * and through the institution calculators (score); these tests pin that.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import { analyzeProgramGap, UserAcademicProfile } from '../../../utils/analysis/gapAnalyzer';
import { evaluateSimulatedSekem, extractDegreeHardRequirements } from '../../../utils/analysis/trackGenerator';

const CALC_IDS: Record<string, string> = {
	'inst-48': 'technion', 'inst-6': 'tau', 'inst-1': 'huji', 'inst-3': 'bgu',
	'inst-5': 'haifa', 'inst-2': 'ariel', 'inst-4': 'bar_ilan', 'inst-38': 'reichman'
};

let seed = 11;
const rnd = () => {
	seed = (seed * 1103515245 + 12345) % 2147483648;
	return seed / 2147483648;
};
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

function randomProfile(withSections: boolean): UserAcademicProfile {
	const g = () => 55 + Math.floor(rnd() * 46);
	const subjects = [
		{ name: 'מתמטיקה', units: pick([3, 4, 5]), grade: g() },
		{ name: 'אנגלית', units: pick([4, 5]), grade: g() },
		{ name: 'היסטוריה', units: 2, grade: g() },
		{ name: 'אזרחות', units: 2, grade: g() },
		{ name: 'תנ"ך', units: 2, grade: g() },
		{ name: 'ספרות', units: 2, grade: g() },
		{ name: 'הבעה עברית', units: 2, grade: g() },
		{ name: pick(['פיזיקה', 'ביולוגיה', 'מדעי המחשב', 'גאוגרפיה']), units: 5, grade: g() }
	];
	const q = 80 + Math.floor(rnd() * 70);
	const v = 80 + Math.floor(rnd() * 70);
	const e = 80 + Math.floor(rnd() * 70);
	const general = Math.round(200 + ((2 * q + 2 * v + e) / 5 - 50) * 6);
	const physics = subjects.find((s) => s.name === 'פיזיקה');
	return {
		bagrutSubjects: subjects,
		psychometricGeneral: general,
		psychometricQuant: withSections ? q : 0,
		psychometricVerbal: withSections ? v : 0,
		psychometricEnglish: withSections ? e : 0,
		mathUnits: subjects[0].units,
		mathGrade: subjects[0].grade,
		physicsUnits: physics?.units ?? 0,
		physicsGrade: physics?.grade ?? 0
	} as UserAcademicProfile;
}

const programsOf = (instId: string) =>
	((academicData as any[]).find((i) => i.id === instId)?.programs ?? []).filter((p: any) => !p.notOffered && p.admissionThreshold);

describe('Report, calculator, tracks and simulator use the same score', () => {
	it('the score the report compares with the threshold equals the track engine / simulator score, for every program', () => {
		let compared = 0;
		for (let i = 0; i < 6; i++) {
			// With and without psychometric section scores (only a general score: both sides estimate the sections the same way)
			const profile = randomProfile(i % 2 === 0);
			const results = calculateMultiInstitutionSekem(profile as any, Object.values(CALC_IDS));
			for (const [instId, calculatorId] of Object.entries(CALC_IDS)) {
				const res = results.find((r) => r.institutionId === calculatorId)!;
				for (const program of programsOf(instId)) {
					const analysis = analyzeProgramGap({ institutionId: instId, institutionName: '', calculatorId, program }, profile, res);
					const trackSekem = evaluateSimulatedSekem(
						calculatorId, analysis.relevantSekemType, profile, profile.bagrutSubjects, profile.psychometricGeneral,
						profile.mathUnits, profile.mathGrade, profile.physicsUnits, profile.physicsGrade
					).sekem;
					assert.ok(Math.abs(trackSekem - analysis.userSekem) <= 0.05,
						`${calculatorId} ${program.fieldOfStudy} (${analysis.relevantSekemType}): report ${analysis.userSekem} vs tracks ${trackSekem}`);
					compared++;
				}
			}
		}
		assert.ok(compared > 3000);
	});
});

describe('Official conditions on top of the threshold', () => {
	const law = programsOf('inst-4').find((p: any) => p.id === 'prog-inst-4-48');

	it('Bar-Ilan law: the sekem passes but a bagrut average below 90 is "missing requirement"', () => {
		assert.equal(law.admissionRoutes.minBagrutAverage, 90);
		const profile = randomProfile(true);
		const res = { ...calculateMultiInstitutionSekem(profile as any, ['bar_ilan'])[0] };
		// Pin the scores: sekem far above the threshold, average just below 90
		const passing = { ...res, generalSekem: 99, quantitativeSekem: 99, engineeringSekem: 99, managementSekem: 99, psychometricGeneral: 700 };
		const strong = { ...profile, psychometricGeneral: 700, psychometricEnglish: 140,
			bagrutSubjects: profile.bagrutSubjects.map((s) => (s.name === 'מתמטיקה' ? { ...s, units: 5, grade: 95 } : s)), mathUnits: 5, mathGrade: 95 };
		const below = analyzeProgramGap({ institutionId: 'inst-4', institutionName: '', calculatorId: 'bar_ilan', program: law },
			strong, { ...passing, bagrutAverage: 89.5 });
		assert.equal(below.status, 'missing_requirement');
		assert.match(below.admissionNote ?? '', /ממוצע בגרות 90/);
		const above = analyzeProgramGap({ institutionId: 'inst-4', institutionName: '', calculatorId: 'bar_ilan', program: law },
			strong, { ...passing, bagrutAverage: 95 });
		assert.notEqual(above.status, 'missing_requirement');
	});

	it('track engine: an official bagrut-only route is offered even when the sekem route requires a psychometric', () => {
		const bgu = programsOf('inst-3').find((p: any) => p.admissionRoutes?.bagrutOnlyMin && p.requiresPsychometric);
		const hard = extractDegreeHardRequirements(bgu, 'bgu');
		assert.equal(hard.directBagrutEligible, true);
		assert.equal(hard.directBagrutMinAverage, bgu.admissionRoutes.bagrutOnlyMin);
	});

	it('track engine: no invented bagrut-only route or math minimum for a program with official data and no such route', () => {
		const technionCs = programsOf('inst-48').find((p: any) => p.fieldOfStudy.includes('מדעי המחשב'));
		const hard = extractDegreeHardRequirements(technionCs, 'technion');
		assert.equal(hard.directBagrutEligible, false);
		assert.equal(hard.directBagrutMath5Min, undefined);
		assert.equal(hard.minPsychometricQuant, undefined);
	});
});
