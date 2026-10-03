'use client';

import React from 'react';
import { CheckCircle2, ListChecks, Info } from 'lucide-react';
import type { OfficialRouteInfo, OfficialRouteStatus } from '@/modules/optimizer/officialRoutes';

export const ROUTE_STATUS_STYLE: Record<OfficialRouteStatus, { label: string; dot: string; chip: string }> = {
	fits: { label: 'מתאים לך', dot: 'bg-[#2E8B57]', chip: 'bg-[#EBF4EE] text-[#205739] border-[#C6DFCE]' },
	close: { label: 'קרוב', dot: 'bg-[#D49A1E]', chip: 'bg-[#FDF6E8] text-[#825B15] border-[#ECDAB6]' },
	info: { label: 'מידע', dot: 'bg-[#1E597B]', chip: 'bg-[#EFF6FA] text-[#1E597B] border-[#C5DFED]' },
	not_met: { label: 'לא עומד/ת כרגע', dot: 'bg-[#A8A196]', chip: 'bg-[#FAF8F5] text-[#66635C] border-[#E5DFD4]' }
};

/** Details of one official admission route (step-4 bypass tabs). */
export default function OfficialRouteDetail({ route }: { route: OfficialRouteInfo }) {
	const style = ROUTE_STATUS_STYLE[route.status];
	return (
		<div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-4 sm:p-5 space-y-4 text-right">
			<div className="flex items-start justify-between gap-3 flex-wrap">
				<h5 className="text-base sm:text-lg font-black text-[#222222]">{route.title}</h5>
				<span className={`px-2.5 py-1 rounded-lg border text-[11px] font-black shrink-0 ${style.chip}`}>{style.label}</span>
			</div>

			<div className={`p-3 rounded-xl border text-sm font-bold flex items-start gap-2 ${style.chip}`}>
				<CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
				<span>{route.headline}</span>
			</div>

			<div className="space-y-1.5">
				<span className="text-xs font-black text-[#222222] flex items-center gap-1.5">
					<ListChecks className="h-4 w-4" />
					תנאי הקבלה באפיק
				</span>
				<ul className="space-y-1 text-xs text-[#44423D] leading-relaxed">
					{route.conditions.map((c) => (
						<li key={c}>• {c}</li>
					))}
				</ul>
			</div>

			{route.notes.length > 0 && (
				<div className="space-y-1.5 pt-3 border-t border-[#EAE5DA]">
					<span className="text-xs font-black text-[#222222] flex items-center gap-1.5">
						<Info className="h-4 w-4" />
						חשוב לדעת
					</span>
					<ul className="space-y-1 text-xs text-[#66635C] leading-relaxed">
						{route.notes.map((n) => (
							<li key={n}>• {n}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
