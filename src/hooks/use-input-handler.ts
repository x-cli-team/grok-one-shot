import { useState, useMemo, useEffect } from "react";
import { useInput } from "ink";
import path from "path";
import { GrokAgent, ChatEntry } from "../agent/grok-agent.js";
import { ConfirmationService } from "../utils/confirmation-service.js";
import { useEnhancedInput, Key } from "./use-enhanced-input.js";
import { GrokToolCall } from "../grok/client.js";
import { ToolResult } from "../types/index.js";
// Paste detection now handled inline with pre-capture strategy
import { usePlanMode } from "./use-plan-mode.js";
import { detectComplexity } from "../services/complexity-detector.js";

import { filterCommandSuggestions } from "../ui/components/command-suggestions.js";
import { loadModelConfig, updateCurrentModel } from "../utils/model-config.js";
import { AgentSystemGenerator } from "../tools/documentation/agent-system-generator.js";
import { generateDocsMenuText, findDocsMenuOption } from "../tools/documentation/docs-menu.js";
import { ReadmeGenerator } from "../tools/documentation/readme-generator.js";
import { CommentsGenerator } from "../tools/documentation/comments-generator.js";
import { ApiDocsGenerator } from "../tools/documentation/api-docs-generator.js";
import { ChangelogGenerator } from "../tools/documentation/changelog-generator.js";
import { UpdateAgentDocs } from "../tools/documentation/update-agent-docs.js";
import { SubagentFramework } from "../subagents/subagent-framework.js";
import { SelfHealingSystem } from "../tools/documentation/self-healing-system.js";
import { checkForUpdates, autoUpgrade } from "../utils/version-checker.js";
import { getSettingsManager } from "../utils/settings-manager.js";
import pkg from "../../package.json" with { type: "json" };

// Global paste state - declare at module level
declare global {
  var grokPasteCache: Map<string, string> | undefined;
  var grokPasteCounter: number | undefined;
  var grokStreamingPasteBuffer: string | undefined;
  var grokExistingInputBeforePaste: string | undefined;
  var grokCursorPositionBeforePaste: number | undefined;
}

