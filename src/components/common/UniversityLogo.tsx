'use client';

import React from 'react';

export type InstitutionKey =
	| 'technion'
	| 'tau'
	| 'huji'
	| 'bgu'
	| 'bar_ilan'
	| 'haifa'
	| 'ariel'
	| 'reichman';

export interface UniversityMeta {
	key: InstitutionKey;
	code: string; // e.g. 'IIT', 'TAU', etc.
	shortName: string;
	fullName: string;
	gradient: string;
	borderClass: string;
	bgClass: string;
	textColor: string;
	primaryColor: string;
	secondaryColor: string;
}

export const UNIVERSITIES_META: Record<InstitutionKey, UniversityMeta> = {
	technion: {
		key: 'technion',
		code: 'IIT',
		shortName: 'הטכניון',
		fullName: 'הטכניון - מכון טכנולוגי לישראל',
		gradient: 'from-blue-700 via-teal-700 to-emerald-600',
		borderClass: 'border-teal-500/40',
		bgClass: 'bg-teal-950/40',
		textColor: 'text-teal-300',
		primaryColor: '#0f766e',
		secondaryColor: '#14b8a6'
	},
	tau: {
		key: 'tau',
		code: 'TAU',
		shortName: 'תל אביב',
		fullName: 'אוניברסיטת תל אביב',
		gradient: 'from-indigo-600 via-purple-600 to-indigo-800',
		borderClass: 'border-indigo-500/40',
		bgClass: 'bg-indigo-950/40',
		textColor: 'text-indigo-300',
		primaryColor: '#4f46e5',
		secondaryColor: '#818cf8'
	},
	huji: {
		key: 'huji',
		code: 'HUJI',
		shortName: 'העברית',
		fullName: 'האוניברסיטה העברית בירושלים',
		gradient: 'from-amber-600 via-orange-600 to-amber-700',
		borderClass: 'border-amber-500/40',
		bgClass: 'bg-amber-950/40',
		textColor: 'text-amber-300',
		primaryColor: '#d97706',
		secondaryColor: '#fbbf24'
	},
	bgu: {
		key: 'bgu',
		code: 'BGU',
		shortName: 'בן-גוריון',
		fullName: 'אוניברסיטת בן-גוריון בנגב',
		gradient: 'from-orange-500 via-amber-500 to-cyan-600',
		borderClass: 'border-cyan-500/40',
		bgClass: 'bg-cyan-950/40',
		textColor: 'text-cyan-300',
		primaryColor: '#0891b2',
		secondaryColor: '#f97316'
	},
	bar_ilan: {
		key: 'bar_ilan',
		code: 'BIU',
		shortName: 'בר-אילן',
		fullName: 'אוניברסיטת בר-אילן',
		gradient: 'from-blue-800 via-indigo-700 to-yellow-500',
		borderClass: 'border-yellow-500/40',
		bgClass: 'bg-blue-950/40',
		textColor: 'text-yellow-300',
		primaryColor: '#1e40af',
		secondaryColor: '#eab308'
	},
	haifa: {
		key: 'haifa',
		code: 'UOH',
		shortName: 'חיפה',
		fullName: 'אוניברסיטת חיפה',
		gradient: 'from-sky-500 via-blue-600 to-indigo-600',
		borderClass: 'border-sky-500/40',
		bgClass: 'bg-sky-950/40',
		textColor: 'text-sky-300',
		primaryColor: '#0284c7',
		secondaryColor: '#38bdf8'
	},
	ariel: {
		key: 'ariel',
		code: 'AU',
		shortName: 'אריאל',
		fullName: 'אוניברסיטת אריאל בשומרון',
		gradient: 'from-emerald-600 via-teal-600 to-green-700',
		borderClass: 'border-emerald-500/40',
		bgClass: 'bg-emerald-950/40',
		textColor: 'text-emerald-300',
		primaryColor: '#059669',
		secondaryColor: '#34d399'
	},
	reichman: {
		key: 'reichman',
		code: 'RUNI',
		shortName: 'רייכמן',
		fullName: 'אוניברסיטת רייכמן',
		gradient: 'from-slate-900 via-blue-800 to-indigo-700',
		borderClass: 'border-blue-500/40',
		bgClass: 'bg-slate-900/60',
		textColor: 'text-blue-300',
		primaryColor: '#1d4ed8',
		secondaryColor: '#60a5fa'
	}
};

