/**
 * Approval Workflow Engine
 * 
 * Sophisticated workflow orchestration for plan approvals with multi-stage
 * approval processes, stakeholder management, and automated decision routing.
 * 
 * Features:
 * - Multi-stakeholder approval workflows
 * - Conditional approval gates
 * - Risk-based approval routing
 * - Automated conflict resolution
 * - Approval analytics and optimization
 * - Integration with visualization system
 */

import { EventEmitter } from 'events';
import {
  ImplementationPlan,
  Risk,
  ActionStep,
  PlanModePhase
} from '../types/plan-mode.js';
import {
  ApprovalSession,
  ApprovalResult,
  PlanApprovalManager
} from './plan-approval-manager.js';
import {
  PlanVisualizationOrchestrator,
  PendingDecision,
  DecisionOption,
  WorkflowAction
} from './plan-visualization-orchestrator.js';

export interface ApprovalWorkflowConfig {
  /** Workflow type */
  type: 'simple' | 'multi_stage' | 'risk_based' | 'consensus' | 'delegated';
  /** Maximum approval rounds */
  maxRounds: number;
  /** Timeout for each approval stage (minutes) */
  stageTimeout: number;
  /** Required consensus threshold (0-1) */
  consensusThreshold: number;
  /** Auto-approve conditions */
  autoApprovalCriteria: AutoApprovalCriteria;
  /** Risk escalation rules */
  riskEscalation: RiskEscalationRule[];
  /** Stakeholder requirements */
  stakeholderRoles: StakeholderRole[];
}

export interface AutoApprovalCriteria {
  /** Max risk level for auto-approval */
  maxRiskLevel: 'low' | 'medium' | 'high';
  /** Max effort hours for auto-approval */
  maxEffortHours: number;
  /** Max complexity score for auto-approval */
  maxComplexityScore: number;
  /** Required confidence threshold */
  minConfidenceScore: number;
  /** Allowed step types for auto-approval */
  allowedStepTypes: string[];
  /** File patterns requiring manual approval */
  restrictedFilePatterns: string[];
}

export interface RiskEscalationRule {
  /** Risk condition */
  condition: RiskCondition;
  /** Escalation action */
  action: 'require_additional_approval' | 'block_approval' | 'add_reviewer' | 'flag_for_review';
  /** Target role for escalation */
  targetRole?: string;
  /** Additional requirements */
  requirements?: string[];
  /** Escalation message */
  message: string;
}

export interface RiskCondition {
  /** Risk type */
  riskType?: string;
  /** Minimum risk score */
  minScore?: number;
  /** Risk category */
  category?: string;
  /** Affected components pattern */
  affectedPattern?: string;
  /** Custom condition function */
  customCheck?: (plan: ImplementationPlan, risks: Risk[]) => boolean;
}

export interface StakeholderRole {
  /** Role identifier */
  id: string;
  /** Role name */
  name: string;
  /** Role description */
  description: string;
  /** Approval authority level */
  authorityLevel: number;
  /** Required for approval types */
  requiredFor: ApprovalType[];
  /** Can override other approvals */
  canOverride: boolean;
  /** Auto-delegate conditions */
  autoDelegateRules: DelegationRule[];
}

export interface DelegationRule {
  /** Condition for delegation */
  condition: string;
  /** Target role to delegate to */
  delegateTo: string;
  /** Delegation message */
  message: string;
  /** Retains override rights */
  retainOverride: boolean;
}

export type ApprovalType = 'plan_strategy' | 'implementation_details' | 'risk_acceptance' | 'resource_allocation' | 'timeline_approval';

export interface ApprovalWorkflowState {
  /** Workflow ID */
  workflowId: string;
  /** Current workflow phase */
  phase: ApprovalWorkflowPhase;
  /** Current stage within phase */
  stage: ApprovalStage;
  /** Pending approvals by role */
  pendingApprovals: Map<string, PendingApproval>;
  /** Completed approvals */
  completedApprovals: ApprovalRecord[];
  /** Workflow decision history */
  decisionHistory: WorkflowDecision[];
  /** Risk escalations */
  escalations: RiskEscalation[];
  /** Auto-approval attempts */
  autoApprovalAttempts: AutoApprovalAttempt[];
  /** Overall workflow status */
  status: WorkflowStatus;
  /** Workflow metadata */
  metadata: WorkflowMetadata;
}

