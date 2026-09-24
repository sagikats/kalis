import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import UnifiedCalculator from '@/components/calculator/UnifiedCalculator';
import { Calculator } from 'lucide-react';

interface UniversityConfig {
	slug: string;
	id: string;
	name: string;
	shortName: string;
	title: string;
	description: string;
	keywords: string[];
}

const UNIVERSITIES: Record<string, UniversityConfig> = {
	technion: {
		slug: 'technion',
		id: 'technion',
		name: 'הטכניון — מכון טכנולוגי לישראל',
		shortName: 'הטכניון',
		title: 'מחשבון סכם טכניון — חישוב ממוצע בגרות וסכם קבלה להנדסה ומדעי המחשב',
		description:
			'מחשבון סכם רשמי לטכניון. חישוב ממוצע בגרות מיטבי עם בונוסים, שקלול ציון פסיכומטרי ובדיקת סיכויי קבלה לכל תוכניות הלימודים והפקולטות בטכניון.',
		keywords: [
			'מחשבון סכם טכניון',
			'סכם טכניון',
			'חישוב סכם טכניון',
			'תנאי קבלה טכניון',
			'קבלה לטכניון',
			'מחשבון בגרויות טכניון',
			'סכם הנדסה טכניון',
			'סכם מדעי המחשב טכניון',
			'סף קבלה טכניון'
		]
	},
	tau: {
		slug: 'tau',
		id: 'tau',
		name: 'אוניברסיטת תל אביב',
		shortName: 'תל אביב',
		title: 'מחשבון סכם תל אביב (את״א) — חישוב סכם הנדסה, מדעים מדויקים ורפואה',
		description:
			'מחשבון סכם רשמי לאוניברסיטת תל אביב. חישוב סכם משולב, בונוס 10 נקודות למדעים מדויקים והנדסה, בירור סף קבלה וסיכויי קבלה לתואר.',
		keywords: [
			'מחשבון סכם תל אביב',
			'סכם תל אביב',
			'סכם אתא',
			'חישוב סכם תל אביב',
			'תנאי קבלה אוניברסיטת תל אביב',
			'מחשבון בגרויות תל אביב',
			'סכם הנדסה תל אביב',
			'סף קבלה תל אביב'
		]
	},
	huji: {
		slug: 'huji',
		id: 'huji',
		name: 'האוניברסיטה העברית בירושלים',
		shortName: 'העברית',
		title: 'מחשבון סכם האוניברסיטה העברית בירושלים — חישוב סכם וסיכויי קבלה',
		description:
			'מחשבון סכם רשמי לאוניברסיטה העברית בירושלים. חישוב סכם עברית, שקלול בגרות ופסיכומטרי, בדיקת קבלה ישירה על סמך בגרות ובירור ספי קבלה לחוגים.',
		keywords: [
			'מחשבון סכם העברית',
			'סכם העברית',
			'חישוב סכם האוניברסיטה העברית',
			'תנאי קבלה העברית בירושלים',
			'מחשבון בגרויות העברית',
			'סכם האוניברסיטה העברית',
			'סף קבלה העברית'
		]
	},
	bgu: {
		slug: 'bgu',
		id: 'bgu',
		name: 'אוניברסיטת בן-גוריון בנגב',
		shortName: 'בן-גוריון',
		title: 'מחשבון סכם אוניברסיטת בן-גוריון — חישוב סכם הנדסה, מדעי הטבע ומדעי הרוח',
		description:
			'מחשבון סכם רשמי לאוניברסיטת בן-גוריון בנגב. חישוב סכם הנדסה, סכם כללי ומדעי הטבע, שקלול בונוסי מקצועות ובדיקת ספי קבלה לכל המחלקות.',
		keywords: [
			'מחשבון סכם בן גוריון',
			'סכם בן גוריון',
			'סכם בגו',
			'חישוב סכם בן גוריון',
			'תנאי קבלה בן גוריון',
			'סכם הנדסה בן גוריון',
			'מחשבון בגרויות בן גוריון',
			'סף קבלה בן גוריון'
		]
	},
	'bar-ilan': {
		slug: 'bar-ilan',
		id: 'bar_ilan',
		name: 'אוניברסיטת בר-אילן',
		shortName: 'בר-אילן',
		title: 'מחשבון סכם אוניברסיטת בר-אילן — חישוב ממוצע בגרות וסף קבלה לתואר',
		description:
			'מחשבון סכם רשמי לאוניברסיטת בר-אילן. שקלול ממוצע בגרות מיטבי עם בונוסים, ציון פסיכומטרי, בירור סף קבלה ובדיקת סיכויי קבלה לכל הפקולטות.',
		keywords: [
			'מחשבון סכם בר אילן',
			'סכם בר אילן',
			'חישוב סכם בר אילן',
			'תנאי קבלה בר אילן',
			'מחשבון בגרויות בר אילן',
			'סף קבלה בר אילן'
		]
	},
	haifa: {
		slug: 'haifa',
		id: 'haifa',
		name: 'אוניברסיטת חיפה',
		shortName: 'חיפה',
		title: 'מחשבון סכם אוניברסיטת חיפה — בדיקת נתוני קבלה וסף קבלה לתואר',
		description:
			'מחשבון סכם רשמי לאוניברסיטת חיפה. חישוב סכם משוקלל, איתור קבלה ישירה על סמך בגרות בלבד ובירור תנאי קבלה לכל החוגים.',
		keywords: [
			'מחשבון סכם אוניברסיטת חיפה',
			'סכם חיפה',
			'חישוב סכם חיפה',
			'תנאי קבלה אוניברסיטת חיפה',
			'מחשבון בגרויות חיפה',
			'סף קבלה חיפה'
		]
	},
	ariel: {
		slug: 'ariel',
		id: 'ariel',
		name: 'אוניברסיטת אריאל בשומרון',
		shortName: 'אריאל',
		title: 'מחשבון סכם אוניברסיטת אריאל — חישוב סכם הנדסה, מדעי הבריאות ורפואה',
		description:
			'מחשבון סכם רשמי לאוניברסיטת אריאל בשומרון. חישוב סכם משולב, שקלול בגרות ופסיכומטרי ובדיקת ספי קבלה לתואר ראשון.',
		keywords: [
			'מחשבון סכם אריאל',
			'סכם אריאל',
			'חישוב סכם אוניברסיטת אריאל',
			'תנאי קבלה אוניברסיטת אריאל',
			'מחשבון בגרויות אריאל',
			'סף קבלה אריאל'
		]
	},
	reichman: {
		slug: 'reichman',
		id: 'reichman',
		name: 'אוניברסיטת רייכמן',
		shortName: 'רייכמן',
		title: 'מחשבון סכם אוניברסיטת רייכמן — בדיקת תנאי קבלה וסף קבלה',
		description:
			'מחשבון סכם ותנאי קבלה לאוניברסיטת רייכמן (הבינתחומי הרצליה). שקלול ממוצע בגרות מיטבי, פסיכומטרי ובדיקת קבלה ישירה לכל בתי הספר.',
		keywords: [
			'מחשבון סכם רייכמן',
			'סכם רייכמן',
			'תנאי קבלה רייכמן',
			'קבלה לבינתחומי הרצליה',
			'מחשבון בגרויות רייכמן',
			'סף קבלה רייכמן'
		]
	}
};

