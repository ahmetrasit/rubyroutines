# Ruby Routines - Restrictions Gap Analysis & Implementation Plan

**Date:** November 18, 2025
**Purpose:** Comprehensive analysis of 4 person/routine connection restrictions

---

## RESTRICTION 1: Family Member (Parent's Child) Connections

### Requirement
A family member (managed and owned by a parent) can only be connected to:
- ✅ A teacher as a student
- ✅ Another parent (co-parent) as a member

**Cannot** be connected to:
- ❌ Another parent's account owner person
- ❌ A teacher's account owner person

### Current Implementation Status: ✅ FULLY IMPLEMENTED

**File:** `lib/services/person-sharing-code.ts`

**Lines 291-300:** Parent sharing validation
```typescript
// Parent sharing a child
if (ownerRoleType === 'PARENT') {
  // Can only be claimed by PARENT (co-parent) or TEACHER (student connection)
  if (claimerRoleType !== 'PARENT' && claimerRoleType !== 'TEACHER') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'A family member can only be shared with another parent (co-parent) or a teacher (student connection).',
    });
  }
}
```

**Lines 316-320:** Account owner prevention
```typescript
if (ownerPerson.isAccountOwner) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Account owner persons cannot be shared via person sharing codes. Please use co-parent or co-teacher invitations instead.',
  });
}
```

**Tests:** `__tests__/person-sharing-restrictions.test.ts`
- ✅ Should allow parent to share child with teacher
- ✅ Should allow parent to share child with another parent
- ✅ Should prevent parent from sharing child with PRINCIPAL role
- ✅ Should prevent generating invite for account owner person

### Gaps Identified: NONE

---

## RESTRICTION 2: Student (Teacher's Student) Connections

### Requirement
A student (managed and owned by a teacher) can only be connected to:
- ✅ Another teacher (classroom sharing)
- ✅ A parent (parent connection)

**Cannot** be connected to:
- ❌ Another parent's account owner person
- ❌ A teacher's account owner person

### Current Implementation Status: ✅ FULLY IMPLEMENTED

**File:** `lib/services/person-sharing-code.ts`

**Lines 326-334:** Teacher sharing validation
```typescript
// Teacher sharing a student
if (ownerRoleType === 'TEACHER') {
  // Can only be claimed by TEACHER (classroom sharing) or PARENT (parent connection)
  if (claimerRoleType !== 'TEACHER' && claimerRoleType !== 'PARENT') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'A student can only be shared with another teacher (classroom) or a parent (parent connection).',
    });
  }
}
```

**Tests:** `__tests__/person-sharing-restrictions.test.ts`
- ✅ Should allow teacher to share student with another teacher
- ✅ Should allow teacher to share student with parent
- ✅ Should prevent teacher from sharing student with SUPPORT role
- ✅ Should prevent claiming invite for account owner person

### Gaps Identified: NONE

---

## RESTRICTION 3: Account Owner Connections & Teacher Routine Assignments

### Requirement Part A: Account Owner Connections
A parent (account owner) can be connected to:
- ✅ Another parent (account owner) - Co-Parent system
- ✅ A student in a classroom - Student-Parent Connection

### Current Implementation Status: ✅ FULLY IMPLEMENTED

**Co-Parent System:**
- **Model:** `CoParent` (schema.prisma:610-629)
- **Router:** `lib/trpc/routers/coparent.ts`
- **Service:** `lib/services/invitation.service.ts`
- **Features:**
  - Email-based invitations
  - Permission levels: READ_ONLY, TASK_COMPLETION, FULL_EDIT
  - Specific children selection
  - Only primary parent can revoke

**Student-Parent Connection:**
- **Model:** `StudentParentConnection` (schema.prisma:654-678)
- **Router:** `lib/trpc/routers/connection.ts`
- **Service:** `lib/services/connection.service.ts`
- **Features:**
  - 4-word connection codes
  - 24-hour expiration
  - Rate limiting
  - Atomic transactions

### Requirement Part B: Teacher Routine Assignments
A teacher's routine in a classroom can be connected to a family member (kid)

