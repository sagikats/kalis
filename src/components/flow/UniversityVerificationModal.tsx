'use client';

import React, { useState, useEffect } from 'react';
import {
	X,
	ExternalLink,
	Copy,
	Check,
	Sparkles,
	BookOpen,
	GraduationCap,
	ShieldCheck,
	Info,
	TrendingUp,
	Zap,
	Laptop,
	Loader2,
	RotateCcw,
	Sparkles as SparklesIcon
} from 'lucide-react';
import UniversityLogo from '../common/UniversityLogo';
import {
	getUniversityCalculator,
	formatVerificationClipboardText,
	VerificationSubjectItem,
	VerificationDataSummary
} from '@/utils/universityCalculators';
import { simulateRealisticSubscores } from '@/utils/calculators/psychometricHelper';
import { RecommendedTrack } from '@/utils/analysis/trackGenerator';
import { isSubjectMatch } from '@/modules/optimizer/solver';

interface UniversityVerificationModalProps {
	isOpen: boolean;
	onClose: () => void;
	institutionId: string;
	institutionName: string;
	programName: string;
	track: RecommendedTrack | null;
	userProfile?: any;
	threshold?: number | null;
	isTechnion: boolean;
}

export default function UniversityVerificationModal({
	isOpen,
	onClose,
	institutionId,
	institutionName,
	programName,
	track,
	userProfile,
	threshold,
	isTechnion
}: UniversityVerificationModalProps) {
	const [copiedAll, setCopiedAll] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
	const [isAutofilling, setIsAutofilling] = useState(false);
	const [autofillSuccess, setAutofillSuccess] = useState(false);
	const [showExtensionHelp, setShowExtensionHelp] = useState(false);
	const [extensionNeedsReload, setExtensionNeedsReload] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		// 1. Check DOM attribute or window global set by extension content script
		const checkInstalled = () => {
			const installed =
				Boolean((window as any).__kalis_extension_installed) ||
				document.documentElement.getAttribute('data-kalis-extension-installed') === 'true' ||
				document.documentElement.dataset.kalisExtension === 'true';
			if (installed) setIsExtensionInstalled(true);
		};

		checkInstalled();

		// 2. Listen for messages from extension bridge
		const handleMessage = (e: MessageEvent) => {
			if (e.data?.type === 'KALIS_EXTENSION_READY' || e.data?.type === 'KALIS_PONG_EXTENSION') {
				setIsExtensionInstalled(true);
				if (e.data?.isAlive === false) {
					setExtensionNeedsReload(true);
				}
			}
			if (e.data?.type === 'KALIS_AUTOFILL_STARTED') {
				setIsAutofilling(false);
				if (e.data.success) {
					setAutofillSuccess(true);
					setExtensionNeedsReload(false);
					setTimeout(() => setAutofillSuccess(false), 5000);
				} else if (e.data.needsReload) {
					setExtensionNeedsReload(true);
				}
			}
		};

		const handleCustomEvent = () => setIsExtensionInstalled(true);

		window.addEventListener('message', handleMessage);
		window.addEventListener('kalis:extension-ready', handleCustomEvent);

		// Ping extension
		window.postMessage({ type: 'KALIS_PING_EXTENSION' }, '*');

		return () => {
			window.removeEventListener('message', handleMessage);
			window.removeEventListener('kalis:extension-ready', handleCustomEvent);
		};
	}, []);

	const calcInfo = getUniversityCalculator(institutionId || institutionName);

	// Assemble complete list of subjects for verification - supports both recommendedSubjectImprovements and recommendedLevers
	const baseSubjects = userProfile?.bagrutSubjects || [];
	const improvements: any[] = (track?.recommendedSubjectImprovements || (track as any)?.recommendedLevers || (track as any)?.subjectImprovements || []) as any[];

	const verificationSubjects: VerificationSubjectItem[] = [];
	const matchedImpMap = new Set<string>();

	// 1. Process existing candidate subjects
	baseSubjects.forEach((sub: any) => {
		const sName = (sub as any).name || (sub as any).subjectName || '';
		const sUnits = Number(sub.units) || 0;
		const sGrade = Number(sub.grade) || 0;

		const matchingImp = improvements.find((imp) => {
			const impName = (imp.subjectName || imp.name || '').trim();
			return isSubjectMatch(sName, impName);
		});

		if (matchingImp) {
			const impKey = matchingImp.subjectName || matchingImp.name;
			matchedImpMap.add(impKey);
			const targetGrade = Number(matchingImp.targetGrade) || sGrade;
			const targetUnits = Number(matchingImp.targetUnits) || sUnits;
			verificationSubjects.push({
				name: sName,
				units: targetUnits,
				grade: targetGrade,
				isUpgraded: targetGrade !== sGrade || targetUnits !== sUnits,
				originalGrade: sGrade,
				originalUnits: sUnits
			});
		} else {
			verificationSubjects.push({
				name: sName,
				units: sUnits,
				grade: sGrade,
				isUpgraded: false
			});
		}
	});

	// 2. Add brand-new subjects proposed in this track
	improvements.forEach((imp) => {
		const impKey = imp.subjectName || imp.name;
		if (!matchedImpMap.has(impKey)) {
			verificationSubjects.push({
				name: impKey,
				units: imp.targetUnits || imp.currentUnits || 5,
				grade: imp.targetGrade,
				isNew: true
			});
		}
	});

	// Sort subjects: upgraded/new first, then math/eng, then rest
	verificationSubjects.sort((a, b) => {
		if (a.isUpgraded || a.isNew) return -1;
		if (b.isUpgraded || b.isNew) return 1;
		if (a.name.includes('מתמטיקה')) return -1;
		if (b.name.includes('מתמטיקה')) return 1;
		if (a.name.includes('אנגלית')) return -1;
		if (b.name.includes('אנגלית')) return 1;
		return a.name.localeCompare(b.name, 'he');
	});

	const targetPsych = track?.targetPsychometric || userProfile?.psychometricGeneral || 0;
	const originalPsych = userProfile?.psychometricGeneral || 0;
	const isPsychUpgraded = Boolean(track?.targetPsychometric && track.targetPsychometric > originalPsych);

	// Compute upgraded subscores if psychometric is upgraded
	let effectiveQuant = userProfile?.psychometricQuant;
	let effectiveVerbal = userProfile?.psychometricVerbal;
	let effectiveEnglish = userProfile?.psychometricEnglish;
	let effectiveQuantEmphasis = userProfile?.psychometricQuantEmphasis;
	let effectiveVerbalEmphasis = userProfile?.psychometricVerbalEmphasis;

	if (isPsychUpgraded && targetPsych > 0) {
		const sim = simulateRealisticSubscores(
			targetPsych,
			originalPsych,
			userProfile?.psychometricQuant,
			userProfile?.psychometricVerbal,
			userProfile?.psychometricEnglish,
			userProfile?.psychometricQuantEmphasis,
			userProfile?.psychometricVerbalEmphasis
		);
		effectiveQuant = sim.quantSub;
		effectiveVerbal = sim.verbalSub;
		effectiveEnglish = sim.englishSub;
		effectiveQuantEmphasis = sim.quantEmphasis;
		effectiveVerbalEmphasis = sim.verbalEmphasis;
	}

	// Summary data for clipboard
	const summaryData: VerificationDataSummary = {
		institutionName: calcInfo.shortName,
		programName,
		trackTitle: track?.title || '',
		targetSekem: track?.targetSekem || 0,
		threshold,
		isTechnion,
		psychometricScore: targetPsych,
		isPsychUpgraded,
		originalPsychometric: originalPsych,
		psychQuant: effectiveQuant,
		psychVerbal: effectiveVerbal,
		psychEnglish: effectiveEnglish,
		subjects: verificationSubjects,
		calculatorUrl: calcInfo.calculatorUrl
	};

	const handleCopyAll = async () => {
		try {
			const text = formatVerificationClipboardText(summaryData);
			await navigator.clipboard.writeText(text);
			setCopiedAll(true);
			setTimeout(() => setCopiedAll(false), 2500);
		} catch (err) {
			console.error('Failed to copy to clipboard', err);
		}
	};

	const handleCopyIndividual = async (text: string, fieldId: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(fieldId);
			setTimeout(() => setCopiedField(null), 1800);
		} catch (err) {
			console.error('Failed to copy', err);
		}
	};

	const handleTriggerExtensionAutofill = () => {
		if (!track) return;
		setIsAutofilling(true);
		const hasPsych = Boolean(targetPsych > 0 && (userProfile?.hasTakenPsychometric !== false));
		window.postMessage({
			type: 'KALIS_TRIGGER_AUTOFILL',
			payload: {
				institutionId: institutionId || calcInfo.id,
				institutionName: calcInfo.shortName,
				programName: programName || '',
				calculatorUrl: calcInfo.calculatorUrl,
				hasTakenPsychometric: hasPsych,
				psychometricScore: hasPsych ? targetPsych : null,
				psychQuant: effectiveQuant || null,
				psychVerbal: effectiveVerbal || null,
				psychEnglish: effectiveEnglish || null,
				psychQuantEmphasis: effectiveQuantEmphasis || null,
				psychVerbalEmphasis: effectiveVerbalEmphasis || null,
				targetSekem: track.targetSekem,
				admissionThreshold: threshold || null,
				targetBagrutAverage: track.targetBagrutAverage || track.currentBagrutAverage || 0,
				subjects: verificationSubjects
			}
		}, '*');

		// In case user doesn't have extension active, timeout back to false
		setTimeout(() => setIsAutofilling(false), 3500);
	};


	const formattedSekem = track?.targetSekem !== undefined
		? track.targetSekem.toFixed(isTechnion ? 2 : 1)
		: null;

	const isPassing = threshold && track?.targetSekem ? track.targetSekem >= threshold : true;

	if (!isOpen || !track) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
			<div
				className="bg-white border border-[#E5DFD4] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp text-right"
				dir="rtl"
			>
				{/* Modal Top Header */}
				<div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-[#E5DFD4] flex items-center justify-between gap-4 shrink-0">
					<div className="flex items-center gap-3.5 min-w-0">
						<div className="w-12 h-12 rounded-2xl bg-white border border-[#E5DFD4] flex items-center justify-center shrink-0 shadow-2xs">
							<UniversityLogo institution={institutionId || calcInfo.id} size="md" shape="rounded" />
						</div>
						<div className="min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<h2 className="text-base sm:text-lg font-black text-[#222222]">
									אימות חישוב סכם מול {calcInfo.shortName}
								</h2>
								<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF4EE] text-[#205739] border border-[#C6DFCE]">
									אימות רשמי 1:1
								</span>
							</div>
							<p className="text-xs text-[#66635C] truncate font-medium mt-0.5">
								{programName} • {track.title}
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-xl text-[#8A847C] hover:text-[#222222] hover:bg-[#EAE5DA] transition cursor-pointer shrink-0"
						title="סגור חלונית"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Modal Scrollable Body */}
				<div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
					{/* Expected Sekem KPI Banner */}
					<div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs ${
						isPassing
							? 'bg-[#EBF4EE] border-[#C6DFCE]'
							: 'bg-[#FDF6E8] border-[#ECDAB6]'
					}`}>
						<div className="flex items-center gap-3">
							<div className={`p-2.5 rounded-xl ${isPassing ? 'bg-white text-[#205739]' : 'bg-white text-[#825B15]'}`}>
								<Sparkles className="h-5 w-5" />
							</div>
							<div>
								<div className="text-xs font-bold text-[#44423D]">
									סכם צפוי במחשבון האוניברסיטה:
								</div>
								<div className="flex items-baseline gap-2 mt-0.5">
									<span className={`text-2xl font-black ${isPassing ? 'text-[#205739]' : 'text-[#825B15]'}`}>
										{formattedSekem}
									</span>
									{threshold && (
										<span className="text-xs font-bold text-[#66635C]">
											(סף קבלה מבוקש: {threshold})
										</span>
									)}
								</div>
							</div>
						</div>

						{isPassing && (
							<div className="flex items-center gap-1.5 text-xs font-black text-[#205739] bg-white px-3 py-1.5 rounded-xl border border-[#C6DFCE]">
								<Check className="h-4 w-4" />
								<span>עומד בסף הקבלה הרשמי ✓</span>
							</div>
						)}
					</div>

					{/* Chrome Extension AutoFill Card */}
					<div className="p-4 sm:p-5 bg-gradient-to-r from-[#FAF8F5] to-[#F5F2EB] border-2 border-[#3C3C3C] rounded-2xl space-y-4 shadow-xs">
						<div className="flex items-center justify-between gap-2 flex-wrap">
							<div className="flex items-center gap-2.5">
								<div className="w-8 h-8 rounded-xl bg-[#3C3C3C] text-white flex items-center justify-center text-sm shrink-0 font-bold shadow-2xs">
									⚡
								</div>
								<div>
									<h3 className="text-xs sm:text-sm font-black text-[#222222] flex items-center gap-2">
										<span>מילוי אוטומטי במחשבון האוניברסיטה</span>
										<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF4EE] text-[#15803d] border border-[#C6DFCE]">
											Chrome Extension
										</span>
									</h3>
									<p className="text-[11px] text-[#66635C] mt-0.5">
										תוסף כרום חכם שמזין את כל הציונים, המקצועות והסכם ישירות למחשבון הרשמי
									</p>
								</div>
							</div>
							{isExtensionInstalled ? (
								<div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#EBF4EE] text-[#15803d] border border-[#C6DFCE]">
									<span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
									<span>התוסף מחובר ופעיל ✓</span>
								</div>
							) : (
								<div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FAF8F5] text-[#8A847C] border border-[#E5DFD4]">
									<span className="w-2 h-2 rounded-full bg-[#C4BFB6]" />
									<span>התוסף אינו מחובר</span>
								</div>
							)}
						</div>

						{isExtensionInstalled ? (
							<div className="bg-white p-3.5 border border-[#C6DFCE] rounded-xl space-y-3 shadow-2xs">
								{extensionNeedsReload && (
									<div className="p-3 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl text-xs space-y-1.5 text-[#9A3412] animate-fadeIn">
										<div className="flex items-center justify-between gap-2 flex-wrap">
											<div className="flex items-center gap-1.5 font-bold">
												<RotateCcw className="h-3.5 w-3.5 text-[#EA580C] shrink-0" />
												<span>התוסף עודכן בדפדפן! יש לרענן את העמוד כדי להפעיל אותו מחדש.</span>
											</div>
											<button
												type="button"
												onClick={() => window.location.reload()}
												className="px-2.5 py-1 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
											>
												רענן עמוד (F5)
											</button>
										</div>
									</div>
								)}

								<button
									type="button"
									onClick={handleTriggerExtensionAutofill}
									disabled={isAutofilling}
									className="w-full py-3 px-4 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-70 group border border-[#111]"
								>
									{isAutofilling ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin text-white" />
											<span>מזין ציונים למחשבון {calcInfo.shortName}...</span>
										</>
									) : autofillSuccess ? (
										<>
											<Check className="h-4 w-4 text-[#4ADE80]" />
											<span>הציונים הוזנו בהצלחה במחשבון! ✓</span>
										</>
									) : (
										<>
											<Zap className="h-4 w-4 text-[#FBBF24] group-hover:scale-110 transition-transform" />
											<span>הזן ציונים למחשבון ב-1 קליק ⚡</span>
										</>
									)}
								</button>
								<p className="text-[11px] text-[#66635C] text-center">
									בלחיצה ייפתח המחשבון של {calcInfo.shortName} והתוסף ימלא את כל הציונים והסכם באופן אוטומטי
								</p>
							</div>
						) : (
							<div className="bg-white p-3.5 border border-[#E5DFD4] rounded-xl space-y-3">
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
									<p className="text-xs text-[#55524B] leading-relaxed">
										כדי להזין את כל הציונים בלחיצה אחת, יש לוודא שתוסף הכרום מותקן ופעיל בדפדפן.
									</p>
									<button
										type="button"
										onClick={() => setShowExtensionHelp((prev) => !prev)}
										className="py-2 px-3 rounded-xl bg-[#FAF8F5] border border-[#DDD7CC] text-xs font-bold text-[#3C3C3C] hover:bg-[#F2EFE9] transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
									>
										<Laptop className="h-3.5 w-3.5 text-[#3C3C3C]" />
										<span>{showExtensionHelp ? 'סגור הוראות' : 'הוראות התקנה מהירה (30 שניות)'}</span>
									</button>
								</div>

								{showExtensionHelp && (
									<div className="p-3.5 bg-[#FAF8F5] border border-[#E5DFD4] rounded-xl text-xs space-y-2 text-[#44423D] animate-fadeIn mt-2">
										<div className="font-bold text-[#222222] flex items-center gap-1.5">
											<Laptop className="h-3.5 w-3.5 text-[#3C3C3C]" />
											<span>התקנת התוסף בדפדפן כרום:</span>
										</div>
										<ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#66635C] pr-1 leading-relaxed">
											<li>פתח לשונית חדשה בכרום והקלד: <code className="bg-white px-1.5 py-0.5 rounded border border-[#E5DFD4] text-[#222] font-mono text-[10px]">chrome://extensions</code></li>
											<li>בפינה העליונה הפעל את המתג <strong>״מצב מפתח״ (Developer mode)</strong>.</li>
											<li>לחץ על <strong>״טעינת תוסף לא ארוז״ (Load unpacked)</strong> ובחר את תיקיית <code className="bg-white px-1.5 py-0.5 rounded border border-[#E5DFD4] text-[#222] font-mono text-[10px]">chrome-extension</code> שבפרויקט.</li>
											<li>לאחר מכן רענן דף זה — כפתור המילוי האוטומטי יידלק מיידית!</li>
										</ol>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Direct Calculator External Link CTA */}
					<div className="p-4 bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl space-y-3">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h3 className="text-xs sm:text-sm font-bold text-[#222222]">
									פתיחת מחשבון הסכם של {calcInfo.shortName}
								</h3>
								<p className="text-[11px] text-[#66635C] mt-0.5 leading-relaxed">
									בלחיצה ייפתח האתר הרשמי של המוסד בלשונית חדשה. תוכל להעתיק את הציונים המרוכזים כאן למטה ולהזין אותם, או להשתמש בתוסף האוטומטי.
								</p>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
							<a
								href={calcInfo.calculatorUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="w-full sm:flex-1 py-2.5 px-4 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer group"
							>
								<span>מעבר למחשבון הסכם הרשמי של {calcInfo.shortName}</span>
								<ExternalLink className="h-3.5 w-3.5 text-white/80 group-hover:text-white transition" />
							</a>

							<button
								type="button"
								onClick={handleCopyAll}
								className={`w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
									copiedAll
										? 'bg-[#EBF4EE] border-[#C6DFCE] text-[#205739]'
										: 'bg-white hover:bg-[#F2EFE9] text-[#222222] border-[#DDD7CC]'
								}`}
							>
								{copiedAll ? (
									<>
										<Check className="h-3.5 w-3.5 text-[#205739]" />
										<span>כל הנתונים הועתקו! ✓</span>
									</>
								) : (
									<>
										<Copy className="h-3.5 w-3.5 text-[#66635C]" />
										<span>העתק את כל הנתונים</span>
									</>
								)}
							</button>
						</div>
					</div>

					{/* Section 1: Psychometric to Enter */}
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<GraduationCap className="h-4 w-4 text-[#3C3C3C]" />
								<h3 className="text-xs sm:text-sm font-bold text-[#222222]">
									1. ציון פסיכומטרי להזנה במחשבון
								</h3>
							</div>
							{isPsychUpgraded && (
								<span className="text-[10px] font-bold text-[#3B2D60] bg-[#ECE9F8] border border-[#DDD7CC] px-2 py-0.5 rounded-full">
									יעד שיפור במסלול זה
								</span>
							)}
						</div>

						{targetPsych > 0 ? (
							<div className="space-y-2">
								<div className="p-3.5 bg-white border border-[#E5DFD4] rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
									<div>
										<div className="text-xs font-bold text-[#44423D]">
											פסיכומטרי כללי / רב-תחומי:
										</div>
										<div className="flex items-baseline gap-2 mt-0.5">
											<span className="text-lg font-black text-[#222222] dir-ltr">
												{targetPsych}
											</span>
											{isPsychUpgraded && originalPsych > 0 && (
												<span className="text-xs font-bold text-[#205739] dir-ltr">
													(משודרג מ-{originalPsych}, +{targetPsych - originalPsych})
												</span>
											)}
										</div>
									</div>

									<button
										type="button"
										onClick={() => handleCopyIndividual(String(targetPsych), 'psych')}
										className="px-3 py-1.5 rounded-lg border border-[#DDD7CC] bg-[#FAF8F5] hover:bg-[#F2EFE9] text-xs font-bold text-[#222222] flex items-center gap-1.5 transition cursor-pointer"
										title="העתק ציון"
									>
										{copiedField === 'psych' ? (
											<>
												<Check className="h-3 w-3 text-[#205739]" />
												<span className="text-[#205739]">הועתק</span>
											</>
										) : (
											<>
												<Copy className="h-3 w-3 text-[#66635C]" />
												<span>העתק</span>
											</>
										)}
									</button>
								</div>

								{(effectiveQuant || effectiveVerbal || effectiveEnglish) && (
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-[#FAF8F5] border border-[#E5DFD4] rounded-xl text-xs">
										{effectiveQuant && (
											<div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE5DA]">
												<span className="text-[#66635C] font-medium">כמותי:</span>
												<div className="flex items-center gap-1.5">
													<span className="font-bold text-[#222222] dir-ltr">{effectiveQuant}</span>
													{isPsychUpgraded && userProfile?.psychometricQuant && effectiveQuant > userProfile.psychometricQuant && (
														<span className="text-[10px] text-[#205739] font-bold dir-ltr">(+{effectiveQuant - userProfile.psychometricQuant})</span>
													)}
												</div>
											</div>
										)}
										{effectiveVerbal && (
											<div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE5DA]">
												<span className="text-[#66635C] font-medium">מילולי:</span>
												<div className="flex items-center gap-1.5">
													<span className="font-bold text-[#222222] dir-ltr">{effectiveVerbal}</span>
													{isPsychUpgraded && userProfile?.psychometricVerbal && effectiveVerbal > userProfile.psychometricVerbal && (
														<span className="text-[10px] text-[#205739] font-bold dir-ltr">(+{effectiveVerbal - userProfile.psychometricVerbal})</span>
													)}
												</div>
											</div>
										)}
										{effectiveEnglish && (
											<div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#EAE5DA]">
												<span className="text-[#66635C] font-medium">אנגלית:</span>
												<div className="flex items-center gap-1.5">
													<span className="font-bold text-[#222222] dir-ltr">{effectiveEnglish}</span>
													{isPsychUpgraded && userProfile?.psychometricEnglish && effectiveEnglish > userProfile.psychometricEnglish && (
														<span className="text-[10px] text-[#205739] font-bold dir-ltr">(+{effectiveEnglish - userProfile.psychometricEnglish})</span>
													)}
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						) : (
							<div className="p-3 bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl text-xs text-[#66635C]">
								מסלול זה אינו דורש פסיכומטרי (קבלה ישירה על סמך בגרות).
							</div>
						)}
					</div>

					{/* Section 2: Bagrut Subjects to Enter */}
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<BookOpen className="h-4 w-4 text-[#3C3C3C]" />
								<h3 className="text-xs sm:text-sm font-bold text-[#222222]">
									2. ציוני בגרות להזנה במחשבון ({verificationSubjects.length} מקצועות)
								</h3>
							</div>
							<span className="text-[11px] text-[#66635C] font-medium">
								ממוצע יעד צפוי: {track.targetBagrutAverage?.toFixed(1) || track.currentBagrutAverage?.toFixed(1)}
							</span>
						</div>

						<div className="border border-[#E5DFD4] rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-[#EAE5DA]">
							{verificationSubjects.map((sub, idx) => (
								<div
									key={idx}
									className={`p-3 flex items-center justify-between gap-3 text-xs transition ${
										sub.isUpgraded || sub.isNew ? 'bg-[#FAF8F5]/80' : 'bg-white'
									}`}
								>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-bold text-[#222222] truncate">
												{sub.name}
											</span>
											<span className="text-[11px] font-semibold text-[#66635C] bg-[#FAF8F5] border border-[#E5DFD4] px-1.5 py-0.5 rounded">
												{sub.units} יח״ל
											</span>
											{sub.isNew && (
												<span className="text-[10px] font-black text-[#205739] bg-[#EBF4EE] border border-[#C6DFCE] px-1.5 py-0.5 rounded">
													מקצוע חדש
												</span>
											)}
											{sub.isUpgraded && (
												<span className="text-[10px] font-black text-[#3B2D60] bg-[#ECE9F8] border border-[#DDD7CC] px-1.5 py-0.5 rounded flex items-center gap-1">
													<TrendingUp className="h-2.5 w-2.5" />
													<span>שודרג מ-{sub.originalGrade}</span>
												</span>
											)}
										</div>
									</div>

									<div className="flex items-center gap-2.5 shrink-0">
										<div className="w-14 text-center py-1 bg-white border border-[#DDD7CC] rounded-lg font-black text-sm text-[#222222]">
											{sub.grade}
										</div>

										<button
											type="button"
											onClick={() => handleCopyIndividual(String(sub.grade), `sub_${idx}`)}
											className="p-1.5 rounded-lg border border-[#DDD7CC] bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#66635C] hover:text-[#222222] transition cursor-pointer"
											title="העתק ציון"
										>
											{copiedField === `sub_${idx}` ? (
												<Check className="h-3.5 w-3.5 text-[#205739]" />
											) : (
												<Copy className="h-3.5 w-3.5" />
											)}
										</button>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* 100% Accuracy Guarantee Notice */}
					<div className="p-3.5 bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl flex items-start gap-2.5 text-xs text-[#66635C]">
						<ShieldCheck className="h-4 w-4 text-[#205739] shrink-0 mt-0.5" />
						<p className="leading-relaxed">
							<strong>התחייבות לדיוק מתמטי 1:1:</strong> מנוע האופטימיזציה של מתקבלים מיישם במדויק את כללי חישוב הסכם, בונוסי המקצועות וחוקי נשירת מקצועות לפי הנחיות {calcInfo.shortName} לשנת תשפ״ו. הסכם שתקבל במחשבון האוניברסיטה יהיה זהה לסכם המחושב כאן.
						</p>
					</div>
				</div>

				{/* Modal Bottom Footer */}
				<div className="p-4 bg-[#FAF8F5] border-t border-[#E5DFD4] flex items-center justify-between gap-3 shrink-0">
					<span className="text-[11px] text-[#8A847C] font-medium hidden sm:inline">
						בדוק והשווה ישירות באתר האוניברסיטה
					</span>

					<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
						<button
							type="button"
							onClick={onClose}
							className="px-5 py-2 rounded-xl text-xs font-bold text-[#66635C] hover:text-[#222222] hover:bg-[#EAE5DA] transition cursor-pointer"
						>
							סגור
						</button>

						<a
							href={calcInfo.calculatorUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="px-5 py-2 bg-[#3C3C3C] hover:bg-[#2A2A2A] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
						>
							<span>פתח מחשבון רשמי</span>
							<ExternalLink className="h-3 w-3" />
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
