/**
 * Imports HUJI's official per-program requirements ("תנאי סף" › "תנאים נוספים") into src/data/academicData.json as
 * `admissionRoutes.requirements` (+ the official minimum psychometric for medicine / dental medicine).
 *
 *   npx tsx scripts/data/importHujiPrerequisites.ts
 *
 * Source: each program page on info.huji.ac.il/bachelor/<page> (snapshot with the verbatim text, the track codes on
 * each page and our program -> page mapping: src/data/sources/huji-prerequisites-2026-10-04.json). Our programs are
 * matched to pages through the official track code in their thresholdSource.
 *
 * Hand-transcribed conventions:
 * - Only admission conditions are modelled. "יחויב בהשלמת החומר" (agriculture) and economics' "יידרשו להשלים את
 *   החומר" are obligations after admission, so those programs get an empty list.
 * - A page with no math/science condition gets an empty list (official: none), replacing the generic estimate.
 * - Business administration / accounting: the page says "4 יח"ל לפחות" without a grade; HUJI's threshold sheet
 *   (huji-thresholds-2026-10-02.csv) states 60, which is used.
 * - "מקצוע מדעי נוסף על מתמטיקה בבגרות" names no subjects/units; physics, chemistry, biology or computer science at
 *   any level is accepted (interpretation, marked in otherOptions).
 * - Open University course alternatives go to `otherOptions`.
 * - English: each page's "רמת אנגלית מינימלית" (snapshot `englishMinimum`: 85 בסיסי / 100 מתקדמים א' / 120 מתקדמים ב' /
 *   פטור 134) becomes an English-section requirement.
 */

import fs from 'fs';
import path from 'path';
import type { ProgramRequirement, RequirementOption } from '../../src/types/academic';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/huji-prerequisites-2026-10-04.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const SOURCE = 'info.huji.ac.il — "תנאי סף" › "תנאים נוספים" (2026-10-04)';

const math = (units: number, grade: number): RequirementOption => ({ bagrut: [{ subjects: ['מתמטיקה'], minUnits: units, minGrade: grade }] });
const OU_COURSES = 'קורסי חשבון דיפרנציאלי ואינטגרלי באוניברסיטה הפתוחה (באישור ועדת הקבלה)';

const SCIENCE: ProgramRequirement = {
	id: 'science',
	title: 'מקצוע מדעי נוסף',
	anyOf: [{ bagrut: [{ subjects: ['פיזיקה', 'כימיה', 'ביולוגיה', 'מדעי המחשב'], minUnits: 1, minGrade: 55 }] }],
	otherOptions: 'הדף הרשמי לא מפרט אילו מקצועות ובאיזה היקף — מתקבל כל מקצוע מדעי בבגרות'
};

/** Page -> requirements. Pages not listed (but in the snapshot) have no subject requirement. */
const BY_PAGE: Record<string, ProgramRequirement[]> = {
	'Business-Administration': [
		{
			id: 'math',
			title: 'ידע במתמטיקה',
			anyOf: [math(4, 60), { ...math(3, 55), exam: 'מכינה במתמטיקה (ספטמבר–אוקטובר) ומעבר בחינת הביניים בציון 60+' }],
			otherOptions: `השלמת בגרות ל-4 יח"ל; מכינה אוניברסיטאית ברמת 4 יח"ל; ${OU_COURSES}`
		}
	],
	Accounting: [
		{
			id: 'math',
			title: 'ידע במתמטיקה',
			anyOf: [math(4, 60), { ...math(3, 55), exam: 'מכינה במתמטיקה (ספטמבר) ומעבר בחינת הביניים בציון 60+' }],
			otherOptions: `השלמת בגרות ל-4 יח"ל; מכינה אוניברסיטאית ברמת 4 יח"ל; ${OU_COURSES}`
		}
	],
	'Statistics-And-Data-Science': [{ id: 'math', title: 'ידע במתמטיקה', anyOf: [math(4, 60)], otherOptions: OU_COURSES }],
	'Exact-Sciences': [{ id: 'math', title: 'ידע במתמטיקה', anyOf: [math(4, 60)], otherOptions: OU_COURSES }, SCIENCE],
	'Electrical-Engineering-and-Applied-Physics': [
		{ id: 'math', title: 'ידע במתמטיקה', anyOf: [math(4, 90), math(5, 70)], otherOptions: `${OU_COURSES} בציון 65+` }
	],
	Physics: [
		{
			id: 'math',
			title: 'ידע במתמטיקה',
			anyOf: [math(4, 90), math(5, 65), { exam: 'סיום מכינת קיץ במתמטיקה בפקולטה לחקלאות (40 שעות) בציון 60+' }],
			otherOptions: `${OU_COURSES} בציון 65+`
		},
		SCIENCE
	],
};

