'use client';

import React, { useState } from 'react';
import {
	Zap,
	ShieldCheck,
	GraduationCap,
	Clock,
	CheckCircle2,
	ArrowRight,
	TrendingUp,
	Calendar,
	BookOpen,
	Brain,
	Sparkles,
	Printer,
	ChevronLeft,
	HelpCircle,
	AlertTriangle,
	Award,
	Sliders,
	ChevronDown,
	ChevronUp,
	Bookmark,
	BookmarkCheck,
	Loader2
} from 'lucide-react';
import { RecommendedTrack } from '@/utils/analysis/trackGenerator';
import { ProgramGapAnalysis, UserAcademicProfile } from '@/utils/analysis/gapAnalyzer';
import { InstitutionSekemResult } from '@/utils/calculators/multiCalculator';
import { getSessionInfo, getSubjectExamSession } from '@/modules/optimizer';
import WhatIfSimulator from './WhatIfSimulator';
import UniversityLogo from '../common/UniversityLogo';
import { useAuth } from '@/context/AuthContext';

interface RecommendedTracksViewProps {
	analysis: ProgramGapAnalysis;
	allAnalyses?: ProgramGapAnalysis[];
	tracks: RecommendedTrack[];
	userProfile?: UserAcademicProfile;
	institutionResult?: InstitutionSekemResult;
	defaultTab?: 'recommended' | 'custom_builder';
	mechinaAvailable?: boolean;
	mechinaReason?: string;
	onSelectProgram?: (programId: string) => void;
	onEditPreferences: () => void;
	onBackToReport: () => void;
	onApplyCustomScenario?: (customPsych: number, customSubjects: any[], simulatedSekem: number) => void;
}

