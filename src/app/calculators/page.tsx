'use client';

import React from 'react';
import Link from 'next/link';
import { Calculator, GraduationCap, ChevronLeft, Sparkles, Building, CheckCircle2 } from 'lucide-react';

const UNIVERSITIES = [
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
          href: '/calculators/tau',
          status: 'coming_soon',
          description: 'מחשבון סכם כמותי ורב-תחומי של אוניברסיטת תל אביב.',
          badge: 'בקרוב'
     },
     {
          id: 'huji',
          name: 'האוניברסיטה העברית בירושלים (HUJI)',
          href: '/calculators/huji',
          status: 'coming_soon',
          description: 'חישוב ציון קבלה משוקלל וסכמי קבלה לפקולטות השונות בעברית.',
          badge: 'בקרוב'
     },
     {
          id: 'technion',
          name: 'הטכניון - מכון טכנולוגי לישראל',
          href: '/calculators/technion',
          status: 'coming_soon',
          description: 'מחשבון סכם טכניוני (סכם הנדסה ומדעים מדויקים).',
          badge: 'בקרוב'
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
                              בחר את <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">אוניברסיטת היעד</span> שלך
                         </h1>
                         <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                              לכל אוניברסיטה נוסחת סכם וכללי בונוסים ייחודיים. בחר אוניברסיטה לקבלת חישוב סכם מדויק המותאם לכללי הקבלה העדכניים ל-2026.
                         </p>
                    </div>

                    {/* Universities Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {UNIVERSITIES.map((univ) => {
                              const isActive = univ.status === 'active';
                              return (
                                   <div
                                        key={univ.id}
                                        className={`rounded-3xl p-6 sm:p-8 border transition-all duration-300 flex flex-col justify-between space-y-6 ${isActive
                                             ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 border-blue-500/40 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/10'
                                             : 'bg-slate-900/40 border-slate-800/80 opacity-70'
                                             }`}
                                   >
                                        <div className="space-y-4">
                                             <div className="flex items-center justify-between">
                                                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                                       <Building className="h-6 w-6" />
                                                  </div>
                                                  <span
                                                       className={`text-xs font-bold px-3 py-1 rounded-full border ${isActive
                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                            : 'bg-slate-800 text-slate-400 border-slate-700'
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

                                        {isActive ? (
                                             <Link
                                                  href={univ.href}
                                                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg"
                                             >
                                                  <span>כנס למחשבון הסכם של בן-גוריון</span>
                                                  <ChevronLeft className="h-4 w-4" />
                                             </Link>
                                        ) : (
                                             <button
                                                  disabled
                                                  className="w-full py-3.5 bg-slate-800 text-slate-500 font-bold text-xs rounded-2xl cursor-not-allowed text-center"
                                             >
                                                  מחשבון זה בשלבי פיתוח
                                             </button>
                                        )}
                                   </div>
                              );
                         })}
                    </div>

               </main>
          </div>
     );
}
