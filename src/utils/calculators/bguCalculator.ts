/**
 * BGU (Ben-Gurion University of the Negev) Official Admission Sekem Calculator
 * 
 * Ben-Gurion University uses two main admission indices:
 * 1. General Sekem (סכם כללי): Combination of optimal Bagrut average and General Psychometric score.
 * 2. Engineering & Exact Sciences Sekem (סכם הנדסה / כמותי): Combination of Quantitative Psychometric score, General Psychometric score, and Math / Physics Bagrut grades.
 */

export interface SubjectInput {
	name: string;
	units: number;
	grade: number;
}

export interface BguCalculationInput {
	bagrutSubjects: SubjectInput[];
	psychometricGeneral: number;
	psychometricQuant?: number;
	psychometricVerbal?: number;
	psychometricEnglish?: number;
	mathGrade: number;
	mathUnits: number;
	physicsGrade?: number;
	physicsUnits?: number;
}

export interface BguCalculationResult {
	bagrutAverage: number;
	generalSekem: number;
	engineeringSekem: number;
	directBagrutEligible: boolean;
	optimalUnits?: number;
	droppedSubjects?: string[];
}

export interface OptimalBguBagrutResult {
	average: number;
	optimalUnits: number;
	totalUnits: number;
	droppedSubjects: SubjectInput[];
	includedSubjects: SubjectInput[];
}

/**
 * Returns BGU official bonus points for a subject:
 * Bonuses are only granted for passing grades (grade >= 60):
 * - 5 units Math: +35 points (national reform standard)
 * - 4 units Math: +15 points
 * - 5 units English: +25 points
 * - 4 units English: +12.5 points
 * - 5 units Physics / CS / Chemistry / Biology: +25 points
 * - 5 units Literature / Bible / History / Arabic: +25 points
 * - Other 5 units electives: +20 points
 * - Other 4 units electives: +10 points
 */
export function getBguSubjectBonus(sub: SubjectInput): number {
	if (sub.grade < 60) return 0;
	const n = sub.name.trim();

	if (n.includes('מתמטיקה')) {
		if (sub.units === 5) return 35;
		if (sub.units === 4) return 15;
		return 0;
	}

	if (n.includes('אנגלית')) {
		if (sub.units === 5) return 25;
		if (sub.units === 4) return 12.5;
		return 0;
	}

	if (sub.units === 5) {
		if (
			n.includes('פיזיקה') ||
			n.includes('מדעי המחשב') ||
			n.includes('כימיה') ||
			n.includes('ביולוגיה') ||
			n.includes('סייבר') ||
			n.includes('היסטוריה') ||
			n.includes('אזרחות') ||
			n.includes('ספרות') ||
			n.includes('תנ"ך') ||
			n.includes('ערבית')
		) {
			return 25;
		}
		return 20;
	}

	if (sub.units === 4) {
		return 10;
	}

	return 0;
}

/**
 * Checks if a subject is mandatory and non-droppable at BGU:
 * Mandatory: Math, English, Civics, Hebrew Expression, History.
 */
export function isBguMandatorySubject(name: string): boolean {
	const n = name.trim();
	if (n.includes('מתמטיקה')) return true;
	if (n.includes('אנגלית')) return true;
	if (n.includes('אזרחות')) return true;
	if (n.includes('הבעה') || n.includes('לשון') || (n.includes('עברית') && !n.includes('ספרות'))) return true;
	if (
		n.includes('היסטוריה') ||
		n.includes('תע"י') ||
		n.includes('תולדות עם ישראל') ||
		n.includes('ידע העם והמדינה')
	)
		return true;
	return false;
}

/**
 * Calculates BGU Optimal Bagrut Average:
 * Evaluates candidate subjects to maximize average while retaining >= 20 units and at least 1 advanced subject (>= 4 units) other than English.
 */
