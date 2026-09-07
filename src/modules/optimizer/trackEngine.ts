/**
 * Action Track Generator Engine
 * Closed-Loop Generation of Mathematically Guaranteed Admission Tracks
 * Subagent 2: Recommendation & Optimization Algorithms
 */

import { ActionTrackRecord, AcademicProgramRecord, UserAcademicProfileRecord, UserPreferencesRecord } from '../db/schema';
import { isProgramEligibleForDirectBagrut } from '../calculators/index';
import { extractRankedSubjectLevers } from './utilityScorer';
import {
	toCalculatorSubjects,
	applyLeversToCandidateState,
	evaluateSimulatedSekem,
	solveMinimumPsychometricTarget
} from './solver';
import { SubjectLeverCandidate, OptimizationSolution } from './types';

// ---------------------------------------------------------------------------
// Helper: institution-specific Mechina / preparatory-program description
// ---------------------------------------------------------------------------
function getMechinaDescription(institutionId: string, institutionName: string): {
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

	const tracks: ActionTrackRecord[] = [];
	const availableLevers = extractRankedSubjectLevers(profile, isStemDegree, preferences);
	const psychCeiling = preferences.psychFeeling === 'low_confidence' ? 680 : 750;

	// =========================================================================
	// TRACK 1: המסלול המהיר (Fast Single-Focus Track)
	// =========================================================================
	const fastPsychSol = solveMinimumPsychometricTarget(
		institutionId,
		relevantSekemType,
		threshold,
		profile,
		baseSubjects,
		hasTakenPsych ? currentPsych : 450,
		psychCeiling
	);

	// track1Psych: used as upper-bound reference for track-2 "meaningful reduction" rule
	const track1Psych = fastPsychSol !== null ? fastPsychSol : 0;

	if (fastPsychSol !== null && (!hasTakenPsych || fastPsychSol <= currentPsych + 100)) {
		const resFast = evaluateSimulatedSekem(
			institutionId,
			relevantSekemType,
			profile,
			baseSubjects,
			fastPsychSol
		);

		const psychDelta = fastPsychSol - currentPsych;
		const feasibility = psychDelta <= 40 ? 'high' : psychDelta <= 70 ? 'moderate' : 'challenging';

		tracks.push({
			id: 'track-fast-psych',
			userId: profile.userId,
			programId: targetProgram.id,
			title: hasTakenPsych ? 'המסלול המהיר: זינוק פסיכומטרי ממוקד' : 'המסלול המהיר: ציון יעד פסיכומטרי ראשון',
			badge: hasTakenPsych ? 'הכי מהיר (מועד בודד)' : 'יעד פסיכומטרי ראשון',
			badgeColor: 'from-amber-500 to-orange-600',
			strategyDescription: hasTakenPsych
				? `מיקוד מלא בבחינה אחת: שיפור פסיכומטרי בלבד ל-${fastPsychSol} (+${psychDelta} נקודות) ללא צורך בפתיחת ספרי בגרות (סכם מובטח: ${resFast.sekem.toFixed(isTechnion ? 2 : 1)} מול סף ${threshold}).`
				: `ציון יעד ראשון: השגת ${fastPsychSol} בפסיכומטרי תבטיח קבלה ישירה לסף הנדרש (${threshold}) על בסיס ממוצע הבגרות הקיים שלך (${currentBagrut.toFixed(1)}).`,
			targetSekem: resFast.sekem,
			targetPsychometric: fastPsychSol,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			targetBagrutAverage: currentBagrut,
			currentBagrutAverage: currentBagrut,
			recommendedLevers: [],
			milestones: [
				{
					id: 'm1',
					trackId: 'track-fast-psych',
					orderIndex: 1,
					title: hasTakenPsych ? 'קורס הכנה אינטנסיבי לפסיכומטרי' : 'לימוד מקיף למבחן פסיכומטרי ראשון',
					detail: `הכנה ותרגול סימולציות להגעה לציון יעד ${fastPsychSol}`,
					timing: 'שבועות 1–10',
					type: 'psychometric'
				}
			],
			estimatedWeeks: 10,
			weeklyHours: availableWeeklyHours,
			feasibility,
			feasibilityExplanation: `סגירת פער של ${Math.abs(resFast.sekem - threshold).toFixed(1)} נקודות סכם במאמץ ממוקד אחד.`,
			keyAdvantage: 'סגירת הפער בבחינה אחת בלבד ללא צורך בפתיחת ספרי בגרות.',
			createdAt: new Date()
		});
	}

	// =========================================================================
	// TRACK 2: קבלה ישירה (Direct Bagrut Admission) או שילוב מאוזן מבוקר דלתא
	// =========================================================================
	let directBagrutSol: {
		levers: SubjectLeverCandidate[];
		res: { sekem: number; bagrutAverage: number; directBagrutEligible: boolean };
	} | null = null;

	const degreeAllowsDirectBagrut = isProgramEligibleForDirectBagrut(
		institutionId,
		targetProgram.name,
		currentBagrut + 5
	);

	// Check if Direct Bagrut Admission can be achieved with 1 to 3 levers
	if (degreeAllowsDirectBagrut) {
		for (let k = 1; k <= Math.min(3, availableLevers.length); k++) {
			const testLevers = availableLevers.slice(0, k);
			const simState = applyLeversToCandidateState(profile, testLevers);
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

			if (evalZero.directBagrutEligible) {
				directBagrutSol = { levers: testLevers, res: evalZero };
				break;
			}
		}
	}

	let track2LeverCount = 0;

	if (directBagrutSol) {
		track2LeverCount = directBagrutSol.levers.length;
		const bagrutSummary = directBagrutSol.levers
			.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל, ציון ${l.targetGrade})`)
			.join(' + ');

		tracks.push({
			id: 'track-direct-bagrut',
			userId: profile.userId,
			programId: targetProgram.id,
			title: 'המסלול הבטוח: קבלה ישירה על סמך בגרות (אפס פסיכומטרי!)',
			badge: 'קבלה ישירה ללא פסיכומטרי',
			badgeColor: 'from-emerald-500 to-teal-600',
			strategyDescription: `מעקף פסיכומטרי מלא: שדרוג ${bagrutSummary} מעלה את ממוצע הבגרות ל-${directBagrutSol.res.bagrutAverage.toFixed(1)} ומקנה זכאות מלאה לקבלה ישירה (Direct Bagrut Admission) ב${targetProgram.institutionName} — ללא צורך במבחן פסיכומטרי כלל!`,
			targetSekem: threshold,
			targetPsychometric: undefined,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			targetBagrutAverage: directBagrutSol.res.bagrutAverage,
			currentBagrutAverage: currentBagrut,
			recommendedLevers: directBagrutSol.levers.map((l) => ({
				id: l.id,
				trackId: 'track-direct-bagrut',
				subjectName: l.subjectName,
				currentGrade: l.currentGrade,
				currentUnits: l.currentUnits,
				targetGrade: l.targetGrade,
				targetUnits: l.targetUnits,
				priority: l.priority,
				reason: l.reason,
				leverType: l.leverType
			})),
			milestones: directBagrutSol.levers.map((l, idx) => ({
				id: `m_${idx}`,
				trackId: 'track-direct-bagrut',
				orderIndex: idx + 1,
				title: `שיפור / הרחבת בגרות ב-${l.subjectName}`,
				detail: `הכנה ותרגול ממוקד להגעה לציון ${l.targetGrade} (${l.reason})`,
				timing: `שבועות ${idx * 6 + 1}–${idx * 6 + 6}`,
				type: l.isMath ? 'bagrut_core' : 'bagrut_elective'
			})),
			estimatedWeeks: directBagrutSol.levers.length * 6,
			weeklyHours: availableWeeklyHours,
			feasibility: 'very_high',
			feasibilityExplanation: `קבלה מובטחת רשמית על סמך עמידה ברף קבלה ישירה בבגרות (${directBagrutSol.res.bagrutAverage.toFixed(1)}), עם אפס תלות בפסיכומטרי.`,
			keyAdvantage: 'אפס תלות בפסיכומטרי! קבלה ישירה רשמית על סמך שדרוג בגרויות בלבד.',
			createdAt: new Date()
		});
	} else {
		// -----------------------------------------------------------------------
		// FIX: Balanced Track — honest gap reporting when solver cannot close
		//      the threshold within the available psychometric headroom.
		//
		// Previous bug: when balPsychSol === null the code fell back to
		// currentPsych and falsely claimed "threshold closed in full". This is
		// now fixed: we widen the lever search up to 4 levers, and if the gap
		// is still not closeable we report the honest remaining gap honestly.
		// -----------------------------------------------------------------------
		const minMeaningfulReduction = 20;

		// Try up to 4 levers (widened from the previous hard-coded 2)
		let bestBalancedLevers = availableLevers.slice(0, Math.min(availableLevers.length, 2));
		let balPsychSol: number | null = null;

		for (let k = 2; k <= Math.min(4, availableLevers.length); k++) {
			const candidateLevers = availableLevers.slice(0, k);
			const simState = applyLeversToCandidateState(profile, candidateLevers);
			const trialSol = solveMinimumPsychometricTarget(
				institutionId,
				relevantSekemType,
				threshold,
				profile,
				simState.subjects,
				hasTakenPsych ? currentPsych : 450,
				track1Psych > 0 ? track1Psych - minMeaningfulReduction : psychCeiling,
				simState.mathUnits,
				simState.mathGrade,
				simState.physicsUnits,
				simState.physicsGrade
			);
			if (trialSol !== null) {
				balPsychSol = trialSol;
				bestBalancedLevers = candidateLevers;
				break;
			}
			// Keep the widest lever set tried so far for the honest-gap report
			if (k === Math.min(4, availableLevers.length)) {
				bestBalancedLevers = candidateLevers;
			}
		}

		const candidateLevers = bestBalancedLevers;
		const simState = applyLeversToCandidateState(profile, candidateLevers);

		// Evaluate at the best psych we can offer (or currentPsych for honest gap)
		const evalPsych = balPsychSol !== null ? balPsychSol : (hasTakenPsych ? currentPsych : 450);
		const balRes = evaluateSimulatedSekem(
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

		track2LeverCount = candidateLevers.length;
		const bagrutSummary = candidateLevers
			.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל, ציון ${l.targetGrade})`)
			.join(' + ');

		// Build an honest strategy description
		const remainingGap = Math.max(0, threshold - balRes.sekem);
		let strategyDescription: string;
		if (balPsychSol !== null) {
			strategyDescription = `שילוב מנצח: שדרוג ${bagrutSummary} מעלה את ממוצע הבגרות ל-${balRes.bagrutAverage.toFixed(1)}.${
				balPsychSol > currentPsych
					? ` מאפשר לעמוד ברף עם ציון פסיכומטרי מתון של ${balPsychSol} (הפחתה משמעותית ביחס למסלול המהיר).`
					: ` סוגר את סף הקבלה במלואו (סכם מובטח: ${balRes.sekem.toFixed(isTechnion ? 2 : 1)}) תוך שמירה על הפסיכומטרי הקיים ללא צורך בהיבחנות נוספת!`
			}`;
		} else {
			// *** FIX: Honest gap report — never claim threshold is closed! ***
			strategyDescription = `שדרוג ${bagrutSummary} ישפר את ממוצע הבגרות ל-${balRes.bagrutAverage.toFixed(1)} ויוביל לסכם של ${balRes.sekem.toFixed(1)} — פער של ${remainingGap.toFixed(1)} נקודות עדיין נותר לסגירה. המסלול דורש גם שיפור פסיכומטרי או פנייה למסלול העוגן (מכינה) להשלמת הסגירה.`;
		}

		tracks.push({
			id: 'track-balanced',
			userId: profile.userId,
			programId: targetProgram.id,
			title: balPsychSol !== null
				? 'המסלול הבטוח: שילוב מאוזן ופיזור סיכונים'
				: 'המסלול הבטוח: שדרוג בגרות מורחב (פער חלקי)',
			badge: balPsychSol !== null ? 'הכי מומלץ (הסתברות הצלחה מירבית)' : 'שיפור משמעותי בסכם (השלמה נדרשת)',
			badgeColor: 'from-emerald-500 to-teal-600',
			strategyDescription,
			targetSekem: balRes.sekem,
			targetPsychometric: balPsychSol !== null && balPsychSol > 0 ? balPsychSol : undefined,
			currentPsychometric: hasTakenPsych ? currentPsych : undefined,
			targetBagrutAverage: balRes.bagrutAverage,
			currentBagrutAverage: currentBagrut,
			recommendedLevers: candidateLevers.map((l) => ({
				id: l.id,
				trackId: 'track-balanced',
				subjectName: l.subjectName,
				currentGrade: l.currentGrade,
				currentUnits: l.currentUnits,
				targetGrade: l.targetGrade,
				targetUnits: l.targetUnits,
				priority: l.priority,
				reason: l.reason,
				leverType: l.leverType
			})),
			milestones: candidateLevers.map((l, idx) => ({
				id: `mb_${idx}`,
				trackId: 'track-balanced',
				orderIndex: idx + 1,
				title: `שיפור בגרות ב-${l.subjectName}`,
				detail: `הכנה ותרגול ממוקד לציון ${l.targetGrade} (${l.reason})`,
				timing: `שבועות ${idx * 6 + 1}–${idx * 6 + 6}`,
				type: l.isMath ? 'bagrut_core' : 'bagrut_elective'
			})),
			estimatedWeeks: 14,
			weeklyHours: availableWeeklyHours,
			feasibility: balPsychSol !== null ? 'very_high' : 'moderate',
			feasibilityExplanation: balPsychSol !== null
				? 'הסתברות הצלחה סטטיסטית הגבוהה ביותר המפחיתה חרדת מבחנים ומספקת רשת ביטחון.'
				: `סגירת פער חלקית (${balRes.sekem.toFixed(1)} מתוך ${threshold}). לסגירה מלאה נדרש שיפור פסיכומטרי נוסף או מסלול מכינה.`,
			keyAdvantage: balPsychSol !== null
				? 'הסתברות הצלחה סטטיסטית הגבוהה ביותר, מפחית חרדת מבחנים ומספק רשת ביטחון כפולה.'
				: 'שיפור בגרות מורחב מקטין את הפסיכומטרי הנדרש ומגדיל את סיכויי הקבלה בכל מסלול שתיבחר.',
			createdAt: new Date()
		});
	}

	// =========================================================================
	// TRACK 3: מסלול העוגן (Anchor Track — Mechina / Transfer / Gradual Entry)
	//
	// Always generated. Addresses candidates with:
	//   - Large Sekem gap that cannot be bridged in one exam cycle
	//   - High math/physics anxiety (missing 5u math or physics for STEM)
	//   - Low psychometric confidence
	//   - Desire for a safety net regardless of gap size
	// =========================================================================
	const mechina = getMechinaDescription(institutionId, targetProgram.institutionName);
	const sekemGap = Math.max(0, threshold - currentSekem);
	const anchorFeasibility = sekemGap <= 30 ? 'very_high' : sekemGap <= 60 ? 'high' : 'moderate';

	// Determine the single most impactful bagrut lever for the anchor supplemental step
	const anchorTopLever = availableLevers.find((l) => l.isMath || l.isPhysics) ?? availableLevers[0];
	const anchorLeverSummary = anchorTopLever
		? `שדרוג ${anchorTopLever.subjectName} ל-${anchorTopLever.targetUnits} יח״ל (ציון ${anchorTopLever.targetGrade}) תוך שנת המכינה`
		: 'שיפור ממוצע בגרות כללי';

	tracks.push({
		id: 'track-anchor',
		userId: profile.userId,
		programId: targetProgram.id,
		title: `מסלול העוגן: ${mechina.name}`,
		badge: 'מסלול בטוח ומובנה (דרך מכינה)',
		badgeColor: 'from-violet-500 to-purple-700',
		strategyDescription:
			`${mechina.detail} ` +
			`הפער הנוכחי לסף הקבלה עומד על ${sekemGap.toFixed(1)} נקודות סכם (סכם נוכחי: ${currentSekem.toFixed(1)}, סף: ${threshold}). ` +
			`תוך שנת המכינה: ${anchorLeverSummary}, ` +
			`וסיום קורס הכנה לפסיכומטרי — ניתן לפתוח את שנת הלימודים הבאה עם פרופיל מועמדות חזק משמעותית.`,
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
						leverType: anchorTopLever.leverType
					}
			  ]
			: [],
		milestones: [
			{
				id: 'ma1',
				trackId: 'track-anchor',
				orderIndex: 1,
				title: `רישום ל${mechina.name}`,
				detail: 'בדיקת מועדי הרישום ותנאי הקבלה למכינה. תנאי קבלה בדרך-כלל: גיל 17+ ובגרות בסיסית בלבד.',
				timing: 'שבוע 1–2',
				type: 'psychometric'
			},
			{
				id: 'ma2',
				trackId: 'track-anchor',
				orderIndex: 2,
				title: anchorTopLever ? `שדרוג בגרות — ${anchorTopLever.subjectName}` : 'שיפור ממוצע בגרות',
				detail: anchorTopLever
					? `מיקוד מקביל בשדרוג ${anchorTopLever.subjectName} לציון ${anchorTopLever.targetGrade} תוך שנת המכינה.`
					: 'עבודה על שיפור ממוצע הבגרות במקביל ללימודי המכינה.',
				timing: 'שבועות 4–24',
				type: anchorTopLever?.isMath ? 'bagrut_core' : 'bagrut_elective'
			},
			{
				id: 'ma3',
				trackId: 'track-anchor',
				orderIndex: 3,
				title: 'קורס הכנה לפסיכומטרי (מקביל)',
				detail: 'קורס פסיכומטרי אינטנסיבי ב-10 שבועות במהלך שנת המכינה. ניתן להגיע ל-+40–60 נקודות בממוצע.',
				timing: 'שבועות 10–20',
				type: 'psychometric'
			},
			{
				id: 'ma4',
				trackId: 'track-anchor',
				orderIndex: 4,
				title: 'הגשת מועמדות מחוזקת',
				detail: `לאחר סיום המכינה: הגשת מועמדות ל${targetProgram.institutionName} עם ממוצע מחוזק וציון פסיכומטרי מעודכן.`,
				timing: `שבועות ${mechina.durationWeeks - 4}–${mechina.durationWeeks}`,
				type: 'psychometric'
			}
		],
		estimatedWeeks: mechina.durationWeeks,
		weeklyHours: availableWeeklyHours,
		feasibility: anchorFeasibility,
		feasibilityExplanation:
			`מסלול מובנה ובטוח עם מסגרת ברורה. פער הסכם הנוכחי (${sekemGap.toFixed(1)} נקודות) ` +
			`ניתן לסגירה ב-${mechina.durationWeeks} שבועות של מכינה + הכנה מקבילה לפסיכומטרי.`,
		keyAdvantage:
			'רשת ביטחון מבנית: מסגרת לימודית מובנית מוכיחה מוטיבציה ורצינות, ומאפשרת קבלה גם ללא שיפור פסיכומטרי מלא.',
		createdAt: new Date()
	});

	return {
		tracks,
		availableLevers,
		hasDirectBagrutOption: directBagrutSol !== null
	};
}
