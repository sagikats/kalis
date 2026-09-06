/**
 * Pure Types for Admission Optimization Engine
 * Subagent 2: Recommendation & Optimization Algorithms
 */

import { CalculatorSubject } from '../calculators/types';
import {
	AcademicProgramRecord,
	UserAcademicProfileRecord,
	UserPreferencesRecord,
	ActionTrackRecord,
	ImprovementLeverRecord
} from '../db/schema';

export interface SubjectLeverCandidate {
	id: string;
	subjectName: string;
	currentGrade: number;
	currentUnits: number;
	targetGrade: number;
	targetUnits: number;
	priority: number;
	reason: string;
	isMath?: boolean;
	isPhysics?: boolean;
	utilityScore: number;
	leverType: 'psychometric' | 'bagrut_core' | 'bagrut_elective';
}

export interface OptimizationProblem {
	targetProgram: AcademicProgramRecord;
	profile: UserAcademicProfileRecord;
	preferences: UserPreferencesRecord;
	currentSekem: number;
	threshold: number;
	gap: number;
}

export interface OptimizationSolution {
	tracks: ActionTrackRecord[];
	availableLevers: SubjectLeverCandidate[];
	hasDirectBagrutOption: boolean;
}
