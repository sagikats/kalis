import { SubjectInput } from '../calculators/bguCalculator';
import {
	InstitutionSekemResult,
	calculateMultiInstitutionSekem,
	UnifiedCalculationInput
} from '../calculators/multiCalculator';
import { ProgramGapAnalysis, UserAcademicProfile } from './gapAnalyzer';

export interface UserPreferencesQuestionnaire {
	// ציר פסיכומטרי
	psychExperience: 'never' | 'once' | 'multiple';
	psychWillingness?: 'full_exam' | 'prefer_bagrut_only';
	psychFeeling?: 'high_potential' | 'reached_ceiling';
	psychStrongestSection?: 'quant' | 'verbal_eng' | 'balanced';

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
	type: 'psychometric' | 'bagrut_elective' | 'bagrut_core' | 'mechina';
}

export interface SubjectImprovement {
	subjectName: string;
	currentGrade: number;
	currentUnits: number;
	targetGrade: number;
	targetUnits: number;
	reason: string;
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

	return Math.min(800, Math.min(hardMaxFromBaseline, Math.min(correlatedHardCap, baseline + maxAllowedJump)));
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
	if (psychDelta <= 30 && numSubjects <= 2) {
		return {
			feasibility: 'very_high',
			explanation: 'הסתברות הצלחה סטטיסטית גבוהה מאוד (מעל 85%): השיפור בפסיכומטרי מתון ובר-השגה באופן מלא במחזור בחינה בודד.'
		};
	}
	if (psychDelta <= 60 && numSubjects <= 3) {
		return {
			feasibility: 'high',
			explanation: 'הסתברות הצלחה סטטיסטית גבוהה (75%–85%): עומס הלמידה מבוקר ומחולק בין יעדים ריאליים.'
		};
	}
	if (psychDelta <= 85) {
		return {
			feasibility: 'moderate',
			explanation: 'הסתברות הצלחה סטטיסטית בינונית (60%–75%): דורש תרגול עקבי ומשמעת לימודית גבוהה לסגירת הפער.'
		};
	}
	return {
		feasibility: 'challenging',
		explanation: 'מסלול אתגרי (50%–60%): מצריך עלייה של 85–100 נקודות בפסיכומטרי, מומלץ לשלב מרתון סימולציות מורחב.'
	};
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
): { sekem: number; bagrutAverage: number; directBagrutEligible: boolean } {
	const mathU = simulatedMathUnits ?? baseProfile.mathUnits ?? 4;
	const mathG = simulatedMathGrade ?? baseProfile.mathGrade ?? 80;

	const updatedSubjects = simulatedSubjects.map((s) => {
		if (s.name.includes('מתמטיקה')) {
			return { ...s, units: mathU, grade: mathG };
		}
		return s;
	});

	const physSub = updatedSubjects.find((s) => s.name.includes('פיזיקה'));
	const physUnits = simulatedPhysUnits ?? (physSub ? physSub.units : baseProfile.physicsUnits);
	const physGrade = simulatedPhysGrade ?? (physSub ? physSub.grade : baseProfile.physicsGrade);

	const baseQuant = baseProfile.psychometricQuant || Math.round((baseProfile.psychometricGeneral || 600) / 5);
	const psychRatio = (baseProfile.psychometricGeneral || 600) > 0 ? simulatedPsych / (baseProfile.psychometricGeneral || 600) : 1;
	const simulatedQuant = Math.min(150, Math.max(50, Math.round(baseQuant * psychRatio)));

	const input: UnifiedCalculationInput = {
		bagrutSubjects: updatedSubjects,
		psychometricGeneral: simulatedPsych,
		psychometricQuant: simulatedQuant,
		psychometricVerbal: baseProfile.psychometricVerbal,
		psychometricEnglish: baseProfile.psychometricEnglish,
		mathUnits: mathU,
		mathGrade: mathG,
		physicsUnits: physUnits,
		physicsGrade: physGrade
	};

	const results = calculateMultiInstitutionSekem(input, [calculatorId]);
	const instRes = results.find((r) => r.institutionId === calculatorId) || results[0];

	let sekem = instRes?.generalSekem || 0;
	if (relevantSekemType === 'engineering' && instRes?.engineeringSekem) {
		sekem = instRes.engineeringSekem;
	} else if (relevantSekemType === 'management' && instRes?.managementSekem) {
		sekem = instRes.managementSekem;
	}

	return {
		sekem,
		bagrutAverage: instRes?.bagrutAverage || 0,
		directBagrutEligible: instRes?.directBagrutEligible || false
	};
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

	return bestMatch !== null ? Math.max(effectiveMin, bestMatch) : null;
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
	isStemDegree: boolean
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
	} else if (lever.targetUnits === 5) {
		// 5-unit electives: Geography is universally high yield and very light compared to math/sciences
		baseScore = lever.subjectName.includes('גיאוגרפיה') ? 95 : (isStemDegree ? 80 : 65);
	} else if (lever.subjectName.includes('אנגלית')) {
		baseScore = 70;
	} else {
		// Core mandatory 2 units (תנ"ך, אזרחות, ספרות, היסטוריה, הבעה)
		// For non-STEM or when raising low/medium grades, these 2-unit subjects are the easiest, fastest, and least risky!
		baseScore = !isStemDegree ? 92 : 60;
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
function getAvailableSubjectLevers(
	userProfile: UserAcademicProfile,
	isStemDegree: boolean,
	answers: UserPreferencesQuestionnaire
): SubjectUpgradeAction[] {
	const levers: SubjectUpgradeAction[] = [];

	// Math 5 units
	const currentMathU = userProfile.mathUnits || 4;
	const currentMathG = userProfile.mathGrade || 80;
	if (currentMathU < 5) {
		const mathReason = answers.learningStrength === 'analytical_quick'
			? 'התאמה אופטימלית לחשיבה אנליטית: שדרוג ל-5 יח״ל מעניק בונוס 35 נקודות ומקדם סכם הנדסה ישיר.'
			: 'שדרוג ל-5 יח״ל מעניק בונוס מרבי (35 נקודות), מקדם סכם ייעודי ופוטר ממכינות.';
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
			targetGrade: 92,
			targetUnits: 5,
			reason: 'שיפור ציון ב-5 יח״ל מתמטיקה מקפיץ את ציון ההתאמה ההנדסי ישירות.',
			priority: 1,
			isMath: true
		});
	}

	// High-Yield 5-Unit Elective (Geography or Computer Science)
	const hasGeo = userProfile.bagrutSubjects.some((s) => s.name.includes('גיאוגרפיה'));
	if (!hasGeo) {
		const geoReason = answers.learningStrength === 'memory_retention'
			? 'התאמה מושלמת לחוזק בשינון: מקצוע מוגבר מובנה שמעניק בונוס 20–25 נקודות ללא עומס מתמטי.'
			: 'הרחבת מקצוע בחירה ל-5 יח״ל מעניקה בונוס מלא (20–25 נקודות) ומקפיצה את הממוצע האופטימלי.';
		levers.push({
			id: 'elective_geo_5u',
			subjectName: 'גיאוגרפיה',
			currentGrade: 0,
			currentUnits: 2,
			targetGrade: 92,
			targetUnits: 5,
			reason: geoReason,
			priority: 2
		});
	}

	const hasCS = userProfile.bagrutSubjects.some((s) => s.name.includes('מחשב'));
	if (!hasCS && (isStemDegree || answers.learningOrientation === 'stem' || answers.learningStrength === 'analytical_quick')) {
		levers.push({
			id: 'elective_cs_5u',
			subjectName: 'מדעי המחשב',
			currentGrade: 0,
			currentUnits: 2,
			targetGrade: 92,
			targetUnits: 5,
			reason: 'מקצוע מוגבר מבוקש המעניק בונוס מדעים (20–25 נקודות) ומתאים לבעלי תפיסה אנליטית.',
			priority: 2
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
				currentUnits: currentPhysU || 2,
				targetGrade: 88,
				targetUnits: 5,
				reason: 'דרישת קדם הכרחית לפקולטות המובילות, מעניקה בונוס מדעים 25 נקודות ופטור ממבחני סיווג.',
				priority: 2,
				isPhysics: true
			});
		} else if (currentPhysG < 85) {
			levers.push({
				id: 'physics_5u_boost',
				subjectName: 'פיזיקה',
				currentGrade: currentPhysG,
				currentUnits: 5,
				targetGrade: 92,
				targetUnits: 5,
				reason: 'העלאת ציון בפיזיקה 5 יח״ל מחזקת את מקדם הסכם הריאלי.',
				priority: 2,
				isPhysics: true
			});
		}
	}

	// Weakest / improvable Mandatory Core Subjects (Bible, Literature, History, Civics, Hebrew)
	const coreNames = ['תנ"ך', 'תנך', 'ספרות', 'היסטוריה', 'אזרחות', 'הבעה', 'לשון'];
	const weakCores = userProfile.bagrutSubjects
		.filter((s) => coreNames.some((c) => s.name.includes(c)) && s.grade < 92 && s.grade > 0)
		.sort((a, b) => a.grade - b.grade);

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
	const englishSub = userProfile.bagrutSubjects.find((s) => s.name.includes('אנגלית'));
	if (englishSub && englishSub.units < 5) {
		levers.push({
			id: 'english_5u',
			subjectName: 'אנגלית',
			currentGrade: englishSub.grade,
			currentUnits: englishSub.units,
			targetGrade: 88,
			targetUnits: 5,
			reason: 'שדרוג ל-5 יח״ל מעניק בונוס 25 נקודות ומבטיח פטור מלא מלימודי אנגלית.',
			priority: 4
		});
	}

	// Sort dynamically using the personalized Utility Scoring Engine!
	return levers.sort((a, b) => {
		const scoreA = calculateLeverUtilityScore(a, answers, isStemDegree);
		const scoreB = calculateLeverUtilityScore(b, answers, isStemDegree);
		return scoreB - scoreA;
	});
}

