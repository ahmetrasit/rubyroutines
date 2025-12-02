# Ruby Routines - Use Case Testing Plan

Progressive Web App for routine/habit management (Parents & Teachers of advanced learners)
**Stack:** Next.js 14 + React 18 + TypeScript + Prisma + Supabase + Stripe

---

## 1. AUTHENTICATION & ACCOUNT MANAGEMENT

### 1.1 Registration
- [ ] Valid email/password signup creates account with PARENT + TEACHER roles
- [ ] Invalid email formats rejected (temp providers blocked)
- [ ] Password minimum 6 characters enforced
- [ ] Duplicate email shows error
- [ ] 6-digit verification code sent via email (Resend)
- [ ] Code expires after 10 minutes
- [ ] Code has 3 attempt limit, resend available (3x max)
- [ ] Email verification required before accessing protected pages
- [ ] Rate limiting enforced on signup

### 1.2 Login
- [ ] Valid credentials grant access
- [ ] Invalid credentials show error
- [ ] Failed attempts locked after max threshold
- [ ] Session persists across refreshes
- [ ] Rate limiting on login attempts

### 1.3 Two-Factor Authentication (2FA)
- [ ] TOTP setup generates QR code for authenticator app
- [ ] 10 single-use backup codes generated
- [ ] 2FA required on login when enabled
- [ ] Backup codes work correctly
- [ ] 2FA can be disabled
- [ ] TOTP secrets encrypted in database

### 1.4 Session Management
- [ ] Session persists across page refreshes
- [ ] Logout clears session completely
- [ ] Inactivity timeout enforced
- [ ] Kiosk mode has separate timeout (configurable)

### 1.5 Password Management
- [ ] Update requires old password verification
- [ ] New password cannot match old password
- [ ] Changes logged in audit trail

---

## 2. USER ROLES & MULTI-ROLE SUPPORT

### 2.1 Role Management
- [ ] Four role types: PARENT, TEACHER, PRINCIPAL, SUPPORT
- [ ] Each user can have max one of each type (up to 4 roles)
- [ ] New users auto-assigned PARENT + TEACHER
- [ ] Each role has independent data and subscription
- [ ] Soft delete preserves role history

### 2.2 Role Switching
- [ ] Mode switcher displays all user's roles
- [ ] Dashboard context updates when switching roles
- [ ] Last used role remembered
- [ ] All queries update for active role

### 2.3 Role Configuration
- [ ] Custom UI color per role (hex validation)
- [ ] Tier limit overrides configurable per role

---

## 3. PEOPLE & GROUP MANAGEMENT

### 3.1 Person Management
- [ ] Create person with name (1-50 chars, required)
- [ ] Optional: avatar (emoji + color), birthdate, notes
- [ ] Birthdate validation (past dates only)
- [ ] Person status: ACTIVE, INACTIVE, ARCHIVED
- [ ] List shows access type: owned, coparent, connected
- [ ] Soft archive with restore capability
- [ ] Tier limit enforced (max persons per role)
- [ ] Default "Me" person created for new users

### 3.2 Group/Classroom Management
- [ ] Create groups with type: FAMILY, CLASSROOM, CUSTOM
- [ ] Required: name (1-100 chars), type
- [ ] Optional: description, emoji, color (hex)
- [ ] Soft archive with restore
- [ ] Tier limit enforced (max groups per role)
- [ ] Co-teacher assignments to groups

### 3.3 Group Members
- [ ] Add/remove persons from groups
- [ ] Person can belong to multiple groups
- [ ] Group members appear in assignment options
- [ ] Cannot add persons from different role

---

## 4. ROUTINE MANAGEMENT

### 4.1 Core Properties
- [ ] Create routine with name (1-100 chars, required)
- [ ] Description optional (max 1000 chars)
- [ ] Color validation (hex format)
- [ ] Type: REGULAR, SMART, TEACHER_CLASSROOM
- [ ] Reset period: DAILY, WEEKLY, MONTHLY, CUSTOM
- [ ] Reset day configuration (0-6 week, 1-31 month)
- [ ] Status: ACTIVE, INACTIVE, ARCHIVED
- [ ] Soft archive/restore functionality
- [ ] Tier limit enforced (max routines per role)
- [ ] Source tracked if imported from marketplace

### 4.2 Routine Assignment
- [ ] Assign to person OR group
- [ ] Multiple assignments per routine
- [ ] Group assignment applies to all members
- [ ] Remove assignments
- [ ] Task visibility respects assignments

