-- Adds users.password_changed_at.
-- requireAuth rejects any JWT issued before this timestamp, so a password
-- change/reset logs out all older sessions. NULL = password never changed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;