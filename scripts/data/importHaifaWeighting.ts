/**
 * Sets each Haifa program's bagrut:psychometric weighting (relevantSekemType) in src/data/academicData.json.
 *
 *   npx tsx scripts/data/importHaifaWeighting.ts
 *
 * Source: src/data/sources/haifa-weighting-2026-10-07.json — admissions.haifa.ac.il/score-calculation/ (weighting per
 * faculty) and the user's runs of the Haifa calculator (per-program exceptions). The faculty comes from the program page
 * URL that importHaifaThresholds stored in thresholdSource. 'engineering' is the 1:3 mathematical score (PM).
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/haifa-weighting-2026-10-07.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');

function main() {
	const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const haifa = data.find((i: any) => i.id === 'inst-5');
	const counts: Record<string, number> = {};
	for (const p of haifa.programs) {
		if (p.notOffered) continue;
		const m = /haifa\.ac\.il\/([^/]+)\/program\/(\d+)/.exec(p.thresholdSource ?? '');
		if (!m) throw new Error(`${p.id} ${p.fieldOfStudy}: no program page in thresholdSource`);
		const [, faculty, code] = m;
		const type = snap.byProgram[code]?.type ?? snap.byFaculty[faculty];
		if (!type) throw new Error(`${p.id} ${p.fieldOfStudy}: no weighting for faculty ${faculty}`);
		p.relevantSekemType = type;
		counts[type] = (counts[type] ?? 0) + 1;
	}
	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log('Haifa weightings:', counts);
}

main();
