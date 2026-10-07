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
                                        className="flex items-center gap-2 p-1.5 pr-2.5 text-xs font-bold text-ink bg-white hover:bg-paper-2 rounded-full transition-colors border border-line shadow-xs cursor-pointer"
                                   >
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white font-bold text-xs">
                                             {getInitials(user.name)}
                                        </div>
                                        <span className="hidden sm:inline font-bold text-ink">{user.name}</span>
                                        <ChevronDown className="h-3.5 w-3.5 text-ink-2" />
                                   </button>

                                   {/* Profile Dropdown */}
                                   {showProfileMenu && (
                                        <>
                                             <div
                                                  className="fixed inset-0 z-40"
                                                  onClick={() => setShowProfileMenu(false)}
                                             />
                                             <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-xl border border-line z-50 origin-top-right animate-in fade-in zoom-in-95">
                                                  <div className="p-2 border-b border-line mb-2">
                                                       <p className="font-bold text-sm text-ink">{user.name}</p>
                                                       <p className="text-xs text-ink-2 mt-0.5">{user.email}</p>
                                                       {user.savedTracksCount !== undefined && (
                                                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-accent">
                                                                 <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                                                                 <span>{user.savedTracksCount} מסלולים שמורים במערכת</span>
                                                            </div>
                                                       )}
                                                  </div>

                                                  <Link
                                                       href="/saved-tracks"
                                                       onClick={() => setShowProfileMenu(false)}
                                                       className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-ink hover:bg-paper-2 rounded-xl transition-colors mb-1 cursor-pointer"
                                                  >
                                                       <div className="flex items-center gap-2">
                                                            <BookmarkCheck className="h-4 w-4 text-accent" />
                                                            <span>המסלולים השמורים שלי</span>
                                                       </div>
                                                       {user.savedTracksCount !== undefined && user.savedTracksCount > 0 && (
                                                            <span className="bg-accent-soft text-accent-2 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                                 {user.savedTracksCount}
                                                            </span>
                                                       )}
                                                  </Link>

                                                  <button
                                                       onClick={() => {
                                                            setShowProfileMenu(false);
                                                            logout();
                                                       }}
                                                       className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-danger hover:bg-danger-soft rounded-xl transition-colors cursor-pointer"
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
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-ink-2 hover:text-ink bg-paper-2 hover:bg-[#EAE5DC] border border-line rounded-full transition-all cursor-pointer"
                                   >
                                        <LogIn className="h-3.5 w-3.5 text-ink-2" />
                                        <span>התחברות</span>
                                   </button>
                                   <button
                                        onClick={() => openAuthModal('register')}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-ink hover:bg-black rounded-full transition-all shadow-xs cursor-pointer"
                                   >
                                        <UserPlus className="h-3.5 w-3.5" />
                                        <span>הרשמה</span>
                                   </button>
                              </div>
                         )}

                    </div>

                    {/* Navigation Links (Capsule Design) */}
                    <nav className="relative hidden md:flex items-center gap-1 bg-paper-2 p-1 rounded-full border border-[#E2DDD3]">
                         {indicator && (
                              <span
                                   aria-hidden="true"
                                   className="absolute top-1 bottom-1 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-line-strong motion-reduce:transition-none"
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
                                             ? 'text-ink'
                                             : 'text-ink-2 hover:text-ink hover:bg-white/50'
                                             }`}
                                   >
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-ink' : 'text-ink-3'}`} />
                                        <span>{link.label}</span>
                                        {link.showCount && isAuthenticated && user && (user.savedTracksCount ?? 0) > 0 && (
                                             <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                                                  isActive ? 'bg-ink text-white' : 'bg-line-strong text-ink'
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
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-2 border border-[#E2DDD3] text-ink-2 transition-colors cursor-pointer"
                         >
                              {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                         </button>
                         {showMobileMenu && (
                              <>
                                   <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                                   <nav className="absolute left-1/2 -translate-x-1/2 mt-2 w-60 rounded-2xl bg-white p-2 shadow-xl border border-line z-50 origin-top animate-in fade-in zoom-in-95">
                                        {navLinks.map((link) => {
                                             const Icon = link.icon;
                                             const isActive = pathname === link.href;
                                             return (
                                                  <Link
                                                       key={link.href}
                                                       href={link.href}
                                                       aria-current={isActive ? 'page' : undefined}
                                                       onClick={() => setShowMobileMenu(false)}
                                                       className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors ${isActive ? 'bg-paper-2 text-ink font-bold' : 'text-ink-2 active:bg-paper-2'}`}
                                                  >
                                                       <Icon className="h-4 w-4 text-ink-3" />
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
