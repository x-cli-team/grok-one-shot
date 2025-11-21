# Sprint: Documentation Website with Vercel Deployment

## 🧭 Sprint Overview

**Objective**: Create a comprehensive public documentation + landing site for x-cli using Docusaurus, with automated synchronization from the `.agent` documentation system.

**Duration**: 1-2 days  
**Priority**: Medium (Developer Experience)  
**Complexity**: Medium

## 🎯 Problem Statement

### Current Documentation Gaps
- **No public landing page** - Users discover x-cli through NPM or GitHub only
- **Scattered documentation** - README is comprehensive but not discoverable
- **No community hub** - No central place for users to find help and resources
- **Poor SEO** - Documentation not indexed or searchable
- **Manual sync burden** - `.agent` docs are comprehensive but not public-facing
- **Duplication risk** - Multiple documentation sources can become inconsistent

### Success Metrics
- **Public documentation site** live on custom domain
- **Automated sync** from `.agent` folder to public docs
- **Always-current documentation** - no manual updates needed
- **Improved discoverability** through search engines
- **Community engagement** via Discord integration
- **Developer onboarding** streamlined with clear docs flow

## 📋 Scope & Deliverables

### 1. Monorepo Setup
```
grok-cli-hurry-mode/
├── apps/
│   └── site/                    # New docs site
│       ├── pages/
│       ├── theme.config.tsx
│       ├── package.json
│       └── next.config.js
├── pnpm-workspace.yaml          # Workspace config
├── package.json                 # Root scripts
└── [existing files]
```

#### Workspace Configuration
- **Add `apps/site`** as Next.js + Nextra docs app
- **Configure `pnpm-workspace.yaml`** for monorepo structure
- **Add dev scripts** for local development (`pnpm dev:site`)

### 2. Documentation Site (`apps/site`)

#### Core Technology Stack
- **Framework**: Docusaurus (Meta/Facebook)
- **Documentation**: MDX with React components
- **Styling**: Built-in Docusaurus theming + customization
- **Deployment**: Vercel static export
- **Sync System**: Custom Node.js scripts for `.agent` integration

#### Site Structure (.agent Synchronized)
```
apps/site/
├── docs/                       # Auto-synced from .agent
│   ├── overview.md             # ← .agent/README.md
│   ├── getting-started/
│   │   ├── installation.md     # ← .agent/system/installation.md
│   │   └── quickstart.md       # New content
│   ├── architecture/
│   │   ├── overview.md         # ← .agent/system/architecture.md
│   │   ├── current-state.md    # ← .agent/system/critical-state.md
│   │   └── api-schema.md       # ← .agent/system/api-schema.md
│   ├── guides/
│   │   ├── releases.md         # ← .agent/sop/release-management.md
│   │   ├── automation.md       # ← .agent/sop/automation-protection.md
│   │   └── troubleshooting.md  # ← .agent/sop/npm-publishing-troubleshooting.md
│   ├── roadmap.md              # Generated from .agent/tasks/
│   └── changelog.md            # Generated from releases
├── blog/                       # Release announcements
├── src/
│   ├── pages/
│   │   └── index.js            # Landing page
│   └── scripts/
│       └── sync-agent-docs.js  # Sync automation
└── docusaurus.config.js        # Docusaurus configuration
```

#### Content Strategy & .agent Integration
- **Automated sync**: `.agent` docs automatically transform to public docs
- **Single source of truth**: `.agent` remains authoritative, public docs derived
- **Content filtering**: Internal/sensitive content filtered for public consumption
- **Dynamic generation**: Roadmap and feature status auto-generated from `.agent/tasks/`
- **Always current**: Documentation reflects latest project state

#### Content Transformation Pipeline
```js
// Sync workflow
.agent/README.md → docs/overview.md (add frontmatter, rewrite links)
.agent/system/ → docs/architecture/ (filter internal refs)
.agent/sop/ → docs/guides/ (public-appropriate content)
.agent/tasks/ → docs/roadmap.md (curated roadmap generation)
```

### 3. UI/UX Design

