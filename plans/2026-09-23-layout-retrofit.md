# Phase Plan: Responsive Layout Retrofit (Laptop Primary)

**Date:** 2026-09-23  
**Status:** PROPOSED — Awaiting owner review and explicit approval  
**Preceding Spec Commit:** `884a53aa679700a34a7edf36acd94418187b0ba9` (spec reframed from mobile-first to responsive-first with laptop primary)  
**Target:** Retrofit already-built web UI across Phase 0, Phase v0.1, and Phase v0.2 to match the corrected layout direction.

---

## 1. Goal

Retrofit the ClassQue web application UI (`src/web/`) to establish a **responsive-first architecture with laptop-class landscape viewports as the primary design target**, while ensuring tablet and phone viewports remain fully functional, secondary tiers that adapt cleanly.

Specifically, this plan addresses:
1. **Removing artificial phone-only constraints:**
   - In `Shell.tsx`, remove the artificial `max-w-md` (448px) container width restriction and unconditional `pb-16` bottom nav padding that forced laptop users into a narrow phone sliver.
2. **Implementing Viewport-Conditional Navigation:**
   - On laptop-class viewports (≥ 1024px / landscape) and tablet viewports (≥ 768px): render a persistent sidebar (or top navigation) displaying direct navigation destinations (Today, Week, Groups, Plans, Notes, Settings) without burying primary links behind a mobile "More" drawer.
   - On phone-tier viewports (< 768px): retain bottom navigation (**Today · Week · Groups · Plans · More**) with safe-area inset support.
3. **Screen & Component Layout Adaptation for Laptop Landscape:**
   - **Week View:** Replace the single vertical 7-day stack with a 7-column schedule grid on wide screens, taking advantage of landscape width while retaining the vertical agenda on phone viewports.
   - **Plans View:** Replace the single-column list with a responsive multi-column card grid or table (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), with horizontal filter bar.
   - **Plan Detail View:** Replace the cramped `max-w-xl` container with a spacious `max-w-4xl` / `max-w-5xl` layout designed for comfortable lesson preparation.
   - **Groups View:** Replace single-column list with a responsive card grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
   - **Attendance Roster:** Provide a structured wide row / table layout on laptop viewports where status buttons and note inputs sit cleanly in horizontal rows, maximizing vertical visibility of 30-learner rosters.
   - **Quick Capture Notes:** Reposition `FloatingAddNoteButton` cleanly on desktop (or integrate into header actions) and render centered modal dialogs on desktop viewports while preserving bottom sheets on phone viewports.
4. **Battery and Resource-Conscious Audit:**
   - Conduct a systematic performance review pass across `src/web/` checking for unnecessary polling intervals, `setInterval` / `setTimeout` usage, or re-render-heavy patterns.
5. **Updated Verification Viewport Standards:**
   - Mandate manual UI verification across:
     - **Primary:** Laptop landscape (1280×800 and 1024×768)
     - **Secondary:** Tablet portrait/landscape (768×1024)
     - **Secondary:** Phone compact (360×800)
6. **Transparent PWA Platform Verification:**
   - Clearly delineate locally verified browsers (Chromium and Firefox on Linux) from documented platform constraints (iOS Safari and macOS Safari WebKit).

---

## 2. Files to Change

### 2.1 Core Layout & Navigation
| File | Current Limitation | Proposed Retrofit |
|---|---|---|
| `src/web/components/Shell.tsx` | Restricted to `max-w-md mx-auto` (448px) and unconditional `pb-16` bottom padding. | Responsive application frame: on laptop/tablet (`md:`/`lg:` breakpoint, ≥ 768px / 1024px), switch to horizontal layout with persistent sidebar and full-width main content area (`max-w-7xl` or dynamic fluid layout with no bottom padding). On compact phone (< 768px), keep column layout with `pb-16` and bottom nav. |
| `src/web/components/Navigation.tsx` | Bottom bar only with fixed 5 tabs (Today, Week, Groups, Plans, More). | Viewport-conditional navigation: on desktop/laptop (`md:`/`lg:`), render a sleek sidebar navigation with app header/branding, active workplace indicator, primary links (Today, Week, Groups, Plans [if enabled], Notes [if enabled], Settings) with icons and text labels. On phone (< 768px), render existing bottom navigation bar. |
| `src/web/components/WorkplaceSwitcher.tsx` | Sub-header dropdown above main view. | Adapt for clean placement inside the desktop sidebar header, while preserving compact sub-header placement on phone viewports. |

