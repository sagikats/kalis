import { SubjectInput } from './bguCalculator';

export interface TechnionCalculatorInput {
	bagrutSubjects: SubjectInput[];
	psychometricGeneral: number;
	psychometricQuant?: number;
	mathGrade: number;
	mathUnits: number;
	physicsGrade?: number;
	physicsUnits?: number;
}

export interface TechnionCalculatorResult {
	bagrutAverage: number;
	generalSekem: number; // סכם טכניוני רשמי (סולם 0-100)
	engineeringSekem?: number;
	directBagrutEligible: boolean;
	optimalUnits: number;
	droppedSubjects: string[];
	hasClusterBonus: boolean;
}

export interface OptimalTechnionBagrutResult {
	average: number;
	optimalUnits: number;
	totalUnits: number;
	droppedSubjects: SubjectInput[];
	includedSubjects: SubjectInput[];
	hasClusterBonus: boolean;
}

/**
 * Checks if candidate is eligible for Technion's increased scientific/technological cluster bonus (בונוס מצרף מדעי/טכנולוגי):
 * Candidate must have:
 * - 5 units Math with passing grade (>= 60)
 * AND:
 * - At least 2 scientific 5-unit subjects (Physics, Chemistry, Biology), OR
 * - 1 scientific 5-unit subject + 1 recognized technological 5-unit subject (CS, Electronics, Engineering Sciences, Biotechnology).
 * Eligible candidates receive +30 points bonus instead of +25 for each of these subjects!
 */
export function checkTechnionClusterEligibility(subjects: SubjectInput[]): boolean {
	const math5 = subjects.some(
		(s) => s.name.trim().includes('מתמטיקה') && s.units === 5 && s.grade >= 60
	);
	if (!math5) return false;

	const sciences = subjects.filter(
		(s) =>
			s.units === 5 &&
			s.grade >= 60 &&
			(s.name.includes('פיזיקה') || s.name.includes('כימיה') || s.name.includes('ביולוגיה'))
	);

	const techs = subjects.filter(
		(s) =>
			s.units === 5 &&
			s.grade >= 60 &&
			(s.name.includes('מדעי המחשב') ||
				s.name.includes('אלקטרוניקה') ||
				s.name.includes('הנדס') ||
				s.name.includes('ביוטכנולוגיה'))
	);

	if (sciences.length >= 2) return true;
	if (sciences.length >= 1 && techs.length >= 1) return true;
	return false;
}

/**
 * Returns Technion official bonus for a subject:
 * Bonuses apply only if grade >= 60:
 * - Math 5 units: +30 points (weight is doubled to 10)
 * - Math 4 units: +10 points (weight is doubled to 8)
 * - English 5 units: +25 points
 * - English 4 units: +10 points
 * - Scientific/Tech cluster 5 units (with eligibility): +30 points
 * - Science/Tech 5 units (without cluster): +25 points
 * - Literature 5u, Bible 5u, History 5u, Arabic 5u: +25 points
 * - Other 5 units: +20 points
 * - Other 4 units: +10 points
 */
