export interface AcademicDegree {
     id: string;
     fieldOfStudy: string; // שם תחום ההשכלה / חוג
     degreeLevel: string;  // רמת התואר (תואר ראשון)
     description?: string; // תיאור נוסף אם קיים ברשומה
}

export interface AcademicInstitution {
     id: string;
     name: string;         // שם המוסד האקדמי (אוניברסיטה/מכללה)
     programs: AcademicDegree[];
}
