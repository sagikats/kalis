'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	Calculator,
	GraduationCap,
	Sparkles,
	Sliders,
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	AlertCircle,
	BookOpen,
	Brain,
	Plus,
	Trash2,
	RefreshCw,
	Layers,
	Target,
	Search
} from 'lucide-react';

import { SubjectInput } from '@/utils/calculators/bguCalculator';
import { calculateMultiInstitutionSekem, InstitutionSekemResult } from '@/utils/calculators/multiCalculator';
import { resolvePsychometricScores } from '@/utils/calculators/psychometricHelper';
import SubjectSelectModal from '@/components/calculator/SubjectSelectModal';
import { BagrutSubjectOption } from '@/data/bagrutSubjects';

import DegreeSearchSelector from '@/components/flow/DegreeSearchSelector';
import PersonalAdmissionReport from '@/components/flow/PersonalAdmissionReport';
import PreferenceQuestionnaire from '@/components/flow/PreferenceQuestionnaire';
import RecommendedTracksView from '@/components/flow/RecommendedTracksView';
import AcceptedRegistrationCard from '@/components/flow/AcceptedRegistrationCard';
import {
	TargetProgramSelection,
	ProgramGapAnalysis,
	analyzeProgramGap,
	UserAcademicProfile
} from '@/utils/analysis/gapAnalyzer';
import {
	UserPreferencesQuestionnaire,
	RecommendedTrack,
	generatePersonalizedTracks
} from '@/utils/analysis/trackGenerator';

const STORAGE_KEY = 'kalis_admission_flow_data';

const DEFAULT_SUBJECTS: SubjectInput[] = [
	{ name: 'תנ"ך', units: 2, grade: 78 },
	{ name: 'ספרות עברית', units: 2, grade: 80 },
	{ name: 'אזרחות', units: 2, grade: 84 },
	{ name: 'היסטוריה / תע"י', units: 2, grade: 82 },
	{ name: 'הבעה עברית', units: 2, grade: 85 },
	{ name: 'אנגלית', units: 5, grade: 90 },
	{ name: 'מתמטיקה', units: 5, grade: 88 },
	{ name: 'פיזיקה', units: 5, grade: 86 }
];

const INITIAL_PSYCH = {
	general: 680,
	quant: 138,
	verbal: 132,
	english: 125
};

function cleanNumberInput(rawVal: string, minVal: number = 0, maxVal: number = 100): number | '' {
	if (rawVal === '') return '';
	const sanitized = rawVal.replace(/^0+(?=\d)/, '');
	const num = parseInt(sanitized, 10);
	if (isNaN(num)) return '';
	return Math.min(maxVal, Math.max(minVal, num));
}