export default function RecommendedTracksView({
	analysis,
	allAnalyses,
	tracks,
	userProfile,
	institutionResult,
	defaultTab = 'recommended',
	mechinaAvailable,
	mechinaReason,
	onSelectProgram,
	onEditPreferences,
	onBackToReport,
	onApplyCustomScenario
}: RecommendedTracksViewProps) {
	const [activeTab, setActiveTab] = useState<'recommended' | 'custom_builder'>(defaultTab);
	const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[1]?.id || tracks[0]?.id || '');
	const [isPrintMode, setIsPrintMode] = useState(false);
	const [customScenarioApplied, setCustomScenarioApplied] = useState(false);

	// Explicit Track Saving State (Only on User Click)
	const { user, refreshUser } = useAuth();
	const [savedTrackMap, setSavedTrackMap] = useState<Record<string, { savedAt: Date; candidateNumber: string }>>({});
	const [savingTrackId, setSavingTrackId] = useState<string | null>(null);
	const [saveNotification, setSaveNotification] = useState<string | null>(null);

	const handleSaveTrack = async (track: any) => {
		const trackId = track.id || 'track-standard';
		setSavingTrackId(trackId);
		try {
			const existingUserId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('kalis_user_id') || undefined : undefined);

			const res = await fetch('/api/tracks/save', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: existingUserId,
					programId: analysis.target.program.id,
					track: {
						id: track.id,
						title: track.title,
						badge: track.badge,
						badgeColor: track.badgeColor,
						targetSekem: track.targetSekem,
						targetPsychometric: track.targetPsychometric,
						targetBagrutAverage: track.targetBagrutAverage,
						currentPsychometric: track.currentPsychometric,
						currentBagrutAverage: track.currentBagrutAverage,
						strategyDescription: track.strategyDescription || track.description || '',
						estimatedWeeks: track.estimatedWeeks,
						weeklyHours: track.weeklyHours,
						feasibility: track.feasibility,
						feasibilityExplanation: track.feasibilityExplanation,
						keyAdvantage: track.keyAdvantage,
						milestones: track.milestones || track.steps,
						recommendedLevers: track.recommendedLevers || track.recommendedSubjectImprovements
					}
				})
			});

			const data = await res.json();
			if (data.success) {
				if (typeof window !== 'undefined' && data.userId) {
					localStorage.setItem('kalis_user_id', data.userId);
					if (data.candidateNumber) {
						localStorage.setItem('kalis_candidate_number', data.candidateNumber);
					}
				}
				if (refreshUser) {
					refreshUser();
				}
				setSavedTrackMap((prev) => ({
					...prev,
					[trackId]: { savedAt: new Date(), candidateNumber: data.candidateNumber }
				}));
				setSaveNotification(`המסלול נשמר בהצלחה במסד הנתונים! (מספר מועמד: ${data.candidateNumber})`);
				setTimeout(() => setSaveNotification(null), 6000);
			} else {
				alert(data.error || 'שגיאה בשמירת המסלול');
			}
		} catch (err: any) {
			console.error('Failed to save track:', err);
			alert('אירעה שגיאה בעת שמירת המסלול במסד הנתונים');
		} finally {
			setSavingTrackId(null);
		}
	};

	// Mechina Opt-In State
	const [mechinaTrack, setMechinaTrack] = useState<any | null>(null);
	const [isLoadingMechina, setIsLoadingMechina] = useState<boolean>(false);
	const [showMechinaDetails, setShowMechinaDetails] = useState<boolean>(false);

	const isMechinaApplicable = mechinaAvailable ?? (analysis.status !== 'accepted' || analysis.gap < 0);

	const handleToggleMechina = async () => {
		if (showMechinaDetails) {
			setShowMechinaDetails(false);
			return;
		}
		if (mechinaTrack) {
			setShowMechinaDetails(true);
			return;
		}
		setIsLoadingMechina(true);
		try {
			const res = await fetch('/api/tracks/mechina', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					programId: analysis.target.program.id,
					profile: {
						bagrutSubjects: (userProfile?.bagrutSubjects && userProfile.bagrutSubjects.length > 0
							? userProfile.bagrutSubjects
							: [{ name: 'מתמטיקה', units: 4, grade: 80 }]
						).map((s) => ({
							name: s.name,
							units: s.units,
							grade: s.grade
						})),
						mathUnits: userProfile?.mathUnits || 4,
						mathGrade: userProfile?.mathGrade || 80,
						physicsUnits: userProfile?.physicsUnits ?? 0,
						physicsGrade: userProfile?.physicsGrade ?? 0,
						psychometricGeneral: userProfile?.psychometricGeneral ?? 0,
						psychometricQuant: userProfile?.psychometricQuant ?? 0,
						psychometricVerbal: userProfile?.psychometricVerbal ?? 0,
						psychometricEnglish: userProfile?.psychometricEnglish ?? 0,
						hasTakenPsychometric: (userProfile?.psychometricGeneral || 0) > 0
					}
				})
			});
			const data = await res.json();
			if (data.success && data.track) {
				setMechinaTrack(data.track);
				setShowMechinaDetails(true);
			}
		} catch (err) {
			console.error('Failed to load mechina track', err);
		} finally {
			setIsLoadingMechina(false);
		}
	};

	const handlePrint = () => {
		window.print();
	};

	const handleApplyScenario = (customPsych: number, customSubjects: any[], simulatedSekem: number) => {
		setCustomScenarioApplied(true);
		if (onApplyCustomScenario) {
			onApplyCustomScenario(customPsych, customSubjects, simulatedSekem);
		}
		setTimeout(() => setCustomScenarioApplied(false), 5000);
	};

	const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];
	const isTechnion = analysis.target.calculatorId === 'technion';

	return (
		<div className="space-y-8 dir-rtl text-right">
			{/* Top Header Card */}
			<div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
				<div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

				{/* Top Meta & Action Toolbar Row */}
				<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black rounded-lg flex items-center gap-1.5">
							<Sparkles className="h-3.5 w-3.5 text-cyan-400" />
							<span>שלב 4: תכנון מסלולי פעולה ובניית מסלול אישי</span>
						</span>
						<span className="px-3 py-1 bg-slate-950/80 border border-slate-800 text-xs font-bold text-slate-300 rounded-lg flex items-center gap-2">
							<UniversityLogo institution={analysis.target.institutionId} size="xs" shape="circle" />
							<span>{analysis.target.institutionName} • {analysis.target.program.fieldOfStudy}</span>
						</span>
					</div>

					<div className="flex items-center gap-2.5 flex-wrap">
						{allAnalyses && allAnalyses.length > 1 && (
							<div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700 px-3 py-1.5 rounded-xl">
								<span className="text-xs font-bold text-slate-400">החלף תואר:</span>
								<select
									value={analysis.target.program.id}
									onChange={(e) => onSelectProgram?.(e.target.value)}
									className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
								>
									{allAnalyses.map((a) => {
										const icon = a.status === 'accepted' ? '✅' : a.status === 'borderline' ? '⚠️' : '❌';
										return (
											<option key={a.target.program.id} value={a.target.program.id} className="bg-slate-900 text-white">
												{icon} {a.target.program.fieldOfStudy} ({a.target.institutionName})
											</option>
										);
									})}
								</select>
							</div>
						)}

						<button
							onClick={onEditPreferences}
							className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700"
						>
							<Sparkles className="h-3.5 w-3.5 text-cyan-400" />
							<span>ערוך שאלון העדפות</span>
						</button>
						<button
							onClick={handlePrint}
							className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700"
							title="הדפס או שמור כ-PDF"
						>
							<Printer className="h-3.5 w-3.5 text-slate-400" />
							<span>הדפס</span>
						</button>
						<button
							onClick={onBackToReport}
							className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700"
						>
							<ArrowRight className="h-3.5 w-3.5" />
							<span>חזור לדוח הקבלה</span>
						</button>
					</div>
				</div>

				{/* Main Hero Content & Gap Summary Widget */}
				<div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
					<div className="flex-1 min-w-0 space-y-2">
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
							תוכנית פעולה לקבלה לתואר המבוקש
						</h2>
						<p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
							בחר באחד מ-{tracks.length} המסלולים הריאליים המותאמים שהופקו עבורך, או השתמש בחלונית בניית המסלול האישי שלמטה כדי להרכיב שילוב ציונים ומקצועות משלך.
						</p>
					</div>

					{/* Target & Gap Metrics Box */}
					<div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 shrink-0 shadow-lg">
						<div className="text-center px-2 min-w-[75px]">
							<span className="text-[11px] font-bold text-slate-400 block">סכם קיים</span>
							<span className="text-xl font-black text-white dir-ltr">{analysis.userSekem}</span>
							<span className="text-[10px] text-slate-500 block truncate max-w-[110px]">{analysis.relevantSekemLabel}</span>
						</div>
						<div className="h-10 w-px bg-slate-800" />
						<div className="text-center px-2 min-w-[75px]">
							<span className="text-[11px] font-bold text-slate-400 block">סף יעד</span>
							<span className="text-xl font-black text-amber-300 dir-ltr">{analysis.threshold || '—'}</span>
							<span className="text-[10px] text-slate-500 block truncate max-w-[110px]">סף קבלה רשמי</span>
						</div>
						{analysis.threshold && (
							<>
								<div className="h-10 w-px bg-slate-800" />
								<div className="text-center px-3 py-1 bg-amber-500/10 rounded-xl border border-amber-500/20">
									<span className="text-[10px] font-black text-amber-400 block uppercase tracking-wider">פער לסגירה</span>
									<span className="text-lg font-black text-amber-300 dir-ltr">
										{analysis.gap > 0 ? `+${analysis.gap}` : analysis.gap}
									</span>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Prerequisites Warning if applicable */}
				{analysis.missingPrerequisites && analysis.missingPrerequisites.length > 0 && (
					<div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
						<AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
						<span>
							<strong>תנאי סף נדרשים לתואר זה:</strong> {analysis.missingPrerequisites.map((p) => p.name).join(' | ')}. מומלץ לשלב את השלמתם במסלול העבודה שלך.
						</span>
					</div>
				)}

				{/* Realism Badge Guarantee */}
				<div className="pt-4 border-t border-slate-800/80 flex items-center gap-3 text-xs text-slate-300 bg-slate-950/40 rounded-2xl p-3 border border-slate-800">
					<ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
					<div>
						<strong className="text-white font-black">אלגוריתם מבוסס מודל ריאליות קפדני:</strong>{' '}
						היעדים מוגבלים לחסמי שיפור סטטיסטיים מוכחים (לפי נתוני מרכז הבחינות NITE). ללא דרישות לציון פסיכומטרי 740+ מנקודת פתיחה לא ריאלית, ותוך שילוב שיפור בגרויות נקודתי היכן שנדרש.
					</div>
				</div>
			</div>

			{/* ========================================================================= */}
			{/* VIEW SWITCHER TABS: RECOMMENDED TRACKS vs PERSONAL BUILDER */}
			{/* ========================================================================= */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 shadow-xl">
				<div className="flex items-center gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
					<button
						type="button"
						onClick={() => setActiveTab('recommended')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all ${
							activeTab === 'recommended'
								? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
								: 'text-slate-400 hover:text-white hover:bg-slate-800/60'
						}`}
					>
						<Sparkles className="h-4 w-4 text-cyan-300" />
						<span>ריכוז המסלולים המומלץ ({tracks.length})</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab('custom_builder')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all ${
							activeTab === 'custom_builder'
								? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
								: 'text-slate-400 hover:text-white hover:bg-slate-800/60'
						}`}
					>
						<Sliders className="h-4 w-4 text-indigo-300" />
						<span>מסלול בנייה אישי 🎛️ (What-If Lab)</span>
						{customScenarioApplied && (
							<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
						)}
					</button>
				</div>

				<div className="text-xs text-slate-400 px-3 flex items-center gap-2">
					{activeTab === 'recommended' ? (
						<span>💡 3 מסלולים מותאמים אישית לבחירתך</span>
					) : (
						<span>🔬 מעבדת סימולציה עצמאית בזמן אמת</span>
					)}
				</div>
			</div>

			{/* Save Track Notification Banner */}
			{saveNotification && (
				<div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/10">
					<div className="flex items-center gap-2.5">
						<CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
						<span>{saveNotification}</span>
					</div>
					<button
						onClick={() => setSaveNotification(null)}
						className="text-slate-400 hover:text-white p-1"
					>
						✕
					</button>
				</div>
			)}

			{/* ========================================================================= */}
			{/* TAB 1: RECOMMENDED TRACKS SUMMARY */}
			{/* ========================================================================= */}
			{activeTab === 'recommended' && (
				<div className="space-y-8">
					<div className={`grid grid-cols-1 ${tracks.length === 2 ? 'md:grid-cols-2 max-w-5xl mx-auto' : 'lg:grid-cols-3'} gap-6`}>
				{tracks.map((track) => {
					const isSelected = track.id === selectedTrackId;
					const isBalanced = track.id === 'track-balanced' || track.id === 'track-risk-spread';
					const isFast = track.id.startsWith('track-fast') || track.id === 'track-maximize-exam';

					let TrackIcon = ShieldCheck;
					if (isFast) TrackIcon = Zap;
					else if (track.id.includes('anchor')) TrackIcon = GraduationCap;

					return (
						<div
							key={track.id}
							onClick={() => setSelectedTrackId(track.id)}
							className={`cursor-pointer rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
								isSelected
									? 'bg-slate-900 border-cyan-500 shadow-2xl shadow-cyan-500/10 ring-2 ring-cyan-500/30'
									: 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
							}`}
						>
							{/* Track Top Banner */}
							<div className="p-6 pb-4 space-y-4">
								<div className="flex items-center justify-between gap-2">
									<span
										className={`px-3 py-1 text-[11px] font-black rounded-lg text-white bg-gradient-to-r ${track.badgeColor}`}
									>
										{track.badge}
									</span>
									<div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
										<Clock className="h-3.5 w-3.5" />
										<span>{track.estimatedWeeks} שבועות</span>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<div
										className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
											isFast
												? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
												: isBalanced
												? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
												: 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
										}`}
									>
										<TrackIcon className="h-5 w-5" />
									</div>
									<div>
										<h3 className="text-lg font-black text-white leading-snug">{track.title}</h3>
										<span className="text-[11px] text-cyan-400 font-bold block mt-0.5">
											{track.weeklyHours} שעות למידה שבועיות
										</span>
									</div>
								</div>

								<p className="text-xs text-slate-300 leading-relaxed min-h-[48px]">
									{track.strategyDescription}
								</p>

								{/* Metric Target Boxes */}
								<div className="space-y-2 pt-2 border-t border-slate-800">
									{/* Target Sekem if exists */}
									{track.targetSekem !== undefined && (
										<div
											className={`border rounded-2xl p-3 flex items-center justify-between shadow-sm ${
												analysis.threshold && track.targetSekem < analysis.threshold
													? 'bg-amber-950/40 border-amber-500/30'
													: 'bg-emerald-950/40 border-emerald-500/30'
											}`}
										>
											<div className="flex items-center gap-2">
												<Sparkles
													className={`h-4 w-4 ${
														analysis.threshold && track.targetSekem < analysis.threshold
															? 'text-amber-400'
															: 'text-emerald-400'
													}`}
												/>
												<span
													className={`text-xs font-bold ${
														analysis.threshold && track.targetSekem < analysis.threshold
															? 'text-amber-300'
															: 'text-emerald-300'
													}`}
												>
													{analysis.threshold && track.targetSekem < analysis.threshold
														? 'סכם מחושב מוערך:'
														: 'סכם מחושב מובטח:'}
												</span>
											</div>
											<div className="text-left dir-ltr">
												<span
													className={`text-sm font-black ${
														analysis.threshold && track.targetSekem < analysis.threshold
															? 'text-amber-400'
															: 'text-emerald-400'
													}`}
												>
													{track.targetSekem.toFixed(isTechnion ? 2 : 1)}
												</span>
												{analysis.threshold && (
													<span
														className={`text-[10px] ml-1.5 font-medium ${
															analysis.threshold && track.targetSekem < analysis.threshold
																? 'text-amber-400/80'
																: 'text-emerald-400/80'
														}`}
													>
														(סף: {analysis.threshold})
													</span>
												)}
											</div>
										</div>
									)}

									{/* Psychometric target if exists */}
									{typeof track.targetPsychometric === 'number' && track.targetPsychometric > 0 && (
										<div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Brain className="h-4 w-4 text-cyan-400" />
												<span className="text-xs font-bold text-slate-300">יעד פסיכומטרי:</span>
											</div>
											<div className="text-left dir-ltr">
												{track.targetPsychometric > (track.currentPsychometric || 0) ? (
													<>
														{(track.currentPsychometric || 0) > 0 && (
															<span className="text-xs text-slate-500 line-through mr-2">
																{track.currentPsychometric}
															</span>
														)}
														<span className="text-sm font-black text-cyan-400">
															{track.targetPsychometric}
														</span>
														{(track.currentPsychometric || 0) > 0 && (
															<span className="text-[10px] text-emerald-400 ml-1 font-bold">
																(+{track.targetPsychometric - (track.currentPsychometric || 0)})
															</span>
														)}
													</>
												) : (
													<span className="text-xs text-slate-400 font-bold">
														{track.targetPsychometric} (שומר על הקיים)
													</span>
												)}
											</div>
										</div>
									)}

									{/* Bagrut target if exists */}
									{(() => {
										const hasSubjectImprovements = Boolean(
											track.recommendedSubjectImprovements && track.recommendedSubjectImprovements.length > 0
										);
										const hasBagrutIncrease = Boolean(
											track.targetBagrutAverage && track.targetBagrutAverage > (track.currentBagrutAverage || 0)
										);

										if (hasBagrutIncrease) {
											return (
												<div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
													<div className="flex items-center gap-2">
														<BookOpen className="h-4 w-4 text-indigo-400" />
														<span className="text-xs font-bold text-slate-300">ממוצע בגרות:</span>
													</div>
													<div className="text-left dir-ltr">
														<span className="text-xs text-slate-500 line-through mr-2">
															{track.currentBagrutAverage?.toFixed(1)}
														</span>
														<span className="text-sm font-black text-indigo-400">
															{track.targetBagrutAverage?.toFixed(1)}
														</span>
														<span className="text-[10px] text-emerald-400 ml-1 font-bold">
															(+{((track.targetBagrutAverage || 0) - (track.currentBagrutAverage || 0)).toFixed(1)})
														</span>
													</div>
												</div>
											);
										}

										if (hasSubjectImprovements) {
											return (
												<div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
													<div className="flex items-center gap-2">
														<BookOpen className="h-4 w-4 text-indigo-400" />
														<span className="text-xs font-bold text-slate-300">ממוצע בגרות:</span>
													</div>
													<div className="text-left dir-ltr">
														<span className="text-sm font-black text-indigo-400">
															{(track.targetBagrutAverage || track.currentBagrutAverage)?.toFixed(1)}
														</span>
														<span className="text-[10px] text-slate-400 ml-1 font-bold">
															(משתפר עם המקצועות)
														</span>
													</div>
												</div>
											);
										}

										return (
											<div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
												<div className="flex items-center gap-2">
													<BookOpen className="h-4 w-4 text-slate-500" />
													<span className="text-xs font-bold text-slate-400">ממוצע בגרות:</span>
												</div>
												<div className="text-left dir-ltr">
													<span className="text-xs font-bold text-slate-400">
														{track.currentBagrutAverage?.toFixed(1)} (ללא צורך בשיפור)
													</span>
												</div>
											</div>
										);
									})()}

									{/* Subject and psychometric improvement details */}
									{(() => {
										const needsPsychImprovement = Boolean(
											track.targetPsychometric && (
												(track.currentPsychometric || 0) === 0
													? track.targetPsychometric > 0
													: track.targetPsychometric > (track.currentPsychometric || 0)
											)
										);
										const hasSubjectImprovements = Boolean(
											track.recommendedSubjectImprovements && track.recommendedSubjectImprovements.length > 0
										);

										if (!needsPsychImprovement && !hasSubjectImprovements) return null;

										return (
											<div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3 space-y-2">
												<div className="flex items-center justify-between">
													<span className="text-[11px] font-bold text-slate-400 block">
														{needsPsychImprovement && hasSubjectImprovements
															? 'מקצועות ומרכיבים מומלצים לשיפור:'
															: needsPsychImprovement
															? 'מרכיב מומלץ לשיפור:'
															: 'מקצועות מומלצים לשיפור:'}
													</span>
													<span className="text-[10px] text-cyan-400/90 font-bold">
														{[
															needsPsychImprovement ? 'פסיכומטרי' : null,
															hasSubjectImprovements ? `${track.recommendedSubjectImprovements.length} בגרויות` : null
														].filter(Boolean).join(' + ')}
													</span>
												</div>

												<div className="space-y-1.5">
													{/* Psychometric improvement row with session */}
													{needsPsychImprovement && (() => {
														const sInfo = getSessionInfo('spring_psych');
														return (
															<div className="text-xs flex items-center justify-between gap-2 p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/25 flex-wrap">
																<div className="flex items-center gap-1.5 truncate">
																	<Brain className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
																	<span className="text-cyan-200 font-bold truncate">
																		בחינה פסיכומטרית:
																	</span>
																	<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sInfo.badgeClass} shrink-0`}>
																		{sInfo.iconEmoji} {sInfo.badgeLabel}
																	</span>
																</div>
																<span className="text-cyan-300 font-bold shrink-0 dir-ltr flex items-center gap-1">
																	{(track.currentPsychometric || 0) > 0 ? (
																		<>
																			<span className="text-slate-400 font-normal">{track.currentPsychometric}</span>
																			<span className="text-slate-500 font-normal">➔</span>
																			<span className="text-white font-black">{track.targetPsychometric}</span>
																			<span className="text-[10px] text-emerald-400 font-bold ml-0.5">
																				(+{track.targetPsychometric! - (track.currentPsychometric || 0)})
																			</span>
																		</>
																	) : (
																		<>
																			<span className="text-[10px] text-slate-400 font-normal">יעד:</span>
																			<span className="text-white font-black">{track.targetPsychometric}</span>
																		</>
																	)}
																</span>
															</div>
														);
													})()}

													{/* Bagrut subjects improvement rows with session */}
													{track.recommendedSubjectImprovements.map((s, idx) => {
														const sSession = s.session || getSubjectExamSession(s.subjectName, s.targetUnits);
														const sInfo = getSessionInfo(sSession);
														return (
															<div key={idx} className="text-xs flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex-wrap">
																<div className="flex items-center gap-1.5 truncate">
																	<span className="text-slate-200 font-medium truncate">
																		{s.subjectName} ({s.targetUnits} יח״ל):
																	</span>
																	<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sInfo.badgeClass} shrink-0`}>
																		{sInfo.iconEmoji} {sInfo.badgeLabel}
																	</span>
																</div>
																<span className="text-cyan-300 font-bold shrink-0 dir-ltr flex items-center gap-1">
																	{s.currentGrade > 0 ? (
																		<>
																			<span className="text-slate-400 font-normal">{s.currentGrade}</span>
																			<span className="text-slate-500 font-normal">➔</span>
																			<span className="text-white font-black">{s.targetGrade}</span>
																			<span className="text-[10px] text-emerald-400 font-bold ml-0.5">
																				(+{s.targetGrade - s.currentGrade})
																			</span>
																		</>
																	) : (
																		<>
																			<span className="text-[10px] text-slate-400 font-normal">יעד:</span>
																			<span className="text-white font-black">{s.targetGrade}</span>
																		</>
																	)}
																</span>
															</div>
														);
													})}
												</div>
											</div>
										);
									})()}
								</div>

								{/* Feasibility pill */}
								<div className="pt-2">
									<div className="flex items-center justify-between text-xs bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-xl">
										<span className="text-slate-400 font-bold">היתכנות סטטיסטית:</span>
										<span
											className={`font-black ${
												track.feasibility === 'very_high'
													? 'text-emerald-400'
													: track.feasibility === 'high'
													? 'text-cyan-400'
													: 'text-amber-400'
											}`}
										>
											{track.feasibility === 'very_high'
												? 'גבוהה מאוד (מעל 85%)'
												: track.feasibility === 'high'
												? 'גבוהה (75%–85%)'
												: 'בינונית / מאתגרת'}
										</span>
									</div>
									<p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
										{track.feasibilityExplanation}
									</p>
								</div>
							</div>

							{/* Bottom Selection & Save Buttons */}
							<div className="p-6 pt-0 space-y-2">
								<button
									type="button"
									onClick={() => setSelectedTrackId(track.id)}
									className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 ${
										isSelected
											? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
											: 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
									}`}
								>
									{isSelected ? (
										<>
											<CheckCircle2 className="h-4 w-4 text-slate-950" />
											<span>המסלול הנבחר שלך</span>
										</>
									) : (
										<span>בחר מסלול זה</span>
									)}
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										handleSaveTrack(track);
									}}
									disabled={savingTrackId === track.id}
									className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 border ${
										savedTrackMap[track.id]
											? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
											: 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
									}`}
								>
									{savingTrackId === track.id ? (
										<>
											<Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
											<span>שומר מסלול במסד הנתונים...</span>
										</>
									) : savedTrackMap[track.id] ? (
										<>
											<BookmarkCheck className="h-3.5 w-3.5 text-emerald-400" />
											<span>המסלול נשמר ({savedTrackMap[track.id].candidateNumber}) ✓</span>
										</>
									) : (
										<>
											<Bookmark className="h-3.5 w-3.5 text-cyan-400" />
											<span>שמור מסלול זה</span>
										</>
									)}
								</button>
							</div>
						</div>
					);
				})}
			</div>

			{/* ========================================================================= */}
			{/* DETAILED ROADMAP FOR SELECTED TRACK */}
			{/* ========================================================================= */}
			<div className="bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<Award className="h-5 w-5 text-cyan-400" />
							<h3 className="text-xl font-black text-white">
								תוכנית עבודה שבוע-אחר-שבוע: {selectedTrack.title}
							</h3>
						</div>
						<p className="text-xs text-slate-300">
							{selectedTrack.keyAdvantage}
						</p>
					</div>

					<div className="flex items-center gap-3 text-xs font-bold text-slate-400 shrink-0 flex-wrap">
						<div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
							משך כולל: <span className="text-white">{selectedTrack.estimatedWeeks} שבועות</span>
						</div>
						<div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
							עומס שבועי: <span className="text-white">{selectedTrack.weeklyHours} ש״ש</span>
						</div>
						<button
							type="button"
							onClick={() => handleSaveTrack(selectedTrack)}
							disabled={savingTrackId === selectedTrack.id}
							className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 border shadow-lg ${
								savedTrackMap[selectedTrack.id]
									? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
									: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/40 shadow-cyan-500/20'
							}`}
						>
							{savingTrackId === selectedTrack.id ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
									<span>שומר מסלול...</span>
								</>
							) : savedTrackMap[selectedTrack.id] ? (
								<>
									<BookmarkCheck className="h-3.5 w-3.5 text-white" />
									<span>המסלול שמור ({savedTrackMap[selectedTrack.id].candidateNumber}) ✓</span>
								</>
							) : (
								<>
									<Bookmark className="h-3.5 w-3.5 text-white" />
									<span>שמור מסלול זה</span>
								</>
							)}
						</button>
					</div>
				</div>

				{/* Roadmap components summary bar */}
				{(() => {
					const needsPsych = Boolean(
						selectedTrack.targetPsychometric && (
							(selectedTrack.currentPsychometric || 0) === 0
								? selectedTrack.targetPsychometric > 0
								: selectedTrack.targetPsychometric > (selectedTrack.currentPsychometric || 0)
						)
					);
					const hasSubs = Boolean(
						selectedTrack.recommendedSubjectImprovements && selectedTrack.recommendedSubjectImprovements.length > 0
					);
					if (!needsPsych && !hasSubs) return null;

					return (
						<div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
							<span className="font-bold text-slate-400">
								יעדי שיפור במסלול זה:
							</span>
							<div className="flex items-center gap-2 flex-wrap">
								{needsPsych && (() => {
									const sInfo = getSessionInfo('spring_psych');
									return (
										<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
											<Brain className="h-3.5 w-3.5 text-cyan-400" />
											<span>
												פסיכומטרי: {(selectedTrack.currentPsychometric || 0) > 0 ? `${selectedTrack.currentPsychometric} ➔ ` : 'יעד '}{selectedTrack.targetPsychometric}
											</span>
											<span className={`text-[10px] px-1.5 py-0.5 rounded border ${sInfo.badgeClass}`}>
												{sInfo.iconEmoji} {sInfo.name}
											</span>
										</span>
									);
								})()}
								{selectedTrack.recommendedSubjectImprovements.map((s, idx) => {
									const sSession = s.session || getSubjectExamSession(s.subjectName, s.targetUnits);
									const sInfo = getSessionInfo(sSession);
									return (
										<span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
											<BookOpen className="h-3.5 w-3.5 text-indigo-400" />
											<span>
												{s.subjectName} ({s.targetUnits} יח״ל): {s.currentGrade > 0 ? `${s.currentGrade} ➔ ` : ''}{s.targetGrade}
											</span>
											<span className={`text-[10px] px-1.5 py-0.5 rounded border ${sInfo.badgeClass}`}>
												{sInfo.iconEmoji} {sInfo.name}
											</span>
										</span>
									);
								})}
							</div>
						</div>
					);
				})()}

				{/* Steps Timeline */}
				<div className="space-y-4">
					<h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
						שלבי הביצוע המדורגים לפי מועדי ישראל:
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{selectedTrack.steps.map((step, idx) => {
							const stepSession =
								(step as any).session ||
								(step.type === 'psychometric'
									? 'spring_psych'
									: step.type === 'bagrut_elective'
									? 'summer'
									: step.type === 'mechina'
									? 'administrative'
									: 'winter');
							const sInfo = getSessionInfo(stepSession);
							return (
								<div
									key={idx}
									className={`bg-slate-950/70 border rounded-2xl p-4 space-y-2 relative overflow-hidden flex flex-col justify-between transition hover:border-slate-700 ${sInfo.cardBorderClass}`}
								>
									<div className="space-y-2">
										<div className="flex items-center justify-between gap-2 flex-wrap">
											<span className="text-[11px] font-black text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
												שלב {idx + 1} • {step.timing}
											</span>
											<span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sInfo.badgeClass} flex items-center gap-1`}>
												<span>{sInfo.iconEmoji}</span>
												<span>{sInfo.badgeLabel}</span>
											</span>
										</div>
										<h5 className="text-sm font-bold text-white flex items-center gap-1.5">
											{step.title}
										</h5>
										<p className="text-xs text-slate-300 leading-relaxed">{step.detail}</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Action Buttons */}
				<div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
					<div className="text-xs text-slate-400 flex items-center gap-2">
						<CheckCircle2 className="h-4 w-4 text-emerald-400" />
						<span>המסלול נשמר בפרופיל האישי שלך באפליקציה</span>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={handlePrint}
							className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
						>
							<Printer className="h-4 w-4" />
							<span>הדפס ציר זמנים מלא</span>
						</button>
					</div>
				</div>
			</div>

				{/* ========================================================================= */}
				{/* OPT-IN MECHINA TRACK (מכינה קדם-אקדמית ייעודית כחלופה מובנית) */}
				{/* ========================================================================= */}
				{isMechinaApplicable && (
					<div className="bg-slate-900/90 border border-purple-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
						{/* Ambient purple glow */}
						<div className="absolute top-0 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl -z-0 pointer-events-none" />

						<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div className="space-y-1.5 max-w-2xl">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40 tracking-wider">
										מסלול חלופי מובנה • מכינה קדם-אקדמית (Opt-In)
									</span>
									{mechinaReason && (
										<span className="text-[10px] text-slate-400">
											• {mechinaReason}
										</span>
									)}
								</div>
								<h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
									<UniversityLogo institution={analysis.target.institutionId} size="sm" shape="rounded" />
									<span>שוקל מכינה אקדמית ב{analysis.target.institutionName.replace('אוניברסיטת ', '')}?</span>
								</h4>
								<p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
									עבור פערים גדולים או למי שמעדיף מסגרת לימודית אינטנסיבית ומסודרת, מכינה קדם-אקדמית של המוסד מחליפה את ממוצע הבגרות ומספקת נתיב קבלה ישיר עם מעטפת תרגול ומלגות.
								</p>
							</div>

							<button
								type="button"
								onClick={handleToggleMechina}
								disabled={isLoadingMechina}
								className={`px-5 py-3 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shrink-0 border shadow-lg ${
									showMechinaDetails
										? 'bg-purple-950/80 text-purple-200 border-purple-500/50 hover:bg-purple-900/50'
										: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/40 shadow-purple-600/25'
								}`}
							>
								{isLoadingMechina ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										<span>טוען מסלול מכינה...</span>
									</>
								) : showMechinaDetails ? (
									<>
										<span>הסתר פרטי מכינה</span>
										<ChevronUp className="h-4 w-4" />
									</>
								) : (
									<>
										<GraduationCap className="h-4 w-4" />
										<span>בדוק אפשרות מכינה ייעודית למוסד</span>
										<ChevronDown className="h-4 w-4" />
									</>
								)}
							</button>
						</div>

						{/* Expanded Mechina Details */}
						{showMechinaDetails && mechinaTrack && (
							<div className="relative z-10 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
								<div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-5 space-y-4">
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
										<div className="flex items-center gap-3">
											<UniversityLogo institution={analysis.target.institutionId} size="md" shape="rounded" />
											<div>
												<h5 className="text-base font-black text-purple-200">
													{mechinaTrack.title}
												</h5>
												<p className="text-xs text-slate-400 mt-0.5">
													{mechinaTrack.keyAdvantage}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3 text-xs font-bold text-slate-300 shrink-0">
											<div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
												משך: <span className="text-purple-300">{mechinaTrack.estimatedWeeks} שבועות</span>
											</div>
											<div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
												עומס: <span className="text-purple-300">{mechinaTrack.weeklyHours} ש״ש</span>
											</div>
										</div>
									</div>

									<p className="text-xs text-slate-300 leading-relaxed">
										{mechinaTrack.strategyDescription}
									</p>

									{/* Milestones in Mechina */}
									{mechinaTrack.milestones && mechinaTrack.milestones.length > 0 && (
										<div className="space-y-2 pt-2">
											<h6 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
												תחנות מסלול המכינה:
											</h6>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
												{mechinaTrack.milestones.map((m: any, mIdx: number) => {
													const sInfo = getSessionInfo(
														m.type === 'psychometric'
															? 'winter'
															: m.type === 'administrative'
															? 'administrative'
															: 'summer'
													);
													return (
														<div
															key={mIdx}
															className="bg-slate-900/70 border border-purple-500/20 rounded-xl p-3 space-y-1.5"
														>
															<div className="flex items-center justify-between gap-2">
																<span className="text-[10px] font-black text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded">
																	תחנה {m.orderIndex || mIdx + 1} • {m.timing}
																</span>
																<span className="text-[10px] text-slate-400 font-bold">
																	{sInfo.iconEmoji}
																</span>
															</div>
															<div className="text-xs font-bold text-white">
																{m.title}
															</div>
															<p className="text-[11px] text-slate-400 leading-normal">
																{m.detail}
															</p>
														</div>
													);
												})}
											</div>
										</div>
									)}

									{/* Mechina perks banner */}
									<div className="p-3 bg-purple-950/40 border border-purple-500/25 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs text-purple-200">
										<div className="flex items-center gap-2">
											<ShieldCheck className="h-4 w-4 text-purple-400 shrink-0" />
											<span>
												תעודת גמר מכינה מוכרת ומחליפה את תעודת הבגרות במוסד זה. עמידה בממוצע היעד מקנה קבלה ישירה.
											</span>
										</div>
										<span className="text-[11px] font-bold text-emerald-400">
											היתכנות: {mechinaTrack.feasibilityExplanation}
										</span>
									</div>

									{/* Save Mechina Track Button */}
									<div className="pt-2 flex justify-end">
										<button
											type="button"
											onClick={() => handleSaveTrack(mechinaTrack)}
											disabled={savingTrackId === mechinaTrack.id}
											className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 border ${
												savedTrackMap[mechinaTrack.id]
													? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
													: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400'
											}`}
										>
											{savingTrackId === mechinaTrack.id ? (
												<>
													<Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
													<span>שומר...</span>
												</>
											) : savedTrackMap[mechinaTrack.id] ? (
												<>
													<BookmarkCheck className="h-3.5 w-3.5 text-white" />
													<span>מסלול מכינה שמור ({savedTrackMap[mechinaTrack.id].candidateNumber}) ✓</span>
												</>
											) : (
												<>
													<Bookmark className="h-3.5 w-3.5 text-white" />
													<span>שמור מסלול מכינה זה</span>
												</>
											)}
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Transition CTA to Personal Builder */}
				{userProfile && institutionResult && (
					<div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
						<div className="flex items-center gap-3.5">
							<div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
								<Sliders className="h-5 w-5" />
							</div>
							<div>
								<h5 className="text-sm sm:text-base font-bold text-white">
									מעדיף להרכיב שילוב ציונים ומקצועות משלך?
								</h5>
								<p className="text-xs text-slate-400">
									פתח את חלונית הבנייה האישית, שחק עם סליידרים ובדוק את ההשפעה השולית של כל מקצוע על סיכויי הקבלה.
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => setActiveTab('custom_builder')}
							className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs rounded-xl transition flex items-center gap-2 shrink-0 shadow-lg shadow-indigo-600/20"
						>
							<span>עבור לחלונית בניית מסלול אישי</span>
							<ChevronLeft className="h-4 w-4" />
						</button>
					</div>
				)}
			</div>
			)}

			{/* ========================================================================= */}
			{/* TAB 2: PERSONAL CUSTOM TRACK BUILDER (חלונית בניית מסלול אישי נפרדת) */}
			{/* ========================================================================= */}
			{activeTab === 'custom_builder' && (
				<div className="space-y-6">
					{userProfile && institutionResult ? (
						<div className="bg-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
							{/* Ambient Glow */}
							<div className="absolute top-0 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

							{/* Section Header */}
							<div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
								<div className="space-y-1.5">
									<div className="flex items-center gap-2.5">
										<div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
											<Sliders className="h-5 w-5" />
										</div>
										<h3 className="text-xl sm:text-2xl font-black text-white">
											חלונית בניית מסלול אישי 🎛️
										</h3>
									</div>
									<p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
										רוצה להרכיב מסלול משלך? בחר תואר, שחק עם סליידר הפסיכומטרי, הוסף או שפר מקצועות בגרות וצפה במידת ההשפעה המדויקת של כל שינוי על הסכם ועל סיכויי הקבלה.
									</p>
								</div>

								<div className="flex items-center gap-3 flex-wrap">
									{/* Return to Recommended Tracks Button */}
									<button
										type="button"
										onClick={() => setActiveTab('recommended')}
										className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700 shadow-sm"
									>
										<Sparkles className="h-3.5 w-3.5 text-cyan-400" />
										<span>חזור ל-3 המסלולים המומלצים</span>
									</button>

									{/* Degree Selector in Custom Builder */}
									{allAnalyses && allAnalyses.length > 1 && (
										<div className="flex items-center gap-2 shrink-0 bg-slate-950 p-2 rounded-2xl border border-slate-800">
											<span className="text-xs font-bold text-slate-400 mr-1">תואר לבדיקה:</span>
											<select
												value={analysis.target.program.id}
												onChange={(e) => onSelectProgram?.(e.target.value)}
												className="bg-slate-900 border border-slate-700 text-xs font-bold text-cyan-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
											>
												{allAnalyses.map((a) => {
													const icon = a.status === 'accepted' ? '✅' : a.status === 'borderline' ? '⚠️' : '❌';
													return (
														<option key={a.target.program.id} value={a.target.program.id}>
															{icon} {a.target.program.fieldOfStudy} ({a.target.institutionName})
														</option>
													);
												})}
											</select>
										</div>
									)}
								</div>
							</div>

							{/* Notification when custom scenario is applied */}
							{customScenarioApplied && (
								<div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 flex-wrap">
									<div className="flex items-center gap-2">
										<CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
										<span>התרחיש האישי שלך הוחל בהצלחה על תוכנית העבודה שלך!</span>
									</div>
									<button
										type="button"
										onClick={() => setActiveTab('recommended')}
										className="text-xs text-white underline hover:text-emerald-200 font-bold"
									>
										צפה במסלולים המומלצים ➔
									</button>
								</div>
							)}

							{/* Interactive What-If Simulator */}
							<WhatIfSimulator
								analysis={analysis}
								userProfile={userProfile}
								institutionResult={institutionResult}
								onApplyScenario={handleApplyScenario}
							/>
						</div>
					) : (
						<div className="text-center py-16 px-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-4">
							<Sliders className="h-12 w-12 text-slate-500 mx-auto" />
							<h3 className="text-lg font-bold text-white">חסרים נתוני פרופיל לסימולציה</h3>
							<p className="text-sm text-slate-400">
								נא להזין ציוני בגרות ופסיכומטרי בשלב 1 כדי שתוכל לבצע סימולציות מותאמות אישית.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
