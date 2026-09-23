# Spec Update Report: Responsive-First Layout Direction (Laptop Primary)

**Date:** 2026-09-23  
**Task:** Spec correction: reframing layout direction from "mobile-first" to responsive-first with laptop as primary target, battery/resource-conscious performance framing, and documented cross-browser PWA platform limitations.  
**Scope:** Docs and AGENTS.md / `.agents/rules/` only. No application code changes.  
**Status:** Verification complete; awaiting owner review and explicit approval.

---

## 1. Summary of Changes

Actual tester data revealed that teacher device usage follows the tiering: **laptop > tablet > phone**. The initial framing of "mobile-first" in the specification led to single-breakpoint (360×800) phone-first assumptions that compromised the laptop experience.

This specification correction updates all references across `AGENTS.md`, `.agents/rules/`, and `docs/`:
1. **Device Tiering & Primary Design Target:**
   - **Primary Target:** Laptop-class viewports in landscape orientation (≥ 1024 px width, e.g. 1280×800 or 1024×768).
   - **Secondary Supported Tiers:** Tablet (768–1023 px) and Phone (< 768 px, e.g. 360×800), with clean, non-compromised responsive adaptation.
2. **Viewport-Conditional Navigation:**
   - Laptop-class viewports utilize persistent sidebar or top navigation.
   - Phone viewports utilize bottom navigation (Today · Week · Groups · Plans · More).
3. **Battery- and Resource-Conscious Performance Framing:**
   - Performance (lean DOM, memoization, zero polling, avoidance of continuous CSS animations or heavy re-renders) is reframed as conserving battery life and system memory across portable, unplugged devices (laptops, tablets, phones) during long teaching days, rather than a small-screen constraint.
4. **Ergonomic Standards Preserved:**
   - Retained 44×44 px minimum tap/touch targets across all tiers (supporting touch laptops, tablets, and phones).
   - Retained the strict prohibition of hover-only interactions (all controls operable via touch or keyboard).
   - Retained the prohibition of horizontal page scroll (wide data tables scroll within internal containers).
5. **Cross-Platform PWA & Known Platform Limitations:**
   - Documented real platform constraints in `docs/06-architecture.md`, specifically WebKit/iOS Safari limitations (`beforeinstallprompt` absence, 7-day browser tab ITP storage cap, lack of background sync APIs, standalone push notification prerequisite, swipe-gesture history conflicts) and desktop browser variations (Chromium vs macOS Safari vs Firefox).
6. **Decision Logged:**
   - Logged formal decision `D-022` in `docs/08-decisions.md` documenting this reversal of a hard constraint and its rationale.

---

## 2. Complete List of Files Changed

1. `AGENTS.md`
2. `.agents/rules/spec-protocol.md`
3. `.agents/rules/frontend-mobile-i18n.md`
4. `docs/00-overview.md`
5. `docs/01-glossary.md`
6. `docs/05-modules/attendance.md`
7. `docs/05-modules/schedule-sessions-today.md`
8. `docs/05-modules/notes.md`
9. `docs/05-modules/plans.md`
10. `docs/05-modules/settings.md`
11. `docs/05-modules/progress-levels.md`
12. `docs/05-modules/assessments-scores.md`
13. `docs/06-architecture.md`
14. `docs/07-roadmap.md`
15. `docs/08-decisions.md`

---

## 3. Exact Before / After Wording Diffs

### 3.1 Hard Constraints

#### `AGENTS.md` — Constraint H8
- **Before:**
  ```markdown
  - **H8 Mobile first.** Build at 360 px width first; 44 px minimum tap targets; bottom navigation; no hover-only interactions; no horizontal page scroll.
  ```
- **After:**
  ```markdown
  - **H8 Responsive design, laptop primary.** Target portable, battery-powered devices with device tiering: laptop > tablet > phone. The primary design target and default responsive breakpoint is laptop-class viewports in landscape orientation (e.g. 1280×800 or 1024×768); tablet and phone viewports are fully supported secondary tiers that adapt cleanly. Navigation pattern is viewport-conditional: sidebar or top navigation on laptop-class viewports; bottom navigation is a phone-tier pattern only. Maintain 44 px minimum tap/touch targets across all tiers; no hover-only interactions; no horizontal page scroll. Performance is battery- and resource-conscious (lean DOM, minimal re-renders, zero polling) across all devices, not merely small-screen-conscious.
  ```

