-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('PARENT', 'TEACHER', 'PRINCIPAL', 'SUPPORT');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'BRONZE', 'GOLD', 'PRO');

-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('FAMILY', 'CLASSROOM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RoutineType" AS ENUM ('REGULAR', 'SMART', 'TEACHER_CLASSROOM');

-- CreateEnum
CREATE TYPE "ResetPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('ALWAYS', 'DATE_RANGE', 'DAYS_OF_WEEK', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('SIMPLE', 'MULTIPLE_CHECKIN', 'PROGRESS');

-- CreateEnum
CREATE TYPE "ConditionLogic" AS ENUM ('AND', 'OR');

-- CreateEnum
CREATE TYPE "ConditionOperator" AS ENUM ('TASK_COMPLETED', 'TASK_NOT_COMPLETED', 'TASK_COUNT_EQUALS', 'TASK_COUNT_GT', 'TASK_COUNT_LT', 'TASK_VALUE_EQUALS', 'TASK_VALUE_GT', 'TASK_VALUE_LT', 'ROUTINE_PERCENT_EQUALS', 'ROUTINE_PERCENT_GT', 'ROUTINE_PERCENT_LT', 'GOAL_ACHIEVED', 'GOAL_NOT_ACHIEVED');

-- CreateEnum
CREATE TYPE "CodeType" AS ENUM ('KIOSK', 'EMAIL_VERIFICATION');

-- CreateEnum
CREATE TYPE "CodeStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('CO_PARENT', 'CO_TEACHER', 'SCHOOL_TEACHER', 'SCHOOL_SUPPORT');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorBackupCodes" TEXT[],

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RoleType" NOT NULL,
    "tier" "Tier" NOT NULL DEFAULT 'FREE',
    "color" TEXT,
    "tierOverride" JSONB,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT DEFAULT 'ACTIVE',
    "kioskLastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "avatar" TEXT,
    "notes" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kioskLastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "GroupType" NOT NULL DEFAULT 'FAMILY',
    "isClassroom" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kioskLastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" TEXT DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RoutineType" NOT NULL DEFAULT 'REGULAR',
    "resetPeriod" "ResetPeriod" NOT NULL DEFAULT 'DAILY',
    "resetDay" INTEGER,
    "visibility" "Visibility" NOT NULL DEFAULT 'ALWAYS',
    "visibleDays" INTEGER[],
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "sourceMarketplaceItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_assignments" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "personId" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'SIMPLE',
    "isSmart" BOOLEAN NOT NULL DEFAULT false,
    "conditionId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_completions" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target" DOUBLE PRECISION NOT NULL,
    "period" "ResetPeriod" NOT NULL DEFAULT 'WEEKLY',
    "resetDay" INTEGER,
    "personIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "groupIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "sourceMarketplaceItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_task_links" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_task_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_routine_links" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_routine_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conditions" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "controlsRoutine" BOOLEAN NOT NULL DEFAULT false,
    "logic" "ConditionLogic" NOT NULL DEFAULT 'AND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "visibility_overrides" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visibility_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "groupId" TEXT,
    "personId" TEXT,
    "type" "CodeType" NOT NULL DEFAULT 'KIOSK',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "status" "CodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "teacherRoleId" TEXT NOT NULL,
    "studentPersonId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "status" "CodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "inviterUserId" TEXT NOT NULL,
    "inviterRoleId" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "type" "InvitationType" NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT 'READ_ONLY',
    "personIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "groupIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_parents" (
    "id" TEXT NOT NULL,
    "primaryRoleId" TEXT NOT NULL,
    "coParentRoleId" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT 'READ_ONLY',
    "personIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_teachers" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "primaryTeacherRoleId" TEXT NOT NULL,
    "coTeacherRoleId" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT 'VIEW',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_parent_connections" (
    "id" TEXT NOT NULL,
    "teacherRoleId" TEXT NOT NULL,
    "studentPersonId" TEXT NOT NULL,
    "parentRoleId" TEXT NOT NULL,
    "parentPersonId" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT 'TASK_COMPLETION',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_parent_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_members" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_items" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "authorRoleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "category" TEXT,
    "ageGroup" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "content" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "forkCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_ratings" (
    "id" TEXT NOT NULL,
    "marketplaceItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_comments" (
    "id" TEXT NOT NULL,
    "marketplaceItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_flags" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attemptsLeft" INTEGER NOT NULL DEFAULT 3,
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_isAdmin_idx" ON "users"("isAdmin");

-- CreateIndex
CREATE UNIQUE INDEX "roles_stripeCustomerId_key" ON "roles"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_stripeSubscriptionId_key" ON "roles"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "roles_userId_idx" ON "roles"("userId");

-- CreateIndex
CREATE INDEX "roles_type_idx" ON "roles"("type");

-- CreateIndex
CREATE UNIQUE INDEX "roles_userId_type_key" ON "roles"("userId", "type");

-- CreateIndex
CREATE INDEX "persons_roleId_idx" ON "persons"("roleId");

-- CreateIndex
CREATE INDEX "persons_status_idx" ON "persons"("status");

-- CreateIndex
CREATE INDEX "groups_roleId_idx" ON "groups"("roleId");

-- CreateIndex
CREATE INDEX "groups_type_idx" ON "groups"("type");

-- CreateIndex
CREATE INDEX "groups_status_idx" ON "groups"("status");

-- CreateIndex
CREATE INDEX "group_members_groupId_idx" ON "group_members"("groupId");

-- CreateIndex
CREATE INDEX "group_members_personId_idx" ON "group_members"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_personId_key" ON "group_members"("groupId", "personId");

-- CreateIndex
CREATE INDEX "routines_roleId_idx" ON "routines"("roleId");

-- CreateIndex
CREATE INDEX "routines_type_idx" ON "routines"("type");

-- CreateIndex
CREATE INDEX "routines_status_idx" ON "routines"("status");

-- CreateIndex
CREATE INDEX "routine_assignments_routineId_idx" ON "routine_assignments"("routineId");

-- CreateIndex
CREATE INDEX "routine_assignments_personId_idx" ON "routine_assignments"("personId");

-- CreateIndex
CREATE INDEX "routine_assignments_groupId_idx" ON "routine_assignments"("groupId");

-- CreateIndex
CREATE INDEX "tasks_routineId_idx" ON "tasks"("routineId");

-- CreateIndex
CREATE INDEX "tasks_type_idx" ON "tasks"("type");

-- CreateIndex
CREATE INDEX "tasks_isSmart_idx" ON "tasks"("isSmart");

-- CreateIndex
CREATE INDEX "tasks_conditionId_idx" ON "tasks"("conditionId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "task_completions_taskId_idx" ON "task_completions"("taskId");

-- CreateIndex
CREATE INDEX "task_completions_personId_idx" ON "task_completions"("personId");

-- CreateIndex
CREATE INDEX "task_completions_completedAt_idx" ON "task_completions"("completedAt");

-- CreateIndex
CREATE INDEX "goals_roleId_idx" ON "goals"("roleId");

-- CreateIndex
CREATE INDEX "goals_status_idx" ON "goals"("status");

-- CreateIndex
CREATE INDEX "goal_task_links_goalId_idx" ON "goal_task_links"("goalId");

-- CreateIndex
CREATE INDEX "goal_task_links_taskId_idx" ON "goal_task_links"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "goal_task_links_goalId_taskId_key" ON "goal_task_links"("goalId", "taskId");

-- CreateIndex
CREATE INDEX "goal_routine_links_goalId_idx" ON "goal_routine_links"("goalId");

-- CreateIndex
CREATE INDEX "goal_routine_links_routineId_idx" ON "goal_routine_links"("routineId");

-- CreateIndex
CREATE UNIQUE INDEX "goal_routine_links_goalId_routineId_key" ON "goal_routine_links"("goalId", "routineId");

-- CreateIndex
CREATE INDEX "conditions_routineId_idx" ON "conditions"("routineId");

-- CreateIndex
CREATE INDEX "conditions_controlsRoutine_idx" ON "conditions"("controlsRoutine");

-- CreateIndex
CREATE INDEX "condition_checks_conditionId_idx" ON "condition_checks"("conditionId");

-- CreateIndex
CREATE INDEX "condition_checks_targetTaskId_idx" ON "condition_checks"("targetTaskId");

-- CreateIndex
CREATE INDEX "condition_checks_targetRoutineId_idx" ON "condition_checks"("targetRoutineId");

-- CreateIndex
CREATE INDEX "condition_checks_targetGoalId_idx" ON "condition_checks"("targetGoalId");

-- CreateIndex
CREATE INDEX "visibility_overrides_routineId_idx" ON "visibility_overrides"("routineId");

-- CreateIndex
CREATE INDEX "visibility_overrides_expiresAt_idx" ON "visibility_overrides"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "codes_code_key" ON "codes"("code");

-- CreateIndex
CREATE INDEX "codes_code_idx" ON "codes"("code");

-- CreateIndex
CREATE INDEX "codes_roleId_idx" ON "codes"("roleId");

-- CreateIndex
CREATE INDEX "codes_groupId_idx" ON "codes"("groupId");

-- CreateIndex
CREATE INDEX "codes_personId_idx" ON "codes"("personId");

-- CreateIndex
CREATE INDEX "codes_status_idx" ON "codes"("status");

-- CreateIndex
CREATE INDEX "codes_expiresAt_idx" ON "codes"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "connection_codes_code_key" ON "connection_codes"("code");

-- CreateIndex
CREATE INDEX "connection_codes_code_idx" ON "connection_codes"("code");

-- CreateIndex
CREATE INDEX "connection_codes_teacherRoleId_idx" ON "connection_codes"("teacherRoleId");

-- CreateIndex
CREATE INDEX "connection_codes_studentPersonId_idx" ON "connection_codes"("studentPersonId");

-- CreateIndex
CREATE INDEX "connection_codes_status_idx" ON "connection_codes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_inviteeEmail_idx" ON "invitations"("inviteeEmail");

-- CreateIndex
CREATE INDEX "invitations_status_idx" ON "invitations"("status");

-- CreateIndex
CREATE INDEX "co_parents_primaryRoleId_idx" ON "co_parents"("primaryRoleId");

-- CreateIndex
CREATE INDEX "co_parents_coParentRoleId_idx" ON "co_parents"("coParentRoleId");

-- CreateIndex
CREATE INDEX "co_parents_status_idx" ON "co_parents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "co_parents_primaryRoleId_coParentRoleId_key" ON "co_parents"("primaryRoleId", "coParentRoleId");

-- CreateIndex
CREATE INDEX "co_teachers_groupId_idx" ON "co_teachers"("groupId");

-- CreateIndex
CREATE INDEX "co_teachers_primaryTeacherRoleId_idx" ON "co_teachers"("primaryTeacherRoleId");

-- CreateIndex
CREATE INDEX "co_teachers_coTeacherRoleId_idx" ON "co_teachers"("coTeacherRoleId");

-- CreateIndex
CREATE INDEX "co_teachers_status_idx" ON "co_teachers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "co_teachers_groupId_coTeacherRoleId_key" ON "co_teachers"("groupId", "coTeacherRoleId");

-- CreateIndex
CREATE INDEX "student_parent_connections_teacherRoleId_idx" ON "student_parent_connections"("teacherRoleId");

-- CreateIndex
CREATE INDEX "student_parent_connections_studentPersonId_idx" ON "student_parent_connections"("studentPersonId");

-- CreateIndex
CREATE INDEX "student_parent_connections_parentRoleId_idx" ON "student_parent_connections"("parentRoleId");

-- CreateIndex
CREATE INDEX "student_parent_connections_parentPersonId_idx" ON "student_parent_connections"("parentPersonId");

-- CreateIndex
CREATE INDEX "student_parent_connections_status_idx" ON "student_parent_connections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_parent_connections_studentPersonId_parentPersonId_key" ON "student_parent_connections"("studentPersonId", "parentPersonId");

-- CreateIndex
CREATE INDEX "school_members_schoolId_idx" ON "school_members"("schoolId");

-- CreateIndex
CREATE INDEX "school_members_roleId_idx" ON "school_members"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "school_members_schoolId_roleId_key" ON "school_members"("schoolId", "roleId");

-- CreateIndex
CREATE INDEX "marketplace_items_authorRoleId_idx" ON "marketplace_items"("authorRoleId");

-- CreateIndex
CREATE INDEX "marketplace_items_type_idx" ON "marketplace_items"("type");

-- CreateIndex
CREATE INDEX "marketplace_items_visibility_idx" ON "marketplace_items"("visibility");

-- CreateIndex
CREATE INDEX "marketplace_items_category_idx" ON "marketplace_items"("category");

-- CreateIndex
CREATE INDEX "marketplace_items_rating_idx" ON "marketplace_items"("rating");

-- CreateIndex
CREATE INDEX "marketplace_ratings_marketplaceItemId_idx" ON "marketplace_ratings"("marketplaceItemId");

-- CreateIndex
CREATE INDEX "marketplace_ratings_userId_idx" ON "marketplace_ratings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_ratings_marketplaceItemId_userId_key" ON "marketplace_ratings"("marketplaceItemId", "userId");

-- CreateIndex
CREATE INDEX "marketplace_comments_marketplaceItemId_idx" ON "marketplace_comments"("marketplaceItemId");

-- CreateIndex
CREATE INDEX "marketplace_comments_userId_idx" ON "marketplace_comments"("userId");

-- CreateIndex
CREATE INDEX "marketplace_comments_status_idx" ON "marketplace_comments"("status");

-- CreateIndex
CREATE INDEX "comment_flags_commentId_idx" ON "comment_flags"("commentId");

-- CreateIndex
CREATE INDEX "comment_flags_userId_idx" ON "comment_flags"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_flags_commentId_userId_key" ON "comment_flags"("commentId", "userId");

-- CreateIndex
CREATE INDEX "verification_codes_userId_idx" ON "verification_codes"("userId");

-- CreateIndex
CREATE INDEX "verification_codes_email_idx" ON "verification_codes"("email");

-- CreateIndex
CREATE INDEX "verification_codes_code_idx" ON "verification_codes"("code");

-- CreateIndex
CREATE INDEX "verification_codes_expiresAt_idx" ON "verification_codes"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_task_links" ADD CONSTRAINT "goal_task_links_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_task_links" ADD CONSTRAINT "goal_task_links_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_routine_links" ADD CONSTRAINT "goal_routine_links_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_routine_links" ADD CONSTRAINT "goal_routine_links_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condition_checks" ADD CONSTRAINT "condition_checks_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condition_checks" ADD CONSTRAINT "condition_checks_targetTaskId_fkey" FOREIGN KEY ("targetTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condition_checks" ADD CONSTRAINT "condition_checks_targetRoutineId_fkey" FOREIGN KEY ("targetRoutineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condition_checks" ADD CONSTRAINT "condition_checks_targetGoalId_fkey" FOREIGN KEY ("targetGoalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visibility_overrides" ADD CONSTRAINT "visibility_overrides_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codes" ADD CONSTRAINT "codes_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codes" ADD CONSTRAINT "codes_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codes" ADD CONSTRAINT "codes_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_codes" ADD CONSTRAINT "connection_codes_teacherRoleId_fkey" FOREIGN KEY ("teacherRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_codes" ADD CONSTRAINT "connection_codes_studentPersonId_fkey" FOREIGN KEY ("studentPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviterUserId_fkey" FOREIGN KEY ("inviterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviterRoleId_fkey" FOREIGN KEY ("inviterRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_parents" ADD CONSTRAINT "co_parents_primaryRoleId_fkey" FOREIGN KEY ("primaryRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_parents" ADD CONSTRAINT "co_parents_coParentRoleId_fkey" FOREIGN KEY ("coParentRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_teachers" ADD CONSTRAINT "co_teachers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_teachers" ADD CONSTRAINT "co_teachers_primaryTeacherRoleId_fkey" FOREIGN KEY ("primaryTeacherRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_teachers" ADD CONSTRAINT "co_teachers_coTeacherRoleId_fkey" FOREIGN KEY ("coTeacherRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parent_connections" ADD CONSTRAINT "student_parent_connections_teacherRoleId_fkey" FOREIGN KEY ("teacherRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parent_connections" ADD CONSTRAINT "student_parent_connections_studentPersonId_fkey" FOREIGN KEY ("studentPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parent_connections" ADD CONSTRAINT "student_parent_connections_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parent_connections" ADD CONSTRAINT "student_parent_connections_parentPersonId_fkey" FOREIGN KEY ("parentPersonId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_members" ADD CONSTRAINT "school_members_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_members" ADD CONSTRAINT "school_members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_items" ADD CONSTRAINT "marketplace_items_authorRoleId_fkey" FOREIGN KEY ("authorRoleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_ratings" ADD CONSTRAINT "marketplace_ratings_marketplaceItemId_fkey" FOREIGN KEY ("marketplaceItemId") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_ratings" ADD CONSTRAINT "marketplace_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_comments" ADD CONSTRAINT "marketplace_comments_marketplaceItemId_fkey" FOREIGN KEY ("marketplaceItemId") REFERENCES "marketplace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_comments" ADD CONSTRAINT "marketplace_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_flags" ADD CONSTRAINT "comment_flags_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "marketplace_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_flags" ADD CONSTRAINT "comment_flags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

