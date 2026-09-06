import { calculateBguAdmission, SubjectInput } from './bguCalculator';
import { calculateTauAdmission } from './tauCalculator';
import { calculateTechnionAdmission } from './technionCalculator';
import { calculateHujiAdmission } from './hujiCalculator';
import { calculateHaifaAdmission } from './haifaCalculator';
import { calculateArielAdmission } from './arielCalculator';
import { resolvePsychometricScores } from './psychometricHelper';

export interface UnifiedCalculationInput {
	bagrutSubjects: SubjectInput[];
	psychometricGeneral: number;
	psychometricQuant: number;
	psychometricVerbal?: number;
	psychometricEnglish?: number;
	mathGrade: number;
	mathUnits: number;
	physicsGrade?: number;
	physicsUnits?: number;
}

export interface InstitutionSekemResult {
	institutionId: string;
	institutionName: string;
	logoText: string;
	badgeColor: string;
	bagrutAverage: number;
	generalSekem: number;
	engineeringSekem?: number;
	managementSekem?: number;
	directBagrutEligible: boolean;
	notes?: string;
	droppedSubjects?: string[];
	optimalUnits?: number;
}

/**
 * Standard Bagrut Average fallback
 */
export function calculateStandardBagrutAverage(subjects: SubjectInput[]): number {
	if (!subjects || subjects.length === 0) return 0;

	let totalWeightedGrades = 0;
	let totalUnits = 0;

	for (const sub of subjects) {
		let bonus = 0;
		const subName = sub.name.trim();

		if (sub.grade >= 60) {
			if (subName.includes('מתמטיקה')) {
				if (sub.units === 5) bonus = 35;
				else if (sub.units === 4) bonus = 15;
			} else if (subName.includes('אנגלית')) {
				if (sub.units === 5) bonus = 25;
				else if (sub.units === 4) bonus = 12.5;
			} else if (sub.units === 5) {
				if (
					subName.includes('פיזיקה') ||
					subName.includes('מדעי המחשב') ||
					subName.includes('כימיה') ||
					subName.includes('ביולוגיה')
				) {
					bonus = 25;
				} else {
					bonus = 20;
				}
			}
		}

		const adjustedGrade = sub.grade > 0 ? sub.grade + bonus : 0;
		totalWeightedGrades += adjustedGrade * sub.units;
		totalUnits += sub.units;
	}

	if (totalUnits === 0) return 0;
	return Math.min(125, Math.round((totalWeightedGrades / totalUnits) * 100) / 100);
}

/**
 * Evaluates scores across all requested institutions using official calculation engines
 */