#### `.agents/rules/spec-protocol.md` — Constraint H8
- **Before:**
  ```markdown
  - **H8 Mobile first:** 360 px width first; 44 px min tap targets; bottom navigation.
  ```
- **After:**
  ```markdown
  - **H8 Responsive design, laptop primary:** Primary target is laptop landscape viewports; secondary support for tablets and phones; viewport-conditional navigation (sidebar/top nav on laptop, bottom nav on phone); 44 px min touch targets; battery- and resource-conscious execution.
  ```

---

### 3.2 System Instructions & Protocols

#### `AGENTS.md` — Intro (Line 3)
- **Before:**
  ```markdown
  You are the implementing engineer for **ClassQue**, a mobile-first web planner for individual teachers (institutional and freelance). The owner decides scope. The spec in `docs/` decides behavior. Your job: build exactly what the spec says, verify it by actually running things, and report honestly.
  ```
- **After:**
  ```markdown
  You are the implementing engineer for **ClassQue**, a responsive, battery-conscious web planner for individual teachers (institutional and freelance), targeting portable devices with laptop-class viewports as primary. The owner decides scope. The spec in `docs/` decides behavior. Your job: build exactly what the spec says, verify it by actually running things, and report honestly.
  ```

#### `AGENTS.md` — Section 5 (Verification Viewports)
- **Before:**
  ```markdown
  - UI: run the dev server and check changed screens at 360×800 and 768×1024 with the browser tool. Check loading, empty and error states, in both languages.
  ```
- **After:**
  ```markdown
  - UI: run the dev server and check changed screens across target viewports: primary laptop landscape (e.g. 1280×800 or 1024×768), tablet (e.g. 768×1024), and phone (e.g. 360×800) with the browser tool. Verify responsive layout adaptation, viewport-appropriate navigation (sidebar/top nav vs. bottom nav), loading, empty, and error states, in both languages.
  ```

#### `.agents/rules/frontend-mobile-i18n.md` — Section Title and UX Guidelines
- **Before:**
  ```markdown
  # Rule: Frontend, mobile UX and i18n

  Applies to everything under `src/web/` and `src/shared/i18n/`.

  ## Mobile UX
  - Design at 360 px first, verify at 360×800 and 768×1024. Minimum tap target 44×44 px. Body text at least 16 px (prevents mobile zoom on input focus).
  - Navigation: bottom bar with **Today · Week · Groups · Plans · More**. The Today screen is the home screen; every frequent action is at most two taps from it.
  - Minimize typing: defaults, toggles, pickers, bulk paste for learner names, numeric keypad for scores (`inputmode="decimal"`).
  - Every screen implements loading, empty and error states. Empty states explain the next action.
  - No hover-only interactions. No horizontal page scroll; wide tables scroll inside their own container.
  - Accessibility: every input has a label, visible focus, sufficient contrast, status conveyed by text or icon, not color alone (attendance and session status especially).
  ```
- **After:**
  ```markdown
  # Rule: Frontend, responsive UX and i18n

  Applies to everything under `src/web/` and `src/shared/i18n/`.

  ## Responsive UX & Layout
  - Target: portable, typically battery-powered devices with device tiering: **laptop > tablet > phone**. Primary design target and default responsive breakpoint is laptop-class viewports in landscape orientation (e.g. 1280×800, 1024×768); tablet (e.g. 768×1024) and phone (e.g. 360×800) are fully supported secondary tiers adapting cleanly.
  - Navigation: viewport-conditional. Laptop-class viewports use a sidebar or top navigation; phone-tier viewports use bottom navigation (**Today · Week · Groups · Plans · More**). The Today screen is the home screen; every frequent action is at most two clicks/taps from it.
  - Touch & ergonomics: minimum touch/tap target 44×44 px across all device tiers (supporting touch laptops, tablets, and phones). Body text at least 16 px (prevents unwanted mobile zoom on input focus).
  - Minimize typing: defaults, toggles, pickers, bulk paste for learner names, numeric keypad for scores (`inputmode="decimal"`).
  - Every screen implements loading, empty and error states. Empty states explain the next action.
  - No hover-only interactions (all controls must be operable by touch or keyboard). No horizontal page scroll; wide data tables or matrices scroll within their own container.
  - Battery & resource consciousness: lightweight DOM, minimal re-renders, zero polling, efficient CSS. Performance is framed around battery and device longevity during long school days, not merely small screens.
  - Accessibility: every input has a label, visible focus, sufficient contrast, status conveyed by text or icon, not color alone (attendance and session status especially).
  ```

