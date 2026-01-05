#!/usr/bin/env bash

# Exit on any error
set -e

# Ensure we are in the repository root
cd "$(git rev-parse --show-toplevel)"

# Verify clean working tree
if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Working tree is not clean. Please commit or stash changes before running this script."
  exit 1
fi

# Define branch name
BRANCH_NAME="feature/full-sync-$(date +%Y%m%d%H%M%S)"

# Create and switch to new branch
git checkout -b "$BRANCH_NAME"

# Stage all changes
git add .

# Commit changes
git commit -m "chore: sync all files"

# Push branch to origin
git push -u origin "$BRANCH_NAME"

# Create a Pull Request using GitHub CLI (gh)
# Requires gh to be installed and authenticated
if command -v gh >/dev/null 2>&1; then
  gh pr create --title "Sync all files" --body "Automated PR to sync all repository files." --base main --head "$BRANCH_NAME"
else
  echo "GitHub CLI (gh) not installed. Skipping PR creation."
fi