export type ApprovalWorkflowPhase = 
  | 'initialization' 
  | 'risk_assessment' 
  | 'stakeholder_review' 
  | 'implementation_approval' 
  | 'final_confirmation' 
  | 'execution_approval' 
  | 'completed';

export interface ApprovalStage {
  /** Stage ID */
  id: string;
  /** Stage name */
  name: string;
  /** Stage type */
  type: ApprovalType;
  /** Required roles for this stage */
  requiredRoles: string[];
  /** Optional roles */
  optionalRoles: string[];
  /** Stage timeout */
  timeout: Date;
  /** Stage dependencies */
  dependencies: string[];
  /** Completion criteria */
  completionCriteria: StageCriteria;
}

export interface StageCriteria {
  /** Required approval count */
  requiredApprovals: number;
  /** Consensus threshold */
  consensusThreshold: number;
  /** Veto-enabled roles */
  vetoRoles: string[];
  /** Override conditions */
  overrideConditions: OverrideCondition[];
}

export interface OverrideCondition {
  /** Override type */
  type: 'authority_level' | 'role_permission' | 'emergency' | 'time_based';
  /** Condition parameters */
  parameters: Record<string, any>;
  /** Override justification required */
  requiresJustification: boolean;
}

export interface PendingApproval {
  /** Approval ID */
  id: string;
  /** Target stakeholder role */
  role: string;
  /** Approval type */
  type: ApprovalType;
  /** Approval context */
  context: ApprovalContext;
  /** Due date */
  dueDate: Date;
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent';
  /** Reminder settings */
  reminders: ReminderSchedule;
  /** Delegation options */
  canDelegate: boolean;
  /** Auto-approval eligible */
  autoApprovalEligible: boolean;
  /** Operation being approved */
  operation?: string;
}

export interface ApprovalContext {
  /** Plan being approved */
  plan: ImplementationPlan;
  /** Specific focus areas */
  focusAreas: string[];
  /** Risk highlights */
  riskHighlights: Risk[];
  /** Impact assessment */
  impactAssessment: ImpactAssessment;
  /** Previous feedback */
  previousFeedback: string[];
  /** Supporting documentation */
  supportingDocs: SupportingDocument[];
}

export interface ImpactAssessment {
  /** Files that will be modified */
  affectedFiles: string[];
  /** Components impacted */
  affectedComponents: string[];
  /** Estimated business impact */
  businessImpact: string;
  /** Technical debt implications */
  technicalDebtImpact: string;
  /** Performance implications */
  performanceImpact: string;
  /** Security considerations */
  securityImpact: string;
}

export interface SupportingDocument {
  /** Document type */
  type: 'design_doc' | 'risk_analysis' | 'performance_test' | 'security_review' | 'user_story';
  /** Document title */
  title: string;
  /** Document content or path */
  content: string;
  /** Document author */
  author?: string;
  /** Document relevance score */
  relevance: number;
}

export interface ReminderSchedule {
  /** Initial reminder delay (minutes) */
  initialDelay: number;
  /** Escalation intervals (minutes) */
  escalationIntervals: number[];
  /** Final escalation actions */
  finalActions: string[];
}

export interface ApprovalRecord {
  /** Record ID */
  id: string;
  /** Approver role */
  role: string;
  /** Approval decision */
  decision: 'approved' | 'rejected' | 'conditional' | 'delegated';
  /** Approval timestamp */
  timestamp: Date;
  /** Feedback provided */
  feedback?: string;
  /** Conditions for conditional approval */
  conditions?: string[];
  /** Delegation target */
  delegatedTo?: string;
  /** Override used */
  override?: OverrideUsage;
  /** Approval confidence */
  confidence: number;
}

export interface OverrideUsage {
  /** Override type used */
  type: string;
  /** Justification provided */
  justification: string;
  /** Authority level applied */
  authorityLevel: number;
  /** Override timestamp */
  timestamp: Date;
}

export interface WorkflowDecision {
  /** Decision ID */
  id: string;
  /** Decision timestamp */
  timestamp: Date;
  /** Decision type */
  type: 'stage_completion' | 'escalation' | 'auto_approval' | 'workflow_override' | 'timeout_action' | 'approval_decision';
  /** Decision context */
  context: any;
  /** Decision rationale */
  rationale: string;
  /** Decision impact */
  impact: string[];
  /** Automated decision */
  automated: boolean;
}

