import type { SubjectInput } from '../../modules/calculators';
import type { SubjectBreakdownItem } from '../../modules/calculators/types';
import { resolvePsychometricScores } from './psychometricHelper';
import {
	evaluateTechnion,
	evaluateTau,
	evaluateHuji,
	evaluateBgu,
	evaluateHaifa,
	evaluateAriel,
	evaluateBarIlan,
	evaluateReichman
} from '../../modules/calculators';

export interface UnifiedCalculationInput {
	bagrutSubjects: SubjectInput[];
	psychometricGeneral: number;
	psychometricQuant?: number;
	psychometricVerbal?: number;
	psychometricEnglish?: number;
	psychometricQuantEmphasis?: number;
	psychometricVerbalEmphasis?: number;
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
	quantitativeSekem?: number;
	directBagrutEligible: boolean;
	/** The applicant's effective general psychometric score (for psychometric-only programs). */
	psychometricGeneral?: number;
	/** Institution's own score on its native scale (HUJI weighted score ≈16–27). */
	officialScore?: number;
	notes?: string;
	droppedSubjects?: string[];
	optimalUnits?: number;
	/** Per-subject breakdown of the optimal bagrut average (bonus, effective score, counted or dropped). */
	subjectBreakdown?: SubjectBreakdownItem[];
	bagrutCap?: number;
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
	const quant = input.psychometricQuantEmphasis && input.psychometricQuantEmphasis > 0
		? input.psychometricQuantEmphasis
		: psychResolution.effectiveQuantEmphasis;
	const verbal = input.psychometricVerbalEmphasis && input.psychometricVerbalEmphasis > 0
		? input.psychometricVerbalEmphasis
		: psychResolution.effectiveVerbalEmphasis;

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

	const resolvedQuantSub = input.psychometricQuant && input.psychometricQuant <= 150
		? input.psychometricQuant
		: (psychResolution.rawSubscores?.quant || undefined);
	const resolvedVerbalSub = input.psychometricVerbal && input.psychometricVerbal <= 150
		? input.psychometricVerbal
		: (psychResolution.rawSubscores?.verbal || undefined);
	const resolvedEnglishSub = input.psychometricEnglish && input.psychometricEnglish <= 150
		? input.psychometricEnglish
		: (psychResolution.rawSubscores?.english || undefined);

	const commonCalcInput = {
		bagrutSubjects: input.bagrutSubjects,
		psychometricGeneral: psych,
		psychometricQuant: resolvedQuantSub,
		psychometricVerbal: resolvedVerbalSub,
		psychometricEnglish: resolvedEnglishSub,
		psychometricQuantEmphasis: quant,
		psychometricVerbalEmphasis: verbal,
		mathGrade: resolvedMathGrade,
		mathUnits: resolvedMathUnits,
		physicsGrade: resolvedPhysicsGrade,
		physicsUnits: resolvedPhysicsUnits
	};

	// 1. TAU
	const tauRes = evaluateTau(commonCalcInput);

	// 2. Technion
	const techRes = evaluateTechnion(commonCalcInput);

	// 3. BGU
	const bguRes = evaluateBgu(commonCalcInput);

	// 4. HUJI
	const hujiRes = evaluateHuji(commonCalcInput);

	// 5. Haifa
	const haifaRes = evaluateHaifa(commonCalcInput);

	// 6. Ariel
	const arielRes = evaluateAriel(commonCalcInput);

	// 7. Bar-Ilan
	const biuRes = evaluateBarIlan(commonCalcInput);

	// 8. Reichman
	const reichmanRes = evaluateReichman(commonCalcInput);

