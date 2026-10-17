/**
 * Scenario simulator engine: scores an edited academic profile against several degrees at once.
 *
 * Every degree is scored by its own institution's calculator (calculateInstitution + selectProgramSekem, through
 * the track engine's evaluateSimulatedSekem), and its status comes from analyzeProgramGap — the same paths the
 * admission report and the recommended tracks use. Nothing here computes a score by itself.
 */
import type { SubjectInput } from '../calculators';
import { calculateMultiInstitutionSekem, InstitutionSekemResult } from '../../utils/calculators/multiCalculator';
import { simulateRealisticSubscores } from '../../utils/calculators/psychometricHelper';
import { analyzeProgramGap, ProgramGapAnalysis, UserAcademicProfile } from '../../utils/analysis/gapAnalyzer';
import { evaluateSimulatedSekem, RecommendedTrack } from '../../utils/analysis/trackGenerator';
import { isSameBagrutSubject, isSubjectMatch } from '../optimizer/solver';

export interface ScenarioSubject {
	id: string;
	name: string;
	units: number;
	grade: number;
	/** Units and grade in the user's profile (0 for a subject added in the simulator). */
	originalUnits: number;
	originalGrade: number;
	/** Added in the simulator, not part of the user's profile. */
	isAdded: boolean;
}

export interface ScenarioState {
	psychometric: number;
	subjects: ScenarioSubject[];
}

export interface ScenarioDegreeResult {
	programId: string;
	/** The degree's sekem for the simulated state, from its institution's calculator. */
	currentSekem: number;
	/** Bagrut average the degree's institution computes for the simulated state. */
	bagrutAverage: number;
	/** The degree's admission threshold; null when admission rests on official conditions alone. */
	targetSekem: number | null;
	/** Admission analysis of the simulated state (status, official routes and conditions). */
	analysis: ProgramGapAnalysis | null;
	/** Technion architecture / landscape: the entrance exam decides, the regular sekem doesn't apply. */
	entranceExam?: ProgramGapAnalysis['entranceExam'];
}

export const PSYCHOMETRIC_MIN = 200;
export const PSYCHOMETRIC_MAX = 800;
/** Psychometric the simulator starts from when the profile has none (as in the What-If simulator). */
export const DEFAULT_PSYCHOMETRIC = 600;

const MATH = 'מתמטיקה';
const PHYSICS = 'פיזיקה';

/** The simulator's starting state: the user's own subjects and psychometric score, unchanged. */
export function scenarioFromProfile(profile: UserAcademicProfile): ScenarioState {
	const subjects: ScenarioSubject[] = (profile.bagrutSubjects || []).map((s, idx) => ({
		id: `orig-${idx}-${s.name}`,
		name: s.name,
		units: s.units,
		grade: s.grade,
		originalUnits: s.units,
		originalGrade: s.grade,
		isAdded: false
	}));
	// Math kept only on the profile's math fields still gets its own card
	if (profile.mathUnits > 0 && !subjects.some((s) => isSameBagrutSubject(s.name, MATH))) {
		subjects.unshift({
			id: 'orig-math',
			name: MATH,
			units: profile.mathUnits,
			grade: profile.mathGrade,
			originalUnits: profile.mathUnits,
			originalGrade: profile.mathGrade,
			isAdded: false
		});
	}
	return {
		psychometric: profile.psychometricGeneral > 0 ? profile.psychometricGeneral : DEFAULT_PSYCHOMETRIC,
		subjects
	};
}

/** A recommended track's targets loaded into the simulator (the user's subjects, improved as the track proposes). */
export function scenarioFromTrack(
	profile: UserAcademicProfile,
	track: Pick<RecommendedTrack, 'targetPsychometric' | 'recommendedSubjectImprovements'>
): ScenarioState {
	const base = scenarioFromProfile(profile);
	const improvements = track.recommendedSubjectImprovements || [];
	const subjects = base.subjects.map((s) => {
		const imp = improvements.find((i) => isSameBagrutSubject(i.subjectName, s.name) || isSubjectMatch(i.subjectName, s.name));
		return imp ? { ...s, units: imp.targetUnits || s.units, grade: imp.targetGrade } : s;
	});
	improvements.forEach((imp, idx) => {
		const exists = base.subjects.some((s) => isSameBagrutSubject(imp.subjectName, s.name) || isSubjectMatch(imp.subjectName, s.name));
		if (!exists) {
			subjects.push({
				id: `track-${idx}-${imp.subjectName}`,
				name: imp.subjectName,
				units: imp.targetUnits || 5,
				grade: imp.targetGrade,
				originalUnits: 0,
				originalGrade: 0,
				isAdded: true
			});
		}
	});
	return {
		psychometric: track.targetPsychometric && track.targetPsychometric > 0 ? track.targetPsychometric : base.psychometric,
		subjects
	};
}

/** A subject the user changed (grade or units) or added in the simulator. */
export function isSubjectChanged(s: ScenarioSubject): boolean {
	return s.isAdded || s.grade !== s.originalGrade || s.units !== s.originalUnits;
}

