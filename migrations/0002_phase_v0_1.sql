-- Phase v0.1: groups, learners, schedule, sessions, attendance ----------------------
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
