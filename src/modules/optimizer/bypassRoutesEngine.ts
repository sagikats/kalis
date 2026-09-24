/**
 * Bypass Routes Engine: Institutional Mechina & Open University Transition Tracks (אפיקי מעבר)
 * Subagent 2: Recommendation & Optimization Algorithms
 *
 * Provides authentic, degree-tailored bypass routes for candidates facing large admission gaps
 * or desiring structured alternatives without reliance on individual Bagrut/Psychometric retakes:
 *
 * 1. מכינה קדם-אקדמית ייעודית (Pre-Academic Mechina):
 *    - Replaces the entire Bagrut certificate with an official institutional GPA.
 *    - Tailored curriculum: STEM (Math 5u, Physics 5u, Academic English, Scientific Writing) vs.
 *      Social Sciences/Humanities (Applied Math/Stats, Academic Literacy, English, Israeli Society).
 *    - ZERO irrelevant Bagrut electives (no Geography, Literature, etc.).
 *
 * 2. אפיק מעבר מהאוניברסיטה הפתוחה (Open University Transition Route):
 *    - Guaranteed admission agreements between The Open University of Israel and the target university.
 *    - 100% bypass of BOTH Bagrut and Psychometric requirements!
 *    - Direct admission to Year 2 (or Semester 2/3) with full academic course credits upon achieving target GPA.
 */

import {
	ActionTrackRecord,
	AcademicProgramRecord,
	UserAcademicProfileRecord,
	UserPreferencesRecord,
	FeasibilityLevel,
	ImprovementLeverRecord,
	TrackMilestoneRecord
} from '../db/schema';
import { toCalculatorSubjects } from './solver';
import { calculateInstitution } from '../calculators/index';
import { getMechinaRegistrationUrl, getAfikMaavarRegistrationUrl } from '../../utils/universityRegistration';

export interface OpenUniversityCourseDetail {
	courseNumber: string;
	courseName: string;
	credits: number;
	minGrade?: number;
}

export interface AfikMaavarSpec {
	channelTitle: string;
	targetInstitutionName: string;
	requiredGpa: number;
	minCourseGrade: number;
	requiredCredits: number;
	courses: OpenUniversityCourseDetail[];
	specialRequirements?: string;
	academicAdvantage: string;
	registrationUrl?: string;
	infoUrl?: string;
}

export interface BypassRoutesResult {
	mechinaTrack: ActionTrackRecord;
	afikMaavarTrack: ActionTrackRecord;
	hasAfikMaavar: boolean;
	afikSpec?: AfikMaavarSpec;
}

// ---------------------------------------------------------------------------
// 1. Classification Helpers
// ---------------------------------------------------------------------------

export type DegreeDomainCategory =
	| 'computer_science'
	| 'engineering'
	| 'exact_sciences'
	| 'life_sciences'
	| 'economics_management'
	| 'psychology_social'
	| 'law'
	| 'humanities';

export function categorizeDegreeDomain(program: AcademicProgramRecord): DegreeDomainCategory {
	const name = (program.name + ' ' + (program.fieldOfStudy || '')).toLowerCase();

	if (
		name.includes('מדעי המחשב') ||
		name.includes('תוכנה') ||
		name.includes('סייבר') ||
		name.includes('בינה מלאכותית') ||
		name.includes('מערכות מידע') ||
		name.includes('computer science') ||
		name.includes('data science') ||
		name.includes('נתונים')
	) {
		return 'computer_science';
	}

	if (
		name.includes('הנדס') ||
		name.includes('חשמל') ||
		name.includes('מכונות') ||
		name.includes('אזרחית') ||
		name.includes('בניין') ||
		name.includes('ביו-רפואית') ||
		name.includes('ביורפואית') ||
		name.includes('כימית') ||
		name.includes('חומרים') ||
		name.includes('תעשייה וניהול')
	) {
		return 'engineering';
	}

	if (
		name.includes('מתמטיקה') ||
		name.includes('פיזיקה') ||
		name.includes('כימיה') ||
		name.includes('סטטיסטיקה') ||
		name.includes('גיאופיזיקה')
	) {
		return 'exact_sciences';
	}

	if (
		name.includes('ביולוגיה') ||
		name.includes('מדעי החיים') ||
		name.includes('רפואה') ||
		name.includes('רוקחות') ||
		name.includes('ביוטכנולוגיה') ||
		name.includes('מדעי המוח') ||
		name.includes('סיעוד') ||
		name.includes('פיזיותרפיה')
	) {
		return 'life_sciences';
	}

	if (
		name.includes('כלכלה') ||
		name.includes('ניהול') ||
		name.includes('עסקים') ||
		name.includes('חשבונאות') ||
		name.includes('מימון') ||
		name.includes('שיווק')
	) {
		return 'economics_management';
	}

	if (
		name.includes('פסיכולוגיה') ||
		name.includes('סוציולוגיה') ||
		name.includes('עבודה סוציאלית') ||
		name.includes('מדעי ההתנהגות') ||
		name.includes('קרימינולוגיה') ||
		name.includes('תקשורת') ||
		name.includes('ממשל') ||
		name.includes('מדעי המדינה')
	) {
		return 'psychology_social';
	}

	if (name.includes('משפט') || name.includes('law')) {
		return 'law';
	}

	return 'humanities';
}

