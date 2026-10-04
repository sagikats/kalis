/**
 * Pure Technion (הטכניון - מכון טכנולוגי לישראל) Admission Calculator
 * Official Formula: S = 0.5 * D + 0.075 * P - 19 (Scale 0-100), D capped at 119
 * Sources: admissions.technion.ac.il (summary-score-calculation-table, calculation-of-the-median-grade, kizad-mehasvim)
 * Subagent 3: Data Verification & Institution Calculators
 */

import type {
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
	isHistory,
	isLiterature,
	isMath,
	isTechSubject
} from './subjectMatchers';

const TECHNION_MANDATORY_SUBJECTS = [
	'מתמטיקה',
	'אנגלית',
	'אזרחות',
	'ידיעת העם',
	'הבעה עברית',
	'לשון',
	'היסטוריה',
	'ספרות',
	'תנ״ך',
	'תנ"ך'
];

/** Technion caps the optimal bagrut average at 119 (admissions.technion.ac.il — נוסחאות הסכם). */
export const TECHNION_MAX_AVERAGE = 119;

export function isTechnionMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return TECHNION_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

/**
 * Enhanced science/technology cluster (מצרף מדעי/טכנולוגי): 5u math plus, at 5 units,
 * either two of physics/chemistry/biology or one of them and a recognized technological subject.
 */
export function detectTechnionScienceCluster(subjects: CalculatorSubject[]): boolean {
	return selectTechnionScienceCluster(subjects).size === 2;
}

/**
 * Select the enlarged-bonus pair from this retained subset, not the original certificate.
 * With equal five-unit weights, the strongest valid pair maximizes its weighted contribution.
 * At least one member must be a science; the other may be science or recognized technology.
 * Equal-grade member identity follows input order; official tie identity is not established.
 */
function selectTechnionScienceCluster(subjects: CalculatorSubject[]): Set<CalculatorSubject> {
	const eligible = subjects.filter((s) => s.units === 5 && Number.isFinite(s.grade) && s.grade >= 60 && s.grade <= 100);
	if (!eligible.some((s) => isMath(s.name))) return new Set();
	const members = eligible.filter((s) => isCoreScience(s.name) || isTechSubject(s.name));
	const science = members.filter((s) => isCoreScience(s.name)).sort((a, b) => b.grade - a.grade)[0];
	if (!science) return new Set();
	const other = members.filter((s) => s !== science).sort((a, b) => b.grade - a.grade)[0];
	return other ? new Set([science, other]) : new Set();
}

/**
 * Official Technion bonus table (admissions.technion.ac.il — מקדמי הטבה):
 * granted only for a grade of 60+; math 5u +30;
 * English, literature, Bible, history, Arabic 5u +25 — confirmed on the official calculator;
 * physics/chemistry/biology/recognized tech 5u +25 (+30 inside the science cluster);
 * every other bonus subject at 5u (e.g. civics, Hebrew expression, geography) +20; any bonus subject at 4u +10.
 */
export function getTechnionBonus(subject: CalculatorSubject, hasScienceCluster: boolean): number {
	if (subject.grade < 60) return 0;
	const n = subject.name;

	if (subject.units >= 5) {
		if (isMath(n)) return 30;
		if (isEnglish(n) || isLiterature(n) || isBible(n) || isHistory(n) || isArabic(n)) return 25;
		if (isCoreScience(n) || isTechSubject(n)) return hasScienceCluster ? 30 : 25;
		return 20;
	}

	if (subject.units === 4) return 10;
	return 0;
}

/** Math counts double (4u = 8, 5u = 10) for all tracks except architecture. */
function getTechnionWeight(subject: CalculatorSubject): number {
	return isMath(subject.name) && subject.units >= 4 ? subject.units * 2 : subject.units;
}

export function calculateTechnionOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	const activeSubs = (subjects || []).filter((s) => s.units > 0 && s.grade > 0);
	const pairCache = new WeakMap<CalculatorSubject[], Set<CalculatorSubject>>();
	const selectedPair = (included: CalculatorSubject[]) => {
		let pair = pairCache.get(included);
		if (!pair) {
			pair = selectTechnionScienceCluster(included);
			pairCache.set(included, pair);
		}
		return pair;
	};

	const result = computeOptimalAverage(subjects, {
		isMandatory: isTechnionMandatorySubject,
		getBonus: (s, included = activeSubs) => getTechnionBonus(s, selectedPair(included).has(s)),
		getWeight: getTechnionWeight,
		cap: TECHNION_MAX_AVERAGE,
		decimals: null,
		dropReason: 'השמטה חוקית: שקלול המקצוע הוריד את הממוצע האופטימלי'
	});

	return {
		...result,
		rawAverage: result.average,
		average: Math.round(result.average * 10) / 10,
		hasScienceCluster: selectedPair(result.includedSubjects).size === 2
	};
}

export function calculateTechnionSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const d = Math.min(TECHNION_MAX_AVERAGE, bagrutAverage);
	// Algebraically the same formula; preserve the observed displayed half-tie behavior
	// without first rounding D or adding an arbitrary floating-point epsilon.
	const tenths = (100 * d + 15 * psychometric - 3800) / 20;
	return Math.min(100, Math.max(0, Math.round(tenths) / 10));
}

export function evaluateTechnion(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateTechnionOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;
	// In Technion, the official formula for ALL degree tracks
	// ("חישוב סכם לכל המסלולים פרט לארכיטקטורה, אדריכלות נוף ומסלולי הרפואה"):
	// S = 0.5 * D + 0.075 * P_general - 19
	// The psychometric score is strictly the multi-disciplinary (general) score.
	const sekem = calculateTechnionSekem(optimal.rawAverage ?? optimal.average, psych);
	const generalSekem = sekem;
	const engineeringSekem = sekem;

	// Technion does NOT allow direct bagrut admission for CS or engineering without psychometric
	const directBagrutEligible = false;

	const notes: string[] = [];
	if (optimal.hasScienceCluster) {
		notes.push('זוהה מצרף מדעי/טכנולוגי במקצועות שנכללו בממוצע (מתמטיקה 5 יח״ל + שני מדעים, או מדע ומקצוע טכנולוגי, ב-5 יח״ל) — שני המקצועות שנבחרו למצרף מקבלים 30 נקודות בונוס.');
	}
	if (optimal.droppedSubjects.length > 0) {
		notes.push(`הושמטו ${optimal.droppedSubjects.length} מקצועות בחירה לטובת מקסום הממוצע האופטימלי.`);
	}

	return {
		institutionId: 'technion',
		institutionName: 'הטכניון - מכון טכנולוגי לישראל',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name),
		subjectBreakdown: optimal.breakdown,
		bagrutCap: optimal.cap
	};
}
