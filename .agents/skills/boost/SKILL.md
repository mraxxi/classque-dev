---
name: boost
description: >-
  High-rigor workflow for complex coding, architectural refactors, and deep debugging.
  Use when tackling multi-file features or high-stakes changes requiring deep planning,
  focused investigation, and rigorous verification.
---

# Boost Mode: High-Rigor Engineering Workflow

When this skill is activated, follow a disciplined, multi-phase execution process. Do not rush into code modifications.

## Phase 1: Investigation & Research
1. Read relevant documentation, specs, and existing code before touching any files.
2. For bug investigations, identify the root cause and inspect call paths—do not apply superficial patches.
3. For new features, map out all affected components, interfaces, and dependencies.

## Phase 2: Implementation Plan
1. Detail the exact files to create, modify, or remove.
2. List the explicit requirements and acceptance criteria.
3. Outline the testing strategy (unit tests, integration tests, manual checks).

## Phase 3: Focused Implementation
1. Keep diffs minimal and adhere strictly to project conventions and coding standards.
2. Make one logical change at a time; verify after each step.
3. Avoid drive-by refactors, unnecessary abstractions, or unapproved dependencies.

## Phase 4: Rigorous Verification
1. Run static checks: typecheck, lint, and formatting.
2. Run automated test suites relevant to the changed modules.
3. Inspect the diff against all acceptance criteria to confirm no requirements were missed.
4. If tests fail or edge cases are discovered, diagnose and resolve them before concluding.