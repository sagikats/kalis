'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
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
import { ProgramGapAnalysis, AdmissionStatus } from '../../utils/analysis/gapAnalyzer';
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
			borderline: analyses.filter((a) => a.status === 'borderline').length,
			not_accepted: analyses.filter((a) => a.status === 'not_accepted').length,
			no_threshold: analyses.filter((a) => a.status === 'no_threshold').length
		};
	}, [analyses]);

	const grouped = useMemo(() => {
		return {
			accepted: analyses.filter((a) => a.status === 'accepted'),
			borderline: analyses.filter((a) => a.status === 'borderline'),
			not_accepted: analyses.filter((a) => a.status === 'not_accepted'),
			no_threshold: analyses.filter((a) => a.status === 'no_threshold')
		};
	}, [analyses]);

	if (analyses.length === 0) {
		return (
			<div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#E5DFD4] shadow-xs space-y-4">
				<GraduationCap className="h-12 w-12 text-[#8A847C] mx-auto" />
				<h3 className="text-lg font-bold text-[#222222]">לא נבחרו תארים להצגה</h3>
				<p className="text-sm text-[#66635C] max-w-md mx-auto">
					כדי לראות דוח קבלה אישי, עליך לבחור לפחות תואר אחד בשלב 2 (בחירת תארים מבוקשים).
				</p>
				<button
					onClick={onAddMorePrograms}
					className="px-6 py-2.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
				>
					חזור לבחירת תארים
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Top Hero Stats */}
			<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 shadow-xs space-y-5">
				<div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#EAE5DA] pb-4">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#DDD7CB] text-[#44423D] text-[11px] font-bold shadow-2xs">
								שלב 3 מתוך 4: תוצאות קבלה
							</span>
						</div>
						<h2 className="text-2xl sm:text-3xl font-black text-[#222222]">
							שלב 3: דוח סיכויי קבלה אישי
						</h2>
						<p className="text-xs sm:text-sm text-[#66635C] mt-1">
							הערכה מבוססת מנועי הסכם הרשמיים לכל התארים שבחרת
						</p>
					</div>
					<button
						onClick={onAddMorePrograms}
						className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#44423D] hover:text-[#222222] rounded-xl text-xs font-bold border border-[#E5DFD4] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
					>
						<span>ערוך סל תארים</span>
					</button>
				</div>

				{/* Stat Badges */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div className="p-3.5 rounded-2xl bg-[#EBF4EE] border border-[#C6DFCE] text-center">
						<span className="text-[11px] font-bold text-[#205739] block">✅ התקבלת</span>
						<span className="text-2xl font-black text-[#205739] mt-0.5 block">{counts.accepted}</span>
						<span className="text-[10px] text-[#205739]/80">עובר את רף הסכם</span>
					</div>

					<div className="p-3.5 rounded-2xl bg-[#FDF6E8] border border-[#ECDAB6] text-center">
						<span className="text-[11px] font-bold text-[#825B15] block">⚠️ על הגבול</span>
						<span className="text-2xl font-black text-[#825B15] mt-0.5 block">{counts.borderline}</span>
						<span className="text-[10px] text-[#825B15]/80">פער קל מהסף</span>
					</div>

					<div className="p-3.5 rounded-2xl bg-[#FDF1EE] border border-[#F1CAC1] text-center">
						<span className="text-[11px] font-bold text-[#9B3327] block">❌ טרם התקבלת</span>
						<span className="text-2xl font-black text-[#9B3327] mt-0.5 block">{counts.not_accepted}</span>
						<span className="text-[10px] text-[#9B3327]/80">דרוש שיפור נתונים</span>
					</div>

					<div className="p-3.5 rounded-2xl bg-[#F2F1F8] border border-[#D2CEEB] text-center">
						<span className="text-[11px] font-bold text-[#453D78] block">🎓 קבלה נפרדת</span>
						<span className="text-2xl font-black text-[#453D78] mt-0.5 block">{counts.no_threshold}</span>
						<span className="text-[10px] text-[#453D78]/80">אודישן / ראיון</span>
					</div>
				</div>

				{analyses.length > 0 && analyses.every((a) => a.userSekem === 0) && (
					<div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-start gap-3">
						<Sparkles className="h-5 w-5 text-[#1E597B] shrink-0 mt-0.5" />
						<div className="space-y-1">
							<span className="text-xs font-black text-[#1E597B] block">
								דוח קבלה ראשוני ללא ציון פסיכומטרי
							</span>
							<p className="text-[11px] text-[#66635C] leading-relaxed">
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
						<CheckCircle2 className="h-5 w-5 text-[#205739]" />
						<h3 className="text-base font-black text-[#205739]">
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

			{/* 2. Borderline Programs */}
			{grouped.borderline.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5 text-[#825B15]" />
						<h3 className="text-base font-black text-[#825B15]">
							תארים על הגבול — שיפור קל יביא לקבלה ({grouped.borderline.length})
						</h3>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{grouped.borderline.map((item) => (
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
							<XCircle className="h-5 w-5 text-[#9B3327]" />
							<h3 className="text-base font-black text-[#9B3327]">
								תארים שטרם התקבלת אליהם ({grouped.not_accepted.length})
							</h3>
						</div>
						<span className="text-xs text-[#66635C]">
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
						<h3 className="text-base font-black text-[#453D78]">
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
			<div className="pt-4 border-t border-[#E5DFD4] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7E7A73]">
				<p className="leading-relaxed">
					* החישובים מבוססים על נוסחאות המוסדות ומהווים כלי עזר והדמיה עצמאית בלבד. הקבלה הסופית והחישוב הקובע נקבעים אך ורק ע״י מוסד הלימוד האקדמי.
				</p>
				<div className="flex items-center gap-2.5 shrink-0">
					<Link href="/terms" target="_blank" className="underline hover:text-[#222222]">
						תנאי שימוש
					</Link>
					<span>•</span>
					<Link href="/privacy" target="_blank" className="underline hover:text-[#222222]">
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
	const isBorderline = item.status === 'borderline';
	const isNoThreshold = item.status === 'no_threshold';

	const borderStyle = isAccepted
		? 'border-[#C6DFCE] bg-[#FBFDFB]'
		: isBorderline
		? 'border-[#ECDAB6] bg-[#FDFCF8]'
		: isNoThreshold
		? 'border-[#D2CEEB] bg-[#FAF9FD]'
		: 'border-[#F1CAC1] bg-[#FDFBFB]';

	const badgeStyle = isAccepted
		? 'text-[#205739] bg-[#EBF4EE] border-[#C6DFCE]'
		: isBorderline
		? 'text-[#825B15] bg-[#FDF6E8] border-[#ECDAB6]'
		: isNoThreshold
		? 'text-[#453D78] bg-[#F2F1F8] border-[#D2CEEB]'
		: 'text-[#9B3327] bg-[#FDF1EE] border-[#F1CAC1]';

	const blockedByPsychFloor =
		!isAccepted && item.gap >= 0 && item.improvementOptions.some((o) => o.id === 'opt-psych-floor');
	// The sekem passes but an official condition (e.g. a math requirement) is missing
	const blockedByCondition = !isAccepted && !isNoThreshold && item.gap >= 0;

	const badgeText = isAccepted
		? item.admissionRoute === 'bagrut_only'
			? 'התקבלת (לפי בגרות)'
			: item.admissionRoute === 'psychometric_only'
			? 'התקבלת (לפי פסיכומטרי)'
			: item.admissionRoute === 'excellent_bagrut'
			? 'התקבלת (בגרות מצוינת)'
			: `התקבלת (+${item.gap})`
		: blockedByPsychFloor
		? 'חסר פסיכומטרי מינימלי'
		: blockedByCondition
		? 'חסר תנאי סף רשמי'
		: isBorderline
		? `על הגבול (${item.gap})`
		: isNoThreshold
		? 'קבלה נפרדת'
		: `פער: ${Math.abs(item.gap)} נק׳`;

	return (
		<div className={`p-5 rounded-2xl border ${borderStyle} shadow-xs space-y-4 flex flex-col justify-between`}>
			<div className="space-y-2.5">
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-3">
						<UniversityLogo institution={item.target.institutionId} size="md" />
						<div>
							<h4 className="text-base font-bold text-[#222222] leading-snug">
								{item.target.program.fieldOfStudy}
							</h4>
							<p className="text-xs text-[#66635C] font-semibold mt-0.5">
								{item.target.institutionName} · {item.target.program.degreeLevel}
							</p>
						</div>
					</div>
					<span className={`text-xs font-black px-2.5 py-1 rounded-full border shrink-0 ${badgeStyle}`}>
						{badgeText}
					</span>
				</div>

				{/* Score Comparison Box */}
				{!isNoThreshold && (
					<div className="grid grid-cols-2 gap-2 bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DFD4] text-center text-xs">
						<div>
							<span className="text-[10px] text-[#66635C] block font-medium">הסכם שלך ({item.relevantSekemLabel})</span>
							<span className="text-base font-black text-[#222222]">{item.userSekem}</span>
						</div>
						<div>
							<span className="text-[10px] text-[#66635C] block font-medium">
								{item.thresholdVerified ? 'סף קבלה רשמי' : 'סף קבלה משוער'}
							</span>
							<span className="text-base font-black text-[#825B15]">{item.threshold}</span>
							{item.officialThreshold !== undefined && item.officialThreshold !== item.threshold && (
								<span className="text-[10px] text-[#66635C] block">בסולם המוסד: {item.officialThreshold}</span>
							)}
							{item.thresholdSource && (
								<a
									href={item.thresholdSource.split(' — ')[0]}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(e) => e.stopPropagation()}
									title={item.thresholdSource.split(' — ').slice(1).join(' — ')}
									className="text-[10px] text-[#2F6FB0] underline block"
								>
									מקור{item.thresholdSource.includes(' — ') ? `: ${item.thresholdSource.split(' — ').slice(1).join(' — ')}` : ''}
								</a>
							)}
						</div>
					</div>
				)}

				{/* Official admission route / condition that decided the status */}
				{item.admissionNote && (
					<div
						className={`p-2.5 rounded-xl text-[11px] font-medium border ${
							item.status === 'accepted'
								? 'bg-[#EEF6EF] border-[#C9E2CD] text-[#2E6B3A]'
								: 'bg-[#FBEDEC] border-[#EBC5C1] text-[#8A2F26]'
						}`}
					>
						{item.admissionNote}
					</div>
				)}

				{/* Official alternative paths that don't decide the status (Technion short track, near-miss excellent bagrut) */}
				{item.alternativePaths?.map((path) => (
					<div key={path.id} className="p-2.5 rounded-xl text-[11px] border bg-[#EFF6FA] border-[#C5DFED] text-[#1E597B] space-y-0.5">
						<div className="font-black">אפשרות נוספת: {path.title}</div>
						<div className="font-medium leading-relaxed">{path.description}</div>
					</div>
				))}

				{/* Prerequisite alerts preview */}
				{item.missingPrerequisites.length > 0 && (
					<div className="p-2.5 rounded-xl bg-[#FDF6E8] border border-[#ECDAB6] text-[11px] text-[#825B15] font-medium space-y-1.5">
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
							className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-black shadow-xs cursor-pointer"
						>
							<span>הרשמה לאוניברסיטה</span>
							<ExternalLink className="h-3.5 w-3.5" />
						</a>
						<button
							onClick={() => onViewGap(item.target.program.id)}
							className="py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#222222] border border-[#E5DFD4] shrink-0 cursor-pointer"
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
								? 'bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white shadow-xs'
								: 'bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#222222] border border-[#E5DFD4]'
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
