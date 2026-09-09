'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
     Compass,
     Sparkles,
     Sliders,
     Bell,
     User,
     ChevronDown,
     RefreshCw,
     X,
     AlertTriangle,
     Calculator,
     LogOut,
     LogIn,
     UserPlus
} from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';
import { useAuth } from '../../context/AuthContext';
import KalisLogo from '../common/KalisLogo';

export default function Navbar() {
     const pathname = usePathname();
     const { recalculationPending, recalculationReason, recalculateRoute } = usePlanner();
     const { user, isAuthenticated, logout, openAuthModal } = useAuth();
     const [showNotifications, setShowNotifications] = useState(false);
     const [showProfileMenu, setShowProfileMenu] = useState(false);

     const getInitials = (name?: string) => {
          if (!name) return 'מו';
          const parts = name.trim().split(/\s+/);
          if (parts.length === 1) return parts[0].slice(0, 2);
          return `${parts[0][0]}${parts[parts.length - 1][0]}`;
     };

     const navLinks = [
          { href: '/', label: 'דף הבית', icon: Compass },
          { href: '/flow', label: 'בדיקת קבלה ופערים', icon: Sliders },
          { href: '/calculators', label: 'מחשבון סכם', icon: Calculator },
     ];

     return (
          <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#06070a]/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.8)] transition-all">
               <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* Left/Right swapped for RTL: Right Action Icons (Notifications & Profile) appear on the RIGHT in RTL */}
                    <div className="flex items-center gap-3">

                         {/* User Profile Menu or Login/Register Buttons */}
                         {isAuthenticated && user ? (
                              <div className="relative">
                                   <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="flex items-center gap-2 p-1.5 pr-2.5 text-xs font-bold text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] rounded-full transition-colors border border-white/10 cursor-pointer"
                                   >
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-xs shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                                             {getInitials(user.name)}
                                        </div>
                                        <span className="hidden sm:inline font-bold text-slate-100">{user.name}</span>
                                        {user.candidateNumber && (
                                             <span className="hidden md:inline font-mono text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded-full">
                                                  {user.candidateNumber}
                                             </span>
                                        )}
                                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                   </button>

                                   {/* Profile Dropdown */}
                                   {showProfileMenu && (
                                        <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#0c0e14]/95 p-3 shadow-2xl border border-white/10 backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                                             <div className="p-2 border-b border-white/[0.08] mb-2">
                                                  <div className="flex items-center justify-between">
                                                       <p className="font-bold text-sm text-white">{user.name}</p>
                                                       {user.candidateNumber && (
                                                            <span className="font-mono text-xs font-extrabold text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-md">
                                                                 {user.candidateNumber}
                                                            </span>
                                                       )}
                                                  </div>
                                                  <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                                                  {user.savedTracksCount !== undefined && (
                                                       <div className="mt-2 flex items-center gap-1.5 text-[11px] text-cyan-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                                            <span>{user.savedTracksCount} מסלולים שמורים במערכת</span>
                                                       </div>
                                                  )}
                                             </div>

                                             <button
                                                  onClick={() => {
                                                       setShowProfileMenu(false);
                                                       logout();
                                                  }}
                                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                             >
                                                  <LogOut className="h-4 w-4" />
                                                  <span>התנתק מהחשבון</span>
                                             </button>
                                        </div>
                                   )}
                              </div>
                         ) : (
                              <div className="flex items-center gap-1.5">
                                   <button
                                        onClick={() => openAuthModal('login')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-full transition-all cursor-pointer"
                                   >
                                        <LogIn className="h-3.5 w-3.5 text-slate-400" />
                                        <span>התחברות</span>
                                   </button>
                                   <button
                                        onClick={() => openAuthModal('register')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-full transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                                   >
                                        <UserPlus className="h-3.5 w-3.5" />
                                        <span>הרשמה חינם</span>
                                   </button>
                              </div>
                         )}

                         {/* Notifications Popover */}
                         <div className="relative">
                              <button
                                   onClick={() => setShowNotifications(!showNotifications)}
                                   className="relative p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors border border-transparent hover:border-white/10"
                                   title="התראות מערכת"
                              >
                                   <Bell className="h-4 w-4" />
                                   {recalculationPending && (
                                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                        </span>
                                   )}
                              </button>

                              {showNotifications && (
                                   <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-[#0c0e14]/95 p-4 shadow-2xl border border-white/10 backdrop-blur-xl z-50">
                                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                                             <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                                                  <Bell className="h-4 w-4 text-cyan-400" />
                                                  התראות מסלול
                                             </h4>
                                             <button
                                                  onClick={() => setShowNotifications(false)}
                                                  className="text-slate-400 hover:text-white"
                                             >
                                                  <X className="h-4 w-4" />
                                             </button>
                                        </div>
                                        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                                             {recalculationPending ? (
                                                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                                                       <div className="flex items-start gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                                            <div>
                                                                 <p className="font-bold">נדרש חישוב מסלול מחדש!</p>
                                                                 <p className="mt-1 text-slate-300">{recalculationReason || 'זוהה שינוי בעומס הלימודים'}</p>
                                                                 <button
                                                                      onClick={() => {
                                                                           recalculateRoute();
                                                                           setShowNotifications(false);
                                                                      }}
                                                                      className="mt-2 text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded-lg shadow-xs transition"
                                                                 >
                                                                      בצע חישוב מסלול עכשיו
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             ) : (
                                                  <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-slate-400 text-center">
                                                       אין התראות חדשות. תוכנית הלימודים מעודכנת ומיושרת!
                                                  </div>
                                             )}

                                             <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-slate-300 flex items-start gap-2">
                                                  <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                                                  <div>
                                                       <span className="font-bold text-white">טיפ אלגוריתמי:</span> חזרות מרווחות בשבת בבוקר מעלות את שימור הזיכרון ב-35%.
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              )}
                         </div>

                    </div>

                    {/* Navigation Links (Capsule Design) */}
                    <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1.5 rounded-full border border-white/[0.08] backdrop-blur-md">
                         {navLinks.map((link) => {
                              const Icon = link.icon;
                              const isActive = pathname === link.href;
                              return (
                                   <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 ${isActive
                                             ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/30 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] border border-cyan-400/40 font-bold'
                                             : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                                             }`}
                                   >
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                                        <span>{link.label}</span>
                                   </Link>
                              );
                         })}
                    </nav>

                    {/* Brand Logo (Appears on the LEFT side in RTL) */}
                    <Link href="/" className="flex items-center gap-3 group">
                         <KalisLogo size="md" variant="light" showTagline={true} />
                    </Link>

               </div>
          </header>
     );
}
