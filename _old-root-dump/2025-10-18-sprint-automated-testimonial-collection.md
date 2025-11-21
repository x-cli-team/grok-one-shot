# Sprint: Automated Testimonial Collection & Auto-Merge System

## 🧭 Sprint Overview

**Objective**: Implement a fully automated testimonial collection system with bot-managed PR workflows and safe auto-merge capabilities for community contributions.

**Duration**: 2-3 days  
**Priority**: Medium (Community Growth)  
**Complexity**: Medium-High

## 🎯 Problem Statement

### Current Community Engagement Gaps
- **No testimonial collection** - User success stories not captured or showcased
- **Manual PR review burden** - All PRs require human review, even simple data additions
- **Community contribution friction** - Non-technical users can't easily share testimonials
- **No social proof** - Landing page lacks user validation and success stories
- **Missed growth opportunities** - Positive user experiences not leveraged for marketing

### Success Metrics
- **Automated testimonial collection** via GitHub Issues and PR workflow
- **Zero-touch auto-merge** for validated testimonial submissions
- **Community showcase** on landing page with real user stories
- **Reduced maintainer burden** through bot-managed workflows
- **Increased community engagement** with easy contribution paths

## 📋 Scope & Deliverables

### 1. Testimonial Data Architecture

#### Schema Definition
```yaml
# data/schemas/testimonial.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["name", "title", "company", "quote", "link", "avatar"],
    "properties": {
      "name": { "type": "string", "maxLength": 50 },
      "title": { "type": "string", "maxLength": 80 },
      "company": { "type": "string", "maxLength": 50 },
      "quote": { "type": "string", "maxLength": 480 },
      "link": { "type": "string", "format": "uri" },
      "avatar": { "type": "string", "format": "uri" },
      "featured": { "type": "boolean", "default": false },
      "tags": {
        "type": "array",
        "items": { "type": "string" },
        "maxItems": 3
      }
    }
  }
}
```

#### Data Structure
```yaml
# data/testimonials.yml
- name: "Alex Chen"
  title: "Senior Software Engineer" 
  company: "TechCorp"
  quote: "Grok CLI transformed my development workflow. The AI assistance is incredible and it never leaves my terminal."
  link: "https://github.com/alexchen"
  avatar: "https://github.com/alexchen.png"
  featured: true
  tags: ["productivity", "ai-assistance", "terminal"]

- name: "Sarah Johnson"
  title: "DevOps Engineer"
  company: "CloudStartup"
  quote: "Finally, an AI coding assistant that works seamlessly with my existing tools. The tool system is brilliant."
  link: "https://linkedin.com/in/sarahjohnson"
  avatar: "https://github.com/sarahj.png" 
  featured: false
  tags: ["devops", "automation", "tools"]
```

### 2. GitHub Issue Form Template

#### Testimonial Submission Form
```yaml
# .github/ISSUE_TEMPLATE/testimonial.yml
name: 📝 Share Your Grok CLI Experience
description: Submit a testimonial about your experience with Grok CLI
title: "[Testimonial] "
labels: ["testimonial", "community"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thanks for using Grok CLI! We'd love to hear about your experience and showcase your story.
        
        **Your testimonial will be:**
        - Reviewed for appropriate content
        - Added to our community showcase
        - Attributed with your name and profile
        
  - type: input
    id: name
    attributes:
      label: Your Name
      description: How you'd like to be credited
      placeholder: "Alex Chen"
    validations:
      required: true
      
  - type: input
    id: title
    attributes:
      label: Job Title
      description: Your current role or position
      placeholder: "Senior Software Engineer"
    validations:
      required: true
      
  - type: input
    id: company
    attributes:
      label: Company/Organization
      description: Where you work or your affiliation
      placeholder: "TechCorp"
    validations:
      required: true
      
  - type: textarea
    id: quote
    attributes:
      label: Your Experience
      description: Tell us about your experience with Grok CLI (max 480 characters)
      placeholder: "Grok CLI transformed my development workflow..."
    validations:
      required: true
      
  - type: input
    id: link
    attributes:
      label: Profile Link
      description: Link to your GitHub, LinkedIn, or personal website
      placeholder: "https://github.com/username"
    validations:
      required: true
      
  - type: checkboxes
    id: consent
    attributes:
      label: Consent
      description: Please confirm you agree to share your testimonial
      options:
        - label: I consent to having my testimonial featured on the Grok CLI website and documentation
          required: true
        - label: I confirm that my testimonial is truthful and based on my actual experience
          required: true
```

