import React from "react";
import { Box, Text } from "ink";
import { inkColors } from "../colors.js";

export interface ContextState {
  tokenUsage: {
    current: number;
    max: number;
    percent: number;
  };
  memoryPressure: "low" | "medium" | "high" | "critical";
  loadedFiles: Array<{
    path: string;
    tokens: number;
    lastAccessed: Date;
  }>;
  messagesCount: number;
  contextHealth: "optimal" | "degraded" | "critical";
  fileCount: number;
}

interface ContextIndicatorProps {
  state: ContextState;
  compact?: boolean;
  onCompactClick?: () => void;
  onClearClick?: () => void;
}

export default function ContextIndicator({
  state,
  compact = false,
}: ContextIndicatorProps) {
  const getTokenColor = (percent: number) => {
    if (percent >= 90) return inkColors.error;
    if (percent >= 80) return inkColors.warning;
    if (percent >= 60) return inkColors.info;
    return inkColors.success;
  };

  const getMemoryPressureColor = (pressure: string) => {
    switch (pressure) {
      case "critical":
        return inkColors.error;
      case "high":
        return inkColors.warning;
      case "medium":
        return inkColors.info;
      default:
        return inkColors.success;
    }
  };

  const formatTokenCount = (count: number): string => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M`;
    }
    if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getProgressBar = (percent: number, width: number = 20) => {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return "█".repeat(filled) + "▒".repeat(empty);
  };

  if (compact) {
    return (
      <Box>
        <Text color={getTokenColor(state.tokenUsage.percent)}>
          🧠 {formatTokenCount(state.tokenUsage.current)}/
          {formatTokenCount(state.tokenUsage.max)} ({state.tokenUsage.percent}
          %)
        </Text>
        <Text color={inkColors.muted}> │ </Text>
        <Text color={inkColors.info}>
          📁 {state.fileCount} files
        </Text>
        <Text color={inkColors.muted}> │ </Text>
        <Text color={inkColors.info}>
          💬 {state.messagesCount} msgs
        </Text>
        {state.memoryPressure !== "low" && (
          <>
            <Text color={inkColors.muted}> │ </Text>
            <Text color={getMemoryPressureColor(state.memoryPressure)}>
              ⚠️ {state.memoryPressure} pressure
            </Text>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={
        state.contextHealth === "critical"
          ? "red"
          : state.contextHealth === "degraded"
          ? "yellow"
          : "green"
      }
      paddingX={1}
      paddingY={0}
    >
      {/* Header */}
      <Box justifyContent="space-between">
        <Text bold color={inkColors.primary}>
          🧠 Context Status
        </Text>
        <Text
          color={
            state.contextHealth === "critical"
              ? inkColors.error
              : state.contextHealth === "degraded"
              ? inkColors.warning
              : inkColors.success
          }
        >
          {state.contextHealth.toUpperCase()}
        </Text>
      </Box>

      {/* Token Usage */}
      <Box flexDirection="column" marginTop={1}>
        <Box justifyContent="space-between">
          <Text color={inkColors.info}>Memory Usage:</Text>
          <Text color={getTokenColor(state.tokenUsage.percent)}>
            {formatTokenCount(state.tokenUsage.current)}/
            {formatTokenCount(state.tokenUsage.max)} (
            {state.tokenUsage.percent}%)
          </Text>
        </Box>
        <Box marginTop={0}>
          <Text color={getTokenColor(state.tokenUsage.percent)}>
            {getProgressBar(state.tokenUsage.percent, 40)}
          </Text>
        </Box>
      </Box>

      {/* Context Details */}
      <Box justifyContent="space-between" marginTop={1}>
        <Box>
          <Text color={inkColors.info}>📁 Files: </Text>
          <Text color={inkColors.accent}>{state.fileCount}</Text>
        </Box>
        <Box>
          <Text color={inkColors.info}>💬 Messages: </Text>
          <Text color={inkColors.accent}>{state.messagesCount}</Text>
        </Box>
        <Box>
          <Text color={inkColors.info}>🔥 Pressure: </Text>
          <Text color={getMemoryPressureColor(state.memoryPressure)}>
            {state.memoryPressure}
          </Text>
        </Box>
      </Box>

      {/* Warnings */}
      {state.tokenUsage.percent >= 80 && (
        <Box marginTop={1}>
          <Text color={inkColors.warning}>
            ⚠️ Approaching context limit. Consider using /compact or /clear
          </Text>
        </Box>
      )}

      {state.memoryPressure === "critical" && (
        <Box marginTop={1}>
          <Text color={inkColors.error}>
            🚨 Critical memory pressure! Performance may degrade. Use /clear
            immediately.
          </Text>
        </Box>
      )}

      {/* Recently Loaded Files */}
      {state.loadedFiles.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color={inkColors.info} bold>
            Recent Files:
          </Text>
          {state.loadedFiles.slice(0, 3).map((file, index) => (
            <Box key={index}>
              <Text color={inkColors.muted}>• </Text>
              <Text color={inkColors.accent}>{file.path}</Text>
              <Text color={inkColors.muted}>
                {" "}
                ({formatTokenCount(file.tokens)} tokens)
              </Text>
            </Box>
          ))}
          {state.loadedFiles.length > 3 && (
            <Text color={inkColors.muted}>
              ... and {state.loadedFiles.length - 3} more files
            </Text>
          )}
        </Box>
      )}

      {/* Commands Hint */}
      <Box marginTop={1}>
        <Text color={inkColors.muted}>
          💡 Use /context for details, /compact to optimize, /clear to reset
        </Text>
      </Box>
    </Box>
  );
}

// Export types for use in other components
export type { ContextIndicatorProps };