import { AcademicDegree, AdmissionRoutes, ProgramRequirement } from '../../types/academic';
import { evaluateExcellentBagrut } from '../../modules/optimizer/excellentBagrut';
import { describeOfficialRoutes, OfficialRouteInfo } from '../../modules/optimizer/officialRoutes';
import {
	evaluateRequirements,
	describeRequirement,
	requirementSubjects,
	isBlocking,
	RequirementResult
} from '../../modules/optimizer/programRequirements';
import { isSameBagrutSubject } from '../../modules/optimizer/solver';
import { SubjectInput, selectProgramSekem } from '../../modules/calculators';
import { InstitutionSekemResult } from '../calculators/multiCalculator';

/**
 * accepted — admitted on some official route; missing_requirement — the sekem passes the threshold but an official
 * condition (minimum psychometric, subject requirement) is missing; not_accepted — below the threshold.
 */
export type AdmissionStatus = 'accepted' | 'missing_requirement' | 'not_accepted' | 'no_threshold';

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
	/** Can't be checked — a needed psychometric section score wasn't entered. Doesn't count as missing. */
	unknown?: boolean;
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
	/** True only when the threshold comes from a cited official source. */
	thresholdVerified?: boolean;
	/** Threshold on the institution's own scale (e.g. HUJI 23.75), when sourced. */
	officialThreshold?: number;
	thresholdSource?: string;
	relevantSekemType: 'general' | 'engineering' | 'management' | 'technion' | 'quantitative' | 'psychometric';
	relevantSekemLabel: string;
	/** Which official route the status rests on, when accepted. */
	admissionRoute?: 'sekem' | 'psychometric_only' | 'bagrut_only' | 'excellent_bagrut';
	/** One-line explanation when an official route or condition changed the status. */
	admissionNote?: string;
	/** Official admission routes of the program, when published. */
	admissionRoutes?: AdmissionRoutes;
	/** Official paths that don't decide the status (e.g. Technion "אפיק מקוצר", or a near-miss "בגרות מצוינת"). */
	alternativePaths?: { id: string; title: string; description: string }[];
	/** Every official route other than the sekem, described for this applicant (step-4 bypass tabs). */
	officialRoutes?: OfficialRouteInfo[];
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
	psychometricQuantEmphasis?: number; // Explicit official NITE score (200-800) from slip
	psychometricVerbalEmphasis?: number; // Explicit official NITE score (200-800) from slip
	mathGrade: number;
	mathUnits: number;
	physicsGrade?: number;
	physicsUnits?: number;
	bagrutAverage?: number;
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
function describeSekemType(calcId: string, type: string): string {
	if (type === 'psychometric') return 'ציון פסיכומטרי';
	if (calcId === 'huji') {
		if (type === 'engineering') return 'העברית: ציון משוקלל 50/50 בדגש כמותי';
		if (type === 'quantitative') return 'העברית: ציון משוקלל 30/70';
		if (type === 'management') return 'העברית: ציון משוקלל מיטבי, רב-תחומי/כמותי';
		return 'העברית: ציון משוקלל מיטבי';
	}
	if (type === 'technion' || calcId === 'technion') return 'סכם טכניוני';
	if (calcId === 'tau') {
		if (type === 'engineering') return 'ת"א: ציון התאמה מדויקים/הנדסה';
		if (type === 'management') return 'ת"א: ציון התאמה ניהול';
		return 'ת"א: ציון התאמה';
	}
	if (calcId === 'bgu') {
		if (type === 'engineering') return 'בן-גוריון: סכם הנדסה';
		if (type === 'quantitative') return 'בן-גוריון: סכם כמותי';
		return 'בן-גוריון: סכם';
	}
	if (calcId === 'reichman') return 'רייכמן: ציון מתואם';
	if (calcId === 'bar_ilan') {
		if (type === 'quantitative') return 'בר-אילן: שקלול מדעים (0–100)';
		if (type === 'engineering') return 'בר-אילן: שקלול הנדסה (0–100)';
		if (type === 'management') return 'בר-אילן: שקלול הנדסת תוכנה (0–100)';
		return 'בר-אילן: שקלול כללי (0–100)';
	}
	if (calcId === 'ariel') {
		return type === 'engineering' ? 'אריאל: ציון קבלה משולב (רב-תחומי/כמותי, הגבוה)' : 'אריאל: ציון קבלה משולב';
	}
	if (type === 'quantitative') return 'סכם כמותי';
	if (type === 'management') return 'סכם ניהול';
	return type === 'engineering' ? 'סכם כמותי / הנדסה' : 'סכם כללי';
}

