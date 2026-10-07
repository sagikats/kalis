'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
     GraduationCap,
     Brain,
     Zap,
     Plus,
     Trash2,
     Building2,
     ChevronLeft,
     ChevronDown,
     ArrowLeft,
     Award,
     BookOpen,
     Sparkles,
     Search,
     Check,
     Filter
} from 'lucide-react';
import { SubjectInput } from '@/modules/calculators';
import { calculateMultiInstitutionSekem, InstitutionSekemResult } from '@/utils/calculators/multiCalculator';
import SubjectSelectModal from '@/components/calculator/SubjectSelectModal';
import AdmissionPanel, { AdmissionPanelProfile, toPanelProfile } from '@/components/calculator/AdmissionPanel';
import { BagrutSubjectOption } from '@/data/bagrutSubjects';
import { resolvePsychometricScores } from '@/utils/calculators/psychometricHelper';
import UniversityLogo from '@/components/common/UniversityLogo';
import { useAuth } from '@/context/AuthContext';
import { cleanGradeInput, cleanNumberInput } from '@/utils/gradeInputHelper';

export interface InstitutionOption {
     id: string;
     name: string;
     fullName: string;
     badge: string;
}

export const AVAILABLE_INSTITUTIONS: InstitutionOption[] = [
     { id: 'tau', name: 'תל אביב', fullName: 'אוניברסיטת תל אביב', badge: 'TAU' },
     { id: 'technion', name: 'הטכניון', fullName: 'הטכניון - מכון טכנולוגי לישראל', badge: 'IIT' },
     { id: 'huji', name: 'העברית', fullName: 'האוניברסיטה העברית בירושלים', badge: 'HUJI' },
     { id: 'bgu', name: 'בן-גוריון', fullName: 'אוניברסיטת בן-גוריון בנגב', badge: 'ב"ג' },
     { id: 'haifa', name: 'חיפה', fullName: 'אוניברסיטת חיפה', badge: 'UOH' },
     { id: 'ariel', name: 'אריאל', fullName: 'אוניברסיטת אריאל בשומרון', badge: 'AU' },
     { id: 'bar_ilan', name: 'בר-אילן', fullName: 'אוניברסיטת בר-אילן', badge: 'BIU' },
     { id: 'reichman', name: 'רייכמן', fullName: 'אוניברסיטת רייכמן (הבינתחומי)', badge: 'RUNI' }
];

export const ALL_INSTITUTION_IDS = AVAILABLE_INSTITUTIONS.map(i => i.id);

const DEFAULT_SUBJECTS: SubjectInput[] = [
     { name: 'תנ"ך', units: 2, grade: 0 },
     { name: 'ספרות עברית', units: 2, grade: 0 },
     { name: 'אזרחות', units: 2, grade: 0 },
     { name: 'היסטוריה / תע"י', units: 2, grade: 0 },
     { name: 'הבעה עברית', units: 2, grade: 0 },
     { name: 'אנגלית', units: 5, grade: 0 },
     { name: 'מתמטיקה', units: 5, grade: 0 },
     { name: 'פיזיקה', units: 5, grade: 0 }
];

function computeMultiResults(
     currentSubjects: SubjectInput[],
     general: number | '',
     quant: number | '',
     verbal: number | '',
     english: number | '',
     instIds: string[]
): InstitutionSekemResult[] {
     const mathSubject = currentSubjects.find(s => s.name.includes('מתמטיקה')) || { units: 5, grade: 0 };
     const physicsSubject = currentSubjects.find(s => s.name.includes('פיזיקה'));
     return calculateMultiInstitutionSekem(
          {
               bagrutSubjects: currentSubjects.map(s => ({ ...s, grade: Number(s.grade) || 0 })),
               psychometricGeneral: Number(general) || 0,
               psychometricQuant: Number(quant) || 0,
               psychometricVerbal: Number(verbal) || 0,
               psychometricEnglish: Number(english) || 0,
               mathGrade: Number(mathSubject.grade) || 0,
               mathUnits: mathSubject.units,
               physicsGrade: Number(physicsSubject?.grade) || 0,
               physicsUnits: physicsSubject?.units || 0
          },
          instIds
     );
}

function computeAllInstitutionResults(
     currentSubjects: SubjectInput[],
     general: number | '',
     quant: number | '',
     verbal: number | '',
     english: number | ''
): Record<string, InstitutionSekemResult> {
     const results = computeMultiResults(currentSubjects, general, quant, verbal, english, ALL_INSTITUTION_IDS);
     const map: Record<string, InstitutionSekemResult> = {};
     for (const r of results) {
          map[r.institutionId] = r;
     }
     return map;
}

interface UnifiedCalculatorProps {
     initialInstId?: string | null;
}

