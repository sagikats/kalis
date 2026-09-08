/**
 * Effort Cost & Cognitive Friction Model
 * Quantifies study hours, attempt modifiers, and cognitive affinity
 * Subagent 2: Optimizer & Recommendation Engine
 */

import { UserAcademicProfileRecord, UserPreferencesRecord } from '../../db/schema';
import { SubjectLeverCandidate } from '../types';
import { EffortBreakdown, LeverEffortAssessment } from './types';

export const BASE_EFFORT_HOURS = {
	psychometricFirstAttempt: 220,
	psychometricSecondAttempt: 165, // Exactly 75% of first attempt
	psychometricThirdPlusAttempt: 110, // Exactly 50% of first attempt
	mathUpgradeTo5u: 180,
	mathUpgradeTo4u: 120,
	mathBoost5u: 90,
	electiveExpansion5u: 100, // e.g. Geography 5u
	electiveExpansionFrom2u: 75, // e.g. History/Bible expansion 2u -> 5u (3 units completion only!)
	csFromScratch5u: 180, // Computer science from scratch
	physicsUpgrade5u: 170,
	coreMandatory2u: 40, // Quick-Win 2-unit core subjects
	examOverheadHours: 25 // Friction/administrative overhead per distinct exam
};

/**
 * National Difficulty, Cognitive Friction & Grader Subjectivity Catalog
 * Based on Ministry of Education national averages and grading rubrics
 */
export const SUBJECT_FRICTION_CATALOG: Record<
	string,
	{
		frictionMultiplier: number;
		varianceRiskMultiplier: number;
		tier: 1 | 2 | 3 | 4;
	}
> = {
	// Tier 1: High Predictability / Structured / Easiest
	גיאוגרפיה: { frictionMultiplier: 0.8, varianceRiskMultiplier: 1.0, tier: 1 },
	היסטוריה_הרחבה: { frictionMultiplier: 0.8, varianceRiskMultiplier: 1.0, tier: 1 },
	'תנ״ך': { frictionMultiplier: 0.85, varianceRiskMultiplier: 1.0, tier: 1 },
	'תנ"ך': { frictionMultiplier: 0.85, varianceRiskMultiplier: 1.0, tier: 1 },
	תנך: { frictionMultiplier: 0.85, varianceRiskMultiplier: 1.0, tier: 1 },
	ספרות: { frictionMultiplier: 0.9, varianceRiskMultiplier: 1.05, tier: 1 },

	// Tier 2: Moderate Friction / Formulaic
	אזרחות: { frictionMultiplier: 0.95, varianceRiskMultiplier: 1.05, tier: 2 },
	היסטוריה: { frictionMultiplier: 0.95, varianceRiskMultiplier: 1.05, tier: 2 },
	אנגלית: { frictionMultiplier: 0.9, varianceRiskMultiplier: 1.0, tier: 2 },

	// Tier 3: High Effort / Analytical STEM
	מתמטיקה: { frictionMultiplier: 1.2, varianceRiskMultiplier: 1.0, tier: 3 },
	פיזיקה: { frictionMultiplier: 1.25, varianceRiskMultiplier: 1.0, tier: 3 },

	// Tier 4: High Friction / Grader Subjectivity / High Risk
	הבעה: { frictionMultiplier: 1.45, varianceRiskMultiplier: 1.4, tier: 4 },
	לשון: { frictionMultiplier: 1.45, varianceRiskMultiplier: 1.4, tier: 4 },
	'הבעה עברית': { frictionMultiplier: 1.45, varianceRiskMultiplier: 1.4, tier: 4 },
	'מדעי המחשב': { frictionMultiplier: 1.35, varianceRiskMultiplier: 1.15, tier: 4 }
};

export function getSubjectFrictionProfile(
	subjectName: string,
	isExpansion = false
): {
	frictionMultiplier: number;
	varianceRiskMultiplier: number;
	combinedMultiplier: number;
	tier: 1 | 2 | 3 | 4;
} {
	if (isExpansion && subjectName.includes('היסטוריה')) {
		const prof = SUBJECT_FRICTION_CATALOG['היסטוריה_הרחבה'];
		return { ...prof, combinedMultiplier: prof.frictionMultiplier * prof.varianceRiskMultiplier };
	}
	for (const key of Object.keys(SUBJECT_FRICTION_CATALOG)) {
		if (subjectName.includes(key)) {
			const prof = SUBJECT_FRICTION_CATALOG[key];
			return { ...prof, combinedMultiplier: prof.frictionMultiplier * prof.varianceRiskMultiplier };
		}
	}
	return { frictionMultiplier: 1.0, varianceRiskMultiplier: 1.0, combinedMultiplier: 1.0, tier: 2 };
}

