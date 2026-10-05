import type { SubjectInput } from '../../modules/calculators';
import type { SubjectBreakdownItem } from '../../modules/calculators/types';
import type { AcademicDegree, ProgramRequirement } from '../../types/academic';
import type {
	InstitutionSekemResult,
	UnifiedCalculationInput
} from '../calculators/multiCalculator';
import { calculateInstitution, selectProgramSekem } from '../../modules/calculators/index';
import type { ProgramGapAnalysis, UserAcademicProfile } from './gapAnalyzer';
import { screeningStageTitle } from './gapAnalyzer';
import { normalizeHebrewSubjectKey, isSubjectMatch } from '../../modules/optimizer/solver';
import { evaluateRequirement, requirementSubjects } from '../../modules/optimizer/programRequirements';
import { simulateRealisticSubscores } from '../calculators/psychometricHelper';
import {
	generateConcurrentSchedulePlan,
	getSubjectExamSession,
	WeeklySchedulePhase,
	StudyStream
} from '../../modules/optimizer/calendarScheduler';

export type { WeeklySchedulePhase, StudyStream };

export { normalizeHebrewSubjectKey, isSubjectMatch };

export type PsychSectionStrength = 'quant' | 'verbal' | 'english' | 'balanced';

export function formatPsychSectionsLabel(answers: UserPreferencesQuestionnaire): string {
	const sections = answers.psychStrongestSections && answers.psychStrongestSections.length > 0
		? answers.psychStrongestSections
		: answers.psychStrongestSection
		? answers.psychStrongestSection === 'verbal_eng'
			? ['verbal', 'english']
			: [answers.psychStrongestSection as PsychSectionStrength]
		: ['balanced'];

	if (sections.includes('balanced') || sections.length === 0) {
		return 'כלל חלקי הבחינה (כמותי, מילולי ואנגלית)';
	}

	const parts: string[] = [];
	if (sections.includes('quant')) parts.push('הפרק הכמותי');
	if (sections.includes('verbal')) parts.push('הפרק המילולי');
	if (sections.includes('english')) parts.push('פרק האנגלית');

	return parts.join(' ו');
}

export interface UserPreferencesQuestionnaire {
	// ציר פסיכומטרי
	psychExperience: 'never' | 'once' | 'multiple';
	psychWillingness?: 'full_exam' | 'prefer_bagrut_only';
	psychFeeling?: 'high_potential' | 'reached_ceiling';
	psychStrongestSection?: 'quant' | 'verbal' | 'english' | 'verbal_eng' | 'balanced';
	psychStrongestSections?: ('quant' | 'verbal' | 'english' | 'balanced')[];

	// ציר בגרויות
	learningOrientation: 'humanities' | 'stem' | 'flexible';

	// ציר תכונות ואילוצים
	learningStrength: 'memory_retention' | 'analytical_quick' | 'deep_accuracy_no_rush';
	weeklyAvailabilityHours: 'full_30_plus' | 'part_15_25' | 'limited_under_15';
	targetTimeline: 'immediate_october' | 'next_year_october' | 'flexible';
}

export interface TrackStep {
	title: string;
	detail: string;
	timing: string;
	type: 'psychometric' | 'bagrut_elective' | 'bagrut_core' | 'mechina' | 'administrative';
	isConcurrent?: boolean;
	streams?: StudyStream[];
}

export interface SubjectImprovement {
	subjectName: string;
	currentGrade: number;
	currentUnits: number;
	targetGrade: number;
	targetUnits: number;
	reason: string;
	session?: 'winter' | 'spring_psych' | 'summer';
	sessionLabel?: string;
}

export interface RecommendedTrack {
	id: string;
	title: string;
	badge: string;
	badgeColor: string;
	strategyDescription: string;
	targetSekem?: number;
	targetPsychometric?: number;
	currentPsychometric?: number;
	targetBagrutAverage?: number;
	currentBagrutAverage?: number;
	recommendedSubjectImprovements: SubjectImprovement[];
	estimatedWeeks: number;
	weeklyHours: number;
	feasibility: 'very_high' | 'high' | 'moderate' | 'challenging';
	feasibilityExplanation: string;
	steps: TrackStep[];
	keyAdvantage: string;
	schedulePhases?: WeeklySchedulePhase[];
	hasConcurrentStudy?: boolean;
}

/**
 * Strict universal limit: No track may EVER propose a psychometric jump of more than 100 points
 */
export const MAX_REALISTIC_PSYCHOMETRIC_JUMP = 100;

/**
 * Evaluates realistic jump boundaries based on academic baseline (NITE statistics & academic correlation)
 * Ensures no unrealistic targets (e.g. strictly caps any jump at <= 100 points).
 */
export function getRealisticPsychometricCeiling(
	currentPsych: number,
	bagrutAvg: number,
	answers: UserPreferencesQuestionnaire
): number {
	// Baseline estimation if user hasn't tested yet
	let baseline = currentPsych;
	if (baseline <= 0) {
		if (bagrutAvg >= 112) baseline = 650;
		else if (bagrutAvg >= 105) baseline = 600;
		else if (bagrutAvg >= 98) baseline = 550;
		else if (bagrutAvg >= 90) baseline = 500;
		else baseline = 450;
	}

	// Maximum statistically realistic jump in one preparation cycle (hard limit = 100 points)
	let maxAllowedJump = 70;
	if (answers.psychExperience === 'never') {
		maxAllowedJump = 95;
	} else if (answers.psychFeeling === 'high_potential') {
		maxAllowedJump = 80;
	} else if (answers.psychFeeling === 'reached_ceiling' || answers.psychExperience === 'multiple') {
		maxAllowedJump = 35;
	}

	// Hard limit: NEVER exceed baseline + 100 points
	const hardMaxFromBaseline = baseline + MAX_REALISTIC_PSYCHOMETRIC_JUMP;

	// Realistic ceiling correlated to Bagrut aptitude
	let correlatedHardCap = 800;
	if (bagrutAvg < 88) correlatedHardCap = 610;
	else if (bagrutAvg < 93) correlatedHardCap = 650;
	else if (bagrutAvg < 98) correlatedHardCap = 690;
	else if (bagrutAvg < 103) correlatedHardCap = 720;
	else if (bagrutAvg < 108) correlatedHardCap = 745;
	else if (bagrutAvg < 112) correlatedHardCap = 765;

	let ceilingAptitudeCap = correlatedHardCap;
	if (answers.learningStrength === 'analytical_quick') {
		ceilingAptitudeCap += 30;
	}
	if (answers.learningOrientation === 'stem') {
		ceilingAptitudeCap += 20;
	}

	let effectiveAptitudeCap = ceilingAptitudeCap;
	if (currentPsych > 0) {
		effectiveAptitudeCap = Math.max(effectiveAptitudeCap, currentPsych + maxAllowedJump);
	}

	if (currentPsych <= 0 || answers.psychExperience === 'never') {
		return Math.min(750, Math.max(ceilingAptitudeCap, 720));
	}

	return Math.min(800, Math.min(hardMaxFromBaseline, Math.min(effectiveAptitudeCap, baseline + maxAllowedJump)));
}

/**
 * Accurately determines statistical feasibility based on psychometric jump and exam count
 */
export function getFeasibilityEvaluation(
	psychDelta: number,
	numSubjects: number
): {
	feasibility: 'very_high' | 'high' | 'moderate' | 'challenging';
	explanation: string;
} {
	// Only a description of the effort — there is no data behind success probabilities, so none is given
	const exams = numSubjects > 0 ? ` ו-${numSubjects} בחינות בגרות` : '';
	const effort = psychDelta > 0 ? `שיפור של ${psychDelta} נקודות בפסיכומטרי${exams}.` : numSubjects > 0 ? `${numSubjects} בחינות בגרות, בלי שינוי בפסיכומטרי.` : 'בלי שינוי בציונים.';
	const feasibility = psychDelta <= 30 && numSubjects <= 2 ? 'very_high' : psychDelta <= 60 && numSubjects <= 3 ? 'high' : psychDelta <= 85 ? 'moderate' : 'challenging';
	return { feasibility, explanation: effort };
}

/**
 * Evaluates Sekem and optimal Bagrut average for a simulated profile state
 */
export function evaluateSimulatedSekem(
	calculatorId: string,
	relevantSekemType: string,
	baseProfile: UserAcademicProfile,
	simulatedSubjects: SubjectInput[],
	simulatedPsych: number,
	simulatedMathUnits?: number,
	simulatedMathGrade?: number,
	simulatedPhysUnits?: number,
	simulatedPhysGrade?: number
): { sekem: number; bagrutAverage: number; directBagrutEligible: boolean; droppedSubjects: string[]; subjectBreakdown?: SubjectBreakdownItem[]; bagrutCap?: number } {
	const mathU = simulatedMathUnits ?? baseProfile.mathUnits ?? 4;
	const mathG = simulatedMathGrade ?? baseProfile.mathGrade ?? 80;

	const updatedSubjects = simulatedSubjects.map((s) => {
		if (s.name.includes('מתמטיקה')) {
			return { ...s, units: mathU, grade: mathG };
		}
		return s;
	});

	const physSub = updatedSubjects.find((s) => isSubjectMatch(s.name, 'פיזיקה'));
	const physUnits = (simulatedPhysUnits !== undefined && simulatedPhysUnits > 0)
		? simulatedPhysUnits
		: (physSub ? physSub.units : (baseProfile.physicsUnits || 0));
	const physGrade = (simulatedPhysGrade !== undefined && simulatedPhysGrade > 0)
		? simulatedPhysGrade
		: (physSub ? physSub.grade : (baseProfile.physicsGrade || 0));

	// Official NITE realistic scaling: respects headroom and 50-150 subscore constraints
	const currentGen = baseProfile.psychometricGeneral && baseProfile.psychometricGeneral > 0 ? baseProfile.psychometricGeneral : simulatedPsych;
	const simScores = simulateRealisticSubscores(
		simulatedPsych,
		currentGen,
		baseProfile.psychometricQuant,
		baseProfile.psychometricVerbal,
		baseProfile.psychometricEnglish,
		baseProfile.psychometricQuantEmphasis,
		baseProfile.psychometricVerbalEmphasis
	);

	// Call the dedicated institutional calculator directly (8x faster, isolated, official):
	const instRes = calculateInstitution(calculatorId, {
		bagrutSubjects: updatedSubjects,
		psychometricGeneral: simulatedPsych,
		psychometricQuant: simScores.quantSub,
		psychometricQuantEmphasis: simScores.quantEmphasis,
		psychometricVerbal: simScores.verbalSub,
		psychometricVerbalEmphasis: simScores.verbalEmphasis,
		psychometricEnglish: simScores.englishSub,
		mathUnits: mathU,
		mathGrade: mathG,
		physicsUnits: physUnits,
		physicsGrade: physGrade
	});

	const sekem = selectProgramSekem(instRes, relevantSekemType, calculatorId);

	return {
		sekem,
		bagrutAverage: instRes.bagrutAverage,
		directBagrutEligible: instRes.directBagrutEligible,
		droppedSubjects: instRes.droppedSubjects ?? [],
		subjectBreakdown: instRes.subjectBreakdown,
		bagrutCap: instRes.bagrutCap
	};
}

