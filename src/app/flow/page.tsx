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
	Search,
	Check
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { SubjectInput } from '@/modules/calculators';
import { calculateMultiInstitutionSekem, InstitutionSekemResult } from '@/utils/calculators/multiCalculator';
import {
	resolvePsychometricScores,
	calculateNiteGeneralScore,
	checkPsychometricCoherence
} from '@/utils/calculators/psychometricHelper';
import SubjectSelectModal from '@/components/calculator/SubjectSelectModal';
import { BagrutSubjectOption, POPULAR_5U_ELECTIVES } from '@/data/bagrutSubjects';
import { cleanGradeInput, cleanNumberInput } from '@/utils/gradeInputHelper';

import DegreeSearchSelector from '@/components/flow/DegreeSearchSelector';
import PersonalAdmissionReport from '@/components/flow/PersonalAdmissionReport';
import RecommendedTracksView from '@/components/flow/RecommendedTracksView';
import TrackRegistrationGate from '@/components/flow/TrackRegistrationGate';
import AcceptedRegistrationCard from '@/components/flow/AcceptedRegistrationCard';
import UniversityLogo from '@/components/common/UniversityLogo';
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
import {
	validateUserGrades,
	GradeValidationResult
} from '@/utils/analysis/gradeValidation';

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

	// Validation of matriculation (Bagrut) and psychometric inputs
	const [showValidationErrors, setShowValidationErrors] = useState<boolean>(false);

	// Sub-step for Step 1: 'bagrut' (matriculation) -> 'psychometric'
	const [step1SubStep, setStep1SubStep] = useState<'bagrut' | 'psychometric'>('bagrut');

	const bagrutValidation = useMemo(() => {
		if (!subjects || subjects.length === 0) {
			return {
				isValid: false,
				missingBagrutCount: 0,
				totalValidUnits: 0,
				errorMessage: 'לא הוזנו מקצועות בגרות במערכת.'
			};
		}
		const missingSubjects = subjects.filter(
			(s) => !s.grade || Number(s.grade) <= 0
		);
		const validSubjects = subjects.filter(
			(s) => Boolean(s.grade && Number(s.grade) > 0)
		);
		const totalValidUnits = validSubjects.reduce((acc, s) => acc + (s.units || 0), 0);

		if (missingSubjects.length > 0) {
			const names = missingSubjects.map((s) => s.name);
			return {
				isValid: false,
				missingBagrutCount: missingSubjects.length,
				totalValidUnits,
				errorMessage: `חסר ציון ב-${missingSubjects.length} מקצועות בגרות (${names.slice(0, 3).join(', ')}${names.length > 3 ? ' ועוד' : ''}). יש להזין ציון לכל מקצוע ברשימה.`
			};
		}

		if (totalValidUnits < 20) {
			return {
				isValid: false,
				missingBagrutCount: 0,
				totalValidUnits,
				errorMessage: `סך יחידות הבגרות שהוזנו (${totalValidUnits} יח״ל) אינו מגיע למינימום הנדרש לתעודת בגרות בישראל (20 יח״ל). יש להוסיף מקצוע הגברה או להרחיב יחידות לימוד.`
			};
		}

		return {
			isValid: true,
			missingBagrutCount: 0,
			totalValidUnits,
			errorMessage: undefined
		};
	}, [subjects]);

	const psychValidation = useMemo(() => {
		const isPsychMissing = Boolean(
			hasTakenPsychometric &&
				(!psychGeneral || Number(psychGeneral) < 200 || Number(psychGeneral) > 800)
		);
		if (isPsychMissing) {
			return {
				isValid: false,
				errorMessage: 'סומן שנבחנת בפסיכומטרי אך לא הוזן ציון תקין (200–800). אנא הזן ציון או סמן "עדיין לא עשיתי פסיכומטרי".'
			};
		}
		return {
			isValid: true,
			errorMessage: undefined
		};
	}, [hasTakenPsychometric, psychGeneral]);

	// Every psychometric field the institutions' formulas use. Anything left empty is estimated from the
	// other scores, and the section→general conversion depends on the test date, so results become estimates.
	const psychMissingFields = useMemo(() => {
		if (!hasTakenPsychometric) return [] as string[];
		const missing: string[] = [];
		if (!psychQuant) missing.push('כמותי');
		if (!psychVerbal) missing.push('מילולי');
		if (!psychEnglish) missing.push('אנגלית');
		if (!psychQuantEmphasis) missing.push('דגש כמותי');
		if (!psychVerbalEmphasis) missing.push('דגש מילולי');
		return missing;
	}, [hasTakenPsychometric, psychQuant, psychVerbal, psychEnglish, psychQuantEmphasis, psychVerbalEmphasis]);

	const goCompletePsychometric = () => {
		setShowEmphasisInputs(true);
		setStep1SubStep('psychometric');
		setActiveStep(1);
	};

	const renderPsychEstimateBanner = () =>
		psychMissingFields.length > 0 ? (
			<div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-center justify-between flex-wrap gap-3">
				<div className="flex items-start gap-2.5">
					<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
					<div className="text-xs leading-relaxed">
						<span className="font-bold">התוצאות הן הערכה ולא חישוב מדויק:</span>
						<span className="text-amber-800 mr-1">
							לא הוזנו כל ציוני הפסיכומטרי ({psychMissingFields.join(', ')}). הציונים החסרים מוערכים, וההמרה בין ציוני הפרקים לציונים המשוקללים משתנה ממועד למועד. לחישוב מדויק, הזינו את כל הציונים מספח הציונים הרשמי של מאל״ו.
						</span>
					</div>
				</div>
				<button
					onClick={goCompletePsychometric}
					className="text-xs font-bold px-3 py-1.5 bg-amber-200/60 hover:bg-amber-200 text-amber-900 rounded-lg border border-amber-300 transition cursor-pointer"
				>
					השלמת ציוני פסיכומטרי
				</button>
			</div>
		) : null;

	const gradeValidation: GradeValidationResult = useMemo(() => {
		return validateUserGrades(subjects, hasTakenPsychometric, psychGeneral);
	}, [subjects, hasTakenPsychometric, psychGeneral]);

	const handleStepClick = (targetStep: 1 | 2 | 3 | 4) => {
		if (targetStep > 1 && !gradeValidation.isValid) {
			setShowValidationErrors(true);
			if (!bagrutValidation.isValid) {
				setStep1SubStep('bagrut');
			} else {
				setStep1SubStep('psychometric');
			}
			setActiveStep(1);
			return;
		}
		if (targetStep === 1 && activeStep !== 1) {
			setStep1SubStep('bagrut');
		}
		setActiveStep(targetStep);
	};

	const handleProceedToPsychometric = () => {
		if (!bagrutValidation.isValid) {
			setShowValidationErrors(true);
			if (typeof window !== 'undefined') {
				const alertEl = document.getElementById('step1-bagrut-validation-alert');
				if (alertEl) {
					alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}
			return;
		}
		setShowValidationErrors(false);
		setStep1SubStep('psychometric');
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
		}
	};

	const handleBackToBagrut = () => {
		setShowValidationErrors(false);
		setStep1SubStep('bagrut');
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
		}
	};

	const handleProceedFromStep1 = () => {
		if (!gradeValidation.isValid) {
			setShowValidationErrors(true);
			if (!bagrutValidation.isValid) {
				setStep1SubStep('bagrut');
				if (typeof window !== 'undefined') {
					const alertEl = document.getElementById('step1-bagrut-validation-alert');
					if (alertEl) {
						alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
				}
			} else if (!psychValidation.isValid) {
				setStep1SubStep('psychometric');
				if (typeof window !== 'undefined') {
					const alertEl = document.getElementById('step1-psych-validation-alert');
					if (alertEl) {
						alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
				}
			}
			return;
		}
		setShowValidationErrors(false);
		setActiveStep(2);
	};

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
		setStep1SubStep('bagrut');
		setShowValidationErrors(false);
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

	// Always scroll to top when transitioning steps or focused program
	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
			const frame = requestAnimationFrame(() => {
				window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
				document.documentElement.scrollTop = 0;
				document.body.scrollTop = 0;
			});
			return () => cancelAnimationFrame(frame);
		}
	}, [activeStep, step1SubStep, focusedProgramId]);

	// Lock window scroll completely on steps 1 and 2 to guarantee a rigid, static viewport shell
	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (activeStep <= 2) {
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
			document.documentElement.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
			document.documentElement.style.overflow = '';
		};
	}, [activeStep]);

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
						if (parsed.step1SubStep) setStep1SubStep(parsed.step1SubStep);
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
							if (parsed.step1SubStep) setStep1SubStep(parsed.step1SubStep);
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
			step1SubStep,
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

	// Counts summary for Step 3 status badges in navigation dock
	const step3Counts = useMemo(() => {
		return {
			accepted: gapAnalyses.filter((a) => a.status === 'accepted').length,
			borderline: gapAnalyses.filter((a) => a.status === 'borderline').length,
			not_accepted: gapAnalyses.filter((a) => a.status === 'not_accepted').length,
			no_threshold: gapAnalyses.filter((a) => a.status === 'no_threshold').length
		};
	}, [gapAnalyses]);

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
			const cleaned = cleanGradeInput(String(value));
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

	// Generate the 3 tailored, realistic tracks for Step 4
	const recommendedTracks = useMemo(() => {
		if (!gradeValidation.isValid) return null;
		if (!currentFocusedAnalysis) return null;
		const instRes = institutionResultsMap[currentFocusedAnalysis.target.calculatorId];
		if (!instRes || instRes.bagrutAverage <= 0) return null;
		return generatePersonalizedTracks(
			currentFocusedAnalysis,
			userProfile,
			instRes,
			questionnaireAnswers || undefined
		);
	}, [gradeValidation.isValid, currentFocusedAnalysis, questionnaireAnswers, institutionResultsMap, userProfile]);

	return (
		<div className={`w-full bg-[#FAF8F5] text-[#222222] font-sans dir-rtl ${
			activeStep <= 2 ? 'h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] overflow-hidden' : 'min-h-screen pb-32 sm:pb-36'
		}`}>
			<main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
				activeStep <= 2
					? 'py-2 sm:py-3 h-[calc(100%-5.5rem)] max-h-[calc(100%-5.5rem)] overflow-hidden flex flex-col min-h-0'
					: 'py-8 space-y-8'
			}`}>


				{/* STEP 1: הזנת ציונים (מפוצל ל-2 שלבים פנימיים: בגרויות ואז פסיכומטרי) */}
				{activeStep === 1 && (
					<div className="flex-1 min-h-0 flex flex-col">
						{/* SUB-STEP 1A: הזנת ציוני בגרות */}
						{step1SubStep === 'bagrut' && (
							<div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#E5DFD4] shadow-xs flex-1 min-h-0 flex flex-col space-y-3">
								{/* Integrated Card Top Bar with Prominent Step 1 Title */}
								<div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#EAE5DA] pb-3 shrink-0">
									<div>
										<div className="flex items-center gap-2 mb-1">
											<span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#DDD7CB] text-[#44423D] text-[11px] font-bold shadow-2xs">
												שלב 1 מתוך 4: נתוני פתיחה
											</span>
											<span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#DDD7CB] text-[#44423D] text-[11px] font-bold shadow-2xs">
												בגרויות (חלק 1 מתוך 2)
											</span>
										</div>
										<h2 className="text-xl sm:text-2xl font-black text-[#222222]">
											שלב 1: הזנת ציוני תעודת בגרות
										</h2>
										<p className="text-xs text-[#66635C] mt-0.5">
											הזן ציון סופי (0–100) ובחר יחידות לימוד לכל מקצוע בתעודה
										</p>
									</div>

									<div className="flex items-center flex-wrap gap-2">
										{/* Status summary capsule */}
										<div className="flex items-center gap-2 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#E5DFD4] shadow-2xs">
											<BookOpen className="h-4 w-4 text-blue-700" />
											<span className="text-xs font-bold text-[#222222]">
												{subjects.length} מקצועות
											</span>
											<span className="text-[#DDD7CB]">|</span>
											<span className={`text-xs font-bold ${bagrutValidation.totalValidUnits >= 20 ? 'text-[#205739]' : 'text-amber-700'}`}>
												{bagrutValidation.totalValidUnits} יח״ל {bagrutValidation.totalValidUnits >= 20 ? '✓' : '(מינימום 20)'}
											</span>
										</div>

										<button
											type="button"
											onClick={() => {
												setEditingSubjectIndex(null);
												setIsSubjectModalOpen(true);
											}}
											className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EFEAE0] border border-[#DDD7CB] text-[#222222] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.99]"
										>
											<Plus className="h-3.5 w-3.5" />
											<span>הוסף מקצוע / הגברה</span>
										</button>

										<button
											type="button"
											onClick={() => {
												if (typeof window !== 'undefined' && window.confirm('האם לאפס את כל הציונים והנתונים?')) {
													resetFlowToCleanState();
												}
											}}
											className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DDD7CB] text-[#66635C] hover:text-rose-600 hover:border-rose-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
											title="איפוס כל הנתונים"
										>
											<RefreshCw className="h-3.5 w-3.5" />
											<span>איפוס</span>
										</button>
									</div>
								</div>

								{/* Subjects Grid: 2 columns with internal scroll */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1 min-h-0 overflow-y-auto pr-1 pl-1 py-1 custom-scrollbar">
										{subjects.map((sub, idx) => (
											<div
												key={idx}
												className="flex items-center gap-3 p-3.5 rounded-2xl border transition-all bg-[#FAF8F5] border-[#E5DFD4] hover:border-[#DDD7CB]"
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
													className="bg-white border border-[#DDD7CB] text-xs font-bold text-[#222222] rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
												>
													<option value={2}>2 יח״ל</option>
													<option value={3}>3 יח״ל</option>
													<option value={4}>4 יח״ל</option>
													<option value={5}>5 יח״ל</option>
												</select>

												{/* Grade input */}
												<input
													type="text"
													inputMode="numeric"
													pattern="[0-9]*"
													maxLength={3}
													value={sub.grade === 0 ? '' : sub.grade}
													onChange={(e) => handleSubjectChange(idx, 'grade', e.target.value)}
													placeholder="ציון"
													className="w-16 bg-white border border-[#DDD7CB] text-xs font-bold text-center rounded-xl px-2 py-1.5 text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
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

									{/* Quick-Add Popular 5U Electives Strip */}
									<div className="pt-4 border-t border-[#EAE5DA] space-y-2.5">
										<div className="flex items-center justify-between flex-wrap gap-2">
											<div className="flex items-center gap-1.5 text-xs font-bold text-[#44423D]">
												<Sparkles className="h-3.5 w-3.5 text-amber-600" />
												<span>הוספה מהירה של מקצוע הגברה (5 יח״ל):</span>
											</div>
											<button
												type="button"
												onClick={() => {
													setEditingSubjectIndex(null);
													setIsSubjectModalOpen(true);
												}}
												className="text-[11px] font-bold text-[#66635C] hover:text-[#222222] transition flex items-center gap-1 cursor-pointer"
											>
												<span>לכל המקצועות בקטלוג הרשמי...</span>
												<ArrowLeft className="h-3 w-3" />
											</button>
										</div>

										<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
											{POPULAR_5U_ELECTIVES.slice(0, 12).map((pop) => {
												const isAlreadyAdded = subjects.some(
													(s) => s.name.trim().toLowerCase() === pop.name.trim().toLowerCase()
												);
												return (
													<button
														key={pop.id}
														type="button"
														disabled={isAlreadyAdded}
														onClick={() => {
															setSubjects([
																...subjects,
																{ name: pop.name, units: pop.units, grade: 0 }
															]);
														}}
														className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border cursor-pointer ${
															isAlreadyAdded
																? 'bg-[#FAF8F5] text-[#8A847C] border-[#E5DFD4] opacity-60 cursor-not-allowed'
																: 'bg-white hover:bg-[#FAF8F5] text-[#222222] border-[#DDD7CB] hover:border-[#3C3C3C] shadow-2xs active:scale-95'
														}`}
														title={pop.description}
													>
														<span>{pop.icon}</span>
														<span>{pop.shortLabel || pop.name}</span>
														{isAlreadyAdded ? (
															<Check className="h-3 w-3 text-emerald-600" />
														) : (
															<Plus className="h-3 w-3 text-[#66635C]" />
														)}
													</button>
												);
											})}
										</div>
									</div>

								{/* Validation alert banner if bagrut has issues */}
								{showValidationErrors && !bagrutValidation.isValid && (
									<div id="step1-bagrut-validation-alert" className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] space-y-1.5 shadow-2xs">
										<div className="flex items-center gap-2 text-xs font-bold text-[#E11D48]">
											<AlertCircle className="h-4 w-4 shrink-0" />
											<span>יש להשלים את הזנת ציוני הבגרות כדי שנוכל לחשב עבורך ממוצע מדויק</span>
										</div>
										<p className="text-xs text-[#9F1239] leading-relaxed">
											{bagrutValidation.errorMessage}
										</p>
									</div>
								)}
							</div>
						)}

						{/* SUB-STEP 1B: הזנת ציוני פסיכומטרי */}
						{step1SubStep === 'psychometric' && (
							<div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#E5DFD4] shadow-xs space-y-4 max-w-4xl mx-auto flex-1 min-h-0 flex flex-col w-full overflow-y-auto custom-scrollbar">
								{/* Integrated Card Top Bar with Prominent Step 1B Title */}
								<div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#EAE5DA] pb-3.5 shrink-0">
									<div>
										<div className="flex items-center gap-2 mb-1">
											<span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#DDD7CB] text-[#44423D] text-[11px] font-bold shadow-2xs">
												שלב 1 מתוך 4: נתוני פתיחה
											</span>
											<span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#DDD7CB] text-[#44423D] text-[11px] font-bold shadow-2xs">
												פסיכומטרי (חלק 2 מתוך 2)
											</span>
										</div>
										<h2 className="text-xl sm:text-2xl font-black text-[#222222]">
											שלב 1: הזנת ציוני בחינה פסיכומטרית
										</h2>
										<p className="text-xs text-[#66635C] mt-0.5">
											ציון רב-תחומי (200–800) וציוני פרקים. אם טרם נבחנת, תוכל לסמן זאת ולבדוק קבלה ישירה.
										</p>
									</div>

									<button
										type="button"
										onClick={handleBackToBagrut}
										className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD7CB] text-xs font-bold text-[#44423D] hover:bg-[#EFEAE0] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
									>
										<ArrowRight className="h-3.5 w-3.5" />
										<span>חזרה לציוני בגרות</span>
									</button>
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
										className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
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
											<span className="px-2.5 py-1 rounded-lg bg-white text-[#222222] text-xs font-bold border border-[#DDD7CB]">
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
											<p className="text-xs text-[#55524B] leading-relaxed">
												המערכת תבדוק אילו תארים מאפשרים קבלה ישירה על סמך ממוצע בגרות בלבד, ובשלב התכנון תחשב בדיוק איזה ציון פסיכומטרי יעד יידרש ממך בבחינה הראשונה לכל תואר מבוקש.
											</p>
										</div>
									) : (
										<div className="space-y-5">
											<div className="space-y-1.5">
												<div className="flex items-center justify-between">
													<label className="block text-xs font-bold text-[#44423D]">
														ציון רב-תחומי (200–800):
													</label>
													<span className="text-[11px] text-[#66635C]">
														לפי ספח הציונים הרשמי
													</span>
												</div>
												<input
													type="number"
													inputMode="numeric"
													pattern="[0-9]*"
													min={200}
													max={800}
													value={psychGeneral === 0 ? '' : psychGeneral}
													onChange={(e) =>
														setPsychGeneral(cleanNumberInput(e.target.value, 0, 800) as number)
													}
													placeholder="200-800"
													className="w-full bg-[#FAF8F5] border border-[#DDD7CB] rounded-xl px-4 py-3 text-sm font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
												/>
											</div>

											{/* Gross Mismatch Warning Banner */}
											{!psychCoherence.isCoherent && psychCoherence.calculatedGeneral > 0 && (
												<div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-2">
													<div className="flex items-center gap-1.5 text-xs font-bold">
														<AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
														<span>פער חריג (מעל 30 נקודות) בין הציון הכולל לציוני הפרקים</span>
													</div>
													<p className="text-xs leading-relaxed text-amber-800">
														הציון הרב-תחומי שהוזן ({psychGeneral}) סוטה משמעותית מהערכת שקלול הפרקים (סביב {psychCoherence.calculatedGeneral}). אנא ודא שהנתונים שהזנת תואמים במדויק את ספח הציונים הרשמי ממאל״ו.
													</p>
												</div>
											)}

											<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
												<div className="space-y-1.5">
													<label className="block text-xs font-bold text-[#44423D]">כמותי (50–150):</label>
													<input
														type="number"
														inputMode="numeric"
														pattern="[0-9]*"
														min={50}
														max={150}
														value={psychQuant === 0 ? '' : psychQuant}
														onChange={(e) =>
															handleSubscoreChange('quant', cleanNumberInput(e.target.value, 0, 150) as number)
														}
														placeholder="50-150"
														className="w-full bg-[#FAF8F5] border border-[#DDD7CB] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
													/>
												</div>

												<div className="space-y-1.5">
													<label className="block text-xs font-bold text-[#44423D]">מילולי (50–150):</label>
													<input
														type="number"
														inputMode="numeric"
														pattern="[0-9]*"
														min={50}
														max={150}
														value={psychVerbal === 0 ? '' : psychVerbal}
														onChange={(e) =>
															handleSubscoreChange('verbal', cleanNumberInput(e.target.value, 0, 150) as number)
														}
														placeholder="50-150"
														className="w-full bg-[#FAF8F5] border border-[#DDD7CB] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
													/>
												</div>

												<div className="space-y-1.5">
													<label className="block text-xs font-bold text-[#44423D]">אנגלית (50–150):</label>
													<input
														type="number"
														inputMode="numeric"
														pattern="[0-9]*"
														min={50}
														max={150}
														value={psychEnglish === 0 ? '' : psychEnglish}
														onChange={(e) =>
															handleSubscoreChange('english', cleanNumberInput(e.target.value, 0, 150) as number)
														}
														placeholder="50-150"
														className="w-full bg-[#FAF8F5] border border-[#DDD7CB] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222] transition"
													/>
												</div>
											</div>

											{/* English Classification */}
											{psychResolution.englishClassification.level !== 'unknown' && (
												<div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-between text-xs">
													<span className="text-[#66635C] font-medium">סיווג רמת אנגלית אקדמית:</span>
													<span
														className={`text-xs font-bold px-3 py-1 rounded-md border shadow-2xs ${psychResolution.englishClassification.color}`}
													>
														{psychResolution.englishClassification.label}
													</span>
												</div>
											)}

											{/* Optional NITE Emphasis Scores (200-800) */}
											<div className="pt-2">
												<button
													type="button"
													onClick={() => setShowEmphasisInputs(!showEmphasisInputs)}
													className="text-xs font-bold text-[#3C3C3C] hover:text-black flex items-center gap-1.5 transition underline decoration-dotted cursor-pointer"
												>
													<span>
														{showEmphasisInputs
															? 'הסתר ציוני דגש רשמיים (200–800)'
															: '+ הזנת ציוני דגש רשמיים (כמותי ומילולי) מספח מאל״ו — מומלץ לדיוק'}
													</span>
												</button>

												{showEmphasisInputs && (
													<div className="mt-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] space-y-3 shadow-2xs">
														<div className="flex items-center justify-between">
															<span className="text-xs font-bold text-[#222222]">
																ציוני דגש רשמיים (מאל״ו)
															</span>
															<span className="text-[11px] text-[#77746D]">מומלץ לדיוק (200–800)</span>
														</div>
														<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
															<div className="space-y-1">
																<label className="block text-[11px] font-medium text-[#55524B]">
																	דגש כמותי (הנדסה/מדמ״ח):
																</label>
																<input
																	type="number"
																	inputMode="numeric"
																	pattern="[0-9]*"
																	min={200}
																	max={800}
																	value={psychQuantEmphasis}
																	onChange={(e) =>
																		setPsychQuantEmphasis(cleanNumberInput(e.target.value, 0, 800) as number)
																	}
																	placeholder={String(psychResolution.effectiveQuantEmphasis)}
																	className="w-full bg-white border border-[#DDD7CB] rounded-lg px-3 py-2 text-xs font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
																/>
															</div>
															<div className="space-y-1">
																<label className="block text-[11px] font-medium text-[#55524B]">
																	דגש מילולי (הומני/רפואה):
																</label>
																<input
																	type="number"
																	inputMode="numeric"
																	pattern="[0-9]*"
																	min={200}
																	max={800}
																	value={psychVerbalEmphasis}
																	onChange={(e) =>
																		setPsychVerbalEmphasis(cleanNumberInput(e.target.value, 0, 800) as number)
																	}
																	placeholder={String(psychResolution.effectiveVerbalEmphasis)}
																	className="w-full bg-white border border-[#DDD7CB] rounded-lg px-3 py-2 text-xs font-bold text-[#222222] focus:outline-none focus:ring-1 focus:ring-[#222222]"
																/>
															</div>
														</div>
													</div>
												)}
											</div>

											{/* Calculated Weights info */}
											<div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DFD4] text-xs text-[#66635C] space-y-1.5">
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

											{/* Incomplete scores → results will be estimates */}
											{psychMissingFields.length > 0 && (
												<div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-1.5">
													<div className="flex items-center gap-1.5 text-xs font-bold">
														<AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
														<span>אפשר להמשיך, אבל התוצאות יהיו הערכה ולא מדויקות</span>
													</div>
													<p className="text-xs leading-relaxed text-amber-800">
														חסרים: {psychMissingFields.join(', ')}. כל אוניברסיטה משקללת פרקים אחרים, והציונים החסרים יוערכו מתוך השאר. את כל הציונים, כולל ציוני הדגש, אפשר למצוא בספח הציונים הרשמי של מאל״ו.
														{psychMissingFields.some((f) => f.startsWith('דגש')) && !showEmphasisInputs && (
															<button
																type="button"
																onClick={() => setShowEmphasisInputs(true)}
																className="mr-1 font-bold underline decoration-dotted cursor-pointer"
															>
																הזנת ציוני דגש
															</button>
														)}
													</p>
												</div>
											)}
										</div>
									)}

								{/* Validation alert banner if attempting to advance without valid psychometric */}
								{showValidationErrors && !psychValidation.isValid && (
									<div id="step1-psych-validation-alert" className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] space-y-1.5 shadow-2xs">
										<div className="flex items-center gap-2 text-xs font-bold text-[#E11D48]">
											<AlertCircle className="h-4 w-4 shrink-0" />
											<span>יש להשלים את הזנת הציון הפסיכומטרי</span>
										</div>
										<p className="text-xs text-[#9F1239] leading-relaxed">
											{psychValidation.errorMessage}
										</p>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* STEP 2: בחירת תארים מבוקשים */}
				{activeStep === 2 && (
					<div className="flex-1 min-h-0 flex flex-col h-full">
						<DegreeSearchSelector
							selectedPrograms={selectedTargets}
							onToggleProgram={handleToggleTarget}
							onAddMultiplePrograms={handleAddMultipleTargets}
							onRemoveProgram={handleRemoveTarget}
							onClearAll={handleClearAllTargets}
							onProceedToNextStep={() => setActiveStep(3)}
						/>
					</div>
				)}

				{/* STEP 3: דוח קבלה אישי */}
				{activeStep === 3 && (
					<div className="space-y-6">
						{!gradeValidation.isValid ? (
							<div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#E5DFD4] shadow-xs space-y-4 max-w-2xl mx-auto">
								<AlertCircle className="h-12 w-12 text-[#E11D48] mx-auto" />
								<h3 className="text-lg font-bold text-[#222222]">חסרים נתוני ציונים לחישוב סיכויי קבלה</h3>
								<p className="text-sm text-[#66635C] leading-relaxed">
									על מנת לחשב סכמים מדויקים ולבדוק עמידה בתנאי הסף של האוניברסיטאות, יש להזין תחילה את ציוני הבגרות והפסיכומטרי שלך.
								</p>
								<button
									onClick={() => setActiveStep(1)}
									className="px-6 py-2.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl transition cursor-pointer"
								>
									חזור להזנת ציונים (שלב 1)
								</button>
							</div>
						) : (
							<>
								{renderPsychEstimateBanner()}

								<PersonalAdmissionReport
									analyses={gapAnalyses}
									onViewGap={handleViewGapForProgram}
									onAddMorePrograms={() => setActiveStep(2)}
								/>
							</>
						)}
					</div>
				)}

				{/* STEP 4: תכנון מסלולי פעולה ובניית מסלול אישי */}
				{activeStep === 4 && (
					<div className="space-y-6">
						{gradeValidation.isValid && renderPsychEstimateBanner()}
						{!gradeValidation.isValid ? (
							<div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#E5DFD4] shadow-xs space-y-4 max-w-2xl mx-auto">
								<AlertCircle className="h-12 w-12 text-[#E11D48] mx-auto" />
								<h3 className="text-lg font-bold text-[#222222]">לא ניתן לבנות מסלולים ללא ציוני פתיחה</h3>
								<p className="text-sm text-[#66635C] leading-relaxed">
									המערכת אינה מייצרת מסלולי שיפור משוערים ללא נתוני אמת. יש להזין את ציוני הבגרות המלאים כדי שנוכל לבנות עבורך תוכנית אופטימיזציה אמיתית ומדויקת.
								</p>
								<button
									onClick={() => setActiveStep(1)}
									className="px-6 py-2.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl transition cursor-pointer"
								>
									הזן ציונים עכשיו (שלב 1)
								</button>
							</div>
						) : currentFocusedAnalysis ? (
							currentFocusedAnalysis.status === 'accepted' ? (
								<AcceptedRegistrationCard
									analysis={currentFocusedAnalysis}
									otherAnalyses={gapAnalyses}
									onSelectOtherProgram={(programId) => setFocusedProgramId(programId)}
									onBackToReport={() => setActiveStep(3)}
								/>
							) : !user ? (
								<TrackRegistrationGate
									analysis={currentFocusedAnalysis}
									onBackToReport={() => setActiveStep(3)}
								/>
							) : (
								<RecommendedTracksView
									analysis={currentFocusedAnalysis}
									allAnalyses={gapAnalyses}
									tracks={recommendedTracks || []}
									userProfile={userProfile}
									institutionResult={institutionResultsMap[currentFocusedAnalysis.target.calculatorId]}
									mechinaAvailable={currentFocusedAnalysis.status === 'not_accepted' || currentFocusedAnalysis.gap < 0}
									onSelectProgram={(programId) => setFocusedProgramId(programId)}
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
					targetInstitutionId={selectedTargets[0]?.calculatorId as any}
				/>
			</main>

			{/* ========================================================================= */}
			{/* ALWAYS-VISIBLE FLOATING CAPSULE NAVIGATION DOCK (קפסולה צפה מנותקת ומודגשת) */}
			{/* ========================================================================= */}
			<div className="fixed bottom-3 sm:bottom-4.5 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none">
				<nav
					aria-label="ניווט שלבי האשף"
					className="pointer-events-auto max-w-6xl w-full bg-white/95 backdrop-blur-xl border border-[#D5CFC2] rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.14),0_3px_12px_rgba(0,0,0,0.06)] px-3.5 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-4 ring-1 ring-black/5"
				>
					{/* --- RIGHT SIDE (RTL START): BACK BUTTON OR STEP BADGE --- */}
					<div className="flex items-center gap-2 shrink-0">
						{activeStep === 1 ? (
							step1SubStep === 'bagrut' ? (
								<div className="flex items-center gap-2.5 px-1">
									<span className="w-8 h-8 rounded-xl bg-[#3C3C3C] text-white font-black text-xs flex items-center justify-center shadow-2xs">
										1
									</span>
									<div className="hidden sm:block">
										<span className="text-xs font-bold text-[#222222] block leading-tight">שלב 1: ציוני בגרות</span>
										<span className="text-[10px] text-[#66635C] block">חלק 1 מתוך 2</span>
									</div>
								</div>
							) : (
								<button
									type="button"
									onClick={handleBackToBagrut}
									className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#FAF8F5] hover:bg-[#EFEAE0] text-[#222222] font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 sm:gap-2 border border-[#D5CFC2] shadow-2xs cursor-pointer active:scale-[0.99]"
								>
									<ArrowRight className="h-4 w-4 shrink-0" />
									<span>חזור להזנת בגרויות</span>
								</button>
							)
						) : (
							<button
								type="button"
								onClick={() => {
									if (activeStep === 2) {
										setActiveStep(1);
										setStep1SubStep('psychometric');
									}
									else if (activeStep === 3) setActiveStep(2);
									else if (activeStep === 4) setActiveStep(3);
								}}
								className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#FAF8F5] hover:bg-[#EFEAE0] text-[#222222] font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 sm:gap-2 border border-[#D5CFC2] shadow-2xs cursor-pointer active:scale-[0.99]"
							>
								<ArrowRight className="h-4 w-4 shrink-0" />
								<span>
									{activeStep === 2 && 'חזור להזנת ציונים'}
									{activeStep === 3 && 'חזור לבחירת תארים'}
									{activeStep === 4 && 'חזור לדוח הקבלה'}
								</span>
							</button>
						)}
					</div>

					{/* --- CENTER: ALWAYS-VISIBLE 4-STEP STEPPER DOCK (סרגל 4 השלבים המלווה תמיד למטה) --- */}
					<div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 justify-center min-w-0 max-w-4xl px-1 sm:px-2">
						{/* Step 1 */}
						<button
							type="button"
							onClick={() => {
								if (activeStep === 1) {
									if (step1SubStep === 'psychometric') {
										handleBackToBagrut();
									}
								} else {
									handleStepClick(1);
								}
							}}
							className={`p-1.5 sm:p-2.5 rounded-2xl transition flex items-center gap-2 sm:gap-3 text-right border cursor-pointer min-w-0 flex-1 max-w-[210px] ${
								activeStep === 1
									? 'bg-[#3C3C3C] border-[#3C3C3C] text-white shadow-xs'
									: 'bg-[#F8F6F2] border-[#E2DDD2] text-[#55524B] hover:text-[#111111] hover:bg-white hover:border-[#CCC5B6]'
							}`}
							title="שלב 1: הזנת ציונים (בגרויות ופסיכומטרי)"
						>
							<div
								className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 1
										? 'bg-white text-black shadow-xs'
										: 'bg-[#EAE5DA] text-[#33312C]'
								}`}
							>
								1
							</div>
							<div className="overflow-hidden hidden sm:block">
								<span className="text-xs font-bold block truncate">הזנת ציונים</span>
								<span className="text-[10px] text-inherit opacity-80 block truncate hidden lg:block">
									{activeStep === 1
										? step1SubStep === 'bagrut'
											? 'בגרויות (שלב 1 מתוך 2)'
											: 'פסיכומטרי (שלב 2 מתוך 2)'
										: 'בגרויות ופסיכומטרי'}
								</span>
							</div>
						</button>

						{/* Step 2 */}
						<button
							type="button"
							onClick={() => handleStepClick(2)}
							className={`p-1.5 sm:p-2.5 rounded-2xl transition flex items-center gap-2 sm:gap-3 text-right border cursor-pointer min-w-0 flex-1 max-w-[210px] ${
								activeStep === 2
									? 'bg-[#3C3C3C] border-[#3C3C3C] text-white shadow-xs'
									: 'bg-[#F8F6F2] border-[#E2DDD2] text-[#55524B] hover:text-[#111111] hover:bg-white hover:border-[#CCC5B6]'
							}`}
							title={`שלב 2: בחירת תארים (${selectedTargets.length} נבחרו)`}
						>
							<div
								className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 2
										? 'bg-white text-black shadow-xs'
										: 'bg-[#EAE5DA] text-[#33312C]'
								}`}
							>
								2
							</div>
							<div className="overflow-hidden hidden sm:block">
								<span className="text-xs font-bold block truncate">בחירת תארים</span>
								<span className="text-[10px] text-inherit opacity-80 block truncate hidden lg:block">
									סל מבוקשים ({selectedTargets.length})
								</span>
							</div>
						</button>

						{/* Step 3 */}
						<button
							type="button"
							onClick={() => handleStepClick(3)}
							className={`p-1.5 sm:p-2.5 rounded-2xl transition flex items-center gap-2 sm:gap-3 text-right border cursor-pointer min-w-0 flex-1 max-w-[210px] ${
								activeStep === 3
									? 'bg-[#3C3C3C] border-[#3C3C3C] text-white shadow-xs'
									: 'bg-[#F8F6F2] border-[#E2DDD2] text-[#55524B] hover:text-[#111111] hover:bg-white hover:border-[#CCC5B6]'
							}`}
							title="שלב 3: דוח קבלה אישי"
						>
							<div
								className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 3
										? 'bg-white text-black shadow-xs'
										: 'bg-[#EAE5DA] text-[#33312C]'
								}`}
							>
								3
							</div>
							<div className="overflow-hidden hidden sm:block">
								<span className="text-xs font-bold block truncate">דוח קבלה אישי</span>
								<span className="text-[10px] text-inherit opacity-80 block truncate hidden lg:block">
									סטטוסים והערכה
								</span>
							</div>
						</button>

						{/* Step 4 */}
						<button
							type="button"
							onClick={() => handleStepClick(4)}
							className={`p-1.5 sm:p-2.5 rounded-2xl transition flex items-center gap-2 sm:gap-3 text-right border cursor-pointer min-w-0 flex-1 max-w-[210px] ${
								activeStep === 4
									? 'bg-[#3C3C3C] border-[#3C3C3C] text-white shadow-xs'
									: 'bg-[#F8F6F2] border-[#E2DDD2] text-[#55524B] hover:text-[#111111] hover:bg-white hover:border-[#CCC5B6]'
							}`}
							title="שלב 4: תכנון מסלולי פעולה"
						>
							<div
								className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
									activeStep === 4
										? 'bg-white text-black shadow-xs'
										: 'bg-[#EAE5DA] text-[#33312C]'
								}`}
							>
								4
							</div>
							<div className="overflow-hidden hidden sm:block">
								<span className="text-xs font-bold block truncate">תכנון מסלולי פעולה</span>
								<span className="text-[10px] text-inherit opacity-80 block truncate hidden lg:block">
									3 מסלולים + מסלול אישי
								</span>
							</div>
						</button>
					</div>

					{/* --- LEFT SIDE (RTL END): PRIMARY CONTINUE / ACTION BUTTON --- */}
					<div className="flex items-center gap-2.5 shrink-0">
						{activeStep === 1 && (
							step1SubStep === 'bagrut' ? (
								<button
									type="button"
									onClick={handleProceedToPsychometric}
									className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#EA580C] hover:bg-[#D94E07] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-[0.99]"
								>
									<span>המשך להזנת פסיכומטרי</span>
									<ArrowLeft className="h-4 w-4 shrink-0" />
								</button>
							) : (
								<button
									type="button"
									onClick={handleProceedFromStep1}
									className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#EA580C] hover:bg-[#D94E07] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-[0.99]"
								>
									<span>המשך לבחירת תארים מבוקשים</span>
									<ArrowLeft className="h-4 w-4 shrink-0" />
								</button>
							)
						)}

						{activeStep === 2 && (
							<button
								type="button"
								onClick={() => setActiveStep(3)}
								disabled={selectedTargets.length === 0}
								className={`px-5 sm:px-6 py-2.5 sm:py-3 font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 ${
									selectedTargets.length > 0
										? 'bg-[#EA580C] hover:bg-[#D94E07] text-white shadow-xs cursor-pointer active:scale-[0.99]'
										: 'bg-[#EFEAE1] text-[#9E988D] cursor-not-allowed border border-[#DDD7CB]'
								}`}
							>
								<span>המשך לדוח קבלה אישי ({selectedTargets.length})</span>
								<ArrowLeft className="h-4 w-4 shrink-0" />
							</button>
						)}

						{activeStep === 3 && (
							<button
								type="button"
								onClick={() => setActiveStep(4)}
								disabled={gapAnalyses.length === 0}
								className={`px-5 sm:px-6 py-2.5 sm:py-3 font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 ${
									gapAnalyses.length > 0
										? 'bg-[#EA580C] hover:bg-[#D94E07] text-white shadow-xs cursor-pointer active:scale-[0.99]'
										: 'bg-[#EFEAE1] text-[#9E988D] cursor-not-allowed border border-[#DDD7CB]'
								}`}
							>
								<span>לתכנון מסלולי פעולה</span>
								<ArrowLeft className="h-4 w-4 shrink-0" />
							</button>
						)}

						{activeStep === 4 && (
							gapAnalyses.length > 1 ? (
								<div className="flex items-center gap-2">
									<span className="text-[11px] text-[#66635C] font-bold hidden sm:inline">החלף תואר:</span>
									<select
										value={currentFocusedAnalysis?.target.program.id || ''}
										onChange={(e) => setFocusedProgramId(e.target.value)}
										className="text-xs font-bold bg-[#FAF8F5] border border-[#DDD7CB] rounded-xl px-2.5 sm:px-3 py-2 text-[#222222] cursor-pointer focus:ring-1 focus:ring-[#3C3C3C] shadow-2xs max-w-[160px] sm:max-w-[200px] truncate"
									>
										{gapAnalyses.map((ga) => (
											<option key={ga.target.program.id} value={ga.target.program.id}>
												{ga.target.program.fieldOfStudy} ({ga.target.institutionName.replace('אוניברסיטת ', '')})
											</option>
										))}
									</select>
								</div>
							) : (
								<button
									type="button"
									onClick={() => setActiveStep(2)}
									className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#EFEAE0] text-[#222222] font-bold text-xs rounded-xl border border-[#DDD7CB] transition shadow-2xs cursor-pointer"
								>
									<span>הוסף תארים נוספים</span>
								</button>
							)
						)}
					</div>
				</nav>
			</div>
		</div>
	);
}
