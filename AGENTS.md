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

## 📍 5. Current Working State & Subagent Roadmap (Last Updated: 2026-09-11 16:20)
- **Active Branch:** `ui-upgred` (Created from `main` for UI isolation and safe iteration)
- **Current Quality State:**
  - `npx tsc --noEmit`: Clean (0 errors)
  - `npx tsx --test src/modules/*/__tests__/*.test.ts`: **106/106 tests passing** across 32 test suites.
  - `npm run build`: Clean (21/21 static & dynamic routes generated, zero compile or runtime build errors).
  - Background processes: Next.js dev server running on port 3000.

### 🏆 Implemented Milestones in this Phase:

1. **Warm Editorial Palette & Matte Anthracite Conversion:**
   - Transformed UI away from harsh dark mode to a premium warm cream/sand canvas (`#FAF8F5`) with soft borders (`#E5DFD4`).
   - Converted all primary buttons, active chips, and toggles across all pages to the user's requested matte anthracite tone (**`#3C3C3C`**) with subtle hover transitions (**`hover:bg-[#2A2A2A]`**).

2. **Official Authentic University Vector Emblems (`public/logos/` & `UniversityLogo.tsx`):**
   - Replaced all crude SVG approximations and emojis with authentic, official institutional SVG vector emblems for all 8 universities:
     - **TAU**: Classic Dan Reisinger emblem ("את" menorah).
     - **BGU**: Official white flame inside the vibrant orange circle (`#F7941E`).
     - **Technion**: Official seal with the flame, gear, and Star of David in deep navy (`#002D62`).
     - **HUJI**: Official Scopus torch emblem in brand colors (`#83111F`, `#2F7789`, `#26A594`).
     - **Bar-Ilan**: Official tree/open book emblem (`#1E40AF` & `#D27228`).
     - **Haifa**: Official Dina Merhav emblem (`#0284C7`).
     - **Ariel**: Official emblem (`#008542` & `#00ABB7`).
     - **Reichman**: Official emblem (`#0F2D96`).
   - Integrated into `UnifiedCalculator`, `MultiUniversityAdmissionGrid`, `PersonalAdmissionReport`, `DegreeSearchSelector`, `GapAnalysisCard`, and `AcceptedRegistrationCard`.

3. **High-Contrast Exam Session Badges (`calendarScheduler.ts` & `RecommendedTracksView.tsx`):**
   - Fixed unreadable dark-mode badge colors on light backgrounds.
   - Implemented high-contrast, WCAG-compliant pastel session badges:
     - **מועד קיץ (יוני–יולי) ☀️**: `bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]`
     - **מועד אביב (מרץ–אפריל) 🌱**: `bg-[#ECFEFF] text-[#0E7490] border-[#A5F3FC]`
     - **מועד חורף (ינואר) ❄️**: `bg-[#EEF2FF] text-[#1E40AF] border-[#C7D2FE]`
     - **קליטה במוסד (אוגוסט–ספטמבר) 🎓**: `bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]`
   - Enhanced badges with `rounded-md`, `font-bold`, and `shadow-2xs` for maximum visual clarity.

4. **High-Contrast Academic English Level Badges (`psychometricHelper.ts`, `flow/page.tsx`, `UnifiedCalculator.tsx`):**
   - Replaced washed-out glowing dark-mode cyan/emerald/blue/amber classes with crisp, high-contrast matte pastel palettes:
     - **מתקדמים ב׳ (120-133)**: `bg-[#ECFEFF] text-[#0E7490] border-[#A5F3FC]` (Zero neon glow, deep readable dark-teal text).
     - **פטור (134-150)**: `bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]`
     - **מתקדמים א׳ (100-119)**: `bg-[#EEF2FF] text-[#1E40AF] border-[#C7D2FE]`
     - **בסיסי (85-99)**: `bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]`
     - **טרום-בסיסי (<85)**: `bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]`
     - **לא הוזן ציון**: `bg-[#FAF8F5] text-[#66635C] border-[#E5DFD4]`
   - Enhanced with `rounded-md` and `shadow-2xs` for a clean editorial feel.

