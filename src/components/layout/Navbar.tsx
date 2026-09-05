'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
     Compass,
     Navigation,
     Sparkles,
     Sliders,
     Calendar,
     CheckSquare,
     Bell,
     User,
     ChevronDown,
     RefreshCw,
     X,
     AlertTriangle,
     Calculator
} from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';

import KalisLogo from '../common/KalisLogo';

export default function Navbar() {
     const pathname = usePathname();
     const { recalculationPending, recalculationReason, recalculateRoute } = usePlanner();
     const [showNotifications, setShowNotifications] = useState(false);
     const [showProfileMenu, setShowProfileMenu] = useState(false);

     const navLinks = [
          { href: '/', label: 'דף הבית', icon: Compass },
          { href: '/flow', label: 'בדיקת קבלה ופערים', icon: Sliders },
          { href: '/calculators', label: 'מחשבון סכם', icon: Calculator },
          { href: '/wizard', label: 'בניית תוכנית', icon: Sparkles },
          { href: '/dashboard', label: 'קוקפיט למידה', icon: CheckSquare },
          { href: '/schedule', label: 'לו״ז וסילבוס', icon: Calendar }
     ];

     return (
          <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs transition-all">
               <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* Left/Right swapped for RTL: Right Action Icons (Notifications & Profile) appear on the RIGHT in RTL */}
                    <div className="flex items-center gap-3">

                         {/* User Profile Menu */}
                         <div className="relative">
                              <button
                                   onClick={() => setShowProfileMenu(!showProfileMenu)}
                                   className="flex items-center gap-2 p-1.5 pr-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-full transition-colors border border-slate-200/60"
                              >
                                   <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-800 text-white font-bold text-xs shadow-xs">
                                        יג
                                   </div>
                                   <span className="hidden sm:inline">ישראל ישראלי</span>
                                   <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              </button>

                              {showProfileMenu && (
                                   <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-200 z-50 animate-in fade-in">
                                        <div className="px-3 py-2 border-b border-slate-100">
                                             <p className="text-xs font-bold text-slate-900">ישראל ישראלי</p>
                                             <p className="text-[11px] text-slate-500">מסלול 5 יח״ל מתמטיקה + פסיכומטרי</p>
                                        </div>
                                        <div className="py-1">
                                             <Link
                                                  href="/dashboard"
                                                  onClick={() => setShowProfileMenu(false)}
                                                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                                             >
                                                  <User className="h-3.5 w-3.5" />
                                                  הפרופיל שלי
                                             </Link>
                                             <Link
                                                  href="/schedule"
                                                  onClick={() => setShowProfileMenu(false)}
                                                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                                             >
                                                  <Calendar className="h-3.5 w-3.5" />
                                                  ניהול חסימות ויומן
                                             </Link>
                                        </div>
                                   </div>
                              )}
                         </div>

                         {/* Notifications Bell */}
                         <div className="relative">
                              <button
                                   onClick={() => setShowNotifications(!showNotifications)}
                                   className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 rounded-full transition-colors"
                                   aria-label="התראות"
                              >
                                   <Bell className="h-5 w-5" />
                                   {recalculationPending && (
                                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                                   )}
                              </button>

                              {/* Notifications Dropdown */}
                              {showNotifications && (
                                   <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white p-4 shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                             <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                  <Bell className="h-4 w-4 text-blue-600" />
                                                  התראות מסלול
                                             </h4>
                                             <button
                                                  onClick={() => setShowNotifications(false)}
                                                  className="text-slate-400 hover:text-slate-600"
                                             >
                                                  <X className="h-4 w-4" />
                                             </button>
                                        </div>
                                        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                                             {recalculationPending ? (
                                                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                                                       <div className="flex items-start gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                 <p className="font-bold">נדרש חישוב מסלול מחדש!</p>
                                                                 <p className="mt-1 text-slate-700">{recalculationReason || 'זוהה שינוי בעומס הלימודים'}</p>
                                                                 <button
                                                                      onClick={() => {
                                                                           recalculateRoute();
                                                                           setShowNotifications(false);
                                                                      }}
                                                                      className="mt-2 text-xs bg-amber-600 text-white font-bold px-3 py-1 rounded-lg shadow-xs hover:bg-amber-700 transition"
                                                                 >
                                                                      בצע חישוב מסלול עכשיו
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             ) : (
                                                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 text-center">
                                                       אין התראות חדשות. תוכנית הלימודים מעודכנת ומיושרת!
                                                  </div>
                                             )}

                                             <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 flex items-start gap-2">
                                                  <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                                  <div>
                                                       <span className="font-bold">טיפ אלגוריתמי:</span> חזרות מרווחות בשבת בבוקר מעלות את שימור הזיכרון ב-35%.
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              )}
                         </div>

                         {/* Recalculate Route Indicator Button if pending */}
                         {recalculationPending && (
                              <button
                                   onClick={() => recalculateRoute()}
                                   className="hidden lg:flex items-center gap-2 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs hover:bg-amber-600 transition-all animate-pulse"
                                   title="לחץ לחישוב מסלול מחדש"
                              >
                                   <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                   <span>חישוב מסלול מחדש</span>
                              </button>
                         )}

                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60">
                         {navLinks.map((link) => {
                              const Icon = link.icon;
                              const isActive = pathname === link.href;
                              return (
                                   <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${isActive
                                             ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60 font-bold'
                                             : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                             }`}
                                   >
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <span>{link.label}</span>
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
