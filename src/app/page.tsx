'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Navigation,
  Sliders,
  Sparkles,
  RefreshCw,
  PieChart,
  CalendarCheck,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Target,
  Users
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { UNIVERSITIES, DEGREES, DEGREE_THRESHOLDS } from '../data/mockData';
import { University, Degree } from '../types/planner';

export default function LandingPage() {
  const router = useRouter();
  const { setTargetUniversity, setTargetDegree } = usePlanner();

  const [teaserUniv, setTeaserUniv] = useState<University>('טכניון');
  const [teaserDegree, setTeaserDegree] = useState<Degree>('מדעי המחשב');

  const thresholdData = DEGREE_THRESHOLDS[teaserUniv]?.[teaserDegree] || {
    sekem: 88.5,
    reqMath: 5,
    estHours: 140
  };

  const handleStartOptimizer = () => {
    setTargetUniversity(teaserUniv);
    setTargetDegree(teaserDegree);
    router.push('/flow');
  };

  const handleStartWizard = () => {
    setTargetUniversity(teaserUniv);
    setTargetDegree(teaserDegree);
    router.push('/wizard');
  };

  return (
    <div className="relative overflow-hidden bg-slate-50">

      {/* Decorative Background Blur Gradients */}
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute top-1/3 left-10 -z-10 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">

            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-4 py-1.5 text-xs font-bold text-blue-900 border border-blue-200/60 shadow-xs">
              <Zap className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              <span>טכנולוגיית חישוב מסלול בלעדית לבגרויות ופסיכומטרי 2026</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-tight">
              ה-Waze של <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">הלמידה שלך</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-slate-600 sm:text-xl font-normal leading-relaxed max-w-2xl mx-auto">
              אלגוריתם למידה אדפטיבי שמחשב מסלול מחדש בזמן אמת, מונע שחיקה, ומתאים את עומס השאלות והחזרות המרווחות ללוח הזמנים האמיתי שלך.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStartOptimizer}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-2xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sliders className="h-5 w-5" />
                <span>בדוק סיכויי קבלה ואופטימיזציה</span>
                <ArrowLeft className="h-4 w-4" />
              </button>

              <button
                onClick={handleStartWizard}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span>בנה תוכנית למידה מותאמת</span>
              </button>
            </div>

            {/* Stats Ticker */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-3 gap-4 text-center max-w-2xl mx-auto border-t border-slate-200/80">
              <div className="p-3">
                <p className="text-2xl font-black text-blue-600">94.2%</p>
                <p className="text-xs text-slate-500 font-medium">אחוז הצלחה להגעה לציון היעד</p>
              </div>
              <div className="p-3">
                <p className="text-2xl font-black text-sky-600">120K+</p>
                <p className="text-xs text-slate-500 font-medium">שעות תכנון אדפטיבי</p>
              </div>
              <div className="p-3 col-span-2 md:col-span-1">
                <p className="text-2xl font-black text-cyan-600">4.9/5</p>
                <p className="text-xs text-slate-500 font-medium">דירוג שביעות רצון תלמידים</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* INTERACTIVE TEASER WIDGET */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-blue-500/20">

            {/* Background Accent glow */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-6">

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-900/60 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <Target className="h-4 w-4" />
                    <span>סימולטור חישוב מסלול מהיר</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">כמה שעות נדרשות לקבלה לתואר המבוקש?</h2>
                </div>
                <span className="self-start md:self-auto px-3 py-1 bg-blue-500/20 text-sky-300 border border-blue-500/40 rounded-full text-xs font-semibold">
                  עדכון אלגוריתם: 2026
                </span>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Select University */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">מוסד אקדמי יעד:</label>
                  <select
                    value={teaserUniv}
                    onChange={(e) => setTeaserUniv(e.target.value as University)}
                    className="w-full bg-slate-800/90 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    {UNIVERSITIES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Degree */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">תואר מבוקש:</label>
                  <select
                    value={teaserDegree}
                    onChange={(e) => setTeaserDegree(e.target.value as Degree)}
                    className="w-full bg-slate-800/90 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    {DEGREES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Instant Output Teaser Card */}
              <div className="p-6 rounded-2xl bg-blue-950/60 border border-blue-500/30 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-sky-400 border border-blue-500/30">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-sky-300 font-medium">הערכת שעות לימוד</p>
                    <p className="text-2xl font-black text-white">{thresholdData.estHours} שעות</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-cyan-300 font-medium">סכם קבלה מבוקש</p>
                    <p className="text-2xl font-black text-white">{thresholdData.sekem}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-300 font-medium">היתכנות מסלול</p>
                    <p className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 inline" /> ריאלי בריווח
                    </p>
                  </div>
                </div>

              </div>

              {/* Teaser CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs text-slate-400">
                  💡 חישוב זה מבוסס על אופטימיזציית שילוב 5 יחידות מתמטיקה ופסיכומטרי.
                </p>
                <button
                  onClick={handleStartOptimizer}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <span>בחר מסלול זה ובדוק סיכויים מלאים</span>
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CORE USPs GRID */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              למה kalis?
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              3 העקרונות שמשנים את כללי המשחק
            </h2>
            <p className="text-sm text-slate-600">
              במקום תוכנית לימודים סטאטית שנשברת אחרי יומיים של מילואים או עומס - מערכת אדפטיבית חכמה.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Card 1: Dynamic Rescheduling */}
            <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <RefreshCw className="h-7 w-7 transition-transform group-hover:rotate-180 duration-500" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                  01. חישוב מסלול מחדש (Waze Engine)
                </span>
                <h3 className="text-xl font-bold text-slate-900">Dynamic Rescheduling</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  היית במילואים? חלית? נתקעת בעבודה? לוחצים על "חישוב מסלול מחדש" והמערכת מפזרת מחדש את המשימות שנותרו מבלי ליצור פיגור מצטבר.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>זמן תגובה: מיידי</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
            </div>

            {/* Card 2: 50/30/20 Pedagogical Split */}
            <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                <PieChart className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-md">
                  02. החלוקה הפדגוגית המובילה
                </span>
                <h3 className="text-xl font-bold text-slate-900">50/30/20 Pedagogical Split</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  50% תרגול אקטיבי (Active Recall) מתוך בחינות עבר, 30% סגירת פערים עיונית, ו-20% חזרות מרווחות (Spaced Repetition) למניעת שכחה.
                </p>
              </div>
              {/* Mini visual split bar */}
              <div className="pt-2 space-y-1">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-600 w-1/2" title="50% תרגול" />
                  <div className="h-full bg-sky-500 w-[30%]" title="30% למידה" />
                  <div className="h-full bg-emerald-500 w-[20%]" title="20% חזרה" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>50% תרגול</span>
                  <span>30% תיאוריה</span>
                  <span>20% חזרה</span>
                </div>
              </div>
            </div>

            {/* Card 3: Reality Check & Availability Match */}
            <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <CalendarCheck className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  03. בדיקת היתכנות ומניעת שחיקה
                </span>
                <h3 className="text-xl font-bold text-slate-900">Reality Check Match</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  המערכת משווה את השעות הנדרשות מול היומן השבועי הפנוי שלך (סופ״ש, ערבים, ימי חופש) ומחווה מראש אם התוכנית ריאלית או עמוסה מדי.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>חסימת מילואים ואירועים</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FINAL HIGH IMPACT BOTTOM BANNER */}
      <section className="py-16 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            מוכן למצוא את המסלול הקצר ביותר לתואר?
          </h2>
          <p className="text-sm text-sky-200 max-w-xl mx-auto">
            התחל בבדיקת סיכויי קבלה ואופטימיזציית סכם, או בנה תוכנית למידה מאפס בפחות מ-2 דקות.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleStartOptimizer}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-950 hover:bg-slate-100 font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <Sliders className="h-4 w-4 text-blue-600" />
              <span>עבור לאופטימיזטור קבלה</span>
            </button>
            <button
              onClick={handleStartWizard}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-700/80 hover:bg-blue-700 text-white font-bold text-sm rounded-xl border border-blue-400/40 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>התחל באשף התכנון</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
