/**
 * Personal Utility Scoring Engine
 * Evaluates the cognitive friction vs yield ratio for subject improvements
 * Subagent 2: Recommendation & Optimization Algorithms
 */

import { SubjectLeverCandidate } from './types';
import { UserPreferencesRecord, UserAcademicProfileRecord } from '../db/schema';

export function calculateLeverUtilityScore(
	lever: {
		id: string;
		subjectName: string;
		currentUnits: number;
		currentGrade: number;
		targetUnits: number;
		targetGrade: number;
		isMath?: boolean;
		isPhysics?: boolean;
	},
	isStemDegree: boolean,
	preferences: UserPreferencesRecord
): number {
	let baseScore = 75;

	// 1. Base Score differentiated by STEM vs Non-STEM Degree
	if (lever.isMath) {
		if (isStemDegree) {
			baseScore = 98; // Highest utility for STEM
		} else {
			// For non-STEM (Psychology, Humanities, Social Sciences), studying 5u Math has low utility
			baseScore = lever.currentUnits >= 4 && lever.currentGrade >= 75 ? 30 : 45;
		}
	} else if (lever.isPhysics) {
		baseScore = isStemDegree ? 95 : 25;
	} else if (
		lever.targetUnits === 5 &&
		(lever.subjectName.includes('היסטוריה') || lever.subjectName.includes('תנ'))
	) {
		// High-ROI Expansion Levers from 2u to 5u (3 units completion only!)
		baseScore = isStemDegree ? 88 : 95;
	} else if (lever.subjectName.includes('גיאוגרפיה')) {
		// High-yield elective booster
		baseScore = !isStemDegree ? 92 : 82;
	} else if (lever.subjectName.includes('מחשב')) {
		// Demoted: 5u CS from scratch has massive friction (180h+) unless student has analytical strength
		baseScore = isStemDegree && preferences.learningOrientation === 'stem' ? 65 : 38;
	} else if (lever.targetUnits === 2) {
		// Core mandatory subjects (תנ״ך, אזרחות, ספרות, היסטוריה, הבעה)
		if (lever.subjectName.includes('הבעה') || lever.subjectName.includes('לשון')) {
			// Tier 4: Severe friction and grading variance in Hebrew expression
			baseScore = lever.currentGrade < 65 ? 50 : 32; // Demoted unless failing!
		} else if (lever.subjectName.includes('תנ') || lever.subjectName.includes('ספרות')) {
			baseScore = !isStemDegree ? 95 : 75; // Predictable structured memorization
		} else if (lever.subjectName.includes('אזרחות')) {
			baseScore = !isStemDegree ? 92 : 72; // Formulaic
		} else {
			baseScore = !isStemDegree ? 90 : 65;
		}
	}

	// 2. Learning Strength & Cognitive Affinity
	if (preferences.learningStrength === 'memory_retention') {
		if (
			lever.subjectName.includes('גיאוגרפיה') ||
			['תנ"ך', 'תנ״ך', 'ספרות', 'היסטוריה', 'אזרחות', 'הבעה'].some((c) => lever.subjectName.includes(c))
		) {
			baseScore *= 1.45;
		} else if (lever.isMath || lever.isPhysics) {
			baseScore *= 0.7;
		}
	} else if (preferences.learningStrength === 'analytical_quick') {
		if (lever.isMath || lever.isPhysics || lever.subjectName.includes('מחשב')) {
			baseScore *= 1.45;
		} else if (['היסטוריה', 'ספרות', 'תנ"ך', 'תנ״ך'].some((c) => lever.subjectName.includes(c))) {
			baseScore *= 0.8;
		}
	} else if (preferences.learningStrength === 'deep_accuracy_no_rush') {
		if (lever.subjectName.includes('אנגלית') || lever.subjectName.includes('גיאוגרפיה') || lever.targetUnits === 2) {
			baseScore *= 1.25;
		}
	}

	// 3. Learning Orientation
	if (preferences.learningOrientation === 'humanities') {
		if (lever.subjectName.includes('גיאוגרפיה') || (!lever.isMath && !lever.isPhysics)) {
			baseScore *= 1.3;
		} else {
			baseScore *= 0.75;
		}
	} else if (preferences.learningOrientation === 'stem') {
		if (lever.isMath || lever.isPhysics || lever.subjectName.includes('מחשב')) {
			baseScore *= 1.35;
		}
	}

	// 4. Weekly Availability Constraints
	if (preferences.weeklyAvailabilityHours === 'limited_under_15') {
		// Heavy 5-unit subjects demand 18+ hrs/week
		if (lever.isMath || lever.isPhysics) {
			baseScore *= 0.6;
		} else if (lever.targetUnits === 2) {
			baseScore *= 1.4; // Manageable within limited hours
		} else if (lever.subjectName.includes('גיאוגרפיה')) {
			baseScore *= 1.25;
		}
	} else if (preferences.weeklyAvailabilityHours === 'full_30_plus') {
		if (lever.isMath || lever.isPhysics || lever.targetUnits === 5) {
			baseScore *= 1.3;
		}
	}

	// 5. Target Timeline Urgency
	if (preferences.targetTimeline === 'immediate_october') {
		if (lever.targetUnits === 2) {
			baseScore *= 1.25;
		} else if (lever.isMath && lever.currentUnits < 5) {
			baseScore *= 0.85;
		}
	}

	return Math.round(baseScore * 10) / 10;
}

