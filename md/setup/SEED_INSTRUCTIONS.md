# Database Seed Instructions

This guide explains how to reset and seed your database with test data for development and testing.

---

## Prerequisites

Before running the seed script, ensure you have:

1. **Environment variables configured** (`.env.local`)
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Important: Service role key required**

2. **Prisma client generated**
   ```bash
   npx prisma generate
   ```

3. **Database migrations applied**
   ```bash
   npx prisma migrate deploy
   # OR
   npx prisma db push
   ```

---

## Running the Seed Script

### Method 1: NPM Script (Recommended)
```bash
npm run db:seed
```

### Method 2: Direct Execution
```bash
npx tsx prisma/seed.ts
```

---

## What the Seed Script Does

### 1. **Cleanup** 🧹
Deletes ALL existing data from:
- Task completions
- Tasks
- Routines
- Goals
- Persons
- Groups
- Codes
- Invitations
- Co-parent/co-teacher relationships
- Student-parent connections
- Schools
- Marketplace items
- Audit logs
- Verification codes
- Roles
- Users

**⚠️ WARNING: This is destructive! Use only in development.**

### 2. **Creates Test Users** 👤

| Email | Password | Role | Admin |
|-------|----------|------|-------|
| parent@test.com | TestPass123! | PARENT | No |
| teacher@test.com | TestPass123! | TEACHER | No |
| admin@test.com | AdminPass123! | - | Yes |

**All users:**
- Email verified by default
- Created in both Supabase Auth and PostgreSQL database
- Premium tier

### 3. **Creates Persons** 👶

**For Parent Role:**
- **Emma** (age 7, 🦄)
  - Has a 30-day task completion streak
  - Will unlock multiple achievements
- **Lucas** (age 5, 🚀)
  - Has a 7-day task completion streak

**For Teacher Role:**
- **Sophie** (age 8, 🌸)
- **Oliver** (age 7, ⚽)

### 4. **Creates Routines** 📋

1. **Morning Routine** (Parent)
   - Icon: 🌅
   - Schedule: Weekdays at 7:00 AM
   - 5 tasks: Wake up, Brush teeth, Get dressed, Eat breakfast, Pack backpack

2. **Bedtime Routine** (Parent)
   - Icon: 🌙
   - Schedule: Every day at 8:00 PM
   - 6 tasks: Put away toys, Bath, Brush teeth, Pajamas, Story, Lights out

3. **Classroom Setup** (Teacher)
   - Icon: 📚
   - Schedule: Weekdays at 8:00 AM
   - 4 tasks: Unlock, Lights, Whiteboard, Materials

### 5. **Creates Task Completions** 📊

**Emma's Completions:**
- 93 total completions (3 tasks × 31 days)
- 30-day streak
- Will unlock achievements:
  - ✅ First Task
  - ✅ Getting Started (3-day streak)
  - ✅ Week Warrior (7-day streak)
  - ✅ Two Week Champion (14-day streak)
  - ✅ Monthly Master (30-day streak)
  - ✅ First Steps (10 tasks)
  - ✅ Task Tackler (50 tasks)

**Lucas's Completions:**
- 16 total completions (2 tasks × 8 days)
- 7-day streak
- Will unlock achievements:
  - ✅ First Task
  - ✅ Getting Started (3-day streak)
  - ✅ Week Warrior (7-day streak)
  - ✅ First Steps (10 tasks)

### 6. **Creates Kiosk Code** 🔐

- **Code:** `1234`
- **Type:** PARENT_CHILD
- **Expires:** 1 year from seed
- **Max uses:** Unlimited

### 7. **Creates Audit Logs** 📝

- Sample login events for parent and teacher users
- Demonstrates audit trail functionality

---

## Post-Seed Testing

After seeding, you can test:

### Authentication
```bash
# Login with any test user
Email: parent@test.com
Password: TestPass123!
```

### Kiosk Mode
1. Navigate to kiosk mode
2. Enter code: `1234`
3. Should see Emma and Lucas

### Streaks & Achievements
1. Login as parent@test.com
2. View Emma's profile
3. Should see 30-day streak
4. Check achievements - multiple should be unlocked

### Real-time Updates
1. Open app in two browser windows
2. Login as parent@test.com in both
3. Complete a task in one window
4. Should see update in other window (if realtime enabled)

### Accessibility
1. Press Tab key - should see skip navigation link
2. Test keyboard navigation throughout app
3. All interactive elements should have ARIA labels

### 2FA Setup
1. Login as parent@test.com
2. Navigate to Settings → Security
3. Set up 2FA (requires packages installed)

---

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY not found"
- Ensure `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- Get it from Supabase Dashboard → Settings → API → service_role key
- **⚠️ Keep this secret! Never commit to git**

### "Failed to create auth user"
- Check Supabase project is accessible
- Verify SUPABASE_URL and SERVICE_ROLE_KEY are correct
- Ensure email confirmation is disabled in Supabase Auth settings (or users will need to confirm)

### "Unique constraint violation"
- Database might have existing data with same IDs
- Try manually deleting users from Supabase Auth dashboard
- Or use a fresh database

### "Cannot find module @prisma/client"
Run:
```bash
npx prisma generate
```

### Seed succeeds but can't login
- Check that Supabase Auth users were created
- Go to Supabase Dashboard → Authentication → Users
- Should see 3 users (parent, teacher, admin)
- If not, there was an error during auth creation

---

## Resetting for Fresh Start

```bash
# 1. Drop and recreate database (PostgreSQL)
psql -c "DROP DATABASE rubyroutines;"
psql -c "CREATE DATABASE rubyroutines;"

# 2. Apply migrations
npx prisma migrate deploy

# 3. Generate Prisma client
npx prisma generate

# 4. Delete Supabase Auth users manually
# Go to: Supabase Dashboard → Authentication → Users
# Delete all test users

# 5. Run seed
npm run db:seed
```

---

## Production Warning ⚠️

**NEVER run this seed script in production!**

It will:
- Delete all user data
- Delete all routines and tasks
- Delete all completions and progress
- Delete all audit logs

Add safeguards in production:
```typescript
if (process.env.NODE_ENV === 'production') {
  throw new Error('Cannot run seed in production!');
}
```

---

## Customizing Seed Data

Edit `prisma/seed.ts` to:

1. **Add more users:**
   ```typescript
   testUsers.push({
     email: 'myuser@test.com',
     password: 'MyPass123!',
     name: 'My Test User',
   });
   ```

2. **Add more persons:**
   ```typescript
   await prisma.person.create({
     data: {
       roleId: parentRole.id,
       name: 'Your Name',
       // ...
     },
   });
   ```

3. **Add more routines/tasks:**
   ```typescript
   const myRoutine = await prisma.routine.create({
     data: {
       roleId: parentRole.id,
       name: 'My Custom Routine',
       // ...
     },
   });
   ```

4. **Adjust streak lengths:**
   ```typescript
   // Change from 30 to any number
   for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
   ```

---

## Related Commands

```bash
# View database in GUI
npm run db:studio

# Apply new migrations
npm run db:migrate

# Push schema changes without migration
npm run db:push

# Generate Prisma client
npm run db:generate

# Reset database (destructive!)
npx prisma migrate reset
```

---

## Need Help?

- Check Prisma logs for detailed errors
- Verify all environment variables are set
- Ensure database is accessible
- Check Supabase project status
- Review seed script output for specific errors

---

**Happy Testing!** 🎉
