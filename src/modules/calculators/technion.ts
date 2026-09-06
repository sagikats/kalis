/**
 * Pure Technion (הטכניון - מכון טכנולוגי לישראל) Admission Calculator
 * Official Formula: S = 0.5 * D + 0.075 * P - 19 (Scale 0-100)
 * Subagent 3: Data Verification & Institution Calculators
 */

import {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult,
	DroppedSubjectInfo
} from './types';

const TECHNION_MANDATORY_SUBJECTS = [
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

export function isTechnionMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return TECHNION_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

export function detectTechnionScienceCluster(subjects: CalculatorSubject[]): boolean {
	const fiveUnitSubjects = subjects.filter((s) => s.units >= 5 && s.grade >= 60);
	const hasCoreScience = fiveUnitSubjects.some(
		(s) => s.name.includes('פיזיקה') || s.name.includes('כימיה') || s.name.includes('ביולוגיה')
	);
	const scienceTechCount = fiveUnitSubjects.filter(
		(s) =>
			s.name.includes('פיזיקה') ||
			s.name.includes('כימיה') ||
			s.name.includes('ביולוגיה') ||
			s.name.includes('מדעי המחשב') ||
			s.name.includes('אלקטרוניקה') ||
			s.name.includes('ביוטכנולוגיה') ||
			s.name.includes('הנדס')
	).length;

	return hasCoreScience && scienceTechCount >= 2;
}

export function getTechnionBonus(subject: CalculatorSubject, hasScienceCluster: boolean): number {
	const n = subject.name.trim();

	if (n.includes('מתמטיקה')) {
		if (subject.units === 5) return 35;
		if (subject.units === 4) return 10;
		return 0;
	}

	if (n.includes('אנגלית')) {
		if (subject.units === 5) return 25;
		if (subject.units === 4) return 10;
		return 0;
	}

	const isSci = n.includes('פיזיקה') || n.includes('כימיה') || n.includes('ביולוגיה');
	const isTech =
		n.includes('מדעי המחשב') ||
		n.includes('אלקטרוניקה') ||
		n.includes('ביוטכנולוגיה') ||
		n.includes('הנדס');

	if (subject.units === 5) {
		if (hasScienceCluster && (isSci || isTech)) {
			return 30; // Enhanced science cluster bonus
		}
		if (isSci || isTech) return 25;
		if (n.includes('ספרות') || n.includes('תנ"ך') || n.includes('תנ״ך') || n.includes('היסטוריה') || n.includes('ערבית')) {
			return 25;
		}
		return 20; // General 5-unit elective bonus
	}

	if (subject.units === 4) {
		return 10;
	}

	return 0;
}

export function calculateTechnionOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	if (!subjects || subjects.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const hasCluster = detectTechnionScienceCluster(activeSubs);

	const mandatorySubs = activeSubs.filter((s) => isTechnionMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isTechnionMandatorySubject(s.name));

	const mandatoryUnits = mandatorySubs.reduce((sum, s) => sum + s.units, 0);

	if (totalActiveUnits < 20 || mandatoryUnits >= totalActiveUnits || droppableSubs.length === 0) {
		let totalScore = 0;
		let totalWeight = 0;
		for (const s of activeSubs) {
			const w = s.name.trim().includes('מתמטיקה') ? s.units * 2 : s.units;
			totalScore += (s.grade + getTechnionBonus(s, hasCluster)) * w;
			totalWeight += w;
		}
		const avg = Math.round((totalScore / totalWeight) * 10) / 10;
		return {
			average: Math.min(119, avg),
			optimalUnits: totalActiveUnits,
			totalOriginalUnits: totalActiveUnits,
			droppedSubjects: [],
			includedSubjects: activeSubs,
			hasScienceCluster: hasCluster
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
				const effScore = sub.grade + getTechnionBonus(sub, hasCluster);
				currentDropped.push({
					name: sub.name,
					units: sub.units,
					grade: sub.grade,
					effectiveScoreWithBonus: effScore,
					reason: 'השמטה חוקית: שקלול המקצוע הוריד את הממוצע האופטימלי'
				});
			}
		}

		// Technion minimum unit threshold
		if (currentUnits < 20) continue;

		let totalScore = 0;
		let totalWeight = 0;
		for (const s of currentIncluded) {
			const w = s.name.trim().includes('מתמטיקה') ? s.units * 2 : s.units;
			totalScore += (s.grade + getTechnionBonus(s, hasCluster)) * w;
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
		totalOriginalUnits: totalActiveUnits,
		droppedSubjects: bestDropped,
		includedSubjects: bestIncluded,
		hasScienceCluster: hasCluster
	};
}

export function calculateTechnionSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const d = Math.min(119, bagrutAverage);
	const raw = 0.5 * d + 0.075 * psychometric - 19;
	return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
}

export function evaluateTechnion(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateTechnionOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;
	const quant = input.psychometricQuant && input.psychometricQuant > 0 ? input.psychometricQuant : psych;

	const generalSekem = calculateTechnionSekem(optimal.average, psych);
	const engineeringSekem = calculateTechnionSekem(optimal.average, quant);

	// Technion does NOT allow direct bagrut admission for CS or engineering without psychometric
	const directBagrutEligible = false;

	const notes: string[] = [];
	if (optimal.hasScienceCluster) {
		notes.push('זוהה אשכול מדעי מלא (פיזיקה/כימיה/ביולוגיה + מקצוע טכנולוגי 5 יח״ל) המעניק 30 נקודות בונוס.');
	}
	if (optimal.droppedSubjects.length > 0) {
		notes.push(`הושמטו ${optimal.droppedSubjects.length} מקצועות בחירה לטובת מקסום הממוצע האופטימלי.`);
	}

	return {
		institutionId: 'technion',
		institutionName: 'הטכניון - מכון טכנולוגי לישראל',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
