# Version Management SOP

## Purpose

This SOP ensures consistent version management across the Grok CLI codebase, preventing version drift and maintaining synchronization between NPM releases, documentation, and application displays.

## 🎯 Quick Reference

### ✅ DO
- Use dynamic imports: `import pkg from '../../../package.json' with { type: 'json' };`
- Let GitHub Action handle README version updates
- Check `npm view grok-cli-hurry-mode version` for current NPM version
- Test version displays with temporary package.json changes

### ❌ DON'T
- Hardcode version strings anywhere in the codebase
- Manually update README version headers
- Bypass the automated release workflow
- Modify version synchronization patterns without testing

## 📋 Standard Operating Procedures

### 1. Adding New Version Displays

**When**: Adding version info to new UI components, CLI outputs, or documentation

**Steps**:
1. Import package.json dynamically:
   ```typescript
   import pkg from '../../../package.json' with { type: 'json' };
   ```

2. Use the version property:
   ```typescript
   const version = pkg.version;
   // or inline
   console.log(`Grok CLI v${pkg.version}`);
   ```

3. Test the implementation:
   ```bash
   # Temporarily change version in package.json
   vim package.json  # Change version to 9.9.9
   npm run build && npm run start  # Verify display shows 9.9.9
   git checkout package.json  # Revert change
   ```

### 2. Code Review Process

**When**: Reviewing PRs that include version displays

**Checklist**:
- [ ] No hardcoded version strings (grep for `"1\.[0-9]\+\.[0-9]\+"`)
- [ ] Version displays use dynamic imports from package.json
- [ ] README changes are minimal (auto-handled by GitHub Action)
- [ ] No manual version synchronization code

### 3. Release Process

**When**: Pushing changes to main branch

**Automated Flow**:
1. Push to main → GitHub Action triggers
2. Action bumps package.json version  
3. Action updates README.md automatically
4. Action creates git tag and pushes
5. Action publishes to NPM

**Manual Verification** (after release):
```bash
# Check all versions are synchronized
npm view grok-cli-hurry-mode version  # NPM version
node -p "require('./package.json').version"  # Local version
head -1 README.md  # README version
```

### 4. Emergency Version Sync

**When**: Versions become out of sync due to action failures

**Steps**:
1. Identify the discrepancy:
   ```bash
   echo "NPM: $(npm view grok-cli-hurry-mode version)"
   echo "Local: $(node -p "require('./package.json').version")"
   echo "README: $(head -1 README.md | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')"
   ```

2. Determine source of truth (usually NPM if published)

3. Manual sync (avoid if possible):
   ```bash
   # If NPM is ahead, pull latest:
   git pull origin main
   
   # If README is behind, let next release fix it
   # DON'T manually edit - GitHub Action will handle it
   ```

### 5. Troubleshooting Version Issues

**Common Problems**:

1. **"Command not found: grok"**
   ```bash
   npm view grok-cli-hurry-mode version  # Check if published
   npm install -g grok-cli-hurry-mode@latest
   ```

2. **Version displays show wrong version**
   ```bash
   # Check if using dynamic imports
   grep -r "pkg.version\|package.json" src/
   
   # Rebuild if using bundled version
   npm run build
   ```

3. **GitHub Action fails to sync versions**
   ```bash
   # Check action logs at:
   # https://github.com/hinetapora/grok-cli-hurry-mode/actions
   
   # Verify secrets are set:
   # PAT_TOKEN, NPM_TOKEN
   ```

## 🚨 Critical Safety Measures

### Version Synchronization Pattern

**REQUIRED PATTERN** for all version displays:
```typescript
import pkg from '../../../package.json' with { type: 'json' };
const version = pkg.version;
```

**FORBIDDEN PATTERNS**:
```typescript
const version = "1.1.22";  // ❌ Hardcoded
const version = process.env.VERSION;  // ❌ Environment variable
const version = "v" + getCurrentVersion();  // ❌ Function call
```

### GitHub Action Protection

**Never modify** these without full testing:
- `.github/workflows/release.yml` version bump logic
- README version regex pattern: `^## [0-9]\+\.[0-9]\+\.[0-9]\+`
- package.json version format

### Breaking Change Protocol

**Before modifying version patterns**:
1. Create development branch
2. Test full release cycle in fork
3. Document changes in `.agent/system/version-synchronization.md`
4. Coordinate with team for rollout

## 📊 Monitoring & Validation

### Daily Checks
- Compare NPM vs GitHub package.json versions
- Verify welcome screen shows correct version
- Check recent GitHub Action execution logs

### Weekly Audits
```bash
# Run version audit script
grep -r "1\.[0-9]\+\.[0-9]\+" src/ --exclude="*.json" || echo "✅ No hardcoded versions found"

# Verify synchronization
npm view grok-cli-hurry-mode version
node -p "require('./package.json').version"
```

## 📚 Resources

- **System Documentation**: `.agent/system/version-synchronization.md`
- **Release Management**: `.agent/sop/release-management.md`
- **GitHub Actions**: https://github.com/hinetapora/grok-cli-hurry-mode/actions
- **NPM Package**: https://www.npmjs.com/package/grok-cli-hurry-mode

---

*Following this SOP ensures zero version drift and automated consistency across all version displays.*