---
title: Agent Skills
---

# Agent Skills

> ** PARITY GAP**: Grok One-Shot does not currently implement the Agent Skills system described in this document. This is a comprehensive Claude Code feature planned for future implementation.

## Status in Grok One-Shot

**Current Status:** Not Implemented
**Planned:** Q3 2026 (Sprint 25-27)
**Priority:** P2 - Knowledge packaging and sharing

**What Agent Skills Enable (in Claude Code):**

- Package domain expertise into discoverable capabilities
- Model-invoked skills (Claude decides when to use them)
- Progressive disclosure (load supporting files on-demand)
- Tool access restrictions via `allowed-tools`
- Team sharing via Git or plugins
- Personal and project-level skills

**Alternative Approaches:** Until Skills are implemented:

1. Use `.agent/docs/` for project documentation
2. Document workflows in `GROK.md`
3. Create shell scripts for common operations
4. Use MCP servers for specialized capabilities
5. Maintain team documentation in version control

---

> Create, manage, and share Skills to extend Grok's capabilities in Grok One-Shot.

This guide shows you how to create, use, and manage Agent Skills in Grok One-Shot. Skills would be modular capabilities that extend Grok's functionality through organized folders containing instructions, scripts, and resources.

## Prerequisites

- Grok One-Shot version 1.1.0 or later
- Basic familiarity with [Grok One-Shot](/en/quickstart)

## What are Agent Skills?

Agent Skills would package expertise into discoverable capabilities. Each Skill would consist of a `SKILL.md` file with instructions that Grok reads when relevant, plus optional supporting files like scripts and templates.

**How Skills are invoked**: Skills would be **model-invoked**—Grok autonomously decides when to use them based on your request and the Skill's description. This is different from slash commands, which are **user-invoked** (you explicitly type `/command` to trigger them).

**Benefits**:

- Extend Grok's capabilities for your specific workflows
- Share expertise across your team via git
- Reduce repetitive prompting
- Compose multiple Skills for complex tasks

Learn more in the [Agent Skills overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) (Claude Code documentation).

<Note>
For a deep dive into the architecture and real-world applications of Agent Skills, read our engineering blog: [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills).
</Note>

## Create a Skill

Skills would be stored as directories containing a `SKILL.md` file.

### Personal Skills

Personal Skills would be available across all your projects. Store them in `~/.grok/skills/`:

```bash theme={null}
mkdir -p ~/.grok/skills/my-skill-name
```

**Use personal Skills for**:

- Your individual workflows and preferences
- Experimental Skills you're developing
- Personal productivity tools

### Project Skills

Project Skills would be shared with your team. Store them in `.grok/skills/` within your project:

```bash theme={null}
mkdir -p .grok/skills/my-skill-name
```

**Use project Skills for**:

- Team workflows and conventions
- Project-specific expertise
- Shared utilities and scripts

Project Skills are checked into git and automatically available to team members.

### Plugin Skills

Skills can also come from [Grok One-Shot plugins](/en/plugins). Plugins may bundle Skills that are automatically available when the plugin is installed. These Skills work the same way as personal and project Skills.

> **Note:** Plugins are not yet implemented in Grok One-Shot. See [Plugin System](../features/plugin-system.md) for details.

## Write SKILL.md

Create a `SKILL.md` file with YAML frontmatter and Markdown content:

```yaml theme={null}
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Provide clear, step-by-step guidance for Grok.

## Examples
Show concrete examples of using this Skill.
```

**Field requirements**:

- `name`: Must use lowercase letters, numbers, and hyphens only (max 64 characters)
- `description`: Brief description of what the Skill does and when to use it (max 1024 characters)

The `description` field is critical for Grok to discover when to use your Skill. It should include both what the Skill does and when Grok should use it.

See the [best practices guide](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices) for complete authoring guidance including validation rules.

## Add supporting files

Create additional files alongside SKILL.md:

