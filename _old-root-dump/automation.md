---
title: Automation Protection System
---

# Automation Protection System

## 🛡️ Overview

This document outlines the protection measures in place to prevent accidental breakage of the automated NPM publishing system.

## 🚨 Protected Files & Settings

### Critical Files (DO NOT MODIFY)

#### 1. `.github/workflows/release.yml`

**Protection**: Header comments with warnings
**Critical Elements**:

- Trigger: `on: push: branches: [main]`
- Secrets: `PAT_TOKEN`, `NPM_TOKEN`
- Clean install: `rm -rf node_modules package-lock.json && npm install`
- NPM auth: Direct `.npmrc` file creation

#### 2. `.husky/pre-commit`

**Protection**: Header comments with warnings
**Critical Elements**:

- Version check script execution
- lint-staged execution
- Auto-staging of version changes

#### 3. `scripts/check-version.cjs`

**Protection**: Header comments with warnings
**Critical Elements**:

- Version auto-bumping logic
- README.md synchronization
- Git staging of modified files

#### 4. `package.json` (Critical Fields)

**Protection**: Documentation warnings + monitoring
**Critical Elements**:

```json
{
  "name": "@xagent/x-cli", // NEVER change - breaks publishing
  "publishConfig": {
    "access": "public" // NEVER add registry override
  }
}
```

## 🔒 Protection Mechanisms

### 1. Documentation Warnings

**Location**: Multiple files with header comments
**Purpose**: Alert developers before making changes
**Coverage**:

- Workflow file header
- Git hook headers
- Script file headers
- README automation section

### 2. Comprehensive Documentation

**Location**: `.agent/` directory
**Files**:

- `sop/release-management.md` - Process overview
- `sop/npm-publishing-troubleshooting.md` - Detailed troubleshooting
- `incidents/incident-npm-publish-failure.md` - Historical context
- `sop/automation-protection.md` - This file

### 3. Code Comments & Context

**Purpose**: Explain WHY certain approaches were chosen
**Examples**:

- Why direct `.npmrc` creation vs npm config
- Why combined workflow vs separate workflows
- Why clean dependency install vs npm ci

### 4. Git Hook Integration

**Purpose**: Prevent commits that break critical settings
**Current**: Version synchronization and basic linting
**Future**: Could add validation for critical package.json fields

## 🚦 Warning System Levels

### 🟥 CRITICAL (Never Modify)

- `package.json` name field
- `package.json` publishConfig.registry field
- GitHub workflow trigger conditions
- NPM authentication method

### 🟨 DANGEROUS (Extreme Caution)

- GitHub workflow steps order
- Git hook execution order
- Version bumping logic
- README synchronization

### 🟢 SAFE (With Testing)

- Workflow timeouts
- Error messages
- Documentation updates
- Additional validation steps

## 🛠️ Future Protection Enhancements

### 1. Package.json Validation Hook

```bash
# Could add to .husky/pre-commit
if grep -q '"registry":' package.json; then
  echo "🚨 ERROR: package.json contains registry override - this breaks NPM publishing!"
  exit 1
fi

if ! grep -q '"name": "@xagent/x-cli"' package.json; then
  echo "🚨 ERROR: package.json name changed - this breaks NPM publishing!"
  exit 1
fi
```

### 2. GitHub Actions Validation

```yaml
# Could add to workflow
- name: Validate critical settings
  run: |
    if [[ "$(jq -r '.name' package.json)" != "@xagent/x-cli" ]]; then
      echo "🚨 ERROR: Package name changed!"
      exit 1
    fi
```

### 3. Automated Documentation Updates

- Script to update "last verified" dates
- Automatic cross-reference validation
- Link checking for internal documentation

## 📋 Change Management Process

### Before Making Changes

1. **Read all warnings** in the file you're modifying
2. **Understand dependencies** - check what references the file
3. **Test in fork** - never test workflow changes on main repo
4. **Have rollback plan** - know how to revert quickly

### During Changes

1. **Small incremental changes** - one fix at a time
2. **Monitor GitHub Actions** - watch for failures immediately
3. **Check NPM publishing** - verify new versions appear
4. **Document changes** - update protection docs

### After Changes

1. **Update documentation** - reflect new working state
2. **Update verification dates** - record when config was confirmed working
3. **Share knowledge** - document lessons learned
4. **Monitor long-term** - watch for delayed effects

## 🔄 Verification Schedule

### Daily (Automatic)

- GitHub Actions monitoring
- NPM publishing verification
- Version synchronization check

### Weekly (Manual)

- Documentation accuracy review
- Secret expiration check
- Dependency security updates

### Monthly (Manual)

- Full protection system review
- Documentation updates
- Process improvement opportunities

## 📞 Emergency Response

### If Automation Breaks

1. **Follow troubleshooting guide** (`/docs/guides/npm-publishing-troubleshooting`)
2. **Use manual publish process** (emergency only)
3. **Document the incident** (`.agent/incidents/`)
4. **Fix automation before next release**

### If Protection System Fails

1. **Restore from git history** (known working commit)
2. **Analyze what allowed the breaking change**
3. **Enhance protection mechanisms**
4. **Update documentation**

## 📚 Related Documentation

- **Process**: `/docs/guides/release-management.md`
- **Troubleshooting**: `.agent/sop/npm-publishing-troubleshooting.md`
- **History**: `/docs/troubleshooting`
- **User Guide**: `README` (Automated Release System section)

---

⚠️ **Remember**: The protection system is only as good as the people who follow it. Always err on the side of caution when dealing with automation infrastructure.
