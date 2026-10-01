export interface BagrutSubjectOption {
	id: string;
	name: string;
	category: 'mandatory' | 'stem' | 'social' | 'humanities' | 'arts' | 'other';
	categoryLabel: string;
	defaultUnits: number;
	allowedUnits: number[];
	keywords?: string[];
	bonus?: number; // 20 or 25
	isPopularElective?: boolean;
	icon?: string;
}

export interface PopularElectiveOption {
	id: string;
	name: string;
	units: number;
	defaultGrade: number;
	label: string;
	shortLabel?: string;
	icon: string;
	bonus: number;
	category: 'stem' | 'social' | 'humanities' | 'arts' | 'other';
	description: string;
}

/**
 * Top 5-Unit Elective subjects commonly chosen by Israeli high school students
 * and matriculation score improvers to boost university admission Sekem.
 */
export const POPULAR_5U_ELECTIVES: PopularElectiveOption[] = [
	{
		id: 'geography',
		name: 'גיאוגרפיה',
		units: 5,
		defaultGrade: 90,
		label: '⚡ גיאוגרפיה 5 יח״ל (מקפצת ממוצע)',
		shortLabel: 'גיאוגרפיה',
		icon: '🌍',
		bonus: 20,
		category: 'social',
		description: 'המקצוע הפופולרי ביותר להקפצת ממוצע בגרות מהירה עם בונוס אוניברסיטאי של +20 נקודות.'
	},
	{
		id: 'cs',
		name: 'מדעי המחשב',
		units: 5,
		defaultGrade: 88,
		label: '💻 מדעי המחשב 5 יח״ל',
		shortLabel: 'מדעי המחשב',
		icon: '💻',
		bonus: 25,
		category: 'stem',
		description: 'מקצוע מפתח טכנולוגי המעניק בונוס מרבי של +25 נקודות ומקדם קבלה להנדסה ומדעים.'
	},
	{
		id: 'physics',
		name: 'פיזיקה',
		units: 5,
		defaultGrade: 86,
		label: '⚛️ פיזיקה 5 יח״ל',
		shortLabel: 'פיזיקה',
		icon: '⚛️',
		bonus: 25,
		category: 'stem',
		description: 'מקצוע דגל מדעי המעניק בונוס +25 נקודות (ובטכניון +30) ומהווה תנאי קבלה לפקולטות להנדסה.'
	},
	{
		id: 'chemistry',
		name: 'כימיה',
		units: 5,
		defaultGrade: 88,
		label: '🧪 כימיה 5 יח״ל',
		shortLabel: 'כימיה',
		icon: '🧪',
		bonus: 25,
		category: 'stem',
		description: 'מקצוע מדעי מוגבר עם בונוס +20 עד +25 נקודות ויתרון בקבלה לרפואה, הנדסה ורוקחות.'
	},
	{
		id: 'biology',
		name: 'ביולוגיה',
		units: 5,
		defaultGrade: 88,
		label: '🧬 ביולוגיה 5 יח״ל',
		shortLabel: 'ביולוגיה',
		icon: '🧬',
		bonus: 20,
		category: 'stem',
		description: 'מדעי החיים והטבע, מעניק בונוס +20 נקודות ומהווה יתרון משמעותי לקבלה למקצועות הרפואה.'
	},
	{
		id: 'diplomacy',
		name: 'דיפלומטיה ויחסים בינלאומיים (באנגלית)',
		units: 5,
		defaultGrade: 90,
		label: '🌐 דיפלומטיה 5 יח״ל (באנגלית)',
		shortLabel: 'דיפלומטיה',
		icon: '🌐',
		bonus: 20,
		category: 'social',
		description: 'מגמת דגל יוקרתית הנלמדת באנגלית ומשלבת תקשורת בינלאומית עם בונוס מלא של +20 נקודות.'
	},
	{
		id: 'cyber',
		name: 'הגנת סייבר',
		units: 5,
		defaultGrade: 88,
		label: '🛡️ סייבר ותוכנה 5 יח״ל',
		shortLabel: 'סייבר',
		icon: '🛡️',
		bonus: 25,
		category: 'stem',
		description: 'אבטחת מידע, רשתות ותכנות עם בונוס טכנולוגי מרבי של +25 נקודות.'
	},
	{
		id: 'data_science',
		name: 'מדעי המידע והנתונים (Data Science)',
		units: 5,
		defaultGrade: 88,
		label: '📈 Data Science ונתונים 5 יח״ל',
		shortLabel: 'מדעי הנתונים',
		icon: '📈',
		bonus: 25,
		category: 'stem',
		description: 'ניתוח נתונים, פייתון ומודלים של בינה מלאכותית עם בונוס טכנולוגי מרבי של +25 נקודות.'
	},
	{
		id: 'economics_mgmt',
		name: 'כלכלה וניהול / כלכלה ומנהל עסקים',
		units: 5,
		defaultGrade: 88,
		label: '📊 כלכלה וניהול 5 יח״ל',
		shortLabel: 'כלכלה',
		icon: '📊',
		bonus: 20,
		category: 'social',
		description: 'מנהל עסקים, כלכלה וחשבונאות המעניקים בונוס אוניברסיטאי של +20 נקודות.'
	},
	{
		id: 'psychology_socio',
		name: 'פסיכולוגיה וסוציולוגיה (מדעי החברה)',
		units: 5,
		defaultGrade: 88,
		label: '🧠 פסיכולוגיה וסוציולוגיה 5 יח״ל',
		shortLabel: 'פסיכו-סוציו',
		icon: '🧠',
		bonus: 20,
		category: 'social',
		description: 'מדעי החברה מורחב, מעניק בונוס +20 נקודות והיכרות מעמיקה עם תחום מדעי ההתנהגות.'
	},
	{
		id: 'literature_5u',
		name: 'ספרות עברית (מוגבר 5 יח"ל)',
		units: 5,
		defaultGrade: 88,
		label: '📖 ספרות מורחב 5 יח״ל',
		shortLabel: 'ספרות 5',
		icon: '📖',
		bonus: 25,
		category: 'humanities',
		description: 'הרחבה מ-2 ל-5 יח״ל שמעניקה בונוס מלא של +20 עד +25 נקודות ומקפיצה את הציון הכולל.'
	},
	{
		id: 'bible_5u',
		name: 'תנ"ך (מוגבר 5 יח"ל)',
		units: 5,
		defaultGrade: 88,
		label: '📜 תנ״ך מורחב 5 יח״ל',
		shortLabel: 'תנ״ך 5',
		icon: '📜',
		bonus: 25,
		category: 'humanities',
		description: 'הרחבה מ-2 ל-5 יח״ל עם בונוס מוגבר של +20 עד +25 נקודות בכל האוניברסיטאות.'
	},
	{
		id: 'history_5u',
		name: 'היסטוריה (מוגבר 5 יח"ל)',
		units: 5,
		defaultGrade: 88,
		label: '🏛️ היסטוריה מורחב 5 יח״ל',
		shortLabel: 'היסטוריה 5',
		icon: '🏛️',
		bonus: 25,
		category: 'humanities',
		description: 'הרחבה מ-2 ל-5 יח״ל עם בונוס של +20 עד +25 נקודות באוניברסיטאות.'
	},
	{
		id: 'civics_5u',
		name: 'אזרחות (מוגבר 5 יח"ל)',
		units: 5,
		defaultGrade: 88,
		label: '⚖️ אזרחות מורחב 5 יח״ל',
		shortLabel: 'אזרחות 5',
		icon: '⚖️',
		bonus: 20,
		category: 'humanities',
		description: 'הרחבת מקצוע החובה ל-5 יח״ל עם בונוס אוניברסיטאי של +20 נקודות.'
	},
	{
		id: 'russian_5u',
		name: 'רוסית (מוגבר 5 יח"ל)',
		units: 5,
		defaultGrade: 92,
		label: '🇷🇺 רוסית 5 יח״ל (שפה זרה)',
		shortLabel: 'רוסית',
		icon: '🇷🇺',
		bonus: 20,
		category: 'humanities',
		description: 'בגרות שפה זרה מוגברת פופולרית מאוד המעניקה בונוס מלא של +20 נקודות.'
	},
	{
		id: 'spanish_5u',
		name: 'ספרדית (מוגבר 5 יח"ל)',
		units: 5,
		defaultGrade: 90,
		label: '🇪🇸 ספרדית 5 יח״ל (שפה זרה)',
		shortLabel: 'ספרדית',
		icon: '🇪🇸',
		bonus: 20,
		category: 'humanities',
		description: 'שפה זרה מוגברת 5 יח״ל המעניקה בונוס אוניברסיטאי של +20 נקודות.'
	},
	{
		id: 'french_5u',
		name: 'צרפתית (מוגבר 5 יח"ל)',
		units: 5,
		defaultGrade: 90,
		label: '🇫🇷 צרפתית 5 יח״ל (שפה זרה)',
		shortLabel: 'צרפתית',
		icon: '🇫🇷',
		bonus: 20,
		category: 'humanities',
		description: 'שפה זרה מוגברת 5 יח״ל המעניקה בונוס אוניברסיטאי של +20 נקודות.'
	},
	{
		id: 'arabic_5u',
		name: 'ערבית (מוגבר 5 יח"ל)',
		units: 5,
		defaultGrade: 90,
		label: '🇸🇦 ערבית מורחב 5 יח״ל',
		shortLabel: 'ערבית 5',
		icon: '🇸🇦',
		bonus: 25,
		category: 'humanities',
		description: 'שפה זרה מוגברת פופולרית המעניקה בונוס של +20 עד +25 נקודות ויתרון למודיעין.'
	},
	{
		id: 'cinema',
		name: 'קולנוע ומדיה / תקשורת וקולנוע',
		units: 5,
		defaultGrade: 88,
		label: '🎬 קולנוע ומדיה 5 יח״ל',
		shortLabel: 'קולנוע',
		icon: '🎬',
		bonus: 20,
		category: 'arts',
		description: 'בימוי, הפקה ותסריטאות עם בונוס אוניברסיטאי של +20 נקודות.'
	},
	{
		id: 'art',
		name: 'אמנות חזותית / תולדות האמנות',
		units: 5,
		defaultGrade: 90,
		label: '🎨 אמנות ועיצוב 5 יח״ל',
		shortLabel: 'אמנות',
		icon: '🎨',
		bonus: 20,
		category: 'arts',
		description: 'ציור, פיסול ותולדות האמנות המעניקים בונוס אוניברסיטאי של +20 נקודות.'
	},
	{
		id: 'dance',
		name: 'מחול / רסיטל מחול',
		units: 5,
		defaultGrade: 90,
		label: '💃 מחול ורסיטל 5 יח״ל',
		shortLabel: 'מחול',
		icon: '💃',
		bonus: 20,
		category: 'arts',
		description: 'כוריאוגרפיה, בלט ורסיטל מחול עם בונוס אוניברסיטאי של +20 נקודות.'
	},
	{
		id: 'electronics',
		name: 'אלקטרוניקה ומחשבים',
		units: 5,
		defaultGrade: 88,
		label: '🔌 אלקטרוניקה ומחשבים 5 יח״ל',
		shortLabel: 'אלקטרוניקה',
		icon: '🔌',
		bonus: 25,
		category: 'stem',
		description: 'מערכות ספרתיות ומחשוב המעניקות בונוס טכנולוגי של +25 נקודות.'
	},
	{
		id: 'middle_east_studies',
		name: 'לימודי המזרח התיכון והאסלאם / מזרחנות',
		units: 5,
		defaultGrade: 90,
		label: '🕌 מזרחנות 5 יח״ל',
		shortLabel: 'מזרחנות',
		icon: '🕌',
		bonus: 20,
		category: 'humanities',
		description: 'לימודי המזרח התיכון והאסלאם / מזרחנות, מקצוע פופולרי המעניק בונוס אוניברסיטאי של +20 עד +25 נקודות ויתרון במודיעין.'
	},
	{
		id: 'law_adv',
		name: 'משפטים / מבוא למשפט ומשפט ציבורי',
		units: 5,
		defaultGrade: 90,
		label: '⚖️ משפטים 5 יח״ל',
		shortLabel: 'משפטים',
		icon: '⚖️',
		bonus: 20,
		category: 'social',
		description: 'מבוא למשפט, משפט חוקתי ופלילי, מקצוע מבוקש המעניק בונוס אוניברסיטאי של +20 נקודות.'
	},
	{
		id: 'robotics',
		name: 'רובוטיקה ומערכות אוטונומיות',
		units: 5,
		defaultGrade: 90,
		label: '🤖 רובוטיקה 5 יח״ל',
		shortLabel: 'רובוטיקה',
		icon: '🤖',
		bonus: 25,
		category: 'stem',
		description: 'רובוטיקה ובקרה, מעניקה בונוס טכנולוגי מרבי של +25 נקודות וקידום קבלה להנדסה.'
	},
	{
		id: 'entrepreneurship',
		name: 'יזמות עסקית וחדשנות / ניהול יזמות',
		units: 5,
		defaultGrade: 90,
		label: '💡 יזמות וחדשנות 5 יח״ל',
		shortLabel: 'יזמות',
		icon: '💡',
		bonus: 20,
		category: 'social',
		description: 'יזמות, סטארטאפ וניהול עסקי עם בונוס אוניברסיטאי של +20 נקודות.'
	},
	{
		id: 'final_project',
		name: 'עבודת גמר מחקרית (5 יח"ל)',
		units: 5,
		defaultGrade: 92,
		label: '📝 עבודת גמר מחקרית 5 יח״ל',
		shortLabel: 'עבודת גמר',
		icon: '📝',
		bonus: 25,
		category: 'other',
		description: 'עבודת מחקר מדעית או עיונית המאושרת במשרד החינוך ומקנה בונוס מלא של +20 עד +25 נקודות.'
	}
];

