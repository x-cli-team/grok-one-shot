import { GrokClient, GrokMessage, GrokToolCall } from "../grok/client.js";
import fs from "fs";
import path from "path";
import {
  getAllGrokTools,
  getMCPManager,
  initializeMCPServers,
} from "../grok/tools.js";
import { loadMCPConfig } from "../mcp/config.js";
import {
  TextEditorTool,
  SmartEditTool,
  MorphEditorTool,
  BashTool,
  TodoTool,
  ConfirmationTool,
  SearchTool,
  MultiFileEditorTool,
  AdvancedSearchTool,
  FileTreeOperationsTool,
  CodeAwareEditorTool,
  OperationHistoryTool,
  ASTParserTool,
  SymbolSearchTool,
  DependencyAnalyzerTool,
  CodeContextTool,
  RefactoringAssistantTool,
  VectorSearchTool,
  AutonomousTaskTool,
} from "../tools/index.js";
import { ToolResult } from "../lib/types/index.js";
import { EventEmitter } from "events";
import { createTokenCounter, TokenCounter } from "../lib/utils/token-counter.js";
import { loadCustomInstructions } from "../lib/utils/custom-instructions.js";
import { getSettingsManager } from "../lib/utils/settings-manager.js";
import { ContextPack } from "../lib/utils/context-loader.js";
import { ResearchRecommendService } from "../services/research-recommend.js";
import { SubagentFramework } from "../subagents/subagent-framework.js";
import { ExecutionOrchestrator } from "../services/execution-orchestrator.js";
import { PlanModeState } from "../lib/types/plan-mode.js";
import { ReadOnlyFilesystemOverlay } from "../services/readonly-filesystem-overlay.js";
import { RegexHelper } from "../lib/utils/regex-helper.js";

export interface ChatEntry {
  type: "user" | "assistant" | "tool_result" | "tool_call";
  content: string;
  timestamp: Date;
  toolCalls?: GrokToolCall[] | null;
  toolCall?: GrokToolCall;
  toolResult?: { success: boolean; output?: string; error?: string };
  isStreaming?: boolean;
  // Paste summary support
  originalContent?: string; // Store full content when summarized
  displayContent?: string;  // What to show in UI (summary or full content)
  isPasteSummary?: boolean; // Flag for styling
  pasteMetadata?: {
    pasteNumber: number;
    lineCount: number;
    charCount: number;
  };
}

export interface StreamingChunk {
  type: "content" | "tool_calls" | "tool_result" | "done" | "token_count";
  content?: string;
  toolCalls?: GrokToolCall[];
  toolCall?: GrokToolCall;
  toolResult?: ToolResult;
  tokenCount?: number;
}

export class GrokAgent extends EventEmitter {
  private grokClient: GrokClient;
  private _textEditor?: TextEditorTool;
  private _morphEditor?: MorphEditorTool | null;
  private _bash?: BashTool;
  private _todoTool?: TodoTool;
  private _confirmationTool?: ConfirmationTool;
  private _search?: SearchTool;
  // Advanced tools
  private _multiFileEditor?: MultiFileEditorTool;
  private _advancedSearch?: AdvancedSearchTool;
  private _fileTreeOps?: FileTreeOperationsTool;
  private _codeAwareEditor?: CodeAwareEditorTool;
  private _operationHistory?: OperationHistoryTool;
  // Intelligence tools
  private _astParser?: ASTParserTool;
  private _symbolSearch?: SymbolSearchTool;
  private _dependencyAnalyzer?: DependencyAnalyzerTool;
  private _codeContext?: CodeContextTool;
  private _refactoringAssistant?: RefactoringAssistantTool;
  private _vectorSearch?: VectorSearchTool;
  private _autonomousTask?: AutonomousTaskTool;
  private chatHistory: ChatEntry[] = [];
  private messages: GrokMessage[] = [];
  private tokenCounter: TokenCounter;
  private totalTokensUsed: number = 0;
  private abortController: AbortController | null = null;
  private mcpInitialized: boolean = false;
  private maxToolRounds: number;
  private contextPack?: ContextPack;
  private lastToolExecutionTime: number = 0;
  private activeToolCalls: number = 0;
  private readonly maxConcurrentToolCalls: number = 2;
  private readonly minRequestInterval: number = 500; // ms
  private lastRequestTime: number = 0;
  private sessionLogPath: string;
  private recentToolCalls: Map<string, number> = new Map(); // Track recent tool calls to prevent duplicates
  private readonly duplicateWindowMs: number = 2000; // 2 second window for duplicate detection
  
  // Plan Mode integration
  private planModeState: PlanModeState | null = null;
  private readonlyOverlay: ReadOnlyFilesystemOverlay | null = null;

  constructor(
    apiKey: string,
    baseURL?: string,
    model?: string,
    maxToolRounds?: number,
    contextPack?: ContextPack,
    verbosityLevel?: 'quiet' | 'normal' | 'verbose',
    explainLevel?: 'off' | 'brief' | 'detailed'
  ) {
    super();
    const manager = getSettingsManager();
    const savedModel = manager.getCurrentModel();
    const modelToUse = model || savedModel || "grok-code-fast-1";
    this.maxToolRounds = maxToolRounds || 400;
    this.contextPack = contextPack;
    this.sessionLogPath = process.env.GROK_SESSION_LOG || `${process.env.HOME}/.grok/session.log`;
    this.grokClient = new GrokClient(apiKey, modelToUse, baseURL);
    this.tokenCounter = createTokenCounter(modelToUse);

    // Initialize MCP servers if configured
    this.initializeMCP();

    // Load custom instructions
    const customInstructions = loadCustomInstructions();
    const customInstructionsSection = customInstructions
      ? `\n\nCUSTOM INSTRUCTIONS:\n${customInstructions}\n\nThe above custom instructions should be followed alongside the standard instructions below.`
      : "";

    // Load .agent context if provided
    const contextSection = this.contextPack ? `\n\nPROJECT CONTEXT:\n${this.contextPack.system}\n\nSOP:\n${this.contextPack.sop}\n\nTASKS:\n${this.contextPack.tasks.map((t: { filename: string; content: string }) => `- ${t.filename}: ${t.content}`).join('\n')}\n\nThe above project context should inform your responses and decision making.` : "";

    // Build verbosity instructions based on user settings
    const verbosityInstructions = this.buildVerbosityInstructions(verbosityLevel || 'quiet', explainLevel || 'brief');

    // Initialize with system message
    this.messages.push({
      role: "system",
      content: `You are Grok One-Shot, an AI-powered CLI assistant that helps with file editing, coding tasks, and system operations.${customInstructionsSection}${contextSection}${verbosityInstructions}

🚨 CRITICAL TOOL CALLING RULES:
- NEVER use multiple tool calls in a single response
- NEVER concatenate tool calls like "view_fileview_file" or "str_replace_editorstr_replace_editor"
- ALWAYS use ONE tool call per message with proper XML structure
- WAIT for tool results before making additional tool calls
- Each tool call must have valid JSON arguments only

You have access to these tools:

CORE TOOLS:
- view_file: View file contents or directory listings
- create_file: Create new files with content (ONLY use this for files that don't exist yet)
- str_replace_editor: Replace text in existing files (ALWAYS use this to edit or update existing files)${
        this.morphEditor
          ? "\n- edit_file: High-speed file editing with Morph Fast Apply (4,500+ tokens/sec with 98% accuracy)"
          : ""
      }
- bash: Execute bash commands (use for searching, file discovery, navigation, and system operations)
- search: Unified search tool for finding text content or files (similar to Cursor's search functionality)
- create_todo_list: Create a visual todo list for planning and tracking tasks
- update_todo_list: Update existing todos in your todo list

ADVANCED TOOLS:
- multi_file_edit: Perform atomic operations across multiple files with transaction support
- advanced_search: Enhanced search with regex patterns, context, and bulk replace capabilities
- file_tree_ops: Generate directory trees, bulk operations, and file organization
- code_analysis: Analyze code structure, perform refactoring, and smart code operations
- operation_history: Track, undo, and redo operations with comprehensive history management

REAL-TIME INFORMATION:
You have access to real-time web search and X (Twitter) data. When users ask for current information, latest news, or recent events, you automatically have access to up-to-date information from the web and social media.

IMPORTANT TOOL USAGE RULES:
- NEVER use create_file on files that already exist - this will overwrite them completely
- ALWAYS use str_replace_editor to modify existing files, even for small changes
- Before editing a file, use view_file to see its current contents
- Use create_file ONLY when creating entirely new files that don't exist

SEARCHING AND EXPLORATION:
- Use search for fast, powerful text search across files or finding files by name (unified search tool)
- Examples: search for text content like "import.*react", search for files like "component.tsx"
- Use bash with commands like 'find', 'grep', 'rg', 'ls' for complex file operations and navigation
- view_file is best for reading specific files you already know exist

When a user asks you to edit, update, modify, or change an existing file:
1. First use view_file to see the current contents
2. Then use str_replace_editor to make the specific changes
3. Never use create_file for existing files

When a user asks you to create a new file that doesn't exist:
1. Use create_file with the full content

TASK PLANNING WITH TODO LISTS:
- For complex requests with multiple steps, ALWAYS create a todo list first to plan your approach
- Use create_todo_list to break down tasks into manageable items with priorities
- Mark tasks as 'in_progress' when you start working on them (only one at a time)
- Mark tasks as 'completed' immediately when finished
- Use update_todo_list to track your progress throughout the task
- Todo lists provide visual feedback with colors: ✅ Green (completed), 🔄 Cyan (in progress), ⏳ Yellow (pending)
- Always create todos with priorities: 'high' (🔴), 'medium' (🟡), 'low' (🟢)

USER CONFIRMATION SYSTEM:
File operations (create_file, str_replace_editor) and bash commands will automatically request user confirmation before execution. The confirmation system will show users the actual content or command before they decide. Users can choose to approve individual operations or approve all operations of that type for the session.

If a user rejects an operation, the tool will return an error and you should not proceed with that specific operation.

Be helpful, direct, and efficient. Always explain what you're doing and show the results.

IMPORTANT RESPONSE GUIDELINES:
- After using tools, do NOT respond with pleasantries like "Thanks for..." or "Great!"
- Only provide necessary explanations or next steps if relevant to the task
- Keep responses concise and focused on the actual work being done
- If a tool execution completes the user's request, you can remain silent or give a brief confirmation

🎨 COLORED DIFF OUTPUT RULES:
- When str_replace_editor returns colored diff output with ANSI escape codes, ALWAYS show the full tool output directly
- NEVER summarize or paraphrase tool results that contain colored diffs - show the complete output
- If the tool output contains ANSI color codes (\\x1b[), display it exactly as returned by the tool
- Show the full colored diff with line numbers, not just a summary like "✅ Changed X to Y"

Current working directory: ${process.cwd()}`,
    });
  }