export default function AdmissionFlowPage() {
	const router = useRouter();
	const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

	// Step 1: Grades State
	const [subjects, setSubjects] = useState<SubjectInput[]>(DEFAULT_SUBJECTS);
	const [hasTakenPsychometric, setHasTakenPsychometric] = useState<boolean>(true);
	const [psychGeneral, setPsychGeneral] = useState<number | ''>(INITIAL_PSYCH.general);
	const [psychQuant, setPsychQuant] = useState<number | ''>(INITIAL_PSYCH.quant);
	const [psychVerbal, setPsychVerbal] = useState<number | ''>(INITIAL_PSYCH.verbal);
	const [psychEnglish, setPsychEnglish] = useState<number | ''>(INITIAL_PSYCH.english);

	// Step 2: Target Programs Wishlist
	const [selectedTargets, setSelectedTargets] = useState<TargetProgramSelection[]>([]);

	// Step 4: Focused program for deep-dive
	const [focusedProgramId, setFocusedProgramId] = useState<string | null>(null);

	// Step 5: Questionnaire Preferences State
	const [questionnaireAnswers, setQuestionnaireAnswers] = useState<UserPreferencesQuestionnaire | null>(null);

	// Modal State for adding/changing subjects
	const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
	const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null);

	// Load from LocalStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				if (parsed.subjects && parsed.subjects.length > 0) setSubjects(parsed.subjects);
				if (parsed.hasTakenPsychometric !== undefined) setHasTakenPsychometric(parsed.hasTakenPsychometric);
				if (parsed.psychGeneral !== undefined) setPsychGeneral(parsed.psychGeneral);
				if (parsed.psychQuant !== undefined) setPsychQuant(parsed.psychQuant);
				if (parsed.psychVerbal !== undefined) setPsychVerbal(parsed.psychVerbal);
				if (parsed.psychEnglish !== undefined) setPsychEnglish(parsed.psychEnglish);
				if (parsed.selectedTargets && parsed.selectedTargets.length > 0)
					setSelectedTargets(parsed.selectedTargets);
				if (parsed.questionnaireAnswers) setQuestionnaireAnswers(parsed.questionnaireAnswers);
				if (parsed.activeStep) setActiveStep(parsed.activeStep);
			}
		} catch (e) {
			console.error('Failed to load saved admission flow data', e);
		}
	}, []);

	// Save to LocalStorage on change
	useEffect(() => {
		try {
			const toSave = {
				subjects,
				hasTakenPsychometric,
				psychGeneral,
				psychQuant,
				psychVerbal,
				psychEnglish,
				selectedTargets,
				questionnaireAnswers,
				activeStep
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
		} catch (e) {
			console.error('Failed to persist admission flow data', e);
		}
	}, [subjects, hasTakenPsychometric, psychGeneral, psychQuant, psychVerbal, psychEnglish, selectedTargets, questionnaireAnswers, activeStep]);

	// Extract Math & Physics for university engines
	const mathSubject = useMemo(() => {
		return (
			subjects.find((s) => s.name.trim().includes('מתמטיקה')) || {
				name: 'מתמטיקה',
				units: 5,
				grade: 0
			}
		);
	}, [subjects]);

	const physicsSubject = useMemo(() => {
		return subjects.find((s) => s.name.trim().includes('פיזיקה'));
	}, [subjects]);

	// Calculate NITE Psychometric Scores
	const psychResolution = useMemo(() => {
		return resolvePsychometricScores({
			general: psychGeneral,
			quant: psychQuant,
			verbal: psychVerbal,
			english: psychEnglish
		});
	}, [psychGeneral, psychQuant, psychVerbal, psychEnglish]);

	// User Academic Profile object
	const userProfile: UserAcademicProfile = useMemo(() => {
		const isPsych = hasTakenPsychometric;
		return {
			bagrutSubjects: subjects.map((s) => ({ ...s, grade: Number(s.grade) || 0 })),
			psychometricGeneral: isPsych ? Number(psychGeneral) || 0 : 0,
			psychometricQuant: isPsych ? Number(psychQuant) || 0 : 0,
			psychometricVerbal: isPsych ? Number(psychVerbal) || 0 : 0,
			psychometricEnglish: isPsych ? Number(psychEnglish) || 0 : 0,
			mathGrade: Number(mathSubject.grade) || 0,
			mathUnits: mathSubject.units,
			physicsGrade: Number(physicsSubject?.grade) || 0,
			physicsUnits: physicsSubject?.units || 0
		};
	}, [subjects, hasTakenPsychometric, psychGeneral, psychQuant, psychVerbal, psychEnglish, mathSubject, physicsSubject]);

	// Multi-institution calculations (all 6 universities)
	const institutionResultsMap = useMemo(() => {
		const isPsych = hasTakenPsychometric;
		const resList = calculateMultiInstitutionSekem(
			{
				...userProfile,
				psychometricGeneral: isPsych ? Number(psychGeneral) || 0 : 0,
				psychometricQuant: isPsych ? Number(psychQuant) || 0 : 0
			},
			['bgu', 'tau', 'huji', 'technion', 'ariel', 'haifa', 'bar_ilan', 'reichman']
		);

		const map: Record<string, InstitutionSekemResult> = {};
		resList.forEach((r) => {
			map[r.institutionId] = r;
		});
		return map;
	}, [userProfile, hasTakenPsychometric, psychGeneral, psychQuant]);

	// Gap Analyses for all selected programs
	const gapAnalyses: ProgramGapAnalysis[] = useMemo(() => {
		return selectedTargets.map((target) => {
			const instRes = institutionResultsMap[target.calculatorId] || {
				institutionId: target.calculatorId,
				institutionName: target.institutionName,
				logoText: '',
				badgeColor: '',
				bagrutAverage: 0,
				generalSekem: Number(psychGeneral) || 0,
				directBagrutEligible: false
			};

			return analyzeProgramGap(target, userProfile, instRes);
		});
	}, [selectedTargets, userProfile, institutionResultsMap, psychGeneral]);

	// Currently focused gap analysis for Step 4
	const currentFocusedAnalysis = useMemo(() => {
		if (focusedProgramId) {
			const found = gapAnalyses.find((a) => a.target.program.id === focusedProgramId);
			if (found) return found;
		}
		// Fallback to first non-accepted or first program
		const notAccepted = gapAnalyses.find((a) => a.status === 'not_accepted' || a.status === 'borderline');
		return notAccepted || gapAnalyses[0] || null;
	}, [gapAnalyses, focusedProgramId]);

	// Handlers for Subject Entry
	const handleSubjectChange = (index: number, field: 'units' | 'grade', value: number | string) => {
		const updated = [...subjects];
		let val = Number(value);
		if (field === 'grade') {
			val = cleanNumberInput(String(value), 0, 100) as number;
		}
		updated[index] = { ...updated[index], [field]: val };
		setSubjects(updated);
	};

	const handleAddSubjectFromCatalog = (option: BagrutSubjectOption) => {
		if (editingSubjectIndex !== null) {
			const updated = [...subjects];
			updated[editingSubjectIndex] = {
				name: option.name,
				units: option.defaultUnits,
				grade: updated[editingSubjectIndex].grade || 85
			};
			setSubjects(updated);
		} else {
			setSubjects([...subjects, { name: option.name, units: option.defaultUnits, grade: 85 }]);
		}
		setIsSubjectModalOpen(false);
		setEditingSubjectIndex(null);
	};

	const handleDeleteSubject = (index: number) => {
		setSubjects(subjects.filter((_, i) => i !== index));
	};

	// Handlers for Target Wishlist
	const handleToggleTarget = (target: TargetProgramSelection) => {
		const exists = selectedTargets.some((t) => t.program.id === target.program.id);
		if (exists) {
			setSelectedTargets(selectedTargets.filter((t) => t.program.id !== target.program.id));
		} else {
			setSelectedTargets([...selectedTargets, target]);
		}
	};

	const handleAddMultipleTargets = (targets: TargetProgramSelection[]) => {
		const newTargets = [...selectedTargets];
		for (const target of targets) {
			if (!newTargets.some((t) => t.program.id === target.program.id)) {
				newTargets.push(target);
			}
		}
		setSelectedTargets(newTargets);
	};

	const handleRemoveTarget = (programId: string) => {
		setSelectedTargets(selectedTargets.filter((t) => t.program.id !== programId));
	};

	const handleClearAllTargets = () => {
		setSelectedTargets([]);
	};

	const handleViewGapForProgram = (programId: string) => {
		setFocusedProgramId(programId);
		setActiveStep(4);
	};

	const handlePlanTrackCTA = (programTitle: string) => {
		const found = gapAnalyses.find(
			(a) => a.target.program.fieldOfStudy === programTitle || a.target.program.id === focusedProgramId
		);
		if (found) {
			setFocusedProgramId(found.target.program.id);
		}
		setActiveStep(4);
	};

	// Generate the 3 tailored, realistic tracks for Step 5
	const recommendedTracks = useMemo(() => {
		if (!currentFocusedAnalysis || !questionnaireAnswers) return null;
		const instRes = institutionResultsMap[currentFocusedAnalysis.target.calculatorId];
		if (!instRes) return null;
		return generatePersonalizedTracks(
			currentFocusedAnalysis,
			userProfile,
			instRes,
			questionnaireAnswers
		);
	}, [currentFocusedAnalysis, questionnaireAnswers, institutionResultsMap, userProfile]);

	return (
		<div className="min-h-screen bg-[#FAF8F5] text-[#222222] font-sans dir-rtl">
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
				{/* Top Stepper Navigation */}
				<div className="bg-white border border-[#E5DFD4] rounded-3xl p-4 sm:p-5 shadow-xs">
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
						<button
							onClick={() => setActiveStep(1)}
							className={`p-3 rounded-2xl transition flex items-center gap-3 text-right border ${
								activeStep === 1
									? 'bg-[#3C3C3C] border-[#3C3C3C] text-white shadow-xs'
									: 'bg-[#FAF8F5] border-[#E5DFD4] text-[#66635C] hover:text-[#222222]'
							}`}
						>
							<div
								className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 1
										? 'bg-white text-black shadow-xs'
										: 'bg-[#E5DFD4] text-[#44423D]'
								}`}
							>
								1
							</div>
							<div className="overflow-hidden">
								<span className="text-xs font-bold block truncate">הזנת ציונים</span>
								<span className="text-[10px] text-inherit opacity-80 block truncate">בגרויות ופסיכומטרי</span>
							</div>
						</button>

						<button
							onClick={() => setActiveStep(2)}
							className={`p-3 rounded-2xl transition flex items-center gap-3 text-right border ${
								activeStep === 2
									? 'bg-[#3C3C3C] border-[#3C3C3C] text-white shadow-xs'
									: 'bg-[#FAF8F5] border-[#E5DFD4] text-[#66635C] hover:text-[#222222]'
							}`}
						>
							<div
								className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 2
										? 'bg-white text-black shadow-xs'
										: 'bg-[#E5DFD4] text-[#44423D]'
								}`}
							>
								2
							</div>
							<div className="overflow-hidden">
								<span className="text-xs font-bold block truncate">בחירת תארים</span>
								<span className="text-[10px] text-inherit opacity-80 block truncate">
									סל מבוקשים ({selectedTargets.length})
								</span>
							</div>
						</button>

						<button
							onClick={() => setActiveStep(3)}
							className={`p-3 rounded-2xl transition flex items-center gap-3 text-right border ${
								activeStep === 3
									? 'bg-[#3C3C3C] border-[#3C3C3C] text-white shadow-xs'
									: 'bg-[#FAF8F5] border-[#E5DFD4] text-[#66635C] hover:text-[#222222]'
							}`}
						>
							<div
								className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 3
										? 'bg-white text-black shadow-xs'
										: 'bg-[#E5DFD4] text-[#44423D]'
								}`}
							>
								3
							</div>
							<div className="overflow-hidden">
								<span className="text-xs font-bold block truncate">דוח קבלה אישי</span>
								<span className="text-[10px] text-inherit opacity-80 block truncate">סטטוסים והערכה</span>
							</div>
						</button>

						<button
							onClick={() => setActiveStep(4)}
							className={`p-3 rounded-2xl transition flex items-center gap-3 text-right border ${
								activeStep === 4
									? 'bg-[#3C3C3C] border-[#3C3C3C] text-white shadow-xs'
									: 'bg-[#FAF8F5] border-[#E5DFD4] text-[#66635C] hover:text-[#222222]'
							}`}
						>
							<div
								className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 4
										? 'bg-white text-black shadow-xs'
										: 'bg-[#E5DFD4] text-[#44423D]'
								}`}
							>
								4
							</div>
							<div className="overflow-hidden">
								<span className="text-xs font-bold block truncate">תכנון מסלולי פעולה</span>
								<span className="text-[10px] text-inherit opacity-80 block truncate">3 מסלולים + מסלול אישי</span>
							</div>
						</button>
					</div>
				</div>

				{/* STEP 1: הזנת ציונים */}
				{activeStep === 1 && (
					<div className="space-y-6">
						<div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#EAE5DA] pb-4">
							<div>
								<h2 className="text-2xl font-black text-[#222222]">שלב 1: הזנת ציונים</h2>
								<p className="text-sm text-[#66635C]">
									הזן את ציוני הבגרות והפסיכומטרי שלך — המערכת מחשבת אוטומטית ממוצע אופטימלי וסכמים לכל האוניברסיטאות
								</p>
							</div>
							<button
								onClick={() => setActiveStep(2)}
								className="px-6 py-3 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
							>
								<span>המשך לבחירת תארים מבוקשים</span>
								<ArrowLeft className="h-4 w-4" />
							</button>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
							{/* Psychometric Input (5 cols) */}
							<div className="lg:col-span-5 space-y-5 bg-white rounded-3xl p-6 border border-[#E5DFD4] shadow-xs">
								<div className="flex items-center gap-3 border-b border-[#EAE5DA] pb-3">
									<div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222]">
										<Brain className="h-5 w-5" />
									</div>
									<div>
										<h3 className="text-base font-bold text-[#222222]">ציוני בחינה פסיכומטרית</h3>
										<p className="text-xs text-[#66635C]">ציון רב-תחומי וציוני פרקים (50–150)</p>
									</div>
								</div>

								{/* Option: Haven't taken psychometric yet */}
								<div
									onClick={() => {
										const nextVal = !hasTakenPsychometric;
										setHasTakenPsychometric(nextVal);
										if (!nextVal) {
											setPsychGeneral(0);
											setPsychQuant(0);
											setPsychVerbal(0);
											setPsychEnglish(0);
										} else {
											setPsychGeneral(INITIAL_PSYCH.general);
											setPsychQuant(INITIAL_PSYCH.quant);
											setPsychVerbal(INITIAL_PSYCH.verbal);
											setPsychEnglish(INITIAL_PSYCH.english);
										}
									}}
									className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
										!hasTakenPsychometric
											? 'bg-[#F4F0E8] border-[#222222] text-[#222222]'
											: 'bg-[#FAF8F5] border-[#E5DFD4] text-[#44423D] hover:border-[#CCC5B6]'
									}`}
								>
									<div className="flex items-center gap-3">
										<input
											type="checkbox"
											checked={!hasTakenPsychometric}
											onChange={() => {}}
											className="w-4 h-4 rounded border-[#CCC5B6] text-[#222222] focus:ring-[#222222] cursor-pointer"
										/>
										<div>
											<span className="text-xs font-bold block">עדיין לא עשיתי פסיכומטרי</span>
											<span className="text-[11px] text-[#66635C] block mt-0.5">
												טרם ניגשתי לבחינה / מעוניין לבדוק קבלה על סמך בגרות בלבד
											</span>
										</div>
									</div>
									{!hasTakenPsychometric && (
										<span className="px-2 py-0.5 rounded-lg bg-white text-[#222222] text-[10px] font-bold border border-[#DDD7CB]">
											פעיל
										</span>
									)}
								</div>

								{!hasTakenPsychometric ? (
									<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] space-y-2">
										<div className="flex items-center gap-2 text-[#222222] text-xs font-bold">
											<Sparkles className="h-4 w-4 text-blue-700 shrink-0" />
											<span>נבדוק קבלה ישירה ונחשב עבורך ציוני יעד!</span>
										</div>
										<p className="text-[11px] text-[#55524B] leading-relaxed">
											המערכת תבדוק אילו תארים מאפשרים קבלה ישירה על סמך ממוצע בגרות בלבד, ובשלב התכנון תחשב בדיוק איזה ציון פסיכומטרי יעד יידרש ממך בבחינה הראשונה לכל תואר מבוקש.
										</p>
									</div>
								) : (
									<div className="space-y-4">
										<div className="space-y-1.5">
											<label className="block text-xs font-bold text-[#44423D]">
												ציון רב-תחומי (200–800):
											</label>
											<input
												type="number"
												min={200}
												max={800}
												value={psychGeneral}
												onChange={(e) =>
													setPsychGeneral(cleanNumberInput(e.target.value, 0, 800) as number)
												}
												placeholder="200-800"
												className="w-full bg-white border border-[#DDD7CB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
											/>
										</div>

										<div className="grid grid-cols-3 gap-2.5">
											<div className="space-y-1.5">
												<label className="block text-[11px] font-bold text-[#44423D]">כמותי:</label>
												<input
													type="number"
													min={50}
													max={150}
													value={psychQuant}
													onChange={(e) =>
														setPsychQuant(cleanNumberInput(e.target.value, 0, 150) as number)
													}
													placeholder="50-150"
													className="w-full bg-white border border-[#DDD7CB] rounded-xl px-3 py-2 text-xs font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
												/>
											</div>

											<div className="space-y-1.5">
												<label className="block text-[11px] font-bold text-[#44423D]">מילולי:</label>
												<input
													type="number"
													min={50}
													max={150}
													value={psychVerbal}
													onChange={(e) =>
														setPsychVerbal(cleanNumberInput(e.target.value, 0, 150) as number)
													}
													placeholder="50-150"
													className="w-full bg-white border border-[#DDD7CB] rounded-xl px-3 py-2 text-xs font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
												/>
											</div>

											<div className="space-y-1.5">
												<label className="block text-[11px] font-bold text-[#44423D]">אנגלית:</label>
												<input
													type="number"
													min={50}
													max={150}
													value={psychEnglish}
													onChange={(e) =>
														setPsychEnglish(cleanNumberInput(e.target.value, 0, 150) as number)
													}
													placeholder="50-150"
													className="w-full bg-white border border-[#DDD7CB] rounded-xl px-3 py-2 text-xs font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
												/>
											</div>
										</div>

										{/* English Classification */}
										{psychResolution.englishClassification.level !== 'unknown' && (
											<div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-between text-xs">
												<span className="text-[#66635C] font-medium">רמת אנגלית אקדמית:</span>
												<span
													className={`font-bold px-2 py-0.5 rounded border ${psychResolution.englishClassification.color}`}
												>
													{psychResolution.englishClassification.label}
												</span>
											</div>
										)}

										{/* Calculated Weights info */}
										<div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] text-[11px] text-[#66635C] space-y-1">
											<div className="flex justify-between">
												<span>שקלול מאל״ו בדגש כמותי:</span>
												<span className="font-bold text-[#222222]">
													{psychResolution.effectiveQuantEmphasis}
												</span>
											</div>
											<div className="flex justify-between">
												<span>שקלול מאל״ו בדגש מילולי:</span>
												<span className="font-bold text-[#222222]">
													{psychResolution.effectiveVerbalEmphasis}
												</span>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Bagrut Input (7 cols) */}
							<div className="lg:col-span-7 space-y-4 bg-white rounded-3xl p-6 border border-[#E5DFD4] shadow-xs">
								<div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3">
									<div className="flex items-center gap-2.5">
										<BookOpen className="h-5 w-5 text-blue-700" />
										<h3 className="text-base font-bold text-[#222222]">
											ציוני תעודת בגרות ({subjects.length} מקצועות)
										</h3>
									</div>
									<button
										onClick={() => {
											setEditingSubjectIndex(null);
											setIsSubjectModalOpen(true);
										}}
										className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DDD7CB] text-[#222222] hover:bg-[#EFEAE0] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
									>
										<Plus className="h-3.5 w-3.5" />
										<span>הוסף מקצוע / הגברה</span>
									</button>
								</div>

								{/* Subjects List */}
								<div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
									{subjects.map((sub, idx) => (
										<div
											key={idx}
											className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4]"
										>
											<div className="flex-1 min-w-0">
												<span className="text-xs font-bold text-[#222222] block truncate">
													{sub.name}
												</span>
											</div>

											{/* Units selector */}
											<select
												value={sub.units}
												onChange={(e) => handleSubjectChange(idx, 'units', e.target.value)}
												className="bg-white border border-[#DDD7CB] text-xs font-bold text-[#222222] rounded-xl px-2.5 py-1.5 focus:outline-none"
											>
												<option value={2}>2 יח״ל</option>
												<option value={3}>3 יח״ל</option>
												<option value={4}>4 יח״ל</option>
												<option value={5}>5 יח״ל</option>
											</select>

											{/* Grade input */}
											<input
												type="number"
												min={0}
												max={100}
												value={sub.grade}
												onChange={(e) => handleSubjectChange(idx, 'grade', e.target.value)}
												placeholder="ציון"
												className="w-16 bg-white border border-[#DDD7CB] text-xs font-bold text-center text-[#222222] rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#222222]"
											/>

											<button
												onClick={() => handleDeleteSubject(idx)}
												className="p-1 text-[#88857E] hover:text-rose-600 transition cursor-pointer"
												title="מחק מקצוע"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* STEP 2: בחירת תארים מבוקשים */}
				{activeStep === 2 && (
					<div className="space-y-6">
						<div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#EAE5DA] pb-4">
							<div>
								<h2 className="text-2xl font-black text-[#222222]">שלב 2: בחירת תארים מבוקשים</h2>
								<p className="text-sm text-[#66635C]">
									בחר את כל התארים והמוסדות שמעניין אותך לבדוק. תוכל להוסיף תארים מרובים מכל מוסד.
								</p>
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={() => setActiveStep(1)}
									className="px-4 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-[#DDD7CB] shadow-2xs cursor-pointer"
								>
									<ArrowRight className="h-4 w-4" />
									<span>חזור לציונים</span>
								</button>
								<button
									onClick={() => setActiveStep(3)}
									disabled={selectedTargets.length === 0}
									className={`px-6 py-2.5 font-bold text-xs rounded-xl transition flex items-center gap-2 ${
										selectedTargets.length > 0
											? 'bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white shadow-xs cursor-pointer'
											: 'bg-[#E5DFD4] text-[#88857E] cursor-not-allowed border border-[#DDD7CB]'
									}`}
								>
									<span>המשך לדוח קבלה אישי ({selectedTargets.length})</span>
									<ArrowLeft className="h-4 w-4" />
								</button>
							</div>
						</div>

						<DegreeSearchSelector
							selectedPrograms={selectedTargets}
							onToggleProgram={handleToggleTarget}
							onAddMultiplePrograms={handleAddMultipleTargets}
							onRemoveProgram={handleRemoveTarget}
							onClearAll={handleClearAllTargets}
						/>
					</div>
				)}

				{/* STEP 3: דוח קבלה אישי */}
				{activeStep === 3 && (
					<div className="space-y-6">
						<div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#EAE5DA] pb-4">
							<div>
								<h2 className="text-2xl font-black text-[#222222]">שלב 3: דוח קבלה אישי</h2>
								<p className="text-sm text-[#66635C]">
									סיכום סטטוס הקבלה שלך עבור כל התארים שבחרת
								</p>
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={() => setActiveStep(2)}
									className="px-4 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-[#DDD7CB] shadow-2xs cursor-pointer"
								>
									<ArrowRight className="h-4 w-4" />
									<span>ערוך בחירת תארים</span>
								</button>
								<button
									onClick={() => setActiveStep(4)}
									className="px-6 py-2.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
								>
									<span>לתכנון מסלולי פעולה</span>
									<ArrowLeft className="h-4 w-4" />
								</button>
							</div>
						</div>

						<PersonalAdmissionReport
							analyses={gapAnalyses}
							onViewGap={handleViewGapForProgram}
							onAddMorePrograms={() => setActiveStep(2)}
						/>
					</div>
				)}

				{/* STEP 4: תכנון מסלולי פעולה ובניית מסלול אישי */}
				{activeStep === 4 && (
					<div className="space-y-6">
						{currentFocusedAnalysis ? (
							currentFocusedAnalysis.status === 'accepted' ? (
								<AcceptedRegistrationCard
									analysis={currentFocusedAnalysis}
									otherAnalyses={gapAnalyses}
									onSelectOtherProgram={(programId) => setFocusedProgramId(programId)}
									onBackToReport={() => setActiveStep(3)}
								/>
							) : !questionnaireAnswers || !recommendedTracks ? (
								<PreferenceQuestionnaire
									analysis={currentFocusedAnalysis}
									initialAnswers={questionnaireAnswers || undefined}
									onSubmit={(answers) => setQuestionnaireAnswers(answers)}
									onCancel={() => setActiveStep(3)}
								/>
							) : (
								<RecommendedTracksView
									analysis={currentFocusedAnalysis}
									allAnalyses={gapAnalyses}
									tracks={recommendedTracks}
									userProfile={userProfile}
									institutionResult={institutionResultsMap[currentFocusedAnalysis.target.calculatorId]}
									mechinaAvailable={currentFocusedAnalysis.status === 'not_accepted' || currentFocusedAnalysis.gap < 0}
									mechinaReason={
										currentFocusedAnalysis.status === 'not_accepted'
											? 'הפער מהסף מצדיק שקילת מכינה אקדמית'
											: undefined
									}
									onSelectProgram={(programId) => setFocusedProgramId(programId)}
									onEditPreferences={() => setQuestionnaireAnswers(null)}
									onBackToReport={() => setActiveStep(3)}
								/>
							)
						) : (
							<div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#E5DFD4] shadow-xs space-y-4">
								<Target className="h-12 w-12 text-[#88857E] mx-auto" />
								<h3 className="text-lg font-bold text-[#222222]">טרם נבחר תואר לתכנון מסלול</h3>
								<p className="text-sm text-[#66635C]">
									בחר תואר מתוך רשימת המבוקשים שלך או מדוח הקבלה כדי שנוכל לבנות עבורך 3 מסלולי שיפור מותאמים.
								</p>
								<button
									onClick={() => setActiveStep(2)}
									className="px-6 py-2.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl transition cursor-pointer"
								>
									בחר תארים עכשיו
								</button>
							</div>
						)}
					</div>
				)}

				{/* Subject Select Modal for Step 1 */}
				<SubjectSelectModal
					isOpen={isSubjectModalOpen}
					onClose={() => {
						setIsSubjectModalOpen(false);
						setEditingSubjectIndex(null);
					}}
					onSelectSubject={handleAddSubjectFromCatalog}
					existingSubjectNames={subjects.map((s) => s.name)}
					title={editingSubjectIndex !== null ? 'החלפת מקצוע בגרות' : 'הוספת מקצוע בגרות או הגברה'}
				/>
			</main>
		</div>
	);
}
