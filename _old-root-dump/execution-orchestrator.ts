/**
 * Execution Orchestrator Service
 *
 * Orchestrates the sequential execution of approved TODO items from research plans.
 * Provides rich logging, diff display, patch generation, and safety features.
 */

import { GrokAgent } from '../agent/grok-agent.js';
import {
  ExecutionPlan,
  ExecutionStep,
  ExecutionOptions,
  ExecutionResult,
  FileChange,
  ErrorContext,
  RecoveryResult
} from '../types/execution.js';
import { ResearchPlan, ResearchRequest } from '../types/research-recommend.js';
import { ResearchRecommendService } from './research-recommend.js';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DEFAULT_OPTIONS: ExecutionOptions = {
  createPatches: true,
  createBackups: true,
  gitCommit: true,
  timeout: 300000, // 5 minutes per step
  maxConcurrentSteps: 1
};

export class ExecutionOrchestrator {
  private options: ExecutionOptions;
  private maxRecoveryAttempts: number = 3;
  private recoveryAttempts: Map<number, number> = new Map();

  constructor(
    private agent: GrokAgent,
    options: Partial<ExecutionOptions> = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute a research plan's TODO items
   */
  async executePlan(plan: ResearchPlan): Promise<ExecutionResult> {
    console.log(`🚀 Starting execution of ${plan.todo.length} tasks...`);
    console.log(`Summary: ${plan.summary}`);

    const executionPlan: ExecutionPlan = {
      steps: plan.todo.map((todo, index) => ({
        id: index + 1,
        description: todo,
        status: 'pending'
      })),
      totalSteps: plan.todo.length,
      completedSteps: 0,
      failedSteps: 0,
      startTime: new Date(),
      summary: plan.summary
    };

    try {
      // Execute steps sequentially
      for (const step of executionPlan.steps) {
        await this.executeStep(step, executionPlan);

        if (step.status === 'failed') {
          executionPlan.failedSteps++;
          // Continue with other steps for now
        } else {
          executionPlan.completedSteps++;
        }
      }

      executionPlan.endTime = new Date();

      // Create git commit if enabled and in git repo
      if (this.options.gitCommit && this.isGitRepository()) {
        try {
          executionPlan.gitCommitHash = await this.createGitCommit(executionPlan);
        } catch (error) {
          console.warn('[Execution] Failed to create git commit:', error);
        }
      }

      const success = executionPlan.failedSteps === 0;
      console.log(`✅ Execution ${success ? 'completed' : 'finished with errors'}: ${executionPlan.completedSteps}/${executionPlan.totalSteps} steps successful`);

      return {
        success,
        executionPlan
      };

    } catch (error) {
      executionPlan.endTime = new Date();
      console.error('[Execution] Orchestration failed:', error);

      return {
        success: false,
        executionPlan,
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: ExecutionStep, _executionPlan: ExecutionPlan): Promise<void> {
    step.status = 'running';
    step.startTime = new Date();

    console.log(`\n[grok-one-shot] #${step.id} ${step.description} …`);

    try {
      // Capture file state before execution
      const beforeState = this.captureFileState();

      // Execute the step using the agent
      await this.agent.processUserMessage(step.description);

      // Wait a bit for any async operations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture file state after execution
      const afterState = this.captureFileState();

      // Determine changes
      step.changes = this.calculateChanges(beforeState, afterState);

      // Display diffs for changes
      await this.displayChanges(step);

      // Create patches and backups
      if (step.changes && step.changes.length > 0) {
        step.patchFile = await this.createPatchFile(step);
        await this.createBackups(step);
      }

      step.status = 'completed';
      step.endTime = new Date();

      console.log(`[grok-one-shot] #${step.id} ✓ Completed`);

    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date();
      step.error = error instanceof Error ? error.message : 'Unknown error';

      console.log(`[grok-one-shot] #${step.id} ✗ Failed: ${step.error}`);
    }
  }

  /**
   * Capture current file state (simplified - just track modification times)
   */
  private captureFileState(): Map<string, number> {
    const state = new Map<string, number>();

    try {
      // Walk the current directory and record file modification times
      const walkDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            walkDir(filePath);
          } else if (stat.isFile()) {
            state.set(filePath, stat.mtime.getTime());
          }
        }
      };

      walkDir('.');
    } catch (error) {
      console.warn('[Execution] Failed to capture file state:', error);
    }

    return state;
  }

