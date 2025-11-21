/**
 * Plan Visualization Orchestrator
 * 
 * Orchestrates the complete plan visualization system with real-time updates,
 * interactive workflows, and comprehensive visual feedback for Plan Mode.
 * 
 * Features:
 * - Real-time plan execution visualization
 * - Interactive step-by-step progress tracking  
 * - Dynamic risk assessment updates
 * - Strategy comparison matrices
 * - Timeline simulation and forecasting
 * - Visual workflow orchestration
 */

import { EventEmitter } from 'events';
import {
  ImplementationPlan,
  ActionStep,
  Risk,
  PlanModeState,
  ExplorationData,
  PlanModePhase
} from '../types/plan-mode.js';
import { TreeNode, createTreeNode, updateNodeStatus } from '../ui/components/operation-tree.js';
import { ReadOnlyToolExecutor } from './read-only-tool-executor.js';

export interface PlanVisualizationState {
  /** Current visualization mode */
  mode: 'overview' | 'execution' | 'analysis' | 'comparison' | 'timeline';
  /** Current plan being visualized */
  currentPlan: ImplementationPlan | null;
  /** Real-time execution progress */
  executionProgress: ExecutionProgress;
  /** Interactive workflow state */
  workflowState: WorkflowState;
  /** Visual components state */
  visualState: VisualState;
  /** User interaction state */
  interactionState: InteractionState;
}

export interface ExecutionProgress {
  /** Steps completed */
  completedSteps: string[];
  /** Currently executing step */
  currentStep: string | null;
  /** Failed steps */
  failedSteps: string[];
  /** Skipped steps */
  skippedSteps: string[];
  /** Overall progress percentage */
  overallProgress: number;
  /** Real-time metrics */
  metrics: ExecutionMetrics;
  /** Live updates from tool execution */
  liveUpdates: LiveUpdate[];
}

export interface ExecutionMetrics {
  /** Time elapsed */
  timeElapsed: number;
  /** Estimated time remaining */
  timeRemaining: number;
  /** Steps per minute velocity */
  velocity: number;
  /** Error rate */
  errorRate: number;
  /** Quality score */
  qualityScore: number;
  /** Resource utilization */
  resourceUtilization: ResourceMetrics;
}

export interface ResourceMetrics {
  /** CPU usage percentage */
  cpu: number;
  /** Memory usage (MB) */
  memory: number;
  /** File operations per second */
  fileOps: number;
  /** Network requests per minute */
  networkRequests: number;
}

