#!/bin/bash

# Setup git aliases to redirect dangerous commands to safe ones
echo "🔧 Setting up safe git aliases..."

# Override dangerous push commands
git config alias.push-main '!echo "🚨 Use smart push instead: npm run smart-push" && false'
git config alias.po '!echo "🚨 Use smart push instead: npm run smart-push" && false'

# Add helpful aliases
git config alias.pushup '!npm run smart-push'
git config alias.smart-push '!npm run smart-push'
git config alias.safe-push '!npm run smart-push'

echo "✅ Git aliases configured:"
echo "   git pushup        → npm run smart-push"
echo "   git smart-push    → npm run smart-push" 
echo "   git safe-push     → npm run smart-push"
echo ""
echo "🚨 Blocked commands:"
echo "   git push-main     → Shows warning"
echo "   git po            → Shows warning"
echo ""
echo "💡 Always use 'npm run smart-push' for main branch pushes"