export function generateStaticParams() {
	return Object.keys(UNIVERSITIES).map((slug) => ({ inst: slug }));
}

export async function generateMetadata({
	params
}: {
	params: Promise<{ inst: string }>;
}): Promise<Metadata> {
	const { inst } = await params;
	const uni = UNIVERSITIES[inst];

	if (!uni) {
		return {
			title: 'מחשבון סכם לאוניברסיטאות | מתקבלים'
		};
	}

	return {
		title: uni.title,
		description: uni.description,
		keywords: uni.keywords,
		alternates: {
			canonical: `/calculators/${uni.slug}`
		},
		openGraph: {
			title: uni.title,
			description: uni.description,
			url: `https://mitkablim.co.il/calculators/${uni.slug}`,
			siteName: 'מתקבלים (Mitkablim)',
			locale: 'he_IL',
			type: 'website'
		}
	};
}

function CalculatorLoadingFallback() {
	return (
		<div className="min-h-screen bg-[#FAF8F5] text-[#222222] flex flex-col items-center justify-center p-6 space-y-4 dir-rtl" dir="rtl">
			<div className="p-4 rounded-3xl bg-white border border-[#E5DFD4] text-[#222222] shadow-xs animate-pulse">
				<Calculator className="h-8 w-8 text-blue-700" />
			</div>
			<div className="text-center space-y-1">
				<h3 className="text-lg font-bold text-[#222222]">טוען מחשבון סכם רשמי...</h3>
				<p className="text-xs text-[#66635C]">טוען את נוסחאות הסכם הרשמיות של האוניברסיטה</p>
			</div>
		</div>
	);
}

export default async function UniversityCalculatorPage({
	params
}: {
	params: Promise<{ inst: string }>;
}) {
	const { inst } = await params;
	const uni = UNIVERSITIES[inst];

	if (!uni) {
		notFound();
	}

	return (
		<Suspense fallback={<CalculatorLoadingFallback />}>
			<UnifiedCalculator initialInstId={uni.id} />
		</Suspense>
	);
}
