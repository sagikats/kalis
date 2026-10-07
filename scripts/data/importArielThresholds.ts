/**
 * Imports Ariel University's official תשפ"ז admission conditions into src/data/academicData.json.
 *
 *   npx tsx scripts/data/importArielThresholds.ts
 *
 * Source: each department's "תנאי הקבלה" page on www.ariel.ac.il (bachelor's), collected 2026-10-05 by the user in
 * their browser (the site blocks non-browser clients). Snapshot: src/data/sources/ariel-admission-pages-2026-10-05.json.
 * The values below are hand-transcribed from those pages.
 *
 * Ariel's combined score ("ציון קבלה משולב") = [(bagrut average × 6.666) + psychometric] / 2. Most departments take
 * the higher of the general and quantitative-weighted psychometric ("הגבוה מבין השניים") — relevantSekemType
 * 'engineering', which the Ariel calculator computes with the higher of the two.
 *
 * Modelled: the regular ("מן המניין") routes — combined score (+ its minimum psychometric / quantitative section),
 * bagrut only, psychometric only, CS "בגרות בשקלול ריאלי", and the bagrut / English requirements. Where a page lets a
 * pre-study completion course ("מכינת השלמה") replace a bagrut requirement, it is the exam alternative.
 * Engineering programs: the separate "סכם הנדסי" (math × units + physics × units + 3 × quant section) / 1.8 with each
 * page's conditions (engineeringScore). Not modelled: CSE's "סכם מחשבים ותוכנה" (no published formula).
 * Not modelled (comments only): conditional / one-semester admission, interviews and screening, the reservists' route
 * (limited to reservists), mechina and technician routes.
 */

import fs from 'fs';
import path from 'path';
import type { EngineeringScoreRoute, ExcellentBagrutRoute, ProgramRequirement, RequirementOption } from '../../src/types/academic';

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT = path.join(ROOT, 'src/data/sources/ariel-admission-pages-2026-10-05.json');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const BASE = 'https://www.ariel.ac.il/wp/';
const UPDATED_AT = '2026-10-05';

const math = (units: number, grade: number): RequirementOption => ({ bagrut: [{ subjects: ['מתמטיקה'], minUnits: units, minGrade: grade }] });
const subj = (subjects: string[], units: number, grade: number): RequirementOption => ({ bagrut: [{ subjects, minUnits: units, minGrade: grade }] });
const PASS = 55;

function mathReq(options: [number, number][], completionGrade?: number): ProgramRequirement {
	return {
		id: 'math',
		title: 'ידע במתמטיקה',
		anyOf: [
			...options.map(([u, g]) => math(u, g)),
			...(completionGrade ? [{ exam: `מכינת השלמה במתמטיקה טרום הלימודים בציון ${completionGrade}+` }] : [])
		]
	};
}
function physicsReq(grade: number, completionGrade = 70): ProgramRequirement {
	return {
		id: 'physics',
		title: 'פיזיקה',
		anyOf: [subj(['פיזיקה'], 5, grade), { exam: `מכינת השלמה בפיזיקה טרום הלימודים בציון ${completionGrade}+` }]
	};
}
function englishLevel(min: 85 | 100 | 120): ProgramRequirement {
	const label = min === 85 ? 'בסיסי' : min === 100 ? "מתקדמים א'" : "מתקדמים ב'";
	return { id: 'english', title: `רמת אנגלית (${label})`, anyOf: [{ psych: [{ section: 'english', min }] }], otherOptions: `ציון ${min}+ באמירנט` };
}
function englishBagrut(options: [number, number][]): ProgramRequirement {
	return { id: 'english-bagrut', title: 'אנגלית בבגרות', anyOf: options.map(([u, g]) => subj(['אנגלית'], u, g)) };
}
const quant = (min: number): ProgramRequirement => ({
	id: `quant-${min}`,
	title: `חשיבה כמותית ${min}+`,
	anyOf: [{ psych: [{ section: 'quant', min }] }]
});

