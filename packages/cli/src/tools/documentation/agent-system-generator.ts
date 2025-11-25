import * as ops from 'fs-extra';
import path from 'path';
import { existsSync } from 'fs';
import { claudeMdParser } from './claude-md-parser.js';

export interface AgentSystemConfig {
  projectName: string;
  projectType: 'grok-one-shot' | 'external';
  rootPath: string;
}

export class AgentSystemGenerator {
  private config: AgentSystemConfig;

  constructor(config: AgentSystemConfig) {
    this.config = config;
  }

  async generateAgentSystem(): Promise<{ success: boolean; message: string; filesCreated: string[] }> {
    const agentPath = path.join(this.config.rootPath, '.agent');
    const filesCreated: string[] = [];

    try {
      // Check if .agent already exists
      if (existsSync(agentPath)) {
        return {
          success: false,
          message: '.agent directory already exists. Use --rebuild to recreate.',
          filesCreated: []
        };
      }

      // Create .agent directory structure
      await ops.mkdir(agentPath, { recursive: true });
      await ops.mkdir(path.join(agentPath, 'system'), { recursive: true });
      await ops.mkdir(path.join(agentPath, 'tasks'), { recursive: true });
      await ops.mkdir(path.join(agentPath, 'sop'), { recursive: true });
      await ops.mkdir(path.join(agentPath, 'incidents'), { recursive: true });
      await ops.mkdir(path.join(agentPath, 'guardrails'), { recursive: true });
      await ops.mkdir(path.join(agentPath, 'commands'), { recursive: true });

      // Generate README.md (index file)
      const readmeContent = this.generateReadmeContent();
      await ops.promises.writeFile(path.join(agentPath, 'README.md'), readmeContent);
      filesCreated.push('.agent/README.md');

      // Generate system documentation
      const systemFiles = await this.generateSystemDocs(agentPath);
      filesCreated.push(...systemFiles);

      // Generate initial SOP
      const sopFiles = await this.generateInitialSOPs(agentPath);
      filesCreated.push(...sopFiles);

      // Generate example task/PRD
      const taskFiles = await this.generateExampleTask(agentPath);
      filesCreated.push(...taskFiles);

      // Generate command documentation
      const commandFiles = await this.generateCommandDocs(agentPath);
      filesCreated.push(...commandFiles);

      // Update CLAUDE.md with documentation workflow
      const documentationSection = claudeMdParser.generateDocumentationSection();
      const claudeResult = await claudeMdParser.updateClaude(this.config.rootPath, documentationSection);
      
      let claudeMessage = '';
      if (claudeResult.success) {
        claudeMessage = `\n\n${claudeResult.message}`;
        if (!claudeResult.message.includes('already contains')) {
          filesCreated.push('CLAUDE.md');
        }
      }

      return {
        success: true,
        message: `✅ Agent documentation system created successfully!\n\nFiles created:\n${filesCreated.map(f => `  - ${f}`).join('\n')}${claudeMessage}`,
        filesCreated
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create agent system: ${error.message}`,
        filesCreated
      };
    }
  }

  private generateReadmeContent(): string {
    return `# 📚 .agent Documentation System

## Overview
This directory contains AI agent documentation for ${this.config.projectName}. This system helps AI agents understand the project context efficiently without scanning the entire codebase.

## 📁 Directory Structure

### 📋 system/
Core project information and architecture:
- **architecture.md** - Project structure and design patterns
- **api-schema.md** - API endpoints and data schemas  
- **database-schema.md** - Data models and database structure
- **critical-state.md** - Current system state snapshot

### 📝 tasks/
Product requirement documents and feature specifications:
- Store PRDs before implementation
- Reference related architecture and dependencies
- Track implementation progress

### 📖 sop/
Standard operating procedures and workflows:
- Development patterns and conventions
- Deployment and maintenance procedures
- Code review and testing guidelines

### 🚨 incidents/
Documented failures with root cause analysis:
- Error patterns and their fixes
- Recovery procedures
- Prevention strategies

### 🛡️ guardrails/
Enforceable rules to prevent recurring mistakes:
- Naming conventions
- Configuration constraints
- Implementation patterns

### ⚙️ commands/
Documentation for documentation system commands:
- Usage guides for /init-agent, /update-agent-docs, etc.
- Integration workflows

## 🎯 Usage Guidelines

### For AI Agents
1. **Always read README.md first** - Get project overview (this file)
2. **Check system/critical-state.md** - Understand current architecture
3. **Review relevant tasks/** - Check for related work or conflicts
4. **Follow sop/** patterns - Use established conventions
5. **Check guardrails/** - Avoid known failure patterns

### For Updates
- Run \`/update-agent-docs\` after significant changes
- Add new PRDs to tasks/ before implementation
- Update system docs when architecture changes
- Document new patterns in sop/

## 🔗 Cross-References
- Main project documentation: ../README.md
- Configuration: ../.grok/settings.json
- Build instructions: ../package.json

---
*Generated by grok-one-shotDocumentation System*
*Last updated: ${new Date().toISOString().split('T')[0]}*
`;
  }

  private async generateSystemDocs(agentPath: string): Promise<string[]> {
    const systemPath = path.join(agentPath, 'system');
    const files: string[] = [];

    // Architecture overview
    const archContent = this.config.projectType === 'grok-one-shot' 
      ? this.generateGrokArchitecture() 
      : this.generateExternalArchitecture();
    
    await ops.promises.writeFile(path.join(systemPath, 'architecture.md'), archContent);
    files.push('.agent/system/architecture.md');

    // Critical state snapshot
    const criticalStateContent = this.generateCriticalState();
    await ops.promises.writeFile(path.join(systemPath, 'critical-state.md'), criticalStateContent);
    files.push('.agent/system/critical-state.md');

    // API schema (if applicable)
    const apiContent = this.generateApiSchema();
    await ops.promises.writeFile(path.join(systemPath, 'api-schema.md'), apiContent);
    files.push('.agent/system/api-schema.md');

    return files;
  }

  private generateGrokArchitecture(): string {
    return `# 🏗️ grok-one-shotArchitecture

## Project Type
**CLI Application** - Conversational AI tool with terminal interface

## Technology Stack
- **Language**: TypeScript (ES Modules)
- **Runtime**: Node.js (Bun recommended)
- **UI**: Ink (React for terminal)
- **Build**: TypeScript compiler + tsup for dual builds
- **Package Manager**: Bun/NPM

## Core Architecture

### 🧠 Agent System (\`src/agent/\`)
- **GrokAgent**: Central orchestration with streaming, tool execution
- **Conversation Management**: Chat history and context handling
- **Model Integration**: X.AI Grok models via OpenAI-compatible API

### 🛠️ Tool System (\`src/tools/\`)
- **Modular Design**: Independent tools for specific operations
- **Core Tools**: File operations, bash execution, search
- **Advanced Tools**: Multi-file editing, code analysis, operation history
- **Documentation Tools**: NEW - Agent system generation and maintenance

### 🖥️ UI Components (\`src/ui/\`)
- **Chat Interface**: Streaming responses with tool execution display
- **Input Handling**: Enhanced terminal input with history and shortcuts
- **Component Library**: Reusable Ink components for consistent UX

### 🔌 MCP Integration (\`src/mcp/\`)
- **Model Context Protocol**: Extensible server integration
- **Supported Servers**: Linear, GitHub, custom servers
- **Transport Types**: stdio, HTTP, SSE

### ⚙️ Configuration (\`src/utils/\`)
- **Settings Management**: User and project-level config
- **Model Configuration**: Support for multiple AI models
- **File Locations**: ~/.grok/ for user, .grok/ for project

## Build & Distribution
- **Development**: \`bun run dev\` for live reload
- **Production**: \`npm run build\` → dist/ directory
- **Installation**: NPM global package

## Extension Points
- **Tool System**: Add new tools in src/tools/
- **MCP Servers**: Configure external service integration
- **UI Components**: Extend terminal interface capabilities
- **Commands**: Add slash commands in input handler

## Current Capabilities
✅ File operations (read, write, edit, multi-file)
✅ Bash command execution
✅ Code analysis and refactoring
✅ Search and replace operations
✅ MCP server integration
✅ Operation history and undo/redo
✅ Project-specific configuration

## Planned Enhancements
🔲 Documentation generation system
🔲 Subagent framework for context efficiency
🔲 Self-healing guardrails
🔲 Advanced code intelligence
🔲 CI/CD integration

*Updated: ${new Date().toISOString().split('T')[0]}*
`;
  }

  private generateExternalArchitecture(): string {
    return `# 🏗️ Project Architecture

## Project Overview
External project documented using X-CLI's .agent system.

## Technology Stack
*To be analyzed and documented*

## Core Components
*To be identified during project analysis*

## Current State
- Project type: External
- Documentation system: Initialized
- Architecture analysis: Pending

## Next Steps
1. Run project analysis to identify:
   - Technology stack and frameworks
   - Core components and modules
   - Build and deployment processes
   - Dependencies and configurations

2. Update this file with findings
3. Create specific documentation for key components

*This is a template - update after project analysis*
*Updated: ${new Date().toISOString().split('T')[0]}*
`;
  }

  private generateCriticalState(): string {
    const timestamp = new Date().toISOString();
    
    if (this.config.projectType === 'grok-one-shot') {
      return `# 🔧 Current System State

## Architecture Overview
- **Type**: CLI application with React/Ink UI
- **Language**: TypeScript (ESM modules)
- **Build**: TypeScript compiler + tsup dual build (CJS/ESM)
- **Package**: NPM global installation
- **Runtime**: Node.js (Bun recommended)

## Core Components
- **Commands**: Slash-based in src/commands/ (limited - only MCP command currently)
- **Tools**: Modular tools in src/tools/ (extensive tool system)
- **UI**: Ink components in src/ui/
- **Settings**: File-based .grok/settings.json + ~/.grok/config.json
- **Input**: Enhanced terminal input with history in src/hooks/

## Command System
- **Slash Commands**: Handled in useInputHandler.ts
- **Current Commands**: /help, /clear, /models, /commit-and-push, /exit
- **Command Registration**: Direct implementation in input handler
- **Extension Pattern**: Add to handleDirectCommand function

## Authentication & Storage
- **Auth**: Environment variable X_API_KEY or user settings
- **Storage**: Local file system only
- **Database**: None (settings via JSON files)
- **MCP**: Optional server integration

## Current Capabilities
- ✅ File operations (read, write, edit, multi-file)
- ✅ Bash command execution with output capture
- ✅ Code analysis (AST parsing, refactoring)
- ✅ Search functionality (ripgrep-based)
- ✅ Operation history and undo/redo
- ✅ MCP server integration
- ✅ Todo management system
- ❌ No documentation generation system (yet)
- ❌ No cloud storage integration
- ❌ No built-in authentication system

## Build Configuration
- **TypeScript**: ESM modules with dual CJS/ESM output
- **Dependencies**: Ink, React, commander, chalk, ripgrep
- **Scripts**: dev, build, start, lint, typecheck

## Known Limitations
- Command system not centralized (handled in input hook)
- No formal command registration system
- Limited built-in documentation capabilities

## Recent Changes
- Fixed React import issues for ESM compatibility
- Implemented dual-build system with tsup
- Reverted to working TypeScript build

Last Updated: ${timestamp}
Updated By: Agent System Generator during /init-agent
`;
    } else {
      return `# 🔧 Current System State

## Project Analysis
- **Project Type**: External project
- **Documentation Status**: Initialized
- **Analysis Status**: Pending

## Discovered Components
*To be populated during analysis*

## Current Capabilities
*To be identified*

## Configuration
*To be documented*

## Dependencies
*To be analyzed*

Last Updated: ${timestamp}
Updated By: Agent System Generator during /init-agent
*This file will be updated as the project is analyzed*
`;
    }
  }

  private generateApiSchema(): string {
    if (this.config.projectType === 'grok-one-shot') {
      return `# 🔌 API Schema

## Grok API Integration

### Base Configuration
\`\`\`typescript
{
  baseURL: "https://api.x.ai/v1",
  defaultModel: "grok-4.1",
  apiKey: process.env.X_API_KEY
}
\`\`\`

### Available Models
- **grok-4-latest**: Latest Grok model with enhanced capabilities
- **grok-4-fast-non-reasoning**: Optimized for code generation (default)
- **grok-3-fast**: Fast general-purpose model

### Tool Integration Schema
Tools follow OpenAI function calling format:

\`\`\`typescript
interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON stringified
  };
}

interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}
\`\`\`

### MCP Server Schema
Model Context Protocol integration:

\`\`\`typescript
interface MCPServerConfig {
  name: string;
  transport: {
    type: 'stdio' | 'http' | 'sse' | 'streamable_http';
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
    headers?: Record<string, string>;
  };
}
\`\`\`

## Internal APIs

### Agent Interface
\`\`\`typescript
interface GrokAgent {
  processUserMessageStream(input: string): AsyncGenerator<StreamChunk>;
  executeBashCommand(command: string): Promise<ToolResult>;
  setModel(model: string): void;
  getCurrentModel(): string;
}
\`\`\`

### Tool Interface
\`\`\`typescript
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema7;
  execute(args: any): Promise<ToolResult>;
}
\`\`\`

*Updated: ${new Date().toISOString().split('T')[0]}*
`;
    } else {
      return `# 🔌 API Schema

## Project APIs
*To be documented after project analysis*

## External Dependencies
*To be identified*

## Data Models
*To be documented*

*This file will be updated as APIs are discovered and analyzed*
*Updated: ${new Date().toISOString().split('T')[0]}*
`;
    }
  }

  private async generateInitialSOPs(agentPath: string): Promise<string[]> {
    const sopPath = path.join(agentPath, 'sop');
    const files: string[] = [];

    // Documentation workflow SOP
    const docWorkflowContent = `# 📚 Documentation Workflow SOP

## When to Update Documentation

### Trigger Events
1. **Architecture Changes**: New components, modified structure
2. **New Features**: Added functionality or tools
3. **Configuration Changes**: Settings, build process, dependencies
4. **After Major Commits**: Significant code changes
5. **Failed Operations**: Document lessons learned

### Update Process

#### 1. Before Implementation
- [ ] Read .agent/README.md for project overview
- [ ] Check .agent/system/critical-state.md for current architecture  
- [ ] Review .agent/tasks/ for related work or conflicts
- [ ] Scan .agent/sop/ for established patterns
- [ ] Check .agent/guardrails/ for constraints

#### 2. During Implementation
- [ ] Store PRDs in .agent/tasks/ before coding
- [ ] Reference architecture docs for consistency
- [ ] Follow established patterns from SOPs
- [ ] Use cross-references between .agent docs

#### 3. After Implementation
- [ ] Run \`/update-agent-docs\` to capture changes
- [ ] Update .agent/system/ if architecture changed
- [ ] Add new SOPs for repeatable processes
- [ ] Link related tasks and documents
- [ ] Test documentation updates for accuracy

## Documentation Standards

### File Organization
- **system/**: Core architecture and state
- **tasks/**: PRDs and feature specifications
- **sop/**: Procedures and workflows
- **incidents/**: Failure documentation
- **guardrails/**: Prevention rules

### Writing Guidelines
- **Conciseness**: Keep sections under 300 tokens
- **Cross-linking**: Use relative links between docs
- **Consistency**: Follow established markdown patterns
- **Freshness**: Include update timestamps
- **Relevance**: Focus on actionable information

### Template Usage
- Use consistent headings and structure
- Include metadata (updated date, updated by)
- Reference related documents
- Maintain clear navigation

## Automation
- Auto-update triggers configured in .grok/settings.json
- Smart prompts after key file changes
- Token threshold reminders
- Integration with git commit hooks

*Updated: ${new Date().toISOString().split('T')[0]}*
`;

    await ops.promises.writeFile(path.join(sopPath, 'documentation-workflow.md'), docWorkflowContent);
    files.push('.agent/sop/documentation-workflow.md');

    // Adding new command SOP (grok-one-shotspecific)
    if (this.config.projectType === 'grok-one-shot') {
      const newCommandContent = `# ⚙️ Adding New Commands SOP

## Command System Architecture

### Current Implementation
- Commands handled in \`src/hooks/use-input-handler.ts\`
- Direct implementation in \`handleDirectCommand\` function
- No centralized command registry (yet)

### Command Types

#### 1. Slash Commands
Built-in commands starting with \`/\`:
- Implementation: Add to \`handleDirectCommand\` function
- Pattern: \`if (trimmedInput === "/your-command") { ... }\`
- Registration: Update \`commandSuggestions\` array

#### 2. Direct Bash Commands  
Immediate execution commands:
- Pattern: Add to \`directBashCommands\` array
- Execution: Automatic bash execution

#### 3. Natural Language
AI-processed commands:
- Fallback: Processed by \`processUserMessage\`
- Tool selection: Automatic based on AI analysis

### Implementation Steps

#### 1. Add Slash Command
\`\`\`typescript
// In commandSuggestions array
{ command: "/your-command", description: "Your command description" }

// In handleDirectCommand function  
if (trimmedInput === "/your-command") {
  // Implementation logic
  const result = await someOperation();
  
  const entry: ChatEntry = {
    type: "assistant",
    content: result,
    timestamp: new Date(),
  };
  setChatHistory((prev) => [...prev, entry]);
  clearInput();
  return true;
}
\`\`\`

#### 2. Add Tool-Based Command
Create tool in \`src/tools/\`, then reference in command handler.

#### 3. Update Documentation
- Add command to /help output
- Document in .agent/commands/
- Update this SOP if pattern changes

### Best Practices
- **Consistent UX**: Follow existing command patterns
- **Error Handling**: Provide clear feedback
- **Tool Integration**: Leverage existing tool system
- **State Management**: Update chat history appropriately
- **Input Cleanup**: Always call \`clearInput()\`

### Future Improvements
- Centralized command registry system
- Dynamic command loading
- Plugin-based command architecture

*Updated: ${new Date().toISOString().split('T')[0]}*
`;

      await ops.promises.writeFile(path.join(sopPath, 'adding-new-command.md'), newCommandContent);
      files.push('.agent/sop/adding-new-command.md');
    }

    return files;
  }

  private async generateExampleTask(agentPath: string): Promise<string[]> {
    const tasksPath = path.join(agentPath, 'tasks');
    const files: string[] = [];

    const exampleContent = this.config.projectType === 'grok-one-shot'
      ? this.generateGrokExampleTask()
      : this.generateExternalExampleTask();

    await ops.promises.writeFile(path.join(tasksPath, 'example-prd.md'), exampleContent);
    files.push('.agent/tasks/example-prd.md');

    return files;
  }

  private generateGrokExampleTask(): string {
    return `# 📋 Example PRD: Documentation System Enhancement

## Objective
Add comprehensive documentation generation capabilities to X-CLI.

## Background
grok-one-shotneeds better documentation tools to help users document both the CLI itself and their projects efficiently.

## Requirements

### Must Have
- [ ] \`/init-agent\` command for .agent system creation
- [ ] \`/docs\` interactive menu for documentation options
- [ ] \`/readme\` command for README generation
- [ ] Integration with existing command system

### Should Have  
- [ ] \`/api-docs\` for API documentation
- [ ] \`/comments\` for code comment generation
- [ ] Auto-update system for documentation maintenance

### Could Have
- [ ] Custom templates for different project types
- [ ] Documentation quality scoring
- [ ] Integration with external documentation tools

## Technical Approach

### Architecture Impact
- New tool directory: \`src/tools/documentation/\`
- Command integration: Update \`use-input-handler.ts\`
- New dependencies: Minimal (leverage existing tools)

### Implementation Strategy
1. **Phase 1**: Agent system generator tool
2. **Phase 2**: Core documentation commands
3. **Phase 3**: Advanced features and automation

### Compatibility
- Must not break existing functionality
- Should follow established command patterns
- Integrate with current tool system architecture

## Success Criteria
- [ ] Users can run \`/init-agent\` and get functional documentation
- [ ] Commands are discoverable and intuitive
- [ ] Generated documentation is high quality
- [ ] System integrates seamlessly with existing workflow

## Dependencies
- Existing AST parser tool
- Current search functionality  
- File operation tools
- Command system in input handler

## Risks & Mitigation
- **Risk**: Command system complexity
- **Mitigation**: Follow existing patterns, minimal changes

## Timeline
- **Week 1-2**: Foundation and agent system
- **Week 3-4**: Core documentation commands
- **Week 5-6**: Advanced features and polish

---
*This is an example PRD showing the format and level of detail expected*
*Created: ${new Date().toISOString().split('T')[0]}*
*Status: Example/Template*
`;
  }

  private generateExternalExampleTask(): string {
    return `# 📋 Example PRD Template

## Objective
*Describe what you want to build or improve*

## Background
*Provide context about why this is needed*

## Requirements

### Must Have
- [ ] *Critical features that must be implemented*

### Should Have
- [ ] *Important features that add significant value*

### Could Have
- [ ] *Nice-to-have features for future consideration*

## Technical Approach

### Architecture Impact
*How will this change the system architecture?*

### Implementation Strategy
*High-level approach and phases*

### Dependencies
*What existing systems or external dependencies are required?*

## Success Criteria
- [ ] *How will you know this is successful?*

## Risks & Mitigation
- **Risk**: *Potential issues*
- **Mitigation**: *How to address them*

## Timeline
*Estimated implementation timeline*

---
*This is a template - replace with actual PRD content*
*Created: ${new Date().toISOString().split('T')[0]}*
*Status: Template*
`;
  }

  private async generateCommandDocs(agentPath: string): Promise<string[]> {
    const commandsPath = path.join(agentPath, 'commands');
    const files: string[] = [];

    // /init-agent documentation
    const initAgentContent = `# 📖 /init-agent Command

## Purpose
Initialize the .agent documentation system for AI-first project understanding.

## Usage
\`\`\`bash
/init-agent
\`\`\`

## What It Does

### 1. Directory Creation
Creates \`.agent/\` folder structure:
- \`system/\` - Architecture and current state
- \`tasks/\` - PRDs and feature specifications  
- \`sop/\` - Standard operating procedures
- \`incidents/\` - Failure documentation
- \`guardrails/\` - Prevention rules
- \`commands/\` - Command documentation

### 2. Initial Documentation
- **README.md**: Navigation and overview
- **system/architecture.md**: Project structure
- **system/critical-state.md**: Current system snapshot
- **system/api-schema.md**: APIs and interfaces
- **sop/documentation-workflow.md**: Update procedures

### 3. Integration
- Updates or creates CLAUDE.md with workflow instructions
- Configures documentation system for the project type
- Sets up foundation for other documentation commands

## Project Types

### grok-one-shot(Internal)
- Documents X-CLI's own architecture
- Includes command system patterns
- References existing tool structure

### External Project
- Generic project documentation template
- Prepares for project analysis
- Creates foundation for custom documentation

## Files Created
After running \`/init-agent\`, you'll have:
- \`.agent/README.md\` - Main index
- \`.agent/system/\` - 3 core architecture files
- \`.agent/sop/\` - Documentation procedures
- \`.agent/tasks/example-prd.md\` - PRD template
- \`.agent/commands/\` - Command documentation

## Next Steps
After initialization:
1. Review generated documentation
2. Customize templates for your project
3. Run \`/update-agent-docs\` after changes
4. Add PRDs to \`tasks/\` before implementation

## Error Handling
- Checks for existing \`.agent/\` directory
- Provides clear error messages
- Safe operation (won't overwrite)

*Updated: ${new Date().toISOString().split('T')[0]}*
`;

    await ops.promises.writeFile(path.join(commandsPath, 'init-agent.md'), initAgentContent);
    files.push('.agent/commands/init-agent.md');

    return files;
  }

  async rebuildAgentSystem(): Promise<{ success: boolean; message: string; filesCreated: string[] }> {
    const agentPath = path.join(this.config.rootPath, '.agent');
    
    try {
      // Remove existing .agent directory if it exists
      if (existsSync(agentPath)) {
        await ops.rm(agentPath, { recursive: true, force: true });
      }

      // Generate new system
      return await this.generateAgentSystem();
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to rebuild agent system: ${error.message}`,
        filesCreated: []
      };
    }
  }
}