export interface RiskEscalation {
  /** Escalation ID */
  id: string;
  /** Escalation timestamp */
  timestamp: Date;
  /** Triggering risk */
  risk: Risk;
  /** Escalation rule triggered */
  rule: RiskEscalationRule;
  /** Escalation status */
  status: 'pending' | 'in_review' | 'resolved' | 'overridden';
  /** Resolution */
  resolution?: EscalationResolution;
}

export interface EscalationResolution {
  /** Resolution type */
  type: 'approved' | 'rejected' | 'mitigated' | 'accepted';
  /** Resolution details */
  details: string;
  /** Resolver role */
  resolverRole: string;
  /** Resolution timestamp */
  timestamp: Date;
}

export interface AutoApprovalAttempt {
  /** Attempt ID */
  id: string;
  /** Attempt timestamp */
  timestamp: Date;
  /** Criteria checked */
  criteriaChecked: string[];
  /** Criteria results */
  results: Record<string, boolean>;
  /** Overall result */
  approved: boolean;
  /** Blocking factors */
  blockingFactors: string[];
  /** Confidence score */
  confidence: number;
}

export type WorkflowStatus = 
  | 'pending_initialization' 
  | 'in_progress' 
  | 'awaiting_approvals' 
  | 'escalated' 
  | 'approved' 
  | 'rejected' 
  | 'timeout' 
  | 'cancelled';

export interface WorkflowMetadata {
  /** Creation timestamp */
  created: Date;
  /** Last updated */
  lastUpdated: Date;
  /** Workflow priority */
  priority: 'low' | 'medium' | 'high' | 'urgent';
  /** Workflow tags */
  tags: string[];
  /** Related workflows */
  relatedWorkflows: string[];
  /** Performance metrics */
  metrics: WorkflowMetrics;
}

export interface WorkflowMetrics {
  /** Total processing time */
  totalProcessingTime: number;
  /** Average approval time by role */
  averageApprovalTime: Record<string, number>;
  /** Escalation count */
  escalationCount: number;
  /** Revision count */
  revisionCount: number;
  /** Auto-approval hit rate */
  autoApprovalRate: number;
  /** Approved operations count */
  approvedOperations: number;
  /** Rejected operations count */
  rejectedOperations: number;
}

