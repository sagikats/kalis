/**
 * Imports the Technion's official admission thresholds into src/data/academicData.json.
 *
 *   npx tsx scripts/data/importTechnionThresholds.ts
 *
 * Source: "טבלת סיכום של אפשרויות קבלה לכל המסלולים (אוקטובר 2026)" on admissions.technion.ac.il
 * (snapshot: src/data/sources/technion-thresholds-2026-10.json — copied by the user, since the site blocks
 * automated access). The table's sekem is the same 0–100 scale our Technion calculator outputs (user-verified),
 * so no conversion is needed.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/technion-thresholds-2026-10.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const UPDATED_AT = '2026-10-02';

/** Our names that differ from the table's. */
const ALIASES: Record<string, string> = {
	'הנדסה ביו-רפואית': 'הנדסה ביו רפואית',
	'הנדסה ביו-רפואית ופיזיקה': 'הנדסה ביו רפואית ופיזיקה',
	'הנדסת נתונים ומידע ומתמטיקה': 'הנדסת נתונים ומידע ומתמטיקה (דו-חוגי)',
	'חינוך למדע וטכנולוגיה': 'חינוך למדע וטכנולוגיה (תואר ראשון)',
	'חינוך למדע וטכנולוגיה - מדעי המחשב': 'חינוך למדע וטכנולוגיה-מדעי המחשב (תואר ראשון)',
	'מדעי הרפואה והנדסה ביו-רפואית (מסלול כפול)': 'מדעי הרפואה והנדסה ביו-רפואית (תואר כפול)',
	'מדעי הרפואה והנדסת נתונים ומידע (מסלול כפול)': 'מדעי הרפואה והנדסת נתונים ומידע (תואר כפול)',
	'מדעי הרפואה ומדעי המחשב (מסלול כפול)': 'מדעי הרפואה ומדעי המחשב (תואר כפול)',
	'רפואה (M.D.)': 'מדעי הרפואה - מגמת רפואה'
};

function main() {
	const table = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const technion = data.find((i: any) => i.id === 'inst-48');
	const report: string[] = [];
	const unmatched: string[] = [];

	for (const p of technion.programs) {
		const name = ALIASES[p.fieldOfStudy] ?? p.fieldOfStudy;
		const row: [number, number | null] | undefined = table.rows[name];
		if (!row) {
			unmatched.push(`${p.id} ${p.fieldOfStudy} (kept ${p.admissionThreshold}, unverified)`);
			continue;
		}
		const old = p.admissionThreshold;
		const isMedicine = name.startsWith('מדעי הרפואה');
		p.officialThreshold = row[0];
		p.admissionThreshold = row[0];
		p.relevantSekemType = 'technion';
		p.thresholdSource = `${table.source} — טבלת אפיקי קבלה, אוקטובר 2026${isMedicine ? ' (סף זימון למו"ר)' : ''}`;
		p.thresholdUpdatedAt = UPDATED_AT;
		report.push(`${p.fieldOfStudy}: ${old} -> ${row[0]}`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Updated ${report.length} Technion programs`);
	for (const l of report) console.log('  ' + l);
	console.log(`\nNot in the official table (${unmatched.length}):`);
	for (const l of unmatched) console.log('  ' + l);
}

main();
