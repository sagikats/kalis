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

/**
 * Official HUJI weighted score (info.huji.ac.il — קבלה על סמך בגרות ופסיכומטרי, נוסחת חישוב ציון משוקלל):
 *   B = 3.963 * (bagrut / 10) - 20.0621        (bagrut on the 11.52 scale, not 115.2)
 *   P = 0.032073 * psychometric + 0.3672
 *   50/50: Y = 1.2422 * (0.5B + 0.5P) - 4.7609
 *   30/70: Y = 1.2235 * (0.3B + 0.7P) - 4.4598
 * Candidates get the higher of the two ("שקלול מיטבי"). Rounded to 3 decimals; scale ≈ 16–27.
 */
export function calculateHujiWeightedScore(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const B = 3.963 * (bagrutAverage / 10) - 20.0621;
	const P = 0.032073 * psychometric + 0.3672;
	const y5050 = 1.2422 * (0.5 * B + 0.5 * P) - 4.7609;
	const y3070 = 1.2235 * (0.3 * B + 0.7 * P) - 4.4598;
	return Math.round(Math.max(y5050, y3070) * 1000) / 1000;
}

/**
 * HUJI sekem on the platform's 200–800 comparison scale (used against the stored program thresholds).
 * It is an exact linear re-scaling of the official weighted score above
 * (1 official point = 25.1 psychometric-equivalent points, anchored at bagrut 100 / psychometric 550 → 550),
 * so rankings and gaps match HUJI's own formula.
 */
export function calculateHujiSekem(bagrutAverage: number, psychometric: number): number {
	const official = calculateHujiWeightedScore(bagrutAverage, psychometric);
	if (official <= 0) return 0;
	return Math.round(25.0998 * official + 83.72);
}

export function evaluateHuji(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateHujiOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;
	const explicitQuant = input.psychometricQuantEmphasis && input.psychometricQuantEmphasis > 0
		? input.psychometricQuantEmphasis
		: undefined;
	const rawQuant = explicitQuant ?? (input.psychometricQuant && input.psychometricQuant > 0 ? input.psychometricQuant : psych);
	const quant = rawQuant > 0 && rawQuant <= 150 ? Math.round(200 + (rawQuant - 50) * 6) : rawQuant;

	const generalSekem = calculateHujiSekem(optimal.average, psych);
	const engineeringSekem = calculateHujiSekem(optimal.average, quant > psych ? quant : psych);
	const directBagrutEligible = optimal.average >= 105.0;
	const officialScore = calculateHujiWeightedScore(optimal.average, psych);

	const notes: string[] = [];
	if (officialScore > 0) {
		notes.push(`ציון משוקלל רשמי (נוסחת העברית): ${officialScore.toFixed(3)}`);
	}
	if (directBagrutEligible) {
		notes.push('ממוצע בגרות עומד ברף קבלה ישירה (105 ומעלה) לחוגים זכאים כגון פסיכולוגיה ומדעי החברה.');
	}

	return {
		institutionId: 'huji',
		institutionName: 'האוניברסיטה העברית בירושלים',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		officialScore: officialScore || undefined,
		notes,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
