'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation, Heart, Shield, Sparkles } from 'lucide-react';

import KalisLogo from '../common/KalisLogo';

export default function Footer() {
     return (
          <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 mt-auto">
               <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                         {/* Brand Info */}
                         <div className="space-y-4 md:col-span-2">
                              <KalisLogo size="lg" variant="light" showTagline={true} />
                              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                                   מערכת הלמידה האדפטיבית הראשונה בישראל המותאמת לבחני הבגרות והפסיכומטרי.
                                   אלגוריתם ה-Waze שלנו משלב חישוב מסלול מחדש בזמן אמת, חלוקת פדגוגיה 50/30/20 וחזרות מרווחות להבטחת ציון היעד.
                              </p>
                              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                                   <span className="flex items-center gap-1">
                                        <Shield className="h-3.5 w-3.5 text-emerald-400" /> סילבוס משרד החינוך 2026
                                   </span>
                                   <span className="flex items-center gap-1">
                                        <Sparkles className="h-3.5 w-3.5 text-sky-400" /> חישוב סכום קבלה בזמן אמת
                                   </span>
                              </div>
                         </div>

                         {/* Quick Links */}
                         <div>
                              <h4 className="text-sm font-bold text-white mb-3">ניווט מהיר</h4>
                              <ul className="space-y-2 text-xs">
                                   <li>
                                        <Link href="/" className="hover:text-sky-300 transition-colors">
                                             דף הבית והסימולטור
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/optimizer" className="hover:text-sky-300 transition-colors">
                                             אופטימיזציית סכם קבלה
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/wizard" className="hover:text-sky-300 transition-colors">
                                             אשף בניית תוכנית למידה
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/dashboard" className="hover:text-sky-300 transition-colors">
                                             קוקפיט למידה יומי
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/schedule" className="hover:text-sky-300 transition-colors">
                                             לוח זמנים ועץ סילבוס
                                        </Link>
                                   </li>
                              </ul>
                         </div>

                         {/* Pedagogical Split Summary */}
                         <div>
                              <h4 className="text-sm font-bold text-white mb-3">השיטה הפדגוגית</h4>
                              <div className="space-y-2 text-xs">
                                   <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                                        <div className="flex justify-between font-semibold text-slate-200">
                                             <span>50% תרגול אקטיבי</span>
                                             <span className="text-sky-400">Active Recall</span>
                                        </div>
                                   </div>
                                   <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                                        <div className="flex justify-between font-semibold text-slate-200">
                                             <span>30% למידה ראשונית</span>
                                             <span className="text-violet-400">Concept Mastery</span>
                                        </div>
                                   </div>
                                   <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                                        <div className="flex justify-between font-semibold text-slate-200">
                                             <span>20% חזרה מרווחת</span>
                                             <span className="text-emerald-400">Spaced Repetition</span>
                                        </div>
                                   </div>
                              </div>
                         </div>

                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
                         <p>© 2026 Study Planner — כל הזכויות שמורות. מפותח עבור מועמדי בגרויות ופסיכומטרי בישראל.</p>
                         <p className="flex items-center gap-1">
                              נבנה באהבה <Heart className="h-3 w-3 text-red-500 fill-red-500 inline" /> עבור מועמדים לאוניברסיטאות
                         </p>
                    </div>
               </div>
          </footer>
     );
}
