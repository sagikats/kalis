/**
 * Micro-Improvement Redundancy Pruner
 * Subagent 2: Optimizer & Recommendation Engine
 *
 * Implements User Rule:
 * Tests if an extra lever/exam can be completely eliminated by applying an achievable
 * micro-improvement to an already-included subject:
 * - Psychometric: +7 points
 * - Humanities 2-unit core: +5 points
 * - 5-unit exam (Math / Physics / Elective): +2 to +3 points
 */

import { SubjectLeverCandidate } from '../types';
import { UserAcademicProfileRecord, SekemType } from '../../db/schema';
import { evaluateSimulatedSekem, applyLeversToCandidateState } from '../solver';

export interface MicroPruningResult {
	prunedLevers: SubjectLeverCandidate[];
	survivingLevers: SubjectLeverCandidate[];
	adjustedPsychometric?: number;
	explanation: string[];
	didPrune: boolean;
}

export const MICRO_IMPROVEMENT_LIMITS = {
	psychometricPoints: 7,
	humanities2uPoints: 5,
	stemOrElective5uPoints: 3
};

/**
 * Prunes redundant levers if a tiny micro-increment on an already-included subject closes the gap
 */
export function pruneRedundantLeversWithMicroImprovement(
	institutionId: string,
	relevantSekemType: SekemType,
	threshold: number,
	profile: UserAcademicProfileRecord,
	currentLevers: SubjectLeverCandidate[],
	currentPsychTarget?: number,
	personalPsychCeiling: number = 720
): MicroPruningResult {
	let survivingLevers = [...currentLevers];
	let adjustedPsych = currentPsychTarget;
	const prunedLevers: SubjectLeverCandidate[] = [];
	const explanation: string[] = [];

	// Need at least 2 levers, or 1 lever + psychometric, to have a candidate for pruning
	const totalExams = survivingLevers.length + (adjustedPsych ? 1 : 0);
	if (totalExams <= 1) {
		return {
			prunedLevers: [],
			survivingLevers,
			adjustedPsychometric: adjustedPsych,
			explanation: ['המסלול כבר כולל בחינה בודדת — אין יתירות.'],
			didPrune: false
		};
	}

	// Try pruning levers starting from the lowest priority (least vital / extra)
	let changed = true;
	while (changed && survivingLevers.length > 0) {
		changed = false;

		for (let i = survivingLevers.length - 1; i >= 0; i--) {
			const candidateToDrop = survivingLevers[i];
			// Never prune math upgrade if candidate has fewer than 4 math units (faculty prerequisite)
			if (candidateToDrop.isMath && (profile.mathUnits || 0) < 4) {
				continue;
			}
			const remainingLevers = survivingLevers.filter((_, idx) => idx !== i);

			// Test 1: Check if surviving state already meets threshold without any micro-improvement
			const baseSimState = applyLeversToCandidateState(profile, remainingLevers);
			const baseRes = evaluateSimulatedSekem(
				institutionId,
				relevantSekemType,
				profile,
				baseSimState.subjects,
				adjustedPsych ?? (profile.hasTakenPsychometric ? profile.psychometricGeneral : 600),
				baseSimState.mathUnits,
				baseSimState.mathGrade,
				baseSimState.physicsUnits,
				baseSimState.physicsGrade
			);

			if (baseRes.sekem >= threshold) {
				// Pure redundancy: lever wasn't even needed
				survivingLevers = remainingLevers;
				prunedLevers.push(candidateToDrop);
				explanation.push(
					`המנוף ${candidateToDrop.subjectName} הוסר לחלוטין: שאר המרכיבים כבר מביאים לסכם הנדרש (${baseRes.sekem.toFixed(1)} >= ${threshold}).`
				);
				changed = true;
				break;
			}

			// Test 2: Check if Psychometric Micro-Improvement (<= 7 pts) closes the gap
			if (adjustedPsych) {
				const boostedPsych = Math.min(personalPsychCeiling, adjustedPsych + MICRO_IMPROVEMENT_LIMITS.psychometricPoints);
				const psychBoostRes = evaluateSimulatedSekem(
					institutionId,
					relevantSekemType,
					profile,
					baseSimState.subjects,
					boostedPsych,
					baseSimState.mathUnits,
					baseSimState.mathGrade,
					baseSimState.physicsUnits,
					baseSimState.physicsGrade
				);

				if (psychBoostRes.sekem >= threshold) {
					// Drop lever and apply small psychometric boost
					const psychDelta = boostedPsych - adjustedPsych;
					adjustedPsych = boostedPsych;
					survivingLevers = remainingLevers;
					prunedLevers.push(candidateToDrop);
					explanation.push(
						`המנוף ${candidateToDrop.subjectName} הוסר: תוספת קטנה של ${psychDelta} נקודות בפסיכומטרי (ל-${boostedPsych}) סוגרת את הסף וחוסכת בחינת בגרות מלאה!`
					);
					changed = true;
					break;
				}
			}

			// Test 3: Check if a surviving Bagrut lever can take a micro-improvement
			let bagrutPruned = false;
			for (let j = 0; j < remainingLevers.length; j++) {
				const survivingTarget = remainingLevers[j];
				const is5u = survivingTarget.targetUnits >= 5;
				const maxAllowedBoost = is5u
					? MICRO_IMPROVEMENT_LIMITS.stemOrElective5uPoints
					: MICRO_IMPROVEMENT_LIMITS.humanities2uPoints;

				const microBoostedGrade = Math.min(98, survivingTarget.targetGrade + maxAllowedBoost);
				if (microBoostedGrade <= survivingTarget.targetGrade) continue;

				const testLevers = remainingLevers.map((l, idx) =>
					idx === j ? { ...l, targetGrade: microBoostedGrade } : l
				);

				const testSimState = applyLeversToCandidateState(profile, testLevers);
				const testRes = evaluateSimulatedSekem(
					institutionId,
					relevantSekemType,
					profile,
					testSimState.subjects,
					adjustedPsych ?? (profile.hasTakenPsychometric ? profile.psychometricGeneral : 600),
					testSimState.mathUnits,
					testSimState.mathGrade,
					testSimState.physicsUnits,
					testSimState.physicsGrade
				);

				if (testRes.sekem >= threshold) {
					const gradeDelta = microBoostedGrade - survivingTarget.targetGrade;
					survivingLevers = testLevers;
					prunedLevers.push(candidateToDrop);
					explanation.push(
						`המנוף ${candidateToDrop.subjectName} הוסר: תוספת קלה של ${gradeDelta} נקודות ב-${survivingTarget.subjectName} (לציון ${microBoostedGrade}) סוגרת את הסף ומבטלת בחינה נפרדת.`
					);
					bagrutPruned = true;
					changed = true;
					break;
				}
			}

			if (bagrutPruned) break;
		}
	}

	return {
		prunedLevers,
		survivingLevers,
		adjustedPsychometric: adjustedPsych,
		explanation,
		didPrune: prunedLevers.length > 0
	};
}