export function resolveInstitutionKey(raw: string | undefined | null): InstitutionKey {
	if (!raw) return 'tau';
	const s = raw.toLowerCase().trim();

	if (s.includes('technion') || s.includes('48') || s.includes('iit') || s.includes('טכניון')) {
		return 'technion';
	}
	if (s.includes('tau') || s.includes('inst-6') || s.includes('תל אביב') || s.includes('תל-אביב')) {
		return 'tau';
	}
	if (s.includes('huji') || s.includes('inst-1') || s.includes('עברית')) {
		return 'huji';
	}
	if (s.includes('bgu') || s.includes('inst-3') || s.includes('בן גוריון') || s.includes('בן-גוריון')) {
		return 'bgu';
	}
	if (s.includes('bar_ilan') || s.includes('biu') || s.includes('inst-4') || s.includes('בר אילן') || s.includes('בר-אילן')) {
		return 'bar_ilan';
	}
	if (s.includes('haifa') || s.includes('uoh') || s.includes('inst-5') || s.includes('חיפה')) {
		return 'haifa';
	}
	if (s.includes('ariel') || s.includes('au') || s.includes('inst-2') || s.includes('אריאל')) {
		return 'ariel';
	}
	if (s.includes('reichman') || s.includes('runi') || s.includes('38') || s.includes('רייכמן') || s.includes('בינתחומי')) {
		return 'reichman';
	}

	return 'tau';
}

interface UniversityLogoProps {
	institution: string; // can be institutionId, code, or name
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	shape?: 'rounded' | 'circle' | 'square';
	showName?: boolean;
	showBadge?: boolean;
	className?: string;
}

