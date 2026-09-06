/**
 * Pure Functional Types for Israeli University Admission Calculators
 * Subagent 3: Data Verification & Institution Calculators
 */

export interface CalculatorSubject {
	name: string;
	units: number;
	grade: number;
}

export interface DroppedSubjectInfo {
	name: string;
	units: number;
	grade: number;
	effectiveScoreWithBonus: number;
	reason: string;
}

export interface OptimalBagrutResult {
	average: number;
	optimalUnits: number;
	totalOriginalUnits: number;
	droppedSubjects: DroppedSubjectInfo[];
	includedSubjects: CalculatorSubject[];
	hasScienceCluster?: boolean;
}

export interface InstitutionCalculatorInput {
	bagrutSubjects: CalculatorSubject[];
	psychometricGeneral?: number;
	psychometricQuant?: number;
	psychometricVerbal?: number;
	psychometricEnglish?: number;
	mathUnits?: number;
	mathGrade?: number;
	physicsUnits?: number;
	physicsGrade?: number;
}

export interface InstitutionCalculatorResult {
	institutionId: string;
	institutionName: string;
	bagrutAverage: number;
	optimalUnits: number;
	generalSekem: number;
	engineeringSekem?: number;
	managementSekem?: number;
	directBagrutEligible: boolean;
	notes: string[];
	droppedSubjects: string[];
}

export interface UniversityBonusRule {
	subjectNameMatch: string;
	minUnits: number;
	bonusPoints: number;
	condition?: string;
}