export function resolveProgramSekemType(
	calcId: string,
	programTitle: string
): { type: 'general' | 'engineering' | 'management' | 'technion' | 'quantitative'; label: string } {
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
		title.includes('מערכות מידע') ||
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
			return { type: 'engineering', label: 'סכם הנדסה (ב"ג)' };
		}
		const isCSOrStem =
			title.includes('מדעי המחשב') ||
			title.includes('סייבר') ||
			title.includes('מתמטיקה') ||
			title.includes('פיזיקה') ||
			title.includes('כימיה') ||
			title.includes('מדעי החיים');
		if (isCSOrStem) {
			return { type: 'quantitative', label: 'סכם כמותי (ב"ג)' };
		}
		if (isEngineeringOrStem) {
			return { type: 'quantitative', label: 'סכם כמותי (ב"ג)' };
		}
		return { type: 'general', label: 'סכם כללי (ב"ג)' };
	}

	if (calcId === 'huji') {
		if (isEngineeringOrStem) {
			return { type: 'engineering', label: 'סכם בדגש כמותי (העברית)' };
		}
		return { type: 'general', label: 'סכם כללי (העברית)' };
	}

	if (isEngineeringOrStem) {
		return { type: 'engineering', label: 'סכם כמותי / הנדסה' };
	}

	return { type: 'general', label: 'סכם כללי' };
}

/** Official admission routes, whether they arrive top-level (JSON catalog) or inside prerequisites (DB-backed API). */
function officialRoutesOf(program?: AcademicDegree): AdmissionRoutes | undefined {
	if (!program) return undefined;
	return program.admissionRoutes ?? (program as any).prerequisites?.admissionRoutes ?? undefined;
}

/** Evaluates official program requirements against the applicant's bagrut and psychometric section scores. */
export function evaluateProgramRequirements(
	requirements: ProgramRequirement[] | undefined,
	profile: UserAcademicProfile
): RequirementResult[] {
	return evaluateRequirements(requirements, {
		subjects: requirementSubjects(
			profile.bagrutSubjects || [],
			{ units: profile.mathUnits, grade: profile.mathGrade },
			{ units: profile.physicsUnits, grade: profile.physicsGrade }
		),
		psychQuant: profile.psychometricQuant,
		psychVerbal: profile.psychometricVerbal,
		psychEnglish: profile.psychometricEnglish
	});
}

/** The applicant's current state for the subjects/sections a requirement mentions, e.g. "מתמטיקה 5 יח״ל בציון 75". */
function describeCurrentForRequirement(r: ProgramRequirement, profile: UserAcademicProfile): string {
	const subjects = requirementSubjects(
		profile.bagrutSubjects || [],
		{ units: profile.mathUnits, grade: profile.mathGrade },
		{ units: profile.physicsUnits, grade: profile.physicsGrade }
	);
	const names = [...new Set(r.anyOf.flatMap((o) => (o.bagrut ?? []).flatMap((c) => c.subjects)))];
	const parts: string[] = [];
	for (const name of names) {
		const s = subjects.find((x) => isSameBagrutSubject(x.name, name));
		if (s) parts.push(`${name} ${s.units} יח״ל בציון ${s.grade}`);
	}
	const sections = [...new Set(r.anyOf.flatMap((o) => (o.psych ?? []).map((p) => p.section)))];
	const scores = { quant: profile.psychometricQuant, verbal: profile.psychometricVerbal, english: profile.psychometricEnglish };
	const labels = { quant: 'חשיבה כמותית', verbal: 'חשיבה מילולית', english: 'אנגלית' };
	for (const sec of sections) if (scores[sec]) parts.push(`${labels[sec]} ${scores[sec]}`);
	return parts.length > 0 ? parts.join(', ') : names.length > 0 ? `אין בגרות ב${names.join(' / ')}` : 'טרם הוזן';
}

