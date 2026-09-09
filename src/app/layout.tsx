import type { Metadata } from 'next';
import { Inter_Tight, Heebo } from 'next/font/google';
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

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Kalis (קליס) — ארכיטקטורת קבלה ואופטימיזציית סכם לאוניברסיטאות',
  description: 'פלטפורמת אופטימיזציית קבלה לאקדמיה הראשונה בישראל. מנוע מתמטי רב-מוסדי ל-8 האוניברסיטאות, ניתוח פערי קבלה ומסלולי שיפור אופטימליים.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${interTight.variable} ${heebo.variable} h-full antialiased`}>
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
