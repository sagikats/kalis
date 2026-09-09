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
	logoUrl: string;
	primaryColor: string;
	secondaryColor: string;
}

export const UNIVERSITIES_META: Record<InstitutionKey, UniversityMeta> = {
	technion: {
		key: 'technion',
		code: 'IIT',
		shortName: 'הטכניון',
		fullName: 'הטכניון - מכון טכנולוגי לישראל',
		logoUrl: '/logos/technion.svg',
		primaryColor: '#002D62',
		secondaryColor: '#0F766E'
	},
	tau: {
		key: 'tau',
		code: 'TAU',
		shortName: 'תל אביב',
		fullName: 'אוניברסיטת תל אביב',
		logoUrl: '/logos/tau.svg',
		primaryColor: '#111111',
		secondaryColor: '#4F46E5'
	},
	huji: {
		key: 'huji',
		code: 'HUJI',
		shortName: 'העברית',
		fullName: 'האוניברסיטה העברית בירושלים',
		logoUrl: '/logos/huji.svg',
		primaryColor: '#83111F',
		secondaryColor: '#D97706'
	},
	bgu: {
		key: 'bgu',
		code: 'BGU',
		shortName: 'בן-גוריון',
		fullName: 'אוניברסיטת בן-גוריון בנגב',
		logoUrl: '/logos/bgu.svg',
		primaryColor: '#F7941E',
		secondaryColor: '#0891B2'
	},
	bar_ilan: {
		key: 'bar_ilan',
		code: 'BIU',
		shortName: 'בר-אילן',
		fullName: 'אוניברסיטת בר-אילן',
		logoUrl: '/logos/bar_ilan.svg',
		primaryColor: '#1E40AF',
		secondaryColor: '#D27228'
	},
	haifa: {
		key: 'haifa',
		code: 'UOH',
		shortName: 'חיפה',
		fullName: 'אוניברסיטת חיפה',
		logoUrl: '/logos/haifa.svg',
		primaryColor: '#0284C7',
		secondaryColor: '#0369A1'
	},
	ariel: {
		key: 'ariel',
		code: 'AU',
		shortName: 'אריאל',
		fullName: 'אוניברסיטת אריאל בשומרון',
		logoUrl: '/logos/ariel.svg',
		primaryColor: '#008542',
		secondaryColor: '#00ABB7'
	},
	reichman: {
		key: 'reichman',
		code: 'RUNI',
		shortName: 'רייכמן',
		fullName: 'אוניברסיטת רייכמן',
		logoUrl: '/logos/reichman.svg',
		primaryColor: '#0F2D96',
		secondaryColor: '#1D4ED8'
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
	if (s.includes('huji') || s.includes('inst-1') || s.includes('עברית') || s.includes('ירושלים')) {
		return 'huji';
	}
	if (s.includes('bgu') || s.includes('inst-3') || s.includes('בן גוריון') || s.includes('בן-גוריון') || s.includes('נגב')) {
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
	if (s.includes('reichman') || s.includes('runi') || s.includes('38') || s.includes('inst-38') || s.includes('רייכמן') || s.includes('בינתחומי')) {
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
		xs: { px: 22, pad: 'p-0.5', text: 'text-[9px]', nameText: 'text-xs' },
		sm: { px: 28, pad: 'p-1', text: 'text-[10px]', nameText: 'text-xs font-bold' },
		md: { px: 36, pad: 'p-1.5', text: 'text-[11px]', nameText: 'text-sm font-bold' },
		lg: { px: 46, pad: 'p-2', text: 'text-xs', nameText: 'text-base font-black' },
		xl: { px: 58, pad: 'p-2.5', text: 'text-sm', nameText: 'text-lg font-black' }
	};

	const shapeClass =
		shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-lg' : 'rounded-xl';

	const currentSize = sizeMap[size];

	return (
		<div className={`inline-flex items-center gap-2 ${className}`}>
			<div
				style={{ width: currentSize.px, height: currentSize.px }}
				className={`${shapeClass} ${currentSize.pad} bg-white border border-[#E5DFD4] shadow-xs flex items-center justify-center shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-200`}
				title={meta.fullName}
			>
				{/* Official authentic vector emblem */}
				<img
					src={meta.logoUrl}
					alt={meta.fullName}
					className="w-full h-full object-contain pointer-events-none select-none"
					loading="lazy"
				/>
			</div>

			{showName && (
				<span className={`${currentSize.nameText} text-[#222222] leading-tight`}>
					{meta.shortName}
				</span>
			)}

			{showBadge && (
				<span
					className="text-[9px] font-black px-1.5 py-0.5 rounded border border-[#E5DFD4] bg-[#FAF8F5] text-[#55524B] shrink-0"
				>
					{meta.code}
				</span>
			)}
		</div>
	);
}
