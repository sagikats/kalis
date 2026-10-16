/**
 * BGU tracks admitted by official conditions alone, with no sekem threshold: six mathematics tracks and statistics with
 * mathematics. The catalog carried invented thresholds for them (600 / 680, no source).
 *
 *   npx tsx scripts/data/importBguConditionsOnly.ts
 *
 * Source: BGU's live calculator, "תנאי קבלה לסמסטר סתו תשפ"ז" (apps4cloud.bgu.ac.il/calcprod), read 2026-10-16.
 * Snapshot with the exact texts: src/data/sources/bgu-math-conditions-2026-10-16.json. The sekem column is empty for
 * these tracks; the listed condition is "מתמטיקה 87/5", and the notes give the alternatives encoded below. A bagrut
 * "ציון עובר" is 55. The alternative that also needs a sekem (700 general / 630 quantitative) goes in
 * conditionsOnly.sekemAlternative, since a RequirementOption can't hold a sekem minimum.
 *
 * Runs after the other BGU importers (it replaces their "math" requirement and keeps the English rule). Idempotent.
 */
import fs from 'fs';
import path from 'path';

const JSON_PATH = path.join(path.resolve(__dirname, '../..'), 'src/data/academicData.json');
const SOURCE = 'https://apps4cloud.bgu.ac.il/calcprod/ — תנאי קבלה סתו תשפ"ז, ללא סף סכם (2026-10-16)';
const PASS = 55;

const math5 = (minGrade: number) => ({ subjects: ['מתמטיקה'], minUnits: 5, minGrade });
const physics5 = (minGrade: number) => ({ subjects: ['פיזיקה'], minUnits: 5, minGrade });
const quant = (min: number) => ({ section: 'quant' as const, min });

const MATH_REQUIREMENT = {
	id: 'math',
	title: 'מתמטיקה (תנאי הקבלה)',
	anyOf: [
		{ bagrut: [math5(87)] },
		{ bagrut: [math5(PASS)], psych: [quant(137)] },
		{ bagrut: [math5(PASS), physics5(82)], psych: [quant(127)] },
		{ bagrut: [math5(82), physics5(82)] }
	],
	otherOptions: 'או סכם כללי 700 עם חשיבה כמותית 127 ומתמטיקה 5 יח"ל 75 / 4 יח"ל 85'
};
const MATH_SEKEM_ALTERNATIVE = {
	sekem: 'general' as const,
	min: 700,
	label: 'סכם כללי 700, חשיבה כמותית 127 ומתמטיקה 5 יח"ל 75 או 4 יח"ל 85',
	replaces: 'math',
	requirement: {
		id: 'math-sekem-700',
		title: 'חלופת סכם 700',
		anyOf: [
			{ bagrut: [math5(75)], psych: [quant(127)] },
			{ bagrut: [{ subjects: ['מתמטיקה'], minUnits: 4, minGrade: 85 }], psych: [quant(127)] }
		]
	}
};
const MATH_NOTE =
	'הקבלה למתמטיקה בבן-גוריון היא לפי תנאי במתמטיקה, בלי סף סכם. מ-24.9 המכסה מלאה ("עצירת קבלות"), אבל המחלקה ממליצה לעומדים בתנאים להירשם. עם מתמטיקה 4 יח"ל וחשיבה כמותית 140 ומעלה עוברים לדיון במחלקה.';
const BOTH_DEPARTMENTS = ' בתואר דו-מחלקתי יש לעמוד גם בתנאי הקבלה של המחלקה השנייה.';

const STATS_REQUIREMENT = {
	id: 'math',
	title: 'מתמטיקה (תנאי הקבלה)',
	anyOf: [{ bagrut: [math5(87)] }, { bagrut: [math5(PASS)], psych: [quant(137)] }],
	otherOptions: 'או סכם כמותי 630 עם מתמטיקה 4 יח"ל 80 / 5 יח"ל 70'
};
const STATS_SEKEM_ALTERNATIVE = {
	sekem: 'quantitative' as const,
	min: 630,
	label: 'סכם כמותי 630 ומתמטיקה 4 יח"ל 80 או 5 יח"ל 70',
	replaces: 'math',
	requirement: {
		id: 'math-sekem-630',
		title: 'חלופת סכם כמותי 630',
		anyOf: [{ bagrut: [{ subjects: ['מתמטיקה'], minUnits: 4, minGrade: 80 }] }, { bagrut: [math5(70)] }]
	}
};
const STATS_NOTE =
	'הקבלה לצירוף הזה היא לפי תנאי במתמטיקה, בלי סף סכם. יש לעמוד גם בתנאי הקבלה של שתי המחלקות. מ-3.8 המכסה מלאה ("עצירת קבלות"), עם רשימת המתנה.';

const TRACKS: Record<string, { requirement: object; alternative: object; note: string }> = {
	'prog-bgu-72': { requirement: MATH_REQUIREMENT, alternative: MATH_SEKEM_ALTERNATIVE, note: MATH_NOTE }, // חד-מחלקתי – מתמטיקה כללית
	'prog-bgu-63': { requirement: MATH_REQUIREMENT, alternative: MATH_SEKEM_ALTERNATIVE, note: MATH_NOTE }, // ראשי
	'prog-bgu-68': { requirement: MATH_REQUIREMENT, alternative: MATH_SEKEM_ALTERNATIVE, note: MATH_NOTE }, // ראשי – מדעי הטבע
	'prog-bgu-73': { requirement: MATH_REQUIREMENT, alternative: MATH_SEKEM_ALTERNATIVE, note: MATH_NOTE + BOTH_DEPARTMENTS }, // יזמות וחדשנות
	'prog-bgu-66': { requirement: MATH_REQUIREMENT, alternative: MATH_SEKEM_ALTERNATIVE, note: MATH_NOTE + BOTH_DEPARTMENTS }, // רוח וחברה
	'prog-bgu-65': { requirement: MATH_REQUIREMENT, alternative: MATH_SEKEM_ALTERNATIVE, note: MATH_NOTE + BOTH_DEPARTMENTS }, // קיימות
	'prog-bgu-146': { requirement: STATS_REQUIREMENT, alternative: STATS_SEKEM_ALTERNATIVE, note: STATS_NOTE } // סטטיסטיקה – מתמטיקה
};

function main() {
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const bgu = data.find((i: { id: string }) => i.id === 'inst-3');
	const done: string[] = [];
	for (const p of bgu.programs) {
		const track = TRACKS[p.id];
		if (!track) continue;
		p.admissionThreshold = null;
		delete p.officialThreshold;
		delete p.thresholdSource; // there is no threshold to source; requirementsSource carries the provenance
		const routes = (p.admissionRoutes = p.admissionRoutes ?? {});
		const others = (routes.requirements ?? []).filter((r: { id: string }) => r.id !== 'math');
		routes.requirements = [track.requirement, ...others];
		if (routes.bagrutOnlyRequirements) {
			routes.bagrutOnlyRequirements = routes.bagrutOnlyRequirements.filter((r: { id: string }) => r.id !== 'math');
		}
		routes.requirementsSource = SOURCE;
		routes.conditionsOnly = { note: track.note, source: SOURCE, sekemAlternative: track.alternative };
		done.push(p.id);
	}
	const missing = Object.keys(TRACKS).filter((id) => !done.includes(id));
	if (missing.length > 0) throw new Error(`BGU tracks not found: ${missing.join(', ')}`);
	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Set ${done.length} BGU tracks to condition-only admission.`);
}

main();
