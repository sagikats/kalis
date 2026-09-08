/**
 * Efficiency Benchmarker Engine
 * Audits generated tracks against minimum effort optimality and quality metrics
 * Subagent 2: Optimizer & Recommendation Engine
 */

import { ActionTrackRecord, AcademicProgramRecord, UserAcademicProfileRecord, UserPreferencesRecord } from '../../db/schema';
import { calculatePsychometricEffortHours, calculateSubjectLeverEffortHours } from './effortCostModel';
import { TrackEfficiencyReport, LeverEffortAssessment, StudentBenchmarkArchetype } from './types';
import { generateOptimizedActionTracks } from '../trackEngine';
import { pruneRedundantLeversWithMicroImprovement } from './microImprovementPruner';
import { evaluateSimulatedSekem, toCalculatorSubjects } from '../solver';

export function evaluateTrackEfficiency(
	track: ActionTrackRecord,
	targetProgram: AcademicProgramRecord,
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): TrackEfficiencyReport {
	const baseSubjects = toCalculatorSubjects(profile);
	const initialRes = evaluateSimulatedSekem(
		targetProgram.institutionId,
		targetProgram.relevantSekemType,
		profile,
		baseSubjects,
		profile.hasTakenPsychometric ? profile.psychometricGeneral : 600
	);
	const currentSekem = initialRes.sekem;
	const targetSekem = track.targetSekem ?? targetProgram.minSekemThreshold;
	const sekemYield = Math.max(0, targetSekem - currentSekem);

	const leversEffort: LeverEffortAssessment[] = [];
	let totalEffortHours = 0;
	let examCount = 0;

	// 1. Evaluate bagrut levers
	if (track.recommendedLevers && track.recommendedLevers.length > 0) {
		for (const lever of track.recommendedLevers) {
			examCount += 1;
			const leverCandidate = {
				id: lever.id,
				subjectName: lever.subjectName,
				currentGrade: lever.currentGrade,
				currentUnits: lever.currentUnits,
				targetGrade: lever.targetGrade,
				targetUnits: lever.targetUnits,
				priority: lever.priority,
				reason: lever.reason,
				isMath: lever.subjectName.includes('מתמטיקה'),
				isPhysics: lever.subjectName.includes('פיזיקה'),
				utilityScore: 90,
				leverType: lever.leverType
			};

			const breakdown = calculateSubjectLeverEffortHours(leverCandidate, profile, preferences);
			totalEffortHours += breakdown.totalEffortHours;

			leversEffort.push({
				leverId: lever.id,
				subjectName: lever.subjectName,
				leverType: lever.leverType,
				units: lever.targetUnits,
				gradeDelta: Math.max(0, lever.targetGrade - lever.currentGrade),
				effortHours: breakdown.totalEffortHours,
				sekemYield: 0, // Computed in aggregate
				roi: 0,
				breakdown
			});
		}
	}

	// 2. Evaluate psychometric jump
	const currentPsych = profile.hasTakenPsychometric ? profile.psychometricGeneral : 0;
	const targetPsych = track.targetPsychometric;
	if (targetPsych && targetPsych > currentPsych) {
		examCount += 1;
		const breakdown = calculatePsychometricEffortHours(targetPsych, profile, preferences);
		totalEffortHours += breakdown.totalEffortHours;

		leversEffort.push({
			leverId: 'psychometric',
			subjectName: 'פסיכומטרי',
			leverType: 'psychometric',
			units: 0,
			gradeDelta: targetPsych - currentPsych,
			effortHours: breakdown.totalEffortHours,
			sekemYield: 0,
			roi: 0,
			breakdown
		});
	}

	// 3. Efficiency index
	const safeHours = Math.max(1, totalEffortHours);
	const efficiencyIndex = Math.round((sekemYield / safeHours) * 1000) / 10;

	// 4. Zero redundancy / micro-pruning audit
	const candidateLevers = (track.recommendedLevers || []).map((l) => ({
		id: l.id,
		subjectName: l.subjectName,
		currentGrade: l.currentGrade,
		currentUnits: l.currentUnits,
		targetGrade: l.targetGrade,
		targetUnits: l.targetUnits,
		priority: l.priority,
		reason: l.reason,
		isMath: l.subjectName.includes('מתמטיקה'),
		isPhysics: l.subjectName.includes('פיזיקה'),
		utilityScore: 90,
		leverType: l.leverType
	}));

	const pruneAudit = pruneRedundantLeversWithMicroImprovement(
		targetProgram.institutionId,
		targetProgram.relevantSekemType,
		targetProgram.minSekemThreshold,
		profile,
		candidateLevers,
		targetPsych
	);

	// 5. Ability alignment check
	let isAbilityAligned = true;
	if (preferences.learningOrientation === 'humanities') {
		const recommends5uMathOrPhysics = (track.recommendedLevers || []).some(
			(l) => (l.subjectName.includes('מתמטיקה') || l.subjectName.includes('פיזיקה')) && l.targetUnits >= 5
		);
		const isStemProgram =
			targetProgram.relevantSekemType === 'engineering' ||
			targetProgram.relevantSekemType === 'technion' ||
			targetProgram.fieldOfStudy.includes('מחשב');

		if (recommends5uMathOrPhysics && !isStemProgram) {
			isAbilityAligned = false;
		}
	}

	// 6. Reachability bounds check
	let meetsReachabilityBounds = true;
	if (targetPsych && targetPsych > 790) {
		meetsReachabilityBounds = false;
	}

	return {
		trackId: track.id,
		trackTitle: track.title,
		totalEffortHours,
		sekemYield,
		efficiencyIndex,
		examCount,
		leversEffort,
		isLeastEffortOptimal: totalEffortHours > 0 && totalEffortHours <= 450,
		hasZeroRedundancy: !pruneAudit.didPrune,
		isAbilityAligned,
		meetsReachabilityBounds,
		prunedLevers: pruneAudit.prunedLevers.map((p) => p.subjectName)
	};
}

