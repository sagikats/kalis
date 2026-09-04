'use client';

import React from 'react';
import Link from 'next/link';
import { Calculator, GraduationCap, ChevronLeft, Sparkles, Building2, CheckCircle2, Layers } from 'lucide-react';

const UNIVERSITIES = [
     {
          id: 'unified',
          name: 'מחשבון אחוד לאוניברסיטאות בישראל',
          href: '/calculators/bgu',
          status: 'active',
          description: 'הזנת ציונים חד-פעמית וחישוב השוואתי מדויק לבן-גוריון, תל אביב, העברית, הטכניון, אריאל וחיפה.',
          badge: 'אחוד ופעיל'
     },
     {
          id: 'bgu',
          name: 'אוניברסיטת בן-גוריון בנגב (BGU)',
          href: '/calculators/bgu',
          status: 'active',
          description: 'מחשבון סכם כללי וסכם הנדסה/כמותי רשמי כולל חישוב בונוסים בבגרות ובדיקת אפיקי קבלה.',
          badge: 'פעיל בלייב'
     },
     {
          id: 'tau',
          name: 'אוניברסיטת תל אביב (TAU)',
          href: '/calculators/bgu',
          status: 'active',
          description: 'מחשבון סכם כמותי ורב-תחומי של אוניברסיטת תל אביב במחשבון האחוד.',
          badge: 'כלול במחשבון האחוד'
     },
     {
          id: 'huji',
          name: 'האוניברסיטה העברית בירושלים (HUJI)',
          href: '/calculators/bgu',
          status: 'active',
          description: 'חישוב ציון קבלה משוקלל וסכמי קבלה לפקולטות השונות בעברית במחשבון האחוד.',
          badge: 'כלול במחשבון האחוד'
     },
     {
          id: 'technion',
          name: 'הטכניון - מכון טכנולוגי לישראל',
          href: '/calculators/bgu',
          status: 'active',
          description: 'מחשבון סכם טכניוני (סכם הנדסה ומדעים מדויקים) במחשבון האחוד.',
          badge: 'כלול במחשבון האחוד'
     },
     {
          id: 'haifa',
          name: 'אוניברסיטת חיפה (UOH)',
          href: '/calculators/bgu',
          status: 'active',
          description: 'מחשבון סכם לפי נוסחת תקן רשמית (BT) וציון פסיכומטרי במחשבון האחוד.',
          badge: 'כלול במחשבון האחוד'
     },
     {
          id: 'ariel',
          name: 'אוניברסיטת אריאל בשומרון (AU)',
          href: '/calculators/bgu',
          status: 'active',
          description: 'מחשבון ציון קבלה משולב לפי נוסחת אריאל הרשמית במחשבון האחוד.',
          badge: 'כלול במחשבון האחוד'
     }
];

export default function CalculatorsHubPage() {
     return (
          <div className="min-h-screen bg-slate-950 text-slate-100 font-sans dir-rtl">
               <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                         <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                              <Calculator className="h-4 w-4" />
                              <span>מחשבוני סכם רשמיים לאוניברסיטאות בישראל</span>
                         </div>
                         <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                              מחשבון סכם <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500">אחוד והשוואתי</span>
                         </h1>
                         <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                              הזן את ציוני הבגרות והפסיכומטרי שלך פעם אחת בלבד וקבל חישוב השוואתי מיידי של ציוני הסכם בכל אוניברסיטאות היעד בישראל.
                         </p>
                    </div>

                    {/* Universities Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {UNIVERSITIES.map((univ) => {
                              const isActive = univ.status === 'active';
                              const isUnifiedHeader = univ.id === 'unified';
                              return (
                                   <div
                                        key={univ.id}
                                        className={`rounded-3xl p-6 sm:p-8 border transition-all duration-300 flex flex-col justify-between space-y-6 ${isUnifiedHeader
                                             ? 'md:col-span-2 bg-gradient-to-r from-blue-950/80 via-slate-900 to-cyan-950/80 border-cyan-500/40 hover:border-cyan-400 shadow-2xl shadow-cyan-500/10'
                                             : isActive
                                                  ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 border-blue-500/40 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10'
                                                  : 'bg-slate-900/40 border-slate-800/80 opacity-70'
                                             }`}
                                   >
                                        <div className="space-y-4">
                                             <div className="flex items-center justify-between">
                                                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                                       {isUnifiedHeader ? <Layers className="h-7 w-7" /> : <Building2 className="h-6 w-6" />}
                                                  </div>
                                                  <span
                                                       className={`text-xs font-bold px-3 py-1 rounded-full border ${isUnifiedHeader
                                                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                            }`}
                                                  >
                                                       {univ.badge}
                                                  </span>
                                             </div>

                                             <div>
                                                  <h3 className="text-xl font-black text-white">{univ.name}</h3>
                                                  <p className="text-xs text-slate-400 leading-relaxed mt-2">{univ.description}</p>
                                             </div>
                                        </div>

                                        <Link
                                             href={univ.href}
                                             className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg"
                                        >
                                             <span>פתח את המחשבון האחוד</span>
                                             <ChevronLeft className="h-4 w-4" />
                                        </Link>
                                   </div>
                              );
                         })}
                    </div>

               </main>
          </div>
     );
}
