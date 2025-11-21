/**
 * Semantic Planning Layer
 *
 * Provides natural language intent parsing and declarative operation mapping.
 * Transforms user goals into executable tool sequences with context awareness.
 */

import { VectorSearchEngine } from './vector-search-engine.js';
import { TaskStep } from './autonomous-executor.js';

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  entities: Map<string, any>;
  complexity: 'low' | 'medium' | 'high';
  suggestedTools: string[];
  decompositionNeeded: boolean;
}

export interface DeclarativeOperation {
  operation: string;
  tools: string[];
  parameters: Map<string, any>;
  dependencies: string[];
  estimatedEffort: number;
}

export interface SemanticContext {
  userGoal: string;
  projectContext: Map<string, any>;
  previousOperations: DeclarativeOperation[];
  learnedPatterns: Map<string, any>;
}

/**
 * Semantic Planning Layer for declarative AI workflows
 */
export class SemanticPlanner {
  private vectorSearch: VectorSearchEngine;
  private intentPatterns: Map<string, RegExp> = new Map();
  private operationMappings: Map<string, DeclarativeOperation> = new Map();
  private contextHistory: SemanticContext[] = [];

  constructor(vectorSearch: VectorSearchEngine) {
    this.vectorSearch = vectorSearch;
    this.initializeIntentPatterns();
    this.initializeOperationMappings();
  }

  /**
   * Parse natural language intent and create executable operations
   */
  async parseIntent(goal: string, description: string = '', context?: SemanticContext): Promise<IntentAnalysis> {
    console.log(`🧠 Analyzing intent: ${goal}`);

    // Use semantic search to understand context
    const searchResults = await this.vectorSearch.semanticSearch(goal, 5);

    // Analyze goal complexity and intent
    const analysis = await this.analyzeGoalIntent(goal, description, searchResults);

    // Determine if decomposition is needed
    analysis.decompositionNeeded = this.shouldDecompose(analysis, context);

    // Suggest appropriate tools based on intent
    analysis.suggestedTools = this.suggestTools(analysis);

    // Store context for learning
    if (context) {
      this.contextHistory.push(context);
      this.learnFromContext(context, analysis);
    }

    return analysis;
  }

  /**
   * Map declarative intent to executable tool sequences
   */
  async mapToOperations(analysis: IntentAnalysis, context?: SemanticContext): Promise<DeclarativeOperation[]> {
    const operations: DeclarativeOperation[] = [];

    if (analysis.decompositionNeeded) {
      // Decompose complex intent into multiple operations
      const decomposed = await this.decomposeIntent(analysis, context);
      operations.push(...decomposed);
    } else {
      // Direct mapping for simple intents
      const operation = this.mapSimpleIntent(analysis);
      if (operation) {
        operations.push(operation);
      }
    }

    // Optimize operation sequence
    return this.optimizeOperationSequence(operations, context);
  }

  /**
   * Convert operations to executable task steps
   */
  async operationsToSteps(operations: DeclarativeOperation[], context?: SemanticContext): Promise<TaskStep[]> {
    const steps: TaskStep[] = [];

    for (const operation of operations) {
      const step = await this.operationToStep(operation, context);
      steps.push(step);
    }

    return steps;
  }

  /**
   * Initialize intent pattern recognition
   */
  private initializeIntentPatterns(): void {
    this.intentPatterns.set('refactor', /refactor|redesign|restructure|reorganize/i);
    this.intentPatterns.set('implement', /implement|add|create|build|develop|feature/i);
    this.intentPatterns.set('fix', /fix|bug|issue|error|problem|resolve/i);
    this.intentPatterns.set('test', /test|validate|verify|check/i);
    this.intentPatterns.set('optimize', /optimize|improve|performance|efficiency/i);
    this.intentPatterns.set('document', /document|docs|readme|comment/i);
    this.intentPatterns.set('configure', /config|setup|initialize|install/i);
  }