### 4.3 Visibility & Scheduling
- [ ] Type ALWAYS: always visible
- [ ] Type DATE_RANGE: visible between startDate/endDate
- [ ] Type DAYS_OF_WEEK: visible on selected days (0-6 array)
- [ ] Type CONDITIONAL: based on conditions
- [ ] Time range validation (HH:MM format)
- [ ] Visibility overrides with expiration
- [ ] Multiple overrides coexist

### 4.4 Completion Tracking
- [ ] Routine completion % calculated from active tasks
- [ ] Reflects current reset period
- [ ] Real-time updates

### 4.5 Smart Routines
- [ ] Type SMART for conditional routines
- [ ] Conditions control visibility
- [ ] AND/OR logic between checks
- [ ] Circular dependency prevention
- [ ] Runtime evaluation at display time

---

## 5. TASK MANAGEMENT

### 5.1 Core Properties
- [ ] Create task with name (1-100 chars, required)
- [ ] Description optional (max 1000 chars)
- [ ] Emoji/icon identifier
- [ ] Color validation (hex format)
- [ ] Order within routine (0-999)
- [ ] Type: SIMPLE, MULTIPLE_CHECKIN, PROGRESS
- [ ] Status: ACTIVE, INACTIVE, ARCHIVED
- [ ] Soft archive/restore
- [ ] Tier limit enforced (max tasks per routine)

### 5.2 Simple Tasks
- [ ] Toggle complete/incomplete
- [ ] One completion per period per person
- [ ] Timestamp recorded

### 5.3 Multiple Check-In Tasks
- [ ] Mark complete multiple times per period
- [ ] Entry number tracked (1-9)
- [ ] Each entry timestamped
- [ ] Completion count displayed
- [ ] Entry limit enforced

### 5.4 Progress Tasks
- [ ] Unit field (e.g., "pages", "minutes")
- [ ] Target value (positive integer)
- [ ] Cumulative sum tracked
- [ ] Entry number (1-99)
- [ ] Percentage progress shown
- [ ] Value validation (positive numbers)

### 5.5 Task Ordering & Conditions
- [ ] Drag-and-drop reordering
- [ ] Order persists
- [ ] Task linked to conditions
- [ ] Condition controls visibility

### 5.6 Completion History
- [ ] Timestamp recorded
- [ ] Person who completed tracked
- [ ] Value recorded (for progress tasks)
- [ ] Notes supported
- [ ] Cannot create future completions
- [ ] Tied to reset period

---

## 6. GOAL MANAGEMENT

### 6.1 Core Properties
- [ ] Create goal with name (1-100 chars, required)
- [ ] Description optional (max 1000 chars)
- [ ] Target value (positive integer)
- [ ] Reset period: DAILY, WEEKLY, MONTHLY, CUSTOM
- [ ] Status: ACTIVE, COMPLETED, FAILED, ARCHIVED
- [ ] Soft archive/restore
- [ ] Tier limit enforced (max goals per role)
- [ ] Marketplace source tracked

### 6.2 Goal Linking & Progress
- [ ] Link to one or more tasks
- [ ] Link to one or more routines
- [ ] Links have weight (importance)
- [ ] Weight-adjusted progress calculations
- [ ] Progress vs target displayed
- [ ] Percentage complete shown
- [ ] Real-time updates
- [ ] Filtered by persons/groups

### 6.3 Achievement & Reset
- [ ] Marked achieved when target reached
- [ ] Achievement timestamp recorded
- [ ] Reset for next period
- [ ] Mark as failed if not achieved by period end
- [ ] Historical tracking (completed, failed)

---

## 7. CONDITIONS & SMART ROUTINES

### 7.1 Condition Creation
- [ ] Create condition for routine
- [ ] Type: controls ROUTINE or TASK(S)
- [ ] Logic: AND or OR between checks
- [ ] Multiple checks per condition

### 7.2 Available Operators
- [ ] TASK_COMPLETED / TASK_NOT_COMPLETED
- [ ] TASK_COUNT_EQUALS / GT / LT
- [ ] TASK_VALUE_EQUALS / GT / LT
- [ ] ROUTINE_PERCENT_EQUALS / GT / LT
- [ ] GOAL_ACHIEVED / GOAL_NOT_ACHIEVED

