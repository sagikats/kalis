/**
 * Pure Ben-Gurion University of the Negev (אוניברסיטת בן-גוריון בנגב) Admission Calculator
 * Official Formulas: General Sekem & Faculty of Engineering Sciences Sekem
 * Subagent 3: Data Verification & Institution Calculators
 */

import {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult,
	DroppedSubjectInfo
} from './types';

const BGU_MANDATORY_SUBJECTS = [
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

export function isBguMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return BGU_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

export function getBguBonus(subject: CalculatorSubject): number {
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
			n.includes('מדעי המחשב') ||
			n.includes('כימיה') ||
			n.includes('ביולוגיה') ||
			n.includes('סייבר') ||
			n.includes('היסטוריה') ||
			n.includes('אזרחות') ||
			n.includes('ספרות') ||
			n.includes('תנ"ך') ||
			n.includes('תנ״ך') ||
			n.includes('ערבית')
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

export function calculateBguOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	if (!subjects || subjects.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const mandatorySubs = activeSubs.filter((s) => isBguMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isBguMandatorySubject(s.name));

	const mandatoryUnits = mandatorySubs.reduce((sum, s) => sum + s.units, 0);

	if (totalActiveUnits < 20 || mandatoryUnits >= totalActiveUnits || droppableSubs.length === 0) {
		let totalScore = 0;
		for (const s of activeSubs) {
			totalScore += (s.grade + getBguBonus(s)) * s.units;
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
				const effScore = sub.grade + getBguBonus(sub);
				currentDropped.push({
					name: sub.name,
					units: sub.units,
					grade: sub.grade,
					effectiveScoreWithBonus: effScore,
					reason: 'השמטה חוקית בבן-גוריון: העלאת הממוצע האופטימלי'
				});
			}
		}

		if (currentUnits < 20) continue;

		let totalScore = 0;
		for (const s of currentIncluded) {
			totalScore += (s.grade + getBguBonus(s)) * s.units;
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

export function calculateBguGeneralSekem(bagrutAverage: number, psychometricGeneral: number): number {
	if (bagrutAverage <= 0 || psychometricGeneral <= 0) return 0;
	const bt = bagrutAverage * 10 - 330;
	const rawSekem = 0.5 * psychometricGeneral + 0.5 * bt;
	return Math.min(800, Math.max(200, Math.round(rawSekem)));
}

export function calculateBguEngineeringSekem(
	mathGrade: number,
	mathUnits: number,
	psychometricGeneral: number,
	psychometricQuant: number,
	physicsGrade: number = 0,
	physicsUnits: number = 0,
	bagrutAverage: number = 0
): number {
	if (psychometricGeneral <= 0 && psychometricQuant <= 0 && mathGrade <= 0 && bagrutAverage <= 0) return 0;

	let mathBonus = 0;
	if (mathGrade >= 60) {
		if (mathUnits === 5) mathBonus = 35;
		else if (mathUnits === 4) mathBonus = 15;
	}

	const mathFinal = mathGrade > 0 ? Math.min(125, mathGrade + mathBonus) : 0;
	const mathScaled = mathGrade > 0 ? (mathFinal / 125) * 800 : 0;

	let finalScienceBonus = 0;
	if (physicsUnits === 5 && physicsGrade >= 70) {
		finalScienceBonus = (physicsGrade / 100) * 20;
	}

	const quantWeight = psychometricQuant > 0 ? psychometricQuant : psychometricGeneral;

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
		rawSekem = 0.45 * quantWeight + 0.25 * psychometricGeneral + 0.30 * mathScaled + finalScienceBonus;
	}

	return Math.min(800, Math.max(200, Math.round(rawSekem * 10) / 10));
}

export function evaluateBgu(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateBguOptimalBagrut(input.bagrutSubjects);
	const mathSub = input.bagrutSubjects.find((s) => s.name.includes('מתמטיקה'));
	const mathUnits = input.mathUnits ?? (mathSub ? mathSub.units : 4);
	const mathGrade = input.mathGrade ?? (mathSub ? mathSub.grade : 80);

	const physSub = input.bagrutSubjects.find((s) => s.name.includes('פיזיקה'));
	const physicsUnits = input.physicsUnits ?? (physSub ? physSub.units : 0);
	const physicsGrade = input.physicsGrade ?? (physSub ? physSub.grade : 0);

	const psych = input.psychometricGeneral || 0;
	const quant = input.psychometricQuant || psych;

	const generalSekem = calculateBguGeneralSekem(optimal.average, psych);
	const engineeringSekem = calculateBguEngineeringSekem(
		mathGrade,
		mathUnits,
		psych,
		quant,
		physicsGrade,
		physicsUnits,
		optimal.average
	);

	const directBagrutEligible = optimal.average >= 104.0;

	return {
		institutionId: 'bgu',
		institutionName: 'אוניברסיטת בן-גוריון בנגב',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes: directBagrutEligible
			? ['ממוצע בגרות עומד ברף קבלה ישירה (104 ומעלה) לחוגים זכאים.']
			: [],
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
