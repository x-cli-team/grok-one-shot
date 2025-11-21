# Plugin System

> **⚠️ PARITY GAP**: Grok One-Shot does not currently implement the plugin system described in this document. This is a comprehensive Claude Code feature planned for future implementation.

<Tip>
  For complete technical specifications and schemas, see [Plugins reference](/en/plugins-reference). For marketplace management, see [Plugin marketplaces](/en/plugin-marketplaces).
</Tip>

## Status in Grok One-Shot

**Current Status:** Not Implemented
**Planned:** Q3-Q4 2026 (Sprint 23-26)
**Priority:** P2 - Platform extensibility

**What Plugins Enable (in Claude Code):**

- **Custom slash commands**: Create reusable prompt templates
- **Specialized agents**: Bundle pre-configured AI agents for specific tasks
- **Hooks**: Automate workflows with lifecycle event handlers
- **Skills**: Package domain expertise into discoverable capabilities
- **MCP servers**: Include external tool integrations
- **Team distribution**: Share plugins via Git repositories or marketplaces
- **Versioning**: Semantic versioning for plugin releases
- **Dependency management**: Plugins can depend on other plugins

---

Plugins let you extend Grok One-Shot with custom functionality that can be shared across projects and teams. Install plugins from [marketplaces](/en/plugin-marketplaces) to add pre-built commands, agents, hooks, Skills, and MCP servers, or create your own to automate your workflows.

## Quickstart

Let's create a simple greeting plugin to get you familiar with the plugin system. We'll build a working plugin that adds a custom command, test it locally, and understand the core concepts.

### Prerequisites

- Grok One-Shot installed on your machine
- Basic familiarity with command-line tools

### Create your first plugin

<Steps>
  <Step title="Create the marketplace structure">
    ```bash  theme={null}
    mkdir test-marketplace
    cd test-marketplace
    ```
  </Step>

  <Step title="Create the plugin directory">
    ```bash  theme={null}
    mkdir my-first-plugin
    cd my-first-plugin
    ```
  </Step>

  <Step title="Create the plugin manifest">
    ```bash Create .grok-plugin/plugin.json theme={null}
    mkdir .grok-plugin
    cat > .grok-plugin/plugin.json << 'EOF'
    {
    "name": "my-first-plugin",
    "description": "A simple greeting plugin to learn the basics",
    "version": "1.0.0",
    "author": {
    "name": "Your Name"
    }
    }
    EOF
    ```
  </Step>

  <Step title="Add a custom command">
    ```bash Create commands/hello.md theme={null}
    mkdir commands
    cat > commands/hello.md << 'EOF'
    ---
    description: Greet the user with a personalized message
    ---

    # Hello Command

    Greet the user warmly and ask how you can help them today. Make the greeting personal and encouraging.
    EOF
    ```

  </Step>

  <Step title="Create the marketplace manifest">
    ```bash Create marketplace.json theme={null}
    cd ..
    mkdir .grok-plugin
    cat > .grok-plugin/marketplace.json << 'EOF'
    {
    "name": "test-marketplace",
    "owner": {
    "name": "Test User"
    },
    "plugins": [
    {
      "name": "my-first-plugin",
      "source": "./my-first-plugin",
      "description": "My first test plugin"
    }
    ]
    }
    EOF
    ```
  </Step>

  <Step title="Install and test your plugin">
    ```bash Start Grok One-Shot from parent directory theme={null}
    cd ..
    grok
    ```

    ```shell Add the test marketplace theme={null}
    /plugin marketplace add ./test-marketplace
    ```

    ```shell Install your plugin theme={null}
    /plugin install my-first-plugin@test-marketplace
    ```

    Select "Install now". You'll then need to restart Grok One-Shot in order to use the new plugin.

    ```shell Try your new command theme={null}
    /hello
    ```

    You'll see Grok use your greeting command! Check `/help` to see your new command listed.

  </Step>
</Steps>

You've successfully created and tested a plugin with these key components:

- **Plugin manifest** (`.grok-plugin/plugin.json`) - Describes your plugin's metadata
- **Commands directory** (`commands/`) - Contains your custom slash commands
- **Test marketplace** - Allows you to test your plugin locally

### Plugin structure overview

Your plugin follows this basic structure:

```
my-first-plugin/
├── .grok-plugin/
│   └── plugin.json          # Plugin metadata
├── commands/                 # Custom slash commands (optional)
│   └── hello.md
├── agents/                   # Custom agents (optional)
│   └── helper.md
├── skills/                   # Agent Skills (optional)
│   └── my-skill/
│       └── SKILL.md
└── hooks/                    # Event handlers (optional)
    └── hooks.json
```

