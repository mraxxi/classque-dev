---
trigger: always_on
---

# 07 — Roadmap

Work proceeds phase by phase. A phase ends only when its definition of done is met **and** the owner approves. Do not start the next phase without the owner's go-ahead (AGENTS.md section 3). Each phase begins with `/start-phase` and ends with `/verify`.

## Phase 0 — Foundations
**Goal:** a running, verified skeleton; nothing user-facing beyond the shell.
- Scaffold: Vite + React + TypeScript SPA, Worker (Hono) with `/api/v1/health`, `wrangler.jsonc`, Tailwind, React Router, TanStack Query, PWA plugin, ESLint/Prettier/Vitest, npm scripts (06-architecture).
- i18n infrastructure with `en.json` / `id.json`, the label layer, `scripts/check-i18n.ts`, language switching.
- Migration `0001`: `accounts`, `users`, `memberships`, `workplaces` (02).
- Identity: `getIdentity`, dev bypass, first-login provisioning, `requireAccess`, `GET/PATCH /me` (IDN).
- App shell: bottom navigation (Today · Week · Groups · Plans · More) with placeholder screens, Settings (SET-001–SET-006).
- Subject Pack schema, registry and the `generic` and `english` packs with tests (03). Packs are only *defined* here.
- Shared utilities with tests: `id.ts`, date helpers, error format.
**Definition of done:** all AGENTS.md section 5 checks pass; app shell installs as a PWA locally; both languages switch live; first-login provisioning creates account, user, membership and default Workplace; tenant isolation test passes; no remote commands were run.

## Phase v0.1 — Plan the week, take attendance
**Modules:** WPL (except WPL-007), GRP, LRN, SCH, TDY, ATT.
Migration `0002`: `terms`, `groups`, `learners`, `group_learners`, `schedule_rules`, `sessions` (without `plan_id`), `attendance`.
**Definition of done:** the first four success criteria in `00-overview.md` are met on a phone-sized viewport; all requirement IDs above are Done with tests where logic exists; top-up idempotency and overlap detection are unit-tested; budgets reviewed (rows read/written logged for Today and Attendance saves).
**Then:** owner deploys manually (README) and gives 2–3 testers access. Collect feedback before v0.2.

## Phase v0.2 — Plans and notes
**Modules:** PLN, NOT. Migration `0003`: create `plans` (first, to satisfy FK target), `notes`, then `ALTER TABLE sessions ADD COLUMN plan_id TEXT REFERENCES plans(id);` and `CREATE INDEX idx_sessions_plan ON sessions(account_id, plan_id);`.
**Definition of done:** a teacher can prepare a Plan for tomorrow's Session from Today in two taps, reuse a previous Plan, and add a learner Note in under 10 seconds; SET-005 toggles hide/show both modules.

## Phase v0.3 — Assessments, scores, progress
**Modules:** ASM, PRG, WPL-007 (grading settings). Migration `0004`: `workplace_grading`, `assessments`, `scores`, `progress_levels`.
**Definition of done:** all grading test vectors in `04-grading.md` pass; score entry for 30 learners works on a phone; display-scale switching never changes stored data; CEFR Progress Level matrix works for the English pack and is absent for the Generic pack.

## Phase v0.4 — Export, hardening, tester round
**Modules:** EXP. Work items: budget audit using logged `rows_read`/`rows_written`; accessibility pass; Indonesian label review with the owner (clear `_todo`); a **fixture pack used only in tests** to prove packs can be added without core changes (PK-007); `/spec-audit` run with all divergences resolved or logged.
**Definition of done:** exports open correctly in a spreadsheet (BOM, delimiter choice, formula-injection protection); `/spec-audit` shows no Missing or Diverges for phases 0–0.4.

## Later (not scheduled; each needs an owner decision and its own spec update)
1. **Reports (v0.5):** `05-modules/reports.md`.
2. **Billing and hours:** `05-modules/billing-hours.md` (design notes only).
3. Plan-format export for school-mandated documents (needs a real sample format).
4. Holiday/closure calendars per Workplace.
5. Letter grades as an input scale (Q-002); CEFR plus levels (Q-001).
6. Additional Subject Packs (science, social/history).
7. Offline sync queue (only if testers report real need).
8. Student / head-teacher access and teacher collaboration (uses the prepared `account_id`, `role`, `visibility`).
