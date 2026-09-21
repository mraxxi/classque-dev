---
trigger: always_on
---

# Export and print (EXP) — Phase 0.4

Keeps a teacher's data usable outside the app. All formatting happens **in the browser** from bounded API data (the Worker has 10 ms CPU per request); the Worker never generates files.

## Requirements
- **EXP-001** CSV: **Attendance** for a Group and date range (max 366 days). Matrix layout: first column Learner, then one column per Session date (`YYYY-MM-DD`), cells show the translated status, then totals per status and the attendance rate (ATT-007).
- **EXP-002** CSV: **Scores** for a Group and period. One row per Learner, one column per Assessment (title and date), then weighted average, pass/fail, and letter or CEFR per the chosen display scale (ASM-006). Not-entered cells are empty.
- **EXP-003** CSV: **Learners** of a Group (name, joined date).
- **EXP-004** CSV rules: UTF-8 **with BOM**; RFC 4180 quoting; delimiter selectable, comma (default) or semicolon (Excel in many locales expects `;`), remembered per device; numbers always written with a dot decimal; **formula-injection protection**: any cell beginning with `=`, `+`, `-`, `@`, tab or carriage return is prefixed with a single quote `'`.
- **EXP-005** Files download via `Blob` with the name `classque-<group-slug>-<attendance|scores|learners>-<YYYY-MM-DD>.csv`. Headers are translated using the user's language.
- **EXP-006** Print views (`@media print`, A4, navigation hidden): Week agenda; a **blank attendance sheet** (roster with empty date columns, for paper backup); single Plan (PLN-008).
- **EXP-007** Notes are **not** exported in the MVP. No server-side PDF generation.

## Endpoints
None new. Export uses existing bounded endpoints: sessions, attendance summary, scores, learners. If a needed dataset lacks a bounded endpoint, add an Open question rather than an endpoint.

## Acceptance criteria
- Given a Learner named `=HYPERLINK("x")`, When exported, Then the cell starts with `'`.
- Given semicolon delimiter selected, Then the file uses `;` and quotes cells containing `;`.
- Given the file opened in a spreadsheet application, Then Indonesian characters display correctly (BOM present).