/**
 * Official admission routes in the gap analysis:
 *  - an extra minimum psychometric ("ובנוסף") blocks the sekem route,
 *  - bagrut-only and psychometric-only routes admit on their own,
 *  - psychometric-only programs compare the psychometric score itself,
 *  - catalog estimates (minPsychometricFloor without official routes) never change the status.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { analyzeProgramGap, UserAcademicProfile } from '../../../utils/analysis/gapAnalyzer';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import { evaluateSimulatedSekem, generatePersonalizedTracks } from '../../../utils/analysis/trackGenerator';

const programOf = (instId: string, progId: string) =>
	(academicData as any[]).find((i) => i.id === instId).programs.find((p: any) => p.id === progId);

const STRONG_BAGRUT = [
	{ name: 'מתמטיקה', units: 5, grade: 100 }, { name: 'אנגלית', units: 5, grade: 100 },
	{ name: 'פיזיקה', units: 5, grade: 100 }, { name: 'מדעי המחשב', units: 5, grade: 100 },
	{ name: 'היסטוריה', units: 2, grade: 100 }, { name: 'אזרחות', units: 2, grade: 100 },
	{ name: 'תנ"ך', units: 2, grade: 100 }, { name: 'ספרות', units: 2, grade: 100 },
	{ name: 'הבעה עברית', units: 2, grade: 100 }
];
const WEAK_BAGRUT = [
	{ name: 'מתמטיקה', units: 3, grade: 70 }, { name: 'אנגלית', units: 4, grade: 75 },
	{ name: 'היסטוריה', units: 2, grade: 70 }, { name: 'אזרחות', units: 2, grade: 72 },
	{ name: 'תנ"ך', units: 2, grade: 70 }, { name: 'ספרות', units: 2, grade: 70 },
	{ name: 'הבעה עברית', units: 2, grade: 70 }, { name: 'ביולוגיה', units: 5, grade: 75 }
];

function profile(bagrut: any[], psych: number, quant = 0): UserAcademicProfile {
	const math = bagrut.find((s) => s.name === 'מתמטיקה');
	const phys = bagrut.find((s) => s.name === 'פיזיקה');
	return {
		bagrutSubjects: bagrut, psychometricGeneral: psych, psychometricQuant: quant || undefined,
		mathUnits: math.units, mathGrade: math.grade, physicsUnits: phys?.units ?? 0, physicsGrade: phys?.grade ?? 0
	};
}

function analyze(calcId: string, instId: string, progId: string, prof: UserAcademicProfile) {
	const program = programOf(instId, progId);
	const res = calculateMultiInstitutionSekem(prof as any, [calcId])[0];
	return analyzeProgramGap({ institutionId: instId, institutionName: '', calculatorId: calcId, program }, prof, res);
}

describe('Official admission routes', () => {
	it('BGU CS: a quantitative sekem above 720 is not enough without psychometric 600 ("ובנוסף")', () => {
		const gap = analyze('bgu', 'inst-3', 'prog-bgu-77', profile(STRONG_BAGRUT, 560, 125));
		assert.ok(gap.userSekem >= 720, `sekem ${gap.userSekem}`);
		assert.equal(gap.status, 'not_accepted');
		assert.match(gap.admissionNote ?? '', /600/);
		assert.equal(gap.improvementOptions[0].id, 'opt-psych-floor');

		const ok = analyze('bgu', 'inst-3', 'prog-bgu-77', profile(STRONG_BAGRUT, 640, 130));
		assert.equal(ok.status, 'accepted');
		assert.equal(ok.admissionRoute, 'sekem');
	});

	it('BGU Economics admits by psychometric alone (600) and compares the psychometric score itself', () => {
		const below = analyze('bgu', 'inst-3', 'prog-bgu-42', profile(WEAK_BAGRUT, 590));
		assert.equal(below.relevantSekemType, 'psychometric');
		assert.equal(below.userSekem, 590);
		assert.notEqual(below.status, 'accepted');

		const above = analyze('bgu', 'inst-3', 'prog-bgu-42', profile(WEAK_BAGRUT, 610));
		assert.equal(above.userSekem, 610);
		assert.equal(above.status, 'accepted');
	});

	it('bagrut-only route admits without a psychometric score (BGU Economics: average 107)', () => {
		const gap = analyze('bgu', 'inst-3', 'prog-bgu-42', profile(STRONG_BAGRUT, 0));
		assert.equal(gap.status, 'accepted');
		assert.equal(gap.admissionRoute, 'bagrut_only');
		assert.equal(gap.improvementOptions.length, 0);
	});

	it('psychometric-only route admits when the sekem falls short (Reichman psychology: 640)', () => {
		const prof = profile(WEAK_BAGRUT, 650);
		const gap = analyze('reichman', 'inst-38', 'prog-inst-38-7', prof);
		assert.ok(gap.userSekem < 620, `sekem ${gap.userSekem}`);
		assert.equal(gap.status, 'accepted');
		assert.equal(gap.admissionRoute, 'psychometric_only');
	});

	it('a program with only a catalog estimate for the floor keeps the sekem-based status', () => {
		// TAU CS has no official routes; the catalog's estimated floor must not block admission
		const program = programOf('inst-6', 'prog-tau-0368-22');
		assert.equal(program.admissionRoutes, undefined);
		const prof = profile(STRONG_BAGRUT, 590, 130);
		const res = calculateMultiInstitutionSekem(prof as any, ['tau'])[0];
		const gap = analyzeProgramGap(
			{ institutionId: 'inst-6', institutionName: '', calculatorId: 'tau', program: { ...program, minPsychometricFloor: 630 } },
			prof,
			res
		);
		assert.equal(gap.status, gap.gap >= 0 ? 'accepted' : gap.gap >= -20 ? 'borderline' : 'not_accepted');
		assert.equal(gap.admissionNote, undefined);
	});

	it('psychometric-only programs get only plans that reach the required psychometric score', () => {
		for (const psych of [0, 540]) {
			const prof = profile(WEAK_BAGRUT, psych);
			const res = calculateMultiInstitutionSekem(prof as any, ['bgu'])[0];
			const program = programOf('inst-3', 'prog-bgu-42');
			const gap = analyzeProgramGap({ institutionId: 'inst-3', institutionName: '', calculatorId: 'bgu', program }, prof, res);
			const tracks = generatePersonalizedTracks(gap, prof, res);
			assert.ok(tracks.length > 0, `psych ${psych}`);
			for (const t of tracks) {
				const isBagrutRoute = t.id.includes('direct');
				assert.ok(isBagrutRoute || (t.targetPsychometric ?? 0) >= 600, `${t.id} psych ${t.targetPsychometric}`);
			}
		}
	});

	it('the track simulator scores psychometric-only programs by the psychometric score', () => {
		const res = evaluateSimulatedSekem('bgu', 'psychometric', profile(WEAK_BAGRUT, 550), WEAK_BAGRUT as any, 612);
		assert.equal(res.sekem, 612);
	});
});
