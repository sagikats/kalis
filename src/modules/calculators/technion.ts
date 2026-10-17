/**
 * Pure Technion (הטכניון - מכון טכנולוגי לישראל) Admission Calculator
 * Official Formula: S = 0.5 * D + 0.075 * P - 19 (Scale 0-100), D capped at 119
 * Sources: admissions.technion.ac.il (summary-score-calculation-table, calculation-of-the-median-grade, kizad-mehasvim)
 * Subagent 3: Data Verification & Institution Calculators
 */

import type {
	CalculatorSubject,
	OptimalBagrutResult,
	InstitutionCalculatorInput,
	InstitutionCalculatorResult
} from './types';
import { computeOptimalAverage } from './optimalAverage';
import {
	isArabic,
	isBible,
	isCivics,
	isEnglish,
	isHebrewExpression,
	isHistory,
	isJewishThought,
	isMath
} from './subjectMatchers';
import technionBonusTable from '../../data/sources/technion-bonus-table-2026-10-17.json';

const TECHNION_MANDATORY_SUBJECTS = [
	'מתמטיקה',
	'אנגלית',
	'אזרחות',
	'ידיעת העם',
	'הבעה עברית',
	'לשון',
	'היסטוריה',
	'ספרות',
	'תנ״ך',
	'תנ"ך'
];

/** Technion caps the optimal bagrut average at 119 (admissions.technion.ac.il — נוסחאות הסכם). */
export const TECHNION_MAX_AVERAGE = 119;

export function isTechnionMandatorySubject(name: string): boolean {
	const trimmed = name.trim();
	return TECHNION_MANDATORY_SUBJECTS.some((m) => trimmed.includes(m));
}

/**
 * Technion bonus subjects, from the official calculator's full subject list (admissions.technion.ac.il/calculator,
 * 2026-10-17; snapshot: src/data/sources/technion-bonus-table-2026-10-17.json — every option run at 5u and 4u).
 * Matching is by exact name per "/"-separated part, ignoring "(…)": substring matching gave +25 to subjects such as
 * "ע''ג בביולוגיה", "מיקרוביולוגיה", "כימיה טכנולוגית", "פיזיקה מחקרית" and "ספרות התאטרון", which officially get +20.
 */
const TECHNION_SCIENCES = ['פיזיקה', 'פיסיקה', 'כימיה', 'ביולוגיה'];
/** Technological subjects with the science bonus (5u +25, +30 inside the cluster). Robotics and cyber are not on the list. */
const TECHNION_TECH_SUBJECTS = ['מדעי המחשב', 'אלקטרוניקה ומחשבים', 'ביוטכנולוגיה', 'מערכות ביוטכנולוגיה', 'מדעי ההנדסה', 'בקרת מכונות'];
/** Literature in the Technion's mandatory section (5u +25) — not "ספרות התאטרון". */
const TECHNION_LITERATURE = ['ספרות', 'ספרות עברית'];

const nameParts = (name: string) => name.split('/').map((part) => part.replace(/\([^)]*\)/g, '').trim());
const partIn = (name: string, list: string[]) => nameParts(name).some((part) => list.includes(part));

export function isTechnionTechSubject(name: string): boolean {
	return partIn(name, TECHNION_TECH_SUBJECTS);
}

function isTechnionScience(name: string): boolean {
	return partIn(name, TECHNION_SCIENCES);
}

/**
 * Enhanced science/technology cluster (מצרף מדעי/טכנולוגי): 5u math plus, at 5 units,
 * either two of physics/chemistry/biology or one of them and a recognized technological subject.
 */
export function detectTechnionScienceCluster(subjects: CalculatorSubject[]): boolean {
	return selectTechnionScienceCluster(subjects).size === 2;
}

/**
 * Select the enlarged-bonus pair from this retained subset, not the original certificate.
 * With equal five-unit weights, the strongest valid pair maximizes its weighted contribution.
 * At least one member must be a science; the other may be science or recognized technology.
 * Equal-grade member identity follows input order; official tie identity is not established.
 */
function selectTechnionScienceCluster(subjects: CalculatorSubject[]): Set<CalculatorSubject> {
	const eligible = subjects.filter((s) => s.units === 5 && Number.isFinite(s.grade) && s.grade >= 60 && s.grade <= 100);
	if (!eligible.some((s) => isMath(s.name))) return new Set();
	const members = eligible.filter((s) => isTechnionScience(s.name) || isTechnionTechSubject(s.name));
	const science = members.filter((s) => isTechnionScience(s.name)).sort((a, b) => b.grade - a.grade)[0];
	if (!science) return new Set();
	const other = members.filter((s) => s !== science).sort((a, b) => b.grade - a.grade)[0];
	return other ? new Set([science, other]) : new Set();
}

