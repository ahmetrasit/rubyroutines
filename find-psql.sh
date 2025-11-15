#!/bin/bash

# Helper script to find psql on your system

echo "Searching for psql..."
echo ""

# Check if psql is in PATH
if command -v psql &> /dev/null; then
    echo "✓ Found psql in PATH:"
    which psql
    psql --version
    exit 0
fi

# Common Homebrew locations
LOCATIONS=(
    "/opt/homebrew/bin/psql"
    "/opt/homebrew/opt/postgresql@15/bin/psql"
    "/opt/homebrew/opt/postgresql@14/bin/psql"
    "/opt/homebrew/opt/postgresql@13/bin/psql"
    "/usr/local/bin/psql"
    "/usr/local/opt/postgresql@15/bin/psql"
    "/usr/local/opt/postgresql@14/bin/psql"
)

echo "Checking common Homebrew locations..."
for loc in "${LOCATIONS[@]}"; do
    if [ -f "$loc" ]; then
        echo "✓ Found: $loc"
        $loc --version
        echo ""
        echo "To add to your PATH, run:"
        dir=$(dirname "$loc")
        echo "  export PATH=\"$dir:\$PATH\""
        echo ""
        echo "Or add to your ~/.zshrc or ~/.bash_profile:"
        echo "  echo 'export PATH=\"$dir:\$PATH\"' >> ~/.zshrc"
        exit 0
    fi
done

echo "✗ psql not found in common locations"
echo ""
echo "To install PostgreSQL:"
echo "  brew install postgresql@15"
echo ""
echo "After installation, add to PATH:"
echo "  echo 'export PATH=\"/opt/homebrew/opt/postgresql@15/bin:\$PATH\"' >> ~/.zshrc"
echo "  source ~/.zshrc"
