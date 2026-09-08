/**
 * 12 Benchmark Student Archetypes
 * Comprehensive evaluation profiles across all 8 Israeli universities
 * Subagent 2: Optimizer & Recommendation Engine
 */

import { StudentBenchmarkArchetype } from './types';
import { SubjectGradeRecord } from '../../db/schema';

function sub(name: string, units: number, grade: number, isMandatory: boolean = false): SubjectGradeRecord {
	return {
		id: `sub_${name}`,
		profileId: 'profile',
		subjectName: name,
		units,
		grade,
		isMandatory,
		isMath: name.includes('מתמטיקה'),
		isPhysics: name.includes('פיזיקה')
	};
}

export const BENCHMARK_ARCHETYPES: StudentBenchmarkArchetype[] = [
	// ---------------------------------------------------------------------------
	// A1: הריאלי הקרוב (STEM Near-Threshold)
	// ---------------------------------------------------------------------------
	{
		id: 'A1_stem_near',
		name: 'דניאל - הריאלי הקרוב (מדעי המחשב בטכניון)',
		description: 'בעל בגרות 108.5 ופסיכומטרי 675. פער קטן לסף 89.0 בטכניון.',
		targetProgram: {
			id: 'prog_technion_cs',
			institutionId: 'technion',
			institutionName: 'הטכניון - מכון טכנולוגי לישראל',
			facultyName: 'מדעי המחשב',
			name: 'מדעי המחשב',
			fieldOfStudy: 'מדעי המחשב',
			degreeLevel: 'bachelor',
			minSekemThreshold: 89.0,
			relevantSekemType: 'technion',
			directBagrutEligible: false,
			prerequisites: { mustHavePsychometric: true, minMathUnits: 5 },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a1',
			estimatedBagrutAverage: 108.5,
			bagrutSubjects: [
				sub('מתמטיקה', 5, 84, true),
				sub('פיזיקה', 5, 86, false),
				sub('אנגלית', 5, 90, true),
				sub('תנ״ך', 2, 82, true),
				sub('ספרות', 2, 80, true),
				sub('היסטוריה', 2, 82, true),
				sub('אזרחות', 2, 82, true),
				sub('הבעה עברית', 2, 84, true)
			],
			mathUnits: 5,
			mathGrade: 84,
			physicsUnits: 5,
			physicsGrade: 86,
			psychometricGeneral: 675,
			psychometricQuant: 138,
			psychometricVerbal: 126,
			psychometricEnglish: 135,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a1',
			psychExperience: 'once',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'quant',
			psychStrongestSections: ['quant'],
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			dominantSubject: 'מתמטיקה',
			maxAllowedEffortHours: 250
		}
	},

	// ---------------------------------------------------------------------------
	// A2: ההומני בעל החשיבה המילולית הגבוהה (High Verbal Humanities Direct Bagrut)
	// ---------------------------------------------------------------------------
	{
		id: 'A2_high_verbal_direct',
		name: 'מיכל - חשיבה מילולית גבוהה (פסיכולוגיה בעברית)',
		description: 'מילולי 142 ואנגלית 138. ללא פסיכומטרי מלא, זכאית לקבלה ישירה עם בגרויות 106.5+.',
		targetProgram: {
			id: 'prog_huji_psych',
			institutionId: 'huji',
			institutionName: 'האוניברסיטה העברית בירושלים',
			facultyName: 'מדעי החברה',
			name: 'פסיכולוגיה ומדעי הקוגניציה',
			fieldOfStudy: 'פסיכולוגיה',
			degreeLevel: 'bachelor',
			minSekemThreshold: 680,
			relevantSekemType: 'general',
			directBagrutEligible: true,
			directBagrutMinAverage: 106.5,
			prerequisites: { mustHavePsychometric: false },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a2',
			estimatedBagrutAverage: 104.2,
			bagrutSubjects: [
				sub('מתמטיקה', 4, 82, true),
				sub('אנגלית', 5, 94, true),
				sub('ספרות', 2, 88, true),
				sub('תנ״ך', 2, 86, true),
				sub('היסטוריה', 2, 88, true),
				sub('אזרחות', 2, 90, true),
				sub('מדעי החברה', 5, 92, false),
				sub('הבעה עברית', 2, 92, true)
			],
			mathUnits: 4,
			mathGrade: 82,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 0,
			psychometricQuant: 0,
			psychometricVerbal: 142,
			psychometricEnglish: 138,
			hasTakenPsychometric: false,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a2',
			psychExperience: 'never',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'verbal',
			psychStrongestSections: ['verbal', 'english'],
			learningOrientation: 'humanities',
			learningStrength: 'memory_retention',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			mustHaveDirectBagrut: true,
			mustPreferBagrutOverPsych: true
		}
	},

	// ---------------------------------------------------------------------------
	// A3: העובד המוגבל בזמן (Limited Availability Worker)
	// ---------------------------------------------------------------------------
	{
		id: 'A3_limited_hours_worker',
		name: 'יוסי - עובד במשרה מלאה (הנדסת תעשייה וניהול בבן-גוריון)',
		description: 'זמינות מוגבלת של עד 15 שעות שבועיות בלבד. דורש מסלול ללא עומס מתמטי כבד.',
		targetProgram: {
			id: 'prog_bgu_iem',
			institutionId: 'bgu',
			institutionName: 'אוניברסיטת בן-גוריון בנגב',
			facultyName: 'הנדסה',
			name: 'הנדסת תעשייה וניהול',
			fieldOfStudy: 'הנדסת תעשייה וניהול',
			degreeLevel: 'bachelor',
			minSekemThreshold: 540,
			relevantSekemType: 'engineering',
			directBagrutEligible: false,
			prerequisites: { mustHavePsychometric: true, minMathUnits: 5 },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a3',
			estimatedBagrutAverage: 102.0,
			bagrutSubjects: [
				sub('מתמטיקה', 5, 80, true),
				sub('אנגלית', 5, 88, true),
				sub('פיזיקה', 5, 78, false),
				sub('תנ״ך', 2, 82, true),
				sub('ספרות', 2, 80, true),
				sub('אזרחות', 2, 84, true),
				sub('היסטוריה', 2, 82, true),
				sub('הבעה', 2, 85, true)
			],
			mathUnits: 5,
			mathGrade: 80,
			physicsUnits: 5,
			physicsGrade: 78,
			psychometricGeneral: 620,
			psychometricQuant: 125,
			psychometricVerbal: 120,
			psychometricEnglish: 128,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a3',
			psychExperience: 'once',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'balanced',
			psychStrongestSections: ['balanced'],
			learningOrientation: 'flexible',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'limited_under_15',
			targetTimeline: 'flexible',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			maxAllowedEffortHours: 350
		}
	},

	// ---------------------------------------------------------------------------
	// A4: פער קטן - מקצועות חובה (Low Core Grades Quick-Wins)
	// ---------------------------------------------------------------------------
	{
		id: 'A4_core_quickwins',
		name: 'שירה - מקצועות חובה נמוכים (מנהל עסקים בתל אביב)',
		description: 'ציוני ליבה נמוכים (תנ״ך 72, ספרות 74). Quick-Wins של 2 יח״ל מעלים ממוצע במינימום שעות.',
		targetProgram: {
			id: 'prog_tau_management',
			institutionId: 'tau',
			institutionName: 'אוניברסיטת תל אביב',
			facultyName: 'ניהול',
			name: 'ניהול וכלכלה',
			fieldOfStudy: 'ניהול',
			degreeLevel: 'bachelor',
			minSekemThreshold: 640,
			relevantSekemType: 'general',
			directBagrutEligible: true,
			directBagrutMinAverage: 105.0,
			prerequisites: { mustHavePsychometric: false },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a4',
			estimatedBagrutAverage: 98.5,
			bagrutSubjects: [
				sub('מתמטיקה', 4, 85, true),
				sub('אנגלית', 5, 90, true),
				sub('תנ״ך', 2, 72, true),
				sub('ספרות', 2, 74, true),
				sub('היסטוריה', 2, 75, true),
				sub('אזרחות', 2, 78, true),
				sub('ערבית', 5, 92, false),
				sub('הבעה', 2, 82, true)
			],
			mathUnits: 4,
			mathGrade: 85,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 625,
			psychometricQuant: 122,
			psychometricVerbal: 126,
			psychometricEnglish: 132,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a4',
			psychExperience: 'once',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'balanced',
			psychStrongestSections: ['balanced'],
			learningOrientation: 'humanities',
			learningStrength: 'memory_retention',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			maxAllowedEffortHours: 200
		}
	},

	// ---------------------------------------------------------------------------
	// A5: פסיכומטרי תקוע מועד שלישי (3rd Attempt Psychometric Plateau)
	// ---------------------------------------------------------------------------
	{
		id: 'A5_psych_plateau_third',
		name: 'עומר - פסיכומטרי תקוע (מדעי הנתונים בבר-אילן)',
		description: 'ניגש פעמיים, תקוע על 615. המערכת חייבת להעדיף מנופי בגרות על פני מועד פסיכומטרי נוסף.',
		targetProgram: {
			id: 'prog_biu_ds',
			institutionId: 'bar_ilan',
			institutionName: 'אוניברסיטת בר-אילן',
			facultyName: 'מדעים מדויקים',
			name: 'מדעי הנתונים',
			fieldOfStudy: 'מדעי הנתונים',
			degreeLevel: 'bachelor',
			minSekemThreshold: 665,
			relevantSekemType: 'general',
			directBagrutEligible: true,
			directBagrutMinAverage: 104.0,
			prerequisites: { mustHavePsychometric: false },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a5',
			estimatedBagrutAverage: 101.5,
			bagrutSubjects: [
				sub('מתמטיקה', 4, 88, true),
				sub('אנגלית', 5, 88, true),
				sub('מדעי המחשב', 5, 86, false),
				sub('תנ״ך', 2, 82, true),
				sub('ספרות', 2, 80, true),
				sub('היסטוריה', 2, 82, true),
				sub('אזרחות', 2, 84, true),
				sub('הבעה', 2, 85, true)
			],
			mathUnits: 4,
			mathGrade: 88,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 615,
			psychometricQuant: 128,
			psychometricVerbal: 118,
			psychometricEnglish: 125,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a5',
			psychExperience: 'multiple',
			psychFeeling: 'low_confidence',
			psychStrongestSection: 'quant',
			psychStrongestSections: ['quant'],
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'flexible',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			mustPreferBagrutOverPsych: true
		}
	},

	// ---------------------------------------------------------------------------
	// A6: חזק באנגלית ובמילולי, חלש בכמותי (Strong Verbal & English)
	// ---------------------------------------------------------------------------
	{
		id: 'A6_verbal_english_focus',
		name: 'תמר - חוזק מילולי ואנגלית מובהק (משפטים באוניברסיטת תל אביב)',
		description: 'מילולי 138 ואנגלית 142 (פטור מלא). מינוף ציון התאמה רב-תחומי באת״א.',
		targetProgram: {
			id: 'prog_tau_law',
			institutionId: 'tau',
			institutionName: 'אוניברסיטת תל אביב',
			facultyName: 'משפטים',
			name: 'משפטים',
			fieldOfStudy: 'משפטים',
			degreeLevel: 'bachelor',
			minSekemThreshold: 672,
			relevantSekemType: 'general',
			directBagrutEligible: false,
			prerequisites: { mustHavePsychometric: true },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a6',
			estimatedBagrutAverage: 103.0,
			bagrutSubjects: [
				sub('מתמטיקה', 4, 78, true),
				sub('אנגלית', 5, 96, true),
				sub('היסטוריה', 2, 90, true),
				sub('אזרחות', 2, 92, true),
				sub('ספרות', 2, 88, true),
				sub('תנ״ך', 2, 86, true),
				sub('קולנוע', 5, 92, false),
				sub('הבעה', 2, 90, true)
			],
			mathUnits: 4,
			mathGrade: 78,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 645,
			psychometricQuant: 110,
			psychometricVerbal: 138,
			psychometricEnglish: 142,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a6',
			psychExperience: 'once',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'verbal',
			psychStrongestSections: ['verbal', 'english'],
			learningOrientation: 'humanities',
			learningStrength: 'memory_retention',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			maxAllowedEffortHours: 220
		}
	},

	// ---------------------------------------------------------------------------
	// A7: בוגר 3 יח״ל מתמטיקה (3u Math STEM Hopeful)
	// ---------------------------------------------------------------------------
	{
		id: 'A7_math_3u_stem',
		name: 'אביב - בוגר 3 יח״ל מתמטיקה (הנדסת תוכנה באריאל)',
		description: 'מתמטיקה 3 יח״ל (ציון 92). חייב שדרוג ל-4 או 5 יח״ל כתנאי סף פקולטטי.',
		targetProgram: {
			id: 'prog_ariel_se',
			institutionId: 'ariel',
			institutionName: 'אוניברסיטת אריאל בשומרון',
			facultyName: 'הנדסה',
			name: 'הנדסת תוכנה',
			fieldOfStudy: 'הנדסת תוכנה',
			degreeLevel: 'bachelor',
			minSekemThreshold: 620,
			relevantSekemType: 'engineering',
			directBagrutEligible: false,
			prerequisites: { minMathUnits: 4, mustHavePsychometric: false },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a7',
			estimatedBagrutAverage: 96.0,
			bagrutSubjects: [
				sub('מתמטיקה', 3, 92, true),
				sub('אנגלית', 5, 85, true),
				sub('תנ״ך', 2, 82, true),
				sub('ספרות', 2, 80, true),
				sub('היסטוריה', 2, 82, true),
				sub('אזרחות', 2, 84, true),
				sub('ביולוגיה', 5, 86, false),
				sub('הבעה', 2, 85, true)
			],
			mathUnits: 3,
			mathGrade: 92,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 590,
			psychometricQuant: 122,
			psychometricVerbal: 120,
			psychometricEnglish: 122,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a7',
			psychExperience: 'once',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'quant',
			psychStrongestSections: ['quant'],
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'flexible',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			dominantSubject: 'מתמטיקה'
		}
	},

	// ---------------------------------------------------------------------------
	// A8: פער ענק - מסלול ארוך טווח + מכינה (Huge Gap - Long Term Track + Mechina)
	// ---------------------------------------------------------------------------
	{
		id: 'A8_huge_gap_long_term',
		name: 'רועי - פער ענק (הנדסת חשמל בטכניון)',
		description: 'פער של 16 נקודות סכם בטכניון. דורש מסלול ארוך טווח שנתי מרובה שלבים ובמקביל המלצה על מכינה.',
		targetProgram: {
			id: 'prog_technion_ee',
			institutionId: 'technion',
			institutionName: 'הטכניון - מכון טכנולוגי לישראל',
			facultyName: 'הנדסת חשמל',
			name: 'הנדסת חשמל',
			fieldOfStudy: 'הנדסת חשמל',
			degreeLevel: 'bachelor',
			minSekemThreshold: 87.5,
			relevantSekemType: 'technion',
			directBagrutEligible: false,
			prerequisites: { minMathUnits: 5, mustHavePsychometric: true },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a8',
			estimatedBagrutAverage: 92.0,
			bagrutSubjects: [
				sub('מתמטיקה', 4, 75, true),
				sub('אנגלית', 4, 78, true),
				sub('תנ״ך', 2, 70, true),
				sub('ספרות', 2, 72, true),
				sub('היסטוריה', 2, 70, true),
				sub('אזרחות', 2, 72, true),
				sub('גיאוגרפיה', 2, 75, false),
				sub('הבעה', 2, 74, true)
			],
			mathUnits: 4,
			mathGrade: 75,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 560,
			psychometricQuant: 112,
			psychometricVerbal: 110,
			psychometricEnglish: 115,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a8',
			psychExperience: 'once',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'quant',
			psychStrongestSections: ['quant'],
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'full_30_plus',
			targetTimeline: 'flexible',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			mustHaveLongTermTrack: true,
			mustHaveMechina: true
		}
	},

	// ---------------------------------------------------------------------------
	// A9: מועמד רפואה תחרותי (Medicine Candidate)
	// ---------------------------------------------------------------------------
	{
		id: 'A9_medicine_elite',
		name: 'נועה - מועמדת לרפואה (האוניברסיטה העברית)',
		description: 'סף 735+ ובגרות 112+. בדיקת סבירות ואי-חריגה מתקרת הפוטנציאל.',
		targetProgram: {
			id: 'prog_huji_med',
			institutionId: 'huji',
			institutionName: 'האוניברסיטה העברית בירושלים',
			facultyName: 'רפואה',
			name: 'רפואה כללית',
			fieldOfStudy: 'רפואה',
			degreeLevel: 'bachelor',
			minSekemThreshold: 735,
			relevantSekemType: 'general',
			directBagrutEligible: false,
			prerequisites: { mustHavePsychometric: true },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a9',
			estimatedBagrutAverage: 111.5,
			bagrutSubjects: [
				sub('מתמטיקה', 5, 94, true),
				sub('אנגלית', 5, 96, true),
				sub('כימיה', 5, 95, false),
				sub('ביולוגיה', 5, 96, false),
				sub('תנ״ך', 2, 88, true),
				sub('ספרות', 2, 86, true),
				sub('אזרחות', 2, 90, true),
				sub('היסטוריה', 2, 90, true),
				sub('הבעה', 2, 92, true)
			],
			mathUnits: 5,
			mathGrade: 94,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 715,
			psychometricQuant: 144,
			psychometricVerbal: 140,
			psychometricEnglish: 146,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a9',
			psychExperience: 'multiple',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'balanced',
			psychStrongestSections: ['balanced'],
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'full_30_plus',
			targetTimeline: 'immediate_october',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			maxAllowedEffortHours: 180
		}
	},

	// ---------------------------------------------------------------------------
	// A10: מועמד חיפה קבלה ישירה (University of Haifa Direct Bagrut)
	// ---------------------------------------------------------------------------
	{
		id: 'A10_haifa_direct_bagrut',
		name: 'גיא - קבלה ישירה באוניברסיטת חיפה (עבודה סוציאלית)',
		description: 'בגרות 101.0, זכאי לקבלה ישירה בחיפה ללא צורך בפסיכומטרי.',
		targetProgram: {
			id: 'prog_haifa_sw',
			institutionId: 'haifa',
			institutionName: 'אוניברסיטת חיפה',
			facultyName: 'מדעי הרווחה והבריאות',
			name: 'עבודה סוציאלית',
			fieldOfStudy: 'עבודה סוציאלית',
			degreeLevel: 'bachelor',
			minSekemThreshold: 620,
			relevantSekemType: 'general',
			directBagrutEligible: true,
			directBagrutMinAverage: 100.0,
			prerequisites: { mustHavePsychometric: false },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a10',
			estimatedBagrutAverage: 101.0,
			bagrutSubjects: [
				sub('מתמטיקה', 4, 80, true),
				sub('אנגלית', 5, 88, true),
				sub('פסיכולוגיה', 5, 90, false),
				sub('תנ״ך', 2, 84, true),
				sub('ספרות', 2, 82, true),
				sub('היסטוריה', 2, 84, true),
				sub('אזרחות', 2, 86, true),
				sub('הבעה', 2, 88, true)
			],
			mathUnits: 4,
			mathGrade: 80,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 0,
			psychometricQuant: 0,
			psychometricVerbal: 0,
			psychometricEnglish: 0,
			hasTakenPsychometric: false,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a10',
			psychExperience: 'never',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'balanced',
			psychStrongestSections: ['balanced'],
			learningOrientation: 'humanities',
			learningStrength: 'memory_retention',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			mustHaveDirectBagrut: true
		}
	},

	// ---------------------------------------------------------------------------
	// A11: מועמד רייכמן (Reichman University Candidate)
	// ---------------------------------------------------------------------------
	{
		id: 'A11_reichman_business',
		name: 'דנה - מנהל עסקים ויזמות באוניברסיטת רייכמן',
		description: 'בגרות 102.5. רייכמן מעניקה קבלה ישירה על בסיס בגרות וראיון.',
		targetProgram: {
			id: 'prog_reichman_business',
			institutionId: 'reichman',
			institutionName: 'אוניברסיטת רייכמן',
			facultyName: 'בית ספר אריסון למנהל עסקים',
			name: 'מנהל עסקים',
			fieldOfStudy: 'מנהל עסקים',
			degreeLevel: 'bachelor',
			minSekemThreshold: 100,
			relevantSekemType: 'general',
			directBagrutEligible: true,
			directBagrutMinAverage: 100.0,
			prerequisites: { mustHavePsychometric: false },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a11',
			estimatedBagrutAverage: 102.5,
			bagrutSubjects: [
				sub('מתמטיקה', 4, 85, true),
				sub('אנגלית', 5, 92, true),
				sub('כלכלה', 5, 90, false),
				sub('תנ״ך', 2, 84, true),
				sub('ספרות', 2, 82, true),
				sub('היסטוריה', 2, 84, true),
				sub('אזרחות', 2, 86, true),
				sub('הבעה', 2, 88, true)
			],
			mathUnits: 4,
			mathGrade: 85,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 0,
			psychometricQuant: 0,
			psychometricVerbal: 0,
			psychometricEnglish: 0,
			hasTakenPsychometric: false,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a11',
			psychExperience: 'never',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'balanced',
			psychStrongestSections: ['balanced'],
			learningOrientation: 'flexible',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			mustHaveDirectBagrut: true
		}
	},

	// ---------------------------------------------------------------------------
	// A12: מבחן היתירות המיקרו-שיפורי (Micro-Improvement Pruning Test)
	// ---------------------------------------------------------------------------
	{
		id: 'A12_micro_pruning_test',
		name: 'אלון - מועמד לכלכלה (מבחן צמצום בחינה עודפת)',
		description: 'פער של 0.8 נקודות סכם בלבד. אסור להמליץ על בחינת בגרות נוספת כשתוספת 2 נקודות במתמטיקה 5 מספיקה.',
		targetProgram: {
			id: 'prog_bgu_econ',
			institutionId: 'bgu',
			institutionName: 'אוניברסיטת בן-גוריון בנגב',
			facultyName: 'מדעי הרוח והחברה',
			name: 'כלכלה וניהול',
			fieldOfStudy: 'כלכלה',
			degreeLevel: 'bachelor',
			minSekemThreshold: 672,
			relevantSekemType: 'management',
			directBagrutEligible: true,
			directBagrutMinAverage: 104.0,
			prerequisites: { mustHavePsychometric: false },
			createdAt: new Date(),
			updatedAt: new Date()
		},
		profile: {
			userId: 'user_a12',
			estimatedBagrutAverage: 103.2,
			bagrutSubjects: [
				sub('מתמטיקה', 5, 86, true),
				sub('אנגלית', 5, 88, true),
				sub('מדעי החברה', 5, 90, false),
				sub('תנ״ך', 2, 84, true),
				sub('ספרות', 2, 82, true),
				sub('היסטוריה', 2, 84, true),
				sub('אזרחות', 2, 84, true),
				sub('הבעה', 2, 86, true)
			],
			mathUnits: 5,
			mathGrade: 86,
			physicsUnits: 0,
			physicsGrade: 0,
			psychometricGeneral: 630,
			psychometricQuant: 130,
			psychometricVerbal: 122,
			psychometricEnglish: 128,
			hasTakenPsychometric: true,
			updatedAt: new Date()
		},
		preferences: {
			userId: 'user_a12',
			psychExperience: 'once',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'quant',
			psychStrongestSections: ['quant'],
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october',
			updatedAt: new Date()
		},
		expectedCharacteristics: {
			mustPruneOverkill: true
		}
	}
];
