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
     registrationStatus?: string | null;
     url?: string;
}

export interface AcademicInstitution {
     id: string;
     name: string;                       // שם המוסד האקדמי (אוניברסיטה/מכללה)
     programs: AcademicDegree[];
}

