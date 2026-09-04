export interface BagrutSubjectOption {
	id: string;
	name: string;
	category: 'mandatory' | 'stem' | 'humanities' | 'other';
	categoryLabel: string;
	defaultUnits: number;
	allowedUnits: number[];
	keywords?: string[];
}

export const BAGRUT_SUBJECTS_CATALOG: BagrutSubjectOption[] = [
	// מקצועות חובה
	{
		id: 'math',
		name: 'מתמטיקה',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 5,
		allowedUnits: [3, 4, 5],
		keywords: ['חשבון', '5 יחל', '4 יחל', '3 יחל']
	},
	{
		id: 'english',
		name: 'אנגלית',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 5,
		allowedUnits: [3, 4, 5],
		keywords: ['שפה זרה', '5 יחל', '4 יחל']
	},
	{
		id: 'hebrew',
		name: 'הבעה עברית',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [2, 3, 5],
		keywords: ['לשון', 'דקדוק', 'חיבור']
	},
	{
		id: 'civics',
		name: 'אזרחות',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [1, 2, 5],
		keywords: ['חוק ומשפט', 'דמוקרטיה']
	},
	{
		id: 'history',
		name: 'היסטוריה / תע"י',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [2, 5],
		keywords: ['תולדות עם ישראל', 'הסטוריה', 'ידע העם והמדינה']
	},
	{
		id: 'literature',
		name: 'ספרות עברית',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [2, 5],
		keywords: ['שירה', 'ספרות כללית']
	},
	{
		id: 'bible',
		name: 'תנ"ך',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [2, 3, 5],
		keywords: ['תורה', 'מקרא']
	},
	{
		id: 'jewish_phil',
		name: 'מחשבת ישראל',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה / חמ"ד',
		defaultUnits: 2,
		allowedUnits: [2, 5],
		keywords: ['פילוסופיה יהודית', 'חמד']
	},
	{
		id: 'arabic_lang',
		name: 'לשון והבעה ערבית',
		category: 'mandatory',
		categoryLabel: 'מקצוע חובה',
		defaultUnits: 2,
		allowedUnits: [2, 3, 5],
		keywords: ['ערבית', 'שפה ערבית']
	},

	// מקצועות מוגברים - מדעים, טכנולוגיה והנדסה (STEM)
	{
		id: 'physics',
		name: 'פיזיקה',
		category: 'stem',
		categoryLabel: 'מוגבר ריאלי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['פיסיקה', 'מכניקה', 'חשמל']
	},
	{
		id: 'cs',
		name: 'מדעי המחשב',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['מחשבים', 'תכנות', 'מדמח', 'קוד']
	},
	{
		id: 'chemistry',
		name: 'כימיה',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['מעבדה', 'כימיה טכנולוגית']
	},
	{
		id: 'biology',
		name: 'ביולוגיה',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['מדעי החיים', 'מדעי הטבע', 'מיקרוביולוגיה']
	},
	{
		id: 'software_eng',
		name: 'מערכות תוכנה וחומרה',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['הנדסת תוכנה', 'הנדסת תכנה', 'תכנון מערכות']
	},
	{
		id: 'cyber',
		name: 'הגנת סייבר',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['סייבר', 'אבטחת מידע', 'רשתות']
	},
	{
		id: 'electronics',
		name: 'אלקטרוניקה ומחשבים',
		category: 'stem',
		categoryLabel: 'מוגבר הנדסי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['אלקטרואופטיקה', 'מעגלים', 'חשמל']
	},
	{
		id: 'biotech',
		name: 'ביוטכנולוגיה / מערכות ביוטכנולוגיה',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['ביוטק', 'הנדסה ביו-רפואית']
	},
	{
		id: 'engineering_sciences',
		name: 'מדעי ההנדסה',
		category: 'stem',
		categoryLabel: 'מוגבר הנדסי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['הנדסה', 'רובוטיקה']
	},
	{
		id: 'mechatronics',
		name: 'מכטרוניקה / בקרת מכונות',
		category: 'stem',
		categoryLabel: 'מוגבר טכנולוגי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['רובוטיקה', 'בקרה', 'מכונות']
	},
	{
		id: 'medical_systems',
		name: 'מערכות רפואיות / מדעי הבריאות',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['רפואה', 'בריאות']
	},
	{
		id: 'computational_science',
		name: 'מדע חישובי',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['מחשוב מדעי', 'אלגוריתמיקה']
	},
	{
		id: 'environmental',
		name: 'מדעי הסביבה / לימודי הסביבה',
		category: 'stem',
		categoryLabel: 'מוגבר מדעי / STEM',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['אקולוגיה', 'קיימות']
	},

	// מקצועות מוגברים - מדעי הרוח, החברה ואמנויות
	{
		id: 'social_sciences',
		name: 'מדעי החברה (כלכלה / פסיכולוגיה / סוציולוגיה)',
		category: 'humanities',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['סוציולוגיה', 'פסיכולוגיה', 'כלכלה', 'מדעי המדינה']
	},
	{
		id: 'geography',
		name: 'גיאוגרפיה',
		category: 'humanities',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['גאוגרפיה', 'ארץ וסביבה']
	},
	{
		id: 'communication',
		name: 'תקשורת וחברה / תקשורת המונים',
		category: 'humanities',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['עיתונות', 'מדיה', 'רדיו', 'טלוויזיה']
	},
	{
		id: 'philosophy',
		name: 'פילוסופיה',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['פילוסופיה כללית', 'אתיקה']
	},
	{
		id: 'history_adv',
		name: 'היסטוריה (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['הסטוריה 5', 'תע"י מוגבר']
	},
	{
		id: 'literature_adv',
		name: 'ספרות עברית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['ספרות 5', 'ספרות מוגבר']
	},
	{
		id: 'bible_adv',
		name: 'תנ"ך (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר הומני',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['תנך 5', 'מקרא מוגבר']
	},
	{
		id: 'arabic_adv',
		name: 'ערבית (מוגבר 5 יח"ל)',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['ערבית 5', 'שפה זרה']
	},
	{
		id: 'french',
		name: 'צרפתית / שפה זרה',
		category: 'humanities',
		categoryLabel: 'מוגבר שפות',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['ספרדית', 'גרמנית', 'רוסית', 'איטלקית']
	},
	{
		id: 'art',
		name: 'אמנות חזותית / תולדות האמנות',
		category: 'humanities',
		categoryLabel: 'מוגבר אמנויות',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['ציור', 'פיסול', 'תולדות האומנות']
	},
	{
		id: 'music',
		name: 'מוזיקה / מוזיקה רסיטל',
		category: 'humanities',
		categoryLabel: 'מוגבר אמנויות',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['נגינה', 'קומפוזיציה', 'תורת המוזיקה']
	},
	{
		id: 'theatre',
		name: 'תיאטרון / ספרות התיאטרון',
		category: 'humanities',
		categoryLabel: 'מוגבר אמנויות',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['משחק', 'דרמה', 'תאטרון']
	},
	{
		id: 'cinema',
		name: 'קולנוע ומדיה',
		category: 'humanities',
		categoryLabel: 'מוגבר אמנויות',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['קולנוע', 'צילום', 'בימוי']
	},
	{
		id: 'land_of_israel',
		name: 'לימודי ארץ ישראל',
		category: 'humanities',
		categoryLabel: 'מוגבר מדעי החברה',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['שלח', 'ידיעת הארץ']
	},
	{
		id: 'talmud',
		name: 'תושב"ע / תלמוד',
		category: 'humanities',
		categoryLabel: 'מוגבר יהדות',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['הלכה', 'גמרא', 'משנה']
	},
	{
		id: 'pe_adv',
		name: 'חינוך גופני (מוגבר 5 יח"ל)',
		category: 'other',
		categoryLabel: 'מוגבר כללי',
		defaultUnits: 5,
		allowedUnits: [5],
		keywords: ['ספורט', 'כושר', 'אתלטיקה']
	},
	{
		id: 'final_project',
		name: 'עבודת גמר מחקרית (ע"ג 5 יח"ל)',
		category: 'other',
		categoryLabel: 'עבודת גמר',
		defaultUnits: 5,
		allowedUnits: [4, 5],
		keywords: ['פרויקט', 'מחקר', 'עבודה']
	}
];
