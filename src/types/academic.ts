import type { HaifaWeightingType } from '@/modules/calculators/haifa';
export interface AcademicDegree {
     id: string;
     fieldOfStudy: string;               // שם תחום ההשכלה / חוג
     degreeLevel: string;                // רמת התואר (תואר ראשון)
     description?: string;               // תיאור נוסף אם קיים ברשומה
     admissionThreshold?: number | string | null; // סף קבלה רשמי / סכם (למשל: 705, 640)
     programId?: string;                 // מזהה תוכנית
     /** The institution doesn't list this program for the coming year (hidden from selection). */
     notOffered?: { note: string; source: string };
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
     relevantSekemType?: 'general' | 'engineering' | 'management' | 'technion' | 'quantitative' | 'psychometric' | HaifaWeightingType;
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
export interface EntranceExamRoute {
     kind: 'architecture' | 'landscape';
     /** e.g. "בחינת הכניסה לארכיטקטורה". */
     examName: string;
     /** Top of the exam's score scale (architecture 0–140, landscape 0–123 — the official calculator). */
     scaleMax: number;
     /** URL — date. */
     source: string;
}

export interface AdmissionRoutes {
     /** A minimum general psychometric score required in addition to the main threshold ("ובנוסף"). */
     minPsychometric?: number;
     /** A minimum bagrut average (institution's own average) required in addition to the main threshold (Bar-Ilan "נדרשת עמידה בממוצע X בבגרות"). */
     minBagrutAverage?: number;
     /**
      * Medicine-style admission: meeting the threshold and conditions only invites the applicant to a screening stage
      * (MOR/מרק"ם, interviews, a computerized test); the final decision comes from that stage. Never "accepted".
      */
     screening?: {
          /** Short name of the stage, e.g. 'מבדקי מו"ר/מרק"ם'. */
          stage: string;
          /** The official description of the process (stages, weights, published cutoffs). */
          note: string;
          /** URL — date. */
          source: string;
     };
     /**
      * Admission by official conditions alone, with no sekem threshold (BGU mathematics: "מתמטיקה 87/5" or one of the
      * listed alternatives). `requirements` decides the status; `admissionThreshold` is null.
      */
     conditionsOnly?: ConditionsOnlyRoute;
     /**
      * Technion architecture / landscape architecture: the sekem has its own formula that includes an entrance exam
      * (admissions.technion.ac.il/calculator). The applicant's score can't be known before the exam, so the report shows
      * the exam score needed to reach the threshold instead of accepted / not accepted.
      */
     entranceExam?: EntranceExamRoute;
     /** Admission on the general psychometric score alone ("או פסיכומטרי X", "קבלה לפי פסיכומטרי"). */
     psychometricOnlyMin?: number;
     /** Admission on the institution's bagrut average alone ("קבלה לפי בגרות בלבד"). */
     bagrutOnlyMin?: number;
     /** Admission without psychometric on per-subject bagrut conditions (Technion "בגרות מצוינת"). */
     excellentBagrut?: ExcellentBagrutRoute;
     /** Ariel "סכם הנדסי": (math grade × units + physics grade × units + 3 × quantitative section) / 1.8. */
     engineeringScore?: EngineeringScoreRoute;
     /** Informational: admission to semester B after a semester at the continuing-education school (Technion "אפיק מקוצר"). Never changes the status. */
     shortTrack?: ShortTrackRoute;
     /** Informational: the Technion math classification exam replaces the psychometric in the sekem ("בגרות ובחינת סיווג במתמטיקה"). */
     mathExam?: MathExamRoute;
     /** Informational: sekem discount for applicants recognised as "ראויים לקידום" (Technion: 1–2 points). */
     promotionBonus?: number;
     /** Informational: Technion "גשר קבלה" — a math+physics semester adds up to `maxBonus` sekem points. */
     gesher?: GesherRoute;
     /** Informational: Technion "מתיכון לטכניון" — high-school students admitted on Technion math course grades. */
     fromHighSchool?: { note?: string };
     /**
      * Official per-program threshold requirements (e.g. TAU "דרישות הסף של התוכנית": ידע במתמטיקה, מקצוע ריאלי נוסף).
      * Each must be met on every admission route, except the bagrut-only route when `bagrutOnlyRequirements` is set.
      */
     requirements?: ProgramRequirement[];
     /** Requirements of the bagrut-only route when they differ from `requirements` (BGU publishes both). */
     bagrutOnlyRequirements?: ProgramRequirement[];
     /** Requirements of the psychometric-only route when they differ from `requirements` (Reichman publishes per route). */
     psychometricOnlyRequirements?: ProgramRequirement[];
     /**
      * Where the program's subject requirements were taken from (URL + date). Present = the program page was checked,
      * so the generic math/physics estimate no longer applies (even when `requirements` has no subject entry).
      */
     requirementsSource?: string;
}

export interface ConditionsOnlyRoute {
     /** The official text worth showing next to the status (quota notes, "both departments", exception policy). */
     note: string;
     /** URL — date. */
     source: string;
     /**
      * An official alternative that also needs a sekem minimum, which RequirementOption can't express
      * (BGU: "סכם כללי 700 + חשיבה כמותית 127 + מתמטיקה 5/75 או 4/85"). When the sekem and `requirement` hold, the
      * requirement with id `replaces` counts as met.
      */
     sekemAlternative?: {
          sekem: 'general' | 'quantitative';
          min: number;
          label: string;
          replaces: string;
          requirement: ProgramRequirement;
     };
}

/** One way to meet a program requirement: every condition holds, plus passing `exam` when set. */
export interface RequirementOption {
	bagrut?: SubjectCondition[];
	/** Psychometric section scores on the 50–150 scale. */
	psych?: { section: 'quant' | 'verbal' | 'english'; min: number }[];
	/** An institutional exam that must also be passed, e.g. "בחינת סיווג במתמטיקה בציון 75+". */
	exam?: string;
}

/** An official requirement met by any one of `anyOf`. */
export interface ProgramRequirement {
	id: string;
	/** e.g. "ידע במתמטיקה" */
	title: string;
	anyOf: RequirementOption[];
	/** Official alternatives the platform can't evaluate (academic courses, a prior degree), shown as text. */
	otherOptions?: string;
	/** Source of this requirement when it differs from the program's `requirementsSource` (e.g. a university-wide English rule). */
	source?: string;
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
/** Ariel "סכם הנדסי" — the score and the conditions for computing it, as published on the program page. */
export interface EngineeringScoreRoute {
     min: number;
     /** Minimum general psychometric score. */
     minPsychometric?: number;
     /** Minimum quantitative section (50–150). */
     minQuantSection: number;
     mathMinUnits: number;
     physicsMinUnits: number;
     /** Minimum grade in both math and physics (EE: 80). */
     minGrade?: number;
}

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

/** Technion "אפיק קבלה מקוצר": study semester A at the continuing-education school, then transfer on these grades. */
export interface ShortTrackRoute {
	/** Minimum average of the first semester's courses. */
	firstSemesterAverageMin: number;
	/** Minimum grade in every course. */
	minCourseGrade: number;
	/** Extra condition for this track, as published. */
	note?: string;
}

/**
 * Technion "קבלה על סמך בגרות ובחינת סיווג במתמטיקה": the exam score is converted to the psychometric scale
 * (round(score × slope + intercept)) and used in the regular sekem instead of the psychometric score.
 */
export interface MathExamRoute {
	/** Bagrut conditions to take part in the route. */
	eligibility: ExcellentBagrutRoute;
	/** Lowest exam score that is converted at all. */
	minExamScore: number;
	conversion: { slope: number; intercept: number };
	note?: string;
}

/**
 * Technion "גשר קבלה": for applicants up to `maxBonus` points below the threshold. A semester of math and physics
 * adds f(x) points, x = 0.6·math + 0.4·physics: 0 for x ≤ 65, (x − 65)·2/27 between, `maxBonus` for x ≥ 92.
 */
export interface GesherRoute {
	maxBonus: number;
	/** Bagrut conditions to take part (e.g. math 5u ≥ 70, English 4u+). */
	eligibility: ExcellentBagrutRoute;
}