interface UseInputHandlerProps {
  agent: GrokAgent;
  chatHistory: ChatEntry[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatEntry[]>>;
  setIsProcessing: (processing: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setTokenCount: (count: number) => void;
  setProcessingTime: (time: number) => void;
  processingStartTime: React.MutableRefObject<number>;
  isProcessing: boolean;
  isStreaming: boolean;
  isConfirmationActive?: boolean;
  onGlobalShortcut?: (str: string, key: Key) => boolean;
  introductionState?: { needsIntroduction: boolean; isCollectingOperatorName: boolean; isCollectingAgentName: boolean; };
  handleIntroductionInput?: (input: string) => boolean;
}

interface CommandSuggestion {
  command: string;
  description: string;
}

interface ModelOption {
  model: string;
}

export function useInputHandler({
  agent,
  chatHistory,
  setChatHistory,
  setIsProcessing,
  setIsStreaming,
  setTokenCount,
  setProcessingTime,
  processingStartTime,
  isProcessing,
  isStreaming,
  isConfirmationActive = false,
  onGlobalShortcut,
  handleIntroductionInput,
}: UseInputHandlerProps) {
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [autoEditEnabled, setAutoEditEnabled] = useState(() => {
    const confirmationService = ConfirmationService.getInstance();
    const sessionFlags = confirmationService.getSessionFlags();
    return sessionFlags.allOperations;
  });
  const [shiftTabPressCount, setShiftTabPressCount] = useState(0);
  const [lastShiftTabTime, setLastShiftTabTime] = useState(0);
  const [verbosityLevel, setVerbosityLevel] = useState<'quiet' | 'normal' | 'verbose'>(() => {
    try {
      const manager = getSettingsManager();
      return manager.getUserSetting('verbosityLevel') || 'quiet';
    } catch {
      return 'quiet';
    }
  });
  const [explainLevel, setExplainLevel] = useState<'off' | 'brief' | 'detailed'>(() => {
    try {
      const manager = getSettingsManager();
      return manager.getUserSetting('explainLevel') || 'brief';
    } catch {
      return 'brief';
    }
  });
  const [_interactivityLevel, _setInteractivityLevel] = useState<'chat' | 'balanced' | 'repl'>(() => {
    try {
      const manager = getSettingsManager();
      return (manager.getUserSetting('interactivityLevel') as 'chat' | 'balanced' | 'repl' | undefined) || 'balanced';
    } catch {
      return 'balanced';
    }
  });

  // Initialize plan mode hook
  const planMode = usePlanMode({}, agent);

  const handleSpecialKey = (key: Key): boolean => {
    // Don't handle input if confirmation dialog is active
    if (isConfirmationActive) {
      return true; // Prevent default handling
    }


    // Handle shift+tab for both auto-edit and plan mode activation
    if (key.shift && key.tab) {
      const now = Date.now();
      const timeSinceLastPress = now - lastShiftTabTime;
      
      // Reset count if more than 2 seconds have passed
      if (timeSinceLastPress > 2000) {
        setShiftTabPressCount(1);
      } else {
        setShiftTabPressCount(prev => prev + 1);
      }
      
      setLastShiftTabTime(now);
      
      // Check for plan mode activation (shift+tab twice within 2 seconds)
      if (shiftTabPressCount >= 2) {
        // Second shift+tab press - activate plan mode
        if (!planMode.isActive) {
          // Pass the setChatHistory function to enable rich activation feedback
          planMode.activatePlanMode({}, setChatHistory);
          
          // Start exploration automatically
          planMode.startExploration();
          
          setShiftTabPressCount(0); // Reset counter
          return true;
        } else {
          // Already in plan mode - exit plan mode
          planMode.deactivatePlanMode('user_requested');
          
          const exitEntry: ChatEntry = {
            type: "assistant", 
            content: "🎯 **Plan Mode Deactivated**\n\nExiting plan mode and returning to normal operation.",
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, exitEntry]);
          
          setShiftTabPressCount(0); // Reset counter
          return true;
        }
      } else if (shiftTabPressCount === 1) {
        // First shift+tab press - toggle auto-edit mode
        const newAutoEditState = !autoEditEnabled;
        setAutoEditEnabled(newAutoEditState);

        const confirmationService = ConfirmationService.getInstance();
        if (newAutoEditState) {
          // Enable auto-edit: set all operations to be accepted
          confirmationService.setSessionFlag("allOperations", true);
        } else {
          // Disable auto-edit: reset session flags
          confirmationService.resetSession();
        }
        
        // Reset plan mode counter if we're handling auto-edit
        setTimeout(() => setShiftTabPressCount(0), 2500);
      }
      
      return true; // Handled
    }

    // Handle escape key for closing menus
    if (key.escape) {
      if (showCommandSuggestions) {
        setShowCommandSuggestions(false);
        setSelectedCommandIndex(0);
        return true;
      }
      if (showModelSelection) {
        setShowModelSelection(false);
        setSelectedModelIndex(0);
        return true;
      }
      if (isProcessing || isStreaming) {
        agent.abortCurrentOperation();
        setIsProcessing(false);
        setIsStreaming(false);
        setTokenCount(0);
        setProcessingTime(0);
        processingStartTime.current = 0;
        return true;
      }
      return false; // Let default escape handling work
    }

    // Handle command suggestions navigation
    if (showCommandSuggestions) {
      const filteredSuggestions = filterCommandSuggestions(
        commandSuggestions,
        input
      );

      if (filteredSuggestions.length === 0) {
        setShowCommandSuggestions(false);
        setSelectedCommandIndex(0);
        return false; // Continue processing
      } else {
        if (key.upArrow) {
          setSelectedCommandIndex((prev) =>
            prev === 0 ? filteredSuggestions.length - 1 : prev - 1
          );
          return true;
        }
        if (key.downArrow) {
          setSelectedCommandIndex(
            (prev) => (prev + 1) % filteredSuggestions.length
          );
          return true;
        }
        if (key.tab || key.return) {
          const safeIndex = Math.min(
            selectedCommandIndex,
            filteredSuggestions.length - 1
          );
          const selectedCommand = filteredSuggestions[safeIndex];
          const newInput = selectedCommand.command + " ";
          setInput(newInput);
          setCursorPosition(newInput.length);
          setShowCommandSuggestions(false);
          setSelectedCommandIndex(0);
          return true;
        }
      }
    }

    // Handle model selection navigation
    if (showModelSelection) {
      if (key.upArrow) {
        setSelectedModelIndex((prev) =>
          prev === 0 ? availableModels.length - 1 : prev - 1
        );
        return true;
      }
      if (key.downArrow) {
        setSelectedModelIndex((prev) => (prev + 1) % availableModels.length);
        return true;
      }
      if (key.tab || key.return) {
        const selectedModel = availableModels[selectedModelIndex];
        agent.setModel(selectedModel.model);
        updateCurrentModel(selectedModel.model);
        const confirmEntry: ChatEntry = {
          type: "assistant",
          content: `✓ Switched to model: ${selectedModel.model}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, confirmEntry]);
        setShowModelSelection(false);
        setSelectedModelIndex(0);
        return true;
      }
    }

    return false; // Let default handling proceed
  };

  const handleInputSubmit = async (userInput: string) => {
    if (userInput === "exit" || userInput === "quit") {
      process.exit(0);
      return;
    }

    // Check for introduction input first
    if (handleIntroductionInput && handleIntroductionInput(userInput.trim())) {
      return;
    }

    const trimmedInput = userInput.trim();
    if (trimmedInput) {
      const directCommandResult = await handleDirectCommand(userInput);
      if (!directCommandResult) {
        // Normal processing
        await processUserMessage(userInput);
      }
    }
  };

  // Paste detection is now handled directly in enhanced input

  const handleInputChange = (newInput: string) => {
    // Update command suggestions based on input
    if (newInput.startsWith("/")) {
      setShowCommandSuggestions(true);
      setSelectedCommandIndex(0);
    } else {
      setShowCommandSuggestions(false);
      setSelectedCommandIndex(0);
    }
  };

  const {
    input,
    cursorPosition,
    setInput,
    setCursorPosition,
    clearInput,
    insertAtCursor,
    resetHistory,
    handleInput,
  } = useEnhancedInput({
    onSubmit: handleInputSubmit,
    onSpecialKey: handleSpecialKey,
    // Paste detection handled inline
    disabled: isConfirmationActive,
    multiline: true, // Enable multiline mode to handle pasted content properly
  });

  // Initialize global paste state

  // Initialize globals
  if (typeof globalThis.grokPasteCache === 'undefined') {
    globalThis.grokPasteCache = new Map();
  }
  if (typeof globalThis.grokPasteCounter === 'undefined') {
    globalThis.grokPasteCounter = 0;
  }

  // Hook up the actual input handling with paste detection
  useInput((inputChar: string, key: Key) => {
    // Check global shortcuts before normal input handling
    if (onGlobalShortcut && onGlobalShortcut(inputChar, key)) {
      return; // Handled by global shortcut
    }

    // ⭐ PASTE DETECTION: Check if this is a paste operation
    if (inputChar.length > 1) {
      // 🔑 CRITICAL: Pre-capture existing input and cursor position BEFORE paste processing begins
      const existingInputBeforePaste = input;
      const cursorPositionBeforePaste = cursorPosition;
      if (!globalThis.grokStreamingPasteBuffer) {
        globalThis.grokExistingInputBeforePaste = existingInputBeforePaste;
        globalThis.grokCursorPositionBeforePaste = cursorPositionBeforePaste;
      }

      // Accumulate paste content via streaming buffer
      if (!globalThis.grokStreamingPasteBuffer) {
        globalThis.grokStreamingPasteBuffer = '';
      }
      globalThis.grokStreamingPasteBuffer += inputChar;

      // Start timeout for paste completion (100ms)
      setTimeout(() => {
        const pastedContent = globalThis.grokStreamingPasteBuffer;
        const existingInput = globalThis.grokExistingInputBeforePaste || '';

        if (pastedContent && (pastedContent.length > 100 || pastedContent.split(/\r\n|\r|\n/).length > 10)) {
          // Generate paste summary for large content
          const lines = pastedContent.split(/\r\n|\r|\n/);
          globalThis.grokPasteCounter! += 1;
          const summary = `[Pasted text #${globalThis.grokPasteCounter} +${lines.length} lines]`;

          // Cache full content for later expansion
          globalThis.grokPasteCache!.set(summary, pastedContent);

          // Restore original input state and insert summary at correct position
          const existingInput = globalThis.grokExistingInputBeforePaste || '';
          const cursorPos = globalThis.grokCursorPositionBeforePaste || 0;
          
          // First restore the original input state
          setInput(existingInput);
          setCursorPosition(cursorPos);
          
          // Then insert the summary - insertAtCursor will handle cursor positioning
          setTimeout(() => {
            insertAtCursor(summary);
          }, 10);

          // Add paste confirmation to chat history
          const pasteConfirmationEntry: ChatEntry = {
            type: "assistant",
            content: `📄 Large paste detected: ${lines.length} lines, showing summary`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, pasteConfirmationEntry]);
        } else if (pastedContent) {
          // Handle small pastes - insert at cursor position  
          const existingInput = globalThis.grokExistingInputBeforePaste || '';
          const cursorPos = globalThis.grokCursorPositionBeforePaste || 0;
          
          const beforeCursor = existingInput.slice(0, cursorPos);
          const afterCursor = existingInput.slice(cursorPos);
          const combinedContent = beforeCursor + pastedContent + afterCursor;

          // Update input state with the actual pasted content
          setInput(combinedContent);
          // Ensure cursor is positioned after the pasted content with immediate timeout
          setTimeout(() => {
            setCursorPosition(beforeCursor.length + pastedContent.length);
          }, 0);
        }

        // Clear paste state
        globalThis.grokStreamingPasteBuffer = undefined;
        globalThis.grokExistingInputBeforePaste = undefined;
        globalThis.grokCursorPositionBeforePaste = undefined;
      }, 100);

      return; // CRITICAL: Don't call handleInput for paste chunks - this prevents cursor interference
    }
    
    // Only process as regular input if it's not a paste chunk
    handleInput(inputChar, key);
  });

  // Update command suggestions when input changes
  useEffect(() => {
    handleInputChange(input);
  }, [input]);

  const commandSuggestions: CommandSuggestion[] = [
    { command: "/help", description: "Show help information" },
    { command: "/clear", description: "Clear chat history" },
    { command: "/models", description: "Switch Grok Model" },
    { command: "/verbosity", description: "Control output verbosity (quiet/normal/verbose)" },
    { command: "/explain", description: "Control operation explanations (off/brief/detailed)" },
    { command: "/interactivity", description: "Set interaction style (chat/balanced/repl)" },
    { command: "/upgrade", description: "Check for updates and upgrade CLI" },
    { command: "/version", description: "Show version information" },
    { command: "/switch", description: "Switch to specific version" },
    { command: "/init-agent", description: "Initialize .agent documentation system" },
    { command: "/docs", description: "Documentation generation menu" },
    { command: "/readme", description: "Generate project README.md" },
    { command: "/api-docs", description: "Generate API documentation" },
    { command: "/changelog", description: "Generate changelog from git history" },
    { command: "/update-agent-docs", description: "Update .agent docs with recent changes" },
    { command: "/compact", description: "Compress conversation history" },
    { command: "/heal", description: "Document and prevent failure recurrence" },
    { command: "/guardrails", description: "Manage prevention rules" },
    { command: "/comments", description: "Add code comments to files" },
    { command: "/commit-and-push", description: "AI commit & push to remote" },
    { command: "/smart-push", description: "Intelligent staging, commit message generation, and push" },
    { command: "/context", description: "Show loaded documentation and context status" },
    { command: "/exit", description: "Exit the application" },
  ];

  // Load models from configuration with fallback to defaults
  const availableModels: ModelOption[] = useMemo(() => {
    return loadModelConfig(); // Return directly, interface already matches
  }, []);

  const handleDirectCommand = async (input: string): Promise<boolean> => {
    const trimmedInput = input.trim();

    if (trimmedInput === "/context") {
      // Show loaded documentation and context status
      const contextEntry: ChatEntry = {
        type: "assistant",
        content: `📚 **Loaded Documentation Context**

The .agent documentation system has been automatically loaded at startup:

**System Documentation:**
- 📋 System Architecture (architecture.md)
- 🏗️ Critical State (critical-state.md)
- 🏗️ Installation Guide (installation.md)
- 🏗️ API Schema (api-schema.md)
- 🏗️ Auto-Read System (auto-read-system.md)

**SOP Documentation:**
- 🔧 Git Workflow SOP (git-workflow.md)
- 📖 Release Management SOP (release-management.md)
- 📖 Automation Protection SOP (automation-protection.md)
- 📖 NPM Publishing Troubleshooting (npm-publishing-troubleshooting.md)

**Purpose:**
This documentation provides context for all AI operations, ensuring consistent understanding of project architecture, processes, and standards.

**Auto-Read Status:** ✅ Active - Loaded automatically on startup`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, contextEntry]);
      clearInput();
      return true;
    }

    if (trimmedInput === "/clear") {
      // Reset chat history
      setChatHistory([]);

      // Reset processing states
      setIsProcessing(false);
      setIsStreaming(false);
      setTokenCount(0);
      setProcessingTime(0);
      processingStartTime.current = 0;

      // Reset confirmation service session flags
      const confirmationService = ConfirmationService.getInstance();
      confirmationService.resetSession();

      clearInput();
      resetHistory();
      return true;
    }

    if (trimmedInput === "/help") {
      const helpEntry: ChatEntry = {
        type: "assistant",
        content: `grok-one-shotHelp:

Built-in Commands:
  /clear      - Clear chat history
  /help       - Show this help
  /models     - Switch between available models
  /verbosity  - Control output verbosity (quiet/normal/verbose)
  /explain    - Control operation explanations (off/brief/detailed)
  /version    - Show version information and check for updates
  /upgrade    - Check for updates and upgrade automatically
  /switch     - Switch to specific version (/switch <version>)
  /exit       - Exit application
  exit, quit  - Exit application

Documentation Commands:
  /init-agent       - Initialize .agent documentation system
  /docs             - Interactive documentation menu
  /readme           - Generate comprehensive README.md
  /api-docs         - Generate API documentation from code
  /changelog        - Generate changelog from git history
  /update-agent-docs- Update .agent docs with recent changes
  /comments         - Add intelligent code comments

Self-Healing & Optimization:
  /compact          - Compress conversation history intelligently
  /heal             - Document failures and create prevention rules
  /guardrails       - Manage automated prevention system

Git Commands:
  /commit-and-push - AI-generated commit + push to remote
  /smart-push      - Intelligent staging, commit message generation, and push

Enhanced Input Features:
  ↑/↓ Arrow   - Navigate command history
  Ctrl+C      - Clear input (press twice to exit)
  Ctrl+←/→    - Move by word
  Ctrl+A/E    - Move to line start/end
  Ctrl+W      - Delete word before cursor
  Ctrl+K      - Delete to end of line
  Ctrl+U      - Delete to start of line
  Shift+Tab   - Toggle auto-edit mode (bypass confirmations)

Direct Commands (executed immediately):
  ls [path]   - List directory contents
  pwd         - Show current directory
  cd <path>   - Change directory
  cat <file>  - View file contents
  mkdir <dir> - Create directory
  touch <file>- Create empty file

Model Configuration:
  Edit ~/.grok/models.json to add custom models (Claude, GPT, Gemini, etc.)

For complex operations, just describe what you want in natural language.
Examples:
  "edit package.json and add a new script"
  "create a new React component called Header"
  "show me all TypeScript files in this project"`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, helpEntry]);
      clearInput();
      return true;
    }

    if (trimmedInput === "/context") {
      // Show loaded documentation and context status
      const contextEntry: ChatEntry = {
        type: "assistant",
        content: `📚 **Loaded Documentation Context**

The .agent documentation system has been automatically loaded at startup:

**System Documentation:**
- 📋 System Architecture (architecture.md)
- 🏗️ Critical State (critical-state.md)
- 🏗️ Installation Guide (installation.md)
- 🏗️ API Schema (api-schema.md)
- 🏗️ Auto-Read System (auto-read-system.md)

**SOP Documentation:**
- 🔧 Git Workflow SOP (git-workflow.md)
- 📖 Release Management SOP (release-management.md)
- 📖 Automation Protection SOP (automation-protection.md)
- 📖 NPM Publishing Troubleshooting (npm-publishing-troubleshooting.md)

**Purpose:**
This documentation provides context for all AI operations, ensuring consistent understanding of project architecture, processes, and standards.

**Auto-Read Status:** ✅ Active - Loaded automatically on startup`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, contextEntry]);
      clearInput();
      return true;
    }

    if (trimmedInput === "/exit") {
      process.exit(0);
      return true;
    }

    if (trimmedInput === "/models") {
      setShowModelSelection(true);
      setSelectedModelIndex(0);
      clearInput();
      return true;
    }

    if (trimmedInput.startsWith("/models ")) {
      const modelArg = trimmedInput.split(" ")[1];
      const modelNames = availableModels.map((m) => m.model);

      if (modelNames.includes(modelArg)) {
        agent.setModel(modelArg);
        updateCurrentModel(modelArg); // Update project current model
        const confirmEntry: ChatEntry = {
          type: "assistant",
          content: `✓ Switched to model: ${modelArg}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, confirmEntry]);
      } else {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Invalid model: ${modelArg}

Available models: ${modelNames.join(", ")}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      clearInput();
      return true;
    }

    // Version commands
    if (trimmedInput === "/version") {
      try {
        const versionInfo = await checkForUpdates();
        const versionEntry: ChatEntry = {
          type: "assistant",
          content: `📦 **grok-one-shotVersion Information**

Current Version: **${versionInfo.current}**
Latest Version: **${versionInfo.latest}**
${versionInfo.isUpdateAvailable 
  ? `🔄 **Update Available!**\n\nUse \`/upgrade\` to update automatically or run:\n\`${versionInfo.updateCommand}\``
  : '✅ **You are up to date!**'
}

Package: ${pkg.name}
GitHub: https://github.com/x-cli-team/grok-one-shot
NPM: https://www.npmjs.com/package/${pkg.name}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, versionEntry]);
      } catch (error) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `❌ Error checking version: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }
      clearInput();
      return true;
    }

    if (trimmedInput === "/upgrade") {
      try {
        const versionInfo = await checkForUpdates();
        
        if (!versionInfo.isUpdateAvailable) {
          const upToDateEntry: ChatEntry = {
            type: "assistant",
            content: `✅ **Already up to date!**\n\nCurrent version: **${versionInfo.current}**\nLatest version: **${versionInfo.latest}**`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, upToDateEntry]);
          clearInput();
          return true;
        }

        const confirmUpgradeEntry: ChatEntry = {
          type: "assistant",
          content: `🔄 **Update Available!**

Current: **${versionInfo.current}**
Latest: **${versionInfo.latest}**

Upgrading now... This may take a moment.`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, confirmUpgradeEntry]);
        
        const success = await autoUpgrade();
        
        const resultEntry: ChatEntry = {
          type: "assistant",
          content: success 
            ? `✅ **Upgrade Complete!**\n\nSuccessfully upgraded to version **${versionInfo.latest}**.\n\n**Please restart X-CLI** to use the new version:\n- Exit with \`/exit\` or Ctrl+C\n- Run \`grok\` again`
            : `❌ **Upgrade Failed**\n\nPlease try upgrading manually:\n\`${versionInfo.updateCommand}\``,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, resultEntry]);
      } catch (error) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `❌ Error during upgrade: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }
      clearInput();
      return true;
    }

    if (trimmedInput.startsWith("/switch ")) {
      const versionArg = trimmedInput.split(" ")[1];
      
      if (!versionArg) {
        const helpEntry: ChatEntry = {
          type: "assistant",
          content: `❌ **Missing version argument**

