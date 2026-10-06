/**
 * Imports the Technion's official admission requirements (math, English) into src/data/academicData.json as
 * `admissionRoutes.requirements` + `requirementsSource`.
 *
 *   npx tsx scripts/data/importTechnionRequirements.ts
 *
 * Source: src/data/sources/technion-requirements-2026-10-06.json (admissions.technion.ac.il pages read in a browser).
 * - Most programs: math 5u 70+, or math 4u+ with the math classification exam at 70+; English 104+ (psychometric /
 *   Amir / Amirnet); English at least 4u in the bagrut.
 * - Biology, chemistry, biology-chemistry: math 4u 80+ or 5u 70+. Architecture, landscape architecture: math 4u 70+ or 5u 65+.
 * - Medicine tracks: math as most programs; English 120+.
 * The Technion has no physics requirement. Idempotent: replaces only the requirements it owns.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/technion-requirements-2026-10-06.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const OWNED = new Set(['math', 'english', 'english-bagrut']);

const math = (anyOf: any[], otherOptions?: string) => ({ id: 'math', title: 'ידע במתמטיקה', anyOf, ...(otherOptions ? { otherOptions } : {}) });
const bagrutMath = (minUnits: number, minGrade = 0) => ({ subjects: ['מתמטיקה'], minUnits, minGrade });

function main() {
	const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const technion = data.find((i: any) => i.id === 'inst-48');
	const groups = snap.groups as Record<string, string[]>;
	const src = snap.sources;

	const mathMost = math(
		[{ bagrut: [bagrutMath(5, 70)] }, { bagrut: [bagrutMath(4)], exam: 'מבחן סיווג במתמטיקה בציון 70+' }],
		'קורס חדו"א א\' (20406) באוניברסיטה הפתוחה בציון 65+ פוטר ממבחן הסיווג'
	);
	const mathBiology = math([{ bagrut: [bagrutMath(4, 80)] }, { bagrut: [bagrutMath(5, 70)] }]);
	const mathArchitecture = math([{ bagrut: [bagrutMath(4, 70)] }, { bagrut: [bagrutMath(5, 65)] }]);
	const english = (min: number, otherOptions: string) => ({
		id: 'english',
		title: min >= 120 ? 'רמת אנגלית (מתקדמים ב\')' : 'רמת אנגלית (מתקדמים א\')',
		anyOf: [{ psych: [{ section: 'english', min }] }],
		otherOptions
	});
	const englishBagrut = { id: 'english-bagrut', title: 'אנגלית בבגרות (4 יח"ל לפחות)', anyOf: [{ bagrut: [{ subjects: ['אנגלית'], minUnits: 4, minGrade: 0 }] }] };

	let count = 0;
	for (const p of technion.programs) {
		if (p.notOffered) continue;
		const isMedicine = groups.medicine.includes(p.id);
		const mathReq = groups.biologyChemistry.includes(p.id) ? mathBiology : groups.architecture.includes(p.id) ? mathArchitecture : mathMost;
		const englishReq = isMedicine
			? english(120, 'ציון 120+ באמי"ר / אמירנט, SAT אנגלית 600+, ACT אנגלית 26+')
			: english(104, 'ציון 104+ באמי"ר / אמירנט, SAT אנגלית 520+, ACT אנגלית 22+');
		const sources = [src.general.url, src.sekem.url, src.math.url, src.english.url, ...(isMedicine ? [src.medicine.url] : [])];
		const routes = p.admissionRoutes ?? {};
		routes.requirements = [...(routes.requirements ?? []).filter((r: any) => !OWNED.has(r.id)), mathReq, englishReq, englishBagrut];
		routes.requirementsSource = `${sources.join(' ; ')} — ${snap.fetched}`;
		p.admissionRoutes = routes;
		count++;
	}
	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Technion requirements (math, English) on ${count} programs`);
}

main();
