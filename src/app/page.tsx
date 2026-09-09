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
  ArrowUpRight
} from 'lucide-react';
import GlowCard from '@/components/common/GlowCard';

export default function LandingPage() {
  const router = useRouter();

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

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 lg:pt-28 lg:pb-32 overflow-hidden">
        {/* Top Editorial Badge */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-5 sm:mb-7">
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-[#44423D] border border-[#E0DBD0] shadow-xs animate-in fade-in duration-500">
            <span className="flex h-2 w-2 relative">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span className="text-[#222222] font-bold">2026 // מנוע אופטימיזציה אקדמי</span>
            <span className="text-[#D0CABE]">|</span>
            <span className="text-[#66635C]">חישוב מדויק ל-8 האוניברסיטאות</span>
          </div>
        </div>

        {/* Main Headline - Infinite Moving Marquee Ticker (like itsnotviolent.com) */}
        <div className="relative w-full overflow-hidden py-3 sm:py-5 my-2 group">
          {/* Subtle edge fades for smooth entry & exit */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5]/80 to-transparent z-10" />

          {/* Hidden accessible H1 for SEO */}
          <h1 className="sr-only">הצעד הראשון שלך לאקדמיה</h1>

          {/* Seamless Infinite Running Track */}
          <div className="animate-marquee select-none flex items-center" aria-hidden="true">
            {/* Track A */}
            {[...Array(3)].map((_, i) => (
              <div key={`track-a-${i}`} className="inline-flex items-center gap-3 sm:gap-6 mx-3 sm:mx-6">
                <span className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-[#1A1A1A] whitespace-nowrap">
                  הצעד הראשון שלך לאקדמיה
                </span>
                <span className="animate-emoji-bob text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl select-none inline-block">
                  🧑‍🎓
                </span>
                <span className="text-[#C5B59E] text-xl sm:text-3xl md:text-4xl lg:text-5xl select-none font-light mx-2 sm:mx-4">
                  ✦
                </span>
              </div>
            ))}

            {/* Track B (Identical duplicate for seamless 100% loop) */}
            {[...Array(3)].map((_, i) => (
              <div key={`track-b-${i}`} className="inline-flex items-center gap-3 sm:gap-6 mx-3 sm:mx-6">
                <span className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-[#1A1A1A] whitespace-nowrap">
                  הצעד הראשון שלך לאקדמיה
                </span>
                <span className="animate-emoji-bob text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl select-none inline-block">
                  🧑‍🎓
                </span>
                <span className="text-[#C5B59E] text-xl sm:text-3xl md:text-4xl lg:text-5xl select-none font-light mx-2 sm:mx-4">
                  ✦
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subheadline & CTA Buttons Container */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-5 sm:mt-7">
          <div className="text-center max-w-3xl mx-auto space-y-7">
            {/* Subheadline (Exact user requested sentence) */}
            <p className="text-base sm:text-xl text-[#55524B] font-normal leading-relaxed max-w-2xl mx-auto">
              אלגוריתם למידה אדפטיבי שמחשב מסלול מחדש בזמן אמת, מונע שחיקה, ומתאים את עומס השאלות והחזרות המרווחות ללוח הזמנים האמיתי שלך.
            </p>

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
                    639
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
              <span>יכולות המערכת // ארכיטקטורת קליס</span>
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
                    ✓ 639 תוכניות לימוד
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
                    האלגוריתם הייחודי של קליס מייצר עבורך 2 מסלולי פעולה מנצחים: מסלול מיקוד בבחינה אחת עם ה-ROI המרבי, ומסלול פיזור סיכונים המשלב שיפורים קלים. המסלולים כוללים לוח זמנים למועדי חורף, אביב וקיץ, מודל תקרה ריאלי לפסיכומטרי וחיסכון בשעות למידה.
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
