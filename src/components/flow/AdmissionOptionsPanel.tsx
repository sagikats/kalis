'use client';

import React, { useState } from 'react';
import { ChevronDown, ExternalLink, GraduationCap, Info, Route } from 'lucide-react';
import OfficialRouteDetail, { ROUTE_STATUS_STYLE } from './OfficialRouteDetail';
import type { OfficialRouteInfo, OfficialRouteStatus } from '@/modules/optimizer/officialRoutes';
import { BYPASS_ROUTES, OPEN_UNIVERSITY_TRACKS, OPEN_UNIVERSITY_CHECKED_AT, OPEN_UNIVERSITY_RULES_URL, MECHINA_INFO, MECHINA_CHECKED_AT, type MechinaInfo } from '@/data/bypassRoutes';

interface AdmissionOptionsPanelProps {
	/** Official routes of this program other than the regular sekem (bagrut only, psychometric only, …). */
	officialRoutes: OfficialRouteInfo[];
	calculatorId: string;
	institutionName: string;
	programName: string;
	/** Even psychometric 800 with 6 bagrut exams doesn't reach the threshold — open the panel and say so. */
	beyondRegularTracks?: boolean;
}

type OptionTab =
	| { kind: 'official'; key: string; label: string; status: OfficialRouteStatus; route: OfficialRouteInfo }
	| { kind: 'mechina'; key: 'mechina'; label: string; info: MechinaInfo }
	| { kind: 'open_university'; key: 'open_university'; label: string; url: string; tracks: { name: string; url: string }[] };

/**
 * "אפשרויות קבלה נוספות" — always shown under the tracks. Every other way into this program and institution,
 * as information to choose from, never as a recommended track. Mechina and Open University are institution-level:
 * which programs they open, and with what grade, is on the linked official page, not invented here.
 */