  // Lazy-loaded tool getters
  private get textEditor(): TextEditorTool {
    if (!this._textEditor) {
      this._textEditor = new TextEditorTool();
    }
    return this._textEditor;
  }

  private get morphEditor(): MorphEditorTool | null {
    if (this._morphEditor === undefined) {
      this._morphEditor = process.env.MORPH_API_KEY ? new MorphEditorTool() : null;
    }
    return this._morphEditor;
  }

  private get bash(): BashTool {
    if (!this._bash) {
      this._bash = new BashTool();
    }
    return this._bash;
  }

  private get todoTool(): TodoTool {
    if (!this._todoTool) {
      this._todoTool = new TodoTool();
    }
    return this._todoTool;
  }

  private get confirmationTool(): ConfirmationTool {
    if (!this._confirmationTool) {
      this._confirmationTool = new ConfirmationTool();
    }
    return this._confirmationTool;
  }

  private get search(): SearchTool {
    if (!this._search) {
      this._search = new SearchTool();
    }
    return this._search;
  }

  private get multiFileEditor(): MultiFileEditorTool {
    if (!this._multiFileEditor) {
      this._multiFileEditor = new MultiFileEditorTool();
    }
    return this._multiFileEditor;
  }

  private get advancedSearch(): AdvancedSearchTool {
    if (!this._advancedSearch) {
      this._advancedSearch = new AdvancedSearchTool();
    }
    return this._advancedSearch;
  }

  private get fileTreeOps(): FileTreeOperationsTool {
    if (!this._fileTreeOps) {
      this._fileTreeOps = new FileTreeOperationsTool();
    }
    return this._fileTreeOps;
  }

  private get codeAwareEditor(): CodeAwareEditorTool {
    if (!this._codeAwareEditor) {
      this._codeAwareEditor = new CodeAwareEditorTool();
    }
    return this._codeAwareEditor;
  }

  private get operationHistory(): OperationHistoryTool {
    if (!this._operationHistory) {
      this._operationHistory = new OperationHistoryTool();
    }
    return this._operationHistory;
  }

  private get astParser(): ASTParserTool {
    if (!this._astParser) {
      this._astParser = new ASTParserTool();
    }
    return this._astParser;
  }

  private get symbolSearch(): SymbolSearchTool {
    if (!this._symbolSearch) {
      this._symbolSearch = new SymbolSearchTool();
    }
    return this._symbolSearch;
  }

  private get dependencyAnalyzer(): DependencyAnalyzerTool {
    if (!this._dependencyAnalyzer) {
      this._dependencyAnalyzer = new DependencyAnalyzerTool();
    }
    return this._dependencyAnalyzer;
  }

  private get codeContext(): CodeContextTool {
    if (!this._codeContext) {
      this._codeContext = new CodeContextTool();
    }
    return this._codeContext;
  }

  private get refactoringAssistant(): RefactoringAssistantTool {
    if (!this._refactoringAssistant) {
      this._refactoringAssistant = new RefactoringAssistantTool();
    }
    return this._refactoringAssistant;
  }

  private get vectorSearch(): VectorSearchTool {
    if (!this._vectorSearch) {
      this._vectorSearch = new VectorSearchTool();
    }
    return this._vectorSearch;
  }

  private get autonomousTask(): AutonomousTaskTool {
    if (!this._autonomousTask) {
      this._autonomousTask = new AutonomousTaskTool();
    }
    return this._autonomousTask;
  }

  private async initializeMCP(): Promise<void> {
    // Initialize MCP in the background without blocking
    Promise.resolve().then(async () => {
      try {
        const config = loadMCPConfig();
        if (config.servers.length > 0) {
          await initializeMCPServers();
        }
      } catch (error) {
        console.warn("MCP initialization failed:", error);
      } finally {
        this.mcpInitialized = true;
      }
    });
  }

  private isGrokModel(): boolean {
    const currentModel = this.grokClient.getCurrentModel();
    return currentModel.toLowerCase().includes("grok");
  }

  // Heuristic: enable web search only when likely needed
  private shouldUseSearchFor(message: string): boolean {
    const q = message.toLowerCase();
    const keywords = [
      "today",
      "latest",
      "news",
      "trending",
      "breaking",
      "current",
      "now",
      "recent",
      "x.com",
      "twitter",
      "tweet",
      "what happened",
      "as of",
      "update on",
      "release notes",
      "changelog",
      "price",
    ];
    if (keywords.some((k) => q.includes(k))) return true;
    // crude date pattern (e.g., 2024/2025) may imply recency
    if (/(20\d{2})/.test(q)) return true;
    return false;
  }

  // Detect if message should use the Research → Recommend → Execute workflow
  private shouldUseWorkflow(message: string): boolean {
    const q = message.toLowerCase();

    // Complexity indicators that suggest workflow usage
    const complexityIndicators = [
      // Action verbs indicating multi-step tasks
      /\b(implement|build|create|refactor|optimize|add|update|modify|develop|design)\b/.test(q),
      /\b(system|feature|component|module|service|api|database)\b/.test(q),

      // Multi-step indicators
      /\b(and|then|after|finally|also|additionally)\b/.test(q),
      /\b(step|phase|stage|part|component)\b/.test(q),

      // Size/complexity indicators
      q.length > 150, // Long requests
      (q.match(/\b(and|or|but|however|therefore|consequently)\b/g) || []).length >= 2, // Complex logic

      // Technical complexity
      /\b(authentication|authorization|security|validation|testing|deployment|ci.cd|docker|kubernetes)\b/.test(q),
      /\b(multiple|several|various|different|complex|advanced)\b/.test(q),
    ];

    // Use workflow if 2+ complexity indicators are present
    const indicatorCount = complexityIndicators.filter(Boolean).length;
    return indicatorCount >= 2;
  }

  async processUserMessage(message: string): Promise<ChatEntry[]> {
    // Check if this should use the Research → Recommend → Execute workflow
    if (this.shouldUseWorkflow(message)) {
      return this.processWithWorkflow(message);
    }

    // Fall back to standard processing for simple queries
    return this.processStandard(message);
  }