### 2.2 Feature Screens & Views
| File | Current Limitation | Proposed Retrofit |
|---|---|---|
| `src/web/features/today/TodayScreen.tsx` | Single narrow column with `pb-20`. | On laptop viewports, expand container; display session cards in a spacious responsive layout (or two-column overview: today agenda + quick status/notes panel), removing phone-only bottom padding. |
| `src/web/features/week/WeekScreen.tsx` | 7 days stacked in a single vertical list. | On laptop landscape (≥ 1024px), render a 7-column calendar schedule grid taking full advantage of widescreen display (`grid grid-cols-7 gap-3`), showing compact session cards within each day's column. On compact phone viewports (< 1024px), retain vertical agenda list. |
| `src/web/features/groups/GroupsScreen.tsx` | Stacked list in narrow column. | On laptop viewports, render a responsive multi-column card grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`). |
| `src/web/features/groups/GroupDetailScreen.tsx` | Narrow tab container and stacked roster. | Expand container (`max-w-5xl`); tabs and roster adapt to wide multi-column layout for learners, rules, sessions, and notes. |
| `src/web/features/learners/LearnerProfileScreen.tsx` | Narrow container with `pb-20`. | Expand container (`max-w-4xl`); spacious layout for learner details, note stream, and future progress level timelines. |
| `src/web/features/plans/PlansScreen.tsx` | Stacked card list in narrow container. | On laptop viewports, render as a responsive multi-column grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`) or responsive table; expand search and pack filter bar horizontally across top header. |
| `src/web/features/plans/PlanDetailScreen.tsx` | Artificially capped to `max-w-xl`. | Expand container to `max-w-4xl` / `max-w-5xl`. Adapt form sections (metadata, text, list items, pairs) to wide viewports with comfortable side-by-side or spacious vertical layouts. |
| `src/web/features/plans/PlanPrintView.tsx` | Already `max-w-4xl`, but verify print styles. | Verify print preview layout and responsive behavior across screen sizes. |
| `src/web/features/notes/NotesScreen.tsx` | Artificially capped to `max-w-xl` with `pb-20`. | Expand container (`max-w-4xl` or responsive grid); render notes stream in a clean, readable layout without phone bottom padding. |
| `src/web/features/sessions/SessionDetailScreen.tsx` | Artificially capped to `max-w-xl` with `pb-20`. | Expand container to `max-w-4xl` / `max-w-5xl`. Session header, plan attachment card, attendance roster, and notes section adapt cleanly across screen width. |
| `src/web/features/settings/SettingsScreen.tsx` | Narrow container with `pb-20`. | Expand container (`max-w-3xl` / `max-w-4xl`); format preferences and module toggles into clean desktop settings cards, removing bottom nav padding on desktop. |
| `src/web/features/more/MoreScreen.tsx` | Phone-only navigation screen. | Retained for phone viewports; on laptop viewports, sidebar directly exposes Settings, Notes, Workplaces, and About. |

### 2.3 Interactive Components & Modals
| File | Current Limitation | Proposed Retrofit |
|---|---|---|
| `src/web/components/SessionCard.tsx` | Styled strictly for narrow vertical cards. | Ensure styling adapts cleanly whether inside a wide horizontal container (Today view) or a compact grid column (Week 7-column view). |
| `src/web/components/AttendanceRoster.tsx` | Stacked card rows where each learner has name, 4 buttons, and note field vertically stacked. | On laptop landscape viewports, provide a structured horizontal row / table layout where learner name, status button group, and note input align on a single row, maximizing vertical screen real estate for 30-learner rosters. Retain stacked card layout on phone viewports. |
| `src/web/components/FloatingAddNoteButton.tsx` | Fixed `bottom-20 right-4` assuming bottom nav; slide-up bottom sheet on all screens. | Viewport-conditional: on laptop viewports, place cleanly at `bottom-6 right-6` (or offer header trigger) and render a centered modal dialog (`sm:items-center sm:max-w-lg`). On phone viewports, retain `bottom-20 right-4` and slide-up bottom sheet. |
| `src/web/components/AttachPlanModal.tsx` | Fixed modal styles. | Ensure centered modal dialog adapts smoothly across laptop and phone screen widths. |
| `src/web/components/NotesList.tsx` | Vertical stacked list. | Ensure cards adapt comfortably in wider desktop containers. |