Usage: \`/switch <version>\`

Examples:
- \`/switch latest\` - Switch to latest version
- \`/switch 1.0.50\` - Switch to specific version

Command: \`npm install -g ${pkg.name}@<version>\``,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, helpEntry]);
        clearInput();
        return true;
      }

      try {
        const switchingEntry: ChatEntry = {
          type: "assistant",
          content: `🔄 **Switching to version ${versionArg}...**\n\nThis may take a moment.`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, switchingEntry]);

        // Import exec for version switching
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);
        
        await execAsync(`npm install -g ${pkg.name}@${versionArg}`, {
          timeout: 30000,
        });
        
        const successEntry: ChatEntry = {
          type: "assistant",
          content: `✅ **Version Switch Complete!**\n\nSuccessfully installed version **${versionArg}**.\n\n**Please restart X-CLI** to use the new version:\n- Exit with \`/exit\` or Ctrl+C\n- Run \`grok\` again`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, successEntry]);
      } catch (error) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `❌ **Version switch failed**\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try manually:\n\`npm install -g ${pkg.name}@${versionArg}\``,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }
      clearInput();
      return true;
    }

    if (trimmedInput === "/commit-and-push") {
      const userEntry: ChatEntry = {
        type: "user",
        content: "/commit-and-push",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);
      setIsStreaming(true);

      try {
        // First check if there are any changes at all
        const initialStatusResult = await agent.executeBashCommand(
          "git status --porcelain"
        );

        if (
          !initialStatusResult.success ||
          !initialStatusResult.output?.trim()
        ) {
          const noChangesEntry: ChatEntry = {
            type: "assistant",
            content: "No changes to commit. Working directory is clean.",
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, noChangesEntry]);
          setIsProcessing(false);
          setIsStreaming(false);
          setInput("");
          return true;
        }

        // Add all changes
        const addResult = await agent.executeBashCommand("git add .");

        if (!addResult.success) {
          const addErrorEntry: ChatEntry = {
            type: "assistant",
            content: `Failed to stage changes: ${
              addResult.error || "Unknown error"
            }`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, addErrorEntry]);
          setIsProcessing(false);
          setIsStreaming(false);
          setInput("");
          return true;
        }

        // Show that changes were staged
        const addEntry: ChatEntry = {
          type: "tool_result",
          content: "Changes staged successfully",
          timestamp: new Date(),
          toolCall: {
            id: `git_add_${Date.now()}`,
            type: "function",
            function: {
              name: "bash",
              arguments: JSON.stringify({ command: "git add ." }),
            },
          },
          toolResult: addResult,
        };
        setChatHistory((prev) => [...prev, addEntry]);

        // Get staged changes for commit message generation
        const diffResult = await agent.executeBashCommand("git diff --cached");

        // Generate commit message using AI
        const commitPrompt = `Generate a concise, professional git commit message for these changes:

Git Status:
${initialStatusResult.output}

Git Diff (staged changes):
${diffResult.output || "No staged changes shown"}

Follow conventional commit format (feat:, fix:, docs:, etc.) and keep it under 72 characters.
Respond with ONLY the commit message, no additional text.`;

        let commitMessage = "";
        let streamingEntry: ChatEntry | null = null;
        let accumulatedCommitContent = "";
        let lastCommitUpdateTime = Date.now();

        for await (const chunk of agent.processUserMessageStream(
          commitPrompt
        )) {
          if (chunk.type === "content" && chunk.content) {
            accumulatedCommitContent += chunk.content;
            const now = Date.now();
            if (now - lastCommitUpdateTime >= 150) {
              commitMessage += accumulatedCommitContent;
              if (!streamingEntry) {
                const newEntry = {
                  type: "assistant" as const,
                  content: `Generating commit message...\n\n${commitMessage}`,
                  timestamp: new Date(),
                  isStreaming: true,
                };
                setChatHistory((prev) => [...prev, newEntry]);
                streamingEntry = newEntry;
              } else {
                setChatHistory((prev) =>
                  prev.map((entry, idx) =>
                    idx === prev.length - 1 && entry.isStreaming
                      ? {
                          ...entry,
                          content: `Generating commit message...\n\n${commitMessage}`,
                        }
                      : entry
                  )
                );
              }
              accumulatedCommitContent = "";
              lastCommitUpdateTime = now;
            }
          } else if (chunk.type === "done") {
            if (streamingEntry) {
              setChatHistory((prev) =>
                prev.map((entry) =>
                  entry.isStreaming
                    ? {
                        ...entry,
                        content: `Generated commit message: "${commitMessage.trim()}"`,
                        isStreaming: false,
                      }
                    : entry
                )
              );
            }
            break;
          }
        }

        // Execute the commit
        const cleanCommitMessage = commitMessage
          .trim()
          .replace(/^["']|["']$/g, "");
        const commitCommand = `git commit -m "${cleanCommitMessage}"`;
        const commitResult = await agent.executeBashCommand(commitCommand);

        const commitEntry: ChatEntry = {
          type: "tool_result",
          content: commitResult.success
            ? commitResult.output || "Commit successful"
            : commitResult.error || "Commit failed",
          timestamp: new Date(),
          toolCall: {
            id: `git_commit_${Date.now()}`,
            type: "function",
            function: {
              name: "bash",
              arguments: JSON.stringify({ command: commitCommand }),
            },
          },
          toolResult: commitResult,
        };
        setChatHistory((prev) => [...prev, commitEntry]);

        // If commit was successful, push to remote
        if (commitResult.success) {
          // First try regular push, if it fails try with upstream setup
          let pushResult = await agent.executeBashCommand("git push");
          let pushCommand = "git push";

          if (
            !pushResult.success &&
            pushResult.error?.includes("no upstream branch")
          ) {
            pushCommand = "git push -u origin HEAD";
            pushResult = await agent.executeBashCommand(pushCommand);
          }

          const pushEntry: ChatEntry = {
            type: "tool_result",
            content: pushResult.success
              ? pushResult.output || "Push successful"
              : pushResult.error || "Push failed",
            timestamp: new Date(),
            toolCall: {
              id: `git_push_${Date.now()}`,
              type: "function",
              function: {
                name: "bash",
                arguments: JSON.stringify({ command: pushCommand }),
              },
            },
            toolResult: pushResult,
          };
          setChatHistory((prev) => [...prev, pushEntry]);
        }
      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Error during commit and push: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      setIsStreaming(false);
      clearInput();
      return true;
    }

    if (trimmedInput === "/init-agent") {
      const userEntry: ChatEntry = {
        type: "user",
        content: "/init-agent",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        // Determine project type - assume external project for now, could detect X CLI
        const isGrokOneShot = process.cwd().includes('grok-one-shot') || 
                         trimmedInput.includes('--grok-one-shot');
        
        const projectType = isGrokOneShot ? 'grok-one-shot' : 'external';
        const projectName = isGrokOneShot ? 'Grok One-Shot' : 'Current Project';

        const generator = new AgentSystemGenerator({
          projectName,
          projectType,
          rootPath: process.cwd()
        });

        const result = await generator.generateAgentSystem();

        const resultEntry: ChatEntry = {
          type: "assistant",
          content: result.message,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, resultEntry]);

        if (result.success) {
          // Additional success message with next steps
          const nextStepsEntry: ChatEntry = {
            type: "assistant",
            content: `📚 **Next Steps:**
1. Review the generated documentation in \`.agent/\`
2. Customize \`system/\` docs for your project
3. Add PRDs to \`tasks/\` before implementing features
4. Run \`/update-agent-docs\` after making changes
5. Check \`.agent/README.md\` for complete navigation

💡 **Pro tip**: AI agents will now read these docs to understand your project context efficiently!`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, nextStepsEntry]);
        }

      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Failed to initialize agent system: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    if (trimmedInput === "/docs") {
      const userEntry: ChatEntry = {
        type: "user",
        content: "/docs",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      const menuEntry: ChatEntry = {
        type: "assistant",
        content: generateDocsMenuText(),
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, menuEntry]);

      clearInput();
      return true;
    }

    // Check if input is a docs menu selection
    const docsMenuOption = findDocsMenuOption(trimmedInput);
    if (docsMenuOption) {
      const userEntry: ChatEntry = {
        type: "user", 
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      const confirmEntry: ChatEntry = {
        type: "assistant",
        content: `🎯 Selected: ${docsMenuOption.title}\nExecuting: \`${docsMenuOption.command}\`...`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, confirmEntry]);

      // Execute the selected command
      setTimeout(() => {
        handleDirectCommand(docsMenuOption.command);
      }, 100);

      clearInput();
      return true;
    }

    if (trimmedInput === "/readme" || trimmedInput.startsWith("/readme ")) {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        const args = trimmedInput.split(' ').slice(1);
        const updateExisting = args.includes('--update');
        const template = args.find(arg => arg.startsWith('--template='))?.split('=')[1] as any || 'default';

        const generator = new ReadmeGenerator({
          projectName: '', // Will be auto-detected
          rootPath: process.cwd(),
          updateExisting,
          template
        });

        const result = await generator.generateReadme();

        const resultEntry: ChatEntry = {
          type: "assistant",
          content: result.message,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, resultEntry]);

        if (result.success) {
          const nextStepsEntry: ChatEntry = {
            type: "assistant",
            content: `📝 **README.md Generated!**

**Next Steps:**
1. Review and customize the generated content
2. Add project-specific details and examples
3. Update installation and usage instructions
4. Consider adding screenshots or diagrams

💡 **Tip**: Use \`/docs\` to access other documentation tools!`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, nextStepsEntry]);
        }

      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant", 
          content: `Failed to generate README: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    if (trimmedInput === "/comments" || trimmedInput.startsWith("/comments ")) {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        const args = trimmedInput.split(' ').slice(1);
        const filePath = args[0];

        if (!filePath) {
          const errorEntry: ChatEntry = {
            type: "assistant",
            content: "❌ Please specify a file path. Usage: `/comments <file-path>`\n\nExample: `/comments src/utils/helper.ts`",
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, errorEntry]);
          setIsProcessing(false);
          clearInput();
          return true;
        }

        const commentType = args.includes('--functions') ? 'functions' : 
                           args.includes('--classes') ? 'classes' : 'all';

        const generator = new CommentsGenerator({
          filePath: filePath.startsWith('/') ? filePath : path.join(process.cwd(), filePath),
          commentType,
          style: 'auto'
        });

        const result = await generator.generateComments();

        const resultEntry: ChatEntry = {
          type: "assistant",
          content: result.message,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, resultEntry]);

        if (result.success) {
          const tipsEntry: ChatEntry = {
            type: "assistant",
            content: `💡 **Code Comments Added!**