### 7.3 Evaluation Features
- [ ] Negate operator (NOT)
- [ ] Value field for comparisons
- [ ] Target selection (task/routine/goal)
- [ ] AND/OR logic combination
- [ ] Circular dependency prevention
- [ ] Runtime evaluation respects reset period

---

## 8. KIOSK MODE

### 8.1 Code Generation
- [ ] Generate 2-3 word code (safe words list)
- [ ] Unique across all systems
- [ ] Expires: 1-168 hours
- [ ] Group-specific OR person-specific
- [ ] Rate limit: 20 codes/hour per role

### 8.2 Code Management
- [ ] List active codes with creation/expiration dates
- [ ] Shows target (group/person/role)
- [ ] Revoke active codes
- [ ] Status: ACTIVE, USED, EXPIRED, REVOKED

### 8.3 Kiosk Access
- [ ] Code entry validation
- [ ] Rate limiting on entry attempts
- [ ] Successful entry loads session
- [ ] Code marked USED when limit reached

### 8.4 Kiosk Session
- [ ] Shows available persons
- [ ] Shows assigned routines
- [ ] Respects visibility rules
- [ ] Requires person selection
- [ ] Inactivity timeout (configurable, default 60s)
- [ ] Logout button
- [ ] Session data clears on timeout

### 8.5 Kiosk Task Completion
- [ ] Simple: tap to complete
- [ ] Multiple check-in: increments count
- [ ] Progress: accepts numeric input
- [ ] Visual feedback
- [ ] Undo recent (short window)
- [ ] Updates progress bar and routine %
- [ ] Saves to database

### 8.6 Kiosk UI/UX
- [ ] Large, touch-friendly buttons (44px+ targets)
- [ ] High contrast colors
- [ ] Person avatars displayed
- [ ] Emoji/icons for tasks
- [ ] Progress bars visible
- [ ] Minimal navigation
- [ ] Responsive design

---

## 9. MARKETPLACE & SHARING

### 9.1 Marketplace Discovery
- [ ] Shows public routines and goals
- [ ] Filter by type: ROUTINE/GOAL
- [ ] Filter by category, age group, tags
- [ ] Keyword search
- [ ] Sort: rating, fork count, recent
- [ ] Item cards show rating and forks
- [ ] Filtered by role type (PARENT/TEACHER)

### 9.2 Marketplace Item Details
- [ ] Full details view with structure
- [ ] Rating and review count displayed
- [ ] Import count shown
- [ ] User can rate 1-5 stars
- [ ] User can change rating
- [ ] User's rating prominently displayed

### 9.3 Publishing
- [ ] Publish routine/goal to marketplace
- [ ] Email verification required
- [ ] Title and description required
- [ ] Public/Private visibility
- [ ] Category, age group, tags optional
- [ ] Target audience (PARENT/TEACHER)
- [ ] Complete structure included
- [ ] Update after publish
- [ ] Item appears in published list

### 9.4 Importing (Forking)
- [ ] Import published routine/goal
- [ ] Choose target person or group
- [ ] Choose role
- [ ] All tasks/goals imported
- [ ] Timestamps reset
- [ ] Original linked (sourceMarketplaceItemId)
- [ ] Import tracked, fork count incremented
- [ ] Can import to different targets
- [ ] Cannot import to same target twice

### 9.5 Share Codes
- [ ] Generate 3-word code
- [ ] Max uses and expiration optional
- [ ] Public link generated
- [ ] Usage tracked
- [ ] Revoke code
- [ ] Share via email

### 9.6 Comments & Ratings
- [ ] Add comments to items
- [ ] Comments show text, author, date
- [ ] Status: ACTIVE, FLAGGED, HIDDEN
- [ ] User can flag comment with reason
- [ ] Admins hide flagged comments
- [ ] Comment count displayed

### 9.7 Moderation
- [ ] Hide marketplace items
- [ ] Hidden items excluded from search
- [ ] Hide reason and timestamp tracked
- [ ] Unhide items
- [ ] View flagged comments in admin panel
- [ ] Delete comments
- [ ] Bulk hide/unhide
- [ ] All moderation logged

---

## 10. PERSON SHARING

### 10.1 Sharing System
- [ ] Owner shares person with another user
- [ ] 4-word code format (word-word-word-word)
- [ ] Expires: 90 days default
- [ ] Max uses optional
- [ ] Permission levels: VIEW, EDIT, MANAGE
- [ ] VIEW: read-only completions
- [ ] EDIT: view + complete tasks
- [ ] MANAGE: view + edit + manage routines
- [ ] Email invite with code
- [ ] Email shows expiration/permissions
- [ ] Status: ACTIVE, USED, EXPIRED, REVOKED

