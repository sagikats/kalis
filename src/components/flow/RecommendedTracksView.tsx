'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
	Zap,
	ShieldCheck,
	GraduationCap,
	Clock,
	CheckCircle2,
	ArrowRight,
	ArrowLeft,
	ArrowDown,
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
	Info,
	Target,
	Globe,
	ExternalLink
} from 'lucide-react';
import { RecommendedTrack } from '@/utils/analysis/trackGenerator';
import { ProgramGapAnalysis, UserAcademicProfile, screeningStageTitle } from '@/utils/analysis/gapAnalyzer';
import { InstitutionSekemResult } from '@/utils/calculators/multiCalculator';
import { getSessionInfo, getSubjectExamSession } from '@/modules/optimizer/calendarScheduler';
import { getUniversityCalculator } from '@/utils/universityCalculators';
import UniversityVerificationModal from './UniversityVerificationModal';
import SekemBreakdown from './SekemBreakdown';
import WhatIfSimulator from './WhatIfSimulator';
import OfficialRouteDetail, { ROUTE_STATUS_STYLE } from './OfficialRouteDetail';
import type { OfficialRouteStatus } from '@/modules/optimizer/officialRoutes';
import UniversityLogo from '../common/UniversityLogo';
import TrackRegistrationGate from './TrackRegistrationGate';
import { useAuth } from '@/context/AuthContext';