---

### 3.3 Core Documentation (`docs/00` & `docs/01`)

#### `docs/00-overview.md` — Section 1 & Section 6
- **Before:**
  ```markdown
  ## What ClassQue is
  ClassQue is a mobile-first web planner for **individual teachers**. It helps one teacher see what they teach today, plan it, record attendance and scores, and keep notes. It works for teachers at institutions, independent (freelance) teachers, and teachers who do both at once.
  ...
  - Scores can be entered for a whole group on a phone without a laptop.
  ```
- **After:**
  ```markdown
  ## What ClassQue is
  ClassQue is a responsive, battery-conscious web planner for **individual teachers**. It targets portable, battery-powered devices (laptops, tablets, and phones) with laptop-class landscape viewports as the primary design target, while providing full, clean adaptation for secondary tablet and phone tiers. It helps one teacher see what they teach today, plan it, record attendance and scores, and keep notes. It works for teachers at institutions, independent (freelance) teachers, and teachers who do both at once.
  ...
  8. **Battery and resource conscious.** Lightweight DOM, minimal re-renders, zero polling, and lean client execution preserve battery life and memory across portable laptops, tablets, and phones alike during long teaching days.
  ...
  - Scores can be entered for a whole group easily across all device tiers, including entering scores on secondary phone or tablet viewports.
  ```

#### `docs/01-glossary.md` — Device Tiers & Navigation
- **Before:**
  *(No device tiers table; Screens and actions assumed flat list)*
  ```markdown
  ## Screens and actions
  Today (Hari ini), Week (Minggu), Groups, Plans, More, Settings (Pengaturan). Verbs: Add (Tambah), Edit (Ubah), Save (Simpan), Cancel (Batal), Delete (Hapus), Archive (Arsipkan), Restore (Pulihkan), Duplicate (Duplikat), Export (Ekspor). Use these verbs consistently; never mix Create/New/Make.
  ```
- **After:**
  ```markdown
  ## Device tiers and layout
  | Identifier | English label | Indonesian (draft) | Definition | Avoid |
  |---|---|---|---|---|
  | `laptop` | Laptop | Laptop | Primary design target; landscape viewports (≥ 1024 px width) using sidebar or top navigation. | desktop-only |
  | `tablet` | Tablet | Tablet | Secondary target tier; portrait/landscape viewports (768–1023 px width). | |
  | `phone` | Phone | Ponsel | Secondary target tier; compact viewports (< 768 px width) using bottom navigation. | mobile-first (implies phone is primary) |
  | `responsive` | Responsive | Responsif | Layout adapting gracefully across laptop, tablet, and phone without horizontal scroll. | mobile-only |

  ## Screens and actions
  Today (Hari ini), Week (Minggu), Groups, Plans, Notes, Settings (Pengaturan), More (on phone navigation tier). Navigation adapts conditionally: sidebar or top navigation on laptop-class viewports; bottom navigation on phone viewports. Verbs: Add (Tambah), Edit (Ubah), Save (Simpan), Cancel (Batal), Delete (Hapus), Archive (Arsipkan), Restore (Pulihkan), Duplicate (Duplikat), Export (Ekspor). Use these verbs consistently; never mix Create/New/Make.
  ```

---

### 3.4 Module Specifications (`docs/05-modules/`)

#### `docs/05-modules/attendance.md` — Intro, ATT-001 & Acceptance Criteria
- **Before:**
  ```markdown
  Fast, forgiving, phone-first. Recording a 30-learner roster should take under 30 seconds.
  ...
  - **ATT-001** Attendance screen for a Session: roster (per DM-013) with large rows. Each row has four status buttons (Present, Absent, Late, Excused) that use both icon and text, not color alone. The selected status is clearly highlighted. A sticky header shows "{marked} of {total} marked". A sticky bottom **Save** button.
  ...
  - Given 30 Learners, When "Mark all present" is tapped and 2 rows are changed to Absent and Late, Then Save writes 30 rows in one batch and the Session becomes `held`.
  ```