### 10.2 Claiming Invites
- [ ] Claim with code
- [ ] Code validation (exists, active, not expired)
- [ ] Use count checked and incremented
- [ ] Connection created per permissions
- [ ] Multiple users can claim (if multiple uses)
- [ ] Shared person in accessible list

### 10.3 Connections
- [ ] Tracks owner, sharer, permissions
- [ ] Status: ACTIVE, REVOKED, EXPIRED
- [ ] Data filtered by permission level
- [ ] Owner revokes connection
- [ ] Revocation removes access immediately

---

## 11. CO-PARENT/CO-TEACHER

### 11.1 Co-Parent System
- [ ] Parent invites co-parent via email
- [ ] Email verification required
- [ ] Unique invite token
- [ ] Expires: 30 days default
- [ ] Permissions: READ_ONLY, TASK_COMPLETION, FULL_EDIT
- [ ] READ_ONLY: view only
- [ ] TASK_COMPLETION: view + complete tasks
- [ ] FULL_EDIT: view + edit + manage
- [ ] Limited to specific persons
- [ ] List co-parents
- [ ] Update permissions and persons
- [ ] Revoke access

### 11.2 Co-Teacher System
- [ ] Teacher invites co-teacher via email
- [ ] Specific classroom invitation
- [ ] Email verification required
- [ ] Permissions: VIEW, EDIT (for classroom)
- [ ] List per classroom
- [ ] Update permissions
- [ ] Revoke access

---

## 12. STUDENT-PARENT CONNECTIONS

### 12.1 Connection Code (Teacher)
- [ ] Generate code for specific student
- [ ] Email verification required
- [ ] 4-word code format
- [ ] Expires: 7 days default

### 12.2 Connection Process
- [ ] Parent receives code
- [ ] Parent enters code to connect
- [ ] Connection links parent to student
- [ ] Parent sees connected student
- [ ] Parent accesses student's routines

### 12.3 Connection Management
- [ ] Parent sees connected students
- [ ] Parent can disconnect
- [ ] Teacher sees parent connections
- [ ] Teacher can remove parent connection

---

## 13. ANALYTICS & REPORTING

### 13.1 Completion Trends
- [ ] Graph of completions over time
- [ ] Configurable date range (default 30 days)
- [ ] Filter by person
- [ ] Shows daily counts and trend line
- [ ] Export to CSV

### 13.2 Goal Progress
- [ ] Shows all active goals
- [ ] Current progress vs target
- [ ] Percentage complete
- [ ] Time remaining in period
- [ ] Linked tasks/routines shown

### 13.3 Task Heatmap
- [ ] Completion frequency by task
- [ ] Color intensity = frequency
- [ ] Configurable time period
- [ ] Filter by person
- [ ] Export to CSV

### 13.4 Streak Tracking
- [ ] Routine streak per person
- [ ] Shows current and longest streak
- [ ] Milestone achievements (7, 14, 30, 100 days)
- [ ] Streak resets on missed day
- [ ] Historical data available

### 13.5 Analytics Export
- [ ] Export to CSV
- [ ] Date range configurable
- [ ] Spreadsheet-formatted

---

## 14. BILLING & STRIPE

### 14.1 Tier System
- [ ] Four tiers: FREE, BRONZE, GOLD, PRO
- [ ] Different limits per tier
- [ ] FREE: no payment required

### 14.2 Tier Limits
- [ ] Max persons per role enforced
- [ ] Max groups per role enforced
- [ ] Max routines per role enforced
- [ ] Max tasks per routine enforced
- [ ] Max goals per role enforced
- [ ] Max kiosk codes enforced
- [ ] Feature access by tier (marketplace, analytics, 2FA)

### 14.3 Free Trial
- [ ] New users start FREE
- [ ] Upgrade prompts at limit
- [ ] Limit enforcement prevents creation beyond tier

### 14.4 Stripe Checkout
- [ ] User initiates upgrade
- [ ] Stripe checkout displays correct price/billing period
- [ ] Successful payment creates subscription
- [ ] User tier updated immediately

### 14.5 Subscription Management
- [ ] Subscription ID stored in role
- [ ] Status tracked (ACTIVE, CANCELED, etc.)
- [ ] User accesses billing portal
- [ ] Cancel subscription
- [ ] Downgrade to FREE on cancel
- [ ] Webhooks handle events