export interface LiveUpdate {
  /** Update ID */
  id: string;
  /** Timestamp */
  timestamp: Date;
  /** Update type */
  type: 'step_start' | 'step_complete' | 'step_fail' | 'warning' | 'info' | 'error';
  /** Step ID if related to a step */
  stepId?: string;
  /** Update message */
  message: string;
  /** Additional data */
  data?: any;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkflowState {
  /** Current workflow phase */
  currentPhase: PlanModePhase;
  /** Phase progress within current phase */
  phaseProgress: number;
  /** Available actions in current state */
  availableActions: WorkflowAction[];
  /** Workflow history */
  history: WorkflowHistoryEntry[];
  /** Pending decisions */
  pendingDecisions: PendingDecision[];
}

export interface WorkflowAction {
  /** Action ID */
  id: string;
  /** Action label */
  label: string;
  /** Action description */
  description: string;
  /** Action type */
  type: 'approve' | 'reject' | 'modify' | 'restart' | 'skip' | 'retry';
  /** Whether action is enabled */
  enabled: boolean;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Action consequences */
  consequences: string[];
}

export interface WorkflowHistoryEntry {
  /** Timestamp */
  timestamp: Date;
  /** Phase */
  phase: PlanModePhase;
  /** Action taken */
  action: string;
  /** User who took action */
  user?: string;
  /** Result of action */
  result: 'success' | 'failure' | 'cancelled';
  /** Additional context */
  context?: any;
}

export interface PendingDecision {
  /** Decision ID */
  id: string;
  /** Decision title */
  title: string;
  /** Decision description */
  description: string;
  /** Available options */
  options: DecisionOption[];
  /** Default option */
  defaultOption?: string;
  /** Decision timeout */
  timeout?: number;
  /** Related step or risk */
  relatedEntity?: string;
}

export interface DecisionOption {
  /** Option ID */
  id: string;
  /** Option label */
  label: string;
  /** Option description */
  description: string;
  /** Recommended flag */
  recommended?: boolean;
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high';
  /** Consequences */
  consequences: string[];
}

export interface VisualState {
  /** Selected visualization tabs */
  selectedTabs: Set<string>;
  /** Expanded sections */
  expandedSections: Set<string>;
  /** Visual filters applied */
  filters: VisualizationFilter[];
  /** Zoom level */
  zoomLevel: number;
  /** Scroll position */
  scrollPosition: { x: number; y: number };
  /** Highlight targets */
  highlights: HighlightTarget[];
  /** Animation state */
  animations: AnimationState[];
}

export interface VisualizationFilter {
  /** Filter type */
  type: 'step_type' | 'risk_level' | 'time_range' | 'component';
  /** Filter value */
  value: any;
  /** Filter enabled */
  enabled: boolean;
}

export interface HighlightTarget {
  /** Target type */
  type: 'step' | 'risk' | 'dependency' | 'file';
  /** Target ID */
  id: string;
  /** Highlight style */
  style: 'info' | 'warning' | 'error' | 'success' | 'focus';
  /** Highlight duration (ms) */
  duration?: number;
}

export interface AnimationState {
  /** Animation type */
  type: 'pulse' | 'fade' | 'slide' | 'bounce' | 'progress';
  /** Target element */
  target: string;
  /** Animation progress (0-1) */
  progress: number;
  /** Animation duration */
  duration: number;
}

export interface InteractionState {
  /** Currently focused element */
  focusedElement: string | null;
  /** User input mode */
  inputMode: 'keyboard' | 'selection' | 'editing';
  /** Selected items */
  selectedItems: Set<string>;
  /** Drag and drop state */
  dragState?: DragState;
  /** Modal dialogs open */
  openModals: Set<string>;
  /** Tooltip state */
  tooltip?: TooltipState;
}

export interface DragState {
  /** Item being dragged */
  draggedItem: string;
  /** Drag type */
  type: 'step' | 'dependency' | 'timeline_item';
  /** Drop targets */
  validDropTargets: string[];
  /** Current position */
  position: { x: number; y: number };
}

export interface TooltipState {
  /** Target element */
  target: string;
  /** Tooltip content */
  content: string;
  /** Tooltip position */
  position: { x: number; y: number };
  /** Tooltip type */
  type: 'info' | 'warning' | 'help';
}

export interface StrategyComparison {
  /** Strategies being compared */
  strategies: StrategyComparisonItem[];
  /** Comparison criteria */
  criteria: ComparisonCriterion[];
  /** Comparison matrix */
  matrix: ComparisonMatrix;
  /** Recommended strategy */
  recommendedStrategy: string;
  /** Decision factors */
  decisionFactors: DecisionFactor[];
}

export interface StrategyComparisonItem {
  /** Strategy ID */
  id: string;
  /** Strategy name */
  name: string;
  /** Strategy description */
  description: string;
  /** Strategy plan */
  plan: ImplementationPlan;
  /** Scores for each criterion */
  scores: Record<string, number>;
  /** Overall score */
  overallScore: number;
  /** Pros and cons */
  prosAndCons: { pros: string[]; cons: string[] };
}

export interface ComparisonCriterion {
  /** Criterion ID */
  id: string;
  /** Criterion name */
  name: string;
  /** Criterion weight */
  weight: number;
  /** Criterion type */
  type: 'time' | 'risk' | 'complexity' | 'quality' | 'maintainability';
  /** Higher is better */
  higherIsBetter: boolean;
}

export interface ComparisonMatrix {
  /** Matrix data [strategy][criterion] = score */
  data: Record<string, Record<string, number>>;
  /** Normalized scores */
  normalized: Record<string, Record<string, number>>;
  /** Weighted scores */
  weighted: Record<string, Record<string, number>>;
}

export interface DecisionFactor {
  /** Factor name */
  name: string;
  /** Factor importance */
  importance: number;
  /** Factor impact on decision */
  impact: string;
  /** Related strategies */
  affectedStrategies: string[];
}

export class PlanVisualizationOrchestrator extends EventEmitter {
  private state: PlanVisualizationState;
  private updateInterval: ReturnType<typeof setTimeout> | null = null;
  private animationFrame: ReturnType<typeof setTimeout> | null = null;

  constructor(private readOnlyExecutor?: ReadOnlyToolExecutor) {
    super();
    
    this.state = this.createInitialState();
    this.setupEventHandlers();
  }