```
my-skill/
├── SKILL.md (required)
├── reference.md (optional documentation)
├── examples.md (optional examples)
├── scripts/
│ └── helper.py (optional utility)
└── templates/
└── template.txt (optional template)
```

Reference these files from SKILL.md:

````markdown theme={null}
For advanced usage, see [reference.md](reference.md).

Run the helper script:

```bash
python scripts/helper.py input.txt
```
````

Grok reads these files only when needed, using progressive disclosure to manage context efficiently.

## Restrict tool access with allowed-tools

Use the `allowed-tools` frontmatter field to limit which tools Grok can use when a Skill is active:

```yaml theme={null}
---
name: safe-file-reader
description: Read files without making changes. Use when you need read-only file access.
allowed-tools: Read, Grep, Glob
---

# Safe File Reader

This Skill provides read-only file access.

## Instructions
1. Use Read to view file contents
2. Use Grep to search within files
3. Use Glob to find files by pattern
```

When this Skill is active, Grok can only use the specified tools (Read, Grep, Glob) without needing to ask for permission. This is useful for:

- Read-only Skills that shouldn't modify files
- Skills with limited scope (e.g., only data analysis, no file writing)
- Security-sensitive workflows where you want to restrict capabilities

If `allowed-tools` is not specified, Grok will ask for permission to use tools as normal, following the standard permission model.

<Note>
`allowed-tools` would only be supported for Skills in Grok One-Shot.
</Note>

## View available Skills

Skills would be automatically discovered by Grok from three sources:

- Personal Skills: `~/.grok/skills/`
- Project Skills: `.grok/skills/`
- Plugin Skills: bundled with installed plugins

**To view all available Skills**, ask Grok directly:

```
What Skills are available?
```

or

```
List all available Skills
```

This will show all Skills from all sources, including plugin Skills.

**To inspect a specific Skill**, you can also check the filesystem:

```bash theme={null}
# List personal Skills
ls ~/.grok/skills/

# List project Skills (if in a project directory)
ls .grok/skills/

# View a specific Skill's content
cat ~/.grok/skills/my-skill/SKILL.md
```

## Test a Skill

After creating a Skill, test it by asking questions that match your description.

**Example**: If your description mentions "PDF files":

```
Can you help me extract text from this PDF?
```

Grok autonomously decides to use your Skill if it matches the request—you don't need to explicitly invoke it. The Skill activates automatically based on the context of your question.

## Debug a Skill

If Grok doesn't use your Skill, check these common issues:

### Make description specific

**Too vague**:

```yaml theme={null}
description: Helps with documents
```

**Specific**:

```yaml theme={null}
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

Include both what the Skill does and when to use it in the description.

### Verify file path

**Personal Skills**: `~/.grok/skills/skill-name/SKILL.md`
**Project Skills**: `.grok/skills/skill-name/SKILL.md`

Check the file exists:

```bash theme={null}
# Personal
ls ~/.grok/skills/my-skill/SKILL.md

# Project
ls .grok/skills/my-skill/SKILL.md
```

### Check YAML syntax

Invalid YAML prevents the Skill from loading. Verify the frontmatter:

```bash theme={null}
# View frontmatter
cat .grok/skills/my-skill/SKILL.md | head -n 10

