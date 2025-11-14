#!/bin/bash
# Script to migrate tier enum values from BASIC/PREMIUM/SCHOOL to BRONZE/GOLD/PRO

set -e

echo "🔄 Running tier migration..."
echo "This will rename:"
echo "  BASIC → BRONZE"
echo "  PREMIUM → GOLD"
echo "  SCHOOL → PRO"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "Please set DATABASE_URL and try again"
  exit 1
fi

# Run the migration
echo "📦 Executing migration SQL..."
psql "$DATABASE_URL" -f prisma/migrations/rename_tier_values/migration.sql

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "📊 Current tier distribution:"
psql "$DATABASE_URL" -c "SELECT tier, COUNT(*) as count FROM roles GROUP BY tier ORDER BY tier;"
