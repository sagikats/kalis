import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';
import { PlannerProvider } from '../context/PlannerContext';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AuthModal from '../components/auth/AuthModal';

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  variable: '--font-rubik',
  display: 'swap',
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
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col bg-[#06070a] text-slate-100 selection:bg-cyan-500 selection:text-black">
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
