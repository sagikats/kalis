/**
 * Imports the University of Haifa's official תשפ"ז admission conditions into src/data/academicData.json.
 *
 *   npx tsx scripts/data/importHaifaThresholds.ts
 *
 * Source: each program page on admissions.haifa.ac.il (section "תנאי הקבלה החוגיים"), fetched 2026-10-04.
 * Snapshot with the verbatim text of the sekem route: src/data/sources/haifa-thresholds-2026-10-04.json.
 *
 * Per program:
 * - threshold = "ציון סכם X ומעלה" (day studies; the תשפ"ז value where a page lists two years). The waiting band
 *   ("טווח המתנה") goes to "comments" only — it's a committee decision, not an admission.
 * - bagrutOnlyMin = "קבלה ישירה ללא פסיכומטרי על סמך ממוצע בגרות" (the conditional "אופק" track is not modelled;
 *   nursing's route limited to the health major isn't either).
 * - minPsychometric = "פסיכומטרי גולמי X" (nursing, medical imaging).
 * - requirements: "בגרות במתמטיקה" alternatives, and the English level when it is בסיסי (85) or מתקדמים א' (100).
 *   "טרום בסיסי" has no modelled minimum. Interviews / entrance exams go to "comments".
 * Catalog programs with no matching page keep their old values and are listed as unverified.
 */

import fs from 'fs';
import path from 'path';
import type { ProgramRequirement } from '../../src/types/academic';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/haifa-thresholds-2026-10-04.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const UPDATED_AT = '2026-10-04';

interface Row {
	id: string;
	url: string;
	title: string;
	sekem?: number;
	waitlist?: [number, number] | null;
	englishLevel?: string | null;
	mathText?: string;
	math?: { minUnits: number; minGrade: number }[] | null;
	minPsychometric?: number;
	bagrutOnlyMin?: number;
	otherConditions?: string[];
	note?: string;
}

/** Catalog program id -> official program id on admissions.haifa.ac.il. */
const MAP: Record<string, string> = {
	'prog-inst-5-1': '3039', // אומנות יצירה
	'prog-inst-5-2': '3025', // אופקים
	'prog-inst-5-3': '3042', // ארכיאולוגיה
	'prog-inst-5-4': '3036', // ביולוגיה
	'prog-inst-5-5': '3091', // ביופיזיקה
	'prog-inst-5-6': '5113', // גאוגרפיה ולימודי הסביבה
	'prog-inst-5-7': '3157', // מדעי הדימות הרפואי
	'prog-inst-5-9': '3243', // הפרעות בתקשורת
	'prog-inst-5-10': '3192', // חינוך מיוחד
	'prog-inst-5-11': '3178', // ייעוץ והתפתחות האדם
	'prog-inst-5-12': '2482', // כלכלה
	'prog-inst-5-13': '3046', // לימודי אסיה
	'prog-inst-5-14': '3061', // לימודי ארץ ישראל — the department is now "לימודי ישראל"
	'prog-inst-5-15': '3068', // לימודים רב תחומיים
	'prog-inst-5-16': '3203', // מדעי הלמידה וההוראה
	'prog-inst-5-17': '3054', // מדעי המדינה
	'prog-inst-5-18': '3210', // מדעי המחשב
	'prog-inst-5-19': '2495', // מדעי הנתונים
	'prog-inst-5-20': '5563', // מדעי הקוגניציה
	'prog-inst-5-22': '3012', // מדעי הרפואה
	'prog-inst-5-23': '3216', // מוסיקה
	'prog-inst-5-24': '3115', // מחשבת ישראל
	'prog-inst-5-25': '3218', // מערכות מידע
	'prog-inst-5-26': '3105', // מקרא
	'prog-inst-5-27': '3000', // משפטים
	'prog-inst-5-28': '3161', // מתמטיקה
	'prog-inst-5-29': '2968', // סוציולוגיה
	'prog-inst-5-30': '3167', // סטטיסטיקה
	'prog-haifa-5': '2973', // מדעי הסיעוד
	'prog-inst-5-31': '3081', // ספרות עברית והשוואתית
	'prog-inst-5-32': '3082', // עבודה סוציאלית
	'prog-inst-5-33': '3181', // פיזיותרפיה
	'prog-inst-5-34': '3086', // פילוסופיה
	'prog-inst-5-35': '5385', // פכ"מ — פילוסופיה, כלכלה ומדעי המדינה
	'prog-inst-5-36': '3268', // פסיכולוגיה
	'prog-inst-5-37': '3004', // קרימינולוגיה
	'prog-inst-5-38': '3088', // ריפוי בעיסוק
	'prog-inst-5-39': '3064', // שירותי אנוש
	'prog-inst-5-40': '3770', // שפה וספרות אנגלית
	'prog-inst-5-41': '3087', // שפה וספרות ערבית
	'prog-inst-5-42': '3102', // תולדות האומנות
	'prog-inst-5-43': '3211', // לימודי תיאטרון ופרפורמנס
	'prog-inst-5-44': '3229', // תקשורת
	'prog-inst-5-53': '5381', // פסיכולוגיה ומדעי הקוגניציה
	'prog-inst-5-54': '3279', // פסיכולוגיה וביולוגיה עם ספח התמחות במדעי המוח
	'prog-inst-5-56': '2501' // ניהול
};