### 3. Automated PR Creation Workflow

#### Issue-to-PR Bot
```yaml
# .github/workflows/create-testimonial-pr.yml
name: Create Testimonial PR from Issue

on:
  issues:
    types: [opened]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  create-pr:
    if: contains(github.event.issue.labels.*.name, 'testimonial')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          
      - name: Parse issue and create testimonial entry
        id: parse
        run: |
          node - <<'JS'
          const fs = require('fs');
          const yaml = require('js-yaml');
          
          // Parse issue body (simplified - would need proper parsing)
          const issueBody = `${{ github.event.issue.body }}`;
          const issueNumber = ${{ github.event.issue.number }};
          
          // Extract form data (would implement proper parsing)
          const testimonial = {
            name: "Parsed Name",
            title: "Parsed Title", 
            company: "Parsed Company",
            quote: "Parsed Quote",
            link: "Parsed Link",
            avatar: "https://github.com/username.png",
            featured: false,
            tags: ["community"]
          };
          
          // Load existing testimonials
          let testimonials = [];
          try {
            testimonials = yaml.load(fs.readFileSync('data/testimonials.yml', 'utf8')) || [];
          } catch (e) {
            console.log('Creating new testimonials file');
          }
          
          // Add new testimonial
          testimonials.push(testimonial);
          
          // Write back to file
          fs.writeFileSync('data/testimonials.yml', yaml.dump(testimonials));
          
          console.log(`BRANCH_NAME=testimonial-${issueNumber}`);
          JS
          
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          branch: testimonial-${{ github.event.issue.number }}
          commit-message: "Add testimonial from issue #${{ github.event.issue.number }}"
          title: "Add testimonial: ${{ github.event.issue.title }}"
          body: |
            ## 📝 New Testimonial Submission
            
            **From Issue**: #${{ github.event.issue.number }}
            **Submitted by**: @${{ github.event.issue.user.login }}
            
            ### Automated Checks
            - [ ] Schema validation
            - [ ] Content moderation  
            - [ ] Link verification
            - [ ] File path compliance
            
            This PR was automatically created from a testimonial submission.
            It will auto-merge after passing all validation checks.
            
          labels: |
            testimonial
            automerge
            community
          assignees: ${{ github.event.issue.user.login }}
          
      - name: Close issue with success message
        uses: peter-evans/close-issue@v3
        with:
          issue-number: ${{ github.event.issue.number }}
          comment: |
            🎉 Thank you for your testimonial!
            
            I've automatically created PR #${{ steps.create-pr.outputs.pull-request-number }} with your submission.
            
            **Next steps:**
            - The PR will be automatically validated for content and formatting
            - Once all checks pass, it will be auto-merged
            - Your testimonial will appear on our website within minutes
            
            **Questions?** Feel free to comment on the PR if you need any changes.
```

### 4. Auto-Merge Validation Workflow

