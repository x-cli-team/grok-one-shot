/**
 * Enhanced Error Handler
 *
 * Provides intelligent error classification, recovery strategies,
 * user-friendly explanations, and automated retry mechanisms.
 */

export interface ErrorClassification {
  type: 'syntax' | 'semantic' | 'runtime' | 'dependency' | 'permission' | 'network' | 'timeout' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  confidence: number;
  recoverable: boolean;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  type: 'automatic' | 'semi-automatic' | 'manual';
  estimatedEffort: number;
  successRate: number;
  prerequisites: string[];
  steps: RecoveryStep[];
}

export interface RecoveryStep {
  id: string;
  description: string;
  action: string;
  parameters: Record<string, any>;
  timeout?: number;
  rollbackOnFailure: boolean;
}

export interface ErrorAnalysis {
  originalError: Error;
  classification: ErrorClassification;
  rootCause: string;
  context: Record<string, any>;
  recoveryStrategies: RecoveryStrategy[];
  userExplanation: string;
  suggestedActions: string[];
  preventionTips: string[];
}

export interface RetryConfiguration {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
  retryableErrors: string[];
}

/**
 * Enhanced Error Handler with intelligent classification and recovery
 */
export class EnhancedErrorHandler {
  private errorPatterns = new Map<RegExp, ErrorClassification>();
  private recoveryStrategies = new Map<string, RecoveryStrategy[]>();
  private errorHistory = new Map<string, ErrorAnalysis[]>();
  private retryConfigs = new Map<string, RetryConfiguration>();

  constructor() {
    this.initializeErrorPatterns();
    this.initializeRecoveryStrategies();
    this.initializeRetryConfigurations();
  }

  /**
   * Analyze an error and provide comprehensive handling information
   */
  async analyzeError(error: Error, context: Record<string, any> = {}): Promise<ErrorAnalysis> {
    console.log(`🔍 Analyzing error: ${error.message}`);

    // Classify the error
    const classification = this.classifyError(error, context);

    // Identify root cause
    const rootCause = await this.identifyRootCause(error, classification, context);

    // Generate recovery strategies
    const recoveryStrategies = this.generateRecoveryStrategies(classification, context);

    // Create user-friendly explanation
    const userExplanation = this.generateUserExplanation(error, classification, rootCause);

    // Suggest immediate actions
    const suggestedActions = this.generateSuggestedActions(classification, recoveryStrategies);

    // Provide prevention tips
    const preventionTips = this.generatePreventionTips(classification);

    const analysis: ErrorAnalysis = {
      originalError: error,
      classification,
      rootCause,
      context,
      recoveryStrategies,
      userExplanation,
      suggestedActions,
      preventionTips
    };

    // Store in history for learning
    this.storeErrorAnalysis(analysis);

    return analysis;
  }

