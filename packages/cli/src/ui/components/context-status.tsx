import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { inkColors } from "../colors.js";

interface ContextStatusProps {
  workspaceFiles?: number;
  indexSize?: string;
  sessionRestored?: boolean;
  showDetails?: boolean;
}

interface DynamicContextInfo {
  tokenUsage: number;
  memoryPressure: 'low' | 'medium' | 'high';
  backgroundActivity: string[];
  lastUpdate: Date;
}

export function ContextStatus({
  workspaceFiles = 0,
  indexSize = "0 MB",
  sessionRestored = false,
  showDetails = false,
}: ContextStatusProps) {
  const [dynamicInfo, setDynamicInfo] = useState<DynamicContextInfo>({
    tokenUsage: 0,
    memoryPressure: 'low',
    backgroundActivity: [],
    lastUpdate: new Date(),
  });

  // Update dynamic context information
  useEffect(() => {
    const updateDynamicInfo = () => {
      // TODO: Integrate with actual token counter and memory monitoring
      const mockInfo: DynamicContextInfo = {
        tokenUsage: Math.floor(Math.random() * 50000) + 1000,
        memoryPressure: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        backgroundActivity: getActiveBackgroundTasks(),
        lastUpdate: new Date(),
      };
      setDynamicInfo(mockInfo);
    };

    updateDynamicInfo();
    const interval = setInterval(updateDynamicInfo, 300000); // Update every 5 minutes - reduced frequency to prevent scroll reset
    return () => clearInterval(interval);
  }, []);

  // Get memory pressure color
  const getMemoryPressureColor = (pressure: string) => {
    switch (pressure) {
      case 'low': return inkColors.success;
      case 'medium': return inkColors.warning;
      case 'high': return inkColors.error;
      default: return inkColors.muted;
    }
  };

  // Get memory pressure icon
  const getMemoryPressureIcon = (pressure: string) => {
    switch (pressure) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚫';
    }
  };

  // Compact status view (for banner)
  if (!showDetails) {
    return (
      <Box>
        <Text color={inkColors.muted}>
          📁 {workspaceFiles} files 
        </Text>
        <Text color={inkColors.muted}>
          {" "}· 💾 {indexSize} 
        </Text>
        {sessionRestored && (
          <Text color={inkColors.success}>
            {" "}· 🔄 restored
          </Text>
        )}
        <Text color={getMemoryPressureColor(dynamicInfo.memoryPressure)}>
          {" "}· {getMemoryPressureIcon(dynamicInfo.memoryPressure)} {dynamicInfo.memoryPressure}
        </Text>
      </Box>
    );
  }

  // Detailed status view
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={inkColors.accent} bold>
          📊 Context Status
        </Text>
        <Text color={inkColors.muted}>
          {" "}(updated {formatTimeAgo(dynamicInfo.lastUpdate)})
        </Text>
      </Box>

      {/* Workspace Information */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Box>
          <Text color={inkColors.primary}>📁 Workspace:</Text>
          <Text color={inkColors.text}> {workspaceFiles} files</Text>
        </Box>
        <Box>
          <Text color={inkColors.primary}>💾 Index:</Text>
          <Text color={inkColors.text}> {indexSize}</Text>
        </Box>
      </Box>

      {/* Token and Memory Information */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Box>
          <Text color={inkColors.warning}>🔤 Tokens:</Text>
          <Text color={inkColors.text}> {dynamicInfo.tokenUsage.toLocaleString()}</Text>
        </Box>
        <Box>
          <Text color={getMemoryPressureColor(dynamicInfo.memoryPressure)}>
            {getMemoryPressureIcon(dynamicInfo.memoryPressure)} Memory:
          </Text>
          <Text color={inkColors.text}> {dynamicInfo.memoryPressure}</Text>
        </Box>
      </Box>

      {/* Session Status */}
      <Box marginBottom={1}>
        <Text color={inkColors.success}>🔄 Session:</Text>
        <Text color={sessionRestored ? inkColors.success : inkColors.muted}>
          {" "}{sessionRestored ? "restored" : "fresh"}
        </Text>
      </Box>

      {/* Background Activity */}
      {dynamicInfo.backgroundActivity.length > 0 && (
        <Box flexDirection="column">
          <Text color={inkColors.accent}>⚡ Background Activity:</Text>
          {dynamicInfo.backgroundActivity.map((activity, index) => (
            <Box key={index} marginLeft={2}>
              <Text color={inkColors.muted}>• {activity}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// Helper function to get active background tasks
function getActiveBackgroundTasks(): string[] {
  // TODO: Integrate with actual background task monitoring
  const possibleTasks = [
    "Indexing workspace files",
    "Watching for file changes", 
    "Compacting context",
    "Syncing session state",
    "Optimizing token usage",
  ];
  
  // Return 0-2 random tasks for demo
  const numTasks = Math.floor(Math.random() * 3);
  return possibleTasks.slice(0, numTasks);
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}