'use client';

import React from 'react';
import { TrendingUp, Sparkles, CheckCircle2, Zap, GraduationCap } from 'lucide-react';

export interface InstitutionSimulatedState {
	institutionId: string;
	institutionName: string;
	logoText: string;
	badgeColor: string; // e.g. "from-blue-600 to-cyan-600"
	currentScore: number;
	baseScore: number;
	delta: number;
	bagrutAverage: number;
	bagrutDelta: number;
	isTarget: boolean;
	isTechnion: boolean;
	isDirectBagrutEligible?: boolean;
	sekemTypeLabel: string; // e.g. "סכם הנדסי" / "סכם כללי"
}

interface MultiUniversityAdmissionGridProps {
	institutions: InstitutionSimulatedState[];
	selectedInstitutionId?: string;
	onSelectInstitution?: (institutionId: string) => void;
}

function ScoreDelta({ delta, isTechnion }: { delta: number; isTechnion: boolean }) {
	if (delta <= 0) {
		return (
			<span className="text-[10px] text-slate-500 font-medium">
				ללא שינוי
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-0.5 text-[11px] font-black text-emerald-400">
			<TrendingUp className="h-3 w-3 shrink-0" />
			+{isTechnion ? delta.toFixed(2) : delta.toFixed(1)}
		</span>
	);
}

export default function MultiUniversityAdmissionGrid({
	institutions,
	selectedInstitutionId,
	onSelectInstitution,
}: MultiUniversityAdmissionGridProps) {
	return (
		<div
			dir="rtl"
			className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-2.5"
		>
			{institutions.map((inst) => {
				const isSelected =
					inst.isTarget || inst.institutionId === selectedInstitutionId;
				const isClickable = !!onSelectInstitution;

				return (
					<div
						key={inst.institutionId}
						role={isClickable ? 'button' : undefined}
						tabIndex={isClickable ? 0 : undefined}
						onClick={() => onSelectInstitution?.(inst.institutionId)}
						onKeyDown={(e) => {
							if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
								e.preventDefault();
								onSelectInstitution?.(inst.institutionId);
							}
						}}
						className={[
							'relative flex flex-col justify-between rounded-2xl border p-3 overflow-hidden',
							'transition-all duration-200',
							isClickable
								? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70'
								: '',
							isSelected
								? [
										'bg-cyan-950/40 border-cyan-500/60',
										'shadow-lg shadow-cyan-500/10',
										'ring-1 ring-cyan-500/30',
									].join(' ')
								: [
										'bg-slate-900/60 border-slate-800',
										'backdrop-blur-md',
										'hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/30',
									].join(' '),
						].join(' ')}
					>
						{/* ── Subtle gradient glow for target card ── */}
						{isSelected && (
							<div
								aria-hidden
								className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none"
							/>
						)}

						{/* ── TOP: Logo badge + Name ── */}
						<div className="space-y-2">
							{/* Logo + name row */}
							<div className="flex items-center gap-1.5">
								<span
									className={`w-7 h-7 rounded-xl bg-gradient-to-br ${inst.badgeColor} flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm`}
								>
									{inst.logoText}
								</span>
								<span
									className="text-[11px] font-bold text-slate-200 leading-tight line-clamp-2"
									title={inst.institutionName}
								>
									{inst.institutionName
										.replace('אוניברסיטת ', '')
										.replace('הטכניון - מכון טכנולוגי לישראל', 'הטכניון')}
								</span>
							</div>

							{/* ── SCORE ── */}
							<div className="space-y-0.5" dir="ltr">
								<div
									className={`text-xl font-black leading-none ${
										isSelected ? 'text-cyan-300' : 'text-white'
									}`}
								>
									{inst.isTechnion
										? inst.currentScore.toFixed(2)
										: inst.currentScore.toFixed(1)}
								</div>
								<div className="flex items-center gap-1.5 flex-wrap">
									<ScoreDelta delta={inst.delta} isTechnion={inst.isTechnion} />
									{inst.delta === 0 && inst.baseScore > 0 && (
										<span className="text-[9px] text-slate-600">
											({inst.baseScore.toFixed(inst.isTechnion ? 1 : 0)})
										</span>
									)}
								</div>
							</div>
						</div>

						{/* ── BOTTOM SECTION ── */}
						<div className="mt-2.5 pt-2 border-t border-slate-800/70 space-y-1.5">
							{/* Bagrut average */}
							<div className="flex items-center justify-between text-[10px]" dir="rtl">
								<span className="text-slate-500">בגרות</span>
								<span className="font-bold text-slate-300 dir-ltr flex items-center gap-1">
									{inst.bagrutAverage.toFixed(2)}
									{inst.bagrutDelta > 0 && (
										<span className="text-emerald-400 font-black text-[9px]">
											(+{inst.bagrutDelta.toFixed(1)})
										</span>
									)}
								</span>
							</div>

							{/* Sekem type label */}
							<div
								className={`text-[9px] font-medium truncate ${
									isSelected ? 'text-cyan-500' : 'text-slate-500'
								}`}
							>
								{inst.sekemTypeLabel}
							</div>

							{/* Direct bagrut eligibility badge */}
							{inst.isDirectBagrutEligible && (
								<div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
									<Zap className="h-2.5 w-2.5 text-amber-400 shrink-0" />
									<span className="text-[9px] font-black text-amber-300 leading-none">
										קבלה ישירה
									</span>
								</div>
							)}
						</div>

						{/* ── TARGET BADGE (top-left corner) ── */}
						{isSelected && (
							<div className="absolute top-1.5 left-1.5">
								<span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-cyan-500 text-slate-950 text-[8px] font-black shadow-sm shadow-cyan-500/30">
									<Sparkles className="h-2.5 w-2.5 shrink-0" />
									היעד שלך
								</span>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
