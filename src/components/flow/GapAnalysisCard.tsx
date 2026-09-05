'use client';

import React from 'react';
import {
	AlertCircle,
	CheckCircle2,
	XCircle,
	TrendingUp,
	BookOpen,
	Brain,
	Clock,
	Award,
	Sparkles,
	ArrowLeft,
	ArrowRight,
	Check,
	Sliders,
	ExternalLink,
	Building2
} from 'lucide-react';
import { ProgramGapAnalysis, ImprovementOption, UserAcademicProfile } from '../../utils/analysis/gapAnalyzer';
import { getUniversityRegistrationInfo } from '../../utils/universityRegistration';
import { InstitutionSekemResult } from '../../utils/calculators/multiCalculator';
import { SubjectInput } from '../../utils/calculators/bguCalculator';
import WhatIfSimulator from './WhatIfSimulator';

interface GapAnalysisCardProps {
	analysis: ProgramGapAnalysis;
	userProfile?: UserAcademicProfile;
	institutionResult?: InstitutionSekemResult;
	onBackToReport: () => void;
	onSelectNextProgram?: () => void;
	onPlanTrackCTA?: (programTitle: string) => void;
	onApplyScenario?: (customPsych: number, customSubjects: SubjectInput[], simulatedSekem: number) => void;
}

