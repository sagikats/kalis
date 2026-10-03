/**
 * Imports TAU's official per-program subject requirements ("דרישות הסף של התוכנית": ידע במתמטיקה, מקצוע ריאלי נוסף,
 * ידע בפיזיקה / כימיה) into src/data/academicData.json as `admissionRoutes.requirements`.
 *
 *   npx tsx scripts/data/importTauPrerequisites.ts
 *
 * Source: the "תנאי קבלה" tab of each program page (go.tau.ac.il/he/<path>?v=requirements), newest semester (the default).
 * Snapshot (URL + verbatim section text per program): src/data/sources/tau-prerequisites-2026-10-03.json.
 *
 * The table below is hand-transcribed from that text. Conventions:
 * - "ציון עובר" = 55 (TAU: "ציון עובר (55)").
 * - "כל המתקבלים ע"ס 4 יח"ל נדרשים לעבור בחינת סיווג במתמטיקה" → the 4-unit option carries that exam.
 * - Alternatives the platform can't evaluate (academic courses, a prior degree, "ציון התאמה גבוה ב-20") go to `otherOptions`.
 * - English: TAU's university-wide rule (go.tau.ac.il/he/ba/english, snapshot `englishRule`) applies to every program —
 *   מתקדמים א' (100) by the start of studies; בסיסי (85–99) may get there with summer courses (an exam-like option);
 *   טרום בסיסי (≤84) is rejected. A few programs require מתקדמים ב' (120) instead.
 * Programs whose section has no subject requirement, and pages with only the university's general requirements
 * (`generalRequirementsOnly`), get no subject entry — and `requirementsSource`, which replaces the generic estimate.
 * Pages showing "אין מידע להציג" (`noInfo`) get only the English rule and keep the generic estimate.
 */

import fs from 'fs';
import path from 'path';
import type { ProgramRequirement, RequirementOption, SubjectCondition } from '../../src/types/academic';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/tau-prerequisites-2026-10-03.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const SOURCE = 'go.tau.ac.il — "תנאי קבלה" › "דרישות הסף של התוכנית" (2026-10-03)';

// --- building blocks -------------------------------------------------------------------------------------------
const PASS = 55;
const TECH = [
	'מדעי המחשב', 'הגנת סייבר', 'מערכות תוכנה וחומרה', 'אלקטרוניקה ומחשבים', 'ביוטכנולוגיה / מערכות ביוטכנולוגיה',
	'מדעי ההנדסה', 'מכטרוניקה / בקרת מכונות', 'מערכות תעופה וחלל', 'הנדסת מכונות / מכונות', 'ביו-רפואה ומכשור רפואי',
	'תקשורת אלקטרונית וטלקומוניקציה', 'רובוטיקה ומערכות אוטונומיות', 'הנדסת תוכנה / פרויקט גמר תוכנה',
	'תכנון ותכנות מערכות', 'מדע חישובי'
];
const b = (subjects: string[], minUnits: number, minGrade: number): SubjectCondition => ({ subjects, minUnits, minGrade });
const math = (u: number, g: number) => b(['מתמטיקה'], u, g);
const phys = (u: number, g: number) => b(['פיזיקה'], u, g);
const opt = (bagrut: SubjectCondition[], exam?: string, quant?: number): RequirementOption => ({
	...(bagrut.length ? { bagrut } : {}),
	...(quant ? { psych: [{ section: 'quant' as const, min: quant }] } : {}),
	...(exam ? { exam } : {})
});
const MATH_EXAM = 'מעבר בחינת סיווג במתמטיקה';
const mathExam = (score: number) => `בחינת סיווג במתמטיקה בציון ${score}+`;
const PHYS_EXAM = 'מעבר בחינת סיווג בפיזיקה';
const COURSES_MATH = 'ציון 75+ בקורסי מתמטיקה אקדמיים (חדו"א / אלגברה בת"א או באוניברסיטה הפתוחה)';
const COURSES_PHYS = 'ציון 70–75+ בקורס פיזיקה קלאסית 1 בת"א או מכניקה / חשמל ומגנטיות באוניברסיטה הפתוחה';

