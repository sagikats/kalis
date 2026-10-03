import { AcademicDegree, AdmissionRoutes } from '../../types/academic';
import { evaluateExcellentBagrut, requiredGesherScore, requiredMathExamScore } from '../../modules/optimizer/excellentBagrut';
import { SubjectInput, selectProgramSekem } from '../../modules/calculators';
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

	// 2. Physics prerequisite for engineering and physics-requiring degrees
	const requiresPhysics = isEngineering ||
		(targetProgram as any)?.requiresPhysics ||
		(targetProgram?.prerequisitesJson?.includes('"requiresPhysics":true'));

	if (requiresPhysics) {
		const physicsUnits = profile.physicsUnits || 0;
		const physicsGrade = profile.physicsGrade || 0;
		const isMet = physicsUnits === 5 && physicsGrade >= 65;

		checks.push({
			id: 'physics',
			name: 'בגרות בפיזיקה (פטור ממכינה / מבחן סיווג)',
			required: '5 יח״ל בציון 65+ או מעבר מבחן סיווג בפיזיקה (70+)',
			current: physicsUnits > 0 ? `${physicsUnits} יח״ל בציון ${physicsGrade}` : 'ללא בגרות בפיזיקה',
			isMet,
			notes: isMet ? undefined : 'קבלה אפשרית, אך מחייבת מעבר מבחן סיווג מוסדי בפיזיקה (ציון 70+) או מכינה לפני פתיחת שנת הלימודים.'
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
	// Provenance may arrive top-level (JSON catalog) or inside prerequisites (DB-backed API)
	const prereq = (target.program as any).prerequisites as { officialThreshold?: number; thresholdSource?: string } | undefined;
	const thresholdSource: string | undefined = target.program.thresholdSource ?? prereq?.thresholdSource ?? undefined;
	const guessed = resolveProgramSekemType(target.calculatorId, target.program.fieldOfStudy);
	// A sourced program type (e.g. from an official threshold table) overrides the name-based guess
	const sekemType = target.program.relevantSekemType ?? guessed.type;
	const sekemLabel = target.program.relevantSekemType ? describeSekemType(target.calculatorId, sekemType) : guessed.label;

	const userSekem = selectProgramSekem(institutionRes, sekemType, target.calculatorId);

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

	const prerequisites = checkProgramPrerequisites(target.program.fieldOfStudy, profile, target.program);
	const missingPrerequisites = prerequisites.filter((p) => !p.isMet);

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

	if (routes?.minPsychometric && (status === 'accepted' || status === 'borderline') && psych < routes.minPsychometric) {
		status = 'not_accepted';
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

	if (status !== 'accepted') {
		const bagrutAvg = institutionRes.bagrutAverage || 0;
		if (routes?.bagrutOnlyMin && bagrutAvg >= routes.bagrutOnlyMin) {
			status = 'accepted';
			admissionRoute = 'bagrut_only';
			admissionNote = `מתקבל/ת באפיק "בגרות בלבד": ממוצע ${bagrutAvg} (נדרש ${routes.bagrutOnlyMin}), בכפוף לתנאים הנוספים של המוסד.`;
		} else if (routes?.psychometricOnlyMin && psych >= routes.psychometricOnlyMin) {
			status = 'accepted';
			admissionRoute = 'psychometric_only';
			admissionNote = `מתקבל/ת באפיק "פסיכומטרי בלבד": ${psych} (נדרש ${routes.psychometricOnlyMin}), בכפוף לתנאים הנוספים של המוסד.`;
		} else if (routes?.excellentBagrut && evaluateExcellentBagrut(routes.excellentBagrut, profile.bagrutSubjects || []).met) {
			status = 'accepted';
			admissionRoute = 'excellent_bagrut';
			admissionNote = `מתקבל/ת באפיק "בגרות מצוינת" בלי פסיכומטרי (${routes.excellentBagrut.summary})${
				routes.excellentBagrut.interview ? '. בכפוף לריאיון קבלה' : ''
			}, ובכפוף לידע באנגלית ובעברית.`;
		}
		if (status === 'accepted') {
			improvementOptions.length = 0;
		} else {
			if (routes?.excellentBagrut) {
				const eb = evaluateExcellentBagrut(routes.excellentBagrut, profile.bagrutSubjects || []);
				if (eb.missing.length > 0 && eb.missing.length <= 2) {
					alternativePaths.push({
						id: 'alt-excellent-bagrut',
						title: 'בגרות מצוינת (קבלה בלי פסיכומטרי)',
						description: `התנאים: ${routes.excellentBagrut.summary}. חסר לך: ${eb.missing.join('; ')}.`
					});
				}
			}
			if (routes?.mathExam && threshold) {
				const me = routes.mathExam;
				const elig = evaluateExcellentBagrut(me.eligibility, profile.bagrutSubjects || []);
				const avg = institutionRes.bagrutAverage || 0;
				if (elig.met && avg > 0) {
					const need = requiredMathExamScore(me, avg, threshold);
					alternativePaths.push({
						id: 'alt-math-exam',
						title: 'בגרות + מבחן סיווג במתמטיקה (במקום פסיכומטרי)',
						description: need
							? `ציון המבחן מומר לסולם הפסיכומטרי ומחליף אותו בסכם. עם ממוצע הבגרות שלך (${avg}) מספיק ציון ${need.examScore} במבחן הסיווג במתמטיקה (שווה ערך לפסיכומטרי ${need.psychometricEquivalent}) כדי להגיע לסף ${threshold}.${me.note ? ` ${me.note}` : ''}`
							: `ציון המבחן מחליף את הפסיכומטרי בסכם, אבל עם ממוצע הבגרות הנוכחי (${avg}) גם 100 במבחן לא מגיע לסף ${threshold}.`
					});
				} else if (!elig.met && elig.missing.length <= 2) {
					alternativePaths.push({
						id: 'alt-math-exam',
						title: 'בגרות + מבחן סיווג במתמטיקה (במקום פסיכומטרי)',
						description: `תנאי ההשתתפות: ${me.eligibility.summary}. חסר לך: ${elig.missing.join('; ')}.`
					});
				}
			}
			if (routes?.promotionBonus && threshold) {
				const lowered = Math.round((threshold - routes.promotionBonus) * 100) / 100;
				const wouldPass = userSekem > 0 && userSekem >= lowered;
				alternativePaths.push({
					id: 'alt-promotion',
					title: 'ראויים לקידום (הנחה בסכם)',
					description: `מי שהוכר/ה ע"י האגודה לקידום החינוך כ"ראוי/ה לקידום" (30 נקודות ומעלה) מקבל/ת הנחה של ${routes.promotionBonus} ${routes.promotionBonus === 1 ? 'נקודה' : 'נקודות'} בסכם בתואר הזה, כלומר סף ${lowered}.${wouldPass ? ` עם ההכרה, הסכם שלך (${userSekem}) עומד בסף.` : ''} הבקשה מוגשת לאגודה (kidum-edu.org.il) לפני ההרשמה לטכניון.`
				});
			}
			if (routes?.gesher && threshold && userSekem > 0) {
				const gap = Math.round((threshold - userSekem) * 10) / 10;
				const need = requiredGesherScore(gap, routes.gesher.maxBonus);
				const elig = evaluateExcellentBagrut(routes.gesher.eligibility, profile.bagrutSubjects || []);
				if (need !== null && need > 0 && elig.met) {
					alternativePaths.push({
						id: 'alt-gesher',
						title: 'גשר קבלה לטכניון',
						description: `הסכם שלך חסר ${gap} נק׳ (עד ${routes.gesher.maxBonus} מותר). לומדים סמסטר מתמטיקה ופיזיקה בטכניון (מספטמבר), ולפי הציונים מקבלים עד ${routes.gesher.maxBonus} נקודות לסכם: ציון משוקלל (0.6×מתמטיקה + 0.4×פיזיקה) של ${need} סוגר לך את הפער. נדרשים גם אנגלית 104+ בפסיכומטרי או באמי"ר וידע בעברית.`
					});
				}
			}
			if (routes?.fromHighSchool) {
				alternativePaths.push({
					id: 'alt-from-high-school',
					title: 'מתיכון לטכניון (לתלמידי תיכון)',
					description: `תלמידי תיכון עם רקע חזק במתמטיקה לומדים קורסי מתמטיקה בטכניון במקביל לתיכון, ומתקבלים לפי הציונים בקורסים — בלי ציון בגרות או פסיכומטרי (נדרשת זכאות לבגרות מלאה).${routes.fromHighSchool.note ? ` ${routes.fromHighSchool.note}` : ''}`
				});
			}
			if (routes?.shortTrack) {
				const st = routes.shortTrack;
				alternativePaths.push({
					id: 'alt-short-track',
					title: 'אפיק מקוצר דרך לימודי חוץ בטכניון',
					description: `לומדים סמסטר א' בבית הספר ללימודי המשך (לפחות 17 נ״ז, בלי פסיכומטרי) ועוברים לסמסטר ב' בממוצע ${st.firstSemesterAverageMin}+ וציון ${st.minCourseGrade}+ בכל קורס. נדרשת זכאות לבגרות מלאה.${st.note ? ` ${st.note}` : ''}`
				});
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
