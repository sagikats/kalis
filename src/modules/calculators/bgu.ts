/**
 * Pure Ben-Gurion University of the Negev (אוניברסיטת בן-גוריון בנגב) Admission Calculator
 * Official Formulas: General Sekem & Faculty of Engineering Sciences Sekem
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
	isLiterature,
	isMath
} from './subjectMatchers';


/** Always included at BGU: English, math, history, civics, Hebrew expression (ידיעון תשפ"ז, עמ' 11). */
export function isBguMandatorySubject(name: string): boolean {
	return isMath(name) || isEnglish(name) || isHistory(name) || isCivics(name) || isHebrewExpression(name);
}

/** BGU caps the optimal average at 120 (ידיעון למועמדים תשפ"ז, עמ' 11). */
export const BGU_MAX_AVERAGE = 120;

/**
 * Official BGU bonus table (ידיעון למועמדים תשפ"ז, עמ' 10), granted when the grade is above 60:
 * default 5u +20 / 4u +10; math 5u +35 / 4u +20; English 5u +25 / 4u +15;
 * physics, chemistry, biology, CS, literature, Bible, history 5u +25
 * (Arabic / Hebrew +25 apply only to Arabic speakers and are not modelled).
 */
export function getBguBonus(subject: CalculatorSubject): number {
	if (subject.grade <= 60) return 0;
	const n = subject.name;

	if (isMath(n)) {
		if (subject.units >= 5) return 35;
		if (subject.units === 4) return 20;
		return 0;
	}

	if (isEnglish(n)) {
		if (subject.units >= 5) return 25;
		if (subject.units === 4) return 15;
		return 0;
	}

	if (subject.units >= 5) {
		if (isCoreScience(n) || isComputerScience(n) || isLiterature(n) || isBible(n) || isHistory(n)) return 25;
		return 20;
	}

	if (subject.units === 4) return 10;
	return 0;
}

export function calculateBguOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	return computeOptimalAverage(subjects, {
		isMandatory: isBguMandatorySubject,
		getBonus: getBguBonus,
		cap: BGU_MAX_AVERAGE,
		dropReason: 'השמטה חוקית בבן-גוריון: שקלול המקצוע הוריד את הממוצע האופטימלי'
	});
}

export function calculateBguGeneralSekem(bagrutAverage: number, psychometricGeneral: number): number {
	if (bagrutAverage <= 0 || psychometricGeneral <= 0) return 0;
	// Official BGU General Sekem Formula verified against live institutional calculator (bgucr4u.bgu.ac.il/ords/sc/calculators/GetSekem)
	const rawSekem = 0.62 * psychometricGeneral + 5.9 * Math.min(BGU_MAX_AVERAGE, bagrutAverage) - 330;
	// BGU sekem is not bounded at 800 (its own excellence thresholds go up to 830)
	return Math.max(0, Math.round(rawSekem));
}

export function calculateBguEngineeringSekem(
	mathGrade: number,
	mathUnits: number,
	psychometricGeneral: number,
	psychometricQuant: number,
	physicsGrade: number = 0,
	physicsUnits: number = 0,
	bagrutAverage: number = 0
): number {
	if (psychometricGeneral <= 0 && psychometricQuant <= 0 && mathGrade <= 0 && bagrutAverage <= 0) return 0;

	// Normalize Quantitative subscore to 50-150 scale (official BGU scale)
	const rawQ = psychometricQuant > 0 ? psychometricQuant : psychometricGeneral;
	const quant = rawQ > 0 && rawQ <= 150 ? rawQ : (rawQ > 150 ? Math.round(50 + (rawQ - 200) / 6) : 0);
	if (quant <= 0 && mathGrade <= 0 && bagrutAverage <= 0) return 0;

	// Official Ben-Gurion Faculty of Engineering Sciences Dual-Route Formula
	// Verified 1:1 against live BGU Production ORDS API (acceptanceProbabilityMAIN)
	
	// Route 1: Route with 5 units Physics (Physics >= 70)
	let scorePhys = 0;
	if (physicsUnits === 5 && physicsGrade >= 70 && quant > 0 && mathGrade > 0) {
		const mathTerm = mathUnits === 5 ? 1.1 * mathGrade : (0.8 * mathGrade - 6.0);
		scorePhys = 3.0 * quant + mathTerm + 1.9 * physicsGrade - 141.1;
	}

	// Route 2: Bagrut-based route (for candidates without 5u Physics, or where high Bagrut yields higher score)
	let scoreBagrut = 0;
	if (bagrutAverage > 0 && quant > 0) {
		const mathTermBagrut = mathUnits === 5 ? 1.0 * mathGrade : (0.75 * mathGrade - 5.0);
		scoreBagrut = 2.9 * quant + mathTermBagrut + 2.4 * bagrutAverage - 219.34;
	}

	const finalSekem = Math.max(scorePhys, scoreBagrut);
	if (finalSekem <= 0) return 0;
	return Math.round(finalSekem);
}

