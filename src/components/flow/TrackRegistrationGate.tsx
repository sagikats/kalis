'use client';

import React from 'react';
import {
	Lock,
	Sparkles,
	ArrowLeft,
	ArrowRight,
	CheckCircle2
} from 'lucide-react';
import UniversityLogo from '../common/UniversityLogo';
import { ProgramGapAnalysis } from '../../utils/analysis/gapAnalyzer';
import { useAuth } from '@/context/AuthContext';

interface TrackRegistrationGateProps {
	analysis: ProgramGapAnalysis;
	onBackToReport: () => void;
}

export default function TrackRegistrationGate({
	analysis,
	onBackToReport
}: TrackRegistrationGateProps) {
	const { openAuthModal } = useAuth();
	const { target, gap, userSekem, threshold } = analysis;
	const formattedSekem = userSekem ? userSekem.toFixed(2) : '—';
	const formattedThreshold = threshold ? threshold.toFixed(2) : '—';
	const formattedGap = Math.abs(gap).toFixed(2);
	const programName = target.program.fieldOfStudy || 'תואר אקדמי';

	return (
		<div className="w-full max-w-5xl mx-auto space-y-6 dir-rtl" dir="rtl">
			{/* Top Bar: Target Degree Header */}
			<div className="bg-white rounded-3xl border border-[#E5DFD4] p-5 sm:p-7 shadow-xs">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-center p-2 shrink-0">
							<UniversityLogo
								institution={target.calculatorId}
								size="lg"
								className="w-full h-full object-contain"
							/>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="text-xs font-semibold text-[#88857E]">
									{target.institutionName}
								</span>
								<span className="text-xs text-[#CDC5B6]">•</span>
								<span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-[#FFFBEB] border border-[#FDE68A] px-2 py-0.5 rounded-full">
									פער נדרש: {formattedGap} נק'
								</span>
							</div>
							<h2 className="text-xl sm:text-2xl font-black text-[#222222] mt-0.5">
								{programName}
							</h2>
						</div>
					</div>

					{/* Metrics summary */}
					<div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end bg-[#FAF8F5] p-3 rounded-2xl border border-[#E5DFD4]">
						<div className="text-center px-3">
							<span className="text-[10px] text-[#88857E] block font-medium">הסכם שלך</span>
							<span className="text-sm sm:text-base font-extrabold text-[#222222]">{formattedSekem}</span>
						</div>
						<div className="w-px h-7 bg-[#E5DFD4]" />
						<div className="text-center px-3">
							<span className="text-[10px] text-[#88857E] block font-medium">סף קבלה</span>
							<span className="text-sm sm:text-base font-extrabold text-[#222222]">{formattedThreshold}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Main Gate Card */}
			<div className="relative bg-white rounded-3xl border border-[#E5DFD4] overflow-hidden shadow-sm">
				{/* Background Teaser Grid (Blurred) */}
				<div className="p-6 sm:p-8 space-y-6 filter blur-[6px] select-none pointer-events-none opacity-45">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<div className="h-6 w-48 bg-[#DDD7CC] rounded-lg animate-pulse" />
							<div className="h-4 w-72 bg-[#EAE5DB] rounded-md animate-pulse" />
						</div>
						<div className="h-8 w-24 bg-[#EAE5DB] rounded-full animate-pulse" />
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
						{/* Teaser Card 1 */}
						<div className="rounded-2xl border border-[#E5DFD4] bg-[#FAF8F5] p-5 space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
									מסלול 1 // מיקוד
								</span>
								<span className="text-xs text-[#88857E]">8 שבועות</span>
							</div>
							<div className="h-5 w-3/4 bg-[#DDD7CC] rounded-md" />
							<div className="space-y-2 pt-2">
								<div className="h-3 w-full bg-[#EAE5DB] rounded-sm" />
								<div className="h-3 w-5/6 bg-[#EAE5DB] rounded-sm" />
								<div className="h-3 w-4/6 bg-[#EAE5DB] rounded-sm" />
							</div>
							<div className="pt-4 border-t border-[#E5DFD4] flex justify-between">
								<span className="h-4 w-16 bg-[#DDD7CC] rounded-sm" />
								<span className="h-4 w-12 bg-[#DDD7CC] rounded-sm" />
							</div>
						</div>

						{/* Teaser Card 2 */}
						<div className="rounded-2xl border border-[#E5DFD4] bg-[#FAF8F5] p-5 space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
									מסלול 2 // פיזור סיכונים
								</span>
								<span className="text-xs text-[#88857E]">16 שבועות</span>
							</div>
							<div className="h-5 w-3/4 bg-[#DDD7CC] rounded-md" />
							<div className="space-y-2 pt-2">
								<div className="h-3 w-full bg-[#EAE5DB] rounded-sm" />
								<div className="h-3 w-5/6 bg-[#EAE5DB] rounded-sm" />
								<div className="h-3 w-4/6 bg-[#EAE5DB] rounded-sm" />
							</div>
							<div className="pt-4 border-t border-[#E5DFD4] flex justify-between">
								<span className="h-4 w-16 bg-[#DDD7CC] rounded-sm" />
								<span className="h-4 w-12 bg-[#DDD7CC] rounded-sm" />
							</div>
						</div>

						{/* Teaser Card 3 */}
						<div className="rounded-2xl border border-[#E5DFD4] bg-[#FAF8F5] p-5 space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
									חלופה // מכינה / אפיק מעבר
								</span>
								<span className="text-xs text-[#88857E]">מסלול עוקף</span>
							</div>
							<div className="h-5 w-3/4 bg-[#DDD7CC] rounded-md" />
							<div className="space-y-2 pt-2">
								<div className="h-3 w-full bg-[#EAE5DB] rounded-sm" />
								<div className="h-3 w-5/6 bg-[#EAE5DB] rounded-sm" />
								<div className="h-3 w-4/6 bg-[#EAE5DB] rounded-sm" />
							</div>
							<div className="pt-4 border-t border-[#E5DFD4] flex justify-between">
								<span className="h-4 w-16 bg-[#DDD7CC] rounded-sm" />
								<span className="h-4 w-12 bg-[#DDD7CC] rounded-sm" />
							</div>
						</div>
					</div>
				</div>

				{/* Foreground Conversion Overlay */}
				<div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-gradient-to-b from-white/80 via-white/95 to-white">
					{/* Glowing Lock Badge */}
					<div className="relative mb-5">
						<div className="absolute -inset-2 bg-amber-500/20 rounded-full blur-xl" />
						<div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#FAF8F5] border-2 border-[#E5DFD4] flex items-center justify-center text-[#3C3C3C] shadow-md">
							<Lock className="w-8 h-8 sm:w-9 sm:h-9 text-[#3C3C3C]" />
						</div>
					</div>

					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E5DFD4] text-xs font-bold text-[#55524B] mb-3">
						<Sparkles className="w-3.5 h-3.5 text-amber-600" />
						<span>3 מסלולי שיפור אופטימליים חושבו בהצלחה</span>
					</div>

					<h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#222222] tracking-tight max-w-xl">
						המסלולים המותאמים אישית שלך מוכנים לצפייה
					</h3>

					<p className="mt-3 text-sm sm:text-base text-[#66635C] max-w-lg leading-relaxed">
						כדי לצפות במסלולי הקבלה, המלצות המבחנים המדויקות, שעות הלמידה ולוח מועדי הבחינות — <span className="font-bold text-[#222222]">יש להירשם לאתר בחינם</span>.
					</p>

					{/* Benefits Checkmarks */}
					<div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-right max-w-md w-full">
						<div className="flex items-center gap-2 text-xs sm:text-sm text-[#44423D] bg-[#FAF8F5] px-3.5 py-2 rounded-xl border border-[#E5DFD4]">
							<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
							<span>צפייה ב-3 המסלולים המותאמים אישית</span>
						</div>
						<div className="flex items-center gap-2 text-xs sm:text-sm text-[#44423D] bg-[#FAF8F5] px-3.5 py-2 rounded-xl border border-[#E5DFD4]">
							<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
							<span>לוח מועדי בחינות חורף, אביב וקיץ</span>
						</div>
						<div className="flex items-center gap-2 text-xs sm:text-sm text-[#44423D] bg-[#FAF8F5] px-3.5 py-2 rounded-xl border border-[#E5DFD4]">
							<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
							<span>סימולטור What-If לבניית מסלול אישי</span>
						</div>
						<div className="flex items-center gap-2 text-xs sm:text-sm text-[#44423D] bg-[#FAF8F5] px-3.5 py-2 rounded-xl border border-[#E5DFD4]">
							<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
							<span>שמירה וסנכרון של הנתונים בכל מכשיר</span>
						</div>
					</div>

					{/* CTA Actions */}
					<div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
						<button
							onClick={() => openAuthModal('register')}
							className="w-full flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
						>
							<span>הרשמה מהירה ופתיחת המסלולים (חינם)</span>
							<ArrowLeft className="w-4 h-4" />
						</button>

						<button
							onClick={() => openAuthModal('login')}
							className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-white hover:bg-[#F3EFE8] text-[#222222] font-semibold text-xs sm:text-sm border border-[#DDD7CC] transition cursor-pointer"
						>
							כבר רשום? התחבר
						</button>
					</div>

					<p className="mt-4 text-[11px] text-[#88857E]">
						ההרשמה חינמית לחלוטין וללא שום התחייבות • 100% הגנה על פרטיות המידע
					</p>
				</div>
			</div>

			{/* Back Button */}
			<div className="flex justify-start">
				<button
					onClick={onBackToReport}
					className="inline-flex items-center gap-2 text-xs font-bold text-[#66635C] hover:text-[#222222] transition cursor-pointer px-4 py-2 rounded-xl hover:bg-white border border-transparent hover:border-[#E5DFD4]"
				>
					<ArrowRight className="w-4 h-4" />
					<span>חזור לדוח הקבלה המלא (שלב 3)</span>
				</button>
			</div>
		</div>
	);
}