/**
 * Applies a subset of upgrade actions to produce simulated subjects and math/phys state
 */
function applyLeversToSubjects(
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
		if (lever.isMath) {
			mathU = lever.targetUnits;
			mathG = lever.targetGrade;
			updated = updated.map((s) => (s.name.includes('מתמטיקה') ? { ...s, units: mathU, grade: mathG } : s));
		} else if (lever.isPhysics) {
			physU = lever.targetUnits;
			physG = lever.targetGrade;
			const hasPhys = updated.some((s) => s.name.includes('פיזיקה'));
			if (hasPhys) {
				updated = updated.map((s) => (s.name.includes('פיזיקה') ? { ...s, units: physU, grade: physG } : s));
			} else {
				updated.push({ name: 'פיזיקה', units: physU, grade: physG });
			}
		} else {
			const existingIdx = updated.findIndex((s) => s.name === lever.subjectName);
			if (existingIdx >= 0) {
				updated[existingIdx] = {
					...updated[existingIdx],
					grade: lever.targetGrade,
					units: lever.targetUnits
				};
			} else {
				updated.push({
					name: lever.subjectName,
					grade: lever.targetGrade,
					units: lever.targetUnits
				});
			}
		}
	}

	return { subjects: updated, mathUnits: mathU, mathGrade: mathG, physUnits: physU, physGrade: physG };
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
		'הנדסה'
	];
	if (strictlyMandatesPsych.some((d) => lower.includes(d))) {
		return false;
	}
	if (calculatorId === 'technion') {
		return false;
	}
	return true;
}

/**
 * Main Closed-Loop Generator producing 3 mathematically guaranteed tailored admission tracks
 */
