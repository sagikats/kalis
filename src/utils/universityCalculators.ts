export interface UniversityCalculatorInfo {
	id: string;
	name: string;
	shortName: string;
	calculatorUrl: string;
	portalName: string;
	description: string;
}

export const UNIVERSITY_CALCULATORS: Record<string, UniversityCalculatorInfo> = {
	technion: {
		id: 'technion',
		name: 'הטכניון - מכון טכנולוגי לישראל',
		shortName: 'הטכניון',
		calculatorUrl: 'https://admissions.technion.ac.il/calculator/',
		portalName: 'מחשבון הסכם של הטכניון',
		description: 'חישוב סכם אקדמי הנדסי וממוצע בגרות מיטבי עם בונוס מורחב במתמטיקה ופיזיקה'
	},
	tau: {
		id: 'tau',
		name: 'אוניברסיטת תל אביב',
		shortName: 'אוניברסיטת תל אביב',
		calculatorUrl: 'https://go.tau.ac.il/bachelor/calc',
		portalName: 'מחשבון סיכויי קבלה — תל אביב',
		description: 'חישוב ציון התאמה וסכם הנדסי לפי ציוני בגרות ופסיכומטרי רב-תחומי'
	},
	huji: {
		id: 'huji',
		name: 'האוניברסיטה העברית בירושלים',
		shortName: 'האוניברסיטה העברית',
		calculatorUrl: 'https://info.huji.ac.il/bachelor/chishuv-sekem',
		portalName: 'מחשבון סיכויי קבלה — העברית',
		description: 'חישוב סכם אוניברסיטאי ובדיקת זכאות לקבלה ישירה ללא פסיכומטרי'
	},
	bgu: {
		id: 'bgu',
		name: 'אוניברסיטת בן-גוריון בנגב',
		shortName: 'בן-גוריון',
		calculatorUrl: 'https://bgu4u.bgu.ac.il/apex/f?p=105:1',
		portalName: 'מחשבון סיכויי קבלה — בן-גוריון',
		description: 'חישוב סכם הנדסי, סכם כמותי וסכם כללי מול ספי קבלה רשמיים'
	},
	bar_ilan: {
		id: 'bar_ilan',
		name: 'אוניברסיטת בר-אילן',
		shortName: 'בר-אילן',
		calculatorUrl: 'https://www.biu.ac.il/calculator',
		portalName: 'מחשבון סכם וסיכויי קבלה — בר-אילן',
		description: 'חישוב סכם משוקלל ובדיקת זכאות למלגות הצטיינות'
	},
	haifa: {
		id: 'haifa',
		name: 'אוניברסיטת חיפה',
		shortName: 'אוניברסיטת חיפה',
		calculatorUrl: 'https://admissions.haifa.ac.il/calculator/',
		portalName: 'מחשבון סיכויי קבלה — אוניברסיטת חיפה',
		description: 'חישוב סכם משולב ובדיקת קבלה ישירה על סמך בגרות'
	},
	ariel: {
		id: 'ariel',
		name: 'אוניברסיטת אריאל בשומרון',
		shortName: 'אוניברסיטת אריאל',
		calculatorUrl: 'https://www.ariel.ac.il/wp/admissions/calculator/',
		portalName: 'מחשבון סכם וקבלה — אוניברסיטת אריאל',
		description: 'חישוב סכם בהנדסה, מדעי הטבע ומדעי החברה'
	},
	reichman: {
		id: 'reichman',
		name: 'אוניברסיטת רייכמן',
		shortName: 'אוניברסיטת רייכמן',
		calculatorUrl: 'https://www.runi.ac.il/admissions/undergraduate/calculator/',
		portalName: 'מחשבון קבלה לתואר ראשון — רייכמן',
		description: 'חישוב סכם קבלה מותאם לבתי הספר השונים'
	}
};

/**
 * Returns calculator information for a given institution ID or name
 */
