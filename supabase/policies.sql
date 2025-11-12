-- Ruby Routines - Row Level Security (RLS) Policies
-- Version: 1.0
-- Database: PostgreSQL 15 (Supabase)
--
-- INSTRUCTIONS:
-- 1. Run this SQL in Supabase SQL Editor (Dashboard > SQL Editor)
-- 2. This will enable RLS and create all security policies
-- 3. Run AFTER creating tables with Prisma (npx prisma db push)

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_routine_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parent_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can read their own data
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid()::text = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id);

-- Anyone can insert (for signup)
CREATE POLICY "Anyone can sign up"
ON users FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- ROLES TABLE POLICIES
-- ============================================================================

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON roles FOR SELECT
USING (auth.uid()::text = "userId");

-- Users can create their own roles
CREATE POLICY "Users can create own roles"
ON roles FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Users can update their own roles
CREATE POLICY "Users can update own roles"
ON roles FOR UPDATE
USING (auth.uid()::text = "userId");

-- Users cannot delete roles (soft delete only)

-- ============================================================================
-- PERSONS TABLE POLICIES
-- ============================================================================

-- Users can view persons they own
CREATE POLICY "Users can view own persons"
ON persons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = persons."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Co-parents can view shared persons
CREATE POLICY "Co-parents can view shared persons"
ON persons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM co_parents cp
    INNER JOIN roles r ON r.id = cp."coParentRoleId"
    WHERE cp.status = 'ACTIVE'
      AND cp."primaryRoleId" = persons."roleId"
      AND r."userId" = auth.uid()::text
      AND persons.id = ANY(cp."personIds")
  )
);

-- Parents connected to students can view those students
CREATE POLICY "Parents can view connected students"
ON persons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_parent_connections spc
    INNER JOIN roles r ON r.id = spc."parentRoleId"
    WHERE spc.status = 'ACTIVE'
      AND spc."studentPersonId" = persons.id
      AND r."userId" = auth.uid()::text
  )
);

-- Users can create persons for their own roles
CREATE POLICY "Users can create own persons"
ON persons FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = persons."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Users can update their own persons
CREATE POLICY "Users can update own persons"
ON persons FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = persons."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Co-parents with FULL_EDIT can update shared persons
CREATE POLICY "Co-parents with full edit can update persons"
ON persons FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM co_parents cp
    INNER JOIN roles r ON r.id = cp."coParentRoleId"
    WHERE cp.status = 'ACTIVE'
      AND cp.permissions = 'FULL_EDIT'
      AND cp."primaryRoleId" = persons."roleId"
      AND r."userId" = auth.uid()::text
      AND persons.id = ANY(cp."personIds")
  )
);

-- ============================================================================
-- GROUPS TABLE POLICIES
-- ============================================================================

-- Users can view their own groups
CREATE POLICY "Users can view own groups"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = groups."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Co-teachers can view shared groups
CREATE POLICY "Co-teachers can view shared groups"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM co_teachers ct
    INNER JOIN roles r ON r.id = ct."coTeacherRoleId"
    WHERE ct.status = 'ACTIVE'
      AND ct."groupId" = groups.id
      AND r."userId" = auth.uid()::text
  )
);

-- Users can create groups for their own roles
CREATE POLICY "Users can create own groups"
ON groups FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = groups."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Users can update their own groups
CREATE POLICY "Users can update own groups"
ON groups FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = groups."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Co-teachers with FULL_EDIT can update shared groups
CREATE POLICY "Co-teachers with full edit can update groups"
ON groups FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM co_teachers ct
    INNER JOIN roles r ON r.id = ct."coTeacherRoleId"
    WHERE ct.status = 'ACTIVE'
      AND ct.permissions = 'FULL_EDIT'
      AND ct."groupId" = groups.id
      AND r."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- GROUP_MEMBERS TABLE POLICIES
-- ============================================================================