#### Branding & Theme (Docusaurus)
```js
// docusaurus.config.js
module.exports = {
  title: 'Grok CLI',
  tagline: 'Claude Code-level intelligence in your terminal',
  favicon: 'img/favicon.ico',
  url: 'https://docs.grok-cli.dev',
  baseUrl: '/',
  
  themeConfig: {
    navbar: {
      title: 'Grok CLI',
      logo: {
        alt: 'Grok CLI Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://discord.com/channels/1315720379607679066/1315822328139223064',
          label: 'Discord',
          position: 'right',
        },
        {
          href: 'https://github.com/hinetapora/grok-cli-hurry-mode',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Grok CLI. Built with Docusaurus.`,
    },
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
  },
  
  plugins: [
    require('./src/plugins/sync-agent-docs'), // Custom sync plugin
  ],
};
```

#### Features
- **Dark/light mode toggle** (default: dark)
- **Responsive design** for mobile/desktop
- **Discord integration** in header
- **GitHub link** for contributions
- **Search functionality** (built-in Nextra)

### 4. Content Migration & Creation

#### From Existing Sources
- **README.md** → `/docs/overview.mdx` + `/docs/quickstart.mdx`
- **Installation section** → `/docs/quickstart.mdx`
- **Troubleshooting** → `/docs/guides/troubleshooting.mdx`
- **Automation docs** → `/docs/guides/automation.mdx`
- **Existing page.tsx** → `src/pages/index.js` (adapted for Grok CLI)

#### Landing Page Adaptation
The existing `page.tsx` provides:
- **Modern gradient design** - Professional, eye-catching visual appeal
- **Responsive layout** - Mobile and desktop optimized
- **Component structure** - Reusable buttons, navigation, hero sections

**Required Customization**:
```jsx
// Updated content for Grok CLI
<h1>Claude Code-Level Intelligence in Your Terminal</h1>
<ChipBtn variant="solid" label="npm install -g grok-cli-hurry-mode@latest" />

// Updated navigation
<NavLink>Docs</NavLink>
<NavLink>Roadmap</NavLink>
<NavLink>Discord</NavLink>

// Grok CLI branding
<LogoMark /> // Replace with Grok CLI logo
```

#### New Content
- **Feature showcase** - P1-P3 tools with examples
- **API reference** - Comprehensive command documentation
- **Changelog** - Release notes and version history

#### Content Structure Example
```mdx
---
title: Quick Start
description: Get up and running with Grok CLI in minutes
---

# Quick Start

Get up and running with Grok CLI in minutes.

## Installation

```bash
npm install -g grok-cli-hurry-mode@latest
```

## Setup

1. **Get your API key** from [X.AI](https://x.ai)
2. **Set environment variable**:
   ```bash
   export GROK_API_KEY=your_api_key_here
   ```
3. **Start chatting**:
   ```bash
   grok
   ```

## Next Steps

- [Explore Features](/docs/features)
- [Advanced Configuration](/docs/api/configuration)
- [Join our Discord](https://discord.com/channels/1315720379607679066/1315822328139223064)
```

### 5. Deployment Configuration

#### Vercel Setup
```js
// next.config.js
const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
});

module.exports = withNextra({
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
});
```

#### Domain & DNS
- **Primary option**: `docs.grok-cli.dev`
- **Alternative**: `grok-cli.dev` (with docs subdirectory)
- **Fallback**: Vercel subdomain (`grok-cli-docs.vercel.app`)

#### Build & Deploy
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next build && next export"
  }
}
```

## 🔧 Technical Implementation

### Project Structure Setup

#### 1. Initialize Monorepo
```bash
# Create apps directory
mkdir apps

# Initialize docs site
cd apps
npx create-next-app@latest site --typescript --tailwind --eslint --app
cd site

# Install Nextra
npm install nextra nextra-theme-docs

# Configure Next.js for Nextra
```

#### 2. Workspace Configuration
```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
# Root package.json scripts
{
  "scripts": {
    "dev:site": "cd apps/site && npm run dev",
    "build:site": "cd apps/site && npm run build",
    "export:site": "cd apps/site && npm run export"
  }
}
```

