-- CreateTable
CREATE TABLE "moderation_logs" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "moderation_logs_adminUserId_idx" ON "moderation_logs"("adminUserId");

-- CreateIndex
CREATE INDEX "moderation_logs_entityType_entityId_idx" ON "moderation_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "moderation_logs_timestamp_idx" ON "moderation_logs"("timestamp");

-- CreateIndex
CREATE INDEX "moderation_logs_action_idx" ON "moderation_logs"("action");

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
