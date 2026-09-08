<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 🎓 Kalis (קליס) — Instructions for AI Agents

> **Single Source of Truth for Any AI Assistant (Antigravity, Claude Code, Cursor, Windsurf, Copilot)**
> When resuming work on this repository on any machine, read this document carefully before making any changes.

---

## 📌 1. Project Overview & Mission
**Kalis** is an Israeli academic admission planning and optimization platform. It provides high-precision Sekem (admission score) calculations, optimal Bagrut (matriculation) grade improvement roadmaps, and What-If simulation across Israeli universities.

### 🏛️ 8 Supported Universities (Fully Integrated):
All 8 universities must be supported across every layer of the system:
1. **Technion (הטכניון)** — ID: `technion` | DB ID: `inst-48` | Logo: `IIT`
2. **Tel Aviv University (תל אביב)** — ID: `tau` | DB ID: `inst-6` | Logo: `TAU`
3. **Hebrew University of Jerusalem (העברית)** — ID: `huji` | DB ID: `inst-1` | Logo: `HUJI`
4. **Ben-Gurion University (בן-גוריון)** — ID: `bgu` | DB ID: `inst-3` | Logo: `BGU`
5. **University of Haifa (חיפה)** — ID: `haifa` | DB ID: `inst-5` | Logo: `UOH`
6. **Ariel University (אריאל)** — ID: `ariel` | DB ID: `inst-2` | Logo: `AU`
7. **Bar-Ilan University (בר-אילן)** — ID: `bar_ilan` | DB ID: `inst-4` | Logo: `BIU`
8. **Reichman University (רייכמן)** — ID: `reichman` | DB ID: `inst-38` | Logo: `RUNI`

---

## 🏗️ 2. Core Architecture & Subagents
The system follows a strict modular 4-subagent architecture:

* **Subagent 1: Architecture & DB Layer (`src/modules/db/`)**
  * Repository (`repository.ts`), Zod schemas (`schema.ts`), in-memory index for all degrees (`academicData.json`).
  * Direct bagrut thresholds: HUJI/TAU (105+), BGU (104+), BIU (102+), Haifa/Ariel/RUNI (100+). Technion requires psychometric for STEM.

* **Subagent 2: Optimization, Scheduling & Recommendation Engine (`src/modules/optimizer/`)**
  * Closed-loop solver (`solver.ts`), utility scorer (`utilityScorer.ts`), and track generator (`trackEngine.ts`).
  * **Core Architectural Paradigm Shift:**
    1. *Track A (`track-maximize-exam`)*: "מיקוד על בחינה אחת" — Focus on a single decision lever (A1: Psychometric only, A2: Single high-ROI Bagrut lever, or A3: Direct Bagrut with 0 psychometric).
    2. *Track B (`track-risk-spread`)*: "פיזור סיכונים" — Balanced multi-vector improvement (2-3 levers) designed so no single test failure ruins admission.
    3. *Mechina (`track-anchor`)*: **Opt-In Only** — Evaluated via `mechinaAvailable: boolean` and exposed via on-demand endpoint `POST /api/tracks/mechina`, never forced as a default track.
    4. *Reachability Model (`reachabilityModel.ts`)*: Realistic psychometric ceiling (`personalCeiling`) factoring in percentiles (strict caps above 660 and 700), preparation hours, and diagnostic confidence.
    5. *Exam Calendar & Timeline Phasing (`calendarScheduler.ts`)*: Israeli calendar awareness (Winter sessions for 2u core Quick-Wins/Safety Cushions; Spring for Psychometric; Summer for 5u elective expansions). Prevents cognitive overload/concurrency conflicts.

* **Subagent 3: Pure Institution Calculators (`src/modules/calculators/`)**
  * Pure, deterministic math functions for all 8 institutions (`technion.ts`, `tau.ts`, `huji.ts`, `bgu.ts`, `haifa.ts`, `ariel.ts`, `barIlan.ts`, `reichman.ts`).
  * Enforces Israeli legal dropping rules (only drop electives if remaining units $\ge 20$) and official subject bonuses.

* **Subagent 4: Integration, APIs, UI Flow (`src/app/`, `src/components/`)**
  * Next.js 14/15 App Router:
    * `/flow` — 4-step wizard:
      * Step 1: Bagrut & Psychometric scores input.
      * Step 2: Desired degree & institution selection (DegreeSearchSelector).
      * Step 3: Admission Gap Report (PersonalAdmissionReport).
      * Step 4: Action Tracks & Personal Builder (`RecommendedTracksView.tsx`).
    * Tab 1: **ריכוז המסלולים המומלץ** (Track A: מיקוד, Track B: פיזור סיכונים, ציר זמנים מועדי חורף/אביב/קיץ, כפתור מכינה Opt-In).
    * Tab 2: **מסלול בנייה אישי** (`WhatIfSimulator.tsx` + `MultiUniversityAdmissionGrid.tsx`).
  * REST APIs: `/api/calculate`, `/api/programs`, `/api/tracks/generate`, `/api/tracks/mechina`, `/api/health`.

---

## 🚀 3. Essential Commands & Verification
Always run and verify these commands when working on the project:

```bash
# 1. Start Development Server (runs on http://localhost:3000)
npm run dev

# 2. Run All Unit Tests (Must have 36/36 passing)
npx tsx --test src/modules/*/__tests__/*.test.ts

# 3. Type Checking
npx tsc --noEmit

# 4. Production Build Verification
npm run build
```

---