interface Entry {
	page: string;
	combined: number;
	/** 'general' only where the page says the multi-disciplinary score alone counts (or names no weighting). */
	sekem?: 'general' | 'engineering';
	minPsych?: number;
	bagrutOnly?: number;
	psychOnly?: number;
	/** Requirements of every route. */
	reqs: ProgramRequirement[];
	/** Extra requirements of the combined route only (e.g. the quantitative section). */
	combinedReqs?: ProgramRequirement[];
	/** Extra requirements of the psychometric-only route. */
	psychOnlyReqs?: ProgramRequirement[];
	excellent?: ExcellentBagrutRoute;
	/** Use the psychometric score alone as the threshold (no published combined score). */
	psychometricThreshold?: boolean;
	/** "סכם הנדסי" and its conditions. */
	engineering?: EngineeringScoreRoute;
	notes: string[];
}

/** "סכם הנדסי X — מותנה במינימום 550 ציון פסיכומטרי ו-120 תת ציון כמותי. בגרות בהיקף של 4/5 יחידות לפחות במתמטיקה ופיזיקה." */
const engineering550 = (min: number, physicsMinUnits = 4): EngineeringScoreRoute => ({
	min, minPsychometric: 550, minQuantSection: 120, mathMinUnits: 4, physicsMinUnits
});

const ENG85 = englishLevel(85);

const CS_EXCELLENT: ExcellentBagrutRoute = {
	all: [
		{ subjects: ['מתמטיקה'], minUnits: 5, minGrade: 85 },
		{ subjects: ['אנגלית'], minUnits: 5, minGrade: 85 },
		{ subjects: ['מדעי המחשב', 'הנדסת תוכנה', 'מדעי הנתונים', 'פיזיקה'], minUnits: 5, minGrade: 85 }
	],
	summary: 'ציון 85+ ב-5 יח"ל במתמטיקה, באנגלית ובמגמה ריאלית (מדעי המחשב / הנדסת תוכנה / מדעי הנתונים / פיזיקה)'
};
const CS: Entry = {
	page: 'cs/תנאי-הקבלה-במדעי-המחשב/',
	combined: 650,
	minPsych: 600,
	bagrutOnly: 107,
	psychOnly: 680,
	reqs: [mathReq([[4, 85], [5, 75]], 85), englishBagrut([[4, PASS]]), ENG85],
	combinedReqs: [quant(120)],
	psychOnlyReqs: [quant(130)],
	excellent: CS_EXCELLENT,
	notes: ['אין קבלה אוטומטית: המועמדים מדורגים בוועדת הקבלה, על בסיס מקום פנוי', 'קבלה על תנאי לשנה: משולב 630 / בגרות 104 / פסיכומטרי 640']
};
const DS: Entry = { ...CS, page: 'data-science-and-ai/תנאי-הקבלה-במדעי-הנתונים-ובינה-מלאכות/' };
const ECON: Entry = {
	page: 'economics/תנאי-קבלה-בכלכלה-ומנהל-עסקים/',
	combined: 580,
	bagrutOnly: 92,
	psychOnly: 600,
	reqs: [mathReq([[3, 80], [4, PASS]]), englishBagrut([[4, PASS]]), ENG85],
	notes: ['קבלה לסמסטר: בגרות 85+ או משולב 560–580']
};
const HUMANITIES: Entry = {
	page: 'archaeology/תנאי-קבלה-לחוג-להסטוריה-ארץ-ישראל-ארכי/',
	combined: 530,
	bagrutOnly: 85,
	reqs: [englishBagrut([[4, PASS]]), ENG85],
	notes: ['ועדת חריגים: בגרות 80–85 או משולב 500–530']
};
const PREMED: Entry = {
	page: 'bio/תנאי-הקבלה-לקדם-רפואה/',
	combined: 640,
	minPsych: 610,
	reqs: [mathReq([[4, 70], [5, PASS]]), englishBagrut([[4, PASS]]), englishLevel(100)],
	notes: ['הקבלה בשיקול ועדת הקבלה, מספר מקומות מוגבל', 'קורס "מבוא לכימיה" לפני הלימודים']
};
const PHYSIO: Entry = {
	page: 'physiotherapy/תנאי-הקבלה-בפיזיותרפיה/',
	combined: 630,
	sekem: 'general',
	psychometricThreshold: true,
	reqs: [
		{ id: 'math', title: 'מתמטיקה 4 יח"ל', anyOf: [math(4, PASS), { exam: 'קורס השלמה במכינה בציון 70+' }] },
		{ id: 'english-bagrut', title: 'אנגלית בבגרות', anyOf: [subj(['אנגלית'], 4, PASS), { exam: 'קורס השלמה במכינה בציון 70+' }] },
		ENG85
	],
	notes: ['קבלה לפי בגרות 95+ ופסיכומטרי (רב-תחומי בלבד) 630+', 'אין קבלה אוטומטית: דף הצגה עצמית וראיון, מקומות מוגבלים', 'ההרשמה לתשפ"ז נסגרה']
};
const IEM: Entry = {
	page: 'iem/תנאי-קבלה-בהנדסת-תעשייה-וניהול/',
	combined: 620,
	minPsych: 550,
	bagrutOnly: 102,
	reqs: [mathReq([[4, 80], [5, 70]], 70), physicsReq(70), englishBagrut([[4, PASS]]), ENG85],
	engineering: engineering550(600),
	notes: ['8 יח"ל ריאליות', 'מסלול "יסודות" (על תנאי לשנה): משולב 580 / בגרות 97']
};

