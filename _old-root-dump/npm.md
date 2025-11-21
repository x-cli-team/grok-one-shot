---
title: NPM Publishing Troubleshooting Guide
---

# NPM Publishing Troubleshooting Guide

## 🚨 Quick Diagnosis

### Check NPM Status

```bash
# Check current published version
npm view @xagent/x-cli version

# Check if new version exists
npm view @xagent/x-cli time --json | tail -5
```

### Check GitHub Actions

1. Go to: https://github.com/hinetapora/@xagent/x-cli/actions
2. Look for failed "Release" workflows
3. Check logs for specific error messages

## Common Failure Patterns

### 1. Release Workflow Doesn't Trigger

**Symptoms**: No new "Release" workflow runs after pushing to main

**Causes & Fixes**:

- **Previous commit was auto-bump**: Workflow skips automatically ✅
- **Workflow file corrupted**: Check `.github/workflows/release.yml` syntax
- **Branch protection**: Ensure main branch allows workflow triggers

### 2. Version Bump Fails

**Symptoms**: Release workflow fails at "Bump patch version" step

**Error Patterns**:

```bash
fatal: could not read Username for 'https://github.com'
```

**Fix**: Check PAT_TOKEN secret is set correctly

```bash
# In GitHub repo Settings → Secrets → Actions
PAT_TOKEN: ghp_your_personal_access_token_here
```

### 3. Git Push Fails

**Symptoms**: Workflow fails at "Create tag and push" step

**Error Patterns**:

```bash
! [rejected] main -> main (fetch first)
```

**Fixes**:

1. **Missing authentication**:

   ```yaml
   env:
     GITHUB_TOKEN: ${{ secrets.PAT_TOKEN || secrets.GITHUB_TOKEN }}
   ```

2. **Force push protection**: Normal behavior, workflow should handle automatically

### 4. Build Fails

**Symptoms**: Workflow fails at "Build" step with Rollup errors

**Error Patterns**:

```bash
Error: Cannot find module @rollup/rollup-linux-x64-gnu
npm has a bug related to optional dependencies
```

**Fix**: Clear npm cache (already implemented)

```yaml
- name: Install dependencies
  run: |
    rm -rf node_modules package-lock.json
    npm install
```

### 5. NPM Auth Fails

**Symptoms**: Workflow fails at "Publish to npm" step

**Error Patterns**:

```bash
npm error 403 Forbidden
npm error You must be logged in to publish packages
npm error `always-auth` is not a valid npm option
```

**Fixes**:

1. **Invalid token**: Regenerate NPM_TOKEN
   - Go to npmjs.com → Account → Access Tokens
   - Create new "Automation" token
   - Update GitHub secret `NPM_TOKEN`

2. **Wrong token type**: Must be "Automation" not "Publish"

3. **Corrupted .npmrc**: Use direct file creation
   ```yaml
   - name: Configure npm auth
     run: |
       echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" > ~/.npmrc
   ```

### 6. Package Name/Scope Issues

**Symptoms**: 403 errors or "package not found"

**Critical Settings** (DO NOT CHANGE):

```json
{
  "name": "@xagent/x-cli", // Must remain unscoped
  "publishConfig": {
    "access": "public" // Must NOT include registry
  }
}
```

## Working Configuration Reference

### Required GitHub Secrets

```
PAT_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NPM_TOKEN=npm_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Critical Workflow Steps

```yaml
# 1. Loop Prevention (CRITICAL)
- name: Skip if previous commit was auto-bump
  run: |
    if git log -1 --pretty=%B | grep -qiE "^Bump version to "; then
      echo "Auto-bump detected; skipping."
      exit 78
    fi

# 2. Clean Dependencies (CRITICAL for Rollup)
- name: Install dependencies
  run: |
    rm -rf node_modules package-lock.json
    npm install

# 3. Git Auth (CRITICAL for push)
- name: Create tag and push
  env:
    GITHUB_TOKEN: ${{ secrets.PAT_TOKEN || secrets.GITHUB_TOKEN }}

# 4. NPM Auth (CRITICAL for publish)
- name: Configure npm auth
  run: |
    echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" > ~/.npmrc
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Emergency Recovery

### If Automation is Completely Broken

```bash
# 1. Check current state
git status
npm view @xagent/x-cli version

# 2. Manual version bump
npm version patch  # or minor/major as needed

# 3. Build and test
npm run build
npm run local  # Test locally

# 4. Manual publish
npm publish --access public

# 5. Push changes
git push origin main --follow-tags

# 6. Fix automation before next release!
```

### If NPM Shows Wrong Version

```bash
# Check what's actually published
npm view @xagent/x-cli time --json

# Check local package.json
cat package.json | grep version

# If automation is working, just wait 5-10 minutes for NPM cache
```

## Validation Checklist

### Before Touching the Workflow:

- [ ] Automation is currently working
- [ ] You understand what change you're making
- [ ] You have a rollback plan
- [ ] You've tested the change in a fork first

### After Modifying Workflow:

- [ ] Push a test commit to main
- [ ] Watch GitHub Actions complete successfully
- [ ] Verify new version appears on NPM within 10 minutes
- [ ] Test npm install of new version works

## Prevention Tips

1. **NEVER modify package.json name/publishConfig**
2. **NEVER change workflow trigger conditions**
3. **ALWAYS test workflow changes in a fork first**
4. **ALWAYS monitor GitHub Actions after changes**
5. **Keep NPM and GitHub tokens current**

## Historical Context

This workflow was rebuilt 3 times before getting it working:

1. **Attempt 1**: Separate release.yml and publish.yml (failed - cross-workflow triggering)
2. **Attempt 2**: PAT token triggering (failed - still had auth issues)
3. **Attempt 3**: Combined workflow (SUCCESS - current implementation)

**Key Insight**: Simpler is better. Single workflow eliminates cross-workflow complexity.

---

⚠️ **If in doubt, DO NOT MODIFY. The current workflow took significant effort to get working.**

See also:

- `/docs/troubleshooting` - Detailed incident history
- `/docs/guides/release-management` - Release process overview
