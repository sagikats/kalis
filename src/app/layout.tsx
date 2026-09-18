import type { Metadata } from 'next';
import { Inter_Tight, IBM_Plex_Sans_Hebrew, Frank_Ruhl_Libre } from 'next/font/google';
import './globals.css';
import { PlannerProvider } from '../context/PlannerContext';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AuthModal from '../components/auth/AuthModal';

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
  title: 'מתקבלים (Mitkablim) — מחשבון סכם ואופטימיזציית קבלה ל-8 האוניברסיטאות | mitkablim.co.il',
  description: 'פלטפורמת הקבלה האקדמית המובילה בישראל. מחשבון סכם רב-מוסדי ל-8 האוניברסיטאות, בדיקת סיכויי קבלה ל-721 תארים ומסלולי שיפור חכמים לציון היעד במינימום מאמץ.',
  metadataBase: new URL('https://mitkablim.co.il'),
  keywords: [
    'מחשבון סכם',
    'חישוב סכם',
    'סיכויי קבלה',
    'תנאי קבלה לאוניברסיטה',
    'סכם טכניון',
    'סכם תל אביב',
    'סכם העברית',
    'סכם בן גוריון',
    'שיפור בגרויות',
    'שיפור פסיכומטרי',
    'מתקבלים',
    'mitkablim'
  ],
  openGraph: {
    title: 'מתקבלים — מחשבון סכם ואופטימיזציית קבלה לאוניברסיטאות',
    description: 'גלה בדיוק לאילו תארים אתה מתקבל ואיך לשפר את הסכם לציון היעד במינימום מאמץ.',
    url: 'https://mitkablim.co.il',
    siteName: 'מתקבלים (Mitkablim)',
    locale: 'he_IL',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${interTight.variable} ${ibmPlex.variable} ${frankRuhl.variable} h-full antialiased`}>
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
