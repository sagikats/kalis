'use client';

import React from 'react';

interface MitkablimLogoProps {
     className?: string;
     size?: 'inline' | 'sm' | 'md' | 'lg';
     variant?: 'dark' | 'light';
     showTagline?: boolean;
}

export default function KalisLogo({
     className = '',
     size = 'md',
     variant = 'dark',
     showTagline = true
}: MitkablimLogoProps) {
     // Size dimensions
     const iconHeight = size === 'inline' ? 25 : size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
     const titleSize = size === 'inline' ? 'text-xl sm:text-2xl' : size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
     const taglineSize = size === 'inline' ? 'text-[8.5px]' : size === 'sm' ? 'text-[8.5px]' : size === 'lg' ? 'text-[11px]' : 'text-[9.5px]';
     const gapClass = size === 'inline' ? 'gap-1.5' : 'gap-2.5';
     const dotSize = size === 'inline' ? 'text-2xl sm:text-3xl' : size === 'sm' ? 'text-xl' : 'text-2xl';

     const textColor = variant === 'light' ? 'text-white' : 'text-[#222222]';
     const taglineColor = variant === 'light' ? 'text-slate-300' : 'text-[#66635C]';

     const isInline = size === 'inline';
     const Container = isInline ? 'span' : 'div';

     return (
          <Container className={`${isInline ? 'inline-flex' : 'flex'} items-center ${gapClass} select-none ${className}`} dir="rtl">
               {/* SVG LOGO MARK: Iconic Academic Graduation Cap (Mortarboard) */}
               <svg
                    height={iconHeight}
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0"
               >
                    <defs>
                         {/* Signature Cyan Academic Tassel Gradient */}
                         <linearGradient id={`mitkablimTassel-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor={variant === 'light' ? '#38bdf8' : '#0284c7'} />
                              <stop offset="100%" stopColor="#06b6d4" />
                         </linearGradient>
                    </defs>

                    {/* Skullcap / Headpiece under the mortarboard */}
                    <path
                         d="M 13 22.5 V 30 C 13 36 18 39.5 24 39.5 C 30 39.5 35 36 35 30 V 22.5 C 31.5 25.5 27.5 27 24 27 C 20.5 27 16.5 25.5 13 22.5 Z"
                         fill={variant === 'light' ? '#cbd5e1' : '#18181b'}
                    />

                    {/* Mortarboard 3D Rim / Underside Depth */}
                    <path
                         d="M 4 19 L 24 29 L 44 19 L 44 21.5 L 24 31.5 L 4 21.5 Z"
                         fill={variant === 'light' ? '#94a3b8' : '#141416'}
                    />

                    {/* Mortarboard Top Diamond Plate */}
                    <path
                         d="M 24 7 L 44 17 L 24 27 L 4 17 Z"
                         fill={variant === 'light' ? '#F8FAFC' : '#27272a'}
                    />

                    {/* Silk Ribbon Cord draping gracefully to the side */}
                    <path
                         d="M 24 17 C 33 17 40 21 40 26 V 35"
                         stroke={`url(#mitkablimTassel-${variant})`}
                         strokeWidth="2.4"
                         strokeLinecap="round"
                    />

                    {/* Academic Tassel Brush / Fringe */}
                    <path
                         d="M 37.5 35 H 42.5 L 43.5 42 C 43.5 42.5 43 43 42 43 H 38 C 37 43 36.5 42.5 36.5 42 L 37.5 35 Z"
                         fill={`url(#mitkablimTassel-${variant})`}
                    />

                    {/* Center Academic Stud (Matches Brand Cyan Dot) */}
                    <circle cx="24" cy="17" r="2.4" fill="#00d8f6" />
               </svg>

               {/* BRAND TYPOGRAPHY: מתקבלים */}
               <Container className={`${isInline ? 'inline-flex' : 'flex'} flex-col text-right justify-center`}>
                    <Container className={`font-extrabold tracking-tight leading-none ${titleSize} ${textColor} ${isInline ? 'inline-flex' : 'flex'} items-baseline gap-0.5`}>
                         <span>מתקבלים</span>
                         <span className={`text-cyan-500 font-black ${dotSize} leading-none`}>.</span>
                    </Container>
                    {showTagline && (
                         <Container className={`font-semibold tracking-normal ${taglineSize} ${taglineColor} mt-0.5`}>
                              לא רק מחשבון
                         </Container>
                    )}
               </Container>
          </Container>
     );
}

// Named alias for clean modern imports
export { KalisLogo as MitkablimLogo };
