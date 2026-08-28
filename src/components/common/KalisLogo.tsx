'use client';

import React from 'react';

interface KalisLogoProps {
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
}: KalisLogoProps) {
     // Size dimensions
     const iconHeight = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
     const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
     const taglineSize = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-[11px]' : 'text-[9.5px]';

     const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
     const taglineColor = variant === 'light' ? 'text-slate-300' : 'text-slate-500';
     const pillarColor = variant === 'light' ? '#334155' : '#1e293b';

     return (
          <div className={`flex items-center gap-3 select-none ${className}`} dir="ltr">
               {/* SVG LOGO MARK */}
               <svg
                    height={iconHeight}
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0"
               >
                    <defs>
                         {/* Electric Blue to Cyan Gradient */}
                         <linearGradient id="kalisArrowGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#0284c7" />
                              <stop offset="50%" stopColor="#38bdf8" />
                              <stop offset="100%" stopColor="#06b6d4" />
                         </linearGradient>
                    </defs>

                    {/* Vertical Left Bar of K */}
                    <rect
                         x="12"
                         y="15"
                         width="16"
                         height="70"
                         rx="8"
                         fill={pillarColor}
                    />

                    {/* Lower Leg of K */}
                    <path
                         d="M 28 50 L 68 83 C 71 85.5 76 83.5 76 79 L 76 70 C 76 67.5 74.5 65.5 72.5 64 L 38 38 Z"
                         fill={pillarColor}
                    />

                    {/* Upper Arrow Arm of K with Gradient & Arrowhead */}
                    <g>
                         {/* Main Diagonal Bar */}
                         <path
                              d="M 26 50 L 62 18 C 64 16 67 16 69 18 C 71 20 71 23 69 25 L 36 54 Z"
                              fill="url(#kalisArrowGradient)"
                         />
                         {/* Arrow Tip */}
                         <path
                              d="M 52 14 L 75 14 C 77.5 14 79 15.5 79 18 L 79 41 L 69 31 L 69 24 L 62 24 Z"
                              fill="url(#kalisArrowGradient)"
                         />
                         {/* Cyan Arrow Point Accent */}
                         <circle cx="74" cy="19" r="6" fill="#00d8f6" />
                    </g>
               </svg>

               {/* TEXT BRANDING */}
               <div className="flex flex-col">
                    <div className={`font-black tracking-tight leading-none ${titleSize} ${textColor} flex items-baseline`}>
                         <span>kalis</span>
                         <span className="text-cyan-500 font-extrabold text-2xl leading-none">.</span>
                    </div>
                    {showTagline && (
                         <div className={`font-extrabold tracking-[0.18em] uppercase ${taglineSize} ${taglineColor} mt-0.5`}>
                              YOUR POTENTIAL. OUR GUIDANCE.
                         </div>
                    )}
               </div>
          </div>
     );
}
