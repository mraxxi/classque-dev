---
trigger: always_on
---

# Progress Levels (PRG) — Phase 0.3

A dated judgment of a learner's level per skill (CEFR for the English pack). It is a long-term record, separate from test scores (GR-003).

## Requirements
- **PRG-001** Available only when the Group's pack has `progressScale != null` (PK-006) and the module is enabled (SET-005).
- **PRG-002** Record a level: Learner, skill (from pack), level (A1–C2), date (default today), optional note (max 200). Records are append-only; a correction is a new record with a later date, or a delete.
- **PRG-003** Group → Progress: matrix with Learners as rows and skills as columns. Each cell shows the latest level chip and a trend arrow (up/same/down, GR-014). Tapping a cell opens a quick record sheet for that Learner and skill.
- **PRG-004** Learner → Progress: per-skill timeline of records, newest first.
- **PRG-005** The Learner profile summary shows the latest level per skill across all Groups (DM-016) via `latestProgress`.
- **PRG-006** Hard-delete of a record is allowed with confirmation.

## Endpoints
| Method | Path |
|---|---|
| POST | `/api/v1/progress-levels` |
| DELETE | `/api/v1/progress-levels/:id` |
| GET | `/api/v1/groups/:id/progress` (latest and previous per learner and skill; bounded by 100 learners × 6 skills) |
| GET | `/api/v1/learners/:id/progress-levels?skill=&limit=&cursor=` |

## Acceptance criteria
- Given records B1 (March) then B2 (June) for Speaking, Then the matrix shows B2 with an up arrow and the timeline shows both.
- Given a Group on the Generic pack, Then no Progress UI or requests exist for it.

