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
     Building2,
     ChevronLeft,
     Award,
     BookOpen,
     Check,
     Sparkles
} from 'lucide-react';
import { SubjectInput } from '@/utils/calculators/bguCalculator';
import { calculateMultiInstitutionSekem, InstitutionSekemResult } from '@/utils/calculators/multiCalculator';
import academicData from '@/data/academicData.json';

const AVAILABLE_INSTITUTIONS = [
     { id: 'bgu', name: 'בן-גוריון', fullName: 'אוניברסיטת בן-גוריון בנגב', badge: 'ב"ג' },
     { id: 'tau', name: 'תל אביב', fullName: 'אוניברסיטת תל אביב', badge: 'TAU' },
     { id: 'huji', name: 'העברית', fullName: 'האוניברסיטה העברית בירושלים', badge: 'HUJI' },
     { id: 'technion', name: 'הטכניון', fullName: 'הטכניון - מכון טכנולוגי לישראל', badge: 'IIT' },
     { id: 'ariel', name: 'אריאל', fullName: 'אוניברסיטת אריאל בשומרון', badge: 'AU' },
     { id: 'haifa', name: 'חיפה', fullName: 'אוניברסיטת חיפה', badge: 'UOH' }
];

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
     const sanitized = rawVal.replace(/^0+(?=\d)/, '');
     const num = parseInt(sanitized, 10);
     if (isNaN(num)) return '';
     return Math.min(maxVal, Math.max(minVal, num));
}