- **After:**
  ```markdown
  Fast, forgiving, battery/resource-conscious. Recording a 30-learner roster should take under 30 seconds across laptops, tablets, or phones.
  ...
  - **ATT-001** Attendance screen for a Session: roster (per DM-013) with clear rows. Each row has four status buttons (Present, Absent, Late, Excused) that use both icon and text, not color alone. The selected status is clearly highlighted. A sticky header shows "{marked} of {total} marked". A sticky bottom **Save** button on compact viewports or integrated action bar on laptop viewports.
  ...
  - Given 30 Learners, When "Mark all present" is clicked/tapped and 2 rows are changed to Absent and Late, Then Save writes 30 rows in one batch and the Session becomes `held`.
  ```

#### `docs/05-modules/schedule-sessions-today.md` — TDY-004 & TDY-010
- **Before:**
  ```markdown
  - **TDY-004** Quick actions on each card: **Attendance** (primary), **Plan**, **Note**. Two taps from Today reach any of them.
  ...
  - **TDY-010** Week view: 7 days starting at the user's `week_start`, rendered as a vertical agenda on mobile (day headers with date, then compact Session cards). Overlap flags apply. Tapping a day header opens Today for that date. Previous/next week navigation.
  ```
- **After:**
  ```markdown
  - **TDY-004** Quick actions on each card: **Attendance** (primary), **Plan**, **Note**. Two clicks/taps from Today reach any of them.
  ...
  - **TDY-010** Week view: 7 days starting at the user's `week_start`. On laptop-class landscape viewports, renders as a multi-column schedule grid taking advantage of screen width; on compact phone/tablet viewports, adapts to a vertical agenda (day headers with date, then compact Session cards). Overlap flags apply. Clicking/tapping a day header opens Today for that date. Previous/next week navigation.
  ```

#### `docs/05-modules/notes.md` — Intro, NOT-001 & NOT-007
- **Before:**
  ```markdown
  Quick capture between classes, one-handed. Notes may contain sensitive observations about minors: no logging of content, no analytics, and they are **not** included in CSV exports in the MVP.
  ...
  - **NOT-001** A floating "Add note" action is available on Today, Session detail, Group detail and Learner profile, opening a compact sheet with the context preselected.
  ...
  - **NOT-007** More → Notes shows all recent Notes (newest first, cursor) with their context (Group, Learner, date).
  ```
- **After:**
  ```markdown
  Quick capture between classes across all device tiers (laptop, tablet, phone). Notes may contain sensitive observations about minors: no logging of content, no analytics, and they are **not** included in CSV exports in the MVP.
  ...
  - **NOT-001** A quick-capture "Add note" action is available on Today, Session detail, Group detail and Learner profile (a header action or modal trigger on laptop viewports; a floating action button opening a compact sheet on phone viewports), with the context preselected.
  ...
  - **NOT-007** Recent Notes view (directly accessible via navigation on laptop-class viewports; under **More → Notes** on phone-tier navigation) shows all recent Notes (newest first, cursor) with their context (Group, Learner, date).
  ```

#### `docs/05-modules/plans.md` — PLN-001 & PLN-002
- **Before:**
  ```markdown
  - **PLN-001** Plans tab: list newest-updated first, `limit` 50 with cursor, title search (bounded `LIKE`), filter by pack, "Archived" toggle. Shows title, pack name, updated date, and "used in {count} sessions" when attached.
  - **PLN-002** Create/edit a Plan: pack (default: the Group's pack when started from a Session, otherwise `generic`), title (1–120), and the pack's template sections rendered by kind: `text` (multiline, max 4000), `list` (add/remove rows, max 30 items, 200 chars each), `pairs` (term and definition rows, max 60). Required sections validated. Content stored as JSON validated by a Zod schema generated from the pack.
  ```
