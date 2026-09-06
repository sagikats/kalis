/**
 * Pure Tel Aviv University (אוניברסיטת תל אביב) Admission Calculator
 * Official Formulas: General Sekem & Exact Engineering Sekem (פקולטה להנדסה)
 * Subagent 3: Data Verification & Institution Calculators
 */

import {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult,
	DroppedSubjectInfo
} from './types';

const TAU_MANDATORY_SUBJECTS = [
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

export function isTauMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return TAU_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

export function getTauBonus(subject: CalculatorSubject): number {
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

	const isSci =
		n.includes('פיזיקה') ||
		n.includes('כימיה') ||
		n.includes('ביולוגיה') ||
		n.includes('מדעי המחשב');

	if (subject.units >= 5) {
		if (isSci) return 25;
		return 20;
	}

	if (subject.units === 4) {
		return 10;
	}

	return 0;
}

export function calculateTauOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	if (!subjects || subjects.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const mandatorySubs = activeSubs.filter((s) => isTauMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isTauMandatorySubject(s.name));

	const mandatoryUnits = mandatorySubs.reduce((sum, s) => sum + s.units, 0);

	if (totalActiveUnits < 20 || mandatoryUnits >= totalActiveUnits || droppableSubs.length === 0) {
		let totalScore = 0;
		for (const s of activeSubs) {
			totalScore += (s.grade + getTauBonus(s)) * s.units;
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
				const effScore = sub.grade + getTauBonus(sub);
				currentDropped.push({
					name: sub.name,
					units: sub.units,
					grade: sub.grade,
					effectiveScoreWithBonus: effScore,
					reason: 'השמטה חוקית באת״א: שיפור הממוצע האופטימלי'
				});
			}
		}

		if (currentUnits < 20) continue;

		let totalScore = 0;
		for (const s of currentIncluded) {
			totalScore += (s.grade + getTauBonus(s)) * s.units;
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

export function calculateTauGeneralSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const zBagrut = (bagrutAverage - 100) / 7.5;
	const zPsych = (psychometric - 550) / 95;
	const composite = 0.5 * zBagrut + 0.5 * zPsych;
	const raw = composite * 90 + 550;
	return Math.min(800, Math.max(200, Math.round(raw)));
}

export function calculateTauEngineeringSekem(
	bagrutAverage: number,
	quant: number,
	verbal: number
): number {
	if (bagrutAverage <= 0 || quant <= 0) return 0;
	const v = verbal > 0 ? verbal : quant;
	const raw = 78.239 + 0.0407 * quant + 0.0384 * v + 4.975 * bagrutAverage;
	return Math.min(800, Math.max(200, Math.round(raw)));
}

export function evaluateTau(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateTauOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;
	const quant = input.psychometricQuant || psych;
	const verbal = input.psychometricVerbal || psych;

	const generalSekem = calculateTauGeneralSekem(optimal.average, psych);
	const engineeringSekem = calculateTauEngineeringSekem(optimal.average, quant, verbal);

	const directBagrutEligible = optimal.average >= 105.0;

	return {
		institutionId: 'tau',
		institutionName: 'אוניברסיטת תל אביב',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes: directBagrutEligible
			? ['ממוצע בגרות עומד ברף קבלה ישירה (105 ומעלה) לחוגים זכאים.']
			: [],
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
