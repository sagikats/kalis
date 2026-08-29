'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
     Calculator,
     GraduationCap,
     Brain,
     Zap,
     Plus,
     Trash2,
     Info,
     CheckCircle2,
     HelpCircle,
     ArrowRight,
     ChevronLeft,
     Award,
     BookOpen
} from 'lucide-react';
import {
     calculateBguAdmission,
     SubjectInput
} from '@/utils/calculators/bguCalculator';
import academicData from '@/data/academicData.json';

const DEFAULT_SUBJECTS: SubjectInput[] = [
     { name: 'תנ"ך', units: 2, grade: 0 },
     { name: 'ספרות', units: 2, grade: 0 },
     { name: 'אזרחות', units: 2, grade: 0 },
     { name: 'היסטוריה', units: 2, grade: 0 },
     { name: 'עברית / הבעה', units: 2, grade: 0 },
     { name: 'אנגלית', units: 5, grade: 0 },
     { name: 'מתמטיקה', units: 5, grade: 0 },
     { name: 'פיזיקה', units: 5, grade: 0 }
];

/** Clean helper to parse number inputs preventing leading zeros (e.g. "085" -> 85) */
function cleanNumberInput(rawVal: string, minVal: number = 0, maxVal: number = 100): number | '' {
     if (rawVal === '') return '';
     // Strip all leading zeros followed by another digit (e.g. "085" -> "85", "005" -> "5")
     const sanitized = rawVal.replace(/^0+(?=\d)/, '');
     const num = parseInt(sanitized, 10);
     if (isNaN(num)) return '';
     return Math.min(maxVal, Math.max(minVal, num));
}

