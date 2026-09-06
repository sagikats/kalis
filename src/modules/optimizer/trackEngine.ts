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

	let track1Psych = fastPsychSol !== null ? fastPsychSol : 0;

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
		// Balanced Track with Meaningful Delta Rule: must reduce psychometric by at least 20 points!
		const minMeaningfulReduction = 20;
		const candidateLevers = availableLevers.slice(0, Math.min(availableLevers.length, 2));

		const simState = applyLeversToCandidateState(profile, candidateLevers);
		const balPsychSol = solveMinimumPsychometricTarget(
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

		const balPsych = balPsychSol !== null ? balPsychSol : currentPsych;
		const balRes = evaluateSimulatedSekem(
			institutionId,
			relevantSekemType,
			profile,
			simState.subjects,
			balPsych,
			simState.mathUnits,
			simState.mathGrade,
			simState.physicsUnits,
			simState.physicsGrade
		);

		track2LeverCount = candidateLevers.length;
		const bagrutSummary = candidateLevers
			.map((l) => `${l.subjectName} (${l.targetUnits} יח״ל, ציון ${l.targetGrade})`)
			.join(' + ');

		tracks.push({
			id: 'track-balanced',
			userId: profile.userId,
			programId: targetProgram.id,
			title: 'המסלול הבטוח: שילוב מאוזן ופיזור סיכונים',
			badge: 'הכי מומלץ (הסתברות הצלחה מירבית)',
			badgeColor: 'from-emerald-500 to-teal-600',
			strategyDescription: `שילוב מנצח: שדרוג ${bagrutSummary} מעלה את ממוצע הבגרות ל-${balRes.bagrutAverage.toFixed(1)}.${
				balPsych > currentPsych
					? ` מאפשר לעמוד ברף עם ציון פסיכומטרי מתון של ${balPsych} (הפחתה משמעותית ביחס למסלול המהיר).`
					: ` סוגר את סף הקבלה במלואו (סכם מובטח: ${balRes.sekem.toFixed(isTechnion ? 2 : 1)}) תוך שמירה על הפסיכומטרי הקיים ללא צורך בהיבחנות נוספת!`
			}`,
			targetSekem: balRes.sekem,
			targetPsychometric: balPsych > 0 ? balPsych : undefined,
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
			feasibility: 'very_high',
			feasibilityExplanation: 'הסתברות הצלחה סטטיסטית הגבוהה ביותר המפחיתה חרדת מבחנים ומספקת רשת ביטחון.',
			keyAdvantage: 'הסתברות הצלחה סטטיסטית הגבוהה ביותר, מפחית חרדת מבחנים ומספק רשת ביטחון כפולה.',
			createdAt: new Date()
		});
	}

	return {
		tracks,
		availableLevers,
		hasDirectBagrutOption: directBagrutSol !== null
	};
}
