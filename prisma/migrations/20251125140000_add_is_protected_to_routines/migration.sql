-- AlterTable: Add isProtected field to routines table
-- This field marks routines that cannot be deleted or renamed (e.g., default "Daily Routine")
-- Protected routines can still have their color and description changed

-- Drop the old snake_case column if it exists
ALTER TABLE "routines" DROP COLUMN IF EXISTS "is_protected";

-- Add isProtected column in camelCase (matching existing schema convention)
ALTER TABLE "routines" ADD COLUMN IF NOT EXISTS "isProtected" BOOLEAN NOT NULL DEFAULT false;

-- Create index for isProtected field for efficient queries
DROP INDEX IF EXISTS "routines_is_protected_idx";
CREATE INDEX "routines_isProtected_idx" ON "routines"("isProtected");

-- Mark existing "Daily Routine" routines as protected
UPDATE "routines"
SET "isProtected" = true
WHERE "name" LIKE '%Daily Routine%'
  AND "isProtected" = false;
