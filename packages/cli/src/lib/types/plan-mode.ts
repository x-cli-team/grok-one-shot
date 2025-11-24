/**
 * Plan Mode Types and Interfaces
 * 
 * Defines the type system for Claude Code's signature Plan Mode feature.
 * Plan Mode enables safe codebase exploration and strategy formulation
 * before code execution.
 */

export interface PlanModeState {
  /** Whether plan mode is currently active */
  active: boolean;
  /** Current phase of plan mode */
  phase: PlanModePhase;
  /** Current implementation plan being developed */
  currentPlan: ImplementationPlan | null;
  /** Whether user has approved the current plan */
  userApproval: boolean;
  /** Exploration data collected during analysis phase */
  explorationData: ExplorationData | null;
  /** Start time of current plan mode session */
  sessionStartTime: Date | null;
}

export type PlanModePhase = 'inactive' | 'analysis' | 'strategy' | 'presentation' | 'approved' | 'rejected';

export interface ExplorationData {
  /** Files and directories explored */
  exploredPaths: string[];
  /** Project structure analysis */
  projectStructure: ProjectStructure;
  /** Key components identified */
  keyComponents: ComponentMap;
  /** Dependency relationships discovered */
  dependencies: DependencyGraph;
  /** Complexity assessment */
  complexity: ComplexityMetrics;
  /** Architecture patterns detected */
  architecturePatterns: ArchitecturePattern[];
  /** Insights gathered during exploration */
  insights: ExplorationInsight[];
}

export interface ProjectStructure {
  /** Root directory path */
  rootPath: string;
  /** Main language detected */
  primaryLanguage: string;
  /** Project type (e.g., 'react', 'node', 'python', etc.) */
  projectType: string;
  /** Entry points (main files) */
  entryPoints: string[];
  /** Configuration files found */
  configFiles: string[];
  /** Source directories */
  sourceDirectories: string[];
  /** Test directories */
  testDirectories: string[];
  /** Build/output directories */
  buildDirectories: string[];
  /** Total file count */
  totalFiles: number;
  /** Source lines of code estimate */
  slocEstimate: number;
}

export interface ComponentMap {
  /** Core components/modules */
  core: ComponentInfo[];
  /** Utility components/modules */
  utilities: ComponentInfo[];
  /** Test components/modules */
  tests: ComponentInfo[];
  /** Configuration components */
  config: ComponentInfo[];
  /** External dependencies */
  external: ComponentInfo[];
}

export interface ComponentInfo {
  /** Component/module name */
  name: string;
  /** File path */
  path: string;
  /** Component type */
  type: 'class' | 'function' | 'module' | 'config' | 'test' | 'utility';
  /** Brief description */
  description: string;
  /** Complexity rating (1-5) */
  complexity: number;
  /** Dependencies on other components */
  dependencies: string[];
  /** Components that depend on this one */
  dependents: string[];
  /** Lines of code */
  lineCount: number;
}

export interface DependencyGraph {
  /** Nodes representing components */
  nodes: DependencyNode[];
  /** Edges representing relationships */
  edges: DependencyEdge[];
  /** Circular dependencies detected */
  circularDependencies: string[][];
  /** Critical path components */
  criticalPath: string[];
}

export interface DependencyNode {
  /** Component identifier */
  id: string;
  /** Display name */
  name: string;
  /** Node type */
  type: 'internal' | 'external' | 'config';
  /** Importance rating (1-5) */
  importance: number;
}

export interface DependencyEdge {
  /** Source component */
  from: string;
  /** Target component */
  to: string;
  /** Relationship type */
  type: 'imports' | 'extends' | 'implements' | 'configures' | 'tests';
  /** Relationship strength (1-5) */
  strength: number;
}

export interface ComplexityMetrics {
  /** Overall complexity rating (1-10) */
  overall: number;
  /** Cyclomatic complexity average */
  cyclomatic: number;
  /** Cognitive complexity average */
  cognitive: number;
  /** Maintainability index */
  maintainability: number;
  /** Technical debt ratio */
  technicalDebt: number;
  /** Most complex components */
  complexComponents: string[];
}

