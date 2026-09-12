'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { ProgramGapAnalysis, UserAcademicProfile } from '@/utils/analysis/gapAnalyzer';
import {
	calculateMultiInstitutionSekem,
	InstitutionSekemResult,
	UnifiedCalculationInput
} from '@/utils/calculators/multiCalculator';
import { SubjectInput } from '@/utils/calculators/bguCalculator';
import { getRealisticPsychometricCeiling, RecommendedTrack } from '@/utils/analysis/trackGenerator';
import { isSubjectMatch } from '@/modules/optimizer/solver';
import SubjectSelectModal from '@/components/calculator/SubjectSelectModal';
import { BagrutSubjectOption } from '@/data/bagrutSubjects';
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
	onSaveCustomTrack?: (track: any) => Promise<void>;
	onCancelEdit?: () => void;
}

// Popular 5-unit electives commonly used by Israeli students to boost Bagrut average
const POPULAR_5U_ELECTIVES = [
	{ name: 'גיאוגרפיה', units: 5, defaultGrade: 90, label: '⚡ גיאוגרפיה 5 יח״ל (תוספת פופולרית)' },
	{ name: 'מדעי המחשב', units: 5, defaultGrade: 88, label: '💻 מדעי המחשב 5 יח״ל' },
	{ name: 'פיזיקה', units: 5, defaultGrade: 86, label: '⚛️ פיזיקה 5 יח״ל' },
	{ name: 'כימיה', units: 5, defaultGrade: 88, label: '🧪 כימיה 5 יח״ל' },
	{ name: 'ביולוגיה', units: 5, defaultGrade: 88, label: '🧬 ביולוגיה 5 יח״ל' },
	{ name: 'ספרות מורחב', units: 5, defaultGrade: 88, label: '📖 ספרות מורחב 5 יח״ל' },
	{ name: 'תנ״ך מורחב', units: 5, defaultGrade: 88, label: '📜 תנ״ך מורחב 5 יח״ל' }
];

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
	onSaveCustomTrack,
	onCancelEdit
}: WhatIfSimulatorProps) {
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
		if (initialTrackToEdit && initialTrackToEdit.targetPsychometric && initialTrackToEdit.targetPsychometric > 0) {
			return initialTrackToEdit.targetPsychometric;
		}
		return initialPsych;
	});

	const [isMathActive, setIsMathActive] = useState<boolean>(() => {
		if (initialTrackToEdit) {
			const mathImp = initialTrackToEdit.recommendedSubjectImprovements?.find((imp) =>
				isSubjectMatch(imp.subjectName, 'מתמטיקה')
			);
			return !!mathImp;
		}
		return false;
	});

	const [isMathUpgradedTo5, setIsMathUpgradedTo5] = useState<boolean>(() => {
		if (initialTrackToEdit) {
			const mathImp = initialTrackToEdit.recommendedSubjectImprovements?.find((imp) =>
				isSubjectMatch(imp.subjectName, 'מתמטיקה')
			);
			if (mathImp) return mathImp.targetUnits === 5;
		}
		return userProfile.mathUnits === 5;
	});

	const [simulatedMathGrade, setSimulatedMathGrade] = useState<number>(() => {
		if (initialTrackToEdit) {
			const mathImp = initialTrackToEdit.recommendedSubjectImprovements?.find((imp) =>
				isSubjectMatch(imp.subjectName, 'מתמטיקה')
			);
			if (mathImp) return mathImp.targetGrade;
		}
		return userProfile.mathGrade || 80;
	});

	// Simulated Subjects List (includes original + custom added)
	// STRICT RULE: Only active if proposed in track! No auto-activation of weak subjects!
	const [simulatedList, setSimulatedList] = useState<SimulatedSubjectItem[]>(() => {
		if (initialTrackToEdit) {
			return applyTrackToSimulatorState(initialTrackToEdit, userProfile, initialPsych).subjectsList;
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

	// Load track into simulator whenever initialTrackToEdit changes
	useEffect(() => {
		if (initialTrackToEdit) {
			const state = applyTrackToSimulatorState(initialTrackToEdit, userProfile, initialPsych);
			setSimulatedPsych(state.targetPsych);
			setIsMathActive(state.isMathActive);
			setIsMathUpgradedTo5(state.isMath5);
			setSimulatedMathGrade(state.mathGrade);
			setSimulatedList(state.subjectsList);
			setSavedCustomTrackSuccess(false);
			setSavedCustomTrackError(null);
		}
	}, [initialTrackToEdit, initialPsych, userProfile]);

	// Reset state when analysis target changes (only if no track is being edited)
	useEffect(() => {
		if (!initialTrackToEdit) {
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
			setSavedCustomTrackError(null);
		}
	}, [analysis.target.program.id, initialPsych, userProfile, initialTrackToEdit]);

	// Reset to the original proposed targets of the edited track
	const handleResetToOriginalTrack = () => {
		if (initialTrackToEdit) {
			const state = applyTrackToSimulatorState(initialTrackToEdit, userProfile, initialPsych);
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
	): { sekem: number; bagrutAverage: number; allInstitutions: InstitutionSekemResult[] } => {
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

		const psychRatio = psych / (initialPsych || 600);
		const baseQuant = userProfile.psychometricQuant || Math.round(initialPsych / 5);
		const simulatedQuant = Math.min(150, Math.max(50, Math.round(baseQuant * psychRatio)));

		const calcInput: UnifiedCalculationInput = {
			bagrutSubjects: updatedSubjects,
			psychometricGeneral: psych,
			psychometricQuant: simulatedQuant,
			psychometricVerbal: userProfile.psychometricVerbal,
			psychometricEnglish: userProfile.psychometricEnglish,
			mathUnits: isMath5 ? 5 : userProfile.mathUnits || 4,
			mathGrade: mathGradeVal,
			physicsUnits: effectivePhysicsUnits,
			physicsGrade: effectivePhysicsGrade
		};

		const allInstitutionIds = ['bgu', 'tau', 'technion', 'huji', 'haifa', 'ariel', 'bar_ilan', 'reichman'];
		const multiRes = calculateMultiInstitutionSekem(calcInput, allInstitutionIds);
		const targetInst =
			multiRes.find((r) => r.institutionId === analysis.target.calculatorId) || multiRes[0] || institutionResult;

		let sekem = targetInst.generalSekem;
		if (analysis.relevantSekemType === 'engineering' && targetInst.engineeringSekem) {
			sekem = targetInst.engineeringSekem;
		} else if (analysis.relevantSekemType === 'management' && targetInst.managementSekem) {
			sekem = targetInst.managementSekem;
		}

		return {
			sekem,
			bagrutAverage: targetInst.bagrutAverage,
			allInstitutions: multiRes
		};
	};

	// Baseline results across ALL 6 institutions
	const baselineAllInstitutions = useMemo(() => {
		const originalSubjects = (userProfile.bagrutSubjects || []).map((s) => ({
			name: s.name,
			units: s.units,
			grade: s.grade
		}));
		const baseRes = calculateSekemForSubjectList(
			originalSubjects,
			initialPsych,
			userProfile.mathUnits === 5,
			userProfile.mathGrade || 80
		);
		return baseRes.allInstitutions;
	}, [userProfile, initialPsych]);

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
	const isAccepted = rawGap >= 0;
	const isBorderline = rawGap >= -15 && rawGap < 0;

	// Progress bar calculation (0% to 100%)
	const progressPercent = useMemo(() => {
		const baselineSekem = analysis.userSekem;
		const neededTotal = threshold - baselineSekem;
		if (neededTotal <= 0) return 100;
		const achieved = currentSekem - baselineSekem;
		const pct = Math.round((achieved / neededTotal) * 100);
		return Math.min(100, Math.max(0, pct));
	}, [analysis.userSekem, currentSekem, threshold]);

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
					unitsLabel: mathUnitsChanged ? `${origMathUnits} ➔ 5 יח״ל` : `${curMathUnits} יח״ל`,
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
					unitsLabel: unitsChanged ? `${s.originalUnits} ➔ ${s.units} יח״ל` : `${s.units} יח״ל`,
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
				title: initialTrackToEdit
					? `מסלול מותאם: ${initialTrackToEdit.title}`
					: `מסלול מותאם אישית (${totalExamsCount} בחינות)`,
				badge: isAccepted ? 'קבלה מובטחת' : isBorderline ? 'על סף קבלה' : 'מסלול מותאם',
				badgeColor: isAccepted ? 'emerald' : isBorderline ? 'amber' : 'blue',
				targetSekem: currentSekem,
				targetPsychometric: simulatedPsych,
				targetBagrutAverage: simulatedSekemResult.bagrutAverage,
				currentPsychometric: userProfile.psychometricGeneral || 0,
				currentBagrutAverage: institutionResult.bagrutAverage || 100,
				strategyDescription: `מסלול שיפורים מותאם אישית שנבנה בסימולטור עבור ${analysis.target.program.fieldOfStudy} ב${analysis.target.institutionName}.`,
				estimatedWeeks: estWeeks,
				weeklyHours: estHours,
				feasibility: isAccepted ? 'high' : isBorderline ? 'moderate' : 'challenging',
				feasibilityExplanation: isAccepted
					? `הסכם המשוקלל בסימולציה (${currentSekem.toFixed(isTechnion ? 2 : 1)}) עומד בסף הקבלה הנדרש (${threshold.toFixed(isTechnion ? 2 : 1)}).`
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

			if (onSaveCustomTrack) {
				await onSaveCustomTrack(customTrackPayload);
			} else {
				const existingUserId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('kalis_user_id') || undefined : undefined);
				const res = await fetch('/api/tracks/save', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId: existingUserId,
						programId: analysis.target.program.id,
						track: customTrackPayload
					})
				});
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
		const existingIndex = simulatedList.findIndex((s) => s.name === name);
		if (existingIndex >= 0) {
			const updated = [...simulatedList];
			updated[existingIndex] = {
				...updated[existingIndex],
				isActive: true,
				simulatedGrade: defaultGrade
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

	// Add existing subject to active simulation list
	const handleAddExistingSubjectToActive = (subjectName: string) => {
		if (!subjectName) return;
		const updated = simulatedList.map((s) => {
			if (s.name === subjectName) {
				return { ...s, isActive: true, simulatedGrade: Math.min(95, s.originalGrade + 15) };
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
		<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 dir-rtl text-right relative overflow-hidden">
			{/* Edit Track Banner when initialTrackToEdit is passed */}
			{initialTrackToEdit && (
				<div className="bg-[#FAF8F5] border-2 border-[#1E597B]/25 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
					<div className="flex items-start gap-3">
						<div className="p-2.5 rounded-xl bg-[#EFF6FA] text-[#1E597B] border border-[#C5DFED] shrink-0 shadow-2xs">
							<Sliders className="h-5 w-5" />
						</div>
						<div className="space-y-1">
							<div className="flex items-center gap-2 flex-wrap">
								<span className="text-xs font-black text-[#1E597B] uppercase tracking-wide">
									מצב עריכת מסלול מומלץ
								</span>
								<span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#3C3C3C] text-white shadow-2xs">
									{initialTrackToEdit.title}
								</span>
								<span className="text-xs text-[#8A847C]">
									({initialTrackToEdit.badge})
								</span>
							</div>
							<p className="text-xs text-[#66635C] leading-relaxed">
								הסימולטור הוטען מראש עם היעדים והבגרויות שהוצעו במסלול זה. באפשרותך לשנות פרמטרים, לבדוק עמידה בסף הקבלה, ולשמור את המסלול המותאם.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<button
							type="button"
							onClick={handleResetToOriginalTrack}
							className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] text-xs font-bold rounded-xl border border-[#E5DFD4] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
							title="אפס לנתוני המסלול המוצעים במקור"
						>
							<RotateCcw className="h-3.5 w-3.5" />
							<span>אפס ליעדי המסלול</span>
						</button>

						{onCancelEdit && (
							<button
								type="button"
								onClick={onCancelEdit}
								className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#222222] text-xs font-bold rounded-xl border border-[#E5DFD4] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
							>
								<ArrowRight className="h-3.5 w-3.5" />
								<span>חזור למסלולים</span>
							</button>
						)}
					</div>
				</div>
			)}

			{/* Section Header */}
			<div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE5DA] pb-5">
				<div className="space-y-1.5">
					<div className="flex items-center gap-2">
						<span className="px-3 py-1 bg-[#FAF8F5] text-[#1E597B] border border-[#E5DFD4] text-xs font-black rounded-lg flex items-center gap-1.5">
							<Sliders className="h-3.5 w-3.5 text-[#1E597B]" />
							<span>מעבדת סימולציה וחישוב השפעה (What-If)</span>
						</span>
						<span className="text-xs font-bold text-[#66635C]">
							{analysis.target.institutionName} • {analysis.target.program.fieldOfStudy}
						</span>
					</div>
					<h3 className="text-xl sm:text-2xl font-black text-[#222222]">
						בדוק והוסף בגרויות — וצפה במידת ההשפעה המדויקת על הסכם 🎛️
					</h3>
					<p className="text-xs sm:text-sm text-[#66635C]">
						הוסף מקצועות בגרות חדשים או שפר מקצועות קיימים, וקבל את התרומה המדויקת של כל מקצוע ישירות לסכם הקבלה.
					</p>
				</div>

				{/* Quick Preset Buttons */}
				<div className="flex items-center gap-2 flex-wrap shrink-0">
					<button
						type="button"
						onClick={handlePresetPsychOnly}
						className="px-3 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#222222] text-xs font-bold rounded-xl border border-[#E5DFD4] transition flex items-center gap-1.5 cursor-pointer"
						title="חשב פסיכומטרי בלבד לסגירת הפער"
					>
						<Zap className="h-3.5 w-3.5 text-[#825B15]" />
						<span>פסיכומטרי בלבד</span>
					</button>

					<button
						type="button"
						onClick={handlePresetBalanced}
						className="px-3 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#222222] text-xs font-bold rounded-xl border border-[#E5DFD4] transition flex items-center gap-1.5 cursor-pointer"
						title="איזון בין פסיכומטרי לבגרויות"
					>
						<Award className="h-3.5 w-3.5 text-[#205739]" />
						<span>איזון 50/50</span>
					</button>

					<button
						type="button"
						onClick={handlePresetReset}
						className="px-3 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#66635C] hover:text-[#222222] text-xs font-bold rounded-xl border border-[#E5DFD4] transition flex items-center gap-1 cursor-pointer"
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
					<div className="bg-white border border-[#E5DFD4] rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xs">
						<div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3">
							<div className="flex items-center gap-2.5">
								<div className="p-2 rounded-xl bg-[#EFF6FA] text-[#1E597B] border border-[#C5DFED] shadow-2xs">
									<Brain className="h-4 w-4 text-[#1E597B]" />
								</div>
								<div>
									<h4 className="text-sm font-black text-[#222222]">סרגל הפסיכומטרי</h4>
									<span className="text-[11px] text-[#66635C]">
										{hasOriginalPsych ? `ציון נוכחי: ${initialPsych}` : 'סימולציית בחינה ראשונה'}
									</span>
								</div>
							</div>

							<div className="text-left dir-ltr">
								<span className="text-2xl font-black text-[#222222]">{simulatedPsych}</span>
								{hasOriginalPsych && simulatedPsych > initialPsych && (
									<span className="text-xs text-[#205739] font-black ml-1.5">
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
								className="w-full h-2.5 bg-[#EAE5DA] rounded-lg appearance-none cursor-pointer accent-[#3C3C3C]"
							/>
							<div className="flex items-center justify-between text-[11px] text-[#8A847C] font-medium">
								<span>{hasOriginalPsych ? `קיים: ${initialPsych}` : 'התחלה: 450'}</span>
								<span className="text-[#1E597B] font-bold">תקרה ריאלית: {realisticCeiling}</span>
								<span>800</span>
							</div>
						</div>

						{simulatedPsych > realisticCeiling && (
							<div className="p-3 rounded-2xl bg-[#FDF6E8] border border-[#ECDAB6] text-[11px] text-[#825B15] font-medium flex items-start gap-2">
								<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
								<span>
									ציון של {simulatedPsych} דורש זינוק חריג יחסית לממוצע הבגרות. מומלץ לשלב שיפור בגרויות.
								</span>
							</div>
						)}

						{totalPsychSekemDelta > 0 && (
							<div className="flex items-center justify-between text-xs bg-[#EFF6FA] border border-[#C5DFED] rounded-xl px-3 py-1.5 text-[#1E597B] font-bold">
								<span>השפעת השינוי בפסיכומטרי על הסכם:</span>
								<span className="font-black dir-ltr">+{totalPsychSekemDelta} נק׳ סכם</span>
							</div>
						)}
					</div>

					{/* 2. BAGRUT LAB: "הבגרויות שאני רוצה לשפר" */}
					<div className="bg-white border border-[#E5DFD4] rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xs">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE5DA] pb-4">
							<div className="flex items-center gap-2.5">
								<div className="p-2 rounded-xl bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB] shadow-2xs">
									<BookOpen className="h-4 w-4 text-[#453D78]" />
								</div>
								<div>
									<h4 className="text-sm sm:text-base font-black text-[#222222]">
										הבגרויות שאני רוצה לשפר
									</h4>
									<span className="text-xs text-[#66635C]">
										מציג רק מקצועות שבחרת לערוך או שהוצעו במסלול
									</span>
								</div>
							</div>

							{/* Primary "הוסף מקצוע" CTA Button */}
							<button
								type="button"
								onClick={() => setIsAddSubjectModalOpen(true)}
								className="px-4 py-2.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
							>
								<Plus className="h-4 w-4" />
								<span>הוסף מקצוע</span>
							</button>
						</div>

						{/* Best Bagrut Average KPI bar */}
						<div className="flex items-center justify-between flex-wrap gap-2 bg-[#FAF8F5] border border-[#E5DFD4] px-4 py-2.5 rounded-2xl text-xs">
							<div className="flex items-center gap-2">
								<span className="text-[#66635C] font-medium">ממוצע בגרות מיטבי:</span>
								<span className="font-black text-[#222222] dir-ltr text-sm">
									{simulatedSekemResult.bagrutAverage.toFixed(2)}
								</span>
								{bagrutDeltaVal > 0 && (
									<span className="text-xs text-[#205739] font-bold dir-ltr">
										(+{bagrutDeltaVal.toFixed(2)})
									</span>
								)}
							</div>
							{totalBagrutSekemDelta > 0 && (
								<span className="px-2.5 py-0.5 rounded-lg bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE] font-black dir-ltr text-[11px] flex items-center gap-1">
									<Sparkles className="h-3 w-3 text-[#205739]" />
									<span>+{totalBagrutSekemDelta} נק׳ סכם מכל הבגרויות</span>
								</span>
							)}
						</div>

						{/* Active Subjects List */}
						<div className="space-y-3">
							{/* Math Card if Active */}
							{isMathActive && (
								<div className="bg-[#FAF8F5] border border-[#E5DFD4] hover:border-[#D5CFC2] rounded-2xl p-4 space-y-3 relative transition">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-sm font-black text-[#222222]">
												מתמטיקה
											</span>
											<span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF8F5] text-[#1E597B] border border-[#C5DFED]">
												{isMathUpgradedTo5 ? '5 יח״ל (+35 בונוס)' : `${userProfile.mathUnits || 4} יח״ל`}
											</span>
										</div>

										<button
											type="button"
											onClick={() => setIsMathActive(false)}
											className="text-[#8A847C] hover:text-[#9B3327] transition p-1.5 rounded-lg hover:bg-white cursor-pointer"
											title="הסר מתמטיקה מרשימת השיפורים (החזר לנתוני בסיס)"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>

									{/* Units Toggle (4 or 5) */}
									<div className="flex items-center justify-between text-xs pt-1">
										<span className="text-[#66635C] text-[11px]">היקף יחידות לימוד:</span>
										<div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-[#E5DFD4]">
											<button
												type="button"
												onClick={() => setIsMathUpgradedTo5(false)}
												className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
													!isMathUpgradedTo5
														? 'bg-[#3C3C3C] text-white shadow-2xs font-black'
														: 'text-[#66635C] hover:text-[#222222]'
												}`}
											>
												{userProfile.mathUnits || 4} יח״ל
											</button>
											<button
												type="button"
												onClick={() => setIsMathUpgradedTo5(true)}
												className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
													isMathUpgradedTo5
														? 'bg-[#3C3C3C] text-white shadow-2xs font-black'
														: 'text-[#66635C] hover:text-[#222222]'
												}`}
											>
												5 יח״ל (+35)
											</button>
										</div>
									</div>

									{/* Math Grade Slider */}
									<div className="space-y-1.5">
										<div className="flex items-center justify-between text-xs">
											<span className="text-[#66635C]">
												<span>קיים: {userProfile.mathGrade || 80}</span>
												<span className="text-[#8A847C] mx-1">➔</span>
												<span>יעד מבוקש:</span>
											</span>
											<div dir="ltr" className="text-left dir-ltr">
												<span className="font-black text-[#222222]">{simulatedMathGrade}</span>
												{simulatedMathGrade > (userProfile.mathGrade || 80) && (
													<span className="text-[10px] text-[#205739] font-bold ml-1">
														(+{simulatedMathGrade - (userProfile.mathGrade || 80)})
													</span>
												)}
											</div>
										</div>

										<input
											type="range"
											min={60}
											max={100}
											step={1}
											value={simulatedMathGrade}
											onChange={(e) => setSimulatedMathGrade(Number(e.target.value))}
											className="w-full h-2 bg-[#EAE5DA] rounded-lg appearance-none cursor-pointer accent-[#3C3C3C]"
										/>
									</div>

									{/* Math Marginal Impact */}
									<div className="pt-2 border-t border-[#EAE5DA] flex items-center justify-between text-[11px]">
										<span className="text-[#66635C] font-medium">מידת השפעה שולית:</span>
										{mathUpgradeImpact > 0 ? (
											<span className="px-2.5 py-0.5 rounded-lg bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE] font-black flex items-center gap-1 dir-ltr">
												<Sparkles className="h-3 w-3 text-[#205739]" />
												<span>+{mathUpgradeImpact} נק׳ סכם</span>
											</span>
										) : (
											<span className="text-[#8A847C] text-[10px] bg-white px-2 py-0.5 rounded border border-[#E5DFD4]">
												ללא שינוי מסכם הבסיס
											</span>
										)}
									</div>
								</div>
							)}

							{/* Other Active Display Subjects */}
							{activeDisplaySubjects.map((item) => {
								const impact = calculateSubjectMarginalImpact(item);
								return (
									<div
										key={item.id}
										className="bg-[#FAF8F5] border border-[#E5DFD4] hover:border-[#D5CFC2] rounded-2xl p-4 space-y-3 relative transition"
									>
										{/* Header: Name, Tag, Trash button */}
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2 flex-wrap">
												<span className="text-sm font-black text-[#222222]">
													{item.name}
												</span>
												{item.isCustomAdded ? (
													<span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EFF6FA] text-[#1E597B] border border-[#C5DFED]">
														מקצוע חדש ({item.units} יח״ל)
													</span>
												) : item.units !== item.originalUnits ? (
													<span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB]">
														שודרג ל-{item.units} יח״ל
													</span>
												) : (
													<span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#66635C] border border-[#E5DFD4]">
														{item.units} יח״ל
													</span>
												)}
											</div>

											<button
												type="button"
												onClick={() => handleRemoveSimulatedSubject(item.id)}
												className="text-[#8A847C] hover:text-[#9B3327] transition p-1.5 rounded-lg hover:bg-white cursor-pointer"
												title="הסר מקצוע זה מרשימת השיפורים"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>

										{/* Units Selector */}
										<div className="flex items-center justify-between text-xs pt-1">
											<span className="text-[#66635C] text-[11px]">היקף יחידות:</span>
											<div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-[#E5DFD4]">
												{[2, 3, 4, 5].map((u) => {
													const isSelected = item.units === u;
													return (
														<button
															key={u}
															type="button"
															onClick={() => handleUnitsChange(item.id, u)}
															className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
																isSelected
																	? 'bg-[#3C3C3C] text-white shadow-2xs font-black'
																	: 'text-[#66635C] hover:text-[#222222]'
															}`}
														>
															{u} יח״ל
														</button>
													);
												})}
											</div>
										</div>

										{/* Grade Slider */}
										<div className="space-y-1.5">
											<div className="flex items-center justify-between text-xs">
												<span className="text-[#66635C]">
													{item.isCustomAdded ? (
														'ציון יעד:'
													) : (
														<span className="inline-flex items-center gap-1">
															<span>קיים: {item.originalGrade}</span>
															<span className="text-[#8A847C]">➔</span>
															<span>יעד מבוקש:</span>
														</span>
													)}
												</span>
												<div dir="ltr" className="text-left dir-ltr">
													<span className="font-black text-[#222222]">{item.simulatedGrade}</span>
													{!item.isCustomAdded && item.simulatedGrade > item.originalGrade && (
														<span className="text-[10px] text-[#205739] font-bold ml-1">
															(+{item.simulatedGrade - item.originalGrade})
														</span>
													)}
												</div>
											</div>

											<input
												type="range"
												min={item.isCustomAdded ? 60 : Math.min(60, item.originalGrade)}
												max={100}
												step={1}
												value={item.simulatedGrade}
												onChange={(e) =>
													handleGradeSliderChange(item.id, Number(e.target.value))
												}
												className="w-full h-2 bg-[#EAE5DA] rounded-lg appearance-none cursor-pointer accent-[#3C3C3C]"
											/>
										</div>

										{/* Marginal Impact */}
										<div className="pt-2 border-t border-[#EAE5DA] flex items-center justify-between text-[11px]">
											<span className="text-[#66635C] font-medium">מידת השפעה שולית:</span>
											{impact.sekemDelta > 0 ? (
												<div className="flex items-center gap-1.5 dir-ltr">
													<span className="px-2.5 py-0.5 rounded-lg bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE] font-black flex items-center gap-1">
														<Sparkles className="h-3 w-3 text-[#205739]" />
														<span>+{impact.sekemDelta} נק׳ סכם</span>
													</span>
													{impact.bagrutDelta > 0 && (
														<span className="text-[10px] text-[#66635C] font-medium">
															(+{impact.bagrutDelta} בבגרות)
														</span>
													)}
												</div>
											) : (
												<span className="text-[#8A847C] text-[10px] bg-white px-2 py-0.5 rounded border border-[#E5DFD4]">
													הושמט בממוצע המיטבי של האוניברסיטה
												</span>
											)}
										</div>
									</div>
								);
							})}

							{/* Empty State when no bagruts are active */}
							{!isMathActive && activeDisplaySubjects.length === 0 && (
								<div className="text-center py-10 px-6 bg-[#FAF8F5] rounded-3xl border border-dashed border-[#DDD7CC] space-y-3">
									<div className="p-3 bg-white border border-[#E5DFD4] rounded-2xl w-fit mx-auto text-[#66635C] shadow-2xs">
										<BookOpen className="h-6 w-6" />
									</div>
									<div className="space-y-1">
										<h5 className="text-sm font-black text-[#222222]">
											לא נבחרו בגרויות לשיפור
										</h5>
										<p className="text-xs text-[#66635C] max-w-md mx-auto leading-relaxed">
											כרגע כל מקצועות הבגרות מחושבים לפי הציונים המקוריים שלך. לחץ על ״הוסף מקצוע״ כדי לבחור מקצוע לשיפור או להוסיף מקצוע מוגבר חדש.
										</p>
									</div>
									<button
										type="button"
										onClick={() => setIsAddSubjectModalOpen(true)}
										className="px-5 py-2.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2 shadow-xs cursor-pointer"
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
					<div className="bg-white border-2 border-[#E5DFD4] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
						{/* University Header with Logo */}
						<div className="flex items-start justify-between gap-3 border-b border-[#EAE5DA] pb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] shadow-2xs shrink-0">
									<UniversityLogo institution={analysis.target.calculatorId} size="md" />
								</div>
								<div>
									<h4 className="text-base font-black text-[#222222]">
										{analysis.target.institutionName}
									</h4>
									<p className="text-xs font-bold text-[#1E597B] line-clamp-1">
										{analysis.target.program.fieldOfStudy}
									</p>
									<span className="text-[11px] text-[#8A847C] block mt-0.5">
										{analysis.relevantSekemType === 'engineering' ? 'סכם הנדסי/כמותי' : 'סכם כללי/רב-תחומי'}
									</span>
								</div>
							</div>

							{/* Admission Status Pill Badge */}
							<div
								className={`px-3 py-1.5 rounded-xl border text-xs font-black shrink-0 flex items-center gap-1.5 ${
									isAccepted
										? 'bg-[#EBF4EE] text-[#205739] border-[#C6DFCE]'
										: isBorderline
										? 'bg-[#FDF6E8] text-[#825B15] border-[#ECDAB6]'
										: 'bg-[#FDF1EE] text-[#9B3327] border-[#F1CAC1]'
								}`}
							>
								{isAccepted ? (
									<>
										<CheckCircle2 className="h-4 w-4 text-[#205739]" />
										<span>התקבלת!</span>
									</>
								) : isBorderline ? (
									<>
										<AlertCircle className="h-4 w-4 text-[#825B15]" />
										<span>על הגבול</span>
									</>
								) : (
									<>
										<AlertCircle className="h-4 w-4 text-[#9B3327]" />
										<span>מתחת לסף</span>
									</>
								)}
							</div>
						</div>

						{/* Live Sekem Score Box */}
						<div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5DFD4] text-center space-y-2">
							<span className="text-xs font-black text-[#66635C] uppercase tracking-wider block">
								הסכם המחושב בסימולציה
							</span>
							<div className="text-4xl sm:text-5xl font-black text-[#222222] dir-ltr tracking-tight">
								{currentSekem.toFixed(isTechnion ? 2 : 1)}
							</div>

							<div className="flex items-center justify-center gap-4 text-xs font-bold pt-1">
								<span className="text-[#8A847C]">
									בסיס: <strong className="text-[#66635C] font-black">{analysis.userSekem.toFixed(isTechnion ? 2 : 1)}</strong>
								</span>
								<span className="text-[#8A847C]">•</span>
								<span className="text-[#1E597B]">
									סף נדרש: <strong className="text-[#1E597B] font-black">{threshold.toFixed(isTechnion ? 2 : 1)}</strong>
								</span>
							</div>

							{/* Gap Notice */}
							<div className="pt-2">
								{isAccepted ? (
									<span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#EBF4EE] text-[#205739] text-xs font-bold border border-[#C6DFCE]">
										<span>+{rawGap.toFixed(isTechnion ? 2 : 1)} נקודות מעל הסף הנדרש 🎉</span>
									</span>
								) : isBorderline ? (
									<span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FDF6E8] text-[#825B15] text-xs font-bold border border-[#ECDAB6]">
										<span>חסרות רק {Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נקודות לסף הקבלה</span>
									</span>
								) : (
									<span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#FDF1EE] text-[#9B3327] text-xs font-bold border border-[#F1CAC1]">
										<span>פער של {Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נקודות לסף הקבלה</span>
									</span>
								)}
							</div>
						</div>

						{/* Progress Bar Gauge ("כמה אני מתקרב לסף הנדרש עבור התואר") */}
						<div className="space-y-2.5">
							<div className="flex items-center justify-between text-xs font-bold text-[#66635C]">
								<span>מד התקדמות לסף הקבלה:</span>
								<span className="text-[#222222] font-black text-sm dir-ltr">{progressPercent}%</span>
							</div>

							<div className="w-full h-3.5 bg-[#EAE5DA] rounded-full overflow-hidden p-0.5 border border-[#DDD7CC]">
								<div
									className={`h-full rounded-full transition-all duration-300 ${
										isAccepted
											? 'bg-[#205739]'
											: isBorderline
											? 'bg-[#825B15]'
											: 'bg-[#3C3C3C]'
									}`}
									style={{ width: `${Math.max(5, progressPercent)}%` }}
								/>
							</div>

							<div className="flex items-center justify-between text-[11px] text-[#8A847C] font-medium">
								<span>ציון בסיס ({analysis.userSekem.toFixed(isTechnion ? 2 : 1)})</span>
								<span>יעד קבלה ({threshold.toFixed(isTechnion ? 2 : 1)})</span>
							</div>
						</div>

						{/* Sources of improvement */}
						{(totalPsychSekemDelta > 0 || totalBagrutSekemDelta > 0) && (
							<div className="pt-3 border-t border-[#EAE5DA] space-y-2">
								<span className="text-[11px] font-bold text-[#66635C] block">
									תרומת השינויים בסימולציה לסכם:
								</span>
								<div className="flex items-center gap-2 flex-wrap text-xs">
									{totalPsychSekemDelta > 0 && (
										<div className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-[#EFF6FA] text-[#1E597B] border border-[#C5DFED] text-xs font-bold flex items-center justify-between">
											<span className="flex items-center gap-1.5">
												<Brain className="h-3.5 w-3.5 text-[#1E597B]" />
												<span>פסיכומטרי</span>
											</span>
											<span className="font-black dir-ltr">+{totalPsychSekemDelta}</span>
										</div>
									)}
									{totalBagrutSekemDelta > 0 && (
										<div className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB] text-xs font-bold flex items-center justify-between">
											<span className="flex items-center gap-1.5">
												<BookOpen className="h-3.5 w-3.5 text-[#453D78]" />
												<span>בגרויות</span>
											</span>
											<span className="font-black dir-ltr">+{totalBagrutSekemDelta}</span>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Collapsible Accordion for Other 8 Universities */}
						<div className="pt-3 border-t border-[#EAE5DA]">
							<button
								type="button"
								onClick={() => setShowAllUniversities(!showAllUniversities)}
								className="w-full flex items-center justify-between text-xs font-bold text-[#66635C] hover:text-[#222222] py-1 transition cursor-pointer"
							>
								<span className="flex items-center gap-1.5">
									<TrendingUp className="h-3.5 w-3.5 text-[#1E597B]" />
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
											const isEng = analysis.relevantSekemType === 'engineering';
											const currentScore =
												isEng && inst.engineeringSekem ? inst.engineeringSekem : inst.generalSekem;
											const baseScore =
												isEng && baseInst?.engineeringSekem
													? baseInst.engineeringSekem
													: baseInst?.generalSekem || 0;
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
												sekemTypeLabel: isEng ? 'סכם הנדסי/כמותי' : 'סכם כללי/רב-תחומי',
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
			<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE5DA] pb-5">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<div className="p-2 rounded-xl bg-white text-[#1E597B] border border-[#E5DFD4] shadow-2xs">
								<TrendingUp className="h-5 w-5" />
							</div>
							<h4 className="text-lg sm:text-xl font-black text-[#222222]">
								סיכום השינויים אל מול המצב הקיים
							</h4>
						</div>
						<p className="text-xs text-[#66635C]">
							השוואה ישירה בין נתוני הבסיס שלך לבין התרחיש המותאם שנבנה בסימולטור
						</p>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<span className="px-3 py-1.5 rounded-xl bg-white border border-[#E5DFD4] text-xs font-bold text-[#222222] shadow-2xs">
							סה״כ {summaryChanges.length} שינויים מוצעים
						</span>
					</div>
				</div>

				{/* 4 Comparative KPI Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
					{/* 1. Psychometric */}
					<div className="bg-white p-4 rounded-2xl border border-[#E5DFD4] space-y-2 shadow-2xs">
						<div className="flex items-center justify-between text-xs text-[#66635C] font-bold">
							<span className="flex items-center gap-1.5">
								<Brain className="h-3.5 w-3.5 text-[#1E597B]" />
								<span>ציון פסיכומטרי</span>
							</span>
							{totalPsychSekemDelta > 0 && (
								<span className="text-[10px] font-black text-[#205739] bg-[#EBF4EE] px-1.5 py-0.5 rounded border border-[#C6DFCE]">
									+{totalPsychSekemDelta} נק׳ סכם
								</span>
							)}
						</div>
						<div className="flex items-baseline justify-between gap-2">
							<div className="text-xl font-black text-[#222222] dir-ltr">
								{simulatedPsych}
							</div>
							<div dir="ltr" className="text-xs font-bold text-[#66635C] dir-ltr">
								{hasOriginalPsych ? (
									<span>
										{userProfile.psychometricGeneral} ➔ {simulatedPsych}
										{simulatedPsych > (userProfile.psychometricGeneral || 0) && (
											<span className="text-[#205739] ml-1">
												(+{simulatedPsych - (userProfile.psychometricGeneral || 0)})
											</span>
										)}
									</span>
								) : (
									<span className="text-[#8A847C]">בחינה ראשונה</span>
								)}
							</div>
						</div>
						<div className="text-[11px] text-[#8A847C]">
							{simulatedPsych === (userProfile.psychometricGeneral || 0)
								? 'ללא שינוי מהציון הקיים'
								: `עלייה של ${simulatedPsych - (userProfile.psychometricGeneral || 0)} נקודות`}
						</div>
					</div>

					{/* 2. Bagrut Average */}
					<div className="bg-white p-4 rounded-2xl border border-[#E5DFD4] space-y-2 shadow-2xs">
						<div className="flex items-center justify-between text-xs text-[#66635C] font-bold">
							<span className="flex items-center gap-1.5">
								<BookOpen className="h-3.5 w-3.5 text-[#1E597B]" />
								<span>ממוצע בגרות משוער</span>
							</span>
							{bagrutDeltaVal > 0 && (
								<span className="text-[10px] font-black text-[#205739] bg-[#EBF4EE] px-1.5 py-0.5 rounded border border-[#C6DFCE]">
									+{bagrutDeltaVal.toFixed(2)} בממוצע
								</span>
							)}
						</div>
						<div className="flex items-baseline justify-between gap-2">
							<div className="text-xl font-black text-[#222222] dir-ltr">
								{simulatedSekemResult.bagrutAverage.toFixed(2)}
							</div>
							<div dir="ltr" className="text-xs font-bold text-[#66635C] dir-ltr">
								<span>
									{(institutionResult.bagrutAverage || 100).toFixed(2)} ➔ {simulatedSekemResult.bagrutAverage.toFixed(2)}
								</span>
							</div>
						</div>
						<div className="text-[11px] text-[#8A847C]">
							{bagrutDeltaVal > 0
								? `תוספת של ${bagrutDeltaVal.toFixed(2)} לממוצע הבגרות`
								: 'ללא שינוי בממוצע הבגרות'}
						</div>
					</div>

					{/* 3. Sekem vs. Threshold */}
					<div className="bg-white p-4 rounded-2xl border border-[#E5DFD4] space-y-2 shadow-2xs">
						<div className="flex items-center justify-between text-xs text-[#66635C] font-bold">
							<span className="flex items-center gap-1.5">
								<Sparkles className="h-3.5 w-3.5 text-[#1E597B]" />
								<span>ציון סכם מול סף</span>
							</span>
							<span className="text-[10px] font-bold text-[#66635C] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E5DFD4]">
								סף: {threshold.toFixed(isTechnion ? 2 : 1)}
							</span>
						</div>
						<div className="flex items-baseline justify-between gap-2">
							<div className="text-xl font-black text-[#222222] dir-ltr">
								{currentSekem.toFixed(isTechnion ? 2 : 1)}
							</div>
							<div dir="ltr" className="text-xs font-bold text-[#66635C] dir-ltr">
								<span>
									{analysis.userSekem.toFixed(isTechnion ? 2 : 1)} ➔ {currentSekem.toFixed(isTechnion ? 2 : 1)}
									{currentSekem > analysis.userSekem && (
										<span className="text-[#205739] ml-1">
											(+{(currentSekem - analysis.userSekem).toFixed(isTechnion ? 2 : 1)})
										</span>
									)}
								</span>
							</div>
						</div>
						<div className="text-[11px] text-[#8A847C]">
							{currentSekem >= threshold
								? `עובר את הסף ב-${rawGap.toFixed(isTechnion ? 2 : 1)} נקודות`
								: `נותרו ${Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נקודות לסף`}
						</div>
					</div>

					{/* 4. Admission Status */}
					<div
						className={`p-4 rounded-2xl border space-y-2 shadow-2xs ${
							isAccepted
								? 'bg-[#EBF4EE] border-[#C6DFCE] text-[#205739]'
								: isBorderline
								? 'bg-[#FDF6E8] border-[#ECDAB6] text-[#825B15]'
								: 'bg-[#FDF1EE] border-[#F1CAC1] text-[#9B3327]'
						}`}
					>
						<div className="flex items-center justify-between text-xs font-bold">
							<span className="flex items-center gap-1.5">
								{isAccepted ? (
									<CheckCircle2 className="h-4 w-4 text-[#205739]" />
								) : (
									<AlertCircle className="h-4 w-4" />
								)}
								<span>סטטוס קבלה לתואר</span>
							</span>
						</div>
						<div className="text-base sm:text-lg font-black leading-tight">
							{isAccepted ? 'קבלה מובטחת 🎉' : isBorderline ? 'על סף הקבלה ⚠️' : 'מתחת לסף הנדרש'}
						</div>
						<div className="text-[11px] font-medium opacity-90">
							{isAccepted
								? 'עומד בכל תנאי הסף הנדרשים לרישום'
								: isBorderline
								? `פער קטן של ${Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נקודות בלבד`
								: `נדרש שיפור נוסף של ${Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נק׳`}
						</div>
					</div>
				</div>

				{/* Detailed List of Changed Levers */}
				<div className="space-y-3">
					<h5 className="text-xs font-black text-[#222222] uppercase tracking-wide">
						פירוט כלל המקצועות והבחינות שהותאמו בתרחיש ({summaryChanges.length}):
					</h5>

					{summaryChanges.length === 0 ? (
						<div className="p-5 rounded-2xl bg-white border border-[#E5DFD4] text-center text-xs text-[#66635C]">
							טרם בוצעו שינויים בסימולטור. הזז את הסליידרים או הוסף מקצועות למעלה כדי להתאים את המסלול.
						</div>
					) : (
						<div className="space-y-2">
							{summaryChanges.map((change) => (
								<div
									key={change.id}
									className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E5DFD4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-[#DDD7CC] transition"
								>
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-xl bg-[#FAF8F5] text-[#222222] border border-[#E5DFD4] shrink-0">
											{change.category === 'psychometric' ? (
												<Brain className="h-4 w-4 text-[#1E597B]" />
											) : change.category === 'math' ? (
												<Award className="h-4 w-4 text-[#453D78]" />
											) : (
												<BookOpen className="h-4 w-4 text-[#205739]" />
											)}
										</div>
										<div>
											<div className="flex items-center gap-2 flex-wrap">
												<span className="font-bold text-xs sm:text-sm text-[#222222]">
													{change.name}
												</span>
												<span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#66635C] border border-[#E5DFD4]">
													{change.type}
												</span>
												<span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#222222] border border-[#E5DFD4]">
													{change.unitsLabel}
												</span>
											</div>
											<div className="text-[11px] text-[#8A847C] mt-0.5">
												{change.category === 'bagrut_elective' && change.fromGrade === 0
													? `מקצוע הגברה חדש שנלמד מאפס לציון ${change.toGrade}`
													: `שיפור של ${change.deltaGrade} נקודות בציון`}
											</div>
										</div>
									</div>

									<div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
										{/* Grade Transition in LTR */}
										<div dir="ltr" className="text-left dir-ltr">
											{change.fromGrade > 0 ? (
												<div className="text-xs font-black text-[#222222]">
													<span>{change.fromGrade}</span>
													<span className="text-[#8A847C] mx-1">➔</span>
													<span className="text-[#205739]">{change.toGrade}</span>
													<span className="text-[10px] text-[#205739] ml-1 font-bold">
														(+{change.deltaGrade})
													</span>
												</div>
											) : (
												<div className="text-xs font-black text-[#222222]">
													<span>יעד: {change.toGrade}</span>
												</div>
											)}
										</div>

										{/* Marginal Impact */}
										<div className="shrink-0">
											{change.sekemImpact > 0 ? (
												<span className="px-2.5 py-1 rounded-xl bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE] text-xs font-black flex items-center gap-1 dir-ltr">
													<Sparkles className="h-3 w-3 text-[#205739]" />
													<span>+{change.sekemImpact} סכם</span>
												</span>
											) : (
												<span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#8A847C] border border-[#E5DFD4] text-[10px]">
													הושמט בממוצע המיטבי
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
				<div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DFD4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-4 flex-wrap">
						<div className="flex items-center gap-2 text-xs font-bold text-[#66635C]">
							<Clock className="h-4 w-4 text-[#1E597B]" />
							<span>משך למידה משוער: <strong className="text-[#222222] font-black">{estimatedStudyWeeks} שבועות</strong></span>
						</div>
						<div className="flex items-center gap-2 text-xs font-bold text-[#66635C]">
							<Calendar className="h-4 w-4 text-[#1E597B]" />
							<span>עומס שבועי: <strong className="text-[#222222] font-black">{estimatedWeeklyHours} שעות/שבוע</strong></span>
						</div>
						<div className="flex items-center gap-2 text-xs font-bold text-[#66635C]">
							<BookOpen className="h-4 w-4 text-[#1E597B]" />
							<span>בחינות נדרשות: <strong className="text-[#222222] font-black">{summaryChanges.length} בחינות</strong></span>
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
									? 'bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE]'
									: 'bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white border border-[#3C3C3C]'
							}`}
						>
							{isSavingCustomTrack ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin text-white" />
									<span>שומר מסלול במסד הנתונים...</span>
								</>
							) : savedCustomTrackSuccess ? (
								<>
									<BookmarkCheck className="h-4 w-4 text-[#205739]" />
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
					<div className="p-4 rounded-2xl bg-[#EBF4EE] border border-[#C6DFCE] text-[#205739] text-xs font-bold flex items-center justify-between gap-3 flex-wrap animate-in fade-in duration-200">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="h-5 w-5 text-[#205739] shrink-0" />
							<span>
								המסלול המותאם אישית נשמר בהצלחה במסד הנתונים! תוכל לצפות בו בכל עת בעמוד המסלולים השמורים.
							</span>
						</div>
						<div className="flex items-center gap-3 shrink-0">
							<Link
								href="/saved-tracks"
								className="px-3 py-1.5 rounded-xl bg-white text-[#205739] border border-[#C6DFCE] hover:bg-[#FAF8F5] transition text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
							>
								<span>מעבר למסלולים שמורים</span>
								<ArrowLeft className="h-3.5 w-3.5" />
							</Link>
						</div>
					</div>
				)}

				{savedCustomTrackError && (
					<div className="p-4 rounded-2xl bg-[#FDF1EE] border border-[#F1CAC1] text-[#9B3327] text-xs font-bold flex items-center gap-2">
						<AlertCircle className="h-5 w-5 shrink-0" />
						<span>{savedCustomTrackError}</span>
					</div>
				)}
			</div>

			{/* Action CTA: Apply to My Plan */}
			{onApplyScenario && (
				<div className="pt-2 flex items-center justify-between flex-wrap gap-4 border-t border-[#EAE5DA]">
					<div className="text-xs text-[#66635C] flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-[#1E597B]" />
						<span>
							מצאת שילוב ציונים ומקצועות שמביא אותך לקבלה? לחץ כדי לעדכן את תוכנית העבודה שלך.
						</span>
					</div>

					<button
						type="button"
						onClick={() => onApplyScenario(simulatedPsych, activeEffectiveSubjects, currentSekem)}
						className="px-6 py-3.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
					>
						<span>החל תרחיש זה על מסלול השיפור שלי</span>
						<ArrowLeft className="h-4 w-4" />
					</button>
				</div>
			)}

			{/* Modal: Add Subject to Improvement List ("הוסף מקצוע") */}
			{isAddSubjectModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
					<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-7 max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-6 dir-rtl text-right shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
						{/* Header */}
						<div className="flex items-center justify-between border-b border-[#EAE5DA] pb-4">
							<div className="flex items-center gap-2.5">
								<div className="p-2 rounded-xl bg-[#EFF6FA] text-[#1E597B] border border-[#C5DFED]">
									<Plus className="h-5 w-5" />
								</div>
								<div>
									<h3 className="text-base sm:text-lg font-black text-[#222222]">
										הוספת מקצוע לשיפור בסימולטור
									</h3>
									<p className="text-xs text-[#66635C]">
										בחר מקצוע מתעודת הבגרות הקיימת שלך, או הוסף מקצוע הגברה 5 יח״ל חדש
									</p>
								</div>
							</div>

							<button
								type="button"
								onClick={() => setIsAddSubjectModalOpen(false)}
								className="p-1.5 text-[#8A847C] hover:text-[#222222] hover:bg-[#FAF8F5] rounded-xl transition cursor-pointer"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Section 1: Inactive Existing Subjects from User Profile */}
						<div className="space-y-3">
							<span className="text-xs font-black text-[#222222] block">
								מקצועות מתעודת הבגרות שלך (לשיפור ציון):
							</span>

							<div className="space-y-2">
								{/* Math Option if not active */}
								{!isMathActive && (
									<div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-between gap-3 hover:border-[#D5CFC2] transition">
										<div className="space-y-0.5">
											<div className="flex items-center gap-2">
												<span className="text-xs font-black text-[#222222]">מתמטיקה</span>
												<span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#1E597B] border border-[#E5DFD4]">
													{userProfile.mathUnits || 4} יח״ל
												</span>
											</div>
											<span className="text-[11px] text-[#66635C] block">
												ציון קיים: {userProfile.mathGrade || 80}
											</span>
										</div>

										<button
											type="button"
											onClick={() => {
												setIsMathActive(true);
												setSimulatedMathGrade(Math.min(95, (userProfile.mathGrade || 80) + 15));
												setIsAddSubjectModalOpen(false);
											}}
											className="px-3 py-1.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
										>
											+ בחר לשיפור
										</button>
									</div>
								)}

								{/* Other Inactive Subjects */}
								{inactiveExistingSubjects.map((s) => (
									<div
										key={s.id}
										className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-between gap-3 hover:border-[#D5CFC2] transition"
									>
										<div className="space-y-0.5">
											<div className="flex items-center gap-2">
												<span className="text-xs font-black text-[#222222]">{s.name}</span>
												<span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#66635C] border border-[#E5DFD4]">
													{s.units} יח״ל
												</span>
											</div>
											<span className="text-[11px] text-[#66635C] block">
												ציון קיים: {s.originalGrade}
											</span>
										</div>

										<button
											type="button"
											onClick={() => {
												handleAddExistingSubjectToActive(s.name);
												setIsAddSubjectModalOpen(false);
											}}
											className="px-3 py-1.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
										>
											+ בחר לשיפור
										</button>
									</div>
								))}

								{isMathActive && inactiveExistingSubjects.length === 0 && (
									<div className="p-3 text-center text-xs text-[#8A847C] bg-[#FAF8F5] rounded-xl border border-[#E5DFD4]">
										כל המקצועות מתעודת הבגרות שלך כבר נמצאים ברשימת השיפורים.
									</div>
								)}
							</div>
						</div>

						{/* Section 2: Popular 5-Unit Electives */}
						<div className="space-y-3 pt-3 border-t border-[#EAE5DA]">
							<div className="space-y-0.5">
								<span className="text-xs font-black text-[#222222] block">
									הגברות פופולריות (5 יח״ל) להעלאת ממוצע הבגרות:
								</span>
								<span className="text-[11px] text-[#66635C]">
									הוספת מקצוע מוגבר חדש מעניקה בונוס אוניברסיטאי של 20-25 נקודות ומקפיצה את ממוצע הבגרות
								</span>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{POPULAR_5U_ELECTIVES.map((elective) => {
									const isAlreadyActive = simulatedList.some(
										(s) => s.name === elective.name && s.isActive
									);
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
													? 'bg-[#FAF8F5] text-[#8A847C] border-[#E5DFD4] cursor-not-allowed opacity-60'
													: 'bg-[#FAF8F5] hover:bg-white text-[#222222] border-[#E5DFD4] hover:border-[#3C3C3C] shadow-2xs'
											}`}
										>
											<span>{elective.label}</span>
											{isAlreadyActive ? (
												<span className="text-[10px] text-[#8A847C]">כבר ברשימה</span>
											) : (
												<Plus className="h-3.5 w-3.5 text-[#3C3C3C]" />
											)}
										</button>
									);
								})}
							</div>
						</div>

						{/* Section 3: Pick other subject from Ministry Catalog */}
						<div className="pt-3 border-t border-[#EAE5DA]">
							<button
								type="button"
								onClick={() => {
									setIsAddSubjectModalOpen(false);
									setIsSubjectModalOpen(true);
								}}
								className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF8F5] text-[#66635C] hover:text-[#222222] text-xs font-bold rounded-xl border border-dashed border-[#DDD7CC] transition flex items-center justify-center gap-2 cursor-pointer"
							>
								<BookOpen className="h-4 w-4" />
								<span>בחר מקצוע אחר מקטלוג משרד החינוך (40+ מקצועות)...</span>
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
			/>
		</div>
	);
}
