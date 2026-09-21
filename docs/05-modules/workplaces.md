---
trigger: always_on
---

# Workplaces and Terms (WPL) — Phase 0.1 (grading settings: 0.3)

A **Workplace** is where and under what rules the teacher teaches: an *institution* (school, language center) or *independent* (private and freelance learners). It solves the "teaches both" problem: rules live on the Workplace, people live in Groups inside it.

## Requirements
- **WPL-001** First login creates one `independent` Workplace (IDN-004). It can be renamed but the account always keeps at least one active Workplace.
- **WPL-002** Add a Workplace: `kind` (institution | independent) and `name` (1–80 chars). At most 10 active Workplaces per account.
- **WPL-003** Rename a Workplace. Archive is blocked while it has active Groups (error `workplaces.archive_blocked`); otherwise archive/restore work.
- **WPL-004** The Workplace switcher/filter (a chip row: All · each Workplace) appears in Today, Week and Groups **only when 2 or more active Workplaces exist**. The selection is UI state in `localStorage`, default "All". With one Workplace the concept is invisible.
- **WPL-005** Where a Session or Group card shows its Workplace, it is a text badge with a kind icon, shown only when 2 or more Workplaces exist. Color identity belongs to the Group, not the Workplace.
- **WPL-006** Terms: only for `institution` Workplaces. Fields: name (1–60), start date, end date (start ≤ end). List, add, edit, archive. Overlapping Terms are allowed. Groups may link to one Term (DM-011).
- **WPL-007** (Phase 0.3) Grading settings per Workplace (see ASM-008): pass mark, letter bands, CEFR bands, include-CEFR-in-average. Created lazily with defaults from `04-grading.md`.
- **WPL-008** A Learner belongs to one Workplace (DM-010). The UI never offers moving a Group or Learner between Workplaces in the MVP.

## Endpoints
| Method | Path |
|---|---|
| GET | `/api/v1/workplaces?includeArchived=` |
| POST | `/api/v1/workplaces` |
| PATCH | `/api/v1/workplaces/:id` |
| POST | `/api/v1/workplaces/:id/archive`, `/restore` |
| GET, POST | `/api/v1/workplaces/:id/terms` |
| PATCH | `/api/v1/terms/:id` |
| POST | `/api/v1/terms/:id/archive`, `/restore` |
| GET, PUT | `/api/v1/workplaces/:id/grading` (Phase 0.3) |

## Acceptance criteria
- Given one active Workplace, Then no switcher or badges appear anywhere.
- Given a second Workplace is added, Then the switcher appears and Today shows sessions from both with badges.
- Given a Workplace with an active Group, When archive is requested, Then it is refused with a translated message.
- Given a `independent` Workplace, Then the Terms UI is not offered.
