'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
	Info
} from 'lucide-react';
import { ProgramGapAnalysis, UserAcademicProfile } from '@/utils/analysis/gapAnalyzer';
import {
	calculateMultiInstitutionSekem,
	InstitutionSekemResult,
	UnifiedCalculationInput
} from '@/utils/calculators/multiCalculator';
import { SubjectInput } from '@/utils/calculators/bguCalculator';
import { getRealisticPsychometricCeiling } from '@/utils/analysis/trackGenerator';
import SubjectSelectModal from '@/components/calculator/SubjectSelectModal';
import { BagrutSubjectOption } from '@/data/bagrutSubjects';
import MultiUniversityAdmissionGrid, { InstitutionSimulatedState } from '@/components/flow/MultiUniversityAdmissionGrid';

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

export default function WhatIfSimulator({
	analysis,
	userProfile,
	institutionResult,
	onApplyScenario
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
	const [simulatedPsych, setSimulatedPsych] = useState<number>(initialPsych);
	const [isMathUpgradedTo5, setIsMathUpgradedTo5] = useState<boolean>(userProfile.mathUnits === 5);
	const [simulatedMathGrade, setSimulatedMathGrade] = useState<number>(userProfile.mathGrade || 80);

	// Simulated Subjects List (includes original + custom added)
	const [simulatedList, setSimulatedList] = useState<SimulatedSubjectItem[]>(() => {
		return (userProfile.bagrutSubjects || []).map((s, idx) => ({
			id: `orig-${idx}-${s.name}`,
			name: s.name,
			units: s.units,
			originalUnits: s.units,
			originalGrade: s.grade,
			simulatedGrade: s.grade,
			isCustomAdded: false,
			isActive: s.grade < 85 && !s.name.includes('מתמטיקה') // auto-activate weak subjects
		}));
	});

	// Modal State for picking any subject from catalog
	const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
	const [selectedExistingToAdd, setSelectedExistingToAdd] = useState<string>('');
	const [showAllUniversities, setShowAllUniversities] = useState<boolean>(true);

	// Reset state when analysis target changes
	useEffect(() => {
		setSimulatedPsych(initialPsych);
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
				isActive: s.grade < 85 && !s.name.includes('מתמטיקה')
			}))
		);
	}, [analysis.target.program.id, initialPsych, userProfile]);

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

	// Active Subjects for current simulation
	const activeEffectiveSubjects = useMemo(() => {
		return simulatedList
			.filter((s) => !s.isCustomAdded || s.isActive)
			.map((s) => ({
				name: s.name,
				units: s.units,
				grade: s.isActive ? s.simulatedGrade : s.originalGrade
			}));
	}, [simulatedList]);

	// Overall Simulated Result
	const simulatedSekemResult = useMemo(() => {
		return calculateSekemForSubjectList(
			activeEffectiveSubjects,
			simulatedPsych,
			isMathUpgradedTo5,
			simulatedMathGrade
		);
	}, [activeEffectiveSubjects, simulatedPsych, isMathUpgradedTo5, simulatedMathGrade]);

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
					units: s.units,
					grade: s.isActive ? s.simulatedGrade : s.originalGrade
				};
			});

		const testRes = calculateSekemForSubjectList(
			testSubjects,
			simulatedPsych,
			isMathUpgradedTo5,
			simulatedMathGrade
		);

		const sekemDelta = Math.max(0, Math.round((currentSekem - testRes.sekem) * 10) / 10);
		const bagrutDelta = Math.max(0, Math.round((simulatedSekemResult.bagrutAverage - testRes.bagrutAverage) * 100) / 100);

		return { sekemDelta, bagrutDelta };
	};

	// Math upgrade marginal impact
	const mathUpgradeImpact = useMemo(() => {
		const testRes = calculateSekemForSubjectList(
			activeEffectiveSubjects,
			simulatedPsych,
			userProfile.mathUnits === 5,
			userProfile.mathGrade || 80
		);
		return Math.max(0, Math.round((currentSekem - testRes.sekem) * 10) / 10);
	}, [activeEffectiveSubjects, simulatedPsych, currentSekem, userProfile]);

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
			isMathUpgradedTo5,
			simulatedMathGrade
		);
		return Math.max(0, Math.round((currentSekem - resWithOrigPsych.sekem) * 10) / 10);
	}, [currentSekem, activeEffectiveSubjects, initialPsych, hasOriginalPsych, isMathUpgradedTo5, simulatedMathGrade]);

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
				simulatedList.map((s) => (s.id === id ? { ...s, isActive: false, simulatedGrade: s.originalGrade } : s))
			);
		}
	};

	// Active subjects currently displayed in the simulation cards
	const activeDisplaySubjects = simulatedList.filter(
		(s) => (s.isActive || s.isCustomAdded) && !s.name.includes('מתמטיקה')
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
		setSimulatedPsych(initialPsych);
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
				isActive: s.grade < 85 && !s.name.includes('מתמטיקה')
			}))
		);
	};

	return (
		<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 dir-rtl text-right relative overflow-hidden">
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
			{/* LIVE PROGRESS GAUGE */}
			{/* ========================================================================= */}
			<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-3xl p-5 sm:p-6 space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold text-[#66635C]">הסכם המשוקלל בסימולציה:</span>
						<span className="text-2xl sm:text-3xl font-black text-[#222222] dir-ltr">
							{currentSekem.toFixed(isTechnion ? 2 : 1)}
						</span>
						<span className="text-xs text-[#8A847C]">
							(התחלת ב-{analysis.userSekem})
						</span>
					</div>

					<div className="flex items-center gap-3">
						<div
							className={`px-4 py-2 rounded-2xl border text-xs font-black flex items-center gap-1.5 ${
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
									<span>התקבלת! (+{rawGap.toFixed(isTechnion ? 2 : 1)} נקודות ביטחון) 🎉</span>
								</>
							) : isBorderline ? (
								<>
									<AlertCircle className="h-4 w-4 text-[#825B15]" />
									<span>על הגבול (חסרות רק {Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נק׳)</span>
								</>
							) : (
								<>
									<AlertCircle className="h-4 w-4 text-[#9B3327]" />
									<span>נותר פער של {Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נקודות</span>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="space-y-1.5">
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

					<div className="flex items-center justify-between text-[11px] font-bold text-[#66635C]">
						<span>הסכם המקורי שלך ({analysis.userSekem})</span>
						<span className="text-[#222222] font-black">סגירת פער: {progressPercent}%</span>
						<span>סף הקבלה הנדרש ({threshold})</span>
					</div>

					{/* Breakdown of sources of Sekem increase */}
					{(totalPsychSekemDelta > 0 || totalBagrutSekemDelta > 0) && (
						<div className="pt-2 border-t border-[#EAE5DA] flex items-center justify-end gap-2 flex-wrap text-xs">
							<span className="text-[#66635C] text-[11px]">מקורות השיפור:</span>
							{totalPsychSekemDelta > 0 && (
								<span className="px-2.5 py-0.5 rounded-lg bg-[#EFF6FA] text-[#1E597B] border border-[#C5DFED] text-[11px] font-black dir-ltr flex items-center gap-1">
									<Brain className="h-3 w-3 text-[#1E597B]" />
									<span>+{totalPsychSekemDelta} נק׳ מפסיכומטרי</span>
								</span>
							)}
							{totalBagrutSekemDelta > 0 && (
								<span className="px-2.5 py-0.5 rounded-lg bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB] text-[11px] font-black dir-ltr flex items-center gap-1">
									<BookOpen className="h-3 w-3 text-[#453D78]" />
									<span>+{totalBagrutSekemDelta} נק׳ מבגרות</span>
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{/* ========================================================================= */}
			{/* MULTI-UNIVERSITY LIVE IMPACT MATRIX */}
			{/* ========================================================================= */}
			<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-3xl p-5 sm:p-6 space-y-4">
				<div className="flex items-center justify-between flex-wrap gap-2">
					<div className="flex items-center gap-2.5">
						<span className="p-1.5 rounded-lg bg-white text-[#222222] border border-[#E5DFD4]">
							<TrendingUp className="h-4 w-4" />
						</span>
						<div>
							<h4 className="text-sm sm:text-base font-black text-[#222222] flex items-center gap-2">
								<span>השפעה רב-אוניברסיטאית בזמן אמת</span>
								<span className="hidden sm:inline-block text-[11px] font-normal text-[#66635C]">
									(כל שינוי בבגרות או בפסיכומטרי מתעדכן מיד בכל 8 האוניברסיטאות)
								</span>
							</h4>
						</div>
					</div>

					<button
						type="button"
						onClick={() => setShowAllUniversities(!showAllUniversities)}
						className="text-xs font-bold text-[#66635C] hover:text-[#222222] transition flex items-center gap-1 cursor-pointer"
					>
						<span>{showAllUniversities ? 'כווץ תצוגה' : 'הצג את כל 8 האוניברסיטאות'}</span>
						{showAllUniversities ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</button>
				</div>

				{showAllUniversities && (
					<div className="pt-1">
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

			{/* ========================================================================= */}
			{/* CONTROLS: PSYCHOMETRIC & BAGRUT LAB */}
			{/* ========================================================================= */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
				{/* 1. PSYCHOMETRIC SLIDER (4 COLS) */}
				<div className="lg:col-span-4 bg-white border border-[#E5DFD4] rounded-3xl p-5 sm:p-6 space-y-5 flex flex-col justify-between shadow-2xs">
					<div className="space-y-4">
						<div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3">
							<div className="flex items-center gap-2">
								<Brain className="h-5 w-5 text-[#222222]" />
								<div>
									<span className="text-sm font-black text-[#222222] block">ציון פסיכומטרי</span>
									{!hasOriginalPsych && (
										<span className="text-[10px] text-[#825B15] font-bold block">
											(טרם נבחנת — סימולציית יעד ראשון)
										</span>
									)}
								</div>
							</div>
							<div className="text-left dir-ltr">
								<span className="text-xl font-black text-[#222222]">{simulatedPsych}</span>
								{hasOriginalPsych && simulatedPsych > initialPsych && (
									<span className="text-xs text-[#205739] font-bold ml-1.5">
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
								className="w-full h-2 bg-[#EAE5DA] rounded-lg appearance-none cursor-pointer accent-[#222222]"
							/>
							<div className="flex items-center justify-between text-[11px] text-[#8A847C] font-medium">
								<span>{hasOriginalPsych ? `קיים: ${initialPsych}` : 'התחלה: 450'}</span>
								<span className="text-[#1E597B] font-bold">תקרה מומלצת: {realisticCeiling}</span>
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
					</div>

					{/* Math 5 Units Upgrade Lever */}
					<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<input
									type="checkbox"
									id="math5Upgrade"
									checked={isMathUpgradedTo5}
									onChange={(e) => setIsMathUpgradedTo5(e.target.checked)}
									className="w-4 h-4 rounded text-[#222222] bg-white border-[#E5DFD4] focus:ring-0 cursor-pointer"
								/>
								<label htmlFor="math5Upgrade" className="text-xs font-black text-[#222222] cursor-pointer">
									שדרוג מתמטיקה ל-5 יח״ל (+35 בונוס)
								</label>
							</div>
							<span className="text-xs text-[#1E597B] font-black dir-ltr">
								{isMathUpgradedTo5 ? '5 יח״ל' : `${userProfile.mathUnits || 4} יח״ל`}
							</span>
						</div>

						<div className="space-y-2 pt-2 border-t border-[#EAE5DA]">
							<div className="flex items-center justify-between text-xs text-[#66635C]">
								<span>ציון מתמטיקה ({isMathUpgradedTo5 ? '5 יח״ל' : `${userProfile.mathUnits || 4} יח״ל`}):</span>
								<span className="font-black text-[#222222] dir-ltr">{simulatedMathGrade}</span>
							</div>
							<input
								type="range"
								min={60}
								max={100}
								step={1}
								value={simulatedMathGrade}
								onChange={(e) => setSimulatedMathGrade(Number(e.target.value))}
								className="w-full h-2 bg-[#EAE5DA] rounded-lg appearance-none cursor-pointer accent-[#222222]"
							/>
							{/* Math Marginal Impact Badge */}
							{mathUpgradeImpact > 0 && (
								<div className="flex items-center justify-between text-[11px] bg-[#EBF4EE] border border-[#C6DFCE] rounded-xl px-2.5 py-1 text-[#205739] font-bold">
									<span>השפעת שיפור מתמטיקה על הסכם:</span>
									<span className="font-black dir-ltr">+{mathUpgradeImpact} נק׳</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* 2. BAGRUT SIMULATION LAB (8 COLS) */}
				<div className="lg:col-span-8 bg-white border border-[#E5DFD4] rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xs">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE5DA] pb-4">
						<div className="flex items-center gap-2">
							<BookOpen className="h-5 w-5 text-[#222222]" />
							<div>
								<span className="text-sm font-black text-[#222222] block">מעבדת מקצועות בגרות והגברות</span>
								<span className="text-xs text-[#66635C]">
									בדוק שדרוג מקצועות קיימים או הוספת מקצוע מוגבר (5 יח״ל) חדש
								</span>
							</div>
						</div>

						<div className="flex items-center gap-2 flex-wrap bg-[#FAF8F5] border border-[#E5DFD4] px-3 py-1.5 rounded-xl text-xs">
							<div className="flex items-center gap-1.5">
								<span className="text-[#66635C] font-medium">ממוצע בגרות מיטבי:</span>
								<span className="font-black text-[#222222] dir-ltr text-sm">
									{simulatedSekemResult.bagrutAverage.toFixed(2)}
								</span>
								{simulatedSekemResult.bagrutAverage > (institutionResult.bagrutAverage || 0) && (
									<span className="text-xs text-[#205739] font-bold dir-ltr">
										(+{(simulatedSekemResult.bagrutAverage - (institutionResult.bagrutAverage || 0)).toFixed(2)})
									</span>
								)}
							</div>
							{totalBagrutSekemDelta > 0 && (
								<span className="px-2 py-0.5 rounded-lg bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE] font-black dir-ltr text-[11px] flex items-center gap-1">
									<Sparkles className="h-3 w-3 text-[#205739]" />
									<span>+{totalBagrutSekemDelta} נק׳ סכם מכל הבגרויות</span>
								</span>
							)}
						</div>
					</div>

					{/* Quick Action: Add Popular 5-Unit Elective or Pick Existing */}
					<div className="space-y-3 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5DFD4]">
						<div className="flex items-center justify-between flex-wrap gap-2">
							<span className="text-xs font-black text-[#222222] flex items-center gap-1.5">
								<Plus className="h-3.5 w-3.5 text-[#222222]" />
								<span>הוסף מקצוע לבדיקת מידת ההשפעה:</span>
							</span>

							{/* Dropdown to add an existing subject */}
							{inactiveExistingSubjects.length > 0 && (
								<div className="flex items-center gap-2">
									<select
										value={selectedExistingToAdd}
										onChange={(e) => {
											handleAddExistingSubjectToActive(e.target.value);
										}}
										className="bg-white border border-[#E5DFD4] text-xs font-bold text-[#222222] rounded-xl px-2.5 py-1.5 focus:outline-none"
									>
										<option value="">+ שפר מקצוע קיים מתעודת הבגרות...</option>
										{inactiveExistingSubjects.map((s) => (
											<option key={s.id} value={s.name}>
												{s.name} ({s.units} יח״ל, ציון קיים: {s.originalGrade})
											</option>
										))}
									</select>
								</div>
							)}
						</div>

						{/* Quick Chips for Popular 5-unit subjects */}
						<div className="flex items-center gap-2 flex-wrap pt-1">
							{POPULAR_5U_ELECTIVES.map((elective) => {
								const isAlreadyAdded = simulatedList.some(
									(s) => s.name === elective.name && s.isActive
								);
								return (
									<button
										key={elective.name}
										type="button"
										onClick={() =>
											handleAddPopularElective(elective.name, elective.units, elective.defaultGrade)
										}
										className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
											isAlreadyAdded
												? 'bg-[#3C3C3C] text-white border-[#3C3C3C]'
												: 'bg-white hover:bg-[#F3EFE8] text-[#44423D] hover:text-[#222222] border-[#E5DFD4]'
										}`}
									>
										<span>{elective.label}</span>
										{isAlreadyAdded && <CheckCircle2 className="h-3 w-3 text-white" />}
									</button>
								);
							})}

							<button
								type="button"
								onClick={() => setIsSubjectModalOpen(true)}
								className="px-3 py-1.5 bg-white hover:bg-[#F3EFE8] text-[#66635C] hover:text-[#222222] text-xs font-bold rounded-xl border border-dashed border-[#DDD7CC] transition flex items-center gap-1 cursor-pointer"
							>
								<Plus className="h-3 w-3" />
								<span>מקצוע אחר מהקטלוג...</span>
							</button>
						</div>
					</div>

					{/* Active Subjects List with Sliders and Individual Impact Badges */}
					<div className="space-y-3">
						<span className="text-xs font-black text-[#66635C] block">
							מקצועות בבדיקה פעילה ({activeDisplaySubjects.length}):
						</span>

						{activeDisplaySubjects.length === 0 ? (
							<div className="text-center py-6 px-4 bg-[#FAF8F5] rounded-2xl border border-[#E5DFD4] text-[#8A847C] text-xs">
								בחר מקצוע קיים לשיפור או הוסף מקצוע מוגבר 5 יח״ל מהסרגל למעלה כדי לראות את מידת השפעתו על הסכם.
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								{activeDisplaySubjects.map((item) => {
									const impact = calculateSubjectMarginalImpact(item);
									return (
										<div
											key={item.id}
											className="bg-[#FAF8F5] border border-[#E5DFD4] hover:border-[#D5CFC2] rounded-2xl p-3.5 space-y-3 relative transition"
										>
											{/* Top Row: Name and Badges */}
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="text-xs font-bold text-[#222222]">
														{item.name}
													</span>
													{item.isCustomAdded ? (
														<span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#EFF6FA] text-[#1E597B] border border-[#C5DFED]">
															חדש
														</span>
													) : item.units !== item.originalUnits ? (
														<span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB]">
															שודרג ל-{item.units} יח״ל
														</span>
													) : null}
												</div>

												<button
													type="button"
													onClick={() => handleRemoveSimulatedSubject(item.id)}
													className="text-[#8A847C] hover:text-[#9B3327] transition p-1 cursor-pointer"
													title="הסר מקצוע זה מהסימולציה"
												>
													<Trash2 className="h-3.5 w-3.5" />
												</button>
											</div>

											{/* Units Selector (Pills) */}
											<div className="flex items-center justify-between text-xs">
												<span className="text-[#66635C] text-[11px]">היקף יחידות:</span>
												<div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E5DFD4]">
													{[2, 3, 4, 5].map((u) => {
														const isSelected = item.units === u;
														return (
															<button
																key={u}
																type="button"
																onClick={() => handleUnitsChange(item.id, u)}
																className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
																	isSelected
																		? 'bg-[#3C3C3C] text-white font-black shadow-2xs'
																		: 'text-[#66635C] hover:text-[#222222] hover:bg-[#FAF8F5]'
																}`}
															>
																{u} יח״ל
															</button>
														);
													})}
												</div>
											</div>

											{/* Grade Slider */}
											<div className="space-y-1">
												<div className="flex items-center justify-between text-xs">
													<span className="text-[#66635C]">
														{item.isCustomAdded
															? 'ציון יעד:'
															: `קיים: ${item.originalGrade} ➔ יעד:`}
													</span>
													<div className="text-left dir-ltr">
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

											{/* MARGINAL IMPACT BADGE */}
											<div className="pt-2 border-t border-[#EAE5DA] flex items-center justify-between text-[11px]">
												<span className="text-[#66635C] font-medium">מידת השפעה שולית:</span>
												{impact.sekemDelta > 0 ? (
													<div className="flex items-center gap-1.5 dir-ltr">
														<span className="px-2 py-0.5 rounded-lg bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE] font-black flex items-center gap-1">
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
							</div>
						)}
					</div>
				</div>
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
