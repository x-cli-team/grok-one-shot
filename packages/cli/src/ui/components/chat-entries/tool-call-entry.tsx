import React, { useState } from "react";
import { Box, Text } from "ink";
import { ChatEntry } from "../../../agent/grok-agent.js";
import { DiffRenderer } from "../diff-renderer.js";
import { ColoredDiffRenderer } from "../colored-diff-renderer.js";
import { FileContentRenderer } from "../content-renderers/file-content-renderer.js";
import { ToolBrevityService, type BrevityMode } from "../../../services/tool-brevity-service.js";
import { MarkdownRenderer } from "../../utils/markdown-renderer.js";

interface ToolCallEntryProps {
  entry: ChatEntry;
  verbosityLevel: 'quiet' | 'normal' | 'verbose';
  explainLevel: 'off' | 'brief' | 'detailed';
}

// Helper to truncate content in compact mode
const truncateContent = (content: string, maxLength: number = 100): string => {
  if (process.env.COMPACT !== '1') return content;
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
};

export function ToolCallEntry({ entry, verbosityLevel, explainLevel }: ToolCallEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate explanations for operations
  const getExplanation = (toolName: string, filePath: string, _isExecuting: boolean) => {
    if (explainLevel === 'off') return null;

    const explanations = {
      view_file: {
        brief: `Reading ${filePath} to examine its contents`,
        detailed: `Reading the file ${filePath} to examine its current contents, structure, and implementation details for analysis or modification.`
      },
      str_replace_editor: {
        brief: `Updating ${filePath} with changes`,
        detailed: `Applying targeted modifications to ${filePath} using precise string replacement to update specific code sections while preserving the rest of the file structure.`
      },
      create_file: {
        brief: `Creating new file ${filePath}`,
        detailed: `Creating a new file at ${filePath} with the specified content, establishing the initial structure and implementation for this component or module.`
      },
      bash: {
        brief: `Executing command: ${filePath}`,
        detailed: `Running the shell command "${filePath}" to perform system operations, file management, or external tool execution as requested.`
      },
      search: {
        brief: `Searching for: ${filePath}`,
        detailed: `Performing a comprehensive search across the codebase for "${filePath}" to locate relevant files, functions, or code patterns that match the query.`
      }
    };

    const explanation = explanations[toolName as keyof typeof explanations];
    if (!explanation) return null;

    return explainLevel === 'detailed' ? explanation.detailed : explanation.brief;
  };

  // Truncate content to Claude Code style (3 lines max)
  const truncateToClaudeStyle = (content: string): { preview: string; hasMore: boolean; totalLines: number } => {
    const lines = content.split('\n');
    const maxLines = 3;
    
    if (lines.length <= maxLines) {
      return { preview: content, hasMore: false, totalLines: lines.length };
    }

    const preview = lines.slice(0, maxLines).join('\n');
    return { 
      preview, 
      hasMore: true, 
      totalLines: lines.length 
    };
  };



  const getToolActionName = (toolName: string) => {
    // Handle MCP tools with mcp__servername__toolname format
    if (toolName.startsWith("mcp__")) {
      const parts = toolName.split("__");
      if (parts.length >= 3) {
        const serverName = parts[1];
        const actualToolName = parts.slice(2).join("__");
        return `${serverName.charAt(0).toUpperCase() + serverName.slice(1)}(${actualToolName.replace(/_/g, " ")})`;
      }
    }

    switch (toolName) {
      case "view_file":
        return "Read";
      case "str_replace_editor":
        return "Update";
      case "create_file":
        return "Create";
      case "bash":
        return "Bash";
      case "search":
        return "Search";
      case "create_todo_list":
        return "Created Todo";
      case "update_todo_list":
        return "Updated Todo";
      default:
        return "Tool";
    }
  };

  const toolName = entry.toolCall?.function?.name || "unknown";
  const actionName = getToolActionName(toolName);

  const getFilePath = (toolCall: any) => {
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        if (toolCall.function.name === "search") {
          return args.query;
        }
        return args.path || args.file_path || args.command || "";
      } catch {
        return "";
      }
    }
    return "";
  };

  const filePath = getFilePath(entry.toolCall);
  const isExecuting = entry.type === "tool_call" || !entry.toolResult;

  // Format JSON content for better readability
  const formatToolContent = (content: string, toolName: string) => {
    const truncated = truncateContent(content, 200); // Allow longer for tools
    if (toolName.startsWith("mcp__")) {
      try {
        // Try to parse as JSON and format it
        const parsed = JSON.parse(truncated);
        if (Array.isArray(parsed)) {
          // For arrays, show a summary instead of full JSON
          return `Found ${parsed.length} items`;
        } else if (typeof parsed === 'object') {
          // For objects, show a formatted version
          return JSON.stringify(parsed, null, 2);
        }
      } catch {
        // If not JSON, return as is
        return truncated;
      }
    }
    return truncated;
  };

  const shouldShowDiff =
    entry.toolCall?.function?.name === "str_replace_editor" &&
    entry.toolResult?.success &&
    entry.content.includes("Updated") &&
    entry.content.includes("---") &&
    entry.content.includes("+++");

  const shouldShowFileContent =
    (entry.toolCall?.function?.name === "view_file" ||
      entry.toolCall?.function?.name === "create_file") &&
    entry.toolResult?.success &&
    !shouldShowDiff;

  // Verbosity-based content filtering
  const shouldShowToolContent = verbosityLevel !== 'quiet';
  const shouldShowFullContent = verbosityLevel === 'normal' || verbosityLevel === 'verbose';
  
  // Convert verbosity to brevity mode
  const brevityMode: BrevityMode = verbosityLevel === 'quiet' ? 'brief' : 
                                   verbosityLevel === 'verbose' ? 'verbose' : 'normal';

  // Generate brevity summary for compact display
  const brevitySummary = ToolBrevityService.formatToolResult(
    toolName, 
    entry.content || '', 
    brevityMode
  );

  const explanation = getExplanation(toolName, filePath, isExecuting);
  const { preview, hasMore, totalLines } = truncateToClaudeStyle(entry.content || '');
  
  // Claude Code style: use ultra-brief format in quiet mode (but preserve colored diffs)
  const useClaudeCodeFormat = verbosityLevel === 'quiet' && brevitySummary.hasContent && !brevitySummary.metadata.isColoredDiff;

  // For colored diffs, always show full content regardless of verbosity
  const forceShowColoredDiff = brevitySummary.metadata.isColoredDiff;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text color="gray">⎿</Text>
        <Text color="white">
          {" "}
          {filePath ? `${actionName}(${filePath})` : actionName}
        </Text>
      </Box>
      {explanation && !useClaudeCodeFormat && (
        <Box marginLeft={2}>
          <Text color="blue" italic>
            💡 {explanation}
          </Text>
        </Box>
      )}
      {useClaudeCodeFormat ? (
        // Claude Code style: ultra-brief format
        <Box marginLeft={2}>
          <Text color="gray">⎿ {brevitySummary.summary} {brevitySummary.expansionHint}</Text>
        </Box>
      ) : shouldShowToolContent && (
        <Box marginLeft={2} flexDirection="column">
          {isExecuting ? (
            <Text color="cyan">⎿ Executing...</Text>
          ) : shouldShowFileContent && shouldShowFullContent ? (
            <Box flexDirection="column">
              {!isExpanded ? (
                <Box flexDirection="column">
                  <Box flexDirection="row" alignItems="flex-start">
                    <Text color="gray">⎿ </Text>
                    <Box flexDirection="column" width="100%">
                      <MarkdownRenderer content={preview} />
                    </Box>
                  </Box>
                  {hasMore && (
                    <Text color="gray">
                      … +{totalLines - 3} lines (ctrl+r to expand)
                    </Text>
                  )}
                </Box>
              ) : (
                <Box flexDirection="column">
                  <Text color="gray">⎿ File contents:</Text>
                  <Box marginLeft={2} flexDirection="column">
                    <FileContentRenderer content={entry.content} />
                  </Box>
                </Box>
              )}
            </Box>
          ) : shouldShowDiff && shouldShowFullContent && !brevitySummary.metadata.isColoredDiff ? (
            // For diff results, show only the summary line, not the raw content (unless it's a colored diff)
            <Text color="gray">⎿ {entry.content.split("\n")[0]}</Text>
          ) : !shouldShowFullContent ? (
            <Text color="gray">⎿ Completed</Text>
          ) : !isExpanded && hasMore ? (
            <Box flexDirection="column">
              <Box flexDirection="row" alignItems="flex-start">
                <Text color="gray">⎿ </Text>
                <Box flexDirection="column" width="100%">
                  <MarkdownRenderer content={preview} />
                </Box>
              </Box>
              <Text color="gray">
                … +{totalLines - 3} lines (ctrl+r to expand)
              </Text>
            </Box>
          ) : !isExpanded ? (
            <Box flexDirection="row" alignItems="flex-start">
              <Text color="gray">⎿ </Text>
              <Box flexDirection="column" width="100%">
                <MarkdownRenderer content={preview} />
              </Box>
            </Box>
          ) : (
            <Box flexDirection="row" alignItems="flex-start">
              <Text color="gray">⎿ </Text>
              <Box flexDirection="column" width="100%">
                <MarkdownRenderer content={formatToolContent(entry.content, toolName)} />
              </Box>
            </Box>
          )}
        </Box>
      )}
      {((shouldShowDiff && !isExecuting && shouldShowFullContent && !useClaudeCodeFormat) || (forceShowColoredDiff && !isExecuting)) && (
        <Box marginLeft={4} flexDirection="column">
          {forceShowColoredDiff ? (
            <ColoredDiffRenderer content={entry.content} />
          ) : (
            <DiffRenderer
              diffContent={entry.content}
              filename={filePath}
              terminalWidth={80}
            />
          )}
        </Box>
      )}
    </Box>
  );
}