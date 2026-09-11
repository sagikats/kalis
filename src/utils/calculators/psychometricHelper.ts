/**
 * NITE (National Institute for Testing and Evaluation - מאל"ו)
 * Official Psychometric Formulas and Weights
 * 
 * Each section (Quantitative, Verbal, English) has a raw/scaled score in [50, 150].
 * NITE calculates 3 composite scores in [200, 800]:
 * 
 * 1. Multi-domain score (ציון רב-תחומי):
 *    - Quantitative: 40% (weight 2)
 *    - Verbal: 40% (weight 2)
 *    - English: 20% (weight 1)
 *    Formula: W = (2*Q + 2*V + 1*E) / 5
 *    Score = 200 + (W - 50) * 6
 * 
 * 2. Quantitative emphasis score (ציון בדגש כמותי - מדעים מדויקים והנדסה):
 *    - Quantitative: 60% (weight 3)
 *    - Verbal: 20% (weight 1)
 *    - English: 20% (weight 1)
 *    Formula: W = (3*Q + 1*V + 1*E) / 5
 *    Score = 200 + (W - 50) * 6
 * 
 * 3. Verbal emphasis score (ציון בדגש מילולי - מדעי הרוח, משפטים):
 *    - Verbal: 60% (weight 3)
 *    - Quantitative: 20% (weight 1)
 *    - English: 20% (weight 1)
 *    Formula: W = (3*V + 1*Q + 1*E) / 5
 *    Score = 200 + (W - 50) * 6
 */

export interface PsychometricInput {
	general?: number | ''; // 200-800
	quant?: number | ''; // 50-150
	verbal?: number | ''; // 50-150
	english?: number | ''; // 50-150
}

export interface CalculatedPsychometricResult {
	effectiveGeneral: number; // 200-800
	effectiveQuantEmphasis: number; // 200-800
	effectiveVerbalEmphasis: number; // 200-800
	calculatedGeneralFromSections?: number;
	rawSubscores: {
		quant: number;
		verbal: number;
		english: number;
	};
	englishClassification: {
		level: string;
		label: string;
		isExempt: boolean;
		color: string;
	};
}

/**
 * Calculates academic English classification based on CHE (מל"ג) standards
 */
export function getEnglishClassification(englishScore: number) {
	if (!englishScore || englishScore < 50) {
		return {
			level: 'unknown',
			label: 'לא הוזן ציון',
			isExempt: false,
			color: 'bg-[#FAF8F5] text-[#66635C] border-[#E5DFD4]'
		};
	}
	if (englishScore >= 134) {
		return {
			level: 'exempt',
			label: 'פטור מאנגלית באקדמיה (134-150)',
			isExempt: true,
			color: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
		};
	}
	if (englishScore >= 120) {
		return {
			level: 'advanced_b',
			label: 'מתקדמים ב׳ (120-133)',
			isExempt: false,
			color: 'bg-[#ECFEFF] text-[#0E7490] border-[#A5F3FC]'
		};
	}
	if (englishScore >= 100) {
		return {
			level: 'advanced_a',
			label: 'מתקדמים א׳ (100-119)',
			isExempt: false,
			color: 'bg-[#EEF2FF] text-[#1E40AF] border-[#C7D2FE]'
		};
	}
	if (englishScore >= 85) {
		return {
			level: 'basic',
			label: 'בסיסי (85-99)',
			isExempt: false,
			color: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
		};
	}
	return {
		level: 'pre_basic',
		label: 'טרום-בסיסי (<85)',
		isExempt: false,
		color: 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]'
	};
}

/**
 * Calculates NITE official General (Multi-disciplinary) score from section subscores:
 * W = (2*Q + 2*V + 1*E) / 5
 * Score = round(200 + (W - 50) * 6)
 */
export function calculateNiteGeneralScore(quant: number, verbal: number, english: number): number {
	if (quant < 50 || quant > 150 || verbal < 50 || verbal > 150 || english < 50 || english > 150) {
		return 0;
	}
	const wMulti = (2 * quant + 2 * verbal + 1 * english) / 5;
	return Math.min(800, Math.max(200, Math.round(200 + (wMulti - 50) * 6)));
}

