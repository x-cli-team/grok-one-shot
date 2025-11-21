---
title: Git Integration
---

# Git Integration

How Grok One-Shot works with Git repositories and version control.

## Overview

Grok One-Shot is git-aware and can perform common version control operations through the Bash tool. This enables workflows like creating commits, checking status, and managing branches.

## Git Awareness

### Repository Detection

**Automatic detection:**

```
When you start grok in a git repository:
- AI knows it's a git repo
- Can check git status
- Can create commits
- Can manage branches
```

**Check if in repo:**

```bash
# AI can run:
git status
git rev-parse --is-inside-work-tree
```

### Current Branch

**AI can check current branch:**

```
> What branch am I on?

[AI runs: git branch --show-current]
Response: "You're on branch 'feature/auth-refactor'"
```

## Git Operations

### Implemented (via Bash tool)

**Status and inspection:**

```bash
git status # Working tree status
git diff # Unstaged changes
git diff --staged # Staged changes
git log # Commit history
git branch # List branches
git remote -v # Remote repositories
```

**Staging:**

```bash
git add <files> # Stage specific files
git add . # Stage all changes
git reset <file> # Unstage file
```

**Committing:**

```bash
git commit -m "message" # Create commit
git commit --amend # Amend last commit
git commit -m "$(cat <<'EOF'...)" # Multi-line commit
```

**Branch management:**

```bash
git branch <name> # Create branch
git checkout <branch> # Switch branch
git checkout -b <branch> # Create and switch
git merge <branch> # Merge branch
git branch -d <branch> # Delete branch
```

**Remote operations:**

```bash
git fetch # Fetch updates
git pull # Fetch and merge
git push # Push commits
git push -u origin <branch> # Push new branch
```

### Partially Implemented

**Commit workflows:**

- AI can create commits
- AI can write commit messages
- Manual confirmation required (safety)
- No commit templates
- No conventional commit enforcement

**Branch workflows:**

- AI can create/switch branches
- No branch naming conventions enforcement
- No automatic branch creation from task

**Conflict resolution:**

- AI can see conflicts
- AI can suggest resolutions
- No automatic conflict resolution
- User must resolve manually

### Planned Features

**Pull request creation:**

- Create PRs via gh CLI or API
- Generate PR descriptions from commits
- Assign reviewers
- Add labels

**PR review:**

- Analyze PR diffs
- Suggest improvements
- Check for issues
- Add review comments

**Advanced workflows:**

- Interactive rebase assistance
- Cherry-pick with explanation
- Squash commit cleanup
- Branch management automation

## Git Workflows

### Example 1: Making a Commit

**User request:**

```
> Commit the changes with an appropriate message
```

**AI workflow:**

```bash
# 1. Check status
git status
# Shows modified files

# 2. Check diff
git diff
# Reviews changes

# 3. Stage changes
git add src/auth/middleware.ts src/services/auth-service.ts

# 4. Create commit
git commit -m "$(cat <<'EOF'
fix: improve error handling in authentication middleware

- Add try-catch around auth token verification
- Return proper 401 status on invalid tokens
- Log auth failures for debugging
EOF
)"

# 5. Confirm
git log -1 --oneline
```

**AI response:**

```
Created commit: "fix: improve error handling in authentication middleware"
2 files changed, 15 insertions(+), 3 deletions(-)
```

### Example 2: Branch and Commit Workflow

**User request:**

```
> Create a branch for adding OAuth support, implement it, and commit
```

**AI workflow:**

```bash
# 1. Create and switch to branch
git checkout -b feature/oauth-support

# 2. Implement feature
[AI creates/modifies files]

# 3. Check changes
git status
git diff

# 4. Stage and commit
git add src/auth/oauth-provider.ts src/config/oauth-config.ts
git commit -m "feat: add OAuth authentication support

- Implement OAuth provider interface
- Add Google OAuth configuration
- Create OAuth middleware
- Add OAuth routes"

# 5. Verify
git log -1 --stat
```

### Example 3: Pre-Commit Review

**User request:**

```
> Review my uncommitted changes before I commit
```

**AI workflow:**

```bash
# 1. Check status
git status

# 2. Check diff
git diff
git diff --staged

# 3. Analyze changes
[AI reviews code changes]

# 4. Provide feedback
```

**AI response:**

```
Changes look good:
Error handling added in auth middleware
Tests updated
No console.log statements

Suggestions:
Consider adding JSDoc to new functions
auth-service.ts could use more error context

Ready to commit? I can create a commit message for you.
```

## Commit Best Practices

### Commit Messages

**AI follows conventions:**

```
Format: <type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

Examples:
feat(auth): add OAuth Google provider
fix(api): handle timeout in user endpoint
docs(readme): update installation instructions
refactor(db): extract connection pool logic
```

**AI-generated commit messages:**

```
> Create a commit for these authentication changes

AI analyzes changes and generates:
"fix(auth): improve token validation error handling

- Add try-catch in token verification
- Return 401 for expired tokens
- Log authentication failures
- Add unit tests for error cases

Resolves #123"
```

### Git Safety

**Confirmations:**