---

## 15. ADMIN PANEL

### 15.1 Access Control
- [ ] Only isAdmin=true users access /admin
- [ ] Admin cannot toggle own admin status
- [ ] Path protected at /admin
- [ ] tRPC adminProcedure required
- [ ] All actions audit logged

### 15.2 Admin Dashboard
- [ ] System statistics displayed
- [ ] Total/verified/admin user counts
- [ ] Roles by type
- [ ] Tier distribution
- [ ] Recent activity feed
- [ ] 30-day metrics

### 15.3 User Management
- [ ] Search by email
- [ ] Filter by admin/tier
- [ ] Pagination
- [ ] View user details (email, roles, subscriptions, admin status)
- [ ] Grant/revoke admin
- [ ] Change tier
- [ ] Set tier overrides
- [ ] Delete user (with confirmation)

### 15.4 Tier Configuration
- [ ] View/update limits for each tier
- [ ] Update pricing (PARENT and TEACHER separately)
- [ ] Changes affect new subscribers

### 15.5 System Settings
- [ ] View all settings by category (general, tiers, features, security, billing)
- [ ] Update settings (toggles, values)
- [ ] Maintenance mode toggle
- [ ] Registration enabled toggle
- [ ] Marketplace enabled toggle
- [ ] Kiosk inactivity timeout
- [ ] Max login attempts
- [ ] Session timeout
- [ ] Changes take effect immediately

### 15.6 Audit Logging
- [ ] All admin actions logged
- [ ] Shows action, user, timestamp, changes
- [ ] Searchable by action type
- [ ] Filterable by date range
- [ ] Before/after values recorded
- [ ] IP address and user agent tracked
- [ ] Export to CSV

### 15.7 Moderation Features
- [ ] Hide marketplace items (excluded from search)
- [ ] Hide reason optional
- [ ] Unhide items
- [ ] View flagged comments
- [ ] Hide/delete comments
- [ ] Bulk actions
- [ ] Moderation logged

---

## 16. DATA VALIDATION & INTEGRITY

### 16.1 Database Constraints
- [ ] User email unique and lowercase
- [ ] Role (userId + type) unique
- [ ] Names required
- [ ] Timestamps auto-set
- [ ] Status enums constrained

### 16.2 Input Validation
- [ ] Email format and provider validation
- [ ] Password length validation (min 6)
- [ ] Name length validation
- [ ] Color hex format validation
- [ ] URL validation
- [ ] Emoji validation
- [ ] Number validation (positive, bounds)
- [ ] Date validation (logical)
- [ ] Time validation (HH:MM)
- [ ] Enum validation (valid values)
- [ ] Array validation (length)

### 16.3 Authorization
- [ ] Users access only own roles/data
- [ ] Cannot access other users' data
- [ ] Shared data access respected
- [ ] Admins access all data
- [ ] Tier limits enforced per role

### 16.4 Soft Deletes
- [ ] Persons, groups, routines, tasks, goals archived
- [ ] deletedAt timestamp set
- [ ] Archived excluded from lists
- [ ] Restore capability
- [ ] Never hard deleted

---

## 17. SECURITY

### 17.1 Password Security
- [ ] Passwords hashed with bcryptjs
- [ ] Never logged
- [ ] Old password verified on update

### 17.2 2FA Security
- [ ] TOTP secrets encrypted (AES-256)
- [ ] Backup codes hashed
- [ ] Single-use backup codes
- [ ] QR code for manual entry

### 17.3 Token Security
- [ ] JWT tokens signed
- [ ] Secure httpOnly sessions
- [ ] CSRF protection
- [ ] XSS prevention

### 17.4 Data Protection
- [ ] Soft deletes preserve history
- [ ] Audit trails for all changes
- [ ] GDPR data export available
- [ ] GDPR deletion support

### 17.5 Email Verification
- [ ] Verification codes hashed
- [ ] Short expiration (10 min)
- [ ] Limited retry (3 attempts)

---

## 18. GDPR & PRIVACY

### 18.1 Right to Access
- [ ] User exports all data
- [ ] Includes all entities
- [ ] JSON format
- [ ] Downloadable

### 18.2 Right to Erasure
- [ ] Account deletion request
- [ ] Soft delete (marked deleted)
- [ ] Data retained for compliance
- [ ] Cannot delete admins
- [ ] Requires confirmation

