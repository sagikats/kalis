import { SubjectInput } from './bguCalculator';

export interface HujiCalculatorInput {
	bagrutSubjects: SubjectInput[];
	psychometricGeneral: number;
	psychometricQuant?: number;
	mathGrade: number;
	mathUnits: number;
	physicsGrade?: number;
	physicsUnits?: number;
}

export interface HujiCalculatorResult {
	bagrutAverage: number;
	generalSekem: number; // ציון קבלה משוקלל בעברית (סולם 200-800)
	cognitiveScore: number; // ציון משוקלל קוגניטיבי רשמי
	engineeringSekem?: number;
	directBagrutEligible: boolean;
	optimalUnits: number;
	droppedSubjects: string[];
}

export interface OptimalHujiBagrutResult {
	average: number;
	optimalUnits: number;
	totalUnits: number;
	droppedSubjects: SubjectInput[];
	includedSubjects: SubjectInput[];
}

/**
 * Returns HUJI official bonus for a subject:
 * Bonuses apply only if grade >= 60:
 * - Mathematics 5 units: +35 points | 4 units: +15 points
 * - English 5 units: +25 points | 4 units: +15 points
 * - CS, Physics, Chemistry, Biology, Civics, History, Arabic, Literature, Bible, Jewish Philosophy:
 *   5 units: +25 points | 4 units: +15 points
 * - All other approved subjects: 5 units: +20 points | 4 units: +10 points
 */
export function getHujiSubjectBonus(sub: SubjectInput): number {
	if (sub.grade < 60) return 0;
	const n = sub.name.trim();

	if (n.includes('מתמטיקה')) {
		if (sub.units === 5) return 35;
		if (sub.units === 4) return 15;
		return 0;
	}

	if (n.includes('אנגלית')) {
		if (sub.units === 5) return 25;
		if (sub.units === 4) return 15;
		return 0;
	}

	if (sub.units === 5) {
		if (
			n.includes('פיזיקה') ||
			n.includes('כימיה') ||
			n.includes('ביולוגיה') ||
			n.includes('מדעי המחשב') ||
			n.includes('היסטוריה') ||
			n.includes('אזרחות') ||
			n.includes('ספרות') ||
			n.includes('תנ"ך') ||
			n.includes('ערבית') ||
			n.includes('מחשבת ישראל')
		) {
			return 25;
		}
		return 20;
	}

	if (sub.units === 4) {
		if (
			n.includes('פיזיקה') ||
			n.includes('כימיה') ||
			n.includes('ביולוגיה') ||
			n.includes('מדעי המחשב') ||
			n.includes('היסטוריה') ||
			n.includes('אזרחות') ||
			n.includes('ספרות') ||
			n.includes('תנ"ך') ||
			n.includes('ערבית') ||
			n.includes('מחשבת ישראל')
		) {
			return 15;
		}
		return 10;
	}

	return 0;
}

/**
 * Checks if a subject is mandatory and non-droppable according to HUJI official regulations:
 * Non-droppable:
 * - Mathematics
 * - English
 * - History
 * - Civics
 * - Hebrew Expression (הבעה עברית)
 *
 * Droppable:
 * - Electives
 * - Literature (2 units) and Bible (2 units) are droppable if remaining units >= 20 and an advanced subject exists.
 */
export function isHujiMandatorySubject(name: string): boolean {
	const n = name.trim();
	if (n.includes('מתמטיקה')) return true;
	if (n.includes('אנגלית')) return true;
	if (n.includes('אזרחות')) return true;
	if (n.includes('הבעה') || n.includes('עברית') || n.includes('לשון')) return true;
	if (
		n.includes('היסטוריה') ||
		n.includes('תע"י') ||
		n.includes('תולדות עם ישראל') ||
		n.includes('ידע העם והמדינה')
	)
		return true;
	return false;
}

/**
 * Calculates HUJI Optimal Bagrut Average:
 * Minimizes dragging grades while maintaining minimum 20 units and at least 1 advanced subject (>= 4 units) other than English.
 */