/** Catalog program id -> official page entry. */
const MAP: Record<string, Entry> = {
	'prog-inst-2-1': HUMANITIES, // ארכיאולוגיה
	'prog-inst-2-4': HUMANITIES, // היסטוריה של עם ישראל בעת החדשה
	'prog-inst-2-15': HUMANITIES, // לימודי ארץ ישראל
	'prog-inst-2-2': {
		page: 'architecture/תנאי-קבלה-בארכיטקטורה/',
		combined: 573,
		sekem: 'general',
		bagrutOnly: 95,
		reqs: [englishBagrut([[4, PASS]]), ENG85],
		notes: ['אין קבלה אוטומטית: מבחני מיון (עבודת בית) וראיון אישי לכל מועמד']
	},
	'prog-inst-2-3': {
		page: 'bio/תנאי-קבלה-בביולוגיה-מולקולרית/',
		combined: 617,
		minPsych: 550,
		reqs: [mathReq([[4, 70]], 70), englishBagrut([[4, 70]]), ENG85],
		notes: ['9 יח"ל ריאליות (4 מתמטיקה + 5 מקצוע ריאלי) בממוצע 75', 'בגרות בלבד 100 — באישור ועדת הקבלה', 'משולב 590–617: דיון לקבלה לסמסטר']
	},
	'prog-inst-2-5': {
		page: 'ce/תנאי-הקבלה-בהנדסה-אזרחית/',
		combined: 650,
		minPsych: 550,
		reqs: [mathReq([[4, 85], [5, 75]], 85), physicsReq(75, 85), englishBagrut([[4, PASS]]), ENG85],
		// "לא ניתן לחשב סכם הנדסי ... ללא 5 יח"ל בפיזיקה וללא תת ציון כמותי"
		engineering: engineering550(660, 5),
		notes: ['מקומות מוגבלים', '8 יח"ל ריאליות', 'מסלול "יסודות" (על תנאי לשנה): משולב 600 / בגרות 105']
	},
	'prog-inst-2-6': {
		page: 'ceb/תנאי-הקבלה-בהנדסה-כימית/',
		combined: 600,
		minPsych: 550,
		bagrutOnly: 100,
		reqs: [mathReq([[4, 80], [5, 70]], 70), englishBagrut([[4, PASS]]), ENG85],
		engineering: engineering550(600),
		notes: ['8 יח"ל ריאליות; חסרי פיזיקה/כימיה 5 יח"ל 70+ — מכינה או קורסי מבוא', 'על תנאי לשנה: משולב 570 / בגרות 95']
	},
	'prog-inst-2-7': {
		page: 'ee/תנאי-הקבלה-בהנדסת-חשמל-ואלקטרוניקה/',
		combined: 640,
		minPsych: 550,
		bagrutOnly: 106,
		psychOnly: 680,
		reqs: [mathReq([[4, 88], [5, 75]], 70), physicsReq(78), englishBagrut([[4, PASS]]), ENG85],
		psychOnlyReqs: [quant(130)],
		// "סכם הנדסי: 680 מותנה בתת ציון כמותי 130 לפחות ... בהיקף 5 יח"ל במתמטיקה ופיזיקה בציון 80 לפחות"
		engineering: { min: 680, minQuantSection: 130, mathMinUnits: 5, physicsMinUnits: 5, minGrade: 80 },
		notes: ['8 יח"ל ריאליות', 'מסלול "יסודות" (על תנאי לשנה): משולב 580 / בגרות 97']
	},
	'prog-inst-2-8': {
		page: 'me/תנאי-הקבלה-בהנדסת-מכונות-ומכטרוניקה/',
		combined: 620,
		minPsych: 550,
		bagrutOnly: 102,
		reqs: [mathReq([[4, 80], [5, 70]], 70), physicsReq(70), englishBagrut([[4, PASS]]), ENG85],
		combinedReqs: [quant(120)],
		engineering: engineering550(600),
		notes: ['8 יח"ל ריאליות', 'מסלול "יסודות" (על תנאי לשנה): משולב 580 / בגרות 97']
	},
	'prog-inst-2-9': IEM, // הנדסת תעשייה וניהול
	'prog-inst-2-42': IEM, // הנדסת מערכות מידע — a specialisation of industrial engineering
	'prog-inst-2-10': {
		page: 'cod/תנאי-הקבלה-במחלקה-להפרעות-בתקשורת/',
		combined: 630,
		minPsych: 590,
		reqs: [
			{ id: 'math', title: 'מתמטיקה 4 יח"ל 80+', anyOf: [math(4, 80), { exam: 'קורס השלמה במכינה ברמה הנדרשת' }] },
			{ id: 'english-bagrut', title: 'אנגלית בבגרות', anyOf: [subj(['אנגלית'], 4, 80), { exam: 'קורס השלמה במכינה ברמה הנדרשת' }] },
			englishLevel(100)
		],
		notes: ['ממוצע בגרות מינימלי לחישוב המשולב: 90', 'או: בגרות 93+ ופסיכומטרי 620+', 'מבדק התאמה וראיון אישי', 'ההרשמה לתשפ"ז נסגרה']
	},
	'prog-inst-2-11': {
		page: 'edu/edu-admission/',
		combined: 550,
		bagrutOnly: 85,
		reqs: [englishBagrut([[4, PASS]]), ENG85],
		notes: ['קבלה לסמסטר: משולב 540–550']
	},
	'prog-inst-2-12': {
		page: 'accounting/תנאי-קבלה-בחשבונאות-וכלכלה/',
		combined: 610,
		bagrutOnly: 100,
		psychOnly: 630,
		reqs: [mathReq([[4, 85], [5, 70]], 80), englishBagrut([[4, PASS]]), ENG85],
		psychOnlyReqs: [quant(120)],
		notes: ['קבלה אחרי ראיון: בגרות 94 / משולב 580 / פסיכומטרי 600', 'נפתח בסמסטר אוקטובר בלבד']
	},
	'prog-inst-2-13': {
		...ECON,
		page: 'economics/economics-d-admission/',
		psychOnly: undefined,
		notes: ['קבלה לסמסטר: בגרות 85–92 או משולב 560–580']
	},
	'prog-inst-2-14': ECON, // כלכלה ומנהל עסקים
	'prog-inst-2-33': ECON, // כלכלה וניהול
	'prog-inst-2-34': ECON, // ניהול וכלכלה
	'prog-ariel-13': ECON, // ניהול ומנהל עסקים
	'prog-inst-2-16': {
		page: 'middle-east/תנאי-הקבלה-לימודי-המזרח-התיכון-ומדעי-ה/',
		combined: 500,
		bagrutOnly: 85,
		reqs: [englishBagrut([[4, PASS]])],
		notes: ['קבלה ללא סיווג רמה באנגלית — על תנאי', 'ראיון אישי: בגרות 80–85']
	},
	'prog-inst-2-17': PREMED, // לימודי קדם רפואה
	'prog-ariel-8': PREMED, // מדעי הרפואה (Pre-Med)
	'prog-inst-2-18': {
		page: 'chemistry/תנאי-הקבלה-במדעי-הכימיה/',
		combined: 580,
		minPsych: 550,
		bagrutOnly: 93,
		reqs: [mathReq([[4, 75], [5, 70]], 70), englishBagrut([[4, PASS]]), ENG85],
		notes: ['9 יח"ל ריאליות (מתוכן 4 מתמטיקה); חסרי פיזיקה/כימיה — קורסי מבוא']
	},
	'prog-inst-2-20': CS, // מדעי המחשב
	'prog-inst-2-41': DS, // מדעי הנתונים ובינה מלאכותית
	'prog-inst-2-43': { ...CS, notes: [...CS.notes, 'דו-חוגי: נדרשים תנאי הקבלה של מדעי המחשב (המחמירים)'] }, // מדעי המחשב ומתמטיקה
	'prog-inst-2-45': {
		...CS,
		reqs: [...CS.reqs, { id: 'physics', title: 'פיזיקה', anyOf: [subj(['פיזיקה'], 5, 80)] }],
		notes: [...CS.notes, 'דו-חוגי עם פיזיקה: בנוסף 5 יח"ל פיזיקה 80+']
	},
	'prog-inst-2-21': {
		page: 'nutrition/תנאי-הקבלה-במדעי-התזונה/',
		combined: 620,
		bagrutOnly: 100,
		reqs: [
			{ id: 'math', title: 'מתמטיקה 4 יח"ל 75+', anyOf: [math(4, 75), { exam: 'קורס השלמה במכינה' }] },
			{ id: 'english-bagrut', title: 'אנגלית בבגרות', anyOf: [subj(['אנגלית'], 4, 80), { exam: 'קורס השלמה במכינה' }] },
			{ id: 'science', title: 'מקצוע ריאלי 5 יח"ל', anyOf: [subj(['ביולוגיה', 'כימיה', 'פיזיקה', 'ביוטכנולוגיה'], 5, PASS)] },
			ENG85
		],
		notes: ['9 יח"ל ריאליות', 'או: פסיכומטרי 580+ ובגרות 90+', 'אין קבלה אוטומטית: קורות חיים, ראיון במידת הצורך; רשימת המתנה']
	},
	'prog-inst-2-22': {
		page: 'math/תנאי-קבלה-במתמטיקה-תשפה/',
		combined: 570,
		bagrutOnly: 92,
		reqs: [mathReq([[4, 80], [5, 70]], 85), englishBagrut([[4, PASS]]), ENG85],
		notes: ['פסיכומטרי 600+ וכמותי 120+ פוטרים ממכינת ההשלמה במתמטיקה (לא לבעלי 3 יח"ל)']
	},
	'prog-inst-2-23': {
		page: 'healthmanagement/תנאי-הקבלה-בניהול-מערכות-בריאות-תשף/',
		combined: 543,
		bagrutOnly: 90,
		reqs: [mathReq([[3, PASS]]), englishBagrut([[4, PASS]]), ENG85],
		notes: ['על תנאי: בגרות 85–90']
	},
	'prog-inst-2-24': {
		page: 'social-anthropology/social-anthropology-admission/',
		combined: 517,
		bagrutOnly: 85,
		reqs: [englishBagrut([[4, PASS]]), ENG85],
		notes: ['קבלה לסמסטר: משולב 550–560']
	},
	'prog-ariel-9': {
		page: 'nursing/תנאי-הקבלה-ללימודי-סיעוד/',
		combined: 570,
		minPsych: 500,
		reqs: [englishBagrut([[4, PASS]]), ENG85],
		notes: ['ממוצע בגרות מינימלי לחישוב המשולב: 85', 'או: בגרות 88+ ופסיכומטרי 550+', 'ראיון אישי לכל מועמד; אין קבלה אוטומטית']
	},
	'prog-inst-2-25': {
		page: 'socialwork/תנאי-הקבלה-בעבודה-סוציאלית/',
		combined: 600,
		sekem: 'general',
		minPsych: 550,
		bagrutOnly: 105,
		reqs: [englishBagrut([[4, PASS]]), ENG85],
		notes: ['גיל 20+', 'רשימת המתנה: בגרות 103–104', 'ההרשמה לתשפ"ז נסגרה']
	},
	'prog-ariel-10': PHYSIO, // פיזיוטרפיה
	'prog-inst-2-26': PHYSIO, // פיזיותרפיה
	'prog-inst-2-27': {
		page: 'physics/תנאי-הקבלה-בפיזיקה/',
		combined: 551,
		bagrutOnly: 90,
		reqs: [
			mathReq([[4, 80]], 70),
			{ id: 'science', title: 'מקצוע ריאלי 5 יח"ל 80+', anyOf: [subj(['פיזיקה', 'מדעי המחשב', 'כימיה'], 5, 80), { exam: 'מכינת השלמה בפיזיקה' }] },
			englishBagrut([[4, PASS]]),
			ENG85
		],
		notes: ['פסיכומטרי נמוך עם כמותי 120+ — לדיון אצל ראש המחלקה']
	},
	'prog-inst-2-28': {
		page: 'behavior/תנאי-הקבלה-במדעי-ההתנהגות/',
		combined: 580,
		bagrutOnly: 97,
		reqs: [mathReq([[3, 80], [4, 60]]), englishBagrut([[4, 80], [5, 70]]), ENG85],
		notes: ['קבלה לסמסטר: בגרות 87–97 או משולב 560–580']
	},
	'prog-inst-2-29': {
		page: 'criminology/תנאי-הקבלה-בחוג-לקרימינולוגיה/',
		combined: 560,
		sekem: 'general',
		bagrutOnly: 90,
		reqs: [englishBagrut([[4, PASS]]), ENG85],
		notes: ['קבלה לסמסטר: בגרות 85–90 או משולב 550–560']
	},
	'prog-inst-2-30': {
		page: 'ba/תנאי-הקבלה-במחלקה-הרב-תחומית/',
		combined: 500,
		bagrutOnly: 80,
		reqs: [englishBagrut([[4, PASS]]), ENG85],
		notes: ['או: בגרות 75 + ראיון']
	},
	'prog-inst-2-31': {
		page: 'occupational-therapy/תנאי-הקבלה-בריפוי-בעיסוק/',
		combined: 620,
		sekem: 'general',
		minPsych: 590,
		reqs: [englishBagrut([[5, 80], [4, 85]]), englishLevel(100)],
		notes: [
			'ממוצע בגרות מינימלי לחישוב המשולב: 90',
			'בגרות בלבד 107 — עם מתמטיקה 5/75 או 4/80 ומגמה מדעית 5 יח"ל',
			'אין קבלה אוטומטית: ראיון אישי, מקומות מוגבלים',
			'ההרשמה לתשפ"ז נסגרה'
		]
	},
	'prog-inst-2-32': {
		page: 'communication/תנאי-קבלה-בבית-הספר-לתקשורת/',
		combined: 580,
		bagrutOnly: 95,
		psychOnly: 580,
		reqs: [englishBagrut([[4, 70], [5, 60]]), ENG85],
		notes: ['פסיכומטרי בלבד 580 — עם זכאות לבגרות בממוצע 80+', 'ראיון: בגרות 85–95 או משולב 550–580']
	},
	'prog-inst-2-40': {
		page: 'cse/תנאי-הקבלה-בהנדסת-מחשבים-ותוכנה/',
		combined: 630,
		minPsych: 590,
		bagrutOnly: 104,
		psychOnly: 650,
		reqs: [mathReq([[4, 85], [5, 75]], 85), physicsReq(70), englishBagrut([[4, 70], [5, 65]]), ENG85],
		combinedReqs: [quant(120)],
		psychOnlyReqs: [quant(130)],
		engineering: engineering550(640),
		notes: ['או סכם מחשבים ותוכנה 640 — בלי פיזיקה, למגמת מדעי המחשב/אלקטרוניקה (הנוסחה לא מפורסמת)']
	}
};

