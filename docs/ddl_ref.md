-- Phase 0: identity and workplaces ------------------------------------------
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled_modules TEXT NOT NULL DEFAULT '[]',   -- JSON array of module keys
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en','id')),
  timezone TEXT NOT NULL DEFAULT 'UTC',          -- IANA, set from browser at first login
  week_start INTEGER NOT NULL DEFAULT 1 CHECK (week_start IN (0,1,6)), -- 1=Mon, 0=Sun, 6=Sat
  group_label TEXT NOT NULL DEFAULT 'group' CHECK (group_label IN ('group','class')),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE memberships (
  account_id TEXT NOT NULL REFERENCES accounts(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (account_id, user_id)
);

CREATE TABLE workplaces (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  kind TEXT NOT NULL CHECK (kind IN ('institution','independent')),
  name TEXT NOT NULL,
  archived_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_workplaces_account ON workplaces(account_id, archived_at);

-- v0.1: groups, learners, schedule, sessions, attendance ----------------------
CREATE TABLE terms (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  workplace_id TEXT NOT NULL REFERENCES workplaces(id),
  name TEXT NOT NULL,
  starts_on TEXT NOT NULL,   -- YYYY-MM-DD
  ends_on TEXT NOT NULL,
  archived_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  CHECK (starts_on <= ends_on)
);
CREATE INDEX idx_terms_workplace ON terms(workplace_id);

CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  workplace_id TEXT NOT NULL REFERENCES workplaces(id),
  term_id TEXT REFERENCES terms(id),
  kind TEXT NOT NULL CHECK (kind IN ('class','individual')),
  name TEXT NOT NULL,
  pack_id TEXT NOT NULL DEFAULT 'generic',
  pack_version INTEGER NOT NULL DEFAULT 1,
  room TEXT,
  color TEXT NOT NULL,       -- key from the fixed 8-color palette
  archived_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_groups_workplace ON groups(account_id, workplace_id, archived_at);

CREATE TABLE learners (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  workplace_id TEXT NOT NULL REFERENCES workplaces(id),
  display_name TEXT NOT NULL,
  archived_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_learners_workplace ON learners(account_id, workplace_id, archived_at);

CREATE TABLE group_learners (
  group_id TEXT NOT NULL REFERENCES groups(id),
  learner_id TEXT NOT NULL REFERENCES learners(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  joined_on TEXT NOT NULL,   -- YYYY-MM-DD
  left_on TEXT,              -- NULL while active
  PRIMARY KEY (group_id, learner_id)
);
CREATE INDEX idx_group_learners_learner ON group_learners(learner_id);

CREATE TABLE schedule_rules (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  group_id TEXT NOT NULL REFERENCES groups(id),
  weekdays TEXT NOT NULL,    -- JSON array of ISO weekdays 1=Mon..7=Sun, e.g. [2,4]
  start_time TEXT NOT NULL,  -- HH:mm
  duration_min INTEGER NOT NULL CHECK (duration_min BETWEEN 5 AND 600),
  room TEXT,
  tz TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_rules_group ON schedule_rules(group_id);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  group_id TEXT NOT NULL REFERENCES groups(id),
  rule_id TEXT REFERENCES schedule_rules(id),
  session_date TEXT NOT NULL,   -- YYYY-MM-DD (local)
  start_time TEXT NOT NULL,     -- HH:mm (local)
  duration_min INTEGER NOT NULL CHECK (duration_min BETWEEN 5 AND 600),
  tz TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','held','cancelled','rescheduled')),
  room TEXT,
  plan_id TEXT REFERENCES plans(id),           -- added in v0.2 (see note below)
  rescheduled_from_id TEXT REFERENCES sessions(id),
  is_exception INTEGER NOT NULL DEFAULT 0,     -- 1 = manually touched; never regenerated
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_sessions_account_date ON sessions(account_id, session_date);   -- Today/Week
CREATE INDEX idx_sessions_group_date ON sessions(group_id, session_date);       -- group history
CREATE UNIQUE INDEX uq_sessions_rule_slot ON sessions(rule_id, session_date, start_time); -- idempotent generation

CREATE TABLE attendance (
  session_id TEXT NOT NULL REFERENCES sessions(id),
  learner_id TEXT NOT NULL REFERENCES learners(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  status TEXT NOT NULL CHECK (status IN ('present','absent','late','excused')),
  note TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (session_id, learner_id)
);
CREATE INDEX idx_attendance_learner ON attendance(learner_id);

-- v0.2: plans and notes ------------------------------------------------------
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  pack_id TEXT NOT NULL,
  pack_version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '{}',   -- JSON: { [sectionKey]: value }, validated per pack
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private')),
  source_plan_id TEXT REFERENCES plans(id),
  archived_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_plans_account ON plans(account_id, archived_at, updated_at);

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  session_id TEXT REFERENCES sessions(id),
  group_id TEXT REFERENCES groups(id),
  learner_id TEXT REFERENCES learners(id),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private')),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  CHECK (session_id IS NOT NULL OR group_id IS NOT NULL OR learner_id IS NOT NULL)
);
CREATE INDEX idx_notes_learner ON notes(account_id, learner_id);
CREATE INDEX idx_notes_group ON notes(account_id, group_id);
CREATE INDEX idx_notes_session ON notes(account_id, session_id);

-- v0.3: assessments, scores, grading, progress ------------------------------
CREATE TABLE workplace_grading (
  workplace_id TEXT PRIMARY KEY REFERENCES workplaces(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  pass_mark REAL NOT NULL DEFAULT 70 CHECK (pass_mark BETWEEN 0 AND 100),
  letter_bands TEXT NOT NULL,        -- JSON [{ "letter": "A", "min": 85 }, ...] descending
  cefr_bands TEXT NOT NULL,          -- JSON [{ "level": "A1", "min": 0 }, ...] ascending by min
  include_cefr_in_average INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE assessments (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  group_id TEXT NOT NULL REFERENCES groups(id),
  title TEXT NOT NULL,
  type_key TEXT NOT NULL,            -- from the Group's Subject Pack
  scale_key TEXT NOT NULL CHECK (scale_key IN ('numeric','cefr')),
  max_score REAL CHECK (max_score > 0),   -- required when scale_key = 'numeric'
  weight REAL NOT NULL DEFAULT 1 CHECK (weight > 0),
  held_on TEXT NOT NULL,             -- YYYY-MM-DD
  skill_key TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_assessments_group ON assessments(group_id, held_on);

CREATE TABLE scores (
  assessment_id TEXT NOT NULL REFERENCES assessments(id),
  learner_id TEXT NOT NULL REFERENCES learners(id),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  value_num REAL,                    -- numeric scale
  value_level TEXT,                  -- cefr scale, e.g. 'B1'
  comment TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (assessment_id, learner_id),
  CHECK (value_num IS NULL OR value_level IS NULL)   -- both NULL = not entered
);
CREATE INDEX idx_scores_learner ON scores(learner_id);

CREATE TABLE progress_levels (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  learner_id TEXT NOT NULL REFERENCES learners(id),
  group_id TEXT NOT NULL REFERENCES groups(id),   -- always recorded in a Group context
  skill_key TEXT NOT NULL,
  scale_key TEXT NOT NULL CHECK (scale_key IN ('cefr')),
  level_key TEXT NOT NULL,
  assessed_on TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_progress_learner ON progress_levels(learner_id, skill_key, assessed_on);