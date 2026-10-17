/**
 * Technion architecture and landscape architecture: their sekem has its own formula that includes an entrance exam,
 * so the regular sekem compared against their thresholds (85 / 82) was wrong.
 *
 *   npx tsx scripts/data/importTechnionEntranceExam.ts
 *
 * Source: the official calculator (admissions.technion.ac.il/calculator), 2026-10-17 — "חישוב סכם לארכיטקטורה"
 * (form 73: 0.7 × (0.1·D + 0.09·P + 15) + 0.3·E, exam scale 0–140) and "חישוב סכם לאדריכלות נוף"
 * (form 74: 0.65 × (0.412·D + 0.08·P − 13) + 0.35·E − 1.5, exam scale 0–123). The formulas live in
 * src/modules/calculators/technion.ts; this step only marks the two programs. Idempotent; runs after the Technion importers.
 */
import fs from 'fs';
import path from 'path';

const JSON_PATH = path.join(path.resolve(__dirname, '../..'), 'src/data/academicData.json');
const SOURCE = 'https://admissions.technion.ac.il/calculator/ — חישוב סכם לארכיטקטורה / לאדריכלות נוף (2026-10-17)';

const EXAMS: Record<string, { kind: 'architecture' | 'landscape'; examName: string; scaleMax: number }> = {
	'ארכיטקטורה': { kind: 'architecture', examName: 'בחינת הכניסה לארכיטקטורה', scaleMax: 140 },
	'אדריכלות נוף': { kind: 'landscape', examName: 'בחינת הכניסה לאדריכלות נוף', scaleMax: 123 }
};

function main() {
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const technion = data.find((i: { id: string }) => i.id === 'inst-48');
	const done: string[] = [];
	for (const p of technion.programs) {
		const exam = EXAMS[p.fieldOfStudy];
		if (!exam) continue;
		const routes = (p.admissionRoutes = p.admissionRoutes ?? {});
		routes.entranceExam = { ...exam, source: SOURCE };
		done.push(p.fieldOfStudy);
	}
	const missing = Object.keys(EXAMS).filter((n) => !done.includes(n));
	if (missing.length > 0) throw new Error(`Technion programs not found: ${missing.join(', ')}`);
	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Marked ${done.length} Technion programs with an entrance-exam sekem.`);
}

main();
