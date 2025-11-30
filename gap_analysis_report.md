# Gap Analysis Report: app_ux_flow.md vs Codebase

Generated: 2025-11-30

---

## Executive Summary

| Section | Verified | Missing | Undocumented | Issues |
|---------|----------|---------|--------------|--------|
| 1. Authentication | 7 | 3 | 5 | 9 |
| 2. Parent Mode | 7 | 3 | 7 | 0 |
| 3. Teacher Mode | 5 | 3 | 5 | 1 |
| 4. Kiosk Mode | 9 | 2 | 8 | 1 |
| 5. Marketplace | 7 | 3 | 6 | 2 |
| 6. Connections | 8 | 3 | 5 | 2 |
| 7. Goals & Conditions | 9 | 3 | 5 | 2 |
| 8. Task Types | 7 | 2 | 5 | 3 |
| 9. Routine Config | 6 | 4 | 4 | 2 |
| 10. Admin | 9 | 3 | 7 | 2 |

**Critical Gaps:** 3 | **High Priority:** 8 | **Medium:** 15 | **Low:** 20+

---

## Critical Gaps (Security/Functionality Broken)

### 1. 2FA Not Integrated Into Login Flow
- **Location:** `lib/trpc/routers/auth.ts:142-225`
- **Issue:** Users with 2FA enabled can log in WITHOUT entering 2FA code
- **Impact:** Security bypass - 2FA provides no protection
- **Fix:** Add 2FA verification step in `auth.signIn` mutation

### 2. Password Reset Missing
- **Location:** `app/(auth)/login/page.tsx:97-100` references `/reset-password`
- **Issue:** Link exists but page doesn't - results in 404
- **Impact:** Users cannot recover accounts
- **Fix:** Implement password reset flow

### 3. Failed Login Tracking Not Called
- **Location:** `lib/auth/verification.ts` has `recordFailedLogin()`, `checkLoginRateLimit()`
- **Issue:** Functions exist but never invoked in auth.signIn
- **Impact:** Unlimited password guessing attempts
- **Fix:** Call rate limit functions in signIn mutation

---

## High Priority Gaps

### 4. Undo Window Inconsistency
- **Doc:** 10 seconds | **Code:** 5 minutes (`lib/services/task-completion.ts`)
- **Doc:** MULTI/PROGRESS no undo | **Code:** Allows undo for all types
- **Impact:** User confusion, potential data integrity issues

### 5. Post-Login Redirect Wrong
- **Doc:** `/dashboard` | **Code:** `/parent`
- **Location:** `app/auth/callback/route.ts:342`, `app/(auth)/login/page.tsx:21`

### 6. Auth Rate Limit Mismatch
- **Doc:** 5 attempts / 15 min | **Code:** 5 attempts / 2 min
- **Location:** `lib/constants.ts:245`

### 7. birthDate Field Missing
- **Doc:** PersonForm has birthDate | **Code:** Only name, avatar
- **Location:** `components/person/person-form.tsx:227-248`

### 8. Goals Not on Parent Dashboard
- **Doc:** Dashboard shows Persons, Routines, Goals
- **Code:** Only PersonList; goals on separate page

### 9. MONTHLY Period Not in UI
- **Code:** Exists in schema and reset-period.ts
- **UI:** Only DAILY/WEEKLY in routine form dropdown

### 10. Ban/Impersonate Missing
- **Doc:** "Actions: Ban, Impersonate"
- **Code:** No implementation found

### 11. Email Sending Not Implemented
- **Location:** `lib/trpc/routers/auth.ts:300-302`
- Comments indicate pending integration

---

## Section Details

### Section 1: Authentication