/**
 * Official Technion bonus table (admissions.technion.ac.il — מקדמי הטבה):
 * granted only for a grade of 60+; math 5u +30;
 * English, literature, Bible, history, Arabic 5u +25 — confirmed on the official calculator;
 * physics/chemistry/biology/recognized tech 5u +25 (+30 inside the science cluster);
 * every other bonus subject at 5u (e.g. civics, Hebrew expression, geography) +20; any bonus subject at 4u +10.
 */
/**
 * The elective subjects on the official calculator's list, with their 5u / 4u bonus (snapshot 2026-10-17).
 * "מקצוע אחר שאינו ברשימה" gets 0 there, and the bonus page says so in writing ("מקצוע שאינו מופיע בטבלאות לא יקבל בונוס"),
 * so a subject that is neither in the mandatory section nor on this list gets no bonus at the Technion.
 */
const TECHNION_ELECTIVES = new Map<string, { bonus5: number; bonus4: number }>(
	technionBonusTable.electives.filter((r) => !r.name.includes('שאינ')).map((r) => [r.name, { bonus5: r.bonus5, bonus4: r.bonus4 }])
);

/**
 * Our catalog's names for subjects that are on the Technion's list under another name (per "/"-separated part,
 * after dropping "(…)"). A catalog subject with no entry here and no exact match gets no bonus, like the calculator.
 */
const TECHNION_ALIASES: Record<string, string> = {
	'איטלקית': 'שפה זרה', 'אמהרית': 'שפה זרה', 'גרמנית': 'שפה זרה', 'טורקית': 'שפה זרה', 'יפנית': 'שפה זרה',
	'סינית': 'שפה זרה', 'ספרדית': 'שפה זרה', 'צרפתית': 'שפה זרה', 'רוסית': 'שפה זרה',
	'אמנות חזותית': 'אמנות',
	'כלכלה': "מדעי החברה - חוק ומשפט (שילוב של כלכלה/ מדעי המדינה/ ניהול/ סוציולוגיה וכו')",
	'מדעי המדינה וממשל': "מדעי החברה - חוק ומשפט (שילוב של כלכלה/ מדעי המדינה/ ניהול/ סוציולוגיה וכו')",
	'סוציולוגיה': "מדעי החברה - חוק ומשפט (שילוב של כלכלה/ מדעי המדינה/ ניהול/ סוציולוגיה וכו')",
	'מדעי החברה': "מדעי החברה - חוק ומשפט (שילוב של כלכלה/ מדעי המדינה/ ניהול/ סוציולוגיה וכו')",
	'פסיכולוגיה וסוציולוגיה': "מדעי החברה - חוק ומשפט (שילוב של כלכלה/ מדעי המדינה/ ניהול/ סוציולוגיה וכו')",
	'משפטים': "מדעי החברה - חוק ומשפט (שילוב של כלכלה/ מדעי המדינה/ ניהול/ סוציולוגיה וכו')",
	'קרימינולוגיה ומשפטים': "מדעי החברה - חוק ומשפט (שילוב של כלכלה/ מדעי המדינה/ ניהול/ סוציולוגיה וכו')",
	'כלכלה וניהול': 'מינהל וכלכלה', 'כלכלה ומנהל עסקים': 'מינהל וכלכלה',
	'לימודי ארץ ישראל וארכיאולוגיה': 'לימודי ארץ ישראל',
	'לימודי המזרח התיכון והאסלאם': 'תולדות הערבים והאיסלאם (בבתי-ספר יהודיים)',
	'מזרחנות': 'תולדות הערבים והאיסלאם (בבתי-ספר יהודיים)',
	'מדעי החקלאות ואגרוטק': 'מדעי החיים והחקלאות',
	'מדעי כדור הארץ וגיאולוגיה': 'מדעי כדור הארץ',
	'מוזיקה': 'מוסיקה', 'רסיטל מוזיקה': 'מוסיקה רסיטל',
	'רסיטל מחול': 'מחול',
	'מערכות רפואיות': 'מדעי הבריאות',
	'מערכות תעופה וחלל': 'מערכות תעופה',
	'ניהול משאבי אנוש וארגון': 'ניהול משאבי אנוש',
	'ניהול עסקי וחשבונאות': 'חשבונאות',
	'קולנוע ומדיה': 'אמנות הקולנוע', 'תקשורת וקולנוע': 'אמנות הקולנוע',
	'תיאטרון': 'אמנות התאטרון', 'ספרות התיאטרון': 'ספרות התאטרון',
	'תושב"ע': "תושב''ע", 'תושב״ע': "תושב''ע",
	'תקשורת אלקטרונית וטלקומוניקציה': 'טלקומוניקציה',
	'תקשורת ורדיו': 'תקשורת', 'אמנות השידור': 'תקשורת',
	'גאוגרפיה': 'גיאוגרפיה',
	'עבודת גמר מחקרית': 'עבודת גמר שברשימה'
};

