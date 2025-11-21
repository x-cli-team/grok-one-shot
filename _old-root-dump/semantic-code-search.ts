/**
 * Semantic Code Search Service
 * 
 * Provides advanced semantic search capabilities over indexed codebases.
 * Combines traditional symbol search with natural language understanding
 * and contextual relevance scoring.
 * 
 * Features:
 * - Natural language queries ("find authentication logic")
 * - Symbol cross-referencing and relationship mapping
 * - Context-aware relevance scoring
 * - Multi-file pattern recognition
 * - Usage pattern analysis
 * - Intent-based code discovery
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { CodebaseIndexer, CodeSymbol, DependencyInfo, CodebaseIndex } from './codebase-indexer.js';
import { ToolResult } from '../types/index.js';

export interface SemanticQuery {
  /** Natural language query */
  query: string;
  /** Intent classification */
  intent: 'find_function' | 'understand_flow' | 'locate_feature' | 'trace_usage' | 'find_patterns' | 'general';
  /** Context scope */
  scope: 'project' | 'directory' | 'file' | 'function';
  /** Target scope path */
  scopePath?: string;
  /** Confidence threshold for results */
  confidence?: number;
  /** Maximum results to return */
  maxResults?: number;
}

export interface SemanticResult {
  /** Matched symbol or file */
  symbol?: CodeSymbol;
  /** Matched file path */
  filePath?: string;
  /** Relevance score (0-1) */
  relevance: number;
  /** Match reason explanation */
  reason: string;
  /** Context snippet */
  context: string;
  /** Related symbols */
  relatedSymbols?: CodeSymbol[];
  /** Usage patterns */
  usagePatterns?: UsagePattern[];
}

export interface UsagePattern {
  /** Pattern type */
  type: 'caller' | 'called' | 'implements' | 'extends' | 'imports' | 'exports';
  /** Pattern description */
  description: string;
  /** Related symbols */
  symbols: CodeSymbol[];
  /** Frequency */
  frequency: number;
}

export interface CodeFlowTrace {
  /** Entry point */
  entryPoint: CodeSymbol;
  /** Flow steps */
  steps: FlowStep[];
  /** Total complexity */
  complexity: number;
  /** Identified patterns */
  patterns: string[];
}

export interface FlowStep {
  /** Step symbol */
  symbol: CodeSymbol;
  /** Step type */
  type: 'call' | 'return' | 'branch' | 'loop' | 'error_handling';
  /** Next possible steps */
  nextSteps: CodeSymbol[];
  /** Confidence level */
  confidence: number;
  /** Step description */
  description: string;
}

export interface FeatureMapping {
  /** Feature name */
  name: string;
  /** Feature description */
  description: string;
  /** Entry points */
  entryPoints: CodeSymbol[];
  /** Core implementation files */
  coreFiles: string[];
  /** Related features */
  relatedFeatures: string[];
  /** Complexity estimate */
  complexity: 'low' | 'medium' | 'high';
  /** Test coverage */
  testCoverage?: {
    hasTests: boolean;
    testFiles: string[];
    coverage: number;
  };
}

export class SemanticCodeSearch extends EventEmitter {
  private indexer: CodebaseIndexer;
  private queryCache = new Map<string, SemanticResult[]>();
  private intentPatterns: Map<string, RegExp[]>;

  constructor(indexer: CodebaseIndexer) {
    super();
    this.indexer = indexer;
    this.intentPatterns = this.initializeIntentPatterns();
  }