5. **Hero Banner 5-Image Crossfade Slideshow (`src/app/page.tsx`, `public/images/`):**
   - Integrated all 5 authentic academic graduation celebration images (`hero-grad-1.png` through `hero-grad-5.png`).
   - Implemented smooth automatic crossfade transition (1000ms ease-in-out opacity & subtle Ken Burns scale shift) rotating every 4.5s.
   - Designed full-bleed edge-to-edge layout (`w-full`) extending seamlessly directly from the top navigation bar down to just before the subheadline text.
   - Maintained static headline **"הצעד הראשון שלך לאקדמיה"** overlaid on top with dark gradient vignette for 100% WCAG-compliant legibility.
   - Positioned **"2026 // מנוע אופטימיזציה אקדמי"** directly under the headline with a transparent background and distinct `font-sans` typography.

6. **Pre-Flight Institutional Verification Gate & Degree-Specific Adaptation (`trackGenerator.ts`, `psychometricHelper.ts`, all 8 Calculators):**
   - **Zero Unverified Tracks Policy**: Every proposed track's combined simulated state is directly evaluated and verified against the target institution's pure calculator (`calculateInstitution`). If the verified Sekem is below threshold, it is automatically calibrated to the true minimal requirements or discarded.
   - **Full NITE Data Collection & Slip Emphasis**: Step 1 collects optional official Quantitative Emphasis and Verbal Emphasis (200–800) from the NITE certificate, allowing 100% official Sekem matching for Engineering/STEM degrees.
   - **Degree-Specific Engineering Sekem**: Tailored to Technion, TAU, BGU, HUJI, Ariel, Bar-Ilan, Haifa, and Reichman.
   - **Cross-Track Slope Coherence**: Enforced the mathematical slope ratio (e.g. Technion $\Delta S = 0.5 \Delta D + 0.075 \Delta P \implies 6.67$ pts psychometric per 1 pt Bagrut) across Track 1 and Track 2, eliminating any distorted trade-offs.

7. **3-Track Workload Hierarchy & Multi-Exam Track 3 for Large Gaps (`trackGenerator.ts`, `trackEngine.ts`):**
   - **Track 1 (המסלול הממוקד / המהיר)**: Strictly 0 to 2 exams (fast ROI, minimal cognitive overhead, single exam or top high-ROI lever).
   - **Track 2 (המסלול המאוזן / פיזור סיכונים)**: Strictly 2 to 3 exams (moderate workload, safe risk distribution, balanced psychometric target). Never exceeds 3 exams!
   - **Track 3 (המסלול הרב-שלבי / פער גדול / הקלה מרבית)**: Reserved for large gaps or maximum psychometric relief, offering 4 to 5 exams phased across winter and summer sessions to maximize Bagrut (e.g. 116.5) and bring psychometric requirements down to the absolute mathematical floor ($\text{Floor}(P)$, e.g. 730 for Technion CS).
   - **Psychometric Ceiling Realism**: Prevented `getRealisticPsychometricCeiling` from artificially capping students with proven high psychometric scores below `currentPsych + maxAllowedJump`.

8. **Saved Tracks Page & Navbar Navigation (`src/app/saved-tracks/page.tsx`, `Navbar.tsx`, `/api/tracks/save`, `repository.ts`):**
   - **Guest State (Unauthenticated)**: Navigating to `/saved-tracks` displays the designated card with the explicit wording: **"על מנת לצפות במסלולים שמורים יש להירשם לאתר"** and a direct registration CTA button (`openAuthModal('register')`) plus login option.
   - **Authenticated Management**: Full access to saved tracks with institution emblems (`UniversityLogo`), verified Sekem/psychometric/Bagrut target metrics, study weeks/hours, expandable exam session breakdown (❄️/🌱/☀️), and instant delete functionality (`DELETE /api/tracks/save`).
   - **Navbar Integration**: Added "מסלולים שמורים" to the top navigation capsule with bookmark icon and real-time saved tracks badge count for authenticated users, plus direct entry in the user profile dropdown.
   - **Enriched Persistence**: Tracks enriched with full catalog details (`institutionName`, `programName`, `admissionThreshold`) on retrieval.
   - **Quality State**: 103/103 tests passing, `tsc --noEmit` clean, Next.js build 21/21 clean routes.