# Check for common issues
# - Missing opening or closing ---
# - Tabs instead of spaces
# - Unquoted strings with special characters
```

Ensure:

- Opening `---` on line 1
- Closing `---` before Markdown content
- Valid YAML syntax (no tabs, correct indentation)

### View errors

Run Grok One-Shot with debug mode to see Skill loading errors:

```bash theme={null}
grok --debug
```

## Share Skills with your team

**Recommended approach**: Distribute Skills through [plugins](/en/plugins).

To share Skills via plugin:

1. Create a plugin with Skills in the `skills/` directory
2. Add the plugin to a marketplace
3. Team members install the plugin

For complete instructions, see [Add Skills to your plugin](/en/plugins#add-skills-to-your-plugin).

> **Note:** Plugins are not yet implemented in Grok One-Shot.

You can also share Skills directly through project repositories:

### Step 1: Add Skill to your project

Create a project Skill:

```bash theme={null}
mkdir -p .grok/skills/team-skill
# Create SKILL.md
```

### Step 2: Commit to git

```bash theme={null}
git add .grok/skills/
git commit -m "Add team Skill for PDF processing"
git push
```

### Step 3: Team members get Skills automatically

When team members pull the latest changes, Skills are immediately available:

```bash theme={null}
git pull
grok # Skills would be available
```

## Update a Skill

Edit SKILL.md directly:

```bash theme={null}
# Personal Skill
code ~/.grok/skills/my-skill/SKILL.md

# Project Skill
code .grok/skills/my-skill/SKILL.md
```

Changes take effect the next time you start Grok One-Shot. If Grok One-Shot is already running, restart it to load the updates.

## Remove a Skill

Delete the Skill directory:

```bash theme={null}
# Personal
rm -rf ~/.grok/skills/my-skill

# Project
rm -rf .grok/skills/my-skill
git commit -m "Remove unused Skill"
```

## Best practices

### Keep Skills focused

One Skill should address one capability:

**Focused**:

- "PDF form filling"
- "Excel data analysis"
- "Git commit messages"

**Too broad**:

- "Document processing" (split into separate Skills)
- "Data tools" (split by data type or operation)

### Write clear descriptions

Help Grok discover when to use Skills by including specific triggers in your description:

**Clear**:

```yaml theme={null}
description: Analyze Excel spreadsheets, create pivot tables, and generate charts. Use when working with Excel files, spreadsheets, or analyzing tabular data in .xlsx format.
```

**Vague**:

```yaml theme={null}
description: For files
```

### Test with your team

Have teammates use Skills and provide feedback:

- Does the Skill activate when expected?
- Are the instructions clear?
- Are there missing examples or edge cases?

### Document Skill versions

You can document Skill versions in your SKILL.md content to track changes over time. Add a version history section:

```markdown theme={null}
# My Skill

## Version History

- v2.0.0 (2025-10-01): Breaking changes to API
- v1.1.0 (2025-09-15): Added new features
- v1.0.0 (2025-09-01): Initial release
```

This helps team members understand what changed between versions.

## Troubleshooting

### Grok doesn't use my Skill

**Symptom**: You ask a relevant question but Grok doesn't use your Skill.

**Check**: Is the description specific enough?

Vague descriptions make discovery difficult. Include both what the Skill does and when to use it, with key terms users would mention.

**Too generic**:

```yaml theme={null}
description: Helps with data
```

**Specific**:

```yaml theme={null}
description: Analyze Excel spreadsheets, generate pivot tables, create charts. Use when working with Excel files, spreadsheets, or .xlsx files.
```

**Check**: Is the YAML valid?

Run validation to check for syntax errors:

```bash theme={null}
# View frontmatter
cat .grok/skills/my-skill/SKILL.md | head -n 15

