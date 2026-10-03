/**
 * Imports Reichman's official admission table for תשפ"ז into src/data/academicData.json: thresholds of the three routes
 * (ציון מתואם / בגרות / פסיכומטרי), the minimum psychometric on the matched route, and per-route English / math /
 * science requirements including the math prep course.
 *
 *   npx tsx scripts/data/importReichmanThresholds.ts
 *
 * Source: "טבלת ספים מעודכנת לאתר תשפ"ז" (runi.ac.il PDF), transcribed cell by cell into
 * src/data/sources/reichman-admission-table-tashpaz.json. The "ציון מתואם" is the same 800-scale score our Reichman
 * calculator produces (verified against runi.ac.il), so no conversion is needed.
 *
 * Conventions (hand-transcribed from the table):
 * - Routes: matched → `requirements` (+ minPsychometric), bagrut → `bagrutOnlyRequirements`,
 *   psychometric → `psychometricOnlyRequirements`. A column without a route qualifier applies to all three.
 * - Prep course ("יתקבלו על תנאי מעבר קורס הכנה במתמטיקה"): below the stated level (e.g. "4 יח' בציון 80 או 5 יח'
 *   בציון 65"), meeting the math minimum is enough only together with passing the prep course — an exam option.
 * - "רמה מתמטית של 3 יח' בציון 100" is read as: 3 units at 100, or any 4/5-unit math (interpretation; see USER_TASKS).
 * - "לפחות 4 יח'" without a grade = a passing grade (55).
 * - Rows for programs not in our catalog (direct-master law, Business & Data Analytics, …) are kept in the snapshot only.
 */

import fs from 'fs';
import path from 'path';
import type { ProgramRequirement, RequirementOption, SubjectCondition } from '../../src/types/academic';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/reichman-admission-table-tashpaz.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const UPDATED_AT = '2026-10-04';
const PASS = 55;
const PREP_EXAM = 'מעבר קורס ההכנה במתמטיקה של רייכמן (קבלה על תנאי)';

const b = (subjects: string[], minUnits: number, minGrade: number): SubjectCondition => ({ subjects, minUnits, minGrade });
const math = (u: number, g: number) => b(['מתמטיקה'], u, g);
const english = (u: number, g: number) => b(['אנגלית'], u, g);
const opt = (bagrut: SubjectCondition[], extra: Partial<RequirementOption> = {}): RequirementOption => ({ ...(bagrut.length ? { bagrut } : {}), ...extra });
const quant = (min: number): ProgramRequirement => ({ id: 'quant', title: 'חשיבה כמותית', anyOf: [{ psych: [{ section: 'quant', min }] }] });
const req = (id: string, title: string, anyOf: RequirementOption[], otherOptions?: string): ProgramRequirement => ({
	id,
	title,
	anyOf,
	...(otherOptions ? { otherOptions } : {})
});

/**
 * Math with the prep course: plain options at the prep level (`four` for 4 units, `five` for 5 units), and each
 * minimum option below that level together with the prep course.
 */
const mathWithPrep = (prep: { four: number; five: number }, minimums: SubjectCondition[]) =>
	req('math', 'ידע במתמטיקה', [
		opt([math(4, prep.four)]),
		opt([math(5, prep.five)]),
		...minimums.filter((m) => !(m.minUnits === 4 && m.minGrade >= prep.four) && !(m.minUnits >= 5 && m.minGrade >= prep.five)).map((m) => opt([m], { exam: PREP_EXAM }))
	]);
/** "רמה מתמטית של 3 יח' בציון 100": 3 units at 100 or any 4/5-unit math. */
const LEVEL_3U100 = [math(3, 100), math(4, PASS), math(5, PASS)];
const SCIENCE = ['פיזיקה', 'כימיה', 'ביולוגיה', 'מדעי המחשב'];

interface Routes {
	matched: ProgramRequirement[];
	bagrut: ProgramRequirement[];
	psychometric: ProgramRequirement[];
	minPsychometric?: number;
}
const same = (reqs: ProgramRequirement[], minPsychometric?: number): Routes => ({ matched: reqs, bagrut: reqs, psychometric: reqs, minPsychometric });

