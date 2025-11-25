/**
 * Autonomous Task Executor
 * 
 * Orchestrates complex multi-step tasks by combining VSE semantic search,
 * codebase intelligence, and automated execution workflows.
 * 
 * This provides Claude Code's autonomous capabilities in the terminal.
 */

import { VectorSearchEngine } from './vector-search-engine.js';
import { CodebaseExplorer } from './codebase-explorer.js';
import { MultiFileEditorTool } from '../tools/advanced/multi-file-editor.js';
import { ASTParserTool } from '../tools/intelligence/ast-parser.js';
import { SymbolSearchTool } from '../tools/intelligence/symbol-search.js';
import { DependencyAnalyzerTool } from '../tools/intelligence/dependency-analyzer.js';
import { SemanticPlanner, SemanticContext } from './semantic-planner.js';
import { EnhancedErrorHandler } from './enhanced-error-handler.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TaskStep {
  id: string;
  type: 'search' | 'analyze' | 'edit' | 'validate' | 'test';
  description: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

export interface SubTask {
  id: string;
  description: string;
  type: string;
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  estimatedEffort: number;
  targetFile?: string;
}

export interface GoalAnalysis {
  complexity: 'low' | 'medium' | 'high';
  estimatedSteps: number;
}

export interface FileTransaction {
  filePath: string;
  originalContent: string;
  newContent: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
}

export interface Transaction {
  id: string;
  steps: FileTransaction[];
  status: 'pending' | 'active' | 'committed' | 'rolled_back';
  createdAt: number;
  committedAt?: number;
  rolledBackAt?: number;
}

export interface TaskPlan {
  id: string;
  goal: string;
  description: string;
  steps: TaskStep[];
  context: {
    rootPath: string;
    affectedFiles: string[];
    relatedSymbols: string[];
    dependencies: string[];
  };
  status: 'planned' | 'executing' | 'completed' | 'failed';
  progress: number; // 0-100
  startTime?: number;
  endTime?: number;
}

export interface ExecutionContext {
  searchEngine: VectorSearchEngine;
  codebaseExplorer: CodebaseExplorer;
  currentFiles: Set<string>;
  symbolCache: Map<string, any>;
  validationResults: Map<string, boolean>;
  // Enhanced context awareness
  stepMemory: Map<string, any>; // Memory between steps
  fileSnapshots: Map<string, string>; // File content snapshots for rollback
  dependencyGraph: Map<string, string[]>; // File dependencies
  learnedPatterns: Map<string, any>; // Learned patterns from successful operations
}

export interface AutonomousTaskConfig {
  rootPath: string;
  maxSteps: number;
  timeoutMs: number;
  validationEnabled: boolean;
  backupEnabled: boolean;
}

/**
 * Transaction Manager for atomic multi-file operations
 */
export class TransactionManager {
  private transactions = new Map<string, Transaction>();
  private backupDir: string;

  constructor(backupDir = '/tmp/autonomous-backups') {
    this.backupDir = backupDir;
  }

  /**
   * Start a new transaction
   */
  async beginTransaction(transactionId: string): Promise<void> {
    const transaction: Transaction = {
      id: transactionId,
      steps: [],
      status: 'active',
      createdAt: Date.now()
    };
    this.transactions.set(transactionId, transaction);
  }

  /**
   * Add a file operation to the transaction
   */
  async addFileOperation(transactionId: string, filePath: string, newContent: string, operation: 'create' | 'update' | 'delete' = 'update'): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || transaction.status !== 'active') {
      throw new Error(`Transaction ${transactionId} not found or not active`);
    }

    // Read original content for rollback
    let originalContent = '';
    try {
      if (operation !== 'create') {
        originalContent = await fs.readFile(filePath, 'utf-8');
      }
    } catch (error) {
      if (operation === 'update') {
        throw new Error(`Failed to read original content of ${filePath}: ${error}`);
      }
    }

    const fileTransaction: FileTransaction = {
      filePath,
      originalContent,
      newContent,
      operation,
      timestamp: Date.now()
    };

    transaction.steps.push(fileTransaction);
  }

  /**
   * Commit the transaction (apply all changes)
   */
  async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction || transaction.status !== 'active') {
      throw new Error(`Transaction ${transactionId} not found or not active`);
    }

    try {
      // Apply all file changes
      for (const step of transaction.steps) {
        await this.applyFileTransaction(step);
      }

      transaction.status = 'committed';
      transaction.committedAt = Date.now();

    } catch (error) {
      // If commit fails, rollback automatically
      await this.rollbackTransaction(transactionId);
      throw error;
    }
  }

  /**
   * Rollback the transaction (restore original state)
   */
  async rollbackTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (transaction.status === 'committed') {
      // Rollback committed transaction
      for (const step of transaction.steps.reverse()) {
        await this.rollbackFileTransaction(step);
      }
    }

    transaction.status = 'rolled_back';
    transaction.rolledBackAt = Date.now();
  }

  /**
   * Apply a single file transaction
   */
  private async applyFileTransaction(step: FileTransaction): Promise<void> {
    const dir = path.dirname(step.filePath);
    await fs.mkdir(dir, { recursive: true });

    if (step.operation === 'delete') {
      await fs.unlink(step.filePath);
    } else {
      await fs.writeFile(step.filePath, step.newContent, 'utf-8');
    }
  }

  /**
   * Rollback a single file transaction
   */
  private async rollbackFileTransaction(step: FileTransaction): Promise<void> {
    if (step.operation === 'create') {
      // Remove created file
      try {
        await fs.unlink(step.filePath);
      } catch {
        // File might not exist, ignore
      }
    } else if (step.operation === 'update') {
      // Restore original content
      await fs.writeFile(step.filePath, step.originalContent, 'utf-8');
    } else if (step.operation === 'delete') {
      // Restore deleted file
      const dir = path.dirname(step.filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(step.filePath, step.originalContent, 'utf-8');
    }
  }

  /**
   * Get transaction status
   */
  getTransaction(transactionId: string): Transaction | undefined {
    return this.transactions.get(transactionId);
  }
}

