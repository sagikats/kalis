/**
 * Cross-checks our calculators against the universities' official calculators.
 *
 *   npx tsx scripts/verification/verifyOfficialCalculators.ts
 *
 * - BGU, TAU, Reichman: live public calculators (see officialClients.ts).
 * - Technion, HUJI, Haifa: their calculators are not reachable for automated use (connection
 *   blocked / reCAPTCHA), so we compare against an independent re-implementation of the
 *   formulas they PUBLISH, written here separately from src/modules/calculators.
 * - Bar-Ilan, Ariel: no accessible official calculator or published formula — reported only.
 *
 * Writes scripts/verification/results.json. Set SKIP=bgu (comma-separated) to skip a live API.
 */

import fs from 'fs';
import path from 'path';
import { calculateInstitution } from '../../src/modules/calculators';
import { calculateHujiWeightedScore } from '../../src/modules/calculators/huji';
import {
	Subj, sleep,
	bguAverage, bguGeneralSekem, bguQuantSekem, bguSupports,
	tauAverage, tauScores, tauSupports,
	runiCalc, runiSupports
} from './officialClients';

interface Profile {
	id: string;
	label: string;
	subjects: Subj[];
	psych: number;
	q: number;
	v: number;
	e: number;
}

const s = (name: string, units: number, grade: number): Subj => ({ name, units, grade });

export const PROFILES: Profile[] = [
	{
		id: 'P1', label: 'מדעי מחשב חזק', psych: 720, q: 145, v: 130, e: 135,
		subjects: [s('מתמטיקה', 5, 95), s('אנגלית', 5, 92), s('פיזיקה', 5, 93), s('מדעי המחשב', 5, 90), s('היסטוריה', 2, 85), s('אזרחות', 2, 88), s('תנ"ך', 2, 80), s('ספרות', 2, 82), s('הבעה עברית', 2, 84)]
	},
	{
		id: 'P2', label: 'מדעי הרוח', psych: 650, q: 115, v: 135, e: 128,
		subjects: [s('מתמטיקה', 3, 85), s('אנגלית', 5, 88), s('ספרות', 5, 92), s('היסטוריה', 5, 90), s('תנ"ך', 2, 86), s('אזרחות', 2, 90), s('הבעה עברית', 2, 88), s('גיאוגרפיה', 5, 87)]
	},
	{
		id: 'P3', label: 'ממוצע בינוני', psych: 600, q: 110, v: 112, e: 115,
		subjects: [s('מתמטיקה', 4, 78), s('אנגלית', 4, 82), s('ביולוגיה', 5, 84), s('היסטוריה', 2, 75), s('אזרחות', 2, 80), s('תנ"ך', 2, 70), s('ספרות', 2, 72), s('הבעה עברית', 2, 76)]
	},
	{
		id: 'P4', label: 'ציונים נמוכים (מתחת ל-60)', psych: 520, q: 95, v: 98, e: 100,
		subjects: [s('מתמטיקה', 5, 58), s('אנגלית', 5, 70), s('כימיה', 5, 65), s('היסטוריה', 2, 60), s('אזרחות', 2, 65), s('תנ"ך', 2, 55), s('ספרות', 2, 60), s('הבעה עברית', 2, 62)]
	},
	{
		id: 'P5', label: 'מצטיין (בדיקת תקרות)', psych: 780, q: 150, v: 145, e: 148,
		subjects: [s('מתמטיקה', 5, 100), s('אנגלית', 5, 100), s('פיזיקה', 5, 98), s('כימיה', 5, 97), s('ביולוגיה', 5, 95), s('היסטוריה', 2, 95), s('אזרחות', 2, 100), s('תנ"ך', 2, 90), s('ספרות', 2, 92), s('הבעה עברית', 2, 95)]
	},
	{
		id: 'P6', label: 'טכנולוגי', psych: 690, q: 140, v: 122, e: 130,
		subjects: [s('מתמטיקה', 5, 88), s('אנגלית', 5, 86), s('מדעי המחשב', 5, 92), s('אלקטרוניקה', 5, 89), s('היסטוריה', 2, 80), s('אזרחות', 2, 82), s('תנ"ך', 2, 75), s('ספרות', 2, 78), s('הבעה עברית', 2, 80)]
	},
	{
		id: 'P7', label: 'מתמטיקה 4 + מדעי החברה', psych: 680, q: 125, v: 132, e: 130,
		subjects: [s('מתמטיקה', 4, 92), s('אנגלית', 5, 90), s('מדעי החברה', 5, 95), s('היסטוריה', 2, 88), s('אזרחות', 2, 90), s('תנ"ך', 2, 84), s('ספרות', 2, 86), s('הבעה עברית', 2, 90)]
	},
	{
		id: 'P8', label: 'מינימום יחידות', psych: 560, q: 102, v: 105, e: 108,
		subjects: [s('מתמטיקה', 3, 70), s('אנגלית', 4, 75), s('היסטוריה', 2, 72), s('אזרחות', 2, 74), s('הבעה עברית', 2, 70), s('תנ"ך', 2, 68), s('ספרות', 2, 71), s('גיאוגרפיה', 4, 80)]
	}
];