### 18.3 Right to Portability
- [ ] Exported data in standard format
- [ ] Usable in other apps
- [ ] Includes all user-generated content

### 18.4 Privacy Policy
- [ ] Clear data practices disclosed
- [ ] Data retention disclosed
- [ ] Third-parties listed

### 18.5 Cookie Consent
- [ ] Banner on first visit
- [ ] Clear opt-in/out
- [ ] Preference storage
- [ ] Manage preferences

---

## 19. EMAIL INTEGRATION (Resend)

### 19.1 Email Sending
- [ ] Verification codes sent
- [ ] Invitations sent (co-parent, co-teacher, student connection)
- [ ] Marketplace share codes sent
- [ ] Person share codes sent
- [ ] Billing receipts sent (Stripe)

### 19.2 Email Content
- [ ] Clear subjects
- [ ] HTML formatted
- [ ] Action links included
- [ ] Code/token included
- [ ] Expiration shown
- [ ] Professional branding

---

## 20. RATE LIMITING

### 20.1 Auth Rate Limiting
- [ ] Signup limited per IP/hour
- [ ] Login limited per IP/email/hour
- [ ] Code resend: 3 times max
- [ ] Code generation: 20 per hour per role

### 20.2 Marketplace Rate Limiting
- [ ] Item publication limited
- [ ] Share code generation limited
- [ ] Comment posting limited

### 20.3 Sharing Rate Limiting
- [ ] Invite generation: 20 per hour per role

### 20.4 Responses
- [ ] 429 Too Many Requests returned
- [ ] Clear message with reset time
- [ ] Upstash Redis or in-memory fallback

---

## 21. REAL-TIME & PERFORMANCE

### 21.1 Real-Time Updates (Supabase)
- [ ] Task completion syncs across sessions
- [ ] Person updates broadcast
- [ ] Routine updates broadcast
- [ ] Concurrent edits handled

### 21.2 Kiosk Updates
- [ ] kioskLastUpdatedAt tracked
- [ ] Polling for changes
- [ ] Polling interval configurable
- [ ] Reduces unnecessary updates

### 21.3 Performance
- [ ] Queries use indexes
- [ ] Pagination implemented
- [ ] Rate limiting prevents abuse
- [ ] Caching where appropriate

---

## 22. END-TO-END WORKFLOWS

### 22.1 New User Onboarding
1. [ ] Sign up with email/password
2. [ ] Verify email with code
3. [ ] Select role (parent/teacher)
4. [ ] Create first person
5. [ ] Create first routine
6. [ ] Assign routine to person
7. [ ] Create tasks
8. [ ] Complete task in kiosk

### 22.2 Parent Workflow
1. [ ] Login
2. [ ] View persons
3. [ ] Create routine with tasks
4. [ ] Assign to person
5. [ ] View completion history
6. [ ] Check analytics
7. [ ] Share with co-parent
8. [ ] Receive student connection from teacher

### 22.3 Teacher Workflow
1. [ ] Login
2. [ ] Create classroom
3. [ ] Add students
4. [ ] Create classroom routine
5. [ ] Assign to classroom
6. [ ] View completions
7. [ ] Generate parent connection code
8. [ ] Publish routine to marketplace

### 22.4 Co-Parent Workflow
1. [ ] Receive invitation email
2. [ ] Accept invitation
3. [ ] View shared persons
4. [ ] View routines
5. [ ] Complete tasks (if permitted)

### 22.5 Marketplace Workflow
1. [ ] Browse marketplace
2. [ ] Search/filter items
3. [ ] View item details
4. [ ] Rate and comment on item
5. [ ] Fork (import) item
6. [ ] Share via code
7. [ ] Import from share code

### 22.6 Admin Workflow
1. [ ] Login as admin
2. [ ] Access admin panel at /admin
3. [ ] View system statistics
4. [ ] Manage users (grant admin, change tier)
5. [ ] Update tier limits and pricing
6. [ ] Review audit logs
7. [ ] Moderate marketplace (hide items, manage flagged comments)

---

## 23. EDGE CASES

### 23.1 Concurrency
- [ ] Multiple users editing same routine
- [ ] Simultaneous task completions
- [ ] Transaction handling
- [ ] Conflict resolution

### 23.2 Boundary Conditions
- [ ] Empty lists handled
- [ ] Single item lists handled
- [ ] Max tier limits enforced
- [ ] Expired codes/invites rejected
- [ ] Archived items excluded
- [ ] Deleted users handled
- [ ] Inactive roles handled