const req = (id: string, title: string, anyOf: RequirementOption[], otherOptions?: string): ProgramRequirement => ({
	id,
	title,
	anyOf,
	...(otherOptions ? { otherOptions } : {})
});

/** Engineering "ידע במתמטיקה": 5u ≥ g5, or 4u ≥ g4 plus the classification exam. */
const engMath = (g5: number, g4: number, other?: string) =>
	req('math', 'ידע במתמטיקה', [opt([math(5, g5)]), opt([math(4, g4)], MATH_EXAM)], other);

/**
 * Engineering "מקצוע ריאלי נוסף": physics 5u ≥ p, or chemistry / a tech subject 5u ≥ c with the physics exam,
 * or biology 5u ≥ bio with the physics exam, optionally psychometric quant 140 + math 5u ≥ m with the physics exam.
 */
const engScience = (p: number, c: number, bio: number, quantMath?: number, other = COURSES_PHYS) =>
	req(
		'science',
		'מקצוע ריאלי נוסף (פיזיקה)',
		[
			opt([phys(5, p)]),
			opt([b(['כימיה', ...TECH], 5, c)], PHYS_EXAM),
			opt([b(['ביולוגיה'], 5, bio)], PHYS_EXAM),
			...(quantMath ? [opt([math(5, quantMath)], PHYS_EXAM, 140)] : [])
		],
		other
	);

/** CS-style math: 5u 80+, 5u 70+ & exam 75, 4u g4+, 4u 75+ & exam 75. */
const csMath = (g4: number) =>
	req('math', 'ידע במתמטיקה', [
		opt([math(5, 80)]),
		opt([math(4, g4)]),
		opt([math(5, 70)], mathExam(75)),
		opt([math(4, 75)], mathExam(75))
	]);

/** Social-science math: 4u passing, or psychometric quant ≥ q. */
const basicMath = (q: number, other?: string) => req('math', 'ידע במתמטיקה', [opt([math(4, PASS)]), opt([], undefined, q)], other);

/** AI / data-science minors: 5u 80+, or 4u 90+ with psychometric quant 125+. */
const aiMath = () => req('math', 'ידע במתמטיקה', [opt([math(5, 80)]), opt([math(4, 90)], undefined, 125)]);

const ENGLISH_SOURCE = 'go.tau.ac.il/he/ba/english — ידיעת השפה האנגלית (2026-10-04)';
const ENGLISH_DEFAULT: ProgramRequirement = {
	id: 'english',
	title: "רמת אנגלית (מתקדמים א')",
	anyOf: [
		{ psych: [{ section: 'english', min: 100 }] },
		{ psych: [{ section: 'english', min: 85 }], exam: "קורסי אנגלית (קיץ) להגעה לרמת מתקדמים א' עד תחילת שנת הלימודים" }
	],
	otherOptions: 'ציון מקביל באמירנט / אמי"ר; ברמת טרום בסיסי (עד 84) — דחייה אוטומטית',
	source: ENGLISH_SOURCE
};
const englishAdvancedB = (courseRoute: boolean): ProgramRequirement => ({
	id: 'english',
	title: "רמת אנגלית (מתקדמים ב')",
	anyOf: [
		{ psych: [{ section: 'english', min: 120 }] },
		...(courseRoute
			? [{ psych: [{ section: 'english' as const, min: 85 }], exam: "קורסי אנגלית להגעה לרמת מתקדמים ב' עד תום השבוע השני של ספטמבר" }]
			: [])
	],
	otherOptions: 'ציון 120+ באמירנט / אמי"ר'
});
/** Program-specific English levels (from each program's section); every other program gets ENGLISH_DEFAULT. */
const ENGLISH_BY_PROGRAM: Record<string, ProgramRequirement> = {
	'prog-tau-0651-28': englishAdvancedB(false), // פכ"מ: "רמת מתקדמים ב' לפחות"
	'prog-tau-1411-93': englishAdvancedB(true), // משפטים + AI: "מתקדמים ב' ... עד תום השבוע השני של ספטמבר"
	'prog-tau-0164-16': englishAdvancedB(false), // פיזיותרפיה: "מתקדמים ב' לפחות"
	'prog-tau-0161-17': { ...englishAdvancedB(false), otherOptions: 'ציון 120+ באמי"ר / אמיר"ם (למעט בעלי תואר שני)' } // הפרעות בתקשורת
};
/** Official minimum general psychometric from a program's section ("פסיכומטרי X ומעלה"). */
const MIN_PSYCH: Record<string, number> = { 'prog-tau-0164-16': 635 };