/**
 * Computes effort hours for a specific bagrut subject lever
 */
export function calculateSubjectLeverEffortHours(
	lever: SubjectLeverCandidate,
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): EffortBreakdown {
	const isMath = !!lever.isMath;
	const isPhysics = !!lever.isPhysics;
	const targetUnits = lever.targetUnits;
	const currentUnits = lever.currentUnits;
	const isCS = lever.subjectName.includes('מחשב');
	const isExpansion =
		currentUnits >= 2 &&
		targetUnits === 5 &&
		(lever.subjectName.includes('היסטוריה') || lever.subjectName.includes('תנ') || lever.subjectName.includes('ספרות'));

	let baseHours = 40;

	if (isMath) {
		if (currentUnits < 4 && targetUnits >= 4) {
			baseHours = BASE_EFFORT_HOURS.mathUpgradeTo4u;
		} else if (currentUnits < 5 && targetUnits === 5) {
			baseHours = BASE_EFFORT_HOURS.mathUpgradeTo5u;
		} else if (currentUnits === 5) {
			baseHours = BASE_EFFORT_HOURS.mathBoost5u;
		}
	} else if (isPhysics) {
		baseHours = BASE_EFFORT_HOURS.physicsUpgrade5u;
	} else if (isCS && currentUnits < 5) {
		baseHours = BASE_EFFORT_HOURS.csFromScratch5u;
	} else if (isExpansion) {
		baseHours = BASE_EFFORT_HOURS.electiveExpansionFrom2u; // 75h
	} else if (targetUnits >= 5 && currentUnits < 5) {
		baseHours = BASE_EFFORT_HOURS.electiveExpansion5u; // e.g. Geography 5u
	} else if (targetUnits === 2) {
		baseHours = BASE_EFFORT_HOURS.coreMandatory2u;
	}

	const frictionProfile = getSubjectFrictionProfile(lever.subjectName, isExpansion);

	const affinityMultiplier = getSubjectAffinityMultiplier(
		lever.subjectName,
		targetUnits,
		isMath,
		isPhysics,
		preferences
	);

	const verbalBonus = getVerbalReasoningMultiplier(profile, preferences);
	// Verbal excellence aids in humanities/reading-heavy subjects
	const isHumanities = ['תנ"ך', 'תנ״ך', 'ספרות', 'היסטוריה', 'אזרחות', 'גיאוגרפיה'].some((c) =>
		lever.subjectName.includes(c)
	);
	const effectiveVerbalBonus = isHumanities ? verbalBonus : 1.0;

	const effectiveHours = Math.round(
		baseHours * frictionProfile.combinedMultiplier * affinityMultiplier * effectiveVerbalBonus
	);
	const totalEffortHours = effectiveHours + BASE_EFFORT_HOURS.examOverheadHours;

	return {
		baseHours,
		affinityMultiplier: Math.round(affinityMultiplier * frictionProfile.combinedMultiplier * 100) / 100,
		experienceMultiplier: 1.0,
		verbalReasoningBonus: effectiveVerbalBonus,
		examOverheadHours: BASE_EFFORT_HOURS.examOverheadHours,
		totalEffortHours
	};
}

/**
 * Computes the general learning capacity boost based on verbal reasoning excellence
 * High verbal score (130+) indicates superior verbal reasoning, abstract logic and reading comprehension,
 * speeding up acquisition across all subjects.
 */
export function getVerbalReasoningMultiplier(
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): number {
	const hasHighVerbalScore = profile.hasTakenPsychometric && profile.psychometricVerbal >= 130;
	const hasVerbalStrengthSelected =
		preferences.psychStrongestSection === 'verbal' ||
		(preferences.psychStrongestSections && preferences.psychStrongestSections.includes('verbal'));

	if (hasHighVerbalScore) return 0.85; // 15% speed-up across subjects
	if (hasVerbalStrengthSelected) return 0.90;
	return 1.0;
}

/**
 * Computes the English preparation modifier
 * Score of 134+ grants full university exemption (Ptor), eliminating English prep completely.
 */
