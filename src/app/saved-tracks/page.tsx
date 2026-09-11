'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	Bookmark,
	BookmarkCheck,
	Trash2,
	Sliders,
	ArrowLeft,
	Sparkles,
	Clock,
	Award,
	CheckCircle2,
	UserPlus,
	LogIn,
	Calendar,
	ChevronDown,
	ChevronUp,
	AlertCircle,
	GraduationCap,
	Zap,
	RefreshCw,
	Layers
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import UniversityLogo from '@/components/common/UniversityLogo';
import { ActionTrackRecord } from '@/modules/db/schema';

export default function SavedTracksPage() {
	const router = useRouter();
	const { user, isAuthenticated, isLoading: authLoading, openAuthModal, refreshUser } = useAuth();

	const [tracks, setTracks] = useState<ActionTrackRecord[]>([]);
	const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(true);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
	const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

	// Fetch saved tracks for authenticated user
	const fetchSavedTracks = useCallback(async (userId: string) => {
		setIsLoadingTracks(true);
		try {
			const res = await fetch(`/api/tracks/save?userId=${encodeURIComponent(userId)}`);
			const data = await res.json();
			if (data.success && Array.isArray(data.tracks)) {
				setTracks(data.tracks);
			} else {
				setTracks([]);
			}
		} catch (err) {
			console.error('Failed to fetch saved tracks:', err);
			setTracks([]);
		} finally {
			setIsLoadingTracks(false);
		}
	}, []);

	useEffect(() => {
		if (authLoading) return;
		if (isAuthenticated && user?.id) {
			fetchSavedTracks(user.id);
		} else {
			setTracks([]);
			setIsLoadingTracks(false);
		}
	}, [authLoading, isAuthenticated, user?.id, fetchSavedTracks]);

	// Instant clean reset on global logout event
	useEffect(() => {
		const handleLogout = () => {
			setTracks([]);
			setIsLoadingTracks(false);
		};
		window.addEventListener('kalis-logout', handleLogout);
		return () => window.removeEventListener('kalis-logout', handleLogout);
	}, []);

	// Handle track deletion
	const handleDeleteTrack = async (track: ActionTrackRecord) => {
		if (!user?.id) return;
		const trackIdentifier = track.id || (track as any).trackType;
		if (!trackIdentifier) return;

		setDeletingId(trackIdentifier);
		try {
			const params = new URLSearchParams({
				userId: user.id,
				trackId: trackIdentifier
			});
			if (track.programId) {
				params.append('programId', track.programId);
			}

			const res = await fetch(`/api/tracks/save?${params.toString()}`, {
				method: 'DELETE'
			});
			const data = await res.json();

			if (data.success) {
				setTracks((prev) => prev.filter((t) => t.id !== track.id && (t as any).trackType !== trackIdentifier));
				setFeedbackMessage({ type: 'success', text: 'המסלול הוסר בהצלחה מרשימת השמורים' });
				await refreshUser();
			} else {
				setFeedbackMessage({ type: 'error', text: data.error || 'שגיאה במחיקת המסלול' });
			}
		} catch (err) {
			console.error('Failed to delete track:', err);
			setFeedbackMessage({ type: 'error', text: 'אירעה שגיאת תקשורת במחיקת המסלול' });
		} finally {
			setDeletingId(null);
			setTimeout(() => setFeedbackMessage(null), 4000);
		}
	};

	const formatDate = (dateVal?: Date | string) => {
		if (!dateVal) return '';
		try {
			const d = new Date(dateVal);
			return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
		} catch {
			return '';
		}
	};

	// Helper for session badges
	const getSessionBadge = (sessionLabel?: string) => {
		const lbl = sessionLabel || '';
		if (lbl.includes('חורף')) {
			return {
				name: 'מועד חורף (ינואר) ❄️',
				classes: 'bg-[#EEF2FF] text-[#1E40AF] border-[#C7D2FE]'
			};
		}
		if (lbl.includes('אביב')) {
			return {
				name: 'מועד אביב (מרץ–אפריל) 🌱',
				classes: 'bg-[#ECFEFF] text-[#0E7490] border-[#A5F3FC]'
			};
		}
		return {
			name: 'מועד קיץ (יוני–יולי) ☀️',
			classes: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
		};
	};

	// -------------------------------------------------------------------------
	// State 1: Auth Loading
	// -------------------------------------------------------------------------
	if (authLoading || (isAuthenticated && isLoadingTracks && tracks.length === 0)) {
		return (
			<div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
				<div className="max-w-5xl mx-auto space-y-6">
					<div className="h-10 w-64 bg-[#EFECE6] rounded-xl animate-pulse" />
					<div className="h-5 w-96 bg-[#EFECE6] rounded-lg animate-pulse" />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
						{[1, 2].map((i) => (
							<div key={i} className="h-80 bg-white rounded-2xl border border-[#E5DFD4] p-6 space-y-4 animate-pulse shadow-xs">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-full bg-[#EFECE6]" />
									<div className="space-y-2 flex-1">
										<div className="h-4 w-36 bg-[#EFECE6] rounded" />
										<div className="h-3 w-24 bg-[#EFECE6] rounded" />
									</div>
								</div>
								<div className="h-20 bg-[#FAF8F5] rounded-xl" />
								<div className="h-12 bg-[#EFECE6] rounded-xl" />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	// -------------------------------------------------------------------------
	// State 2: Unauthenticated / Guest State
	// -------------------------------------------------------------------------
	if (!isAuthenticated || !user) {
		return (
			<div className="min-h-screen bg-[#FAF8F5] py-16 px-4 sm:px-6 lg:px-8" dir="rtl">
				<div className="max-w-2xl mx-auto">
					<div className="bg-white border border-[#E5DFD4] rounded-3xl p-8 sm:p-10 shadow-sm text-center">
						{/* Top Icon Badge */}
						<div className="mx-auto w-16 h-16 rounded-2xl bg-[#EFECE6] border border-[#DDD7CC] flex items-center justify-center text-[#3C3C3C] mb-6 shadow-2xs">
							<Bookmark className="w-8 h-8 stroke-[1.75]" />
						</div>

						{/* Headline & Required Message */}
						<h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
							המסלולים השמורים שלך
						</h1>

						<div className="mt-4 p-4 rounded-2xl bg-[#FDFBF7] border border-[#EAE4D9]">
							<p className="text-base sm:text-lg font-bold text-[#3C3C3C]">
								על מנת לצפות במסלולים שמורים יש להירשם לאתר
							</p>
							<p className="mt-2 text-xs sm:text-sm text-[#66635C] leading-relaxed">
								הרשמה קצרה תאפשר לך לשמור תוכניות קבלה אופטימליות, להשוות בין מסלולים של אוניברסיטאות שונות, ולעקוב אחר מועדי הבחינות לקראת שנת הלימודים.
							</p>
						</div>

						{/* Actions: Register & Login */}
						<div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
							<button
								onClick={() => openAuthModal('register')}
								className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-bold text-white bg-[#3C3C3C] hover:bg-[#2A2A2A] shadow-sm transition-all cursor-pointer"
							>
								<UserPlus className="w-4 h-4" />
								<span>הרשמה לאתר</span>
							</button>

							<button
								onClick={() => openAuthModal('login')}
								className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#3C3C3C] bg-[#EFECE6] hover:bg-[#E5DFD4] border border-[#DDD7CC] transition-all cursor-pointer"
							>
								<LogIn className="w-4 h-4 text-[#66635C]" />
								<span>כבר רשום? התחבר</span>
							</button>
						</div>

						{/* Highlights / Features Grid */}
						<div className="mt-10 pt-8 border-t border-[#EAE5DA] grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
							<div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DC]">
								<div className="flex items-center gap-2 text-xs font-bold text-[#222222] mb-1">
									<CheckCircle2 className="w-4 h-4 text-emerald-700" />
									<span>שמירת מסלולים</span>
								</div>
								<p className="text-[11px] text-[#66635C]">שמור את המסלול המועדף עליך מכל חישוב ב-Flow לגישה עתידית מכל מכשיר.</p>
							</div>

							<div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DC]">
								<div className="flex items-center gap-2 text-xs font-bold text-[#222222] mb-1">
									<Calendar className="w-4 h-4 text-blue-700" />
									<span>לוח זמנים מותאם</span>
								</div>
								<p className="text-[11px] text-[#66635C]">צפה בחלוקת מועדי חורף וקיץ המתוכננים לפי לוח הבחינות הישראלי.</p>
							</div>

							<div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EBE6DC]">
								<div className="flex items-center gap-2 text-xs font-bold text-[#222222] mb-1">
									<Award className="w-4 h-4 text-amber-700" />
									<span>אימות מוסדי 100%</span>
								</div>
								<p className="text-[11px] text-[#66635C]">כל מסלול מאומת ישירות מול מחשבון האוניברסיטה הרשמי ללא הערכות שגויות.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// -------------------------------------------------------------------------
	// State 3: Authenticated — Empty State
	// -------------------------------------------------------------------------
	if (tracks.length === 0 && !isLoadingTracks) {
		return (
			<div className="min-h-screen bg-[#FAF8F5] py-14 px-4 sm:px-6 lg:px-8" dir="rtl">
				<div className="max-w-4xl mx-auto space-y-8">
					{/* Header */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E2D8] pb-6">
						<div>
							<h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
								המסלולים השמורים שלי
							</h1>
							<p className="mt-1 text-xs sm:text-sm text-[#66635C]">
								שלום {user.name}, כאן מרוכזים כל מסלולי הקבלה והאופטימיזציה ששמרת במערכת.
							</p>
						</div>

						{user.candidateNumber && (
							<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#DDD7CC] text-xs text-[#44423D] shadow-2xs">
								<span className="text-[#88857E]">מספר מועמד:</span>
								<span className="font-mono font-bold text-[#222222]">{user.candidateNumber}</span>
							</div>
						)}
					</div>

					{/* Empty Card */}
					<div className="bg-white border border-[#E5DFD4] rounded-3xl p-10 text-center shadow-xs">
						<div className="mx-auto w-16 h-16 rounded-2xl bg-[#F4F1EA] border border-[#DDD7CC] flex items-center justify-center text-[#66635C] mb-4 shadow-2xs">
							<Bookmark className="w-8 h-8 stroke-[1.5]" />
						</div>
						<h2 className="text-xl font-bold text-[#222222]">עדיין לא שמרת מסלולים אקדמיים</h2>
						<p className="mt-2 text-xs sm:text-sm text-[#66635C] max-w-md mx-auto leading-relaxed">
							כשתבצע בדיקת קבלה ב-Flow או במחשבון ותגיע למסך המסלולים המומלצים, תוכל ללחוץ על &quot;שמור מסלול&quot; כדי לעקוב אחריו כאן.
						</p>

						<div className="mt-6 flex justify-center">
							<Link
								href="/flow"
								className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white bg-[#3C3C3C] hover:bg-[#2A2A2A] shadow-xs transition-all cursor-pointer"
							>
								<Sliders className="w-4 h-4" />
								<span>התחל בדיקת התאמה והפק מסלולים</span>
							</Link>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// -------------------------------------------------------------------------
	// State 4: Authenticated — Populated Saved Tracks List
	// -------------------------------------------------------------------------
	return (
		<div className="min-h-screen bg-[#FAF8F5] py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
			<div className="max-w-5xl mx-auto space-y-6">
				{/* Top Notification Toast */}
				{feedbackMessage && (
					<div
						className={`p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs transition-all ${
							feedbackMessage.type === 'success'
								? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
								: 'bg-rose-50 text-rose-900 border border-rose-200'
						}`}
					>
						<div className="flex items-center gap-2">
							{feedbackMessage.type === 'success' ? (
								<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
							) : (
								<AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
							)}
							<span>{feedbackMessage.text}</span>
						</div>
						<button
							onClick={() => setFeedbackMessage(null)}
							className="text-xs text-inherit opacity-70 hover:opacity-100 font-bold"
						>
							✕
						</button>
					</div>
				)}

				{/* Page Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E2D8] pb-6">
					<div>
						<div className="flex items-center gap-2.5">
							<div className="w-9 h-9 rounded-xl bg-[#EFECE6] border border-[#DDD7CC] flex items-center justify-center text-[#3C3C3C] shadow-2xs">
								<BookmarkCheck className="w-5 h-5" />
							</div>
							<h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
								המסלולים השמורים שלי
							</h1>
						</div>
						<p className="mt-1 text-xs sm:text-sm text-[#66635C]">
							נמצאו {tracks.length} מסלולים שמורים עבור המועמד/ת {user.name}
						</p>
					</div>

					<div className="flex items-center gap-3">
						{user.candidateNumber && (
							<div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#DDD7CC] text-xs font-medium text-[#44423D] shadow-2xs">
								<span className="text-[#88857E]">מספר מועמד:</span>
								<span className="font-mono font-bold text-[#222222]">{user.candidateNumber}</span>
							</div>
						)}

						<Link
							href="/flow"
							className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-white bg-[#3C3C3C] hover:bg-[#2A2A2A] shadow-xs transition-all cursor-pointer"
						>
							<Sliders className="w-4 h-4" />
							<span>בדוק מסלול חדש</span>
						</Link>
					</div>
				</div>

				{/* Saved Tracks Cards Grid */}
				<div className="space-y-6">
					{tracks.map((track, idx) => {
						const isExpanded = expandedTrackId === track.id;
						const trackIdentifier = track.id || (track as any).trackType;
						const isDeleting = deletingId === trackIdentifier;

						// Levers / improvements array
						const levers = track.recommendedLevers || (track as any).recommendedSubjectImprovements || [];

						return (
							<div
								key={track.id || idx}
								className="bg-white border border-[#E5DFD4] hover:border-[#DDD5C7] rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-200"
							>
								{/* Card Header: University Emblem, Degree Title & Delete Action */}
								<div className="flex items-start justify-between gap-4 border-b border-[#EAE5DA] pb-5">
									<div className="flex items-center gap-3.5">
										<div className="shrink-0 p-1 bg-[#FAF8F5] rounded-xl border border-[#EBE6DC]">
											<UniversityLogo
												institution={track.institutionId || track.institutionName || 'tau'}
												size="md"
											/>
										</div>
										<div>
											<div className="flex items-center gap-2 flex-wrap">
												<h3 className="text-base sm:text-lg font-bold text-[#222222]">
													{track.programName || track.fieldOfStudy || 'תואר אקדמי'}
												</h3>
												{track.degreeLevel && (
													<span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#EFECE6] text-[#44423D] border border-[#DDD7CC]">
														{track.degreeLevel}
													</span>
												)}
											</div>
											<p className="text-xs text-[#66635C] mt-0.5 font-medium">
												{track.institutionName || 'מוסד אקדמי'}
												{track.admissionThreshold && (
													<span className="mr-2 text-[#88857E]">
														• סף קבלה רשמי: <strong className="text-[#222222]">{track.admissionThreshold}</strong>
													</span>
												)}
											</p>
										</div>
									</div>

									{/* Delete Button */}
									<button
										onClick={() => handleDeleteTrack(track)}
										disabled={isDeleting}
										className="p-2 text-[#88857E] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200 disabled:opacity-50"
										title="הסר מסלול מרשימת השמורים"
									>
										{isDeleting ? (
											<RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
										) : (
											<Trash2 className="w-4 h-4" />
										)}
									</button>
								</div>

								{/* Track Badge, Title & Strategy */}
								<div className="pt-4 space-y-3">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF4E8] text-[#92400E] border border-[#FDE68A] shadow-2xs">
											{track.badge || track.title}
										</span>
										<span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
											עמידה בסף מאומתת ✅
										</span>
										{track.estimatedWeeks > 0 && (
											<span className="flex items-center gap-1 text-xs text-[#66635C] mr-auto">
												<Clock className="w-3.5 h-3.5" />
												<span>{track.estimatedWeeks} שבועות ({track.weeklyHours} ש״ש)</span>
											</span>
										)}
									</div>

									<p className="text-xs sm:text-sm text-[#44423D] leading-relaxed">
										{track.strategyDescription}
									</p>
								</div>

								{/* Verified Targets KPI Grid */}
								<div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EBE6DC]">
									{/* Sekem Target */}
									<div className="p-2.5 rounded-xl bg-white border border-[#E5DFD4] text-center">
										<span className="text-[11px] text-[#66635C] block">סכם יעד מאומת</span>
										<span className="text-base sm:text-lg font-extrabold text-[#222222]">
											{track.targetSekem}
										</span>
										{track.admissionThreshold && (
											<span className="text-[10px] text-emerald-700 block font-semibold">
												(סף: {track.admissionThreshold})
											</span>
										)}
									</div>

									{/* Psychometric Target */}
									<div className="p-2.5 rounded-xl bg-white border border-[#E5DFD4] text-center">
										<span className="text-[11px] text-[#66635C] block">יעד פסיכומטרי</span>
										<span className="text-base sm:text-lg font-extrabold text-[#222222]">
											{track.targetPsychometric ? track.targetPsychometric : 'ללא פסיכומטרי'}
										</span>
										{track.targetPsychometric && track.currentPsychometric ? (
											<span className="text-[10px] text-blue-700 block font-semibold">
												({track.targetPsychometric >= track.currentPsychometric ? '+' : ''}
												{track.targetPsychometric - track.currentPsychometric} נקודות)
											</span>
										) : (
											<span className="text-[10px] text-emerald-700 block font-semibold">קבלה ישירה</span>
										)}
									</div>

									{/* Bagrut Average Target */}
									<div className="p-2.5 rounded-xl bg-white border border-[#E5DFD4] text-center">
										<span className="text-[11px] text-[#66635C] block">ממוצע בגרות יעד</span>
										<span className="text-base sm:text-lg font-extrabold text-[#222222]">
											{track.targetBagrutAverage ? track.targetBagrutAverage.toFixed(1) : 'ללא שינוי'}
										</span>
										{track.currentBagrutAverage && (
											<span className="text-[10px] text-[#88857E] block">
												(נוכחי: {track.currentBagrutAverage.toFixed(1)})
											</span>
										)}
									</div>

									{/* Levers Count */}
									<div className="p-2.5 rounded-xl bg-white border border-[#E5DFD4] text-center">
										<span className="text-[11px] text-[#66635C] block">בחינות לשיפור</span>
										<span className="text-base sm:text-lg font-extrabold text-[#222222]">
											{levers.length}
										</span>
										<span className="text-[10px] text-[#66635C] block font-semibold">
											{levers.length === 0 ? 'פסיכומטרי בלבד' : 'מקצועות בגרות'}
										</span>
									</div>
								</div>

								{/* Required Subject Improvements List (Expandable) */}
								{levers.length > 0 && (
									<div className="mt-4 pt-3 border-t border-[#EAE5DA]">
										<button
											onClick={() => setExpandedTrackId(isExpanded ? null : track.id)}
											className="flex items-center justify-between w-full text-xs font-bold text-[#3C3C3C] hover:text-[#111111] py-1 cursor-pointer"
										>
											<span className="flex items-center gap-1.5">
												<Layers className="w-3.5 h-3.5 text-blue-600" />
												<span>פירוט הבחינות לשיפור והרחבה ({levers.length} בחינות)</span>
											</span>
											{isExpanded ? (
												<ChevronUp className="w-4 h-4 text-[#88857E]" />
											) : (
												<ChevronDown className="w-4 h-4 text-[#88857E]" />
											)}
										</button>

										{isExpanded && (
											<div className="mt-3 space-y-2.5 animate-in fade-in duration-150">
												{levers.map((lever: any, lIdx: number) => {
													const subName = lever.subjectName || lever.subject || 'מקצוע בגרות';
													const targetG = lever.targetGrade ?? lever.newGrade ?? 0;
													const currG = lever.currentGrade ?? 0;
													const targetU = lever.targetUnits ?? lever.units ?? 0;
													const currU = lever.currentUnits ?? targetU;
													const hasUnitChange = currU > 0 && targetU > 0 && currU !== targetU;
													const sessionInfo = getSessionBadge(lever.sessionLabel || lever.session);

													return (
														<div
															key={lIdx}
															className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE6DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
														>
															<div className="space-y-1">
																<div className="flex items-center gap-2 flex-wrap">
																	<span className="font-bold text-[#222222]">{subName}</span>
																	{hasUnitChange ? (
																		<span className="text-[#66635C] font-semibold inline-flex items-center gap-0.5">
																			(
																			<span dir="ltr" className="inline-flex items-center gap-1 font-mono">
																				<span>{currU}</span>
																				<span className="text-[#8A847C]">➔</span>
																				<span>{targetU}</span>
																			</span>
																			<span>יח״ל</span>
																			)
																		</span>
																	) : (
																		<span className="text-[#66635C]">
																			({targetU} יח״ל)
																		</span>
																	)}
																	<span dir="ltr" className="inline-flex items-center gap-1.5 text-xs font-bold shrink-0">
																		{currG > 0 ? (
																			<>
																				<span className="text-[#88857E] font-normal">{currG}</span>
																				<span className="text-[#8A847C] font-normal">➔</span>
																				<span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
																					יעד: {targetG}
																				</span>
																				{targetG > currG && (
																					<span className="text-[10px] text-[#205739] font-bold">
																						(+{targetG - currG})
																					</span>
																				)}
																			</>
																		) : (
																			<span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
																				יעד: {targetG}
																			</span>
																		)}
																	</span>
																</div>
																{lever.reason && (
																	<p className="text-[11px] text-[#66635C] leading-snug">
																		{lever.reason}
																	</p>
																)}
															</div>

															<div className="shrink-0">
																<span
																	className={`px-2.5 py-1 rounded-md text-[10px] font-bold border shadow-2xs ${sessionInfo.classes}`}
																>
																	{sessionInfo.name}
																</span>
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								)}

								{/* Card Bottom: Saved Date & Flow Link */}
								<div className="mt-5 pt-4 border-t border-[#EAE5DA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#88857E]">
									<div className="flex items-center gap-2">
										<Calendar className="w-3.5 h-3.5 text-[#88857E]" />
										<span>נשמר במערכת: {formatDate(track.createdAt)}</span>
									</div>

									<div className="flex items-center gap-2">
										<Link
											href="/flow"
											className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-[#3C3C3C] hover:text-[#111111] bg-[#EFECE6] hover:bg-[#E5DFD4] border border-[#DDD7CC] transition-colors cursor-pointer"
										>
											<Sliders className="w-3.5 h-3.5" />
											<span>פתח בסימולטור</span>
										</Link>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
