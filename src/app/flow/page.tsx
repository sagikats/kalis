'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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

import { useAuth } from '@/context/AuthContext';
import { SubjectInput } from '@/utils/calculators/bguCalculator';
import { calculateMultiInstitutionSekem, InstitutionSekemResult } from '@/utils/calculators/multiCalculator';
import {
	resolvePsychometricScores,
	calculateNiteGeneralScore,
	checkPsychometricCoherence
} from '@/utils/calculators/psychometricHelper';
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

const CLEAN_BLANK_SUBJECTS: SubjectInput[] = [
	{ name: 'תנ"ך', units: 2, grade: 0 },
	{ name: 'ספרות עברית', units: 2, grade: 0 },
	{ name: 'אזרחות', units: 2, grade: 0 },
	{ name: 'היסטוריה / תע"י', units: 2, grade: 0 },
	{ name: 'הבעה עברית', units: 2, grade: 0 },
	{ name: 'אנגלית', units: 5, grade: 0 },
	{ name: 'מתמטיקה', units: 5, grade: 0 }
];

function cleanNumberInput(rawVal: string, minVal: number = 0, maxVal: number = 100): number | '' {
	if (rawVal === '') return '';
	const sanitized = rawVal.replace(/^0+(?=\d)/, '');
	const num = parseInt(sanitized, 10);
	if (isNaN(num)) return '';
	return Math.min(maxVal, Math.max(minVal, num));
}

