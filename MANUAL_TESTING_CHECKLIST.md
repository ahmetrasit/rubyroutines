# Ruby Routines - Manual Testing Checklist

**Version:** 1.0
**Last Updated:** 2025-11-13
**Status:** Ready for Testing

---

## 🎯 **Testing Objectives**

This comprehensive manual testing checklist ensures all features work correctly after the security hardening and code quality improvements. Test systematically in the order presented to verify both individual features and integration points.

---

## 🔧 **Pre-Testing Setup**

### Environment Configuration
- [ ] Set up `.env` file with all required variables
  - [ ] `DATABASE_URL` configured
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
  - [ ] `STRIPE_SECRET_KEY` configured (test mode)
  - [ ] `STRIPE_WEBHOOK_SECRET` configured
  - [ ] `RESEND_API_KEY` configured (or mock for testing)
  - [ ] `NEXT_PUBLIC_APP_URL` set correctly

### Database Setup
- [ ] Run `npm run db:generate` to regenerate Prisma client
- [ ] Run `npm run db:push` to apply schema changes
- [ ] Verify database connection works
- [ ] Check that all tables exist in Supabase

### Application Startup
- [ ] Run `npm install` to ensure all dependencies installed
- [ ] Run `npm run dev` to start development server
- [ ] Verify server starts without errors
- [ ] Access http://localhost:3000 successfully

---

## 1️⃣ **Authentication & Authorization**

### User Registration
- [ ] Navigate to signup page
- [ ] Enter email and password (min 8 characters)
- [ ] Submit registration form
- [ ] **Expected:** User account created, redirected to verify email page
- [ ] Check database: User record exists with `emailVerified: false`
- [ ] Check database: Default PARENT role created
- [ ] Check database: "Me" person created automatically

### Email Verification
- [ ] Check server logs for verification code (development mode)
- [ ] Enter correct 6-digit verification code
- [ ] **Expected:** Email verified, redirected to dashboard
- [ ] Try entering wrong code
- [ ] **Expected:** Error message shown
- [ ] Request resend verification code
- [ ] **Expected:** New code generated (with rate limit check)
- [ ] Check database: `emailVerified` set to `true`

### User Login
- [ ] Navigate to login page
- [ ] Enter valid email and password
- [ ] **Expected:** Successfully logged in, redirected to dashboard
- [ ] Try invalid password
- [ ] **Expected:** Authentication error shown
- [ ] Try non-existent email
- [ ] **Expected:** Authentication error shown
- [ ] Verify session persists across page refreshes

### Authorization Testing (CRITICAL)
- [ ] Create second test account in different browser/incognito
- [ ] Get roleId from first account (check database or network tab)
- [ ] Try to access data from second account using first account's roleId
- [ ] **Expected:** All requests return FORBIDDEN error
- [ ] Test person.list with wrong roleId
- [ ] Test routine.list with wrong roleId
- [ ] Test task operations with wrong taskId
- [ ] **Expected:** All unauthorized access blocked

---

## 2️⃣ **Person Management**

### Create Person (Child/Student)
- [ ] Navigate to dashboard
- [ ] Click "Add Person" or equivalent button
- [ ] Fill in person details:
  - [ ] Name (required)
  - [ ] Select emoji avatar
  - [ ] Select color
- [ ] Submit form
- [ ] **Expected:** Person created successfully, toast notification shown
- [ ] Verify person appears in list
- [ ] Check database: Person record created with correct roleId
- [ ] Verify "Daily Routine" automatically created for person

### Tier Limit Testing
- [ ] Create persons up to FREE tier limit (3 persons)
- [ ] Try to create 4th person
- [ ] **Expected:** Error about tier limit exceeded
- [ ] Verify error message mentions upgrade option

### Update Person
- [ ] Click edit on existing person
- [ ] Change name
- [ ] Change avatar emoji/color
- [ ] Submit changes
- [ ] **Expected:** Person updated, changes reflected immediately
- [ ] Refresh page, verify changes persisted

### Delete Person (Soft Delete)
- [ ] Click delete on a person
- [ ] Confirm deletion
- [ ] **Expected:** Person marked as INACTIVE, removed from active list
- [ ] Check database: `status` changed to `INACTIVE`, not deleted
- [ ] Verify person's routines also marked INACTIVE

### Restore Person
- [ ] Navigate to inactive persons view (if available)
- [ ] Click restore on deleted person
- [ ] **Expected:** Person restored to ACTIVE status
- [ ] Verify person reappears in main list

---

## 3️⃣ **Group Management**

