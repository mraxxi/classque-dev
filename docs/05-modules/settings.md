---
trigger: always_on
---

# Settings (SET) — Phase 0 (screen) / 0.1 (all options)

## Requirements
- **SET-001** Settings screen under **Settings** (directly in sidebar/top nav on laptop-class viewports; under **More → Settings** on phone-tier navigation): Language (English / Bahasa Indonesia), Timezone, Week starts on (Monday / Sunday / Saturday), and the Group display word ("Group" / "Class"; see glossary label layer).
- **SET-002** Changing language applies immediately without reload and is persisted through `PATCH /api/v1/me`.
- **SET-003** Timezone picker uses `Intl.supportedValuesOf('timeZone')` with a static fallback list; the current selection is the browser timezone on first run.
- **SET-004** Changing timezone does not alter existing Sessions (each keeps its own `tz`, DM-004). Show a one-line notice about this (`settings.timezone.notice`).
- **SET-005** Module toggles (Plans, Notes, Assessments, Progress Levels) with short descriptions. Disabling hides navigation and UI entry points across all viewport tiers; data is kept. Schedule, Sessions, Attendance, Groups, Learners are always on. Stored in `accounts.enabled_modules`.
- **SET-006** More screen (on phone-tier navigation): lists Notes (if enabled), Workplaces, Settings, About (app version). On laptop-class viewports with sidebar/top navigation, these destinations are integrated directly into the primary navigation hierarchy.

## Acceptance criteria
- Given language switched to Indonesian, Then all visible text (including Subject Pack labels) is Indonesian or an item listed in `_todo`.
- Given the Plans module disabled, Then Plans navigation entry points and "Attach plan" actions are absent across all viewport tiers and no request to plans endpoints is made.