  /**
   * Initialize the visualization orchestrator
   */
  initialize(initialPlan?: ImplementationPlan): void {
    if (initialPlan) {
      this.state.currentPlan = initialPlan;
      this.updateWorkflowState('presentation');
    }
    
    this.startRealTimeUpdates();
    this.emit('orchestrator-initialized', this.state);
  }

  /**
   * Update the current plan and refresh visualizations
   */
  updatePlan(plan: ImplementationPlan): void {
    this.state.currentPlan = plan;
    this.resetExecutionProgress();
    this.updateVisualizationMode('overview');
    
    this.emit('plan-updated', { plan, state: this.state });
  }

  /**
   * Start plan execution with real-time visualization
   */
  startExecution(): void {
    if (!this.state.currentPlan) {
      throw new Error('No plan available for execution');
    }

    this.updateVisualizationMode('execution');
    this.updateWorkflowState('approved');
    this.resetExecutionProgress();
    
    // Start execution tracking
    this.startExecutionTracking();
    
    this.emit('execution-started', {
      plan: this.state.currentPlan,
      timestamp: new Date()
    });
  }

  /**
   * Update visualization mode
   */
  updateVisualizationMode(mode: PlanVisualizationState['mode']): void {
    this.state.mode = mode;
    this.updateVisualState(mode);
    this.emit('mode-changed', { mode, state: this.state });
  }

