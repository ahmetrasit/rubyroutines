# Ruby Routines - Project Context & Requirements

**Version:** 1.0
**Last Updated:** 2025-11-12
**Purpose:** Comprehensive context document for AI coding sessions

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Core Philosophy](#core-philosophy)
3. [Technical Stack & Architecture](#technical-stack--architecture)
4. [Critical Business Rules](#critical-business-rules)
5. [Gap Analysis Resolutions](#gap-analysis-resolutions)
6. [Data Model Overview](#data-model-overview)
7. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
8. [How to Use This Document](#how-to-use-this-document)

---

## Project Overview

**Ruby Routines** is a Progressive Web App (PWA) for routine management targeting **parents and teachers of advanced & gifted learners**. The app helps create, track, and analyze daily routines with a focus on long-term habit formation.

### Key Features
- **Dual-role accounts:** Users can have both PARENT and TEACHER roles
- **Routine management:** Regular, smart (conditional), and teacher-classroom routines
- **Task types:** Simple, multiple check-in, progress, and smart tasks
- **Goal system:** Task-based, routine-based, or mixed aggregation
- **Kiosk mode:** Code-based authentication-free access for children
- **Co-parent/Co-teacher:** Sharing with granular permissions
- **School mode:** Principal-teacher-support staff hierarchy
- **Marketplace:** Share and discover routines/goals with versioning
- **Analytics:** Non-competitive visualizations (D3.js charts)

### Target Users
- **Parents:** Managing routines for 1-10 children (advanced/gifted learners)
- **Teachers:** Managing classroom routines for 5-30 students
- **Schools:** Principals managing multiple teachers and classrooms

---

## Core Philosophy

### Non-Competitive Approach
❌ **What We DON'T Have:**
- No timers or countdowns
- No leaderboards or rankings
- No comparisons between children
- No public streaks or badges
- No gamification with extrinsic rewards

✅ **What We DO Have:**
- Progress over perfection
- Non-judgmental data presentation
- Intrinsic motivation support
- Private, personal analytics
- Celebration without competition

### Why This Matters
Advanced and gifted learners often face:
- Perfectionism and fear of failure
- Anxiety from time pressure
- Social comparison issues
- External validation dependency

Ruby Routines focuses on **sustainable habit formation** through consistency, not short-term dopamine hits.

---

## Technical Stack & Architecture

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** React hooks + tRPC for server state
- **Charts:** D3.js v7 (custom styling, non-competitive design)
- **PWA:** next-pwa for offline support

### Backend
- **API:** Next.js API Routes + tRPC
- **Validation:** Zod schemas
- **Business Logic:** Service layer pattern (`/lib/services/`)

### Database
- **Provider:** Supabase (PostgreSQL 15)
- **ORM:** Prisma 5
- **Security:** Row Level Security (RLS) policies at database level
- **Real-time:** Supabase Realtime for kiosk mode updates

### Authentication
- **Provider:** Supabase Auth
- **Methods:** Email/password + Google OAuth
- **Verification:** 6-digit email codes (no magic links)
- **Sessions:** JWT tokens

### Payments
- **Provider:** Stripe
- **Tiers:** FREE, BASIC ($5/mo), PREMIUM ($10/mo), SCHOOL ($25/mo)
- **Billing:** Per-role (parent and teacher roles billed separately)

### Email
- **Provider:** Resend
- **Use cases:** Email verification, invitations, billing notifications

### Infrastructure
- **Hosting:** Vercel (Next.js)
- **Database:** Supabase Cloud
- **Cost:** <$10/mo until 10K users, scales to $1,500/mo at 1M users

---

## Critical Business Rules

### 1. Dual-Role Accounts

**Rule:** One user can have BOTH parent and teacher roles simultaneously.

**Implementation:**
```typescript
// User table (one per email)
User {
  id: string
  email: string
  name: string
}

// Role table (multiple per user)
Role {
  id: string
  userId: string
  type: 'PARENT' | 'TEACHER' | 'PRINCIPAL' | 'SUPPORT'
  tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'SCHOOL'
}
```

**Key Points:**
- Navigation shows mode switcher: "Switch to Parent Mode" / "Switch to Teacher Mode"
- Dashboard layout changes based on active role
- Billing is **per-role** (parent tier separate from teacher tier)
- User cannot switch modes mid-session (must save/cancel first)

---

### 2. Person vs Group

**Person:** An individual child (for parents) or student (for teachers)

**Group:** A collection of persons
- Parents use for: family sub-groups (e.g., "Older Kids", "Younger Kids")
- Teachers use for: classrooms (e.g., "Grade 5A", "Math Advanced")

**Key Points:**
- Routines are assigned to persons OR groups (not both)
- Groups have members (Person records)
- Groups can be marked as classrooms (teacher mode only)

---

### 3. Routine Types

**REGULAR:** Standard daily/weekly routines
- Example: "Morning Routine", "Homework Routine"

**SMART:** Conditional routines (only visible if conditions met)
- Example: "Screen Time Routine" (only if "Homework Routine" completed)
- Requires "Smart Routines" feature upgrade

**TEACHER_CLASSROOM:** Special type for teachers
- Assigned to entire classroom (group)
- Students complete tasks independently
- Teacher sees aggregated completion data

**Key Points:**
- Smart routines require PREMIUM tier or higher
- Circular dependencies prevented (DFS algorithm)
- Conditions evaluated in real-time

---

### 4. Task Types

**SIMPLE:** Single check-in per reset period
- Example: "Brush teeth" (once per day)
- UI: Single checkbox

**MULTIPLE_CHECKIN:** Multiple check-ins per reset period
- Example: "Drink water" (8 times per day)
- UI: Button to increment count + current count display

**PROGRESS:** Numeric value entry
- Example: "Read pages" (target: 20 pages)
- UI: Input field for value + progress bar

**SMART:** Dynamically generated from conditions
- Example: "Bonus screen time" (only if weekly goal met)
- UI: Same as SIMPLE but visibility controlled by conditions

**Key Points:**
- Order matters (drag-to-reorder in UI)
- Status: ACTIVE or ARCHIVED (soft delete)
- Task completion creates TaskCompletion record (never deleted, for analytics)

---

### 5. Reset Periods

**Purpose:** Define when task completions reset to zero

**Options:**
- DAILY (resets at midnight)
- WEEKLY (resets on specific day: Monday-Sunday)
- MONTHLY (resets on specific date: 1-31)
- CUSTOM (manual reset)

**Implementation:**
```typescript
function getResetPeriodStart(period: ResetPeriod, resetDay?: number): Date {
  const now = new Date();

  switch (period) {
    case 'DAILY':
      return startOfDay(now);
    case 'WEEKLY':
      return startOfWeek(now, { weekStartsOn: resetDay || 1 }); // 0=Sun, 1=Mon
    case 'MONTHLY':
      const day = resetDay || 1;
      return new Date(now.getFullYear(), now.getMonth(), day);
    case 'CUSTOM':
      return new Date(0); // Never resets automatically
  }
}
```

**Key Points:**
- Reset period inherited from routine (not per-task)
- Past completions never deleted (preserved for analytics)
- Reset period can be changed, but doesn't affect historical data

---

### 6. Goals System

**Purpose:** Track progress toward targets across multiple tasks/routines

**Goal Types:**
1. **Task-based:** Aggregate completions from specific tasks
   - Example: "Drink 56 glasses of water this week" (from "Drink water" task)

2. **Routine-based:** Aggregate completion % from routines
   - Example: "Complete Morning Routine 7 days this week" (from "Morning Routine")

3. **Mixed:** Combine tasks and routines
   - Example: "Complete 5 homework sessions + 90% morning routine completion"

**Aggregation Logic:**
```typescript
// For task-based goals
if (task.type === 'MULTIPLE_CHECKIN') {
  current += task.completions.count; // Sum all check-ins
} else if (task.type === 'PROGRESS') {
  current += sum(task.completions.value); // Sum all progress values
} else {
  current += task.completions.count > 0 ? 1 : 0; // Binary (completed or not)
}

// For routine-based goals
const routineCompletionPercent = completedTasks / totalTasks * 100;
current += routineCompletionPercent;
```

**Key Points:**
- Goals have own reset periods (independent of tasks/routines)
- Progress recalculated on every task completion (real-time)
- Goals can link to persons OR groups
- Achieved status: current >= target

---

### 7. Kiosk Mode

**Purpose:** Allow children to mark tasks complete without authentication

**Flow:**
1. Parent/teacher generates code (e.g., "OCEAN-TIGER")
2. Child enters code on kiosk device (tablet/computer)
3. Child selects their name from list
4. Child sees today's tasks (large touch targets)
5. Child taps tasks to mark complete (with confetti celebration)
6. Session auto-expires after 3 minutes of inactivity

**Code Generation:**
- Format: 2-3 words from 2000-word safe list
- Example: "OCEAN-TIGER", "CLOUD-FOREST-MOON"
- Safe list: No profanity, no similar-sounding words, easy to pronounce
- Expiry: 24 hours OR single-use (whichever comes first)

**Session Management:**
- Stored in localStorage (persists across page reloads)
- Warning at 2 minutes idle
- Auto-logout at 3 minutes idle
- Activity reset: any interaction (task completion, scrolling, etc.)

**Security:**
- No authentication required (code is temporary credential)
- Code marked as USED after first session (cannot be reused)
- RLS policies restrict kiosk to task completions only (no edits)

**Key Points:**
- Kiosk requires BASIC tier or higher
- Real-time updates: completions sync immediately to parent/teacher dashboard
- Undo window: 5 minutes (after that, completion is locked)

---

### 8. Co-Parent System

**Purpose:** Allow separated/divorced parents to collaborate on child's routines

**Invitation Flow:**
1. Primary parent sends invitation via email
2. Co-parent receives email with magic link
3. Co-parent clicks link, creates/logs into account
4. Co-parent gains access based on permissions

**Permission Levels:**
- **READ_ONLY:** View tasks and completion history only
- **TASK_COMPLETION:** View + mark tasks complete
- **FULL_EDIT:** View + complete + create/edit routines and tasks

**Granular Access:**
- Primary parent selects which children co-parent can access
- Co-parent only sees persons (children) they have access to
- Co-parent cannot see primary parent's personal info or billing

**Key Points:**
- Primary parent can revoke access anytime
- Co-parent cannot delete primary parent's account
- Co-parent cannot grant permissions to others (no privilege escalation)
- Permissions enforced at database level (RLS policies)

---

### 9. Co-Teacher System

**Purpose:** Allow teachers to share classrooms with assistant teachers

**Invitation Flow:**
1. Primary teacher shares classroom via email
2. Co-teacher accepts invitation
3. Co-teacher gains access to shared classroom(s)

**Permission Levels:**
- **VIEW:** View students and tasks only
- **EDIT_TASKS:** View + edit tasks + mark completions
- **FULL_EDIT:** View + edit + create/delete students and routines

**Key Points:**
- Either teacher can revoke sharing
- Co-teacher only sees shared classrooms (not all of primary teacher's data)
- Co-teacher maintains their own separate teacher account

---

### 10. Student-Parent Connection

**Purpose:** Allow parents to see their child's school tasks at home

**Flow:**
1. Teacher generates 6-digit code for specific student (e.g., "123456")
2. Teacher shares code with parent (email, text, or in-person)
3. Parent enters code in parent dashboard
4. Parent selects which of their Person records represents this child
5. Connection established

**Result:**
- Parent sees student's school tasks in parent dashboard
- Parent can mark tasks complete (if teacher allows)
- Teacher retains full control of routines and task definitions
- Either party can disconnect anytime

**Key Points:**
- Code expires after 24 hours
- One-time use (cannot be reused)
- Teacher sets permission level: READ_ONLY or TASK_COMPLETION
- Connection is between teacher's Student (Person) and parent's Child (Person)

---

### 11. School Mode

**Purpose:** Allow schools to manage multiple teachers centrally

**Hierarchy:**
```
School (Principal)
├── Teacher 1 (Classroom A, Classroom B)
├── Teacher 2 (Classroom C)
└── Support Staff (Read-only access to all)
```

**Roles:**
- **PRINCIPAL:** Creates school, invites teachers, sees analytics across all classrooms
- **TEACHER:** Creates classrooms and students, manages routines
- **SUPPORT:** Read-only access to all classrooms (counselors, admin staff)

**Billing:**
- School pays single SCHOOL tier subscription ($25/mo)
- Covers all teachers and support staff in the school
- Teachers cannot see other teachers' classrooms (unless shared via co-teacher)

**Key Points:**
- School mode requires SCHOOL tier
- Principal cannot edit teachers' routines (only view analytics)
- Teachers maintain autonomy over their classrooms

---

### 12. Marketplace

**Purpose:** Share and discover routines/goals created by community

**Publishing:**
- Users can publish routines or goals to marketplace
- Visibility options: PUBLIC, UNLISTED (shareable link only), PRIVATE
- Metadata: category, age group, tags

**Versioning:**
- Semantic versioning: 1.0.0, 1.1.0, 2.0.0
- Updates increment version (1.0.0 → 1.0.1)
- Forked items remain independent (updates to original don't affect forks)

**Forking:**
- Import marketplace item to your account
- Creates independent copy
- Customize without affecting original
- Credits original author

**Rating & Comments:**
- 5-star rating system
- Text comments (max 500 chars)
- Flag inappropriate content (auto-hide after 3 flags)
- Manual moderation queue for flagged content

**Key Points:**
- Marketplace requires BASIC tier or higher (to publish)
- Forking is free for all users
- Search by keyword, category, age group, tags
- Sort by rating, popularity (fork count), or date

---

### 13. Tier System & Limits

**Tiers:**
- **FREE:** Limited features for trial
- **BASIC:** $5/mo - Suitable for single-parent or small classroom
- **PREMIUM:** $10/mo - Suitable for larger families or multiple classrooms
- **SCHOOL:** $25/mo - Unlimited teachers and students for entire school

**Tier Limits:**

| Feature              | FREE | BASIC | PREMIUM | SCHOOL |
|----------------------|------|-------|---------|--------|
| Persons              | 3    | 10    | 50      | 500    |
| Groups               | 0    | 3     | 10      | 50     |
| Routines             | 10   | 50    | 200     | 1000   |
| Tasks per Routine    | 10   | 20    | 50      | 100    |
| Goals                | 3    | 10    | 50      | 200    |
| Kiosk Codes (active) | 1    | 5     | 20      | 100    |
| Smart Routines       | ❌   | ❌    | ✅      | ✅     |
| Marketplace Publish  | ❌   | ✅    | ✅      | ✅     |
| Co-Parent/Teacher    | ❌   | ✅    | ✅      | ✅     |
| Analytics Export     | ❌   | ✅    | ✅      | ✅     |

**Enforcement:**
- Check limits on every CREATE operation
- Throw error if limit exceeded: "Tier limit exceeded. FREE tier allows 3 persons. Upgrade to BASIC."
- Block action, show upgrade prompt in UI

---

### 14. Soft Delete vs Hard Delete

**Soft Delete (Status = ARCHIVED):**
- Person
- Group
- Routine
- Task
- Goal

**Hard Delete (Permanent):**
- Unverified user accounts after 7 days
- Expired kiosk codes (after 30 days)
- TaskCompletion: ❌ NEVER deleted (preserved for analytics)

**Why Soft Delete:**
- Preserve historical data for analytics
- Prevent accidental data loss
- Allow "undo" functionality
- Maintain referential integrity

**Implementation:**
```typescript
// Soft delete
await prisma.person.update({
  where: { id },
  data: { status: 'ARCHIVED', archivedAt: new Date() }
});

// Query active only
const persons = await prisma.person.findMany({
  where: { status: 'ACTIVE' }
});
```

---

### 15. Visibility Rules

**Purpose:** Control when routines/tasks are visible to persons

**Visibility Options:**
- **ALWAYS:** Always visible (default)
- **DATE_RANGE:** Visible between start and end dates
- **DAYS_OF_WEEK:** Visible on specific days (e.g., weekdays only)
- **CONDITIONAL:** Visible based on smart conditions

**Use Cases:**
- **Seasonal routines:** "Summer Reading" (June-August)
- **School routines:** "Homework" (Monday-Friday during school year)
- **Smart routines:** "Screen Time" (only if "Homework" completed)

**Implementation:**
```typescript
function isRoutineVisible(routine: Routine, date: Date): boolean {
  if (routine.visibility === 'ALWAYS') return true;

  if (routine.visibility === 'DATE_RANGE') {
    return date >= routine.startDate && date <= routine.endDate;
  }

  if (routine.visibility === 'DAYS_OF_WEEK') {
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    return routine.visibleDays.includes(dayOfWeek);
  }

  if (routine.visibility === 'CONDITIONAL') {
    return evaluateConditions(routine.conditions);
  }
}
```

---

## Gap Analysis Resolutions

These are critical decisions made during initial requirements analysis. **Follow these exactly:**

### 1. Kiosk Code Usage
**Question:** Can kiosk codes be used multiple times or just once?
**Resolution:** Single-session restriction. Code expires after first use OR 24 hours, whichever comes first.

### 2. Account Deletion
**Question:** Hard delete or soft delete?
**Resolution:**
- Hard delete: Only unverified accounts after 7 days
- Soft delete: All other entities (Person, Group, Routine, Task, Goal)
- TaskCompletion: NEVER deleted (preserved for analytics)

### 3. Billing Failure
**Question:** What happens if payment fails?
**Resolution:**
- Send 3 payment failure emails (days 1, 3, 7)
- After 7 days: Downgrade to FREE tier
- Per-role billing: Parent and teacher roles billed separately
- FREE tier: Read-only access to existing data + limited creates

### 4. Co-Parent Conflicts
**Question:** What if co-parents create conflicting routines?
**Resolution:**
- READ_ONLY: Cannot create/edit (no conflicts)
- TASK_COMPLETION: Can only mark tasks complete (no conflicts)
- FULL_EDIT: Conflicts possible, show warning: "Jane edited this routine 2 hours ago"
- Prevent simultaneous edits: Optimistic locking (version field)

### 5. Student-Parent Code Expiry
**Question:** What happens if code expires before use?
**Resolution:**
- Code expires after 24 hours
- Teacher can generate new code anytime (no limit)
- Show expiry time when displaying code: "Expires in 23 hours"

### 6. Marketplace Content Ownership
**Question:** Who owns published routines?
**Resolution:**
- Original author retains ownership
- Forked items are independent (not affected by original updates)
- Author can unpublish anytime (doesn't affect existing forks)
- License: CC BY-NC-SA (Attribution, Non-Commercial, Share-Alike)

### 7. Goal Progress Calculation
**Question:** How to aggregate mixed task types?
**Resolution:**
```typescript
// Simple task: Binary (0 or 1)
contribution = hasCompletion ? 1 : 0;

// Multiple check-in: Sum count
contribution = completions.length;

// Progress: Sum values
contribution = sum(completions.map(c => c.value));

// Routine: Percentage
contribution = (completedTasks / totalTasks) * 100;

// Goal total
current = sum(all contributions);
percentage = (current / target) * 100;
```

### 8. Smart Routine Circular Dependencies
**Question:** Prevent infinite loops?
**Resolution:**
- Use Depth-First Search (DFS) algorithm
- Detect cycles before saving condition
- Show error: "Circular dependency detected: Routine A → Routine B → Routine A"
- Prevent saving if cycle found

### 9. Teacher Sees Co-Parent Activity
**Question:** Can teachers see parent completions?
**Resolution:**
- YES, if student connected to parent
- Teacher sees ALL completions (from kiosk, parent, teacher)
- Show source: "Completed by Parent (at home)" vs "Completed by Teacher (in class)"
- Parent and teacher completions count the same toward goals

### 10. Kiosk Offline Mode
**Question:** Can kiosk work offline?
**Resolution:**
- YES, using PWA service workers
- Queue completions locally
- Sync when connection restored
- Show indicator: "Offline - 3 completions queued"

### 11. Multiple Children Same Name
**Question:** How to distinguish "Alex" from "Alex"?
**Resolution:**
- Allow same names (no uniqueness constraint)
- Show avatar or initials in selection UI
- Internal: Unique CUID for each Person record
- UI: "Alex M." vs "Alex K." if last initial available

### 12. Goal Deadline Behavior
**Question:** What happens when goal period ends?
**Resolution:**
- Archive achieved goals automatically
- Keep unachieved goals active (allow retry)
- Show notification: "5 goals completed last week! 🎉"
- Reset progress for new period

### 13. Task Deletion with History
**Question:** Can tasks be deleted if they have completions?
**Resolution:**
- Soft delete only (status = ARCHIVED)
- Preserve TaskCompletion records (for analytics)
- Show warning: "This task has 127 completions. Archive instead?"
- Allow "Restore" from archive

### 14. Tier Downgrade Data Loss
**Question:** What happens to data when downgrading?
**Resolution:**
- No data deleted
- Exceed-limit data becomes read-only
- Show message: "You have 15 persons but FREE allows 3. Upgrade to edit all."
- Allow viewing all data, but block new creates

### 15. Smart Routine Evaluation Frequency
**Question:** When to evaluate conditions?
**Resolution:**
- Real-time evaluation on every page load
- Re-evaluate after task completion
- Cache for 1 minute (avoid excessive DB queries)
- Show live updates in UI (no refresh needed)

---

## Data Model Overview

### Core Entities

**User** → One per email address
- id, email, name, emailVerified, createdAt

**Role** → Multiple per user (PARENT, TEACHER, etc.)
- id, userId, type, tier, stripeCustomerId, stripeSubscriptionId

**Person** → Child (parent mode) or Student (teacher mode)
- id, roleId, name, birthDate, avatar, status, archivedAt

**Group** → Family sub-group (parent) or Classroom (teacher)
- id, roleId, name, type, isClassroom, status, archivedAt

**Routine** → Collection of tasks
- id, roleId, name, description, type, resetPeriod, resetDay, visibility, status

**Task** → Individual action to complete
- id, routineId, name, description, type, order, targetValue, status

**TaskCompletion** → Record of task completion (never deleted)
- id, taskId, personId, completedAt, value, notes

**Goal** → Progress tracking toward target
- id, roleId, name, target, period, resetDay, status

**GoalTaskLink** → Link goal to task
- id, goalId, taskId

**GoalRoutineLink** → Link goal to routine
- id, goalId, routineId

### Sharing & Permissions

**Invitation**
- id, token, inviterRoleId, inviteeEmail, type, permissions, expiresAt, status

**CoParent**
- id, primaryRoleId, coParentRoleId, permissions, personIds, status

**CoTeacher**
- id, groupId, primaryTeacherRoleId, coTeacherRoleId, permissions, status

**StudentParentConnection**
- id, teacherRoleId, studentPersonId, parentRoleId, parentPersonId, permissions, status

### Kiosk

**Code**
- id, code, roleId, type, expiresAt, usedAt, status

**ConnectionCode** (6-digit codes for student-parent)
- id, code, teacherRoleId, studentPersonId, expiresAt, usedAt, status

### Marketplace

**MarketplaceItem**
- id, type, sourceId, authorRoleId, name, description, version, content, visibility, category, ageGroup, tags, rating, ratingCount, forkCount

**MarketplaceRating**
- id, marketplaceItemId, userId, rating

**MarketplaceComment**
- id, marketplaceItemId, userId, text, status

**CommentFlag**
- id, commentId, userId, reason

### Smart Routines

**Condition**
- id, routineId, type, targetTaskId, targetRoutineId, operator, value

---

## Common Pitfalls to Avoid

### 1. ❌ Forgetting Dual-Role Logic
**Problem:** Assuming one user = one role
**Solution:** Always query roles for a user, not assume single role

```typescript
// ❌ Wrong
const role = await prisma.role.findFirst({ where: { userId } });

// ✅ Correct
const roles = await prisma.role.findMany({ where: { userId } });
const parentRole = roles.find(r => r.type === 'PARENT');
const teacherRole = roles.find(r => r.type === 'TEACHER');
```

### 2. ❌ Not Enforcing Tier Limits
**Problem:** Forgetting to check limits before create operations
**Solution:** Call `checkTierLimit()` in every create mutation

```typescript
// ✅ Correct
const currentCount = await prisma.person.count({ where: { roleId } });
await checkTierLimit(role.tier, 'persons', currentCount);
await prisma.person.create({ data: { ... } });
```

### 3. ❌ Hard Deleting TaskCompletion
**Problem:** Deleting completions breaks analytics
**Solution:** NEVER delete TaskCompletion records

```typescript
// ❌ Wrong
await prisma.taskCompletion.delete({ where: { id } });

// ✅ Correct - Don't delete at all!
// If task is deleted, completions remain (for historical data)
```

### 4. ❌ Ignoring Reset Periods
**Problem:** Showing all-time completions instead of current period
**Solution:** Always filter by reset period start

```typescript
// ✅ Correct
const periodStart = getResetPeriodStart(routine.resetPeriod, routine.resetDay);
const completions = await prisma.taskCompletion.findMany({
  where: {
    taskId,
    completedAt: { gte: periodStart }
  }
});
```

### 5. ❌ Not Validating Permissions
**Problem:** Assuming user owns resource without checking
**Solution:** Validate ownership and permissions on every mutation

```typescript
// ✅ Correct
const task = await prisma.task.findUnique({
  where: { id },
  include: { routine: { include: { role: true } } }
});

if (task.routine.role.userId !== ctx.user.id) {
  // Check co-parent/co-teacher permissions
  const hasPermission = await checkPermission(ctx.user.id, task.id, 'EDIT');
  if (!hasPermission) {
    throw new Error('Permission denied');
  }
}
```

### 6. ❌ Exposing Sensitive Data
**Problem:** Leaking user emails, billing info in API responses
**Solution:** Use RLS policies + selective includes

```typescript
// ✅ Correct
return {
  id: user.id,
  name: user.name,
  // Don't include: email, stripeCustomerId
};
```

### 7. ❌ Not Handling Circular Dependencies
**Problem:** Smart routines creating infinite loops
**Solution:** Detect cycles with DFS before saving

```typescript
// ✅ Correct
const hasCycle = detectCircularDependency(routineId, conditionTargetId);
if (hasCycle) {
  throw new Error('Circular dependency detected');
}
```

### 8. ❌ Using Client-Side Timestamps
**Problem:** Timezone issues, clock manipulation
**Solution:** Use server timestamps for all completions

```typescript
// ❌ Wrong
completedAt: new Date() // Client timezone

// ✅ Correct
completedAt: new Date() // Server handles this in mutation
```

### 9. ❌ Not Handling Kiosk Session Expiry
**Problem:** User gets logged out without warning
**Solution:** Warn at 2 minutes, logout at 3 minutes

```typescript
// ✅ Correct
useEffect(() => {
  const interval = setInterval(() => {
    const elapsed = Date.now() - lastActivityAt;
    if (elapsed >= 2 * 60 * 1000) showWarning();
    if (elapsed >= 3 * 60 * 1000) logout();
  }, 1000);
  return () => clearInterval(interval);
}, [lastActivityAt]);
```

### 10. ❌ Forgetting Offline Support for PWA
**Problem:** App breaks when offline
**Solution:** Use service workers, queue mutations

```typescript
// ✅ Correct - next-pwa config
module.exports = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\./,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10
      }
    }
  ]
});
```

---

## How to Use This Document

### For Starting Stage 1

1. **Read this entire document** to understand context
2. **Copy the SESSION PROMPT** from `/docs/stages/STAGE-1-COMPLETE.md`
3. **Paste as first message** in new Claude Code session
4. **Reference this document** when clarifying requirements

### Example Session Start

```
You are building Ruby Routines Stage 1: Foundation & Setup.

Before starting, I've read /docs/PROJECT-CONTEXT.md which contains:
- Core philosophy (non-competitive approach)
- Technical stack decisions
- Critical business rules (dual-role accounts, reset periods, etc.)
- Gap analysis resolutions (all edge cases)
- Data model overview

I understand the following critical points:
1. Dual-role accounts: One user can have PARENT + TEACHER roles
2. Soft delete: Status = ARCHIVED (not hard delete)
3. TaskCompletion: NEVER deleted (preserved for analytics)
4. Tier limits: Enforce on every create operation
5. Kiosk codes: Single-use, 24-hour expiry
6. Reset periods: Define when completions reset
7. Goals: Aggregate from tasks/routines with different logic per type

Now proceeding with Stage 1 objectives:
[paste Stage 1 session prompt here]
```

### For Resolving Ambiguities

When AI asks a question about requirements, **refer back to this document first** before answering. Most edge cases are already resolved in "Gap Analysis Resolutions" section.

### For Debugging

If something behaves unexpectedly:
1. Check "Critical Business Rules" - is the rule being followed?
2. Check "Common Pitfalls" - is this a known issue?
3. Check "Gap Analysis Resolutions" - was this decided already?

### Updating This Document

If new requirements emerge or decisions change:
1. Update relevant section in this document
2. Note change in git commit message
3. Update affected stage guides accordingly
4. Keep version number and last updated date current

---

## Quick Reference

### Essential Files
- `PROJECT-CONTEXT.md` ← You are here
- `QUICKSTART.md` - How to resume sessions
- `plan.md` - Development timeline
- `SETUP.md` - Local environment setup
- `STAGE-X-COMPLETE.md` - Detailed implementation guides

### Key Services
- `/lib/services/reset-period.service.ts` - Reset period calculations
- `/lib/services/permission.service.ts` - Permission enforcement
- `/lib/services/kiosk-code.service.ts` - Kiosk code generation
- `/lib/services/analytics.service.ts` - Analytics data aggregation
- `/lib/services/stripe.service.ts` - Billing and subscriptions

### Key tRPC Routers
- `/lib/trpc/routers/auth.router.ts` - Authentication
- `/lib/trpc/routers/person.router.ts` - Person CRUD
- `/lib/trpc/routers/routine.router.ts` - Routine CRUD
- `/lib/trpc/routers/task.router.ts` - Task CRUD + completion
- `/lib/trpc/routers/goal.router.ts` - Goal management
- `/lib/trpc/routers/kiosk.router.ts` - Kiosk mode
- `/lib/trpc/routers/marketplace.router.ts` - Marketplace

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
RESEND_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Summary Checklist

Before starting Stage 1, confirm understanding of:

- [ ] Non-competitive philosophy (no timers, leaderboards, or comparisons)
- [ ] Dual-role accounts (one user, multiple roles)
- [ ] Person vs Group distinction
- [ ] Four routine types (REGULAR, SMART, TEACHER_CLASSROOM, custom)
- [ ] Four task types (SIMPLE, MULTIPLE_CHECKIN, PROGRESS, SMART)
- [ ] Reset period logic (DAILY, WEEKLY, MONTHLY, CUSTOM)
- [ ] Goal aggregation (task-based, routine-based, mixed)
- [ ] Kiosk mode (code generation, single-use, session timeout)
- [ ] Co-parent permissions (READ_ONLY, TASK_COMPLETION, FULL_EDIT)
- [ ] Student-parent connection (6-digit codes)
- [ ] Tier limits (enforce on every create)
- [ ] Soft delete (ARCHIVED status, preserve TaskCompletion)
- [ ] RLS policies (database-level security)
- [ ] Stripe webhooks (subscription lifecycle)
- [ ] Marketplace versioning (semantic versioning, forking)

---

**You're now ready to start Stage 1!** 🚀

Refer back to this document whenever you need clarification on requirements, business rules, or implementation decisions. All edge cases have been considered and resolved.

Good luck with development!
