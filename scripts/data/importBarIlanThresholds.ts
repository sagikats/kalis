/**
 * Imports Bar-Ilan's official admission data into src/data/academicData.json.
 *
 *   npx tsx scripts/data/importBarIlanThresholds.ts
 *
 * Source: Bar-Ilan's official admission calculator (shoham.biu.ac.il/kabala/Results.aspx), run 2026-10-05 by the user in
 * their browser (the site blocks non-browser clients). For every track the calculator shows "שקלול לקבלה" (the
 * acceptance score), "שקלול לדחיה" and the minimum requirements text. Snapshot:
 * src/data/sources/biu-calculator-2026-10-05.json.
 *
 * Bar-Ilan scores on a 0–100 scale with four scoring groups (identified by the score profile A got on each track):
 * general, sciences (quantitative), engineering and software engineering — see src/modules/calculators/barIlan.ts.
 *
 * Requirements are parsed from the official text: minimum psychometric, quantitative section, "מכפלה מתמטית"
 * (math grade × units), math / physics / English bagrut minimums and the English section. Where a summer preparation
 * course can replace a bagrut requirement, it is the exam alternative. Tracks with "אפשרות א' / ב'" are hand-coded.
 * The bagrut-only channel ("ערוץ קבלה לפי בגרות ללא פסיכומטרי") becomes bagrutOnlyMin + bagrutOnlyRequirements; the
 * psychometric-only channel becomes psychometricOnlyMin. Interviews, entrance exams and the rest stay in comments.
 * Official tracks missing from the catalog (incl. double majors) are added as prog-biu-<row>, except tracks open only to
 * a specific population and spring-start duplicates.
 * Catalog programs that aren't a track in the calculator are marked notOffered (their old thresholds were on a 200–800
 * scale that can't be compared with Bar-Ilan's score).
 */

import fs from 'fs';
import path from 'path';
import type { ProgramRequirement, RequirementOption } from '../../src/types/academic';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/biu-calculator-2026-10-05.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const SOURCE = 'https://shoham.biu.ac.il/kabala/Results.aspx';
const UPDATED_AT = '2026-10-05';

interface Row {
	ctl: string;
	registration?: string;
	program: string;
	scope: string;
	department: string;
	candidate: string;
	accept: string;
	reject: string;
	remarks: string;
}

/** Scoring group by the score profile A received (see the snapshot's baseProfile). */
const GROUP: Record<string, 'general' | 'quantitative' | 'engineering' | 'management'> = {
	'89.61': 'general',
	'86.9': 'quantitative',
	'82.8': 'engineering',
	'84.45': 'management' // software engineering & industrial engineering
};

/** Catalog program id -> calculator row (ctlNN). Single-major ("חד חוגי") where the catalog doesn't say otherwise. */
const MAP: Record<string, string> = {
	'prog-inst-4-1': 'ctl02', 'prog-inst-4-2': 'ctl05', 'prog-inst-4-3': 'ctl12', 'prog-inst-4-4': 'ctl09', 'prog-inst-4-5': 'ctl12',
	'prog-inst-4-7': 'ctl21', 'prog-inst-4-11': 'ctl22', 'prog-inst-4-12': 'ctl26', 'prog-inst-4-13': 'ctl27', 'prog-inst-4-14': 'ctl32',
	'prog-inst-4-15': 'ctl40', 'prog-inst-4-16': 'ctl43', 'prog-biu-6': 'ctl44', 'prog-biu-4': 'ctl45', 'prog-inst-4-17': 'ctl46',
	'prog-inst-4-18': 'ctl47', 'prog-inst-4-21': 'ctl54', 'prog-inst-4-22': 'ctl52', 'prog-inst-4-24': 'ctl58', 'prog-inst-4-25': 'ctl59',
	'prog-inst-4-26': 'ctl60', 'prog-inst-4-27': 'ctl64', 'prog-inst-4-28': 'ctl65', 'prog-inst-4-29': 'ctl66', 'prog-inst-4-84': 'ctl65',
	'prog-inst-4-78': 'ctl66', 'prog-inst-4-90': 'ctl65', 'prog-inst-4-31': 'ctl72', 'prog-inst-4-32': 'ctl72', 'prog-inst-4-33': 'ctl75',
	'prog-inst-4-34': 'ctl80', 'prog-inst-4-35': 'ctl76', 'prog-inst-4-36': 'ctl90', 'prog-inst-4-37': 'ctl93', 'prog-inst-4-38': 'ctl99',
	'prog-inst-4-39': 'ctl102', 'prog-inst-4-40': 'ctl87', 'prog-inst-4-41': 'ctl107', 'prog-inst-4-43': 'ctl116', 'prog-inst-4-44': 'ctl161',
	'prog-inst-4-45': 'ctl121', 'prog-inst-4-47': 'ctl125', 'prog-inst-4-48': 'ctl127', 'prog-inst-4-49': 'ctl130', 'prog-inst-4-50': 'ctl135',
	'prog-inst-4-51': 'ctl137', 'prog-inst-4-52': 'ctl136', 'prog-inst-4-53': 'ctl141', 'prog-inst-4-54': 'ctl144', 'prog-inst-4-55': 'ctl145',
	'prog-inst-4-56': 'ctl151', 'prog-inst-4-57': 'ctl155', 'prog-inst-4-58': 'ctl156', 'prog-inst-4-59': 'ctl159', 'prog-inst-4-60': 'ctl168',
	'prog-inst-4-61': 'ctl160', 'prog-inst-4-62': 'ctl163', 'prog-inst-4-64': 'ctl177', 'prog-inst-4-65': 'ctl180', 'prog-inst-4-66': 'ctl181',
	'prog-inst-4-69': 'ctl29', 'prog-inst-4-70': 'ctl18', 'prog-inst-4-71': 'ctl194', 'prog-inst-4-72': 'ctl197', 'prog-inst-4-73': 'ctl200',
	'prog-inst-4-74': 'ctl203', 'prog-inst-4-75': 'ctl204', 'prog-inst-4-76': 'ctl206', 'prog-inst-4-96': 'ctl34', 'prog-inst-4-97': 'ctl145',
	'prog-inst-4-98': 'ctl105', 'prog-inst-4-99': 'ctl110', 'prog-inst-4-100': 'ctl109'
};

