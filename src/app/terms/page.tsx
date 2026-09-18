import React from 'react';
import Link from 'next/link';
import { Scale, ShieldAlert, ArrowRight, BookOpen, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'תנאי שימוש והגבלת אחריות | קליס (Kalis)',
	description: 'תנאי השימוש, כתב הוויתור והגבלת האחריות של פלטפורמת קליס לחישוב סכם ותכנון קבלה אקדמית.',
};

export default function TermsPage() {
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
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF0E6] border border-[#E8D8C8] text-[#8C4A1E] text-xs font-bold mb-4">
						<Scale className="w-3.5 h-3.5" />
						מסמך משפטי מחייב
					</div>
					<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#222222] mb-3">
						תנאי שימוש וכתב הגבלת אחריות
					</h1>
					<p className="text-sm sm:text-base text-[#66635C] max-w-2xl leading-relaxed">
						הנחיות, זכויות, חובות והגבלת אחריות משפטית בעת השימוש בפלטפורמת קליס (Kalis). עודכן לאחרונה: ספטמבר 2026.
					</p>
				</header>

				{/* Critical Disclaimer Banner */}
				<div className="mb-8 p-5 sm:p-6 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] shadow-xs">
					<div className="flex items-start gap-3.5">
						<AlertTriangle className="w-6 h-6 text-[#D97706] shrink-0 mt-0.5" />
						<div>
							<h2 className="text-base font-bold text-[#92400E] mb-1.5">
								הודעת הבהרה ודיסקליימר קריטי למועמדים
							</h2>
							<p className="text-xs sm:text-sm text-[#78350F] leading-relaxed">
								פלטפורמת <strong>קליס (Kalis)</strong> הינה מיזם טכנולוגי עצמאי שנועד לשמש ככלי עזר והדמיה אקדמית בלבד. האתר, מחשבוניו ומנוע ההמלצות אינם פועלים מטעם המועצה להשכלה גבוהה (מל״ג), משרד החינוך, המרכז הארצי לבחינות ולהערכה (מאלו״ו), או מי ממוסדות הלימוד האקדמיים בישראל. <strong>הסמכות הבלעדית והקובעת לקבלה או דחייה לכל תוכנית לימודים הינה של ועדת הקבלה של המוסד האקדמי בלבד.</strong>
							</p>
						</div>
					</div>
				</div>

				{/* Content Sections */}
				<div className="space-y-8 text-sm leading-relaxed text-[#44423D]">
					{/* Section 1 */}
					<section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD4] shadow-xs">
						<div className="flex items-center gap-2.5 mb-3 text-[#222222]">
							<BookOpen className="w-5 h-5 text-[#3C3C3C]" />
							<h3 className="text-lg font-bold">1. מבוא והסכמה לתנאים</h3>
						</div>
						<p className="mb-3">
							ברוכים הבאים לאתר <strong>קליס (Kalis)</strong> (להלן: &quot;האתר&quot; או &quot;השירות&quot;). השימוש באתר, לרבות במחשבוני הסכם, בשאלון האישי, במנוע האופטימיזציה, במאגרי המידע ובתוכניות הלימוד, כפוף להוראות תנאי שימוש אלה (להלן: &quot;תנאי השימוש&quot;) ולמדיניות הפרטיות.
						</p>
						<p>
							בכניסתך לאתר, בגלישה בו או בשימוש בשירותיו, הנך מצהיר ומאשר כי קראת, הבנת והסכמת לכל הוראות תנאי השימוש הללו. אם אינך מסכים לתנאים במלואם, עליך להימנע מכל שימוש באתר.
						</p>
					</section>

					{/* Section 2 */}
					<section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD4] shadow-xs">
						<div className="flex items-center gap-2.5 mb-3 text-[#222222]">
							<ShieldAlert className="w-5 h-5 text-[#3C3C3C]" />
							<h3 className="text-lg font-bold">2. מהות השירות והיעדר מצג קבלה רשמי</h3>
						</div>
						<ul className="list-disc list-inside space-y-2.5 pr-1">
							<li>
								<strong>כלי עזר והדמיה עצמאית:</strong> האתר מספק סימולציה מתמטית והמלצות לשיפור בגרויות ופסיכומטרי על בסיס נוסחאות הקבלה המפורסמות על ידי מוסדות הלימוד. נתונים אלו נועדו לצרכי תכנון אסטרטגי עצמאי בלבד.
							</li>
							<li>
								<strong>תנודתיות סיפי הקבלה:</strong> סיפי הקבלה (הסכמים) המפורסמים באתר מבוססים על נתוני עבר וסיפי קבלה משוערים. כידוע, סיפי קבלה משתנים מדי סמסטר ושנת לימודים בהתאם לרמת הביקוש, למספר המקומות המוקצים בחוגים ולהחלטות ועדות הקבלה המוסדיות.
							</li>
							<li>
								<strong>היעדר הבטחה לקבלה:</strong> הצגת סכם העומד בסף באתר או קבלת תגית &quot;קבלה ודאית&quot; או &quot;זכאות לקבלה ישירה&quot; בסימולטור <strong>אינם מהווים בשום אופן אישור קבלה רשמי או הבטחה משפטית</strong> לכך שהמועמד יתקבל למוסד או לחוג המבוקש.
							</li>
						</ul>
					</section>

					{/* Section 3 */}
					<section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD4] shadow-xs">
						<div className="flex items-center gap-2.5 mb-3 text-[#222222]">
							<Scale className="w-5 h-5 text-[#3C3C3C]" />
							<h3 className="text-lg font-bold">3. הגבלת אחריות מוחלטת (Limitation of Liability)</h3>
						</div>
						<p className="mb-3">
							במידה המרבית המותרת על פי כל דין חל:
						</p>
						<ul className="list-disc list-inside space-y-2.5 pr-1 mb-3">
							<li>
								האתר, מפעיליו, מפתחיו, מנהליו ובעליו לא יישאו בכל אחריות בגין כל נזק, הפסד, הוצאה או עוגמת נפש (ישירים, עקיפים, מקריים, תוצאתיים או מיוחדים) שייגרמו למשתמש או לצד שלישי כלשהו כתוצאה מהסתמכות על המידע המופיע באתר.
							</li>
							<li>
								בכלל זה, מפעילי האתר לא יישאו בכל אחריות לדחיית מועמדות למוסד לימודים, לאובדן שנת לימודים, לתשלום דמי הרשמה למוסד אקדמי או לבחינות פסיכומטרי/בגרות, או לכל החלטה שהתקבלה על סמך חישובי הסכם והמלצות המסלולים.
							</li>
							<li>
								המשתמש נושא באחריות המלאה והבלעדית לוודא מול מחלקת הרישום של מוסד הלימודים הרלוונטי את תנאי הקבלה המדויקים, המועדים ודרישות הסף המעודכנות טרם ביצוע כל פעולת הרשמה או תשלום.
							</li>
						</ul>
					</section>

					{/* Section 4 */}
					<section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD4] shadow-xs">
						<div className="flex items-center gap-2.5 mb-3 text-[#222222]">
							<CheckCircle className="w-5 h-5 text-[#3C3C3C]" />
							<h3 className="text-lg font-bold">4. קניין רוחני וזכויות יוצרים</h3>
						</div>
						<p className="mb-3">
							כל זכויות הקניין הרוחני באתר, לרבות באלגוריתמי האופטימיזציה, במבנה הנתונים, בקוד המקור, בעיצוב הגרפי, בממשק המשתמש (UI/UX), בסמליל (לוגו) ובסימני המסחר שייכות באופן בלעדי למפעילי קליס.
						</p>
						<p>
							חל איסור מוחלט להעתיק, לשכפל, להפיץ, לתרגם, להנדס לאחור (Reverse Engineer), להפעיל סורקים אוטומטיים (Scrapers/Crawlers) או לעשות כל שימוש מסחרי בתכנים או במנוע החישוב ללא קבלת אישור מפורש מראש ובכתב.
						</p>
					</section>

					{/* Section 5 */}
					<section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DFD4] shadow-xs">
						<div className="flex items-center gap-2.5 mb-3 text-[#222222]">
							<ExternalLink className="w-5 h-5 text-[#3C3C3C]" />
							<h3 className="text-lg font-bold">5. דין וסמכות שיפוט</h3>
						</div>
						<p>
							על תנאי שימוש אלה, ועל כל עניין הנובע מהשימוש באתר או הקשור בו, יחולו אך ורק דיני מדינת ישראל. סמכות השיפוט הבלעדית והייחודית בכל מחלוקת או תביעה הנוגעת לאתר תהא מסורה לבתי המשפט המוסמכים במחוז תל אביב-יפו בלבד.
						</p>
					</section>
				</div>

				{/* Bottom Navigation Link */}
				<div className="mt-12 text-center border-t border-[#E5DFD4] pt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-[#66635C]">
					<Link href="/privacy" className="hover:text-[#222222] underline">
						קרא את מדיניות הפרטיות של קליס
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
