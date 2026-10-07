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
import SekemBreakdown from '@/components/flow/SekemBreakdown';
import type { InstitutionSekemResult } from '@/utils/calculators/multiCalculator';

interface AcceptedRegistrationCardProps {
	analysis: ProgramGapAnalysis;
	otherAnalyses?: ProgramGapAnalysis[];
	onSelectOtherProgram?: (programId: string) => void;
	onBackToReport?: () => void;
	/** The applicant's result at this institution, for the "how was my score computed" breakdown. */
	institutionResult?: InstitutionSekemResult;
	psychometric?: number;
}

export default function AcceptedRegistrationCard({
	analysis,
	otherAnalyses = [],
	onSelectOtherProgram,
	onBackToReport,
	institutionResult,
	psychometric
}: AcceptedRegistrationCardProps) {
	const regInfo = getUniversityRegistrationInfo(
		analysis.target.institutionName,
		analysis.target.calculatorId,
		analysis.target.program.url
	);

	const surplus = Math.max(0, analysis.gap);
	/** Medicine-style programs: passing only invites to the screening stage (MOR / interviews). */
	const isScreening = analysis.status === 'screening';
	const unacceptedOthers = otherAnalyses.filter(
		(a) => a.target.program.id !== analysis.target.program.id && (a.status === 'not_accepted' || a.status === 'missing_requirement')
	);

	return (
		<div className="space-y-8 dir-rtl text-right">
			{/* Main Celebratory Hero Card */}
			<div className="bg-white border border-success/25 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
				<div className="relative z-10 space-y-6">
					{/* Top Badges */}
					<div className="flex items-center justify-between flex-wrap gap-3">
						<div className="flex items-center gap-2">
							<span className="px-3 py-1 bg-success-soft text-success border border-success/25 text-xs font-bold rounded-lg flex items-center gap-1.5">
								<CheckCircle2 className="h-4 w-4 text-success" />
								<span>{isScreening ? 'עובר/ת לשלב המיונים — זו עדיין לא קבלה' : 'עומד/ת בסף ובכל תנאי הסף שפורסמו'}</span>
							</span>
							<span className="text-xs text-ink-2 font-bold">
								{analysis.target.institutionName} • {analysis.target.program.degreeLevel}
							</span>
						</div>

						<div className="bg-paper border border-success/25 px-3.5 py-1.5 rounded-xl text-success text-xs font-bold flex items-center gap-1.5">
							<Award className="h-4 w-4 text-success" />
							<span>{analysis.threshold === null ? 'סף שלב א\' לא מתפרסם מראש' : `עודף ביטחון: +${surplus.toFixed(analysis.target.calculatorId === 'technion' ? 2 : 1)} נקודות סכם`}</span>
						</div>
					</div>

					{/* Title & Congratulations */}
					<div className="space-y-2">
						<div className="flex items-center gap-4">
							<UniversityLogo institution={analysis.target.institutionId} size="xl" shape="rounded" />
							<div>
								<h2 className="text-2xl sm:text-3xl font-bold text-ink">
									{isScreening
										? `עברת לשלב המיונים ב${analysis.target.program.fieldOfStudy}`
										: `ברכות! התקבלת ל${analysis.target.program.fieldOfStudy}`}
								</h2>
								<p className="text-xs sm:text-sm text-ink-2 font-medium">
									{isScreening
										? analysis.admissionNote
										: 'הנתונים האקדמיים שלך עוברים את סף הקבלה הרשמי של האוניברסיטה לשנת הלימודים.'}
								</p>
							</div>
						</div>
					</div>

					{/* Score Matrix */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
						<div className="p-4 rounded-2xl bg-paper border border-line text-center">
							<span className="text-[11px] text-ink-2 font-bold block">
								הסכם המשוקלל שלך ({analysis.relevantSekemLabel})
							</span>
							<span className="text-2xl font-bold text-ink mt-1 block">
								{analysis.userSekem}
							</span>
						</div>

						<div className="p-4 rounded-2xl bg-paper border border-line text-center">
							<span className="text-[11px] text-ink-2 font-bold block">
								{isScreening ? 'סף הזימון לשלב המיונים' : 'סף הקבלה הנדרש בחוג'}
							</span>
							<span className="text-2xl font-bold text-success mt-1 block">
								{analysis.threshold ?? 'לא מתפרסם מראש'}
							</span>
						</div>

						<div className="p-4 rounded-2xl bg-success-soft border border-success/25 text-center">
							<span className="text-[11px] text-success font-bold block">
								סטטוס פלואו
							</span>
							<span className="text-sm font-bold text-success mt-2 block">
								{isScreening ? 'השלב הבא: המיונים' : 'אין צורך בשיפור ציונים ✨'}
							</span>
						</div>
					</div>

					{institutionResult?.subjectBreakdown && (
						<SekemBreakdown
							current={{
								breakdown: institutionResult.subjectBreakdown,
								bagrutAverage: institutionResult.bagrutAverage,
								sekem: analysis.userSekem,
								psychometric
							}}
							sekemLabel={analysis.relevantSekemLabel}
							bagrutCap={institutionResult.bagrutCap}
							psychometricOnly={analysis.relevantSekemType === 'psychometric'}
						/>
					)}

					{/* Primary Call To Action: Go to University Registration Page */}
					<div className="bg-paper border border-line rounded-2xl p-5 sm:p-6 space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="space-y-1">
								<h3 className="text-base font-bold text-ink flex items-center gap-2">
									<Building2 className="h-5 w-5 text-success" />
									<span>מוכן להתחיל ללמוד? עבור ישירות להרשמה</span>
								</h3>
								<p className="text-xs text-ink-2 leading-relaxed max-w-xl">
									באפשרותך להירשם ישירות באתר האוניברסיטה ולהבטיח את מקומך בחוג לשנת הלימודים הקרובה.
								</p>
								<p className="text-[11px] text-ink-3 pt-0.5">
									{regInfo.tips}
								</p>
							</div>

							<a
								href={regInfo.registrationUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="px-8 py-4 bg-ink hover:bg-black text-white font-bold text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-3 shrink-0"
							>
								<span>מעבר לעמוד ההרשמה ב{analysis.target.institutionName.replace(/^ה/, '')}</span>
								<ExternalLink className="h-4 w-4 text-white" />
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* What about other programs that need improvement? */}
			{unacceptedOthers.length > 0 && (
				<div className="bg-white border border-line rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
					<div className="flex items-center justify-between flex-wrap gap-2 border-b border-line pb-4">
						<div className="space-y-1">
							<h3 className="text-lg font-bold text-ink flex items-center gap-2">
								<Sliders className="h-5 w-5 text-ink" />
								<span>תארים נוספים בסל שלך שבהם קיים פער קבלה</span>
							</h3>
							<p className="text-xs text-ink-2">
								נרשמת גם לתארים הבאים ובהם חסרות נקודות סכם — באפשרותך לבנות עבורם מסלולי שיפור מותאמים:
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{unacceptedOthers.map((item) => (
							<div
								key={item.target.program.id}
								className="p-4 rounded-2xl bg-paper border border-line hover:border-line-strong transition flex flex-col justify-between space-y-3"
							>
								<div className="space-y-1.5">
									<div className="flex items-center justify-between gap-1">
										<span className="text-[11px] font-bold text-ink">
											{item.target.institutionName}
										</span>
										<span className="text-[10px] font-bold text-danger bg-danger-soft px-2 py-0.5 rounded border border-danger/25">
											{item.gap >= 0 ? 'חסר תנאי סף רשמי' : `פער: ${Math.abs(item.gap)} נק׳`}
										</span>
									</div>
									<h4 className="text-sm font-bold text-ink leading-snug">
										{item.target.program.fieldOfStudy}
									</h4>
									<div className="text-[11px] text-ink-2">
										הסכם שלך: {item.userSekem} • סף נדרש: {item.threshold}
									</div>
								</div>

								{onSelectOtherProgram && (
									<button
										onClick={() => onSelectOtherProgram(item.target.program.id)}
										className="w-full py-2 px-3 bg-white hover:bg-paper text-ink font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-line"
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
						className="px-5 py-2.5 bg-white hover:bg-paper text-ink font-bold text-xs rounded-xl transition flex items-center gap-2 border border-line"
					>
						<ArrowRight className="h-4 w-4" />
						<span>חזרה לדוח הקבלה המלא</span>
					</button>
				</div>
			)}
		</div>
	);
}
