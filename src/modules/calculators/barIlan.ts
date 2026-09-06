/**
 * Pure Bar-Ilan University (אוניברסיטת בר-אילן) Admission Calculator
 * Official Formulas: General Sekem & Exact Sciences/Engineering Sekem
 * Subagent 3: Data Verification & Institution Calculators
 */

import {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult,
	DroppedSubjectInfo
} from './types';

const BAR_ILAN_MANDATORY_SUBJECTS = [
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

export function isBarIlanMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return BAR_ILAN_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

/**
 * Bar-Ilan Official Bonus Points:
 * Only passing grades (>= 60) are eligible:
 * - Mathematics 5 units: +35 points | 4 units: +12.5 points
 * - English 5 units: +25 points | 4 units: +12.5 points
 * - Sciences & Tech 5 units (Physics, CS, Chemistry, Biology): +25 points
 * - Jewish Studies & Humanities 5 units (Bible, Jewish Philosophy, Talmud, History, Literature, Arabic): +25 points
 * - Other 5 units electives: +20 points
 * - Other 4 units electives: +10 points
 */
export function getBarIlanBonus(subject: CalculatorSubject): number {
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
			n.includes('אלקטרוניקה') ||
			n.includes('תנ"ך') ||
			n.includes('תנ״ך') ||
			n.includes('מחשבת ישראל') ||
			n.includes('תושב"ע') ||
			n.includes('תלמוד') ||
			n.includes('ספרות') ||
			n.includes('היסטוריה') ||
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

export function calculateBarIlanOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	if (!subjects || subjects.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const activeSubs = subjects.filter((s) => s.units > 0 && s.grade > 0);
	if (activeSubs.length === 0) {
		return { average: 0, optimalUnits: 0, totalOriginalUnits: 0, droppedSubjects: [], includedSubjects: [] };
	}

	const totalActiveUnits = activeSubs.reduce((sum, s) => sum + s.units, 0);
	const mandatorySubs = activeSubs.filter((s) => isBarIlanMandatorySubject(s.name));
	const droppableSubs = activeSubs.filter((s) => !isBarIlanMandatorySubject(s.name));

	const mandatoryUnits = mandatorySubs.reduce((sum, s) => sum + s.units, 0);

	if (totalActiveUnits < 20 || mandatoryUnits >= totalActiveUnits || droppableSubs.length === 0) {
		let totalScore = 0;
		for (const s of activeSubs) {
			totalScore += (s.grade + getBarIlanBonus(s)) * s.units;
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
				const effScore = sub.grade + getBarIlanBonus(sub);
				currentDropped.push({
					name: sub.name,
					units: sub.units,
					grade: sub.grade,
					effectiveScoreWithBonus: effScore,
					reason: 'השמטה חוקית בבר-אילן: שקלול המקצוע הוריד את הממוצע המיטבי'
				});
			}
		}

		if (currentUnits < 20) continue;

		let totalScore = 0;
		for (const s of currentIncluded) {
			totalScore += (s.grade + getBarIlanBonus(s)) * s.units;
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
 * Calculates Bar-Ilan Official General Combined Sekem (ציון התאמה כללי):
 * Formula:
 * BT = Bagrut * 10 - 330
 * Sekem = 0.5 * Psychometric + 0.5 * BT
 * Scale: 200 - 800
 */
export function calculateBarIlanGeneralSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const bt = Math.round((bagrutAverage * 10 - 330) * 10) / 10;
	const rawSekem = 0.5 * psychometric + 0.5 * bt;
	return Math.min(800, Math.max(200, Math.round(rawSekem)));
}

/**
 * Calculates Bar-Ilan Engineering & Exact Sciences Sekem (סכם הנדסה ומדעים מדויקים):
 * In Bar-Ilan Engineering Faculty:
 * Formula places 55% weight on Quantitative Psychometric and 45% on Bagrut standing
 */
export function calculateBarIlanEngineeringSekem(
	bagrutAverage: number,
	quant: number,
	mathUnits: number = 4,
	mathGrade: number = 80
): number {
	if (bagrutAverage <= 0 || quant <= 0) return 0;
	const bt = Math.round((bagrutAverage * 10 - 330) * 10) / 10;

	// Bonus weight if 5 units math with high grade
	let mathFactor = 0;
	if (mathUnits === 5 && mathGrade >= 85) {
		mathFactor = 10;
	}

	const raw = 0.55 * quant + 0.45 * bt + mathFactor;
	return Math.min(800, Math.max(200, Math.round(raw)));
}

export function evaluateBarIlan(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateBarIlanOptimalBagrut(input.bagrutSubjects);
	const mathSub = input.bagrutSubjects.find((s) => s.name.includes('מתמטיקה'));
	const mathUnits = input.mathUnits ?? (mathSub ? mathSub.units : 4);
	const mathGrade = input.mathGrade ?? (mathSub ? mathSub.grade : 80);

	const psych = input.psychometricGeneral || 0;
	const quant = input.psychometricQuant || psych;

	const generalSekem = calculateBarIlanGeneralSekem(optimal.average, psych);
	const engineeringSekem = calculateBarIlanEngineeringSekem(optimal.average, quant, mathUnits, mathGrade);

	// Bar-Ilan Direct Bagrut Admission: Available for Bagrut >= 102.0 in Humanities, Social Sciences, Jewish Studies
	const directBagrutEligible = optimal.average >= 102.0;

	const notes: string[] = [];
	if (directBagrutEligible) {
		notes.push('ממוצע בגרות עומד ברף קבלה ישירה (102.0 ומעלה) באוניברסיטת בר-אילן לחוגים זכאים.');
	}
	if (optimal.droppedSubjects.length > 0) {
		notes.push(`הושמטו ${optimal.droppedSubjects.length} מקצועות בחירה לטובת מקסום הממוצע האופטימלי.`);
	}

	return {
		institutionId: 'bar_ilan',
		institutionName: 'אוניברסיטת בר-אילן',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name)
	};
}
