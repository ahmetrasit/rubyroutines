# Ruby Routines - Complete UX Flows

## Table of Contents
1. [Authentication](#1-authentication)
2. [Parent Mode](#2-parent-mode)
3. [Teacher Mode](#3-teacher-mode)
4. [Kiosk Mode](#4-kiosk-mode)
5. [Marketplace](#5-marketplace)
6. [Connections & Sharing](#6-connections--sharing)
7. [Goals & Conditions](#7-goals--conditions)
8. [Task Types & Completion](#8-task-types--completion)
9. [Routine Configuration](#9-routine-configuration)
10. [Admin Features](#10-admin-features)
11. [School Mode (Principal)](#11-school-mode-principal)

---

## 1. Authentication

### 1.1 Sign Up Flow
```
/signup → [Google OAuth] OR [Email Form]
                ↓                    ↓
         /auth/callback      auth.signUp mutation
                ↓                    ↓
         Sync to DB          Create User + 2 Roles
                ↓                    ↓
              /dashboard ←── /verify?email=...
                             (email verification)
```

**Default Data Created:**
- PARENT Role → Person (isAccountOwner=true) → "Daily Routine"
- TEACHER Role → Person (isAccountOwner=true) → "Daily Routine" → "Teacher-Only" Classroom

**Files:** `app/(auth)/signup/page.tsx`, `lib/trpc/routers/auth.ts:23-140`

### 1.2 Sign In Flow
```
/login → [Google] OR [Email/Password]
            ↓              ↓
      /auth/callback   auth.signIn
            ↓              ↓
       Ensure roles    Ensure roles
            ↓              ↓
         /dashboard ←──────┘
```

### 1.3 Two-Factor Authentication
```
/settings/security → Enable 2FA → Generate Secret
                          ↓
                    Scan QR Code (TOTP)
                          ↓
                    Verify Code → Save Backup Codes
                          ↓
                    Login requires 2FA code
```

**Files:** `lib/trpc/routers/two-factor.ts`, `app/settings/security/page.tsx`

### 1.4 Password Reset Flow
```
/login → "Forgot password?" link
              ↓
/reset-password → Enter email
              ↓
requestPasswordReset → Supabase sends email
              ↓
/reset-password/confirm → Enter new password
              ↓
supabase.updateUser() → Redirect to login
```

### 1.5 Login Rate Limiting
```
signIn attempt → checkLoginRateLimit(email)
                        ↓
              ┌─────────┼─────────┐
              ↓                   ↓
         Allowed              Locked out
              ↓                   ↓
      Try login           Return TOO_MANY_REQUESTS
              ↓
    ┌─────────┼─────────┐
    ↓                   ↓
 Success              Failed
    ↓                   ↓
clearFailedLogins  recordFailedLogin
```
**Config:** 5 attempts per 2 minutes, 15-minute lockout

### 1.6 Implementation Details
- **Seed data migration:** Handles users with different IDs (seed vs Supabase Auth)
- **Email verification:** 6-digit code, 15-min expiry, 3 attempts max, bcrypt hashed
- **isTeacher flag:** Account owners have `isTeacher=true` to distinguish from students
- **Protected routines:** "Daily Routine" has `isProtected=true` (cannot delete/rename)
- **Last mode redirect:** Login redirects to last visited mode (parent/teacher) via localStorage/cookie

---

## 2. Parent Mode

### 2.1 Dashboard Flow
```
/parent → Session Check → Load Parent Role
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
 Persons   Routines   (Goals via /parent/goals)
    ↓         ↓
 PersonCard  RoutineCard
    ↓
 /parent/[personId] → Person Detail
    ↓
 /parent/[personId]/[routineId] → Routine Tasks

Goals: Accessed via /parent/goals page (not on main dashboard)
```

### 2.2 Person Management
```
Add Person → PersonForm Modal
                ↓
         name, avatar
                ↓
         person.create mutation
                ↓
         Auto-assign "Daily Routine"
```

**Actions:** Create, Edit, Archive, Restore, Delete (soft)

### 2.3 Additional Parent Pages
```
/parent/connections → PersonConnectionsManager
                           ↓
              View/manage cross-account connections
                           ↓
              ConnectedPersonsSection displays linked persons

/parent/goals → Goal management page
                     ↓
         Create, edit, track goals for children
```

### 2.4 Co-Parent Feature (Merged Kiosk)
```
DAD (Lead Parent)                    MOM (Co-Parent)
================                     ===============

1. INVITE FLOW:
   Dad → InviteModal → Select kids + routines per kid
         ├── Kid A: Morning Routine ✓, Homework ✓
         └── Kid B: Chores Routine ✓
         ↓
   Creates Invitation with sharedPersons:
   [{personId: "kidA", routineIds: ["morning", "homework"]},
    {personId: "kidB", routineIds: ["chores"]}]

2. ACCEPT FLOW:
                                     Mom receives invitation
                                     ↓
                                     Links her kids to shared kids:
                                     ├── Dad's Kid A → Mom's Emma
                                     └── Dad's Kid B → Mom's Jake (new)
                                     ↓
                                     Creates CoParentPersonLink records

3. MERGED KIOSK:
   Either Dad's code OR Mom's code shows merged view:
   ├── Morning Routine (Dad's)
   ├── Homework Routine (Dad's)
   ├── Evening Routine (Mom's)
   └── Reading Time (Mom's)

4. DASHBOARD VISIBILITY:
   Mom's dashboard → Her routines + completion STATUS of Dad's shared routines (read-only)
   Dad's dashboard → His routines + completion STATUS of Mom's shared routines (read-only)
```

**Key Difference from PersonConnection:**
- PersonConnection = 2 separate kiosks (home + school)
- CoParent = 1 merged kiosk (either parent's code works)

**Files:** `lib/trpc/routers/coparent.ts`, `components/coparent/InviteModal.tsx`, `lib/trpc/routers/kiosk.ts`

### 2.5 Smart Routines
```
Routine with type=SMART + Conditions
              ↓
isSmartRoutineVisible() evaluates conditions
              ↓
Show/hide based on time, day, goal progress, etc.
```

### 2.6 Routine Management
```
Create Routine → RoutineForm
                    ↓
    name, resetPeriod, visibility, color
                    ↓
    routine.create → Assign to Person(s)
                    ↓
    Add Tasks → TaskForm (type selection)
```

---

## 3. Teacher Mode

### 3.1 Dashboard Flow
```
/teacher → Load Teacher Role → List Classrooms
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
              Teacher-Only    Classroom 1    Classroom N
              (protected)         ↓               ↓
                           /teacher/[classroomId]
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
                Teachers      Students      Kiosk Code
                (isTeacher)   (!isTeacher)  Manager
```

### 3.2 Classroom Management
```
Create Classroom → group.create
                       ↓
            Auto-create "Me" person (isTeacher=true)
                       ↓
            Add Members → Student creation form
                       ↓
            Assign Routines → Per-student or whole class
```

### 3.3 Teacher-Only Routines
```
Routine with isTeacherOnly=true
    ↓
Hidden from kiosk display
    ↓
Only teacher can complete tasks
    ↓
Bulk check-in available (teacher-bulk-checkin.tsx)
```

**Files:** `app/(dashboard)/teacher/page.tsx`, `components/classroom/classroom-member-list.tsx`

### 3.4 Real-time & Performance Features
- **`useDashboardRealtime` hook:** Subscribes to Supabase realtime for live updates
- **`person.getBatch` query:** Efficiently fetches multiple persons in one request
- **Optimistic updates:** Bulk check-in uses optimistic UI for instant feedback
- **`kioskLastUpdatedAt` timestamp:** Tracks when role/group data changed for kiosk polling

### 3.5 Classroom Customization
```
Classroom → Edit Modal
              ↓
    emoji (icon picker) + color (color picker)
              ↓
    Visual distinction between classrooms
```

---

## 4. Kiosk Mode

### 4.1 Code Generation
```
KioskCodeManager → generateCode mutation
                        ↓
         Code Format: FIRSTNAME-WORD1-WORD2
                        ↓
         Types: Classroom | Individual | Family
                        ↓
         Expiry: 10 min (code) / 90 days (session)
```

### 4.2 Kiosk Session Flow
```
/kiosk → Enter Code → validateCode
              ↓
         createSession (deviceId generated)
              ↓
         /kiosk/[code] → Person Selection
              ↓
         Select Person → Load Tasks
              ↓
    ┌────────┼────────┐
    ↓        ↓        ↓
 SIMPLE   MULTI    PROGRESS
    ↓        ↓        ↓
 Check    +1 Btn   Value Input
    ↓        ↓        ↓
 completeTask mutation (atomic, idempotent)
```

### 4.3 Task Completion (Kiosk)
| Task Type | Max/Period | UI Element | Undo |
|-----------|------------|------------|------|
| SIMPLE | 1 | Checkbox | 10 sec |
| MULTIPLE_CHECKIN | 9 | +1 Button | No |
| PROGRESS | 20 | Number Input | No |

**Idempotency:** `SHA256(taskId + personId + value + deviceId + timestamp)`

**Files:** `app/kiosk/page.tsx`, `app/kiosk/[code]/page.tsx`, `lib/services/task-completion-coordinated.ts`

### 4.4 Real-time & UI Features
- **`useKioskRealtime` hook:** Subscribes to task completion changes
- **`useOptimisticKioskCheckin` hook:** Instant UI feedback before server confirms
- **Dynamic column layout:** Adjusts grid based on number of persons
- **Progress calculation:** Person cards show completion percentage
- **Animated task completion:** Visual feedback on check-in
- **`checkRoleUpdates` polling:** Detects classroom/role changes

### 4.5 Session Management
```
Session created → 90-day validity
                    ↓
         Track session termination
                    ↓
         Admin-configurable inactivity timeout
                    ↓
         Auto-logout on timeout
```

---

## 5. Marketplace

### 5.1 Publishing Flow
```
Routine/Goal → PublishModal
                   ↓
    name, description, visibility, category, tags
                   ↓
    marketplace.publish → Serialize to JSON snapshot
                   ↓
    PUBLIC: Searchable | PRIVATE: Share code only
```

**Serialized Data (Routine):**
```json
{
  "name", "description", "type", "resetPeriod",
  "visibility", "visibleDays",
  "tasks": [{ "name", "type", "order", "unit" }]
}
```

### 5.2 Import/Fork Flow
```
Marketplace Search → ItemCard → Fork Button
                                    ↓
                              ForkModal
                                    ↓
              ┌─────────────────────┼─────────────────────┐
              ↓                                           ↓
         Parent Mode                              Teacher Mode
              ↓                                           ↓
    Flat person/group list              GroupedPersonSelector
              ↓                              (by classroom)
              ↓                                           ↓
              └───────── marketplace.fork ────────────────┘
                                ↓
                   Check tier limits → Create routine
                                ↓
                   "Daily Routine" → MERGE tasks
                   Other → CREATE new routine
```

### 5.3 Share Codes
| Type | Format | Expiry | Use |
|------|--------|--------|-----|
| MarketplaceShareCode | 3 words | Configurable | Private marketplace items |
| RoutineShareCode | 3 words | Configurable | Direct routine sharing |

```
Generate Code → Copy/Share → Recipient enters code
                                    ↓
                            ImportFromCodeModal
                                    ↓
                            Select targets → Import
```

### 5.4 Direct Routine Copy
```
routine.checkCopyConflicts → Detect naming conflicts
                                    ↓
                     ┌──────────────┼──────────────┐
                     ↓              ↓              ↓
                  MERGE         RENAME          SKIP
             (Daily Routine)  (new name)    (duplicate)
                     ↓              ↓              ↓
                     └───── routine.copy ─────────┘
```

**Files:** `lib/trpc/routers/marketplace.ts`, `lib/services/marketplace.service.ts`, `components/marketplace/`

### 5.5 Implementation Details
- **`targetAudience` auto-detection:** Infers audience from routine/goal content
- **`userRoleType` filter:** Search filters by PARENT/TEACHER content
- **`hasUserImportedItem` check:** Prevents duplicate imports
- **Semantic versioning:** Updates increment version on marketplace items
- **`MarketplaceImport` tracking:** Records who imported what and when
- **Comments pagination:** Large comment threads load incrementally

---

## 6. Connections & Sharing

### 6.1 Person Connection (Cross-Account)
```
Origin Person → Generate 4-word Code (24h expiry)
                        ↓
                Share code with target
                        ↓
Target Person → Claim Code → Type Validation
                        ↓
         ┌──────────────┼──────────────┐
         ↓              ↓              ↓
    Student→Kid    Kid→Student    Teacher→Parent
         ↓              ↓              ↓
         └───── PersonConnection ──────┘
                        ↓
              Scope: ALL | SELECTED routines
```

**Type Constraints:**
- Student (teacher's) → Kid (parent's)
- Kid (parent's) → Student (teacher's)
- Teacher account owner → Parent or Kid
- Parent account owner → Student

### 6.2 Student-Parent Connection
```
Teacher → Generate ConnectionCode for Student
                    ↓
         Share with Parent (4-word, 24h)
                    ↓
Parent → CodeEntry → Select/Create Child Person
                    ↓
         StudentParentConnection (READ_ONLY)
```

### 6.3 Co-Parent / Co-Teacher (Merged Kiosk Architecture)

These features enable same-role collaboration (PARENT↔PARENT, TEACHER↔TEACHER) with merged kiosk views.

#### CoParent Flow
```
DAD (Lead)                              MOM (Co-Parent)
==========                              ===============
1. coparent.invite
   ├── email: mom@email.com
   └── sharedPersons: [{personId, routineIds}]
                    ↓
           Invitation created (7-day expiry)
                                        2. Accept invitation
                                           ↓
                                        Link kids: Dad's Kid → Mom's Kid
                                           ↓
                                        CoParentPersonLink created
                                        (primaryPersonId, linkedPersonId, routineIds)
3. KIOSK (merged):
   Either code shows merged tasks
   ├── Dad's tasks (own routines)
   └── Mom's tasks (via CoParentPersonLink)
```

#### CoTeacher Flow
```
LEAD TEACHER                            CO-TEACHER
============                            ==========
1. coteacher.share
   ├── email: co@school.com
   └── sharedPersons: [{studentId, routineIds}]
                    ↓
           Invitation created
                                        2. Accept invitation
                                           ↓
                                        Link students: Lead's Student → Co's Student
                                           ↓
                                        CoTeacherStudentLink created
3. KIOSK (merged):
   Either code shows merged tasks
```

#### Database Models
| Model | Purpose |
|-------|---------|
| CoParentPersonLink | Links Dad's Kid ↔ Mom's Kid with routineIds |
| CoTeacherStudentLink | Links Lead's Student ↔ Co's Student with routineIds |

#### Kiosk Task Merging (kiosk.ts:getPersonTasks)
```
1. Fetch own tasks (person.assignments)
2. Check CoParentPersonLink (both directions):
   - linksAsLinked: This person is the linkedPerson
   - linksAsPrimary: This person is the primaryPerson
3. Check CoTeacherStudentLink (both directions)
4. Merge tasks with deduplication:
   - Own tasks take priority
   - CoParent tasks marked with isFromCoParent flag
   - CoTeacher tasks marked with isFromCoTeacher flag
```

#### Dashboard Visibility (SharedRoutinesSection)
```
Parent Dashboard:
├── Own routines (full edit)
└── Shared routines section (read-only completion status)
    ├── CoParent routines (purple badge)
    └── CoTeacher routines (blue badge)
```

**Files:** `lib/trpc/routers/coparent.ts`, `lib/trpc/routers/coteacher.ts`, `lib/trpc/routers/kiosk.ts`, `components/person/shared-routines-section.tsx`

### 6.4 Implementation Details
- **`revokeConnectionCode` function:** Invalidates active connection codes
- **`getActiveConnectionCodes` query:** Lists pending connection invitations
- **`disconnectedBy` tracking:** Records who terminated a connection
- **`determineAllowedTargetType` helper:** Validates connection type constraints
- **Permission mapping:** Co-parent uses `TASK_COMPLETION` permission level

---

## 7. Goals & Conditions

### 7.1 Goal Types
| Type | Description | Achievement |
|------|-------------|-------------|
| COMPLETION_COUNT | Count completions | current >= target |
| STREAK | Consecutive periods | streak >= target |
| TIME_BASED | Total time (Phase 2) | - |
| VALUE_BASED | Sum values (Phase 2) | - |
| PERCENTAGE | % complete (Phase 2) | - |

### 7.2 Simple vs Complex Goals
```
Simple Goal (1 task):
    ↓
simpleCondition: 'complete' | 'not_complete'
    OR
comparisonOperator: 'gte' | 'lte' + comparisonValue
    ↓
Binary or threshold evaluation

Complex Goal (multiple tasks/routines):
    ↓
GoalTaskLinks + GoalRoutineLinks (with weights)
    ↓
Aggregate: SIMPLE=1, MULTI=count, PROGRESS=sum
    ↓
current >= target
```

### 7.3 Goal Progress Flow
```
goal.getProgress(goalId, personId)
           ↓
    Determine period (DAILY/WEEKLY/MONTHLY)
           ↓
    Fetch completions in period
           ↓
    Calculate per task type
           ↓
    Return { current, target, percentage, achieved }
```

### 7.4 Conditions System
```
Condition → ConditionChecks[] → Logic (AND/OR)
                ↓
┌───────────────┼───────────────┐
↓               ↓               ↓
Task Checks   Time Checks    Goal Checks
    ↓               ↓               ↓
COMPLETED     TIME_OF_DAY    GOAL_ACHIEVED
COUNT_GT      DAY_OF_WEEK    PROGRESS_GT
VALUE_LT      BEFORE/AFTER   ...
```

**Condition Operators:**
- Task: `TASK_COMPLETED`, `TASK_COUNT_GT`, `TASK_VALUE_LT`
- Routine: `ROUTINE_PERCENT_GT`
- Goal: `GOAL_ACHIEVED`, `GOAL_PROGRESS_GT`
- Time: `TIME_OF_DAY`, `DAY_OF_WEEK`

### 7.5 Smart Routines/Tasks
```
Routine.type = SMART + Condition(controlsRoutine=true)
    ↓
isSmartRoutineVisible() → Evaluate all conditions
    ↓
Show/hide routine based on result

Task.isSmart = true + Task.conditionId
    ↓
isTaskVisible() → Evaluate task condition
    ↓
Show/hide individual task
```

**Files:** `lib/trpc/routers/goal.ts`, `lib/services/goal-progress-enhanced.ts`, `lib/services/condition-evaluator.service.ts`

### 7.6 Implementation Details
- **`detectCircularDependency` function:** Prevents goals that depend on each other in loops
- **`evaluateBatch` function:** Evaluates multiple conditions efficiently
- **`getAvailableTargets` query:** Returns valid targets for goal linking
- **`calculateGoalProgressBatchEnhanced`:** Optimized batch progress calculation
- **`batchCreate` mutation:** Teachers can assign goals to multiple students at once

**Note:** STREAK type exists in schema but streak calculation service not yet implemented.

---

## 8. Task Types & Completion

### 8.1 Task Types
| Type | Completions/Period | Value | Use Case |
|------|-------------------|-------|----------|
| SIMPLE | 1 | None | Single daily task |
| MULTIPLE_CHECKIN | 9 | Count | Repeated actions |
| PROGRESS | 20 | 1-999 int | Cumulative tracking |

### 8.2 Completion Flow
```
task.complete(taskId, personId, value?, notes?)
                    ↓
         Verify ownership + permissions
                    ↓
         Teacher-only check (if applicable)
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
 SIMPLE         MULTI          PROGRESS
    ↓               ↓               ↓
 Lock rows      Lock rows      Validate value
 Check empty    Count < 9      Count < 20
    ↓               ↓               ↓
 entryNumber=1  entryNumber++  summedValue+=
    ↓               ↓               ↓
    └───── TaskCompletion record ──┘
```

### 8.3 Undo Logic
```
SIMPLE tasks only:
    ↓
Within 10-second window (UNDO_WINDOW_MINUTES)
    ↓
canUndoCompletion() → Delete record
```

**Files:** `lib/trpc/routers/task.ts`, `lib/services/task-completion.ts`, `lib/services/task-completion-coordinated.ts`

### 8.4 Helper Functions
- **`getTaskAggregation` helper:** Calculates completion status per task type
- **`getRemainingUndoTime` function:** Returns seconds until undo window expires
- **`validateProgressValue` function:** Ensures PROGRESS values are integers 1-999
- **Smart task handling:** Aggregation respects task visibility conditions

---

## 9. Routine Configuration

### 9.1 Reset Periods
| Period | Reset Time | resetDay Field |
|--------|-----------|----------------|
| DAILY | 23:55 | N/A |
| WEEKLY | 23:55 on day | 0-6 (Sun=0) |
| MONTHLY | 23:55 on day | 1-31 or 99 (last) |

### 9.2 Visibility Options
| Visibility | Description | Fields Used |
|------------|-------------|-------------|
| ALWAYS | Always visible | None |
| DATE_RANGE | Between dates | startDate, endDate |
| DAYS_OF_WEEK | Specific days | visibleDays[] (0-6) |
| CONDITIONAL | Smart conditions | Condition records |

### 9.3 Time-Limited Routines
```
startTime: "08:00" (HH:MM)
endTime: "12:00" (HH:MM)
    ↓
Routine only visible during time window
```

### 9.4 Visibility Override
```
VisibilityOverride → Duration 10-90 minutes
        ↓
Force-show hidden routine temporarily
        ↓
Auto-expires via expiresAt timestamp
```

### 9.5 Protected Routines
```
isProtected = true ("Daily Routine")
    ↓
Cannot delete or rename
    ↓
Can only edit: color, description
```

**Files:** `lib/trpc/routers/routine.ts`, `lib/services/reset-period.ts`, `lib/validation/routine.ts`

### 9.6 UI Components
- **Color picker:** HexColorPicker with preset color groups
- **Emoji/Icon picker:** IconEmojiPicker component for routine/person avatars
- **Duration presets:** Visibility override limited to preset durations (10-60 min)

**Note:** MONTHLY period exists in schema but UI only shows DAILY/WEEKLY. CUSTOM reset period throws error if selected.

---

## 10. Admin Features

### 10.1 User Management
```
/admin/users → Search/Filter Users
                    ↓
         View User → Roles → Tier Management
                    ↓
         Actions: Ban, Impersonate, Override Tier
```

### 10.2 Marketplace Moderation
```
/admin/marketplace → View All Items
                          ↓
         Actions: Hide, Unhide, Delete
                          ↓
         ModerationLog recorded
```

### 10.3 System Settings
```
/admin/settings → Tier Limits Configuration
                       ↓
    Per-tier limits: routines, tasks, persons, etc.
                       ↓
    Rate limit configuration
                       ↓
    Kiosk settings (inactivity timeout)
```

### 10.4 Audit Logs
```
/admin/audit → View All Actions
                    ↓
    Filter by: user, action, entity, date
                    ↓
    Actions logged: LOGIN, SIGNUP, TIER_CHANGE, etc.
```

**Files:** `app/admin/`, `lib/trpc/routers/admin-*.ts`

### 10.5 Ban User Feature
```
/admin/users → Select User → Ban Button
                                ↓
                    banUser mutation (with optional reason)
                                ↓
                    Set bannedAt timestamp
                                ↓
                    User cannot log in (checked in signIn)
                                ↓
                    Unban via unbanUser mutation
```

### 10.6 Impersonate User Feature
```
/admin/users → Select User → Impersonate Button
                                ↓
                    startImpersonation mutation
                                ↓
                    Create temp session token (1 hour)
                                ↓
                    Admin views app as target user
                                ↓
                    endImpersonation to return
```
**Safeguards:** Cannot impersonate other admins. All actions logged.

### 10.7 Additional Admin Features
- **GDPR permanent delete:** Comprehensive user data deletion
- **TierBadgeSelect:** Inline tier editing in user list
- **Role-level tier statistics:** View tier distribution per role type
- **Self-revocation prevention:** Admins cannot remove their own admin status
- **Admin deletion prevention:** Cannot delete admin users
- **`/admin/blog`:** Blog post management
- **`/admin/rate-limits`:** View and configure rate limits

---

## 11. School Mode (Principal)

School Mode enables principals to manage schools with teachers and support staff. It provides a hierarchical structure for educational institutions with centralized administration.

### 11.1 Core Concepts

```
School Hierarchy:
┌─────────────────────────────────────────────────────────┐
│                      SCHOOL                             │
│                         │                               │
│     ┌───────────────────┼───────────────────┐          │
│     ↓                   ↓                   ↓          │
│ PRINCIPAL          TEACHERS           SUPPORT STAFF    │
│ (Full control)     (Classrooms)       (View access)    │
│     │                   │                              │
│     │           ┌───────┼───────┐                      │
│     │           ↓       ↓       ↓                      │
│     │      Classroom Classroom Classroom               │
│     │           │                                      │
│     │       Students                                   │
└─────────────────────────────────────────────────────────┘
```

**Role Types within School:**
| Role | Permissions | Created From |
|------|-------------|--------------|
| PRINCIPAL | Full school management, invite staff, connect classrooms | School creator |
| TEACHER | Manage own classrooms, connect to school | Accepts SCHOOL_TEACHER invitation |
| SUPPORT | View-only access to school data | Accepts SCHOOL_SUPPORT invitation |

**Key Database Models:**
- `School` - The educational institution
- `SchoolMember` - Links roles to schools with role type (PRINCIPAL/TEACHER/SUPPORT)
- `Group.schoolId` - Connects classrooms to schools for billing

### 11.2 School Creation Flow

```
User (with PARENT or TEACHER role)
              ↓
/principal → No schools found → "Create Your First School"
              ↓
/principal/create-school → School Creation Form
              ↓
    ┌─────────────────────────┐
    │ name: "Lincoln Elementary" │
    │ address: "123 Main St"     │
    │ website: "https://..."     │
    └─────────────────────────┘
              ↓
school.create mutation (transaction):
    1. Verify role exists
    2. Create School record
    3. Create SchoolMember (PRINCIPAL)
              ↓
Redirect to /principal dashboard
              ↓
Mode switcher now shows "Principal Mode" tab
```

**Files:** `/principal/create-school/page.tsx`, `lib/trpc/routers/school.ts:create`

### 11.3 Principal Dashboard Flow

```
/principal → Load Session → Check schoolMemberships
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
            Single School    Multi School    No Schools
                    ↓               ↓               ↓
            Show Dashboard   School Selector   Create School
                                    ↓
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓               ↓
                Teachers      Classrooms     Support Staff    Invitations
                    ↓               ↓               ↓               ↓
              View list      View list       View list       Pending list
              w/ remove      (read-only)     w/ remove       w/ cancel
```

**Dashboard Components:**
```
┌─────────────────────────────────────────────────────────┐
│  [School Selector dropdown] (if multiple schools)       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🏫 Lincoln Elementary School                     │  │
│  │     School Administration                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │Classrooms│ │Teachers │ │Support │ │Students │          │
│  │    5     │ │   12    │ │   3    │ │   150   │          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
│                                                         │
│  ┌─────────────────────┐ ┌─────────────────────┐      │
│  │ Teachers            │ │ Classrooms           │      │
│  │ • John Smith        │ │ • Grade 3A (25)      │      │
│  │ • Jane Doe          │ │ • Grade 3B (22)      │      │
│  │ [View all]          │ │ [View all]           │      │
│  └─────────────────────┘ └─────────────────────┘      │
│                                                         │
│  ┌─────────────────────┐ ┌─────────────────────┐      │
│  │ Support Staff       │ │ Pending Invitations  │      │
│  │ • Admin Assistant   │ │ • teacher@school.edu │      │
│  │ [View all]          │ │   (Teacher - Pending)│      │
│  └─────────────────────┘ └─────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**Files:** `/principal/page.tsx`, `lib/trpc/routers/school.ts:getMembers,getClassrooms,getPendingInvitations`

### 11.4 Teacher Invitation Flow

```
PRINCIPAL                                TEACHER
=========                                =======

1. /principal/[schoolId]/invite
         ↓
   Select "Teacher" role type
         ↓
   Enter email: teacher@school.edu
         ↓
   school.inviteTeacher mutation:
     a. Verify caller is PRINCIPAL
     b. Create Invitation (type=SCHOOL_TEACHER)
     c. Update invitation with schoolId, schoolRole='TEACHER'
     d. Send email with invitation link
         ↓
   Invitation appears in pending list
                                         2. Receive email with invite link
                                                    ↓
                                         /invitations/accept?code=...
                                                    ↓
                                         acceptSchoolTeacherInvitationTx:
                                           a. Find/create TEACHER role
                                           b. Create SchoolMember (role=TEACHER)
                                                    ↓
                                         Teacher can now:
                                           • Access school classrooms
                                           • Connect classrooms to school
                                           • See "Principal Mode" in switcher

3. Invitation removed from pending
   Teacher appears in school members
```

**Invitation Schema:**
```typescript
Invitation {
  type: InvitationType.SCHOOL_TEACHER
  schoolId: string           // Target school
  schoolRole: 'TEACHER'      // Role within school
  expiresAt: Date            // 7 days from creation
}
```

**Files:** `/principal/[schoolId]/invite/page.tsx`, `lib/trpc/routers/school.ts:inviteTeacher`, `lib/services/invitation.service.ts:acceptSchoolTeacherInvitationTx`

### 11.5 Support Staff Invitation Flow

```
PRINCIPAL                                SUPPORT STAFF
=========                                =============

1. /principal/[schoolId]/invite
         ↓
   Select "Support Staff" role type
         ↓
   Enter email: admin@school.edu
         ↓
   school.inviteSupport mutation:
     a. Verify caller is PRINCIPAL
     b. Create Invitation (type=SCHOOL_SUPPORT)
     c. Update invitation with schoolId, schoolRole='SUPPORT'
     d. Send email with invitation link
         ↓
   Invitation appears in pending list
                                         2. Receive email with invite link
                                                    ↓
                                         /invitations/accept?code=...
                                                    ↓
                                         acceptSchoolSupportInvitationTx:
                                           a. Find/create PARENT role
                                           b. Create SchoolMember (role=SUPPORT)
                                                    ↓
                                         Support staff can now:
                                           • View school data (read-only)
                                           • Access parent/teacher modes
                                           • NO classroom management
```

**Note:** Support staff use PARENT role internally but get SUPPORT membership in school. This allows them to use parent features while having limited school access.

### 11.6 Classroom-School Connection Flow

```
TEACHER (in school)                      PRINCIPAL VIEW
===================                      ==============

1. Teacher creates classroom normally
   (/teacher → Create Classroom)
         ↓
2. school.connectClassroom:
   • Teacher must be school member
   • Classroom must belong to teacher
   • Updates Group.schoolId
         ↓
3. Classroom appears in:                 Sees classroom in:
   • Teacher's dashboard                 • Principal dashboard
   • School's classroom list             • /principal/[schoolId]/classrooms
         ↓
4. Billing: Classroom counts toward      Can view student counts
   school's subscription                 and teacher assignments
```

**Disconnect Flow:**
```
Teacher → school.disconnectClassroom
              ↓
    Verify teacher owns classroom
              ↓
    Set Group.schoolId = null
              ↓
    Classroom removed from school
    (still exists in teacher's dashboard)
```

### 11.7 School Member Management

```
/principal/[schoolId]/teachers → Teachers List
                                       ↓
                    ┌──────────────────┼──────────────────┐
                    ↓                  ↓                  ↓
              View Details       Remove Member      Invite More
                    ↓                  ↓                  ↓
              User name/email    school.removeMember  → Invite page
                    ↓                  ↓
              Joined date        Confirm → Remove
                                       ↓
                                Set status='REMOVED'
                                       ↓
                                Teacher loses school access
                                (keeps their classrooms)
```

**Member Removal Rules:**
- Cannot remove self (prevent principal lockout)
- Removed members keep their roles and classrooms
- Only SchoolMember status changes to 'REMOVED'
- Teacher can be re-invited later

### 11.8 School Settings Management

```
/principal/[schoolId]/settings → Settings Page
                                       ↓
              ┌────────────────────────┼────────────────────────┐
              ↓                        ↓                        ↓
        School Info              Danger Zone            (Future: Billing)
              ↓                        ↓
    • Name (editable)           Delete School
    • Address (editable)              ↓
    • Website (editable)        Confirm dialog
              ↓                        ↓
    school.update mutation      (Not implemented)
```

### 11.9 Mode Switching with Principal

```
User with school membership
         ↓
getSession → includes schoolMemberships
         ↓
mode-switcher.tsx checks:
  hasPrincipalAccess = schoolMemberships.some(
    m => m.role === 'PRINCIPAL' && m.status === 'ACTIVE'
  )
         ↓
    ┌────────────────────────────────────────┐
    │ [Parent Mode] [Teacher Mode] [Principal Mode] │
    └────────────────────────────────────────┘
         ↓
Click "Principal Mode" → /principal
         ↓
Last mode saved to localStorage
```

**Mode Access Rules:**
| User Has | Modes Available |
|----------|----------------|
| PARENT role only | Parent |
| TEACHER role only | Teacher |
| PARENT + TEACHER | Parent, Teacher |
| PARENT + PRINCIPAL membership | Parent, Principal |
| TEACHER + PRINCIPAL membership | Teacher, Principal |
| All three | Parent, Teacher, Principal |

### 11.10 Multi-School Support

```
User can be PRINCIPAL of multiple schools:
              ↓
┌─────────────────────────────────────┐
│  Select School: [Lincoln Elementary ▼]  │
│                 ├── Lincoln Elementary  │
│                 ├── Washington Middle   │
│                 └── Jefferson High      │
└─────────────────────────────────────┘
              ↓
Switching school reloads:
  • Members list
  • Classrooms list
  • Pending invitations
              ↓
Each school has independent:
  • Teacher roster
  • Support staff
  • Connected classrooms
  • Billing/subscription
```

**Teacher Multi-School:**
```
Teacher can be member of multiple schools:
              ↓
Same TEACHER role → Multiple SchoolMember records
              ↓
Different classrooms can connect to different schools
              ↓
Teacher sees "Principal Mode" if PRINCIPAL in any school
```

### 11.11 Authorization Matrix

| Action | PRINCIPAL | TEACHER | SUPPORT |
|--------|-----------|---------|---------|
| View school dashboard | ✓ | ✗ | ✗ |
| Invite teachers | ✓ | ✗ | ✗ |
| Invite support staff | ✓ | ✗ | ✗ |
| Remove members | ✓ | ✗ | ✗ |
| Update school settings | ✓ | ✗ | ✗ |
| View school members | ✓ | ✓ | ✓ |
| View school classrooms | ✓ | ✓ | ✓ |
| Connect own classroom | ✗ | ✓ | ✗ |
| Disconnect own classroom | ✗ | ✓ | ✗ |
| View all students | ✓ | ✗ | ✗ |
| Link students cross-teacher | ✓ | ✗ | ✗ |

### 11.12 Database Models

```
School {
  id: cuid
  name: string
  address: string?
  website: string?
  status: 'ACTIVE' | 'ARCHIVED'
  members: SchoolMember[]
  classrooms: Group[] (via schoolId)
  invitations: Invitation[]
}

SchoolMember {
  id: cuid
  schoolId: string → School
  roleId: string → Role
  role: 'PRINCIPAL' | 'TEACHER' | 'SUPPORT'
  status: 'ACTIVE' | 'REMOVED'
  createdAt: DateTime
}

Invitation (extended) {
  schoolId: string? → School
  schoolRole: 'TEACHER' | 'SUPPORT'?
}

Group (extended) {
  schoolId: string? → School
}
```

### 11.13 API Endpoints

| Endpoint | Method | Authorization | Purpose |
|----------|--------|---------------|---------|
| `school.create` | mutation | verified | Create new school |
| `school.update` | mutation | PRINCIPAL | Update school details |
| `school.list` | query | member | List user's schools |
| `school.getMembers` | query | member | Get school members |
| `school.removeMember` | mutation | PRINCIPAL | Remove teacher/support |
| `school.connectClassroom` | mutation | TEACHER+member | Link classroom to school |
| `school.disconnectClassroom` | mutation | TEACHER+owner | Unlink classroom |
| `school.getClassrooms` | query | member | List school classrooms |
| `school.inviteTeacher` | mutation | PRINCIPAL | Send teacher invitation |
| `school.inviteSupport` | mutation | PRINCIPAL | Send support invitation |
| `school.getPendingInvitations` | query | PRINCIPAL | List pending invites |
| `school.cancelInvitation` | mutation | PRINCIPAL | Cancel pending invite |
| `school.getAllStudents` | query | PRINCIPAL | View all students |
| `school.bulkLinkStudents` | mutation | PRINCIPAL | Link students across teachers |

**Files:** `lib/trpc/routers/school.ts`

### 11.14 Invitation Status Flow

```
                    PENDING
                       ↓
    ┌──────────────────┼──────────────────┐
    ↓                  ↓                  ↓
ACCEPTED          CANCELLED           EXPIRED
    ↓                  ↓                  ↓
SchoolMember      Principal cancels   7 days passed
created                ↓                  ↓
                  Can re-invite      Can re-invite
```

**InvitationStatus Enum:**
- `PENDING` - Awaiting acceptance
- `ACCEPTED` - User joined school
- `CANCELLED` - Principal revoked
- `EXPIRED` - Past expiration date
- `REJECTED` - User declined (not used for school invites)

### 11.15 Session Data Structure

```typescript
// getSession response includes:
{
  user: {
    id, email, name, isAdmin,
    roles: [...],
    schoolMemberships: [
      {
        id: "member-id",
        schoolId: "school-id",
        roleId: "role-id",
        role: "PRINCIPAL" | "TEACHER" | "SUPPORT",
        status: "ACTIVE",
        school: {
          id: "school-id",
          name: "Lincoln Elementary"
        }
      }
    ]
  }
}
```

### 11.16 Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| "Role not found" | Invalid roleId | Use valid role from session |
| "Only principals can..." | Non-principal attempting admin action | Must be PRINCIPAL |
| "You must be a member of this school" | Accessing school without membership | Get invited first |
| "Classroom not found or not owned by you" | Connecting non-owned classroom | Must own classroom |
| "Cannot remove yourself from the school" | Principal self-removal | Transfer principal first |

### 11.17 Future Enhancements

- **Delete school:** Full school deletion with cascade
- **Transfer principal:** Hand over principal role to another member
- **School billing:** Centralized subscription for all classrooms
- **School-wide routines:** Assign routines across all classrooms
- **Support staff permissions:** Granular access control
- **School reports:** Aggregate analytics across classrooms

---

## Quick Reference: Key Files

| Feature | Router | Service | UI |
|---------|--------|---------|-----|
| Auth | `auth.ts` | `user-initialization.service.ts`, `email.service.ts` | `app/(auth)/` |
| Tasks | `task.ts` | `task-completion*.ts` | `components/task/` |
| Routines | `routine.ts` | `reset-period.ts` | `components/routine/` |
| Goals | `goal.ts` | `goal-progress-enhanced.ts` | `components/goal/` |
| Conditions | `condition.ts` | `condition-evaluator.service.ts` | - |
| Kiosk | `kiosk.ts` | `kiosk-*.ts` | `app/kiosk/` |
| Marketplace | `marketplace.ts` | `marketplace.service.ts` | `components/marketplace/` |
| Connections | `person-connection.ts` | `person-connection.service.ts` | `components/sharing/` |
| Groups | `group.ts` | - | `components/classroom/` |
| School Mode | `school.ts` | `invitation.service.ts` | `app/(dashboard)/principal/` |

---

## Rate Limits Summary

| Action | Limit | Window |
|--------|-------|--------|
| Auth attempts | 5 | 2 min |
| Code generation (kiosk) | 10 | 1 hour |
| Code generation (connection) | 10 | 1 hour |
| Code claim failures | 5 | 1 hour |
| Invitations | 10 | 1 day |
| Invitation token lookup | 10 | 1 min |
| Verification codes | 3 attempts | per code |

---

*Last updated: 2025-12-01* (Added School Mode section)