### Create Group (Family/Classroom)
- [ ] Navigate to groups section
- [ ] Click "Create Group"
- [ ] Enter group name (e.g., "Smith Family", "Grade 3A")
- [ ] Select members from person list
- [ ] Submit form
- [ ] **Expected:** Group created, members added
- [ ] Verify group appears in list

### Update Group Members
- [ ] Edit existing group
- [ ] Add new member
- [ ] Remove existing member
- [ ] Save changes
- [ ] **Expected:** Membership updated correctly

### Delete Group
- [ ] Delete a group
- [ ] **Expected:** Group marked INACTIVE
- [ ] Verify members still exist (not deleted with group)

---

## 4️⃣ **Routine Management**

### Create Routine
- [ ] Navigate to routines section
- [ ] Click "Create Routine"
- [ ] Fill in routine details:
  - [ ] Name (e.g., "Morning Routine")
  - [ ] Description
  - [ ] Type (DAILY/WEEKLY/MONTHLY/CUSTOM)
  - [ ] Reset period
  - [ ] Reset day (if WEEKLY)
- [ ] Assign to persons or groups
- [ ] Submit form
- [ ] **Expected:** Routine created successfully
- [ ] Check database: Assignments created for selected persons

### Visibility Rules
- [ ] Create routine with time-based visibility
  - [ ] Set start time and end time
  - [ ] **Expected:** Routine only visible during specified hours
- [ ] Create routine with day-based visibility
  - [ ] Select specific days (e.g., weekdays only)
  - [ ] **Expected:** Routine only visible on selected days
- [ ] Create routine with date range
  - [ ] Set start date and end date
  - [ ] **Expected:** Routine only visible within date range

### Temporary Visibility Override
- [ ] Select a routine
- [ ] Create visibility override
- [ ] Set override duration (e.g., 2 hours)
- [ ] **Expected:** Routine becomes visible regardless of rules
- [ ] Wait for override to expire or cancel manually
- [ ] **Expected:** Normal visibility rules resume

### Copy Routine
- [ ] Select existing routine
- [ ] Click "Copy to..."
- [ ] Select target persons
- [ ] **Expected:** Routine duplicated for selected persons
- [ ] Verify tasks also copied

### Update Routine
- [ ] Edit routine name and description
- [ ] Change reset period
- [ ] **Expected:** Changes saved and reflected
- [ ] Verify "Daily Routine" cannot be deleted (protected)

### Delete Routine
- [ ] Delete a routine (not Daily Routine)
- [ ] **Expected:** Routine marked INACTIVE
- [ ] Verify tasks also marked INACTIVE

---

## 5️⃣ **Task Management**

### Create Simple Task
- [ ] Open a routine
- [ ] Click "Add Task"
- [ ] Enter task name
- [ ] Select type: SIMPLE
- [ ] Set order/position
- [ ] Save task
- [ ] **Expected:** Task added to routine

### Create Multiple Check-in Task
- [ ] Create task with type: MULTIPLE_CHECKIN
- [ ] **Expected:** Can be completed multiple times per day
- [ ] Complete task 3 times
- [ ] **Expected:** 3 separate completions recorded

### Create Progress Task
- [ ] Create task with type: PROGRESS
- [ ] Set target value (e.g., 100)
- [ ] Set unit (e.g., "minutes", "pages")
- [ ] Complete task with progress value (e.g., 25)
- [ ] **Expected:** Progress tracked towards target

### Reorder Tasks
- [ ] Drag and drop tasks to reorder
- [ ] **Expected:** Order updated immediately and persisted

### Complete Task
- [ ] Click checkbox/complete button on task
- [ ] **Expected:** Task marked complete
- [ ] Check database: TaskCompletion record created
- [ ] Verify completion shows timestamp

### Undo Task Completion (5-Minute Window)
- [ ] Complete a task
- [ ] Within 5 minutes, click "Undo"
- [ ] **Expected:** Completion removed
- [ ] Wait more than 5 minutes after completing task
- [ ] **Expected:** Undo button no longer visible

### Update Task
- [ ] Edit task name and description
- [ ] Change task type (if allowed)
- [ ] **Expected:** Task updated successfully

### Delete Task
- [ ] Delete a task
- [ ] If task is linked to goal, check warning appears
- [ ] **Expected:** Task marked INACTIVE
- [ ] Check database: Related completions preserved

---

## 6️⃣ **Goals System**

### Create Goal
- [ ] Navigate to goals section
- [ ] Click "Create Goal"
- [ ] Fill in goal details:
  - [ ] Name (e.g., "Read 100 books this year")
  - [ ] Description
  - [ ] Target value (e.g., 100)
  - [ ] Period (DAILY/WEEKLY/MONTHLY/YEARLY)
