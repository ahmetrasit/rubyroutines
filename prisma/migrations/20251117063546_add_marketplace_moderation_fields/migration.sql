-- AlterTable
ALTER TABLE "marketplace_items" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenBy" TEXT;

-- CreateIndex
CREATE INDEX "marketplace_items_hidden_idx" ON "marketplace_items"("hidden");
