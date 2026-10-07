'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { describeThresholdSource } from '@/utils/sourceLink';
import {
	CheckCircle2,
	AlertCircle,
	XCircle,
	GraduationCap,
	ArrowLeft,
	Sparkles,
	Sliders,
	Award,
	HelpCircle,
	ExternalLink
} from 'lucide-react';
import { ProgramGapAnalysis, AdmissionStatus, thresholdLabel } from '../../utils/analysis/gapAnalyzer';
import { getUniversityRegistrationInfo } from '../../utils/universityRegistration';
import UniversityLogo from '../common/UniversityLogo';

interface PersonalAdmissionReportProps {
	analyses: ProgramGapAnalysis[];
	onViewGap: (programId: string) => void;
	onAddMorePrograms: () => void;
}

export default function PersonalAdmissionReport({
	analyses,
	onViewGap,
	onAddMorePrograms
}: PersonalAdmissionReportProps) {
	const counts = useMemo(() => {
		return {
			accepted: analyses.filter((a) => a.status === 'accepted').length,
			missing_requirement: analyses.filter((a) => a.status === 'missing_requirement').length,
			not_accepted: analyses.filter((a) => a.status === 'not_accepted').length,
			// Screening (medicine: MOR / interviews) is shown with the programs that have a separate admission process
			no_threshold: analyses.filter((a) => a.status === 'no_threshold' || a.status === 'screening').length
		};
	}, [analyses]);

	const grouped = useMemo(() => {
		return {
			accepted: analyses.filter((a) => a.status === 'accepted'),
			missing_requirement: analyses.filter((a) => a.status === 'missing_requirement'),
			not_accepted: analyses.filter((a) => a.status === 'not_accepted'),
			no_threshold: analyses.filter((a) => a.status === 'no_threshold' || a.status === 'screening')
		};
	}, [analyses]);

	if (analyses.length === 0) {
		return (
			<div className="text-center py-16 px-6 bg-white rounded-3xl border border-line shadow-xs space-y-4">
				<GraduationCap className="h-12 w-12 text-ink-3 mx-auto" />
				<h3 className="text-lg font-bold text-ink">לא נבחרו תארים להצגה</h3>
				<p className="text-sm text-ink-2 max-w-md mx-auto">
					כדי לראות דוח קבלה אישי, עליך לבחור לפחות תואר אחד בשלב 2 (בחירת תארים מבוקשים).
				</p>
				<button
					onClick={onAddMorePrograms}
					className="px-6 py-2.5 bg-ink hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
				>
					חזור לבחירת תארים
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Top Hero Stats */}
			<div className="bg-white border border-line rounded-3xl p-6 shadow-xs space-y-5">
				<div className="flex items-center justify-between flex-wrap gap-3 border-b border-line pb-4">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<span className="px-2.5 py-0.5 rounded-full bg-paper border border-line-strong text-ink-2 text-[11px] font-bold shadow-2xs">
								שלב 3 מתוך 4: תוצאות קבלה
							</span>
						</div>
						<h2 className="text-2xl sm:text-3xl font-bold text-ink">
							שלב 3: דוח סיכויי קבלה אישי
						</h2>
						<p className="text-xs sm:text-sm text-ink-2 mt-1">
							הערכה מבוססת מנועי הסכם הרשמיים לכל התארים שבחרת
						</p>
					</div>
					<button
						onClick={onAddMorePrograms}
						className="px-4 py-2 bg-paper hover:bg-line text-ink-2 hover:text-ink rounded-xl text-xs font-bold border border-line transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
					>
						<span>ערוך סל תארים</span>
					</button>
				</div>

				{/* Stat Badges */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div className="p-3.5 rounded-2xl bg-success-soft border border-success/25 text-center">
						<span className="text-[11px] font-bold text-success block">✅ התקבלת</span>
						<span className="text-2xl font-bold text-success mt-0.5 block">{counts.accepted}</span>
						<span className="text-[10px] text-success/80">עובר את רף הסכם</span>
					</div>

					<div className="p-3.5 rounded-2xl bg-warning-soft border border-warning/30 text-center">
						<span className="text-[11px] font-bold text-warning block">חסר תנאי סף</span>
						<span className="text-2xl font-bold text-warning mt-0.5 block">{counts.missing_requirement}</span>
						<span className="text-[10px] text-warning/80">עומד בסכם, לא בתנאי רשמי</span>
					</div>

					<div className="p-3.5 rounded-2xl bg-danger-soft border border-danger/25 text-center">
						<span className="text-[11px] font-bold text-danger block">❌ טרם התקבלת</span>
						<span className="text-2xl font-bold text-danger mt-0.5 block">{counts.not_accepted}</span>
						<span className="text-[10px] text-danger/80">דרוש שיפור נתונים</span>
					</div>

					<div className="p-3.5 rounded-2xl bg-[#F2F1F8] border border-[#D2CEEB] text-center">
						<span className="text-[11px] font-bold text-[#453D78] block">קבלה נפרדת</span>
						<span className="text-2xl font-bold text-[#453D78] mt-0.5 block">{counts.no_threshold}</span>
						<span className="text-[10px] text-[#453D78]/80">מיונים / אודישן / ראיון</span>
					</div>
				</div>

				{analyses.length > 0 && analyses.every((a) => a.userSekem === 0) && (
					<div className="p-4 rounded-2xl bg-paper border border-line flex items-start gap-3">
						<Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
						<div className="space-y-1">
							<span className="text-xs font-bold text-accent block">
								דוח קבלה ראשוני ללא ציון פסיכומטרי
							</span>
							<p className="text-[11px] text-ink-2 leading-relaxed">
								סימנת שטרם נבחנת בפסיכומטרי. עבור חוגים שבהם נדרש פסיכומטרי, בשלב 4 (תכנון מסלולים) המערכת תחשב במדויק מהו ציון הפסיכומטרי הנדרש ממך בבחינה הראשונה כדי לסגור את הקבלה!
							</p>
						</div>
					</div>
				)}
			</div>

			{/* 1. Accepted Programs */}
			{grouped.accepted.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="h-5 w-5 text-success" />
						<h3 className="text-base font-bold text-success">
							תארים שהתקבלת אליהם ({grouped.accepted.length})
						</h3>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{grouped.accepted.map((item) => (
							<ProgramReportCard key={item.target.program.id} item={item} onViewGap={onViewGap} />
						))}
					</div>
				</div>
			)}

			{/* 2. Sekem passes, an official condition is missing */}
			{grouped.missing_requirement.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5 text-warning" />
						<h3 className="text-base font-bold text-warning">
							עומד/ת בסכם, אבל חסר תנאי סף רשמי ({grouped.missing_requirement.length})
						</h3>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{grouped.missing_requirement.map((item) => (
							<ProgramReportCard key={item.target.program.id} item={item} onViewGap={onViewGap} />
						))}
					</div>
				</div>
			)}

			{/* 3. Not Accepted Programs */}
			{grouped.not_accepted.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center justify-between flex-wrap gap-2">
						<div className="flex items-center gap-2">
							<XCircle className="h-5 w-5 text-danger" />
							<h3 className="text-base font-bold text-danger">
								תארים שטרם התקבלת אליהם ({grouped.not_accepted.length})
							</h3>
						</div>
						<span className="text-xs text-ink-2">
							לחץ על ״ניתוח פער״ כדי לראות בדיוק מה חסר ואיך לשפר
						</span>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{grouped.not_accepted.map((item) => (
							<ProgramReportCard key={item.target.program.id} item={item} onViewGap={onViewGap} />
						))}
					</div>
				</div>
			)}

			{/* 4. Audition / No numeric threshold */}
			{grouped.no_threshold.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<HelpCircle className="h-5 w-5 text-[#453D78]" />
						<h3 className="text-base font-bold text-[#453D78]">
							תארים עם קבלה נפרדת ({grouped.no_threshold.length})
						</h3>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{grouped.no_threshold.map((item) => (
							<ProgramReportCard key={item.target.program.id} item={item} onViewGap={onViewGap} />
						))}
					</div>
				</div>
			)}

			{/* Legal disclaimer note */}
			<div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7E7A73]">
				<p className="leading-relaxed">
					* החישובים מבוססים על נוסחאות המוסדות ומהווים כלי עזר והדמיה עצמאית בלבד. הקבלה הסופית והחישוב הקובע נקבעים אך ורק ע״י מוסד הלימוד האקדמי.
				</p>
				<div className="flex items-center gap-2.5 shrink-0">
					<Link href="/terms" target="_blank" className="underline hover:text-ink">
						תנאי שימוש
					</Link>
					<span>•</span>
					<Link href="/privacy" target="_blank" className="underline hover:text-ink">
						מדיניות פרטיות
					</Link>
				</div>
			</div>
		</div>
	);
}

