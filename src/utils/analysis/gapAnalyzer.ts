import { AcademicDegree } from '../../types/academic';
import { SubjectInput } from '../calculators/bguCalculator';
import { InstitutionSekemResult } from '../calculators/multiCalculator';

export type AdmissionStatus = 'accepted' | 'borderline' | 'not_accepted' | 'no_threshold';

export interface TargetProgramSelection {
	institutionId: string; // e.g. 'inst-6'
	institutionName: string; // e.g. 'אוניברסיטת תל אביב'
	calculatorId: string; // 'tau', 'technion', 'bgu', 'huji', 'haifa', 'ariel'
	program: AcademicDegree;
}

export interface PrerequisiteCheck {
	id: string;
	name: string; // e.g. 'מתמטיקה ברמה אקדמית'
	required: string; // e.g. '5 יח״ל בציון 70+ או 4 יח״ל 85+'
	current: string; // e.g. '4 יח״ל בציון 80'
	isMet: boolean;
	notes?: string;
}

export interface ImprovementOption {
	id: string;
	type: 'psychometric' | 'bagrut' | 'subject' | 'hybrid';
	title: string;
	description: string;
	currentValue: number | string;
	targetValue: number | string;
	gapAmount: number;
	effortLevel: 'easy' | 'medium' | 'hard';
	estimatedWeeks: number;
	potentialSekemGain: number;
}

export interface ProgramGapAnalysis {
	target: TargetProgramSelection;
	threshold: number | null;
	relevantSekemType: 'general' | 'engineering' | 'management' | 'technion';
	relevantSekemLabel: string;
	userSekem: number;
	gap: number; // positive = surplus, negative = points needed
	status: AdmissionStatus;
	prerequisites: PrerequisiteCheck[];
	missingPrerequisites: PrerequisiteCheck[];
	improvementOptions: ImprovementOption[];
}

export interface UserAcademicProfile {
	bagrutSubjects: SubjectInput[];
	psychometricGeneral: number;
	psychometricQuant?: number;
	psychometricVerbal?: number;
	psychometricEnglish?: number;
	mathGrade: number;
	mathUnits: number;
	physicsGrade?: number;
	physicsUnits?: number;
}

export function parseAdmissionThreshold(raw: number | string | undefined | null): number | null {
	if (raw === undefined || raw === null) return null;
	if (typeof raw === 'number') return isNaN(raw) ? null : raw;
	const trimmed = String(raw).trim();
	if (trimmed.includes('ללא') || trimmed.includes('ראיון') || trimmed.includes('אודישן')) return null;
	const parsed = parseFloat(trimmed);
	return isNaN(parsed) ? null : parsed;
}

/**
 * Determines which Sekem type and label is applicable for a given program
 */
export function resolveProgramSekemType(
	calcId: string,
	programTitle: string
): { type: 'general' | 'engineering' | 'management' | 'technion'; label: string } {
	if (calcId === 'technion') {
		return { type: 'technion', label: 'סכם טכניוני' };
	}

	const title = programTitle.toLowerCase();
	const isEngineeringOrStem =
		title.includes('הנדס') ||
		title.includes('מדעי המחשב') ||
		title.includes('תוכנה') ||
		title.includes('מדעים מדויקים') ||
		title.includes('פיזיקה') ||
		title.includes('כימיה') ||
		title.includes('מתמטיקה') ||
		title.includes('נתונים') ||
		title.includes('סייבר') ||
		title.includes('ביוטכנולוגיה');

	if (calcId === 'tau') {
		const isManagement =
			(title.includes('ניהול') || title.includes('חשבונאות') || title.includes('מנהל עסקים')) &&
			!title.includes('הנדס');
		if (isManagement) {
			return { type: 'management', label: 'התאמה לניהול (את"א)' };
		}
		if (isEngineeringOrStem) {
			return { type: 'engineering', label: 'התאמה להנדסה ומדעים (את"א)' };
		}
		return { type: 'general', label: 'ציון התאמה כללי (את"א)' };
	}

	if (calcId === 'bgu') {
		if (title.includes('הנדס')) {
			return { type: 'engineering', label: 'סכם הנדסה רשמי (ב"ג)' };
		}
		return { type: 'general', label: 'סכם כללי (ב"ג)' };
	}

	if (isEngineeringOrStem) {
		return { type: 'engineering', label: 'סכם כמותי / הנדסה' };
	}

	return { type: 'general', label: 'סכם כללי' };
}

/**
 * Checks academic prerequisites for STEM/Engineering/Management degrees
 */
