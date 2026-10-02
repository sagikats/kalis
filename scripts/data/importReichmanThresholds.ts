/**
 * Imports Reichman's official admission thresholds into src/data/academicData.json.
 *
 *   npx tsx scripts/data/importReichmanThresholds.ts
 *
 * Source: Reichman's threshold table (src/data/sources/reichman-thresholds-tashpah.json, transcribed from the PDF).
 * It is the latest table Reichman has published (תשפ"ה); the תשפ"ז regulations only refer applicants to the
 * registration office, so the source label carries the year. The "ציון מתואם" is the same 800-scale score our
 * Reichman calculator produces (verified against runi.ac.il), so no conversion is needed.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/reichman-thresholds-tashpah.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const UPDATED_AT = '2026-10-02';

/** Our program id -> row in the official table. Programs not listed have no row in it. */
const MAP: Record<string, string> = {
	'prog-inst-38-3': 'מדעי המחשב / מדעי המחשב ויזמות (וכל מסלולי מדמ"ח)',
	'prog-inst-38-14': 'מדעי המחשב / מדעי המחשב ויזמות (וכל מסלולי מדמ"ח)',
	'prog-inst-38-5': 'מנהל עסקים חד חוגי',
	'prog-inst-38-17': 'מנהל עסקים ויזמות',
	'prog-inst-38-2': 'כלכלה ויזמות / כלכלה ומנהל עסקים / כלכלה וקיימות',
	'prog-inst-38-22': 'כלכלה ויזמות / כלכלה ומנהל עסקים / כלכלה וקיימות',
	'prog-inst-38-10': 'כלכלה ויזמות / כלכלה ומנהל עסקים / כלכלה וקיימות',
	'prog-inst-38-21': 'התכנית בחשבונאות',
	'prog-inst-38-4': 'ממשל / ממשל וקיימות',
	'prog-inst-38-11': 'ממשל / ממשל וקיימות',
	'prog-inst-38-9': 'תקשורת',
	'prog-inst-38-7': 'פסיכולוגיה',
	'prog-inst-38-15': 'משפטים תארים כפולים',
	'prog-inst-38-16': 'משפטים תארים כפולים'
};

interface Row {
	program: string;
	matched: number;
	bagrut: number;
	psychometric: number | null;
	minPsychInMatched?: number;
}

function main() {
	const table = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const byName = new Map<string, Row>(table.rows.map((r: Row) => [r.program, r]));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const runi = data.find((i: any) => i.id === 'inst-38');
	const report: string[] = [];
	const unmatched: string[] = [];

	for (const p of runi.programs) {
		const row = MAP[p.id] ? byName.get(MAP[p.id]) : undefined;
		if (!row) {
			unmatched.push(`${p.id} ${p.fieldOfStudy} (kept ${p.admissionThreshold}, unverified)`);
			continue;
		}
		const old = p.admissionThreshold;
		p.officialThreshold = row.matched;
		p.admissionThreshold = row.matched;
		p.relevantSekemType = 'general';
		p.directBagrutMinAverage = row.bagrut;
		if (row.minPsychInMatched) p.minPsychometricFloor = row.minPsychInMatched;
		// Official routes: matched score (+ min psychometric), bagrut alone, or psychometric alone
		p.admissionRoutes = {
			bagrutOnlyMin: row.bagrut,
			...(row.psychometric ? { psychometricOnlyMin: row.psychometric } : {}),
			...(row.minPsychInMatched ? { minPsychometric: row.minPsychInMatched } : {})
		};
		p.thresholdSource = `${table.source} — טבלת ספים תשפ"ה: ${row.program}`;
		p.thresholdUpdatedAt = UPDATED_AT;
		report.push(`${p.fieldOfStudy}: ${old} -> ${row.matched} (bagrut-only ${row.bagrut})`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Updated ${report.length} Reichman programs`);
	for (const l of report) console.log('  ' + l);
	console.log(`\nNot in the official table (${unmatched.length}):`);
	for (const l of unmatched) console.log('  ' + l);
}

main();
