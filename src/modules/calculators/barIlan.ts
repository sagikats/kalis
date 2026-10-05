/**
 * Pure Bar-Ilan University (אוניברסיטת בר-אילן) Admission Calculator
 * Bagrut average: verified against the official page (bonus table, droppable subjects, no cap).
 * Admission score: Bar-Ilan's 0–100 "שקלול", reconstructed from the official calculator (see calculateBarIlanScores).
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

/*
 * Bar-Ilan admission score ("שקלול מועמד למסלול", 0–100) — reconstructed from Bar-Ilan's official calculator
 * (shoham.biu.ac.il/kabala, 2026-10-05; 816 calculator results reproduced exactly — see
 * src/modules/calculators/__tests__/fixtures/biu-official/). Every input goes through a stepped conversion table and the
 * steps are weighted per scoring group, then summed:
 *
 *   general (humanities, social sciences, law):   0.49·P + 0.51·B
 *   sciences (CS, economics, life sciences …):     0.4·P + 0.4·B + Q + M
 *   engineering (electrical, computers …):         0.5·P + 0.2·B + Q + M + F
 *   software / industrial engineering:             0.5·P + 0.25·B + Q + 1.5·M
 *
 * P = psychometric steps, B = bagrut-average steps (average capped at 113), Q = quantitative-section term, M / F =
 * math / physics "product" terms (grade × units; flat below 300). English and other subjects don't count.
 * Values are relative to the reference profile (average 112.08, psychometric 714, quant 145, math 5u 95, physics 5u 93).
 * Between sampled points (psychometric 570–800 is sampled every 20–50 points, the average below 90 not at all) the
 * steps are interpolated / extrapolated, so the score may be off by one step there (≤ 0.5).
 */

/** Psychometric steps relative to 714 (one step = 0.49 general / 0.4 sciences / 0.5 engineering). */
const BIU_PSYCH_STEPS: [number, number][] = [
	[400, -56], [405, -55], [410, -54], [415, -53], [420, -53], [425, -52], [430, -51], [435, -50], [440, -49], [445, -48],
	[450, -47], [455, -46], [460, -45], [465, -44], [470, -43], [475, -43], [480, -42], [485, -41], [490, -40], [495, -39],
	[500, -38], [505, -37], [510, -36], [515, -35], [520, -35], [525, -34], [530, -33], [535, -32], [540, -31], [545, -30],
	[550, -29], [555, -28], [560, -27], [565, -27], [600, -21], [650, -12], [680, -6], [700, -3], [714, 0], [750, 6], [800, 16]
];
/** Bagrut-average steps relative to 112 (one step = 0.51 general / 0.4 sciences / 0.2 engineering / 0.25 software). */
const BIU_BAGRUT_STEPS: [number, number][] = [
	[90, -35], [91, -34], [92, -32], [93, -30], [94, -29], [95, -27], [96, -25], [97, -24], [98, -22], [99, -21], [100, -19],
	[101, -17], [102, -16], [103, -14], [104, -12], [105, -11], [106, -9], [107, -7], [108, -6], [109, -4], [110, -3],
	[111, -1], [112, 0], [113, 2]
];
const BIU_BAGRUT_CAP = 113;
/** Quantitative-section term relative to 145 (sciences / engineering / software). */
const BIU_QUANT_TERM: [number, number][] = [
	[50, -8.1], [55, -7.7], [60, -7.2], [65, -6.8], [70, -6.4], [75, -6.0], [80, -5.5], [85, -5.1], [90, -4.7], [95, -4.2],
	[100, -3.8], [105, -3.4], [110, -3.0], [115, -2.5], [120, -2.1], [125, -1.7], [130, -1.2], [135, -0.8], [140, -0.4],
	[145, 0], [150, 0.5]
];
/** Math / physics product (grade × units) term relative to 475; flat at or below 285. */
const BIU_PRODUCT_TERM: [number, number][] = [
	[285, -5.8], [300, -5.7], [320, -5.1], [325, -4.9], [340, -4.4], [350, -4.1], [360, -3.8], [375, -3.3], [380, -3.1],
	[400, -2.5], [425, -1.6], [450, -0.8], [475, 0], [500, 0.8]
];
/** Physics term when there is no physics in the bagrut (engineering). */
const BIU_NO_PHYSICS = -6.5;
/** Profile-A scores per group (the tables are relative to that profile). */
const BIU_BASE = { general: 89.61, sciences: 86.9, engineering: 82.8, software: 84.45 };

