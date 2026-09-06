/**
 * Pure Ariel University (אוניברסיטת אריאל בשומרון) Admission Calculator
 * Official Formula: Combined_Score = ((Bagrut_Average * 6.666) + Psychometric) / 2
 * Subagent 3: Data Verification & Institution Calculators
 */

import {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult,
	DroppedSubjectInfo
} from './types';

const ARIEL_MANDATORY_SUBJECTS = [
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

export function isArielMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return ARIEL_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

export function getArielBonus(subject: CalculatorSubject): number {
	if (subject.grade < 60) return 0;
	const n = subject.name.trim();

	if (n.includes('מתמטיקה')) {
		if (subject.units === 5) return 35;
		if (subject.units === 4) return 15;
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
			n.includes('כימיה') ||
			n.includes('ביולוגיה') ||
			n.includes('מדעי המחשב') ||
			n.includes('הנדס') ||
			n.includes('ספרות') ||
			n.includes('תנ"ך') ||
			n.includes('תנ״ך') ||
			n.includes('היסטוריה')
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

export function calculateArielOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	if (!subjects || subjects.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const mandatorySubs = activeSubs.filter((s) => isArielMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isArielMandatorySubject(s.name));

	const mandatoryUnits = mandatorySubs.reduce((sum, s) => sum + s.units, 0);

	if (totalActiveUnits < 20 || mandatoryUnits >= totalActiveUnits || droppableSubs.length === 0) {
		let totalScore = 0;
		for (const s of activeSubs) {
			totalScore += (s.grade + getArielBonus(s)) * s.units;
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
				const effScore = sub.grade + getArielBonus(sub);
				currentDropped.push({
					name: sub.name,
					units: sub.units,
					grade: sub.grade,
					effectiveScoreWithBonus: effScore,
					reason: 'השמטה חוקית באוניברסיטת אריאל'
				});
			}
		}

		if (currentUnits < 20) continue;

		let totalScore = 0;
		for (const s of currentIncluded) {
			totalScore += (s.grade + getArielBonus(s)) * s.units;
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

export function calculateArielSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const raw = (bagrutAverage * 6.666 + psychometric) / 2;
	return Math.min(800, Math.max(200, Math.round(raw)));
}

export function evaluateAriel(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateArielOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;
	const quant = input.psychometricQuant || psych;

	const generalSekem = calculateArielSekem(optimal.average, psych);
	const engineeringSekem = calculateArielSekem(optimal.average, quant);

	const directBagrutEligible = optimal.average >= 100;

	return {
		institutionId: 'ariel',
		institutionName: 'אוניברסיטת אריאל בשומרון',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes: directBagrutEligible
			? ['ממוצע בגרות עומד ברף קבלה ישירה (100 ומעלה) באוניברסיטת אריאל לחוגים זכאים.']
			: [],
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
