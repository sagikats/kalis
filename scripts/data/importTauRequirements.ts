/**
 * Imports TAU admission conditions for programs whose go.tau.ac.il page has no acceptance threshold
 * (so importTauThresholds.ts can't cover them), into src/data/academicData.json.
 *
 *   npx tsx scripts/data/importTauRequirements.ts
 *
 * Source: the "תנאי קבלה" tab of each program page (go.tau.ac.il/he/<path>?v=requirements).
 * Snapshot (URL + verbatim quote per program): src/data/sources/tau-requirements-2026-10-03.json.
 *
 * - Humanities: ציון התאמה 500 or more, OR a general psychometric score of 450 or more, OR a bagrut average of 102 or more,
 *   each one admitting on its own ("אפיקי קבלה").
 * - Arts without auditions: admission by psychometric 450 or more, or by bagrut average alone (no ציון התאמה route).
 * - Bio research-excellence, communication disorders, neuroscience–environment–AI: a ציון התאמה threshold plus a minimum psychometric.
 * Programs with auditions/interviews only, or "אין מידע להציג", are left unverified.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/tau-requirements-2026-10-03.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const UPDATED_AT = '2026-10-03';

interface Row {
	program_id: string;
	url: string;
	kind: 'humanities' | 'english' | 'arts' | 'bio-excel' | 'comm-diss' | 'neuro-env';
	page_title: string;
	quote: string;
}

/** Bagrut-only minimum average for the arts programs, as published on each page. */
const ARTS_BAGRUT_ONLY: Record<string, number> = {
	'prog-tau-0821-10': 102, // תולדות האמנות
	'prog-tau-0861-7': 95, // רב-תחומית באמנויות
	'prog-tau-0851-8': 95, // קולנוע וטלוויזיה
	'prog-tau-0811-4': 90 // אמנות התיאטרון
};

interface Rule {
	threshold: number;
	type: 'general' | 'engineering' | 'psychometric';
	routes: Record<string, number>;
	bagrutOnly: number | null;
	label: string;
}

function ruleFor(row: Row): Rule {
	switch (row.kind) {
		case 'humanities':
			return {
				threshold: 500,
				type: 'general',
				routes: { psychometricOnlyMin: 450, bagrutOnlyMin: 102 },
				bagrutOnly: 102,
				label: 'תנאי קבלה: ציון התאמה 500, או פסיכומטרי 450, או ממוצע בגרות 102'
			};
		case 'english':
			// The psychometric-only and bagrut-only routes also need English 134+ and 5u English bagrut 85+, which we
			// can't check, so only the ציון התאמה threshold is recorded.
			return {
				threshold: 500,
				type: 'general',
				routes: {},
				bagrutOnly: null,
				label: 'תנאי קבלה: ציון התאמה 500 וגם אנגלית 134 בפסיכומטרי/אמי"ר וגם 85 בבגרות אנגלית 5 יח"ל'
			};
		case 'arts': {
			const bagrut = ARTS_BAGRUT_ONLY[row.program_id];
			return {
				threshold: 450,
				type: 'psychometric',
				routes: { bagrutOnlyMin: bagrut },
				bagrutOnly: bagrut,
				label: `תנאי קבלה: פסיכומטרי 450, או ממוצע בגרות ${bagrut}`
			};
		}
		case 'bio-excel':
			return {
				threshold: 670,
				type: 'general',
				routes: { minPsychometric: 700 },
				bagrutOnly: null,
				label: 'תנאי קבלה: ציון התאמה 670 וגם פסיכומטרי 700 וממוצע בגרות 105, וראיון'
			};
		case 'comm-diss':
			return {
				threshold: 653,
				type: 'general',
				routes: { minPsychometric: 620 },
				bagrutOnly: null,
				label: 'סף קבלה תשפ"ז 653; פסיכומטרי 620 לפחות, אנגלית 120, וראיון'
			};
		case 'neuro-env':
			return {
				threshold: 680,
				type: 'engineering', // "ציון התאמה מדעים מדויקים"
				routes: {},
				bagrutOnly: null,
				label: 'סף קבלה תשפ"ו (ציון התאמה מדעים מדויקים)'
			};
	}
}

function main() {
	const rows: Row[] = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const tau = data.find((i: any) => i.id === 'inst-6');
	const byId = new Map(tau.programs.map((p: any) => [p.id, p]));
	const report: string[] = [];

	for (const row of rows) {
		const p: any = byId.get(row.program_id);
		if (!p) throw new Error(`Unknown program ${row.program_id}`);
		const rule = ruleFor(row);
		const old = p.admissionThreshold;
		p.officialThreshold = rule.threshold;
		p.admissionThreshold = rule.threshold;
		p.relevantSekemType = rule.type;
		p.admissionRoutes = rule.routes;
		if (rule.routes.minPsychometric) p.minPsychometricFloor = rule.routes.minPsychometric;
		p.directBagrutEligible = rule.bagrutOnly !== null;
		p.directBagrutMinAverage = rule.bagrutOnly;
		p.thresholdSource = `${row.url} — ${rule.label}`;
		p.thresholdUpdatedAt = UPDATED_AT;
		// Legacy catalog fields (shown on /optimizer) carried the old 560 estimate; keep them consistent.
		p.sekemScore = rule.type === 'psychometric' ? null : rule.threshold;
		p.psychometricScore = rule.routes.psychometricOnlyMin ?? rule.routes.minPsychometric ?? (rule.type === 'psychometric' ? rule.threshold : null);
		p.comments = rule.label;
		report.push(`${p.fieldOfStudy}: ${old} -> ${rule.threshold} (${rule.type}${Object.keys(rule.routes).length ? ' ' + JSON.stringify(rule.routes) : ''})`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Updated ${report.length} TAU programs`);
	for (const l of report) console.log('  ' + l);
}

main();
