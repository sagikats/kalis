/**
 * Adds BGU's university-wide English requirement to every active BGU program in src/data/academicData.json.
 *
 *   npx tsx scripts/data/importBguEnglishRule.ts
 *
 * Source: BGU's applicant handbook for תשפ"ז ("ידיעון למועמדים לתואר ראשון – מבוא", updated 01.01.2026), basic admission
 * condition ד: "רמה באנגלית – חובת עמידה ברמה 'בסיסי' לפחות למעט מחלקות שבהן נדרשת רמה גבוהה יותר". Candidates below the
 * required level "לא יוכלו להתחיל את לימודיהם … גם אם הם עומדים בדרישות הקבלה האחרות". בסיסי = 85–99 in the English
 * section of the psychometric / אמי"ר. Snapshot: src/data/sources/bgu-english-rule-2026.json.
 *
 * Programs that already carry an English requirement (a department-specific higher level, e.g. medicine 120) keep it.
 * The rule is added to the sekem route and, where BGU publishes one, to the bagrut-only route; without an English score the
 * requirement is "unknown" and doesn't block (programRequirements.isBlocking). `requirementsSource` is not set here, so
 * programs without official subject data keep the generic subject estimate. Idempotent.
 */
import fs from 'fs';
import path from 'path';

const JSON_PATH = path.join(path.resolve(__dirname, '../..'), 'src/data/academicData.json');
const RULE = {
	id: 'english',
	title: 'רמת אנגלית (בסיסי)',
	anyOf: [{ psych: [{ section: 'english' as const, min: 85 }] }],
	otherOptions: 'ציון 85+ באמי"ר / אמיר"ם (כלל אוניברסיטאי, ידיעון תשפ"ז)'
};
const hasEnglish = (reqs?: { id?: string; title?: string }[]) =>
	(reqs ?? []).some((r) => r.id?.startsWith('english') || r.title?.includes('אנגלית'));

function main() {
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const bgu = data.find((i: { id: string }) => i.id === 'inst-3');
	let added = 0;
	for (const p of bgu.programs) {
		if (p.notOffered) continue;
		p.admissionRoutes = p.admissionRoutes ?? {};
		const routes = p.admissionRoutes;
		if (!hasEnglish(routes.requirements)) {
			routes.requirements = [...(routes.requirements ?? []), RULE];
			added++;
		}
		if (routes.bagrutOnlyRequirements && !hasEnglish(routes.bagrutOnlyRequirements)) {
			routes.bagrutOnlyRequirements = [...routes.bagrutOnlyRequirements, RULE];
		}
	}
	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`BGU English rule added to ${added} programs`);
}

main();
