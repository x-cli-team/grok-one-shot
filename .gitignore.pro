# Pro Package .gitignore  
# For: https://github.com/x-cli-team/one-shot-pro (private repo)

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# TypeScript
*.d.ts.map

# Testing
coverage/
.nyc_output/
test-results/

# Environment files (CRITICAL for pro features)
.env
.env.local
.env.development
.env.test
.env.production
*.env

# API Keys and secrets (CRITICAL)
config/secrets.json
auth/
keys/
tokens/
*.key
*.pem
*.p12
*.crt
api-keys.json
credentials.json

# License files (Pro-specific)
license-keys/
activation-codes/
user-licenses/

# Pro features data
pro-cache/
premium-data/
enterprise-config/

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files  
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs (may contain sensitive pro data)
logs/
*.log
audit-logs/
usage-logs/
telemetry/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# NPM package files
*.tgz

# Temporary files
temp/
tmp/
*.tmp
*.temp

# Development files
.cache
.eslintcache
.tscache

# Package managers
.yarn/
.pnpm-debug.log*

# Pro-specific ignores
pro-features/cache/
enterprise/temp/
mcp-enterprise/
swarm-cache/
vision-cache/
history-sync/local/
share-temp/

# Database files (if pro uses local storage)
*.db
*.sqlite
*.sqlite3
data/

# Analytics and tracking (sensitive)
analytics/
metrics/
usage-data/
telemetry-data/

# Security and compliance
security-logs/
compliance-data/
audit-trail/

# Local configuration
config.local.json
settings.local.json
pro.config.local.json