export function isValidSubjectCombo(combo: SubjectUpgradeAction[]): boolean {
	const subjectKeys = combo.map((l) => normalizeHebrewSubjectKey(l.subjectName));
	return new Set(subjectKeys).size === combo.length;
}

export function comboHasDroppedSubject(combo: SubjectUpgradeAction[], droppedSubjects?: string[]): boolean {
	if (!droppedSubjects || droppedSubjects.length === 0) return false;
	return combo.some((lever) =>
		droppedSubjects.some((d) => isSubjectMatch(d, lever.subjectName))
	);
}

/**
 * Solves for the exact minimum psychometric score needed to reach the threshold
 * using binary search against the university's official calculator
 */
export function findExactPsychometricTarget(
	calculatorId: string,
	relevantSekemType: string,
	threshold: number,
	baseProfile: UserAcademicProfile,
	simulatedSubjects: SubjectInput[],
	minPsych: number = 200,
	maxPsych: number = 800,
	mathUnits?: number,
	mathGrade?: number,
	physUnits?: number,
	physGrade?: number
): number | null {
	const hasTakenPsych = (baseProfile.psychometricGeneral || 0) > 0;
	const currentPsych = hasTakenPsych ? (baseProfile.psychometricGeneral || 0) : 200;
	// Hard safety floor: a candidate who already has a psychometric score NEVER aims for a lower score!
	const effectiveMin = hasTakenPsych ? Math.max(currentPsych, minPsych) : Math.max(200, minPsych);

	let low = effectiveMin;
	let high = Math.min(800, maxPsych);
	let bestMatch: number | null = null;

	const maxRes = evaluateSimulatedSekem(calculatorId, relevantSekemType, baseProfile, simulatedSubjects, high, mathUnits, mathGrade, physUnits, physGrade);
	if (maxRes.sekem < threshold) {
		return null; // Cannot reach threshold under maxPsych
	}

	const minRes = evaluateSimulatedSekem(calculatorId, relevantSekemType, baseProfile, simulatedSubjects, low, mathUnits, mathGrade, physUnits, physGrade);
	if (minRes.sekem >= threshold) {
		return low;
	}

	while (low <= high) {
		const mid = Math.round((low + high) / 2);
		const res = evaluateSimulatedSekem(calculatorId, relevantSekemType, baseProfile, simulatedSubjects, mid, mathUnits, mathGrade, physUnits, physGrade);
		if (res.sekem >= threshold) {
			bestMatch = mid;
			high = mid - 1; // Try finding a lower score
		} else {
			low = mid + 1;
		}
	}

	if (bestMatch === null) return null;
	const target = Math.max(effectiveMin, bestMatch);

	// Institutional Sensitivity Verification Gate:
	// For Technion, verify that psychometric delta conforms to official slope (0.075 * deltaP)
	if (calculatorId === 'technion' && hasTakenPsych) {
		const sekemGap = threshold - minRes.sekem;
		const deltaP = target - currentPsych;
		if (sekemGap > 0.4 && deltaP < (sekemGap - 0.15) / 0.075) {
			return null;
		}
	}

	return target;
}

interface SubjectUpgradeAction {
	id: string;
	subjectName: string;
	currentGrade: number;
	currentUnits: number;
	targetGrade: number;
	targetUnits: number;
	reason: string;
	priority: number;
	isMath?: boolean;
	isPhysics?: boolean;
}

/**
 * Calculates a comprehensive personalized utility score for each potential upgrade lever.
 * Combines:
 * 1. Base academic Sekem leverage & institutional bonus impact
 * 2. Cognitive style & learning strengths (memory vs analytical vs deep precision)
 * 3. Weekly availability constraints (prevents overload when hours are tight)
 * 4. Target timeline urgency
 */
export function calculateLeverUtilityScore(
	lever: SubjectUpgradeAction,
	answers: UserPreferencesQuestionnaire,
	isStemDegree: boolean,
	gapAbs?: number
): number {
	// 1. Base Score by lever type & academic impact
	let baseScore = 50;
	if (lever.isMath) {
		if (isStemDegree) {
			baseScore = 110;
		} else {
			// For non-STEM (Psychology, Law, Humanities, Social Sciences), Math 5u is heavy and usually unnecessary friction
			baseScore = (lever.currentUnits >= 4 && lever.currentGrade >= 75) ? 30 : 55;
		}
	} else if (lever.isPhysics) {
		baseScore = isStemDegree ? 95 : 30;
	} else if (
		lever.targetUnits === 5 &&
		(lever.subjectName.includes('היסטוריה') || lever.subjectName.includes('תנ') || lever.subjectName.includes('ספרות'))
	) {
		// High-yield expansion from existing 2 units (only 3 units completion exam required! ~60h)
		baseScore = isStemDegree ? 102 : 108;
	} else if (lever.targetUnits === 5) {
		// 5-unit electives from scratch (150h+ prep from zero)
		if (lever.subjectName.includes('גיאוגרפיה')) {
			baseScore = isStemDegree ? 78 : 85;
		} else if (lever.subjectName.includes('מחשב')) {
			// CS from scratch has high friction (180h) - demote unless strong analytical
			baseScore = isStemDegree && answers.learningOrientation === 'stem' ? 65 : 40;
		} else {
			baseScore = isStemDegree ? 72 : 65;
		}
	} else if (lever.subjectName.includes('אנגלית')) {
		baseScore = 70;
	} else {
		// Core mandatory 2 units (תנ"ך, אזרחות, ספרות, היסטוריה, הבעה)
		if (lever.subjectName.includes('הבעה') || lever.subjectName.includes('לשון')) {
			// Severe friction and grading variance in Hebrew expression
			baseScore = lever.currentGrade < 65 ? 50 : 32; // Demoted unless failing!
		} else if (lever.subjectName.includes('תנ') || lever.subjectName.includes('ספרות')) {
			baseScore = !isStemDegree ? 95 : 75; // Predictable structured memorization
		} else if (lever.subjectName.includes('אזרחות')) {
			baseScore = !isStemDegree ? 92 : 72; // Formulaic
		} else {
			baseScore = !isStemDegree ? 92 : 60;
		}
	}

	// Gap-sensitive Quick-Win adjustment:
	// For micro-gaps (<= 15 points on standard scale or <= 1.5 on Technion),
	// lightweight 2-unit core subjects that can close the gap with minimal effort receive a massive Quick-Win boost,
	// while intensive 5-unit subjects from scratch are penalized to avoid using a sledgehammer for a tiny gap.
	if (gapAbs !== undefined && gapAbs <= 15) {
		if (lever.targetUnits === 2 && lever.currentGrade < 88) {
			baseScore += 50; // Huge boost for 2-unit Quick-Wins on small gaps!
		} else if (lever.targetUnits === 5 && lever.currentUnits < 5) {
			baseScore *= 0.70; // Penalize heavy 5-unit subjects from scratch for tiny gaps
		}
	}

	// 2. Learning Strength & Cognitive Affinity
	if (answers.learningStrength === 'memory_retention') {
		// Thrives on structured texts, essays, summaries, memorization
		if (
			lever.subjectName.includes('גיאוגרפיה') ||
			['תנ"ך', 'תנך', 'ספרות', 'היסטוריה', 'אזרחות', 'הבעה'].some((c) => lever.subjectName.includes(c))
		) {
			baseScore *= 1.45;
		} else if (lever.isMath || lever.isPhysics) {
			baseScore *= 0.7; // Heavy abstract formula friction
		}
	} else if (answers.learningStrength === 'analytical_quick') {
		// Thrives on problem-solving, algorithms, quantitative models
		if (lever.isMath || lever.isPhysics || lever.subjectName.includes('מחשב')) {
			baseScore *= 1.45;
		} else if (['היסטוריה', 'ספרות', 'תנ"ך'].some((c) => lever.subjectName.includes(c))) {
			baseScore *= 0.8;
		}
	} else if (answers.learningStrength === 'deep_accuracy_no_rush') {
		// Thrives on systematic, high-accuracy modular prep
		if (lever.subjectName.includes('אנגלית') || lever.subjectName.includes('גיאוגרפיה') || lever.targetUnits === 2) {
			baseScore *= 1.25;
		}
	}

	// 3. Learning Orientation (Humanities vs STEM vs Flexible)
	if (answers.learningOrientation === 'humanities') {
		if (lever.subjectName.includes('גיאוגרפיה') || (!lever.isMath && !lever.isPhysics)) {
			baseScore *= 1.3;
		} else {
			baseScore *= 0.8;
		}
	} else if (answers.learningOrientation === 'stem') {
		if (lever.isMath || lever.isPhysics || lever.subjectName.includes('מחשב')) {
			baseScore *= 1.35;
		}
	}

	// 4. Weekly Availability Constraints (Feasibility Guard)
	if (answers.weeklyAvailabilityHours === 'limited_under_15') {
		// Under 15 hrs/week: High penalty on intensive 5-unit subjects (Math 5u requires 18-20 hrs/week)
		if (lever.isMath || lever.isPhysics) {
			baseScore *= 0.6; // High dropout / overload risk
		} else if (lever.targetUnits === 2) {
			baseScore *= 1.4; // Very manageable within limited hours
		} else if (lever.subjectName.includes('גיאוגרפיה')) {
			baseScore *= 1.25; // Structured modular elective
		}
	} else if (answers.weeklyAvailabilityHours === 'full_30_plus') {
		// Full availability: Leverage maximum impact subjects
		if (lever.isMath || lever.isPhysics || lever.targetUnits === 5) {
			baseScore *= 1.3;
		}
	}

	// 5. Target Timeline Urgency
	if (answers.targetTimeline === 'immediate_october') {
		// Immediate: prioritize single-session, faster-prep subjects
		if (lever.targetUnits === 2) {
			baseScore *= 1.25;
		} else if (lever.isMath && lever.currentUnits < 5) {
			baseScore *= 0.85; // 0 to 5 units in 3 months is tight
		}
	}

	return Math.round(baseScore * 10) / 10;
}