9. **Arrow & Units Direction Alignment (`RecommendedTracksView.tsx`, `saved-tracks/page.tsx`, `WhatIfSimulator.tsx`, `globals.css`):**
   - Added `.dir-ltr, [dir="ltr"] { direction: ltr !important; text-align: left; }` in `globals.css`.
   - Encapsulated score transitions and elective units expansion in `dir="ltr"` so that arrows consistently and unambiguously point **from existing to target** (`680 ➔ 758 (+78)` and `2 ➔ 5 יח״ל`), resolving reverse-arrow artifacts caused by RTL flexbox bi-directional rendering.

10. **User Data Persistence, Scoped Storage & Absolute Reset on Logout (`/flow`, `/saved-tracks`, `UnifiedCalculator`, `AuthContext`, `/api/users`):**
   - **Authenticated Personal Data**: When a user logs in, their profile (Bagrut grades & units, psychometric scores & subscores, target degrees, questionnaire preferences) is strictly loaded from their account/DB (`PUT /api/users`, `GET /api/users`) and isolated localStorage (`kalis_flow_data_${user.id}`). Auto-saves via 1-second debounce.
   - **Absolute Clean Reset on Logout**: When logging out, `AuthContext.logout()` deletes all user keys and flow keys (`kalis_admission_flow_data`, `kalis_flow_*`), sets user/profile to null, and broadcasts `kalis-logout`. All pages (`/flow`, `/saved-tracks`, `UnifiedCalculator`) immediately wipe all states to a clean, blank initial slate (0 grades with clean placeholder inputs, 0 psychometric, step 1, 0 targets).
   - **Multi-User Isolation Test Suite**: Added `src/modules/db/__tests__/userSyncAndIsolation.test.ts` proving zero cross-contamination and complete data clearing on disconnect.

11. **TAU Pure Multi-Domain & Realit Bonus Exact Matching (`tau.ts`, `tauCalculator.ts`):**
   - Verified against official TAU admission guidelines and live institutional calculator that Tel Aviv University exclusively evaluates undergraduate candidates based on the General/Multi-Domain Psychometric score (`psychometricGeneral`), never using a separate quantitative emphasis score.
   - For Engineering and Exact Sciences (Computer Science, etc.), TAU strictly adds the official +10 Realit bonus when Math 5u and Physics 5u are present ($\ge 55$).
   - Eliminated erroneous quantitative emphasis substitution in `evaluateTau` and `tauCalculator.ts`, bringing TAU Sekem calculations into 100% 1:1 match with TAU's official live calculator (e.g. Bagrut 112.50, Psych 714 $\implies$ General 709, Engineering/Exact Sciences 719, Management 708).

12. **Flow Navigation & Degree Selector Refactoring (`DegreeSearchSelector.tsx`, `flow/page.tsx`):**
   - Removed the cross-university major comparison feature completely as requested.
   - Reordered Step 2 components: Search and filters at the top, degree catalog cards in the middle, and the selected degrees tray ("סל התארים המבוקשים שלך") at the bottom.
   - Relocated "המשך לשלב הבא" / "חזור" navigation buttons to the bottom across all steps (Step 1, Step 2, Step 3), honoring natural downward scanning UX.