```
AI: "I'll create a commit with message:
'fix: improve error handling'

Stage these files:
- src/auth/middleware.ts
- src/services/auth-service.ts

Proceed? [y/n/v]"

y → Create commit
n → Cancel
v → View full diff first
```

**Destructive operations:**

```
AI avoids:
git push --force (unless explicitly requested)
git reset --hard (dangerous, requires confirmation)
git clean -fd (destructive, requires confirmation)
Rewriting published history
```

## Integration with GitHub

### GitHub CLI (gh)

**If `gh` is installed:**

```bash
# AI can use gh CLI
gh pr create
gh pr list
gh pr view 123
gh issue create
gh issue list
gh repo view
```

**Example workflow:**

```
> Create a pull request for my feature branch

AI:
1. git push -u origin feature/oauth-support
2. gh pr create --title "feat: Add OAuth support" \
--body "$(cat <<'EOF'
## Summary
- Implements OAuth authentication
- Google provider support
- Tests included

## Testing
- [x] Unit tests passing
- [x] Manual OAuth flow tested
- [ ] Ready for review
EOF
)"
```

### Git Hooks Integration

**Pre-commit hooks:**

```bash
# Grok One-Shot can help enforce hooks
# Example: Check for console.log before commit

> Check if there are any console.log statements I should remove before committing

AI:
1. git diff --staged
2. grep "console.log"
3. Reports findings
```

## Advanced Git Operations

### Interactive Rebase Help

**User request:**

```
> Help me rebase my feature branch onto main
```

**AI workflow:**

```bash
# 1. Fetch latest
git fetch origin main

# 2. Check current branch
git branch --show-current

# 3. Check commits to rebase
git log --oneline main..HEAD

# 4. Suggest approach
```

**AI response:**

```
You have 5 commits on feature/oauth-support that aren't on main:
- abc1234 feat: add OAuth config
- def5678 fix: typo in OAuth provider
- ghi9012 feat: add Google OAuth
- jkl3456 test: add OAuth tests
- mno7890 docs: update OAuth docs

Recommend:
1. Squash the typo fix (def5678) into abc1234
2. Keep other commits separate

Run: git rebase -i main
Then follow prompts. Need help with the rebase?
```

### Cherry-Pick Assistance

**User request:**

```
> Cherry-pick commit abc1234 from feature/other-branch
```

**AI workflow:**

```bash
# 1. Show commit
git show abc1234

# 2. Cherry-pick
git cherry-pick abc1234

# 3. Handle conflicts if any
git status
# If conflicts:
git diff # Show conflicts
# Suggest resolution
```

### Stash Management

**User request:**

```
> Stash my changes so I can switch branches
```

**AI workflow:**

```bash
# Save changes
git stash push -m "WIP: authentication refactor"

# Verify
git status # Clean
git stash list # Show stash

# Later: restore
git stash pop
```

## Git Troubleshooting

### Merge Conflicts

**AI can help resolve:**

```
> I have merge conflicts, help me resolve them

AI:
1. git status # Show conflicted files
2. cat <file> # Show conflict markers
3. Analyze both sides
4. Suggest resolution

Response:
"Conflicts in src/auth/middleware.ts:

Your branch (HEAD):
- Added JWT token validation
- Uses jsonwebtoken library

Incoming (main):
- Improved error handling
- Better logging

Recommendation:
Keep both changes:
1. Keep JWT validation from your branch
2. Integrate improved error handling from main
3. Combine logging improvements

Want me to show the exact code to keep?"
```

### Undoing Changes

**Scenarios:**

**Uncommitted changes:**

```bash
git restore <file> # Discard changes
git restore --staged # Unstage
git clean -n # Preview untracked files
```

**Committed changes:**

```bash
git reset --soft HEAD~1 # Undo commit, keep changes
git reset --hard HEAD~1 # Undo commit, discard changes (careful!)
git revert <commit> # Create new commit that undoes changes
```

**Pushed changes:**

```bash
git revert <commit> # Safe: creates new commit
git push

# AI avoids force push unless explicitly requested
```

## Limitations and Considerations

### Current Limitations

**No native git integration:**

- All git operations via Bash tool
- No git library integration
- No specialized git UI

**Confirmation required:**

- All git write operations need approval (unless confirmations disabled)
- Safety first approach

**No GUI:**

- Terminal only
- No visual diff viewer
- No merge conflict UI

### Best Practices

**DO:**

- Let AI help with commit messages
- Review diffs before committing
- Use descriptive branch names
- Keep commits focused and atomic

**DON'T:**

- Blindly approve git operations
- Let AI force push without understanding why
- Disable confirmations for unfamiliar repos
- Commit sensitive data (AI can't always detect)

## See Also

- [Common Workflows](../getting-started/common-workflows.md) - Git workflows
- [Troubleshooting](../build-with-claude-code/troubleshooting.md) - Git issues
- [Tool System](./tool-system.md) - How Bash tool works
- [Interactive Mode](../reference/interactive-mode.md) - Session usage

---

**Status:** Basic git operations implemented via Bash tool, Advanced workflows in development, Native PR/review features planned

Git integration enables version control workflows directly within AI-assisted development sessions.
