import React from "react";
import { Box, Text } from "ink";
import { inkColors } from "../colors.js";
import { useContextInfo } from "../../hooks/use-context-info.js";

interface ContextTooltipProps {
  isVisible: boolean;
  onToggle?: () => void;
}

export function ContextTooltip({ isVisible }: ContextTooltipProps) {
  const { contextInfo } = useContextInfo();

  // Note: Keyboard handling for Ctrl+I is managed by parent component

  if (!isVisible) return null;

  return (
    <Box
      borderStyle="round"
      borderColor={inkColors.accent}
      padding={1}
      marginTop={1}
      marginBottom={1}
      flexDirection="column"
    >
      <Box marginBottom={1}>
        <Text color={inkColors.accent} bold>
          🧠 Context Awareness
        </Text>
        <Text color={inkColors.muted}>
          {" "}(Ctrl+I to toggle)
        </Text>
      </Box>

      <Box flexDirection="column">
        {/* Project Information */}
        <Box marginBottom={1}>
          <Text color={inkColors.primary} bold>
            📁 Project: 
          </Text>
          <Text color={inkColors.text}>
            {" "}{contextInfo.projectName || "Unknown"}
          </Text>
          {contextInfo.gitBranch && (
            <>
              <Text color={inkColors.muted}> on </Text>
              <Text color={inkColors.warning}>
                {contextInfo.gitBranch}
              </Text>
            </>
          )}
        </Box>

        {/* Workspace Stats */}
        <Box justifyContent="space-between" marginBottom={1}>
          <Box>
            <Text color={inkColors.success}>📊 Workspace:</Text>
            <Text color={inkColors.text}>
              {" "}{contextInfo.workspaceFiles} files
            </Text>
          </Box>
          <Box>
            <Text color={inkColors.success}>💾 Index:</Text>
            <Text color={inkColors.text}>
              {" "}{contextInfo.indexSize}
            </Text>
          </Box>
        </Box>

        {/* Session Information */}
        <Box justifyContent="space-between" marginBottom={1}>
          <Box>
            <Text color={inkColors.warning}>📝 Session:</Text>
            <Text color={inkColors.text}>
              {" "}{contextInfo.sessionFiles} files
            </Text>
          </Box>
          <Box>
            <Text color={inkColors.warning}>🔤 Tokens:</Text>
            <Text color={inkColors.text}>
              {" "}{contextInfo.activeTokens.toLocaleString()}
            </Text>
          </Box>
        </Box>

        {/* Real-time Activity */}
        <Box>
          <Text color={inkColors.accent}>⚡ Activity:</Text>
          <Text color={inkColors.text}>
            {" "}{contextInfo.lastActivity}
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color={inkColors.muted} dimColor>
          💡 This shows your current workspace context and session state
        </Text>
      </Box>
    </Box>
  );
}