const ENGLISH_LEVELS: [RegExp, number, string][] = [
	[/^פטור/, 134, 'פטור'],
	[/120/, 120, "מתקדמים ב'"],
	[/100/, 100, "מתקדמים א'"],
	[/85/, 85, 'בסיסי']
];
function englishRequirement(minimum: string | null, page: string): ProgramRequirement | undefined {
	if (!minimum) return undefined;
	const level = ENGLISH_LEVELS.find(([re]) => re.test(minimum));
	if (!level) throw new Error(`Unparsed English minimum "${minimum}" on ${page}`);
	const [, min, name] = level;
	return {
		id: 'english',
		title: `רמת אנגלית (${name})`,
		anyOf: [{ psych: [{ section: 'english', min }] }],
		otherOptions: page === 'English' ? 'אמי"ר / אמיר"ם 134+ או פטור מאנגלית ממוסד מוכר' : `ציון ${min}+ באמירנט / אמי"ר`
	};
}

/** Official minimum general psychometric ("כל המועמדים נדרשים ..."). */
const MIN_PSYCH_BY_PAGE: Record<string, number> = { Medicine: 700, 'Dental-Medicine': 640 };

function main() {
	const snap = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const pages = new Set<string>(snap.pages.map((p: any) => p.page));
	const englishByPage = new Map<string, string | null>(snap.pages.map((p: any) => [p.page, p.englishMinimum]));
	for (const page of [...Object.keys(BY_PAGE), ...Object.keys(MIN_PSYCH_BY_PAGE)]) {
		if (!pages.has(page)) throw new Error(`${page} is not in the snapshot`);
	}
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const huji = data.find((i: any) => i.id === 'inst-1');
	const byId = new Map<string, any>(huji.programs.map((p: any) => [p.id, p]));
	let withReqs = 0;

	for (const [id, { page }] of Object.entries<any>(snap.programMap)) {
		const p = byId.get(id);
		if (!p) throw new Error(`Unknown program ${id}`);
		const english = englishRequirement(englishByPage.get(page) ?? null, page);
		const requirements = [...(BY_PAGE[page] ?? []), ...(english ? [english] : [])];
		const routes = { ...(p.admissionRoutes ?? {}), requirements, requirementsSource: `${SOURCE}: https://info.huji.ac.il/bachelor/${page}` };
		if (MIN_PSYCH_BY_PAGE[page]) {
			routes.minPsychometric = MIN_PSYCH_BY_PAGE[page];
			p.minPsychometricFloor = MIN_PSYCH_BY_PAGE[page];
		}
		p.admissionRoutes = routes;
		if (requirements.length || MIN_PSYCH_BY_PAGE[page]) {
			withReqs++;
			console.log(`  ${p.fieldOfStudy}: ${[...requirements.map((r) => r.title), ...(MIN_PSYCH_BY_PAGE[page] ? [`פסיכומטרי ${MIN_PSYCH_BY_PAGE[page]}`] : [])].join(', ')}`);
		}
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Official requirements for ${Object.keys(snap.programMap).length} HUJI programs (${withReqs} with a condition)`);
}

main();