export function calculateOptimalBguBagrut(subjects: SubjectInput[]): OptimalBguBagrutResult {
	if (!subjects || subjects.length === 0) {
		return { average: 0, optimalUnits: 0, totalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) {
		return { average: 0, optimalUnits: 0, totalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const mandatorySubs = activeSubs.filter((s) => isBguMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isBguMandatorySubject(s.name));

	if (totalActiveUnits < 20 || droppableSubs.length === 0) {
		let totalScore = 0;
		for (const s of activeSubs) {
			totalScore += (s.grade + getBguSubjectBonus(s)) * s.units;
		}
		const rawAvg = Math.round((totalScore / totalActiveUnits) * 100) / 100;
		return {
			average: Math.min(125, rawAvg),
			optimalUnits: totalActiveUnits,
			totalUnits: totalActiveUnits,
			droppedSubjects: [],
			includedSubjects: activeSubs
		};
	}

	const candidates = droppableSubs.slice(0, 12);
	let bestAvg = 0;
	let bestUnits = totalActiveUnits;
	let bestDropped: SubjectInput[] = [];
	let bestIncluded: SubjectInput[] = activeSubs;

	const numSubsets = 1 << candidates.length;
	for (let mask = 0; mask < numSubsets; mask++) {
		const currentIncluded = [...mandatorySubs];
		const currentDropped: SubjectInput[] = [];

		for (let i = 0; i < candidates.length; i++) {
			if ((mask & (1 << i)) !== 0) {
				currentIncluded.push(candidates[i]);
			} else {
				currentDropped.push(candidates[i]);
			}
		}

		const currentUnits = currentIncluded.reduce((sum, s) => sum + s.units, 0);
		if (currentUnits < 20) continue;

		const hasAdvanced = currentIncluded.some((s) => !s.name.includes('אנגלית') && s.units >= 4);
		if (!hasAdvanced) continue;

		let currentScore = 0;
		for (const s of currentIncluded) {
			currentScore += (s.grade + getBguSubjectBonus(s)) * s.units;
		}

		const avg = Math.round((currentScore / currentUnits) * 100) / 100;
		if (avg > bestAvg || (avg === bestAvg && currentUnits > bestUnits)) {
			bestAvg = avg;
			bestUnits = currentUnits;
			bestDropped = currentDropped;
			bestIncluded = currentIncluded;
		}
	}

	return {
		average: Math.min(125, bestAvg),
		optimalUnits: bestUnits,
		totalUnits: totalActiveUnits,
		droppedSubjects: bestDropped,
		includedSubjects: bestIncluded
	};
}

/**
 * Standard Bagrut Average without dropping (for fallback)
 */
export function calculateBguBagrutAverage(subjects: SubjectInput[]): number {
	return calculateOptimalBguBagrut(subjects).average;
}

/**
 * Calculates BGU General Sekem (סכם כללי):
 * Formula based on standardized 200-800 scale:
 * BT = Bagrut * 10 - 330
 * Sekem = 0.5 * Psychometric + 0.5 * BT = 0.5 * Psychometric + 5 * Bagrut - 165
 */
export function calculateBguGeneralSekem(bagrutAverage: number, psychometricGeneral: number): number {
	if (bagrutAverage <= 0 || psychometricGeneral <= 0) return 0;
	const bt = bagrutAverage * 10 - 330;
	const rawSekem = 0.5 * psychometricGeneral + 0.5 * bt;
	return Math.min(800, Math.max(200, Math.round(rawSekem)));
}

/**
 * Calculates BGU Engineering / Quantitative Sekem (סכם הנדסה):
 * Formula:
 * Sekem_Engineering = (0.45 * Psych_Quant) + (0.25 * Psych_General) + (0.30 * Math_Bagrut_Scaled_Score) + Physics_Factor
 * Scale: 200 - 800
 */
export function calculateBguEngineeringSekem(
	mathGrade: number,
	mathUnits: number,
	psychometricGeneral: number,
	psychometricQuant: number = psychometricGeneral,
	physicsGrade: number = 0,
	physicsUnits: number = 0,
	bagrutAverage: number = 0,
	scienceBonus: number = 0
): number {
	if (psychometricGeneral <= 0 && psychometricQuant <= 0 && mathGrade <= 0 && bagrutAverage <= 0) return 0;

	// Calculate Math component (converted to 200-800 scale)
	let mathBonus = 0;
	if (mathGrade >= 60) {
		if (mathUnits === 5) mathBonus = 35;
		else if (mathUnits === 4) mathBonus = 15;
	}

	const mathFinal = mathGrade > 0 ? Math.min(125, mathGrade + mathBonus) : 0;
	// Scale 100-125 Bagrut to 500-800 equivalent:
	const mathScaled = mathGrade > 0 ? (mathFinal / 125) * 800 : 0;

	// Science factor: 5 units in Physics or other scientific elective (CS, Chemistry, Biology)
	let finalScienceBonus = scienceBonus;
	if (finalScienceBonus === 0 && physicsUnits === 5 && physicsGrade >= 70) {
		finalScienceBonus = (physicsGrade / 100) * 20; // Up to 20 bonus points on Engineering Sekem
	}

	const quantWeight = psychometricQuant > 0 ? psychometricQuant : psychometricGeneral;

	// BGU Engineering Sekem balances Quantitative/Psychometric ability with overall Bagrut achievement:
	// When bagrutAverage is provided, it incorporates the full Bagrut standing (BT = Bagrut * 10 - 330)
	let rawSekem: number;
	if (bagrutAverage > 0) {
		const bt = bagrutAverage * 10 - 330;
		rawSekem =
			0.30 * quantWeight +
			0.20 * psychometricGeneral +
			0.25 * mathScaled +
			0.25 * bt +
			finalScienceBonus;
	} else {
		rawSekem =
			0.45 * quantWeight + 0.25 * psychometricGeneral + 0.30 * mathScaled + finalScienceBonus;
	}

	if (rawSekem <= 0) return 0;
	return Math.min(800, Math.max(200, Math.round(rawSekem * 10) / 10));
}

/**
 * Calculates full BGU Admission Evaluation
 */
export function calculateBguAdmission(input: BguCalculationInput): BguCalculationResult {
	const optimal = calculateOptimalBguBagrut(input.bagrutSubjects);
	const bagrutAvg = optimal.average;
	const generalSekem = calculateBguGeneralSekem(bagrutAvg, input.psychometricGeneral);

	// Detect top 5-unit scientific elective (Physics, Computer Science, Chemistry, Biology)
	let scienceBonus = 0;
	const scienceNames = ['פיזיקה', 'מדעי המחשב', 'מדעי התוכנה', 'הנדסת תוכנה', 'כימיה', 'ביולוגיה'];
	const matchingSciences = input.bagrutSubjects.filter(
		(s) => scienceNames.some((sn) => s.name.includes(sn)) && s.units === 5 && s.grade >= 70
	);
	if (matchingSciences.length > 0) {
		const topScore = Math.max(...matchingSciences.map((s) => s.grade));
		scienceBonus = (topScore / 100) * 20;
	} else if (input.physicsUnits === 5 && (input.physicsGrade || 0) >= 70) {
		scienceBonus = ((input.physicsGrade || 0) / 100) * 20;
	}

	const rawEngSekem = calculateBguEngineeringSekem(
		input.mathGrade,
		input.mathUnits,
		input.psychometricGeneral,
		input.psychometricQuant,
		input.physicsGrade,
		input.physicsUnits,
		bagrutAvg,
		scienceBonus
	);

	// In BGU, an applicant who qualifies via general Sekem is also admitted
	const engineeringSekem = Math.max(rawEngSekem, generalSekem);

	const directBagrutEligible = bagrutAvg >= 104;

	return {
		bagrutAverage: bagrutAvg,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		optimalUnits: optimal.optimalUnits,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