// --- per program (hand-transcribed from the snapshot) ----------------------------------------------------------
const TABLE: Record<string, ProgramRequirement[]> = {
	// Engineering
	'prog-tau-0555-65': [engMath(75, 85), engScience(70, 70, 80)],
	'prog-tau-0542-64': [engMath(75, 85, COURSES_MATH), engScience(75, 70, 80, 85)],
	'prog-tau-0542-77': [engMath(75, 85, COURSES_MATH), engScience(75, 75, 85, 95)],
	'prog-tau-0512-74': [engMath(80, 90, COURSES_MATH), engScience(75, 75, 83, 90)],
	'prog-tau-0512-79': [engMath(80, 90, COURSES_MATH), engScience(75, 75, 83, 90)],
	'prog-tau-0512-70': [engMath(80, 90), engScience(75, 75, 83, 90)],
	'prog-tau-0573-66': [
		engMath(75, 85, COURSES_MATH),
		engScience(70, 70, 80, 90, `${COURSES_PHYS}; מקצוע ניהול הייצור / ניהול תעשייתי 5 יח"ל 80+ עם בחינת סיווג בפיזיקה; ציון התאמה גבוה ב-20 מהסף עם מתמטיקה 5 יח"ל 90+ ובחינת סיווג בפיזיקה`)
	],
	'prog-tau-0581-68': [engMath(75, 85), engScience(70, 70, 80, 90, `${COURSES_PHYS}; ציון התאמה גבוה ב-20 מהסף עם מתמטיקה 5 יח"ל 90+ ובחינת סיווג בפיזיקה`)],
	'prog-tau-0581-67': [engMath(75, 85), engScience(70, 70, 80, 90, `${COURSES_PHYS}; ציון התאמה גבוה ב-20 מהסף עם מתמטיקה 5 יח"ל 90+ ובחינת סיווג בפיזיקה`)],
	'prog-tau-1554-69': [engMath(75, 85), engScience(70, 70, 80)],
	'prog-tau-0542-85': [engMath(75, 85, COURSES_MATH), engScience(75, 75, 85, 95)],
	'prog-tau-0560-63': [engMath(75, 85, 'ציון 70+ בכל אחד מהקורסים המקוונים "גשר למתמטיקה אקדמית" 1 ו-2 (במקום בחינת הסיווג)')],

	// Exact sciences
	'prog-tau-0368-22': [csMath(88)],
	'prog-tau-0368-3': [csMath(88)],
	'prog-tau-1513-60': [csMath(88)],
	'prog-tau-0366-23': [req('math', 'ידע במתמטיקה', [opt([math(5, 80)]), opt([math(5, 70)], mathExam(75)), opt([math(4, 85)], mathExam(75))])],
	'prog-tau-0365-26': [req('math', 'ידע במתמטיקה', [opt([math(5, 80)]), opt([math(5, 70)], mathExam(75)), opt([math(4, 85)], mathExam(75))])],
	'prog-tau-0366-25': [req('math', 'ידע במתמטיקה', [opt([math(5, 80)])], 'מכינה קדם-אקדמית מוכרת במסלול ריאלי')],
	'prog-tau-0359-89': [
		req('math', 'ידע במתמטיקה', [opt([math(5, 80)])]),
		req(
			'science',
			'מקצוע ריאלי נוסף',
			[
				opt([b(['פיזיקה', 'כימיה', ...TECH], 5, 70)]),
				opt([b(['פיזיקה', 'כימיה', ...TECH], 4, 80)]),
				opt([b(['ביולוגיה'], 5, 80)]),
				opt([math(5, 90)], undefined, 140)
			],
			'ציון התאמה גבוה ב-20 מהסף עם מתמטיקה 5 יח"ל 90+'
		)
	],
	'prog-tau-0321-78': [
		req('math', 'ידע במתמטיקה', [opt([math(5, 75)]), opt([math(4, 85)]), opt([math(4, PASS)], mathExam(85))]),
		req('physics', 'ידע בפיזיקה', [opt([phys(5, 75)]), opt([], 'בחינת הסיווג של קורס ההכנה בפיזיקה בציון 85+')])
	],
	'prog-tau-1521-62': [
		req('math', 'ידע במתמטיקה', [opt([math(5, 75)]), opt([math(4, 85)]), opt([math(4, PASS)], mathExam(85))]),
		req('physics', 'ידע בפיזיקה', [opt([phys(5, 75)]), opt([], 'בחינת הסיווג של קורס ההכנה בפיזיקה בציון 85+')])
	],
	'prog-tau-0323-86': [
		req('math', 'ידע במתמטיקה', [opt([math(5, 80)])], 'ציון 80+ בחדו"א 1א\' ובמבוא מתמטי לפיזיקאים 1 בת"א'),
		req('physics', 'ידע בפיזיקה', [opt([phys(5, 80)]), opt([], 'בחינת הסיווג של קורס ההכנה בפיזיקה בציון 90+')], 'ציון 80+ בפיזיקה קלאסית 1 בת"א')
	],
	'prog-tau-0351-84': [
		req(
			'math',
			'ידע במתמטיקה',
			[opt([math(5, 75)]), opt([math(4, 80)]), opt([math(4, PASS)], 'בחינת המיון של קורס ההכנה במתמטיקה בציון 70+')],
			'ציון 75+ בקורס הכנה מתמטית לכימאים'
		),
		req('science', 'ידע בפיזיקה / כימיה', [
			opt([b(['פיזיקה', 'כימיה'], 5, 75)]),
			opt([], 'בחינת המיון של קורס ההכנה בפיזיקה בציון 75+'),
			opt([], 'בחינת המיון של קורס ההכנה בכימיה בציון 80+')
		]),
		req('quant', 'חשיבה כמותית', [opt([], undefined, 110)], 'תואר בוגר / 30 ש"ס אקדמיות במדעים או הנדסה בממוצע 80+ (במקום הפסיכומטרי)')
	],
	'prog-tau-0351-24': [
		req('math', 'ידע במתמטיקה', [opt([math(5, 90)])]),
		req('science', 'ידע בפיזיקה / כימיה', [opt([b(['פיזיקה', 'כימיה'], 5, 90)])])
	],
	'prog-tau-0341-30': [
		req('math', 'ידע במתמטיקה', [opt([math(5, 90)])], 'מכינה קדם-אקדמית מוכרת במסלול ריאלי'),
		req('physics', 'ידע בפיזיקה', [opt([phys(5, 90)])], 'מכינה קדם-אקדמית מוכרת במסלול ריאלי')
	],
	'prog-tau-0341-31': [
		req('math', 'ידע במתמטיקה', [opt([math(5, 75)]), opt([math(4, 85)]), opt([], mathExam(80))]),
		req('physics', 'ידע בפיזיקה', [opt([phys(5, 75)]), opt([], 'בחינת המיון של קורס ההכנה בפיזיקה בציון 80+')])
	],
	'prog-tau-0341-99': [
		req('math', 'ידע במתמטיקה', [opt([math(5, 80)]), opt([math(5, 70)], mathExam(75)), opt([math(4, 85)], mathExam(75))]),
		req('physics', 'ידע בפיזיקה', [opt([phys(5, 75)]), opt([], 'בחינת המיון של קורס ההכנה בפיזיקה בציון 80+')])
	],

	// Life sciences, neuroscience, architecture, OT
	'prog-tau-0455-2': [req('math', 'ידע במתמטיקה', [opt([math(4, PASS)])])],
	'prog-tau-1514-59': [req('math', 'ידע במתמטיקה', [opt([math(4, 60)]), opt([], undefined, 140)])],
	'prog-tau-1564-61': [req('math', 'ידע במתמטיקה', [opt([math(4, 60)]), opt([], undefined, 140)])],
	'prog-tau-1501-106': [req('math', 'ידע במתמטיקה', [opt([math(4, 60)]), opt([], undefined, 140)])],
	'prog-tau-0881-12': [req('math', 'ידע במתמטיקה', [opt([math(5, 70)]), opt([math(4, 80)]), opt([math(3, 90)])])],
	'prog-tau-0164-16': [req('math', 'ידע במתמטיקה', [opt([math(5, 65)]), opt([math(4, 70)])])], // פיזיותרפיה
	'prog-tau-0165-15': [
		req('chemistry', 'ידע בכימיה', [opt([b(['כימיה'], 3, 60)]), opt([], 'עמידה בדרישות קורס הקיץ של החוג לריפוי בעיסוק')], 'מכינה קדם-אקדמית או קורס אקדמי מקביל'),
		req('physics', 'ידע בפיזיקה', [opt([phys(3, 60)]), opt([], 'עמידה בדרישות קורס הקיץ של החוג לריפוי בעיסוק')], 'מכינה קדם-אקדמית או קורס אקדמי מקביל')
	],

	// Social sciences, management, law (AI / data-science minors)
	'prog-tau-1211-76': [basicMath(140, 'תואר מוסמך במנהל עסקים ממוסד מוכר בארץ')],
	'prog-tau-1211-75': [basicMath(140)],
	'prog-tau-1221-51': [basicMath(140)],
	'prog-tau-1011-82': [basicMath(138)],
	'prog-tau-0651-28': [req('math', 'ידע במתמטיקה', [opt([math(5, 70)]), opt([math(4, 80)]), opt([], undefined, 138)])],
	'prog-tau-1071-92': [aiMath()],
	'prog-tau-1011-95': [aiMath()],
	'prog-tau-1011-91': [aiMath()],
	'prog-tau-0455-90': [aiMath()],
	'prog-tau-1031-94': [aiMath()],
	'prog-tau-1411-93': [aiMath()],
	'prog-tau-1071-96': [aiMath()]
};

