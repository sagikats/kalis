'use client';

import SekemBreakdown from './SekemBreakdown';
import type { SubjectBreakdownItem } from '../../modules/calculators/types';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSpringNumber } from '@/hooks/useSpringNumber';
import Link from 'next/link';
import {
	Sliders,
	Sparkles,
	Zap,
	BookOpen,
	Brain,
	CheckCircle2,
	AlertCircle,
	RotateCcw,
	ArrowLeft,
	ArrowRight,
	TrendingUp,
	Award,
	ChevronDown,
	ChevronUp,
	Plus,
	Trash2,
	X,
	Info,
	Bookmark,
	BookmarkCheck,
	Loader2,
	Calendar,
	Clock
} from 'lucide-react';
import { ProgramGapAnalysis, UserAcademicProfile, analyzeProgramGap, evaluateProgramRequirements } from '@/utils/analysis/gapAnalyzer';
import { describeRequirement } from '@/modules/optimizer/programRequirements';
import {
	calculateMultiInstitutionSekem,
	InstitutionSekemResult,
	UnifiedCalculationInput
} from '@/utils/calculators/multiCalculator';
import { SubjectInput, selectProgramSekem } from '@/modules/calculators';
import { getRealisticPsychometricCeiling, RecommendedTrack, evaluateSimulatedSekem } from '@/utils/analysis/trackGenerator';
import { simulateRealisticSubscores } from '@/utils/calculators/psychometricHelper';
import { isSubjectMatch, isSameBagrutSubject } from '@/modules/optimizer/solver';
import SubjectSelectModal from '@/components/calculator/SubjectSelectModal';
import { BagrutSubjectOption, POPULAR_5U_ELECTIVES } from '@/data/bagrutSubjects';
import MultiUniversityAdmissionGrid, { InstitutionSimulatedState } from '@/components/flow/MultiUniversityAdmissionGrid';
import UniversityLogo from '@/components/common/UniversityLogo';
import { useAuth } from '@/context/AuthContext';

export interface SimulatedSubjectItem {
	id: string;
	name: string;
	units: number;
	originalUnits: number;
	originalGrade: number;
	simulatedGrade: number;
	isCustomAdded: boolean;
	isActive: boolean;
}

interface WhatIfSimulatorProps {
	analysis: ProgramGapAnalysis;
	userProfile: UserAcademicProfile;
	institutionResult: InstitutionSekemResult;
	onApplyScenario?: (customPsych: number, customSubjects: SubjectInput[], simulatedSekem: number) => void;
	initialTrackToEdit?: RecommendedTrack | null;
	defaultRecommendedTrack?: RecommendedTrack | null;
	onSaveCustomTrack?: (track: any) => Promise<void>;
	onCancelEdit?: () => void;
}

/** Lowest grade the simulator's subject sliders allow (bonuses typically start at 60, so going below it matters). */
const SUBJECT_GRADE_MIN = 40;

// Filled-track position for the `.slider` range style (globals.css)
const sliderFill = (value: number, min: number, max: number) =>
	({ '--fill': `${max > min ? ((value - min) / (max - min)) * 100 : 0}%` }) as React.CSSProperties;

/**
 * Pre-loads a recommended track's proposed improvements into What-If Simulator state
 */
function applyTrackToSimulatorState(
	track: RecommendedTrack,
	userProfile: UserAcademicProfile,
	initialPsych: number
): {
	targetPsych: number;
	isMathActive: boolean;
	isMath5: boolean;
	mathGrade: number;
	subjectsList: SimulatedSubjectItem[];
} {
	const targetPsych = track.targetPsychometric && track.targetPsychometric > 0
		? track.targetPsychometric
		: initialPsych;

	const mathImp = track.recommendedSubjectImprovements?.find((imp) =>
		isSubjectMatch(imp.subjectName, 'מתמטיקה')
	);
	const isMathActive = !!mathImp;
	const isMath5 = mathImp ? mathImp.targetUnits === 5 : userProfile.mathUnits === 5;
	const mathGrade = mathImp ? mathImp.targetGrade : userProfile.mathGrade || 80;

	// Populate existing user subjects with track targets if present
	const subjectsList: SimulatedSubjectItem[] = (userProfile.bagrutSubjects || []).map((s, idx) => {
		const imp = track.recommendedSubjectImprovements?.find(
			(item) => !isSubjectMatch(item.subjectName, 'מתמטיקה') && isSubjectMatch(item.subjectName, s.name)
		);
		if (imp) {
			return {
				id: `orig-${idx}-${s.name}`,
				name: s.name,
				units: imp.targetUnits || s.units,
				originalUnits: s.units,
				originalGrade: s.grade,
				simulatedGrade: imp.targetGrade,
				isCustomAdded: false,
				isActive: true
			};
		}
		return {
			id: `orig-${idx}-${s.name}`,
			name: s.name,
			units: s.units,
			originalUnits: s.units,
			originalGrade: s.grade,
			simulatedGrade: s.grade,
			isCustomAdded: false,
			isActive: false
		};
	});

	// Append any brand-new electives recommended in the track (e.g. Geography 5u)
	const existingSubjectNames = (userProfile.bagrutSubjects || []).map((s) => s.name);
	track.recommendedSubjectImprovements?.forEach((imp, idx) => {
		const isMath = isSubjectMatch(imp.subjectName, 'מתמטיקה');
		const alreadyExists = existingSubjectNames.some((n) => isSubjectMatch(imp.subjectName, n));
		if (!isMath && !alreadyExists) {
			subjectsList.push({
				id: `custom-track-${idx}-${imp.subjectName}`,
				name: imp.subjectName,
				units: imp.targetUnits || 5,
				originalUnits: imp.currentUnits || 0,
				originalGrade: imp.currentGrade || 0,
				simulatedGrade: imp.targetGrade,
				isCustomAdded: true,
				isActive: true
			});
		}
	});

	return {
		targetPsych,
		isMathActive,
		isMath5,
		mathGrade,
		subjectsList
	};
}