- [ ] Assign to person or group
- [ ] Save goal
- [ ] **Expected:** Goal created successfully

### Link Task to Goal
- [ ] Open existing goal
- [ ] Click "Link Task"
- [ ] Select task from routine
- [ ] Save link
- [ ] **Expected:** Task linked, progress tracked
- [ ] Complete the linked task
- [ ] **Expected:** Goal progress updates automatically

### Link Routine to Goal
- [ ] Open existing goal
- [ ] Click "Link Routine"
- [ ] Select routine
- [ ] Save link
- [ ] **Expected:** Routine linked to goal
- [ ] Complete tasks in routine
- [ ] **Expected:** Goal progress reflects routine completion rate

### View Goal Progress
- [ ] Navigate to goals dashboard
- [ ] Verify progress bars show correct percentages
- [ ] Check calculation logic:
  - [ ] SIMPLE tasks: count completions
  - [ ] MULTIPLE_CHECKIN: sum all completions
  - [ ] PROGRESS: sum progress values
  - [ ] Routine links: calculate completion percentage
- [ ] **Expected:** Progress accurate for each goal type

### Unlink Task/Routine from Goal
- [ ] Remove task or routine link from goal
- [ ] **Expected:** Cannot remove if it's the last item
- [ ] **Expected:** Progress recalculates after removal

### Archive Goal
- [ ] Archive completed or abandoned goal
- [ ] **Expected:** Goal moved to archive
- [ ] **Expected:** Links preserved, progress frozen

---

## 7️⃣ **Smart Routines & Conditions**

### Upgrade Routine to Smart Routine
- [ ] Select a regular routine
- [ ] Click "Upgrade to Smart Routine"
- [ ] **Expected:** Routine upgraded, condition builder available

### Create Task Completion Condition
- [ ] Create condition: "Show Task B if Task A completed"
- [ ] Type: TASK_COMPLETED
- [ ] Select trigger task (Task A)
- [ ] Select target task (Task B) to show/hide
- [ ] Save condition
- [ ] **Expected:** Condition created

### Test Condition Logic
- [ ] Without completing Task A, check Task B visibility
- [ ] **Expected:** Task B hidden
- [ ] Complete Task A
- [ ] **Expected:** Task B becomes visible
- [ ] Undo Task A completion
- [ ] **Expected:** Task B hidden again

### Create NOT Condition
- [ ] Create condition with "NOT" logic
- [ ] **Expected:** Inverted behavior (show if NOT completed)

### Create AND Conditions
- [ ] Create multiple conditions for same task
- [ ] **Expected:** Task visible only when ALL conditions true

### Create Task Count Condition
- [ ] Create condition: "Show if 3+ tasks completed"
- [ ] Type: TASK_COUNT
- [ ] Set threshold: 3
- [ ] **Expected:** Target task appears after 3 completions

### Create Goal Progress Condition
- [ ] Create condition based on goal progress
- [ ] Type: GOAL_PROGRESS
- [ ] Set threshold (e.g., 50%)
- [ ] **Expected:** Task visibility changes when goal reaches threshold

### Circular Dependency Prevention
- [ ] Try to create circular condition (Task A → Task B → Task A)
- [ ] **Expected:** Error message, condition rejected

### Update/Delete Condition
- [ ] Edit existing condition
- [ ] **Expected:** Changes saved, evaluation updates
- [ ] Delete condition
- [ ] **Expected:** Task visibility returns to default

---

## 8️⃣ **Kiosk Mode**

### Generate Kiosk Code
- [ ] Navigate to kiosk settings
- [ ] Click "Generate Code"
- [ ] Select 2-word or 3-word code
- [ ] Set expiration (e.g., 24 hours)
- [ ] **Expected:** Code generated (e.g., "happy-dog-run")
- [ ] Copy code to clipboard

### View Active Codes
- [ ] Navigate to kiosk codes list
- [ ] **Expected:** All active codes shown with expiration times
- [ ] **Expected:** Can see which codes are in use

### Validate Kiosk Code (PUBLIC ENDPOINT)
- [ ] Open incognito/private browser
- [ ] Navigate to `/kiosk`
- [ ] Enter valid kiosk code
- [ ] **Expected:** Code validated, redirect to person selection
- [ ] **SECURITY CHECK:** Try entering invalid code
- [ ] **Expected:** Error message, no access granted

### Kiosk Session Security (CRITICAL)
- [ ] After validating code, open browser DevTools
- [ ] Check localStorage for `kiosk_session`
- [ ] Note the `codeId` stored
- [ ] Try to access `/kiosk/[code]/tasks` directly without selecting person
- [ ] **Expected:** Redirected back to person selection
- [ ] **SECURITY TEST:** Manually edit localStorage to change `codeId`
- [ ] Try to load tasks
- [ ] **Expected:** Request fails with FORBIDDEN error

