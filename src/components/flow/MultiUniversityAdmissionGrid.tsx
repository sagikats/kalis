'use client';

import React from 'react';
import { TrendingUp, Sparkles, CheckCircle2, Zap, GraduationCap } from 'lucide-react';
import UniversityLogo from '../common/UniversityLogo';

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
			<span className="text-[10px] text-[#8A847C] font-medium">
				ללא שינוי
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-0.5 text-[11px] font-black text-[#205739]">
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
								? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222]/20'
								: '',
							isSelected
								? 'bg-white border-2 border-[#3C3C3C] shadow-xs'
								: 'bg-white border border-[#E5DFD4] hover:border-[#D5CFC2] hover:bg-[#FAF8F5] shadow-2xs',
						].join(' ')}
					>
						{/* ── TOP: Logo badge + Name ── */}
						<div className="space-y-2">
							{/* Logo + name row */}
							<div className="flex items-center gap-2">
								<UniversityLogo institution={inst.institutionId || inst.logoText} size="sm" shape="rounded" />
								<span
									className="text-[11px] font-bold text-[#222222] leading-tight line-clamp-2"
									title={inst.institutionName}
								>
									{inst.institutionName
										.replace('אוניברסיטת ', '')
										.replace('הטכניון - מכון טכנולוגי לישראל', 'הטכניון')}
								</span>
							</div>

							{/* ── SCORE ── */}
							<div className="space-y-0.5" dir="ltr">
								<div className="text-xl font-black leading-none text-[#222222]">
									{inst.isTechnion
										? inst.currentScore.toFixed(2)
										: inst.currentScore.toFixed(1)}
								</div>
								<div className="flex items-center gap-1.5 flex-wrap">
									<ScoreDelta delta={inst.delta} isTechnion={inst.isTechnion} />
									{inst.delta === 0 && inst.baseScore > 0 && (
										<span className="text-[9px] text-[#8A847C]">
											({inst.baseScore.toFixed(inst.isTechnion ? 1 : 0)})
										</span>
									)}
								</div>
							</div>
						</div>

						{/* ── BOTTOM SECTION ── */}
						<div className="mt-2.5 pt-2 border-t border-[#EAE5DA] space-y-1.5">
							{/* Bagrut average */}
							<div className="flex items-center justify-between text-[10px]" dir="rtl">
								<span className="text-[#66635C]">בגרות</span>
								<span className="font-bold text-[#222222] dir-ltr flex items-center gap-1">
									{inst.bagrutAverage.toFixed(2)}
									{inst.bagrutDelta > 0 && (
										<span className="text-[#205739] font-black text-[9px]">
											(+{inst.bagrutDelta.toFixed(1)})
										</span>
									)}
								</span>
							</div>

							{/* Sekem type label */}
							<div
								className={`text-[9px] font-medium truncate ${
									isSelected ? 'text-[#1E597B] font-bold' : 'text-[#8A847C]'
								}`}
							>
								{inst.sekemTypeLabel}
							</div>

							{/* Direct bagrut eligibility badge */}
							{inst.isDirectBagrutEligible && (
								<div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-lg bg-[#FDF6E8] border border-[#ECDAB6]">
									<Zap className="h-2.5 w-2.5 text-[#825B15] shrink-0" />
									<span className="text-[9px] font-black text-[#825B15] leading-none">
										קבלה ישירה
									</span>
								</div>
							)}
						</div>

						{/* ── TARGET BADGE (top-left corner) ── */}
						{isSelected && (
							<div className="absolute top-1.5 left-1.5">
								<span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#3C3C3C] text-white text-[8px] font-black shadow-xs">
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
