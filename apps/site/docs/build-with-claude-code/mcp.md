---
title: Connect Grok One-Shot to tools via MCP
---

# Connect Grok One-Shot to tools via MCP

> Learn how to connect Grok One-Shot to your tools with the Model Context Protocol.

> **Note:** This documentation is adapted from Claude Code. Some features may not yet be available in Grok One-Shot. See parity gap notes throughout.

## Overview

Grok One-Shot can connect to hundreds of external tools and data sources through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction), an open-source standard for AI-tool integrations. MCP servers give Grok One-Shot access to your tools, databases, and APIs.

## What you can do with MCP

With MCP servers connected, you can ask Grok One-Shot to:

- **Implement features from issue trackers**: "Add the feature described in JIRA issue ENG-4521 and create a PR on GitHub."
- **Analyze monitoring data**: "Check Sentry and Statsig to check the usage of the feature described in ENG-4521."
- **Query databases**: "Find emails of 10 random users who used feature ENG-4521, based on our Postgres database."
- **Integrate designs**: "Update our standard email template based on the new Figma designs that were posted in Slack"
- **Automate workflows**: "Create Gmail drafts inviting these 10 users to a feedback session about the new feature."

## Popular MCP servers

Here are some commonly used MCP servers you can connect to Grok One-Shot:

> **Warning:** Use third party MCP servers at your own risk - xAI has not verified the correctness or security of all these servers. Make sure you trust MCP servers you are installing. Be especially careful when using MCP servers that could fetch untrusted content, as these can expose you to prompt injection risk.

### Development & Testing Tools

**Socket**

- **Description**: Security analysis for dependencies
- **Documentation**: https://github.com/SocketDev/socket-mcp
- **URL**: https://mcp.socket.dev/

**Sentry**

- **Description**: Monitor errors, debug production issues
- **Documentation**: https://docs.sentry.io/product/sentry-mcp/
- **URL**: https://mcp.sentry.dev/mcp

**Hugging Face**

- **Description**: Provides access to Hugging Face Hub information and Gradio AI Applications
- **Documentation**: https://huggingface.co/settings/mcp
- **URL**: https://huggingface.co/mcp

**Jam**

- **Description**: Debug faster with AI agents that can access Jam recordings like video, console logs, network requests, and errors
- **Documentation**: https://jam.dev/docs/debug-a-jam/mcp
- **URL**: https://mcp.jam.dev/mcp

### Project Management & Documentation

**Notion**

- **Description**: Read docs, update pages, manage tasks
- **Documentation**: https://developers.notion.com/docs/mcp
- **URL**: https://mcp.notion.com/mcp

**Linear**

- **Description**: Integrate with Linear's issue tracking and project management
- **Documentation**: https://linear.app/docs/mcp
- **URL**: https://mcp.linear.app/mcp

**Atlassian**

- **Description**: Manage your Jira tickets and Confluence docs
- **Documentation**: https://www.atlassian.com/platform/remote-mcp-server
- **URL**: https://mcp.atlassian.com/v1/sse

**Asana**

- **Description**: Interact with your Asana workspace to keep projects on track
- **Documentation**: https://developers.asana.com/docs/using-asanas-model-control-protocol-mcp-server
- **URL**: https://mcp.asana.com/sse

**Intercom**

- **Description**: Access real-time customer conversations, tickets, and user data
- **Documentation**: https://developers.intercom.com/docs/guides/mcp
- **URL**: https://mcp.intercom.com/mcp

**ClickUp**

- **Description**: Task management, project tracking
- **Documentation**: https://github.com/hauptsacheNet/clickup-mcp
- **Command**: `npx -y @hauptsache.net/clickup-mcp`
- **Environment**: CLICKUP_API_KEY, CLICKUP_TEAM_ID

**Box**

- **Description**: Ask questions about your enterprise content, get insights from unstructured data, automate content workflows
- **Documentation**: https://box.dev/guides/box-mcp/remote/
- **URL**: https://mcp.box.com/

**Fireflies**

- **Description**: Extract valuable insights from meeting transcripts and summaries
- **Documentation**: https://guide.fireflies.ai/articles/8272956938-learn-about-the-fireflies-mcp-server-model-context-protocol
- **URL**: https://api.fireflies.ai/mcp

**Monday**

