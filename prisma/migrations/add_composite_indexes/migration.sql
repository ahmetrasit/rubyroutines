-- Add composite indexes for improved query performance

-- Task completions: person_id + completed_at (for analytics)
CREATE INDEX IF NOT EXISTS idx_task_completions_person_date
  ON task_completions(person_id, completed_at DESC);

-- Task completions: task_id + completed_at (for task history)
CREATE INDEX IF NOT EXISTS idx_task_completions_task_date
  ON task_completions(task_id, completed_at DESC);

-- Routines: role_id + status (for listing active routines)
CREATE INDEX IF NOT EXISTS idx_routines_role_status
  ON routines(role_id, status);

-- Tasks: routine_id + status (for listing active tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_routine_status
  ON tasks(routine_id, status);

-- Tasks: routine_id + sort_order (for ordered task lists)
CREATE INDEX IF NOT EXISTS idx_tasks_routine_order
  ON tasks(routine_id, sort_order);

-- Persons: role_id + status (for listing active persons)
CREATE INDEX IF NOT EXISTS idx_persons_role_status
  ON persons(role_id, status);

-- Routine assignments: routine_id + person_id (for person assignments)
CREATE INDEX IF NOT EXISTS idx_routine_assignments_routine_person
  ON routine_assignments(routine_id, person_id);

-- Routine assignments: person_id + routine_id (for person's routines)
CREATE INDEX IF NOT EXISTS idx_routine_assignments_person_routine
  ON routine_assignments(person_id, routine_id);

-- Goals: role_id + status (for listing active goals)
CREATE INDEX IF NOT EXISTS idx_goals_role_status
  ON goals(role_id, status);

-- Co-parents: parent_role_id + status (for active co-parent relationships)
CREATE INDEX IF NOT EXISTS idx_co_parents_parent_status
  ON co_parents(parent_role_id, status);

-- Co-parents: co_parent_role_id + status (for reverse lookups)
CREATE INDEX IF NOT EXISTS idx_co_parents_coparent_status
  ON co_parents(co_parent_role_id, status);

-- Verification codes: user_id + type + expires_at (for active codes)
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_type_expires
  ON verification_codes(user_id, type, expires_at);

-- Codes: role_id + expires_at (for active kiosk codes)
CREATE INDEX IF NOT EXISTS idx_codes_role_expires
  ON codes(role_id, expires_at DESC);

-- Codes: code + expires_at (for code validation)
CREATE INDEX IF NOT EXISTS idx_codes_code_expires
  ON codes(code, expires_at);

-- Invitations: inviter_user_id + status (for sent invitations)
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_status
  ON invitations(inviter_user_id, status);

-- Invitations: accepted_user_id + status (for received invitations)
CREATE INDEX IF NOT EXISTS idx_invitations_accepted_status
  ON invitations(accepted_user_id, status)
  WHERE accepted_user_id IS NOT NULL;

-- Marketplace routines: category + status (for browsing)
CREATE INDEX IF NOT EXISTS idx_marketplace_routines_category_status
  ON marketplace_routines(category, status);

-- Marketplace routines: status + average_rating (for sorting)
CREATE INDEX IF NOT EXISTS idx_marketplace_routines_status_rating
  ON marketplace_routines(status, average_rating DESC NULLS LAST);

-- Audit logs: user_id + created_at (for user activity timeline)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs(user_id, created_at DESC);

-- Audit logs: action + created_at (for filtering by action type)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON audit_logs(action, created_at DESC);