/** One prerequisite card per official requirement. */
export function officialRequirementChecks(results: RequirementResult[], profile: UserAcademicProfile): PrerequisiteCheck[] {
	const SECTION = { quant: 'חשיבה כמותית', verbal: 'חשיבה מילולית', english: 'אנגלית' } as const;
	return results.map(({ requirement: r, met, examOption, unknown, missingSections }) => ({
		id: `official-${r.id}`,
		name: `${r.title} (תנאי סף רשמי)`,
		required: describeRequirement(r),
		current: describeCurrentForRequirement(r, profile),
		isMet: met,
		unknown: unknown || undefined,
		notes: met
			? undefined
			: unknown
			? `לא הוזן ציון ${(missingSections ?? []).map((sec) => SECTION[sec]).join(' / ')} בפסיכומטרי — אי אפשר לבדוק את התנאי. הזן/י את ציון הפרק כדי לדעת אם את/ה עומד/ת בו.`
			: examOption
			? `אפשר לעמוד בתנאי עם ${examOption.exam}, או לשפר את הבגרות לאחת האפשרויות האחרות.`
			: 'לא מתקיים תנאי הסף הרשמי של התוכנית — בלעדיו אין קבלה גם אם הסכם עובר את הסף.'
	}));
}

/**
 * Checks academic prerequisites for STEM/Engineering/Management degrees
 */