### Person Selection in Kiosk
- [ ] Select person from list
- [ ] **Expected:** Redirected to task view for that person
- [ ] **Expected:** Only sees assigned routines and tasks

### Complete Task in Kiosk
- [ ] Click on task to complete
- [ ] **Expected:** Task marked complete with animation
- [ ] **Expected:** Confetti celebration shown
- [ ] **Expected:** Completion syncs to parent dashboard

### Undo in Kiosk
- [ ] Complete task, then immediately undo
- [ ] **Expected:** Undo works within 5-minute window
- [ ] **SECURITY CHECK:** Verify `kioskCodeId` passed in undo mutation

### Kiosk Session Timeout
- [ ] Wait for session timeout warning (2 minutes before expiry)
- [ ] **Expected:** Warning modal appears
- [ ] Extend session or wait for full timeout (3 minutes)
- [ ] **Expected:** Automatically logged out, redirected to code entry

### Revoke Kiosk Code
- [ ] From parent account, revoke active kiosk code
- [ ] **Expected:** Code marked as revoked in database
- [ ] Try to use revoked code
- [ ] **Expected:** Code rejected as invalid

### Kiosk Code Expiration
- [ ] Wait for code to expire (or manually set past expiration)
- [ ] Try to use expired code
- [ ] **Expected:** Code rejected as expired
- [ ] Check database: Status updated to EXPIRED

---

## 9️⃣ **Co-Parent Sharing**

### Send Co-Parent Invitation
- [ ] Navigate to connections/sharing page
- [ ] Click "Invite Co-Parent"
- [ ] Enter email address
- [ ] Select permission level:
  - [ ] READ_ONLY
  - [ ] TASK_COMPLETION
  - [ ] FULL_EDIT
- [ ] Select persons (children) to share
- [ ] Send invitation
- [ ] **Expected:** Invitation created in database
- [ ] **Expected:** Email sent (check logs in development)
- [ ] Check invitation has 7-day expiry

### Accept Co-Parent Invitation
- [ ] Log in as invitee (matching email)
- [ ] Click invitation link from email (or manually navigate with token)
- [ ] Review invitation details
- [ ] Click "Accept"
- [ ] **Expected:** CoParent relationship created
- [ ] **Expected:** Invitee's PARENT role created if doesn't exist
- [ ] **Expected:** Invitation status changed to ACCEPTED

### Email Verification Required (SECURITY)
- [ ] Try to accept invitation with unverified email
- [ ] **Expected:** Error requiring email verification
- [ ] Verify email, then accept invitation
- [ ] **Expected:** Acceptance successful

### Permission Testing - READ_ONLY
- [ ] Log in as co-parent with READ_ONLY permission
- [ ] Navigate to shared children
- [ ] **Expected:** Can view persons and tasks
- [ ] Try to complete a task
- [ ] **Expected:** Operation blocked, permission denied
- [ ] Try to edit routine
- [ ] **Expected:** Operation blocked

### Permission Testing - TASK_COMPLETION
- [ ] Log in as co-parent with TASK_COMPLETION permission
- [ ] View shared children
- [ ] Complete a task
- [ ] **Expected:** Task completion successful
- [ ] Try to edit task or routine
- [ ] **Expected:** Edit operations blocked

### Permission Testing - FULL_EDIT
- [ ] Log in as co-parent with FULL_EDIT permission
- [ ] View shared children
- [ ] Complete tasks, edit routines, create new tasks
- [ ] **Expected:** All operations allowed
- [ ] Try to delete primary parent's account
- [ ] **Expected:** Operation blocked

### Update Co-Parent Permissions
- [ ] As primary parent, edit co-parent permissions
- [ ] Change from READ_ONLY to TASK_COMPLETION
- [ ] Save changes
- [ ] **Expected:** Co-parent immediately gains new permissions
- [ ] Add/remove persons from co-parent access
- [ ] **Expected:** Co-parent can only see updated person list

### Revoke Co-Parent Access
- [ ] As primary parent, revoke co-parent access
- [ ] **Expected:** CoParent status changed to REVOKED
- [ ] Log in as co-parent
- [ ] **Expected:** No longer sees shared persons
- [ ] Try to access previously shared data
- [ ] **Expected:** Access denied

### Co-Parent Cannot Grant Permissions (SECURITY)
- [ ] As co-parent, try to invite another co-parent
- [ ] **Expected:** Operation blocked (privilege escalation prevention)

