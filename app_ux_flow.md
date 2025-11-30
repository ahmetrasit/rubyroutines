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

### 2.4 Co-Parent Feature
```
Primary Parent → Invite co-parent via email
                      ↓
         CoParent record with permission level
                      ↓
         Shared access to persons and routines
```

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

### 6.3 Co-Teacher / Co-Parent
```
Primary User → Invite via Email
                    ↓
         Invitation (7-day expiry, 4-word code)
                    ↓
Invitee → Accept → Role auto-created if needed
                    ↓
         CoTeacher/CoParent record
                    ↓
         Permission Levels:
         - VIEW (read only)
         - EDIT_TASKS (complete tasks)
         - FULL_EDIT (manage everything)
```

**Files:** `lib/trpc/routers/person-connection.ts`, `lib/services/person-connection.service.ts`, `components/sharing/PersonConnectionModal.tsx`

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

---

## Rate Limits Summary

| Action | Limit | Window |
|--------|-------|--------|
| Auth attempts | 5 | 2 min |
| Code generation (kiosk) | 10 | 1 hour |
| Code generation (connection) | 10 | 1 hour |
| Code claim failures | 5 | 1 hour |
| Invitations | 10 | 1 day |
| Verification codes | 3 attempts | per code |
