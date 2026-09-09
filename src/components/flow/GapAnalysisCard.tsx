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
import { ProgramGapAnalysis, ImprovementOption, UserAcademicProfile } from '../../utils/analysis/gapAnalyzer';
import { getUniversityRegistrationInfo } from '../../utils/universityRegistration';
import { InstitutionSekemResult } from '../../utils/calculators/multiCalculator';
import { SubjectInput } from '../../utils/calculators/bguCalculator';
import WhatIfSimulator from './WhatIfSimulator';
import UniversityLogo from '@/components/common/UniversityLogo';

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
	const isBorderline = analysis.status === 'borderline';
	const missingPoints = Math.abs(analysis.gap);

	return (
		<div className="space-y-6">
			{/* Back Button and Header */}
			<div className="flex items-center justify-between">
				<button
					onClick={onBackToReport}
					className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#222222] text-xs font-bold transition flex items-center gap-1.5 border border-[#E5DFD4]"
				>
					<ArrowRight className="h-4 w-4" />
					<span>חזרה לדוח הקבלה המלא</span>
				</button>
			</div>

			{/* Hero Card: Program Title & Score Gap */}
			<div
				className={`p-6 rounded-3xl border shadow-sm space-y-6 bg-white ${
					isAccepted
						? 'border-[#C6DFCE]'
						: isBorderline
						? 'border-[#ECDAB6]'
						: 'border-[#F1CAC1]'
				}`}
			>
				<div className="flex items-start justify-between flex-wrap gap-4">
					<div className="flex items-center gap-3.5">
						<UniversityLogo institution={analysis.target.institutionId} size="lg" shape="rounded" />
						<div>
							<div className="flex items-center gap-2 mb-1">
								<span className="text-xs font-bold text-[#222222]">
									{analysis.target.institutionName}
								</span>
								<span className="text-[#8A847C]">·</span>
								<span className="text-xs font-bold text-[#66635C]">
									{analysis.target.program.degreeLevel}
								</span>
							</div>
							<h2 className="text-2xl sm:text-3xl font-bold text-[#222222]">
								{analysis.target.program.fieldOfStudy}
							</h2>
						</div>
					</div>

					<div
						className={`px-4 py-2 rounded-2xl border text-sm font-bold text-center ${
							isAccepted
								? 'bg-[#EBF4EE] text-[#205739] border-[#C6DFCE]'
								: isBorderline
								? 'bg-[#FDF6E8] text-[#825B15] border-[#ECDAB6]'
								: 'bg-[#FDF1EE] text-[#9B3327] border-[#F1CAC1]'
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
					<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-center">
						<span className="text-[11px] text-[#66635C] font-bold block">
							הסכם שלך ({analysis.relevantSekemLabel})
						</span>
						<span className="text-2xl font-bold text-[#222222] mt-1 block">
							{analysis.userSekem}
						</span>
					</div>

					<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-center">
						<span className="text-[11px] text-[#66635C] font-bold block">סף קבלה רשמי</span>
						<span className="text-2xl font-bold text-[#222222] mt-1 block">
							{analysis.threshold ?? 'ללא ציון מספרי'}
						</span>
					</div>

					<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-center">
						<span className="text-[11px] text-[#66635C] font-bold block">סטטוס פער</span>
						<span
							className={`text-2xl font-bold mt-1 block ${
								isAccepted
									? 'text-[#205739]'
									: isBorderline
									? 'text-[#825B15]'
									: 'text-[#9B3327]'
							}`}
						>
							{analysis.gap >= 0 ? `+${analysis.gap}` : `-${missingPoints}`}
						</span>
					</div>
				</div>
			</div>

			{/* Section 1: Prerequisites Check */}
			<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 shadow-sm space-y-4">
				<div className="flex items-center gap-2.5 border-b border-[#E5DFD4] pb-3">
					<Award className="h-5 w-5 text-[#222222]" />
					<div>
						<h3 className="text-base font-bold text-[#222222]">בדיקת תנאי סף ודרישות קדם אקדמיות</h3>
						<p className="text-xs text-[#66635C]">
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
									? 'bg-[#EBF4EE] border-[#C6DFCE]'
									: 'bg-[#FDF6E8] border-[#ECDAB6]'
							}`}
						>
							<div
								className={`p-2 rounded-xl mt-0.5 shrink-0 ${
									prereq.isMet ? 'bg-white text-[#205739]' : 'bg-white text-[#825B15]'
								}`}
							>
								{prereq.isMet ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
							</div>
							<div className="space-y-1 text-xs">
								<div className="flex items-center justify-between gap-2">
									<span className="font-bold text-[#222222]">{prereq.name}</span>
									<span
										className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
											prereq.isMet
												? 'text-[#205739] bg-white border-[#C6DFCE]'
												: 'text-[#825B15] bg-white border-[#ECDAB6]'
										}`}
									>
										{prereq.isMet ? 'עומד בדרישה' : 'חסר / דורש מכינה'}
									</span>
								</div>
								<p className="text-[#66635C] font-medium">
									דרישה: <span className="text-[#222222]">{prereq.required}</span>
								</p>
								<p className="text-[#66635C]">
									הנתון שלך: <span className="text-[#222222]">{prereq.current}</span>
								</p>
								{prereq.notes && <p className="text-[#825B15] text-[11px] pt-1">{prereq.notes}</p>}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Section 2: Concrete Improvement Levers */}
			{!isAccepted && analysis.improvementOptions.length > 0 && (
				<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 shadow-sm space-y-4">
					<div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E5DFD4] pb-3">
						<div className="flex items-center gap-2.5">
							<Sparkles className="h-5 w-5 text-[#222222]" />
							<div>
								<h3 className="text-base font-bold text-[#222222]">
									מנופי שיפור לסגירת הפער ({analysis.improvementOptions.length} חלופות)
								</h3>
								<p className="text-xs text-[#66635C]">
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
				<div className="bg-white border border-[#C6DFCE] rounded-3xl p-6 shadow-sm space-y-4 text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-6">
					<div className="space-y-1.5 max-w-xl">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF4EE] border border-[#C6DFCE] text-[#205739] text-xs font-bold">
							<CheckCircle2 className="h-3.5 w-3.5 text-[#205739]" />
							<span>סטטוס: קבלה מובטחת לחוג זה!</span>
						</div>
						<h3 className="text-lg sm:text-xl font-bold text-[#222222]">
							עובר את סף הקבלה — אין צורך בשיפור ציונים 🎉
						</h3>
						<p className="text-xs sm:text-sm text-[#66635C] leading-relaxed">
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
						className="px-6 py-3.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-sm rounded-2xl shadow-sm transition shrink-0 flex items-center gap-2"
					>
						<span>מעבר להרשמה ב{analysis.target.institutionName}</span>
						<ExternalLink className="h-4 w-4" />
					</a>
				</div>
			) : (
				<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 shadow-sm space-y-4 text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-6">
					<div className="space-y-1.5 max-w-xl">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E5DFD4] text-[#222222] text-xs font-bold">
							<Sparkles className="h-3.5 w-3.5 text-[#222222]" />
							<span>השלב הבא: שאלון העדפות ותכנון 3 מסלולים</span>
						</div>
						<h3 className="text-lg sm:text-xl font-bold text-[#222222]">
							מוכן לתכנן את המסלול האופטימלי עבורך?
						</h3>
						<p className="text-xs sm:text-sm text-[#66635C] leading-relaxed">
							המערכת תערוך שאלון קצר להעדפותיך (מה אתה מעדיף לשפר, כמה זמן יש לך) ותבנה לך 3 תוכניות למידה מומלצות ומדויקות.
						</p>
					</div>

					<button
						onClick={() => onPlanTrackCTA && onPlanTrackCTA(analysis.target.program.fieldOfStudy)}
						className="px-6 py-3.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-sm rounded-2xl shadow-sm transition shrink-0 flex items-center gap-2"
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
		<BookOpen className="h-5 w-5 text-[#222222]" />
	) : (
		<TrendingUp className="h-5 w-5 text-[#205739]" />
	);

	const effortBadge =
		option.effortLevel === 'easy' ? (
			<span className="text-[10px] font-bold text-[#205739] bg-[#EBF4EE] px-2 py-0.5 rounded border border-[#C6DFCE]">
				מאמץ קל
			</span>
		) : option.effortLevel === 'medium' ? (
			<span className="text-[10px] font-bold text-[#825B15] bg-[#FDF6E8] px-2 py-0.5 rounded border border-[#ECDAB6]">
				מאמץ בינוני
			</span>
		) : (
			<span className="text-[10px] font-bold text-[#9B3327] bg-[#FDF1EE] px-2 py-0.5 rounded border border-[#F1CAC1]">
				מאמץ מוגבר
			</span>
		);

	return (
		<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] space-y-3 flex flex-col justify-between">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="p-2 rounded-xl bg-white border border-[#E5DFD4]">{icon}</div>
					{effortBadge}
				</div>

				<h4 className="text-sm font-bold text-[#222222]">{option.title}</h4>
				<p className="text-xs text-[#66635C] leading-relaxed">{option.description}</p>
			</div>

			<div className="pt-2 border-t border-[#E5DFD4] space-y-1.5 text-xs">
				<div className="flex items-center justify-between text-[#66635C]">
					<span>יעד נדרש:</span>
					<span className="font-bold text-[#222222]">{option.targetValue}</span>
				</div>
				<div className="flex items-center justify-between text-[#8A847C] text-[11px]">
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
