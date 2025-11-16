-- AlterTable
ALTER TABLE "task_completions" ADD COLUMN "entryNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "task_completions" ADD COLUMN "summedValue" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "task_completions_taskId_personId_completedAt_idx" ON "task_completions"("taskId", "personId", "completedAt");
