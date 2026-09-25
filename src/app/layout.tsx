import type { Metadata } from 'next';
import { Inter_Tight, IBM_Plex_Sans_Hebrew, Frank_Ruhl_Libre } from 'next/font/google';
import './globals.css';
import { PlannerProvider } from '../context/PlannerContext';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AuthModal from '../components/auth/AuthModal';
import JsonLd from '../components/seo/JsonLd';

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const ibmPlex = IBM_Plex_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  variable: '--font-ibm-plex',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  variable: '--font-frank-ruhl',
  display: 'swap',
  weight: ['400', '500', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: {
    default: 'מתקבלים — מחשבון בגרויות, מחשבון פסיכומטרי, חישוב סכם וסיכויי קבלה לתואר',
    template: '%s | מתקבלים'
  },
  description: 'מחשבון בגרויות ומחשבון פסיכומטרי רשמי ל-8 האוניברסיטאות בישראל. בדיקת סיכויי קבלה לתואר, נתוני קבלה, חישוב ממוצע בגרות, בירור סף קבלה וסכם בגרויות מדויק ל-721 תארים. בדקו עכשיו חינם!',
  metadataBase: new URL('https://mitkablim.co.il'),
  alternates: {
    canonical: '/',
  },
  keywords: [
    'מחשבון בגרויות',
    'מחשבון פסיכומטרי',
    'קבלה לתואר',
    'נתוני קבלה',
    'סכם בגרויות',
    'סף קבלה',
    'חישוב ממוצע בגרות',
    'סיכויי קבלה',
    'סיכויי קבלה לאוניברסיטה',
    'תנאי קבלה לאוניברסיטה',
    'מחשבון סכם',
    'חישוב סכם',
    'סכם קבלה',
    'תנאי קבלה להנדסה',
    'תנאי קבלה למדעי המחשב',
    'תנאי קבלה לרפואה',
    'סכם טכניון',
    'סכם תל אביב',
    'סכם העברית',
    'סכם בן גוריון',
    'סכם בר אילן',
    'סכם חיפה',
    'סכם אריאל',
    'סכם רייכמן',
    'שיפור בגרויות',
    'שיפור פסיכומטרי',
    'מכינה אקדמית',
    'אפיק מעבר',
    'האוניברסיטה הפתוחה',
    'מתקבלים',
    'mitkablim'
  ],
  openGraph: {
    title: 'מתקבלים — מחשבון בגרויות, מחשבון פסיכומטרי וסכם קבלה לאוניברסיטאות',
    description: 'מחשבון בגרויות ופסיכומטרי מדויק ל-8 האוניברסיטאות בישראל. גלו בדיוק לאילו תארים אתם מתקבלים ואיך לשפר את הסכם לציון היעד במינימום מאמץ.',
    url: 'https://mitkablim.co.il',
    siteName: 'מתקבלים (Mitkablim)',
    locale: 'he_IL',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      suppressHydrationWarning
      className={`${interTight.variable} ${ibmPlex.variable} ${frankRuhl.variable} h-full antialiased`}
    >
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <JsonLd />
      </head>
      <body className="font-sans min-h-full flex flex-col bg-[#FAF8F5] text-[#222222] selection:bg-[#EAE5DB] selection:text-[#222222]">
        <AuthProvider>
          <PlannerProvider>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
            <AuthModal />
          </PlannerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
