# Incident: NPM Publish Failure on Tag Push

## Summary
- **Date Created**: 2025-10-17
- **Date Resolved**: 2025-10-17  
- **Status**: ✅ **RESOLVED**
- **Issue**: Automated NPM publishing fails despite successful builds and tag creation. Versions were bumped but not published to NPM.
- **Root Cause**: Multiple issues: (1) Git auth failing in Release workflow, (2) Cross-workflow triggering blocked by GITHUB_TOKEN, (3) npm config syntax errors, (4) Rollup dependency cache corruption
- **Impact**: New versions were not released to NPM, blocking users from installing updates.

## Investigation Notes
- GitHub Actions release workflow successfully bumps version, commits, and pushes tags (e.g., v1.0.63).
- Publish workflow triggers on tag push but fails at `npm publish` step (confirmed not published via NPM registry check).
- Local build succeeds; issue is CI-specific.
- NPM_TOKEN secret is set in GitHub repo, but may be invalid, for wrong account, or not an Automation token.

## Fix Plan (Based on Provided Guidance)
Follow the battle-tested checklist in order:

1. **Confirm Package Ownership**:
   - Run `npm whoami` and `npm view grok-cli-hurry-mode maintainers` locally.
   - If not owner/maintainer, rename to scoped package (e.g., `@hinetapora/grok-cli-hurry-mode`) or request access.
   - Update `package.json` name and add `"publishConfig": { "access": "public" }` if scoping.

2. **Use Automation Token**:
   - Regenerate NPM token as "Automation" type (not "Publish") to handle 2FA.
   - Update GitHub secret `NPM_TOKEN` with new token.

3. **Update Workflows for Auth and Permissions**:
   - Add `.npmrc` generation in publish workflow.
   - Add `permissions: { contents: write, id-token: write }` to jobs.
   - Add dry-run step before publish.
   - Use `--provenance` in publish command.

4. **Workflow Snippets**:
   - Replace current `release.yml` and `publish.yml` with improved versions (see below).

## Updated Workflow Files
### release.yml (Bump + Tag on Push to Main)
```yaml
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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install (bun optional)
        run: npm ci

      # Prevent loops if last commit was an automated bump
      - name: Skip if previous commit was auto-bump
        run: |
          if git log -1 --pretty=%B | grep -qiE "^Bump version to "; then
            echo "Auto-bump detected; skipping."
            exit 78
          fi

      - name: Bump patch version (no tag yet)
        run: |
          NEW_VER=$(npm version patch --no-git-tag-version)
          git add package.json package-lock.json || true
          git commit -m "Bump version to ${NEW_VER#v}"

      - name: Create tag and push
        run: |
          NEW_VER=$(node -p "require('./package.json').version")
          git tag "v${NEW_VER}"
          git push origin HEAD:main --follow-tags
```

### publish.yml (Publish on Tag)
```yaml
name: Publish
on:
  push:
    tags:
      - "v*"

permissions:
  contents: read
  id-token: write  # for --provenance

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Configure npm auth
        run: |
          npm config set //registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
          npm config set always-auth true
          npm config set registry https://registry.npmjs.org
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Install deps
        run: npm ci

      - name: Build
        run: npm run build

      - name: Dry run (sanity check)
        run: npm publish --access public --dry-run

      - name: Publish to npm
        run: npm publish --access public --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Next Steps
- Confirm package ownership and update token if needed.
- Apply workflow updates.
- Test with a new push to `main` (should bump to 1.0.64 and publish).
- Monitor GitHub Actions logs for errors.

## Final Working Solution

After multiple failed attempts with cross-workflow triggering, the solution was to **combine both workflows into a single Release workflow** that handles both version bumping AND NPM publishing.

### ✅ Working Release Workflow (`.github/workflows/release.yml`)
```yaml
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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: |
          rm -rf node_modules package-lock.json
          npm install

      # Prevent loops if last commit was an automated bump
      - name: Skip if previous commit was auto-bump
        run: |
          if git log -1 --pretty=%B | grep -qiE "^Bump version to "; then
            echo "Auto-bump detected; skipping."
            exit 78
          fi

      - name: Bump patch version (no tag yet)
        run: |
          git config --global user.email "action@github.com"
          git config --global user.name "GitHub Action"
          NEW_VER=$(npm version patch --no-git-tag-version)
          git add package.json package-lock.json || true
          git commit -m "Bump version to ${NEW_VER#v}"

      - name: Create tag and push
        run: |
          NEW_VER=$(node -p "require('./package.json').version")
          git tag "v${NEW_VER}"
          git push origin HEAD:main
          git push origin "v${NEW_VER}"
        env:
          GITHUB_TOKEN: ${{ secrets.PAT_TOKEN || secrets.GITHUB_TOKEN }}

      - name: Configure npm auth
        run: |
          echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" > ~/.npmrc
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Build
        run: npm run build

      - name: Dry run (sanity check)
        run: npm publish --access public --dry-run

      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Key Fixes Applied:
1. **Git Authentication**: Added `PAT_TOKEN` fallback for git push operations
2. **Dependency Issues**: Clear npm cache with `rm -rf node_modules package-lock.json && npm install`
3. **NPM Auth**: Use simple `.npmrc` file creation instead of complex npm config commands
4. **Unified Workflow**: Eliminated cross-workflow triggering issues by combining both operations
5. **Error Prevention**: Added proper exit codes and validation steps

## Resolution Status
- [x] ✅ **Ownership confirmed** (using grok_cli account)
- [x] ✅ **NPM token configured** (Automation token type)
- [x] ✅ **Workflows fixed** (Combined into single workflow)
- [x] ✅ **Git authentication fixed** (PAT_TOKEN added)
- [x] ✅ **Build issues resolved** (Clean npm install)
- [x] ✅ **NPM auth fixed** (Proper .npmrc setup)
- [x] ✅ **Test publish successful** (Version 1.0.87+ publishing automatically)
- [x] ✅ **Incident closed** (Automation working as of 2025-10-17)

## Lessons Learned
1. **GITHUB_TOKEN cannot trigger other workflows** - Use PAT_TOKEN for cross-workflow triggering, or better yet, combine workflows
2. **npm config commands are fragile** - Direct .npmrc file creation is more reliable
3. **Rollup dependencies can cache corrupt** - Always clear node_modules when build fails
4. **Separate workflows add complexity** - Single workflow is more reliable for simple automation

## Critical Dependencies
- **PAT_TOKEN secret**: Personal Access Token with repo permissions
- **NPM_TOKEN secret**: NPM Automation token from grok_cli account
- **Package name**: Must remain "grok-cli-hurry-mode" (unscoped)
- **Git hooks**: Must not block automated commits

⚠️ **DO NOT MODIFY the release workflow without testing - it took multiple iterations to get working!**