// ---------------------------------------------------------------------------------------------
// Independent reference implementations of PUBLISHED formulas (deliberately not reusing src/)
// ---------------------------------------------------------------------------------------------

const MAT = 'מתמטיקה', ENG = 'אנגלית', HIST = 'היסטוריה', CIV = 'אזרחות', HEB = 'הבעה עברית', BIB = 'תנ"ך', LIT = 'ספרות';
const SCI = ['פיזיקה', 'כימיה', 'ביולוגיה'];
const TECH = ['מדעי המחשב', 'אלקטרוניקה'];

function optimal(
	subs: Subj[], mandatory: string[], bonus: (x: Subj) => number,
	weight: (x: Subj) => number = (x) => x.units, cap = Infinity, dec = 2
): number {
	const mand = subs.filter((x) => mandatory.includes(x.name));
	const opt = subs.filter((x) => !mandatory.includes(x.name));
	const avg = (set: Subj[]) => {
		const w = set.reduce((a, x) => a + weight(x), 0);
		return set.reduce((a, x) => a + (x.grade + bonus(x)) * weight(x), 0) / w;
	};
	let best = -1;
	for (let m = 0; m < 1 << opt.length; m++) {
		const set = [...mand, ...opt.filter((_, i) => m & (1 << i))];
		if (set.reduce((a, x) => a + x.units, 0) < 20 && m !== (1 << opt.length) - 1) continue;
		best = Math.max(best, avg(set));
	}
	const f = 10 ** dec;
	return Math.min(cap, Math.round(best * f) / f);
}

// Technion — admissions.technion.ac.il (מקדמי הטבה, כיצד מחשבים, נוסחאות הסכם)
function refTechnion(p: Profile) {
	const five = p.subjects.filter((x) => x.units === 5 && x.grade >= 60);
	const sciCount = five.filter((x) => SCI.includes(x.name)).length;
	const techCount = five.filter((x) => TECH.includes(x.name)).length;
	const cluster = five.some((x) => x.name === MAT) && (sciCount >= 2 || (sciCount >= 1 && techCount >= 1));
	const bonus = (x: Subj) => {
		if (x.grade < 60) return 0;
		if (x.units === 4) return 10;
		if (x.units !== 5) return 0;
		if (x.name === MAT) return 30;
		if (SCI.includes(x.name) || TECH.includes(x.name)) return cluster ? 30 : 25;
		return 20;
	};
	const w = (x: Subj) => (x.name === MAT && x.units >= 4 ? 2 * x.units : x.units);
	const avg = optimal(p.subjects, [MAT, ENG, CIV, HEB, HIST, LIT, BIB], bonus, w, 119, 1);
	const sekem = Math.min(100, Math.round((0.5 * avg + 0.075 * p.psych - 19) * 10) / 10);
	return { avg, sekem };
}

// HUJI — info.huji.ac.il (תעודת בגרות; קבלה על סמך בגרות ופסיכומטרי)
function refHuji(p: Profile) {
	const enh = [ENG, ...SCI, 'מדעי המחשב', HIST, CIV, LIT, BIB, 'ערבית', 'מחשבת ישראל'];
	const bonus = (x: Subj) => {
		if (x.grade < 60) return 0;
		if (x.name === MAT) return x.units === 5 ? 35 : x.units === 4 ? 15 : 0;
		if (x.units === 5) return enh.includes(x.name) ? 25 : 20;
		if (x.units === 4) return enh.includes(x.name) ? 15 : 10;
		return 0;
	};
	const avg = optimal(p.subjects, [MAT, ENG, HIST, CIV, HEB], bonus);
	const B = 3.963 * (avg / 10) - 20.0621;
	const P = 0.032073 * p.psych + 0.3672;
	const score = Math.max(1.2422 * (0.5 * B + 0.5 * P) - 4.7609, 1.2235 * (0.3 * B + 0.7 * P) - 4.4598);
	return { avg, sekem: Math.round(score * 1000) / 1000 };
}