/**
 * Generates prioritized upgrade candidates (levers) for a student profile
 * Ranked dynamically by the Personal Utility Scoring Engine
 */
export function getAvailableSubjectLevers(
	userProfile: UserAcademicProfile,
	isStemDegree: boolean,
	answers: UserPreferencesQuestionnaire,
	gapAbs?: number
): SubjectUpgradeAction[] {
	const levers: SubjectUpgradeAction[] = [];

	// Math 5 units
	const currentMathU = userProfile.mathUnits || 4;
	const currentMathG = userProfile.mathGrade || 80;
	if (currentMathU < 5) {
		const mathReason = 'שדרוג ל-5 יח״ל: מתמטיקה מקבלת את הבונוס הגבוה ביותר ברוב המוסדות (גובה הבונוס משתנה ממוסד למוסד).';
		levers.push({
			id: 'math_5u',
			subjectName: 'מתמטיקה',
			currentGrade: currentMathG,
			currentUnits: currentMathU,
			targetGrade: 90,
			targetUnits: 5,
			reason: mathReason,
			priority: 1,
			isMath: true
		});
	} else if (currentMathG < 85) {
		levers.push({
			id: 'math_5u_boost',
			subjectName: 'מתמטיקה',
			currentGrade: currentMathG,
			currentUnits: 5,
			targetGrade: Math.min(98, Math.max(94, currentMathG + 6)),
			targetUnits: 5,
			reason: 'שיפור ציון ב-5 יח״ל מתמטיקה מקפיץ את ציון ההתאמה ההנדסי ישירות.',
			priority: 1,
			isMath: true
		});
	}

	// High-Yield 5-Unit Expansion Levers (History, Tanach, Literature from existing 2 units)
	const histSub = (userProfile.bagrutSubjects || []).find(
		(s) => isSubjectMatch(s.name || (s as any).subjectName || '', 'היסטוריה') && s.units >= 2
	);
	if (histSub && histSub.units < 5) {
		levers.push({
			id: 'history_5u_expansion',
			subjectName: histSub.name || 'היסטוריה',
			currentGrade: histSub.grade,
			currentUnits: histSub.units,
			targetGrade: 92,
			targetUnits: 5,
			reason: 'הרחבה מ-2 ל-5 יח״ל: מקצוע מוגבר מקבל בונוס בחישוב הממוצע של המוסד.',
			priority: 2
		});
	}

	const tanachSub = (userProfile.bagrutSubjects || []).find(
		(s) => isSubjectMatch(s.name || (s as any).subjectName || '', 'תנך') && s.units >= 2
	);
	if (tanachSub && tanachSub.units < 5) {
		levers.push({
			id: 'tanach_5u_expansion',
			subjectName: tanachSub.name || 'תנ״ך',
			currentGrade: tanachSub.grade,
			currentUnits: tanachSub.units,
			targetGrade: 92,
			targetUnits: 5,
			reason: 'הרחבה ל-5 יח״ל: מקצוע מוגבר מקבל בונוס בחישוב הממוצע של המוסד.',
			priority: 2
		});
	}

	const litSub = (userProfile.bagrutSubjects || []).find(
		(s) => isSubjectMatch(s.name || (s as any).subjectName || '', 'ספרות') && s.units >= 2
	);
	if (litSub && litSub.units < 5) {
		levers.push({
			id: 'literature_5u_expansion',
			subjectName: litSub.name || 'ספרות',
			currentGrade: litSub.grade,
			currentUnits: litSub.units,
			targetGrade: 92,
			targetUnits: 5,
			reason: 'הרחבה ל-5 יח״ל בספרות: מקצוע מוגבר מקבל בונוס בחישוב הממוצע של המוסד.',
			priority: 2
		});
	}

	// High-Yield 5-Unit Elective (Geography or Computer Science)
	const hasGeo = (userProfile.bagrutSubjects || []).some((s) => isSubjectMatch(s.name || (s as any).subjectName || '', 'גיאוגרפיה'));
	if (!hasGeo) {
		const geoReason = 'מקצוע בחירה מוגבר (5 יח״ל) מקבל בונוס בחישוב הממוצע של המוסד.';
		levers.push({
			id: 'elective_geo_5u',
			subjectName: 'גיאוגרפיה',
			currentGrade: 0,
			currentUnits: 0,
			targetGrade: 92,
			targetUnits: 5,
			reason: geoReason,
			priority: 3
		});
	}

	const hasCS = (userProfile.bagrutSubjects || []).some((s) => isSubjectMatch(s.name || (s as any).subjectName || '', 'מחשב'));
	if (
		!hasCS &&
		isStemDegree &&
		(answers.learningOrientation === 'stem' || answers.learningStrength === 'analytical_quick')
	) {
		levers.push({
			id: 'elective_cs_5u',
			subjectName: 'מדעי המחשב',
			currentGrade: 0,
			currentUnits: 0,
			targetGrade: 92,
			targetUnits: 5,
			reason: 'מקצוע מוגבר הדורש פרויקט תכנות ולמידה מאפס. מקבל בונוס בחישוב הממוצע של המוסד.',
			priority: 3
		});
	}

	// Physics 5 units (for STEM)
	if (isStemDegree || answers.learningOrientation === 'stem') {
		const currentPhysU = userProfile.physicsUnits || 0;
		const currentPhysG = userProfile.physicsGrade || 0;
		if (currentPhysU < 5) {
			levers.push({
				id: 'physics_5u',
				subjectName: 'פיזיקה',
				currentGrade: currentPhysG,
				currentUnits: currentPhysU || 0,
				targetGrade: 88,
				targetUnits: 5,
				reason: 'פיזיקה 5 יח״ל: מקצוע מדעי מוגבר שמקבל בונוס בחישוב הממוצע של המוסד.',
				priority: 2,
				isPhysics: true
			});
		} else if (currentPhysG < 95) {
			levers.push({
				id: 'physics_5u_boost',
				subjectName: 'פיזיקה',
				currentGrade: currentPhysG,
				currentUnits: 5,
				targetGrade: Math.min(98, Math.max(94, currentPhysG + 6)),
				targetUnits: 5,
				reason: 'העלאת ציון בפיזיקה 5 יח״ל מחזקת את מקדם הסכם הריאלי.',
				priority: 2,
				isPhysics: true
			});
		}
	}

	// Weakest / improvable Mandatory Core Subjects (Bible, Literature, History, Civics, Hebrew)
	// Sorted by Predictable Ease ROI to avoid the "Lowest-Grade Trap" (e.g. Hebrew vs Bible)
	const coreNames = ['תנ"ך', 'תנך', 'ספרות', 'היסטוריה', 'אזרחות', 'הבעה', 'לשון'];
	const weakCores = userProfile.bagrutSubjects
		.filter((s) => coreNames.some((c) => isSubjectMatch(s.name, c)) && s.grade < 92 && s.grade > 0)
		.sort((a, b) => {
			const getScore = (sub: typeof a) => {
				const isHebrew = isSubjectMatch(sub.name, 'הבעה') || isSubjectMatch(sub.name, 'לשון');
				const isBible = isSubjectMatch(sub.name, 'תנ');
				const isLit = isSubjectMatch(sub.name, 'ספרות');
				const isCivics = isSubjectMatch(sub.name, 'אזרחות');

				const delta = Math.min(96, Math.max(92, sub.grade + 10)) - sub.grade;
				let friction = 1.0;
				if (isHebrew) friction = 2.03; // 1.45 * 1.40
				else if (isBible) friction = 0.85;
				else if (isLit) friction = 0.95;
				else if (isCivics) friction = 1.0;

				// Severe penalty for Hebrew unless failing (< 68) due to subjective grading & essay variance
				if (isHebrew && sub.grade >= 68) return delta / (friction * 2.5);
				return delta / friction;
			};
			return getScore(b) - getScore(a);
		});

	weakCores.forEach((sub, idx) => {
		const targetGrade = Math.min(96, Math.max(92, sub.grade + 10));
		const reason = answers.weeklyAvailabilityHours === 'limited_under_15'
			? `מאמץ ממוקד של 6–8 ש״ש בלבד (${sub.units} יח״ל), מותאם במיוחד למגבלת הזמן שלך.`
			: `העלאת ציון במקצוע חובה קל (${sub.name}) ל-${targetGrade} מקפיצה את הממוצע האופטימלי במאמץ קל.`;
		levers.push({
			id: `core_${idx + 1}`,
			subjectName: sub.name,
			currentGrade: sub.grade,
			currentUnits: sub.units,
			targetGrade,
			targetUnits: sub.units,
			reason,
			priority: isStemDegree ? 3 + idx : 1 + idx
		});
	});

	// English 5 Units
	const englishSub = userProfile.bagrutSubjects.find((s) => isSubjectMatch(s.name, 'אנגלית'));
	if (englishSub && englishSub.units < 5) {
		levers.push({
			id: 'english_5u',
			subjectName: 'אנגלית',
			currentGrade: englishSub.grade,
			currentUnits: englishSub.units,
			targetGrade: 88,
			targetUnits: 5,
			reason: 'שדרוג ל-5 יח״ל: מקצוע מוגבר מקבל בונוס בחישוב הממוצע של המוסד.',
			priority: 4
		});
	}

	// Sort dynamically using the personalized Utility Scoring Engine!
	return levers.sort((a, b) => {
		const scoreA = calculateLeverUtilityScore(a, answers, isStemDegree, gapAbs);
		const scoreB = calculateLeverUtilityScore(b, answers, isStemDegree, gapAbs);
		return scoreB - scoreA;
	});
}