---

## 🔟 **Co-Teacher Sharing**

### Share Classroom with Co-Teacher
- [ ] Log in as teacher (primary)
- [ ] Navigate to classroom sharing
- [ ] Click "Share Classroom"
- [ ] Enter co-teacher email
- [ ] Select classroom/group
- [ ] Choose permission level:
  - [ ] VIEW
  - [ ] EDIT_TASKS
  - [ ] FULL_EDIT
- [ ] Send invitation
- [ ] **Expected:** Invitation sent, requires email verification

### Accept Co-Teacher Invitation
- [ ] Log in as invitee (teacher account)
- [ ] Accept invitation from email link
- [ ] **Expected:** CoTeacher relationship created
- [ ] **Expected:** Can now see shared classroom

### Permission Testing - VIEW
- [ ] Log in as co-teacher with VIEW permission
- [ ] View classroom and students
- [ ] **Expected:** Can see all students and routines
- [ ] Try to complete task or edit routine
- [ ] **Expected:** Operations blocked

### Permission Testing - EDIT_TASKS
- [ ] Log in as co-teacher with EDIT_TASKS permission
- [ ] Complete tasks for students
- [ ] Edit existing tasks
- [ ] Create new tasks
- [ ] **Expected:** Task operations allowed
- [ ] Try to delete students or routines
- [ ] **Expected:** Delete operations blocked

### Permission Testing - FULL_EDIT
- [ ] Log in as co-teacher with FULL_EDIT permission
- [ ] Full CRUD on students, routines, tasks
- [ ] **Expected:** All operations allowed

### Revoke Co-Teacher Access
- [ ] As primary teacher, revoke co-teacher access
- [ ] **Expected:** Co-teacher loses access to classroom
- [ ] Verify co-teacher cannot see students anymore

---

## 1️⃣1️⃣ **Student-Parent Connection**

### Generate 6-Digit Connection Code
- [ ] Log in as teacher
- [ ] Select a student
- [ ] Click "Generate Parent Connection Code"
- [ ] **Expected:** 6-digit numeric code displayed
- [ ] **Expected:** Code expires in 24 hours
- [ ] Copy code

### Parent Connects to Student
- [ ] Log in as parent
- [ ] Navigate to connections page
- [ ] Enter 6-digit code
- [ ] Select which of parent's persons represents this student
- [ ] Click "Connect"
- [ ] **Expected:** StudentParentConnection created
- [ ] **Expected:** Parent can now see student's tasks in their dashboard

### View Connected Student Tasks
- [ ] As parent, navigate to connected students section
- [ ] **Expected:** See student's name, teacher info, school
- [ ] **Expected:** See student's assigned routines and tasks
- [ ] Complete task for student
- [ ] **Expected:** Completion syncs, teacher can see it

### Connection Permissions
- [ ] Verify parent has TASK_COMPLETION permission by default
- [ ] Try to edit student's routines as parent
- [ ] **Expected:** Edit operations blocked (read + complete only)

### Disconnect Student-Parent Connection
- [ ] As parent or teacher, disconnect connection
- [ ] **Expected:** Status changed to DISCONNECTED
- [ ] Verify parent no longer sees student's tasks
- [ ] Verify teacher no longer sees parent connection

### Connection Code Security
- [ ] Generate code, wait for 24-hour expiration
- [ ] Try to use expired code
- [ ] **Expected:** Error message, code rejected
- [ ] Use valid code to connect
- [ ] Try to use same code again
- [ ] **Expected:** Code marked as USED, cannot reuse

---

## 1️⃣2️⃣ **Analytics Dashboard**

### Date Range Selection
- [ ] Navigate to analytics page
- [ ] Select preset range (Last 7 days, 30 days, 90 days)
- [ ] **Expected:** Charts update with selected range
- [ ] Select custom date range
- [ ] **Expected:** Charts show data for custom period

### Person Filter
- [ ] Select "All Persons" filter
- [ ] **Expected:** Aggregate data for all persons shown
- [ ] Select specific person
- [ ] **Expected:** Data filtered to show only that person's stats

### Completion Trend Chart
- [ ] View line chart showing completion rate over time
- [ ] **Expected:** X-axis shows dates, Y-axis shows percentage
- [ ] Hover over data points
- [ ] **Expected:** Tooltip shows exact completion count and rate
- [ ] Verify chart is responsive (resize browser)

### Goal Progress Chart
- [ ] View bar chart showing goal progress
- [ ] **Expected:** Each goal shown with progress bar
- [ ] **Expected:** Color coding: gray (not started), blue (in progress), green (achieved)
- [ ] Click on goal bar
- [ ] **Expected:** Navigate to goal details

