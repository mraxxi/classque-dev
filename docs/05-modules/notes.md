---
trigger: always_on
---

# Notes (NOT) — Phase 0.2

Quick capture between classes, one-handed. Notes may contain sensitive observations about minors: no logging of content, no analytics, and they are **not** included in CSV exports in the MVP.

## Requirements
- **NOT-001** A floating "Add note" action is available on Today, Session detail, Group detail and Learner profile, opening a compact sheet with the context preselected.
- **NOT-002** A Note attaches to at least one of Session, Group, Learner (DM constraint). Adding from a Session sets `session_id` and that Session's `group_id`; the teacher may also pick one Learner from the roster (`learner_id`). Body 1–2000 chars.
- **NOT-003** Lists of Notes per Learner, per Group and per Session: newest first, `limit` 50 with cursor.
- **NOT-004** Edit a Note; delete a Note (hard delete, confirmation required).
- **NOT-005** Adding a Note to a Session sets that Session `is_exception = 1` (DM-023).
- **NOT-006** Drafts persist locally until saved (frontend rule).
- **NOT-007** More → Notes shows all recent Notes (newest first, cursor) with their context (Group, Learner, date).
- **NOT-008** `visibility` is always `private`.

## Endpoints
| Method | Path |
|---|---|
| GET | `/api/v1/notes?learnerId=&groupId=&sessionId=&limit=&cursor=` (at least one filter, or none for the global list) |
| POST | `/api/v1/notes` |
| PATCH, DELETE | `/api/v1/notes/:id` |

## Acceptance criteria
- Given a Session, When a Note is added with a Learner chosen, Then it appears in the Session, Group and Learner note lists.
- Given a Note with no target, Then the API returns 400 `validation_failed`.
- Given a Note is deleted, Then it disappears from all lists and no other data changes.
