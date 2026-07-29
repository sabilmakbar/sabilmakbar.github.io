-- QA log for the profile chatbot. No IPs or visitor identifiers are stored.
-- Apply to remote D1:
--   npx wrangler d1 execute profile-qa-logs --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS qa_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         TEXT    NOT NULL,   -- ISO timestamp
  question   TEXT    NOT NULL,
  answer     TEXT,
  sources    TEXT,               -- JSON array of chunk source ids
  latency_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_qa_log_ts ON qa_log (ts);
