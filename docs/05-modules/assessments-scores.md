---
trigger: always_on
---

# Assessments and Scores (ASM) — Phase 0.3

Rules for conversion and aggregation are in `04-grading.md`; this file defines screens and behavior.

## Requirements
- **ASM-001** Create an Assessment for a Group: title (1–80), type (from the Group's pack), input scale (`numeric` | `cefr`; initial from the type's `defaultScale`), max score (numeric only; default from type or 100), weight (0.1–10, default 1), date (default today), skill (optional, from pack).
- **ASM-002** Score entry screen: roster of Learners active on `held_on`, one row each. Adapts to wide table layout on laptop viewports and compact rows on phone viewports. Numeric scale: decimal input (`inputmode="decimal"`, locale-aware decimal separator accepted both `.` and `,`). CEFR scale: a 6-option selector. Blank means "not entered" (GR-006). Inline validation per DM-014. Sticky Save with bulk `PUT`, draft handling per the frontend rule.
- **ASM-003** Optional per-row comment (max 200 chars).
- **ASM-004** Per-Assessment statistics per `04-grading.md`: entered count ("24/28 entered"), average, min, max, pass count and rate (numeric); distribution per level (CEFR).
- **ASM-005** Group → Assessments list, newest first, with type, date, scale, entered count and average.
- **ASM-006** Display scale switch (Numeric % · Letter · CEFR) on score screens. Converted values show "≈" with a hint (GR-004). The choice is remembered per device.
- **ASM-007** Learner → Scores: Assessments and Scores list, weighted average, letter/pass per the display scale, latest Progress Levels (PRG). Period filter (Term dates or custom range, default last 90 days).
- **ASM-008** Workplace grading settings screen (Workplaces → {name} → Grading in navigation, or via More on phone tiers): pass mark (0–100), letter bands editor (add/remove rows; mins strictly descending; lowest band min 0), CEFR bands editor (fixed six levels; mins ascending; first is 0), include-CEFR-in-average toggle, and "Reset to defaults". Validation errors are inline and translated.
- **ASM-009** Archive/restore an Assessment. Scores are kept.
- **ASM-010** After Scores exist: the input scale cannot change; `max_score` cannot be set below the highest existing score. Show a translated explanation.

## Endpoints
| Method | Path |
|---|---|
| GET, POST | `/api/v1/groups/:id/assessments` |
| GET, PATCH | `/api/v1/assessments/:id` |
| POST | `/api/v1/assessments/:id/archive`, `/restore` |
| GET, PUT | `/api/v1/assessments/:id/scores` (PUT = bulk upsert of provided rows) |
| GET | `/api/v1/learners/:id/scores?from=&to=` (bounded) |
| GET, PUT | `/api/v1/workplaces/:id/grading` |

## Acceptance criteria
- Given a numeric Assessment out of 20 and a Score of 15, Then it displays 75% and letter B with the default bands.
- Given a CEFR Assessment and display scale Numeric, Then the value shows "≈52.5" style output flagged as converted, and the stored value is still the CEFR level.
- Given a Score above `max_score`, Then the row shows an inline error and Save is blocked for that row only until fixed.
- Given the pass mark is changed to 60, Then pass/fail indicators update everywhere without changing any stored Score.