/**
 * In NITE (המרכז הארצי לבחינות והערכה), composite scores (General, Quant-emphasis, Verbal-emphasis)
 * are determined by session-based equipercentile equating tables and regression to the mean of correlated
 * domains, which means the official certificate score often differs from the linear estimate by 10-25 points.
 * Discrepancy is only flagged if it exceeds 30 points (e.g. gross data entry typo).
 */
export function checkPsychometricCoherence(
	userGeneral: number,
	quant: number,
	verbal: number,
	english: number
): {
	isCoherent: boolean;
	calculatedGeneral: number;
	discrepancy: number;
} {
	const calcGen = calculateNiteGeneralScore(quant, verbal, english);
	if (calcGen === 0 || userGeneral <= 0) {
		return { isCoherent: true, calculatedGeneral: calcGen, discrepancy: 0 };
	}
	const discrepancy = Math.abs(userGeneral - calcGen);
	return {
		isCoherent: discrepancy <= 30, // Real-world NITE equating tolerance
		calculatedGeneral: calcGen,
		discrepancy
	};
}

/**
 * Evaluates full NITE psychometric scores and emphasis channels
 */
export function resolvePsychometricScores(input: PsychometricInput): CalculatedPsychometricResult {
	const userGeneral = Number(input.general) || 0;
	const q = Number(input.quant) || 0;
	const v = Number(input.verbal) || 0;
	const e = Number(input.english) || 0;

	const hasAllSections = q >= 50 && q <= 150 && v >= 50 && v <= 150 && e >= 50 && e <= 150;

	let calcGeneral = 0;
	let quantEmphasis = 0;
	let verbalEmphasis = 0;

	if (hasAllSections) {
		// NITE official weighted formulas (linear approximation baseline)
		const wMulti = (2 * q + 2 * v + 1 * e) / 5;
		calcGeneral = Math.min(800, Math.max(200, Math.round(200 + (wMulti - 50) * 6)));

		const wQuant = (3 * q + 1 * v + 1 * e) / 5;
		quantEmphasis = Math.min(800, Math.max(200, Math.round(200 + (wQuant - 50) * 6)));

		const wVerbal = (3 * v + 1 * q + 1 * e) / 5;
		verbalEmphasis = Math.min(800, Math.max(200, Math.round(200 + (wVerbal - 50) * 6)));

		// If user provided their official certificate score, calibrate emphasis scores to their official baseline
		if (userGeneral > 0 && calcGeneral > 0) {
			const calibrationDelta = userGeneral - calcGeneral;
			quantEmphasis = Math.min(800, Math.max(200, quantEmphasis + calibrationDelta));
			verbalEmphasis = Math.min(800, Math.max(200, verbalEmphasis + calibrationDelta));
		}
	} else if (q >= 50 && q <= 150) {
		// If only quantitative subscore is given without V/E
		quantEmphasis = Math.min(800, Math.max(200, Math.round(200 + ((q - 50) / 100) * 600)));
		if (v >= 50 && v <= 150) {
			verbalEmphasis = Math.min(800, Math.max(200, Math.round(200 + ((v - 50) / 100) * 600)));
		}
	}

	// The candidate's entered general score from their official certificate is the source of truth!
	const effectiveGeneral = userGeneral > 0 ? userGeneral : calcGeneral;

	// Effective Quant Emphasis:
	let effectiveQuantEmphasis = quantEmphasis > 0 ? quantEmphasis : effectiveGeneral;
	if (effectiveQuantEmphasis === 0 && q > 0) {
		effectiveQuantEmphasis = q <= 150 ? Math.round(200 + ((q - 50) / 100) * 600) : q;
	}

	// Effective Verbal Emphasis
	let effectiveVerbalEmphasis = verbalEmphasis > 0 ? verbalEmphasis : effectiveGeneral;
	if (effectiveVerbalEmphasis === 0 && v > 0) {
		effectiveVerbalEmphasis = v <= 150 ? Math.round(200 + ((v - 50) / 100) * 600) : v;
	}

	return {
		effectiveGeneral,
		effectiveQuantEmphasis,
		effectiveVerbalEmphasis,
		calculatedGeneralFromSections: calcGeneral > 0 ? calcGeneral : undefined,
		rawSubscores: { quant: q, verbal: v, english: e },
		englishClassification: getEnglishClassification(e)
	};
}

/**
 * Simulates realistic section subscores for an upgraded general score (targetGen),
 * respecting NITE formulas, subscore ceiling constraints (50-150), and allocating gains
 * proportional to available headroom (150 - baseSub).
 */
