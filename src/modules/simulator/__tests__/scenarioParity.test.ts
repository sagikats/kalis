/**
 * The simulator shows several degrees side by side, so every degree must be scored the same way the rest of the app
 * scores it — through its own institution's calculator — also after the user changes grades, units or the
 * psychometric score. These tests pin that the simulator's per-degree score equals the institution calculator's
 * score for the same simulated state, for every program of all 8 institutions.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import academicData from '../../../data/academicData.json';
import { calculateMultiInstitutionSekem } from '../../../utils/calculators/multiCalculator';
import { analyzeProgramGap, UserAcademicProfile } from '../../../utils/analysis/gapAnalyzer';
import type { TargetProgramSelection } from '../../../utils/analysis/gapAnalyzer';
import { evaluateScenario, scenarioFromProfile, ScenarioState } from '../evaluate';

const CALC_IDS: Record<string, string> = {
	'inst-48': 'technion', 'inst-6': 'tau', 'inst-1': 'huji', 'inst-3': 'bgu',
	'inst-5': 'haifa', 'inst-2': 'ariel', 'inst-4': 'bar_ilan', 'inst-38': 'reichman'
};

let seed = 29;
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

/** A random edit of the profile: psychometric change, grade and unit changes, maybe an added subject. */
function randomEdit(profile: UserAcademicProfile): ScenarioState {
	const base = scenarioFromProfile(profile);
	const subjects = base.subjects.map((s) => {
		if (rnd() < 0.4) return { ...s, grade: Math.min(100, s.grade + Math.floor(rnd() * 30)) };
		if (rnd() < 0.15 && s.units < 5) return { ...s, units: 5 };
		return s;
	});
	if (rnd() < 0.5) {
		subjects.push({ id: 'added-1', name: pick(['כימיה', 'מדעי המחשב', 'גאוגרפיה', 'ביולוגיה']), units: 5, grade: 70 + Math.floor(rnd() * 31), originalUnits: 0, originalGrade: 0, isAdded: true });
	}
	const psych = Math.max(200, Math.min(800, base.psychometric + Math.floor(rnd() * 160) - 40));
	return { psychometric: psych, subjects };
}

type Program = TargetProgramSelection['program'] & { notOffered?: boolean };
const catalog = academicData as unknown as { id: string; programs?: Program[] }[];
const programsOf = (instId: string) =>
	(catalog.find((i) => i.id === instId)?.programs ?? []).filter((p) => !p.notOffered && p.admissionThreshold);

function analysesFor(profile: UserAcademicProfile) {
	const results = calculateMultiInstitutionSekem(profile, Object.values(CALC_IDS));
	return Object.entries(CALC_IDS).flatMap(([instId, calculatorId]) => {
		const res = results.find((r) => r.institutionId === calculatorId)!;
		return programsOf(instId).map((program) =>
			analyzeProgramGap({ institutionId: instId, institutionName: '', calculatorId, program }, profile, res)
		);
	});
}

describe('Simulator scores each degree with its own institution calculator', () => {
	it('without edits, every degree shows the score of the admission report', () => {
		let compared = 0;
		for (let i = 0; i < 4; i++) {
			const profile = randomProfile(i % 2 === 0);
			const analyses = analysesFor(profile);
			const results = evaluateScenario(analyses, profile, scenarioFromProfile(profile));
			analyses.forEach((analysis, idx) => {
				if (analysis.admissionRoutes?.entranceExam) return;
				const r = results[idx];
				assert.ok(Math.abs(r.currentSekem - analysis.userSekem) <= 0.05,
					`${analysis.target.calculatorId} ${analysis.target.program.fieldOfStudy}: report ${analysis.userSekem} vs simulator ${r.currentSekem}`);
				assert.equal(r.targetSekem, analysis.threshold);
				compared++;
			});
		}
		assert.ok(compared > 2000);
	});

	it('after edits, the degree score equals the score the calculator gives the edited profile', () => {
		let compared = 0;
		for (let i = 0; i < 7; i++) {
			const profile = randomProfile(i % 2 === 0);
			// No psychometric yet: the simulator starts from 600
			if (i === 6) Object.assign(profile, { psychometricGeneral: 0, psychometricQuant: 0, psychometricVerbal: 0, psychometricEnglish: 0 });
			const analyses = analysesFor(profile);
			const scenario = randomEdit(profile);
			const results = evaluateScenario(analyses, profile, scenario);
			analyses.forEach((analysis, idx) => {
				if (analysis.admissionRoutes?.entranceExam) return;
				const r = results[idx];
				// The status of the edited state comes from the admission analysis; it must judge the same number
				assert.ok(r.analysis, 'simulated analysis');
				assert.ok(Math.abs(r.currentSekem - r.analysis!.userSekem) <= 0.05,
					`${analysis.target.calculatorId} ${analysis.target.program.fieldOfStudy} (${analysis.relevantSekemType}): sekem ${r.currentSekem} vs analysis ${r.analysis!.userSekem}`);
				compared++;
			});
		}
		assert.ok(compared > 3000);
	});

	it('Technion architecture / landscape: the entrance exam decides, not the regular sekem', () => {
		const profile = randomProfile(true);
		const analyses = analysesFor(profile).filter((a) => a.admissionRoutes?.entranceExam);
		assert.ok(analyses.length >= 2);
		for (const r of evaluateScenario(analyses, profile, scenarioFromProfile(profile))) {
			assert.ok(r.entranceExam, `${r.programId} has entrance-exam info`);
		}
	});
});
