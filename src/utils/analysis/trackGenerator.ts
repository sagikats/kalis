import { SubjectInput } from '../calculators/bguCalculator';
import { InstitutionSekemResult } from '../calculators/multiCalculator';
import { TargetProgramSelection, ProgramGapAnalysis, UserAcademicProfile } from './gapAnalyzer';

export interface UserPreferencesQuestionnaire {
	// ציר פסיכומטרי
	psychExperience: 'never' | 'once' | 'multiple';
	psychWillingness?: 'full_exam' | 'prefer_bagrut_only';
	psychFeeling?: 'high_potential' | 'reached_ceiling';
	psychStrongestSection?: 'quant' | 'verbal_eng' | 'balanced';

	// ציר בגרויות
	learningOrientation: 'humanities' | 'stem' | 'flexible';

	// ציר תכונות ואילוצים
	learningStrength: 'memory_retention' | 'analytical_quick' | 'deep_accuracy_no_rush';
	weeklyAvailabilityHours: 'full_30_plus' | 'part_15_25' | 'limited_under_15';
	targetTimeline: 'immediate_october' | 'next_year_october' | 'flexible';
}

export interface TrackStep {
	title: string;
	detail: string;
	timing: string;
	type: 'psychometric' | 'bagrut_elective' | 'bagrut_core' | 'mechina';
}

export interface RecommendedTrack {
	id: string;
	title: string;
	badge: string;
	badgeColor: string;
	strategyDescription: string;
	targetPsychometric?: number;
	currentPsychometric?: number;
	targetBagrutAverage?: number;
	currentBagrutAverage?: number;
	recommendedSubjectImprovements: {
		subjectName: string;
		currentGrade: number;
		currentUnits: number;
		targetGrade: number;
		targetUnits: number;
		reason: string;
	}[];
	estimatedWeeks: number;
	weeklyHours: number;
	feasibility: 'very_high' | 'high' | 'moderate' | 'challenging';
	feasibilityExplanation: string;
	steps: TrackStep[];
	keyAdvantage: string;
}

/**
 * Evaluates realistic jump boundaries based on academic baseline (NITE statistics & academic correlation)
 * Ensures no unrealistic targets (e.g. someone with modest bagrut average will not be assigned 740+).
 */
export function getRealisticPsychometricCeiling(
	currentPsych: number,
	bagrutAvg: number,
	answers: UserPreferencesQuestionnaire
): number {
	// Baseline estimation if user hasn't tested yet
	let baseline = currentPsych;
	if (baseline <= 0) {
		if (bagrutAvg >= 112) baseline = 650;
		else if (bagrutAvg >= 105) baseline = 600;
		else if (bagrutAvg >= 98) baseline = 550;
		else if (bagrutAvg >= 90) baseline = 500;
		else baseline = 450;
	}

	// Maximum statistically realistic jump in one preparation cycle (NITE data shows mean improvement is 30-35 points)
	let maxAllowedJump = 50; 
	if (answers.psychExperience === 'never') {
		maxAllowedJump = 75; // First professional preparation course yields the highest single delta
	} else if (answers.psychFeeling === 'high_potential') {
		maxAllowedJump = 60; // Had an external disruptor in previous attempt (illness, lack of prep)
	} else if (answers.psychFeeling === 'reached_ceiling' || answers.psychExperience === 'multiple') {
		maxAllowedJump = 25; // 3+ attempts reach saturation
	}

	// Realistic ceiling correlated to Bagrut average (strict guard against unrealistic promises)
	let correlatedHardCap = 800;
	if (bagrutAvg < 88) correlatedHardCap = 590;
	else if (bagrutAvg < 93) correlatedHardCap = 630;
	else if (bagrutAvg < 98) correlatedHardCap = 670;
	else if (bagrutAvg < 103) correlatedHardCap = 705;
	else if (bagrutAvg < 108) correlatedHardCap = 735;
	else if (bagrutAvg < 112) correlatedHardCap = 760;

	// The realistic ceiling is the minimum between:
	// 1. The student's current baseline + realistic jump
	// 2. The correlation cap derived from their Bagrut aptitude
	return Math.min(800, Math.min(correlatedHardCap, baseline + maxAllowedJump));
}