export function checkProgramPrerequisites(
	programTitle: string,
	profile: UserAcademicProfile
): PrerequisiteCheck[] {
	const checks: PrerequisiteCheck[] = [];
	const title = programTitle.toLowerCase();

	const isEngineering = title.includes('הנדס');
	const isCS = title.includes('מדעי המחשב') || title.includes('תוכנה') || title.includes('סייבר');
	const isExactScience = isEngineering || isCS || title.includes('פיזיקה') || title.includes('מתמטיקה');

	// 1. Math prerequisite
	if (isExactScience) {
		const mathUnits = profile.mathUnits || 0;
		const mathGrade = profile.mathGrade || 0;
		const isMet = (mathUnits === 5 && mathGrade >= 70) || (mathUnits === 4 && mathGrade >= 85);

		checks.push({
			id: 'math',
			name: 'בגרות במתמטיקה (סף ריאלי)',
			required: '5 יח״ל בציון 70+ או 4 יח״ל בציון 85+',
			current: mathUnits > 0 ? `${mathUnits} יח״ל בציון ${mathGrade}` : 'לא הוזן ציון',
			isMet,
			notes: isMet ? undefined : 'החוג דורש רקע מתמטי חזק. במקרה של אי-עמידה בסף, נדרשת מכינה במתמטיקה או מבחן סיווג.'
		});
	}

	// 2. Physics prerequisite for engineering
	if (isEngineering) {
		const physicsUnits = profile.physicsUnits || 0;
		const physicsGrade = profile.physicsGrade || 0;
		const isMet = physicsUnits === 5 && physicsGrade >= 65;

		checks.push({
			id: 'physics',
			name: 'בגרות בפיזיקה (פטור ממכינה)',
			required: '5 יח״ל בציון 65+ (מעניק פטור ממכינת קישור בפיזיקה)',
			current: physicsUnits > 0 ? `${physicsUnits} יח״ל בציון ${physicsGrade}` : 'ללא בגרות בפיזיקה',
			isMet,
			notes: isMet ? undefined : 'קבלה אפשרית, אך תחייב מעבר מכינת קישור / בחינת סיווג בפיזיקה לפני פתיחת שנת הלימודים.'
		});
	}

	// 3. English academic requirement
	if (profile.psychometricEnglish !== undefined && profile.psychometricEnglish > 0) {
		const engScore = profile.psychometricEnglish;
		const isExempt = engScore >= 134;
		checks.push({
			id: 'english',
			name: 'רמת אנגלית אקדמית',
			required: 'ציון 85 ומעלה לקבלה, 134+ לפטור אקדמי מלא',
			current: `ציון ${engScore} (${isExempt ? 'פטור מלא' : engScore >= 100 ? 'מתקדמים' : 'בסיסי'})`,
			isMet: engScore >= 85,
			notes: engScore < 85 ? 'ציון מתחת ל-85 אינו מאפשר קבלה לאקדמיה לפי הנחיות המל״ג.' : undefined
		});
	}

	return checks;
}

/**
 * Performs full Gap Analysis for a target program against the user's evaluated Sekem results
 */
