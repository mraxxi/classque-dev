---
trigger: always_on
---

# 03 — Subject Packs

A **Subject Pack** is data that configures the subject-specific parts of the app for a Group. The core (Groups, Learners, Sessions, Attendance, Notes, Assessments) is identical for every subject; a pack changes plan templates, assessment types, skills and the progress scale. Teachers who teach several subjects use a different pack per Group, so subjects never mix.

## Rules
- **PK-001** Packs are typed TypeScript objects in `src/shared/packs/<id>.ts`, registered in `src/shared/packs/registry.ts`. They contain **data only**: no functions, no JSX, no logic.
- **PK-002** Every label is a translation key under `pack.<packId>.*`, present in `en.json` and `id.json`.
- **PK-003** Each pack has an integer `version`. Removing or renaming a key requires a version bump. Groups, Plans store `pack_id` and `pack_version`. Plan content keys unknown to the current pack are kept and shown read-only under an "Other" heading; nothing is deleted silently.
- **PK-004** New Groups default to the `generic` pack. The teacher may pick another pack on creation.
- **PK-005** A Group's pack can be changed only while the Group has no Assessments. Existing Plans keep the pack they were written with.
- **PK-006** If a pack has `progressScale: null`, Progress Level UI is hidden for its Groups.
- **PK-007** Adding a pack means adding one file, one registry line and translation keys. No core code changes. A unit test validates every registered pack against the Zod schema, checks keys exist in both languages, and checks uniqueness of keys within the pack.

## Schema

```ts
export type PlanSectionKind = 'text' | 'list' | 'pairs'; // pairs = term/definition rows

export interface PlanSection {
  key: string;            // stable, snake_case
  labelKey: string;       // pack.<id>.plan.<key>
  kind: PlanSectionKind;
  required?: boolean;     // default false
}

export interface AssessmentType {
  key: string;
  labelKey: string;       // pack.<id>.assessment.<key>
  defaultScale: 'numeric' | 'cefr';
  defaultMax?: number;    // numeric only, default 100
  skillKey?: string;      // optional suggested skill
}

export interface Skill { key: string; labelKey: string } // pack.<id>.skill.<key>

export interface SubjectPack {
  id: string;
  version: number;
  labelKey: string;       // pack.<id>.name
  planTemplate: PlanSection[];
  assessmentTypes: AssessmentType[];
  skills: Skill[];
  progressScale: 'cefr' | null;
}
```

## Generic pack (`generic`, version 1)
| Kind | Keys |
|---|---|
| Plan sections | `objectives` (list, required), `activities` (text), `materials` (list), `notes` (text) |
| Assessment types | `quiz`, `test`, `assignment`, `project` (all `numeric`, max 100) |
| Skills | none |
| Progress scale | `null` |

## English pack (`english`, version 1)
| Kind | Keys |
|---|---|
| Plan sections | `objectives` (list, required), `warm_up` (text), `presentation` (text), `practice` (text), `production` (text), `wrap_up` (text), `vocabulary` (pairs), `grammar_focus` (text), `materials` (list), `homework` (text) |
| Assessment types | `quiz`, `test`, `homework` (numeric, max 100); `speaking`, `writing` (numeric, max 100, but `cefr` may be chosen per Assessment); `listening`, `reading` (numeric, max 100) |
| Skills | `reading`, `writing`, `listening`, `speaking`, `vocabulary`, `grammar` |
| Progress scale | `cefr` (levels A1, A2, B1, B2, C1, C2) |

Any Assessment in any pack may use either the `numeric` or `cefr` input scale; `defaultScale` only sets the initial choice.

## Labels (English source of truth, Indonesian draft for owner review)
Create these keys in both translation files. Indonesian entries are drafts and should be listed under `_todo` until the owner confirms.

| Key suffix | English | Indonesian (draft) |
|---|---|---|
| `name` (generic) | General | Umum |
| `name` (english) | English | Bahasa Inggris |
| `plan.objectives` | Objectives | Tujuan |
| `plan.activities` | Activities | Kegiatan |
| `plan.materials` | Materials | Bahan |
| `plan.notes` | Notes | Catatan |
| `plan.warm_up` | Warm-up | Pemanasan |
| `plan.presentation` | Presentation | Penyajian |
| `plan.practice` | Practice | Latihan |
| `plan.production` | Production | Produksi |
| `plan.wrap_up` | Wrap-up | Penutup |
| `plan.vocabulary` | Vocabulary | Kosakata |
| `plan.grammar_focus` | Grammar focus | Fokus tata bahasa |
| `plan.homework` | Homework | Pekerjaan rumah |
| `assessment.quiz` | Quiz | Kuis |
| `assessment.test` | Test | Tes |
| `assessment.assignment` | Assignment | Tugas |
| `assessment.project` | Project | Proyek |
| `assessment.homework` | Homework | Pekerjaan rumah |
| `assessment.speaking` | Speaking task | Tugas berbicara |
| `assessment.writing` | Writing task | Tugas menulis |
| `assessment.listening` | Listening task | Tugas menyimak |
| `assessment.reading` | Reading task | Tugas membaca |
| `skill.reading` | Reading | Membaca |
| `skill.writing` | Writing | Menulis |
| `skill.listening` | Listening | Menyimak |
| `skill.speaking` | Speaking | Berbicara |
| `skill.vocabulary` | Vocabulary | Kosakata |
| `skill.grammar` | Grammar | Tata bahasa |

## Adding a pack later (for future reference)
Science and Social/History packs follow the same shape (for example lab/practical assessment types, source-analysis plan sections, rubric-based scales). They are **not** part of the MVP. Do not create them.

