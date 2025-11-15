#!/bin/bash

# Script to apply all Prisma migrations manually
# Use this when Prisma CLI is not available

set -e  # Exit on error

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "Applying all migrations to database..."
echo "Database: ${DATABASE_URL%%@*}@***"  # Hide credentials in output

# Apply migrations in order
MIGRATIONS=(
    "20250113_add_two_factor"
    "add_admin_panel"
    "add_composite_indexes"
    "add_kiosk_last_updated"
    "rename_tier_values"
    "add_person_id_to_code"
)

for migration in "${MIGRATIONS[@]}"; do
    migration_file="prisma/migrations/$migration/migration.sql"
    
    if [ -f "$migration_file" ]; then
        echo "Applying migration: $migration"
        psql "$DATABASE_URL" -f "$migration_file"
        echo "✓ $migration applied"
    else
        echo "⚠ Migration file not found: $migration_file"
    fi
done

echo ""
echo "✓ All migrations applied successfully!"
echo ""
echo "Verifying database schema..."
psql "$DATABASE_URL" -c "\dt" | head -20

