-- CreateTable
CREATE TABLE "person_connections" (
    "id" TEXT NOT NULL,
    "originRoleId" TEXT NOT NULL,
    "originPersonId" TEXT NOT NULL,
    "targetRoleId" TEXT NOT NULL,
    "targetPersonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "scopeMode" TEXT NOT NULL DEFAULT 'ALL',
    "visibleRoutineIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibleGoalIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disconnectedAt" TIMESTAMP(3),
    "disconnectedBy" TEXT,

    CONSTRAINT "person_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_connection_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "originRoleId" TEXT NOT NULL,
    "originPersonId" TEXT NOT NULL,
    "allowedTargetType" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "status" "CodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_connection_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_connections_originPersonId_targetPersonId_key" ON "person_connections"("originPersonId", "targetPersonId");

-- CreateIndex
CREATE INDEX "person_connections_originRoleId_idx" ON "person_connections"("originRoleId");

-- CreateIndex
CREATE INDEX "person_connections_originPersonId_idx" ON "person_connections"("originPersonId");

-- CreateIndex
CREATE INDEX "person_connections_targetRoleId_idx" ON "person_connections"("targetRoleId");

-- CreateIndex
CREATE INDEX "person_connections_targetPersonId_idx" ON "person_connections"("targetPersonId");

-- CreateIndex
CREATE INDEX "person_connections_status_idx" ON "person_connections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "person_connection_codes_code_key" ON "person_connection_codes"("code");

-- CreateIndex
CREATE INDEX "person_connection_codes_code_idx" ON "person_connection_codes"("code");

-- CreateIndex
CREATE INDEX "person_connection_codes_originRoleId_idx" ON "person_connection_codes"("originRoleId");

-- CreateIndex
CREATE INDEX "person_connection_codes_originPersonId_idx" ON "person_connection_codes"("originPersonId");

-- CreateIndex
CREATE INDEX "person_connection_codes_status_idx" ON "person_connection_codes"("status");

-- CreateIndex
CREATE INDEX "person_connection_codes_expiresAt_idx" ON "person_connection_codes"("expiresAt");

-- AddForeignKey
ALTER TABLE "person_connections" ADD CONSTRAINT "person_connections_originRoleId_fkey" FOREIGN KEY ("originRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_connections" ADD CONSTRAINT "person_connections_originPersonId_fkey" FOREIGN KEY ("originPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_connections" ADD CONSTRAINT "person_connections_targetRoleId_fkey" FOREIGN KEY ("targetRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_connections" ADD CONSTRAINT "person_connections_targetPersonId_fkey" FOREIGN KEY ("targetPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_connection_codes" ADD CONSTRAINT "person_connection_codes_originRoleId_fkey" FOREIGN KEY ("originRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_connection_codes" ADD CONSTRAINT "person_connection_codes_originPersonId_fkey" FOREIGN KEY ("originPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
