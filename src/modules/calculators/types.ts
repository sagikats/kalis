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

/** How one bagrut subject took part in the optimal average (for the "how was my score computed" breakdown). */
export interface SubjectBreakdownItem {
	name: string;
	units: number;
	grade: number;
	bonus: number;
	/** grade + bonus — the score this subject contributes to the average. */
	effective: number;
	/** Weight in the average (usually its units; e.g. Technion doubles math). */
	weight: number;
	/** mandatory = always counted; included = elective that raises the average; dropped = elective left out; empty = no grade yet. */
	status: 'mandatory' | 'included' | 'dropped' | 'empty';
}

export interface OptimalBagrutResult {
	average: number;
	optimalUnits: number;
	totalOriginalUnits: number;
	droppedSubjects: DroppedSubjectInfo[];
	includedSubjects: CalculatorSubject[];
	hasScienceCluster?: boolean;
	/** Every subject with its bonus and whether it counted. */
	breakdown?: SubjectBreakdownItem[];
	/** Cap applied to the average, if the institution has one. */
	cap?: number;
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
	/** The applicant's general psychometric score — the "score" of programs that admit by psychometric alone. */
	psychometricGeneral?: number;
	/** The institution's own score on its native scale, when it differs from the 200–800 comparison scale (e.g. HUJI weighted score ≈16–27, Reichman adjusted score with decimals). */
	officialScore?: number;
	notes: string[];
	droppedSubjects: string[];
	/** Per-subject breakdown of the optimal bagrut average. */
	subjectBreakdown?: SubjectBreakdownItem[];
	/** Cap applied to the bagrut average, if any (e.g. TAU 117). */
	bagrutCap?: number;
}

/** Bagrut subject as entered by the user (same shape as CalculatorSubject). */
export type SubjectInput = CalculatorSubject;

export interface UniversityBonusRule {
	subjectNameMatch: string;
	minUnits: number;
	bonusPoints: number;
	condition?: string;
}
