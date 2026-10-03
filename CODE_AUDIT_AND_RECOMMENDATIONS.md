# 📋 דוח ביקורת עומק הנדסי, ליקויים והמלצות לפיתוח (Code & Architecture Audit)

> **מיועד עבור:** Claude Code / כל סוכן AI או מפתח המוביל את הפיתוח בפרויקט Kalis (מתקבלים).  
> **תאריך עריכה:** 2026-10-03  
> **נכתב על ידי:** Antigravity (Google DeepMind)  
> **ענף פעיל:** `main` (בסנכרון מלא מול `origin/main`, ללא שינויי קוד לא מחויבים)  
> **סטטוס איכות נוכחי:** `tsc --noEmit` נקי (0 שגיאות), 224/224 בדיקות יחידה ו-QA עוברות, `npm run build` נקי (35/35 נתיבים).

---

## 📌 1. תקציר מנהלים (Executive Summary)

פרויקט **Kalis (מתקבלים)** הוא פלטפורמה עתירת לוגיקה ומתמטיקה לתכנון ואופטימיזציה של סיכויי קבלה ל-8 האוניברסיטאות בישראל.  
הפרויקט כולל **נכסים מתמטיים והנדסיים ברמה גבוהה מאוד**:
* 8 מחשבוני מוסדות טהורים ודטרמיניסטיים עם חוקי השמטה ובונוסים מדויקים.
* תשתית אבטחה וניהול Sessions חזקה (HMAC-SHA256, HttpOnly, TimingSafe, Scrypt).
* תוסף כרום (v1.2.0) עם DataGuard למניעת הזנת ניחושים.
* שפת עיצוב עריכתית יוקרתית (Warm Editorial) מותאמת RTL.

**יחד עם זאת, זוהו מספר צווארי בקבוק ארכיטקטוניים, ביצועיים ותחזוקתיים משמעותיים:**
1. **טעינת 1.88MB של JSON לקליינט:** יוצרת קובץ JS של 1.5MB בכל כניסה לאתר, למרות שקיים Endpoint מוכן (`GET /api/programs`).
2. **פיצול כפול של מנוע האופטימיזציה:** קיימים שני מנועים מקבילים (`src/utils/analysis/trackGenerator.ts` של 95KB ו-`src/modules/optimizer/trackEngine.ts` של 34KB) שאינם מסונכרנים.
3. **מודל ה-DB בזיכרון (In-Memory Singleton Cache):** `ensureSyncedFromSQLite` לא מתרענן בזמן ריצה.
4. **קוד זומבי ישן שנבנה בפרודקשן:** `/optimizer` ו-`PlannerContext` עם נתוני דמה (`mockData.ts`) עדיין קיימים ופעמון ה-Navbar קשור אליהם.
5. **קומפוננטות מונוליתיות ענקיות (2,000+ שורות כל אחת):** `RecommendedTracksView.tsx`, `WhatIfSimulator.tsx`, `flow/page.tsx`.
6. **נוסחאות סכם לא מאומתות ב-100%:** בר-אילן ואריאל מוגדרות בקוד כאומדן (Estimate).

להלן הפירוט הטכני המלא והמדויק של כל ממצא, כולל שמות קבצים, שורות קוד והמלצות לפתרון.

---

## 💎 2. מה מצוין ועובד מעולה בקוד? (Keep & Protect)

כל סוכן או מפתח שעובד על הקוד **חייב להישמר מפגיעה בחלקים אלה**:

### א. מחשבוני מוסדות טהורים (`src/modules/calculators/`)
* **דטרמיניזם והפרדת סמכויות:** המחשבונים (`technion.ts`, `tau.ts`, `huji.ts`, `bgu.ts`, `haifa.ts`, `ariel.ts`, `barIlan.ts`, `reichman.ts`) אינם תלויים ב-React או ב-DB. הם מקבלים קלט ומחזירים פלט מתמטי מדויק.
* **חוקי נשירה והשמטה חוקית (`optimalAverage.ts`):** שומר בקפדנות על רצפת 20 יח"ל חוקיות ומקצועות חובה (אזרחות, היסטוריה, הבעה, מתמטיקה, אנגלית) ומשמיט מקצועות בחירה שמורידים את הממוצע.
* **התאמה מלאה למחשבונים הרשמיים:**
  * **הטכניון:** $S = 0.5D + 0.075P - 19$, זיהוי אשכול מדעי (5 מתמטיקה + 2 מדעים מקנים בונוס 30), תקרה של 119 לממוצע.
  * **תל אביב:** בונוס ריאלי (+10) להנדסה/מדמ"ח רק עם 5 מתמטיקה ו-5 פיזיקה ($\ge 55$), שימוש בלעדי בסכם רב-תחומי (התאמה של 100% למחשבון את"א).
  * **העברית:** נרמול ציוני תקן ($B, P$) ומודל שקלול כפול (50/50 מול 30/70).

