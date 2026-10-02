/**
 * Imports HUJI's official admission thresholds into src/data/academicData.json.
 *
 *   npx tsx scripts/data/importHujiThresholds.ts
 *
 * Source: the official threshold spreadsheet linked from
 * https://info.huji.ac.il/reception-channels/Kabala_Meshklal
 * (snapshot committed at src/data/sources/huji-thresholds-2026-10-02.csv).
 *
 * For each of our HUJI programs we pick one official track (single-major first), store the official
 * threshold, convert it to the platform's 200–800 comparison scale with the same exact linear map the
 * calculator uses, and set relevantSekemType from the track's weighting / psychometric rules.
 */

import fs from 'fs';
import path from 'path';
import { hujiScoreTo800 } from '../../src/modules/calculators/huji';

const ROOT = path.resolve(__dirname, '../..');
const CSV = path.join(ROOT, 'src/data/sources/huji-thresholds-2026-10-02.csv');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1MguS816Ikta9wgpSi4Vv60oAGK2L4Lz5ZbbWycvnlVg';
const UPDATED_AT = '2026-10-02';

/** Hand-reviewed mapping for programs whose name differs from the official track name. */
const MANUAL: Record<string, string> = {
	'prog-inst-1-2': '715-9512', // אגרואקולוגיה, בריאות הצמח וביוטכנולוגיה
	'prog-inst-1-3': '255-1500', // אמירים (מדעי החברה/רוח) -> תוכנית אמירים מדעי הרוח
	'prog-inst-1-5': '150-1915', // ארכיאולוגיה
	'prog-inst-1-6': '150-1915', // ארכיאולוגיה והמזרח הקרוב והקדום
	'prog-inst-1-8': '722-9513', // ביוכימיה, מדעי המזון וביוטכנולוגיה
	'prog-inst-1-10': '821-7877', // גאוגרפיה, סביבה וגאואינפורמטיקה
	'prog-inst-1-12': '105-1320', // היסטוריה של עם ישראל ויהדות זמננו
	'prog-inst-1-14': '583-5860', // הנדסת חשמל ומחשבים -> הנדסת חשמל ומדעי המחשב
	'prog-huji-3': '583-5860', // הנדסת מחשבים וחשמל
	'prog-inst-1-86': '325-3252', // חשבונאות וכלכלה
	'prog-inst-1-18': '312-7300', // יחסים בינלאומיים
	'prog-inst-1-82': '322-3253', // כלכלה ומנהל עסקים
	'prog-inst-1-78': '401-4951', // כלכלה ומשפטים -> משפטים עם כלכלה
	'prog-inst-1-87': '401-4951', // משפטים וכלכלה
	'prog-inst-1-79': '321-7500', // כלכלה ותוכנית רב-תחומית -> כלכלה (the higher threshold of the pair)
	'prog-inst-1-81': '321-7500', // כלכלה ויחסים בינלאומיים -> כלכלה (higher of the pair)
	'prog-inst-1-88': '321-7500', // כלכלה, לימודי עסקים, תולדות האמנות -> כלכלה
	'prog-inst-1-22': '717-9515', // כלכלת סביבה וניהול וביוטכנולוגיה
	'prog-inst-1-21': '717-1723', // כלכלת סביבה וניהול עם חטיבה בחקלאות
	'prog-inst-1-26': '155-1711', // לימודים ספרדיים ולטינו אמריקניים
	'prog-inst-1-29': '156-1708', // לימודים רוסיים וסלאוויים
	'prog-inst-1-83': '824-7410', // מדע המדינה וסטטיסטיקה -> סטטיסטיקה (higher of the pair)
	'prog-inst-1-80': '710-1010', // מדעי החקלאות -> מדעי הצמח בחקלאות
	'prog-inst-1-36': '311-7200', // מדעי המדינה
	'prog-inst-1-44': '602-8602', // מדעי הרפואה -> מדעים ביורפואיים
	'prog-inst-1-49': '525-3032', // מט"ר
	'prog-huji-8': '322-3221', // מינהל עסקים
	'prog-inst-1-75': '301-7100', // סוציולוגיה ואנתרופולוגיה ומדע המדינה (both 17.5)
	'prog-inst-1-85': '301-7100',
	'prog-inst-1-57': '606-5606', // סיעוד -> אחיות, בי"ח הדסה
	'prog-inst-1-62': '569-2082', // פיזיקה כימיה -> תכנית משולבת
	'prog-inst-1-64': '326-7800', // פכ"מ
	'prog-inst-1-77': '326-7800',
	'prog-inst-1-65': '318-4024', // פסיכולוגיה ומדעי החיים
	'prog-huji-5': '601-4601', // רפואה
	'prog-huji-6': '611-5611', // רפואת שיניים
	'prog-inst-1-72': '222-1524', // תכנית רב-תחומית מדעי הרוח
	'prog-inst-1-73': '102-1430', // תלמוד והלכה
	'prog-inst-1-96': '521-8014', // מדעי המחשב ומתמטיקה
	'prog-inst-1-97': '521-3017', // מדעי המחשב וסטטיסטיקה
	'prog-inst-1-98': '521-8015', // מדעי המחשב ופיסיקה
	'prog-inst-1-99': '824-7410' // מדע הנתונים -> סטטיסטיקה ומדע הנתונים
};

