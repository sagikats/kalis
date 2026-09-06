/**
 * Central University Calculators Registry & Dispatcher
 * Subagent 3: Data Verification & Institution Calculators
 */

import { InstitutionCalculatorInput, InstitutionCalculatorResult } from './types';
import { evaluateTechnion } from './technion';
import { evaluateTau } from './tau';
import { evaluateHuji } from './huji';
import { evaluateBgu } from './bgu';
import { evaluateHaifa } from './haifa';
import { evaluateAriel } from './ariel';
import { evaluateBarIlan } from './barIlan';
import { evaluateReichman } from './reichman';

export * from './types';
export * from './technion';
export * from './tau';
export * from './huji';
export * from './bgu';
export * from './haifa';
export * from './ariel';
export * from './barIlan';
export * from './reichman';

export const SUPPORTED_INSTITUTIONS = [
	{ id: 'technion', name: 'הטכניון - מכון טכנולוגי לישראל' },
	{ id: 'tau', name: 'אוניברסיטת תל אביב' },
	{ id: 'huji', name: 'האוניברסיטה העברית בירושלים' },
	{ id: 'bgu', name: 'אוניברסיטת בן-גוריון בנגב' },
	{ id: 'haifa', name: 'אוניברסיטת חיפה' },
	{ id: 'ariel', name: 'אוניברסיטת אריאל בשומרון' },
	{ id: 'bar_ilan', name: 'אוניברסיטת בר-אילן' },
	{ id: 'reichman', name: 'אוניברסיטת רייכמן (הבינתחומי)' }
] as const;

export type SupportedInstitutionId = (typeof SUPPORTED_INSTITUTIONS)[number]['id'];

/**
 * Checks whether a specific degree at an institution officially allows Direct Bagrut Admission
 * (קבלה ישירה על סמך בגרות בלבד ללא פסיכומטרי)
 */
export function isProgramEligibleForDirectBagrut(
	institutionId: string,
	degreeName: string,
	bagrutAverage: number
): boolean {
	const lower = (degreeName || '').toLowerCase();

	// Programs that STRICTLY mandate psychometric across all Israeli research universities:
	const strictlyMandatesPsych = [
		'מדעי המחשב',
		'הנדסת תוכנה',
		'הנדסת מחשבים',
		'רפואה',
		'רפואת שיניים',
		'וטרינריה',
		'הנדסת חשמל',
		'הנדסת מכונות',
		'הנדסה אזרחית',
		'הנדסת ביוטכנולוגיה',
		'הנדסה כימית',
		'הנדסת תעשייה',
		'הנדסת מערכות תקשורת',
		'הנדסת חומרים',
		'הנדסה ביורפואית',
		'הנדסה'
	];

	if (strictlyMandatesPsych.some((d) => lower.includes(d))) {
		return false;
	}

	// Technion does not offer direct bagrut without psychometric for any engineering or CS program
	if (institutionId === 'technion') {
		return false;
	}

	// Hebrew University: Direct admission in Humanities, Social Sciences, Psychology for Bagrut >= 105.0
	if (institutionId === 'huji') {
		return bagrutAverage >= 105.0;
	}

	// Tel Aviv University: Direct admission in eligible programs for Bagrut >= 105.0
	if (institutionId === 'tau') {
		return bagrutAverage >= 105.0;
	}

	// Ben-Gurion University: Direct admission in eligible programs for Bagrut >= 104.0
	if (institutionId === 'bgu') {
		return bagrutAverage >= 104.0;
	}

	// Haifa / Ariel: Direct admission in eligible programs for Bagrut >= 100.0
	if (institutionId === 'haifa' || institutionId === 'ariel') {
		return bagrutAverage >= 100.0;
	}

	// Bar-Ilan University: Direct admission in eligible programs for Bagrut >= 102.0
	if (institutionId === 'bar_ilan') {
		return bagrutAverage >= 102.0;
	}

	// Reichman University: Direct admission in eligible programs for Bagrut >= 100.0
	if (institutionId === 'reichman') {
		return bagrutAverage >= 100.0;
	}

	return false;
}

/**
 * Executes calculation for a single specific institution
 */
export function calculateInstitution(
	institutionId: string,
	input: InstitutionCalculatorInput
): InstitutionCalculatorResult {
	switch (institutionId) {
		case 'technion':
			return evaluateTechnion(input);
		case 'tau':
			return evaluateTau(input);
		case 'huji':
			return evaluateHuji(input);
		case 'bgu':
			return evaluateBgu(input);
		case 'haifa':
			return evaluateHaifa(input);
		case 'ariel':
			return evaluateAriel(input);
		case 'bar_ilan':
			return evaluateBarIlan(input);
		case 'reichman':
			return evaluateReichman(input);
		default:
			throw new Error(`Unsupported institution ID: ${institutionId}`);
	}
}

/**
 * Calculates Sekem and optimal Bagrut average across all supported Israeli universities simultaneously
 */
export function calculateAllInstitutions(
	input: InstitutionCalculatorInput
): InstitutionCalculatorResult[] {
	return [
		evaluateTechnion(input),
		evaluateTau(input),
		evaluateHuji(input),
		evaluateBgu(input),
		evaluateHaifa(input),
		evaluateAriel(input),
		evaluateBarIlan(input),
		evaluateReichman(input)
	];
}
