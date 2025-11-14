-- Add color column to roles table
ALTER TABLE roles ADD COLUMN IF NOT EXISTS color TEXT;

-- Set default colors for existing roles
UPDATE roles SET color = '#9333ea' WHERE type = 'PARENT' AND color IS NULL;
UPDATE roles SET color = '#3b82f6' WHERE type = 'TEACHER' AND color IS NULL;
UPDATE roles SET color = '#f59e0b' WHERE type = 'PRINCIPAL' AND color IS NULL;
UPDATE roles SET color = '#10b981' WHERE type = 'SUPPORT' AND color IS NULL;
