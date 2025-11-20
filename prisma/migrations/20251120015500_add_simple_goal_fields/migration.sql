-- Migration to add simple goal fields to the goals table
-- Run this manually or through Prisma migrate when the binaries are available

ALTER TABLE goals
ADD COLUMN IF NOT EXISTS "simpleCondition" TEXT,
ADD COLUMN IF NOT EXISTS "comparisonOperator" TEXT,
ADD COLUMN IF NOT EXISTS "comparisonValue" DOUBLE PRECISION;

-- Add indexes for querying
CREATE INDEX IF NOT EXISTS "goals_simpleCondition_idx" ON goals("simpleCondition");
CREATE INDEX IF NOT EXISTS "goals_comparisonOperator_idx" ON goals("comparisonOperator");