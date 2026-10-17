'use client';

import React from 'react';
import type { ProgramGapAnalysis } from '@/utils/analysis/gapAnalyzer';
import { resolveInstitutionKey, UNIVERSITIES_META } from '@/components/common/UniversityLogo';

/** A change lowers a degree's sekem (beyond rounding). */
export const lowersAny = (deltas: (number | null)[] | null | undefined) => Boolean(deltas?.some((d) => d !== null && d < -0.005));

/** One tag per degree in the simulator: what the change adds to its sekem. */
export default function ImpactTags({ deltas, degrees }: { deltas: (number | null)[] | null | undefined; degrees: ProgramGapAnalysis[] }) {
	if (!deltas) return null;
	const institutions = degrees.map((a) => a.target.calculatorId);
	return (
		<>
			{deltas.map((d, i) => {
				if (d === null) return null;
				const a = degrees[i];
				const digits = a.target.calculatorId === 'technion' ? 2 : 1;
				const rounded = Number(d.toFixed(digits));
				const text = `${rounded > 0 ? '+' : ''}${rounded.toFixed(digits)}`;
				const shortName = UNIVERSITIES_META[resolveInstitutionKey(a.target.calculatorId)]?.shortName ?? a.target.institutionName;
				// Two degrees of the same institution: name the degree too
				const who = degrees.length === 1
					? 'לסכם'
					: institutions.filter((c) => c === a.target.calculatorId).length > 1
					? `${shortName}, ${a.target.program.fieldOfStudy}`
					: shortName;
				const tone = rounded > 0 ? 'bg-[#E3F1E7] text-[#205739]' : rounded < 0 ? 'bg-[#FBE3DE] text-[#9B3327]' : 'bg-[#EFEAE0] text-[#66635C]';
				return (
					<span
						key={a.target.program.id}
						title={`${a.target.program.fieldOfStudy} — ${a.target.institutionName}`}
						className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold max-w-full ${tone}`}
					>
						<span className="tabular-nums dir-ltr">{text}</span>
						<span className="truncate">{who}</span>
					</span>
				);
			})}
		</>
	);
}
