/**
 * Imports the official admission process of medicine (6-year M.D.) and dental medicine into
 * src/data/academicData.json, for all 8 universities.
 *
 *   npx tsx scripts/data/importMedicine.ts
 *
 * Source: each university's official medicine admission page, collected 2026-10-05.
 * Snapshot with verbatim quotes and URLs: src/data/sources/medicine-admission-2026-10-05.json.
 *
 * Every Israeli medicine program is screened: meeting the cognitive threshold (sekem / weighted score) and the
 * registration conditions only invites the applicant to a screening stage (MOR/מרק"ם, a computerized test,
 * interviews, a spatial-perception test), and the final decision is made there. This is modelled as
 * `admissionRoutes.screening`. The platform never shows "accepted" for these programs, only "passes to screening".
 *
 * - Where the institution publishes the threshold (HUJI, Technion), it is kept.
 * - BGU publishes סכם 735 + psychometric 680 on the degree page's "תנאי קבלה" tab, rendered by JavaScript (not in the
 *   served HTML — transcribed from the user's screenshot).
 * - Where it is set each year from the applicant pool and isn't published (Ariel, Bar-Ilan), the threshold is
 *   removed (admissionThreshold null), and only the published registration conditions are checked.
 * - Tel Aviv: the official page shows "אין מידע להציג" (loaded dynamically). The unsourced thresholds are removed, and
 *   the programs say their conditions are not verified yet. They wait for the user's screenshots (USER_TASKS).
 * - Reichman: a 4-year program for degree holders only, so it is marked notOffered for high-school graduates.
 * - Bar-Ilan's 6-year track exists (it was wrongly hidden as notOffered).
 *
 * Idempotent: each run sets the same fields to the same values.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const JSON_PATH = path.join(ROOT, 'src/data/academicData.json');
const FETCHED = '2026-10-05';

const MOR = 'מבדקי מו"ר/מרק"ם';
const english = (min: number, otherOptions?: string) => ({
	id: 'english',
	title: min >= 120 ? "רמת אנגלית (מתקדמים ב')" : 'רמת אנגלית',
	anyOf: [{ psych: [{ section: 'english' as const, min }] }],
	...(otherOptions ? { otherOptions } : {})
});
const math = (opts: [number, number][], title = 'מתמטיקה', otherOptions?: string) => ({
	id: 'math',
	title,
	anyOf: opts.map(([units, grade]) => ({ bagrut: [{ subjects: ['מתמטיקה'], minUnits: units, minGrade: grade }] })),
	...(otherOptions ? { otherOptions } : {})
});

interface Update {
	/** null = no published threshold. undefined = keep the current one. */
	threshold?: number | null;
	relevantSekemType?: string | null;
	routes: Record<string, unknown>;
	comments: string;
	notOffered?: { note: string; source: string } | null;
}

const HUJI_MED_NOTE =
	'שלב א\': ציון משוקלל קוגניטיבי (בגרות ופסיכומטרי), סף המעבר לתשפ"ז 25.186. שלב ב\': מבדקי מו"ר/מרק"ם, נדרש 175 לפחות. ' +
	'שלב ג\': ציון סופי 60% מו"ר/מרק"ם ו-40% הציון המשוקלל; הציון הסופי לקבלה שפורסם לתשפ"ז 25.783 (תשפ"ו 25.966). פסיכומטרי רב-תחומי 700 לפחות.';
const TECHNION_NOTE =
	'92.000 הוא סף הזימון למבדקי מו"ר (תשפ"ה 92.000, תשפ"ו 91.270). הקבלה הסופית לפי ציון מו"ר משוקלל, וציון הקבלה שפורסם הוא 205.';