  /**
   * Perform semantic search with natural language query
   */
  async search(query: string, options: Partial<SemanticQuery> = {}): Promise<SemanticResult[]> {
    const semanticQuery: SemanticQuery = {
      query: query.toLowerCase().trim(),
      intent: this.classifyIntent(query),
      scope: options.scope || 'project',
      scopePath: options.scopePath,
      confidence: options.confidence || 0.3,
      maxResults: options.maxResults || 20
    };

    // Check cache
    const cacheKey = this.getCacheKey(semanticQuery);
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    this.emit('search-started', { query: semanticQuery });

    try {
      const results = await this.performSemanticSearch(semanticQuery);
      
      // Cache results
      this.queryCache.set(cacheKey, results);
      
      this.emit('search-completed', { query: semanticQuery, results });
      return results;

    } catch (error) {
      this.emit('search-failed', { query: semanticQuery, error });
      throw error;
    }
  }

  /**
   * Trace code flow from an entry point
   */
  async traceCodeFlow(entryPoint: string, maxDepth: number = 5): Promise<CodeFlowTrace> {
    const index = this.indexer.getIndex();
    if (!index) {
      throw new Error('No codebase index available');
    }

    // Find entry point symbol
    const entrySymbol = await this.findSymbolByName(entryPoint);
    if (!entrySymbol) {
      throw new Error(`Entry point symbol not found: ${entryPoint}`);
    }

    const visitedSymbols = new Set<string>();
    const steps: FlowStep[] = [];
    
    await this.traceSymbolFlow(entrySymbol, steps, visitedSymbols, maxDepth);

    const patterns = this.identifyFlowPatterns(steps);
    const complexity = this.calculateFlowComplexity(steps);

    return {
      entryPoint: entrySymbol,
      steps,
      complexity,
      patterns
    };
  }

  /**
   * Map features in the codebase
   */
  async mapFeatures(): Promise<FeatureMapping[]> {
    const index = this.indexer.getIndex();
    if (!index) {
      throw new Error('No codebase index available');
    }

    const features: FeatureMapping[] = [];
    const featurePatterns = this.getFeaturePatterns();

    // Analyze directory structure for feature detection
    const directories = index.structure.directories
      .filter(d => d.purpose === 'source')
      .sort((a, b) => b.fileCount - a.fileCount);

    for (const dir of directories) {
      const dirName = path.basename(dir.path);
      const feature = await this.analyzeFeatureDirectory(dir.path, dirName);
      
      if (feature) {
        features.push(feature);
      }
    }

    // Detect cross-cutting concerns
    const crossCuttingFeatures = await this.detectCrossCuttingFeatures(index);
    features.push(...crossCuttingFeatures);

    return features.sort((a, b) => b.entryPoints.length - a.entryPoints.length);
  }