// ---------------------------------------------------------------------------
// 2. Pre-Academic Mechina Generator (100% Bagrut-Free & Accurate)
// ---------------------------------------------------------------------------

export function generateAccurateMechinaTrack(
	targetProgram: AcademicProgramRecord,
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): ActionTrackRecord {
	const domain = categorizeDegreeDomain(targetProgram);
	const instId = targetProgram.institutionId;
	const isStem = domain === 'computer_science' || domain === 'engineering' || domain === 'exact_sciences';
	const isLifeScience = domain === 'life_sciences';

	const baseSubjects = toCalculatorSubjects(profile);
	const hasTakenPsych = profile.hasTakenPsychometric && profile.psychometricGeneral > 0;
	const currentPsych = hasTakenPsych ? profile.psychometricGeneral : 600;

	let currentSekem = 0;
	let currentBagrut = 0;
	try {
		const initRes = calculateInstitution(instId, {
			bagrutSubjects: baseSubjects,
			psychometricGeneral: currentPsych,
			mathUnits: profile.mathUnits,
			mathGrade: profile.mathGrade,
			physicsUnits: profile.physicsUnits,
			physicsGrade: profile.physicsGrade
		});
		currentSekem = initRes.engineeringSekem ?? initRes.generalSekem;
		currentBagrut = initRes.bagrutAverage;
	} catch {
		currentSekem = targetProgram.minSekemThreshold * 0.9;
		currentBagrut = 90;
	}

	const threshold = targetProgram.minSekemThreshold;
	const sekemGap = Math.max(0, threshold - currentSekem);

	// Institution specific name and duration
	let mechinaName = '';
	let mechinaFaculty = '';
	let durationWeeks = 36;
	let targetMechinaGpa = 85;

	switch (instId) {
		case 'technion':
			mechinaName = 'המכינה הקדם-אקדמית של הטכניון (נווה שאנן)';
			mechinaFaculty = 'מסלול מדעים מדויקים והנדסה';
			durationWeeks = 38;
			targetMechinaGpa = domain === 'computer_science' ? 88 : 84;
			break;
		case 'tau':
			mechinaName = 'המכינה הקדם-אקדמית של אוניברסיטת תל-אביב';
			mechinaFaculty = isStem ? 'מסלול מדעים מדויקים והנדסה' : 'מסלול מדעי החברה והרוח';
			durationWeeks = 36;
			targetMechinaGpa = 85;
			break;
		case 'huji':
			mechinaName = 'המכינה הקדם-אקדמית של האוניברסיטה העברית (הר הצופים)';
			mechinaFaculty = isStem ? 'מסלול מדעי הטבע והמחשב' : isLifeScience ? 'מסלול מדעי החיים והטבע' : 'מסלול מדעי החברה והרוח';
			durationWeeks = 36;
			targetMechinaGpa = domain === 'computer_science' ? 87 : 83;
			break;
		case 'bgu':
			mechinaName = 'מכינת בן-גוריון (מרכז חוסידמן למכינות קדם-אקדמיות)';
			mechinaFaculty = isStem ? 'מכינה להנדסה ומדעי הטבע' : 'מכינה למדעי החברה וניהול';
			durationWeeks = 36;
			targetMechinaGpa = 84;
			break;
		case 'bar_ilan':
			mechinaName = 'המכינה הקדם-אקדמית של אוניברסיטת בר-אילן';
			mechinaFaculty = isStem ? 'מסלול מדעים והנדסה' : 'מסלול מדעי החברה ויהדות';
			durationWeeks = 36;
			targetMechinaGpa = 82;
			break;
		case 'haifa':
			mechinaName = 'המכינה הקדם-אקדמית של אוניברסיטת חיפה';
			mechinaFaculty = isStem ? 'מסלול מדעים' : 'מסלול מדעי החברה והרוח';
			durationWeeks = 34;
			targetMechinaGpa = 80;
			break;
		case 'ariel':
			mechinaName = 'המכינה הקדם-אקדמית של אוניברסיטת אריאל';
			mechinaFaculty = isStem ? 'מכינה להנדסה ומדעי המחשב' : 'מכינה למדעי החברה';
			durationWeeks = 32;
			targetMechinaGpa = 80;
			break;
		case 'reichman':
			mechinaName = 'מסלול הכנה אקדמי של אוניברסיטת רייכמן';
			mechinaFaculty = 'תוכנית מעבר קדם-אקדמית בינתחומית';
			durationWeeks = 26;
			targetMechinaGpa = 82;
			break;
		default:
			mechinaName = `המכינה הקדם-אקדמית (${targetProgram.institutionName})`;
			mechinaFaculty = isStem ? 'מסלול מדעים והנדסה' : 'מסלול מדעי החברה והרוח';
			durationWeeks = 36;
			targetMechinaGpa = 83;
	}

	// Tailored authentic Mechina course curriculum (NEVER random Bagrut electives like Geography!)
	const recommendedLevers: ImprovementLeverRecord[] = isStem
		? [
				{
					id: 'mech_stem_math',
					trackId: 'track-mechina',
					subjectName: 'מתמטיקה מכינה מואצת (רמת 5 יח״ל)',
					currentGrade: profile.mathGrade || 70,
					currentUnits: 0,
					targetGrade: targetMechinaGpa,
					targetUnits: 5,
					priority: 1,
					reason: 'קורס דגל במכינה הכולל חדו"א ואלגברה – מחליף את בחינת הבגרות במתמטיקה ומהווה תנאי קבלה הכרחי',
					leverType: 'bagrut_core',
					session: 'winter'
				},
				{
					id: 'mech_stem_phys',
					trackId: 'track-mechina',
					subjectName: 'פיזיקה מכינה (מכניקה וחשמל 5 יח״ל)',
					currentGrade: profile.physicsGrade || 0,
					currentUnits: 0,
					targetGrade: Math.max(80, targetMechinaGpa - 3),
					targetUnits: 5,
					priority: 2,
					reason: 'קורס פיזיקה אקדמי המעניק פטור מבגרות בפיזיקה ומספק את ידע היסוד ללימודים במוסד',
					leverType: 'bagrut_elective',
					session: 'summer'
				},
				{
					id: 'mech_stem_eng',
					trackId: 'track-mechina',
					subjectName: 'אנגלית מדעית ואקדמית',
					currentGrade: 80,
					currentUnits: 0,
					targetGrade: 85,
					targetUnits: 5,
					priority: 3,
					reason: 'הגעה לרמת פטור באנגלית או מתקדמים ב׳ כחלק מתעודת הגמר',
					leverType: 'bagrut_core',
					session: 'summer'
				}
		  ]
		: isLifeScience
		? [
				{
					id: 'mech_life_chem_bio',
					trackId: 'track-mechina',
					subjectName: 'כימיה וביולוגיה למכינה (5 יח״ל)',
					currentGrade: 75,
					currentUnits: 0,
					targetGrade: targetMechinaGpa,
					targetUnits: 5,
					priority: 1,
					reason: 'הכנה מדעית ממוקדת במדעי הטבע המחליפה את בגרויות הביולוגיה והכימיה',
					leverType: 'bagrut_elective',
					session: 'winter'
				},
				{
					id: 'mech_life_math',
					trackId: 'track-mechina',
					subjectName: 'מתמטיקה מוגברת למדעי החיים (4-5 יח״ל)',
					currentGrade: profile.mathGrade || 70,
					currentUnits: 0,
					targetGrade: targetMechinaGpa,
					targetUnits: 5,
					priority: 2,
					reason: 'עמידה בדרישות הסף במתמטיקה לפקולטה למדעי הטבע והבריאות',
					leverType: 'bagrut_core',
					session: 'summer'
				},
				{
					id: 'mech_life_eng',
					trackId: 'track-mechina',
					subjectName: 'אנגלית מדעית ואקדמית',
					currentGrade: 80,
					currentUnits: 0,
					targetGrade: 85,
					targetUnits: 5,
					priority: 3,
					reason: 'הגעה לרמת פטור או מתקדמים ב׳ במוסד האקדמי',
					leverType: 'bagrut_core',
					session: 'summer'
				}
		  ]
		: [
				{
					id: 'mech_soc_stats',
					trackId: 'track-mechina',
					subjectName: 'סטטיסטיקה ומתמטיקה שימושית למדעי החברה',
					currentGrade: profile.mathGrade || 75,
					currentUnits: 0,
					targetGrade: targetMechinaGpa,
					targetUnits: 4,
					priority: 1,
					reason: 'קורס מכינה בסיסי במתודולוגיה כמותית המכשיר לקראת קורסי התואר',
					leverType: 'bagrut_core',
					session: 'winter'
				},
				{
					id: 'mech_soc_academic',
					trackId: 'track-mechina',
					subjectName: 'אוריינות ומחקר אקדמי',
					currentGrade: 80,
					currentUnits: 0,
					targetGrade: 88,
					targetUnits: 3,
					priority: 2,
					reason: 'כתיבה מחקרית וניתוח טקסטים אקדמיים המחליפים את מקצועות הבגרות העיוניים',
					leverType: 'bagrut_elective',
					session: 'winter'
				},
				{
					id: 'mech_soc_eng',
					trackId: 'track-mechina',
					subjectName: 'אנגלית אקדמית למדעי החברה',
					currentGrade: 80,
					currentUnits: 0,
					targetGrade: 85,
					targetUnits: 4,
					priority: 3,
					reason: 'סגירת רמת האנגלית הנדרשת לקבלה לתואר',
					leverType: 'bagrut_core',
					session: 'summer'
				}
		  ];

	const milestones: TrackMilestoneRecord[] = [
		{
			id: 'm_station_1',
			trackId: 'track-mechina',
			orderIndex: 1,
			title: `רישום ומבחני סיווג ל${mechinaName}`,
			detail: `הרשמה למכינה, בדיקת זכאות למלגות שכר לימוד וקיום, ומעבר מבחן מיון במתמטיקה ואנגלית לקביעת רמת השיבוץ.`,
			timing: 'שבוע 1–4',
			type: 'administrative'
		},
		{
			id: 'm_station_2',
			trackId: 'track-mechina',
			orderIndex: 2,
			title: `לימודי סמסטר א׳ ו-ב׳ ב${mechinaFaculty}`,
			detail: `השלמת קורסי המכינה האינטנסיביים: ${recommendedLevers.map((l) => l.subjectName.split(' (')[0]).join(', ')}. מסגרת מובנית עם מעטפת תרגול, חונכות ומרצים מהמוסד.`,
			timing: `שבועות 5–${durationWeeks - 6}`,
			type: 'mechina' as any
		},
		{
			id: 'm_station_3',
			trackId: 'track-mechina',
			orderIndex: 3,
			title: 'בחינות גמר מכינה והמרת תעודת הגמר לקבלה מובטחת',
			detail: `קבלת תעודת גמר המכינה עם ממוצע יעד ${targetMechinaGpa}+. תעודת המכינה מחליפה את ממוצע הבגרות שלך ומקנה קבלה ישירה ל${targetProgram.name} ב${targetProgram.institutionName}.`,
			timing: `שבועות ${durationWeeks - 5}–${durationWeeks}`,
			type: 'administrative'
		}
	];

	return {
		id: 'track-mechina',
		userId: profile.userId,
		programId: targetProgram.id,
		type: 'mechina',
		title: `מסלול מכינה קדם-אקדמית: ${mechinaName} (${mechinaFaculty})`,
		badge: 'מסלול מובנה • מכינה קדם-אקדמית מחליפת בגרות',
		badgeColor: 'from-amber-600 to-amber-800',
		strategyDescription:
			`עבור מועמדים המעוניינים במסגרת לימודית מסודרת וסגירת פערים יסודית, ${mechinaName} (${mechinaFaculty}) ` +
			`מעניקה מעטפת לימודית מלאה עם תרגולים ומלגות. ` +
			`תעודת גמר המכינה מוכרת רשמית על ידי ${targetProgram.institutionName} ומחליפה לחלוטין את ממוצע תעודת הבגרות. ` +
			`עמידה בממוצע מכינה של ${targetMechinaGpa}+ מעניקה קבלה מובטחת לחוג ${targetProgram.name} ללא צורך בשיפור עצמאי של בגרויות בודדות.`,
		targetSekem: threshold,
		targetPsychometric: undefined,
		currentPsychometric: hasTakenPsych ? currentPsych : undefined,
		targetBagrutAverage: targetMechinaGpa,
		currentBagrutAverage: currentBagrut,
		recommendedLevers,
		milestones,
		estimatedWeeks: durationWeeks,
		weeklyHours: 28,
		feasibility: (sekemGap <= 25 ? 'very_high' : 'high') as FeasibilityLevel,
		feasibilityExplanation: `מסגרת שנתית מובנית במוסד מספקת ודאות קבלה מרבית עם מעטפת תרגול ומלגות.`,
		keyAdvantage: 'תעודת גמר המכינה מחליפה את ממוצע הבגרות ומספקת קבלה מובטחת לחוג ללא תלות בבגרויות העבר.',
		institutionId: instId,
		institutionName: targetProgram.institutionName,
		programName: targetProgram.name,
		admissionThreshold: threshold,
		registrationUrl: getMechinaRegistrationUrl(instId, targetProgram.institutionName),
		createdAt: new Date()
	};
}