export default function GapAnalysisCard({
	analysis,
	userProfile,
	institutionResult,
	onBackToReport,
	onSelectNextProgram,
	onPlanTrackCTA,
	onApplyScenario
}: GapAnalysisCardProps) {
	const isAccepted = analysis.status === 'accepted';
	const isBorderline = analysis.status === 'borderline';
	const missingPoints = Math.abs(analysis.gap);

	return (
		<div className="space-y-6">
			{/* Back Button and Header */}
			<div className="flex items-center justify-between">
				<button
					onClick={onBackToReport}
					className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
				>
					<ArrowRight className="h-4 w-4" />
					<span>חזרה לדוח הקבלה המלא</span>
				</button>
			</div>

			{/* Hero Card: Program Title & Score Gap */}
			<div
				className={`p-6 rounded-3xl border shadow-2xl space-y-6 ${
					isAccepted
						? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40'
						: isBorderline
						? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40'
						: 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40'
				}`}
			>
				<div className="flex items-start justify-between flex-wrap gap-4">
					<div>
						<div className="flex items-center gap-2 mb-1.5">
							<span className="text-xs font-bold text-cyan-400">
								{analysis.target.institutionName}
							</span>
							<span className="text-slate-600">·</span>
							<span className="text-xs font-bold text-slate-400">
								{analysis.target.program.degreeLevel}
							</span>
						</div>
						<h2 className="text-2xl sm:text-3xl font-black text-white">
							{analysis.target.program.fieldOfStudy}
						</h2>
					</div>

					<div
						className={`px-4 py-2 rounded-2xl border text-sm font-black text-center ${
							isAccepted
								? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
								: isBorderline
								? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
								: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
						}`}
					>
						{isAccepted
							? `התקבלת! (+${analysis.gap} נק׳)`
							: isBorderline
							? `על הגבול (חסרות ${missingPoints} נק׳)`
							: `פער נדרש: ${missingPoints} נקודות`}
					</div>
				</div>

				{/* Score Comparison Matrix */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
						<span className="text-[11px] text-slate-400 font-bold block">
							הסכם שלך ({analysis.relevantSekemLabel})
						</span>
						<span className="text-2xl font-black text-cyan-300 mt-1 block">
							{analysis.userSekem}
						</span>
					</div>

					<div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
						<span className="text-[11px] text-slate-400 font-bold block">סף קבלה רשמי</span>
						<span className="text-2xl font-black text-amber-300 mt-1 block">
							{analysis.threshold ?? 'ללא ציון מספרי'}
						</span>
					</div>

					<div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
						<span className="text-[11px] text-slate-400 font-bold block">סטטוס פער</span>
						<span
							className={`text-2xl font-black mt-1 block ${
								isAccepted
									? 'text-emerald-400'
									: isBorderline
									? 'text-amber-400'
									: 'text-rose-400'
							}`}
						>
							{analysis.gap >= 0 ? `+${analysis.gap}` : `-${missingPoints}`}
						</span>
					</div>
				</div>
			</div>

			{/* Section 1: Prerequisites Check */}
			<div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
				<div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
					<Award className="h-5 w-5 text-indigo-400" />
					<div>
						<h3 className="text-base font-black text-white">בדיקת תנאי סף ודרישות קדם אקדמיות</h3>
						<p className="text-xs text-slate-400">
							מוסדות הלימוד מציבים דרישות סף במתמטיקה, פיזיקה ואנגלית שאינן תלויות רק בציון הסכם
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{analysis.prerequisites.map((prereq) => (
						<div
							key={prereq.id}
							className={`p-4 rounded-2xl border flex items-start gap-3 ${
								prereq.isMet
									? 'bg-emerald-950/10 border-emerald-500/20'
									: 'bg-amber-950/15 border-amber-500/30'
							}`}
						>
							<div
								className={`p-2 rounded-xl mt-0.5 shrink-0 ${
									prereq.isMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
								}`}
							>
								{prereq.isMet ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
							</div>
							<div className="space-y-1 text-xs">
								<div className="flex items-center justify-between gap-2">
									<span className="font-bold text-white">{prereq.name}</span>
									<span
										className={`text-[10px] font-bold px-2 py-0.5 rounded ${
											prereq.isMet
												? 'text-emerald-400 bg-emerald-500/10'
												: 'text-amber-400 bg-amber-500/10'
										}`}
									>
										{prereq.isMet ? 'עומד בדרישה' : 'חסר / דורש מכינה'}
									</span>
								</div>
								<p className="text-slate-300 font-medium">
									דרישה: <span className="text-slate-200">{prereq.required}</span>
								</p>
								<p className="text-slate-400">
									הנתון שלך: <span className="text-slate-300">{prereq.current}</span>
								</p>
								{prereq.notes && <p className="text-amber-300/90 text-[11px] pt-1">{prereq.notes}</p>}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Section 2: Concrete Improvement Levers */}
			{!isAccepted && analysis.improvementOptions.length > 0 && (
				<div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
					<div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
						<div className="flex items-center gap-2.5">
							<Sparkles className="h-5 w-5 text-cyan-400" />
							<div>
								<h3 className="text-base font-black text-white">
									מנופי שיפור לסגירת הפער ({analysis.improvementOptions.length} חלופות)
								</h3>
								<p className="text-xs text-slate-400">
									המערכת חישבה באופן מתמטי כמה נדרש לשפר בכל ערוץ כדי להגיע לסף הקבלה ({analysis.threshold})
								</p>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{analysis.improvementOptions.map((opt) => (
							<ImprovementCard key={opt.id} option={opt} />
						))}
					</div>
				</div>
			)}

			{/* Interactive What-If Simulator */}
			{!isAccepted && userProfile && institutionResult && (
				<WhatIfSimulator
					analysis={analysis}
					userProfile={userProfile}
					institutionResult={institutionResult}
					onApplyScenario={(psych, subs, sekem) => {
						if (onApplyScenario) {
							onApplyScenario(psych, subs, sekem);
						} else if (onPlanTrackCTA) {
							onPlanTrackCTA(analysis.target.program.fieldOfStudy);
						}
					}}
				/>
			)}

			{/* Section 3: Next Step CTA / University Registration if Accepted */}
			{isAccepted ? (
				<div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-6">
					<div className="space-y-1.5 max-w-xl">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
							<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
							<span>סטטוס: קבלה מובטחת לחוג זה!</span>
						</div>
						<h3 className="text-lg sm:text-xl font-black text-white">
							עובר את סף הקבלה — אין צורך בשיפור ציונים 🎉
						</h3>
						<p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
							הסכם שלך עובר את הרף הנדרש. באפשרותך להתקדם ישירות לעמוד ההרשמה הרשמי של האוניברסיטה ולהבטיח את מקומך לשנת הלימודים.
						</p>
					</div>

					<a
						href={
							getUniversityRegistrationInfo(
								analysis.target.institutionName,
								analysis.target.calculatorId,
								analysis.target.program.url
							).registrationUrl
						}
						target="_blank"
						rel="noopener noreferrer"
						className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition hover:scale-[1.02] active:scale-[0.98] shrink-0 flex items-center gap-2"
					>
						<span>מעבר להרשמה ב{analysis.target.institutionName}</span>
						<ExternalLink className="h-4 w-4" />
					</a>
				</div>
			) : (
				<div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-6">
					<div className="space-y-1.5 max-w-xl">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold">
							<Sparkles className="h-3.5 w-3.5 text-cyan-400" />
							<span>השלב הבא: שאלון העדפות ותכנון 3 מסלולים</span>
						</div>
						<h3 className="text-lg sm:text-xl font-black text-white">
							מוכן לתכנן את המסלול האופטימלי עבורך?
						</h3>
						<p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
							המערכת תערוך שאלון קצר להעדפותיך (מה אתה מעדיף לשפר, כמה זמן יש לך) ותבנה לך 3 תוכניות למידה מומלצות ומדויקות.
						</p>
					</div>

					<button
						onClick={() => onPlanTrackCTA && onPlanTrackCTA(analysis.target.program.fieldOfStudy)}
						className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/20 transition hover:scale-[1.02] active:scale-[0.98] shrink-0 flex items-center gap-2"
					>
						<span>עבור לתכנון מסלול שיפור</span>
						<ArrowLeft className="h-4 w-4" />
					</button>
				</div>
			)}
		</div>
	);
}

function ImprovementCard({ option }: { option: ImprovementOption }) {
	const isPsych = option.type === 'psychometric';
	const isBagrut = option.type === 'bagrut';

	const icon = isPsych ? (
		<Brain className="h-5 w-5 text-purple-400" />
	) : isBagrut ? (
		<BookOpen className="h-5 w-5 text-cyan-400" />
	) : (
		<TrendingUp className="h-5 w-5 text-emerald-400" />
	);

	const effortBadge =
		option.effortLevel === 'easy' ? (
			<span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
				מאמץ קל
			</span>
		) : option.effortLevel === 'medium' ? (
			<span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
				מאמץ בינוני
			</span>
		) : (
			<span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
				מאמץ מוגבר
			</span>
		);

	return (
		<div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="p-2 rounded-xl bg-slate-900 border border-slate-800">{icon}</div>
					{effortBadge}
				</div>

				<h4 className="text-sm font-bold text-white">{option.title}</h4>
				<p className="text-xs text-slate-400 leading-relaxed">{option.description}</p>
			</div>

			<div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
				<div className="flex items-center justify-between text-slate-300">
					<span>יעד נדרש:</span>
					<span className="font-extrabold text-cyan-300">{option.targetValue}</span>
				</div>
				<div className="flex items-center justify-between text-slate-400 text-[11px]">
					<span className="flex items-center gap-1">
						<Clock className="h-3 w-3" />
						<span>זמן משוער:</span>
					</span>
					<span>כ-{option.estimatedWeeks} שבועות</span>
				</div>
			</div>
		</div>
	);
}
