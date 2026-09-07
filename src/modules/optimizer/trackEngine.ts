/**
 * Action Track Generator Engine
 * Closed-Loop Generation of Mathematically Guaranteed Admission Tracks
 * Subagent 2: Recommendation & Optimization Algorithms
 *
 * Core Paradigm:
 * - Track A (`track-maximize-exam`): "מסלול מצוינות / מינימום בחינות" (ציוני יעד 90–95+, מינימום מבחנים לסגירת הסף)
 * - Track B (`track-risk-spread`): "מסלול סולידי / ביטחון גבוה" (ציוני יעד 82–90 מתונים, סיכון נמוך, פריסה רב-עונתית)
 * - Mechina (`track-anchor`): Opt-In בלבד דרך generateMechinaTrack()
 */

import { ActionTrackRecord, AcademicProgramRecord, UserAcademicProfileRecord, UserPreferencesRecord, FeasibilityLevel } from '../db/schema';
import { isProgramEligibleForDirectBagrut } from '../calculators/index';
import { extractRankedSubjectLevers } from './utilityScorer';
import {
	toCalculatorSubjects,
	applyLeversToCandidateState,
	evaluateSimulatedSekem,
	solveMinimumPsychometricTarget
} from './solver';
import { SubjectLeverCandidate, OptimizationSolution } from './types';
import { computePsychReachability, PsychReachability } from './reachabilityModel';
import { assignSessionToCandidate, generatePhasedMilestones } from './calendarScheduler';

// ---------------------------------------------------------------------------
// Helper: institution-specific Mechina / preparatory-program description
// ---------------------------------------------------------------------------
export function getMechinaDescription(institutionId: string, institutionName: string): {
	name: string;
	detail: string;
	durationWeeks: number;
} {
	switch (institutionId) {
		case 'technion':
			return {
				name: 'מכינת הטכניון (MAOF)',
				detail: 'תוכנית הכנה שנתית המיועדת לחיזוק מתמטיקה, פיזיקה ואנגלית. בוגרי המכינה המוצלחים זכאים לקבלה ישירה ללא פסיכומטרי.',
				durationWeeks: 40
			};
		case 'huji':
			return {
				name: 'מכינה קדם-אקדמית של האוניברסיטה העברית',
				detail: 'תוכנית של האוניברסיטה העברית המאפשרת כניסה הדרגתית לרוב החוגים ומשלבת לימודים אקדמיים ובחינות השלמה.',
				durationWeeks: 36
			};
		case 'tau':
			return {
				name: 'מכינת תל-אביב הקדם-אקדמית',
				detail: 'מכינה שנתית של אוניברסיטת תל-אביב לשיפור הזכאות. בוגרים עם ממוצע גבוה מקבלים פטורים ממסלולי הכנה.',
				durationWeeks: 36
			};
		case 'bgu':
			return {
				name: 'מכינת בן-גוריון (ATUDA)',
				detail: 'מכינה קדם-אקדמית המיועדת לחיזוק ממוצע הבגרות ועיבוי ידע מדעי לקראת לימודי מדעים, מדעי החברה וניהול.',
				durationWeeks: 36
			};
		case 'haifa':
			return {
				name: 'מכינת אוניברסיטת חיפה',
				detail: 'מסלול הכנה ייחודי לחיפה, כולל חיזוק אנגלית, כתיבה אקדמית ומדעי החברה. בוגרים רשאים להגיש מועמדות לכל החוגים.',
				durationWeeks: 36
			};
		case 'bar_ilan':
			return {
				name: 'מכינת בר-אילן (מנדל)',
				detail: 'תוכנית מכינה שנתית של אוניברסיטת בר-אילן. כוללת לימודים בסיסיים בחשבון, מדעים, אנגלית ויהדות. בוגרים מוצלחים מתקבלים ישירות.',
				durationWeeks: 36
			};
		case 'ariel':
			return {
				name: 'מכינת אריאל',
				detail: 'מסלול גמיש עם דגש על מועמדים ממגוון רקעים. מאפשר כניסה ישירה לחוגים רבים לאחר השלמת שנת הכנה.',
				durationWeeks: 32
			};
		case 'reichman':
			return {
				name: 'מסלול "הכנה לאקדמיה" של אוניברסיטת רייכמן',
				detail: 'רייכמן מציעה מסלול קבלה מתגמש הכולל ראיון אישי, מבחן כניסה פנימי ועבודת הכנה. מאפשר מועמדות גם ללא פסיכומטרי מלא.',
				durationWeeks: 24
			};
		default:
			return {
				name: `מכינה קדם-אקדמית (${institutionName})`,
				detail: 'תוכנית הכנה שנתית המסייעת לשיפור ציוני הבגרות ותוצאות הפסיכומטרי לקראת הגשת מועמדות.',
				durationWeeks: 36
			};
	}
}

