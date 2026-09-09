'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	baseAlpha: number;
	alpha: number;
	color: string;
}

export default function InteractiveBackground() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animationFrameId: number;
		let width = (canvas.width = window.innerWidth);
		let height = (canvas.height = window.innerHeight);

		const handleResize = () => {
			if (!canvas) return;
			width = canvas.width = window.innerWidth;
			height = canvas.height = window.innerHeight;
		};
		window.addEventListener('resize', handleResize);

		// Mouse tracking for interactive glow
		const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
		const handleMouseMove = (e: MouseEvent) => {
			mouse.targetX = e.clientX;
			mouse.targetY = e.clientY;
		};
		window.addEventListener('mousemove', handleMouseMove);

		// Create subtle floating ambient particles
		const particleCount = Math.min(Math.floor((width * height) / 18000), 55);
		const colors = ['#38bdf8', '#6366f1', '#06b6d4', '#3b82f6'];
		const particles: Particle[] = [];

		for (let i = 0; i < particleCount; i++) {
			particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				vx: (Math.random() - 0.5) * 0.35,
				vy: (Math.random() - 0.5) * 0.35,
				size: Math.random() * 2 + 1,
				baseAlpha: Math.random() * 0.3 + 0.1,
				alpha: Math.random() * 0.3 + 0.1,
				color: colors[Math.floor(Math.random() * colors.length)]
			});
		}

		// Animation loop
		const render = () => {
			// Smooth mouse interpolation
			mouse.x += (mouse.targetX - mouse.x) * 0.08;
			mouse.y += (mouse.targetY - mouse.y) * 0.08;

			ctx.clearRect(0, 0, width, height);

			// Draw subtle cursor spotlight if on screen
			if (mouse.x > -500) {
				const spotlight = ctx.createRadialGradient(
					mouse.x,
					mouse.y,
					0,
					mouse.x,
					mouse.y,
					420
				);
				spotlight.addColorStop(0, 'rgba(56, 189, 248, 0.07)');
				spotlight.addColorStop(0.5, 'rgba(99, 102, 241, 0.03)');
				spotlight.addColorStop(1, 'transparent');
				ctx.fillStyle = spotlight;
				ctx.fillRect(0, 0, width, height);
			}

			// Update and draw particles
			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];
				p.x += p.vx;
				p.y += p.vy;

				if (p.x < 0) p.x = width;
				else if (p.x > width) p.x = 0;
				if (p.y < 0) p.y = height;
				else if (p.y > height) p.y = 0;

				// Distance to mouse for subtle proximity glow
				const dx = mouse.x - p.x;
				const dy = mouse.y - p.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < 180) {
					p.alpha = p.baseAlpha + (1 - dist / 180) * 0.4;
				} else {
					p.alpha += (p.baseAlpha - p.alpha) * 0.05;
				}

				ctx.beginPath();
				ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
				ctx.fillStyle = p.color;
				ctx.globalAlpha = p.alpha;
				ctx.fill();
				ctx.globalAlpha = 1;
			}

			// Draw subtle connection lines between close particles
			for (let i = 0; i < particles.length; i++) {
				for (let j = i + 1; j < particles.length; j++) {
					const p1 = particles[i];
					const p2 = particles[j];
					const dx = p1.x - p2.x;
					const dy = p1.y - p2.y;
					const dist = Math.sqrt(dx * dx + dy * dy);

					if (dist < 110) {
						ctx.beginPath();
						ctx.moveTo(p1.x, p1.y);
						ctx.lineTo(p2.x, p2.y);
						ctx.strokeStyle = '#38bdf8';
						ctx.globalAlpha = (1 - dist / 110) * 0.08;
						ctx.lineWidth = 0.75;
						ctx.stroke();
						ctx.globalAlpha = 1;
					}
				}
			}

			animationFrameId = requestAnimationFrame(render);
		};

		render();

		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mousemove', handleMouseMove);
			cancelAnimationFrame(animationFrameId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
			style={{ background: 'transparent' }}
		/>
	);
}
