/**
 * Imports TAU's official admission thresholds into src/data/academicData.json.
 *
 *   npx tsx scripts/data/importTauThresholds.ts
 *
 * Source: each program page on go.tau.ac.il publishes its acceptance / rejection threshold
 * ("סף הקבלה" / "סף דחייה") on TAU's own 200–800 ציון התאמה scale — the same scale our TAU calculator
 * outputs, so no conversion is needed. Snapshot: src/data/sources/tau-thresholds-2026-10-02.json.
 * This year's threshold is used when published, otherwise last year's.
 *
 * The score each program is compared against follows TAU's own site logic (by faculty):
 * exact sciences + engineering → hatama_meduyakim / hatama_handasa (general formula + 10 for 5u math & physics),
 * management → hatama_nihul, everything else → the general ציון התאמה.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/tau-thresholds-2026-10-02.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const UPDATED_AT = '2026-10-02';

/** Hand-reviewed mapping: our program id -> go.tau.ac.il page path (after /he/). */
const MAP: Record<string, string> = {
	'prog-tau-1541-98': 'neuroscience/ba/psychology-biology-ai',
	'prog-tau-0910-103': 'life/ba/bio-environment',
	'prog-tau-0162-13': 'med/ba/nursing',
	'prog-tau-1541-105': 'neuroscience/ba/linguistics-biology-ai',
	'prog-tau-0608-80': 'humanities/ba/gender',
	'prog-tau-0555-65': 'engineering/ba/biomedical',
	'prog-tau-0542-64': 'engineering/ba/mechanical',
	'prog-tau-0542-77': 'engineering/ba/bio-mechanical',
	'prog-tau-0512-74': 'engineering/ba/electrical',
	'prog-tau-0512-79': 'engineering/ba/electrical-physics',
	'prog-tau-0512-70': 'exact/ba/electrical-engineering-computer-science',
	'prog-tau-0573-66': 'engineering/ba/industrial-engineering',
	'prog-tau-0455-2': 'life/ba/biotechnology',
	'prog-tau-0881-12': 'arts/ba/arch',
	'prog-tau-0455-21': 'life/ba/bio',
	'prog-tau-0455-72': 'life/ba/ecology',
	'prog-tau-1514-59': 'neuroscience/ba/bio-psycho',
	'prog-tau-1211-76': 'management/ba/accounting',
	'prog-tau-1211-75': 'management/ba/accounting-law',
	'prog-tau-0341-30': 'exact/ba/excel-earth',
	'prog-tau-0351-84': 'exact/ba/chem',
	'prog-tau-1011-82': 'social-sciences/ba/economics',
	'prog-tau-1411-81': 'law/ba/law',
	'prog-tau-0366-23': 'exact/ba/math',
	'prog-tau-1221-51': 'management/ba/management',
	'prog-tau-1041-52': 'social-sciences/ba/sociology-anthropology',
	'prog-tau-0365-26': 'exact/ba/statistics',
	'prog-tau-1051-53': 'social-sciences/ba/labor-studies',
	'prog-tau-0321-78': 'exact/ba/physics',
	'prog-tau-1521-62': 'neuroscience/ba/physics',
	'prog-tau-1071-54': 'social-sciences/ba/psychology',
	'prog-tau-1513-60': 'neuroscience/ba/psycho-computers',
	'prog-tau-0165-15': 'med/ba/occu',
	'prog-tau-1085-56': 'social-sciences/ba/communications',
	'prog-tau-1031-55': 'social-sciences/ba/political-science',
	'prog-tau-0581-68': 'engineering/ba/materials',
	'prog-tau-0368-22': 'exact/ba/computer',
	'prog-tau-0359-89': 'exact/ba/datascience',
	'prog-tau-0341-31': 'exact/ba/geophysics',
	'prog-tau-0341-99': 'exact/ba/excel-earth-AI',
	'prog-tau-0560-63': 'engineering/ba/high-tech-plus',
	'prog-tau-0366-25': 'exact/ba/machinelearning',
	'prog-tau-1110-71': 'social-sciences/ba/social-work',
	'prog-tau-0368-3': 'life/ba/bioinformatics',
	'prog-tau-0104-20': 'life/ba/bio-med',
	'prog-tau-0351-24': 'exact/ba/chem-excel',
	'prog-tau-0323-86': 'exact/ba/math-physics',
	'prog-tau-0651-28': 'humanities/ba/pacam',
	'prog-tau-1071-92': 'social-sciences/ba/psychology-biology-ai',
	'prog-tau-1011-95': 'social-sciences/ba/economy-political-science-ai',
	'prog-tau-1564-61': 'neuroscience/ba/linguistics-biology',
	'prog-tau-1011-91': 'social-sciences/ba/psychology-economy-ai',
	'prog-tau-0455-90': 'life/ba/datascience-biology',
	'prog-tau-1031-94': 'social-sciences/ba/economy-data-science-one',
	'prog-tau-1411-93': 'law/ba/datascience-ai',
	'prog-tau-1554-69': 'neuroscience/ba/biomedical-biology',
	'prog-tau-0542-85': 'exact/ba/geophysics-mechanical-engineering',
	'prog-tau-0581-67': 'engineering/ba/materials-chemistry',
	'prog-tau-0368-49': 'humanities/ba/linguistics-computers',
	'prog-tau-1071-96': 'social-sciences/ba/psychology-ai',
	'prog-tau-0662-101': 'humanities/ba/accelerated-program',
	'prog-tau-1011-104': 'enviroment/ba/en-eco-pol',
	'prog-tau-1031-97': 'social-sciences/ba/political-science-ai'
};

interface Row {
	url: string;
	title: string;
	dept: string;
	acc: string;
	rej: string;
	acc_now: string | null;
	rej_now: string | null;
}

/** TAU picks the score by faculty; the department code prefix identifies the faculty. */
function sekemTypeFor(dept: string): 'general' | 'engineering' | 'management' {
	if (dept.startsWith('03') || dept.startsWith('05')) return 'engineering';
	if (dept.startsWith('12')) return 'management';
	return 'general';
}

function main() {
	const rows: Row[] = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const byPath = new Map(rows.map((r) => [r.url.split('/he/')[1], r]));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const tau = data.find((i: any) => i.id === 'inst-6');
	const report: string[] = [];
	const unmatched: string[] = [];

	for (const p of tau.programs) {
		const row = MAP[p.id] ? byPath.get(MAP[p.id]) : undefined;
		if (!row) {
			unmatched.push(`${p.id} ${p.fieldOfStudy} (kept ${p.admissionThreshold}, unverified)`);
			continue;
		}
		const threshold = parseInt(row.acc_now || row.acc, 10);
		const old = p.admissionThreshold;
		p.officialThreshold = threshold;
		p.admissionThreshold = threshold;
		p.relevantSekemType = sekemTypeFor(row.dept);
		p.thresholdSource = `${row.url} — ${row.acc_now ? 'סף קבלה תשפ"ז' : 'סף קבלה שנה קודמת'}`;
		p.thresholdUpdatedAt = UPDATED_AT;
		report.push(`${p.fieldOfStudy}: ${old} -> ${threshold} (${p.relevantSekemType})`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Updated ${report.length} TAU programs`);
	for (const l of report) console.log('  ' + l);
	console.log(`\nUnmatched (${unmatched.length}) — no threshold published on go.tau.ac.il:`);
	for (const l of unmatched) console.log('  ' + l);
}

main();
