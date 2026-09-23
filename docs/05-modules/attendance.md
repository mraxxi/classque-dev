---
trigger: always_on
---

# Attendance (ATT) — Phase 0.1

Fast, forgiving, battery/resource-conscious. Recording a 30-learner roster should take under 30 seconds across laptops, tablets, or phones.

## Requirements
- **ATT-001** Attendance screen for a Session: roster (per DM-013) with clear rows. Each row has four status buttons (Present, Absent, Late, Excused) that use both icon and text, not color alone. The selected status is clearly highlighted. A sticky header shows "{marked} of {total} marked". A sticky bottom **Save** button on compact viewports or integrated action bar on laptop viewports.
- **ATT-002** "Mark all present": sets every **unmarked** row to Present; explicit marks are never overwritten.
- **ATT-003** Optional per-row note (max 200 chars) behind an icon, collapsed by default.
- **ATT-004** Save through `PUT /api/v1/sessions/:id/attendance` with `{ records: [{ learnerId, status, note? }] }`. Idempotent upsert of the provided rows in one `db.batch`; sets the Session to `held` when it was `scheduled` (DM-024) and returns the updated Session.
- **ATT-005** Draft handling per the frontend rule: unsaved changes persist locally, show "Not saved yet", and warn on leaving the screen.
- **ATT-006** Saving with unmarked Learners shows "{count} not marked" and allows saving; unmarked rows are not written.
- **ATT-007** Attendance summary `GET /api/v1/groups/:id/attendance-summary?from=&to=` (max 366 days) returns per Learner counts for each status and the **attendance rate** = (present + late) / (present + late + absent). Excused is excluded from the denominator. The same rule is a pure function in `src/shared/` used by Learner profile and exports.
- **ATT-008** Past Sessions can be edited at any time.
- **ATT-009** For `cancelled` or `rescheduled` Sessions the Attendance action is disabled with an explanation; existing rows are kept.
- **ATT-010** For `individual` Groups the roster has one row and the screen stays the same.

## Endpoints
| Method | Path |
|---|---|
| GET | `/api/v1/sessions/:id/attendance` (roster with current statuses) |
| PUT | `/api/v1/sessions/:id/attendance` |
| GET | `/api/v1/groups/:id/attendance-summary?from=&to=` |
| GET | `/api/v1/learners/:id/attendance-summary?from=&to=` |

## Acceptance criteria
- Given 30 Learners, When "Mark all present" is clicked/tapped and 2 rows are changed to Absent and Late, Then Save writes 30 rows in one batch and the Session becomes `held`.
- Given a save fails due to a dropped connection, Then the draft remains, "Not saved yet" is shown, and a retry saves successfully with no duplicates.
- Given a Learner who left the Group before the Session date, Then they are not on the roster (DM-013).
- Given 3 present, 1 late, 1 absent, 2 excused, Then the rate is 4/5 = 80%.