### ב. תשתית האבטחה וה-Auth (`src/lib/session.ts`, `src/lib/authUtils.ts`)
* **עוגיות חתומות ללא שמירת State שביר בשרת:** העוגייה `kalis_session` נחתמת ב-HMAC-SHA256, מוגדרת כ-HttpOnly, Secure ו-SameSite=Lax.
* **מניעת זיוף זהות:** זהות המשתמש נגזרת אך ורק מהעוגייה המאומתת ולא משום פרמטר ב-Request body/query.
* **הצפנה מתקדמת:** שימוש ב-`crypto.scryptSync` עם Salt ייחודי של 16 בתים ובדיקת `crypto.timingSafeEqual`.
* **Google Auth:** אימות מלא מול Google API כולל `aud === clientId`, בדיקת `iss` ואימות `email_verified`.
* **אבטחת גיבוי DB (`src/app/api/backup/route.ts`):** דורש Token באורך 32+ תווים ומחזיר 404 בהיעדר הרשאה למניעת סריקות.

### ג. אפיקי הקבלה העוקפים של הטכניון (`officialRoutes.ts`, `excellentBagrut.ts`)
* תמיכה באפיק "בגרות מצוינת" (קבלה ללא פסיכומטרי), בחינת סיווג במתמטיקה, גשר קבלה, ראויים לקידום, ואפיק מקוצר. לוגיקה ייחודית ומבוססת מקורות רשמיים.

### ד. שפת עיצוב עריכתית (Warm Editorial)
* קנבס חם (`#FAF8F5`), מסגרות רכות (`#E5DFD4`), כפתורי אנתרציט מט (`#3C3C3C`), סמלי וקטור SVG רשמיים של כל המוסדות, ותיקון כיווניות החצים ב-`dir="ltr"` ($680 \to 758$).

---

## 🚨 3. ליקויים קריטיים, ארכיטקטורה וצווארי בקבוק (Critical Issues)

---

### 🔴 ליקוי 1: פיצול כפול של מנוע האופטימיזציה (Dual Optimization Engine)
* **מיקומים:**
  * מנוע לקוח (UI): `src/utils/analysis/trackGenerator.ts` (**95KB / 2,251 שורות**).
  * מנוע שרת (API): `src/modules/optimizer/trackEngine.ts` (**34KB / 759 שורות**).
* **הבעיה:**
  * דף הוויזארד הראשי (`src/app/flow/page.tsx` שורה 54, 784) מריץ את `generatePersonalizedTracks` מתוך `trackGenerator.ts` **ישירות בדפדפן הלקוח**.
  * ה-API השרתי (`src/app/api/tracks/generate/route.ts` שורה 3) מריץ את `generateOptimizedActionTracks` מתוך `src/modules/optimizer/trackEngine.ts`.
  * **השלכות חמורות:** חוסר סנכרון אלגוריתמי! לדוגמה, מודל תקרת הפסיכומטרי (`reachabilityModel.ts`) בשרת מגביל ציונים של 700+ לזינוק של 20 נקודות, בעוד שב-`trackGenerator.ts` פונקציית `getRealisticPsychometricCeiling` משתמשת בקפיצות של עד 100 נקודות וחיתוכים שונים לגמרי. כל תיקון שנעשה במנוע אחד לא קיים במנוע השני.
* **הפתרון הנדרש מקלוד:**
  לאחד את מנוע האופטימיזציה למודול שרתי מוסמך יחיד תחת `src/modules/optimizer/`. לגרום ל-`/flow` לצרוך את המסלולים מהשרת (או מפונקציה מוסמכת משותפת אחת ללא כפילות).

---

### 🔴 ליקוי 2: ניפוח ה-Bundle ב-1.5MB עקב ייבוא JSON בקליינט
* **מיקומים:**
  * `src/data/academicData.json` (קובץ של **1.88 מגה-בייט**).
  * מיובא ישירות בקומפוננטות Client (`'use client'`):
    * `src/components/flow/DegreeSearchSelector.tsx` (שורה 14)
    * `src/components/calculator/AdmissionPanel.tsx` (שורה 5)
    * `src/app/optimizer/page.tsx` (שורה 28)