export interface ArchitecturePattern {
  /** Pattern name */
  name: string;
  /** Pattern type */
  type: 'design' | 'architectural' | 'structural' | 'behavioral';
  /** Confidence level (0-1) */
  confidence: number;
  /** Components implementing this pattern */
  components: string[];
  /** Pattern description */
  description: string;
}

export interface ExplorationInsight {
  /** Insight type */
  type: 'warning' | 'opportunity' | 'recommendation' | 'observation';
  /** Insight title */
  title: string;
  /** Detailed description */
  description: string;
  /** Affected components */
  components: string[];
  /** Confidence level (0-1) */
  confidence: number;
  /** Priority level (1-5) */
  priority: number;
}

export interface ImplementationPlan {
  /** Plan title */
  title: string;
  /** Plan description */
  description: string;
  /** Implementation strategy */
  strategy: ImplementationStrategy;
  /** Detailed action plan */
  actionPlan: ActionPlan;
  /** Risk assessment */
  risks: RiskAssessment;
  /** Effort estimation */
  effort: EffortEstimate;
  /** Success criteria */
  successCriteria: string[];
  /** Plan creation timestamp */
  createdAt: Date;
  /** Plan version */
  version: string;
}

export interface ImplementationStrategy {
  /** High-level approach */
  approach: string;
  /** Key principles guiding the implementation */
  principles: string[];
  /** Technology stack recommendations */
  techStack: TechStackRecommendation[];
  /** Architecture decisions */
  architectureDecisions: ArchitectureDecision[];
  /** Integration points */
  integrationPoints: IntegrationPoint[];
}

export interface TechStackRecommendation {
  /** Technology category */
  category: string;
  /** Recommended technology */
  technology: string;
  /** Justification for choice */
  justification: string;
  /** Alternative options */
  alternatives: string[];
}

export interface ArchitectureDecision {
  /** Decision title */
  title: string;
  /** Problem being solved */
  problem: string;
  /** Chosen solution */
  solution: string;
  /** Reasoning behind decision */
  reasoning: string;
  /** Trade-offs considered */
  tradeoffs: string[];
}

export interface IntegrationPoint {
  /** Integration point name */
  name: string;
  /** Type of integration */
  type: 'api' | 'database' | 'service' | 'library' | 'framework';
  /** Description */
  description: string;
  /** Implementation approach */
  approach: string;
  /** Potential challenges */
  challenges: string[];
}

export interface ActionPlan {
  /** Ordered list of implementation steps */
  steps: ActionStep[];
  /** Parallel tracks that can be worked on simultaneously */
  parallelTracks: ActionTrack[];
  /** Critical milestones */
  milestones: Milestone[];
  /** Dependencies between steps */
  dependencies: StepDependency[];
}

export interface ActionStep {
  /** Unique step identifier */
  id: string;
  /** Step title */
  title: string;
  /** Detailed description */
  description: string;
  /** Type of step */
  type: 'research' | 'design' | 'implement' | 'test' | 'document' | 'deploy';
  /** Estimated effort in hours */
  effort: number;
  /** Required skills/expertise */
  skills: string[];
  /** Files that will be created/modified */
  affectedFiles: string[];
  /** Acceptance criteria */
  acceptanceCriteria: string[];
  /** Order/sequence number */
  order: number;
}

export interface ActionTrack {
  /** Track name */
  name: string;
  /** Track description */
  description: string;
  /** Steps in this track */
  steps: string[]; // Step IDs
  /** Estimated duration */
  duration: number;
  /** Required resources */
  resources: string[];
}

export interface Milestone {
  /** Milestone name */
  name: string;
  /** Description */
  description: string;
  /** Steps that must be completed */
  requiredSteps: string[]; // Step IDs
  /** Deliverables */
  deliverables: string[];
  /** Success criteria */
  successCriteria: string[];
}

