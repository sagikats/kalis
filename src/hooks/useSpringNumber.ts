'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A number that rolls to its new value on a critically damped spring (no overshoot) instead
 * of jumping. Interruptible: a new target mid-flight re-targets from the value currently on
 * screen and keeps its velocity, so dragging a slider back and forth never stutters.
 * Users who prefer reduced motion get the value immediately.
 *
 * @param response seconds the spring takes to (nearly) reach the target — Apple's "response"
 */
export function useSpringNumber(target: number, response = 0.4): number {
	const [display, setDisplay] = useState(target);
	const valueRef = useRef(target);
	const velocityRef = useRef(0);
	const frameRef = useRef<number | null>(null);

	useEffect(() => {
		const reduceMotion =
			typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		if (reduceMotion || !Number.isFinite(target)) {
			valueRef.current = target;
			velocityRef.current = 0;
			// The value is written from a frame callback, never synchronously inside the effect
			frameRef.current = requestAnimationFrame(() => setDisplay(target));
			return () => {
				if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
			};
		}

		const omega = (2 * Math.PI) / response;
		let last: number | null = null;

		const step = (now: number) => {
			const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, 1 / 20);
			last = now;
			// Critically damped spring: x'' = -ω²(x - target) - 2ω x'
			const displacement = valueRef.current - target;
			const accel = -omega * omega * displacement - 2 * omega * velocityRef.current;
			velocityRef.current += accel * dt;
			valueRef.current += velocityRef.current * dt;

			const settled =
				Math.abs(valueRef.current - target) < Math.max(Math.abs(target) * 1e-4, 0.001) &&
				Math.abs(velocityRef.current) < 0.01;
			if (settled) {
				valueRef.current = target;
				velocityRef.current = 0;
				setDisplay(target);
				frameRef.current = null;
				return;
			}
			setDisplay(valueRef.current);
			frameRef.current = requestAnimationFrame(step);
		};

		frameRef.current = requestAnimationFrame(step);
		return () => {
			if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
		};
	}, [target, response]);

	return display;
}
