# CoParent Implementation Guide

**Purpose:** Document the implementation process for CoParent feature. Same approach will be used for CoTeacher.
**Status:** COMPLETE ✅ (Both CoParent and CoTeacher implemented)

---

## Feature Understanding

### CoParent vs PersonConnection

| Aspect | PersonConnection | CoParent Linking |
|--------|------------------|------------------|
| **Kiosks** | 2 separate (home/school) | 1 merged (either parent) |
| **Tasks** | NOT merged | ARE merged |
| **Visibility** | Completion status only | Completion status + merged tasks |
| **Role types** | PARENT ↔ TEACHER | PARENT ↔ PARENT |

### CoParent Flow

```
DAD (Lead Parent)                    MOM (Co-Parent)
================                     ===============

1. INVITE FLOW:
   Select kids + routines per kid
   ├── Kid A
   │   ├── Morning Routine ✓
   │   └── Homework Routine ✓
   └── Kid B
       └── Chores Routine ✓

   → Creates Invitation with sharedPersons:
     [{personId: "kidA", routineIds: ["morning", "homework"]},
      {personId: "kidB", routineIds: ["chores"]}]

2. ACCEPT FLOW:
                                     Mom receives invitation
                                     Links each shared kid to her kid:
                                     ├── Dad's Kid A → Mom's Emma
                                     └── Dad's Kid B → Mom's (new) Jake

                                     → Creates CoParentPersonLink records

3. KIOSK (merged):
   Either Dad's code OR Mom's code shows:
   ├── Morning Routine (Dad's)
   ├── Homework Routine (Dad's)
   ├── Evening Routine (Mom's)
   └── Reading Time (Mom's)

4. DASHBOARD (completion visibility only):
   Mom's dashboard shows:
   ├── Her routines for Emma
   └── Completion STATUS of Dad's shared routines (read-only)

   Dad's dashboard shows:
   ├── His routines for Kid A
   └── Completion STATUS of Mom's shared routines (read-only)
```

---

## Implementation Steps

## Implementation Status: COMPLETE ✅

All 7 steps implemented and verified by review agents.

---

### Step 1: Schema Changes ✅ COMPLETE

**New Model: CoParentPersonLink**
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

**Updated Models:**
- CoParent: Added `personLinks CoParentPersonLink[]`
- Person: Added `primaryCoParentLinks`, `linkedCoParentLinks`
- Invitation: Added `sharedPersons Json` for `[{personId, routineIds}]`

### Step 2: Invite UI ✅ COMPLETE
- Updated InviteModal to show kids with expandable routine checkboxes
- Built `sharedPersons` array instead of flat `personIds`

### Step 3: Invite Backend ✅ COMPLETE
- Updated coparent.invite to accept `sharedPersons`
- Creates CoParentPersonLink records for each kid

### Step 4: Accept UI ✅ COMPLETE
- Shows each shared kid from invitation
- Co-parent can select/create their kid to link

### Step 5: Accept Backend ✅ COMPLETE
- Updated invitation acceptance to set `linkedPersonId` on each CoParentPersonLink
- Updates status to ACTIVE

### Step 6: Kiosk Merging ✅ COMPLETE
- `getPersonTasks` checks for CoParentPersonLink where this person is linked
- Fetches and merges tasks from primaryPerson's routines

### Step 7: Dashboard Visibility ✅ COMPLETE
- Person dashboard shows completion status of linked person's shared routines
- Read-only view, not full dashboard access

---

## CoTeacher Implementation ✅ COMPLETE

Same pattern implemented with the following structure:

| Aspect | CoParent | CoTeacher |
|--------|----------|-----------|
| Link model | CoParentPersonLink | CoTeacherStudentLink |
| Primary | Dad's Kid | Lead Teacher's Student |
| Linked | Mom's Kid | Co-Teacher's Student |
| Role types | PARENT ↔ PARENT | TEACHER ↔ TEACHER |
| Context | Home ↔ Home | Classroom ↔ Classroom |

**All Components Implemented:**
- ✅ Schema pattern (PersonLink model)
- ✅ Invite UI (per-person routine selection)
- ✅ Accept UI (person linking)
- ✅ Kiosk merge logic
- ✅ Dashboard visibility logic

---

## Testing Checklist

For each step:
- [x] Schema validates (`npx prisma validate`)
- [x] Types generate (`npx prisma generate`)
- [x] Build passes (`npm run build`)
- [x] Existing functionality not broken
- [x] New feature works as intended

---

## Implementation Summary

### Files Modified

**Schema:**
- `prisma/schema.prisma` - Added CoParentPersonLink, CoTeacherStudentLink models

**Backend Services:**
- `lib/services/invitation.service.ts` - Accept flow with person linking
- `lib/services/coparent.service.ts` - CoParent invite/link logic
- `lib/services/coteacher.service.ts` - CoTeacher invite/link logic

**API Routes:**
- `lib/trpc/routers/kiosk.ts` - Task merging for co-parent/co-teacher links
- `lib/trpc/routers/person.ts` - Visibility filtering for linked persons
- `lib/trpc/routers/task.ts` - Completion status visibility
- `lib/trpc/routers/coparent.ts` - CoParent TRPC procedures
- `lib/trpc/routers/coteacher.ts` - CoTeacher TRPC procedures

**Frontend Components:**
- `components/coparent/InviteModal.tsx` - Per-kid routine selection
- `components/coteacher/InviteModal.tsx` - Per-student routine selection
- `app/invitations/accept/page.tsx` - Kid/student linking UI

### Database Tables Created

| Table | Purpose |
|-------|---------|
| `CoParentPersonLink` | Links Dad's Kid ↔ Mom's Kid with shared routines |
| `CoTeacherStudentLink` | Links Lead Teacher's Student ↔ Co-Teacher's Student |

### Key Features Implemented

**CoParent:**
1. Per-kid routine selection in invite flow
2. Kid linking on invitation accept
3. Merged kiosk view (either parent's code works)
4. Completion status visibility in each parent's dashboard

**CoTeacher:**
1. Per-student routine selection in invite flow
2. Student linking on invitation accept
3. Merged kiosk view (either teacher's code works)
4. Completion status visibility in each teacher's dashboard

---

*Implementation complete - Ready for deployment*
