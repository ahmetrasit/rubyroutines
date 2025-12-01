# Quick Start Guide - Testing the Application

## ✅ Authentication System - FIXED!

The authentication system has been completely overhauled with critical fixes:

### What Was Fixed:

1. **Added Middleware** (`middleware.ts`) - CRITICAL
   - Automatically manages Supabase session cookies
   - Refreshes expired tokens
   - Protects routes (/dashboard, /parent, /teacher)
   - Now follows industry best practices

2. **Fixed Cookie Handling** (`lib/supabase/server.ts`)
   - Corrected cookie set/delete methods
   - Session cookies now properly persist

3. **Complete Auth Documentation** (`docs/AUTH_SETUP.md`)
   - Architecture overview
   - Security best practices
   - Troubleshooting guide

## 🚀 Quick Setup (2 Options)

### Option A: Use Signup Page (Recommended)

This is the easiest way to get started:

1. Start the dev server (if not already running):
   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:3000/signup

3. Create a new account:
   - Email: `parent@test.com`
   - Password: `parent123` (or any password you like)
   - Name: `Test Parent`

4. After signup, you'll be auto-logged in and redirected to `/dashboard`

5. Run the database seed to create test data:
   ```bash
   npm run db:seed
   ```

6. Navigate to: http://localhost:3000/parent to see your children and routines!

### Option B: Use Test User Script (Advanced)

If you need the exact test users from the seed:

1. Ensure you have `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

2. Run the script:
   ```bash
   npx tsx scripts/create-test-users.ts
   ```

3. Run the database seed:
   ```bash
   npm run db:seed
   ```

4. Login with:
   - Email: `parent@test.com`
   - Password: `parent123`

## 🎯 What You Can Test Now

### Parent Features:
1. **Login**: http://localhost:3000/login
2. **Dashboard**: http://localhost:3000/dashboard
3. **Parent View**: http://localhost:3000/parent
   - View your children
   - Click a child to see their routines
4. **Routine Management**:
   - Click a routine to see tasks
   - Add/edit/delete tasks
   - Complete tasks (watch the undo timer!)
5. **Person Management**:
   - Add new children
   - Edit child details
   - Archive/restore children

### Task Features (✨ NEW):
1. **Simple Tasks**:
   - Mark done once per period
   - 5-minute undo window with countdown timer

2. **Multiple Check-in Tasks**:
   - Complete multiple times
   - Track completion count

3. **Progress Tasks**:
   - Enter values with units (pages, minutes, etc.)
   - Visual progress bar
   - Track totals

4. **Task Management**:
   - Reorder with up/down arrows
   - Edit task details
   - Archive tasks

## 📝 Test Data

After running `npm run db:seed`, you'll have:

- **2 children**: Emma Johnson (age ~7), Liam Johnson (age ~5)
- **1 family group**: Johnson Family
- **1 morning routine**: With 4 tasks (Brush Teeth, Get Dressed, Eat Breakfast, Pack Backpack)
- **1 goal**: Complete Morning Routine 7 Days

## 🔒 Login Credentials

If using Option B (test user script):

| Role      | Email                | Password      |
|-----------|---------------------|---------------|
| Parent    | parent@test.com     | parent123     |
| Teacher   | teacher@test.com    | teacher123    |
| Principal | principal@test.com  | principal123  |

If using Option A (signup):
- Use whatever credentials you created during signup

## ✅ Expected Behavior

1. **Before Login**:
   - Accessing `/dashboard` or `/parent` → Redirects to `/login`

2. **After Login**:
   - Accessing `/login` or `/signup` → Redirects to `/dashboard`
   - Can access `/parent` to see children and routines
   - Session persists across page refreshes
   - Auto-redirect on protected routes

3. **After Logout**:
   - Redirected to `/login`
   - Cannot access protected routes

## 🐛 Troubleshooting

### "Invalid credentials" error
→ The user doesn't exist in Supabase Auth. Use Option A (signup) to create the user.

### Still can't login after signup
→ Try these steps:
1. Clear browser cookies and localStorage
2. Restart the dev server
3. Try signing up with a new email
4. Check browser console for errors

### Session not persisting
→ The middleware should fix this. If still happening:
1. Verify `middleware.ts` exists at project root
2. Restart dev server
3. Clear cookies and try again

### Database seed fails
→ Make sure you created a user in Supabase Auth first (via signup or script)

## 📚 Next Steps

1. Test the complete flow: Signup → Create child → Create routine → Add tasks → Complete tasks
2. Try all three task types
3. Test the undo functionality (you have 5 minutes!)
4. Explore person management (archive/restore)
5. Test task reordering

## 🎉 What's Working Now

✅ Full authentication with session management
✅ Person management (CRUD)
✅ Routine management (CRUD)
✅ Task management (CRUD)
✅ Task completion tracking
✅ Three task types (Simple, Multiple Check-in, Progress)
✅ Undo functionality with countdown
✅ Protected routes
✅ Auto-redirects
✅ Session persistence

## 📖 Full Documentation

See `docs/AUTH_SETUP.md` for complete auth documentation including:
- Architecture diagrams
- Security best practices
- API endpoint details
- Advanced troubleshooting