* **הבעיה:**
  * Webpack מקמפל את כל ה-1.88MB JSON ישירות לתוך קובץ ה-Chunk של הדפדפן (`.next/static/chunks/733-aa1c296f44fc2e1e.js` שוקל **1.5MB JS נקי!**).
  * כל משתמש שנכנס לאתר (במיוחד במובייל) מוריד מגה-בייט וחצי של נתונים סטטיים, מה שפוגע קשות ב-LCP ובביצועי הדפדפן.
  * **האבסורד:** ה-API כבר מכיל נתיב שרתי מעולה ומהיר: `GET /api/programs` (`src/app/api/programs/route.ts`) עם חיפוש, סינון מוסדות, סינון תחומים ו-Pagination (`limit`, `offset`), אך **הקליינט מתעלם ממנו לחלוטין** ומסנן את כל 721 התארים בזיכרון של הדפדפן!
* **הפתרון הנדרש מקלוד:**
  לחבר את `DegreeSearchSelector` ל-`GET /api/programs` עם Debounce של 250ms וטעינה מדורגת (Pagination של 20-30 פריטים). לבטל לחלוטין את ייבוא `academicData.json` בקומפוננטות Client. הקטנת ה-Bundle תעמוד על כ-**80%**!

---

### 🔴 ליקוי 3: Singleton בזיכרון וחוסר סנכרון עם ה-DB (In-Memory Cache Staling)
* **מיקום:**
  * `src/modules/db/repository.ts` (שורות 270–345).
* **הבעיה:**
  * `KalisDatabaseRepository` טוען את הנתונים ל-Map בזיכרון ומסמן:
    ```typescript
    private isSyncedFromDB = false;
    public async ensureSyncedFromSQLite(): Promise<void> {
        if (this.isSyncedFromDB) return;
        await this.syncFromSQLite();
    }
    ```
  * ברגע שהשרת עולה, `isSyncedFromDB` הופך ל-`true` ולעולם אינו מתאפס. עדכונים במסד הנתונים (`dev.db` או הרצת Seed) **אינם משתקפים באתר החי** אלא אם מפעילים מחדש את השרת (Restart מלא לקונטיינר/תהליך).
* **הפתרון הנדרש מקלוד:**
  להוסיף מנגנון Cache Invalidation (כגון פונקציית `invalidateCache()`, בדיקת גרסה/Timestamp מול ה-DB, או מעבר לשאילתות Prisma ישירות עם אינדקסים).

---

### 🔴 ליקוי 4: קוד זומבי ישן שנבנה לפרודקשן (Dead / Legacy Code)
* **מיקומים:**
  1. `src/app/optimizer/page.tsx` (**64KB, 857 שורות**): דף וויזארד ישן המבוסס על נתוני דמה (`mockData.ts`). הוא הוחלף מזמן ב-`/flow`, אינו מקושר באף מקום באתר, אך עדיין נבנה כנתיב ציבורי פעיל (`/optimizer`).
  2. `src/context/PlannerContext.tsx` (**250 שורות**): קונטקסט של נתוני דמה (`INITIAL_CURRICULUM`, `INITIAL_TASKS`).
  3. **פעמון ההתראות ב-Navbar:**
     ב-`src/components/layout/Navbar.tsx` (שורה 28):
     ```typescript
     const { recalculationPending, recalculationReason, recalculateRoute } = usePlanner();
     ```
     פעמון ההתראות מקשיב ל-`usePlanner` של נתוני הדמה ולא למסלולים האמיתיים של המשתמש ב-`/flow`!
  4. `task_for_sonnet.md`: קובץ הוראות ישן שנשאר בשורש הפרויקט.
* **הפתרון הנדרש מקלוד:**
  למחוק את `/optimizer` ו-`PlannerContext`, לנקות את התלות של ה-Navbar בהם, ולחבר את פעמון ההתראות לנתוני המסלולים והמשתמש האמיתיים (או להסיר את הפעמון אם אינו נדרש כרגע).

---

### 🔴 ליקוי 5: קומפוננטות ענק מונוליתיות (2,000+ שורות)
* **מיקומים:**
  * `src/components/flow/RecommendedTracksView.tsx`: **2,051 שורות (92KB)**!
  * `src/components/flow/WhatIfSimulator.tsx`: **2,143 שורות (86KB)**!
  * `src/app/flow/page.tsx`: **1,737 שורות (73KB)**!
  * `src/components/calculator/UnifiedCalculator.tsx`: **1,400+ שורות (61KB)**!
* **הבעיה:**
  * קומפוננטות ענק (God Components) מקשות מאוד על איתור באגים, מעמיסות על ה-Virtual DOM וגורמות ל-Re-renders מיותרים של מאות אלמנטים בכל שינוי סליידר קטן.
