/**
 * Pure Hebrew University of Jerusalem (האוניברסיטה העברית בירושלים) Admission Calculator
 * Subagent 3: Data Verification & Institution Calculators
 */

import {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult,
	DroppedSubjectInfo
} from './types';

const HUJI_MANDATORY_SUBJECTS = [
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

export function isHujiMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return HUJI_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

export function getHujiBonus(subject: CalculatorSubject): number {
	const n = subject.name.trim();

	if (n.includes('מתמטיקה')) {
		if (subject.units === 5) return 35;
		if (subject.units === 4) return 15; // HUJI gives 15 for 4u Math
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

export function calculateHujiOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	if (!subjects || subjects.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const mandatorySubs = activeSubs.filter((s) => isHujiMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isHujiMandatorySubject(s.name));

	const mandatoryUnits = mandatorySubs.reduce((sum, s) => sum + s.units, 0);

	if (totalActiveUnits < 20 || mandatoryUnits >= totalActiveUnits || droppableSubs.length === 0) {
		let totalScore = 0;
		for (const s of activeSubs) {
			totalScore += (s.grade + getHujiBonus(s)) * s.units;
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
				const effScore = sub.grade + getHujiBonus(sub);
				currentDropped.push({
					name: sub.name,
					units: sub.units,
					grade: sub.grade,
					effectiveScoreWithBonus: effScore,
					reason: 'השמטה חוקית באוניברסיטה העברית: שקלול המקצוע הוריד את הממוצע האופטימלי'
				});
			}
		}

		if (currentUnits < 20) continue;

		let totalScore = 0;
		for (const s of currentIncluded) {
			totalScore += (s.grade + getHujiBonus(s)) * s.units;
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

export function calculateHujiSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const zB = (bagrutAverage - 100) / 8.0;
	const zP = (psychometric - 550) / 100.0;
	const composite = 0.5 * zB + 0.5 * zP;
	const raw = composite * 100.0 + 550.0;
	return Math.min(800, Math.max(200, Math.round(raw)));
}

export function evaluateHuji(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateHujiOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;

	const generalSekem = calculateHujiSekem(optimal.average, psych);
	const directBagrutEligible = optimal.average >= 105.0;

	return {
		institutionId: 'huji',
		institutionName: 'האוניברסיטה העברית בירושלים',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		directBagrutEligible,
		notes: directBagrutEligible
			? ['ממוצע בגרות עומד ברף קבלה ישירה (105 ומעלה) לחוגים זכאים כגון פסיכולוגיה ומדעי החברה.']
			: [],
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
