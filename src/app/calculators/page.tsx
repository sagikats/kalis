import React, { Suspense } from 'react';
import UnifiedCalculator from '@/components/calculator/UnifiedCalculator';
import { Calculator } from 'lucide-react';

export const metadata = {
     title: 'מחשבון סכם אחוד לאוניברסיטאות בישראל | Kalis',
     description: 'מחשבון סכם רשמי והשוואתי לכל 8 האוניברסיטאות בישראל: תל אביב, הטכניון, העברית, בן-גוריון, בר-אילן, חיפה, אריאל ורייכמן בהזנה חד-פעמית.'
};

function CalculatorLoadingFallback() {
     return (
          <div className="min-h-screen bg-[#FAF8F5] text-[#222222] flex flex-col items-center justify-center p-6 space-y-4 dir-rtl">
               <div className="p-4 rounded-3xl bg-white border border-[#E5DFD4] text-[#222222] shadow-xs animate-pulse">
                    <Calculator className="h-8 w-8 text-blue-700" />
               </div>
               <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-[#222222]">טוען מחשבון סכם אחוד...</h3>
                    <p className="text-xs text-[#66635C]">מכין את נוסחאות הסכם הרשמיות של כל האוניברסיטאות בישראל</p>
               </div>
          </div>
     );
}

export default function CalculatorsHubPage() {
     return (
          <Suspense fallback={<CalculatorLoadingFallback />}>
               <UnifiedCalculator />
          </Suspense>
     );
}