export function getCombinations<T>(arr: T[], k: number): T[][] {
	if (k <= 0) return [[]];
	if (k === 1) return arr.map((x) => [x]);
	if (k > arr.length) return [];
	const results: T[][] = [];
	for (let i = 0; i <= arr.length - k; i++) {
		const head = arr[i];
		const tails = getCombinations(arr.slice(i + 1), k - 1);
		for (const tail of tails) {
			results.push([head, ...tail]);
		}
	}
	return results;
}

/**
 * Applies a subset of upgrade actions to produce simulated subjects and math/phys state
 */
export function applyLeversToSubjects(
	baseSubjects: SubjectInput[],
	baseMathU: number,
	baseMathG: number,
	basePhysU: number,
	basePhysG: number,
	selectedLevers: SubjectUpgradeAction[]
): {
	subjects: SubjectInput[];
	mathUnits: number;
	mathGrade: number;
	physUnits: number;
	physGrade: number;
} {
	let mathU = baseMathU;
	let mathG = baseMathG;
	let physU = basePhysU;
	let physG = basePhysG;

	let updated = [...baseSubjects];

	for (const lever of selectedLevers) {
		const isMath = !!lever.isMath || isSubjectMatch(lever.subjectName, 'מתמטיקה');
		const isPhysics = !!lever.isPhysics || isSubjectMatch(lever.subjectName, 'פיזיקה');
		if (isMath) {
			mathU = lever.targetUnits;
			mathG = lever.targetGrade;
			updated = updated.map((s) => (isSubjectMatch(s.name, 'מתמטיקה') ? { ...s, units: mathU, grade: mathG } : s));
		} else if (isPhysics) {
			physU = lever.targetUnits;
			physG = lever.targetGrade;
			const pIdx = updated.findIndex((s) => isSubjectMatch(s.name, 'פיזיקה'));
			if (pIdx >= 0) {
				updated[pIdx] = { ...updated[pIdx], units: physU, grade: physG };
			} else {
				updated.push({ name: 'פיזיקה', units: physU, grade: physG });
			}
		} else {
			const existingIdx = updated.findIndex((s) => isSubjectMatch(s.name, lever.subjectName));
			if (existingIdx >= 0) {
				updated[existingIdx] = {
					...updated[existingIdx],
					grade: lever.targetGrade,
					units: lever.targetUnits
				};
			} else {
				updated.push({
					name: lever.subjectName.replace(/\s*\(.*?\)/, '').trim(),
					grade: lever.targetGrade,
					units: lever.targetUnits
				});
			}
		}
	}

	return { subjects: updated, mathUnits: mathU, mathGrade: mathG, physUnits: physU, physGrade: physG };
}

/**
 * Calibrates the target grade of a single lever down to the minimal integer grade
 * that still satisfies the admission threshold (within tolerance).
 */
export function calibrateMinimalLeverGrade(
	calculatorId: string,
	relevantSekemType: any,
	userProfile: UserAcademicProfile,
	baseMathU: number,
	baseMathG: number,
	basePhysU: number,
	basePhysG: number,
	lever: SubjectUpgradeAction,
	targetPsych: number,
	threshold: number
): SubjectUpgradeAction {
	const minG = lever.currentGrade > 0 ? lever.currentGrade + 1 : 65;
	const maxG = lever.targetGrade;
	let bestG = maxG;

	// Check if even maxG reaches threshold
	const simMax = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, [{ ...lever, targetGrade: maxG }]);
	const resMax = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, simMax.subjects, targetPsych, simMax.mathUnits, simMax.mathGrade, simMax.physUnits, simMax.physGrade);
	if (resMax.sekem < threshold - 0.05) {
		return lever;
	}

	let low = minG;
	let high = maxG;
	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const simMid = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, [{ ...lever, targetGrade: mid }]);
		const resMid = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, simMid.subjects, targetPsych, simMid.mathUnits, simMid.mathGrade, simMid.physUnits, simMid.physGrade);
		if (resMid.sekem >= threshold - 0.05) {
			bestG = mid;
			high = mid - 1;
		} else {
			low = mid + 1;
		}
	}

	return { ...lever, targetGrade: bestG };
}

/**
 * Calibrates the target grades of a combination of levers down towards their minimal necessary
 * values so that the resulting Sekem stays closely calibrated to the threshold (avoiding massive overshoot).
 */
export function calibrateComboGrades(
	calculatorId: string,
	relevantSekemType: any,
	userProfile: UserAcademicProfile,
	baseMathU: number,
	baseMathG: number,
	basePhysU: number,
	basePhysG: number,
	combo: SubjectUpgradeAction[],
	targetPsych: number,
	threshold: number
): { levers: SubjectUpgradeAction[]; res: { sekem: number; bagrutAverage: number; droppedSubjects?: string[] } } {
	let calibrated = combo.map((c) => ({ ...c }));

	for (let i = calibrated.length - 1; i >= 0; i--) {
		const lever = calibrated[i];
		const minG = lever.currentGrade > 0 ? lever.currentGrade + 1 : 65;
		let low = minG;
		let high = lever.targetGrade;
		let bestG = lever.targetGrade;

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			const testCombo = calibrated.map((c, idx) => (idx === i ? { ...c, targetGrade: mid } : c));
			const sim = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, testCombo);
			const res = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, sim.subjects, targetPsych, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade);
			if (res.sekem >= threshold - 0.05) {
				bestG = mid;
				high = mid - 1;
			} else {
				low = mid + 1;
			}
		}
		calibrated[i].targetGrade = bestG;
	}

	const finalSim = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, calibrated);
	const finalRes = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, finalSim.subjects, targetPsych, finalSim.mathUnits, finalSim.mathGrade, finalSim.physUnits, finalSim.physGrade);

	return { levers: calibrated, res: finalRes };
}

export function isDegreeEligibleForDirectBagrut(degreeName: string, calculatorId: string): boolean {
	const lower = (degreeName || '').toLowerCase();
	const strictlyMandatesPsych = [
		'מדעי המחשב',
		'הנדסת תוכנה',
		'הנדסת מחשבים',
		'רפואה',
		'רפואת שיניים',
		'וטרינריה',
		'הנדסת חשמל',
		'הנדסת מכונות',
		'הנדסה אזרחית',
		'הנדסת ביוטכנולוגיה',
		'הנדסה כימית',
		'הנדסת תעשייה',
		'הנדסת מערכות תקשורת',
		'הנדסת חומרים',
		'הנדסה ביורפואית',
		'הנדסה',
		'מדעי המוח',
		'נוירוביולוגיה',
		'פסיכולוגיה',
		'בינה מלאכותית',
		'מדעי הנתונים',
		'משפטים'
	];
	if (strictlyMandatesPsych.some((d) => lower.includes(d))) {
		return false;
	}
	if (calculatorId === 'technion') {
		return false;
	}
	return true;
}

export interface DegreeHardRequirements {
	minPsychometricFloor: number;
	minPsychometricQuant?: number;
	requiresPhysics: boolean;
	minMathUnits: number;
	minMathGrade: number;
	directBagrutEligible: boolean;
	directBagrutMinAverage?: number;
	/** Official minimum bagrut average on the sekem route (on top of the threshold). */
	minBagrutAverage?: number;
	directBagrutMath5Min?: number;
	directBagrutMath4Min?: number;
	/** Official program requirements (math, physics, …) — replace the generic math/physics gate when present. */
	officialRequirements?: ProgramRequirement[];
	/** Official requirements of the bagrut-only route, when they differ. */
	bagrutOnlyRequirements?: ProgramRequirement[];
	/** The program page was checked (requirementsSource): the generic math/physics gate no longer applies. */
	subjectRequirementsOfficial?: boolean;
}

/**
 * Checks a track's final bagrut against the official program requirements. A requirement the bagrut can't meet blocks
 * the track; one met only with an institutional exam (or a psychometric section score) becomes an explicit step.
 */
