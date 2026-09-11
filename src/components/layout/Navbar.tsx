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
     UserPlus,
     BookmarkCheck
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
          { href: '/saved-tracks', label: 'מסלולים שמורים', icon: BookmarkCheck, showCount: true },
     ];

     return (
          <header className="sticky top-0 z-50 w-full border-b border-[#E7E2D8] bg-[#FAF8F5]/90 backdrop-blur-md transition-all">
               <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* Left/Right in RTL: Actions (Notifications & Profile) on the RIGHT visually in RTL */}
                    <div className="flex items-center gap-2.5">

                         {/* User Profile Menu or Login/Register Buttons */}
                         {isAuthenticated && user ? (
                              <div className="relative">
                                   <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="flex items-center gap-2 p-1.5 pr-2.5 text-xs font-bold text-[#222222] bg-white hover:bg-[#F4F1EA] rounded-full transition-colors border border-[#E2DDD2] shadow-xs cursor-pointer"
                                   >
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3C3C3C] text-white font-bold text-xs">
                                             {getInitials(user.name)}
                                        </div>
                                        <span className="hidden sm:inline font-bold text-[#222222]">{user.name}</span>
                                        <ChevronDown className="h-3.5 w-3.5 text-[#66635C]" />
                                   </button>

                                   {/* Profile Dropdown */}
                                   {showProfileMenu && (
                                        <>
                                             <div
                                                  className="fixed inset-0 z-40"
                                                  onClick={() => setShowProfileMenu(false)}
                                             />
                                             <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-xl border border-[#E7E2D8] z-50 animate-in fade-in zoom-in-95 duration-150">
                                                  <div className="p-2 border-b border-[#EAE5DA] mb-2">
                                                       <p className="font-bold text-sm text-[#222222]">{user.name}</p>
                                                       <p className="text-xs text-[#66635C] mt-0.5">{user.email}</p>
                                                       {user.savedTracksCount !== undefined && (
                                                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-700">
                                                                 <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                                 <span>{user.savedTracksCount} מסלולים שמורים במערכת</span>
                                                            </div>
                                                       )}
                                                  </div>

                                                  <Link
                                                       href="/saved-tracks"
                                                       onClick={() => setShowProfileMenu(false)}
                                                       className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-[#222222] hover:bg-[#F4F1EA] rounded-xl transition-colors mb-1 cursor-pointer"
                                                  >
                                                       <div className="flex items-center gap-2">
                                                            <BookmarkCheck className="h-4 w-4 text-blue-600" />
                                                            <span>המסלולים השמורים שלי</span>
                                                       </div>
                                                       {user.savedTracksCount !== undefined && user.savedTracksCount > 0 && (
                                                            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                                 {user.savedTracksCount}
                                                            </span>
                                                       )}
                                                  </Link>

                                                  <button
                                                       onClick={() => {
                                                            setShowProfileMenu(false);
                                                            logout();
                                                       }}
                                                       className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                                  >
                                                       <LogOut className="h-4 w-4" />
                                                       <span>התנתק מהחשבון</span>
                                                  </button>
                                             </div>
                                        </>
                                   )}
                              </div>
                         ) : (
                              <div className="flex items-center gap-2">
                                   <button
                                        onClick={() => openAuthModal('login')}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#44423D] hover:text-[#111111] bg-[#EFECE6] hover:bg-[#EAE5DC] border border-[#E0DBD0] rounded-full transition-all cursor-pointer"
                                   >
                                        <LogIn className="h-3.5 w-3.5 text-[#66635C]" />
                                        <span>התחברות</span>
                                   </button>
                                   <button
                                        onClick={() => openAuthModal('register')}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#3C3C3C] hover:bg-[#2A2A2A] rounded-full transition-all shadow-xs cursor-pointer"
                                   >
                                        <UserPlus className="h-3.5 w-3.5" />
                                        <span>הרשמה</span>
                                   </button>
                              </div>
                         )}

                         {/* Notifications Popover */}
                         <div className="relative">
                              <button
                                   onClick={() => setShowNotifications(!showNotifications)}
                                   className="relative p-2 text-[#66635C] hover:text-[#222222] hover:bg-[#EFECE6] rounded-full transition-colors border border-transparent hover:border-[#E2DDD2]"
                                   title="התראות מערכת"
                              >
                                   <Bell className="h-4 w-4" />
                                   {recalculationPending && (
                                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                             <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                        </span>
                                   )}
                              </button>

                              {showNotifications && (
                                   <>
                                        <div
                                             className="fixed inset-0 z-40"
                                             onClick={() => setShowNotifications(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl border border-[#E7E2D8] z-50">
                                        <div className="flex items-center justify-between border-b border-[#EAE5DA] pb-3">
                                             <h4 className="font-bold text-sm text-[#222222] flex items-center gap-1.5">
                                                  <Bell className="h-4 w-4 text-blue-600" />
                                                  התראות מסלול
                                             </h4>
                                             <button
                                                  onClick={() => setShowNotifications(false)}
                                                  className="text-[#88857E] hover:text-[#222222]"
                                             >
                                                  <X className="h-4 w-4" />
                                             </button>
                                        </div>
                                        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                                             {recalculationPending ? (
                                                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                                                       <div className="flex items-start gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                 <p className="font-bold">נדרש חישוב מסלול מחדש!</p>
                                                                 <p className="mt-1 text-amber-800">{recalculationReason || 'זוהה שינוי בעומס הלימודים'}</p>
                                                                 <button
                                                                      onClick={() => {
                                                                           recalculateRoute();
                                                                           setShowNotifications(false);
                                                                      }}
                                                                      className="mt-2 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg shadow-xs transition"
                                                                 >
                                                                      בצע חישוב מסלול עכשיו
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             ) : (
                                                  <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DA] rounded-xl text-xs text-[#66635C] text-center">
                                                       אין התראות חדשות. תוכנית הלימודים מעודכנת ומיושרת!
                                                  </div>
                                             )}

                                             <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DA] rounded-xl text-xs text-[#44423D] flex items-start gap-2">
                                                  <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                                  <div>
                                                       <span className="font-bold text-[#222222]">טיפ אלגוריתמי:</span> חזרות מרווחות בסופי שבוע מעלות את שימור הזיכרון ב-35%.
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              </>
                              )}
                         </div>

                    </div>

                    {/* Navigation Links (Capsule Design) */}
                    <nav className="hidden md:flex items-center gap-1 bg-[#EFECE6] p-1 rounded-full border border-[#E2DDD3]">
                         {navLinks.map((link) => {
                              const Icon = link.icon;
                              const isActive = pathname === link.href;
                              return (
                                   <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 ${isActive
                                             ? 'bg-white text-[#222222] shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-[#DDD7CC] font-bold'
                                             : 'text-[#66635C] hover:text-[#222222] hover:bg-white/60'
                                             }`}
                                   >
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-[#222222]' : 'text-[#88857E]'}`} />
                                        <span>{link.label}</span>
                                        {link.showCount && isAuthenticated && user && (user.savedTracksCount ?? 0) > 0 && (
                                             <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                                                  isActive ? 'bg-[#3C3C3C] text-white' : 'bg-[#DDD7CC] text-[#222222]'
                                             }`}>
                                                  {user.savedTracksCount}
                                             </span>
                                        )}
                                   </Link>
                              );
                         })}
                    </nav>

                    {/* Brand Logo (Appears on the LEFT side in RTL) */}
                    <Link href="/" className="flex items-center gap-3 group">
                         <KalisLogo size="md" variant="dark" showTagline={true} />
                    </Link>

               </div>
          </header>
     );
}