/**
 * Generates on-demand Mechina track when requested by candidate (Opt-In).
 */
export function generateMechinaTrack(
	targetProgram: AcademicProgramRecord,
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): ActionTrackRecord {
	const institutionId = targetProgram.institutionId;
	const threshold = targetProgram.minSekemThreshold;
	const hasTakenPsych = profile.hasTakenPsychometric && profile.psychometricGeneral > 0;
	const currentPsych = hasTakenPsych ? profile.psychometricGeneral : 0;
	const isStemDegree =
		targetProgram.relevantSekemType === 'engineering' ||
		targetProgram.relevantSekemType === 'technion' ||
		targetProgram.fieldOfStudy.includes('מחשב') ||
		targetProgram.fieldOfStudy.includes('הנדס');

	const baseSubjects = toCalculatorSubjects(profile);
	const initialRes = evaluateSimulatedSekem(
		institutionId,
		targetProgram.relevantSekemType,
		profile,
		baseSubjects,
		hasTakenPsych ? currentPsych : 600
	);

	const currentSekem = initialRes.sekem;
	const currentBagrut = initialRes.bagrutAverage;
	const sekemGap = Math.max(0, threshold - currentSekem);
	const mechina = getMechinaDescription(institutionId, targetProgram.institutionName);
	const availableLevers = extractRankedSubjectLevers(profile, isStemDegree, preferences).map(assignSessionToCandidate);
	const anchorTopLever = availableLevers.find((l) => l.isMath || l.isPhysics) ?? availableLevers[0];

	const availableWeeklyHours =
		preferences.weeklyAvailabilityHours === 'limited_under_15'
			? 12
			: preferences.weeklyAvailabilityHours === 'full_30_plus'
			? 32
			: 20;

	return {
		id: 'track-anchor',
		userId: profile.userId,
		programId: targetProgram.id,
		title: `מסלול מכינה אקדמית: ${mechina.name}`,
		badge: 'מסלול מובנה (Opt-In דרך מכינה)',
		badgeColor: 'from-violet-500 to-purple-700',
		strategyDescription:
			`${mechina.detail} ` +
			`הפער הנוכחי לסף הקבלה עומד על ${sekemGap.toFixed(1)} נקודות סכם (סכם נוכחי: ${currentSekem.toFixed(1)}, סף: ${threshold}). ` +
			`מסלול המכינה מעניק מסגרת לימודית רשמית וסגירת פערים יסודית ללא לחץ של מועדי בחינות בודדים.`,
		targetSekem: threshold,
		targetPsychometric: undefined,
		currentPsychometric: hasTakenPsych ? currentPsych : undefined,
		targetBagrutAverage: currentBagrut,
		currentBagrutAverage: currentBagrut,
		recommendedLevers: anchorTopLever
			? [
					{
						id: anchorTopLever.id,
						trackId: 'track-anchor',
						subjectName: anchorTopLever.subjectName,
						currentGrade: anchorTopLever.currentGrade,
						currentUnits: anchorTopLever.currentUnits,
						targetGrade: anchorTopLever.targetGrade,
						targetUnits: anchorTopLever.targetUnits,
						priority: anchorTopLever.priority,
						reason: anchorTopLever.reason,
						leverType: anchorTopLever.leverType,
						session: anchorTopLever.session
					}
			  ]
			: [],
		milestones: [
			{
				id: 'ma1',
				trackId: 'track-anchor',
				orderIndex: 1,
				title: `רישום ל${mechina.name}`,
				detail: 'בדיקת מועדי הרישום ותנאי הקבלה למכינה.',
				timing: 'שבוע 1–2',
				type: 'psychometric'
			},
			{
				id: 'ma2',
				trackId: 'track-anchor',
				orderIndex: 2,
				title: anchorTopLever ? `חיזוק מקצוע מפתח — ${anchorTopLever.subjectName}` : 'חיזוק ציוני ליבה',
				detail: anchorTopLever
					? `מיקוד בשדרוג ${anchorTopLever.subjectName} לציון ${anchorTopLever.targetGrade} במסגרת המכינה.`
					: 'עבודה על שיפור ממוצע הבגרות תוך שנת המכינה.',
				timing: 'שבועות 4–24',
				type: anchorTopLever?.isMath ? 'bagrut_core' : 'bagrut_elective'
			},
			{
				id: 'ma3',
				trackId: 'track-anchor',
				orderIndex: 3,
				title: 'הגשת מועמדות לקבלה אקדמית',
				detail: `הגשת מועמדות ל${targetProgram.institutionName} על סמך תעודת גמר מכינה.`,
				timing: `שבועות ${mechina.durationWeeks - 4}–${mechina.durationWeeks}`,
				type: 'administrative'
			}
		],
		estimatedWeeks: mechina.durationWeeks,
		weeklyHours: availableWeeklyHours,
		feasibility: sekemGap <= 30 ? 'very_high' : 'high',
		feasibilityExplanation: `מסגרת מכינה שנתית מספקת ודאות גבוהה לסגירת פער של ${sekemGap.toFixed(1)} נקודות סכם.`,
		keyAdvantage: 'מסגרת לימודית מובנית ומעטפת אקדמית מלאה המאפשרת קבלה מובטחת.',
		createdAt: new Date()
	};
}

