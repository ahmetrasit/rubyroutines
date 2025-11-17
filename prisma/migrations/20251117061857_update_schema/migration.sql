-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "routine_share_codes" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routine_share_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routine_share_codes_shareCode_key" ON "routine_share_codes"("shareCode");

-- CreateIndex
CREATE INDEX "routine_share_codes_shareCode_idx" ON "routine_share_codes"("shareCode");

-- CreateIndex
CREATE INDEX "routine_share_codes_routineId_idx" ON "routine_share_codes"("routineId");

-- AddForeignKey
ALTER TABLE "routine_share_codes" ADD CONSTRAINT "routine_share_codes_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_share_codes" ADD CONSTRAINT "routine_share_codes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
