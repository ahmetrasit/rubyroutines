-- Ruby Routines - Create Tables
-- Run this in Supabase SQL Editor BEFORE applying RLS policies

-- Drop existing tables if any (be careful!)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- Create ENUMS
CREATE TYPE "RoleType" AS ENUM ('PARENT', 'TEACHER', 'PRINCIPAL', 'SUPPORT');
CREATE TYPE "Tier" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'SCHOOL');
CREATE TYPE "GroupType" AS ENUM ('FAMILY', 'CLASSROOM', 'CUSTOM');
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "RoutineType" AS ENUM ('REGULAR', 'SMART', 'TEACHER_CLASSROOM');
CREATE TYPE "ResetPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');
CREATE TYPE "Visibility" AS ENUM ('ALWAYS', 'DATE_RANGE', 'DAYS_OF_WEEK', 'CONDITIONAL');
CREATE TYPE "TaskType" AS ENUM ('SIMPLE', 'MULTIPLE_CHECKIN', 'PROGRESS', 'SMART');
CREATE TYPE "ConditionType" AS ENUM ('TASK_COMPLETED', 'ROUTINE_COMPLETED', 'TASK_COUNT', 'GOAL_ACHIEVED', 'DATE_RANGE', 'DAY_OF_WEEK');
CREATE TYPE "ConditionOperator" AS ENUM ('EQUALS', 'GREATER_THAN', 'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL', 'BETWEEN');
CREATE TYPE "CodeType" AS ENUM ('KIOSK', 'EMAIL_VERIFICATION');
CREATE TYPE "CodeStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');
CREATE TYPE "InvitationType" AS ENUM ('CO_PARENT', 'CO_TEACHER', 'SCHOOL_TEACHER', 'SCHOOL_SUPPORT');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type "RoleType" NOT NULL,
  tier "Tier" NOT NULL DEFAULT 'FREE',
  "stripeCustomerId" TEXT UNIQUE,
  "stripeSubscriptionId" TEXT UNIQUE,
  "subscriptionStatus" TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", type)
);

CREATE INDEX idx_roles_userId ON roles("userId");
CREATE INDEX idx_roles_type ON roles(type);

