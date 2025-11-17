-- AlterTable: Add targetAudience to marketplace_items
ALTER TABLE "marketplace_items" ADD COLUMN "targetAudience" TEXT NOT NULL DEFAULT 'PARENT';

-- CreateIndex: Add index on targetAudience for filtering
CREATE INDEX "marketplace_items_targetAudience_idx" ON "marketplace_items"("targetAudience");

-- UpdateData: Set targetAudience based on authorRole type for existing items
UPDATE "marketplace_items" mi
SET "targetAudience" = r.type
FROM "roles" r
WHERE mi."authorRoleId" = r.id;

-- CreateTable: MarketplaceShareCode
CREATE TABLE "marketplace_share_codes" (
    "id" TEXT NOT NULL,
    "marketplaceItemId" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_share_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MarketplaceImport
CREATE TABLE "marketplace_imports" (
    "id" TEXT NOT NULL,
    "marketplaceItemId" TEXT NOT NULL,
    "importedBy" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "viaCode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on shareCode
CREATE UNIQUE INDEX "marketplace_share_codes_shareCode_key" ON "marketplace_share_codes"("shareCode");

-- CreateIndex: Index on shareCode for fast lookups
CREATE INDEX "marketplace_share_codes_shareCode_idx" ON "marketplace_share_codes"("shareCode");

-- CreateIndex: Index on marketplaceItemId
CREATE INDEX "marketplace_share_codes_marketplaceItemId_idx" ON "marketplace_share_codes"("marketplaceItemId");

-- CreateIndex: Index on expiresAt for cleanup queries
CREATE INDEX "marketplace_share_codes_expiresAt_idx" ON "marketplace_share_codes"("expiresAt");

-- CreateIndex: Index on active status
CREATE INDEX "marketplace_share_codes_active_idx" ON "marketplace_share_codes"("active");

-- CreateIndex: Unique constraint to prevent duplicate imports to same target
CREATE UNIQUE INDEX "marketplace_imports_marketplaceItemId_importedBy_targetId_key" ON "marketplace_imports"("marketplaceItemId", "importedBy", "targetId");

-- CreateIndex: Index on marketplaceItemId
CREATE INDEX "marketplace_imports_marketplaceItemId_idx" ON "marketplace_imports"("marketplaceItemId");

-- CreateIndex: Index on importedBy
CREATE INDEX "marketplace_imports_importedBy_idx" ON "marketplace_imports"("importedBy");

-- CreateIndex: Index on targetId
CREATE INDEX "marketplace_imports_targetId_idx" ON "marketplace_imports"("targetId");

-- AddForeignKey
ALTER TABLE "marketplace_share_codes" ADD CONSTRAINT "marketplace_share_codes_marketplaceItemId_fkey" FOREIGN KEY ("marketplaceItemId") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_share_codes" ADD CONSTRAINT "marketplace_share_codes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_imports" ADD CONSTRAINT "marketplace_imports_marketplaceItemId_fkey" FOREIGN KEY ("marketplaceItemId") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_imports" ADD CONSTRAINT "marketplace_imports_importedBy_fkey" FOREIGN KEY ("importedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
