# תוכנית: סימולטור חדש (מחליף את What-If)

סטטוס: **תכנון בלבד, טרם מומש** (2026-10-17). בסיס: `main`. העיצוב של `ui/apple-design-2` לא בשימוש.

## מטרה
סימולטור בסגנון מחשבון סכמים: משנים ציונים בצד אחד, ורואים מיד את ההשפעה על כמה תארים במקביל.
כל תואר מחושב **רק** במחשבון של המוסד שלו — הממשק לא מחשב כלום בעצמו.

## פריסה (RTL)
```
┌──────────────── שמאל ────────────────┬──────────── ימין ────────────┐
│ [▼ הוסף תואר מהסל]                   │ ┌ פסיכומטרי (200–800) ─────┐ │
│ ┌ כרטיס תואר ┐ ┌ כרטיס תואר ┐        │ └──────────────────────────┘ │
│ │ סכם נוכחי   │ │ סכם נוכחי   │        │ ┌ מתמטיקה 5 יח'   ███░░ 87 ┐ │
│ │ סכם יעד  ✕  │ │ סכם יעד  ✕  │        │ ┌ אנגלית 5 יח'    ████░ 92 ┐ │
│ └─────────────┘ └─────────────┘        │ ...  [+ הוסף מקצוע]          │
└────────────────────────────────────────┴──────────────────────────────┘
```
- **ימין למעלה:** כרטיס הפסיכומטרי.
- **ימין מתחת:** כרטיס לכל בגרות של המשתמש, וכפתור להוספת מקצוע.
- **שמאל:** רשימה נפתחת מעל אזור התארים. היא מציגה רק תארים מסל היעדים (`selectedTargets` ב-`src/app/flow/page.tsx`) שעוד לא נוספו לסימולטור. מתחתיה כרטיסי התארים, ולכל כרטיס כפתור הסרה.
- **מובייל (<768px):** התארים מוצמדים למעלה (sticky, גלילה אופקית), והבגרויות מתחתם.

## כרטיס בגרות = סליידר
- הכרטיס עצמו הוא הסליידר: הרקע מתמלא מימין לשמאל לפי הציון. גרירה שמאלה מעלה את הציון.
- טווח 0–100, צעד 1. הפסיכומטרי בטווח 200–800, צעד 1.
- סימון ויזואלי לציון נכשל, מתחת לסף המעבר (55 בבגרות).
- תמיכה בגרירה, בקליק, במקלדת (חצים, Home/End) ובמגע: `role="slider"` עם `aria-valuenow`. דרך pointer events, בלי ספרייה חיצונית.
- בורר יחידות (3/4/5) בתוך הכרטיס, למקצועות שבהם יש בחירה.
- **ירוק:** כרטיס שהציון או היחידות שלו שונים מהפרופיל המקורי, או מקצוע שנוסף בסימולטור. כפתור "אפס" מחזיר לפרופיל המקורי.
- מקצוע שנוסף אפשר גם להסיר.

## כרטיס תואר
- שם התואר, המוסד (לוגו), **סכם נוכחי** ו**סכם יעד**.
- סכם נוכחי = הסכם לפי הערכים שבסימולטור כרגע. סכם יעד = סף הקבלה של התואר.
- תואר בלי סף (קבלה לפי תנאים בלבד, למשל מתמטיקה ב-BGU, `conditionsOnly`): מציג "קבלה לפי תנאי סף" במקום סכם יעד.
- בלי צבעי סטטוס ובלי פירוט נוסף. המשתמש ביקש רק את שני המספרים.

