'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Calculator, ArrowLeftRight } from 'lucide-react';
import type { SubjectBreakdownItem } from '../../modules/calculators/types';

/** One computed state of the score: the bagrut breakdown plus the final score for this program. */
export interface SekemSnapshot {
	breakdown: SubjectBreakdownItem[];
	bagrutAverage: number;
	sekem: number;
	psychometric?: number;
}

interface SekemBreakdownProps {
	current: SekemSnapshot;
	/** When given (simulator), a "what changed" section compares `current` with it. */
	baseline?: SekemSnapshot;
	sekemLabel: string;
	bagrutCap?: number;
	/** Programs that admit by the psychometric score alone: the bagrut doesn't enter the score. */
	psychometricOnly?: boolean;
	title?: string;
	className?: string;
}

const STATUS_ORDER: Record<SubjectBreakdownItem['status'], number> = { mandatory: 0, included: 1, dropped: 2, empty: 3 };

const fmt = (n: number, d = 2) => (Number.isInteger(n) ? String(n) : n.toFixed(d));
const signed = (n: number, d = 2) => `${n > 0 ? '+' : ''}${fmt(Math.round(n * 10 ** d) / 10 ** d, d)}`;

function StatusChip({ status }: { status: SubjectBreakdownItem['status'] }) {
	const map = {
		mandatory: { text: 'חובה · נכנס', cls: 'bg-[#EFF6FA] text-[#1E597B] border-[#C5DFED]' },
		included: { text: 'נכנס לממוצע', cls: 'bg-[#EBF4EE] text-[#205739] border-[#C6DFCE]' },
		dropped: { text: 'הושמט', cls: 'bg-white text-[#8A847C] border-[#E5DFD4]' },
		empty: { text: 'אין ציון', cls: 'bg-white text-[#A8A196] border-[#EAE5DA]' }
	}[status];
	return <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap ${map.cls}`}>{map.text}</span>;
}

function dropReason(item: SubjectBreakdownItem, average: number): string {
	if (item.effective < average) {
		return `${item.grade}${item.bonus ? ` + בונוס ${fmt(item.bonus)}` : ''} = ${fmt(item.effective)}, נמוך מהממוצע שלך (${fmt(average)}). הכנסתו הייתה מורידה את הממוצע, ולכן הוא הושמט.`;
	}
	return `${fmt(item.effective)} עם הבונוס. השילוב שבלעדיו נותן ממוצע גבוה יותר (מקצועות בחירה נכנסים רק אם הם משפרים את הממוצע).`;
}

/**
 * Collapsible "how is my score computed" panel: which bagrut subjects count, their bonus and effective score,
 * which were dropped from the optimal average (with an on-demand explanation), and — given a baseline — what changed.
 */
export default function SekemBreakdown({ current, baseline, sekemLabel, bagrutCap, psychometricOnly, title, className = '' }: SekemBreakdownProps) {
	const [open, setOpen] = useState(false);
	const [openReason, setOpenReason] = useState<string | null>(null);

	const rows = useMemo(
		() => [...current.breakdown].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.effective - a.effective),
		[current.breakdown]
	);
	const counted = rows.filter((r) => r.status === 'mandatory' || r.status === 'included');
	const dropped = rows.filter((r) => r.status === 'dropped');
	const countedUnits = counted.reduce((s, r) => s + r.units, 0);
	const totalUnits = rows.filter((r) => r.status !== 'empty').reduce((s, r) => s + r.units, 0);

	const changes = useMemo(() => {
		if (!baseline) return null;
		const before = new Map(baseline.breakdown.map((b) => [b.name, b]));
		const after = new Map(current.breakdown.map((b) => [b.name, b]));
		const isIn = (b?: SubjectBreakdownItem) => !!b && (b.status === 'mandatory' || b.status === 'included');
		const edits: string[] = [];
		const returned: string[] = [];
		const left: string[] = [];
		for (const [name, a] of after) {
			const b = before.get(name);
			if (!b) {
				if (a.status !== 'empty') edits.push(`${name}: נוסף (${a.units} יח״ל, ${a.grade})`);
			} else if (a.grade !== b.grade || a.units !== b.units) {
				const unitsText = a.units !== b.units ? `${b.units}→${a.units} יח״ל, ` : '';
				edits.push(`${name}: ${unitsText}${b.grade} → ${a.grade}`);
			}
			if (b && b.status !== 'empty' && a.status !== 'empty') {
				if (!isIn(b) && isIn(a)) returned.push(name);
				if (isIn(b) && !isIn(a)) left.push(name);
			} else if (!b && a.status === 'dropped') {
				left.push(name);
			}
		}
		for (const [name, b] of before) if (!after.has(name) && b.status !== 'empty') edits.push(`${name}: הוסר`);
		return {
			edits,
			returned,
			left,
			avgDelta: current.bagrutAverage - baseline.bagrutAverage,
			sekemDelta: current.sekem - baseline.sekem,
			psychChanged: baseline.psychometric !== undefined && current.psychometric !== undefined && baseline.psychometric !== current.psychometric
		};
	}, [baseline, current]);

	const hasChanges = !!changes && (changes.edits.length > 0 || changes.returned.length > 0 || changes.left.length > 0 || changes.psychChanged);
	const deltaCls = (n: number) => (n > 0.005 ? 'text-[#205739]' : n < -0.005 ? 'text-[#9B3327]' : 'text-[#66635C]');

	return (
		<div className={`bg-white border border-[#E5DFD4] rounded-2xl shadow-2xs ${className}`}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right cursor-pointer hover:bg-[#FAF8F5] rounded-2xl transition"
			>
				<span className="flex items-center gap-2 min-w-0">
					<Calculator className="h-4 w-4 text-[#3C3C3C] shrink-0" />
					<span className="text-xs sm:text-sm font-black text-[#222222]">{title ?? 'איך חושב הסכם שלך לתואר הזה'}</span>
				</span>
				<span className="flex items-center gap-2 shrink-0">
					<span className="text-[11px] text-[#66635C] hidden sm:inline">
						{counted.length} נכנסו{dropped.length > 0 ? ` · ${dropped.length} הושמטו` : ''}
					</span>
					{hasChanges && changes && (changes.returned.length > 0 || changes.left.length > 0) && (
						<span className="px-1.5 py-0.5 rounded-md bg-[#FDF6E8] border border-[#ECDAB6] text-[#825B15] text-[10px] font-black">השתנה</span>
					)}
					<ChevronDown className={`h-4 w-4 text-[#66635C] transition-transform ${open ? 'rotate-180' : ''}`} />
				</span>
			</button>

			{open && (
				<div className="px-4 pb-4 space-y-3 text-right">
					{/* What changed (simulator only) */}
					{changes && (
						<div className="rounded-xl border border-[#ECDAB6] bg-[#FDF9F0] p-3 space-y-1.5 text-xs">
							<div className="flex items-center gap-1.5 font-black text-[#825B15]">
								<ArrowLeftRight className="h-3.5 w-3.5" />
								<span>מה השתנה לעומת המצב הנוכחי</span>
							</div>
							{!hasChanges ? (
								<p className="text-[#66635C]">עדיין לא בוצעו שינויים.</p>
							) : (
								<ul className="space-y-1 text-[#44423D]">
									{changes.edits.map((e) => (
										<li key={e}>• {e}</li>
									))}
									{changes.psychChanged && (
										<li>
											• פסיכומטרי: {baseline!.psychometric} → {current.psychometric}
										</li>
									)}
									{changes.returned.map((n) => (
										<li key={`r-${n}`} className="text-[#205739] font-bold">
											• {n} חזר לממוצע
										</li>
									))}
									{changes.left.map((n) => (
										<li key={`l-${n}`} className="text-[#8A847C] font-bold">
											• {n} הושמט מהממוצע
										</li>
									))}
								</ul>
							)}
							{hasChanges && (
								<div className="flex items-center gap-4 pt-1 font-black dir-rtl flex-wrap">
									<span>
										ממוצע: <span className={`dir-ltr inline-block ${deltaCls(changes.avgDelta)}`}>{signed(changes.avgDelta)}</span>
									</span>
									<span>
										{sekemLabel}: <span className={`dir-ltr inline-block ${deltaCls(changes.sekemDelta)}`}>{signed(changes.sekemDelta)}</span>
									</span>
								</div>
							)}
						</div>
					)}

					{/* Subjects */}
					<div className="rounded-xl border border-[#EAE5DA] overflow-hidden">
						<div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 bg-[#FAF8F5] text-[10px] font-bold text-[#66635C]">
							<span>מקצוע</span>
							<span className="text-center">ציון + בונוס</span>
							<span className="text-center">בממוצע</span>
							<span className="text-center w-[70px]">סטטוס</span>
						</div>
						{rows.map((r) => (
							<div key={r.name} className={`border-t border-[#F0ECE4] ${r.status === 'dropped' || r.status === 'empty' ? 'bg-[#FCFBF9]' : ''}`}>
								<div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center px-3 py-2 text-xs">
									<span className={`min-w-0 truncate font-bold ${r.status === 'dropped' ? 'text-[#8A847C]' : 'text-[#222222]'}`}>
										{r.name} <span className="font-medium text-[#8A847C]">· {r.units} יח״ל</span>
									</span>
									<span className="text-center dir-ltr text-[#44423D] whitespace-nowrap">
										{r.grade}
										{r.bonus ? <span className="text-[#205739]"> +{fmt(r.bonus)}</span> : null}
									</span>
									<span className={`text-center font-black dir-ltr ${r.status === 'dropped' ? 'text-[#A8A196] line-through' : 'text-[#222222]'}`}>
										{r.status === 'empty' ? '—' : fmt(r.effective)}
									</span>
									<span className="w-[70px] flex justify-center">
										{r.status === 'dropped' ? (
											<button
												type="button"
												onClick={() => setOpenReason(openReason === r.name ? null : r.name)}
												className="flex items-center gap-1 cursor-pointer"
												title="למה הושמט?"
											>
												<StatusChip status="dropped" />
												<span className="text-[10px] text-[#1E597B] underline">למה?</span>
											</button>
										) : (
											<StatusChip status={r.status} />
										)}
									</span>
								</div>
								{openReason === r.name && r.status === 'dropped' && (
									<p className="px-3 pb-2 text-[11px] text-[#66635C] leading-relaxed">{dropReason(r, current.bagrutAverage)}</p>
								)}
							</div>
						))}
					</div>

					{/* Totals */}
					<div className="space-y-1 text-xs text-[#44423D]">
						<p>
							<strong>ממוצע בגרות מיטבי: </strong>
							<span className="dir-ltr inline-block font-black">{fmt(current.bagrutAverage)}</span>
							<span className="text-[#66635C]"> · נכנסו {countedUnits} יח״ל מתוך {totalUnits}</span>
							{bagrutCap !== undefined && current.bagrutAverage >= bagrutCap && (
								<span className="text-[#825B15]"> · הממוצע מוגבל ל-{bagrutCap} במוסד הזה</span>
							)}
						</p>
						<p className="text-[11px] text-[#66635C] leading-relaxed">
							מקצועות חובה תמיד נכנסים. מקצועות בחירה נכנסים רק אם הם מעלים את הממוצע, כל עוד נשארים לפחות 20 יח״ל.
						</p>
						<p>
							<strong>{sekemLabel}: </strong>
							<span className="dir-ltr inline-block font-black">{current.sekem}</span>
							{psychometricOnly ? (
								<span className="text-[#66635C]"> · בתואר הזה הקבלה לפי הפסיכומטרי בלבד, והבגרות לא נכנסת לציון</span>
							) : current.psychometric ? (
								<span className="text-[#66635C]">
									{' '}
									· מחושב מהממוצע ({fmt(current.bagrutAverage)}) ומהפסיכומטרי ({current.psychometric}) לפי נוסחת המוסד
								</span>
							) : null}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
