/**
 * Pure Tel Aviv University (אוניברסיטת תל אביב) Admission Calculator
 * Official Formulas: General Sekem & Exact Engineering Sekem (פקולטה להנדסה)
 * Subagent 3: Data Verification & Institution Calculators
 */

import {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult
} from './types';
import { computeOptimalAverage } from './optimalAverage';
import { isBible, isCoreScience, isEnglish, isHistory, isLiterature, isMath } from './subjectMatchers';


/**
 * In TAU official calculator, only Math, English, Civics, Hebrew Expression, and History are strictly non-droppable.
 * Bible and Literature can be dropped in TAU's optimal calculation if total units remain >= 20.
 */
export function isTauMandatorySubject(name: string): boolean {
	const n = name.trim();
	if (n.includes('מתמטיקה')) return true;
	if (n.includes('אנגלית')) return true;
	if (n.includes('אזרחות')) return true;
	if (n.includes('הבעה') || n.includes('לשון') || (n.includes('עברית') && !n.includes('ספרות'))) return true;
	if (n.includes('היסטוריה') || n.includes('תע"י') || n.includes('תולדות עם ישראל') || n.includes('ידע העם והמדינה')) return true;
	return false;
}

/**
 * Official TAU bonus table (go.tau.ac.il/he/ba/how-to-calculate), granted for a grade of 60+:
 * math 5u +35 / 4u +12.5; English 5u +25 / 4u +12.5;
 * physics, chemistry, biology, literature, history, Bible 5u +25 (Arabic +25 only for Arabic-certificate holders);
 * every other subject 5u +20; any 4u subject +10.
 */
export function getTauBonus(subject: CalculatorSubject): number {
	if (subject.grade < 60) return 0;
	const n = subject.name;

	if (isMath(n)) {
		if (subject.units >= 5) return 35;
		if (subject.units === 4) return 12.5;
		return 0;
	}

	if (isEnglish(n)) {
		if (subject.units >= 5) return 25;
		if (subject.units === 4) return 12.5;
		return 0;
	}

	if (subject.units >= 5) {
		if (isCoreScience(n) || isLiterature(n) || isHistory(n) || isBible(n)) return 25;
		return 20;
	}

	if (subject.units === 4) return 10;
	return 0;
}

export function calculateTauOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	return computeOptimalAverage(subjects, {
		isMandatory: isTauMandatorySubject,
		getBonus: getTauBonus,
		dropReason: 'השמטה חוקית באת״א: שיפור הממוצע האופטימלי'
	});
}

export function calculateTauGeneralSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const capped = Math.min(bagrutAverage, 117);
	const step1 = capped * 9.62 - 349.9;
	const step2 = Math.round(step1 * 100) / 100;
	const raw = (step2 + psychometric) * 0.52 - 43.10;
	return Math.min(800, Math.max(200, Math.round(raw)));
}

export function calculateTauEngineeringSekem(
	bagrutAverage: number,
	quant: number,
	hasRealitBonus: boolean = false
): number {
	if (bagrutAverage <= 0 || quant <= 0) return 0;
	const capped = Math.min(bagrutAverage, 117);
	const step1 = capped * 9.62 - 349.9;
	const step2 = Math.round(step1 * 100) / 100;
	const raw = (step2 + quant) * 0.52 - 43.10;
	const withBonus = raw + (hasRealitBonus ? 10 : 0);
	return Math.min(800, Math.max(200, Math.round(withBonus)));
}

export function calculateTauManagementSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const capped = Math.min(bagrutAverage, 117);
	const step1 = capped * 9.62 - 349.9;
	const step2 = Math.round(step1 * 100) / 100;
	const raw = 0.3 * step2 + 0.7 * psychometric - 11.5;
	return Math.min(800, Math.max(200, Math.round(raw)));
}

export function evaluateTau(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateTauOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;
	const explicitQuant = input.psychometricQuantEmphasis && input.psychometricQuantEmphasis > 0
		? input.psychometricQuantEmphasis
		: undefined;
	const rawQuant = explicitQuant ?? (input.psychometricQuant && input.psychometricQuant > 0 ? input.psychometricQuant : psych);
	const quant = rawQuant > 0 && rawQuant <= 150 ? Math.round(200 + (rawQuant - 50) * 6) : rawQuant;

	const mathSub = input.bagrutSubjects.find((s) => s.name.includes('מתמטיקה'));
	const effMathUnits = input.mathUnits || (mathSub ? mathSub.units : 0);
	const effMathGrade = input.mathGrade || (mathSub ? mathSub.grade : 0);

	const physSub = input.bagrutSubjects.find((s) => s.name.includes('פיזיקה'));
	const effPhysUnits = input.physicsUnits !== undefined ? input.physicsUnits : (physSub ? physSub.units : 0);
	const effPhysGrade = input.physicsGrade !== undefined ? input.physicsGrade : (physSub ? physSub.grade : 0);

	const hasRealitBonus =
		effMathUnits === 5 &&
		effMathGrade >= 55 &&
		effPhysUnits === 5 &&
		effPhysGrade >= 55;

	const generalSekem = calculateTauGeneralSekem(optimal.average, psych);
	const engineeringSekem = calculateTauEngineeringSekem(optimal.average, psych, hasRealitBonus);
	const managementSekem = calculateTauManagementSekem(optimal.average, psych);

	const directBagrutEligible = optimal.average >= 105.0;

	return {
		institutionId: 'tau',
		institutionName: 'אוניברסיטת תל אביב',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		managementSekem,
		directBagrutEligible,
		notes: directBagrutEligible
			? ['ממוצע בגרות עומד ברף קבלה ישירה (105 ומעלה) לחוגים זכאים.']
			: [],
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