const ENGLISH_MIN: Record<string, { min: number; label: string }> = {
	'בסיסי': { min: 85, label: 'בסיסי' },
	'מתקדמים א’': { min: 100, label: "מתקדמים א'" }
};

function requirementsFor(row: Row): ProgramRequirement[] {
	const reqs: ProgramRequirement[] = [];
	if (row.math?.length) {
		reqs.push({
			id: 'math',
			title: 'ידע במתמטיקה',
			anyOf: row.math.map((m) => ({ bagrut: [{ subjects: ['מתמטיקה'], minUnits: m.minUnits, minGrade: m.minGrade }] }))
		});
	}
	const english = row.englishLevel ? ENGLISH_MIN[row.englishLevel] : undefined;
	if (english) {
		reqs.push({
			id: 'english',
			title: `רמת אנגלית (${english.label})`,
			anyOf: [{ psych: [{ section: 'english', min: english.min }] }],
			otherOptions: `ציון ${english.min}+ באמירנט`
		});
	}
	return reqs;
}

function main() {
	const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const byId = new Map<string, Row>(snapshot.programs.map((r: Row) => [r.id, r]));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const haifa = data.find((i: any) => i.id === 'inst-5');
	const report: string[] = [];
	const unmatched: string[] = [];

	for (const p of haifa.programs) {
		const officialId = MAP[p.id];
		const row = officialId ? byId.get(officialId) : undefined;
		if (officialId && !row?.sekem) throw new Error(`${p.id}: official program ${officialId} has no sekem in the snapshot`);
		if (!row?.sekem) {
			unmatched.push(`${p.id} ${p.fieldOfStudy} (kept ${p.admissionThreshold}, unverified)`);
			continue;
		}
		const old = p.admissionThreshold;
		p.officialThreshold = row.sekem;
		p.admissionThreshold = row.sekem;
		if ('sekemScore' in p) p.sekemScore = row.sekem;
		p.directBagrutEligible = !!row.bagrutOnlyMin;
		p.directBagrutMinAverage = row.bagrutOnlyMin ?? null;
		if (row.minPsychometric) p.minPsychometricFloor = row.minPsychometric;
		else delete p.minPsychometricFloor;
		p.mathRequirement = row.mathText ?? null;

		const notes = [`סכם ${row.sekem}+`];
		if (row.waitlist) notes.push(`טווח המתנה ${row.waitlist[0]}–${row.waitlist[1]} (לדיון בוועדת הקבלה)`);
		if (row.bagrutOnlyMin) notes.push(`קבלה ללא פסיכומטרי: ממוצע בגרות ${row.bagrutOnlyMin}+`);
		if (row.minPsychometric) notes.push(`פסיכומטרי ${row.minPsychometric}+`);
		if (row.otherConditions?.length) notes.push(...row.otherConditions);
		p.comments = `תנאי קבלה רשמיים תשפ"ז (אוניברסיטת חיפה): ${notes.join('; ')}`;

		p.admissionRoutes = {
			...(row.bagrutOnlyMin ? { bagrutOnlyMin: row.bagrutOnlyMin } : {}),
			...(row.minPsychometric ? { minPsychometric: row.minPsychometric } : {}),
			requirements: requirementsFor(row),
			requirementsSource: `${row.url} — תנאי הקבלה החוגיים (${UPDATED_AT})`
		};
		p.thresholdSource = `${row.url} — תנאי הקבלה החוגיים תשפ"ז: ${row.title}`;
		p.thresholdUpdatedAt = UPDATED_AT;
		report.push(`${p.fieldOfStudy}: ${old} -> ${row.sekem}${row.bagrutOnlyMin ? ` (bagrut-only ${row.bagrutOnlyMin})` : ''}`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Updated ${report.length} Haifa programs`);
	for (const l of report) console.log('  ' + l);
	console.log(`\nNo official page matched (${unmatched.length}):`);
	for (const l of unmatched) console.log('  ' + l);
}

main();
