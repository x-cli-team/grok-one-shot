---
title: Cloud Sync
---

# Cloud Sync

**Status:** Planned Feature (TBD)

## Overview

Optional cloud synchronization for settings, sessions, and configurations across devices with privacy controls.

## Planned Features

### Sync Capabilities

- **Settings sync** - Configuration across devices
- **Session sync** - Access sessions anywhere
- **History sync** - Conversation history
- **Template sync** - Shared code templates
- **Profile sync** - Configuration profiles
- **MCP server config** - Server configurations
- **Selective sync** - Choose what to sync

### Privacy and Security

- **End-to-end encryption** - Client-side encryption
- **Privacy controls** - Choose what to sync
- **Data retention** - Configurable retention policies
- **Local-first** - Works offline, syncs when connected
- **Self-hosted option** - Own infrastructure
- **Compliance** - GDPR, SOC 2 compliant
- **Audit logs** - Track sync activity

### Team Features

- **Team workspaces** - Shared team environments
- **Shared configurations** - Team-wide settings
- **Session sharing** - Collaborate on sessions
- **Knowledge base** - Shared learnings
- **Access controls** - Role-based permissions
- **Organization management** - Multi-team support

### Usage

```bash
# Enable cloud sync
grok cloud login

# Configure sync
grok cloud sync enable
grok cloud sync configure

# Choose what to sync
grok cloud sync select settings sessions

# Manual sync
grok cloud sync now

# View sync status
grok cloud status

# Self-hosted setup
grok cloud configure --endpoint https://your-server.com
```

## Roadmap

- **Q3-Q4 2025:** Sprint 27-30 - Platform enhancements

**Priority:** P2 - Team collaboration feature

## Current State

- No cloud sync (fully local)
- Manual file sharing possible
- Git for configuration sharing

## Privacy Note

Cloud sync will be **opt-in only** with:

- Full privacy controls
- End-to-end encryption
- Self-hosted option
- Complete local mode (default)

---

**Check back Q3 2025 for cloud sync.**

**Privacy first:** Grok One-Shot remains fully functional without cloud sync.