-- Users can view group members for their own groups
CREATE POLICY "Users can view own group members"
ON group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups g
    INNER JOIN roles r ON r.id = g."roleId"
    WHERE g.id = group_members."groupId"
      AND r."userId" = auth.uid()::text
  )
);

-- Users can create group members for their own groups
CREATE POLICY "Users can create own group members"
ON group_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups g
    INNER JOIN roles r ON r.id = g."roleId"
    WHERE g.id = group_members."groupId"
      AND r."userId" = auth.uid()::text
  )
);

-- Users can delete group members from their own groups
CREATE POLICY "Users can delete own group members"
ON group_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM groups g
    INNER JOIN roles r ON r.id = g."roleId"
    WHERE g.id = group_members."groupId"
      AND r."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- ROUTINES TABLE POLICIES
-- ============================================================================

-- Users can view their own routines
CREATE POLICY "Users can view own routines"
ON routines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = routines."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Co-teachers can view routines for shared groups
CREATE POLICY "Co-teachers can view shared routines"
ON routines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM routine_assignments ra
    INNER JOIN co_teachers ct ON ct."groupId" = ra."groupId"
    INNER JOIN roles r ON r.id = ct."coTeacherRoleId"
    WHERE ct.status = 'ACTIVE'
      AND ra."routineId" = routines.id
      AND r."userId" = auth.uid()::text
  )
);

-- Parents can view routines for connected students
CREATE POLICY "Parents can view connected student routines"
ON routines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM routine_assignments ra
    INNER JOIN student_parent_connections spc ON spc."studentPersonId" = ra."personId"
    INNER JOIN roles r ON r.id = spc."parentRoleId"
    WHERE spc.status = 'ACTIVE'
      AND ra."routineId" = routines.id
      AND r."userId" = auth.uid()::text
  )
);

-- Users can create routines for their own roles
CREATE POLICY "Users can create own routines"
ON routines FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = routines."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Users can update their own routines
CREATE POLICY "Users can update own routines"
ON routines FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = routines."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Co-parents with FULL_EDIT can create/update routines
CREATE POLICY "Co-parents with full edit can manage routines"
ON routines FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM co_parents cp
    INNER JOIN roles r ON r.id = cp."coParentRoleId"
    WHERE cp.status = 'ACTIVE'
      AND cp.permissions = 'FULL_EDIT'
      AND cp."primaryRoleId" = routines."roleId"
      AND r."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- TASKS TABLE POLICIES
-- ============================================================================

-- Users can view tasks for their own routines
CREATE POLICY "Users can view own tasks"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE rt.id = tasks."routineId"
      AND r."userId" = auth.uid()::text
  )
);

-- Co-teachers can view tasks for shared routines
CREATE POLICY "Co-teachers can view shared tasks"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN routine_assignments ra ON ra."routineId" = rt.id
    INNER JOIN co_teachers ct ON ct."groupId" = ra."groupId"
    INNER JOIN roles r ON r.id = ct."coTeacherRoleId"
    WHERE ct.status = 'ACTIVE'
      AND tasks."routineId" = rt.id
      AND r."userId" = auth.uid()::text
  )
);

-- Parents can view tasks for connected students
CREATE POLICY "Parents can view connected student tasks"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN routine_assignments ra ON ra."routineId" = rt.id
    INNER JOIN student_parent_connections spc ON spc."studentPersonId" = ra."personId"
    INNER JOIN roles r ON r.id = spc."parentRoleId"
    WHERE spc.status = 'ACTIVE'
      AND tasks."routineId" = rt.id
      AND r."userId" = auth.uid()::text
  )
);

-- Users can create tasks for their own routines
CREATE POLICY "Users can create own tasks"
ON tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE rt.id = tasks."routineId"
      AND r."userId" = auth.uid()::text
  )
);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
ON tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE rt.id = tasks."routineId"
      AND r."userId" = auth.uid()::text
  )
);