- **Description**: Manage monday.com boards by creating items, updating columns, assigning owners, setting timelines, adding CRM activities, and writing summaries
- **Documentation**: https://developer.monday.com/apps/docs/mondaycom-mcp-integration
- **URL**: https://mcp.monday.com/mcp

### Databases & Data Management

**Airtable**

- **Description**: Read/write records, manage bases and tables
- **Documentation**: https://github.com/domdomegg/airtable-mcp-server
- **Command**: `npx -y airtable-mcp-server`
- **Environment**: AIRTABLE_API_KEY

**HubSpot**

- **Description**: Access and manage HubSpot CRM data by fetching contacts, companies, and deals, and creating and updating records
- **Documentation**: https://developers.hubspot.com/mcp
- **URL**: https://mcp.hubspot.com/anthropic

**Daloopa**

- **Description**: Supplies high quality fundamental financial data sourced from SEC Filings, investor presentations
- **Documentation**: https://docs.daloopa.com/docs/daloopa-mcp
- **URL**: https://mcp.daloopa.com/server/mcp

### Payments & Commerce

**Stripe**

- **Description**: Payment processing, subscription management, and financial transactions
- **Documentation**: https://docs.stripe.com/mcp
- **URL**: https://mcp.stripe.com

**PayPal**

- **Description**: Integrate PayPal commerce capabilities, payment processing, transaction management
- **Documentation**: https://www.paypal.ai/
- **URL**: https://mcp.paypal.com/mcp

**Plaid**

- **Description**: Analyze, troubleshoot, and optimize Plaid integrations. Banking data, financial account linking
- **Documentation**: https://plaid.com/blog/plaid-mcp-ai-assistant-claude/
- **URL**: https://api.dashboard.plaid.com/mcp/sse

**Square**

- **Description**: Use an agent to build on Square APIs. Payments, inventory, orders, and more
- **Documentation**: https://developer.squareup.com/docs/mcp
- **URL**: https://mcp.squareup.com/sse

### Design & Media

**Figma**

- **Description**: Generate better code by bringing in full Figma context
- **Documentation**: https://developers.figma.com
- **URL**: https://mcp.figma.com/mcp
- **Note**: Visit developers.figma.com for local server setup.

**Canva**

- **Description**: Browse, summarize, autofill, and even generate new Canva designs
- **Documentation**: https://www.canva.dev/docs/connect/canva-mcp-server-setup/
- **URL**: https://mcp.canva.com/mcp

**Cloudinary**

- **Description**: Upload, manage, transform, and analyze your media assets
- **Documentation**: https://cloudinary.com/documentation/cloudinary_llm_mcp#mcp_servers
- **Note**: Multiple services available. See documentation for specific server URLs.

**invideo**

- **Description**: Build video creation capabilities into your applications
- **Documentation**: https://invideo.io/ai/mcp
- **URL**: https://mcp.invideo.io/sse

### Infrastructure & DevOps

**Cloudflare**

- **Description**: Build applications, analyze traffic, monitor performance, and manage security settings through Cloudflare
- **Documentation**: https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/
- **Note**: Multiple services available. See documentation for specific server URLs.

**Vercel**

- **Description**: Vercel's official MCP server, allowing you to search and navigate documentation, manage projects and deployments, and analyze deployment logs
- **Documentation**: https://vercel.com/docs/mcp/vercel-mcp
- **URL**: https://mcp.vercel.com/

**Netlify**

- **Description**: Create, deploy, and manage websites on Netlify. Control all aspects of your site from creating secrets to enforcing access controls to aggregating form submissions
- **Documentation**: https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/
- **URL**: https://netlify-mcp.netlify.app/mcp

**Stytch**

- **Description**: Configure and manage Stytch authentication services, redirect URLs, email templates, and workspace settings
- **Documentation**: https://stytch.com/docs/workspace-management/stytch-mcp
- **URL**: http://mcp.stytch.dev/mcp

### Automation & Integration

**Zapier**

- **Description**: Connect to nearly 8,000 apps through Zapier's automation platform
- **Documentation**: https://help.zapier.com/hc/en-us/articles/36265392843917
- **Note**: Generate a user-specific URL at mcp.zapier.com

**Workato**

- **Description**: Access any application, workflows or data via Workato, made accessible for AI
- **Documentation**: https://docs.workato.com/mcp.html
- **Note**: MCP servers are programmatically generated

