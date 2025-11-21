/**
 * Plan Display Component
 * 
 * Beautiful visualization of implementation plans with interactive elements
 * for strategy selection and plan approval workflow.
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { ImplementationPlan, ActionStep, Risk } from '../../types/plan-mode.js';
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

interface PlanDisplayProps {
  plan: ImplementationPlan;
  strategyOptions?: StrategyOption[];
  selectedStrategy?: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onRevise: (feedback: string) => void;
  onStrategySelect?: (strategyId: string) => void;
  showApprovalControls?: boolean;
}

export function PlanDisplay({ 
  plan, 
  strategyOptions = [], 
  selectedStrategy,
  onApprove, 
  onReject, 
  onRevise, 
  onStrategySelect,
  showApprovalControls = true 
}: PlanDisplayProps) {
  const [selectedSection, setSelectedSection] = useState<'strategy' | 'steps' | 'risks' | 'timeline'>('strategy');

  return (
    <Box flexDirection="column" padding={1}>
      {/* Plan Header */}
      <Box borderStyle="round" borderColor="blue" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text bold color="blue">🎯 {plan.title}</Text>
          <Text color="gray" dimColor>{plan.description}</Text>
          <Box marginTop={1}>
            <Text color="cyan">📅 Created: {plan.createdAt.toLocaleDateString()}</Text>
            <Box marginLeft={3}>
              <Text color="cyan">📋 Version: {plan.version}</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Box marginBottom={1}>
        <TabButton 
          label="Strategy" 
          active={selectedSection === 'strategy'} 
          onClick={() => setSelectedSection('strategy')}
        />
        <TabButton 
          label="Action Plan" 
          active={selectedSection === 'steps'} 
          onClick={() => setSelectedSection('steps')}
        />
        <TabButton 
          label="Risks" 
          active={selectedSection === 'risks'} 
          onClick={() => setSelectedSection('risks')}
        />
        <TabButton 
          label="Timeline" 
          active={selectedSection === 'timeline'} 
          onClick={() => setSelectedSection('timeline')}
        />
      </Box>

      {/* Content Sections */}
      <Box flexDirection="column" marginBottom={1}>
        {selectedSection === 'strategy' && (
          <StrategySection 
            strategy={plan.strategy}
            options={strategyOptions}
            selected={selectedStrategy}
            onSelect={onStrategySelect}
          />
        )}
        
        {selectedSection === 'steps' && (
          <ActionPlanSection steps={plan.actionPlan.steps} />
        )}
        
        {selectedSection === 'risks' && (
          <RiskAssessmentSection risks={plan.risks.risks} overallRisk={plan.risks.overallRisk} />
        )}
        
        {selectedSection === 'timeline' && (
          <TimelineSection effort={plan.effort} />
        )}
      </Box>

      {/* Success Criteria */}
      <Box borderStyle="single" borderColor="green" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text bold color="green">✅ Success Criteria</Text>
          {plan.successCriteria.map((criteria, index) => (
            <Text key={index} color="gray">
              • {criteria}
            </Text>
          ))}
        </Box>
      </Box>

      {/* Approval Controls */}
      {showApprovalControls && (
        <ApprovalControls 
          onApprove={onApprove}
          onReject={onReject}
          onRevise={onRevise}
        />
      )}
    </Box>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <Box marginRight={1}>
      <Text 
        color={active ? "blue" : "gray"} 
        bold={active}
        backgroundColor={active ? "blue" : undefined}
        inverse={active}
      >
        {` ${label} `}
      </Text>
    </Box>
  );
}

interface StrategySectionProps {
  strategy: any;
  options: StrategyOption[];
  selected?: string;
  onSelect?: (strategyId: string) => void;
}