-- Co-teachers with EDIT_TASKS can create/update tasks
CREATE POLICY "Co-teachers with edit tasks can manage tasks"
ON tasks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN routine_assignments ra ON ra."routineId" = rt.id
    INNER JOIN co_teachers ct ON ct."groupId" = ra."groupId"
    INNER JOIN roles r ON r.id = ct."coTeacherRoleId"
    WHERE ct.status = 'ACTIVE'
      AND ct.permissions IN ('EDIT_TASKS', 'FULL_EDIT')
      AND tasks."routineId" = rt.id
      AND r."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- TASK_COMPLETIONS TABLE POLICIES
-- ============================================================================

-- Users can view completions for their own tasks
CREATE POLICY "Users can view own task completions"
ON task_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    INNER JOIN routines rt ON rt.id = t."routineId"
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE t.id = task_completions."taskId"
      AND r."userId" = auth.uid()::text
  )
);

-- Parents can view completions for connected students
CREATE POLICY "Parents can view connected student completions"
ON task_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_parent_connections spc
    INNER JOIN roles r ON r.id = spc."parentRoleId"
    WHERE spc.status = 'ACTIVE'
      AND spc."studentPersonId" = task_completions."personId"
      AND r."userId" = auth.uid()::text
  )
);

-- Users can create completions for their own tasks
CREATE POLICY "Users can create own task completions"
ON task_completions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    INNER JOIN routines rt ON rt.id = t."routineId"
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE t.id = task_completions."taskId"
      AND r."userId" = auth.uid()::text
  )
);

-- Co-parents with TASK_COMPLETION or FULL_EDIT can create completions
CREATE POLICY "Co-parents can create task completions"
ON task_completions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    INNER JOIN routines rt ON rt.id = t."routineId"
    INNER JOIN co_parents cp ON cp."primaryRoleId" = rt."roleId"
    INNER JOIN roles r ON r.id = cp."coParentRoleId"
    WHERE cp.status = 'ACTIVE'
      AND cp.permissions IN ('TASK_COMPLETION', 'FULL_EDIT')
      AND t.id = task_completions."taskId"
      AND task_completions."personId" = ANY(cp."personIds")
      AND r."userId" = auth.uid()::text
  )
);

-- Parents can create completions for connected students (if permission granted)
CREATE POLICY "Parents can create completions for connected students"
ON task_completions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM student_parent_connections spc
    INNER JOIN roles r ON r.id = spc."parentRoleId"
    WHERE spc.status = 'ACTIVE'
      AND spc.permissions IN ('TASK_COMPLETION', 'FULL_EDIT')
      AND spc."studentPersonId" = task_completions."personId"
      AND r."userId" = auth.uid()::text
  )
);

