'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import KalisLogo from '../common/KalisLogo';

const PRODUCT_LINKS = [
     { href: '/flow', label: 'בדיקת קבלה ופערים' },
     { href: '/calculators', label: 'מחשבון סכם' },
     { href: '/saved-tracks', label: 'מסלולים שמורים' },
];

const CALCULATOR_LINKS = [
     { href: '/calculators/technion', label: 'הטכניון' },
     { href: '/calculators/tau', label: 'תל אביב' },
     { href: '/calculators/huji', label: 'העברית' },
     { href: '/calculators/bgu', label: 'בן-גוריון' },
     { href: '/calculators/bar-ilan', label: 'בר-אילן' },
     { href: '/calculators/haifa', label: 'חיפה' },
     { href: '/calculators/ariel', label: 'אריאל' },
     { href: '/calculators/reichman', label: 'רייכמן' },
];

const LEGAL_LINKS = [
     { href: '/terms', label: 'תנאי שימוש' },
     { href: '/privacy', label: 'מדיניות פרטיות' },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
     return (
          <div>
               <h4 className="text-sm font-semibold text-ink">{title}</h4>
               <ul className="mt-4 space-y-2.5">
                    {links.map((link) => (
                         <li key={link.href}>
                              <Link href={link.href} className="text-sm text-ink-2 hover:text-ink transition-colors">
                                   {link.label}
                              </Link>
                         </li>
                    ))}
               </ul>
          </div>
     );
}

export default function Footer() {
     const pathname = usePathname();

     // Do not render marketing footer on admission flow wizard
     if (pathname?.startsWith('/flow')) {
          return null;
     }

     return (
          <footer className="border-t border-line bg-paper mt-auto">
               <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-10">
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-10">
                         <div className="col-span-2 md:col-span-5">
                              <KalisLogo size="md" variant="dark" showTagline={false} />
                              <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-2">
                                   חישוב סכם, בדיקת קבלה ומסלולי שיפור לשמונה האוניברסיטאות בישראל — לפי נוסחאות הקבלה של כל מוסד.
                              </p>
                         </div>
                         <div className="md:col-span-2">
                              <FooterColumn title="המערכת" links={PRODUCT_LINKS} />
                         </div>
                         <div className="md:col-span-3">
                              <h4 className="text-sm font-semibold text-ink">מחשבוני סכם</h4>
                              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                                   {CALCULATOR_LINKS.map((link) => (
                                        <li key={link.href}>
                                             <Link href={link.href} className="text-sm text-ink-2 hover:text-ink transition-colors">
                                                  {link.label}
                                             </Link>
                                        </li>
                                   ))}
                              </ul>
                         </div>
                         <div className="md:col-span-2">
                              <FooterColumn title="מידע" links={LEGAL_LINKS} />
                         </div>
                    </div>

                    <p className="mt-14 max-w-4xl text-xs leading-relaxed text-ink-3">
                         המידע, החישובים ומסלולי הפעולה באתר הם כלי עזר והדמיה בלבד, ואינם אישור קבלה או מצג רשמי מטעם מוסדות הלימוד או המועצה להשכלה גבוהה. ההחלטה הסופית וחישוב הסכם הקובע לקבלה נעשים על ידי מוסד הלימוד בלבד.
                    </p>

                    <div className="mt-6 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-3">
                         <p>© 2026 מתקבלים · mitkablim.co.il</p>
                         <p>נבנה בישראל, לתלמידים בישראל.</p>
                    </div>
               </div>
          </footer>
     );
}
