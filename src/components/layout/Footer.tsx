'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Cpu, GraduationCap, Database, ArrowUpLeft } from 'lucide-react';
import KalisLogo from '../common/KalisLogo';

export default function Footer() {
     return (
          <footer className="border-t border-white/[0.08] bg-[#06070a] text-slate-400 mt-auto relative overflow-hidden">
               {/* Subtle background glow */}
               <div className="absolute bottom-0 right-1/4 w-96 h-64 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
               <div className="absolute bottom-0 left-1/4 w-96 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

               <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

                         {/* Brand Info (Col 1-5) */}
                         <div className="space-y-4 md:col-span-5">
                              <KalisLogo size="md" variant="light" showTagline={true} />
                              <p className="text-xs text-slate-400 leading-relaxed max-w-md pt-2">
                                   פלטפורמת אופטימיזציית הקבלה המובילה בישראל. מנוע מתמטי רב-מוסדי ל-8 האוניברסיטאות המובילות, ניתוח פערי קבלה ל-639 תוכניות לימוד ומסלולי שיפור חכמים לציון היעד במינימום מאמץ.
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-3">
                                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-cyan-400">
                                        <Shield className="h-3 w-3" /> נוסחאות רשמיות 2026
                                   </span>
                                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-emerald-400">
                                        <Database className="h-3 w-3" /> SQLite Live Synchronized
                                   </span>
                              </div>
                         </div>

                         {/* Quick Navigation (Col 6-8) */}
                         <div className="md:col-span-3">
                              <div className="flex items-center gap-2 mb-4">
                                   <span className="font-mono text-[10px] text-cyan-400 tracking-wider uppercase">01 // NAVIGATE</span>
                              </div>
                              <h4 className="text-sm font-bold text-white mb-3">ניווט במערכת</h4>
                              <ul className="space-y-2.5 text-xs">
                                   <li>
                                        <Link href="/" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors group">
                                             <ArrowUpLeft className="h-3 w-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                             <span>דף הבית</span>
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/flow" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors group">
                                             <ArrowUpLeft className="h-3 w-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                             <span>בדיקת קבלה ופערים (WIZARD)</span>
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/calculators" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors group">
                                             <ArrowUpLeft className="h-3 w-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                             <span>מחשבון סכם 8 אוניברסיטאות</span>
                                        </Link>
                                   </li>
                              </ul>
                         </div>

                         {/* Architectural Spec HUD (Col 9-12) */}
                         <div className="md:col-span-4">
                              <div className="flex items-center gap-2 mb-4">
                                   <span className="font-mono text-[10px] text-cyan-400 tracking-wider uppercase">02 // ARCHITECTURE</span>
                              </div>
                              <h4 className="text-sm font-bold text-white mb-3">מפרט מנוע החישוב</h4>
                              <div className="space-y-2 font-mono text-[11px]">
                                   <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                                        <span className="text-slate-400">מוסדות אקדמיים:</span>
                                        <span className="text-white font-bold">8 אוניברסיטאות מחקר</span>
                                   </div>
                                   <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                                        <span className="text-slate-400">תוכניות לימוד במאגר:</span>
                                        <span className="text-cyan-400 font-bold">639 תארים ומסלולים</span>
                                   </div>
                                   <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                                        <span className="text-slate-400">חוק שמטת מקצועות:</span>
                                        <span className="text-emerald-400 font-bold">רצפת 20 יח&quot;ל חוקית</span>
                                   </div>
                              </div>
                         </div>

                    </div>

                    {/* Bottom Sub-bar */}
                    <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
                         <p className="font-mono text-[11px]">
                              © 2026 KALIS // SYSTEM ARCHITECTURE. כל הזכויות שמורות.
                         </p>
                         <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              <span>מערכת מקוונת ופעילה בזמן אמת</span>
                         </div>
                    </div>
               </div>
          </footer>
     );
}
