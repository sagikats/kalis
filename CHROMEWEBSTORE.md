# Chrome Web Store Listing — מתקבלים AutoFill

> Last Updated: 2026-09-25

## Store Listing

**Extension Name** [REQUIRED]
מתקבלים — אימות סכם אוטומטי במחשבוני האוניברסיטאות

**Short Description** [REQUIRED]
ממלא אוטומטית ציוני בגרות ופסיכומטרי במחשבוני הסכם של 8 האוניברסיטאות בישראל ישירות מתוך אתר מתקבלים.

**Detailed Description** [REQUIRED]
תוסף רשמי של פלטפורמת מתקבלים (kalis) המאפשר אימות מידי של סיכויי הקבלה וחישוב הסכם מול אתרי האוניברסיטאות הרשמיים בישראל.

תכונות מרכזיות:
- מילוי אוטומטי של ציוני בגרות, יחידות לימוד ומקצועות מוגברים במחשבון האוניברסיטה.
- הזנה אוטומטית של ציון הפסיכומטרי הרב-תחומי וציוני היעד של מסלול השיפור.
- תמיכה מלאה במחשבוני 8 האוניברסיטאות בישראל: הטכניון, אוניברסיטת תל אביב, האוניברסיטה העברית, בן-גוריון, בר-אילן, חיפה, אריאל ורייכמן.
- סרגל אימות צף המציג את הסכם הצפוי ומאפשר העתקה מהירה של ציונים בלחיצה אחת.
- התאמה ייעודית למבנה הטפסים של כל מוסד (כולל תמיכה באפליקציות React וטפסי חישוב מתקדמים).

איך משתמשים בתוסף:
1. נכנסים לפלטפורמת מתקבלים (mitkablim.co.il או בסביבת הפיתוח).
2. בונים או בוחרים מסלול שיפור מומלץ לתואר הרצוי.
3. לוחצים על כפתור ״אימות מול [שם המוסד]״ ובוחרים ״הזן ציונים ופתח במחשבון המוסד״.
4. המחשבון הרשמי של האוניברסיטה ייפתח בלשונית חדשה, והתוסף יזין בו את כל הנתונים בלייב!

פרטיות ואבטחת מידע:
התוסף אינו שולח נתונים אישיים לשום שרת חיצוני. כל הנתונים מועברים מקומית בלבד בין הלשונית של אתר מתקבלים לבין הלשונית של מחשבון האוניברסיטה באמצעות זיכרון הדפדפן המקומי (chrome.storage.local) ונמחקים מיד לאחר ההזנה.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
הזנה אוטומטית של ציוני בגרות ופסיכומטרי במחשבוני הקבלה של האוניברסיטאות בישראל לצורך אימות סכם.

**Primary Language** [REQUIRED]
Hebrew

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `chrome-extension/icons/icon-128.png` |
| Small Icon | 48×48 PNG | ✅ Ready | `chrome-extension/icons/icon-48.png` |
| Mini Icon | 16×16 PNG | ✅ Ready | `chrome-extension/icons/icon-16.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ⬜ Pending capture | `assets/store-screenshot-1.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ Pending capture | `assets/store-screenshot-2.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Pending capture | `assets/promo-small.png` |
| Marquee Promo Tile | 1400×560 | ⬜ Pending capture | `assets/promo-marquee.png` |

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | שמירה מקומית זמנית של נתוני הציונים שהמשתמש בחר להעביר למחשבון האוניברסיטה בלשונית החדשה. |
| `tabs` | permissions | פתיחת לשונית חדשה של מחשבון האוניברסיטה ומעבר בינה לבין לשונית מתקבלים. |
| `activeTab` | permissions | הפעלת סקריפט ההזנה בלשונית הפעילה של מחשבון האוניברסיטה. |
| `*://*.mitkablim.co.il/*` | host_permissions | זיהוי פעולת המשתמש באתר מתקבלים והעברת חבילת הציונים לאימות. |
| `http://localhost/*` | host_permissions | תמיכה בסביבת פיתוח ובדיקות מקומיות של מתקבלים. |
| `*://*.technion.ac.il/*` | host_permissions | הזנת ציוני בגרות ופסיכומטרי בטופס מחשבון הסכם הרשמי של הטכניון. |
| `*://*.tau.ac.il/*` | host_permissions | הזנת ציוני בגרות ופסיכומטרי במחשבון סיכויי הקבלה של אוניברסיטת תל אביב. |
| `*://*.huji.ac.il/*` | host_permissions | הצגת סרגל אימות והזנת ציונים במחשבון הסכם של האוניברסיטה העברית בירושלים. |
| `*://*.bgu.ac.il/*` | host_permissions | הצגת סרגל אימות והזנת ציונים במחשבון של אוניברסיטת בן-גוריון בנגב. |
| `*://*.biu.ac.il/*` | host_permissions | הצגת סרגל אימות והזנת ציונים במחשבון של אוניברסיטת בר-אילן. |
| `*://*.haifa.ac.il/*` | host_permissions | הצגת סרגל אימות והזנת ציונים במחשבון של אוניברסיטת חיפה. |
| `*://*.ariel.ac.il/*` | host_permissions | הצגת סרגל אימות והזנת ציונים במחשבון של אוניברסיטת אריאל. |
| `*://*.runi.ac.il/*` | host_permissions | הצגת סרגל אימות והזנת ציונים במחשבון של אוניברסיטת רייכמן. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No.
התוסף אינו אוסף ואינו משדר שום מידע אישי לשום שרת צד-שלישי. כל הנתונים נשמרים ב-`chrome.storage.local` של הדפדפן ונמחקים מיד עם סיום ההזנה.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-09-25 | גרסה ראשונה: תמיכה בהזנה אוטומטית בטכניון, תל אביב וסרגל צף לשאר 6 האוניברסיטאות | Ready for local testing |