**Missing:**
- Password reset flow (link exists, page doesn't)
- 2FA integration in login
- Failed login tracking

**Undocumented:**
- Seed data migration logic
- Email verification code system (15min expiry, 3 attempts)
- `isTeacher` flag on account owners
- `isProtected` on Daily Routine

**Issues:**
- 2FA can be bypassed
- OAuth error handling generic
- Missing logout confirmation
- `TWO_FACTOR_ENCRYPTION_KEY` not validated at startup

---

### Section 2: Parent Mode

**Missing:**
- birthDate in PersonForm
- Goals on dashboard (separate page instead)
- Archive option in delete

**Undocumented:**
- `/parent/connections` page
- `/parent/goals` page
- PersonConnectionsManager
- ConnectedPersonsSection
- Co-parent feature
- GetRoutinesModal
- Smart Routines with conditions

---

### Section 3: Teacher Mode

**Missing:**
- Explicit Teachers/Students columns in UI
- "Assign Routines per-student or whole class" flow
- Kiosk Code Manager in classroom context

**Undocumented:**
- `useDashboardRealtime` hook
- `person.getBatch` query
- Optimistic updates in bulk check-in
- Classroom emoji/color customization
- `kioskLastUpdatedAt` timestamp

**Issues:**
- Bulk check-in only shows SIMPLE tasks (MULTI/PROGRESS excluded)

---

### Section 4: Kiosk Mode

**Missing:**
- Undo window is 5 min not 10 sec
- MULTI/PROGRESS allow undo (doc says no)

**Undocumented:**
- `useKioskRealtime` hook
- `useOptimisticKioskCheckin` hook
- Dynamic column layout
- Progress calculation for person cards
- `checkRoleUpdates` polling
- Animated task completion
- Session termination tracking
- Inactivity timeout from admin

**Issues:**
- `undoMutation` doesn't check task type

---

### Section 5: Marketplace

**Missing:**
- `routine.checkCopyConflicts` in marketplace router
- RENAME/SKIP conflict options (only MERGE for Daily Routine)
- Share code expiry config not exposed

**Undocumented:**
- `targetAudience` auto-detection
- `userRoleType` filter in search
- `hasUserImportedItem` check
- Semantic versioning on update
- `MarketplaceImport` tracking
- Comments pagination

**Issues:**
- Fork always creates assignment even when merging
- No unpublish/delete marketplace item endpoint

---

### Section 6: Connections & Sharing

**Missing:**
- Email sending (commented out)
- Variable permissions for StudentParent

**Undocumented:**
- `revokeConnectionCode` function
- `getActiveConnectionCodes` query
- `disconnectedBy` tracking
- `determineAllowedTargetType` helper

**Inconsistencies:**
- Doc: EDIT_TASKS | Code: TASK_COMPLETION for co-parent
- Rate limits differ between connection types

---

### Section 7: Goals & Conditions

**Missing:**
- TIME_BASED, VALUE_BASED, PERCENTAGE (Phase 2)
- GOAL_PROGRESS_GT operator
- Streak calculation implementation

**Undocumented:**
- `detectCircularDependency` function
- `evaluateBatch` for bulk evaluation
- `getAvailableTargets` query
- `calculateGoalProgressBatchEnhanced`
- `batchCreate` for teacher assignment

**Issues:**
- No streak calculation service despite STREAK type existing

---

### Section 8: Task Types & Completion

**Missing:**
- Idempotency key implementation not visible
- Row locking not visible

**Undocumented:**
- `getTaskAggregation` helper
- `getRemainingUndoTime` function
- `validateProgressValue` function
- Smart task handling in aggregation

**Inconsistencies:**
- Undo window calculation (10/60 minutes)
- entryNumber increments for all types

**Issues:**
- No row-level locking visible
- SIMPLE tasks can have multiple completions
- No deviceId tracking

---

### Section 9: Routine Configuration

**Missing:**
- MONTHLY in UI (exists in code)
- CONDITIONAL visibility option
- DATE_RANGE date picker
- Custom reset time config

**Undocumented:**
- Color picker with presets
- Emoji/Icon picker
- CUSTOM reset period (throws error)
- Duration limited to presets

**Inconsistencies:**
- Duration 10-90 vs UI presets up to 60

---

### Section 10: Admin Features

**Missing:**
- Ban user feature
- Impersonate user feature
- Kiosk inactivity setting

**Undocumented:**
- GDPR permanent delete (comprehensive)
- TierBadgeSelect inline editing
- Role-level tier statistics
- Self-revocation prevention
- Admin deletion prevention
- Blog admin page
- Rate limits admin page

**Issues:**
- UUID vs CUID format mismatch in audit router
- IP/userAgent logging disabled

---

## Recommendations

### Immediate (Critical)
1. Integrate 2FA into login flow
2. Implement password reset
3. Call failed login tracking functions

### Short-term (High)
4. Fix undo window to match documentation
5. Correct post-login redirect
6. Add birthDate to PersonForm
7. Expose MONTHLY reset period in UI

### Medium-term
8. Implement ban/impersonate features
9. Add email sending integration
10. Add streak calculation service
11. Implement row-level locking for task completion

### Documentation Updates Needed
- Add undocumented features to app_ux_flow.md
- Correct rate limit values
- Document Phase 2 features as "Not Implemented"

---

## Corrections (Manual Verification - 2025-11-30)

The following findings from the original Opus agent report have been verified and corrected:

### ✅ Verified as CORRECT

| Finding | Status | Evidence |
|---------|--------|----------|
| Critical 1: 2FA not in login | ✅ Correct | `auth.ts:142-225` - signIn mutation has no 2FA check |
| Critical 2: Password reset missing | ✅ Correct | No `/reset-password` route exists, link at `login/page.tsx:97` leads to 404 |
| Critical 3: Failed login tracking | ✅ Correct | `recordFailedLogin()` and `checkLoginRateLimit()` exist but not called in signIn |
| High 5: Post-login redirect | ✅ Correct | Both `callback/route.ts:342` and `login/page.tsx:21` redirect to `/parent` |
| High 6: Auth rate limit | ✅ Correct | Doc: 5/15min, Code: `lib/utils/constants.ts:245` shows 5/2min |
| High 7: birthDate missing | ✅ Correct | `person-form.tsx` only has name, emoji, color - no birthDate |
| High 9: MONTHLY not in UI | ✅ Correct | `routine-form.tsx:369-370` only shows DAILY/WEEKLY options |
| High 10: Ban/Impersonate | ✅ Correct | No implementation found in admin routers |
| High 11: Email not implemented | ✅ Correct | `auth.ts:300-302` has "FEATURE: Email service integration pending" comment |

### ⚠️ CORRECTIONS NEEDED

#### 1. High Priority Gap 4: Undo Window Inconsistency

**Original Report:** "Doc: 10 seconds | Code: 5 minutes"

**CORRECTION:** This is PARTIALLY INCORRECT. There are TWO separate undo implementations:

| Context | Window | Task Types | Matches Doc? |
|---------|--------|------------|--------------|
| Regular task router (`lib/services/task-completion.ts:6`) | 10 seconds | SIMPLE only | ✅ YES |
| Kiosk router (`lib/trpc/routers/kiosk.ts:449`) | 5 minutes | ALL types | ❌ NO |

**Actual Issue:** The KIOSK undo (5 min, all types) is inconsistent with documentation, not the regular task undo.

**Evidence:**
```typescript
// task-completion.ts:6 - Regular tasks
const UNDO_WINDOW_MINUTES = 10 / 60; // = 10 seconds ✓

// task-completion.ts:17 - Only SIMPLE tasks
if (taskType !== TaskType.SIMPLE) {
  return false;
}

// kiosk.ts:449 - Kiosk allows 5 min, doesn't check task type
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
```

#### 2. Section 4 Kiosk: "Undo window is 5 min not 10 sec"

**CORRECTION:** Should read: "Kiosk undo window (5 min) differs from regular task undo (10 sec) and allows ALL task types instead of SIMPLE only"

#### 3. Section 5 Marketplace: "routine.checkCopyConflicts in marketplace router"

**CORRECTION:** `checkCopyConflicts` DOES exist in `lib/trpc/routers/routine.ts:257`. However, the marketplace uses a separate fork flow, so this may still be a valid gap if marketplace doesn't call the routine router's checkCopyConflicts.

#### 4. Section 8: "Undo window calculation (10/60 minutes)"

**CORRECTION:** Should read "10 seconds / 5 minutes" - the 60 minutes is incorrect.

### Summary of Corrections

| Original Finding | Correction |
|------------------|------------|
| "Code: 5 minutes" for undo | Regular task = 10 sec (correct), Kiosk = 5 min (inconsistent) |
| "MULTI/PROGRESS allow undo" | Only in Kiosk router; regular task router correctly blocks non-SIMPLE |
| "checkCopyConflicts missing" | Exists in routine router at line 257 |
| "10/60 minutes" typo | Should be "10 seconds / 5 minutes" |
