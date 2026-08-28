import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';
import { PlannerProvider } from '../context/PlannerContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  variable: '--font-rubik',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Study Planner - Waze של הלמידה לבגרויות ופסיכומטרי',
  description: 'פלטפורמת למידה אדפטיבית לחישוב מסלול מחדש, אופטימיזציית סכם קבלה ותכנון לו״ז חכם למועמדי אקדמיה בישראל.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
        <PlannerProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </PlannerProvider>
      </body>
    </html>
  );
}