export default function AdmissionOptionsPanel({
	officialRoutes,
	calculatorId,
	institutionName,
	programName,
	beyondRegularTracks = false
}: AdmissionOptionsPanelProps) {
	const inst = institutionName.split(' - ')[0].split(' (')[0].replace('אוניברסיטת ', '').replace(/^ה/, '');
	const links = BYPASS_ROUTES[calculatorId] ?? {};
	const ouTracks = OPEN_UNIVERSITY_TRACKS[calculatorId] ?? [];
	const mechina = MECHINA_INFO[calculatorId] ?? null;

	const tabs: OptionTab[] = [
		...officialRoutes.map((route): OptionTab => ({ kind: 'official', key: route.id, label: route.tabLabel, status: route.status, route })),
		...(mechina ? [{ kind: 'mechina', key: 'mechina', label: 'מכינה קדם-אקדמית', info: mechina } as OptionTab] : []),
		...(links.openUniversityUrl && ouTracks.length > 0
			? [{ kind: 'open_university', key: 'open_university', label: 'אפיק מעבר מהאו״פ', url: links.openUniversityUrl, tracks: ouTracks } as OptionTab]
			: [])
	];

	const [isOpen, setIsOpen] = useState(beyondRegularTracks);
	const [activeKey, setActiveKey] = useState<string>(tabs[0]?.key ?? '');
	const active = tabs.find((t) => t.key === activeKey) ?? (tabs.length > 0 ? tabs[0] : undefined);

	const linkClass =
		'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-[#DDD7CB] text-[#222222] hover:bg-[#FAF8F5] transition';

	return (
		<section className="bg-white border border-[#E5DFD4] rounded-3xl shadow-xs overflow-hidden" aria-label="אפשרויות קבלה נוספות">
			<button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				aria-expanded={isOpen}
				className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 text-right cursor-pointer hover:bg-[#FAF8F5]/60 transition-colors"
			>
				<div className="flex items-start gap-3.5 min-w-0">
					<div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD4] flex items-center justify-center text-[#222222] shrink-0">
						<Route className="h-5 w-5" />
					</div>
					<div className="space-y-1 min-w-0">
						<h4 className="text-base sm:text-lg font-bold text-[#222222]">אפשרויות קבלה נוספות</h4>
						<p className="text-xs sm:text-sm text-[#66635C] leading-relaxed">
							{tabs.length === 0
								? `לא פורסמו דרכי קבלה נוספות ל${programName} ב${inst}.`
								: `${tabs.length === 1 ? 'דרך נוספת אחת' : `${tabs.length} דרכים נוספות`} להתקבל ל${programName} ב${inst}. זה מידע להשוואה, לא מסלול מומלץ.`}
						</p>
						<div className="flex flex-wrap gap-1.5 pt-1">
							{tabs.map((t) => (
								<span key={t.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E5DFD4] text-[11px] font-semibold text-[#55524B]">
									{t.kind === 'official' && <span className={`w-1.5 h-1.5 rounded-full ${ROUTE_STATUS_STYLE[t.status].dot}`} />}
									{t.label}
								</span>
							))}
						</div>
					</div>
				</div>
				<span className="inline-flex items-center gap-1.5 self-start sm:self-center px-4 py-2.5 rounded-xl bg-[#3C3C3C] text-white text-xs font-bold shrink-0">
					<span>{isOpen ? 'הסתר' : 'הצג את האפשרויות'}</span>
					<ChevronDown className={`h-4 w-4 transition-transform duration-500 ease-[var(--ease-spring)] ${isOpen ? 'rotate-180' : ''}`} />
				</span>
			</button>

			<div className="disclosure" data-open={isOpen} inert={!isOpen}>
				<div>
					<div className="px-5 sm:px-6 pb-6 pt-1 space-y-4 border-t border-[#EAE5DA]">
						{beyondRegularTracks && (
							<div className="mt-4 p-3.5 rounded-2xl bg-[#FDF6E8] border border-[#ECDAB6] text-xs text-[#825B15] leading-relaxed flex items-start gap-2">
								<Info className="h-4 w-4 shrink-0 mt-0.5" />
								<span>גם עם פסיכומטרי 800 ושיפור של 6 בגרויות לא מגיעים לסף של התוכנית הזו בסכם הרגיל, ולכן כדאי להכיר את הדרכים האלה.</span>
							</div>
						)}

						{active && (
						<>
						{/* Option selector */}
						<div role="tablist" aria-label="בחירת אפשרות קבלה" className="flex items-center gap-2 overflow-x-auto pt-4 pb-1 scrollbar-none">
							{tabs.map((t) => (
								<button
									key={t.key}
									type="button"
									role="tab"
									aria-selected={active.key === t.key}
									onClick={() => setActiveKey(t.key)}
									className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border whitespace-nowrap shrink-0 cursor-pointer ${
										active.key === t.key
											? 'bg-[#3C3C3C] text-white border-[#3C3C3C]'
											: 'bg-white text-[#66635C] border-[#E5DFD4] hover:bg-[#FAF8F5]'
									}`}
								>
									{t.kind === 'official' && <span className={`w-2 h-2 rounded-full shrink-0 ${ROUTE_STATUS_STYLE[t.status].dot}`} />}
									<span>{t.label}</span>
								</button>
							))}
						</div>

						{/* Details of the selected option */}
						<div role="tabpanel" key={active.key} className="animate-in fade-in">
							{active.kind === 'official' && <OfficialRouteDetail route={active.route} />}

							{active.kind === 'mechina' && (
								<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-4 sm:p-5 space-y-3 text-right">
									<h5 className="text-base sm:text-lg font-bold text-[#222222] flex items-center gap-2">
										<GraduationCap className="h-5 w-5" />
										{active.info.title}
									</h5>
									<p className="text-sm text-[#44423D] leading-relaxed">{active.info.howItWorks}</p>
									{active.info.notes.length > 0 && (
										<ul className="text-xs text-[#44423D] leading-relaxed space-y-1">
											{active.info.notes.map((n) => (
												<li key={n}>• {n}</li>
											))}
										</ul>
									)}
									<p className="text-xs text-[#66635C] leading-relaxed">
										התנאים ל{programName} — מסלול המכינה המתאים והציון הנדרש — מפורטים בדף הרשמי.
									</p>
									<a href={active.info.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
										<span>לדף הרשמי</span>
										<ExternalLink className="h-3.5 w-3.5" />
									</a>
									<p className="text-[11px] text-[#8A847C]">לפי האתר של {inst}, נבדק ב-{MECHINA_CHECKED_AT}</p>
								</div>
							)}

							{active.kind === 'open_university' && (
								<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-4 sm:p-5 space-y-3 text-right">
									<h5 className="text-base sm:text-lg font-bold text-[#222222] flex items-center gap-2">
										<GraduationCap className="h-5 w-5" />
										אפיק מעבר מהאוניברסיטה הפתוחה ל{inst}
									</h5>
									<p className="text-sm text-[#44423D] leading-relaxed">
										מתחילים את התואר באוניברסיטה הפתוחה, שאין בה תנאי קבלה, ועוברים ל{inst} לפי הציונים במקבץ קורסים מוגדר — בלי פסיכומטרי ובלי תלות בציוני הבגרות.
									</p>
									<ul className="text-xs text-[#44423D] leading-relaxed space-y-1">
										<li>• נדרשת <strong>זכאות לתעודת בגרות</strong> (לא משנה באילו ציונים) — לפי החלטת המועצה להשכלה גבוהה מ-2022.</li>
										<li>• בכל אפיק יש ממוצע מינימלי וציון מינימלי בקורסים; ציון &quot;עובר&quot; לא מספיק.</li>
										<li>• ברוב האפיקים נדרש גם פטור באנגלית (בחינת אמירנט או קורס אנגלית באו״פ).</li>
									</ul>

									<div className="pt-3 border-t border-[#EAE5DA] space-y-2">
										<span className="text-xs font-bold text-[#222222] block">
											{active.tracks.length === 1
												? `יש אפיק מעבר אחד ל${inst}:`
												: `${active.tracks.length} אפיקי המעבר ל${inst}:`}
										</span>
										<ul className="flex flex-wrap gap-1.5">
											{active.tracks.map((t) => (
												<li key={t.url}>
													<a
														href={t.url}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E5DFD4] text-[11px] font-semibold text-[#44423D] hover:border-[#CCC5B6] hover:text-[#222222] transition"
													>
														{t.name}
														<ExternalLink className="h-3 w-3 text-[#8A847C]" />
													</a>
												</li>
											))}
										</ul>
										<p className="text-[11px] text-[#66635C] leading-relaxed">
											האפיקים מוגדרים לפי פקולטה, בית ספר או חוג. בדקו אם {programName} שייך לאחד מהם — התוכניות שכל אפיק פותח והתנאים המדויקים מפורטים בדף שלו.
										</p>
									</div>

									<p className="text-[11px] text-[#8A847C]">
										לפי אתר האוניברסיטה הפתוחה, נבדק ב-{OPEN_UNIVERSITY_CHECKED_AT} ·{' '}
										<a href={OPEN_UNIVERSITY_RULES_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#44423D]">
											עדכונים ותנאים כלליים
										</a>
									</p>
								</div>
							)}
						</div>

						</>
						)}

						{!mechina && (
							<p className="text-[11px] text-[#8A847C]">ב{inst} אין מכינה קדם-אקדמית לתואר ראשון.</p>
						)}
						{!(links.openUniversityUrl && ouTracks.length > 0) && (
							<p className="text-[11px] text-[#8A847C]">לאוניברסיטה הפתוחה אין אפיק מעבר ל{inst}.</p>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