export class ApprovalWorkflowEngine extends EventEmitter {
  private activeWorkflows = new Map<string, ApprovalWorkflowState>();
  private workflowConfigs = new Map<string, ApprovalWorkflowConfig>();
  private reminderTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private approvalManager: PlanApprovalManager,
    private visualizer?: PlanVisualizationOrchestrator
  ) {
    super();
    this.setupDefaultConfigs();
    this.startPeriodicCleanup();
  }

  /**
   * Initialize a new approval workflow
   */
  async initializeWorkflow(
    plan: ImplementationPlan,
    config: Partial<ApprovalWorkflowConfig> = {}
  ): Promise<string> {
    const workflowId = this.generateWorkflowId();
    const workflowConfig = { ...this.getDefaultConfig(), ...config };
    
    // Store config
    this.workflowConfigs.set(workflowId, workflowConfig);
    
    // Initialize workflow state
    const workflowState: ApprovalWorkflowState = {
      workflowId,
      phase: 'initialization',
      stage: this.createInitialStage(workflowConfig),
      pendingApprovals: new Map(),
      completedApprovals: [],
      decisionHistory: [],
      escalations: [],
      autoApprovalAttempts: [],
      status: 'pending_initialization',
      metadata: {
        created: new Date(),
        lastUpdated: new Date(),
        priority: this.determinePriority(plan),
        tags: this.generateTags(plan),
        relatedWorkflows: [],
        metrics: {
          totalProcessingTime: 0,
          averageApprovalTime: {},
          escalationCount: 0,
          revisionCount: 0,
          autoApprovalRate: 0,
          approvedOperations: 0,
          rejectedOperations: 0
        }
      }
    };

    this.activeWorkflows.set(workflowId, workflowState);
    
    // Start workflow processing
    await this.processWorkflowPhase(workflowId, plan);
    
    // Integrate with visualization
    if (this.visualizer) {
      this.integrateWithVisualizer(workflowId, plan);
    }
    
    this.emit('workflow-initialized', { workflowId, plan, config: workflowConfig });
    
    return workflowId;
  }

  /**
   * Process approval decision in workflow context
   */
  async processApprovalDecision(
    workflowId: string,
    approvalId: string,
    decision: 'approved' | 'rejected' | 'conditional' | 'delegated',
    feedback?: string,
    conditions?: string[]
  ): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const pendingApproval = workflow.pendingApprovals.get(approvalId);
    if (!pendingApproval) {
      throw new Error(`Pending approval not found: ${approvalId}`);
    }

    // Create approval record
    const approvalRecord: ApprovalRecord = {
      id: this.generateApprovalId(),
      role: pendingApproval.role,
      decision,
      timestamp: new Date(),
      feedback,
      conditions,
      confidence: this.calculateApprovalConfidence(decision, feedback)
    };

    // Remove from pending and add to completed
    workflow.pendingApprovals.delete(approvalId);
    workflow.completedApprovals.push(approvalRecord);

    // Update workflow metrics
    this.updateWorkflowMetrics(workflow, approvalRecord);

    // Process decision impact
    await this.processDecisionImpact(workflowId, approvalRecord, pendingApproval);

    // Check if stage is complete
    await this.checkStageCompletion(workflowId);

    this.emit('approval-processed', { 
      workflowId, 
      approvalRecord, 
      workflowStatus: workflow.status 
    });
  }

  /**
   * Attempt auto-approval for eligible plans
   */
  async attemptAutoApproval(workflowId: string, plan: ImplementationPlan): Promise<boolean> {
    const workflow = this.activeWorkflows.get(workflowId);
    const config = this.workflowConfigs.get(workflowId);
    
    if (!workflow || !config) {
      return false;
    }

    const attempt: AutoApprovalAttempt = {
      id: this.generateAttemptId(),
      timestamp: new Date(),
      criteriaChecked: [],
      results: {},
      approved: false,
      blockingFactors: [],
      confidence: 0
    };

    // Check auto-approval criteria
    const criteria = config.autoApprovalCriteria;
    const results = await this.evaluateAutoApprovalCriteria(plan, criteria, attempt);

    workflow.autoApprovalAttempts.push(attempt);

    if (results.approved) {
      workflow.status = 'approved';
      workflow.phase = 'completed';
      
      this.recordWorkflowDecision(workflowId, {
        type: 'auto_approval',
        context: { criteria, results },
        rationale: 'Plan met all auto-approval criteria',
        impact: ['Plan automatically approved', 'No manual review required'],
        automated: true
      });

      this.emit('auto-approval-succeeded', { workflowId, plan, attempt });
      return true;
    } else {
      this.emit('auto-approval-failed', { 
        workflowId, 
        plan, 
        attempt, 
        blockingFactors: results.blockingFactors 
      });
      return false;
    }
  }

  /**
   * Escalate workflow based on risk conditions
   */
  async escalateWorkflow(
    workflowId: string,
    risk: Risk,
    rule: RiskEscalationRule
  ): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    const escalation: RiskEscalation = {
      id: this.generateEscalationId(),
      timestamp: new Date(),
      risk,
      rule,
      status: 'pending'
    };

    workflow.escalations.push(escalation);
    workflow.status = 'escalated';

    // Apply escalation action
    await this.applyEscalationAction(workflowId, escalation);

    // Update visualization
    if (this.visualizer) {
      this.visualizer.addPendingDecision({
        id: escalation.id,
        title: `Risk Escalation: ${risk.title}`,
        description: rule.message,
        options: [
          {
            id: 'approve',
            label: 'Accept Risk and Continue',
            description: 'Accept the identified risk and proceed with approval',
            riskLevel: 'medium',
            consequences: ['Risk will be monitored', 'Additional safeguards may be required']
          },
          {
            id: 'reject',
            label: 'Reject Due to Risk',
            description: 'Reject the plan due to unacceptable risk level',
            riskLevel: 'low',
            consequences: ['Plan will be rejected', 'Alternative approaches required']
          },
          {
            id: 'mitigate',
            label: 'Require Risk Mitigation',
            description: 'Require additional risk mitigation measures',
            riskLevel: 'medium',
            consequences: ['Plan revision required', 'Additional mitigation steps needed']
          }
        ]
      });
    }

    this.emit('workflow-escalated', { workflowId, escalation });
  }

  /**
   * Get workflow status and metrics
   */
  getWorkflowStatus(workflowId: string): ApprovalWorkflowState | null {
    return this.activeWorkflows.get(workflowId) || null;
  }

  /**
   * Get workflow analytics
   */
  getWorkflowAnalytics(): {
    activeWorkflows: number;
    averageProcessingTime: number;
    autoApprovalRate: number;
    escalationRate: number;
    topBlockingFactors: string[];
    performanceByPhase: Record<string, number>;
  } {
    const workflows = Array.from(this.activeWorkflows.values());
    
    return {
      activeWorkflows: workflows.length,
      averageProcessingTime: this.calculateAverageProcessingTime(workflows),
      autoApprovalRate: this.calculateAutoApprovalRate(workflows),
      escalationRate: this.calculateEscalationRate(workflows),
      topBlockingFactors: this.getTopBlockingFactors(workflows),
      performanceByPhase: this.getPerformanceByPhase(workflows)
    };
  }

  // Private helper methods

  private setupDefaultConfigs(): void {
    const defaultConfig: ApprovalWorkflowConfig = {
      type: 'simple',
      maxRounds: 3,
      stageTimeout: 60, // minutes
      consensusThreshold: 0.7,
      autoApprovalCriteria: {
        maxRiskLevel: 'low',
        maxEffortHours: 8,
        maxComplexityScore: 3,
        minConfidenceScore: 0.8,
        allowedStepTypes: ['research', 'document', 'test'],
        restrictedFilePatterns: ['*.config.*', '**/production/**', '**/security/**']
      },
      riskEscalation: [
        {
          condition: { minScore: 4.0, category: 'security' },
          action: 'require_additional_approval',
          targetRole: 'security_reviewer',
          message: 'High security risk detected, additional security review required'
        },
        {
          condition: { minScore: 3.5, riskType: 'data_loss' },
          action: 'block_approval',
          message: 'Data loss risk too high for automatic approval'
        }
      ],
      stakeholderRoles: [
        {
          id: 'developer',
          name: 'Developer',
          description: 'Code implementer and reviewer',
          authorityLevel: 1,
          requiredFor: ['implementation_details'],
          canOverride: false,
          autoDelegateRules: []
        },
        {
          id: 'tech_lead',
          name: 'Technical Lead',
          description: 'Technical architecture and approach reviewer',
          authorityLevel: 3,
          requiredFor: ['plan_strategy', 'implementation_details'],
          canOverride: true,
          autoDelegateRules: []
        },
        {
          id: 'security_reviewer',
          name: 'Security Reviewer',
          description: 'Security implications reviewer',
          authorityLevel: 4,
          requiredFor: ['risk_acceptance'],
          canOverride: false,
          autoDelegateRules: []
        }
      ]
    };

    this.workflowConfigs.set('default', defaultConfig);
  }

  private getDefaultConfig(): ApprovalWorkflowConfig {
    return this.workflowConfigs.get('default')!;
  }

  private createInitialStage(config: ApprovalWorkflowConfig): ApprovalStage {
    return {
      id: 'initial_review',
      name: 'Initial Review',
      type: 'plan_strategy',
      requiredRoles: config.stakeholderRoles.filter(r => r.requiredFor.includes('plan_strategy')).map(r => r.id),
      optionalRoles: [],
      timeout: new Date(Date.now() + config.stageTimeout * 60 * 1000),
      dependencies: [],
      completionCriteria: {
        requiredApprovals: 1,
        consensusThreshold: config.consensusThreshold,
        vetoRoles: config.stakeholderRoles.filter(r => r.canOverride).map(r => r.id),
        overrideConditions: [
          {
            type: 'authority_level',
            parameters: { minLevel: 3 },
            requiresJustification: true
          }
        ]
      }
    };
  }

  private async processWorkflowPhase(workflowId: string, plan: ImplementationPlan): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    // Try auto-approval first
    if (await this.attemptAutoApproval(workflowId, plan)) {
      return;
    }

    // Check for risk escalations
    await this.checkRiskEscalations(workflowId, plan);

    // Create pending approvals for current stage
    await this.createPendingApprovals(workflowId, plan);

    // Update workflow status
    workflow.status = 'awaiting_approvals';
    workflow.metadata.lastUpdated = new Date();

    this.emit('workflow-phase-processed', { workflowId, phase: workflow.phase });
  }

  private integrateWithVisualizer(workflowId: string, plan: ImplementationPlan): void {
    if (!this.visualizer) return;

    // Add workflow actions to visualizer
    const actions: WorkflowAction[] = [
      {
        id: `approve_${workflowId}`,
        label: 'Approve Plan',
        description: 'Approve this implementation plan',
        type: 'approve',
        enabled: true,
        shortcut: 'A',
        consequences: ['Plan will be approved for execution']
      },
      {
        id: `reject_${workflowId}`,
        label: 'Reject Plan',
        description: 'Reject this plan and request alternatives',
        type: 'reject',
        enabled: true,
        shortcut: 'R',
        consequences: ['Plan will be rejected', 'Alternative strategies required']
      }
    ];

    // Integration logic would connect workflow events with visualizer
    this.on('approval-processed', (data) => {
      if (this.visualizer && data.workflowId === workflowId) {
        this.visualizer.processLiveUpdate({
          type: 'info',
          message: `Approval ${data.approvalRecord.decision} by ${data.approvalRecord.role}`,
          severity: 'low'
        });
      }
    });
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateApprovalId(): string {
    return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAttemptId(): string {
    return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEscalationId(): string {
    return `escalation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determinePriority(plan: ImplementationPlan): 'low' | 'medium' | 'high' | 'urgent' {
    const riskLevel = plan.risks.overallRisk;
    const effortHours = plan.effort.totalHours;
    
    if (riskLevel === 'critical' || effortHours > 80) return 'urgent';
    if (riskLevel === 'high' || effortHours > 40) return 'high';
    if (riskLevel === 'medium' || effortHours > 16) return 'medium';
    return 'low';
  }

  private generateTags(plan: ImplementationPlan): string[] {
    const tags: string[] = [];
    
    // Add risk-based tags
    tags.push(`risk:${plan.risks.overallRisk}`);
    
    // Add effort-based tags
    if (plan.effort.totalHours > 40) tags.push('large-effort');
    if (plan.effort.totalHours < 8) tags.push('small-effort');
    
    // Add step-type based tags
    const stepTypes = new Set(plan.actionPlan.steps.map(s => s.type));
    stepTypes.forEach(type => tags.push(`step:${type}`));
    
    return tags;
  }

  private async evaluateAutoApprovalCriteria(
    plan: ImplementationPlan, 
    criteria: AutoApprovalCriteria,
    attempt: AutoApprovalAttempt
  ): Promise<{ approved: boolean; blockingFactors: string[] }> {
    const blockingFactors: string[] = [];
    
    // Check risk level
    attempt.criteriaChecked.push('risk_level');
    if (plan.risks.overallRisk === 'medium' && criteria.maxRiskLevel === 'low') {
      blockingFactors.push(`Risk level ${plan.risks.overallRisk} exceeds maximum ${criteria.maxRiskLevel}`);
      attempt.results.risk_level = false;
    } else {
      attempt.results.risk_level = true;
    }
    
    // Check effort hours
    attempt.criteriaChecked.push('effort_hours');
    if (plan.effort.totalHours > criteria.maxEffortHours) {
      blockingFactors.push(`Effort ${plan.effort.totalHours}h exceeds maximum ${criteria.maxEffortHours}h`);
      attempt.results.effort_hours = false;
    } else {
      attempt.results.effort_hours = true;
    }
    
    // Check confidence score
    attempt.criteriaChecked.push('confidence_score');
    const confidence = plan.effort.confidence || 0.7;
    if (confidence < criteria.minConfidenceScore) {
      blockingFactors.push(`Confidence ${confidence} below minimum ${criteria.minConfidenceScore}`);
      attempt.results.confidence_score = false;
    } else {
      attempt.results.confidence_score = true;
    }
    
    // Check step types
    attempt.criteriaChecked.push('step_types');
    const hasRestrictedSteps = plan.actionPlan.steps.some(step => 
      !criteria.allowedStepTypes.includes(step.type)
    );
    if (hasRestrictedSteps) {
      blockingFactors.push('Plan contains non-auto-approvable step types');
      attempt.results.step_types = false;
    } else {
      attempt.results.step_types = true;
    }
    
    attempt.approved = blockingFactors.length === 0;
    attempt.blockingFactors = blockingFactors;
    attempt.confidence = Object.values(attempt.results).filter(Boolean).length / attempt.criteriaChecked.length;
    
    return { approved: attempt.approved, blockingFactors };
  }

  private async checkRiskEscalations(workflowId: string, plan: ImplementationPlan): Promise<void> {
    const config = this.workflowConfigs.get(workflowId);
    if (!config) return;

    for (const risk of plan.risks.risks) {
      for (const rule of config.riskEscalation) {
        if (this.evaluateRiskCondition(risk, rule.condition, plan)) {
          await this.escalateWorkflow(workflowId, risk, rule);
        }
      }
    }
  }

  private evaluateRiskCondition(risk: Risk, condition: RiskCondition, plan: ImplementationPlan): boolean {
    if (condition.minScore && risk.score < condition.minScore) return false;
    if (condition.category && risk.category !== condition.category) return false;
    if (condition.riskType && risk.id !== condition.riskType) return false;
    if (condition.customCheck && !condition.customCheck(plan, [risk])) return false;
    
    return true;
  }

  private async createPendingApprovals(workflowId: string, plan: ImplementationPlan): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    const config = this.workflowConfigs.get(workflowId);
    
    if (!workflow || !config) return;

    const stage = workflow.stage;
    
    for (const roleId of stage.requiredRoles) {
      const role = config.stakeholderRoles.find(r => r.id === roleId);
      if (!role) continue;

      const pendingApproval: PendingApproval = {
        id: this.generateApprovalId(),
        role: roleId,
        type: stage.type,
        context: this.createApprovalContext(plan),
        dueDate: stage.timeout,
        priority: workflow.metadata.priority,
        reminders: {
          initialDelay: 30,
          escalationIntervals: [60, 120, 240],
          finalActions: ['escalate_to_manager', 'auto_reject']
        },
        canDelegate: role.autoDelegateRules.length > 0,
        autoApprovalEligible: false
      };

      workflow.pendingApprovals.set(pendingApproval.id, pendingApproval);
    }
  }

  private createApprovalContext(plan: ImplementationPlan): ApprovalContext {
    return {
      plan,
      focusAreas: ['implementation_approach', 'risk_assessment', 'timeline'],
      riskHighlights: plan.risks.risks.filter(r => r.impact >= 3),
      impactAssessment: {
        affectedFiles: plan.actionPlan.steps.flatMap(s => s.affectedFiles).slice(0, 10),
        affectedComponents: ['core_system', 'user_interface', 'api_layer'],
        businessImpact: 'Medium impact on user experience and system reliability',
        technicalDebtImpact: 'Slight increase in complexity, offset by improved architecture',
        performanceImpact: 'No significant performance impact expected',
        securityImpact: 'Enhanced security through improved authentication flow'
      },
      previousFeedback: [],
      supportingDocs: []
    };
  }

  private async applyEscalationAction(workflowId: string, escalation: RiskEscalation): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    switch (escalation.rule.action) {
      case 'require_additional_approval':
        if (escalation.rule.targetRole) {
          // Add additional approver
          const additionalApproval: PendingApproval = {
            id: this.generateApprovalId(),
            role: escalation.rule.targetRole,
            type: 'risk_acceptance',
            context: this.createApprovalContext(workflow.metadata as any),
            dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
            priority: 'high',
            reminders: {
              initialDelay: 15,
              escalationIntervals: [30, 60],
              finalActions: ['escalate_immediately']
            },
            canDelegate: false,
            autoApprovalEligible: false
          };
          workflow.pendingApprovals.set(additionalApproval.id, additionalApproval);
        }
        break;
      
      case 'block_approval':
        workflow.status = 'rejected';
        break;
    }
  }

  private async checkStageCompletion(workflowId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    const stage = workflow.stage;
    const completedForStage = workflow.completedApprovals.filter(
      approval => stage.requiredRoles.includes(approval.role)
    );

    // Check if enough approvals received
    const approvedCount = completedForStage.filter(a => a.decision === 'approved').length;
    const rejectedCount = completedForStage.filter(a => a.decision === 'rejected').length;

    if (approvedCount >= stage.completionCriteria.requiredApprovals) {
      await this.advanceToNextPhase(workflowId);
    } else if (rejectedCount > 0) {
      workflow.status = 'rejected';
      this.emit('workflow-rejected', { workflowId, reason: 'Stage approval failed' });
    }
  }

  private async advanceToNextPhase(workflowId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    // Simple phase advancement logic
    switch (workflow.phase) {
      case 'initialization':
      case 'stakeholder_review':
        workflow.phase = 'implementation_approval';
        break;
      case 'implementation_approval':
        workflow.phase = 'final_confirmation';
        break;
      case 'final_confirmation':
        workflow.phase = 'completed';
        workflow.status = 'approved';
        break;
    }

    if (workflow.phase === 'completed') {
      this.activeWorkflows.delete(workflowId);
      this.emit('workflow-completed', { workflowId, status: 'approved' });
    } else {
      this.emit('workflow-phase-advanced', { workflowId, newPhase: workflow.phase });
    }
  }

  private updateWorkflowMetrics(workflow: ApprovalWorkflowState, approval: ApprovalRecord): void {
    // Update average approval time for role
    const timeSpent = approval.timestamp.getTime() - workflow.metadata.created.getTime();
    workflow.metadata.metrics.averageApprovalTime[approval.role] = timeSpent / (1000 * 60); // minutes
    
    // Update other metrics
    workflow.metadata.metrics.totalProcessingTime = Date.now() - workflow.metadata.created.getTime();
  }

  private recordWorkflowDecision(workflowId: string, decision: Partial<WorkflowDecision>): void {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    const fullDecision: WorkflowDecision = {
      id: `decision_${Date.now()}`,
      timestamp: new Date(),
      type: decision.type || 'stage_completion',
      context: decision.context || {},
      rationale: decision.rationale || '',
      impact: decision.impact || [],
      automated: decision.automated || false
    };

    workflow.decisionHistory.push(fullDecision);
  }

  private calculateApprovalConfidence(decision: string, feedback?: string): number {
    // Simple confidence calculation
    let confidence = 0.8;
    
    if (decision === 'approved') confidence += 0.1;
    if (decision === 'rejected') confidence -= 0.2;
    if (feedback && feedback.length > 50) confidence += 0.1; // Detailed feedback
    
    return Math.max(0, Math.min(1, confidence));
  }

  private async processDecisionImpact(
    workflowId: string, 
    approvalRecord: ApprovalRecord, 
    pendingApproval: PendingApproval
  ): Promise<void> {
    // Process the impact of an approval decision
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    // Record decision impact
    this.recordWorkflowDecision(workflowId, {
      type: 'approval_decision',
      context: {
        decision: approvalRecord.decision,
        role: approvalRecord.role,
        operation: pendingApproval.operation
      },
      rationale: approvalRecord.feedback || 'No feedback provided',
      impact: [`${approvalRecord.decision}_${pendingApproval.operation}`],
      automated: false
    });

    // Update workflow state based on decision
    if (approvalRecord.decision === 'approved') {
      workflow.metadata.metrics.approvedOperations++;
    } else {
      workflow.metadata.metrics.rejectedOperations++;
    }
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredWorkflows();
      this.sendReminders();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanupExpiredWorkflows(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = Date.now() - maxAge;
    
    for (const [workflowId, workflow] of this.activeWorkflows.entries()) {
      if (workflow.metadata.created.getTime() < cutoff) {
        this.activeWorkflows.delete(workflowId);
        this.workflowConfigs.delete(workflowId);
      }
    }
  }

  private sendReminders(): void {
    // Implementation for sending approval reminders
    // This would integrate with notification systems
  }

  private calculateAverageProcessingTime(workflows: ApprovalWorkflowState[]): number {
    if (workflows.length === 0) return 0;
    const total = workflows.reduce((sum, w) => sum + w.metadata.metrics.totalProcessingTime, 0);
    return total / workflows.length / (1000 * 60); // minutes
  }

  private calculateAutoApprovalRate(workflows: ApprovalWorkflowState[]): number {
    if (workflows.length === 0) return 0;
    const autoApproved = workflows.filter(w => w.status === 'approved' && w.autoApprovalAttempts.some(a => a.approved));
    return autoApproved.length / workflows.length;
  }

  private calculateEscalationRate(workflows: ApprovalWorkflowState[]): number {
    if (workflows.length === 0) return 0;
    const escalated = workflows.filter(w => w.escalations.length > 0);
    return escalated.length / workflows.length;
  }

  private getTopBlockingFactors(workflows: ApprovalWorkflowState[]): string[] {
    const factors: Record<string, number> = {};
    
    workflows.forEach(w => {
      w.autoApprovalAttempts.forEach(attempt => {
        attempt.blockingFactors.forEach(factor => {
          factors[factor] = (factors[factor] || 0) + 1;
        });
      });
    });
    
    return Object.entries(factors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([factor]) => factor);
  }

  private getPerformanceByPhase(workflows: ApprovalWorkflowState[]): Record<string, number> {
    const performance: Record<string, number[]> = {};
    
    workflows.forEach(w => {
      const phase = w.phase;
      if (!performance[phase]) performance[phase] = [];
      performance[phase].push(w.metadata.metrics.totalProcessingTime);
    });
    
    const averages: Record<string, number> = {};
    Object.entries(performance).forEach(([phase, times]) => {
      averages[phase] = times.reduce((sum, time) => sum + time, 0) / times.length / (1000 * 60);
    });
    
    return averages;
  }
}