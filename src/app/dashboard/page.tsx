'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
     CheckSquare,
     Play,
     Pause,
     RotateCcw,
     CheckCircle2,
     Calendar,
     Clock,
     Zap,
     RefreshCw,
     Flame,
     ChevronDown,
     ChevronUp,
     X,
     AlertTriangle,
     Sparkles,
     BookOpen,
     PieChart,
     Volume2,
     VolumeX,
     Plus,
     Check
} from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';
import { DailyTask, TaskType } from '../../types/planner';

export default function DashboardPage() {
     const {
          subjectName,
          examDate,
          tasks,
          streakDays,
          recalculationPending,
          recalculationReason,
          completeTask,
          deferTask,
          addTask,
          recalculateRoute
     } = usePlanner();

     // Pomodoro Modal State
     const [activePomodoroTask, setActivePomodoroTask] = useState<DailyTask | null>(null);
     const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
     const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
     const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

     // Recalculating AI Modal state
     const [showRecalculateModal, setShowRecalculateModal] = useState<boolean>(false);
     const [recalculatingStep, setRecalculatingStep] = useState<number>(1);

     // Weekly Outlook drawer open state
     const [showWeeklyOutlook, setShowWeeklyOutlook] = useState<boolean>(false);

     // Add Task Modal state
     const [showAddTaskModal, setShowAddTaskModal] = useState<boolean>(false);
     const [newTaskTitle, setNewTaskTitle] = useState('');
     const [newTaskType, setNewTaskType] = useState<TaskType>('תרגול שאלות');
     const [newTaskDuration, setNewTaskDuration] = useState(45);

     // Calculate days remaining to exam
     const daysRemaining = Math.max(
          1,
          Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
     );

     // Task filtering
     const todayTasks = tasks.filter((t) => t.isToday || t.status === 'pending');
     const completedTasks = tasks.filter((t) => t.status === 'completed');
     const deferredTasks = tasks.filter((t) => t.status === 'deferred');

     const completedCount = completedTasks.length;
     const totalTodayCount = todayTasks.length;
     const progressPercent = totalTodayCount > 0 ? Math.round((completedCount / (totalTodayCount + completedCount)) * 100) : 67;

     // Pomodoro Timer Effect
     useEffect(() => {
          let interval: NodeJS.Timeout | null = null;
          if (isTimerRunning && timerSeconds > 0) {
               interval = setInterval(() => {
                    setTimerSeconds((prev) => prev - 1);
               }, 1000);
          } else if (timerSeconds === 0 && isTimerRunning) {
               setIsTimerRunning(false);
               try {
                    confetti({ particleCount: 80, spread: 60 });
               } catch { }
          }
          return () => {
               if (interval) clearInterval(interval);
          };
     }, [isTimerRunning, timerSeconds]);

     const openPomodoro = (task: DailyTask) => {
          setActivePomodoroTask(task);
          setTimerSeconds(task.durationMinutes * 60);
          setIsTimerRunning(false);
     };

     const handleCompleteTask = (taskId: string) => {
          completeTask(taskId);
          try {
               confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
          } catch { }
     };

     const handleTriggerRecalculate = () => {
          setShowRecalculateModal(true);
          setRecalculatingStep(1);

          setTimeout(() => setRecalculatingStep(2), 1000);
          setTimeout(() => setRecalculatingStep(3), 2200);
          setTimeout(() => {
               recalculateRoute();
               setShowRecalculateModal(false);
          }, 3200);
     };

     const handleCreateNewTask = () => {
          if (!newTaskTitle.trim()) return;
          addTask({
               topic: newTaskTitle.trim(),
               subject: subjectName,
               durationMinutes: newTaskDuration,
               type: newTaskType,
               status: 'pending',
               dueDate: new Date().toISOString().split('T')[0],
               isToday: true
          });
          setNewTaskTitle('');
          setShowAddTaskModal(false);
     };

     const getTaskBadgeStyle = (type: TaskType) => {
          switch (type) {
               case 'למידה ראשונית':
                    return 'bg-blue-100 text-blue-800 border-blue-200';
               case 'תרגול שאלות':
                    return 'bg-violet-100 text-violet-800 border-violet-200';
               case 'חזרה מרווחת':
                    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
               case 'סימולציה':
                    return 'bg-amber-100 text-amber-800 border-amber-200';
               default:
                    return 'bg-slate-100 text-slate-800 border-slate-200';
          }
     };

     const formatTimer = (secs: number) => {
          const m = Math.floor(secs / 60);
          const s = secs % 60;
          return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
     };

     return (
          <div className="min-h-screen bg-slate-50 py-8">
               <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* TOP COCKPIT HEADER */}
                    <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden space-y-6">
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/60 pb-4">
                              <div>
                                   <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                                        <CheckSquare className="h-4 w-4" />
                                        <span>קוקפיט הלמידה היומי שלי</span>
                                   </div>
                                   <h1 className="text-2xl font-extrabold text-white">
                                        משימות להיום | {subjectName}
                                   </h1>
                              </div>

                              {/* Badges */}
                              <div className="flex items-center gap-3">
                                   {/* Streak */}
                                   <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-md">
                                        <Flame className="h-4 w-4 fill-white" />
                                        <span>{streakDays} ימי רצף!</span>
                                   </div>

                                   {/* Exam Countdown */}
                                   <div className="flex items-center gap-1.5 bg-indigo-500/30 text-indigo-200 px-3.5 py-1.5 rounded-full text-xs font-bold border border-indigo-400/30">
                                        <Calendar className="h-4 w-4 text-indigo-400" />
                                        <span>עוד {daysRemaining} ימים לבחינה</span>
                                   </div>
                              </div>
                         </div>

                         {/* Progress Bar */}
                         <div className="space-y-2">
                              <div className="flex justify-between text-xs font-bold">
                                   <span className="text-slate-300">התקדמות סילבוס כוללת:</span>
                                   <span className="text-emerald-400 font-extrabold">{progressPercent}% הושלמו</span>
                              </div>
                              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                                   <div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                   />
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-400">
                                   <span>32/48 שעות לימוד מתוכננות</span>
                                   <span>16 שעות נותרו למרתון</span>
                              </div>
                         </div>
                    </div>

                    {/* PENDING RECALCULATION BANNER IF DEFERRED */}
                    {recalculationPending && (
                         <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in">
                              <div className="flex items-center gap-3">
                                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                                        <AlertTriangle className="h-5 w-5" />
                                   </div>
                                   <div>
                                        <p className="text-xs font-bold text-amber-900">נדרש חישוב מסלול מחדש (Waze Alert)</p>
                                        <p className="text-xs text-amber-800 mt-0.5">{recalculationReason || 'שינוי בלוח הזמנים דורש פיזור עומסים מחדש'}</p>
                                   </div>
                              </div>
                              <button
                                   onClick={handleTriggerRecalculate}
                                   className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 shrink-0"
                              >
                                   <RefreshCw className="h-4 w-4" />
                                   <span>בצע חישוב מסלול עכשיו</span>
                              </button>
                         </div>
                    )}

                    {/* MAIN CENTER: TODAY'S FOCUS TASKS */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                              <div>
                                   <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-indigo-600" />
                                        משימות להיום בלבד - Today's Focus
                                   </h2>
                                   <p className="text-xs text-slate-500 mt-1">
                                        המשימות הממוקדות שנבחרו ע״י האלגוריתם להיום.
                                   </p>
                              </div>
                              <button
                                   onClick={() => setShowAddTaskModal(true)}
                                   className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200 flex items-center gap-1.5 self-start sm:self-auto"
                              >
                                   <Plus className="h-4 w-4" />
                                   <span>הוסף משימה יומי</span>
                              </button>
                         </div>

                         {/* Task Cards List */}
                         <div className="space-y-4">
                              {todayTasks.length === 0 ? (
                                   <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-slate-800">כל הכבוד! סיימת את כל המשימות להיום!</p>
                                        <p className="text-xs text-slate-500 mt-1">המערכת מעדכנת את הלו״ז למחר.</p>
                                   </div>
                              ) : (
                                   todayTasks.map((task) => {
                                        const isCompleted = task.status === 'completed';
                                        return (
                                             <div
                                                  key={task.id}
                                                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isCompleted
                                                       ? 'bg-emerald-50/40 border-emerald-200 opacity-75'
                                                       : 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md'
                                                       }`}
                                             >

                                                  {/* Right side: badges & topic */}
                                                  <div className="space-y-2">
                                                       <div className="flex items-center gap-2">
                                                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getTaskBadgeStyle(task.type)}`}>
                                                                 {task.type}
                                                            </span>
                                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                                                 {task.subject}
                                                            </span>
                                                       </div>
                                                       <h3 className={`text-base font-bold text-slate-900 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                                                            {task.topic}
                                                       </h3>
                                                       <div className="flex items-center gap-3 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                 <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                                 {task.durationMinutes} דקות
                                                            </span>
                                                       </div>
                                                  </div>

                                                  {/* Left side: actions */}
                                                  <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0">

                                                       {isCompleted ? (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
                                                                 <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                                 בוצע בהצלחה
                                                            </span>
                                                       ) : (
                                                            <>
                                                                 {/* Complete button */}
                                                                 <button
                                                                      onClick={() => handleCompleteTask(task.id)}
                                                                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                                                                      title="סמן כבוצע"
                                                                 >
                                                                      <CheckCircle2 className="h-4 w-4" />
                                                                      <span className="hidden md:inline">סמן כבוצע</span>
                                                                 </button>

                                                                 {/* Pomodoro timer modal button */}
                                                                 <button
                                                                      onClick={() => openPomodoro(task)}
                                                                      className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                                                                      title="הפעל טיימר פוקוס"
                                                                 >
                                                                      <Play className="h-3.5 w-3.5 fill-white" />
                                                                      <span>טיימר פוקוס</span>
                                                                 </button>

                                                                 {/* Defer button */}
                                                                 <button
                                                                      onClick={() => deferTask(task.id)}
                                                                      className="p-2.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-bold transition border border-slate-200 hover:border-amber-200"
                                                                      title="דחה משימה (חישוב מסלול מחדש)"
                                                                 >
                                                                      דחה משימה
                                                                 </button>
                                                            </>
                                                       )}

                                                  </div>

                                             </div>
                                        );
                                   })
                              )}
                         </div>
                    </div>

                    {/* BOTTOM ACTION AREA: RECALCULATE ROUTE BUTTON */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 to-cyan-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-500/30">
                         <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sky-300 text-xs font-bold uppercase">
                                   <RefreshCw className="h-4 w-4" />
                                   <span>Waze Re-Routing Engine</span>
                              </div>
                              <h3 className="text-xl font-bold text-white">
                                   חישוב מסלול מחדש (Recalculate Route)
                              </h3>
                              <p className="text-xs text-sky-200 max-w-md">
                                   נתקעת או שינית תוכניות? בלחיצה אחת האלגוריתם מזרים את המשימות שנותרו ללו״ז מותאם מבלי ליצור שחיקה.
                              </p>
                         </div>

                         <button
                              onClick={handleTriggerRecalculate}
                              className="w-full md:w-auto px-8 py-4 bg-white text-blue-950 hover:bg-slate-100 font-extrabold text-sm rounded-2xl shadow-lg transition transform hover:scale-[1.02] flex items-center justify-center gap-2 shrink-0"
                         >
                              <RefreshCw className="h-5 w-5 text-blue-600" />
                              <span>הפעל חישוב מסלול מחדש 🧭</span>
                         </button>
                    </div>

                    {/* COLLAPSIBLE WEEKLY OUTLOOK DRAWER */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
                         <button
                              onClick={() => setShowWeeklyOutlook(!showWeeklyOutlook)}
                              className="w-full p-6 flex items-center justify-between text-right hover:bg-slate-50 transition"
                         >
                              <div className="flex items-center gap-3">
                                   <Calendar className="h-5 w-5 text-blue-600" />
                                   <div>
                                        <h4 className="text-base font-bold text-slate-900">תצוגה שבועית רחבה (Weekly Outlook)</h4>
                                        <p className="text-xs text-slate-500">מבט על של פיזור עומס השעות לימים הקרובים</p>
                                   </div>
                              </div>
                              {showWeeklyOutlook ? (
                                   <ChevronUp className="h-5 w-5 text-slate-400" />
                              ) : (
                                   <ChevronDown className="h-5 w-5 text-slate-400" />
                              )}
                         </button>

                         {showWeeklyOutlook && (
                              <div className="p-6 border-t border-slate-100 bg-slate-50/50 animate-in fade-in space-y-4">
                                   <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
                                        {[
                                             { day: 'ראשון', count: 3, hours: 2.5, status: 'תקין' },
                                             { day: 'שני', count: 2, hours: 1.5, status: 'תקין' },
                                             { day: 'שלישי', count: 4, hours: 3.0, status: 'עמוס' },
                                             { day: 'רביעי', count: 2, hours: 1.5, status: 'תקין' },
                                             { day: 'חמישי', count: 3, hours: 2.0, status: 'תקין' },
                                             { day: 'שישי', count: 1, hours: 1.0, status: 'קליל' },
                                             { day: 'שבת', count: 2, hours: 2.0, status: 'חזרה' }
                                        ].map((item, idx) => (
                                             <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-center">
                                                  <p className="text-xs font-bold text-slate-800">{item.day}</p>
                                                  <p className="text-lg font-black text-blue-600">{item.hours} ש׳</p>
                                                  <p className="text-[10px] text-slate-500">{item.count} משימות</p>
                                                  <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                       {item.status}
                                                  </span>
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         )}
                    </div>

               </div>

               {/* POMODORO TIMER MODAL */}
               {activePomodoroTask && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                         <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-800 shadow-2xl space-y-6 relative">

                              <button
                                   onClick={() => setActivePomodoroTask(null)}
                                   className="absolute top-4 left-4 text-slate-400 hover:text-white"
                              >
                                   <X className="h-5 w-5" />
                              </button>

                              <div className="text-center space-y-2">
                                   <span className="text-xs font-bold text-blue-400 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800">
                                        סשן פוקוס אקטיבי ⏱️
                                   </span>
                                   <h3 className="text-lg font-bold text-white leading-snug">{activePomodoroTask.topic}</h3>
                                   <p className="text-xs text-slate-400">{activePomodoroTask.subject}</p>
                              </div>

                              {/* Timer Display */}
                              <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-4">
                                   <div className="text-6xl font-black tracking-widest text-blue-400 font-mono">
                                        {formatTimer(timerSeconds)}
                                   </div>

                                   {/* Controls */}
                                   <div className="flex items-center justify-center gap-4 pt-2">
                                        <button
                                             onClick={() => setIsTimerRunning(!isTimerRunning)}
                                             className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition"
                                        >
                                             {isTimerRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-white ml-0.5" />}
                                        </button>
                                        <button
                                             onClick={() => {
                                                  setIsTimerRunning(false);
                                                  setTimerSeconds(activePomodoroTask.durationMinutes * 60);
                                             }}
                                             className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                                        >
                                             <RotateCcw className="h-4 w-4" />
                                        </button>
                                        <button
                                             onClick={() => setSoundEnabled(!soundEnabled)}
                                             className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                                        >
                                             {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
                                        </button>
                                   </div>
                              </div>

                              {/* Finish session button */}
                              <button
                                   onClick={() => {
                                        handleCompleteTask(activePomodoroTask.id);
                                        setActivePomodoroTask(null);
                                   }}
                                   className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                              >
                                   <CheckCircle2 className="h-5 w-5" />
                                   <span>סמן משימה כבוצעה וסגור</span>
                              </button>

                         </div>
                    </div>
               )}

               {/* RECALCULATE ROUTE AI MODAL */}
               {showRecalculateModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                         <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl text-center space-y-6">

                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-blue-600 mx-auto animate-spin">
                                   <RefreshCw className="h-8 w-8" />
                              </div>

                              <div className="space-y-2">
                                   <h3 className="text-xl font-extrabold text-slate-900">אלגוריתם Waze מחשב מסלול מחדש...</h3>
                                   <p className="text-xs text-slate-500">מבצע אופטימיזציית עומסים ומפזר משימות</p>
                              </div>

                              {/* Live recalculation progress steps */}
                              <div className="space-y-3 text-xs font-semibold text-right max-w-xs mx-auto">
                                   <div className={`p-3 rounded-xl flex items-center justify-between border ${recalculatingStep >= 1 ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        <span>1. ניתוח משימות דחויות וחסימות יומן</span>
                                        {recalculatingStep >= 1 && <Check className="h-4 w-4 text-blue-600" />}
                                   </div>
                                   <div className={`p-3 rounded-xl flex items-center justify-between border ${recalculatingStep >= 2 ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        <span>2. איזון חלוקה פדגוגית 50/30/20</span>
                                        {recalculatingStep >= 2 && <Check className="h-4 w-4 text-blue-600" />}
                                   </div>
                                   <div className={`p-3 rounded-xl flex items-center justify-between border ${recalculatingStep >= 3 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        <span>3. מסלול לימוד מעודכן 100%!</span>
                                        {recalculatingStep >= 3 && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                                   </div>
                              </div>

                         </div>
                    </div>
               )}

               {/* ADD TASK MODAL */}
               {showAddTaskModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                         <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                   <h3 className="text-base font-bold text-slate-900">הוספת משימה ליומן היומי</h3>
                                   <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="h-4 w-4" />
                                   </button>
                              </div>

                              <div className="space-y-3">
                                   <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">נושא המשימה:</label>
                                        <input
                                             type="text"
                                             placeholder="למשל: תרגול נגזרות פונקציה מעריכית"
                                             value={newTaskTitle}
                                             onChange={(e) => setNewTaskTitle(e.target.value)}
                                             className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">סוג משימה:</label>
                                        <select
                                             value={newTaskType}
                                             onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                                             className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                                        >
                                             <option value="תרגול שאלות">תרגול שאלות</option>
                                             <option value="למידה ראשונית">למידה ראשונית</option>
                                             <option value="חזרה מרווחת">חזרה מרווחת</option>
                                             <option value="סימולציה">סימולציה</option>
                                        </select>
                                   </div>

                                   <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">משך מתוכנן (בדקות):</label>
                                        <input
                                             type="number"
                                             min={15}
                                             max={180}
                                             step={15}
                                             value={newTaskDuration}
                                             onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                                             className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                                        />
                                   </div>
                              </div>

                              <div className="pt-3 flex justify-end gap-2">
                                   <button
                                        onClick={() => setShowAddTaskModal(false)}
                                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                                   >
                                        ביטול
                                   </button>
                                   <button
                                        onClick={handleCreateNewTask}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                                   >
                                        הוסף משימה
                                   </button>
                              </div>
                         </div>
                    </div>
               )}

          </div>
     );
}
