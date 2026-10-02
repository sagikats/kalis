/**
 * Pure Bar-Ilan University (אוניברסיטת בר-אילן) Admission Calculator
 * Official Formulas: General Sekem & Exact Sciences/Engineering Sekem
 * Bagrut average: verified against the official page (bonus table, droppable subjects, no cap).
 * ⚠️ Sekem formula NOT verified — Bar-Ilan's real admission score is on a ~0–100 scale; this is an estimate.
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
 * Always included at Bar-Ilan: Hebrew, English, math, history, civics.
 * Bible, literature and Jewish thought may be dropped when they lower the average
 * (biu.ac.il — חישוב ממוצע בגרות).
 */
export function isBarIlanMandatorySubject(name: string): boolean {
	return isMath(name) || isEnglish(name) || isHistory(name) || isCivics(name) || isHebrewExpression(name);
}

/** Talmud / Oral Torah / halacha — part of Bar-Ilan's enhanced-bonus group. */
const isTalmudOrHalacha = (name: string) =>
	name.includes('תושב"ע') || name.includes('תושב״ע') || name.includes('תלמוד') || name.includes('הלכה');

/**
 * Official Bar-Ilan bonus table (biu.ac.il/registration-and-admission/information/general-admission-req/matriculation-calculation),
 * granted for a grade of 60+:
 * - math: 5u +35 / 4u +15
 * - Bible, Talmud, halacha, Jewish thought, history, civics, literature, chemistry, biology, physics,
 *   English, computer science: 5u +25 / 4u +12.5
 * - any other subject: 5u +20 / 4u +10
 */
export function getBarIlanBonus(subject: CalculatorSubject): number {
	if (subject.grade < 60) return 0;
	const n = subject.name;

	if (isMath(n)) {
		if (subject.units >= 5) return 35;
		if (subject.units === 4) return 15;
		return 0;
	}

	const isEnhanced =
		isBible(n) ||
		isTalmudOrHalacha(n) ||
		isJewishThought(n) ||
		isHistory(n) ||
		isCivics(n) ||
		isLiterature(n) ||
		isCoreScience(n) ||
		isEnglish(n) ||
		isComputerScience(n);

	if (subject.units >= 5) return isEnhanced ? 25 : 20;
	if (subject.units === 4) return isEnhanced ? 12.5 : 10;
	return 0;
}

export function calculateBarIlanOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	return computeOptimalAverage(subjects, {
		isMandatory: isBarIlanMandatorySubject,
		getBonus: getBarIlanBonus,
		dropReason: 'השמטה חוקית בבר-אילן: שקלול המקצוע הוריד את הממוצע האופטימלי'
	});
}

export function calculateBarIlanGeneralSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const bt = Math.round((bagrutAverage * 10 - 330) * 10) / 10;
	const rawSekem = 0.5 * psychometric + 0.5 * bt;
	return Math.min(800, Math.max(200, Math.round(rawSekem)));
}

/**
 * Calculates Bar-Ilan Engineering & Exact Sciences Sekem (סכם הנדסה ומדעים מדויקים):
 * In Bar-Ilan Engineering Faculty:
 * Formula places 55% weight on Quantitative Psychometric and 45% on Bagrut standing
 */
export function calculateBarIlanEngineeringSekem(
	bagrutAverage: number,
	quant: number,
	mathUnits: number = 4,
	mathGrade: number = 80
): number {
	if (bagrutAverage <= 0 || quant <= 0) return 0;
	const bt = Math.round((bagrutAverage * 10 - 330) * 10) / 10;

	// Bonus weight if 5 units math with high grade
	let mathFactor = 0;
	if (mathUnits === 5 && mathGrade >= 85) {
		mathFactor = 10;
	}

	const raw = 0.55 * quant + 0.45 * bt + mathFactor;
	return Math.min(800, Math.max(200, Math.round(raw)));
}

export function evaluateBarIlan(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateBarIlanOptimalBagrut(input.bagrutSubjects);
	const mathSub = input.bagrutSubjects.find((s) => s.name.includes('מתמטיקה'));
	const mathUnits = input.mathUnits ?? (mathSub ? mathSub.units : 4);
	const mathGrade = input.mathGrade ?? (mathSub ? mathSub.grade : 80);

	const psych = input.psychometricGeneral || 0;
	const explicitQuant = input.psychometricQuantEmphasis && input.psychometricQuantEmphasis > 0
		? input.psychometricQuantEmphasis
		: undefined;
	const rawQuant = explicitQuant ?? (input.psychometricQuant && input.psychometricQuant > 0 ? input.psychometricQuant : psych);
	const quant = rawQuant > 0 && rawQuant <= 150 ? Math.round(200 + (rawQuant - 50) * 6) : rawQuant;

	const generalSekem = calculateBarIlanGeneralSekem(optimal.average, psych);
	const engineeringSekem = calculateBarIlanEngineeringSekem(optimal.average, quant, mathUnits, mathGrade);

	// Bar-Ilan Direct Bagrut Admission: Available for Bagrut >= 102.0 in Humanities, Social Sciences, Jewish Studies
	const directBagrutEligible = optimal.average >= 102.0;

	const notes: string[] = ['ממוצע הבגרות מחושב לפי כללי בר-אילן הרשמיים; הסכם הוא הערכה — נוסחת הסכם טרם אומתה.'];
	if (directBagrutEligible) {
		notes.push('ממוצע בגרות עומד ברף קבלה ישירה (102.0 ומעלה) באוניברסיטת בר-אילן לחוגים זכאים.');
	}
	if (optimal.droppedSubjects.length > 0) {
		notes.push(`הושמטו ${optimal.droppedSubjects.length} מקצועות בחירה לטובת מקסום הממוצע האופטימלי.`);
	}

	return {
		institutionId: 'bar_ilan',
		institutionName: 'אוניברסיטת בר-אילן',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
