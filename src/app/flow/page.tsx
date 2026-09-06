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
			['bgu', 'tau', 'huji', 'technion', 'ariel', 'haifa']
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
		<div className="min-h-screen bg-slate-950 text-slate-100 font-sans dir-rtl">
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
				{/* Top Stepper Navigation */}
				<div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl">
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
						<button
							onClick={() => setActiveStep(1)}
							className={`p-3 rounded-2xl transition flex items-center gap-3 text-right border ${
								activeStep === 1
									? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
									: 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
							}`}
						>
							<div
								className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 1
										? 'bg-cyan-400 text-slate-950 shadow-sm'
										: 'bg-slate-800 text-slate-300'
								}`}
							>
								1
							</div>
							<div className="overflow-hidden">
								<span className="text-xs font-black block truncate">הזנת ציונים</span>
								<span className="text-[10px] text-slate-400 block truncate">בגרויות ופסיכומטרי</span>
							</div>
						</button>

						<button
							onClick={() => setActiveStep(2)}
							className={`p-3 rounded-2xl transition flex items-center gap-3 text-right border ${
								activeStep === 2
									? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
									: 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
							}`}
						>
							<div
								className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 2
										? 'bg-cyan-400 text-slate-950 shadow-sm'
										: 'bg-slate-800 text-slate-300'
								}`}
							>
								2
							</div>
							<div className="overflow-hidden">
								<span className="text-xs font-black block truncate">בחירת תארים</span>
								<span className="text-[10px] text-slate-400 block truncate">
									סל מבוקשים ({selectedTargets.length})
								</span>
							</div>
						</button>

						<button
							onClick={() => setActiveStep(3)}
							className={`p-3 rounded-2xl transition flex items-center gap-3 text-right border ${
								activeStep === 3
									? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
									: 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
							}`}
						>
							<div
								className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 3
										? 'bg-cyan-400 text-slate-950 shadow-sm'
										: 'bg-slate-800 text-slate-300'
								}`}
							>
								3
							</div>
							<div className="overflow-hidden">
								<span className="text-xs font-black block truncate">דוח קבלה אישי</span>
								<span className="text-[10px] text-slate-400 block truncate">סטטוסים והערכה</span>
							</div>
						</button>

						<button
							onClick={() => setActiveStep(4)}
							className={`p-3 rounded-2xl transition flex items-center gap-3 text-right border ${
								activeStep === 4
									? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
									: 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
							}`}
						>
							<div
								className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 4
										? 'bg-cyan-400 text-slate-950 shadow-sm'
										: 'bg-slate-800 text-slate-300'
								}`}
							>
								4
							</div>
							<div className="overflow-hidden">
								<span className="text-xs font-black block truncate">תכנון מסלולי פעולה</span>
								<span className="text-[10px] text-slate-400 block truncate">3 מסלולים + מסלול אישי</span>
							</div>
						</button>
					</div>
				</div>

				{/* STEP 1: הזנת ציונים */}
				{activeStep === 1 && (
					<div className="space-y-6">
						<div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
							<div>
								<h2 className="text-2xl font-black text-white">שלב 1: הזנת ציונים</h2>
								<p className="text-sm text-slate-400">
									הזן את ציוני הבגרות והפסיכומטרי שלך — המערכת מחשבת אוטומטית ממוצע אופטימלי וסכמים לכל האוניברסיטאות
								</p>
							</div>
							<button
								onClick={() => setActiveStep(2)}
								className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 transition flex items-center gap-2"
							>
								<span>המשך לבחירת תארים מבוקשים</span>
								<ArrowLeft className="h-4 w-4" />
							</button>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
							{/* Psychometric Input (5 cols) */}
							<div className="lg:col-span-5 space-y-5 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl">
								<div className="flex items-center gap-3 border-b border-slate-800 pb-3">
									<div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
										<Brain className="h-5 w-5" />
									</div>
									<div>
										<h3 className="text-base font-bold text-white">ציוני בחינה פסיכומטרית</h3>
										<p className="text-xs text-slate-400">ציון רב-תחומי וציוני פרקים (50–150)</p>
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
											? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
											: 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
									}`}
								>
									<div className="flex items-center gap-3">
										<input
											type="checkbox"
											checked={!hasTakenPsychometric}
											onChange={() => {}}
											className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
										/>
										<div>
											<span className="text-xs font-black block">עדיין לא עשיתי פסיכומטרי</span>
											<span className="text-[11px] text-slate-400 block mt-0.5">
												טרם ניגשתי לבחינה / מעוניין לבדוק קבלה על סמך בגרות בלבד
											</span>
										</div>
									</div>
									{!hasTakenPsychometric && (
										<span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
											פעיל
										</span>
									)}
								</div>

								{!hasTakenPsychometric ? (
									<div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
										<div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
											<Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
											<span>נבדוק קבלה ישירה ונחשב עבורך ציוני יעד!</span>
										</div>
										<p className="text-[11px] text-slate-300 leading-relaxed">
											המערכת תבדוק אילו תארים מאפשרים קבלה ישירה על סמך ממוצע בגרות בלבד, ובשלב התכנון תחשב בדיוק איזה ציון פסיכומטרי יעד יידרש ממך בבחינה הראשונה לכל תואר מבוקש.
										</p>
									</div>
								) : (
									<div className="space-y-4">
										<div className="space-y-1.5">
											<label className="block text-xs font-bold text-slate-300">
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
												className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
											/>
										</div>

										<div className="grid grid-cols-3 gap-2.5">
											<div className="space-y-1.5">
												<label className="block text-[11px] font-bold text-slate-300">כמותי:</label>
												<input
													type="number"
													min={50}
													max={150}
													value={psychQuant}
													onChange={(e) =>
														setPsychQuant(cleanNumberInput(e.target.value, 0, 150) as number)
													}
													placeholder="50-150"
													className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
												/>
											</div>

											<div className="space-y-1.5">
												<label className="block text-[11px] font-bold text-slate-300">מילולי:</label>
												<input
													type="number"
													min={50}
													max={150}
													value={psychVerbal}
													onChange={(e) =>
														setPsychVerbal(cleanNumberInput(e.target.value, 0, 150) as number)
													}
													placeholder="50-150"
													className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
												/>
											</div>

											<div className="space-y-1.5">
												<label className="block text-[11px] font-bold text-slate-300">אנגלית:</label>
												<input
													type="number"
													min={50}
													max={150}
													value={psychEnglish}
													onChange={(e) =>
														setPsychEnglish(cleanNumberInput(e.target.value, 0, 150) as number)
													}
													placeholder="50-150"
													className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
												/>
											</div>
										</div>

										{/* English Classification */}
										{psychResolution.englishClassification.level !== 'unknown' && (
											<div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
												<span className="text-slate-400 font-medium">רמת אנגלית אקדמית:</span>
												<span
													className={`font-bold px-2 py-0.5 rounded border ${psychResolution.englishClassification.color}`}
												>
													{psychResolution.englishClassification.label}
												</span>
											</div>
										)}

										{/* Calculated Weights info */}
										<div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
											<div className="flex justify-between">
												<span>שקלול מאל״ו בדגש כמותי:</span>
												<span className="font-bold text-indigo-300">
													{psychResolution.effectiveQuantEmphasis}
												</span>
											</div>
											<div className="flex justify-between">
												<span>שקלול מאל״ו בדגש מילולי:</span>
												<span className="font-bold text-purple-300">
													{psychResolution.effectiveVerbalEmphasis}
												</span>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Bagrut Input (7 cols) */}
							<div className="lg:col-span-7 space-y-4 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl">
								<div className="flex items-center justify-between border-b border-slate-800 pb-3">
									<div className="flex items-center gap-2.5">
										<BookOpen className="h-5 w-5 text-cyan-400" />
										<h3 className="text-base font-bold text-white">
											ציוני תעודת בגרות ({subjects.length} מקצועות)
										</h3>
									</div>
									<button
										onClick={() => {
											setEditingSubjectIndex(null);
											setIsSubjectModalOpen(true);
										}}
										className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold transition flex items-center gap-1.5"
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
											className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80"
										>
											<div className="flex-1 min-w-0">
												<span className="text-xs font-bold text-white block truncate">
													{sub.name}
												</span>
											</div>

											{/* Units selector */}
											<select
												value={sub.units}
												onChange={(e) => handleSubjectChange(idx, 'units', e.target.value)}
												className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
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
												className="w-16 bg-slate-900 border border-slate-700 text-xs font-bold text-center text-cyan-300 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
											/>

											<button
												onClick={() => handleDeleteSubject(idx)}
												className="p-1 text-slate-500 hover:text-rose-400 transition"
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
						<div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
							<div>
								<h2 className="text-2xl font-black text-white">שלב 2: בחירת תארים מבוקשים</h2>
								<p className="text-sm text-slate-400">
									בחר את כל התארים והמוסדות שמעניין אותך לבדוק. תוכל להוסיף תארים מרובים מכל מוסד.
								</p>
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={() => setActiveStep(1)}
									className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700"
								>
									<ArrowRight className="h-4 w-4" />
									<span>חזור לציונים</span>
								</button>
								<button
									onClick={() => setActiveStep(3)}
									disabled={selectedTargets.length === 0}
									className={`px-6 py-2.5 font-bold text-xs rounded-xl transition flex items-center gap-2 ${
										selectedTargets.length > 0
											? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/10'
											: 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
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
							onRemoveProgram={handleRemoveTarget}
							onClearAll={handleClearAllTargets}
						/>
					</div>
				)}

				{/* STEP 3: דוח קבלה אישי */}
				{activeStep === 3 && (
					<div className="space-y-6">
						<div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
							<div>
								<h2 className="text-2xl font-black text-white">שלב 3: דוח קבלה אישי</h2>
								<p className="text-sm text-slate-400">
									סיכום סטטוס הקבלה שלך עבור כל התארים שבחרת
								</p>
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={() => setActiveStep(2)}
									className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700"
								>
									<ArrowRight className="h-4 w-4" />
									<span>ערוך בחירת תארים</span>
								</button>
								<button
									onClick={() => setActiveStep(4)}
									className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 transition flex items-center gap-2"
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
									onSelectProgram={(programId) => setFocusedProgramId(programId)}
									onEditPreferences={() => setQuestionnaireAnswers(null)}
									onBackToReport={() => setActiveStep(3)}
								/>
							)
						) : (
							<div className="text-center py-16 px-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-4">
								<Target className="h-12 w-12 text-slate-500 mx-auto" />
								<h3 className="text-lg font-bold text-white">טרם נבחר תואר לתכנון מסלול</h3>
								<p className="text-sm text-slate-400">
									בחר תואר מתוך רשימת המבוקשים שלך או מדוח הקבלה כדי שנוכל לבנות עבורך 3 מסלולי שיפור מותאמים.
								</p>
								<button
									onClick={() => setActiveStep(2)}
									className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition"
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
