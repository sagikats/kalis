/**
 * Pure Functional Types for Israeli University Admission Calculators
 * Subagent 3: Data Verification & Institution Calculators
 */

export type InstitutionId =
	| 'technion'
	| 'tau'
	| 'huji'
	| 'bgu'
	| 'haifa'
	| 'ariel'
	| 'bar_ilan'
	| 'reichman';

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
	psychometricQuantEmphasis?: number;
	psychometricVerbalEmphasis?: number;
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
	quantitativeSekem?: number;
	directBagrutEligible: boolean;
	/** The institution's own score on its native scale, when it differs from the 200–800 comparison scale (e.g. HUJI weighted score ≈16–27, Reichman adjusted score with decimals). */
	officialScore?: number;
	notes: string[];
	droppedSubjects: string[];
}

/** Bagrut subject as entered by the user (same shape as CalculatorSubject). */
export type SubjectInput = CalculatorSubject;

export interface UniversityBonusRule {
	subjectNameMatch: string;
	minUnits: number;
	bonusPoints: number;
	condition?: string;
}