-- Users can delete completions within 5 minutes (for undo)
CREATE POLICY "Users can delete recent own completions"
ON task_completions FOR DELETE
USING (
  task_completions."createdAt" > (NOW() - INTERVAL '5 minutes')
  AND EXISTS (
    SELECT 1 FROM tasks t
    INNER JOIN routines rt ON rt.id = t."routineId"
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE t.id = task_completions."taskId"
      AND r."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- GOALS TABLE POLICIES
-- ============================================================================

-- Users can view their own goals
CREATE POLICY "Users can view own goals"
ON goals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = goals."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Users can create their own goals
CREATE POLICY "Users can create own goals"
ON goals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = goals."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Users can update their own goals
CREATE POLICY "Users can update own goals"
ON goals FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = goals."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- MARKETPLACE POLICIES
-- ============================================================================

-- Everyone can view PUBLIC marketplace items
CREATE POLICY "Anyone can view public marketplace items"
ON marketplace_items FOR SELECT
USING (visibility = 'PUBLIC' OR visibility = 'UNLISTED');

-- Users can view their own marketplace items (including PRIVATE)
CREATE POLICY "Users can view own marketplace items"
ON marketplace_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = marketplace_items."authorRoleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Users can create marketplace items for their own roles
CREATE POLICY "Users can create marketplace items"
ON marketplace_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = marketplace_items."authorRoleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Users can update their own marketplace items
CREATE POLICY "Users can update own marketplace items"
ON marketplace_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = marketplace_items."authorRoleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Users can rate PUBLIC marketplace items
CREATE POLICY "Users can rate marketplace items"
ON marketplace_ratings FOR ALL
USING (
  auth.uid()::text = "userId"
  AND EXISTS (
    SELECT 1 FROM marketplace_items
    WHERE marketplace_items.id = marketplace_ratings."marketplaceItemId"
      AND marketplace_items.visibility = 'PUBLIC'
  )
);

-- Users can comment on PUBLIC marketplace items
CREATE POLICY "Users can comment on marketplace items"
ON marketplace_comments FOR ALL
USING (
  auth.uid()::text = "userId"
  OR EXISTS (
    SELECT 1 FROM marketplace_items
    WHERE marketplace_items.id = marketplace_comments."marketplaceItemId"
      AND marketplace_items."authorRoleId" IN (
        SELECT id FROM roles WHERE "userId" = auth.uid()::text
      )
  )
);

-- Users can flag inappropriate comments
CREATE POLICY "Users can flag comments"
ON comment_flags FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- ============================================================================
-- INVITATIONS & SHARING POLICIES
-- ============================================================================

-- Users can view invitations they sent
CREATE POLICY "Users can view sent invitations"
ON invitations FOR SELECT
USING (auth.uid()::text = "inviterUserId");

-- Users can view invitations sent to their email
CREATE POLICY "Users can view received invitations"
ON invitations FOR SELECT
USING (
  "inviteeEmail" IN (
    SELECT email FROM users WHERE id = auth.uid()::text
  )
);

-- Users can create invitations for their own roles
CREATE POLICY "Users can create invitations"
ON invitations FOR INSERT
WITH CHECK (auth.uid()::text = "inviterUserId");

-- Users can update invitations they received (to accept/reject)
CREATE POLICY "Users can update received invitations"
ON invitations FOR UPDATE
USING (
  "inviteeEmail" IN (
    SELECT email FROM users WHERE id = auth.uid()::text
  )
);

-- Co-parent policies
CREATE POLICY "Users can view their co-parent relationships"
ON co_parents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE (roles.id = co_parents."primaryRoleId" OR roles.id = co_parents."coParentRoleId")
      AND roles."userId" = auth.uid()::text
  )
);

CREATE POLICY "Primary parents can manage co-parents"
ON co_parents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = co_parents."primaryRoleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Co-teacher policies
CREATE POLICY "Teachers can view their co-teacher relationships"
ON co_teachers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE (roles.id = co_teachers."primaryTeacherRoleId" OR roles.id = co_teachers."coTeacherRoleId")
      AND roles."userId" = auth.uid()::text
  )
);

CREATE POLICY "Primary teachers can manage co-teachers"
ON co_teachers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = co_teachers."primaryTeacherRoleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Student-parent connection policies
CREATE POLICY "Teachers and parents can view connections"
ON student_parent_connections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE (roles.id = student_parent_connections."teacherRoleId" OR roles.id = student_parent_connections."parentRoleId")
      AND roles."userId" = auth.uid()::text
  )
);

CREATE POLICY "Teachers can create connections"
ON student_parent_connections FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = student_parent_connections."teacherRoleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- CODES & VERIFICATION
-- ============================================================================

-- Users can view codes for their own roles (kiosk codes)
CREATE POLICY "Users can view own codes"
ON codes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = codes."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Users can create codes for their own roles
CREATE POLICY "Users can create own codes"
ON codes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = codes."roleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Connection codes (6-digit for student-parent)
CREATE POLICY "Teachers can manage connection codes"
ON connection_codes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = connection_codes."teacherRoleId"
      AND roles."userId" = auth.uid()::text
  )
);