function main() {
	const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf-8'));
	const pages = new Set<string>(snapshot.pages.map((p: { path: string }) => p.path));
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const ariel = data.find((i: any) => i.id === 'inst-2');
	const report: string[] = [];
	const unmatched: string[] = [];

	for (const p of ariel.programs) {
		const e = MAP[p.id];
		if (!e) {
			unmatched.push(`${p.id} ${p.fieldOfStudy} (kept ${p.admissionThreshold}, unverified)`);
			continue;
		}
		if (!pages.has(e.page)) throw new Error(`${p.id}: page ${e.page} not in the snapshot`);
		const url = BASE + e.page;
		const old = p.admissionThreshold;
		const threshold = e.combined;
		p.officialThreshold = threshold;
		p.admissionThreshold = threshold;
		p.relevantSekemType = e.psychometricThreshold ? 'psychometric' : e.sekem ?? 'engineering';
		p.directBagrutEligible = !!e.bagrutOnly;
		p.directBagrutMinAverage = e.bagrutOnly ?? null;
		if (e.minPsych) p.minPsychometricFloor = e.minPsych;
		else delete p.minPsychometricFloor;

		const extra = e.combinedReqs ?? [];
		p.admissionRoutes = {
			...(e.bagrutOnly ? { bagrutOnlyMin: e.bagrutOnly } : {}),
			...(e.psychOnly ? { psychometricOnlyMin: e.psychOnly } : {}),
			...(e.minPsych ? { minPsychometric: e.minPsych } : {}),
			...(e.excellent ? { excellentBagrut: e.excellent } : {}),
			...(e.engineering ? { engineeringScore: e.engineering } : {}),
			requirements: [...e.reqs, ...extra],
			...(extra.length ? { bagrutOnlyRequirements: e.reqs } : {}),
			...(e.psychOnly ? { psychometricOnlyRequirements: [...e.reqs, ...(e.psychOnlyReqs ?? [])] } : {}),
			requirementsSource: `${url} (${UPDATED_AT})`
		};

		const routes = [
			e.psychometricThreshold ? `פסיכומטרי ${e.combined}+` : `ציון קבלה משולב ${e.combined}+${e.minPsych ? ` (פסיכומטרי ${e.minPsych}+)` : ''}`,
			...(e.bagrutOnly ? [`בגרות בלבד ${e.bagrutOnly}+`] : []),
			...(e.psychOnly ? [`פסיכומטרי בלבד ${e.psychOnly}+`] : []),
			...(e.engineering ? [`סכם הנדסי ${e.engineering.min}+`] : [])
		];
		p.comments = `תנאי קבלה רשמיים תשפ"ז (אוניברסיטת אריאל): ${[...routes, ...e.notes].join('; ')}`;
		p.thresholdSource = `${url} — תנאי הקבלה תשפ"ז`;
		p.thresholdUpdatedAt = UPDATED_AT;
		report.push(`${p.fieldOfStudy}: ${old} -> ${threshold}${e.bagrutOnly ? ` (bagrut-only ${e.bagrutOnly})` : ''}${e.psychOnly ? ` (psych-only ${e.psychOnly})` : ''}`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(`Updated ${report.length} Ariel programs`);
	for (const l of report) console.log('  ' + l);
	console.log(`\nNo official page matched (${unmatched.length}):`);
	for (const l of unmatched) console.log('  ' + l);
}

main();