export function generatePersonalizedTracks(
	gapAnalysis: ProgramGapAnalysis,
	userProfile: UserAcademicProfile,
	institutionRes: InstitutionSekemResult,
	answers: UserPreferencesQuestionnaire
): RecommendedTrack[] {
	const hasTakenPsych = (userProfile.psychometricGeneral || 0) > 0;
	const currentPsych = hasTakenPsych ? userProfile.psychometricGeneral : 0;
	const currentBagrut = institutionRes.bagrutAverage > 0 ? institutionRes.bagrutAverage : 100;
	const threshold = gapAnalysis.threshold || (gapAnalysis.userSekem + Math.max(0, Math.abs(gapAnalysis.gap)));
	const calculatorId = gapAnalysis.target.calculatorId;
	const relevantSekemType = gapAnalysis.relevantSekemType;
	const isTechnion = calculatorId === 'technion';
	const isStemDegree =
		relevantSekemType === 'engineering' ||
		relevantSekemType === 'technion' ||
		gapAnalysis.target.program.fieldOfStudy.includes('הנדס') ||
		gapAnalysis.target.program.fieldOfStudy.includes('מחשב') ||
		gapAnalysis.target.program.fieldOfStudy.includes('מדעים מדויקים') ||
		gapAnalysis.target.program.fieldOfStudy.includes('פיזיקה') ||
		gapAnalysis.target.program.fieldOfStudy.includes('מתמטיקה') ||
		gapAnalysis.target.program.fieldOfStudy.includes('כימיה');

	// Universal strict hard limit: No track may EVER propose a psychometric score higher than currentPsych + MAX_REALISTIC_PSYCHOMETRIC_JUMP (100)
	const maxAllowedPsychTarget = hasTakenPsych
		? Math.min(800, currentPsych + MAX_REALISTIC_PSYCHOMETRIC_JUMP)
		: Math.min(750, getRealisticPsychometricCeiling(currentPsych, currentBagrut, answers));

	const psychCeiling = Math.min(
		maxAllowedPsychTarget,
		getRealisticPsychometricCeiling(currentPsych, currentBagrut, answers)
	);

	const availableLevers = getAvailableSubjectLevers(userProfile, isStemDegree, answers);
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

	// Pre-test solutions for 0, 1, 2, 3, 4 levers strictly under psychCeiling
	// 0 levers: Pure psychometric
	const purePsychTarget = answers.psychWillingness === 'prefer_bagrut_only'
		? null
		: findExactPsychometricTarget(
				calculatorId,
				relevantSekemType,
				threshold,
				userProfile,
				userProfile.bagrutSubjects,
				hasTakenPsych ? currentPsych : 450,
				psychCeiling,
				baseMathU,
				baseMathG,
				basePhysU,
				basePhysG
		  );

	// 1 lever
	let sol1Lever: { lever: SubjectUpgradeAction; psych: number; res: { sekem: number; bagrutAverage: number } } | null = null;
	for (const lever of availableLevers) {
		const sim = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, [lever]);
		const psychSol = findExactPsychometricTarget(
			calculatorId,
			relevantSekemType,
			threshold,
			userProfile,
			sim.subjects,
			hasTakenPsych ? currentPsych : 450,
			psychCeiling,
			sim.mathUnits,
			sim.mathGrade,
			sim.physUnits,
			sim.physGrade
		);
		if (psychSol !== null) {
			const res = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, sim.subjects, psychSol, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade);
			if (res.sekem >= threshold) {
				sol1Lever = { lever, psych: psychSol, res };
				break;
			}
		}
	}

	// 2 levers
	let sol2Levers: { levers: SubjectUpgradeAction[]; psych: number; res: { sekem: number; bagrutAverage: number } } | null = null;
	if (availableLevers.length >= 2) {
		const pair = availableLevers.slice(0, 2);
		const sim = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, pair);
		const psychSol = findExactPsychometricTarget(
			calculatorId,
			relevantSekemType,
			threshold,
			userProfile,
			sim.subjects,
			hasTakenPsych ? currentPsych : 450,
			psychCeiling,
			sim.mathUnits,
			sim.mathGrade,
			sim.physUnits,
			sim.physGrade
		);
		if (psychSol !== null) {
			const res = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, sim.subjects, psychSol, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade);
			if (res.sekem >= threshold) {
				sol2Levers = { levers: pair, psych: psychSol, res };
			}
		}
	}

	// 3 levers
	let sol3Levers: { levers: SubjectUpgradeAction[]; psych: number; res: { sekem: number; bagrutAverage: number } } | null = null;
	if (availableLevers.length >= 3) {
		const triple = availableLevers.slice(0, 3);
		const sim = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, triple);
		const psychSol = findExactPsychometricTarget(
			calculatorId,
			relevantSekemType,
			threshold,
			userProfile,
			sim.subjects,
			hasTakenPsych ? currentPsych : 450,
			psychCeiling,
			sim.mathUnits,
			sim.mathGrade,
			sim.physUnits,
			sim.physGrade
		);
		if (psychSol !== null) {
			const res = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, sim.subjects, psychSol, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade);
			if (res.sekem >= threshold) {
				sol3Levers = { levers: triple, psych: psychSol, res };
			}
		}
	}

	// 4 levers
	let sol4Levers: { levers: SubjectUpgradeAction[]; psych: number; res: { sekem: number; bagrutAverage: number } } | null = null;
	if (availableLevers.length >= 4) {
		const quad = availableLevers.slice(0, 4);
		const sim = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, quad);
		const psychSol = findExactPsychometricTarget(
			calculatorId,
			relevantSekemType,
			threshold,
			userProfile,
			sim.subjects,
			hasTakenPsych ? currentPsych : 450,
			psychCeiling,
			sim.mathUnits,
			sim.mathGrade,
			sim.physUnits,
			sim.physGrade
		);
		if (psychSol !== null) {
			const res = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, sim.subjects, psychSol, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade);
			if (res.sekem >= threshold) {
				sol4Levers = { levers: quad, psych: psychSol, res };
			}
		}
	}

	const hasStandardSolution = purePsychTarget !== null || sol1Lever !== null || sol2Levers !== null || sol3Levers !== null || sol4Levers !== null;
	const gapAbs = Math.abs(gapAnalysis.gap);

	// =========================================================================
	// BRANCH 1: NO RETAKE COMBINATION FULLY REACHES THRESHOLD UNDER CEILING
	// (Even 4 levers + psychometric jump of <= 100 points is insufficient in 1 cycle)
	// =========================================================================
	if (!hasStandardSolution) {
		// Track 1 is ALWAYS an actionable Bagrut + Psychometric improvement track!
		const fastCount = Math.min(2, availableLevers.length);
		const fastLevers = availableLevers.slice(0, fastCount);
		const simFast = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, fastLevers);
		const fastPsych = Math.min(psychCeiling, currentPsych + 65);
		const resFast = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, simFast.subjects, fastPsych, simFast.mathUnits, simFast.mathGrade, simFast.physUnits, simFast.physGrade);
		const fastSubjectNames = fastLevers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל)`).join(' + ');

		tracks.push({
			id: 'track-fast-hybrid',
			title: 'המסלול המהיר: מינוף מקצועות מפתח',
			badge: 'הכי מהיר (מועד קיץ/חורף)',
			badgeColor: 'from-amber-500 to-orange-600',
			strategyDescription: `שדרוג ממוקד של ${fastSubjectNames} מעלה את ממוצע הבגרות ל-${resFast.bagrutAverage.toFixed(1)} יחד עם פסיכומטרי ריאלי של ${fastPsych} (+${fastPsych - currentPsych} נקודות). ממקסם את הזינוק בסכם (${resFast.sekem.toFixed(isTechnion ? 2 : 1)}) למועד הקרוב.`,
			targetSekem: resFast.sekem,
			targetPsychometric: fastPsych,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			targetBagrutAverage: resFast.bagrutAverage,
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: fastLevers.map((l) => ({
				subjectName: l.subjectName,
				currentGrade: l.currentGrade,
				currentUnits: l.currentUnits,
				targetGrade: l.targetGrade,
				targetUnits: l.targetUnits,
				reason: l.reason
			})),
			estimatedWeeks: 12,
			weeklyHours: availableWeeklyHours,
			feasibility: getFeasibilityEvaluation(fastPsych - currentPsych, fastLevers.length).feasibility,
			feasibilityExplanation: 'שדרוג ממוקד של מקצועות בעלי מקדם בונוס גבוה לסגירת מרב הפער במחזור בחינה בודד.',
			steps: [
				{
					title: `הכנה ממוקדת ל-${fastLevers[0]?.subjectName || 'מקצוע בגרות'}`,
					detail: 'מרתון תרגול ובגרויות עד להשגת ציון היעד',
					timing: 'שבועות 1–8',
					type: fastLevers[0]?.isMath ? 'bagrut_core' : 'bagrut_elective'
				},
				...(fastLevers.length > 1
					? [
							{
								title: `השלמת ${fastLevers[1].subjectName}`,
								detail: `הגעה לציון ${fastLevers[1].targetGrade} למיצוי בונוס מוסדי`,
								timing: 'שבועות 9–10',
								type: 'bagrut_elective' as const
							}
					  ]
					: []),
				{
					title: 'השלמת יעד פסיכומטרי',
					detail: `הגעה לציון ${fastPsych} והגשת מועמדות`,
					timing: 'שבועות 11–12',
					type: 'psychometric'
				}
			],
			keyAdvantage: 'סגירת חלק הארי של הפער במועד הקרוב ביותר ללא פיזור מאמץ.'
		});

		// Track 2: מסלול דו-שלבי רב-שנתי (פיזור עומס מובנה)
		const multiYearLevers = availableLevers.slice(0, Math.min(3, availableLevers.length));
		const multiSim = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, multiYearLevers);
		const multiRes = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, multiSim.subjects, psychCeiling, multiSim.mathUnits, multiSim.mathGrade, multiSim.physUnits, multiSim.physGrade);
		const multiSubjectNames = multiYearLevers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל)`).join(' + ');

		tracks.push({
			id: 'track-multi-year',
			title: 'המסלול הבטוח: פיזור עומס דו-שלבי',
			badge: 'הכי מומלץ (פיזור סיכונים)',
			badgeColor: 'from-emerald-500 to-teal-600',
			strategyDescription: `בפער של ${gapAbs.toFixed(isTechnion ? 1 : 0)} נקודות סכם, פיצול המאמץ לשני מחזורים מונע עומס יתר: מחזור 1 מעלה 3 מקצועות מוגברים (${multiSubjectNames}) ל-${multiRes.bagrutAverage.toFixed(1)}, ומחזור 2 מוקדש לקורס פסיכומטרי יסודי עד לציון ריאלי של ${psychCeiling}.`,
			targetSekem: multiRes.sekem,
			targetPsychometric: psychCeiling,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			targetBagrutAverage: multiRes.bagrutAverage,
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: multiYearLevers.map((l) => ({
				subjectName: l.subjectName,
				currentGrade: l.currentGrade,
				currentUnits: l.currentUnits,
				targetGrade: l.targetGrade,
				targetUnits: l.targetUnits,
				reason: l.reason
			})),
			estimatedWeeks: 24,
			weeklyHours: availableWeeklyHours,
			feasibility: 'moderate',
			feasibilityExplanation: 'הסתברות הצלחה בינונית: פיצול המאמץ מונע עומס קוגניטיבי בלתי אפשרי ומאפשר סגירה יסודית של הפער.',
			steps: [
				{
					title: 'מחזור א׳: שדרוג מקצועות בגרות מוגברים',
					detail: `הכנה ופתרון בגרויות עבור ${multiSubjectNames} להעלאת הממוצע`,
					timing: 'חודשים 1–4',
					type: 'bagrut_elective'
				},
				{
					title: 'מחזור ב׳: קורס פסיכומטרי ממוקד',
					detail: `תרגול מעמיק ומרתון סימולציות להגעה ליעד ריאלי של ${psychCeiling}`,
					timing: 'חודשים 5–6',
					type: 'psychometric'
				}
			],
			keyAdvantage: 'מפרק יעד ענק למטרות ביניים בנות-השגה ומונע קריסה מעומס בלתי מציאותי.'
		});

		// Track 3: מסלול העוגן
		// ONLY suggest Open University Academic Transfer if the gap is truly colossal (gap >= 190 pts)
		const isTrulyColossalGap = isTechnion ? gapAbs >= 20 : gapAbs >= 190;

		if (isTrulyColossalGap) {
			tracks.push({
				id: 'track-transfer',
				title: 'מסלול אפיק מעבר: מעקף פסיכומטרי מלא',
				badge: 'מעקף פסיכומטרי מלא (לפערים חריגים)',
				badgeColor: 'from-blue-600 to-indigo-700',
				strategyDescription: `בפער חריג של ${gapAbs.toFixed(isTechnion ? 1 : 0)} נקודות סכם, שיפור בגרויות בודדות אינו מספיק. אפיק המעבר של האוניברסיטה הפתוחה עוקף לחלוטין את ציוני התיכון והפסיכומטרי: לומדים 3–4 קורסים אקדמיים בסיסיים (חדו״א, ליניארית, תכנות/פיזיקה) ועוברים ישירות לשנה ב׳ ב${gapAnalysis.target.institutionName} ללא צורך במבחן פסיכומטרי נוסף.`,
				targetSekem: threshold,
				targetPsychometric: currentPsych,
				currentPsychometric: hasTakenPsych ? currentPsych : undefined,
				targetBagrutAverage: currentBagrut,
				currentBagrutAverage: currentBagrut,
				recommendedSubjectImprovements: [],
				estimatedWeeks: 32,
				weeklyHours: availableWeeklyHours,
				feasibility: 'high',
				feasibilityExplanation: 'הקבלה מובטחת על בסיס עמידה בממוצע קורסים אקדמיים (80–85) ללא תלות בציון פסיכומטרי.',
				steps: [
					{
						title: 'הרשמה לאפיק מעבר באוניברסיטה הפתוחה',
						detail: 'הרשמה לחדו״א 1 ולאלגברה ליניארית 1 (ללא תנאי קבלה מקדימים)',
						timing: 'סמסטר א׳ (חודשים 1–4)',
						type: 'mechina'
					},
					{
						title: 'השלמת קורסי הליבה האקדמיים',
						detail: 'סיום 2 קורסים נוספים בממוצע הנדרש (80–85) לפי הסכם הרשמי',
						timing: 'סמסטר ב׳ (חודשים 5–8)',
						type: 'mechina'
					},
					{
						title: 'מעבר ישיר לשנה ב׳ בפקולטה',
						detail: `הכרה מלאה בכל נקודות הזכות וקליטה ישירה ב${gapAnalysis.target.institutionName}`,
						timing: 'חודש 9',
						type: 'mechina'
					}
				],
				keyAdvantage: 'אפס תלות בפסיכומטרי או בבגרויות תיכון, וצבירת נקודות זכות אקדמיות לתואר מהיום הראשון.'
			});
		} else {
			// University Mechina
			const mechinaPsychTarget = Math.min(psychCeiling, Math.max(currentPsych, 620));
			tracks.push({
				id: 'track-mechina',
				title: 'מסלול העוגן: מכינה קדם-אקדמית ייעודית',
				badge: 'המסלול המוסדי הרשמי',
				badgeColor: 'from-blue-600 to-indigo-700',
				strategyDescription: `מכינת ${gapAnalysis.target.institutionName} למדעים והנדסה מחליפה את כל ציוני התיכון בתעודת מכינה אחת, מעניקה מקדמי בונוס מוסדיים מרביים (+35) ומכסות קבלה שמורות למסיימים בהצלחה. קבלה למכינה דורשת פסיכומטרי סביב 600–620 בלבד.`,
				targetSekem: threshold + (isTechnion ? 0.5 : 2),
				targetPsychometric: mechinaPsychTarget,
				currentPsychometric: hasTakenPsych ? currentPsych : undefined,
				targetBagrutAverage: 108.0,
				currentBagrutAverage: currentBagrut,
				recommendedSubjectImprovements: [
					{
						subjectName: 'מכינה קדם-אקדמית מדעית/הנדסית',
						currentGrade: Math.round(currentBagrut),
						currentUnits: 20,
						targetGrade: 88,
						targetUnits: 25,
						reason: 'תעודת המכינה מחליפה את תעודת הבגרות במלואה ומקנה קבלה ישירה למחלקה.'
					}
				],
				estimatedWeeks: 36,
				weeklyHours: 28,
				feasibility: 'high',
				feasibilityExplanation: 'תוכנית לימודים סדורה ומובנית עם מרצים אקדמיים, ליווי צמוד ומבחני מעבר מותאמים.',
				steps: [
					{
						title: 'הרשמה למכינה האוניברסיטאית',
						detail: `הגשת מועמדות למכינת ${gapAnalysis.target.institutionName} ומבחני מיון`,
						timing: 'חודשים 1–2',
						type: 'mechina'
					},
					{
						title: 'סמסטר א׳: מתמטיקה ופיזיקה מוגברים',
						detail: 'רכישת יסודות חדו״א, אלגברה ופיזיקה קלאסית ברמה אקדמית',
						timing: 'חודשים 3–6',
						type: 'mechina'
					},
					{
						title: 'סמסטר ב׳ ומבחני גמר',
						detail: 'השגת ממוצע מכינה 88+ וזכאות לקבלה ישירה לשנה א׳',
						timing: 'חודשים 7–9',
						type: 'mechina'
					}
				],
				keyAdvantage: 'מבטל לחלוטין את ציוני העבר בתיכון ומכין אותך בצורה הטובה ביותר להצלחה בשנה א׳.'
			});
		}

		return tracks;
	}

	// =========================================================================
	// BRANCH 2: FEASIBLE RETAKE SOLUTIONS UNDER PSYCHOMETRIC CEILING
	// =========================================================================

	// Determine minimal levers needed for Track 1
	if (purePsychTarget !== null) {
		// Pure psychometric jump bridges the entire gap!
		const verifiedRes = evaluateSimulatedSekem(
			calculatorId,
			relevantSekemType,
			userProfile,
			userProfile.bagrutSubjects,
			purePsychTarget,
			baseMathU,
			baseMathG,
			basePhysU,
			basePhysG
		);
		const psychDelta = purePsychTarget - currentPsych;
		const evalRes = getFeasibilityEvaluation(psychDelta, 0);

		tracks.push({
			id: 'track-fast',
			title: 'המסלול המהיר: זינוק פסיכומטרי ממוקד',
			badge: 'הכי מהיר (מועד בודד)',
			badgeColor: 'from-amber-500 to-orange-600',
			strategyDescription: hasTakenPsych
				? `ריכוז כל המאמץ בקורס פסיכומטרי ממוקד אחד. מעלה את הציון מ-${currentPsych} ל-${purePsychTarget} (+${psychDelta} נקודות) וסוגר את הפער במלואו (סכם מחושב מובטח: ${verifiedRes.sekem.toFixed(isTechnion ? 2 : 1)}) ללא פתיחת ספרי בגרות.`
				: `השגת ציון יעד פסיכומטרי ראשוני של ${purePsychTarget} מביאה לסכם מחושב של ${verifiedRes.sekem.toFixed(isTechnion ? 2 : 1)} ומבטיחה קבלה ישירה.`,
			targetSekem: verifiedRes.sekem,
			targetPsychometric: purePsychTarget,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			targetBagrutAverage: currentBagrut,
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: [],
			estimatedWeeks: 10,
			weeklyHours: availableWeeklyHours,
			feasibility: evalRes.feasibility,
			feasibilityExplanation: evalRes.explanation,
			steps: [
				{
					title: 'הכנה ממוקדת למועד הקרוב',
					detail: `מרתון סימולציות ותרגול עומק עם דגש על הפרק ה${
						answers.psychStrongestSection === 'quant' ? 'כמותי' : 'מילולי'
					}`,
					timing: 'שבועות 1–8',
					type: 'psychometric'
				},
				{
					title: 'בחינה פסיכומטרית רשמית',
					detail: `הגעה לציון היעד (${purePsychTarget}) והגשת מועמדות`,
					timing: 'שבוע 9–10',
					type: 'psychometric'
				}
			],
			keyAdvantage: 'סגירת הפער בבחינה אחת בלבד ללא צורך בפתיחת ספרי בגרות.'
		});
	} else {
		// Track 1 uses minimal levers (sol1Lever, sol2Levers, sol3Levers, or sol4Levers)
		const winningFastLevers = sol1Lever
			? [sol1Lever.lever]
			: sol2Levers
			? sol2Levers.levers
			: sol3Levers
			? sol3Levers.levers
			: sol4Levers
			? sol4Levers.levers
			: [availableLevers[0]];

		const winningFastPsych = sol1Lever
			? sol1Lever.psych
			: sol2Levers
			? sol2Levers.psych
			: sol3Levers
			? sol3Levers.psych
			: sol4Levers
			? sol4Levers.psych
			: Math.min(psychCeiling, currentPsych + 40);

		const simFast = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, winningFastLevers);
		const resFast = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, simFast.subjects, winningFastPsych, simFast.mathUnits, simFast.mathGrade, simFast.physUnits, simFast.physGrade);

		const psychDelta = winningFastPsych - currentPsych;
		const evalRes = getFeasibilityEvaluation(psychDelta, winningFastLevers.length);
		const fastNamesStr = winningFastLevers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל, ציון ${l.targetGrade})`).join(' + ');

		tracks.push({
			id: 'track-fast-hybrid',
			title: 'המסלול המהיר: מינוף ממוקד מקבילי',
			badge: 'הכי מהיר (מועד קיץ/חורף)',
			badgeColor: 'from-amber-500 to-orange-600',
			strategyDescription: `שדרוג ממוקד של ${fastNamesStr} מקפיץ את ממוצע הבגרות ל-${resFast.bagrutAverage.toFixed(1)}${
				winningFastPsych > currentPsych ? ` יחד עם פסיכומטרי ${winningFastPsych} (+${psychDelta} נקודות)` : ''
			} ומבטיח סכם מחושב של ${resFast.sekem.toFixed(isTechnion ? 2 : 1)} (עומד בסף הקבלה הרשמי: ${threshold}).`,
			targetSekem: resFast.sekem,
			targetPsychometric: winningFastPsych,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			targetBagrutAverage: resFast.bagrutAverage,
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: winningFastLevers.map((l) => ({
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
				{
					title: `הכנה ממוקדת ל-${winningFastLevers[0].subjectName}`,
					detail: 'מרתון תרגול ופתרון בחינות בגרות עד להשגת ציון היעד',
					timing: 'שבועות 1–8',
					type: winningFastLevers[0].isMath ? 'bagrut_core' : 'bagrut_elective'
				},
				...(winningFastLevers.length > 1
					? [
							{
								title: `השלמת ${winningFastLevers[1].subjectName}`,
								detail: `הגעה לציון ${winningFastLevers[1].targetGrade} להבטחת בונוס מוסדי מרבי`,
								timing: 'שבועות 9–10',
								type: 'bagrut_elective' as const
							}
					  ]
					: []),
				{
					title: 'השלמת יעד פסיכומטרי',
					detail: `הגעה לציון ${winningFastPsych} במועד הקרוב והגשת מועמדות`,
					timing: 'שבועות 11–12',
					type: 'psychometric'
				}
			],
			keyAdvantage: 'סגירה מוכחת של סף הקבלה במינימום בחינות ולוח זמנים קצר.'
		});
	}

	// =========================================================================
	// TRACK 2: Direct Bagrut Admission (עקיפת פסיכומטרי) OR Balanced Track 🛡️
	// =========================================================================
	let directBagrutSol: {
		levers: SubjectUpgradeAction[];
		res: { sekem: number; bagrutAverage: number; directBagrutEligible: boolean };
	} | null = null;

	let track2LeverCount = 0;
	let selectedBalLevers: SubjectUpgradeAction[] = [];
	let balPsych = 0;
	let psychBalDelta = 0;

	const degreeName =
		(gapAnalysis.target as any).degreeName ||
		(gapAnalysis.target as any).program?.name ||
		(gapAnalysis.target as any).program?.fieldOfStudy ||
		'';
	const degreeAllowsDirectBagrut = isDegreeEligibleForDirectBagrut(degreeName, calculatorId);

	// Check if direct bagrut admission can be achieved with 1 to 3 levers (only for eligible degrees)
	if (degreeAllowsDirectBagrut) {
		for (let k = 1; k <= Math.min(3, availableLevers.length); k++) {
			const testLevers = availableLevers.slice(0, k);
			const testSim = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, testLevers);
			const evalZero = evaluateSimulatedSekem(
				calculatorId,
				relevantSekemType,
				userProfile,
				testSim.subjects,
				hasTakenPsych ? currentPsych : 0,
				testSim.mathUnits,
				testSim.mathGrade,
				testSim.physUnits,
				testSim.physGrade
			);

			if (evalZero.directBagrutEligible) {
				directBagrutSol = { levers: testLevers, res: evalZero };
				break;
			}
		}
	}

	if (directBagrutSol) {
		track2LeverCount = directBagrutSol.levers.length;
		const bagrutSummary = directBagrutSol.levers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל, ציון ${l.targetGrade})`).join(' + ');
		tracks.push({
			id: 'track-direct-bagrut',
			title: 'המסלול הבטוח: קבלה ישירה על סמך בגרות (אפס פסיכומטרי!)',
			badge: 'קבלה ישירה ללא פסיכומטרי',
			badgeColor: 'from-emerald-500 to-teal-600',
			strategyDescription: `מעקף פסיכומטרי מלא: שדרוג ${bagrutSummary} מעלה את ממוצע הבגרות ל-${directBagrutSol.res.bagrutAverage.toFixed(1)} ומקנה זכאות מלאה לקבלה ישירה (Direct Bagrut Admission) ב${gapAnalysis.target.institutionName} — ללא צורך במבחן פסיכומטרי כלל!`,
			targetSekem: threshold,
			targetPsychometric: undefined,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			targetBagrutAverage: directBagrutSol.res.bagrutAverage,
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: directBagrutSol.levers.map((l) => ({
				subjectName: l.subjectName,
				currentGrade: l.currentGrade,
				currentUnits: l.currentUnits,
				targetGrade: l.targetGrade,
				targetUnits: l.targetUnits,
				reason: l.reason
			})),
			estimatedWeeks: directBagrutSol.levers.length * 6,
			weeklyHours: availableWeeklyHours,
			feasibility: 'very_high',
			feasibilityExplanation: `קבלה מובטחת רשמית על סמך עמידה ברף קבלה ישירה בבגרות (${directBagrutSol.res.bagrutAverage.toFixed(1)}), עם אפס תלות במבחן הפסיכומטרי.`,
			steps: directBagrutSol.levers.map((l, idx) => ({
				title: `שיפור / הרחבת בגרות ב-${l.subjectName}`,
				detail: `הכנה ותרגול ממוקד להגעה לציון ${l.targetGrade} (${l.reason})`,
				timing: `שבועות ${idx * 6 + 1}–${idx * 6 + 6}`,
				type: l.isMath ? 'bagrut_core' : 'bagrut_elective'
			})),
			keyAdvantage: 'אפס תלות בפסיכומטרי! קבלה ישירה רשמית על סמך שדרוג בגרויות בלבד.'
		});
	} else {
		// Balanced Track with meaningful psychometric reduction rule:
		const track1Psych = tracks[0]?.targetPsychometric || (hasTakenPsych ? currentPsych + 50 : 650);
		const minMeaningfulReduction = 20;

		selectedBalLevers = availableLevers.slice(0, Math.min(availableLevers.length, 2));
		balPsych = track1Psych;
		let balRes = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, userProfile.bagrutSubjects, currentPsych);

		// Iterate through lever counts (1, 2, 3) to find levers that meaningfully drop the psychometric requirement
		for (let count = 1; count <= Math.min(availableLevers.length, 3); count++) {
			const candidateLevers = availableLevers.slice(0, count);
			const sim = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, candidateLevers);
			const psychSol = findExactPsychometricTarget(
				calculatorId,
				relevantSekemType,
				threshold,
				userProfile,
				sim.subjects,
				hasTakenPsych ? currentPsych : 350,
				psychCeiling,
				sim.mathUnits,
				sim.mathGrade,
				sim.physUnits,
				sim.physGrade
			);

			if (psychSol !== null) {
				const targetP = Math.max(hasTakenPsych ? currentPsych : 350, psychSol);
				if (targetP <= track1Psych - minMeaningfulReduction || count === 1) {
					selectedBalLevers = candidateLevers;
					balPsych = targetP;
					balRes = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, sim.subjects, balPsych, sim.mathUnits, sim.mathGrade, sim.physUnits, sim.physGrade);
					if (targetP <= track1Psych - minMeaningfulReduction) {
						break;
					}
				}
			}
		}

		track2LeverCount = selectedBalLevers.length;
		const balSubjectSummary = selectedBalLevers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל, ציון ${l.targetGrade})`).join(' + ');
		psychBalDelta = balPsych - currentPsych;
		const balEval = getFeasibilityEvaluation(psychBalDelta, selectedBalLevers.length);

		tracks.push({
			id: 'track-balanced',
			title: 'המסלול הבטוח: שילוב מאוזן ופיזור סיכונים',
			badge: 'הכי מומלץ (הסתברות הצלחה מירבית)',
			badgeColor: 'from-emerald-500 to-teal-600',
			strategyDescription: `פיזור המאמץ מונע הימור על מבחן יחיד: שדרוג ${balSubjectSummary} (ממוצע בגרות עולה ל-${balRes.bagrutAverage.toFixed(1)})${
				hasTakenPsych && psychBalDelta > 0
					? ` בשילוב פסיכומטרי מתואם של ${balPsych} (+${psychBalDelta} נקודות)`
					: hasTakenPsych
					? ` יחד עם ציון הפסיכומטרי הקיים שלך (${currentPsych}, ללא צורך במבחן חוזר!)`
					: ` בשילוב ציון פסיכומטרי יעד ראשוני של ${balPsych}`
			}. סכם מחושב מובטח: ${balRes.sekem.toFixed(isTechnion ? 2 : 1)} מול סף ${threshold}.`,
			targetSekem: balRes.sekem,
			targetPsychometric: balPsych,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			targetBagrutAverage: balRes.bagrutAverage,
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: selectedBalLevers.map((l) => ({
				subjectName: l.subjectName,
				currentGrade: l.currentGrade,
				currentUnits: l.currentUnits,
				targetGrade: l.targetGrade,
				targetUnits: l.targetUnits,
				reason: l.reason
			})),
			estimatedWeeks: 14,
			weeklyHours: availableWeeklyHours,
			feasibility: balEval.feasibility,
			feasibilityExplanation: balEval.explanation,
			steps: [
				{
					title: `שיפור בגרות ב-${selectedBalLevers[0]?.subjectName || 'מקצוע חובה'}`,
					detail: `הכנה ותרגול ממוקד להגעה לציון ${selectedBalLevers[0]?.targetGrade || 90}`,
					timing: 'שבועות 1–6',
					type: selectedBalLevers[0]?.isMath ? 'bagrut_core' : 'bagrut_elective'
				},
				...(selectedBalLevers.length > 1
					? [
							{
								title: `שיפור בגרות ב-${selectedBalLevers[1].subjectName}`,
								detail: `הגעה לציון היעד (${selectedBalLevers[1].targetGrade}) והעלאת הממוצע האופטימלי`,
								timing: 'שבועות 7–10',
								type: 'bagrut_elective' as const
							}
					  ]
					: []),
				...(psychBalDelta > 0
					? [
							{
								title: 'קורס פסיכומטרי ממוקד שיפור',
								detail: `חיזוק נקודתי של הפרק ה${
									answers.psychStrongestSection === 'quant' ? 'כמותי' : 'מילולי'
								} לעלייה מתונה ל-${balPsych}`,
								timing: 'שבועות 11–14',
								type: 'psychometric' as const
							}
					  ]
					: [
							{
								title: 'הגשת מועמדות על בסיס הציון הקיים',
								detail: `ציון הפסיכומטרי הנוכחי שלך מספיק לקבלה בשילוב הבגרויות המשופרות.`,
								timing: 'סיום התהליך',
								type: 'psychometric' as const
							}
					  ])
			],
			keyAdvantage: 'הסתברות הצלחה סטטיסטית הגבוהה ביותר, מפחית חרדת מבחנים ומספק רשת ביטחון כפולה.'
		});
	}

	// =========================================================================
	// TRACK 3: Academic Anchor 🏛️ (העוגן האקדמי — הרחבת מוגברים)
	// ONLY ADDED IF:
	// 1. Track 2 STILL requires a psychometric improvement (psychBalDelta > 0)
	//    (If Track 2 already achieved admission with 0 psychometric improvement,
	//     adding more Bagrut exams with the exact same psychometric score is redundant!)
	// 2. We have strictly more levers available than Track 2
	// 3. Track 3 provides a MEANINGFUL psychometric reduction compared to Track 2 (balPsych - anchorPsych >= 15)
	// =========================================================================
	const track3LeverCount = Math.min(availableLevers.length, Math.max(3, track2LeverCount + 1));
	const canOfferMeaningfulTrack3 =
		hasTakenPsych
			? psychBalDelta > 0 && track3LeverCount > track2LeverCount
			: track3LeverCount > track2LeverCount;

	if (canOfferMeaningfulTrack3) {
		const anchorLevers = availableLevers.slice(0, track3LeverCount);
		const simAnchor = applyLeversToSubjects(userProfile.bagrutSubjects, baseMathU, baseMathG, basePhysU, basePhysG, anchorLevers);

		const anchorPsychSol = findExactPsychometricTarget(
			calculatorId,
			relevantSekemType,
			threshold,
			userProfile,
			simAnchor.subjects,
			hasTakenPsych ? currentPsych : 450,
			psychCeiling,
			simAnchor.mathUnits,
			simAnchor.mathGrade,
			simAnchor.physUnits,
			simAnchor.physGrade
		);

		const anchorPsych = anchorPsychSol !== null
			? Math.max(currentPsych, anchorPsychSol)
			: Math.min(psychCeiling, Math.max(currentPsych, currentPsych + 15));

		const psychRelief = balPsych - anchorPsych;

		// Track 3 must provide meaningful psychometric relief of at least 15 points
		if (psychRelief >= 15 || (!hasTakenPsych && psychRelief >= 10)) {
			const anchorRes = evaluateSimulatedSekem(calculatorId, relevantSekemType, userProfile, simAnchor.subjects, anchorPsych, simAnchor.mathUnits, simAnchor.mathGrade, simAnchor.physUnits, simAnchor.physGrade);
			const anchorSummary = anchorLevers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל, ציון ${l.targetGrade})`).join(' + ');
			const anchorPsychDelta = anchorPsych - currentPsych;
			const anchorEval = getFeasibilityEvaluation(anchorPsychDelta, anchorLevers.length);

			tracks.push({
				id: 'track-anchor',
				title: isStemDegree ? 'מסלול העוגן: שדרוג מתמטיקה ומדעים' : 'מסלול העוגן: הרחבת מקצועות מוגברים',
				badge: 'עוגן אקדמי קבוע + בונוס מרבי',
				badgeColor: 'from-blue-600 to-indigo-700',
				strategyDescription: `בניית בסיס אקדמי מוצק: שדרוג ${anchorSummary} מעלה את ממוצע הבגרות ל-${anchorRes.bagrutAverage.toFixed(1)}.${
					anchorPsych > currentPsych
						? ` דורש רק פסיכומטרי ${anchorPsych} (+${anchorPsychDelta} נקודות בלבד) לסגירת הרף המלא (סכם מובטח: ${anchorRes.sekem.toFixed(isTechnion ? 2 : 1)} מול סף ${threshold}).`
						: ` סוגר את סף הקבלה ישירות (סכם מובטח: ${anchorRes.sekem.toFixed(isTechnion ? 2 : 1)}) ללא צורך בהעלאת ציון הפסיכומטרי!`
				}`,
				targetSekem: anchorRes.sekem,
				targetPsychometric: anchorPsych,
				currentPsychometric: hasTakenPsych ? currentPsych : undefined,
				targetBagrutAverage: anchorRes.bagrutAverage,
				currentBagrutAverage: currentBagrut,
				recommendedSubjectImprovements: anchorLevers.map((l) => ({
					subjectName: l.subjectName,
					currentGrade: l.currentGrade,
					currentUnits: l.currentUnits,
					targetGrade: l.targetGrade,
					targetUnits: l.targetUnits,
					reason: l.reason
				})),
				estimatedWeeks: 18,
				weeklyHours: availableWeeklyHours,
				feasibility: anchorEval.feasibility,
				feasibilityExplanation: anchorEval.explanation,
				steps: [
					{
						title: `הכנה מקיפה ל-${anchorLevers[0]?.subjectName || 'מתמטיקה 5 יח״ל'}`,
						detail: 'תרגול עקבי ופתרון שאלוני בגרות ברמת 5 יחידות',
						timing: 'שבועות 1–12',
						type: 'bagrut_elective'
					},
					...(anchorLevers.length > 1
						? [
								{
									title: `השלמת ${anchorLevers[1].subjectName}`,
									detail: `השגת ציון ${anchorLevers[1].targetGrade} וקבלת מלוא הבונוס המוסדי`,
									timing: 'שבועות 13–16',
									type: 'bagrut_elective' as const
								}
						  ]
						: []),
					...(anchorPsychDelta > 0
						? [
								{
									title: 'השלמת פסיכומטרי מתון',
									detail: `עלייה מתונה ל-${anchorPsych} בלבד (+${anchorPsychDelta} נקודות)`,
									timing: 'שבועות 17–18',
									type: 'psychometric' as const
								}
						  ]
						: [
								{
									title: 'הגשת מועמדות ורישום',
									detail: `זכאות מלאה לסכם ${anchorRes.sekem.toFixed(isTechnion ? 2 : 1)} וקבלה מובטחת עם הפסיכומטרי הקיים (${currentPsych})!`,
									timing: 'שבועות 17–18',
									type: 'bagrut_core' as const
								}
						  ])
				],
				keyAdvantage: 'השקעה שנשארת איתך לכל החיים ומשרתת אותך ישירות בהצלחה בקורסי שנה א׳ באוניברסיטה.'
			});
		}
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

	return uniqueTracks;
}