export function checkProgramPrerequisites(
	programTitle: string,
	profile: UserAcademicProfile,
	targetProgram?: AcademicDegree
): PrerequisiteCheck[] {
	const checks: PrerequisiteCheck[] = [];
	const title = programTitle.toLowerCase();

	const isEngineering = title.includes('הנדס');
	const isCS = title.includes('מדעי המחשב') || title.includes('תוכנה') || title.includes('סייבר') || title.includes('בינה מלאכותית');
	const isMedicine = title.includes('רפואה') || title.includes('רפואת שיניים');
	const isExactScience = isEngineering || isCS || title.includes('פיזיקה') || title.includes('מתמטיקה') || title.includes('כימיה');

	// 0. Degree-specific psychometric floor — the official one ("ובנוסף") first, then the catalog's estimate
	const officialFloor = officialRoutesOf(targetProgram)?.minPsychometric;
	let psychFloor = officialFloor ?? targetProgram?.minPsychometricFloor;
	if (!psychFloor && targetProgram?.prerequisitesJson) {
		try {
			const parsed = JSON.parse(targetProgram.prerequisitesJson);
			psychFloor = parsed.minPsychometricFloor;
		} catch (e) {}
	}
	if (!psychFloor) {
		if (isMedicine) psychFloor = 700;
		else if (isCS) psychFloor = 600;
		else if (isEngineering) psychFloor = 560;
		else if (isExactScience) psychFloor = 550;
	}

	if (psychFloor && psychFloor > 0) {
		const currPsych = profile.psychometricGeneral || 0;
		const isMet = currPsych >= psychFloor;
		checks.push({
			id: 'psych_floor',
			name: officialFloor ? 'פסיכומטרי מינימלי (תנאי רשמי)' : 'רצפת פסיכומטרי מינימלית לתואר',
			required: `ציון ${psychFloor} ומעלה ברף המינימום המוסדי לתואר`,
			current: currPsych > 0 ? `ציון ${currPsych}` : 'טרם הוזן ציון פסיכומטרי',
			isMet,
			notes: isMet ? undefined : `החוג מחייב רף פסיכומטרי קשיח של ${psychFloor} לפחות כתנאי סף לקבלה.`
		});
	}

	// 1–2. Math / physics: the program's official requirements when published, otherwise a generic estimate
	const officialRequirements = officialRoutesOf(targetProgram)?.requirements;
	if (officialRequirements) {
		checks.push(...officialRequirementChecks(evaluateProgramRequirements(officialRequirements, profile), profile));
	}
	// The program page was checked: its official subject requirements replace the generic estimate (even if none)
	const subjectsOfficial = Boolean(officialRoutesOf(targetProgram)?.requirementsSource);

	// 1. Math prerequisite (estimate)
	if (!subjectsOfficial && isExactScience) {
		const mathUnits = profile.mathUnits || 0;
		const mathGrade = profile.mathGrade || 0;
		const isMet = (mathUnits === 5 && mathGrade >= 70) || (mathUnits === 4 && mathGrade >= 85);

		checks.push({
			id: 'math',
			name: 'בגרות במתמטיקה (הערכה — אין נתון רשמי)',
			required: '5 יח״ל בציון 70+ או 4 יח״ל בציון 85+',
			current: mathUnits > 0 ? `${mathUnits} יח״ל בציון ${mathGrade}` : 'לא הוזן ציון',
			isMet,
			notes: isMet ? undefined : 'החוג דורש רקע מתמטי חזק. במקרה של אי-עמידה בסף, נדרשת מכינה במתמטיקה או מבחן סיווג.'
		});
	}

	// 2. Physics prerequisite for engineering and physics-requiring degrees
	const requiresPhysics = isEngineering ||
		(targetProgram as any)?.requiresPhysics ||
		(targetProgram?.prerequisitesJson?.includes('"requiresPhysics":true'));

	if (!subjectsOfficial && requiresPhysics) {
		const physicsUnits = profile.physicsUnits || 0;
		const physicsGrade = profile.physicsGrade || 0;
		const isMet = physicsUnits === 5 && physicsGrade >= 65;

		checks.push({
			id: 'physics',
			name: 'בגרות בפיזיקה (הערכה — אין נתון רשמי)',
			required: '5 יח״ל בציון 65+ או מעבר מבחן סיווג בפיזיקה (70+)',
			current: physicsUnits > 0 ? `${physicsUnits} יח״ל בציון ${physicsGrade}` : 'ללא בגרות בפיזיקה',
			isMet,
			notes: isMet ? undefined : 'קבלה אפשרית, אך מחייבת מעבר מבחן סיווג מוסדי בפיזיקה (ציון 70+) או מכינה לפני פתיחת שנת הלימודים.'
		});
	}

	// 3. English — generic MAHAR rule only when the program has no official English requirement
	if (!officialRequirements?.some((r) => r.id.startsWith('english')) && profile.psychometricEnglish !== undefined && profile.psychometricEnglish > 0) {
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
	// Provenance may arrive top-level (JSON catalog) or inside prerequisites (DB-backed API)
	const prereq = (target.program as any).prerequisites as { officialThreshold?: number; thresholdSource?: string } | undefined;
	const thresholdSource: string | undefined = target.program.thresholdSource ?? prereq?.thresholdSource ?? undefined;
	const guessed = resolveProgramSekemType(target.calculatorId, target.program.fieldOfStudy);
	// A sourced program type (e.g. from an official threshold table) overrides the name-based guess
	const sekemType = target.program.relevantSekemType ?? guessed.type;
	const sekemLabel = target.program.relevantSekemType ? describeSekemType(target.calculatorId, sekemType) : guessed.label;

	const userSekem = selectProgramSekem(institutionRes, sekemType, target.calculatorId);

	const isTechnion = target.calculatorId === 'technion';

	let gap = 0;
	let status: AdmissionStatus = 'no_threshold';

	if (threshold !== null && threshold > 0) {
		gap = Math.round((userSekem - threshold) * 10) / 10;
		status = gap >= 0 ? 'accepted' : 'not_accepted';
	}

	const prerequisites = checkProgramPrerequisites(target.program.fieldOfStudy, profile, target.program);
	const missingPrerequisites = prerequisites.filter((p) => !p.isMet && !p.unknown);

	// Generate actionable improvement levers if there's a gap
	const improvementOptions: ImprovementOption[] = [];

	if (threshold !== null && gap < 0) {
		const missingPoints = Math.abs(gap);

		// 1. Psychometric improvement lever
		const currentPsych = profile.psychometricGeneral || 0;
		const bagrutAvg = institutionRes.bagrutAverage || 100;
		let targetPsych = 0;
		let psychNeeded = 0;

		if (currentPsych > 0) {
			let psychMultiplier = 2.0; // standard 50% weight (e.g. BGU, HUJI, Haifa, Ariel)
			if (sekemType === 'psychometric') {
				psychMultiplier = 1; // the threshold is the psychometric score itself
			} else if (target.calculatorId === 'tau') {
				psychMultiplier = sekemType === 'management' ? 1.43 : 1.92;
			} else if (isTechnion) {
				psychMultiplier = 13.33; // 0.075 coefficient on 0-100 scale
			}

			psychNeeded = Math.ceil(missingPoints * psychMultiplier);
			targetPsych = Math.min(800, currentPsych + psychNeeded);
		} else {
			// Candidate has NOT taken psychometric yet: calculate the exact score needed from scratch
			if (sekemType === 'psychometric') {
				targetPsych = threshold;
			} else if (target.calculatorId === 'technion') {
				const d = Math.min(125, bagrutAvg);
				targetPsych = Math.min(800, Math.max(200, Math.ceil((threshold + 19 - 0.5 * d) / 0.075)));
			} else if (target.calculatorId === 'tau') {
				const cappedBagrut = Math.min(117, bagrutAvg);
				const step2 = Math.round((cappedBagrut * 9.62 - 349.9) * 100) / 100;
				const neededFactor = sekemType === 'management' ? 0.7 : 0.52;
				const intercept = sekemType === 'management' ? (0.3 * step2 - 11.5) : (0.52 * step2 - 43.10);
				targetPsych = Math.min(800, Math.max(200, Math.ceil((threshold - intercept) / neededFactor)));
			} else if (target.calculatorId === 'ariel') {
				targetPsych = Math.min(800, Math.max(200, Math.ceil(2 * threshold - bagrutAvg * 6.666)));
			} else {
				// BGU, HUJI, Haifa standard
				const bt = bagrutAvg * 10 - 330;
				targetPsych = Math.min(800, Math.max(200, Math.ceil(2 * threshold - bt)));
			}
			psychNeeded = targetPsych;
		}

		if (targetPsych <= 800) {
			const isFirstTime = currentPsych === 0;
			improvementOptions.push({
				id: 'opt-psych',
				type: 'psychometric',
				title: isFirstTime ? 'השגת ציון פסיכומטרי ראשון' : 'שיפור ציון פסיכומטרי',
				description: isFirstTime
					? `השגת ציון פסיכומטרי של ${targetPsych} בבחינה הראשונה תסגור את פער הסכם ותביא לקבלה לתואר.`
					: `העלאת הפסיכומטרי ב-${psychNeeded} נקודות (מ-${currentPsych} ל-${targetPsych}) תסגור את פער הסכם באופן ישיר.`,
				currentValue: isFirstTime ? 'טרם נבחנת' : currentPsych,
				targetValue: targetPsych,
				gapAmount: isFirstTime ? targetPsych : psychNeeded,
				effortLevel: targetPsych <= 620 ? 'easy' : targetPsych <= 700 ? 'medium' : 'hard',
				estimatedWeeks: isFirstTime ? 12 : psychNeeded <= 30 ? 6 : psychNeeded <= 60 ? 10 : 14,
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

		// A psychometric-only threshold can't be closed through the bagrut average
		if (sekemType !== 'psychometric' && targetBagrut <= (isTechnion ? 119 : 125)) {
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

	// Official admission routes: an extra psychometric minimum can block the sekem route, and a bagrut-only or
	// psychometric-only route can admit on its own. Only official data (never catalog estimates) changes the status.
	const routes = officialRoutesOf(target.program);
	const notOffered = (target.program as any).notOffered ?? (target.program as any).prerequisites?.notOffered;
	const psych = profile.psychometricGeneral || 0;
	let admissionRoute: ProgramGapAnalysis['admissionRoute'];
	let admissionNote: string | undefined;
	const alternativePaths: NonNullable<ProgramGapAnalysis['alternativePaths']> = [];
	const officialRoutes = describeOfficialRoutes(routes, {
		subjects: profile.bagrutSubjects || [],
		bagrutAverage: institutionRes.bagrutAverage || 0,
		psychometric: psych,
		userSekem,
		threshold
	});

	// Official program requirements (math, physics, …) apply on every route; BGU's bagrut-only route has its own list
	const sekemPassed = status === 'accepted';
	const requirementResults = evaluateProgramRequirements(routes?.requirements, profile);
	const unmetRequirements = requirementResults.filter(isBlocking);
	const bagrutOnlyResults = routes?.bagrutOnlyRequirements
		? evaluateProgramRequirements(routes.bagrutOnlyRequirements, profile)
		: requirementResults;
	const bagrutOnlyRequirementsMet = !bagrutOnlyResults.some(isBlocking);
	const psychOnlyResults = routes?.psychometricOnlyRequirements
		? evaluateProgramRequirements(routes.psychometricOnlyRequirements, profile)
		: requirementResults;
	const psychOnlyRequirementsMet = !psychOnlyResults.some(isBlocking);

	if (routes?.minPsychometric && status === 'accepted' && psych < routes.minPsychometric) {
		status = 'missing_requirement';
		admissionNote = `הסכם עובר את הסף, אבל המוסד דורש גם פסיכומטרי ${routes.minPsychometric} לפחות${psych ? ` (יש לך ${psych})` : ''}.`;
		improvementOptions.unshift({
			id: 'opt-psych-floor',
			type: 'psychometric',
			title: `הגעה לפסיכומטרי ${routes.minPsychometric} (תנאי סף רשמי)`,
			description: `התואר דורש פסיכומטרי ${routes.minPsychometric} לפחות בנוסף לסכם. ${psych ? `חסרות ${routes.minPsychometric - psych} נקודות.` : 'יש לגשת לבחינה.'}`,
			currentValue: psych || 'טרם נבחנת',
			targetValue: routes.minPsychometric,
			gapAmount: psych ? routes.minPsychometric - psych : routes.minPsychometric,
			effortLevel: routes.minPsychometric - psych <= 30 ? 'easy' : routes.minPsychometric - psych <= 60 ? 'medium' : 'hard',
			estimatedWeeks: psych ? 8 : 12,
			potentialSekemGain: 0
		});
	} else if (status === 'accepted') {
		admissionRoute = 'sekem';
	}

	// An official minimum bagrut average on the sekem route, on top of the threshold (Bar-Ilan: "נדרשת עמידה בממוצע 90 בבגרות")
	const sekemRouteBagrutAvg = institutionRes.bagrutAverage || 0;
	if (routes?.minBagrutAverage && sekemPassed && sekemRouteBagrutAvg < routes.minBagrutAverage) {
		status = 'missing_requirement';
		admissionRoute = undefined;
		const avgNote = `הסכם עובר את הסף, אבל המוסד דורש גם ממוצע בגרות ${routes.minBagrutAverage} לפחות (יש לך ${sekemRouteBagrutAvg}).`;
		admissionNote = admissionNote ? `${admissionNote} ${avgNote.replace('הסכם עובר את הסף, אבל ', 'בנוסף, ')}` : avgNote;
		const need = Math.round((routes.minBagrutAverage - sekemRouteBagrutAvg) * 10) / 10;
		improvementOptions.unshift({
			id: 'opt-bagrut-floor',
			type: 'bagrut',
			title: `הגעה לממוצע בגרות ${routes.minBagrutAverage} (תנאי סף רשמי)`,
			description: `התואר דורש ממוצע בגרות ${routes.minBagrutAverage} לפחות בנוסף לסכם. חסרות ${need} נקודות ממוצע.`,
			currentValue: sekemRouteBagrutAvg,
			targetValue: routes.minBagrutAverage,
			gapAmount: need,
			effortLevel: need <= 2 ? 'easy' : need <= 5 ? 'medium' : 'hard',
			estimatedWeeks: 12,
			potentialSekemGain: 0
		});
	}

	if (unmetRequirements.length > 0) {
		if (sekemPassed) {
			status = 'missing_requirement';
			admissionRoute = undefined;
			const reqNote = `הסכם עובר את הסף, אבל לא מתקיים תנאי סף רשמי של התוכנית: ${unmetRequirements
				.map((r) => r.requirement.title)
				.join(', ')}.`;
			admissionNote = admissionNote ? `${admissionNote} ${reqNote.replace('הסכם עובר את הסף, אבל ', 'בנוסף, ')}` : reqNote;
		}
		for (const { requirement: r, examOption } of [...unmetRequirements].reverse()) {
			improvementOptions.unshift({
				id: `opt-req-${r.id}`,
				type: 'subject',
				title: `עמידה בתנאי הסף: ${r.title}`,
				description: examOption
					? `אפשר לעמוד בתנאי עם ${examOption.exam}. האפשרויות הרשמיות: ${describeRequirement(r)}.`
					: `התוכנית דורשת: ${describeRequirement(r)}.`,
				currentValue: describeCurrentForRequirement(r, profile),
				targetValue: describeRequirement(r),
				gapAmount: 1,
				effortLevel: examOption ? 'easy' : 'medium',
				estimatedWeeks: examOption ? 6 : 12,
				potentialSekemGain: 0
			});
		}
	}

	if (status !== 'accepted') {
		const bagrutAvg = institutionRes.bagrutAverage || 0;
		if (routes?.bagrutOnlyMin && bagrutAvg >= routes.bagrutOnlyMin && bagrutOnlyRequirementsMet) {
			status = 'accepted';
			admissionRoute = 'bagrut_only';
			admissionNote = `מתקבל/ת באפיק "בגרות בלבד": ממוצע ${bagrutAvg} (נדרש ${routes.bagrutOnlyMin}), בכפוף לתנאים הנוספים של המוסד.`;
		} else if (routes?.psychometricOnlyMin && psych >= routes.psychometricOnlyMin && psychOnlyRequirementsMet) {
			status = 'accepted';
			admissionRoute = 'psychometric_only';
			admissionNote = `מתקבל/ת באפיק "פסיכומטרי בלבד": ${psych} (נדרש ${routes.psychometricOnlyMin}), בכפוף לתנאים הנוספים של המוסד.`;
		} else if (unmetRequirements.length === 0 && routes?.excellentBagrut && evaluateExcellentBagrut(routes.excellentBagrut, profile.bagrutSubjects || []).met) {
			status = 'accepted';
			admissionRoute = 'excellent_bagrut';
			admissionNote = `מתקבל/ת באפיק "בגרות מצוינת" בלי פסיכומטרי (${routes.excellentBagrut.summary})${
				routes.excellentBagrut.interview ? '. בכפוף לריאיון קבלה' : ''
			}, ובכפוף לידע באנגלית ובעברית.`;
		}
		if (status === 'accepted') {
			improvementOptions.length = 0;
			const routeResults =
				admissionRoute === 'bagrut_only' && routes?.bagrutOnlyRequirements
					? bagrutOnlyResults
					: admissionRoute === 'psychometric_only' && routes?.psychometricOnlyRequirements
					? psychOnlyResults
					: undefined;
			if (routeResults) {
				const official = officialRequirementChecks(routeResults, profile);
				prerequisites.splice(0, prerequisites.length, ...prerequisites.filter((c) => !c.id.startsWith('official-')), ...official);
				missingPrerequisites.splice(0, missingPrerequisites.length, ...prerequisites.filter((c) => !c.isMet && !c.unknown));
			}
		} else {
			// Official routes other than the sekem, as alternative paths in the report (where relevant to this applicant)
			for (const r of officialRoutes) {
				if (r.reportLine) alternativePaths.push({ id: `alt-${r.id}`, title: r.title, description: r.reportLine });
			}
			if (routes?.bagrutOnlyMin && bagrutAvg > 0 && routes.bagrutOnlyMin - bagrutAvg <= 5) {
				const need = Math.round((routes.bagrutOnlyMin - bagrutAvg) * 10) / 10;
				improvementOptions.push({
					id: 'opt-bagrut-only',
					type: 'bagrut',
					title: 'קבלה לפי בגרות בלבד (אפיק רשמי)',
					description: `המוסד מקבל לתואר הזה גם לפי ממוצע בגרות ${routes.bagrutOnlyMin} בלי פסיכומטרי. חסרות ${need} נקודות ממוצע.`,
					currentValue: bagrutAvg,
					targetValue: routes.bagrutOnlyMin,
					gapAmount: need,
					effortLevel: need <= 2 ? 'easy' : 'medium',
					estimatedWeeks: need <= 2 ? 8 : 12,
					potentialSekemGain: 0
				});
			}
			if (routes?.psychometricOnlyMin) {
				improvementOptions.push({
					id: 'opt-psych-only',
					type: 'psychometric',
					title: `קבלה לפי פסיכומטרי בלבד: ${routes.psychometricOnlyMin} (אפיק רשמי)`,
					description: `המוסד מקבל לתואר הזה גם לפי ציון פסיכומטרי ${routes.psychometricOnlyMin} לבד.${psych ? ` חסרות ${routes.psychometricOnlyMin - psych} נקודות.` : ''}`,
					currentValue: psych || 'טרם נבחנת',
					targetValue: routes.psychometricOnlyMin,
					gapAmount: psych ? routes.psychometricOnlyMin - psych : routes.psychometricOnlyMin,
					effortLevel: routes.psychometricOnlyMin - psych <= 30 ? 'easy' : routes.psychometricOnlyMin - psych <= 60 ? 'medium' : 'hard',
					estimatedWeeks: psych ? 8 : 12,
					potentialSekemGain: 0
				});
			}
		}
	}

	if (notOffered) {
		admissionNote = `${notOffered.note}${admissionNote ? ` ${admissionNote}` : ''}`;
	}

	return {
		target,
		threshold,
		admissionRoute,
		admissionNote,
		admissionRoutes: routes,
		alternativePaths: alternativePaths.length > 0 ? alternativePaths : undefined,
		officialRoutes: officialRoutes.length > 0 ? officialRoutes : undefined,
		thresholdVerified: Boolean(thresholdSource),
		officialThreshold: target.program.officialThreshold ?? prereq?.officialThreshold ?? undefined,
		thresholdSource,
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
