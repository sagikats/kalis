/**
 * Pure University of Haifa (אוניברסיטת חיפה) Admission Calculator
 * Official Formula: BT = Bagrut_Average * 10 - 330; Sekem = 0.5 * BT + 0.5 * Psychometric
 * Subagent 3: Data Verification & Institution Calculators
 */

import {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult
} from './types';
import { computeOptimalAverage } from './optimalAverage';
import {
	isArabic,
	isBible,
	isCoreScience,
	isEnglish,
	isHebrewExpression,
	isHistory,
	isLiterature,
	isMath
} from './subjectMatchers';


const HAIFA_MANDATORY_SUBJECTS = [
	'מתמטיקה',
	'אנגלית',
	'אזרחות',
	'הבעה עברית',
	'לשון',
	'היסטוריה',
	'ספרות',
	'תנ״ך',
	'תנ"ך'
];

export function isHaifaMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return HAIFA_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

/**
 * Official Haifa bonus table (haifa.ac.il — חישוב סכם), granted for a grade of 60+:
 * math 5u +35 / 4u +20;
 * English, physics, chemistry, biology, Bible, history, literature, Arabic, Hebrew 5u +25 / 4u +20;
 * every other subject 5u +20 / 4u +10.
 */
export function getHaifaBonus(subject: CalculatorSubject): number {
	if (subject.grade < 60) return 0;
	const n = subject.name;

	if (isMath(n)) {
		if (subject.units >= 5) return 35;
		if (subject.units === 4) return 20;
		return 0;
	}

	const isCore =
		isEnglish(n) ||
		isCoreScience(n) ||
		isBible(n) ||
		isHistory(n) ||
		isLiterature(n) ||
		isArabic(n) ||
		isHebrewExpression(n);

	if (subject.units >= 5) return isCore ? 25 : 20;
	if (subject.units === 4) return isCore ? 20 : 10;
	return 0;
}

export function calculateHaifaOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	return computeOptimalAverage(subjects, {
		isMandatory: isHaifaMandatorySubject,
		getBonus: getHaifaBonus,
		dropReason: 'השמטה חוקית בחיפה: שקלול המקצוע הוריד את הממוצע האופטימלי'
	});
}

/** BT = bagrut average * 10 - 330 (haifa.ac.il — חישוב סכם). */
function haifaBagrutStandard(bagrutAverage: number): number {
	return Math.round((bagrutAverage * 10 - 330) * 10) / 10;
}

/** Standard Haifa sekem, 1:1 weighting: (BT + PC) / 2. */
export function calculateHaifaSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const rawSekem = 0.5 * haifaBagrutStandard(bagrutAverage) + 0.5 * psychometric;
	// The published formula has no upper bound (BT alone reaches 840 at an average of 117)
	return Math.max(200, Math.round(rawSekem));
}

/**
 * Haifa math-weighted psychometric score: PM = 0.514554 * (6Q + 4V + 1E) - 65.3,
 * where Q/V/E are the section scores (50–150).
 */
export function calculateHaifaMathPsychometric(quant: number, verbal: number, english: number): number {
	if (quant <= 0 || verbal <= 0 || english <= 0) return 0;
	return 0.514554 * (6 * quant + 4 * verbal + english) - 65.3;
}

/** Mathematical programs: 1:3 weighting with the math-weighted psychometric — (BT + 3PM) / 4. */
export function calculateHaifaMathSekem(bagrutAverage: number, mathPsychometric: number): number {
	if (bagrutAverage <= 0 || mathPsychometric <= 0) return 0;
	const raw = (haifaBagrutStandard(bagrutAverage) + 3 * mathPsychometric) / 4;
	return Math.max(200, Math.round(raw));
}

export function evaluateHaifa(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateHaifaOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;
	const explicitQuant = input.psychometricQuantEmphasis && input.psychometricQuantEmphasis > 0
		? input.psychometricQuantEmphasis
		: undefined;
	const rawQuant = explicitQuant ?? (input.psychometricQuant && input.psychometricQuant > 0 ? input.psychometricQuant : psych);
	const quant = rawQuant > 0 && rawQuant <= 150 ? Math.round(200 + (rawQuant - 50) * 6) : rawQuant;

	const generalSekem = calculateHaifaSekem(optimal.average, psych);
	// Math programs use PM built from the section scores; fall back to the quantitative-emphasis score
	const qSub = input.psychometricQuant && input.psychometricQuant <= 150 ? input.psychometricQuant : 0;
	const vSub = input.psychometricVerbal && input.psychometricVerbal <= 150 ? input.psychometricVerbal : 0;
	const eSub = input.psychometricEnglish && input.psychometricEnglish <= 150 ? input.psychometricEnglish : 0;
	const mathPsych = calculateHaifaMathPsychometric(qSub, vSub, eSub) || quant;
	const engineeringSekem = calculateHaifaMathSekem(optimal.average, mathPsych);

	const directBagrutEligible = optimal.average >= 100;

	return {
		institutionId: 'haifa',
		institutionName: 'אוניברסיטת חיפה',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes: directBagrutEligible
			? ['ממוצע בגרות עומד ברף קבלה ישירה (100 ומעלה) באוניברסיטת חיפה לחוגים זכאים.']
			: [],
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name),
		subjectBreakdown: optimal.breakdown,
		bagrutCap: optimal.cap
	};
}