interface Track {
	code: string;
	name: string;
	threshold: number;
	w5050: boolean;
	w3070: boolean;
	verbal: boolean;
	general: boolean;
	quant: boolean;
}

function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [], cell = '', quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
			else if (c === '"') quoted = false;
			else cell += c;
		} else if (c === '"') quoted = true;
		else if (c === ',') { row.push(cell); cell = ''; }
		else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
		else if (c !== '\r') cell += c;
	}
	if (cell || row.length) { row.push(cell); rows.push(row); }
	return rows;
}

const norm = (s: string) => s.replace(/[\s\-–,"״׳'()]/g, '').replace(/פיזיקה/g, 'פיסיקה');

function sekemTypeFor(t: Track): 'general' | 'management' | 'engineering' | 'quantitative' {
	if (t.w5050 && !t.w3070) return 'engineering'; // 50/50, quant-emphasis
	if (!t.w5050 && t.w3070) return 'quantitative'; // 30/70, general (medicine/dentistry)
	if (!t.verbal) return 'management'; // both weightings, general/quant
	return 'general'; // both weightings, any psychometric score
}

function main() {
	const rel = (v: string) => v.trim() === 'רלוונטי';
	const tracks: Track[] = parseCsv(fs.readFileSync(CSV, 'utf-8'))
		.slice(2)
		.filter((r) => r.length > 9 && r[2].trim() && !isNaN(parseFloat(r[4])))
		.map((r) => ({
			code: r[2].trim(), name: r[3].trim(), threshold: parseFloat(r[4]),
			w5050: rel(r[5]), w3070: rel(r[6]), verbal: rel(r[7]), general: rel(r[8]), quant: rel(r[9])
		}));
	const byCode = new Map(tracks.map((t) => [t.code, t]));

	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const huji = data.find((i: any) => i.id === 'inst-1');
	const report: string[] = [];
	const unmatched: string[] = [];

	for (const p of huji.programs) {
		let track: Track | undefined = MANUAL[p.id] ? byCode.get(MANUAL[p.id]) : undefined;
		if (!track) {
			const candidates = tracks.filter((t) => norm(t.name.split(',')[0]) === norm(p.fieldOfStudy));
			track =
				candidates.find((t) => /^[^,]+, חד-חוגי$/.test(t.name)) ??
				candidates.find((t) => /^[^,]+, דו-חוגי$/.test(t.name)) ??
				candidates.find((t) => !t.name.includes('בשילוב') && !t.name.includes('אתגר')) ??
				candidates[0];
		}
		if (!track) {
			unmatched.push(`${p.id} ${p.fieldOfStudy} (kept ${p.admissionThreshold}, unverified)`);
			continue;
		}
		const old = p.admissionThreshold;
		p.officialThreshold = track.threshold;
		p.admissionThreshold = hujiScoreTo800(track.threshold);
		p.relevantSekemType = sekemTypeFor(track);
		p.thresholdSource = `${SHEET_URL} — ${track.code} ${track.name}`;
		p.thresholdUpdatedAt = UPDATED_AT;
		report.push(`${p.fieldOfStudy}: ${old} -> ${p.admissionThreshold} (official ${track.threshold}, ${p.relevantSekemType})`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Updated ${report.length} HUJI programs`);
	for (const l of report) console.log('  ' + l);
	console.log(`\nUnmatched (${unmatched.length}) — no equivalent official track:`);
	for (const l of unmatched) console.log('  ' + l);
}

main();
