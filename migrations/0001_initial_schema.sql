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
