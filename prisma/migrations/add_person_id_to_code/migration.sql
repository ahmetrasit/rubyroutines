-- AlterTable
ALTER TABLE "codes" ADD COLUMN "personId" TEXT;

-- CreateIndex
CREATE INDEX "codes_personId_idx" ON "codes"("personId");

-- AddForeignKey
ALTER TABLE "codes" ADD CONSTRAINT "codes_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