/**
 * Autonomous Task Executor for complex multi-step operations
 */
export class AutonomousExecutor {
  private config: AutonomousTaskConfig;
  private vectorSearch: VectorSearchEngine;
  private codebaseExplorer: CodebaseExplorer;
  private multiFileEditor: MultiFileEditorTool;
  private astParser: ASTParserTool;
  private symbolSearch: SymbolSearchTool;
  private dependencyAnalyzer: DependencyAnalyzerTool;
  private transactionManager: TransactionManager;
  private semanticPlanner: SemanticPlanner;
  private errorHandler: EnhancedErrorHandler;

  private activeTasks = new Map<string, TaskPlan>();
  private executionHistory: TaskPlan[] = [];

  constructor(config: Partial<AutonomousTaskConfig> = {}) {
    this.config = {
      rootPath: process.cwd(),
      maxSteps: 50,
      timeoutMs: 5 * 60 * 1000, // 5 minutes
      validationEnabled: true,
      backupEnabled: true,
      ...config
    };

    // Initialize tools
    this.vectorSearch = new VectorSearchEngine({
      rootPath: this.config.rootPath,
      cacheEnabled: true,
      embeddingProvider: 'openai',
      maxMemoryMB: 500
    });

    this.codebaseExplorer = new CodebaseExplorer({
      maxExplorationDepth: 10,
      maxFileSize: 1024 * 1024,
      planGenerationTimeout: 30000,
      enableDetailedLogging: false,
      autoSavePlans: false,
      planSaveDirectory: '/tmp'
    });

    this.multiFileEditor = new MultiFileEditorTool();
    this.astParser = new ASTParserTool();
    this.symbolSearch = new SymbolSearchTool();
    this.dependencyAnalyzer = new DependencyAnalyzerTool();
    this.transactionManager = new TransactionManager();
    this.semanticPlanner = new SemanticPlanner(this.vectorSearch);
    this.errorHandler = new EnhancedErrorHandler();
  }

  /**
   * Plan and execute a complex task autonomously
   */
  async executeTask(goal: string, description: string): Promise<TaskPlan> {
    console.log(`🤖 Autonomous Executor: Planning task - ${goal}`);
    
    const taskId = this.generateTaskId();
    const startTime = Date.now();

    try {
      // Step 1: Analyze the goal and create execution plan
      const plan = await this.createExecutionPlan(taskId, goal, description);
      this.activeTasks.set(taskId, plan);

      console.log(`📋 Task Plan Created: ${plan.steps.length} steps identified`);

      // Step 2: Execute the plan step by step
      const context = await this.initializeExecutionContext();

      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];

        try {
          console.log(`⚙️  Step ${i + 1}/${plan.steps.length}: ${step.description}`);

          step.status = 'running';
          plan.status = 'executing';

          const stepResult = await this.executeStep(step, context);

          step.outputs = stepResult;
          step.status = 'completed';
          step.duration = Date.now() - startTime;

          console.log(`✅ Step ${i + 1} completed (${plan.progress}% complete)`);

        } catch (error) {
          step.status = 'failed';
          const stepError = error instanceof Error ? error : new Error(String(error));
          step.error = stepError.message;

          console.error(`❌ Step ${i + 1} failed:`, step.error);

          // Use enhanced error analysis
          await this.updateTaskProgress(plan, context);

          // Attempt recovery
          const recovered = await this.attemptRecovery(step, context);
          if (!recovered) {
            plan.status = 'failed';
            break;
          }
        }
      }

      // Step 3: Finalize execution
      if (plan.status !== 'failed') {
        plan.status = 'completed';
        plan.progress = 100;
        
        // Run validation if enabled
        if (this.config.validationEnabled) {
          await this.validateExecution(plan, context);
        }
      }

      plan.endTime = Date.now();
      this.executionHistory.push(plan);
      this.activeTasks.delete(taskId);

      const duration = plan.endTime - startTime;
      console.log(`🎯 Task ${plan.status}: ${goal} (${duration}ms)`);

