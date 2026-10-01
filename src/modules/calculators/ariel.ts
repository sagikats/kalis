/**
 * Pure Ariel University (אוניברסיטת אריאל בשומרון) Admission Calculator
 * Official Formula: Combined_Score = ((Bagrut_Average * 6.666) + Psychometric) / 2
 * ⚠️ NOT VERIFIED against an official source — bonus table, mandatory subjects and sekem formula are estimates.
 * Subagent 3: Data Verification & Institution Calculators
 */

import {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult
} from './types';
import { computeOptimalAverage } from './optimalAverage';

const ARIEL_MANDATORY_SUBJECTS = [
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

export function isArielMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return ARIEL_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

export function getArielBonus(subject: CalculatorSubject): number {
	if (subject.grade < 60) return 0;
	const n = subject.name.trim();

	if (n.includes('מתמטיקה')) {
		if (subject.units === 5) return 35;
		if (subject.units === 4) return 15;
		return 0;
	}

	if (n.includes('אנגלית')) {
		if (subject.units === 5) return 25;
		if (subject.units === 4) return 12.5;
		return 0;
	}

	if (subject.units === 5) {
		if (
			n.includes('פיזיקה') ||
			n.includes('כימיה') ||
			n.includes('ביולוגיה') ||
			n.includes('מדעי המחשב') ||
			n.includes('סייבר') ||
			n.includes('אלקטרוניקה') ||
			n.includes('רובוטיקה') ||
			n.includes('תוכנה') ||
			n.includes('תכנות') ||
			n.includes('הנדס') ||
			n.includes('ספרות') ||
			n.includes('תנ"ך') ||
			n.includes('תנ״ך') ||
			n.includes('הלכה') ||
			n.includes('היסטוריה') ||
			n.includes('ערבית')
		) {
			return 25;
		}
		return 20;
	}

	if (subject.units === 4) {
		return 10;
	}

	return 0;
}

export function calculateArielOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	return computeOptimalAverage(subjects, {
		isMandatory: isArielMandatorySubject,
		getBonus: getArielBonus,
		cap: 125,
		dropReason: 'השמטה חוקית באריאל: שקלול המקצוע הוריד את הממוצע האופטימלי'
	});
}

export function calculateArielSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const raw = (bagrutAverage * 6.666 + psychometric) / 2;
	return Math.min(800, Math.max(200, Math.round(raw)));
}

export function evaluateAriel(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateArielOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;
	const explicitQuant = input.psychometricQuantEmphasis && input.psychometricQuantEmphasis > 0
		? input.psychometricQuantEmphasis
		: undefined;
	const rawQuant = explicitQuant ?? (input.psychometricQuant && input.psychometricQuant > 0 ? input.psychometricQuant : psych);
	const quant = rawQuant > 0 && rawQuant <= 150 ? Math.round(200 + (rawQuant - 50) * 6) : rawQuant;

	const generalSekem = calculateArielSekem(optimal.average, psych);
	const engineeringSekem = calculateArielSekem(optimal.average, quant);

	const directBagrutEligible = optimal.average >= 100;

	return {
		institutionId: 'ariel',
		institutionName: 'אוניברסיטת אריאל בשומרון',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes: directBagrutEligible
			? ['החישוב לאריאל הוא הערכה — הנוסחה טרם אומתה מול מקור רשמי של המוסד.', 'ממוצע בגרות עומד ברף קבלה ישירה (100 ומעלה) באוניברסיטת אריאל לחוגים זכאים.']
			: ['החישוב לאריאל הוא הערכה — הנוסחה טרם אומתה מול מקור רשמי של המוסד.'],
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
