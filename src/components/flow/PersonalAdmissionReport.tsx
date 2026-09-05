'use client';

import React, { useMemo } from 'react';
import {
	CheckCircle2,
	AlertCircle,
	XCircle,
	GraduationCap,
	ArrowLeft,
	Sparkles,
	Sliders,
	Award,
	HelpCircle
} from 'lucide-react';
import { ProgramGapAnalysis, AdmissionStatus } from '../../utils/analysis/gapAnalyzer';

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
			<div className="text-center py-16 px-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-4">
				<GraduationCap className="h-12 w-12 text-slate-500 mx-auto" />
				<h3 className="text-lg font-bold text-white">לא נבחרו תארים להצגה</h3>
				<p className="text-sm text-slate-400 max-w-md mx-auto">
					כדי לראות דוח קבלה אישי, עליך לבחור לפחות תואר אחד בשלב 2 (בחירת תארים מבוקשים).
				</p>
				<button
					onClick={onAddMorePrograms}
					className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition"
				>
					חזור לבחירת תארים
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Top Hero Stats */}
			<div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
				<div className="flex items-center justify-between flex-wrap gap-3">
					<div>
						<h2 className="text-xl sm:text-2xl font-black text-white">דוח סיכויי קבלה אישי</h2>
						<p className="text-xs sm:text-sm text-slate-400">
							הערכה מבוססת מנועי הסכם הרשמיים לכל התארים שבחרת
						</p>
					</div>
					<button
						onClick={onAddMorePrograms}
						className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
					>
						<span>ערוך סל תארים</span>
					</button>
				</div>

				{/* Stat Badges */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
						<span className="text-[11px] font-bold text-emerald-400 block">✅ התקבלת</span>
						<span className="text-2xl font-black text-emerald-300 mt-0.5 block">{counts.accepted}</span>
						<span className="text-[10px] text-emerald-400/80">עובר את רף הסכם</span>
					</div>

					<div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
						<span className="text-[11px] font-bold text-amber-400 block">⚠️ על הגבול</span>
						<span className="text-2xl font-black text-amber-300 mt-0.5 block">{counts.borderline}</span>
						<span className="text-[10px] text-amber-400/80">פער קל מהסף</span>
					</div>

					<div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
						<span className="text-[11px] font-bold text-rose-400 block">❌ טרם התקבלת</span>
						<span className="text-2xl font-black text-rose-300 mt-0.5 block">{counts.not_accepted}</span>
						<span className="text-[10px] text-rose-400/80">דרוש שיפור נתונים</span>
					</div>

					<div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
						<span className="text-[11px] font-bold text-purple-400 block">🎓 קבלה נפרדת</span>
						<span className="text-2xl font-black text-purple-300 mt-0.5 block">{counts.no_threshold}</span>
						<span className="text-[10px] text-purple-400/80">אודישן / ראיון</span>
					</div>
				</div>
			</div>

			{/* 1. Accepted Programs */}
			{grouped.accepted.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="h-5 w-5 text-emerald-400" />
						<h3 className="text-base font-black text-emerald-300">
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
						<AlertCircle className="h-5 w-5 text-amber-400" />
						<h3 className="text-base font-black text-amber-300">
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
							<XCircle className="h-5 w-5 text-rose-400" />
							<h3 className="text-base font-black text-rose-300">
								תארים שטרם התקבלת אליהם ({grouped.not_accepted.length})
							</h3>
						</div>
						<span className="text-xs text-slate-400">
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
						<HelpCircle className="h-5 w-5 text-purple-400" />
						<h3 className="text-base font-black text-purple-300">
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
		? 'border-emerald-500/40 bg-emerald-950/10'
		: isBorderline
		? 'border-amber-500/40 bg-amber-950/10'
		: isNoThreshold
		? 'border-purple-500/40 bg-purple-950/10'
		: 'border-rose-500/30 bg-rose-950/10';

	const badgeStyle = isAccepted
		? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
		: isBorderline
		? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
		: isNoThreshold
		? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
		: 'text-rose-400 bg-rose-500/10 border-rose-500/30';

	const badgeText = isAccepted
		? `התקבלת (+${item.gap})`
		: isBorderline
		? `על הגבול (${item.gap})`
		: isNoThreshold
		? 'קבלה נפרדת'
		: `פער: ${Math.abs(item.gap)} נק׳`;

	return (
		<div className={`p-5 rounded-2xl border ${borderStyle} shadow-lg space-y-4 flex flex-col justify-between`}>
			<div className="space-y-2.5">
				<div className="flex items-start justify-between gap-2">
					<div>
						<h4 className="text-base font-bold text-white leading-snug">
							{item.target.program.fieldOfStudy}
						</h4>
						<p className="text-xs text-cyan-400 font-semibold mt-0.5">
							{item.target.institutionName} · {item.target.program.degreeLevel}
						</p>
					</div>
					<span className={`text-xs font-black px-2.5 py-1 rounded-full border shrink-0 ${badgeStyle}`}>
						{badgeText}
					</span>
				</div>

				{/* Score Comparison Box */}
				{!isNoThreshold && (
					<div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center text-xs">
						<div>
							<span className="text-[10px] text-slate-400 block font-medium">הסכם שלך ({item.relevantSekemLabel})</span>
							<span className="text-base font-black text-white">{item.userSekem}</span>
						</div>
						<div>
							<span className="text-[10px] text-slate-400 block font-medium">סף קבלה נדרש</span>
							<span className="text-base font-black text-amber-300">{item.threshold}</span>
						</div>
					</div>
				)}

				{/* Prerequisite alerts preview */}
				{item.missingPrerequisites.length > 0 && (
					<div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-medium flex items-center gap-1.5">
						<AlertCircle className="h-3.5 w-3.5 shrink-0" />
						<span>חסרים {item.missingPrerequisites.length} תנאי סף ריאליים (מתמטיקה/פיזיקה)</span>
					</div>
				)}
			</div>

			{/* Action Button */}
			<button
				onClick={() => onViewGap(item.target.program.id)}
				className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
					!isAccepted && !isNoThreshold
						? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-blue-500/10'
						: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
				}`}
			>
				<Sliders className="h-3.5 w-3.5" />
				<span>{!isAccepted && !isNoThreshold ? 'צפה בניתוח פערים ופתרונות שיפור' : 'פרטי קבלה מלאים'}</span>
				<ArrowLeft className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}