-- Persons table
CREATE TABLE persons (
  id TEXT PRIMARY KEY,
  "roleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "birthDate" TIMESTAMPTZ,
  avatar TEXT,
  notes TEXT,
  status "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_persons_roleId ON persons("roleId");
CREATE INDEX idx_persons_status ON persons(status);

-- Groups table
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  "roleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type "GroupType" NOT NULL DEFAULT 'FAMILY',
  "isClassroom" BOOLEAN NOT NULL DEFAULT false,
  status "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_roleId ON groups("roleId");
CREATE INDEX idx_groups_type ON groups(type);
CREATE INDEX idx_groups_status ON groups(status);

-- Group members table
CREATE TABLE group_members (
  id TEXT PRIMARY KEY,
  "groupId" TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  "personId" TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("groupId", "personId")
);

CREATE INDEX idx_group_members_groupId ON group_members("groupId");
CREATE INDEX idx_group_members_personId ON group_members("personId");

-- Routines table
CREATE TABLE routines (
  id TEXT PRIMARY KEY,
  "roleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type "RoutineType" NOT NULL DEFAULT 'REGULAR',
  "resetPeriod" "ResetPeriod" NOT NULL DEFAULT 'DAILY',
  "resetDay" INTEGER,
  visibility "Visibility" NOT NULL DEFAULT 'ALWAYS',
  "visibleDays" INTEGER[] NOT NULL DEFAULT '{}',
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  status "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" TIMESTAMPTZ,
  "sourceMarketplaceItemId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routines_roleId ON routines("roleId");
CREATE INDEX idx_routines_type ON routines(type);
CREATE INDEX idx_routines_status ON routines(status);

-- Routine assignments table
CREATE TABLE routine_assignments (
  id TEXT PRIMARY KEY,
  "routineId" TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  "personId" TEXT REFERENCES persons(id) ON DELETE CASCADE,
  "groupId" TEXT REFERENCES groups(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routine_assignments_routineId ON routine_assignments("routineId");
CREATE INDEX idx_routine_assignments_personId ON routine_assignments("personId");
CREATE INDEX idx_routine_assignments_groupId ON routine_assignments("groupId");

-- Tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  "routineId" TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type "TaskType" NOT NULL DEFAULT 'SIMPLE',
  "order" INTEGER NOT NULL DEFAULT 0,
  "targetValue" DOUBLE PRECISION,
  unit TEXT,
  status "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_routineId ON tasks("routineId");
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Task completions table
CREATE TABLE task_completions (
  id TEXT PRIMARY KEY,
  "taskId" TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  "personId" TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  "completedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  value TEXT,
  notes TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_completions_taskId ON task_completions("taskId");
CREATE INDEX idx_task_completions_personId ON task_completions("personId");
CREATE INDEX idx_task_completions_completedAt ON task_completions("completedAt");

-- Goals table
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  "roleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target DOUBLE PRECISION NOT NULL,
  period "ResetPeriod" NOT NULL DEFAULT 'WEEKLY',
  "resetDay" INTEGER,
  "personIds" TEXT[] NOT NULL DEFAULT '{}',
  "groupIds" TEXT[] NOT NULL DEFAULT '{}',
  status "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" TIMESTAMPTZ,
  "sourceMarketplaceItemId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_roleId ON goals("roleId");
CREATE INDEX idx_goals_status ON goals(status);

-- Goal task links table
CREATE TABLE goal_task_links (
  id TEXT PRIMARY KEY,
  "goalId" TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  "taskId" TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("goalId", "taskId")
);

CREATE INDEX idx_goal_task_links_goalId ON goal_task_links("goalId");
CREATE INDEX idx_goal_task_links_taskId ON goal_task_links("taskId");

-- Goal routine links table
CREATE TABLE goal_routine_links (
  id TEXT PRIMARY KEY,
  "goalId" TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  "routineId" TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("goalId", "routineId")
);

CREATE INDEX idx_goal_routine_links_goalId ON goal_routine_links("goalId");
CREATE INDEX idx_goal_routine_links_routineId ON goal_routine_links("routineId");

-- Conditions table
CREATE TABLE conditions (
  id TEXT PRIMARY KEY,
  "routineId" TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  type "ConditionType" NOT NULL,
  operator "ConditionOperator" NOT NULL,
  value TEXT,
  "targetTaskId" TEXT REFERENCES tasks(id),
  "targetRoutineId" TEXT REFERENCES routines(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conditions_routineId ON conditions("routineId");
CREATE INDEX idx_conditions_targetTaskId ON conditions("targetTaskId");
CREATE INDEX idx_conditions_targetRoutineId ON conditions("targetRoutineId");

-- Codes table
CREATE TABLE codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  "roleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  type "CodeType" NOT NULL DEFAULT 'KIOSK',
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ,
  status "CodeStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_codes_code ON codes(code);
CREATE INDEX idx_codes_roleId ON codes("roleId");
CREATE INDEX idx_codes_status ON codes(status);
CREATE INDEX idx_codes_expiresAt ON codes("expiresAt");

-- Connection codes table
CREATE TABLE connection_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  "teacherRoleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  "studentPersonId" TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ,
  status "CodeStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_connection_codes_code ON connection_codes(code);
CREATE INDEX idx_connection_codes_teacherRoleId ON connection_codes("teacherRoleId");
CREATE INDEX idx_connection_codes_studentPersonId ON connection_codes("studentPersonId");
CREATE INDEX idx_connection_codes_status ON connection_codes(status);

-- Invitations table
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  "inviterUserId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "inviterRoleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  "inviteeEmail" TEXT NOT NULL,
  type "InvitationType" NOT NULL,
  permissions TEXT NOT NULL DEFAULT 'READ_ONLY',
  "personIds" TEXT[] NOT NULL DEFAULT '{}',
  "groupIds" TEXT[] NOT NULL DEFAULT '{}',
  "expiresAt" TIMESTAMPTZ NOT NULL,
  status "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "acceptedAt" TIMESTAMPTZ,
  "acceptedByUserId" TEXT REFERENCES users(id),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_inviteeEmail ON invitations("inviteeEmail");
CREATE INDEX idx_invitations_status ON invitations(status);

-- Co-parents table
CREATE TABLE co_parents (
  id TEXT PRIMARY KEY,
  "primaryRoleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  "coParentRoleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permissions TEXT NOT NULL DEFAULT 'READ_ONLY',
  "personIds" TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("primaryRoleId", "coParentRoleId")
);

CREATE INDEX idx_co_parents_primaryRoleId ON co_parents("primaryRoleId");
CREATE INDEX idx_co_parents_coParentRoleId ON co_parents("coParentRoleId");
CREATE INDEX idx_co_parents_status ON co_parents(status);

-- Co-teachers table
CREATE TABLE co_teachers (
  id TEXT PRIMARY KEY,
  "groupId" TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  "primaryTeacherRoleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  "coTeacherRoleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permissions TEXT NOT NULL DEFAULT 'VIEW',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("groupId", "coTeacherRoleId")
);

CREATE INDEX idx_co_teachers_groupId ON co_teachers("groupId");
CREATE INDEX idx_co_teachers_primaryTeacherRoleId ON co_teachers("primaryTeacherRoleId");
CREATE INDEX idx_co_teachers_coTeacherRoleId ON co_teachers("coTeacherRoleId");
CREATE INDEX idx_co_teachers_status ON co_teachers(status);

-- Student parent connections table
CREATE TABLE student_parent_connections (
  id TEXT PRIMARY KEY,
  "teacherRoleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  "studentPersonId" TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  "parentRoleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  "parentPersonId" TEXT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  permissions TEXT NOT NULL DEFAULT 'TASK_COMPLETION',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("studentPersonId", "parentPersonId")
);

CREATE INDEX idx_student_parent_connections_teacherRoleId ON student_parent_connections("teacherRoleId");
CREATE INDEX idx_student_parent_connections_studentPersonId ON student_parent_connections("studentPersonId");
CREATE INDEX idx_student_parent_connections_parentRoleId ON student_parent_connections("parentRoleId");
CREATE INDEX idx_student_parent_connections_parentPersonId ON student_parent_connections("parentPersonId");
CREATE INDEX idx_student_parent_connections_status ON student_parent_connections(status);

-- Schools table
CREATE TABLE schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- School members table
CREATE TABLE school_members (
  id TEXT PRIMARY KEY,
  "schoolId" TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  "roleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'TEACHER',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("schoolId", "roleId")
);

CREATE INDEX idx_school_members_schoolId ON school_members("schoolId");
CREATE INDEX idx_school_members_roleId ON school_members("roleId");

-- Marketplace items table
CREATE TABLE marketplace_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "authorRoleId" TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'PUBLIC',
  category TEXT,
  "ageGroup" TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  version TEXT NOT NULL DEFAULT '1.0.0',
  content TEXT NOT NULL,
  rating DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "forkCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marketplace_items_authorRoleId ON marketplace_items("authorRoleId");
CREATE INDEX idx_marketplace_items_type ON marketplace_items(type);
CREATE INDEX idx_marketplace_items_visibility ON marketplace_items(visibility);
CREATE INDEX idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX idx_marketplace_items_rating ON marketplace_items(rating);

-- Marketplace ratings table
CREATE TABLE marketplace_ratings (
  id TEXT PRIMARY KEY,
  "marketplaceItemId" TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("marketplaceItemId", "userId")
);

CREATE INDEX idx_marketplace_ratings_marketplaceItemId ON marketplace_ratings("marketplaceItemId");
CREATE INDEX idx_marketplace_ratings_userId ON marketplace_ratings("userId");

-- Marketplace comments table
CREATE TABLE marketplace_comments (
  id TEXT PRIMARY KEY,
  "marketplaceItemId" TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marketplace_comments_marketplaceItemId ON marketplace_comments("marketplaceItemId");
CREATE INDEX idx_marketplace_comments_userId ON marketplace_comments("userId");
CREATE INDEX idx_marketplace_comments_status ON marketplace_comments(status);

-- Comment flags table
CREATE TABLE comment_flags (
  id TEXT PRIMARY KEY,
  "commentId" TEXT NOT NULL REFERENCES marketplace_comments(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("commentId", "userId")
);

CREATE INDEX idx_comment_flags_commentId ON comment_flags("commentId");
CREATE INDEX idx_comment_flags_userId ON comment_flags("userId");

-- Verification codes table
CREATE TABLE verification_codes (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'EMAIL_VERIFICATION',
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_codes_userId ON verification_codes("userId");
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
CREATE INDEX idx_verification_codes_expiresAt ON verification_codes("expiresAt");