* **הפתרון הנדרש מקלוד:**
  לפרק את הקומפוננטות לתת-רכיבים עצמאיים:
  * ב-`RecommendedTracksView`: חילוץ `TrackCard.tsx`, `ConcurrentGanttMatrix.tsx`, `TrackDrawer.tsx`.
  * ב-`WhatIfSimulator`: חילוץ `SubjectSliderItem.tsx`, `PsychometricSliders.tsx`, `SimulatorSummaryHeader.tsx`.

---

### 🔴 ליקוי 6: נוסחאות סכם לא מאומתות בבר-אילן ובאריאל
* **מיקומים:**
  * `src/modules/calculators/barIlan.ts` (שורה 4):  
    `⚠️ Sekem formula NOT verified — Bar-Ilan's real admission score is on a ~0–100 scale; this is an estimate.`
  * `src/modules/calculators/ariel.ts` (שורה 4):  
    `⚠️ NOT VERIFIED against an official source — bonus table, mandatory subjects and sekem formula are estimates.`
* **הבעיה:**
  * שתי האוניברסיטאות הללו מכילות נוסחאות משוערכות ולא נוסחאות רשמיות מאומתות 1:1 כמו שאר 6 המוסדות.
* **הפתרון הנדרש מקלוד:**
  ביצוע איסוף Probe Data מהמחשבונים הרשמיים של בר-אילן ואריאל (כפי שנעשה בטכניון, ת"א ורייכמן) וכיול הנוסחאות לדיוק מוחלט.

---

### 🔴 ליקוי 7: כשל בהרצת טסטי ה-API עקב Path Alias (`@/`) ב-jiti
* **מיקומים:**
  * `src/modules/api/__tests__/api.test.ts`
  * `src/modules/api/__tests__/auth.test.ts`
  * `src/modules/api/__tests__/institutionsThresholds.test.ts`
  * `src/modules/api/__tests__/savedTracks.test.ts`
* **הבעיה:**
  * הרצת `node --test --import jiti/register src/modules/*/__tests__/*.test.ts` נכשלת ב-4 קבצים אלו בשגיאה `Cannot find module '@/modules/db'`.
  * `jiti` לבדו אינו ממפה את ה-`paths` של `tsconfig.json` עבור קובצי שרת שמיובאים ישירות בטסט.
* **הפתרון הנדרש מקלוד:**
  להגדיר סקריפט בדיקות ייעודי עם פותר נתיבים תואם (למשל `tsx --test` או שימוש בנתיבים יחסיים בתוך קובצי הטסט).

---

## 🟡 4. נקודות נוספות לייעול ושיפור (Enhancements)

1. **דרישות קדם לתארים (Prerequisites) ב-`gapAnalyzer.ts`:**
   * שורות 239–272 מכילות חוק גלובלי משוער ("5 יח"ל 70+ או 4 יח"ל 85+" לכל תואר מדעי).
   * יש לקרוא את הדרישות הספציפיות מקטלוג התוכניות (`minMathUnits`, `minMathGrade`, `requiresPhysics`).
2. **אפיק מעבר (האוניברסיטה הפתוחה) אינו מוצג במלואו:**
   * הקובץ `src/modules/optimizer/bypassRoutesEngine.ts` כולל מיפוי עשיר של קורסי אפיק מעבר, נקודות זכות וציונים נדרשים.
   * ב-UI המשתמש רואה רק קישור חיצוני גנרי. כדאי להציג את פירוט הקורסים מתוך המנוע ישירות בלשונית האפיקים העוקפים.
3. **בדיקת בונוס BGU עבור ציון 60:**
   * ב-`bgu.ts` (שורה 43): `if (subject.grade <= 60) return 0;` (ציון 60 אינו מקבל בונוס).
   * בשאר האוניברסיטאות: `if (subject.grade < 60) return 0;` (ציון 60 מקבל בונוס).
   * מומלץ לאמת מול לשון הידיעון הרשמי של אוניברסיטת בן-גוריון.
4. **סתירה בטבלת הבונוסים ב-`PROJECT_MASTER_GUIDE.md`:**
   * בטבלה מצוין שמתמטיקה 5 יח"ל בחיפה וברייכמן מקבלת בונוס +30.
   * בקוד בפועל (`haifa.ts` שורה 54, `reichman.ts` שורה 46) הבונוס הוא **+35**. יש לסנכרן את מסמך המאסטר.
5. **משתנים מחושבים שאינם בשימוש ב-TAU:**
   * ב-`tau.ts` שורות 108–113: המשתנים `explicitQuant`, `rawQuant`, `quant` מחושבים אך לא נעשה בהם שימוש כי את"א משתמשת בסכם רב-תחומי בלבד. יש לנקות קוד מת זה.
6. **Rate Limiter בזיכרון:**
   * ב-`src/lib/rateLimit.ts` ה-Rate Limiter מבוסס Map מקומי בזיכרון. לקראת Scale מרובה שרתים או מעבר ל-Serverless מומלץ לחברו ל-Redis/Upstash.

---

## 🗺️ 5. תוכנית עבודה מומלצת לפי שלבים (Roadmap for Claude)

### 🚀 שלב 1: שיפור ביצועים דרמטי וצמצום ה-Bundle (Quick Win ענק)
* [ ] יצירת פונקציית Fetch לקריאה ל-`GET /api/programs` מתוך `DegreeSearchSelector.tsx`.
* [ ] הוספת מנגנון Debounce (250ms) ושליפה מדורגת (Pagination של 20-30 פריטים בכל פעם).
* [ ] הסרת הייבוא הישיר של `academicData.json` מ-`DegreeSearchSelector.tsx` ומ-`AdmissionPanel.tsx`.
* [ ] הרצת `npm run build` ובדיקה שגודל ה-Bundle ירד מ-1.5MB לפחות מ-300KB!

### ⚙️ שלב 2: איחוד מנוע האופטימיזציה (Architecture Consolidation)
* [ ] השוואה מדוקדקת בין `src/utils/analysis/trackGenerator.ts` ל-`src/modules/optimizer/trackEngine.ts`.
* [ ] מיזוג כל הפיצ'רים העדכניים (שלילת מקצועות מושמטים, בדיקת חלופה לבחינה בודדת, תקרת פסיכומטרי) למודול מרכזי אחד ב-`src/modules/optimizer/`.
* [ ] הפניית `flow/page.tsx` לקריאה ל-API השרתי או למודול המאוחד.
* [ ] מחיקת הכפילות והבטחת תוצאות אופטימיזציה זהות לחלוטין בין הקליינט לשרת.

### 🧹 שלב 3: ניקוי קוד זומבי והיגיינת פרויקט
* [ ] מחיקת הנתיב הישן `src/app/optimizer/page.tsx`.
* [ ] מחיקת `src/context/PlannerContext.tsx` ונתוני הדמה שאינם בשימוש ב-`mockData.ts`.
* [ ] ניקוי פעמון ההתראות ב-`Navbar.tsx` (ניתוק מ-`usePlanner` וחיבור למסלולים אמיתיים).
* [ ] מחיקת קובצי הנחיה ישנים כגון `task_for_sonnet.md`.

### 🧩 שלב 4: פירוק קומפוננטות הענק המונוליתיות
* [ ] פירוק `RecommendedTracksView.tsx` (2,051 שורות) ל-`TrackCard.tsx`, `GanttTimeline.tsx`, `TrackExplanationDrawer.tsx`.
* [ ] פירוק `WhatIfSimulator.tsx` (2,143 שורות) לרכיבי סליידרים אטומיים.
* [ ] הבטחת ביצועי רינדור חלקים ללא Re-renders מיותרים של כל המסך.

### 🎯 שלב 5: דיוק דרישות סף ונוסחאות מוסדיות
* [ ] איסוף דרישות מתמטיקה ופיזיקה רשמיות לתארים בתל אביב, בן-גוריון והטכניון והחלפת הכללים הגלובליים ב-`gapAnalyzer.ts`.
* [ ] כיול ואימות נוסחאות הסכם של בר-אילן ואריאל מול נתוני אמת.
* [ ] סנכרון מסמך `PROJECT_MASTER_GUIDE.md` מול קוד המחשבונים בפועל.

---

## 🔒 6. הנחיות בטיחות לקלוד (Safety Guidelines for Execution)
1. **אפס שבירת בדיקות:** אחרי כל שינוי, יש להריץ:
   * `npx tsc --noEmit`
   * `node --test --import jiti/register src/modules/calculators/__tests__/*.test.ts`
   * `node --test src/modules/qa/__tests__/extensionDataGuard.test.ts`
   * `npm run build`
2. **שמירה על לוג הסשן:** לעדכן את `SESSION_LOG.md` באופן שוטף תוך כדי העבודה.
3. **שמירה על הדיוק המתמטי:** לא לשנות שום חישוב במחשבונים הטהורים ללא אימות מול המחשבון המוסדי הרשמי.
