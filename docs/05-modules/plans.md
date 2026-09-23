---
trigger: always_on
---

# Plans (PLN) — Phase 0.2

A **Plan** is structured content prepared for a Session, shaped by the Group's Subject Pack template. Plans are structured (each section a field) so future exports to school-mandated formats are possible; no such export is built now.

## Requirements
- **PLN-001** Plans view: list newest-updated first (responsive table or grid on laptop-class viewports, card list on phone viewports), `limit` 50 with cursor, title search (bounded `LIKE`), filter by pack, "Archived" toggle. Shows title, pack name, updated date, and "used in {count} sessions" when attached.
- **PLN-002** Create/edit a Plan: pack (default: the Group's pack when started from a Session, otherwise `generic`), title (1–120), and the pack's template sections rendered by kind: `text` (multiline, max 4000), `list` (add/remove rows, max 30 items, 200 chars each), `pairs` (term and definition rows, max 60). Form adapts cleanly to wide viewports on laptop-class screens. Required sections validated. Content stored as JSON validated by a Zod schema generated from the pack.
- **PLN-003** Attach a Plan to a Session from Session detail: choose an existing Plan (searchable) or "New plan". Sets `sessions.plan_id` and `is_exception = 1`. Detach is allowed.
- **PLN-004** Duplicate a Plan: creates a copy titled from `plans.duplicate.title_suffix` ("{title} (copy)"), sets `source_plan_id`, unattached. From a Session, "Reuse plan from an earlier session" duplicates and attaches in one step.
- **PLN-005** A Plan may be attached to several Sessions. When editing a Plan used by more than one Session, show "Used in {count} sessions" with two actions: **Edit for all** or **Duplicate and edit**.
- **PLN-006** Archive/restore a Plan. Attached Sessions keep the link and show an "Archived" tag. There is no hard delete of Plans in the MVP.
- **PLN-007** `visibility` is always `private` (DM-007).
- **PLN-008** Print-friendly view of a single Plan (`@media print`, A4, hides navigation) opened from the Plan screen.
- **PLN-009** Draft handling per the frontend rule; unsaved edits persist locally and warn on leave.

## Endpoints
| Method | Path |
|---|---|
| GET, POST | `/api/v1/plans` (GET: `q`, `packId`, `includeArchived`, `limit`, `cursor`) |
| GET, PATCH | `/api/v1/plans/:id` |
| POST | `/api/v1/plans/:id/duplicate`, `/archive`, `/restore` |
| PUT | `/api/v1/sessions/:id/plan` (`{ planId: string \| null }`) |

## Acceptance criteria
- Given an English Group Session, When "New plan" is chosen, Then the form shows the English template sections with translated labels.
- Given a Plan attached to 3 Sessions, When edited, Then the "Used in 3 sessions" choice is offered.
- Given "Reuse plan from an earlier session", Then a new Plan copy is attached to the current Session and the original is unchanged.
- Given the Plans module is disabled (SET-005), Then none of these UI entry points appear.
