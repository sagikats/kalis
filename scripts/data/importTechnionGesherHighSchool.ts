/**
 * Imports Technion "גשר קבלה" and "מתיכון לטכניון" (informational routes) and marks programs missing from the
 * official October 2026 tables as not offered, into src/data/academicData.json.
 *
 *   npx tsx scripts/data/importTechnionGesherHighSchool.ts
 *
 * Snapshot transcribed from the user's screenshots (the site blocks automation):
 * src/data/sources/technion-gesher-highschool-2026-10.json.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/technion-gesher-highschool-2026-10.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');

function main() {
	const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const technion = data.find((i: any) => i.id === 'inst-48');
	const byId = new Map(technion.programs.map((p: any) => [p.id, p]));
	const get = (id: string): any => {
		const p = byId.get(id);
		if (!p) throw new Error(`Unknown program ${id}`);
		return p;
	};

	for (const id of snap.gesher.programs) {
		const p = get(id);
		p.admissionRoutes = { ...(p.admissionRoutes ?? {}), gesher: { maxBonus: snap.gesher.maxBonus, eligibility: snap.gesher.eligibility } };
	}
	for (const id of snap.from_high_school.programs) {
		const p = get(id);
		const note = snap.from_high_school.notes?.[id];
		p.admissionRoutes = { ...(p.admissionRoutes ?? {}), fromHighSchool: note ? { note } : {} };
	}
	for (const id of snap.not_offered.programs) {
		get(id).notOffered = { note: snap.not_offered.note, source: snap.not_offered.source };
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`גשר: ${snap.gesher.programs.length}, מתיכון לטכניון: ${snap.from_high_school.programs.length}, not offered: ${snap.not_offered.programs.length}`);
}

main();
