#!/bin/bash

# Script to apply all Prisma migrations manually
# Use this when Prisma CLI is not available

set -e  # Exit on error

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in .env file or as an environment variable"
    exit 1
fi

# Find psql command (handle both standard install and Homebrew on macOS)
PSQL_CMD=""
if command -v psql &> /dev/null; then
    PSQL_CMD="psql"
elif [ -f "/opt/homebrew/bin/psql" ]; then
    # Apple Silicon Mac (M1/M2)
    PSQL_CMD="/opt/homebrew/bin/psql"
elif [ -f "/usr/local/bin/psql" ]; then
    # Intel Mac
    PSQL_CMD="/usr/local/bin/psql"
else
    echo "ERROR: psql command not found"
    echo ""
    echo "Tried the following locations:"
    echo "  - psql (in PATH)"
    echo "  - /opt/homebrew/bin/psql (Apple Silicon)"
    echo "  - /usr/local/bin/psql (Intel Mac)"
    echo ""
    echo "Please install PostgreSQL:"
    echo "  brew install postgresql@15"
    echo ""
    echo "Or add psql to your PATH:"
    echo "  export PATH=\"/opt/homebrew/opt/postgresql@15/bin:\$PATH\""
    exit 1
fi

echo "Using psql: $PSQL_CMD"

# Clean DATABASE_URL by removing Supabase-specific query parameters
# psql doesn't recognize parameters like ?pgbouncer=true
CLEAN_DATABASE_URL="${DATABASE_URL%%\?*}"
if [[ "$DATABASE_URL" == *"?"* ]]; then
    echo "Note: Removed query parameters from DATABASE_URL (not supported by psql)"
fi

echo "Applying all migrations to database..."
echo "Database: ${CLEAN_DATABASE_URL%%@*}@***"  # Hide credentials in output

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
        $PSQL_CMD "$CLEAN_DATABASE_URL" -f "$migration_file"
        echo "✓ $migration applied"
    else
        echo "⚠ Migration file not found: $migration_file"
    fi
done

echo ""
echo "✓ All migrations applied successfully!"
echo ""
echo "Verifying database schema..."
$PSQL_CMD "$CLEAN_DATABASE_URL" -c "\dt" | head -20

