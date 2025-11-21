/**
 * Plan Mode Indicator Component
 * 
 * Visual indicator showing when plan mode is active and current phase.
 * Provides clear feedback to users about plan mode state.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { PlanModePhase } from '../../types/plan-mode.js';

interface PlanModeIndicatorProps {
  /** Whether plan mode is active */
  isActive: boolean;
  /** Current plan mode phase */
  phase: PlanModePhase;
  /** Progress percentage (0-1) */
  progress: number;
  /** Session duration in milliseconds */
  sessionDuration: number;
  /** Whether to show detailed information */
  detailed?: boolean;
}

const PHASE_DISPLAY = {
  inactive: { label: 'Inactive', color: 'gray', symbol: '○' },
  analysis: { label: 'Analyzing', color: 'blue', symbol: '🔍' },
  strategy: { label: 'Planning', color: 'yellow', symbol: '🧠' },
  presentation: { label: 'Presenting', color: 'cyan', symbol: '📋' },
  approved: { label: 'Approved', color: 'green', symbol: '✅' },
  rejected: { label: 'Rejected', color: 'red', symbol: '❌' }
} as const;

const PHASE_DESCRIPTIONS = {
  inactive: 'Press Shift+Tab twice to enter Plan Mode',
  analysis: 'Exploring codebase and gathering insights',
  strategy: 'Formulating implementation strategy', 
  presentation: 'Presenting plan for your review',
  approved: 'Plan approved - ready for execution',
  rejected: 'Plan rejected - please provide feedback'
} as const;

export function PlanModeIndicator({
  isActive,
  phase,
  progress,
  sessionDuration,
  detailed = false
}: PlanModeIndicatorProps) {
  const phaseInfo = PHASE_DISPLAY[phase];
  const phaseDescription = PHASE_DESCRIPTIONS[phase];
  
  // Format session duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Format progress bar
  const formatProgressBar = (progress: number, width: number = 20) => {
    const filled = Math.round(progress * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  if (!isActive) {
    return detailed ? (
      <Box flexDirection="column" borderStyle="round" borderColor="gray" padding={1}>
        <Box flexDirection="row" alignItems="center">
          <Text color="gray">{phaseInfo.symbol}</Text>
          <Box marginLeft={1}>
            <Text color="gray" bold>Plan Mode: {phaseInfo.label}</Text>
          </Box>
        </Box>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {phaseDescription}
          </Text>
        </Box>
      </Box>
    ) : null;
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={phaseInfo.color} padding={1}>
      {/* Header with phase and status */}
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <Box flexDirection="row" alignItems="center">
          <Text color={phaseInfo.color}>{phaseInfo.symbol}</Text>
          <Box marginLeft={1}>
            <Text color={phaseInfo.color} bold>
              Plan Mode: {phaseInfo.label}
            </Text>
          </Box>
        </Box>
        <Box flexDirection="row" alignItems="center">
          <Text color="gray" dimColor>
            {formatDuration(sessionDuration)}
          </Text>
        </Box>
      </Box>

      {/* Progress bar */}
      {phase !== 'inactive' && phase !== 'approved' && phase !== 'rejected' && (
        <Box flexDirection="row" alignItems="center" marginTop={1}>
          <Box marginRight={1}>
            <Text color="gray" dimColor>Progress:</Text>
          </Box>
          <Text color={phaseInfo.color}>
            {formatProgressBar(progress)}
          </Text>
          <Box marginLeft={1}>
            <Text color="gray" dimColor>
              {Math.round(progress * 100)}%
            </Text>
          </Box>
        </Box>
      )}

      {/* Phase description */}
      {detailed && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            {phaseDescription}
          </Text>
        </Box>
      )}

      {/* Phase-specific information */}
      {detailed && phase === 'analysis' && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="blue" dimColor>• Reading project structure</Text>
          <Text color="blue" dimColor>• Analyzing dependencies</Text>
          <Text color="blue" dimColor>• Identifying key components</Text>
        </Box>
      )}

      {detailed && phase === 'strategy' && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow" dimColor>• Evaluating implementation approaches</Text>
          <Text color="yellow" dimColor>• Assessing risks and dependencies</Text>
          <Text color="yellow" dimColor>• Estimating effort and timeline</Text>
        </Box>
      )}

      {detailed && phase === 'presentation' && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="cyan" dimColor>• Preparing implementation plan</Text>
          <Text color="cyan" dimColor>• Organizing steps and dependencies</Text>
          <Text color="cyan" dimColor>• Ready for your review</Text>
        </Box>
      )}

      {/* Action hints */}
      {!detailed && (
        <Box flexDirection="row" marginTop={1}>
          <Text color="gray" dimColor>
            {phase === 'presentation' && '• Press Enter to review plan'}
            {phase === 'approved' && '• Type "execute" to start implementation'}
            {phase === 'rejected' && '• Provide feedback to regenerate plan'}
            {(phase === 'analysis' || phase === 'strategy') && '• Plan mode is analyzing...'}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Compact plan mode indicator for status bar
 */
export function PlanModeStatusIndicator({
  isActive,
  phase,
  progress
}: Pick<PlanModeIndicatorProps, 'isActive' | 'phase' | 'progress'>) {
  if (!isActive) {
    return (
      <Text color="gray" dimColor>
        Plan Mode: Off
      </Text>
    );
  }

  const phaseInfo = PHASE_DISPLAY[phase];
  
  return (
    <Box flexDirection="row" alignItems="center">
      <Text color={phaseInfo.color}>{phaseInfo.symbol}</Text>
      <Box marginLeft={1}>
        <Text color={phaseInfo.color}>
          Plan: {phaseInfo.label}
        </Text>
      </Box>
      {phase !== 'inactive' && phase !== 'approved' && phase !== 'rejected' && (
        <Box marginLeft={1}>
          <Text color="gray" dimColor>
            ({Math.round(progress * 100)}%)
          </Text>
        </Box>
      )}
    </Box>
  );
}