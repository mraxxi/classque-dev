---
trigger: always_on
description: Cloudflare Workers, D1, migrations and API conventions for ClassQue
---

# Rule: Cloudflare, D1 and API conventions

Applies to everything under `src/worker/`, `migrations/` and `wrangler.jsonc`. Platform facts here were checked against Cloudflare docs in Sept 2026; re-verify before relying on them (AGENTS.md section 7).

## Platform facts (Free plan)
- Workers Free: 100,000 requests/day, 10 ms CPU per invocation, 50 subrequests, Worker bundle 3 MB.
- D1 Free: 5M rows read/day, 100k rows written/day, 5 GB total. Limits reset 00:00 UTC. Above the limit, queries fail.
- Indexes add rows written on every write to indexed columns. Add an index only when a documented query needs it.
- D1 enforces foreign keys. Write migrations and seed order accordingly.
- Hosting: **Workers with Static Assets** (single project, `wrangler.jsonc`), not Pages Functions. SPA fallback via the assets `not_found_handling: "single-page-application"` setting.
- Use `run_worker_first` only for `/api/*`. Requests that invoke the Worker count toward the daily limit; static files must be served without invoking it.

## Query rules
- Bind parameters only. Never build SQL by string interpolation.
- Every list endpoint takes `limit` (default 50, max 200) and a date range or cursor. No unbounded `SELECT`.
- No queries inside loops. Use joins, `IN (...)` (max 100 bound params per query), or `db.batch([...])`.
- Multi-row writes (attendance, scores, generated sessions) go through one `db.batch`.
- Every new query gets a comment naming the index it relies on. In dev, log `rows_read` / `rows_written` from result meta and investigate anything that scans a whole table.

## Migrations
- Files in `migrations/` named `NNNN_short_description.sql`, forward-only. **Never edit a migration that has been applied or committed**; add a new one.
- No destructive change (drop/rename column or table) without a decision entry approved by the owner.
- Enumerations use `CHECK (col IN (...))`. IDs are `TEXT` ULIDs generated in the Worker (`shared/id.ts`), never by the client.
- JSON columns are `TEXT` with a Zod schema in `src/shared/schemas/`; validate on write and on read.
- Timestamps: `created_at`, `updated_at` as UTC ISO-8601 `TEXT`. Soft-archive with `archived_at`.
- Foreign keys & `ALTER TABLE`: Adding a column with a foreign key (`ALTER TABLE ... ADD COLUMN ... REFERENCES ...`) in SQLite requires the referenced table to exist prior to the statement and the column must be nullable.
- After adding a migration: run `npm run db:reset:local` and confirm it applies to an empty database.

## API conventions
- Base path `/api/v1`. JSON only. Validate every request body, query and path param with Zod at the boundary.
- Identity comes from `getIdentity(request)` only (see `docs/05-modules/identity.md`). Never read user or account IDs from the request body.
- Mutating requests must send `Content-Type: application/json` and pass an `Origin` check (same origin only).
- Errors: `{ "error": { "code": "validation_failed", "messageKey": "errors.validation_failed", "details": {...} } }`. `messageKey` is a translation key; never return English sentences to display.
- Status codes: 200/201 success, 400 validation, 401 no identity, 403 no access, 404 not found (also for other accounts' resources), 409 conflict, 429 reserved, 500 unexpected (log without personal data).
- Bulk writes (`PUT /api/v1/sessions/:id/attendance`, scores) are idempotent replace/upsert operations so a retry after a dropped connection is safe.
- Keep the Worker thin: routes → services → repositories. Business rules (grading, recurrence) are pure functions in `src/shared/` with unit tests.