/** The edited profile the calculators receive. */
export function scenarioProfile(profile: UserAcademicProfile, scenario: ScenarioState): UserAcademicProfile {
	const bagrutSubjects: SubjectInput[] = scenario.subjects.map((s) => ({ name: s.name, units: s.units, grade: s.grade }));
	const math = bagrutSubjects.find((s) => isSameBagrutSubject(s.name, MATH));
	const physics = bagrutSubjects.find((s) => isSubjectMatch(s.name, PHYSICS));
	return {
		...profile,
		bagrutSubjects,
		psychometricGeneral: scenario.psychometric,
		mathUnits: math?.units ?? profile.mathUnits,
		mathGrade: math?.grade ?? profile.mathGrade,
		physicsUnits: physics?.units ?? profile.physicsUnits,
		physicsGrade: physics?.grade ?? profile.physicsGrade
	};
}

/**
 * Scores the scenario for each degree. Results are in the order of `analyses` (the baseline analyses of the
 * degrees, from the admission report).
 */
export function evaluateScenario(
	analyses: ProgramGapAnalysis[],
	profile: UserAcademicProfile,
	scenario: ScenarioState
): ScenarioDegreeResult[] {
	if (analyses.length === 0) return [];
	const sim = scenarioProfile(profile, scenario);
	const psych = scenario.psychometric;

	// Section scores follow the general score the same way the track engine estimates them
	const currentGen = profile.psychometricGeneral > 0 ? profile.psychometricGeneral : psych;
	const sections = simulateRealisticSubscores(
		psych,
		currentGen,
		profile.psychometricQuant,
		profile.psychometricVerbal,
		profile.psychometricEnglish,
		profile.psychometricQuantEmphasis,
		profile.psychometricVerbalEmphasis
	);

	// One calculator run per institution, shared by all its degrees
	const calculatorIds = [...new Set(analyses.map((a) => a.target.calculatorId))];
	const institutionResults = new Map<string, InstitutionSekemResult>(
		calculateMultiInstitutionSekem(
			{
				bagrutSubjects: sim.bagrutSubjects,
				psychometricGeneral: psych,
				psychometricQuant: sections.quantSub,
				psychometricQuantEmphasis: sections.quantEmphasis,
				psychometricVerbal: sections.verbalSub,
				psychometricVerbalEmphasis: sections.verbalEmphasis,
				psychometricEnglish: sections.englishSub,
				mathUnits: sim.mathUnits,
				mathGrade: sim.mathGrade,
				physicsUnits: sim.physicsUnits,
				physicsGrade: sim.physicsGrade
			},
			calculatorIds
		).map((r) => [r.institutionId, r])
	);

	return analyses.map((analysis) => {
		const { calculatorId, program } = analysis.target;
		const { sekem: currentSekem, bagrutAverage } = degreeSekem(analysis, profile, sim);
		const institutionRes = institutionResults.get(calculatorId);
		const simulated = institutionRes ? analyzeProgramGap(analysis.target, sim, institutionRes) : null;
		return {
			programId: program.id,
			currentSekem,
			bagrutAverage,
			targetSekem: analysis.threshold,
			analysis: simulated,
			entranceExam: simulated?.entranceExam
		};
	});
}

/** A degree's sekem for an edited profile, from its institution's calculator. */
function degreeSekem(analysis: ProgramGapAnalysis, profile: UserAcademicProfile, sim: UserAcademicProfile) {
	return evaluateSimulatedSekem(
		analysis.target.calculatorId,
		analysis.relevantSekemType,
		profile,
		sim.bagrutSubjects,
		sim.psychometricGeneral,
		sim.mathUnits,
		sim.mathGrade,
		sim.physicsUnits,
		sim.physicsGrade
	);
}

export interface ScenarioImpacts {
	/** What the psychometric change adds to each degree's sekem (null when the psychometric is unchanged). */
	psychometric: (number | null)[] | null;
	/** Per changed or added subject (by id): what it adds to each degree's sekem. */
	subjects: Record<string, (number | null)[]>;
}

/**
 * What each change adds to each degree's sekem: the sekem with every change, minus the sekem with this one change
 * undone (an added subject removed, a changed one back to its original grade and units). Negative when the change
 * lowers the sekem. Null for a degree whose sekem the entrance exam decides (Technion architecture / landscape).
 */
export function evaluateImpacts(
	analyses: ProgramGapAnalysis[],
	profile: UserAcademicProfile,
	scenario: ScenarioState
): ScenarioImpacts {
	const applies = analyses.map((a) => !a.admissionRoutes?.entranceExam);
	const sekems = (state: ScenarioState) => {
		const sim = scenarioProfile(profile, state);
		return analyses.map((a, i) => (applies[i] ? degreeSekem(a, profile, sim).sekem : null));
	};
	const current = sekems(scenario);
	const deltas = (without: ScenarioState) =>
		sekems(without).map((v, i) => (v === null || current[i] === null ? null : Math.round((current[i]! - v) * 100) / 100));

	const startPsych = scenarioFromProfile(profile).psychometric;
	const psychometric = scenario.psychometric !== startPsych ? deltas({ ...scenario, psychometric: startPsych }) : null;

	const subjects: Record<string, (number | null)[]> = {};
	for (const s of scenario.subjects) {
		if (!isSubjectChanged(s)) continue;
		const undone = s.isAdded
			? scenario.subjects.filter((x) => x.id !== s.id)
			: scenario.subjects.map((x) => (x.id === s.id ? { ...x, grade: x.originalGrade, units: x.originalUnits } : x));
		subjects[s.id] = deltas({ ...scenario, subjects: undone });
	}
	return { psychometric, subjects };
}
