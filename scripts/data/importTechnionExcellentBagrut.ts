/**
 * Imports the Technion "בגרות מצוינת" route (admission without psychometric on per-subject bagrut conditions)
 * into src/data/academicData.json as `admissionRoutes.excellentBagrut`.
 *
 *   npx tsx scripts/data/importTechnionExcellentBagrut.ts
 *
 * Source: https://admissions.technion.ac.il/acceptance-without-psychometric-exam/ (סמסטר א' תשפ"ז). The site blocks
 * automated access, so the snapshot was transcribed from the user's screenshots:
 * src/data/sources/technion-excellent-bagrut-2026-10.json.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/technion-excellent-bagrut-2026-10.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');

function main() {
	const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const technion = data.find((i: any) => i.id === 'inst-48');
	const byId = new Map(technion.programs.map((p: any) => [p.id, p]));
	const report: string[] = [];

	for (const track of snap.tracks) {
		for (const id of track.program_ids) {
			const p: any = byId.get(id);
			if (!p) throw new Error(`Unknown program ${id} (${track.page_track})`);
			p.admissionRoutes = { ...(p.admissionRoutes ?? {}), excellentBagrut: track.route };
			report.push(`${p.fieldOfStudy} ← ${track.page_track}: ${track.route.summary}`);
		}
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Added "בגרות מצוינת" to ${report.length} Technion programs`);
	for (const l of report) console.log('  ' + l);
}

main();
