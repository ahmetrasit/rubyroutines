# Database Schema Audit Report

**Generated:** 2025-11-30
**Schema File:** `/Users/ahmetrasit/rubyroutines/prisma/schema.prisma`
**Database:** PostgreSQL 15 (Supabase)

---

## Executive Summary

| Category | Status | Count |
|----------|--------|-------|
| Total Models | - | 40 |
| Unused Models | CONCERN | 3 |
| Unused Fields | INFO | ~8 |
| Missing Indexes | RECOMMENDATION | 5 |
| Cascade Delete Issues | OK | 0 |
| Relation Integrity | OK | All relations properly defined |

---

## Model-by-Model Analysis

### CORE ENTITIES

#### User
**Status:** ACTIVE - Heavily used
**Files Using:** `auth.ts`, `admin-users.ts`, `two-factor.ts`, `gdpr.ts`, `blog.ts`, services
**Fields Usage:**
| Field | Status | Notes |
|-------|--------|-------|
| id, email, name | USED | Core authentication |
| emailVerified | USED | Auth verification |
| image | USED | Profile |
| isAdmin | USED | Admin panel access |
| bannedAt | USED | User moderation |
| deletedAt | USED | Soft delete support |
| twoFactorEnabled | USED | 2FA flows |
| twoFactorSecret | USED | 2FA secret storage |
| twoFactorBackupCodes | USED | 2FA backup codes |

**Index Assessment:** Has `@@index([isAdmin])` - ADEQUATE

---

#### Role
**Status:** ACTIVE - Core business model
**Files Using:** All routers, auth middleware, services
**Fields Usage:**
| Field | Status | Notes |
|-------|--------|-------|
| id, userId, type, tier | USED | Core fields |
| color | USED | UI customization |
| tierOverride | USED | Admin tier overrides |
| stripeCustomerId | USED | Stripe integration |
| stripeSubscriptionId | USED | Stripe integration |
| subscriptionStatus | USED | Billing state |
| deletedAt | USED | Soft delete |
| kioskLastUpdatedAt | USED | Kiosk polling optimization |

**Index Assessment:** Has `@@index([userId])`, `@@index([type])` - ADEQUATE

---

### PEOPLE & GROUPS

#### Person
**Status:** ACTIVE - Heavily used
**Files Using:** `person.ts`, `kiosk.ts`, `task.ts`, services
**Fields Usage:**
| Field | Status | Notes |
|-------|--------|-------|
| id, roleId, name | USED | Core fields |
| birthDate | USED | Person profile |
| avatar | USED | UI display |
| notes | USED | Task completion notes |
| isAccountOwner | USED | Account identification |
| isTeacher | USED | Teacher/student distinction |
| status, archivedAt | USED | Entity status management |
| kioskLastUpdatedAt | USED | Kiosk polling |

**Index Assessment:** Comprehensive - has composite indexes for common queries

---

#### Group
**Status:** ACTIVE - Heavily used
**Files Using:** `group.ts`, `kiosk.ts`, marketplace service
**Fields Usage:** All fields in use including emoji and color for UI customization

**Index Assessment:** Comprehensive composite indexes

---

#### GroupMember
**Status:** ACTIVE
**Files Using:** `group.ts`, marketplace service, seed
**Index Assessment:** ADEQUATE

---

### ROUTINES & TASKS

#### Routine
**Status:** ACTIVE - Core feature
**Files Using:** `routine.ts`, `task.ts`, `kiosk.ts`, multiple services
**Fields Usage:**
| Field | Status | Notes |
|-------|--------|-------|
| Core fields | USED | name, description, type, roleId |
| resetPeriod, resetDay | USED | Reset logic |
| visibility, visibleDays | USED | Visibility control |
| startDate, endDate | USED | Date range visibility |
| startTime, endTime | USED | Time-limited routines |
| color | USED | UI customization |
| isTeacherOnly | USED | Teacher-only filtering |
| isProtected | USED | Protected routines |
| sourceMarketplaceItemId | USED | Marketplace import tracking |

**Index Assessment:** Comprehensive - 6 indexes including composites

---

#### Task
**Status:** ACTIVE - Core feature
**Files Using:** `task.ts`, `kiosk.ts`, condition services, goal services
**Fields Usage:**
| Field | Status | Notes |
|-------|--------|-------|
| All core fields | USED | |
| version | USED | Optimistic locking |
| emoji, color | USED | UI styling |
| unit | USED | PROGRESS type tasks |
| isSmart, conditionId | USED | Smart task conditions |

**Index Assessment:** Comprehensive - 7 indexes

---

