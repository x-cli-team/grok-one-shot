import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { formatTokenCount } from "../../utils/token-counter.js";
import { inkColors, getSpinnerColor } from "../colors.js";

interface LoadingSpinnerProps {
  isActive: boolean;
  processingTime: number;
  tokenCount: number;
  operation?: 'thinking' | 'search' | 'indexing' | 'write' | 'edit' | 'compact' | 'analyze' | 'process';
  message?: string;
  progress?: number; // 0-100 percentage
}

// Contextual operation messages and icons
const operationConfig = {
  thinking: {
    icon: '🧠',
    spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    messages: ['Thinking...', 'Processing...', 'Analyzing...', 'Computing...', 'Reasoning...']
  },
  search: {
    icon: '🔍',
    spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    messages: ['Searching...', 'Scanning files...', 'Finding matches...', 'Indexing...']
  },
  indexing: {
    icon: '📂',
    spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    messages: ['Indexing workspace...', 'Building context...', 'Mapping relationships...']
  },
  write: {
    icon: '📝',
    spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    messages: ['Writing file...', 'Saving changes...', 'Updating content...']
  },
  edit: {
    icon: '✏️',
    spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    messages: ['Editing file...', 'Applying changes...', 'Modifying content...']
  },
  compact: {
    icon: '🔄',
    spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    messages: ['Compacting context...', 'Optimizing memory...', 'Refreshing session...']
  },
  analyze: {
    icon: '🔬',
    spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    messages: ['Analyzing code...', 'Understanding structure...', 'Mapping dependencies...']
  },
  process: {
    icon: '⚡',
    spinner: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
    messages: ['Processing...', 'Working...', 'Computing...', 'Executing...']
  }
};

// Fallback loading texts for variety (reserved for future use)
// const fallbackTexts = [
//   "Herding electrons...",
//   "Calibrating flux capacitors...",
//   "Reticulating splines...",
//   "Optimizing bit patterns...",
//   "Harmonizing frequencies...",
//   "Defragmenting thoughts...",
//   "Compiling wisdom...",
//   "Bootstrapping reality...",
//   "Caffeinating algorithms...",
//   "Debugging the universe...",
// ];

export function LoadingSpinner({
  isActive,
  processingTime,
  tokenCount,
  operation = 'thinking',
  message,
  progress,
}: LoadingSpinnerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const config = operationConfig[operation];
  const spinnerChar = config.spinner[frameIndex % config.spinner.length];
  const operationMessage = message || config.messages[messageIndex % config.messages.length];
  const color = getSpinnerColor(operation);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setFrameIndex(prev => prev + 1);
    }, 80); // ~12 FPS animation

    return () => clearInterval(interval);
  }, [isActive]);

  // Separate effect for message rotation to avoid dependency issues
  useEffect(() => {
    if (!isActive) return;

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => prev + 1);
    }, 80 * config.spinner.length * 3); // Change message every 3 spinner cycles

    return () => clearInterval(messageInterval);
  }, [isActive, config.spinner.length]);

  if (!isActive) return null;

  // Generate progress bar if progress is provided
  const renderProgressBar = () => {
    if (progress === undefined) return null;
    
    const barLength = 20;
    const filled = Math.round((progress / 100) * barLength);
    const empty = barLength - filled;
    const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
    
    return (
      <Text color={inkColors.muted}>
        {' '}[<Text color={color}>{progressBar}</Text>] {progress}%
      </Text>
    );
  };

  return (
    <Box marginTop={1}>
      <Box>
        <Text color={color}>
          {config.icon} {spinnerChar} {operationMessage}
        </Text>
        {renderProgressBar()}
      </Box>
      <Text color={inkColors.muted}>
        {" "}({processingTime}s · ↑ {formatTokenCount(tokenCount)} tokens · esc to interrupt)
      </Text>
    </Box>
  );
}
