# Ruby Routines - User Guide

**Version:** 1.0
**Last Updated:** 2025-11-13

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Account Setup](#account-setup)
3. [Dashboard Overview](#dashboard-overview)
4. [Managing Routines](#managing-routines)
5. [Managing Tasks](#managing-tasks)
6. [Setting Goals](#setting-goals)
7. [Kiosk Mode](#kiosk-mode)
8. [Sharing Features](#sharing-features)
9. [Analytics](#analytics)
10. [Marketplace](#marketplace)
11. [Subscription Tiers](#subscription-tiers)
12. [Admin Panel](#admin-panel)

---

## Getting Started

### What is Ruby Routines?

Ruby Routines is a progressive web application designed to help parents and teachers manage daily routines and track progress for advanced and gifted learners. The app focuses on building sustainable habits through consistent practice, without time pressure or competition.

### Core Philosophy

- **No Timers**: Focus on completion, not speed
- **No Competition**: No leaderboards or rankings
- **Progress Over Perfection**: Celebrate consistency
- **Non-Judgmental**: Data presented without pressure
- **Intrinsic Motivation**: Build internal drive

---

## Account Setup

### Creating Your Account

1. **Sign Up**
   - Navigate to the signup page
   - Enter your email address
   - Create a strong password (minimum 8 characters)
   - Enter your name
   - Click "Sign Up"

2. **Verify Your Email**
   - Check your email for a 6-digit verification code
   - Enter the code on the verification page
   - Your email is now verified

3. **Choose Your Role**
   - **Parent Mode**: Manage routines for your children
   - **Teacher Mode**: Manage classroom routines
   - You can switch between roles anytime

### Account Types

**FREE Tier** (Default)
- 3 persons (children/students)
- 0 groups (classrooms)
- 10 routines
- 10 tasks per routine
- 3 goals
- 1 kiosk code

**Paid Tiers** (Upgrade available)
- BASIC ($5/month): More persons, groups, and routines
- PREMIUM ($10/month): Advanced features and analytics
- SCHOOL ($25/month): Full classroom management

---

## Dashboard Overview

### Parent Dashboard

Your parent dashboard shows:
- List of your children (persons)
- Quick view of active routines
- Today's task completion status
- Goal progress indicators
- Quick actions (add person, create routine, generate kiosk code)

### Teacher Dashboard

Your teacher dashboard shows:
- List of students
- Classroom groups
- Active classroom routines
- Student progress overview
- Connection codes for parent linking

### Navigation

- **Mode Switcher**: Toggle between Parent and Teacher roles
- **Menu**: Access all features (routines, goals, analytics, marketplace)
- **Profile**: Account settings, subscription, logout
- **Admin** (if admin): Access admin panel

---

## Managing Routines

### Creating a Routine

1. Click "Create Routine" button
2. Enter routine details:
   - **Name**: e.g., "Morning Routine"
   - **Description**: Optional details
   - **Type**: Regular, Smart, or Teacher Classroom
   - **Reset Period**: Daily, Weekly, Monthly, or Custom
   - **Reset Day**: For weekly/monthly routines
3. Click "Create"
4. Add tasks to your routine

### Routine Types

**Regular Routine**
- Standard routine that resets on schedule
- Can be assigned to persons or groups

**Smart Routine**
- Conditional routine that appears based on rules
- Example: "Reward routine appears after completing homework 5 times"

**Teacher Classroom Routine**
- Designed for classroom use
- Can be assigned to entire classroom groups

### Assigning Routines

1. Open the routine
2. Click "Assign"
3. Select persons or groups
4. Click "Save Assignment"

### Visibility Settings

Control when routines appear:
- **Always**: Routine always visible
- **Date Range**: Only visible between specific dates
- **Days of Week**: Only visible on certain days
- **Conditional**: Appears when conditions are met

---

## Managing Tasks

### Task Types

**Simple Task**
- Single checkbox
- Complete once per routine period
- Example: "Make bed"

**Multiple Check-in Task**
- Can be completed multiple times
- Example: "Drink water" (goal: 8 times)

**Progress Task**
- Track numeric progress
- Example: "Read pages" (goal: 30 pages)

**Smart Task**
- Conditional task based on other completions
- Example: "Bonus activity unlocked after homework"

### Creating Tasks

1. Open a routine
2. Click "Add Task"
3. Enter task details:
   - **Name**: Clear, actionable description
   - **Type**: Choose task type
   - **Target Value**: For progress tasks
   - **Unit**: e.g., "pages", "minutes"
4. Click "Create"

### Completing Tasks

**Regular View:**
- Check off tasks as you complete them
- Progress tasks: Enter value completed
- Multiple check-ins: Click multiple times

**Kiosk Mode:**
- Large, touch-friendly interface
- Perfect for children to use independently
- No navigation or settings visible

---

## Setting Goals

### Creating Goals

1. Click "Goals" in menu
2. Click "Create Goal"
3. Enter goal details:
   - **Name**: e.g., "Complete morning routine 5 days this week"
   - **Description**: Optional motivation
   - **Period**: Daily, Weekly, Monthly
   - **Target**: Numeric goal
4. Link tasks or routines to goal
5. Click "Create"

### Goal Progress

Goals automatically calculate progress based on:
- Task completions
- Routine completions
- Weighted contributions

View progress:
- Percentage complete
- Current vs. Target
- Status (Not Started, In Progress, Achieved)

### Goal Types

**Task-Linked Goal**
- Progress based on specific task completions
- Example: "Complete homework 20 times this month"

**Routine-Linked Goal**
- Progress based on routine completion
- Example: "Complete morning routine 25 days this month"

**Mixed Goal**
- Combines multiple tasks and routines
- Example: "Complete all responsibilities 80% of the time"

---

## Kiosk Mode

### What is Kiosk Mode?

Kiosk mode provides a child-friendly interface where children can complete their tasks independently without accessing settings or other accounts.

### Setting Up Kiosk Mode

1. Navigate to Kiosk section
2. Click "Generate Code"
3. Set expiration (default: 3 hours)
4. Share the code with your child
5. Child enters code at `/kiosk`

### Using Kiosk Mode

**For Parents:**
- Generate codes from your dashboard
- Codes expire automatically for security
- Monitor completion from your account

**For Children:**
1. Navigate to kiosk page
2. Enter code
3. Select your name
4. See your tasks for today
5. Tap to complete tasks
6. See completion animations

### Kiosk Security

- Codes expire after set time
- No access to settings or other accounts
- Session validated on every action
- Children cannot modify routines
- Parents can revoke codes anytime

---

## Sharing Features

### Co-Parent Sharing

Share routines with a co-parent:

1. Navigate to "Co-Parent" section
2. Click "Invite Co-Parent"
3. Enter co-parent's email
4. Select permissions:
   - **Read Only**: View only
   - **Task Completion**: View and complete tasks
   - **Full Edit**: View, edit, create
5. Select which children to share
6. Send invitation

**Co-Parent Receives:**
- Email with invitation link
- Access to shared children's routines
- Permissions you specified

### Co-Teacher Collaboration

Share classrooms with another teacher:

1. Navigate to "Co-Teacher" section
2. Click "Share Classroom"
3. Enter teacher's email
4. Select permissions
5. Select which groups to share
6. Send invitation

### Student-Parent Connection

Connect parents to your students:

1. Select a student
2. Click "Generate Connection Code"
3. Share 6-digit code with parent
4. Parent enters code in their account
5. Parent sees student's tasks
6. Parent can complete tasks (if you allow)

**Benefits:**
- Parents stay informed
- Home-school collaboration
- Consistent routines

---

## Analytics

### Analytics Dashboard

View comprehensive progress tracking:

**Completion Trends**
- Line chart showing completion rate over time
- Filter by person or date range
- Identify patterns and trends

**Goal Progress**
- Visual progress bars for all active goals
- Percentage complete
- Days remaining in goal period

**Task Heatmap**
- Calendar view of task completions
- Color-coded by completion frequency
- Identify consistent habits

### Exporting Data

Export your data for external analysis:

1. Navigate to Analytics
2. Select date range
3. Click "Export CSV"
4. Download file with completion data

**CSV includes:**
- Date
- Completions
- Total tasks
- Completion rate

---

## Marketplace

### Discovering Routines

Browse routines created by other users:

1. Navigate to Marketplace
2. Use search and filters:
   - Category (morning, homework, bedtime, etc.)
   - Age group
   - Tags
   - Rating
3. Click on routine to view details
4. Read description and see tasks included

### Forking Routines

"Fork" means to copy a routine to your account:

1. Find routine you like
2. Click "Fork to My Account"
3. Routine copied with all tasks
4. Customize as needed
5. Assign to your persons

**Benefits:**
- Save time creating routines
- Learn from experienced users
- Discover new ideas

### Publishing Routines

Share your routines with the community:

1. Create and test your routine
2. Click "Publish to Marketplace"
3. Set visibility (Public, Unlisted, Private)
4. Add category, age group, tags
5. Write helpful description
6. Click "Publish"

**Publishing Checklist:**
- Test routine thoroughly
- Write clear task names
- Add helpful description
- Select appropriate tags
- Set correct age group

### Rating & Reviews

Help others by rating routines:
- 5-star rating system
- Written comments (max 500 characters)
- Flag inappropriate content
- Author can respond to feedback

---

## Subscription Tiers

### Tier Comparison

| Feature | FREE | BASIC | PREMIUM | SCHOOL |
|---------|------|-------|---------|--------|
| **Price** | $0 | $5/mo | $10/mo | $25/mo |
| **Persons** | 3 | 10 | 50 | 500 |
| **Groups** | 0 | 3 | 10 | 50 |
| **Routines** | 10 | 50 | 200 | 1000 |
| **Tasks/Routine** | 10 | 20 | 50 | 100 |
| **Goals** | 3 | 10 | 50 | 200 |
| **Kiosk Codes** | 1 | 5 | 20 | 100 |
| **Analytics** | Basic | Advanced | Advanced | Advanced |
| **Marketplace** | ✓ | ✓ | ✓ | ✓ |
| **Co-Parent Sharing** | ✓ | ✓ | ✓ | ✓ |
| **Export Data** | - | ✓ | ✓ | ✓ |
| **Priority Support** | - | - | ✓ | ✓ |

### Upgrading Your Tier

1. Navigate to Settings
2. Click "Upgrade Subscription"
3. Choose tier (BASIC, PREMIUM, or SCHOOL)
4. Enter payment information
5. Confirm subscription

**Stripe Secure Checkout:**
- PCI-compliant payment processing
- Supports all major credit cards
- Automatic renewal
- Cancel anytime

### Managing Subscription

Access billing portal:
1. Navigate to Settings
2. Click "Manage Subscription"
3. Update payment method
4. View invoices
5. Cancel subscription

**Cancellation:**
- Access continues until end of billing period
- No refunds for partial months
- Can reactivate anytime

---

## Admin Panel

### What is the Admin Panel?

The admin panel is a comprehensive management interface for system administrators. It provides tools to manage users, configure system settings, and monitor activity.

**Access:** Only available to users with administrator privileges

### Becoming an Administrator

Administrators must be manually promoted by the system owner or another administrator.

**For System Owners (First Admin):**

1. Register a regular user account
2. Verify your email
3. Run the admin promotion script:
   ```bash
   npx tsx scripts/create-admin-user.ts your-email@example.com
   ```
4. Log in and navigate to `/admin`

**For Subsequent Admins:**

Existing administrators can promote other users:
1. Admin logs into admin panel
2. Navigate to User Management
3. Search for user
4. Click "Manage" → "Grant Admin Access"

### Admin Panel Features

#### Admin Dashboard (`/admin`)

Central overview showing:
- **System Statistics**: Total users, verified users, admins, roles
- **Tier Distribution**: Visual breakdown of subscription tiers
- **Recent Activity**: Last 10 administrative actions
- **Activity Metrics**: 30-day summary of admin actions
- **Quick Navigation**: Links to all admin sections

#### User Management (`/admin/users`)

Comprehensive user administration:

**Search & Filter**
- Search by email (case-insensitive)
- Filter by tier (FREE, BASIC, PREMIUM, SCHOOL)
- Filter by admin status

**User Actions**
- View detailed user information
- View all roles and statistics
- Grant administrator privileges
- Revoke administrator privileges
- Change user subscription tier
- Delete user accounts (non-admin only)

**User Details Include:**
- Email and verification status
- All roles (Parent, Teacher)
- Subscription tier
- Join date
- Total persons, groups, routines, goals

**Tier Management Per User**
- Change user's tier instantly
- Set custom tier limits (override defaults)
- Remove custom overrides

#### Tier Configuration (`/admin/tiers`)

Configure system-wide subscription limits:

**System Tier Limits**

Edit limits for each tier:
- Persons allowed
- Groups allowed
- Routines allowed
- Tasks per routine
- Goals allowed
- Kiosk codes allowed

Changes apply to all users on that tier (unless they have custom overrides).

**Tier Pricing**

Set monthly subscription prices:
- BASIC tier price (default: $5.00)
- PREMIUM tier price (default: $10.00)
- SCHOOL tier price (default: $25.00)

Prices shown in cents, converted to dollars.

**User Tier Overrides**

Set custom limits for specific users:
1. Navigate to User Management
2. Select user and role
3. Click "Manage Tier"
4. Enter custom limits
5. Save override

User's custom limits override system defaults.

#### System Settings (`/admin/settings`)

View and manage application configuration:

**General Settings**
- Maintenance mode toggle
- Registration enabled/disabled
- Application-wide announcements

**Tier Settings**
- View current tier limits
- View current tier prices

**Feature Settings**
- Marketplace enabled/disabled
- Analytics features
- Sharing features

**Security Settings**
- Maximum login attempts
- Session timeout duration
- Password requirements

Settings organized by category for easy navigation.

#### Audit Log (`/admin/audit`)

Complete trail of all administrative actions:

**Audit Information Captured**
- Action type (USER_ADMIN_GRANTED, TIER_CHANGED, etc.)
- Admin user who performed action
- Target entity (User, Role, SystemSettings)
- Before/after changes (JSON format)
- Timestamp
- IP address (optional)
- User agent (optional)

**Filtering Options**
- Filter by action type
- Filter by entity type
- Filter by date range
- Filter by admin user

**Compliance**
- Permanent record of changes
- Cannot be deleted or modified
- Suitable for compliance reporting
- Export capabilities

### Admin Security

**Access Control**
- Only users with `isAdmin = true` can access
- Verified on every request (server-side)
- Cannot be bypassed with URL manipulation

**Self-Protection**
- Admins cannot revoke their own admin access
- Prevents accidental lockout

**Admin Protection**
- Cannot delete users who have admin privileges
- Must revoke admin first, then delete

**Audit Trail**
- Every action logged automatically
- Includes who, what, when, and why
- Immutable record

**Authorization**
- All admin endpoints require admin verification
- Separate from regular user authorization
- Type-safe with TypeScript and Zod

### Admin Best Practices

**User Management**
1. Regularly review user list for inactive accounts
2. Monitor tier distribution for business insights
3. Use custom tier overrides sparingly
4. Document reason for admin access grants

**Tier Configuration**
1. Test tier limit changes on test account first
2. Announce pricing changes in advance
3. Consider grandfather clauses for existing users
4. Monitor impact on user experience

**System Settings**
1. Enable maintenance mode before updates
2. Keep security settings strict
3. Regular review of feature flags
4. Document all setting changes

**Audit Logging**
1. Review audit logs weekly
2. Look for suspicious patterns
3. Export logs for compliance
4. Archive old logs periodically

### Common Admin Tasks

**Promoting a User to Admin**
1. Navigate to `/admin/users`
2. Search for user by email
3. Click "Manage" button
4. Click "Grant Admin Access"
5. Confirm action
6. Verify audit log entry created

**Changing User Tier**
1. Navigate to `/admin/users`
2. Find user and click "Manage"
3. Select role
4. Click "Change Tier"
5. Select new tier
6. Confirm change
7. Notify user of change

**Setting Custom Limits**
1. Navigate to `/admin/users`
2. Find user and click "Manage"
3. Select role
4. Click "Set Tier Override"
5. Enter custom limits
6. Save override
7. User immediately has new limits

**Reviewing System Activity**
1. Navigate to `/admin/audit`
2. Set date range (last 30 days)
3. Filter by action type if needed
4. Review each entry
5. Export if needed for reporting

**Configuring Tier Limits**
1. Navigate to `/admin/tiers`
2. Review current limits
3. Modify values as needed
4. Click "Save Changes"
5. Verify persistence by refreshing
6. Check audit log for record

---

## Troubleshooting

### Common Issues

**Cannot Access Admin Panel**
- Verify you have admin privileges (`isAdmin = true`)
- Log out and log back in
- Clear browser cache
- Contact system administrator

**Tier Limits Not Applying**
- Check for custom tier overrides
- Verify system settings correct
- Clear application cache
- Restart application

**Tasks Not Saving**
- Check internet connection
- Verify not exceeding tier limits
- Check browser console for errors
- Try different browser

**Kiosk Code Not Working**
- Verify code not expired
- Check code entered correctly
- Generate new code if needed
- Verify kiosk mode enabled

**Sharing Invitations Not Received**
- Check spam/junk folder
- Verify email address correct
- Check email service status
- Resend invitation

---

## Support

### Getting Help

**Documentation**
- [Setup Guide](SETUP.md)
- [Admin Panel Guide](ADMIN_PANEL.md)
- [Project Context](PROJECT-CONTEXT.md)

**Community**
- GitHub Issues: Report bugs and feature requests
- Discussions: Ask questions and share ideas

**Contact**
- Email: support@rubyroutines.com
- Response time: 24-48 hours

---

## Privacy & Security

### Data Protection

- All passwords hashed with bcrypt
- Verification codes hashed
- Sensitive data encrypted at rest
- SSL/TLS for all connections

### Privacy

- Your data is private by default
- Only shared when you explicitly share
- No data sold to third parties
- GDPR and COPPA compliant

### Security Features

- Email verification required
- Session-based authentication
- Authorization checks on every request
- Row-level security in database
- Rate limiting on auth endpoints
- Audit logging for admin actions

---

## Tips for Success

### For Parents

1. **Start Small**: Begin with one simple routine
2. **Be Consistent**: Use the same routine daily
3. **Involve Children**: Let them help create tasks
4. **Use Kiosk Mode**: Let children complete independently
5. **Celebrate Progress**: Focus on consistency, not perfection

### For Teachers

1. **Classroom Routines**: Create clear, step-by-step routines
2. **Student Codes**: Generate codes for parent connection
3. **Co-Teacher Sharing**: Collaborate with other teachers
4. **Group Assignments**: Use groups for efficient management
5. **Track Progress**: Use analytics to identify patterns

### For Admins

1. **Security First**: Regularly review audit logs
2. **Monitor Usage**: Watch tier distribution and growth
3. **Be Responsive**: Address user issues promptly
4. **Document Changes**: Keep record of major changes
5. **Test First**: Test tier changes on test accounts

---

## Glossary

**Person**: A child (for parents) or student (for teachers)
**Group**: A collection of persons (e.g., classroom)
**Routine**: A set of tasks completed on a schedule
**Task**: An individual action to complete
**Goal**: A measurable target linked to tasks/routines
**Kiosk Mode**: Child-friendly interface for task completion
**Tier**: Subscription level (FREE, BASIC, PREMIUM, SCHOOL)
**Fork**: Copy a marketplace routine to your account
**Co-Parent**: Another parent with shared access
**Co-Teacher**: Another teacher with shared classroom access
**Admin**: System administrator with management privileges
**Audit Log**: Record of all administrative actions

---

**Version:** 1.0
**Last Updated:** 2025-11-13
**For Additional Help:** See [ADMIN_PANEL.md](ADMIN_PANEL.md) for detailed admin documentation
