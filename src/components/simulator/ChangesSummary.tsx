'use client';

import React from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { ProgramGapAnalysis } from '@/utils/analysis/gapAnalyzer';
import { isSubjectChanged, ScenarioImpacts, ScenarioState } from '@/modules/simulator/evaluate';
import ImpactTags, { lowersAny } from './ImpactTags';

interface ChangesSummaryProps {
	degrees: ProgramGapAnalysis[];
	scenario: ScenarioState;
	/** Psychometric the simulation started from. */
	startPsych: number;
	impacts: ScenarioImpacts;
	/** Every change together: each degree's sekem now minus its sekem before the changes (null: entrance exam). */
	totals: (number | null)[];
	onUndoPsych: () => void;
	onUndoSubject: (id: string) => void;
}

function Row({
	name,
	detail,
	deltas,
	degrees,
	undo
}: {
	name: string;
	detail: React.ReactNode;
	deltas: (number | null)[] | null | undefined;
	degrees: ProgramGapAnalysis[];
	undo: React.ReactNode;
}) {
	const lowers = lowersAny(deltas);
	return (
		<li
			className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 rounded-xl border ${
				lowers ? 'border-[#E0A597] bg-[#FDF5F3]' : 'border-[#C6DFCE] bg-[#F5FAF6]'
			}`}
		>
			<div className="flex items-center justify-between gap-3 sm:w-56 sm:shrink-0">
				<div className="min-w-0">
					<div className="text-sm font-black text-[#222222] truncate">{name}</div>
					<div className="text-[11px] font-medium text-[#66635C]">{detail}</div>
				</div>
				<div className="sm:hidden">{undo}</div>
			</div>
			<div className="flex flex-wrap items-center gap-1 flex-1">
				<ImpactTags deltas={deltas} degrees={degrees} />
			</div>
			<div className="hidden sm:block">{undo}</div>
		</li>
	);
}

const arrow = (from: React.ReactNode, to: React.ReactNode) => (
	<span className="dir-ltr inline-block tabular-nums">
		{from} → {to}
	</span>
);

/** Everything changed in the simulator, with what each change adds to every degree's sekem, and the total. */
export default function ChangesSummary({ degrees, scenario, startPsych, impacts, totals, onUndoPsych, onUndoSubject }: ChangesSummaryProps) {
	const changed = scenario.subjects.filter(isSubjectChanged);
	const count = changed.length + (impacts.psychometric ? 1 : 0);

	const undoButton = (label: string, onClick: () => void, remove = false) => (
		<button
			type="button"
			onClick={onClick}
			className="p-1.5 rounded-md text-[#8A847C] hover:text-[#222222] hover:bg-white cursor-pointer"
			title={remove ? 'הסר מקצוע' : 'בטל שינוי'}
			aria-label={label}
		>
			{remove ? <Trash2 className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
		</button>
	);

	return (
		<section className="border border-[#E5DFD4] rounded-2xl p-4 sm:p-5 space-y-3" aria-label="סיכום השינויים">
			<div className="flex items-baseline justify-between gap-2">
				<h4 className="text-base font-black text-[#222222]">סיכום השינויים</h4>
				<span className="text-xs font-bold text-[#66635C]">{count === 0 ? 'אין שינויים' : count === 1 ? 'שינוי אחד' : `${count} שינויים`}</span>
			</div>

			{count === 0 ? (
				<p className="text-xs text-[#66635C]">עוד לא שינית כלום. גרור כרטיס של מקצוע או של הפסיכומטרי, וכל שינוי יופיע כאן עם ההשפעה שלו על כל תואר.</p>
			) : (
				<>
					<ul className="space-y-2">
						{impacts.psychometric && (
							<Row
								name="פסיכומטרי"
								detail={arrow(startPsych, scenario.psychometric)}
								deltas={impacts.psychometric}
								degrees={degrees}
								undo={undoButton('בטל את השינוי בפסיכומטרי', onUndoPsych)}
							/>
						)}
						{changed.map((s) => (
							<Row
								key={s.id}
								name={s.name}
								detail={
									s.isAdded ? (
										<>מקצוע חדש · {s.units} יח״ל · ציון {s.grade}</>
									) : (
										<>
											{s.grade !== s.originalGrade && <>ציון {arrow(s.originalGrade, s.grade)}</>}
											{s.grade !== s.originalGrade && s.units !== s.originalUnits && ' · '}
											{s.units !== s.originalUnits && <>{arrow(s.originalUnits, s.units)} יח״ל</>}
										</>
									)
								}
								deltas={impacts.subjects[s.id]}
								degrees={degrees}
								undo={undoButton(s.isAdded ? `הסר את ${s.name}` : `בטל את השינוי ב${s.name}`, () => onUndoSubject(s.id), s.isAdded)}
							/>
						))}
					</ul>

					<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 pt-3 border-t border-[#EAE5DA]">
						<div className="text-sm font-black text-[#222222] sm:w-56 sm:shrink-0">
							סך הכול לסכם
							<span className="block text-[11px] font-medium text-[#66635C]">כל השינויים יחד</span>
						</div>
						<div className="flex flex-wrap items-center gap-1 flex-1">
							<ImpactTags deltas={totals} degrees={degrees} />
						</div>
					</div>
				</>
			)}
		</section>
	);
}
