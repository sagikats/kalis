/**
 * Pure Reichman University (אוניברסיטת רייכמן - הבינתחומי הרצליה) Admission Calculator
 * Official Formulas: General Combined Sekem & Direct Bagrut Pathways
 * Subagent 3: Data Verification & Institution Calculators
 */

import {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult,
	DroppedSubjectInfo
} from './types';

const REICHMAN_MANDATORY_SUBJECTS = [
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

export function isReichmanMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return REICHMAN_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

/**
 * Reichman University Official Bonus Points:
 * Passing grades (>= 60):
 * - Mathematics: 5 units: +35 points | 4 units: +12.5 points
 * - English: 5 units: +25 points | 4 units: +12.5 points
 * - Sciences & Tech 5 units (Physics, CS, Chemistry, Biology): +25 points
 * - Other 5 units electives: +20 points
 * - Other 4 units electives: +10 points
 */
export function getReichmanBonus(subject: CalculatorSubject): number {
	if (subject.grade < 60) return 0;
	const n = subject.name.trim();

	if (n.includes('מתמטיקה')) {
		if (subject.units === 5) return 35;
		if (subject.units === 4) return 12.5;
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
			n.includes('מדעי המחשב') ||
			n.includes('כימיה') ||
			n.includes('ביולוגיה') ||
			n.includes('אלקטרוניקה')
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

export function calculateReichmanOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	if (!subjects || subjects.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const mandatorySubs = activeSubs.filter((s) => isReichmanMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isReichmanMandatorySubject(s.name));

	const mandatoryUnits = mandatorySubs.reduce((sum, s) => sum + s.units, 0);

	// Fallback if total units < 20 or no droppable electives
	if (totalActiveUnits < 20 || mandatoryUnits >= totalActiveUnits || droppableSubs.length === 0) {
		let totalScore = 0;
		for (const s of activeSubs) {
			totalScore += (s.grade + getReichmanBonus(s)) * s.units;
		}
		const avg = Math.round((totalScore / totalActiveUnits) * 100) / 100;
		return {
			average: Math.min(125, avg),
			optimalUnits: totalActiveUnits,
			totalOriginalUnits: totalActiveUnits,
			droppedSubjects: [],
			includedSubjects: activeSubs
		};
	}

	let bestAvg = 0;
	let bestDropped: DroppedSubjectInfo[] = [];
	let bestIncluded: CalculatorSubject[] = activeSubs;
	let bestUnits = totalActiveUnits;

	const numSubsets = 1 << droppableSubs.length;

	for (let mask = 0; mask < numSubsets; mask++) {
		const currentIncluded = [...mandatorySubs];
		const currentDropped: DroppedSubjectInfo[] = [];
		let currentUnits = mandatoryUnits;

		for (let i = 0; i < droppableSubs.length; i++) {
			const sub = droppableSubs[i];
			if ((mask & (1 << i)) !== 0) {
				currentIncluded.push(sub);
				currentUnits += sub.units;
			} else {
				const effScore = sub.grade + getReichmanBonus(sub);
				currentDropped.push({
					name: sub.name,
					units: sub.units,
					grade: sub.grade,
					effectiveScoreWithBonus: effScore,
					reason: 'השמטה חוקית ברייכמן: שקלול המקצוע הוריד את הממוצע האופטימלי'
				});
			}
		}

		if (currentUnits < 20) continue;

		let totalScore = 0;
		for (const s of currentIncluded) {
			totalScore += (s.grade + getReichmanBonus(s)) * s.units;
		}

		const avg = Math.round((totalScore / currentUnits) * 100) / 100;
		if (avg > bestAvg || (avg === bestAvg && currentUnits > bestUnits)) {
			bestAvg = avg;
			bestDropped = currentDropped;
			bestIncluded = currentIncluded;
			bestUnits = currentUnits;
		}
	}

	return {
		average: Math.min(125, bestAvg),
		optimalUnits: bestUnits,
		totalOriginalUnits: totalActiveUnits,
		droppedSubjects: bestDropped,
		includedSubjects: bestIncluded
	};
}

/**
 * Calculates Reichman Combined Admission Sekem (ציון קבלה משולב):
 * Formula:
 * BT = Bagrut * 10 - 330
 * Sekem = 0.5 * Psychometric + 0.5 * BT
 * Scale: 200 - 800
 */
export function calculateReichmanGeneralSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const bt = Math.round((bagrutAverage * 10 - 330) * 10) / 10;
	const rawSekem = 0.5 * psychometric + 0.5 * bt;
	return Math.min(800, Math.max(200, Math.round(rawSekem)));
}

/**
 * Evaluates full Reichman admission metrics for a candidate profile
 */
export function evaluateReichman(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateReichmanOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;
	const quant = input.psychometricQuant || psych;

	const generalSekem = calculateReichmanGeneralSekem(optimal.average, psych);
	// In Reichman CS and Data, quantitative emphasis is prioritized
	const mathSub = input.bagrutSubjects.find((s) => s.name.includes('מתמטיקה'));
	const mathUnits = input.mathUnits ?? (mathSub ? mathSub.units : 4);
	const mathGrade = input.mathGrade ?? (mathSub ? mathSub.grade : 80);

	let mathFactor = 0;
	if (mathUnits === 5 && mathGrade >= 80) mathFactor = 10;

	const bt = optimal.average > 0 ? Math.round((optimal.average * 10 - 330) * 10) / 10 : 0;
	const rawEng = bt > 0 && quant > 0 ? 0.55 * quant + 0.45 * bt + mathFactor : 0;
	const engineeringSekem = Math.min(800, Math.max(200, Math.round(rawEng)));

	// Direct Bagrut Admission in Reichman:
	// Available for Bagrut >= 100.0 across Law, Business, Psychology, Economics, Government, Communications
	const directBagrutEligible = optimal.average >= 100.0;

	const notes: string[] = [];
	if (directBagrutEligible) {
		notes.push('ממוצע בגרות עומד ברף קבלה ישירה (100.0 ומעלה) באוניברסיטת רייכמן למשפטים, מנהל עסקים וחוגים נבחרים.');
	}
	if (optimal.droppedSubjects.length > 0) {
		notes.push(`הושמטו ${optimal.droppedSubjects.length} מקצועות בחירה לטובת מקסום הממוצע האופטימלי.`);
	}

	return {
		institutionId: 'reichman',
		institutionName: 'אוניברסיטת רייכמן (הבינתחומי)',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
