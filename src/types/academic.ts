export interface AcademicDegree {
     id: string;
     fieldOfStudy: string;               // שם תחום ההשכלה / חוג
     degreeLevel: string;                // רמת התואר (תואר ראשון)
     description?: string;               // תיאור נוסף אם קיים ברשומה
     admissionThreshold?: number | string | null; // סף קבלה רשמי / סכם (למשל: 705, 640)
     programId?: string;                 // מזהה תוכנית
     sekemScore?: number | null;
     psychometricScore?: number | null;
     mathRequirement?: string | null;
     englishRequirement?: string | null;
     hebrewRequirement?: string | null;
     additionalConditions?: string | null;
     comments?: string | null;
     requiresPsychometric?: boolean;
     directBagrutEligible?: boolean;
     directBagrutMinAverage?: number | null;
     minPsychometricFloor?: number | null;
     prerequisitesJson?: string | null;
     registrationStatus?: string | null;
     url?: string;
     /** Which institution score the threshold is compared against (overrides the name-based guess). */
     relevantSekemType?: 'general' | 'engineering' | 'management' | 'technion' | 'quantitative' | 'psychometric';
     /** Threshold on the institution's own scale (e.g. HUJI weighted score 23.75), when sourced. */
     officialThreshold?: number | null;
     /** Where the threshold was taken from, and when. */
     thresholdSource?: string | null;
     thresholdUpdatedAt?: string | null;
     /** Admission routes published by the institution (set only by the official-data importers). */
     admissionRoutes?: AdmissionRoutes | null;
}

/**
 * Official admission routes besides the main threshold, as published by the institution.
 * Only these (never the seed's name-based guesses) may change the admission status.
 */
export interface AdmissionRoutes {
     /** A minimum general psychometric score required in addition to the main threshold ("ובנוסף"). */
     minPsychometric?: number;
     /** Admission on the general psychometric score alone ("או פסיכומטרי X", "קבלה לפי פסיכומטרי"). */
     psychometricOnlyMin?: number;
     /** Admission on the institution's bagrut average alone ("קבלה לפי בגרות בלבד"). */
     bagrutOnlyMin?: number;
     /** Admission without psychometric on per-subject bagrut conditions (Technion "בגרות מצוינת"). */
     excellentBagrut?: ExcellentBagrutRoute;
}

/** One bagrut condition: `count` distinct subjects from `subjects`, each at `minUnits`+ units and `minGrade`+. */
export interface SubjectCondition {
	subjects: string[];
	minUnits: number;
	minGrade: number;
	/** How many distinct subjects from the list must meet it (default 1). */
	count?: number;
}

/**
 * Per-subject admission route ("בגרות מצוינת"): every condition in `all`, plus at least one option of `anyOf`
 * (each option is a list of conditions that must all hold). A subject is used for one condition only.
 */
export interface ExcellentBagrutRoute {
	/** Minimum plain bagrut average — units-weighted, without bonuses ("ממוצע בגרות רגיל (ללא בונוסים)"). */
	rawAverageMin?: number;
	all?: SubjectCondition[];
	anyOf?: SubjectCondition[][];
	/** Math requirement met by any one alternative, e.g. 5u ≥ 70 or 4u ≥ 80. */
	mathAnyOf?: { minUnits: number; minGrade: number }[];
	/** Admission also requires an interview. */
	interview?: boolean;
	/** Short Hebrew summary of the conditions, as published. */
	summary: string;
}

export interface AcademicInstitution {
     id: string;
     name: string;                       // שם המוסד האקדמי (אוניברסיטה/מכללה)
     programs: AcademicDegree[];
}