export function getUniversityCalculator(instIdOrName: string): UniversityCalculatorInfo {
	if (!instIdOrName) return UNIVERSITY_CALCULATORS.technion;

	const normalized = instIdOrName.toLowerCase().replace(/[-_\s]/g, '');

	if (normalized.includes('technion') || normalized.includes('טכניון') || normalized.includes('48')) {
		return UNIVERSITY_CALCULATORS.technion;
	}
	if (normalized.includes('tau') || normalized.includes('אביב') || normalized === 'inst6') {
		return UNIVERSITY_CALCULATORS.tau;
	}
	if (normalized.includes('huji') || normalized.includes('עברית') || normalized === 'inst1') {
		return UNIVERSITY_CALCULATORS.huji;
	}
	if (normalized.includes('bgu') || normalized.includes('גוריון') || normalized === 'inst3') {
		return UNIVERSITY_CALCULATORS.bgu;
	}
	if (normalized.includes('barilan') || normalized.includes('biu') || normalized.includes('אילן') || normalized === 'inst4') {
		return UNIVERSITY_CALCULATORS.bar_ilan;
	}
	if (normalized.includes('haifa') || normalized.includes('חיפה') || normalized === 'inst5') {
		return UNIVERSITY_CALCULATORS.haifa;
	}
	if (normalized.includes('ariel') || normalized.includes('אריאל') || normalized === 'inst2') {
		return UNIVERSITY_CALCULATORS.ariel;
	}
	if (normalized.includes('reichman') || normalized.includes('idc') || normalized.includes('רייכמן') || normalized === 'inst38') {
		return UNIVERSITY_CALCULATORS.reichman;
	}

	return UNIVERSITY_CALCULATORS.technion;
}

export interface VerificationSubjectItem {
	name: string;
	units: number;
	grade: number;
	isUpgraded?: boolean;
	originalGrade?: number;
	originalUnits?: number;
	isNew?: boolean;
}

export interface VerificationDataSummary {
	institutionName: string;
	programName: string;
	trackTitle: string;
	targetSekem?: number;
	threshold?: number | null;
	isTechnion: boolean;
	psychometricScore: number;
	isPsychUpgraded?: boolean;
	originalPsychometric?: number;
	psychQuant?: number;
	psychVerbal?: number;
	psychEnglish?: number;
	subjects: VerificationSubjectItem[];
	calculatorUrl: string;
}

/**
 * Formats all grades and targets into a clean, human-readable clipboard text
 */
export function formatVerificationClipboardText(data: VerificationDataSummary): string {
	const lines: string[] = [];

	lines.push(`🎓 אימות חישוב סכם מול ${data.institutionName}`);
	lines.push(`תוכנית לימודים: ${data.programName}`);
	lines.push(`מסלול מומלץ: ${data.trackTitle}`);

	if (data.targetSekem !== undefined) {
		const formattedSekem = data.isTechnion ? data.targetSekem.toFixed(2) : data.targetSekem.toFixed(1);
		lines.push(`סכם צפוי במחשבון: ${formattedSekem}${data.threshold ? ` (סף קבלה: ${data.threshold})` : ''}`);
	}

	lines.push('');
	lines.push('--- ציוני פסיכומטרי להזנה ---');
	if (data.psychometricScore > 0) {
		const psychUpgraded = data.isPsychUpgraded && data.originalPsychometric
			? ` (משודרג מ-${data.originalPsychometric})`
			: '';
		lines.push(`• ציון כללי / רב-תחומי: ${data.psychometricScore}${psychUpgraded}`);
		if (data.psychQuant && data.psychQuant > 0) lines.push(`  - כמותי: ${data.psychQuant}`);
		if (data.psychVerbal && data.psychVerbal > 0) lines.push(`  - מילולי: ${data.psychVerbal}`);
		if (data.psychEnglish && data.psychEnglish > 0) lines.push(`  - אנגלית: ${data.psychEnglish}`);
	} else {
		lines.push('• ללא פסיכומטרי (קבלה ישירה על סמך בגרות)');
	}

	lines.push('');
	lines.push('--- ציוני בגרות להזנה ---');
	data.subjects.forEach((sub) => {
		let note = '';
		if (sub.isNew) {
			note = ' (מקצוע חדש מוצע)';
		} else if (sub.isUpgraded && sub.originalGrade !== undefined) {
			note = ` (שודרג מ-${sub.originalGrade} ב-${sub.originalUnits || sub.units} יח״ל)`;
		}
		lines.push(`• ${sub.name}: ${sub.units} יח״ל — ציון ${sub.grade}${note}`);
	});

	lines.push('');
	lines.push(`קישור ישיר למחשבון הרשמי של ${data.institutionName}:`);
	lines.push(data.calculatorUrl);
	lines.push('');
	lines.push('חושב באמצעות מנוע מתקבלים — https://mitkablim.co.il');

	return lines.join('\n');
}
