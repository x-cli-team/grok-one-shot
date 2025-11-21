# ⚙️ Adding New Commands SOP

## Command System Architecture

### Current Implementation
- Commands handled in `src/hooks/use-input-handler.ts`
- Direct implementation in `handleDirectCommand` function
- No centralized command registry (yet)

### Command Types

#### 1. CLI Commands (Commander.js)
Top-level commands accessible via `grok <command>`:
- Implementation: Create in `src/commands/` directory
- Pattern: `createYourCommand(): Command`
- Registration: Add to `program.addCommand()` in `src/index.ts`
- Examples: `grok mcp`, `grok set-name <name>`, `grok toggle-confirmations`

#### 2. Slash Commands
Built-in commands starting with `/` in chat interface:
- Implementation: Add to `handleDirectCommand` function
- Pattern: `if (trimmedInput === "/your-command") { ... }`
- Registration: Update `commandSuggestions` array

#### 3. Direct Bash Commands
Immediate execution commands:
- Pattern: Add to `directBashCommands` array
- Execution: Automatic bash execution

#### 4. Natural Language
AI-processed commands:
- Fallback: Processed by `processUserMessage`
- Tool selection: Automatic based on AI analysis

### Implementation Steps

#### 1. Add CLI Command
```typescript
// Create src/commands/your-command.ts
import { Command } from 'commander';
import { getSettingsManager } from '../utils/settings-manager.js';
import chalk from 'chalk';

export function createYourCommand(): Command {
  const yourCommand = new Command('your-command');
  yourCommand
    .description('Description of your command')
    .argument('<arg>', 'Required argument')
    .option('-o, --option <value>', 'Optional flag')
    .action(async (arg: string, options) => {
      try {
        // Implementation logic
        const settingsManager = getSettingsManager();
        // ... your code ...
        console.log(chalk.green(`✅ Success: ${arg}`));
      } catch (error: any) {
        console.error(chalk.red(`❌ Failed: ${error.message}`));
        process.exit(1);
      }
    });

  return yourCommand;
}

// Add to src/index.ts
import { createYourCommand } from "./commands/your-command.js";
// ...
program.addCommand(createYourCommand());
```

#### 2. Add Slash Command
```typescript
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
```

#### 2. Add Tool-Based Command
Create tool in `src/tools/`, then reference in command handler.

#### 3. Update Documentation
- Add command to /help output
- Document in .agent/commands/
- Update this SOP if pattern changes

### Best Practices
- **Consistent UX**: Follow existing command patterns
- **Error Handling**: Provide clear feedback
- **Tool Integration**: Leverage existing tool system
- **State Management**: Update chat history appropriately
- **Input Cleanup**: Always call `clearInput()`

### Future Improvements
- Centralized command registry system
- Dynamic command loading
- Plugin-based command architecture

*Updated: 2025-01-13*
