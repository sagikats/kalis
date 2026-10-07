'use client';

import React from 'react';
import {
	AlertCircle,
	CheckCircle2,
	TrendingUp,
	BookOpen,
	Brain,
	Clock,
	Award,
	Sparkles,
	ArrowLeft,
	ArrowRight,
	Check,
	ExternalLink
} from 'lucide-react';
import { ProgramGapAnalysis, ImprovementOption, UserAcademicProfile, thresholdLabel } from '../../utils/analysis/gapAnalyzer';
import { getUniversityRegistrationInfo } from '../../utils/universityRegistration';
import { InstitutionSekemResult } from '../../utils/calculators/multiCalculator';
import { SubjectInput } from '../../modules/calculators';
import WhatIfSimulator from './WhatIfSimulator';
import UniversityLogo from '@/components/common/UniversityLogo';
import { describeThresholdSource } from '@/utils/sourceLink';

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
	onPlanTrackCTA,
	onApplyScenario
}: GapAnalysisCardProps) {
	const isAccepted = analysis.status === 'accepted';
	const isMissingRequirement = analysis.status === 'missing_requirement';
	const missingPoints = Math.abs(analysis.gap);

	return (
		<div className="space-y-6">
			{/* Back Button and Header */}
			<div className="flex items-center justify-between">
				<button
					onClick={onBackToReport}
					className="px-3.5 py-2 rounded-xl bg-white hover:bg-paper text-ink text-xs font-bold transition flex items-center gap-1.5 border border-line"
				>
					<ArrowRight className="h-4 w-4" />
					<span>חזרה לדוח הקבלה המלא</span>
				</button>
			</div>

			{/* Hero Card: Program Title & Score Gap */}
			<div
				className={`p-6 rounded-3xl border shadow-sm space-y-6 bg-white ${
					isAccepted
						? 'border-success/25'
						: isMissingRequirement
						? 'border-warning/30'
						: 'border-danger/25'
				}`}
			>
				<div className="flex items-start justify-between flex-wrap gap-4">
					<div className="flex items-center gap-3.5">
						<UniversityLogo institution={analysis.target.institutionId} size="lg" shape="rounded" />
						<div>
							<div className="flex items-center gap-2 mb-1">
								<span className="text-xs font-bold text-ink">
									{analysis.target.institutionName}
								</span>
								<span className="text-ink-3">·</span>
								<span className="text-xs font-bold text-ink-2">
									{analysis.target.program.degreeLevel}
								</span>
							</div>
							<h2 className="text-2xl sm:text-3xl font-bold text-ink">
								{analysis.target.program.fieldOfStudy}
							</h2>
						</div>
					</div>

					<div
						className={`px-4 py-2 rounded-2xl border text-sm font-bold text-center ${
							isAccepted
								? 'bg-success-soft text-success border-success/25'
								: isMissingRequirement
								? 'bg-warning-soft text-warning border-warning/30'
								: 'bg-danger-soft text-danger border-danger/25'
						}`}
					>
						{isAccepted
							? `התקבלת! (+${analysis.gap} נק׳)`
							: isMissingRequirement
							? 'הסכם עובר — חסר תנאי סף רשמי'
							: `פער נדרש: ${missingPoints} נקודות`}
					</div>
				</div>

				{/* Score Comparison Matrix */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div className="p-4 rounded-2xl bg-paper border border-line text-center">
						<span className="text-[11px] text-ink-2 font-bold block">
							הסכם שלך ({analysis.relevantSekemLabel})
						</span>
						<span className="text-2xl font-bold text-ink mt-1 block">
							{analysis.userSekem}
						</span>
					</div>

					<div className="p-4 rounded-2xl bg-paper border border-line text-center">
						<span className="text-[11px] text-ink-2 font-bold block">
							{thresholdLabel(analysis)}
						</span>
						<span className="text-2xl font-bold text-ink mt-1 block">
							{analysis.threshold ?? 'ללא ציון מספרי'}
						</span>
						{analysis.officialThreshold !== undefined && analysis.officialThreshold !== analysis.threshold && (
							<span className="text-[11px] text-ink-2 mt-1 block">
								בסולם המוסד: {analysis.officialThreshold}
							</span>
						)}
						{analysis.thresholdSource && describeThresholdSource(analysis.thresholdSource).href && (
							<a
								href={describeThresholdSource(analysis.thresholdSource).href}
								target="_blank"
								rel="noopener noreferrer"
								className="text-[11px] text-[#2F6FB0] underline mt-1 inline-block"
							>
								מקור
							</a>
						)}
						{analysis.thresholdSource?.includes(' — ') && (
							<span className="text-[10px] text-ink-2 mt-0.5 block line-clamp-2">
								{analysis.thresholdSource.split(' — ').slice(1).join(' — ')}
							</span>
						)}
					</div>

					<div className="p-4 rounded-2xl bg-paper border border-line text-center">
						<span className="text-[11px] text-ink-2 font-bold block">סטטוס פער</span>
						<span
							className={`text-2xl font-bold mt-1 block ${
								isAccepted
									? 'text-success'
									: isMissingRequirement
									? 'text-warning'
									: 'text-danger'
							}`}
						>
							{analysis.gap >= 0 ? `+${analysis.gap}` : `-${missingPoints}`}
						</span>
					</div>
				</div>
			</div>

			{/* Section 1: Prerequisites Check */}
			<div className="bg-white border border-line rounded-3xl p-6 shadow-sm space-y-4">
				<div className="flex items-center gap-2.5 border-b border-line pb-3">
					<Award className="h-5 w-5 text-ink" />
					<div>
						<h3 className="text-base font-bold text-ink">בדיקת תנאי סף ודרישות קדם אקדמיות</h3>
						<p className="text-xs text-ink-2">
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
									? 'bg-success-soft border-success/25'
									: prereq.unknown
									? 'bg-paper border-line'
									: 'bg-warning-soft border-warning/30'
							}`}
						>
							<div
								className={`p-2 rounded-xl mt-0.5 shrink-0 ${
									prereq.isMet ? 'bg-white text-success' : 'bg-white text-warning'
								}`}
							>
								{prereq.isMet ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
							</div>
							<div className="space-y-1 text-xs">
								<div className="flex items-center justify-between gap-2">
									<span className="font-bold text-ink">{prereq.name}</span>
									<span
										className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
											prereq.isMet
												? 'text-success bg-white border-success/25'
												: 'text-warning bg-white border-warning/30'
										}`}
									>
										{prereq.isMet ? 'עומד בדרישה' : prereq.unknown ? 'לא הוזן ציון' : 'חסר'}
									</span>
								</div>
								<p className="text-ink-2 font-medium">
									דרישה: <span className="text-ink">{prereq.required}</span>
								</p>
								<p className="text-ink-2">
									הנתון שלך: <span className="text-ink">{prereq.current}</span>
								</p>
								{prereq.notes && <p className="text-warning text-[11px] pt-1">{prereq.notes}</p>}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Section 2: Concrete Improvement Levers */}
			{!isAccepted && analysis.improvementOptions.length > 0 && (
				<div className="bg-white border border-line rounded-3xl p-6 shadow-sm space-y-4">
					<div className="flex items-center justify-between flex-wrap gap-2 border-b border-line pb-3">
						<div className="flex items-center gap-2.5">
							<Sparkles className="h-5 w-5 text-ink" />
							<div>
								<h3 className="text-base font-bold text-ink">
									מנופי שיפור לסגירת הפער ({analysis.improvementOptions.length} חלופות)
								</h3>
								<p className="text-xs text-ink-2">
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
				<div className="bg-white border border-success/25 rounded-3xl p-6 shadow-sm space-y-4 text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-6">
					<div className="space-y-1.5 max-w-xl">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-soft border border-success/25 text-success text-xs font-bold">
							<CheckCircle2 className="h-3.5 w-3.5 text-success" />
							<span>סטטוס: עומד/ת בסף ובתנאי הסף שפורסמו</span>
						</div>
						<h3 className="text-lg sm:text-xl font-bold text-ink">
							עובר את סף הקבלה — אין צורך בשיפור ציונים
						</h3>
						<p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
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
						className="px-6 py-3.5 bg-ink hover:bg-black text-white font-bold text-sm rounded-2xl shadow-sm transition shrink-0 flex items-center gap-2"
					>
						<span>מעבר להרשמה ב{analysis.target.institutionName.replace(/^ה/, '')}</span>
						<ExternalLink className="h-4 w-4" />
					</a>
				</div>
			) : (
				<div className="bg-white border border-line rounded-3xl p-6 shadow-sm space-y-4 text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-6">
					<div className="space-y-1.5 max-w-xl">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper border border-line text-ink text-xs font-bold">
							<Sparkles className="h-3.5 w-3.5 text-ink" />
							<span>השלב הבא: שאלון העדפות ותכנון 3 מסלולים</span>
						</div>
						<h3 className="text-lg sm:text-xl font-bold text-ink">
							מוכן לתכנן את המסלול האופטימלי עבורך?
						</h3>
						<p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
							המערכת תערוך שאלון קצר להעדפותיך (מה אתה מעדיף לשפר, כמה זמן יש לך) ותבנה לך 3 תוכניות למידה מומלצות ומדויקות.
						</p>
					</div>

					<button
						onClick={() => onPlanTrackCTA && onPlanTrackCTA(analysis.target.program.fieldOfStudy)}
						className="px-6 py-3.5 bg-ink hover:bg-black text-white font-bold text-sm rounded-2xl shadow-sm transition shrink-0 flex items-center gap-2"
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
		<Brain className="h-5 w-5 text-[#453D78]" />
	) : isBagrut ? (
		<BookOpen className="h-5 w-5 text-ink" />
	) : (
		<TrendingUp className="h-5 w-5 text-success" />
	);

	const effortBadge =
		option.effortLevel === 'easy' ? (
			<span className="text-[10px] font-bold text-success bg-success-soft px-2 py-0.5 rounded border border-success/25">
				מאמץ קל
			</span>
		) : option.effortLevel === 'medium' ? (
			<span className="text-[10px] font-bold text-warning bg-warning-soft px-2 py-0.5 rounded border border-warning/30">
				מאמץ בינוני
			</span>
		) : (
			<span className="text-[10px] font-bold text-danger bg-danger-soft px-2 py-0.5 rounded border border-danger/25">
				מאמץ מוגבר
			</span>
		);

	return (
		<div className="p-4 rounded-2xl bg-paper border border-line space-y-3 flex flex-col justify-between">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="p-2 rounded-xl bg-white border border-line">{icon}</div>
					{effortBadge}
				</div>

				<h4 className="text-sm font-bold text-ink">{option.title}</h4>
				<p className="text-xs text-ink-2 leading-relaxed">{option.description}</p>
			</div>

			<div className="pt-2 border-t border-line space-y-1.5 text-xs">
				<div className="flex items-center justify-between text-ink-2">
					<span>יעד נדרש:</span>
					<span className="font-bold text-ink">{option.targetValue}</span>
				</div>
				<div className="flex items-center justify-between text-ink-3 text-[11px]">
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