export interface StepDependency {
  /** Step that has the dependency */
  stepId: string;
  /** Step that must be completed first */
  dependsOnStepId: string;
  /** Type of dependency */
  type: 'blocking' | 'preference' | 'information';
  /** Reason for dependency */
  reason: string;
}

export interface RiskAssessment {
  /** Overall risk level */
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  /** Identified risks */
  risks: Risk[];
  /** Mitigation strategies */
  mitigations: MitigationStrategy[];
  /** Contingency plans */
  contingencies: ContingencyPlan[];
}

export interface Risk {
  /** Risk identifier */
  id: string;
  /** Risk title */
  title: string;
  /** Risk description */
  description: string;
  /** Risk category */
  category: 'technical' | 'business' | 'timeline' | 'resource' | 'quality';
  /** Probability (0-1) */
  probability: number;
  /** Impact severity (1-5) */
  impact: number;
  /** Risk score (probability * impact) */
  score: number;
  /** Affected components */
  affectedComponents: string[];
}

export interface MitigationStrategy {
  /** Risk being mitigated */
  riskId: string;
  /** Mitigation approach */
  approach: string;
  /** Specific actions to take */
  actions: string[];
  /** Effectiveness rating (0-1) */
  effectiveness: number;
  /** Cost of mitigation */
  cost: 'low' | 'medium' | 'high';
}

export interface ContingencyPlan {
  /** Trigger conditions */
  triggers: string[];
  /** Alternative approach */
  alternativeApproach: string;
  /** Fallback actions */
  fallbackActions: string[];
  /** Resource requirements */
  resourceRequirements: string[];
}

export interface EffortEstimate {
  /** Total estimated hours */
  totalHours: number;
  /** Breakdown by step type */
  breakdownByType: Record<string, number>;
  /** Breakdown by track */
  breakdownByTrack: Record<string, number>;
  /** Confidence level in estimate (0-1) */
  confidence: number;
  /** Factors affecting estimate */
  factors: EstimationFactor[];
  /** Timeline projection */
  timeline: TimelineProjection;
}

export interface EstimationFactor {
  /** Factor name */
  name: string;
  /** Impact on estimate */
  impact: 'increases' | 'decreases' | 'neutral';
  /** Multiplier effect */
  multiplier: number;
  /** Description */
  description: string;
}

export interface TimelineProjection {
  /** Optimistic completion time */
  optimistic: string;
  /** Most likely completion time */
  mostLikely: string;
  /** Pessimistic completion time */
  pessimistic: string;
  /** Recommended start date */
  recommendedStart: string;
  /** Critical path duration */
  criticalPath: string;
}

export interface PlanModeSettings {
  /** Maximum exploration depth */
  maxExplorationDepth: number;
  /** File size limit for analysis (bytes) */
  maxFileSize: number;
  /** Timeout for plan generation (ms) */
  planGenerationTimeout: number;
  /** Enable detailed logging */
  enableDetailedLogging: boolean;
  /** Automatically save plans */
  autoSavePlans: boolean;
  /** Plan save directory */
  planSaveDirectory: string;
}

// Event types for plan mode state changes
export interface PlanModeEvents {
  'plan-mode-activated': { timestamp: Date };
  'plan-mode-deactivated': { timestamp: Date; reason: string };
  'phase-changed': { from: PlanModePhase; to: PlanModePhase; timestamp: Date };
  'exploration-progress': { progress: number; currentPath: string };
  'plan-generated': { plan: ImplementationPlan; timestamp: Date };
  'plan-approved': { plan: ImplementationPlan; timestamp: Date };
  'plan-rejected': { plan: ImplementationPlan; reason: string; timestamp: Date };
  'execution-started': { plan: ImplementationPlan; timestamp: Date };
}

// Plan mode activation options
export interface PlanModeActivationOptions {
  /** Initial task/request to analyze */
  initialTask?: string;
  /** Specific paths to focus exploration on */
  focusPaths?: string[];
  /** Maximum time to spend in exploration phase */
  explorationTimeLimit?: number;
  /** Skip confirmation before entering plan mode */
  skipConfirmation?: boolean;
  /** Plan mode session name */
  sessionName?: string;
}