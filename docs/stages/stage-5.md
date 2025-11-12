# Stage 5: Co-Parent/Teacher + School Mode

**Duration:** 4-5 days  
**Token Estimate:** 100K tokens ($1.50)  
**Prerequisites:** Stage 4 completed (kiosk mode working)

---

## SESSION PROMPT (Copy-Paste This)

```
You are building Ruby Routines Stage 5: Co-Parent/Teacher + School Mode.

CONTEXT:
- Project: Ruby Routines (routine management PWA)
- Stack: Next.js 14 + Supabase + Prisma + tRPC + TypeScript strict
- Stage Goal: Implement sharing systems and school mode

COMPLETED IN PREVIOUS STAGES:
- Auth system working
- Core CRUD (persons, groups, routines, tasks)
- Goals and smart routines
- Kiosk mode
- Real-time updates

CURRENT STAGE OBJECTIVES:
1. Co-parent invitation system
2. Co-parent granular permissions (child + routine selection)
3. Co-teacher invitation system
4. Co-teacher student selection
5. Student-parent connection (code-based)
6. Dual-role account system (parent + teacher)
7. School mode (principal account)
8. Principal-assigned routines
9. Teacher classroom routines (tracking)
10. Room management

CO-PARENT SYSTEM:

**Purpose:** Allow parents to share monitoring responsibilities with granular control

**Features:**
- Lead parent invites co-parent via code
- Co-parent must have parent account
- Granular permissions:
  - Select which children to share
  - Select which routines to share per child
  - Example: Share child 1, 2 (not 3); Share "Homework" routine (not "Chores")
- Bidirectional: Both can invite each other
- Read-only access for co-parent
- Lead parent can revoke anytime

**Workflow:**
1. Lead parent clicks "Invite Co-Parent"
2. System generates invitation code
3. Lead parent selects children to share
4. Lead parent selects routines per child
5. Co-parent enters code
6. Co-parent sees read-only view of selected routines

CO-TEACHER SYSTEM:

**Purpose:** Allow teachers to collaborate with controlled access

**Features:**
- Lead teacher invites co-teacher via code
- Co-teacher must have teacher account
- Student selection by lead teacher
- Read-only access for co-teacher
- Can see routines/progress for selected students only
- Cannot modify anything
- Lead teacher can revoke anytime

**Workflow:**
1. Lead teacher clicks "Invite Co-Teacher"
2. System generates invitation code
3. Lead teacher selects students to share
4. Co-teacher enters code
5. Co-teacher sees read-only view of selected students

STUDENT-PARENT CONNECTION:

**Purpose:** Link teacher's student to parent's child

**Workflow:**
1. Teacher generates code for specific student
2. Teacher selects classrooms to include
3. Teacher shares code with parent (out-of-app)
4. Parent enters code in parent mode
5. Parent matches imported student with:
   - Existing kid (if child), OR
   - Self "Me" role (if adult student)
6. Student gains dual role (Kid + Student or Me + Student)
7. Parent sees student routines (read-only)

DUAL-ROLE ACCOUNT:

**Structure:**
- User can be both parent and teacher
- Separate "Me" roles (parent "Me" + teacher "Me")
- No interaction between modes (data isolation)
- Mode switcher UI
- Separate tiers per mode
- Combined billing (active modes only)

**Role Management:**
- Activate role (add teacher/parent mode)
- Deactivate role (hide mode, preserve data)
- Minimum 1 active role required

SCHOOL MODE:

**Structure:**
- Principal account (standalone, no dual-role)
- Manages teachers, support staff, students, rooms
- School billing (consolidated)

**Default Rooms:**
1. "Principal's Office" (principal auto-assigned)
2. "Teachers' Room" (all teachers auto-assigned)

**Principal Features:**
- Create/link/remove teachers
- Create/link/remove support staff
- Assign routines to students
- Assign routines to support staff
- View shared teacher classroom routines (opt-in by teacher)
- Room management

**Support Staff:**
- Functions like parent account
- Auto-linked to school
- Views principal-assigned routines (read-only, orange band)
- Can create personal routines

TESTING REQUIREMENTS:
- Co-parent invitation flow
- Granular permission enforcement
- Co-teacher access control
- Student-parent connection
- Dual-role mode switching
- School mode functionality

BEGIN IMPLEMENTATION:
Start with Co-Parent system.
Then Co-Teacher system.
Then Student-Parent connection.
Then Dual-role accounts.
Then School mode.
Test each sharing system independently before moving to next.
```

---

## Deliverables Checklist

```
CO-PARENT SYSTEM:
□ Invitation code generation
□ Child selection UI
□ Routine selection UI (per child)
□ Co-parent read-only access
□ Bidirectional sharing support
□ Revoke access

CO-TEACHER SYSTEM:
□ Invitation code generation
□ Student selection UI
□ Co-teacher read-only access
□ Revoke access

STUDENT-PARENT CONNECTION:
□ Code generation (teacher)
□ Code redemption (parent)
□ Student-child matching
□ Adult student matching (to self)
□ Dual role creation
□ Read-only parent view

DUAL-ROLE ACCOUNT:
□ Role activation
□ Role deactivation
□ Mode switcher UI
□ Data isolation
□ Separate tiers
□ Combined billing

SCHOOL MODE:
□ Principal account setup
□ Teacher management
□ Support staff management
□ Default rooms creation
□ Principal-assigned routines
□ Routine visibility (orange band)
□ Room management
```

---

## Next Stage

After completing Stage 5, proceed to:
**[Stage 6: Analytics + Marketplace](stage-6.md)**