  /**
   * Process complex tasks using the Research → Recommend → Execute workflow
   */
  private async processWithWorkflow(message: string): Promise<ChatEntry[]> {
    const userEntry: ChatEntry = {
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    this.chatHistory.push(userEntry);
    this.logEntry(userEntry);
    this.messages.push({ role: "user", content: message });

    try {
      // Initialize workflow services
      const workflowService = new ResearchRecommendService(this);

      const request = {
        userTask: message
      };

      console.log('🔍 Researching and analyzing...');

      // Phase 1: Research and get approval
      const { output, approval, revisions } = await workflowService.researchAndGetApproval(request, this.contextPack);

      if (!approval.approved) {
        // User rejected the plan
        const rejectionEntry: ChatEntry = {
          type: "assistant",
          content: approval.revised
            ? `Plan revised ${revisions} time(s) but ultimately rejected by user.`
            : "Plan rejected by user.",
          timestamp: new Date(),
        };
        this.chatHistory.push(rejectionEntry);
        return [userEntry, rejectionEntry];
      }

      console.log('✅ Plan approved. Executing...');

      // Phase 2: Execute the approved plan
      const orchestrator = new ExecutionOrchestrator(this);
      const executionResult = await orchestrator.executeWithRecovery(output.plan, workflowService, request);

      // Convert execution results to chat entries
      return this.workflowResultToChatEntries(userEntry, output, approval, executionResult);

    } catch (error: any) {
      console.error('[Workflow] Failed:', error);
      const errorEntry: ChatEntry = {
        type: "assistant",
        content: `Workflow failed: ${error.message}`,
        timestamp: new Date(),
      };
      this.chatHistory.push(errorEntry);
      return [userEntry, errorEntry];
    }
  }

  /**
   * Standard processing for simple queries
   */
  private async processStandard(message: string): Promise<ChatEntry[]> {
    // Add user message to conversation
    const userEntry: ChatEntry = {
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    this.chatHistory.push(userEntry);
    this.logEntry(userEntry);
    this.messages.push({ role: "user", content: message });

    const newEntries: ChatEntry[] = [userEntry];
    const maxToolRounds = this.maxToolRounds; // Prevent infinite loops
    let toolRounds = 0;

    try {
      // Token monitoring for automatic compaction
      const threshold = getSettingsManager().getUserSetting('tokenThreshold') || 0.9;
      const currentTokens = this.tokenCounter.countMessageTokens(this.messages);
      const maxTokens = this.tokenCounter.getMaxTokens();

      this.totalTokensUsed = Math.max(this.totalTokensUsed, currentTokens);

      if (currentTokens > threshold * maxTokens) {
        await this.performAutomaticCompaction();
      }

      const tools = await getAllGrokTools();
      let currentResponse = await this.grokClient.chat(
        this.messages,
        tools,
        undefined,
        this.isGrokModel() && this.shouldUseSearchFor(message)
          ? { search_parameters: { mode: "auto" } }
          : { search_parameters: { mode: "off" } }
      );

      // Agent loop - continue until no more tool calls or max rounds reached
      while (toolRounds < maxToolRounds) {
        const assistantMessage = currentResponse.choices[0]?.message;

        if (!assistantMessage) {
          throw new Error("No response from Grok");
        }

        // Handle tool calls
        if (
          assistantMessage.tool_calls &&
          assistantMessage.tool_calls.length > 0
        ) {
          toolRounds++;

          // Add assistant message with tool calls
          const assistantEntry: ChatEntry = {
            type: "assistant",
            content: assistantMessage.content || "Using tools to help you...",
            timestamp: new Date(),
            toolCalls: assistantMessage.tool_calls,
          };
          this.chatHistory.push(assistantEntry);
          this.logEntry(assistantEntry);
          newEntries.push(assistantEntry);

          // Add assistant message to conversation
          this.messages.push({
            role: "assistant",
            content: assistantMessage.content || "",
            tool_calls: assistantMessage.tool_calls,
          } as any);

          // Create initial tool call entries to show tools are being executed
          assistantMessage.tool_calls.forEach((toolCall) => {
            const toolCallEntry: ChatEntry = {
              type: "tool_call",
              content: "Executing...",
              timestamp: new Date(),
              toolCall: toolCall,
            };
            this.chatHistory.push(toolCallEntry);
            newEntries.push(toolCallEntry);
          });

          // Execute tool calls and update the entries
          for (const toolCall of assistantMessage.tool_calls) {
            const result = await this.executeTool(toolCall);

            // Update the existing tool_call entry with the result
            const entryIndex = this.chatHistory.findIndex(
              (entry) =>
                entry.type === "tool_call" && entry.toolCall?.id === toolCall.id
            );

            if (entryIndex !== -1) {
              const updatedEntry: ChatEntry = {
                ...this.chatHistory[entryIndex],
                type: "tool_result",
                content: result.success
                  ? result.output || "Success"
                  : result.error || "Error occurred",
                toolResult: result,
              };
              this.chatHistory[entryIndex] = updatedEntry;

              // Also update in newEntries for return value
              const newEntryIndex = newEntries.findIndex(
                (entry) =>
                  entry.type === "tool_call" &&
                  entry.toolCall?.id === toolCall.id
              );
              if (newEntryIndex !== -1) {
                newEntries[newEntryIndex] = updatedEntry;
              }
            }

            // Add tool result to messages with proper format (needed for AI context)
            this.messages.push({
              role: "tool",
              content: result.success
                ? result.output || "Success"
                : result.error || "Error",
              tool_call_id: toolCall.id,
            });
          }

          // Get next response - this might contain more tool calls
          currentResponse = await this.grokClient.chat(
            this.messages,
            tools,
            undefined,
            this.isGrokModel() && this.shouldUseSearchFor(message)
              ? { search_parameters: { mode: "auto" } }
              : { search_parameters: { mode: "off" } }
          );
        } else {
          // No more tool calls, add final response
          const finalEntry: ChatEntry = {
            type: "assistant",
            content:
              assistantMessage.content ||
              "I understand, but I don't have a specific response.",
            timestamp: new Date(),
          };
          this.chatHistory.push(finalEntry);
          this.messages.push({
            role: "assistant",
            content: assistantMessage.content || "",
          });
          newEntries.push(finalEntry);
          break; // Exit the loop
        }
      }

      if (toolRounds >= maxToolRounds) {
        const warningEntry: ChatEntry = {
          type: "assistant",
          content:
            "Maximum tool execution rounds reached. Stopping to prevent infinite loops.",
          timestamp: new Date(),
        };
        this.chatHistory.push(warningEntry);
        newEntries.push(warningEntry);
      }

      return newEntries;
    } catch (error: any) {
      const errorEntry: ChatEntry = {
        type: "assistant",
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
      };
      this.chatHistory.push(errorEntry);
      return [userEntry, errorEntry];
    }
  }

  /**
   * Perform automatic context compaction when token threshold is exceeded
   */
  private async performAutomaticCompaction(): Promise<void> {
    try {
      // Start UI feedback
      const { uiState } = await import('../services/ui-state.js');
      const currentTokens = this.tokenCounter.countMessageTokens(this.messages);
      uiState.showTokenCompaction(currentTokens, this.tokenCounter.getMaxTokens());

      // Preserve system messages and recent messages (last 5)
      const systemMessages = this.messages.filter(m => m.role === 'system') as any[];
      const recentMessages = this.messages.slice(-5);
      const messagesToCompress = this.messages.filter((_, i) =>
        !systemMessages.includes(this.messages[i]) &&
        !recentMessages.includes(this.messages[i])
      );

      if (messagesToCompress.length === 0) {
        // Nothing to compress
        uiState.completeTokenCompaction();
        return;
      }

      // Create content to compress
      const contentToCompress = messagesToCompress.map(m => `${m.role}: ${m.content}`).join('\n');

      // Use subagent for summarization
      const subagentFramework = new SubagentFramework();
      const taskId = await subagentFramework.spawnSubagent({
        type: 'summarizer',
        input: {
          content: contentToCompress,
          compressionTarget: 0.3 // 70% reduction
        },
        priority: 'high'
      });

      const result = await subagentFramework.waitForResult(taskId, 30000); // 30s timeout

      if (result.success && result.summary) {
        // Create compacted chat history
        const compactedChatHistory: ChatEntry[] = [];
        const compactedMessages: GrokMessage[] = [];

        // Add system messages
        systemMessages.forEach(msg => {
          compactedMessages.push(msg);
          // Find corresponding chat entry if exists
          const entry = this.chatHistory.find(e => e.content === msg.content && e.type === 'user');
          if (entry) compactedChatHistory.push(entry);
        });

        // Add summary entry
        const summaryEntry: ChatEntry = {
          type: 'assistant',
          content: `🧹 **Context Compacted Automatically**\n\n${result.summary}\n\n*Older conversation history has been summarized to prevent token limit issues.*`,
          timestamp: new Date(),
        };
        compactedChatHistory.push(summaryEntry);
        compactedMessages.push({ role: 'assistant', content: summaryEntry.content });

        // Add recent messages
        recentMessages.forEach(msg => {
          compactedMessages.push(msg);
          const entry = this.chatHistory.find(e =>
            e.content === msg.content &&
            ((e.type === 'user' && msg.role === 'user') || (e.type === 'assistant' && msg.role === 'assistant'))
          );
          if (entry) compactedChatHistory.push(entry);
        });

        // Update the conversation
        this.chatHistory = compactedChatHistory;
        this.messages = compactedMessages;

        // Update total tokens
        this.totalTokensUsed = this.tokenCounter.countMessageTokens(this.messages);

        // Notify listeners of compaction
        this.emit('compaction', compactedChatHistory);

        // Complete UI feedback
        uiState.updateTokenCompaction(this.totalTokensUsed);
        uiState.completeTokenCompaction();

        console.log(`Context compacted: ${messagesToCompress.length} messages -> ${compactedMessages.length} messages`);
      } else {
        // Failed, just complete without compaction
        uiState.completeTokenCompaction();
        console.warn('Automatic compaction failed');
      }
    } catch (error) {
      console.error('Error during automatic compaction:', error);
      // Try to complete UI feedback
      try {
        const { uiState } = await import('../services/ui-state.js');
        uiState.completeTokenCompaction();
      } catch (error) {
        // Ignore UI feedback errors
        console.warn('Failed to complete compaction UI feedback:', error);
      }
    }
  }

  private messageReducer(previous: any, item: any): any {
    const reduce = (acc: any, delta: any) => {
      acc = { ...acc };
      for (const [key, value] of Object.entries(delta)) {
        if (acc[key] === undefined || acc[key] === null) {
          acc[key] = value;
          // Clean up index properties from tool calls
          if (Array.isArray(acc[key])) {
            for (const arr of acc[key]) {
              delete arr.index;
            }
          }
        } else if (typeof acc[key] === "string" && typeof value === "string") {
          (acc[key] as string) += value;
        } else if (Array.isArray(acc[key]) && Array.isArray(value)) {
          const accArray = acc[key] as any[];
          for (let i = 0; i < value.length; i++) {
            if (!accArray[i]) accArray[i] = {};
            accArray[i] = reduce(accArray[i], value[i]);
          }
        } else if (typeof acc[key] === "object" && typeof value === "object") {
          acc[key] = reduce(acc[key], value);
        }
      }
      return acc;
    };

    return reduce(previous, item.choices[0]?.delta || {});
  }

  async *processUserMessageStream(
    message: string
  ): AsyncGenerator<StreamingChunk, void, unknown> {
    // Create new abort controller for this request
    this.abortController = new AbortController();

    // Add user message to conversation
    const userEntry: ChatEntry = {
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    this.chatHistory.push(userEntry);
    this.messages.push({ role: "user", content: message });

    // Calculate input tokens
    let inputTokens = this.tokenCounter.countMessageTokens(
      this.messages as any
    );
    yield {
      type: "token_count",
      tokenCount: inputTokens,
    };

    const maxToolRounds = this.maxToolRounds; // Prevent infinite loops
    let toolRounds = 0;
    let totalOutputTokens = 0;
    let lastTokenUpdate = 0;

    try {
      // Token monitoring for automatic compaction
      const threshold = getSettingsManager().getUserSetting('tokenThreshold') || 0.9;
      const currentTokens = this.tokenCounter.countMessageTokens(this.messages as any);
      const maxTokens = this.tokenCounter.getMaxTokens();

      this.totalTokensUsed = Math.max(this.totalTokensUsed, currentTokens);

      if (currentTokens > threshold * maxTokens) {
        await this.performAutomaticCompaction();
      }

      // Agent loop - continue until no more tool calls or max rounds reached
      while (toolRounds < maxToolRounds) {
        // Check if operation was cancelled
        if (this.abortController?.signal.aborted) {
          yield {
            type: "content",
            content: "\n\n[Operation cancelled by user]",
          };
          yield { type: "done" };
          return;
        }

        // Enforce global rate limit
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          const delay = this.minRequestInterval - timeSinceLastRequest;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        this.lastRequestTime = Date.now();

        // Stream response and accumulate
        const tools = await getAllGrokTools();
        const stream = this.grokClient.chatStream(
          this.messages,
          tools,
          undefined,
          this.isGrokModel() && this.shouldUseSearchFor(message)
            ? { search_parameters: { mode: "auto" } }
            : { search_parameters: { mode: "off" } },
          this.abortController?.signal
        );
        let accumulatedMessage: any = {};
        let accumulatedContent = "";
        let toolCallsYielded = false;

        for await (const chunk of stream) {
          // Check for cancellation in the streaming loop
          if (this.abortController?.signal.aborted) {
            yield {
              type: "content",
              content: "\n\n[Operation cancelled by user]",
            };
            yield { type: "done" };
            return;
          }

          if (!chunk.choices?.[0]) continue;

          // Accumulate the message using reducer
          accumulatedMessage = this.messageReducer(accumulatedMessage, chunk);

          // Check for tool calls - yield when we have complete tool calls with function names
          if (!toolCallsYielded && accumulatedMessage.tool_calls?.length > 0) {
            // Check if we have at least one complete tool call with a function name
            const hasCompleteTool = accumulatedMessage.tool_calls.some(
              (tc: any) => tc.function?.name
            );
            if (hasCompleteTool) {
              yield {
                type: "tool_calls",
                toolCalls: accumulatedMessage.tool_calls,
              };
              toolCallsYielded = true;
            }
          }

          // Stream content as it comes
          if (chunk.choices[0].delta?.content) {
            accumulatedContent += chunk.choices[0].delta.content;
            

            // Update token count in real-time including accumulated content and any tool calls
            const currentOutputTokens =
              this.tokenCounter.estimateStreamingTokens(accumulatedContent) +
              (accumulatedMessage.tool_calls
                ? this.tokenCounter.countTokens(
                    JSON.stringify(accumulatedMessage.tool_calls)
                  )
                : 0);
            totalOutputTokens = currentOutputTokens;

            yield {
              type: "content",
              content: chunk.choices[0].delta.content,
            };

            // Emit token count update
            const now = Date.now();
            if (now - lastTokenUpdate > 250) {
              lastTokenUpdate = now;
              yield {
                type: "token_count",
                tokenCount: inputTokens + totalOutputTokens,
              };
            }
          }

          // Check for stream completion
          if (chunk.choices[0].finish_reason) {
            break;
          }
        }

        // Add assistant entry to history
        const assistantEntry: ChatEntry = {
          type: "assistant",
          content: accumulatedMessage.content || "Using tools to help you...",
          timestamp: new Date(),
          toolCalls: accumulatedMessage.tool_calls || undefined,
        };
        this.chatHistory.push(assistantEntry);

        // Add accumulated message to conversation
        this.messages.push({
          role: "assistant",
          content: accumulatedMessage.content || "",
          tool_calls: accumulatedMessage.tool_calls,
        } as any);

        // Handle tool calls if present
        if (accumulatedMessage.tool_calls?.length > 0) {
          toolRounds++;

          // Only yield tool_calls if we haven't already yielded them during streaming
          if (!toolCallsYielded) {
            yield {
              type: "tool_calls",
              toolCalls: accumulatedMessage.tool_calls,
            };
          }

          // Execute tools with concurrency limit
          const toolCalls = accumulatedMessage.tool_calls;
          for (let i = 0; i < toolCalls.length; i += this.maxConcurrentToolCalls) {
            // Enforce minimum request interval between tool batches
            const now = Date.now();
            const timeSinceLastExecution = now - this.lastToolExecutionTime;
            if (timeSinceLastExecution < this.minRequestInterval) {
              const delay = this.minRequestInterval - timeSinceLastExecution;
              await new Promise(resolve => setTimeout(resolve, delay));
            }

            const batch = toolCalls.slice(i, i + this.maxConcurrentToolCalls);
            const batchPromises = batch.map(async (toolCall: GrokToolCall) => {
              // Check for cancellation before executing each tool
              if (this.abortController?.signal.aborted) {
                return null;
              }

              const result = await this.executeTool(toolCall);

              const toolResultEntry: ChatEntry = {
                type: "tool_result",
                content: result.success
                  ? result.output || "Success"
                  : result.error || "Error occurred",
                timestamp: new Date(),
                toolCall: toolCall,
                toolResult: result,
              };
              this.chatHistory.push(toolResultEntry);

              // Add tool result with proper format (needed for AI context)
              this.messages.push({
                role: "tool",
                content: result.success
                  ? result.output || "Success"
                  : result.error || "Error",
                tool_call_id: toolCall.id,
              });

              return { toolCall, result, entry: toolResultEntry };
            });

            const batchResults = await Promise.all(batchPromises);
            this.lastToolExecutionTime = Date.now();
            if (batchResults.includes(null)) {
              // Cancelled
              yield {
                type: "content",
                content: "\n\n[Operation cancelled by user]",
              };
              yield { type: "done" };
              return;
            }

            // Yield results after batch completes
            for (const { toolCall, result } of batchResults) {
              yield {
                type: "tool_result",
                toolCall,
                toolResult: result,
              };
            }
          }

          // Update token count after processing all tool calls to include tool results
          inputTokens = this.tokenCounter.countMessageTokens(
            this.messages as any
          );
          // Final token update after tools processed
          yield {
            type: "token_count",
            tokenCount: inputTokens + totalOutputTokens,
          };

          // Continue the loop to get the next response (which might have more tool calls)
        } else {
          // No tool calls, we're done
          break;
        }
      }

      if (toolRounds >= maxToolRounds) {
        yield {
          type: "content",
          content:
            "\n\nMaximum tool execution rounds reached. Stopping to prevent infinite loops.",
        };
      }

      yield { type: "done" };
    } catch (error: any) {
      // Check if this was a cancellation
      if (this.abortController?.signal.aborted) {
        yield {
          type: "content",
          content: "\n\n[Operation cancelled by user]",
        };
        yield { type: "done" };
        return;
      }

      const errorEntry: ChatEntry = {
        type: "assistant",
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
      };
      this.chatHistory.push(errorEntry);
      yield {
        type: "content",
        content: errorEntry.content,
      };
      yield { type: "done" };
    } finally {
      // Clean up abort controller
      this.abortController = null;
    }
  }

  private truncateToolOutput(result: ToolResult): ToolResult {
    const MAX_OUTPUT_LENGTH = 5 * 1024 * 1024; // 5MB limit for tool outputs
    if (result.output && result.output.length > MAX_OUTPUT_LENGTH) {
      console.warn(`⚠️ Tool output exceeded ${MAX_OUTPUT_LENGTH / 1024 / 1024}MB limit, truncating`);
      result.output = result.output.substring(0, MAX_OUTPUT_LENGTH - 1000) +
        '\n\n[Output truncated due to length limit]';
    }
    return result;
  }

  private async executeTool(toolCall: GrokToolCall): Promise<ToolResult> {
    try {
      const toolName = toolCall.function?.name;
      const now = Date.now();

      // Check for duplicate tool calls within the window
      const callSignature = `${toolName}:${toolCall.function?.arguments || ''}`;
      const lastCallTime = this.recentToolCalls.get(callSignature);
      
      if (lastCallTime && (now - lastCallTime) < this.duplicateWindowMs) {
        console.log(`[GrokAgent] Skipping duplicate tool call: ${toolName}`);
        return {
          success: true,
          output: "Skipped duplicate tool call",
          details: `This tool call was already executed ${Math.round((now - lastCallTime) / 1000)}s ago`
        };
      }

      // Record this tool call
      this.recentToolCalls.set(callSignature, now);
      
      // Clean up old entries to prevent memory bloat
      for (const [key, time] of this.recentToolCalls.entries()) {
        if (now - time > this.duplicateWindowMs) {
          this.recentToolCalls.delete(key);
        }
      }

      // Check for Plan Mode and intercept destructive operations
      const planModeState = this.getPlanModeState();
      if (planModeState?.active) {
        const readonlyOverlay = this.getReadonlyOverlay();
        if (readonlyOverlay && this.isDestructiveOperation(toolCall.function.name)) {
          return await readonlyOverlay.interceptToolCall(toolCall);
        }
      }

      // Validate tool call structure before JSON parsing
      if (!toolCall.function?.arguments) {
        console.error(`[GrokAgent] Tool call missing function arguments:`, toolCall);
        return {
          success: false,
          error: `Tool call ${toolCall.function?.name || 'unknown'} missing required arguments`,
          details: `This appears to be a malformed tool call. The AI model may have generated invalid XML or concatenated multiple tool calls.`
        };
      }

      // Check for common XML malformation patterns that cause tool call failures
      if (typeof toolCall.function.arguments === 'string' && 
          (toolCall.function.arguments.includes('str_replace_editorstr_replace_editor') ||
           toolCall.function.arguments.includes('view_fileview_file') ||
           toolCall.function.arguments.includes('create_filecreate_file') ||
           toolCall.function.arguments.includes('}{') ||
           toolCall.function.name?.includes('view_file') && toolCall.function.name !== 'view_file')) {
        console.error(`[GrokAgent] Detected malformed XML in tool call - appears to be concatenated:`, {
          toolName: toolCall.function.name,
          arguments: toolCall.function.arguments
        });
        return {
          success: false,
          error: `Malformed tool call detected - appears to be concatenated XML without proper structure`,
          details: `The AI model generated invalid XML by concatenating multiple tool calls. This is a model generation issue that requires single, properly formatted tool calls.`
        };
      }

      // Robust JSON parsing with detailed error handling
      let args: any;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (jsonError) {
        const parseError = jsonError as Error;
        console.error(`[GrokAgent] JSON Parse Error for tool ${toolCall.function.name}:`, {
          error: parseError.message,
          arguments: toolCall.function.arguments,
          toolCall: toolCall
        });
        
        // Attempt to fix common JSON issues
        try {
          // Remove trailing commas and fix common formatting issues
          const cleanedArgs = toolCall.function.arguments
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/^\s*{?\s*/, '{')  // Ensure starts with {
            .replace(/\s*}?\s*$/, '}')  // Ensure ends with }
            .trim();
          args = JSON.parse(cleanedArgs);
          console.log(`[GrokAgent] JSON parsing recovered after cleanup`);
        } catch (retryError) {
          return {
            success: false,
            error: `Invalid JSON arguments for ${toolCall.function.name}: ${parseError.message}. Arguments: ${toolCall.function.arguments}`,
            details: `Tool call failed due to malformed JSON. This is likely a model generation issue. Try using single tool calls with proper XML structure.`
          };
        }
      }

      // Check if confirmation is required for file operations and bash commands
      const settingsManager = getSettingsManager();
      const requireConfirmation = settingsManager.getUserSetting('requireConfirmation') ?? true;

      if (requireConfirmation) {
        const needsConfirmation = ['create_file', 'str_replace_editor', 'bash'].includes(toolCall.function.name);
        if (needsConfirmation) {
          // Robust confirmation handling with comprehensive error recovery
          try {
            const confirmationResult = await this.confirmationTool.requestConfirmation({
              operation: toolCall.function.name,
              filename: args.path || args.command || 'unknown',
              description: `Execute ${toolCall.function.name} operation`,
            });
            
            if (!confirmationResult.success) {
              const errorMessage = confirmationResult.error || 'Operation cancelled by user';
              console.log(`[GrokAgent] Confirmation rejected for tool ${toolCall.function.name}: ${errorMessage}`);
              return {
                success: false,
                error: errorMessage,
                details: 'User confirmation was required but rejected or failed'
              };
            }
          } catch (confirmationError) {
            const error = confirmationError as Error;
            console.error(`[GrokAgent] Confirmation system error for tool ${toolCall.function.name}:`, {
              error: error.message,
              stack: error.stack,
              toolCall: toolCall
            });
            return {
              success: false,
              error: `Confirmation system failed: ${error.message}`,
              details: 'The confirmation system encountered an error. This is a system issue, not a user rejection.'
            };
          }
        }
      }

      switch (toolCall.function.name) {
        case "view_file":
          try {
            const range: [number, number] | undefined =
              args.start_line && args.end_line
                ? [args.start_line, args.end_line]
                : undefined;
            return await this.textEditor.view(args.path, range);
          } catch (error: any) {
            console.warn(`view_file tool failed, falling back to bash: ${error.message}`);
            // Fallback to bash cat/head/tail
            const path = args.path;
            let command = `cat "${path}"`;
            if (args.start_line && args.end_line) {
              command = `sed -n '${args.start_line},${args.end_line}p' "${path}"`;
            }
            return this.truncateToolOutput(await this.bash.execute(command));
          }

        case "create_file":
          try {
            const result = await this.textEditor.create(args.path, args.content);
            return await this.wrapWithChainValidation(toolCall, result);
          } catch (error: any) {
            console.warn(`create_file tool failed, falling back to bash: ${error.message}`);
            // Fallback to bash echo/redirect
            const command = `cat > "${args.path}" << 'EOF'\n${args.content}\nEOF`;
            const result = await this.bash.execute(command);
            return await this.wrapWithChainValidation(toolCall, result);
          }

        case "str_replace_editor":
          try {
            const result = await this.textEditor.strReplace(
              args.path,
              args.old_str,
              args.new_str,
              args.replace_all
            );
            return await this.wrapWithChainValidation(toolCall, result);
          } catch (error: any) {
            console.warn(`str_replace_editor tool failed, falling back to bash: ${error.message}`);
            // Fallback to bash sed for replacement with proper regex escaping
            const escapedOld = RegexHelper.sanitizeForRegex(args.old_str);
            const escapedNew = RegexHelper.sanitizeForRegex(args.new_str);
            const sedCommand = args.replace_all
              ? `sed -i 's/${escapedOld}/${escapedNew}/g' "${args.path}"`
              : `sed -i '0,/${escapedOld}/s/${escapedOld}/${escapedNew}/' "${args.path}"`;
            const result = await this.bash.execute(sedCommand);
            return await this.wrapWithChainValidation(toolCall, result);
          }

        case "edit_file":
          if (!this.morphEditor) {
            return {
              success: false,
              error:
                "Morph Fast Apply not available. Please set MORPH_API_KEY environment variable to use this feature.",
            };
          }
          return await this.morphEditor.editFile(
            args.target_file,
            args.instructions,
            args.code_edit
          );

        case "bash":
          return this.truncateToolOutput(await this.bash.execute(args.command));

        case "create_todo_list":
          return await this.todoTool.createTodoList(args.todos);

        case "update_todo_list":
          return await this.todoTool.updateTodoList(args.updates);

        case "search":
          try {
            return this.truncateToolOutput(await this.search.search(args.query, {
              searchType: args.search_type,
              includePattern: args.include_pattern,
              excludePattern: args.exclude_pattern,
              caseSensitive: args.case_sensitive,
              wholeWord: args.whole_word,
              regex: args.regex,
              maxResults: args.max_results,
              fileTypes: args.file_types,
              includeHidden: args.include_hidden,
            }));
          } catch (error: any) {
            console.warn(`search tool failed, falling back to bash: ${error.message}`);
            // Fallback to bash grep/find
            let command = `grep -r "${args.query}" .`;
            if (args.include_pattern) {
              command += ` --include="${args.include_pattern}"`;
            }
            if (args.exclude_pattern) {
              command += ` --exclude="${args.exclude_pattern}"`;
            }
            return await this.bash.execute(command);
          }

        // Advanced Tools
        case "multi_file_edit":
          switch (args.operation) {
            case "begin_transaction":
              return await this.multiFileEditor.beginTransaction(args.description);
            case "add_operations":
              return await this.multiFileEditor.addOperations(args.operations);
            case "preview_transaction":
              return await this.multiFileEditor.previewTransaction();
            case "commit_transaction":
              return await this.multiFileEditor.commitTransaction();
            case "rollback_transaction":
              return await this.multiFileEditor.rollbackTransaction(args.transaction_id);
            case "execute_multi_file":
              return await this.multiFileEditor.executeMultiFileOperation(args.operations, args.description);
            default:
              return { success: false, error: `Unknown multi_file_edit operation: ${args.operation}` };
          }

        case "advanced_search":
          switch (args.operation) {
            case "search":
              return await this.advancedSearch.search(args.path, args.options);
            case "search_replace":
              return await this.advancedSearch.searchAndReplace(args.path, args.options);
            case "find_files":
              return await this.advancedSearch.findFiles(args.path, args.pattern, args.options);
            default:
              return { success: false, error: `Unknown advanced_search operation: ${args.operation}` };
          }

        case "file_tree_ops":
          switch (args.operation) {
            case "generate_tree":
              return await this.fileTreeOps.generateTree(args.path, args.options);
            case "bulk_operations":
              return await this.fileTreeOps.bulkOperations(args.operations);
            case "copy_structure":
              return await this.fileTreeOps.copyStructure(args.source, args.destination, args.options);
            case "organize_files":
              return await this.fileTreeOps.organizeFiles(args.source, args.organization_type, args.destination);
            case "cleanup_empty_dirs":
              return await this.fileTreeOps.cleanupEmptyDirectories(args.path);
            default:
              return { success: false, error: `Unknown file_tree_ops operation: ${args.operation}` };
          }

        case "code_analysis":
          switch (args.operation) {
            case "analyze":
              return await this.codeAwareEditor.analyzeCode(args.file_path);
            case "refactor":
              return await this.codeAwareEditor.refactor(args.file_path, args.refactor_operation);
            case "smart_insert":
              return await this.codeAwareEditor.smartInsert(args.file_path, args.code, args.location, args.target);
            case "format_code":
              return await this.codeAwareEditor.formatCode(args.file_path, args.options);
            case "add_imports":
              return await this.codeAwareEditor.addMissingImports(args.file_path, args.symbols);
            default:
              return { success: false, error: `Unknown code_analysis operation: ${args.operation}` };
          }

        case "operation_history":
          switch (args.operation) {
            case "show_history":
              return await this.operationHistory.showHistory(args.limit);
            case "undo":
              return await this.operationHistory.undo();
            case "redo":
              return await this.operationHistory.redo();
            case "goto_point":
              return await this.operationHistory.goToHistoryPoint(args.entry_id);
            case "clear_history":
              return await this.operationHistory.clearHistory();
            default:
              return { success: false, error: `Unknown operation_history operation: ${args.operation}` };
          }

        case "ast_parser":
          return await this.astParser.execute(args);

        case "symbol_search":
          return await this.symbolSearch.execute(args);

        case "dependency_analyzer":
          return await this.dependencyAnalyzer.execute(args);

        case "code_context":
          return await this.codeContext.execute(args);

        case "refactoring_assistant":
          return await this.refactoringAssistant.execute(args);

        case "vector_search":
          return await this.vectorSearch.execute(args);

        case "autonomous_task":
          return await this.autonomousTask.execute(args);

        case "index_codebase":
          const { codebaseIndexerTool } = await import('../tools/codebase-indexer-tool.js');
          return await codebaseIndexerTool.indexCodebase(args);

        case "search_symbols":
          const { codebaseIndexerTool: symbolSearchTool } = await import('../tools/codebase-indexer-tool.js');
          return await symbolSearchTool.searchSymbols(args);

        case "find_references":
          const { codebaseIndexerTool: refTool } = await import('../tools/codebase-indexer-tool.js');
          return await refTool.findReferences(args);

        case "get_dependencies":
          const { codebaseIndexerTool: depTool } = await import('../tools/codebase-indexer-tool.js');
          return await depTool.getDependencies(args);

        case "get_index_status":
          const { codebaseIndexerTool: statusTool } = await import('../tools/codebase-indexer-tool.js');
          return await statusTool.getIndexStatus();

        case "semantic_search":
          const { semanticSearchTool } = await import('../tools/semantic-search-tool.js');
          return await semanticSearchTool.semanticSearch(args);

        case "trace_code_flow":
          const { semanticSearchTool: flowTool } = await import('../tools/semantic-search-tool.js');
          return await flowTool.traceCodeFlow(args);

        case "map_features":
          const { semanticSearchTool: featureTool } = await import('../tools/semantic-search-tool.js');
          return await featureTool.mapFeatures(args);

        case "find_related_symbols":
          const { semanticSearchTool: relationTool } = await import('../tools/semantic-search-tool.js');
          return await relationTool.findRelatedSymbols(args);

        default:
          // Check if this is an MCP tool
          if (toolCall.function.name.startsWith("mcp__")) {
            return await this.executeMCPTool(toolCall);
          }

          return {
            success: false,
            error: `Unknown tool: ${toolCall.function.name}`,
          };
      }
    } catch (error: any) {
      const result: ToolResult = {
        success: false,
        error: `Tool execution error: ${error.message}`,
      };
      
      // Validate and track tool chain even for failed operations
      await this.validateAndTrackToolChain(toolCall, result);
      
      return result;
    } finally {
      // For successful operations, validation happens in the switch case return path
      // This ensures all tool executions are tracked for chain validation
    }
  }

  private async executeMCPTool(toolCall: GrokToolCall): Promise<ToolResult> {
    try {
      // Validate tool call structure before JSON parsing
      if (!toolCall.function?.arguments) {
        console.error(`[GrokAgent] MCP tool call missing function arguments:`, toolCall);
        return {
          success: false,
          error: `MCP tool call ${toolCall.function?.name || 'unknown'} missing required arguments`,
          details: `This appears to be a malformed MCP tool call. The AI model may have generated invalid XML or concatenated multiple tool calls.`
        };
      }

      // Check for malformed XML patterns in MCP tool calls
      if (typeof toolCall.function.arguments === 'string' && 
          (toolCall.function.arguments.includes('mcp__') && toolCall.function.arguments.match(/mcp__\w+mcp__/) ||
           toolCall.function.name?.startsWith('mcp__') && toolCall.function.name.split('__').length > 3)) {
        console.error(`[GrokAgent] Detected malformed XML in MCP tool call:`, {
          toolName: toolCall.function.name,
          arguments: toolCall.function.arguments
        });
        return {
          success: false,
          error: `Malformed MCP tool call detected - appears to be concatenated XML`,
          details: `The AI model generated invalid XML by concatenating multiple MCP tool calls. Use single, properly formatted tool calls only.`
        };
      }

      // Robust JSON parsing with detailed error handling
      let args: any;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (jsonError) {
        const parseError = jsonError as Error;
        console.error(`[GrokAgent] JSON Parse Error for MCP tool ${toolCall.function.name}:`, {
          error: parseError.message,
          arguments: toolCall.function.arguments,
          toolCall: toolCall
        });
        
        // Attempt to fix common JSON issues
        try {
          // Remove trailing commas and fix common formatting issues
          const cleanedArgs = toolCall.function.arguments
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/^\s*{?\s*/, '{')  // Ensure starts with {
            .replace(/\s*}?\s*$/, '}')  // Ensure ends with }
            .trim();
          args = JSON.parse(cleanedArgs);
          console.log(`[GrokAgent] MCP JSON parsing recovered after cleanup`);
        } catch (retryError) {
          return {
            success: false,
            error: `Invalid JSON arguments for MCP tool ${toolCall.function.name}: ${parseError.message}. Arguments: ${toolCall.function.arguments}`,
            details: `MCP tool call failed due to malformed JSON. This is likely a model generation issue.`
          };
        }
      }

      const mcpManager = getMCPManager();

      const result = await mcpManager.callTool(toolCall.function.name, args);

      if (result.isError) {
        return {
          success: false,
          error: (result.content[0] as any)?.text || "MCP tool error",
        };
      }

      // Extract content from result
      const output = result.content
        .map((item) => {
          if (item.type === "text") {
            return item.text;
          } else if (item.type === "resource") {
            return `Resource: ${item.resource?.uri || "Unknown"}`;
          }
          return String(item);
        })
        .join("\n");

      return {
        success: true,
        output: output || "Success",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `MCP tool execution error: ${error.message}`,
      };
    }
  }

  getChatHistory(): ChatEntry[] {
    return [...this.chatHistory];
  }

  saveSessionLog(): void {
    try {
      const sessionDir = path.join(require('os').homedir(), '.grok');
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }
      const sessionFile = path.join(sessionDir, 'session.log');
      const logLines = this.chatHistory.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      fs.writeFileSync(sessionFile, logLines);
    } catch (error) {
      // Silently ignore logging errors to not disrupt the app
      console.warn('Failed to save session log:', error);
    }
  }