// Haifa — haifa.ac.il (חישוב סכם)
function refHaifa(p: Profile) {
	const core = [ENG, ...SCI, BIB, HIST, LIT, 'ערבית', HEB];
	const bonus = (x: Subj) => {
		if (x.grade < 60) return 0;
		if (x.name === MAT) return x.units === 5 ? 35 : x.units === 4 ? 20 : 0;
		if (x.units === 5) return core.includes(x.name) ? 25 : 20;
		if (x.units === 4) return core.includes(x.name) ? 20 : 10;
		return 0;
	};
	// Haifa mandatory list (as implemented in our calculator; Haifa publishes only minimum-unit requirements)
	const avg = optimal(p.subjects, [MAT, ENG, CIV, HEB, HIST, LIT, BIB], bonus);
	const bt = avg * 10 - 330;
	const pm = 0.514554 * (6 * p.q + 4 * p.v + p.e) - 65.3;
	return { avg, sekem: Math.round((bt + p.psych) / 2), mathSekem: Math.round((bt + 3 * pm) / 4) };
}

// ---------------------------------------------------------------------------------------------

type Row = {
	profile: string;
	institution: string;
	source: 'live' | 'published-formula' | 'unverified';
	metric: string;
	ours: number | null;
	official: number | null;
};

const close = (a: number | null, b: number | null, tol: number) =>
	a !== null && b !== null && Math.abs(a - b) <= tol;

// SKIP=bgu,tau,reichman skips live calls to those institutions (e.g. when an API is rate-limiting)
const SKIP = new Set((process.env.SKIP ?? '').split(',').filter(Boolean));