#### TaskCompletion
**Status:** ACTIVE - Heavily used
**Files Using:** `task.ts`, `kiosk.ts`, analytics, achievements, streaks
**Fields Usage:**
| Field | Status | Notes |
|-------|--------|-------|
| taskId, personId, completedAt | USED | Core tracking |
| value, summedValue | USED | PROGRESS type |
| entryNumber | USED | Multiple check-in tracking |
| notes | USED | Completion notes |
| idempotencyKey | USED | Duplicate prevention |
| deviceId, sessionId | USED | Coordination |

**Index Assessment:** ADEQUATE - has composite index for period queries

---

#### RoutineAssignment
**Status:** ACTIVE
**Files Using:** `routine.ts`, marketplace service, streak tracking
**Index Assessment:** ADEQUATE

---

### GOALS & CONDITIONS

#### Goal
**Status:** ACTIVE
**Files Using:** `goal.ts`, analytics service, goal evaluator
**Fields Usage:** All fields appear to be in use
**Index Assessment:** ADEQUATE with composite indexes

---

#### GoalTaskLink / GoalRoutineLink
**Status:** ACTIVE
**Files Using:** `goal.ts`, condition evaluator
**Index Assessment:** ADEQUATE

---

#### GoalProgress
**Status:** ACTIVE
**Files Using:** `goal.ts`, goal evaluator service
**Index Assessment:** ADEQUATE

---

#### Condition / ConditionCheck
**Status:** ACTIVE
**Files Using:** `condition.ts`, condition evaluator services, circular dependency check
**Index Assessment:** ADEQUATE

---

#### VisibilityOverride
**Status:** ACTIVE
**Files Using:** `routine.ts`
**Index Assessment:** ADEQUATE

---

### KIOSK MODE

#### Code
**Status:** ACTIVE
**Files Using:** `kiosk.ts`, kiosk-code service, kiosk-session service
**Index Assessment:** Comprehensive - 7 indexes including composites

---

#### KioskSession
**Status:** ACTIVE
**Files Using:** kiosk-session service, `kiosk.ts`
**Index Assessment:** ADEQUATE - has composite for active sessions

---

#### ConnectionCode
**Status:** ACTIVE
**Files Using:** connection service (student-parent connections)
**Index Assessment:** ADEQUATE

---

### SHARING & PERMISSIONS

#### Invitation
**Status:** ACTIVE
**Files Using:** `invitation.ts`, invitation service, marketplace share code service
**Index Assessment:** ADEQUATE

---

#### CoParent
**Status:** ACTIVE
**Files Using:** `coparent.ts`, invitation service, permission service
**Index Assessment:** ADEQUATE

---

#### CoTeacher
**Status:** ACTIVE
**Files Using:** `coteacher.ts`, invitation service, teacher-only routine service
**Index Assessment:** ADEQUATE

---

#### StudentParentConnection
**Status:** ACTIVE
**Files Using:** connection service, `person.ts`
**Index Assessment:** ADEQUATE

---

### UNUSED MODELS (CONCERN)

#### PersonSharingInvite
**Status:** UNUSED
**Evidence:** No `prisma.personSharingInvite` calls found
**Schema Location:** Lines 830-864
**Recommendation:** This appears to be a planned feature not yet implemented. Consider:
1. Implementing the feature
2. Or removing from schema to reduce complexity

---

#### PersonSharingConnection
**Status:** UNUSED
**Evidence:** No `prisma.personSharingConnection` calls found
**Schema Location:** Lines 867-903
**Recommendation:** Same as PersonSharingInvite - planned but not implemented

---

#### School / SchoolMember
**Status:** UNUSED
**Evidence:** No `prisma.school` or `prisma.schoolMember` calls found
**Schema Location:** Lines 991-1022
**Recommendation:** School mode appears unimplemented. Consider:
1. Implementing school features
2. Or removing models to simplify schema

---

### PERSON CONNECTIONS (Cross-account)

#### PersonConnection / PersonConnectionCode
**Status:** ACTIVE
**Files Using:** `person-connection.ts` router, person-connection service
**Index Assessment:** Comprehensive

---

### MARKETPLACE

#### MarketplaceItem
**Status:** ACTIVE
**Files Using:** `marketplace.ts`, `admin-marketplace.ts`, marketplace service
**Index Assessment:** Comprehensive - 7 indexes

---

#### MarketplaceRating / MarketplaceComment / CommentFlag
**Status:** ACTIVE
**Files Using:** marketplace service, `admin-marketplace.ts`
**Index Assessment:** ADEQUATE

---

#### MarketplaceShareCode / RoutineShareCode
**Status:** ACTIVE
**Files Using:** marketplace-share-code service, routine-share-code service
**Index Assessment:** ADEQUATE

---

#### MarketplaceImport
**Status:** ACTIVE
**Files Using:** marketplace-share-code service
**Index Assessment:** ADEQUATE

---

