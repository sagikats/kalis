/**
 * University Registration Links Directory
 * Provides official direct registration and candidate portal URLs for academic institutions in Israel.
 */

export interface UniversityRegistrationInfo {
	institutionName: string;
	registrationUrl: string;
	portalName: string;
	tips: string;
}

export function getUniversityRegistrationInfo(
	institutionName: string,
	calculatorId?: string,
	programUrl?: string
): UniversityRegistrationInfo {
	const lower = (institutionName || '').toLowerCase();

	// 1. Tel Aviv University
	if (calculatorId === 'tau' || lower.includes('תל אביב') || lower.includes('את"א')) {
		return {
			institutionName: 'אוניברסיטת תל אביב',
			registrationUrl: 'https://admissions.tau.ac.il/',
			portalName: 'פורטל ההרשמה והמועמדים של אוניברסיטת תל אביב',
			tips: 'ההרשמה לשנת הלימודים מתבצעת באופן מקוון. מומלץ להצטייד בצילום תעודת זהות ופרטי תשלום מקדמה.'
		};
	}

	// 2. Technion
	if (calculatorId === 'technion' || lower.includes('טכניון')) {
		return {
			institutionName: 'הטכניון - מכון טכנולוגי לישראל',
			registrationUrl: 'https://admissions.technion.ac.il/candidate-portal/',
			portalName: 'מרכז רישום וקבלת מועמדים בטכניון',
			tips: 'בטכניון מומלץ לבדוק במקביל את מעמד הפטור ממבחן סיווג במתמטיקה ובפיזיקה.'
		};
	}

	// 3. Ben-Gurion University
	if (calculatorId === 'bgu' || lower.includes('בן גוריון') || lower.includes('בן-גוריון')) {
		return {
			institutionName: 'אוניברסיטת בן-גוריון בנגב',
			registrationUrl: 'https://www.bgu.ac.il/welcome/ba/reception-section-lobby/',
			portalName: 'מדור רישום וקבלה של אוניברסיטת בן-גוריון',
			tips: 'באוניברסיטת בן-גוריון תוכל לעקוב אחרי קליטת ציוני הבגרות והפסיכומטרי בפורטל BGU4U.'
		};
	}

	// 4. Hebrew University
	if (calculatorId === 'huji' || lower.includes('עברית')) {
		return {
			institutionName: 'האוניברסיטה העברית בירושלים',
			registrationUrl: 'https://info.huji.ac.il/bachelor/registration',
			portalName: 'מערכת הרישום לתואר ראשון - האוניברסיטה העברית',
			tips: 'ההרשמה פתוחה לעדיפות ראשונה ושנייה. הקבלה מאושרת רשמית עם הגשת כלל המסמכים.'
		};
	}

	// 5. University of Haifa
	if (calculatorId === 'haifa' || lower.includes('חיפה')) {
		return {
			institutionName: 'אוניברסיטת חיפה',
			registrationUrl: 'https://admissions.haifa.ac.il/',
			portalName: 'פורטל ההרשמה של אוניברסיטת חיפה',
			tips: 'ההרשמה מתבצעת ישירות דרך אתר האוניברסיטה עם בדיקת זכאות מיידית למלגות קבלה.'
		};
	}

	// 6. Ariel University
	if (calculatorId === 'ariel' || lower.includes('אריאל')) {
		return {
			institutionName: 'אוניברסיטת אריאל בשומרון',
			registrationUrl: 'https://www.ariel.ac.il/wp/registration/',
			portalName: 'מרכז הרישום והמידע - אוניברסיטת אריאל',
			tips: 'אוניברסיטת אריאל מציעה תהליך הרשמה דיגיטלי מזורז וליווי אישי מיועץ לימודים.'
		};
	}

	// 7. Bar-Ilan University
	if (calculatorId === 'bar_ilan' || lower.includes('בר אילן') || lower.includes('בר-אילן')) {
		return {
			institutionName: 'אוניברסיטת בר-אילן',
			registrationUrl: 'https://www.biu.ac.il/admissions/bachelor',
			portalName: 'מרכז שירות וגיוס מועמדים - אוניברסיטת בר-אילן',
			tips: 'ההרשמה המקוונת כוללת בדיקה אוטומטית של זכאות לשילובים בין-תחומיים ולימודי יהדות.'
		};
	}

	// 8. Reichman University
	if (calculatorId === 'reichman' || lower.includes('רייכמן') || lower.includes('בינתחומי')) {
		return {
			institutionName: 'אוניברסיטת רייכמן',
			registrationUrl: 'https://www.runi.ac.il/admissions/undergraduate/',
			portalName: 'פורטל ההרשמה והמועמדים - אוניברסיטת רייכמן',
			tips: 'ההרשמה לרייכמן כוללת בדיקת זכאות מיידית למסלול קבלה ישיר על בסיס בגרות ומלגות הצטיינות.'
		};
	}

	// 8. Open University
	if (lower.includes('הפתוחה')) {
		return {
			institutionName: 'האוניברסיטה הפתוחה',
			registrationUrl: 'https://www.openu.ac.il/registration/',
			portalName: 'רישום מקוון לקורסים ותארים - האוניברסיטה הפתוחה',
			tips: 'באוניברסיטה הפתוחה אין תנאי קבלה מוקדמים וניתן להירשם ישירות לסמסטר הקרוב.'
		};
	}

	// 9. College of Management / Academic colleges fallback
	if (programUrl && programUrl.startsWith('http')) {
		return {
			institutionName,
			registrationUrl: programUrl,
			portalName: `עמוד המידע והרישום הרשמי ב-${institutionName}`,
			tips: 'ההרשמה מתבצעת באתר המוסד. מומלץ לבדוק את מועדי סגירת ההרשמה לשנת הלימודים.'
		};
	}

	return {
		institutionName,
		registrationUrl: 'https://admissions.tau.ac.il/',
		portalName: `פורטל הרישום והקבלה הרשמי של ${institutionName}`,
		tips: 'ההרשמה המקוונת נפתחת בחודשי החורף. מומלץ להקדים הרשמה כדי להבטיח מקום בחוג.'
	};
}