/** Piecewise-linear lookup; below the table it extends with `slopeBelow` per unit, above it stays flat. */
function lookup(table: [number, number][], x: number, slopeBelow: number): number {
	if (x <= table[0][0]) return table[0][1] - slopeBelow * (table[0][0] - x);
	for (let i = 1; i < table.length; i++) {
		const [x1, y1] = table[i];
		if (x <= x1) {
			const [x0, y0] = table[i - 1];
			return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
		}
	}
	return table[table.length - 1][1];
}
const steps = (table: [number, number][], x: number, slopeBelow: number) => Math.floor(lookup(table, x, slopeBelow) + 1e-9);
const tenth = (v: number) => Math.round(v * 10) / 10;
const productTerm = (units: number, grade: number) => (units * grade <= 285 ? -5.8 : tenth(lookup(BIU_PRODUCT_TERM, units * grade, 0)));

export interface BarIlanScoreInput {
	bagrutAverage: number;
	psychometric: number;
	/** Quantitative section, 50–150. */
	quant: number;
	mathUnits: number;
	mathGrade: number;
	physicsUnits?: number;
	physicsGrade?: number;
}

export interface BarIlanScores {
	general: number;
	sciences: number;
	engineering: number;
	software: number;
}

/** Bar-Ilan's 0–100 admission scores for the four scoring groups (0 without a psychometric score). */
export function calculateBarIlanScores(i: BarIlanScoreInput): BarIlanScores {
	if (i.bagrutAverage <= 0 || i.psychometric <= 0) return { general: 0, sciences: 0, engineering: 0, software: 0 };
	const p = steps(BIU_PSYCH_STEPS, i.psychometric, 0.18);
	const b = steps(BIU_BAGRUT_STEPS, Math.min(i.bagrutAverage, BIU_BAGRUT_CAP), 1.59);
	const q = i.quant > 0 ? tenth(lookup(BIU_QUANT_TERM, i.quant, 0.09)) : tenth(lookup(BIU_QUANT_TERM, 50, 0));
	const m = productTerm(i.mathUnits, i.mathGrade);
	// Physics uses the same product scale, relative to 5u × 93 (= the math scale + 0.3)
	const f = i.physicsUnits && i.physicsGrade ? productTerm(i.physicsUnits, i.physicsGrade) + 0.3 : BIU_NO_PHYSICS;
	const r2 = (v: number) => Math.round(v * 100) / 100;
	return {
		general: r2(BIU_BASE.general + 0.49 * p + 0.51 * b),
		sciences: tenth(BIU_BASE.sciences + 0.4 * p + 0.4 * b + q + m),
		engineering: tenth(BIU_BASE.engineering + 0.5 * p + 0.2 * b + q + m + f),
		software: r2(BIU_BASE.software + 0.5 * p + 0.25 * b + q + 1.5 * m)
	};
}

export function evaluateBarIlan(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateBarIlanOptimalBagrut(input.bagrutSubjects);
	const mathSub = input.bagrutSubjects.find((s) => isMath(s.name) && s.units > 0 && s.grade > 0);
	const physicsSub = input.bagrutSubjects.find((s) => s.name.includes('פיזיקה') || s.name.includes('פיסיקה'));
	const mathUnits = mathSub?.units ?? input.mathUnits ?? 0;
	const mathGrade = mathSub?.grade ?? input.mathGrade ?? 0;
	const physicsUnits = physicsSub?.units ?? input.physicsUnits ?? 0;
	const physicsGrade = physicsSub?.grade ?? input.physicsGrade ?? 0;
	const quant = input.psychometricQuant && input.psychometricQuant <= 150 ? input.psychometricQuant : 0;

	const scores = calculateBarIlanScores({
		bagrutAverage: optimal.average,
		psychometric: input.psychometricGeneral || 0,
		quant,
		mathUnits,
		mathGrade,
		physicsUnits,
		physicsGrade
	});

	const notes: string[] = [
		'שקלול בר-אילן (סולם 0–100) לפי המחשבון הרשמי: כללי, מדעים, הנדסה והנדסת תוכנה.'
	];
	if (!quant && (input.psychometricGeneral || 0) > 0) notes.push('לא הוזן ציון בחשיבה כמותית — השקלול במסלולי המדעים וההנדסה מחושב בלעדיו.');
	if (optimal.droppedSubjects.length > 0) {
		notes.push(`הושמטו ${optimal.droppedSubjects.length} מקצועות בחירה לטובת מקסום הממוצע האופטימלי.`);
	}

	return {
		institutionId: 'bar_ilan',
		institutionName: 'אוניברסיטת בר-אילן',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem: scores.general,
		quantitativeSekem: scores.sciences,
		engineeringSekem: scores.engineering,
		managementSekem: scores.software,
		// Lowest official bagrut-only threshold at Bar-Ilan is 90 (per-track minimums are in each program's admissionRoutes)
		directBagrutEligible: optimal.average >= 90,
		notes,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name),
		subjectBreakdown: optimal.breakdown,
		bagrutCap: optimal.cap
	};
}
