-- Migration: Add CoTeacher Student Link
-- Generated: 2025-11-30

-- CreateTable
CREATE TABLE IF NOT EXISTS "co_teacher_student_links" (
    "id" TEXT NOT NULL,
    "coTeacherId" TEXT NOT NULL,
    "primaryStudentId" TEXT NOT NULL,
    "linkedStudentId" TEXT,
    "routineIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_teacher_student_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "co_teacher_student_links_coTeacherId_idx" ON "co_teacher_student_links"("coTeacherId");
CREATE INDEX IF NOT EXISTS "co_teacher_student_links_primaryStudentId_idx" ON "co_teacher_student_links"("primaryStudentId");
CREATE INDEX IF NOT EXISTS "co_teacher_student_links_linkedStudentId_idx" ON "co_teacher_student_links"("linkedStudentId");
CREATE UNIQUE INDEX IF NOT EXISTS "co_teacher_student_links_coTeacherId_primaryStudentId_key" ON "co_teacher_student_links"("coTeacherId", "primaryStudentId");

-- AddForeignKey
ALTER TABLE "co_teacher_student_links" DROP CONSTRAINT IF EXISTS "co_teacher_student_links_coTeacherId_fkey";
ALTER TABLE "co_teacher_student_links" ADD CONSTRAINT "co_teacher_student_links_coTeacherId_fkey" FOREIGN KEY ("coTeacherId") REFERENCES "co_teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "co_teacher_student_links" DROP CONSTRAINT IF EXISTS "co_teacher_student_links_primaryStudentId_fkey";
ALTER TABLE "co_teacher_student_links" ADD CONSTRAINT "co_teacher_student_links_primaryStudentId_fkey" FOREIGN KEY ("primaryStudentId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "co_teacher_student_links" DROP CONSTRAINT IF EXISTS "co_teacher_student_links_linkedStudentId_fkey";
ALTER TABLE "co_teacher_student_links" ADD CONSTRAINT "co_teacher_student_links_linkedStudentId_fkey" FOREIGN KEY ("linkedStudentId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