### Current Implementation Status: ⚠️ DESIGN GAP

**What Exists:**
- `TEACHER_CLASSROOM` routine type defined (schema.prisma:246)
- Routines have `type` field

**What's Missing:**
- No mechanism for parents to view teacher's classroom routines
- No cross-role routine assignment
- No UI for parents to browse/assign teacher routines
- No service logic for copying or referencing teacher routines

**Recommendation:** Feature not critical for core functionality. Can be implemented later if needed.

### Gaps Identified:
- ⚠️ Teacher routine to parent's child assignment (LOW PRIORITY - design decision needed)

---

## RESTRICTION 4: Teacher-Only Routines (NEW FEATURE)

### Requirements

**1. Core Functionality:**
- Teacher can create student-specific routines for classroom organization
- Only teacher or co-teacher can complete these routines
- Not visible to students, parents, or in kiosk mode
- Although assigned to a student, routine belongs to teacher

**2. Auto-Generation:**
Default teacher-only routine must be created when:
- Student is first created by teacher
- Student is added to a classroom
- Student is restored from archive

**3. UI/UX:**
- Shown separately in collapsible section
- Created/edited in student page
- Task completion only for teacher/co-teacher
- Not visible to students or parents

**4. Visibility Rules:**
- Hidden from kiosk mode
- Hidden from student views
- Hidden from parent connections
- Only visible to:
  - Teacher who owns the routine
  - Co-teachers of the classroom

### Current Implementation Status: ❌ NOT IMPLEMENTED

**Progress So Far:**
- ✅ Added `isTeacherOnly: Boolean` field to Routine schema (schema.prisma:221)

**What Needs to Be Implemented:**

### Implementation Plan

#### Phase 1: Database Migration
**File:** Create new migration file
**Status:** Pending

**Tasks:**
1. Generate Prisma migration for `isTeacherOnly` field
2. Set default value to `false` for existing routines
3. Create index on `isTeacherOnly` for query performance

**Commands:**
```bash
npx prisma migrate dev --name add_is_teacher_only_to_routine
npx prisma generate
```

---

#### Phase 2: Service Layer - Auto-Creation Logic
**Status:** Pending

##### 2.1 Create Helper Function

**File:** Create `lib/services/teacher-only-routine.service.ts`

**Function:** `createDefaultTeacherOnlyRoutine()`
```typescript
import { prisma } from '@/lib/prisma';
import { EntityStatus } from '@/lib/types/prisma-enums';

export async function createDefaultTeacherOnlyRoutine(
  roleId: string,
  personId: string,
  roleTy pe: string
) {
  // Only create for TEACHER roles
  if (roleType !== 'TEACHER') {
    return null;
  }

  // Check if person already has a teacher-only routine
  const existing = await prisma.routine.findFirst({
    where: {
      roleId,
      isTeacherOnly: true,
      assignments: {
        some: { personId }
      },
      status: EntityStatus.ACTIVE
    }
  });

  if (existing) {
    return existing; // Already exists
  }

  // Create default teacher-only routine
  const routine = await prisma.routine.create({
    data: {
      roleId,
      name: '📋 Teacher Notes',
      description: 'Private routine for teacher notes and tracking',
      type: 'REGULAR',
      resetPeriod: 'DAILY',
      color: '#8B5CF6', // Purple color
      isTeacherOnly: true,
      status: EntityStatus.ACTIVE,
      assignments: {
        create: {
          personId
        }
      }
    }
  });

  return routine;
}
```

##### 2.2 Update Person Creation

**File:** `lib/trpc/routers/person.ts`
**Lines:** 192-214 (inside `create` mutation)

**Add import:**
```typescript
import { createDefaultTeacherOnlyRoutine } from '@/lib/services/teacher-only-routine.service';
```

**After line 211 (after creating Daily Routine), add:**
```typescript
// Auto-create teacher-only routine if this is a TEACHER role
if (role.type === 'TEACHER' && !person.isAccountOwner) {
  await createDefaultTeacherOnlyRoutine(input.roleId, person.id, role.type);
}
```