      return plan;

    } catch (error) {
      console.error('🚨 Autonomous execution failed:', error);
      
      const failedPlan: TaskPlan = {
        id: taskId,
        goal,
        description,
        steps: [],
        context: {
          rootPath: this.config.rootPath,
          affectedFiles: [],
          relatedSymbols: [],
          dependencies: []
        },
        status: 'failed',
        progress: 0,
        startTime,
        endTime: Date.now()
      };

      this.executionHistory.push(failedPlan);
      return failedPlan;
    }
  }

  /**
   * Create an execution plan using semantic planning
   */
  private async createExecutionPlan(taskId: string, goal: string, description: string): Promise<TaskPlan> {
    console.log(`📋 Creating execution plan for: ${goal}`);

    // Create semantic context
    const semanticContext: SemanticContext = {
      userGoal: goal,
      projectContext: new Map([
        ['rootPath', this.config.rootPath],
        ['description', description]
      ]),
      previousOperations: [],
      learnedPatterns: new Map()
    };

    // Parse intent using semantic planner
    const intentAnalysis = await this.semanticPlanner.parseIntent(goal, description, semanticContext);

    console.log(`🎯 Detected intent: ${intentAnalysis.intent} (confidence: ${(intentAnalysis.confidence * 100).toFixed(1)}%)`);
    console.log(`🔧 Suggested tools: ${intentAnalysis.suggestedTools.join(', ')}`);

    // Map intent to operations
    const operations = await this.semanticPlanner.mapToOperations(intentAnalysis, semanticContext);

    // Convert operations to executable steps
    const steps = await this.semanticPlanner.operationsToSteps(operations, semanticContext);

    // Build context object
    const context = {
      rootPath: this.config.rootPath,
      affectedFiles: intentAnalysis.entities.get('affected_files') || [],
      relatedSymbols: intentAnalysis.entities.get('related_symbols') || [],
      dependencies: [],
      intent: intentAnalysis.intent,
      confidence: intentAnalysis.confidence,
      suggestedTools: intentAnalysis.suggestedTools
    };

    // Analyze dependencies for affected files
    if (context.affectedFiles.length > 0) {
      const depResult = await this.dependencyAnalyzer.execute({
        rootPath: this.config.rootPath,
        filePatterns: context.affectedFiles.map((f: string) => `**/${f.split('/').pop()}`),
        detectCircular: true
      });

      if (depResult.success && depResult.output) {
        const parsed = JSON.parse(depResult.output);
        context.dependencies = parsed.result?.dependencies?.map((d: any) => d.name) || [];
      }
    }

    return {
      id: taskId,
      goal,
      description,
      steps,
      context,
      status: 'planned',
      progress: 0,
      startTime: Date.now()
    };
  }

  /**
   * Generate execution steps based on advanced goal analysis and task decomposition
   */
  private async generateExecutionSteps(goal: string, description: string, context: any): Promise<TaskStep[]> {
    const steps: TaskStep[] = [];

    // Advanced planning: Decompose complex goals into manageable subtasks
    const decomposedTasks = await this.decomposeGoal(goal, description, context);

    for (const subTask of decomposedTasks) {
      const taskSteps = await this.generateStepsForSubTask(subTask, context);
      steps.push(...taskSteps);
    }

    // Add validation and testing steps
    if (steps.length > 0) {
      steps.push({
        id: 'final_validation',
        type: 'validate',
        description: 'Perform comprehensive validation of all changes',
        inputs: { allSteps: steps.map(s => s.id) },
        status: 'pending'
      });

      steps.push({
        id: 'run_tests',
        type: 'test',
        description: 'Execute relevant tests to ensure functionality',
        inputs: { affectedFiles: context.affectedFiles },
        status: 'pending'
      });
    }

    return steps;
  }

  /**
   * Decompose complex goals into manageable subtasks using AI planning
   */
  private async decomposeGoal(goal: string, description: string, context: any): Promise<SubTask[]> {
    const subTasks: SubTask[] = [];

    // Use semantic analysis to break down the goal
    const goalAnalysis = await this.analyzeGoalComplexity(goal, description);

    if (goalAnalysis.complexity === 'high') {
      // For complex goals, use iterative decomposition
      const initialSubTasks = this.generateInitialSubTasks(goal, description, context);
      subTasks.push(...initialSubTasks);

      // Refine subtasks based on codebase analysis
      for (const subTask of subTasks) {
        const refinedSubTasks = await this.refineSubTask(subTask, context);
        if (refinedSubTasks.length > 1) {
          // Replace the original subtask with refined ones
          const index = subTasks.indexOf(subTask);
          subTasks.splice(index, 1, ...refinedSubTasks);
        }
      }
    } else {
      // For simpler goals, use direct task generation
      subTasks.push({
        id: 'main_task',
        description: goal,
        type: this.inferTaskType(goal),
        complexity: goalAnalysis.complexity,
        dependencies: [],
        estimatedEffort: goalAnalysis.estimatedSteps
      });
    }

    return subTasks;
  }

  /**
   * Analyze goal complexity to determine planning approach
   */
  private async analyzeGoalComplexity(goal: string, description: string): Promise<GoalAnalysis> {
    const keywords = {
      high: ['refactor', 'migrate', 'redesign', 'architect', 'system', 'framework'],
      medium: ['implement', 'add', 'create', 'build', 'develop', 'feature'],
      low: ['fix', 'update', 'change', 'modify', 'improve', 'optimize']
    };

    const goal_lower = goal.toLowerCase();
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    let estimatedSteps = 3;

    if (keywords.high.some(k => goal_lower.includes(k))) {
      complexity = 'high';
      estimatedSteps = 8;
    } else if (keywords.low.some(k => goal_lower.includes(k))) {
      complexity = 'low';
      estimatedSteps = 2;
    }

    // Adjust based on description length and specificity
    if (description.length < 50) {
      complexity = 'low';
      estimatedSteps = Math.max(1, estimatedSteps - 1);
    } else if (description.length > 200) {
      complexity = 'high';
      estimatedSteps = Math.min(15, estimatedSteps + 3);
    }

    return { complexity, estimatedSteps };
  }

  /**
   * Generate initial subtasks for complex goals
   */
  private generateInitialSubTasks(goal: string, description: string, context: any): SubTask[] {
    const subTasks: SubTask[] = [];

    // Analysis phase
    subTasks.push({
      id: 'analysis',
      description: 'Analyze current codebase and requirements',
      type: 'analysis',
      complexity: 'low',
      dependencies: [],
      estimatedEffort: 2
    });

    // Planning phase
    subTasks.push({
      id: 'planning',
      description: 'Create detailed implementation plan',
      type: 'planning',
      complexity: 'medium',
      dependencies: ['analysis'],
      estimatedEffort: 3
    });

    // Implementation phase
    subTasks.push({
      id: 'implementation',
      description: 'Execute the planned changes',
      type: 'implementation',
      complexity: 'high',
      dependencies: ['planning'],
      estimatedEffort: 5
    });

    // Validation phase
    subTasks.push({
      id: 'validation',
      description: 'Validate implementation and test results',
      type: 'validation',
      complexity: 'medium',
      dependencies: ['implementation'],
      estimatedEffort: 2
    });

    return subTasks;
  }

  /**
   * Refine subtasks based on codebase context
   */
  private async refineSubTask(subTask: SubTask, context: any): Promise<SubTask[]> {
    if (subTask.type === 'implementation') {
      // Break implementation into file-specific tasks
      const fileTasks: SubTask[] = [];

      for (const file of context.affectedFiles.slice(0, 5)) { // Limit to 5 files
        fileTasks.push({
          id: `implement_${file.replace(/[^a-zA-Z0-9]/g, '_')}`,
          description: `Implement changes in ${file}`,
          type: 'implementation',
          complexity: 'medium',
          dependencies: [subTask.id],
          estimatedEffort: 2,
          targetFile: file
        });
      }

      return fileTasks.length > 0 ? fileTasks : [subTask];
    }

    return [subTask];
  }

  /**
   * Generate execution steps for a specific subtask
   */
  private async generateStepsForSubTask(subTask: SubTask, context: any): Promise<TaskStep[]> {
    const steps: TaskStep[] = [];

    switch (subTask.type) {
      case 'analysis':
        steps.push(
          {
            id: `${subTask.id}_search`,
            type: 'search',
            description: 'Search for relevant code patterns and examples',
            inputs: { query: subTask.description },
            status: 'pending'
          },
          {
            id: `${subTask.id}_analyze`,
            type: 'analyze',
            description: 'Analyze code structure and dependencies',
            inputs: { files: context.affectedFiles },
            status: 'pending'
          }
        );
        break;

      case 'planning':
        steps.push(
          {
            id: `${subTask.id}_design`,
            type: 'analyze',
            description: 'Design the implementation approach',
            inputs: { symbols: context.relatedSymbols },
            status: 'pending'
          },
          {
            id: `${subTask.id}_dependencies`,
            type: 'analyze',
            description: 'Identify and plan dependency updates',
            inputs: { dependencies: context.dependencies },
            status: 'pending'
          }
        );
        break;

      case 'implementation':
        if (subTask.targetFile) {
          steps.push({
            id: `${subTask.id}_edit`,
            type: 'edit',
            description: `Apply changes to ${subTask.targetFile}`,
            inputs: { file: subTask.targetFile, goal: subTask.description },
            status: 'pending'
          });
        } else {
          steps.push({
            id: `${subTask.id}_edit`,
            type: 'edit',
            description: 'Apply implementation changes',
            inputs: { files: context.affectedFiles, goal: subTask.description },
            status: 'pending'
          });
        }
        break;

      case 'validation':
        steps.push(
          {
            id: `${subTask.id}_syntax`,
            type: 'validate',
            description: 'Check syntax and compilation',
            inputs: { files: context.affectedFiles },
            status: 'pending'
          },
          {
            id: `${subTask.id}_logic`,
            type: 'validate',
            description: 'Validate logic and functionality',
            inputs: {},
            status: 'pending'
          }
        );
        break;
    }

    return steps;
  }

  /**
   * Infer task type from goal description
   */
  private inferTaskType(goal: string): string {
    const goal_lower = goal.toLowerCase();

    if (goal_lower.includes('refactor') || goal_lower.includes('redesign')) {
      return 'refactoring';
    } else if (goal_lower.includes('add') || goal_lower.includes('implement') || goal_lower.includes('create')) {
      return 'implementation';
    } else if (goal_lower.includes('fix') || goal_lower.includes('bug') || goal_lower.includes('issue')) {
      return 'bug_fix';
    } else if (goal_lower.includes('test') || goal_lower.includes('validate')) {
      return 'testing';
    } else {
      return 'general';
    }
  }

  /**
   * Initialize execution context with tools and state
   */
  private async initializeExecutionContext(): Promise<ExecutionContext> {
    // Ensure VSE is indexed
    if (!this.vectorSearch.getStats().totalSymbols) {
      console.log('🔍 Initializing semantic search index...');
      await this.vectorSearch.buildIndex();
    }

    return {
      searchEngine: this.vectorSearch,
      codebaseExplorer: this.codebaseExplorer,
      currentFiles: new Set(),
      symbolCache: new Map(),
      validationResults: new Map(),
      stepMemory: new Map(),
      fileSnapshots: new Map(),
      dependencyGraph: new Map(),
      learnedPatterns: new Map()
    };
  }

  /**
   * Execute a single step in the task plan
   */
  private async executeStep(step: TaskStep, context: ExecutionContext): Promise<any> {
    const stepStart = Date.now();

    try {
      switch (step.type) {
        case 'search':
          return await this.executeSearchStep(step, context);
        case 'analyze':
          return await this.executeAnalyzeStep(step, context);
        case 'edit':
          return await this.executeEditStep(step, context);
        case 'validate':
          return await this.executeValidateStep(step, context);
        case 'test':
          return await this.executeTestStep(step, context);
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
    } finally {
      step.duration = Date.now() - stepStart;
    }
  }

  private async executeSearchStep(step: TaskStep, context: ExecutionContext): Promise<any> {
    const query = step.inputs.query || step.description;
    const results = await context.searchEngine.semanticSearch(query, 10);
    
    // Update context with search results
    for (const result of results) {
      context.currentFiles.add(result.filePath);
      context.symbolCache.set(result.symbol.id, result.symbol);
    }

    return { results, fileCount: results.length };
  }

  private async executeAnalyzeStep(step: TaskStep, context: ExecutionContext): Promise<any> {
    const files = step.inputs.files || Array.from(context.currentFiles);
    const analysisResults: any[] = [];

    for (const filePath of files) {
      try {
        const parseResult = await this.astParser.execute({
          filePath,
          includeSymbols: true,
          includeImports: true
        });

        if (parseResult.success && parseResult.output) {
          analysisResults.push(JSON.parse(parseResult.output));
        }
      } catch (error) {
        console.warn(`Analysis failed for ${filePath}:`, error);
      }
    }

    return { analyses: analysisResults, fileCount: files.length };
  }

  private async executeEditStep(step: TaskStep, context: ExecutionContext): Promise<any> {
    const transactionId = `txn_${step.id}_${Date.now()}`;

    try {
      // Begin transaction for atomic operation
      await this.transactionManager.beginTransaction(transactionId);

      console.log(`📝 Edit step: ${step.description}`);

      let filesModified: string[] = [];

      if (step.inputs.file) {
        // Single file operation
        const filePath = step.inputs.file;
        const goal = step.inputs.goal || step.description;

        // Generate changes using MultiFileEditorTool or direct editing
        const newContent = await this.generateFileChanges(filePath, goal, context);

        await this.transactionManager.addFileOperation(transactionId, filePath, newContent, 'update');
        filesModified.push(filePath);

      } else if (step.inputs.files) {
        // Multi-file operation
        const files = step.inputs.files;
        const goal = step.inputs.goal || step.description;

        for (const filePath of files) {
          try {
            const newContent = await this.generateFileChanges(filePath, goal, context);
            await this.transactionManager.addFileOperation(transactionId, filePath, newContent, 'update');
            filesModified.push(filePath);
          } catch (error) {
            console.warn(`Failed to process ${filePath}:`, error);
          }
        }
      }

      // Store transaction info in step memory for potential rollback
      context.stepMemory.set(step.id, { transactionId, filesModified });

      // Commit the transaction
      await this.transactionManager.commitTransaction(transactionId);

      // Update file snapshots for rollback capability
      for (const file of filesModified) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          context.fileSnapshots.set(file, content);
        } catch {
          // Ignore snapshot errors
        }
      }

      return {
        message: 'Edit step executed successfully',
        filesModified,
        transactionId
      };

    } catch (error) {
      // Rollback on failure
      try {
        await this.transactionManager.rollbackTransaction(transactionId);
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }

      throw new Error(`Edit step failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeValidateStep(step: TaskStep, context: ExecutionContext): Promise<any> {
    // Placeholder for validation
    // In practice, this would run tests, check compilation, etc.
    console.log(`✅ Validation step: ${step.description}`);
    
    return { 
      valid: true,
      checks: ['compilation', 'tests', 'linting'],
      message: 'Validation passed (placeholder)'
    };
  }

  private async executeTestStep(step: TaskStep, context: ExecutionContext): Promise<any> {
    // Placeholder for test execution
    console.log(`🧪 Test step: ${step.description}`);
    
    return { 
      passed: true,
      testCount: 5,
      message: 'Tests passed (placeholder)'
    };
  }

  private async attemptRecovery(step: TaskStep, context: ExecutionContext): Promise<boolean> {
    console.log(`🔄 Attempting recovery for failed step: ${step.description}`);

    // Enhanced recovery strategy with rollback and retry
    try {
      // First, check if we have transaction info for rollback
      const stepMemory = context.stepMemory.get(step.id);
      if (stepMemory?.transactionId) {
        console.log(`🔙 Rolling back transaction ${stepMemory.transactionId}`);
        await this.transactionManager.rollbackTransaction(stepMemory.transactionId);

        // Clear file snapshots after rollback
        if (stepMemory.filesModified) {
          for (const file of stepMemory.filesModified) {
            context.fileSnapshots.delete(file);
          }
        }
      }

      // Retry the step with modified inputs (learning from failure)
      step.status = 'running';
      step.inputs.retryAttempt = (step.inputs.retryAttempt || 0) + 1;

      // Add context from previous failure to help with retry
      step.inputs.previousError = step.error;
      step.inputs.recoveryAttempt = true;

      await this.executeStep(step, context);
      step.status = 'completed';

      console.log(`✅ Recovery successful for step: ${step.description}`);
      return true;

    } catch (retryError) {
      console.log(`❌ Recovery failed for step: ${step.description}`);
      step.status = 'failed';
      step.error = `Recovery failed: ${retryError instanceof Error ? retryError.message : String(retryError)}`;
      return false;
    }
  }

  private async validateExecution(plan: TaskPlan, context: ExecutionContext): Promise<void> {
    console.log('🔍 Running final validation...');
    
    // Validate that all files still compile/parse correctly
    for (const filePath of context.currentFiles) {
      try {
        const result = await this.astParser.execute({ filePath, includeSymbols: false });
        context.validationResults.set(filePath, result.success);
      } catch {
        context.validationResults.set(filePath, false);
      }
    }
  }

  /**
   * Get current task status
   */
  getActiveTask(taskId: string): TaskPlan | undefined {
    return this.activeTasks.get(taskId);
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): TaskPlan[] {
    return [...this.executionHistory];
  }

  /**
   * Cancel active task
   */
  cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.endTime = Date.now();

      // Attempt to rollback any active transactions
      for (const step of task.steps) {
        if (step.status === 'running' || step.status === 'completed') {
          // Note: In a full implementation, we'd track transaction IDs per step
          // For now, this is a placeholder for rollback on cancel
        }
      }

      this.executionHistory.push(task);
      this.activeTasks.delete(taskId);
      return true;
    }
    return false;
  }

  /**
   * Save task state for persistence and recovery
   */
  private async saveTaskState(task: TaskPlan): Promise<void> {
    try {
      const stateFile = path.join(this.config.rootPath, '.autonomous', `task_${task.id}.json`);
      await fs.mkdir(path.dirname(stateFile), { recursive: true });

      const state = {
        task,
        timestamp: Date.now(),
        version: '1.0'
      };

      await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save task state:', error);
    }
  }

  /**
   * Load task state for recovery
   */
  private async loadTaskState(taskId: string): Promise<TaskPlan | null> {
    try {
      const stateFile = path.join(this.config.rootPath, '.autonomous', `task_${taskId}.json`);
      const content = await fs.readFile(stateFile, 'utf-8');
      const state = JSON.parse(content);
      return state.task;
    } catch {
      return null;
    }
  }

  /**
   * Update task progress with persistence
   */
  private async updateTaskProgress(task: TaskPlan, context: ExecutionContext): Promise<void> {
    // Calculate progress based on completed steps
    const totalSteps = task.steps.length;
    const completedSteps = task.steps.filter(s => s.status === 'completed').length;
    const runningSteps = task.steps.filter(s => s.status === 'running').length;

    task.progress = Math.round(((completedSteps + runningSteps * 0.5) / totalSteps) * 100);

    // Save state periodically
    if (task.progress % 10 === 0 || task.status !== 'executing') {
      await this.saveTaskState(task);
    }

    // Update context memory with current progress
    context.stepMemory.set('task_progress', {
      taskId: task.id,
      progress: task.progress,
      completedSteps,
      totalSteps,
      status: task.status,
      timestamp: Date.now()
    });
  }

  /**
   * Generate file changes based on goal and context using AI-powered analysis
   */
  private async generateFileChanges(filePath: string, goal: string, context: ExecutionContext): Promise<string> {
    console.log(`🤖 Generating changes for: "${goal}" in ${filePath}`);

    // Read current file content
    let currentContent = '';
    try {
      currentContent = await fs.readFile(filePath, 'utf-8');
    } catch {
      // File doesn't exist, treat as empty
      currentContent = '';
    }

    // Step 1: Analyze the goal to understand what changes are needed
    const goalAnalysis = await this.analyzeGoalForChanges(goal, context);

    // Step 2: Parse current file structure using AST
    const fileStructure = await this.analyzeFileStructure(filePath, currentContent);

    // Step 3: Find similar patterns using vector search
    const similarPatterns = await this.findSimilarPatterns(goal, context);

    // Step 4: Generate the actual code changes
    const modifiedContent = await this.applyCodeTransformations(
      currentContent,
      fileStructure,
      goalAnalysis,
      similarPatterns
    );

    // Step 5: Validate the changes
    const validation = await this.validateCodeChanges(filePath, modifiedContent);
    if (!validation.isValid) {
      console.warn(`⚠️ Generated changes may have issues: ${validation.errors.join(', ')}`);
    }

    return modifiedContent;
  }

  /**
   * Analyze the goal to understand what type of changes are needed
   */
  private async analyzeGoalForChanges(goal: string, context: ExecutionContext): Promise<{
    action: 'add_function' | 'modify_function' | 'add_variable' | 'modify_variable' | 'add_import' | 'general';
    target: string;
    description: string;
    complexity: 'simple' | 'medium' | 'complex';
  }> {
    const goal_lower = goal.toLowerCase();

    // Analyze action type
    let action: typeof this.analyzeGoalForChanges.prototype.action = 'general';
    if (goal_lower.includes('add') && goal_lower.includes('function')) {
      action = 'add_function';
    } else if (goal_lower.includes('modify') || goal_lower.includes('update') || goal_lower.includes('change')) {
      action = 'modify_function';
    } else if (goal_lower.includes('add') && (goal_lower.includes('variable') || goal_lower.includes('const') || goal_lower.includes('let'))) {
      action = 'add_variable';
    } else if (goal_lower.includes('import')) {
      action = 'add_import';
    }

    // Extract target (what to add/modify)
    const target = this.extractTargetFromGoal(goal);

    // Determine complexity
    const complexity = goal_lower.includes('complex') || goal_lower.includes('system') ? 'complex' :
                      goal_lower.includes('simple') || goal.length < 50 ? 'simple' : 'medium';

    return {
      action,
      target,
      description: goal,
      complexity
    };
  }

  /**
   * Analyze the structure of the current file
   */
  private async analyzeFileStructure(filePath: string, content: string): Promise<{
    hasExports: boolean;
    hasImports: boolean;
    functions: string[];
    variables: string[];
    classes: string[];
    language: 'typescript' | 'javascript';
    structure: 'module' | 'script';
  }> {
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    const language = isTypeScript ? 'typescript' : 'javascript';

    // Parse with AST to get accurate structure
    try {
      const parseResult = await this.astParser.execute({
        filePath,
        includeSymbols: true,
        includeImports: true
      });

      if (parseResult.success && parseResult.output) {
        const parsed = JSON.parse(parseResult.output);
        const symbols = parsed.result?.symbols || [];

        const functions = symbols.filter((s: any) => s.type === 'function').map((s: any) => s.name);
        const variables = symbols.filter((s: any) => ['variable', 'const', 'let', 'var'].includes(s.type)).map((s: any) => s.name);
        const classes = symbols.filter((s: any) => s.type === 'class').map((s: any) => s.name);

        return {
          hasExports: content.includes('export'),
          hasImports: content.includes('import') || content.includes('require'),
          functions,
          variables,
          classes,
          language,
          structure: 'module'
        };
      }
    } catch (error) {
      console.warn('AST parsing failed, using fallback analysis:', error);
    }

    // Fallback analysis using regex
    return {
      hasExports: content.includes('export'),
      hasImports: content.includes('import') || content.includes('require'),
      functions: this.extractFunctionsFromContent(content),
      variables: this.extractVariablesFromContent(content),
      classes: [],
      language,
      structure: content.includes('import') || content.includes('export') ? 'module' : 'script'
    };
  }

  /**
   * Find similar code patterns using vector search
   */
  private async findSimilarPatterns(goal: string, context: ExecutionContext): Promise<any[]> {
    try {
      // Search for similar code patterns in the codebase
      const searchResults = await context.searchEngine.semanticSearch(goal, 5);
      return searchResults;
    } catch (error) {
      console.warn('Vector search failed:', error);
      return [];
    }
  }

  /**
   * Apply the actual code transformations
   */
  private async applyCodeTransformations(
    content: string,
    fileStructure: any,
    goalAnalysis: any,
    similarPatterns: any[]
  ): Promise<string> {
    console.log(`🔧 Applying ${goalAnalysis.action} transformation: ${goalAnalysis.target}`);

    switch (goalAnalysis.action) {
      case 'add_function':
        return this.addFunctionToFile(content, fileStructure, goalAnalysis);

      case 'add_variable':
        return this.addVariableToFile(content, fileStructure, goalAnalysis);

      case 'modify_function':
        return this.modifyFunctionInFile(content, fileStructure, goalAnalysis);

      default:
        // For general changes, use pattern-based generation
        return this.applyPatternBasedChanges(content, fileStructure, goalAnalysis, similarPatterns);
    }
  }

  /**
   * Add a function to the file
   */
  private addFunctionToFile(content: string, fileStructure: any, goalAnalysis: any): string {
    const lines = content.split('\n');
    let insertIndex = lines.length;

    // Find a good place to insert the function
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Insert before the main execution or export
      if (line.startsWith('console.log(') || line.startsWith('export') || line === 'main();' || line === '}') {
        insertIndex = i;
        break;
      }
    }

    // Generate function based on goal
    const functionCode = this.generateFunctionCode(goalAnalysis.target, goalAnalysis.description);

    // Insert the function
    lines.splice(insertIndex, 0, '', functionCode, '');

    return lines.join('\n');
  }

  /**
   * Generate function code based on the target description
   */
  private generateFunctionCode(target: string, description: string): string {
    const desc_lower = description.toLowerCase();

    if (desc_lower.includes('timestamp') || desc_lower.includes('time') || desc_lower.includes('current time')) {
      return `function logCurrentTime(): void {
  const now = new Date();
  console.log(\`Current time: \${now.toLocaleString()}\`);
}`;
    }

    if (desc_lower.includes('random') || desc_lower.includes('number')) {
      return `function generateRandomNumber(): number {
  return Math.floor(Math.random() * 100);
}`;
    }

    // Generic function template
    const functionName = target.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'newFunction';
    return `function ${functionName}(): void {
  // TODO: Implement ${description}
  console.log('${functionName} called');
}`;
  }

  /**
   * Add a variable to the file
   */
  private addVariableToFile(content: string, fileStructure: any, goalAnalysis: any): string {
    const lines = content.split('\n');
    let insertIndex = 0;

    // Find a good place to insert the variable (after imports, before functions)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('function') || line.startsWith('const') || line.startsWith('let') || line.startsWith('var')) {
        insertIndex = i;
        break;
      }
    }

    const variableCode = this.generateVariableCode(goalAnalysis.target, goalAnalysis.description);
    lines.splice(insertIndex, 0, variableCode, '');

    return lines.join('\n');
  }

  /**
   * Generate variable code
   */
  private generateVariableCode(target: string, description: string): string {
    const desc_lower = description.toLowerCase();

    if (desc_lower.includes('timestamp') || desc_lower.includes('time')) {
      return 'const currentTimestamp: number = Date.now();';
    }

    if (desc_lower.includes('version') || desc_lower.includes('v1')) {
      return 'const version: string = "1.0.0";';
    }

    // Generic variable
    const varName = target.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'newVariable';
    return `const ${varName}: string = "TODO: Initialize ${description}";`;
  }

  /**
   * Modify existing function in the file
   */
  private modifyFunctionInFile(content: string, fileStructure: any, goalAnalysis: any): string {
    // For now, just add a comment indicating the modification
    const modificationComment = `// MODIFIED: ${goalAnalysis.description}\n`;
    return modificationComment + content;
  }

  /**
   * Apply pattern-based changes using similar code patterns
   */
  private applyPatternBasedChanges(content: string, fileStructure: any, goalAnalysis: any, similarPatterns: any[]): string {
    // Use similar patterns to guide the changes
    if (similarPatterns.length > 0) {
      const bestPattern = similarPatterns[0];
      console.log(`📋 Using pattern from ${bestPattern.filePath} as reference`);
    }

    // For now, add a comment with the goal
    const changeComment = `// AUTONOMOUS CHANGE: ${goalAnalysis.description}\n// Applied at ${new Date().toISOString()}\n\n`;
    return changeComment + content;
  }

  /**
   * Validate the generated code changes
   */
  private async validateCodeChanges(filePath: string, content: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Try to parse the file with AST
      const parseResult = await this.astParser.execute({
        filePath,
        includeSymbols: false
      });

      if (!parseResult.success) {
        errors.push('Generated code has syntax errors');
      }
    } catch (error) {
      errors.push(`Validation failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract target from goal description
   */
  private extractTargetFromGoal(goal: string): string {
    // Simple extraction - can be enhanced with NLP
    const words = goal.toLowerCase().split(' ');
    const targetKeywords = ['function', 'variable', 'class', 'method'];

    for (let i = 0; i < words.length; i++) {
      if (targetKeywords.includes(words[i])) {
        // Get the next word(s) as the target
        const targetWords = [];
        for (let j = i + 1; j < words.length && j < i + 4; j++) {
          if (!['to', 'that', 'with', 'for', 'in'].includes(words[j])) {
            targetWords.push(words[j]);
          } else {
            break;
          }
        }
        return targetWords.join(' ');
      }
    }

    return goal.split(' ').slice(-3).join(' '); // Last few words as fallback
  }

  /**
   * Extract function names from content (fallback when AST fails)
   */
  private extractFunctionsFromContent(content: string): string[] {
    const functionRegex = /function\s+(\w+)/g;
    const matches = [];
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }

  /**
   * Extract variable names from content (fallback when AST fails)
   */
  private extractVariablesFromContent(content: string): string[] {
    const varRegex = /(?:const|let|var)\s+(\w+)/g;
    const matches = [];
    let match;
    while ((match = varRegex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}