export function gateOfficialRequirements(
	requirements: ProgramRequirement[] | undefined,
	subjects: SubjectInput[],
	mathU: number,
	mathG: number,
	physU: number,
	physG: number,
	userProfile: UserAcademicProfile
): { blocked: boolean; steps: TrackStep[] } {
	const steps: TrackStep[] = [];
	const ctxSubjects = requirementSubjects(subjects, { units: mathU, grade: mathG }, { units: physU, grade: physG });
	const ctx = {
		subjects: ctxSubjects,
		psychQuant: userProfile.psychometricQuant,
		psychVerbal: userProfile.psychometricVerbal,
		psychEnglish: userProfile.psychometricEnglish
	};
	for (const r of requirements ?? []) {
		const res = evaluateRequirement(r, ctx);
		if (res.met) continue;
		if (res.unknown) {
			// e.g. an English level when no English score was entered: part of the psychometric preparation
			const need = r.anyOf.find((o) => !o.exam && o.psych?.length)?.psych ?? [];
			const labels = { quant: 'חשיבה כמותית', verbal: 'חשיבה מילולית', english: 'אנגלית' } as const;
			steps.push({
				title: `תנאי סף רשמי: ${r.title}`,
				detail: `התוכנית דורשת בפסיכומטרי ${need.map((x) => `${labels[x.section]} ${x.min}+`).join(' ו')}${r.otherOptions ? ` (או: ${r.otherOptions})` : ''}.`,
				timing: 'במועד הפסיכומטרי',
				type: 'psychometric'
			});
			continue;
		}
		if (res.examOption?.exam) {
			steps.push({
				title: `תנאי סף רשמי: ${r.title}`,
				detail: `התוכנית דורשת ${r.title}. עם הבגרות במסלול הזה עומדים בתנאי בכפוף ל${res.examOption.exam}.`,
				timing: 'לפני פתיחת שנת הלימודים',
				type: 'administrative'
			});
			continue;
		}
		// A psychometric section minimum is part of the psychometric preparation, not a reason to drop the track
		const psychOnly = r.anyOf.find(
			(o) => o.psych?.length && !o.exam && evaluateRequirement({ ...r, anyOf: [{ ...o, psych: undefined }] }, { subjects: ctxSubjects }).met
		);
		if (psychOnly) {
			const labels = { quant: 'חשיבה כמותית', verbal: 'חשיבה מילולית', english: 'אנגלית' } as const;
			steps.push({
				title: `תנאי סף רשמי: ${r.title}`,
				detail: `בנוסף לציון הכללי, התוכנית דורשת בפסיכומטרי ${psychOnly.psych!.map((x) => `${labels[x.section]} ${x.min}+`).join(' ו')}.`,
				timing: 'במועד הפסיכומטרי',
				type: 'psychometric'
			});
			continue;
		}
		return { blocked: true, steps: [] };
	}
	return { blocked: false, steps };
}

export function extractDegreeHardRequirements(
	program: AcademicDegree | undefined,
	calculatorId: string
): DegreeHardRequirements {
	const progName = (program?.fieldOfStudy || program?.description || '').toLowerCase();

	let parsedPrereq: any = {};
	if (program?.prerequisitesJson) {
		try {
			parsedPrereq = JSON.parse(program.prerequisitesJson);
		} catch (e) {
			parsedPrereq = {};
		}
	}
	if ((program as any)?.prerequisites) {
		parsedPrereq = { ...parsedPrereq, ...(program as any).prerequisites };
	}

	const isMedicine = progName.includes('רפואה') || progName.includes('רפואת שיניים');
	const isCS = progName.includes('מדעי המחשב') || progName.includes('הנדסת תוכנה') || progName.includes('סייבר') || progName.includes('בינה מלאכותית');
	const isEngineering = progName.includes('הנדס');
	const isExactScience = isCS || isEngineering || progName.includes('מתמטיקה') || progName.includes('פיזיקה') || progName.includes('כימיה');

	// Degree-specific psychometric floor
	// An official minimum psychometric (e.g. TAU "דרישות הסף") always wins over catalog estimates
	const officialRoutes = (program as any)?.admissionRoutes ?? parsedPrereq.admissionRoutes;
	const officialPsychMin = officialRoutes?.minPsychometric;
	// The program's admission conditions were taken from an official source: never fall back to name-based estimates
	const hasOfficialData = Boolean(officialRoutes?.requirementsSource || (program as any)?.thresholdSource);
	// With official data, the catalog's minPsychometricFloor is a name-based estimate from the seed — ignore it
	let minPsychFloor = officialPsychMin || (hasOfficialData ? 200 : (parsedPrereq.minPsychometricFloor ?? program?.minPsychometricFloor));
	if (!minPsychFloor || minPsychFloor <= 0) {
		if (isMedicine) minPsychFloor = 700;
		else if (isCS) minPsychFloor = 600;
		else if (isEngineering) minPsychFloor = 560;
		else if (isExactScience) minPsychFloor = 550;
		else minPsychFloor = 500;
	}

	// Physics prerequisite
	let requiresPhysics = parsedPrereq.requiresPhysics ?? (program as any)?.requiresPhysics;
	if (requiresPhysics === undefined) {
		requiresPhysics = isEngineering || (calculatorId === 'technion' && isExactScience);
	}

	// Direct Bagrut
	const requiresPsychometric = program?.requiresPsychometric ?? (
		parsedPrereq.mustHavePsychometric ?? (calculatorId === 'technion' || isMedicine || isCS)
	);

	let directBagrutEligible = program?.directBagrutEligible ?? parsedPrereq.directBagrutEligible;
	if (directBagrutEligible === undefined) {
		directBagrutEligible = !requiresPsychometric && isDegreeEligibleForDirectBagrut(progName, calculatorId);
	}
	if (requiresPsychometric) {
		directBagrutEligible = false;
	}

	let directBagrutMinAverage = program?.directBagrutMinAverage ?? parsedPrereq.directBagrutMinAverage;
	if (!directBagrutMinAverage && directBagrutEligible) {
		directBagrutMinAverage = (calculatorId === 'biu' || calculatorId === 'bar_ilan') ? 100.0 : 102.0;
	}
	// Official data: a bagrut-only route exists exactly when the institution publishes one (admissionRoutes.bagrutOnlyMin),
	// even for programs flagged requiresPsychometric (that flag describes the main sekem route).
	if (hasOfficialData) {
		directBagrutEligible = Boolean(officialRoutes?.bagrutOnlyMin);
		directBagrutMinAverage = officialRoutes?.bagrutOnlyMin;
	}

	return {
		minPsychometricFloor: minPsychFloor,
		minPsychometricQuant: parsedPrereq.minPsychometricQuant ?? (isExactScience && !hasOfficialData ? 115 : undefined),
		requiresPhysics: Boolean(requiresPhysics),
		minMathUnits: parsedPrereq.minMathUnits ?? (isExactScience ? 4 : 3),
		minMathGrade: parsedPrereq.minMathGrade ?? (isExactScience ? 75 : 60),
		directBagrutEligible: Boolean(directBagrutEligible),
		directBagrutMinAverage: directBagrutMinAverage ?? undefined,
		// Generic math estimates for the bagrut-only route — official programs use bagrutOnlyRequirements/requirements instead
		directBagrutMath5Min: parsedPrereq.directBagrutMath5Min ?? (isExactScience && !hasOfficialData ? 80 : undefined),
		directBagrutMath4Min: parsedPrereq.directBagrutMath4Min ?? (isExactScience && !hasOfficialData ? 90 : undefined),
		minBagrutAverage: officialRoutes?.minBagrutAverage,
		officialRequirements: officialRoutes?.requirements,
		bagrutOnlyRequirements: officialRoutes?.bagrutOnlyRequirements,
		subjectRequirementsOfficial: Boolean(officialRoutes?.requirementsSource)
	};
}

export const DEFAULT_USER_PREFERENCES: UserPreferencesQuestionnaire = {
	psychExperience: 'once',
	psychFeeling: 'high_potential',
	psychStrongestSection: 'balanced',
	psychStrongestSections: ['balanced'],
	learningOrientation: 'flexible',
	learningStrength: 'analytical_quick',
	weeklyAvailabilityHours: 'part_15_25',
	targetTimeline: 'immediate_october'
};

/**
 * Main Closed-Loop Generator producing 3 mathematically guaranteed tailored admission tracks
 */
export function generatePersonalizedTracks(
	gapAnalysis: ProgramGapAnalysis,
	userProfile: UserAcademicProfile,
	institutionRes: InstitutionSekemResult
): RecommendedTrack[] {
	// A screened program (medicine) without a published threshold: there is no score target to plan towards
	if (gapAnalysis.threshold === null && gapAnalysis.admissionRoutes?.screening) return [];
	const tracks = markScreeningTracks(
		gapAnalysis,
		markRequirementOnlyTracks(gapAnalysis, userProfile, generateAllPersonalizedTracks(gapAnalysis, userProfile, institutionRes))
	);
	if (gapAnalysis.relevantSekemType !== 'psychometric' || gapAnalysis.threshold === null) return tracks;

	// Psychometric-only programs: bagrut upgrades can't move the score, so only two plans make sense —
	// reach the required psychometric, or (when the institution publishes one) the bagrut-only average.
	const threshold = gapAnalysis.threshold;
	const bagrutOnlyMin = gapAnalysis.admissionRoutes?.bagrutOnlyMin;
	const current = userProfile.psychometricGeneral || 0;
	const useful = tracks.filter((t) => {
		const isBagrutRoute = t.id.includes('direct');
		if (isBagrutRoute) return bagrutOnlyMin !== undefined && (t.targetBagrutAverage ?? 0) >= bagrutOnlyMin;
		return (t.targetPsychometric ?? current) >= threshold && t.recommendedSubjectImprovements.length === 0;
	});
	if (useful.length > 0) return useful;
	const reachesScore = tracks.filter((t) => (t.targetPsychometric ?? 0) >= threshold);
	return reachesScore.length > 0 ? reachesScore : tracks;
}

/**
 * The sekem already passes and only an official condition is missing (e.g. English 120): a plan that keeps the scores
 * as they are is not a "psychometric leap" — it is about meeting that condition.
 */
function markRequirementOnlyTracks(
	gapAnalysis: ProgramGapAnalysis,
	userProfile: UserAcademicProfile,
	tracks: RecommendedTrack[]
): RecommendedTrack[] {
	if (gapAnalysis.status !== 'missing_requirement' || gapAnalysis.threshold === null || gapAnalysis.userSekem < gapAnalysis.threshold) return tracks;
	const missing = gapAnalysis.improvementOptions
		.filter((o) => o.id.startsWith('opt-req-'))
		.map((o) => o.title.replace(/^עמידה בתנאי הסף:\s*/, ''));
	if (missing.length === 0) return tracks;
	const current = userProfile.psychometricGeneral || 0;
	const list = missing.join(', ');
	return tracks.map((t) => {
		if (t.recommendedSubjectImprovements.length > 0 || (t.targetPsychometric ?? current) > current) return t;
		const requirementSteps = t.steps.filter((s) => s.title.startsWith('תנאי סף רשמי'));
		return {
			...t,
			title: `השלמת תנאי סף: ${list}`,
			badge: 'הסכם כבר עובר',
			strategyDescription: `הסכם שלך (${gapAnalysis.userSekem}) כבר עובר את הסף (${gapAnalysis.threshold}). חסר רק תנאי הסף הרשמי: ${list}.`,
			keyAdvantage: 'אין צורך לשפר את הסכם — רק לעמוד בתנאי הסף הרשמי.',
			estimatedWeeks: Math.max(t.estimatedWeeks, 8),
			steps: [
				{
					title: 'הכנה ממוקדת לתנאי הסף',
					detail: `תרגול ממוקד לעמידה בתנאי: ${list}.`,
					timing: 'שבועות 1–8',
					type: 'psychometric'
				},
				...requirementSteps
			]
		};
	});
}

