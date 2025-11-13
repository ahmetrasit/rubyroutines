-- Add admin panel tables and fields

-- Add isAdmin field to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "users_is_admin_idx" ON "users"("is_admin");

-- Add tierOverride field to roles table
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "tier_override" JSONB;

-- Create system_settings table
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "system_settings_category_idx" ON "system_settings"("category");

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- Insert default system settings
INSERT INTO "system_settings" ("id", "key", "value", "category", "description", "created_at", "updated_at")
VALUES
  ('default_maintenance_mode', 'maintenance_mode', 'false'::jsonb, 'general', 'Enable maintenance mode', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('default_registration_enabled', 'registration_enabled', 'true'::jsonb, 'general', 'Allow new user registrations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('default_marketplace_enabled', 'marketplace_enabled', 'true'::jsonb, 'features', 'Enable marketplace feature', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('default_max_login_attempts', 'max_login_attempts', '5'::jsonb, 'security', 'Maximum login attempts before lockout', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('default_session_timeout', 'session_timeout', '86400'::jsonb, 'security', 'Session timeout in seconds', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;
