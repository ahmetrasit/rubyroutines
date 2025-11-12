# Prisma Schema

## Complete Data Model

The complete Prisma schema with all entities is available in the original gap analysis conversation.

**Key entities to implement:**

### Core Entities
- User (auth, email, password)
- Role (parent, teacher, principal, support_staff)
- Person (adults, children)
- Group (families, classrooms, rooms)

### Routines & Tasks
- Routine (regular, smart, teacher_classroom)
- Task (simple, multiple_checkin, progress, smart)
- TaskCompletion (tracking with timestamps)
- VisibilityOverride (temporary visibility)

### Goals & Conditions
- Goal (daily, weekly, monthly)
- GoalTaskLink (many-to-many)
- GoalRoutineLink (many-to-many)
- GoalAchievement (historical)
- Condition (smart routine logic)
- ConditionReference (task/routine/goal references)

### Sharing & Permissions
- CoParentAccess
- CoParentChildAccess
- CoParentRoutineAccess
- CoTeacherAccess
- CoTeacherStudentAccess
- StudentParentConnection

### Codes & Sessions
- Code (kiosk, connection, invitation, sharing)
- KioskSession (active sessions)

### Marketplace
- MarketplaceItem
- MarketplaceVersion
- MarketplaceRating
- MarketplaceComment
- MarketplaceFlag

### Admin & Templates
- AdminConfig (all settings)
- TierLimit (tier-specific limits)
- AuditLog (change history)
- RoutineFolder (templates)
- GoalFolder (templates)

## Schema Implementation

During Stage 1, implement the complete schema from the detailed data model provided in the original conversation.

**Key considerations:**
1. All enums defined (UserStatus, RoleType, TaskType, etc.)
2. All indexes on foreign keys
3. All unique constraints
4. Row Level Security (RLS) policies for all tables
5. Soft delete pattern (status fields, not hard deletes)

## Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# View schema in Prisma Studio
npx prisma studio
```

## Row Level Security

All RLS policies are in `/supabase/policies.sql`

**Critical policies:**
- Users can only access their own roles
- Parents can only see their own children
- Teachers can only see their own students
- Co-parents can only see granted children/routines
- Marketplace items are public (read-only)
