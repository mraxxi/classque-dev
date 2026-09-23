-- Phase v0.2: plans and notes ------------------------------------------------------
-- Exact 4-step circular reference resolution sequence per 02-domain-model.md & ddl_ref.md

-- Step 1: CREATE TABLE plans first so it exists as an FK target
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

-- Step 2: CREATE TABLE notes
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

-- Step 3: ALTER TABLE sessions to add plan_id FK reference
ALTER TABLE sessions ADD COLUMN plan_id TEXT REFERENCES plans(id);

-- Step 4: CREATE INDEX on sessions(account_id, plan_id)
CREATE INDEX idx_sessions_plan ON sessions(account_id, plan_id);

-- Step 5: Enable plans and notes modules by default for existing accounts
UPDATE accounts SET enabled_modules = '["plans","notes"]' WHERE enabled_modules = '[]' OR enabled_modules IS NULL;
