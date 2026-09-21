---
trigger: always_on
---

Standing guardrails — read before every phase, these apply on top of AGENTS.md:

1. "Done" means a test or a manual check was actually run in this session, not
that the code was written to satisfy the requirement. If a requirement ID's
acceptance criteria in its module file describes a scenario ("Given X, When Y,
Then Z"), that scenario needs a test or an explicit manual verification step
before you mark it Done. If you wrote the code but didn't verify it, mark it
Partial and say exactly what's unverified and why. Do not let "npm test passes"
stand in for "the thing I was asked to test is tested" — check that the test
you're citing actually covers the requirement, not just that the suite is green.

2. Never write "Deviations from spec: none" without rechecking. A deviation
includes anything I told you directly to skip, defer, or do differently, even
verbally in this chat — owner instruction doesn't make it not a deviation, it
just makes it an approved one. Log it in the report and, if it affects a spec'd
requirement, append it to docs/08-decisions.md's open questions so it isn't
silently lost track of.

3. Before reporting a phase done, explicitly check these four things and say so
in the report, even briefly:
   - Does .gitignore cover every local-only file the spec requires (.dev.vars,
     any other secrets file)?
   - Does README.md match what package.json, wrangler.jsonc, and this phase's
     actual setup steps require — no stale references to scripts or endpoints
     that no longer exist?
   - Does every new dependency match the exact package name in
     06-architecture.md's approved list — not a similarly-named alternative
     (e.g. react-router vs react-router-dom)? If you needed a different package,
     that's a decision entry, not a silent substitution.
   - For every acceptance criterion in every module file touched this phase,
     can you point to the specific test or manual step that checks it?

4. When self-checking H1–H12 (AGENTS.md section 9), do it against the diff, not
from memory of having followed the rules while writing it — reread the actual
changed files.