/**
 * Imports Reichman's math requirement ("קורס הכנה במתמטיקה") into src/data/academicData.json as
 * `admissionRoutes.requirements`.
 *
 *   npx tsx scripts/data/importReichmanRequirements.ts
 *
 * Source: Reichman's undergraduate registration regulations, section 7 (src/data/sources/reichman-math-prep-tashpav.json).
 * It is the latest regulations Reichman has published for the bachelor's degree (תשפ"ו); the תשפ"ז brochure doesn't
 * list these rules. Below the school's math level, passing the prep course's final exam is a condition for admission
 * ("השגת ציון מעבר בבחינת הסיום היא תנאי לקבלה ללימודים"), so the requirement is the bagrut level OR that exam.
 * "גבוה מ-X" (strictly above) is stored as X+1.
 */

import fs from 'fs';
import path from 'path';
import type { ProgramRequirement } from '../../src/types/academic';

const ROOT = path.resolve(__dirname, '../..');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const SOURCE = 'runi.ac.il — תקנון רישום וקבלה תואר ראשון תשפ"ו, סעיף 7 "קורס הכנה במתמטיקה" (2026-10-04)';
const PREP_EXAM = 'מעבר בחינת הסיום של קורס ההכנה במתמטיקה של רייכמן (יוני–יולי)';

const math = (units: number, above: number) => ({ bagrut: [{ subjects: ['מתמטיקה'], minUnits: units, minGrade: above + 1 }] });
const requirement = (...levels: [number, number][]): ProgramRequirement[] => [
	{ id: 'math', title: 'ידע במתמטיקה', anyOf: [...levels.map(([u, g]) => math(u, g)), { exam: PREP_EXAM }] }
];

const ECONOMICS = requirement([4, 85], [5, 65]);
const BUSINESS = requirement([4, 80], [5, 65]);
const COMPUTER_SCIENCE = requirement([5, 75]);

/** Our program id -> the regulations' school rule. Programs not listed have no math requirement there. */
const TABLE: Record<string, ProgramRequirement[]> = {
	// בית ספר טיומקין לכלכלה; דו-חוגי קיימות וכלכלה
	'prog-inst-38-2': ECONOMICS, // כלכלה
	'prog-inst-38-10': ECONOMICS, // קיימות וכלכלה
	'prog-inst-38-21': ECONOMICS, // כלכלה וחשבונאות
	'prog-inst-38-22': ECONOMICS, // כלכלה ומנהל עסקים
	// בית ספר אריסון למנהל עסקים; תואר כפול משפטים ומנהל עסקים; דו-חוגי יזמות ומנהל עסקים
	'prog-inst-38-5': BUSINESS, // מנהל עסקים
	'prog-inst-38-15': BUSINESS, // משפטים ומנהל עסקים
	'prog-inst-38-17': BUSINESS, // יזמות ומנהל עסקים
	// בית ספר אפי ארזי למדעי המחשב
	'prog-inst-38-3': COMPUTER_SCIENCE, // מדעי המחשב
	'prog-inst-38-14': COMPUTER_SCIENCE, // מדעי המחשב ויזמות
	'prog-reichman-2': COMPUTER_SCIENCE, // מדע הנתונים (B.Sc), בית ספר אפי ארזי
	'prog-inst-38-23': COMPUTER_SCIENCE // מדע הנתונים ויזמות
};

function main() {
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const runi = data.find((i: any) => i.id === 'inst-38');
	const byId = new Map<string, any>(runi.programs.map((p: any) => [p.id, p]));

	for (const [id, requirements] of Object.entries(TABLE)) {
		const p = byId.get(id);
		if (!p) throw new Error(`Unknown program ${id}`);
		p.admissionRoutes = { ...(p.admissionRoutes ?? {}), requirements, requirementsSource: SOURCE };
		const levels = requirements[0].anyOf.filter((o) => o.bagrut).map((o) => `${o.bagrut![0].minUnits}u>${o.bagrut![0].minGrade - 1}`);
		console.log(`  ${p.fieldOfStudy}: ${levels.join(' / ')} או קורס הכנה`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Math requirement for ${Object.keys(TABLE).length} Reichman programs`);
}

main();
