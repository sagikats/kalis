'use client';

import React, { useRef } from 'react';

interface FillSliderCardProps {
	label: string;
	value: number;
	min: number;
	max: number;
	/** Changed or added in the simulator: the card turns green. */
	changed: boolean;
	/** The change lowers a degree's sekem: the card turns red. */
	lowers?: boolean;
	/** Values below it are a failing grade: the fill turns red and a marker shows the line. */
	failBelow?: number;
	/** Small line under the label (e.g. the original grade). */
	hint?: string;
	/** Tags under the label (what the change adds to the sekem). */
	tags?: React.ReactNode;
	size?: 'md' | 'lg';
	onChange: (value: number) => void;
	/** Controls inside the card (units, remove); they don't move the slider. */
	children?: React.ReactNode;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * A card that is itself a slider: its background fills from the right as the value rises, and dragging toward the
 * left raises it (RTL). Mouse sets the value on press; touch waits for a horizontal drag or a tap, so scrolling the
 * page over the card never changes a grade. Keyboard: arrows, Page Up/Down, Home/End.
 */
export default function FillSliderCard({
	label,
	value,
	min,
	max,
	changed,
	lowers = false,
	failBelow,
	hint,
	tags,
	size = 'md',
	onChange,
	children
}: FillSliderCardProps) {
	const ref = useRef<HTMLDivElement>(null);
	const drag = useRef<{ id: number; x: number; y: number; active: boolean; touch: boolean } | null>(null);

	const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
	const failing = failBelow !== undefined && value < failBelow;
	const failPct = failBelow !== undefined && max > min ? ((failBelow - min) / (max - min)) * 100 : null;

	const valueAt = (clientX: number) => {
		const rect = ref.current!.getBoundingClientRect();
		const ratio = clamp((rect.right - clientX) / rect.width, 0, 1);
		return Math.round(min + ratio * (max - min));
	};
	const set = (v: number) => {
		const next = clamp(Math.round(v), min, max);
		if (next !== value) onChange(next);
	};
	const fromControl = (e: React.SyntheticEvent) => (e.target as HTMLElement).closest('[data-no-drag]') !== null;
	const capture = (e: React.PointerEvent<HTMLDivElement>) => {
		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {
			// Capture is a nicety (dragging past the card's edge); the drag works without it
		}
	};

	const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (fromControl(e) || e.button > 0) return;
		const touch = e.pointerType !== 'mouse';
		drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: !touch, touch };
		if (!touch) {
			set(valueAt(e.clientX));
			capture(e);
		}
	};
	const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		const d = drag.current;
		if (!d || d.id !== e.pointerId) return;
		// The button was released where we didn't hear it: the drag is over
		if (!d.touch && e.buttons === 0) {
			drag.current = null;
			return;
		}
		if (!d.active) {
			const dx = Math.abs(e.clientX - d.x);
			const dy = Math.abs(e.clientY - d.y);
			if (dy > 8 && dy > dx) {
				drag.current = null; // the page is scrolling
				return;
			}
			if (dx < 6) return;
			d.active = true;
			capture(e);
		}
		set(valueAt(e.clientX));
	};
	const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		const d = drag.current;
		if (!d || d.id !== e.pointerId) return;
		if (d.touch && !d.active) set(valueAt(e.clientX)); // a tap
		drag.current = null;
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (fromControl(e)) return;
		const big = Math.max(1, Math.round((max - min) / 10));
		const steps: Record<string, number> = {
			ArrowLeft: 1, ArrowUp: 1, ArrowRight: -1, ArrowDown: -1, PageUp: big, PageDown: -big
		};
		if (e.key in steps) set(value + steps[e.key]);
		else if (e.key === 'Home') set(min);
		else if (e.key === 'End') set(max);
		else return;
		e.preventDefault();
	};

	const red = failing || lowers;
	const fillColor = red ? 'bg-[#F4D9D3]' : changed ? 'bg-[#CFE7D7]' : 'bg-[#EDE8DE]';
	const edgeColor = red ? 'bg-[#B5523F]' : changed ? 'bg-[#2E7A4F]' : 'bg-[#9A938A]';

	return (
		<div
			ref={ref}
			role="slider"
			tabIndex={0}
			aria-label={label}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={() => (drag.current = null)}
			onKeyDown={onKeyDown}
			style={{ touchAction: 'pan-y' }}
			className={`relative overflow-hidden rounded-2xl border select-none cursor-ew-resize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#3C3C3C] focus-visible:ring-offset-2 ${
				lowers ? 'border-[#E0A597] bg-[#FDF5F3]' : changed ? 'border-[#8CC2A0] bg-[#F5FAF6]' : 'border-[#E5DFD4] bg-white'
			}`}
		>
			{/* The fill, growing from the right edge */}
			<div className={`absolute inset-y-0 right-0 ${fillColor}`} style={{ width: `${pct}%` }} aria-hidden>
				<div className={`absolute inset-y-0 left-0 w-[3px] ${edgeColor}`} />
			</div>
			{failPct !== null && (
				<div
					className="absolute inset-y-0 w-px border-l border-dashed border-[#C98A7D]"
					style={{ right: `${failPct}%` }}
					aria-hidden
				/>
			)}

			<div className={`relative flex items-center justify-between gap-3 ${size === 'lg' ? 'px-5 py-5' : 'px-4 py-3.5'}`}>
				<div className="min-w-0 space-y-1">
					<div className={`font-black text-[#222222] truncate ${size === 'lg' ? 'text-base' : 'text-sm'}`}>{label}</div>
					{hint && <div className="text-[11px] font-medium text-[#66635C]">{hint}</div>}
					{tags && <div className="flex flex-wrap items-center gap-1">{tags}</div>}
					{children && (
						<div data-no-drag className="flex flex-wrap items-center gap-1.5 pt-0.5 cursor-default">
							{children}
						</div>
					)}
				</div>
				<div
					className={`shrink-0 font-black tabular-nums dir-ltr ${size === 'lg' ? 'text-4xl' : 'text-2xl'} ${
						red ? 'text-[#9B3327]' : changed ? 'text-[#205739]' : 'text-[#222222]'
					}`}
				>
					{value}
				</div>
			</div>
		</div>
	);
}
