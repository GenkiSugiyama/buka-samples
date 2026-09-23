#!/usr/bin/env bash
# Setup prerequisite check for macOS.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

all_good=true

check_tool() {
    local name="$1"
    local command_name="$2"
    local minimum_major="$3"
    local version_output
    local version
    local major

    if command -v "$command_name" &> /dev/null; then
        version_output=$("$command_name" --version 2>&1 || true)
        version=$(printf '%s\n' "$version_output" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)
        if [ -n "$version" ]; then
            major=$(echo "$version" | cut -d. -f1)
            if [ "$major" -ge "$minimum_major" ]; then
                echo -e "  ${GREEN}✅ $name v$version${NC}"
            else
                echo -e "  ${YELLOW}⚠️  $name v$version (minimum v${minimum_major}+ required)${NC}"
                all_good=false
            fi
        else
            echo -e "  ${YELLOW}⚠️  $name (installed, version unknown)${NC}"
            all_good=false
        fi
    else
        echo -e "  ${RED}❌ $name — not found${NC}"
        all_good=false
    fi
}

echo ""
echo "Checking prerequisites..."
echo ""

check_tool "Node.js" "node" 20
check_tool "npm" "npm" 10
check_tool "Git" "git" 2
check_tool "GitHub CLI (gh)" "gh" 2

echo ""
if [ "$all_good" = true ]; then
    echo -e "${GREEN}All prerequisites are installed.${NC}"
else
    echo -e "${YELLOW}Some prerequisites are missing, outdated, or have an unknown version.${NC}"
    exit 1
fi
