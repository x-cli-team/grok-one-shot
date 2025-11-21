# Export and Import

**Status:** 🔮 Planned Feature (TBD)

## Overview

Export sessions, configurations, and work artifacts to various formats, and import them for sharing or backup.

## Planned Features

### Export Capabilities

- **Session export** - Markdown, JSON, HTML, PDF formats
- **Configuration export** - Portable settings files
- **Code changes export** - Git patch, diff formats
- **Report generation** - Formatted analysis reports
- **Documentation export** - Generate docs from sessions
- **Shareable links** - Web-viewable session exports
- **Archive export** - Complete project snapshots

### Import Capabilities

- **Configuration import** - Load settings from file
- **Session import** - Restore shared sessions
- **Template import** - Load workflow templates
- **Macro import** - Import automation scripts
- **Profile import** - Team configuration profiles

### Export Formats

```bash
# Export session
grok export --format markdown > session-report.md
grok export --format html > session-report.html
grok export --format json > session-data.json

# Export configuration
grok config export > team-config.json

# Export code changes
grok export --changes-only > changes.patch

# Generate report
grok export --report --template security-audit
```

## Roadmap

- **Q3-Q4 2025:** Sprint 27-30 - Advanced features including export/import

**Priority:** P2 - Collaboration and sharing

## Current Capabilities

- ✅ Session files in JSON format
- ✅ Manual file copying
- ⚠️ No built-in export commands

## Workaround

```bash
# Manual export
cat ~/.grok/sessions/latest.json | jq '.messages[] | "## \(.role)\n\n\(.content)\n"' > session.md

# Copy configuration
cp ~/.grok/settings.json team-settings.json
```

---

**Check back Q3 2025 for export/import features.**
