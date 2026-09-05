'use client';

import React from 'react';
import {
	CheckCircle2,
	ExternalLink,
	Sparkles,
	GraduationCap,
	PartyPopper,
	ArrowLeft,
	ArrowRight,
	Sliders,
	Award,
	Building2,
	Info
} from 'lucide-react';
import { ProgramGapAnalysis } from '@/utils/analysis/gapAnalyzer';
import { getUniversityRegistrationInfo } from '@/utils/universityRegistration';

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
			<div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
				{/* Background ambient glow */}
				<div className="absolute top-0 right-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl -z-0 pointer-events-none" />
				<div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

				<div className="relative z-10 space-y-6">
					{/* Top Badges */}
					<div className="flex items-center justify-between flex-wrap gap-3">
						<div className="flex items-center gap-2">
							<span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black rounded-lg flex items-center gap-1.5">
								<CheckCircle2 className="h-4 w-4 text-emerald-400" />
								<span>קבלה מובטחת — עומד בכל הדרישות!</span>
							</span>
							<span className="text-xs text-slate-300 font-bold">
								{analysis.target.institutionName} • {analysis.target.program.degreeLevel}
							</span>
						</div>

						<div className="bg-emerald-950/90 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-emerald-300 text-xs font-black flex items-center gap-1.5">
							<Award className="h-4 w-4 text-emerald-400" />
							<span>עודף ביטחון: +{surplus.toFixed(analysis.target.calculatorId === 'technion' ? 2 : 1)} נקודות סכם</span>
						</div>
					</div>

					{/* Title & Congratulations */}
					<div className="space-y-2">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
								<GraduationCap className="h-7 w-7" />
							</div>
							<div>
								<h2 className="text-2xl sm:text-3xl font-black text-white">
									ברכות! התקבלת ל{analysis.target.program.fieldOfStudy} 🎉
								</h2>
								<p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
									הנתונים האקדמיים שלך עוברים את סף הקבלה הרשמי של האוניברסיטה לשנת הלימודים.
								</p>
							</div>
						</div>
					</div>

					{/* Score Matrix */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
						<div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
							<span className="text-[11px] text-slate-400 font-bold block">
								הסכם המשוקלל שלך ({analysis.relevantSekemLabel})
							</span>
							<span className="text-2xl font-black text-white mt-1 block">
								{analysis.userSekem}
							</span>
						</div>

						<div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
							<span className="text-[11px] text-slate-400 font-bold block">
								סף הקבלה הנדרש בחוג
							</span>
							<span className="text-2xl font-black text-emerald-400 mt-1 block">
								{analysis.threshold}
							</span>
						</div>

						<div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-center">
							<span className="text-[11px] text-emerald-300 font-bold block">
								סטטוס פלואו
							</span>
							<span className="text-sm font-black text-emerald-300 mt-2 block">
								אין צורך בשיפור ציונים ✨
							</span>
						</div>
					</div>

					{/* Primary Call To Action: Go to University Registration Page */}
					<div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="space-y-1">
								<h3 className="text-base font-black text-white flex items-center gap-2">
									<Building2 className="h-5 w-5 text-emerald-400" />
									<span>מוכן להתחיל ללמוד? עבור ישירות להרשמה</span>
								</h3>
								<p className="text-xs text-slate-300 leading-relaxed max-w-xl">
									באפשרותך להירשם ישירות באתר האוניברסיטה ולהבטיח את מקומך בחוג לשנת הלימודים הקרובה.
								</p>
								<p className="text-[11px] text-slate-400 pt-0.5">
									💡 {regInfo.tips}
								</p>
							</div>

							<a
								href={regInfo.registrationUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-3 shrink-0 hover:scale-[1.03] active:scale-[0.98]"
							>
								<span>מעבר לעמוד ההרשמה ב{analysis.target.institutionName}</span>
								<ExternalLink className="h-4 w-4 text-slate-950" />
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* What about other programs that need improvement? */}
			{unacceptedOthers.length > 0 && (
				<div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
					<div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-4">
						<div className="space-y-1">
							<h3 className="text-lg font-black text-white flex items-center gap-2">
								<Sliders className="h-5 w-5 text-cyan-400" />
								<span>תארים נוספים בסל שלך שבהם קיים פער קבלה</span>
							</h3>
							<p className="text-xs text-slate-400">
								נרשמת גם לתארים הבאים ובהם חסרות נקודות סכם — באפשרותך לבנות עבורם 3 מסלולי שיפור מותאמים:
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{unacceptedOthers.map((item) => (
							<div
								key={item.target.program.id}
								className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition flex flex-col justify-between space-y-3"
							>
								<div className="space-y-1.5">
									<div className="flex items-center justify-between gap-1">
										<span className="text-[11px] font-bold text-cyan-400">
											{item.target.institutionName}
										</span>
										<span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
											פער: {Math.abs(item.gap)} נק׳
										</span>
									</div>
									<h4 className="text-sm font-bold text-white leading-snug">
										{item.target.program.fieldOfStudy}
									</h4>
									<div className="text-[11px] text-slate-400">
										הסכם שלך: {item.userSekem} • סף נדרש: {item.threshold}
									</div>
								</div>

								{onSelectOtherProgram && (
									<button
										onClick={() => onSelectOtherProgram(item.target.program.id)}
										className="w-full py-2 px-3 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700 hover:border-cyan-500"
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
						className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-2 border border-slate-700"
					>
						<ArrowRight className="h-4 w-4" />
						<span>חזרה לדוח הקבלה המלא</span>
					</button>
				</div>
			)}
		</div>
	);
}
