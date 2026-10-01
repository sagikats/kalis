/**
 * Institutional Bonus Helper
 * Computes, explains, and provides institutional variance for matriculation bonuses across all 8 Israeli universities.
 */

import {
	getTechnionBonus,
	getTauBonus,
	getHujiBonus,
	getBguBonus,
	getBarIlanBonus,
	getHaifaBonus,
	getArielBonus,
	getReichmanBonus,
	CalculatorSubject,
	InstitutionId
} from '@/modules/calculators';

export interface SubjectBonusSummary {
	badgeLabel: string;
	detailedNote?: string;
	hasVariance: boolean;
	minBonus: number;
	maxBonus: number;
	byInstitution: Record<InstitutionId, number>;
}

export const INSTITUTION_HEBREW_NAMES: Record<InstitutionId, string> = {
	technion: 'הטכניון',
	tau: 'תל אביב',
	huji: 'העברית',
	bgu: 'בן-גוריון',
	bar_ilan: 'בר-אילן',
	haifa: 'חיפה',
	ariel: 'אריאל',
	reichman: 'רייכמן'
};

/**
 * Returns the exact institutional bonus for a subject in a specific university.
 */
export function getBonusForInstitution(
	subjectName: string,
	units: number,
	grade: number = 85,
	institutionId: InstitutionId
): number {
	const sub: CalculatorSubject = {
		name: subjectName,
		units,
		grade
	};

	switch (institutionId) {
		case 'technion':
			return getTechnionBonus(sub, false);
		case 'tau':
			return getTauBonus(sub);
		case 'huji':
			return getHujiBonus(sub);
		case 'bgu':
			return getBguBonus(sub);
		case 'bar_ilan':
			return getBarIlanBonus(sub);
		case 'haifa':
			return getHaifaBonus(sub);
		case 'ariel':
			return getArielBonus(sub);
		case 'reichman':
			return getReichmanBonus(sub);
		default:
			return 20;
	}
}

/**
 * Evaluates the bonus across all 8 universities and builds an accurate, contextual summary.
 */