> **Need a specific integration?** [Find hundreds more MCP servers on GitHub](https://github.com/modelcontextprotocol/servers), or build your own using the [MCP SDK](https://modelcontextprotocol.io/quickstart/server).

## Installing MCP servers

> **Parity Gap**: Grok One-Shot currently uses a simplified MCP configuration system compared to Claude Code. Some features like OAuth authentication, installation scopes, and plugin-provided servers may not be fully supported yet.

MCP servers can be configured in Grok One-Shot's settings file at `~/.grok/settings.json` or `~/.grok/settings.json`.

### Basic MCP server configuration

Add MCP servers to your settings file:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/allowed/directory"
      ]
    },
    "github": {
      "command": "node",
      "args": ["github-mcp-server/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Managing your servers

> **Parity Gap**: CLI commands for MCP management (`grok mcp add`, `grok mcp list`, etc.) are available in Grok One-Shot. However, features like OAuth authentication flows and scope management may differ from Claude Code.

```bash
# Add a server (if CLI support is available)
grok mcp add <name> <command>

# List configured servers
grok mcp list

# Remove a server
grok mcp remove <name>
```

**Tips:**

- Set environment variables with `env` in your settings file
- Configure MCP server startup timeout using the MCP_TIMEOUT environment variable (e.g., `MCP_TIMEOUT=10000 grok` sets a 10-second timeout)
- Grok One-Shot will display a warning when MCP tool output exceeds token limits

**Windows Users**: On native Windows (not WSL), local MCP servers that use `npx` require the `cmd /c` wrapper to ensure proper execution.

```bash
# Windows command format
cmd /c npx -y @some/package
```

Without the `cmd /c` wrapper, you'll encounter "Connection closed" errors because Windows cannot directly execute `npx`.

## Practical examples

### Example: Monitor errors with Sentry

> **Parity Gap**: OAuth authentication for remote MCP servers may not be fully implemented in Grok One-Shot yet. You may need to use API tokens instead.

**Add to settings.json:**

```json
{
  "mcpServers": {
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp",
      "env": {
        "SENTRY_TOKEN": "your-api-token"
      }
    }
  }
}
```

**Usage:**

```
> What are the most common errors in the last 24 hours?
> Show me the stack trace for error ID abc123
> Which deployment introduced these new errors?
```

### Example: Connect to GitHub for code reviews

> **Parity Gap**: GitHub MCP integration may require manual token configuration instead of OAuth flow.

**Add to settings.json:**

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

**Usage:**

```
> Review PR #456 and suggest improvements
> Create a new issue for the bug we just found
> Show me all open PRs assigned to me
```

### Example: Query your PostgreSQL database

**Add to settings.json:**

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": [
        "-y",
        "@bytebase/dbhub",
        "--dsn",
        "postgresql://readonly:pass@prod.db.com:5432/analytics"
      ]
    }
  }
}
```

**Usage:**

```
> What's our total revenue this month?
> Show me the schema for the orders table
> Find customers who haven't made a purchase in 90 days
```

## MCP installation scopes

> **Parity Gap**: Installation scopes (local/project/user) may not be fully implemented in Grok One-Shot. The system currently uses a single settings file at `~/.grok/settings.json` or `~/.grok/settings.json`.

In a full implementation, MCP servers could be configured at different scope levels:

### User scope (global)

Available to you across all projects. Currently, all MCP configuration in Grok One-Shot is effectively user-scoped.

**Location**: `~/.grok/settings.json` or `~/.grok/settings.json`

### Project scope

> **Parity Gap**: Project-scoped MCP servers via `.mcp.json` files may not be fully supported yet.

In the future, teams could share MCP configurations via a `.mcp.json` file in the project root:

```json
{
  "mcpServers": {
    "shared-server": {
      "command": "/path/to/server",
      "args": [],
      "env": {}
    }
  }
}
```

### Environment variable expansion

> **Parity Gap**: Environment variable expansion syntax (`$\{VAR\}`, `$\{VAR:-default\}`) may not be fully implemented yet.

Grok One-Shot may support environment variable expansion in MCP configurations:

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL//api.example.com}/mcp",
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

## Authenticate with remote MCP servers

> **Parity Gap**: OAuth 2.0 authentication flows for remote MCP servers are not yet implemented in Grok One-Shot. Use API tokens instead.

For services requiring authentication, use API tokens in the `env` section:

```json
{
  "mcpServers": {
    "service": {
      "type": "http",
      "url": "https://api.service.com/mcp",
      "env": {
        "API_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Plugin-provided MCP servers

> **Parity Gap**: Plugin system with bundled MCP servers is not available in Grok One-Shot.

This is a Claude Code feature where plugins can bundle MCP servers for automatic integration. Grok One-Shot currently requires manual MCP server configuration.

## Use Grok One-Shot as an MCP server

> **Parity Gap**: Exposing Grok One-Shot as an MCP server for other applications is not currently supported.

This feature would allow other MCP clients to use Grok One-Shot's tools. This is a future enhancement.

## MCP output limits and warnings

When MCP tools produce large outputs, Grok One-Shot helps manage token usage:

- **Output warning threshold**: Grok One-Shot may display a warning when MCP tool output exceeds reasonable token limits
- **Configurable limit**: You can adjust limits using environment variables if supported
- **Default behavior**: Large outputs are handled gracefully to prevent overwhelming the conversation context

## MCP resources

> **Parity Gap**: MCP resource support (@ mentions for MCP resources) may not be fully implemented yet.

MCP servers can expose resources that could be referenced using @ mentions in future versions:

```
> Can you analyze @github//123 and suggest a fix?
> Compare @postgres//users with @docs//database/user-model
```

## MCP prompts as slash commands

> **Parity Gap**: MCP prompts as slash commands are not currently implemented in Grok One-Shot.

This would allow MCP servers to expose prompts that become slash commands. This is a future enhancement.

## Enterprise MCP configuration

> **Parity Gap**: Enterprise-managed MCP configurations are not currently supported in Grok One-Shot.

Claude Code supports centralized MCP management for organizations via managed configuration files. This is not yet available in Grok One-Shot.

## Building custom MCP servers

You can build custom MCP servers for Grok One-Shot using the [MCP SDK](https://modelcontextprotocol.io/quickstart/server).

**Quick example (Python):**

```python
#!/usr/bin/env python3
import json
import sys

def handle_request(request):
method = request.get("method")

if method == "tools/list":
return {
"tools": [{
"name": "greet",
"description": "Say hello",
"inputSchema": {
"type": "object",
"properties": {
"name": {"type": "string"}
}
}
}]
}

elif method == "tools/call":
tool = request["params"]["name"]
args = request["params"]["arguments"]

if tool == "greet":
return {
"content": [{
"type": "text",
"text": f"Hello, {args['name']}!"
}]
}

return {"error": "Unknown method"}

# MCP protocol: read from stdin, write to stdout
for line in sys.stdin:
request = json.loads(line)
response = handle_request(request)
print(json.dumps(response))
sys.stdout.flush()
```

**Add to Grok One-Shot:**

```json
{
  "mcpServers": {
    "myserver": {
      "command": "python3",
      "args": ["/path/to/my-mcp-server.py"]
    }
  }
}
```

## Best practices

### Security

**Important:**

- MCP servers run with your user permissions
- Only use trusted MCP servers or thoroughly audit custom ones
- Use specific allowed directories for filesystem access
- Configure minimal required permissions
- Use environment variables for secrets (never hardcode API keys)

### Performance

**Tips:**

- MCP servers start on demand (first tool use)
- Servers stay running for session duration
- Multiple MCP tools can be used in single request
- Failed servers don't block other operations

## Troubleshooting

### Server won't start

**Symptoms:**

```
Failed to start MCP server: filesystem
```

**Solutions:**

1. Verify command works independently
2. Check file permissions
3. Verify dependencies installed
4. Check server logs

### Tools not available

**Solutions:**

- Check configured servers in settings.json
- Restart Grok One-Shot
- Test server command manually
- Check for error messages in logs

### Slow performance

**Solutions:**

- Use more specific requests
- Implement caching in custom servers
- Optimize server queries
- Consider local vs remote servers

## See also

- [MCP Specification](https://modelcontextprotocol.io) - Official documentation
- [MCP Server Repository](https://github.com/modelcontextprotocol/servers) - Community servers
- [Grok One-Shot Configuration](../reference/settings.md) - Settings guide

---

**Parity Summary**: Grok One-Shot supports core MCP functionality (stdio servers, basic configuration) but is missing some advanced Claude Code features like OAuth flows, installation scopes, plugin-bundled servers, and enterprise management. These features may be added in future versions.
