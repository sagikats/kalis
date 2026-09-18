/**
 * Subagent 5: Automated QA & Track Quality Auditor
 * Standard Benchmark Suite of 24 Diverse Brand-New Student Archetypes Across All 8 Universities
 * (3 New Scenarios per University: Technion, TAU, HUJI, BGU, BIU, Haifa, Ariel, Reichman)
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
	// 1. TECHNION (הטכניון) - 3 New Cases
	// =========================================================================
	{
		id: 'guy_technion_civil',
		name: 'גיא — הנדסה אזרחית בטכניון',
		description: 'בגרות 100.3, פסיכומטרי 640, חסר פיזיקה. סף קבלה 88.0. נדרשת התייחסות לחובת סיווג בפיזיקה.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 85 },
				{ name: 'אנגלית', units: 5, grade: 88 },
				{ name: 'כימיה', units: 5, grade: 90 },
				{ name: 'מדעי החברה', units: 5, grade: 92 },
				{ name: 'תנ״ך', units: 2, grade: 80 },
				{ name: 'ספרות', units: 2, grade: 78 },
				{ name: 'היסטוריה', units: 2, grade: 82 },
				{ name: 'אזרחות', units: 2, grade: 84 },
				{ name: 'עברית', units: 2, grade: 80 }
			],
			psychometricGeneral: 640,
			mathGrade: 85,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 100.3
		},
		preferences: defaultPref,
		targetProgramId: 'prog-technion-5',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			requiresPhysicsPrerequisiteNotice: true
		}
	},
	{
		id: 'michal_technion_biomed',
		name: 'מיכל — הנדסה ביו-רפואית בטכניון',
		description: 'בגרות 109.6, פסיכומטרי 660. סף קבלה 87.0. מועמדת ריאלית עם פיזיקה ומתמטיקה 5 יח״ל.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 86 },
				{ name: 'אנגלית', units: 5, grade: 90 },
				{ name: 'ביולוגיה', units: 5, grade: 94 },
				{ name: 'פיזיקה', units: 5, grade: 80 },
				{ name: 'תנ״ך', units: 2, grade: 84 },
				{ name: 'ספרות', units: 2, grade: 80 },
				{ name: 'היסטוריה', units: 2, grade: 82 },
				{ name: 'אזרחות', units: 2, grade: 85 }
			],
			psychometricGeneral: 660,
			mathGrade: 86,
			mathUnits: 5,
			physicsUnits: 5,
			physicsGrade: 80,
			bagrutAverage: 109.6
		},
		preferences: defaultPref,
		targetProgramId: 'prog-technion-6',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'amit_technion_arch',
		name: 'עמית — ארכיטקטורה בטכניון',
		description: 'בגרות 100.1, פסיכומטרי 620. סף קבלה 85.0. מסלול יצירתי ללא חובת פיזיקה.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 82 },
				{ name: 'אנגלית', units: 5, grade: 90 },
				{ name: 'אמנות', units: 5, grade: 95 },
				{ name: 'גיאוגרפיה', units: 5, grade: 92 },
				{ name: 'תנ״ך', units: 2, grade: 82 },
				{ name: 'ספרות', units: 2, grade: 80 },
				{ name: 'היסטוריה', units: 2, grade: 84 },
				{ name: 'אזרחות', units: 2, grade: 82 }
			],
			psychometricGeneral: 620,
			mathGrade: 82,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 100.1
		},
		preferences: defaultPref,
		targetProgramId: 'prog-technion-2',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},

	// =========================================================================
	// 2. TEL AVIV UNIVERSITY (אוניברסיטת תל אביב) - 3 New Cases
	// =========================================================================
	{
		id: 'yonatan_tau_mech',
		name: 'יונתן — הנדסה מכנית בתל אביב',
		description: 'בגרות 107.25, פסיכומטרי 630. סף קבלה 650. זכאי לבונוס ריאלי +10 של את״א.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 84 },
				{ name: 'אנגלית', units: 5, grade: 88 },
				{ name: 'פיזיקה', units: 5, grade: 82 },
				{ name: 'כימיה', units: 5, grade: 86 },
				{ name: 'תנ״ך', units: 2, grade: 78 },
				{ name: 'ספרות', units: 2, grade: 76 },
				{ name: 'היסטוריה', units: 2, grade: 80 },
				{ name: 'אזרחות', units: 2, grade: 82 }
			],
			psychometricGeneral: 630,
			mathGrade: 84,
			mathUnits: 5,
			physicsUnits: 5,
			physicsGrade: 82,
			bagrutAverage: 107.25
		},
		preferences: defaultPref,
		targetProgramId: 'prog-tau-0542-64',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'lior_tau_econ',
		name: 'ליאור — כלכלה בתל אביב',
		description: 'בגרות 98.5, פסיכומטרי 600. סף קבלה 610. פער קטן של 10 נקודות סכם כללי.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 88 },
				{ name: 'אנגלית', units: 5, grade: 85 },
				{ name: 'גיאוגרפיה', units: 5, grade: 90 },
				{ name: 'תנ״ך', units: 2, grade: 76 },
				{ name: 'ספרות', units: 2, grade: 74 },
				{ name: 'היסטוריה', units: 2, grade: 78 },
				{ name: 'אזרחות', units: 2, grade: 80 }
			],
			psychometricGeneral: 600,
			mathGrade: 88,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 98.5
		},
		preferences: defaultPref,
		targetProgramId: 'prog-tau-1011-82',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'shirel_tau_nursing_direct',
		name: 'שיראל — הסבת אקדמאים למדעי האחיוּת בתל אביב',
		description: 'בגרות 105.74, ללא פסיכומטרי. זכאית לקבלה ישירה מיידית על סמך בגרות 100+ בלבד!',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 84 },
				{ name: 'אנגלית', units: 5, grade: 88 },
				{ name: 'ביולוגיה', units: 5, grade: 92 },
				{ name: 'מדעי החברה', units: 5, grade: 90 },
				{ name: 'תנ״ך', units: 2, grade: 86 },
				{ name: 'ספרות', units: 2, grade: 84 },
				{ name: 'היסטוריה', units: 2, grade: 85 },
				{ name: 'אזרחות', units: 2, grade: 88 }
			],
			psychometricGeneral: 0,
			mathGrade: 84,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 105.74
		},
		preferences: defaultPref,
		targetProgramId: 'prog-tau-0162-14',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			expectedDirectBagrut: true,
			maxAllowedExamsTrack1: 0
		}
	},

	// =========================================================================
	// 3. HEBREW UNIVERSITY (האוניברסיטה העברית) - 3 New Cases
	// =========================================================================
	{
		id: 'uri_huji_electrical_cs',
		name: 'אורי — הנדסת חשמל ומחשבים בעברית',
		description: 'בגרות 104.71, פסיכומטרי 650. סף קבלה 680. מועמד STEM עם רקע מדעי חזק.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 86 },
				{ name: 'אנגלית', units: 5, grade: 90 },
				{ name: 'מדעי המחשב', units: 5, grade: 90 },
				{ name: 'פיזיקה', units: 5, grade: 84 },
				{ name: 'תנ״ך', units: 2, grade: 78 },
				{ name: 'ספרות', units: 2, grade: 76 },
				{ name: 'היסטוריה', units: 2, grade: 80 },
				{ name: 'אזרחות', units: 2, grade: 82 }
			],
			psychometricGeneral: 650,
			mathGrade: 86,
			mathUnits: 5,
			physicsUnits: 5,
			physicsGrade: 84,
			bagrutAverage: 104.71
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-1-14',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'daniel_huji_linguistics_direct',
		name: 'דניאל — בלשנות בעברית',
		description: 'בגרות 108.26, ללא פסיכומטרי. זכאי מלא לקבלה ישירה על סמך בגרות 105+!',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 86 },
				{ name: 'אנגלית', units: 5, grade: 92 },
				{ name: 'ספרות', units: 5, grade: 95 },
				{ name: 'היסטוריה', units: 5, grade: 94 },
				{ name: 'תנ״ך', units: 2, grade: 88 },
				{ name: 'אזרחות', units: 2, grade: 90 }
			],
			psychometricGeneral: 0,
			mathGrade: 86,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 108.26
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-1-9',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			expectedDirectBagrut: true,
			maxAllowedExamsTrack1: 0
		}
	},
	{
		id: 'yael_huji_agro',
		name: 'יעל — אגרואקולוגיה ובריאות הצמח בעברית',
		description: 'בגרות 95.73, פסיכומטרי 580. סף קבלה 600. פקולטה לחקלאות ברחובות.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 80 },
				{ name: 'אנגלית', units: 5, grade: 84 },
				{ name: 'ביולוגיה', units: 5, grade: 88 },
				{ name: 'תנ״ך', units: 2, grade: 76 },
				{ name: 'ספרות', units: 2, grade: 74 },
				{ name: 'היסטוריה', units: 2, grade: 78 },
				{ name: 'אזרחות', units: 2, grade: 80 }
			],
			psychometricGeneral: 580,
			mathGrade: 80,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 95.73
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-1-1',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},

	// =========================================================================
	// 4. BEN-GURION UNIVERSITY (אוניברסיטת בן-גוריון) - 3 New Cases
	// =========================================================================
	{
		id: 'nadav_bgu_ee_cs',
		name: 'נדב — הנדסת חשמל ומדעי המחשב בבן-גוריון',
		description: 'בגרות 100.8, פסיכומטרי 540. סף קבלה 567 (סכם הנדסה).',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 82 },
				{ name: 'אנגלית', units: 5, grade: 85 },
				{ name: 'כימיה', units: 5, grade: 85 },
				{ name: 'תנ״ך', units: 2, grade: 76 },
				{ name: 'ספרות', units: 2, grade: 74 },
				{ name: 'היסטוריה', units: 2, grade: 78 },
				{ name: 'אזרחות', units: 2, grade: 80 }
			],
			psychometricGeneral: 540,
			mathGrade: 82,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 100.8
		},
		preferences: defaultPref,
		targetProgramId: 'prog-bgu-155',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'hadar_bgu_econ',
		name: 'הדר — כלכלה בבן-גוריון',
		description: 'בגרות 100.8, פסיכומטרי 560. סף קבלה 600 (סכם כללי).',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 80 },
				{ name: 'אנגלית', units: 5, grade: 85 },
				{ name: 'ביולוגיה', units: 5, grade: 88 },
				{ name: 'תנ״ך', units: 2, grade: 80 },
				{ name: 'ספרות', units: 2, grade: 76 },
				{ name: 'היסטוריה', units: 2, grade: 82 },
				{ name: 'אזרחות', units: 2, grade: 84 }
			],
			psychometricGeneral: 560,
			mathGrade: 80,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 100.8
		},
		preferences: defaultPref,
		targetProgramId: 'prog-bgu-41',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'alon_bgu_history_direct',
		name: 'אלון — היסטוריה כללית בבן-גוריון',
		description: 'בגרות 105.84, ללא פסיכומטרי. זכאי מלא לקבלה ישירה על סמך בגרות 104+!',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 85 },
				{ name: 'אנגלית', units: 5, grade: 90 },
				{ name: 'היסטוריה', units: 5, grade: 94 },
				{ name: 'מדעי החברה', units: 5, grade: 92 },
				{ name: 'תנ״ך', units: 2, grade: 86 },
				{ name: 'ספרות', units: 2, grade: 84 },
				{ name: 'אזרחות', units: 2, grade: 88 }
			],
			psychometricGeneral: 0,
			mathGrade: 85,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 105.84
		},
		preferences: defaultPref,
		targetProgramId: 'prog-bgu-22',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			expectedDirectBagrut: true,
			maxAllowedExamsTrack1: 0
		}
	},

	// =========================================================================
	// 5. BAR-ILAN UNIVERSITY (אוניברסיטת בר-אילן) - 3 New Cases
	// =========================================================================
	{
		id: 'tal_biu_ee',
		name: 'טל — הנדסת חשמל בבר-אילן',
		description: 'בגרות 101.96, פסיכומטרי 640. סף קבלה 680.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 82 },
				{ name: 'אנגלית', units: 5, grade: 86 },
				{ name: 'פיזיקה', units: 5, grade: 80 },
				{ name: 'כימיה', units: 5, grade: 85 },
				{ name: 'תנ״ך', units: 2, grade: 78 },
				{ name: 'ספרות', units: 2, grade: 76 },
				{ name: 'היסטוריה', units: 2, grade: 82 },
				{ name: 'אזרחות', units: 2, grade: 84 }
			],
			psychometricGeneral: 640,
			mathGrade: 82,
			mathUnits: 5,
			physicsUnits: 5,
			physicsGrade: 80,
			bagrutAverage: 101.96
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-4-15',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'yonatan_biu_history_direct',
		name: 'יונתן — היסטוריה כללית בבר-אילן',
		description: 'בגרות 106.22, ללא פסיכומטרי. זכאי מלא לקבלה ישירה על סמך בגרות 102+!',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 82 },
				{ name: 'אנגלית', units: 5, grade: 88 },
				{ name: 'היסטוריה', units: 5, grade: 92 },
				{ name: 'תנ״ך', units: 5, grade: 90 },
				{ name: 'ספרות', units: 2, grade: 84 },
				{ name: 'אזרחות', units: 2, grade: 86 }
			],
			psychometricGeneral: 0,
			mathGrade: 82,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 106.22
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-4-14',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			expectedDirectBagrut: true,
			maxAllowedExamsTrack1: 0
		}
	},
	{
		id: 'roni_biu_optometry',
		name: 'רוני — אופטומטריה בבר-אילן',
		description: 'בגרות 94.45, פסיכומטרי 580. סף קבלה 600.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 78 },
				{ name: 'אנגלית', units: 5, grade: 84 },
				{ name: 'ביולוגיה', units: 5, grade: 86 },
				{ name: 'תנ״ך', units: 2, grade: 76 },
				{ name: 'ספרות', units: 2, grade: 74 },
				{ name: 'היסטוריה', units: 2, grade: 78 },
				{ name: 'אזרחות', units: 2, grade: 80 }
			],
			psychometricGeneral: 580,
			mathGrade: 78,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 94.45
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-4-1',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},

	// =========================================================================
	// 6. UNIVERSITY OF HAIFA (אוניברסיטת חיפה) - 3 New Cases
	// =========================================================================
	{
		id: 'shahar_haifa_econ',
		name: 'שחר — כלכלה באוניברסיטת חיפה',
		description: 'בגרות 95.32, פסיכומטרי 590. סף קבלה 620.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 80 },
				{ name: 'אנגלית', units: 5, grade: 84 },
				{ name: 'מדעי החברה', units: 5, grade: 88 },
				{ name: 'תנ״ך', units: 2, grade: 78 },
				{ name: 'ספרות', units: 2, grade: 76 },
				{ name: 'היסטוריה', units: 2, grade: 80 },
				{ name: 'אזרחות', units: 2, grade: 82 }
			],
			psychometricGeneral: 590,
			mathGrade: 80,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 95.32
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-5-12',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'maayan_haifa_sped_direct',
		name: 'מעיין — חינוך מיוחד באוניברסיטת חיפה',
		description: 'בגרות 104.4, ללא פסיכומטרי. זכאית מלאה לקבלה ישירה על סמך בגרות 100+!',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 84 },
				{ name: 'אנגלית', units: 5, grade: 88 },
				{ name: 'מדעי החברה', units: 5, grade: 92 },
				{ name: 'ספרות', units: 5, grade: 90 },
				{ name: 'תנ״ך', units: 2, grade: 84 },
				{ name: 'היסטוריה', units: 2, grade: 85 },
				{ name: 'אזרחות', units: 2, grade: 88 }
			],
			psychometricGeneral: 0,
			mathGrade: 84,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 104.4
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-5-10',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			expectedDirectBagrut: true,
			maxAllowedExamsTrack1: 0
		}
	},
	{
		id: 'adi_haifa_mgmt_psych',
		name: 'עדי — ניהול ופסיכולוגיה באוניברסיטת חיפה',
		description: 'בגרות 100.14, פסיכומטרי 630. סף קבלה 670.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 86 },
				{ name: 'אנגלית', units: 5, grade: 90 },
				{ name: 'פסיכולוגיה', units: 5, grade: 92 },
				{ name: 'תנ״ך', units: 2, grade: 82 },
				{ name: 'ספרות', units: 2, grade: 80 },
				{ name: 'היסטוריה', units: 2, grade: 84 },
				{ name: 'אזרחות', units: 2, grade: 86 }
			],
			psychometricGeneral: 630,
			mathGrade: 86,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 100.14
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-5-48',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},

	// =========================================================================
	// 7. ARIEL UNIVERSITY (אוניברסיטת אריאל) - 3 New Cases
	// =========================================================================
	{
		id: 'itay_ariel_mech',
		name: 'איתי — הנדסת מכונות ומכטרוניקה באריאל',
		description: 'בגרות 92.46, פסיכומטרי 560. סף קבלה 610.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 80 },
				{ name: 'אנגלית', units: 4, grade: 78 },
				{ name: 'פיזיקה', units: 5, grade: 75 },
				{ name: 'כימיה', units: 5, grade: 78 },
				{ name: 'תנ״ך', units: 2, grade: 76 },
				{ name: 'ספרות', units: 2, grade: 74 },
				{ name: 'היסטוריה', units: 2, grade: 78 },
				{ name: 'אזרחות', units: 2, grade: 80 }
			],
			psychometricGeneral: 560,
			mathGrade: 80,
			mathUnits: 4,
			physicsUnits: 5,
			physicsGrade: 75,
			bagrutAverage: 92.46
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-2-8',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'noa_ariel_edu_direct',
		name: 'נועה — חינוך באריאל',
		description: 'בגרות 101.8, ללא פסיכומטרי. זכאית מלאה לקבלה ישירה על סמך בגרות 100+!',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 80 },
				{ name: 'אנגלית', units: 5, grade: 86 },
				{ name: 'ספרות', units: 5, grade: 90 },
				{ name: 'מדעי החברה', units: 5, grade: 88 },
				{ name: 'תנ״ך', units: 2, grade: 84 },
				{ name: 'היסטוריה', units: 2, grade: 82 },
				{ name: 'אזרחות', units: 2, grade: 86 }
			],
			psychometricGeneral: 0,
			mathGrade: 80,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 101.8
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-2-11',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			expectedDirectBagrut: true,
			maxAllowedExamsTrack1: 0
		}
	},
	{
		id: 'matan_ariel_ee',
		name: 'מתן — הנדסת חשמל ואלקטרוניקה באריאל',
		description: 'בגרות 98.5, פסיכומטרי 570. סף קבלה 620.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 76 },
				{ name: 'אנגלית', units: 5, grade: 80 },
				{ name: 'פיזיקה', units: 5, grade: 75 },
				{ name: 'מדעי המחשב', units: 5, grade: 80 },
				{ name: 'תנ״ך', units: 2, grade: 74 },
				{ name: 'ספרות', units: 2, grade: 72 },
				{ name: 'היסטוריה', units: 2, grade: 76 },
				{ name: 'אזרחות', units: 2, grade: 78 }
			],
			psychometricGeneral: 570,
			mathGrade: 76,
			mathUnits: 5,
			physicsUnits: 5,
			physicsGrade: 75,
			bagrutAverage: 98.5
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-2-7',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},

	// =========================================================================
	// 8. REICHMAN UNIVERSITY (אוניברסיטת רייכמן) - 3 New Cases
	// =========================================================================
	{
		id: 'tomer_reichman_comm_direct',
		name: 'תומר — תקשורת ברייכמן',
		description: 'בגרות 102.41, ללא פסיכומטרי. זכאי מלא לקבלה ישירה על סמך בגרות 100+!',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 84 },
				{ name: 'אנגלית', units: 5, grade: 90 },
				{ name: 'תקשורת', units: 5, grade: 94 },
				{ name: 'מדעי החברה', units: 5, grade: 92 },
				{ name: 'תנ״ך', units: 2, grade: 84 },
				{ name: 'ספרות', units: 2, grade: 82 },
				{ name: 'היסטוריה', units: 2, grade: 85 },
				{ name: 'אזרחות', units: 2, grade: 86 }
			],
			psychometricGeneral: 0,
			mathGrade: 84,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 102.41
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-38-9',
		expectedBehaviors: {
			mustAchieveAdmission: true,
			expectedDirectBagrut: true,
			maxAllowedExamsTrack1: 0
		}
	},
	{
		id: 'inbal_reichman_datascience',
		name: 'ענבל — מדע הנתונים (B.Sc) ברייכמן',
		description: 'בגרות 100.5, פסיכומטרי 600. סף קבלה 650.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 5, grade: 80 },
				{ name: 'אנגלית', units: 5, grade: 84 },
				{ name: 'מדעי המחשב', units: 5, grade: 82 },
				{ name: 'תנ״ך', units: 2, grade: 74 },
				{ name: 'ספרות', units: 2, grade: 72 },
				{ name: 'היסטוריה', units: 2, grade: 76 },
				{ name: 'אזרחות', units: 2, grade: 78 }
			],
			psychometricGeneral: 600,
			mathGrade: 80,
			mathUnits: 5,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 100.5
		},
		preferences: defaultPref,
		targetProgramId: 'prog-reichman-2',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	},
	{
		id: 'guy_reichman_law',
		name: 'גיא — משפטים ברייכמן',
		description: 'בגרות 96.5, פסיכומטרי 570. סף קבלה 620.',
		profile: {
			bagrutSubjects: [
				{ name: 'מתמטיקה', units: 4, grade: 78 },
				{ name: 'אנגלית', units: 5, grade: 82 },
				{ name: 'היסטוריה', units: 5, grade: 85 },
				{ name: 'תנ״ך', units: 2, grade: 74 },
				{ name: 'ספרות', units: 2, grade: 72 },
				{ name: 'אזרחות', units: 2, grade: 76 }
			],
			psychometricGeneral: 570,
			mathGrade: 78,
			mathUnits: 4,
			physicsUnits: 0,
			physicsGrade: 0,
			bagrutAverage: 96.5
		},
		preferences: defaultPref,
		targetProgramId: 'prog-inst-38-6',
		expectedBehaviors: {
			mustAchieveAdmission: true
		}
	}
];
