---
trigger: always_on
---

# Billing and hours (BIL) — design notes only. Do NOT build.

Purpose of this file: make sure nothing built now blocks a later module for freelance billing and for hour summaries.

## Hooks that already exist
- `groups.kind` (`class` | `individual`) distinguishes group classes from private students.
- `sessions.status` (`held`, `cancelled`, `rescheduled`) and `sessions.duration_min` give billable/teachable hours.
- `workplaces.kind` (`independent` | `institution`) distinguishes billing contexts.

## Likely future scope (unspecified, needs an owner decision first)
- Held-hours summary per Workplace and period (useful for freelance invoicing and possibly institutional hour claims; see Open question Q-004).
- Session packages (a bundle of prepaid sessions per learner) and per-Session rates.
- Payment status tracking without payment processing.

## Rules for now
- Do not add price, rate, currency, package or payment columns or UI.
- Do not compute hours anywhere except where a module file asks.
