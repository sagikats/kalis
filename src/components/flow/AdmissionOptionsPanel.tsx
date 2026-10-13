'use client';

import React, { useState } from 'react';
import { ChevronDown, ExternalLink, GraduationCap, Info, Route } from 'lucide-react';
import OfficialRouteDetail, { ROUTE_STATUS_STYLE } from './OfficialRouteDetail';
import type { OfficialRouteInfo, OfficialRouteStatus } from '@/modules/optimizer/officialRoutes';
import { BYPASS_ROUTES } from '@/data/bypassRoutes';
import { getUniversityRegistrationInfo } from '@/utils/universityRegistration';

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
	| { kind: 'mechina'; key: 'mechina'; label: string; url?: string; isAdmissionsPage: boolean }
	| { kind: 'open_university'; key: 'open_university'; label: string; url: string };

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
	const admissionsUrl = getUniversityRegistrationInfo(calculatorId, institutionName)?.registrationUrl;

	const tabs: OptionTab[] = [
		...officialRoutes.map((route): OptionTab => ({ kind: 'official', key: route.id, label: route.tabLabel, status: route.status, route })),
		{
			kind: 'mechina',
			key: 'mechina',
			label: 'מכינה קדם-אקדמית',
			url: links.mechinaUrl ?? admissionsUrl,
			isAdmissionsPage: !links.mechinaUrl
		},
		...(links.openUniversityUrl
			? [{ kind: 'open_university', key: 'open_university', label: 'אפיק מעבר מהאו״פ', url: links.openUniversityUrl } as OptionTab]
			: [])
	];

	const [isOpen, setIsOpen] = useState(beyondRegularTracks);
	const [activeKey, setActiveKey] = useState<string>(tabs[0].key);
	const active = tabs.find((t) => t.key === activeKey) ?? tabs[0];

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
							{`${tabs.length} דרכים נוספות להתקבל ל${programName} ב${inst}. זה מידע להשוואה, לא מסלול מומלץ.`}
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
										מכינה קדם-אקדמית ב{inst}
									</h5>
									<p className="text-sm text-[#44423D] leading-relaxed">
										לומדים במכינה של האוניברסיטה, ובסוף המכינה הציונים בה משמשים לקבלה במקום ציוני הבגרות.
									</p>
									<p className="text-xs text-[#66635C] leading-relaxed">
										לא כל תואר פתוח דרך המכינה, ולכל תוכנית יש ציון מכינה נדרש משלה. האם {programName} פתוח דרך המכינה ובאיזה ציון — בדף הרשמי.
									</p>
									{active.url ? (
										<a href={active.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
											<span>{active.isAdmissionsPage ? `אתר הקבלה ב${inst} (מידע על מכינות)` : `אתר המכינה ב${inst}`}</span>
											<ExternalLink className="h-3.5 w-3.5" />
										</a>
									) : (
										<p className="text-xs text-[#66635C]">לא מצאנו דף מכינה רשמי ב{inst}.</p>
									)}
								</div>
							)}

							{active.kind === 'open_university' && (
								<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-4 sm:p-5 space-y-3 text-right">
									<h5 className="text-base sm:text-lg font-bold text-[#222222] flex items-center gap-2">
										<GraduationCap className="h-5 w-5" />
										אפיק מעבר מהאוניברסיטה הפתוחה ל{inst}
									</h5>
									<p className="text-sm text-[#44423D] leading-relaxed">
										לומדים קורסים באוניברסיטה הפתוחה, שאין בה דרישות קבלה, ועוברים ל{inst} לפי הציונים בקורסים — בלי בגרות ובלי פסיכומטרי.
									</p>
									<p className="text-xs text-[#66635C] leading-relaxed">
										אילו תוכניות פתוחות למעבר, כמה קורסים צריך ובאיזה ממוצע — בדף האפיק הרשמי. בדקו שם אם {programName} נמצא ברשימה.
									</p>
									<a href={active.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
										<span>אפיקי המעבר ל{inst}</span>
										<ExternalLink className="h-3.5 w-3.5" />
									</a>
								</div>
							)}
						</div>

						{!links.openUniversityUrl && (
							<p className="text-[11px] text-[#8A847C]">לאוניברסיטה הפתוחה אין אפיק מעבר ל{inst}.</p>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
