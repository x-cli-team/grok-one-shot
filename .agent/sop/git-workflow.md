# Git Workflow & Smart Push

## 🚨 CRITICAL: Always Use Smart Push

**GitHub Actions automatically creates version bump commits, causing "fetch first" errors with regular `git push`. ALWAYS use smart push methods.**

### 🛡️ **NEW: Automatic Protection**

**Pre-push hook installed** - Blocks dangerous commands:
```bash
git push origin main  # ❌ BLOCKED by pre-push hook
git push -u origin main  # ❌ BLOCKED by pre-push hook
```

**Smart-push script detection** - Detects recent direct git push usage:
```bash
# If git push was used recently on main, smart-push will fail with:
🚫 DETECTED: Recent direct git push usage on main branch!
💡 Always use smart-push script instead: npm run smart-push
```

**Setup additional protection** (run once):
```bash
./scripts/setup-git-aliases.sh  # Adds helpful aliases
```

## ✅ Correct Push Methods

### Method 1: CLI Safe Push (Recommended) ⭐ **NEW**
```bash
/safe-push
```
**Benefits:**
- ✅ Stable CLI integration with real-time feedback
- ✅ 5-step automated workflow with quality checks
- ✅ No crashes or complex shell operations
- ✅ TypeScript and ESLint validation
- ✅ Auto-generated commit messages with timestamps

### Method 2: Git Alias  
```bash
git pushup
```

### Method 3: NPM Script  
```bash
npm run smart-push
```

### Method 4: Direct Script
```bash
./scripts/smart-push.sh
```

### ⚠️ Legacy Smart Push (CLI)
```bash
/smart-push  # Not recommended - can crash CLI
```

## ❌ NEVER Use Regular Push
```bash
# ❌ DON'T DO THIS - Will fail with "fetch first" error
git push origin main
```

## 🔧 How Safe Push Works ⭐ **NEW**

The `/safe-push` CLI command provides a simplified, stable workflow:

**5-Step Process:**
1. **📝 TypeScript Check** - Runs `npm run typecheck` (fails on errors)
2. **🧹 ESLint Check** - Runs `npm run lint` (continues with warnings)
3. **📋 Git Status** - Checks for changes (skips if clean)
4. **📦 Stage Changes** - Runs `git add .` 
5. **🚀 Commit & Push** - Auto-commit with timestamp + `git push`

**Sample Auto-Commit Message:**
```
feat: update files - 2025-11-05 08:45
```

**Error Handling:**
- ✅ Stops immediately on TypeScript errors
- ✅ Shows clear error messages and next steps
- ✅ Skips operation if no changes to commit
- ✅ Real-time progress feedback in CLI

## 🔧 How Traditional Smart Push Works

1. **Pulls with rebase** to get automated version bumps from GitHub Actions
2. **Rebases local changes** on top of remote changes
3. **Pushes cleanly** without merge conflicts
4. **Monitors GitHub Actions** for automated tasks (version bumps, publishing)
5. **Waits for completion** before reporting success
6. **Handles conflicts** gracefully if they occur

### 🤖 GitHub Actions Integration

Smart push now includes **real-time GitHub Actions monitoring**:

- **Automatic detection** of workflow runs triggered by your commit
- **Status monitoring** for version bumps, NPM publishing, and documentation sync
- **Completion waiting** - ensures automated tasks finish before reporting success
- **Failure detection** - alerts if GitHub Actions fail
- **Fallback support** - works even without GitHub CLI (`gh`) installed

## 🤖 Why This is Needed

The automated release system:
- Creates version bump commits like "Bump version to 1.0.87"
- Publishes to NPM automatically
- Updates package.json and README.md
- Creates git tags

Without smart push, you get:
```
! [rejected] main -> main (fetch first)
error: failed to push some refs
```

### 🔧 GitHub Actions Release Workflow ✅ **FULLY OPERATIONAL**

The `.github/workflows/release.yml` handles automated releases on every push to `main`. **Recent CI fixes (Nov 2024)** resolved all environment issues:

**Smart Skip Logic:**
- Detects merge commits from release PRs (prevents infinite loops)
- Detects auto-bump commits (avoids duplicate releases)
- Uses **conditional steps** with outputs (no false "failures")
- Skips gracefully when conditions met, showing ✅ **Success** not ❌ **Failure**

**Before Fix:** Used `exit 78` → marked as "Process completed with exit code 78" (confusing)
**After Fix:** Uses `if: steps.check.outputs.should_release == 'true'` → clean skip

**Release Process:**
1. **Pre-commit validation**: TypeScript, ESLint, core features (25+ tools), documentation sync
2. **Version bump**: patch increment (e.g., 1.1.70 → 1.1.71) 
3. **Build**: Clean dependencies, TypeScript compilation, artifact generation
4. **Publish**: NPM package with provenance, GitHub Packages
5. **Git operations**: Tag creation, release notes generation
6. **Quality assurance**: CI-specific validations (test API key, CLI tests)

**CI Environment Adaptations** (Nov 2024 fixes):
- ⏭️ Roadmap update skipped in CI (documentation only, missing API key)
- ⏭️ MDX validation skipped in CI (local validation sufficient) 
- ✅ Enhanced CI validations (test API key, version/help display tests)
- ✅ Fixed TypeScript compilation (removed invalid MCP client properties)

## 🛠️ Configuration Applied

The following Git settings are configured globally:
- `pull.rebase = true` - Always rebase when pulling  
- `branch.autoSetupRebase = always` - New branches auto-rebase
- `alias.pushup` - Custom pull-then-push command

## 🔄 Workflow Example

```bash
# Make changes
git add .
git commit -m "Add new feature"

# Push with smart push (handles automated version bumps)
git pushup

# ✅ Success! No conflicts with GitHub Actions
```

## 🚨 Emergency Manual Fix

If you accidentally used `git push` and got rejected:

```bash
# Pull to get the automated changes
git pull --rebase origin main

# Then push
git push origin main
```

## 📖 Related Documentation

- `.agent/sop/release-management.md` - Automated release system details
- `scripts/smart-push.sh` - Smart push script implementation
- `package.json` - NPM script configuration

---

**Last Updated**: 2024-10-30  
**Status**: Active - Required for all Git operations