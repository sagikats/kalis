/**
 * Official per-program subject requirements (AdmissionRoutes.requirements), pinned to the imported sources:
 *  - TAU CS (go.tau.ac.il "דרישות הסף של התוכנית"): math 5u 80+ | 4u 88+ | 5u 70+ & exam 75 | 4u 75+ & exam 75,
 *  - BGU (calculator snapshot psycho_info / bagrut_info), e.g. economics math 4u 75+ | 5u 65+.
 * An unmet requirement blocks admission on every route; tracks must meet it (or name the exam that does).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { analyzeProgramGap, UserAcademicProfile } from '../../../utils/analysis/gapAnalyzer';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import { generatePersonalizedTracks } from '../../../utils/analysis/trackGenerator';
import { evaluateRequirement, describeRequirement } from '../programRequirements';

const programOf = (instId: string, progId: string) =>
	(academicData as any[]).find((i) => i.id === instId).programs.find((p: any) => p.id === progId);

const BASE = [
	{ name: 'תנ"ך', units: 2, grade: 90 }, { name: 'ספרות עברית', units: 2, grade: 90 },
	{ name: 'אזרחות', units: 2, grade: 95 }, { name: 'היסטוריה / תע"י', units: 2, grade: 90 },
	{ name: 'הבעה עברית', units: 2, grade: 90 }, { name: 'אנגלית', units: 5, grade: 95 },
	{ name: 'פיזיקה', units: 5, grade: 95 }, { name: 'מדעי המחשב', units: 5, grade: 95 }
];

function profile(mathUnits: number, mathGrade: number, psych: number): UserAcademicProfile {
	return {
		bagrutSubjects: [...BASE, { name: 'מתמטיקה', units: mathUnits, grade: mathGrade }],
		psychometricGeneral: psych,
		mathUnits,
		mathGrade,
		physicsUnits: 5,
		physicsGrade: 95
	};
}

function analyzeTauCs(prof: UserAcademicProfile) {
	const program = programOf('inst-6', 'prog-tau-0368-22');
	const res = calculateMultiInstitutionSekem(prof as any, ['tau'])[0];
	const gap = analyzeProgramGap({ institutionId: 'inst-6', institutionName: 'אוניברסיטת תל אביב', calculatorId: 'tau', program }, prof, res);
	return { gap, res };
}

describe('Official program requirements', () => {
	it('TAU CS carries the official math requirement from its program page', () => {
		const reqs = programOf('inst-6', 'prog-tau-0368-22').admissionRoutes.requirements;
		assert.equal(reqs.length, 1);
		assert.equal(reqs[0].id, 'math');
		const text = describeRequirement(reqs[0]);
		assert.match(text, /מתמטיקה 5 יח״ל בציון 80\+/);
		assert.match(text, /מתמטיקה 4 יח״ל בציון 88\+/);
		assert.match(text, /בחינת סיווג במתמטיקה בציון 75\+/);
	});

	it('the evaluator distinguishes met, met-with-exam and unmet', () => {
		const [r] = programOf('inst-6', 'prog-tau-0368-22').admissionRoutes.requirements;
		const ev = (u: number, g: number) => evaluateRequirement(r, { subjects: [{ name: 'מתמטיקה', units: u, grade: g }] });
		assert.equal(ev(5, 85).met, true);
		assert.equal(ev(4, 90).met, true);
		assert.equal(ev(5, 75).met, false);
		assert.match(ev(5, 75).examOption?.exam ?? '', /בחינת סיווג/);
		assert.equal(ev(4, 70).met, false);
		assert.equal(ev(4, 70).examOption, undefined);
		assert.equal(ev(3, 100).met, false);
	});

	it('TAU CS: a passing sekem and psychometric are not enough with math 5u 75 (needs the classification exam)', () => {
		const { gap } = analyzeTauCs(profile(5, 75, 760));
		assert.ok(gap.gap >= 0, `sekem should pass the threshold (gap ${gap.gap})`);
		assert.equal(gap.status, 'not_accepted');
		assert.match(gap.admissionNote ?? '', /ידע במתמטיקה/);
		assert.equal(gap.improvementOptions[0].id, 'opt-req-math');
		assert.match(gap.improvementOptions[0].description, /בחינת סיווג במתמטיקה בציון 75\+/);
		const check = gap.prerequisites.find((c) => c.id === 'official-math');
		assert.ok(check && !check.isMet);
		assert.ok(!gap.prerequisites.some((c) => c.id === 'math'), 'the generic math estimate is replaced');
	});

	it('TAU CS: math 5u 85 meets the requirement and keeps the sekem status', () => {
		const { gap } = analyzeTauCs(profile(5, 85, 760));
		assert.equal(gap.status, 'accepted');
		assert.ok(gap.prerequisites.find((c) => c.id === 'official-math')?.isMet);
	});

	it('TAU CS tracks: with math 4u 70 every track upgrades math to meet the requirement (or names the exam)', () => {
		const prof = profile(4, 70, 700);
		const { gap, res } = analyzeTauCs(prof);
		const [r] = programOf('inst-6', 'prog-tau-0368-22').admissionRoutes.requirements;
		const tracks = generatePersonalizedTracks(gap, prof, res);
		assert.ok(tracks.length > 0, 'at least one track');
		for (const t of tracks) {
			const m = t.recommendedSubjectImprovements.find((s) => s.subjectName.includes('מתמטיקה'));
			assert.ok(m, `${t.id} must include a math upgrade`);
			const ev = evaluateRequirement(r, { subjects: [{ name: 'מתמטיקה', units: m!.targetUnits, grade: m!.targetGrade }] });
			const namesExam = t.steps.some((s) => s.title.includes('ידע במתמטיקה') && s.detail.includes('בחינת סיווג'));
			assert.ok(ev.met || (ev.examOption && namesExam), `${t.id} math target ${m!.targetUnits}u ${m!.targetGrade} must meet the requirement`);
		}
	});

	it('TAU CS tracks: with math 5u 75 a track without a math upgrade names the classification exam', () => {
		const prof = profile(5, 75, 700);
		const { gap, res } = analyzeTauCs(prof);
		const tracks = generatePersonalizedTracks(gap, prof, res);
		assert.ok(tracks.length > 0);
		for (const t of tracks) {
			const m = t.recommendedSubjectImprovements.find((s) => s.subjectName.includes('מתמטיקה'));
			if (m && m.targetGrade >= 80) continue;
			assert.ok(
				t.steps.some((s) => s.title.includes('ידע במתמטיקה') && s.detail.includes('בחינת סיווג')),
				`${t.id} must name the classification exam`
			);
		}
	});

	it('BGU: each route uses its own published list (psychometric route vs bagrut-only route)', () => {
		const p = programOf('inst-3', 'prog-bgu-42');
		assert.ok(p.admissionRoutes.requirements.length > 0);
		assert.ok(Array.isArray(p.admissionRoutes.bagrutOnlyRequirements));
		assert.match(p.admissionRoutes.requirementsSource, /bgu/);
	});
});