const UPDATES: Record<string, Update> = {
	// ── HUJI ────────────────────────────────────────────────────────────────
	'prog-huji-5': {
		routes: {
			screening: { stage: MOR, note: HUJI_MED_NOTE, source: `https://info.huji.ac.il/bachelor/Medicine — ${FETCHED}` }
		},
		comments: `הליך מיון בשלושה שלבים (רשמי, info.huji.ac.il). ${HUJI_MED_NOTE}`
	},
	'prog-huji-6': {
		routes: {
			screening: {
				stage: 'מבחן תפיסה מרחבית וראיונות',
				note:
					'שלב א\': ציון משוקלל קוגניטיבי וסף מעבר. שלב ב\': מבחן תפיסה מרחבית — כ-85% מהמועמדים הגבוהים עוברים. ' +
					'שלב ג\': יום ראיונות ושאלון שאו"ל (80% ראיונות, 20% שאו"ל). פסיכומטרי רב-תחומי 640 לפחות.',
				source: `https://info.huji.ac.il/bachelor/Dental-Medicine — ${FETCHED}`
			}
		},
		comments:
			'הליך מיון בשלושה שלבים (רשמי): ציון קוגניטיבי, מבחן תפיסה מרחבית, ראיונות ושאלון שאו"ל. פסיכומטרי רב-תחומי 640 לפחות.'
	},
	// ── Technion: the published 92 is the MOR invitation threshold ─────────────
	...Object.fromEntries(
		['prog-technion-36', 'prog-inst-48-46', 'prog-technion-37', 'prog-technion-38', 'prog-technion-39'].map((id) => [
			id,
			{
				routes: { screening: { stage: 'מבדקי מו"ר', note: TECHNION_NOTE, source: `טבלת סיכום אפשרויות הקבלה, admissions.technion.ac.il (אוקטובר 2026)` } },
				comments: `סף הזימון למו"ר (רשמי). ${TECHNION_NOTE}`
			}
		])
	),
	// ── BGU: סכם 735 ובנוסף פסיכומטרי 680 (the degree page's "תנאי קבלה" tab, rendered by JavaScript — the values are not
	//    in the served HTML; transcribed from the user's screenshot of ?tab=2944, 2026-10-05, registration for תשפ"ח) ──
	'prog-bgu-180': {
		threshold: 735,
		relevantSekemType: 'general',
		routes: {
			minPsychometric: 680,
			requirements: [english(120, 'רמת מתקדמים ב\' (אמי"ר/אמירנט)')],
			requirementsSource: `https://www.bgu.ac.il/welcome/ba/catalog/categories/medical-school/?tab=2944 — צילום מסך של המשתמש, ${FETCHED}`,
			screening: {
				stage: 'המבחן הממוחשב והראיונות',
				note:
					'תנאי הסף לזימון: סכם 735 ובנוסף פסיכומטרי כללי רב-תחומי (או נתיב לאקדמיה) 680, אנגלית מתקדמים ב\', עברית רמה ו\' (לנדרשים). ' +
					'אחר כך מבחן ממוחשב ושני ראיונות; מתקבלים בעלי ההערכות הגבוהות ביותר בכל שלב, עד מילוי המכסה.',
				source: `https://www.bgu.ac.il/welcome/ba/catalog/categories/medical-school/?tab=2944 — ${FETCHED}`
			}
		},
		comments:
			'הליך מיון (רשמי, דף התואר, הרשמה לתשפ"ח): סכם 735 ובנוסף פסיכומטרי 680, אנגלית מתקדמים ב\'; מבחן ממוחשב ושני ראיונות.'
	},
	// ── Ariel 6-year: threshold set after registration ────────────────────────
	'prog-inst-2-39': {
		threshold: null,
		relevantSekemType: 'general',
		routes: {
			minPsychometric: 680,
			requirements: [
				math([[4, 80], [5, 70]], 'מתמטיקה', 'קורס מתמטי במוסד אקדמי מוכר כחלופה ל-4 יח"ל (בבקשה)'),
				english(120, "מתקדמים ב', אמירנט 120, SAT מילולי 377, תואר ראשון ממוסד ישראלי מוכר, או מתקדמים א' בציון עובר")
			],
			requirementsSource: `https://www.ariel.ac.il/wp/med/admission-6years/ — ${FETCHED}`,
			screening: {
				stage: 'ההערכה הלא-קוגניטיבית (מו"ר או מיון באריאל)',
				note:
					'שלב א\': ציון קבלה משולב [(בגרות × 6.666) + פסיכומטרי] / 2, וסף שייקבע. שלב ב\': הערכה לא-קוגניטיבית — ציון מו"ר או מיון באוניברסיטת אריאל. ' +
					'ציון סופי: 70% ציון משולב ו-30% ההערכה הלא-קוגניטיבית, ונדרש גם ציון מינימלי בהערכה. פסיכומטרי 680 לפחות.',
				source: `https://www.ariel.ac.il/wp/med/admission-6years/ — ${FETCHED}`
			}
		},
		comments: 'תוכנית שש-שנתית, תשפ"ז (רשמי): פסיכומטרי 680+, מתמטיקה 4 יח"ל 80 / 5 יח"ל 70, אנגלית מתקדמים ב\'; 70% ציון משולב + 30% הערכה לא-קוגניטיבית.'
	},
	// ── Bar-Ilan 6-year (exists — was wrongly hidden) ─────────────────────────
	'prog-inst-4-95': {
		threshold: null,
		relevantSekemType: null,
		notOffered: null,
		routes: {
			minPsychometric: 680,
			minBagrutAverage: 101,
			requirements: [
				math([[4, 85], [5, 80]], 'מתמטיקה (ציון ללא בונוס)'),
				english(120, 'אמי"ר / אמיר"ם 120+'),
				{ id: 'hebrew-verbal', title: 'עברית: חשיבה מילולית 107+', anyOf: [{ psych: [{ section: 'verbal' as const, min: 107 }] }] }
			],
			requirementsSource: `https://medicine.biu.ac.il/six_year_track_application_requirements — ${FETCHED}`,
			screening: {
				stage: 'שלב המיונים',
				note:
					'תנאי סף: פסיכומטרי 680+, ממוצע בגרות משוקלל 101+, מתמטיקה 4 יח"ל 85 / 5 יח"ל 80 (ללא בונוס), אנגלית 120+, ' +
					'עברית: 107+ בפרק החשיבה המילולית. ' +
					'שלבי המיון וספי המעבר אינם מפורסמים בדף הרשמי (הפקולטה לרפואה ע"ש עזריאלי, צפת).',
				source: `https://medicine.biu.ac.il/six_year_track_application_requirements — ${FETCHED}`
			}
		},
		comments: 'תוכנית שש-שנתית (הפקולטה לרפואה ע"ש עזריאלי, צפת). תנאי סף רשמיים: פסיכומטרי 680+, ממוצע 101+, מתמטיקה 4/85 או 5/80 ללא בונוס, אנגלית 120+, חשיבה מילולית 107+.'
	},
	// ── Reichman: graduates only ──────────────────────────────────────────────
	'prog-inst-38-13': {
		threshold: null,
		relevantSekemType: null,
		notOffered: {
			note: 'ברייכמן יש רק תוכנית ארבע-שנתית לבוגרי תואר ראשון (ממוצע 80+, קורסי ליבה, MCAT) — אין מסלול לבוגרי תיכון.',
			source: `https://www.runi.ac.il/media/vgrbi4om/ru_md-regulations-2026_5.pdf (${FETCHED})`
		},
		routes: {},
		comments: 'תוכנית ארבע-שנתית לבוגרי תואר ראשון בלבד (תקנון תשפ"ז).'
	}
};