function ProgramReportCard({
	item,
	onViewGap
}: {
	item: ProgramGapAnalysis;
	onViewGap: (programId: string) => void;
}) {
	const isAccepted = item.status === 'accepted';
	const isMissingRequirement = item.status === 'missing_requirement';
	const isScreening = item.status === 'screening';
	const isNoThreshold = item.status === 'no_threshold' || (isScreening && item.threshold === null);
	/** Medicine-style program: the threshold only invites to MOR / interviews. */
	const isScreenedProgram = Boolean(item.admissionRoutes?.screening);

	const borderStyle = isAccepted
		? 'border-success/25 bg-[#FBFDFB]'
		: isMissingRequirement
		? 'border-warning/30 bg-[#FDFCF8]'
		: isNoThreshold || isScreening
		? 'border-[#D2CEEB] bg-[#FAF9FD]'
		: 'border-danger/25 bg-[#FDFBFB]';

	const badgeStyle = isAccepted
		? 'text-success bg-success-soft border-success/25'
		: isMissingRequirement
		? 'text-warning bg-warning-soft border-warning/30'
		: isNoThreshold || isScreening
		? 'text-[#453D78] bg-[#F2F1F8] border-[#D2CEEB]'
		: 'text-danger bg-danger-soft border-danger/25';

	const blockedByPsychFloor = isMissingRequirement && item.improvementOptions.some((o) => o.id === 'opt-psych-floor');

	const badgeText = isAccepted
		? item.admissionRoute === 'bagrut_only'
			? 'התקבלת (לפי בגרות)'
			: item.admissionRoute === 'psychometric_only'
			? 'התקבלת (לפי פסיכומטרי)'
			: item.admissionRoute === 'excellent_bagrut'
			? 'התקבלת (בגרות מצוינת)'
			: item.admissionRoute === 'engineering_score'
			? 'התקבלת (סכם הנדסי)'
			: `התקבלת (+${item.gap})`
		: blockedByPsychFloor
		? 'חסר פסיכומטרי מינימלי'
		: isMissingRequirement
		? 'חסר תנאי סף רשמי'
		: isScreening
		? item.threshold === null ? 'עומד בתנאי ההרשמה · מיונים' : `עובר לשלב המיונים (+${item.gap})`
		: isNoThreshold
		? 'קבלה נפרדת'
		: isScreenedProgram && item.threshold === null
		? 'לא עומד בתנאי הסף'
		: `פער: ${Math.abs(item.gap)} נק׳`;

	return (
		<div className={`p-5 rounded-2xl border ${borderStyle} shadow-xs space-y-4 flex flex-col justify-between`}>
			<div className="space-y-2.5">
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-3">
						<UniversityLogo institution={item.target.institutionId} size="md" />
						<div>
							<h4 className="text-base font-bold text-ink leading-snug">
								{item.target.program.fieldOfStudy}
							</h4>
							<p className="text-xs text-ink-2 font-semibold mt-0.5">
								{item.target.institutionName} · {item.target.program.degreeLevel}
							</p>
						</div>
					</div>
					<span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${badgeStyle}`}>
						{badgeText}
					</span>
				</div>

				{/* Score Comparison Box */}
				{!isNoThreshold && (
					<div className="grid grid-cols-2 gap-2 bg-paper p-3 rounded-xl border border-line text-center text-xs">
						<div>
							<span className="text-[10px] text-ink-2 block font-medium">הסכם שלך ({item.relevantSekemLabel})</span>
							<span className="text-base font-bold text-ink">{item.userSekem}</span>
						</div>
						<div>
							<span className="text-[10px] text-ink-2 block font-medium">
								{thresholdLabel(item)}
							</span>
							<span className="text-base font-bold text-warning">{item.threshold}</span>
							{item.officialThreshold !== undefined && item.officialThreshold !== item.threshold && (
								<span className="text-[10px] text-ink-2 block">בסולם המוסד: {item.officialThreshold}</span>
							)}
							{item.thresholdSource && (() => {
								const src = describeThresholdSource(item.thresholdSource);
								return src.href ? (
									<a
										href={src.href}
										target="_blank"
										rel="noopener noreferrer"
										onClick={(e) => e.stopPropagation()}
										className="text-[10px] text-[#2F6FB0] underline block"
									>
										{src.label}
									</a>
								) : (
									<span className="text-[10px] text-ink-2 block">{src.label}</span>
								);
							})()}
						</div>
					</div>
				)}

				{/* Official admission route / condition that decided the status */}
				{item.admissionNote && (
					<div
						className={`p-2.5 rounded-xl text-[11px] font-medium border ${
							item.status === 'accepted'
								? 'bg-[#EEF6EF] border-[#C9E2CD] text-[#2E6B3A]'
								: isScreenedProgram
								? 'bg-[#F2F1F8] border-[#D2CEEB] text-[#453D78]'
								: 'bg-[#FBEDEC] border-[#EBC5C1] text-[#8A2F26]'
						}`}
					>
						{item.admissionNote}
					</div>
				)}

				{/* Official alternative paths that don't decide the status (Technion short track, near-miss excellent bagrut) */}
				{item.alternativePaths?.map((path) => (
					<div key={path.id} className="p-2.5 rounded-xl text-[11px] border bg-accent-soft border-accent/20 text-accent space-y-0.5">
						<div className="font-bold">אפשרות נוספת: {path.title}</div>
						<div className="font-medium leading-relaxed">{path.description}</div>
					</div>
				))}

				{/* Prerequisite alerts preview */}
				{item.missingPrerequisites.length > 0 && (
					<div className="p-2.5 rounded-xl bg-warning-soft border border-warning/30 text-[11px] text-warning font-medium space-y-1.5">
						<div className="flex items-center gap-1.5">
							<AlertCircle className="h-3.5 w-3.5 shrink-0" />
							<span>חסרים {item.missingPrerequisites.length} תנאי סף: {item.missingPrerequisites.map((p) => p.name).join(', ')}</span>
						</div>
						{/* Official requirements: show what's required, what the applicant has, and the exam route when there is one */}
						{item.missingPrerequisites
							.filter((p) => p.id.startsWith('official-'))
							.map((p) => (
								<div key={p.id} className="pr-5 leading-relaxed text-[#6B4A10]">
									<span className="font-bold">נדרש:</span> {p.required}
									<span className="block">
										<span className="font-bold">יש לך:</span> {p.current}
									</span>
									{p.notes && <span className="block">{p.notes}</span>}
								</div>
							))}
					</div>
				)}
				{/* Official conditions that can't be checked yet (a psychometric section score wasn't entered) */}
				{item.prerequisites
					.filter((p) => p.unknown)
					.map((p) => (
						<div key={p.id} className="p-2.5 rounded-xl bg-paper border border-line text-[11px] text-ink-2 font-medium leading-relaxed">
							<span className="font-bold text-ink-2">{p.name}:</span> {p.required}. {p.notes}
						</div>
					))}
			</div>

			{/* Action Button */}
			<div className="flex items-center gap-2">
				{isAccepted ? (
					<>
						<a
							href={
								getUniversityRegistrationInfo(
									item.target.institutionName,
									item.target.calculatorId,
									item.target.program.url
								).registrationUrl
							}
							target="_blank"
							rel="noopener noreferrer"
							className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 bg-ink hover:bg-black text-white font-bold shadow-xs cursor-pointer"
						>
							<span>הרשמה לאוניברסיטה</span>
							<ExternalLink className="h-3.5 w-3.5" />
						</a>
						<button
							onClick={() => onViewGap(item.target.program.id)}
							className="py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 bg-paper hover:bg-line text-ink border border-line shrink-0 cursor-pointer"
							title="צפה בפרטי הקבלה המלאים"
						>
							<span>פרטים</span>
						</button>
					</>
				) : (
					<button
						onClick={() => onViewGap(item.target.program.id)}
						className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
							!isNoThreshold
								? 'bg-ink hover:bg-black text-white shadow-xs'
								: 'bg-paper hover:bg-line text-ink border border-line'
						}`}
					>
						<Sliders className="h-3.5 w-3.5" />
						<span>{!isNoThreshold ? 'תכנון מסלול קבלה לתואר זה' : 'פרטי קבלה מלאים'}</span>
						<ArrowLeft className="h-3.5 w-3.5" />
					</button>
				)}
			</div>
		</div>
	);
}
