# Version Synchronization System

## Overview

Grok CLI uses an automated version synchronization system to ensure all version displays remain consistent across the codebase, documentation, and NPM releases. This prevents version drift and manual synchronization errors.

## 🎯 System Architecture

### Core Components

1. **Source of Truth**: `package.json` version field
2. **GitHub Action**: Automated version bumping and synchronization
3. **Dynamic Imports**: Runtime version retrieval pattern
4. **README Auto-Update**: Automated documentation versioning

### Synchronization Flow

```
Code Push → GitHub Action → Bump package.json → Update README → NPM Publish → Git Tag
     ↓
Dynamic version imports automatically reflect new version
```

## ✅ Current Implementation Status

### **Synchronized Components**

- ✅ **package.json** - Source of truth
- ✅ **README.md** - Auto-updated by GitHub Action
- ✅ **NPM Registry** - Published by GitHub Action
- ✅ **Welcome Screen** - Dynamic import from package.json
- ✅ **Git Tags** - Created by GitHub Action

### **GitHub Action Workflow**

Location: `.github/workflows/release.yml`

Key synchronization step:

```yaml
- name: Bump patch version (no tag yet)
  run: |
    git config --global user.email "action@github.com"
    git config --global user.name "GitHub Action"
    NEW_VER=$(npm version patch --no-git-tag-version)

    # Update README version to match package.json
    if [ -f README.md ]; then
      NEW_VER_NUMBER=${NEW_VER#v}
      sed -i "s/^## [0-9]\+\.[0-9]\+\.[0-9]\+/## ${NEW_VER_NUMBER}/g" README.md
      echo "Updated README.md to version ${NEW_VER_NUMBER}"
    fi

    git add package.json package-lock.json README.md || true
    git commit -m "Bump version to ${NEW_VER#v}"
```

## 🚨 CRITICAL PATTERNS

### ✅ **CORRECT**: Dynamic Version Import

**Always use this pattern for version displays:**

```typescript
// ✅ CORRECT - Dynamic import from package.json
import pkg from "../../../package.json" with { type: "json" };

const versionDisplay = pkg.version;
// or
const logoOutput = "HURRY MODE\n" + pkg.version;
```

**Example Implementation** (`src/ui/components/chat-interface.tsx:94`):

```typescript
const logoOutput = "HURRY MODE" + "\n" + pkg.version;
```

### ❌ **INCORRECT**: Hardcoded Versions

**Never use hardcoded version strings:**

```typescript
// ❌ WRONG - Will become stale
const version = "1.1.22";
const logoOutput = "HURRY MODE\n1.1.22";
```

### 🔍 **Pattern Detection**

Use this grep command to find hardcoded versions:

```bash
grep -r "1\.[0-9]\+\.[0-9]\+" src/ --exclude="*.json"
```

## 🛠️ Development Guidelines

### Adding New Version Displays

1. **Import package.json dynamically**:

   ```typescript
   import pkg from "../../../package.json" with { type: "json" };
   ```

2. **Use the version property**:

   ```typescript
   const displayVersion = pkg.version;
   ```

3. **Test with version changes**:
   - Temporarily change `package.json` version
   - Verify your display updates automatically
   - Revert changes

### Code Review Checklist

- [ ] No hardcoded version strings in new code
- [ ] Version displays use dynamic imports
- [ ] Changes don't break existing version synchronization
- [ ] README updates are handled by GitHub Action only

## 🔧 Troubleshooting

### Version Drift Issues

If versions become out of sync:

1. **Check GitHub Action logs** for failed executions
2. **Verify package.json** is the correct version
3. **Check NPM registry**: `npm view grok-cli-hurry-mode version`
4. **Manual sync** (emergency only):
   ```bash
   # Update README to match NPM
   npm view grok-cli-hurry-mode version  # Get NPM version
   # Edit README.md header manually
   git commit -m "Sync README to NPM version"
   git push origin main
   ```

### GitHub Action Failures

Common issues:

- **Git permissions**: Check `PAT_TOKEN` secret
- **NPM publishing**: Check `NPM_TOKEN` secret
- **README regex**: Verify version format matches pattern

## 📚 Related Documentation

- **Release Process**: `.agent/sop/release-management.md`
- **Git Workflow**: `.agent/sop/git-workflow.md`
- **NPM Publishing**: `.agent/sop/npm-publishing-troubleshooting.md`

## 🚨 Breaking Changes Warning

**NEVER modify these without coordination:**

- GitHub Action version regex pattern
- package.json version format
- README version header format
- Dynamic import patterns

Changes to version synchronization patterns require:

1. **Full testing** in development branch
2. **Documentation updates**
3. **Team coordination** for rollout

---

_This system eliminates manual version management and ensures consistency across all user-facing version displays._
