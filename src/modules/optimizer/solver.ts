/**
 * Closed-Loop Solver & Binary Search Optimizer
 * Interfaces directly with pure calculators from Subagent 3
 * Subagent 2: Recommendation & Optimization Algorithms
 */

import { CalculatorSubject, InstitutionCalculatorResult } from '../calculators/types';
import { calculateInstitution } from '../calculators/index';
import { UserAcademicProfileRecord, SekemType } from '../db/schema';
import { SubjectLeverCandidate } from './types';

export interface EvaluatedCandidateState {
	sekem: number;
	bagrutAverage: number;
	directBagrutEligible: boolean;
	fullResult: InstitutionCalculatorResult;
}

export function toCalculatorSubjects(
	profile: UserAcademicProfileRecord,
	simulatedMathUnits?: number,
	simulatedMathGrade?: number,
	simulatedPhysUnits?: number,
	simulatedPhysGrade?: number
): CalculatorSubject[] {
	const mathU = simulatedMathUnits ?? profile.mathUnits ?? 4;
	const mathG = simulatedMathGrade ?? profile.mathGrade ?? 80;
	const physU = simulatedPhysUnits ?? profile.physicsUnits ?? 0;
	const physG = simulatedPhysGrade ?? profile.physicsGrade ?? 0;

	const subs: CalculatorSubject[] = profile.bagrutSubjects.map((s) => ({
		name: s.subjectName,
		units: s.units,
		grade: s.grade
	}));

	// Ensure Math reflects simulation
	const mathIdx = subs.findIndex((s) => s.name.includes('מתמטיקה'));
	if (mathIdx >= 0) {
		subs[mathIdx] = { ...subs[mathIdx], units: mathU, grade: mathG };
	} else {
		subs.push({ name: 'מתמטיקה', units: mathU, grade: mathG });
	}

	// Ensure Physics reflects simulation
	if (physU > 0 && physG > 0) {
		const physIdx = subs.findIndex((s) => s.name.includes('פיזיקה'));
		if (physIdx >= 0) {
			subs[physIdx] = { ...subs[physIdx], units: physU, grade: physG };
		} else {
			subs.push({ name: 'פיזיקה', units: physU, grade: physG });
		}
	}

	return subs;
}

export function applyLeversToCandidateState(
	profile: UserAcademicProfileRecord,
	levers: SubjectLeverCandidate[]
): {
	subjects: CalculatorSubject[];
	mathUnits: number;
	mathGrade: number;
	physicsUnits: number;
	physicsGrade: number;
} {
	let mathU = profile.mathUnits || 4;
	let mathG = profile.mathGrade || 80;
	let physU = profile.physicsUnits || 0;
	let physG = profile.physicsGrade || 0;

	let currentSubs = toCalculatorSubjects(profile);

	for (const lever of levers) {
		if (lever.isMath) {
			mathU = lever.targetUnits;
			mathG = lever.targetGrade;
			currentSubs = currentSubs.map((s) => (s.name.includes('מתמטיקה') ? { ...s, units: mathU, grade: mathG } : s));
		} else if (lever.isPhysics) {
			physU = lever.targetUnits;
			physG = lever.targetGrade;
			const pIdx = currentSubs.findIndex((s) => s.name.includes('פיזיקה'));
			if (pIdx >= 0) {
				currentSubs[pIdx] = { ...currentSubs[pIdx], units: physU, grade: physG };
			} else {
				currentSubs.push({ name: 'פיזיקה', units: physU, grade: physG });
			}
		} else {
			const idx = currentSubs.findIndex((s) => s.name === lever.subjectName);
			if (idx >= 0) {
				currentSubs[idx] = { ...currentSubs[idx], grade: lever.targetGrade, units: lever.targetUnits };
			} else {
				currentSubs.push({ name: lever.subjectName, grade: lever.targetGrade, units: lever.targetUnits });
			}
		}
	}

	return { subjects: currentSubs, mathUnits: mathU, mathGrade: mathG, physicsUnits: physU, physicsGrade: physG };
}

