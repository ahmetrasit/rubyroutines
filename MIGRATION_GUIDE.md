# Database Migration Guide

## Problem
Your database is empty and needs the full schema. The `personId` migration alone won't work because the `Code` table doesn't exist yet.

## Solutions (Choose One)

### Option 1: Run Migrations in Production/Deployment Environment (RECOMMENDED)
If you're deploying to a service like Vercel, Railway, Render, etc., run this in your deployment environment:

```bash
npx prisma migrate deploy
```

This will apply ALL migrations in order, creating all tables including the new `personId` field.

### Option 2: Using Prisma Studio (if available)
```bash
npx prisma studio
```

Then use the UI to apply migrations.

### Option 3: Generate and Apply Complete Schema
If Prisma CLI isn't available anywhere, you can:

1. **In a local environment with internet access**, run:
   ```bash
   npx prisma migrate dev --create-only
   npx prisma db push
   ```

2. **Export the schema**:
   ```bash
   pg_dump $DATABASE_URL --schema-only > complete_schema.sql
   ```

3. **Apply to your database**:
   ```bash
   psql $DATABASE_URL < complete_schema.sql
   ```

### Option 4: Manual SQL Execution
Run all migration files in order:

1. First, check what migrations exist:
   ```bash
   ls -la prisma/migrations/
   ```

2. Apply each migration's SQL file in chronological order:
   ```bash
   psql $DATABASE_URL < prisma/migrations/20250113_add_two_factor/migration.sql
   psql $DATABASE_URL < prisma/migrations/add_admin_panel/migration.sql
   # ... etc for all migrations
   ```

3. Finally, apply the personId migration:
   ```bash
   psql $DATABASE_URL < prisma/migrations/add_person_id_to_code/migration.sql
   ```

## Quick Check
To verify your database is working:

```bash
# Check if tables exist
psql $DATABASE_URL -c "\dt"

# If tables exist, check for Code table
psql $DATABASE_URL -c "\d Code"
```

## Development vs Production
- **Development**: Use `npx prisma migrate dev`
- **Production**: Use `npx prisma migrate deploy`
- **Emergency/No CLI**: Use manual SQL from migration files

## Need Help?
If you're still stuck, provide:
1. Your deployment platform (Vercel, Railway, local, etc.)
2. Output of: `echo $DATABASE_URL` (redact password)
3. Whether you can run Prisma commands in your deployment environment