const ROW = {
	cs: 'מדעי המחשב / מדעי המחשב יזמות / מדעי המחשב עם חטיבה בקוגניציה וחקר המח / מדעי המחשב עם חטיבה במדעי החיים (קדם רפואה)',
	law: 'משפטים תארים כפולים / משפטים בדגש בינלאומי',
	business: 'מנהל עסקים (מסלול מורחב)',
	businessEntrepreneurship: 'מנהל עסקים ויזמות',
	economics: 'כלכלה ויזמות / כלכלה ומנהל עסקים / כלכלה וקיימות',
	accounting: 'התכנית בחשבונאות',
	government: 'ממשל / ממשל וקיימות',
	communication: 'תקשורת',
	psychology: 'פסיכולוגיה'
};

const BUSINESS_PREP = { four: 80, five: 65 };
const ENGLISH_4U = req('english', 'אנגלית בבגרות', [opt([english(4, PASS)])]);

const ROUTES: Record<string, Routes> = {
	[ROW.cs]: {
		matched: [req('math', 'ידע במתמטיקה', [opt([math(5, 85)])])],
		bagrut: [
			req('math', 'ידע במתמטיקה', [opt([math(5, 90)])]),
			req('science', 'מקצוע מדעי (5 יח"ל)', [opt([b(SCIENCE, 5, 90)])], 'לא כולל תכנון מערכות')
		],
		psychometric: [req('math', 'ידע במתמטיקה', [opt([math(5, 80)])])],
		minPsychometric: 660
	},
	[ROW.law]: same([], 610),
	[ROW.business]: (() => {
		const m = mathWithPrep(BUSINESS_PREP, LEVEL_3U100);
		return { matched: [ENGLISH_4U, m], bagrut: [ENGLISH_4U, m], psychometric: [ENGLISH_4U, m, quant(125)] };
	})(),
	[ROW.businessEntrepreneurship]: same([
		req('english', 'אנגלית בבגרות', [opt([english(5, 75)]), opt([english(4, 90)])]),
		mathWithPrep(BUSINESS_PREP, LEVEL_3U100)
	]),
	[ROW.economics]: (() => {
		const m = mathWithPrep({ four: 85, five: 65 }, [math(4, 75), math(5, 60)]);
		return { matched: [ENGLISH_4U, m], bagrut: [ENGLISH_4U, m], psychometric: [ENGLISH_4U, m, quant(125)] };
	})(),
	[ROW.accounting]: {
		// כלכלה מנהל עסקים בהתמחות חשבונאות: prep below 4u 85 / 5u 65
		matched: [ENGLISH_4U, mathWithPrep({ four: 85, five: 65 }, [math(3, PASS), math(4, PASS), math(5, PASS)])],
		bagrut: [ENGLISH_4U, req('math', 'ידע במתמטיקה', [opt([math(5, 70)]), opt([math(4, 90)])])],
		psychometric: [],
		minPsychometric: 620
	},
	[ROW.government]: { matched: [], bagrut: [req('math', 'ידע במתמטיקה', [opt([math(3, PASS)])])], psychometric: [] },
	[ROW.communication]: same([req('english', 'אנגלית', [opt([english(4, 80)]), opt([], { psych: [{ section: 'english', min: 100 }] })], 'ציון 100+ באמירנט')]),
	[ROW.psychology]: same([req('english', 'אנגלית בבגרות', [opt([english(4, 90)])]), req('math', 'ידע במתמטיקה', [opt([math(3, 85)])])])
};

