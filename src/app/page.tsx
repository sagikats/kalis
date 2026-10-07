'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Calculator, Target, Route } from 'lucide-react';
import UniversityLogo, { InstitutionKey, UNIVERSITIES_META } from '@/components/common/UniversityLogo';

const INSTITUTIONS: InstitutionKey[] = ['technion', 'tau', 'huji', 'bgu', 'bar_ilan', 'haifa', 'ariel', 'reichman'];

// Illustrative only — rendered with an explicit "דוגמה" label, never presented as real thresholds
const PREVIEW_ROWS: { inst: InstitutionKey; score: string; threshold: string; pass: boolean; gap?: string }[] = [
  { inst: 'tau', score: '718', threshold: '704', pass: true },
  { inst: 'bgu', score: '691', threshold: '676', pass: true },
  { inst: 'technion', score: '89.4', threshold: '92.1', pass: false, gap: '2.7' },
  { inst: 'haifa', score: '662', threshold: '700', pass: false, gap: '38' },
];

const STEPS = [
  {
    n: '01',
    title: 'מזינים ציונים פעם אחת',
    body: 'בגרויות, יחידות לימוד ופסיכומטרי — אם יש. אין צורך להבין נוסחאות או בונוסים.',
  },
  {
    n: '02',
    title: 'בוחרים תארים',
    body: 'מתוך 721 תוכניות לימוד בשמונה האוניברסיטאות, כמה שרוצים ובכל שילוב.',
  },
  {
    n: '03',
    title: 'מקבלים תמונה מלאה',
    body: 'הסכם המדויק בכל מוסד, איפה עוברים את הסף, ומה הדרך היעילה ביותר לסגור כל פער.',
  },
];

const CAPABILITIES = [
  {
    icon: Calculator,
    title: 'מחשבון סכם לשמונה האוניברסיטאות',
    body: 'חישוב סימולטני לטכניון, תל אביב, העברית, בן-גוריון, בר-אילן, חיפה, אריאל ורייכמן — כולל בונוסי מקצועות, השמטת מקצועות לפי כללי כל מוסד (רצפת 20 יח״ל) ובדיקת קבלה על סמך בגרות בלבד.',
    href: '/calculators',
    cta: 'לחישוב סכם',
  },
  {
    icon: Target,
    title: 'דוח קבלה ופערים אישי',
    body: 'לכל תואר שבחרתם: הסכם שלכם מול סף הקבלה, הפער המדויק בנקודות, ותנאי הסף הנוספים כמו מתמטיקה או אנגלית ברמה מסוימת.',
    href: '/flow',
    cta: 'לבדיקת קבלה',
  },
  {
    icon: Route,
    title: 'מסלולי שיפור',
    body: 'כשיש פער — אילו בגרויות או חלקי פסיכומטרי שווים הכי הרבה נקודות, באיזה מועד אפשר להספיק, ומתי מכינה או האוניברסיטה הפתוחה הן דרך טובה יותר.',
    href: '/flow',
    cta: 'לבניית מסלול',
  },
];

const KNOWLEDGE = [
  {
    title: 'מחשבון בגרויות וממוצע מיטבי',
    body: 'שקלול ציוני בגרות עם הבונוסים האקדמיים (עד 35 נקודות במתמטיקה 5 יח״ל), השמטת מקצועות לפי כללי כל מוסד ואיתור קבלה ישירה ללא פסיכומטרי.',
  },
  {
    title: 'מחשבון פסיכומטרי ודגשים',
    body: 'שקלול ציון רב-תחומי, דגש כמותי להנדסה ולמדעים מדויקים ודגש מילולי, לפי נוסחאות הסכם הרשמיות של כל מוסד.',
  },
  {
    title: 'נתוני קבלה וסף קבלה',
    body: 'ספי קבלה ל-721 תוכניות לימוד — הנדסה, מדעי המחשב, רפואה, משפטים, מנהל עסקים ופסיכולוגיה — ואבחון הפער מול הרף הנדרש.',
  },
  {
    title: 'שיפור בגרויות, מכינה ואפיק מעבר',
    body: 'תכנון מועדי חורף, אביב וקיץ, לצד מסלולים עוקפים כמו מכינה קדם-אקדמית ואפיק המעבר של האוניברסיטה הפתוחה.',
  },
];

