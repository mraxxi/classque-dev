---
trigger: always_on
---

# Schedule, Sessions, Today and Week (SCH, TDY) — Phase 0.1

The heart of the planner. Today is the home screen.

## Schedule and Sessions
- **SCH-001** Add a Schedule to a Group: weekdays (multi-select Mon–Sun), start time, duration (quick picks 30/45/60/90/120 min plus custom 5–600), room (default: Group's room), start date (default today), end date (optional; defaults to the Group's Term end when set).
- **SCH-002** On save, generate Sessions per DM-020 in one `db.batch` and show how many were created.
- **SCH-003** Editing a Schedule follows DM-022. Deleting a Schedule archives the rule and removes future non-exception `scheduled` Sessions.
- **SCH-004** Add a one-off Session: Group, date, start time, duration, room. It has no rule and is an exception (`is_exception = 1`).
- **SCH-005** Session detail screen: Group (color), date and time range, status, room, Plan (if any), attendance summary, Notes count. Actions: Attendance, Plan, Note, Edit time/room, Cancel, Reschedule.
- **SCH-006** Status changes follow DM-024. Auto-`held` after saving Attendance shows a 10-second undo (returns to `scheduled`). Reschedule opens a date/time form, creates the new Session and marks the old one `rescheduled`.
- **SCH-007** `POST /api/v1/schedule/top-up` generates missing Sessions for all active rules within the window (DM-020/021). The client calls it at most once per local day and after rule changes. It returns the number created.
- **SCH-008** Each Session keeps the `tz` it was created with (SET-004).

## Today (home)
- **TDY-001** Today shows the selected local date and all Sessions of that date across all Workplaces ordered by `start_time`. Each card: time range, Group name with color chip, Workplace badge (WPL-005), status, Plan indicator (attached / none), attendance summary ("12/14 present" or "Not recorded").
- **TDY-002** The current or next Session is visually emphasized, using the device clock in the user's timezone.
- **TDY-003** Overlapping Sessions (DM-025) show a warning icon plus text "Overlaps with {group}" (`sessions.overlap`); the warning is informational, never blocking.
- **TDY-004** Quick actions on each card: **Attendance** (primary), **Plan**, **Note**. Two clicks/taps from Today reach any of them.
- **TDY-005** Empty states: no Sessions today → "No sessions today" with "Add session"; no Groups yet → guided first-run prompt to add a Group.
- **TDY-006** Date navigation: previous/next day, tap the date to jump, "Today" button to reset.
- **TDY-007** Performance: one request returns the range's Sessions plus attendance counts (single grouped query). Range is limited to 14 days per request.
- **TDY-008** Workplace filter (WPL-004) applies to Today and Week.

## Week
- **TDY-010** Week view: 7 days starting at the user's `week_start`. On laptop-class landscape viewports, renders as a multi-column schedule grid taking advantage of screen width; on compact phone/tablet viewports, adapts to a vertical agenda (day headers with date, then compact Session cards). Overlap flags apply. Clicking/tapping a day header opens Today for that date. Previous/next week navigation.
- **TDY-011** Week view uses the same endpoint and card component as Today (compact variant).

## Endpoints
| Method | Path |
|---|---|
| GET | `/api/v1/sessions?from=&to=&workplaceId=` (max 14 days; includes attendance counts) |
| POST | `/api/v1/sessions` (one-off) |
| GET, PATCH | `/api/v1/sessions/:id` |
| POST | `/api/v1/sessions/:id/cancel`, `/reschedule`, `/undo-held` |
| GET, POST | `/api/v1/groups/:id/schedule-rules` |
| PATCH, DELETE | `/api/v1/schedule-rules/:id` (DELETE = archive) |
| POST | `/api/v1/schedule/top-up` |

## Acceptance criteria
- Given a weekly Tue/Thu 10:00 Schedule for 60 min starting today, Then Sessions exist for the next 8 weeks and none before the start date.
- Given two Groups in different Workplaces both at 10:00 Tuesday, Then both appear on Today with an overlap warning on each.
- Given a Session marked `cancelled`, Then Attendance cannot be recorded (ATT-009) and top-up does not recreate it.
- Given the Schedule is edited, Then Sessions with a Plan attached are untouched (exceptions) and other future `scheduled` Sessions are regenerated.
- Calling top-up twice creates no duplicates.
