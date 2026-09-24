'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sliders,
  Calculator,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Target,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  Compass,
  ArrowUpRight,
  ChevronDown,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import GlowCard from '@/components/common/GlowCard';
import KalisLogo from '@/components/common/KalisLogo';

const HERO_IMAGES = [
  { src: '/images/hero-grad-1.png', alt: 'בוגרי אקדמיה חוגגים קבלה בזריחה' },
  { src: '/images/hero-grad-2.png', alt: 'הנפת כובעי בוגרים לשמיים' },
  { src: '/images/hero-grad-3.png', alt: 'בוגר אקדמיה עם תעודת תואר' },
  { src: '/images/hero-grad-4.png', alt: 'צלליות סטודנטים חוגגים סיום תואר' },
  { src: '/images/hero-grad-5.png', alt: 'בוגרי אוניברסיטה עם כובעי סיום' },
];

export default function LandingPage() {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  // Auto-advance crossfade slideshow every 4.5 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  const FAQ_ITEMS = [
    {
      q: 'איך עובד מחשבון בגרויות וחישוב ממוצע בגרות מיטבי?',
      a: 'מחשבון הבגרויות של מתקבלים משקלל את כל ציוני הבגרות עם הבונוסים האקדמיים הרשמיים (עד 35 נקודות במתמטיקה 5 יח״ל ועד 25 נקודות במקצועות מוגברים), ומפעיל אלגוריתם השמטת מקצועות חוקי (תוך שמירה על רצפת 20 יח״ל לפחות) כדי להפיק עבור כל מועמד את ממוצע הבגרות הגבוה ביותר האפשרי בכל אחת מ-8 האוניברסיטאות.'
    },
    {
      q: 'מהו מחשבון פסיכומטרי וכיצד מחושב סכם בגרויות ופסיכומטרי?',
      a: 'מחשבון פסיכומטרי משקלל את ציון הבחינה הפסיכומטרית הארצית (ציון רב-תחומי, בדגש כמותי לתחומי הנדסה ומדעים מדויקים, או בדגש מילולי למדעי הרוח והחברה) יחד עם ממוצע הבגרויות, בהתאם לנוסחאות הסכם הרשמיות של כל אוניברסיטה (הטכניון, תל אביב, העברית, בן-גוריון, בר-אילן, חיפה, אריאל ורייכמן).'
    },
    {
      q: 'מה ההבדל בין סף קבלה לציון סכם בגרויות?',
      a: 'סכם בגרויות ופסיכומטרי הוא הציון המשוקלל האישי של המועמד. סף קבלה הוא ציון הרף המינימלי שנקבע על ידי האוניברסיטה לקבלה ישירה לחוג מסוים באותה שנת לימודים. מועמד שהסכם שלו שווה לסף הקבלה או גבוה ממנו זכאי לקבלה ישירה לחוג.'
    },
    {
      q: 'איך בודקים סיכויי קבלה ונתוני קבלה לתואר ב-8 האוניברסיטאות בישראל?',
      a: 'מזינים פעם אחת את ציוני הבגרות והפסיכומטרי במערכת מתקבלים, ובוחרים את התארים המבוקשים. המערכת מחשבת באופן מיידי את הסכם האישי מול ספי הקבלה ב-721 תוכניות לימוד ומציגה דוח קבלה אישי מפורט: קבלה ישירה, המתנה, או פער מדויק מהסף הנדרש.'
    },
    {
      q: 'מה עושים אם ציון הסכם נמוך מסף הקבלה לתואר המבוקש?',
      a: 'המערכת מייצרת מסלולי שיפור אופטימליים מותאמים אישית: שדרוג מקצועות בגרות בעלי תמורה גבוהה (ROI), שיפור פסיכומטרי ממוקד, או חלופות קבלה ישירה כגון מכינה קדם-אקדמית ייעודית או אפיק מעבר של האוניברסיטה הפתוחה.'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#FAF8F5] text-[#222222] selection:bg-[#EAE5DB] selection:text-[#222222] overflow-hidden font-sans" dir="rtl">

      {/* Subtle warm ambient lighting */}
      <div className="pointer-events-none fixed top-10 right-1/4 -z-10 w-[550px] h-[550px] bg-[#EFE9DE]/60 rounded-full blur-[140px]" />
      <div className="pointer-events-none fixed top-1/3 left-10 -z-10 w-[600px] h-[600px] bg-[#EAE3D6]/50 rounded-full blur-[160px]" />

      {/* Subtle organic grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #000000 1px, transparent 1px), linear-gradient(to bottom, #000000 1px, transparent 1px)`,
          backgroundSize: '56px 56px'
        }}
      />

      {/* HERO SECTION - FULL WIDTH FROM NAVBAR TO JUST BEFORE SUBHEADLINE */}
      <section className="relative w-full">
        {/* Full-width Edge-to-Edge Banner with Crossfading Images and Static Headline */}
        <div className="relative w-full overflow-hidden border-b border-[#E5DFD4] shadow-xs h-[360px] sm:h-[440px] md:h-[500px] lg:h-[540px] flex flex-col items-center justify-center bg-black/95">
          {/* The 5 Crossfading Images */}
          {HERO_IMAGES.map((img, idx) => {
            const isActive = idx === currentImageIndex;
            return (
              <img
                key={img.src}
                src={img.src}
                alt={img.alt}
                className={`absolute inset-0 w-full h-full object-cover object-center select-none transition-all duration-1000 ease-in-out ${
                  isActive
                    ? 'opacity-85 scale-100'
                    : 'opacity-0 scale-105 pointer-events-none'
                }`}
              />
            );
          })}

          {/* Gradient Overlay for high contrast & clarity */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/35 pointer-events-none" />

          {/* Headline and Subtitle overlaid on the image - 100% STATIC (לא תזוז) */}
          <div className="relative z-10 text-center px-4 sm:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
            {/* Main Headline without emoji */}
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight drop-shadow-2xl select-none">
              הצעד הראשון שלך לאקדמיה
            </h1>

            {/* Academic Optimization Engine Subtitle - Under Headline, Transparent Background, Different Font (font-sans) */}
            <div className="mt-3 sm:mt-5 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base font-sans font-medium text-white/90 tracking-wide select-none drop-shadow-md">
              <span className="flex h-2 w-2 relative">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
              </span>
              <span className="font-bold text-white tracking-wider">2026 // מנוע אופטימיזציה אקדמי</span>
              <span className="text-white/40">|</span>
              <span className="text-white/85">חישוב מדויק ל-8 האוניברסיטאות</span>
            </div>
          </div>

          {/* Carousel Dots Navigation */}
          <div className="absolute bottom-5 z-20 flex items-center gap-1.5 sm:gap-2">
            {HERO_IMAGES.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setCurrentImageIndex(dotIdx)}
                aria-label={`עבור לתמונה ${dotIdx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  dotIdx === currentImageIndex
                    ? 'w-7 bg-white shadow-xs'
                    : 'w-2 bg-white/40 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Subheadline & CTA Buttons Container - Just below the image banner */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-20 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto space-y-7">
            {/* Subheadline */}
            <div className="text-lg sm:text-[22px] md:text-2xl text-[#24211D] font-medium sm:font-semibold leading-relaxed sm:leading-snug max-w-4xl mx-auto tracking-normal">
              <span className="block mb-1 sm:mb-2.5">
                נעשה את זה פשוט, אתם מזינים את הציונים ומה התארים שאתם חולמים עליהם
              </span>
              <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
                <span>אנחנו נגיד לכם מה הדרך</span>
                <span className="relative inline-block font-black text-[#111111] px-0.5">
                  הכי יעילה
                  <svg
                    className="absolute -bottom-2.5 sm:-bottom-3 right-0 w-full h-3 sm:h-3.5 overflow-visible pointer-events-none"
                    viewBox="0 0 100 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="curvedUnderlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 3 2.5 C 30 12, 70 12, 97 2.5"
                      stroke="url(#curvedUnderlineGrad)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span>שבה אתם</span>
                <span className="inline-flex items-center align-middle mx-1.5 -translate-y-0.5">
                  <KalisLogo size="inline" showTagline={false} />
                </span>
              </span>
            </div>

            {/* Two Main CTA Buttons - Clean Editorial Aesthetic */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => router.push('/flow')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-[#3C3C3C] hover:bg-[#2A2A2A] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Sliders className="h-5 w-5 text-white" />
                <span>התחל תהליך: בדיקת קבלה ומסלולים</span>
                <ArrowLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => router.push('/calculators')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-[#222222] bg-white hover:bg-[#F3EFE8] border border-[#DDD7CC] hover:border-[#CDC5B6] rounded-2xl shadow-2xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Calculator className="h-5 w-5 text-[#55524B]" />
                <span>מחשבון סכם לכל האוניברסיטאות</span>
              </button>
            </div>

            {/* Editorial Metrics Bar */}
            <div className="pt-12 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#E5DFD4] rounded-2xl overflow-hidden border border-[#E0DBD0] shadow-xs">
                <div className="bg-white p-5 text-center">
                  <p className="text-3xl font-extrabold font-sans text-[#222222]">
                    8
                  </p>
                  <p className="text-xs text-[#55524B] font-medium mt-1">אוניברסיטאות נתמכות במלואן</p>
                  <span className="text-[10px] text-[#88857E] mt-0.5 block">100% רשמי ומאומת</span>
                </div>

                <div className="bg-white p-5 text-center">
                  <p className="text-3xl font-extrabold font-sans text-[#222222]">
                    721
                  </p>
                  <p className="text-xs text-[#55524B] font-medium mt-1">תארים ותוכניות לימוד</p>
                  <span className="text-[10px] text-[#88857E] mt-0.5 block">מיפוי ספים ארצי</span>
                </div>

                <div className="bg-white p-5 text-center">
                  <p className="text-3xl font-extrabold font-sans text-emerald-700">
                    0
                  </p>
                  <p className="text-xs text-[#55524B] font-medium mt-1">שעות למידה מבוזבזות</p>
                  <span className="text-[10px] text-emerald-600 mt-0.5 block">אופטימיזציית מאמץ בלעדית</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3 CORE CAPABILITIES */}
      <section className="py-20 relative border-t border-[#EAE4D8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E0DBD0] text-[#55524B] text-xs font-semibold shadow-2xs">
              <Cpu className="h-3.5 w-3.5 text-blue-600" />
              <span>יכולות המערכת // ארכיטקטורת מתקבלים</span>
            </div>
            <h2 className="text-3xl font-black sm:text-5xl tracking-tight text-[#222222]">
              שלוש היכולות המרכזיות <br />
              <span className="text-[#44423D]">
                לסגירת פער הקבלה שלך
              </span>
            </h2>
            <p className="text-sm sm:text-base text-[#66635C] max-w-2xl mx-auto">
              חישוב מתמטי מדויק, אבחון פערים אישי ומסלולי שיפור חכמים לחיסכון בעשרות שעות למידה מיותרות.
            </p>
          </div>

          {/* 3 Capabilities Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

            {/* Capability 1: Multi-University Sekem Engine */}
            <GlowCard className="p-8 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F0E8] text-[#222222] border border-[#E5DFD4]">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-bold text-[#66635C] bg-[#F4F0E8] border border-[#E5DFD4] px-3 py-1 rounded-full">
                    01 // מחשבון סכם
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-[#222222]">
                    מחשבון סכם מאוחד ל-8 האוניברסיטאות
                  </h3>
                  <p className="text-sm text-[#55524B] leading-relaxed">
                    חישוב סכם סימולטני ומדויק עבור הטכניון, תל אביב, העברית, בן-גוריון, בר-אילן, חיפה, אריאל ורייכמן. כולל שקלול אוטומטי של בונוסי מקצועות, אלגוריתם השמטת מקצועות חוקי (רצפת 20 יח״ל), ואיתור קבלה ישירה על סמך בגרות בלבד.
                  </p>
                </div>

                {/* Specs Pill List */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#55524B] border border-[#E5DFD4]">
                    ✓ 8 מוסדות רשמיים
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#55524B] border border-[#E5DFD4]">
                    ✓ רצפת 20 יח״ל חוקית
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#55524B] border border-[#E5DFD4]">
                    ✓ קבלה ישירה
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#EAE4D8] flex items-center justify-between">
                <span className="text-xs text-[#88857E]">חישוב בזמן אמת</span>
                <Link
                  href="/calculators"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#222222] hover:text-black transition-all"
                >
                  <span>פתח מחשבון סכם</span>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </GlowCard>

            {/* Capability 2: Admission Gap Report & Diagnostic */}
            <GlowCard className="p-8 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F0E8] text-[#222222] border border-[#E5DFD4]">
                    <Target className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-bold text-[#66635C] bg-[#F4F0E8] border border-[#E5DFD4] px-3 py-1 rounded-full">
                    02 // דוח פערים
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-[#222222]">
                    בדיקת קבלה ודוח פערים אישי לתואר
                  </h3>
                  <p className="text-sm text-[#55524B] leading-relaxed">
                    בחר את החוג והאוניברסיטה המבוקשים וקבל דוח פערים מיידי: המערכת משווה את נתוניך מול סף הקבלה הרשמי, מציגה את הפער המדויק בנקודות סכם, פסיכומטרי וממוצע בגרות, ומסווגת את סיכוייך.
                  </p>
                </div>

                {/* Specs Pill List */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#55524B] border border-[#E5DFD4]">
                    ✓ 721 תוכניות לימוד
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#55524B] border border-[#E5DFD4]">
                    ✓ ספי קבלה עדכניים
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#55524B] border border-[#E5DFD4]">
                    ✓ זיהוי פער נקודתי
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#EAE4D8] flex items-center justify-between">
                <span className="text-xs text-[#88857E]">אבחון מקיף</span>
                <Link
                  href="/flow"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#222222] hover:text-black transition-all"
                >
                  <span>בדוק קבלה לתואר</span>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </GlowCard>

            {/* Capability 3: AI Action Tracks Optimizer */}
            <GlowCard className="p-8 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F0E8] text-[#222222] border border-[#E5DFD4]">
                    <Zap className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-bold text-[#66635C] bg-[#F4F0E8] border border-[#E5DFD4] px-3 py-1 rounded-full">
                    03 // מסלולי פעולה
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-[#222222]">
                    מחולל מסלולי פעולה חכמים לסגירת הפער
                  </h3>
                  <p className="text-sm text-[#55524B] leading-relaxed">
                    האלגוריתם הייחודי של מתקבלים מייצר עבורך 2 מסלולי פעולה מנצחים: מסלול מיקוד בבחינה אחת עם ה-ROI המרבי, ומסלול פיזור סיכונים המשלב שיפורים קלים. המסלולים כוללים לוח זמנים למועדי חורף, אביב וקיץ, מודל תקרה ריאלי לפסיכומטרי וחיסכון בשעות למידה.
                  </p>
                </div>

                {/* Specs Pill List */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#55524B] border border-[#E5DFD4]">
                    ✓ מסלול מיקוד (ROI)
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#55524B] border border-[#E5DFD4]">
                    ✓ מסלול פיזור סיכונים
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF8F5] text-[#55524B] border border-[#E5DFD4]">
                    ✓ חלופת מכינה Opt-In
                  </span>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#EAE4D8] flex items-center justify-between">
                <span className="text-xs text-[#88857E]">אופטימיזציית מאמץ</span>
                <Link
                  href="/flow"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#222222] hover:text-black transition-all"
                >
                  <span>בנה מסלולים אישיים</span>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </GlowCard>

          </div>

        </div>
      </section>

      {/* COMPREHENSIVE SEO KNOWLEDGE & UNIVERSITY HUBS */}
      <section className="py-20 relative border-t border-[#EAE4D8] bg-[#FAF8F5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E0DBD0] text-[#55524B] text-xs font-semibold shadow-2xs">
              <BookOpen className="h-3.5 w-3.5 text-blue-600" />
              <span>מדריך קבלה וחישוב סכם // 8 האוניברסיטאות</span>
            </div>
            <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl tracking-tight text-[#222222]">
              מחשבון בגרויות, מחשבון פסיכומטרי ובירור סיכויי קבלה לתואר
            </h2>
            <p className="text-sm sm:text-base text-[#66635C] max-w-2xl mx-auto">
              כל המידע, ספי הקבלה הרשמיים ונוסחאות הסכם של כל האוניברסיטאות בישראל במקום אחד.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white rounded-2xl border border-[#E5DFD4] p-6 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#F4F0E8] border border-[#E5DFD4] flex items-center justify-center text-[#222222]">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#222222]">מחשבון בגרויות וממוצע מיטבי</h3>
              <p className="text-xs sm:text-sm text-[#55524B] leading-relaxed">
                שקלול ציוני בגרות עם בונוסים אקדמיים (עד 35 נקודות בהגברות 5 יח״ל), אלגוריתם השמטת מקצועות חוקי (רצפת 20 יח״ל) ואיתור קבלה ישירה ללא פסיכומטרי.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-2xl border border-[#E5DFD4] p-6 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#F4F0E8] border border-[#E5DFD4] flex items-center justify-center text-[#222222]">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#222222]">מחשבון פסיכומטרי ודגשים</h3>
              <p className="text-xs sm:text-sm text-[#55524B] leading-relaxed">
                שקלול ציון פסיכומטרי רב-תחומי, דגש כמותי להנדסה ומדעים מדויקים ודגש מילולי. התאמה לנוסחאות הסכם הרשמיות של כל מוסד אקדמי ובירור רמות פטור באנגלית.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-2xl border border-[#E5DFD4] p-6 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#F4F0E8] border border-[#E5DFD4] flex items-center justify-center text-[#222222]">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#222222]">נתוני קבלה וסף קבלה</h3>
              <p className="text-xs sm:text-sm text-[#55524B] leading-relaxed">
                בירור ספי קבלה רשמיים ועדכניים עבור 721 תוכניות לימוד: הנדסה, מדעי המחשב, רפואה, משפטים, מנהל עסקים ופסיכולוגיה. אבחון פער נקודתי מול הרף הנדרש.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-white rounded-2xl border border-[#E5DFD4] p-6 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#F4F0E8] border border-[#E5DFD4] flex items-center justify-center text-[#222222]">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#222222]">שיפור בגרויות, מכינה ואפיק מעבר</h3>
              <p className="text-xs sm:text-sm text-[#55524B] leading-relaxed">
                מסלולי שיפור אופטימליים: תכנון מועדי בחינות חורף וקיץ למינימום עומס, לצד מסלולים עוקפים כגון מכינה קדם-אקדמית ייעודית ואפיק מעבר של האוניברסיטה הפתוחה.
              </p>
            </div>
          </div>

          {/* Quick University Links for SEO Internal Linking */}
          <div className="mt-12 p-6 bg-white rounded-2xl border border-[#E5DFD4] shadow-2xs">
            <h4 className="text-xs font-bold text-[#88857E] uppercase tracking-wider mb-4">
              מחשבוני סכם ייעודיים לפי אוניברסיטה:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/calculators/technion" className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E5DFD4] text-xs font-bold text-[#222222] transition">
                <span>מחשבון סכם טכניון</span>
                <ArrowLeft className="h-3.5 w-3.5 text-[#88857E]" />
              </Link>
              <Link href="/calculators/tau" className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E5DFD4] text-xs font-bold text-[#222222] transition">
                <span>מחשבון סכם תל אביב</span>
                <ArrowLeft className="h-3.5 w-3.5 text-[#88857E]" />
              </Link>
              <Link href="/calculators/huji" className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E5DFD4] text-xs font-bold text-[#222222] transition">
                <span>מחשבון סכם העברית</span>
                <ArrowLeft className="h-3.5 w-3.5 text-[#88857E]" />
              </Link>
              <Link href="/calculators/bgu" className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E5DFD4] text-xs font-bold text-[#222222] transition">
                <span>מחשבון סכם בן-גוריון</span>
                <ArrowLeft className="h-3.5 w-3.5 text-[#88857E]" />
              </Link>
              <Link href="/calculators/bar-ilan" className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E5DFD4] text-xs font-bold text-[#222222] transition">
                <span>מחשבון סכם בר-אילן</span>
                <ArrowLeft className="h-3.5 w-3.5 text-[#88857E]" />
              </Link>
              <Link href="/calculators/haifa" className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E5DFD4] text-xs font-bold text-[#222222] transition">
                <span>מחשבון סכם חיפה</span>
                <ArrowLeft className="h-3.5 w-3.5 text-[#88857E]" />
              </Link>
              <Link href="/calculators/ariel" className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E5DFD4] text-xs font-bold text-[#222222] transition">
                <span>מחשבון סכם אריאל</span>
                <ArrowLeft className="h-3.5 w-3.5 text-[#88857E]" />
              </Link>
              <Link href="/calculators/reichman" className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E5DFD4] text-xs font-bold text-[#222222] transition">
                <span>מחשבון סכם רייכמן</span>
                <ArrowLeft className="h-3.5 w-3.5 text-[#88857E]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION */}
      <section className="py-20 relative border-t border-[#EAE4D8] bg-[#F7F4EE]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E0DBD0] text-[#55524B] text-xs font-semibold shadow-2xs">
              <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>שאלות ותשובות נפוצות</span>
            </div>
            <h2 className="text-3xl font-black sm:text-4xl text-[#222222] tracking-tight">
              שאלות נפוצות על סכם, בגרויות וסיכויי קבלה
            </h2>
            <p className="text-sm sm:text-base text-[#66635C]">
              כל מה שחשוב לדעת על חישוב ממוצע בגרות, ציוני פסיכומטרי, ספי קבלה ושיפור ציונים
            </p>
          </div>

          <div className="space-y-3.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#E5DFD4] overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-right font-bold text-sm sm:text-base text-[#222222] hover:bg-[#FAF8F5] transition cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#88857E] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#55524B] leading-relaxed border-t border-[#F0ECE1]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL EDITORIAL BOTTOM BANNER */}
      <section className="py-20 relative border-t border-[#EAE4D8] bg-[#F4F0E8]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-7 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-[#55524B] border border-[#E0DBD0] shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>הדרך הישירה והבטוחה לקבלה אקדמית</span>
          </div>

          <h2 className="text-3xl font-black sm:text-5xl lg:text-6xl text-[#222222] tracking-tight">
            מוכן למצוא את המסלול הקצר ביותר לתואר שלך?
          </h2>

          <p className="text-base sm:text-lg text-[#55524B] max-w-2xl mx-auto leading-relaxed">
            התחל בבדיקת סיכויי קבלה ומסלולי שיפור מותאמים אישית, או חשב סכם מדויק לכל 8 האוניברסיטאות בישראל.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <button
              onClick={() => router.push('/flow')}
              className="w-full sm:w-auto px-8 py-4 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sliders className="h-4 w-4" />
              <span>התחל תהליך: בדיקת קבלה ומסלולים</span>
              <ArrowLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => router.push('/calculators')}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#F3EFE8] text-[#222222] font-semibold text-sm rounded-2xl border border-[#DDD7CC] hover:border-[#CDC5B6] shadow-2xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calculator className="h-4 w-4 text-[#55524B]" />
              <span>מחשבון סכם לכל האוניברסיטאות</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
