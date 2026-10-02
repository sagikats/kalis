/**
 * Pure Reichman University (אוניברסיטת רייכמן - הבינתחומי הרצליה) Admission Calculator
 *
 * Verified against Reichman's official calculator (runi.ac.il/bagrutexamscalculator):
 *  - bonus table and mandatory subjects read from the calculator's own per-subject output;
 *  - "ציון מתואם" (adjusted score) formula fitted on 9 official results, exact to ±0.02.
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
	isBible,
	isCivics,
	isCoreScience,
	isEnglish,
	isHebrewExpression,
	isHistory,
	isLiterature,
	isMath
} from './subjectMatchers';

/**
 * Always included at Reichman: math, English, history, civics, Hebrew expression.
 * Bible and literature are shown as "חובה" on the form but are dropped when they lower the average.
 */
export function isReichmanMandatorySubject(name: string): boolean {
	return isMath(name) || isEnglish(name) || isHistory(name) || isCivics(name) || isHebrewExpression(name);
}

/**
 * Reichman bonus table (official calculator output), for a grade of 60+:
 * 5u: math +35; English, Bible, literature, history, physics, chemistry, biology +25; any other subject +20.
 * 4u: math and English +12.5; any other subject +10.
 */
export function getReichmanBonus(subject: CalculatorSubject): number {
	if (subject.grade < 60) return 0;
	const n = subject.name;

	if (subject.units >= 5) {
		if (isMath(n)) return 35;
		if (isEnglish(n) || isBible(n) || isLiterature(n) || isHistory(n) || isCoreScience(n)) return 25;
		return 20;
	}

	if (subject.units === 4) {
		if (isMath(n) || isEnglish(n)) return 12.5;
		return 10;
	}

	return 0;
}

export function calculateReichmanOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	return computeOptimalAverage(subjects, {
		isMandatory: isReichmanMandatorySubject,
		getBonus: getReichmanBonus,
		dropReason: 'השמטה חוקית ברייכמן: שקלול המקצוע הוריד את הממוצע האופטימלי'
	});
}

/**
 * Reichman "ציון מתואם" (bagrut + psychometric), fitted to the official calculator:
 *   score = 4.8133 * average + 0.5129 * psychometric - 163.21   (two decimals; not bounded at 800)
 */
export function calculateReichmanAdjustedScore(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const raw = 4.813342 * bagrutAverage + 0.512916 * psychometric - 163.209781;
	return Math.round(raw * 100) / 100;
}

/** Integer form used for threshold comparison. */
export function calculateReichmanGeneralSekem(bagrutAverage: number, psychometric: number): number {
	return Math.round(calculateReichmanAdjustedScore(bagrutAverage, psychometric));
}

export function evaluateReichman(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateReichmanOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;

	const generalSekem = calculateReichmanGeneralSekem(optimal.average, psych);
	const officialScore = calculateReichmanAdjustedScore(optimal.average, psych);

	// Direct Bagrut Admission in Reichman:
	// Available for Bagrut >= 100.0 across Law, Business, Psychology, Economics, Government, Communications
	const directBagrutEligible = optimal.average >= 100.0;

	const notes: string[] = [];
	if (officialScore > 0) {
		notes.push(`ציון מתואם (נוסחת רייכמן): ${officialScore.toFixed(2)}`);
	}
	if (directBagrutEligible) {
		notes.push('ממוצע בגרות עומד ברף קבלה ישירה (100.0 ומעלה) באוניברסיטת רייכמן למשפטים, מנהל עסקים וחוגים נבחרים.');
	}
	if (optimal.droppedSubjects.length > 0) {
		notes.push(`הושמטו ${optimal.droppedSubjects.length} מקצועות בחירה לטובת מקסום הממוצע האופטימלי.`);
	}

	return {
		institutionId: 'reichman',
		institutionName: 'אוניברסיטת רייכמן (הבינתחומי)',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		// Reichman publishes a single adjusted score for all programs
		engineeringSekem: generalSekem,
		officialScore: officialScore || undefined,
		directBagrutEligible,
		notes,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
