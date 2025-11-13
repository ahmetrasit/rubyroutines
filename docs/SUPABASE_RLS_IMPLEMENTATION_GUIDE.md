# Supabase Row Level Security (RLS) Implementation Guide

**Status:** 📋 Not Yet Implemented
**Priority:** 🔴 CRITICAL for A- Security Grade
**Effort:** High (1 week)
**Dependencies:** Existing `supabase/policies.sql` file (949 lines)

---

## Table of Contents
1. [Overview](#overview)
2. [Why RLS is Critical](#why-rls-is-critical)
3. [Implementation Steps](#implementation-steps)
4. [Testing Strategy](#testing-strategy)
5. [Rollback Plan](#rollback-plan)
6. [Performance Considerations](#performance-considerations)

---

## Overview

Row Level Security (RLS) is a PostgreSQL feature that allows you to control which rows users can access in database tables. It provides defense-in-depth security by enforcing access control at the database level, independent of application logic.

### Current State
- ✅ Complete RLS policies exist in `supabase/policies.sql`
- ❌ RLS is NOT currently enabled on any tables
- ❌ All security is application-level only (through tRPC)
- ⚠️ If application security is bypassed, database is fully exposed

### Target State
- ✅ RLS enabled on all tables
- ✅ Policies enforce user ownership
- ✅ Policies enforce co-parent/co-teacher sharing
- ✅ Defense-in-depth security architecture

---

## Why RLS is Critical

### Security Risks Without RLS

1. **Single Point of Failure**
   - If tRPC authorization is bypassed, entire database is exposed
   - Bug in application code could leak all data
   - Direct Supabase client access would expose everything

2. **No Defense-in-Depth**
   - Security best practice requires multiple layers
   - Application + Database level enforcement

3. **Compliance Issues**
   - GDPR requires "appropriate technical measures"
   - RLS is an industry-standard security measure

4. **Data Breach Amplification**
   - Without RLS, a single SQL injection could expose all data
   - With RLS, damage is limited to authenticated user's data

### Benefits of RLS

✅ **Database-Level Authorization**
- Cannot be bypassed by application bugs
- Enforced even with direct database access

✅ **Automatic Application to All Queries**
- No need to remember to add WHERE clauses
- Reduces human error

✅ **Simplified Application Code**
- Less authorization logic in application
- Database handles row-level filtering

✅ **Better Security Audit Trail**
- Policies are versioned and reviewable
- Clear separation of concerns

---

## Implementation Steps

### Phase 1: Preparation (1-2 days)

#### Step 1.1: Review Existing Policies
```bash
# Review the 949-line policies file
cat supabase/policies.sql

# Key sections to understand:
# 1. User ownership policies (users, roles)
# 2. Person/routine/task access policies
# 3. Co-parent sharing policies
# 4. Co-teacher sharing policies
# 5. Marketplace policies
# 6. Billing policies
```

#### Step 1.2: Set Up Testing Environment
```bash
# Create a test database (don't use production!)
# Option 1: Local Supabase
npx supabase init
npx supabase start

# Option 2: Supabase staging project
# Create separate staging project in Supabase dashboard
```

#### Step 1.3: Back Up Current Database
```bash
# Export current schema and data
npx supabase db dump -f backup.sql

# Store backup securely
# Test restore process before proceeding
```

---

### Phase 2: Enable RLS Table by Table (3-4 days)

⚠️ **IMPORTANT**: Enable RLS incrementally, testing thoroughly after each table.

#### Step 2.1: Users Table (Start with simplest)

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own record
CREATE POLICY "users_own_record" ON users
  FOR ALL
  USING (id = auth.uid());

-- Test queries
SELECT * FROM users; -- Should only return current user's row
```

**Testing Checklist:**
- [ ] User can read own record
- [ ] User cannot read other users
- [ ] User can update own record
- [ ] User cannot update other users
- [ ] Application still works (login, profile, etc.)

---

#### Step 2.2: Roles Table

```sql
-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access their own roles
CREATE POLICY "users_own_roles" ON roles
  FOR ALL
  USING (user_id = auth.uid());

-- Test queries
SELECT * FROM roles; -- Should only return current user's roles
```

**Testing Checklist:**
- [ ] User can see own roles
- [ ] User cannot see other users' roles
- [ ] Role creation works
- [ ] Role switching works
- [ ] Dashboard shows correct roles

---

#### Step 2.3: Persons Table

```sql
-- Enable RLS
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can access persons from their own roles
CREATE POLICY "users_own_persons" ON persons
  FOR ALL
  USING (
    role_id IN (
      SELECT id FROM roles WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Co-parents can access shared persons
CREATE POLICY "coparent_shared_persons" ON persons
  FOR SELECT
  USING (
    id IN (
      SELECT unnest(person_ids) FROM co_parents
      WHERE co_parent_role_id IN (
        SELECT id FROM roles WHERE user_id = auth.uid()
      )
      AND status = 'ACTIVE'
    )
  );

-- Policy 3: Co-teachers can access shared persons (students)
CREATE POLICY "coteacher_shared_persons" ON persons
  FOR SELECT
  USING (
    id IN (
      SELECT unnest(student_ids) FROM co_teachers
      WHERE co_teacher_role_id IN (
        SELECT id FROM roles WHERE user_id = auth.uid()
      )
      AND status = 'ACTIVE'
    )
  );
```

**Testing Checklist:**
- [ ] Parent can see own children
- [ ] Parent cannot see other parents' children
- [ ] Co-parent can see shared children (read-only)
- [ ] Teacher can see own students
- [ ] Co-teacher can see shared students
- [ ] Person creation works
- [ ] Person deletion works

---

#### Step 2.4: Routines Table

```sql
-- Enable RLS
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access routines from their own roles
CREATE POLICY "users_own_routines" ON routines
  FOR ALL
  USING (
    role_id IN (
      SELECT id FROM roles WHERE user_id = auth.uid()
    )
  );

-- Policy: Co-parents can see routines for shared persons
CREATE POLICY "coparent_shared_routines" ON routines
  FOR SELECT
  USING (
    id IN (
      SELECT r.id FROM routines r
      INNER JOIN routine_assignments ra ON ra.routine_id = r.id
      WHERE ra.person_id IN (
        SELECT unnest(person_ids) FROM co_parents
        WHERE co_parent_role_id IN (
          SELECT id FROM roles WHERE user_id = auth.uid()
        )
        AND status = 'ACTIVE'
      )
    )
  );
```

**Testing Checklist:**
- [ ] User can see own routines
- [ ] User cannot see other users' routines
- [ ] Co-parent can see shared person's routines
- [ ] Routine CRUD operations work
- [ ] Routine assignments work

---

#### Step 2.5: Tasks Table

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access tasks from their own routines
CREATE POLICY "users_own_tasks" ON tasks
  FOR ALL
  USING (
    routine_id IN (
      SELECT id FROM routines
      WHERE role_id IN (
        SELECT id FROM roles WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Co-parents can see tasks for shared routines
CREATE POLICY "coparent_shared_tasks" ON tasks
  FOR SELECT
  USING (
    routine_id IN (
      SELECT r.id FROM routines r
      INNER JOIN routine_assignments ra ON ra.routine_id = r.id
      WHERE ra.person_id IN (
        SELECT unnest(person_ids) FROM co_parents
        WHERE co_parent_role_id IN (
          SELECT id FROM roles WHERE user_id = auth.uid()
        )
        AND status = 'ACTIVE'
      )
    )
  );
```

**Testing Checklist:**
- [ ] User can manage own tasks
- [ ] Co-parent can view shared tasks
- [ ] Task completion works
- [ ] Task conditions work

---

#### Step 2.6: Task Completions Table

```sql
-- Enable RLS
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access completions for their persons
CREATE POLICY "users_own_completions" ON task_completions
  FOR ALL
  USING (
    person_id IN (
      SELECT id FROM persons
      WHERE role_id IN (
        SELECT id FROM roles WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Co-parents can see shared completions
CREATE POLICY "coparent_shared_completions" ON task_completions
  FOR SELECT
  USING (
    person_id IN (
      SELECT unnest(person_ids) FROM co_parents
      WHERE co_parent_role_id IN (
        SELECT id FROM roles WHERE user_id = auth.uid()
      )
      AND status = 'ACTIVE'
    )
  );
```

**Testing Checklist:**
- [ ] Task completion recording works
- [ ] Analytics show correct data
- [ ] Co-parent can see shared completions
- [ ] Undo completion works

---

#### Step 2.7: Goals Table

```sql
-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access goals from their own roles
CREATE POLICY "users_own_goals" ON goals
  FOR ALL
  USING (
    role_id IN (
      SELECT id FROM roles WHERE user_id = auth.uid()
    )
  );
```

---

#### Step 2.8: Remaining Tables

Apply similar policies to:
- `goal_task_links`
- `goal_routine_links`
- `conditions`
- `routine_assignments`
- `groups`
- `group_members`
- `codes` (kiosk codes)
- `co_parents`
- `co_teachers`
- `invitations`
- `verification_codes`
- `marketplace_routines`
- `marketplace_ratings`
- `marketplace_comments`
- `comment_flags`
- `audit_logs`

---

### Phase 3: Performance Optimization (1-2 days)

#### Step 3.1: Add Necessary Indexes

```sql
-- Index for common RLS queries
CREATE INDEX IF NOT EXISTS idx_roles_user_id ON roles(user_id);
CREATE INDEX IF NOT EXISTS idx_persons_role_id ON persons(role_id);
CREATE INDEX IF NOT EXISTS idx_routines_role_id ON routines(role_id);
CREATE INDEX IF NOT EXISTS idx_tasks_routine_id ON tasks(routine_id);
CREATE INDEX IF NOT EXISTS idx_completions_person_id ON task_completions(person_id);

-- Composite indexes for RLS queries
CREATE INDEX IF NOT EXISTS idx_coparents_lookup
  ON co_parents(co_parent_role_id, status)
  WHERE status = 'ACTIVE';
```

#### Step 3.2: Monitor Query Performance

```sql
-- Enable query timing
SET log_statement = 'all';
SET log_duration = on;
SET log_min_duration_statement = 100; -- Log queries >100ms

-- Run application tests and monitor logs
-- Identify slow queries
-- Add indexes as needed
```

---

### Phase 4: Production Deployment (1 day)

#### Step 4.1: Final Testing on Staging

```bash
# Run full test suite on staging with RLS enabled
npm run test

# Manual testing checklist:
# - User signup/login
# - Person CRUD
# - Routine CRUD
# - Task completion
# - Analytics
# - Co-parent sharing
# - Co-teacher sharing
# - Marketplace browsing
# - Billing operations
```

#### Step 4.2: Deploy to Production

```bash
# Apply policies to production
# Option 1: Via Supabase dashboard SQL editor
# - Copy policies.sql content
# - Execute in SQL editor
# - Review execution results

# Option 2: Via migration
npx supabase db push

# Option 3: Via psql
psql $DATABASE_URL < supabase/policies.sql
```

#### Step 4.3: Monitor Production

```bash
# Watch error logs
tail -f /var/log/application.log

# Monitor Supabase logs
# Check for RLS policy violations
# Check for permission errors

# Monitor query performance
# Ensure no significant slowdown
```

---

## Testing Strategy

### Automated Tests

Create test suite for RLS policies:

```typescript
describe('RLS Policies', () => {
  describe('Users Table', () => {
    it('should allow user to read own record', async () => {
      const user = await createTestUser();
      const result = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id);
      expect(result.data).toHaveLength(1);
    });

    it('should not allow user to read other users', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      // Login as user1
      await supabase.auth.signInWithPassword({
        email: user1.email,
        password: user1.password,
      });

      // Try to read user2
      const result = await supabase
        .from('users')
        .select('*')
        .eq('id', user2.id);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Persons Table', () => {
    it('should allow user to see own persons', async () => {
      // Test implementation
    });

    it('should allow co-parent to see shared persons', async () => {
      // Test implementation
    });

    it('should not allow co-parent to modify shared persons', async () => {
      // Test implementation
    });
  });

  // ... more tests for each table
});
```

### Manual Testing Checklist

#### Basic Operations
- [ ] User signup
- [ ] User login
- [ ] Create person
- [ ] Create routine
- [ ] Create task
- [ ] Complete task
- [ ] View analytics
- [ ] Update profile

#### Sharing Features
- [ ] Invite co-parent
- [ ] Accept co-parent invitation
- [ ] Co-parent can view shared persons
- [ ] Co-parent cannot modify shared persons
- [ ] Revoke co-parent access
- [ ] Invite co-teacher
- [ ] Co-teacher can view students

#### Edge Cases
- [ ] Try to access another user's data directly via API
- [ ] Try SQL injection (should be blocked by RLS)
- [ ] Try to bypass authorization headers
- [ ] Concurrent operations (two users editing same data)

---

## Rollback Plan

If RLS causes issues in production:

### Step 1: Immediate Rollback
```sql
-- Disable RLS on problematic table
ALTER TABLE persons DISABLE ROW LEVEL SECURITY;

-- This immediately restores old behavior
-- Application-level authorization still applies
```

### Step 2: Identify Issue
- Check error logs
- Identify which queries are failing
- Identify which policies are problematic

### Step 3: Fix and Reapply
- Fix policy definition
- Test on staging
- Reapply to production

---

## Performance Considerations

### Expected Performance Impact

✅ **Minimal impact expected:**
- Modern PostgreSQL is optimized for RLS
- Policies use indexed columns
- Most queries already filter by user/role

⚠️ **Potential slowdowns:**
- Complex policies with many JOINs
- Subqueries in policies
- Missing indexes

### Mitigation Strategies

1. **Add Indexes**
   - Index all columns used in policies
   - Composite indexes for multi-column filters

2. **Simplify Policies**
   - Avoid nested subqueries
   - Use INNER JOIN instead of IN when possible
   - Consider materialized views for complex access

3. **Cache Results**
   - Application-level caching for frequently accessed data
   - Redis cache for computed values

4. **Monitor Performance**
   - Set up query performance monitoring
   - Alert on slow queries (>200ms)
   - Regular EXPLAIN ANALYZE on common queries

---

## Success Criteria

RLS implementation is successful when:

✅ All automated tests pass
✅ All manual testing scenarios work
✅ No user-reported issues after 48 hours
✅ Query performance within 10% of baseline
✅ Security audit shows defense-in-depth architecture
✅ Direct database access properly restricts rows

---

## Next Steps After RLS

Once RLS is implemented:

1. **Security Audit**
   - Hire security firm to test RLS policies
   - Attempt to bypass policies
   - Document findings

2. **Performance Tuning**
   - Optimize slow policies
   - Add missing indexes
   - Consider query caching

3. **Documentation**
   - Document all policies
   - Create policy modification guide
   - Train team on RLS

4. **Monitoring**
   - Set up alerts for RLS violations
   - Monitor policy performance
   - Track policy effectiveness

---

## Appendix: Common RLS Patterns

### Pattern 1: User Ownership
```sql
CREATE POLICY "own_records" ON table_name
  FOR ALL
  USING (user_id = auth.uid());
```

### Pattern 2: Role-Based Access
```sql
CREATE POLICY "role_based" ON table_name
  FOR ALL
  USING (
    role_id IN (
      SELECT id FROM roles WHERE user_id = auth.uid()
    )
  );
```

### Pattern 3: Shared Access
```sql
CREATE POLICY "shared_access" ON table_name
  FOR SELECT
  USING (
    id IN (
      SELECT resource_id FROM sharing
      WHERE shared_with_user_id = auth.uid()
      AND status = 'ACTIVE'
    )
  );
```

### Pattern 4: Read-Only Sharing
```sql
-- Read policy
CREATE POLICY "read_shared" ON table_name
  FOR SELECT
  USING (id IN (SELECT resource_id FROM sharing WHERE user_id = auth.uid()));

-- Write policy (owner only)
CREATE POLICY "write_own" ON table_name
  FOR INSERT, UPDATE, DELETE
  USING (owner_id = auth.uid());
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-13
**Next Review:** After RLS implementation