/**
 * Medicine-style programs: reaching the threshold only invites to the screening stage (MOR / interviews), so a plan
 * never promises admission — its wording says so, and it ends with the screening step.
 */
function markScreeningTracks(gapAnalysis: ProgramGapAnalysis, tracks: RecommendedTrack[]): RecommendedTrack[] {
	const screening = gapAnalysis.admissionRoutes?.screening;
	if (!screening) return tracks;
	const reword = (text: string) =>
		text
			.replace(/קבלה מובטחת/g, `מעבר ל${screeningStageTitle(screening.stage)}`)
			.replace(/קבלה מיידית/g, `מעבר מיידי ל${screeningStageTitle(screening.stage)}`)
			.replace(/סף הקבלה/g, 'סף הזימון למיונים');
	return tracks.map((t) => ({
		...t,
		title: reword(t.title),
		badge: reword(t.badge),
		strategyDescription: reword(t.strategyDescription),
		keyAdvantage: t.keyAdvantage ? reword(t.keyAdvantage) : t.keyAdvantage,
		steps: [
			...t.steps.map((st) => ({ ...st, title: reword(st.title), detail: reword(st.detail) })),
			{
				title: screeningStageTitle(screening.stage),
				detail: `עמידה בסף מזמנת לשלב המיונים — זו עדיין לא קבלה. ${screening.note}`,
				timing: 'אחרי סגירת ההרשמה',
				type: 'administrative' as any
			}
		]
	}));
}