---

## 3. Battery & Performance Review Pass

A code audit of `src/web/` was conducted to examine potential resource drain, unnecessary intervals, and polling patterns:

1. **Interval & Polling Audit:**
   - Grep search for `setInterval`: **0 occurrences found**.
   - Grep search for `setTimeout`: **0 occurrences found**.
   - Polling checks: TanStack Query `refetchInterval` is **not used anywhere**.
   - Window focus refetching: `main.tsx` sets global default `refetchOnWindowFocus: false` and `staleTime: 5 * 60 * 1000` (5 minutes). The only exception is `TodayScreen.tsx` which explicitly enables `refetchOnWindowFocus: true`, matching the spec guideline (*"Refetch on window focus is allowed only for the Today view"*).
2. **Top-Up Mutation Behavior:**
   - In `TodayScreen.tsx`, `api.schedule.topUp(localToday)` is triggered on mount via `useEffect` with `[activeWorkplaceId, localToday, queryClient]` dependency array. It runs once when navigating to Today, preventing background battery burn.
3. **DOM & Rendering Recommendations during Retrofit:**
   - Keep WeekScreen 7-column view lightweight by avoiding heavy canvas/calendar components; use standard semantic HTML with CSS Grid.
   - For AttendanceRoster horizontal rows on laptop viewports, ensure button state updates only re-render the individual row component or use lightweight inline state to avoid whole-list thrashing on rapid attendance clicking.
   - Avoid continuous CSS animations or transitions on layout containers.

---

## 4. PWA Installability Verification Strategy

Per the spec update and platform research, we explicitly categorize browser verification:

### 4.1 Directly Verified Locally on Linux System
The following browsers are installed on the local system (`/usr/bin/chromium` and `/usr/bin/firefox`):
- **Chromium (`/usr/bin/chromium`):**
  - Verify manifest (`dist/manifest.webmanifest`) detection and service worker (`dist/sw.js`) registration.
  - Verify PWA install prompt / omnibox install icon detection.
  - Verify standalone window launch mode.
- **Firefox (`/usr/bin/firefox`):**
  - Verify service worker caching and offline app shell fallback.
  - Plainly confirm and report the known limitation: desktop Firefox does not support native PWA desktop standalone window installation without third-party extensions; it runs in-tab as expected.

### 4.2 Documented Platform Limitations (Researched & Acknowledged)
Because iOS and macOS environments are not natively executable on this Linux environment, the following known constraints are referenced from official WebKit and Apple developer documentation:
- **Apple iOS / iPadOS Safari (WebKit):**
  - No `beforeinstallprompt` event or programmatic install banners. Installation relies on manual user action (Safari Share Sheet → "Add to Home Screen").
  - Intelligent Tracking Prevention (ITP) 7-day storage cap applies to browser tabs; standalone Home Screen PWAs run in an isolated WebKit container exempt from the 7-day cap.
  - No Background Sync API or Periodic Background Sync API in WebKit; sync occurs only during active foreground sessions.
  - Web Push requires iOS/iPadOS 16.4+ in standalone mode only.
- **macOS Safari (Sonoma 14+):**
  - "Add to Dock" is a browser-menu action; no programmatic install prompt. Runs in a containerized web application window.

---

## 5. Tests

1. **Automated Test Suite Integrity:**
   - Run `npm test` to ensure all 14 existing test suites and 67 tests remain green.
   - Update and add unit tests for components touching viewport-conditional logic (e.g. testing `Navigation` desktop sidebar vs mobile bottom nav rendering, `WeekScreen` rendering days grid, `AttendanceRoster` row formatting).
2. **Static Analysis & Linting:**
   - Run `npm run typecheck` to confirm 0 TypeScript errors across all modified components.
   - Run `npm run lint` to verify 0 ESLint errors.
   - Run `npm run check:i18n` to verify no hardcoded user-facing strings or missing/unused translation keys in English and Indonesian.
3. **Production Build & Bundle Budget:**
   - Run `npm run build` to verify Vite production compilation, CSS generation, asset hashing, and PWA service worker precaching.