  /**
   * Initialize operation mappings
   */
  private initializeOperationMappings(): void {
    // Refactoring operations
    this.operationMappings.set('refactor_component', {
      operation: 'refactor_component',
      tools: ['autonomous_task', 'multi_file_editor', 'ast_parser'],
      parameters: new Map([['component', 'target'], ['approach', 'strategy']]),
      dependencies: [],
      estimatedEffort: 5
    });

    // Implementation operations
    this.operationMappings.set('implement_feature', {
      operation: 'implement_feature',
      tools: ['autonomous_task', 'search', 'code_context'],
      parameters: new Map([['feature', 'description'], ['location', 'path']]),
      dependencies: ['analysis'],
      estimatedEffort: 4
    });

    // Bug fixing operations
    this.operationMappings.set('fix_bug', {
      operation: 'fix_bug',
      tools: ['search', 'symbol_search', 'autonomous_task'],
      parameters: new Map([['bug', 'description'], ['location', 'file']]),
      dependencies: ['locate'],
      estimatedEffort: 3
    });
  }

  /**
   * Analyze goal intent using NLP patterns
   */
  private async analyzeGoalIntent(goal: string, description: string, searchResults: any[]): Promise<IntentAnalysis> {
    const fullText = `${goal} ${description}`.toLowerCase();
    let bestIntent = 'general';
    let highestConfidence = 0;

    // Match against intent patterns
    for (const [intent, pattern] of this.intentPatterns) {
      const matches = fullText.match(pattern);
      if (matches) {
        const confidence = this.calculateConfidence(fullText, pattern);
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestIntent = intent;
        }
      }
    }

    // Extract entities from goal
    const entities = this.extractEntities(fullText, searchResults);

    // Determine complexity
    const complexity = this.determineComplexity(fullText, entities);

