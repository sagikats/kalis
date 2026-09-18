/**
 * Validation utility for student matriculation (Bagrut) and psychometric inputs.
 * Enforces Israeli academic baseline requirements:
 * 1. All entered subjects must have non-zero, positive grades (1-100).
 * 2. Total units with valid grades must reach at least 20 (universal Israeli Bagrut certificate minimum).
 * 3. If the candidate states they took psychometric, a valid score (200-800) must be provided.
 */

export interface GradeValidationResult {
	isValid: boolean;
	missingBagrutCount: number;
	totalValidUnits: number;
	isPsychometricMissing: boolean;
	missingSubjectNames: string[];
	errorMessage?: string;
}

export function validateUserGrades(
	subjects: { name: string; units: number; grade: number | '' }[],
	hasTakenPsychometric: boolean,
	psychGeneral?: number | ''
): GradeValidationResult {
	if (!subjects || subjects.length === 0) {
		return {
			isValid: false,
			missingBagrutCount: 0,
			totalValidUnits: 0,
			isPsychometricMissing: false,
			missingSubjectNames: [],
			errorMessage: 'לא הוזנו מקצועות בגרות במערכת.'
		};
	}

	const missingSubjects = subjects.filter(
		(s) => s.grade === '' || s.grade === undefined || s.grade === null || Number(s.grade) <= 0
	);
	const validSubjects = subjects.filter(
		(s) => s.grade !== '' && s.grade !== undefined && s.grade !== null && Number(s.grade) > 0
	);
	const totalValidUnits = validSubjects.reduce((acc, s) => acc + (s.units || 0), 0);

	const isPsychMissing = Boolean(
		hasTakenPsychometric &&
			(!psychGeneral || Number(psychGeneral) < 200 || Number(psychGeneral) > 800)
	);

	if (missingSubjects.length > 0) {
		const names = missingSubjects.map((s) => s.name);
		return {
			isValid: false,
			missingBagrutCount: missingSubjects.length,
			totalValidUnits,
			isPsychometricMissing: isPsychMissing,
			missingSubjectNames: names,
			errorMessage: `חסר ציון ב-${missingSubjects.length} מקצועות בגרות (${names.slice(0, 3).join(', ')}${names.length > 3 ? ' ועוד' : ''}). יש להזין ציון לכל מקצוע ברשימה.`
		};
	}

	if (totalValidUnits < 20) {
		return {
			isValid: false,
			missingBagrutCount: 0,
			totalValidUnits,
			isPsychometricMissing: isPsychMissing,
			missingSubjectNames: [],
			errorMessage: `סך יחידות הבגרות שהוזנו (${totalValidUnits} יח״ל) אינו מגיע למינימום הנדרש לתעודת בגרות בישראל (20 יח״ל). יש להוסיף מקצוע הגברה או להרחיב יחידות לימוד.`
		};
	}

	if (isPsychMissing) {
		return {
			isValid: false,
			missingBagrutCount: 0,
			totalValidUnits,
			isPsychometricMissing: true,
			missingSubjectNames: [],
			errorMessage: 'סומן שנבחנת בפסיכומטרי אך לא הוזן ציון תקין (200–800). אנא הזן ציון או סמן "טרם נבחנתי".'
		};
	}

	return {
		isValid: true,
		missingBagrutCount: 0,
		totalValidUnits,
		isPsychometricMissing: false,
		missingSubjectNames: []
	};
}