const math = (units: number, grade: number): RequirementOption => ({ bagrut: [{ subjects: ['מתמטיקה'], minUnits: units, minGrade: grade }] });
const PREP = (subject: string) => `קורס הכנה בקיץ ב${subject} ברמת 5 יח"ל`;

/** "מכפלה מתמטית" N = math grade × units: the lowest grade per units level that reaches it. */
function mathProduct(n: number, withPrep: boolean): ProgramRequirement {
	const anyOf = [5, 4, 3].filter((u) => Math.ceil(n / u) <= 100).map((u) => math(u, Math.max(55, Math.ceil(n / u))));
	return {
		id: 'math-product',
		title: `מכפלה מתמטית ${n}+ (ציון × יח"ל)`,
		anyOf: withPrep ? [...anyOf, { exam: PREP('מתמטיקה') }] : anyOf
	};
}
const english = (min: number): ProgramRequirement => ({
	id: 'english',
	title: `אנגלית ${min}+`,
	anyOf: [{ psych: [{ section: 'english', min }] }],
	otherOptions: `ציון ${min}+ באמי"ר / אמיר"ם`
});
const quant = (min: number): ProgramRequirement => ({ id: `quant-${min}`, title: `חשיבה כמותית ${min}+`, anyOf: [{ psych: [{ section: 'quant', min }] }] });

/** University-wide English threshold (calculator footnote): 85; English department 120; medical imaging 100. */
function englishFloor(r: Row): number {
	if (r.department.includes('בלשנות וספרות אנגלית')) return 120;
	if (r.program.startsWith('דימות רפואי')) return 100;
	return 85;
}

interface Parsed {
	requirements: ProgramRequirement[];
	minPsych?: number;
}