export function getEnglishExemptionMultiplier(
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): number {
	const hasPtor = profile.hasTakenPsychometric && profile.psychometricEnglish >= 134;
	const hasEnglishStrength =
		preferences.psychStrongestSection === 'english' ||
		(preferences.psychStrongestSections && preferences.psychStrongestSections.includes('english'));

	if (hasPtor) return 0.85; // Focus solely on quant and verbal
	if (hasEnglishStrength) return 0.90;
	return 1.0;
}

/**
 * Computes cognitive affinity multiplier for a subject lever based on student orientation & style
 */
export function getSubjectAffinityMultiplier(
	subjectName: string,
	units: number,
	isMath: boolean,
	isPhysics: boolean,
	preferences: UserPreferencesRecord
): number {
	let multiplier = 1.0;

	const isStemSubject = isMath || isPhysics || subjectName.includes('מחשב');
	const isHumanitiesSubject =
		subjectName.includes('גיאוגרפיה') ||
		['תנ"ך', 'תנ״ך', 'ספרות', 'היסטוריה', 'אזרחות', 'הבעה', 'לשון'].some((c) => subjectName.includes(c));

	// 1. Orientation matching
	if (preferences.learningOrientation === 'stem') {
		if (isStemSubject) multiplier *= 0.85;
		else if (isHumanitiesSubject) multiplier *= 1.05;
	} else if (preferences.learningOrientation === 'humanities') {
		if (isStemSubject && units >= 5) multiplier *= 1.6; // High friction for non-STEM doing 5u Math/Physics
		else if (isHumanitiesSubject) multiplier *= 0.85;
	}

	// 2. Learning strength matching
	if (preferences.learningStrength === 'memory_retention') {
		if (isHumanitiesSubject) multiplier *= 0.85;
		else if (isStemSubject) multiplier *= 1.25;
	} else if (preferences.learningStrength === 'analytical_quick') {
		if (isStemSubject) multiplier *= 0.85;
		else if (isHumanitiesSubject && !subjectName.includes('אזרחות')) multiplier *= 1.15;
	}

	return Math.round(multiplier * 100) / 100;
}

/**
 * Computes psychometric attempt effort hours based on official experience rules:
 * - 1st attempt: 220 hours (100%)
 * - 2nd attempt: 165 hours (75% of 1st)
 * - 3rd+ attempt: 110 hours (50% of 1st)
 */
export function calculatePsychometricEffortHours(
	targetPsych: number,
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): EffortBreakdown {
	const currentPsych = profile.hasTakenPsychometric ? profile.psychometricGeneral : 0;
	const pointsDelta = Math.max(0, targetPsych - currentPsych);

	let baseHours = BASE_EFFORT_HOURS.psychometricFirstAttempt;
	let experienceMultiplier = 1.0;

	if (preferences.psychExperience === 'multiple') {
		baseHours = BASE_EFFORT_HOURS.psychometricThirdPlusAttempt;
		experienceMultiplier = 0.50; // 50% of first attempt (110h)
	} else if (preferences.psychExperience === 'once' || (profile.hasTakenPsychometric && currentPsych > 0)) {
		baseHours = BASE_EFFORT_HOURS.psychometricSecondAttempt;
		experienceMultiplier = 0.75; // 75% of first attempt (165h)
	}

	// Scale if pointsDelta is small (e.g. only 15-20 points needed)
	let deltaScale = 1.0;
	if (pointsDelta > 0 && pointsDelta <= 25) {
		deltaScale = 0.65; // Moderate refresher
	} else if (pointsDelta > 25 && pointsDelta <= 50) {
		deltaScale = 0.85;
	} else if (pointsDelta > 100) {
		deltaScale = 1.25; // Massive jump
	}

	const verbalBonus = getVerbalReasoningMultiplier(profile, preferences);
	const englishBonus = getEnglishExemptionMultiplier(profile, preferences);
	const affinityMultiplier = Math.round(verbalBonus * englishBonus * 100) / 100;

	const effectiveHours = Math.round(baseHours * deltaScale * affinityMultiplier);
	const totalEffortHours = effectiveHours + BASE_EFFORT_HOURS.examOverheadHours;

	return {
		baseHours,
		affinityMultiplier,
		experienceMultiplier,
		verbalReasoningBonus: verbalBonus,
		examOverheadHours: BASE_EFFORT_HOURS.examOverheadHours,
		totalEffortHours
	};
}


