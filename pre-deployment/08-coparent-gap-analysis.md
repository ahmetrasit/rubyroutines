# CoParent Feature Gap Analysis

**Date:** 2025-11-30
**Updated:** 2025-12-01
**Status:** RESOLVED - All Gaps Implemented ✅

> **Note:** CoTeacher follows the same implementation pattern. All patterns documented here apply equally to CoTeacher.

---

## Intended Behavior (User Requirements)

### 1. Invitation Flow
- Dad selects which kids to share, AND for each kid, which routines to share
- Example: Kid A (Morning + Homework routines), Kid B (Chores routine)
- Mom accepts and chooses which of HER kids to link to each shared kid (or creates new)
- Creates links: Dad's Kid A → Mom's Kid A, Dad's Kid B → Mom's Kid B

### 2. Kiosk Behavior
- Both Dad's kiosk code AND Mom's kiosk code work
- Kid sees ALL routines from both parents merged in single kiosk view

### 3. Visibility Control
- Kid's kiosk: ALL routines from both parents merged
- Mom's dashboard: Shows HER routines + completion STATUS of Dad's shared routines (read-only)
- Mom does NOT see Dad's dashboard - only completion status appears in her own dashboard
- Dad's dashboard: Shows HIS routines + completion STATUS of Mom's shared routines (read-only)

---

## Current Implementation

### Database Models

**Invitation** (schema.prisma:705-732)
```prisma
model Invitation {
  personIds    String[]  // Which kids to share
  // MISSING: routineIds - no routine-level selection
}
```

**CoParent** (schema.prisma:760-779)
```prisma
model CoParent {
  primaryRoleId   String    // Dad's role
  coParentRoleId  String    // Mom's role
  personIds       String[]  // Dad's kids shared
  // MISSING: routineIds for visibility control
  // MISSING: linkedPersonIds to link Mom's Person records
}
```

**Person** (no co-parent linking fields)
```prisma
model Person {
  // MISSING: linkedCoParentPersonId or similar
}
```

### Accept Flow (invitation.service.ts:214-247)
```typescript
async function acceptCoParentInvitationTx(...) {
  // Creates CoParent record
  await tx.coParent.create({
    data: {
      primaryRoleId: invitation.inviterRoleId,
      coParentRoleId: acceptingRole.id,
      personIds: invitation.personIds,  // Dad's kids
      // MISSING: No prompt for Mom to select/link her kid
    }
  });
}
```

### Kiosk Task Fetching (kiosk.ts:203-296)
```typescript
getPersonTasks: kioskSessionRateLimitedProcedure
  .query(async ({ ctx, input }) => {
    const person = await ctx.prisma.person.findUnique({
      where: { id: input.personId },
      include: {
        assignments: { ... }  // Only THIS person's assignments
        // MISSING: No lookup for linked co-parent persons
        // MISSING: No merging of tasks from other accounts
      }
    });
  })
```

---

## Gap Summary

| Requirement | Status | Resolution |
|-------------|--------|------------|
| Dad selects kids + routines per kid | **IMPLEMENTED** ✅ | Added `sharedPersons` JSON field with `[{personId, routineIds}]` structure |
| Mom links her kid to each shared kid | **IMPLEMENTED** ✅ | Accept flow prompts for kid linking; CoParentPersonLink stores mapping |
| Person records linked as same child | **IMPLEMENTED** ✅ | `CoParentPersonLink` model with `primaryPersonId` → `linkedPersonId` |
| Both kiosk codes work | **IMPLEMENTED** ✅ | Kiosk authenticates via either parent's code |
| Merged kiosk view | **IMPLEMENTED** ✅ | `getPersonTasks` merges tasks from both parents |
| Routine-level visibility control | **IMPLEMENTED** ✅ | `routineIds[]` on CoParentPersonLink controls completion visibility |

---

## What Currently Works

| Feature | Status |
|---------|--------|
| Dad invites Mom via email | ✅ Works |
| Mom accepts, gets PARENT role | ✅ Works |
| CoParent record created | ✅ Works |
| READ_ONLY permission enforced | ✅ Works |
| Dad's kids stored in `personIds` | ✅ Works |

## What Current Implementation Does ✅

| Feature | Status | Implementation |
|---------|--------|----------------|
| Dashboard access | **CORRECT** ✅ | Mom sees completion status in HER dashboard (read-only) |
| Kid selection | **CORRECT** ✅ | Per-kid routine selection via `sharedPersons` |
| Person linking | **CORRECT** ✅ | Accept flow prompts Mom to link/create kids |
| Kiosk merging | **CORRECT** ✅ | Tasks merged from both parents in kiosk view |

---

## Implemented Changes (All Complete) ✅

### 1. Schema Changes ✅
**Implemented:** `CoParentPersonLink` model with full linking support
```prisma
model CoParentPersonLink {
  id              String   @id @default(cuid())
  coParentId      String
  primaryPersonId String   // Lead parent's kid
  linkedPersonId  String?  // Co-parent's kid (set on accept)
  routineIds      String[] // Shared routines for visibility
  status          String   @default("PENDING")

  coParent      CoParent @relation(...)
  primaryPerson Person   @relation("PrimaryCoParentPerson", ...)
  linkedPerson  Person?  @relation("LinkedCoParentPerson", ...)
}
```

### 2. Accept Flow ✅
- **Implemented:** Accept UI prompts co-parent to link/create kids
- **Implemented:** Backend sets `linkedPersonId` on CoParentPersonLink

### 3. Kiosk Merging ✅
- **Implemented:** `getPersonTasks` checks for CoParentPersonLink records
- **Implemented:** Tasks from both parents merged in kiosk view
- **Implemented:** Either parent's kiosk code works

