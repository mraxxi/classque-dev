---
trigger: always_on
---

# Reports (RPT) — later phase (0.5). Do not build before the owner approves this phase.

A printable **learner report** built from data the app already holds. Content and the system behind it matter more than layout; the layout is a single clean template.

## Contents of a report (per Learner, per Group, per period)
1. **Header:** learner name, Group, Workplace name (for `independent` Workplaces, the teacher's display name), period (Term or custom dates), generation date.
2. **Attendance:** held Sessions in the period, counts for present / late / absent / excused, and attendance rate (ATT-007).
3. **Scores:** table of Assessments in the period: title, type, date, score shown in the chosen **display scale**, weight. Converted values marked "≈".
4. **Overall:** weighted average, pass/fail against the Workplace pass mark, and the letter (when the display scale is letter).
5. **Progress Levels:** latest level per skill with previous level and trend (only when the Group's pack has a progress scale).
6. **Teacher comment:** free text, max 1000 chars, editable before printing.

## Requirements
- **RPT-001** Choose Group, period and display scale (Numeric %, Letter, CEFR). Parents who prefer letter grades use Letter. The last choice is remembered on the device.
- **RPT-002** **Batch generation:** one page per Learner (`page-break-after`), with an inline comment field per Learner shown before printing.
- **RPT-003** Output is print-friendly HTML (`@media print`, A4). The browser saves it as PDF. No server-side PDF (H1, H2).
- **RPT-004** Data is fetched from existing bounded endpoints (sessions and attendance summary, scores per Learner or Group, progress) and **computed client-side** with the shared grading functions (04). The Worker computes nothing new.
- **RPT-005** Teacher comments are stored: new table `report_comments (id, account_id, learner_id, group_id, period_key, body, updated_at)` with `UNIQUE (learner_id, group_id, period_key)`, added by a new forward-only migration in this phase.
- **RPT-006** No per-Workplace template customization in this phase. Custom layouts and plan-format export are separate future decisions.

## Acceptance criteria
- Given a Group of 28 Learners with letter display scale, Then the print preview has 28 pages, each with header, attendance, scores in letters, overall and comment.
- Given a Learner with no entered Scores in the period, Then the scores and overall sections show a translated "No scores in this period" message instead of empty or zero values.
- Given the display scale is changed, Then no stored data changes.