export function getTechnionSubjectBonus(sub: SubjectInput, hasCluster: boolean): number {
	if (sub.grade < 60) return 0;
	const n = sub.name.trim();

	if (n.includes('מתמטיקה')) {
		if (sub.units === 5) return 30;
		if (sub.units === 4) return 10;
		return 0;
	}

	if (n.includes('אנגלית')) {
		if (sub.units === 5) return 25;
		if (sub.units === 4) return 10;
		return 0;
	}

	const isSci = n.includes('פיזיקה') || n.includes('כימיה') || n.includes('ביולוגיה');
	const isTech =
		n.includes('מדעי המחשב') ||
		n.includes('אלקטרוניקה') ||
		n.includes('ביוטכנולוגיה') ||
		n.includes('הנדס');

	if (sub.units === 5) {
		if (hasCluster && (isSci || isTech)) {
			return 30;
		}
		if (isSci || isTech) return 25;
		if (
			n.includes('ספרות') ||
			n.includes('תנ"ך') ||
			n.includes('היסטוריה') ||
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
 * Checks if a subject is mandatory and non-droppable according to Technion regulations:
 * Mandatory at Technion:
 * - Mathematics
 * - English
 * - Civics (אזרחות)
 * - Hebrew Expression (הבעה עברית / לשון)
 * - History (היסטוריה / תע"י)
 * - Literature (ספרות)
 * - Bible (תנ"ך)
 */
export function isTechnionMandatorySubject(name: string): boolean {
	const n = name.trim();
	if (n.includes('מתמטיקה')) return true;
	if (n.includes('אנגלית')) return true;
	if (n.includes('אזרחות')) return true;
	if (n.includes('הבעה') || n.includes('עברית') || n.includes('לשון')) return true;
	if (
		n.includes('היסטוריה') ||
		n.includes('תע"י') ||
		n.includes('תולדות עם ישראל') ||
		n.includes('ידע העם והמדינה')
	)
		return true;
	if (n.includes('ספרות')) return true;
	if (n.includes('תנ"ך')) return true;
	return false;
}

/**
 * Calculates Technion Optimal Bagrut Average:
 * 1. Doubles Mathematics units weight in divisor and products (5u -> 10, 4u -> 8).
 * 2. Awards cluster bonus (+30) for qualifying science/tech subjects.
 * 3. Keeps all mandatory subjects (including Bible and Literature).
 * 4. Optimally drops non-mandatory electives that decrease average, provided remaining units >= 20.
 * 5. Capped at 119.
 */
export function calculateOptimalTechnionBagrut(
	subjects: SubjectInput[]
): OptimalTechnionBagrutResult {
	if (!subjects || subjects.length === 0) {
		return {
			average: 0,
			optimalUnits: 0,
			totalUnits: 0,
			droppedSubjects: [],
			includedSubjects: [],
			hasClusterBonus: false
		};
	}

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) {
		return {
			average: 0,
			optimalUnits: 0,
			totalUnits: 0,
			droppedSubjects: [],
			includedSubjects: [],
			hasClusterBonus: false
		};
	}

	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const hasCluster = checkTechnionClusterEligibility(activeSubs);

	const mandatorySubs = activeSubs.filter((s) => isTechnionMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isTechnionMandatorySubject(s.name));

	if (droppableSubs.length === 0) {
		let totalScore = 0;
		let totalWeight = 0;
		for (const s of activeSubs) {
			const w = s.name.trim().includes('מתמטיקה') ? s.units * 2 : s.units;
			totalScore += (s.grade + getTechnionSubjectBonus(s, hasCluster)) * w;
			totalWeight += w;
		}
		const avg =
			totalWeight > 0 ? Math.min(119, Math.round((totalScore / totalWeight) * 10) / 10) : 0;
		return {
			average: avg,
			optimalUnits: totalActiveUnits,
			totalUnits: totalActiveUnits,
			droppedSubjects: [],
			includedSubjects: activeSubs,
			hasClusterBonus: hasCluster
		};
	}

	const candidates = droppableSubs.slice(0, 10);
	let bestAvg = 0;
	let bestDropped: SubjectInput[] = [];
	let bestIncluded: SubjectInput[] = activeSubs;
	let bestUnits = totalActiveUnits;

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

		let totalScore = 0;
		let totalWeight = 0;
		for (const s of currentIncluded) {
			const w = s.name.trim().includes('מתמטיקה') ? s.units * 2 : s.units;
			totalScore += (s.grade + getTechnionSubjectBonus(s, hasCluster)) * w;
			totalWeight += w;
		}

		const avg = Math.round((totalScore / totalWeight) * 10) / 10;
		if (avg > bestAvg || (avg === bestAvg && currentUnits > bestUnits)) {
			bestAvg = avg;
			bestDropped = currentDropped;
			bestIncluded = currentIncluded;
			bestUnits = currentUnits;
		}
	}

	return {
		average: Math.min(119, bestAvg),
		optimalUnits: bestUnits,
		totalUnits: totalActiveUnits,
		droppedSubjects: bestDropped,
		includedSubjects: bestIncluded,
		hasClusterBonus: hasCluster
	};
}

/**
 * Calculates Technion Official Admission Sekem (סכם טכניוני רשמי):
 * Formula for all general & engineering tracks (except Architecture/Landscape Architecture):
 * S = 0.5 * D + 0.075 * P - 19
 * Where:
 * D = Optimal Bagrut Average (capped at 119)
 * P = General Psychometric Score (or quantitative track)
 * Scale: 0 - 100
 */
export function calculateTechnionSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const d = Math.min(119, bagrutAverage);
	const raw = 0.5 * d + 0.075 * psychometric - 19;
	return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
}

/**
 * Calculates full Technion Admission Evaluation
 */
export function calculateTechnionAdmission(
	input: TechnionCalculatorInput
): TechnionCalculatorResult {
	const optimal = calculateOptimalTechnionBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral;
	const quant =
		input.psychometricQuant && input.psychometricQuant > 0 ? input.psychometricQuant : psych;

	const generalSekem = calculateTechnionSekem(optimal.average, psych);
	const engineeringSekem = calculateTechnionSekem(optimal.average, quant);

	const directBagrutEligible = optimal.average >= 108;

	return {
		bagrutAverage: optimal.average,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		optimalUnits: optimal.optimalUnits,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name),
		hasClusterBonus: optimal.hasClusterBonus
	};
}