### 4. Visibility Control ✅
- **Implemented:** Per-kid routine selection in invite flow
- **Implemented:** Completion status filtered by `routineIds`

---

## Implementation Complete ✅

| Component | Status | Files Modified |
|-----------|--------|----------------|
| Schema changes | ✅ Complete | prisma/schema.prisma |
| Invite UI (routine selection) | ✅ Complete | components/coparent/InviteModal.tsx |
| Accept UI (kid linking) | ✅ Complete | app/invitations/accept/page.tsx |
| Accept backend | ✅ Complete | lib/services/invitation.service.ts |
| Kiosk task merging | ✅ Complete | lib/trpc/routers/kiosk.ts |
| Visibility filtering | ✅ Complete | lib/trpc/routers/person.ts, task.ts |

---

## Status: READY FOR DEPLOYMENT ✅

All originally identified gaps have been resolved. The CoParent feature now provides:
- Per-kid routine selection in invite flow
- Kid linking on accept (co-parent links their kids to shared kids)
- Merged kiosk experience (either parent's code works, tasks merged)
- Completion status visibility (read-only in each parent's dashboard)

**CoTeacher:** Same pattern implemented for Teacher ↔ Teacher collaboration.

---

*Analysis performed by Claude Code*

---

## CRITICAL CLARIFICATION: PersonConnection vs CoParent Linking

These are **TWO COMPLETELY DIFFERENT PATTERNS** that serve different purposes. This section clarifies the distinction to prevent implementation confusion.

---

### PersonConnection (Kid ↔ Student) - SEPARATE KIOSKS

**Purpose:** Same physical child has two check-in contexts (home + school)

**Use Case:** A parent's kid (home context) is also a teacher's student (school context)

**How It Works:**
1. Kid exists in Parent's account (home context)
2. Student exists in Teacher's account (school context)
3. They are connected via `PersonConnection` model
4. **Kid has HOME kiosk** - checks in at home using parent's routines
5. **Student has SCHOOL kiosk** - checks in at school using teacher's routines
6. Completion **STATUS** is visible across both dashboards (parent sees school completions, teacher sees home completions)

**Database Model:** `PersonConnection` (schema.prisma:912-950)
```prisma
model PersonConnection {
  originRoleId   String  // Role owning the observed person
  originPersonId String  // Person being observed
  targetRoleId   String  // Role doing the observing
  targetPersonId String  // Person receiving the observation
  scopeMode      String  // ALL or SELECTED
  // ...visibility controls
}
```

**Key Characteristics:**
- **TWO DIFFERENT KIOSKS** - Kid and Student each have their own kiosk codes
- **Tasks are NOT merged** - Each context shows only its own routines/tasks
- **Only visibility shared** - Completion status flows between accounts
- **Different role types** - Typically PARENT ↔ TEACHER connections

**Service:** `lib/services/person-connection.service.ts` handles:
- Code generation for connecting persons
- Type validation (Student → Kid, Kid → Student)
- Scope control (which routines/goals are visible to observer)

---

### CoParent Linking (Dad's Kid ↔ Mom's Kid) - MERGED KIOSK

**Purpose:** Same physical child has two parent accounts (co-parenting/divorced families)

**Use Case:** Dad and Mom both have accounts, and their kids need to check in from either household

**Intended Behavior:**
1. Dad's Kid exists in Dad's account
2. Mom's Kid exists in Mom's account (representing the SAME physical child)
3. They are linked via `CoParent` relationship (with person mapping)
4. **Kid uses ONE MERGED KIOSK** - either Dad's code OR Mom's code works
5. Kiosk shows **MERGED tasks** from BOTH Dad's routines AND Mom's routines
6. Completion status visible to both parents in their respective dashboards

**Key Characteristics:**
- **ONE MERGED KIOSK** - Any parent's code works for the same child
- **Tasks ARE merged** - Child sees combined routines from both parents
- **Visibility + task access shared** - Full completion visibility plus merged task lists
- **Same role types** - PARENT ↔ PARENT connections only

---

### Side-by-Side Comparison

| Aspect | PersonConnection | CoParent Linking |
|--------|------------------|------------------|
| **Number of Kiosks** | 2 separate (home + school) | 1 merged (either parent's code) |
| **Task Display** | Separate per context | Merged from both parents |
| **What's Shared** | Completion status only | Completion status + merged tasks |
| **Role Types** | PARENT ↔ TEACHER | PARENT ↔ PARENT |
| **Physical Child** | Same child, different contexts | Same child, same context |
| **Kiosk Code** | Each person has own code | Either parent's code works |
| **Implementation** | ✅ Fully implemented | ⚠️ Significant gaps |

---

### Implementation Status

| Feature | PersonConnection | CoParent |
|---------|------------------|----------|
| Database model | ✅ Complete | ✅ Complete (CoParentPersonLink) |
| Connection codes | ✅ Complete | ✅ Invitation flow works |
| Type validation | ✅ Complete | N/A (both PARENT) |
| Scope control | ✅ Complete | ✅ routineIds per kid implemented |
| Dashboard visibility | ✅ Complete | ✅ Completion status in own dashboard |
| Kiosk behavior | ✅ Separate kiosks | ✅ Merged kiosk implemented |

---

### Implementation Summary

**PersonConnection and CoParent serve different purposes and are both fully implemented.**

PersonConnection correctly implements separate kiosks with shared visibility for home/school contexts.

CoParent implements a **merged kiosk architecture**:
- ✅ Detects linked persons across accounts via CoParentPersonLink
- ✅ Merges routine/task lists from multiple accounts
- ✅ Either parent's kiosk code authenticates the linked child
- ✅ Task completions write back to correct origin account

**CoTeacher** follows the same pattern for Teacher ↔ Teacher collaboration.