const CALCULATOR_LINKS: { href: string; label: string }[] = [
  { href: '/calculators/technion', label: 'מחשבון סכם טכניון' },
  { href: '/calculators/tau', label: 'מחשבון סכם תל אביב' },
  { href: '/calculators/huji', label: 'מחשבון סכם העברית' },
  { href: '/calculators/bgu', label: 'מחשבון סכם בן-גוריון' },
  { href: '/calculators/bar-ilan', label: 'מחשבון סכם בר-אילן' },
  { href: '/calculators/haifa', label: 'מחשבון סכם חיפה' },
  { href: '/calculators/ariel', label: 'מחשבון סכם אריאל' },
  { href: '/calculators/reichman', label: 'מחשבון סכם רייכמן' },
];

const FAQ_ITEMS = [
  {
    q: 'איך עובד מחשבון בגרויות וחישוב ממוצע בגרות מיטבי?',
    a: 'מחשבון הבגרויות של מתקבלים משקלל את כל ציוני הבגרות עם הבונוסים האקדמיים הרשמיים (עד 35 נקודות במתמטיקה 5 יח״ל ועד 25 נקודות במקצועות מוגברים), ומפעיל השמטת מקצועות לפי הכללים של כל מוסד (תוך שמירה על רצפת 20 יח״ל לפחות) כדי להפיק עבור כל מועמד את ממוצע הבגרות הגבוה ביותר האפשרי בכל אחת מ-8 האוניברסיטאות.'
  },
  {
    q: 'מהו מחשבון פסיכומטרי וכיצד מחושב סכם בגרויות ופסיכומטרי?',
    a: 'מחשבון פסיכומטרי משקלל את ציון הבחינה הפסיכומטרית הארצית (ציון רב-תחומי, בדגש כמותי לתחומי הנדסה ומדעים מדויקים, או בדגש מילולי למדעי הרוח והחברה) יחד עם ממוצע הבגרויות, בהתאם לנוסחאות הסכם הרשמיות של כל אוניברסיטה (הטכניון, תל אביב, העברית, בן-גוריון, בר-אילן, חיפה, אריאל ורייכמן).'
  },
  {
    q: 'מה ההבדל בין סף קבלה לציון סכם בגרויות?',
    a: 'סכם בגרויות ופסיכומטרי הוא הציון המשוקלל האישי של המועמד. סף קבלה הוא ציון הרף המינימלי שנקבע על ידי האוניברסיטה לקבלה ישירה לחוג מסוים באותה שנת לימודים. מועמד שהסכם שלו שווה לסף הקבלה או גבוה ממנו זכאי לקבלה ישירה לחוג.'
  },
  {
    q: 'איך בודקים סיכויי קבלה ונתוני קבלה לתואר ב-8 האוניברסיטאות בישראל?',
    a: 'מזינים פעם אחת את ציוני הבגרות והפסיכומטרי במערכת מתקבלים, ובוחרים את התארים המבוקשים. המערכת מחשבת באופן מיידי את הסכם האישי מול ספי הקבלה ב-721 תוכניות לימוד ומציגה דוח קבלה אישי מפורט: קבלה ישירה, המתנה, או פער מדויק מהסף הנדרש.'
  },
  {
    q: 'מה עושים אם ציון הסכם נמוך מסף הקבלה לתואר המבוקש?',
    a: 'המערכת בונה מסלולי שיפור מותאמים אישית: שיפור מקצועות בגרות שמוסיפים הכי הרבה נקודות סכם, שיפור פסיכומטרי ממוקד, או חלופות כמו מכינה קדם-אקדמית ייעודית או אפיק המעבר של האוניברסיטה הפתוחה.'
  }
];