- **After:**
  ```markdown
  - **PLN-001** Plans view: list newest-updated first (responsive table or grid on laptop-class viewports, card list on phone viewports), `limit` 50 with cursor, title search (bounded `LIKE`), filter by pack, "Archived" toggle. Shows title, pack name, updated date, and "used in {count} sessions" when attached.
  - **PLN-002** Create/edit a Plan: pack (default: the Group's pack when started from a Session, otherwise `generic`), title (1–120), and the pack's template sections rendered by kind: `text` (multiline, max 4000), `list` (add/remove rows, max 30 items, 200 chars each), `pairs` (term and definition rows, max 60). Form adapts cleanly to wide viewports on laptop-class screens. Required sections validated. Content stored as JSON validated by a Zod schema generated from the pack.
  ```

#### `docs/05-modules/settings.md` — SET-001, SET-005, SET-006 & Acceptance Criteria
- **Before:**
  ```markdown
  - **SET-001** Settings screen under **More → Settings**: Language (English / Bahasa Indonesia), Timezone, Week starts on (Monday / Sunday / Saturday), and the Group display word ("Group" / "Class"; see glossary label layer).
  ...
  - **SET-005** Module toggles (Plans, Notes, Assessments, Progress Levels) with short descriptions. Disabling hides navigation and UI entry points; data is kept. Schedule, Sessions, Attendance, Groups, Learners are always on. Stored in `accounts.enabled_modules`.
  - **SET-006** More screen lists: Notes (if enabled), Workplaces, Settings, About (app version). No other items.
  ...
  - Given the Plans module disabled, Then the Plans tab and "Attach plan" actions are absent and no request to plans endpoints is made.
  ```
- **After:**
  ```markdown
  - **SET-001** Settings screen under **Settings** (directly in sidebar/top nav on laptop-class viewports; under **More → Settings** on phone-tier navigation): Language (English / Bahasa Indonesia), Timezone, Week starts on (Monday / Sunday / Saturday), and the Group display word ("Group" / "Class"; see glossary label layer).
  ...
  - **SET-005** Module toggles (Plans, Notes, Assessments, Progress Levels) with short descriptions. Disabling hides navigation and UI entry points across all viewport tiers; data is kept. Schedule, Sessions, Attendance, Groups, Learners are always on. Stored in `accounts.enabled_modules`.
  - **SET-006** More screen (on phone-tier navigation): lists Notes (if enabled), Workplaces, Settings, About (app version). On laptop-class viewports with sidebar/top navigation, these destinations are integrated directly into the primary navigation hierarchy.
  ...
  - Given the Plans module disabled, Then Plans navigation entry points and "Attach plan" actions are absent across all viewport tiers and no request to plans endpoints is made.
  ```

#### `docs/05-modules/progress-levels.md` — PRG-003
- **Before:**
  ```markdown
  - **PRG-003** Group → Progress: matrix with Learners as rows and skills as columns. Each cell shows the latest level chip and a trend arrow (up/same/down, GR-014). Tapping a cell opens a quick record sheet for that Learner and skill.
  ```
- **After:**
  ```markdown
  - **PRG-003** Group → Progress: matrix with Learners as rows and skills as columns, taking advantage of landscape width on laptop viewports. Each cell shows the latest level chip and a trend arrow (up/same/down, GR-014). Clicking or tapping a cell opens a quick record dialog/popover (or sheet on phone viewports) for that Learner and skill.
  ```

#### `docs/05-modules/assessments-scores.md` — ASM-002 & ASM-008
- **Before:**
  ```markdown
  - **ASM-002** Score entry screen: roster of Learners active on `held_on`, one row each. Numeric scale: decimal keypad (`inputmode="decimal"`, locale-aware decimal separator accepted both `.` and `,`). CEFR scale: a 6-option selector. Blank means "not entered" (GR-006). Inline validation per DM-014. Sticky Save with bulk `PUT`, draft handling per the frontend rule.
  ...
  - **ASM-008** Workplace grading settings screen (More → Workplaces → {name} → Grading): pass mark (0–100), letter bands editor (add/remove rows; mins strictly descending; lowest band min 0), CEFR bands editor (fixed six levels; mins ascending; first is 0), include-CEFR-in-average toggle, and "Reset to defaults". Validation errors are inline and translated.
  ```