##### 2.3 Update Person Restore

**File:** `lib/trpc/routers/person.ts`
**Lines:** 315-331 (inside `restore` mutation)

**After line 329 (before return), add:**
```typescript
// Get role type to check if teacher
const role = await ctx.prisma.role.findUnique({
  where: { id: existingPerson.roleId },
  select: { type: true }
});

// Re-create teacher-only routine if this is a TEACHER role and person is not account owner
if (role?.type === 'TEACHER') {
  const restoredPerson = await ctx.prisma.person.findUnique({
    where: { id: input.id },
    select: { isAccountOwner: true }
  });

  if (!restoredPerson?.isAccountOwner) {
    await createDefaultTeacherOnlyRoutine(existingPerson.roleId, input.id, role.type);
  }
}
```

##### 2.4 Update Group Member Addition

**File:** `lib/trpc/routers/group.ts`
**Lines:** After 248 (inside `addMember` mutation, after transaction)

**Add import:**
```typescript
import { createDefaultTeacherOnlyRoutine } from '@/lib/services/teacher-only-routine.service';
```

**After line 260+ (after member is added), add:**
```typescript
// Get role and person details
const role = await ctx.prisma.role.findUnique({
  where: { id: group.roleId },
  select: { type: true }
});

const addedPerson = await ctx.prisma.person.findUnique({
  where: { id: input.personId },
  select: { isAccountOwner: true }
});

// Create teacher-only routine if adding student to classroom
if (role?.type === 'TEACHER' && !addedPerson?.isAccountOwner) {
  await createDefaultTeacherOnlyRoutine(group.roleId, input.personId, role.type);
}
```

---

#### Phase 3: Visibility Filters
**Status:** Pending

##### 3.1 Kiosk Mode Filter

**File:** Find kiosk mode routine query file

**Search for:** `app/kiosk` or routine queries in kiosk

**Add filter:**
```typescript
where: {
  // ... existing filters
  isTeacherOnly: false, // CRITICAL: Exclude teacher-only routines
  status: EntityStatus.ACTIVE
}
```

**Files to Update:**
- `app/kiosk/[code]/page.tsx` (if querying routines)
- Any kiosk-related routine query

##### 3.2 Student View Filter (if applicable)

**Search for:** Student-facing routine queries

**Add filter:**
```typescript
where: {
  isTeacherOnly: false, // Students cannot see teacher-only routines
}
```

##### 3.3 Parent View Filter

**File:** Parent connections or person views

**Add filter:**
```typescript
where: {
  isTeacherOnly: false, // Parents cannot see teacher-only routines via connections
}
```

##### 3.4 Routine List Queries

**File:** `lib/trpc/routers/routine.ts`

**Find all `findMany` queries and segment:**
- Regular routines: `isTeacherOnly: false` OR `undefined`
- Teacher-only routines: Separate query with `isTeacherOnly: true`

**Example:**
```typescript
// Regular routines
const regularRoutines = await ctx.prisma.routine.findMany({
  where: {
    roleId: input.roleId,
    isTeacherOnly: false,
    status: EntityStatus.ACTIVE
  }
});

// Teacher-only routines (only for teachers)
const teacherOnlyRoutines = role.type === 'TEACHER'
  ? await ctx.prisma.routine.findMany({
      where: {
        roleId: input.roleId,
        isTeacherOnly: true,
        status: EntityStatus.ACTIVE
      }
    })
  : [];

return {
  regular: regularRoutines,
  teacherOnly: teacherOnlyRoutines
};
```

---

#### Phase 4: Access Control
**Status:** Pending

##### 4.1 Task Completion Validation

**File:** `lib/trpc/routers/task.ts` or task completion endpoint

**Find:** `completeTask` or similar mutation

