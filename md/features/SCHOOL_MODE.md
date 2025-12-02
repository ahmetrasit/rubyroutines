# School Mode Feature Documentation

> **Status:** PLANNED (Deferred from v1.0)
> **Last Updated:** 2025-12-01

---

## Key Clarifications (Design Notes)

### Rooms in School Mode

- **Rooms = Classrooms for principals** where the principal is the default "person" and teachers/staff are members (like students in a classroom)
- **Default room:** "Principal's Office" - principal-only, created automatically on account setup
- **Teacher-only rooms:** Some rooms restricted to teachers (e.g., "Faculty Planning")
- **Mixed rooms:** Can include both teachers and support staff

### Support Staff Account

- **Staff account = Regular parent account** with a distinct visual name to differentiate from teachers
- Same functionality as parent accounts (create personal routines, complete tasks)
- Visual distinction helps avoid confusion in school context

### Four Core Purposes of School Mode

| # | Purpose | Description |
|---|---------|-------------|
| **1** | **Billing & Account Management** | Consolidated $25/mo billing, manage teacher accounts, onboard/offboard staff |
| **2** | **Task Assignment to Staff** | Assign tasks to teachers and support staff individually OR in room context (like assigning to a classroom) |
| **3** | **Bulk Student Task Assignment** | Assign tasks to ALL students across teachers with filtering: by classroom, grade level, or custom tags on students |
| **4** | **Parent Communication** | Send basic reminders to parents whose kids are connected to classrooms (tuition, parades, PTO meetings, school events) |

### Task Assignment Hierarchy

```
Principal can assign to:
├── Individual teacher or staff member
├── Room (all members of that room)
├── All students with filters:
│   ├── By classroom
│   ├── By grade level
│   └── By custom student tags
└── Parent communication (connected to students)
```

---

## Overview

School mode is a planned feature for managing schools with hierarchical role-based access. It allows principals to manage multiple teachers, support staff, and students within a school structure.

## Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | COMPLETE | School, SchoolMember tables ready |
| Type Definitions | COMPLETE | PRINCIPAL role, invitation types defined |
| Feature Flag | COMPLETE | `enableSchoolMode: true` in constants |
| RLS Policies | COMPLETE | Supabase policies configured |
| Invitation Logic | NOT STARTED | Throws "not implemented" error |
| Principal Dashboard | NOT STARTED | No UI exists |
| School Management UI | NOT STARTED | No CRUD pages |
| Authorization | NOT STARTED | No middleware checks |
| Billing/Tier | NOT STARTED | SCHOOL tier defined but not connected |

---

## Feature Description

### Role Hierarchy

```
User Account
├── Role [PARENT] - Manages kids at home
├── Role [TEACHER] - Manages classroom students
└── Role [PRINCIPAL] - Manages school organization
    └── School
        └── SchoolMember
            ├── Teachers (TEACHER roles)
            └── Support Staff (SUPPORT roles)
```

### Role Types

