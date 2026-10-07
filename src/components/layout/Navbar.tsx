'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
     Compass,
     Sliders,
     User,
     ChevronDown,
     Calculator,
     LogOut,
     LogIn,
     UserPlus,
     BookmarkCheck,
     Menu,
     X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import KalisLogo from '../common/KalisLogo';

export default function Navbar() {
     const pathname = usePathname();
     const { user, isAuthenticated, logout, openAuthModal } = useAuth();
     const [showProfileMenu, setShowProfileMenu] = useState(false);
     const [showMobileMenu, setShowMobileMenu] = useState(false);
     const [isScrolled, setIsScrolled] = useState(false);

     // Scroll edge effect: the bar only grows a hairline once content actually slides under it
     useEffect(() => {
          const onScroll = () => setIsScrolled(window.scrollY > 4);
          onScroll();
          window.addEventListener('scroll', onScroll, { passive: true });
          return () => window.removeEventListener('scroll', onScroll);
     }, []);

     // One active pill that glides between tabs, so the eye follows where you went
     const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
     const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean } | null>(null);

     useLayoutEffect(() => {
          const measure = () => {
               const el = linkRefs.current[pathname];
               if (!el) {
                    setIndicator(null);
                    return;
               }
               setIndicator((prev) => ({ left: el.offsetLeft, width: el.offsetWidth, ready: prev !== null }));
          };
          measure();
          window.addEventListener('resize', measure);
          return () => window.removeEventListener('resize', measure);
     }, [pathname, user?.savedTracksCount, isAuthenticated]);

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
          <header className="sticky top-0 z-50 w-full material-bar scroll-edge" data-scrolled={isScrolled}>
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
                                             <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-xl border border-[#E7E2D8] z-50 origin-top-right animate-in fade-in zoom-in-95">
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

                    </div>

                    {/* Navigation Links (Capsule Design) */}
                    <nav className="relative hidden md:flex items-center gap-1 bg-[#EFECE6] p-1 rounded-full border border-[#E2DDD3]">
                         {indicator && (
                              <span
                                   aria-hidden="true"
                                   className="absolute top-1 bottom-1 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-[#DDD7CC] motion-reduce:transition-none"
                                   style={{
                                        left: indicator.left,
                                        width: indicator.width,
                                        transition: indicator.ready
                                             ? 'left 500ms var(--ease-spring), width 500ms var(--ease-spring)'
                                             : 'none',
                                   }}
                              />
                         )}
                         {navLinks.map((link) => {
                              const Icon = link.icon;
                              const isActive = pathname === link.href;
                              return (
                                   <Link
                                        key={link.href}
                                        href={link.href}
                                        ref={(el) => { linkRefs.current[link.href] = el; }}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`relative z-10 flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full border border-transparent transition-colors duration-200 active:scale-[0.97] ${isActive
                                             ? 'text-[#222222]'
                                             : 'text-[#66635C] hover:text-[#222222] hover:bg-white/50'
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

                    {/* Mobile navigation: the four destinations, anchored to the menu button */}
                    <div className="relative md:hidden">
                         <button
                              onClick={() => setShowMobileMenu((v) => !v)}
                              aria-expanded={showMobileMenu}
                              aria-label={showMobileMenu ? 'סגור תפריט' : 'פתח תפריט'}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFECE6] border border-[#E2DDD3] text-[#44423D] transition-colors cursor-pointer"
                         >
                              {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                         </button>
                         {showMobileMenu && (
                              <>
                                   <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                                   <nav className="absolute left-1/2 -translate-x-1/2 mt-2 w-60 rounded-2xl bg-white p-2 shadow-xl border border-[#E7E2D8] z-50 origin-top animate-in fade-in zoom-in-95">
                                        {navLinks.map((link) => {
                                             const Icon = link.icon;
                                             const isActive = pathname === link.href;
                                             return (
                                                  <Link
                                                       key={link.href}
                                                       href={link.href}
                                                       aria-current={isActive ? 'page' : undefined}
                                                       onClick={() => setShowMobileMenu(false)}
                                                       className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors ${isActive ? 'bg-[#F4F1EA] text-[#222222] font-bold' : 'text-[#55524B] active:bg-[#F4F1EA]'}`}
                                                  >
                                                       <Icon className="h-4 w-4 text-[#88857E]" />
                                                       <span>{link.label}</span>
                                                  </Link>
                                             );
                                        })}
                                   </nav>
                              </>
                         )}
                    </div>

                    {/* Brand Logo (Appears on the LEFT side in RTL) */}
                    <Link href="/" className="flex items-center gap-3 group">
                         <KalisLogo size="md" variant="dark" showTagline={true} />
                    </Link>

               </div>
          </header>
     );
}
