# משימת ליטוש UI/UX: יצירת קומפוננטת רשת 8 האוניברסיטאות (MultiUniversityAdmissionGrid)

> **חשוב - סביבת עבודה ב-Git:**
> משימה זו מתבצעת באופן בלעדי בבראנץ': `feature/sonnet-ui-polish`.
> יש לוודא שאינך נוגע ב-`main`. כל שינוי וקוד חדש ישמרו בבראנץ' זה בלבד.

היי סונט! אנחנו מפתחים מערכת מתקדמת לחישוב וסימולציית קבלה אקדמית בישראל (Next.js 14, Tailwind CSS, Lucide icons, עברית RTL).
המטרה שלך היא לבנות קומפוננטת React יפהפייה ומודרנית במיוחד בשם `MultiUniversityAdmissionGrid.tsx` שתחליף את הרשת הנוכחית של כרטיסיות האוניברסיטאות בסימולטור ה-What-If.

---

### דרישות עיצוב ו-UX (רמת גימור פרימיום - SaaS / Fintech Tier 1):
1. **כיווניות ושפה:** עברית מלאה, `dir="rtl"`.
2. **אסתטיקה מודרנית (Dark Mode):**
   - רקעים אלגנטיים כהים (`bg-slate-950/80` או `bg-slate-900/60`), מסגרות דקיקות (`border-slate-800`).
   - אפקטי Glassmorphism עדינים (`backdrop-blur-md`).
   - אפקטי Hover חיים (הארת מסגרת עדינה `hover:border-slate-700`, צללית רכה, הרמה עדינה `hover:-translate-y-0.5 transition-all duration-200`).
3. **הדגשת האוניברסיטה הנבחרת (`isTarget`):**
   - כרטיסייה שמסומנת כ-Target צריכה לבלוט בצורה יוקרתית (מסגרת ציאן זוהרת `border-cyan-500/60`, הילה רכה `shadow-lg shadow-cyan-500/10`, תגית "היעד שלך" בפינה העליונה).
4. **תצוגת ציונים והשוואת דלתא:**
   - ציון הסכם הנוכחי (גופן מודגש גדול). עבור הטכניון 2 ספרות אחרי הנקודה (למשל `91.45`), לשאר האוניברסיטאות ספרה אחת (`714.2`).
   - דלתא לעומת ציון הבסיס: אם יש שיפור (`delta > 0`), הצג תגית ירוקה בוהקת עם אייקון `TrendingUp` (למשל `+3.4 נק׳ סכם`).
   - ציון ממוצע הבגרות המיטבי של אותה אוניברסיטה (עם דלתא אם הבגרות עלתה).
   - תגית סוג הסכם: "סכם הנדסי" / "סכם כללי".
5. **קבלה ישירה ללא פסיכומטרי (`isDirectBagrutEligible`):**
   - אם האוניברסיטה מאפשרת קבלה ישירה על סמך הבגרות בסימולציה הנוכחית, הצג תגית בולטת: `⚡ זכאות לקבלה ישירה`.
6. **רספונסיביות מלאה:**
   - 2 עמודות במובייל קטן (`grid-cols-2`).
   - 3-4 עמודות בטאבלט (`sm:grid-cols-3 md:grid-cols-4`).
   - 4 עמודות במסכים גדולים / 8 עמודות במסכי Wide (`lg:grid-cols-4 xl:grid-cols-8`).

---

### ממשק ה-TypeScript הנדרש:

הקומפוננטה צריכה להיבנות בקובץ:
`src/components/flow/MultiUniversityAdmissionGrid.tsx`

```typescript
'use client';

import React from 'react';
import { TrendingUp, Sparkles, CheckCircle2, ChevronLeft } from 'lucide-react';

export interface InstitutionSimulatedState {
	institutionId: string;
	institutionName: string;
	logoText: string;
	badgeColor: string; // e.g. "from-blue-600 to-cyan-600"
	currentScore: number;
	baseScore: number;
	delta: number;
	bagrutAverage: number;
	bagrutDelta: number;
	isTarget: boolean;
	isTechnion: boolean;
	isDirectBagrutEligible?: boolean;
	sekemTypeLabel: string; // e.g. "סכם הנדסי" / "סכם כללי"
}

interface MultiUniversityAdmissionGridProps {
	institutions: InstitutionSimulatedState[];
	selectedInstitutionId?: string;
	onSelectInstitution?: (institutionId: string) => void;
}

export default function MultiUniversityAdmissionGrid({
	institutions,
	selectedInstitutionId,
	onSelectInstitution
}: MultiUniversityAdmissionGridProps) {
	// המימוש שלך כאן...
}
```

אנא צור את הקוד המלא, הנקי והמוכן לשימוש ישירות בקובץ `src/components/flow/MultiUniversityAdmissionGrid.tsx`.
