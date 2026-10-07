'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, GraduationCap, Database, ArrowUpLeft } from 'lucide-react';
import KalisLogo from '../common/KalisLogo';

export default function Footer() {
     const pathname = usePathname();

     // Do not render marketing footer on admission flow wizard
     if (pathname?.startsWith('/flow')) {
          return null;
     }

     return (
          <footer className="border-t border-line bg-paper-2 text-ink-2 mt-auto relative">
               <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

                         {/* Brand Info (Col 1-5) */}
                         <div className="space-y-4 md:col-span-5">
                              <KalisLogo size="md" variant="dark" showTagline={true} />
                              <p className="text-xs text-ink-2 leading-relaxed max-w-md pt-2">
                                   פלטפורמת הקבלה האקדמית המובילה בישראל. מנוע מתמטי רב-מוסדי ל-8 האוניברסיטאות המובילות, ניתוח פערי קבלה ל-721 תוכניות לימוד ומסלולי שיפור חכמים לציון היעד במינימום מאמץ.
                              </p>
                              <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-sans pt-2">
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-line text-ink-2 shadow-2xs">
                                        <Shield className="h-3 w-3 text-accent" /> נוסחאות רשמיות 2026
                                   </span>
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-line text-ink-2 shadow-2xs">
                                        <Database className="h-3 w-3 text-success" /> מאגר מוסדי מעודכן
                                   </span>
                              </div>
                         </div>

                         {/* Quick Navigation (Col 6-8) */}
                         <div className="md:col-span-3">
                              <div className="flex items-center gap-2 mb-3">
                                   <span className="font-sans text-[11px] font-bold text-ink-3 tracking-wider uppercase">01 // ניווט מהיר</span>
                              </div>
                              <h4 className="text-sm font-bold text-ink mb-3">ניווט במערכת</h4>
                              <ul className="space-y-2 text-xs">
                                   <li>
                                        <Link href="/" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink transition-colors">
                                             <ArrowUpLeft className="h-3 w-3 text-ink-3" />
                                             <span>דף הבית</span>
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/flow" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink transition-colors">
                                             <ArrowUpLeft className="h-3 w-3 text-ink-3" />
                                             <span>בדיקת קבלה ופערים אישית</span>
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/calculators" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink transition-colors">
                                             <ArrowUpLeft className="h-3 w-3 text-ink-3" />
                                             <span>מחשבון סכם ל-8 האוניברסיטאות</span>
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/terms" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink transition-colors">
                                             <ArrowUpLeft className="h-3 w-3 text-ink-3" />
                                             <span>תנאי שימוש והגבלת אחריות</span>
                                        </Link>
                                   </li>
                                   <li>
                                        <Link href="/privacy" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink transition-colors">
                                             <ArrowUpLeft className="h-3 w-3 text-ink-3" />
                                             <span>מדיניות פרטיות והגנת מידע</span>
                                        </Link>
                                   </li>
                              </ul>
                         </div>

                         {/* Architectural Spec HUD (Col 9-12) */}
                         <div className="md:col-span-4">
                              <div className="flex items-center gap-2 mb-3">
                                   <span className="font-sans text-[11px] font-bold text-ink-3 tracking-wider uppercase">02 // מפרט מערכת</span>
                              </div>
                              <h4 className="text-sm font-bold text-ink mb-3">מפרט מנוע החישוב</h4>
                              <div className="space-y-2 text-[11px]">
                                   <div className="p-2.5 rounded-xl bg-white border border-line flex items-center justify-between shadow-2xs">
                                        <span className="text-ink-2">מוסדות אקדמיים:</span>
                                        <span className="text-ink font-bold">8 אוניברסיטאות מחקר</span>
                                   </div>
                                   <div className="p-2.5 rounded-xl bg-white border border-line flex items-center justify-between shadow-2xs">
                                        <span className="text-ink-2">תוכניות לימוד במאגר:</span>
                                        <span className="text-ink font-bold">721 תארים ומסלולים</span>
                                   </div>
                                   <div className="p-2.5 rounded-xl bg-white border border-line flex items-center justify-between shadow-2xs">
                                        <span className="text-ink-2">חוק שמטת מקצועות:</span>
                                        <span className="text-success font-bold">רצפת 20 יח&quot;ל חוקית</span>
                                   </div>
                              </div>
                         </div>

                    </div>

                    {/* Disclaimer Bar */}
                    <div className="mt-10 pt-4 border-t border-line/70 text-[11px] text-[#7E7A73] text-center sm:text-right leading-relaxed">
                         <p>
                              * הבהרה: המידע, החישובים ומסלולי הפעולה באתר מהווים כלי עזר והדמיה עצמאית בלבד, ואינם מהווים אישור קבלה או מצג רשמי מטעם מוסדות הלימוד או המועצה להשכלה גבוהה. ההחלטה הסופית וחישוב הסכם הקובע לקבלה מתבצעים אך ורק על ידי מוסד הלימוד האקדמי.
                         </p>
                    </div>

                    {/* Bottom Sub-bar */}
                    <div className="mt-4 pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between text-xs text-ink-3 gap-4">
                         <p className="font-sans text-[11px]">
                              © 2026 מתקבלים (mitkablim.co.il). כל הזכויות שמורות.
                         </p>
                         <div className="flex items-center gap-4 text-[11px]">
                              <Link href="/terms" className="text-ink-2 hover:text-ink transition-colors">
                                   תנאי שימוש
                              </Link>
                              <span className="text-[#C5BFB5]">•</span>
                              <Link href="/privacy" className="text-ink-2 hover:text-ink transition-colors">
                                   מדיניות פרטיות
                              </Link>
                              <span className="text-[#C5BFB5]">•</span>
                              <div className="inline-flex items-center gap-1.5 text-ink-2">
                                   <span className="w-2 h-2 rounded-full bg-success" />
                                   <span>מערכת מקוונת</span>
                              </div>
                         </div>
                    </div>
               </div>
          </footer>
     );
}
