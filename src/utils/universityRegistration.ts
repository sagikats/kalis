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
	if (lower.includes('בר אילן') || lower.includes('בר-אילן')) {
		return {
			institutionName: 'אוניברסיטת בר-אילן',
			registrationUrl: 'https://www.biu.ac.il/admissions/bachelor',
			portalName: 'מרכז שירות וגיוס מועמדים - אוניברסיטת בר-אילן',
			tips: 'ההרשמה המקוונת כוללת בדיקה אוטומטית של זכאות לשילובים בין-תחומיים.'
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
