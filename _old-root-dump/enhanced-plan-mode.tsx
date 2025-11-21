/**
 * Enhanced Plan Mode Component
 * 
 * Complete Plan Mode interface with strategy presentation, user approval workflow,
 * and seamless integration with the plan generation and approval systems.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { ImplementationPlan } from '../../types/plan-mode.js';
import { PlanDisplay } from './plan-display.js';
import { ApprovalResult, PlanApprovalManager } from '../../services/plan-approval-manager.js';
import { inkColors } from '../colors.js';

interface StrategyOption {
  id: string;
  title: string;
  approach: string;
  pros: string[];
  cons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  effortEstimate: number;
  complexity: number;
  confidence: number;
  recommended: boolean;
  tradeoffs: string[];
}

interface EnhancedPlanModeProps {
  plan: ImplementationPlan;
  strategyOptions?: StrategyOption[];
  isActive: boolean;
  onApproval: (result: ApprovalResult) => void;
  onPlanRevision: (revisedPlan: ImplementationPlan) => void;
  onExit: () => void;
  approvalManager?: PlanApprovalManager;
}

type ApprovalState = 'presentation' | 'feedback_rejection' | 'feedback_revision' | 'processing' | 'completed';

export function EnhancedPlanMode({
  plan,
  strategyOptions = [],
  isActive,
  onApproval,
  onPlanRevision,
  onExit,
  approvalManager
}: EnhancedPlanModeProps) {
  const [approvalState, setApprovalState] = useState<ApprovalState>('presentation');
  const [selectedStrategy, setSelectedStrategy] = useState<string>(
    strategyOptions.find(opt => opt.recommended)?.id || strategyOptions[0]?.id || ''
  );
  const [feedbackInput, setFeedbackInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [revisionCount, setRevisionCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize approval session
  useEffect(() => {
    if (isActive && approvalManager && !sessionId) {
      approvalManager.startApprovalSession(plan, 3).then(id => {
        setSessionId(id);
      });
    }
  }, [isActive, approvalManager, plan, sessionId]);

  // Handle keyboard input
  useInput((input, key) => {
    if (!isActive) return;

    switch (approvalState) {
      case 'presentation':
        handlePresentationInput(input, key);
        break;
      case 'feedback_rejection':
      case 'feedback_revision':
        handleFeedbackInput(input, key);
        break;
    }
  });

  const handlePresentationInput = (input: string, key: any) => {
    switch (input.toLowerCase()) {
      case 'a':
        handleApproval();
        break;
      case 'r':
        setApprovalState('feedback_rejection');
        break;
      case 'm':
        setApprovalState('feedback_revision');
        break;
      case '?':
        setShowHelp(!showHelp);
        break;
      case 'q':
      case 'escape':
        onExit();
        break;
    }

    // Strategy selection with number keys
    const strategyIndex = parseInt(input) - 1;
    if (strategyIndex >= 0 && strategyIndex < strategyOptions.length) {
      setSelectedStrategy(strategyOptions[strategyIndex].id);
    }
  };

  const handleFeedbackInput = (input: string, key: any) => {
    if (key.return) {
      submitFeedback();
    } else if (key.escape) {
      setApprovalState('presentation');
      setFeedbackInput('');
    } else if (key.backspace) {
      setFeedbackInput(prev => prev.slice(0, -1));
    } else if (input && input.length === 1) {
      setFeedbackInput(prev => prev + input);
    }
  };

  const handleApproval = async () => {
    if (!approvalManager || !sessionId) return;

    try {
      setApprovalState('processing');
      
      const result = await approvalManager.processApproval(sessionId, 'approved');
      result.selectedStrategy = selectedStrategy;
      
      setApprovalState('completed');
      onApproval(result);
    } catch (error) {
      console.error('Approval failed:', error);
      setApprovalState('presentation');
    }
  };

  const submitFeedback = async () => {
    if (!approvalManager || !sessionId || !feedbackInput.trim()) return;

    try {
      setApprovalState('processing');

      if (approvalState === 'feedback_rejection') {
        const result = await approvalManager.processApproval(sessionId, 'rejected', feedbackInput);
        onApproval(result);
      } else if (approvalState === 'feedback_revision') {
        const result = await approvalManager.processApproval(sessionId, 'revision_requested', feedbackInput);
        if (result.decision === 'revision_requested') {
          // Generate revised plan using the public method
          const revisedPlan = await approvalManager.handleRevisionRequest(sessionId, feedbackInput);
          setRevisionCount(prev => prev + 1);
          onPlanRevision(revisedPlan);
          setApprovalState('presentation');
        }
      }

      setFeedbackInput('');
    } catch (error) {
      console.error('Feedback submission failed:', error);
      setApprovalState('presentation');
    }
  };

  if (!isActive) return null;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="double" borderColor="blue" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text bold color="blue">🎯 Enhanced Plan Mode - Strategy Review</Text>
          <Text color="gray">
            Review the implementation plan below and choose your approval action
          </Text>
          {revisionCount > 0 && (
            <Text color="yellow">📝 Revision #{revisionCount}</Text>
          )}
        </Box>
      </Box>

      {/* Strategy Selection Helper */}
      {strategyOptions.length > 1 && approvalState === 'presentation' && (
        <Box borderStyle="single" borderColor="yellow" padding={1} marginBottom={1}>
          <Box flexDirection="column">
            <Text bold color="yellow">⚡ Strategy Selection</Text>
            <Text color="gray">
              Press number keys (1-{strategyOptions.length}) to select different strategies:
            </Text>
            {strategyOptions.map((option, index) => (
              <Text key={option.id} color={selectedStrategy === option.id ? "yellow" : "gray"}>
                {index + 1}. {option.title} {option.recommended && '🌟'} {selectedStrategy === option.id && '← Selected'}
              </Text>
            ))}
          </Box>
        </Box>
      )}

      {/* Main Plan Display */}
      <PlanDisplay
        plan={plan}
        strategyOptions={strategyOptions}
        selectedStrategy={selectedStrategy}
        onApprove={handleApproval}
        onReject={(reason) => setApprovalState('feedback_rejection')}
        onRevise={(feedback) => setApprovalState('feedback_revision')}
        onStrategySelect={setSelectedStrategy}
        showApprovalControls={approvalState === 'presentation'}
      />

      {/* Feedback Input */}
      {(approvalState === 'feedback_rejection' || approvalState === 'feedback_revision') && (
        <FeedbackInput
          type={approvalState === 'feedback_rejection' ? 'rejection' : 'revision'}
          value={feedbackInput}
          onChange={setFeedbackInput}
          onSubmit={submitFeedback}
          onCancel={() => {
            setApprovalState('presentation');
            setFeedbackInput('');
          }}
        />
      )}

      {/* Processing State */}
      {approvalState === 'processing' && (
        <Box borderStyle="single" borderColor="yellow" padding={1}>
          <Text color="yellow">⏳ Processing your request...</Text>
        </Box>
      )}

      {/* Completed State */}
      {approvalState === 'completed' && (
        <Box borderStyle="single" borderColor="green" padding={1}>
          <Text color="green">✅ Plan approved! Proceeding with implementation...</Text>
        </Box>
      )}

      {/* Help Section */}
      {showHelp && (
        <HelpSection onClose={() => setShowHelp(false)} />
      )}

      {/* Status Bar */}
      <Box borderStyle="single" borderColor="gray" padding={1} marginTop={1}>
        <Box justifyContent="space-between">
          <Text color="gray">
            Session: {sessionId?.slice(-8) || 'N/A'} | 
            Strategy: {strategyOptions.find(opt => opt.id === selectedStrategy)?.title || 'Default'}
          </Text>
          <Text color="gray">
            Press ? for help | Q to exit Plan Mode
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