### AUTHENTICATION

#### VerificationCode
**Status:** ACTIVE
**Files Using:** `lib/auth/verification.ts`
**Index Assessment:** ADEQUATE

---

### ADMIN PANEL

#### SystemSettings
**Status:** ACTIVE
**Files Using:** `admin-settings.ts`, system-settings service, user-management service
**Index Assessment:** Has category index - ADEQUATE

---

#### AuditLog
**Status:** ACTIVE
**Files Using:** audit-log service, admin-audit service
**Index Assessment:** ADEQUATE with 4 indexes

---

#### ModerationLog
**Status:** ACTIVE
**Files Using:** audit-log service (moderation functions)
**Index Assessment:** ADEQUATE

---

### BLOG

#### BlogPost / BlogLike
**Status:** ACTIVE
**Files Using:** `blog.ts` router
**Index Assessment:** ADEQUATE

---

### RATE LIMITING

#### RateLimit
**Status:** ACTIVE
**Files Using:** rate-limit service
**Index Assessment:** ADEQUATE

---

## Index Recommendations

### MISSING INDEXES (Consider Adding)

1. **User.bannedAt** - Currently no index
   - Used in: Login checks, user management
   - Recommendation: Add `@@index([bannedAt])` if querying banned users frequently

2. **TaskCompletion.personId + completedAt** - Existing composite may be insufficient
   - Heavy usage in analytics, streak tracking
   - Consider: `@@index([personId, completedAt])` for person-specific time queries

3. **MarketplaceItem.targetAudience + visibility**
   - Used for filtered marketplace queries
   - Consider: `@@index([targetAudience, visibility, hidden])` for marketplace listing

4. **Goal.personIds / groupIds** (Array fields)
   - These are array fields stored as String[]
   - Note: PostgreSQL array containment queries may benefit from GIN indexes
   - Consider: Using `@db.Array` with GIN index if query patterns require

5. **VerificationCode.userId + status**
   - Current usage queries by userId and status together
   - Consider: `@@index([userId, status])` composite

---

## Cascade Delete Assessment

All `onDelete: Cascade` behaviors appear intentional:

| Parent | Child | Behavior | Assessment |
|--------|-------|----------|------------|
| User | Role | Cascade | CORRECT - Roles belong to users |
| Role | Person, Group, Routine, Goal | Cascade | CORRECT - All belong to role |
| Routine | Task, Assignment | Cascade | CORRECT - Tasks belong to routine |
| Task | TaskCompletion | Cascade | CORRECT - Completions belong to task |
| Person | GroupMember, Assignment | Cascade | CORRECT |
| Group | GroupMember, Assignment, Code | Cascade | CORRECT |

**SetNull behaviors:**
- Task.conditionId -> Condition: SetNull - CORRECT (orphan condition references)
- TaskCompletion.sessionId -> KioskSession: SetNull - CORRECT (preserve history)
- PersonSharingConnection.inviteCodeId -> PersonSharingInvite: SetNull - CORRECT

---

## Unused/Potentially Unused Fields

| Model | Field | Status | Notes |
|-------|-------|--------|-------|
| Goal | simpleCondition | LOW USAGE | Used in goal configuration |
| Goal | comparisonOperator | LOW USAGE | Used in goal configuration |
| Goal | comparisonValue | LOW USAGE | Used in goal configuration |
| ConditionCheck | value2 | UNUSED | Reserved for "Phase 2" range operators |
| ConditionCheck | timeOperator, timeValue, dayOfWeek | LOW USAGE | Time-based conditions |

These appear to be intentional for future features or specialized use cases.

---

## Relation Integrity Assessment

All relations have been verified:
- All foreign keys have corresponding `@relation` definitions
- All many-to-many relationships use explicit join tables (GroupMember, GoalTaskLink, etc.)
- No orphaned references detected in schema
- Include statements in code match schema relations

---

## Summary of Findings

### Critical Issues: None

### High Priority Recommendations:
1. **Unused Models:** Consider removing or implementing `School`, `SchoolMember`, `PersonSharingInvite`, `PersonSharingConnection` (3 models + 1 related)

### Medium Priority Recommendations:
1. Add index on `User.bannedAt` if frequently queried
2. Consider composite index for marketplace audience filtering

### Low Priority:
1. Review Phase 2 reserved fields (value2, time operators)
2. Consider GIN indexes for array fields if using containment queries

---

## Files Analyzed

**Schema:** `/Users/ahmetrasit/rubyroutines/prisma/schema.prisma`
**Routers:** 28 files in `/Users/ahmetrasit/rubyroutines/lib/trpc/routers/`
**Services:** 30+ service files in `/Users/ahmetrasit/rubyroutines/lib/services/`
**Scripts:** Various test and utility scripts
