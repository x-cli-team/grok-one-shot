---
title: Agent Skills
---

# Agent Skills

> ** PARITY GAP**: Grok One-Shot does not currently implement the Agent Skills system described in this document. This is a Claude Code feature planned for future implementation.

## What Are Agent Skills?

Agent Skills are modular capabilities that extend an AI agent's functionality through organized folders containing instructions, scripts, and resources. Each Skill consists of a `SKILL.md` file with instructions that the AI reads when relevant, plus optional supporting files.

## Status in Grok One-Shot

**Current Status:** Not Implemented

**What Skills Enable (in Claude Code):**

- **Extend AI capabilities**: Package expertise into discoverable capabilities
- **Model-invoked**: AI autonomously decides when to use them based on your request
- **Share expertise**: Distribute Skills across teams via git or plugins
- **Reduce repetitive prompting**: Encode common workflows as reusable Skills
- **Compose functionality**: Combine multiple Skills for complex tasks

**Example Use Cases:**

- PDF processing (extract text, fill forms, merge documents)
- Code review checklists and standards
- Project-specific workflows (deployment, testing, documentation)
- Data analysis pipelines
- Custom linting and validation

## Alternative Approaches in Grok One-Shot

Since Skills aren't available yet, you can achieve similar outcomes through:

### 1. Project Context in GROK.md

Use the project's `GROK.md` file to encode domain knowledge and workflows:

```markdown
# GROK.md

## PDF Processing

When working with PDF files:

1. Use `pypdf` for text extraction
2. Use `pdfplumber` for table extraction
3. Use `reportlab` for PDF generation

Example commands:
\`\`\`python
import pdfplumber
with pdfplumber.open("doc.pdf") as pdf:
text = pdf.pages[0].extract_text()
\`\`\`

## Code Review Standards

Always check:

- Error handling in all async functions
- Input validation for public APIs
- Test coverage for business logic
- Documentation for exported functions
```

### 2. Documentation in .agent/docs/

Create detailed guides in your project's `.agent/docs/` directory:

```bash
# Project structure
.agent/
├── docs/
│ ├── workflows/
│ │ ├── pdf-processing.md
│ │ ├── deployment.md
│ │ └── code-review.md
│ └── standards/
│ ├── testing.md
│ └── security.md
└── docs-index.md
```

Grok One-Shot will load these on-demand when relevant.

### 3. Custom Slash Commands (Future)

Once custom slash commands are supported, you could create reusable prompts:

```bash
# .grok/commands/review-code.md (future)
---
description: Review code for best practices and potential issues
---

Review the specified code for:
1. Code organization and structure
2. Error handling
3. Performance considerations
4. Security concerns
5. Test coverage
```

### 4. Shell Scripts with MCP

Create helper scripts and expose them via MCP servers:

```bash
# scripts/pdf-extract.sh
#!/bin/bash
python3 -c "
import pdfplumber
import sys
with pdfplumber.open(sys.argv[1]) as pdf:
for page in pdf.pages:
print(page.extract_text())
" "$1"
```

Then reference these scripts in your GROK.md.

### 5. Session-Level Instructions

Provide detailed instructions at the start of each session:

```
> I'm working on PDF processing. When I ask you to extract PDF data, use pdfplumber for tables and pypdf for text. Always validate the file exists first and handle errors gracefully.
```

## When Skills Are Implemented

Future Skills structure in Grok One-Shot would likely be:

```
~/.grok/skills/ # Personal Skills
.grok/skills/ # Project Skills
└── pdf-processing/
├── SKILL.md # Main skill definition
├── reference.md # Additional documentation
└── scripts/
└── extract.py # Helper scripts
```

Example `SKILL.md` (future):

```yaml
---
name: pdf-processing
description: Extract text, fill forms, merge PDFs. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
allowed-tools: Read, Write, Bash
---

# PDF Processing

## Instructions
1. Use pdfplumber for text extraction
2. Use pypdf for form filling
3. Always validate input files exist
4. Handle errors gracefully

## Examples
[Examples would go here]
```

## Comparison: Skills vs Alternatives

| Feature                 | Skills (Claude Code)  | GROK.md            | .agent/docs/    |
| ----------------------- | --------------------- | ------------------ | --------------- |
| **Auto-discovery**      | Yes (model-invoked)   | No (always loaded) | Yes (on-demand) |
| **Shareable**           | Via plugins           | Via git            | Via git         |
| **Tool restrictions**   | Yes (`allowed-tools`) | No                 | No              |
| **Multiple files**      | Yes                   | Single file        | Yes             |
| **Progressive loading** | Yes                   | No                 | Yes             |

## See Also

- [GROK.md Documentation](../../getting-started/overview.md#project-context-grokmd) - Project context system
- [Documentation Index](../../../docs-index.md) - On-demand doc loading
- [MCP Integration](../build-with-claude-code/mcp.md) - Custom tool integration

---

**Want this feature?** Consider:

- Opening a feature request in the Grok One-Shot repository
- Using GROK.md and .agent/docs/ as interim solutions
- Creating comprehensive documentation for your workflows

**Last Updated:** 2025-11-07