// ── Tel Aviv: official conditions not readable yet — remove the unsourced thresholds ──
const TAU_NOTE =
	'הקבלה בהליך מיון: סף קוגניטיבי ואחריו מבדקי מו"ר/מרק"ם (בתי הספר לרפואה בעברית, בת"א ובטכניון משתמשים באותם מבדקים — info.huji.ac.il). ' +
	'הספים ותנאי הסף של ת"א טרם אומתו מול האתר הרשמי.';
for (const id of ['prog-tau-0111-18', 'prog-tau-0102-35']) {
	UPDATES[id] = {
		threshold: null,
		relevantSekemType: null,
		routes: { screening: { stage: MOR, note: TAU_NOTE, source: `https://go.tau.ac.il/he/med/ba/med-doc — ${FETCHED}` } },
		comments: TAU_NOTE
	};
}
UPDATES['prog-tau-0191-83'] = {
	threshold: null,
	relevantSekemType: null,
	routes: {
		screening: {
			stage: 'מבחן תפיסה מרחבית וראיונות',
			note: 'הקבלה בהליך מיון; מבחן התפיסה המרחבית מתקיים בעברית ובת"א באותו יום (info.huji.ac.il). הספים ותנאי הסף של ת"א טרם אומתו מול האתר הרשמי.',
			source: `https://go.tau.ac.il/he/med/ba/dental — ${FETCHED}`
		}
	},
	comments: 'הקבלה בהליך מיון. הספים ותנאי הסף של ת"א טרם אומתו מול האתר הרשמי.'
};

function main() {
	const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
	const programs = new Map<string, any>();
	// Only the 8 universities: some college programs share ids with university programs
	const UNIVERSITIES = new Set(['inst-1', 'inst-2', 'inst-3', 'inst-4', 'inst-6', 'inst-38', 'inst-48', 'inst-5']);
	for (const inst of data) if (UNIVERSITIES.has(inst.id)) for (const p of inst.programs) programs.set(p.id, p);
	const report: string[] = [];

	for (const [id, u] of Object.entries(UPDATES)) {
		const p = programs.get(id);
		if (!p) throw new Error(`${id} not in the catalog`);
		if (u.threshold === null) {
			p.admissionThreshold = null;
			for (const k of ['officialThreshold', 'thresholdSource', 'thresholdUpdatedAt', 'sekemScore', 'psychometricScore', 'minPsychometricFloor']) delete p[k];
		} else if (u.threshold !== undefined) {
			p.admissionThreshold = u.threshold;
			p.officialThreshold = u.threshold;
			p.thresholdSource = (u.routes.screening as { source: string }).source;
			p.thresholdUpdatedAt = FETCHED;
			for (const k of ['sekemScore', 'psychometricScore', 'minPsychometricFloor']) delete p[k];
		}
		if (u.relevantSekemType === null) delete p.relevantSekemType;
		else if (u.relevantSekemType) p.relevantSekemType = u.relevantSekemType;
		if (u.notOffered === null) delete p.notOffered;
		else if (u.notOffered) p.notOffered = u.notOffered;
		const floor = (p.admissionRoutes ?? u.routes)?.minPsychometric ?? (u.routes.minPsychometric as number | undefined);
		p.requiresPsychometric = true;
		p.directBagrutEligible = false;
		p.directBagrutMinAverage = null;
		// Keep fields set by other imports (e.g. HUJI requirements / minPsychometric), override with ours
		p.admissionRoutes = { ...(u.threshold === null ? {} : p.admissionRoutes ?? {}), ...u.routes };
		if (u.notOffered) delete p.admissionRoutes;
		p.comments = u.comments;
		if (floor && !p.notOffered) p.minPsychometricFloor = floor;
		report.push(`${id} ${p.fieldOfStudy}: threshold=${p.admissionThreshold ?? 'none'} screening=${p.admissionRoutes?.screening ? 'yes' : 'no'}${p.notOffered ? ' notOffered' : ''}`);
	}

	fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
	console.log(report.join('\n'));
}

main();