// ---------------------------------------------------------------------------
// Mechina (Pre-Academic) Registration Links & Portals
// ---------------------------------------------------------------------------

export interface MechinaRegistrationInfo {
	institutionId: string;
	institutionName: string;
	mechinaName: string;
	registrationUrl: string;
	portalName: string;
	tips: string;
}

export function getMechinaRegistrationInfo(
	institutionId: string,
	institutionName?: string
): MechinaRegistrationInfo {
	const lower = (institutionId || institutionName || '').toLowerCase();

	// 1. Technion Mechina
	if (lower.includes('technion') || lower.includes('טכניון')) {
		return {
			institutionId: 'technion',
			institutionName: 'הטכניון - מכון טכנולוגי לישראל',
			mechinaName: 'המכינה הקדם-אקדמית של הטכניון',
			registrationUrl: 'https://kdam.technion.ac.il/',
			portalName: 'פורטל המרכז ללימודים קדם אקדמיים בטכניון',
			tips: 'ההרשמה למכינה מתבצעת באופן מקוון. תעודת גמר המכינה מחליפה את ממוצע הבגרות ומעניקה פטור ממבחני סיווג במתמטיקה ופיזיקה.'
		};
	}

	// 2. Tel Aviv University Mechina (Joint with Bar-Ilan)
	if (lower.includes('tau') || lower.includes('תל אביב') || lower.includes('את"א')) {
		return {
			institutionId: 'tau',
			institutionName: 'אוניברסיטת תל אביב',
			mechinaName: 'המכינה הקדם-אקדמית (תל אביב ובר-אילן)',
			registrationUrl: 'https://mechina-kda.biu.ac.il/',
			portalName: 'מערכת הרישום למכינה הקדם-אקדמית (תל-אביב ובר-אילן)',
			tips: 'המכינה המשותפת מוכרת רשמית באוניברסיטת תל אביב ומאפשרת קבלה לכלל הפקולטות על בסיס ציוני הגמר.'
		};
	}

	// 3. Hebrew University Mechina
	if (lower.includes('huji') || lower.includes('עברית')) {
		return {
			institutionId: 'huji',
			institutionName: 'האוניברסיטה העברית בירושלים',
			mechinaName: 'המכינה האוניברסיטאית של האוניברסיטה העברית',
			registrationUrl: 'https://mechina.huji.ac.il/',
			portalName: 'מערכת ההרשמה למכינה - האוניברסיטה העברית',
			tips: 'המכינה בהר הצופים מציעה מסלולי מדעי הטבע והמחשב ומדעי הרוח והחברה עם ליווי אקדמי מלא.'
		};
	}

	// 4. Ben-Gurion University Mechina
	if (lower.includes('bgu') || lower.includes('בן גוריון') || lower.includes('בן-גוריון')) {
		return {
			institutionId: 'bgu',
			institutionName: 'אוניברסיטת בן-גוריון בנגב',
			mechinaName: 'המרכז ללימודים קדם-אקדמיים באוניברסיטת בן-גוריון',
			registrationUrl: 'https://in.bgu.ac.il/pages/academic/pre-academic.aspx',
			portalName: 'אתר ההרשמה ללימודים קדם-אקדמיים - בן-גוריון',
			tips: 'המכינה מציעה מסלול מדעים והנדסה ייעודי המקנה קבלה ישירה לפקולטות המובילות בבאר שבע.'
		};
	}

	// 5. University of Haifa Mechina
	if (lower.includes('haifa') || lower.includes('חיפה')) {
		return {
			institutionId: 'haifa',
			institutionName: 'אוניברסיטת חיפה',
			mechinaName: 'המכינה האוניברסיטאית של אוניברסיטת חיפה',
			registrationUrl: 'https://mechina.haifa.ac.il/',
			portalName: 'פורטל ההרשמה למכינה - אוניברסיטת חיפה',
			tips: 'הרשמה דיגיטלית מהירה עם זכאות למלגות שכר לימוד וקיום עבור מועמדים זכאים.'
		};
	}

	// 6. Ariel University Mechina
	if (lower.includes('ariel') || lower.includes('אריאל')) {
		return {
			institutionId: 'ariel',
			institutionName: 'אוניברסיטת אריאל בשומרון',
			mechinaName: 'המכינה הקדם-אקדמית של אוניברסיטת אריאל',
			registrationUrl: 'https://www.ariel.ac.il/wp/mechina/',
			portalName: 'מרכז הרישום למכינות - אוניברסיטת אריאל',
			tips: 'מכינה להנדסה ומדעי המחשב ומסלול מקוצר למדעי החברה בהתאם לרפורמת המכינות.'
		};
	}

	// 7. Bar-Ilan University Mechina
	if (lower.includes('bar_ilan') || lower.includes('בר אילן') || lower.includes('בר-אילן')) {
		return {
			institutionId: 'bar_ilan',
			institutionName: 'אוניברסיטת בר-אילן',
			mechinaName: 'המכינה הקדם-אקדמית ע"ש קרטר - אוניברסיטת בר-אילן',
			registrationUrl: 'https://mechina-kda.biu.ac.il/',
			portalName: 'פורטל ההרשמה למכינה ע״ש קרטר בבר-אילן',
			tips: 'תעודת גמר המכינה מקנה קבלה ישירה לבר-אילן ללא תלות בציוני העבר.'
		};
	}

	// 8. Reichman University Pre-Academic
	if (lower.includes('reichman') || lower.includes('רייכמן') || lower.includes('בינתחומי')) {
		return {
			institutionId: 'reichman',
			institutionName: 'אוניברסיטת רייכמן',
			mechinaName: 'מרכז הרישום והתוכניות הקדם-אקדמיות באוניברסיטת רייכמן',
			registrationUrl: 'https://www.runi.ac.il/he/admissions/pages/admissions.aspx',
			portalName: 'פורטל ההרשמה והמועמדים - אוניברסיטת רייכמן',
			tips: 'רייכמן מציעה מכינות ממוקדות וקורסי קדם ייעודיים לקראת שנת הלימודים.'
		};
	}

	return {
		institutionId: institutionId || 'generic',
		institutionName: institutionName || 'המוסד האקדמי',
		mechinaName: `המכינה הקדם-אקדמית (${institutionName || institutionId})`,
		registrationUrl: 'https://kdam.technion.ac.il/',
		portalName: 'פורטל ההרשמה למכינה הקדם-אקדמית',
		tips: 'מומלץ להירשם ישירות באתר המכינה ולבדוק זכאות למלגות שכר לימוד וקיום מהקרן לקליטת חיילים משוחררים.'
	};
}