  /**
   * Calculate file changes between states
   */
  private calculateChanges(before: Map<string, number>, after: Map<string, number>): FileChange[] {
    const changes: FileChange[] = [];

    // Check for modified files
    for (const [filePath, afterTime] of after) {
      const beforeTime = before.get(filePath);
      if (!beforeTime || beforeTime !== afterTime) {
        changes.push({
          filePath,
          changeType: beforeTime ? 'modified' : 'created'
        });
      }
    }

    // Check for deleted files
    for (const filePath of before.keys()) {
      if (!after.has(filePath)) {
        changes.push({
          filePath,
          changeType: 'deleted'
        });
      }
    }

    return changes;
  }

  /**
   * Display changes with diffs
   */
  private async displayChanges(step: ExecutionStep): Promise<void> {
    if (!step.changes || step.changes.length === 0) {
      return;
    }

    console.log(`[grok-one-shot] #${step.id} Changes detected:`);

    for (const change of step.changes) {
      console.log(`  ${change.changeType.toUpperCase()}: ${change.filePath}`);

      if (change.changeType === 'modified' && fs.existsSync(change.filePath)) {
        try {
          // Generate diff using git if available
          if (this.isGitRepository()) {
            const diff = execSync(`git diff --no-index /dev/null ${change.filePath} 2>/dev/null || git diff ${change.filePath}`, {
              encoding: 'utf-8',
              timeout: 5000
            }).trim();

            if (diff) {
              console.log('  Diff:');
              console.log(diff.split('\n').map(line => `    ${line}`).join('\n'));
            }
          }
        } catch (_error) {
          // Diff generation failed, skip
        }
      }
    }
  }