export function calculateMultiInstitutionSekem(
	input: UnifiedCalculationInput,
	selectedInstitutionIds: string[]
): InstitutionSekemResult[] {
	const psychResolution = resolvePsychometricScores({
		general: input.psychometricGeneral,
		quant: input.psychometricQuant,
		verbal: input.psychometricVerbal,
		english: input.psychometricEnglish
	});

	const psych = psychResolution.effectiveGeneral;
	const quant = psychResolution.effectiveQuantEmphasis;
	const verbal = psychResolution.effectiveVerbalEmphasis;

	// Auto-resolve math and physics from bagrutSubjects if present
	let resolvedMathGrade = input.mathGrade || 0;
	let resolvedMathUnits = input.mathUnits || 0;
	let resolvedPhysicsGrade = input.physicsGrade || 0;
	let resolvedPhysicsUnits = input.physicsUnits || 0;

	if (input.bagrutSubjects && input.bagrutSubjects.length > 0) {
		const mathSub = input.bagrutSubjects.find((s) => s.name.includes('מתמטיקה'));
		if (mathSub) {
			resolvedMathGrade = mathSub.grade;
			resolvedMathUnits = mathSub.units;
		}
		const physSub = input.bagrutSubjects.find((s) => s.name.includes('פיזיקה'));
		if (physSub) {
			resolvedPhysicsGrade = physSub.grade;
			resolvedPhysicsUnits = physSub.units;
		}
	}

	const commonCalcInput = {
		bagrutSubjects: input.bagrutSubjects,
		psychometricGeneral: psych,
		psychometricQuant: quant,
		psychometricVerbal: verbal,
		psychometricEnglish: input.psychometricEnglish,
		mathGrade: resolvedMathGrade,
		mathUnits: resolvedMathUnits,
		physicsGrade: resolvedPhysicsGrade,
		physicsUnits: resolvedPhysicsUnits
	};

	// 1. TAU
	const tauRes = calculateTauAdmission(commonCalcInput);

	// 2. Technion
	const techRes = calculateTechnionAdmission(commonCalcInput);

	// 3. BGU
	const bguRes = calculateBguAdmission(commonCalcInput);

	// 4. HUJI
	const hujiRes = calculateHujiAdmission(commonCalcInput);

	// 5. Haifa
	const haifaRes = calculateHaifaAdmission(commonCalcInput);

	// 6. Ariel
	const arielRes = calculateArielAdmission(commonCalcInput);

	const allInstitutions: Record<string, InstitutionSekemResult> = {
		bgu: {
			institutionId: 'bgu',
			institutionName: 'אוניברסיטת בן-גוריון בנגב',
			logoText: 'BGU',
			badgeColor: 'from-cyan-500 to-blue-600',
			bagrutAverage: bguRes.bagrutAverage,
			generalSekem: bguRes.generalSekem,
			engineeringSekem: bguRes.engineeringSekem,
			directBagrutEligible: bguRes.directBagrutEligible,
			droppedSubjects: bguRes.droppedSubjects,
			optimalUnits: bguRes.optimalUnits,
			notes:
				bguRes.droppedSubjects && bguRes.droppedSubjects.length > 0
					? `ממוצע אופטימלי (הושמטו: ${bguRes.droppedSubjects.join(', ')}), סכם הנדסה וכללי רשמי`
					: 'סכם כללי וסכם הנדסה רשמי לפי נוסחאות ב"ג'
		},
		tau: {
			institutionId: 'tau',
			institutionName: 'אוניברסיטת תל אביב',
			logoText: 'TAU',
			badgeColor: 'from-purple-500 to-indigo-600',
			bagrutAverage: tauRes.bagrutAverage,
			generalSekem: tauRes.generalSekem,
			engineeringSekem: tauRes.quantitativeSekem,
			managementSekem: tauRes.managementSekem,
			directBagrutEligible: tauRes.directBagrutEligible,
			droppedSubjects: tauRes.droppedSubjects,
			optimalUnits: tauRes.optimalUnits,
			notes:
				tauRes.droppedSubjects && tauRes.droppedSubjects.length > 0
					? `ממוצע אופטימלי (הושמטו: ${tauRes.droppedSubjects.join(', ')})`
					: 'ציון התאמה רב-תחומי, הנדסי (בונוס +10 ל-5 יח״ל מתמטיקה ופיזיקה) ולניהול'
		},
		technion: {
			institutionId: 'technion',
			institutionName: 'הטכניון - מכון טכנולוגי לישראל',
			logoText: 'IIT',
			badgeColor: 'from-blue-600 to-teal-500',
			bagrutAverage: techRes.bagrutAverage,
			generalSekem: techRes.generalSekem,
			engineeringSekem: techRes.engineeringSekem,
			directBagrutEligible: techRes.directBagrutEligible,
			droppedSubjects: techRes.droppedSubjects,
			optimalUnits: techRes.optimalUnits,
			notes: techRes.hasClusterBonus
				? `סכם טכניוני רשמי (0-100) עם בונוס מצרף מדעי/טכנולוגי מוגדל (+30)`
				: techRes.droppedSubjects.length > 0
					? `ממוצע מיטבי (הושמטו: ${techRes.droppedSubjects.join(', ')})`
					: 'סכם טכניוני רשמי (סולם 0-100, משקל מתמטיקה כפול)'
		},
		huji: {
			institutionId: 'huji',
			institutionName: 'האוניברסיטה העברית בירושלים',
			logoText: 'HUJI',
			badgeColor: 'from-amber-500 to-orange-600',
			bagrutAverage: hujiRes.bagrutAverage,
			generalSekem: hujiRes.generalSekem,
			engineeringSekem: hujiRes.engineeringSekem,
			directBagrutEligible: hujiRes.directBagrutEligible,
			droppedSubjects: hujiRes.droppedSubjects,
			optimalUnits: hujiRes.optimalUnits,
			notes:
				hujiRes.droppedSubjects.length > 0
					? `ממוצע אופטימלי (הושמטו: ${hujiRes.droppedSubjects.join(', ')}), ציון קבלה משוקלל`
					: 'ציון קבלה משוקלל רשמי של האוניברסיטה העברית'
		},
		ariel: {
			institutionId: 'ariel',
			institutionName: 'אוניברסיטת אריאל בשומרון',
			logoText: 'AU',
			badgeColor: 'from-emerald-500 to-green-600',
			bagrutAverage: arielRes.bagrutAverage,
			generalSekem: arielRes.generalSekem,
			engineeringSekem: arielRes.engineeringSekem,
			directBagrutEligible: arielRes.directBagrutEligible,
			droppedSubjects: arielRes.droppedSubjects,
			optimalUnits: arielRes.optimalUnits,
			notes:
				arielRes.droppedSubjects.length > 0
					? `ממוצע מיטבי (הושמטו: ${arielRes.droppedSubjects.join(', ')}), ציון קבלה משולב רשמי`
					: 'ציון קבלה משולב לפי נוסחת אריאל: ((בגרות * 6.666) + פסיכומטרי) / 2'
		},
		haifa: {
			institutionId: 'haifa',
			institutionName: 'אוניברסיטת חיפה',
			logoText: 'UOH',
			badgeColor: 'from-sky-500 to-indigo-500',
			bagrutAverage: haifaRes.bagrutAverage,
			generalSekem: haifaRes.generalSekem,
			engineeringSekem: haifaRes.engineeringSekem,
			directBagrutEligible: haifaRes.directBagrutEligible,
			droppedSubjects: haifaRes.droppedSubjects,
			optimalUnits: haifaRes.optimalUnits,
			notes:
				haifaRes.droppedSubjects.length > 0
					? `ממוצע אופטימלי (הושמטו: ${haifaRes.droppedSubjects.join(', ')}), סכם תקן רשמי`
					: 'סכם לפי נוסחת תקן רשמית של אוניברסיטת חיפה (BT = 10*בגרות - 330)'
		}
	};

	return selectedInstitutionIds.map((id) => allInstitutions[id]).filter(Boolean);
}
