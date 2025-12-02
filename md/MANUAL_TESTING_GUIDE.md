# Ruby Routines - Manual Testing Guide

Complete UX flows and test cases for all features.

**Last Updated:** 2024-12-02

---

## Table of Contents

1. [Authentication Flows](#1-authentication-flows)
2. [Role Management](#2-role-management)
3. [Person/Child Management](#3-personchild-management)
4. [Routine Management](#4-routine-management)
5. [Task Management](#5-task-management)
6. [Task Completions](#6-task-completions)
7. [Goals System](#7-goals-system)
8. [Kiosk Mode](#8-kiosk-mode)
9. [Co-Parent Features](#9-co-parent-features)
10. [Teacher Features](#10-teacher-features)
11. [Principal/School Features](#11-principalschool-features)
12. [Marketplace/Community](#12-marketplacecommunity)
13. [Settings](#13-settings)
14. [Admin Features](#14-admin-features)
15. [Real-Time Sync](#15-real-time-sync)
16. [Caching Behavior](#16-caching-behavior)

---

## 1. Authentication Flows

### 1.1 Signup

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/signup` | Signup form displays |
| 2 | Enter name (min 2 chars) | Field validates |
| 3 | Enter valid email | Field validates |
| 4 | Enter password (min 8 chars) | Field validates |
| 5 | Click "Sign Up" | Success → Redirect to `/verify` |

**Edge Cases:**
- [ ] Already registered email → Shows "email already registered"
- [ ] Weak password (<8 chars) → Shows validation error
- [ ] Temporary/test email → Shows "use a real email provider"
- [ ] Rate limiting → After many attempts, shows "too many requests"

**Post-Signup Verification:**
- [ ] User record created in database
- [ ] Default PARENT and TEACHER roles created
- [ ] Default person (account owner) created
- [ ] "Daily Routine" auto-created for account owner

---

### 1.2 Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login form displays |
| 2 | Enter email | Field accepts input |
| 3 | Enter password | Field masks input |
| 4 | Click "Log In" | Success → Redirect to dashboard |

**Edge Cases:**
- [ ] Invalid credentials → Shows "Invalid credentials"
- [ ] Account locked (5+ failed attempts) → Shows "Account temporarily locked"
- [ ] Banned user → Shows "Account suspended"
- [ ] 2FA enabled → Redirects to 2FA verification page

---

### 1.3 Two-Factor Authentication Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login with 2FA-enabled account | Redirects to 2FA page |
| 2 | Open authenticator app | 6-digit code displayed |
| 3 | Enter TOTP code | Field accepts 6 digits |
| 4 | Click "Verify" | Success → Dashboard |

**Edge Cases:**
- [ ] Expired code → Shows error, request new code
- [ ] Invalid code → Shows "Invalid verification code"
- [ ] Backup code used → Code consumed, one less available
- [ ] All backup codes used → Must contact support

---

### 1.4 Email Verification

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | After signup, check email | Verification code received |
| 2 | Enter 6-digit code on `/verify` | Field validates |
| 3 | Click "Verify" | Success → Email marked verified |

**Edge Cases:**
- [ ] Expired code → Shows error
- [ ] Resend code → Cooldown period applies
- [ ] Max resend attempts → Rate limited

---

### 1.5 Password Reset

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/reset-password` | Form displays |
| 2 | Enter email | Field accepts |
| 3 | Click "Send Reset Link" | Success message (always, for security) |
| 4 | Check email | Reset link received |
| 5 | Click link → `/reset-password/confirm` | New password form |
| 6 | Enter new password | Field validates |
| 7 | Click "Reset Password" | Success → Login page |

**Edge Cases:**
- [ ] Non-existent email → Still shows success (no enumeration)
- [ ] Expired link → Shows error
- [ ] Weak new password → Validation error

---

### 1.6 Logout

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click logout button or go to `/logout` | Session cleared |
| 2 | Automatic redirect | Returns to `/login` |

**Verification:**
- [ ] Session cookie cleared
- [ ] Session cache invalidated
- [ ] Cannot access protected routes

---

## 2. Role Management

### 2.1 Role Selection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/role-selection` | Available roles displayed |
| 2 | Click on a role | Role selected, redirect to dashboard |

**Available Roles:**
- [ ] PARENT - Always available
- [ ] TEACHER - Always available
- [ ] PRINCIPAL - Available if school member

---

### 2.2 Role Switching

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On any dashboard, find role switcher | Current role shown |
| 2 | Click switcher | Role options appear |
| 3 | Select different role | Dashboard changes to new role view |

**Verification:**
- [ ] Last used role persisted to localStorage
- [ ] Correct dashboard loads for each role

---

## 3. Person/Child Management

### 3.1 View Persons List

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/parent` | Person list displays |
| 2 | View person cards | Shows name, avatar, routine count |

**Verification:**
- [ ] Account owner always appears first
- [ ] Co-parent shared children appear with indicator
- [ ] Connected students appear with indicator
- [ ] Sorted by creation date

---

### 3.2 Create Person

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Child" button | Creation modal opens |
| 2 | Enter name | Field validates |
| 3 | Select avatar/color (optional) | Selection saved |
| 4 | Click "Create" | Person created, appears in list |

**Post-Creation Verification:**
- [ ] "☀️ Daily Routine" auto-created
- [ ] Person status is ACTIVE
- [ ] Cache invalidated, list updates

**Edge Cases:**
- [ ] Tier limit reached → Shows upgrade prompt
- [ ] Duplicate inactive name → Suggests restore
- [ ] Teacher role → Teacher-only routine also created

---

### 3.3 Edit Person

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on person card | Person detail page |
| 2 | Click "Edit" button | Edit modal opens |
| 3 | Change name/avatar/color | Fields update |
| 4 | Click "Save" | Changes saved |

**Verification:**
- [ ] Changes reflected immediately
- [ ] Cache invalidated

---

### 3.4 Delete Person

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On person detail, click "Delete" | Confirmation modal |
| 2 | Confirm deletion | Person soft-deleted |

**Verification:**
- [ ] Status set to INACTIVE
- [ ] Person hidden from list (unless showing inactive)
- [ ] Cannot delete account owner → Error shown

---

### 3.5 Restore Person

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Toggle "Show Inactive" filter | Inactive persons appear |
| 2 | Find archived person | Shows restore button |
| 3 | Click "Restore" | Person reactivated |

---

## 4. Routine Management

### 4.1 View Routines

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to person detail | Routines list displays |
| 2 | View routine cards | Shows name, color, task count |

**Verification:**
- [ ] Only active routines shown by default
- [ ] Teacher-only routines hidden from non-teachers
- [ ] Protected routines marked with icon

---

### 4.2 Create Routine

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Routine" | Creation modal opens |
| 2 | Enter name | Required field |
| 3 | Select reset period (Daily/Weekly/Monthly) | Options available |
| 4 | Select color | Color picker works |
| 5 | Select persons to assign | Multi-select works |
| 6 | Click "Create" | Routine created |

**Post-Creation Verification:**
- [ ] Routine appears in list
- [ ] Assigned to selected persons
- [ ] Cache invalidated

**Edge Cases:**
- [ ] Tier limit (routines per person) → Error shown
- [ ] No persons selected → Validation error

---

### 4.3 Edit Routine

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click routine card | Routine detail page |
| 2 | Click "Edit" | Edit modal opens |
| 3 | Modify fields | Changes allowed |
| 4 | Click "Save" | Updates saved |

**Edge Cases:**
- [ ] Protected routine → Only color/description editable
- [ ] Attempt to rename protected → Error shown

---

### 4.4 Delete Routine

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On routine detail, click "Delete" | Confirmation modal |
| 2 | Confirm | Routine archived |

**Edge Cases:**
- [ ] Protected routine → Cannot delete, error shown

---

### 4.5 Copy Routine

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On routine detail, click "Copy" | Copy modal opens |
| 2 | Select target persons | Multi-select |
| 3 | Handle conflicts (if any) | Rename/Merge options |
| 4 | Click "Copy" | Routine copied to each person |

**Verification:**
- [ ] All tasks copied
- [ ] Merge into Daily Routine if name matches
- [ ] New routine if renamed

---

### 4.6 Visibility Override

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On routine with visibility rules | Override section visible |
| 2 | Click "Override" | Duration selector appears |
| 3 | Select duration | Override created |
| 4 | Wait for expiration | Override auto-removes |

---

## 5. Task Management

### 5.1 View Tasks

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to routine detail | Task list displays |
| 2 | View task cards | Shows name, type, completion status |

---

### 5.2 Create Task

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Task" | Creation modal opens |
| 2 | Enter name | Required field |
| 3 | Select type | SIMPLE / MULTIPLE_CHECKIN / PROGRESS |
| 4 | For PROGRESS: Enter unit | "pages", "minutes", etc. |
| 5 | Click "Create" | Task created |

**Task Types:**
- **SIMPLE**: Single checkbox, max 9 check-ins/period
- **MULTIPLE_CHECKIN**: Multiple checks, max 9/period
- **PROGRESS**: Numeric value, max 20 entries/period

**Edge Cases:**
- [ ] Tier limit reached → Error
- [ ] PROGRESS without unit → Validation error

---

### 5.3 Edit Task

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click task | Task detail |
| 2 | Click "Edit" | Edit modal |
| 3 | Modify fields | Changes allowed |
| 4 | Click "Save" | Updates saved |

---

### 5.4 Reorder Tasks

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On task list, drag task | Task moves |
| 2 | Drop in new position | Order saved |

---

### 5.5 Delete Task

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Delete" on task | Confirmation |
| 2 | Confirm | Task archived |

---

## 6. Task Completions

### 6.1 Complete Simple Task

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to routine with tasks | Task list shows |
| 2 | Click checkbox on SIMPLE task | Task marked complete |
| 3 | Confetti animation plays | Visual feedback |

**Verification:**
- [ ] Completion recorded with timestamp
- [ ] Entry number calculated correctly
- [ ] Real-time sync to other devices

---

### 6.2 Complete Progress Task

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on PROGRESS task | Input modal opens |
| 2 | Enter value (e.g., "30") | Field validates |
| 3 | Click "Complete" | Value recorded |

**Verification:**
- [ ] Summed value calculated
- [ ] Shows running total for period

---

### 6.3 Undo Completion

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Find recent completion | Undo button visible |
| 2 | Click "Undo" | Completion removed |

**Edge Cases:**
- [ ] Undo window expired → Button hidden or error

---

### 6.4 Real-Time Sync Test

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app on Device A (parent dashboard) | Dashboard shows |
| 2 | Open kiosk on Device B | Kiosk shows same child |
| 3 | Complete task on Device B | Task marked complete |
| 4 | Check Device A | Dashboard updates automatically |

**Verification:**
- [ ] No page refresh needed
- [ ] Updates within 1-2 seconds
- [ ] Works bidirectionally

---

## 7. Goals System

### 7.1 Create Goal

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Goals page | Goal list shows |
| 2 | Click "Create Goal" | Modal opens |
| 3 | Enter name | Required |
| 4 | Select type | ROUTINE_COMPLETION / TASK_CHECKIN / TASK_PROGRESS |
| 5 | Link tasks/routines | Multi-select |
| 6 | Set conditions | Configure thresholds |
| 7 | Assign to persons | Multi-select |
| 8 | Click "Create" | Goal created |

---

### 7.2 Track Goal Progress

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View goal card | Progress bar shows |
| 2 | Complete linked tasks | Progress updates |
| 3 | Reach goal threshold | Goal marked achieved |

---

### 7.3 Archive Goal

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Archive" on goal | Confirmation |
| 2 | Confirm | Goal archived |

---

## 8. Kiosk Mode

### 8.1 Generate Kiosk Code

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On parent dashboard, click "Kiosk" | Code generation page |
| 2 | Select person/group | Options shown |
| 3 | Set expiration (optional) | Time selector |
| 4 | Click "Generate Code" | 2-3 word code displayed |

**Verification:**
- [ ] Code format: "word-word" or "word-word-word"
- [ ] Code is unique and valid

---

### 8.2 Enter Kiosk Code

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/kiosk` | Code entry form |
| 2 | Enter code | Field validates format |
| 3 | Click "Start" | Redirects to kiosk session |

**Edge Cases:**
- [ ] Invalid code → Error message
- [ ] Expired code → Error message
- [ ] Rate limiting → "Too many attempts"

---

### 8.3 Kiosk Person Selection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | After valid code entry | Person selection screen |
| 2 | Click on person avatar | Person selected |
| 3 | (If PIN enabled) Enter PIN | PIN validates |
| 4 | Proceed | Task view loads |

---

### 8.4 Kiosk Task Completion

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View routines | Routine cards shown |
| 2 | Select routine | Tasks display |
| 3 | Complete task | Confetti animation |
| 4 | View streak | Streak counter updates |

**Verification:**
- [ ] Teacher-only routines NOT shown
- [ ] Completions sync to parent dashboard
- [ ] Inactivity timeout warning appears
- [ ] Auto-logout after timeout

---

### 8.5 Kiosk Session Management

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On parent dashboard, view active sessions | Session list |
| 2 | Click "Terminate" | Session ended |
| 3 | Kiosk device shows logout | Session expired message |

---

## 9. Co-Parent Features

### 9.1 Invite Co-Parent

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/parent/connections` | Connections page |
| 2 | Click "Invite Co-Parent" | Modal opens |
| 3 | Enter co-parent email | Field validates |
| 4 | Select children to share | Multi-select |
| 5 | Select routines per child | Routine picker |
| 6 | Select permission level | READ_ONLY / TASK_COMPLETION / FULL_EDIT |
| 7 | Click "Send Invitation" | Invitation sent |

**Verification:**
- [ ] Email sent to co-parent
- [ ] Pending invitation shows in list
- [ ] Invitation expires after 7 days

---

### 9.2 Accept Co-Parent Invitation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Co-parent receives email | Link to accept |
| 2 | Click link → `/invitations/accept` | Invitation details shown |
| 3 | Review shared children | List displays |
| 4 | (Optional) Link own children | Matching available |
| 5 | Click "Accept" | Connection established |

**Verification:**
- [ ] Both parents see shared children
- [ ] Permissions applied correctly
- [ ] Real-time sync works between co-parents

---

### 9.3 Manage Co-Parent

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View co-parent in connections | Details shown |
| 2 | Click "Edit" | Options appear |
| 3 | Modify shared children/permissions | Changes apply |

---

### 9.4 Revoke Co-Parent Access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Remove" on co-parent | Confirmation |
| 2 | Confirm | Access revoked |

**Verification:**
- [ ] Co-parent loses access immediately
- [ ] Shared children removed from their view

---

## 10. Teacher Features

### 10.1 View Classrooms

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/teacher` | Classroom list displays |
| 2 | View classroom cards | Shows name, student count |

---

### 10.2 Create Classroom (Group)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Classroom" | Modal opens |
| 2 | Enter name | Required |
| 3 | Click "Create" | Classroom created |

---

### 10.3 Add Students

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open classroom | Student list |
| 2 | Click "Add Student" | Modal opens |
| 3 | Enter student name | Required |
| 4 | Click "Add" | Student added |

**Verification:**
- [ ] Teacher-only routine auto-created
- [ ] Tier limit checked (students_per_classroom)

---

### 10.4 View Student Routines

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on student | Student detail page |
| 2 | View routines | Routine list shows |
| 3 | View tasks | Task list with completion status |

---

### 10.5 Generate Parent Connection Code

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On student detail, click "Connect Parent" | Code generated |
| 2 | Share code with parent | 4-word code format |

---

### 10.6 Bulk Task Completion

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select multiple students | Multi-select mode |
| 2 | Select task to complete | Task picker |
| 3 | Click "Complete for All" | Completions created |

---

## 11. Principal/School Features

### 11.1 Create School

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/principal/create-school` | Form displays |
| 2 | Enter school name | Required |
| 3 | Enter address (optional) | Field accepts |
| 4 | Click "Create" | School created |

**Verification:**
- [ ] User becomes school admin
- [ ] School appears in school list

---

### 11.2 Invite Teachers

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to school dashboard | Teacher section |
| 2 | Click "Invite Teacher" | Modal opens |
| 3 | Enter teacher email | Required |
| 4 | Click "Send" | Invitation sent |

---

### 11.3 View School Teachers

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open school dashboard | Teacher list |
| 2 | View teacher details | Shows classrooms, students |

---

## 12. Marketplace/Community

### 12.1 Browse Routines

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/marketplace` | Routine grid displays |
| 2 | Filter by category | Results filter |
| 3 | Search by name | Results update |

---

### 12.2 View Routine Details

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click routine card | Detail page opens |
| 2 | View tasks | Task list shows |
| 3 | View ratings | Rating distribution visible |

---

### 12.3 Fork (Import) Routine

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Fork" button | Modal opens |
| 2 | Select target person | Person picker |
| 3 | Click "Import" | Routine copied to account |

**Verification:**
- [ ] All tasks copied
- [ ] Assigned to selected person
- [ ] Original author credited

---

### 12.4 Publish Routine

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On routine detail, click "Publish" | Modal opens |
| 2 | Enter description | Required |
| 3 | Select category | Required |
| 4 | Add tags | Optional |
| 5 | Click "Publish" | Routine public |

**Verification:**
- [ ] Appears in marketplace
- [ ] Author credited
- [ ] Can be forked by others

---

### 12.5 Rate Routine

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On marketplace item, click stars | Rating modal |
| 2 | Select 1-5 stars | Star rating saved |
| 3 | Enter review (optional) | Text saved |
| 4 | Submit | Rating visible |

---

## 13. Settings

### 13.1 Account Settings

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/settings/account` | Account info displays |
| 2 | Edit name | Field updates |
| 3 | Click "Save" | Changes saved |

---

### 13.2 Setup Two-Factor Authentication

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/settings/security` | Security page |
| 2 | Click "Enable 2FA" | Setup modal opens |
| 3 | Scan QR code with authenticator | Code appears in app |
| 4 | Enter verification code | 6 digits |
| 5 | Click "Verify" | 2FA enabled |
| 6 | Save backup codes | 10 codes displayed |

**Verification:**
- [ ] Next login requires 2FA
- [ ] Backup codes work
- [ ] Can disable 2FA

---

### 13.3 Billing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/billing` | Tier info displays |
| 2 | View current plan | Limits shown |
| 3 | Click "Upgrade" | Billing portal opens |

---

## 14. Admin Features

### 14.1 Admin Dashboard

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin` (as admin) | Dashboard displays |
| 2 | View system stats | Metrics shown |

**Note:** Only users with `isAdmin=true` can access.

---

### 14.2 User Management

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/users` | User list |
| 2 | Search users | Results filter |
| 3 | Ban user | User status changes |

---

### 14.3 Cache Management

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View cache stats (API: `adminSettings.getCacheStats`) | Stats display |
| 2 | Clear cache (API: `adminSettings.clearCache`) | Cache cleared |

---

## 15. Real-Time Sync

### 15.1 Dashboard Real-Time

**Test Scenario:**
1. Open parent dashboard on Device A
2. Complete task via kiosk on Device B
3. Device A should update without refresh

**Verification Points:**
- [ ] Task completion appears on dashboard
- [ ] Progress bars update
- [ ] Streak counters update
- [ ] No page refresh needed

---

### 15.2 Kiosk Real-Time

**Test Scenario:**
1. Open kiosk session
2. Complete task on parent's phone
3. Kiosk should reflect completion

**Verification Points:**
- [ ] Task marked complete on kiosk
- [ ] Streak updates
- [ ] Confetti plays (if applicable)

---

### 15.3 Co-Parent Sync

**Test Scenario:**
1. Parent A completes task for shared child
2. Parent B's dashboard should update

**Verification Points:**
- [ ] Completion visible to both parents
- [ ] Real-time (no refresh needed)
- [ ] Permissions respected

---

## 16. Caching Behavior

### 16.1 Session Cache

**Expected Behavior:**
- Session data cached for 5 minutes
- Logout invalidates cache
- Login invalidates stale cache

**Test:**
1. Login and navigate pages
2. Check that repeated navigation doesn't re-fetch session
3. Logout and login → Fresh session fetched

---

### 16.2 Completions Never Cached

**Critical Test:**
- Task completions must NEVER be cached
- Real-time sync depends on fresh data

**Test:**
1. Complete task on Device A
2. Immediately check Device B
3. Completion must appear (not stale)

---

### 16.3 Cache Invalidation

**Test Scenarios:**

| Action | Cache Invalidated |
|--------|-------------------|
| Create person | Person list cache |
| Update routine | Routine structure cache |
| Delete task | Task structure cache |
| Complete task | NO cache (never cached) |

---

## Testing Checklist Template

For each feature, verify:

- [ ] **Happy Path** - Normal flow works
- [ ] **Validation** - Invalid inputs rejected
- [ ] **Authorization** - Access control enforced
- [ ] **Real-time** - Updates sync (if applicable)
- [ ] **Tier Limits** - Limits enforced (if applicable)
- [ ] **Error Handling** - Errors displayed properly
- [ ] **Mobile** - Responsive on mobile devices
- [ ] **Offline** - Graceful handling when offline

---

## Priority Matrix

### Critical (Must Test Every Release)
- Authentication (signup, login, logout)
- Task completions
- Kiosk mode
- Real-time sync
- Co-parent sharing

### High Priority
- Person/Routine/Task CRUD
- Goals system
- Teacher features
- 2FA setup

### Medium Priority
- Marketplace
- Settings
- Principal features

### Low Priority
- Admin features
- Analytics
- Edge cases

---

*Last updated: 2024-12-02*
