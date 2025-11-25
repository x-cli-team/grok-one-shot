import * as ops from 'fs-extra';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface ClaudeMdParser {
  parseClaude(rootPath: string): Promise<{ exists: boolean; content: string; hasDocumentationSection: boolean }>;
  updateClaude(rootPath: string, documentationSection: string): Promise<{ success: boolean; message: string }>;
  generateDocumentationSection(): string;
}

export class ClaudeMdParserImpl implements ClaudeMdParser {
  
  async parseClaude(rootPath: string): Promise<{ exists: boolean; content: string; hasDocumentationSection: boolean }> {
    const claudePath = path.join(rootPath, 'CLAUDE.md');
    
    if (!existsSync(claudePath)) {
      return {
        exists: false,
        content: '',
        hasDocumentationSection: false
      };
    }

    try {
      const content = await ops.promises.readFile(claudePath, 'utf-8');
      const hasDocumentationSection = content.includes('Documentation System Workflow') || 
                                     content.includes('.agent documentation system');

      return {
        exists: true,
        content,
        hasDocumentationSection
      };
    } catch (error) {
      return {
        exists: false,
        content: '',
        hasDocumentationSection: false
      };
    }
  }

  async updateClaude(rootPath: string, documentationSection: string): Promise<{ success: boolean; message: string }> {
    const claudePath = path.join(rootPath, 'CLAUDE.md');
    
    try {
      const { exists, content, hasDocumentationSection } = await this.parseClaude(rootPath);

      if (hasDocumentationSection) {
        return {
          success: true,
          message: '✅ CLAUDE.md already contains documentation system instructions'
        };
      }

      let newContent: string;

      if (exists) {
        // Append to existing CLAUDE.md
        newContent = content + '\n\n' + documentationSection;
      } else {
        // Create new CLAUDE.md with basic header
        newContent = `# CLAUDE.md

This document provides context and instructions for Claude Code when working with this project.

${documentationSection}`;
      }

      await ops.promises.writeFile(claudePath, newContent);

      return {
        success: true,
        message: exists 
          ? '✅ Updated existing CLAUDE.md with documentation system instructions'
          : '✅ Created CLAUDE.md with documentation system instructions'
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to update CLAUDE.md: ${error.message}`
      };
    }
  }

  generateDocumentationSection(): string {
    return `## 📚 Documentation System Workflow

### Before Planning Features:
1. **Read \`.agent/README.md\`** for project overview
2. **Check \`.agent/system/\`** for architecture context
3. **Review \`.agent/tasks/\`** for related work
4. **Scan \`.agent/sop/\`** for established patterns

### During Implementation:
- Store PRDs in \`.agent/tasks/\` before coding
- Reference architecture docs for consistency
- Follow established patterns from SOPs
- Use cross-references between .agent docs

### After Implementation:
- Run \`/update-agent-docs\` to capture changes
- Update \`.agent/system/\` if architecture changed
- Add new SOPs for repeatable processes
- Link related tasks and documents

### Documentation Rules:
- Keep system docs as single source of truth
- Use relative links between .agent documents  
- Maintain concise, actionable content
- Update cross-references when adding new docs

### Token Optimization:
- Read .agent docs hierarchically (README → critical-state → relevant docs)
- Expect ~600 tokens for full context vs 3000+ without system
- Use .agent structure to avoid redundant codebase scanning
- Reference existing documentation rather than recreating context

---
*This section was added by the grok-one-shotdocumentation system*`;
  }
}

export const claudeMdParser = new ClaudeMdParserImpl();