export default function UnifiedCalculatorPage() {
     const [subjects, setSubjects] = useState<SubjectInput[]>(DEFAULT_SUBJECTS);
     const [psychGeneral, setPsychGeneral] = useState<number | ''>(0);
     const [psychQuant, setPsychQuant] = useState<number | ''>(0);

     // Selected institutions to compare (defaulting to BGU, TAU, HUJI, Technion)
     const [selectedInstIds, setSelectedInstIds] = useState<string[]>(['bgu', 'tau', 'huji', 'technion']);

     // New subject state
     const [newSubName, setNewSubName] = useState('');
     const [newSubUnits, setNewSubUnits] = useState(5);
     const [newSubGrade, setNewSubGrade] = useState<number | ''>(0);

     const mathSubject = useMemo(() => subjects.find(s => s.name.includes('מתמטיקה')) || { units: 5, grade: 0 }, [subjects]);
     const physicsSubject = useMemo(() => subjects.find(s => s.name.includes('פיזיקה')), [subjects]);

     // Quantitative psychometric subscore (50-150) normalized for engineering formula
     const normalizedQuant = useMemo(() => {
          const quantNum = Number(psychQuant) || 0;
          if (quantNum <= 150 && quantNum >= 50) {
               return Math.round(200 + ((quantNum - 50) / 100) * 600);
          }
          return quantNum;
     }, [psychQuant]);

     // Multi-institution calculations
     const institutionResults = useMemo(() => {
          return calculateMultiInstitutionSekem(
               {
                    bagrutSubjects: subjects.map(s => ({ ...s, grade: Number(s.grade) || 0 })),
                    psychometricGeneral: Number(psychGeneral) || 0,
                    psychometricQuant: normalizedQuant,
                    mathGrade: Number(mathSubject.grade) || 0,
                    mathUnits: mathSubject.units,
                    physicsGrade: Number(physicsSubject?.grade) || 0,
                    physicsUnits: physicsSubject?.units || 0
               },
               selectedInstIds
          );
     }, [subjects, psychGeneral, normalizedQuant, mathSubject, physicsSubject, selectedInstIds]);

     const toggleInstitution = (id: string) => {
          if (selectedInstIds.includes(id)) {
               if (selectedInstIds.length === 1) return; // Keep at least one selected
               setSelectedInstIds(selectedInstIds.filter(i => i !== id));
          } else {
               setSelectedInstIds([...selectedInstIds, id]);
          }
     };

     const selectAllInstitutions = () => {
          setSelectedInstIds(AVAILABLE_INSTITUTIONS.map(i => i.id));
     };

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
               <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

                    {/* Header */}
                    <div className="space-y-4 text-center max-w-3xl mx-auto">
                         <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                              <Calculator className="h-4 w-4" />
                              <span>מחשבון סכם וקבלה אחוד לאוניברסיטאות בישראל</span>
                         </div>
                         <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                              מחשבון סכם <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">כלל-אוניברסיטאי</span>
                         </h1>
                         <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                              הזן את ציוני הבגרות והפסיכומטרי שלך פעם אחת בלבד, בחר מוסדות לימוד, וקבל חישוב השוואתי מדויק של ציוני הסכם והתאמה ישירה לחוגים.
                         </p>
                    </div>

                    {/* Institution Multi-Select Chips Bar */}
                    <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                         <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
                              <div className="flex items-center gap-2.5">
                                   <Building2 className="h-5 w-5 text-cyan-400" />
                                   <h3 className="text-base sm:text-lg font-bold text-white">
                                        בחר מוסדות לימוד לחישוב והשוואה:
                                   </h3>
                              </div>
                              <button
                                   onClick={selectAllInstitutions}
                                   className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition underline"
                              >
                                   בחר את כל המוסדות
                              </button>
                         </div>

                         <div className="flex items-center gap-2.5 flex-wrap">
                              {AVAILABLE_INSTITUTIONS.map((inst) => {
                                   const isSelected = selectedInstIds.includes(inst.id);
                                   return (
                                        <button
                                             key={inst.id}
                                             onClick={() => toggleInstitution(inst.id)}
                                             className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border shadow-sm ${isSelected
                                                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-cyan-500/20'
                                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                                  }`}
                                        >
                                             <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-white text-blue-700 font-black' : 'bg-slate-800 text-slate-400'}`}>
                                                  {isSelected ? '✓' : '+'}
                                             </span>
                                             <span>{inst.fullName}</span>
                                        </button>
                                   );
                              })}
                         </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                         {/* Left Column: Inputs (6 cols) */}
                         <div className="lg:col-span-6 space-y-6">

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
                                                  <p className="text-xs text-slate-400">בונוסים מחושבים אוטומטית לפי כללי האוניברסיטאות</p>
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
                                   <span>חשב ועדכן תוצאות לכל המוסדות הנבחרים</span>
                              </button>

                         </div>

                         {/* Right Column: Multi-Institution Comparison Results (6 cols) */}
                         <div className="lg:col-span-6 space-y-6 lg:sticky lg:top-8" id="results-section">

                              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                   <h3 className="text-xl font-black text-white flex items-center gap-2">
                                        <Award className="h-6 w-6 text-cyan-400" />
                                        תוצאות סכם לפי מוסד לימודים
                                   </h3>
                                   <span className="text-xs text-cyan-300 font-extrabold bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
                                        {institutionResults.length} מוסדות מוצגים
                                   </span>
                              </div>

                              {/* Dynamic Grid of Cards per Selected Institution */}
                              <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
                                   {institutionResults.map((res) => (
                                        <div
                                             key={res.institutionId}
                                             className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 hover:border-slate-700 shadow-xl transition space-y-4"
                                        >
                                             <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                                                  <div className="flex items-center gap-3">
                                                       <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${res.badgeColor} flex items-center justify-center text-white font-black text-xs shadow-md`}>
                                                            {res.logoText}
                                                       </div>
                                                       <div>
                                                            <h4 className="text-base font-bold text-white">{res.institutionName}</h4>
                                                            {res.notes && <p className="text-[11px] text-slate-400">{res.notes}</p>}
                                                            {res.droppedSubjects && res.droppedSubjects.length > 0 && (
                                                                  <p className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                                                                       הושמטו למיקסום הממוצע: {res.droppedSubjects.join(', ')}
                                                                  </p>
                                                             )}
                                                       </div>
                                                  </div>
                                                  {res.directBagrutEligible && (
                                                       <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                                            אפיק קבלה ישיר!
                                                       </span>
                                                  )}
                                             </div>

                                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                  {/* Bagrut Avg */}
                                                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                                                       <span className="text-[11px] text-slate-400 block font-bold">ממוצע בגרות</span>
                                                       <span className="text-xl font-black text-white mt-1 block">{res.bagrutAverage}</span>
                                                       {res.optimalUnits && (
                                                            <span className="text-[10px] text-purple-400 font-semibold block mt-0.5">
                                                                 {res.optimalUnits} יח"ל (אופטימלי)
                                                            </span>
                                                       )}
                                                  </div>

                                                  {/* General Sekem */}
                                                  <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/50 text-center">
                                                       <span className="text-[11px] text-blue-300 block font-bold">סכם כללי</span>
                                                       <span className="text-xl font-black text-cyan-300 mt-1 block">{res.generalSekem}</span>
                                                  </div>

                                                  {/* Engineering Sekem */}
                                                  {res.engineeringSekem !== undefined && (
                                                       <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 text-center col-span-2 sm:col-span-1">
                                                            <span className="text-[11px] text-indigo-300 block font-bold">סכם כמותי/הנדסה</span>
                                                            <span className="text-xl font-black text-indigo-300 mt-1 block">{res.engineeringSekem}</span>
                                                       </div>
                                                  )}
                                             </div>

                                             {/* Direct Optimizer Link per Institution */}
                                             <Link
                                                  href={`/optimizer?university=${encodeURIComponent(res.institutionName)}`}
                                                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                                             >
                                                  <span>הצג חוגים מתאימים ב{res.institutionName}</span>
                                                  <ChevronLeft className="h-4 w-4" />
                                             </Link>
                                        </div>
                                   ))}
                              </div>

                         </div>

                    </div>

               </main>
          </div>
     );
}