export default function UnifiedCalculator({ initialInstId }: UnifiedCalculatorProps) {
     const searchParams = useSearchParams();
     const queryInst = searchParams?.get('inst');

     // Determine target institution from props or query param
     const targetInst = initialInstId || queryInst;

     // Initialize selected institutions:
     // If a specific valid institution is requested, focus on it; otherwise select all 6 institutions equally.
     const [selectedInstIds, setSelectedInstIds] = useState<string[]>(() => {
          if (targetInst && ALL_INSTITUTION_IDS.includes(targetInst)) {
               return [targetInst];
          }
          return ALL_INSTITUTION_IDS;
     });

     // Keep track if user is in focused single-institution mode from URL
     const focusedInst = useMemo(() => {
          if (targetInst && ALL_INSTITUTION_IDS.includes(targetInst)) {
               return AVAILABLE_INSTITUTIONS.find(i => i.id === targetInst);
          }
          return null;
     }, [targetInst]);

     const { user, profile } = useAuth();

     const [subjects, setSubjects] = useState<SubjectInput[]>(DEFAULT_SUBJECTS);
     const [noPsychometric, setNoPsychometric] = useState<boolean>(false);
     const [psychGeneral, setPsychGeneral] = useState<number | ''>(0);
     const [psychQuant, setPsychQuant] = useState<number | ''>(0);
     const [psychVerbal, setPsychVerbal] = useState<number | ''>(0);
     const [psychEnglish, setPsychEnglish] = useState<number | ''>(0);

     // Pending changes flag: true when grades/subjects/psychometric inputs have been modified without clicking "חשב מחדש"
     const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);

     // Calculated results map across all institutions, updated ONLY on "חשב מחדש" or initial profile load
     const [calculatedMap, setCalculatedMap] = useState<Record<string, InstitutionSekemResult>>(() =>
          computeAllInstitutionResults(DEFAULT_SUBJECTS, 0, 0, 0, 0)
     );
     // The inputs behind calculatedMap — the admission panel checks official conditions against the same snapshot
     const [calculatedProfile, setCalculatedProfile] = useState<AdmissionPanelProfile>(() => toPanelProfile(DEFAULT_SUBJECTS, 0, 0, 0, 0));

     // Sync with user profile on login or profile change
     useEffect(() => {
          if (user && profile) {
               let loadedSubjects = DEFAULT_SUBJECTS;
               if (profile.bagrutSubjects && profile.bagrutSubjects.length > 0) {
                    loadedSubjects = profile.bagrutSubjects.map((s: any) => ({
                         name: s.subjectName || s.name,
                         units: s.units,
                         grade: s.grade
                    }));
                    setSubjects(loadedSubjects);
               }
               const noPsych = profile.hasTakenPsychometric !== undefined ? !profile.hasTakenPsychometric : false;
               setNoPsychometric(noPsych);
               const gen = profile.psychometricGeneral || 0;
               const q = profile.psychometricQuant || 0;
               const v = profile.psychometricVerbal || 0;
               const eng = profile.psychometricEnglish || 0;
               setPsychGeneral(gen);
               setPsychQuant(q);
               setPsychVerbal(v);
               setPsychEnglish(eng);

               // Calculate initial scores for the loaded user profile
               const initialMap = computeAllInstitutionResults(
                    loadedSubjects,
                    noPsych ? 0 : gen,
                    noPsych ? 0 : q,
                    noPsych ? 0 : v,
                    noPsych ? 0 : eng
               );
               setCalculatedMap(initialMap);
               setCalculatedProfile(toPanelProfile(loadedSubjects, noPsych ? 0 : gen, noPsych ? 0 : q, noPsych ? 0 : v, noPsych ? 0 : eng));
               setHasPendingChanges(false);
          }
     }, [user, profile]);

     // Listen for logout event to completely reset
     useEffect(() => {
          const handleLogout = () => {
               const resetSubs = DEFAULT_SUBJECTS.map(s => ({ ...s, grade: 0 }));
               setSubjects(resetSubs);
               setNoPsychometric(false);
               setPsychGeneral(0);
               setPsychQuant(0);
               setPsychVerbal(0);
               setPsychEnglish(0);
               setPanelInstitutionId(null);
               setCalculatedMap(computeAllInstitutionResults(resetSubs, 0, 0, 0, 0));
               setCalculatedProfile(toPanelProfile(resetSubs, 0, 0, 0, 0));
               setHasPendingChanges(false);
          };
          window.addEventListener('kalis-logout', handleLogout);
          return () => window.removeEventListener('kalis-logout', handleLogout);
     }, []);

     // Admission panel state
     const [panelInstitutionId, setPanelInstitutionId] = useState<string | null>(null);

     // Subject catalog modal state
     const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
     const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null);

     // Expand/collapse institution calculation details
     const [expandedInstitutions, setExpandedInstitutions] = useState<Record<string, boolean>>({});

     const toggleInstitutionDetails = (id: string) => {
          setExpandedInstitutions((prev) => ({
               ...prev,
               [id]: !prev[id]
          }));
     };

     // Resolved NITE psychometric composite scores and emphasis channels
     const psychResolution = useMemo(() => {
          return resolvePsychometricScores({
               general: psychGeneral,
               quant: psychQuant,
               verbal: psychVerbal,
               english: psychEnglish
          });
     }, [psychGeneral, psychQuant, psychVerbal, psychEnglish]);

     // Academic English level classification according to Council for Higher Education (מל"ג) standards
     const englishLevelBadge = useMemo(() => {
          return psychResolution.englishClassification.level !== 'unknown'
               ? psychResolution.englishClassification
               : null;
     }, [psychResolution]);

     // Multi-institution results mapped from calculatedMap based on active selections
     const institutionResults = useMemo(() => {
          return selectedInstIds.map(id => calculatedMap[id]).filter(Boolean);
     }, [selectedInstIds, calculatedMap]);

     // Handle calculate button click: recalculates all institutions and clears pending flag
     const handleCalculate = () => {
          const freshMap = computeAllInstitutionResults(
               subjects,
               noPsychometric ? 0 : psychGeneral,
               noPsychometric ? 0 : psychQuant,
               noPsychometric ? 0 : psychVerbal,
               noPsychometric ? 0 : psychEnglish
          );
          setCalculatedMap(freshMap);
          setCalculatedProfile(
               toPanelProfile(
                    subjects,
                    noPsychometric ? 0 : psychGeneral,
                    noPsychometric ? 0 : psychQuant,
                    noPsychometric ? 0 : psychVerbal,
                    noPsychometric ? 0 : psychEnglish
               )
          );
          setHasPendingChanges(false);

          const resultsElem = document.getElementById('results-section');
          resultsElem?.scrollIntoView({ behavior: 'smooth' });
     };

     const toggleInstitution = (id: string) => {
          if (selectedInstIds.includes(id)) {
               if (selectedInstIds.length === 1) return; // Keep at least one selected
               setSelectedInstIds(selectedInstIds.filter(i => i !== id));
          } else {
               setSelectedInstIds([...selectedInstIds, id]);
          }
     };

     const selectAllInstitutions = () => {
          setSelectedInstIds(ALL_INSTITUTION_IDS);
     };

     const handleOpenAddModal = () => {
          setEditingSubjectIndex(null);
          setIsSelectModalOpen(true);
     };

     const handleOpenChangeModal = (index: number) => {
          setEditingSubjectIndex(index);
          setIsSelectModalOpen(true);
     };

     const handleSelectSubjectFromCatalog = (subject: BagrutSubjectOption) => {
          if (editingSubjectIndex !== null) {
               const updated = [...subjects];
               updated[editingSubjectIndex] = {
                    ...updated[editingSubjectIndex],
                    name: subject.name,
                    units: subject.defaultUnits
               };
               setSubjects(updated);
          } else {
               const exists = subjects.some(s => s.name === subject.name);
               if (!exists) {
                    setSubjects([
                         ...subjects,
                         {
                              name: subject.name,
                              units: subject.defaultUnits,
                              grade: 0
                         }
                    ]);
               }
          }
          setIsSelectModalOpen(false);
          setEditingSubjectIndex(null);
          setHasPendingChanges(true);
     };

     const handleRemoveSubject = (index: number) => {
          setSubjects(subjects.filter((_, i) => i !== index));
          setHasPendingChanges(true);
     };

     const handleUpdateSubject = (index: number, field: keyof SubjectInput, value: any, event?: React.ChangeEvent<HTMLInputElement>) => {
          const updated = [...subjects];
          let val = value;
          if (field === 'grade') {
               val = cleanGradeInput(String(value));
               if (event && event.target) {
                    event.target.value = val === '' ? '' : String(val);
               }
          }
          updated[index] = { ...updated[index], [field]: val === '' ? 0 : val };
          setSubjects(updated);
          setHasPendingChanges(true);
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
          setHasPendingChanges(true);
     };

     const allSelected = selectedInstIds.length === ALL_INSTITUTION_IDS.length;

     return (
          <div className="min-h-screen bg-paper text-ink font-sans dir-rtl">
               <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto pt-6 sm:pt-10">
                         <p className="text-sm font-medium text-accent">מחשבון סכם · שמונה אוניברסיטאות</p>
                         <h1 className="mt-4 text-4xl sm:text-6xl font-bold text-ink">
                              מחשבון סכם כלל-אוניברסיטאי
                         </h1>
                         <p className="mt-5 text-base sm:text-lg text-ink-2 leading-relaxed">
                              הזן את ציוני הבגרות והפסיכומטרי שלך פעם אחת בלבד וקבל חישוב השוואתי מדויק של ציוני הסכם בכל אוניברסיטאות היעד בישראל — הטכניון, תל אביב, העברית, בן-גוריון, בר-אילן, חיפה, אריאל ורייכמן.
                         </p>
                         <div className="flex justify-center pt-6">
                              <Link
                                   href="/flow"
                                   className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-2 transition-colors"
                              >
                                   <span>לבדיקת קבלה לפי תארים</span>
                                   <ArrowLeft className="h-3.5 w-3.5" />
                              </Link>
                         </div>
                    </div>

                    {/* Focused Institution Banner if deep-linked */}
                    {focusedInst && !allSelected && (
                         <div className="p-4 rounded-2xl bg-white border border-line flex items-center justify-between flex-wrap gap-3 shadow-2xs">
                              <div className="flex items-center gap-2 text-xs text-ink-2">
                                   <Building2 className="h-4 w-4 text-accent shrink-0" />
                                   <span>
                                        מציג כרגע חישוב עבור <strong>{focusedInst.fullName}</strong>. מעוניין להשוות לכל האוניברסיטאות?
                                   </span>
                              </div>
                              <button
                                   onClick={selectAllInstitutions}
                                   className="px-3.5 py-1.5 rounded-xl bg-ink hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                              >
                                   <Sparkles className="h-3.5 w-3.5" />
                                   <span>הצג את כל 8 האוניברסיטאות</span>
                              </button>
                         </div>
                    )}

                    {/* Institution Multi-Select Chips Bar */}
                    <div className="bg-white rounded-3xl p-6 border border-line shadow-xs space-y-4">
                         <div className="flex items-center justify-between flex-wrap gap-3 border-b border-line pb-3">
                              <div className="flex items-center gap-2.5">
                                   <Building2 className="h-5 w-5 text-accent" />
                                   <h3 className="text-base sm:text-lg font-bold text-ink">
                                        בחר אוניברסיטאות לחישוב והשוואה:
                                   </h3>
                                   <span className="text-xs text-ink-2 font-medium">
                                        ({selectedInstIds.length} מתוך {AVAILABLE_INSTITUTIONS.length} פעילות)
                                   </span>
                              </div>
                              <div className="flex items-center gap-3">
                                   {!allSelected && (
                                        <button
                                             onClick={selectAllInstitutions}
                                             className="text-xs font-bold text-accent hover:text-accent-2 transition flex items-center gap-1 hover:underline"
                                        >
                                             <Sparkles className="h-3.5 w-3.5" />
                                             <span>בחר את כל המוסדות</span>
                                        </button>
                                   )}
                              </div>
                         </div>

                         <div className="flex items-center gap-2.5 flex-wrap">
                              {AVAILABLE_INSTITUTIONS.map((inst) => {
                                   const isSelected = selectedInstIds.includes(inst.id);
                                   return (
                                        <button
                                             key={inst.id}
                                             onClick={() => toggleInstitution(inst.id)}
                                             aria-pressed={isSelected}
                                             className={`px-3.5 py-2 rounded-full text-xs font-semibold transition flex items-center gap-2 border ${isSelected
                                                  ? 'bg-white border-ink text-ink ring-1 ring-ink'
                                                  : 'bg-paper border-line text-ink-3 hover:border-line-strong hover:text-ink-2 [&_img]:grayscale [&_img]:opacity-60'
                                                  }`}
                                        >
                                             <UniversityLogo institution={inst.id} size="xs" shape="circle" />
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
                              <div className="bg-white rounded-3xl p-6 border border-line shadow-xs space-y-5">
                                   <div className="flex items-center justify-between border-b border-line pb-2.5">
                                        <div className="flex items-center gap-3">
                                             <div className="p-2.5 rounded-xl bg-paper border border-line text-ink">
                                                  <Brain className="h-5 w-5" />
                                             </div>
                                             <div>
                                                  <h3 className="text-lg font-bold text-ink">1. ציוני בחינה פסיכומטרית</h3>
                                                  <p className="text-xs text-ink-2">הזן ציון רב-תחומי וציוני הפרקים (כמותי, מילולי ואנגלית)</p>
                                             </div>
                                        </div>
                                        {englishLevelBadge && (
                                             <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border shadow-2xs ${englishLevelBadge.color} hidden sm:inline-block`}>
                                                  {englishLevelBadge.label}
                                             </span>
                                        )}
                                   </div>

                                   {/* Toggle: Haven't taken psychometric yet */}
                                   <div
                                        onClick={() => {
                                             const nextVal = !noPsychometric;
                                             setNoPsychometric(nextVal);
                                             if (nextVal) {
                                                  setPsychGeneral(0);
                                                  setPsychQuant(0);
                                                  setPsychVerbal(0);
                                                  setPsychEnglish(0);
                                             } else {
                                                  setPsychGeneral(650);
                                                  setPsychQuant(130);
                                                  setPsychVerbal(130);
                                                  setPsychEnglish(120);
                                             }
                                             setHasPendingChanges(true);
                                        }}
                                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${noPsychometric
                                             ? 'bg-paper-2 border-ink text-ink'
                                             : 'bg-paper border-line text-ink-2 hover:border-line-strong'
                                             }`}
                                   >
                                        <div className="flex items-center gap-3">
                                             <input
                                                  type="checkbox"
                                                  checked={noPsychometric}
                                                  onChange={() => { }}
                                                  className="w-4 h-4 rounded border-line-strong text-ink focus:ring-ink cursor-pointer"
                                             />
                                             <div>
                                                  <span className="text-xs font-bold block">עדיין לא עשיתי פסיכומטרי</span>
                                                  <span className="text-[11px] text-ink-2 block mt-0.5">
                                                       בדיקת זכאות לקבלה ישירה (Direct Bagrut Admission) על סמך ממוצע בגרות בלבד
                                                  </span>
                                             </div>
                                        </div>
                                        {noPsychometric && (
                                             <span className="px-2 py-0.5 rounded-lg bg-white text-ink text-[10px] font-bold border border-line-strong">
                                                  פעיל
                                             </span>
                                        )}
                                   </div>

                                   {noPsychometric ? (
                                        <div className="p-4 rounded-2xl bg-paper border border-line space-y-2">
                                             <div className="flex items-center gap-2 text-ink text-xs font-bold">
                                                  <Sparkles className="h-4 w-4 text-accent shrink-0" />
                                                  <span>מצב חישוב ללא פסיכומטרי — קבלה ישירה על סמך בגרות</span>
                                             </div>
                                             <p className="text-[11px] text-ink-2 leading-relaxed">
                                                  ציוני הסכם יתבססו על ממוצע הבגרות בלבד בהתאם לחישובי המוסדות האקדמיים.
                                             </p>
                                        </div>
                                   ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             {/* General Psychometric */}
                                             <div className="space-y-1.5">
                                                  <label className="block text-xs font-bold text-ink-2">
                                                       ציון פסיכומטרי רב-תחומי (200-800):
                                                  </label>
                                                  <input
                                                       type="number"
                                                       inputMode="numeric"
                                                       pattern="[0-9]*"
                                                       min={200}
                                                       max={800}
                                                       value={psychGeneral}
                                                       onChange={(e) => handleNumberInputChange(e, setPsychGeneral, 0, 800)}
                                                       onBlur={(e) => {
                                                            const cleaned = cleanNumberInput(e.target.value, 0, 800);
                                                            e.target.value = String(cleaned);
                                                            setPsychGeneral(cleaned);
                                                       }}
                                                       placeholder="200-800"
                                                       className="w-full bg-white border border-line-strong rounded-xl px-4 py-2.5 text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
                                                  />
                                             </div>

                                             {/* Quantitative */}
                                             <div className="space-y-1.5">
                                                  <label className="block text-xs font-bold text-ink-2">
                                                       חשיבה כמותית (50-150):
                                                  </label>
                                                  <input
                                                       type="number"
                                                       inputMode="numeric"
                                                       pattern="[0-9]*"
                                                       min={50}
                                                       max={150}
                                                       value={psychQuant}
                                                       onChange={(e) => handleNumberInputChange(e, setPsychQuant, 0, 150)}
                                                       onBlur={(e) => {
                                                            const cleaned = cleanNumberInput(e.target.value, 50, 150);
                                                            e.target.value = String(cleaned);
                                                            setPsychQuant(cleaned);
                                                       }}
                                                       placeholder="50-150"
                                                       className="w-full bg-white border border-line-strong rounded-xl px-4 py-2.5 text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
                                                  />
                                             </div>

                                             {/* Verbal */}
                                             <div className="space-y-1.5">
                                                  <label className="block text-xs font-bold text-ink-2">
                                                       חשיבה מילולית (50-150):
                                                  </label>
                                                  <input
                                                       type="number"
                                                       inputMode="numeric"
                                                       pattern="[0-9]*"
                                                       min={50}
                                                       max={150}
                                                       value={psychVerbal}
                                                       onChange={(e) => handleNumberInputChange(e, setPsychVerbal, 0, 150)}
                                                       onBlur={(e) => {
                                                            const cleaned = cleanNumberInput(e.target.value, 50, 150);
                                                            e.target.value = String(cleaned);
                                                            setPsychVerbal(cleaned);
                                                       }}
                                                       placeholder="50-150"
                                                       className="w-full bg-white border border-line-strong rounded-xl px-4 py-2.5 text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
                                                  />
                                             </div>

                                             {/* English */}
                                             <div className="space-y-1.5">
                                                  <div className="flex items-center justify-between">
                                                       <label className="block text-xs font-bold text-ink-2">
                                                            אנגלית בפסיכומטרי / אמי"ר (50-150):
                                                       </label>
                                                  </div>
                                                  <input
                                                       type="number"
                                                       inputMode="numeric"
                                                       pattern="[0-9]*"
                                                       min={50}
                                                       max={150}
                                                       value={psychEnglish}
                                                       onChange={(e) => handleNumberInputChange(e, setPsychEnglish, 0, 150)}
                                                       onBlur={(e) => {
                                                            const cleaned = cleanNumberInput(e.target.value, 50, 150);
                                                            e.target.value = String(cleaned);
                                                            setPsychEnglish(cleaned);
                                                       }}
                                                       placeholder="50-150"
                                                       className="w-full bg-white border border-line-strong rounded-xl px-4 py-2.5 text-sm font-bold text-ink focus:outline-none focus:ring-1 focus:ring-ink transition"
                                                  />
                                                  {englishLevelBadge && (
                                                       <div className="sm:hidden pt-1">
                                                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border shadow-2xs ${englishLevelBadge.color}`}>
                                                                 {englishLevelBadge.label}
                                                            </span>
                                                       </div>
                                                  )}
                                             </div>
                                        </div>
                                   )}

                                   {/* Live NITE composite calculation indicator */}
                                   {(psychResolution.effectiveQuantEmphasis > 0 || psychResolution.effectiveVerbalEmphasis > 0) && (
                                        <div className="pt-2 border-t border-line">
                                             <div className="p-3.5 rounded-2xl bg-paper border border-line text-xs space-y-2">
                                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                                       <div className="flex items-center gap-2">
                                                            <Sparkles className="h-4 w-4 text-accent shrink-0" />
                                                            <span className="font-bold text-ink">
                                                                 שקלול מאל"ו רשמי לפי תחומי הבחינה:
                                                            </span>
                                                       </div>
                                                       <span className="text-[10px] text-ink-2 font-medium">
                                                            משקלים: כמותי 60/20/20 | מילולי 60/20/20 | רב-תחומי 40/40/20
                                                       </span>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                                       <div className="p-2 rounded-xl bg-white border border-line">
                                                            <span className="text-[10px] text-ink-2 block font-bold">רב-תחומי</span>
                                                            <span className="text-base font-bold text-ink">{psychResolution.effectiveGeneral || '-'}</span>
                                                       </div>
                                                       <div className="p-2 rounded-xl bg-white border border-line">
                                                            <span className="text-[10px] text-ink-2 block font-bold">דגש כמותי (הנדסה/טכניון)</span>
                                                            <span className="text-base font-bold text-ink">{psychResolution.effectiveQuantEmphasis || '-'}</span>
                                                       </div>
                                                       <div className="p-2 rounded-xl bg-white border border-line">
                                                            <span className="text-[10px] text-ink-2 block font-bold">דגש מילולי (רוח/משפטים)</span>
                                                            <span className="text-base font-bold text-ink">{psychResolution.effectiveVerbalEmphasis || '-'}</span>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   )}
                              </div>

                              {/* Card 2: Bagrut Subjects */}
                              <div className="bg-white rounded-3xl p-6 border border-line shadow-xs space-y-5">
                                   <div className="flex items-center justify-between border-b border-line pb-4">
                                        <div className="flex items-center gap-3">
                                             <div className="p-2.5 rounded-xl bg-paper border border-line text-ink">
                                                  <BookOpen className="h-5 w-5" />
                                             </div>
                                             <div>
                                                  <h3 className="text-lg font-bold text-ink">2. ציוני תעודת בגרות (0-100)</h3>
                                                  <p className="text-xs text-ink-2">בונוסים מחושבים אוטומטית לפי כללי האוניברסיטאות</p>
                                             </div>
                                        </div>
                                        <span className="text-xs font-bold text-ink-2 bg-paper px-3 py-1 rounded-full border border-line">
                                             {subjects.length} מקצועות
                                        </span>
                                   </div>

                                   {/* List */}
                                   <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                                        {subjects.map((sub, idx) => (
                                             <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-paper border border-line hover:border-line-strong transition">
                                                  <button
                                                       type="button"
                                                       onClick={() => handleOpenChangeModal(idx)}
                                                       className="flex items-center gap-2 text-right bg-white hover:bg-paper-2 px-3 py-1.5 rounded-xl border border-line-strong transition group flex-1 min-w-0 shadow-2xs"
                                                       title="לחץ כדי להחליף מקצוע מתוך הרשימה"
                                                  >
                                                       <Search className="h-3.5 w-3.5 text-ink-3 group-hover:text-ink shrink-0 transition" />
                                                       <span className="text-xs font-bold text-ink truncate transition">
                                                            {sub.name}
                                                       </span>
                                                  </button>
                                                  <div className="flex items-center gap-2 shrink-0">
                                                       <select
                                                            value={sub.units}
                                                            onChange={(e) => handleUpdateSubject(idx, 'units', Number(e.target.value))}
                                                            className="bg-white border border-line-strong rounded-lg text-xs text-ink font-bold px-2 py-1.5 focus:ring-1 focus:ring-ink"
                                                       >
                                                            <option value={1}>1 יח"ל</option>
                                                            <option value={2}>2 יח"ל</option>
                                                            <option value={3}>3 יח"ל</option>
                                                            <option value={4}>4 יח"ל</option>
                                                            <option value={5}>5 יח"ל</option>
                                                       </select>
                                                       <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={3}
                                                            value={sub.grade === 0 ? '' : sub.grade}
                                                            onChange={(e) => handleUpdateSubject(idx, 'grade', e.target.value, e)}
                                                            onBlur={(e) => {
                                                                 const cleaned = cleanGradeInput(e.target.value);
                                                                 e.target.value = cleaned === '' ? '' : String(cleaned);
                                                                 handleUpdateSubject(idx, 'grade', cleaned === '' ? 0 : cleaned);
                                                            }}
                                                            placeholder="0"
                                                            className="w-16 bg-white border border-line-strong rounded-lg text-xs font-bold text-ink text-center py-1.5 focus:ring-1 focus:ring-ink"
                                                       />
                                                       <button
                                                            onClick={() => handleRemoveSubject(idx)}
                                                            className="text-ink-3 hover:text-danger p-1.5 rounded-lg hover:bg-danger-soft transition"
                                                            title="הסר מקצוע"
                                                       >
                                                            <Trash2 className="h-4 w-4" />
                                                       </button>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>

                                   {/* Add Subject Action Bar */}
                                   <div className="pt-2 border-t border-line">
                                        <button
                                             type="button"
                                             onClick={handleOpenAddModal}
                                             className="w-full py-3 px-4 rounded-2xl bg-paper hover:bg-paper-2 border border-line-strong hover:border-line-strong text-ink font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-2xs group cursor-pointer"
                                        >
                                             <div className="p-1 rounded-lg bg-white border border-line transition">
                                                  <Plus className="h-4 w-4 text-ink" />
                                             </div>
                                             <span>בחר והוסף מקצוע מתוך רשימת הבגרויות וההגברות (חיפוש מהיר)</span>
                                             <Search className="h-3.5 w-3.5 text-ink-3 mr-auto group-hover:translate-x-[-2px] transition" />
                                        </button>
                                   </div>
                              </div>

                              {/* Calculate Action Button */}
                              <button
                                   type="button"
                                   onClick={handleCalculate}
                                   className={`w-full py-4 text-white font-bold text-sm sm:text-base rounded-2xl shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 group cursor-pointer ${
                                        hasPendingChanges
                                             ? 'bg-ink hover:bg-black ring-2 ring-amber-400'
                                             : 'bg-ink hover:bg-black'
                                   }`}
                              >
                                   <Zap className={`h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform ${hasPendingChanges ? 'animate-bounce' : ''}`} />
                                   <span>{hasPendingChanges ? 'חשב מחדש את ציוני הסכם וממוצע הבגרות' : 'חשב ועדכן תוצאות לכל המוסדות הנבחרים'}</span>
                                   {hasPendingChanges && (
                                        <span className="mr-1.5 text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                                             שינויים ממתינים
                                        </span>
                                   )}
                              </button>

                         </div>

                         {/* Right Column: Multi-Institution Comparison Results (6 cols) */}
                         <div className="lg:col-span-6 space-y-3.5 lg:sticky lg:top-8" id="results-section">

                              <div className="flex items-center justify-between border-b border-line pb-2.5 flex-wrap gap-2">
                                   <div className="flex items-center gap-2 flex-wrap">
                                        <Award className="h-5 w-5 text-accent" />
                                        <h3 className="text-base sm:text-lg font-bold text-ink">
                                             תוצאות סכם לפי מוסד לימודים
                                        </h3>
                                        {hasPendingChanges && (
                                             <span className="text-[11px] text-warning bg-warning-soft border border-warning/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                  ממתין לחישוב מחדש
                                             </span>
                                        )}
                                   </div>
                                   <div className="flex items-center gap-2">
                                        {hasPendingChanges && (
                                             <button
                                                  type="button"
                                                  onClick={handleCalculate}
                                                  className="text-xs font-bold bg-ink hover:bg-black text-white px-3 py-1 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                             >
                                                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                                                  <span>חשב מחדש</span>
                                             </button>
                                        )}
                                        <span className="text-[11px] text-ink-2 font-bold bg-paper px-2.5 py-0.5 rounded-full border border-line">
                                             {institutionResults.length} מוסדות מוצגים
                                        </span>
                                   </div>
                              </div>

                              {/* Dynamic Grid of Cards per Selected Institution */}
                              <div className="space-y-2.5 max-h-[calc(100vh-140px)] min-h-[500px] overflow-y-auto pr-1">
                                   {institutionResults.map((res) => (
                                        <div
                                             key={res.institutionId}
                                             className="bg-white rounded-2xl p-3 sm:p-3.5 border border-line hover:border-line-strong shadow-2xs transition space-y-2.5"
                                        >
                                             <div className="flex items-center justify-between border-b border-line pb-2 gap-2">
                                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                                       <UniversityLogo institution={res.institutionId} size="sm" shape="rounded" />
                                                       <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm sm:text-base font-bold text-ink leading-tight">{res.institutionName}</h4>
                                                            {(res.notes || (res.droppedSubjects && res.droppedSubjects.length > 0)) && (
                                                                 <button
                                                                      type="button"
                                                                      onClick={() => toggleInstitutionDetails(res.institutionId)}
                                                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-2 hover:text-ink transition mt-0.5 cursor-pointer select-none"
                                                                 >
                                                                      <span>{expandedInstitutions[res.institutionId] ? 'הסתר פירוט' : 'הצג פירוט'}</span>
                                                                      <ChevronDown
                                                                           className={`h-3 w-3 text-ink-3 transition-transform duration-200 ${
                                                                                expandedInstitutions[res.institutionId] ? 'rotate-180 text-ink' : ''
                                                                           }`}
                                                                      />
                                                                 </button>
                                                            )}
                                                            {expandedInstitutions[res.institutionId] && (
                                                                 <div className="mt-2 p-2.5 bg-paper border border-line rounded-xl text-[11px] space-y-1 animate-in fade-in duration-150">
                                                                      {res.notes && <p className="text-ink-2 leading-relaxed">{res.notes}</p>}
                                                                      {res.droppedSubjects && res.droppedSubjects.length > 0 && (
                                                                           <p className="text-[10px] text-warning font-medium">
                                                                                הושמטו למיקסום הממוצע: {res.droppedSubjects.join(', ')}
                                                                           </p>
                                                                      )}
                                                                 </div>
                                                            )}
                                                       </div>
                                                  </div>
                                             </div>

                                             <div className={`grid grid-cols-2 ${res.institutionId === 'bar_ilan' ? 'sm:grid-cols-5' : res.managementSekem !== undefined ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2`}>
                                                  {/* Bagrut Avg */}
                                                  <div className="py-2 px-2 rounded-xl bg-paper text-center flex flex-col justify-center">
                                                       <span className="text-[10px] text-ink-3 block font-medium leading-tight truncate">ממוצע בגרות</span>
                                                       <span className="font-serif text-xl sm:text-2xl font-bold text-ink mt-1 block leading-none tabular-nums">{res.bagrutAverage}</span>
                                                  </div>

                                                  {/* General Sekem */}
                                                  <div className="py-2 px-2 rounded-xl bg-paper text-center flex flex-col justify-center">
                                                       <span className="text-[10px] text-ink-3 block font-medium leading-tight truncate">{res.institutionId === 'bar_ilan' ? 'שקלול כללי' : 'סכם כללי'}</span>
                                                       <span className="font-serif text-xl sm:text-2xl font-bold text-ink mt-1 block leading-none tabular-nums">{res.generalSekem}</span>
                                                  </div>

                                                  {/* Bar-Ilan sciences score */}
                                                  {res.institutionId === 'bar_ilan' && res.quantitativeSekem !== undefined && (
                                                       <div className="py-2 px-2 rounded-xl bg-paper text-center flex flex-col justify-center">
                                                            <span className="text-[10px] text-ink-3 block font-medium leading-tight truncate">שקלול מדעים</span>
                                                            <span className="font-serif text-xl sm:text-2xl font-bold text-ink mt-1 block leading-none tabular-nums">{res.quantitativeSekem}</span>
                                                       </div>
                                                  )}

                                                  {/* Engineering Sekem */}
                                                  {res.engineeringSekem !== undefined && (
                                                       <div className="py-2 px-2 rounded-xl bg-paper text-center flex flex-col justify-center">
                                                            <span className="text-[10px] text-ink-3 block font-medium leading-tight truncate">{res.institutionId === 'bar_ilan' ? 'שקלול הנדסה' : 'סכם כמותי/הנדסה'}</span>
                                                            <span className="font-serif text-xl sm:text-2xl font-bold text-ink mt-1 block leading-none tabular-nums">{res.engineeringSekem}</span>
                                                       </div>
                                                  )}

                                                  {/* Management Sekem */}
                                                  {res.managementSekem !== undefined && (
                                                       <div className="py-2 px-2 rounded-xl bg-paper text-center flex flex-col justify-center">
                                                            <span className="text-[10px] text-ink-3 block font-medium leading-tight truncate">{res.institutionId === 'bar_ilan' ? 'שקלול הנדסת תוכנה' : 'התאמה לניהול'}</span>
                                                            <span className="font-serif text-xl sm:text-2xl font-bold text-ink mt-1 block leading-none tabular-nums">{res.managementSekem}</span>
                                                       </div>
                                                  )}
                                             </div>

                                             {/* Action buttons row */}
                                             <div className="flex gap-2">
                                                  <button
                                                       onClick={() => setPanelInstitutionId(res.institutionId)}
                                                       className="flex-1 py-2 bg-white hover:bg-paper text-ink border border-line-strong font-semibold text-xs rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                  >
                                                       <GraduationCap className="h-3.5 w-3.5" />
                                                       <span>מה הסיכויים שלי?</span>
                                                  </button>
                                                  <Link
                                                       href="/flow"
                                                       className="w-9 h-9 bg-white hover:bg-paper text-ink border border-line-strong rounded-full transition flex items-center justify-center shrink-0"
                                                       title="בדיקת קבלה ופערים"
                                                  >
                                                       <ChevronLeft className="h-4 w-4" />
                                                  </Link>
                                             </div>
                                        </div>
                                   ))}
                              </div>

                         </div>

                    </div>

               </main>

               {/* Subject Search and Select Modal */}
               <SubjectSelectModal
                    isOpen={isSelectModalOpen}
                    onClose={() => {
                         setIsSelectModalOpen(false);
                         setEditingSubjectIndex(null);
                    }}
                    onSelectSubject={handleSelectSubjectFromCatalog}
                    existingSubjectNames={subjects.map(s => s.name)}
                    title={editingSubjectIndex !== null ? 'החלפת מקצוע בגרות' : 'הוספת מקצוע בגרות או הגברה'}
                    targetInstitutionId={selectedInstIds.length === 1 ? (selectedInstIds[0] as any) : undefined}
               />

               {/* Admission Panel — slides in from right */}
               {panelInstitutionId && (() => {
                    const res = institutionResults.find(r => r.institutionId === panelInstitutionId);
                    if (!res) return null;
                    return (
                         <AdmissionPanel
                              isOpen={panelInstitutionId !== null}
                              onClose={() => setPanelInstitutionId(null)}
                              institutionId={panelInstitutionId}
                              institutionName={res.institutionName}
                              userGeneralSekem={res.generalSekem}
                              userEngineeringSekem={res.engineeringSekem}
                              userManagementSekem={res.managementSekem}
                              bagrutAverage={res.bagrutAverage}
                              profile={calculatedProfile}
                              institutionResult={res}
                         />
                    );
               })()}
          </div>
     );
}
