---
trigger: always_on
---

# 04 — Grading: scores, scales, conversions, aggregation

Testers use CEFR frequently, 0–100 numbers for many purposes, and some parents expect letter grades. These are different kinds of things and are kept separate.

## Concepts
| Concept | Meaning | Stored where |
|---|---|---|
| **Score** | What the teacher entered, in the Assessment's input scale | `scores.value_num` or `scores.value_level` |
| **Input scale** | `numeric` (0 to `max_score`) or `cefr` (A1–C2) | `assessments.scale_key` |
| **Display scale** | How a value is shown: `numeric` (percent), `letter`, or `cefr` | UI/report choice, never stored on scores |
| **Conversion table** | Letter bands, CEFR bands, pass mark for a Workplace | `workplace_grading` |
| **Progress Level** | A dated CEFR judgment per learner per skill (not a test result) | `progress_levels` |

## Principles
- **GR-001** The entered value is the source of truth. Conversions are derived views and never overwrite it.
- **GR-002** Letter grades are **display-only** in the MVP (no letter input scale). See Open question Q-002.
- **GR-003** CEFR is a progress judgment first. Assessments *may* use the `cefr` input scale, but the Progress Level record is the long-term history of a learner's level.
- **GR-004** CEFR ↔ percent conversion is approximate and teacher-configurable. The UI marks any converted value with "≈" and a hint (`grading.converted_hint`).
- **GR-005** Never average across scales silently. Averages are computed over numeric percentages; CEFR Assessments are included only when the Workplace setting `include_cefr_in_average` is on (using band midpoints).
- **GR-006** A missing Score (both value columns `NULL`) is "not entered" and is excluded from every calculation. A `0` is a real score and is included.

## Defaults (placeholders, editable per Workplace; created with the Workplace's grading settings)
Pass mark: `70`.

Letter bands (descending, `min` inclusive percent):
`A ≥ 85`, `B ≥ 70`, `C ≥ 55`, `D ≥ 40`, `E ≥ 0`.

CEFR bands (ascending by `min` percent): `A1 0`, `A2 30`, `B1 45`, `B2 60`, `C1 75`, `C2 90`.
Band midpoint = `(min + nextMin) / 2`, and for the top band `(min + 100) / 2`. Defaults: A1 15, A2 37.5, B1 52.5, B2 67.5, C1 82.5, C2 95.

These defaults are placeholders pending real report sheets from testers (see Q-003). Do not present them as authoritative.

## Pure functions (in `src/shared/grading/`, no I/O, fully unit-tested)
```ts
roundPercent(p: number): number                                   // 1 decimal, half up
percentFromNumeric(value: number, max: number): number            // value / max * 100
percentFromCefr(level: CefrLevel, bands: CefrBand[]): number      // band midpoint
letterFromPercent(percent: number, bands: LetterBand[]): string   // uses roundPercent first
cefrFromPercent(percent: number, bands: CefrBand[]): CefrLevel    // uses roundPercent first
isPass(percent: number, passMark: number): boolean                // roundPercent(p) >= passMark
weightedAverage(items: { percent: number; weight: number }[]): number | null
toDisplay(score, assessment, target: 'numeric'|'letter'|'cefr', settings): { text: string; converted: boolean }
latestProgress(records: ProgressLevel[]): Map<skillKey, { level; previous?; trend: 'up'|'same'|'down' }>
```
- **GR-010** Round percent to one decimal (half up) **before** applying bands, so the displayed number and the letter always agree.
- **GR-011** `weightedAverage` = Σ(percent × weight) / Σ(weight) over included items; returns `null` when there are none.
- **GR-012** Percent values are clamped to 0–100 for band lookup only; entered values are validated against `max_score` on write.
- **GR-013** Displayed numbers show at most one decimal and no trailing `.0`.
- **GR-014** `latestProgress` picks, per skill, the record with the greatest `assessed_on` (ties: latest `created_at`); `trend` compares with the previous record (CEFR order A1 < A2 < B1 < B2 < C1 < C2).

## Statistics per Assessment (numeric input scale only)
Entered count, average percent, minimum, maximum, pass count and pass rate. For `cefr` Assessments show a distribution (count per level) instead.

## Required test vectors
Floating-point warning: implement rounding so these vectors pass (for example `Math.round((p + Number.EPSILON) * 10) / 10`, then verify). If a vector fails, fix the implementation, never the vector.

| Case | Expected |
|---|---|
| `percentFromNumeric(15, 20)` | `75` |
| `roundPercent(84.95)` | `85` (half up) |
| `letterFromPercent(84.95, defaultLetterBands)` | `A` (rounds to 85 first) |
| `letterFromPercent(84.94, defaultLetterBands)` | `B` |
| `letterFromPercent(0, defaultLetterBands)` | `E` |
| `percentFromCefr('B1', defaultCefrBands)` | `52.5` |
| `cefrFromPercent(44.9, defaultCefrBands)` | `A2` (rounds to 44.9, below 45) |
| `cefrFromPercent(45, defaultCefrBands)` | `B1` |
| `isPass(69.95, 70)` | `true` (rounds to 70) |
| `weightedAverage([{80,1},{60,3}])` | `65` |
| `weightedAverage([])` | `null` |
| Score `0` on a numeric Assessment | included in average; not treated as "not entered" |
| CEFR Assessment with `include_cefr_in_average = false` | excluded from the average |
| `toDisplay(15, numericOutOf20, 'numeric', settings)` | `{ text: '75%', converted: false }` |
| `toDisplay(15, numericOutOf20, 'letter', settings)` | `{ text: 'B', converted: true }` |

## Aggregation scopes (used by summaries, exports and reports)
A learner's **summary for a Group** over a period (Term dates or a custom date range) is: weighted average of their entered numeric Scores (plus CEFR if enabled), the pass/fail against the Workplace pass mark, the letter for the display scale, and the latest Progress Level per skill. Periods filter Assessments by `held_on`.