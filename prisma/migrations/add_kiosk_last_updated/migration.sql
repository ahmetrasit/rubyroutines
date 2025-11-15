-- Add kioskLastUpdatedAt field to Role table for optimized kiosk polling
ALTER TABLE "roles" ADD COLUMN "kioskLastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index for efficient queries
CREATE INDEX "roles_kioskLastUpdatedAt_idx" ON "roles"("kioskLastUpdatedAt");