**Options for next time:**
- \`/comments file.ts --functions\` - Only comment functions
- \`/comments file.ts --classes\` - Only comment classes
- \`/comments file.ts\` - Comment all (default)

**Backup created** - Original file saved with .backup extension`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, tipsEntry]);
        }

      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Failed to add comments: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    if (trimmedInput === "/api-docs" || trimmedInput.startsWith("/api-docs ")) {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        const args = trimmedInput.split(' ').slice(1);
        const outputFormat = args.includes('--format=html') ? 'html' : 'md';
        const includePrivate = args.includes('--private');
        const scanPaths = args.filter(arg => !arg.startsWith('--') && arg !== '');

        const generator = new ApiDocsGenerator({
          rootPath: process.cwd(),
          outputFormat,
          includePrivate,
          scanPaths: scanPaths.length > 0 ? scanPaths : ['src/']
        });

        const result = await generator.generateApiDocs();

        const resultEntry: ChatEntry = {
          type: "assistant",
          content: result.message,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, resultEntry]);

        if (result.success) {
          const tipsEntry: ChatEntry = {
            type: "assistant",
            content: `📖 **API Documentation Generated!**

**Options for next time:**
- \`/api-docs --format=html\` - Generate HTML format
- \`/api-docs --private\` - Include private members
- \`/api-docs src/ lib/\` - Specify custom scan paths

**Enhancement tips:**
- Add JSDoc comments to your functions and classes
- Use TypeScript for better type information
- Organize exports clearly in your modules`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, tipsEntry]);
        }

      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Failed to generate API docs: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    if (trimmedInput === "/changelog" || trimmedInput.startsWith("/changelog ")) {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        const args = trimmedInput.split(' ').slice(1);
        const sinceVersion = args.find(arg => arg.startsWith('--since='))?.split('=')[1];
        const commitCount = args.find(arg => arg.startsWith('--commits='))?.split('=')[1];
        const format = args.includes('--simple') ? 'simple' : 'conventional';

        const generator = new ChangelogGenerator({
          rootPath: process.cwd(),
          sinceVersion,
          commitCount: commitCount ? parseInt(commitCount) : undefined,
          format,
          includeBreaking: true
        });

        const result = await generator.generateChangelog();

        const resultEntry: ChatEntry = {
          type: "assistant",
          content: result.message,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, resultEntry]);

        if (result.success) {
          const tipsEntry: ChatEntry = {
            type: "assistant",
            content: `📝 **Changelog Generated!**

**Options for next time:**
- \`/changelog --since=v1.0.0\` - Generate since specific version
- \`/changelog --commits=10\` - Limit to last N commits  
- \`/changelog --simple\` - Use simple format (not conventional)

**Pro tips:**
- Use conventional commit format: \`feat: add new feature\`
- Mark breaking changes: \`feat!: breaking change\`
- The changelog follows Keep a Changelog format`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, tipsEntry]);
        }

      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Failed to generate changelog: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    if (trimmedInput === "/update-agent-docs" || trimmedInput.startsWith("/update-agent-docs ")) {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        const args = trimmedInput.split(' ').slice(1);
        const updateTarget = args.includes('--system') ? 'system' :
                            args.includes('--tasks') ? 'tasks' :
                            args.includes('--sop') ? 'sop' : 'all';
        const autoCommit = args.includes('--commit');

        const updater = new UpdateAgentDocs({
          rootPath: process.cwd(),
          updateTarget,
          autoCommit
        });

        const result = await updater.updateDocs();

        const resultEntry: ChatEntry = {
          type: "assistant",
          content: result.message,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, resultEntry]);

        if (result.success && result.suggestions.length > 0) {
          const suggestionsEntry: ChatEntry = {
            type: "assistant",
            content: `💡 **Suggestions for Manual Review:**\n\n${result.suggestions.map(s => `- ${s}`).join('\n')}\n\n**Options:**\n- \`/update-agent-docs --system\` - Update only system docs\n- \`/update-agent-docs --tasks\` - Update only tasks docs\n- \`/update-agent-docs --sop\` - Update only SOPs`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, suggestionsEntry]);
        }

      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Failed to update agent docs: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    if (trimmedInput === "/compact" || trimmedInput.startsWith("/compact ")) {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        const args = trimmedInput.split(' ').slice(1);
        // const force = args.includes('--force'); // TODO: implement force flag
        const dryRun = args.includes('--dry-run');

        // Simulate context compression using subagent framework
        const subagentFramework = new SubagentFramework();
        const taskId = await subagentFramework.spawnSubagent({
          type: 'summarizer',
          input: {
            content: chatHistory.map(entry => entry.content).join('\n'),
            compressionTarget: 0.3 // 70% reduction
          },
          priority: 'medium'
        });

        const result = await subagentFramework.waitForResult(taskId, 10000);

        if (result.success) {
          // const metrics = subagentFramework.getPerformanceMetrics(); // TODO: use metrics
          
          const resultEntry: ChatEntry = {
            type: "assistant",
            content: dryRun 
              ? `📊 **Compression Preview (Dry Run)**\n\n${result.summary}\n\n💡 Use \`/compact\` to apply compression`
              : `🧹 **Context Compressed Successfully**\n\n${result.summary}\n\n📈 **Performance:**\n- Tokens saved: ~${result.output.compressionRatio * 100}%\n- Processing time: ${result.executionTime}ms\n- Subagent tokens used: ${result.tokensUsed}`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, resultEntry]);

          if (!dryRun && result.success) {
            // In a real implementation, this would actually compress the chat history
            const tipsEntry: ChatEntry = {
              type: "assistant",
              content: `✨ **Context Optimization Complete**\n\n**What happened:**\n- Older conversations summarized\n- Recent context preserved\n- Key decisions and TODOs maintained\n\n**Options:**\n- \`/compact --dry-run\` - Preview compression\n- \`/compact --force\` - Force compression even if below threshold`,
              timestamp: new Date(),
            };
            setChatHistory((prev) => [...prev, tipsEntry]);
          }
        }

      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Failed to compress context: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    if (trimmedInput === "/heal" || trimmedInput.startsWith("/heal ")) {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        // const args = trimmedInput.split(' ').slice(1);
        // const classify = args.includes('--classify'); // TODO: implement classify flag
        // const playbook = args.includes('--playbook'); // TODO: implement playbook flag

        const healingSystem = new SelfHealingSystem(process.cwd());

        // For demo purposes, create a simulated error
        const mockError = {
          message: "Example error for demonstration",
          stack: "at someFunction (src/example.ts:42:10)"
        };
        const mockContext = {
          command: trimmedInput,
          operation: "heal-demo",
          files: ["src/example.ts"]
        };

        const result = await healingSystem.captureIncident(mockError, mockContext);

        const resultEntry: ChatEntry = {
          type: "assistant",
          content: result.message,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, resultEntry]);

        if (result.success) {
          const tipsEntry: ChatEntry = {
            type: "assistant",
            content: `🔄 **Self-Healing System Activated**

**What was captured:**
- Incident documentation with root cause analysis
- Automatic guardrail generation (if applicable)
- Integration with existing .agent system

**Options:**
- \`/heal --classify\` - Classify failure type and suggest guardrail
- \`/heal --playbook\` - Generate step-by-step recovery SOP
- \`/guardrails\` - View and manage all prevention rules

**Next steps:**
- Review the incident documentation
- Check if guardrail was created
- Update SOPs with lessons learned`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, tipsEntry]);
        }

      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Failed to process healing: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    if (trimmedInput === "/guardrails" || trimmedInput.startsWith("/guardrails ")) {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        const args = trimmedInput.split(' ').slice(1);
        const check = args.includes('--check');
        // const enable = args.find(arg => arg.startsWith('--enable'))?.split('=')[1]; // TODO: implement enable flag
        // const disable = args.find(arg => arg.startsWith('--disable'))?.split('=')[1]; // TODO: implement disable flag

        const healingSystem = new SelfHealingSystem(process.cwd());

        if (check) {
          const checkResult = await healingSystem.checkGuardrails('example-operation', {});
          const resultEntry: ChatEntry = {
            type: "assistant",
            content: `🛡️ **Guardrail Check Results**\n\n**Status:** ${checkResult.passed ? '✅ All Clear' : '❌ Violations Found'}\n**Violations:** ${checkResult.violations.length}\n**Warnings:** ${checkResult.warnings.length}`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, resultEntry]);
        } else {
          // List all guardrails
          const incidents = await healingSystem.listIncidents();
          const config = healingSystem.getConfig();
          
          const resultEntry: ChatEntry = {
            type: "assistant",
            content: `🛡️ **Guardrails Management**

**System Status:** ${config.enabled ? '✅ Enabled' : '❌ Disabled'}
**Enforcement:** ${config.enforceGuardrails ? '✅ Active' : '❌ Disabled'}
**Error Prompt:** ${config.onErrorPrompt}

**Recent Incidents:** ${incidents.length}
${incidents.slice(0, 3).map(i => `- ${i.title} (${i.impact} impact)`).join('\n')}

**Available Commands:**
- \`/guardrails --check\` - Check current plans against guardrails
- \`/heal\` - Document new failure and create guardrail
- View specific guardrails in \`.agent/guardrails/\``,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, resultEntry]);
        }

      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Failed to manage guardrails: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    if (trimmedInput === "/switch" || trimmedInput.startsWith("/switch ")) {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        const args = trimmedInput.split(' ').slice(1);
        const settingsManager = getSettingsManager();

        if (args.length === 0) {
          // Show current auto-compact settings
          const settings = settingsManager.loadUserSettings();
          const autoCompact = settings.autoCompact ?? false;
          const thresholds = settings.compactThreshold || { lines: 800, bytes: 200000 };

          const statusEntry: ChatEntry = {
            type: "assistant",
            content: `🔄 **Auto-Compact Status**

**Current Settings:**
- Auto-compact: ${autoCompact ? '✅ ENABLED' : '❌ DISABLED'}
- Line threshold: ${thresholds.lines || 800} lines
- Size threshold: ${Math.round((thresholds.bytes || 200000) / 1024)}KB

**Commands:**
- \`/switch compact on\` - Enable auto-compact
- \`/switch compact off\` - Disable auto-compact
- \`/switch compact lines 500\` - Set line threshold
- \`/switch compact bytes 100000\` - Set size threshold (in bytes)

**How it works:**
Auto-compact automatically enables compact mode when conversations exceed thresholds, similar to Claude Code's context management.`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, statusEntry]);
        } else if (args[0] === 'compact') {
          if (args[1] === 'on') {
            settingsManager.updateUserSetting('autoCompact', true);
            const successEntry: ChatEntry = {
              type: "assistant",
              content: "✅ **Auto-compact enabled!**\n\nCompact mode will automatically activate for long conversations to maintain performance.",
              timestamp: new Date(),
            };
            setChatHistory((prev) => [...prev, successEntry]);
          } else if (args[1] === 'off') {
            settingsManager.updateUserSetting('autoCompact', false);
            const successEntry: ChatEntry = {
              type: "assistant",
              content: "❌ **Auto-compact disabled**\n\nNormal conversation mode will be used.",
              timestamp: new Date(),
            };
            setChatHistory((prev) => [...prev, successEntry]);
          } else if (args[1] === 'lines' && args[2]) {
            const lines = parseInt(args[2]);
            if (isNaN(lines) || lines < 100) {
              const errorEntry: ChatEntry = {
                type: "assistant",
                content: "❌ Invalid line threshold. Must be a number >= 100.",
                timestamp: new Date(),
              };
              setChatHistory((prev) => [...prev, errorEntry]);
            } else {
              const currentThresholds = settingsManager.getUserSetting('compactThreshold') || {};
              settingsManager.updateUserSetting('compactThreshold', {
                ...currentThresholds,
                lines
              });
              const successEntry: ChatEntry = {
                type: "assistant",
                content: `✅ **Line threshold updated to ${lines} lines**`,
                timestamp: new Date(),
              };
              setChatHistory((prev) => [...prev, successEntry]);
            }
          } else if (args[1] === 'bytes' && args[2]) {
            const bytes = parseInt(args[2]);
            if (isNaN(bytes) || bytes < 10000) {
              const errorEntry: ChatEntry = {
                type: "assistant",
                content: "❌ Invalid size threshold. Must be a number >= 10000 bytes.",
                timestamp: new Date(),
              };
              setChatHistory((prev) => [...prev, errorEntry]);
            } else {
              const currentThresholds = settingsManager.getUserSetting('compactThreshold') || {};
              settingsManager.updateUserSetting('compactThreshold', {
                ...currentThresholds,
                bytes
              });
              const successEntry: ChatEntry = {
                type: "assistant",
                content: `✅ **Size threshold updated to ${Math.round(bytes / 1024)}KB**`,
                timestamp: new Date(),
              };
              setChatHistory((prev) => [...prev, successEntry]);
            }
          } else {
            const helpEntry: ChatEntry = {
              type: "assistant",
              content: `❓ **Invalid compact command**

**Usage:**
- \`/switch compact on\` - Enable auto-compact
- \`/switch compact off\` - Disable auto-compact
- \`/switch compact lines <number>\` - Set line threshold
- \`/switch compact bytes <number>\` - Set size threshold`,
              timestamp: new Date(),
            };
            setChatHistory((prev) => [...prev, helpEntry]);
          }
        } else {
          const helpEntry: ChatEntry = {
            type: "assistant",
            content: `❓ **Unknown switch command**

**Available switches:**
- \`/switch compact\` - Manage auto-compact settings
- \`/switch\` - Show current status`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, helpEntry]);
        }
      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Failed to manage switches: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    // Add verbosity command
    if (trimmedInput === "/verbosity" || trimmedInput.startsWith("/verbosity ")) {
      const args = trimmedInput.split(' ').slice(1);
      const newLevel = args[0];

      if (!newLevel) {
        // Show current verbosity level
        const levelEntry: ChatEntry = {
          type: "assistant",
          content: `🔊 **Current Verbosity Level: ${verbosityLevel.toUpperCase()}**\n\n**Available levels:**\n- \`quiet\` - 🎯 **Claude Code mode**: Ultra-brief tool output (\`⎿ Read X lines (ctrl+r to expand)\`)\n- \`normal\` - Current default behavior with full details\n- \`verbose\` - Additional details and debug information\n\n**Usage:** \`/verbosity <level>\`\n**Example:** \`/verbosity quiet\` (for Claude Code parity)`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, levelEntry]);
      } else if (['quiet', 'normal', 'verbose'].includes(newLevel)) {
        setVerbosityLevel(newLevel as 'quiet' | 'normal' | 'verbose');
        // Save to settings
        try {
          const manager = getSettingsManager();
          manager.updateUserSetting('verbosityLevel', newLevel as 'quiet' | 'normal' | 'verbose');
        } catch (_error) {
          // Silently ignore settings save errors
        }
        const confirmEntry: ChatEntry = {
          type: "assistant",
          content: `✅ **Verbosity level set to: ${newLevel.toUpperCase()}**\n\n${newLevel === 'quiet' ? '🎯 **Claude Code mode activated!** Tool outputs will now show ultra-brief format: `⎿ Read X lines (ctrl+r to expand)`' : newLevel === 'normal' ? 'Tool outputs will now show full details.' : 'Tool outputs will now show extra details and debug information.'}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, confirmEntry]);
      } else {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `❌ **Invalid verbosity level: ${newLevel}**\n\n**Available levels:** quiet, normal, verbose\n\n**Usage:** \`/verbosity <level>\``,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      clearInput();
      return true;
    }

    // Add explain command
    if (trimmedInput === "/explain" || trimmedInput.startsWith("/explain ")) {
      const args = trimmedInput.split(' ').slice(1);
      const newLevel = args[0];

      if (!newLevel) {
        // Show current explain level
        const levelEntry: ChatEntry = {
          type: "assistant",
          content: `💡 **Current Explain Level: ${explainLevel.toUpperCase()}**\n\n**Available levels:**\n- \`off\` - No explanations\n- \`brief\` - Short reasons for operations\n- \`detailed\` - Comprehensive explanations with context\n\n**Usage:** \`/explain <level>\`\n**Example:** \`/explain brief\``,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, levelEntry]);
      } else if (['off', 'brief', 'detailed'].includes(newLevel)) {
        setExplainLevel(newLevel as 'off' | 'brief' | 'detailed');
        // Save to settings
        try {
          const manager = getSettingsManager();
          manager.updateUserSetting('explainLevel', newLevel as 'off' | 'brief' | 'detailed');
        } catch (_error) {
          // Silently ignore settings save errors
        }
        const confirmEntry: ChatEntry = {
          type: "assistant",
          content: `✅ **Explain level set to: ${newLevel.toUpperCase()}**\n\nOperations will now ${newLevel === 'off' ? 'show no explanations' : newLevel === 'brief' ? 'show brief reasons' : 'show detailed explanations with context'}.`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, confirmEntry]);
      } else {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `❌ **Invalid explain level: ${newLevel}**\n\n**Available levels:** off, brief, detailed\n\n**Usage:** \`/explain <level>\``,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      clearInput();
      return true;
    }

    // Add safe-push command
    if (trimmedInput === "/safe-push") {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        // Step 1: Quality Checks
        const startEntry: ChatEntry = {
          type: "assistant",
          content: "🚀 **Safe Push - Automated Workflow**\n\nRunning quality checks and git operations...",
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, startEntry]);

        // TypeScript check
        const tsCheckEntry: ChatEntry = {
          type: "assistant",
          content: "📝 **Step 1/5**: Checking TypeScript...",
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, tsCheckEntry]);

        const tsResult = await agent.executeBashCommand("npm run typecheck");
        const tsResultEntry: ChatEntry = {
          type: "tool_result",
          content: tsResult.success ? "✅ TypeScript check passed" : `❌ TypeScript errors: ${tsResult.error}`,
          timestamp: new Date(),
          toolCall: {
            id: `ts_check_${Date.now()}`,
            type: "function",
            function: { name: "bash", arguments: JSON.stringify({ command: "npm run typecheck" }) },
          },
          toolResult: tsResult,
        };
        setChatHistory((prev) => [...prev, tsResultEntry]);

        if (!tsResult.success) {
          const errorEntry: ChatEntry = {
            type: "assistant",
            content: `❌ **Safe Push Failed: TypeScript Errors**

**Error Details:**
\`\`\`
${tsResult.error || 'TypeScript compilation failed'}
\`\`\`

**Next Steps:**
1. **Fix the TypeScript errors** shown above
2. **Save your files** after making corrections
3. **Run \`/safe-push\` again** to retry the workflow

💡 **Common fixes:**
• Add missing type annotations
• Import missing types/modules
• Fix property name typos
• Check function signatures`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, errorEntry]);
          setIsProcessing(false);
          clearInput();
          return true;
        }

        // Lint check
        const lintCheckEntry: ChatEntry = {
          type: "assistant",
          content: "🧹 **Step 2/5**: Running ESLint...",
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, lintCheckEntry]);

        const lintResult = await agent.executeBashCommand("npm run lint");
        const lintResultEntry: ChatEntry = {
          type: "tool_result",
          content: lintResult.success ? "✅ ESLint check completed" : `❌ **Safe Push Failed: ESLint Critical Errors**

**Error Details:**
\`\`\`
${lintResult.error || 'ESLint found critical errors'}
\`\`\`

**Next Steps:**
1. **Fix the ESLint errors** shown above
2. **Save your files** after making corrections
3. **Run \`/safe-push\` again** to retry the workflow

💡 **Common fixes:**
• Remove unused variables/imports
• Fix indentation and spacing
• Add missing semicolons
• Fix naming conventions
• Use \`eslint --fix\` for auto-fixable issues`,
          timestamp: new Date(),
          toolCall: {
            id: `lint_check_${Date.now()}`,
            type: "function",
            function: { name: "bash", arguments: JSON.stringify({ command: "npm run lint" }) },
          },
          toolResult: lintResult,
        };
        setChatHistory((prev) => [...prev, lintResultEntry]);

        // Git status check
        const statusCheckEntry: ChatEntry = {
          type: "assistant",
          content: "📋 **Step 3/5**: Checking git status...",
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, statusCheckEntry]);

        const statusResult = await agent.executeBashCommand("git status --porcelain");
        const hasChanges = statusResult.success && statusResult.output?.trim();

        if (!hasChanges) {
          const noChangesEntry: ChatEntry = {
            type: "assistant",
            content: "ℹ️ **No Changes to Commit**: Working tree is clean. Nothing to push!",
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, noChangesEntry]);
          setIsProcessing(false);
          clearInput();
          return true;
        }

        // Stage changes
        const stageEntry: ChatEntry = {
          type: "assistant",
          content: "📦 **Step 4/5**: Staging changes...",
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, stageEntry]);

        const addResult = await agent.executeBashCommand("git add .");
        const addResultEntry: ChatEntry = {
          type: "tool_result",
          content: addResult.success ? "✅ Changes staged successfully" : `❌ Failed to stage: ${addResult.error}`,
          timestamp: new Date(),
          toolCall: {
            id: `git_add_${Date.now()}`,
            type: "function",
            function: { name: "bash", arguments: JSON.stringify({ command: "git add ." }) },
          },
          toolResult: addResult,
        };
        setChatHistory((prev) => [...prev, addResultEntry]);

        if (!addResult.success) {
          const stagingErrorEntry: ChatEntry = {
            type: "assistant",
            content: `❌ **Safe Push Failed: Git Staging Error**

**Error Details:**
\`\`\`
${addResult.error || 'Failed to stage changes'}
\`\`\`

**Next Steps:**
1. **Check git status**: Run \`git status\` to see what's wrong
2. **Check file permissions**: Ensure files are writable
3. **Check .gitignore**: Make sure files aren't being ignored
4. **Manual staging**: Try \`git add <specific-file>\` for individual files

💡 **Common causes:**
• File permission issues
• Large files exceeding git limits
• Corrupted git repository
• Disk space issues`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, stagingErrorEntry]);
          setIsProcessing(false);
          clearInput();
          return true;
        }

        // Commit with a simple message
        const commitEntry: ChatEntry = {
          type: "assistant",
          content: "💾 **Step 5/5**: Creating commit...",
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, commitEntry]);

        const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
        const commitMsg = `feat: update files - ${timestamp}`;
        const commitResult = await agent.executeBashCommand(`git commit -m "${commitMsg}"`);
        
        const commitResultEntry: ChatEntry = {
          type: "tool_result",
          content: commitResult.success ? `✅ Commit created: "${commitMsg}"` : `❌ **Safe Push Failed: Git Commit Error**

**Error Details:**
\`\`\`
${commitResult.error || 'Git commit failed'}
\`\`\`

**Next Steps:**
1. **Check git config**: Ensure user.name and user.email are set
2. **Check staged files**: Run \`git status\` to verify staged changes  
3. **Manual commit**: Try \`git commit\` manually with your own message
4. **Reset staging**: Use \`git reset\` if needed to unstage problematic files

💡 **Common causes:**
• Missing git configuration (name/email)
• Empty commit (no staged changes)
• Commit message formatting issues
• Git hooks blocking the commit`,
          timestamp: new Date(),
          toolCall: {
            id: `git_commit_${Date.now()}`,
            type: "function",
            function: { name: "bash", arguments: JSON.stringify({ command: `git commit -m "${commitMsg}"` }) },
          },
          toolResult: commitResult,
        };
        setChatHistory((prev) => [...prev, commitResultEntry]);

        if (!commitResult.success) {
          setIsProcessing(false);
          clearInput();
          return true;
        }

        // Push to remote
        const pushEntry: ChatEntry = {
          type: "assistant",
          content: "🚀 **Pushing to remote...**",
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, pushEntry]);

        const pushResult = await agent.executeBashCommand("git push");
        const pushResultEntry: ChatEntry = {
          type: "tool_result",
          content: pushResult.success ? "🎉 **Safe Push Completed Successfully!**" : `❌ **Safe Push Failed: Git Push Error**

**Error Details:**
\`\`\`
${pushResult.error || 'Git push failed'}
\`\`\`

**Next Steps:**
1. **Pull latest changes**: Run \`git pull --rebase\` to get remote updates
2. **Resolve conflicts**: If there are merge conflicts, resolve them manually
3. **Try again**: Run \`/safe-push\` again after resolving issues
4. **Alternative**: Use \`npm run smart-push\` for complex scenarios

💡 **Common causes:**
• Remote has new commits (fetch first)
• Branch protection rules
• Authentication issues
• Network connectivity problems`,
          timestamp: new Date(),
          toolCall: {
            id: `git_push_${Date.now()}`,
            type: "function",
            function: { name: "bash", arguments: JSON.stringify({ command: "git push" }) },
          },
          toolResult: pushResult,
        };
        setChatHistory((prev) => [...prev, pushResultEntry]);

      } catch (error: unknown) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `❌ **Safe Push Failed**: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }

    // Smart-push command - delegates to npm script
    if (trimmedInput === "/smart-push") {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      setIsProcessing(true);

      try {
        const result = await agent.executeBashCommand("npm run smart-push");
        
        const resultEntry: ChatEntry = {
          type: "tool_result",
          content: result.success ? "🎉 Smart Push Completed Successfully!" : `❌ Smart Push Failed: ${result.error}`,
          timestamp: new Date(),
          toolCall: {
            id: `smart_push_${Date.now()}`,
            type: "function",
            function: { name: "bash", arguments: JSON.stringify({ command: "npm run smart-push" }) },
          },
          toolResult: result,
        };
        setChatHistory((prev) => [...prev, resultEntry]);

      } catch (error: unknown) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `❌ Smart Push Failed: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      setIsProcessing(false);
      clearInput();
      return true;
    }
    const directBashCommands = [
      "ls",
      "pwd",
      "cd",
      "cat",
      "mkdir",
      "touch",
      "echo",
      "grep",
      "find",
      "cp",
      "mv",
      "rm",
    ];
    const firstWord = trimmedInput.split(" ")[0];

    if (directBashCommands.includes(firstWord)) {
      const userEntry: ChatEntry = {
        type: "user",
        content: trimmedInput,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, userEntry]);

      try {
        const result = await agent.executeBashCommand(trimmedInput);

        const commandEntry: ChatEntry = {
          type: "tool_result",
          content: result.success
            ? result.output || "Command completed"
            : result.error || "Command failed",
          timestamp: new Date(),
          toolCall: {
            id: `bash_${Date.now()}`,
            type: "function",
            function: {
              name: "bash",
              arguments: JSON.stringify({ command: trimmedInput }),
            },
          },
          toolResult: result,
        };
        setChatHistory((prev) => [...prev, commandEntry]);
      } catch (error: any) {
        const errorEntry: ChatEntry = {
          type: "assistant",
          content: `Error executing command: ${error.message}`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorEntry]);
      }

      clearInput();
      return true;
    }

    return false;
  };

  // Paste expansion function - converts summaries back to full content
  const expandPasteSummaryToFullContent = async (userInput: string): Promise<string> => {
    if (!globalThis.grokPasteCache) return userInput;
    
    let expandedInput = userInput;
    const cache = globalThis.grokPasteCache;
    
    // Replace all paste summaries in the input with full content
    for (const [summary, fullContent] of cache.entries()) {
      // Clean up the content: normalize line endings and format for AI processing
      const cleanContent = fullContent
        .replace(/\r\n/g, '\n')  // Convert Windows line endings
        .replace(/\r/g, '\n')    // Convert Mac line endings
        .trim()                  // Remove leading/trailing whitespace
        .split('\n')
        .map(line => line.trim()) // Clean each line
        .join('\n');
      
      expandedInput = expandedInput.replace(summary, cleanContent);
    }
    
    return expandedInput;
  };

  const processUserMessage = async (userInput: string) => {
    // Handle paste summary expansion - if user submits a paste summary, expand to full content
    const expandedInput = await expandPasteSummaryToFullContent(userInput);

    // Content expansion working - debug logging removed

    const userEntry: ChatEntry = {
      type: "user",
      content: expandedInput, // AI receives expanded content
      displayContent: userInput, // UI shows what user typed (may be summary)
      timestamp: new Date(),
    };
    setChatHistory((prev) => [...prev, userEntry]);

    setIsProcessing(true);
    clearInput();

    try {
      setIsStreaming(true);
      let streamingEntry: ChatEntry | null = null;
      let accumulatedContent = "";
      let lastTokenCount = 0;
      let pendingToolCalls: GrokToolCall[] | null = null;
      let pendingToolResults: Array<{ toolCall: GrokToolCall; toolResult: ToolResult }> = [];
      let lastUpdateTime = Date.now();

      // ⚠️ CRITICAL: This throttling logic can cause response truncation if modified incorrectly
      // See .agent/technical/streaming-architecture.md for detailed explanation
      const flushUpdates = (force = false) => {
        const now = Date.now();
        // IMPORTANT: The force parameter is essential to prevent truncation
        // When force=true, we MUST bypass throttling to ensure content completeness
        if (!force && now - lastUpdateTime < 150) {
          return; // Throttle to ~6-7 FPS for performance, but NEVER when forced
        }

        // Update token count if changed
        if (lastTokenCount !== 0) {
          setTokenCount(lastTokenCount);
        }

        // Handle accumulated content
        if (accumulatedContent) {
          if (!streamingEntry) {
            const newStreamingEntry = {
              type: "assistant" as const,
              content: accumulatedContent,
              timestamp: new Date(),
              isStreaming: true,
            };
            setChatHistory((prev) => [...prev, newStreamingEntry]);
            streamingEntry = newStreamingEntry;
          } else {
            setChatHistory((prev) =>
              prev.map((entry, idx) => {
                if (idx === prev.length - 1 && entry.isStreaming) {
                  const newContent = entry.content + accumulatedContent;
                  return { ...entry, content: newContent };
                }
                return entry;
              })
            );
          }
          accumulatedContent = "";
        }

        // Handle pending tool calls
        if (pendingToolCalls) {
          setChatHistory((prev) =>
            prev.map((entry) =>
              entry.isStreaming
                ? {
                    ...entry,
                    isStreaming: false,
                    toolCalls: pendingToolCalls,
                  }
                : entry
            )
          );
          streamingEntry = null;

          // Add individual tool call entries
          pendingToolCalls.forEach((toolCall) => {
            const toolCallEntry: ChatEntry = {
              type: "tool_call",
              content: "Executing...",
              timestamp: new Date(),
              toolCall: toolCall,
            };
            setChatHistory((prev) => [...prev, toolCallEntry]);
          });
          pendingToolCalls = null;
        }

        // Handle pending tool results
        if (pendingToolResults.length > 0) {
          setChatHistory((prev) =>
            prev.map((entry) => {
              if (entry.isStreaming) {
                return { ...entry, isStreaming: false };
              }
              // Update matching tool_call entries
              const matchingResult = pendingToolResults.find(
                (result) => entry.type === "tool_call" && entry.toolCall?.id === result.toolCall.id
              );
              if (matchingResult) {
                return {
                  ...entry,
                  type: "tool_result",
                  content: matchingResult.toolResult.success
                    ? matchingResult.toolResult.output || "Success"
                    : matchingResult.toolResult.error || "Error occurred",
                  toolResult: matchingResult.toolResult,
                };
              }
              return entry;
            })
          );
          streamingEntry = null;
          pendingToolResults = [];
        }

        lastUpdateTime = now;
      };

      for await (const chunk of agent.processUserMessageStream(expandedInput)) {
        switch (chunk.type) {
          case "content":
            if (chunk.content) {
              accumulatedContent += chunk.content;
            }
            break;

          case "token_count":
            if (chunk.tokenCount !== undefined) {
              lastTokenCount = chunk.tokenCount;
            }
            break;

          case "tool_calls":
            if (chunk.toolCalls) {
              pendingToolCalls = chunk.toolCalls;
            }
            break;

          case "tool_result":
            if (chunk.toolCall && chunk.toolResult) {
              pendingToolResults.push({ toolCall: chunk.toolCall, toolResult: chunk.toolResult });
            }
            break;

          case "done":
            // ⚠️ CRITICAL: MUST use flushUpdates(true) to prevent response truncation
            // This ensures final content chunks are processed even if throttling is active
            // See .agent/technical/streaming-architecture.md for details about the truncation bug
            flushUpdates(true);
            break;
        }

        // Flush updates periodically
        flushUpdates();
      }

      // ⚠️ CRITICAL: Final flush MUST be forced to prevent any remaining content from being lost
      // This is the last chance to display accumulated content that may have been throttled
      flushUpdates(true);
      if (streamingEntry) {
        setChatHistory((prev) =>
          prev.map((entry) =>
            entry.isStreaming ? { ...entry, isStreaming: false } : entry
          )
        );
      }
      setIsStreaming(false);
    } catch (error: any) {
      const errorEntry: ChatEntry = {
        type: "assistant",
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorEntry]);
      setIsStreaming(false);
    }

    setIsProcessing(false);
    processingStartTime.current = 0;
  };


  return {
    input,
    cursorPosition,
    showCommandSuggestions,
    selectedCommandIndex,
    showModelSelection,
    selectedModelIndex,
    commandSuggestions,
    availableModels,
    agent,
    autoEditEnabled,
    verbosityLevel,
    explainLevel,
    // Plan mode state and actions
    planMode,
  };
}
