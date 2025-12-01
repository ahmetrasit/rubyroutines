-- Migration: Add CoParent Person Link and related schema changes
-- Generated: 2025-11-30

-- AlterTable
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "sharedPersons" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "co_parent_person_links" (
    "id" TEXT NOT NULL,
    "coParentId" TEXT NOT NULL,
    "primaryPersonId" TEXT NOT NULL,
    "linkedPersonId" TEXT,
    "routineIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_parent_person_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (with IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS "co_parent_person_links_coParentId_idx" ON "co_parent_person_links"("coParentId");
CREATE INDEX IF NOT EXISTS "co_parent_person_links_primaryPersonId_idx" ON "co_parent_person_links"("primaryPersonId");
CREATE INDEX IF NOT EXISTS "co_parent_person_links_linkedPersonId_idx" ON "co_parent_person_links"("linkedPersonId");
CREATE UNIQUE INDEX IF NOT EXISTS "co_parent_person_links_coParentId_primaryPersonId_key" ON "co_parent_person_links"("coParentId", "primaryPersonId");

-- CreateIndex for task_completions (may already exist)
CREATE UNIQUE INDEX IF NOT EXISTS "task_completions_idempotencyKey_key" ON "task_completions"("idempotencyKey");

-- CreateIndex for tasks (may already exist)
CREATE INDEX IF NOT EXISTS "tasks_routineId_status_idx" ON "tasks"("routineId", "status");
CREATE INDEX IF NOT EXISTS "tasks_routineId_order_idx" ON "tasks"("routineId", "order");

-- AddForeignKey for task_completions (drop first if exists, then add)
ALTER TABLE "task_completions" DROP CONSTRAINT IF EXISTS "task_completions_sessionId_fkey";
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "kiosk_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for co_parent_person_links
ALTER TABLE "co_parent_person_links" DROP CONSTRAINT IF EXISTS "co_parent_person_links_coParentId_fkey";
ALTER TABLE "co_parent_person_links" ADD CONSTRAINT "co_parent_person_links_coParentId_fkey" FOREIGN KEY ("coParentId") REFERENCES "co_parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "co_parent_person_links" DROP CONSTRAINT IF EXISTS "co_parent_person_links_primaryPersonId_fkey";
ALTER TABLE "co_parent_person_links" ADD CONSTRAINT "co_parent_person_links_primaryPersonId_fkey" FOREIGN KEY ("primaryPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "co_parent_person_links" DROP CONSTRAINT IF EXISTS "co_parent_person_links_linkedPersonId_fkey";
ALTER TABLE "co_parent_person_links" ADD CONSTRAINT "co_parent_person_links_linkedPersonId_fkey" FOREIGN KEY ("linkedPersonId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