### 23.3 Invalid States
- [ ] Cannot complete task from different routine
- [ ] Cannot modify archived routine
- [ ] Cannot use expired codes
- [ ] Cannot use revoked codes
- [ ] Cannot assign non-existent person
- [ ] Cannot link non-existent goal

---

## 24. BROWSER & DEVICE COMPATIBILITY

### 24.1 Desktop Browsers
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

### 24.2 Mobile Browsers
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Firefox Mobile
- [ ] Samsung Internet

### 24.3 Responsive Design
- [ ] Mobile (320px+) layout correct
- [ ] Tablet (768px+) layout correct
- [ ] Desktop (1024px+) layout correct
- [ ] Touch targets 44px minimum
- [ ] Smooth scrolling
- [ ] Responsive images

### 24.4 Progressive Web App (PWA)
- [ ] Service worker installed
- [ ] Offline functionality works
- [ ] App installable on devices
- [ ] Manifest configured correctly
- [ ] Icons present

---

## 25. ACCESSIBILITY (WCAG 2.1)

- [ ] Keyboard navigation works throughout
- [ ] Screen reader compatible
- [ ] Color contrast ratios meet WCAG AA
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] Form labels properly associated
- [ ] Semantic HTML used
- [ ] Tab order logical
- [ ] Skip links available
- [ ] Modal focus trap works
- [ ] Escape to close modals
- [ ] Aria labels on interactive elements
- [ ] Descriptive button/link text
- [ ] Hierarchical heading structure

---

## 26. TEACHER-ONLY ROUTINES

