import React from 'react';
import { Box, Text } from "ink";
import { ChatEntry, GrokAgent } from '../../agent/grok-agent.js';
import { ConfirmationOptions } from '../../utils/confirmation-service.js';

import { Banner } from "./banner.js";
import { ContextTooltip } from "./context-tooltip.js";
import { ChatHistory } from "./chat-history.js";
import { LoadingSpinner } from "./loading-spinner.js";
import { PlanModeIndicator } from "./plan-mode-indicator.js";
import { ChatInput } from "./chat-input.js";
import { VersionNotification } from "./version-notification.js";
import { PlanModeStatusIndicator } from "./plan-mode-indicator.js";
import { MCPStatus } from "./mcp-status.js";
import ContextIndicator from "./context-indicator.js";
import { CommandSuggestions } from "./command-suggestions.js";
import { ModelSelection } from "./model-selection.js";
import ConfirmationDialog from "./confirmation-dialog.js";

export interface ContextInfo {
  workspaceFiles: number;
  indexSize: string;
  sessionFiles: number;
  activeTokens: number;
  lastActivity: string;
  gitBranch?: string;
  projectName?: string;
  memoryPressure: 'low' | 'medium' | 'high';
  isLoading: boolean;
  tokenUsage?: {
    current: number;
    max: number;
    percent: number;
  };
  messagesCount: number;
  loadedFiles: Array<{
    path: string;
    tokens: number;
    lastAccessed: Date;
  }>;
}

export interface PlanMode {
  isActive: boolean;
  currentPhase?: 'inactive' | 'analysis' | 'strategy' | 'presentation' | 'approved' | 'rejected';
  progress?: number;
  sessionDuration?: number;
}

export interface CommandSuggestionsData {
  suggestions: any[];
  selectedIndex: number;
  isVisible: boolean;
}

export interface ModelSelectionData {
  models: any[];
  selectedIndex: number;
  isVisible: boolean;
  currentModel: string;
}

export interface ChatInterfaceRendererProps {
  // Data props
  chatHistory: ChatEntry[];
  confirmationOptions: ConfirmationOptions | null;
  showContextTooltip: boolean;
  contextInfo: ContextInfo;
  verbosityLevel: any;
  explainLevel: any;
  isProcessing: boolean;
  isStreaming: boolean;
  processingTime: number;
  tokenCount: number;
  planMode: PlanMode;
  input: string;
  cursorPosition: number;
  autoEditEnabled: boolean;
  agent: GrokAgent;
  commandSuggestions: any[];
  selectedCommandIndex: number;
  showCommandSuggestions: boolean;
  availableModels: any[];
  selectedModelIndex: number;
  showModelSelection: boolean;
  asciiArt?: string;

  // Handler functions
  handleConfirmation: (dontAskAgain?: boolean) => void;
  handleRejection: (feedback?: string) => void;
  toggleContextTooltip: () => void;
}

