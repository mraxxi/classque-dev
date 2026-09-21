---
trigger: always_on
---

# 08 — Decisions and open questions

Status legend: **Accepted** = the owner stated or approved it. **Default** = assistant's proposal used unless the owner objects. **Proposed** = needs explicit owner confirmation before it is relied on.

Agents: read this before starting any task. Append new open questions at the bottom. Do not edit existing rows; propose changes instead.

## Decisions
| ID | Decision | Status | Notes |
|---|---|---|---|
| D-001 | Spec-driven build: requirement IDs, agent builds only what is specified | Accepted | Owner wants a plan/roadmap/spec that a coding agent reads |
| D-002 | Roadmap phases 0–v0.4 and the markdown spec structure | Accepted | Owner approved |
| D-003 | Planner identity, single-teacher scope, 5–20 users | Accepted | |
| D-004 | Hosting on Workers with Static Assets, not Pages Functions | Default | Cloudflare steers new full-stack projects to Workers; free limits in `06-architecture.md` |
| D-005 | Stack: React + Vite + TypeScript, Tailwind, React Router, TanStack Query | Default | Chosen for agent familiarity and ecosystem; changeable before Phase 0 starts |
| D-006 | Hono + Zod for the API; raw SQL migrations on D1, no ORM | Default | Fewer dependencies, easier for an agent to verify |
| D-007 | **Workplace** concept (institution / independent) above Group | Default | Solves teachers who work both institutionally and freelance |
| D-008 | Identity via Cloudflare Access; single `getIdentity()` choke point | **Proposed** | Needs owner confirmation and dashboard setup (Q-005) |
| D-009 | Offline-first dropped; PWA shell plus local drafts | Accepted | Owner: classrooms usually have wifi or tethering |
| D-010 | Subject Packs are typed data, assigned per Group | Default | Owner wants subject feature sets swappable without mixing |
| D-011 | Score, input scale, display scale, conversion tables kept separate; letter grades display-only | Default | See `04-grading.md`, Q-002 |
| D-012 | CEFR modelled as Progress Level plus optional Assessment scale | Default | Testers use CEFR frequently and also need 0–100 |
| D-013 | Group label configurable (Group / Class) | Default | Teachers say "class"; Indonesian UI likely "Kelas" |
| D-014 | Sessions store local wall-clock time plus IANA timezone | Default | "10:00 Tuesday class" is a local concept |
| D-015 | Sessions materialized 8 weeks ahead, top-up once per day | Default | Idempotent, bounded writes |
| D-016 | CSV and print generated in the browser; no server PDF | Default | Worker CPU limit and free-tier scope |
| D-017 | Report sheets are a later phase with the contents in `reports.md` | Default | Owner delegated layout; contents and system matter most |
| D-018 | Billing/hours module later; hooks are `groups.kind`, `sessions.status`, `duration_min` | Accepted | Owner liked the hooks |
| D-019 | Plan-format export deferred; Plans stay structured | Default | Owner undecided |
| D-020 | Archive instead of delete for Workplace/Group/Learner/Plan/Assessment | Default | Protects history and reports |
| D-021 | Learner belongs to exactly one Workplace | Default | Avoids cross-workplace de-duplication (Q-008) |

## Open questions (owner)
| ID | Question | Default until answered |
|---|---|---|
| Q-001 | Do testers use CEFR "plus" levels (A2+, B1+)? | No; A1–C2 only |
| Q-002 | Should teachers be able to *enter* grades directly as letters? | No; letters are display-only |
| Q-003 | Real letter bands, pass mark and CEFR↔percent bands used by testers' institutions | Placeholder defaults in `04-grading.md`; ask testers for a sample report sheet |
| Q-004 | Do institutions require hour or claim summaries from teachers? | Not built; see `billing-hours.md` |
| Q-005 | Confirm Cloudflare Access for login (check free-plan requirements), or choose email one-time codes / passkeys | Access (D-008), isolated in `getIdentity()` |
| Q-006 | Review the Indonesian draft labels in `01-glossary.md` and `03-subject-packs.md` | Drafts marked `_todo` |
| Q-007 | Brand assets (logo, colors) | Neutral placeholders, system fonts |
| Q-008 | Can the same person be a Learner in both an institution and an independent Workplace? | No; separate Learner records |
| Q-009 | Data retention and deletion policy for learner data (minors), before opening beyond testers | Archive only; no permanent deletion UI |

## Agent-raised questions (append below; include your proposed default)