/** Parses one channel's conditions. */
function parseChannel(text: string, notes: string, r: Row): Parsed {
	const reqs: ProgramRequirement[] = [];
	let minPsych: number | undefined;
	const prepMath = /קורס הכנה בקיץ/.test(notes) && /מתמטיקה/.test(notes);
	const prepPhysics = /(קורס הכנה בקיץ|קורס הכנה בפיזיקה)/.test(notes) && /פיזיקה/.test(notes);

	const psych = text.match(/מינימום (?:ציון )?פסיכומטרי\s*-\s*(\d{3})/);
	if (psych) minPsych = Number(psych[1]);

	const quantMath = text.match(/כמותי בפסיכומטרי\s*[–-]\s*(\d+) ובנוסף מינימום ציון בגרות במתמטיקה 5 יח"ל\s*-\s*(\d+)\s*או מינימום ציון כמותי בפסיכומטרי\s*[–-]\s*(\d+) ובנוסף מינימום ציון בגרות במתמטיקה 5 יח"ל\s*-\s*(\d+)/);
	if (quantMath) {
		const [, q1, g1, q2, g2] = quantMath.map(Number);
		reqs.push({
			id: 'quant-math',
			title: 'חשיבה כמותית ומתמטיקה',
			anyOf: [
				{ psych: [{ section: 'quant', min: q1 }], bagrut: [{ subjects: ['מתמטיקה'], minUnits: 5, minGrade: g1 }] },
				{ psych: [{ section: 'quant', min: q2 }], bagrut: [{ subjects: ['מתמטיקה'], minUnits: 5, minGrade: g2 }] },
				...(prepMath ? [{ psych: [{ section: 'quant' as const, min: Math.min(q1, q2) }], exam: PREP('מתמטיקה') }] : [])
			]
		});
	} else {
		const q = text.match(/מינימום (?:ציון כמותי בפסיכומטרי|בחלק הכמותי בפסיכומטרי)\s*[–-]?\s*(\d{3})/);
		if (q) reqs.push(quant(Number(q[1])));
	}

	const product = text.match(/מכפל(?:ה|ת) מת?מטי(?:ת|קה)[^\d]{0,60}?(\d{3})/);
	if (product) reqs.push(mathProduct(Number(product[1]), prepMath));

	const math5 = !quantMath && text.match(/מינימום ציון בגרות במתמטיקה (\d) יח"ל\s*-\s*(\d+)(?! או)/);
	if (math5) reqs.push({ id: 'math', title: 'מתמטיקה', anyOf: [math(Number(math5[1]), Number(math5[2])), ...(prepMath ? [{ exam: PREP('מתמטיקה') }] : [])] });
	const mathOr = text.match(/מינימום ציון (\d+) בבגרות במתמטיקה ב-\s?(\d) יח"ל או ציון (\d+) ב-\s?(\d) יח"ל(?: או ציון (\d+) בחלק הכמותי)?/);
	if (mathOr) {
		const opts: RequirementOption[] = [math(Number(mathOr[2]), Number(mathOr[1])), math(Number(mathOr[4]), Number(mathOr[3]))];
		if (mathOr[5]) opts.push({ psych: [{ section: 'quant', min: Number(mathOr[5]) }] });
		reqs.push({ id: 'math', title: 'מתמטיקה', anyOf: opts });
	}
	const mathUnits = text.match(/מינימום (\d) יחידות מתמטיקה בבגרות בציון\s*-\s*(\d+)/);
	if (mathUnits) reqs.push({ id: 'math', title: 'מתמטיקה', anyOf: [math(Number(mathUnits[1]), Number(mathUnits[2]))] });
	const mathAlt = text.match(/מינימום ציון בגרות במתמטיקה 4 יח"ל\s*-\s*(\d+) או 5 יח"ל בציון\s*-\s*(\d+) או ציון כמותי בפסיכומטרי\s*-\s*(\d+)/);
	if (mathAlt) reqs.push({ id: 'math', title: 'מתמטיקה', anyOf: [math(4, Number(mathAlt[1])), math(5, Number(mathAlt[2])), { psych: [{ section: 'quant', min: Number(mathAlt[3]) }] }] });

	const physics = text.match(/מינימום ציון בגרות בפי[זס]יקה (\d) יח"ל\s*-\s*(\d+)/);
	if (physics) {
		reqs.push({
			id: 'physics',
			title: 'פיזיקה',
			anyOf: [{ bagrut: [{ subjects: ['פיזיקה'], minUnits: Number(physics[1]), minGrade: Number(physics[2]) }] }, ...(prepPhysics ? [{ exam: PREP('פיזיקה') }] : [])]
		});
	}

	const engBagrut = text.match(/מינימום ציון (\d+) בבגרות באנגלית ב-(\d) יחידות/) || text.match(/מינימום ציון בגרות באנגלית (\d) יח"ל\s*-\s*(\d+)/);
	if (engBagrut) {
		const [grade, units] = engBagrut[0].includes('בבגרות באנגלית ב-') ? [engBagrut[1], engBagrut[2]] : [engBagrut[2], engBagrut[1]];
		reqs.push({ id: 'english-bagrut', title: 'אנגלית בבגרות', anyOf: [{ bagrut: [{ subjects: ['אנגלית'], minUnits: Number(units), minGrade: Number(grade) }] }] });
	}
	const engSection = text.match(/מינימום ציון (\d+) בחלק האנגלית (?:ש)?בפסיכומטרי/);
	reqs.push(english(Math.max(englishFloor(r), engSection ? Number(engSection[1]) : 0)));

	return { requirements: reqs, minPsych };
}

/** Tracks whose sekem channel has "אפשרות א' / ב'" — hand-coded from the official text. */
const SPECIAL: Record<string, Parsed & { note: string }> = {
	// מדעי המחשב: א' — פסיכומטרי 690 + מכפלה 360; ב' — כמותי 130 + מתמטיקה 5 יח"ל 90
	ctl107: {
		requirements: [
			{
				id: 'cs-route',
				title: 'מתמטיקה (אפשרות א\' או ב\')',
				anyOf: [math(5, 72), math(4, 90), { psych: [{ section: 'quant', min: 130 }], bagrut: [{ subjects: ['מתמטיקה'], minUnits: 5, minGrade: 90 }] }],
				otherOptions: "אפשרות א' (מכפלה מתמטית 360) דורשת גם פסיכומטרי 690+"
			},
			english(85)
		],
		note: "אפשרות א': פסיכומטרי 690+ ומכפלה מתמטית 360; אפשרות ב': כמותי 130+ ומתמטיקה 5 יח\"ל 90+"
	},
	// פיזיקה: א' — מכפלה 350; ב' — כמותי 125
	ctl168: {
		requirements: [
			{ id: 'physics-route', title: "מתמטיקה או כמותי (אפשרות א' או ב')", anyOf: [math(5, 70), math(4, 88), { psych: [{ section: 'quant', min: 125 }] }] },
			english(85)
		],
		note: "אפשרות א': מכפלה מתמטית 350; אפשרות ב': כמותי 125+. לחסרי פיזיקה — קורס הכנה בקיץ"
	}
};
SPECIAL.ctl108 = SPECIAL.ctl107;
SPECIAL.ctl165 = SPECIAL.ctl168;

function channels(remarks: string) {
	const notesStart = remarks.search(/הערות כ(?:ל)?ליות:/);
	const notes = notesStart >= 0 ? remarks.slice(notesStart) : '';
	const body = notesStart >= 0 ? remarks.slice(0, notesStart) : remarks;
	const part = (re: RegExp) => {
		const m = body.match(re);
		return m ? m[1] : '';
	};
	return {
		notes,
		sekem: part(/ערוץ קבלה לפי שקלול בגרות ופסיכומטרי:(.*?)(?=ערוץ קבלה|$)/),
		bagrut: part(/ערוץ קבלה לפי בגרות ללא פסיכומטרי:(.*?)(?=ערוץ קבלה|$)/),
		psych: part(/ערוץ קבלה לפי (?:ציון )?פסיכומטרי:(.*?)(?=ערוץ קבלה|$)/),
		quantOnly: part(/ערוץ קבלה לפי ציו?ן? כמותי בפסיכומטרי:(.*?)(?=ערוץ קבלה|$)/)
	};
}

/** Writes one official track's threshold, routes and requirements onto a catalog program. */
function applyRow(p: any, r: Row) {
	const group = GROUP[r.candidate];
	if (!group) throw new Error(`${r.ctl}: unknown scoring group for profile-A score ${r.candidate}`);
	const ch = channels(r.remarks);
	const special = SPECIAL[r.ctl];
	const sekem = special ?? parseChannel(ch.sekem, ch.notes, r);
	const bagrutMin = ch.bagrut.match(/נדרשת עמידה בממוצע (\d+(?:\.\d+)?) בבגרות/);
	const psychOnly = ch.psych.match(/נדרשת עמידה בציון (\d{3}) בפסיכומטרי/);
	const bagrutReqs = bagrutMin ? parseChannel(ch.bagrut, ch.notes, r).requirements : undefined;
	const psychReqs = psychOnly ? parseChannel(ch.psych, ch.notes, r).requirements : undefined;

	const accept = Number(r.accept);
	p.officialThreshold = accept;
	p.admissionThreshold = accept;
	p.relevantSekemType = group;
	p.directBagrutEligible = !!bagrutMin;
	p.directBagrutMinAverage = bagrutMin ? Number(bagrutMin[1]) : null;
	if (sekem.minPsych) p.minPsychometricFloor = sekem.minPsych;
	else delete p.minPsychometricFloor;
	delete p.psychometricScore;
	p.admissionRoutes = {
		...(bagrutMin ? { bagrutOnlyMin: Number(bagrutMin[1]) } : {}),
		...(psychOnly ? { psychometricOnlyMin: Number(psychOnly[1]) } : {}),
		...(sekem.minPsych ? { minPsychometric: sekem.minPsych } : {}),
		requirements: sekem.requirements,
		...(bagrutReqs ? { bagrutOnlyRequirements: bagrutReqs } : {}),
		...(psychReqs ? { psychometricOnlyRequirements: psychReqs } : {}),
		requirementsSource: `${SOURCE} — ${r.program} (${r.scope}), ${UPDATED_AT}`
	};
	const extra = [
		`שקלול לקבלה ${r.accept}, לדחייה ${r.reject} (סולם 0–100)`,
		...(r.registration?.includes('סגור') ? ['ההרשמה למסלול סגורה כרגע (לפי המחשבון)'] : []),
		...(special ? [special.note] : []),
		...(ch.quantOnly ? [`ערוץ לפי כמותי בלבד: ${ch.quantOnly.replace(/\*/g, ' ').trim()}`] : [])
	];
	p.comments = `תנאי קבלה רשמיים (מחשבון בר-אילן): ${extra.join('; ')}. ${r.remarks.replace(/\*/g, ' • ')}`.slice(0, 1200);
	p.thresholdSource = `${SOURCE} — ${r.program} (${r.scope})`;
	p.thresholdUpdatedAt = UPDATED_AT;
}

/** Tracks open only to a specific population, or duplicates of another track (another start semester). */
const EXCLUDED = new Set([
	'ctl13', 'ctl14', 'ctl15', 'ctl16', 'ctl183', 'ctl184', 'ctl185', 'ctl186', 'ctl187', 'ctl188', 'ctl189', // רב-תחומי, closed groups
	'ctl35', // רעמים — academic reserve only
	'ctl117', // מוזיקה — graduates of Rimon only
	'ctl148', // ספרות משווה — Beit Zvi only
	'ctl108' // מדעי המחשב (סמסטר ב') — same track, spring start
]);

function newProgram(r: Row) {
	const name = r.program.replace(/\.$/, '').trim();
	const fieldOfStudy = r.scope === 'חד חוגי' || name.includes('דו חוגי') ? name : `${name} (${r.scope})`;
	const group = GROUP[r.candidate];
	const degreeLevel = name.startsWith('משפטים') ? 'LL.B.' : group === 'general' ? 'B.A' : 'B.Sc';
	return { id: `prog-biu-${r.ctl}`, fieldOfStudy, degreeLevel, description: r.department, requiresPsychometric: true };
}

function main() {
	const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const rows = new Map<string, Row>(snapshot.programs.map((r: Row) => [r.ctl, r]));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const biu = data.find((i: any) => i.id === 'inst-4');
	const report: string[] = [];
	const unmatched: string[] = [];

	for (const p of biu.programs) {
		const r = MAP[p.id] ? rows.get(MAP[p.id]) : undefined;
		const old = p.admissionThreshold;
		if (MAP[p.id] && !r) throw new Error(`${p.id}: row ${MAP[p.id]} not in the snapshot`);
		if (!r) {
			// Not a track in the official calculator: its old 200–800 threshold can't be compared with Bar-Ilan's 0–100 score
			p.notOffered = p.fieldOfStudy.startsWith('רפואה')
				? { note: 'הקבלה לרפואה בבר-אילן בהליך מיון נפרד, לא במחשבון הקבלה לתואר ראשון', source: `${SOURCE} (${UPDATED_AT})` }
				: { note: 'לא מופיע ברשימת המסלולים במחשבון הקבלה הרשמי של בר-אילן', source: `${SOURCE} (${UPDATED_AT})` };
			unmatched.push(`${p.id} ${p.fieldOfStudy} -> notOffered`);
			continue;
		}
		delete p.notOffered;
		applyRow(p, r);
		report.push(`${p.fieldOfStudy}: ${old} -> ${p.admissionThreshold} [${p.relevantSekemType}] reqs: ${p.admissionRoutes.requirements.map((q: ProgramRequirement) => q.id).join(',')}`);
	}

	const used = new Set(Object.values(MAP));
	const added: string[] = [];
	for (const r of rows.values()) {
		if (used.has(r.ctl) || EXCLUDED.has(r.ctl)) continue;
		let p = biu.programs.find((x: any) => x.id === `prog-biu-${r.ctl}`);
		if (!p) {
			p = newProgram(r);
			biu.programs.push(p);
		}
		applyRow(p, r);
		added.push(`${p.fieldOfStudy}: ${p.admissionThreshold} [${p.relevantSekemType}]`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Updated ${report.length} Bar-Ilan programs`);
	for (const l of report) console.log('  ' + l);
	console.log(`\nNot matched (${unmatched.length}):`);
	for (const l of unmatched) console.log('  ' + l);
	console.log(`\nAdded from the official calculator (${added.length}):`);
	for (const l of added) console.log('  ' + l);
}

main();
