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
	Check
} from 'lucide-react';
import { ProgramGapAnalysis, UserAcademicProfile } from '@/utils/analysis/gapAnalyzer';
import {
	calculateMultiInstitutionSekem,
	InstitutionSekemResult,
	UnifiedCalculationInput
} from '@/utils/calculators/multiCalculator';
import { SubjectInput } from '@/utils/calculators/bguCalculator';
import { getRealisticPsychometricCeiling } from '@/utils/analysis/trackGenerator';

interface WhatIfSimulatorProps {
	analysis: ProgramGapAnalysis;
	userProfile: UserAcademicProfile;
	institutionResult: InstitutionSekemResult;
	onApplyScenario?: (customPsych: number, customSubjects: SubjectInput[], simulatedSekem: number) => void;
}

export default function WhatIfSimulator({
	analysis,
	userProfile,
	institutionResult,
	onApplyScenario
}: WhatIfSimulatorProps) {
	// Baseline values
	const initialPsych = userProfile.psychometricGeneral > 0 ? userProfile.psychometricGeneral : 600;
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
	const [simulatedSubjects, setSimulatedSubjects] = useState<SubjectInput[]>(userProfile.bagrutSubjects || []);
	const [isMathUpgradedTo5, setIsMathUpgradedTo5] = useState<boolean>(userProfile.mathUnits === 5);
	const [simulatedMathGrade, setSimulatedMathGrade] = useState<number>(userProfile.mathGrade || 80);
	const [showDetailedSubjects, setShowDetailedSubjects] = useState<boolean>(false);

	// Reset state when analysis target changes
	useEffect(() => {
		setSimulatedPsych(initialPsych);
		setSimulatedSubjects(userProfile.bagrutSubjects || []);
		setIsMathUpgradedTo5(userProfile.mathUnits === 5);
		setSimulatedMathGrade(userProfile.mathGrade || 80);
	}, [analysis.target.program.id, initialPsych, userProfile]);

	// Weakest subjects for individual sliders (grades under 88)
	const weakSubjects = useMemo(() => {
		return simulatedSubjects
			.map((sub, index) => ({ sub, index }))
			.filter(
				({ sub }) =>
					sub.grade < 88 &&
					!sub.name.includes('מתמטיקה') &&
					!sub.name.includes('אנגלית')
			)
			.slice(0, 3);
	}, [simulatedSubjects]);

	// Run Real-Time Calculation using exact university engine
	const simulatedSekemResult = useMemo(() => {
		const updatedSubjects = simulatedSubjects.map((s) => {
			if (s.name.includes('מתמטיקה')) {
				return {
					...s,
					units: isMathUpgradedTo5 ? 5 : userProfile.mathUnits || 4,
					grade: simulatedMathGrade
				};
			}
			return s;
		});

		// Estimate quant/verbal proportionally to general psychometric jump
		const psychRatio = simulatedPsych / (initialPsych || 600);
		const baseQuant = userProfile.psychometricQuant || Math.round(initialPsych / 5);
		const simulatedQuant = Math.min(150, Math.max(50, Math.round(baseQuant * psychRatio)));

		const calcInput: UnifiedCalculationInput = {
			bagrutSubjects: updatedSubjects,
			psychometricGeneral: simulatedPsych,
			psychometricQuant: simulatedQuant,
			psychometricVerbal: userProfile.psychometricVerbal,
			psychometricEnglish: userProfile.psychometricEnglish,
			mathUnits: isMathUpgradedTo5 ? 5 : userProfile.mathUnits || 4,
			mathGrade: simulatedMathGrade,
			physicsUnits: userProfile.physicsUnits,
			physicsGrade: userProfile.physicsGrade
		};

		const multiRes = calculateMultiInstitutionSekem(calcInput, [analysis.target.calculatorId]);
		const targetInst = multiRes.find((r) => r.institutionId === analysis.target.calculatorId) || multiRes[0] || institutionResult;

		let sekem = targetInst.generalSekem;
		if (analysis.relevantSekemType === 'engineering' && targetInst.engineeringSekem) {
			sekem = targetInst.engineeringSekem;
		} else if (analysis.relevantSekemType === 'management' && targetInst.managementSekem) {
			sekem = targetInst.managementSekem;
		}

		return {
			sekem,
			bagrutAverage: targetInst.bagrutAverage,
			instRes: targetInst
		};
	}, [
		simulatedSubjects,
		simulatedPsych,
		isMathUpgradedTo5,
		simulatedMathGrade,
		initialPsych,
		userProfile,
		analysis.target.calculatorId,
		analysis.relevantSekemType
	]);

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

	// Preset Scenarios Handlers
	const handlePresetPsychOnly = () => {
		// Calculate psychometric needed to close gap
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

		// Modest psych jump
		const halfDelta = Math.ceil((Math.abs(analysis.gap) * 0.5) * multiplier);
		const targetPsych = Math.min(realisticCeiling, initialPsych + halfDelta);
		setSimulatedPsych(targetPsych);

		// Boost first 2 weak subjects
		const updated = simulatedSubjects.map((s) => {
			if (s.grade < 88 && !s.name.includes('מתמטיקה') && !s.name.includes('אנגלית')) {
				return { ...s, grade: Math.min(94, s.grade + 18) };
			}
			return s;
		});
		setSimulatedSubjects(updated);
	};

	const handlePresetReset = () => {
		setSimulatedPsych(initialPsych);
		setSimulatedSubjects(userProfile.bagrutSubjects || []);
		setIsMathUpgradedTo5(userProfile.mathUnits === 5);
		setSimulatedMathGrade(userProfile.mathGrade || 80);
	};

	const handleSubjectGradeChange = (originalIndex: number, newGrade: number) => {
		const updated = [...simulatedSubjects];
		updated[originalIndex] = { ...updated[originalIndex], grade: newGrade };
		setSimulatedSubjects(updated);
	};

	return (
		<div className="bg-slate-900/95 border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 dir-rtl text-right relative overflow-hidden">
			{/* Ambient background glow */}
			<div className="absolute top-0 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
			<div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

			{/* Section Header */}
			<div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
				<div className="space-y-1.5">
					<div className="flex items-center gap-2">
						<span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black rounded-lg flex items-center gap-1.5">
							<Sliders className="h-3.5 w-3.5 text-cyan-400" />
							<span>סימולטור ״מה אם״ אינטראקטיבי</span>
						</span>
						<span className="text-xs font-bold text-slate-400">
							{analysis.target.institutionName} • {analysis.target.program.fieldOfStudy}
						</span>
					</div>
					<h3 className="text-xl sm:text-2xl font-black text-white">
						שחק עם הציונים וראה את פער הסכם נסגר בשידור חי 🎛️
					</h3>
					<p className="text-xs sm:text-sm text-slate-300">
						הזז את הסליידרים ובדוק בדיוק איזה ציון פסיכומטרי או שדרוג בגרות יביאו אותך לקבלה ישירה.
					</p>
				</div>

				{/* Quick Preset Buttons */}
				<div className="flex items-center gap-2 flex-wrap shrink-0">
					<button
						type="button"
						onClick={handlePresetPsychOnly}
						className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
						title="חשב פסיכומטרי בלבד לסגירת הפער"
					>
						<Zap className="h-3.5 w-3.5 text-amber-400" />
						<span>פסיכומטרי בלבד</span>
					</button>

					<button
						type="button"
						onClick={handlePresetBalanced}
						className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
						title="איזון בין פסיכומטרי לבגרויות"
					>
						<Award className="h-3.5 w-3.5 text-emerald-400" />
						<span>איזון 50/50</span>
					</button>

					<button
						type="button"
						onClick={handlePresetReset}
						className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1"
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
			<div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold text-slate-400">הסכם המשוקלל בסימולציה:</span>
						<span className="text-2xl sm:text-3xl font-black text-cyan-300 dir-ltr">
							{currentSekem.toFixed(isTechnion ? 2 : 1)}
						</span>
						<span className="text-xs text-slate-500">
							(התחלת ב-{analysis.userSekem})
						</span>
					</div>

					<div className="flex items-center gap-3">
						<div
							className={`px-4 py-2 rounded-2xl border text-xs font-black flex items-center gap-1.5 ${
								isAccepted
									? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
									: isBorderline
									? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
									: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
							}`}
						>
							{isAccepted ? (
								<>
									<CheckCircle2 className="h-4 w-4 text-emerald-400" />
									<span>התקבלת! (+{rawGap.toFixed(isTechnion ? 2 : 1)} נקודות ביטחון) 🎉</span>
								</>
							) : isBorderline ? (
								<>
									<AlertCircle className="h-4 w-4 text-amber-400" />
									<span>על הגבול (חסרות רק {Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נק׳)</span>
								</>
							) : (
								<>
									<AlertCircle className="h-4 w-4 text-rose-400" />
									<span>נותר פער של {Math.abs(rawGap).toFixed(isTechnion ? 2 : 1)} נקודות</span>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Animated Progress Bar */}
				<div className="space-y-1.5">
					<div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
						<div
							className={`h-full rounded-full transition-all duration-300 ${
								isAccepted
									? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30'
									: isBorderline
									? 'bg-gradient-to-r from-amber-500 to-yellow-400'
									: 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500'
							}`}
							style={{ width: `${Math.max(5, progressPercent)}%` }}
						/>
					</div>

					<div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
						<span>הסכם המקורי שלך ({analysis.userSekem})</span>
						<span className="text-cyan-400">סגירת פער: {progressPercent}%</span>
						<span>סף הקבלה הנדרש ({threshold})</span>
					</div>
				</div>
			</div>

			{/* ========================================================================= */}
			{/* CONTROLS: PSYCHOMETRIC & BAGRUT SLIDERS */}
			{/* ========================================================================= */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Control 1: Psychometric Slider */}
				<div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Brain className="h-5 w-5 text-cyan-400" />
							<span className="text-sm font-black text-white">ציון פסיכומטרי</span>
						</div>
						<div className="text-left dir-ltr">
							<span className="text-xl font-black text-cyan-300">{simulatedPsych}</span>
							{simulatedPsych > initialPsych && (
								<span className="text-xs text-emerald-400 font-bold ml-1.5">
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
							className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
						/>
						<div className="flex items-center justify-between text-[11px] text-slate-500">
							<span>ציון קיים: {initialPsych}</span>
							<span className="text-cyan-400 font-bold">
								תקרה ריאלית מומלצת: {realisticCeiling}
							</span>
							<span>מקסימום: 800</span>
						</div>
					</div>

					{simulatedPsych > realisticCeiling && (
						<div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-medium flex items-center gap-1.5">
							<AlertCircle className="h-3.5 w-3.5 shrink-0" />
							<span>
								יעד של {simulatedPsych} דורש זינוק חריג. אנו ממליצים לשלב שיפור בגרויות כדי להישאר בטווח הבטוח.
							</span>
						</div>
					)}
				</div>

				{/* Control 2: Bagrut Math & Weak Subjects */}
				<div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<BookOpen className="h-5 w-5 text-indigo-400" />
							<span className="text-sm font-black text-white">ממוצע בגרות משוקלל</span>
						</div>
						<div className="text-left dir-ltr">
							<span className="text-xl font-black text-indigo-300">
								{simulatedSekemResult.bagrutAverage.toFixed(2)}
							</span>
							{simulatedSekemResult.bagrutAverage > (institutionResult.bagrutAverage || 0) && (
								<span className="text-xs text-emerald-400 font-bold ml-1.5">
									(+{(simulatedSekemResult.bagrutAverage - (institutionResult.bagrutAverage || 0)).toFixed(2)})
								</span>
							)}
						</div>
					</div>

					{/* Math 5 Units Upgrade Lever */}
					<div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="math5Upgrade"
									checked={isMathUpgradedTo5}
									onChange={(e) => setIsMathUpgradedTo5(e.target.checked)}
									className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
								/>
								<label htmlFor="math5Upgrade" className="text-xs font-bold text-slate-200 cursor-pointer">
									שדרוג מתמטיקה ל-5 יח״ל (+35 נק׳ בונוס + בונוס הנדסה)
								</label>
							</div>
							<span className="text-xs text-cyan-400 font-black dir-ltr">
								{isMathUpgradedTo5 ? '5 יח״ל' : `${userProfile.mathUnits || 4} יח״ל`}
							</span>
						</div>

						{isMathUpgradedTo5 && (
							<div className="space-y-1 pt-1 border-t border-slate-800/80">
								<div className="flex items-center justify-between text-xs text-slate-300">
									<span>ציון צפוי ב-5 יח״ל:</span>
									<span className="font-bold text-white">{simulatedMathGrade}</span>
								</div>
								<input
									type="range"
									min={70}
									max={100}
									step={1}
									value={simulatedMathGrade}
									onChange={(e) => setSimulatedMathGrade(Number(e.target.value))}
									className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
								/>
							</div>
						)}
					</div>

					{/* Toggle to expand specific weak subjects */}
					{weakSubjects.length > 0 && (
						<button
							type="button"
							onClick={() => setShowDetailedSubjects(!showDetailedSubjects)}
							className="text-xs text-slate-400 hover:text-cyan-400 font-bold flex items-center gap-1 transition"
						>
							<span>{showDetailedSubjects ? 'הסתר שדרוג מקצועות נקודתיים' : 'כוונן מקצועות בגרות חלשים (תנ״ך, ספרות...)'}</span>
							{showDetailedSubjects ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
						</button>
					)}

					{/* Specific Subjects Sliders */}
					{showDetailedSubjects && (
						<div className="space-y-3 pt-2 border-t border-slate-800">
							{weakSubjects.map(({ sub, index }) => (
								<div key={index} className="space-y-1">
									<div className="flex items-center justify-between text-xs">
										<span className="text-slate-300 font-medium">
											{sub.name} ({sub.units} יח״ל):
										</span>
										<span className="font-bold text-cyan-300 dir-ltr">{sub.grade}</span>
									</div>
									<input
										type="range"
										min={sub.grade}
										max={98}
										step={2}
										value={sub.grade}
										onChange={(e) => handleSubjectGradeChange(index, Number(e.target.value))}
										className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
									/>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Action CTA: Apply to My Plan */}
			{onApplyScenario && (
				<div className="pt-2 flex items-center justify-between flex-wrap gap-4 border-t border-slate-800">
					<div className="text-xs text-slate-400 flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-cyan-400" />
						<span>מצאת שילוב שמתאים לך? לחץ להחלת היעדים על תוכנית הלמידה בשלב 5.</span>
					</div>

					<button
						type="button"
						onClick={() => onApplyScenario(simulatedPsych, simulatedSubjects, currentSekem)}
						className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
					>
						<span>החל תרחיש זה על מסלול השיפור שלי</span>
						<ArrowLeft className="h-4 w-4" />
					</button>
				</div>
			)}
		</div>
	);
}