  getCurrentDirectory(): string {
    return this.bash.getCurrentDirectory();
  }

  async executeBashCommand(command: string): Promise<ToolResult> {
    return await this.bash.execute(command);
  }

  getCurrentModel(): string {
    return this.grokClient.getCurrentModel();
  }

  setModel(model: string): void {
    this.grokClient.setModel(model);
    // Update token counter for new model
    this.tokenCounter.dispose();
    this.tokenCounter = createTokenCounter(model);
  }

  /**
   * Tool chain validation state tracking for coordinated multi-tool operations
   */
  private toolChainContext: {
    operationId?: string;
    chainedOperations: Array<{
      toolName: string;
      timestamp: number;
      success: boolean;
      dependencies?: string[];
    }>;
    rollbackPoints: Array<{
      operationId: string;
      description: string;
      timestamp: number;
    }>;
  } = {
    chainedOperations: [],
    rollbackPoints: []
  };

  /**
   * Validates and tracks tool chain operations for better error recovery
   */
  private async validateAndTrackToolChain(
    toolCall: GrokToolCall,
    result: ToolResult
  ): Promise<void> {
    try {
      // Generate operation ID if this is a new chain
      if (!this.toolChainContext.operationId) {
        this.toolChainContext.operationId = `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Track this operation
      const operation = {
        toolName: toolCall.function.name,
        timestamp: Date.now(),
        success: result.success,
        dependencies: this.inferToolDependencies(toolCall)
      };

      this.toolChainContext.chainedOperations.push(operation);

      // Create rollback point for successful file operations
      if (result.success && this.isFileModificationTool(toolCall.function.name)) {
        this.toolChainContext.rollbackPoints.push({
          operationId: this.toolChainContext.operationId,
          description: `${toolCall.function.name} on ${this.extractFilePath(toolCall)}`,
          timestamp: Date.now()
        });
      }

      // Tool chain validation - operation tracking only, no logging
      // Previously logged failures here, but suppressed for cleaner output

      // Clean up old chain data after 50 operations to prevent memory leaks
      if (this.toolChainContext.chainedOperations.length > 50) {
        this.toolChainContext.chainedOperations = this.toolChainContext.chainedOperations.slice(-25);
        this.toolChainContext.rollbackPoints = this.toolChainContext.rollbackPoints.slice(-10);
      }

    } catch (error) {
      console.error('[GrokAgent] Tool chain validation error:', error);
      // Don't let validation errors break the main flow
    }
  }

  /**
   * Infer tool dependencies based on tool type and arguments
   */
  private inferToolDependencies(toolCall: GrokToolCall): string[] {
    const dependencies: string[] = [];
    const toolName = toolCall.function.name;
    
    try {
      const args = JSON.parse(toolCall.function.arguments);
      
      // File operations depend on the target file existing (for edits)
      if (['str_replace_editor', 'view_file'].includes(toolName) && args.path) {
        dependencies.push(`file_exists:${args.path}`);
      }
      
      // Multi-file operations may have cross-dependencies
      if (toolName === 'multi_file_editor' && args.files) {
        args.files.forEach((file: any) => {
          if (file.path) dependencies.push(`file_exists:${file.path}`);
        });
      }
      
      // Bash commands may depend on working directory
      if (toolName === 'bash' && args.command) {
        if (args.command.includes('cd ')) {
          dependencies.push('working_directory');
        }
      }
    } catch (parseError) {
      // If we can't parse arguments, assume no specific dependencies
    }
    
    return dependencies;
  }

  /**
   * Checks if a tool modifies the filesystem
   */
  private isFileModificationTool(toolName: string): boolean {
    return ['create_file', 'str_replace_editor', 'multi_file_editor', 'morph_editor'].includes(toolName);
  }

  /**
   * Extracts file path from tool call arguments
   */
  private extractFilePath(toolCall: GrokToolCall): string {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      return args.path || args.filename || args.file || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Reset tool chain context (useful for starting fresh operations)
   */
  private resetToolChain(): void {
    this.toolChainContext = {
      chainedOperations: [],
      rollbackPoints: []
    };
  }

  /**
   * Wraps tool execution result with chain validation and visual feedback
   */
  private async wrapWithChainValidation(
    toolCall: GrokToolCall,
    result: ToolResult
  ): Promise<ToolResult> {
    await this.validateAndTrackToolChain(toolCall, result);
    
    // Add visual tree for complex operations
    const operationTree = this.createOperationTree(toolCall.function.name, toolCall);
    if (operationTree && result.success) {
      const enhancedOutput = operationTree + '\n' + (result.output || 'Operation completed successfully.');
      return {
        ...result,
        output: enhancedOutput
      };
    }
    
    return result;
  }

  /**
   * Creates visual operation tree for complex multi-step operations
   */
  private createOperationTree(
    operationType: string,
    toolCall: GrokToolCall
  ): string {
    const args = this.safeParseArguments(toolCall);
    
    try {
      let tree = '';
      
      if (operationType === 'multi_file_edit' && args.files) {
        tree = `┌─ 📝 Multi-file Edit Operation (${args.files.length} files)\n`;
        args.files.forEach((file: any, index: number) => {
          const isLast = index === args.files.length - 1;
          const prefix = isLast ? '└─' : '├─';
          tree += `${prefix} ✏️  Edit ${file.path || file.filename || 'unknown'}\n`;
        });
      } else if (operationType === 'bash' && args.command) {
        if (args.command.includes('&&') || args.command.includes(';')) {
          // Multi-command bash execution
          const commands = args.command.split(/[;&]+/).filter((cmd: string) => cmd.trim());
          tree = `┌─ ⚡ Bash Command Chain (${commands.length} commands)\n`;
          commands.forEach((cmd: string, index: number) => {
            const isLast = index === commands.length - 1;
            const prefix = isLast ? '└─' : '├─';
            tree += `${prefix} 🔧 ${cmd.trim()}\n`;
          });
        }
      } else if (['create_file', 'str_replace_editor'].includes(toolCall.function.name) && args.path) {
        const operation = toolCall.function.name === 'create_file' ? 'Create' : 'Edit';
        tree = `┌─ 📝 File Operation\n`;
        tree += `└─ ${operation === 'Create' ? '📄' : '✏️'} ${operation} ${args.path}\n`;
        if (args.old_str && args.new_str) {
          tree += `   └─ 🔄 Replace: "${args.old_str.substring(0, 30)}${args.old_str.length > 30 ? '...' : ''}"\n`;
        }
      } else if (toolCall.function.name === 'search' && args.query) {
        tree = `┌─ 🔍 Search Operation\n`;
        tree += `├─ 📁 Target: ${args.directory || 'current directory'}\n`;
        tree += `└─ 🎯 Query: "${args.query}"\n`;
      } else if (this.toolChainContext.chainedOperations.length > 1) {
        // Generic chain visualization
        const recentOps = this.toolChainContext.chainedOperations.slice(-5);
        tree = `┌─ 🔗 Tool Chain (${recentOps.length} operations)\n`;
        recentOps.forEach((op, index) => {
          const isLast = index === recentOps.length - 1;
          const prefix = isLast ? '└─' : '├─';
          const statusIcon = op.success ? '✅' : op.toolName === toolCall.function.name ? '🔄' : '⏳';
          tree += `${prefix} ${statusIcon} ${op.toolName}\n`;
        });
      }
      
      return tree;
    } catch (error) {
      // If tree generation fails, return empty string
      return '';
    }
  }

  /**
   * Safely parses tool arguments with fallback
   */
  private safeParseArguments(toolCall: GrokToolCall): any {
    try {
      return JSON.parse(toolCall.function.arguments);
    } catch {
      return {};
    }
  }

  /**
   * Enhanced file operation error handling with comprehensive recovery mechanisms
   * Provides consistent error reporting and recovery patterns for file operations
   */
  private async handleFileOperationWithRecovery<T>(
    operation: () => Promise<T>,
    operationName: string,
    filePath?: string
  ): Promise<{ success: boolean; result?: T; error?: string; details?: string }> {
    try {
      const result = await operation();
      return { success: true, result };
    } catch (error: any) {
      const err = error as Error & { code?: string; errno?: number };
      console.error(`[GrokAgent] File operation failed - ${operationName}:`, {
        error: err.message,
        stack: err.stack,
        filePath,
        code: err.code || 'UNKNOWN',
        errno: err.errno || 'UNKNOWN'
      });

      // Categorize error types for better user feedback
      let userFriendlyMessage = err.message || 'Unknown error';
      let details = `File operation '${operationName}' failed.`;
      
      if (err.code === 'ENOENT') {
        userFriendlyMessage = `File or directory not found: ${filePath || 'unknown path'}`;
        details = 'The specified file or directory does not exist. Please check the path and try again.';
      } else if (err.code === 'EACCES') {
        userFriendlyMessage = `Permission denied: ${filePath || 'unknown path'}`;
        details = 'You do not have sufficient permissions to access this file or directory.';
      } else if (err.code === 'EISDIR') {
        userFriendlyMessage = `Expected file but found directory: ${filePath || 'unknown path'}`;
        details = 'The operation expected a file but found a directory instead.';
      } else if (err.code === 'ENOTDIR') {
        userFriendlyMessage = `Expected directory but found file: ${filePath || 'unknown path'}`;
        details = 'The operation expected a directory but found a file instead.';
      } else if (err.code === 'ENOSPC') {
        userFriendlyMessage = 'No space left on device';
        details = 'The disk is full. Please free up space and try again.';
      } else if (err.code === 'EMFILE' || err.code === 'ENFILE') {
        userFriendlyMessage = 'Too many open files';
        details = 'System has reached the limit of open files. Please close other applications and try again.';
      } else if (err.message.includes('JSON') || err.message.includes('parse')) {
        userFriendlyMessage = 'File content parsing error';
        details = 'The file content could not be parsed. It may be corrupted or in an unexpected format.';
      }

      return {
        success: false,
        error: userFriendlyMessage,
        details
      };
    }
  }

  abortCurrentOperation(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  getMessageCount(): number {
    return this.chatHistory.length;
  }

  getSessionTokenCount(): number {
    return this.tokenCounter.countMessageTokens(this.messages as any);
  }

  private logEntry(entry: ChatEntry): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.sessionLogPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Log as JSON line
      const logLine = JSON.stringify({
        type: entry.type,
        content: entry.content,
        timestamp: entry.timestamp.toISOString(),
        toolCallId: entry.toolCall?.id,
        toolCallsCount: entry.toolCalls?.length,
      }) + '\n';

      fs.appendFileSync(this.sessionLogPath, logLine);
    } catch (error) {
      // Silently ignore logging errors to avoid disrupting the app
      console.warn('Failed to log session entry:', error);
    }
  }


  /**
   * Convert workflow results to chat entries for display
   */
  private workflowResultToChatEntries(
    userEntry: ChatEntry,
    output: any,
    approval: any,
    executionResult: any
  ): ChatEntry[] {
    const entries: ChatEntry[] = [userEntry];

    // Add workflow summary entry
    const summaryEntry: ChatEntry = {
      type: "assistant",
      content: `Workflow completed: ${executionResult?.success ? '✅ Success' : '❌ Failed'}\n\n${output?.plan?.summary || 'Task completed'}`,
      timestamp: new Date(),
    };
    entries.push(summaryEntry);
    this.chatHistory.push(summaryEntry);

    // Add execution details if available
    if (executionResult?.executionPlan) {
      const detailsEntry: ChatEntry = {
        type: "assistant",
        content: `Executed ${executionResult.executionPlan.completedSteps}/${executionResult.executionPlan.totalSteps} tasks successfully.`,
        timestamp: new Date(),
      };
      entries.push(detailsEntry);
      this.chatHistory.push(detailsEntry);
    }

    return entries;
  }

  /**
   * Build verbosity instructions for the system message based on user settings
   */
  private buildVerbosityInstructions(
    verbosityLevel: 'quiet' | 'normal' | 'verbose',
    explainLevel: 'off' | 'brief' | 'detailed'
  ): string {
    let instructions = '\n\nRESPONSE STYLE:\n';
    
    switch (verbosityLevel) {
      case 'quiet':
        instructions += '- Keep responses CONCISE and to the point. Avoid lengthy explanations.\n';
        instructions += '- Prioritize brevity over detail unless specifically requested.\n';
        instructions += '- Use minimal formatting and avoid verbose tool descriptions.\n';
        instructions += '- NEVER use separators like ### or --- between tool results and your response.\n';
        instructions += '- Provide analysis immediately after tools without visual dividers.\n';
        instructions += '- You may use **bold** and _italic_ for emphasis when helpful.\n';
        instructions += '- Match Claude Code style: tool outputs followed by clean, well-formatted analysis.\n';
        break;
      case 'normal':
        instructions += '- Provide balanced responses with appropriate detail.\n';
        instructions += '- Include context when helpful but avoid unnecessary verbosity.\n';
        break;
      case 'verbose':
        instructions += '- Provide comprehensive, detailed responses.\n';
        instructions += '- Include extensive context and explanations.\n';
        instructions += '- Use full formatting and detailed tool descriptions.\n';
        break;
    }
    
    switch (explainLevel) {
      case 'off':
        instructions += '- Do NOT explain your actions or reasoning.\n';
        instructions += '- Execute operations without commentary.\n';
        break;
      case 'brief':
        instructions += '- Provide brief explanations for your actions when relevant.\n';
        instructions += '- Keep reasoning concise and focused.\n';
        break;
      case 'detailed':
        instructions += '- Explain your reasoning and approach comprehensively.\n';
        instructions += '- Provide detailed context for all operations.\n';
        break;
    }
    
    // Universal style guidelines - FORMAT RULES
    instructions += '\n';
    // Let AI respond naturally with standard markdown - we'll parse and render it properly
    // Encourage visual formatting for better UX
    instructions += '\n💡 VISUAL FORMATTING:\n';
    instructions += '- Use emojis for status: ✅ success, ❌ error, ⚠️ warning, 💡 tips\n';
    instructions += '- Add checkmarks for completed features or working items\n';
    instructions += '- Use appropriate emojis to make responses more scannable\n';
    
    return instructions;
  }

  // Plan Mode integration methods
  
  /**
   * Set Plan Mode state for tool interception
   */
  setPlanModeState(state: PlanModeState | null): void {
    this.planModeState = state;
  }

  /**
   * Get current Plan Mode state
   */
  getPlanModeState(): PlanModeState | null {
    return this.planModeState;
  }

  /**
   * Set readonly filesystem overlay
   */
  setReadonlyOverlay(overlay: ReadOnlyFilesystemOverlay | null): void {
    this.readonlyOverlay = overlay;
  }

  /**
   * Get readonly filesystem overlay
   */
  getReadonlyOverlay(): ReadOnlyFilesystemOverlay | null {
    return this.readonlyOverlay;
  }

  /**
   * Check if operation is destructive and should be intercepted in Plan Mode
   */
  private isDestructiveOperation(toolName: string): boolean {
    const destructiveOperations = [
      'str_replace_editor',
      'create_file', 
      'bash',
      'morph_editor',
      'multi_file_editor',
      'code_aware_editor',
      'refactoring_assistant'
    ];
    return destructiveOperations.includes(toolName);
  }
}