### 26.1 Auto-Generation
- [ ] Teacher-only routine auto-created when student added to classroom
- [ ] Default name "📋 Teacher Notes" with purple color (#8B5CF6)
- [ ] Not created for account owner persons
- [ ] Not created for non-TEACHER roles
- [ ] No duplicates created for same student
- [ ] Re-created when student restored from archive
- [ ] Created when student added to group via addMember

### 26.2 Visibility Filters
- [ ] Teacher-only routines hidden in kiosk mode
- [ ] Hidden from parent viewing their child's routines
- [ ] Hidden from person.getById for non-teachers
- [ ] Hidden from routine.list for non-teachers
- [ ] Visible to teachers viewing their students
- [ ] Visible to co-teachers in same classroom

### 26.3 Access Control
- [ ] Only teachers can complete teacher-only tasks
- [ ] Non-teachers receive FORBIDDEN error on attempt
- [ ] Task completion verifies routine ownership
- [ ] Prevents parent/student from completing teacher tasks

### 26.4 UI Display
- [ ] Purple theme (#8B5CF6) used consistently
- [ ] "Teacher Only" badge displayed
- [ ] Collapsible section in individual check-in
- [ ] Separate from regular routines in UI
- [ ] Progress tracking for teacher-only tasks

---

## 27. PERSON SHARING & CONNECTION RESTRICTIONS

### 27.1 Family Member (Child) Connections
- [ ] Parent can share child with teacher (becomes student)
- [ ] Parent CANNOT share child with another parent via person card
- [ ] Must use Co-Parent system for parent-to-parent sharing
- [ ] Error message directs to Co-Parent invitations
- [ ] Child cannot be connected to another adult's account owner

### 27.2 Student Connections
- [ ] Teacher can share student with another teacher
- [ ] Teacher CANNOT share student with parent via person card
- [ ] Must use Connection Code for teacher-to-parent
- [ ] Error message directs to Connection Code system
- [ ] Student cannot be connected to parent's account owner

### 27.3 Account Owner Restrictions
- [ ] Account owners cannot be shared via person sharing codes
- [ ] Error prevents generation of share code for account owners
- [ ] Error prevents claiming codes for account owners
- [ ] Must use co-parent/co-teacher invitations instead

### 27.4 Person Sharing Codes
- [ ] 4-word format (word1-word2-word3-word4)
- [ ] Unique across all code systems (marketplace, routine, kiosk)
- [ ] Rate limit: 20 codes per user per hour
- [ ] Codes expire after configurable days (default 90)
- [ ] Optional max uses limit
- [ ] Status tracking (ACTIVE, USED, EXPIRED, REVOKED)

### 27.5 Claiming & Validation
- [ ] Validate code format and existence
- [ ] Check expiration date
- [ ] Verify max uses not exceeded
- [ ] Prevent duplicate claims by same user
- [ ] Rate limit: 10 failed attempts per hour
- [ ] Record failed attempts for rate limiting

---

## 28. TEACHER CHECK-IN WORKFLOWS

### 28.1 Individual Student Check-in (Workflow #1)
- [ ] Access via student's person card "Check-in" button
- [ ] Regular routines shown in standard sections
- [ ] Teacher-only section collapsible, purple-themed
- [ ] Shows all task types (simple, multi-checkin, progress)
- [ ] Teacher-only section only visible to teachers
- [ ] Progress tracking for teacher-only simple tasks
- [ ] Task completion updates immediately (optimistic)

### 28.2 Bulk Classroom Check-in (Workflow #2)
- [ ] Access via teacher's "Bulk Check-in" button (purple)
- [ ] Only visible to account owner in classroom context
- [ ] Grid layout: students in rows, tasks in columns
- [ ] Shows only simple tasks from teacher-only routines
- [ ] Click to mark/unmark task for each student
- [ ] Efficient for attendance, grading, notes
- [ ] Real-time updates across all students

### 28.3 Task Completion
- [ ] Complete teacher-only task for student
- [ ] Completion tracked with personId
- [ ] Reset period respected (daily, weekly, monthly)
- [ ] Completion history visible to teacher
- [ ] Undo functionality within time window
- [ ] Updates reflected in both workflows

---

## 29. PERFORMANCE & OPTIMIZATION

### 29.1 Batch Fetching
- [ ] Bulk check-in fetches all students in single query
- [ ] getBatch endpoint accepts array of person IDs (max 100)
- [ ] Verifies ownership for all persons
- [ ] Single database query vs N+1 queries
- [ ] 96.8% query reduction (31 queries → 1 for 30 students)

### 29.2 Database Indexes
- [ ] Composite index on (roleId, isTeacherOnly, status)
- [ ] Routine filtering 10-100x faster
- [ ] Person and task queries optimized
- [ ] Kiosk code verification indexed
- [ ] No full table scans on filtered queries

### 29.3 Optimistic Updates
- [ ] Task completion updates UI immediately
- [ ] Previous state snapshotted for rollback
- [ ] Automatic rollback on server error
- [ ] Loading indicators on pending operations
- [ ] Smooth transitions (150ms)

### 29.4 Error Recovery
- [ ] Automatic retry on network failures (up to 3x for queries)
- [ ] Exponential backoff: 1s → 2s → 4s
- [ ] No retry on client errors (4xx)
- [ ] Mutation retry limited (2x max)
- [ ] Smart error detection (retries only transient errors)

### 29.5 Code Quality
- [ ] No code duplication in bulk check-in component
- [ ] Shared refetch logic extracted
- [ ] Theme colors centralized in constants
- [ ] TypeScript typing maintained throughout
- [ ] Comprehensive error handling

---

## TESTING SUMMARY

**Total Test Cases:** 600+
**Coverage:** 29 major feature sections
**Roles Tested:** PARENT, TEACHER, PRINCIPAL, SUPPORT
**Focus Areas:**
- Multi-role and multi-tenant functionality
- Role-based access control and permissions
- Teacher-only routines and workflows (NEW)
- Person sharing restrictions and connections (NEW)
- Batch fetching and performance optimizations (NEW)
- Soft deletes and audit trails
- Real-time updates and concurrency
- Security (2FA, encryption, rate limiting)
- GDPR compliance
- Marketplace with moderation
- Billing and subscription management
- Admin controls and system configuration

**Test Priority:**
1. Authentication and authorization (all roles)
2. Teacher-only routines (visibility, access control, auto-generation)
3. Person sharing restrictions (prevent unauthorized connections)
4. Data isolation between roles/users
5. Teacher check-in workflows (individual & bulk)
6. Performance optimizations (batch fetching, indexes)
7. Completion calculations and reset period logic
8. Sharing and collaboration workflows
9. Marketplace publishing and importing
10. Billing and tier enforcement
11. Admin moderation and audit logging
12. Real-time sync and concurrency
13. Security vulnerabilities (XSS, CSRF, injection)
14. Accessibility and responsive design

**Recommended Test Approach:**
- Manual testing for UX/UI and workflows
- Automated E2E tests for critical paths (Playwright/Cypress)
- Unit tests for calculations and business logic
- Integration tests for tRPC endpoints
- Security testing for auth and permissions
- Performance testing for real-time features
- Cross-browser testing for compatibility
- Accessibility audits (axe, Lighthouse)
