/**
 * Thin clients for the universities' PUBLIC official calculators (no auth, no CAPTCHA).
 * Used only by the verification script — low volume, one request at a time.
 */

const UA = { 'User-Agent': 'Mozilla/5.0 (mitkablim verification)' };
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Subj {
	name: string;
	units: number;
	grade: number;
}

const decodeHtml = (s: string) =>
	s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const htmlToText = (s: string) =>
	decodeHtml(s.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '|')).replace(/\s+/g, ' ');

// ---------------------------------------------------------------- BGU (ORDS REST API behind apps4cloud.bgu.ac.il/calcprod)
const BGU = 'https://bgucr4u.bgu.ac.il/ords/sc/calculators';
const BGU_CODES: Record<string, number> = {
	'מתמטיקה': 17, 'אנגלית': 11, 'היסטוריה': 27, 'אזרחות': 46, 'הבעה עברית': 84, 'תנ"ך': 15, 'ספרות': 14,
	'פיזיקה': 18, 'כימיה': 19, 'ביולוגיה': 21, 'מדעי המחשב': 188, 'גיאוגרפיה': 25, 'מדעי החברה': 28,
	'אלקטרוניקה': 126
};
export function bguSupports(subs: Subj[]) {
	return subs.every((s) => BGU_CODES[s.name] !== undefined);
}
export async function bguAverage(subs: Subj[]): Promise<number> {
	const enc = subs.map((s) => `${BGU_CODES[s.name]},${s.units},${s.grade}`).join('@');
	const r = await fetch(`${BGU}/GetBagrutAaverage/${enc}`, { headers: UA });
	return (await r.json()).items[0].bagrut_avg;
}
export async function bguGeneralSekem(avg: number, psych: number): Promise<number> {
	const r = await fetch(`${BGU}/GetSekem?p_bagrut_average=${avg}&p_psychometry=${psych}`, { headers: UA });
	return (await r.json()).p_final_sekem;
}
export async function bguQuantSekem(avg: number, q: number, v: number, e: number): Promise<number> {
	const r = await fetch(
		`${BGU}/GetSekemQuantity/?p_psycho_quantity=${q}&p_psycho_verbal=${v}&p_psycho_english=${e}&p_bagrut_average=${avg}`,
		{ headers: UA }
	);
	const j = await r.json();
	return j.p_sekem_quantity ?? j.p_final_sekem ?? j;
}

// ---------------------------------------------------------------- TAU
const TAU_CODES: Record<string, string> = {
	'אזרחות': '063', 'אנגלית': '010', 'מתמטיקה': '014', 'היסטוריה': '020', 'הבעה עברית': '005', 'ספרות': '004',
	'תנ"ך': '001', 'ביולוגיה': '017', 'גיאוגרפיה': '041', 'כימיה': '016', 'מדעי החברה': '022', 'מדעי המחשב': '042',
	'פיזיקה': '015', 'אלקטרוניקה': '050', 'מחשבת ישראל': '021'
};
export function tauSupports(subs: Subj[]) {
	return subs.every((s) => TAU_CODES[s.name] !== undefined);
}
export async function tauAverage(subs: Subj[]): Promise<{ average: number; dropped: string[] }> {
	const body = new URLSearchParams();
	for (const s of subs) {
		body.set(`yl${TAU_CODES[s.name]}`, String(s.units));
		body.set(`tziun${TAU_CODES[s.name]}`, String(s.grade));
	}
	body.set('btncalc', 'חישוב');
	const r = await fetch('https://ims.tau.ac.il/md/calc/Bagrut_T.aspx', {
		method: 'POST',
		headers: { ...UA, 'content-type': 'application/x-www-form-urlencoded', referer: 'https://ims.tau.ac.il/md/calc/Bagrut.aspx' },
		body
	});
	const t = htmlToText(await r.text());
	const m = t.match(/סה"כ י\. לימוד\s*>>[|\s]*(\d+)[|\s]*([\d.]+)/);
	if (!m) throw new Error('TAU average not found');
	return { average: parseFloat(m[2]), dropped: [] };
}
export async function tauScores(avg: number, psych: number, reali10: boolean) {
	const r = await fetch('https://go.tau.ac.il/graphql', {
		method: 'POST',
		headers: { ...UA, 'content-type': 'application/json' },
		body: JSON.stringify({
			query: 'query getLastScore ($scoresData: JSON!) { getLastScore (scoresData: $scoresData) { body } }',
			variables: { scoresData: { prog: 'calctziun', out: 'json', reali10: reali10 ? 1 : 0, psicho: psych, bagrut: avg } }
		})
	});
	const b = (await r.json()).data.getLastScore.body;
	return { general: +b.hatama, engineering: +b.hatama_handasa, management: +b.hatama_nihul, exact: +b.hatama_meduyakim };
}

// ---------------------------------------------------------------- Reichman (ASP.NET WebForms)
const RUNI = 'https://www.runi.ac.il/bagrutexamscalculator/default.aspx';
const RUNI_MAND: Record<string, string> = {
	'תנ"ך': '01', 'ספרות': '02', 'הבעה עברית': '03', 'אנגלית': '04', 'היסטוריה': '06', 'אזרחות': '07', 'מתמטיקה': '08'
};
const RUNI_CHOICE: Record<string, string> = {
	'פיזיקה': '04', 'כימיה': '05', 'מחשבת ישראל': '06', 'ביולוגיה': '07', 'מדעי החברה': '09', 'גיאוגרפיה': '13',
	'אלקטרוניקה': '20', 'מדעי המחשב': '23'
};
export function runiSupports(subs: Subj[]) {
	return subs.every((s) => RUNI_MAND[s.name] || RUNI_CHOICE[s.name]);
}
export async function runiCalc(subs: Subj[], psych: number): Promise<string> {
	const first = await fetch(RUNI, { headers: UA });
	const cookie = (first.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
	const page = await first.text();
	const hidden = (n: string) => decodeHtml(page.match(new RegExp(`name="${n}" id="[^"]*" value="([^"]*)"`))?.[1] ?? '');
	const body = new URLSearchParams({
		__EVENTTARGET: '', __EVENTARGUMENT: '',
		__VIEWSTATE: hidden('__VIEWSTATE'), __VIEWSTATEGENERATOR: hidden('__VIEWSTATEGENERATOR'),
		__EVENTVALIDATION: hidden('__EVENTVALIDATION'),
		'Calculator$bagrutType': 'רגילה', 'Calculator$hdnIsExternal': 'false',
		'Calculator$txt_psycho_grade': psych ? String(psych) : '',
		'Calculator$btnCompute': 'חשב'
	});
	for (const s of subs) {
		const k = RUNI_MAND[s.name]
			? `rpMandatoryCourses$ctl${RUNI_MAND[s.name]}$txt_mandatory`
			: `rpChoiceCourses$ctl${RUNI_CHOICE[s.name]}$txt_choice`;
		body.set(`Calculator$${k}_units`, String(s.units));
		body.set(`Calculator$${k}_grade`, String(s.grade));
	}
	const r = await fetch(RUNI, {
		method: 'POST',
		headers: { ...UA, cookie, 'content-type': 'application/x-www-form-urlencoded', referer: RUNI },
		body
	});
	return htmlToText(await r.text());
}