export function evaluateSimulatedSekem(
	institutionId: string,
	relevantSekemType: SekemType,
	profile: UserAcademicProfileRecord,
	subjects: CalculatorSubject[],
	simulatedPsych: number,
	mathUnits?: number,
	mathGrade?: number,
	physUnits?: number,
	physGrade?: number
): EvaluatedCandidateState {
	const baseQuant = profile.psychometricQuant || Math.round((profile.psychometricGeneral || 600) / 5);
	const currentGen = profile.psychometricGeneral || 600;
	const psychRatio = currentGen > 0 ? simulatedPsych / currentGen : 1;
	const simulatedQuant = Math.min(150, Math.max(50, Math.round(baseQuant * psychRatio)));

	const res = calculateInstitution(institutionId, {
		bagrutSubjects: subjects,
		psychometricGeneral: simulatedPsych,
		psychometricQuant: simulatedQuant,
		psychometricVerbal: profile.psychometricVerbal,
		psychometricEnglish: profile.psychometricEnglish,
		mathUnits: mathUnits ?? profile.mathUnits,
		mathGrade: mathGrade ?? profile.mathGrade,
		physicsUnits: physUnits ?? profile.physicsUnits,
		physicsGrade: physGrade ?? profile.physicsGrade
	});

	let sekem = res.generalSekem;
	if (relevantSekemType === 'engineering' && res.engineeringSekem !== undefined) {
		sekem = res.engineeringSekem;
	} else if (relevantSekemType === 'management' && res.managementSekem !== undefined) {
		sekem = res.managementSekem;
	}

	return {
		sekem,
		bagrutAverage: res.bagrutAverage,
		directBagrutEligible: res.directBagrutEligible,
		fullResult: res
	};
}

/**
 * Solves for the exact minimum psychometric target required to meet the cutoff
 * using Binary Search against the institution's pure calculator.
 */
export function solveMinimumPsychometricTarget(
	institutionId: string,
	relevantSekemType: SekemType,
	threshold: number,
	profile: UserAcademicProfileRecord,
	subjects: CalculatorSubject[],
	minPsych: number = 200,
	maxPsych: number = 800,
	mathUnits?: number,
	mathGrade?: number,
	physUnits?: number,
	physGrade?: number
): number | null {
	const hasTakenPsych = profile.hasTakenPsychometric && profile.psychometricGeneral > 0;
	const currentPsych = hasTakenPsych ? profile.psychometricGeneral : 200;
	const effectiveMin = hasTakenPsych ? Math.max(currentPsych, minPsych) : Math.max(200, minPsych);

	let low = effectiveMin;
	let high = Math.min(800, maxPsych);
	let bestMatch: number | null = null;

	const maxRes = evaluateSimulatedSekem(
		institutionId,
		relevantSekemType,
		profile,
		subjects,
		high,
		mathUnits,
		mathGrade,
		physUnits,
		physGrade
	);
	if (maxRes.sekem < threshold) {
		return null; // Cannot reach threshold even at max psychometric
	}

	const minRes = evaluateSimulatedSekem(
		institutionId,
		relevantSekemType,
		profile,
		subjects,
		low,
		mathUnits,
		mathGrade,
		physUnits,
		physGrade
	);
	if (minRes.sekem >= threshold) {
		return low;
	}

	while (low <= high) {
		const mid = Math.round((low + high) / 2);
		const res = evaluateSimulatedSekem(
			institutionId,
			relevantSekemType,
			profile,
			subjects,
			mid,
			mathUnits,
			mathGrade,
			physUnits,
			physGrade
		);

		if (res.sekem >= threshold) {
			bestMatch = mid;
			high = mid - 1; // Try finding a lower psychometric score
		} else {
			low = mid + 1;
		}
	}

	return bestMatch !== null ? Math.max(effectiveMin, bestMatch) : null;
}
