-- Rename tier enum values from BASIC/PREMIUM/SCHOOL to BRONZE/GOLD/PRO

-- Step 1: Add new enum values
ALTER TYPE "Tier" ADD VALUE IF NOT EXISTS 'BRONZE';
ALTER TYPE "Tier" ADD VALUE IF NOT EXISTS 'GOLD';
ALTER TYPE "Tier" ADD VALUE IF NOT EXISTS 'PRO';

-- Step 2: Update all existing records
UPDATE "roles" SET "tier" = 'BRONZE' WHERE "tier" = 'BASIC';
UPDATE "roles" SET "tier" = 'GOLD' WHERE "tier" = 'PREMIUM';
UPDATE "roles" SET "tier" = 'PRO' WHERE "tier" = 'SCHOOL';

-- Note: PostgreSQL doesn't allow removing enum values directly
-- Old values (BASIC, PREMIUM, SCHOOL) will remain in the enum type but unused
-- To fully remove them would require recreating the enum type which is more complex
-- and risky. They are now deprecated and should not be used.