export function benchmarkArchetype(archetype: StudentBenchmarkArchetype): {
	archetype: StudentBenchmarkArchetype;
	reports: TrackEfficiencyReport[];
	passedAllCriteria: boolean;
	failures: string[];
} {
	const solution = generateOptimizedActionTracks(
		archetype.targetProgram,
		archetype.profile,
		archetype.preferences
	);

	const reports: TrackEfficiencyReport[] = solution.tracks.map((t) =>
		evaluateTrackEfficiency(t, archetype.targetProgram, archetype.profile, archetype.preferences)
	);

	const failures: string[] = [];

	if (archetype.expectedCharacteristics.mustHaveDirectBagrut && !solution.hasDirectBagrutOption) {
		failures.push('Expected Direct Bagrut option but none was generated.');
	}

	if (archetype.expectedCharacteristics.mustHaveMechina && !solution.mechinaAvailable) {
		failures.push('Expected Mechina recommendation but mechinaAvailable was false.');
	}

	if (archetype.expectedCharacteristics.mustHaveLongTermTrack) {
		const hasLongTerm = solution.tracks.some((t) => t.id === 'track-long-term' || t.estimatedWeeks >= 30);
		if (!hasLongTerm) {
			failures.push('Expected Long-Term multi-phase track (30+ weeks) for huge gap.');
		}
	}

	if (archetype.expectedCharacteristics.maxAllowedEffortHours) {
		const minTrackHours = Math.min(...reports.map((r) => r.totalEffortHours));
		if (minTrackHours > archetype.expectedCharacteristics.maxAllowedEffortHours) {
			failures.push(
				`Minimum track effort (${minTrackHours}h) exceeded allowed limit of ${archetype.expectedCharacteristics.maxAllowedEffortHours}h.`
			);
		}
	}

	return {
		archetype,
		reports,
		passedAllCriteria: failures.length === 0,
		failures
	};
}