**Additional components you can add:**

- **Commands**: Create markdown files in `commands/` directory
- **Agents**: Create agent definitions in `agents/` directory
- **Skills**: Create `SKILL.md` files in `skills/` directory
- **Hooks**: Create `hooks/hooks.json` for event handling
- **MCP servers**: Create `.mcp.json` for external tool integration

<Note>
  **Next steps**: Ready to add more features? Jump to [Develop more complex plugins](#develop-more-complex-plugins) to add agents, hooks, and MCP servers. For complete technical specifications of all plugin components, see [Plugins reference](/en/plugins-reference).
</Note>

---

## Install and manage plugins

Learn how to discover, install, and manage plugins to extend your Grok One-Shot capabilities.

### Prerequisites

- Grok One-Shot installed and running
- Basic familiarity with command-line interfaces

### Add marketplaces

Marketplaces are catalogs of available plugins. Add them to discover and install plugins:

```shell Add a marketplace theme={null}
/plugin marketplace add your-org/grok-plugins
```

```shell Browse available plugins theme={null}
/plugin
```

For detailed marketplace management including Git repositories, local development, and team distribution, see [Plugin marketplaces](/en/plugin-marketplaces).

### Install plugins

#### Via interactive menu (recommended for discovery)

```shell Open the plugin management interface theme={null}
/plugin
```

Select "Browse Plugins" to see available options with descriptions, features, and installation options.

#### Via direct commands (for quick installation)

```shell Install a specific plugin theme={null}
/plugin install formatter@your-org
```

```shell Enable a disabled plugin theme={null}
/plugin enable plugin-name@marketplace-name
```

```shell Disable without uninstalling theme={null}
/plugin disable plugin-name@marketplace-name
```

```shell Completely remove a plugin theme={null}
/plugin uninstall plugin-name@marketplace-name
```

### Verify installation

After installing a plugin:

1. **Check available commands**: Run `/help` to see new commands
2. **Test plugin features**: Try the plugin's commands and features
3. **Review plugin details**: Use `/plugin` → "Manage Plugins" to see what the plugin provides

## Set up team plugin workflows

Configure plugins at the repository level to ensure consistent tooling across your team. When team members trust your repository folder, Grok One-Shot automatically installs specified marketplaces and plugins.

**To set up team plugins:**

1. Add marketplace and plugin configuration to your repository's `.grok/settings.json`
2. Team members trust the repository folder
3. Plugins install automatically for all team members

For complete instructions including configuration examples, marketplace setup, and rollout best practices, see [Configure team marketplaces](/en/plugin-marketplaces#how-to-configure-team-marketplaces).

---

## Develop more complex plugins

Once you're comfortable with basic plugins, you can create more sophisticated extensions.

### Add Skills to your plugin

Plugins can include [Agent Skills](/en/skills) to extend Grok's capabilities. Skills are model-invoked—Grok autonomously uses them based on the task context.

To add Skills to your plugin, create a `skills/` directory at your plugin root and add Skill folders with `SKILL.md` files. Plugin Skills are automatically available when the plugin is installed.

For complete Skill authoring guidance, see [Agent Skills](/en/skills).

> **Note:** Skills are not yet implemented in Grok One-Shot. See [Skills](../getting-started/skills.md) for details.

### Organize complex plugins

For plugins with many components, organize your directory structure by functionality. For complete directory layouts and organization patterns, see [Plugin directory structure](/en/plugins-reference#plugin-directory-structure).

### Test your plugins locally

When developing plugins, use a local marketplace to test changes iteratively. This workflow builds on the quickstart pattern and works for plugins of any complexity.

<Steps>
  <Step title="Set up your development structure">
    Organize your plugin and marketplace for testing:

    ```bash Create directory structure theme={null}
    mkdir dev-marketplace
    cd dev-marketplace
    mkdir my-plugin
    ```

    This creates:

    ```
    dev-marketplace/
    ├── .grok-plugin/marketplace.json  (you'll create this)
    └── my-plugin/                        (your plugin under development)
        ├── .grok-plugin/plugin.json
        ├── commands/
        ├── agents/
        └── hooks/
    ```

  </Step>

  <Step title="Create the marketplace manifest">
    ```bash Create marketplace.json theme={null}
    mkdir .grok-plugin
    cat > .grok-plugin/marketplace.json << 'EOF'
    {
    "name": "dev-marketplace",
    "owner": {
    "name": "Developer"
    },
    "plugins": [
    {
      "name": "my-plugin",
      "source": "./my-plugin",
      "description": "Plugin under development"
    }
    ]
    }
    EOF
    ```
  </Step>

  <Step title="Install and test">
    ```bash Start Grok One-Shot from parent directory theme={null}
    cd ..
    grok
    ```

    ```shell Add your development marketplace theme={null}
    /plugin marketplace add ./dev-marketplace
    ```

    ```shell Install your plugin theme={null}
    /plugin install my-plugin@dev-marketplace
    ```

    Test your plugin components:

    * Try your commands with `/command-name`
    * Check that agents appear in `/agents`
    * Verify hooks work as expected

  </Step>

  <Step title="Iterate on your plugin">
    After making changes to your plugin code:

    ```shell Uninstall the current version theme={null}
    /plugin uninstall my-plugin@dev-marketplace
    ```

    ```shell Reinstall to test changes theme={null}
    /plugin install my-plugin@dev-marketplace
    ```

    Repeat this cycle as you develop and refine your plugin.

  </Step>
</Steps>

<Note>
  **For multiple plugins**: Organize plugins in subdirectories like `./plugins/plugin-name` and update your marketplace.json accordingly. See [Plugin sources](/en/plugin-marketplaces#plugin-sources) for organization patterns.
</Note>

### Debug plugin issues

If your plugin isn't working as expected:

1. **Check the structure**: Ensure your directories are at the plugin root, not inside `.grok-plugin/`
2. **Test components individually**: Check each command, agent, and hook separately
3. **Use validation and debugging tools**: See [Debugging and development tools](/en/plugins-reference#debugging-and-development-tools) for CLI commands and troubleshooting techniques

### Share your plugins

When your plugin is ready to share:

1. **Add documentation**: Include a README.md with installation and usage instructions
2. **Version your plugin**: Use semantic versioning in your `plugin.json`
3. **Create or use a marketplace**: Distribute through plugin marketplaces for easy installation
4. **Test with others**: Have team members test the plugin before wider distribution

<Note>
  For complete technical specifications, debugging techniques, and distribution strategies, see [Plugins reference](/en/plugins-reference).
</Note>

---

## Alternative Approaches (Current Implementation)

Since plugins are not yet implemented in Grok One-Shot, here are current alternatives:

### 1. Git-Based Configuration Sharing

Share configurations via Git repositories:

```bash
# Project structure for shared configs
my-grok-configs/
├── README.md
├── settings.json          # Shared settings
├── mcp-servers/          # MCP server configs
│   └── filesystem.json
└── docs/
    ├── GROK.md           # Shared project context
    └── workflows.md      # Team workflows
```

Team members clone and copy configurations:

```bash
git clone https://github.com/org/grok-configs
cp grok-configs/settings.json ~/.grok/settings.json
```

### 2. MCP Server Distribution

Grok One-Shot supports MCP servers, which can be packaged and shared:

```bash
# Add MCP server (current functionality)
grok mcp add filesystem "npx -y @modelcontextprotocol/server-filesystem"
grok mcp add github "node github-mcp-server/dist/index.js"
```

Document MCP server setup in your project README:

```markdown
# Setup

## MCP Servers

Add these MCP servers for full functionality:

\`\`\`bash
grok mcp add filesystem "npx -y @modelcontextprotocol/server-filesystem"
grok mcp add custom-tools "node ./mcp-servers/custom/index.js"
\`\`\`
```

### 3. Shared Documentation

Use `.agent/docs/` for team-wide documentation:

```bash
# Project documentation structure
.agent/
├── docs/
│   ├── workflows/
│   │   ├── deployment.md
│   │   ├── testing.md
│   │   └── code-review.md
│   ├── standards/
│   │   ├── coding-style.md
│   │   └── security.md
│   └── setup/
│       ├── environment.md
│       └── tools.md
├── GROK.md              # Main project context
└── docs-index.md        # Documentation index
```

These docs are version-controlled and shared via Git.

### 4. Shell Scripts and Automation

Create reusable scripts in your repository:

```bash
# scripts/grok-helpers/
scripts/
├── format-code.sh       # Code formatting helper
├── run-tests.sh         # Test runner
├── check-security.sh    # Security checks
└── README.md            # Usage documentation
```

Reference these in your GROK.md:

```markdown
# Helper Scripts

This project includes helper scripts in `scripts/grok-helpers/`:

- `format-code.sh`: Format all code files
- `run-tests.sh`: Run full test suite
- `check-security.sh`: Security vulnerability scan

Ask me to run these when needed.
```

### 5. npm Packages for Shared Tools

Package shared tools as npm packages:

```json
// package.json
{
  "name": "@org/grok-tools",
  "version": "1.0.0",
  "bin": {
    "grok-format": "./bin/format.js",
    "grok-test": "./bin/test.js"
  }
}
```

Install across projects:

```bash
npm install -g @org/grok-tools
```

## When Plugins Are Implemented

Future plugin system in Grok One-Shot would likely include:

### Plugin Manifest (future):

```json
// .grok-plugin/plugin.json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Description of plugin functionality",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "dependencies": {
    "other-plugin": "^2.0.0"
  }
}
```

### Marketplace Configuration (future):

```json
// .grok-plugin/marketplace.json
{
  "name": "org-marketplace",
  "owner": {
    "name": "Organization Name"
  },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "./my-plugin",
      "description": "Plugin description"
    }
  ]
}
```

### Usage Commands (future):

```bash
# Add marketplace
grok plugin marketplace add org/grok-plugins

# Install plugin
grok plugin install formatter@org

# List installed plugins
grok plugin list

# Update plugin
grok plugin update formatter@org

# Remove plugin
grok plugin uninstall formatter@org
```

## Comparison: Plugins vs Current Alternatives

| Feature          | Plugins (Claude Code) | Current Alternatives          |
| ---------------- | --------------------- | ----------------------------- |
| **Distribution** | Marketplace-based     | Git clone, npm packages       |
| **Versioning**   | Built-in              | Manual Git tags, npm versions |
| **Discovery**    | `/plugin` command     | README documentation          |
| **Installation** | One command           | Multi-step manual process     |
| **Updates**      | `plugin update`       | Git pull, npm update          |
| **Dependencies** | Automatic             | Manual                        |

## Component Comparison

| Component           | Claude Code Plugin  | Grok One-Shot Alternative             |
| ------------------- | ------------------- | ------------------------------------- |
| **Custom commands** | `/plugin` installed | ❌ Not available (future)             |
| **Agents**          | Plugin agents       | ⚠️ Limited subagent support           |
| **Hooks**           | Plugin hooks        | ❌ Not available (future)             |
| **Skills**          | Plugin skills       | ❌ Not available (use GROK.md + docs) |
| **MCP servers**     | Plugin MCP          | ✅ Available via `grok mcp`           |

## Next steps

Now that you understand Grok One-Shot's plugin system (planned), here are suggested paths for different goals:

### For plugin users (when implemented)

- **Discover plugins**: Browse community marketplaces for useful tools
- **Team adoption**: Set up repository-level plugins for your projects
- **Marketplace management**: Learn to manage multiple plugin sources
- **Advanced usage**: Explore plugin combinations and workflows

### For plugin developers (when implemented)

- **Create your first marketplace**: [Plugin marketplaces guide](/en/plugin-marketplaces)
- **Advanced components**: Dive deeper into specific plugin components:
  - [Slash commands](/en/slash-commands) - Command development details
  - [Subagents](/en/sub-agents) - Agent configuration and capabilities
  - [Agent Skills](/en/skills) - Extend Grok's capabilities
  - [Hooks](/en/hooks) - Event handling and automation
  - [MCP](/en/mcp) - External tool integration
- **Distribution strategies**: Package and share your plugins effectively
- **Community contribution**: Consider contributing to community plugin collections

### For team leads and administrators

- **Repository configuration**: Set up automatic plugin installation for team projects
- **Plugin governance**: Establish guidelines for plugin approval and security review
- **Marketplace maintenance**: Create and maintain organization-specific plugin catalogs
- **Training and documentation**: Help team members adopt plugin workflows effectively

### Current alternatives (before plugins)

- **Use MCP servers**: Leverage Grok's existing MCP support
- **Git-based configs**: Share configurations through repositories
- **Documentation**: Use `.agent/docs/` for team knowledge
- **Scripts**: Create helper scripts for common workflows
- **npm packages**: Package tools as reusable modules

## See also

- [Plugin marketplaces](/en/plugin-marketplaces) - Creating and managing plugin catalogs (planned)
- [Slash commands](/en/slash-commands) - Understanding custom commands (planned)
- [Subagents](/en/sub-agents) - Creating and using specialized agents
- [Agent Skills](../getting-started/skills.md) - Extend Grok's capabilities (planned)
- [Hooks](../getting-started/hooks.md) - Automating workflows with event handlers (planned)
- [MCP](/en/mcp) - Connecting to external tools and services (available)
- [Settings](../configuration/settings.md) - Configuration options for plugins

---

**Want this feature?** Consider:

- Opening a feature request in the Grok One-Shot repository
- Using Git-based configuration sharing as an interim solution
- Leveraging MCP servers for custom tool integration
- Creating shared npm packages for team tooling
- Contributing to Grok One-Shot development

**Status:** This feature is planned but not yet implemented in Grok One-Shot.
**Last Updated:** 2025-11-07
