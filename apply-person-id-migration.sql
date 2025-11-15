-- Add personId column to Code table
-- This migration adds support for individual kiosk codes

-- Check if the column already exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Code'
        AND column_name = 'personId'
    ) THEN
        ALTER TABLE "Code" ADD COLUMN "personId" TEXT;
        CREATE INDEX "Code_personId_idx" ON "Code"("personId");
        ALTER TABLE "Code" ADD CONSTRAINT "Code_personId_fkey"
            FOREIGN KEY ("personId") REFERENCES "Person"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
