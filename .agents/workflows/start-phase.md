---
description: Begin a roadmap phase or module. Reads the spec, produces a plan, and waits for approval before any code.
---


1. Run `git status` and `git branch --show-current`. Report uncommitted changes and do not overwrite them.
2. Read, in order: `AGENTS.md`, `.agents/rules/*`, `docs/00-overview.md`, `docs/01-glossary.md`, `docs/08-decisions.md`, `docs/07-roadmap.md`. Identify the current phase from the roadmap and the owner's request.
3. Read every module file listed for that phase in `docs/05-modules/`, then only the parts of `docs/02`, `03`, `04`, `06` those modules reference.
4. List every requirement ID in scope with a one-line restatement in your own words. Flag any requirement you find ambiguous or in conflict with another document.
5. For any Cloudflare, Wrangler, Vite, Tailwind, Router, i18next or Hono API you will use, open the official docs, note the URL and the installed version.
6. Write `plans/YYYY-MM-DD-<slug>.md` with: goal, requirement IDs, files to create or change, migrations, tests, risks, assumptions, open questions.
7. Append unresolved questions to "Open questions" in `docs/08-decisions.md` with a proposed default.
8. **STOP.** Present the plan summary and wait for owner approval. Write no application code in this workflow.