function StrategySection({ strategy, options, selected, onSelect }: StrategySectionProps) {
  return (
    <Box flexDirection="column">
      {/* Current Strategy */}
      <Box borderStyle="single" borderColor="cyan" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text bold color="cyan">🎯 Implementation Approach</Text>
          <Text color="white">{strategy.approach}</Text>
          
          {strategy.principles && strategy.principles.length > 0 && (
            <>
              <Box marginTop={1}>
                <Text bold color="cyan">📋 Key Principles</Text>
              </Box>
              {strategy.principles.map((principle: string, index: number) => (
                <Text key={index} color="gray">• {principle}</Text>
              ))}
            </>
          )}
        </Box>
      </Box>

      {/* Strategy Options */}
      {options.length > 0 && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="yellow">⚡ Strategy Options</Text>
          </Box>
          {options.map((option, index) => (
            <StrategyOptionCard 
              key={option.id}
              option={option}
              selected={selected === option.id}
              onSelect={() => onSelect?.(option.id)}
              index={index + 1}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

interface StrategyOptionCardProps {
  option: StrategyOption;
  selected: boolean;
  onSelect: () => void;
  index: number;
}

function StrategyOptionCard({ option, selected, onSelect, index }: StrategyOptionCardProps) {
  const borderColor = selected ? "yellow" : option.recommended ? "green" : "gray";
  const riskColor = option.riskLevel === 'low' ? 'green' : option.riskLevel === 'high' ? 'red' : 'yellow';

  return (
    <Box borderStyle="single" borderColor={borderColor} padding={1} marginBottom={1}>
      <Box flexDirection="column">
        {/* Header */}
        <Box>
          <Text bold color={borderColor}>
            {index}. {option.title}
            {option.recommended && ' 🌟'}
            {selected && ' ✓'}
          </Text>
        </Box>

        {/* Approach */}
        <Box marginY={1}>
          <Text color="white">{option.approach}</Text>
        </Box>

        {/* Metrics */}
        <Box marginBottom={1}>
          <Text color={riskColor}>Risk: {option.riskLevel.toUpperCase()}</Text>
          <Box marginLeft={3}>
            <Text color="cyan">Effort: {option.effortEstimate}h</Text>
          </Box>
          <Box marginLeft={3}>
            <Text color="magenta">Complexity: {option.complexity}/10</Text>
          </Box>
          <Box marginLeft={3}>
            <Text color="blue">Confidence: {Math.round(option.confidence * 100)}%</Text>
          </Box>
        </Box>

        {/* Pros */}
        {option.pros.length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            <Text color="green">✅ Pros:</Text>
            {option.pros.slice(0, 3).map((pro, i) => (
              <Text key={i} color="gray">  • {pro}</Text>
            ))}
          </Box>
        )}

        {/* Cons */}
        {option.cons.length > 0 && (
          <Box flexDirection="column">
            <Text color="red">❌ Cons:</Text>
            {option.cons.slice(0, 2).map((con, i) => (
              <Text key={i} color="gray">  • {con}</Text>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

interface ActionPlanSectionProps {
  steps: ActionStep[];
}

function ActionPlanSection({ steps }: ActionPlanSectionProps) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="blue">📋 Implementation Steps</Text>
      </Box>
      {steps.map((step, index) => (
        <StepCard key={step.id} step={step} index={index + 1} />
      ))}
    </Box>
  );
}

interface StepCardProps {
  step: ActionStep;
  index: number;
}

function StepCard({ step, index }: StepCardProps) {
  const typeColor = getStepTypeColor(step.type);

  return (
    <Box borderStyle="single" borderColor="gray" padding={1} marginBottom={1}>
      <Box flexDirection="column">
        {/* Step Header */}
        <Box>
          <Text bold color={typeColor}>
            {index}. {step.title}
          </Text>
          <Text color="gray">
            ({step.type} • {step.effort}h)
          </Text>
        </Box>

        {/* Description */}
        <Text color="white">{step.description}</Text>

        {/* Skills & Files */}
        <Box>
          {step.skills.length > 0 && (
            <Text color="cyan">Skills: {step.skills.join(', ')}</Text>
          )}
          {step.affectedFiles.length > 0 && (
            <Text color="yellow">
              Files: {step.affectedFiles.slice(0, 2).join(', ')}
              {step.affectedFiles.length > 2 && ` +${step.affectedFiles.length - 2} more`}
            </Text>
          )}
        </Box>

        {/* Acceptance Criteria */}
        {step.acceptanceCriteria.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="green">Acceptance:</Text>
            {step.acceptanceCriteria.slice(0, 2).map((criteria, i) => (
              <Text key={i} color="gray">  ✓ {criteria}</Text>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function getStepTypeColor(type: string): string {
  switch (type) {
    case 'research': return 'blue';
    case 'design': return 'cyan';
    case 'implement': return 'green';
    case 'test': return 'yellow';
    case 'document': return 'magenta';
    case 'deploy': return 'red';
    default: return 'white';
  }
}

interface RiskAssessmentSectionProps {
  risks: Risk[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
}

function RiskAssessmentSection({ risks, overallRisk }: RiskAssessmentSectionProps) {
  const riskColor = overallRisk === 'low' ? 'green' : overallRisk === 'critical' ? 'red' : 'yellow';

  return (
    <Box flexDirection="column">
      {/* Overall Risk */}
      <Box borderStyle="single" borderColor={riskColor} padding={1} marginBottom={1}>
        <Text bold color={riskColor}>
          🛡️ Overall Risk Level: {overallRisk.toUpperCase()}
        </Text>
      </Box>

      {/* Individual Risks */}
      {risks.length > 0 ? (
        risks.slice(0, 5).map((risk, index) => (
          <RiskCard key={risk.id} risk={risk} index={index + 1} />
        ))
      ) : (
        <Text color="green">✅ No significant risks identified</Text>
      )}
    </Box>
  );
}

interface RiskCardProps {
  risk: Risk;
  index: number;
}

function RiskCard({ risk, index }: RiskCardProps) {
  const severityColor = risk.impact >= 4 ? 'red' : risk.impact >= 3 ? 'yellow' : 'green';

  return (
    <Box borderStyle="single" borderColor={severityColor} padding={1} marginBottom={1}>
      <Box flexDirection="column">
        <Box>
          <Text bold color={severityColor}>
            {index}. {risk.title}
          </Text>
          <Text color="gray">
            ({risk.category} • Impact: {risk.impact}/5)
          </Text>
        </Box>
        
        <Text color="white">{risk.description}</Text>
        
        <Box>
          <Text color="cyan">Probability: {Math.round(risk.probability * 100)}%</Text>
          <Text color="magenta">Risk Score: {risk.score.toFixed(1)}</Text>
        </Box>
      </Box>
    </Box>
  );
}

interface TimelineSectionProps {
  effort: any;
}

function TimelineSection({ effort }: TimelineSectionProps) {
  return (
    <Box flexDirection="column">
      {/* Total Effort */}
      <Box borderStyle="single" borderColor="blue" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text bold color="blue">⏱️ Effort Estimate</Text>
          <Text color="white">Total Hours: {effort.totalHours}</Text>
          <Text color="cyan">Confidence: {Math.round((effort.confidence || 0.7) * 100)}%</Text>
        </Box>
      </Box>

      {/* Timeline Projections */}
      {effort.timeline && (
        <Box borderStyle="single" borderColor="green" padding={1} marginBottom={1}>
          <Box flexDirection="column">
            <Text bold color="green">📅 Timeline Projections</Text>
            <Text color="green">🎯 Optimistic: {effort.timeline.optimistic}</Text>
            <Text color="yellow">📊 Most Likely: {effort.timeline.mostLikely}</Text>
            <Text color="red">⚠️ Pessimistic: {effort.timeline.pessimistic}</Text>
          </Box>
        </Box>
      )}

      {/* Effort Breakdown */}
      {effort.breakdownByType && Object.keys(effort.breakdownByType).length > 0 && (
        <Box borderStyle="single" borderColor="cyan" padding={1}>
          <Box flexDirection="column">
            <Text bold color="cyan">📊 Effort Breakdown</Text>
            {Object.entries(effort.breakdownByType).map(([type, hours]) => (
              <Text key={type} color="gray">
                {type}: {String(hours)}h
              </Text>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

interface ApprovalControlsProps {
  onApprove: () => void;
  onReject: (reason: string) => void;
  onRevise: (feedback: string) => void;
}

function ApprovalControls({ onApprove, onReject, onRevise }: ApprovalControlsProps) {
  return (
    <Box borderStyle="double" borderColor="yellow" padding={1}>
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="yellow">🤔 Plan Approval</Text>
        </Box>
        
        <Box flexDirection="column">
          <Text color="green">✅ [A]pprove - Proceed with this implementation plan</Text>
          <Text color="red">❌ [R]eject - Decline this plan and request alternatives</Text>
          <Text color="blue">🔄 [M]odify - Request specific changes or improvements</Text>
          <Text color="gray">❓ [?] - Show detailed help for approval process</Text>
        </Box>

        <Text color="yellow" dimColor>
          Press the corresponding key to make your choice...
        </Text>
      </Box>
    </Box>
  );
}