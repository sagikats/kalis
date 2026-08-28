'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
     Sparkles,
     Calendar,
     BookOpen,
     Clock,
     CheckCircle2,
     AlertTriangle,
     ArrowLeft,
     ArrowRight,
     Zap,
     Layers,
     Check,
     RotateCcw,
     PieChart
} from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';
import { SYLLABUS_TOPICS_MATH_5 } from '../../data/mockData';

export default function WizardPage() {
     const router = useRouter();
     const {
          subjectName,
          examSession,
          examDate,
          selectedTopicIds,
          weeklyAvailability,
          setWizardExamDetails,
          setSelectedTopics,
          setWeeklyAvailability
     } = usePlanner();

     const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

     // Local step 1 state
     const [localSubject, setLocalSubject] = useState(subjectName || 'מתמטיקה 5 יח״ל');
     const [localSession, setLocalSession] = useState(examSession || 'קיץ 2026');
     const [localDate, setLocalDate] = useState(examDate || '2026-06-18');

     // Local step 2 state
     const [localTopics, setLocalTopics] = useState<string[]>(selectedTopicIds);
     const [pageCounter, setPageCounter] = useState<number>(340);

     // Local step 3 grid state: 7 days (Sun-Sat) x 16 slots (08:00 to 24:00)
     const [grid, setGrid] = useState<boolean[][]>(weeklyAvailability);

     const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
     const timeSlots = Array.from({ length: 16 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

     // Calculations for Step 4
     const requiredHours = useMemo(() => {
          return SYLLABUS_TOPICS_MATH_5.filter((t) => localTopics.includes(t.id)).reduce(
               (sum, t) => sum + t.hours,
               0
          );
     }, [localTopics]);

     // Calculate available hours from grid (assuming ~12 weeks to exam)
     const totalWeeklyGridHours = useMemo(() => {
          let count = 0;
          for (let d = 0; d < 7; d++) {
               for (let h = 0; h < 16; h++) {
                    if (grid[d][h]) count += 1;
               }
          }
          return count;
     }, [grid]);

     // Approx available hours until exam date
     const availableHours = useMemo(() => {
          return Math.floor((totalWeeklyGridHours / 7) * 75); // approx 75 study days
     }, [totalWeeklyGridHours]);

     const isFeasible = availableHours >= requiredHours;

     const toggleTopic = (id: string) => {
          if (localTopics.includes(id)) {
               setLocalTopics(localTopics.filter((t) => t !== id));
          } else {
               setLocalTopics([...localTopics, id]);
          }
     };

     const toggleAllTopics = () => {
          if (localTopics.length === SYLLABUS_TOPICS_MATH_5.length) {
               setLocalTopics([]);
          } else {
               setLocalTopics(SYLLABUS_TOPICS_MATH_5.map((t) => t.id));
          }
     };

     const toggleSlot = (dayIdx: number, hourIdx: number) => {
          const updated = grid.map((day, d) =>
               day.map((slot, h) => (d === dayIdx && h === hourIdx ? !slot : slot))
          );
          setGrid(updated);
     };

     const applyPreset = (preset: 'evenings' | 'weekends' | 'full') => {
          const newGrid = Array.from({ length: 7 }, (_, d) =>
               Array.from({ length: 16 }, (_, h) => {
                    if (preset === 'evenings') {
                         // Evenings 18:00 to 22:00 (h index 10 to 14)
                         return h >= 10 && h <= 14;
                    }
                    if (preset === 'weekends') {
                         // Friday & Saturday (d index 5 and 6)
                         return d >= 5;
                    }
                    return true; // full
               })
          );
          setGrid(newGrid);
     };

     const handleFinishWizard = () => {
          setWizardExamDetails(localSubject, localSession, localDate);
          setSelectedTopics(localTopics);
          setWeeklyAvailability(grid);

          // Trigger celebration confetti
          try {
               confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
               });
          } catch {
               // fallback if window window undefined
          }

          router.push('/dashboard');
     };

     return (
          <div className="min-h-screen bg-slate-50 py-10">
               <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                         <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>אשף בניית תוכנית למידה חכמה</span>
                         </div>
                         <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                              תכנון תוכנית למידה אדפטיבית ב-4 צעדים
                         </h1>
                         <p className="text-sm text-slate-600">
                              המערכת תמפה את הסילבוס, תחשב את שעות הפנאי ביומן, ותייצר לוח זמנים מותאם אישית.
                         </p>
                    </div>

                    {/* 4-STEPPER HEADER */}
                    <div className="mb-10 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                         <div className="grid grid-cols-4 gap-2 text-center relative">

                              {[
                                   { id: 1, name: 'תאריך בחינה', icon: Calendar },
                                   { id: 2, name: 'היקף סילבוס', icon: BookOpen },
                                   { id: 3, name: 'זמינות שבועית', icon: Clock },
                                   { id: 4, name: 'סיכום היתכנות', icon: Zap }
                              ].map((s) => {
                                   const Icon = s.icon;
                                   const isActive = step === s.id;
                                   const isDone = step > s.id;
                                   return (
                                        <button
                                             key={s.id}
                                             onClick={() => {
                                                  if (s.id < step || s.id === step + 1) setStep(s.id as 1 | 2 | 3 | 4);
                                             }}
                                             className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${isActive
                                                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200'
                                                  : isDone
                                                       ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                                       : 'bg-slate-100 text-slate-500 font-medium'
                                                  }`}
                                        >
                                             <Icon className="h-4 w-4" />
                                             <span className="text-xs">{s.name}</span>
                                        </button>
                                   );
                              })}

                         </div>
                    </div>

                    {/* STEP 1: EXAM & TARGET DATE */}
                    {step === 1 && (
                         <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 animate-in fade-in">
                              <div className="border-b border-slate-100 pb-4">
                                   <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                        צעד 1: בחר מקצוע, מועד ותאריך בחינה
                                   </h2>
                                   <p className="text-xs text-slate-500 mt-1">
                                        המכשיר יחשב את ספירת הימים לאחור עד למועד הבחינה.
                                   </p>
                              </div>

                              <div className="space-y-6">

                                   {/* Subject selector */}
                                   <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-2">מקצוע בחינה:</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                             {['מתמטיקה 5 יח״ל', 'פסיכומטרי', 'פיזיקה 5 יח״ל', 'אנגלית 5 יח״ל'].map((subj) => (
                                                  <button
                                                       key={subj}
                                                       type="button"
                                                       onClick={() => setLocalSubject(subj)}
                                                       className={`p-3 rounded-xl border text-xs font-bold transition ${localSubject === subj
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                  >
                                                       {subj}
                                                  </button>
                                             ))}
                                        </div>
                                   </div>

                                   {/* Exam session */}
                                   <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-2">מועד בחינה:</label>
                                        <div className="grid grid-cols-3 gap-3">
                                             {['קיץ 2026', 'חורף 2026', 'קיץ 2027'].map((sess) => (
                                                  <button
                                                       key={sess}
                                                       type="button"
                                                       onClick={() => setLocalSession(sess)}
                                                       className={`p-3 rounded-xl border text-xs font-bold transition ${localSession === sess
                                                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                  >
                                                       {sess}
                                                  </button>
                                             ))}
                                        </div>
                                   </div>

                                   {/* Date Picker */}
                                   <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-2">תאריך הבחינה המדויק:</label>
                                        <input
                                             type="date"
                                             value={localDate}
                                             onChange={(e) => setLocalDate(e.target.value)}
                                             className="w-full sm:w-64 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                                        />
                                   </div>

                              </div>

                              <div className="pt-4 border-t border-slate-100 flex justify-end">
                                   <button
                                        onClick={() => setStep(2)}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
                                   >
                                        <span>המשך לבחירת סילבוס</span>
                                        <ArrowLeft className="h-4 w-4" />
                                   </button>
                              </div>

                         </div>
                    )}

                    {/* STEP 2: SYLLABUS SCOPE */}
                    {step === 2 && (
                         <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 animate-in fade-in">
                              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                   <div>
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                             <BookOpen className="h-5 w-5 text-blue-600" />
                                             צעד 2: הגדרת היקף נושאי הלימוד בסילבוס
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                             סמן את הנושאים שאתה צריך ללמוד עבור {localSubject}.
                                        </p>
                                   </div>
                                   <button
                                        onClick={toggleAllTopics}
                                        className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                                   >
                                        {localTopics.length === SYLLABUS_TOPICS_MATH_5.length ? 'בטל הכל' : 'סמן הכל'}
                                   </button>
                              </div>

                              {/* Checklist of topics */}
                              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                   {SYLLABUS_TOPICS_MATH_5.map((t) => {
                                        const isSelected = localTopics.includes(t.id);
                                        return (
                                             <div
                                                  key={t.id}
                                                  onClick={() => toggleTopic(t.id)}
                                                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${isSelected
                                                       ? 'border-indigo-500 bg-indigo-50/60 text-slate-900 shadow-2xs'
                                                       : 'border-slate-200 hover:border-slate-300 text-slate-500 bg-slate-50/50'
                                                       }`}
                                             >
                                                  <div className="flex items-center gap-3">
                                                       <div
                                                            className={`h-5 w-5 rounded-md border flex items-center justify-center transition ${isSelected
                                                                 ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                 : 'border-slate-300 bg-white'
                                                                 }`}
                                                       >
                                                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                                       </div>
                                                       <span className="text-xs font-bold">{t.title}</span>
                                                  </div>
                                                  <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                                       {t.hours} שעות
                                                  </span>
                                             </div>
                                        );
                                   })}
                              </div>

                              {/* Book Page Counter option */}
                              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                   <label className="block text-xs font-bold text-slate-700">
                                        או הגדר היקף עמודים בספר הלימוד (אופציונלי):
                                   </label>
                                   <div className="flex items-center gap-3">
                                        <input
                                             type="number"
                                             value={pageCounter}
                                             onChange={(e) => setPageCounter(Number(e.target.value))}
                                             className="w-28 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-center"
                                        />
                                        <span className="text-xs text-slate-500">עמודים (~{Math.floor(pageCounter / 3)} שעות תרגול)</span>
                                   </div>
                              </div>

                              {/* Total hours counter */}
                              <div className="p-4 rounded-2xl bg-blue-950 text-white flex items-center justify-between">
                                   <div>
                                        <p className="text-xs text-sky-300 font-medium">סה״כ שעות נדרשות לפי הסילבוס שנבחר:</p>
                                        <p className="text-2xl font-black">{requiredHours} שעות לימוד</p>
                                   </div>
                                   <span className="text-xs bg-sky-500/30 text-sky-200 px-3 py-1 rounded-full border border-sky-400/30">
                                        {localTopics.length} נושאים מסומנים
                                   </span>
                              </div>

                              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                   <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                                   >
                                        חזרה
                                   </button>
                                   <button
                                        onClick={() => setStep(3)}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
                                   >
                                        <span>המשך להגדרת זמינות שבועית</span>
                                        <ArrowLeft className="h-4 w-4" />
                                   </button>
                              </div>

                         </div>
                    )}

                    {/* STEP 3: WEEKLY AVAILABILITY GRID PAINTER */}
                    {step === 3 && (
                         <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 animate-in fade-in">
                              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                   <div>
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                             <Clock className="h-5 w-5 text-blue-600" />
                                             צעד 3: צביעת משבצות זמינות ביומן השבועי
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                             לחץ על משבצות שעות הפנאי שלך (סגול/אינדיגו = פנוי ללמידה, אפור = עבודה/לימודים/עיסוקים).
                                        </p>
                                   </div>

                                   {/* Presets */}
                                   <div className="flex gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                                        <button
                                             onClick={() => applyPreset('evenings')}
                                             className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-700 hover:bg-white transition"
                                        >
                                             ערבים בלבד
                                        </button>
                                        <button
                                             onClick={() => applyPreset('weekends')}
                                             className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-700 hover:bg-white transition"
                                        >
                                             סופ״ש
                                        </button>
                                        <button
                                             onClick={() => applyPreset('full')}
                                             className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-blue-600 bg-white shadow-2xs"
                                        >
                                             זמין מלא
                                        </button>
                                   </div>
                              </div>

                              {/* Interactive Grid */}
                              <div className="overflow-x-auto pb-2">
                                   <div className="min-w-[600px] space-y-2">

                                        {/* Header row with days */}
                                        <div className="grid grid-cols-8 gap-1.5 text-center text-xs font-bold text-slate-600 mb-2">
                                             <div className="py-1">שעה / יום</div>
                                             {daysOfWeek.map((day) => (
                                                  <div key={day} className="py-1 bg-slate-100 rounded-lg text-slate-800">
                                                       {day}
                                                  </div>
                                             ))}
                                        </div>

                                        {/* Time slot rows */}
                                        {timeSlots.map((slotTime, hIdx) => (
                                             <div key={slotTime} className="grid grid-cols-8 gap-1.5 items-center">
                                                  <div className="text-[11px] font-semibold text-slate-400 text-center">
                                                       {slotTime}
                                                  </div>
                                                  {daysOfWeek.map((_, dIdx) => {
                                                       const isAvailable = grid[dIdx]?.[hIdx];
                                                       return (
                                                            <button
                                                                 key={`${dIdx}_${hIdx}`}
                                                                 onClick={() => toggleSlot(dIdx, hIdx)}
                                                                 className={`h-7 rounded-lg transition-all duration-150 border ${isAvailable
                                                                      ? 'bg-blue-600 border-blue-700 hover:bg-blue-700 shadow-2xs'
                                                                      : 'bg-slate-100 border-slate-200/60 hover:bg-slate-200/80'
                                                                      }`}
                                                                 title={`${daysOfWeek[dIdx]} בשעה ${slotTime}: ${isAvailable ? 'פנוי' : 'עסוק'}`}
                                                            />
                                                       );
                                                  })}
                                             </div>
                                        ))}

                                   </div>
                              </div>

                              {/* Grid Summary */}
                              <div className="p-4 rounded-2xl bg-slate-100 flex items-center justify-between text-xs text-slate-700 font-semibold">
                                   <span>סה״כ שעות פנויות בשבוע: <strong className="text-blue-600 text-sm font-extrabold">{totalWeeklyGridHours} שעות</strong></span>
                                   <span className="text-slate-500">לחץ שוב על משבצת לבדיקת עומסים</span>
                              </div>

                              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                   <button
                                        onClick={() => setStep(2)}
                                        className="px-6 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                                   >
                                        חזרה
                                   </button>
                                   <button
                                        onClick={() => setStep(4)}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
                                   >
                                        <span>הצג חישוב היתכנות מסלול</span>
                                        <ArrowLeft className="h-4 w-4" />
                                   </button>
                              </div>

                         </div>
                    )}

                    {/* STEP 4: AHA! MOMENT FEASIBILITY SUMMARY */}
                    {step === 4 && (
                         <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg space-y-6 animate-in fade-in">

                              <div className="text-center space-y-2 border-b border-slate-100 pb-6">
                                   <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                        Aha! Moment - ניתוח היתכנות אופטימלי
                                   </span>
                                   <h2 className="text-2xl font-black text-slate-900">
                                        תוצאת חישוב מסלול עבור {localSubject}
                                   </h2>
                              </div>

                              {/* Big Feasibility comparison widget */}
                              <div
                                   className={`p-6 sm:p-8 rounded-3xl border text-center space-y-6 ${isFeasible
                                        ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-blue-950 text-white border-emerald-500/40 shadow-xl'
                                        : 'bg-gradient-to-br from-amber-950 via-slate-900 to-red-950 text-white border-amber-500/40 shadow-xl'
                                        }`}
                              >

                                   <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border bg-white/10 backdrop-blur-md">
                                        {isFeasible ? (
                                             <>
                                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                  <span className="text-emerald-300">תוכנית הלימודים ריאלית וגמישה!</span>
                                             </>
                                        ) : (
                                             <>
                                                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                                                  <span className="text-amber-300">עמוס מדי! מומלץ להוסיף 2 שעות בסופ״ש</span>
                                             </>
                                        )}
                                   </div>

                                   {/* Hour comparison numbers */}
                                   <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto py-2">
                                        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                                             <p className="text-xs text-slate-300">שעות נדרשות בסילבוס</p>
                                             <p className="text-3xl font-black text-white mt-1">{requiredHours} ש׳</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                                             <p className="text-xs text-slate-300">שעות פנויות ביומן</p>
                                             <p className="text-3xl font-black text-emerald-400 mt-1">{availableHours} ש׳</p>
                                        </div>
                                   </div>

                                   <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                        {isFeasible
                                             ? `כל הכבוד! היומן שלך מכיל עודף ביטחון של ${availableHours - requiredHours} שעות למקרה של אירועים בלתי צפויים.`
                                             : 'הפער בין השעות הנדרשות לשעות הפנויות קטן מ-10%. הוספנו 2 שעות לימוד בסופ״ש לאיזון המסלול.'}
                                   </p>

                              </div>

                              {/* Pedagogical Split Visual */}
                              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                                   <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <PieChart className="h-4 w-4 text-blue-600" />
                                        חלוקה פדגוגית מומלצת 50/30/20 לשעות שלך:
                                   </h4>

                                   <div className="grid grid-cols-3 gap-3 text-center text-xs">
                                        <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs">
                                             <p className="font-bold text-blue-600 text-lg">{Math.round(requiredHours * 0.5)} שעות</p>
                                             <p className="text-slate-500 font-semibold mt-0.5">50% תרגול אקטיבי</p>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-sky-200 shadow-2xs">
                                             <p className="font-bold text-sky-600 text-lg">{Math.round(requiredHours * 0.3)} שעות</p>
                                             <p className="text-slate-500 font-semibold mt-0.5">30% למידה עיונית</p>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                                             <p className="font-bold text-emerald-600 text-lg">{Math.round(requiredHours * 0.2)} שעות</p>
                                             <p className="text-slate-500 font-semibold mt-0.5">20% חזרות מרווחות</p>
                                        </div>
                                   </div>
                              </div>

                              {/* Finish CTA */}
                              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                                   <button
                                        onClick={() => setStep(3)}
                                        className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-slate-600 hover:text-slate-900"
                                   >
                                        עדכן זמינות שבועית
                                   </button>
                                   <button
                                        onClick={handleFinishWizard}
                                        className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                   >
                                        <Zap className="h-5 w-5" />
                                        <span>צור תוכנית למידה והפעל את הקוקפיט 🚀</span>
                                   </button>
                              </div>

                         </div>
                    )}

               </div>
          </div>
     );
}
