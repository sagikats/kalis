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
  Layers,
  TrendingUp,
  Clock,
  Compass,
  Building2
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden bg-slate-50" dir="rtl">

      {/* Decorative Background Blur Gradients */}
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 -z-10 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">

            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-4 py-1.5 text-xs font-bold text-blue-900 border border-blue-200/60 shadow-xs animate-in fade-in duration-300">
              <Zap className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              <span>פלטפורמת אופטימיזציית קבלה לאקדמיה 2026</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-tight">
              ה-Waze של <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">הלמידה שלך</span>
            </h1>

            {/* Subheadline: The existing sentence requested by user */}
            <p className="text-lg text-slate-600 sm:text-xl font-normal leading-relaxed max-w-2xl mx-auto">
              אלגוריתם למידה אדפטיבי שמחשב מסלול מחדש בזמן אמת, מונע שחיקה, ומתאים את עומס השאלות והחזרות המרווחות ללוח הזמנים האמיתי שלך.
            </p>

            {/* Two Main CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/flow')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Sliders className="h-5 w-5" />
                <span>התחל תהליך: בדיקת קבלה ומסלולים</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>

              <button
                onClick={() => router.push('/calculators')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200/90 rounded-2xl shadow-sm hover:shadow transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Calculator className="h-5 w-5 text-blue-600" />
                <span>מחשבון סכם לכל האוניברסיטאות</span>
              </button>
            </div>

            {/* Stats / Trust Badges */}
            <div className="pt-12 grid grid-cols-2 md:grid-cols-3 gap-4 text-center max-w-2xl mx-auto border-t border-slate-200/80">
              <div className="p-3">
                <p className="text-2xl font-black text-blue-600">8</p>
                <p className="text-xs text-slate-500 font-medium">אוניברסיטאות נתמכות במלואן</p>
              </div>
              <div className="p-3">
                <p className="text-2xl font-black text-indigo-600">639</p>
                <p className="text-xs text-slate-500 font-medium">תארים ותוכניות לימוד</p>
              </div>
              <div className="p-3 col-span-2 md:col-span-1">
                <p className="text-2xl font-black text-emerald-600">100%</p>
                <p className="text-xs text-slate-500 font-medium">נוסחאות סכם רשמיות</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3 CORE CAPABILITIES SECTION (Replaces old principles) */}
      <section className="py-20 bg-white border-y border-slate-200/80 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              היכולות המובילות של קליס
            </span>
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl lg:text-5xl">
              שלוש היכולות המרכזיות לשדרוג סיכויי הקבלה שלך
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              ארגז כלים אקדמי מתקדם המשלב מתמטיקה מדויקת, אבחון פערים אישי ומחולל מסלולים חכם לחסכון במאות שעות לימוד.
            </p>
          </div>

          {/* 3 Capabilities Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Capability 1: Multi-University Sekem Calculator */}
            <div className="rounded-3xl bg-slate-50/80 p-8 border border-slate-200/80 hover:border-blue-300 hover:bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-xs">
                    <Calculator className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-2.5 py-1 rounded-full">
                    נוסחאות רשמיות
                  </span>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-400">01. דיוק מתמטי מוחלט</span>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    מחשבון סכם מאוחד ל-8 האוניברסיטאות
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    חישוב סכם סימולטני ומדויק עבור הטכניון, תל אביב, העברית, בן-גוריון, בר-אילן, חיפה, אריאל ורייכמן. כולל שקלול אוטומטי של בונוסי מקצועות, אלגוריתם השמטת מקצועות חוקי (רצפת 20 יח״ל), ואיתור קבלה ישירה על סמך בגרות בלבד.
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">8 מוסדות • עדכון 2026</span>
                <Link
                  href="/calculators"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group-hover:translate-x-[-4px] transition-all"
                >
                  <span>פתח מחשבון</span>
                  <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                </Link>
              </div>
            </div>

            {/* Capability 2: Admission Gap Report & Diagnostic */}
            <div className="rounded-3xl bg-slate-50/80 p-8 border border-slate-200/80 hover:border-indigo-300 hover:bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-xs">
                    <Target className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2.5 py-1 rounded-full">
                    מיפוי 639 תארים
                  </span>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-400">02. אבחון וזיהוי פערים</span>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    בדיקת קבלה ודוח פערים אישי לתואר
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    בחר את החוג והאוניברסיטה המבוקשים וקבל דוח פערים מיידי: המערכת משווה את נתוניך מול סף הקבלה הרשמי, מציגה את הפער המדויק בנקודות סכם, פסיכומטרי וממוצע בגרות, ומסווגת את סיכוייך (קבלה ודאית, בהישג יד, או דורש מאמץ).
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">השוואת ספים בזמן אמת</span>
                <Link
                  href="/flow"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 group-hover:translate-x-[-4px] transition-all"
                >
                  <span>בדוק קבלה לתואר</span>
                  <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                </Link>
              </div>
            </div>

            {/* Capability 3: AI Action Tracks Generator */}
            <div className="rounded-3xl bg-slate-50/80 p-8 border border-slate-200/80 hover:border-emerald-300 hover:bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-xs">
                    <Zap className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-full">
                    מינימום מאמץ
                  </span>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-400">03. מנוע אופטימיזציה בלעדי</span>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                    מחולל מסלולי פעולה חכמים לסגירת הפער
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    האלגוריתם הייחודי של קליס מייצר עבורך 2 מסלולי פעולה מנצחים: מסלול מיקוד בבחינה אחת עם ה-ROI המרבי, ומסלול פיזור סיכונים המשלב שיפורים קלים. המסלולים כוללים לוח זמנים למועדי חורף, אביב וקיץ, מודל תקרה ריאלי לפסיכומטרי וחיסכון בשעות למידה.
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">מסלול A: מיקוד • מסלול B: פיזור</span>
                <Link
                  href="/flow"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 group-hover:translate-x-[-4px] transition-all"
                >
                  <span>בנה מסלולים</span>
                  <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FINAL HIGH IMPACT BOTTOM BANNER */}
      <section className="py-20 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-200 backdrop-blur-sm border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>הדרך החכמה והמהירה ביותר להתקבל לתואר</span>
          </div>

          <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl tracking-tight">
            מוכן למצוא את המסלול הקצר ביותר לתואר שלך?
          </h2>

          <p className="text-sm sm:text-base text-blue-100/80 max-w-xl mx-auto leading-relaxed">
            התחל בבדיקת סיכויי קבלה ומסלולי שיפור מותאמים אישית, או חשב סכם מדויק לכל 8 האוניברסיטאות בישראל.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => router.push('/flow')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sliders className="h-4 w-4" />
              <span>התחל תהליך: בדיקת קבלה ומסלולים</span>
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>

            <button
              onClick={() => router.push('/calculators')}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calculator className="h-4 w-4 text-cyan-400" />
              <span>מחשבון סכם לכל האוניברסיטאות</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