    return {
      intent: bestIntent,
      confidence: highestConfidence,
      entities,
      complexity,
      suggestedTools: [],
      decompositionNeeded: false
    };
  }

  /**
   * Calculate confidence score for intent matching
   */
  private calculateConfidence(text: string, pattern: RegExp): number {
    const matches = text.match(pattern);
    if (!matches) return 0;

    // Simple confidence based on match length and position
    const matchLength = matches[0].length;
    const textLength = text.length;
    const positionBonus = matches.index === 0 ? 0.2 : 0;

    return Math.min(1.0, (matchLength / textLength) + positionBonus);
  }

  /**
   * Extract entities from goal text
   */
  private extractEntities(text: string, searchResults: any[]): Map<string, any> {
    const entities = new Map<string, any>();

    // Extract file paths
    const filePatterns = [
      /\b(?:\.\/|\.\.\/)?(?:src|lib|app|components?)\/[^\s]+\.[jt]sx?\b/g,
      /\b[a-zA-Z0-9_\-\/]+\.[jt]sx?\b/g
    ];

    for (const pattern of filePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        entities.set('files', matches);
        break;
      }
    }

    // Extract component/function names
    const namePatterns = [
      /\b[A-Z][a-zA-Z0-9]*\b/g, // PascalCase
      /\b[a-z][a-zA-Z0-9]*\b/g  // camelCase
    ];

    for (const pattern of namePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        entities.set('names', matches.slice(0, 5)); // Limit to 5
        break;
      }
    }

    // Use search results to enhance entities
    if (searchResults.length > 0) {
      entities.set('related_symbols', searchResults.map(r => r.symbol?.name).filter(Boolean));
      entities.set('affected_files', searchResults.map(r => r.filePath));
    }

    return entities;
  }

  /**
   * Determine complexity of the goal
   */
  private determineComplexity(text: string, entities: Map<string, any>): 'low' | 'medium' | 'high' {
    let complexityScore = 0;

    // Length-based complexity
    if (text.length > 200) complexityScore += 2;
    else if (text.length > 100) complexityScore += 1;

    // Entity-based complexity
    const fileCount = entities.get('files')?.length || 0;
    const nameCount = entities.get('names')?.length || 0;

    complexityScore += Math.min(2, fileCount);
    complexityScore += Math.min(2, nameCount / 2);

    // Keyword-based complexity
    const complexKeywords = ['system', 'architecture', 'framework', 'multiple', 'all', 'entire'];
    for (const keyword of complexKeywords) {
      if (text.includes(keyword)) complexityScore += 1;
    }

    if (complexityScore >= 4) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Determine if intent should be decomposed
   */
  private shouldDecompose(analysis: IntentAnalysis, context?: SemanticContext): boolean {
    if (analysis.complexity === 'high') return true;
    if (analysis.entities.get('files')?.length > 3) return true;
    if (context?.previousOperations && context.previousOperations.length > 5) return true;

    return false;
  }

  /**
   * Suggest appropriate tools for the intent
   */
  private suggestTools(analysis: IntentAnalysis): string[] {
    const toolSuggestions: Record<string, string[]> = {
      refactor: ['autonomous_task', 'multi_file_editor', 'ast_parser', 'dependency_analyzer'],
      implement: ['autonomous_task', 'search', 'code_context', 'symbol_search'],
      fix: ['search', 'symbol_search', 'autonomous_task', 'run_terminal_cmd'],
      test: ['run_terminal_cmd', 'autonomous_task', 'search'],
      optimize: ['code_context', 'autonomous_task', 'performance_analyzer'],
      document: ['autonomous_task', 'search', 'read_file'],
      configure: ['run_terminal_cmd', 'autonomous_task', 'search']
    };

    return toolSuggestions[analysis.intent] || ['autonomous_task', 'search'];
  }

  /**
   * Decompose complex intent into multiple operations
   */
  private async decomposeIntent(analysis: IntentAnalysis, context?: SemanticContext): Promise<DeclarativeOperation[]> {
    const operations: DeclarativeOperation[] = [];

    // Analysis phase
    operations.push({
      operation: 'analyze_context',
      tools: ['search', 'code_context'],
      parameters: new Map([['query', analysis.entities.get('files')?.[0] || '']]),
      dependencies: [],
      estimatedEffort: 1
    });

    // Main operation based on intent
    const mainOperation = this.operationMappings.get(`${analysis.intent}_${analysis.intent === 'implement' ? 'feature' : analysis.intent === 'fix' ? 'bug' : 'component'}`);
    if (mainOperation) {
      operations.push({
        ...mainOperation,
        parameters: new Map([...mainOperation.parameters, ...analysis.entities])
      });
    }

    // Validation phase
    operations.push({
      operation: 'validate_changes',
      tools: ['run_terminal_cmd', 'autonomous_task'],
      parameters: new Map([['type', 'syntax_check']]),
      dependencies: ['main_operation'],
      estimatedEffort: 1
    });

    return operations;
  }

  /**
   * Map simple intent to single operation
   */
  private mapSimpleIntent(analysis: IntentAnalysis): DeclarativeOperation | null {
    const mappingKey = `${analysis.intent}_${analysis.intent === 'implement' ? 'feature' : analysis.intent === 'fix' ? 'bug' : 'component'}`;
    return this.operationMappings.get(mappingKey) || null;
  }

  /**
   * Optimize operation sequence for efficiency
   */
  private optimizeOperationSequence(operations: DeclarativeOperation[], context?: SemanticContext): DeclarativeOperation[] {
    // Sort by dependencies
    const sorted = this.topologicalSort(operations);

    // Merge similar operations
    const merged = this.mergeSimilarOperations(sorted);

    // Apply learned optimizations from context
    if (context?.learnedPatterns) {
      return this.applyLearnedOptimizations(merged, context);
    }

    return merged;
  }

  /**
   * Convert operation to executable task step
   */
  private async operationToStep(operation: DeclarativeOperation, context?: SemanticContext): Promise<TaskStep> {
    return {
      id: `step_${operation.operation}_${Date.now()}`,
      type: this.inferStepType(operation),
      description: `Execute ${operation.operation}`,
      inputs: Object.fromEntries(operation.parameters),
      status: 'pending'
    };
  }

  /**
   * Infer step type from operation
   */
  private inferStepType(operation: DeclarativeOperation): TaskStep['type'] {
    if (operation.tools.includes('search')) return 'search';
    if (operation.tools.includes('multi_file_editor')) return 'edit';
    if (operation.tools.includes('run_terminal_cmd')) return 'test';
    return 'analyze';
  }

  /**
   * Topological sort operations by dependencies
   */
  private topologicalSort(operations: DeclarativeOperation[]): DeclarativeOperation[] {
    const sorted: DeclarativeOperation[] = [];
    const visited = new Set<string>();

    const visit = (op: DeclarativeOperation) => {
      if (visited.has(op.operation)) return;
      visited.add(op.operation);

      for (const dep of op.dependencies) {
        const depOp = operations.find(o => o.operation === dep);
        if (depOp) visit(depOp);
      }

      sorted.push(op);
    };

    for (const op of operations) {
      visit(op);
    }

    return sorted;
  }

  /**
   * Merge similar operations to reduce redundancy
   */
  private mergeSimilarOperations(operations: DeclarativeOperation[]): DeclarativeOperation[] {
    const merged: DeclarativeOperation[] = [];
    const operationMap = new Map<string, DeclarativeOperation>();

    for (const op of operations) {
      const key = `${op.operation}_${Array.from(op.parameters.keys()).sort().join('_')}`;

      if (operationMap.has(key)) {
        // Merge parameters and combine tools
        const existing = operationMap.get(key)!;
        existing.tools = [...new Set([...existing.tools, ...op.tools])];
        existing.estimatedEffort = Math.max(existing.estimatedEffort, op.estimatedEffort);
      } else {
        operationMap.set(key, { ...op });
      }
    }

    return Array.from(operationMap.values());
  }

  /**
   * Apply learned optimizations from context
   */
  private applyLearnedOptimizations(operations: DeclarativeOperation[], context: SemanticContext): DeclarativeOperation[] {
    // Apply patterns learned from successful previous operations
    const optimizations = context.learnedPatterns.get('operation_optimizations') || [];

    for (const optimization of optimizations) {
      if (optimization.type === 'merge_operations') {
        // Example: merge search and analyze operations
        const searchOps = operations.filter(op => op.tools.includes('search'));
        const analyzeOps = operations.filter(op => op.tools.includes('code_context'));

        if (searchOps.length > 0 && analyzeOps.length > 0) {
          // Merge first search and analyze operation
          const mergedOp = {
            ...searchOps[0],
            tools: [...new Set([...searchOps[0].tools, ...analyzeOps[0].tools])],
            operation: 'search_and_analyze',
            estimatedEffort: searchOps[0].estimatedEffort + analyzeOps[0].estimatedEffort - 1
          };

          // Replace operations
          const searchIndex = operations.indexOf(searchOps[0]);
          const analyzeIndex = operations.indexOf(analyzeOps[0]);

          operations.splice(Math.max(searchIndex, analyzeIndex), 1);
          operations.splice(Math.min(searchIndex, analyzeIndex), 1, mergedOp);
        }
      }
    }

    return operations;
  }

  /**
   * Learn patterns from successful operations
   */
  private learnFromContext(context: SemanticContext, analysis: IntentAnalysis): void {
    // Update learned patterns based on successful operations
    if (!context.learnedPatterns.has('intent_patterns')) {
      context.learnedPatterns.set('intent_patterns', new Map());
    }

    const patterns = context.learnedPatterns.get('intent_patterns');
    patterns.set(analysis.intent, (patterns.get(analysis.intent) || 0) + 1);

    // Learn operation sequences that work well
    if (context.previousOperations.length > 1) {
      const sequence = context.previousOperations.map(op => op.operation);
      context.learnedPatterns.set('successful_sequences', sequence);
    }
  }
}