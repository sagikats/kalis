/**
 * Pure Hebrew University of Jerusalem (האוניברסיטה העברית בירושלים) Admission Calculator
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
	isCivics,
	isComputerScience,
	isCoreScience,
	isEnglish,
	isHebrewExpression,
	isHistory,
	isJewishThought,
	isLiterature,
	isMath
} from './subjectMatchers';


/**
 * HUJI always includes English, math, history, civics and Hebrew expression;
 * all other subjects (incl. literature and Bible) are included only if they raise the average.
 */
export function isHujiMandatorySubject(name: string): boolean {
	return isMath(name) || isEnglish(name) || isHistory(name) || isCivics(name) || isHebrewExpression(name);
}

/**
 * Official HUJI bonus table (info.huji.ac.il/reception-components/Bagrut), granted for a grade of 60+:
 * math 5u +35 / 4u +15;
 * English, physics, chemistry, biology, CS, history, civics, literature, Bible, Arabic, Jewish thought 5u +25 / 4u +15;
 * every other subject 5u +20 / 4u +10.
 */
export function getHujiBonus(subject: CalculatorSubject): number {
	if (subject.grade < 60) return 0;
	const n = subject.name;

	if (isMath(n)) {
		if (subject.units >= 5) return 35;
		if (subject.units === 4) return 15;
		return 0;
	}

	const isEnhanced =
		isEnglish(n) ||
		isCoreScience(n) ||
		isComputerScience(n) ||
		isHistory(n) ||
		isCivics(n) ||
		isLiterature(n) ||
		isBible(n) ||
		isArabic(n) ||
		isJewishThought(n);

	if (subject.units >= 5) return isEnhanced ? 25 : 20;
	if (subject.units === 4) return isEnhanced ? 15 : 10;
	return 0;
}

export function calculateHujiOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	return computeOptimalAverage(subjects, {
		isMandatory: isHujiMandatorySubject,
		getBonus: getHujiBonus,
		dropReason: 'השמטה חוקית באוניברסיטה העברית: שקלול המקצוע הוריד את הממוצע האופטימלי'
	});
}

/** HUJI weighting variants (bagrut / psychometric). */
export type HujiWeighting = '50/50' | '30/70';

function hujiStandardized(bagrutAverage: number, psychometric: number) {
	return {
		B: 3.963 * (bagrutAverage / 10) - 20.0621,
		P: 0.032073 * psychometric + 0.3672
	};
}

/**
 * Official HUJI weighted score for one weighting variant
 * (info.huji.ac.il — קבלה על סמך בגרות ופסיכומטרי; reproduces the official threshold spreadsheet exactly):
 *   B = 3.963 * (bagrut / 10) - 20.0621        (bagrut on the 11.52 scale, not 115.2)
 *   P = 0.032073 * psychometric + 0.3672
 *   50/50: Y = 1.2422 * (0.5B + 0.5P) - 4.7609
 *   30/70: Y = 1.2235 * (0.3B + 0.7P) - 4.4598
 * Rounded to 3 decimals; scale ≈ 16–27.
 */
export function calculateHujiWeightedScoreFor(
	bagrutAverage: number,
	psychometric: number,
	weighting: HujiWeighting
): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const { B, P } = hujiStandardized(bagrutAverage, psychometric);
	const y = weighting === '50/50' ? 1.2422 * (0.5 * B + 0.5 * P) - 4.7609 : 1.2235 * (0.3 * B + 0.7 * P) - 4.4598;
	return Math.round(y * 1000) / 1000;
}

/** Best of both weightings ("שקלול מיטבי") — used when a program accepts either. */
export function calculateHujiWeightedScore(bagrutAverage: number, psychometric: number): number {
	return Math.max(
		calculateHujiWeightedScoreFor(bagrutAverage, psychometric, '50/50'),
		calculateHujiWeightedScoreFor(bagrutAverage, psychometric, '30/70')
	);
}

/**
 * Exact linear map from the official HUJI weighted score to the platform's 200–800 comparison scale
 * (1 official point = 25.1 psychometric-equivalent points). Program thresholds are stored on the
 * same scale via the same map, so comparisons are equivalent to comparing official scores.
 */
export function hujiScoreTo800(official: number): number {
	return official > 0 ? Math.round(25.0998 * official + 83.72) : 0;
}

export function calculateHujiSekem(bagrutAverage: number, psychometric: number): number {
	return hujiScoreTo800(calculateHujiWeightedScore(bagrutAverage, psychometric));
}

/**
 * HUJI programs fall into four rule sets (official threshold spreadsheet, 228 tracks). Each maps to one
 * of the platform's sekem slots, so a program's relevantSekemType selects the right rule set:
 *   generalSekem       — 50/50 or 30/70, best of general / verbal-emphasis / quant-emphasis psychometric
 *   managementSekem    — 50/50 or 30/70, best of general / quant-emphasis psychometric
 *   engineeringSekem   — 50/50 only, quant-emphasis psychometric (sciences, CS, engineering)
 *   quantitativeSekem  — 30/70 only, general psychometric (medicine, dentistry)
 */
export function evaluateHuji(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateHujiOptimalBagrut(input.bagrutSubjects);
	const avg = optimal.average;
	const general = input.psychometricGeneral || 0;
	const quantEmphasis = input.psychometricQuantEmphasis && input.psychometricQuantEmphasis > 0 ? input.psychometricQuantEmphasis : general;
	const verbalEmphasis = input.psychometricVerbalEmphasis && input.psychometricVerbalEmphasis > 0 ? input.psychometricVerbalEmphasis : general;

	const best = (psychs: number[], weightings: HujiWeighting[]) =>
		Math.max(0, ...psychs.flatMap((p) => weightings.map((w) => calculateHujiWeightedScoreFor(avg, p, w))));

	const officialGeneral = best([general, verbalEmphasis, quantEmphasis], ['50/50', '30/70']);
	const officialManagement = best([general, quantEmphasis], ['50/50', '30/70']);
	const officialEngineering = best([quantEmphasis], ['50/50']);
	const officialMedicine = best([general], ['30/70']);

	const directBagrutEligible = avg >= 105.0;

	const notes: string[] = [];
	if (officialGeneral > 0) {
		notes.push(`ציון משוקלל רשמי (נוסחת העברית): ${officialGeneral.toFixed(3)}`);
	}
	if (directBagrutEligible) {
		notes.push('ממוצע בגרות עומד ברף קבלה ישירה (105 ומעלה) לחוגים זכאים כגון פסיכולוגיה ומדעי החברה.');
	}

	return {
		institutionId: 'huji',
		institutionName: 'האוניברסיטה העברית בירושלים',
		bagrutAverage: avg,
		optimalUnits: optimal.optimalUnits,
		generalSekem: hujiScoreTo800(officialGeneral),
		managementSekem: hujiScoreTo800(officialManagement),
		engineeringSekem: hujiScoreTo800(officialEngineering),
		quantitativeSekem: hujiScoreTo800(officialMedicine),
		directBagrutEligible,
		officialScore: officialGeneral || undefined,
		notes,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name),
		subjectBreakdown: optimal.breakdown,
		bagrutCap: optimal.cap
	};
}
