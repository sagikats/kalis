'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
     Sliders,
     GraduationCap,
     Award,
     CheckCircle2,
     ArrowLeft,
     ArrowRight,
     Sparkles,
     BookOpen,
     Plus,
     Trash2,
     TrendingUp,
     Zap,
     Clock,
     ShieldCheck,
     Building2,
     Search,
     Info,
     Landmark
} from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';
import { UNIVERSITIES, DEGREES, DEGREE_THRESHOLDS } from '../../data/mockData';
import { University, Degree, AdmissionTrack, TrackId, BagrutSubject } from '../../types/planner';
import { academicInstitutions } from '../../data/academicData';
import { AcademicInstitution, AcademicDegree } from '../../types/academic';

export default function OptimizerPage() {
     const router = useRouter();
     const {
          targetUniversity,
          targetDegree,
          setTargetUniversity,
          setTargetDegree,
          mathUnits,
          mathGrade,
          englishUnits,
          englishGrade,
          setMathGrades,
          setEnglishGrades,
          psychometricScore,
          hasPsychometric,
          setPsychometricScore,
          setSelectedTrack,
          setWizardExamDetails
     } = usePlanner();

     const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

     const [institutionSearch, setInstitutionSearch] = useState('');
     const [programSearch, setProgramSearch] = useState('');
     const [selectedInstId, setSelectedInstId] = useState<string>(() => {
          const found = academicInstitutions.find(i => i.name === targetUniversity);
          return found ? found.id : academicInstitutions[0]?.id || '';
     });

     const currentInstitution = academicInstitutions.find(i => i.id === selectedInstId) || academicInstitutions[0];

     const filteredInstitutions = academicInstitutions.filter(inst =>
          inst.name.toLowerCase().includes(institutionSearch.toLowerCase())
     );

     const filteredPrograms = (currentInstitution?.programs || []).filter(prog =>
          prog.fieldOfStudy.toLowerCase().includes(programSearch.toLowerCase()) ||
          prog.degreeLevel.toLowerCase().includes(programSearch.toLowerCase())
     );

     // Local Form state
     const [localMathUnits, setLocalMathUnits] = useState<number>(mathUnits);
     const [localMathGrade, setLocalMathGrade] = useState<number>(mathGrade);
     const [localEngUnits, setLocalEngUnits] = useState<number>(englishUnits);
     const [localEngGrade, setLocalEngGrade] = useState<number>(englishGrade);
     const [localHasPsych, setLocalHasPsych] = useState<boolean>(hasPsychometric);
     const [localPsychScore, setLocalPsychScore] = useState<number | ''>(
          psychometricScore !== null ? psychometricScore : 650
     );
     const [extraSubjects, setExtraSubjects] = useState<BagrutSubject[]>([
          { id: '1', name: 'פיזיקה', units: 5, grade: 86 }
     ]);

     const [newSubjName, setNewSubjName] = useState('');
     const [newSubjUnits, setNewSubjUnits] = useState<number>(5);
     const [newSubjGrade, setNewSubjGrade] = useState<number>(85);

     const thresholdData = DEGREE_THRESHOLDS[targetUniversity]?.[targetDegree] || {
          sekem: 88.5,
          reqMath: 5,
          estHours: 140
     };

     const handleAddSubject = () => {
          if (!newSubjName.trim()) return;
          setExtraSubjects([
               ...extraSubjects,
               {
                    id: Date.now().toString(),
                    name: newSubjName.trim(),
                    units: newSubjUnits,
                    grade: newSubjGrade
               }
          ]);
          setNewSubjName('');
     };

     const handleRemoveSubject = (id: string) => {
          setExtraSubjects(extraSubjects.filter((s) => s.id !== id));
     };

     const handleCalculate = () => {
          setMathGrades(localMathUnits, localMathGrade);
          setEnglishGrades(localEngUnits, localEngGrade);
          setPsychometricScore(
               localHasPsych && typeof localPsychScore === 'number' ? localPsychScore : null,
               localHasPsych
          );
          setActiveStep(3);
     };

     const handleSelectTrack = (trackId: TrackId, trackSubjectName: string) => {
          setSelectedTrack(trackId);
          setWizardExamDetails(trackSubjectName, 'קיץ 2026', '2026-06-18');
          router.push('/wizard');
     };

     const activeProg = currentInstitution?.programs.find((p) => p.fieldOfStudy === targetDegree);
     const rawSekem = activeProg?.sekemScore ?? activeProg?.admissionThreshold;
     const activeSekem: number = typeof rawSekem === 'number'
          ? rawSekem
          : typeof rawSekem === 'string'
               ? (parseFloat(rawSekem) || thresholdData.sekem)
               : (activeProg?.psychometricScore || thresholdData.sekem);
     const activePsych: number | undefined = activeProg?.psychometricScore ?? undefined;

     const recommendedTracks: AdmissionTrack[] = [
          {
               id: 'recommended',
               title: 'מסלול 1: שדרוג מתמטיקה ל-5 יח״ל',
               subtitle: 'מקסימום תשואה (ROI) - 140 שעות לימוד ממוקדות',
               predictedSekem: Number((activeSekem + 0.8).toFixed(1)),
               thresholdSekem: activeSekem,
               hoursNeeded: 140,
               difficulty: 'מומלץ - מקסימום ROI',
               difficultyColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
               summaryText:
                    'העלאת מתמטיקה מ-4 ל-5 יחידות מעניקה בונוס 35 נקודות משוקלל ופותחת סף קבלה ישיר ללא צורך בשיפור פסיכומטרי.',
               actionPoints: [
                    'בונוס מתמטיקה 35 נקודות משוקלל',
                    'נדרשות 140 שעות לימוד בלבד',
                    'מסלול מהיר ומוכח עם אחוזי קבלה גבוהים ביותר'
               ]
          },
          {
               id: 'psychometric',
               title: `מסלול 2: שיפור פסיכומטרי יעד ${activePsych ?? 710}`,
               subtitle: 'אינטנסיבי - ללא שינוי בבגרויות הקיימות',
               predictedSekem: Number((activeSekem + 0.3).toFixed(1)),
               thresholdSekem: activeSekem,
               hoursNeeded: 240,
               difficulty: 'אינטנסיבי',
               difficultyColor: 'bg-amber-100 text-amber-800 border-amber-300',
               summaryText:
                    `התמקדות בשיפור הציון הכמותי והמילולי בפסיכומטרי ל-${activePsych ?? 710}, משאירה את תעודת הבגרות ללא שינוי.`,
               actionPoints: [
                    'שיפור הפרק הכמותי והמילולי',
                    'נדרשות כ-240 שעות תרגול אקטיבי',
                    'מתאים למי שלא רוצה להיבחן שוב בבגרויות'
               ]
          },
          {
               id: 'combined',
               title: 'מסלול 3: משולב (בגרות מורחבת + פסיכומטרי)',
               subtitle: 'פיזור עומסים מאוזן בין בגרות לפסיכומטרי',
               predictedSekem: Number((activeSekem + 0.5).toFixed(1)),
               thresholdSekem: activeSekem,
               hoursNeeded: 280,
               difficulty: 'משולב ומתואם',
               difficultyColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
               summaryText:
                    'שילוב של הרחבת בגרות במקצוע בחירה יחד עם שיפור פסיכומטרי מאוזן להורדת סיכונים.',
               actionPoints: [
                    'פיזור סיכונים בין בגרויות לפסיכומטרי',
                    'גמישות מרבית בלוח הזמנים'
               ]
          }
     ];

     return (
          <div className="min-h-screen bg-slate-50/60 pb-20">
               <div className="bg-white border-b border-slate-200/80 pt-8 pb-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-3">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>סימולטור קבלה חכם - דאטה ממשלתית רשמית</span>
                                   </div>
                                   <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                        אופטימייזר קבלה אקדמית
                                   </h1>
                                   <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                                        בחר מתוך 100+ מוסדות אקדמיים ו-1,300+ תוכניות לימוד לתואר ראשון ממאגר `data.gov.il`.
                                   </p>
                              </div>
                              <div className="flex items-center gap-3 bg-blue-950 text-white p-3.5 rounded-2xl border border-blue-900 shadow-sm">
                                   <div className="h-10 w-10 rounded-xl bg-blue-600/30 flex items-center justify-center text-cyan-300 font-bold shrink-0">
                                        <Landmark className="h-5 w-5" />
                                   </div>
                                   <div>
                                        <span className="text-[11px] text-sky-300 font-medium block">יעד אקדמי נבחר:</span>
                                        <span className="text-xs font-black">{targetDegree} | {targetUniversity}</span>
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>

               <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
                    <div className="mb-8 flex justify-center">
                         <div className="inline-flex items-center bg-white p-2 rounded-full border border-slate-200/80 shadow-xs gap-2 sm:gap-4">
                              <button
                                   onClick={() => setActiveStep(1)}
                                   className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeStep === 1
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                              >
                                   <Building2 className="h-4 w-4" />
                                   <span>1. יעד אקדמאי (Open Data)</span>
                              </button>
                              <div className="h-4 w-px bg-slate-200" />
                              <button
                                   onClick={() => setActiveStep(2)}
                                   className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeStep === 2
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                              >
                                   <GraduationCap className="h-4 w-4" />
                                   <span>2. ציונים קיימים</span>
                              </button>
                              <div className="h-4 w-px bg-slate-200" />
                              <button
                                   onClick={() => {
                                        if (activeStep >= 2) setActiveStep(3);
                                   }}
                                   className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeStep === 3
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                              >
                                   <Award className="h-4 w-4" />
                                   <span>3. המלצת אלגוריתם</span>
                              </button>
                         </div>
                    </div>

                    {activeStep === 1 && (
                         <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 animate-in fade-in">
                              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                   <div>
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                             <Building2 className="h-5 w-5 text-blue-600" />
                                             בחירת מוסד אקדמי ותוכנית לימודים (יעד אקדמאי)
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                             הנתונים נשאבו בזמן אמת מנתוני משרד החינוך והמל״ג ב-data.gov.il (Resource ID: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">9d656232</code>).
                                        </p>
                                   </div>
                                   <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                        <span>104 מוסדות | 1,311 חוגים לתואר ראשון</span>
                                   </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                   <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                             <label className="block text-sm font-bold text-slate-800">1. בחר מוסד אקדמי:</label>
                                             <span className="text-xs text-slate-500 font-semibold">{filteredInstitutions.length} מוסדות</span>
                                        </div>
                                        <div className="relative">
                                             <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                                             <input
                                                  type="text"
                                                  value={institutionSearch}
                                                  onChange={(e) => setInstitutionSearch(e.target.value)}
                                                  placeholder="חפש מוסד (למשל: הטכניון, העברית, אריאל...)"
                                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                                             />
                                        </div>
                                        <div className="max-h-80 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                                             {filteredInstitutions.map((inst) => {
                                                  const isSelected = selectedInstId === inst.id;
                                                  return (
                                                       <button
                                                            key={inst.id}
                                                            type="button"
                                                            onClick={() => {
                                                                 setSelectedInstId(inst.id);
                                                                 setTargetUniversity(inst.name as University);
                                                                 if (inst.programs[0]) {
                                                                      setTargetDegree(inst.programs[0].fieldOfStudy as Degree);
                                                                 }
                                                            }}
                                                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-right transition-all ${isSelected
                                                                 ? 'border-blue-600 bg-blue-50/90 text-blue-950 font-bold shadow-xs'
                                                                 : 'border-slate-200/80 hover:border-blue-300 text-slate-700 bg-white'
                                                                 }`}
                                                       >
                                                            <div className="flex items-center gap-3">
                                                                 <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                      <Landmark className="h-4 w-4" />
                                                                 </div>
                                                                 <div>
                                                                      <span className="text-xs font-bold block">{inst.name}</span>
                                                                      <span className="text-[10px] text-slate-500 font-medium">{inst.programs.length} תוכניות לימוד</span>
                                                                 </div>
                                                            </div>
                                                            {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />}
                                                       </button>
                                                  );
                                             })}
                                        </div>
                                   </div>

                                   <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                             <label className="block text-sm font-bold text-slate-800">
                                                  2. תוכנית לימודים ב{currentInstitution?.name}:
                                             </label>
                                             <span className="text-xs text-slate-500 font-semibold">{filteredPrograms.length} חוגים</span>
                                        </div>
                                        <div className="relative">
                                             <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                                             <input
                                                  type="text"
                                                  value={programSearch}
                                                  onChange={(e) => setProgramSearch(e.target.value)}
                                                  placeholder="חפש חוג/תואר (למשל: מדעי המחשב, משפטים...)"
                                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                                             />
                                        </div>
                                        <div className="max-h-80 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                                             {filteredPrograms.map((prog, idx) => {
                                                  const isSelected = targetDegree === prog.fieldOfStudy;
                                                  return (
                                                       <button
                                                            key={`${prog.id}-${idx}`}
                                                            type="button"
                                                            onClick={() => setTargetDegree(prog.fieldOfStudy as Degree)}
                                                            className={`w-full flex items-start justify-between p-3.5 rounded-xl border text-right transition-all ${isSelected
                                                                 ? 'border-sky-600 bg-sky-50/90 text-sky-950 font-bold shadow-xs'
                                                                 : 'border-slate-200/80 hover:border-sky-300 text-slate-700 bg-white'
                                                                 }`}
                                                       >
                                                            <div className="flex items-start gap-3 w-full">
                                                                 <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                      <GraduationCap className="h-4 w-4" />
                                                                 </div>
                                                                 <div className="flex-1 min-w-0">
                                                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                                                           <span className="text-xs font-bold block text-slate-900">{prog.fieldOfStudy}</span>
                                                                           <div className="flex items-center gap-1.5 flex-wrap">
                                                                                {prog.sekemScore !== undefined && prog.sekemScore !== null && (
                                                                                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-black">
                                                                                          סכם: {prog.sekemScore}
                                                                                     </span>
                                                                                )}
                                                                                {prog.psychometricScore !== undefined && prog.psychometricScore !== null && (
                                                                                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200 text-[10px] font-black">
                                                                                          פסיכומטרי: {prog.psychometricScore}
                                                                                     </span>
                                                                                )}
                                                                                {prog.registrationStatus && (
                                                                                     <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${prog.registrationStatus.includes('פתוחה')
                                                                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                                          : 'bg-rose-50 text-rose-700 border-rose-200'
                                                                                          }`}>
                                                                                          {prog.registrationStatus}
                                                                                     </span>
                                                                                )}
                                                                           </div>
                                                                      </div>
                                                                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                           <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                                                                                {prog.degreeLevel} {prog.programId ? `(קוד: ${prog.programId})` : ''}
                                                                           </span>
                                                                           {prog.mathRequirement && (
                                                                                <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-semibold rounded-md">
                                                                                     מתמטיקה: {prog.mathRequirement}
                                                                                </span>
                                                                           )}
                                                                           {prog.englishRequirement && (
                                                                                <span className="inline-block px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200/60 text-[10px] font-semibold rounded-md">
                                                                                     אנגלית: {prog.englishRequirement}
                                                                                </span>
                                                                           )}
                                                                      </div>
                                                                      {prog.description && (
                                                                           <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                                                                {prog.description}
                                                                           </p>
                                                                      )}
                                                                 </div>
                                                            </div>
                                                            {isSelected && <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0 mt-0.5 mr-2" />}
                                                       </button>
                                                  );
                                             })}
                                        </div>
                                   </div>
                              </div>

                              {/* Threshold Preview Box */}
                              {(() => {
                                   const activeProg = currentInstitution?.programs.find(p => p.fieldOfStudy === targetDegree);
                                   const activeSekem = activeProg?.sekemScore ?? activeProg?.admissionThreshold ?? thresholdData.sekem;
                                   const activePsych = activeProg?.psychometricScore;

                                   return (
                                        <div className="p-4 sm:p-6 rounded-2xl bg-blue-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-900 shadow-md">
                                             <div className="space-y-1">
                                                  <div className="flex items-center gap-2 text-sky-300 text-xs font-medium">
                                                       <Info className="h-4 w-4 text-cyan-400" />
                                                       <span>סף קבלה משוקלל רשמי / משוער למועד 2026:</span>
                                                  </div>
                                                  <p className="text-2xl font-black mt-1">
                                                       {targetUniversity} - {targetDegree}
                                                  </p>
                                                  <div className="flex items-center gap-3 text-xs sm:text-sm text-sky-200 font-bold flex-wrap pt-1">
                                                       <span>סכם יעד: <span className="text-cyan-400 text-lg font-black">{activeSekem}</span></span>
                                                       {activePsych && (
                                                            <span>| סף פסיכומטרי: <span className="text-indigo-300 text-base font-black">{activePsych}</span></span>
                                                       )}
                                                       {activeProg?.mathRequirement && (
                                                            <span>| דרישת מתמטיקה: <span className="text-amber-300 font-bold">{activeProg.mathRequirement}</span></span>
                                                       )}
                                                       {activeProg?.englishRequirement && (
                                                            <span>| אנגלית: <span className="text-sky-300 font-bold">{activeProg.englishRequirement}</span></span>
                                                       )}
                                                  </div>
                                                  {activeProg?.additionalConditions && (
                                                       <p className="text-[11px] text-sky-200/80 pt-1 line-clamp-2 leading-snug">
                                                            תנאים נוספים: {activeProg.additionalConditions}
                                                       </p>
                                                  )}
                                             </div>
                                             <button
                                                  onClick={() => setActiveStep(2)}
                                                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md shrink-0"
                                             >
                                                  <span>המשך להזנת ציונים</span>
                                                  <ArrowLeft className="h-4 w-4" />
                                             </button>
                                        </div>
                                   );
                              })()}

                         </div>
                    )}

                    {/* STEP 2: CURRENT GRADES INPUT */}
                    {activeStep === 2 && (
                         <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6 animate-in fade-in">
                              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                   <div>
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                             <GraduationCap className="h-5 w-5 text-indigo-600" />
                                             הזן את ציוני הבגרות והפסיכומטרי הקיימים
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                             הנתונים משמשים לחישוב ממוצע הבגרות המשוקלל והסכם הנוכחי.
                                        </p>
                                   </div>
                                   <button
                                        onClick={() => setActiveStep(1)}
                                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                                   >
                                        <ArrowRight className="h-3.5 w-3.5" />
                                        שנה יעד
                                   </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                   {/* Math & English Cards */}
                                   <div className="space-y-4">

                                        {/* Math */}
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                             <label className="block text-sm font-bold text-slate-800">מתמטיקה:</label>
                                             <div className="flex items-center gap-4">
                                                  <div className="flex-1">
                                                       <span className="text-xs text-slate-500 block mb-1">יחידות לימוד:</span>
                                                       <div className="flex gap-2">
                                                            {[3, 4, 5].map((u) => (
                                                                 <button
                                                                      key={u}
                                                                      type="button"
                                                                      onClick={() => setLocalMathUnits(u)}
                                                                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${localMathUnits === u
                                                                           ? 'bg-indigo-600 text-white border-indigo-600'
                                                                           : 'bg-white text-slate-700 border-slate-300'
                                                                           }`}
                                                                 >
                                                                      {u} יח״ל
                                                                 </button>
                                                            ))}
                                                       </div>
                                                  </div>
                                                  <div>
                                                       <span className="text-xs text-slate-500 block mb-1">ציון:</span>
                                                       <input
                                                            type="number"
                                                            min={50}
                                                            max={100}
                                                            value={localMathGrade}
                                                            onChange={(e) => setLocalMathGrade(Number(e.target.value))}
                                                            className="w-20 bg-white border border-slate-300 rounded-lg px-3 py-2 text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                                       />
                                                  </div>
                                             </div>
                                        </div>

                                        {/* English */}
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                             <label className="block text-sm font-bold text-slate-800">אנגלית:</label>
                                             <div className="flex items-center gap-4">
                                                  <div className="flex-1">
                                                       <span className="text-xs text-slate-500 block mb-1">יחידות לימוד:</span>
                                                       <div className="flex gap-2">
                                                            {[4, 5].map((u) => (
                                                                 <button
                                                                      key={u}
                                                                      type="button"
                                                                      onClick={() => setLocalEngUnits(u)}
                                                                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${localEngUnits === u
                                                                           ? 'bg-indigo-600 text-white border-indigo-600'
                                                                           : 'bg-white text-slate-700 border-slate-300'
                                                                           }`}
                                                                 >
                                                                      {u} יח״ל
                                                                 </button>
                                                            ))}
                                                       </div>
                                                  </div>
                                                  <div>
                                                       <span className="text-xs text-slate-500 block mb-1">ציון:</span>
                                                       <input
                                                            type="number"
                                                            min={50}
                                                            max={100}
                                                            value={localEngGrade}
                                                            onChange={(e) => setLocalEngGrade(Number(e.target.value))}
                                                            className="w-20 bg-white border border-slate-300 rounded-lg px-3 py-2 text-center text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                                       />
                                                  </div>
                                             </div>
                                        </div>

                                   </div>

                                   {/* Psychometric & Extra Subjects */}
                                   <div className="space-y-4">

                                        {/* Psychometric */}
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                             <div className="flex items-center justify-between">
                                                  <label className="text-sm font-bold text-slate-800">ציון פסיכומטרי:</label>
                                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                                                       <input
                                                            type="checkbox"
                                                            checked={localHasPsych}
                                                            onChange={(e) => setLocalHasPsych(e.target.checked)}
                                                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                       />
                                                       כבר נבחנתי
                                                  </label>
                                             </div>

                                             {localHasPsych ? (
                                                  <div>
                                                       <span className="text-xs text-slate-500 block mb-1">ציון פסיכומטרי קיים (200-800):</span>
                                                       <input
                                                            type="number"
                                                            min={200}
                                                            max={800}
                                                            value={localPsychScore}
                                                            onChange={(e) =>
                                                                 setLocalPsychScore(e.target.value === '' ? '' : Number(e.target.value))
                                                            }
                                                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                                       />
                                                  </div>
                                             ) : (
                                                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                                                       טרם נבחנתי. האלגוריתם יחשב יעד פסיכומטרי אופטימלי עבורך.
                                                  </div>
                                             )}
                                        </div>

                                        {/* Extra Subjects List */}
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                             <label className="block text-sm font-bold text-slate-800">מקצועות מורחבים נוספים (בגרות):</label>

                                             <div className="space-y-2">
                                                  {extraSubjects.map((s) => (
                                                       <div
                                                            key={s.id}
                                                            className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                                                       >
                                                            <span className="text-slate-800">{s.name} ({s.units} יח״ל)</span>
                                                            <div className="flex items-center gap-3">
                                                                 <span className="text-indigo-600 font-bold">{s.grade}</span>
                                                                 <button
                                                                      onClick={() => handleRemoveSubject(s.id)}
                                                                      className="text-slate-400 hover:text-red-500"
                                                                 >
                                                                      <Trash2 className="h-3.5 w-3.5" />
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  ))}
                                             </div>

                                             {/* Add subject inputs */}
                                             <div className="flex items-center gap-2 pt-2">
                                                  <input
                                                       type="text"
                                                       placeholder="שם מקצוע (למשל: פיזיקה)"
                                                       value={newSubjName}
                                                       onChange={(e) => setNewSubjName(e.target.value)}
                                                       className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500"
                                                  />
                                                  <input
                                                       type="number"
                                                       placeholder="ציון"
                                                       value={newSubjGrade}
                                                       onChange={(e) => setNewSubjGrade(Number(e.target.value))}
                                                       className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-center font-bold"
                                                  />
                                                  <button
                                                       onClick={handleAddSubject}
                                                       className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                                                  >
                                                       <Plus className="h-4 w-4" />
                                                  </button>
                                             </div>
                                        </div>

                                   </div>

                              </div>

                              {/* Action buttons */}
                              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                                   <button
                                        onClick={() => setActiveStep(1)}
                                        className="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900"
                                   >
                                        חזרה לצעד הקודם
                                   </button>
                                   <button
                                        onClick={handleCalculate}
                                        className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
                                   >
                                        <Zap className="h-4 w-4" />
                                        <span>חשב מסלול אופטימלי עכשיו</span>
                                   </button>
                              </div>

                         </div>
                    )}

                    {/* STEP 3: RECOMMENDATION VERDICT SCREEN */}
                    {activeStep === 3 && (
                         <div className="space-y-6 animate-in fade-in">

                              {/* Summary Verdict Header */}
                              <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                                   <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                             <ShieldCheck className="h-4 w-4" />
                                             <span>ניתוח אלגוריתמי הושלם בהצלחה</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">
                                             3 מסלולים מומלצים לקבלה ל{targetDegree} ב{targetUniversity}
                                        </h2>
                                        <p className="text-xs text-slate-300">
                                             סף קבלה נדרש: <span className="font-bold text-indigo-300">{activeSekem}</span> {activePsych ? `(פסיכומטרי: ${activePsych})` : ''} | מתווה למידה אופטימלי לפי תשואת ROI מקסימלית.
                                        </p>
                                   </div>
                                   <button
                                        onClick={() => setActiveStep(2)}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 shrink-0"
                                   >
                                        ערוך ציונים
                                   </button>
                              </div>

                              {/* 3 Comparative Track Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                   {recommendedTracks.map((track) => (
                                        <div
                                             key={track.id}
                                             className={`rounded-3xl bg-white p-6 border transition-all duration-300 flex flex-col justify-between space-y-6 ${track.id === 'recommended'
                                                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl relative scale-[1.02]'
                                                  : 'border-slate-200/80 shadow-md hover:border-slate-300'
                                                  }`}
                                        >

                                             {/* Top Badge */}
                                             {track.id === 'recommended' && (
                                                  <div className="absolute -top-3 right-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                                                       <Sparkles className="h-3 w-3" />
                                                       <span>מסלול מומלץ - מקסימום ROI</span>
                                                  </div>
                                             )}

                                             <div className="space-y-4">
                                                  <div>
                                                       <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-2 ${track.difficultyColor}`}>
                                                            {track.difficulty}
                                                       </span>
                                                       <h3 className="text-lg font-bold text-slate-900">{track.title}</h3>
                                                       <p className="text-xs text-slate-500 mt-1">{track.subtitle}</p>
                                                  </div>

                                                  {/* Sekem vs Threshold comparison */}
                                                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                                       <div className="flex justify-between text-xs font-bold">
                                                            <span className="text-slate-600">סכם צפוי במסלול:</span>
                                                            <span className="text-indigo-600 font-extrabold text-sm">{track.predictedSekem}</span>
                                                       </div>
                                                       <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                 className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                                                                 style={{
                                                                      width: `${Math.min(100, (track.predictedSekem / (track.thresholdSekem * 1.1)) * 100)}%`
                                                                 }}
                                                            />
                                                       </div>
                                                       <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                                            <span>סף נדרש: {track.thresholdSekem}</span>
                                                            <span className="text-emerald-600 font-bold">עובר סף! +{(track.predictedSekem - track.thresholdSekem).toFixed(1)}</span>
                                                       </div>
                                                  </div>

                                                  {/* Hours counter & summary */}
                                                  <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                                                       <Clock className="h-4 w-4 text-indigo-600" />
                                                       <span>שעות לימוד מומלצות: <strong className="text-slate-900">{track.hoursNeeded} שעות</strong></span>
                                                  </div>

                                                  <p className="text-xs text-slate-600 leading-relaxed">
                                                       {track.summaryText}
                                                  </p>

                                                  {/* Action points */}
                                                  <ul className="space-y-1.5 pt-2">
                                                       {track.actionPoints.map((pt, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                                                                 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                                 <span>{pt}</span>
                                                            </li>
                                                       ))}
                                                  </ul>
                                             </div>

                                             {/* CTA Button */}
                                             <button
                                                  onClick={() =>
                                                       handleSelectTrack(
                                                            track.id,
                                                            track.id === 'recommended'
                                                                 ? 'מתמטיקה 5 יח״ל'
                                                                 : track.id === 'psychometric'
                                                                      ? 'פסיכומטרי'
                                                                      : 'מתמטיקה 5 יח״ל + פסיכומטרי'
                                                       )
                                                  }
                                                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs ${track.id === 'recommended'
                                                       ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                                                       : 'bg-slate-900 hover:bg-slate-800 text-white'
                                                       }`}
                                             >
                                                  <span>בחר מסלול זה ובנה תוכנית למידה</span>
                                                  <ArrowLeft className="h-4 w-4" />
                                             </button>

                                        </div>
                                   ))}
                              </div>

                         </div>
                    )}

               </div>
          </div>
     );
}
