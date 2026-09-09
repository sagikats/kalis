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
import InteractiveBackground from '@/components/common/InteractiveBackground';
import GlowCard from '@/components/common/GlowCard';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#06070a] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 overflow-hidden font-sans" dir="rtl">

      {/* Interactive OHZI Canvas Background */}
      <InteractiveBackground />

      {/* Ambient Lighting Spheres */}
      <div className="pointer-events-none fixed top-10 right-1/4 -z-10 w-[550px] h-[550px] bg-blue-600/[0.08] rounded-full blur-[140px]" />
      <div className="pointer-events-none fixed top-1/3 left-10 -z-10 w-[600px] h-[600px] bg-indigo-600/[0.06] rounded-full blur-[160px]" />
      <div className="pointer-events-none fixed bottom-10 right-1/3 -z-10 w-[500px] h-[500px] bg-cyan-500/[0.05] rounded-full blur-[140px]" />

      {/* Grid Pattern Overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-24 lg:pt-32 lg:pb-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-8">

            {/* Top Monospace HUD Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] backdrop-blur-md px-4 py-1.5 text-xs font-mono tracking-wider text-slate-300 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] animate-in fade-in duration-500">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-cyan-400 font-bold">2026 // ADMISSION ENGINE</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">אופטימיזציה אקדמית מתקדמת</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl leading-[1.08]">
              ה-Waze של <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(56,189,248,0.25)]">
                הלמידה שלך
              </span>
            </h1>

            {/* Subheadline (Exact user requested sentence) */}
            <p className="text-base sm:text-xl text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
              אלגוריתם למידה אדפטיבי שמחשב מסלול מחדש בזמן אמת, מונע שחיקה, ומתאים את עומס השאלות והחזרות המרווחות ללוח הזמנים האמיתי שלך.
            </p>

            {/* Two Main CTA Buttons in Award-Winning Aesthetic */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/flow')}
                className="w-full sm:w-auto relative group overflow-hidden flex items-center justify-center gap-3 px-9 py-4.5 text-base font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:shadow-[0_0_50px_rgba(59,130,246,0.55)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out" />
                <Sliders className="h-5 w-5 text-white" />
                <span>התחל תהליך: בדיקת קבלה ומסלולים</span>
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => router.push('/calculators')}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-9 py-4.5 text-base font-bold text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/15 hover:border-white/30 rounded-2xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-[0_0_25px_rgba(255,255,255,0.08)] cursor-pointer"
              >
                <Calculator className="h-5 w-5 text-cyan-400" />
                <span>מחשבון סכם לכל האוניברסיטאות</span>
              </button>
            </div>

            {/* Futuristic HUD Metrics Bar */}
            <div className="pt-16 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-md">
                <div className="bg-[#0c0e14]/90 p-5 text-center group hover:bg-white/[0.03] transition-colors">
                  <p className="text-3xl font-black font-mono bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    8
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">אוניברסיטאות נתמכות במלואן</p>
                  <span className="text-[10px] font-mono text-cyan-400/80 mt-0.5 block">100% רשמי ומאומת</span>
                </div>

                <div className="bg-[#0c0e14]/90 p-5 text-center group hover:bg-white/[0.03] transition-colors">
                  <p className="text-3xl font-black font-mono bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                    639
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">תארים ותוכניות לימוד</p>
                  <span className="text-[10px] font-mono text-indigo-400/80 mt-0.5 block">מיפוי ספים ארצי</span>
                </div>

                <div className="bg-[#0c0e14]/90 p-5 text-center group hover:bg-white/[0.03] transition-colors">
                  <p className="text-3xl font-black font-mono bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                    0
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">שעות למידה מבוזבזות</p>
                  <span className="text-[10px] font-mono text-emerald-400/80 mt-0.5 block">אופטימיזציית מאמץ בלעדית</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3 CORE CAPABILITIES (BENTO GRID - OHZI INTERACTIVE STYLE) */}
      <section className="py-24 relative border-t border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 font-mono text-xs">
              <Cpu className="h-3.5 w-3.5" />
              <span>CORE SYSTEM CAPABILITIES // ארכיטקטורת האתר</span>
            </div>
            <h2 className="text-3xl font-black sm:text-5xl tracking-tight text-white">
              שלוש היכולות המרכזיות <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                לסגירת פער הקבלה שלך
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              טכנולוגיה אקדמית שמרכזת עבורך חישוב מתמטי מדויק, אבחון פערים אישי ומסלולי שיפור חכמים לחיסכון בעשרות שעות למידה מיותרות.
            </p>
          </div>

          {/* 3 Capabilities Glow Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Capability 1: Multi-University Sekem Engine */}
            <GlowCard glowColor="cyan" className="p-8 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                    <Calculator className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
                    01 // SEKEM ENGINE
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">
                    מחשבון סכם מאוחד ל-8 האוניברסיטאות
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    חישוב סכם סימולטני ומדויק עבור הטכניון, תל אביב, העברית, בן-גוריון, בר-אילן, חיפה, אריאל ורייכמן. כולל שקלול אוטומטי של בונוסי מקצועות, אלגוריתם השמטת מקצועות חוקי (רצפת 20 יח״ל), ואיתור קבלה ישירה על סמך בגרות בלבד.
                  </p>
                </div>

                {/* Specs Pill List */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10">
                    ✓ 8 מוסדות רשמיים
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10">
                    ✓ רצפת 20 יח״ל חוקית
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10">
                    ✓ קבלה ישירה
                  </span>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">LIVE CALCULATION</span>
                <Link
                  href="/calculators"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 group-hover:translate-x-[-4px] transition-all"
                >
                  <span>פתח מחשבון סכם</span>
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>
            </GlowCard>

            {/* Capability 2: Admission Gap Report & Diagnostic */}
            <GlowCard glowColor="indigo" className="p-8 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.15)]">
                    <Target className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full">
                    02 // GAP DIAGNOSTIC
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">
                    בדיקת קבלה ודוח פערים אישי לתואר
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    בחר את החוג והאוניברסיטה המבוקשים וקבל דוח פערים מיידי: המערכת משווה את נתוניך מול סף הקבלה הרשמי, מציגה את הפער המדויק בנקודות סכם, פסיכומטרי וממוצע בגרות, ומסווגת את סיכוייך (קבלה ודאית, בהישג יד, או דורש מאמץ).
                  </p>
                </div>

                {/* Specs Pill List */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10">
                    ✓ 639 תוכניות לימוד
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10">
                    ✓ ספי קבלה עדכניים
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10">
                    ✓ זיהוי פער נקודתי
                  </span>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">REAL-TIME GAPS</span>
                <Link
                  href="/flow"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-[-4px] transition-all"
                >
                  <span>בדוק קבלה לתואר</span>
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>
            </GlowCard>

            {/* Capability 3: AI Action Tracks Optimizer */}
            <GlowCard glowColor="blue" className="p-8 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.15)]">
                    <Zap className="h-7 w-7" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-blue-300 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full">
                    03 // ACTION TRACKS
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                    מחולל מסלולי פעולה חכמים לסגירת הפער
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    האלגוריתם הייחודי של קליס מייצר עבורך 2 מסלולי פעולה מנצחים: מסלול מיקוד בבחינה אחת עם ה-ROI המרבי, ומסלול פיזור סיכונים המשלב שיפורים קלים. המסלולים כוללים לוח זמנים למועדי חורף, אביב וקיץ, מודל תקרה ריאלי לפסיכומטרי וחיסכון בשעות למידה.
                  </p>
                </div>

                {/* Specs Pill List */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10">
                    ✓ מסלול מיקוד (ROI)
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10">
                    ✓ מסלול פיזור סיכונים
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 border border-white/10">
                    ✓ חלופת מכינה Opt-In
                  </span>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">EFFORT OPTIMIZATION</span>
                <Link
                  href="/flow"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 group-hover:translate-x-[-4px] transition-all"
                >
                  <span>בנה מסלולים אישיים</span>
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>
            </GlowCard>

          </div>

        </div>
      </section>

      {/* FINAL HIGH IMPACT BOTTOM BANNER */}
      <section className="py-24 relative overflow-hidden border-t border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-blue-950/20 to-[#06070a]" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-1.5 text-xs font-mono text-cyan-300 border border-white/10 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>THE SHORTEST PATH TO ACADEMIC ADMISSION</span>
          </div>

          <h2 className="text-3xl font-black sm:text-5xl lg:text-6xl text-white tracking-tight">
            מוכן למצוא את המסלול הקצר ביותר לתואר שלך?
          </h2>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            התחל בבדיקת סיכויי קבלה ומסלולי שיפור מותאמים אישית, או חשב סכם מדויק לכל 8 האוניברסיטאות בישראל.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => router.push('/flow')}
              className="w-full sm:w-auto relative group overflow-hidden px-9 py-4.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-black text-sm rounded-2xl shadow-[0_0_35px_rgba(59,130,246,0.35)] hover:shadow-[0_0_50px_rgba(59,130,246,0.55)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out" />
              <Sliders className="h-4 w-4" />
              <span>התחל תהליך: בדיקת קבלה ומסלולים</span>
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => router.push('/calculators')}
              className="w-full sm:w-auto px-9 py-4.5 bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-sm rounded-2xl border border-white/15 hover:border-white/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
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
