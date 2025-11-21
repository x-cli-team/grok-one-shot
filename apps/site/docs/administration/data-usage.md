---
title: Data usage
---

# Data usage

> Learn about xAI's data usage policies for Grok One-Shot

## Data policies

### Data training policy

**xAI Grok API users**: xAI's data usage policies apply to all data sent through the Grok API. When using Grok One-Shot with your xAI API key, your prompts and model outputs are handled according to [xAI's Privacy Policy](https://x.ai/legal/privacy-policy).

According to xAI's current policies:

- **API Usage**: Data sent to the Grok API may be used to improve xAI's models and services
- **Data Retention**: xAI retains API data according to their standard retention policies
- **Control**: API users should review xAI's terms of service and privacy policy for full details

> **Parity Gap**: Unlike Claude Code's granular consumer/commercial data controls, Grok One-Shot relies entirely on xAI's API-level data policies. There are currently no opt-out mechanisms within Grok One-Shot itself.

### Development Partner Program

> **Parity Gap**: xAI does not currently offer a public Development Partner Program equivalent to Anthropic's. All API usage is governed by standard xAI API terms.

### Feedback using the `/bug` command

> **Parity Gap**: Grok One-Shot does not currently implement a `/bug` command. Bug reporting is handled through standard GitHub issues.

If you encounter bugs:

1. File an issue in the GitHub repository
2. Include relevant session logs from `~/.grok/sessions/` (after sanitizing sensitive data)
3. Do not include credentials or sensitive code in bug reports

### Session quality surveys

> **Parity Gap**: Grok One-Shot does not currently implement session quality surveys or rating prompts.

**Current status**:

- No "How is Grok doing this session?" prompt
- No automatic feedback collection
- No session ratings
- Manual feedback welcome via GitHub issues

### Data retention

Grok One-Shot data retention varies by storage location.

**Local storage (on your machine)**:

- Sessions stored indefinitely in `~/.grok/sessions/`
- Settings stored in `~/.grok/settings.json`
- You have full control to view, archive, or delete
- No automatic cleanup or retention limits

**API-level retention (xAI)**:

- Data sent to xAI's API is subject to xAI's retention policies
- Review [xAI's Privacy Policy](https://x.ai/legal/privacy-policy) for details
- No zero data retention option currently available
- No tiered retention based on account type

> **Parity Gap**: Unlike Claude Code which offers consumer (5-year or 30-day) and commercial (30-day or ZDR) retention tiers, Grok One-Shot relies on xAI's uniform API retention policy.

**Comparison to Claude Code**:

| Feature                 | Claude Code  | Grok One-Shot  |
| ----------------------- | ------------ | -------------- |
| Consumer data controls  | Opt-in/out   | API-level only |
| 30-day retention option |              | Per xAI policy |
| Zero data retention     | (commercial) |                |
| Local session control   | Configurable | Manual cleanup |

For full details, please review [xAI's Terms of Service](https://x.ai/legal/terms-of-service) and [Privacy Policy](https://x.ai/legal/privacy-policy).

## Data flow and dependencies

```
┌─────────────┐
│ User │
│ Terminal │
└──────┬──────┘
│
│ Local file system access
│ (reads code, writes edits)
│
┌──────▼──────────────────────┐
│ Grok One-Shot (Local CLI) │
│ - React/Ink UI │
│ - GrokAgent core │
│ - Session management │
│ - Local file operations │
└──────┬──────────────────────┘
│
│ HTTPS (TLS encrypted)
│ Prompts, code context, model outputs
│
┌──────▼──────────────────────┐
│ xAI Grok API │
│ https://api.x.ai │
│ - grok-4-fast-non-reasoning│
│ - grok-reasoning-24-11 │
│ - Other Grok models │
└─────────────────────────────┘
```

Grok One-Shot is installed from [NPM](https://www.npmjs.com/package/@xagent/one-shot). Grok One-Shot runs entirely locally on your machine. In order to interact with the LLM, Grok One-Shot sends data over the network. This data includes all user prompts, code context, and model outputs. The data is encrypted in transit via TLS and is not encrypted at rest (stored locally in `~/.grok/`).

Grok One-Shot is compatible with most popular VPNs and LLM proxies (configure via `GROK_BASE_URL` environment variable).

Grok One-Shot is built on xAI's APIs. For details regarding the API's security controls and logging procedures, please refer to [xAI's security documentation](https://x.ai/legal/security).

### Cloud execution

> **Parity Gap**: Grok One-Shot does not currently support cloud-based execution. All sessions run locally on your machine.

**Claude Code on the web** (Anthropic's cloud offering) includes:

- Sessions run in Anthropic-managed VMs
- Repository cloning to isolated VMs
- GitHub credential proxy
- Network traffic security proxy
- Automatic VM cleanup after sessions

**Grok One-Shot** currently:

- Runs entirely locally
- All code stays on your machine
- Direct API calls to xAI only
- No cloud VM execution option
- No web-based sessions
- No remote execution capabilities

This may change in future versions. Track cloud execution requests in GitHub issues.

## Telemetry services

> **Parity Gap**: Grok One-Shot does not currently implement telemetry, error reporting, or analytics services.

**Claude Code telemetry**:

- Statsig for operational metrics (latency, reliability, usage patterns)
- Sentry for error logging
- `/bug` command for feedback
- Session quality surveys
- Opt-out via environment variables

**Grok One-Shot telemetry**:

- No Statsig telemetry
- No Sentry error logging
- No operational metrics collection
- No `/bug` command
- No session surveys
- All operations are local-only (except Grok API calls)

**Privacy benefit**: Grok One-Shot does not send any operational data, metrics, or error logs to third-party services. The only network traffic is:

1. API calls to the configured Grok API endpoint (default: `https://api.x.ai`)
2. Optional MCP server connections (if configured)
3. NPM package installation/updates

**No opt-out needed**: Since there is no telemetry, there are no environment variables to disable it.

## Default behaviors by API provider

Grok One-Shot only supports the xAI Grok API. There are no Bedrock or Vertex integrations.

> **Parity Gap**: Unlike Claude Code which supports multiple API providers (Anthropic, AWS Bedrock, Google Vertex), Grok One-Shot only supports xAI's Grok API.

**Claude Code API provider matrix**:

| Service           | Claude API | Vertex API  | Bedrock API |
| ----------------- | ---------- | ----------- | ----------- |
| Statsig (Metrics) | Default on | Default off | Default off |
| Sentry (Errors)   | Default on | Default off | Default off |
| `/bug` reports    | Default on | Default off | Default off |

**Grok One-Shot**:

| Service             | Grok API (xAI)                               |
| ------------------- | -------------------------------------------- |
| Telemetry (Metrics) | Not implemented                              |
| Error Reporting     | Not implemented                              |
| Bug Reports         | Manual via GitHub issues                     |
| Data Retention      | Per xAI API policies + local session storage |
| Cloud Execution     | Not supported                                |

Environment variables like `DISABLE_TELEMETRY`, `DISABLE_ERROR_REPORTING`, and `DISABLE_BUG_COMMAND` are not needed since these features don't exist.

## Privacy considerations

### What Grok One-Shot sends to xAI

When using Grok One-Shot, the following data is sent to xAI's API:

- Your prompts and messages
- Code context (file contents you reference or edit)
- Tool usage and results (file reads, bash commands, etc.)
- Conversation history (for maintaining context)

### What Grok One-Shot stores locally

- Full session transcripts in `~/.grok/sessions/`
- API key in `~/.grok/settings.json`
- MCP server configurations
- User preferences and settings

### What Grok One-Shot does NOT do

- Send telemetry or metrics to third parties
- Report errors to external services
- Upload code or sessions to any service (except xAI API)
- Track usage patterns or analytics
- Create cloud backups

### Security recommendations

1. Keep your `GROK_API_KEY` secure (use `chmod 600 ~/.grok/settings.json`)
2. Review session files before sharing (they contain full conversation history)
3. Use `.gitignore` for `~/.grok/` directory
4. Sanitize logs before including in bug reports
5. Review xAI's privacy policy periodically
6. Regularly clean up old sessions: `rm ~/.grok/sessions/*.json`

## Comparison to Claude Code

### Feature parity summary

| Feature                         | Claude Code           | Grok One-Shot   | Status             |
| ------------------------------- | --------------------- | --------------- | ------------------ |
| **Data Training Control**       | Consumer opt-in/out   | API-level only  | Parity gap         |
| **Commercial Terms**            | Team/Enterprise       | API uniform     | Parity gap         |
| **Development Partner Program** |                       |                 | Parity gap         |
| **`/bug` Command**              |                       |                 | Parity gap         |
| **Session Surveys**             |                       |                 | Parity gap         |
| **Tiered Retention**            | 5yr/30d/ZDR           | API policy      | Parity gap         |
| **Cloud Execution**             | (web)                 |                 | Parity gap         |
| **Statsig Telemetry**           | (opt-out)             | Not implemented | Different approach |
| **Sentry Errors**               | (opt-out)             | Not implemented | Different approach |
| **Multi-Provider**              | Claude/Bedrock/Vertex | xAI only        | Parity gap         |
| **Local Sessions**              |                       |                 | Parity             |
| **VPN Compatible**              |                       |                 | Parity             |
| **Local Execution**             |                       |                 | Parity             |

### Why these gaps exist

**Telemetry**: Grok One-Shot prioritizes privacy and simplicity by not collecting any telemetry. This is a design choice, not a missing feature.

**Multi-provider**: Grok One-Shot is specifically built for xAI's Grok API. Adding other providers would require significant architecture changes.

**Cloud execution**: Building cloud infrastructure requires substantial investment. May be considered for future enterprise offering.

**Tiered retention**: Requires xAI to offer similar commercial tiers. Currently not available in xAI's API offerings.

## Additional resources

- [xAI Terms of Service](https://x.ai/legal/terms-of-service)
- [xAI Privacy Policy](https://x.ai/legal/privacy-policy)
- [xAI Security Documentation](https://x.ai/legal/security)
- [Grok API Documentation](https://x.ai/api)
- [Settings Configuration](../configuration/settings.md)
- [Legal and Compliance](../resources/legal-and-compliance.md)

---

**Last updated**: November 7, 2025
**Version**: 1.1.101
