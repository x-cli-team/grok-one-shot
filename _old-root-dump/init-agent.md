# 📖 /init-agent Command

## Purpose
Initialize the .agent documentation system for AI-first project understanding.

## Usage
```bash
/init-agent
```

## What It Does

### 1. Directory Creation
Creates `.agent/` folder structure:
- `system/` - Architecture and current state
- `tasks/` - PRDs and feature specifications  
- `sop/` - Standard operating procedures
- `incidents/` - Failure documentation
- `guardrails/` - Prevention rules
- `commands/` - Command documentation

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

### Grok CLI (Internal)
- Documents Grok CLI's own architecture
- Includes command system patterns
- References existing tool structure

### External Project
- Generic project documentation template
- Prepares for project analysis
- Creates foundation for custom documentation

## Files Created
After running `/init-agent`, you'll have:
- `.agent/README.md` - Main index
- `.agent/system/` - 3 core architecture files
- `.agent/sop/` - Documentation procedures
- `.agent/tasks/example-prd.md` - PRD template
- `.agent/commands/` - Command documentation

## Next Steps
After initialization:
1. Review generated documentation
2. Customize templates for your project
3. Run `/update-agent-docs` after changes
4. Add PRDs to `tasks/` before implementation

## Error Handling
- Checks for existing `.agent/` directory
- Provides clear error messages
- Safe operation (won't overwrite)

*Updated: 2025-10-11*
