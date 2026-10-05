/**
 * Imports BGU's official per-track subject requirements into src/data/academicData.json as
 * `admissionRoutes.requirements` (psychometric/sekem route) and `admissionRoutes.bagrutOnlyRequirements`
 * (bagrut-only route).
 *
 *   npx tsx scripts/data/importBguRequirements.ts
 *
 * Source: the same BGU calculator snapshot as importBguThresholds.ts (src/data/sources/bgu-thresholds-2026-10-02.json):
 * `psycho_info` = requirements of the psychometric route, `bagrut_info` = of the bagrut-only route.
 * Format: "מתמטיקה 90/4 או 80/5<br> ובנוסף  פיסיקה70/5<br> ובנוסף  חשיבה כמותית  125" — grade/units, "או" = alternatives
 * of the same subject, each line = one more requirement. Consecutive lines of the same subject are alternatives.
 */

import fs from 'fs';
import path from 'path';
import type { ProgramRequirement, RequirementOption } from '../../src/types/academic';
import { ALIASES as BGU_ALIASES } from './bguAliases';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/bgu-thresholds-2026-10-02.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const SOURCE = 'https://apps4cloud.bgu.ac.il/calcprod/ — חתכי קבלה סתו תשפ"ז (2026-10-02)';

interface Row {
	path_dsc: string;
	psycho_info: string | null;
	bagrut_info: string | null;
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const key = (s: string) => s.replace(/[\s\-]/g, '').replace(/פיזיקה/g, 'פיסיקה').replace(/כפול(ו)/g, 'כפול');

const SUBJECTS: Record<string, { id: string; name: string; title: string }> = {
	'מתמטיקה': { id: 'math', name: 'מתמטיקה', title: 'מתמטיקה' },
	'פיסיקה': { id: 'physics', name: 'פיזיקה', title: 'פיזיקה' },
	'פיזיקה': { id: 'physics', name: 'פיזיקה', title: 'פיזיקה' },
	'כימיה': { id: 'chemistry', name: 'כימיה', title: 'כימיה' },
	'אנגלית': { id: 'english', name: 'אנגלית', title: 'אנגלית' },
	'הבעה עברית': { id: 'hebrew', name: 'הבעה עברית', title: 'הבעה עברית' }
};

export function parseBguInfo(info: string | null): ProgramRequirement[] {
	if (!info) return [];
	const lines = info
		.split(/<br\s*\/?>/)
		.map((l) => norm(l.replace(/^\s*ובנוסף\s*/, '')))
		.filter(Boolean);
	const reqs: ProgramRequirement[] = [];
	for (const line of lines) {
		const quant = line.match(/^חשיבה כמותית\s*(\d+)$/);
		if (quant) {
			reqs.push({ id: 'quant', title: 'חשיבה כמותית', anyOf: [{ psych: [{ section: 'quant', min: Number(quant[1]) }] }] });
			continue;
		}
		const m = line.match(/^(.+?)\s*(\d+\/\d+(?:\s*או\s*\d+\/\d+)*)$/);
		const subject = m && SUBJECTS[m[1].trim()];
		if (!m || !subject) throw new Error(`Unparsed BGU requirement line: "${line}" (in "${info}")`);
		const options: RequirementOption[] = m[2].split('או').map((alt) => {
			const [grade, units] = alt.trim().split('/').map(Number);
			return { bagrut: [{ subjects: [subject.name], minUnits: units, minGrade: grade }] };
		});
		const prev = reqs[reqs.length - 1];
		if (prev?.id === subject.id) prev.anyOf.push(...options); // e.g. "מתמטיקה 80/4 או 60/5<br />מתמטיקה 95/3"
		else reqs.push({ id: subject.id, title: subject.title, anyOf: options });
	}
	return reqs;
}

function main() {
	const rows: Row[] = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const byPath = new Map(rows.map((r) => [key(r.path_dsc), r]));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const bgu = data.find((i: any) => i.id === 'inst-3');
	let count = 0;

	for (const p of bgu.programs) {
		const m = norm(p.fieldOfStudy).match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)$/);
		// Same hand-mapped names as the threshold import
		const official = BGU_ALIASES[p.id] ?? m?.[1];
		const row = official ? byPath.get(key(official)) : undefined;
		if (!row) continue;
		const requirements = parseBguInfo(row.psycho_info);
		const bagrutOnly = parseBguInfo(row.bagrut_info);
		const routes = { ...(p.admissionRoutes ?? {}) };
		delete routes.requirements;
		delete routes.bagrutOnlyRequirements;
		delete routes.requirementsSource;
		if (requirements.length || bagrutOnly.length) {
			// BGU lists each route's requirements separately (an empty list = none on that route)
			routes.requirements = requirements;
			routes.bagrutOnlyRequirements = bagrutOnly;
			routes.requirementsSource = SOURCE;
			count++;
			console.log(`  ${norm(row.path_dsc)}: ${norm((row.psycho_info ?? '—').replace(/<br\s*\/?>/g, ' | '))}  //  בגרות: ${norm((row.bagrut_info ?? '—').replace(/<br\s*\/?>/g, ' | '))}`);
		}
		if (p.admissionRoutes || routes.requirements) p.admissionRoutes = routes;
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Set official requirements for ${count} BGU programs`);
}

if (require.main === module) main();