#### Testimonial Auto-Merge System
```yaml
# .github/workflows/testimonials-automerge.yml
name: Testimonials Auto-Merge

on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - "data/testimonials.yml"
      - "data/schemas/testimonial.schema.json"

permissions:
  contents: write
  pull-requests: write
  checks: write

jobs:
  validate-and-merge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          
      - run: npm ci
      
      - name: Validate testimonial schema
        run: |
          node - <<'JS'
          const fs = require('fs');
          const yaml = require('js-yaml');
          const Ajv = require('ajv');
          const addFormats = require('ajv-formats');
          
          const ajv = new Ajv();
          addFormats(ajv);
          
          const schema = JSON.parse(fs.readFileSync('data/schemas/testimonial.schema.json', 'utf8'));
          const data = yaml.load(fs.readFileSync('data/testimonials.yml', 'utf8'));
          
          const validate = ajv.compile(schema);
          const valid = validate(data);
          
          if (!valid) {
            console.error('Schema validation failed:', validate.errors);
            process.exit(1);
          }
          
          console.log('✅ Schema validation passed');
          JS
          
      - name: Ensure only allowed files changed
        run: |
          set -e
          CHANGED=$(git diff --name-only origin/${{ github.base_ref }}... | tr '\n' ' ')
          echo "Changed files: $CHANGED"
          
          for f in $CHANGED; do
            case "$f" in
              data/testimonials.yml|data/schemas/testimonial.schema.json) 
                echo "✅ Allowed change: $f"
                ;;
              *) 
                echo "❌ Disallowed change: $f"
                exit 1
                ;;
            esac
          done
          
      - name: Content moderation and validation
        run: |
          node - <<'JS'
          const fs = require('fs');
          const yaml = require('js-yaml');
          const { URL } = require('url');
          
          const data = yaml.load(fs.readFileSync('data/testimonials.yml', 'utf8'));
          
          // Banned words (extend as needed)
          const bannedWords = /\b(spam|scam|fake|test123)\b/i;
          
          // Allowed domains for links
          const allowedHosts = new Set([
            'github.com', 'github.io',
            'linkedin.com',
            'twitter.com', 'x.com',
            'dev.to', 'medium.com',
            'stackoverflow.com',
            'personal-site.dev' // Add approved personal domains
          ]);
          
          for (const testimonial of data) {
            // Length validation
            if (testimonial.quote.length > 480) {
              throw new Error(`Quote too long for ${testimonial.name}: ${testimonial.quote.length} chars`);
            }
            
            // Content moderation
            if (bannedWords.test(testimonial.quote)) {
              throw new Error(`Inappropriate content in quote for ${testimonial.name}`);
            }
            
            // Link validation
            try {
              const url = new URL(testimonial.link);
              const hostname = url.hostname.replace(/^www\./, '');
              
              const isAllowed = Array.from(allowedHosts).some(allowed => 
                hostname === allowed || hostname.endsWith(`.${allowed}`)
              );
              
              if (!isAllowed) {
                console.warn(`⚠️ Non-allowlisted domain: ${hostname} for ${testimonial.name}`);
                // Don't fail, just warn for manual review
              }
            } catch (e) {
              throw new Error(`Invalid URL for ${testimonial.name}: ${testimonial.link}`);
            }
            
            // Required fields validation
            const required = ['name', 'title', 'company', 'quote', 'link'];
            for (const field of required) {
              if (!testimonial[field] || testimonial[field].trim().length === 0) {
                throw new Error(`Missing required field '${field}' for ${testimonial.name}`);
              }
            }
          }
          
          console.log('✅ Content moderation passed');
          JS
          
      - name: Add auto-merge label
        if: success()
        uses: actions-ecosystem/action-add-labels@v1
        with:
          labels: automerge
          
      - name: Enable auto-merge
        if: success()
        uses: peter-evans/enable-pull-request-automerge@v3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          merge-method: squash
          
      - name: Auto-merge when ready
        if: success()
        uses: pascalgn/automerge-action@v0.16.3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MERGE_METHOD: squash
          MERGE_LABELS: automerge
          MERGE_DELETE_BRANCH: "true"
```

### 5. Landing Page Integration

