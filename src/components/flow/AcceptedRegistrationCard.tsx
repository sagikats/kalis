'use client';

import React from 'react';
import {
	CheckCircle2,
	ExternalLink,
	GraduationCap,
	ArrowLeft,
	ArrowRight,
	Sliders,
	Award,
	Building2
} from 'lucide-react';
import { ProgramGapAnalysis } from '@/utils/analysis/gapAnalyzer';
import { getUniversityRegistrationInfo } from '@/utils/universityRegistration';
import UniversityLogo from '@/components/common/UniversityLogo';

interface AcceptedRegistrationCardProps {
	analysis: ProgramGapAnalysis;
	otherAnalyses?: ProgramGapAnalysis[];
	onSelectOtherProgram?: (programId: string) => void;
	onBackToReport?: () => void;
}

export default function AcceptedRegistrationCard({
	analysis,
	otherAnalyses = [],
	onSelectOtherProgram,
	onBackToReport
}: AcceptedRegistrationCardProps) {
	const regInfo = getUniversityRegistrationInfo(
		analysis.target.institutionName,
		analysis.target.calculatorId,
		analysis.target.program.url
	);

	const surplus = Math.max(0, analysis.gap);
	const unacceptedOthers = otherAnalyses.filter(
		(a) => a.target.program.id !== analysis.target.program.id && (a.status === 'not_accepted' || a.status === 'borderline')
	);

	return (
		<div className="space-y-8 dir-rtl text-right">
			{/* Main Celebratory Hero Card */}
			<div className="bg-white border border-[#C6DFCE] rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
				<div className="relative z-10 space-y-6">
					{/* Top Badges */}
					<div className="flex items-center justify-between flex-wrap gap-3">
						<div className="flex items-center gap-2">
							<span className="px-3 py-1 bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE] text-xs font-bold rounded-lg flex items-center gap-1.5">
								<CheckCircle2 className="h-4 w-4 text-[#205739]" />
								<span>קבלה מובטחת — עומד בכל הדרישות!</span>
							</span>
							<span className="text-xs text-[#66635C] font-bold">
								{analysis.target.institutionName} • {analysis.target.program.degreeLevel}
							</span>
						</div>

						<div className="bg-[#FAF8F5] border border-[#C6DFCE] px-3.5 py-1.5 rounded-xl text-[#205739] text-xs font-bold flex items-center gap-1.5">
							<Award className="h-4 w-4 text-[#205739]" />
							<span>עודף ביטחון: +{surplus.toFixed(analysis.target.calculatorId === 'technion' ? 2 : 1)} נקודות סכם</span>
						</div>
					</div>

					{/* Title & Congratulations */}
					<div className="space-y-2">
						<div className="flex items-center gap-4">
							<UniversityLogo institution={analysis.target.institutionId} size="xl" shape="rounded" />
							<div>
								<h2 className="text-2xl sm:text-3xl font-bold text-[#222222]">
									ברכות! התקבלת ל{analysis.target.program.fieldOfStudy} 🎉
								</h2>
								<p className="text-xs sm:text-sm text-[#66635C] font-medium">
									הנתונים האקדמיים שלך עוברים את סף הקבלה הרשמי של האוניברסיטה לשנת הלימודים.
								</p>
							</div>
						</div>
					</div>

					{/* Score Matrix */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
						<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-center">
							<span className="text-[11px] text-[#66635C] font-bold block">
								הסכם המשוקלל שלך ({analysis.relevantSekemLabel})
							</span>
							<span className="text-2xl font-bold text-[#222222] mt-1 block">
								{analysis.userSekem}
							</span>
						</div>

						<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] text-center">
							<span className="text-[11px] text-[#66635C] font-bold block">
								סף הקבלה הנדרש בחוג
							</span>
							<span className="text-2xl font-bold text-[#205739] mt-1 block">
								{analysis.threshold}
							</span>
						</div>

						<div className="p-4 rounded-2xl bg-[#EBF4EE] border border-[#C6DFCE] text-center">
							<span className="text-[11px] text-[#205739] font-bold block">
								סטטוס פלואו
							</span>
							<span className="text-sm font-bold text-[#205739] mt-2 block">
								אין צורך בשיפור ציונים ✨
							</span>
						</div>
					</div>

					{/* Primary Call To Action: Go to University Registration Page */}
					<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-5 sm:p-6 space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="space-y-1">
								<h3 className="text-base font-bold text-[#222222] flex items-center gap-2">
									<Building2 className="h-5 w-5 text-[#205739]" />
									<span>מוכן להתחיל ללמוד? עבור ישירות להרשמה</span>
								</h3>
								<p className="text-xs text-[#66635C] leading-relaxed max-w-xl">
									באפשרותך להירשם ישירות באתר האוניברסיטה ולהבטיח את מקומך בחוג לשנת הלימודים הקרובה.
								</p>
								<p className="text-[11px] text-[#8A847C] pt-0.5">
									💡 {regInfo.tips}
								</p>
							</div>

							<a
								href={regInfo.registrationUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="px-8 py-4 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-3 shrink-0"
							>
								<span>מעבר לעמוד ההרשמה ב{analysis.target.institutionName}</span>
								<ExternalLink className="h-4 w-4 text-white" />
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* What about other programs that need improvement? */}
			{unacceptedOthers.length > 0 && (
				<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
					<div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#E5DFD4] pb-4">
						<div className="space-y-1">
							<h3 className="text-lg font-bold text-[#222222] flex items-center gap-2">
								<Sliders className="h-5 w-5 text-[#222222]" />
								<span>תארים נוספים בסל שלך שבהם קיים פער קבלה</span>
							</h3>
							<p className="text-xs text-[#66635C]">
								נרשמת גם לתארים הבאים ובהם חסרות נקודות סכם — באפשרותך לבנות עבורם מסלולי שיפור מותאמים:
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{unacceptedOthers.map((item) => (
							<div
								key={item.target.program.id}
								className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] hover:border-[#DDD7CC] transition flex flex-col justify-between space-y-3"
							>
								<div className="space-y-1.5">
									<div className="flex items-center justify-between gap-1">
										<span className="text-[11px] font-bold text-[#222222]">
											{item.target.institutionName}
										</span>
										<span className="text-[10px] font-bold text-[#9B3327] bg-[#FDF1EE] px-2 py-0.5 rounded border border-[#F1CAC1]">
											פער: {Math.abs(item.gap)} נק׳
										</span>
									</div>
									<h4 className="text-sm font-bold text-[#222222] leading-snug">
										{item.target.program.fieldOfStudy}
									</h4>
									<div className="text-[11px] text-[#66635C]">
										הסכם שלך: {item.userSekem} • סף נדרש: {item.threshold}
									</div>
								</div>

								{onSelectOtherProgram && (
									<button
										onClick={() => onSelectOtherProgram(item.target.program.id)}
										className="w-full py-2 px-3 bg-white hover:bg-[#FAF8F5] text-[#222222] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-[#E5DFD4]"
									>
										<span>בנה מסלול שיפור לתואר זה</span>
										<ArrowLeft className="h-3.5 w-3.5" />
									</button>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Back Button */}
			{onBackToReport && (
				<div className="flex items-center justify-start pt-2">
					<button
						onClick={onBackToReport}
						className="px-5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-2 border border-[#E5DFD4]"
					>
						<ArrowRight className="h-4 w-4" />
						<span>חזרה לדוח הקבלה המלא</span>
					</button>
				</div>
			)}
		</div>
	);
}