-- Verification codes
CREATE POLICY "Users can view own verification codes"
ON verification_codes FOR SELECT
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create verification codes"
ON verification_codes FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own verification codes"
ON verification_codes FOR UPDATE
USING (auth.uid()::text = "userId");

-- ============================================================================
-- SCHOOL MODE POLICIES
-- ============================================================================

-- School members can view their schools
CREATE POLICY "School members can view their schools"
ON schools FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM school_members sm
    INNER JOIN roles r ON r.id = sm."roleId"
    WHERE sm."schoolId" = schools.id
      AND r."userId" = auth.uid()::text
  )
);

-- Principals can create schools
CREATE POLICY "Principals can create schools"
ON schools FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.type = 'PRINCIPAL'
      AND roles."userId" = auth.uid()::text
  )
);

-- Principals can update their schools
CREATE POLICY "Principals can update their schools"
ON schools FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM school_members sm
    INNER JOIN roles r ON r.id = sm."roleId"
    WHERE sm."schoolId" = schools.id
      AND sm.role = 'PRINCIPAL'
      AND r."userId" = auth.uid()::text
  )
);

-- School members policies
CREATE POLICY "School members can view membership"
ON school_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.id = school_members."roleId"
      AND roles."userId" = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM school_members sm2
    INNER JOIN roles r ON r.id = sm2."roleId"
    WHERE sm2."schoolId" = school_members."schoolId"
      AND r."userId" = auth.uid()::text
  )
);

CREATE POLICY "Principals can manage school members"
ON school_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM school_members sm
    INNER JOIN roles r ON r.id = sm."roleId"
    WHERE sm."schoolId" = school_members."schoolId"
      AND sm.role = 'PRINCIPAL'
      AND r."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- HELPER FUNCTION FOR CONDITIONS
-- ============================================================================

-- Users can view conditions for their own routines
CREATE POLICY "Users can view own conditions"
ON conditions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE rt.id = conditions."routineId"
      AND r."userId" = auth.uid()::text
  )
);

-- Users can create conditions for their own routines
CREATE POLICY "Users can create own conditions"
ON conditions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE rt.id = conditions."routineId"
      AND r."userId" = auth.uid()::text
  )
);

-- Users can update conditions for their own routines
CREATE POLICY "Users can update own conditions"
ON conditions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE rt.id = conditions."routineId"
      AND r."userId" = auth.uid()::text
  )
);

-- Users can delete conditions for their own routines
CREATE POLICY "Users can delete own conditions"
ON conditions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE rt.id = conditions."routineId"
      AND r."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- GOAL LINKS POLICIES
-- ============================================================================

-- Goal task links
CREATE POLICY "Users can manage own goal task links"
ON goal_task_links FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM goals g
    INNER JOIN roles r ON r.id = g."roleId"
    WHERE g.id = goal_task_links."goalId"
      AND r."userId" = auth.uid()::text
  )
);

-- Goal routine links
CREATE POLICY "Users can manage own goal routine links"
ON goal_routine_links FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM goals g
    INNER JOIN roles r ON r.id = g."roleId"
    WHERE g.id = goal_routine_links."goalId"
      AND r."userId" = auth.uid()::text
  )
);

-- Routine assignments
CREATE POLICY "Users can manage own routine assignments"
ON routine_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM routines rt
    INNER JOIN roles r ON r.id = rt."roleId"
    WHERE rt.id = routine_assignments."routineId"
      AND r."userId" = auth.uid()::text
  )
);

-- ============================================================================
-- NOTES
-- ============================================================================

-- These policies enforce security at the database level.
-- Always test policies thoroughly before deploying to production.
--
-- To test a policy:
-- 1. Create a test user
-- 2. Attempt to access data from another user
-- 3. Verify access is denied
--
-- To disable RLS on a table (for debugging only, NEVER in production):
-- ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
--
-- To view all policies on a table:
-- SELECT * FROM pg_policies WHERE tablename = 'your_table_name';