/** The official 5u / 4u bonus of an elective on the Technion's list, or undefined when it isn't on the list. */
function technionElectiveBonus(name: string): { bonus5: number; bonus4: number } | undefined {
	// Official names may hold "(…)" and even "/" ("מדעי החברה - חוק ומשפט (שילוב של כלכלה/ …)") — try the whole name first
	const whole = TECHNION_ELECTIVES.get(name.trim());
	if (whole) return whole;
	let best: { bonus5: number; bonus4: number } | undefined;
	for (const part of nameParts(name)) {
		const entry = TECHNION_ELECTIVES.get(part) ?? TECHNION_ELECTIVES.get(TECHNION_ALIASES[part] ?? '');
		if (entry && (!best || entry.bonus5 > best.bonus5)) best = entry;
	}
	return best;
}

/** Subjects of the calculator's mandatory section that get the ordinary bonus (5u +20, 4u +10). */
function isTechnionMandatoryOrdinary(name: string): boolean {
	return isCivics(name) || isHebrewExpression(name) || isJewishThought(name) || name.includes('ידיעת העם') || name.includes('תולדות הערבים') || name.includes('דרוז') || name.includes('נצרות') || name.includes('נוצרית');
}

export function getTechnionBonus(subject: CalculatorSubject, hasScienceCluster: boolean): number {
	if (subject.grade < 60) return 0;
	// Parenthesized notes ("(באנגלית)", "(מוגבר 5 יח״ל)") must not decide the subject
	const n = subject.name.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();

	if (subject.units < 4) return 0;
	const five = subject.units >= 5;

	if (isMath(n)) return five ? 30 : 10;
	if (isEnglish(n) || partIn(n, TECHNION_LITERATURE) || isBible(n) || isHistory(n) || isArabic(n)) return five ? 25 : 10;
	if (five && (isTechnionScience(n) || isTechnionTechSubject(n))) return hasScienceCluster ? 30 : 25;
	if (isTechnionMandatoryOrdinary(n)) return five ? 20 : 10;

	// Electives: the official list's bonus; a subject that isn't on the list gets none (like the calculator)
	const elective = technionElectiveBonus(subject.name);
	if (!elective) return 0;
	return five ? elective.bonus5 : elective.bonus4;
}

/** Math counts double (4u = 8, 5u = 10) for all tracks except architecture. */
function getTechnionWeight(subject: CalculatorSubject): number {
	return isMath(subject.name) && subject.units >= 4 ? subject.units * 2 : subject.units;
}

export function calculateTechnionOptimalBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	const activeSubs = (subjects || []).filter((s) => s.units > 0 && s.grade > 0);
	const pairCache = new WeakMap<CalculatorSubject[], Set<CalculatorSubject>>();
	const selectedPair = (included: CalculatorSubject[]) => {
		let pair = pairCache.get(included);
		if (!pair) {
			pair = selectTechnionScienceCluster(included);
			pairCache.set(included, pair);
		}
		return pair;
	};

	const result = computeOptimalAverage(subjects, {
		isMandatory: isTechnionMandatorySubject,
		getBonus: (s, included = activeSubs) => getTechnionBonus(s, selectedPair(included).has(s)),
		getWeight: getTechnionWeight,
		cap: TECHNION_MAX_AVERAGE,
		decimals: null,
		dropReason: 'השמטה חוקית: שקלול המקצוע הוריד את הממוצע האופטימלי'
	});

	return {
		...result,
		rawAverage: result.average,
		average: Math.round(result.average * 10) / 10,
		hasScienceCluster: selectedPair(result.includedSubjects).size === 2
	};
}

/**
 * Architecture and landscape architecture: same bonuses and drops, but math is not doubled
 * (official calculator, "חישוב סכם לארכיטקטורה" — math 5u is weighted 5, 2026-10-17).
 */
export function calculateTechnionArchitectureBagrut(subjects: CalculatorSubject[]): OptimalBagrutResult {
	const activeSubs = (subjects || []).filter((s) => s.units > 0 && s.grade > 0);
	const result = computeOptimalAverage(subjects, {
		isMandatory: isTechnionMandatorySubject,
		getBonus: (s, included = activeSubs) => getTechnionBonus(s, selectTechnionScienceCluster(included).has(s)),
		getWeight: (s) => s.units,
		cap: TECHNION_MAX_AVERAGE,
		decimals: null,
		dropReason: 'השמטה חוקית: שקלול המקצוע הוריד את הממוצע האופטימלי'
	});
	return { ...result, rawAverage: result.average, average: Math.round(result.average * 10) / 10 };
}

