/**
 * Imports BGU's official admission thresholds ("חתכי קבלה", סתו תשפ"ז) into src/data/academicData.json.
 *
 *   npx tsx scripts/data/importBguThresholds.ts
 *
 * Source: BGU's official calculator service (bgucr4u.bgu.ac.il/ords/sc/calculators/GetRdpData, used by
 * apps4cloud.bgu.ac.il/calcprod "חתכי קבלה"). Snapshot: src/data/sources/bgu-thresholds-2026-10-02.json.
 *
 * Per track: psycho_sekem = sekem threshold, sekem_label = which sekem (general / quantitative / engineering),
 * psycho_and_or "ובנוסף" + psycho_value = an extra minimum psychometric, "או" + psycho_value = a psychometric-only
 * route, bagrut_average = bagrut-only route. Tracks admitting by psychometric alone (no sekem) are left unverified:
 * the platform compares a sekem, not a raw psychometric score, against the threshold.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/bgu-thresholds-2026-10-02.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const SOURCE = 'https://apps4cloud.bgu.ac.il/calcprod/';
const UPDATED_AT = '2026-10-02';

interface Row {
	department: number;
	path_dsc: string;
	department_url: string;
	sekem_label: string;
	psycho_sekem: number | null;
	psycho_and_or: string | null;
	psycho_value: number | null;
	bagrut_average: number | null;
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
/** Matching key: ignores spacing/hyphen variants and פיזיקה/פיסיקה spelling. */
const key = (s: string) => s.replace(/[\s\-]/g, '').replace(/פיזיקה/g, 'פיסיקה').replace(/כפול(ו)/g, 'כפול');

function sekemTypeFor(label: string): 'general' | 'quantitative' | 'engineering' {
	if (label.includes('הנדסה')) return 'engineering';
	if (label.includes('כמותי')) return 'quantitative';
	return 'general';
}

function main() {
	const rows: Row[] = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const byPath = new Map(rows.map((r) => [key(r.path_dsc), r]));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const bgu = data.find((i: any) => i.id === 'inst-3');
	const report: string[] = [];
	const psychOnly: string[] = [];
	const unmatched: string[] = [];

	for (const p of bgu.programs) {
		const m = norm(p.fieldOfStudy).match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)$/);
		const row = m ? byPath.get(key(m[1])) : undefined;
		if (!row) {
			unmatched.push(`${p.id} ${p.fieldOfStudy} (kept ${p.admissionThreshold}, unverified)`);
			continue;
		}
		p.directBagrutMinAverage = row.bagrut_average ?? null;
		if (!row.psycho_sekem) {
			psychOnly.push(`${p.fieldOfStudy}: psychometric ${row.psycho_value ?? '—'}, bagrut-only ${row.bagrut_average ?? '—'}`);
			continue;
		}
		const old = p.admissionThreshold;
		p.officialThreshold = row.psycho_sekem;
		p.admissionThreshold = row.psycho_sekem;
		p.relevantSekemType = sekemTypeFor(row.sekem_label);
		if (row.psycho_and_or?.includes('ובנוסף') && row.psycho_value) p.minPsychometricFloor = row.psycho_value;
		p.thresholdSource = `${SOURCE} — חתכי קבלה סתו תשפ"ז: ${norm(row.path_dsc)}`;
		p.thresholdUpdatedAt = UPDATED_AT;
		report.push(`${norm(row.path_dsc)}: ${old} -> ${row.psycho_sekem} (${p.relevantSekemType}${p.minPsychometricFloor ? `, min psych ${p.minPsychometricFloor}` : ''})`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Updated ${report.length} BGU programs`);
	for (const l of report) console.log('  ' + l);
	console.log(`\nPsychometric-only tracks (${psychOnly.length}) — left unverified:`);
	for (const l of psychOnly) console.log('  ' + l);
	console.log(`\nUnmatched (${unmatched.length}):`);
	for (const l of unmatched) console.log('  ' + l);
}

main();