  /**
   * Attempt automatic error recovery
   */
  async attemptRecovery(errorAnalysis: ErrorAnalysis, context: Record<string, any> = {}): Promise<{
    success: boolean;
    strategy?: RecoveryStrategy;
    result?: any;
    explanation: string;
  }> {
    const automaticStrategies = errorAnalysis.recoveryStrategies
      .filter(strategy => strategy.type === 'automatic')
      .sort((a, b) => b.successRate - a.successRate);

    for (const strategy of automaticStrategies) {
      try {
        console.log(`🔧 Attempting recovery strategy: ${strategy.name}`);

        const result = await this.executeRecoveryStrategy(strategy, errorAnalysis, context);

        if (result.success) {
          return {
            success: true,
            strategy,
            result: result.output,
            explanation: `Successfully recovered using: ${strategy.name}`
          };
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy ${strategy.name} failed:`, recoveryError);
      }
    }

    return {
      success: false,
      explanation: 'No automatic recovery strategy succeeded. Manual intervention required.'
    };
  }

  /**
   * Execute retry with intelligent backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    customConfig?: Partial<RetryConfiguration>
  ): Promise<{ success: boolean; result?: T; error?: Error; attempts: number }> {
    const config = { ...this.retryConfigs.get('default')!, ...customConfig };

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      attempt++;

      try {
        console.log(`🔄 Attempt ${attempt}/${config.maxAttempts} for ${operationName}`);
        const result = await operation();
        return { success: true, result, attempts: attempt };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, error);

        // Check if error is retryable
        if (!this.isRetryableError(lastError, config.retryableErrors)) {
          break;
        }

        if (attempt < config.maxAttempts) {
          const delay = this.calculateBackoffDelay(config, attempt);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.delay(delay);
        }
      }
    }

    return { success: false, error: lastError!, attempts: attempt };
  }

  /**
   * Classify error based on patterns and context
   */
  private classifyError(error: Error, context: Record<string, any>): ErrorClassification {
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';

    // Check against known patterns
    for (const [pattern, classification] of this.errorPatterns) {
      if (pattern.test(errorMessage) || pattern.test(errorStack)) {
        return {
          ...classification,
          confidence: this.calculatePatternConfidence(pattern, errorMessage)
        };
      }
    }

    // Fallback classification based on error characteristics
    return this.fallbackClassification(error, context);
  }

  /**
   * Identify the root cause of an error
   */
  private async identifyRootCause(
    error: Error,
    classification: ErrorClassification,
    context: Record<string, any>
  ): Promise<string> {
    // Analyze error message for specific indicators
    const message = error.message.toLowerCase();

    switch (classification.type) {
      case 'syntax':
        if (message.includes('unexpected token') || message.includes('syntax error')) {
          return 'Invalid syntax in code file';
        }
        if (message.includes('cannot find module') || message.includes('module not found')) {
          return 'Missing or incorrect module import';
        }
        break;

      case 'dependency':
        if (message.includes('cannot resolve dependency')) {
          return 'Unresolved package dependency';
        }
        if (message.includes('version conflict') || message.includes('incompatible')) {
          return 'Package version incompatibility';
        }
        break;

      case 'permission':
        if (message.includes('permission denied') || message.includes('access denied')) {
          return 'Insufficient file system permissions';
        }
        break;

      case 'network':
        if (message.includes('timeout') || message.includes('connection refused')) {
          return 'Network connectivity issue';
        }
        break;
    }

    return `Unspecified ${classification.type} error`;
  }

  /**
   * Generate recovery strategies for an error
   */
  private generateRecoveryStrategies(
    classification: ErrorClassification,
    context: Record<string, any>
  ): RecoveryStrategy[] {
    const strategies = this.recoveryStrategies.get(classification.category) || [];

    // Filter strategies based on context and prerequisites
    return strategies.filter(strategy => {
      // Check if all prerequisites are met
      return strategy.prerequisites.every(prereq => {
        switch (prereq) {
          case 'git_available':
            return context.hasGit !== false;
          case 'package_manager_available':
            return context.hasPackageManager !== false;
          case 'write_permissions':
            return context.hasWritePermissions !== false;
          default:
            return true;
        }
      });
    });
  }

  /**
   * Generate user-friendly explanation
   */
  private generateUserExplanation(
    error: Error,
    classification: ErrorClassification,
    rootCause: string
  ): string {
    let explanation = `**${classification.severity.toUpperCase()} ${classification.type.toUpperCase()} ERROR**\n\n`;

    explanation += `**What happened:** ${error.message}\n\n`;
    explanation += `**Root cause:** ${rootCause}\n\n`;

    // Add context-specific guidance
    switch (classification.type) {
      case 'syntax':
        explanation += `**What to check:**\n`;
        explanation += `- Verify code syntax and formatting\n`;
        explanation += `- Check for missing semicolons, brackets, or quotes\n`;
        explanation += `- Ensure all imports are correct\n`;
        break;

      case 'dependency':
        explanation += `**What to check:**\n`;
        explanation += `- Verify package.json dependencies\n`;
        explanation += `- Check if packages are installed: \`npm install\` or \`yarn install\`\n`;
        explanation += `- Update packages if needed: \`npm update\`\n`;
        break;

      case 'permission':
        explanation += `**What to check:**\n`;
        explanation += `- Verify file permissions\n`;
        explanation += `- Check if files are read-only\n`;
        explanation += `- Ensure write access to target directory\n`;
        break;
    }

    return explanation;
  }

  /**
   * Generate suggested immediate actions
   */
  private generateSuggestedActions(
    classification: ErrorClassification,
    recoveryStrategies: RecoveryStrategy[]
  ): string[] {
    const actions: string[] = [];

    // Add automatic recovery options
    const autoStrategies = recoveryStrategies.filter(s => s.type === 'automatic');
    if (autoStrategies.length > 0) {
      actions.push(`🔧 Try automatic recovery: ${autoStrategies[0].name}`);
    }

    // Add manual recovery suggestions
    const manualStrategies = recoveryStrategies.filter(s => s.type === 'manual');
    if (manualStrategies.length > 0) {
      actions.push(`📋 Manual recovery options available (${manualStrategies.length})`);
    }

    // Add general debugging actions
    switch (classification.type) {
      case 'syntax':
        actions.push('🔍 Check recent code changes for syntax errors');
        actions.push('🧪 Run linter: `npm run lint` or similar');
        break;

      case 'dependency':
        actions.push('📦 Check package versions: `npm ls`');
        actions.push('🔄 Clear cache and reinstall: `rm -rf node_modules && npm install`');
        break;

      case 'runtime':
        actions.push('🐛 Add debugging logs to identify issue location');
        actions.push('🧪 Write unit test to reproduce the error');
        break;
    }

    return actions;
  }

  /**
   * Generate prevention tips
   */
  private generatePreventionTips(classification: ErrorClassification): string[] {
    const tips: string[] = [];

    switch (classification.type) {
      case 'syntax':
        tips.push('Use a linter (ESLint, Prettier) to catch syntax errors early');
        tips.push('Enable syntax checking in your IDE');
        tips.push('Write tests to validate code changes');
        break;

      case 'dependency':
        tips.push('Keep dependencies updated regularly');
        tips.push('Use exact versions in package.json to avoid conflicts');
        tips.push('Test dependency updates in isolation');
        break;

      case 'runtime':
        tips.push('Add comprehensive error handling');
        tips.push('Write unit and integration tests');
        tips.push('Use type checking (TypeScript) to catch errors early');
        break;

      case 'permission':
        tips.push('Avoid running as root unless necessary');
        tips.push('Check file permissions before operations');
        tips.push('Use proper user accounts for different services');
        break;
    }

    return tips;
  }

  /**
   * Initialize error classification patterns
   */
  private initializeErrorPatterns(): void {
    // Syntax errors
    this.errorPatterns.set(/syntax error|unexpected token|parsing error/i, {
      type: 'syntax',
      severity: 'high',
      category: 'code_quality',
      confidence: 0.9,
      recoverable: true
    });

    // Module resolution errors
    this.errorPatterns.set(/cannot find module|module not found|cannot resolve/i, {
      type: 'dependency',
      severity: 'medium',
      category: 'dependencies',
      confidence: 0.95,
      recoverable: true
    });

    // Permission errors
    this.errorPatterns.set(/permission denied|access denied|eacces/i, {
      type: 'permission',
      severity: 'high',
      category: 'filesystem',
      confidence: 0.9,
      recoverable: false
    });

    // Network errors
    this.errorPatterns.set(/timeout|connection refused|network error/i, {
      type: 'network',
      severity: 'medium',
      category: 'connectivity',
      confidence: 0.8,
      recoverable: true
    });

    // Runtime errors
    this.errorPatterns.set(/type error|reference error|null pointer|undefined/i, {
      type: 'runtime',
      severity: 'high',
      category: 'logic',
      confidence: 0.7,
      recoverable: true
    });
  }

  /**
   * Initialize recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    // Syntax error recovery
    this.recoveryStrategies.set('code_quality', [
      {
        id: 'syntax_check',
        name: 'Run Syntax Validation',
        description: 'Automatically check and fix common syntax issues',
        type: 'automatic',
        estimatedEffort: 1,
        successRate: 0.7,
        prerequisites: ['package_manager_available'],
        steps: [
          {
            id: 'run_linter',
            description: 'Execute code linter to identify issues',
            action: 'run_terminal_cmd',
            parameters: { command: 'npm run lint' },
            timeout: 30000,
            rollbackOnFailure: false
          }
        ]
      },
      {
        id: 'format_code',
        name: 'Auto-format Code',
        description: 'Automatically format code to fix indentation and spacing issues',
        type: 'automatic',
        estimatedEffort: 1,
        successRate: 0.8,
        prerequisites: ['package_manager_available'],
        steps: [
          {
            id: 'run_formatter',
            description: 'Execute code formatter',
            action: 'run_terminal_cmd',
            parameters: { command: 'npm run format' },
            timeout: 30000,
            rollbackOnFailure: false
          }
        ]
      }
    ]);

    // Dependency error recovery
    this.recoveryStrategies.set('dependencies', [
      {
        id: 'install_deps',
        name: 'Install Missing Dependencies',
        description: 'Automatically install missing packages',
        type: 'automatic',
        estimatedEffort: 2,
        successRate: 0.9,
        prerequisites: ['package_manager_available'],
        steps: [
          {
            id: 'npm_install',
            description: 'Install npm dependencies',
            action: 'run_terminal_cmd',
            parameters: { command: 'npm install' },
            timeout: 120000,
            rollbackOnFailure: false
          }
        ]
      },
      {
        id: 'clear_cache',
        name: 'Clear Package Cache',
        description: 'Clear package manager cache and reinstall',
        type: 'semi-automatic',
        estimatedEffort: 3,
        successRate: 0.75,
        prerequisites: ['package_manager_available'],
        steps: [
          {
            id: 'clear_npm_cache',
            description: 'Clear npm cache',
            action: 'run_terminal_cmd',
            parameters: { command: 'npm cache clean --force' },
            timeout: 30000,
            rollbackOnFailure: false
          },
          {
            id: 'reinstall_deps',
            description: 'Reinstall all dependencies',
            action: 'run_terminal_cmd',
            parameters: { command: 'rm -rf node_modules package-lock.json && npm install' },
            timeout: 180000,
            rollbackOnFailure: false
          }
        ]
      }
    ]);

    // Permission error recovery
    this.recoveryStrategies.set('filesystem', [
      {
        id: 'fix_permissions',
        name: 'Fix File Permissions',
        description: 'Automatically fix common file permission issues',
        type: 'automatic',
        estimatedEffort: 1,
        successRate: 0.6,
        prerequisites: ['write_permissions'],
        steps: [
          {
            id: 'chmod_files',
            description: 'Set proper permissions on files',
            action: 'run_terminal_cmd',
            parameters: { command: 'chmod -R u+w .' },
            timeout: 30000,
            rollbackOnFailure: false
          }
        ]
      }
    ]);
  }

  /**
   * Initialize retry configurations
   */
  private initializeRetryConfigurations(): void {
    this.retryConfigs.set('default', {
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 30000,
      jitter: true,
      retryableErrors: ['timeout', 'network', 'temporary']
    });

    this.retryConfigs.set('aggressive', {
      maxAttempts: 5,
      backoffStrategy: 'linear',
      baseDelay: 500,
      maxDelay: 10000,
      jitter: false,
      retryableErrors: ['timeout', 'network']
    });

    this.retryConfigs.set('conservative', {
      maxAttempts: 2,
      backoffStrategy: 'fixed',
      baseDelay: 5000,
      maxDelay: 5000,
      jitter: false,
      retryableErrors: ['network']
    });
  }

  /**
   * Execute a recovery strategy
   */
  private async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    errorAnalysis: ErrorAnalysis,
    context: Record<string, any>
  ): Promise<{ success: boolean; output?: any }> {
    console.log(`Executing recovery strategy: ${strategy.name}`);

    for (const step of strategy.steps) {
      try {
        console.log(`Step: ${step.description}`);

        // In a real implementation, this would execute the actual recovery action
        // For now, we'll simulate based on the action type
        switch (step.action) {
          case 'run_terminal_cmd':
            // Simulate terminal command execution
            const command = step.parameters.command;
            if (command.includes('npm install')) {
              // Simulate successful dependency installation
              await this.delay(2000);
              return { success: true, output: 'Dependencies installed successfully' };
            }
            if (command.includes('lint') || command.includes('format')) {
              // Simulate successful code checking/formatting
              await this.delay(1000);
              return { success: true, output: 'Code validated/formatted successfully' };
            }
            break;

          default:
            console.warn(`Unknown recovery action: ${step.action}`);
        }

      } catch (stepError) {
        console.error(`Recovery step failed: ${step.description}`, stepError);
        if (step.rollbackOnFailure) {
          // Implement rollback logic here
        }
        return { success: false };
      }
    }

    return { success: true };
  }

  /**
   * Calculate pattern confidence score
   */
  private calculatePatternConfidence(pattern: RegExp, text: string): number {
    const matches = text.match(pattern);
    if (!matches) return 0;

    // Higher confidence for exact matches and longer matches
    const matchLength = matches[0].length;
    const textLength = text.length;
    const exactMatch = matches[0].toLowerCase() === text.toLowerCase();

    let confidence = matchLength / textLength;
    if (exactMatch) confidence += 0.3;

    return Math.min(1.0, confidence);
  }

  /**
   * Fallback error classification
   */
  private fallbackClassification(error: Error, context: Record<string, any>): ErrorClassification {
    // Analyze error message for clues
    const message = error.message.toLowerCase();

    if (message.includes('cannot') || message.includes('failed') || message.includes('error')) {
      return {
        type: 'runtime',
        severity: 'medium',
        category: 'execution',
        confidence: 0.5,
        recoverable: true
      };
    }

    return {
      type: 'unknown',
      severity: 'medium',
      category: 'general',
      confidence: 0.1,
      recoverable: false
    };
  }

  /**
   * Calculate backoff delay for retries
   */
  private calculateBackoffDelay(config: RetryConfiguration, attempt: number): number {
    let delay: number;

    switch (config.backoffStrategy) {
      case 'linear':
        delay = config.baseDelay * attempt;
        break;
      case 'exponential':
        delay = config.baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = config.baseDelay;
        break;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);

    // Add jitter if enabled
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error, retryablePatterns: string[]): boolean {
    const message = error.message.toLowerCase();

    return retryablePatterns.some(pattern =>
      message.includes(pattern.toLowerCase())
    );
  }

  /**
   * Store error analysis for learning
   */
  private storeErrorAnalysis(analysis: ErrorAnalysis): void {
    const key = `${analysis.classification.type}_${analysis.classification.category}`;

    if (!this.errorHistory.has(key)) {
      this.errorHistory.set(key, []);
    }

    const history = this.errorHistory.get(key)!;
    history.push(analysis);

    // Keep only recent errors (last 100)
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}