---
trigger: always_on
description: Implementation protocol, planning rules and hard constraints
---

# Rule: Spec-driven implementation protocol

Applies to all code and configuration changes.

## 1. Context Loading Order
Before starting any phase or module:
1. Re-read `AGENTS.md` and all `.agents/rules/`.
2. Review `docs/00-overview.md` and `docs/01-glossary.md`.
3. Check `docs/08-decisions.md` (accepted decisions and open questions).
4. Locate the active phase in `docs/07-roadmap.md`.
5. Re-open the specific module files in `docs/05-modules/` for the task (along with `docs/02-domain-model.md`, `docs/03-subject-packs.md`, `docs/04-grading.md`, `docs/06-architecture.md` as referenced).
Do not implement from memory; always re-open spec files.

## 2. Hard Constraints (H1–H12)
- **H1 Free tier only:** Cloudflare Workers (with Static Assets) + D1 on Free plan only. No unapproved services (R2, KV, Queues, Durable Objects, Workers AI).
- **H2 Limits are real:** Bound and index every list query. No polling, no N+1 queries, batch multi-row writes. Heavy formatting (CSV/print) runs in the browser.
- **H3 Scope:** Single-teacher use only. No student portals, admin roles, messaging, payments, or file uploads.
- **H4 No hardcoded UI text:** All user-visible strings must be translation keys in `en.json` and `id.json`.
- **H5 Glossary:** Use terms in `docs/01-glossary.md` strictly. Avoid banned terms.
- **H6 Tenant safety:** Every tenant table has `account_id`. Filter queries by server-verified identity via `requireAccess()`.
- **H7 Dates:** Instants = UTC ISO-8601; Dates = `YYYY-MM-DD`; Session times = wall-clock `HH:mm` + IANA timezone.
- **H8 Responsive design, laptop primary:** Primary target is laptop landscape viewports; secondary support for tablets and phones; viewport-conditional navigation (sidebar/top nav on laptop, bottom nav on phone); 44 px min touch targets; battery- and resource-conscious execution.
- **H9 Privacy:** Learner data is personal data of minors. No analytics, tracking, or external fonts. Never log learner names or scores.
- **H10 Local only:** Never commit secrets. Never deploy (`wrangler deploy`) or touch remote databases (`--remote`).
- **H11 Approved dependencies:** Only those listed in `docs/06-architecture.md`.
- **H12 Terminal safety:** No destructive commands (`rm -rf`, `git reset --hard`, `git push --force`) without owner approval.

## 3. Workflow Protocol
- Write plans in `plans/YYYY-MM-DD-<slug>.md`.
- Obtain approval before modifying schemas or touching >15 files.
- Verify per `AGENTS.md` section 5 before reporting.