### Task Heatmap
- [ ] View heatmap showing task completion frequency
- [ ] **Expected:** Days on X-axis, tasks on Y-axis
- [ ] **Expected:** Color intensity shows completion count
- [ ] Hover over cells
- [ ] **Expected:** Tooltip shows task name, date, count
- [ ] **Expected:** Legend shows color scale

### Export Analytics to CSV
- [ ] Click "Export CSV" button
- [ ] **Expected:** CSV file downloads with completion data
- [ ] Open CSV file
- [ ] **Expected:** Contains: Date, Completions, Total Tasks, Completion Rate
- [ ] Verify data matches chart display

### Authorization Testing (CRITICAL)
- [ ] Try to view analytics for another user's roleId
- [ ] **Expected:** Access denied, FORBIDDEN error

---

## 1️⃣3️⃣ **Marketplace**

### Browse Marketplace
- [ ] Navigate to marketplace
- [ ] **Expected:** See grid of published routines and goals
- [ ] **Expected:** Each item shows: name, author, rating, fork count
- [ ] **Expected:** Category and age group tags visible

### Search Marketplace
- [ ] Enter search term (e.g., "morning")
- [ ] **Expected:** Results filtered by keyword
- [ ] **Expected:** Search debounced (doesn't search on every keystroke)
- [ ] Clear search
- [ ] **Expected:** All items shown again

### Filter Marketplace
- [ ] Select category filter
- [ ] **Expected:** Items filtered by category
- [ ] Select age group filter
- [ ] **Expected:** Items filtered by age group
- [ ] Select multiple filters
- [ ] **Expected:** AND logic applied (items match all filters)
- [ ] Clear filters
- [ ] **Expected:** All items shown

### Sort Marketplace
- [ ] Sort by rating
- [ ] **Expected:** Highest rated items first
- [ ] Sort by popularity (fork count)
- [ ] **Expected:** Most forked items first
- [ ] Sort by date
- [ ] **Expected:** Newest items first

### Publish Routine to Marketplace
- [ ] Navigate to "Publish" section
- [ ] Select routine to publish
- [ ] Choose visibility (PUBLIC/UNLISTED/PRIVATE)
- [ ] Select category, age group
- [ ] Add tags (up to 10)
- [ ] Click "Publish"
- [ ] **Expected:** MarketplaceItem created with version 1.0.0
- [ ] **Expected:** Item appears in marketplace (if PUBLIC)
- [ ] **SECURITY:** Email verification required

### Publish Goal to Marketplace
- [ ] Publish a goal instead of routine
- [ ] **Expected:** Goal published with all linked tasks/routines
- [ ] **Expected:** Content serialized correctly

### View Marketplace Item Details
- [ ] Click on marketplace item
- [ ] **Expected:** Full details page shown
- [ ] **Expected:** See complete description, author, version
- [ ] **Expected:** See all tags and metadata
- [ ] Scroll to comments section
- [ ] **Expected:** Comments and ratings visible

### Fork Marketplace Item
- [ ] Click "Fork to My Account"
- [ ] **Expected:** Confirmation dialog shown
- [ ] Confirm fork
- [ ] **Expected:** Copy created in user's account
- [ ] **Expected:** Name includes "(Forked)"
- [ ] **Expected:** sourceMarketplaceItemId set
- [ ] **Expected:** Fork count incremented on original item
- [ ] Edit forked item
- [ ] **Expected:** Original item unaffected (independence confirmed)

### Rate Marketplace Item
- [ ] Click on stars to rate (1-5)
- [ ] **Expected:** Rating saved
- [ ] **Expected:** Average rating recalculated
- [ ] Try to rate again
- [ ] **Expected:** Previous rating updated, not duplicated

### Comment on Marketplace Item
- [ ] Enter comment (max 500 characters)
- [ ] Submit comment
- [ ] **Expected:** Comment appears immediately
- [ ] Try comment over 500 characters
- [ ] **Expected:** Validation error

### Flag Inappropriate Comment
- [ ] Click flag icon on comment
- [ ] Enter reason for flagging
- [ ] Submit flag
- [ ] **Expected:** CommentFlag record created
- [ ] Create 2 more flags on same comment (total 3)
- [ ] **Expected:** Comment automatically hidden after 3 flags
- [ ] **Expected:** Comment status changed to FLAGGED

### Update Published Item (Versioning)
- [ ] Edit original routine/goal
- [ ] Make changes
- [ ] Republish to marketplace
- [ ] **Expected:** Version incremented (1.0.0 → 1.0.1)
- [ ] **Expected:** Forked copies unaffected

### Authorization Testing (CRITICAL)
- [ ] Try to publish using another user's authorRoleId
- [ ] **Expected:** Access denied
- [ ] Try to update another user's marketplace item
- [ ] **Expected:** Access denied

---

## 1️⃣4️⃣ **Billing & Stripe Integration**

### View Pricing Page
- [ ] Navigate to `/pricing`
- [ ] **Expected:** See all 4 tiers with pricing
  - [ ] FREE: $0
  - [ ] BASIC: $5/month
  - [ ] PREMIUM: $10/month
  - [ ] SCHOOL: $25/month
- [ ] **Expected:** Feature comparison table visible
- [ ] **Expected:** Current tier highlighted (if logged in)

### Create Checkout Session
- [ ] Click "Upgrade to BASIC"
- [ ] **SECURITY:** Email verification required
- [ ] **Expected:** Redirected to Stripe checkout page
- [ ] **Expected:** Correct amount shown ($5.00)
- [ ] **Expected:** Monthly subscription displayed
- [ ] Use Stripe test card: 4242 4242 4242 4242
- [ ] Complete payment
- [ ] **Expected:** Redirected back to app with success message

### Stripe Webhook Processing
- [ ] After checkout completion, check database
- [ ] **Expected:** Role tier updated to BASIC
- [ ] **Expected:** stripeCustomerId stored
- [ ] **Expected:** stripeSubscriptionId stored
- [ ] Check server logs for webhook events
- [ ] **Expected:** checkout.session.completed processed

### Tier Enforcement After Upgrade
- [ ] Create persons up to new tier limit (BASIC = 10)
- [ ] **Expected:** Can create up to limit
- [ ] Try to exceed new limit
- [ ] **Expected:** Tier limit error (for new tier)

### View Subscription Status
- [ ] Navigate to billing dashboard
- [ ] **Expected:** See current tier badge
- [ ] **Expected:** See subscription status (ACTIVE)
- [ ] **Expected:** See billing cycle date

### Billing Portal
- [ ] Click "Manage Subscription"
- [ ] **Expected:** Redirected to Stripe billing portal
- [ ] **Expected:** Can update payment method
- [ ] **Expected:** Can view invoices
- [ ] **Expected:** Can cancel subscription

### Subscription Cancellation
- [ ] In Stripe billing portal, cancel subscription
- [ ] **Expected:** Webhook received (customer.subscription.deleted)
- [ ] Check database
- [ ] **Expected:** Tier downgraded to FREE
- [ ] **Expected:** subscriptionStatus set to CANCELLED
- [ ] Try to create more persons than FREE tier allows
- [ ] **Expected:** Tier limit enforced for FREE tier

### Payment Failure Simulation
- [ ] Trigger payment failure (Stripe test cards available)
- [ ] **Expected:** Webhook received (invoice.payment_failed)
- [ ] Check logs for error handling
- [ ] **Expected:** User notified of payment issue

### Authorization Testing (CRITICAL)
- [ ] Try to create checkout for another user's roleId
- [ ] **Expected:** Access denied, FORBIDDEN error
- [ ] Try to access billing portal for another user
- [ ] **Expected:** Access denied

---

## 1️⃣5️⃣ **Security Testing**

### Authorization Boundary Testing
- [ ] Create two test accounts (User A, User B)
- [ ] Log in as User A, note roleId
- [ ] Log in as User B
- [ ] Use browser DevTools to capture API requests
- [ ] Modify request to use User A's roleId
- [ ] Send request
- [ ] **Expected:** All requests return FORBIDDEN (403)

### SQL Injection Testing
- [ ] Try SQL injection in search fields
  - [ ] `' OR '1'='1`
  - [ ] `'; DROP TABLE users; --`
- [ ] **Expected:** All inputs properly escaped by Prisma
- [ ] **Expected:** No SQL errors, no data leakage

### XSS Testing
- [ ] Enter JavaScript in text fields
  - [ ] `<script>alert('XSS')</script>`
  - [ ] `<img src=x onerror=alert('XSS')>`
- [ ] Submit and view content
- [ ] **Expected:** Scripts not executed
- [ ] **Expected:** React escapes content automatically

### Rate Limiting Testing
- [ ] Make rapid repeated requests to auth endpoints
- [ ] **Expected:** Rate limiting applied (if implemented)
- [ ] **Expected:** 429 Too Many Requests after threshold
- [ ] Wait for rate limit window to reset
- [ ] **Expected:** Requests allowed again

### Session Security
- [ ] Log in, capture session token
- [ ] Log out
- [ ] Try to use old session token
- [ ] **Expected:** Token invalidated, unauthorized error
- [ ] Check session expiration
- [ ] **Expected:** Sessions expire after configured time

### CSRF Protection
- [ ] Verify Next.js/tRPC CSRF protection active
- [ ] Try cross-origin request without proper headers
- [ ] **Expected:** Request blocked

### Sensitive Data in URLs
- [ ] Check all URLs for sensitive data
- [ ] **Expected:** No passwords, tokens, or PII in URLs
- [ ] **Expected:** IDs are opaque (CUIDs), not sequential

### Email Verification Enforcement
- [ ] Create account, don't verify email
- [ ] Try to:
  - [ ] Create checkout session
  - [ ] Publish to marketplace
  - [ ] Send invitations
- [ ] **Expected:** All sensitive operations blocked
- [ ] **Expected:** Clear error message to verify email

---

## 1️⃣6️⃣ **Integration Testing**

### Complete User Journey - Parent
1. [ ] Sign up as new parent
2. [ ] Verify email
3. [ ] Create child (person)
4. [ ] Create "Morning Routine" for child
5. [ ] Add 5 tasks to routine
6. [ ] Create goal "Complete all morning tasks this week"
7. [ ] Link routine to goal
8. [ ] Generate kiosk code
9. [ ] (In incognito) Enter kiosk mode with code
10. [ ] Select child, complete all tasks
11. [ ] (Back to parent) View goal progress
12. [ ] Check analytics dashboard
13. [ ] Invite co-parent
14. [ ] **Expected:** Entire flow works seamlessly

### Complete User Journey - Teacher
1. [ ] Sign up as teacher
2. [ ] Create classroom group
3. [ ] Create 5 students (persons)
4. [ ] Create "Daily Class Routine"
5. [ ] Assign routine to all students
6. [ ] Generate connection code for one student
7. [ ] (As parent) Connect to student using code
8. [ ] (As teacher) Complete task for student
9. [ ] (As parent) See task completion
10. [ ] Share classroom with co-teacher
11. [ ] **Expected:** Entire flow works seamlessly

### Cross-Role Testing
- [ ] Create account with both PARENT and TEACHER roles
- [ ] Switch between modes using mode switcher
- [ ] **Expected:** Can access both dashboards
- [ ] **Expected:** Data properly segregated by role
- [ ] Create person as parent, create person as teacher
- [ ] **Expected:** Persons belong to correct roles

---

## 📋 **Testing Sign-Off**

### Critical Features (Must Pass)
- [ ] Authentication works correctly
- [ ] Authorization prevents unauthorized access
- [ ] Person CRUD operations function
- [ ] Routine CRUD operations function
- [ ] Task completion and undo work
- [ ] Goals calculate progress correctly
- [ ] Kiosk mode is secure and functional
- [ ] Co-parent permissions enforced
- [ ] Analytics display correct data
- [ ] Marketplace publishing and forking work
- [ ] Stripe integration processes payments

### Security Requirements (Must Pass)
- [ ] No horizontal privilege escalation possible
- [ ] Email verification enforced for sensitive operations
- [ ] Kiosk session validation prevents unauthorized access
- [ ] Verification codes properly hashed
- [ ] No sensitive data in logs or URLs
- [ ] All authorization checks functioning

### Performance Checks
- [ ] Page load times acceptable (<3 seconds)
- [ ] Database queries optimized (no N+1)
- [ ] Charts render smoothly with D3.js
- [ ] No memory leaks in kiosk mode

### User Experience
- [ ] All forms validate inputs properly
- [ ] Error messages are clear and helpful
- [ ] Toast notifications appear for all actions
- [ ] Loading states prevent double-submissions
- [ ] Responsive design works on mobile

---

## 📊 **Test Results Summary**

**Date Tested:** _______________
**Tested By:** _______________
**Environment:** _______________

**Overall Status:**
- [ ] ✅ All Critical Tests Passed
- [ ] ✅ All Security Tests Passed
- [ ] ⚠️ Minor Issues Found (document below)
- [ ] ❌ Critical Issues Found (document below)

**Issues Found:**

| # | Feature | Severity | Description | Status |
|---|---------|----------|-------------|--------|
| 1 |         |          |             |        |
| 2 |         |          |             |        |
| 3 |         |          |             |        |

**Notes:**

_______________________________________________
_______________________________________________
_______________________________________________

---

## 🔄 **Regression Testing**

After any bug fixes or changes, re-run:
1. Authentication & Authorization tests
2. Affected feature area tests
3. Integration tests involving changed features
4. Security boundary tests

---

**Version History:**
- v1.0 (2025-11-13): Initial comprehensive testing checklist

