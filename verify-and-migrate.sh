#!/bin/bash

# Comprehensive migration script with detailed error checking

set +e  # Don't exit on error - we want to see all errors

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Find psql command
PSQL_CMD=""
if command -v psql &> /dev/null; then
    PSQL_CMD="psql"
elif [ -f "/opt/homebrew/bin/psql" ]; then
    PSQL_CMD="/opt/homebrew/bin/psql"
elif [ -f "/usr/local/bin/psql" ]; then
    PSQL_CMD="/usr/local/bin/psql"
else
    echo "ERROR: psql command not found"
    exit 1
fi

# Clean DATABASE_URL
CLEAN_DATABASE_URL="${DATABASE_URL%%\?*}"

echo "================================================"
echo "Database Migration Verification Script"
echo "================================================"
echo ""

# Check if personId column exists
echo "Checking if personId column exists in Code table..."
COLUMN_EXISTS=$($PSQL_CMD "$CLEAN_DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'Code' AND column_name = 'personId';")

if [ -z "$COLUMN_EXISTS" ]; then
    echo "❌ personId column does NOT exist"
    echo ""
    echo "Applying migration to add personId column..."

    $PSQL_CMD "$CLEAN_DATABASE_URL" << 'EOF'
-- Add personId column to Code table
ALTER TABLE "Code" ADD COLUMN IF NOT EXISTS "personId" TEXT;

-- Create index
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'Code'
        AND indexname = 'Code_personId_idx'
    ) THEN
        CREATE INDEX "Code_personId_idx" ON "Code"("personId");
    END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Code_personId_fkey'
    ) THEN
        ALTER TABLE "Code"
        ADD CONSTRAINT "Code_personId_fkey"
        FOREIGN KEY ("personId")
        REFERENCES "Person"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;
EOF

    if [ $? -eq 0 ]; then
        echo "✅ Migration applied successfully"
    else
        echo "❌ Migration failed"
        exit 1
    fi
else
    echo "✅ personId column already exists"
fi

echo ""
echo "================================================"
echo "Verification"
echo "================================================"
echo ""

# Verify the schema
echo "Code table structure:"
$PSQL_CMD "$CLEAN_DATABASE_URL" -c "\d Code"

echo ""
echo "================================================"
echo "✅ Migration complete!"
echo "================================================"
