-- Update Task table: add isSmart, conditionId, remove targetValue
ALTER TABLE "tasks" ADD COLUMN "isSmart" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tasks" ADD COLUMN "conditionId" TEXT;
ALTER TABLE "tasks" DROP COLUMN "targetValue";

-- Create index for isSmart and conditionId
CREATE INDEX "tasks_isSmart_idx" ON "tasks"("isSmart");
CREATE INDEX "tasks_conditionId_idx" ON "tasks"("conditionId");

-- Update TaskType enum: remove SMART
ALTER TYPE "TaskType" RENAME TO "TaskType_old";
CREATE TYPE "TaskType" AS ENUM ('SIMPLE', 'MULTIPLE_CHECKIN', 'PROGRESS');
ALTER TABLE "tasks" ALTER COLUMN "type" TYPE "TaskType" USING ("type"::text::"TaskType");
DROP TYPE "TaskType_old";

-- Drop old Condition table
DROP TABLE IF EXISTS "conditions" CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS "ConditionType";
DROP TYPE IF EXISTS "ConditionOperator";

-- Create new ConditionLogic enum
CREATE TYPE "ConditionLogic" AS ENUM ('AND', 'OR');

-- Create new ConditionOperator enum
CREATE TYPE "ConditionOperator" AS ENUM (
  'TASK_COMPLETED',
  'TASK_NOT_COMPLETED',
  'TASK_COUNT_EQUALS',
  'TASK_COUNT_GT',
  'TASK_COUNT_LT',
  'TASK_VALUE_EQUALS',
  'TASK_VALUE_GT',
  'TASK_VALUE_LT',
  'ROUTINE_PERCENT_EQUALS',
  'ROUTINE_PERCENT_GT',
  'ROUTINE_PERCENT_LT',
  'GOAL_ACHIEVED',
  'GOAL_NOT_ACHIEVED'
);

-- Create new Condition table
CREATE TABLE "conditions" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "controlsRoutine" BOOLEAN NOT NULL DEFAULT false,
    "logic" "ConditionLogic" NOT NULL DEFAULT 'AND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

-- Create ConditionCheck table
CREATE TABLE "condition_checks" (
    "id" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "negate" BOOLEAN NOT NULL DEFAULT false,
    "operator" "ConditionOperator" NOT NULL,
    "value" TEXT,
    "targetTaskId" TEXT,
    "targetRoutineId" TEXT,
    "targetGoalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condition_checks_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Condition
CREATE INDEX "conditions_routineId_idx" ON "conditions"("routineId");
CREATE INDEX "conditions_controlsRoutine_idx" ON "conditions"("controlsRoutine");

-- Create indexes for ConditionCheck
CREATE INDEX "condition_checks_conditionId_idx" ON "condition_checks"("conditionId");
CREATE INDEX "condition_checks_targetTaskId_idx" ON "condition_checks"("targetTaskId");
CREATE INDEX "condition_checks_targetRoutineId_idx" ON "condition_checks"("targetRoutineId");
CREATE INDEX "condition_checks_targetGoalId_idx" ON "condition_checks"("targetGoalId");

-- Add foreign keys for Condition
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign keys for ConditionCheck
ALTER TABLE "condition_checks" ADD CONSTRAINT "condition_checks_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "condition_checks" ADD CONSTRAINT "condition_checks_targetTaskId_fkey" FOREIGN KEY ("targetTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "condition_checks" ADD CONSTRAINT "condition_checks_targetRoutineId_fkey" FOREIGN KEY ("targetRoutineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "condition_checks" ADD CONSTRAINT "condition_checks_targetGoalId_fkey" FOREIGN KEY ("targetGoalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key from Task to Condition
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
