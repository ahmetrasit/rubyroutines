-- Add composite indexes for optimizing routine filtering queries
-- These indexes significantly improve performance for queries that filter routines by multiple fields

-- Routine model indexes
-- Primary composite index for the most common query pattern: filtering by roleId, isTeacherOnly, and status
CREATE INDEX "routines_roleId_isTeacherOnly_status_idx" ON "routines"("roleId", "isTeacherOnly", "status");

-- Composite index for role-based type filtering
CREATE INDEX "routines_roleId_type_status_idx" ON "routines"("roleId", "type", "status");

-- Single column index for teacher-only filtering (used in isolation)
CREATE INDEX "routines_isTeacherOnly_idx" ON "routines"("isTeacherOnly");

-- Person model indexes
-- Composite index for filtered person queries
CREATE INDEX "persons_roleId_status_idx" ON "persons"("roleId", "status");

-- Index for finding account owner quickly
CREATE INDEX "persons_roleId_isAccountOwner_idx" ON "persons"("roleId", "isAccountOwner");

-- Group model indexes
-- Composite index for filtered group queries
CREATE INDEX "groups_roleId_status_idx" ON "groups"("roleId", "status");

-- Composite index for role-based group type filtering
CREATE INDEX "groups_roleId_type_status_idx" ON "groups"("roleId", "type", "status");

-- Task model indexes
-- Composite index for active tasks in routines
CREATE INDEX "tasks_routineId_status_idx" ON "tasks"("routineId", "status");

-- Composite index for ordered task retrieval
CREATE INDEX "tasks_routineId_order_idx" ON "tasks"("routineId", "order");

-- Code model indexes
-- Composite index for code lookup with status check
CREATE INDEX "codes_code_status_idx" ON "codes"("code", "status");

-- Composite index for role-based code queries
CREATE INDEX "codes_roleId_status_type_idx" ON "codes"("roleId", "status", "type");

-- Goal model indexes
-- Composite index for active goals by role
CREATE INDEX "goals_roleId_status_idx" ON "goals"("roleId", "status");