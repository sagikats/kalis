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
			className={`relative rounded-3xl bg-white border border-[#E7E2D8] hover:border-[#D5CFC2] transition-all duration-300 overflow-hidden group shadow-[0_4px_24px_-4px_rgba(40,30,20,0.04)] hover:shadow-[0_16px_40px_-6px_rgba(40,30,20,0.08)] ${className}`}
		>
			{/* Very subtle warm ambient hover spotlight */}
			<div
				className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style={{
					background: mousePos.isHovered
						? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(230, 220, 205, 0.35), transparent 70%)`
						: 'transparent'
				}}
			/>

			{/* Card content */}
			<div className="relative z-10">{children}</div>
		</div>
	);
}
