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
		const { sekem: currentSekem, bagrutAverage } = evaluateSimulatedSekem(
			calculatorId,
			analysis.relevantSekemType,
			profile,
			sim.bagrutSubjects,
			psych,
			sim.mathUnits,
			sim.mathGrade,
			sim.physicsUnits,
			sim.physicsGrade
		);
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