### Content Creation Workflow

#### 1. Extract from README
- Convert markdown sections to MDX
- Add frontmatter metadata
- Split large sections into focused pages
- Add cross-references and navigation

#### 2. Create New Content
- Landing page with value proposition
- Feature comparison table
- API reference with examples
- Community guidelines

#### 3. Optimize for SEO
- Add meta descriptions
- Use semantic heading structure
- Include relevant keywords
- Add structured data markup

### Deployment Process

#### 1. Vercel Project Setup (Subfolder Deployment)

**Step 1: Create New Vercel Project**
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import GitHub repo: `hinetapora/grok-cli-hurry-mode`

**Step 2: Configure Subfolder Settings**
```
Framework Preset: Docusaurus
Root Directory: apps/site
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

**Step 3: Advanced Settings**
```
Node.js Version: 18.x
Environment Variables: (none required for static site)
Build & Development Settings:
  - Root Directory: apps/site
  - Build Command: npm run build
  - Output Directory: build
  - Install Command: npm install
```

**Step 4: Deploy Settings**
```yaml
# vercel.json (in apps/site/)
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install",
  "framework": "docusaurus2"
}
```

#### 2. Domain Configuration
- **Primary option**: `docs.grok-cli.dev`
- **Alternative**: `grok-cli.dev/docs` (subdirectory)
- **Fallback**: `grok-cli-docs.vercel.app`

**DNS Setup** (if using custom domain):
```
Type: CNAME
Name: docs (or @)
Value: cname.vercel-dns.com
```

#### 3. Auto-deployment Configuration
- **Deploy trigger**: Push to main branch
- **Build context**: Only when `apps/site/` changes
- **Preview deployments**: Enabled for PRs
- **Environment variables**: None required (static site)

#### 4. Build Optimization
```js
// apps/site/docusaurus.config.js
module.exports = {
  // ... other config
  
  // Vercel-specific optimizations
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  
  // Static export for Vercel
  staticDirectories: ['static'],
  
  // Build performance
  future: {
    experimental_faster: true,
  }
};
```

## 📅 Implementation Timeline

### Phase 1: Setup & Sync System (4 hours)
- **1 hour**: Create monorepo structure and initialize Docusaurus
- **1 hour**: Build .agent sync pipeline and content transformation
- **1 hour**: Configure workspace scripts and automation
- **1 hour**: Test sync system and validate transformations

### Phase 2: Content & Integration (3 hours)
- **30 min**: Adapt existing page.tsx as landing page and blog setup
- **1 hour**: Implement automatic roadmap generation
- **1 hour**: Configure sidebars and navigation
- **30 min**: Customize landing page content for Grok CLI branding

### Phase 3: Deployment (1 hour)
- **30 min**: Configure Vercel project (subfolder setup, build settings)
- **20 min**: Set up custom domain and DNS configuration  
- **10 min**: Test deployment pipeline and validate build

### Phase 4: Validation & Polish (1 hour)
- **30 min**: Test sync pipeline end-to-end
- **15 min**: Verify all .agent content transforms correctly
- **15 min**: Final review and link validation

## 🎯 Acceptance Criteria

### Technical Requirements
- [ ] **Docusaurus site** builds and deploys on Vercel
- [ ] **.agent sync pipeline** automatically transforms content
- [ ] **Documentation pages** load with proper sidebar navigation
- [ ] **Automated roadmap** generates from .agent/tasks/
- [ ] **Search functionality** works across all content
- [ ] **Mobile responsive** design on all devices
- [ ] **No runtime errors** or missing assets
- [ ] **Total bundle size** < 20 MB for static export

### Content Requirements  
- [ ] **.agent content** successfully synced and transformed
- [ ] **Internal references** filtered for public consumption
- [ ] **Dynamic roadmap** reflects current project status
- [ ] **Complete installation guide** with troubleshooting
- [ ] **Architecture documentation** accessible to users
- [ ] **Community links** prominently displayed
- [ ] **Automated changelog** with recent releases

### User Experience
- [ ] **Fast loading** (<3 seconds initial load)
- [ ] **Intuitive navigation** with clear information architecture
- [ ] **Discord integration** visible and functional
- [ ] **GitHub links** for contributions and issues
- [ ] **Dark mode** as default with light mode toggle

### SEO & Discoverability
- [ ] **Meta tags** for all pages
- [ ] **Sitemap** generated automatically
- [ ] **Robots.txt** configured
- [ ] **Google indexing** verified

## 🌐 Example Site Map

```
/ (Landing)
├── /docs/
│   ├── overview
│   ├── quickstart
│   ├── features
│   ├── /api/
│   │   ├── commands
│   │   ├── tools
│   │   └── configuration
│   ├── /guides/
│   │   ├── getting-started
│   │   ├── automation
│   │   └── troubleshooting
│   └── changelog
└── /community (external Discord link)
```

## 📚 Content Migration Matrix

| Source | Target | Status |
|--------|--------|--------|
| README.md intro | `/index.mdx` | New content |
| README.md installation | `/docs/quickstart.mdx` | Direct migration |
| README.md features | `/docs/features.mdx` | Enhanced |
| README.md troubleshooting | `/docs/guides/troubleshooting.mdx` | Direct migration |
| .agent/sop/release-management.md | `/docs/guides/automation.mdx` | Adapted |
| Package.json scripts | `/docs/api/commands.mdx` | New content |
| Tool system docs | `/docs/api/tools.mdx` | New content |

## 🔗 Related Resources

### Documentation References
- **Nextra Documentation**: https://nextra.site/
- **Next.js 14 Docs**: https://nextjs.org/docs
- **Vercel Deployment**: https://vercel.com/docs

### Design Inspiration
- **X.AI Docs**: https://docs.x.ai/
- **Claude Docs**: https://docs.anthropic.com/
- **GitHub Docs**: https://docs.github.com/

### Community Integration
- **Discord Server**: https://discord.com/channels/1315720379607679066/1315822328139223064
- **GitHub Issues**: https://github.com/hinetapora/grok-cli-hurry-mode/issues

---

**Sprint Status**: ✅ COMPLETED (October 18, 2025)  
**Actual Effort**: 1 day (8 hours)  
**Risk Level**: Medium (custom sync system complexity)  
**User Impact**: High (automated docs + improved discovery)

## ✅ Completion Summary

**Delivered Features:**
- ✅ Comprehensive documentation website with Docusaurus
- ✅ Copy-to-clipboard functionality for install commands  
- ✅ Detailed tools documentation (12 core/advanced tools)
- ✅ Enhanced roadmap with Claude Code parity goals
- ✅ Fixed external navigation links (Discord/GitHub)
- ✅ Vercel deployment pipeline working
- ✅ Responsive design with dark/light mode
- ✅ Hero video integration and landing page optimization

**Key Achievements:**
- Documentation site live and accessible
- All major sections populated with comprehensive content
- Professional landing page with modern UX
- Community links working and functional
- SEO optimized with proper meta tags
- Mobile responsive across all devices

**Final Status**: Production ready and deployed ✅

## 🔧 Key Technical Implementation

### .agent Sync Pipeline
```js
// src/plugins/sync-agent-docs.js
module.exports = function() {
  return {
    name: 'sync-agent-docs',
    loadContent: async () => {
      const agentDocs = await syncAgentDocs();
      return agentDocs;
    },
    contentLoaded: async ({content, actions}) => {
      const {createData} = actions;
      await createData('agent-docs.json', JSON.stringify(content));
    }
  };
};
```

### Content Transformation
```js
function transformAgentDoc(filePath, content) {
  // Add Docusaurus frontmatter
  // Rewrite internal .agent links to public docs
  // Filter sensitive/internal content
  // Add user-friendly context
  return transformedContent;
}
```

### Automated Roadmap Generation
```js
function generateRoadmap() {
  const taskFiles = glob.sync('.agent/tasks/*.md');
  const roadmapData = taskFiles.map(parseTaskFile);
  return renderRoadmapPage(roadmapData);
}
```