/**
 * Entrance-exam sekem formulas, from the official calculator's code (admissions.technion.ac.il/calculator,
 * Gravity Forms 73 and 74, one decimal), 2026-10-17:
 *   architecture: 0.7 × (0.1·D + 0.09·P + 15) + 0.3·E          (exam scale 0–140)
 *   landscape:    0.65 × (0.412·D + 0.08·P − 13) + 0.35·E − 1.5 (exam scale 0–123)
 */
const ENTRANCE_EXAM_FORMULA = {
	architecture: { base: (d: number, p: number) => 0.7 * (0.1 * d + 0.09 * p + 15), examWeight: 0.3 },
	landscape: { base: (d: number, p: number) => 0.65 * (0.412 * d + 0.08 * p - 13) - 1.5, examWeight: 0.35 }
} as const;

export type TechnionEntranceExamKind = keyof typeof ENTRANCE_EXAM_FORMULA;

export function calculateTechnionEntranceExamSekem(kind: TechnionEntranceExamKind, bagrutAverage: number, psychometric: number, exam: number): number {
	const f = ENTRANCE_EXAM_FORMULA[kind];
	const d = Math.min(TECHNION_MAX_AVERAGE, bagrutAverage);
	return Math.round((f.base(d, psychometric) + f.examWeight * exam) * 10) / 10;
}

/** The lowest exam score (to one decimal) whose sekem reaches the threshold; ≤ 0 means any score is enough. */
export function requiredTechnionEntranceExam(kind: TechnionEntranceExamKind, bagrutAverage: number, psychometric: number, threshold: number): number {
	const f = ENTRANCE_EXAM_FORMULA[kind];
	const d = Math.min(TECHNION_MAX_AVERAGE, bagrutAverage);
	let exam = Math.ceil(((threshold - f.base(d, psychometric)) / f.examWeight) * 10) / 10;
	// The official result is rounded to one decimal, so a slightly lower exam score can still round up to the threshold
	while (exam > 0 && calculateTechnionEntranceExamSekem(kind, bagrutAverage, psychometric, Math.round((exam - 0.1) * 10) / 10) >= threshold) {
		exam = Math.round((exam - 0.1) * 10) / 10;
	}
	return exam;
}

export function calculateTechnionSekem(bagrutAverage: number, psychometric: number): number {
	if (bagrutAverage <= 0 || psychometric <= 0) return 0;
	const d = Math.min(TECHNION_MAX_AVERAGE, bagrutAverage);
	// Algebraically the same formula; preserve the observed displayed half-tie behavior
	// without first rounding D or adding an arbitrary floating-point epsilon.
	const tenths = (100 * d + 15 * psychometric - 3800) / 20;
	return Math.min(100, Math.max(0, Math.round(tenths) / 10));
}

export function evaluateTechnion(input: InstitutionCalculatorInput): InstitutionCalculatorResult {
	const optimal = calculateTechnionOptimalBagrut(input.bagrutSubjects);
	const psych = input.psychometricGeneral || 0;
	// In Technion, the official formula for ALL degree tracks
	// ("חישוב סכם לכל המסלולים פרט לארכיטקטורה, אדריכלות נוף ומסלולי הרפואה"):
	// S = 0.5 * D + 0.075 * P_general - 19
	// The psychometric score is strictly the multi-disciplinary (general) score.
	const sekem = calculateTechnionSekem(optimal.rawAverage ?? optimal.average, psych);
	const generalSekem = sekem;
	const engineeringSekem = sekem;

	// Technion does NOT allow direct bagrut admission for CS or engineering without psychometric
	const directBagrutEligible = false;

	const notes: string[] = [];
	if (optimal.hasScienceCluster) {
		notes.push('זוהה מצרף מדעי/טכנולוגי במקצועות שנכללו בממוצע (מתמטיקה 5 יח״ל + שני מדעים, או מדע ומקצוע טכנולוגי, ב-5 יח״ל) — שני המקצועות שנבחרו למצרף מקבלים 30 נקודות בונוס.');
	}
	if (optimal.droppedSubjects.length > 0) {
		notes.push(`הושמטו ${optimal.droppedSubjects.length} מקצועות בחירה לטובת מקסום הממוצע האופטימלי.`);
	}

	return {
		institutionId: 'technion',
		institutionName: 'הטכניון - מכון טכנולוגי לישראל',
		bagrutAverage: optimal.average,
		optimalUnits: optimal.optimalUnits,
		generalSekem,
		engineeringSekem,
		directBagrutEligible,
		notes,
		droppedSubjects: optimal.droppedSubjects.map((s) => s.name),
		subjectBreakdown: optimal.breakdown,
		bagrutCap: optimal.cap
	};
}