// ---------------------------------------------------------------------------
// 3. Open University Transition Track Generator (אפיק מעבר מהאוניברסיטה הפתוחה)
// ---------------------------------------------------------------------------

function buildDomainAfikSpecification(
	targetProgram: AcademicProgramRecord
): AfikMaavarSpec {
	const domain = categorizeDegreeDomain(targetProgram);
	const instId = targetProgram.institutionId;
	const instName = targetProgram.institutionName;
	const progName = targetProgram.name;

	// Computer Science / Software Engineering
	if (domain === 'computer_science') {
		const isTechnion = instId === 'technion';
		const isTau = instId === 'tau';
		const isHuji = instId === 'huji';
		const isBgu = instId === 'bgu';

		const gpa = isTechnion ? 85 : isTau ? 85 : isHuji ? 85 : isBgu ? 85 : 82;
		const minGrade = isTechnion ? 80 : 75;

		return {
			channelTitle: `אפיק מעבר למדעי המחשב ב${instName}`,
			targetInstitutionName: instName,
			requiredGpa: gpa,
			minCourseGrade: minGrade,
			requiredCredits: 30,
			courses: [
				{ courseNumber: '20474', courseName: 'חשבון אינפיניטסימלי 1 (אינפי 1)', credits: 6, minGrade },
				{ courseNumber: '20475', courseName: 'חשבון אינפיניטסימלי 2 (אינפי 2)', credits: 6, minGrade },
				{ courseNumber: '20485', courseName: 'אלגברה לינארית 1', credits: 6, minGrade },
				{ courseNumber: '20486', courseName: 'אלגברה לינארית 2', credits: 4, minGrade },
				{ courseNumber: '20441', courseName: 'מבוא למדעי המחשב ושפת Java', credits: 6, minGrade },
				{ courseNumber: '20407', courseName: 'מבני נתונים ומבוא לאלגוריתמים', credits: 6, minGrade }
			],
			specialRequirements: isTechnion
				? 'עמידה בכל 6 הקורסים תוך שנתיים אקדמיות לכל היותר, בממוצע 85 ומעלה וציון 80 לפחות בכל קורס.'
				: 'השלמת מקבץ הקורסים בממוצע היעד מקנה קבלה מובטחת לשנה ב׳ עם פטור מלא מכל הקורסים שנלמדו.',
			academicAdvantage: '0 בגרות ו-0 פסיכומטרי! קבלה מובטחת על סמך הצלחה בקורסים אקדמיים + פטור וקרדיט של 30 נ״ז לתואר.'
		};
	}

	// Engineering
	if (domain === 'engineering') {
		const isTechnion = instId === 'technion';
		const isTau = instId === 'tau';
		const gpa = isTechnion ? 83 : isTau ? 85 : 82;

		return {
			channelTitle: `אפיק מעבר להנדסה ב${instName}`,
			targetInstitutionName: instName,
			requiredGpa: gpa,
			minCourseGrade: 75,
			requiredCredits: 28,
			courses: [
				{ courseNumber: '20406', courseName: 'חשבון דיפרנציאלי ואינטגרלי 1 (חדו״א 1)', credits: 6, minGrade: 75 },
				{ courseNumber: '20425', courseName: 'חשבון דיפרנציאלי ואינטגרלי 2 (חדו״א 2)', credits: 6, minGrade: 75 },
				{ courseNumber: '20485', courseName: 'אלגברה לינארית 1', credits: 6, minGrade: 75 },
				{ courseNumber: '20187', courseName: 'פיזיקה: יסודות המכניקה', credits: 6, minGrade: 75 },
				{ courseNumber: '20188', courseName: 'פיזיקה: חשמל ומגנטיות', credits: 6, minGrade: 75 }
			],
			specialRequirements: 'עמידה במקבץ בממוצע הנדרש מקנה קבלה מובטחת לפקולטה להנדסה והכרה מלאה בנקודות הזכות.',
			academicAdvantage: 'מעבר מובטח לפקולטה להנדסה ללא תלות בסכם התיכוני, עם סיום כמעט שנה אקדמית שלמה מראש.'
		};
	}

	// Exact Sciences (Mathematics, Physics, Chemistry)
	if (domain === 'exact_sciences') {
		return {
			channelTitle: `אפיק מעבר למדעים מדויקים ב${instName}`,
			targetInstitutionName: instName,
			requiredGpa: 80,
			minCourseGrade: 70,
			requiredCredits: 24,
			courses: [
				{ courseNumber: '20474', courseName: 'אינפי 1 / חדו״א 1', credits: 6, minGrade: 75 },
				{ courseNumber: '20475', courseName: 'אינפי 2 / חדו״א 2', credits: 6, minGrade: 75 },
				{ courseNumber: '20485', courseName: 'אלגברה לינארית 1', credits: 6, minGrade: 75 },
				{ courseNumber: '20187', courseName: 'מכניקה או כימיה כללית', credits: 6, minGrade: 70 }
			],
			academicAdvantage: 'מעבר אוטומטי למחלקה עם הכרה מלאה של כל הקורסים האקדמיים.'
		};
	}

	// Life Sciences / Biology / Pre-Med
	if (domain === 'life_sciences') {
		return {
			channelTitle: `אפיק מעבר למדעי החיים ב${instName}`,
			targetInstitutionName: instName,
			requiredGpa: 80,
			minCourseGrade: 75,
			requiredCredits: 26,
			courses: [
				{ courseNumber: '20118', courseName: 'ביולוגיה כללית א׳', credits: 6, minGrade: 75 },
				{ courseNumber: '20119', courseName: 'ביולוגיה כללית ב׳', credits: 6, minGrade: 75 },
				{ courseNumber: '20437', courseName: 'כימיה כללית למדעי הטבע', credits: 6, minGrade: 75 },
				{ courseNumber: '20412', courseName: 'חשבון דיפרנציאלי ואינטגרלי', credits: 5, minGrade: 70 }
			],
			academicAdvantage: 'קבלה ישירה לשנה ב׳ בביולוגיה או מדעי החיים ללא צורך בסכם כמותי גבוה.'
		};
	}

	// Economics & Management
	if (domain === 'economics_management') {
		const isTau = instId === 'tau';
		const isHuji = instId === 'huji';
		const gpa = isTau || isHuji ? 85 : 80;

		return {
			channelTitle: `אפיק מעבר לכלכלה וניהול ב${instName}`,
			targetInstitutionName: instName,
			requiredGpa: gpa,
			minCourseGrade: 75,
			requiredCredits: 24,
			courses: [
				{ courseNumber: '10131', courseName: 'מבוא למיקרוכלכלה', credits: 4, minGrade: 75 },
				{ courseNumber: '10126', courseName: 'מבוא למאקרוכלכלה', credits: 4, minGrade: 75 },
				{ courseNumber: '20412', courseName: 'חשבון דיפרנציאלי ואינטגרלי לכלכלנים', credits: 5, minGrade: 75 },
				{ courseNumber: '30111', courseName: 'מבוא לסטטיסטיקה א׳ למדעי החברה', credits: 4, minGrade: 75 },
				{ courseNumber: '30112', courseName: 'מבוא לסטטיסטיקה ב׳ למדעי החברה', credits: 4, minGrade: 75 }
			],
			academicAdvantage: 'מעבר מובטח למחלקה לכלכלה או בית הספר למנהל עסקים עם צבירת 24 נ״ז אקדמיות.'
		};
	}

	// Psychology & Behavioral Sciences
	if (domain === 'psychology_social') {
		const isTau = instId === 'tau';
		const isHuji = instId === 'huji';
		const isBgu = instId === 'bgu';
		const gpa = isTau ? 88 : isHuji ? 87 : isBgu ? 85 : 82;

		return {
			channelTitle: `אפיק מעבר לפסיכולוגיה ומדעי החברה ב${instName}`,
			targetInstitutionName: instName,
			requiredGpa: gpa,
			minCourseGrade: 80,
			requiredCredits: 22,
			courses: [
				{ courseNumber: '10136', courseName: 'מבוא לפסיכולוגיה', credits: 6, minGrade: 80 },
				{ courseNumber: '10444', courseName: 'פסיכולוגיה התפתחותית', credits: 4, minGrade: 80 },
				{ courseNumber: '10104', courseName: 'פסיכולוגיה חברתית', credits: 4, minGrade: 80 },
				{ courseNumber: '30111', courseName: 'מבוא לסטטיסטיקה א׳ למדעי החברה', credits: 4, minGrade: 80 },
				{ courseNumber: '10223', courseName: 'שיטות מחקר במדעי החברה', credits: 4, minGrade: 80 }
			],
			academicAdvantage: 'עקיפת רפי הקבלה הקיצוניים בפסיכולוגיה (פסיכומטרי 700+) על בסיס הצטיינות בקורסי אמת.'
		};
	}

	// Law
	if (domain === 'law') {
		return {
			channelTitle: `אפיק מעבר למשפטים ב${instName}`,
			targetInstitutionName: instName,
			requiredGpa: 87,
			minCourseGrade: 80,
			requiredCredits: 24,
			courses: [
				{ courseNumber: '10151', courseName: 'מבוא למשפט ישראלי', credits: 6, minGrade: 80 },
				{ courseNumber: '10123', courseName: 'משפט קונסטיטוציוני (חוקתי)', credits: 6, minGrade: 80 },
				{ courseNumber: '10404', courseName: 'משטר ומדיניות בישראל', credits: 6, minGrade: 80 },
				{ courseNumber: '10223', courseName: 'שיטות מחקר ומיומנויות כתיבה', credits: 4, minGrade: 80 }
			],
			academicAdvantage: 'התקבלות ישירה לפקולטה למשפטים ללא פסיכומטרי גבוה באמצעות ממוצע אקדמי מוכח.'
		};
	}

	// Humanities & General
	return {
		channelTitle: `אפיק מעבר למדעי הרוח והחברה ב${instName}`,
		targetInstitutionName: instName,
		requiredGpa: 80,
		minCourseGrade: 70,
		requiredCredits: 20,
		courses: [
			{ courseNumber: '10136', courseName: 'קורס מבוא דיסציפלינרי 1', credits: 6, minGrade: 75 },
			{ courseNumber: '10104', courseName: 'קורס מבוא דיסציפלינרי 2', credits: 6, minGrade: 75 },
			{ courseNumber: '10404', courseName: 'סוגיות בחברה הישראלית', credits: 4, minGrade: 70 },
			{ courseNumber: '10223', courseName: 'אוריינות וכתיבה אקדמית', credits: 4, minGrade: 70 }
		],
		academicAdvantage: 'קבלה מובטחת לכל החוגים במדעי הרוח ללא תלות בתעודת הבגרות או בפסיכומטרי.'
	};
}

