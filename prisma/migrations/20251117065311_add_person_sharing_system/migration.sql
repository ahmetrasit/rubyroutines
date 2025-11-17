-- CreateEnum
CREATE TYPE "ShareType" AS ENUM ('PERSON', 'ROUTINE_ACCESS', 'FULL_ROLE');

-- CreateEnum
CREATE TYPE "PermissionLevel" AS ENUM ('VIEW', 'EDIT', 'MANAGE');

-- CreateTable
CREATE TABLE "person_sharing_invites" (
    "id" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "ownerRoleId" TEXT NOT NULL,
    "ownerPersonId" TEXT,
    "shareType" "ShareType" NOT NULL,
    "permissions" "PermissionLevel" NOT NULL DEFAULT 'VIEW',
    "contextData" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_sharing_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_sharing_connections" (
    "id" TEXT NOT NULL,
    "ownerRoleId" TEXT NOT NULL,
    "ownerPersonId" TEXT,
    "sharedWithRoleId" TEXT NOT NULL,
    "sharedWithUserId" TEXT NOT NULL,
    "shareType" "ShareType" NOT NULL,
    "permissions" "PermissionLevel" NOT NULL DEFAULT 'VIEW',
    "contextData" JSONB,
    "inviteCodeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_sharing_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_sharing_invites_inviteCode_key" ON "person_sharing_invites"("inviteCode");

-- CreateIndex
CREATE INDEX "person_sharing_invites_inviteCode_idx" ON "person_sharing_invites"("inviteCode");

-- CreateIndex
CREATE INDEX "person_sharing_invites_ownerRoleId_idx" ON "person_sharing_invites"("ownerRoleId");

-- CreateIndex
CREATE INDEX "person_sharing_invites_ownerPersonId_idx" ON "person_sharing_invites"("ownerPersonId");

-- CreateIndex
CREATE INDEX "person_sharing_invites_status_idx" ON "person_sharing_invites"("status");

-- CreateIndex
CREATE INDEX "person_sharing_invites_expiresAt_idx" ON "person_sharing_invites"("expiresAt");

-- CreateIndex
CREATE INDEX "person_sharing_connections_ownerRoleId_idx" ON "person_sharing_connections"("ownerRoleId");

-- CreateIndex
CREATE INDEX "person_sharing_connections_ownerPersonId_idx" ON "person_sharing_connections"("ownerPersonId");

-- CreateIndex
CREATE INDEX "person_sharing_connections_sharedWithRoleId_idx" ON "person_sharing_connections"("sharedWithRoleId");

-- CreateIndex
CREATE INDEX "person_sharing_connections_sharedWithUserId_idx" ON "person_sharing_connections"("sharedWithUserId");

-- CreateIndex
CREATE INDEX "person_sharing_connections_status_idx" ON "person_sharing_connections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "person_sharing_connections_ownerRoleId_ownerPersonId_shared_key" ON "person_sharing_connections"("ownerRoleId", "ownerPersonId", "sharedWithRoleId", "shareType");

-- AddForeignKey
ALTER TABLE "person_sharing_invites" ADD CONSTRAINT "person_sharing_invites_ownerRoleId_fkey" FOREIGN KEY ("ownerRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_sharing_invites" ADD CONSTRAINT "person_sharing_invites_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_sharing_connections" ADD CONSTRAINT "person_sharing_connections_ownerRoleId_fkey" FOREIGN KEY ("ownerRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_sharing_connections" ADD CONSTRAINT "person_sharing_connections_ownerPersonId_fkey" FOREIGN KEY ("ownerPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_sharing_connections" ADD CONSTRAINT "person_sharing_connections_sharedWithRoleId_fkey" FOREIGN KEY ("sharedWithRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_sharing_connections" ADD CONSTRAINT "person_sharing_connections_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_sharing_connections" ADD CONSTRAINT "person_sharing_connections_inviteCodeId_fkey" FOREIGN KEY ("inviteCodeId") REFERENCES "person_sharing_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