---

## 6. Verification Mapping

| Verification Check | Target Viewport / Environment | Success Criteria |
|---|---|---|
| **Laptop Landscape (Primary)** | **1280×800** (and 1024×768) | - Persistent sidebar navigation displayed on left; bottom nav completely hidden.<br>- Full width utilized cleanly (`max-w-7xl` or spacious fluid container); no 448px sliver.<br>- `WeekScreen` renders 7-column calendar schedule grid with compact cards.<br>- `PlansScreen` renders multi-column card grid.<br>- `PlanDetailScreen` renders wide, spacious lesson plan form.<br>- `AttendanceRoster` renders clean horizontal rows with name, status buttons, and note input aligned.<br>- `FloatingAddNoteButton` dialog renders as a centered modal, not bottom sheet.<br>- No horizontal page scroll; 44px minimum touch targets maintained. |
| **Tablet Viewport (Secondary)** | **768×1024** | - Smooth layout adaptation; readable typography; no clipping or horizontal page scroll.<br>- Appropriate navigation state (sidebar or top nav depending on width). |
| **Phone Viewport (Secondary)** | **360×800** | - Bottom navigation bar visible; sidebar hidden.<br>- `WeekScreen` renders vertical agenda list.<br>- `AttendanceRoster` renders stacked card layout.<br>- `FloatingAddNoteButton` sits at `bottom-20` and opens slide-up bottom sheet.<br>- All tap targets ≥ 44px. |
| **i18n Live Parity** | All viewports, both languages (`en`, `id`) | Switching language updates all labels in sidebar/bottom nav, headers, and buttons immediately without reload. |
| **PWA Installability** | Chromium & Firefox (local Linux) | Manifest and service worker load without errors; app shell cached; Chromium shows install capability; Firefox runs offline shell in-tab. |

---

## 7. Risks & Mitigations

1. **Risk:** Removing `max-w-md` in `Shell.tsx` could cause unconstrained wide screens where text runs the entire width of an ultrawide monitor.  
   **Mitigation:** Use a balanced maximum content container (e.g. `max-w-7xl mx-auto w-full px-6 py-6`) on the desktop main area to keep line lengths ergonomic and visually pleasing.
2. **Risk:** Breakpoint mismatch between navigation and page content causing awkward intermediate layouts.  
   **Mitigation:** Standardize the mobile-to-desktop transition at Tailwind's `md` (768px) or `lg` (1024px) breakpoint consistently across `Shell`, `Navigation`, and all screens.
3. **Risk:** Week view 7-column grid becoming too narrow on smaller laptop screens (e.g. 1024px).  
   **Mitigation:** Use `grid-cols-7` with `min-w-[120px]` per column inside an horizontally scrollable day grid container if the viewport dips below minimum column readability, or trigger 7 columns at `lg:grid-cols-7` and vertical/multi-column at `md:`.

---

## 8. Assumptions

1. Tailwind CSS built-in responsive variants (`sm:`, `md:`, `lg:`, `xl:`) provide all required styling hooks without needing window-resize event listeners or additional CSS-in-JS libraries (preserving H11).
2. Desktop sidebar navigation is the standard expected pattern for laptop-class planner applications (offering immediate visibility of Today, Week, Groups, Plans, Notes, Settings, and Workplace context).
3. The phone experience is preserved with 100% fidelity: bottom navigation, slide-up sheets, and stacked card rosters remain active for viewports under the responsive breakpoint.

---

## 9. Open Questions (Owner)

1. **Desktop Navigation Style:**
   - *Proposal:* A clean, persistent left sidebar navigation at `md:`/`lg:` breakpoint (~240px width) displaying the ClassQue logo/title, active workplace switcher, and nav items (Today, Week, Groups, Plans, Notes, Settings).
   - *Alternative:* Top horizontal navigation header bar.
   - *Proposed Default:* Left sidebar navigation (standard for modern productivity planners and provides optimal vertical space for schedule and calendar views).
2. **Week View Breakpoint for 7-Column Grid:**
   - *Proposal:* Display the 7-column grid at `lg:` (≥ 1024px, the laptop landscape target). On viewports below 1024px (tablets and phones), display the vertical agenda view.
   - *Proposed Default:* 7-column grid at `lg:` (≥ 1024px); vertical agenda on `< 1024px`.
