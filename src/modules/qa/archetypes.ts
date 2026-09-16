/**
 * Subagent 5: Automated QA & Track Quality Auditor
 * Standard Benchmark Suite of 24 Diverse Student Archetypes Across All 8 Universities
 */

import { StudentArchetype } from './types';
import { UserPreferencesQuestionnaire } from '../../utils/analysis/trackGenerator';

const defaultPref: UserPreferencesQuestionnaire = {
	psychExperience: 'never',
	learningOrientation: 'flexible',
	learningStrength: 'analytical_quick',
	weeklyAvailabilityHours: 'full_30_plus',
	targetTimeline: 'flexible'
};

export const BENCHMARK_ARCHETYPES: StudentArchetype[] = [
	// =========================================================================
	// 1. BAR-ILAN UNIVERSITY (BIU)
	// =========================================================================
	{
		id: 'adel_yarden_biu_math',
		name: 'אדל ירדן — מתמטיקה בבר-אילן',
		description: 'ממוצע בגרות מצטיין 110.86, 5 יח״ל מתמטיקה 96, ללא פסיכומטרי. זכאית לקבלה ישירה מיידית!',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 96 },
				{ name: 'אנגלית', units: 5, grade: 80 },
				{ name: 'כימיה', units: 5, grade: 98 },
				{ name: 'תלמוד', units: 5, grade: 94 },
				{ name: 'מדעי החברה', units: 5, grade: 96 },
				{ name: 'אזרחות', units: 2, grade: 88 },
				{ name: 'תנ״ך', units: 2, grade: 84 },
				{ name: 'ספרות', units: 2, grade: 82 },
				{ name: 'היסטוריה', units: 2, grade: 85 },
				{ name: 'עברית', units: 2, grade: 86 }
			],
			psychometricGeneral: 0,
			mathGrade: 96,
			mathUnits: 5,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 110.86
		},
		preferences: { ...defaultPref, weeklyAvailabilityHours: 'full_30_plus' },
		targetProgramId: 'prog-inst-4-49',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			expectedDirectBagrut: true,
			maxAllowedExamsTrack1: 0 // MUST be 0 exams!
		}
	},
	{
		id: 'omer_biu_datascience_stuck_psych',
		name: 'עומר — מדעי הנתונים בבר-אילן',
		description: 'פסיכומטרי תקוע על 640 אחרי 3 ניסיונות. זקוק למנופי בגרות כדי לא לקפוץ מעל 660.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 85 },
				{ name: 'אנגלית', units: 5, grade: 88 },
				{ name: 'מדעי המחשב', units: 5, grade: 86 },
				{ name: 'תנ״ך', units: 2, grade: 72 },
				{ name: 'ספרות', units: 2, grade: 70 },
				{ name: 'היסטוריה', units: 2, grade: 74 },
				{ name: 'אזרחות', units: 2, grade: 78 }
			],
			psychometricGeneral: 640,
			mathGrade: 85,
			mathUnits: 5,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 104.2
		},
		preferences: {
			...defaultPref,
			psychExperience: 'multiple',
			psychFeeling: 'reached_ceiling',
			weeklyAvailabilityHours: 'part_15_25'
		},
		targetProgramId: 'prog-inst-4-15',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			allowedPsychCeiling: 660,
			maxAllowedExamsTrack2: 3
		}
	},

	// =========================================================================
	// 2. TEL AVIV UNIVERSITY (TAU)
	// =========================================================================
	{
		id: 'adel_yarden_tau_ee',
		name: 'אדל ירדן — הנדסת חשמל בתל אביב',
		description: 'ממוצע 110.86, חסרת פיזיקה. סכם יעד 710.0. חובה לבדוק אי-קיום פערי סכם 710/720 וציון דרישת פיזיקה.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 96 },
				{ name: 'אנגלית', units: 5, grade: 80 },
				{ name: 'כימיה', units: 5, grade: 98 },
				{ name: 'תלמוד', units: 5, grade: 94 },
				{ name: 'מדעי החברה', units: 5, grade: 96 },
				{ name: 'אזרחות', units: 2, grade: 88 },
				{ name: 'תנ״ך', units: 2, grade: 84 },
				{ name: 'ספרות', units: 2, grade: 82 },
				{ name: 'היסטוריה', units: 2, grade: 85 },
				{ name: 'עברית', units: 2, grade: 86 }
			],
			psychometricGeneral: 0,
			mathGrade: 96,
			mathUnits: 5,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 110.86
		},
		preferences: { ...defaultPref, weeklyAvailabilityHours: 'full_30_plus' },
		targetProgramId: 'prog-tau-0512-74',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			requiresPhysicsPrerequisiteNotice: true
		}
	},
	{
		id: 'daniel_tau_cs',
		name: 'דניאל — מדעי המחשב בתל אביב',
		description: 'מועמד חזק (בגרות 106.2, פסיכומטרי 660). זקוק לכיסוי פער מול סף 735.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 88 },
				{ name: 'אנגלית', units: 5, grade: 90 },
				{ name: 'מדעי המחשב', units: 5, grade: 92 },
				{ name: 'פיזיקה', units: 5, grade: 86 },
				{ name: 'תנ״ך', units: 2, grade: 75 },
				{ name: 'ספרות', units: 2, grade: 72 },
				{ name: 'היסטוריה', units: 2, grade: 76 },
				{ name: 'אזרחות', units: 2, grade: 80 }
			],
			psychometricGeneral: 660,
			mathGrade: 88,
			mathUnits: 5,
			physicsUnits: 5,
			physicsGrade: 86,
			bagrutAverage: 106.2
		},
		preferences: defaultPref,
		targetProgramId: 'prog-tau-0368-2',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			maxAllowedExamsTrack1: 2
		}
	},
	{
		id: 'shira_tau_business_low_core',
		name: 'שירה — ניהול ומנהל עסקים בתל אביב',
		description: 'ציוני חובה נמוכים (תנ״ך 65, ספרות 68). ROI עצום על שדרוג מקצועות 2 יח״ל.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 74 },
				{ name: 'אנגלית', units: 5, grade: 84 },
				{ name: 'מדעי החברה', units: 5, grade: 85 },
				{ name: 'תנ״ך', units: 2, grade: 65 },
				{ name: 'ספרות', units: 2, grade: 68 },
				{ name: 'היסטוריה', units: 2, grade: 72 },
				{ name: 'אזרחות', units: 2, grade: 70 }
			],
			psychometricGeneral: 610,
			mathGrade: 74,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 98.4
		},
		preferences: { ...defaultPref, learningOrientation: 'humanities' },
		targetProgramId: 'prog-tau-1211-1',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			prohibitedSubjectLevers: ['פיזיקה']
		}
	},
	{
		id: 'tamar_tau_law_high_verbal',
		name: 'תמר — משפטים בתל אביב',
		description: 'כישורים מילוליים מעולים (ספרות 5 יח״ל 95, פטור מאנגלית 144, פסיכומטרי מילולי גבוה).',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 80 },
				{ name: 'אנגלית', units: 5, grade: 94 },
				{ name: 'ספרות', units: 5, grade: 95 },
				{ name: 'היסטוריה', units: 5, grade: 92 },
				{ name: 'תנ״ך', units: 2, grade: 86 },
				{ name: 'אזרחות', units: 2, grade: 90 }
			],
			psychometricGeneral: 645,
			mathGrade: 80,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 107.5
		},
		preferences: { ...defaultPref, psychStrongestSection: 'verbal' },
		targetProgramId: 'prog-tau-1411-1',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			maxAllowedExamsTrack1: 1
		}
	},

	// =========================================================================
	// 3. TECHNION (טכניון)
	// =========================================================================
	{
		id: 'chen_katz_technion_cs',
		name: 'חן כץ — מדעי המחשב בטכניון',
		description: 'מועמד חזק (בגרות 108.5, פסיכומטרי 680). סף טכניון ~91.00. דורש עמידה מלאה במשוואת השיפוע.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 90 },
				{ name: 'אנגלית', units: 5, grade: 88 },
				{ name: 'פיזיקה', units: 5, grade: 90 },
				{ name: 'מדעי המחשב', units: 5, grade: 92 },
				{ name: 'תנ״ך', units: 2, grade: 78 },
				{ name: 'ספרות', units: 2, grade: 76 },
				{ name: 'היסטוריה', units: 2, grade: 80 },
				{ name: 'אזרחות', units: 2, grade: 84 }
			],
			psychometricGeneral: 680,
			mathGrade: 90,
			mathUnits: 5,
			physicsUnits: 5,
			physicsGrade: 90,
			bagrutAverage: 108.5
		},
		preferences: defaultPref,
		targetProgramId: 'prog-tech-234-1',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			maxAllowedExamsTrack1: 2,
			maxAllowedExamsTrack2: 3
		}
	},
	{
		id: 'ron_technion_mech',
		name: 'רון — הנדסת מכונות בטכניון',
		description: 'סף קבלה 84.00, מועמד גבולי (בגרות 103, פסיכומטרי 650).',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 82 },
				{ name: 'אנגלית', units: 5, grade: 80 },
				{ name: 'פיזיקה', units: 5, grade: 80 },
				{ name: 'כימיה', units: 5, grade: 85 },
				{ name: 'תנ״ך', units: 2, grade: 72 },
				{ name: 'ספרות', units: 2, grade: 70 },
				{ name: 'היסטוריה', units: 2, grade: 74 },
				{ name: 'אזרחות', units: 2, grade: 78 }
			],
			psychometricGeneral: 650,
			mathGrade: 82,
			mathUnits: 5,
			physicsUnits: 5,
			physicsGrade: 80,
			bagrutAverage: 103.0
		},
		preferences: defaultPref,
		targetProgramId: 'prog-tech-032-1',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},

	// =========================================================================
	// 4. HEBREW UNIVERSITY OF JERUSALEM (HUJI)
	// =========================================================================
	{
		id: 'noa_huji_medicine',
		name: 'נועה — רפואה באוניברסיטה העברית',
		description: 'בגרות 113.5, פסיכומטרי 710. סף מעבר 740+. רצפת פסיכומטרי קשיחה של 700.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 98 },
				{ name: 'אנגלית', units: 5, grade: 96 },
				{ name: 'ביולוגיה', units: 5, grade: 98 },
				{ name: 'כימיה', units: 5, grade: 96 },
				{ name: 'תנ״ך', units: 2, grade: 90 },
				{ name: 'ספרות', units: 2, grade: 88 },
				{ name: 'היסטוריה', units: 2, grade: 92 },
				{ name: 'אזרחות', units: 2, grade: 90 }
			],
			psychometricGeneral: 710,
			mathGrade: 98,
			mathUnits: 5,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 113.5
		},
		preferences: defaultPref,
		targetProgramId: 'prog-huji-med-1',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			allowedPsychCeiling: 760
		}
	},
	{
		id: 'maya_huji_psychology_direct',
		name: 'מאיה — פסיכולוגיה בעברית',
		description: 'בגרות 108.2, ללא פסיכומטרי. זכאית מלאה לקבלה ישירה על סמך בגרות 106.5+!',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 88 },
				{ name: 'אנגלית', units: 5, grade: 92 },
				{ name: 'מדעי החברה', units: 5, grade: 95 },
				{ name: 'ספרות', units: 5, grade: 94 },
				{ name: 'תנ״ך', units: 2, grade: 88 },
				{ name: 'היסטוריה', units: 2, grade: 90 },
				{ name: 'אזרחות', units: 2, grade: 92 }
			],
			psychometricGeneral: 0,
			mathGrade: 88,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 108.2
		},
		preferences: { ...defaultPref, weeklyAvailabilityHours: 'full_30_plus' },
		targetProgramId: 'prog-inst-1-95',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			expectedDirectBagrut: true,
			maxAllowedExamsTrack1: 0
		}
	},

	// =========================================================================
	// 5. BEN-GURION UNIVERSITY (BGU)
	// =========================================================================
	{
		id: 'yossi_bgu_industrial_fulltime',
		name: 'יוסי — הנדסת מחשבים בבן-גוריון',
		description: 'עובד במשרה מלאה (מוגבל ל-12 שעות שבועיות). זקוק למסלול ממוקד ללא עומס יתר.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 82 },
				{ name: 'אנגלית', units: 5, grade: 80 },
				{ name: 'מדעי המחשב', units: 5, grade: 85 },
				{ name: 'תנ״ך', units: 2, grade: 76 },
				{ name: 'ספרות', units: 2, grade: 74 },
				{ name: 'היסטוריה', units: 2, grade: 78 },
				{ name: 'אזרחות', units: 2, grade: 80 }
			],
			psychometricGeneral: 620,
			mathGrade: 82,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 100.5
		},
		preferences: {
			...defaultPref,
			weeklyAvailabilityHours: 'limited_under_15'
		},
		targetProgramId: 'prog-bgu-178',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			maxAllowedExamsTrack1: 2
		}
	},
	{
		id: 'itamar_bgu_cs',
		name: 'איתמר — מדעי המחשב בבן-גוריון',
		description: 'בגרות 105.0, פסיכומטרי 690. סכם כמותי/הנדסי בבן-גוריון.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 88 },
				{ name: 'אנגלית', units: 5, grade: 86 },
				{ name: 'פיזיקה', units: 5, grade: 85 },
				{ name: 'מדעי המחשב', units: 5, grade: 90 },
				{ name: 'תנ״ך', units: 2, grade: 74 },
				{ name: 'ספרות', units: 2, grade: 70 },
				{ name: 'היסטוריה', units: 2, grade: 75 },
				{ name: 'אזרחות', units: 2, grade: 80 }
			],
			psychometricGeneral: 690,
			mathGrade: 88,
			mathUnits: 5,
			physicsUnits: 5,
			physicsGrade: 85,
			bagrutAverage: 105.0
		},
		preferences: defaultPref,
		targetProgramId: 'prog-bgu-cs-1',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},

	// =========================================================================
	// 6. UNIVERSITY OF HAIFA (חיפה)
	// =========================================================================
	{
		id: 'guy_haifa_socialwork_direct',
		name: 'גיא — עבודה סוציאלית באוניברסיטת חיפה',
		description: 'ממוצע 102.5, ללא פסיכומטרי. קבלה ישירה על סמך בגרות 100+ בלבד.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 80 },
				{ name: 'אנגלית', units: 5, grade: 85 },
				{ name: 'מדעי החברה', units: 5, grade: 92 },
				{ name: 'ספרות', units: 5, grade: 90 },
				{ name: 'תנ״ך', units: 2, grade: 84 },
				{ name: 'היסטוריה', units: 2, grade: 85 },
				{ name: 'אזרחות', units: 2, grade: 88 }
			],
			psychometricGeneral: 0,
			mathGrade: 80,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 102.5
		},
		preferences: defaultPref,
		targetProgramId: 'prog-haifa-sw-1',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			expectedDirectBagrut: true,
			maxAllowedExamsTrack1: 0
		}
	},
	{
		id: 'sapir_haifa_cs',
		name: 'ספיר — מדעי המחשב בחיפה',
		description: 'בגרות 104.0, מתמטיקה 4 יח״ל 88, פסיכומטרי 630.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 88 },
				{ name: 'אנגלית', units: 5, grade: 85 },
				{ name: 'מדעי המחשב', units: 5, grade: 90 },
				{ name: 'תנ״ך', units: 2, grade: 78 },
				{ name: 'ספרות', units: 2, grade: 75 },
				{ name: 'היסטוריה', units: 2, grade: 80 },
				{ name: 'אזרחות', units: 2, grade: 82 }
			],
			psychometricGeneral: 630,
			mathGrade: 88,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 104.0
		},
		preferences: defaultPref,
		targetProgramId: 'prog-haifa-cs-1',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},

	// =========================================================================
	// 7. ARIEL UNIVERSITY (אריאל)
	// =========================================================================
	{
		id: 'aviv_ariel_software_math3u',
		name: 'אביב — הנדסת תוכנה באריאל',
		description: 'בוגר 3 יח״ל מתמטיקה (ציון 85), פסיכומטרי 580. חובה שדרוג מתמטיקה ל-4/5 יח״ל כתנאי סף.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 3, grade: 85 },
				{ name: 'אנגלית', units: 4, grade: 80 },
				{ name: 'גיאוגרפיה', units: 5, grade: 92 },
				{ name: 'תנ״ך', units: 2, grade: 78 },
				{ name: 'ספרות', units: 2, grade: 75 },
				{ name: 'היסטוריה', units: 2, grade: 80 },
				{ name: 'אזרחות', units: 2, grade: 82 }
			],
			psychometricGeneral: 580,
			mathGrade: 85,
			mathUnits: 3,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 95.0
		},
		preferences: defaultPref,
		targetProgramId: 'prog-ariel-se-1',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'moriah_ariel_civil',
		name: 'מוריה — הנדסה אזרחית באריאל',
		description: 'מתמטיקה 4 יח״ל 78, ללא פיזיקה. סף קבלה 590.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 78 },
				{ name: 'אנגלית', units: 5, grade: 82 },
				{ name: 'כימיה', units: 5, grade: 84 },
				{ name: 'תנ״ך', units: 2, grade: 76 },
				{ name: 'ספרות', units: 2, grade: 74 },
				{ name: 'היסטוריה', units: 2, grade: 78 },
				{ name: 'אזרחות', units: 2, grade: 80 }
			],
			psychometricGeneral: 590,
			mathGrade: 78,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 97.0
		},
		preferences: defaultPref,
		targetProgramId: 'prog-ariel-civil-1',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},

	// =========================================================================
	// 8. REICHMAN UNIVERSITY (רייכמן)
	// =========================================================================
	{
		id: 'dana_reichman_business',
		name: 'דנה — מנהל עסקים ויזמות ברייכמן',
		description: 'ממוצע 101.0, פסיכומטרי 610. סף קבלה 650.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 85 },
				{ name: 'אנגלית', units: 5, grade: 90 },
				{ name: 'מדעי החברה', units: 5, grade: 90 },
				{ name: 'תנ״ך', units: 2, grade: 80 },
				{ name: 'ספרות', units: 2, grade: 78 },
				{ name: 'היסטוריה', units: 2, grade: 82 },
				{ name: 'אזרחות', units: 2, grade: 84 }
			],
			psychometricGeneral: 610,
			mathGrade: 85,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 101.0
		},
		preferences: defaultPref,
		targetProgramId: 'prog-runi-ba-1',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			maxAllowedExamsTrack1: 1
		}
	},
	{
		id: 'eyal_reichman_cs',
		name: 'איל — מדעי המחשב ברייכמן',
		description: 'בגרות 102.0, פסיכומטרי 640. סף קבלה 690.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 85 },
				{ name: 'אנגלית', units: 5, grade: 88 },
				{ name: 'מדעי המחשב', units: 5, grade: 88 },
				{ name: 'תנ״ך', units: 2, grade: 75 },
				{ name: 'ספרות', units: 2, grade: 72 },
				{ name: 'היסטוריה', units: 2, grade: 76 },
				{ name: 'אזרחות', units: 2, grade: 80 }
			],
			psychometricGeneral: 640,
			mathGrade: 85,
			mathUnits: 5,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 102.0
		},
		preferences: defaultPref,
		targetProgramId: 'prog-runi-cs-1',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	}
];
