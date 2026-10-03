/**
 * Imports the Technion "ראויים לקידום" sekem discount (1–2 points per track) into src/data/academicData.json as
 * `admissionRoutes.promotionBonus`. Informational: shown as an alternative path, never changes the status
 * (recognition by the Israel Association for the Advancement of Education can't be known from the profile).
 *
 *   npx tsx scripts/data/importTechnionPromotion.ts
 *
 * Snapshot (from the summary table "סיכום אפשרויות הקבלה למסלולים", user's screenshot):
 * src/data/sources/technion-promotion-2026-10.json.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/technion-promotion-2026-10.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');

function main() {
	const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const technion = data.find((i: any) => i.id === 'inst-48');
	const byId = new Map(technion.programs.map((p: any) => [p.id, p]));
	let count = 0;
	for (const [points, ids] of Object.entries(snap.bonus_points) as [string, string[]][]) {
		for (const id of ids) {
			const p: any = byId.get(id);
			if (!p) throw new Error(`Unknown program ${id}`);
			p.admissionRoutes = { ...(p.admissionRoutes ?? {}), promotionBonus: Number(points) };
			count++;
		}
	}
	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Added the "ראויים לקידום" discount to ${count} Technion programs`);
}

main();
