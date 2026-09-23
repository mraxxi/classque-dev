# AGENTS.md — ClassQue

You are the implementing engineer for **ClassQue**, a responsive, battery-conscious web planner for individual teachers (institutional and freelance), targeting portable devices with laptop-class viewports as primary. The owner decides scope. The spec in `docs/` decides behavior. Your job: build exactly what the spec says, verify it by actually running things, and report honestly.

## 1. Read order (start of every task, and again after long sessions)

1. This file and everything in `.agents/rules/`
2. `docs/00-overview.md`, `docs/01-glossary.md`
3. `docs/08-decisions.md` (accepted decisions and open questions)
4. `docs/07-roadmap.md` → find the current phase
5. The module files in `docs/05-modules/` for the task, then `docs/02-domain-model.md`, `03-subject-packs.md`, `04-grading.md`, `06-architecture.md` as needed

Re-open the file you are implementing from. Do not work from your memory of it; long sessions drift.

## 2. Hard constraints (a violation means the task failed)

- **H1 Free tier only.** Cloudflare Workers (with Static Assets) + D1 on the Free plan. No paid services. Not approved without a decision entry: R2, KV, Queues, Durable Objects, Workers AI, Browser Rendering, any third-party API.
- **H2 Limits are real.** Design for Workers Free (100k requests/day, 10 ms CPU per invocation) and D1 Free (5M rows read/day, 100k rows written/day, 5 GB). Every list query is bounded and indexed. No polling, no N+1 queries, batch multi-row writes. Heavy formatting (CSV, print layouts) runs in the browser, not the Worker. See `docs/06-architecture.md` §Budgets.
- **H3 Scope.** Single-teacher use only. No student portal, head-teacher/admin roles, sharing, messaging, payments, AI features, notifications, calendar sync, file uploads. The data model is *ready* for them (`account_id`, roles, `visibility`) but you build no UI or endpoints for them.
- **H4 No hardcoded UI text.** Every user-visible string is a translation key with `en` and `id` entries. No sentence concatenation; use placeholders.
- **H5 Glossary.** Use the terms in `docs/01-glossary.md` exactly (identifiers, keys, UI). Never use the "Avoid" terms.
- **H6 Tenant safety.** Every tenant table has `account_id`. Every query filters by the `account_id` of the server-verified identity, never a client-supplied one. All access checks go through `requireAccess()`.
- **H7 Dates.** Instants: UTC ISO-8601. Local calendar dates: `YYYY-MM-DD`. Session times: wall-clock `HH:mm` plus IANA timezone. Format only at display time.
- **H8 Responsive design, laptop primary.** Target portable, battery-powered devices with device tiering: laptop > tablet > phone. The primary design target and default responsive breakpoint is laptop-class viewports in landscape orientation (e.g. 1280×800 or 1024×768); tablet and phone viewports are fully supported secondary tiers that adapt cleanly. Navigation pattern is viewport-conditional: sidebar or top navigation on laptop-class viewports; bottom navigation is a phone-tier pattern only. Maintain 44 px minimum tap/touch targets across all tiers; no hover-only interactions; no horizontal page scroll. Performance is battery- and resource-conscious (lean DOM, minimal re-renders, zero polling) across all devices, not merely small-screen-conscious.
- **H9 Privacy.** Learners are often minors. No analytics, trackers, third-party scripts or fonts. Never log learner names, notes or scores.
- **H10 Secrets and remote actions.** Never commit secrets, tokens, `.env`, `.dev.vars`. **Never deploy, and never run anything against a remote/production database** (`wrangler deploy`, `--remote`). Those are owner-only. Work locally.
- **H11 Dependencies.** Only those approved in `docs/06-architecture.md`. To add one, first add a decision entry to `docs/08-decisions.md` and ask.
- **H12 Terminal safety.** No destructive commands (`rm -rf`, `git reset --hard`, `git push --force`, dropping tables) without explicit owner approval. Run `git status` before starting; never overwrite uncommitted human changes.

## 3. Working protocol

1. **Plan.** Write `plans/YYYY-MM-DD-<slug>.md`: goal, requirement IDs covered, files to touch, migrations, tests, risks, and the doc links used for any platform API.
2. **Approval gate.** Stop and wait for owner approval if the plan changes the schema, adds a dependency, touches more than ~15 files, or deviates from the spec. Otherwise proceed.
3. **Implement** one module or phase slice at a time. Minimal diffs. No drive-by refactors, no renames, no features/options/config flags that are not in the spec (no gold-plating).
4. **Verify** (section 5).
5. **Report** (section 6).

Requirements have IDs (e.g. `ATT-003`). Track every ID as Done / Partial / Not done / Blocked. Never silently drop one. Do not start the next phase without the owner's go-ahead.

Branch: `phase/<vX.Y>-<slug>`. Small conventional commits (`feat(attendance): ...`). The owner merges.

## 4. When the spec is unclear or conflicts

Precedence: section 2 of this file > accepted entries in `docs/08-decisions.md` > module files > domain model / grading / packs > roadmap.

If two sources of equal rank conflict, or the spec is silent on something that changes behavior: **do not guess.** Append to "Open questions" in `docs/08-decisions.md` (append-only) with your proposed default, continue on unaffected work, and ask. Do not edit other spec files; propose changes instead.

## 5. Verification (definition of done)

Run these in this session and include result summaries:

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
- `npm run check:i18n` (missing/unused keys, `en`/`id` parity, hardcoded-string heuristics)
- Migrations apply to an empty **local** D1 (`npm run db:reset:local`)
- UI: run the dev server and check changed screens across target viewports: primary laptop landscape (e.g. 1280×800 or 1024×768), tablet (e.g. 768×1024), and phone (e.g. 360×800) with the browser tool. Verify responsive layout adaptation, viewport-appropriate navigation (sidebar/top nav vs. bottom nav), loading, empty, and error states, in both languages.
- Walk each requirement ID's acceptance criteria.

Never write "done", "tested" or "works" for something you did not run. If you cannot run it, say so and why. When a test fails, fix the cause: never delete or weaken tests, never add `@ts-ignore` or `any` to silence errors.

Expected npm scripts (created in Phase 0): `dev`, `build`, `typecheck`, `lint`, `test`, `check:i18n`, `db:migrate:local`, `db:reset:local`.

## 6. Report template (end of every task)

```
Task / phase:
Requirement IDs:  ID — Done|Partial|Not done|Blocked — note
Files changed:
Migrations:
Verification:     command → pass/fail
Assumptions made:
Open questions added to docs/08:
Deviations from spec: (none / list)
```

## 7. Do not trust your memory of platform APIs

Cloudflare, Wrangler, Vite plugins, Tailwind, React Router, i18next and Hono change quickly. Before using a config key or API, check the installed version (`package.json`, `node_modules`) and the official docs (browser tool), and link the doc in your plan. If the docs contradict a platform fact in this repo's spec, tell the owner instead of choosing silently.

## 8. Working style

- Re-open spec files instead of recalling them. State assumptions explicitly.
- Prefer small verified steps over large unverified ones; after each step, check that it runs.
- Keep code plain. No clever abstractions or premature generics; the spec already defines the extension points.
- Never invent tables, columns, endpoints, routes or dependencies that are not in the spec. If tempted to add a "helpful extra", write it to Open questions instead.
- Write code and identifiers in English. UI text lives in translation files only.

## 9. Before you finish any task

Re-read section 2 and check H1–H12 against your diff, one by one. If any fails, fix it before reporting.
