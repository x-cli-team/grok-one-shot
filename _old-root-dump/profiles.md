---
title: Configuration Profiles
---
# Configuration Profiles

**Status:** Planned Feature (TBD)

## Overview

Multiple configuration profiles for different projects, environments, or use cases with easy switching between profiles.

## Planned Features

- **Profile management** - Create, edit, delete profiles
- **Profile switching** - Quick profile activation
- **Per-project profiles** - Auto-detect project config
- **Profile inheritance** - Base profiles with overrides
- **Profile sharing** - Team profile templates
- **Profile validation** - Verify profile settings
- **Profile export/import** - Portable configurations
- **Environment-specific** - Dev, staging, prod profiles

### Example Profiles

```bash
# Work profile
grok --profile work

# Personal projects
grok --profile personal

# Fast/cheap mode
grok --profile fast

# Quality/thorough mode
grok --profile quality
```

## Roadmap

- **Q3-Q4 2025:** Sprint 27-30 - Advanced configuration features

**Priority:** P2 - UX enhancement

## Current Capabilities

- Single global configuration
- Environment variables for overrides
- No profile system

---

**Check back Q3 2025 for configuration profiles.**