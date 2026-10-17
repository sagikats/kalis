'use client';

import React from 'react';
import { X } from 'lucide-react';
import UniversityLogo from '@/components/common/UniversityLogo';
import type { ProgramGapAnalysis } from '@/utils/analysis/gapAnalyzer';
import type { ScenarioDegreeResult } from '@/modules/simulator/evaluate';

interface ProgramResultCardProps {
	analysis: ProgramGapAnalysis;
	result: ScenarioDegreeResult;
	onRemove?: () => void;
}

/** A degree in the simulator: its sekem for the simulated state and its admission threshold. */
export default function ProgramResultCard({ analysis, result, onRemove }: ProgramResultCardProps) {
	const { target } = analysis;
	const digits = target.calculatorId === 'technion' ? 2 : 1;
	const conditionsOnly = Boolean(analysis.admissionRoutes?.conditionsOnly) && result.targetSekem === null;
	const exam = result.entranceExam;

	return (
		<div className="relative bg-white border border-[#E5DFD4] rounded-2xl p-4 space-y-3 min-w-[230px] lg:min-w-0 snap-start">
			<div className="flex items-start gap-3 pl-6">
				<UniversityLogo institution={target.calculatorId} size="sm" />
				<div className="min-w-0">
					<div className="text-sm font-black text-[#222222] leading-snug">{target.program.fieldOfStudy}</div>
					<div className="text-[11px] font-medium text-[#66635C] truncate">{target.institutionName}</div>
				</div>
			</div>
			{onRemove && (
				<button
					type="button"
					onClick={onRemove}
					className="absolute top-3 left-3 p-1 rounded-md text-[#8A847C] hover:text-[#222222] hover:bg-[#FAF8F5] cursor-pointer"
					title="הסר מהסימולטור"
					aria-label={`הסר את ${target.program.fieldOfStudy} מהסימולטור`}
				>
					<X className="h-4 w-4" />
				</button>
			)}

			<div className="grid grid-cols-2 gap-2">
				<div className="bg-[#FAF8F5] rounded-xl p-2.5 text-center">
					<div className="text-[11px] font-bold text-[#66635C]">סכם נוכחי</div>
					<div className="text-xl font-black text-[#222222] tabular-nums dir-ltr">
						{exam ? '—' : result.currentSekem.toFixed(digits)}
					</div>
				</div>
				<div className="bg-[#FAF8F5] rounded-xl p-2.5 text-center">
					<div className="text-[11px] font-bold text-[#66635C]">סכם יעד</div>
					<div className="text-xl font-black text-[#222222] tabular-nums dir-ltr">
						{result.targetSekem !== null ? result.targetSekem.toFixed(digits) : '—'}
					</div>
				</div>
			</div>

			{exam && (
				<p className="text-[11px] leading-relaxed text-[#453D78]">
					{result.analysis?.status === 'not_accepted'
						? result.analysis.admissionNote
						: `הסכם כולל את ${exam.examName}: עם הנתונים בסימולטור נדרש ציון ${exam.requiredScore} לפחות (סולם 0–${exam.scaleMax}).`}
				</p>
			)}
			{conditionsOnly && <p className="text-[11px] leading-relaxed text-[#453D78]">קבלה לפי תנאי סף, בלי סכם יעד.</p>}
		</div>
	);
}
