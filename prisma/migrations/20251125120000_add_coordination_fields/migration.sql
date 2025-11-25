-- Add coordination fields for multi-device task completion

-- Add version column to tasks for optimistic locking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0 NOT NULL;

-- Create index for optimistic locking queries
CREATE INDEX IF NOT EXISTS "tasks_id_version_idx" ON tasks(id, version);

-- Add coordination columns to task_completions
ALTER TABLE task_completions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Create unique constraint for idempotency keys
CREATE UNIQUE INDEX IF NOT EXISTS "task_completions_idempotency_key_key"
  ON task_completions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Create indexes for coordination queries
CREATE INDEX IF NOT EXISTS "task_completions_idempotency_key_idx"
  ON task_completions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS "task_completions_session_id_idx"
  ON task_completions(session_id)
  WHERE session_id IS NOT NULL;

-- Add foreign key for session_id (if kiosk_sessions table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kiosk_sessions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'task_completions_session_id_fkey'
    ) THEN
      ALTER TABLE task_completions
        ADD CONSTRAINT task_completions_session_id_fkey
        FOREIGN KEY (session_id)
        REFERENCES kiosk_sessions(id)
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;
