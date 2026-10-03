/**
 * Imports the Technion "אפיק קבלה מקוצר" (semester A at the continuing-education school, then transfer to
 * semester B on first-semester grades) into src/data/academicData.json as `admissionRoutes.shortTrack`.
 * Informational only — it never changes an admission status (the grades don't exist yet).
 *
 *   npx tsx scripts/data/importTechnionShortTrack.ts
 *
 * Snapshot transcribed from the user's screenshots (the site blocks automation):
 * src/data/sources/technion-short-track-2026-10.json.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/technion-short-track-2026-10.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');

function main() {
	const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const technion = data.find((i: any) => i.id === 'inst-48');
	const byId = new Map(technion.programs.map((p: any) => [p.id, p]));
	let count = 0;

	for (const t of snap.tracks) {
		for (const id of t.program_ids) {
			const p: any = byId.get(id);
			if (!p) throw new Error(`Unknown program ${id} (${t.page_track})`);
			p.admissionRoutes = {
				...(p.admissionRoutes ?? {}),
				shortTrack: { firstSemesterAverageMin: t.firstSemesterAverageMin, minCourseGrade: t.minCourseGrade, ...(t.note ? { note: t.note } : {}) }
			};
			count++;
			console.log(`  ${p.fieldOfStudy}: ממוצע ${t.firstSemesterAverageMin}, ציון מינימום ${t.minCourseGrade}`);
		}
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Added "אפיק מקוצר" to ${count} Technion programs`);
}

main();