	const allInstitutions: Record<string, InstitutionSekemResult> = {
		bgu: {
			institutionId: 'bgu',
			institutionName: 'אוניברסיטת בן-גוריון בנגב',
			logoText: 'BGU',
			badgeColor: 'from-cyan-500 to-blue-600',
			bagrutAverage: bguRes.bagrutAverage,
			generalSekem: bguRes.generalSekem,
			engineeringSekem: bguRes.engineeringSekem,
			quantitativeSekem: bguRes.quantitativeSekem,
			directBagrutEligible: bguRes.directBagrutEligible,
			droppedSubjects: bguRes.droppedSubjects,
			subjectBreakdown: bguRes.subjectBreakdown,
			bagrutCap: bguRes.bagrutCap,
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
			engineeringSekem: tauRes.engineeringSekem,
			managementSekem: tauRes.managementSekem,
			directBagrutEligible: tauRes.directBagrutEligible,
			droppedSubjects: tauRes.droppedSubjects,
			subjectBreakdown: tauRes.subjectBreakdown,
			bagrutCap: tauRes.bagrutCap,
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
			subjectBreakdown: techRes.subjectBreakdown,
			bagrutCap: techRes.bagrutCap,
			optimalUnits: techRes.optimalUnits,
			notes:
				techRes.droppedSubjects && techRes.droppedSubjects.length > 0
					? `ממוצע מיטבי (הושמטו: ${techRes.droppedSubjects.join(', ')})`
					: techRes.notes && techRes.notes.length > 0
						? techRes.notes.join('. ')
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
			managementSekem: hujiRes.managementSekem,
			quantitativeSekem: hujiRes.quantitativeSekem,
			directBagrutEligible: hujiRes.directBagrutEligible,
			droppedSubjects: hujiRes.droppedSubjects,
			subjectBreakdown: hujiRes.subjectBreakdown,
			bagrutCap: hujiRes.bagrutCap,
			optimalUnits: hujiRes.optimalUnits,
			officialScore: hujiRes.officialScore,
			notes: [
				hujiRes.officialScore ? `ציון משוקלל רשמי: ${hujiRes.officialScore.toFixed(3)}` : '',
				hujiRes.droppedSubjects.length > 0 ? `ממוצע מיטבי (הושמטו: ${hujiRes.droppedSubjects.join(', ')})` : ''
			]
				.filter(Boolean)
				.join('. ') || 'ציון קבלה משוקלל לפי נוסחת האוניברסיטה העברית'
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
			subjectBreakdown: arielRes.subjectBreakdown,
			bagrutCap: arielRes.bagrutCap,
			optimalUnits: arielRes.optimalUnits,
			notes:
				arielRes.droppedSubjects.length > 0
					? `ממוצע מיטבי (הושמטו: ${arielRes.droppedSubjects.join(', ')}). נוסחת הציון המשולב אומתה; טבלת הבונוסים — הערכה`
					: 'נוסחת הציון המשולב אומתה; טבלת הבונוסים — הערכה'
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
			subjectBreakdown: haifaRes.subjectBreakdown,
			bagrutCap: haifaRes.bagrutCap,
			optimalUnits: haifaRes.optimalUnits,
			notes:
				haifaRes.droppedSubjects.length > 0
					? `ממוצע אופטימלי (הושמטו: ${haifaRes.droppedSubjects.join(', ')}), סכם תקן רשמי`
					: 'סכם לפי נוסחת תקן רשמית של אוניברסיטת חיפה (BT = 10*בגרות - 330)'
		},
		bar_ilan: {
			institutionId: 'bar_ilan',
			institutionName: 'אוניברסיטת בר-אילן',
			logoText: 'BIU',
			badgeColor: 'from-amber-600 to-yellow-500',
			bagrutAverage: biuRes.bagrutAverage,
			generalSekem: biuRes.generalSekem,
			engineeringSekem: biuRes.engineeringSekem,
			quantitativeSekem: biuRes.quantitativeSekem,
			managementSekem: biuRes.managementSekem,
			directBagrutEligible: biuRes.directBagrutEligible,
			droppedSubjects: biuRes.droppedSubjects,
			subjectBreakdown: biuRes.subjectBreakdown,
			bagrutCap: biuRes.bagrutCap,
			optimalUnits: biuRes.optimalUnits,
			notes:
				biuRes.droppedSubjects && biuRes.droppedSubjects.length > 0
					? `ממוצע מיטבי (הושמטו: ${biuRes.droppedSubjects.join(', ')}). שקלול 0–100 לפי המחשבון הרשמי של בר-אילן`
					: 'שקלול 0–100 לפי המחשבון הרשמי של בר-אילן'
		},
		reichman: {
			institutionId: 'reichman',
			institutionName: 'אוניברסיטת רייכמן (הבינתחומי)',
			logoText: 'RUNI',
			badgeColor: 'from-blue-700 to-indigo-800',
			bagrutAverage: reichmanRes.bagrutAverage,
			generalSekem: reichmanRes.generalSekem,
			engineeringSekem: reichmanRes.engineeringSekem,
			directBagrutEligible: reichmanRes.directBagrutEligible,
			droppedSubjects: reichmanRes.droppedSubjects,
			subjectBreakdown: reichmanRes.subjectBreakdown,
			bagrutCap: reichmanRes.bagrutCap,
			optimalUnits: reichmanRes.optimalUnits,
			officialScore: reichmanRes.officialScore,
			notes: [
				reichmanRes.officialScore ? `ציון מתואם: ${reichmanRes.officialScore.toFixed(2)}` : '',
				reichmanRes.droppedSubjects && reichmanRes.droppedSubjects.length > 0
					? `ממוצע מיטבי (הושמטו: ${reichmanRes.droppedSubjects.join(', ')})`
					: ''
			]
				.filter(Boolean)
				.join('. ') || 'ציון מתואם לפי נוסחת אוניברסיטת רייכמן'
		}
	};

	return selectedInstitutionIds
		.map((id) => allInstitutions[id])
		.filter(Boolean)
		.map((r) => ({ ...r, psychometricGeneral: psych || 0 }));
}
