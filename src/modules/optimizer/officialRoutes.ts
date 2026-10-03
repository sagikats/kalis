/**
 * Every official admission route of a program other than the regular sekem — bagrut-only, psychometric-only and the
 * Technion routes (בגרות מצוינת, מבחן סיווג במתמטיקה, גשר, ראויים לקידום, אפיק מקוצר, מתיכון לטכניון) — described
 * for one applicant: the published conditions, where the applicant stands, and a status.
 *
 * Used by the step-4 "מסלולים עוקפים" tabs (all routes) and the step-3 report (`reportLine`, only where relevant).
 */

import type { AdmissionRoutes, ExcellentBagrutRoute } from '../../types/academic';
import type { CalculatorSubject } from '../calculators/types';
import { describeCondition, evaluateExcellentBagrut, requiredGesherScore, requiredMathExamScore } from './excellentBagrut';

export type OfficialRouteStatus = 'fits' | 'close' | 'not_met' | 'info';

export interface OfficialRouteInfo {
	id: string;
	/** Short label for the tab. */
	tabLabel: string;
	title: string;
	status: OfficialRouteStatus;
	/** One-line answer for this applicant. */
	headline: string;
	/** The published conditions. */
	conditions: string[];
	/** Notes on how the route works (process, timing, contacts). */
	notes: string[];
	/** Shown in the step-3 report as an alternative path when set. */
	reportLine?: string;
}

export interface OfficialRouteContext {
	subjects: CalculatorSubject[];
	/** The institution's bagrut average for this applicant. */
	bagrutAverage: number;
	psychometric: number;
	/** The applicant's score for this program and its threshold. */
	userSekem: number;
	threshold: number | null;
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);

/** The conditions of an ExcellentBagrutRoute-shaped rule as separate lines. */
function conditionLines(rule: ExcellentBagrutRoute): string[] {
	const lines: string[] = [];
	if (rule.rawAverageMin !== undefined) lines.push(`ממוצע בגרות רגיל (ללא בונוסים) ${rule.rawAverageMin}+`);
	for (const c of rule.all ?? []) lines.push(describeCondition(c));
	if (rule.anyOf?.length) lines.push(`אחת האפשרויות: ${rule.anyOf.map((opt) => opt.map(describeCondition).join(' + ')).join(' | או | ')}`);
	if (rule.mathAnyOf?.length) lines.push(`מתמטיקה ${rule.mathAnyOf.map((m) => `${m.minUnits} יח״ל ${m.minGrade}+`).join(' או ')}`);
	if (rule.interview) lines.push('ריאיון קבלה');
	return lines;
}