export function generateOptimizedActionTracks(
	targetProgram: AcademicProgramRecord,
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): OptimizationSolution {
	const hasTakenPsych = profile.hasTakenPsychometric && profile.psychometricGeneral > 0;
	const currentPsych = hasTakenPsych ? profile.psychometricGeneral : 0;
	const threshold = targetProgram.minSekemThreshold;
	const institutionId = targetProgram.institutionId;
	const relevantSekemType = targetProgram.relevantSekemType;
	const isTechnion = institutionId === 'technion';

	const isStemDegree =
		relevantSekemType === 'engineering' ||
		relevantSekemType === 'technion' ||
		targetProgram.fieldOfStudy.includes('מחשב') ||
		targetProgram.fieldOfStudy.includes('הנדס') ||
		targetProgram.fieldOfStudy.includes('פיזיקה') ||
		targetProgram.fieldOfStudy.includes('מדעים מדויקים');

	const baseSubjects = toCalculatorSubjects(profile);
	const initialRes = evaluateSimulatedSekem(
		institutionId,
		relevantSekemType,
		profile,
		baseSubjects,
		hasTakenPsych ? currentPsych : 600
	);

	const currentBagrut = initialRes.bagrutAverage;
	const currentSekem = initialRes.sekem;
	const availableWeeklyHours =
		preferences.weeklyAvailabilityHours === 'limited_under_15'
			? 12
			: preferences.weeklyAvailabilityHours === 'full_30_plus'
			? 32
			: 20;

	// Compute reachability ceiling & assign exam sessions
	const reachability: PsychReachability = computePsychReachability(profile, preferences);
	const availableLevers: SubjectLeverCandidate[] = extractRankedSubjectLevers(profile, isStemDegree, preferences).map(
		assignSessionToCandidate
	);

	const degreeAllowsDirectBagrut =
		targetProgram.directBagrutEligible ||
		(!['מדעי המחשב', 'הנדסת', 'רפואה', 'רפואת שיניים'].some((d) => (targetProgram.name || '').includes(d)) &&
			institutionId !== 'technion');

	// =========================================================================
	// TRACK A: מסלול מצוינות / מינימום בחינות (`track-maximize-exam` / `track-direct-bagrut`)
	// פילוסופיה: ציוני יעד גבוהים (90–95+ בבגרות, פסיכומטרי שאפתני עד התקרה).
	// המטרה: סגירת הסף בכמות מינימלית של בחינות (1 או 2 לכל היותר).
	// =========================================================================
	interface CandidateTrackOption {
		id?: string;
		levers: SubjectLeverCandidate[];
		targetPsych?: number;
		targetSekem: number;
		targetBagrutAverage: number;
		examCount: number;
		strategyDescription: string;
		badge: string;
		feasibility: FeasibilityLevel;
		feasibilityExplanation: string;
		keyAdvantage: string;
	}

	const trackAOptions: CandidateTrackOption[] = [];

	// Option A1: Psychometric Alone (1 Exam)
	const psychCeiling = reachability.personalCeiling;
	const singlePsychSol = solveMinimumPsychometricTarget(
		institutionId,
		relevantSekemType,
		threshold,
		profile,
		baseSubjects,
		hasTakenPsych ? currentPsych : 450,
		psychCeiling
	);

	if (singlePsychSol !== null && reachability.isRealistic(singlePsychSol)) {
		const resFast = evaluateSimulatedSekem(
			institutionId,
			relevantSekemType,
			profile,
			baseSubjects,
			singlePsychSol
		);

		const psychDelta = singlePsychSol - currentPsych;
		const feasibility = reachability.feasibilityForTarget(singlePsychSol);

		trackAOptions.push({
			id: 'track-maximize-exam',
			levers: [],
			targetPsych: singlePsychSol,
			targetSekem: resFast.sekem,
			targetBagrutAverage: currentBagrut,
			examCount: 1,
			badge: 'מצוינות: פסיכומטרי בלבד (מועד יחיד)',
			strategyDescription: hasTakenPsych
				? `מיקוד מלא בבחינה אחת בלבד: השגת ציון ${singlePsychSol} בפסיכומטרי (+${psychDelta} נקודות) סוגרת את מלוא הסף (סכם מובטח: ${resFast.sekem.toFixed(isTechnion ? 2 : 1)}) ללא צורך בפתיחת ספרי בגרות כלל.`
				: `ציון יעד פסיכומטרי ראשון: השגת ${singlePsychSol} בבחינה בודדת תבטיח קבלה ישירה על בסיס ממוצע הבגרות הנוכחי (${currentBagrut.toFixed(1)}).`,
			feasibility,
			feasibilityExplanation: `סגירת סף הקבלה בבחינה פסיכומטרית בודדת בציון ${singlePsychSol} (בתוך תקרת השיפור הריאלית שלך: ${psychCeiling}).`,
			keyAdvantage: 'בחינה אחת בלבד! אפס התעסקות עם מבחני בגרות.'
		});
	}

	// Option A2: Single High-ROI Bagrut Lever (1 Exam, 0 Psychometric Jump)
	// Test if an ambitious score (92-95) in a single bagrut lever reaches threshold
	for (const lever of availableLevers.slice(0, 3)) {
		const highTargetGrade = lever.isMath ? 92 : lever.targetUnits >= 5 ? 95 : 94;
		const highLever: SubjectLeverCandidate = { ...lever, targetGrade: highTargetGrade };
		const simState = applyLeversToCandidateState(profile, [highLever]);
		const resSingleBagrut = evaluateSimulatedSekem(
			institutionId,
			relevantSekemType,
			profile,
			simState.subjects,
			hasTakenPsych ? currentPsych : 600,
			simState.mathUnits,
			simState.mathGrade,
			simState.physicsUnits,
			simState.physicsGrade
		);

		if (resSingleBagrut.sekem >= threshold || (degreeAllowsDirectBagrut && resSingleBagrut.directBagrutEligible)) {
			trackAOptions.push({
				id: 'track-maximize-exam',
				levers: [highLever],
				targetPsych: hasTakenPsych ? currentPsych : undefined,
				targetSekem: resSingleBagrut.sekem,
				targetBagrutAverage: resSingleBagrut.bagrutAverage,
				examCount: 1,
				badge: `מצוינות: ${lever.subjectName} ${lever.targetUnits} יח״ל בלבד`,
				strategyDescription: `מהלך ממוקד של בחינה אחת: שדרוג ${lever.subjectName} (${lever.targetUnits} יח״ל) לציון מצוינות של ${highTargetGrade} מקפיץ את הממוצע ל-${resSingleBagrut.bagrutAverage.toFixed(1)} וסוגר את הסף ללא שינוי בפסיכומטרי!`,
				feasibility: 'high',
				feasibilityExplanation: `בחינת בגרות בודדת במקצוע בעל תועלת מקסימלית (${lever.subjectName}) סוגרת את כל הפער הנדרש.`,
				keyAdvantage: 'מבחן בגרות אחד בלבד ללא צורך בהיבחנות חוזרת בפסיכומטרי!'
			});
			break; // Found top single bagrut lever
		}
	}

	// Option A3: Direct Bagrut Admission (0 Psychometric, Minimal Levers)
	let directBagrutLevers: SubjectLeverCandidate[] | null = null;
	let directBagrutSekem = 0;
	let directBagrutAvg = 0;

	if (degreeAllowsDirectBagrut) {
		for (let k = 1; k <= Math.min(3, availableLevers.length); k++) {
			const candidateLevers = availableLevers.slice(0, k).map((l) => ({
				...l,
				targetGrade: l.isMath ? 92 : l.targetUnits >= 5 ? 95 : 94
			}));
			const simState = applyLeversToCandidateState(profile, candidateLevers);
			const evalZero = evaluateSimulatedSekem(
				institutionId,
				relevantSekemType,
				profile,
				simState.subjects,
				hasTakenPsych ? currentPsych : 0,
				simState.mathUnits,
				simState.mathGrade,
				simState.physicsUnits,
				simState.physicsGrade
			);

			const satisfiesDirectAverage =
				evalZero.directBagrutEligible ||
				isProgramEligibleForDirectBagrut(institutionId, targetProgram.name, evalZero.bagrutAverage) ||
				(targetProgram.directBagrutMinAverage !== null &&
					targetProgram.directBagrutMinAverage !== undefined &&
					evalZero.bagrutAverage >= targetProgram.directBagrutMinAverage);

			if (satisfiesDirectAverage) {
				directBagrutLevers = candidateLevers;
				directBagrutSekem = evalZero.sekem;
				directBagrutAvg = evalZero.bagrutAverage;
				break;
			}
		}
	}

	if (directBagrutLevers) {
		const leverNames = directBagrutLevers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל)`).join(' + ');
		trackAOptions.push({
			id: 'track-direct-bagrut',
			levers: directBagrutLevers,
			targetPsych: undefined,
			targetSekem: threshold,
			targetBagrutAverage: directBagrutAvg,
			examCount: directBagrutLevers.length,
			badge: 'מצוינות: קבלה ישירה (אפס פסיכומטרי)',
			strategyDescription: `מעקף פסיכומטרי מלא: שדרוג ${leverNames} לציון מצוינות מעלה את ממוצע הבגרות ל-${directBagrutAvg.toFixed(1)} ומקנה קבלה ישירה רשמית ב${targetProgram.institutionName} ללא תלות בפסיכומטרי כלל!`,
			feasibility: 'very_high',
			feasibilityExplanation: `עמידה מלאה ברף קבלה ישירה של המוסד ללא סיכון פסיכומטרי.`,
			keyAdvantage: 'אפס תלות בפסיכומטרי! קבלה ישירה על סמך בגרות בלבד.'
		});
	}

	// Option A4: Minimal 2-Exam Combo (1 Top Lever + Ambitious Psychometric)
	if (trackAOptions.length === 0 && availableLevers.length > 0) {
		const topLever = availableLevers[0];
		const highLever: SubjectLeverCandidate = { ...topLever, targetGrade: topLever.targetUnits >= 5 ? 94 : 94 };
		const simState = applyLeversToCandidateState(profile, [highLever]);
		const comboPsychSol = solveMinimumPsychometricTarget(
			institutionId,
			relevantSekemType,
			threshold,
			profile,
			simState.subjects,
			hasTakenPsych ? currentPsych : 450,
			psychCeiling,
			simState.mathUnits,
			simState.mathGrade,
			simState.physicsUnits,
			simState.physicsGrade
		);

		const evalPsych = comboPsychSol ?? psychCeiling;
		const evalRes = evaluateSimulatedSekem(
			institutionId,
			relevantSekemType,
			profile,
			simState.subjects,
			evalPsych,
			simState.mathUnits,
			simState.mathGrade,
			simState.physicsUnits,
			simState.physicsGrade
		);

		const feasibility = reachability.feasibilityForTarget(evalPsych);
		trackAOptions.push({
			levers: [highLever],
			targetPsych: evalPsych,
			targetSekem: evalRes.sekem,
			targetBagrutAverage: evalRes.bagrutAverage,
			examCount: 2,
			badge: 'מצוינות: 2 מבחנים בלבד (בגרות + פסיכומטרי)',
			strategyDescription: `שילוב מנצח של 2 בחינות בלבד: שדרוג ${topLever.subjectName} לציון ${highLever.targetGrade} ושיפור פסיכומטרי ל-${evalPsych} מביאים לסכם של ${evalRes.sekem.toFixed(isTechnion ? 2 : 1)}.`,
			feasibility,
			feasibilityExplanation: `סגירת סף הקבלה ב-2 בחינות בלבד תוך מיצוי פוטנציאל ההישג.`,
			keyAdvantage: 'מינימום בחינות (2 בלבד) עם השפעה מקסימלית על הסכם.'
		});
	}

	// Select best option for Track A: prefer examCount === 1, then higher utility / feasibility
	trackAOptions.sort((a, b) => {
		if (a.examCount !== b.examCount) return a.examCount - b.examCount;
		const feasOrder: Record<FeasibilityLevel, number> = { very_high: 4, high: 3, moderate: 2, challenging: 1 };
		return (feasOrder[b.feasibility] || 0) - (feasOrder[a.feasibility] || 0);
	});

	const chosenTrackA = trackAOptions[0];
	const trackAId = chosenTrackA.id ?? 'track-maximize-exam';
	const trackA_levers = chosenTrackA.levers.map((l) => ({
		id: l.id,
		trackId: trackAId,
		subjectName: l.subjectName,
		currentGrade: l.currentGrade,
		currentUnits: l.currentUnits,
		targetGrade: l.targetGrade,
		targetUnits: l.targetUnits,
		priority: l.priority,
		reason: l.reason,
		leverType: l.leverType,
		session: l.session
	}));

	const trackA: ActionTrackRecord = {
		id: trackAId,
		userId: profile.userId,
		programId: targetProgram.id,
		title: trackAId === 'track-direct-bagrut'
			? 'המסלול הבטוח: קבלה ישירה על סמך בגרות (אפס פסיכומטרי!)'
			: 'מסלול מצוינות: מינימום בחינות (יעד 90+)',
		badge: chosenTrackA.badge,
		badgeColor: trackAId === 'track-direct-bagrut' ? 'from-emerald-500 to-teal-600' : 'from-amber-500 to-orange-600',
		strategyDescription: chosenTrackA.strategyDescription,
		targetSekem: chosenTrackA.targetSekem,
		targetPsychometric: chosenTrackA.targetPsych,
		currentPsychometric: hasTakenPsych ? currentPsych : undefined,
		targetBagrutAverage: chosenTrackA.targetBagrutAverage,
		currentBagrutAverage: currentBagrut,
		recommendedLevers: trackA_levers,
		milestones: generatePhasedMilestones('track-maximize-exam', trackA_levers, chosenTrackA.targetPsych, currentPsych),
		estimatedWeeks: chosenTrackA.examCount * 6 + 4,
		weeklyHours: availableWeeklyHours,
		feasibility: chosenTrackA.feasibility,
		feasibilityExplanation: chosenTrackA.feasibilityExplanation,
		keyAdvantage: chosenTrackA.keyAdvantage,
		createdAt: new Date()
	};

	// =========================================================================
	// TRACK B: מסלול סולידי / ביטחון גבוה (`track-risk-spread`)
	// פילוסופיה: ציוני יעד מתונים ובטוחים באזור 82–90 (סיכון נמוך, קל להשגה).
	// המטרה: פיזור המאמץ על 2–3 וקטורים כך שאף כישלון בודד לא מכשיל את המועמדות.
	// שלביות: חורף (Quick-Win מקצוע חובה 2 יח״ל) -> אביב (פסיכומטרי) -> קיץ (הרחבה).
	// =========================================================================
	// Define moderate levers (grades 84-88 for 5u, 88-90 for 2u)
	const moderateLevers: SubjectLeverCandidate[] = availableLevers.slice(0, 3).map((l) => ({
		...l,
		targetGrade: l.isMath ? 86 : l.targetUnits >= 5 ? 86 : 90
	}));

	const simStateB = applyLeversToCandidateState(profile, moderateLevers);
	// Moderate psychometric ceiling for track B (avoid high-stress targets)
	const safePsychCeiling = Math.min(psychCeiling - 10, currentPsych + Math.round(reachability.maxImprovementPoints * 0.8));

	const safePsychSol = solveMinimumPsychometricTarget(
		institutionId,
		relevantSekemType,
		threshold,
		profile,
		simStateB.subjects,
		hasTakenPsych ? currentPsych : 450,
		safePsychCeiling,
		simStateB.mathUnits,
		simStateB.mathGrade,
		simStateB.physicsUnits,
		simStateB.physicsGrade
	);

	// If safe psych solution is null, try full psychCeiling to avoid leaving an avoidable gap
	const effectivePsychB = safePsychSol !== null
		? safePsychSol
		: solveMinimumPsychometricTarget(
				institutionId,
				relevantSekemType,
				threshold,
				profile,
				simStateB.subjects,
				hasTakenPsych ? currentPsych : 450,
				psychCeiling,
				simStateB.mathUnits,
				simStateB.mathGrade,
				simStateB.physicsUnits,
				simStateB.physicsGrade
		  ) ?? (hasTakenPsych ? currentPsych : 450);

	const resB = evaluateSimulatedSekem(
		institutionId,
		relevantSekemType,
		profile,
		simStateB.subjects,
		effectivePsychB,
		simStateB.mathUnits,
		simStateB.mathGrade,
		simStateB.physicsUnits,
		simStateB.physicsGrade
	);

	const trackB_levers = moderateLevers.map((l) => ({
		id: l.id,
		trackId: 'track-risk-spread',
		subjectName: l.subjectName,
		currentGrade: l.currentGrade,
		currentUnits: l.currentUnits,
		targetGrade: l.targetGrade,
		targetUnits: l.targetUnits,
		priority: l.priority,
		reason: l.reason,
		leverType: l.leverType,
		session: l.session
	}));

	const bagrutSummaryB = moderateLevers.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל, יעד ${l.targetGrade})`).join(' + ');
	const remainingGapB = Math.max(0, threshold - resB.sekem);
	const isClosedB = resB.sekem >= threshold;

	let strategyDescB: string;
	if (isClosedB) {
		strategyDescB = `מסלול בטוח וסולידי: שדרוג מתון של ${bagrutSummaryB} ללא לחץ של ציוני קצה. ` +
			(effectivePsychB > currentPsych
				? `בשילוב שיפור פסיכומטרי מתון ל-${effectivePsychB} (+${effectivePsychB - currentPsych} נקודות), הסף נסגר במלואו (סכם: ${resB.sekem.toFixed(isTechnion ? 2 : 1)}).`
				: `מאפשר סגירת הסף במלואו (סכם: ${resB.sekem.toFixed(isTechnion ? 2 : 1)}) ללא צורך בשיפור פסיכומטרי!`);
	} else {
		strategyDescB = `שדרוג סולידי של ${bagrutSummaryB} מביא לסכם של ${resB.sekem.toFixed(1)} (פער נותר: ${remainingGapB.toFixed(1)}). להשלמת הסגירה מומלץ לשקול את אפשרות המכינה.`;
	}

	const trackB_feasibility: FeasibilityLevel = isClosedB
		? reachability.feasibilityForTarget(effectivePsychB) === 'very_high' || reachability.feasibilityForTarget(effectivePsychB) === 'high'
			? 'very_high'
			: 'high'
		: 'moderate';

	const trackB: ActionTrackRecord = {
		id: 'track-risk-spread',
		userId: profile.userId,
		programId: targetProgram.id,
		title: 'מסלול סולידי: ביטחון גבוה ופיזור סיכונים (ציוני 82–90)',
		badge: 'מסלול סולידי (ציוני 82–90 בטוחים)',
		badgeColor: 'from-emerald-500 to-teal-600',
		strategyDescription: strategyDescB,
		targetSekem: resB.sekem,
		targetPsychometric: effectivePsychB > currentPsych ? effectivePsychB : undefined,
		currentPsychometric: hasTakenPsych ? currentPsych : undefined,
		targetBagrutAverage: resB.bagrutAverage,
		currentBagrutAverage: currentBagrut,
		recommendedLevers: trackB_levers,
		milestones: generatePhasedMilestones('track-risk-spread', trackB_levers, effectivePsychB, currentPsych),
		estimatedWeeks: 14,
		weeklyHours: availableWeeklyHours,
		feasibility: trackB_feasibility,
		feasibilityExplanation: isClosedB
			? 'ציוני יעד מתונים (82–90) שכל תלמיד יכול להשיג ללא תלות בהברקה של מועד בודד, עם סיכויי הצלחה סטטיסטיים מקסימליים.'
			: `סגירת פער משמעותית בסכם עד ${resB.sekem.toFixed(1)} מתוך ${threshold}.`,
		keyAdvantage: 'ציוני יעד מתונים ובטוחים (82–90) המונעים נפילה מאי-הגעה לציוני קצה.',
		createdAt: new Date()
	};

	// Determine if Mechina should be made available as Opt-In button
	const hasUnclosedGap = trackA.targetSekem! < threshold || trackB.targetSekem! < threshold;
	const isLargeInitialGap = threshold - currentSekem >= 25 && reachability.maxImprovementPoints <= 40;
	const mechinaAvailable = hasUnclosedGap || isLargeInitialGap || trackA.feasibility === 'challenging';

	const mechinaReason = mechinaAvailable
		? 'פער הסכם מציב אתגר במבחנים בודדים — מסלול מכינה קדם-אקדמית מאפשר קבלה מובטחת ללא תלות בציוני קצה.'
		: undefined;

	return {
		tracks: [trackA, trackB],
		availableLevers,
		hasDirectBagrutOption: directBagrutLevers !== null,
		mechinaAvailable,
		mechinaReason
	};
}
