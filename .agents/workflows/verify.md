---
description: Run the full verification protocol for the current work and produce the AGENTS.md report.
---

1. Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run check:i18n`. Record pass/fail for each. Fix causes of failures; never weaken tests or silence errors.
2. Run `npm run db:reset:local` and confirm all migrations apply to an empty local database.
3. Start the dev server. With the browser tool, open each screen changed in this task at 360×800 and 768×1024. Check loading, empty and error states, in English and Indonesian. Report anything you could not check.
4. For each requirement ID in the current plan, walk its acceptance criteria and mark Done / Partial / Not done / Blocked with evidence.
5. Check H1–H12 from `AGENTS.md` section 2 against the diff (`git diff --stat`, then inspect). Explicitly confirm: no hardcoded strings, no unbounded queries, no new dependency without a decision entry, no remote commands run.
6. Produce the report using the template in `AGENTS.md` section 6. Do not claim anything you did not run in this session.