export function ChatInterfaceRenderer({
  chatHistory,
  confirmationOptions,
  showContextTooltip,
  contextInfo,
  verbosityLevel,
  explainLevel,
  isProcessing,
  isStreaming,
  processingTime,
  tokenCount,
  planMode,
  input,
  cursorPosition,
  autoEditEnabled,
  agent,
  commandSuggestions,
  selectedCommandIndex,
  showCommandSuggestions,
  availableModels,
  selectedModelIndex,
  showModelSelection,
  handleConfirmation,
  handleRejection,
  toggleContextTooltip,
}: ChatInterfaceRendererProps) {
  return (
    <Box flexDirection="column" paddingX={2}>
      {/* Show enhanced banner only when no chat history and no confirmation dialog */}
      {chatHistory.length === 0 && !confirmationOptions && (
        <Box flexDirection="column">
          <Banner
            style="default"
            showContext={true}
            workspaceFiles={contextInfo.workspaceFiles}
            indexSize={contextInfo.indexSize}
            sessionRestored={contextInfo.sessionFiles > 0}
          />

          <Box marginTop={1} flexDirection="column">
            <Text color="cyan" bold>
              💡 Quick Start Tips:
            </Text>
            <Box marginTop={1} flexDirection="column">
              <Text color="gray">
                • <Text color="yellow">Ask anything:</Text> "Create a React component" or "Debug this Python script"
              </Text>
              <Text color="gray">
                • <Text color="yellow">Edit files:</Text> "Add error handling to app.js"
              </Text>
              <Text color="gray">
                • <Text color="yellow">Run commands:</Text> "Set up a new Node.js project"
              </Text>
              <Text color="gray">
                • <Text color="yellow">Get help:</Text> Type "/help" for all commands
              </Text>
            </Box>

            <Box marginTop={1}>
              <Text color="cyan" bold>
                🛠️ Power Features:
              </Text>
            </Box>
            <Box marginTop={1} flexDirection="column">
              <Text color="gray">
                • <Text color="magenta">Auto-edit mode:</Text> Press Shift+Tab to toggle hands-free editing
              </Text>
              <Text color="gray">
                • <Text color="magenta">Project memory:</Text> Create .grok/GROK.md to customize behavior
              </Text>
              <Text color="gray">
                • <Text color="magenta">Documentation:</Text> Run "/init-agent" for .agent docs system
              </Text>
              <Text color="gray">
                • <Text color="magenta">Error recovery:</Text> Run "/heal" after errors to add guardrails
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      <Box flexDirection="column" marginBottom={1}>
        <Text color="gray">
          Type your request in natural language. Ctrl+C to clear, 'exit' to
          quit.
        </Text>
      </Box>

      <Box flexDirection="column">
        <ChatHistory
          entries={chatHistory}
          isConfirmationActive={!!confirmationOptions}
          verbosityLevel={verbosityLevel}
          explainLevel={explainLevel}
        />
      </Box>

      {/* Context Tooltip */}
      <ContextTooltip
        isVisible={showContextTooltip}
        onToggle={toggleContextTooltip}
      />

      {/* Show confirmation dialog if one is pending */}
      {confirmationOptions && (
        <ConfirmationDialog
          operation={confirmationOptions.operation}
          filename={confirmationOptions.filename}
          showVSCodeOpen={confirmationOptions.showVSCodeOpen}
          content={confirmationOptions.content}
          onConfirm={handleConfirmation}
          onReject={handleRejection}
        />
      )}

      {!confirmationOptions && (
        <>
          <LoadingSpinner
            isActive={isProcessing || isStreaming}
            processingTime={processingTime}
            tokenCount={tokenCount}
            operation={isStreaming ? 'thinking' : 'process'}
            progress={undefined} // TODO: Add progress tracking for long operations
          />

          {/* Plan Mode Detailed Indicator */}
          {planMode.isActive && planMode.currentPhase && planMode.progress !== undefined && planMode.sessionDuration !== undefined && (
            <Box marginBottom={1}>
              <PlanModeIndicator
                isActive={planMode.isActive}
                phase={planMode.currentPhase}
                progress={planMode.progress}
                sessionDuration={planMode.sessionDuration}
                detailed={true}
              />
            </Box>
          )}

          <ChatInput
            input={input}
            cursorPosition={cursorPosition}
            isProcessing={isProcessing}
            isStreaming={isStreaming}
          />

          <VersionNotification isVisible={!isProcessing && !isStreaming} />

          <Box flexDirection="row" marginTop={1}>
            <Box marginRight={2}>
              <Text color="cyan">
                {autoEditEnabled ? "▶" : "⏸"} auto-edit:{" "}
                {autoEditEnabled ? "on" : "off"}
              </Text>
              <Text color="gray" dimColor>
                {" "}
                (shift + tab)
              </Text>
            </Box>
            <Box marginRight={2}>
              <Text color="yellow">≋ {agent.getCurrentModel()}</Text>
            </Box>
            <Box marginRight={2}>
              {planMode.currentPhase && planMode.progress !== undefined ? (
                <PlanModeStatusIndicator
                  isActive={planMode.isActive}
                  phase={planMode.currentPhase}
                  progress={planMode.progress}
                />
              ) : (
                <Text color="gray" dimColor>
                  Plan Mode: Off
                </Text>
              )}
            </Box>
            <MCPStatus />
          </Box>

          {/* Context Memory Indicator */}
          {contextInfo.tokenUsage && contextInfo.loadedFiles && (
            <Box marginTop={1}>
              <ContextIndicator
                state={{
                  tokenUsage: contextInfo.tokenUsage,
                  memoryPressure: contextInfo.memoryPressure,
                  loadedFiles: contextInfo.loadedFiles,
                  messagesCount: contextInfo.messagesCount,
                  contextHealth: 'optimal', // TODO: implement context health check
                  fileCount: contextInfo.loadedFiles.length,
                }}
                compact={true}
              />
            </Box>
          )}

          <CommandSuggestions
            suggestions={commandSuggestions}
            input={input}
            selectedIndex={selectedCommandIndex}
            isVisible={showCommandSuggestions}
          />

          <ModelSelection
            models={availableModels}
            selectedIndex={selectedModelIndex}
            isVisible={showModelSelection}
            currentModel={agent.getCurrentModel()}
          />
        </>
      )}
    </Box>
  );
}