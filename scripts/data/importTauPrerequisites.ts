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
 * - English-level requirements are not modelled here (separate exemption-level system).
 * Programs whose section has no subject requirement get an empty list, which replaces the generic estimate.
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
	const inSnapshot = new Set<string>(snap.programs.map((r: any) => r.program_id));

	for (const id of Object.keys(TABLE)) {
		if (!inSnapshot.has(id)) throw new Error(`${id} has requirements but no snapshot text`);
	}

	let withReqs = 0;
	for (const row of snap.programs) {
		const p = byId.get(row.program_id);
		if (!p) throw new Error(`Unknown program ${row.program_id}`);
		const requirements = TABLE[row.program_id] ?? [];
		p.admissionRoutes = { ...(p.admissionRoutes ?? {}), requirements, requirementsSource: `${SOURCE}: ${row.url}` };
		if (requirements.length) withReqs++;
		console.log(`  ${p.fieldOfStudy}: ${requirements.map((r) => r.title).join(', ') || '— (אין דרישת מקצוע)'}`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Official requirements for ${snap.programs.length} TAU programs (${withReqs} with subject requirements)`);
}

main();
