'use client';

import React from 'react';

interface MitkablimLogoProps {
     className?: string;
     size?: 'sm' | 'md' | 'lg';
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
     const iconHeight = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
     const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
     const taglineSize = size === 'sm' ? 'text-[8.5px]' : size === 'lg' ? 'text-[11px]' : 'text-[9.5px]';

     const textColor = variant === 'light' ? 'text-white' : 'text-[#222222]';
     const taglineColor = variant === 'light' ? 'text-slate-300' : 'text-[#66635C]';
     const pillarColor = variant === 'light' ? '#E2E8F0' : '#222222';

     return (
          <div className={`flex items-center gap-2.5 select-none ${className}`} dir="rtl">
               {/* SVG LOGO MARK: Iconic 'M' Monogram with Upward Admission Arrow */}
               <svg
                    height={iconHeight}
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0"
               >
                    <defs>
                         {/* Modern Blue to Teal Cyan Gradient */}
                         <linearGradient id="mitkablimArrowGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#0284c7" />
                              <stop offset="60%" stopColor="#0ea5e9" />
                              <stop offset="100%" stopColor="#06b6d4" />
                         </linearGradient>
                    </defs>

                    {/* Left Pillar of M */}
                    <rect
                         x="12"
                         y="24"
                         width="15"
                         height="62"
                         rx="7"
                         fill={pillarColor}
                    />

                    {/* Center Chevron Left Slope */}
                    <path
                         d="M 27 34 L 46 64 C 48 67 52 67 54 64 L 62 51 L 44 26 C 41 22 35 22 32 25 L 27 30 Z"
                         fill={pillarColor}
                    />

                    {/* Ascending Right Arrow Arm of M (Rising into Admission) */}
                    <g>
                         {/* Main Diagonal Launch Bar */}
                         <path
                              d="M 48 60 L 78 19 C 80 16 84 17 85 20 L 87 26 C 88 29 87 33 84 37 L 59 73 C 56 77 50 76 48 72 Z"
                              fill="url(#mitkablimArrowGradient)"
                         />
                         {/* Arrow Tip / Flag */}
                         <path
                              d="M 68 14 L 88 14 C 90.5 14 92 15.5 92 18 L 92 38 L 84 30 L 84 22 L 76 22 Z"
                              fill="url(#mitkablimArrowGradient)"
                         />
                         {/* Cyan Accent Target Dot */}
                         <circle cx="88" cy="18" r="5" fill="#00d8f6" />
                    </g>
               </svg>

               {/* BRAND TYPOGRAPHY: מתקבלים */}
               <div className="flex flex-col text-right justify-center">
                    <div className={`font-extrabold tracking-tight leading-none ${titleSize} ${textColor} flex items-baseline gap-0.5`}>
                         <span>מתקבלים</span>
                         <span className="text-cyan-500 font-black text-2xl leading-none">.</span>
                    </div>
                    {showTagline && (
                         <div className={`font-semibold tracking-normal ${taglineSize} ${taglineColor} mt-0.5`}>
                              מנוע קבלה אקדמי
                         </div>
                    )}
               </div>
          </div>
     );
}

// Named alias for clean modern imports
export { KalisLogo as MitkablimLogo };
