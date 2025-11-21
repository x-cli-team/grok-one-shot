#!/bin/bash

# Step 1: Check organization-level permissions
echo "Checking organization-level GitHub Actions permissions..."
gh api --method GET -H "Accept: application/vnd.github+json" /orgs/x-cli-team/actions/permissions

# If default_workflow_permissions is not 'write', update it
echo "If default_workflow_permissions is 'read', updating to 'write'..."
gh api --method PUT \
  -H "Accept: application/vnd.github+json" \
  /orgs/x-cli-team/actions/permissions/workflow \
  -f default_workflow_permissions=write \
  -f can_approve_pull_request_reviews=true

# Step 2: Check branch protection rules for main
echo "Checking branch protection for main branch..."
gh api -H "Accept: application/vnd.github+json" \
  /repos/x-cli-team/grok-one-shot/branches/main/protection

# Step 3: Add GitHub Actions to bypass list if missing
echo "Updating branch protection to allow GitHub Actions bypass..."
gh api --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/x-cli-team/grok-one-shot/branches/main/protection \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f allow_bypass_pull_request_allowances='{"apps":["github-actions"]}'

# Step 4: Confirm the change
echo "Confirming by listing recent runs of release workflow..."
gh run list --workflow release.yml --limit 1