## מנוע החישוב (החלק הקריטי)
פונקציה טהורה אחת, `src/modules/simulator/evaluate.ts`:
```ts
evaluateProgramsForScenario(scenario: { psychometric, subjects: SubjectInput[] }, programs: ProgramRef[])
  → Array<{ programId, currentSekem: number | null, targetSekem: number | null }>
```
- לכל תואר: `calculateInstitution(program.institutionId, input)` ואחר כך `selectProgramSekem(result, program.sekemType, institutionId)`. אלה מה-`src/modules/calculators/index.ts` הקיימים.
- מסלולים מיוחדים שהמחשבונים כבר מטפלים בהם (טבלת בונוסים לפי מוסד, מקצוע בלי בונוס, ארכיטקטורה ונוף בטכניון, מסלול ההנדסה באריאל, משקלות חיפה) עוברים דרך אותו מסלול חישוב, בלי לוגיקה מקבילה בממשק.
- **לבדוק לפני כתיבה:** יש שתי פונקציות `evaluateSimulatedSekem`, אחת ב-`src/modules/optimizer/solver.ts` ואחת ב-`src/utils/analysis/trackGenerator.ts`. ה-What-If הקיים משתמש גם ב-`calculateMultiInstitutionSekem` מ-`src/utils/calculators/multiCalculator`. צריך לבחור מקור אמת אחד, את מה שה-What-If משתמש בו היום, ולוודא שהוא שווה ל-`calculateInstitution` + `selectProgramSekem`. אם יש פער, מתקנים אותו שם ולא בממשק.
- פירוק הפסיכומטרי לחלקים (`simulateRealisticSubscores`) נשאר כמו ב-What-If הקיים.
- מקבץ אחד של קלט לכל מוסד: מחשבים פעם אחת לכל מוסד, ואז בוחרים סכם לכל תואר.

## קבצים
- חדש: `src/modules/simulator/evaluate.ts` + `__tests__/evaluate.test.ts`.
- חדש: `src/components/simulator/` — `ScenarioSimulator.tsx` (פריסה + state), `GradeSliderCard.tsx`, `PsychometricCard.tsx`, `ProgramResultCard.tsx`, `ProgramPicker.tsx`.
- החלפה: השימושים ב-`WhatIfSimulator` ב-`GapAnalysisCard.tsx:248` וב-`RecommendedTracksView.tsx:1554`. צריך לשמור את `onApplyScenario`, `onSaveCustomTrack` ו-`activeTrack` (טעינת מסלול מומלץ, `applyTrackToSimulatorState`), כדי שהסימולטור "יעבוד אותו דבר".
- מחיקה: `WhatIfSimulator.tsx`, אחרי שאין לו יותר שימושים. `MultiUniversityAdmissionGrid` נשאר אם יש לו שימוש אחר.
- טקסט ב-`TrackRegistrationGate.tsx:195` ("סימולטור What-If") יעודכן.

## בדיקות
1. **שקילות:** לכל אחד מ-8 המוסדות, ולכל סוג סכם בתוכו, `evaluateProgramsForScenario` מחזיר בדיוק את מה ש-`calculateInstitution` + `selectProgramSekem` מחזירים לאותו קלט.
2. **אותה תוצאה כמו ה-What-If הישן:** כמה פרופילים קבועים, לפני ההחלפה.
3. **מקרי קצה:** תואר `conditionsOnly`, מקצוע שנוסף, שינוי יחידות, ציון 0 ו-100, פסיכומטרי 200 ו-800.
4. `npx tsx --test src/modules/*/__tests__/*.test.ts`, `npx tsc --noEmit`, `npm run build`.
5. בדיקה בדפדפן: גרירה, מקלדת, מובייל, צבע ירוק, הוספה והסרה של תואר.

## שלבי עבודה
1. ענף `feat/scenario-simulator` מ-`main`.
2. מנוע + בדיקות שקילות (בלי ממשק).
3. `GradeSliderCard` + `PsychometricCard`.
4. `ProgramPicker` + `ProgramResultCard`.
5. `ScenarioSimulator` + חיבור במקום What-If, כולל טעינת מסלול מומלץ ושמירת מסלול.
6. מחיקת ה-What-If הישן, בדיקות, בנייה, בדיקה בדפדפן.
7. מיזוג ל-main רק אחרי אישור המשתמש.

## הערות
- תיקוני הטכניון בענף `fix/technion-architecture-and-subjects` עוד לא ב-main. כדאי למזג אותם קודם, כדי שהסימולטור יחשב ארכיטקטורה ונוף נכון.
- כלל הרחבת 2→5 יחידות לא מאומת. לא משנים את המתמטיקה של הסימולטור בלי מקור רשמי.
