#!/bin/bash

# Update Sprint Index Script
# Automatically updates .agent/tasks/current-sprint.md with the latest sprint info

set -e

TASKS_DIR=".agent/tasks"
INDEX_FILE="$TASKS_DIR/current-sprint.md"

echo "🔄 Updating sprint index..."

# Find the latest sprint file (by date in filename), exclude current-sprint.md
LATEST_SPRINT=$(ls $TASKS_DIR/ | grep sprint | grep -v current-sprint | sort -V | tail -1)

if [ -z "$LATEST_SPRINT" ]; then
    echo "⚠️ No sprint files found"
    exit 1
fi

SPRINT_PATH="$TASKS_DIR/$LATEST_SPRINT"
SPRINT_DATE=$(echo $LATEST_SPRINT | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')

# Extract sprint name from filename
SPRINT_NAME=$(echo $LATEST_SPRINT | sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}-sprint-//' | sed 's/\.md$//' | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1')

# Extract status (assume In Progress if not found)
STATUS="In Progress"

# Extract goal (from "## Goal" section)
GOAL=$(grep -A 2 "## Goal" "$SPRINT_PATH" | tail -1 | xargs || echo "Implement sprint objectives")

# Extract key tasks (from Implementation Plan or similar)
TASKS=$(grep -A 20 "## Implementation Plan\|## Sprint Backlog" "$SPRINT_PATH" | grep "^- " | head -4 | sed 's/^- //' | sed 's/\[.\] //' | paste -sd ", " - || echo "Complete sprint deliverables")

# Update the index file
cat > "$INDEX_FILE" << EOF
# Current Sprint Index

## Active Sprint
- **Sprint**: $SPRINT_NAME ($SPRINT_DATE)
- **Doc**: [$LATEST_SPRINT]($LATEST_SPRINT)
- **Status**: $STATUS
- **Goal**: $GOAL
- **Key Tasks**: $TASKS

## Previous Sprints
$(ls $TASKS_DIR/ | grep sprint | grep -v "$LATEST_SPRINT" | sort -Vr | head -3 | sed 's/\.md$//' | sed 's/^/- /')

*This index tracks the current active sprint. Updated automatically via Husky hooks.*
EOF

echo "✅ Sprint index updated: $SPRINT_NAME" 