export function describeOfficialRoutes(routes: AdmissionRoutes | undefined, ctx: OfficialRouteContext): OfficialRouteInfo[] {
	if (!routes) return [];
	const out: OfficialRouteInfo[] = [];
	const { subjects, bagrutAverage: avg, psychometric: psych, userSekem, threshold } = ctx;

	if (routes.bagrutOnlyMin) {
		const min = routes.bagrutOnlyMin;
		const fits = avg >= min;
		out.push({
			id: 'bagrut-only',
			tabLabel: 'בגרות בלבד',
			title: 'קבלה לפי בגרות בלבד (בלי פסיכומטרי)',
			status: fits ? 'fits' : avg > 0 && min - avg <= 5 ? 'close' : 'not_met',
			headline: fits ? `הממוצע שלך (${avg}) עומד בדרישה.` : `הממוצע שלך ${avg}; חסרות ${fmt(min - avg)} נקודות.`,
			conditions: [`ממוצע בגרות ${min}+ לפי חישוב המוסד`],
			notes: ['בכפוף לתנאי הסף הנוספים של המוסד (למשל מתמטיקה או אנגלית).']
		});
	}

	if (routes.psychometricOnlyMin) {
		const min = routes.psychometricOnlyMin;
		const fits = psych >= min;
		out.push({
			id: 'psychometric-only',
			tabLabel: 'פסיכומטרי בלבד',
			title: 'קבלה לפי פסיכומטרי בלבד',
			status: fits ? 'fits' : psych > 0 && min - psych <= 30 ? 'close' : 'not_met',
			headline: fits ? `הפסיכומטרי שלך (${psych}) עומד בדרישה.` : psych ? `הפסיכומטרי שלך ${psych}; חסרות ${min - psych} נקודות.` : 'עדיין לא נבחנת בפסיכומטרי.',
			conditions: [`ציון פסיכומטרי כללי ${min}+`],
			notes: ['בכפוף לזכאות לבגרות ולתנאי הסף הנוספים של המוסד.']
		});
	}

	if (routes.excellentBagrut) {
		const r = routes.excellentBagrut;
		const ev = evaluateExcellentBagrut(r, subjects);
		out.push({
			id: 'excellent-bagrut',
			tabLabel: 'בגרות מצוינת',
			title: 'בגרות מצוינת (קבלה בלי פסיכומטרי)',
			status: ev.met ? 'fits' : ev.missing.length <= 2 ? 'close' : 'not_met',
			headline: ev.met ? 'את/ה עומד/ת בכל התנאים — אפשר להתקבל בלי פסיכומטרי.' : `חסר לך: ${ev.missing.join('; ')}.`,
			conditions: conditionLines(r),
			notes: ['כל מקצוע נספר לתנאי אחד בלבד.', 'נדרשים גם ידע באנגלית ובעברית.'],
			reportLine: !ev.met && ev.missing.length <= 2 ? `התנאים: ${r.summary}. חסר לך: ${ev.missing.join('; ')}.` : undefined
		});
	}

	if (routes.mathExam && threshold) {
		const me = routes.mathExam;
		const elig = evaluateExcellentBagrut(me.eligibility, subjects);
		const need = elig.met && avg > 0 ? requiredMathExamScore(me, avg, threshold) : null;
		const reportLine = elig.met && avg > 0
			? need
				? `ציון המבחן מומר לסולם הפסיכומטרי ומחליף אותו בסכם. עם ממוצע הבגרות שלך (${avg}) מספיק ציון ${need.examScore} במבחן הסיווג במתמטיקה (שווה ערך לפסיכומטרי ${need.psychometricEquivalent}) כדי להגיע לסף ${threshold}.${me.note ? ` ${me.note}` : ''}`
				: `ציון המבחן מחליף את הפסיכומטרי בסכם, אבל עם ממוצע הבגרות הנוכחי (${avg}) גם 100 במבחן לא מגיע לסף ${threshold}.`
			: elig.missing.length <= 2
			? `תנאי ההשתתפות: ${me.eligibility.summary}. חסר לך: ${elig.missing.join('; ')}.`
			: undefined;
		out.push({
			id: 'math-exam',
			tabLabel: 'מבחן סיווג במתמטיקה',
			title: 'בגרות + מבחן סיווג במתמטיקה (במקום פסיכומטרי)',
			status: need ? 'fits' : elig.met ? 'not_met' : elig.missing.length <= 2 ? 'close' : 'not_met',
			headline: need
				? `מספיק ציון ${need.examScore} במבחן הסיווג (שווה ערך לפסיכומטרי ${need.psychometricEquivalent}) כדי להגיע לסף ${threshold}.`
				: elig.met
				? `עם הממוצע הנוכחי (${avg}) גם 100 במבחן לא מגיע לסף ${threshold}.`
				: `תנאי ההשתתפות חסרים: ${elig.missing.join('; ')}.`,
			conditions: [
				...conditionLines(me.eligibility).map((l) => `תנאי השתתפות: ${l}`),
				`ציון המבחן מומר לפסיכומטרי: ציון × ${me.conversion.slope} + ${me.conversion.intercept} (מעוגל); ציון מתחת ל-${me.minExamScore} לא מומר`,
				'הציון המומר מחליף את הפסיכומטרי בנוסחת הסכם הרגילה'
			],
			notes: ['ההרשמה למבחן דרך אתר הטכניון; יש קורסי הכנה.', 'מי שיש לו רקע אקדמי במתמטיקה לא יכול להתמיין באפיק הזה.'],
			reportLine
		});
	}

	if (routes.gesher && threshold) {
		const g = routes.gesher;
		const gap = Math.round((threshold - userSekem) * 10) / 10;
		const elig = evaluateExcellentBagrut(g.eligibility, subjects);
		const need = userSekem > 0 ? requiredGesherScore(gap, g.maxBonus) : null;
		const fits = !!need && need > 0 && elig.met;
		out.push({
			id: 'gesher',
			tabLabel: 'גשר',
			title: 'גשר קבלה לטכניון',
			status: fits ? 'fits' : userSekem > 0 && gap > 0 && gap <= g.maxBonus ? 'close' : 'not_met',
			headline: fits
				? `חסרות לך ${gap} נק׳; ציון משוקלל ${need} בסמסטר הגשר סוגר את הפער.`
				: userSekem <= 0
				? 'האפיק מיועד למי שנבחנו בפסיכומטרי וחסרות להם עד 2 נקודות בסכם.'
				: gap > g.maxBonus
				? `חסרות לך ${gap} נק׳ — יותר מ-${g.maxBonus}, ולכן האפיק לא מתאים כרגע.`
				: `חסר לך: ${elig.missing.join('; ')}.`,
			conditions: [
				`הסכם נמוך בעד ${g.maxBonus} נקודות מסף המסלול`,
				...conditionLines(g.eligibility),
				'אנגלית 104+ בפסיכומטרי או באמי"ר, יע"ל 121+'
			],
			notes: [
				'סמסטר לימודי מתמטיקה ופיזיקה (מאי–ספטמבר).',
				`תוספת לסכם לפי ציון משוקלל x = 0.6×מתמטיקה + 0.4×פיזיקה: 0 עד 65, ‏(x−65)×2/27 באמצע, ${g.maxBonus} מ-92.`,
				'לא פתוח לבוגרי מכינה.'
			],
			reportLine: fits
				? `הסכם שלך חסר ${gap} נק׳ (עד ${g.maxBonus} מותר). לומדים סמסטר מתמטיקה ופיזיקה בטכניון (מספטמבר), ולפי הציונים מקבלים עד ${g.maxBonus} נקודות לסכם: ציון משוקלל (0.6×מתמטיקה + 0.4×פיזיקה) של ${need} סוגר לך את הפער. נדרשים גם אנגלית 104+ בפסיכומטרי או באמי"ר וידע בעברית.`
				: undefined
		});
	}

	if (routes.promotionBonus && threshold) {
		const b = routes.promotionBonus;
		const lowered = Math.round((threshold - b) * 100) / 100;
		const wouldPass = userSekem > 0 && userSekem >= lowered;
		const pts = b === 1 ? 'נקודה' : 'נקודות';
		out.push({
			id: 'promotion',
			tabLabel: 'ראויים לקידום',
			title: 'ראויים לקידום (הנחה בסכם)',
			status: wouldPass ? 'fits' : 'info',
			headline: `הנחה של ${b} ${pts} בסכם — סף ${lowered}.${wouldPass ? ` עם ההכרה, הסכם שלך (${userSekem}) עומד בסף.` : ''}`,
			conditions: ['הכרה כ"ראוי/ה לקידום" ע"י האגודה לקידום החינוך, בניקוד 30 ומעלה', `הנחה של ${b} ${pts} בסף הסכם של התואר הזה`],
			notes: ['מיועד למי שהתמודדו עם קשיים אישיים, סביבתיים או משפחתיים בתקופת התבגרותם.', 'הבקשה מוגשת לאגודה (kidum-edu.org.il, ‏02-6441159) וטיפולה נמשך כחודשיים — להגיש לפני ההרשמה לטכניון.'],
			reportLine: `מי שהוכר/ה ע"י האגודה לקידום החינוך כ"ראוי/ה לקידום" (30 נקודות ומעלה) מקבל/ת הנחה של ${b} ${pts} בסכם בתואר הזה, כלומר סף ${lowered}.${wouldPass ? ` עם ההכרה, הסכם שלך (${userSekem}) עומד בסף.` : ''} הבקשה מוגשת לאגודה (kidum-edu.org.il) לפני ההרשמה לטכניון.`
		});
	}

	if (routes.shortTrack) {
		const st = routes.shortTrack;
		out.push({
			id: 'short-track',
			tabLabel: 'אפיק מקוצר',
			title: 'אפיק מקוצר דרך לימודי חוץ בטכניון',
			status: 'info',
			headline: `סמסטר א' בלימודי חוץ, ומעבר לסמסטר ב' בממוצע ${st.firstSemesterAverageMin}+ וציון ${st.minCourseGrade}+ בכל קורס.`,
			conditions: [
				'זכאות לתעודת בגרות מלאה; בלי פסיכומטרי',
				'לפחות 17 נ״ז בסמסטר א\'',
				`ממוצע ${st.firstSemesterAverageMin}+ בסמסטר הראשון`,
				`ציון ${st.minCourseGrade}+ בכל קורס`,
				...(st.note ? [st.note] : [])
			],
			notes: [
				'מתקיים בסמסטר א\' בלבד, למי שאין רקע אקדמי קודם; ההרשמה דרך בית הספר ללימודי המשך.',
				'פיזיקה בלי בגרות 5 יח"ל 70+ — מבחן סיווג במכניקה לפני תחילת הלימודים; קייטנת מתמטיקה בחודש שלפני.',
				'הקבלה לסמסטר ב\' בלבד; "כל הקודם זוכה" (עד 5% ממכסת המסלול).'
			],
			reportLine: `לומדים סמסטר א' בבית הספר ללימודי המשך (לפחות 17 נ״ז, בלי פסיכומטרי) ועוברים לסמסטר ב' בממוצע ${st.firstSemesterAverageMin}+ וציון ${st.minCourseGrade}+ בכל קורס. נדרשת זכאות לבגרות מלאה.${st.note ? ` ${st.note}` : ''}`
		});
	}

	if (routes.fromHighSchool) {
		const note = routes.fromHighSchool.note;
		out.push({
			id: 'from-high-school',
			tabLabel: 'מתיכון לטכניון',
			title: 'מתיכון לטכניון (לתלמידי תיכון)',
			status: 'info',
			headline: 'לתלמידי תיכון: קורסי מתמטיקה בטכניון במקביל לתיכון, וקבלה לפי הציונים בהם.',
			conditions: ['תלמיד/ת תיכון עם רקע חזק במתמטיקה', 'קבלה לפי הציונים בקורסים — בלי ציון בגרות או פסיכומטרי', 'זכאות לתעודת בגרות מלאה', ...(note ? [note] : [])],
			notes: ['תוכנית משותפת לפקולטה למתמטיקה וליחידה לנוער שוחר מדע.', 'מסיימים בממוצע 90+ בחמשת הקורסים מקבלים מלגה בגובה שכר הלימוד לשנה הראשונה.'],
			reportLine: `תלמידי תיכון עם רקע חזק במתמטיקה לומדים קורסי מתמטיקה בטכניון במקביל לתיכון, ומתקבלים לפי הציונים בקורסים — בלי ציון בגרות או פסיכומטרי (נדרשת זכאות לבגרות מלאה).${note ? ` ${note}` : ''}`
		});
	}

	const rank: Record<OfficialRouteStatus, number> = { fits: 0, close: 1, info: 2, not_met: 3 };
	return out.sort((a, b) => rank[a.status] - rank[b.status]);
}
