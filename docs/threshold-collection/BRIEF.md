# משימה: איסוף ספי קבלה ובדיקת מחשבונים, עבור Kalis (mitkablim.co.il)

> **לחבר שעוזר לנו:** תעביר את כל הקובץ הזה למודל שעובד איתך, יחד עם `missing_programs.csv`.
> המודל יאסוף, ואתה תעזור לו בשני מקרים: באתרים שחוסמים אותו, ובמחשבונים שצריך להפעיל ידנית בדפדפן.
> בסוף שלחו לנו את קבצי התוצאות לפי הפורמט שבסוף המסמך.

---

## 1. Context (for the model)

Kalis is a Hebrew web app that helps Israeli high-school graduates plan admission to Israeli universities.
For each program it compares the applicant's score (the institution's own formula) against the program's
admission threshold. We need **official, sourced** thresholds and **verified** calculator results.

You are collecting data, not writing code. Your output is structured files (CSV / JSON, specified in §6)
that we import with scripts. Accuracy matters far more than coverage: **a missing value is fine, a guessed
value is harmful.**

### Hard rules

1. **Never invent or estimate a number.** If you can't find it, leave it empty and say why in `notes`.
2. **Every value needs a source.** Record the exact URL and a short verbatim quote (or say "screenshot", with the file name). Record the academic year the value is for (e.g. תשפ"ז = 2026/27).
3. **Prefer the newest year.** If only an older year is published, use it and set `year` honestly.
4. **Do not bypass bot protection.** Several sites block automated access: Technion, Haifa, Bar-Ilan (Radware) and go.huji.ac.il. If you get a block page, a CAPTCHA, "Request Rejected" or a dropped connection, **stop and ask the human** to open the page in a normal browser and paste the text or send screenshots. Don't retry with different headers, proxies or headless browsers.
5. **Be gentle with official APIs and calculators.** Wait at least 3–5 seconds between requests, and make no more than ~50 requests per site per day. BGU's API rate-limits around 60 calls.
6. **Keep the institution's own scale.** Don't convert thresholds. Record the scale (see §3).
7. **Ignore the repository's `scrapers/` folder.** Most of those files are hard-coded, unsourced numbers (some known to be wrong). Never copy values from them. Program-name lists there may help with recognition only.
8. **Names:** copy the official program/track name exactly as published. Map it to our `program_id` from `missing_programs.csv` when you are confident; otherwise leave `program_id` empty and we'll map it.

---

## 2. What is already done (do NOT redo)

| Institution | Status | Source we used |
|---|---|---|
| Technion | ✅ 46/48 programs (Oct 2026 table) | https://admissions.technion.ac.il/sechem-for-admission/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C%D7%99-%D7%94%D7%9C%D7%99%D7%9E%D7%95%D7%93-%D7%9C%D7%A4%D7%99-%D7%90%D7%A4%D7%99%D7%A7%D7%99-%D7%94%D7%A7%D7%91%D7%9C%D7%94/ |
| Hebrew University | ✅ 95/101 | Official Google Sheet linked from https://info.huji.ac.il/reception-channels/Kabala_Meshklal |
| Tel Aviv University | ✅ 63/106 | Each program page on https://go.tau.ac.il (acceptance/rejection threshold) |
| Ben-Gurion | ✅ 162/209 (סתו תשפ"ז) | https://apps4cloud.bgu.ac.il/calcprod/ → "חתכי קבלה" |
| Reichman | ⚠️ 14/23, but only from the **תשפ"ה** table | https://www.runi.ac.il/media/rooocfxp/%D7%98%D7%91%D7%9C%D7%AA-%D7%A1%D7%A4%D7%99%D7%9D-%D7%9C%D7%90%D7%AA%D7%A8-%D7%AA%D7%A9%D7%A4%D7%94.pdf |

Verified calculators (bagrut average + sekem match the official site): Technion, HUJI, TAU, BGU, Reichman,
Haifa (bagrut average + one CS sekem), Bar-Ilan (bagrut average only).

---

## 3. What is missing: the tasks, in priority order

The full list of programs that still have no official threshold is in **`missing_programs.csv`**
(308 rows, all at the 8 universities the site covers).
`current_unverified_threshold` is our old value. Treat it as unreliable, and use it only to help recognise the program.

### Task A — University of Haifa: all 56 programs (priority 1) — needs the human

- All programs list: https://admissions.haifa.ac.il/bachelor/?interests=hightech_and_math (change `interests` or remove it to see every category)
- Example program page with admission data: https://admissions.haifa.ac.il/computer-information-science/program/114921/
- Each program page shows the **sekem threshold** ("סכם"), often a **waitlist range** (e.g. "טווח המתנה 640–659"), and conditions (minimum psychometric, math units/grade, bagrut-only route).
- Scale: 200–800 (Haifa sekem).
- ⚠️ Every haifa.ac.il host returns "Request Rejected" to automated clients, so the human must open the pages. First check whether the list page's cards already show the sekem; if they do, one screenshot per category is enough.
- Also note for each program **which formula** it uses, if the page says. Most programs are 1:1 bagrut + psychometric; math/CS programs use a quantitative-weighted psychometric (`math_weighted`).

### Task B — Bar-Ilan: formula runs + all 100 program thresholds (priority 1) — needs the human

- Calculator: https://shoham.biu.ac.il/kabala/Bagrut.aspx (blocks automation, so the human runs it in a browser).
- BIU's sekem ("שקלול מועמד למסלול") is on a **0–100 scale** and is per program. It asks only for the **general psychometric** score and the **quantitative** section (not verbal or English).
- So far, there seem to be ~3 score types: **general** (Law, Psychology, Sociology, Communication), **quantitative/science** (CS, Economics, Life Sciences) and **engineering** (EE, Computer Eng.).

**B1 — formula runs.** Use profile A (§4). Change **one thing** per run, then put it back. Record the score for **משפטים**, **מדעי המחשב (חד חוגי)** and **הנדסת חשמל**:

| Run | Change |
|---|---|
| B1-1 | general psychometric 680 (quant stays 145) |
| B1-2 | quant 135 |
| B1-3 | English bagrut 82 (instead of 92) |
| B1-4 | civics 68 (instead of 88) |
| B1-5 | physics 83 (instead of 93) |
| B1-6 | quant 125 — only the הנדסת חשמל score is needed (CS and Law are already recorded) |
| B1-7 | math grade 85 — only הנדסת חשמל needed |
| B1-8 | history 65 — only הנדסת חשמל needed |

Also record the bagrut average the calculator shows for each run.

**B2 — thresholds.** Use profile A unchanged. For **every** BIU program, record the candidate score, "שקלול לקבלה" (accept), "שקלול לדחייה" (reject) and the conditions text (min psychometric, math product, bagrut-only route, etc.).
Already recorded (skip these): CS, CS with physics, Law, EE, Computer Eng., Psychology, Economics, Economics–Business, Life Sciences, Sociology, Communication.

### Task C — Ariel University: everything (priority 1)

- Nothing is verified yet: not the bagrut-average rules, not the sekem formula, not the thresholds.
- Find the official calculator and the threshold page/table on ariel.ac.il. Record the URLs.
- Collect: (1) the bagrut bonus rules and mandatory subjects as officially published, (2) the sekem formula if published, (3) the threshold for each of the 45 programs, with scale and conditions.
- Then run profiles A, B and C (§4) on the official calculator and record every number it outputs.

### Task D — Reichman: newer table + 9 programs (priority 2)

- We only have the **תשפ"ה** table. Look for a תשפ"ז (or תשפ"ו) threshold table on runi.ac.il. The תשפ"ז registration rules say to "contact the registration office", so the human may need to call or email rishum@runi.ac.il.
- Scale: "ציון מתואם" (~200–800). Columns: matched-score route, bagrut-only route, psychometric-only route, plus a minimum psychometric.
- Missing programs: Law (single major), Entrepreneurship, Sustainability, Medicine (M.D.), Data Science, Communication + Entrepreneurship, Psychology + Entrepreneurship, Psychology + Cognition, Data Science + Entrepreneurship.

### Task E — TAU: 43 programs without a published threshold (priority 2)

- These pages on https://go.tau.ac.il don't show an acceptance threshold, mostly humanities and arts (typically a minimum of ~560), medicine/dentistry (MOR), and excellence programs.
- Look for the official minimum ("ציון התאמה מינימלי") per program in the "תנאי קבלה" section or the TAU admissions booklet (ידיעון). Scale: 200–800.

### Task F — BGU: 47 tracks (priority 2)

- 27 tracks admit by **psychometric only** (no sekem), e.g. Economics 600, Education 600, Nursing 520. These are already recorded; nothing to collect.
- 20 tracks had no published cut for סתו תשפ"ז: Eilat-campus tracks, minors, medicine, occupational therapy, entrepreneurship. Check https://apps4cloud.bgu.ac.il/calcprod/ → "חתכי קבלה" for a later semester, or the program pages on bgu.ac.il.

### Task G — HUJI (6) and Technion (2) leftovers (priority 2)

- HUJI programs with no row in the official sheet. They may have been discontinued; confirm whether they still exist.
- Technion: ביוכימיה מולקולרית, כלכלה וניהול. These aren't in the admissions-routes table; check whether they're still offered and what their threshold is.

---

## 4. Test profiles for calculator checks

Enter subjects exactly as below. "u" = units (יח"ל).

**Profile A** — general psychometric 714; quant 145, verbal 137, English 124
| מקצוע | יח"ל | ציון |
|---|---|---|
| מתמטיקה | 5 | 95 |
| אנגלית | 5 | 92 |
| פיזיקה | 5 | 93 |
| מדעי המחשב | 5 | 90 |
| היסטוריה | 2 | 85 |
| אזרחות | 2 | 88 |
| תנ"ך | 2 | 80 |
| ספרות | 2 | 82 |
| הבעה עברית | 2 | 84 |

**Profile B** — general psychometric 620; quant 120, verbal 125, English 118
| מקצוע | יח"ל | ציון |
|---|---|---|
| מתמטיקה | 4 | 78 |
| אנגלית | 4 | 82 |
| ביולוגיה | 5 | 84 |
| היסטוריה | 2 | 75 |
| אזרחות | 2 | 80 |
| תנ"ך | 2 | 70 |
| ספרות | 2 | 72 |
| הבעה עברית | 2 | 76 |

**Profile C** — general psychometric 680; quant 128, verbal 132, English 130
| מקצוע | יח"ל | ציון |
|---|---|---|
| מתמטיקה | 4 | 92 |
| אנגלית | 5 | 90 |
| גיאוגרפיה | 5 | 95 |
| היסטוריה | 2 | 88 |
| אזרחות | 2 | 90 |
| תנ"ך | 2 | 84 |
| ספרות | 2 | 86 |
| הבעה עברית | 2 | 90 |

Known official results, so you can check you entered the profile correctly: profile A has a bagrut average of
**111.1** at the Technion, **112.1** at HUJI, **107.1** at Haifa and **112.08** at Bar-Ilan.

If a calculator asks for the **psychometric test date/year**, use **2025** and record that you did. Some
institutions convert section scores to a general score differently by test year.

---

## 5. Calculator checks still wanted

| Institution | Official calculator | What to check |
|---|---|---|
| Bar-Ilan | https://shoham.biu.ac.il/kabala/Bagrut.aspx | Task B (sekem per program type) |
| Ariel | find it on ariel.ac.il | Task C (everything) |
| Haifa | the haifa.ac.il "חישוב סכם" page, e.g. https://www.haifa.ac.il/%D7%97%D7%99%D7%A9%D7%95%D7%91-%D7%A6%D7%99%D7%95%D7%9F-%D7%A7%D7%91%D7%9C%D7%94-%D7%A1%D7%9B%D7%9D/ | Profiles B and C sekem for 3 programs: מדעי המחשב, פסיכולוגיה, משפטים (A is already verified for CS = 731) |
| Technion | admissions.technion.ac.il calculator | Optional: profile C sekem (A and B are verified) |
| HUJI | go.huji.ac.il "מחשבון סכם" | Optional: weighted score for profiles A/B/C with psychometric 714 / 620 / 680 |

TAU, BGU and Reichman are verified through their official APIs and need nothing.

---

## 6. Output format (exactly this, please)

### 6.1 `thresholds.csv` (UTF-8, one row per program/track)

| column | meaning |
|---|---|
| `institution` | e.g. `חיפה` |
| `program_id` | from `missing_programs.csv` if confident, else empty |
| `official_program_name` | exactly as published |
| `track` | single/double major, campus, etc. (if relevant) |
| `year` | academic year the threshold is for, e.g. `תשפ"ז` |
| `route` | `sekem` (combined score), `psychometric_only`, `bagrut_only`, `interview`, `other` |
| `threshold` | the number, as published |
| `scale` | e.g. `200-800`, `0-100`, `bagrut_average`, `psychometric` |
| `score_type` | which formula, if stated: e.g. `general`, `quantitative`, `engineering`, `management`, `math_weighted` |
| `waitlist_from` / `waitlist_to` | if a waitlist range is published |
| `reject_below` | if a rejection threshold is published (TAU, BIU) |
| `min_psychometric` | extra minimum psychometric, if any |
| `min_quant` | minimum quantitative section, if any |
| `bagrut_only_min_average` | minimum average for admission on bagrut alone, if any |
| `math_requirement` | free text, e.g. `5u ≥ 90` or `units×grade ≥ 360` |
| `other_conditions` | free text (English level, interview, entrance exam…) |
| `source_url` | exact page / PDF URL |
| `source_quote` | short verbatim quote containing the number, or `screenshot: <file>` |
| `retrieved_at` | date |
| `collected_by` | `model` or `human` |
| `notes` | anything uncertain |

### 6.2 `calculator_runs.csv` (one row per calculator output)

| column | meaning |
|---|---|
| `institution` | |
| `calculator_url` | |
| `profile` | `A` / `B` / `C`, or e.g. `A, quant=135` for a variation |
| `change` | what you changed from the base profile (empty if none) |
| `inputs_entered` | psychometric numbers + test year if asked |
| `bagrut_average_shown` | |
| `program` | if the score is per program |
| `score_shown` | the number exactly as displayed |
| `score_label` | the label on the site (e.g. `שקלול מועמד למסלול`, `סכם`, `ציון מתואם`) |
| `threshold_shown` / `reject_shown` | if shown |
| `screenshot` | file name |
| `retrieved_at` | |

### 6.3 Screenshots

Keep every screenshot. Name them `<institution>_<profile-or-program>_<n>.png` and send them with the CSVs.

---

## 7. Checklist before sending

- [ ] Every row has `source_url`, `year` and either `source_quote` or a screenshot.
- [ ] No number was estimated, interpolated or copied from a non-official site (forums, prep-course sites, news).
- [ ] Scales were recorded, not converted.
- [ ] Blocked sites were handled by the human, not bypassed.
- [ ] Uncertain mappings were left with an empty `program_id` and explained in `notes`.