interface FeedbackInputProps {
  type: 'rejection' | 'revision';
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function FeedbackInput({ type, value, onChange, onSubmit, onCancel }: FeedbackInputProps) {
  const title = type === 'rejection' ? 'Plan Rejection Feedback' : 'Plan Revision Request';
  const placeholder = type === 'rejection' 
    ? 'Why are you rejecting this plan? (helps improve future plans)'
    : 'What specific changes would you like to see?';

  return (
    <Box borderStyle="double" borderColor="yellow" padding={1} marginY={1}>
      <Box flexDirection="column">
        <Text bold color="yellow">📝 {title}</Text>
        <Box marginBottom={1}>
          <Text color="gray">{placeholder}</Text>
        </Box>
        
        {/* Input Field */}
        <Box borderStyle="single" borderColor="cyan" padding={1} marginBottom={1}>
          <Text color="cyan">
            💬 {value}
            <Text backgroundColor="cyan" color="black">█</Text>
          </Text>
        </Box>

        {/* Common Options */}
        <Box flexDirection="column" marginBottom={1}>
          <Text color="gray">Common feedback options:</Text>
          {getCommonFeedbackOptions(type).map((option, index) => (
            <Text key={index} color="gray">• {option}</Text>
          ))}
        </Box>

        {/* Controls */}
        <Box>
          <Text color="green">Enter: Submit</Text>
          <Box marginLeft={3}>
            <Text color="red">Esc: Cancel</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function getCommonFeedbackOptions(type: 'rejection' | 'revision'): string[] {
  if (type === 'rejection') {
    return [
      'Approach is too complex for our needs',
      'Timeline estimates seem unrealistic',
      'Missing important technical considerations',
      'Doesn\'t align with our project goals'
    ];
  } else {
    return [
      'Add more detailed implementation steps',
      'Simplify the technical approach',
      'Include more risk mitigation strategies',
      'Adjust timeline to be more realistic'
    ];
  }
}

interface HelpSectionProps {
  onClose: () => void;
}

function HelpSection({ onClose }: HelpSectionProps) {
  return (
    <Box borderStyle="double" borderColor="blue" padding={1} marginY={1}>
      <Box flexDirection="column">
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color="blue">🎯 Enhanced Plan Mode Help</Text>
          <Text color="gray">Press ? again to close</Text>
        </Box>

        <Box flexDirection="column">
          <Text bold color="cyan">Navigation:</Text>
          <Text color="gray">• Use Tab/Arrow keys to switch between plan sections</Text>
          <Text color="gray">• Number keys (1-9) to select different strategy options</Text>
          <Text color="gray">• A/R/M keys for Approve/Reject/Modify actions</Text>

          <Box marginTop={1}>
            <Text bold color="cyan">Approval Actions:</Text>
          </Box>
          <Text color="green">• [A]pprove: Accept the plan and proceed to implementation</Text>
          <Text color="red">• [R]eject: Decline the plan with feedback for improvement</Text>
          <Text color="blue">• [M]odify: Request specific changes to improve the plan</Text>

          <Box marginTop={1}>
            <Text bold color="cyan">Strategy Selection:</Text>
          </Box>
          <Text color="gray">• Multiple strategies may be presented with trade-offs</Text>
          <Text color="gray">• Recommended strategies are marked with 🌟</Text>
          <Text color="gray">• Consider risk level, effort, and complexity when choosing</Text>

          <Box marginTop={1}>
            <Text bold color="cyan">Plan Sections:</Text>
          </Box>
          <Text color="gray">• Strategy: Implementation approach and alternatives</Text>
          <Text color="gray">• Action Plan: Detailed steps with effort estimates</Text>
          <Text color="gray">• Risks: Potential issues and mitigation strategies</Text>
          <Text color="gray">• Timeline: Effort breakdown and delivery projections</Text>
        </Box>
      </Box>
    </Box>
  );
}