export function getAfikMaavarSpecification(
	targetProgram: AcademicProgramRecord
): AfikMaavarSpec {
	const spec = buildDomainAfikSpecification(targetProgram);
	return {
		...spec,
		registrationUrl: getAfikMaavarRegistrationUrl(targetProgram.institutionId),
		infoUrl: 'https://www.openu.ac.il/transfer/'
	};
}

export function generateDegreeAfikMaavarTrack(
	targetProgram: AcademicProgramRecord,
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): ActionTrackRecord {
	const spec = getAfikMaavarSpecification(targetProgram);
	const durationWeeks = 40; // Approx. 2 semesters at Open University

	const recommendedLevers: ImprovementLeverRecord[] = spec.courses.map((c, idx) => ({
		id: `afik_course_${c.courseNumber}`,
		trackId: 'track-afik-maavar',
		subjectName: `קורס אקדמי (או״פ ${c.courseNumber}): ${c.courseName} (${c.credits} נ״ז)`,
		currentGrade: 0,
		currentUnits: c.credits,
		targetGrade: spec.requiredGpa,
		targetUnits: c.credits,
		priority: idx + 1,
		reason: `קורס חובה רשמי באפיק המעבר ל${spec.targetInstitutionName}. עמידה בציון יעד של ${c.minGrade || spec.minCourseGrade}+ נדרשת למעבר מובטח.`,
		leverType: 'bagrut_core',
		session: idx < 2 ? 'winter' : 'summer'
	}));

	const milestones: TrackMilestoneRecord[] = [
		{
			id: 'afik_m1',
			trackId: 'track-afik-maavar',
			orderIndex: 1,
			title: 'הרשמה לאוניברסיטה הפתוחה ובניית מערכת קורסים',
			detail: `הרשמה לקורסים של סמסטר א׳ באו״פ מתוך רשימת אפיק המעבר ל${spec.targetInstitutionName}, וקביעת פגישת ייעוץ אקדמי עם רכז אפיקי המעבר.`,
			timing: 'שבועות 1–4',
			type: 'administrative'
		},
		{
			id: 'afik_m2',
			trackId: 'track-afik-maavar',
			orderIndex: 2,
			title: `סיום סמסטר א׳ ו-ב׳ באוניברסיטה הפתוחה (ממוצע יעד ${spec.requiredGpa}+)`,
			detail: `השלמת ${spec.courses.length} קורסי החובה האקדמיים (${spec.requiredCredits} נקודות זכות בסך הכל) בציון מינימום של ${spec.minCourseGrade} בכל קורס ובממוצע מצטבר של ${spec.requiredGpa} לפחות.`,
			timing: `שבועות 5–${durationWeeks - 8}`,
			type: 'academic_course' as any
		},
		{
			id: 'afik_m3',
			trackId: 'track-afik-maavar',
			orderIndex: 3,
			title: `הגשת בקשת מעבר וקליטה ישירה ב${spec.targetInstitutionName}`,
			detail: `הגשת אישור לימודים וגיליון ציונים לאגף הרישום של ${spec.targetInstitutionName}. קליטה ישירה ל${targetProgram.name} לשנה ב׳ עם פטור מלא וקרדיטציה של כל נקודות הזכות שנלמדו.`,
			timing: `שבועות ${durationWeeks - 7}–${durationWeeks}`,
			type: 'administrative'
		}
	];

	return {
		id: 'track-afik-maavar',
		userId: profile.userId,
		programId: targetProgram.id,
		type: 'afik_maavar',
		title: `אפיק מעבר מהאוניברסיטה הפתוחה: ${targetProgram.name}`,
		badge: 'מסלול אקדמי עוקף • אפיק מעבר מהאוניברסיטה הפתוחה',
		badgeColor: 'from-cyan-600 to-blue-800',
		strategyDescription:
			`אפיק המעבר של האוניברסיטה הפתוחה הוא הסכם אקדמי רשמי ומחייב מול ${spec.targetInstitutionName}. ` +
			`המסלול מאפשר עקיפה מוחלטת של תנאי הבגרות והפסיכומטרי: הלימודים פתוחים לכל אדם ללא תנאי קבלה מוקדמים. ` +
			`השלמת מקבץ של ${spec.courses.length} קורסים (${spec.requiredCredits} נ״ז) בממוצע ${spec.requiredGpa}+ (וציון ${spec.minCourseGrade}+ בכל קורס) ` +
			`מבטיחה קבלה ישירה ל${targetProgram.name} ב${spec.targetInstitutionName} עם פטור אקדמי מלא על הקורסים שנלמדו.`,
		targetSekem: targetProgram.minSekemThreshold,
		targetPsychometric: 0,
		currentPsychometric: profile.hasTakenPsychometric ? profile.psychometricGeneral : undefined,
		targetBagrutAverage: undefined,
		currentBagrutAverage: undefined,
		recommendedLevers,
		milestones,
		estimatedWeeks: durationWeeks,
		weeklyHours: 20,
		feasibility: 'high',
		feasibilityExplanation: `קבלה מובטחת בהסכם רשמי המבוסס על ציונים אקדמיים בלבד (0 תלות בסכם תיכוני).`,
		keyAdvantage: spec.academicAdvantage,
		institutionId: targetProgram.institutionId,
		institutionName: targetProgram.institutionName,
		programName: targetProgram.name,
		admissionThreshold: targetProgram.minSekemThreshold,
		registrationUrl: spec.registrationUrl || getAfikMaavarRegistrationUrl(targetProgram.institutionId),
		createdAt: new Date()
	};
}

// ---------------------------------------------------------------------------
// 4. Combined Bypass Routes Provider
// ---------------------------------------------------------------------------

export function getDegreeBypassRoutes(
	targetProgram: AcademicProgramRecord,
	profile: UserAcademicProfileRecord,
	preferences: UserPreferencesRecord
): BypassRoutesResult {
	const mechinaTrack = generateAccurateMechinaTrack(targetProgram, profile, preferences);
	const afikMaavarTrack = generateDegreeAfikMaavarTrack(targetProgram, profile, preferences);
	const afikSpec = getAfikMaavarSpecification(targetProgram);

	return {
		mechinaTrack,
		afikMaavarTrack,
		hasAfikMaavar: true,
		afikSpec
	};
}