/**
 * Complete, highly accurate Master Catalog of all Israeli Bagrut subjects
 * recognized by the Ministry of Education and all 8 universities.
 */
export const BAGRUT_SUBJECTS_CATALOG: BagrutSubjectOption[] = [
	// =========================================================
	// מקצועות חובה (2-5 יחידות לימוד)
	// =========================================================
	{
		id: 'math',
		name: 'מתמטיקה',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 5,
		allowedUnits: [3, 4, 5],
		bonus: 35,
		keywords: ['חשבון', 'מתמטיקה 5', 'מתמטיקה 4', 'מתמטיקה 3', 'אלגברה', 'חדוא']
	},
	{
		id: 'english',
		name: 'אנגלית',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 5,
		allowedUnits: [3, 4, 5],
		bonus: 25,
		keywords: ['שפה זרה', 'אנגלית 5', 'אנגלית 4', 'אנגלית 3', 'f g e']
	},
	{
		id: 'hebrew',
		name: 'הבעה עברית',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [2, 3, 5],
		bonus: 0,
		keywords: ['לשון', 'דקדוק', 'חיבור', 'לשון והבעה']
	},
	{
		id: 'civics',
		name: 'אזרחות',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [1, 2, 5],
		bonus: 0,
		keywords: ['חוק ומשפט', 'דמוקרטיה', 'ממשל']
	},
	{
		id: 'history',
		name: 'היסטוריה / תע"י',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [2, 5],
		bonus: 0,
		keywords: ['תולדות עם ישראל', 'הסטוריה', 'ידע העם והמדינה', 'ציונות']
	},
	{
		id: 'literature',
		name: 'ספרות עברית',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [2, 5],
		bonus: 0,
		keywords: ['שירה', 'ספרות כללית', 'סיפור קצר']
	},
	{
		id: 'bible',
		name: 'תנ"ך',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [2, 3, 5],
		bonus: 0,
		keywords: ['תורה', 'מקרא', 'נביאים', 'כתובים']
	},
	{
		id: 'jewish_phil',
		name: 'מחשבת ישראל',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה / חמ"ד',
		defaultUnits: 2,
		allowedUnits: [2, 5],
		bonus: 0,
		keywords: ['פילוסופיה יהודית', 'חמד', 'יהדות']
	},
	{
		id: 'arabic_lang',
		name: 'לשון והבעה ערבית',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה (מגזר ערבי)',
		defaultUnits: 2,
		allowedUnits: [2, 3, 5],
		bonus: 0,
		keywords: ['ערבית', 'שפה ערבית', 'לשון ערבית']
	},

	// =========================================================
	// מקצועות מוגברים - מדעים, טכנולוגיה והנדסה (STEM)
	// =========================================================
	{
		id: 'physics',
		name: 'פיזיקה',
		category: 'stem',
		categoryLabel: 'מוגבר ריאלי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['פיסיקה', 'מכניקה', 'חשמל ומגנטיות', 'אופטיקה', 'קרינה וחומר']
	},
	{
		id: 'cs',
		name: 'מדעי המחשב',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['מחשבים', 'תכנות', 'מדמח', 'קוד', 'java', 'python', 'אלגוריתמים']
	},
	{
		id: 'chemistry',
		name: 'כימיה',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['מעבדה', 'כימיה אורגנית', 'חומרים', 'מולקולות']
	},
	{
		id: 'biology',
		name: 'ביולוגיה',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['מדעי החיים', 'מדעי הטבע', 'גנטיקה', 'אקולוגיה', 'תא']
	},
	{
		id: 'cyber',
		name: 'הגנת סייבר',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['סייבר', 'אבטחת מידע', 'רשתות תקשורת', 'תקיפה והגנה', 'קריפטוגרפיה']
	},
	{
		id: 'software_eng',
		name: 'מערכות תוכנה וחומרה',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['הנדסת תוכנה', 'הנדסת תכנה', 'פרויקט תוכנה', 'full stack']
	},
	{
		id: 'data_science',
		name: 'מדעי המידע והנתונים (Data Science)',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['data', 'דאטה', 'ביג דאטה', 'בינה מלאכותית', 'ai', 'ניתוח נתונים']
	},
	{
		id: 'electronics',
		name: 'אלקטרוניקה ומחשבים',
		category: 'stem',
		categoryLabel: 'מוגבר הנדסי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['אלקטרואופטיקה', 'מעגלים אלקטרוניים', 'חשמל', 'מיקרובקרים']
	},
	{
		id: 'biotech',
		name: 'ביוטכנולוגיה / מערכות ביוטכנולוגיה',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['ביוטק', 'הנדסה גנטית', 'ביו-רפואה', 'תרביות']
	},
	{
		id: 'engineering_sciences',
		name: 'מדעי ההנדסה',
		category: 'stem',
		categoryLabel: 'מוגבר הנדסי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['הנדסה', 'רובוטיקה מתקדמת', 'ביו-הנדסה']
	},
	{
		id: 'mechatronics',
		name: 'מכטרוניקה / בקרת מכונות',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['רובוטיקה', 'בקרה', 'מכונות', 'אוטומציה']
	},
	{
		id: 'medical_systems',
		name: 'מערכות רפואיות / מדעי הבריאות',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['רפואה', 'בריאות', 'קרדיולוגיה', 'רפואת חירום', 'אנטומיה']
	},
	{
		id: 'computational_science',
		name: 'מדע חישובי',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['מחשוב מדעי', 'אלגוריתמיקה', 'סימולציות']
	},
	{
		id: 'earth_sciences',
		name: 'מדעי כדור הארץ וגיאולוגיה',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['גיאולוגיה', 'אסטרונומיה', 'כדור הארץ', 'מדעי החלל']
	},
	{
		id: 'aerospace',
		name: 'מערכות תעופה וחלל',
		category: 'stem',
		categoryLabel: 'מוגבר הנדסי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['אווירונאוטיקה', 'חלל', 'מטוסים', 'טילים', 'תעופה']
	},
	{
		id: 'industrial_mgmt',
		name: 'הנדסת תעשייה וניהול (טכנולוגי)',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['תעשיה וניהול', 'מערכות מידע', 'חקר ביצועים']
	},
	{
		id: 'architecture',
		name: 'אדריכלות ובינוי ערים',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['הנדסת בניין', 'שרטוט', 'תכנון ערים', 'עיצוב פנים']
	},
	{
		id: 'environmental',
		name: 'מדעי הסביבה / לימודי הסביבה',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['אקולוגיה', 'קיימות', 'איכות הסביבה', 'משאבי טבע']
	},
	{
		id: 'agriculture',
		name: 'מדעי החקלאות ואגרוטק',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['חקלאות', 'אגרו-טק', 'מדעי הצמח', 'בוטניקה']
	},
	{
		id: 'mechanical_eng',
		name: 'הנדסת מכונות / מכונות',
		category: 'stem',
		categoryLabel: 'מוגבר הנדסי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['מכונות', 'חוזק חומרים', 'תרמודינמיקה', 'תכנון מכני']
	},
	{
		id: 'biomedical',
		name: 'ביו-רפואה ומכשור רפואי',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['ביו רפואה', 'הנדסה ביו-רפואית', 'מכשור רפואי', 'דיאגנוסטיקה']
	},
	{
		id: 'telecom',
		name: 'תקשורת אלקטרונית וטלקומוניקציה',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['תקשורת', 'גלים', 'אנטנות', 'טלקום', 'שידור']
	},
	{
		id: 'robotics',
		name: 'רובוטיקה ומערכות אוטונומיות',
		category: 'stem',
		categoryLabel: 'מוגבר הנדסי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['רובוטיקה', 'רובוטים', 'first robotics', 'בקרה', 'רחפנים', 'מערכות אוטונומיות']
	},
	{
		id: 'software_engineering_project',
		name: 'הנדסת תוכנה / פרויקט גמר תוכנה',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['הנדסת תוכנה', 'פרויקט תוכנה', 'מדמח 5', 'תכנות מתקדם', '10 יחל תוכנה']
	},

	// =========================================================
	// מקצועות מוגברים - מדעי החברה, ניהול ומשפטים
	// =========================================================
	{
		id: 'geography',
		name: 'גיאוגרפיה',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['גאוגרפיה', 'ארץ וסביבה', 'המזרח התיכון', 'אדם ומרחב']
	},
	{
		id: 'diplomacy',
		name: 'דיפלומטיה ויחסים בינלאומיים (באנגלית)',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['דיפלומטיה', 'יחבל', 'יחסים בינלאומיים', 'משא ומתן', 'שגרירות']
	},
	{
		id: 'economics_mgmt',
		name: 'כלכלה וניהול / כלכלה ומנהל עסקים',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['כלכלה', 'מנהל עסקים', 'שוק ההון', 'חשבונאות', 'שיווק']
	},
	{
		id: 'psychology_socio',
		name: 'פסיכולוגיה וסוציולוגיה (מדעי החברה)',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['סוציולוגיה', 'פסיכולוגיה', 'מדעי ההתנהגות']
	},
	{
		id: 'criminology_law',
		name: 'קרימינולוגיה ומשפטים',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['קרימינולוגיה', 'משפט עברי', 'חוק ומשפט', 'פשיעה']
	},
	{
		id: 'political_science',
		name: 'מדעי המדינה וממשל',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['פוליטיקה', 'ממשל', 'יחסים בינלאומיים', 'מדעי המדינה']
	},
	{
		id: 'communication',
		name: 'תקשורת וחברה / תקשורת המונים',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['עיתונות', 'מדיה', 'רדיו', 'טלוויזיה', 'ניו מדיה']
	},
	{
		id: 'land_of_israel',
		name: 'לימודי ארץ ישראל וארכיאולוגיה',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['שלח', 'ידיעת הארץ', 'ארכיאולוגיה', 'היסטוריה של א"י']
	},
	{
		id: 'social_sciences_combined',
		name: 'מדעי החברה (משולב סוציולוגיה ופסיכולוגיה)',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['מדעי החברה', 'סוציולוגיה', 'פסיכולוגיה', 'מדעי ההתנהגות']
	},
	{
		id: 'hr_mgmt',
		name: 'ניהול משאבי אנוש וארגון',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה וניהול',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['משאבי אנוש', 'כוח אדם', 'ניהול ארגוני', 'יחסי עבודה']
	},
	{
		id: 'business_mgmt',
		name: 'ניהול עסקי וחשבונאות',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה וניהול',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['חשבונאות', 'ניהול פיננסי', 'עסקים', 'ספרי חשבונות']
	},
	{
		id: 'law_adv',
		name: 'משפטים / מבוא למשפט ומשפט ציבורי',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה ומשפטים',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['משפטים', 'משפט', 'חוק ומשפט', 'משפט פלילי', 'משפט עברי', 'דיני עונשין', 'משפט חוקתי']
	},
	{
		id: 'entrepreneurship',
		name: 'יזמות עסקית וחדשנות / ניהול יזמות',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה וניהול',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['יזמות', 'סטארטאפ', 'חדשנות', 'ניהול עסקי', 'יזמות עסקית', 'יזמות חברתית']
	},
	{
		id: 'education_sciences',
		name: 'מדעי החינוך וההוראה / התפתחות הילד',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה וחינוך',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['חינוך', 'הוראה', 'פדגוגיה', 'מדעי החינוך', 'הגיל הרך', 'התפתחות הילד']
	},
	{
		id: 'sociology_adv',
		name: 'סוציולוגיה (מוגבר 5 יח"ל)',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['סוציולוגיה', 'חברה', 'מדעי החברה', 'סוציולוגיה 5']
	},
	{
		id: 'psychology_adv',
		name: 'פסיכולוגיה (מוגבר 5 יח"ל)',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['פסיכולוגיה', 'מדעי ההתנהגות', 'פסיכו', 'פסיכולוגיה 5']
	},
	{
		id: 'economics_adv',
		name: 'כלכלה (מוגבר 5 יח"ל)',
		category: 'social',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['כלכלה', 'שוק ההון', 'מיקרו כלכלה', 'מאקרו', 'כלכלה 5']
	},

	// =========================================================
	// מקצועות מוגברים - רוח, הומני ושפות זרות
	// =========================================================
	{
		id: 'literature_adv',
		name: 'ספרות עברית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['ספרות 5', 'ספרות מוגבר', 'ספרות מורחב', 'שירה ופרוזה']
	},
	{
		id: 'bible_adv',
		name: 'תנ"ך (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['תנך 5', 'מקרא מוגבר', 'תנ״ך מורחב', 'פרשנות']
	},
	{
		id: 'history_adv',
		name: 'היסטוריה (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['הסטוריה 5', 'תע"י מוגבר', 'היסטוריה מורחב', 'נושא מעמיק']
	},
	{
		id: 'civics_adv',
		name: 'אזרחות (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['אזרחות 5', 'אזרחות מורחב', 'משפט ציבורי']
	},
	{
		id: 'jewish_phil_adv',
		name: 'מחשבת ישראל (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר יהדות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['פילוסופיה יהודית מוגבר', 'רמבם', 'הגות יהודית']
	},
	{
		id: 'philosophy',
		name: 'פילוסופיה',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['פילוסופיה כללית', 'אתיקה', 'לוגיקה', 'תורת ההכרה']
	},
	{
		id: 'talmud',
		name: 'תושב"ע / תלמוד (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר יהדות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['הלכה', 'גמרא', 'משנה', 'תושבע']
	},
	{
		id: 'russian_adv',
		name: 'רוסית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['רוסית', 'שפה רוסית', 'russian', 'שפה זרה']
	},
	{
		id: 'arabic_adv',
		name: 'ערבית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['ערבית 5', 'ערבית מוגבר', 'מודיעין', 'מזרחנות']
	},
	{
		id: 'spanish_adv',
		name: 'ספרדית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['ספרדית', 'spanish', 'שפה ספרדית', 'אספניול']
	},
	{
		id: 'french_adv',
		name: 'צרפתית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['צרפתית', 'french', 'שפה צרפתית', 'פרנקופוניה']
	},
	{
		id: 'german_adv',
		name: 'גרמנית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['גרמנית', 'german', 'deutsch', 'שפה גרמנית']
	},
	{
		id: 'italian_adv',
		name: 'איטלקית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['איטלקית', 'italian', 'italiano', 'שפה איטלקית']
	},
	{
		id: 'chinese_adv',
		name: 'סינית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['סינית', 'chinese', 'מנדרינית', 'שפה סינית']
	},
	{
		id: 'amharic_adv',
		name: 'אמהרית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['אמהרית', 'שפה אמהרית', 'אתיופיה']
	},
	{
		id: 'middle_east_studies',
		name: 'לימודי המזרח התיכון והאסלאם / מזרחנות',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני / מזרחנות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['מזרחנות', 'המזרח התיכון', 'אסלאם', 'עולם הערבים והאסלאם', 'חמן', 'מודיעין', 'תרבות האסלאם', 'ערבית ומזרחנות']
	},
	{
		id: 'arabic_lit_adv',
		name: 'ספרות ערבית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני ושפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['ספרות ערבית', 'שירה ערבית', 'אדב ערבי', 'מגזר ערבי']
	},
	{
		id: 'druze_heritage',
		name: 'מורשת דרוזית / תולדות העדה הדרוזית',
		category: 'humanities',
		categoryLabel: 'מוגבר מורשת והיסטוריה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['דרוזים', 'מורשת דרוזית', 'העדה הדרוזית']
	},
	{
		id: 'islam_heritage',
		name: 'דת ומורשת האסלאם',
		category: 'humanities',
		categoryLabel: 'מוגבר מורשת ודתות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['אסלאם', 'דת האסלאם', 'קוראן', 'שריעה', 'מורשת האסלאם']
	},
	{
		id: 'christian_heritage',
		name: 'דת ומורשת הנצרות',
		category: 'humanities',
		categoryLabel: 'מוגבר מורשת ודתות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['נצרות', 'דת הנצרות', 'ברית חדשה', 'מורשת הנצרות']
	},
	{
		id: 'japanese_adv',
		name: 'יפנית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['יפנית', 'japanese', 'שפה יפנית', 'יפן']
	},
	{
		id: 'turkish_adv',
		name: 'טורקית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['טורקית', 'turkish', 'שפה טורקית', 'טורקיה']
	},
	{
		id: 'halacha_adv',
		name: 'הלכה ומשפט עברי (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר יהדות / חמ"ד',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['הלכה', 'דינים', 'משפט עברי', 'חמד', 'תושבע']
	},
	{
		id: 'bible_hamad_5u',
		name: 'תנ"ך חמ"ד (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר יהדות / חמ"ד',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 25,
		keywords: ['תנך חמד', 'תנ״ך חמ״ד', 'מקרא חמד', 'חמד']
	},

	// =========================================================
	// מקצועות מוגברים - אמנויות, עיצוב ומחול
	// =========================================================
	{
		id: 'art',
		name: 'אמנות חזותית / תולדות האמנות',
		category: 'arts',
		categoryLabel: 'מוגבר אמנויות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['ציור', 'פיסול', 'תולדות האומנות', 'אמנות פלסטית']
	},
	{
		id: 'graphic_design',
		name: 'עיצוב גרפי / תקשורת חזותית',
		category: 'arts',
		categoryLabel: 'מוגבר אמנויות ועיצוב',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['עיצוב', 'גרפיקה', 'תקשורת חזותית', 'מיתוג', 'טיפוגרפיה']
	},
	{
		id: 'cinema',
		name: 'קולנוע ומדיה / תקשורת וקולנוע',
		category: 'arts',
		categoryLabel: 'מוגבר אמנויות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['קולנוע', 'צילום', 'בימוי', 'תסריטאות', 'הפקה']
	},
	{
		id: 'photography',
		name: 'צילום ומדיה דיגיטלית',
		category: 'arts',
		categoryLabel: 'מוגבר אמנויות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['צילום', 'מצלמה', 'צילום סטילס', 'פוטושופ']
	},
	{
		id: 'theatre',
		name: 'תיאטרון / ספרות התיאטרון',
		category: 'arts',
		categoryLabel: 'מוגבר אמנויות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['משחק', 'דרמה', 'תאטרון', 'בימוי תיאטרון']
	},
	{
		id: 'music',
		name: 'מוזיקה / רסיטל מוזיקה',
		category: 'arts',
		categoryLabel: 'מוגבר אמנויות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['נגינה', 'קומפוזיציה', 'תורת המוזיקה', 'פסנתר', 'רסיטל']
	},
	{
		id: 'dance',
		name: 'מחול / רסיטל מחול',
		category: 'arts',
		categoryLabel: 'מוגבר אמנויות',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		isPopularElective: true,
		keywords: ['ריקוד', 'כוריאוגרפיה', 'בלט', 'מחול מודרני', 'רסיטל מחול']
	},
	{
		id: 'product_design',
		name: 'עיצוב מוצר ותעשייתי',
		category: 'arts',
		categoryLabel: 'מוגבר אמנויות ועיצוב',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['עיצוב מוצר', 'עיצוב תעשייתי', 'מידול', 'הדפסה תלת ממדית']
	},
	{
		id: 'fashion_design',
		name: 'עיצוב אופנה ותלבושות',
		category: 'arts',
		categoryLabel: 'מוגבר אמנויות ועיצוב',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['אופנה', 'תפירה', 'סטיילינג', 'תדמיתנות', 'עיצוב בגדים']
	},
	{
		id: 'radio_broadcasting',
		name: 'תקשורת ורדיו / אמנות השידור',
		category: 'arts',
		categoryLabel: 'מוגבר אמנויות ומדיה',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['רדיו', 'שידור', 'פודקאסט', 'תקשורת ורדיו', 'אולפן שידור']
	},

	// =========================================================
	// עבודות גמר ומקצועות נוספים
	// =========================================================
	{
		id: 'pe_adv',
		name: 'חינוך גופני (מוגבר 5 יח"ל)',
		category: 'other',
		categoryLabel: 'מוגבר כללי',
		defaultUnits: 5,
		allowedUnits: [5],
		bonus: 20,
		keywords: ['ספורט', 'כושר גופני', 'אתלטיקה', 'פיזיולוגיה של המאמץ']
	},
	{
		id: 'final_project',
		name: 'עבודת גמר מחקרית (5 יח"ל)',
		category: 'other',
		categoryLabel: 'עבודת גמר מחקרית',
		defaultUnits: 5,
		allowedUnits: [4, 5],
		bonus: 25,
		isPopularElective: true,
		keywords: ['פרויקט', 'מחקר', 'עבודה', 'מכון ויצמן', 'עבודת גמר']
	}
];
