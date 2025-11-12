# Prisma Schema Reference

## Complete Schema File

**→ See `/prisma/schema.prisma` for the complete, ready-to-use schema**

The complete Prisma schema is now self-contained in `schema.prisma` (721 lines) with:
- 70+ models covering all entities
- All enums, relations, and indexes
- Full type safety with TypeScript
- Ready to deploy with `npx prisma db push`

## Database Setup

```bash
# 1. Install dependencies
npm install prisma @prisma/client

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Push schema to database
npx prisma db push

# 4. Generate Prisma client
npx prisma generate

# 5. (Optional) View data in Prisma Studio
npx prisma studio
```

## Quick Reference: Core Entities

### Authentication & Users
- **User** - Email, name, auth (one per email address)
- **Role** - PARENT, TEACHER, PRINCIPAL, SUPPORT (multiple per user)
- **VerificationCode** - 6-digit email verification codes

### People & Organization
- **Person** - Child (parent mode) or Student (teacher mode)
- **Group** - Family sub-groups or Classrooms
- **GroupMember** - Links persons to groups

### Routines & Tasks
- **Routine** - Collection of tasks (REGULAR, SMART, TEACHER_CLASSROOM)
- **RoutineAssignment** - Assign routine to person or group
- **Task** - Individual action (SIMPLE, MULTIPLE_CHECKIN, PROGRESS, SMART)
- **TaskCompletion** - Completion records (NEVER deleted, preserved for analytics)

### Goals & Conditions
- **Goal** - Progress tracking with targets
- **GoalTaskLink** - Link goals to specific tasks
- **GoalRoutineLink** - Link goals to routines
- **Condition** - Smart routine conditions (if X then Y)

### Kiosk Mode
- **Code** - 2-3 word codes for authentication-free access
- **ConnectionCode** - 6-digit codes for student-parent connection

### Sharing & Permissions
- **Invitation** - Email invitations (CO_PARENT, CO_TEACHER, SCHOOL_TEACHER, SCHOOL_SUPPORT)
- **CoParent** - Primary + co-parent relationship with granular permissions
- **CoTeacher** - Share classrooms between teachers
- **StudentParentConnection** - Link teacher's student to parent's child

### School Mode
- **School** - School entity for principals
- **SchoolMember** - Teachers and support staff in school

### Marketplace
- **MarketplaceItem** - Published routines/goals with versioning
- **MarketplaceRating** - 5-star ratings
- **MarketplaceComment** - Text comments (500 char max)
- **CommentFlag** - Flag inappropriate content

## Key Enums

```typescript
// Role types (one user can have multiple roles)
enum RoleType {
  PARENT
  TEACHER
  PRINCIPAL
  SUPPORT
}

// Subscription tiers
enum Tier {
  FREE      // Limited features
  BASIC     // $5/mo
  PREMIUM   // $10/mo
  SCHOOL    // $25/mo
}

// Task types
enum TaskType {
  SIMPLE            // Single check-in (e.g., "Brush teeth")
  MULTIPLE_CHECKIN  // Multiple times (e.g., "Drink water 8x")
  PROGRESS          // Numeric value (e.g., "Read 20 pages")
  SMART             // Conditional visibility
}

// Reset periods
enum ResetPeriod {
  DAILY     // Resets at midnight
  WEEKLY    // Resets on specific day (Monday-Sunday)
  MONTHLY   // Resets on specific date (1-31)
  CUSTOM    // Manual reset
}
```

## Entity Status Pattern

All major entities use soft delete:

```typescript
enum EntityStatus {
  ACTIVE
  ARCHIVED  // Soft deleted
}
```

**Important:** TaskCompletion records are NEVER deleted to preserve analytics data.

## Relationships

