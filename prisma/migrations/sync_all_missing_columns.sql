-- ============================================================================
-- COMPREHENSIVE MIGRATION TO SYNC ALL MISSING COLUMNS
-- Generated: 2025-11-20
-- This migration adds all columns that exist in the Prisma schema but are
-- missing from the database, based on comparison with existing migrations.
-- ============================================================================

-- ============================================================================
-- 1. CREATE MISSING ENUMS
-- ============================================================================

-- Create GoalType enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GoalType') THEN
        CREATE TYPE "GoalType" AS ENUM (
            'COMPLETION_COUNT',
            'STREAK',
            'TIME_BASED',
            'VALUE_BASED',
            'PERCENTAGE'
        );
    END IF;
END $$;

-- ============================================================================
-- 2. ADD MISSING COLUMNS TO GOALS TABLE
-- ============================================================================

-- Add icon column for visual representation
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS "icon" TEXT;

-- Add color column for UI styling
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS "color" TEXT;

-- Add type column for goal categorization
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'goals' AND column_name = 'type') THEN
        ALTER TABLE goals ADD COLUMN "type" "GoalType" DEFAULT 'COMPLETION_COUNT';
    END IF;
END $$;

-- Add unit column for measurement units
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS "unit" TEXT;

-- Add streak tracking columns
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER DEFAULT 0;

ALTER TABLE goals
ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER DEFAULT 0;

-- Add achievement tracking
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS "lastAchievedAt" TIMESTAMP(3);

-- Note: simpleCondition, comparisonOperator, comparisonValue
-- were already added in migration 20251120015500_add_simple_goal_fields

-- ============================================================================
-- 3. ADD MISSING COLUMNS TO ROUTINES TABLE
-- ============================================================================

-- Add isTeacherOnly column (CRITICAL - this was causing the error)
ALTER TABLE routines
ADD COLUMN IF NOT EXISTS "isTeacherOnly" BOOLEAN DEFAULT false;

-- Note: startTime, endTime were already added in migration 20251115190937_add_routine_time_fields
-- Note: color was already added in migration 20251115191517_add_routine_color

-- ============================================================================
-- 4. CREATE MISSING TABLES
-- ============================================================================

-- Create goal_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS "goal_progress" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION DEFAULT 0,
    "achieved" BOOLEAN DEFAULT false,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "achievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_progress_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint for goal_progress
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = 'goal_progress_goalId_personId_periodStart_key') THEN
        ALTER TABLE goal_progress
        ADD CONSTRAINT "goal_progress_goalId_personId_periodStart_key"
        UNIQUE ("goalId", "personId", "periodStart");
    END IF;
END $$;

-- Add foreign key constraints for goal_progress
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = 'goal_progress_goalId_fkey') THEN
        ALTER TABLE goal_progress
        ADD CONSTRAINT "goal_progress_goalId_fkey"
        FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = 'goal_progress_personId_fkey') THEN
        ALTER TABLE goal_progress
        ADD CONSTRAINT "goal_progress_personId_fkey"
        FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 5. CREATE MISSING INDEXES
-- ============================================================================

-- Indexes for goals table
CREATE INDEX IF NOT EXISTS "goals_type_idx" ON goals("type");
CREATE INDEX IF NOT EXISTS "goals_roleId_type_idx" ON goals("roleId", "type");

-- Indexes for routines table
CREATE INDEX IF NOT EXISTS "routines_isTeacherOnly_idx" ON routines("isTeacherOnly");
CREATE INDEX IF NOT EXISTS "routines_roleId_isTeacherOnly_status_idx"
    ON routines("roleId", "isTeacherOnly", "status");

-- Indexes for goal_progress table
CREATE INDEX IF NOT EXISTS "goal_progress_goalId_personId_idx"
    ON goal_progress("goalId", "personId");
CREATE INDEX IF NOT EXISTS "goal_progress_periodStart_periodEnd_idx"
    ON goal_progress("periodStart", "periodEnd");

-- ============================================================================
-- 6. VERIFY CRITICAL COLUMNS EXIST (Safety check)
-- ============================================================================

-- This section will raise notices if critical columns are still missing
DO $$
BEGIN
    -- Check for routines.isTeacherOnly
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'routines' AND column_name = 'isTeacherOnly') THEN
        RAISE NOTICE 'WARNING: routines.isTeacherOnly column was not created!';
    END IF;

    -- Check for goals.icon
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'goals' AND column_name = 'icon') THEN
        RAISE NOTICE 'WARNING: goals.icon column was not created!';
    END IF;

    -- Check for goals.color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'goals' AND column_name = 'color') THEN
        RAISE NOTICE 'WARNING: goals.color column was not created!';
    END IF;

    -- Check for goal_progress table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_name = 'goal_progress') THEN
        RAISE NOTICE 'WARNING: goal_progress table was not created!';
    END IF;
END $$;

-- ============================================================================
-- 7. FINAL STATUS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration completed. The following changes were attempted:';
    RAISE NOTICE '- Added missing columns to goals table (icon, color, type, unit, streaks, lastAchievedAt)';
    RAISE NOTICE '- Added isTeacherOnly column to routines table';
    RAISE NOTICE '- Created goal_progress table with proper constraints';
    RAISE NOTICE '- Created necessary indexes for performance';
    RAISE NOTICE '';
    RAISE NOTICE 'Please verify the changes were applied successfully using the verification queries below.';
END $$;

-- ============================================================================
-- 8. VERIFICATION QUERIES (Commented out - run manually to verify)
-- ============================================================================

-- Run these queries manually after migration to verify all columns exist:
/*
-- Check goals table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'goals'
AND column_name IN ('icon', 'color', 'type', 'unit', 'currentStreak', 'longestStreak', 'lastAchievedAt')
ORDER BY column_name;

-- Check routines table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'routines'
AND column_name = 'isTeacherOnly';

-- Check goal_progress table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'goal_progress';

-- Check GoalType enum exists
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'GoalType'
ORDER BY enumsortorder;
*/