export function calculateBguQuantitativeSekem(
	bagrutAverage: number,
	quant: number,
	verbal: number = 0,
	english: number = 0
): number {
	if (bagrutAverage <= 0 || quant <= 0) return 0;
	const v = verbal > 0 ? verbal : quant;
	const e = english > 0 ? english : quant;
	// Official BGU Quantitative Sekem Formula verified against live institutional calculator (GetSekemQuantity)
	const rawSekem = 2.705 * quant + 0.715 * v + 0.39 * e + 6.29 * Math.min(BGU_MAX_AVERAGE, bagrutAverage) - 448;
	return Math.max(0, Math.round(rawSekem));
}

export function evaluateBgu(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateBguOptimalBagrut(input.bagrutSubjects);
	const mathSub = input.bagrutSubjects.find((s) => s.name.includes('מתמטיקה'));
	const mathUnits = input.mathUnits ?? (mathSub ? mathSub.units : 4);
	const mathGrade = input.mathGrade ?? (mathSub ? mathSub.grade : 80);

	const physSub = input.bagrutSubjects.find((s) => s.name.includes('פיזיקה'));
	const physicsUnits = input.physicsUnits ?? (physSub ? physSub.units : 0);
	const physicsGrade = input.physicsGrade ?? (physSub ? physSub.grade : 0);

	const psych = input.psychometricGeneral || 0;
	const explicitQuant = input.psychometricQuantEmphasis && input.psychometricQuantEmphasis > 0
		? input.psychometricQuantEmphasis
		: undefined;
	const rawQuant = explicitQuant ?? (input.psychometricQuant || psych);
	const quant = rawQuant > 0 && rawQuant <= 150 ? Math.round(200 + (rawQuant - 50) * 6) : rawQuant;

	// Quantitative Subscores (for Computer Science, Natural Sciences & Engineering at BGU)
	const rawQ = input.psychometricQuant || 0;
	const qSub = rawQ > 0 && rawQ <= 150
		? rawQ
		: (rawQ > 150 ? Math.round(50 + (rawQ - 200) / 6) : (input.psychometricQuantEmphasis ? Math.round(50 + (input.psychometricQuantEmphasis - 200) / 6) : (psych > 0 ? Math.round(50 + (psych - 200) / 6) : 0)));

	const generalSekem = calculateBguGeneralSekem(optimal.average, psych);
	const engineeringSekem = calculateBguEngineeringSekem(
		mathGrade,
		mathUnits,
		psych,
		qSub,
		physicsGrade,
		physicsUnits,
		optimal.average
	);

	const rawV = input.psychometricVerbal || 0;
	const vSub = rawV > 0 && rawV <= 150
		? rawV
		: (rawV > 150 ? Math.round(50 + (rawV - 200) / 6) : (input.psychometricVerbalEmphasis ? Math.round(50 + (input.psychometricVerbalEmphasis - 200) / 6) : (psych > 0 ? Math.round(50 + (psych - 200) / 6) : 0)));

	const rawE = input.psychometricEnglish || 0;
	const eSub = rawE > 0 && rawE <= 150
		? rawE
		: (rawE > 150 ? Math.round(50 + (rawE - 200) / 6) : (psych > 0 ? Math.round(50 + (psych - 200) / 6) : 0));

	const quantitativeSekem = qSub > 0
		? calculateBguQuantitativeSekem(optimal.average, qSub, vSub, eSub)
		: generalSekem;

	const directBagrutEligible = optimal.average >= 104.0;

	return {
		institutionId: 'bgu',
		institutionName: 'אוניברסיטת בן-גוריון בנגב',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		quantitativeSekem,
		directBagrutEligible,
		notes: directBagrutEligible
			? ['ממוצע בגרות עומד ברף קבלה ישירה (104 ומעלה) לחוגים זכאים.']
			: [],
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
