# Database Migration Guide

**Last Updated:** November 15, 2024
**Status:** ✅ Clean baseline established

## Current State

The database migration history has been **reset and consolidated** into a single baseline migration:

```
prisma/migrations/
└── 0_init/
    └── migration.sql  (Complete schema baseline)
```

**Migration Status:** Database schema is up to date ✅

---

## For Team Members: Syncing This Branch

If you're pulling the `claude/ruby-routines-task-features-01TtqNxUSX3NjFyLQHZNhzH4` branch, follow these steps:

### Step 1: Pull the Latest Changes
```bash
git pull origin claude/ruby-routines-task-features-01TtqNxUSX3NjFyLQHZNhzH4
```

### Step 2: Reset Your Development Database
```bash
# This will drop your local DB and apply the clean baseline
npx prisma migrate reset --force --skip-seed

# Or if you prefer the two-step approach:
npx prisma db push --force-reset
npx prisma migrate resolve --applied 0_init
```

### Step 3: Verify Everything is In Sync
```bash
npx prisma migrate status
# Should show: "Database schema is up to date!"
```

### Step 4: Regenerate Prisma Client
```bash
npx prisma generate
```

**⚠️ Warning:** This will **delete all data** in your development database. Make sure to backup any test data you need.

---

## Migration Best Practices

### 1. Creating New Migrations

When you need to modify the database schema:

```bash
# 1. Edit prisma/schema.prisma with your changes

# 2. Create and apply the migration
npx prisma migrate dev --name descriptive_feature_name

# 3. Test that it worked
npm run dev  # or your dev server command

# 4. Commit both schema and migration files
git add prisma/
git commit -m "feat: add descriptive_feature_name to schema"
git push
```

**Naming Conventions:**
- `add_user_preferences` - Adding new functionality
- `fix_role_relationship` - Fixing issues
- `update_task_schema` - Updating existing structures
- `remove_deprecated_fields` - Removing old code

### 2. NEVER Delete Applied Migrations

❌ **Don't do this:**
```bash
rm -rf prisma/migrations/20241115_some_migration/
git commit -m "removing old migration"
```

✅ **Do this instead:**
```bash
# Create a new migration that reverses the changes
npx prisma migrate dev --name revert_some_feature
```

**Why?** Once a migration is applied to ANY environment (dev, staging, production), deleting it causes migration history mismatches.

### 3. Environment-Specific Commands

| Environment | Command | When to Use |
|------------|---------|-------------|
| **Development** | `npx prisma migrate dev` | Creating and applying new migrations |
| **Development** | `npx prisma db push` | Quick prototyping (doesn't create migrations) |
| **Production/Staging** | `npx prisma migrate deploy` | Deploying existing migrations only |
| **Emergency Reset** | `npx prisma migrate reset` | ⚠️ DEV ONLY - Drops entire database |

### 4. Before Pushing to Main Branch

Always validate your migrations:

```bash
# Validate schema syntax
npx prisma validate

# Check migration status
npx prisma migrate status

# Ensure no uncommitted changes
git status

# Run tests if available
npm test
```

### 5. Handling Migration Conflicts

If you encounter migration conflicts when pulling:

**Scenario 1: Local changes conflict with remote**
```bash
# Stash your schema changes
git stash

# Pull the latest
git pull

# Reset your dev database
npx prisma migrate reset --force --skip-seed

# Reapply your stashed changes
git stash pop

# Create a new migration with your changes
npx prisma migrate dev --name your_feature_name
```

**Scenario 2: Migration history mismatch**
```bash
# Check what's out of sync
npx prisma migrate status

# If migrations are missing locally, pull them
git pull

# If database has migrations that don't exist locally, reset dev DB
npx prisma migrate reset --force --skip-seed
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations tested in development
- [ ] Migrations tested in staging environment
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Downtime window communicated (if needed)

### Deployment Commands

```bash
# 1. Backup production database
# (Use your hosting provider's backup tools)

# 2. Deploy migrations (DO NOT use migrate reset!)
npx prisma migrate deploy

# 3. Verify deployment
npx prisma migrate status

# 4. Generate Prisma Client (if not done in build step)
npx prisma generate
```

### Rollback Plan

If a migration fails in production:

```bash
# 1. Mark the failed migration as rolled back
npx prisma migrate resolve --rolled-back migration_name

# 2. Restore database from backup if needed

# 3. Fix the migration locally and redeploy
```

---

## Common Issues & Solutions

### Issue 1: "Migration history mismatch"

**Symptom:**
```
The migrations from the database are not found locally in prisma/migrations
```

**Solution (Development Only):**
```bash
npx prisma migrate reset --force --skip-seed
```

### Issue 2: "Relation does not exist"

**Symptom:**
```
ERROR: relation "users" does not exist
```

**Solution:**
```bash
# Database is empty or partially migrated
npx prisma migrate deploy  # Production
# OR
npx prisma migrate reset --force  # Development
```

### Issue 3: "Table already exists"

**Symptom:**
```
ERROR: relation "users" already exists
```

**Solution:**
```bash
# Migration was partially applied
npx prisma migrate resolve --applied migration_name
```

### Issue 4: Prisma Client type errors after migration

**Symptom:**
```typescript
Property 'newField' does not exist on type 'User'
```

**Solution:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart your dev server
npm run dev
```

---

## What Happened: Migration Reset Explanation

### Why We Reset Migrations

The repository had accumulated migration files that were:
- Deleted but still recorded in the database
- Using incorrect table names (PascalCase vs snake_case)
- Causing migration history conflicts

### What We Did

1. **Fixed table naming issues** in migrations
2. **Reset the database** using `npx prisma db push --force-reset`
3. **Created a clean baseline** migration (`0_init`)
4. **Marked baseline as applied** to sync database state
5. **Committed and pushed** the clean migration history

### Benefits of This Approach

✅ Clean migration history
✅ No orphaned migrations
✅ Consistent state between schema and database
✅ Fresh starting point for future migrations
✅ Easier to understand schema evolution

---

## Quick Reference

### Daily Development Workflow

```bash
# Start work
git pull
npx prisma migrate dev  # if schema changes

# Make changes to schema
# Edit prisma/schema.prisma

# Create migration
npx prisma migrate dev --name my_feature

# Test
npm run dev

# Commit
git add prisma/
git commit -m "feat: add my_feature to schema"
git push
```

### Emergency Commands (Development Only)

```bash
# Nuclear option: Reset everything
npx prisma migrate reset --force --skip-seed

# Push schema without creating migration (prototyping)
npx prisma db push

# Resolve stuck migration
npx prisma migrate resolve --applied migration_name
npx prisma migrate resolve --rolled-back migration_name
```

### Validation Commands

```bash
# Check schema is valid
npx prisma validate

# Check migration status
npx prisma migrate status

# View database in browser
npx prisma studio
```

---

## Additional Resources

- [Prisma Migration Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Troubleshooting Guide](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

---

## Need Help?

If you encounter migration issues:

1. **Check migration status:**
   ```bash
   npx prisma migrate status
   ```

2. **Verify your schema:**
   ```bash
   npx prisma validate
   ```

3. **Check the database:**
   ```bash
   npx prisma studio
   ```

4. **Provide context when asking for help:**
   - Environment (dev/staging/production)
   - Error messages
   - Output of `npx prisma migrate status`
   - Recent schema changes

---

**Remember:** In development, don't be afraid to reset. In production, be very careful!