export function simulateRealisticSubscores(
	targetGen: number,
	baseGen: number,
	baseQuant?: number,
	baseVerbal?: number,
	baseEnglish?: number,
	baseQuantEmphasis?: number,
	baseVerbalEmphasis?: number
): { quantSub: number; verbalSub: number; englishSub: number; quantEmphasis: number; verbalEmphasis: number } {
	const currentGen = baseGen > 0 ? baseGen : targetGen;
	const baseBalSub = Math.round(50 + (currentGen - 200) / 6);
	
	const normSub = (val?: number) => {
		if (!val || val <= 0) return baseBalSub;
		return val > 150 ? Math.round(50 + (val - 200) / 6) : val;
	};

	const q0 = normSub(baseQuant);
	const v0 = normSub(baseVerbal);
	const e0 = normSub(baseEnglish);

	const deltaGen = targetGen - currentGen;

	// Baseline subscore weighting according to NITE formulas:
	const wQ0 = (3 * q0 + v0 + e0) / 5;
	const wV0 = (3 * v0 + q0 + e0) / 5;
	const rawQuantEmphasis0 = Math.min(800, Math.max(200, Math.round(200 + (wQ0 - 50) * 6)));
	const rawVerbalEmphasis0 = Math.min(800, Math.max(200, Math.round(200 + (wV0 - 50) * 6)));

	const effectiveBaseQuantEmphasis = baseQuantEmphasis && baseQuantEmphasis > 0
		? baseQuantEmphasis
		: rawQuantEmphasis0;

	const effectiveBaseVerbalEmphasis = baseVerbalEmphasis && baseVerbalEmphasis > 0
		? baseVerbalEmphasis
		: rawVerbalEmphasis0;

	if (deltaGen === 0) {
		return {
			quantSub: q0,
			verbalSub: v0,
			englishSub: e0,
			quantEmphasis: effectiveBaseQuantEmphasis,
			verbalEmphasis: effectiveBaseVerbalEmphasis
		};
	}

	const headQ = Math.max(0, 150 - q0);
	const headV = Math.max(0, 150 - v0);
	const headE = Math.max(0, 150 - e0);
	const totalWeightedHead = headQ * 2 + headV * 2 + headE; // NITE weights (2, 2, 1)

	const targetW = 50 + (targetGen - 200) / 6;
	const currentW = (2 * q0 + 2 * v0 + e0) / 5;
	const deltaW = targetW - currentW;

	let q1 = q0;
	let v1 = v0;
	let e1 = e0;

	if (deltaW > 0 && totalWeightedHead > 0) {
		const factor = Math.min(1, (deltaW * 5) / totalWeightedHead);
		q1 = Math.min(150, Math.round(q0 + headQ * factor));
		v1 = Math.min(150, Math.round(v0 + headV * factor));
		e1 = Math.min(150, Math.round(e0 + headE * factor));
	} else if (deltaW < 0) {
		const divisor = 2 * (q0 - 50) + 2 * (v0 - 50) + (e0 - 50);
		const factor = Math.min(1, Math.abs(deltaW * 5) / (divisor > 0 ? divisor : 1));
		q1 = Math.max(50, Math.round(q0 - (q0 - 50) * factor));
		v1 = Math.max(50, Math.round(v0 - (v0 - 50) * factor));
		e1 = Math.max(50, Math.round(e0 - (e0 - 50) * factor));
	}

	const wQ1 = (3 * q1 + v1 + e1) / 5;
	const wV1 = (3 * v1 + q1 + e1) / 5;
	const rawQuantEmphasis1 = Math.min(800, Math.max(200, Math.round(200 + (wQ1 - 50) * 6)));
	const rawVerbalEmphasis1 = Math.min(800, Math.max(200, Math.round(200 + (wV1 - 50) * 6)));

	const deltaQuantEmp = rawQuantEmphasis1 - rawQuantEmphasis0;
	const deltaVerbalEmp = rawVerbalEmphasis1 - rawVerbalEmphasis0;

	return {
		quantSub: q1,
		verbalSub: v1,
		englishSub: e1,
		quantEmphasis: Math.min(800, Math.max(200, effectiveBaseQuantEmphasis + deltaQuantEmp)),
		verbalEmphasis: Math.min(800, Math.max(200, effectiveBaseVerbalEmphasis + deltaVerbalEmp))
	};
}