13. **Concurrent & Interleaved Study Roadmap Engine (`calendarScheduler.ts`, `trackGenerator.ts`, `RecommendedTracksView.tsx`, `concurrentScheduler.test.ts`):**
   - Implemented realistic adaptive scheduling: Psychometric runs as a continuous anchor spine (~12 weeks / 3 months), while core bagrut subjects run concurrently in Months 1 and 2 (culminating in exam milestones), leaving Month 3 as a 100% focused psychometric simulation sprint.
   - Strictly enforced "concurrency only when needed/advantageous": single-lever tracks remain 100% sequential; if weekly hours $< 12$, sequential study is favored to avoid time fragmentation.
   - Enhanced `RecommendedTracksView` with an interactive multi-stream Gantt chart matrix displaying parallel streams with weekly hours budgets and exam milestones.
   - Added `candidateNumber` collision retry handling in `repository.ts`.
   - **Quality State**: **111/111 tests passing** across 33 test suites, `tsc --noEmit` clean, Next.js build 21/21 clean routes.

14. **User-Facing Identifier Privacy Polish (`Navbar.tsx`, `saved-tracks/page.tsx`, `AuthModal.tsx`, `RecommendedTracksView.tsx`):**
   - Completely removed all user-facing displays of the internal database identifier (`candidateNumber` / `KL-XXXXX`).
   - Retained the identifier strictly in the backend, Prisma DB layer, and APIs for internal system tracking, ensuring zero exposure to the end-user.

15. **Pruning Dropped Subjects, Misleading Units & Safety Cushion Track 2 (`trackGenerator.ts`, `RecommendedTracksView.tsx`, `saved-tracks/page.tsx`):**
   - **Elimination of Dropped/Phantom Subjects**: Integrated `droppedSubjects` from pure institution calculators into `evaluateSimulatedSekem`. Added `comboHasDroppedSubject` and `isValidSubjectCombo` filters across all solver pools (Track 1, Track 2, Track 3) so the system NEVER proposes an exam that the university calculator legally drops (e.g. Geography 5u at grade 92 being discarded by Technion because it drags down the 114.1 average).
   - **Accurate Units Display for Brand-New Electives**: Fixed `currentUnits: 0` for new electives (Geography, CS from scratch) and rendered clean `(מקצוע חדש, X יח״ל)` chips in both `RecommendedTracksView` and `saved-tracks/page.tsx`, completely removing confusing `(0 ➔ 5 יח״ל)` or `(2 ➔ 5 יח״ל)` artifacts.
   - **Context-Aware Strategy Phrasing**: Replaced the flawed template copy that compared identical psychometric numbers (`במקום 714 נוריד ל-714`) with natural Hebrew highlighting the preservation of existing psychometric score (714).

16. **Strict Single-Exam Admission Policy & Alternative Single Exam (`trackGenerator.ts`):**
   - **Zero Unnecessary Exams Rule**: When admission can be attained with a SINGLE bagrut exam without raising the psychometric score (`isSingleBagrutAdmissionTrack1`), the system strictly forbids forcing an additional exam just to inflate Sekem above the required threshold.
   - **Two User-Mandated Behaviors**:
     1. **Alternative Single Exam**: If another single bagrut exam (e.g. ספרות עברית 2 ➔ 5 יח״ל) independently closes the gap with 0 psychometric jump, Track 2 is generated as: `המסלול החלופי: שדרוג ספרות עברית (בחינה בודדת)`, badged as `חלופה לבחינה בודדת` (8 weeks, 1 exam).
     2. **Omission When No Alternative Exists**: If no other single subject can achieve admission on its own, Track 2 is completely omitted (`bestBalCombo = null`), presenting only Track 1.
   - **Quality State**: **111/111 tests passing** across 33 test suites, `tsc --noEmit` clean, Next.js build 21/21 clean routes.

### 🎯 Next Steps / הצעד הבא לסוכן הנכנס:
1. **הצגת מדדי יעילות בכרטיסיות המסלול ב-RecommendedTracksView:**
   - שילוב תגיות מדד היעילות ($\eta$) וסך שעות המאמץ המשוערות.
2. **ליטוש מיקרו-אינטראקציות נוספות:**
   - אנימציות כניסה (CSS keyframes / transitions) בעת מעבר בין שלבי ה-flow.

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