export default function UniversityLogo({
	institution,
	size = 'md',
	shape = 'rounded',
	showName = false,
	showBadge = false,
	className = ''
}: UniversityLogoProps) {
	const key = resolveInstitutionKey(institution);
	const meta = UNIVERSITIES_META[key];

	const sizeMap = {
		xs: { px: 20, text: 'text-[9px]', nameText: 'text-xs' },
		sm: { px: 26, text: 'text-[10px]', nameText: 'text-xs font-bold' },
		md: { px: 34, text: 'text-[11px]', nameText: 'text-sm font-bold' },
		lg: { px: 44, text: 'text-xs', nameText: 'text-base font-black' },
		xl: { px: 56, text: 'text-sm', nameText: 'text-lg font-black' }
	};

	const shapeClass =
		shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-lg' : 'rounded-xl';

	const currentSize = sizeMap[size];

	// University SVG Vector Mark
	const renderEmblem = () => {
		switch (key) {
			case 'technion':
				return (
					<svg
						viewBox="0 0 48 48"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="w-full h-full p-1"
					>
						{/* Technion Menorah/Gear Science Flame */}
						<circle cx="24" cy="24" r="21" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="3 2" opacity="0.8" />
						<path
							d="M24 8 C26 14, 32 18, 30 25 C29 29, 26 31, 24 31 C22 31, 19 29, 18 25 C16 18, 22 14, 24 8 Z"
							fill="url(#technionFlame)"
						/>
						<path
							d="M17 21 C15 25, 14 30, 24 38 C34 30, 33 25, 31 21"
							stroke="#99f6e4"
							strokeWidth="2.2"
							strokeLinecap="round"
						/>
						<path d="M24 31 L24 40 M19 40 L29 40" stroke="#f0fdfa" strokeWidth="2.5" strokeLinecap="round" />
						<defs>
							<linearGradient id="technionFlame" x1="24" y1="8" x2="24" y2="31" gradientUnits="userSpaceOnUse">
								<stop stopColor="#5eead4" />
								<stop offset="1" stopColor="#0d9488" />
							</linearGradient>
						</defs>
					</svg>
				);

			case 'tau':
				return (
					<svg
						viewBox="0 0 48 48"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="w-full h-full p-1"
					>
						{/* Tel Aviv University Iconic Double Tree/Arch Seal */}
						<circle cx="24" cy="24" r="21" stroke="#818cf8" strokeWidth="2" opacity="0.6" />
						<circle cx="24" cy="15" r="5" fill="#a5b4fc" />
						<path
							d="M14 36 C14 26, 20 22, 24 22 C28 22, 34 26, 34 36"
							stroke="#c7d2fe"
							strokeWidth="3"
							strokeLinecap="round"
						/>
						<path
							d="M18 36 C18 28, 21 26, 24 26 C27 26, 30 28, 30 36"
							stroke="#e0e7ff"
							strokeWidth="2"
							strokeLinecap="round"
						/>
						<path d="M24 22 L24 37" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
					</svg>
				);

			case 'huji':
				return (
					<svg
						viewBox="0 0 48 48"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="w-full h-full p-1"
					>
						{/* Hebrew University Torch & Crown of Scopus */}
						<circle cx="24" cy="24" r="21" stroke="#f59e0b" strokeWidth="2" opacity="0.7" />
						<path
							d="M24 7 L28 17 L24 22 L20 17 Z"
							fill="#fde68a"
						/>
						<path
							d="M17 19 C19 14, 29 14, 31 19 C31 23, 27 25, 24 26 C21 25, 17 23, 17 19 Z"
							fill="#f59e0b"
							opacity="0.9"
						/>
						<path d="M22 25 L26 25 L25 38 L23 38 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
						<path d="M16 38 L32 38" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
					</svg>
				);

			case 'bgu':
				return (
					<svg
						viewBox="0 0 48 48"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="w-full h-full p-1"
					>
						{/* Ben-Gurion Desert Sun & Torch Flame */}
						<circle cx="24" cy="24" r="21" stroke="#06b6d4" strokeWidth="2" opacity="0.7" />
						<path
							d="M24 9 C28 15, 33 21, 30 28 C28 32, 21 33, 18 29 C15 25, 18 19, 24 9 Z"
							fill="url(#bguGradient)"
						/>
						<path
							d="M13 36 C17 33, 24 33, 28 35 C31 36, 34 35, 35 34"
							stroke="#38bdf8"
							strokeWidth="2.5"
							strokeLinecap="round"
						/>
						<defs>
							<linearGradient id="bguGradient" x1="16" y1="9" x2="32" y2="33" gradientUnits="userSpaceOnUse">
								<stop stopColor="#fb923c" />
								<stop offset="0.5" stopColor="#f59e0b" />
								<stop offset="1" stopColor="#06b6d4" />
							</linearGradient>
						</defs>
					</svg>
				);

			case 'bar_ilan':
				return (
					<svg
						viewBox="0 0 48 48"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="w-full h-full p-1"
					>
						{/* Bar-Ilan Intertwined Science Helix & Book */}
						<circle cx="24" cy="24" r="21" stroke="#eab308" strokeWidth="2" opacity="0.6" />
						{/* Open Book */}
						<path
							d="M13 31 C17 28, 22 29, 24 31 C26 29, 31 28, 35 31 L35 36 C31 33, 26 34, 24 36 C22 34, 17 33, 13 36 Z"
							fill="#fef08a"
						/>
						{/* Science helix / arch */}
						<path
							d="M16 16 Q24 24 32 16 M16 22 Q24 14 32 22"
							stroke="#60a5fa"
							strokeWidth="2.5"
							strokeLinecap="round"
						/>
					</svg>
				);

			case 'haifa':
				return (
					<svg
						viewBox="0 0 48 48"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="w-full h-full p-1"
					>
						{/* Haifa Carmel Mountain & Mediterranean Waves */}
						<circle cx="24" cy="24" r="21" stroke="#38bdf8" strokeWidth="2" opacity="0.7" />
						{/* Mountain */}
						<path d="M12 32 L20 18 L26 26 L30 20 L36 32 Z" fill="#0284c7" opacity="0.8" />
						{/* Lighthouse tower beam */}
						<path d="M23 13 L25 13 L26 22 L22 22 Z" fill="#e0f2fe" />
						<circle cx="24" cy="11" r="3" fill="#facc15" />
						{/* Sea waves */}
						<path
							d="M12 36 C16 34, 20 37, 24 35 C28 33, 32 36, 36 35"
							stroke="#7dd3fc"
							strokeWidth="2.2"
							strokeLinecap="round"
						/>
					</svg>
				);

			case 'ariel':
				return (
					<svg
						viewBox="0 0 48 48"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="w-full h-full p-1"
					>
						{/* Ariel University Hills & Sunburst */}
						<circle cx="24" cy="24" r="21" stroke="#10b981" strokeWidth="2" opacity="0.7" />
						<circle cx="24" cy="18" r="6" fill="#fef08a" />
						<path
							d="M11 34 C16 28, 22 26, 26 29 C30 26, 34 27, 37 34 Z"
							fill="#059669"
						/>
						<path
							d="M15 36 C20 32, 28 32, 33 36"
							stroke="#a7f3d0"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
				);

			case 'reichman':
				return (
					<svg
						viewBox="0 0 48 48"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="w-full h-full p-1"
					>
						{/* Reichman Heraldic Shield & Winged Torch */}
						<circle cx="24" cy="24" r="21" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
						<path
							d="M24 10 L34 15 L34 26 C34 33, 24 38, 24 38 C24 38, 14 33, 14 26 L14 15 Z"
							fill="#1e3a8a"
							stroke="#60a5fa"
							strokeWidth="1.8"
						/>
						<path d="M24 16 L27 22 L24 25 L21 22 Z" fill="#93c5fd" />
						<path d="M24 25 L24 32" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
					</svg>
				);

			default:
				return (
					<div className="flex items-center justify-center font-black text-white text-[10px]">
						{meta.code}
					</div>
				);
		}
	};

	return (
		<div className={`inline-flex items-center gap-2 ${className}`}>
			<div
				style={{ width: currentSize.px, height: currentSize.px }}
				className={`${shapeClass} bg-gradient-to-br ${meta.gradient} border ${meta.borderClass} shadow-md shadow-slate-950/40 flex items-center justify-center shrink-0 relative overflow-hidden group-hover:scale-105 transition`}
				title={meta.fullName}
			>
				{renderEmblem()}
			</div>

			{showName && (
				<span className={`${currentSize.nameText} text-slate-200 leading-tight`}>
					{meta.shortName}
				</span>
			)}

			{showBadge && (
				<span
					className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${meta.borderClass} ${meta.bgClass} ${meta.textColor} shrink-0`}
				>
					{meta.code}
				</span>
			)}
		</div>
	);
}