export function getMechinaRegistrationUrl(institutionId: string, institutionName?: string): string {
	return getMechinaRegistrationInfo(institutionId, institutionName).registrationUrl;
}

// ---------------------------------------------------------------------------
// Open University Transition Route (אפיקי מעבר מהאוניברסיטה הפתוחה)
// ---------------------------------------------------------------------------

export interface AfikMaavarRegistrationInfo {
	institutionId: string;
	institutionName: string;
	registrationUrl: string;
	infoUrl: string;
	portalName: string;
	tips: string;
}

export function getAfikMaavarRegistrationInfo(
	targetInstitutionId?: string,
	targetInstitutionName?: string
): AfikMaavarRegistrationInfo {
	return {
		institutionId: targetInstitutionId || 'openu',
		institutionName: targetInstitutionName || 'האוניברסיטה הפתוחה',
		registrationUrl: 'https://www.openu.ac.il/registration/',
		infoUrl: 'https://www.openu.ac.il/transfer/',
		portalName: 'מערכת הרישום המקוונת של האוניברסיטה הפתוחה',
		tips: 'ההרשמה לאוניברסיטה הפתוחה אינה דורשת תנאי קבלה מוקדמים (ללא בגרות וללא פסיכומטרי). ניתן להירשם ישירות לקורסי אפיק המעבר לסמסטר הקרוב.'
	};
}

export function getAfikMaavarRegistrationUrl(targetInstitutionId?: string): string {
	return getAfikMaavarRegistrationInfo(targetInstitutionId).registrationUrl;
}