export default function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);

  return (
    <div className="relative bg-paper text-ink font-sans" dir="rtl">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* A single quiet wash of light — no moving background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 h-[620px] bg-[radial-gradient(ellipse_at_top,rgba(30,78,110,0.07),transparent_60%)]"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-16 items-center">
          <div>
            <p className="text-sm font-medium text-accent">
              מחשבון קבלה לשמונה האוניברסיטאות · שנת הלימודים 2026
            </p>
            <h1 className="mt-5 font-serif text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.25rem] font-bold text-ink">
              הדרך הקצרה ביותר
              <br />
              לתואר שרציתם.
            </h1>
            <p className="mt-6 max-w-xl text-lg sm:text-xl leading-relaxed text-ink-2">
              מזינים ציונים פעם אחת, ומקבלים את הסכם המדויק בכל אוניברסיטה, את המרחק מהסף בכל תואר — ואת הדרך היעילה ביותר לסגור אותו.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link
                href="/flow"
                className="inline-flex items-center justify-center gap-2.5 h-13 px-7 rounded-full bg-ink text-white text-[15px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_-8px_rgba(28,27,25,0.5)] hover:bg-black transition-colors"
              >
                <span>לבדיקת קבלה אישית</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Link
                href="/calculators"
                className="inline-flex items-center justify-center gap-2 h-13 px-7 rounded-full bg-surface text-ink text-[15px] font-semibold border border-line-strong hover:border-ink-3 transition-colors"
              >
                מחשבון סכם
              </Link>
            </div>

            <p className="mt-5 text-sm text-ink-3">ללא תשלום · תוצאה בתוך דקות</p>
          </div>

          {/* Product preview — what the report looks like */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-b from-white/70 to-transparent blur-2xl"
            />
            <figure className="relative rounded-3xl bg-surface border border-line shadow-[0_1px_2px_rgba(40,30,20,0.04),0_24px_60px_-20px_rgba(40,30,20,0.18)] overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <p className="text-xs text-ink-3">דוח קבלה</p>
                  <p className="mt-0.5 text-lg font-semibold text-ink">הנדסת חשמל</p>
                </div>
                <span className="text-[11px] font-medium text-ink-3 border border-line rounded-full px-2.5 py-1">
                  דוגמה להמחשה
                </span>
              </div>

              <ul className="divide-y divide-line border-t border-line">
                {PREVIEW_ROWS.map((row) => (
                  <li key={row.inst} className="flex items-center gap-3.5 px-6 py-3.5">
                    <UniversityLogo institution={row.inst} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{UNIVERSITIES_META[row.inst].shortName}</p>
                      <p className="text-xs text-ink-3 tabular-nums">
                        סכם {row.score} · סף {row.threshold}
                      </p>
                    </div>
                    {row.pass ? (
                      <span className="text-xs font-semibold text-success bg-success-soft rounded-full px-2.5 py-1">
                        עובר את הסף
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-warning bg-warning-soft rounded-full px-2.5 py-1 tabular-nums">
                        חסרות {row.gap}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <figcaption className="m-3 rounded-2xl bg-paper px-5 py-4">
                <p className="text-xs text-ink-3">הצעד היעיל ביותר</p>
                <p className="mt-1 text-sm font-medium text-ink leading-relaxed">
                  שיפור החלק הכמותי בפסיכומטרי סוגר את הפער בטכניון — בלי בחינת בגרות נוספת.
                </p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ── INSTITUTIONS ─────────────────────────────────────── */}
      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <p className="text-sm text-ink-3 shrink-0">לפי נוסחאות הקבלה של</p>
          <ul className="flex flex-wrap justify-center md:justify-between gap-x-6 gap-y-4 flex-1">
            {INSTITUTIONS.map((inst) => (
              <li key={inst} className="flex items-center gap-2 grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-[filter,opacity] duration-300">
                <UniversityLogo institution={inst} size="xs" />
                <span className="text-sm text-ink-2">{UNIVERSITIES_META[inst].shortName}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent">איך זה עובד</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl font-bold text-ink">
            שלושה צעדים, תשובה אחת ברורה.
          </h2>
        </div>

        <ol className="mt-14 grid md:grid-cols-3 gap-10 md:gap-8">
          {STEPS.map((step) => (
            <li key={step.n} className="border-t border-ink/80 pt-6">
              <span className="font-serif text-sm text-ink-3 tabular-nums">{step.n}</span>
              <h3 className="mt-3 text-xl font-semibold text-ink">{step.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── CAPABILITIES ─────────────────────────────────────── */}
      <section className="bg-surface border-y border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-accent">מה מקבלים</p>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl font-bold text-ink">
              כל מה שצריך כדי להחליט, במקום אחד.
            </h2>
          </div>

          <div className="mt-14 grid lg:grid-cols-3 gap-px bg-line rounded-3xl overflow-hidden border border-line">
            {CAPABILITIES.map(({ icon: Icon, title, body, href, cta }) => (
              <div key={title} className="bg-surface p-8 sm:p-9 flex flex-col">
                <Icon className="h-6 w-6 text-accent" strokeWidth={1.75} />
                <h3 className="mt-6 text-xl font-semibold text-ink">{title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2 flex-1">{body}</p>
                <Link
                  href={href}
                  className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-2 transition-colors self-start"
                >
                  <span>{cta}</span>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KNOWLEDGE / UNIVERSITY CALCULATORS ───────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-accent">מדריך קבלה</p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-ink">
            מחשבון בגרויות, מחשבון פסיכומטרי ובירור סיכויי קבלה לתואר
          </h2>
          <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-ink-2">
            ספי הקבלה ונוסחאות הסכם של האוניברסיטאות בישראל, במקום אחד.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {KNOWLEDGE.map((item) => (
            <div key={item.title}>
              <h3 className="text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-sm font-medium text-ink-3">מחשבוני סכם לפי אוניברסיטה</h3>
          <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 border-t border-line">
            {CALCULATOR_LINKS.map((link) => (
              <li key={link.href} className="border-b border-line">
                <Link
                  href={link.href}
                  className="group flex items-center justify-between py-4 text-[15px] text-ink hover:text-accent transition-colors"
                >
                  <span>{link.label}</span>
                  <ArrowLeft className="h-4 w-4 text-ink-3 group-hover:text-accent group-hover:-translate-x-0.5 transition-[color,translate] duration-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="bg-paper-2/60 border-t border-line">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">שאלות נפוצות</h2>

          <div className="mt-10 border-t border-line">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="border-b border-line">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="press-none w-full flex items-center justify-between gap-6 py-6 text-right text-base sm:text-lg font-medium text-ink cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-ink-3 shrink-0 transition-transform duration-500 ease-[var(--ease-spring)] ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div className="disclosure" data-open={isOpen} inert={!isOpen}>
                    <div>
                      <p className="pb-6 pl-10 text-[15px] leading-relaxed text-ink-2">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-8 py-16 sm:px-16 sm:py-20 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,170,205,0.18),transparent_65%)]"
          />
          <h2 className="relative font-serif text-3xl sm:text-5xl font-bold text-white">
            לדעת בדיוק איפה אתם עומדים.
          </h2>
          <p className="relative mt-5 max-w-xl mx-auto text-base sm:text-lg leading-relaxed text-white/70">
            בדיקת קבלה מלאה לכל התארים שמעניינים אתכם, ומסלול ברור לכל פער.
          </p>
          <div className="relative mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/flow"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 h-13 px-7 rounded-full bg-white text-ink text-[15px] font-semibold hover:bg-paper transition-colors"
            >
              <span>לבדיקת קבלה אישית</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link
              href="/calculators"
              className="inline-flex w-full sm:w-auto items-center justify-center h-13 px-7 rounded-full text-white text-[15px] font-semibold border border-white/25 hover:border-white/50 transition-colors"
            >
              מחשבון סכם
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