export function analyzeProgramGap(
	target: TargetProgramSelection,
	profile: UserAcademicProfile,
	institutionRes: InstitutionSekemResult
): ProgramGapAnalysis {
	const threshold = parseAdmissionThreshold(target.program.admissionThreshold);
	const { type: sekemType, label: sekemLabel } = resolveProgramSekemType(
		target.calculatorId,
		target.program.fieldOfStudy
	);

	// Select relevant Sekem score
	let userSekem = institutionRes.generalSekem;
	if (sekemType === 'engineering' && institutionRes.engineeringSekem) {
		userSekem = institutionRes.engineeringSekem;
	} else if (sekemType === 'management' && institutionRes.managementSekem) {
		userSekem = institutionRes.managementSekem;
	} else if (sekemType === 'technion') {
		userSekem = institutionRes.engineeringSekem || institutionRes.generalSekem;
	}

	const isTechnion = target.calculatorId === 'technion';
	const borderlineMargin = isTechnion ? 1.5 : 20;

	let gap = 0;
	let status: AdmissionStatus = 'no_threshold';

	if (threshold !== null && threshold > 0) {
		gap = Math.round((userSekem - threshold) * 10) / 10;
		if (gap >= 0) status = 'accepted';
		else if (gap >= -borderlineMargin) status = 'borderline';
		else status = 'not_accepted';
	}

	const prerequisites = checkProgramPrerequisites(target.program.fieldOfStudy, profile);
	const missingPrerequisites = prerequisites.filter((p) => !p.isMet);

	// Generate actionable improvement levers if there's a gap
	const improvementOptions: ImprovementOption[] = [];

	if (threshold !== null && gap < 0) {
		const missingPoints = Math.abs(gap);

		// 1. Psychometric improvement lever
		let psychMultiplier = 2.0; // standard 50% weight (e.g. BGU, HUJI, Haifa, Ariel)
		if (target.calculatorId === 'tau') {
			psychMultiplier = sekemType === 'management' ? 1.43 : 1.92;
		} else if (isTechnion) {
			psychMultiplier = 13.33; // 0.075 coefficient on 0-100 scale
		}

		const psychNeeded = Math.ceil(missingPoints * psychMultiplier);
		const currentPsych = profile.psychometricGeneral;
		const targetPsych = Math.min(800, currentPsych + psychNeeded);

		if (targetPsych <= 800) {
			improvementOptions.push({
				id: 'opt-psych',
				type: 'psychometric',
				title: 'שיפור ציון פסיכומטרי',
				description: `העלאת הפסיכומטרי ב-${psychNeeded} נקודות (מ-${currentPsych} ל-${targetPsych}) תסגור את פער הסכם באופן ישיר.`,
				currentValue: currentPsych,
				targetValue: targetPsych,
				gapAmount: psychNeeded,
				effortLevel: psychNeeded <= 30 ? 'easy' : psychNeeded <= 60 ? 'medium' : 'hard',
				estimatedWeeks: psychNeeded <= 30 ? 6 : psychNeeded <= 60 ? 10 : 14,
				potentialSekemGain: missingPoints
			});
		}

		// 2. Bagrut Average improvement lever
		let bagrutMultiplier = 0.2; // standard 5 points of Sekem per Bagrut point (BGU, HUJI, Haifa, TAU general)
		if (target.calculatorId === 'tau' && sekemType === 'management') {
			bagrutMultiplier = 0.35;
		} else if (isTechnion) {
			bagrutMultiplier = 2.0; // 0.5 per bagrut point on 100-scale
		} else if (target.calculatorId === 'ariel') {
			bagrutMultiplier = 0.3;
		}

		const bagrutNeeded = Math.round(missingPoints * bagrutMultiplier * 10) / 10;
		const currentBagrut = institutionRes.bagrutAverage;
		const targetBagrut = Math.min(isTechnion ? 119 : 125, Math.round((currentBagrut + bagrutNeeded) * 10) / 10);

		if (targetBagrut <= (isTechnion ? 119 : 125)) {
			improvementOptions.push({
				id: 'opt-bagrut',
				type: 'bagrut',
				title: 'העלאת ממוצע בגרות מיטבי',
				description: `העלאת ממוצע הבגרות ב-${bagrutNeeded} נקודות (מ-${currentBagrut} ל-${targetBagrut}) ע״י שיפור 1-2 מקצועות חלשים או הוספת מוגבר.`,
				currentValue: currentBagrut,
				targetValue: targetBagrut,
				gapAmount: bagrutNeeded,
				effortLevel: bagrutNeeded <= 2.5 ? 'easy' : bagrutNeeded <= 5 ? 'medium' : 'hard',
				estimatedWeeks: bagrutNeeded <= 2.5 ? 8 : 12,
				potentialSekemGain: missingPoints
			});
		}

		// 3. Subject-specific upgrade (e.g. Math 4u -> 5u)
		if (profile.mathUnits === 4) {
			const estimatedGain = target.calculatorId === 'tau' && (profile.physicsUnits || 0) === 5 ? 15 : 8;
			improvementOptions.push({
				id: 'opt-math5',
				type: 'subject',
				title: 'שדרוג בגרות במתמטיקה מ-4 ל-5 יח״ל',
				description:
					'מעבר מ-4 ל-5 יח״ל מעלה את בונוס הבגרות מ-12.5/15 ל-30/35 נקודות, פותח בונוסים ריאליים וסוגר תנאי סף הנדסיים.',
				currentValue: `4 יח״ל (${profile.mathGrade})`,
				targetValue: '5 יח״ל (80+)',
				gapAmount: 1,
				effortLevel: 'medium',
				estimatedWeeks: 12,
				potentialSekemGain: estimatedGain
			});
		}
	}

	return {
		target,
		threshold,
		relevantSekemType: sekemType,
		relevantSekemLabel: sekemLabel,
		userSekem,
		gap,
		status,
		prerequisites,
		missingPrerequisites,
		improvementOptions
	};
}
