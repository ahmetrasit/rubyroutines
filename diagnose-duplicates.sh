#!/bin/bash

# Diagnostic script to find duplicate columns (camelCase + snake_case)

set +e  # Don't exit on error

# Load environment variables from .env file
if [ -f .env ]; then
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
echo "Database Column Duplicate Diagnostic"
echo "================================================"
echo ""

# Check for duplicate columns (camelCase + snake_case)
echo "Checking for duplicate column patterns..."
echo ""

$PSQL_CMD "$CLEAN_DATABASE_URL" << 'EOF'
-- Find tables with potential duplicate columns
WITH column_pairs AS (
    SELECT
        table_name,
        column_name,
        -- Convert camelCase to snake_case for comparison
        regexp_replace(
            regexp_replace(column_name, '([A-Z])', '_\1', 'g'),
            '^_', ''
        ) as snake_case_version
    FROM information_schema.columns
    WHERE table_schema = 'public'
),
duplicates AS (
    SELECT DISTINCT
        c1.table_name,
        c1.column_name as camel_case_column,
        c2.column_name as snake_case_column
    FROM column_pairs c1
    JOIN column_pairs c2
        ON c1.table_name = c2.table_name
        AND LOWER(c1.snake_case_version) = LOWER(c2.column_name)
        AND c1.column_name != c2.column_name
        AND c1.column_name !~ '_'  -- c1 is camelCase
        AND c2.column_name ~ '_'   -- c2 is snake_case
)
SELECT
    table_name as "Table",
    camel_case_column as "CamelCase Column",
    snake_case_column as "snake_case Column"
FROM duplicates
ORDER BY table_name, camel_case_column;

EOF

echo ""
echo "================================================"
echo "Detailed Column List by Table"
echo "================================================"
echo ""

# List all columns for key tables
TABLES=("User" "Role" "Person" "Code" "Group" "Task" "TaskCompletion")

for table in "${TABLES[@]}"; do
    echo "--- Table: $table ---"
    $PSQL_CMD "$CLEAN_DATABASE_URL" -c "
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '$table'
        ORDER BY ordinal_position;
    "
    echo ""
done

echo "================================================"
echo "Checking Code table specifically for personId"
echo "================================================"
echo ""

$PSQL_CMD "$CLEAN_DATABASE_URL" << 'EOF'
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Code'
AND (column_name LIKE '%person%' OR column_name LIKE '%Person%')
ORDER BY column_name;
EOF

echo ""
echo "================================================"
echo "Diagnostic Complete"
echo "================================================"