export default function AdmissionFlowPage() {
	const router = useRouter();
	const { user, profile, preferences, isLoading: isAuthLoading } = useAuth();

	const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

	// Step 1: Grades State - Defaults to clean blank state
	const [subjects, setSubjects] = useState<SubjectInput[]>(() => CLEAN_BLANK_SUBJECTS.map((s) => ({ ...s })));
	const [hasTakenPsychometric, setHasTakenPsychometric] = useState<boolean>(true);
	const [psychGeneral, setPsychGeneral] = useState<number | ''>('');
	const [psychQuant, setPsychQuant] = useState<number | ''>('');
	const [psychVerbal, setPsychVerbal] = useState<number | ''>('');
	const [psychEnglish, setPsychEnglish] = useState<number | ''>('');
	const [psychQuantEmphasis, setPsychQuantEmphasis] = useState<number | ''>('');
	const [psychVerbalEmphasis, setPsychVerbalEmphasis] = useState<number | ''>('');
	const [showEmphasisInputs, setShowEmphasisInputs] = useState<boolean>(false);

	// Step 2: Target Programs Wishlist
	const [selectedTargets, setSelectedTargets] = useState<TargetProgramSelection[]>([]);

	// Step 4: Focused program for deep-dive
	const [focusedProgramId, setFocusedProgramId] = useState<string | null>(null);

	// Step 5: Questionnaire Preferences State
	const [questionnaireAnswers, setQuestionnaireAnswers] = useState<UserPreferencesQuestionnaire | null>(null);

	// Modal State for adding/changing subjects
	const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
	const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null);

	// Lifecycle and auto-sync refs
	const currentLoadedUserRef = useRef<string | null | 'uninitialized'>('uninitialized');
	const isHydratingRef = useRef(false);
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Complete reset function
	const resetFlowToCleanState = useCallback(() => {
		setActiveStep(1);
		setSubjects(CLEAN_BLANK_SUBJECTS.map((s) => ({ ...s })));
		setHasTakenPsychometric(true);
		setPsychGeneral('');
		setPsychQuant('');
		setPsychVerbal('');
		setPsychEnglish('');
		setPsychQuantEmphasis('');
		setPsychVerbalEmphasis('');
		setShowEmphasisInputs(false);
		setSelectedTargets([]);
		setFocusedProgramId(null);
		setQuestionnaireAnswers(null);
	}, []);

	// User lifecycle and data loading effect
	useEffect(() => {
		if (isAuthLoading) return;

		const handleLogout = () => {
			resetFlowToCleanState();
			currentLoadedUserRef.current = null;
		};

		window.addEventListener('kalis-logout', handleLogout);

		const currentUserId = user?.id || null;

		// Only run hydration when user identity changes
		if (currentUserId !== currentLoadedUserRef.current) {
			isHydratingRef.current = true;

			if (currentUserId) {
				// User is authenticated: load user-scoped data
				let loadedFromStorage = false;
				try {
					const userSaved = localStorage.getItem(`kalis_flow_data_${currentUserId}`);
					if (userSaved) {
						const parsed = JSON.parse(userSaved);
						if (parsed.subjects && parsed.subjects.length > 0) setSubjects(parsed.subjects);
						if (parsed.hasTakenPsychometric !== undefined) setHasTakenPsychometric(parsed.hasTakenPsychometric);
						if (parsed.psychGeneral !== undefined) setPsychGeneral(parsed.psychGeneral);
						if (parsed.psychQuant !== undefined) setPsychQuant(parsed.psychQuant);
						if (parsed.psychVerbal !== undefined) setPsychVerbal(parsed.psychVerbal);
						if (parsed.psychEnglish !== undefined) setPsychEnglish(parsed.psychEnglish);
						if (parsed.psychQuantEmphasis !== undefined) setPsychQuantEmphasis(parsed.psychQuantEmphasis);
						if (parsed.psychVerbalEmphasis !== undefined) setPsychVerbalEmphasis(parsed.psychVerbalEmphasis);
						if (parsed.showEmphasisInputs !== undefined) setShowEmphasisInputs(parsed.showEmphasisInputs);
						if (parsed.selectedTargets) setSelectedTargets(parsed.selectedTargets);
						if (parsed.questionnaireAnswers) setQuestionnaireAnswers(parsed.questionnaireAnswers);
						if (parsed.activeStep) setActiveStep(parsed.activeStep);
						loadedFromStorage = true;
					}
				} catch (e) {
					console.error('Error loading user-scoped flow data', e);
				}

				// If not found in user storage, load from DB profile/preferences
				if (!loadedFromStorage) {
					if (profile) {
						if (profile.bagrutSubjects && profile.bagrutSubjects.length > 0) {
							setSubjects(
								profile.bagrutSubjects.map((s: any) => ({
									name: s.subjectName || s.name,
									units: s.units,
									grade: s.grade
								}))
							);
						}
						if (profile.hasTakenPsychometric !== undefined) {
							setHasTakenPsychometric(profile.hasTakenPsychometric);
						}
						setPsychGeneral(profile.psychometricGeneral ? profile.psychometricGeneral : '');
						setPsychQuant(profile.psychometricQuant ? profile.psychometricQuant : '');
						setPsychVerbal(profile.psychometricVerbal ? profile.psychometricVerbal : '');
						setPsychEnglish(profile.psychometricEnglish ? profile.psychometricEnglish : '');
					}
					if (preferences) {
						setQuestionnaireAnswers({
							psychExperience: preferences.psychExperience,
							psychFeeling:
								preferences.psychFeeling === 'low_confidence'
									? 'reached_ceiling'
									: (preferences.psychFeeling as any),
							psychStrongestSection: preferences.psychStrongestSection,
							psychStrongestSections: preferences.psychStrongestSections,
							learningOrientation: preferences.learningOrientation,
							learningStrength: preferences.learningStrength,
							weeklyAvailabilityHours: preferences.weeklyAvailabilityHours,
							targetTimeline:
								preferences.targetTimeline === 'next_year'
									? 'next_year_october'
									: (preferences.targetTimeline as any)
						});
					}
				}
			} else {
				// User is guest / unauthenticated
				if (currentLoadedUserRef.current === 'uninitialized') {
					// Initial page load for guest: check generic guest storage
					try {
						const guestSaved = localStorage.getItem(STORAGE_KEY);
						if (guestSaved) {
							const parsed = JSON.parse(guestSaved);
							if (parsed.subjects && parsed.subjects.length > 0) setSubjects(parsed.subjects);
							if (parsed.hasTakenPsychometric !== undefined) setHasTakenPsychometric(parsed.hasTakenPsychometric);
							if (parsed.psychGeneral !== undefined) setPsychGeneral(parsed.psychGeneral);
							if (parsed.psychQuant !== undefined) setPsychQuant(parsed.psychQuant);
							if (parsed.psychVerbal !== undefined) setPsychVerbal(parsed.psychVerbal);
							if (parsed.psychEnglish !== undefined) setPsychEnglish(parsed.psychEnglish);
							if (parsed.psychQuantEmphasis !== undefined) setPsychQuantEmphasis(parsed.psychQuantEmphasis);
							if (parsed.psychVerbalEmphasis !== undefined) setPsychVerbalEmphasis(parsed.psychVerbalEmphasis);
							if (parsed.showEmphasisInputs !== undefined) setShowEmphasisInputs(parsed.showEmphasisInputs);
							if (parsed.selectedTargets) setSelectedTargets(parsed.selectedTargets);
							if (parsed.questionnaireAnswers) setQuestionnaireAnswers(parsed.questionnaireAnswers);
							if (parsed.activeStep) setActiveStep(parsed.activeStep);
						}
					} catch (e) {
						console.error('Error loading guest flow data', e);
					}
				} else {
					// Transitioned from logged in to logged out -> reset completely
					resetFlowToCleanState();
				}
			}

			currentLoadedUserRef.current = currentUserId;

			setTimeout(() => {
				isHydratingRef.current = false;
			}, 100);
		}

		return () => {
			window.removeEventListener('kalis-logout', handleLogout);
		};
	}, [isAuthLoading, user, profile, preferences, resetFlowToCleanState]);

	// Auto-save and sync effect
	useEffect(() => {
		if (isAuthLoading || isHydratingRef.current || currentLoadedUserRef.current === 'uninitialized') {
			return;
		}

		const key = user?.id ? `kalis_flow_data_${user.id}` : STORAGE_KEY;
		const toSave = {
			subjects,
			hasTakenPsychometric,
			psychGeneral,
			psychQuant,
			psychVerbal,
			psychEnglish,
			psychQuantEmphasis,
			psychVerbalEmphasis,
			showEmphasisInputs,
			selectedTargets,
			questionnaireAnswers,
			activeStep
		};

		try {
			localStorage.setItem(key, JSON.stringify(toSave));
		} catch (e) {
			console.error('Failed to persist flow data to localStorage', e);
		}

		// Debounce server PUT /api/users sync if logged in
		if (user?.id) {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			saveTimeoutRef.current = setTimeout(async () => {
				try {
					const math = subjects.find((s) => s.name.trim().includes('מתמטיקה'));
					const physics = subjects.find((s) => s.name.trim().includes('פיזיקה'));

					const profilePayload = {
						userId: user.id,
						bagrutSubjects: subjects.map((s) => ({
							subjectName: s.name,
							units: s.units,
							grade: Number(s.grade) || 0,
							isMandatory: ['תנ"ך', 'ספרות עברית', 'אזרחות', 'היסטוריה / תע"י', 'הבעה עברית', 'אנגלית', 'מתמטיקה'].includes(s.name)
						})),
						mathUnits: math?.units || 5,
						mathGrade: Number(math?.grade) || 0,
						physicsUnits: physics?.units || 0,
						physicsGrade: Number(physics?.grade) || 0,
						psychometricGeneral: hasTakenPsychometric ? Number(psychGeneral) || 0 : 0,
						psychometricQuant: hasTakenPsychometric ? Number(psychQuant) || 0 : 0,
						psychometricVerbal: hasTakenPsychometric ? Number(psychVerbal) || 0 : 0,
						psychometricEnglish: hasTakenPsychometric ? Number(psychEnglish) || 0 : 0,
						hasTakenPsychometric: Boolean(hasTakenPsychometric)
					};

					const preferencesPayload = questionnaireAnswers
						? {
								userId: user.id,
								psychExperience: questionnaireAnswers.psychExperience || 'never',
								psychFeeling:
									questionnaireAnswers.psychFeeling === 'reached_ceiling'
										? 'low_confidence'
										: (questionnaireAnswers.psychFeeling || 'neutral'),
								psychStrongestSection: questionnaireAnswers.psychStrongestSection || 'balanced',
								psychStrongestSections: questionnaireAnswers.psychStrongestSections,
								learningOrientation: questionnaireAnswers.learningOrientation || 'flexible',
								learningStrength: questionnaireAnswers.learningStrength || 'analytical_quick',
								weeklyAvailabilityHours: questionnaireAnswers.weeklyAvailabilityHours || 'part_15_25',
								targetTimeline:
									questionnaireAnswers.targetTimeline === 'next_year_october'
										? 'next_year'
										: (questionnaireAnswers.targetTimeline || 'immediate_october')
						  }
						: undefined;

					await fetch('/api/users', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							userId: user.id,
							profile: profilePayload,
							preferences: preferencesPayload
						})
					});
				} catch (err) {
					console.warn('[flow/page.tsx] Auto-sync to /api/users error:', err);
				}
			}, 1000);
		}
	}, [
		user?.id,
		isAuthLoading,
		subjects,
		hasTakenPsychometric,
		psychGeneral,
		psychQuant,
		psychVerbal,
		psychEnglish,
		psychQuantEmphasis,
		psychVerbalEmphasis,
		showEmphasisInputs,
		selectedTargets,
		questionnaireAnswers,
		activeStep
	]);

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

	// Check coherence between entered general score and subscore-derived score
	const psychCoherence = useMemo(() => {
		if (!hasTakenPsychometric) return { isCoherent: true, calculatedGeneral: 0, discrepancy: 0 };
		const numGen = Number(psychGeneral) || 0;
		const numQ = Number(psychQuant) || 0;
		const numV = Number(psychVerbal) || 0;
		const numE = Number(psychEnglish) || 0;
		if (numGen === 0 || (numQ === 0 && numV === 0 && numE === 0)) {
			return { isCoherent: true, calculatedGeneral: 0, discrepancy: 0 };
		}
		return checkPsychometricCoherence(
			numGen,
			numQ,
			numV,
			numE
		);
	}, [hasTakenPsychometric, psychGeneral, psychQuant, psychVerbal, psychEnglish]);

	// Handler for subscores that auto-syncs the general score according to NITE formula
	const handleSubscoreChange = (section: 'quant' | 'verbal' | 'english', val: number | '') => {
		const newQ = section === 'quant' ? val : psychQuant;
		const newV = section === 'verbal' ? val : psychVerbal;
		const newE = section === 'english' ? val : psychEnglish;

		if (section === 'quant') setPsychQuant(val);
		if (section === 'verbal') setPsychVerbal(val);
		if (section === 'english') setPsychEnglish(val);

		const numQ = Number(newQ) || 0;
		const numV = Number(newV) || 0;
		const numE = Number(newE) || 0;

		// Auto-fill general score ONLY if the user has NOT entered a general score yet!
		if (!psychGeneral || Number(psychGeneral) === 0) {
			if (numQ >= 50 && numQ <= 150 && numV >= 50 && numV <= 150 && numE >= 50 && numE <= 150) {
				const niteGen = calculateNiteGeneralScore(numQ, numV, numE);
				if (niteGen >= 200 && niteGen <= 800) {
					setPsychGeneral(niteGen);
				}
			}
		}
	};

	// User Academic Profile object
	const userProfile: UserAcademicProfile = useMemo(() => {
		const isPsych = hasTakenPsychometric;
		return {
			bagrutSubjects: subjects.map((s) => ({ ...s, grade: Number(s.grade) || 0 })),
			psychometricGeneral: isPsych ? psychResolution.effectiveGeneral : 0,
			psychometricQuant: isPsych ? Number(psychQuant) || 0 : 0,
			psychometricVerbal: isPsych ? Number(psychVerbal) || 0 : 0,
			psychometricEnglish: isPsych ? Number(psychEnglish) || 0 : 0,
			psychometricQuantEmphasis: isPsych && psychQuantEmphasis ? Number(psychQuantEmphasis) : undefined,
			psychometricVerbalEmphasis: isPsych && psychVerbalEmphasis ? Number(psychVerbalEmphasis) : undefined,
			mathGrade: Number(mathSubject.grade) || 0,
			mathUnits: mathSubject.units,
			physicsGrade: Number(physicsSubject?.grade) || 0,
			physicsUnits: physicsSubject?.units || 0
		};
	}, [subjects, hasTakenPsychometric, psychResolution, psychQuant, psychVerbal, psychEnglish, psychQuantEmphasis, psychVerbalEmphasis, mathSubject, physicsSubject]);

	// Multi-institution calculations (all 8 universities)
	const institutionResultsMap = useMemo(() => {
		const resList = calculateMultiInstitutionSekem(
			userProfile,
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
		if (field === 'units') {
			updated[index] = { ...updated[index], units: Number(value) };
		} else {
			const cleaned = cleanNumberInput(String(value), 0, 100);
			updated[index] = { ...updated[index], grade: cleaned === '' ? 0 : cleaned };
		}
		setSubjects(updated);
	};

	const handleAddSubjectFromCatalog = (option: BagrutSubjectOption) => {
		if (editingSubjectIndex !== null) {
			const updated = [...subjects];
			updated[editingSubjectIndex] = {
				name: option.name,
				units: option.defaultUnits,
				grade: updated[editingSubjectIndex].grade || 0
			};
			setSubjects(updated);
		} else {
			setSubjects([...subjects, { name: option.name, units: option.defaultUnits, grade: 0 }]);
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
						<div className="border-b border-[#EAE5DA] pb-4">
							<h2 className="text-2xl font-black text-[#222222]">שלב 1: הזנת ציונים</h2>
							<p className="text-sm text-[#66635C]">
								הזן את ציוני הבגרות והפסיכומטרי שלך — המערכת מחשבת אוטומטית ממוצע אופטימלי וסכמים לכל האוניברסיטאות
							</p>
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
											setPsychGeneral('');
											setPsychQuant('');
											setPsychVerbal('');
											setPsychEnglish('');
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
											<div className="flex items-center justify-between">
												<label className="block text-xs font-bold text-[#44423D]">
													ציון רב-תחומי (200–800):
												</label>
												<span className="text-[10px] text-[#66635C]">
													לפי ספח הציונים הרשמי
												</span>
											</div>
											<input
												type="number"
												min={200}
												max={800}
												value={psychGeneral === 0 ? '' : psychGeneral}
												onChange={(e) =>
													setPsychGeneral(cleanNumberInput(e.target.value, 0, 800) as number)
												}
												placeholder="200-800"
												className="w-full bg-white border border-[#DDD7CB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
											/>
										</div>

										{/* Gross Mismatch Warning Banner */}
										{!psychCoherence.isCoherent && psychCoherence.calculatedGeneral > 0 && (
											<div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-2">
												<div className="flex items-center gap-1.5 text-xs font-bold">
													<AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
													<span>פער חריג (מעל 30 נקודות) בין הציון הכולל לציוני הפרקים</span>
												</div>
												<p className="text-[11px] leading-relaxed text-amber-800">
													הציון הרב-תחומי שהוזן ({psychGeneral}) סוטה משמעותית מהערכת שקלול הפרקים (סביב {psychCoherence.calculatedGeneral}). אנא ודא שהנתונים שהזנת תואמים במדויק את ספח הציונים הרשמי ממאל״ו.
												</p>
											</div>
										)}

										<div className="grid grid-cols-3 gap-2.5">
											<div className="space-y-1.5">
												<label className="block text-[11px] font-bold text-[#44423D]">כמותי:</label>
												<input
													type="number"
													min={50}
													max={150}
													value={psychQuant === 0 ? '' : psychQuant}
													onChange={(e) =>
														handleSubscoreChange('quant', cleanNumberInput(e.target.value, 0, 150) as number)
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
													value={psychVerbal === 0 ? '' : psychVerbal}
													onChange={(e) =>
														handleSubscoreChange('verbal', cleanNumberInput(e.target.value, 0, 150) as number)
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
													value={psychEnglish === 0 ? '' : psychEnglish}
													onChange={(e) =>
														handleSubscoreChange('english', cleanNumberInput(e.target.value, 0, 150) as number)
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
													className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border shadow-2xs ${psychResolution.englishClassification.color}`}
												>
													{psychResolution.englishClassification.label}
												</span>
											</div>
										)}

										{/* Optional NITE Emphasis Scores (200-800) */}
										<div className="pt-1">
											<button
												type="button"
												onClick={() => setShowEmphasisInputs(!showEmphasisInputs)}
												className="text-[11px] font-bold text-[#3C3C3C] hover:text-black flex items-center gap-1.5 transition underline decoration-dotted cursor-pointer"
											>
												<span>
													{showEmphasisInputs
														? 'הסתר ציוני דגש רשמיים (200–800)'
														: '+ מתמיין להנדסה / מדעים? הזן ציוני דגש רשמיים מספח מאל״ו'}
												</span>
											</button>

											{showEmphasisInputs && (
												<div className="mt-2.5 p-3 rounded-xl bg-white border border-[#E5DFD4] space-y-2.5 shadow-2xs">
													<div className="flex items-center justify-between">
														<span className="text-[11px] font-bold text-[#222222]">
															ציוני דגש רשמיים (מאל״ו)
														</span>
														<span className="text-[10px] text-[#77746D]">אופציונלי (200–800)</span>
													</div>
													<div className="grid grid-cols-2 gap-2">
														<div className="space-y-1">
															<label className="block text-[10px] font-medium text-[#55524B]">
																דגש כמותי (הנדסה/מדמ״ח):
															</label>
															<input
																type="number"
																min={200}
																max={800}
																value={psychQuantEmphasis}
																onChange={(e) =>
																	setPsychQuantEmphasis(cleanNumberInput(e.target.value, 0, 800) as number)
																}
																placeholder={String(psychResolution.effectiveQuantEmphasis)}
																className="w-full bg-[#FAF8F5] border border-[#DDD7CB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
															/>
														</div>
														<div className="space-y-1">
															<label className="block text-[10px] font-medium text-[#55524B]">
																דגש מילולי (הומני/רפואה):
															</label>
															<input
																type="number"
																min={200}
																max={800}
																value={psychVerbalEmphasis}
																onChange={(e) =>
																	setPsychVerbalEmphasis(cleanNumberInput(e.target.value, 0, 800) as number)
																}
																placeholder={String(psychResolution.effectiveVerbalEmphasis)}
																className="w-full bg-[#FAF8F5] border border-[#DDD7CB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
															/>
														</div>
													</div>
												</div>
											)}
										</div>

										{/* Calculated Weights info */}
										<div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] text-[11px] text-[#66635C] space-y-1">
											<div className="flex justify-between">
												<span>
													שקלול מאל״ו בדגש כמותי{' '}
													{psychQuantEmphasis ? '(רשמי מהספח)' : '(הערכה לפי פרקים)'}:
												</span>
												<span className="font-bold text-[#222222]">
													{psychQuantEmphasis || psychResolution.effectiveQuantEmphasis}
												</span>
											</div>
											<div className="flex justify-between">
												<span>
													שקלול מאל״ו בדגש מילולי{' '}
													{psychVerbalEmphasis ? '(רשמי מהספח)' : '(הערכה לפי פרקים)'}:
												</span>
												<span className="font-bold text-[#222222]">
													{psychVerbalEmphasis || psychResolution.effectiveVerbalEmphasis}
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
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => {
												if (typeof window !== 'undefined' && window.confirm('האם לאפס את כל הציונים והנתונים?')) {
													resetFlowToCleanState();
												}
											}}
											className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DDD7CB] text-[#66635C] hover:text-rose-600 hover:border-rose-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
											title="איפוס כל הנתונים"
										>
											<RefreshCw className="h-3.5 w-3.5" />
											<span>איפוס</span>
										</button>
										<button
											type="button"
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
												value={sub.grade === 0 ? '' : sub.grade}
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

						{/* ניווט תחתון לשלב 1 */}
						<div className="pt-6 border-t border-[#EAE5DA] flex items-center justify-end">
							<button
								onClick={() => setActiveStep(2)}
								className="px-6 py-3 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
							>
								<span>המשך לבחירת תארים מבוקשים</span>
								<ArrowLeft className="h-4 w-4" />
							</button>
						</div>
					</div>
				)}

				{/* STEP 2: בחירת תארים מבוקשים */}
				{activeStep === 2 && (
					<div className="space-y-6">
						<div className="border-b border-[#EAE5DA] pb-4">
							<h2 className="text-2xl font-black text-[#222222]">שלב 2: בחירת תארים מבוקשים</h2>
							<p className="text-sm text-[#66635C]">
								בחר את כל התארים והמוסדות שמעניין אותך לבדוק. תוכל להוסיף תארים מרובים מכל מוסד.
							</p>
						</div>

						<DegreeSearchSelector
							selectedPrograms={selectedTargets}
							onToggleProgram={handleToggleTarget}
							onAddMultiplePrograms={handleAddMultipleTargets}
							onRemoveProgram={handleRemoveTarget}
							onClearAll={handleClearAllTargets}
						/>

						{/* ניווט תחתון לשלב 2 */}
						<div className="pt-6 border-t border-[#EAE5DA] flex items-center justify-between">
							<button
								onClick={() => setActiveStep(1)}
								className="px-5 py-3 bg-white hover:bg-[#FAF8F5] text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-2 border border-[#DDD7CB] shadow-2xs cursor-pointer"
							>
								<ArrowRight className="h-4 w-4" />
								<span>חזור להזנת ציונים</span>
							</button>
							<button
								onClick={() => setActiveStep(3)}
								disabled={selectedTargets.length === 0}
								className={`px-6 py-3 font-bold text-xs rounded-xl transition flex items-center gap-2 ${
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
				)}

				{/* STEP 3: דוח קבלה אישי */}
				{activeStep === 3 && (
					<div className="space-y-6">
						<div className="border-b border-[#EAE5DA] pb-4">
							<h2 className="text-2xl font-black text-[#222222]">שלב 3: דוח קבלה אישי</h2>
							<p className="text-sm text-[#66635C]">
								סיכום סטטוס הקבלה שלך עבור כל התארים שבחרת
							</p>
						</div>

						{hasTakenPsychometric && !psychQuantEmphasis && gapAnalyses.some((g) => g.relevantSekemType === 'engineering') && (
							<div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-center justify-between flex-wrap gap-3">
								<div className="flex items-center gap-2.5">
									<AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
									<div className="text-xs">
										<span className="font-bold">נבחר תואר הדורש שקלול בדגש כמותי (הנדסה/מדעי המחשב):</span>
										<span className="text-amber-800 mr-1">
											הסכם מחושב כעת לפי הערכת שקלול הפרקים ({psychResolution.effectiveQuantEmphasis}). להבטחת דיוק מוחלט, תוכל להזין את ציון הדגש הרשמי מספח מאל״ו.
										</span>
									</div>
								</div>
								<button
									onClick={() => {
										setShowEmphasisInputs(true);
										setActiveStep(1);
									}}
									className="text-xs font-bold px-3 py-1.5 bg-amber-200/60 hover:bg-amber-200 text-amber-900 rounded-lg border border-amber-300 transition cursor-pointer"
								>
									הזן ציון דגש מספח מאל״ו
								</button>
							</div>
						)}

						<PersonalAdmissionReport
							analyses={gapAnalyses}
							onViewGap={handleViewGapForProgram}
							onAddMorePrograms={() => setActiveStep(2)}
						/>

						{/* ניווט תחתון לשלב 3 */}
						<div className="pt-6 border-t border-[#EAE5DA] flex items-center justify-between">
							<button
								onClick={() => setActiveStep(2)}
								className="px-5 py-3 bg-white hover:bg-[#FAF8F5] text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-2 border border-[#DDD7CB] shadow-2xs cursor-pointer"
							>
								<ArrowRight className="h-4 w-4" />
								<span>חזור לבחירת תארים</span>
							</button>
							<button
								onClick={() => setActiveStep(4)}
								className="px-6 py-3 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
							>
								<span>לתכנון מסלולי פעולה</span>
								<ArrowLeft className="h-4 w-4" />
							</button>
						</div>
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