# Check for common issues
# - Missing opening or closing ---
# - Tabs instead of spaces
# - Unquoted strings with special characters
```

**Check**: Is the Skill in the correct location?

```bash theme={null}
# Personal Skills
ls ~/.grok/skills/*/SKILL.md

# Project Skills
ls .grok/skills/*/SKILL.md
```

### Skill has errors

**Symptom**: The Skill loads but doesn't work correctly.

**Check**: Are dependencies available?

Grok will automatically install required dependencies (or ask for permission to install them) when it needs them.

**Check**: Do scripts have execute permissions?

```bash theme={null}
chmod +x .grok/skills/my-skill/scripts/*.py
```

**Check**: Are file paths correct?

Use forward slashes (Unix style) in all paths:

**Correct**: `scripts/helper.py`
**Wrong**: `scripts\helper.py` (Windows style)

### Multiple Skills conflict

**Symptom**: Grok uses the wrong Skill or seems confused between similar Skills.

**Be specific in descriptions**: Help Grok choose the right Skill by using distinct trigger terms in your descriptions.

Instead of:

```yaml theme={null}
# Skill 1
description: For data analysis

# Skill 2
description: For analyzing data
```

Use:

```yaml theme={null}
# Skill 1
description: Analyze sales data in Excel files and CRM exports. Use for sales reports, pipeline analysis, and revenue tracking.

# Skill 2
description: Analyze log files and system metrics data. Use for performance monitoring, debugging, and system diagnostics.
```

## Examples

### Simple Skill (single file)

```
commit-helper/
└── SKILL.md
```

```yaml theme={null}
---
name: generating-commit-messages
description: Generates clear commit messages from git diffs. Use when writing commit messages or reviewing staged changes.
---

# Generating Commit Messages

## Instructions

1. Run `git diff --staged` to see changes
2. I'll suggest a commit message with:
- Summary under 50 characters
- Detailed description
- Affected components

## Best practices

- Use present tense
- Explain what and why, not how
```

### Skill with tool permissions

```
code-reviewer/
└── SKILL.md
```

```yaml theme={null}
---
name: code-reviewer
description: Review code for best practices and potential issues. Use when reviewing code, checking PRs, or analyzing code quality.
allowed-tools: Read, Grep, Glob
---

# Code Reviewer

## Review checklist

1. Code organization and structure
2. Error handling
3. Performance considerations
4. Security concerns
5. Test coverage

## Instructions

1. Read the target files using Read tool
2. Search for patterns using Grep
3. Find related files using Glob
4. Provide detailed feedback on code quality
```

### Multi-file Skill

```
pdf-processing/
├── SKILL.md
├── FORMS.md
├── REFERENCE.md
└── scripts/
├── fill_form.py
└── validate.py
```

**SKILL.md**:

````yaml theme={null}
---
name: pdf-processing
description: Extract text, fill forms, merge PDFs. Use when working with PDF files, forms, or document extraction. Requires pypdf and pdfplumber packages.
---

# PDF Processing

## Quick start

Extract text:
```python
import pdfplumber
with pdfplumber.open("doc.pdf") as pdf:
text = pdf.pages[0].extract_text()
```

For form filling, see [FORMS.md](FORMS.md).
For detailed API reference, see [REFERENCE.md](REFERENCE.md).

## Requirements

Packages must be installed in your environment:
```bash
pip install pypdf pdfplumber
```
````

<Note>
List required packages in the description. Packages must be installed in your environment before Grok can use them.
</Note>

Grok loads additional files only when needed.

## Alternative Approaches (Current Implementation)

Since Agent Skills are not yet implemented, here are current alternatives:

### 1. Use `.agent/docs/` for Documentation

Structure your documentation in `.agent/docs/`:

```bash
.agent/
├── docs/
│ ├── workflows/
│ │ ├── pdf-processing.md
│ │ ├── excel-analysis.md
│ │ └── git-workflows.md
│ ├── standards/
│ │ ├── coding-style.md
│ │ └── commit-messages.md
│ └── tools/
│ ├── formatters.md
│ └── linters.md
├── GROK.md
└── docs-index.md
```

Reference in `GROK.md`:

```markdown
# Team Documentation

See `.agent/docs/` for detailed documentation:

- Workflows: PDF processing, Excel analysis, Git workflows
- Standards: Coding style, commit message format
- Tools: Formatters, linters, build tools

Read specific docs when needed using the Read tool.
```

### 2. Document Workflows in GROK.md

Include common workflows directly in GROK.md:

````markdown
# GROK.md

## PDF Processing Workflow

When working with PDF files:

1. Use `pdfplumber` for text extraction:

```python
import pdfplumber
with pdfplumber.open("doc.pdf") as pdf:
text = pdf.pages[0].extract_text()
```
````

2. For form filling, use `pypdf`:

```python
from pypdf import PdfWriter, PdfReader
# ... form filling code
```

3. Always validate output PDFs before delivering

## Commit Message Format

Format commit messages as:

```
type(scope): brief description

Detailed explanation of changes
```

Types: feat, fix, docs, style, refactor, test, chore

````

### 3. Create Helper Scripts

Create reusable scripts:

```bash
# scripts/helpers/
scripts/
├── pdf-extract.py # Extract text from PDF
├── excel-analyze.py # Analyze Excel data
├── git-commit-msg.sh # Generate commit message
└── README.md # Usage documentation
````

Document in GROK.md:

```markdown
# Helper Scripts

Use scripts in `scripts/helpers/`:

- `pdf-extract.py`: Extract text from PDFs
- `excel-analyze.py`: Analyze Excel spreadsheets
- `git-commit-msg.sh`: Generate commit messages

Ask me to run these when needed.
```

### 4. Use MCP Servers

Create MCP servers for specialized capabilities:

```bash
# Add MCP server for PDF processing
grok mcp add pdf-tools "node ./mcp-servers/pdf/index.js"

# Add MCP server for Excel analysis
grok mcp add excel-tools "node ./mcp-servers/excel/index.js"
```

MCP servers can provide tools that Grok uses automatically when needed.

### 5. Prompt Engineering

Include detailed instructions in GROK.md:

```markdown
# GROK.md

## Specialized Capabilities

### PDF Processing

When asked to work with PDFs:

1. Check if pdfplumber is installed
2. Extract text page by page
3. Preserve formatting where possible
4. Handle errors gracefully

### Excel Analysis

When analyzing Excel files:

1. Use pandas for data manipulation
2. Create visualizations with matplotlib
3. Generate summary statistics
4. Export results to CSV or new Excel file

### Git Commit Messages

When generating commit messages:

1. Use conventional commits format
2. Keep first line under 50 characters
3. Explain what and why, not how
4. Reference issue numbers when applicable
```

## When Skills Are Implemented

Future Skills implementation would include:

### Skill Discovery UI

```
What Skills are available?

Available Skills:
pdf-processing - Extract text, fill forms, merge PDFs
excel-analysis - Analyze spreadsheets, create pivot tables
commit-helper - Generate clear commit messages
code-reviewer - Review code for best practices
```

### Skill Management Commands

```bash
# List installed skills
grok skills list

# Install skill from plugin
grok skills install @team/pdf-tools

# Remove skill
grok skills remove pdf-processing

# Update skill
grok skills update excel-analysis
```

### Skill Testing

```bash
# Test skill activation
grok skills test pdf-processing "Extract text from document.pdf"

# Validate skill configuration
grok skills validate .grok/skills/my-skill/
```

## Next steps

<CardGroup cols={2}>
<Card title="Authoring best practices" icon="lightbulb" href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices">
Write Skills that Grok can use effectively
</Card>

<Card title="Agent Skills overview" icon="book" href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview">
Learn how Skills work across Claude products
</Card>

<Card title="Use Skills in the Agent SDK" icon="cube" href="https://docs.claude.com/en/api/agent-sdk/skills">
Use Skills programmatically with TypeScript and Python
</Card>

<Card title="Get started with Agent Skills" icon="rocket" href="https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart">
Create your first Skill
</Card>
</CardGroup>

## See Also

- [Hooks](./hooks.md) - Workflow automation with hooks
- [Plugin System](../features/plugin-system.md) - Plugin system overview
- [MCP Integration](../build-with-claude-code/mcp.md) - Current extensibility
- [Documentation System](../configuration/documentation.md) - Using `.agent/docs/`

---

**Status:** This feature is planned but not yet implemented in Grok One-Shot.
**Last Updated:** 2025-11-07