  /**
   * Find symbols with contextual relationships
   */
  async findRelatedSymbols(symbolName: string): Promise<{
    symbol: CodeSymbol;
    related: Array<{
      symbol: CodeSymbol;
      relationship: string;
      strength: number;
    }>;
  }> {
    const index = this.indexer.getIndex();
    if (!index) {
      throw new Error('No codebase index available');
    }

    const targetSymbol = await this.findSymbolByName(symbolName);
    if (!targetSymbol) {
      throw new Error(`Symbol not found: ${symbolName}`);
    }

    const related = [];
    
    // Find symbols in same file
    const fileSymbols = index.symbols.get(targetSymbol.filePath) || [];
    for (const symbol of fileSymbols) {
      if (symbol.name !== symbolName) {
        const relationship = this.determineRelationship(targetSymbol, symbol);
        if (relationship) {
          related.push({
            symbol,
            relationship,
            strength: this.calculateRelationshipStrength(targetSymbol, symbol)
          });
        }
      }
    }

    // Find symbols through dependencies
    const dependencies = this.indexer.getFileDependencies(targetSymbol.filePath);
    for (const dep of dependencies) {
      const depSymbols = index.symbols.get(dep.to) || [];
      for (const symbol of depSymbols) {
        if (dep.symbols.includes(symbol.name)) {
          related.push({
            symbol,
            relationship: 'imports',
            strength: 0.8
          });
        }
      }
    }

    // Find usage references
    const references = this.indexer.findSymbolReferences(symbolName);
    for (const ref of references) {
      if (ref.filePath !== targetSymbol.filePath) {
        related.push({
          symbol: ref,
          relationship: 'referenced_by',
          strength: 0.6
        });
      }
    }

    return {
      symbol: targetSymbol,
      related: related
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 50) // Limit results
    };
  }

  // Private methods

  private async performSemanticSearch(query: SemanticQuery): Promise<SemanticResult[]> {
    const index = this.indexer.getIndex();
    if (!index) {
      throw new Error('No codebase index available');
    }

    const results: SemanticResult[] = [];

    // Extract keywords from query
    const keywords = this.extractKeywords(query.query);
    
    // Search symbols
    for (const keyword of keywords) {
      const symbolResults = this.indexer.searchSymbols(keyword, {
        fuzzy: true,
        limit: 100
      });

      for (const symbol of symbolResults) {
        const relevance = await this.calculateRelevance(symbol, query, keywords);
        
        if (relevance >= query.confidence!) {
          const context = await this.extractContext(symbol);
          const relatedSymbols = await this.getRelatedSymbols(symbol);
          
          results.push({
            symbol,
            relevance,
            reason: this.explainMatch(symbol, query, keywords),
            context,
            relatedSymbols: relatedSymbols.slice(0, 5)
          });
        }
      }
    }

    // Search file content for complex patterns
    await this.searchFileContent(query, keywords, results);

    // Sort by relevance and apply scope filtering
    return this.filterAndSortResults(results, query);
  }

  private classifyIntent(query: string): SemanticQuery['intent'] {
    const queryLower = query.toLowerCase();
    
    for (const [intent, patterns] of this.intentPatterns) {
      if (patterns.some(pattern => pattern.test(queryLower))) {
        return intent as SemanticQuery['intent'];
      }
    }
    
    return 'general';
  }

  private initializeIntentPatterns(): Map<string, RegExp[]> {
    return new Map([
      ['find_function', [
        /find.*function/i,
        /function.*that/i,
        /method.*for/i,
        /how.*to.*\w+/i
      ]],
      ['understand_flow', [
        /how.*work/i,
        /trace.*flow/i,
        /what.*happen/i,
        /process.*flow/i,
        /workflow/i
      ]],
      ['locate_feature', [
        /where.*is/i,
        /find.*feature/i,
        /locate.*component/i,
        /.*implementation/i
      ]],
      ['trace_usage', [
        /who.*use/i,
        /usage.*of/i,
        /called.*by/i,
        /reference/i
      ]],
      ['find_patterns', [
        /pattern/i,
        /similar.*to/i,
        /like.*this/i,
        /example.*of/i
      ]]
    ]);
  }

  private extractKeywords(query: string): string[] {
    // Remove stop words and extract meaningful terms
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'up', 'into',
      'find', 'get', 'show', 'how', 'what', 'where', 'when', 'why'
    ]);

    return query
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
  }

  private async calculateRelevance(symbol: CodeSymbol, query: SemanticQuery, keywords: string[]): Promise<number> {
    let relevance = 0;

    // Exact name match
    if (keywords.some(k => symbol.name.toLowerCase().includes(k))) {
      relevance += 0.5;
    }

    // Type match based on intent
    if (query.intent === 'find_function' && symbol.type === 'function') {
      relevance += 0.3;
    } else if (query.intent === 'locate_feature' && symbol.type === 'class') {
      relevance += 0.3;
    }

    // Context relevance (file name, documentation)
    const filePath = symbol.filePath.toLowerCase();
    if (keywords.some(k => filePath.includes(k))) {
      relevance += 0.2;
    }

    if (symbol.documentation && keywords.some(k => symbol.documentation!.toLowerCase().includes(k))) {
      relevance += 0.3;
    }

    // Signature relevance for functions
    if (symbol.signature && keywords.some(k => symbol.signature!.toLowerCase().includes(k))) {
      relevance += 0.2;
    }

    return Math.min(relevance, 1.0);
  }

  private async extractContext(symbol: CodeSymbol): Promise<string> {
    try {
      const content = await fs.readFile(symbol.filePath, 'utf8');
      const lines = content.split('\n');
      
      const startLine = Math.max(0, symbol.line - 3);
      const endLine = Math.min(lines.length, symbol.line + 3);
      
      return lines
        .slice(startLine, endLine)
        .map((line, index) => {
          const lineNumber = startLine + index + 1;
          const marker = lineNumber === symbol.line ? '→' : ' ';
          return `${marker} ${lineNumber.toString().padStart(3)}: ${line}`;
        })
        .join('\n');
    } catch (error) {
      return 'Context unavailable';
    }
  }

  private async getRelatedSymbols(symbol: CodeSymbol): Promise<CodeSymbol[]> {
    const index = this.indexer.getIndex();
    if (!index) return [];

    // Get symbols from same file
    const fileSymbols = (index.symbols.get(symbol.filePath) || [])
      .filter(s => s.name !== symbol.name)
      .slice(0, 10);

    return fileSymbols;
  }

  private explainMatch(symbol: CodeSymbol, query: SemanticQuery, keywords: string[]): string {
    const matches = [];

    if (keywords.some(k => symbol.name.toLowerCase().includes(k))) {
      matches.push('name match');
    }

    if (symbol.documentation && keywords.some(k => symbol.documentation!.toLowerCase().includes(k))) {
      matches.push('documentation match');
    }

    if (keywords.some(k => symbol.filePath.toLowerCase().includes(k))) {
      matches.push('file path match');
    }

    if (query.intent === 'find_function' && symbol.type === 'function') {
      matches.push('function type match');
    }

    return matches.length > 0 ? `Matched: ${matches.join(', ')}` : 'General relevance';
  }

  private async searchFileContent(query: SemanticQuery, keywords: string[], results: SemanticResult[]): Promise<void> {
    const index = this.indexer.getIndex();
    if (!index) return;

    // Search through files for pattern matches
    for (const [filePath, fileInfo] of index.files) {
      if (fileInfo.language === 'unknown' || fileInfo.size > 100000) continue;

      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase();
          
          if (keywords.some(k => line.includes(k))) {
            const relevance = this.calculateLineRelevance(line, keywords);
            
            if (relevance >= query.confidence!) {
              const context = this.extractLineContext(lines, i);
              
              results.push({
                filePath,
                relevance,
                reason: 'Content match',
                context
              });
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
  }

  private calculateLineRelevance(line: string, keywords: string[]): number {
    const matchCount = keywords.filter(k => line.includes(k)).length;
    return Math.min(matchCount / keywords.length, 1.0);
  }

  private extractLineContext(lines: string[], lineIndex: number): string {
    const startLine = Math.max(0, lineIndex - 2);
    const endLine = Math.min(lines.length, lineIndex + 3);
    
    return lines
      .slice(startLine, endLine)
      .map((line, index) => {
        const lineNumber = startLine + index + 1;
        const marker = lineNumber === lineIndex + 1 ? '→' : ' ';
        return `${marker} ${lineNumber.toString().padStart(3)}: ${line}`;
      })
      .join('\n');
  }

  private filterAndSortResults(results: SemanticResult[], query: SemanticQuery): SemanticResult[] {
    // Remove duplicates
    const uniqueResults = results.filter((result, index, array) => {
      const identifier = result.symbol ? 
        `${result.symbol.filePath}:${result.symbol.line}:${result.symbol.name}` :
        result.filePath;
      
      return array.findIndex(r => {
        const rIdentifier = r.symbol ? 
          `${r.symbol.filePath}:${r.symbol.line}:${r.symbol.name}` :
          r.filePath;
        return rIdentifier === identifier;
      }) === index;
    });

    // Sort by relevance
    return uniqueResults
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, query.maxResults || 20);
  }

  private async findSymbolByName(name: string): Promise<CodeSymbol | null> {
    const results = this.indexer.searchSymbols(name, { fuzzy: false, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  private async traceSymbolFlow(
    symbol: CodeSymbol, 
    steps: FlowStep[], 
    visited: Set<string>, 
    maxDepth: number
  ): Promise<void> {
    if (maxDepth <= 0 || visited.has(symbol.name)) return;
    
    visited.add(symbol.name);
    
    // Find symbols this symbol calls
    const nextSymbols = await this.findCalledSymbols(symbol);
    
    const step: FlowStep = {
      symbol,
      type: this.determineStepType(symbol),
      nextSteps: nextSymbols,
      confidence: 0.8, // Default confidence
      description: `${symbol.type} ${symbol.name} at ${path.basename(symbol.filePath)}:${symbol.line}`
    };
    
    steps.push(step);
    
    // Recursively trace next symbols
    for (const nextSymbol of nextSymbols.slice(0, 3)) { // Limit branches
      await this.traceSymbolFlow(nextSymbol, steps, visited, maxDepth - 1);
    }
  }

  private async findCalledSymbols(symbol: CodeSymbol): Promise<CodeSymbol[]> {
    // This would require more sophisticated AST analysis
    // For now, return symbols from same file
    const index = this.indexer.getIndex();
    if (!index) return [];
    
    const fileSymbols = index.symbols.get(symbol.filePath) || [];
    return fileSymbols
      .filter(s => s.name !== symbol.name && s.type === 'function')
      .slice(0, 5);
  }

  private determineStepType(symbol: CodeSymbol): FlowStep['type'] {
    // Simple heuristics - could be enhanced with AST analysis
    if (symbol.type === 'function') return 'call';
    return 'branch';
  }

  private identifyFlowPatterns(steps: FlowStep[]): string[] {
    const patterns = [];
    
    if (steps.some(s => s.type === 'loop')) {
      patterns.push('iterative_processing');
    }
    
    if (steps.some(s => s.type === 'error_handling')) {
      patterns.push('error_handling');
    }
    
    if (steps.length > 10) {
      patterns.push('complex_flow');
    }
    
    return patterns;
  }

  private calculateFlowComplexity(steps: FlowStep[]): number {
    return steps.reduce((complexity, step) => {
      return complexity + step.nextSteps.length + 1;
    }, 0);
  }

  private getFeaturePatterns(): Map<string, RegExp[]> {
    return new Map([
      ['auth', [/auth/i, /login/i, /session/i, /user/i]],
      ['api', [/api/i, /rest/i, /graphql/i, /endpoint/i]],
      ['database', [/db/i, /model/i, /schema/i, /query/i]],
      ['ui', [/component/i, /view/i, /page/i, /render/i]],
      ['test', [/test/i, /spec/i, /mock/i]],
      ['config', [/config/i, /setting/i, /env/i]]
    ]);
  }

  private async analyzeFeatureDirectory(dirPath: string, dirName: string): Promise<FeatureMapping | null> {
    const index = this.indexer.getIndex();
    if (!index) return null;

    // Find symbols in this directory
    const dirSymbols = [];
    const dirFiles = [];
    
    for (const [filePath, symbols] of index.symbols) {
      if (filePath.startsWith(dirPath)) {
        dirSymbols.push(...symbols);
        dirFiles.push(filePath);
      }
    }

    if (dirSymbols.length === 0) return null;

    // Identify entry points (exported functions/classes)
    const entryPoints = dirSymbols.filter(s => s.visibility === 'public');

    return {
      name: dirName,
      description: `Feature implemented in ${dirName} directory`,
      entryPoints: entryPoints.slice(0, 10),
      coreFiles: dirFiles.slice(0, 20),
      relatedFeatures: [],
      complexity: dirFiles.length > 10 ? 'high' : dirFiles.length > 5 ? 'medium' : 'low'
    };
  }

  private async detectCrossCuttingFeatures(index: CodebaseIndex): Promise<FeatureMapping[]> {
    const features = [];
    
    // Detect common cross-cutting concerns
    const errorHandling = await this.detectErrorHandlingFeature(index);
    const logging = await this.detectLoggingFeature(index);
    const validation = await this.detectValidationFeature(index);
    
    if (errorHandling) features.push(errorHandling);
    if (logging) features.push(logging);
    if (validation) features.push(validation);
    
    return features;
  }

  private async detectErrorHandlingFeature(index: CodebaseIndex): Promise<FeatureMapping | null> {
    const errorSymbols = [];
    
    for (const symbols of index.symbols.values()) {
      errorSymbols.push(...symbols.filter(s => 
        s.name.toLowerCase().includes('error') ||
        s.name.toLowerCase().includes('exception') ||
        s.type === 'class' && s.name.endsWith('Error')
      ));
    }

    if (errorSymbols.length === 0) return null;

    return {
      name: 'error_handling',
      description: 'Cross-cutting error handling and exception management',
      entryPoints: errorSymbols.slice(0, 10),
      coreFiles: [...new Set(errorSymbols.map(s => s.filePath))],
      relatedFeatures: ['logging', 'validation'],
      complexity: 'medium'
    };
  }

  private async detectLoggingFeature(index: CodebaseIndex): Promise<FeatureMapping | null> {
    const loggingSymbols = [];
    
    for (const symbols of index.symbols.values()) {
      loggingSymbols.push(...symbols.filter(s => 
        s.name.toLowerCase().includes('log') ||
        s.name.toLowerCase().includes('debug') ||
        s.importFrom?.includes('winston') ||
        s.importFrom?.includes('pino')
      ));
    }

    if (loggingSymbols.length === 0) return null;

    return {
      name: 'logging',
      description: 'Application logging and debugging infrastructure',
      entryPoints: loggingSymbols.slice(0, 10),
      coreFiles: [...new Set(loggingSymbols.map(s => s.filePath))],
      relatedFeatures: ['error_handling'],
      complexity: 'low'
    };
  }

  private async detectValidationFeature(index: CodebaseIndex): Promise<FeatureMapping | null> {
    const validationSymbols = [];
    
    for (const symbols of index.symbols.values()) {
      validationSymbols.push(...symbols.filter(s => 
        s.name.toLowerCase().includes('valid') ||
        s.name.toLowerCase().includes('schema') ||
        s.importFrom?.includes('joi') ||
        s.importFrom?.includes('zod')
      ));
    }

    if (validationSymbols.length === 0) return null;

    return {
      name: 'validation',
      description: 'Data validation and schema enforcement',
      entryPoints: validationSymbols.slice(0, 10),
      coreFiles: [...new Set(validationSymbols.map(s => s.filePath))],
      relatedFeatures: ['api', 'database'],
      complexity: 'medium'
    };
  }

  private determineRelationship(symbol1: CodeSymbol, symbol2: CodeSymbol): string | null {
    if (symbol1.type === 'class' && symbol2.type === 'function') {
      return 'contains_method';
    }
    if (symbol1.type === 'function' && symbol2.type === 'function') {
      return 'sibling_function';
    }
    if (symbol1.type === 'import' && symbol2.type === 'function') {
      return 'imports_for';
    }
    return null;
  }

  private calculateRelationshipStrength(symbol1: CodeSymbol, symbol2: CodeSymbol): number {
    // Simple heuristics for relationship strength
    if (symbol1.parent === symbol2.name || symbol2.parent === symbol1.name) {
      return 0.9;
    }
    if (Math.abs(symbol1.line - symbol2.line) < 10) {
      return 0.7;
    }
    return 0.5;
  }

  private getCacheKey(query: SemanticQuery): string {
    return `${query.query}-${query.intent}-${query.scope}-${query.confidence}`;
  }
}