/**
 * Extracts and ranks available subject improvement levers for a candidate
 */
export function extractRankedSubjectLevers(
	profile: UserAcademicProfileRecord,
	isStemDegree: boolean,
	preferences: UserPreferencesRecord
): SubjectLeverCandidate[] {
	const candidates: Omit<SubjectLeverCandidate, 'utilityScore'>[] = [];

	// 1. Math Lever
	const mathU = profile.mathUnits || 4;
	const mathG = profile.mathGrade || 80;
	if (mathU < 5) {
		candidates.push({
			id: 'math_5u',
			subjectName: 'מתמטיקה',
			currentGrade: mathG,
			currentUnits: mathU,
			targetGrade: 90,
			targetUnits: 5,
			priority: 1,
			reason: isStemDegree
				? 'שדרוג קריטי ל-5 יח״ל: מעניק בונוס 35 נקודות ומהווה תנאי סף פקולטטי בהנדסה ומדעים.'
				: 'שדרוג ל-5 יח״ל מעניק בונוס מוסדי מוגדל (35 נקודות).',
			isMath: true,
			leverType: 'bagrut_core'
		});
	} else if (mathG < 85) {
		candidates.push({
			id: 'math_5u_boost',
			subjectName: 'מתמטיקה',
			currentGrade: mathG,
			currentUnits: 5,
			targetGrade: 92,
			targetUnits: 5,
			priority: 1,
			reason: 'העלאת ציון ב-5 יח״ל מתמטיקה מביאה לזינוק ישיר בסכם ההנדסי.',
			isMath: true,
			leverType: 'bagrut_core'
		});
	}

	// 2. High-Yield 5-Unit Expansion Levers (History / Tanach completion of 3 units)
	const histSub = profile.bagrutSubjects.find((s) => s.subjectName.includes('היסטוריה') && s.units >= 2);
	if (histSub && histSub.units < 5) {
		candidates.push({
			id: 'history_5u_expansion',
			subjectName: 'היסטוריה',
			currentGrade: histSub.grade,
			currentUnits: histSub.units,
			targetGrade: 92,
			targetUnits: 5,
			priority: 2,
			reason: 'הרחבה מ-2 ל-5 יח״ל באמצעות שאלון השלמה של 3 יח״ל בלבד: מעניקה בונוס מלא (20 נקודות) בחצי מהמאמץ של מקצוע חדש.',
			leverType: 'bagrut_elective'
		});
	}

	const tanachSub = profile.bagrutSubjects.find(
		(s) => (s.subjectName.includes('תנ"ך') || s.subjectName.includes('תנ״ך') || s.subjectName.includes('תנך')) && s.units >= 2
	);
	if (tanachSub && tanachSub.units < 5) {
		candidates.push({
			id: 'tanach_5u_expansion',
			subjectName: 'תנ״ך',
			currentGrade: tanachSub.grade,
			currentUnits: tanachSub.units,
			targetGrade: 92,
			targetUnits: 5,
			priority: 2,
			reason: 'הרחבה ל-5 יח״ל מוגבר באמצעות שאלון השלמה: מעניקה בונוס מלא (20 נקודות) במאמץ ממוקד.',
			leverType: 'bagrut_elective'
		});
	}

	// 3. Geography 5 units (High-Yield Standalone Elective)
	const hasGeo = profile.bagrutSubjects.some((s) => s.subjectName.includes('גיאוגרפיה'));
	if (!hasGeo) {
		candidates.push({
			id: 'elective_geo_5u',
			subjectName: 'גיאוגרפיה',
			currentGrade: 0,
			currentUnits: 2,
			targetGrade: 92,
			targetUnits: 5,
			priority: 2,
			reason: 'הרחבת מקצוע בחירה נגיש ל-5 יח״ל מעניקה בונוס מלא (20–25 נקודות) ללא עומס מתמטי.',
			leverType: 'bagrut_elective'
		});
	}

	// 4. Computer Science 5 units (Offered only for STEM with analytical background)
	const hasCS = profile.bagrutSubjects.some((s) => s.subjectName.includes('מחשב'));
	if (
		!hasCS &&
		isStemDegree &&
		(preferences.learningOrientation === 'stem' || preferences.learningStrength === 'analytical_quick')
	) {
		candidates.push({
			id: 'elective_cs_5u',
			subjectName: 'מדעי המחשב',
			currentGrade: 0,
			currentUnits: 2,
			targetGrade: 92,
			targetUnits: 5,
			priority: 3,
			reason: 'מקצוע מוגבר הדורש פרויקט תכנות ולמידה מאפס (בונוס 25 נקודות). מומלץ רק לבעלי רקע או תפיסה אנליטית מובהקת.',
			leverType: 'bagrut_elective'
		});
	}

	// 5. Physics 5 units (For STEM)
	if (isStemDegree || preferences.learningOrientation === 'stem') {
		const physU = profile.physicsUnits || 0;
		const physG = profile.physicsGrade || 0;
		if (physU < 5) {
			candidates.push({
				id: 'physics_5u',
				subjectName: 'פיזיקה',
				currentGrade: physG,
				currentUnits: physU || 2,
				targetGrade: 88,
				targetUnits: 5,
				priority: 2,
				reason: 'דרישת קדם הכרחית לפקולטות ההנדסה, מעניקה בונוס מדעים 25 נקודות ופטור מסיווג.',
				isPhysics: true,
				leverType: 'bagrut_elective'
			});
		} else if (physG < 85) {
			candidates.push({
				id: 'physics_5u_boost',
				subjectName: 'פיזיקה',
				currentGrade: physG,
				currentUnits: 5,
				targetGrade: 92,
				targetUnits: 5,
				priority: 2,
				reason: 'העלאת ציון בפיזיקה 5 יח״ל מקפיצה את מקדם הסכם הריאלי.',
				isPhysics: true,
				leverType: 'bagrut_elective'
			});
		}
	}

	// 6. Core Mandatory 2-Unit Subjects (תנ״ך, אזרחות, ספרות, היסטוריה, הבעה)
	// Sorted by Predictable Ease ROI to avoid the "Lowest-Grade Trap" (e.g. Hebrew vs Bible)
	const coreNames = ['תנ"ך', 'תנ״ך', 'ספרות', 'היסטוריה', 'אזרחות', 'הבעה', 'לשון'];
	const weakCores = profile.bagrutSubjects
		.filter((s) => coreNames.some((c) => s.subjectName.includes(c)) && s.grade < 92 && s.grade > 0)
		.sort((a, b) => {
			const getScore = (sub: typeof a) => {
				const isHebrew = sub.subjectName.includes('הבעה') || sub.subjectName.includes('לשון');
				const isBible = sub.subjectName.includes('תנ');
				const isLit = sub.subjectName.includes('ספרות');
				const isCivics = sub.subjectName.includes('אזרחות');

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
		candidates.push({
			id: `core_${idx + 1}`,
			subjectName: sub.subjectName,
			currentGrade: sub.grade,
			currentUnits: sub.units,
			targetGrade,
			targetUnits: sub.units,
			priority: isStemDegree ? 3 + idx : 1 + idx,
			reason: `העלאת ציון במקצוע חובה קל (${sub.subjectName} ל-${targetGrade}) משפרת את הממוצע במאמץ ממוקד.`,
			leverType: 'bagrut_core'
		});
	});

	// Score each candidate with personal utility
	const scored: SubjectLeverCandidate[] = candidates.map((c) => ({
		...c,
		utilityScore: calculateLeverUtilityScore(c, isStemDegree, preferences)
	}));

	// Sort descending by personal utility score
	return scored.sort((a, b) => b.utilityScore - a.utilityScore);
}