**Add validation:**
```typescript
// Get routine to check if teacher-only
const task = await ctx.prisma.task.findUnique({
  where: { id: input.taskId },
  include: {
    routine: {
      include: {
        role: {
          select: { type: true, userId: true }
        }
      }
    }
  }
});

if (!task) {
  throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
}

// If teacher-only routine, verify user is teacher or co-teacher
if (task.routine.isTeacherOnly) {
  const isOwner = task.routine.role.userId === ctx.user.id;

  // Check if user is co-teacher
  const isCoTeacher = await ctx.prisma.coTeacher.findFirst({
    where: {
      teacherRoleId: task.routine.roleId,
      coTeacherRole: {
        userId: ctx.user.id
      },
      status: EntityStatus.ACTIVE
    }
  });

  if (!isOwner && !isCoTeacher) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only the teacher or co-teacher can complete tasks in teacher-only routines'
    });
  }
}
```

##### 4.2 Routine Edit/Delete Validation

**File:** `lib/trpc/routers/routine.ts`

**Add similar validation to update/delete mutations:**
```typescript
// Verify user has permission to modify teacher-only routine
if (routine.isTeacherOnly) {
  // Same validation as above
}
```

---

#### Phase 5: UI Components
**Status:** Pending

##### 5.1 Student Page - Teacher-Only Section

**File:** Student detail page (likely `app/(dashboard)/[role]/students/[id]/page.tsx` or similar)

**Add collapsible section:**
```tsx
{role.type === 'TEACHER' && (
  <Collapsible>
    <CollapsibleTrigger className="flex items-center gap-2 text-purple-600">
      <ChevronRight className="h-4 w-4" />
      Teacher-Only Routines
      <span className="text-xs text-gray-500">(Private - Not visible to students)</span>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="mt-4 space-y-4">
        {teacherOnlyRoutines.map(routine => (
          <TeacherOnlyRoutineCard key={routine.id} routine={routine} />
        ))}
      </div>
    </CollapsibleContent>
  </Collapsible>
)}
```

##### 5.2 Routine Form - Teacher-Only Toggle

**File:** Routine creation/edit form

**Add checkbox for teacher roles:**
```tsx
{role.type === 'TEACHER' && (
  <div className="flex items-center space-x-2">
    <Checkbox
      id="isTeacherOnly"
      checked={formData.isTeacherOnly}
      onCheckedChange={(checked) =>
        setFormData(prev => ({ ...prev, isTeacherOnly: checked }))
      }
    />
    <Label htmlFor="isTeacherOnly">
      Teacher-Only Routine
      <span className="block text-xs text-gray-500">
        Only visible to you and co-teachers. Hidden from students and kiosk mode.
      </span>
    </Label>
  </div>
)}
```

##### 5.3 Visual Indicators

**Add purple badge/indicator on teacher-only routines:**
```tsx
{routine.isTeacherOnly && (
  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
    <Lock className="h-3 w-3 mr-1" />
    Teacher Only
  </Badge>
)}
```

---

#### Phase 6: Testing
**Status:** Pending

##### 6.1 Unit Tests

**File:** Create `__tests__/teacher-only-routines.test.ts`

**Test Cases:**
```typescript
describe('Teacher-Only Routines', () => {
  describe('Auto-Creation', () => {
    it('should create teacher-only routine when teacher creates student');
    it('should create teacher-only routine when student added to classroom');
    it('should create teacher-only routine when student is restored');
    it('should NOT create teacher-only routine for parent role');
    it('should NOT create teacher-only routine for account owner person');
    it('should NOT duplicate if teacher-only routine already exists');
  });

  describe('Visibility', () => {
    it('should exclude teacher-only routines from kiosk mode');
    it('should exclude teacher-only routines from student queries');
    it('should exclude teacher-only routines from parent connection views');
    it('should show teacher-only routines to owner teacher');
    it('should show teacher-only routines to co-teacher');
  });

  describe('Access Control', () => {
    it('should allow teacher to complete teacher-only routine tasks');
    it('should allow co-teacher to complete teacher-only routine tasks');
    it('should prevent students from completing teacher-only routine tasks');
    it('should prevent parents from completing teacher-only routine tasks');
    it('should prevent non-co-teachers from editing teacher-only routines');
  });

  describe('Edge Cases', () => {
    it('should handle person restore with existing teacher-only routine');
    it('should handle removing student from classroom');
    it('should archive teacher-only routine when student is deleted');
  });
});
```

