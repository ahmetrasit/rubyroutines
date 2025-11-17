-- AlterTable: Add targetAudience to marketplace_items (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_items' AND column_name = 'targetAudience') THEN
        ALTER TABLE "marketplace_items" ADD COLUMN "targetAudience" TEXT NOT NULL DEFAULT 'PARENT';
    END IF;
END $$;

-- CreateIndex: Add index on targetAudience for filtering (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'marketplace_items_targetAudience_idx') THEN
        CREATE INDEX "marketplace_items_targetAudience_idx" ON "marketplace_items"("targetAudience");
    END IF;
END $$;

-- UpdateData: Set targetAudience based on authorRole type for existing items
UPDATE "marketplace_items" mi
SET "targetAudience" = r.type
FROM "roles" r
WHERE mi."authorRoleId" = r.id;

-- CreateTable: MarketplaceShareCode (if not exists)
CREATE TABLE IF NOT EXISTS "marketplace_share_codes" (
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

-- CreateTable: MarketplaceImport (if not exists)
CREATE TABLE IF NOT EXISTS "marketplace_imports" (
    "id" TEXT NOT NULL,
    "marketplaceItemId" TEXT NOT NULL,
    "importedBy" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "viaCode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on shareCode (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_share_codes_shareCode_key" ON "marketplace_share_codes"("shareCode");

-- CreateIndex: Index on shareCode for fast lookups (if not exists)
CREATE INDEX IF NOT EXISTS "marketplace_share_codes_shareCode_idx" ON "marketplace_share_codes"("shareCode");

-- CreateIndex: Index on marketplaceItemId (if not exists)
CREATE INDEX IF NOT EXISTS "marketplace_share_codes_marketplaceItemId_idx" ON "marketplace_share_codes"("marketplaceItemId");

-- CreateIndex: Index on expiresAt for cleanup queries (if not exists)
CREATE INDEX IF NOT EXISTS "marketplace_share_codes_expiresAt_idx" ON "marketplace_share_codes"("expiresAt");

-- CreateIndex: Index on active status (if not exists)
CREATE INDEX IF NOT EXISTS "marketplace_share_codes_active_idx" ON "marketplace_share_codes"("active");

-- CreateIndex: Unique constraint to prevent duplicate imports to same target (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_imports_marketplaceItemId_importedBy_targetId_key" ON "marketplace_imports"("marketplaceItemId", "importedBy", "targetId");

-- CreateIndex: Index on marketplaceItemId (if not exists)
CREATE INDEX IF NOT EXISTS "marketplace_imports_marketplaceItemId_idx" ON "marketplace_imports"("marketplaceItemId");

-- CreateIndex: Index on importedBy (if not exists)
CREATE INDEX IF NOT EXISTS "marketplace_imports_importedBy_idx" ON "marketplace_imports"("importedBy");

-- CreateIndex: Index on targetId (if not exists)
CREATE INDEX IF NOT EXISTS "marketplace_imports_targetId_idx" ON "marketplace_imports"("targetId");

-- AddForeignKey (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_share_codes_marketplaceItemId_fkey') THEN
        ALTER TABLE "marketplace_share_codes" ADD CONSTRAINT "marketplace_share_codes_marketplaceItemId_fkey" FOREIGN KEY ("marketplaceItemId") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_share_codes_createdBy_fkey') THEN
        ALTER TABLE "marketplace_share_codes" ADD CONSTRAINT "marketplace_share_codes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_imports_marketplaceItemId_fkey') THEN
        ALTER TABLE "marketplace_imports" ADD CONSTRAINT "marketplace_imports_marketplaceItemId_fkey" FOREIGN KEY ("marketplaceItemId") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_imports_importedBy_fkey') THEN
        ALTER TABLE "marketplace_imports" ADD CONSTRAINT "marketplace_imports_importedBy_fkey" FOREIGN KEY ("importedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
