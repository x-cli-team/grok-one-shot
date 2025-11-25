/**
 * Execution Types
 *
 * Defines the type system for the sequential execution of approved plans.
 * Part of the "Research → Recommend → Execute → Auto-Doc" workflow.
 */

export interface ExecutionStep {
  id: number;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  changes?: FileChange[];
  patchFile?: string;
}

export interface FileChange {
  filePath: string;
  changeType: 'created' | 'modified' | 'deleted';
  diff?: string;
  backupPath?: string;
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  startTime: Date;
  endTime?: Date;
  gitCommitHash?: string;
  summary: string;
}

export interface ExecutionOptions {
  createPatches: boolean;
  createBackups: boolean;
  gitCommit: boolean;
  timeout: number;
  maxConcurrentSteps: number;
}

export interface ExecutionResult {
  success: boolean;
  executionPlan: ExecutionPlan;
  error?: string;
}

export interface ErrorContext {
  stepId: number;
  errorType: 'test_failure' | 'build_failure' | 'lint_failure' | 'runtime_error' | 'unknown';
  errorMessage: string;
  stackTrace?: string;
  affectedFiles: string[];
  contextData: Record<string, any>;
}

export interface RecoveryRequest {
  originalRequest: any; // ResearchRequest from research-recommend
  errorContext: ErrorContext;
  executionState: {
    completedSteps: ExecutionStep[];
    failedStep: ExecutionStep;
    remainingSteps: ExecutionStep[];
  };
}

export interface RecoveryResult {
  approved: boolean;
  recoveryPlan?: any; // ResearchOutput
  maxRetriesExceeded?: boolean;
}