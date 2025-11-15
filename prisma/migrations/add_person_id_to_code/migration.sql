-- AlterTable
ALTER TABLE "Code" ADD COLUMN "personId" TEXT;

-- CreateIndex
CREATE INDEX "Code_personId_idx" ON "Code"("personId");

-- AddForeignKey
ALTER TABLE "Code" ADD CONSTRAINT "Code_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
