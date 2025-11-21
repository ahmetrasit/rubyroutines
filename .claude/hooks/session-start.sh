#!/bin/bash
set -euo pipefail

# Only run on Claude Code web sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  echo "Skipping SessionStart hook - not running on web"
  exit 0
fi

echo "Starting dependency installation for Ruby Routines..."

# Change to project directory
cd "${CLAUDE_PROJECT_DIR:-/home/user/rubyroutines}"

# Install npm dependencies
# Using --legacy-peer-deps to handle ESLint version conflicts
echo "Installing npm dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
# Setting PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING to handle offline/restricted environments
echo "Generating Prisma client..."
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate || {
  echo "Warning: Prisma client generation failed (this is expected in restricted environments)"
  echo "The application will still work for frontend development"
}

echo "SessionStart hook completed successfully!"