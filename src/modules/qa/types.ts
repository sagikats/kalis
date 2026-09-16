import { RecommendedTrack, UserPreferencesQuestionnaire } from '../../utils/analysis/trackGenerator';
import { AcademicDegree } from '../../types/academic';
import { UserAcademicProfile } from '../../utils/analysis/gapAnalyzer';

export interface QAProgramTarget extends AcademicDegree {
	institutionId: string;
	institutionName: string;
	calculatorId: string;
	relevantSekemType?: 'general' | 'engineering' | 'management' | 'technion';
	prerequisites?: {
		minMathUnits?: number;
		minMathGrade?: number;
		requiresPhysics?: boolean;
		minPsychometricFloor?: number;
		directBagrutMinAverage?: number;
	};
}

export type TrackAuditSeverity = 'critical' | 'warning' | 'info';

export type TrackAuditPenaltyCategory =
	| 'MATH_DISCREPANCY'
	| 'THRESHOLD_UNMET'
	| 'PREREQUISITE_VIOLATION'
	| 'DROPPED_SUBJECT'
	| 'REDUNDANT_EXAMS'
	| 'ROI_UNVIABLE'
	| 'PSYCHOMETRIC_OVERLOAD'
	| 'WORKLOAD_OVERLOAD'
	| 'COPY_PARADOX'
	| 'MECHINA_MISMANAGEMENT';

export interface TrackAuditIssue {
	code: TrackAuditPenaltyCategory;
	severity: TrackAuditSeverity;
	penaltyPoints: number;
	title: string;
	description: string;
	expected: string | number;
	actual: string | number;
	remedyRecommendation: string;
}

export interface TrackAuditMetrics {
	simulatedSekem: number;
	cardTargetSekem: number;
	threshold: number;
	gapClosed: number;
	psychometricDelta: number;
	examCount: number;
	estimatedWeeks: number;
	weeklyHours: number;
	pointsPerStudyHour: number;
	hasPrerequisiteStep: boolean;
	hasDroppedSubject: boolean;
}

export interface TrackAuditReport {
	trackId: string;
	trackTitle: string;
	isValid: boolean;
	qualityScore: number; // 0 - 100
	grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
	issues: TrackAuditIssue[];
	metrics: TrackAuditMetrics;
}

export interface ScenarioAuditReport {
	scenarioId: string;
	studentName: string;
	institutionId: string;
	institutionName: string;
	programId: string;
	programName: string;
	threshold: number;
	candidateInitialSekem: number;
	candidateInitialBagrut: number;
	candidateInitialPsych: number;
	tracksCount: number;
	overallScore: number;
	hasCriticalErrors: boolean;
	criticalIssuesCount: number;
	warningsCount: number;
	trackReports: TrackAuditReport[];
}

export interface StudentArchetype {
	id: string;
	name: string;
	description: string;
	profile: UserAcademicProfile;
	preferences: UserPreferencesQuestionnaire;
	targetProgramId: string;
	expectedBehaviors: {
		mustAchieveAdmission: boolean;
		minRecommendedTracks?: number;
		maxRecommendedTracks?: number;
		expectedDirectBagrut?: boolean;
		allowedPsychCeiling?: number;
		maxAllowedExamsTrack1?: number;
		maxAllowedExamsTrack2?: number;
		requiresPhysicsPrerequisiteNotice?: boolean;
		prohibitedSubjectLevers?: string[];
	};
}

export interface BatchAuditSummary {
	timestamp: string;
	totalScenariosTested: number;
	totalTracksAudited: number;
	averageQualityScore: number;
	cleanTracksPercentage: number;
	criticalIssuesTotal: number;
	warningsTotal: number;
	issueCategoryCounts: Record<TrackAuditPenaltyCategory, number>;
	institutionBreakdown: Record<
		string,
		{
			institutionName: string;
			totalScenarios: number;
			averageScore: number;
			criticalErrors: number;
			passRate: number;
		}
	>;
	scenarios: ScenarioAuditReport[];
}