function main() {
	const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const tau = data.find((i: any) => i.id === 'inst-6');
	const byId = new Map<string, any>(tau.programs.map((p: any) => [p.id, p]));
	const withSection = new Map<string, any>(snap.programs.map((r: any) => [r.program_id, r]));
	const generalOnly = new Map<string, any>(snap.generalRequirementsOnly.map((r: any) => [r.program_id, r]));
	const noInfo = new Set<string>(snap.noInfo.map((r: any) => r.program_id));

	for (const id of [...Object.keys(TABLE), ...Object.keys(MIN_PSYCH)]) {
		if (!withSection.has(id)) throw new Error(`${id} has requirements but no snapshot text`);
	}

	let withReqs = 0;
	for (const p of tau.programs) {
		const row = withSection.get(p.id) ?? generalOnly.get(p.id);
		if (!row && !noInfo.has(p.id)) throw new Error(`${p.id} is in no snapshot list`);
		const subject = TABLE[p.id] ?? [];
		const english = ENGLISH_BY_PROGRAM[p.id] ?? ENGLISH_DEFAULT;
		const routes: any = { ...(p.admissionRoutes ?? {}), requirements: [...subject, english] };
		delete routes.requirementsSource;
		// The page was checked (section or general-only): its subject requirements replace the generic estimate
		if (row) routes.requirementsSource = `${SOURCE}: ${row.url}`;
		if (MIN_PSYCH[p.id]) {
			routes.minPsychometric = Math.max(MIN_PSYCH[p.id], routes.minPsychometric ?? 0);
			p.minPsychometricFloor = routes.minPsychometric;
		}
		p.admissionRoutes = routes;
		if (subject.length) withReqs++;
		console.log(`  ${p.fieldOfStudy}: ${[...subject.map((r) => r.title), english.title].join(', ')}${row ? '' : ' (אין מידע בדף — הערכה גנרית למקצועות)'}`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`TAU: ${tau.programs.length} programs — ${withReqs} with subject requirements, ${noInfo.size} without page data; English rule on all`);
}

main();
