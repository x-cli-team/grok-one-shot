import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { inkColors, getSpinnerColor } from "../colors.js";

interface ProgressIndicatorProps {
  isActive: boolean;
  operation: 'compacting' | 'indexing' | 'analyzing' | 'optimizing';
  current: number;
  total: number;
  message?: string;
  showPercentage?: boolean;
  showETA?: boolean;
  startTime?: number;
}

export function ProgressIndicator({
  isActive,
  operation,
  current,
  total,
  message,
  showPercentage = true,
  showETA = false,
  startTime,
}: ProgressIndicatorProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 1000); // 1s pulse for subtle breathing effect

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive || total === 0) return null;

  const percentage = Math.round((current / total) * 100);
  const color = getSpinnerColor(operation);
  
  // Calculate ETA if requested and startTime provided
  const getETA = () => {
    if (!showETA || !startTime || current === 0) return '';
    
    const elapsed = Date.now() - startTime;
    const rate = current / elapsed;
    const remaining = total - current;
    const eta = Math.round(remaining / rate / 1000); // seconds
    
    if (eta < 60) return ` · ~${eta}s remaining`;
    if (eta < 3600) return ` · ~${Math.round(eta / 60)}m remaining`;
    return ` · ~${Math.round(eta / 3600)}h remaining`;
  };

  // Progress bar rendering
  const renderProgressBar = () => {
    const barLength = 25;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    
    // Use different characters for visual variety
    const fillChar = percentage === 100 ? '█' : '▓';
    const emptyChar = '░';
    
    const progressBar = fillChar.repeat(filled) + emptyChar.repeat(empty);
    
    return (
      <Text color={inkColors.muted}>
        [<Text color={color}>{progressBar}</Text>]
      </Text>
    );
  };

  // Operation icons with pulse effect
  const getOperationIcon = () => {
    const icons = {
      compacting: pulse ? '🔄' : '🔄',
      indexing: pulse ? '📂' : '📁', 
      analyzing: pulse ? '🔬' : '🔍',
      optimizing: pulse ? '⚡' : '⭐'
    };
    return icons[operation];
  };

  // Default messages for operations
  const getDefaultMessage = () => {
    const messages = {
      compacting: 'Compacting context',
      indexing: 'Indexing workspace',
      analyzing: 'Analyzing code',
      optimizing: 'Optimizing performance'
    };
    return messages[operation];
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <Box marginTop={1} flexDirection="column">
      <Box>
        <Text color={color}>
          {getOperationIcon()} {displayMessage}...
        </Text>
        {showPercentage && (
          <Text color={inkColors.muted}>
            {' '}{percentage}%
          </Text>
        )}
      </Box>
      
      <Box marginTop={0}>
        {renderProgressBar()}
        <Text color={inkColors.muted}>
          {' '}{current}/{total}{getETA()}
        </Text>
      </Box>
    </Box>
  );
}

// Specialized component for token compaction progress
interface TokenCompactionProgressProps {
  isActive: boolean;
  usedTokens: number;
  maxTokens: number;
  compactedTokens?: number;
  startTime?: number;
}

export function TokenCompactionProgress({
  isActive,
  usedTokens,
  maxTokens,
  compactedTokens = 0,
  startTime,
}: TokenCompactionProgressProps) {
  if (!isActive || usedTokens === 0) return null;

  return (
    <ProgressIndicator
      isActive={isActive}
      operation="compacting"
      current={compactedTokens}
      total={usedTokens}
      message={`Compacting context (${usedTokens}→${maxTokens} tokens)`}
      showPercentage={true}
      showETA={true}
      startTime={startTime}
    />
  );
}

// Workspace indexing progress indicator
interface WorkspaceIndexingProgressProps {
  isActive: boolean;
  indexedFiles: number;
  totalFiles: number;
  currentFile?: string;
}

export function WorkspaceIndexingProgress({
  isActive,
  indexedFiles,
  totalFiles,
  currentFile,
}: WorkspaceIndexingProgressProps) {
  if (!isActive || totalFiles === 0) return null;

  const message = currentFile 
    ? `Indexing ${currentFile.split('/').pop()}` 
    : 'Indexing workspace';

  return (
    <ProgressIndicator
      isActive={isActive}
      operation="indexing"
      current={indexedFiles}
      total={totalFiles}
      message={message}
      showPercentage={true}
      showETA={false}
    />
  );
}