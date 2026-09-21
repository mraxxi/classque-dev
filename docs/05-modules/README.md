---
trigger: always_on
---

# Modules index

Each file defines requirement IDs (`XXX-nnn`) with acceptance criteria. Track status per ID in every report.

| Module | File | ID prefix | Phase |
|---|---|---|---|
| Identity | `identity.md` | IDN | 0 |
| Settings | `settings.md` | SET | 0–0.1 |
| Workplaces and Terms | `workplaces.md` | WPL | 0.1 (grading settings in 0.3) |
| Groups and Learners | `groups-learners.md` | GRP, LRN | 0.1 |
| Schedule, Sessions, Today, Week | `schedule-sessions-today.md` | SCH, TDY | 0.1 |
| Attendance | `attendance.md` | ATT | 0.1 |
| Plans | `plans.md` | PLN | 0.2 |
| Notes | `notes.md` | NOT | 0.2 |
| Assessments and Scores | `assessments-scores.md` | ASM | 0.3 |
| Progress Levels | `progress-levels.md` | PRG | 0.3 |
| Export and print | `export.md` | EXP | 0.4 |
| Reports | `reports.md` | RPT | later (0.5) |
| Billing and hours | `billing-hours.md` | BIL | later (design notes only) |

Conventions used in module files:
- "MUST" = required; "SHOULD" = expected unless there is a documented reason; "MAY" = optional.
- Acceptance criteria are written as *Given / When / Then* and double as the manual and automated test list.
- Endpoints listed are the complete set for the module. Do not add others (see AGENTS.md H3, section 8).
- All endpoints require identity (IDN-001) and follow `.agents/rules/cloudflare-and-database.md`.
