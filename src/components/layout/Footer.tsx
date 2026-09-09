'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, GraduationCap, Database, ArrowUpLeft } from 'lucide-react';
import KalisLogo from '../common/KalisLogo';

export default function Footer() {
     return (
          <footer className="border-t border-[#E5DFD4] bg-[#F4F0E8] text-[#66635C] mt-auto relative">
               <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

                         {/* Brand Info (Col 1-5) */}
                         <div className="space-y-4 md:col-span-5">
                              <KalisLogo size="md" variant="dark" showTagline={true} />
                              <p className="text-xs text-[#66635C] leading-relaxed max-w-md pt-2">
                                   פלטפורמת אופטימיזציית הקבלה המובילה בישראל. מנוע מתמטי רב-מוסדי ל-8 האוניברסיטאות המובילות, ניתוח פערי קבלה ל-639 תוכניות לימוד ומסלולי שיפור חכמים לציון היעד במינימום מאמץ.
                              </p>
                              <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-sans pt-2">
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E0DBD0] text-[#44423D] shadow-2xs">
                                        <Shield className="h-3 w-3 text-blue-700" /> נוסחאות רשמיות 2026
                                   </span>
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E0DBD0] text-[#44423D] shadow-2xs">
                                        <Database className="h-3 w-3 text-emerald-700" /> מאגר מוסדי מעודכן
                                   </span>
                              </div>
                         </div>

                         {/* Quick Navigation (Col 6-8) */}
                         <div className="md:col-span-3">
                              <div className="flex items-center gap-2 mb-3">
                                   <span className="font-sans text-[11px] font-bold text-[#88857E] tracking-wider uppercase">01 // ניווט מהיר</span>
                              </div>
                              <h4 className="text-sm font-bold text-[#222222] mb-3">ניווט במערכת</h4>
                              <ul className="space-y-2 text-xs">
                                   <li>
                                        <Link href="/" className="inline-flex items-center gap-1.5 text-[#55524B] hover:text-[#111111] transition-colors">
                                             <ArrowUpLeft className="h-3 w-3 text-[#9E988D]" />
                                             <span>דף הבית</span>
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/flow" className="inline-flex items-center gap-1.5 text-[#55524B] hover:text-[#111111] transition-colors">
                                             <ArrowUpLeft className="h-3 w-3 text-[#9E988D]" />
                                             <span>בדיקת קבלה ופערים אישית</span>
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/calculators" className="inline-flex items-center gap-1.5 text-[#55524B] hover:text-[#111111] transition-colors">
                                             <ArrowUpLeft className="h-3 w-3 text-[#9E988D]" />
                                             <span>מחשבון סכם ל-8 האוניברסיטאות</span>
                                        </Link>
                                   </li>
                              </ul>
                         </div>

                         {/* Architectural Spec HUD (Col 9-12) */}
                         <div className="md:col-span-4">
                              <div className="flex items-center gap-2 mb-3">
                                   <span className="font-sans text-[11px] font-bold text-[#88857E] tracking-wider uppercase">02 // מפרט מערכת</span>
                              </div>
                              <h4 className="text-sm font-bold text-[#222222] mb-3">מפרט מנוע החישוב</h4>
                              <div className="space-y-2 text-[11px]">
                                   <div className="p-2.5 rounded-xl bg-white border border-[#E2DDD2] flex items-center justify-between shadow-2xs">
                                        <span className="text-[#66635C]">מוסדות אקדמיים:</span>
                                        <span className="text-[#222222] font-bold">8 אוניברסיטאות מחקר</span>
                                   </div>
                                   <div className="p-2.5 rounded-xl bg-white border border-[#E2DDD2] flex items-center justify-between shadow-2xs">
                                        <span className="text-[#66635C]">תוכניות לימוד במאגר:</span>
                                        <span className="text-[#222222] font-bold">639 תארים ומסלולים</span>
                                   </div>
                                   <div className="p-2.5 rounded-xl bg-white border border-[#E2DDD2] flex items-center justify-between shadow-2xs">
                                        <span className="text-[#66635C]">חוק שמטת מקצועות:</span>
                                        <span className="text-emerald-700 font-bold">רצפת 20 יח&quot;ל חוקית</span>
                                   </div>
                              </div>
                         </div>

                    </div>

                    {/* Bottom Sub-bar */}
                    <div className="mt-12 pt-6 border-t border-[#E5DFD4] flex flex-col sm:flex-row items-center justify-between text-xs text-[#88857E] gap-4">
                         <p className="font-sans text-[11px]">
                              © 2026 KALIS. ארכיטקטורת קבלה אקדמית. כל הזכויות שמורות.
                         </p>
                         <div className="flex items-center gap-2 text-[11px] text-[#66635C]">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>מערכת מקוונת ופעילה</span>
                         </div>
                    </div>
               </div>
          </footer>
     );
}
