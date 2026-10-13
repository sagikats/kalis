/**
 * Mechina (pre-academic program) and Open University transfer-track ("אפיק מעבר") pages per university.
 *
 * Open University — checked 2026-10-13 against www.openu.ac.il/transfertrack (snapshot:
 * src/data/sources/openu-transfer-tracks-2026-10-13.json):
 * - The index lists transfer tracks to TAU, HUJI, Technion, Bar-Ilan, Haifa and BGU only. Ariel and Reichman pages return 404.
 * - Tracks exist only for specific faculties/programs (Bar-Ilan: the Faculty of Law only), so the list is shown as-is
 *   and never matched to a program automatically.
 * - Since the CHE decision of 2022, guaranteed admission through a track also requires bagrut-certificate eligibility
 *   (not bagrut grades). No psychometric test. Many tracks require an English exemption.
 * Mechina — checked 2026-10-13 in the browser against each university's own page (snapshot with quotes:
 * src/data/sources/mechina-pages-2026-10-13.json). Each institution uses mechina grades differently, so MECHINA_INFO
 * states each one's own rule. TAU's mechina is the joint TAU–Bar-Ilan mechina (stated on go.tau.ac.il and on the BIU
 * mechina site). Reichman has no pre-academic mechina for a bachelor's degree.
 * Programs, conditions and grades are deliberately not listed here — the linked official pages are the source.
 */
import openUniversitySnapshot from './sources/openu-transfer-tracks-2026-10-13.json';

export interface OpenUniversityTrack {
	name: string;
	url: string;
}

export const OPEN_UNIVERSITY_CHECKED_AT = '13.10.2026';
export const OPEN_UNIVERSITY_RULES_URL = 'https://www.openu.ac.il/transfertrack/pages/updates.aspx';

/** Transfer tracks from the Open University to each university, exactly as listed on the OU site. */
export const OPEN_UNIVERSITY_TRACKS: Record<string, OpenUniversityTrack[]> = openUniversitySnapshot.tracks;

export interface BypassRouteLinks {
	openUniversityUrl?: string;
}

export const BYPASS_ROUTES: Record<string, BypassRouteLinks> = {
	technion: { openUniversityUrl: 'https://www.openu.ac.il/transfertrack/technion/pages/default.aspx' },
	tau: { openUniversityUrl: 'https://www.openu.ac.il/transfertrack/tel-aviv/pages/default.aspx' },
	huji: { openUniversityUrl: 'https://www.openu.ac.il/transfertrack/hebrew/pages/default.aspx' },
	bgu: { openUniversityUrl: 'https://www.openu.ac.il/transfertrack/ben-gurion/pages/default.aspx' },
	haifa: { openUniversityUrl: 'https://www.openu.ac.il/transfertrack/haifa/pages/default.aspx' },
	ariel: {},
	bar_ilan: { openUniversityUrl: 'https://www.openu.ac.il/transfertrack/bar-ilan/pages/default.aspx' },
	reichman: {}
};

export interface MechinaInfo {
	/** The official page that states the rule below. */
	url: string;
	title: string;
	/** How this institution uses mechina grades for admission, in its own terms. */
	howItWorks: string;
	notes: string[];
}

export const MECHINA_CHECKED_AT = '13.10.2026';