- **After:**
  ```markdown
  - **ASM-002** Score entry screen: roster of Learners active on `held_on`, one row each. Adapts to wide table layout on laptop viewports and compact rows on phone viewports. Numeric scale: decimal input (`inputmode="decimal"`, locale-aware decimal separator accepted both `.` and `,`). CEFR scale: a 6-option selector. Blank means "not entered" (GR-006). Inline validation per DM-014. Sticky Save with bulk `PUT`, draft handling per the frontend rule.
  ...
  - **ASM-008** Workplace grading settings screen (Workplaces → {name} → Grading in navigation, or via More on phone tiers): pass mark (0–100), letter bands editor (add/remove rows; mins strictly descending; lowest band min 0), CEFR bands editor (fixed six levels; mins ascending; first is 0), include-CEFR-in-average toggle, and "Reset to defaults". Validation errors are inline and translated.
  ```

---

### 3.5 Architecture & PWA Specifications (`docs/06-architecture.md`)

- **Before:**
  ```markdown
  ## PWA
  - `display: standalone`, `start_url: "/"`, name "ClassQue", theme and background colors from design tokens.
  - Service worker precaches the app shell only. **Never cache `/api/*`.** Use `navigateFallbackDenylist` for `/api/` and `/cdn-cgi/` so Cloudflare Access login redirects are not swallowed. Register with `registerType: 'prompt'` so updates never reload mid-entry.
  - Verify the install and update flow behind Cloudflare Access before Phase 0 is marked done.
  ...
  ## Testing strategy
  ...
  - UI verification is manual with the browser tool at 360×800 and 768×1024, in both languages (AGENTS.md section 5).
  ```
- **After:**
  ```markdown
  ### Battery & Resource Consciousness (Client-Side Budget)
  The app targets portable, battery-powered devices (laptop > tablet > phone). Client-side performance is framed around conserving battery and memory during long school days, not merely saving bandwidth on phones:
  - Zero polling or auto-refresh loops.
  - Minimal DOM nodes and clean component unmounting.
  - Avoid continuous CSS animations, transitions on large layouts, or heavy canvas/WebGL renders.
  - Heavy formatting (CSV generation, print preview rendering) occurs strictly on client-demand.

  ## PWA & Installability
  - `display: standalone`, `start_url: "/"`, name "ClassQue", theme and background colors from design tokens.
  - Service worker precaches the app shell only. **Never cache `/api/*`.** Use `navigateFallbackDenylist` for `/api/` and `/cdn-cgi/` so Cloudflare Access login redirects are not swallowed. Register with `registerType: 'prompt'` so updates never reload mid-entry.
  - Verify the install and update flow behind Cloudflare Access before Phase 0 is marked done.

  ### Cross-Device & Cross-Browser Installability (Known Platform Limitations)
  Installability is a priority across the device tiers (laptops, tablets, phones), but platform capabilities vary significantly across operating systems and browsers. Rather than assuming full feature parity, the following known constraints are explicitly documented:

  1. **Apple iOS / iPadOS Safari (WebKit):**
     - **No Programmatic Install Prompt:** WebKit does not support the standard `beforeinstallprompt` event or programmatic install banners. Installation requires manual user action via the Safari Share Sheet → "Add to Home Screen".
     - **Storage Eviction (ITP 7-Day Cap):** In Safari browser tabs, WebKit's Intelligent Tracking Prevention (ITP) may delete client storage (`localStorage`, `IndexedDB`) after 7 days without user interaction. Standalone Home Screen PWAs run in an isolated WebKit container and are exempt from the 7-day cap, though still subject to device-wide low-disk storage eviction.
     - **No Background Sync:** WebKit does not support the Background Sync API or Periodic Background Sync API. All synchronization and draft persistence occur during active foreground sessions.
     - **Web Push Restrictions:** Web Push requires iOS/iPadOS 16.4+ and functions *only* when the PWA has been added to the Home Screen (unsupported in browser tabs). Push notifications are out of scope for MVP (H3), but this is a structural platform limitation.
     - **Navigation Gesture Collisions:** In standalone mode, iOS edge-swipe gestures (swipe from left/right screen edge to navigate page history) cannot be disabled and may collide with wide modal drag handlers or horizontal carousels unless touch-action is strictly isolated.
     - **Manifest Property Ignorance:** WebKit ignores `orientation` declarations in the manifest. Status bar styling must be controlled via the `<meta name="apple-mobile-web-app-status-bar-style">` tag.

  2. **Desktop Browsers (Chromium / Safari macOS / Firefox):**
     - **Chromium & Edge (Windows, macOS, Linux, ChromeOS):** Full PWA support with omnibox install prompts, desktop windowing, window controls overlay, and persistent storage.
     - **macOS Safari (Sonoma 14+):** Supports "Add to Dock" via File → Add to Dock. Lacks programmatic install events. Runs in a dedicated web application container.
     - **Desktop Firefox:** Does not natively support desktop PWA installation (no standalone window mode) without third-party browser extensions. Runs purely as an in-tab web application.
  ...
  ## Testing strategy
  ...
  - UI verification is manual with the browser tool across device tiers: primary laptop landscape (e.g. 1280×800 or 1024×768), tablet (e.g. 768×1024), and phone (e.g. 360×800), in both languages (AGENTS.md section 5). Verify that navigation adapts cleanly (sidebar/top navigation on laptop; bottom navigation on phone), layouts exploit landscape width on laptop without horizontal page scrolling, and interactions are touch- and mouse-friendly.
  ```

---

### 3.6 Roadmap Definitions of Done (`docs/07-roadmap.md`)

- **Before:**
  ```markdown
  - App shell: bottom navigation (Today · Week · Groups · Plans · More) with placeholder screens, Settings (SET-001–SET-006).
  ...
  **Definition of done:** the first four success criteria in `00-overview.md` are met on a phone-sized viewport; all requirement IDs above are Done with tests where logic exists; top-up idempotency and overlap detection are unit-tested; budgets reviewed (rows read/written logged for Today and Attendance saves).
  ...
  **Definition of done:** all grading test vectors in `04-grading.md` pass; score entry for 30 learners works on a phone; display-scale switching never changes stored data; CEFR Progress Level matrix works for the English pack and is absent for the Generic pack.
  ```
- **After:**
  ```markdown
  - App shell: responsive navigation (sidebar or top navigation on laptop-class viewports; bottom navigation on phone-tier viewports: Today · Week · Groups · Plans · More) with placeholder screens, Settings (SET-001–SET-006).
  ...
  **Definition of done:** the first four success criteria in `00-overview.md` are met across target viewports, with laptop-class landscape as the primary design target and phone/tablet viewports fully functional; all requirement IDs above are Done with tests where logic exists; top-up idempotency and overlap detection are unit-tested; budgets reviewed (rows read/written logged for Today and Attendance saves).
  ...
  **Definition of done:** all grading test vectors in `04-grading.md` pass; score entry for 30 learners works efficiently across laptops, tablets, and phones; display-scale switching never changes stored data; CEFR Progress Level matrix works for the English pack and is absent for the Generic pack.
  ```

---

### 3.7 Decisions & Formal Paper Trail (`docs/08-decisions.md`)

- **New Decision Entry Appended:**
  ```markdown
  | D-022 | Responsive layout with laptop primary (laptop > tablet > phone); reframing performance as battery/resource-conscious | Accepted | Corrects misleading "mobile-first" framing based on tester device usage data. Reverses H8 single-breakpoint phone assumption: laptop landscape viewports (≥ 1024 px) are the primary design target; tablet and phone viewports are fully supported secondary tiers; navigation is viewport-conditional (sidebar/top nav on laptop, bottom nav on phone). Client performance is framed around conserving battery/memory on portable devices during long teaching days. Documents known platform limitations for iOS Safari PWA (no `beforeinstallprompt`, 7-day tab ITP storage cap, no background sync, standalone-only push) and desktop browsers. |
  ```

---

## 4. Verification Check Summary

| Verification Step | Command | Result | Notes |
|---|---|---|---|
| TypeScript compilation | `npm run typecheck` | PASS | 0 errors |
| Linting | `npm run lint` | PASS | 0 errors |
| Unit & Integration tests | `npm test` | PASS | 14 test suites passed, 67 tests passed |
| i18n key parity & check | `npm run check:i18n` | PASS | 0 errors, parity confirmed |
| Production build | `npm run build` | PASS | Client assets and PWA service worker generated cleanly |
| Code changes audit | `git status` | PASS | No application code modified (`src/` untouched) |