export default function BguCalculatorPage() {
     const [subjects, setSubjects] = useState<SubjectInput[]>(DEFAULT_SUBJECTS);
     const [psychGeneral, setPsychGeneral] = useState<number | ''>(0);
     const [psychQuant, setPsychQuant] = useState<number | ''>(0);

     // New subject state
     const [newSubName, setNewSubName] = useState('');
     const [newSubUnits, setNewSubUnits] = useState(5);
     const [newSubGrade, setNewSubGrade] = useState<number | ''>(0);

     const mathSubject = useMemo(() => subjects.find(s => s.name.includes('מתמטיקה')) || { units: 5, grade: 0 }, [subjects]);
     const physicsSubject = useMemo(() => subjects.find(s => s.name.includes('פיזיקה')), [subjects]);

     // Quantitative psychometric subscore (50-150) normalized for engineering formula (200-800 scale if needed)
     const normalizedQuant = useMemo(() => {
          const quantNum = Number(psychQuant) || 0;
          if (quantNum <= 150 && quantNum >= 50) {
               return Math.round(200 + ((quantNum - 50) / 100) * 600);
          }
          return quantNum;
     }, [psychQuant]);

     const results = useMemo(() => {
          return calculateBguAdmission({
               bagrutSubjects: subjects.map(s => ({ ...s, grade: Number(s.grade) || 0 })),
               psychometricGeneral: Number(psychGeneral) || 0,
               psychometricQuant: normalizedQuant,
               mathGrade: Number(mathSubject.grade) || 0,
               mathUnits: mathSubject.units,
               physicsGrade: Number(physicsSubject?.grade) || 0,
               physicsUnits: physicsSubject?.units || 0
          });
     }, [subjects, psychGeneral, normalizedQuant, mathSubject, physicsSubject]);

     // BGU Programs matching
     const bguData = useMemo(() => {
          return academicData.find(i => i.name.includes('בן גוריון') || i.name.includes('באר שבע'));
     }, []);

     const handleAddSubject = () => {
          if (!newSubName.trim()) return;
          const validGrade = typeof newSubGrade === 'number' ? newSubGrade : 0;
          setSubjects([...subjects, { name: newSubName.trim(), units: newSubUnits, grade: validGrade }]);
          setNewSubName('');
          setNewSubGrade(0);
     };

     const handleRemoveSubject = (index: number) => {
          setSubjects(subjects.filter((_, i) => i !== index));
     };

     const handleUpdateSubject = (index: number, field: keyof SubjectInput, value: any, event?: React.ChangeEvent<HTMLInputElement>) => {
          const updated = [...subjects];
          let val = value;
          if (field === 'grade') {
               val = cleanNumberInput(String(value), 0, 100);
               if (event && event.target) {
                    event.target.value = String(val);
               }
          }
          updated[index] = { ...updated[index], [field]: val };
          setSubjects(updated);
     };

     const handleNumberInputChange = (
          e: React.ChangeEvent<HTMLInputElement>,
          setter: (val: number | '') => void,
          minVal: number,
          maxVal: number
     ) => {
          const cleaned = cleanNumberInput(e.target.value, minVal, maxVal);
          e.target.value = String(cleaned);
          setter(cleaned);
     };

     return (
          <div className="min-h-screen bg-slate-950 text-slate-100 font-sans dir-rtl">
               <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

                    {/* Header */}
                    <div className="space-y-4 text-center max-w-3xl mx-auto">
                         <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                              <GraduationCap className="h-4 w-4" />
                              <span>מחשבון הסכם הרשמי - אוניברסיטת בן-גוריון בנגב (BGU)</span>
                         </div>
                         <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                              חישוב סכם כללי וסכם הנדסה <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">בן-גוריון</span>
                         </h1>
                         <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                              חשב בצורה מדויקת את ממוצע הבגרות המשוקלל, סכם הנדסה וסכם כללי לקבלה למחלקות השונות באוניברסיטת בן-גוריון בנגב.
                         </p>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                         {/* Left Column: Inputs (7 cols) */}
                         <div className="lg:col-span-7 space-y-6">

                              {/* Card 1: Psychometric Scores */}
                              <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
                                   <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                                             <Brain className="h-5 w-5" />
                                        </div>
                                        <div>
                                             <h3 className="text-lg font-bold text-white">1. ציוני בחינה פסיכומטרית</h3>
                                             <p className="text-xs text-slate-400">הזן את הציון הרב-תחומי והציון הפרקי הכמותי</p>
                                        </div>
                                   </div>

                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                             <label className="block text-xs font-bold text-slate-300">
                                                  ציון פסיכומטרי רב-תחומי (200-800):
                                             </label>
                                             <input
                                                  type="number"
                                                  min={200}
                                                  max={800}
                                                  value={psychGeneral}
                                                  onChange={(e) => handleNumberInputChange(e, setPsychGeneral, 0, 800)}
                                                  onBlur={(e) => {
                                                       const cleaned = cleanNumberInput(e.target.value, 0, 800);
                                                       e.target.value = String(cleaned);
                                                       setPsychGeneral(cleaned);
                                                  }}
                                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                                             />
                                        </div>

                                        <div className="space-y-2">
                                             <label className="block text-xs font-bold text-slate-300">
                                                  ציון פרק כמותי (50-150):
                                             </label>
                                             <input
                                                  type="number"
                                                  min={50}
                                                  max={150}
                                                  value={psychQuant}
                                                  onChange={(e) => handleNumberInputChange(e, setPsychQuant, 0, 150)}
                                                  onBlur={(e) => {
                                                       const cleaned = cleanNumberInput(e.target.value, 50, 150);
                                                       e.target.value = String(cleaned);
                                                       setPsychQuant(cleaned);
                                                  }}
                                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                             />
                                        </div>
                                   </div>
                              </div>

                              {/* Card 2: Bagrut Subjects */}
                              <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
                                   <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                        <div className="flex items-center gap-3">
                                             <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                                  <BookOpen className="h-5 w-5" />
                                             </div>
                                             <div>
                                                  <h3 className="text-lg font-bold text-white">2. ציוני תעודת בגרות (0-100)</h3>
                                                  <p className="text-xs text-slate-400">בונוסים מחושבים אוטומטית לפי כללי בן-גוריון (טווח ציונים: 0 עד 100)</p>
                                             </div>
                                        </div>
                                        <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                                             {subjects.length} מקצועות
                                        </span>
                                   </div>

                                   {/* List */}
                                   <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                                        {subjects.map((sub, idx) => (
                                             <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition">
                                                  <input
                                                       type="text"
                                                       value={sub.name}
                                                       onChange={(e) => handleUpdateSubject(idx, 'name', e.target.value)}
                                                       className="bg-transparent border-none text-xs font-bold text-slate-200 focus:outline-none flex-1"
                                                  />
                                                  <div className="flex items-center gap-2">
                                                       <select
                                                            value={sub.units}
                                                            onChange={(e) => handleUpdateSubject(idx, 'units', Number(e.target.value))}
                                                            className="bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 font-bold px-2 py-1"
                                                       >
                                                            <option value={2}>2 יח"ל</option>
                                                            <option value={3}>3 יח"ל</option>
                                                            <option value={4}>4 יח"ל</option>
                                                            <option value={5}>5 יח"ל</option>
                                                       </select>
                                                       <input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={sub.grade}
                                                            onChange={(e) => handleUpdateSubject(idx, 'grade', e.target.value, e)}
                                                            onBlur={(e) => {
                                                                 const cleaned = cleanNumberInput(e.target.value, 0, 100);
                                                                 e.target.value = String(cleaned);
                                                                 handleUpdateSubject(idx, 'grade', cleaned);
                                                            }}
                                                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-cyan-400 text-center py-1"
                                                       />
                                                       <button
                                                            onClick={() => handleRemoveSubject(idx)}
                                                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                                                       >
                                                            <Trash2 className="h-4 w-4" />
                                                       </button>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>

                                   {/* Add Subject row */}
                                   <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                                        <input
                                             type="text"
                                             placeholder="שם מקצוע בגרות נוסף..."
                                             value={newSubName}
                                             onChange={(e) => setNewSubName(e.target.value)}
                                             className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:ring-1 focus:ring-cyan-500"
                                        />
                                        <select
                                             value={newSubUnits}
                                             onChange={(e) => setNewSubUnits(Number(e.target.value))}
                                             className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-bold px-2 py-2"
                                        >
                                             <option value={5}>5 יח"ל</option>
                                             <option value={4}>4 יח"ל</option>
                                             <option value={3}>3 יח"ל</option>
                                             <option value={2}>2 יח"ל</option>
                                        </select>
                                        <input
                                             type="number"
                                             min={0}
                                             max={100}
                                             value={newSubGrade}
                                             onChange={(e) => handleNumberInputChange(e, setNewSubGrade, 0, 100)}
                                             onBlur={(e) => {
                                                  const cleaned = cleanNumberInput(e.target.value, 0, 100);
                                                  e.target.value = String(cleaned);
                                                  setNewSubGrade(cleaned);
                                             }}
                                             className="w-16 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-cyan-300 text-center py-2"
                                        />
                                        <button
                                             onClick={handleAddSubject}
                                             className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                                        >
                                             <Plus className="h-4 w-4" />
                                             <span>הוסף</span>
                                        </button>
                                   </div>
                              </div>

                              {/* Calculate Action Button */}
                              <button
                                   onClick={() => {
                                        const resultsElem = document.getElementById('results-section');
                                        resultsElem?.scrollIntoView({ behavior: 'smooth' });
                                   }}
                                   className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2 group"
                              >
                                   <Zap className="h-5 w-5 text-yellow-300 group-hover:scale-110 transition-transform" />
                                   <span>חשב / עדכן סכם בן-גוריון עכשיו</span>
                              </button>

                         </div>

                         {/* Right Column: Calculations & Results (5 cols) */}
                         <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8" id="results-section">

                              {/* Results Summary Box */}
                              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/80 rounded-3xl p-6 border border-cyan-500/30 shadow-2xl space-y-6">

                                   <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                                             <Award className="h-5 w-5 text-cyan-400" />
                                             תוצאות חישוב סכם בן-גוריון
                                        </h3>
                                        <span className="text-[10px] text-cyan-300 font-extrabold bg-cyan-500/20 px-2.5 py-1 rounded-full border border-cyan-500/30">
                                             מעודכן ל-2026
                                        </span>
                                   </div>

                                   {/* Score Cards */}
                                   <div className="space-y-4">
                                        {/* Bagrut Avg */}
                                        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                                             <div>
                                                  <span className="text-xs text-slate-400 font-bold block">ממוצע בגרות משוקלל (עם בונוסים):</span>
                                                  <span className="text-2xl font-black text-white mt-0.5 block">{results.bagrutAverage}</span>
                                             </div>
                                             {results.directBagrutEligible && (
                                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                                       אפיק קבלה ישיר זמין!
                                                  </span>
                                             )}
                                        </div>

                                        {/* General Sekem */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-950 border border-blue-800/80 flex items-center justify-between">
                                             <div>
                                                  <span className="text-xs text-blue-300 font-bold block">סכם כללי (200-800):</span>
                                                  <span className="text-3xl font-black text-cyan-300 mt-0.5 block">{results.generalSekem}</span>
                                             </div>
                                             <Zap className="h-6 w-6 text-cyan-400" />
                                        </div>

                                        {/* Engineering Sekem */}
                                        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 to-slate-950 border border-indigo-700/80 flex items-center justify-between">
                                             <div>
                                                  <span className="text-xs text-indigo-300 font-bold block">סכם הנדסה / כמותי (200-800):</span>
                                                  <span className="text-3xl font-black text-indigo-300 mt-0.5 block">{results.engineeringSekem}</span>
                                             </div>
                                             <Brain className="h-6 w-6 text-indigo-400" />
                                        </div>
                                   </div>

                                   {/* Quick Action to Optimizer */}
                                   <Link
                                        href="/optimizer?university=אוניברסיטת בן גוריון בנגב"
                                        className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg"
                                   >
                                        <span>מצא חוגים מתאימים באוניברסיטת בן-גוריון</span>
                                        <ChevronLeft className="h-4 w-4" />
                                   </Link>

                              </div>

                              {/* Formula Breakdown Info Box */}
                              <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-4">
                                   <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Info className="h-4 w-4 text-cyan-400" />
                                        איך מחושב הסכם באוניברסיטת בן-גוריון?
                                   </h4>
                                   <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                                        <p>
                                             <strong className="text-slate-200 block mb-0.5">1. סכם כללי (200-800):</strong>
                                             משלב את הציון הפסיכומטרי הרב-תחומי וממוצע הבגרות המשוקלל:
                                             <br />
                                             <code className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-[11px] block mt-1">
                                                  Sekem = 0.5 × פסיכומטרי + 5 × ממוצע בגרות
                                             </code>
                                        </p>
                                        <p>
                                             <strong className="text-slate-200 block mb-0.5">2. סכם הנדסה וכמותי (200-800):</strong>
                                             ניתן משקל מוגבר לפרק הכמותי (50-150) ולציון הבגרות במתמטיקה ובפיזיקה (5 יח"ל):
                                             <br />
                                             <code className="text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-[11px] block mt-1">
                                                  Sekem_Eng = (0.45×כמותי) + (0.25×פסיכומטרי) + (0.30×מתמטיקה) + בונוס פיזיקה
                                             </code>
                                        </p>
                                        <p>
                                             <strong className="text-slate-200 block mb-0.5">3. בונוסים בבגרות בן-גוריון:</strong>
                                             5 יח"ל מתמטיקה/אנגלית/פיזיקה/מדעי המחשב מקבלים בונוס של +25 נקודות. 4 יח"ל מתמטיקה/אנגלית מקבלים +12.5 נקודות.
                                        </p>
                                   </div>
                              </div>

                         </div>

                    </div>

                    {/* Sample Programs matching section */}
                    {bguData && bguData.programs && (
                         <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
                              <div className="flex items-center justify-between">
                                   <div>
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                             <GraduationCap className="h-5 w-5 text-cyan-400" />
                                             סיכויי קבלה למסלולים בולטים בבן-גוריון לפי הנתונים שלך
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                             השוואה מול ספי הקבלה הרשמיים שנשאבו מהאוניברסיטה למועד 2026
                                        </p>
                                   </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   {bguData.programs.slice(0, 9).map((prog, idx) => {
                                        const requiredSekem = (prog as any).sekemScore || prog.admissionThreshold || 600;
                                        const userSekem = prog.fieldOfStudy.includes('הנדס') || prog.fieldOfStudy.includes('מחשב') ? results.engineeringSekem : results.generalSekem;
                                        const isEligible = userSekem >= requiredSekem;

                                        return (
                                             <div key={idx} className={`p-4 rounded-2xl border transition space-y-3 ${isEligible ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-950/80 border-slate-800'}`}>
                                                  <div className="flex items-start justify-between gap-2">
                                                       <span className="text-sm font-bold text-white block">{prog.fieldOfStudy}</span>
                                                       <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${isEligible ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                                                            {isEligible ? 'סיכוי קבלה גבוה' : 'נדרש שיפור'}
                                                       </span>
                                                  </div>
                                                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                                                       <span>סף נדרש: <strong className="text-cyan-400 font-black">{requiredSekem}</strong></span>
                                                       <span>הסכם שלך: <strong className="text-white font-black">{userSekem}</strong></span>
                                                  </div>
                                             </div>
                                        );
                                   })}
                              </div>
                         </div>
                    )}

               </main>
          </div>
     );
}