## 📜 4. Core Development Rules for AI Agents
1. **Never Hallucinate Admission Formulas:** Always reference the verified institutional calculator implementations in `src/modules/calculators/`.
2. **Strict RTL & Hebrew UI:** All user-facing UI text must be natural, high-standard Hebrew with `dir="rtl"` and responsive Tailwind CSS.
3. **Preserve Documentation & Comments:** Never delete explanatory comments or docstrings unrelated to your changes.
4. **Subagent Modularity:** Keep calculators pure (no DB/React imports in `src/modules/calculators/`). Keep UI components modular.
5. **No Broken Builds:** Never end a turn with failing tests or TypeScript compiler errors. Run `npm run build` or `npx tsc --noEmit` before finishing.

---

## 📍 5. Current Working State & Subagent Roadmap (Last Updated: 2026-09-07)
- **Active Branch:** `audit/optimizer-8-cases-and-improvements`
- **Current Quality State:**
  - `npx tsc --noEmit`: Clean (0 errors)
  - `npx tsx --test src/modules/*/__tests__/*.test.ts`: **37/37 tests passing** across all modules.
  - Background processes: None running.

### 🏆 Implemented Milestones in this Phase:

1. **Psychometric Reachability Model (`reachabilityModel.ts`):**
   - Implemented `computePsychReachability` factoring in weekly availability hours, first-time examinee status, confidence level, and percentile density penalties (caps at +20 pts for scores $\ge 700$ and +35 pts for scores $\ge 660$).
   - Feasibility classifier (`very_high`, `high`, `moderate`, `challenging`) with realistic bounds (`isRealistic`).

2. **Exam Calendar & Timeline Phasing (`calendarScheduler.ts`):**
   - Israeli Ministry of Education sessions mapped: Winter (Core 2u mandatory subjects + 4/5u Math & English) vs Summer (5u elective expansions).
   - Milestone generator creates sequential milestones: Winter Quick-Wins/Safety Cushions $\to$ Spring Psychometric $\to$ Summer 5u Expansions.

3. **Track Redesign in `trackEngine.ts`:**
   - **Track A (`track-maximize-exam` / `track-direct-bagrut`)**: "מסלול מצוינות / מינימום בחינות" — targets 90–95+ in Bagrut and ambitious psychometric up to `personalCeiling`. Selects single high-yield lever or minimal exam combination.
   - **Track B (`track-risk-spread`)**: "מסלול סולידי / ביטחון גבוה" — targets moderate 82–90 grades, lower risk, higher attainment probability, spread across seasons without single-point-of-failure risk.
   - **Mechina Track**: Opt-In only! Excluded from default tracks array; `mechinaAvailable: boolean` flag signals UI to show the option, and `generateMechinaTrack()` runs on demand.

4. **APIs & UI Flow (`src/app/`, `src/components/`):**
   - `POST /api/tracks/mechina`: On-demand endpoint for retrieving Mechina track.
   - `RecommendedTracksView.tsx`: Updated to handle `track-maximize-exam` and `track-risk-spread`.

5. **Test Suite Verification:**
   - `optimizer_audit_8cases.test.ts`: Updated to 37 passing assertions, testing all 8 institutional edge cases + Case 9 (Opt-In Mechina, reachability ceiling caps, and Israeli session calendar mapping).

### 🎯 Next Steps / הצעד הבא לסוכן הנכנס:
1. **הרחבת ה-UI עבור Opt-In Mechina ב-`RecommendedTracksView.tsx`:**
   - כאשר `mechinaAvailable === true`, הוספת כפתור מעוצב בתחתית טאב המסלולים ("הצג אפשרויות מכינה אקדמית") המבצע קריאת `POST /api/tracks/mechina` ומציג מודאל או כרטיס ייעודי למסלול המכינה.
2. **ויזואליזציה של ציר הזמן והמועדים (חורף ⬅️ אביב ⬅️ קיץ):**
   - שיפור תצוגת המילסטונים ב-UI כך שיראו את תגיות המועדים (`מועד חורף`, `מועד אביב`, `מועד קיץ`) בצבעים ייעודיים.
3. **מיזוג ענף (PR / Merge):**
   - הענף `audit/optimizer-8-cases-and-improvements` מוכן לחלוטין למיזוג ל-`main` לאחר סיום סבב ה-UI.

---

## 🛑 6. Mandatory Wrap-Up Protocol: When User Says "סיימנו להיום" / "Done for today"
Whenever the user says **"סיימנו להיום"**, **"סיימנו"**, **"עוצרים כאן"**, or **"Done for today"**, you MUST automatically and sequentially execute this 4-step wrap-up protocol:

1. **Step 1: Automated Quality Gate**
   - Run: `npx tsc --noEmit`
   - Run: `npx tsx --test src/modules/*/__tests__/*.test.ts` (all 36 tests must pass)
   - Run: `npm run build`
   - If any errors exist, fix them immediately before proceeding.

2. **Step 2: Update Handoff State in `AGENTS.md`**
   - Update Section 5 above with:
     - The current date/time.
     - Summary of changes completed in the session.
     - Files modified or created.
     - Clear bullet points for **"Next Steps / הצעד הבא"** so the next agent knows exactly where to resume.

3. **Step 3: Git Synchronization**
   - Stage all relevant changes: `git add <modified_files>`
   - Commit with a descriptive conventional commit message: `git commit -m "feat/fix/chore: ..."`
   - Push to the remote branch: `git push`

4. **Step 4: Final Summary Response to User**
   - Confirm tests and build passed cleanly.
   - Confirm branch and commit hash pushed to remote.
   - Present a concise 2-3 bullet summary of what was achieved and what will be tackled in the next session.

