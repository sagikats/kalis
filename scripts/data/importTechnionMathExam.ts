/**
 * Imports the Technion "קבלה על סמך בגרות ובחינת סיווג במתמטיקה" route into src/data/academicData.json as
 * `admissionRoutes.mathExam`. Informational: the report shows the exam score an eligible applicant needs.
 *
 *   npx tsx scripts/data/importTechnionMathExam.ts
 *
 * Snapshot transcribed from the user's screenshots (the site blocks automation):
 * src/data/sources/technion-math-exam-2026-10.json. The conversion formula matches all 12 rows of the
 * official conversion table.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/technion-math-exam-2026-10.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');

function main() {
	const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const technion = data.find((i: any) => i.id === 'inst-48');
	const byId = new Map(technion.programs.map((p: any) => [p.id, p]));
	const groups: [string[], any][] = [
		[snap.programs.most, snap.eligibility_most],
		[snap.programs.biology, snap.eligibility_biology]
	];
	let count = 0;
	for (const [ids, eligibility] of groups) {
		for (const id of ids) {
			const p: any = byId.get(id);
			if (!p) throw new Error(`Unknown program ${id}`);
			p.admissionRoutes = {
				...(p.admissionRoutes ?? {}),
				mathExam: {
					eligibility,
					minExamScore: snap.minExamScore,
					conversion: { slope: snap.conversion.slope, intercept: snap.conversion.intercept }
				}
			};
			count++;
		}
	}
	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Added "בגרות ובחינת סיווג במתמטיקה" to ${count} Technion programs`);
}

main();
