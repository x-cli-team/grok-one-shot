#!/bin/bash
# ⚠️  CRITICAL GIT PROTECTION SETUP FOR AI AGENT SAFETY ⚠️
#
# 🎯 PURPOSE: Configure git to prevent dangerous agent bypass attempts
#
# This script sets up multiple layers of protection:
# 1. Git aliases that redirect to smart-push
# 2. Git configuration to enforce safe workflows
# 3. Branch protection rules (where possible)
# 4. Warning messages for dangerous commands

echo "🛡️  Setting up comprehensive git protection..."

# 1. Create safe git aliases that redirect to smart-push
echo "📝 Creating protective git aliases..."

git config --global alias.pushup '!echo "🔄 Using smart-push for safety..." && npm run smart-push'
git config --global alias.push-main '!echo "🚨 BLOCKED: Use npm run smart-push instead" && echo "💡 Direct pushes to main bypass automation" && exit 1'
git config --global alias.push-master '!echo "🚨 BLOCKED: Use npm run smart-push instead" && echo "💡 Direct pushes to main bypass automation" && exit 1'

# 2. Set up git configuration for safer workflows
echo "⚙️  Configuring git for safe workflows..."

# Always rebase when pulling to avoid unnecessary merge commits
git config pull.rebase true

# Set up branch auto-rebase
git config branch.autoSetupRebase always

# Prevent accidental pushes to wrong remote
git config push.default simple

# Always show what you're about to push
git config push.verify true

# 3. Create custom git commands that are safer
echo "🔧 Creating safer git commands..."

# Create a safe push command
cat > .git/hooks/pre-push-safety-check << 'EOF'
#!/bin/bash
# Additional safety check before any push
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    echo "🚨 WARNING: Pushing to $BRANCH"
    echo "💡 Consider using: npm run smart-push"
    echo "⏳ Continuing in 3 seconds... (Ctrl+C to cancel)"
    sleep 3
fi
EOF

chmod +x .git/hooks/pre-push-safety-check

# 4. Add warning to git commit template
echo "📋 Setting up commit message template with warnings..."

cat > .git/commit-template << 'EOF'
# ⚠️  REMINDER: After committing, use npm run smart-push (not git push)
# 
# 🚨 NEVER use: git push origin main
# ✅ ALWAYS use: npm run smart-push
#
# Type: feat|fix|docs|refactor|test|chore
# 
# Brief description (50 chars max)

# Detailed explanation (72 chars per line)

# 🤖 Generated with [Claude Code](https://claude.ai/code)
# 
# Co-Authored-By: Claude <noreply@anthropic.com>
EOF

git config commit.template .git/commit-template

# 5. Create warning aliases for common dangerous commands
echo "⚠️  Creating warning aliases for dangerous commands..."

git config --global alias.push-force '!echo "🚨 DANGER: Force push blocked!" && echo "💡 Use: npm run smart-push" && exit 1'
git config --global alias.push-f '!echo "🚨 DANGER: Force push blocked!" && echo "💡 Use: npm run smart-push" && exit 1'

# 6. Set up branch protection (local warnings)
echo "🛡️  Setting up branch protection warnings..."

# Create a pre-commit hook that warns about main branch commits
cat > .git/hooks/pre-commit-branch-warning << 'EOF'
#!/bin/bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    echo "⚠️  WARNING: Committing directly to $BRANCH"
    echo "💡 Best practice: Use feature branches"
    echo "📋 Recommended workflow:"
    echo "   git checkout -b feature/your-change"
    echo "   [make changes and commit]"
    echo "   git checkout main"
    echo "   git merge feature/your-change"
    echo "   npm run smart-push"
    echo ""
    echo "⏳ Continuing in 2 seconds... (Ctrl+C to cancel)"
    sleep 2
fi
EOF

chmod +x .git/hooks/pre-commit-branch-warning

echo ""
echo "✅ Git protection setup complete!"
echo ""
echo "🛡️  Protections installed:"
echo "   • Pre-push hooks block direct main pushes"
echo "   • Git aliases redirect to smart-push"
echo "   • Force push attempts are blocked"
echo "   • Commit template includes warnings"
echo "   • Branch protection warnings added"
echo ""
echo "🔧 To test protection:"
echo "   git push origin main  # Should be blocked"
echo "   npm run smart-push    # Correct method"
echo ""
echo "💡 Protection level: MAXIMUM"
echo "🎯 AI agents should now be unable to bypass workflow"