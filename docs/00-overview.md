# 00 — Overview

## What ClassQue is
ClassQue is a mobile-first web planner for **individual teachers**. It helps one teacher see what they teach today, plan it, record attendance and scores, and keep notes. It works for teachers at institutions, independent (freelance) teachers, and teachers who do both at once.

## Identity
- **A planner first.** Time is the main axis: Today, Week, then everything else hangs off sessions.
- **Calm and minimal.** Few taps, little typing, no clutter. It should feel like a well-kept paper planner.
- **Subject-agnostic core** with swappable **Subject Packs** (English first).

## Users and scale
- Launch: 5–20 teachers, invite-only. Testers are English teachers, some institutional, some freelance, some both.
- Languages: English (default), Indonesian (optional, per user).
- Learners are frequently minors: treat their data as sensitive personal data (see `06-architecture.md` §Privacy).

## Design principles
1. **Today is the heart.** Everything frequent is at most two taps from Today.
2. **Minimize typing.** Defaults, toggles, pickers, bulk paste.
3. **Where vs who.** A *Workplace* holds the rules of a teaching arrangement; *Groups* and *Learners* live inside it. See `02-domain-model.md`.
4. **Record, don't overwrite.** Scores are stored as entered; conversions (percent, letter, CEFR) are derived views.
5. **Ready, not built.** Multi-user, roles and sharing are prepared in the data model (`account_id`, `role`, `visibility`) but have no UI or endpoints.
6. **Spec-driven.** Behavior is defined by requirement IDs in `docs/05-modules/`. Build only what is specified.
7. **Free-tier by design.** See `06-architecture.md` §Budgets.

## Non-goals (MVP)
Student or head-teacher access, teacher collaboration, messaging, payments/invoicing, AI generation, push notifications, calendar sync, file uploads or libraries, true offline sync, plan-format export (school-mandated lesson plan documents), holiday calendars.

## Success criteria for the first tester round
- A teacher can set up a Workplace, a Group with 30 learners (bulk paste) and a weekly schedule in under 5 minutes.
- Attendance for a 30-learner session can be recorded in under 30 seconds.
- Today shows sessions from all Workplaces, ordered by time, with overlaps flagged.
- Scores can be entered for a whole group on a phone without a laptop.
- The same account can hold an institution Workplace and an independent Workplace without the two feeling mixed together.

## Document map
| File | Purpose |
|---|---|
| `01-glossary.md` | Standard terms, translation-key rules |
| `02-domain-model.md` | Entities, DDL, invariants |
| `03-subject-packs.md` | Pack schema, Generic and English packs |
| `04-grading.md` | Scales, conversions, aggregation rules |
| `05-modules/*.md` | One file per feature: requirement IDs, acceptance criteria, endpoints |
| `06-architecture.md` | Stack, approved dependencies, budgets, layout |
| `07-roadmap.md` | Phases and definitions of done |
| `08-decisions.md` | Decisions and open questions |