/** Per-institution mechina rules, paraphrased from the official pages (see the snapshot for exact quotes). */
export const MECHINA_INFO: Record<string, MechinaInfo | null> = {
	technion: {
		url: 'https://kdam.technion.ac.il/node/52',
		title: 'מכינת הטכניון',
		howItWorks: 'תעודת סיום המכינה מחליפה את תעודת הבגרות בחישוב ציון הסכם לטכניון — בכל הפקולטות חוץ מרפואה.',
		notes: ['הקבלה למכינה מותנית בציון באנגלית מהפסיכומטרי או ממבחן אמירנט.']
	},
	huji: {
		url: 'https://mechina.huji.ac.il/%D7%A7%D7%91%D7%9C%D7%94-%D7%9C%D7%90%D7%95%D7%A0%D7%99%D7%91%D7%A8%D7%A1%D7%99%D7%98%D7%94',
		title: 'המכינה האוניברסיטאית של העברית',
		howItWorks: 'ציון המכינה מחליף את תעודת הבגרות. עם הישגים גבוהים במכינה מתקבלים ישירות, בלי קשר לפסיכומטרי; בחוגים בלי קבלה ישירה — שקלול של 50% פסיכומטרי ו-50% ציון מכינה.',
		notes: ['האוניברסיטה שומרת מקומות לתלמידי המכינה, אבל לא מתחייבת לקבל מי שלא עומד בקריטריונים.']
	},
	haifa: {
		url: 'https://mechina.haifa.ac.il/%d7%90%d7%a4%d7%99%d7%a7-%d7%9e%d7%a2%d7%91%d7%a8-%d7%9c%d7%91%d7%95%d7%92%d7%a8%d7%99-%d7%9e%d7%9b%d7%99%d7%a0%d7%94-%d7%9c%d7%aa%d7%95%d7%90%d7%a8-%d7%a8%d7%90%d7%a9%d7%95%d7%9f-%d7%9c%d7%9c%d7%90-2/',
		title: 'המכינה האוניברסיטאית של חיפה',
		howItWorks: 'בוגרי המכינה יכולים להתקבל לחוגים מסוימים בלי פסיכומטרי, לפי ממוצע מכינה שנקבע לכל חוג (למשל משפטים 88, סיעוד 85), ולפעמים גם ראיון או מבחן חוגי.',
		notes: ['האפיק תקף רק למכינות בקמפוס חיפה.']
	},
	ariel: {
		url: 'https://www.ariel.ac.il/wp/mechina/%d7%9e%d7%9b%d7%99%d7%a0%d7%95%d7%aa/',
		title: 'המכינה הקדם-אקדמית של אריאל',
		howItWorks: 'מיועדת למי שלא עומד בתנאי הקבלה של המחלקה לפי ציוני הבגרות; רמת הלימודים מותאמת לתנאי הקבלה של כל פקולטה.',
		notes: ['למי שיש בגרות חלקית: סיום המכינה מקנה תעודה שוות ערך לבגרות — באוניברסיטת אריאל בלבד.']
	},
	bar_ilan: {
		url: 'https://mechina-kda.biu.ac.il/node/851',
		title: 'המכינה הקדם-אקדמית של בר-אילן',
		howItWorks: 'תעודת המכינה מחליפה את תעודת הבגרות בקבלה לבר-אילן (וגם לתל אביב), לפי תנאי הקבלה של כל מחלקה ובהתאם למסלול שנלמד במכינה: מדעים מדויקים, מדעי הטבע, או חברה ורוח.',
		notes: []
	},
	tau: {
		url: 'https://go.tau.ac.il/he/ba/mechinot',
		title: 'המכינה המשותפת לתל אביב ולבר-אילן',
		howItWorks: 'הקבלה לתל אביב היא לפי הגבוה מבין שני ציונים: "ציון התאמה מכינה" (ציון גמר המכינה, בלי בונוסים, יחד עם הפסיכומטרי) או ציון ההתאמה הרגיל (בגרות ופסיכומטרי).',
		notes: ['הלימודים מתקיימים בקמפוס בר-אילן.', 'גם במסלול המכינה נדרש ציון פסיכומטרי.']
	},
	bgu: {
		url: 'https://www.bgu.ac.il/welcome/kdam/',
		title: 'המרכז ללימודים קדם-אקדמיים בבן-גוריון',
		howItWorks: 'תעודת המכינה היא חלופה לתעודת הבגרות, לפי תנאי הקבלה של כל מחלקה — כולל סף פסיכומטרי או "נתיב לאקדמיה" אם יש למחלקה.',
		notes: ['למי שמסיים בהצלחה במועדי א׳ ועומד בתנאי הקבלה — מקום שמור בתואר; אחרי מועדי ב׳ — לפי מקום פנוי.']
	},
	reichman: null
};

