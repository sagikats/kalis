'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
     Calculator,
     GraduationCap,
     Brain,
     Zap,
     Plus,
     Trash2,
     Building2,
     ChevronLeft,
     ArrowLeft,
     Award,
     BookOpen,
     Sparkles,
     Search,
     Check,
     Filter
} from 'lucide-react';
import { SubjectInput } from '@/utils/calculators/bguCalculator';
import { calculateMultiInstitutionSekem, InstitutionSekemResult } from '@/utils/calculators/multiCalculator';
import SubjectSelectModal from '@/components/calculator/SubjectSelectModal';
import AdmissionPanel from '@/components/calculator/AdmissionPanel';
import { BagrutSubjectOption } from '@/data/bagrutSubjects';
import { resolvePsychometricScores } from '@/utils/calculators/psychometricHelper';
import UniversityLogo from '@/components/common/UniversityLogo';

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

/** Clean helper to parse number inputs preventing leading zeros (e.g. "085" -> 85) */
function cleanNumberInput(rawVal: string, minVal: number = 0, maxVal: number = 100): number | '' {
     if (rawVal === '') return '';
     const sanitized = rawVal.replace(/^0+(?=\d)/, '');
     const num = parseInt(sanitized, 10);
     if (isNaN(num)) return '';
     return Math.min(maxVal, Math.max(minVal, num));
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

     const [subjects, setSubjects] = useState<SubjectInput[]>(DEFAULT_SUBJECTS);
     const [noPsychometric, setNoPsychometric] = useState<boolean>(false);
     const [psychGeneral, setPsychGeneral] = useState<number | ''>(0);
     const [psychQuant, setPsychQuant] = useState<number | ''>(0);
     const [psychVerbal, setPsychVerbal] = useState<number | ''>(0);
     const [psychEnglish, setPsychEnglish] = useState<number | ''>(0);

     // Admission panel state
     const [panelInstitutionId, setPanelInstitutionId] = useState<string | null>(null);

     // Subject catalog modal state
     const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
     const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null);

     const mathSubject = useMemo(() => subjects.find(s => s.name.includes('מתמטיקה')) || { units: 5, grade: 0 }, [subjects]);
     const physicsSubject = useMemo(() => subjects.find(s => s.name.includes('פיזיקה')), [subjects]);

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

     // Multi-institution calculations
     const institutionResults = useMemo(() => {
          return calculateMultiInstitutionSekem(
               {
                    bagrutSubjects: subjects.map(s => ({ ...s, grade: Number(s.grade) || 0 })),
                    psychometricGeneral: Number(psychGeneral) || 0,
                    psychometricQuant: Number(psychQuant) || 0,
                    psychometricVerbal: Number(psychVerbal) || 0,
                    psychometricEnglish: Number(psychEnglish) || 0,
                    mathGrade: Number(mathSubject.grade) || 0,
                    mathUnits: mathSubject.units,
                    physicsGrade: Number(physicsSubject?.grade) || 0,
                    physicsUnits: physicsSubject?.units || 0
               },
               selectedInstIds
          );
     }, [subjects, psychGeneral, psychQuant, psychVerbal, psychEnglish, mathSubject, physicsSubject, selectedInstIds]);

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

     const allSelected = selectedInstIds.length === ALL_INSTITUTION_IDS.length;

     return (
          <div className="min-h-screen bg-[#FAF8F5] text-[#222222] font-sans dir-rtl">
               <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

                    {/* Header */}
                    <div className="space-y-4 text-center max-w-3xl mx-auto">
                         <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E0DBD0] text-[#44423D] text-xs font-semibold shadow-2xs">
                              <Calculator className="h-4 w-4 text-blue-700" />
                              <span>מחשבון סכם וקבלה אחוד לאוניברסיטאות בישראל</span>
                         </div>
                         <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#222222]">
                              מחשבון סכם <span className="text-[#111111]">כלל-אוניברסיטאי</span>
                         </h1>
                         <p className="text-sm sm:text-base text-[#55524B] leading-relaxed">
                              הזן את ציוני הבגרות והפסיכומטרי שלך פעם אחת בלבד וקבל חישוב השוואתי מדויק של ציוני הסכם בכל אוניברסיטאות היעד בישראל — הטכניון, תל אביב, העברית, בן-גוריון, בר-אילן, חיפה, אריאל ורייכמן.
                         </p>
                         <div className="flex justify-center pt-1">
                              <Link
                                   href="/flow"
                                   className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white text-xs font-bold shadow-xs transition"
                              >
                                   <Sparkles className="h-4 w-4" />
                                   <span>מעבר לבדיקת קבלה וניתוח פערים לפי תארים מבוקשים</span>
                                   <ArrowLeft className="h-3.5 w-3.5" />
                              </Link>
                         </div>
                    </div>

                    {/* Focused Institution Banner if deep-linked */}
                    {focusedInst && !allSelected && (
                         <div className="p-4 rounded-2xl bg-white border border-[#E5DFD4] flex items-center justify-between flex-wrap gap-3 shadow-2xs">
                              <div className="flex items-center gap-2 text-xs text-[#44423D]">
                                   <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                                   <span>
                                        מציג כרגע חישוב עבור <strong>{focusedInst.fullName}</strong>. מעוניין להשוות לכל האוניברסיטאות?
                                   </span>
                              </div>
                              <button
                                   onClick={selectAllInstitutions}
                                   className="px-3.5 py-1.5 rounded-xl bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                              >
                                   <Sparkles className="h-3.5 w-3.5" />
                                   <span>הצג את כל 8 האוניברסיטאות</span>
                              </button>
                         </div>
                    )}

                    {/* Institution Multi-Select Chips Bar */}
                    <div className="bg-white rounded-3xl p-6 border border-[#E5DFD4] shadow-xs space-y-4">
                         <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#EAE5DA] pb-3">
                              <div className="flex items-center gap-2.5">
                                   <Building2 className="h-5 w-5 text-blue-700" />
                                   <h3 className="text-base sm:text-lg font-bold text-[#222222]">
                                        בחר אוניברסיטאות לחישוב והשוואה:
                                   </h3>
                                   <span className="text-xs text-[#66635C] font-medium">
                                        ({selectedInstIds.length} מתוך {AVAILABLE_INSTITUTIONS.length} פעילות)
                                   </span>
                              </div>
                              <div className="flex items-center gap-3">
                                   {!allSelected && (
                                        <button
                                             onClick={selectAllInstitutions}
                                             className="text-xs font-bold text-blue-700 hover:text-blue-900 transition flex items-center gap-1 hover:underline"
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
                                             className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border shadow-2xs ${isSelected
                                                  ? 'bg-[#3C3C3C] border-[#3C3C3C] text-white'
                                                  : 'bg-[#FAF8F5] border-[#E5DFD4] text-[#55524B] hover:border-[#CCC5B6] hover:text-[#222222]'
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
                              <div className="bg-white rounded-3xl p-6 border border-[#E5DFD4] shadow-xs space-y-5">
                                   <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-4">
                                        <div className="flex items-center gap-3">
                                             <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222]">
                                                  <Brain className="h-5 w-5" />
                                             </div>
                                             <div>
                                                  <h3 className="text-lg font-bold text-[#222222]">1. ציוני בחינה פסיכומטרית</h3>
                                                  <p className="text-xs text-[#66635C]">הזן ציון רב-תחומי וציוני הפרקים (כמותי, מילולי ואנגלית)</p>
                                             </div>
                                        </div>
                                        {englishLevelBadge && (
                                             <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${englishLevelBadge.color} hidden sm:inline-block`}>
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
                                        }}
                                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${noPsychometric
                                             ? 'bg-[#F4F0E8] border-[#222222] text-[#222222]'
                                             : 'bg-[#FAF8F5] border-[#E5DFD4] text-[#44423D] hover:border-[#CCC5B6]'
                                             }`}
                                   >
                                        <div className="flex items-center gap-3">
                                             <input
                                                  type="checkbox"
                                                  checked={noPsychometric}
                                                  onChange={() => { }}
                                                  className="w-4 h-4 rounded border-[#CCC5B6] text-[#222222] focus:ring-[#222222] cursor-pointer"
                                             />
                                             <div>
                                                  <span className="text-xs font-bold block">עדיין לא עשיתי פסיכומטרי</span>
                                                  <span className="text-[11px] text-[#66635C] block mt-0.5">
                                                       בדיקת זכאות לקבלה ישירה (Direct Bagrut Admission) על סמך ממוצע בגרות בלבד
                                                  </span>
                                             </div>
                                        </div>
                                        {noPsychometric && (
                                             <span className="px-2 py-0.5 rounded-lg bg-white text-[#222222] text-[10px] font-bold border border-[#DDD7CB]">
                                                  פעיל
                                             </span>
                                        )}
                                   </div>

                                   {noPsychometric ? (
                                        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] space-y-2">
                                             <div className="flex items-center gap-2 text-[#222222] text-xs font-bold">
                                                  <Sparkles className="h-4 w-4 text-blue-700 shrink-0" />
                                                  <span>מצב חישוב ללא פסיכומטרי — קבלה ישירה על סמך בגרות</span>
                                             </div>
                                             <p className="text-[11px] text-[#55524B] leading-relaxed">
                                                  ציוני הסכם יתבססו על ממוצע הבגרות בלבד. כרטיסי האוניברסיטאות משמאל יציגו האם הינך זכאי/ת לקבלה ישירה (Direct Bagrut Admission) בהתאם לממוצע הבגרות שלך.
                                             </p>
                                        </div>
                                   ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             {/* General Psychometric */}
                                             <div className="space-y-1.5">
                                                  <label className="block text-xs font-bold text-[#44423D]">
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
                                                       placeholder="200-800"
                                                       className="w-full bg-white border border-[#DDD7CB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
                                                  />
                                             </div>

                                             {/* Quantitative */}
                                             <div className="space-y-1.5">
                                                  <label className="block text-xs font-bold text-[#44423D]">
                                                       חשיבה כמותית (50-150):
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
                                                       placeholder="50-150"
                                                       className="w-full bg-white border border-[#DDD7CB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
                                                  />
                                             </div>

                                             {/* Verbal */}
                                             <div className="space-y-1.5">
                                                  <label className="block text-xs font-bold text-[#44423D]">
                                                       חשיבה מילולית (50-150):
                                                  </label>
                                                  <input
                                                       type="number"
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
                                                       className="w-full bg-white border border-[#DDD7CB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
                                                  />
                                             </div>

                                             {/* English */}
                                             <div className="space-y-1.5">
                                                  <div className="flex items-center justify-between">
                                                       <label className="block text-xs font-bold text-[#44423D]">
                                                            אנגלית בפסיכומטרי / אמי"ר (50-150):
                                                       </label>
                                                  </div>
                                                  <input
                                                       type="number"
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
                                                       className="w-full bg-white border border-[#DDD7CB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
                                                  />
                                                  {englishLevelBadge && (
                                                       <div className="sm:hidden pt-1">
                                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${englishLevelBadge.color}`}>
                                                                 {englishLevelBadge.label}
                                                            </span>
                                                       </div>
                                                  )}
                                             </div>
                                        </div>
                                   )}

                                   {/* Live NITE composite calculation indicator */}
                                   {(psychResolution.effectiveQuantEmphasis > 0 || psychResolution.effectiveVerbalEmphasis > 0) && (
                                        <div className="pt-2 border-t border-[#EAE5DA]">
                                             <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-xs space-y-2">
                                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                                       <div className="flex items-center gap-2">
                                                            <Sparkles className="h-4 w-4 text-blue-700 shrink-0" />
                                                            <span className="font-bold text-[#222222]">
                                                                 שקלול מאל"ו רשמי לפי תחומי הבחינה:
                                                            </span>
                                                       </div>
                                                       <span className="text-[10px] text-[#66635C] font-medium">
                                                            משקלים: כמותי 60/20/20 | מילולי 60/20/20 | רב-תחומי 40/40/20
                                                       </span>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                                       <div className="p-2 rounded-xl bg-white border border-[#E5DFD4]">
                                                            <span className="text-[10px] text-[#66635C] block font-bold">רב-תחומי</span>
                                                            <span className="text-base font-black text-[#222222]">{psychResolution.effectiveGeneral || '-'}</span>
                                                       </div>
                                                       <div className="p-2 rounded-xl bg-white border border-[#E5DFD4]">
                                                            <span className="text-[10px] text-[#66635C] block font-bold">דגש כמותי (הנדסה/טכניון)</span>
                                                            <span className="text-base font-black text-[#222222]">{psychResolution.effectiveQuantEmphasis || '-'}</span>
                                                       </div>
                                                       <div className="p-2 rounded-xl bg-white border border-[#E5DFD4]">
                                                            <span className="text-[10px] text-[#66635C] block font-bold">דגש מילולי (רוח/משפטים)</span>
                                                            <span className="text-base font-black text-[#222222]">{psychResolution.effectiveVerbalEmphasis || '-'}</span>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   )}
                              </div>

                              {/* Card 2: Bagrut Subjects */}
                              <div className="bg-white rounded-3xl p-6 border border-[#E5DFD4] shadow-xs space-y-5">
                                   <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-4">
                                        <div className="flex items-center gap-3">
                                             <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222]">
                                                  <BookOpen className="h-5 w-5" />
                                             </div>
                                             <div>
                                                  <h3 className="text-lg font-bold text-[#222222]">2. ציוני תעודת בגרות (0-100)</h3>
                                                  <p className="text-xs text-[#66635C]">בונוסים מחושבים אוטומטית לפי כללי האוניברסיטאות</p>
                                             </div>
                                        </div>
                                        <span className="text-xs font-bold text-[#44423D] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#E5DFD4]">
                                             {subjects.length} מקצועות
                                        </span>
                                   </div>

                                   {/* List */}
                                   <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                                        {subjects.map((sub, idx) => (
                                             <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] hover:border-[#CCC5B6] transition">
                                                  <button
                                                       type="button"
                                                       onClick={() => handleOpenChangeModal(idx)}
                                                       className="flex items-center gap-2 text-right bg-white hover:bg-[#F3EFE8] px-3 py-1.5 rounded-xl border border-[#DDD7CB] transition group flex-1 min-w-0 shadow-2xs"
                                                       title="לחץ כדי להחליף מקצוע מתוך הרשימה"
                                                  >
                                                       <Search className="h-3.5 w-3.5 text-[#88857E] group-hover:text-[#222222] shrink-0 transition" />
                                                       <span className="text-xs font-bold text-[#222222] truncate transition">
                                                            {sub.name}
                                                       </span>
                                                  </button>
                                                  <div className="flex items-center gap-2 shrink-0">
                                                       <select
                                                            value={sub.units}
                                                            onChange={(e) => handleUpdateSubject(idx, 'units', Number(e.target.value))}
                                                            className="bg-white border border-[#DDD7CB] rounded-lg text-xs text-[#222222] font-bold px-2 py-1.5 focus:ring-1 focus:ring-[#222222]"
                                                       >
                                                            <option value={1}>1 יח"ל</option>
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
                                                            placeholder="0"
                                                            className="w-16 bg-white border border-[#DDD7CB] rounded-lg text-xs font-bold text-[#222222] text-center py-1.5 focus:ring-1 focus:ring-[#222222]"
                                                       />
                                                       <button
                                                            onClick={() => handleRemoveSubject(idx)}
                                                            className="text-[#88857E] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                                                            title="הסר מקצוע"
                                                       >
                                                            <Trash2 className="h-4 w-4" />
                                                       </button>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>

                                   {/* Add Subject Action Bar */}
                                   <div className="pt-2 border-t border-[#EAE5DA]">
                                        <button
                                             type="button"
                                             onClick={handleOpenAddModal}
                                             className="w-full py-3 px-4 rounded-2xl bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#DDD7CB] hover:border-[#CCC5B6] text-[#222222] font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-2xs group cursor-pointer"
                                        >
                                             <div className="p-1 rounded-lg bg-white border border-[#E0DBD0] transition">
                                                  <Plus className="h-4 w-4 text-[#222222]" />
                                             </div>
                                             <span>בחר והוסף מקצוע מתוך רשימת הבגרויות וההגברות (חיפוש מהיר)</span>
                                             <Search className="h-3.5 w-3.5 text-[#88857E] mr-auto group-hover:translate-x-[-2px] transition" />
                                        </button>
                                   </div>
                              </div>

                              {/* Calculate Action Button */}
                              <button
                                   onClick={() => {
                                        const resultsElem = document.getElementById('results-section');
                                        resultsElem?.scrollIntoView({ behavior: 'smooth' });
                                   }}
                                   className="w-full py-4 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 group cursor-pointer"
                              >
                                   <Zap className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
                                   <span>חשב ועדכן תוצאות לכל המוסדות הנבחרים</span>
                              </button>

                         </div>

                         {/* Right Column: Multi-Institution Comparison Results (6 cols) */}
                         <div className="lg:col-span-6 space-y-6 lg:sticky lg:top-8" id="results-section">

                              <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-4">
                                   <h3 className="text-xl font-black text-[#222222] flex items-center gap-2">
                                        <Award className="h-6 w-6 text-blue-700" />
                                        תוצאות סכם לפי מוסד לימודים
                                   </h3>
                                   <span className="text-xs text-[#44423D] font-extrabold bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#E5DFD4]">
                                        {institutionResults.length} מוסדות מוצגים
                                   </span>
                              </div>

                              {/* Dynamic Grid of Cards per Selected Institution */}
                              <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
                                   {institutionResults.map((res) => (
                                        <div
                                             key={res.institutionId}
                                             className="bg-white rounded-3xl p-5 border border-[#E5DFD4] hover:border-[#CCC5B6] shadow-xs transition space-y-4"
                                        >
                                             <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3">
                                                  <div className="flex items-center gap-3">
                                                       <UniversityLogo institution={res.institutionId} size="md" shape="rounded" />
                                                       <div>
                                                            <h4 className="text-base font-bold text-[#222222]">{res.institutionName}</h4>
                                                            {res.notes && <p className="text-[11px] text-[#66635C]">{res.notes}</p>}
                                                            {res.droppedSubjects && res.droppedSubjects.length > 0 && (
                                                                 <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                                                                      הושמטו למיקסום הממוצע: {res.droppedSubjects.join(', ')}
                                                                 </p>
                                                            )}
                                                       </div>
                                                  </div>
                                                  {res.directBagrutEligible && (
                                                       <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                            אפיק קבלה ישיר!
                                                       </span>
                                                  )}
                                             </div>

                                             <div className={`grid grid-cols-2 ${res.managementSekem !== undefined ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
                                                  {/* Bagrut Avg */}
                                                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-center">
                                                       <span className="text-[11px] text-[#66635C] block font-bold">ממוצע בגרות</span>
                                                       <span className="text-xl font-black text-[#222222] mt-1 block">{res.bagrutAverage}</span>
                                                       {res.optimalUnits && (
                                                            <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">
                                                                 {res.optimalUnits} יח"ל (אופטימלי)
                                                            </span>
                                                       )}
                                                  </div>

                                                  {/* General Sekem */}
                                                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-center">
                                                       <span className="text-[11px] text-[#66635C] block font-bold">סכם כללי</span>
                                                       <span className="text-xl font-black text-[#222222] mt-1 block">{res.generalSekem}</span>
                                                  </div>

                                                  {/* Engineering Sekem */}
                                                  {res.engineeringSekem !== undefined && (
                                                       <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-center">
                                                            <span className="text-[11px] text-[#66635C] block font-bold">סכם כמותי/הנדסה</span>
                                                            <span className="text-xl font-black text-[#222222] mt-1 block">{res.engineeringSekem}</span>
                                                       </div>
                                                  )}

                                                  {/* Management Sekem */}
                                                  {res.managementSekem !== undefined && (
                                                       <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-center">
                                                            <span className="text-[11px] text-[#66635C] block font-bold">התאמה לניהול</span>
                                                            <span className="text-xl font-black text-[#222222] mt-1 block">{res.managementSekem}</span>
                                                       </div>
                                                  )}
                                             </div>

                                             {/* Action buttons row */}
                                             <div className="flex gap-2">
                                                  <button
                                                       onClick={() => setPanelInstitutionId(res.institutionId)}
                                                       className="flex-1 py-2.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                                                  >
                                                       <GraduationCap className="h-3.5 w-3.5" />
                                                       <span>מה הסיכויים שלי?</span>
                                                  </button>
                                                  <Link
                                                       href="/flow"
                                                       className="px-3 py-2.5 bg-[#FAF8F5] hover:bg-[#EFEAE0] text-[#222222] border border-[#DDD7CB] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shrink-0"
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
                         />
                    );
               })()}
          </div>
     );
}
