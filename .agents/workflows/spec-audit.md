---
description: Read-only audit of the codebase against the spec. Produces a coverage table and makes no code changes.
---


1. Read `docs/07-roadmap.md` and identify all phases marked done or in progress.
2. For each requirement ID in those phases' module files, search the code and tests for the implementation. Classify: Done (implemented and tested), Partial, Missing, or Diverges (behavior differs from the spec).
3. Check cross-cutting rules: every tenant table has `account_id`; every list endpoint is bounded; no hardcoded UI strings; `en`/`id` key parity; terminology matches `docs/01-glossary.md`; only approved dependencies in `package.json`.
4. Output a table: `ID | Status | Evidence (file:line) | Notes`, then a short list of divergences and risks.
5. Do **not** modify any file. Propose fixes as a list the owner can approve.
