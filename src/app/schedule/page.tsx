'use client';

import React, { useState } from 'react';
import {
     Calendar,
     Layers,
     ShieldAlert,
     Lock,
     CheckCircle2,
     ChevronDown,
     ChevronLeft,
     Plus,
     Trash2,
     AlertTriangle,
     Clock,
     Sparkles,
     BookOpen,
     X,
     RefreshCw,
     Info
} from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';
import { CurriculumNode, ExceptionDate } from '../../types/planner';

export default function SchedulePage() {
     const {
          subjectName,
          curriculum,
          exceptions,
          addException,
          removeException,
          updateCurriculumNode,
          recalculateRoute
     } = usePlanner();

     const [activeTab, setActiveTab] = useState<'calendar' | 'curriculum'>('calendar');
     const [showExceptionModal, setShowExceptionModal] = useState(false);

     // Exception form state
     const [exDate, setExDate] = useState('2026-09-15');
     const [exReason, setExReason] = useState('');
     const [exCategory, setExCategory] = useState<ExceptionDate['category']>('מילואים');

     // Expanded nodes state for curriculum tree
     const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
          c1: true,
          c2: true
     });

     const toggleNodeExpand = (id: string) => {
          setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
     };

     const handleCreateException = () => {
          if (!exReason.trim()) return;
          addException({
               date: exDate,
               reason: exReason.trim(),
               category: exCategory
          });
          setExReason('');
          setShowExceptionModal(false);
     };

     const getStatusBadge = (status: CurriculumNode['status']) => {
          switch (status) {
               case 'reviewed':
                    return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md">חזרתי ונבדק ✓</span>;
               case 'practiced':
                    return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-md">תורגל מורחב</span>;
               case 'in_progress':
                    return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">בלמידה אקטיבית</span>;
               default:
                    return <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">טרם התחיל</span>;
          }
     };

     // Generate 8 mock weekly schedule blocks leading to Marathon
     const scheduleWeeks = [
          { weekNum: 1, dateRange: '28.08 - 03.09', title: 'שבוע 1: יסודות חדו״א ותרגול מודרך', hours: 14, status: 'הושלם' },
          { weekNum: 2, dateRange: '04.09 - 10.09', title: 'שבוע 2: אינטגרלים מורכבים ופונקציות מעריכיות', hours: 16, status: 'בתהליך' },
          { weekNum: 3, dateRange: '11.09 - 17.09', title: 'שבוע 3: ווקטורים אלגבריים ומכפלות', hours: 12, status: 'מתוכנן', hasException: true },
          { weekNum: 4, dateRange: '18.09 - 24.09', title: 'שבוע 4: הנדסה אנליטית - מעגל ואליפסה', hours: 15, status: 'מתוכנן' },
          { weekNum: 5, dateRange: '25.09 - 01.10', title: 'שבוע 5: מספרים מרוכבים והצגה קוטבית', hours: 14, status: 'מתוכנן' },
          { weekNum: 6, dateRange: '02.10 - 08.10', title: 'שבוע 6: טריגונומטריה במרחב והסתברות', hours: 15, status: 'מתוכנן' },
          { weekNum: 7, dateRange: '09.10 - 15.10', title: 'שבוע 7: מרתון סימולציה 1 וחזרות מרווחות', hours: 18, status: 'מרתון', isLocked: true },
          { weekNum: 8, dateRange: '16.10 - 22.10', title: 'שבוע 8: מרתון סימולציה 2 וטקטיקת בחינה', hours: 20, status: 'מרתון', isLocked: true }
     ];

     return (
          <div className="min-h-screen bg-slate-50 py-8">
               <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                         <div>
                              <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                                   <Calendar className="h-4 w-4" />
                                   <span>תכנון לו״ז ארוך טווח סילבוס</span>
                              </div>
                              <h1 className="text-2xl font-black text-slate-900">
                                   לוח זמנים ועץ סילבוס - {subjectName}
                              </h1>
                              <p className="text-xs text-slate-600 mt-1">
                                   מבט על של שבועות הלימוד עד מועד הבחינה, ניהול נושאים וחסימת ימי מילואים/אירועים.
                              </p>
                         </div>

                         <button
                              onClick={() => setShowExceptionModal(true)}
                              className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
                         >
                              <ShieldAlert className="h-4 w-4" />
                              <span>+ הוסף חסימת יומן / מילואים</span>
                         </button>
                    </div>

                    {/* TAB SWITCHER */}
                    <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-md">
                         <button
                              onClick={() => setActiveTab('calendar')}
                              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${activeTab === 'calendar'
                                   ? 'bg-white text-indigo-600 shadow-xs'
                                   : 'text-slate-600 hover:text-slate-900'
                                   }`}
                         >
                              <Calendar className="h-4 w-4" />
                              <span>ציר זמן ושבועות לימוד</span>
                         </button>

                         <button
                              onClick={() => setActiveTab('curriculum')}
                              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${activeTab === 'curriculum'
                                   ? 'bg-white text-indigo-600 shadow-xs'
                                   : 'text-slate-600 hover:text-slate-900'
                                   }`}
                         >
                              <Layers className="h-4 w-4" />
                              <span>עץ התקדמות סילבוס</span>
                         </button>
                    </div>

                    {/* TAB 1: TIMELINE CALENDAR */}
                    {activeTab === 'calendar' && (
                         <div className="space-y-6 animate-in fade-in">

                              {/* Exceptions Summary Banner if any exist */}
                              {exceptions.length > 0 && (
                                   <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200/90 space-y-3">
                                        <div className="flex items-center justify-between">
                                             <h4 className="text-xs font-bold text-amber-900 flex items-center gap-2">
                                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                                  חסימות יומן פעילות ({exceptions.length}):
                                             </h4>
                                             <button
                                                  onClick={() => recalculateRoute()}
                                                  className="text-xs text-amber-800 font-bold bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg"
                                             >
                                                  עדכן מסלול מחדש
                                             </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                             {exceptions.map((ex) => (
                                                  <div
                                                       key={ex.id}
                                                       className="p-3 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between"
                                                  >
                                                       <div>
                                                            <span className="font-bold text-amber-900">{ex.date}</span> -{' '}
                                                            <span className="text-slate-700">{ex.reason}</span>
                                                            <span className="inline-block text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md mr-2">
                                                                 {ex.category}
                                                            </span>
                                                       </div>
                                                       <button
                                                            onClick={() => removeException(ex.id)}
                                                            className="text-slate-400 hover:text-red-600"
                                                            title="הסר חסימה"
                                                       >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                       </button>
                                                  </div>
                                             ))}
                                        </div>
                                   </div>
                              )}

                              {/* Timeline Weekly Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                   {scheduleWeeks.map((week) => (
                                        <div
                                             key={week.weekNum}
                                             className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${week.isLocked
                                                  ? 'bg-slate-900 text-white border-slate-800 shadow-md'
                                                  : week.hasException
                                                       ? 'bg-amber-50/50 border-amber-300/80 shadow-xs'
                                                       : 'bg-white border-slate-200/80 shadow-xs hover:shadow-md'
                                                  }`}
                                        >
                                             <div className="space-y-3">
                                                  <div className="flex items-center justify-between text-xs font-bold">
                                                       <span className={week.isLocked ? 'text-indigo-400' : 'text-slate-500'}>
                                                            {week.dateRange}
                                                       </span>
                                                       <span
                                                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${week.isLocked
                                                                 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                                                                 : week.status === 'הושלם'
                                                                      ? 'bg-emerald-100 text-emerald-800'
                                                                      : 'bg-indigo-100 text-indigo-800'
                                                                 }`}
                                                       >
                                                            {week.status}
                                                       </span>
                                                  </div>

                                                  <h4 className={`text-sm font-bold leading-snug ${week.isLocked ? 'text-white' : 'text-slate-900'}`}>
                                                       {week.title}
                                                  </h4>

                                                  {/* Hours counter */}
                                                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                       <Clock className="h-3.5 w-3.5" />
                                                       <span>{week.hours} שעות מתוכננות</span>
                                                  </div>
                                             </div>

                                             {/* Lock Banner for Marathon Week */}
                                             {week.isLocked && (
                                                  <div className="p-2.5 bg-indigo-950/80 rounded-xl border border-indigo-800 text-[11px] text-indigo-300 flex items-center gap-2">
                                                       <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                                                       <span>נעול - סימולציות בתנאי אמת (14 ימים אחרונים)</span>
                                                  </div>
                                             )}

                                        </div>
                                   ))}
                              </div>

                         </div>
                    )}

                    {/* TAB 2: CURRICULUM TREE VIEW */}
                    {activeTab === 'curriculum' && (
                         <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 animate-in fade-in">
                              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                   <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                             <Layers className="h-5 w-5 text-indigo-600" />
                                             עץ התקדמות נושאי הסילבוס
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                             ניתן לעדכן את סטטוס הלמידה לכל נושא ותת-נושא.
                                        </p>
                                   </div>
                              </div>

                              {/* Tree Nodes */}
                              <div className="space-y-4">
                                   {curriculum.map((chapter) => {
                                        const isExpanded = !!expandedNodes[chapter.id];
                                        return (
                                             <div key={chapter.id} className="border border-slate-200 rounded-2xl overflow-hidden">

                                                  {/* Chapter Header */}
                                                  <div
                                                       onClick={() => toggleNodeExpand(chapter.id)}
                                                       className="p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between transition border-b border-slate-200/60"
                                                  >
                                                       <div className="flex items-center gap-3">
                                                            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            <span className="text-sm font-bold text-slate-900">{chapter.title}</span>
                                                       </div>

                                                       <div className="flex items-center gap-3">
                                                            {getStatusBadge(chapter.status)}
                                                            <span className="text-xs font-semibold text-slate-500">
                                                                 {chapter.completedHours} / {chapter.estimatedHours} שעות
                                                            </span>
                                                       </div>
                                                  </div>

                                                  {/* Subtopics */}
                                                  {isExpanded && chapter.subtopics && (
                                                       <div className="p-4 space-y-3 bg-white">
                                                            {chapter.subtopics.map((sub) => (
                                                                 <div
                                                                      key={sub.id}
                                                                      className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                                                 >
                                                                      <div className="flex items-center gap-2 font-bold text-slate-800">
                                                                           <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                                                                           <span>{sub.title}</span>
                                                                      </div>

                                                                      <div className="flex items-center gap-3 self-end sm:self-auto">
                                                                           <span className="text-slate-500 font-semibold">{sub.estimatedHours} שעות</span>

                                                                           {/* Interactive status selector */}
                                                                           <select
                                                                                value={sub.status}
                                                                                onChange={(e) =>
                                                                                     updateCurriculumNode(sub.id, e.target.value as CurriculumNode['status'])
                                                                                }
                                                                                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700"
                                                                           >
                                                                                <option value="not_started">טרם התחיל</option>
                                                                                <option value="in_progress">בלמידה אקטיבית</option>
                                                                                <option value="practiced">תורגל מורחב</option>
                                                                                <option value="reviewed">חזרתי ונבדק ✓</option>
                                                                           </select>
                                                                      </div>
                                                                 </div>
                                                            ))}
                                                       </div>
                                                  )}

                                             </div>
                                        );
                                   })}
                              </div>

                         </div>
                    )}

               </div>

               {/* CUSTOM EXCEPTIONS MODAL */}
               {showExceptionModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                         <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                   <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                                        הוספת חסימת יומן / מילואים
                                   </h3>
                                   <button onClick={() => setShowExceptionModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="h-4 w-4" />
                                   </button>
                              </div>

                              <div className="space-y-4">
                                   <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">תאריך חסימה:</label>
                                        <input
                                             type="date"
                                             value={exDate}
                                             onChange={(e) => setExDate(e.target.value)}
                                             className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">סיבת החסימה:</label>
                                        <input
                                             type="text"
                                             placeholder="למשל: אימון מילואים 3 ימים"
                                             value={exReason}
                                             onChange={(e) => setExReason(e.target.value)}
                                             className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">קטגוריה:</label>
                                        <select
                                             value={exCategory}
                                             onChange={(e) => setExCategory(e.target.value as ExceptionDate['category'])}
                                             className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                                        >
                                             <option value="מילואים">מילואים</option>
                                             <option value="חופשה">חופשה</option>
                                             <option value="אירוע אישי">אירוע אישי</option>
                                             <option value="אחר">אחר</option>
                                        </select>
                                   </div>

                                   <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                                        💡 המערכת תפעיל חישוב מסלול מחדש ותפזר מחדש את השעות לחסכון בפערים.
                                   </div>
                              </div>

                              <div className="pt-3 flex justify-end gap-2">
                                   <button
                                        onClick={() => setShowExceptionModal(false)}
                                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                                   >
                                        ביטול
                                   </button>
                                   <button
                                        onClick={handleCreateException}
                                        className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
                                   >
                                        הוסף חסימה וחשב מסלול
                                   </button>
                              </div>
                         </div>
                    </div>
               )}

          </div>
     );
}