  /**
   * Create patch file for changes
   */
  private async createPatchFile(step: ExecutionStep): Promise<string | undefined> {
    if (!this.options.createPatches || !step.changes || step.changes.length === 0) {
      return undefined;
    }

    try {
      const patchesDir = path.join(require('os').homedir(), '.grok', 'patches');
      if (!fs.existsSync(patchesDir)) {
        fs.mkdirSync(patchesDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const patchFile = path.join(patchesDir, `step-${step.id}-${timestamp}.patch`);

      let patchContent = `# Patch for step #${step.id}: ${step.description}\n`;
      patchContent += `# Generated: ${new Date().toISOString()}\n\n`;

      for (const change of step.changes) {
        if (change.changeType === 'modified' && fs.existsSync(change.filePath)) {
          try {
            const diff = execSync(`git diff ${change.filePath}`, {
              encoding: 'utf-8',
              timeout: 5000
            });
            patchContent += `--- a/${change.filePath}\n+++ b/${change.filePath}\n${diff}\n`;
          } catch {
            // Skip if diff fails
          }
        }
      }

      fs.writeFileSync(patchFile, patchContent);
      console.log(`[grok-one-shot] #${step.id} Patch saved: ${patchFile}`);

      return patchFile;
    } catch (error) {
      console.warn(`[Execution] Failed to create patch for step ${step.id}:`, error);
      return undefined;
    }
  }

  /**
   * Create backup files
   */
  private async createBackups(step: ExecutionStep): Promise<void> {
    if (!this.options.createBackups || !step.changes) {
      return;
    }

    for (const change of step.changes) {
      if ((change.changeType === 'modified' || change.changeType === 'created') && fs.existsSync(change.filePath)) {
        try {
          const backupPath = `${change.filePath}.bak`;
          fs.copyFileSync(change.filePath, backupPath);
          change.backupPath = backupPath;
          console.log(`[grok-one-shot] #${step.id} Backup created: ${backupPath}`);
        } catch (_error) {
          console.warn(`[Execution] Failed to create backup for ${change.filePath}:`, _error);
        }
      }
    }
  }

  /**
   * Check if current directory is a git repository
   */
  private isGitRepository(): boolean {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create git commit for all changes
   */
  private async createGitCommit(executionPlan: ExecutionPlan): Promise<string> {
    try {
      // Stage all changes
      execSync('git add .', { stdio: 'ignore' });

      // Create commit message
      const commitMessage = `feat: ${executionPlan.summary}

Executed ${executionPlan.totalSteps} tasks:
${executionPlan.steps.map(step => `- ${step.description}`).join('\n')}

Auto-generated by grok-one-shot execution orchestrator`;

      // Commit
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'ignore' });

      // Get commit hash
      const hash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

      console.log(`✅ Git commit created: ${hash.substring(0, 8)}`);

      return hash;
    } catch (error) {
      throw new Error(`Git commit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect error patterns in step execution
   */
   
  private detectError(error: any): ErrorContext | null {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Test failure patterns
    if (errorMessage.includes('test') && (errorMessage.includes('fail') || errorMessage.includes('error'))) {
      return {
        stepId: -1, // Will be set by caller
        errorType: 'test_failure',
        errorMessage,
        stackTrace: error instanceof Error ? error.stack : undefined,
        affectedFiles: this.findTestFiles(),
        contextData: { pattern: 'test_failure' }
      };
    }

    // Build failure patterns
    if (errorMessage.includes('build') && (errorMessage.includes('fail') || errorMessage.includes('error'))) {
      return {
        stepId: -1,
        errorType: 'build_failure',
        errorMessage,
        stackTrace: error instanceof Error ? error.stack : undefined,
        affectedFiles: this.findBuildFiles(),
        contextData: { pattern: 'build_failure' }
      };
    }

    // Linting failure patterns
    if (errorMessage.includes('lint') && (errorMessage.includes('fail') || errorMessage.includes('error'))) {
      return {
        stepId: -1,
        errorType: 'lint_failure',
        errorMessage,
        stackTrace: error instanceof Error ? error.stack : undefined,
        affectedFiles: this.findSourceFiles(),
        contextData: { pattern: 'lint_failure' }
      };
    }

    // Generic runtime errors
    return {
      stepId: -1,
      errorType: 'runtime_error',
      errorMessage,
      stackTrace: error instanceof Error ? error.stack : undefined,
      affectedFiles: [],
      contextData: { pattern: 'runtime_error' }
    };
  }

  /**
   * Find test files in the project
   */
  private findTestFiles(): string[] {
    try {
      const testFiles: string[] = [];
      const walkDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            walkDir(filePath);
          } else if (stat.isFile() && (file.includes('test') || file.includes('spec'))) {
            testFiles.push(filePath);
          }
        }
      };
      walkDir('.');
      return testFiles.slice(0, 10); // Limit to 10 files
    } catch {
      return [];
    }
  }

  /**
   * Find build configuration files
   */
  private findBuildFiles(): string[] {
    const buildFiles = ['package.json', 'tsconfig.json', 'webpack.config.js', 'babel.config.js'];
    return buildFiles.filter(file => fs.existsSync(file));
  }

  /**
   * Find source files
   */
  private findSourceFiles(): string[] {
    try {
      const sourceFiles: string[] = [];
      const walkDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            walkDir(filePath);
          } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx'))) {
            sourceFiles.push(filePath);
          }
        }
      };
      walkDir('.');
      return sourceFiles.slice(0, 20); // Limit to 20 files
    } catch {
      return [];
    }
  }

  /**
   * Present error context to user
   */
  private presentErrorContext(errorContext: ErrorContext, _step: ExecutionStep): void {
    console.log('\n' + '='.repeat(60));
    console.log('🚨 ISSUE ENCOUNTERED');
    console.log('='.repeat(60));

    console.log(`[grok-one-shot] Issue encountered: ${errorContext.errorMessage}`);

    if (errorContext.affectedFiles.length > 0) {
      console.log(`Affected files: ${errorContext.affectedFiles.slice(0, 5).join(', ')}`);
      if (errorContext.affectedFiles.length > 5) {
        console.log(`... and ${errorContext.affectedFiles.length - 5} more`);
      }
    }

    console.log('\n🔄 Initiating adaptive recovery...');
  }

  /**
   * Handle recovery flow
   */
  async handleRecovery(
    originalRequest: ResearchRequest,
    errorContext: ErrorContext,
    executionPlan: ExecutionPlan,
    researchService: ResearchRecommendService
  ): Promise<RecoveryResult> {
    // Check recovery attempt limits
    const attempts = this.recoveryAttempts.get(errorContext.stepId) || 0;
    if (attempts >= this.maxRecoveryAttempts) {
      console.log(`❌ Maximum recovery attempts (${this.maxRecoveryAttempts}) reached for step ${errorContext.stepId}`);
      return { approved: false, maxRetriesExceeded: true };
    }

    this.recoveryAttempts.set(errorContext.stepId, attempts + 1);

    // Create recovery request
    const recoveryRequest: ResearchRequest = {
      userTask: `Recovery from execution error: ${errorContext.errorMessage}

Original task: ${originalRequest.userTask}

Error context:
- Type: ${errorContext.errorType}
- Message: ${errorContext.errorMessage}
- Affected files: ${errorContext.affectedFiles.join(', ')}

Please provide a recovery plan to resolve this issue and continue execution.`,
      context: `This is a RECOVERY REQUEST for a failed execution step. The original task was part of a larger plan that encountered an error. Focus on fixing the specific issue and providing steps to resolve it.`,
      constraints: [
        'Focus on fixing the specific error encountered',
        'Provide actionable recovery steps',
        'Consider the broader execution context',
        'Ensure recovery steps are safe and reversible'
      ]
    };

    try {
      console.log('🔍 Analyzing error and generating recovery plan...');

      // Get recovery research
      const { output, approval } = await researchService.researchAndGetApproval(recoveryRequest);

      if (approval.approved) {
        console.log('✅ Recovery plan approved. Resuming execution...');
        return { approved: true, recoveryPlan: output };
      } else {
        console.log('❌ Recovery plan rejected by user.');
        return { approved: false };
      }

    } catch (error) {
      console.error('[Recovery] Failed to generate recovery plan:', error);
      return { approved: false };
    }
  }

  /**
   * Execute with adaptive recovery
   */
  async executeWithRecovery(
    plan: ResearchPlan,
    researchService: ResearchRecommendService,
    originalRequest: ResearchRequest
  ): Promise<ExecutionResult> {
    console.log(`🚀 Starting execution with adaptive recovery of ${plan.todo.length} tasks...`);
    console.log(`Summary: ${plan.summary}`);

    const executionPlan: ExecutionPlan = {
      steps: plan.todo.map((todo, index) => ({
        id: index + 1,
        description: todo,
        status: 'pending'
      })),
      totalSteps: plan.todo.length,
      completedSteps: 0,
      failedSteps: 0,
      startTime: new Date(),
      summary: plan.summary
    };

    try {
      // Execute steps sequentially with recovery
      for (let i = 0; i < executionPlan.steps.length; i++) {
        const step = executionPlan.steps[i];

        try {
          await this.executeStep(step, executionPlan);

          if (step.status === 'completed') {
            executionPlan.completedSteps++;
          } else {
            // Attempt recovery
            const errorContext = this.detectError(step.error);
            if (errorContext) {
              errorContext.stepId = step.id;
              this.presentErrorContext(errorContext, step);

              const recoveryResult = await this.handleRecovery(
                originalRequest,
                errorContext,
                executionPlan,
                researchService
              );

              if (recoveryResult.approved && recoveryResult.recoveryPlan) {
                // Insert recovery steps into the execution plan
                const recoverySteps = (recoveryResult.recoveryPlan.plan.todo as string[]).map((todo, idx) => ({
                  id: executionPlan.steps.length + idx + 1,
                  description: `[RECOVERY] ${todo}`,
                  status: 'pending' as const
                }));

                executionPlan.steps.splice(i + 1, 0, ...recoverySteps);
                executionPlan.totalSteps += recoverySteps.length;

                console.log(`📋 Added ${recoverySteps.length} recovery steps. Continuing execution...`);
                continue; // Retry the current step index (which now has recovery steps)
              }
            }

            // If no recovery or recovery failed, mark as failed and continue
            executionPlan.failedSteps++;
          }

        } catch (error) {
          // Handle execution-level errors
          const errorContext = this.detectError(error);
          if (errorContext) {
            errorContext.stepId = step.id;
            step.status = 'failed';
            step.error = errorContext.errorMessage;
            executionPlan.failedSteps++;

            console.log(`[grok-one-shot] #${step.id} ✗ Failed: ${errorContext.errorMessage}`);
          }
        }
      }

      executionPlan.endTime = new Date();

      // Create git commit if enabled and in git repo
      if (this.options.gitCommit && this.isGitRepository()) {
        try {
          executionPlan.gitCommitHash = await this.createGitCommit(executionPlan);
        } catch (error) {
          console.warn('[Execution] Failed to create git commit:', error);
        }
      }

      const success = executionPlan.failedSteps === 0;
      console.log(`✅ Execution ${success ? 'completed' : 'finished with errors'}: ${executionPlan.completedSteps}/${executionPlan.totalSteps} steps successful`);

      return {
        success,
        executionPlan
      };

    } catch (error) {
      executionPlan.endTime = new Date();
      console.error('[Execution] Orchestration failed:', error);

      return {
        success: false,
        executionPlan,
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    }
  }
}