#### Testimonials Component
```tsx
// apps/site/src/components/TestimonialsSection.tsx
import React from 'react';
import styles from './TestimonialsSection.module.css';

interface Testimonial {
  name: string;
  title: string;
  company: string;
  quote: string;
  link: string;
  avatar: string;
  featured?: boolean;
  tags?: string[];
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const featuredTestimonials = testimonials.filter(t => t.featured).slice(0, 3);
  
  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Loved by Developers</h2>
        <p className={styles.sectionSubtitle}>
          See what the community is saying about Grok CLI
        </p>
        
        <div className={styles.testimonialsGrid}>
          {featuredTestimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
        
        <div className={styles.allTestimonials}>
          <a href="/community/testimonials" className={styles.viewAllLink}>
            View All Testimonials →
          </a>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className={styles.testimonialCard}>
      <div className={styles.quote}>"{testimonial.quote}"</div>
      
      <div className={styles.author}>
        <img 
          src={testimonial.avatar} 
          alt={testimonial.name}
          className={styles.avatar}
        />
        <div className={styles.authorInfo}>
          <div className={styles.name}>{testimonial.name}</div>
          <div className={styles.title}>
            {testimonial.title} at {testimonial.company}
          </div>
        </div>
      </div>
      
      {testimonial.tags && (
        <div className={styles.tags}>
          {testimonial.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 🔧 Technical Implementation

### Branch Protection Configuration

#### Repository Settings (Fully Automated)
```yaml
# Required branch protection rules for main branch
Branch: main
- Require status checks to pass before merging: ✅
- Require branches to be up to date before merging: ✅
- Status checks: "validate-and-merge"
- Allow auto-merge: ✅
- Automatically delete head branches: ✅
- Require pull request reviews: ❌ (disabled for data/** paths)

# Path-based rules using GitHub Rulesets (Recommended)
Ruleset: Testimonial Auto-merge
- Target: data/testimonials.yml, data/schemas/testimonial.schema.json
- Bypass: Pull request reviews (not required)
- Require: Status checks must pass
- Allow: Auto-merge without human approval
- Delete: Branches automatically after merge
```

### Validation Scripts

#### Package.json Scripts
```json
{
  "scripts": {
    "testimonials:validate": "node scripts/validate-testimonials.js",
    "testimonials:build": "node scripts/build-testimonials-page.js",
    "testimonials:moderate": "node scripts/moderate-content.js"
  }
}
```

#### Validation Script
```js
// scripts/validate-testimonials.js
const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

async function validateTestimonials() {
  try {
    // Load schema and data
    const schema = JSON.parse(fs.readFileSync('data/schemas/testimonial.schema.json', 'utf8'));
    const testimonials = yaml.load(fs.readFileSync('data/testimonials.yml', 'utf8'));
    
    // Validate against schema
    const ajv = new Ajv();
    addFormats(ajv);
    const validate = ajv.compile(schema);
    
    if (!validate(testimonials)) {
      console.error('❌ Schema validation failed:', validate.errors);
      process.exit(1);
    }
    
    // Additional validations
    const names = new Set();
    for (const testimonial of testimonials) {
      // Check for duplicates
      if (names.has(testimonial.name)) {
        throw new Error(`Duplicate testimonial from ${testimonial.name}`);
      }
      names.add(testimonial.name);
      
      // Validate URLs
      try {
        new URL(testimonial.link);
        new URL(testimonial.avatar);
      } catch (e) {
        throw new Error(`Invalid URL for ${testimonial.name}: ${e.message}`);
      }
    }
    
    console.log('✅ All testimonials validated successfully');
    console.log(`📊 Total testimonials: ${testimonials.length}`);
    console.log(`⭐ Featured testimonials: ${testimonials.filter(t => t.featured).length}`);
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

validateTestimonials();
```

## 📅 Implementation Timeline

### Phase 1: Infrastructure Setup (Day 1)
- **4 hours**: Create testimonial schema and data structure
- **2 hours**: Set up GitHub Issue template for submissions
- **2 hours**: Configure branch protection and repository settings

### Phase 2: Automation Workflows (Day 2)
- **4 hours**: Implement issue-to-PR automation workflow
- **4 hours**: Build validation and auto-merge system
- **2 hours**: Test end-to-end flow with sample data

### Phase 3: UI Integration (Day 3)
- **3 hours**: Create testimonials React component
- **2 hours**: Integrate with landing page
- **2 hours**: Build dedicated testimonials page
- **1 hour**: Style and responsive design

## 🎯 Acceptance Criteria

### Automated Workflow
- [ ] **GitHub Issue form** accepts testimonial submissions
- [ ] **Bot automatically creates PR** from issue within 2 minutes
- [ ] **Schema validation** passes for correctly formatted testimonials
- [ ] **Content moderation** blocks inappropriate content
- [ ] **Auto-merge** works for valid testimonial PRs
- [ ] **Branch protection** prevents manual circumvention

### Content Management
- [ ] **Testimonial schema** validates all required fields
- [ ] **Data structure** supports featured testimonials and tagging
- [ ] **Link validation** ensures working profile URLs
- [ ] **Avatar handling** supports GitHub avatars and custom images
- [ ] **Character limits** prevent overly long quotes

### User Experience
- [ ] **Landing page** displays featured testimonials attractively
- [ ] **Testimonials page** shows all community feedback
- [ ] **Responsive design** works on mobile and desktop
- [ ] **Loading performance** doesn't impact page speed
- [ ] **Accessibility** meets WCAG guidelines

### Community Integration
- [ ] **Easy submission** via GitHub Issues (no technical knowledge required)
- [ ] **Fast turnaround** from submission to live (under 10 minutes)
- [ ] **Attribution** links back to contributor profiles
- [ ] **Spam protection** prevents abuse while remaining open
- [ ] **Community showcase** encourages more contributions

## 🌐 Community Impact

### Growth Metrics
- **Social Proof**: Real user testimonials increase conversion rates
- **Community Engagement**: Easy contribution path encourages participation  
- **SEO Benefits**: User-generated content improves search rankings
- **Developer Trust**: Transparent feedback builds credibility

### Success Indicators
- **Submission Rate**: 5+ testimonials per month
- **Auto-merge Success**: 95%+ automated processing
- **Community Growth**: Increased GitHub stars and Discord members
- **User Adoption**: Higher download and usage metrics

## 🔗 Related Resources

### GitHub Actions Documentation
- **Auto-merge Actions**: https://github.com/marketplace/actions/enable-pull-request-automerge
- **Issue Forms**: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms
- **Branch Protection**: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests

### Community Examples
- **Testimonial Systems**: React.js, Next.js community showcases
- **Auto-merge Patterns**: Dependabot, Renovate workflows
- **Content Moderation**: Community-driven validation approaches

---

**Sprint Status**: Ready for implementation  
**Estimated Effort**: 2-3 days (20 hours)  
**Risk Level**: Medium (workflow automation complexity)  
**User Impact**: High (community growth and social proof)

## 🚀 Implementation Strategy: Fully Automated

### Zero-Touch Auto-Merge Approach
- **No human approval required** for testimonial PRs
- **Complete bot-managed workflow** from submission to live
- **Fastest turnaround time** (under 10 minutes submission-to-publish)
- **Scales automatically** with community growth
- **Security through automation** with comprehensive validation

### Key Automation Features
- **Schema validation** ensures data integrity
- **Content moderation** filters inappropriate submissions  
- **Link verification** validates profile URLs and avatars
- **Spam protection** through domain allowlists and rate limiting
- **Atomic operations** with automatic rollback on validation failure

### Risk Mitigation
- **Multi-layer validation** catches issues before merge
- **Audit trail** maintains full history of all changes
- **Easy rollback** if any issues are discovered post-merge
- **Community self-policing** through transparent process
- **Monitoring alerts** for unusual submission patterns

**Rationale**: Testimonials are low-risk, high-value content that benefits from zero-friction contribution. The comprehensive validation pipeline ensures quality while maintaining speed and accessibility for non-technical community members.