export default function WhatIfSimulator({
	analysis,
	userProfile,
	institutionResult,
	onApplyScenario,
	initialTrackToEdit,
	defaultRecommendedTrack,
	onSaveCustomTrack,
	onCancelEdit
}: WhatIfSimulatorProps) {
	const activeTrack = initialTrackToEdit || null;

	// Baseline values
	const hasOriginalPsych = (userProfile.psychometricGeneral || 0) > 0;
	const initialPsych = hasOriginalPsych ? userProfile.psychometricGeneral : 600;
	const threshold = analysis.threshold || 700;
	const isTechnion = analysis.target.calculatorId === 'technion';

	// Realistic psychometric ceiling calculated from academic baseline
	const realisticCeiling = useMemo(() => {
		return getRealisticPsychometricCeiling(initialPsych, institutionResult.bagrutAverage || 100, {
			psychExperience: 'once',
			psychFeeling: 'high_potential',
			psychStrongestSection: 'quant',
			learningOrientation: 'stem',
			learningStrength: 'analytical_quick',
			weeklyAvailabilityHours: 'part_15_25',
			targetTimeline: 'immediate_october'
		});
	}, [initialPsych, institutionResult.bagrutAverage]);

	// Interactive Simulator State
	const [simulatedPsych, setSimulatedPsych] = useState<number>(() => {
		if (activeTrack && activeTrack.targetPsychometric && activeTrack.targetPsychometric > 0) {
			return activeTrack.targetPsychometric;
		}
		return initialPsych;
	});

	const [isMathActive, setIsMathActive] = useState<boolean>(() => {
		if (activeTrack) {
			const mathImp = activeTrack.recommendedSubjectImprovements?.find((imp) =>
				isSubjectMatch(imp.subjectName, 'מתמטיקה')
			);
			return !!mathImp;
		}
		return false;
	});

	const [isMathUpgradedTo5, setIsMathUpgradedTo5] = useState<boolean>(() => {
		if (activeTrack) {
			const mathImp = activeTrack.recommendedSubjectImprovements?.find((imp) =>
				isSubjectMatch(imp.subjectName, 'מתמטיקה')
			);
			if (mathImp) return mathImp.targetUnits === 5;
		}
		return userProfile.mathUnits === 5;
	});

	const [simulatedMathGrade, setSimulatedMathGrade] = useState<number>(() => {
		if (activeTrack) {
			const mathImp = activeTrack.recommendedSubjectImprovements?.find((imp) =>
				isSubjectMatch(imp.subjectName, 'מתמטיקה')
			);
			if (mathImp) return mathImp.targetGrade;
		}
		return userProfile.mathGrade || 80;
	});

	// Simulated Subjects List (includes original + custom added)
	// STRICT RULE: Only active if proposed in track! No auto-activation of weak subjects!
	const [simulatedList, setSimulatedList] = useState<SimulatedSubjectItem[]>(() => {
		if (activeTrack) {
			return applyTrackToSimulatorState(activeTrack, userProfile, initialPsych).subjectsList;
		}
		return (userProfile.bagrutSubjects || []).map((s, idx) => ({
			id: `orig-${idx}-${s.name}`,
			name: s.name,
			units: s.units,
			originalUnits: s.units,
			originalGrade: s.grade,
			simulatedGrade: s.grade,
			isCustomAdded: false,
			isActive: false // strictly false by default
		}));
	});

	// Auth & Save Custom Track States
	const { user, openAuthModal } = useAuth();
	const [isSavingCustomTrack, setIsSavingCustomTrack] = useState<boolean>(false);
	const [savedCustomTrackSuccess, setSavedCustomTrackSuccess] = useState<boolean>(false);
	const [savedCustomTrackError, setSavedCustomTrackError] = useState<string | null>(null);

	// Modal State for picking any subject from catalog
	const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState<boolean>(false);
	const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
	const [selectedExistingToAdd, setSelectedExistingToAdd] = useState<string>('');
	const [showAllUniversities, setShowAllUniversities] = useState<boolean>(false);

	// Synchronize simulator state when program changes or track to edit changes
	useEffect(() => {
		const targetTrack = initialTrackToEdit || null;
		if (targetTrack) {
			const state = applyTrackToSimulatorState(targetTrack, userProfile, initialPsych);
			setSimulatedPsych(state.targetPsych);
			setIsMathActive(state.isMathActive);
			setIsMathUpgradedTo5(state.isMath5);
			setSimulatedMathGrade(state.mathGrade);
			setSimulatedList(state.subjectsList);
		} else {
			setSimulatedPsych(initialPsych);
			setIsMathActive(false);
			setIsMathUpgradedTo5(userProfile.mathUnits === 5);
			setSimulatedMathGrade(userProfile.mathGrade || 80);
			setSimulatedList(
				(userProfile.bagrutSubjects || []).map((s, idx) => ({
					id: `orig-${idx}-${s.name}`,
					name: s.name,
					units: s.units,
					originalUnits: s.units,
					originalGrade: s.grade,
					simulatedGrade: s.grade,
					isCustomAdded: false,
					isActive: false
				}))
			);
		}
		setSavedCustomTrackSuccess(false);
		setSavedCustomTrackError(null);
	}, [analysis.target.program.id, initialTrackToEdit, initialPsych, userProfile]);

	// Reset to the original proposed targets of the edited track
	const handleResetToOriginalTrack = () => {
		const targetTrack = initialTrackToEdit || null;
		if (targetTrack) {
			const state = applyTrackToSimulatorState(targetTrack, userProfile, initialPsych);
			setSimulatedPsych(state.targetPsych);
			setIsMathActive(state.isMathActive);
			setIsMathUpgradedTo5(state.isMath5);
			setSimulatedMathGrade(state.mathGrade);
			setSimulatedList(state.subjectsList);
			setSavedCustomTrackSuccess(false);
			setSavedCustomTrackError(null);
		}
	};

	// Helper to calculate Sekem for any arbitrary subject list
	const calculateSekemForSubjectList = (
		subjects: SubjectInput[],
		psych: number,
		isMath5: boolean,
		mathGradeVal: number
	): {
		sekem: number;
		bagrutAverage: number;
		allInstitutions: InstitutionSekemResult[];
		droppedSubjects: string[];
		subjectBreakdown?: SubjectBreakdownItem[];
		bagrutCap?: number;
	} => {
		const updatedSubjects = subjects.map((s) => {
			if (s.name.includes('מתמטיקה')) {
				return {
					...s,
					units: isMath5 ? 5 : userProfile.mathUnits || 4,
					grade: mathGradeVal
				};
			}
			return s;
		});

		const physicsSub = updatedSubjects.find((s) => s.name.includes('פיזיקה'));
		const effectivePhysicsUnits = physicsSub ? physicsSub.units : userProfile.physicsUnits;
		const effectivePhysicsGrade = physicsSub ? physicsSub.grade : userProfile.physicsGrade;

		// 1. Dedicated Institutional Calculation for the Selected Target Program
		const targetEval = evaluateSimulatedSekem(
			analysis.target.calculatorId,
			analysis.relevantSekemType,
			userProfile,
			updatedSubjects,
			psych,
			isMath5 ? 5 : userProfile.mathUnits || 4,
			mathGradeVal,
			effectivePhysicsUnits,
			effectivePhysicsGrade
		);

		// 2. Realistic Subscores Simulation for Multi-Institution Accordion Grid
		const simScores = simulateRealisticSubscores(
			psych,
			initialPsych || psych,
			userProfile.psychometricQuant,
			userProfile.psychometricVerbal,
			userProfile.psychometricEnglish,
			userProfile.psychometricQuantEmphasis,
			userProfile.psychometricVerbalEmphasis
		);

		const calcInput: UnifiedCalculationInput = {
			bagrutSubjects: updatedSubjects,
			psychometricGeneral: psych,
			psychometricQuant: simScores.quantSub,
			psychometricQuantEmphasis: simScores.quantEmphasis,
			psychometricVerbal: simScores.verbalSub,
			psychometricVerbalEmphasis: simScores.verbalEmphasis,
			psychometricEnglish: simScores.englishSub,
			mathUnits: isMath5 ? 5 : userProfile.mathUnits || 4,
			mathGrade: mathGradeVal,
			physicsUnits: effectivePhysicsUnits,
			physicsGrade: effectivePhysicsGrade
		};

		const allInstitutionIds = ['bgu', 'tau', 'technion', 'huji', 'haifa', 'ariel', 'bar_ilan', 'reichman'];
		const multiRes = calculateMultiInstitutionSekem(calcInput, allInstitutionIds);

		return {
			sekem: targetEval.sekem,
			bagrutAverage: targetEval.bagrutAverage,
			allInstitutions: multiRes,
			droppedSubjects: targetEval.droppedSubjects || [],
			subjectBreakdown: targetEval.subjectBreakdown,
			bagrutCap: targetEval.bagrutCap
		};
	};

	// Baseline results across ALL 6 institutions
	const baselineResult = useMemo(() => {
		const originalSubjects = (userProfile.bagrutSubjects || []).map((s) => ({
			name: s.name,
			units: s.units,
			grade: s.grade
		}));
		return calculateSekemForSubjectList(
			originalSubjects,
			initialPsych,
			userProfile.mathUnits === 5,
			userProfile.mathGrade || 80
		);
	}, [userProfile, initialPsych]);
	const baselineAllInstitutions = baselineResult.allInstitutions;

	const effectiveMath5 = isMathActive ? isMathUpgradedTo5 : userProfile.mathUnits === 5;
	const effectiveMathGrade = isMathActive ? simulatedMathGrade : userProfile.mathGrade || 80;

	// Active Subjects for current simulation
	const activeEffectiveSubjects = useMemo(() => {
		return simulatedList
			.filter((s) => !s.isCustomAdded || s.isActive)
			.map((s) => ({
				name: s.name,
				units: s.isActive ? s.units : s.originalUnits,
				grade: s.isActive ? s.simulatedGrade : s.originalGrade
			}));
	}, [simulatedList]);

	// Overall Simulated Result
	const simulatedSekemResult = useMemo(() => {
		return calculateSekemForSubjectList(
			activeEffectiveSubjects,
			simulatedPsych,
			effectiveMath5,
			effectiveMathGrade
		);
	}, [activeEffectiveSubjects, simulatedPsych, effectiveMath5, effectiveMathGrade]);

	const currentSekem = simulatedSekemResult.sekem;
	const rawGap = Math.round((currentSekem - threshold) * 10) / 10;
	const passesSekem = rawGap >= 0;

	// Official conditions on the simulated state (same rules as the admission report): the minimum psychometric
	// against the simulated score, subject requirements against the simulated bagrut (incl. the math slider)
	const missingConditions = useMemo(() => {
		const routes = analysis.admissionRoutes;
		const missing: { title: string; detail: string }[] = [];
		if (routes?.minPsychometric && simulatedPsych < routes.minPsychometric) {
			missing.push({ title: `פסיכומטרי ${routes.minPsychometric}`, detail: `התואר דורש פסיכומטרי ${routes.minPsychometric} לפחות בנוסף לסכם.` });
		}
		if (routes?.requirements?.length) {
			const mathUnits = effectiveMath5 ? 5 : userProfile.mathUnits || 0;
			const results = evaluateProgramRequirements(routes.requirements, {
				...userProfile,
				bagrutSubjects: [
					...activeEffectiveSubjects.filter((sub) => !isSameBagrutSubject(sub.name, 'מתמטיקה')),
					...(mathUnits > 0 ? [{ name: 'מתמטיקה', units: mathUnits, grade: effectiveMathGrade }] : [])
				],
				mathUnits,
				mathGrade: effectiveMathGrade,
				psychometricGeneral: simulatedPsych
			});
			for (const r of results) {
				if (r.met || r.unknown) continue;
				missing.push({
					title: r.requirement.title,
					detail: r.examOption?.exam
						? `אפשר לעמוד בתנאי עם ${r.examOption.exam}. נדרש: ${describeRequirement(r.requirement)}.`
						: `נדרש: ${describeRequirement(r.requirement)}.`
				});
			}
		}
		return missing;
	}, [analysis.admissionRoutes, simulatedPsych, activeEffectiveSubjects, effectiveMath5, effectiveMathGrade, userProfile]);

	// The status of the simulated state comes from the same analysis as the admission report (analyzeProgramGap), so
	// official alternative routes count too: bagrut-only, psychometric-only and excellent bagrut.
	const simulatedAnalysis = useMemo(() => {
		const targetRes = simulatedSekemResult.allInstitutions.find((r) => r.institutionId === analysis.target.calculatorId);
		if (!targetRes) return null;
		const mathUnits = effectiveMath5 ? 5 : userProfile.mathUnits || 0;
		return analyzeProgramGap(analysis.target, {
			...userProfile,
			bagrutSubjects: [
				...activeEffectiveSubjects.filter((sub) => !isSameBagrutSubject(sub.name, 'מתמטיקה')),
				...(mathUnits > 0 ? [{ name: 'מתמטיקה', units: mathUnits, grade: effectiveMathGrade }] : [])
			],
			mathUnits,
			mathGrade: effectiveMathGrade,
			psychometricGeneral: simulatedPsych
		}, targetRes);
	}, [simulatedSekemResult, analysis.target, activeEffectiveSubjects, effectiveMath5, effectiveMathGrade, simulatedPsych, userProfile]);

	/** Medicine-style programs: meeting the threshold and conditions only invites to the screening stage (MOR / interviews). */
	const isScreening = simulatedAnalysis?.status === 'screening';
	const isAccepted = simulatedAnalysis
		? simulatedAnalysis.status === 'accepted' || isScreening
		: passesSekem && missingConditions.length === 0;
	// The sekem passes but an official condition is missing (replaces the old near-threshold "על הגבול")
	const isMissingRequirement = simulatedAnalysis
		? simulatedAnalysis.status === 'missing_requirement'
		: passesSekem && missingConditions.length > 0;
	/** Accepted on an official route other than the sekem (e.g. "בגרות בלבד"): its explanation. */
	const alternativeRouteNote = isScreening
		? simulatedAnalysis?.admissionNote
		: isAccepted && simulatedAnalysis?.admissionRoute && simulatedAnalysis.admissionRoute !== 'sekem'
		? simulatedAnalysis.admissionNote
		: undefined;
	const missingTitles = missingConditions.length > 0
		? missingConditions.map((m) => m.title).join(', ')
		: simulatedAnalysis?.admissionNote ?? '';

	// Progress bar calculation (0% to 100%)
	const progressPercent = useMemo(() => {
		const baselineSekem = analysis.userSekem;
		const neededTotal = threshold - baselineSekem;
		if (neededTotal <= 0) return 100;
		const achieved = currentSekem - baselineSekem;
		const pct = Math.round((achieved / neededTotal) * 100);
		return Math.min(100, Math.max(0, pct));
	}, [analysis.userSekem, currentSekem, threshold]);

	// The live score rolls to each new value instead of jumping, so the size of a change is felt
	const displaySekem = useSpringNumber(currentSekem);
	const displayProgress = useSpringNumber(progressPercent);
	// Crossing the threshold is the one moment that earns a haptic tick (phones that support it)
	const wasAcceptedRef = useRef(isAccepted);
	useEffect(() => {
		if (isAccepted && !wasAcceptedRef.current && typeof navigator !== 'undefined') {
			navigator.vibrate?.(12);
		}
		wasAcceptedRef.current = isAccepted;
	}, [isAccepted]);

	// Helper to calculate the exact MARGINAL IMPACT of a specific subject
	const calculateSubjectMarginalImpact = (item: SimulatedSubjectItem): { sekemDelta: number; bagrutDelta: number } => {
		// Reverted list without this subject's simulation
		const testSubjects = simulatedList
			.filter((s) => s.id !== item.id || !item.isCustomAdded)
			.map((s) => {
				if (s.id === item.id) {
					return {
						name: s.name,
						units: s.originalUnits,
						grade: s.originalGrade
					};
				}
				return {
					name: s.name,
					units: s.isActive ? s.units : s.originalUnits,
					grade: s.isActive ? s.simulatedGrade : s.originalGrade
				};
			});

		const testRes = calculateSekemForSubjectList(
			testSubjects,
			simulatedPsych,
			effectiveMath5,
			effectiveMathGrade
		);

		const sekemDelta = Math.max(0, Math.round((currentSekem - testRes.sekem) * 10) / 10);
		const bagrutDelta = Math.max(0, Math.round((simulatedSekemResult.bagrutAverage - testRes.bagrutAverage) * 100) / 100);

		return { sekemDelta, bagrutDelta };
	};

	// Math upgrade marginal impact
	const mathUpgradeImpact = useMemo(() => {
		if (!isMathActive) return 0;
		const testRes = calculateSekemForSubjectList(
			activeEffectiveSubjects,
			simulatedPsych,
			userProfile.mathUnits === 5,
			userProfile.mathGrade || 80
		);
		return Math.max(0, Math.round((currentSekem - testRes.sekem) * 10) / 10);
	}, [isMathActive, activeEffectiveSubjects, simulatedPsych, currentSekem, userProfile]);

	// Total Sekem contribution from all Bagrut improvements & additions combined
	const totalBagrutSekemDelta = useMemo(() => {
		const originalSubjects = (userProfile.bagrutSubjects || []).map((s) => ({
			name: s.name,
			units: s.units,
			grade: s.grade
		}));
		const baselineBagrutRes = calculateSekemForSubjectList(
			originalSubjects,
			simulatedPsych,
			userProfile.mathUnits === 5,
			userProfile.mathGrade || 80
		);
		return Math.max(0, Math.round((currentSekem - baselineBagrutRes.sekem) * 10) / 10);
	}, [currentSekem, userProfile, simulatedPsych]);

	// Total Sekem contribution from Psychometric change
	const totalPsychSekemDelta = useMemo(() => {
		const resWithOrigPsych = calculateSekemForSubjectList(
			activeEffectiveSubjects,
			hasOriginalPsych ? initialPsych : 0,
			effectiveMath5,
			effectiveMathGrade
		);
		return Math.max(0, Math.round((currentSekem - resWithOrigPsych.sekem) * 10) / 10);
	}, [currentSekem, activeEffectiveSubjects, initialPsych, hasOriginalPsych, effectiveMath5, effectiveMathGrade]);

	// Difference between simulated Bagrut average and baseline Bagrut average
	const bagrutDeltaVal = useMemo(() => {
		const baseAvg = institutionResult.bagrutAverage || 100;
		return Math.max(0, Math.round((simulatedSekemResult.bagrutAverage - baseAvg) * 100) / 100);
	}, [simulatedSekemResult.bagrutAverage, institutionResult.bagrutAverage]);

	// Summary of all proposed changes compared to baseline
	const summaryChanges = useMemo(() => {
		const changes: Array<{
			id: string;
			category: 'psychometric' | 'math' | 'bagrut_elective' | 'bagrut_core';
			name: string;
			type: string;
			unitsLabel: string;
			unitsNumber: number;
			targetUnitsNumber: number;
			fromGrade: number;
			toGrade: number;
			deltaGrade: number;
			sekemImpact: number;
			bagrutImpact: number;
		}> = [];

		// 1. Psychometric change
		if (simulatedPsych !== (userProfile.psychometricGeneral || 0)) {
			const hadPsych = (userProfile.psychometricGeneral || 0) > 0;
			changes.push({
				id: 'change-psych',
				category: 'psychometric',
				name: 'בחינה פסיכומטרית',
				type: hadPsych ? 'שיפור ציון פסיכומטרי' : 'בחינה פסיכומטרית ראשונה',
				unitsLabel: 'כללי (200-800)',
				unitsNumber: 0,
				targetUnitsNumber: 0,
				fromGrade: userProfile.psychometricGeneral || 0,
				toGrade: simulatedPsych,
				deltaGrade: simulatedPsych - (userProfile.psychometricGeneral || 0),
				sekemImpact: totalPsychSekemDelta,
				bagrutImpact: 0
			});
		}

		// 2. Math change (only if Math is actively being improved)
		if (isMathActive) {
			const origMathUnits = userProfile.mathUnits || 4;
			const origMathGrade = userProfile.mathGrade || 80;
			const curMathUnits = isMathUpgradedTo5 ? 5 : origMathUnits;
			const mathUnitsChanged = curMathUnits !== origMathUnits;
			const mathGradeChanged = simulatedMathGrade !== origMathGrade;

			if (mathUnitsChanged || mathGradeChanged) {
				changes.push({
					id: 'change-math',
					category: 'math',
					name: 'מתמטיקה',
					type: mathUnitsChanged
						? `שדרוג מ-${origMathUnits} ל-5 יח״ל`
						: `שיפור ציון (${curMathUnits} יח״ל)`,
					unitsLabel: mathUnitsChanged ? `${origMathUnits} ← 5 יח״ל` : `${curMathUnits} יח״ל`,
					unitsNumber: origMathUnits,
					targetUnitsNumber: curMathUnits,
					fromGrade: origMathGrade,
					toGrade: simulatedMathGrade,
					deltaGrade: simulatedMathGrade - origMathGrade,
					sekemImpact: mathUpgradeImpact,
					bagrutImpact: 0
				});
			}
		}

		// 3. Other Bagrut subjects
		simulatedList.forEach((s) => {
			if (s.name.includes('מתמטיקה')) return;

			if (s.isCustomAdded && s.isActive) {
				const impact = calculateSubjectMarginalImpact(s);
				changes.push({
					id: s.id,
					category: 'bagrut_elective',
					name: s.name,
					type: 'מקצוע מוגבר חדש',
					unitsLabel: `מקצוע חדש (${s.units} יח״ל)`,
					unitsNumber: 0,
					targetUnitsNumber: s.units,
					fromGrade: 0,
					toGrade: s.simulatedGrade,
					deltaGrade: s.simulatedGrade,
					sekemImpact: impact.sekemDelta,
					bagrutImpact: impact.bagrutDelta
				});
			} else if (!s.isCustomAdded && s.isActive && (s.simulatedGrade !== s.originalGrade || s.units !== s.originalUnits)) {
				const impact = calculateSubjectMarginalImpact(s);
				const unitsChanged = s.units !== s.originalUnits;
				changes.push({
					id: s.id,
					category: 'bagrut_core',
					name: s.name,
					type: unitsChanged
						? `שדרוג היקף מ-${s.originalUnits} ל-${s.units} יח״ל`
						: `שיפור ציון (${s.units} יח״ל)`,
					unitsLabel: unitsChanged ? `${s.originalUnits} ← ${s.units} יח״ל` : `${s.units} יח״ל`,
					unitsNumber: s.originalUnits,
					targetUnitsNumber: s.units,
					fromGrade: s.originalGrade,
					toGrade: s.simulatedGrade,
					deltaGrade: s.simulatedGrade - s.originalGrade,
					sekemImpact: impact.sekemDelta,
					bagrutImpact: impact.bagrutDelta
				});
			}
		});

		return changes;
	}, [
		simulatedPsych,
		userProfile,
		totalPsychSekemDelta,
		isMathActive,
		isMathUpgradedTo5,
		simulatedMathGrade,
		mathUpgradeImpact,
		simulatedList,
		currentSekem,
		calculateSekemForSubjectList
	]);

	// Estimated timeline & effort metrics based on customized levers
	const estimatedStudyWeeks = useMemo(() => {
		const totalExams = summaryChanges.length;
		if (totalExams === 0) return 0;
		if (totalExams === 1) {
			return summaryChanges[0].category === 'psychometric' ? 12 : 8;
		}
		if (totalExams <= 3) return 18;
		return 28;
	}, [summaryChanges]);

	const estimatedWeeklyHours = useMemo(() => {
		const totalExams = summaryChanges.length;
		if (totalExams === 0) return 0;
		if (totalExams === 1) return 12;
		if (totalExams <= 2) return 16;
		return 22;
	}, [summaryChanges]);

	// Save Custom Track Handler
	const handleSaveCustomTrack = async () => {
		setIsSavingCustomTrack(true);
		setSavedCustomTrackError(null);
		try {
			const totalExamsCount = summaryChanges.length;
			const estWeeks = estimatedStudyWeeks || 12;
			const estHours = estimatedWeeklyHours || 15;

			const recommendedSubjectImprovements = summaryChanges
				.filter((c) => c.category !== 'psychometric')
				.map((c) => ({
					subjectName: c.name,
					currentGrade: c.fromGrade,
					currentUnits: c.unitsNumber,
					targetGrade: c.toGrade,
					targetUnits: c.targetUnitsNumber,
					reason: c.type
				}));

			const customTrackPayload = {
				id: `track-custom-${Date.now()}`,
				title: activeTrack
					? `מסלול מותאם: ${activeTrack.title}`
					: `מסלול מותאם אישית (${totalExamsCount} בחינות)`,
				badge: isScreening ? 'עובר לשלב המיונים' : isAccepted ? 'עובר את הסף' : isMissingRequirement ? 'חסר תנאי סף' : 'מסלול מותאם',
				badgeColor: isAccepted ? 'emerald' : isMissingRequirement ? 'amber' : 'blue',
				targetSekem: currentSekem,
				targetPsychometric: simulatedPsych,
				targetBagrutAverage: simulatedSekemResult.bagrutAverage,
				currentPsychometric: userProfile.psychometricGeneral || 0,
				currentBagrutAverage: institutionResult.bagrutAverage || 100,
				strategyDescription: `מסלול שיפורים מותאם אישית שנבנה בסימולטור עבור ${analysis.target.program.fieldOfStudy} ב${analysis.target.institutionName}.`,
				estimatedWeeks: estWeeks,
				weeklyHours: estHours,
				feasibility: isAccepted ? 'high' : isMissingRequirement ? 'moderate' : 'challenging',
				feasibilityExplanation: isAccepted
					? `הסכם המשוקלל בסימולציה (${currentSekem.toFixed(isTechnion ? 2 : 1)}) עומד בסף הקבלה הנדרש (${threshold.toFixed(isTechnion ? 2 : 1)}).`
					: isMissingRequirement
					? `הסכם המשוקלל בסימולציה (${currentSekem.toFixed(isTechnion ? 2 : 1)}) עומד בסף, אבל חסר תנאי סף רשמי: ${missingTitles}.`
					: `הסכם המשוקלל בסימולציה (${currentSekem.toFixed(isTechnion ? 2 : 1)}) מתחת לסף (${threshold.toFixed(isTechnion ? 2 : 1)}), פער של ${Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נקודות.`,
				keyAdvantage: 'הותאם אישית על פי בחירת המקצועות והיעדים שלך בסימולטור',
				recommendedSubjectImprovements,
				milestones: [
					...(recommendedSubjectImprovements.length > 0
						? [
								{
									title: 'שלב 1: שדרוג מקצועות בגרות',
									detail: `שיפור ${recommendedSubjectImprovements.length} מקצועות להעלאת ממוצע הבגרות ל-${simulatedSekemResult.bagrutAverage.toFixed(1)}`,
									timing: 'מועד חורף / קיץ',
									type: 'bagrut_core'
								}
						  ]
						: []),
					...(simulatedPsych > (userProfile.psychometricGeneral || 0)
						? [
								{
									title: 'שלב 2: יעד פסיכומטרי',
									detail: `השגת ציון ${simulatedPsych} בבחינה הפסיכומטרית`,
									timing: 'מועד אביב',
									type: 'psychometric'
								}
						  ]
						: [])
				]
			};

			if (!user) {
				openAuthModal('register');
				return;
			}

			if (onSaveCustomTrack) {
				await onSaveCustomTrack(customTrackPayload);
			} else {
				const existingUserId = user.id;
				const res = await fetch('/api/tracks/save', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId: existingUserId,
						programId: analysis.target.program.id,
						track: customTrackPayload
					})
				});
				const contentType = res.headers.get('content-type') || '';
				if (!contentType.includes('application/json')) {
					throw new Error('התקבלה תגובה לא תקינה מהשרת');
				}
				const data = await res.json();
				if (!data.success) {
					throw new Error(data.error || 'שגיאה בעת שמירת המסלול במסד הנתונים');
				}
				if (typeof window !== 'undefined' && data.userId) {
					localStorage.setItem('kalis_user_id', data.userId);
					if (data.candidateNumber) {
						localStorage.setItem('kalis_candidate_number', data.candidateNumber);
					}
				}
			}

			setSavedCustomTrackSuccess(true);
		} catch (err: any) {
			console.error('Failed to save custom track:', err);
			setSavedCustomTrackError(err.message || 'אירעה שגיאה בעת שמירת המסלול');
		} finally {
			setIsSavingCustomTrack(false);
		}
	};

	// Change units of a simulated subject (e.g. 2 -> 5 or 4 -> 5 units)
	const handleUnitsChange = (id: string, newUnits: number) => {
		const updated = simulatedList.map((s) => {
			if (s.id === id) {
				return { ...s, units: newUnits, isActive: true };
			}
			return s;
		});
		setSimulatedList(updated);
	};

	// Add popular 5-unit elective
	const handleAddPopularElective = (name: string, units: number, defaultGrade: number) => {
		// The same subject already on the list (e.g. "היסטוריה (מוגבר)" for an existing history) is upgraded, never duplicated
		const existingIndex = simulatedList.findIndex((s) => isSameBagrutSubject(s.name, name));
		if (existingIndex >= 0) {
			const updated = [...simulatedList];
			updated[existingIndex] = {
				...updated[existingIndex],
				isActive: true,
				units,
				simulatedGrade: Math.max(updated[existingIndex].originalGrade, defaultGrade)
			};
			setSimulatedList(updated);
		} else {
			const newItem: SimulatedSubjectItem = {
				id: `custom-${Date.now()}-${name}`,
				name,
				units,
				originalUnits: units,
				originalGrade: 0,
				simulatedGrade: defaultGrade,
				isCustomAdded: true,
				isActive: true
			};
			setSimulatedList([...simulatedList, newItem]);
		}
	};

	// Add subject from modal catalog
	const handleSelectCatalogSubject = (option: BagrutSubjectOption) => {
		handleAddPopularElective(option.name, option.defaultUnits, 88);
		setIsSubjectModalOpen(false);
	};

	// Add existing subject to active simulation list (preserves originalGrade and originalUnits so score never drops on add)
	const handleAddExistingSubjectToActive = (subjectName: string) => {
		if (!subjectName) return;
		const updated = simulatedList.map((s) => {
			if (s.name === subjectName) {
				return { ...s, isActive: true, units: s.originalUnits, simulatedGrade: s.originalGrade };
			}
			return s;
		});
		setSimulatedList(updated);
		setSelectedExistingToAdd('');
	};

	// Update grade of an active simulated subject
	const handleGradeSliderChange = (id: string, newGrade: number) => {
		const updated = simulatedList.map((s) => {
			if (s.id === id) {
				return { ...s, simulatedGrade: newGrade, isActive: true };
			}
			return s;
		});
		setSimulatedList(updated);
	};

	// Remove or deactivate a simulated subject
	const handleRemoveSimulatedSubject = (id: string) => {
		const item = simulatedList.find((s) => s.id === id);
		if (!item) return;

		if (item.isCustomAdded) {
			setSimulatedList(simulatedList.filter((s) => s.id !== id));
		} else {
			setSimulatedList(
				simulatedList.map((s) =>
					s.id === id ? { ...s, isActive: false, units: s.originalUnits, simulatedGrade: s.originalGrade } : s
				)
			);
		}
	};

	// Active subjects currently displayed in the simulation cards (strictly isActive and not math)
	const activeDisplaySubjects = simulatedList.filter(
		(s) => s.isActive && !s.name.includes('מתמטיקה')
	);

	// Remaining existing subjects that can be added
	const inactiveExistingSubjects = simulatedList.filter(
		(s) => !s.isActive && !s.isCustomAdded && !s.name.includes('מתמטיקה')
	);

	// Preset Scenarios Handlers
	const handlePresetPsychOnly = () => {
		const multiplier =
			analysis.target.calculatorId === 'tau'
				? analysis.relevantSekemType === 'management'
					? 1.43
					: 1.92
				: isTechnion
				? 13.33
				: 2.0;

		const neededPsychDelta = Math.ceil(Math.abs(analysis.gap) * multiplier);
		const targetPsych = Math.min(800, initialPsych + neededPsychDelta);
		setSimulatedPsych(targetPsych);
	};

	const handlePresetBalanced = () => {
		const multiplier =
			analysis.target.calculatorId === 'tau'
				? analysis.relevantSekemType === 'management'
					? 1.43
					: 1.92
				: isTechnion
				? 13.33
				: 2.0;

		const halfDelta = Math.ceil(Math.abs(analysis.gap) * 0.5 * multiplier);
		const targetPsych = Math.min(realisticCeiling, initialPsych + halfDelta);
		setSimulatedPsych(targetPsych);

		// Boost first 2 weak subjects
		const updated = simulatedList.map((s, idx) => {
			if (s.originalGrade < 85 && !s.name.includes('מתמטיקה') && !s.name.includes('אנגלית') && idx < 4) {
				return { ...s, isActive: true, simulatedGrade: Math.min(94, s.originalGrade + 18) };
			}
			return s;
		});
		setSimulatedList(updated);
	};

	const handlePresetReset = () => {
		if (initialTrackToEdit) {
			handleResetToOriginalTrack();
		} else {
			setSimulatedPsych(initialPsych);
			setIsMathActive(false);
			setIsMathUpgradedTo5(userProfile.mathUnits === 5);
			setSimulatedMathGrade(userProfile.mathGrade || 80);
			setSimulatedList(
				(userProfile.bagrutSubjects || []).map((s, idx) => ({
					id: `orig-${idx}-${s.name}`,
					name: s.name,
					units: s.units,
					originalUnits: s.units,
					originalGrade: s.grade,
					simulatedGrade: s.grade,
					isCustomAdded: false,
					isActive: false
				}))
			);
			setSavedCustomTrackSuccess(false);
		}
	};

	return (
		<div className="bg-white border border-line rounded-3xl p-3 sm:p-8 shadow-xs space-y-8 dir-rtl text-right relative overflow-hidden">
			{/* Section Header */}
			<div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
				<div className="space-y-1">
					<h3 className="text-xl sm:text-2xl font-bold text-ink">
						בדוק והוסף בגרויות — וצפה במידת ההשפעה המדויקת על הסכם
					</h3>
					<p className="text-xs sm:text-sm text-ink-2">
						הוסף מקצועות בגרות חדשים או שפר מקצועות קיימים, וקבל את התרומה המדויקת של כל מקצוע ישירות לסכם הקבלה.
					</p>
				</div>

				{/* Actions & Quick Preset Buttons */}
				<div className="flex items-center gap-2 flex-wrap shrink-0">
					{onCancelEdit && (
						<button
							type="button"
							onClick={onCancelEdit}
							className="px-3.5 py-2 bg-paper hover:bg-line text-ink text-xs font-bold rounded-xl border border-line-strong transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.99]"
						>
							<ArrowRight className="h-4 w-4 shrink-0" />
							<span>חזור למסלולים</span>
						</button>
					)}
					<button
						type="button"
						onClick={handlePresetPsychOnly}
						className="px-3 py-2 bg-paper hover:bg-line text-ink text-xs font-bold rounded-xl border border-line transition flex items-center gap-1.5 cursor-pointer"
						title="חשב פסיכומטרי בלבד לסגירת הפער"
					>
						<Zap className="h-3.5 w-3.5 text-warning" />
						<span>פסיכומטרי בלבד</span>
					</button>

					<button
						type="button"
						onClick={handlePresetBalanced}
						className="px-3 py-2 bg-paper hover:bg-line text-ink text-xs font-bold rounded-xl border border-line transition flex items-center gap-1.5 cursor-pointer"
						title="איזון בין פסיכומטרי לבגרויות"
					>
						<Award className="h-3.5 w-3.5 text-success" />
						<span>איזון 50/50</span>
					</button>

					<button
						type="button"
						onClick={handlePresetReset}
						className="px-3 py-2 bg-paper hover:bg-line text-ink-2 hover:text-ink text-xs font-bold rounded-xl border border-line transition flex items-center gap-1 cursor-pointer"
						title="איפוס לציונים המקוריים"
					>
						<RotateCcw className="h-3.5 w-3.5" />
						<span>איפוס</span>
					</button>
				</div>
			</div>

			{/* ========================================================================= */}
			{/* 2-COLUMN SIMULATION WORKSPACE */}
			{/* In RTL (dir="rtl"): */}
			{/* - First grid child (lg:col-span-7) renders on the RIGHT: Psychometric + Bagruts */}
			{/* - Second grid child (lg:col-span-5) renders on the LEFT: University Sekem & Progress */}
			{/* ========================================================================= */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* ----------------------------------------------------------------- */}
				{/* RIGHT COLUMN (lg:col-span-7): סרגל פסיכומטרי + בגרויות לשיפור */}
				{/* ----------------------------------------------------------------- */}
				<div className="lg:col-span-7 space-y-6">
					{/* 1. PSYCHOMETRIC SLIDER CARD */}
					<div className="bg-white border border-line rounded-3xl p-3.5 sm:p-6 space-y-5 shadow-2xs">
						<div className="flex items-center justify-between border-b border-line pb-3">
							<div className="flex items-center gap-2.5">
								<div className="p-2 rounded-xl bg-accent-soft text-accent border border-accent/20 shadow-2xs">
									<Brain className="h-4 w-4 text-accent" />
								</div>
								<div>
									<h4 className="text-sm font-bold text-ink">סרגל הפסיכומטרי</h4>
									<span className="text-[11px] text-ink-2">
										{hasOriginalPsych ? `ציון נוכחי: ${initialPsych}` : 'סימולציית בחינה ראשונה'}
									</span>
								</div>
							</div>

							<div className="text-left dir-ltr">
								<span className="text-2xl font-bold text-ink">{simulatedPsych}</span>
								{hasOriginalPsych && simulatedPsych > initialPsych && (
									<span className="text-xs text-success font-bold ml-1.5">
										(+{simulatedPsych - initialPsych})
									</span>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<input
								type="range"
								min={Math.max(450, initialPsych - 40)}
								max={800}
								step={5}
								value={simulatedPsych}
								onChange={(e) => setSimulatedPsych(Number(e.target.value))}
								className="slider w-full"
								style={sliderFill(simulatedPsych, Math.max(450, initialPsych - 40), 800)}
							/>
							<div className="flex items-center justify-between text-[11px] text-ink-3 font-medium">
								<span>{hasOriginalPsych ? `קיים: ${initialPsych}` : 'התחלה: 450'}</span>
								<span className="text-accent font-bold">תקרה ריאלית: {realisticCeiling}</span>
								<span>800</span>
							</div>
						</div>

						{simulatedPsych > realisticCeiling && (
							<div className="p-3 rounded-2xl bg-warning-soft border border-warning/30 text-[11px] text-warning font-medium flex items-start gap-2">
								<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
								<span>
									ציון של {simulatedPsych} דורש זינוק חריג יחסית לממוצע הבגרות. מומלץ לשלב שיפור בגרויות.
								</span>
							</div>
						)}

						{totalPsychSekemDelta > 0 && (
							<div className="flex items-center justify-between text-xs bg-accent-soft border border-accent/20 rounded-xl px-3 py-1.5 text-accent font-bold">
								<span>השפעת השינוי בפסיכומטרי על הסכם:</span>
								<span className="font-bold dir-ltr">+{totalPsychSekemDelta} נק׳ סכם</span>
							</div>
						)}
					</div>

					{/* 2. BAGRUT LAB: "הבגרויות שאני רוצה לשפר" */}
					<div className="bg-white border border-line rounded-3xl p-3.5 sm:p-6 space-y-5 shadow-2xs">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
							<div className="flex items-center gap-2.5">
								<div className="p-2 rounded-xl bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB] shadow-2xs">
									<BookOpen className="h-4 w-4 text-[#453D78]" />
								</div>
								<div>
									<h4 className="text-sm sm:text-base font-bold text-ink">
										הבגרויות שאני רוצה לשפר
									</h4>
									<span className="text-xs text-ink-2">
										מציג רק מקצועות שבחרת לערוך או שהוצעו במסלול
									</span>
								</div>
							</div>

							{/* Primary "הוסף מקצוע" CTA Button */}
							<button
								type="button"
								onClick={() => setIsAddSubjectModalOpen(true)}
								className="px-4 py-2.5 bg-ink hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
							>
								<Plus className="h-4 w-4" />
								<span>הוסף מקצוע</span>
							</button>
						</div>

						{/* Best Bagrut Average KPI bar */}
						<div className="flex items-center justify-between flex-wrap gap-2 bg-paper border border-line px-4 py-2.5 rounded-2xl text-xs">
							<div className="flex items-center gap-2">
								<span className="text-ink-2 font-medium">ממוצע בגרות מיטבי:</span>
								<span className="font-bold text-ink dir-ltr text-sm">
									{simulatedSekemResult.bagrutAverage.toFixed(2)}
								</span>
								{bagrutDeltaVal > 0 && (
									<span className="text-xs text-success font-bold dir-ltr">
										(+{bagrutDeltaVal.toFixed(2)})
									</span>
								)}
							</div>
							{totalBagrutSekemDelta > 0 && (
								<span className="px-2.5 py-0.5 rounded-lg bg-success-soft text-success border border-success/25 font-bold dir-ltr text-[11px] flex items-center gap-1">
									<Sparkles className="h-3 w-3 text-success" />
									<span>+{totalBagrutSekemDelta} נק׳ סכם מכל הבגרויות</span>
								</span>
							)}
						</div>

						{/* How the simulated score is computed, and what the edits changed (collapsed by default) */}
						{simulatedSekemResult.subjectBreakdown && (
							<SekemBreakdown
								title="הרכב הסכם בסימולציה ומה השתנה"
								current={{
									breakdown: simulatedSekemResult.subjectBreakdown,
									bagrutAverage: simulatedSekemResult.bagrutAverage,
									sekem: simulatedSekemResult.sekem,
									psychometric: simulatedPsych
								}}
								baseline={
									baselineResult.subjectBreakdown
										? {
												breakdown: baselineResult.subjectBreakdown,
												bagrutAverage: baselineResult.bagrutAverage,
												sekem: baselineResult.sekem,
												psychometric: initialPsych
										  }
										: undefined
								}
								sekemLabel={analysis.relevantSekemLabel}
								bagrutCap={simulatedSekemResult.bagrutCap}
								psychometricOnly={analysis.relevantSekemType === 'psychometric'}
							/>
						)}

						{/* Active Subjects List */}
						<div className="space-y-2 sm:space-y-2.5">
							{/* Math Card if Active */}
							{isMathActive && (
								<div className="bg-paper border border-line hover:border-line-strong rounded-xl p-3 sm:p-3.5 space-y-2 relative transition shadow-2xs">
									{/* Row 1: Title, Badge, Units Toggle & Trash */}
									<div className="flex items-center justify-between gap-2 flex-wrap">
										<div className="flex items-center gap-1.5 flex-wrap">
											<span className="text-xs sm:text-sm font-bold text-ink">
												מתמטיקה
											</span>
											<span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-accent border border-accent/20">
												{isMathUpgradedTo5 ? '5 יח״ל (+35 בונוס)' : `${userProfile.mathUnits || 4} יח״ל`}
											</span>
										</div>

										<div className="flex items-center gap-1.5">
											{/* Compact Units Toggle */}
											<div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-line">
												<button
													type="button"
													onClick={() => setIsMathUpgradedTo5(false)}
													className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
														!isMathUpgradedTo5
															? 'bg-ink text-white shadow-2xs font-bold'
															: 'text-ink-2 hover:text-ink'
													}`}
												>
													{userProfile.mathUnits || 4} יח״ל
												</button>
												<button
													type="button"
													onClick={() => setIsMathUpgradedTo5(true)}
													className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
														isMathUpgradedTo5
															? 'bg-ink text-white shadow-2xs font-bold'
															: 'text-ink-2 hover:text-ink'
													}`}
												>
													5 יח״ל (+35)
												</button>
											</div>

											<button
												type="button"
												onClick={() => setIsMathActive(false)}
												className="text-ink-3 hover:text-danger transition p-1 rounded-md hover:bg-white cursor-pointer"
												title="הסר מתמטיקה מרשימת השיפורים"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</div>
									</div>

									{/* Row 2: Grade status on right, Marginal Impact on left */}
									<div className="flex items-center justify-between text-xs pt-0.5">
										<div className="flex items-center gap-1.5 text-[11px] text-ink-2">
											{isMathUpgradedTo5 && (userProfile.mathUnits || 4) !== 5 ? (
												<span>
													ציון יעד:{' '}
													<strong className="text-ink font-bold">{simulatedMathGrade}</strong>
												</span>
											) : (
												<span className="inline-flex items-center gap-1">
													<span>קיים: {userProfile.mathGrade || 80}</span>
													<span className="text-ink-3">←</span>
													<span>יעד:</span>
													<div dir="ltr" className="inline-flex items-center font-bold text-ink dir-ltr text-left">
														<span>{simulatedMathGrade}</span>
														{simulatedMathGrade > (userProfile.mathGrade || 80) && (
															<span className="text-[10px] text-success font-bold ml-1">
																(+{simulatedMathGrade - (userProfile.mathGrade || 80)})
															</span>
														)}
													</div>
												</span>
											)}
										</div>

										<div className="text-[11px]">
											{mathUpgradeImpact > 0 ? (
												<span className="px-2 py-0.5 rounded-md bg-success-soft text-success border border-success/25 font-bold text-[10px] flex items-center gap-1 dir-ltr">
													<Sparkles className="h-2.5 w-2.5 text-success" />
													<span>+{mathUpgradeImpact} נק׳ סכם</span>
												</span>
											) : (
												<span className="text-ink-3 text-[10px] bg-white px-1.5 py-0.5 rounded border border-line">
													ללא שינוי בסכם
												</span>
											)}
										</div>
									</div>

									{/* Row 3: Slim Slider */}
									<input
										type="range"
										min={SUBJECT_GRADE_MIN}
										max={100}
										step={1}
										value={simulatedMathGrade}
										onChange={(e) => setSimulatedMathGrade(Number(e.target.value))}
										className="slider w-full"
										style={sliderFill(simulatedMathGrade, SUBJECT_GRADE_MIN, 100)}
									/>
								</div>
							)}

							{/* Other Active Display Subjects */}
							{activeDisplaySubjects.map((item) => {
								const impact = calculateSubjectMarginalImpact(item);
								return (
									<div
										key={item.id}
										className="bg-paper border border-line hover:border-line-strong rounded-xl p-3 sm:p-3.5 space-y-2 relative transition shadow-2xs"
									>
										{/* Row 1: Name, Tag, Units Selector & Trash */}
										<div className="flex items-center justify-between gap-2 flex-wrap">
											<div className="flex items-center gap-1.5 flex-wrap">
												<span className="text-xs sm:text-sm font-bold text-ink">
													{item.name}
												</span>
												{item.isCustomAdded ? (
													<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent-soft text-accent border border-accent/20">
														חדש ({item.units} יח״ל)
													</span>
												) : item.units !== item.originalUnits ? (
													<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB]">
														שודרג ל-{item.units} יח״ל
													</span>
												) : (
													<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-ink-2 border border-line">
														{item.units} יח״ל
													</span>
												)}
											</div>

											<div className="flex items-center gap-1.5">
												{/* Units Selector */}
												<div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-line">
													{[2, 3, 4, 5].map((u) => {
														const isSelected = item.units === u;
														return (
															<button
																key={u}
																type="button"
																onClick={() => handleUnitsChange(item.id, u)}
																className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
																	isSelected
																		? 'bg-ink text-white shadow-2xs font-bold'
																		: 'text-ink-2 hover:text-ink'
																}`}
															>
																{u} יח״ל
															</button>
														);
													})}
												</div>

												<button
													type="button"
													onClick={() => handleRemoveSimulatedSubject(item.id)}
													className="text-ink-3 hover:text-danger transition p-1 rounded-md hover:bg-white cursor-pointer"
													title="הסר מקצוע זה מרשימת השיפורים"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</div>
										</div>

										{/* Row 2: Grade status on right, Marginal Impact on left */}
										<div className="flex items-center justify-between text-xs pt-0.5">
											<div className="flex items-center gap-1.5 text-[11px] text-ink-2">
												{item.isCustomAdded || item.units !== item.originalUnits ? (
													<span>
														ציון יעד:{' '}
														<strong className="text-ink font-bold">{item.simulatedGrade}</strong>
													</span>
												) : (
													<span className="inline-flex items-center gap-1">
														<span>קיים: {item.originalGrade}</span>
														<span className="text-ink-3">←</span>
														<span>יעד:</span>
														<span dir="ltr" className="inline-flex items-center font-bold text-ink dir-ltr text-left">
															{item.simulatedGrade}
															{item.simulatedGrade > item.originalGrade && (
																<span className="text-[10px] text-success font-bold ml-1">
																	(+{item.simulatedGrade - item.originalGrade})
																</span>
															)}
														</span>
													</span>
												)}
											</div>

											<div className="text-[11px]">
												{impact.sekemDelta > 0 ? (
													<div className="flex items-center gap-1 dir-ltr">
														<span className="px-2 py-0.5 rounded-md bg-success-soft text-success border border-success/25 font-bold text-[10px] flex items-center gap-1">
															<Sparkles className="h-2.5 w-2.5 text-success" />
															<span>+{impact.sekemDelta} נק׳ סכם</span>
														</span>
														{impact.bagrutDelta > 0 && (
															<span className="text-[10px] text-ink-2 font-medium hidden sm:inline">
																(+{impact.bagrutDelta} בגרות)
															</span>
														)}
													</div>
												) : impact.bagrutDelta > 0 ? (
													<div className="flex items-center gap-1 dir-ltr">
														<span className="px-2 py-0.5 rounded-md bg-paper text-success border border-line font-bold text-[10px]">
															+{impact.bagrutDelta} בגרות
														</span>
													</div>
												) : (simulatedSekemResult.droppedSubjects || []).includes(item.name) ? (
													<span className="text-ink-3 text-[10px] bg-white px-1.5 py-0.5 rounded border border-line">
														הושמט בממוצע מיטבי
													</span>
												) : (
													<span className="text-ink-3 text-[10px] bg-white px-1.5 py-0.5 rounded border border-line">
														ללא שינוי בסכם
													</span>
												)}
											</div>
										</div>

										{/* Row 3: Slim Slider */}
										<input
											type="range"
											min={SUBJECT_GRADE_MIN}
											max={100}
											step={1}
											value={item.simulatedGrade}
											onChange={(e) =>
												handleGradeSliderChange(item.id, Number(e.target.value))
											}
											className="slider w-full"
											style={sliderFill(item.simulatedGrade, SUBJECT_GRADE_MIN, 100)}
										/>
									</div>
								);
							})}

							{/* Empty State when no bagruts are active */}
							{!isMathActive && activeDisplaySubjects.length === 0 && (
								<div className="text-center py-10 px-6 bg-paper rounded-3xl border border-dashed border-line-strong space-y-3">
									<div className="p-3 bg-white border border-line rounded-2xl w-fit mx-auto text-ink-2 shadow-2xs">
										<BookOpen className="h-6 w-6" />
									</div>
									<div className="space-y-1">
										<h5 className="text-sm font-bold text-ink">
											לא נבחרו בגרויות לשיפור
										</h5>
										<p className="text-xs text-ink-2 max-w-md mx-auto leading-relaxed">
											כרגע כל מקצועות הבגרות מחושבים לפי הציונים המקוריים שלך. לחץ על ״הוסף מקצוע״ כדי לבחור מקצוע לשיפור או להוסיף מקצוע מוגבר חדש.
										</p>
									</div>
									<button
										type="button"
										onClick={() => setIsAddSubjectModalOpen(true)}
										className="px-5 py-2.5 bg-ink hover:bg-black text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2 shadow-xs cursor-pointer"
									>
										<Plus className="h-4 w-4" />
										<span>הוסף מקצוע לשיפור</span>
									</button>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* ----------------------------------------------------------------- */}
				{/* LEFT COLUMN (lg:col-span-5): סכם האוניברסיטה הבלעדי + מד התקדמות לסף */}
				{/* ----------------------------------------------------------------- */}
				<div className="lg:col-span-5 lg:sticky lg:top-6 self-start space-y-4">
					<div className="bg-white border border-line rounded-3xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(40,30,20,0.04),0_16px_40px_-20px_rgba(40,30,20,0.16)] space-y-6">
						{/* University Header with Logo */}
						<div className="flex items-start justify-between gap-3 border-b border-line pb-4">
							<div className="flex items-center gap-3">
								<UniversityLogo institution={analysis.target.calculatorId} size="lg" />
								<div>
									<h4 className="text-base font-bold text-ink">
										{analysis.target.institutionName}
									</h4>
									<p className="text-xs font-bold text-accent line-clamp-1">
										{analysis.target.program.fieldOfStudy}
									</p>
									<span className="text-[11px] text-ink-3 block mt-0.5">
										{analysis.relevantSekemType === 'engineering' ? 'סכם הנדסי/כמותי' : 'סכם כללי/רב-תחומי'}
									</span>
								</div>
							</div>

							{/* Admission Status Pill Badge */}
							<div
								key={isAccepted ? 'accepted' : isMissingRequirement ? 'missing' : 'below'}
								className={`animate-pop px-3 py-1.5 rounded-full border text-xs font-bold shrink-0 flex items-center gap-1.5 ${
									isAccepted
										? 'bg-success-soft text-success border-success/25'
										: isMissingRequirement
										? 'bg-warning-soft text-warning border-warning/30'
										: 'bg-danger-soft text-danger border-danger/25'
								}`}
							>
								{isAccepted ? (
									<>
										<CheckCircle2 className="h-4 w-4 text-success" />
										<span>{isScreening ? 'שלב המיונים' : 'התקבלת!'}</span>
									</>
								) : isMissingRequirement ? (
									<>
										<AlertCircle className="h-4 w-4 text-warning" />
										<span>חסר תנאי סף</span>
									</>
								) : (
									<>
										<AlertCircle className="h-4 w-4 text-danger" />
										<span>מתחת לסף</span>
									</>
								)}
							</div>
						</div>

						{/* Live Sekem Score Box */}
						<div className={`p-6 rounded-2xl text-center space-y-2 transition-colors duration-700 ${isAccepted ? 'bg-success-soft' : 'bg-paper'}`}>
							<span className="text-xs font-medium text-ink-2 block">
								הסכם בסימולציה
							</span>
							<div className="num text-5xl sm:text-6xl font-bold text-ink dir-ltr">
								{displaySekem.toFixed(isTechnion ? 2 : 1)}
							</div>

							<div className="flex items-center justify-center gap-4 text-xs font-bold pt-1">
								<span className="text-ink-3">
									בסיס: <strong className="text-ink-2 font-bold">{analysis.userSekem.toFixed(isTechnion ? 2 : 1)}</strong>
								</span>
								<span className="text-ink-3">•</span>
								<span className="text-accent">
									סף נדרש: <strong className="text-accent font-bold">{threshold.toFixed(isTechnion ? 2 : 1)}</strong>
								</span>
							</div>

							{/* Gap Notice */}
							<div className="pt-2">
								{isAccepted ? (
									<span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-success-soft text-success text-xs font-bold border border-success/25">
										<span>{alternativeRouteNote ?? `+${rawGap.toFixed(isTechnion ? 2 : 1)} נקודות מעל הסף הנדרש`}</span>
									</span>
								) : isMissingRequirement ? (
									<span className="inline-flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg bg-warning-soft text-warning text-xs font-bold border border-warning/30">
										<span>הסכם עובר את הסף ב-{rawGap.toFixed(isTechnion ? 2 : 1)} נקודות — חסר תנאי סף רשמי: {missingTitles}</span>
										{missingConditions.map((m) => (
											<span key={m.title} className="font-medium text-[11px] text-[#6B4A10]">
												{m.detail}
											</span>
										))}
									</span>
								) : (
									<span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-danger-soft text-danger text-xs font-bold border border-danger/25">
										<span>פער של {Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נקודות לסף הקבלה</span>
									</span>
								)}
							</div>
						</div>

						{/* Progress Bar Gauge ("כמה אני מתקרב לסף הנדרש עבור התואר") */}
						<div className="space-y-2.5">
							<div className="flex items-center justify-between text-xs font-bold text-ink-2">
								<span>{simulatedAnalysis?.admissionRoutes?.screening ? 'מד התקדמות לסף הזימון למיונים:' : 'מד התקדמות לסף הקבלה:'}</span>
								<span className="text-ink font-bold text-sm dir-ltr tabular-nums">{Math.round(displayProgress)}%</span>
							</div>

							<div className="w-full h-2 bg-line rounded-full overflow-hidden">
								<div
									className={`h-full rounded-full transition-colors duration-500 ${
										isAccepted
											? 'bg-success'
											: isMissingRequirement
											? 'bg-warning'
											: 'bg-ink'
									}`}
									style={{ width: `${Math.max(3, displayProgress)}%` }}
								/>
							</div>

							<div className="flex items-center justify-between text-[11px] text-ink-3 font-medium">
								<span>ציון בסיס ({analysis.userSekem.toFixed(isTechnion ? 2 : 1)})</span>
								<span>{simulatedAnalysis?.admissionRoutes?.screening ? 'סף זימון' : 'יעד קבלה'} ({threshold.toFixed(isTechnion ? 2 : 1)})</span>
							</div>
						</div>

						{/* Sources of improvement */}
						{(totalPsychSekemDelta > 0 || totalBagrutSekemDelta > 0) && (
							<div className="pt-3 border-t border-line space-y-2">
								<span className="text-[11px] font-bold text-ink-2 block">
									תרומת השינויים בסימולציה לסכם:
								</span>
								<div className="flex items-center gap-2 flex-wrap text-xs">
									{totalPsychSekemDelta > 0 && (
										<div className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-accent-soft text-accent border border-accent/20 text-xs font-bold flex items-center justify-between">
											<span className="flex items-center gap-1.5">
												<Brain className="h-3.5 w-3.5 text-accent" />
												<span>פסיכומטרי</span>
											</span>
											<span className="font-bold dir-ltr">+{totalPsychSekemDelta}</span>
										</div>
									)}
									{totalBagrutSekemDelta > 0 && (
										<div className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB] text-xs font-bold flex items-center justify-between">
											<span className="flex items-center gap-1.5">
												<BookOpen className="h-3.5 w-3.5 text-[#453D78]" />
												<span>בגרויות</span>
											</span>
											<span className="font-bold dir-ltr">+{totalBagrutSekemDelta}</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Collapsible Accordion for Other 8 Universities */}
						<div className="pt-3 border-t border-line">
							<button
								type="button"
								onClick={() => setShowAllUniversities(!showAllUniversities)}
								className="w-full flex items-center justify-between text-xs font-bold text-ink-2 hover:text-ink py-1 transition cursor-pointer"
							>
								<span className="flex items-center gap-1.5">
									<TrendingUp className="h-3.5 w-3.5 text-accent" />
									<span>בדוק התאמה גם ליתר האוניברסיטאות</span>
								</span>
								{showAllUniversities ? (
									<ChevronUp className="h-4 w-4" />
								) : (
									<ChevronDown className="h-4 w-4" />
								)}
							</button>

							{showAllUniversities && (
								<div className="pt-3 animate-in fade-in duration-200">
									<MultiUniversityAdmissionGrid
										selectedInstitutionId={analysis.target.calculatorId}
										institutions={simulatedSekemResult.allInstitutions.map((inst): InstitutionSimulatedState => {
											const baseInst = baselineAllInstitutions.find(
												(b) => b.institutionId === inst.institutionId
											);
											// The same score type as the target program (falls back to the general score where an
											// institution has no such score), so the target row equals the main simulated sekem.
											const sekemType = analysis.relevantSekemType;
											const currentScore = selectProgramSekem(inst, sekemType, inst.institutionId);
											const baseScore = baseInst ? selectProgramSekem(baseInst, sekemType, baseInst.institutionId) : 0;
											const isEng = sekemType === 'engineering' || sekemType === 'quantitative' || sekemType === 'technion';
											return {
												institutionId: inst.institutionId,
												institutionName: inst.institutionName,
												logoText: inst.logoText,
												badgeColor: inst.badgeColor,
												currentScore,
												baseScore,
												delta: Math.round((currentScore - baseScore) * 10) / 10,
												bagrutAverage: inst.bagrutAverage,
												bagrutDelta: Math.round((inst.bagrutAverage - (baseInst?.bagrutAverage || 0)) * 100) / 100,
												isTarget: inst.institutionId === analysis.target.calculatorId,
												isTechnion: inst.institutionId === 'technion',
												isDirectBagrutEligible: inst.directBagrutEligible,
												sekemTypeLabel: sekemType === 'psychometric' ? 'פסיכומטרי' : sekemType === 'management' ? 'סכם ניהול' : isEng ? 'סכם הנדסי/כמותי' : 'סכם כללי/רב-תחומי',
											};
										})}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* ========================================================================= */}
			{/* SUMMARY OF CHANGES VS. BASELINE ("סיכום השינויים אל מול המצב הקיים") */}
			{/* ========================================================================= */}
			<div className="bg-paper border border-line rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<div className="p-2 rounded-xl bg-white text-accent border border-line shadow-2xs">
								<TrendingUp className="h-5 w-5" />
							</div>
							<h4 className="text-lg sm:text-xl font-bold text-ink">
								סיכום השינויים אל מול המצב הקיים
							</h4>
						</div>
						<p className="text-xs text-ink-2">
							השוואה ישירה בין נתוני הבסיס שלך לבין התרחיש המותאם שנבנה בסימולטור
						</p>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<span className="px-3 py-1.5 rounded-xl bg-white border border-line text-xs font-bold text-ink shadow-2xs">
							סה״כ {summaryChanges.length} שינויים מוצעים
						</span>
					</div>
				</div>

				{/* 4 Comparative KPI Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
					{/* 1. Psychometric */}
					<div className="bg-white p-4 rounded-2xl border border-line space-y-2 shadow-2xs">
						<div className="flex items-center justify-between text-xs text-ink-2 font-bold">
							<span className="flex items-center gap-1.5">
								<Brain className="h-3.5 w-3.5 text-accent" />
								<span>ציון פסיכומטרי</span>
							</span>
							{totalPsychSekemDelta > 0 && (
								<span className="text-[10px] font-bold text-success bg-success-soft px-1.5 py-0.5 rounded border border-success/25">
									+{totalPsychSekemDelta} נק׳ סכם
								</span>
							)}
						</div>
						<div className="flex items-baseline justify-between gap-2">
							<div className="text-xl font-bold text-ink dir-ltr">
								{simulatedPsych}
							</div>
							<div dir="ltr" className="text-xs font-bold text-ink-2 dir-ltr">
								{hasOriginalPsych ? (
									<span>
										{userProfile.psychometricGeneral} → {simulatedPsych}
										{simulatedPsych > (userProfile.psychometricGeneral || 0) && (
											<span className="text-success ml-1">
												(+{simulatedPsych - (userProfile.psychometricGeneral || 0)})
											</span>
										)}
									</span>
								) : (
									<span className="text-ink-3">בחינה ראשונה</span>
								)}
							</div>
						</div>
						<div className="text-[11px] text-ink-3">
							{simulatedPsych === (userProfile.psychometricGeneral || 0)
								? 'ללא שינוי מהציון הקיים'
								: `עלייה של ${simulatedPsych - (userProfile.psychometricGeneral || 0)} נקודות`}
						</div>
					</div>

					{/* 2. Bagrut Average */}
					<div className="bg-white p-4 rounded-2xl border border-line space-y-2 shadow-2xs">
						<div className="flex items-center justify-between text-xs text-ink-2 font-bold">
							<span className="flex items-center gap-1.5">
								<BookOpen className="h-3.5 w-3.5 text-accent" />
								<span>ממוצע בגרות משוער</span>
							</span>
							{bagrutDeltaVal > 0 && (
								<span className="text-[10px] font-bold text-success bg-success-soft px-1.5 py-0.5 rounded border border-success/25">
									+{bagrutDeltaVal.toFixed(2)} בממוצע
								</span>
							)}
						</div>
						<div className="flex items-baseline justify-between gap-2">
							<div className="text-xl font-bold text-ink dir-ltr">
								{simulatedSekemResult.bagrutAverage.toFixed(2)}
							</div>
							<div dir="ltr" className="text-xs font-bold text-ink-2 dir-ltr">
								<span>
									{(institutionResult.bagrutAverage || 100).toFixed(2)} → {simulatedSekemResult.bagrutAverage.toFixed(2)}
								</span>
							</div>
						</div>
						<div className="text-[11px] text-ink-3">
							{bagrutDeltaVal > 0
								? `תוספת של ${bagrutDeltaVal.toFixed(2)} לממוצע הבגרות`
								: 'ללא שינוי בממוצע הבגרות'}
						</div>
					</div>

					{/* 3. Sekem vs. Threshold */}
					<div className="bg-white p-4 rounded-2xl border border-line space-y-2 shadow-2xs">
						<div className="flex items-center justify-between text-xs text-ink-2 font-bold">
							<span className="flex items-center gap-1.5">
								<Sparkles className="h-3.5 w-3.5 text-accent" />
								<span>ציון סכם מול סף</span>
							</span>
							<span className="text-[10px] font-bold text-ink-2 bg-paper px-1.5 py-0.5 rounded border border-line">
								סף: {threshold.toFixed(isTechnion ? 2 : 1)}
							</span>
						</div>
						<div className="flex items-baseline justify-between gap-2">
							<div className="text-xl font-bold text-ink dir-ltr">
								{currentSekem.toFixed(isTechnion ? 2 : 1)}
							</div>
							<div dir="ltr" className="text-xs font-bold text-ink-2 dir-ltr">
								<span>
									{analysis.userSekem.toFixed(isTechnion ? 2 : 1)} → {currentSekem.toFixed(isTechnion ? 2 : 1)}
									{currentSekem > analysis.userSekem && (
										<span className="text-success ml-1">
											(+{(currentSekem - analysis.userSekem).toFixed(isTechnion ? 2 : 1)})
										</span>
									)}
								</span>
							</div>
						</div>
						<div className="text-[11px] text-ink-3">
							{currentSekem >= threshold
								? `עובר את הסף ב-${rawGap.toFixed(isTechnion ? 2 : 1)} נקודות`
								: `נותרו ${Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נקודות לסף`}
						</div>
					</div>

					{/* 4. Admission Status */}
					<div
						className={`p-4 rounded-2xl border space-y-2 shadow-2xs ${
							isAccepted
								? 'bg-success-soft border-success/25 text-success'
								: isMissingRequirement
								? 'bg-warning-soft border-warning/30 text-warning'
								: 'bg-danger-soft border-danger/25 text-danger'
						}`}
					>
						<div className="flex items-center justify-between text-xs font-bold">
							<span className="flex items-center gap-1.5">
								{isAccepted ? (
									<CheckCircle2 className="h-4 w-4 text-success" />
								) : (
									<AlertCircle className="h-4 w-4" />
								)}
								<span>סטטוס קבלה לתואר</span>
							</span>
						</div>
						<div className="text-base sm:text-lg font-bold leading-tight">
							{isScreening ? 'עובר/ת לשלב המיונים' : isAccepted ? 'עובר/ת את הסף' : isMissingRequirement ? 'עומד בסכם — חסר תנאי סף ⚠️' : 'מתחת לסף הנדרש'}
						</div>
						<div className="text-[11px] font-medium opacity-90">
							{isAccepted
								? alternativeRouteNote ?? 'עומד בכל תנאי הסף הנדרשים לרישום'
								: isMissingRequirement
								? `חסר: ${missingTitles}`
								: `נדרש שיפור נוסף של ${Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נק׳`}
						</div>
					</div>
				</div>

				{/* Detailed List of Changed Levers */}
				<div className="space-y-3">
					<h5 className="text-xs font-bold text-ink uppercase tracking-wide">
						פירוט כלל המקצועות והבחינות שהותאמו בתרחיש ({summaryChanges.length}):
					</h5>

					{summaryChanges.length === 0 ? (
						<div className="p-5 rounded-2xl bg-white border border-line text-center text-xs text-ink-2">
							טרם בוצעו שינויים בסימולטור. הזז את הסליידרים או הוסף מקצועות למעלה כדי להתאים את המסלול.
						</div>
					) : (
						<div className="space-y-2">
							{summaryChanges.map((change) => (
								<div
									key={change.id}
									className="bg-white p-3.5 sm:p-4 rounded-2xl border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-line-strong transition"
								>
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-xl bg-paper text-ink border border-line shrink-0">
											{change.category === 'psychometric' ? (
												<Brain className="h-4 w-4 text-accent" />
											) : change.category === 'math' ? (
												<Award className="h-4 w-4 text-[#453D78]" />
											) : (
												<BookOpen className="h-4 w-4 text-success" />
											)}
										</div>
										<div>
											<div className="flex items-center gap-2 flex-wrap">
												<span className="font-bold text-xs sm:text-sm text-ink">
													{change.name}
												</span>
												<span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-paper text-ink-2 border border-line">
													{change.type}
												</span>
												<span dir="ltr" className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-paper text-ink border border-line dir-ltr inline-flex items-center gap-1">
													{change.unitsNumber !== change.targetUnitsNumber ? (
														<>
															<span>{change.unitsNumber}</span>
															<span>→</span>
															<span>{change.targetUnitsNumber}</span>
															<span>יח״ל</span>
														</>
													) : (
														<span>{change.unitsLabel}</span>
													)}
												</span>
											</div>
											<div className="text-[11px] text-ink-3 mt-0.5">
												{change.category === 'bagrut_elective' && change.fromGrade === 0
													? `מקצוע הגברה חדש שנלמד מאפס לציון ${change.toGrade}`
													: change.unitsNumber !== change.targetUnitsNumber
														? `הרחבת היקף לימוד מ-${change.unitsNumber} ל-${change.targetUnitsNumber} יח״ל לציון ${change.toGrade}`
														: `שיפור של ${change.deltaGrade} נקודות בציון`}
											</div>
										</div>
									</div>

									<div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
										{/* Grade Transition in LTR */}
										<div dir="ltr" className="text-left dir-ltr">
											{change.fromGrade > 0 && change.unitsNumber === change.targetUnitsNumber ? (
												<div className="text-xs font-bold text-ink">
													<span>{change.fromGrade}</span>
													<span className="text-ink-3 mx-1">→</span>
													<span className="text-success">{change.toGrade}</span>
													{change.deltaGrade > 0 && (
														<span className="text-[10px] text-success ml-1 font-bold">
															(+{change.deltaGrade})
														</span>
													)}
												</div>
											) : (
												<div className="text-xs font-bold text-ink">
													<span>ציון יעד: {change.toGrade}</span>
												</div>
											)}
										</div>

										{/* Marginal Impact */}
										<div className="shrink-0">
											{change.sekemImpact > 0 ? (
												<span className="px-2.5 py-1 rounded-xl bg-success-soft text-success border border-success/25 text-xs font-bold flex items-center gap-1 dir-ltr">
													<Sparkles className="h-3 w-3 text-success" />
													<span>+{change.sekemImpact} סכם</span>
												</span>
											) : change.bagrutImpact > 0 ? (
												<span className="px-2 py-0.5 rounded-md bg-paper text-success border border-line text-[10px] font-bold dir-ltr">
													+{change.bagrutImpact} בגרות
												</span>
											) : (simulatedSekemResult.droppedSubjects || []).includes(change.name) ? (
												<span className="px-2 py-0.5 rounded-md bg-paper text-ink-3 border border-line text-[10px]">
													הושמט בממוצע המיטבי
												</span>
											) : (
												<span className="px-2 py-0.5 rounded-md bg-paper text-ink-3 border border-line text-[10px]">
													ללא שינוי בסכם
												</span>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Timeline & Effort Summary + Save CTA */}
				<div className="bg-white p-4 sm:p-5 rounded-2xl border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-4 flex-wrap">
						<div className="flex items-center gap-2 text-xs font-bold text-ink-2">
							<Clock className="h-4 w-4 text-accent" />
							<span>משך למידה משוער: <strong className="text-ink font-bold">{estimatedStudyWeeks} שבועות</strong></span>
						</div>
						<div className="flex items-center gap-2 text-xs font-bold text-ink-2">
							<Calendar className="h-4 w-4 text-accent" />
							<span>עומס שבועי: <strong className="text-ink font-bold">{estimatedWeeklyHours} שעות/שבוע</strong></span>
						</div>
						<div className="flex items-center gap-2 text-xs font-bold text-ink-2">
							<BookOpen className="h-4 w-4 text-accent" />
							<span>בחינות נדרשות: <strong className="text-ink font-bold">{summaryChanges.length} בחינות</strong></span>
						</div>
					</div>

					{/* Save Custom Track Button */}
					<div className="flex items-center gap-3 shrink-0 flex-wrap">
						<button
							type="button"
							onClick={handleSaveCustomTrack}
							disabled={isSavingCustomTrack || savedCustomTrackSuccess}
							className={`px-6 py-3 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer ${
								savedCustomTrackSuccess
									? 'bg-success-soft text-success border border-success/25'
									: 'bg-ink hover:bg-black text-white border border-ink'
							}`}
						>
							{isSavingCustomTrack ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin text-white" />
									<span>שומר מסלול במסד הנתונים...</span>
								</>
							) : savedCustomTrackSuccess ? (
								<>
									<BookmarkCheck className="h-4 w-4 text-success" />
									<span>המסלול נשמר בהצלחה! ✓</span>
								</>
							) : (
								<>
									<Bookmark className="h-4 w-4 text-white" />
									<span>שמור מסלול מותאם אישית</span>
								</>
							)}
						</button>
					</div>
				</div>

				{/* Feedback notification on save */}
				{savedCustomTrackSuccess && (
					<div className="p-4 rounded-2xl bg-success-soft border border-success/25 text-success text-xs font-bold flex items-center justify-between gap-3 flex-wrap animate-in fade-in duration-200">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="h-5 w-5 text-success shrink-0" />
							<span>
								המסלול המותאם אישית נשמר בהצלחה במסד הנתונים! תוכל לצפות בו בכל עת בעמוד המסלולים השמורים.
							</span>
						</div>
						<div className="flex items-center gap-3 shrink-0">
							<Link
								href="/saved-tracks"
								className="px-3 py-1.5 rounded-xl bg-white text-success border border-success/25 hover:bg-paper transition text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
							>
								<span>מעבר למסלולים שמורים</span>
								<ArrowLeft className="h-3.5 w-3.5" />
							</Link>
						</div>
					</div>
				)}

				{savedCustomTrackError && (
					<div className="p-4 rounded-2xl bg-danger-soft border border-danger/25 text-danger text-xs font-bold flex items-center gap-2">
						<AlertCircle className="h-5 w-5 shrink-0" />
						<span>{savedCustomTrackError}</span>
					</div>
				)}
			</div>

			{/* Action CTA: Apply to My Plan */}
			{onApplyScenario && (
				<div className="pt-2 flex items-center justify-between flex-wrap gap-4 border-t border-line">
					<div className="text-xs text-ink-2 flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-accent" />
						<span>
							{simulatedAnalysis?.admissionRoutes?.screening ? 'מצאת שילוב ציונים ומקצועות שמביא אותך לסף הזימון למיונים?' : 'מצאת שילוב ציונים ומקצועות שמביא אותך לקבלה?'} לחץ כדי לעדכן את תוכנית העבודה שלך.
						</span>
					</div>

					<button
						type="button"
						onClick={() => onApplyScenario(simulatedPsych, activeEffectiveSubjects, currentSekem)}
						className="px-6 py-3.5 bg-ink hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
					>
						<span>החל תרחיש זה על מסלול השיפור שלי</span>
						<ArrowLeft className="h-4 w-4" />
					</button>
				</div>
			)}

			{/* Modal: Add Subject to Improvement List ("הוסף מקצוע") */}
			{isAddSubjectModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
					<div className="bg-white border border-line rounded-3xl p-6 sm:p-7 max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-6 dir-rtl text-right shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-line pb-4">
							<div className="flex items-center gap-2.5">
								<div className="p-2 rounded-xl bg-accent-soft text-accent border border-accent/20">
									<Plus className="h-5 w-5" />
								</div>
								<div>
									<h3 className="text-base sm:text-lg font-bold text-ink">
										הוספת מקצוע לשיפור בסימולטור
									</h3>
									<p className="text-xs text-ink-2">
										בחר מקצוע מתעודת הבגרות הקיימת שלך, או הוסף מקצוע הגברה 5 יח״ל חדש
									</p>
								</div>
							</div>

							<button
								type="button"
								onClick={() => setIsAddSubjectModalOpen(false)}
								className="p-1.5 text-ink-3 hover:text-ink hover:bg-paper rounded-xl transition cursor-pointer"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Section 1: Inactive Existing Subjects from User Profile */}
						<div className="space-y-3">
							<span className="text-xs font-bold text-ink block">
								מקצועות מתעודת הבגרות שלך (לשיפור ציון):
							</span>

							<div className="space-y-2">
								{/* Math Option if not active */}
								{!isMathActive && (
									<div className="p-3.5 rounded-2xl bg-paper border border-line flex items-center justify-between gap-3 hover:border-line-strong transition">
										<div className="space-y-0.5">
											<div className="flex items-center gap-2">
												<span className="text-xs font-bold text-ink">מתמטיקה</span>
												<span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-accent border border-line">
													{userProfile.mathUnits || 4} יח״ל
												</span>
											</div>
											<span className="text-[11px] text-ink-2 block">
												ציון קיים: {userProfile.mathGrade || 80}
											</span>
										</div>

										<button
											type="button"
											onClick={() => {
												setIsMathActive(true);
												setSimulatedMathGrade(userProfile.mathGrade || 80);
												setIsMathUpgradedTo5(userProfile.mathUnits === 5);
												setIsAddSubjectModalOpen(false);
											}}
											className="px-3 py-1.5 bg-ink hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
										>
											+ בחר לשיפור
										</button>
									</div>
								)}

								{/* Other Inactive Subjects */}
								{inactiveExistingSubjects.map((s) => (
									<div
										key={s.id}
										className="p-3.5 rounded-2xl bg-paper border border-line flex items-center justify-between gap-3 hover:border-line-strong transition"
									>
										<div className="space-y-0.5">
											<div className="flex items-center gap-2">
												<span className="text-xs font-bold text-ink">{s.name}</span>
												<span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-ink-2 border border-line">
													{s.units} יח״ל
												</span>
											</div>
											<span className="text-[11px] text-ink-2 block">
												ציון קיים: {s.originalGrade}
											</span>
										</div>

										<button
											type="button"
											onClick={() => {
												handleAddExistingSubjectToActive(s.name);
												setIsAddSubjectModalOpen(false);
											}}
											className="px-3 py-1.5 bg-ink hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
										>
											+ בחר לשיפור
										</button>
									</div>
								))}

								{isMathActive && inactiveExistingSubjects.length === 0 && (
									<div className="p-3 text-center text-xs text-ink-3 bg-paper rounded-xl border border-line">
										כל המקצועות מתעודת הבגרות שלך כבר נמצאים ברשימת השיפורים.
									</div>
								)}
							</div>
						</div>

						{/* Section 2: Popular 5-Unit Electives */}
						<div className="space-y-3 pt-3 border-t border-line">
							<div className="space-y-0.5">
								<span className="text-xs font-bold text-ink block">
									הגברות פופולריות (5 יח״ל) להעלאת ממוצע הבגרות:
								</span>
								<span className="text-[11px] text-ink-2">
									הוספת מקצוע מוגבר חדש מעניקה בונוס אוניברסיטאי של 20-25 נקודות ומקפיצה את ממוצע הבגרות
								</span>
							</div>

							<div className="max-h-64 sm:max-h-72 overflow-y-auto pr-1">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{POPULAR_5U_ELECTIVES.map((elective) => {
										const existing = simulatedList.find((s) => isSameBagrutSubject(s.name, elective.name));
										const isAlreadyActive = !!existing;
										return (
											<button
												key={elective.name}
												type="button"
												disabled={isAlreadyActive}
												onClick={() => {
													handleAddPopularElective(elective.name, elective.units, elective.defaultGrade);
													setIsAddSubjectModalOpen(false);
												}}
												className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between text-right cursor-pointer ${
													isAlreadyActive
														? 'bg-paper text-ink-3 border-line cursor-not-allowed opacity-60'
														: 'bg-paper hover:bg-white text-ink border-line hover:border-ink shadow-2xs'
												}`}
											>
												<span>{elective.label}</span>
												{isAlreadyActive ? (
													<span className="text-[10px] text-ink-3">
														{existing && !existing.isCustomAdded ? 'כבר בתעודה' : 'כבר ברשימה'}
													</span>
												) : (
													<Plus className="h-3.5 w-3.5 text-ink" />
												)}
											</button>
										);
									})}
								</div>
							</div>
						</div>

						{/* Section 3: Pick other subject from Ministry Catalog */}
						<div className="pt-3 border-t border-line">
							<button
								type="button"
								onClick={() => {
									setIsAddSubjectModalOpen(false);
									setIsSubjectModalOpen(true);
								}}
								className="w-full py-2.5 px-4 bg-white hover:bg-paper text-ink-2 hover:text-ink text-xs font-bold rounded-xl border border-dashed border-line-strong transition flex items-center justify-center gap-2 cursor-pointer"
							>
								<BookOpen className="h-4 w-4" />
								<span>בחר מקצוע אחר מקטלוג משרד החינוך (68 מקצועות מוכרים)...</span>
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal to pick any subject from catalog */}
			<SubjectSelectModal
				isOpen={isSubjectModalOpen}
				onClose={() => setIsSubjectModalOpen(false)}
				onSelectSubject={handleSelectCatalogSubject}
				existingSubjectNames={simulatedList.map((s) => s.name)}
				title="הוספת מקצוע בגרות או הגברה לסימולציה"
				targetInstitutionId={analysis.target.calculatorId as any}
			/>
		</div>
	);
}