export function getSubjectBonusSummary(
	subjectName: string,
	units: number = 5,
	activeInstitutionId?: InstitutionId
): SubjectBonusSummary {
	const cleanName = subjectName.trim();
	const sub: CalculatorSubject = { name: cleanName, units, grade: 85 };

	const byInstitution: Record<InstitutionId, number> = {
		technion: getTechnionBonus(sub, false),
		tau: getTauBonus(sub),
		huji: getHujiBonus(sub),
		bgu: getBguBonus(sub),
		bar_ilan: getBarIlanBonus(sub),
		haifa: getHaifaBonus(sub),
		ariel: getArielBonus(sub),
		reichman: getReichmanBonus(sub)
	};

	const bonuses = Object.values(byInstitution);
	const minBonus = Math.min(...bonuses);
	const maxBonus = Math.max(...bonuses);
	const hasVariance = minBonus !== maxBonus;

	// If calculating for a specific institution
	if (activeInstitutionId && byInstitution[activeInstitutionId] !== undefined) {
		const instBonus = byInstitution[activeInstitutionId];
		const instName = INSTITUTION_HEBREW_NAMES[activeInstitutionId];
		return {
			badgeLabel: `בונוס +${instBonus} ב${instName}`,
			hasVariance,
			minBonus,
			maxBonus,
			byInstitution
		};
	}

	// Tailored high-accuracy labels for distinct subject archetypes
	if (cleanName.includes('מתמטיקה')) {
		if (units === 5) {
			return {
				badgeLabel: 'בונוס +35 (בטכניון: משקל כפול x2 ובונוס +30)',
				detailedNote: 'ברוב האוניברסיטאות +35 נקודות. בטכניון נחשב כ-10 יחידות לימוד עם בונוס של +30 נקודות.',
				hasVariance: true,
				minBonus: 30,
				maxBonus: 35,
				byInstitution
			};
		}
		if (units === 4) {
			return {
				badgeLabel: 'בונוס +10 עד +15',
				detailedNote: 'בעברית, בן-גוריון, חיפה ואריאל: +15 | בתל אביב, בר-אילן ורייכמן: +12.5 | בטכניון: +10.',
				hasVariance: true,
				minBonus: 10,
				maxBonus: 15,
				byInstitution
			};
		}
	}

	if (cleanName.includes('אנגלית')) {
		if (units === 5) {
			return {
				badgeLabel: 'בונוס +25 בכל המוסדות',
				hasVariance: false,
				minBonus: 25,
				maxBonus: 25,
				byInstitution
			};
		}
		if (units === 4) {
			return {
				badgeLabel: 'בונוס +10 עד +12.5',
				detailedNote: 'ברוב האוניברסיטאות +12.5, בטכניון +10.',
				hasVariance: true,
				minBonus: 10,
				maxBonus: 12.5,
				byInstitution
			};
		}
	}

	// STEM 5 units
	const isStem5 =
		units >= 5 &&
		(cleanName.includes('פיזיקה') ||
			cleanName.includes('מדעי המחשב') ||
			cleanName.includes('כימיה') ||
			cleanName.includes('ביולוגיה') ||
			cleanName.includes('סייבר') ||
			cleanName.includes('תוכנה') ||
			cleanName.includes('תכנות') ||
			cleanName.includes('אלקטרוניקה') ||
			cleanName.includes('רובוטיקה') ||
			cleanName.includes('ביוטכנולוגיה'));

	if (isStem5) {
		return {
			badgeLabel: 'בונוס +25 (בטכניון: עד +30 במקבץ מדעי)',
			detailedNote:
				'ב-7 אוניברסיטאות מזכה בבונוס מרבי של +25 נקודות. בטכניון: מזכה ב-+30 נקודות כאשר נלמד יחד עם מתמטיקה 5 ומקצוע מדעי/טכנולוגי נוסף (מקבץ מדעי).',
			hasVariance: true,
			minBonus: 25,
			maxBonus: 30,
			byInstitution
		};
	}

	// Jewish Studies 5 units (Special Bar-Ilan Heritage bonus)
	const isJewishStudies5 =
		units >= 5 &&
		(cleanName.includes('מחשבת ישראל') ||
			cleanName.includes('תושב"ע') ||
			cleanName.includes('תושבע') ||
			cleanName.includes('הלכה') ||
			cleanName.includes('תלמוד'));

	if (isJewishStudies5) {
		return {
			badgeLabel: 'בונוס +25 בבר-אילן (+20 בשאר המוסדות)',
			detailedNote:
				'באוניברסיטת בר-אילן מזכה בבונוס מוגבר של +25 נקודות (לימודי יסוד ביהדות). בשאר 7 האוניברסיטאות מזכה ב-+20 נקודות.',
			hasVariance: true,
			minBonus: 20,
			maxBonus: 25,
			byInstitution
		};
	}

	// Civics 5 units (Special BGU bonus)
	if (units >= 5 && cleanName.includes('אזרחות')) {
		return {
			badgeLabel: 'בונוס +25 בבן-גוריון (+20 בשאר המוסדות)',
			detailedNote:
				'באוניברסיטת בן-גוריון אזרחות 5 יח״ל מזכה בבונוס מרבי של +25 נקודות. בשאר האוניברסיטאות מזכה ב-+20 נקודות.',
			hasVariance: true,
			minBonus: 20,
			maxBonus: 25,
			byInstitution
		};
	}

	// Core Humanities 5 units (Literature, Bible, History, Arabic, Middle East Studies)
	const isCoreHumanities5 =
		units >= 5 &&
		(cleanName.includes('ספרות') ||
			cleanName.includes('תנ"ך') ||
			cleanName.includes('תנ״ך') ||
			cleanName.includes('היסטוריה') ||
			cleanName.includes('תע"י') ||
			cleanName.includes('ערבית') ||
			cleanName.includes('מזרחנות') ||
			cleanName.includes('המזרח התיכון'));

	if (isCoreHumanities5) {
		return {
			badgeLabel: 'בונוס +25 (ברוב המוסדות)',
			detailedNote:
				'בתל אביב, העברית, בן-גוריון, בר-אילן, חיפה ואריאל מזכה ב-+25 נקודות בונוס. ברייכמן ובטכניון (ללא מקצוע מדעי) מזכה ב-+20–25 נקודות.',
			hasVariance: true,
			minBonus: 20,
			maxBonus: 25,
			byInstitution
		};
	}

	// General 5-unit electives (Geography, Diplomacy, Social Sciences, Arts, etc.)
	if (units >= 5) {
		return {
			badgeLabel: 'בונוס +20 בכל 8 האוניברסיטאות',
			detailedNote: 'כל מקצוע בחירה ברמת 5 יחידות לימוד מוכר מזכה בתוספת 20 נקודות לציון הבגרות בכל האוניברסיטאות בישראל.',
			hasVariance: false,
			minBonus: 20,
			maxBonus: 20,
			byInstitution
		};
	}

	return {
		badgeLabel: maxBonus > 0 ? `בונוס +${maxBonus}` : 'ללא בונוס',
		hasVariance,
		minBonus,
		maxBonus,
		byInstitution
	};
}