interface RecommendedTracksViewProps {
	analysis: ProgramGapAnalysis;
	allAnalyses?: ProgramGapAnalysis[];
	tracks: RecommendedTrack[];
	userProfile?: UserAcademicProfile;
	institutionResult?: InstitutionSekemResult;
	defaultTab?: 'recommended' | 'custom_builder';
	onSelectProgram?: (programId: string) => void;
	onEditPreferences?: () => void;
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
	onSelectProgram,
	onEditPreferences,
	onBackToReport,
	onApplyCustomScenario
}: RecommendedTracksViewProps) {
	const [activeTab, setActiveTab] = useState<'recommended' | 'custom_builder'>(defaultTab);
	const [editingTrack, setEditingTrack] = useState<RecommendedTrack | null>(null);
	const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[1]?.id || tracks[0]?.id || '');
	const [isPrintMode, setIsPrintMode] = useState(false);
	const [customScenarioApplied, setCustomScenarioApplied] = useState(false);
	const [expandedExplanationMap, setExpandedExplanationMap] = useState<Record<string, boolean>>({});
	const [expandedTargetsMap, setExpandedTargetsMap] = useState<Record<string, boolean>>({});
	const [showRoadmapDetails, setShowRoadmapDetails] = useState<boolean>(false);
	const [verifyingTrack, setVerifyingTrack] = useState<RecommendedTrack | null>(null);
	const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

	const handleOpenVerifyModal = (track: RecommendedTrack) => {
		setVerifyingTrack(track);
		setIsVerifyModalOpen(true);
	};

	const institutionCalcInfo = useMemo(
		() => getUniversityCalculator(analysis.target.institutionId || analysis.target.institutionName),
		[analysis.target.institutionId, analysis.target.institutionName]
	);

	const handleEditTrack = (track: RecommendedTrack) => {
		setEditingTrack(track);
		setActiveTab('custom_builder');
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}
	};

	const toggleExplanation = (trackId: string) => {
		setExpandedExplanationMap((prev) => ({
			...prev,
			[trackId]: !prev[trackId]
		}));
	};

	const toggleTargets = (trackId: string) => {
		setExpandedTargetsMap((prev) => ({
			...prev,
			[trackId]: !prev[trackId]
		}));
	};

	const primaryRecommendedTrack = useMemo(() => {
		if (!tracks || tracks.length === 0) return null;
		return tracks.find((t) => t.badge === 'הכי מומלץ') || tracks[0] || null;
	}, [tracks]);

	// Synchronize editing track and selection when focused program changes
	useEffect(() => {
		setCustomScenarioApplied(false);
		if (primaryRecommendedTrack) {
			setSelectedTrackId(primaryRecommendedTrack.id);
		}
		// Always start custom builder with a clean baseline unless explicitly initiated via "ערוך מסלול בסימולטור"
		setEditingTrack(null);
	}, [analysis.target.program.id, primaryRecommendedTrack]);

	// Scroll to top when switching between Recommended tracks and Custom builder tabs
	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}
	}, [activeTab]);

	// Explicit Track Saving State (Only on User Click)
	const { user, refreshUser, openAuthModal } = useAuth();

	// Guard: Unauthenticated users are gated behind registration
	if (!user) {
		return <TrackRegistrationGate analysis={analysis} onBackToReport={onBackToReport} />;
	}

	const [savedTrackMap, setSavedTrackMap] = useState<Record<string, { savedAt: Date; candidateNumber: string }>>({});
	const [savingTrackId, setSavingTrackId] = useState<string | null>(null);
	const [saveNotification, setSaveNotification] = useState<string | null>(null);

	// Program switcher dropdown state
	const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
	const programDropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (programDropdownRef.current && !programDropdownRef.current.contains(event.target as Node)) {
				setIsProgramDropdownOpen(false);
			}
		}
		if (isProgramDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isProgramDropdownOpen]);

	// Load previously saved tracks for this user and program on mount
	useEffect(() => {
		if (!user?.id || !analysis?.target?.program?.id) return;
		let isMounted = true;
		fetch(
			`/api/tracks/save?userId=${encodeURIComponent(user.id)}&programId=${encodeURIComponent(
				analysis.target.program.id
			)}`
		)
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (isMounted && data && data.success && Array.isArray(data.tracks)) {
					const map: Record<string, { savedAt: Date; candidateNumber: string }> = {};
					data.tracks.forEach((t: any) => {
						const tid = t.track?.id || t.id;
						if (tid) {
							map[tid] = {
								savedAt: new Date(t.savedAt || t.createdAt),
								candidateNumber: t.candidateNumber || ''
							};
						}
					});
					setSavedTrackMap((prev) => ({ ...prev, ...map }));
				}
			})
			.catch((err) => console.error('Failed to load saved tracks map:', err));
		return () => {
			isMounted = false;
		};
	}, [user?.id, analysis?.target?.program?.id]);

	const handleSaveTrack = async (track: any) => {
		if (!user) {
			openAuthModal('register');
			return;
		}
		const trackId = track.id || 'track-standard';
		setSavingTrackId(trackId);
		try {
			const existingUserId = user.id;

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

			const contentType = res.headers.get('content-type') || '';
			if (!contentType.includes('application/json')) {
				setSaveNotification('שגיאת תקשורת בעת שמירת המסלול');
				return;
			}
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

	// Other official admission routes of this program (bagrut-only, psychometric-only, Technion routes).
	// Mechina / Open University tracks are not offered until each one is backed by an official source.
	const officialRoutes = analysis.officialRoutes ?? [];
	const bypassTabs: { key: string; label: string; status?: OfficialRouteStatus }[] = officialRoutes.map((r) => ({
		key: r.id,
		label: r.tabLabel,
		status: r.status
	}));
	const [activeBypassTab, setActiveBypassTab] = useState<string>('');
	const currentBypassTab = bypassTabs.some((t) => t.key === activeBypassTab) ? activeBypassTab : bypassTabs[0]?.key;
	const currentOfficialRoute = officialRoutes.find((r) => r.id === currentBypassTab);
	const [showMechinaDetails, setShowMechinaDetails] = useState<boolean>(false);
	const handleToggleMechina = () => setShowMechinaDetails((v) => !v);

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
			<div className="bg-white border border-[#E5DFD4] rounded-3xl p-6 sm:p-8 shadow-xs relative space-y-6">
				{/* Top Meta & Action Toolbar Row */}
				<div className="relative z-30 flex items-center justify-between gap-4 border-b border-[#EAE5DA] pb-4">
					<button
						onClick={onBackToReport}
						className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#44423D] hover:text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-[#E5DFD4] cursor-pointer"
					>
						<ArrowRight className="h-3.5 w-3.5" />
						<span>חזור לדוח הקבלה</span>
					</button>

					<div className="flex items-center gap-2.5 flex-wrap">
						{onEditPreferences && (
							<button
								onClick={onEditPreferences}
								className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#44423D] hover:text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-[#E5DFD4] cursor-pointer"
							>
								<Sparkles className="h-3.5 w-3.5 text-[#1E597B]" />
								<span>ערוך שאלון העדפות</span>
							</button>
						)}
						<button
							onClick={handlePrint}
							className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#44423D] hover:text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-[#E5DFD4] cursor-pointer"
							title="הדפס או שמור כ-PDF"
						>
							<Printer className="h-3.5 w-3.5 text-[#8A847C]" />
							<span>הדפס</span>
						</button>
					</div>
				</div>

				{/* Main Hero Content & Gap Summary Widget */}
				<div className="relative z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
					<div className="flex-1 min-w-0 space-y-3">
						<div className="flex items-center gap-3 flex-wrap">
							<h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#222222] tracking-tight leading-snug shrink-0">
								תוכנית פעולה עבור:
							</h2>
							{allAnalyses && allAnalyses.length > 1 ? (
								<div className="relative" ref={programDropdownRef}>
									<button
										type="button"
										onClick={() => setIsProgramDropdownOpen(!isProgramDropdownOpen)}
										className={`px-3.5 py-2 border text-sm sm:text-base font-bold text-[#222222] rounded-2xl flex items-center gap-2.5 transition cursor-pointer select-none shadow-2xs outline-none focus:outline-none focus:ring-0 ${
											isProgramDropdownOpen
												? 'bg-[#F2EFE9] border-[#CCC5B6]'
												: 'bg-[#FAF8F5] hover:bg-[#F2EFE9] border-[#E5DFD4] hover:border-[#CCC5B6]'
										}`}
										title="לחץ לבחירת תואר אחר מהתארים שנבחרו"
									>
										<UniversityLogo institution={analysis.target.institutionId} size="sm" shape="circle" />
										<span>{analysis.target.program.fieldOfStudy} • {analysis.target.institutionName}</span>
										<ChevronDown className={`h-4 w-4 text-[#66635C] transition-transform duration-200 ${isProgramDropdownOpen ? 'rotate-180 text-[#222222]' : ''}`} />
									</button>

									{isProgramDropdownOpen && (
										<div
											className="absolute top-full right-0 mt-2 w-72 sm:w-84 border border-[#DDD7CC] rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in duration-150"
											style={{ backgroundColor: '#ffffff', isolation: 'isolate' }}
										>
											<div className="px-2.5 py-1.5 text-[11px] font-bold text-[#8A847C] border-b border-[#EAE5DA] mb-1.5">
												בחירת תואר מבוקש:
											</div>
											<div className="space-y-1 max-h-64 overflow-y-auto">
												{allAnalyses.map((a) => {
													const isSelected = a.target.program.id === analysis.target.program.id;
													const statusIcon = a.status === 'accepted' ? '✅' : a.status === 'missing_requirement' ? '⚠️' : '❌';
													return (
														<button
															key={a.target.program.id}
															type="button"
															onClick={() => {
																onSelectProgram?.(a.target.program.id);
																setIsProgramDropdownOpen(false);
															}}
															className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition text-right cursor-pointer outline-none focus:outline-none ${
																isSelected
																	? 'bg-[#FAF8F5] text-[#222222] border border-[#E5DFD4]'
																	: 'text-[#66635C] hover:bg-[#FAF8F5] hover:text-[#222222]'
															}`}
														>
															<div className="flex items-center gap-2.5 min-w-0">
																<UniversityLogo institution={a.target.institutionId} size="xs" shape="circle" />
																<div className="truncate">
																	<div className="text-[#222222] truncate">{a.target.program.fieldOfStudy}</div>
																	<div className="text-[10px] text-[#8A847C] truncate">{a.target.institutionName}</div>
																</div>
															</div>
															<span className="text-xs shrink-0">{statusIcon}</span>
														</button>
													);
												})}
											</div>
										</div>
									)}
								</div>
							) : (
								<span className="px-3.5 py-2 bg-[#FAF8F5] border border-[#E5DFD4] text-sm sm:text-base font-bold text-[#222222] rounded-2xl flex items-center gap-2.5">
									<UniversityLogo institution={analysis.target.institutionId} size="sm" shape="circle" />
									<span>{analysis.target.program.fieldOfStudy} • {analysis.target.institutionName}</span>
								</span>
							)}
						</div>
						<p className="text-xs sm:text-sm text-[#66635C] max-w-3xl leading-relaxed flex items-center gap-1.5 flex-wrap">
							<span>
								{tracks.length > 0
									? `בנינו עבורך ${tracks.length === 1 ? 'מסלול אחד' : `${tracks.length} מסלולים`}, ממש פה למטה`
									: 'השתמש בחלונית בניית המסלול האישי שלמטה כדי להרכיב שילוב ציונים ומקצועות משלך לבדיקת קבלה.'}
							</span>
							{tracks.length > 0 && (
								<ArrowDown className="h-4 w-4 text-[#66635C] shrink-0" />
							)}
						</p>
					</div>

					{/* Target & Gap Metrics Box */}
					<div className="flex items-center gap-4 bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-4 shrink-0 shadow-xs">
						<div className="text-center px-2 min-w-[75px]">
							<span className="text-[11px] font-bold text-[#66635C] block">סכם קיים</span>
							<span className="text-xl font-black text-[#222222] dir-ltr">{analysis.userSekem}</span>
						</div>
						<div className="h-10 w-px bg-[#E5DFD4]" />
						<div className="text-center px-2 min-w-[75px]">
							<span className="text-[11px] font-bold text-[#66635C] block">{analysis.admissionRoutes?.screening ? 'סף זימון למיונים' : 'סף קבלה'}</span>
							<span className="text-xl font-black text-[#825B15] dir-ltr">{analysis.threshold || (analysis.admissionRoutes?.screening ? 'לא מתפרסם' : '—')}</span>
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

				{/* How the current score for this program is computed (collapsed by default) */}
				{institutionResult?.subjectBreakdown && (
					<SekemBreakdown
						current={{
							breakdown: institutionResult.subjectBreakdown,
							bagrutAverage: institutionResult.bagrutAverage,
							sekem: analysis.userSekem,
							psychometric: userProfile?.psychometricGeneral || undefined
						}}
						sekemLabel={analysis.relevantSekemLabel}
						bagrutCap={institutionResult.bagrutCap}
						psychometricOnly={analysis.relevantSekemType === 'psychometric'}
					/>
				)}

			</div>

			{/* ========================================================================= */}
			{/* VIEW SWITCHER TABS: RECOMMENDED TRACKS vs PERSONAL BUILDER */}
			{/* ========================================================================= */}
			<div className="flex items-center justify-start gap-4 bg-[#FAF8F5] p-2 rounded-2xl border border-[#E5DFD4] shadow-xs">
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
						<span>ריכוז המסלולים המומלץ {tracks.length > 0 ? `(${tracks.length})` : ''}</span>
					</button>

					<div className="relative group">
						<button
							type="button"
							onClick={() => {
								setEditingTrack(null);
								setActiveTab('custom_builder');
							}}
							title="בניית מסלול בעצמך"
							className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer ${
								activeTab === 'custom_builder'
									? 'bg-[#3C3C3C] text-white shadow-xs'
									: 'text-[#66635C] hover:text-[#222222] hover:bg-[#FAF8F5]'
							}`}
						>
							<Sliders className="h-4 w-4 text-inherit" />
							<span>מסלול בנייה אישי 🎛️</span>
							{customScenarioApplied && (
								<span className="w-2 h-2 rounded-full bg-[#205739]" />
							)}
						</button>

						{/* Hover Tooltip Popup */}
						<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#222222] text-white text-[11px] font-bold rounded-xl shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50 flex items-center gap-1.5 border border-[#3C3C3C]">
							<span>בניית מסלול בעצמך</span>
							<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#222222]" />
						</div>
					</div>
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
				tracks.length === 0 ? (
					<div className="text-center py-16 px-6 bg-white rounded-3xl border border-[#E5DFD4] shadow-xs space-y-4 max-w-2xl mx-auto">
						<AlertTriangle className="h-12 w-12 text-[#8A847C] mx-auto" />
						{analysis.status === 'accepted' ? (
							<>
								<h3 className="text-lg font-bold text-[#222222]">אין צורך במסלול שיפור</h3>
								<p className="text-sm text-[#66635C] leading-relaxed">
									הסכם שלך ({analysis.userSekem}) כבר עובר את הסף ({analysis.threshold}) ואת תנאי הסף שפורסמו לתוכנית הזו.
								</p>
							</>
						) : analysis.admissionRoutes?.screening && analysis.threshold === null ? (
							<>
								<h3 className="text-lg font-bold text-[#222222]">אין סף זימון שמתפרסם מראש</h3>
								<p className="text-sm text-[#66635C] leading-relaxed">
									בתוכנית הזו סף המעבר ל{screeningStageTitle(analysis.admissionRoutes.screening.stage)} נקבע מדי שנה לפי המועמדים ואינו מתפרסם, ולכן אין יעד ציון לבנות אליו מסלול. מה שאפשר לתכנן: לעמוד בתנאי הסף להרשמה ולהגיע לציון גבוה ככל האפשר. {analysis.admissionRoutes.screening.note}
								</p>
							</>
						) : (
							<>
								<h3 className="text-lg font-bold text-[#222222]">לא נמצאו מסלולי שיפור אוטומטיים</h3>
								<p className="text-sm text-[#66635C] leading-relaxed">
									על מנת שנוכל להציג מסלולי פעולה ריאליים ומדויקים, יש לוודא שציוני הבגרות והפסיכומטרי הוזנו במלואם. לחלופין, תוכל להשתמש בלשונית &quot;מסלול בנייה אישי&quot; כדי לדמות ציונים בעצמך.
								</p>
							</>
						)}
						<div className="flex items-center justify-center gap-3 pt-2">
							<button
								onClick={onBackToReport}
								className="px-5 py-2.5 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl transition cursor-pointer"
							>
								חזור לדוח הקבלה
							</button>
							<button
								onClick={() => {
									setEditingTrack(null);
									setActiveTab('custom_builder');
								}}
								className="px-5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#222222] font-bold text-xs rounded-xl border border-[#DDD7CB] transition cursor-pointer"
							>
								מעבר למסלול בנייה אישי
							</button>
						</div>
					</div>
				) : (
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
									<div className="flex items-center gap-2">
										<span
											className={`px-3 py-1 text-[11px] font-black rounded-lg ${
												isFast
													? 'bg-[#FDF6E8] text-[#825B15] border border-[#ECDAB6]'
													: isBalanced
													? 'bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE]'
													: 'bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB]'
											}`}
										>
											{track.badge?.replace(/\s*\([^)]*\)/g, '').trim()}
										</span>
										{isSelected && (
											<span className="flex items-center gap-1 text-[10px] font-bold text-[#205739] bg-[#EBF4EE] border border-[#C6DFCE] px-2 py-0.5 rounded-md">
												<CheckCircle2 className="h-3 w-3 text-[#205739]" />
												<span>מסלול מוצג</span>
											</span>
										)}
									</div>
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

								{/* 1. Subject and psychometric improvement details */}
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
										<div className="pt-2 border-t border-[#EAE5DA]">
											<div className="bg-[#F5F1E8] border border-[#DDD5C7] rounded-2xl p-3.5 space-y-2.5 shadow-xs">
												<div className="flex items-center justify-between">
													<span className="text-[13px] font-black text-[#222222] block">
														המלצות לשיפור
													</span>
													<span className="text-[10px] text-[#1E597B] font-bold bg-[#EBF4FA] px-2 py-0.5 rounded-md border border-[#CCE4F4]">
														{[
															needsPsychImprovement ? 'פסיכומטרי' : null,
															hasSubjectImprovements ? (track.recommendedSubjectImprovements.length === 1 ? 'בגרות אחת' : `${track.recommendedSubjectImprovements.length} בגרויות`) : null
														].filter(Boolean).join(' + ')}
													</span>
												</div>

												<div className="space-y-1.5">
													{/* Psychometric improvement row */}
													{needsPsychImprovement && (
														<div className="text-xs flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FAF5FF] border border-[#E9D8FD] flex-wrap">
															<div className="flex items-center gap-1.5 truncate">
																<Brain className="h-3.5 w-3.5 text-[#7E22CE] shrink-0" />
																<span className="text-[#581C87] font-bold truncate">
																	בחינה פסיכומטרית:
																</span>
															</div>
															<span dir="ltr" className="text-[#3B0764] font-bold shrink-0 dir-ltr flex items-center gap-1">
																{(track.currentPsychometric || 0) > 0 ? (
																	<>
																		<span className="text-[#7E22CE]/60 font-normal">{track.currentPsychometric}</span>
																		<span className="text-[#7E22CE]/60 font-normal">➔</span>
																		<span className="text-[#3B0764] font-black">{track.targetPsychometric}</span>
																		<span className="text-[10px] text-[#6B21A8] font-bold ml-0.5 bg-[#F3E8FF] px-1.5 py-0.5 rounded-md border border-[#E9D8FD]">
																			(+{track.targetPsychometric! - (track.currentPsychometric || 0)})
																		</span>
																	</>
																) : (
																	<>
																		<span className="text-[10px] text-[#7E22CE]/70 font-normal">יעד:</span>
																		<span className="text-[#3B0764] font-black">{track.targetPsychometric}</span>
																	</>
																)}
															</span>
														</div>
													)}

													{/* Bagrut subjects improvement rows */}
													{track.recommendedSubjectImprovements.map((s, idx) => {
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
																			<span className="text-[#66635C] font-semibold inline-flex items-center gap-1">
																				<span>(</span>
																				<span dir="ltr" className="inline-flex items-center gap-1 font-mono text-[#66635C]">
																					<span>{s.currentUnits}</span>
																					<span className="text-[#8A847C]">➔</span>
																					<span>{s.targetUnits}</span>
																				</span>
																				<span>יח״ל):</span>
																			</span>
																		) : (
																			`(${s.targetUnits} יח״ל):`
																		)}
																	</span>
																</div>
																{(!isNewSubject && !hasUnitChange && s.currentGrade > 0) ? (
																	<span dir="ltr" className="text-[#222222] font-bold shrink-0 dir-ltr flex items-center gap-1">
																		<span className="text-[#8A847C] font-normal">{s.currentGrade}</span>
																		<span className="text-[#8A847C] font-normal">➔</span>
																		<span className="text-[#222222] font-black">{s.targetGrade}</span>
																		{s.targetGrade > s.currentGrade && (
																			<span className="text-[10px] text-[#205739] font-bold ml-0.5">
																				(+{s.targetGrade - s.currentGrade})
																			</span>
																		)}
																	</span>
																) : (
																	<div className="flex items-center gap-1.5 shrink-0">
																		<span className="text-[11px] text-[#66635C] font-medium">ציון יעד:</span>
																		<span className="text-sm font-black text-[#222222]">{s.targetGrade}</span>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											</div>
										</div>
									);
								})()}

								{/* Collapsible Targets Summary Drawer */}
								<div className="pt-2 border-t border-[#EAE5DA]">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											toggleTargets(track.id);
										}}
										className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold text-[#66635C] hover:text-[#222222] bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#E5DFD4] transition cursor-pointer"
									>
										<span className="flex items-center gap-1.5">
											<Target className="h-3.5 w-3.5 text-[#8A847C]" />
											<span>סיכום יעדים</span>
										</span>
										<ChevronDown
											className={`h-4 w-4 text-[#8A847C] transition-transform duration-200 ${
												expandedTargetsMap[track.id] ? 'rotate-180 text-[#222222]' : ''
											}`}
										/>
									</button>

									{expandedTargetsMap[track.id] && (
										<div className="mt-2 space-y-2 animate-fadeIn">
											{/* 2. Psychometric target if exists */}
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

											{/* 3. Bagrut target if exists */}
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

											{/* 4. Target Sekem if exists */}
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
																: 'סכם מחושב:'}
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
										</div>
									)}
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

							{/* Bottom Action & Save Buttons */}
							<div className="p-6 pt-0 space-y-2">
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										handleEditTrack(track);
									}}
									className="w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 border cursor-pointer bg-white hover:bg-[#FAF8F5] text-[#1E597B] border-[#C5DFED] shadow-2xs"
								>
									<Sliders className="h-3.5 w-3.5 text-[#1E597B]" />
									<span>ערוך מסלול בסימולטור</span>
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
				<div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${showRoadmapDetails ? 'border-b border-[#E5DFD4] pb-5' : ''}`}>
					<div className="space-y-1.5 max-w-2xl">
						<div className="flex items-center gap-2">
							<Award className="h-5 w-5 text-[#222222]" />
							<h3 className="text-lg sm:text-xl font-bold text-[#222222]">
								תוכנית עבודה שבוע-אחר-שבוע: {selectedTrack.title}
							</h3>
						</div>
						<p className="text-xs sm:text-sm text-[#66635C]">
							{selectedTrack.keyAdvantage}
						</p>
						<div className="flex items-center gap-2 pt-1 flex-wrap text-xs text-[#66635C]">
							<span className="bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E5DFD4] font-medium">
								משך כולל: <strong className="text-[#222222]">{selectedTrack.estimatedWeeks} שבועות</strong>
							</span>
							<span className="bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E5DFD4] font-medium">
								עומס שבועי: <strong className="text-[#222222]">{selectedTrack.weeklyHours} ש״ש</strong>
							</span>
						</div>
					</div>

					<div className="flex items-center gap-2.5 text-xs font-bold text-[#66635C] shrink-0 flex-wrap">
						<button
							type="button"
							onClick={() => handleSaveTrack(selectedTrack)}
							disabled={savingTrackId === selectedTrack.id}
							className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
								savedTrackMap[selectedTrack.id]
									? 'bg-[#EBF4EE] text-[#205739] border-[#C6DFCE]'
									: 'bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#222222] border-[#E5DFD4]'
							}`}
						>
							{savingTrackId === selectedTrack.id ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin text-[#222222]" />
									<span>שומר...</span>
								</>
							) : savedTrackMap[selectedTrack.id] ? (
								<>
									<BookmarkCheck className="h-3.5 w-3.5 text-[#205739]" />
									<span>המסלול שמור ✓</span>
								</>
							) : (
								<>
									<Bookmark className="h-3.5 w-3.5 text-[#66635C]" />
									<span>שמור מסלול</span>
								</>
							)}
						</button>
						<button
							type="button"
							onClick={() => setShowRoadmapDetails((prev) => !prev)}
							className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 border shadow-sm cursor-pointer ${
								showRoadmapDetails
									? 'bg-white text-[#222222] border-[#E5DFD4] hover:bg-[#FAF8F5]'
									: 'bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white border-[#3C3C3C]'
							}`}
						>
							{showRoadmapDetails ? (
								<>
									<span>הסתר תוכנית עבודה</span>
									<ChevronUp className="h-4 w-4" />
								</>
							) : (
								<>
									<Calendar className="h-4 w-4" />
									<span>הרחב תוכנית עבודה מפורטת</span>
									<ChevronDown className="h-4 w-4" />
								</>
							)}
						</button>
					</div>
				</div>

				{/* Collapsible Roadmap Details */}
				{showRoadmapDetails && (
					<div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
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
										<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF5FF] border border-[#E9D8FD] text-[#6B21A8] font-bold">
											<Brain className="h-3.5 w-3.5 text-[#7E22CE]" />
											<span>פסיכומטרי:</span>
											<span dir="ltr" className="inline-flex items-center gap-1 font-mono">
												{(selectedTrack.currentPsychometric || 0) > 0 ? (
													<>
														<span className="text-[#8A847C] font-normal">{selectedTrack.currentPsychometric}</span>
														<span className="text-[#8A847C]">➔</span>
														<span className="font-bold text-[#3B0764]">{selectedTrack.targetPsychometric}</span>
													</>
												) : (
													<span>יעד {selectedTrack.targetPsychometric}</span>
												)}
											</span>
											<span className="text-[10px] px-1.5 py-0.5 rounded border border-[#E9D8FD] bg-white text-[#6B21A8]">
												{sInfo.iconEmoji} {sInfo.name}
											</span>
										</span>
									);
								})()}
								{selectedTrack.recommendedSubjectImprovements.map((s, idx) => {
									const sSession = s.session || getSubjectExamSession(s.subjectName, s.targetUnits);
									const sInfo = getSessionInfo(sSession);
									const isNewSubject = !s.currentUnits || s.currentUnits === 0;
									const hasUnitChange = Boolean(s.currentUnits && s.currentUnits > 0 && s.currentUnits !== s.targetUnits);
									return (
										<span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F2F1F8] border border-[#D2CEEB] text-[#453D78] font-bold">
											<BookOpen className="h-3.5 w-3.5 text-[#453D78]" />
											<span>
												{s.subjectName}{' '}
												{isNewSubject ? (
													`(מקצוע חדש, ${s.targetUnits} יח״ל):`
												) : hasUnitChange ? (
													<span className="inline-flex items-center gap-1">
														<span>(</span>
														<span dir="ltr" className="inline-flex items-center gap-1 font-mono">
															<span>{s.currentUnits}</span>
															<span>➔</span>
															<span>{s.targetUnits}</span>
														</span>
														<span>יח״ל):</span>
													</span>
												) : (
													`(${s.targetUnits} יח״ל):`
												)}
											</span>
											{(!isNewSubject && !hasUnitChange && s.currentGrade > 0) ? (
												<span dir="ltr" className="inline-flex items-center gap-1 font-mono">
													<span className="text-[#8A847C] font-normal">{s.currentGrade}</span>
													<span className="text-[#8A847C]">➔</span>
													<span className="font-bold">{s.targetGrade}</span>
													{s.targetGrade > s.currentGrade && (
														<span className="text-[10px] text-[#205739] font-bold ml-0.5">
															(+{s.targetGrade - s.currentGrade})
														</span>
													)}
												</span>
											) : (
												<span className="font-mono text-sm font-black text-[#222222]">
													ציון יעד: {s.targetGrade}
												</span>
											)}
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

					{/* Screened programs (medicine): the plan ends with the screening stage, never with admission */}
					{/* The fallback steps grid already ends with the screening step */}
					{analysis.admissionRoutes?.screening && (selectedTrack.schedulePhases?.length ?? 0) > 0 && (() => {
						const last = selectedTrack.steps[selectedTrack.steps.length - 1];
						return (
							<div className="mt-4 p-3.5 rounded-2xl bg-[#FDF6E8] border border-[#ECDAB6] text-xs text-[#825B15] space-y-1">
								<div className="font-extrabold text-[#222222] flex items-center gap-1.5">
									<span className="text-sm">🩺</span>
									<span>אחרי הבחינה: {last?.title ?? screeningStageTitle(analysis.admissionRoutes.screening.stage)}</span>
								</div>
								<p className="leading-relaxed">{last?.detail ?? analysis.admissionRoutes.screening.note}</p>
							</div>
						);
					})()}
				</div>

				{/* Action Buttons */}
				<div className="pt-4 border-t border-[#E5DFD4] flex items-center justify-between flex-wrap gap-4">
					{savedTrackMap[selectedTrack.id] ? (
						<div className="text-xs text-[#205739] flex items-center gap-2 font-bold bg-[#EBF4EE] border border-[#C6DFCE] px-3.5 py-2 rounded-xl">
							<CheckCircle2 className="h-4 w-4 text-[#205739]" />
							<span>המסלול נשמר בפרופיל האישי שלך באפליקציה</span>
						</div>
					) : (
						<button
							type="button"
							onClick={() => handleSaveTrack(selectedTrack)}
							disabled={savingTrackId === selectedTrack.id}
							className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#222222] font-bold text-xs rounded-xl transition flex items-center gap-2 border border-[#E5DFD4] cursor-pointer"
						>
							{savingTrackId === selectedTrack.id ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin text-[#222222]" />
									<span>שומר מסלול במסד הנתונים...</span>
								</>
							) : (
								<>
									<Bookmark className="h-3.5 w-3.5 text-[#66635C]" />
									<span>שמור מסלול זה לפרופיל האישי</span>
								</>
							)}
						</button>
					)}

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
				)}
			</div>

				{/* ========================================================================= */}
				{/* OPT-IN BYPASS ROUTES (מכינה קדם-אקדמית & אפיק מעבר מהאוניברסיטה הפתוחה) */}
				{/* ========================================================================= */}
				{officialRoutes.length > 0 && analysis.status !== 'accepted' && (
					<div className="bg-white border border-[#D2CEEB] rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm relative overflow-hidden">
						<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div className="space-y-1.5 max-w-2xl">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#F2F1F8] text-[#453D78] border border-[#D2CEEB] tracking-wider">
										{`${officialRoutes.length} אפיקי קבלה רשמיים`}
									</span>
								</div>
								<h4 className="text-lg sm:text-xl font-bold text-[#222222] flex items-center gap-2.5">
									<UniversityLogo institution={analysis.target.institutionId} size="sm" shape="rounded" />
									<span>דרכי קבלה נוספות ב{analysis.target.institutionName.replace('אוניברסיטת ', '').replace(/^ה/, '')}</span>
								</h4>
								<p className="text-xs sm:text-sm text-[#66635C] leading-relaxed">
									{`לתואר הזה יש גם דרכי קבלה רשמיות שאינן הסכם הרגיל: ${officialRoutes.map((r) => r.tabLabel).join(', ')}.`}
								</p>
							</div>

							<button
								type="button"
								onClick={handleToggleMechina}
								className={`px-5 py-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 border shadow-sm ${
									showMechinaDetails
										? 'bg-white text-[#453D78] border-[#D2CEEB] hover:bg-[#F2F1F8]'
										: 'bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white border-[#3C3C3C]'
								}`}
							>
								{showMechinaDetails ? (
									<>
										<span>הסתר דרכי קבלה נוספות</span>
										<ChevronUp className="h-4 w-4" />
									</>
								) : (
									<>
										<GraduationCap className="h-4 w-4" />
										<span>לכל דרכי הקבלה</span>
										<ChevronDown className="h-4 w-4" />
									</>
								)}
							</button>
						</div>

						{/* Expanded Bypass Routes Details */}
						{showMechinaDetails && bypassTabs.length > 0 && (
							<div className="relative z-10 pt-4 border-t border-[#E5DFD4] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
								{/* Tab bar: every way into this degree other than the regular sekem */}
								{bypassTabs.length > 1 && (
									<div className="flex items-center gap-2 border-b border-[#E5DFD4] pb-3 overflow-x-auto scrollbar-none">
										{bypassTabs.map((tab) => (
											<button
												key={tab.key}
												type="button"
												onClick={() => setActiveBypassTab(tab.key)}
												className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border whitespace-nowrap shrink-0 cursor-pointer ${
													currentBypassTab === tab.key
														? 'bg-[#3C3C3C] text-white border-[#3C3C3C] shadow-xs'
														: 'bg-white text-[#66635C] border-[#E5DFD4] hover:bg-[#FAF8F5]'
												}`}
											>
												{tab.status && <span className={`w-2 h-2 rounded-full shrink-0 ${ROUTE_STATUS_STYLE[tab.status].dot}`} />}
												<span>{tab.label}</span>
											</button>
										))}
									</div>
								)}

								{/* Official route details */}
								{currentOfficialRoute && <OfficialRouteDetail route={currentOfficialRoute} />}
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
							onClick={() => {
								setEditingTrack(null);
								setActiveTab('custom_builder');
							}}
							className="px-5 py-3 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0 shadow-sm"
						>
							<span>עבור לחלונית בניית מסלול אישי</span>
							<ChevronLeft className="h-4 w-4" />
						</button>
					</div>
				)}
			</div>
				)
			)}

			{/* ========================================================================= */}
			{/* TAB 2: PERSONAL CUSTOM TRACK BUILDER (חלונית בניית מסלול אישי נפרדת) */}
			{/* ========================================================================= */}
			{activeTab === 'custom_builder' && (
				<div className="space-y-6">
					{userProfile && institutionResult ? (
						<div className="bg-white border border-[#E5DFD4] rounded-3xl p-3 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
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
													const icon = a.status === 'accepted' ? '✅' : a.status === 'missing_requirement' ? '⚠️' : '❌';
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
										onClick={() => {
											setEditingTrack(null);
											setActiveTab('recommended');
										}}
										className="text-xs text-[#205739] underline font-bold inline-flex items-center gap-1"
									>
										<span>צפה במסלולים המומלצים</span>
										<ArrowLeft className="h-3.5 w-3.5" />
									</button>
								</div>
							)}

							{/* Interactive What-If Simulator (needs a published threshold to compare against) */}
							{analysis.threshold === null ? (
								<div className="p-4 rounded-2xl bg-[#F2F1F8] border border-[#D2CEEB] text-xs text-[#453D78] font-medium leading-relaxed">
									לתואר הזה אין סף מספרי שמתפרסם מראש, ולכן אין מה לדמות בסימולטור. {analysis.admissionNote}
								</div>
							) : (
							<WhatIfSimulator
								analysis={analysis}
								userProfile={userProfile}
								institutionResult={institutionResult}
								onApplyScenario={handleApplyScenario}
								initialTrackToEdit={editingTrack}
								onCancelEdit={() => {
									setEditingTrack(null);
									setActiveTab('recommended');
								}}
							/>
							)}
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

			{/* University Verification Modal */}
			<UniversityVerificationModal
				isOpen={isVerifyModalOpen}
				onClose={() => {
					setIsVerifyModalOpen(false);
					setVerifyingTrack(null);
				}}
				institutionId={analysis.target.institutionId || ''}
				institutionName={analysis.target.institutionName || ''}
				programName={analysis.target.program?.fieldOfStudy || ''}
				track={verifyingTrack}
				userProfile={userProfile}
				threshold={analysis.threshold}
				isTechnion={isTechnion}
			/>
		</div>
	);
}
