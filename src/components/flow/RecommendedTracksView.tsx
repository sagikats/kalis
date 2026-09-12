'use client';

import React, { useState, useEffect } from 'react';
import {
	Zap,
	ShieldCheck,
	GraduationCap,
	Clock,
	CheckCircle2,
	ArrowRight,
	ArrowLeft,
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
	Loader2,
	Info
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
	const [expandedExplanationMap, setExpandedExplanationMap] = useState<Record<string, boolean>>({});

	const toggleExplanation = (trackId: string) => {
		setExpandedExplanationMap((prev) => ({
			...prev,
			[trackId]: !prev[trackId]
		}));
	};

	// Scroll to top when switching between Recommended tracks and Custom builder tabs
	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}
	}, [activeTab]);

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
				setSaveNotification('המסלול נשמר בהצלחה במסד הנתונים!');
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
			<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden space-y-6">
				{/* Top Meta & Action Toolbar Row */}
				<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAE5DA] pb-4">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="px-3 py-1 bg-[#FAF8F5] text-[#1E597B] border border-[#E5DFD4] text-xs font-black rounded-lg flex items-center gap-1.5">
							<Sparkles className="h-3.5 w-3.5 text-[#1E597B]" />
							<span>שלב 4: תכנון מסלולי פעולה ובניית מסלול אישי</span>
						</span>
						<span className="px-3 py-1 bg-[#FAF8F5] border border-[#E5DFD4] text-xs font-bold text-[#222222] rounded-lg flex items-center gap-2">
							<UniversityLogo institution={analysis.target.institutionId} size="xs" shape="circle" />
							<span>{analysis.target.institutionName} • {analysis.target.program.fieldOfStudy}</span>
						</span>
					</div>

					<div className="flex items-center gap-2.5 flex-wrap">
						{allAnalyses && allAnalyses.length > 1 && (
							<div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E5DFD4] px-3 py-1.5 rounded-xl">
								<span className="text-xs font-bold text-[#66635C]">החלף תואר:</span>
								<select
									value={analysis.target.program.id}
									onChange={(e) => onSelectProgram?.(e.target.value)}
									className="bg-transparent text-xs font-bold text-[#222222] focus:outline-none cursor-pointer"
								>
									{allAnalyses.map((a) => {
										const icon = a.status === 'accepted' ? '✅' : a.status === 'borderline' ? '⚠️' : '❌';
										return (
											<option key={a.target.program.id} value={a.target.program.id} className="bg-white text-[#222222]">
												{icon} {a.target.program.fieldOfStudy} ({a.target.institutionName})
											</option>
										);
									})}
								</select>
							</div>
						)}

						<button
							onClick={onEditPreferences}
							className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#44423D] hover:text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-[#E5DFD4] cursor-pointer"
						>
							<Sparkles className="h-3.5 w-3.5 text-[#1E597B]" />
							<span>ערוך שאלון העדפות</span>
						</button>
						<button
							onClick={handlePrint}
							className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#44423D] hover:text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-[#E5DFD4] cursor-pointer"
							title="הדפס או שמור כ-PDF"
						>
							<Printer className="h-3.5 w-3.5 text-[#8A847C]" />
							<span>הדפס</span>
						</button>
						<button
							onClick={onBackToReport}
							className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#44423D] hover:text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-[#E5DFD4] cursor-pointer"
						>
							<ArrowRight className="h-3.5 w-3.5" />
							<span>חזור לדוח הקבלה</span>
						</button>
					</div>
				</div>

				{/* Main Hero Content & Gap Summary Widget */}
				<div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
					<div className="flex-1 min-w-0 space-y-2">
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#222222] tracking-tight leading-snug">
							תוכנית פעולה לקבלה לתואר המבוקש
						</h2>
						<p className="text-xs sm:text-sm text-[#66635C] max-w-3xl leading-relaxed">
							בחר באחד מ-{tracks.length} המסלולים הריאליים המותאמים שהופקו עבורך, או השתמש בחלונית בניית המסלול האישי שלמטה כדי להרכיב שילוב ציונים ומקצועות משלך.
						</p>
					</div>

					{/* Target & Gap Metrics Box */}
					<div className="flex items-center gap-4 bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-4 shrink-0 shadow-xs">
						<div className="text-center px-2 min-w-[75px]">
							<span className="text-[11px] font-bold text-[#66635C] block">סכם קיים</span>
							<span className="text-xl font-black text-[#222222] dir-ltr">{analysis.userSekem}</span>
							<span className="text-[10px] text-[#8A847C] block truncate max-w-[110px]">{analysis.relevantSekemLabel}</span>
						</div>
						<div className="h-10 w-px bg-[#E5DFD4]" />
						<div className="text-center px-2 min-w-[75px]">
							<span className="text-[11px] font-bold text-[#66635C] block">סף יעד</span>
							<span className="text-xl font-black text-[#825B15] dir-ltr">{analysis.threshold || '—'}</span>
							<span className="text-[10px] text-[#8A847C] block truncate max-w-[110px]">סף קבלה רשמי</span>
						</div>
						{analysis.threshold && (
							<>
								<div className="h-10 w-px bg-[#E5DFD4]" />
								<div className="text-center px-3 py-1 bg-[#FDF6E8] rounded-xl border border-[#ECDAB6]">
									<span className="text-[10px] font-black text-[#825B15] block uppercase tracking-wider">פער לסגירה</span>
									<span className="text-lg font-black text-[#825B15] dir-ltr">
										{analysis.gap > 0 ? `+${analysis.gap}` : analysis.gap}
									</span>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Prerequisites Warning if applicable */}
				{analysis.missingPrerequisites && analysis.missingPrerequisites.length > 0 && (
					<div className="p-3 rounded-2xl bg-[#FDF6E8] border border-[#ECDAB6] text-xs text-[#825B15] flex items-center gap-2">
						<AlertTriangle className="h-4 w-4 shrink-0 text-[#825B15]" />
						<span>
							<strong>תנאי סף נדרשים לתואר זה:</strong> {analysis.missingPrerequisites.map((p) => p.name).join(' | ')}. מומלץ לשלב את השלמתם במסלול העבודה שלך.
						</span>
					</div>
				)}

				{/* Realism Badge Guarantee */}
				<div className="pt-4 border-t border-[#EAE5DA] flex items-center gap-3 text-xs text-[#66635C] bg-[#FAF8F5] rounded-2xl p-3 border border-[#E5DFD4]">
					<ShieldCheck className="h-5 w-5 text-[#205739] shrink-0" />
					<div>
						<strong className="text-[#222222] font-black">אלגוריתם מבוסס מודל ריאליות קפדני:</strong>{' '}
						היעדים מוגבלים לחסמי שיפור סטטיסטיים מוכחים (לפי נתוני מרכז הבחינות NITE). ללא דרישות לציון פסיכומטרי 740+ מנקודת פתיחה לא ריאלית, ותוך שילוב שיפור בגרויות נקודתי היכן שנדרש.
					</div>
				</div>
			</div>

			{/* ========================================================================= */}
			{/* VIEW SWITCHER TABS: RECOMMENDED TRACKS vs PERSONAL BUILDER */}
			{/* ========================================================================= */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#FAF8F5] p-2 rounded-2xl border border-[#E5DFD4] shadow-xs">
				<div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-[#E5DFD4]">
					<button
						type="button"
						onClick={() => setActiveTab('recommended')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer ${
							activeTab === 'recommended'
								? 'bg-[#3C3C3C] text-white shadow-xs'
								: 'text-[#66635C] hover:text-[#222222] hover:bg-[#FAF8F5]'
						}`}
					>
						<Sparkles className="h-4 w-4 text-inherit" />
						<span>ריכוז המסלולים המומלץ ({tracks.length})</span>
					</button>

					<button
						type="button"
						onClick={() => setActiveTab('custom_builder')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer ${
							activeTab === 'custom_builder'
								? 'bg-[#3C3C3C] text-white shadow-xs'
								: 'text-[#66635C] hover:text-[#222222] hover:bg-[#FAF8F5]'
						}`}
					>
						<Sliders className="h-4 w-4 text-inherit" />
						<span>מסלול בנייה אישי 🎛️ (What-If Lab)</span>
						{customScenarioApplied && (
							<span className="w-2 h-2 rounded-full bg-[#205739]" />
						)}
					</button>
				</div>

				<div className="text-xs text-[#66635C] px-3 flex items-center gap-2">
					{activeTab === 'recommended' ? (
						<span>💡 3 מסלולים מותאמים אישית לבחירתך</span>
					) : (
						<span>🔬 מעבדת סימולציה עצמאית בזמן אמת</span>
					)}
				</div>
			</div>

			{/* Save Track Notification Banner */}
			{saveNotification && (
				<div className="p-4 rounded-2xl bg-[#EBF4EE] border border-[#C6DFCE] text-[#205739] text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
					<div className="flex items-center gap-2.5">
						<CheckCircle2 className="h-5 w-5 text-[#205739] shrink-0" />
						<span>{saveNotification}</span>
					</div>
					<button
						onClick={() => setSaveNotification(null)}
						className="text-[#66635C] hover:text-[#222222] p-1 cursor-pointer"
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
									? 'bg-white border-2 border-[#222222] shadow-xs'
									: 'bg-white border border-[#E5DFD4] hover:border-[#D5CFC2] hover:bg-[#FAF8F5] shadow-2xs'
							}`}
						>
							{/* Track Top Banner */}
							<div className="p-6 pb-4 space-y-4">
								<div className="flex items-center justify-between gap-2">
									<span
										className={`px-3 py-1 text-[11px] font-black rounded-lg ${
											isFast
												? 'bg-[#FDF6E8] text-[#825B15] border border-[#ECDAB6]'
												: isBalanced
												? 'bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE]'
												: 'bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB]'
										}`}
									>
										{track.badge}
									</span>
									<div className="flex items-center gap-1.5 text-xs font-bold text-[#66635C]">
										<Clock className="h-3.5 w-3.5" />
										<span>{track.estimatedWeeks} שבועות</span>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<div
										className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
											isFast
												? 'bg-[#FDF6E8] border border-[#ECDAB6] text-[#825B15]'
												: isBalanced
												? 'bg-[#EBF4EE] border border-[#C6DFCE] text-[#205739]'
												: 'bg-[#EFF6FA] border border-[#C5DFED] text-[#1E597B]'
										}`}
									>
										<TrackIcon className="h-5 w-5" />
									</div>
									<div>
										<h3 className="text-lg font-black text-[#222222] leading-snug">{track.title}</h3>
										<span className="text-[11px] text-[#66635C] font-bold block mt-0.5">
											{track.weeklyHours} שעות למידה שבועיות
										</span>
									</div>
								</div>

								{/* Metric Target Boxes */}
								<div className="space-y-2 pt-2 border-t border-[#EAE5DA]">
									{/* Target Sekem if exists */}
									{track.targetSekem !== undefined && (
										<div
											className={`border rounded-2xl p-3 flex items-center justify-between shadow-2xs ${
												analysis.threshold && track.targetSekem < analysis.threshold
													? 'bg-[#FDF6E8] border-[#ECDAB6]'
													: 'bg-[#EBF4EE] border-[#C6DFCE]'
											}`}
										>
											<div className="flex items-center gap-2">
												<Sparkles
													className={`h-4 w-4 ${
														analysis.threshold && track.targetSekem < analysis.threshold
															? 'text-[#825B15]'
															: 'text-[#205739]'
													}`}
												/>
												<span
													className={`text-xs font-bold ${
														analysis.threshold && track.targetSekem < analysis.threshold
															? 'text-[#825B15]'
															: 'text-[#205739]'
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
															? 'text-[#825B15]'
															: 'text-[#205739]'
													}`}
												>
													{track.targetSekem.toFixed(isTechnion ? 2 : 1)}
												</span>
												{analysis.threshold && (
													<span
														className={`text-[10px] ml-1.5 font-medium ${
															analysis.threshold && track.targetSekem < analysis.threshold
																? 'text-[#825B15]/80'
																: 'text-[#205739]/80'
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
										<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-3 flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Brain className="h-4 w-4 text-[#222222]" />
												<span className="text-xs font-bold text-[#66635C]">יעד פסיכומטרי:</span>
											</div>
											<div dir="ltr" className="text-left dir-ltr flex items-center gap-1">
												{track.targetPsychometric > (track.currentPsychometric || 0) ? (
													<>
														{(track.currentPsychometric || 0) > 0 && (
															<>
																<span className="text-xs text-[#8A847C] line-through">
																	{track.currentPsychometric}
																</span>
																<span className="text-[#8A847C] text-xs">➔</span>
															</>
														)}
														<span className="text-sm font-black text-[#222222]">
															{track.targetPsychometric}
														</span>
														{(track.currentPsychometric || 0) > 0 && (
															<span className="text-[10px] text-[#205739] font-bold">
																(+{track.targetPsychometric - (track.currentPsychometric || 0)})
															</span>
														)}
													</>
												) : (
													<span className="text-xs text-[#66635C] font-bold">
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
												<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-3 flex items-center justify-between">
													<div className="flex items-center gap-2">
														<BookOpen className="h-4 w-4 text-[#222222]" />
														<span className="text-xs font-bold text-[#66635C]">ממוצע בגרות:</span>
													</div>
													<div dir="ltr" className="text-left dir-ltr flex items-center gap-1">
														<span className="text-xs text-[#8A847C] line-through">
															{track.currentBagrutAverage?.toFixed(1)}
														</span>
														<span className="text-[#8A847C] text-xs">➔</span>
														<span className="text-sm font-black text-[#222222]">
															{track.targetBagrutAverage?.toFixed(1)}
														</span>
														<span className="text-[10px] text-[#205739] font-bold">
															(+{((track.targetBagrutAverage || 0) - (track.currentBagrutAverage || 0)).toFixed(1)})
														</span>
													</div>
												</div>
											);
										}

										if (hasSubjectImprovements) {
											return (
												<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-3 flex items-center justify-between">
													<div className="flex items-center gap-2">
														<BookOpen className="h-4 w-4 text-[#222222]" />
														<span className="text-xs font-bold text-[#66635C]">ממוצע בגרות:</span>
													</div>
													<div className="text-left dir-ltr">
														<span className="text-sm font-black text-[#222222]">
															{(track.targetBagrutAverage || track.currentBagrutAverage)?.toFixed(1)}
														</span>
														<span className="text-[10px] text-[#66635C] ml-1 font-bold">
															(משתפר עם המקצועות)
														</span>
													</div>
												</div>
											);
										}

										return (
											<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-3 flex items-center justify-between">
												<div className="flex items-center gap-2">
													<BookOpen className="h-4 w-4 text-[#8A847C]" />
													<span className="text-xs font-bold text-[#66635C]">ממוצע בגרות:</span>
												</div>
												<div className="text-left dir-ltr">
													<span className="text-xs font-bold text-[#66635C]">
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
											<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-3 space-y-2">
												<div className="flex items-center justify-between">
													<span className="text-[11px] font-bold text-[#66635C] block">
														{needsPsychImprovement && hasSubjectImprovements
															? 'מקצועות ומרכיבים מומלצים לשיפור:'
															: needsPsychImprovement
															? 'מרכיב מומלץ לשיפור:'
															: 'מקצועות מומלצים לשיפור:'}
													</span>
													<span className="text-[10px] text-[#1E597B] font-bold">
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
															<div className="text-xs flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-[#E5DFD4] flex-wrap">
																<div className="flex items-center gap-1.5 truncate">
																	<Brain className="h-3.5 w-3.5 text-[#222222] shrink-0" />
																	<span className="text-[#222222] font-bold truncate">
																		בחינה פסיכומטרית:
																	</span>
																	<span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sInfo.badgeClass} shrink-0 shadow-2xs`}>
																		{sInfo.iconEmoji} {sInfo.badgeLabel}
																	</span>
																</div>
																<span dir="ltr" className="text-[#222222] font-bold shrink-0 dir-ltr flex items-center gap-1">
																	{(track.currentPsychometric || 0) > 0 ? (
																		<>
																			<span className="text-[#8A847C] font-normal">{track.currentPsychometric}</span>
																			<span className="text-[#8A847C] font-normal">➔</span>
																			<span className="text-[#222222] font-black">{track.targetPsychometric}</span>
																			<span className="text-[10px] text-[#205739] font-bold ml-0.5">
																				(+{track.targetPsychometric! - (track.currentPsychometric || 0)})
																			</span>
																		</>
																	) : (
																		<>
																			<span className="text-[10px] text-[#8A847C] font-normal">יעד:</span>
																			<span className="text-[#222222] font-black">{track.targetPsychometric}</span>
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
														const isNewSubject = !s.currentUnits || s.currentUnits === 0;
														const hasUnitChange = Boolean(s.currentUnits && s.currentUnits > 0 && s.currentUnits !== s.targetUnits);
														return (
															<div key={idx} className="text-xs flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white border border-[#E5DFD4] flex-wrap">
																<div className="flex items-center gap-1.5 truncate">
																	<span className="text-[#222222] font-medium truncate">
																		{s.subjectName}{' '}
																		{isNewSubject ? (
																			<span className="text-[#66635C] font-semibold">
																				(מקצוע חדש, {s.targetUnits} יח״ל):
																			</span>
																		) : hasUnitChange ? (
																			<span className="text-[#66635C] font-semibold inline-flex items-center gap-0.5">
																				(
																				<span dir="ltr" className="inline-flex items-center gap-1 font-mono">
																					<span>{s.currentUnits}</span>
																					<span className="text-[#8A847C]">➔</span>
																					<span>{s.targetUnits}</span>
																				</span>
																				<span>יח״ל</span>
																				):
																			</span>
																		) : (
																			`(${s.targetUnits} יח״ל):`
																		)}
																	</span>
																	<span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sInfo.badgeClass} shrink-0 shadow-2xs`}>
																		{sInfo.iconEmoji} {sInfo.badgeLabel}
																	</span>
																</div>
																<span dir="ltr" className="text-[#222222] font-bold shrink-0 dir-ltr flex items-center gap-1">
																	{s.currentGrade > 0 ? (
																		<>
																			<span className="text-[#8A847C] font-normal">{s.currentGrade}</span>
																			<span className="text-[#8A847C] font-normal">➔</span>
																			<span className="text-[#222222] font-black">{s.targetGrade}</span>
																			<span className="text-[10px] text-[#205739] font-bold ml-0.5">
																				(+{s.targetGrade - s.currentGrade})
																			</span>
																		</>
																	) : (
																		<>
																			<span className="text-[10px] text-[#8A847C] font-normal">יעד:</span>
																			<span className="text-[#222222] font-black">{s.targetGrade}</span>
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
									<div className="flex items-center justify-between text-xs bg-[#FAF8F5] border border-[#E5DFD4] px-3 py-2 rounded-xl">
										<span className="text-[#66635C] font-bold">היתכנות סטטיסטית:</span>
										<span
											className={`font-black ${
												track.feasibility === 'very_high'
													? 'text-[#205739]'
													: track.feasibility === 'high'
													? 'text-[#1E597B]'
													: 'text-[#825B15]'
											}`}
										>
											{track.feasibility === 'very_high'
												? 'גבוהה מאוד (מעל 85%)'
												: track.feasibility === 'high'
												? 'גבוהה (75%–85%)'
												: 'בינונית / מאתגרת'}
										</span>
									</div>
									<p className="text-[11px] text-[#66635C] mt-1.5 leading-normal">
										{track.feasibilityExplanation}
									</p>
								</div>

								{/* Expandable Program Explanation */}
								{track.strategyDescription && (
									<div className="pt-2 border-t border-[#EAE5DA]">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												toggleExplanation(track.id);
											}}
											className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold text-[#66635C] hover:text-[#222222] bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#E5DFD4] transition cursor-pointer"
										>
											<span className="flex items-center gap-1.5">
												<Info className="h-3.5 w-3.5 text-[#8A847C]" />
												<span>הסבר על התוכנית</span>
											</span>
											<ChevronDown
												className={`h-4 w-4 text-[#8A847C] transition-transform duration-200 ${
													expandedExplanationMap[track.id] ? 'rotate-180 text-[#222222]' : ''
												}`}
											/>
										</button>

										{expandedExplanationMap[track.id] && (
											<div className="mt-2 p-3 bg-white border border-[#E5DFD4] rounded-2xl shadow-2xs animate-fadeIn">
												<p className="text-xs text-[#66635C] leading-relaxed">
													{track.strategyDescription}
												</p>
											</div>
										)}
									</div>
								)}
							</div>

							{/* Bottom Selection & Save Buttons */}
							<div className="p-6 pt-0 space-y-2">
								<button
									type="button"
									onClick={() => setSelectedTrackId(track.id)}
									className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
										isSelected
											? 'bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE] font-black'
											: 'bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white shadow-xs'
									}`}
								>
									{isSelected ? (
										<>
											<CheckCircle2 className="h-4 w-4 text-[#205739]" />
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
									className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 border cursor-pointer ${
										savedTrackMap[track.id]
											? 'bg-[#EBF4EE] border-[#C6DFCE] text-[#205739]'
											: 'bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#222222] border-[#E5DFD4]'
									}`}
								>
									{savingTrackId === track.id ? (
										<>
											<Loader2 className="h-3.5 w-3.5 animate-spin text-[#222222]" />
											<span>שומר מסלול במסד הנתונים...</span>
										</>
									) : savedTrackMap[track.id] ? (
										<>
											<BookmarkCheck className="h-3.5 w-3.5 text-[#205739]" />
											<span>המסלול נשמר ✓</span>
										</>
									) : (
										<>
											<Bookmark className="h-3.5 w-3.5 text-[#66635C]" />
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
			<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DFD4] pb-5">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<Award className="h-5 w-5 text-[#222222]" />
							<h3 className="text-xl font-bold text-[#222222]">
								תוכנית עבודה שבוע-אחר-שבוע: {selectedTrack.title}
							</h3>
						</div>
						<p className="text-xs text-[#66635C]">
							{selectedTrack.keyAdvantage}
						</p>
					</div>

					<div className="flex items-center gap-3 text-xs font-bold text-[#66635C] shrink-0 flex-wrap">
						<div className="bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#E5DFD4]">
							משך כולל: <span className="text-[#222222] font-bold">{selectedTrack.estimatedWeeks} שבועות</span>
						</div>
						<div className="bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#E5DFD4]">
							עומס שבועי: <span className="text-[#222222] font-bold">{selectedTrack.weeklyHours} ש״ש</span>
						</div>
						<button
							type="button"
							onClick={() => handleSaveTrack(selectedTrack)}
							disabled={savingTrackId === selectedTrack.id}
							className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 border shadow-sm ${
								savedTrackMap[selectedTrack.id]
									? 'bg-[#EBF4EE] text-[#205739] border-[#C6DFCE]'
									: 'bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white border-[#3C3C3C]'
							}`}
						>
							{savingTrackId === selectedTrack.id ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
									<span>שומר מסלול...</span>
								</>
							) : savedTrackMap[selectedTrack.id] ? (
								<>
									<BookmarkCheck className="h-3.5 w-3.5 text-[#205739]" />
									<span>המסלול שמור ✓</span>
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
						<div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-between flex-wrap gap-2 text-xs">
							<span className="font-bold text-[#66635C]">
								יעדי שיפור במסלול זה:
							</span>
							<div className="flex items-center gap-2 flex-wrap">
								{needsPsych && (() => {
									const sInfo = getSessionInfo('spring_psych');
									return (
										<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EBF4EE] border border-[#C6DFCE] text-[#205739] font-bold">
											<Brain className="h-3.5 w-3.5 text-[#205739]" />
											<span>פסיכומטרי:</span>
											<span dir="ltr" className="inline-flex items-center gap-1 font-mono">
												{(selectedTrack.currentPsychometric || 0) > 0 ? (
													<>
														<span className="text-[#8A847C] font-normal">{selectedTrack.currentPsychometric}</span>
														<span className="text-[#8A847C]">➔</span>
														<span className="font-bold">{selectedTrack.targetPsychometric}</span>
													</>
												) : (
													<span>יעד {selectedTrack.targetPsychometric}</span>
												)}
											</span>
											<span className="text-[10px] px-1.5 py-0.5 rounded border border-[#C6DFCE] bg-white text-[#205739]">
												{sInfo.iconEmoji} {sInfo.name}
											</span>
										</span>
									);
								})()}
								{selectedTrack.recommendedSubjectImprovements.map((s, idx) => {
									const sSession = s.session || getSubjectExamSession(s.subjectName, s.targetUnits);
									const sInfo = getSessionInfo(sSession);
									const hasUnitChange = Boolean(s.currentUnits && s.currentUnits > 0 && s.currentUnits !== s.targetUnits);
									return (
										<span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F2F1F8] border border-[#D2CEEB] text-[#453D78] font-bold">
											<BookOpen className="h-3.5 w-3.5 text-[#453D78]" />
											<span>
												{s.subjectName}{' '}
												{hasUnitChange ? (
													<span className="inline-flex items-center gap-0.5">
														(
														<span dir="ltr" className="inline-flex items-center gap-1 font-mono">
															<span>{s.currentUnits}</span>
															<span>➔</span>
															<span>{s.targetUnits}</span>
														</span>
														<span>יח״ל</span>
														)
													</span>
												) : (
													`(${s.targetUnits} יח״ל)`
												)}
												:
											</span>
											<span dir="ltr" className="inline-flex items-center gap-1 font-mono">
												{s.currentGrade > 0 ? (
													<>
														<span className="text-[#8A847C] font-normal">{s.currentGrade}</span>
														<span className="text-[#8A847C]">➔</span>
														<span className="font-bold">{s.targetGrade}</span>
													</>
												) : (
													<span>{s.targetGrade}</span>
												)}
											</span>
											<span className="text-[10px] px-1.5 py-0.5 rounded border border-[#D2CEEB] bg-white text-[#453D78]">
												{sInfo.iconEmoji} {sInfo.name}
											</span>
										</span>
									);
								})}
							</div>
						</div>
					);
				})()}

				{/* Steps & Concurrent Timeline Phasing */}
				<div className="space-y-5">
					<div className="flex items-center justify-between flex-wrap gap-2">
						<h4 className="text-xs font-bold text-[#8A847C] uppercase tracking-wider flex items-center gap-2">
							<Calendar className="h-4 w-4 text-[#1E597B]" />
							<span>תוכנית עבודה שבועית ומועדי בחינות:</span>
						</h4>
						{selectedTrack.hasConcurrentStudy ? (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EFF6FA] border border-[#C5DFED] text-[#1E597B] shadow-2xs">
								<span>🔀</span>
								<span>למידה משולבת במקביל (חיסכון בזמן)</span>
							</span>
						) : (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF8F5] border border-[#E5DFD4] text-[#66635C]">
								<span>🎯</span>
								<span>למידה ממוקדת טורית</span>
							</span>
						)}
					</div>

					{/* Visual Multi-Stream Gantt Chart (when schedulePhases is present) */}
					{selectedTrack.schedulePhases && selectedTrack.schedulePhases.length > 0 ? (
						<div className="space-y-4">
							{/* Horizontal Gantt Matrix */}
							<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-4 sm:p-5 space-y-4">
								<div className="flex items-center justify-between text-xs font-bold text-[#66635C] border-b border-[#EAE5DA] pb-2.5">
									<span>מבט-על: פריסת ערוצי הלמידה על פני {selectedTrack.estimatedWeeks} שבועות</span>
									<span className="text-[11px] text-[#8A847C]">
										תקציב: {selectedTrack.weeklyHours} שעות שבועיות
									</span>
								</div>

								{/* Timeline Columns Header */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
									{selectedTrack.schedulePhases.map((phase) => (
										<div
											key={phase.phaseIndex}
											className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition ${
												phase.isConcurrent
													? 'bg-white border-[#B8D7E8] shadow-xs'
													: 'bg-white border-[#E5DFD4]'
											}`}
										>
											<div className="space-y-2">
												<div className="flex items-center justify-between gap-1 flex-wrap">
													<span className="text-[11px] font-black text-[#222222] bg-[#FAF8F5] border border-[#E5DFD4] px-2 py-0.5 rounded-md">
														{phase.timing}
													</span>
													{phase.isConcurrent ? (
														<span className="text-[10px] font-extrabold text-[#1E597B] bg-[#EFF6FA] border border-[#C5DFED] px-1.5 py-0.5 rounded-md flex items-center gap-1">
															<span>🔀</span>
															<span>משולב במקביל</span>
														</span>
													) : (
														<span className="text-[10px] font-extrabold text-[#205739] bg-[#EBF4EE] border border-[#C6DFCE] px-1.5 py-0.5 rounded-md flex items-center gap-1">
															<span>🎯</span>
															<span>מיקוד בלעדי</span>
														</span>
													)}
												</div>

												<h5 className="text-xs font-black text-[#222222] leading-snug">
													{phase.title}
												</h5>
												<p className="text-[11px] text-[#66635C] leading-relaxed">
													{phase.strategyNote}
												</p>

												{/* Parallel Streams in this phase */}
												<div className="space-y-1.5 pt-1">
													{phase.streams.map((st, sIdx) => {
														const isPsych = st.type === 'psychometric';
														return (
															<div
																key={sIdx}
																className={`p-2 rounded-lg text-xs border flex items-center justify-between gap-2 ${
																	isPsych
																		? 'bg-[#F0F5FA] border-[#D1E2F0] text-[#1E597B]'
																		: 'bg-[#FAF6EE] border-[#ECDAB6] text-[#825B15]'
																}`}
															>
																<div className="flex items-center gap-1.5 min-w-0">
																	<span>{isPsych ? '🧠' : '📖'}</span>
																	<span className="font-bold truncate">{st.subjectName}</span>
																</div>
																<div className="flex items-center gap-1 shrink-0 font-extrabold text-[11px]">
																	<span>{st.weeklyHours} ש״ש</span>
																</div>
															</div>
														);
													})}
												</div>
											</div>

											{/* Milestone at end of phase */}
											{phase.milestoneAtEnd && (
												<div className="mt-1 pt-2 border-t border-[#EAE5DA] flex items-center gap-1.5 text-[11px] font-extrabold text-[#222222]">
													<span className="text-sm">🎯</span>
													<span className="truncate">{phase.milestoneAtEnd.title}</span>
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						</div>
					) : (
						/* Fallback Steps Grid */
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
										className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-4 space-y-2 relative overflow-hidden flex flex-col justify-between transition hover:border-[#DDD7CC]"
									>
										<div className="space-y-2">
											<div className="flex items-center justify-between gap-2 flex-wrap">
												<span className="text-[11px] font-bold text-[#222222] bg-white border border-[#E5DFD4] px-2.5 py-0.5 rounded-md">
													שלב {idx + 1} • {step.timing}
												</span>
												<span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${sInfo.badgeClass} flex items-center gap-1 shadow-2xs`}>
													<span>{sInfo.iconEmoji}</span>
													<span>{sInfo.badgeLabel}</span>
												</span>
											</div>
											<h5 className="text-sm font-bold text-[#222222] flex items-center gap-1.5">
												{step.title}
											</h5>
											<p className="text-xs text-[#66635C] leading-relaxed">{step.detail}</p>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<div className="pt-4 border-t border-[#E5DFD4] flex items-center justify-between flex-wrap gap-4">
					<div className="text-xs text-[#66635C] flex items-center gap-2">
						<CheckCircle2 className="h-4 w-4 text-[#205739]" />
						<span>המסלול נשמר בפרופיל האישי שלך באפליקציה</span>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={handlePrint}
							className="px-6 py-3 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
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
					<div className="bg-white border border-[#D2CEEB] rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm relative overflow-hidden">
						<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div className="space-y-1.5 max-w-2xl">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB] tracking-wider">
										מסלול חלופי מובנה • מכינה קדם-אקדמית (Opt-In)
									</span>
									{mechinaReason && (
										<span className="text-[10px] text-[#66635C]">
											• {mechinaReason}
										</span>
									)}
								</div>
								<h4 className="text-lg sm:text-xl font-bold text-[#222222] flex items-center gap-2.5">
									<UniversityLogo institution={analysis.target.institutionId} size="sm" shape="rounded" />
									<span>שוקל מכינה אקדמית ב{analysis.target.institutionName.replace('אוניברסיטת ', '')}?</span>
								</h4>
								<p className="text-xs sm:text-sm text-[#66635C] leading-relaxed">
									עבור פערים גדולים או למי שמעדיף מסגרת לימודית אינטנסיבית ומסודרת, מכינה קדם-אקדמית של המוסד מחליפה את ממוצע הבגרות ומספקת נתיב קבלה ישיר עם מעטפת תרגול ומלגות.
								</p>
							</div>

							<button
								type="button"
								onClick={handleToggleMechina}
								disabled={isLoadingMechina}
								className={`px-5 py-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 border shadow-sm ${
									showMechinaDetails
										? 'bg-white text-[#453D78] border-[#D2CEEB] hover:bg-[#F2F1F8]'
										: 'bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white border-[#3C3C3C]'
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
							<div className="relative z-10 pt-4 border-t border-[#E5DFD4] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
								<div className="bg-[#FAF8F5] border border-[#D2CEEB] rounded-2xl p-5 space-y-4">
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DFD4] pb-3">
										<div className="flex items-center gap-3">
											<UniversityLogo institution={analysis.target.institutionId} size="md" shape="rounded" />
											<div>
												<h5 className="text-base font-bold text-[#222222]">
													{mechinaTrack.title}
												</h5>
												<p className="text-xs text-[#66635C] mt-0.5">
													{mechinaTrack.keyAdvantage}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3 text-xs font-bold text-[#66635C] shrink-0">
											<div className="bg-white px-3 py-1.5 rounded-xl border border-[#E5DFD4]">
												משך: <span className="text-[#453D78] font-bold">{mechinaTrack.estimatedWeeks} שבועות</span>
											</div>
											<div className="bg-white px-3 py-1.5 rounded-xl border border-[#E5DFD4]">
												עומס: <span className="text-[#453D78] font-bold">{mechinaTrack.weeklyHours} ש״ש</span>
											</div>
										</div>
									</div>

									<p className="text-xs text-[#66635C] leading-relaxed">
										{mechinaTrack.strategyDescription}
									</p>

									{/* Milestones in Mechina */}
									{mechinaTrack.milestones && mechinaTrack.milestones.length > 0 && (
										<div className="space-y-2 pt-2">
											<h6 className="text-[11px] font-bold text-[#8A847C] uppercase tracking-wider">
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
															className="bg-white border border-[#E5DFD4] rounded-xl p-3 space-y-1.5"
														>
															<div className="flex items-center justify-between gap-2">
																<span className="text-[10px] font-bold text-[#453D78] bg-[#F2F1F8] border border-[#D2CEEB] px-2 py-0.5 rounded">
																	תחנה {m.orderIndex || mIdx + 1} • {m.timing}
																</span>
																<span className="text-[10px] text-[#66635C] font-bold">
																	{sInfo.iconEmoji}
																</span>
															</div>
															<div className="text-xs font-bold text-[#222222]">
																{m.title}
															</div>
															<p className="text-[11px] text-[#66635C] leading-normal">
																{m.detail}
															</p>
														</div>
													);
												})}
											</div>
										</div>
									)}

									{/* Mechina perks banner */}
									<div className="p-3 bg-[#F2F1F8] border border-[#D2CEEB] rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs text-[#453D78]">
										<div className="flex items-center gap-2">
											<ShieldCheck className="h-4 w-4 text-[#453D78] shrink-0" />
											<span>
												תעודת גמר מכינה מוכרת ומחליפה את תעודת הבגרות במוסד זה. עמידה בממוצע היעד מקנה קבלה ישירה.
											</span>
										</div>
										<span className="text-[11px] font-bold text-[#205739]">
											היתכנות: {mechinaTrack.feasibilityExplanation}
										</span>
									</div>

									{/* Save Mechina Track Button */}
									<div className="pt-2 flex justify-end">
										<button
											type="button"
											onClick={() => handleSaveTrack(mechinaTrack)}
											disabled={savingTrackId === mechinaTrack.id}
											className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 border shadow-sm ${
												savedTrackMap[mechinaTrack.id]
													? 'bg-[#EBF4EE] text-[#205739] border-[#C6DFCE]'
													: 'bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white border-[#3C3C3C]'
											}`}
										>
											{savingTrackId === mechinaTrack.id ? (
												<>
													<Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
													<span>שומר...</span>
												</>
											) : savedTrackMap[mechinaTrack.id] ? (
												<>
													<BookmarkCheck className="h-3.5 w-3.5 text-[#205739]" />
													<span>מסלול מכינה שמור ✓</span>
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
					<div className="bg-white border border-[#E5DFD4] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
						<div className="flex items-center gap-3.5">
							<div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-center text-[#222222] shrink-0">
								<Sliders className="h-5 w-5" />
							</div>
							<div>
								<h5 className="text-sm sm:text-base font-bold text-[#222222]">
									מעדיף להרכיב שילוב ציונים ומקצועות משלך?
								</h5>
								<p className="text-xs text-[#66635C]">
									פתח את חלונית הבנייה האישית, שחק עם סליידרים ובדוק את ההשפעה השולית של כל מקצוע על סיכויי הקבלה.
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => setActiveTab('custom_builder')}
							className="px-5 py-3 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0 shadow-sm"
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
						<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
							{/* Section Header */}
							<div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DFD4] pb-5">
								<div className="space-y-1.5">
									<div className="flex items-center gap-2.5">
										<div className="w-9 h-9 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-center text-[#222222]">
											<Sliders className="h-5 w-5" />
										</div>
										<h3 className="text-xl sm:text-2xl font-bold text-[#222222]">
											חלונית בניית מסלול אישי 🎛️
										</h3>
									</div>
									<p className="text-xs sm:text-sm text-[#66635C] max-w-2xl">
										רוצה להרכיב מסלול משלך? בחר תואר, שחק עם סליידר הפסיכומטרי, הוסף או שפר מקצועות בגרות וצפה במידת ההשפעה המדויקת של כל שינוי על הסכם ועל סיכויי הקבלה.
									</p>
								</div>

								<div className="flex items-center gap-3 flex-wrap">
									{/* Return to Recommended Tracks Button */}
									<button
										type="button"
										onClick={() => setActiveTab('recommended')}
										className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F0EBE1] text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-[#E5DFD4] shadow-sm"
									>
										<Sparkles className="h-3.5 w-3.5 text-[#222222]" />
										<span>חזור ל-3 המסלולים המומלצים</span>
									</button>

									{/* Degree Selector in Custom Builder */}
									{allAnalyses && allAnalyses.length > 1 && (
										<div className="flex items-center gap-2 shrink-0 bg-[#FAF8F5] p-2 rounded-2xl border border-[#E5DFD4]">
											<span className="text-xs font-bold text-[#66635C] mr-1">תואר לבדיקה:</span>
											<select
												value={analysis.target.program.id}
												onChange={(e) => onSelectProgram?.(e.target.value)}
												className="bg-white border border-[#E5DFD4] text-xs font-bold text-[#222222] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#222222]"
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
								<div className="p-4 rounded-2xl bg-[#EBF4EE] border border-[#C6DFCE] text-[#205739] text-xs font-bold flex items-center justify-between gap-2 flex-wrap">
									<div className="flex items-center gap-2">
										<CheckCircle2 className="h-5 w-5 text-[#205739] shrink-0" />
										<span>התרחיש האישי שלך הוחל בהצלחה על תוכנית העבודה שלך!</span>
									</div>
									<button
										type="button"
										onClick={() => setActiveTab('recommended')}
										className="text-xs text-[#205739] underline font-bold inline-flex items-center gap-1"
									>
										<span>צפה במסלולים המומלצים</span>
										<ArrowLeft className="h-3.5 w-3.5" />
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
						<div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#E5DFD4] space-y-4">
							<Sliders className="h-12 w-12 text-[#8A847C] mx-auto" />
							<h3 className="text-lg font-bold text-[#222222]">חסרים נתוני פרופיל לסימולציה</h3>
							<p className="text-sm text-[#66635C]">
								נא להזין ציוני בגרות ופסיכומטרי בשלב 1 כדי שתוכל לבצע סימולציות מותאמות אישית.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