export function calculateOptimalHujiBagrut(subjects: SubjectInput[]): OptimalHujiBagrutResult {
	if (!subjects || subjects.length === 0) {
		return {
			average: 0,
			optimalUnits: 0,
			totalUnits: 0,
			droppedSubjects: [],
			includedSubjects: []
		};
	}

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) {
		return {
			average: 0,
			optimalUnits: 0,
			totalUnits: 0,
			droppedSubjects: [],
			includedSubjects: []
		};
	}

	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const mandatorySubs = activeSubs.filter((s) => isHujiMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isHujiMandatorySubject(s.name));

	if (totalActiveUnits < 20 || droppableSubs.length === 0) {
		let totalScore = 0;
		for (const s of activeSubs) {
			totalScore += (s.grade + getHujiSubjectBonus(s)) * s.units;
		}
		const rawAvg = Math.round((totalScore / totalActiveUnits) * 100) / 100;
		return {
			average: Math.min(125, rawAvg),
			optimalUnits: totalActiveUnits,
			totalUnits: totalActiveUnits,
			droppedSubjects: [],
			includedSubjects: activeSubs
		};
	}

	const candidates = droppableSubs.slice(0, 12);
	let bestAvg = 0;
	let bestUnits = 0;
	let bestDropped: SubjectInput[] = [];
	let bestIncluded: SubjectInput[] = activeSubs;

	const numSubsets = 1 << candidates.length;
	for (let mask = 0; mask < numSubsets; mask++) {
		const currentIncluded = [...mandatorySubs];
		const currentDropped: SubjectInput[] = [];

		for (let i = 0; i < candidates.length; i++) {
			if ((mask & (1 << i)) !== 0) {
				currentIncluded.push(candidates[i]);
			} else {
				currentDropped.push(candidates[i]);
			}
		}

		const currentUnits = currentIncluded.reduce((sum, s) => sum + s.units, 0);
		if (currentUnits < 20) continue;

		const hasAdvanced = currentIncluded.some(
			(s) => !s.name.includes('אנגלית') && s.units >= 4
		);
		if (!hasAdvanced) continue;

		let currentScore = 0;
		for (const s of currentIncluded) {
			currentScore += (s.grade + getHujiSubjectBonus(s)) * s.units;
		}

		const avg = Math.round((currentScore / currentUnits) * 100) / 100;
		if (avg > bestAvg || (avg === bestAvg && currentUnits > bestUnits)) {
			bestAvg = avg;
			bestUnits = currentUnits;
			bestDropped = currentDropped;
			bestIncluded = currentIncluded;
		}
	}

	return {
		average: Math.min(125, bestAvg),
		optimalUnits: bestUnits,
		totalUnits: totalActiveUnits,
		droppedSubjects: bestDropped,
		includedSubjects: bestIncluded
	};
}

/**
 * Calculates HUJI Official Cognitive and Scaled Sekem:
 * 1. Cognitive score (ציון משוקלל קוגניטיבי):
 *    B = 3.9630 * (bagrut / 10) - 20.0621
 *    P = 0.032073 * psychometric + 0.3672
 *    X = 0.5 * B + 0.5 * P
 * 2. National 200-800 Scale:
 *    BT = bagrut * 10 - 330
 *    Sekem = 0.5 * psychometric + 0.5 * BT
 */
export function calculateHujiSekem(
	bagrutAverage: number,
	psychometric: number
): { sekem: number; cognitive: number } {
	if (bagrutAverage <= 0 || psychometric <= 0) return { sekem: 0, cognitive: 0 };

	const bag10 = bagrutAverage / 10;
	const B = 3.963 * bag10 - 20.0621;
	const P = 0.032073 * psychometric + 0.3672;
	const X = 0.5 * B + 0.5 * P;

	const BT = bagrutAverage * 10 - 330;
	const rawSekem = 0.5 * psychometric + 0.5 * BT;
	const sekem = Math.min(800, Math.max(200, Math.round(rawSekem)));

	return {
		sekem,
		cognitive: Math.round(X * 1000) / 1000
	};
}

/**
 * Calculates full HUJI Admission Evaluation
 */
export function calculateHujiAdmission(input: HujiCalculatorInput): HujiCalculatorResult {
	const optimal = calculateOptimalHujiBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral;
	const quant =
		input.psychometricQuant && input.psychometricQuant > 0 ? input.psychometricQuant : psych;

	const { sekem: generalSekem, cognitive: cognitiveScore } = calculateHujiSekem(
		optimal.average,
		psych
	);
	const { sekem: engineeringSekem } = calculateHujiSekem(optimal.average, quant);

	const directBagrutEligible = optimal.average >= 105;

	return {
		bagrutAverage: optimal.average,
		generalSekem,
		cognitiveScore,
		engineeringSekem,
		directBagrutEligible,
		optimalUnits: optimal.optimalUnits,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