| Role | Theme Color | Tier | Description |
|------|-------------|------|-------------|
| PARENT | Blue (#3b82f6) | FAMILY/FREE | Parents managing kids' routines |
| TEACHER | Green (#22c55e) | CLASSROOM | Teachers managing classrooms |
| PRINCIPAL | Amber (#f59e0b) | SCHOOL | School leaders (standalone) |
| SUPPORT | Gray | N/A | Support staff within schools |

### Invitation Types

| Type | Status | Description |
|------|--------|-------------|
| CO_PARENT | Implemented | Invite another parent to share child access |
| CO_TEACHER | Implemented | Invite another teacher to share student access |
| SCHOOL_TEACHER | NOT IMPLEMENTED | Principal invites teacher to school |
| SCHOOL_SUPPORT | NOT IMPLEMENTED | Principal invites support staff to school |

---

## Database Schema

### School Table

```prisma
model School {
  id        String   @id @default(cuid())
  name      String
  address   String?
  website   String?
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  members   SchoolMember[]
}
```

### SchoolMember Table

```prisma
model SchoolMember {
  id        String   @id @default(cuid())
  schoolId  String
  roleId    String
  role      String   // 'PRINCIPAL', 'TEACHER', 'SUPPORT'
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  school    School   @relation(fields: [schoolId], references: [id])
  roleRef   Role     @relation(fields: [roleId], references: [id])

  @@unique([schoolId, roleId])
}
```

### RLS Policies

Location: `/supabase/policies.sql` (lines 776-835)

- School members can view their schools
- Principals can create/update schools
- Principals can manage school members

---

## Planned Features

### Principal Features

1. **School Management**
   - Create and configure school
   - Edit school details (name, address, website)
   - View school dashboard with member overview

2. **Teacher Management**
   - Invite teachers via email (SCHOOL_TEACHER invitation)
   - View all teachers in school
   - Remove teachers from school

3. **Support Staff Management**
   - Invite support staff via email (SCHOOL_SUPPORT invitation)
   - Assign routines to support staff
   - Remove support staff from school

4. **Routine Assignment**
   - Assign routines to students across teachers
   - Create school-wide routine templates
   - View routine completion across school

5. **Principal Room**
   - Principal's Office room (like Parents' Room)
   - View aggregated school statistics

### Support Staff Features

1. **Dashboard**
   - View principal-assigned routines (read-only, orange indicator)
   - Create personal routines
   - Similar to parent account functionality

2. **Auto-Linking**
   - Automatically linked to school on invitation acceptance
   - No manual school selection required

### Teacher Experience in School Mode

1. **Opt-In Visibility**
   - Choose which routines are visible to principal
   - Maintain classroom privacy by default

2. **School Resources**
   - Access school-wide routine templates
   - View support staff assignments

---

## Use Cases & UX Flows

### Principal Use Cases

#### UC-P1: School Setup & Initialization

```
Principal creates account → Sign up with PRINCIPAL role
    ↓
Create school profile (name, address, website)
    ↓
System auto-creates default rooms:
├── "Principal's Office" (principal auto-assigned)
└── "Teachers' Room" (all teachers auto-assigned)
    ↓
Ready to invite teachers
```

#### UC-P2: Teacher Invitation Flow

```
Principal dashboard → "Manage Teachers" → "Invite Teacher"
    ↓
Enter teacher email → System sends SCHOOL_TEACHER invitation
    ↓
Teacher clicks link → Creates account (if new) or adds role
    ↓
System creates SchoolMember record (role: TEACHER)
    ↓
Teacher appears in principal's roster with full classroom autonomy
```

#### UC-P3: Support Staff Invitation Flow

```
Principal dashboard → "Manage Support Staff" → "Invite"
    ↓
Enter email + role name (e.g., "School Counselor")
    ↓
System sends SCHOOL_SUPPORT invitation
    ↓
Staff accepts → SUPPORT role created → Auto-linked to school
    ↓
Staff sees principal-assigned routines (read-only, orange band)
```

#### UC-P4: Routine Assignment to Support Staff

```
Principal selects support staff member
    ↓
Assign routine: "Morning Supervision", "Dismissal Procedures"
    ↓
Routine appears in staff dashboard with orange "School-Assigned" band
    ↓
Staff can view and complete tasks but cannot edit/delete
```

#### UC-P5: Cross-Classroom Analytics

```
Principal dashboard → Analytics
    ↓
View aggregated data:
├── Total students across classrooms
├── Completion rates by classroom
├── Teacher performance metrics
├── Support staff engagement
    ↓
Export reports (CSV, JSON, PDF)
```

### Teacher Use Cases (Within School)

#### UC-T1: Daily Workflow in School Context

```
Teacher logs in → Role switcher shows TEACHER role in school context
    ↓
Dashboard shows:
├── My classrooms (full control)
├── School resources (shared routine library)
├── Principal assignments (view-only)
└── Support staff roster
    ↓
Normal operations: create routines, add students, track completion
    ↓
New: Can opt-in to share routines with principal
```

#### UC-T2: Opt-In Routine Sharing

```
Teacher creates classroom routine
    ↓
Option: "Share with Principal" toggle
    ↓
If enabled: Principal sees routine in school-wide view
    ↓
Teacher retains full edit control
    ↓
Can revoke sharing anytime
```

### Support Staff Use Cases

#### UC-S1: Onboarding Experience

```
Receives invitation email → Clicks link
    ↓
Creates account (if new) → SUPPORT role auto-linked to school
    ↓
First login dashboard shows:
├── "Welcome to [School Name]"
├── Principal-assigned routines (orange band)
├── Visible students/classrooms
└── Quick start guide
```

#### UC-S2: Managing Assigned Routines

```
Support staff dashboard
    ↓
Section 1: My Personal Routines
├── Create/edit/delete own routines
├── Full control
    ↓
Section 2: School-Assigned Routines (orange band)
├── "Morning Supervision" → 6 students
├── "Dismissal Procedures" → 8 students
├── Read-only (cannot edit)
├── Can complete tasks for assigned students
```

#### UC-S3: Counselor Workflow Example

```
School counselor as SUPPORT staff
    ↓
Principal assigns: "Student Check-In" routine with 15 students
    ↓
Counselor marks students complete as meetings happen
    ↓
Dashboard shows progress: "5/15 check-ins complete"
    ↓
Principal sees completion rates in analytics (not private notes)
```

### Invitation Flow Details

#### SCHOOL_TEACHER Invitation

```typescript
// System creates invitation record
{
  type: 'SCHOOL_TEACHER',
  inviterRoleId: principal.roleId,
  inviteeEmail: 'teacher@school.com',
  schoolId: school.id,
  expiresAt: now + 7 days,
  token: generateToken()
}
```

```
Email sent → Teacher clicks link → acceptInvitation()
    ↓
If no account: Create account + TEACHER role + SchoolMember
If has account: Add TEACHER role + SchoolMember
    ↓
Teacher can now manage own classrooms within school
```

#### SCHOOL_SUPPORT Invitation

```typescript
{
  type: 'SCHOOL_SUPPORT',
  inviterRoleId: principal.roleId,
  inviteeEmail: 'counselor@school.com',
  schoolId: school.id
}
```

```
Email sent → Staff clicks link → Creates SUPPORT role
    ↓
Auto-creates SchoolMember with role='SUPPORT'
    ↓
Dashboard shows assigned routines immediately
```

### Daily Usage Patterns

#### Principal Daily Pattern

| Time | Activity |
|------|----------|
| Morning | Check dashboard: overnight activity, pending invitations, alerts |
| Morning | Review analytics: completion rates, classrooms below target |
| Mid-day | Manage operations: assign routines, review performance, message teachers |
| End of day | Export reports, plan next day's assignments |

#### Teacher Daily Pattern (in School)

| Time | Activity |
|------|----------|
| Morning | Login, see classroom overview with school context |
| Morning | Optional: check school resource library |
| During day | Normal teaching: mark tasks, create routines, monitor |
| Afternoon | Optional: share new routine with principal |

#### Support Staff Daily Pattern

| Time | Activity |
|------|----------|
| Morning | View assigned routines (orange band), today's assignments |
| During day | Complete tasks, check in with students |
| End of day | Review completion status, add observations |

### Comparison: Related Features

| Feature | Relationship | Merging | Autonomy |
|---------|-------------|---------|----------|
| **PersonConnection** | Parent Kid ↔ Teacher Student | TWO separate kiosks | Each context independent |
| **CoParent** | Dad Kid ↔ Mom Kid (same child) | ONE merged kiosk | Tasks merged from both |
| **School Mode** | Principal → Teachers → Students | Hierarchical view | Teachers autonomous, principal sees analytics |

---

## Integration Points

### Existing Systems to Extend

1. **Role System** (`lib/types/prisma-enums.ts`)
   - Add PRINCIPAL to role switcher
   - Add SUPPORT role handling

2. **Invitation System** (`lib/services/invitation.service.ts`)
   - Implement SCHOOL_TEACHER acceptance
   - Implement SCHOOL_SUPPORT acceptance
   - Create SchoolMember record on acceptance

3. **Authorization** (`lib/trpc/middleware/`)
   - Add principal authorization checks
   - Verify school membership
   - Validate principal-only actions

4. **Billing** (`lib/services/stripe.service.ts`)
   - Connect SCHOOL tier ($25/month)
   - Handle school-wide billing

### New Components Required

1. **Pages**
   - `/app/(protected)/principal/` - Principal dashboard
   - `/app/(protected)/principal/school/` - School management
   - `/app/(protected)/principal/teachers/` - Teacher management
   - `/app/(protected)/principal/support/` - Support staff management

2. **tRPC Router**
   - `lib/trpc/routers/school.ts` - School CRUD operations
   - Endpoints: createSchool, updateSchool, getSchool
   - Endpoints: inviteTeacher, inviteSupport, removeMemeber
   - Endpoints: getSchoolMembers, getSchoolStats

3. **Components**
   - School creation wizard
   - Member invitation modal
   - School member list
   - Principal dashboard widgets

---

## Billing Model

### Teacher Mode Billing (Monthly)

Teacher mode uses tiered pricing based on **total active student cards**.

| Tier | Max Students | Pricing | Pro-rated |
|------|--------------|---------|-----------|
| **FREE** | 3 | $0 | No |
| **TINY** | 7 | Flat fee (admin-set) | No |
| **SMALL** | 15 | Flat fee (admin-set) | No |
| **MEDIUM** | 23 | Flat fee (admin-set) | No |
| **LARGE** | 24+ | $9.99 base + per-student | **Yes** |

**Key Rules:**
- All tier limits based on **max student cards** (no classroom limits)
- Same student in 2 classrooms = **counted as 2** (not deduplicated)
- **Active student** = exists at least 4 hours/day
- **Pro-rating** only applies to LARGE tier
- Tier thresholds and prices are **admin-configurable**

**Classroom-School Connection for Billing:**
```
Teacher Account
├── Connected to SINGLE school
│   └── ALL classrooms/students → Billed to school
│
└── Connected to MULTIPLE schools (or none)
    └── Connection at CLASSROOM level
        ├── Classroom A → School 1 (billed to school)
        ├── Classroom B → School 2 (billed to school)
        └── Classroom C → No school (billed to teacher)
```

- Classroom can connect to **one school only**
- Unconnected classrooms = teacher pays
- Connected classrooms = school pays

### School Mode Billing (Yearly)

School mode uses **yearly upfront fee + per-student pricing**.

| Component | Description |
|-----------|-------------|
| **Upfront Fee** | Yearly base fee (admin-set) |
| **Per-Student** | Per-student fee (admin-set) |

**Key Rules:**
- Covers all connected classrooms/teachers
- Per-student regardless of teacher/classroom count
- Both fees are **admin-configurable**

### Admin Settings Structure

```typescript
// SystemSettings key: 'teacher_billing'
{
  tiers: {
    FREE:   { maxStudents: 3,  price: 0 },
    TINY:   { maxStudents: 7,  price: 299 },    // $2.99
    SMALL:  { maxStudents: 15, price: 599 },    // $5.99
    MEDIUM: { maxStudents: 23, price: 999 },    // $9.99
    LARGE:  { maxStudents: null, basePrice: 999 }, // $9.99 base
  },
  largePerStudent: 10,          // $0.10 per additional student
  activeHoursThreshold: 4,      // hours/day to count as active
}

// SystemSettings key: 'school_billing'
{
  yearlyUpfrontFee: 29900,      // $299/year (admin-set)
  perStudentFee: 100,           // $1.00/student (admin-set)
}
```

### Database Changes Required

**Add schoolId to Group model:**
```prisma
model Group {
  // ... existing fields ...
  schoolId    String?   // Optional school connection for billing

  school      School?   @relation(fields: [schoolId], references: [id], onDelete: SetNull)

  @@index([schoolId])
}
```

**Add groups relation to School:**
```prisma
model School {
  // ... existing fields ...
  groups      Group[]   // Connected classrooms
}
```

### Billing Calculation Examples

**Teacher Mode Example:**
```
Teacher has 30 students across 3 classrooms:
- Classroom A (10 students) → Connected to School X
- Classroom B (12 students) → Connected to School X
- Classroom C (8 students)  → No school connection

Teacher billing:
- Only Classroom C counts (8 students)
- 8 students = TINY tier ($2.99/month)

School X billing:
- Classrooms A + B (22 students)
- Billed via school's yearly rate
```

**School Mode Example:**
```
School has 150 students across 6 teachers

School billing (yearly):
- Upfront fee: $299
- Per-student: 150 × $1.00 = $150
- Total: $449/year
```

---

## Implementation Roadmap

### Phase 1: Foundation (Estimated: 8-10 hours)

1. Create tRPC school router with CRUD operations
2. Implement SCHOOL_TEACHER invitation acceptance
3. Implement SCHOOL_SUPPORT invitation acceptance
4. Add basic authorization middleware

### Phase 2: Principal UI (Estimated: 15-20 hours)

1. Build principal dashboard page
2. Create school management pages
3. Implement teacher invitation flow
4. Implement support staff invitation flow
5. Build member management interface

### Phase 3: Features (Estimated: 15-20 hours)

1. Principal-assigned routines system
2. School-wide routine templates
3. Cross-teacher student visibility (opt-in)
4. Support staff routine view

### Phase 4: Billing & Polish (Estimated: 5-8 hours)

1. Connect SCHOOL tier to Stripe
2. Tier validation for school features
3. UI polish and testing
4. Documentation updates

**Total Estimated Effort:** ~45-60 hours

---

## File References

### Schema & Database

| File | Lines | Content |
|------|-------|---------|
| `prisma/schema.prisma` | 1051-1085 | School, SchoolMember models |
| `supabase/create-tables.sql` | 348-370 | Table creation SQL |
| `supabase/policies.sql` | 776-835 | RLS policies |

### Types & Constants

| File | Lines | Content |
|------|-------|---------|
| `lib/types/prisma-enums.ts` | - | RoleType enum with PRINCIPAL |
| `lib/constants/theme.ts` | 15 | PRINCIPAL color (Amber) |
| `lib/utils/constants.ts` | 297 | enableSchoolMode flag |

### Services & API

| File | Lines | Content |
|------|-------|---------|
| `lib/services/invitation.service.ts` | 211-214 | School invite error throws |
| `lib/trpc/routers/auth.ts` | 78-79 | Role color assignment |

### Planning Documents

| File | Lines | Content |
|------|-------|---------|
| `md/planning/stages/stage-5.md` | 111-135 | Principal/Support features |
| `md/planning/PROJECT-CONTEXT.md` | 392-415 | Role definitions |
| `md/pre-deployment/00-audit-summary.md` | 102-103 | v1.0 deferral note |

---

## Technical Decisions to Make

### Before Implementation

1. **Dual-Role Support**
   - Can a user be both PRINCIPAL and PARENT?
   - How does role switching work?

2. **Multi-School Support**
   - Can a principal manage multiple schools?
   - Can a teacher belong to multiple schools?

3. **Data Isolation**
   - Should principals see teacher's personal routines?
   - What's the default visibility setting?

4. **Support Staff Scope**
   - Can support staff create their own persons/students?
   - Are they limited to assigned routines only?

5. **Migration Path**
   - Can existing teachers be converted to school members?
   - How to handle existing teacher subscriptions?

---

## Student Card Linking System

### Overview

Student card linking enables the **same physical student** who exists in **multiple classrooms** (potentially with different teachers) to see a **merged view** of all their tasks in kiosk mode. This is similar to how CoParent linking works for parents sharing custody.

### Three Levels of Linking

| Level | Scope | Who Creates Link | Use Case |
|-------|-------|------------------|----------|
| **Level 1** | Same Teacher | Teacher | Student in multiple classrooms owned by same teacher |
| **Level 2** | Co-Teacher | Either Co-Teacher | Student shared via existing CO_TEACHER invitation |
| **Level 3** | School | Principal | Student across different teachers within same school |

### Linking Hierarchy Diagram

```
                    ┌─────────────────────────────────────┐
                    │           SCHOOL LEVEL              │
                    │   (Principal creates SchoolLink)    │
                    └─────────────┬───────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
   │  Teacher A  │         │  Teacher B  │         │  Teacher C  │
   │  (Math)     │         │  (Science)  │         │  (Music)    │
   └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
          │                       │                       │
   ┌──────┴──────┐         ┌──────┴──────┐         ┌──────┴──────┐
   │ Student     │◄───────►│ Student     │◄───────►│ Student     │
   │ Card: Alex  │  Link   │ Card: Alex  │  Link   │ Card: Alex  │
   │ (Grade 3)   │         │ (Science)   │         │ (Band)      │
   └─────────────┘         └─────────────┘         └─────────────┘

   Same physical student "Alex" has 3 different student cards
   across 3 teachers. School-level linking merges all for kiosk.
```

### Level 1: Same-Teacher Linking

**Scenario:** Teacher has "Alex" in both "Morning Class" and "After School Club" classrooms.

**Implementation:** New `TeacherStudentLink` model (follows same pattern as existing `CoParentPersonLink`).

```prisma
// NEW MODEL - similar structure to CoParentPersonLink
model TeacherStudentLink {
  id              String   @id @default(cuid())
  roleId          String   // Teacher's role who owns both students
  primaryStudentId   String   // First student card
  linkedStudentId    String   // Second student card
  routineIds      String[] // Optional: limit to specific routines
  status          String   @default("ACTIVE") // ACTIVE, REVOKED
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  role            Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  primaryStudent  Person   @relation("TeacherLinkPrimary", fields: [primaryStudentId], references: [id], onDelete: Cascade)
  linkedStudent   Person   @relation("TeacherLinkLinked", fields: [linkedStudentId], references: [id], onDelete: Cascade)

  @@unique([roleId, primaryStudentId, linkedStudentId])
  @@index([roleId])
  @@index([primaryStudentId])
  @@index([linkedStudentId])
}
```

**Authorization:**
- Teacher must own BOTH Person records
- Either Person can be primary (bidirectional in kiosk query)

**Kiosk Behavior:**
- Personal kiosk for either linked student shows merged tasks
- Group/classroom kiosk only shows that classroom's tasks

### Level 2: Co-Teacher Linking (Existing)

**Scenario:** Teacher A and Teacher B share a classroom via CO_TEACHER invitation. Alex exists in this shared classroom.

**Implementation:** Already exists as `CoTeacherStudentLink` in schema.

```prisma
// EXISTING MODEL - no changes needed
model CoTeacherStudentLink {
  id               String   @id @default(cuid())
  coTeacherId      String
  primaryStudentId String
  linkedStudentId  String?
  routineIds       String[]
  status           String   @default("PENDING")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  coTeacher        CoTeacher @relation(fields: [coTeacherId], references: [id], onDelete: Cascade)
  primaryStudent   Person    @relation("CoTeacherPrimaryStudent", fields: [primaryStudentId], references: [id], onDelete: Cascade)
  linkedStudent    Person?   @relation("CoTeacherLinkedStudent", fields: [linkedStudentId], references: [id], onDelete: SetNull)
}
```

**Kiosk Behavior:**
- Merges tasks within shared classroom scope
- Uses `routineIds` to filter which routines are shared
- Already implemented in `kiosk.ts:getPersonTasks` (lines 483-643)

### Level 3: School-Level Linking

**Scenario:** Principal links Alex's student cards across Math (Teacher A), Science (Teacher B), and Music (Teacher C).

**New Model Required:**

```prisma
model SchoolStudentLink {
  id             String   @id @default(cuid())
  schoolId       String
  primaryPersonId   String      // The "canonical" student card
  linkedPersonId    String      // Student card being linked
  status         String   @default("ACTIVE")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  createdById    String   // Principal's roleId who created

  school         School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  primaryPerson  Person   @relation("SchoolLinkPrimary", fields: [primaryPersonId], references: [id], onDelete: Cascade)
  linkedPerson   Person   @relation("SchoolLinkLinked", fields: [linkedPersonId], references: [id], onDelete: Cascade)
  createdBy      Role     @relation(fields: [createdById], references: [id])

  @@unique([schoolId, primaryPersonId, linkedPersonId])
  @@index([schoolId])
  @@index([primaryPersonId])
  @@index([linkedPersonId])
}
```

**Authorization:**
- Only PRINCIPAL of the school can create/manage links
- Both Person records must belong to teachers in the school
- Teachers cannot see/modify school-level links

### Kiosk Merge Logic

#### Current Implementation (kiosk.ts:216-660)

The existing `getPersonTasks` function uses **bidirectional queries** for each link type:

```typescript
// lib/trpc/routers/kiosk.ts - getPersonTasks (actual implementation)

// 1. Own tasks (lines 234-307)
const ownTasks = await prisma.person.findUnique({ ... });

// 2. CoParent links - Direction 1: as linkedPerson (lines 315-431)
const coParentLinksAsLinked = await prisma.coParentPersonLink.findMany({
  where: { linkedPersonId: personId, status: 'ACTIVE' },
  include: { primaryPerson: { include: { assignments: ... } } }
});

// 3. CoParent links - Direction 2: as primaryPerson (lines 354-475)
const coParentLinksAsPrimary = await prisma.coParentPersonLink.findMany({
  where: { primaryPersonId: personId, status: 'ACTIVE' },
  include: { linkedPerson: { include: { assignments: ... } } }
});

// 4. CoTeacher links - Direction 1: as linkedStudent (lines 483-599)
// 5. CoTeacher links - Direction 2: as primaryStudent (lines 522-643)

// 6. Deduplication & merge (lines 645-654)
// Own tasks filtered from CoParent, CoParent filtered from CoTeacher
return [...ownTasks, ...coParentTasks, ...coTeacherTasks].sort((a,b) => a.order - b.order);
```

#### Existing Tracking Flags

Each task returned includes source tracking:
```typescript
{
  isFromCoParent: boolean,        // true if from CoParentPersonLink
  isFromCoTeacher: boolean,       // true if from CoTeacherStudentLink
  coParentPersonId: string|null,  // ID of the linked CoParent person
  coTeacherPersonId: string|null, // ID of the linked CoTeacher person
}
```

#### Updated Flow (Add Three-Level Linking)

Add new queries and flags to `getPersonTasks`:

```typescript
// lib/trpc/routers/kiosk.ts - getPersonTasks (updated)

// NEW: Level 1 - TeacherStudentLink (same teacher, different classrooms)
// Query as primaryStudent
const teacherLinksAsPrimary = await prisma.teacherStudentLink.findMany({
  where: { primaryStudentId: personId, status: 'ACTIVE' },
  include: { linkedStudent: { include: { assignments: { include: { routine: { include: { tasks: true } } } } } } }
});

// Query as linkedStudent
const teacherLinksAsLinked = await prisma.teacherStudentLink.findMany({
  where: { linkedStudentId: personId, status: 'ACTIVE' },
  include: { primaryStudent: { include: { assignments: { include: { routine: { include: { tasks: true } } } } } } }
});

// Mark tasks with: isFromTeacherLink: true, teacherLinkPersonId: linkedPersonId

// EXISTING: Level 2 - CoTeacherStudentLink (already implemented)
// No changes needed

// NEW: Level 3 - SchoolStudentLink (principal-linked, personal kiosk only)
if (kioskType === 'personal') {
  const schoolLinksAsPrimary = await prisma.schoolStudentLink.findMany({
    where: { primaryPersonId: personId, status: 'ACTIVE' },
    include: { linkedPerson: { include: { assignments: ... } } }
  });

  const schoolLinksAsLinked = await prisma.schoolStudentLink.findMany({
    where: { linkedPersonId: personId, status: 'ACTIVE' },
    include: { primaryPerson: { include: { assignments: ... } } }
  });

  // Mark tasks with: isFromSchoolLink: true, schoolLinkPersonId: linkedPersonId
}

// Updated deduplication (priority order):
// 1. Own tasks (highest priority)
// 2. Teacher links (same teacher)
// 3. CoTeacher links
// 4. School links (lowest priority - deduplicated against all above)

return [...ownTasks, ...teacherLinkTasks, ...coTeacherTasks, ...schoolLinkTasks]
  .sort((a,b) => a.order - b.order);
```

#### New Tracking Flags

```typescript
{
  // Existing flags
  isFromCoParent: boolean,
  isFromCoTeacher: boolean,
  coParentPersonId: string | null,
  coTeacherPersonId: string | null,

  // NEW flags for student card linking
  isFromTeacherLink: boolean,      // Level 1: same teacher, different classrooms
  isFromSchoolLink: boolean,       // Level 3: principal-linked across teachers
  teacherLinkPersonId: string | null,
  schoolLinkPersonId: string | null,

  // Classroom context (for grouped display)
  sourceClassroomId: string | null,
  sourceClassroomName: string | null,
}
```

### Kiosk Display Rules

| Kiosk Type | Linking Applied | Task Grouping |
|------------|-----------------|---------------|
| **Classroom Kiosk** (group code) | None | Single classroom only |
| **Personal Kiosk** (student code) | All 3 levels | Grouped by classroom with labels |

**Personal Kiosk Merged View:**

```
┌────────────────────────────────────────┐
│     👋 Good Morning, Alex!             │
├────────────────────────────────────────┤
│  📚 Math Class (Mrs. Smith)            │
│  ├── ☐ Complete worksheet              │
│  ├── ☐ Practice multiplication         │
│  └── ☑ Turn in homework                │
├────────────────────────────────────────┤
│  🔬 Science Lab (Mr. Johnson)          │
│  ├── ☐ Lab safety quiz                 │
│  └── ☐ Collect experiment materials    │
├────────────────────────────────────────┤
│  🎵 Band (Ms. Davis)                   │
│  └── ☐ Practice scales (15 min)        │
└────────────────────────────────────────┘
```

### API Endpoints

#### Teacher Endpoints (Level 1) - New Router

```typescript
// lib/trpc/routers/teacher-student-link.ts (NEW FILE)

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const teacherStudentLinkRouter = createTRPCRouter({

  // Link two students owned by same teacher
  create: protectedProcedure
    .input(z.object({
      primaryStudentId: z.string(),
      linkedStudentId: z.string(),
      routineIds: z.array(z.string()).optional(), // Limit to specific routines
    }))
    .mutation(async ({ ctx, input }) => {
      const roleId = ctx.session.activeRoleId;

      // Verify teacher owns both students
      const [primary, linked] = await Promise.all([
        ctx.prisma.person.findFirst({
          where: { id: input.primaryStudentId, roleId, status: 'ACTIVE' }
        }),
        ctx.prisma.person.findFirst({
          where: { id: input.linkedStudentId, roleId, status: 'ACTIVE' }
        }),
      ]);

      if (!primary || !linked) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Both students must belong to your account',
        });
      }

      // Create bidirectional link (order doesn't matter for kiosk query)
      return ctx.prisma.teacherStudentLink.create({
        data: {
          roleId,
          primaryStudentId: input.primaryStudentId,
          linkedStudentId: input.linkedStudentId,
          routineIds: input.routineIds ?? [],
          status: 'ACTIVE',
        },
      });
    }),

  // Remove link
  remove: protectedProcedure
    .input(z.object({ linkId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const link = await ctx.prisma.teacherStudentLink.findUnique({
        where: { id: input.linkId },
      });

      if (!link || link.roleId !== ctx.session.activeRoleId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return ctx.prisma.teacherStudentLink.update({
        where: { id: input.linkId },
        data: { status: 'REVOKED' },
      });
    }),

  // Get all links for teacher
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.teacherStudentLink.findMany({
      where: { roleId: ctx.session.activeRoleId, status: 'ACTIVE' },
      include: {
        primaryStudent: { select: { id: true, name: true, avatarUrl: true } },
        linkedStudent: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }),

  // Get links for a specific student
  getForStudent: protectedProcedure
    .input(z.object({ personId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.teacherStudentLink.findMany({
        where: {
          roleId: ctx.session.activeRoleId,
          status: 'ACTIVE',
          OR: [
            { primaryStudentId: input.personId },
            { linkedStudentId: input.personId },
          ],
        },
        include: {
          primaryStudent: { select: { id: true, name: true } },
          linkedStudent: { select: { id: true, name: true } },
        },
      });
    }),
});
```

#### Principal Endpoints (Level 3) - Add to School Router

```typescript
// lib/trpc/routers/school.ts (ADD TO EXISTING)

// Link students across teachers within school
linkStudents: protectedProcedure
  .input(z.object({
    schoolId: z.string(),
    primaryPersonId: z.string(),
    linkedPersonId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Verify caller is principal of this school
    const membership = await ctx.prisma.schoolMember.findFirst({
      where: {
        schoolId: input.schoolId,
        roleId: ctx.session.activeRoleId,
        role: 'PRINCIPAL',
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the principal can link students across teachers',
      });
    }

    // Verify both persons belong to teachers in the school
    const [primary, linked] = await Promise.all([
      ctx.prisma.person.findFirst({
        where: {
          id: input.primaryPersonId,
          role: {
            schoolMembers: { some: { schoolId: input.schoolId, status: 'ACTIVE' } }
          }
        }
      }),
      ctx.prisma.person.findFirst({
        where: {
          id: input.linkedPersonId,
          role: {
            schoolMembers: { some: { schoolId: input.schoolId, status: 'ACTIVE' } }
          }
        }
      }),
    ]);

    if (!primary || !linked) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Both students must belong to teachers in this school',
      });
    }

    return ctx.prisma.schoolStudentLink.create({
      data: {
        schoolId: input.schoolId,
        primaryPersonId: input.primaryPersonId,
        linkedPersonId: input.linkedPersonId,
        createdById: ctx.session.activeRoleId,
        status: 'ACTIVE',
      },
    });
  }),

// Get all school-level links
getStudentLinks: protectedProcedure
  .input(z.object({ schoolId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Verify principal access
    const membership = await ctx.prisma.schoolMember.findFirst({
      where: {
        schoolId: input.schoolId,
        roleId: ctx.session.activeRoleId,
        role: 'PRINCIPAL',
      },
    });

    if (!membership) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return ctx.prisma.schoolStudentLink.findMany({
      where: { schoolId: input.schoolId, status: 'ACTIVE' },
      include: {
        primaryPerson: {
          select: { id: true, name: true, avatarUrl: true, role: { select: { user: { select: { name: true } } } } }
        },
        linkedPerson: {
          select: { id: true, name: true, avatarUrl: true, role: { select: { user: { select: { name: true } } } } }
        },
      },
    });
  }),

// Bulk link students (same physical student across multiple teachers)
bulkLinkStudents: protectedProcedure
  .input(z.object({
    schoolId: z.string(),
    personIds: z.array(z.string()).min(2).max(10),
  }))
  .mutation(async ({ ctx, input }) => {
    // Verify principal, verify all persons in school (same as above)
    // Create links: first ID = primary, link to all others
    const [primaryId, ...linkedIds] = input.personIds;

    const links = await ctx.prisma.$transaction(
      linkedIds.map(linkedId =>
        ctx.prisma.schoolStudentLink.create({
          data: {
            schoolId: input.schoolId,
            primaryPersonId: primaryId,
            linkedPersonId: linkedId,
            createdById: ctx.session.activeRoleId,
            status: 'ACTIVE',
          },
        })
      )
    );

    return { count: links.length };
  }),
```

### UI Components Required

#### Teacher UI

1. **Student Linking Modal** (`components/teacher/StudentLinkModal.tsx`)
   - Select two students from dropdown
   - Show preview of merged view
   - Confirm/cancel buttons

2. **Linked Students Indicator** (`components/teacher/LinkedStudentBadge.tsx`)
   - Small badge on student cards showing link status
   - Click to view/manage links

#### Principal UI

1. **School Student Linking Page** (`app/(protected)/principal/students/link/page.tsx`)
   - View all students across teachers
   - Search/filter by teacher, classroom, or student name
   - Select multiple students to link
   - View existing links

2. **Student Link Management Table**
   - Show all school-level links
   - Unlink action
   - View merged kiosk preview

### Implementation Phases

#### Phase 1: Level 1 Implementation (Same-Teacher)

1. Add UI for teachers to link students they own
2. Update kiosk `getPersonTasks` to check PersonLinks
3. Update personal kiosk display to group by classroom
4. Add linked student badges to teacher dashboard

#### Phase 2: Level 2 Verification (Co-Teacher)

1. Verify existing co-teacher linking still works
2. Ensure kiosk merge respects co-teacher scope
3. Add tests for co-teacher merge scenarios

#### Phase 3: Level 3 Implementation (School)

1. Add `SchoolStudentLink` model to schema
2. Create principal student linking UI
3. Update kiosk `getPersonTasks` for school links
4. Add school-level link management page

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Student linked at multiple levels | Deduplicate - include once |
| Circular links (A→B→C→A) | Flatten to single set of linked IDs |
| Link deleted while kiosk active | Graceful degradation - show only available |
| Teacher removed from school | Keep PersonLinks, remove from SchoolStudentLinks |
| Student deleted | Cascade delete all links |

### Data Migration

For existing installations with students that should be linked:

```typescript
// scripts/migrate-student-links.ts
// Manual/admin script to create links for existing students
// Based on matching criteria (name, external ID, etc.)
```

---

## Related Documentation

- [Stage 5 Planning](/md/planning/stages/stage-5.md) - Original feature planning
- [Project Context](/md/planning/PROJECT-CONTEXT.md) - Role definitions
- [Pre-Deployment Audit](/md/pre-deployment/00-audit-summary.md) - v1.0 scope decisions
- [Database Schema](/md/pre-deployment/05-database-schema.md) - Schema documentation
