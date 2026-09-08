/**
 * Types and interfaces for Track Efficiency & Effort Cost Model
 * Subagent 2: Optimizer & Recommendation Engine
 */

import { SubjectLeverCandidate } from '../types';
import { UserPreferencesRecord, UserAcademicProfileRecord, FeasibilityLevel, ActionTrackRecord, AcademicProgramRecord } from '../../db/schema';

export interface EffortBreakdown {
	baseHours: number;
	affinityMultiplier: number;
	experienceMultiplier: number;
	verbalReasoningBonus: number;
	examOverheadHours: number;
	totalEffortHours: number;
}

export interface LeverEffortAssessment {
	leverId: string;
	subjectName: string;
	leverType: 'psychometric' | 'bagrut_core' | 'bagrut_elective';
	units: number;
	gradeDelta: number;
	effortHours: number;
	sekemYield: number;
	roi: number; // Sekem yield per 10 hours
	breakdown: EffortBreakdown;
}

export interface TrackEfficiencyReport {
	trackId: string;
	trackTitle: string;
	totalEffortHours: number;
	sekemYield: number;
	efficiencyIndex: number; // (sekemYield / totalEffortHours) * 100
	examCount: number;
	leversEffort: LeverEffortAssessment[];
	isLeastEffortOptimal: boolean;
	hasZeroRedundancy: boolean;
	isAbilityAligned: boolean;
	meetsReachabilityBounds: boolean;
	prunedLevers?: string[]; // Levers pruned via micro-improvement rule
}

export interface StudentBenchmarkArchetype {
	id: string;
	name: string;
	description: string;
	targetProgram: AcademicProgramRecord;
	profile: UserAcademicProfileRecord;
	preferences: UserPreferencesRecord;
	expectedCharacteristics: {
		mustPreferBagrutOverPsych?: boolean;
		mustHaveDirectBagrut?: boolean;
		mustHaveLongTermTrack?: boolean;
		mustHaveMechina?: boolean;
		mustPruneOverkill?: boolean;
		maxAllowedEffortHours?: number;
		dominantSubject?: string;
	};
}
