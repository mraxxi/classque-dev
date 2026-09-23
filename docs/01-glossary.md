---
trigger: always_on
---

# 01 — Glossary and translation rules

One concept, one word, everywhere (code, keys, UI). The Indonesian column is a **draft for owner review**.

## Entities
| Identifier | English label | Indonesian (draft) | Definition | Avoid |
|---|---|---|---|---|
| `account` | (never shown) | (never shown) | Tenant that owns all data. One per teacher in the MVP. | workspace, org |
| `workplace` | Workplace | Tempat mengajar | A teaching arrangement: either an *institution* or *independent*. | school, client, company |
| `term` | Term | Periode | A dated period inside an institution Workplace. | semester, quarter |
| `group` | Group (label configurable, see below) | Kelompok / Kelas | A class, or a single private learner. | cohort, course |
| `learner` | Learner | Siswa | A person being taught. | student, pupil, kid |
| `session` | Session | Pertemuan | One scheduled meeting of a Group. | lesson, period, class |
| `schedule_rule` | Schedule | Jadwal | Weekly recurrence that generates Sessions. | timetable, recurrence |
| `plan` | Plan | Rencana | Planned content for a Session. | lesson plan (in UI text) |
| `note` | Note | Catatan | Free-text observation. | comment, memo |
| `attendance` | Attendance | Kehadiran | Presence record per learner per Session. | roll call |
| `assessment` | Assessment | Penilaian | A graded task for a Group. | test, exam, quiz (as generic word) |
| `score` | Score | Nilai | A learner's result for an Assessment. | mark |
| `scale` | Scale | Skala | How scores are read: numeric, CEFR (input); letter (display). | grading system |
| `level` | Level | Level | A proficiency band (e.g. CEFR B1). | grade (reserve "grade" for letters) |
| `progress_level` | Progress Level | Level kemampuan | A dated level judgment per learner per skill. | milestone |
| `skill` | Skill | Keterampilan | Category tag such as Speaking. | competency |
| `subject_pack` | Subject | Mata pelajaran | Configuration bundle for a subject. | template (that means plan template) |
| `template` | Template | Templat | Reusable plan structure defined by a pack. | |
| `rubric` | Rubric | Rubrik | Scoring guide with criteria (reserved, post-MVP). | |
| `conversion_table` | Conversion table | Tabel konversi | Mapping between percent, letter and CEFR. | |
| `module` | Module | Modul | Toggleable feature area. | plugin |
| `report` | Report | Laporan | Printable learner report (post-MVP). | |

## Device tiers and layout
| Identifier | English label | Indonesian (draft) | Definition | Avoid |
|---|---|---|---|---|
| `laptop` | Laptop | Laptop | Primary design target; landscape viewports (≥ 1024 px width) using sidebar or top navigation. | desktop-only |
| `tablet` | Tablet | Tablet | Secondary target tier; portrait/landscape viewports (768–1023 px width). | |
| `phone` | Phone | Ponsel | Secondary target tier; compact viewports (< 768 px width) using bottom navigation. | mobile-first (implies phone is primary) |
| `responsive` | Responsive | Responsif | Layout adapting gracefully across laptop, tablet, and phone without horizontal scroll. | mobile-only |

## Statuses and values
- Session status: `scheduled` Scheduled/Terjadwal, `held` Held/Terlaksana, `cancelled` Cancelled/Dibatalkan, `rescheduled` Rescheduled/Dijadwal ulang.
- Attendance status: `present` Present/Hadir, `absent` Absent/Tidak hadir, `late` Late/Terlambat, `excused` Excused/Izin.
- Group kind: `class` Class/Kelas, `individual` Individual/Individu.
- Workplace kind: `institution` Institution/Institusi, `independent` Independent/Mandiri.

## Screens and actions
Today (Hari ini), Week (Minggu), Groups, Plans, Notes, Settings (Pengaturan), More (on phone navigation tier). Navigation adapts conditionally: sidebar or top navigation on laptop-class viewports; bottom navigation on phone viewports. Verbs: Add (Tambah), Edit (Ubah), Save (Simpan), Cancel (Batal), Delete (Hapus), Archive (Arsipkan), Restore (Pulihkan), Duplicate (Duplikat), Export (Ekspor). Use these verbs consistently; never mix Create/New/Make.

## Label layer (configurable words)
Internally the entity is always `group`. The visible word comes from `useLabel('group')`:
- Default English label: **Group**; the owner may switch a Workplace's display to **Class** (a per-user preference `group_label`: `group` | `class`).
- Default Indonesian label: **Kelas** when `group_label = class`, otherwise **Kelompok**.
- Only `group` uses the label layer in the MVP.

## Translation keys
- Location: `src/shared/i18n/en.json` and `id.json`. Keys: `module.screen.element`, lowercase, dotted (e.g. `attendance.status.present`, `sessions.today.empty`).
- Reserved prefixes: `common.*`, `errors.*`, `nav.*`, `pack.<packId>.*`.
- Sentences use placeholders: `"{count} of {total} present"`. Never concatenate fragments.
- Both files must contain exactly the same keys. Indonesian text may be a copy of English only if marked in a `_todo` list that `check:i18n` reports as warnings.
- Identifiers in code are English `snake_case` (DB) and `camelCase` (TypeScript).
