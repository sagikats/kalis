/**
 * Imports TAU's minimum general psychometric score ("דרישות הסף של התוכנית") — required in addition to the
 * ציון התאמה threshold — into src/data/academicData.json as `admissionRoutes.minPsychometric`.
 *
 *   npx tsx scripts/data/importTauMinPsychometric.ts
 *
 * Source: the "תנאי קבלה" tab of each go.tau.ac.il program page.
 * Snapshot (URL + quote per program): src/data/sources/tau-min-psychometric-2026-10-03.json.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/tau-min-psychometric-2026-10-03.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');

function main() {
	const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const tau = data.find((i: any) => i.id === 'inst-6');
	const byId = new Map(tau.programs.map((p: any) => [p.id, p]));

	for (const row of snap.programs) {
		const p: any = byId.get(row.program_id);
		if (!p) throw new Error(`Unknown program ${row.program_id}`);
		const min = Math.max(row.min_psychometric, p.admissionRoutes?.minPsychometric ?? 0);
		p.admissionRoutes = { ...(p.admissionRoutes ?? {}), minPsychometric: min };
		p.minPsychometricFloor = min;
		console.log(`  ${p.fieldOfStudy}: פסיכומטרי ${min}+`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Set a minimum psychometric for ${snap.programs.length} TAU programs`);
}

main();
