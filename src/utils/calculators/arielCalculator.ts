import { SubjectInput } from './bguCalculator';

export interface ArielCalculatorInput {
	bagrutSubjects: SubjectInput[];
	psychometricGeneral: number;
	psychometricQuant?: number;
	psychometricVerbal?: number;
	psychometricEnglish?: number;
	mathGrade: number;
	mathUnits: number;
	physicsGrade?: number;
	physicsUnits?: number;
}

export interface ArielCalculatorResult {
	bagrutAverage: number;
	generalSekem: number; // ציון קבלה משולב רשמי של אוניברסיטת אריאל (סולם 200-800)
	engineeringSekem?: number;
	directBagrutEligible: boolean;
	optimalUnits: number;
	droppedSubjects: string[];
}

export interface OptimalArielBagrutResult {
	average: number;
	optimalUnits: number;
	totalUnits: number;
	droppedSubjects: SubjectInput[];
	includedSubjects: SubjectInput[];
}

/**
 * Returns Ariel University official bonus for a subject:
 * Bonuses apply only if grade >= 60:
 * - Mathematics 5 units: +35 points | 4 units: +15 points
 * - English 5 units: +25 points | 4 units: +12.5 points
 * - Physics, Chemistry, Biology, Computer Science 5 units: +25 points
 * - Other 5 units: +20 points
 * - Other 4 units: +10 points
 */
export function getArielSubjectBonus(sub: SubjectInput): number {
	if (sub.grade < 60) return 0;
	const n = sub.name.trim();

	if (n.includes('מתמטיקה')) {
		if (sub.units === 5) return 35;
		if (sub.units === 4) return 15;
		return 0;
	}

	if (n.includes('אנגלית')) {
		if (sub.units === 5) return 25;
		if (sub.units === 4) return 12.5;
		return 0;
	}

	if (sub.units === 5) {
		if (
			n.includes('פיזיקה') ||
			n.includes('כימיה') ||
			n.includes('ביולוגיה') ||
			n.includes('מדעי המחשב') ||
			n.includes('הנדס') ||
			n.includes('ספרות') ||
			n.includes('תנ"ך') ||
			n.includes('היסטוריה')
		) {
			return 25;
		}
		return 20;
	}

	if (sub.units === 4) {
		return 10;
	}

	return 0;
}

/**
 * Checks if a subject is mandatory according to Ariel University:
 * Math, English, Civics, Hebrew, History, Literature, Bible.
 */
export function isArielMandatorySubject(name: string): boolean {
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
	if (n.includes('ספרות')) return true;
	if (n.includes('תנ"ך')) return true;
	return false;
}

/**
 * Calculates Ariel University Optimal Bagrut Average:
 * Drops additional electives that drag down average, maintaining mandatory subjects and >= 20 total units.
 */
export function calculateOptimalArielBagrut(subjects: SubjectInput[]): OptimalArielBagrutResult {
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
	const mandatorySubs = activeSubs.filter((s) => isArielMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isArielMandatorySubject(s.name));

	if (droppableSubs.length === 0) {
		let totalScore = 0;
		for (const s of activeSubs) {
			totalScore += (s.grade + getArielSubjectBonus(s)) * s.units;
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

	const candidates = droppableSubs.slice(0, 10);
	let bestAvg = 0;
	let bestUnits = totalActiveUnits;
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

		let totalScore = 0;
		for (const s of currentIncluded) {
			totalScore += (s.grade + getArielSubjectBonus(s)) * s.units;
		}

		const avg = Math.round((totalScore / currentUnits) * 100) / 100;
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
 * Calculates Ariel University Official Combined Admission Score (ציון קבלה משולב):
 * Official published formula:
 * Combined_Score = ((Bagrut_Average * 6.666) + Psychometric) / 2
 * Scale: 200 - 800
 */
export function calculateArielSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const raw = (bagrutAverage * 6.666 + psychometric) / 2;
	return Math.min(800, Math.max(200, Math.round(raw)));
}

/**
 * Calculates full Ariel University Admission Evaluation
 */
export function calculateArielAdmission(input: ArielCalculatorInput): ArielCalculatorResult {
	const optimal = calculateOptimalArielBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral;
	const quant =
		input.psychometricQuant && input.psychometricQuant > 0 ? input.psychometricQuant : psych;

	const generalSekem = calculateArielSekem(optimal.average, psych);
	const engineeringSekem = calculateArielSekem(optimal.average, quant);

	const directBagrutEligible = optimal.average >= 100;

	return {
		bagrutAverage: optimal.average,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		optimalUnits: optimal.optimalUnits,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
