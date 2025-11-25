-- AlterTable
ALTER TABLE "codes" ADD COLUMN "sessionDurationDays" INTEGER NOT NULL DEFAULT 90;

-- CreateTable
CREATE TABLE "kiosk_sessions" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "terminatedBy" TEXT,
    "terminatedAt" TIMESTAMP(3),
    "terminationReason" TEXT,

    CONSTRAINT "kiosk_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kiosk_sessions_codeId_idx" ON "kiosk_sessions"("codeId");

-- CreateIndex
CREATE INDEX "kiosk_sessions_deviceId_idx" ON "kiosk_sessions"("deviceId");

-- CreateIndex
CREATE INDEX "kiosk_sessions_endedAt_idx" ON "kiosk_sessions"("endedAt");

-- CreateIndex
CREATE INDEX "kiosk_sessions_expiresAt_idx" ON "kiosk_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "kiosk_sessions_ipAddress_idx" ON "kiosk_sessions"("ipAddress");

-- CreateIndex
CREATE INDEX "kiosk_sessions_codeId_endedAt_idx" ON "kiosk_sessions"("codeId", "endedAt");

-- AddForeignKey
ALTER TABLE "kiosk_sessions" ADD CONSTRAINT "kiosk_sessions_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
