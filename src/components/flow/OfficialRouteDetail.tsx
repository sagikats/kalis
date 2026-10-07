'use client';

import React from 'react';
import { CheckCircle2, ListChecks, Info } from 'lucide-react';
import type { OfficialRouteInfo, OfficialRouteStatus } from '@/modules/optimizer/officialRoutes';

export const ROUTE_STATUS_STYLE: Record<OfficialRouteStatus, { label: string; dot: string; chip: string }> = {
	fits: { label: 'מתאים לך', dot: 'bg-[#2E8B57]', chip: 'bg-success-soft text-success border-success/25' },
	close: { label: 'קרוב', dot: 'bg-[#D49A1E]', chip: 'bg-warning-soft text-warning border-warning/30' },
	info: { label: 'מידע', dot: 'bg-accent', chip: 'bg-accent-soft text-accent border-accent/20' },
	not_met: { label: 'לא עומד/ת כרגע', dot: 'bg-ink-3', chip: 'bg-paper text-ink-2 border-line' }
};

/** Details of one official admission route (step-4 bypass tabs). */
export default function OfficialRouteDetail({ route }: { route: OfficialRouteInfo }) {
	const style = ROUTE_STATUS_STYLE[route.status];
	return (
		<div className="bg-paper border border-line rounded-2xl p-4 sm:p-5 space-y-4 text-right">
			<div className="flex items-start justify-between gap-3 flex-wrap">
				<h5 className="text-base sm:text-lg font-bold text-ink">{route.title}</h5>
				<span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold shrink-0 ${style.chip}`}>{style.label}</span>
			</div>

			<div className={`p-3 rounded-xl border text-sm font-bold flex items-start gap-2 ${style.chip}`}>
				<CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
				<span>{route.headline}</span>
			</div>

			<div className="space-y-1.5">
				<span className="text-xs font-bold text-ink flex items-center gap-1.5">
					<ListChecks className="h-4 w-4" />
					תנאי הקבלה באפיק
				</span>
				<ul className="space-y-1 text-xs text-ink-2 leading-relaxed">
					{route.conditions.map((c) => (
						<li key={c}>• {c}</li>
					))}
				</ul>
			</div>

			{route.notes.length > 0 && (
				<div className="space-y-1.5 pt-3 border-t border-line">
					<span className="text-xs font-bold text-ink flex items-center gap-1.5">
						<Info className="h-4 w-4" />
						חשוב לדעת
					</span>
					<ul className="space-y-1 text-xs text-ink-2 leading-relaxed">
						{route.notes.map((n) => (
							<li key={n}>• {n}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