```
User (1) ──┬──> (N) Role
           │
           └──> (N) VerificationCode

Role (1) ──┬──> (N) Person
           ├──> (N) Group
           ├──> (N) Routine
           └──> (N) Goal

Routine (1) ──> (N) Task
Task (1) ──> (N) TaskCompletion
Goal (1) ──┬──> (N) GoalTaskLink ──> Task
           └──> (N) GoalRoutineLink ──> Routine

CoParent: primaryRole ←→ coParentRole (with personIds array)
CoTeacher: group ←→ primaryTeacherRole + coTeacherRole
StudentParentConnection: teacherRole + studentPerson ←→ parentRole + parentPerson
```

## Row Level Security (RLS)

**→ See `/supabase/policies.sql` for complete RLS policies**

All tables have RLS enabled with policies for:
- ✅ Users own their data
- ✅ Co-parents access shared children/routines
- ✅ Co-teachers access shared classrooms
- ✅ Parents see connected students' tasks
- ✅ Marketplace items are public (read-only)

## Critical Implementation Notes

### 1. Dual-Role Accounts
One user can have both PARENT and TEACHER roles simultaneously. Always query by roleId, never assume one role per user.

```typescript
// ❌ Wrong
const role = await prisma.role.findFirst({ where: { userId } });

// ✅ Correct
const roles = await prisma.role.findMany({ where: { userId } });
```

### 2. Soft Delete
Use status field for deletion. NEVER hard delete entities except:
- Unverified accounts after 7 days
- Expired codes after 30 days

```typescript
// ✅ Correct soft delete
await prisma.person.update({
  where: { id },
  data: { status: 'ARCHIVED', archivedAt: new Date() }
});
```

### 3. TaskCompletion Preservation
TaskCompletion records must NEVER be deleted. They're the source of truth for analytics.

### 4. Reset Periods
Task completions are filtered by reset period start date:

```typescript
const periodStart = getResetPeriodStart(routine.resetPeriod, routine.resetDay);
const completions = await prisma.taskCompletion.findMany({
  where: {
    taskId,
    completedAt: { gte: periodStart }
  }
});
```

### 5. Tier Limits
Enforce tier limits on every CREATE operation:

```typescript
const currentCount = await prisma.person.count({ where: { roleId } });
await checkTierLimit(role.tier, 'persons', currentCount);
```

## Common Queries

### Get user's roles
```typescript
const roles = await prisma.role.findMany({
  where: { userId }
});
```

### Get all persons for a role (including co-parent access)
```typescript
const ownPersons = await prisma.person.findMany({
  where: { roleId, status: 'ACTIVE' }
});

const sharedPersons = await prisma.person.findMany({
  where: {
    role: {
      coParentsAsPrimary: {
        some: {
          coParentRole: { userId },
          status: 'ACTIVE',
          personIds: { has: personId }
        }
      }
    }
  }
});
```

### Get today's tasks for a person
```typescript
const startOfDay = new Date().setHours(0, 0, 0, 0);
const tasks = await prisma.task.findMany({
  where: {
    routine: {
      assignments: {
        some: { personId }
      },
      status: 'ACTIVE'
    },
    status: 'ACTIVE'
  },
  include: {
    completions: {
      where: {
        personId,
        completedAt: { gte: new Date(startOfDay) }
      }
    }
  }
});
```

## Migration Commands

```bash
# Push schema changes to database (development)
npx prisma db push

# Create migration file (production)
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

## Troubleshooting

### Error: "Invalid `prisma.X.create()` invocation"
- Check that all required fields are provided
- Verify foreign key references exist
- Ensure enum values match schema definition

### Error: "Unique constraint failed"
- Check for existing records with same unique field
- Common: email (users), code (codes), token (invitations)

### Error: "Foreign key constraint failed"
- Ensure referenced record exists before creating relationship
- Example: Create Role before creating Person

### RLS Policy Blocks Query
- Verify user is authenticated (auth.uid() returns value)
- Check policy matches your use case
- Test with Supabase SQL Editor to debug policy

## Next Steps

1. ✅ Schema created (`schema.prisma`)
2. → Push to database (`npx prisma db push`)
3. → Apply RLS policies (`/supabase/policies.sql`)
4. → Generate client (`npx prisma generate`)
5. → Start building API endpoints (Stage 2)
