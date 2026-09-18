import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowRight, EyeOff, UserCheck, Trash2, Database, HelpCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'מדיניות פרטיות והגנת מידע | מתקבלים (mitkablim.co.il)',
	description: 'מדיניות הפרטיות, שמירת המידע וההגנה על נתוני המועמדים בפלטפורמת מתקבלים (mitkablim.co.il).',
};

export default function PrivacyPage() {
	return (
		<main dir="rtl" className="min-h-screen bg-[#FAF8F5] text-[#222222] py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				{/* Breadcrumb & Top Bar */}
				<div className="mb-8">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-xs font-bold text-[#66635C] hover:text-[#222222] bg-white px-3.5 py-1.5 rounded-full border border-[#E5DFD4] shadow-2xs transition-colors"
					>
						<ArrowRight className="w-3.5 h-3.5" />
						חזרה לדף הבית
					</Link>
				</div>

				{/* Header Section */}
				<header className="mb-10 text-center sm:text-right border-b border-[#E5DFD4] pb-8">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-bold mb-4">
						<ShieldCheck className="w-3.5 h-3.5" />
						הגנת פרטיות קפדנית
					</div>
					<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#222222] mb-3">
						מדיניות פרטיות ושמירת נתונים
					</h1>
					<p className="text-sm sm:text-base text-[#66635C] max-w-2xl leading-relaxed">
						אנו מחויבים להגנה מוחלטת על פרטיותך וסודיות ציוניך. מסמך זה מפרט כיצד נשמר המידע, לאילו מטרות, וכיצד מובטחת אי-הפצתו. עודכן לאחרונה: ספטמבר 2026.
					</p>
				</header>

				{/* Pledge Banner: Zero Third-Party Sharing */}
				<div className="mb-8 p-5 sm:p-6 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] shadow-xs">
					<div className="flex items-start gap-3.5">
						<EyeOff className="w-6 h-6 text-[#059669] shrink-0 mt-0.5" />
						<div>
							<h2 className="text-base font-bold text-[#065F46] mb-1.5">
								התחייבות ברזל: אי-הפצה ואי-מסחר בנתוני המשתמש
							</h2>
							<p className="text-xs sm:text-sm text-[#047857] leading-relaxed">
								פלטפורמת <strong>מתקבלים (mitkablim.co.il)</strong> מתחייבת באופן חד-משמעי: <strong>איננו מוכרים, משכירים, מעבירים או משתפים את המידע האישי שלך או את ציוני הבגרות והפסיכומטרי שלך עם שום גורם חיצוני</strong> – לרבות אוניברסיטאות, מכללות, מכוני הכנה לפסיכומטרי, מפרסמים או חברות מסחריות. המידע נשמר אך ורק לשימושך האישי במערכת.
							</p>
						</div>
					</div>
				</div>

				{/* Content Sections */}
				<div className="space-y-8 text-sm leading-relaxed text-[#44423D]">
					{/* Section 1: Legal Basis and Voluntary Submission */}
					<section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD4] shadow-xs">
						<div className="flex items-center gap-2.5 mb-3 text-[#222222]">
							<UserCheck className="w-5 h-5 text-[#3C3C3C]" />
							<h3 className="text-lg font-bold">1. הודעה לפי סעיף 11 לחוק הגנת הפרטיות ומסירת מידע מרצון</h3>
						</div>
						<p className="mb-3">
							בהתאם להוראות <strong>חוק הגנת הפרטיות, התשמ&quot;א-1981</strong> ותיקון 13 לחוק:
						</p>
						<ul className="list-disc list-inside space-y-2 pr-1">
							<li>
								<strong>היעדר חובה חוקית:</strong> לא חלה עליך כל חובה חוקית למסור מידע כלשהו באתר. מסירת המידע (שם, כתובת דוא״ל, ציונים וכו׳) נעשית <strong>מרצונך החופשי ובהסכמתך המלאה</strong>, לצורך קבלת שירותי החישוב והתכנון האקדמי.
							</li>
							<li>
								<strong>מטרת איסוף המידע:</strong> המידע נאסף אך ורק לצורך מתן השירות המבוקש – חישוב ציוני סכם רב-מוסדיים, ניתוח סיכויי קבלה לתארים מבוקשים, יצירת מסלולי פעולה אופטימליים, ואפשור שמירת מסלולים אישיים באזור המשתמש.
							</li>
						</ul>
					</section>

					{/* Section 2: Types of Data Collected */}
					<section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD4] shadow-xs">
						<div className="flex items-center gap-2.5 mb-3 text-[#222222]">
							<Database className="w-5 h-5 text-[#3C3C3C]" />
							<h3 className="text-lg font-bold">2. סוגי המידע הנאספים במערכת</h3>
						</div>
						<div className="space-y-3">
							<div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4]">
								<h4 className="font-bold text-xs text-[#222222] mb-1">א. מידע חשבון ואימות</h4>
								<p className="text-xs text-[#66635C]">
									שם מלא, כתובת דואר אלקטרוני, סיסמה מוצפנת ומספר טלפון (אופציונלי). לכל מועמד מוקצה מזהה מערכת ייעודי לצורכי סנכרון הנתונים בשרת.
								</p>
							</div>
							<div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4]">
								<h4 className="font-bold text-xs text-[#222222] mb-1">ב. מידע אקדמי וציונים</h4>
								<p className="text-xs text-[#66635C]">
									ציוני בחינות בגרות (ציונים, יחידות לימוד ומקצועות), ציוני פסיכומטרי (ציון רב-תחומי ודגשים כמותי/מילולי), העדפות זמני לימוד ויעדי תארים שנבחרו.
								</p>
							</div>
							<div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4]">
								<h4 className="font-bold text-xs text-[#222222] mb-1">ג. נתוני גלישה טכניים (אנונימיים)</h4>
								<p className="text-xs text-[#66635C]">
									כתובות IP וזמני גישה לצורכי אבטחת מידע, מניעת מתקפות סייבר וניטור תקינות השרת, ללא שיוך מסחרי.
								</p>
							</div>
						</div>
					</section>

					{/* Section 3: Information Security */}
					<section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD4] shadow-xs">
						<div className="flex items-center gap-2.5 mb-3 text-[#222222]">
							<Lock className="w-5 h-5 text-[#3C3C3C]" />
							<h3 className="text-lg font-bold">3. אבטחת מידע והצפנה</h3>
						</div>
						<p className="mb-3">
							אנו מיישמים אמצעי אבטחת מידע מחמירים בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), תשע&quot;ז-2017:
						</p>
						<ul className="list-disc list-inside space-y-2 pr-1">
							<li>
								<strong>הצפנת סיסמאות:</strong> סיסמאות המשתמשים אינן נשמרות לעולם כטקסט קריא, אלא מעובדות באמצעות אלגוריתם גיבוב מאובטח וחד-כיווני (Bcrypt) עם Salt ייחודי.
							</li>
							<li>
								<strong>תקשורת מוצפנת:</strong> כל תעבורת הנתונים בין הדפדפן שלך לשרתי האתר מוצפנת בפרוטוקול מאובטח בתקן SSL/TLS (HTTPS).
							</li>
							<li>
								<strong>הפרדת משתמשים מוחלטת:</strong> מסד הנתונים מנוהל באמצעות מנגנוני בידוד ובקרת הרשאות קפדניים, המונעים גישה של משתמש אחד לנתוניו של משתמש אחר.
							</li>
						</ul>
					</section>

					{/* Section 4: Right to Delete and Inspect */}
					<section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD4] shadow-xs">
						<div className="flex items-center gap-2.5 mb-3 text-[#222222]">
							<Trash2 className="w-5 h-5 text-[#3C3C3C]" />
							<h3 className="text-lg font-bold">4. זכות העיון, התיקון והזכות למחיקת מידע (&quot;הזכות להישכח&quot;)</h3>
						</div>
						<p className="mb-3">
							בהתאם להוראות סעיפים 13 ו-14 לחוק הגנת הפרטיות:
						</p>
						<ul className="list-disc list-inside space-y-2 pr-1">
							<li>
								<strong>זכות עיון ותיקון:</strong> הינך זכאי לעיין במידע שנשמר אודותיך באזור האישי באתר ולעדכן ציונים או פרטים אישיים בכל עת.
							</li>
							<li>
								<strong>זכות למחיקה מוחלטת:</strong> הינך רשאי לבקש מחיקה מלאה ובלתי הפיכה של חשבונך, נתוניך האישיים וכל הציונים המאוחסנים אודותיך במערכת. עם קבלת בקשת מחיקה, המידע יוסר לחלוטין ממסדי הנתונים הפעילים של האתר.
							</li>
						</ul>
					</section>

					{/* Section 5: Cookies and LocalStorage */}
					<section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD4] shadow-xs">
						<div className="flex items-center gap-2.5 mb-3 text-[#222222]">
							<HelpCircle className="w-5 h-5 text-[#3C3C3C]" />
							<h3 className="text-lg font-bold">5. עוגיות (Cookies) ואחסון מקומי בדפדפן</h3>
						</div>
						<p className="mb-2">
							האתר עושה שימוש באחסון מקומי (LocalStorage) בדפדפן שלך כדי לאפשר לך לחשב ציונים כמשתמש אורח מבלי לאבד את הנתונים בעת רענון הדף. נתונים אלו נשמרים על גבי מכשירך האישי בלבד.
						</p>
						<p>
							בנוסף, בעת התחברות לחשבון, המערכת משתמשת ב-Cookies מאובטחות (HttpOnly) לזיהוי הסשן שלך ולאבטחת הפעילות באתר.
						</p>
					</section>
				</div>

				{/* Bottom Navigation Link */}
				<div className="mt-12 text-center border-t border-[#E5DFD4] pt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-[#66635C]">
					<Link href="/terms" className="hover:text-[#222222] underline">
						קרא את תנאי השימוש וכתב הגבלת האחריות
					</Link>
					<span>•</span>
					<Link href="/" className="hover:text-[#222222] underline">
						חזרה לדף הראשי
					</Link>
				</div>
			</div>
		</main>
	);
}
