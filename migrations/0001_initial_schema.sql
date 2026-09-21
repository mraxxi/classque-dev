-- Initial D1 database schema migration
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for testing
INSERT OR IGNORE INTO users (id, name, email) VALUES
    ('usr_1', 'Antigravity Developer', 'dev@example.com'),
    ('usr_2', 'Cloudflare D1 Explorer', 'explorer@example.com');