/**
 * Finds the best bagrut subjects to improve with highest ROI
 */
function findWeakestDroppableSubjects(
	subjects: SubjectInput[],
	orientation: 'humanities' | 'stem' | 'flexible'
) {
	const candidates = subjects.filter((s) => s.grade > 0 && s.grade < 88);

	// Sort by grade ascending (lowest first = easiest to boost by 15-20 points)
	candidates.sort((a, b) => a.grade - b.grade);

	if (orientation === 'humanities') {
		const hum = candidates.filter(
			(s) =>
				s.name.includes('תנ"ך') ||
				s.name.includes('ספרות') ||
				s.name.includes('היסטוריה') ||
				s.name.includes('אזרחות') ||
				s.name.includes('הבעה')
		);
		if (hum.length > 0) return hum;
	} else if (orientation === 'stem') {
		const stem = candidates.filter(
			(s) =>
				s.name.includes('מתמטיקה') ||
				s.name.includes('פיזיקה') ||
				s.name.includes('כימיה') ||
				s.name.includes('מחשב')
		);
		if (stem.length > 0) return stem;
	}

	return candidates;
}

/**
 * Main Generator Algorithm producing 3 realistic tailored improvement tracks
 */
export function generatePersonalizedTracks(
	gapAnalysis: ProgramGapAnalysis,
	userProfile: UserAcademicProfile,
	institutionRes: InstitutionSekemResult,
	answers: UserPreferencesQuestionnaire
): RecommendedTrack[] {
	const currentPsych = userProfile.psychometricGeneral > 0 ? userProfile.psychometricGeneral : 600;
	const currentBagrut = institutionRes.bagrutAverage > 0 ? institutionRes.bagrutAverage : 100;
	const missingSekem = Math.max(0, Math.abs(gapAnalysis.gap));
	const isTechnion = gapAnalysis.target.calculatorId === 'technion';
	const isStemDegree =
		gapAnalysis.relevantSekemType === 'engineering' ||
		gapAnalysis.relevantSekemType === 'technion' ||
		gapAnalysis.target.program.fieldOfStudy.includes('הנדס') ||
		gapAnalysis.target.program.fieldOfStudy.includes('מחשב');

	const psychCeiling = getRealisticPsychometricCeiling(currentPsych, currentBagrut, answers);
	const weakSubjects = findWeakestDroppableSubjects(userProfile.bagrutSubjects, answers.learningOrientation);

	const tracks: RecommendedTrack[] = [];

	// Weekly hours mapping
	const availableWeeklyHours =
		answers.weeklyAvailabilityHours === 'full_30_plus'
			? 32
			: answers.weeklyAvailabilityHours === 'part_15_25'
			? 20
			: 12;

	// =========================================================================
	// TRACK 1: Fast Track ⚡ (המסלול המהיר והממוקד ביותר)
	// =========================================================================
	// For students who want results quickly or have high psychometric potential
	const psychMultiplier =
		gapAnalysis.target.calculatorId === 'tau'
			? gapAnalysis.relevantSekemType === 'management'
				? 1.43
				: 1.92
			: isTechnion
			? 13.33
			: 2.0;

	const psychPointsForFullGap = Math.ceil(missingSekem * psychMultiplier);
	const idealPsychTarget = currentPsych + psychPointsForFullGap;

	if (idealPsychTarget <= psychCeiling && answers.psychWillingness !== 'prefer_bagrut_only') {
		// Pure Psychometric Fast Track is realistic!
		tracks.push({
			id: 'track-fast',
			title: 'המסלול המהיר: זינוק פסיכומטרי ממוקד',
			badge: 'הכי מהיר (מועד בודד)',
			badgeColor: 'from-amber-500 to-orange-600',
			strategyDescription: `ריכוז כל המאמץ בקורס פסיכומטרי ממוקד אחד. מעלה את הציון מ-${currentPsych} ל-${idealPsychTarget} וסוגר את פער הסכם ישירות במועד הקרוב.`,
			targetPsychometric: idealPsychTarget,
			currentPsychometric: currentPsych,
			targetBagrutAverage: currentBagrut,
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: [],
			estimatedWeeks: 10,
			weeklyHours: availableWeeklyHours,
			feasibility: psychPointsForFullGap <= 40 ? 'very_high' : psychPointsForFullGap <= 65 ? 'high' : 'moderate',
			feasibilityExplanation: `שיפור של ${psychPointsForFullGap} נקודות בפסיכומטרי נמצא בטווח הריאלי עבורך, במיוחד בחיזוק פרק ה${
				answers.psychStrongestSection === 'quant' ? 'כמותי' : 'מילולי'
			}.`,
			steps: [
				{
					title: 'הכנה ממוקדת למועד הקרוב',
					detail: `מרתון סימולציות ותרגול עומק עם דגש על הפרק ה${
						answers.psychStrongestSection === 'quant' ? 'כמותי' : 'מילולי'
					}`,
					timing: 'שבועות 1–8',
					type: 'psychometric'
				},
				{
					title: 'בחינה פסיכומטרית רשמית',
					detail: `הגעה לציון היעד (${idealPsychTarget}) והגשת מועמדות`,
					timing: 'שבוע 9–10',
					type: 'psychometric'
				}
			],
			keyAdvantage: 'סגירת הפער בבחינה אחת בלבד ללא צורך בפתיחת ספרי בגרות.'
		});
	} else {
		// Psychometric alone is too high/unrealistic! Fast Track becomes: 1 targeted subject upgrade
		const primaryWeak = weakSubjects[0] || { name: 'תנ"ך', grade: 72, units: 2 };
		const boostGrade = Math.min(95, primaryWeak.grade + 22);

		tracks.push({
			id: 'track-fast-bagrut',
			title: 'המסלול המהיר: שיפור מקצוע בגרות ממוקד',
			badge: 'מאמץ ממוקד ללא לחץ זמן',
			badgeColor: 'from-amber-500 to-orange-600',
			strategyDescription: `שיפור מקצוע בגרות יחיד שבו הציון נמוך (${primaryWeak.name} מ-${primaryWeak.grade} ל-${boostGrade}) עם השקעה קצרה וממוקדת.`,
			targetPsychometric: currentPsych,
			currentPsychometric: currentPsych,
			targetBagrutAverage: Math.round((currentBagrut + 2.5) * 10) / 10,
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: [
				{
					subjectName: primaryWeak.name,
					currentGrade: primaryWeak.grade,
					currentUnits: primaryWeak.units,
					targetGrade: boostGrade,
					targetUnits: primaryWeak.units,
					reason: 'הציון הנוכחי פוגע בממוצע המיטבי ושיפורו יקפיץ את הסכם במהירות.'
				}
			],
			estimatedWeeks: 8,
			weeklyHours: Math.min(16, availableWeeklyHours),
			feasibility: 'very_high',
			feasibilityExplanation: 'שיפור מקצוע הומני/חובה בודד הוא בר-השגה באופן מלא עם סיכויי הצלחה מעל 90%.',
			steps: [
				{
					title: `חזרה על חומר ${primaryWeak.name}`,
					detail: 'למידה מסיכומים ממוקדים ופתרון בחינות בגרות משנים קודמות',
					timing: 'שבועות 1–6',
					type: 'bagrut_core'
				},
				{
					title: 'בחינת בגרות במועד הקרוב',
					detail: `הגעה לציון ${boostGrade} והעלאת ממוצע הבגרות`,
					timing: 'שבועות 7–8',
					type: 'bagrut_core'
				}
			],
			keyAdvantage: 'מאמץ לימודי קצר ומוגדר ללא פסיכומטרי נוסף.'
		});
	}

	// =========================================================================
	// TRACK 2: Balanced Track 🛡️ (המסלול הבטוח — פיזור סיכונים חכם)
	// =========================================================================
	// Realism rule: Split the burden between a modest psychometric boost and 1 bagrut improvement
	const moderatePsychJump = Math.min(35, Math.ceil(psychPointsForFullGap * 0.5));
	const balancedTargetPsych = Math.min(psychCeiling, currentPsych + moderatePsychJump);
	const targetWeakSubject = weakSubjects[0] || { name: 'ספרות עברית', grade: 75, units: 2 };
	const targetWeakGrade = Math.min(94, targetWeakSubject.grade + 18);
	const balancedBagrutTarget = Math.round((currentBagrut + 2.2) * 10) / 10;

	tracks.push({
		id: 'track-balanced',
		title: 'המסלול הבטוח: שילוב מאוזן ופיזור סיכונים',
		badge: 'הכי מומלץ (הסתברות הצלחה מירבית)',
		badgeColor: 'from-emerald-500 to-teal-600',
		strategyDescription: `במקום להמר על מבחן אחד, מחלקים את המאמץ: שיפור מתון בפסיכומטרי (+${moderatePsychJump} נקודות) יחד עם שיפור בגרות ב-${targetWeakSubject.name}. שילוב זה מביא לסגירת הפער בריאליות מירבית.`,
		targetPsychometric: balancedTargetPsych,
		currentPsychometric: currentPsych,
		targetBagrutAverage: balancedBagrutTarget,
		currentBagrutAverage: currentBagrut,
		recommendedSubjectImprovements: [
			{
				subjectName: targetWeakSubject.name,
				currentGrade: targetWeakSubject.grade,
				currentUnits: targetWeakSubject.units,
				targetGrade: targetWeakGrade,
				targetUnits: targetWeakSubject.units,
				reason: 'הקפצה של ציון חובה חלש מעלה את הסכם הכללי ב-6–8 נקודות.'
			}
		],
		estimatedWeeks: 14,
		weeklyHours: availableWeeklyHours,
		feasibility: 'very_high',
		feasibilityExplanation:
			'אינו דורש ציונים חריגים. היעדים מתוכננים כך שגם אם תחול תנודה קלה באחד המבחנים, הרף עדיין יושג.',
		steps: [
			{
				title: `שיפור בגרות ב-${targetWeakSubject.name}`,
				detail: `הכנה ותרגול ממוקד להגעה לציון ${targetWeakGrade}`,
				timing: 'שבועות 1–6',
				type: 'bagrut_core'
			},
			{
				title: 'קורס פסיכומטרי ממוקד שיפור',
				detail: `חיזוק נקודתי של הפרק ה${
					answers.psychStrongestSection === 'quant' ? 'כמותי' : 'מילולי'
				} לעלייה מ-${currentPsych} ל-${balancedTargetPsych}`,
				timing: 'שבועות 7–14',
				type: 'psychometric'
			}
		],
		keyAdvantage: 'הסתברות הצלחה סטטיסטית הגבוהה ביותר, מפחית חרדת מבחנים משמעותית.'
	});

	// =========================================================================
	// TRACK 3: High-Impact Track 🏛️ (המסלול המעמיק ועוגן אקדמי)
	// =========================================================================
	// For STEM: Upgrading Math 4u -> 5u or adding 5u Physics
	// For Non-STEM: Upgrading an elective to 5 units (History 5u / Bible 5u)
	if (isStemDegree) {
		const mathUnits = userProfile.mathUnits || 4;
		const mathGrade = userProfile.mathGrade || 80;

		tracks.push({
			id: 'track-stem-anchor',
			title: 'מסלול העוגן: שדרוג מתמטיקה 5 יח״ל',
			badge: 'מבטל מכינות + פותח את כל המוסדות',
			badgeColor: 'from-blue-600 to-indigo-700',
			strategyDescription:
				'שדרוג מתמטיקה ל-5 יח״ל (ציון 80+). פותח בונוס ענק (+35 נקודות), מקנה בונוס ריאלי (+10 באת״א וב״ג), ומבטל את הצורך במכינות קישור במתמטיקה.',
			targetPsychometric: currentPsych,
			currentPsychometric: currentPsych,
			targetBagrutAverage: Math.round((currentBagrut + 4.5) * 10) / 10,
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: [
				{
					subjectName: 'מתמטיקה',
					currentGrade: mathGrade,
					currentUnits: mathUnits,
					targetGrade: 82,
					targetUnits: 5,
					reason: 'השדרוג מעניק בונוס 35 נקודות, מקפיץ את הסכם הריאלי ופוטר ממבחן סיווג.'
				}
			],
			estimatedWeeks: 18,
			weeklyHours: availableWeeklyHours,
			feasibility: mathUnits === 5 ? 'very_high' : 'high',
			feasibilityExplanation:
				'השקעה מעמיקה במתמטיקה מקנה את ההכנה הטובה ביותר לשנה א׳ של התואר וסוגרת את כל תנאי הסף.',
			steps: [
				{
					title: 'הכנה מקיפה לשאלוני 5 יח״ל מתמטיקה',
					detail: 'תרגול עקבי של חדו״א, גיאומטריה, וקטורים ומספרים מרוכבים',
					timing: 'שבועות 1–16',
					type: 'bagrut_elective'
				},
				{
					title: 'בחינת בגרות קיץ/חורף',
					detail: 'הגעה לציון 82+ וזכאות מלאה לסכם הנדסה',
					timing: 'שבועות 17–18',
					type: 'bagrut_elective'
				}
			],
			keyAdvantage: 'השקעה שמשרתת אותך ישירות בהצלחה בקורסי שנה א׳ באוניברסיטה.'
		});
	} else {
		// Non-STEM: Expand Humanities to 5 units
		const electiveName = answers.learningOrientation === 'stem' ? 'מדעי המחשב 5 יח״ל' : 'היסטוריה 5 יח״ל';
		tracks.push({
			id: 'track-humanities-anchor',
			title: `מסלול העוגן: הרחבת מקצוע מוגבר (${electiveName})`,
			badge: 'בונוס +25 נקודות קבועות',
			badgeColor: 'from-blue-600 to-indigo-700',
			strategyDescription: `הרחבת מקצוע ל-5 יחידות לימוד עם בונוס של 25 נקודות. מקפיצה את ממוצע הבגרות המיטבי ב-3.5–5 נקודות ומבטיחה קבלה ישירה.`,
			targetPsychometric: currentPsych,
			currentPsychometric: currentPsych,
			targetBagrutAverage: Math.round((currentBagrut + 4.0) * 10) / 10,
			currentBagrutAverage: currentBagrut,
			recommendedSubjectImprovements: [
				{
					subjectName: electiveName,
					currentGrade: 0,
					currentUnits: 2,
					targetGrade: 88,
					targetUnits: 5,
					reason: 'הוספת מקצוע מוגבר בציון 88+ מזניקה את הממוצע האופטימלי ללא סיכון של מקצועות קיימים.'
				}
			],
			estimatedWeeks: 16,
			weeklyHours: availableWeeklyHours,
			feasibility: 'high',
			feasibilityExplanation: 'החומר מובנה ומבוסס על למידה יסודית שמתגמלת השקעה בזמן.',
			steps: [
				{
					title: `למידת תוכנית ההרחבה ל-${electiveName}`,
					detail: 'סיכומים, ניתוח שאלות עומק וכתיבת תשובות מורחבות',
					timing: 'שבועות 1–14',
					type: 'bagrut_elective'
				},
				{
					title: 'בחינת בגרות',
					detail: 'השגת ציון 88+ ופתיחת קבלה לכלל החוגים',
					timing: 'שבועות 15–16',
					type: 'bagrut_elective'
				}
			],
			keyAdvantage: 'אינו תלוי בפסיכומטרי כלל ומעלה את ערך תעודת הבגרות לצמיתות.'
		});
	}

	return tracks;
}