/** Our program id -> table row. Programs not listed have no row (no official threshold). */
const MAP: Record<string, { row: string; routes?: Routes }> = {
	'prog-inst-38-3': { row: ROW.cs }, // מדעי המחשב
	'prog-inst-38-14': { row: ROW.cs }, // מדעי המחשב ויזמות
	'prog-inst-38-6': { row: ROW.law }, // משפטים (LLB: תארים כפולים / בדגש בינלאומי)
	'prog-inst-38-15': { row: ROW.law, routes: same([mathWithPrep(BUSINESS_PREP, [])], 610) }, // משפטים ומנהל עסקים — prep course
	'prog-inst-38-16': { row: ROW.law }, // משפטים וממשל
	'prog-inst-38-5': { row: ROW.business }, // מנהל עסקים
	'prog-inst-38-17': { row: ROW.businessEntrepreneurship }, // יזמות ומנהל עסקים
	'prog-inst-38-2': { row: ROW.economics }, // כלכלה
	'prog-inst-38-22': { row: ROW.economics }, // כלכלה ומנהל עסקים
	'prog-inst-38-10': { row: ROW.economics }, // קיימות וכלכלה
	'prog-inst-38-21': { row: ROW.accounting }, // כלכלה וחשבונאות
	'prog-inst-38-4': { row: ROW.government }, // ממשל
	'prog-inst-38-11': { row: ROW.government }, // קיימות וממשל
	'prog-inst-38-9': { row: ROW.communication }, // תקשורת
	'prog-inst-38-7': { row: ROW.psychology } // פסיכולוגיה
};

interface Row {
	program: string;
	matched: number | string;
	bagrut: number | string;
	psychometric: number | string | null;
}

const num = (v: number | string | null) => (typeof v === 'number' ? v : typeof v === 'string' ? Number(v.match(/^\d+/)?.[0]) || undefined : undefined);

function main() {
	const table = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const byName = new Map<string, Row>(table.rows.map((r: Row) => [r.program, r]));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const runi = data.find((i: any) => i.id === 'inst-38');
	const report: string[] = [];
	const unmatched: string[] = [];

	for (const p of runi.programs) {
		const entry = MAP[p.id];
		const row = entry ? byName.get(entry.row) : undefined;
		if (entry && !row) throw new Error(`Row "${entry.row}" not in the snapshot`);
		if (!row) {
			// Not in the תשפ"ז table: clear data imported from older sources so nothing stale stays "official"
			if (p.admissionRoutes) {
				for (const k of ['requirements', 'bagrutOnlyRequirements', 'psychometricOnlyRequirements', 'requirementsSource']) delete p.admissionRoutes[k];
			}
			unmatched.push(`${p.id} ${p.fieldOfStudy} (kept ${p.admissionThreshold}, unverified)`);
			continue;
		}
		const routes = entry.routes ?? ROUTES[row.program];
		const matched = num(row.matched)!;
		const bagrut = num(row.bagrut);
		const psychometric = num(row.psychometric);
		const old = p.admissionThreshold;
		p.officialThreshold = matched;
		p.admissionThreshold = matched;
		p.relevantSekemType = 'general';
		p.directBagrutMinAverage = bagrut ?? null;
		if (routes.minPsychometric) p.minPsychometricFloor = routes.minPsychometric;
		else delete p.minPsychometricFloor;
		p.admissionRoutes = {
			...(bagrut ? { bagrutOnlyMin: bagrut } : {}),
			...(psychometric ? { psychometricOnlyMin: psychometric } : {}),
			...(routes.minPsychometric ? { minPsychometric: routes.minPsychometric } : {}),
			requirements: routes.matched,
			bagrutOnlyRequirements: routes.bagrut,
			psychometricOnlyRequirements: routes.psychometric,
			requirementsSource: `runi.ac.il — טבלת ספים מעודכנת תשפ"ז: ${row.program} (${UPDATED_AT})`
		};
		p.thresholdSource = `${table.source} — טבלת ספים תשפ"ז: ${row.program}`;
		p.thresholdUpdatedAt = UPDATED_AT;
		report.push(`${p.fieldOfStudy}: ${old} -> ${matched} (bagrut ${bagrut ?? '—'}, psychometric ${psychometric ?? '—'})`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Updated ${report.length} Reichman programs`);
	for (const l of report) console.log('  ' + l);
	console.log(`\nNot in the official table (${unmatched.length}):`);
	for (const l of unmatched) console.log('  ' + l);
}

main();
