# Release Management

## 🤖 Automated Release System

**Status**: ✅ FULLY AUTOMATED as of 2025-10-17

### How It Works
1. **Push to main branch** → Release workflow triggers
2. **Version auto-bumps** (patch) → Creates "Bump version to X.X.X" commit  
3. **Builds and publishes** to NPM automatically
4. **Creates git tag** for the release

### What You Need to Do
**Use Smart Push!** GitHub Actions creates version bump commits, so use:

```bash
# ✅ CORRECT - Use smart push to handle automated version bumps
git pushup              # Git alias method
npm run smart-push      # NPM script method  
./scripts/smart-push.sh # Direct script method

# ❌ WRONG - Will cause "fetch first" errors
git push origin main
```

The system handles:
- ✅ Version bumping (patch increments)  
- ✅ README updates
- ✅ NPM publishing
- ✅ Git tagging
- ✅ Build validation
- ✅ Auto-rebase with remote changes

## 🚨 Critical Workflow Dependencies

**⚠️ DO NOT MODIFY THESE WITHOUT EXTREME CAUTION:**

### GitHub Secrets (Required)
- **`PAT_TOKEN`**: Personal Access Token with repo permissions
- **`NPM_TOKEN`**: NPM Automation token from grok_cli account

### Package Configuration (Sacred)
```json
{
  "name": "grok-cli-hurry-mode",  // ⚠️ NEVER change - breaks publishing
  "publishConfig": {
    "access": "public"  // ⚠️ Must NOT include registry override
  }
}
```

### Working Release Workflow
**File**: `.github/workflows/release.yml`
```yaml
# ⚠️ This workflow took multiple attempts to get working!
# DO NOT MODIFY without understanding all dependencies
name: Release
on:
  push:
    branches: [ main ]
permissions:
  contents: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      # Critical: Fresh dependency install
      - name: Install dependencies
        run: |
          rm -rf node_modules package-lock.json
          npm install
      
      # Critical: Loop prevention
      - name: Skip if previous commit was auto-bump
        run: |
          if git log -1 --pretty=%B | grep -qiE "^Bump version to "; then
            echo "Auto-bump detected; skipping."
            exit 78
          fi
      
      # Critical: Git authentication for push
      - name: Create tag and push
        env:
          GITHUB_TOKEN: ${{ secrets.PAT_TOKEN || secrets.GITHUB_TOKEN }}
      
      # Critical: NPM authentication
      - name: Configure npm auth
        run: |
          echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" > ~/.npmrc
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Manual Release Guidelines (Emergency Only)

### Version Bumping Types
- **Patch (1.0.41 → 1.0.42)**: Bug fixes, small updates (DEFAULT)
- **Minor (1.0.41 → 1.1.0)**: New features, backwards-compatible
- **Major (1.0.41 → 2.0.0)**: Breaking changes

### Manual Process (If Automation Fails)
```bash
# 1. Bump version locally
npm version patch  # or minor/major

# 2. Test build
npm run build
npm run local

# 3. Manual publish (emergency only)
npm publish --access public

# 4. Push changes
git push origin main --follow-tags
```

## Best Practices
- **Conventional commits**: `feat:`, `fix:`, `BREAKING CHANGE:`
- **Test locally**: `npm run local` before pushing
- **Monitor automation**: Check GitHub Actions for failures
- **Don't force-push**: Breaks automation workflow

## Timing for Releases
- **Automatic patch**: Every push to main (current behavior)
- **Manual minor**: Accumulate features, then manual `npm version minor`
- **Manual major**: Breaking changes, coordinate with team

## Troubleshooting Automation

### If Publishing Fails
1. Check GitHub Actions logs
2. Verify secrets are set: `PAT_TOKEN`, `NPM_TOKEN`
3. Confirm NPM token hasn't expired
4. Check package.json name hasn't changed
5. See `.agent/incidents/incident-npm-publish-failure.md` for detailed troubleshooting

### Emergency Manual Publish
If automation is broken and you need to publish immediately:
```bash
npm version patch
npm run build  
npm publish --access public
git push origin main --follow-tags
```

⚠️ **Remember**: Fix automation before next release!