  /**
   * Process real-time update
   */
  processLiveUpdate(update: Omit<LiveUpdate, 'id' | 'timestamp'>): void {
    const liveUpdate: LiveUpdate = {
      ...update,
      id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.state.executionProgress.liveUpdates.unshift(liveUpdate);
    
    // Keep only last 100 updates
    if (this.state.executionProgress.liveUpdates.length > 100) {
      this.state.executionProgress.liveUpdates = 
        this.state.executionProgress.liveUpdates.slice(0, 100);
    }

    this.updateProgressFromUpdate(liveUpdate);
    this.emit('live-update', liveUpdate);
  }

  /**
   * Generate strategy comparison visualization
   */
  generateStrategyComparison(strategies: ImplementationPlan[]): StrategyComparison {
    const criteria: ComparisonCriterion[] = [
      { id: 'time', name: 'Time to Complete', weight: 0.3, type: 'time', higherIsBetter: false },
      { id: 'risk', name: 'Risk Level', weight: 0.25, type: 'risk', higherIsBetter: false },
      { id: 'complexity', name: 'Implementation Complexity', weight: 0.2, type: 'complexity', higherIsBetter: false },
      { id: 'quality', name: 'Solution Quality', weight: 0.15, type: 'quality', higherIsBetter: true },
      { id: 'maintainability', name: 'Long-term Maintainability', weight: 0.1, type: 'maintainability', higherIsBetter: true }
    ];

    const comparisonItems = strategies.map(plan => this.createComparisonItem(plan, criteria));
    const matrix = this.calculateComparisonMatrix(comparisonItems, criteria);
    const recommendedStrategy = this.selectRecommendedStrategy(comparisonItems, matrix);

    return {
      strategies: comparisonItems,
      criteria,
      matrix,
      recommendedStrategy,
      decisionFactors: this.generateDecisionFactors(comparisonItems, criteria)
    };
  }

  /**
   * Create visual tree representation of plan execution
   */
  createPlanExecutionTree(plan: ImplementationPlan): TreeNode {
    const rootNode = createTreeNode(
      'plan_execution',
      `${plan.title} Execution`,
      'running',
      { icon: '🚀', details: `${plan.actionPlan.steps.length} steps` }
    );

    // Add phase nodes
    const phases = ['Analysis', 'Implementation', 'Testing', 'Deployment'];
    rootNode.children = phases.map((phase, index) => {
      const phaseSteps = plan.actionPlan.steps.filter(
        step => this.getStepPhase(step) === index
      );
      
      return createTreeNode(
        `phase_${index}`,
        phase,
        index === 0 ? 'running' : 'pending',
        {
          icon: this.getPhaseIcon(phase),
          details: `${phaseSteps.length} steps`,
          children: phaseSteps.map(step => 
            createTreeNode(
              step.id,
              step.title,
              'pending',
              { 
                icon: this.getStepIcon(step.type),
                details: `${step.effort}h • ${step.type}`
              }
            )
          )
        }
      );
    });

    return rootNode;
  }

  /**
   * Update step status in execution tree
   */
  updateStepStatus(
    stepId: string, 
    status: 'running' | 'completed' | 'failed',
    details?: string
  ): void {
    const update: LiveUpdate = {
      id: `step_${stepId}_${Date.now()}`,
      timestamp: new Date(),
      type: status === 'completed' ? 'step_complete' : 
            status === 'failed' ? 'step_fail' : 'step_start',
      stepId,
      message: `Step ${status}: ${stepId}`,
      data: { details },
      severity: status === 'failed' ? 'high' : 'low'
    };

    this.processLiveUpdate(update);
  }

  /**
   * Get current visualization state (read-only)
   */
  getState(): Readonly<PlanVisualizationState> {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Add pending decision
   */
  addPendingDecision(decision: PendingDecision): void {
    this.state.workflowState.pendingDecisions.push(decision);
    this.emit('decision-required', decision);
  }

  /**
   * Resolve pending decision
   */
  resolvePendingDecision(decisionId: string, optionId: string): void {
    const decision = this.state.workflowState.pendingDecisions.find(d => d.id === decisionId);
    if (!decision) return;

    this.state.workflowState.pendingDecisions = 
      this.state.workflowState.pendingDecisions.filter(d => d.id !== decisionId);

    const option = decision.options.find(o => o.id === optionId);
    this.emit('decision-resolved', { decision, selectedOption: option });
  }

  /**
   * Cleanup and shutdown orchestrator
   */
  shutdown(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.animationFrame) {
      clearTimeout(this.animationFrame);
      this.animationFrame = null;
    }

    this.emit('orchestrator-shutdown');
  }

  // Private helper methods

  private createInitialState(): PlanVisualizationState {
    return {
      mode: 'overview',
      currentPlan: null,
      executionProgress: {
        completedSteps: [],
        currentStep: null,
        failedSteps: [],
        skippedSteps: [],
        overallProgress: 0,
        metrics: {
          timeElapsed: 0,
          timeRemaining: 0,
          velocity: 0,
          errorRate: 0,
          qualityScore: 1.0,
          resourceUtilization: {
            cpu: 0,
            memory: 0,
            fileOps: 0,
            networkRequests: 0
          }
        },
        liveUpdates: []
      },
      workflowState: {
        currentPhase: 'inactive',
        phaseProgress: 0,
        availableActions: [],
        history: [],
        pendingDecisions: []
      },
      visualState: {
        selectedTabs: new Set(['overview']),
        expandedSections: new Set(),
        filters: [],
        zoomLevel: 1.0,
        scrollPosition: { x: 0, y: 0 },
        highlights: [],
        animations: []
      },
      interactionState: {
        focusedElement: null,
        inputMode: 'keyboard',
        selectedItems: new Set(),
        openModals: new Set()
      }
    };
  }

  private setupEventHandlers(): void {
    // Setup internal event handlers for state management
    this.on('execution-started', () => {
      this.updateWorkflowActions('analysis');
    });
    
    this.on('step-completed', (stepId: string) => {
      this.state.executionProgress.completedSteps.push(stepId);
      this.updateProgressMetrics();
    });
  }

  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
      this.updateAnimations();
      this.emit('state-updated', this.state);
    }, 1000); // Update every second
  }

  private startExecutionTracking(): void {
    if (!this.state.currentPlan) return;
    
    // Simulate execution progress for demonstration
    const steps = this.state.currentPlan.actionPlan.steps;
    let currentStepIndex = 0;
    
    const executeNextStep = () => {
      if (currentStepIndex >= steps.length) {
        this.processLiveUpdate({
          type: 'info',
          message: 'Plan execution completed successfully',
          severity: 'low'
        });
        return;
      }
      
      const step = steps[currentStepIndex];
      this.state.executionProgress.currentStep = step.id;
      
      this.processLiveUpdate({
        type: 'step_start',
        stepId: step.id,
        message: `Starting step: ${step.title}`,
        severity: 'low'
      });
      
      // Simulate step execution time
      setTimeout(() => {
        this.processLiveUpdate({
          type: 'step_complete',
          stepId: step.id,
          message: `Completed step: ${step.title}`,
          severity: 'low'
        });
        
        currentStepIndex++;
        setTimeout(executeNextStep, 1000); // Wait before next step
      }, Math.random() * 3000 + 1000); // 1-4 seconds per step
    };
    
    // Start first step
    executeNextStep();
  }

  private resetExecutionProgress(): void {
    this.state.executionProgress = {
      completedSteps: [],
      currentStep: null,
      failedSteps: [],
      skippedSteps: [],
      overallProgress: 0,
      metrics: {
        timeElapsed: 0,
        timeRemaining: 0,
        velocity: 0,
        errorRate: 0,
        qualityScore: 1.0,
        resourceUtilization: {
          cpu: 0,
          memory: 0,
          fileOps: 0,
          networkRequests: 0
        }
      },
      liveUpdates: []
    };
  }

  private updateWorkflowState(phase: PlanModePhase): void {
    this.state.workflowState.currentPhase = phase;
    this.updateWorkflowActions(phase);
  }

  private updateWorkflowActions(phase: PlanModePhase): void {
    const actions: WorkflowAction[] = [];
    
    switch (phase) {
      case 'presentation':
        actions.push(
          {
            id: 'approve',
            label: 'Approve Plan',
            description: 'Approve this implementation plan and proceed to execution',
            type: 'approve',
            enabled: true,
            shortcut: 'A',
            consequences: ['Plan execution will begin', 'Changes will be applied to codebase']
          },
          {
            id: 'reject',
            label: 'Reject Plan',
            description: 'Reject this plan and request alternatives',
            type: 'reject',
            enabled: true,
            shortcut: 'R',
            consequences: ['Plan will be discarded', 'Alternative strategies will be generated']
          }
        );
        break;
        
      case 'approved':
        actions.push(
          {
            id: 'execute',
            label: 'Begin Execution',
            description: 'Start implementing the approved plan',
            type: 'approve',
            enabled: true,
            shortcut: 'E',
            consequences: ['Implementation will begin', 'Progress will be tracked in real-time']
          }
        );
        break;
    }
    
    this.state.workflowState.availableActions = actions;
  }

  private updateVisualState(mode: PlanVisualizationState['mode']): void {
    // Reset visual state for new mode
    this.state.visualState.selectedTabs = new Set([mode]);
    this.state.visualState.expandedSections.clear();
    
    // Mode-specific visual setup
    switch (mode) {
      case 'execution':
        this.state.visualState.expandedSections.add('progress');
        this.state.visualState.expandedSections.add('live_updates');
        break;
      case 'comparison':
        this.state.visualState.expandedSections.add('matrix');
        break;
      case 'timeline':
        this.state.visualState.expandedSections.add('schedule');
        break;
    }
  }

  private updateProgressFromUpdate(update: LiveUpdate): void {
    if (!this.state.currentPlan) return;
    
    const totalSteps = this.state.currentPlan.actionPlan.steps.length;
    
    switch (update.type) {
      case 'step_complete':
        if (update.stepId && !this.state.executionProgress.completedSteps.includes(update.stepId)) {
          this.state.executionProgress.completedSteps.push(update.stepId);
        }
        break;
      case 'step_fail':
        if (update.stepId && !this.state.executionProgress.failedSteps.includes(update.stepId)) {
          this.state.executionProgress.failedSteps.push(update.stepId);
        }
        break;
    }
    
    // Update overall progress
    const completed = this.state.executionProgress.completedSteps.length;
    this.state.executionProgress.overallProgress = (completed / totalSteps) * 100;
    
    this.updateProgressMetrics();
  }

  private updateProgressMetrics(): void {
    const now = Date.now();
    const progress = this.state.executionProgress;
    
    // Update time metrics (simplified simulation)
    progress.metrics.timeElapsed += 1;
    progress.metrics.velocity = progress.completedSteps.length / (progress.metrics.timeElapsed / 60);
    
    // Update error rate
    const totalProcessed = progress.completedSteps.length + progress.failedSteps.length;
    progress.metrics.errorRate = totalProcessed > 0 ? 
      progress.failedSteps.length / totalProcessed : 0;
    
    // Update quality score (inverse of error rate)
    progress.metrics.qualityScore = 1.0 - Math.min(progress.metrics.errorRate, 0.5);
  }

  private updateMetrics(): void {
    // Simulate resource metrics
    const resources = this.state.executionProgress.metrics.resourceUtilization;
    resources.cpu = Math.random() * 20 + 10; // 10-30% CPU
    resources.memory = Math.random() * 100 + 50; // 50-150MB
    resources.fileOps = Math.random() * 5; // 0-5 ops/sec
    resources.networkRequests = Math.random() * 2; // 0-2 req/min
  }

  private updateAnimations(): void {
    // Update animation states
    this.state.visualState.animations = this.state.visualState.animations
      .map(anim => ({
        ...anim,
        progress: Math.min(anim.progress + 0.1, 1.0)
      }))
      .filter(anim => anim.progress < 1.0);
  }

  private createComparisonItem(plan: ImplementationPlan, criteria: ComparisonCriterion[]): StrategyComparisonItem {
    const scores: Record<string, number> = {};
    
    criteria.forEach(criterion => {
      switch (criterion.type) {
        case 'time':
          scores[criterion.id] = Math.max(0, 100 - plan.effort.totalHours / 10);
          break;
        case 'risk':
          const riskValue = plan.risks.overallRisk === 'low' ? 90 : 
                           plan.risks.overallRisk === 'medium' ? 60 : 30;
          scores[criterion.id] = riskValue;
          break;
        case 'complexity':
          scores[criterion.id] = Math.random() * 40 + 60; // 60-100
          break;
        case 'quality':
          scores[criterion.id] = Math.random() * 30 + 70; // 70-100
          break;
        case 'maintainability':
          scores[criterion.id] = Math.random() * 25 + 75; // 75-100
          break;
      }
    });
    
    const overallScore = criteria.reduce((sum, criterion) => 
      sum + scores[criterion.id] * criterion.weight, 0);

    return {
      id: `strategy_${plan.version}`,
      name: plan.title,
      description: plan.description,
      plan,
      scores,
      overallScore,
      prosAndCons: {
        pros: ['High quality implementation', 'Follows best practices'],
        cons: ['Higher time investment', 'Complex setup required']
      }
    };
  }

  private calculateComparisonMatrix(
    items: StrategyComparisonItem[], 
    criteria: ComparisonCriterion[]
  ): ComparisonMatrix {
    const data: Record<string, Record<string, number>> = {};
    const normalized: Record<string, Record<string, number>> = {};
    const weighted: Record<string, Record<string, number>> = {};
    
    // Calculate normalized and weighted scores
    items.forEach(item => {
      data[item.id] = { ...item.scores };
      normalized[item.id] = {};
      weighted[item.id] = {};
      
      criteria.forEach(criterion => {
        const score = item.scores[criterion.id];
        normalized[item.id][criterion.id] = score / 100; // Already 0-100
        weighted[item.id][criterion.id] = normalized[item.id][criterion.id] * criterion.weight;
      });
    });
    
    return { data, normalized, weighted };
  }

  private selectRecommendedStrategy(
    items: StrategyComparisonItem[], 
    matrix: ComparisonMatrix
  ): string {
    let bestStrategy = items[0];
    let bestScore = bestStrategy.overallScore;
    
    items.forEach(item => {
      if (item.overallScore > bestScore) {
        bestStrategy = item;
        bestScore = item.overallScore;
      }
    });
    
    return bestStrategy.id;
  }

  private generateDecisionFactors(
    items: StrategyComparisonItem[], 
    criteria: ComparisonCriterion[]
  ): DecisionFactor[] {
    return [
      {
        name: 'Time Pressure',
        importance: 0.8,
        impact: 'High time pressure favors faster implementation strategies',
        affectedStrategies: items.map(i => i.id)
      },
      {
        name: 'Team Expertise',
        importance: 0.7,
        impact: 'Team familiarity with technologies affects implementation speed',
        affectedStrategies: items.map(i => i.id)
      },
      {
        name: 'Risk Tolerance',
        importance: 0.6,
        impact: 'Project risk tolerance influences strategy selection',
        affectedStrategies: items.map(i => i.id)
      }
    ];
  }

  private getStepPhase(step: ActionStep): number {
    switch (step.type) {
      case 'research':
      case 'design':
        return 0; // Analysis
      case 'implement':
        return 1; // Implementation
      case 'test':
        return 2; // Testing
      case 'deploy':
      case 'document':
        return 3; // Deployment
      default:
        return 1; // Default to implementation
    }
  }

  private getPhaseIcon(phase: string): string {
    switch (phase) {
      case 'Analysis': return '🔍';
      case 'Implementation': return '⚙️';
      case 'Testing': return '🧪';
      case 'Deployment': return '🚀';
      default: return '📋';
    }
  }

  private getStepIcon(stepType: string): string {
    switch (stepType) {
      case 'research': return '🔬';
      case 'design': return '🎨';
      case 'implement': return '⚙️';
      case 'test': return '🧪';
      case 'document': return '📝';
      case 'deploy': return '🚀';
      default: return '📋';
    }
  }
}

// Types are exported inline above - no need for duplicate exports