---
trigger: always_on
---

# Groups and Learners (GRP, LRN) — Phase 0.1

## Groups
- **GRP-001** Create a Group: name (1–80), Workplace (default: the only one, or the last one used), kind (`class` | `individual`), Subject Pack (default `generic`), room (optional), color from a fixed 8-color palette (`c1`–`c8`, auto-assigned to the least-used, changeable), Term (institution Workplaces only, optional).
- **GRP-002** `individual` Groups: the create form asks for the learner's name and creates Group, Learner and membership in one batch. The Group name defaults to the learner's name and is editable.
- **GRP-003** Edit a Group's name, room, color, Term. Workplace never changes (DM-010). Pack change per PK-005.
- **GRP-004** Archive a Group: archives its Schedule rules and deletes its future `scheduled`, non-exception Sessions in one batch; past data is kept. Restore brings back the Group; rules are restored and top-up regenerates Sessions.
- **GRP-005** Groups screen: list grouped by Workplace only when 2 or more exist; each row shows a color chip, name, learner count, kind icon, and the next Session. Client-side name search (the list is bounded by design; API limit 200).
- **GRP-006** Group detail with sections: Learners, Schedule, Upcoming Sessions, and (when those modules are enabled) Notes, Assessments, Progress. Each section is one screen or tab; no section loads until opened.

## Learners
- **LRN-001** Add one Learner to a Group: `display_name` 1–80 chars.
- **LRN-002** **Bulk add** by pasting names (one per line): trim, ignore blanks, de-duplicate case-insensitively within the paste and against the Group; show a preview with the count and duplicates flagged before saving; max 100 per paste; one `db.batch`.
- **LRN-003** A Learner may be in several Groups of the same Workplace. "Add existing learner" picks from the Workplace's Learners (bounded list, client-side filter).
- **LRN-004** Remove from Group sets `left_on = today` (history kept). Re-adding sets `left_on = NULL` and `joined_on = today`. Known limitation: roster editing for dates before the re-add does not include the Learner; existing Attendance rows stay visible in history.
- **LRN-005** Rename a Learner. Archive a Learner: sets `left_on = today` on all active memberships and hides the Learner from pickers.
- **LRN-006** Learner profile screen: name, Groups, attendance summary (counts and rate over a selectable range, default last 30 days, per ATT-007), and (when enabled) Notes, Scores and Progress Levels.
- **LRN-007** Rosters are ordered alphabetically by `display_name` using `Intl.Collator` for the user's locale. No manual ordering.
- **LRN-008** A Group holds at most 100 active Learners.

## Endpoints
| Method | Path |
|---|---|
| GET, POST | `/api/v1/groups` (GET: `workplaceId`, `includeArchived`, `limit`) |
| GET, PATCH | `/api/v1/groups/:id` |
| POST | `/api/v1/groups/:id/archive`, `/restore` |
| GET | `/api/v1/groups/:id/learners` (active members; `?includeLeft=`) |
| POST | `/api/v1/groups/:id/learners` (one or many: `{ names: string[] }` or `{ learnerIds: string[] }`) |
| POST | `/api/v1/groups/:id/learners/:learnerId/remove` |
| GET | `/api/v1/workplaces/:id/learners` (bounded, for the "add existing" picker) |
| GET, PATCH | `/api/v1/learners/:id` |
| POST | `/api/v1/learners/:id/archive` |

## Acceptance criteria
- Given a pasted list of 30 names with 2 duplicates, When previewed, Then 28 are shown to add and 2 flagged; saving inserts 28 Learners and memberships in one batch.
- Given an `individual` Group creation with a name, Then exactly one Group, one Learner and one active membership exist.
- Given a Group is archived, Then its future non-exception Sessions disappear from Today/Week and its past Sessions remain in history.
- Given an `independent` Workplace, Then the Term field is absent in the Group form.