function generateAllPersonalizedTracks(
	gapAnalysis: ProgramGapAnalysis,
	userProfile: UserAcademicProfile,
	institutionRes: InstitutionSekemResult
): RecommendedTrack[] {
	// The questionnaire is not part of the algorithm: every applicant gets the same fixed rules
	const answers: UserPreferencesQuestionnaire = DEFAULT_USER_PREFERENCES;

	// HARD GUARD: If user has not entered valid Bagrut grades (no subjects, total units < 20, or bagrut average <= 0)
	// NEVER invent fake tracks!
	const validSubjects = (userProfile.bagrutSubjects || []).filter((s) => (Number(s.grade) || 0) > 0);
	const totalUnits = validSubjects.reduce((acc, s) => acc + (s.units || 0), 0);
	if (validSubjects.length === 0 || totalUnits < 20 || !institutionRes || institutionRes.bagrutAverage <= 0) {
		return [];
	}

	const hasTakenPsych = (userProfile.psychometricGeneral || 0) > 0;
	const currentPsych = hasTakenPsych ? userProfile.psychometricGeneral : 0;
	const currentBagrut = institutionRes.bagrutAverage;
	const baselinePsych = hasTakenPsych
		? currentPsych
		: currentBagrut >= 112 ? 650 : currentBagrut >= 105 ? 600 : currentBagrut >= 98 ? 560 : currentBagrut >= 90 ? 510 : 460;
	const threshold = gapAnalysis.threshold || (gapAnalysis.userSekem + Math.max(0, Math.abs(gapAnalysis.gap)));
	const calculatorId = gapAnalysis.target.calculatorId;
	const relevantSekemType = gapAnalysis.relevantSekemType;
	const baselineSekem = !hasTakenPsych
		? evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, userProfile.bagrutSubjects, baselinePsych).sekem
		: gapAnalysis.userSekem;
	const effectiveGap = Math.max(0, threshold - baselineSekem);
	const isTechnion = calculatorId === 'technion';
	const isStemDegree =
		relevantSekemType === 'quantitative' ||
		relevantSekemType === 'engineering' ||
		relevantSekemType === 'technion' ||
		gapAnalysis.target.program.fieldOfStudy.includes('הנדס') ||
		gapAnalysis.target.program.fieldOfStudy.includes('מחשב') ||
		gapAnalysis.target.program.fieldOfStudy.includes('מדעים מדויקים') ||
		gapAnalysis.target.program.fieldOfStudy.includes('פיזיקה') ||
		gapAnalysis.target.program.fieldOfStudy.includes('מתמטיקה') ||
		gapAnalysis.target.program.fieldOfStudy.includes('כימיה');

	// Degree-specific hard prerequisites gate
	const hardReqs = extractDegreeHardRequirements(gapAnalysis.target.program, calculatorId);
	const degreePsychFloor = hardReqs.minPsychometricFloor;

	const gapAbs = isTechnion ? Math.abs(gapAnalysis.gap) : effectiveGap;
	const availableLevers = getAvailableSubjectLevers(userProfile, isStemDegree, answers, gapAbs);
	const tracks: RecommendedTrack[] = [];

	const availableWeeklyHours =
		answers.weeklyAvailabilityHours === 'full_30_plus'
			? 32
			: answers.weeklyAvailabilityHours === 'part_15_25'
			? 20
			: 12;

	// Base math and physics
	const baseMathU = userProfile.mathUnits || 4;
	const baseMathG = userProfile.mathGrade || 80;
	const basePhysU = userProfile.physicsUnits || 0;
	const basePhysG = userProfile.physicsGrade || 0;

	// =========================================================================
	// TRACK PLANNER (docs/TRACKS_REDESIGN.md)
	// Step 0: unmet official bagrut conditions are raised to the required level — every track starts from there.
	// Track 1: psychometric only (tested applicants: when ≤100 points are needed; otherwise psychometric + 1 bagrut).
	// Track 2: + bagrut exams that lower the psychometric target by ≥10 points.
	// Track 3: up to 5–6 bagrut exams, another ≥10 points (untested applicants: down to the official minimum when possible).
	// Bagrut exams are ranked only by how much they lower the required psychometric in the institution's calculator.
	// =========================================================================
	type PlanLever = SubjectUpgradeAction & { floorGrade?: number; required?: boolean };
	interface Plan {
		levers: PlanLever[];
		psych: number;
	}
	const MIN_RELIEF = 10;
	const PREFER_FEWER_WITHIN = 5;
	const MAX_TOTAL_EXAMS = 6;
	const officialPsychMin = gapAnalysis.admissionRoutes?.minPsychometric;
	const psychFloor = Math.max(degreePsychFloor || 200, 200);
	const subjectKey = (l: { subjectName: string }) => normalizeHebrewSubjectKey(l.subjectName);

	// One exam per subject: a pool lever on a subject already in the plan replaces it when it asks for more
	const mergeLevers = (levers: PlanLever[]): PlanLever[] => {
		const out: PlanLever[] = [];
		for (const l of levers) {
			const i = out.findIndex((o) => subjectKey(o) === subjectKey(l));
			if (i < 0) out.push({ ...l });
			else {
				const o = out[i];
				out[i] = {
					...o,
					...(l.targetUnits > o.targetUnits || (l.targetUnits === o.targetUnits && l.targetGrade > o.targetGrade) ? l : {}),
					floorGrade: Math.max(o.floorGrade ?? 0, l.floorGrade ?? 0) || undefined,
					required: o.required || l.required,
					reason:
						o.required && !l.required && (l.targetUnits > o.targetUnits || l.targetGrade > o.targetGrade)
							? `${o.reason} היעד גבוה מהנדרש, כי הוא גם מוריד את הפסיכומטרי הנדרש.`
							: o.required
							? o.reason
							: l.reason
				};
			}
		}
		return out;
	};

	const simulate = (levers: PlanLever[]) =>
		applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, levers);

	/** Minimal psychometric that reaches the threshold with these exams, or null (unreachable / a lever that doesn't count). */
	const solvePsych = (levers: PlanLever[]): number | null => {
		const sim = simulate(levers);
		const p = findExactPsychometricTarget(calculatorId, relevantSekemType, threshold, userProfile, sim.subjects, psychFloor, 800, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade);
		if (p === null) return null;
		const res = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, sim.subjects, p, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade);
		if (comboHasDroppedSubject(levers.filter((l) => !l.required), res.droppedSubjects)) return null;
		if (hardReqs.minBagrutAverage && res.bagrutAverage < hardReqs.minBagrutAverage) return null;
		return p;
	};

	// ---- Step 0: official bagrut conditions ----
	const baseCtxSubjects = requirementSubjects(userProfile.bagrutSubjects, { units: baseMathU, grade: baseMathG }, { units: basePhysU, grade: basePhysG });
	const reqCtx = {
		subjects: baseCtxSubjects,
		psychQuant: userProfile.psychometricQuant,
		psychVerbal: userProfile.psychometricVerbal,
		psychEnglish: userProfile.psychometricEnglish
	};
	/** The exams that turn one bagrut option of a requirement into a met condition. */
	const leversForOption = (option: ProgramRequirement['anyOf'][number], note: string): PlanLever[] => {
		const levers: PlanLever[] = [];
		for (const cond of option.bagrut ?? []) {
			const owned = cond.subjects
				.map((name) => ({ name, sub: userProfile.bagrutSubjects.find((s) => isSubjectMatch(s.name, name)) }))
				.sort((a, b) => (b.sub?.units ?? 0) - (a.sub?.units ?? 0) || (b.sub?.grade ?? 0) - (a.sub?.grade ?? 0));
			const needed = (cond as any).count ?? 1;
			const okAlready = owned.filter((o) => o.sub && o.sub.units >= cond.minUnits && o.sub.grade >= (cond.minGrade ?? 0));
			for (const o of owned.filter((x) => !okAlready.includes(x)).slice(0, Math.max(0, needed - okAlready.length))) {
				const isMath = isSubjectMatch(o.name, 'מתמטיקה');
				const isPhys = isSubjectMatch(o.name, 'פיזיקה');
				const curUnits = isMath ? baseMathU : isPhys ? basePhysU : o.sub?.units ?? 0;
				const curGrade = isMath ? baseMathG : isPhys ? basePhysG : o.sub?.grade ?? 0;
				const minGrade = cond.minGrade ?? 0;
				levers.push({
					id: `req_${normalizeHebrewSubjectKey(o.name)}`,
					subjectName: o.sub?.name ?? o.name,
					currentGrade: curGrade,
					currentUnits: curUnits,
					targetUnits: Math.max(cond.minUnits, curUnits),
					targetGrade: Math.max(minGrade, 90),
					floorGrade: minGrade,
					reason: note,
					priority: 0,
					isMath,
					isPhysics: isPhys,
					required: true
				});
			}
		}
		return levers;
	};

	let requiredLevers: PlanLever[] = [];
	for (const r of hardReqs.officialRequirements ?? []) {
		const res = evaluateRequirement(r, reqCtx);
		if (res.met || res.unknown) continue;
		// The bagrut part is raised here; a psychometric section in the same option becomes a target inside the exam
		const bagrutOptions = r.anyOf.filter((o) => !o.exam && o.bagrut?.length);
		if (bagrutOptions.length === 0) continue;
		// Step 0 meets the condition with the bagrut, also when a course / exam alternative exists (it saves that course)
		const note = res.examOption?.exam
			? `תנאי סף רשמי (${r.title}). הבגרות חוסכת את החלופה: ${res.examOption.exam}.`
			: `תנאי סף רשמי של התוכנית: ${r.title}.`;
		let best: { levers: PlanLever[]; p: number } | null = null;
		for (const option of bagrutOptions) {
			const levers = leversForOption(option, note);
			const p = solvePsych(mergeLevers([...requiredLevers, ...levers])) ?? Infinity;
			if (!best || p < best.p || (p === best.p && levers.length < best.levers.length)) best = { levers, p };
		}
		if (best) requiredLevers = mergeLevers([...requiredLevers, ...best.levers]);
	}

	// Pool: every possible bagrut improvement (sciences included), minus subjects already raised in step 0 unless it asks for more
	const pool: PlanLever[] = [
		...availableLevers,
		...(availableLevers.some((l) => l.isPhysics) || basePhysU >= 5
			? []
			: [{ id: 'physics_5u', subjectName: 'פיזיקה', currentGrade: basePhysG, currentUnits: basePhysU, targetGrade: 88, targetUnits: 5, reason: 'פיזיקה 5 יח״ל: מקצוע מדעי מוגבר שמקבל בונוס בחישוב הממוצע של המוסד.', priority: 3, isPhysics: true }]),
		...(availableLevers.some((l) => l.id === 'elective_cs_5u') || userProfile.bagrutSubjects.some((s) => isSubjectMatch(s.name, 'מחשב'))
			? []
			: [{ id: 'elective_cs_5u', subjectName: 'מדעי המחשב', currentGrade: 0, currentUnits: 0, targetGrade: 92, targetUnits: 5, reason: 'מקצוע מוגבר הדורש פרויקט תכנות ולמידה מאפס. מקבל בונוס בחישוב הממוצע של המוסד.', priority: 3 }])
	].filter((l) => {
		const req = requiredLevers.find((r) => subjectKey(r) === subjectKey(l));
		return !req || l.targetUnits > req.targetUnits || (l.targetUnits === req.targetUnits && l.targetGrade > req.targetGrade);
	});

	const examCount = (levers: PlanLever[]) => mergeLevers(levers).length;
	const evaluate = (levers: PlanLever[]): Plan | null => {
		const merged = mergeLevers(levers);
		const p = solvePsych(merged);
		return p === null ? null : { levers: merged, psych: p };
	};
	/** Best plan adding exactly `k` pool exams to `base` (lowest psychometric, then fewest exams). */
	const bestWith = (base: PlanLever[], k: number): Plan | null => {
		const free = pool.filter((l) => !base.some((b) => subjectKey(b) === subjectKey(l) && !b.required));
		let best: Plan | null = null;
		for (const combo of getCombinations(free, k)) {
			if (!isValidSubjectCombo(combo)) continue;
			const plan = evaluate([...base, ...combo]);
			if (plan && (!best || plan.psych < best.psych || (plan.psych === best.psych && examCount(plan.levers) < examCount(best.levers)))) best = plan;
		}
		return best;
	};
	/** Among plans with more exams, the fewest exams whose relief is within PREFER_FEWER_WITHIN of the best one. */
	const preferFewer = (candidates: Plan[], mustBeBelow: number): Plan | null => {
		const ok = candidates.filter((c) => c.psych <= mustBeBelow);
		if (ok.length === 0) return null;
		const bestPsych = Math.min(...ok.map((c) => c.psych));
		return ok
			.filter((c) => c.psych <= bestPsych + PREFER_FEWER_WITHIN)
			.sort((a, b) => examCount(a.levers) - examCount(b.levers) || a.psych - b.psych)[0];
	};
	/** Greedy: keep adding the exam that lowers the psychometric most, up to `maxExams`; every size is a candidate. */
	const greedyUpTo = (base: PlanLever[], maxExams: number): Plan[] => {
		const out: Plan[] = [];
		let current = mergeLevers(base);
		let currentPsychTarget = solvePsych(current) ?? Infinity;
		for (let guard = 0; guard < 10 && examCount(current) <= maxExams; guard++) {
			const step = bestWith(current, 1);
			if (!step || step.psych >= currentPsychTarget || examCount(step.levers) > maxExams) break;
			out.push(step);
			current = step.levers;
			currentPsychTarget = step.psych;
		}
		return out;
	};

	// ---- Track 1 ----
	const startPsych = hasTakenPsych ? Math.max(currentPsych, psychFloor) : psychFloor;
	const psychOnly = evaluate(requiredLevers);
	let plan1: Plan | null = null;
	let plan1HasBagrut = false;
	if (psychOnly && (!hasTakenPsych || psychOnly.psych - currentPsych <= MAX_REALISTIC_PSYCHOMETRIC_JUMP)) {
		plan1 = psychOnly;
	} else {
		const withOne = bestWith(requiredLevers, 1);
		plan1 = withOne ?? psychOnly;
		plan1HasBagrut = Boolean(withOne);
	}
	// Nothing to do (already at the threshold with the scores in hand): no plan
	// (with a missing official condition the plan is kept: it becomes "השלמת תנאי סף")
	if (plan1 && hasTakenPsych && plan1.psych <= currentPsych && plan1.levers.length === 0 && gapAnalysis.status !== 'missing_requirement') plan1 = null;

	// ---- Track 2 ----
	let plan2: Plan | null = null;
	if (plan1 && plan1.psych - MIN_RELIEF >= startPsych) {
		plan2 = preferFewer([bestWith(plan1.levers, 1), bestWith(plan1.levers, 2)].filter((p): p is Plan => Boolean(p)), plan1.psych - MIN_RELIEF);
	} else if (!plan1) {
		// Not reachable with the psychometric and one bagrut: the plans with more bagrut exams still are
		plan2 = preferFewer([bestWith(requiredLevers, 2)].filter((p): p is Plan => Boolean(p)), 800);
	}

	// ---- Track 3 ----
	let plan3: Plan | null = null;
	const prev = plan2 ?? plan1;
	if (prev && prev.psych - MIN_RELIEF >= startPsych) {
		const candidates = greedyUpTo(prev.levers, MAX_TOTAL_EXAMS).filter((c) => c.psych <= prev.psych - MIN_RELIEF);
		if (!hasTakenPsych && officialPsychMin && plan1 && plan1.psych <= 720) {
			// Untested, moderate target: aim for the program's official minimum psychometric with the fewest exams
			plan3 = candidates.filter((c) => c.psych <= officialPsychMin).sort((a, b) => examCount(a.levers) - examCount(b.levers))[0] ?? null;
		}
		plan3 = plan3 ?? preferFewer(candidates, prev.psych - MIN_RELIEF);
	} else if (!prev) {
		plan3 = preferFewer(greedyUpTo(requiredLevers, MAX_TOTAL_EXAMS), 800);
	}

	/** The plan's grades lowered to the minimum that still reaches the threshold at its psychometric (official floors kept). */
	const calibrate = (plan: Plan): { levers: PlanLever[]; res: ReturnType<typeof evaluateSimulatedSekem> } => {
		const levers = plan.levers.map((l) => ({ ...l }));
		for (let i = levers.length - 1; i >= 0; i--) {
			const l = levers[i];
			const unitsUp = l.targetUnits > l.currentUnits;
			let low = Math.max(l.floorGrade ?? 0, unitsUp || l.currentGrade <= 0 ? 56 : l.currentGrade + 1);
			let high = l.targetGrade;
			let bestG = high;
			while (low <= high) {
				const mid = Math.floor((low + high) / 2);
				const test = levers.map((x, j) => (j === i ? { ...x, targetGrade: mid } : x));
				const sim = simulate(test);
				const res = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, sim.subjects, plan.psych, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade);
				const avgOk = !hardReqs.minBagrutAverage || res.bagrutAverage >= hardReqs.minBagrutAverage;
				if (res.sekem >= threshold - 0.05 && avgOk) {
					bestG = mid;
					high = mid - 1;
				} else low = mid + 1;
			}
			levers[i].targetGrade = bestG;
		}
		const sim = simulate(levers);
		return { levers, res: evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, sim.subjects, plan.psych, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade) };
	};

	const describeLevers = (levers: PlanLever[]) =>
		levers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל, ציון ${l.targetGrade})`).join(' + ');
	const pushTrack = (id: string, title: string, badge: string, badgeColor: string, plan: Plan, keyAdvantage: string, relief?: number) => {
		const { levers, res } = calibrate(plan);
		const optional = levers.filter((l) => !l.required);
		const required = levers.filter((l) => l.required);
		const psychDelta = Math.max(0, plan.psych - (hasTakenPsych ? currentPsych : 0));
		const evalRes = getFeasibilityEvaluation(hasTakenPsych ? psychDelta : 0, levers.length);
		const psychText = hasTakenPsych
			? plan.psych > currentPsych
				? `פסיכומטרי ${plan.psych} (+${plan.psych - currentPsych})`
				: `הפסיכומטרי הקיים (${currentPsych})`
			: `פסיכומטרי ${plan.psych}`;
		const parts = [
			required.length ? `עמידה בתנאי הסף: ${describeLevers(required)}` : '',
			optional.length ? `שיפור ${describeLevers(optional)}` : '',
			psychText
		].filter(Boolean);
		tracks.push({
			id,
			title,
			badge,
			badgeColor,
			strategyDescription: `${parts.join(', ')}. סכם מחושב: ${res.sekem.toFixed(isTechnion ? 2 : 1)} מול סף ${threshold}.${relief ? ` יעד הפסיכומטרי נמוך ב-${relief} נקודות מהמסלול הקודם.` : ''}`,
			targetSekem: res.sekem,
			targetPsychometric: plan.psych,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			targetBagrutAverage: Math.max(currentBagrut, res.bagrutAverage),
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: levers.map((l) => ({
				subjectName: l.subjectName,
				currentGrade: l.currentGrade,
				currentUnits: l.currentUnits,
				targetGrade: l.targetGrade,
				targetUnits: l.targetUnits,
				reason: l.reason
			})),
			estimatedWeeks: 12,
			weeklyHours: availableWeeklyHours,
			feasibility: evalRes.feasibility,
			feasibilityExplanation: evalRes.explanation,
			steps: [
				...levers.map((l) => ({
					title: `${l.subjectName} ${l.targetUnits} יח״ל`,
					detail: `יעד: ציון ${l.targetGrade}. ${l.reason}`,
					timing: getSubjectExamSession(l.subjectName, l.targetUnits) === 'winter' ? 'ינואר (מועד חורף)' : 'יוני–יולי (מועד קיץ)',
					type: 'bagrut_core' as const
				})),
				...(plan.psych > (hasTakenPsych ? currentPsych : 0)
					? [{ title: 'בחינה פסיכומטרית', detail: `יעד: ${plan.psych}`, timing: 'במועד הקרוב', type: 'psychometric' as const }]
					: [])
			],
			keyAdvantage
		});
	};

	if (plan1) {
		const onlyRequired = plan1.levers.every((l) => l.required);
		pushTrack(
			'track-fast',
			plan1HasBagrut ? 'פסיכומטרי ובגרות אחת' : onlyRequired && plan1.levers.length ? 'תנאי הסף ופסיכומטרי' : 'פסיכומטרי בלבד',
			'הכי מהיר',
			'from-amber-500 to-orange-600',
			plan1,
			plan1HasBagrut
				? 'הפסיכומטרי לבדו דורש קפיצה של יותר מ-100 נקודות, אז נוספה הבגרות שתורמת הכי הרבה לסכם.'
				: 'הדרך הקצרה ביותר: בלי בגרויות נוספות מעבר לתנאי הסף.'
		);
	}
	if (plan2) {
		pushTrack('track-balanced', 'פחות פסיכומטרי, עוד בגרויות', 'הקלה בפסיכומטרי', 'from-emerald-500 to-teal-600', plan2,
			plan1 ? 'בגרויות שמורידות את יעד הפסיכומטרי.' : 'גם עם פסיכומטרי מרבי ובגרות אחת לא מגיעים לסף, אז נדרשות עוד בגרויות.',
			plan1 ? plan1.psych - plan2.psych : undefined);
	}
	if (plan3) {
		pushTrack('track-multi-exam', 'מקסימום בגרויות', 'הקלה מרבית בפסיכומטרי', 'from-blue-600 to-indigo-700', plan3,
			'הכי פחות תלות בפסיכומטרי, עם יותר בחינות בגרות.', prev ? prev.psych - plan3.psych : undefined);
	}

	// Final Deduplication: Never return duplicate tracks with identical subject improvements and psychometric target
	const uniqueTracks: RecommendedTrack[] = [];
	for (const t of tracks) {
		const isDup = uniqueTracks.some(
			(u) =>
				u.targetPsychometric === t.targetPsychometric &&
				JSON.stringify(u.recommendedSubjectImprovements.map((s) => s.subjectName).sort()) ===
					JSON.stringify(t.recommendedSubjectImprovements.map((s) => s.subjectName).sort())
		);
		if (!isDup) {
			uniqueTracks.push(t);
		}
	}

	// =========================================================================
	// MANDATORY PRE-FLIGHT INSTITUTIONAL VERIFICATION GATE:
	// Every single proposed track MUST be directly tested against the institution's
	// official calculator (calculateInstitution). If a track claims to reach admission
	// but its verified Sekem is below threshold - 0.05, we calibrate or reject it.
	// =========================================================================
	const verifiedTracks: RecommendedTrack[] = [];
	for (const t of uniqueTracks) {
		const sim = applyLeversToSubjects(
			userProfile.bagrutSubjects,
			baseMathU,
			baseMathG,
			basePhysU,
			basePhysG,
			t.recommendedSubjectImprovements as any
		);

		// Official program requirements: drop a track whose bagrut can't meet them; add a step when an exam can
		const isDirectBagrut = t.id === 'track-direct-bagrut' || t.id === 'track-direct-admit-zero';
		const reqs = isDirectBagrut ? hardReqs.bagrutOnlyRequirements ?? hardReqs.officialRequirements : hardReqs.officialRequirements;
		const gate = gateOfficialRequirements(reqs, sim.subjects, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade, userProfile);
		if (gate.blocked) continue;
		const addRequirementSteps = () => {
			for (const step of gate.steps) if (!t.steps.some((s) => s.title === step.title)) t.steps.push(step);
		};

		if (isDirectBagrut) {
			addRequirementSteps();
			verifiedTracks.push(t);
			continue;
		}

		let targetP = t.targetPsychometric ?? (hasTakenPsych ? currentPsych : baselinePsych);
		let instCheck = evaluateSimulatedSekem(
			calculatorId,
			relevantSekemType,
			userProfile,
			sim.subjects,
			targetP,
			sim.mathUnits,
			sim.mathGrade,
			sim.physUnits,
			sim.physGrade
		);

		// If the track was supposed to reach threshold, but is slightly below, calibrate targetP:
		if (instCheck.sekem < threshold - 0.05) {
			const calibratedP = findExactPsychometricTarget(
				calculatorId,
				relevantSekemType,
				threshold,
				userProfile,
				sim.subjects,
				targetP,
				800,
				sim.mathUnits,
				sim.mathGrade,
				sim.physUnits,
				sim.physGrade
			);
			if (calibratedP !== null) {
				targetP = calibratedP;
				t.targetPsychometric = targetP;
				instCheck = evaluateSimulatedSekem(
					calculatorId,
					relevantSekemType,
					userProfile,
					sim.subjects,
					targetP,
					sim.mathUnits,
					sim.mathGrade,
					sim.physUnits,
					sim.physGrade
				);
			}
		}

		// An official minimum bagrut average on the sekem route (e.g. Bar-Ilan law: 90) that the plan doesn't reach
		if (hardReqs.minBagrutAverage && instCheck.bagrutAverage < hardReqs.minBagrutAverage) continue;

		// Strictly sync values directly from the official calculator
		t.targetSekem = isTechnion
			? Math.round(instCheck.sekem * 100) / 100
			: (calculatorId === 'bgu' || calculatorId === 'tau' ? Math.round(instCheck.sekem * 10) / 10 : Math.round(instCheck.sekem));
		t.targetBagrutAverage = Math.round(instCheck.bagrutAverage * 10) / 10;

		// Build concurrent/interleaved schedule plan for realistic time phasing:
		const schedulePlan = generateConcurrentSchedulePlan({
			trackId: t.id,
			availableWeeklyHours,
			targetPsychometric: t.targetPsychometric,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			subjectLevers: t.recommendedSubjectImprovements.map((s) => ({
				subjectName: s.subjectName,
				currentGrade: s.currentGrade,
				currentUnits: s.currentUnits,
				targetGrade: s.targetGrade,
				targetUnits: s.targetUnits,
				session: s.session,
				reason: s.reason
			})),
			psychSectionsLabel: formatPsychSectionsLabel(answers)
		});

		t.schedulePhases = schedulePlan.phases;
		t.hasConcurrentStudy = schedulePlan.hasConcurrency;
		if (schedulePlan.steps && schedulePlan.steps.length > 0) {
			t.steps = schedulePlan.steps as TrackStep[];
		}
		t.estimatedWeeks = schedulePlan.totalWeeks;

		addRequirementSteps();

		// Hard Prerequisites Gate (generic estimate, only without official requirements): If degree requires physics
		// and candidate has 0 units, and this track doesn't include Physics as a lever, attach the mandatory requirement step:
		if (!hardReqs.subjectRequirementsOfficial && hardReqs.requiresPhysics && basePhysU === 0 && t.id !== 'track-direct-admit-zero') {
			const hasPhysLever = t.recommendedSubjectImprovements.some((l) => isSubjectMatch(l.subjectName, 'פיזיקה'));
			if (!hasPhysLever) {
				const hasPhysStep = t.steps.some((s) => s.title.includes('פיזיקה'));
				if (!hasPhysStep) {
					t.steps.push({
						title: 'דרישת קדם קשיחה: מבחן סיווג / פטור בפיזיקה',
						detail: `התואר מחייב בגרות בפיזיקה או מעבר מבחן סיווג מוסדי בפיזיקה (ציון 70+) לפני פתיחת שנת הלימודים ב${gapAnalysis.target.institutionName}`,
						timing: 'קיץ (לפני פתיחת השנה)',
						type: 'administrative' as any
					});
				}
			}
		}

		// STRICT REQUIREMENT: Only tracks that meet or exceed the threshold are returned!
		if (t.targetSekem >= threshold - 0.05) {
			verifiedTracks.push(t);
		}
	}

	return verifiedTracks.slice(0, 3);
}
