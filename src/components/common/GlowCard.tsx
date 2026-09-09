'use client';

import React, { useRef, useState } from 'react';

interface GlowCardProps {
	children: React.ReactNode;
	className?: string;
	glowColor?: 'blue' | 'cyan' | 'indigo' | 'emerald';
}

export default function GlowCard({
	children,
	className = '',
	glowColor = 'blue'
}: GlowCardProps) {
	const cardRef = useRef<HTMLDivElement | null>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0, isHovered: false });

	const colorMap = {
		blue: {
			spotlight: 'rgba(59, 130, 246, 0.12)',
			border: 'rgba(96, 165, 250, 0.35)',
			accent: '#3b82f6'
		},
		cyan: {
			spotlight: 'rgba(6, 182, 212, 0.12)',
			border: 'rgba(34, 211, 238, 0.35)',
			accent: '#06b6d4'
		},
		indigo: {
			spotlight: 'rgba(99, 102, 241, 0.12)',
			border: 'rgba(129, 140, 248, 0.35)',
			accent: '#6366f1'
		},
		emerald: {
			spotlight: 'rgba(16, 185, 129, 0.12)',
			border: 'rgba(52, 211, 153, 0.35)',
			accent: '#10b981'
		}
	};

	const currentTheme = colorMap[glowColor] || colorMap.blue;

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!cardRef.current) return;
		const rect = cardRef.current.getBoundingClientRect();
		setMousePos({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
			isHovered: true
		});
	};

	const handleMouseLeave = () => {
		setMousePos((prev) => ({ ...prev, isHovered: false }));
	};

	return (
		<div
			ref={cardRef}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			className={`relative rounded-3xl bg-[#0c0e14]/80 backdrop-blur-xl border border-white/[0.08] transition-all duration-300 overflow-hidden group ${className}`}
			style={{
				boxShadow: mousePos.isHovered
					? `0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 35px -10px ${currentTheme.spotlight}`
					: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
			}}
		>
			{/* Cursor-following spotlight layer */}
			<div
				className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style={{
					background: mousePos.isHovered
						? `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, ${currentTheme.spotlight}, transparent 70%)`
						: 'transparent'
				}}
			/>

			{/* Luminous dynamic border highlight */}
			<div
				className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style={{
					background: mousePos.isHovered
						? `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, ${currentTheme.border}, transparent 60%)`
						: 'transparent',
					mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
					maskComposite: 'exclude',
					WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
					WebkitMaskComposite: 'xor',
					padding: '1px'
				}}
			/>

			{/* Card content */}
			<div className="relative z-10">{children}</div>
		</div>
	);
}