async function main() {
	const rows: Row[] = [];
	const push = (r: Row) => rows.push(r);

	for (const p of PROFILES) {
		const input = {
			bagrutSubjects: p.subjects,
			psychometricGeneral: p.psych,
			psychometricQuant: p.q,
			psychometricVerbal: p.v,
			psychometricEnglish: p.e,
			mathUnits: p.subjects.find((x) => x.name === MAT)?.units,
			mathGrade: p.subjects.find((x) => x.name === MAT)?.grade,
			physicsUnits: p.subjects.find((x) => x.name === 'פיזיקה')?.units ?? 0,
			physicsGrade: p.subjects.find((x) => x.name === 'פיזיקה')?.grade ?? 0
		};
		const ours = (id: string) => calculateInstitution(id, input);
		console.log(`\n=== ${p.id} ${p.label}`);

		// BGU — live
		if (!SKIP.has('bgu') && bguSupports(p.subjects)) {
			const o = ours('bgu');
			const avg = await bguAverage(p.subjects); await sleep(800);
			const gen = await bguGeneralSekem(avg, p.psych); await sleep(800);
			const qnt = await bguQuantSekem(avg, p.q, p.v, p.e); await sleep(800);
			push({ profile: p.id, institution: 'bgu', source: 'live', metric: 'ממוצע', ours: o.bagrutAverage, official: avg });
			push({ profile: p.id, institution: 'bgu', source: 'live', metric: 'סכם כללי', ours: o.generalSekem, official: gen });
			push({ profile: p.id, institution: 'bgu', source: 'live', metric: 'סכם כמותי', ours: o.quantitativeSekem ?? null, official: typeof qnt === 'number' ? qnt : null });
		}

		// TAU — live
		if (!SKIP.has('tau') && tauSupports(p.subjects)) {
			const o = ours('tau');
			const { average } = await tauAverage(p.subjects); await sleep(800);
			const math5 = p.subjects.some((x) => x.name === MAT && x.units === 5 && x.grade >= 55);
			const phys5 = p.subjects.some((x) => x.name === 'פיזיקה' && x.units === 5 && x.grade >= 55);
			const sc = await tauScores(average, p.psych, math5 && phys5); await sleep(800);
			push({ profile: p.id, institution: 'tau', source: 'live', metric: 'ממוצע', ours: o.bagrutAverage, official: average });
			push({ profile: p.id, institution: 'tau', source: 'live', metric: 'ציון התאמה', ours: o.generalSekem, official: sc.general });
			push({ profile: p.id, institution: 'tau', source: 'live', metric: 'ציון התאמה הנדסה', ours: o.engineeringSekem ?? null, official: sc.engineering });
			push({ profile: p.id, institution: 'tau', source: 'live', metric: 'ציון התאמה ניהול', ours: o.managementSekem ?? null, official: sc.management });
		}

		// Reichman — live
		if (!SKIP.has('reichman') && runiSupports(p.subjects)) {
			const o = ours('reichman');
			const t = await runiCalc(p.subjects, p.psych); await sleep(1200);
			const avg = parseFloat(t.match(/ממוצע משוקלל:[| ]*([\d.]+)/)?.[1] ?? 'NaN');
			const adj = parseFloat(t.match(/ציון מתואם[^0-9]*([\d.]+)/)?.[1] ?? 'NaN');
			push({ profile: p.id, institution: 'reichman', source: 'live', metric: 'ממוצע', ours: o.bagrutAverage, official: isNaN(avg) ? null : avg });
			push({ profile: p.id, institution: 'reichman', source: 'live', metric: 'ציון מתואם', ours: o.officialScore ?? null, official: isNaN(adj) ? null : adj });
		}

		// Technion / HUJI / Haifa — published formulas
		const t = refTechnion(p), ot = ours('technion');
		push({ profile: p.id, institution: 'technion', source: 'published-formula', metric: 'ממוצע', ours: ot.bagrutAverage, official: t.avg });
		push({ profile: p.id, institution: 'technion', source: 'published-formula', metric: 'סכם', ours: ot.generalSekem, official: t.sekem });

		const h = refHuji(p), oh = ours('huji');
		push({ profile: p.id, institution: 'huji', source: 'published-formula', metric: 'ממוצע', ours: oh.bagrutAverage, official: h.avg });
		push({ profile: p.id, institution: 'huji', source: 'published-formula', metric: 'ציון משוקלל', ours: calculateHujiWeightedScore(oh.bagrutAverage, p.psych), official: h.sekem });

		const hf = refHaifa(p), ohf = ours('haifa');
		push({ profile: p.id, institution: 'haifa', source: 'published-formula', metric: 'ממוצע', ours: ohf.bagrutAverage, official: hf.avg });
		push({ profile: p.id, institution: 'haifa', source: 'published-formula', metric: 'סכם 1:1', ours: ohf.generalSekem, official: hf.sekem });
		push({ profile: p.id, institution: 'haifa', source: 'published-formula', metric: 'סכם מתמטי 1:3', ours: ohf.engineeringSekem ?? null, official: hf.mathSekem });

		// Bar-Ilan / Ariel — no official source (Bar-Ilan blocks automated access; Ariel publishes no formula)
		for (const id of ['bar_ilan', 'ariel']) {
			const o = ours(id);
			push({ profile: p.id, institution: id, source: 'unverified', metric: 'סכם', ours: o.generalSekem, official: null });
		}
	}

	const tol = (r: Row) =>
		r.metric === 'ממוצע' ? 0.011
		: r.metric === 'ציון משוקלל' ? 0.0011
		: r.metric === 'ציון מתואם' ? 0.05
		: r.institution === 'technion' ? 0.11
		: 0;
	const out = rows.map((r) => ({ ...r, match: r.official === null ? null : close(r.ours, r.official, tol(r)) }));
	fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(out, null, 2));

	const byInst = new Map<string, { ok: number; bad: number }>();
	for (const r of out) {
		if (r.match === null) continue;
		const b = byInst.get(r.institution) ?? { ok: 0, bad: 0 };
		r.match ? b.ok++ : b.bad++;
		byInst.set(r.institution, b);
	}
	console.log('\nSUMMARY');
	for (const [k, v] of byInst) console.log(k.padEnd(10), `${v.ok} ✓  ${v.bad} ✗`);
	console.log('\nMISMATCHES');
	for (const r of out.filter((r) => r.match === false)) {
		console.log(`${r.profile} ${r.institution.padEnd(9)} ${r.metric.padEnd(16)} ours=${r.ours}  official=${r.official}`);
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
