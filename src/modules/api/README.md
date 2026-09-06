<div dir="rtl" style="text-align: right; direction: rtl;">

# 🌐 מודול שירותי Backend ו-API Endpoints (Subagent 4)

מודול זה חושף את כל יכולות המערכת (מחשבוני הסכם, מנוע הנתונים והאופטימייזר) כשירותי RESTful API מודרניים תחת Next.js Route Handlers בנתיב `src/app/api/`.

---

## 📡 1. סקירת נקודות הקצה (API Endpoints)

| Method | Endpoint | תיאור |
| :--- | :--- | :--- |
| `GET` | `/api/health` | בדיקת בריאות המערכת, מודולים פעילים וכמות מוסדות |
| `POST` | `/api/calculate` | חישוב סכם וממוצעי בגרות מרוכזים בכל האוניברסיטאות |
| `GET` | `/api/programs` | חיפוש, סינון ופילוח חוגים וספי קבלה |
| `POST` | `/api/tracks/generate` | הפקת מסלולי פעולה מותאמים אישית (המהיר, הבטוח, עוגן) |

---

## 📋 2. פירוט נקודות הקצה

### 1️⃣ `POST /api/calculate` — חישוב סכם רב-מוסדי
מחשב במקביל את ממוצע הבגרות המיטבי והסכמים (כללי והנדסי) בכל האוניברסיטאות בישראל.

**גוף הבקשה (Request Body):**
```json
{
  "profile": {
    "bagrutSubjects": [
      { "name": "מתמטיקה", "units": 5, "grade": 90 },
      { "name": "אנגלית", "units": 5, "grade": 92 },
      { "name": "פיזיקה", "units": 5, "grade": 88 }
    ],
    "mathUnits": 5,
    "mathGrade": 90,
    "physicsUnits": 5,
    "physicsGrade": 88,
    "psychometricGeneral": 680,
    "psychometricQuant": 135
  },
  "institutionIds": ["technion", "tau", "huji"] // אופציונלי: סינון מוסדות ספציפיים
}
```

**תגובה מוצלחת (200 OK):**
```json
{
  "success": true,
  "results": [
    {
      "institutionId": "technion",
      "institutionName": "הטכניון - מכון טכנולוגי לישראל",
      "bagrutAverage": 109.3,
      "generalSekem": 86.8,
      "engineeringSekem": 86.8,
      "directBagrutEligible": false
    }
  ]
}
```

---

### 2️⃣ `GET /api/programs` — חיפוש חוגים וספי קבלה
מאפשר סינון חוגים לפי אוניברסיטה, תחום לימוד, טקסט חופשי, או איתור חוגי קבלה ישירה.

**פרמטרי Query:**
* `institutionId`: מזהה מוסד (`technion`, `tau`, `huji`, `bgu`, `haifa`, `ariel`).
* `text`: חיפוש טקסטואלי חופשי בחוג ובפקולטה (למשל `מדעי המחשב`).
* `directBagrutOnly`: בוליאני (`true` / `false`) לאיתור מסלולים ללא פסיכומטרי.
* `limit`: כמות תוצאות לעמוד (ברירת מחדל: 20).
* `offset`: דילוג לעמוד הבא.

---

### 3️⃣ `POST /api/tracks/generate` — הפקת מסלולי קבלה מותאמים אישית
מפעיל את מנוע האופטימיזציה (תת-סוכן 2) מול חוג לימודים ספציפי ופרופיל מועמד.

**גוף הבקשה (Request Body):**
```json
{
  "programId": "prog_huji_psych",
  "profile": {
    "userId": "user_itai",
    "bagrutSubjects": [
      { "name": "מתמטיקה", "units": 4, "grade": 88 },
      { "name": "אנגלית", "units": 5, "grade": 92 },
      { "name": "ספרות עברית", "units": 5, "grade": 92 },
      { "name": "תנ״ך", "units": 2, "grade": 85 },
      { "name": "אזרחות", "units": 2, "grade": 85 }
    ],
    "mathUnits": 4,
    "mathGrade": 88,
    "psychometricGeneral": 0,
    "hasTakenPsychometric": false
  },
  "preferences": {
    "weeklyAvailabilityHours": "full_30_plus",
    "learningStrength": "analytical_quick"
  }
}
```

**תגובה (200 OK):**
מחזיר את פרטי החוג ו-3 מסלולי הפעולה המותאמים אישית, כולל איתור קבלה ישירה (0 פסיכומטרי) במידה וקיים.

---

## 🛡️ 3. טיפול בשגיאות (Error Handling)

כל נקודות הקצה כוללות אימות Zod קפדני:
* **`400 Bad Request`:** כאשר מועברים ציונים שגויים (למשל ציון מעל 100, יחידות מעל 5).
* **`404 Not Found`:** כאשר מבוקש חוג לימוד שאינו קיים במאגר.
* **`500 Internal Server Error`:** תפיסת חריגות שרת מבוקרת עם פירוט שגיאה.

</div>
