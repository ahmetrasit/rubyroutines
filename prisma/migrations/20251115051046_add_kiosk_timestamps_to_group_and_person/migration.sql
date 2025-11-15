-- Add kioskLastUpdatedAt field to Group table for group-level kiosk update tracking
ALTER TABLE "groups" ADD COLUMN "kioskLastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add kioskLastUpdatedAt field to Person table for individual kiosk update tracking
ALTER TABLE "persons" ADD COLUMN "kioskLastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
