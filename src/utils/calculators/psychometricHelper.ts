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
			color: 'text-slate-400 bg-slate-800/50 border-slate-700'
		};
	}
	if (englishScore >= 134) {
		return {
			level: 'exempt',
			label: 'פטור מאנגלית באקדמיה (134-150)',
			isExempt: true,
			color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
		};
	}
	if (englishScore >= 120) {
		return {
			level: 'advanced_b',
			label: 'מתקדמים ב׳ (120-133)',
			isExempt: false,
			color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
		};
	}
	if (englishScore >= 100) {
		return {
			level: 'advanced_a',
			label: 'מתקדמים א׳ (100-119)',
			isExempt: false,
			color: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
		};
	}
	if (englishScore >= 85) {
		return {
			level: 'basic',
			label: 'בסיסי (85-99)',
			isExempt: false,
			color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
		};
	}
	return {
		level: 'pre_basic',
		label: 'טרום-בסיסי (<85)',
		isExempt: false,
		color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
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
		// NITE official weighted formulas
		const wMulti = (2 * q + 2 * v + 1 * e) / 5;
		calcGeneral = Math.min(800, Math.max(200, Math.round(200 + (wMulti - 50) * 6)));

		const wQuant = (3 * q + 1 * v + 1 * e) / 5;
		quantEmphasis = Math.min(800, Math.max(200, Math.round(200 + (wQuant - 50) * 6)));

		const wVerbal = (3 * v + 1 * q + 1 * e) / 5;
		verbalEmphasis = Math.min(800, Math.max(200, Math.round(200 + (wVerbal - 50) * 6)));
	} else if (q >= 50 && q <= 150) {
		// If only quantitative subscore is given without V/E
		quantEmphasis = Math.min(800, Math.max(200, Math.round(200 + ((q - 50) / 100) * 600)));
		if (v >= 50 && v <= 150) {
			verbalEmphasis = Math.min(800, Math.max(200, Math.round(200 + ((v - 50) / 100) * 600)));
		}
	}

	// Effective General score
	const effectiveGeneral = userGeneral > 0 ? userGeneral : calcGeneral;

	// Effective Quant Emphasis:
	// If subscores produced quantEmphasis, use it; otherwise fallback to general or normalized Q
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