##### 6.2 Integration Tests

**File:** Add to existing integration test files

**Scenarios:**
- Complete workflow: Create student → Check teacher-only routine exists → Complete task → Verify in database
- Kiosk flow: Generate kiosk code → Login → Verify teacher-only routines not shown
- Co-teacher flow: Create co-teacher → Verify can access teacher-only routines

##### 6.3 E2E Tests (if Playwright configured)

**Scenarios:**
- Teacher creates student, sees teacher-only section
- Teacher completes task in teacher-only routine
- Kiosk mode doesn't show teacher-only routines
- Student view doesn't show teacher-only routines

---

## SECURITY CHECKLIST

### Database Level
- [x] `isTeacherOnly` field added with proper default
- [ ] Migration tested on sample database
- [ ] Index created for query performance

### Service Layer
- [ ] Auto-creation only for TEACHER roles
- [ ] Auto-creation skips account owner persons
- [ ] Duplicate prevention logic in place
- [ ] Role type validation in all mutations

### API Level (tRPC)
- [ ] Task completion validates teacher-only access
- [ ] Routine edit/delete validates teacher-only access
- [ ] All queries filter teacher-only appropriately
- [ ] Co-teacher access properly checked

### UI Level
- [ ] Teacher-only toggle only shown to teachers
- [ ] Teacher-only section only rendered for teachers
- [ ] Visual indicators clearly mark teacher-only routines
- [ ] Kiosk mode components exclude teacher-only

### Data Isolation
- [ ] Students cannot see teacher-only routines
- [ ] Parents cannot see teacher-only routines via connections
- [ ] Kiosk mode excludes teacher-only routines
- [ ] Person sharing excludes teacher-only routines

---

## IMPLEMENTATION ORDER

1. **Phase 1:** Database Migration (15 min)
2. **Phase 2:** Service Layer Auto-Creation (30 min)
3. **Phase 3:** Visibility Filters (45 min)
4. **Phase 4:** Access Control (30 min)
5. **Phase 5:** UI Components (60 min)
6. **Phase 6:** Testing (90 min)

**Total Estimated Time:** 4-5 hours

---

## ROLLOUT PLAN

### Step 1: Database Migration
- Run migration in development
- Verify existing routines have `isTeacherOnly = false`
- Test rollback procedure

### Step 2: Backend Implementation
- Implement service layer
- Add filters to all queries
- Add access control validation
- Run unit tests

### Step 3: Frontend Implementation
- Add UI components
- Add visual indicators
- Test in development

### Step 4: Integration Testing
- Test complete workflows
- Test edge cases
- Performance testing

### Step 5: Deployment
- Deploy to staging
- Run integration tests in staging
- Monitor for errors
- Deploy to production

---

## FILES TO MODIFY

### New Files
1. `lib/services/teacher-only-routine.service.ts` - Auto-creation logic

### Modified Files
1. `prisma/schema.prisma` - Add isTeacherOnly field ✅
2. `lib/trpc/routers/person.ts` - Auto-creation on create/restore
3. `lib/trpc/routers/group.ts` - Auto-creation on addMember
4. `lib/trpc/routers/routine.ts` - Visibility filters, access control
5. `lib/trpc/routers/task.ts` - Task completion validation
6. `app/kiosk/[code]/page.tsx` - Kiosk mode filter
7. Student page component - Teacher-only section UI
8. Routine form component - Teacher-only toggle

### Test Files
1. `__tests__/teacher-only-routines.test.ts` - New test file
2. Update existing integration tests

---

## CONCLUSION

### Restrictions 1 & 2: ✅ COMPLETE
Person sharing restrictions are fully implemented with comprehensive validation and testing.

### Restriction 3: ⚠️ PARTIAL
Account owner connections are complete. Teacher routine assignments need design decision and can be deferred.

### Restriction 4: 🚧 IN PROGRESS
Teacher-only routines have been designed and are ready for implementation. All code locations identified, logic planned, and security considerations documented.

**Next Steps:** Begin Phase 1 - Database Migration
