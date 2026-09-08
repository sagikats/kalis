/**
 * Psychometric Reachability & Personal Ceiling Model
 * Subagent 2: Recommendation & Optimization Algorithms
 *
 * Factors in percentile density curves (scores above 660 and 700 represent
 * tight percentiles where marginal gains require exponentially higher effort),
 * weekly study hours availability, previous exam experience, and diagnostic confidence.
 */

import { UserAcademicProfileRecord, UserPreferencesRecord, FeasibilityLevel } from '../db/schema';

export interface PsychReachability {
	currentPsych: number;
	personalCeiling: number;
	maxImprovementPoints: number;
	feasibilityForTarget: (target: number) => FeasibilityLevel;
	isRealistic: (target: number) => boolean;
}

export function computePsychReachability(
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): PsychReachability {
	const hasTakenPsych = profile.hasTakenPsychometric && profile.psychometricGeneral > 0;
	const currentPsych = hasTakenPsych ? profile.psychometricGeneral : 500;

	// 1. Base jump by weekly availability hours
	let baseImprovement = 50;
	switch (preferences.weeklyAvailabilityHours) {
		case 'limited_under_15':
			baseImprovement = 30;
			break;
		case 'part_15_25':
			baseImprovement = 50;
			break;
		case 'full_30_plus':
			baseImprovement = 75;
			break;
	}

	// 2. First-timer bonus vs repeat taker fatigue
	if (preferences.psychExperience === 'never') {
		baseImprovement += 15;
	} else if (preferences.psychExperience === 'multiple') {
		baseImprovement = Math.max(20, baseImprovement - 10);
	}

	// 3. Percentile Density Penalties
	// Scoring above 700 represents the top 3-4% of Israeli examinees.
	// Improvements at this tier are constrained by asymptotic test difficulty.
	let maxImprovement = baseImprovement;
	if (currentPsych >= 700) {
		maxImprovement = Math.min(maxImprovement, 20);
	} else if (currentPsych >= 660) {
		maxImprovement = Math.min(maxImprovement, 35);
	} else if (currentPsych >= 620) {
		maxImprovement = Math.min(maxImprovement, 55);
	}

	// 4. Psychological confidence & diagnostic feeling
	if (preferences.psychFeeling === 'low_confidence') {
		maxImprovement = Math.round(maxImprovement * 0.70);
	} else if (preferences.psychFeeling === 'high_potential') {
		maxImprovement = Math.round(maxImprovement * 1.15);
	}

	maxImprovement = Math.max(15, maxImprovement);
	const personalCeiling = Math.min(800, currentPsych + maxImprovement);

	const feasibilityForTarget = (target: number): FeasibilityLevel => {
		const delta = target - currentPsych;
		if (delta <= 0) return 'very_high';
		if (delta <= maxImprovement * 0.45) return 'very_high';
		if (delta <= maxImprovement * 0.8) return 'high';
		if (delta <= maxImprovement * 1.05) return 'moderate';
		return 'challenging';
	};

	const isRealistic = (target: number): boolean => {
		if (target <= currentPsych) return true;
		const delta = target - currentPsych;
		return target <= 800 && delta <= maxImprovement * 1.35;
	};

	return {
		currentPsych,
		personalCeiling,
		maxImprovementPoints: maxImprovement,
		feasibilityForTarget,
		isRealistic
	};
}
