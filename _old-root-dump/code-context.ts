import { ToolResult } from "../../types/index.js";
import { ASTParserTool, SymbolInfo } from "./ast-parser.js";
import { SymbolSearchTool, SymbolReference } from "./symbol-search.js";
import { DependencyAnalyzerTool } from "./dependency-analyzer.js";
import * as ops from "fs";

const pathExists = async (filePath: string): Promise<boolean> => {
  try {
    await ops.promises.access(filePath, ops.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};



import path from "path";

export interface CodeContext {
  filePath: string;
  symbols: ContextualSymbol[];
  dependencies: ContextualDependency[];
  relationships: CodeRelationship[];
  semanticContext: SemanticContext;
  codeMetrics: CodeMetrics;
}

export interface ContextualSymbol extends SymbolInfo {
  context: {
    parentClass?: string;
    parentFunction?: string;
    relatedSymbols: string[];
    usagePatterns: UsagePattern[];
    semanticTags: string[];
  };
}

export interface ContextualDependency {
  source: string;
  type: 'internal' | 'external' | 'builtin';
  usage: 'direct' | 'indirect';
  importedSymbols: string[];
  usageContext: string[];
  isCircular: boolean;
}

export interface CodeRelationship {
  type: 'inheritance' | 'composition' | 'dependency' | 'usage' | 'similarity';
  source: string;
  target: string;
  strength: number; // 0-1
  description: string;
  evidence: string[];
}

export interface SemanticContext {
  purpose: string;
  domain: string[];
  patterns: DesignPattern[];
  complexity: ComplexityMetrics;
  quality: QualityMetrics;
}

export interface DesignPattern {
  name: string;
  confidence: number;
  evidence: string[];
  location: { startLine: number; endLine: number };
}

export interface UsagePattern {
  pattern: string;
  frequency: number;
  contexts: string[];
}

export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  nesting: number;
  dependencies: number;
}

export interface QualityMetrics {
  maintainability: number;
  readability: number;
  testability: number;
  reusability: number;
}

export interface ProjectContext {
  rootPath: string;
  projectType: string;
  architecture: ArchitectureInfo;
  codebase: CodebaseInfo;
  relationships: ProjectRelationship[];
}

export interface ArchitectureInfo {
  pattern: string; // MVC, Microservices, Layered, etc.
  layers: ArchitectureLayer[];
  entryPoints: string[];
  coreModules: string[];
}

export interface ArchitectureLayer {
  name: string;
  files: string[];
  dependencies: string[];
  responsibility: string;
}

export interface CodebaseInfo {
  totalFiles: number;
  languages: { [language: string]: number };
  frameworks: string[];
  testCoverage: number;
  documentation: number;
}

export interface ProjectRelationship {
  type: string;
  modules: string[];
  strength: number;
  description: string;
}

export class CodeContextTool {
  name = "code_context";
  description = "Build intelligent code context, analyze relationships, and provide semantic understanding";

  private astParser: ASTParserTool;
  private symbolSearch: SymbolSearchTool;
  private dependencyAnalyzer: DependencyAnalyzerTool;

  constructor() {
    this.astParser = new ASTParserTool();
    this.symbolSearch = new SymbolSearchTool();
    this.dependencyAnalyzer = new DependencyAnalyzerTool();
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const {
        filePath,
        rootPath = process.cwd(),
        includeRelationships = true,
        includeMetrics = true,
        includeSemantics = true,
        maxRelatedFiles = 10,
        contextDepth = 2
      } = args;

      if (!filePath) {
        throw new Error("File path is required");
      }

      if (!await pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Build comprehensive context
      const context = await this.buildCodeContext(
        filePath,
        rootPath,
        includeRelationships,
        includeMetrics,
        includeSemantics,
        maxRelatedFiles,
        contextDepth
      );

      return {
        success: true,
        output: JSON.stringify(context, null, 2)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async buildCodeContext(
    filePath: string,
    rootPath: string,
    includeRelationships: boolean,
    includeMetrics: boolean,
    includeSemantics: boolean,
    maxRelatedFiles: number,
    contextDepth: number
  ): Promise<CodeContext> {
    // Parse the file
    const parseResult = await this.astParser.execute({
      filePath,
      includeSymbols: true,
      includeImports: true,
      includeTree: false
    });

    if (!parseResult.success || !parseResult.output) {
      throw new Error(`Failed to parse file: ${filePath}`);
    }
    const parsed = JSON.parse(parseResult.output);
    if (!parsed.success) {
      throw new Error(`Failed to parse file: ${filePath}`);
    }

    const symbols = parsed.result.symbols as SymbolInfo[] || [];
    const imports = parsed.result.imports || [];

    // Enhance symbols with context
    const contextualSymbols = await this.enhanceSymbolsWithContext(symbols, filePath, rootPath);

    // Analyze dependencies
    const dependencies = await this.analyzeDependencies(imports, filePath, rootPath);

    // Build relationships
    let relationships: CodeRelationship[] = [];
    if (includeRelationships) {
      relationships = await this.buildCodeRelationships(
        filePath,
        contextualSymbols,
        dependencies,
        rootPath,
        maxRelatedFiles
      );
    }

    // Analyze semantics
    let semanticContext: SemanticContext = {
      purpose: 'unknown',
      domain: [],
      patterns: [],
      complexity: { cyclomatic: 0, cognitive: 0, nesting: 0, dependencies: 0 },
      quality: { maintainability: 0, readability: 0, testability: 0, reusability: 0 }
    };

    if (includeSemantics) {
      semanticContext = await this.analyzeSemanticContext(filePath, contextualSymbols, dependencies);
    }

    // Calculate metrics
    let codeMetrics: CodeMetrics = {
      linesOfCode: 0,
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0,
      maintainabilityIndex: 0,
      technicalDebt: 0
    };

    if (includeMetrics) {
      codeMetrics = await this.calculateCodeMetrics(filePath, contextualSymbols);
    }

    return {
      filePath: path.relative(rootPath, filePath),
      symbols: contextualSymbols,
      dependencies,
      relationships,
      semanticContext,
      codeMetrics
    };
  }

  private async enhanceSymbolsWithContext(
    symbols: SymbolInfo[],
    filePath: string,
    rootPath: string
  ): Promise<ContextualSymbol[]> {
    const enhanced: ContextualSymbol[] = [];

    for (const symbol of symbols) {
      // Find related symbols
      const relatedSymbols = await this.findRelatedSymbols(symbol, symbols, filePath, rootPath);

      // Analyze usage patterns
      const usagePatterns = await this.analyzeUsagePatterns(symbol, filePath);

      // Generate semantic tags
      const semanticTags = this.generateSemanticTags(symbol, filePath);

      const contextualSymbol: ContextualSymbol = {
        ...symbol,
        context: {
          parentClass: this.findParentClass(symbol, symbols),
          parentFunction: this.findParentFunction(symbol, symbols),
          relatedSymbols,
          usagePatterns,
          semanticTags
        }
      };

      enhanced.push(contextualSymbol);
    }

    return enhanced;
  }

  private async findRelatedSymbols(
    symbol: SymbolInfo,
    allSymbols: SymbolInfo[],
    filePath: string,
    rootPath: string
  ): Promise<string[]> {
    const related: string[] = [];

    // Find symbols in same class/scope
    const sameScope = allSymbols.filter(s => 
      s !== symbol && s.scope === symbol.scope
    );
    related.push(...sameScope.map(s => s.name));

    // Search for similar symbols across project
    try {
      const searchResult = await this.symbolSearch.findSimilarSymbols(symbol.name, 0.7);
      const similarNames = searchResult
        .filter(ref => ref.filePath !== filePath)
        .slice(0, 5)
        .map(ref => ref.symbol.name);
      related.push(...similarNames);
    } catch (error) {
      // Skip if search fails
    }

    return [...new Set(related)];
  }

  private async analyzeUsagePatterns(symbol: SymbolInfo, filePath: string): Promise<UsagePattern[]> {
    const patterns: UsagePattern[] = [];

    try {
      const content = await ops.promises.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Simple pattern analysis
      let callCount = 0;
      let assignmentCount = 0;
      let returnCount = 0;

      for (const line of lines) {
        if (line.includes(`${symbol.name}(`)) callCount++;
        if (line.includes(`= ${symbol.name}`) || line.includes(`const ${symbol.name}`)) assignmentCount++;
        if (line.includes(`return ${symbol.name}`)) returnCount++;
      }

      if (callCount > 0) {
        patterns.push({
          pattern: 'function_call',
          frequency: callCount,
          contexts: ['invocation']
        });
      }

      if (assignmentCount > 0) {
        patterns.push({
          pattern: 'assignment',
          frequency: assignmentCount,
          contexts: ['declaration', 'assignment']
        });
      }

      if (returnCount > 0) {
        patterns.push({
          pattern: 'return_value',
          frequency: returnCount,
          contexts: ['return']
        });
      }
    } catch (error) {
      // Skip if file read fails
    }

    return patterns;
  }

  private generateSemanticTags(symbol: SymbolInfo, filePath: string): string[] {
    const tags: string[] = [];

    // Basic type tag
    tags.push(symbol.type);

    // Name-based semantic analysis
    const name = symbol.name.toLowerCase();
    
    if (name.includes('test') || name.includes('spec')) {
      tags.push('test');
    }
    if (name.includes('util') || name.includes('helper')) {
      tags.push('utility');
    }
    if (name.includes('config') || name.includes('setting')) {
      tags.push('configuration');
    }
    if (name.includes('api') || name.includes('service')) {
      tags.push('api');
    }
    if (name.includes('component') || name.includes('widget')) {
      tags.push('ui');
    }
    if (name.includes('model') || name.includes('entity')) {
      tags.push('model');
    }
    if (name.includes('controller') || name.includes('handler')) {
      tags.push('controller');
    }

    // File path-based tags
    const fileName = path.basename(filePath);
    if (fileName.includes('test')) {
      tags.push('test');
    }
    if (fileName.includes('mock')) {
      tags.push('mock');
    }

    // Async/await patterns
    if (symbol.isAsync) {
      tags.push('async');
    }

    // Access modifiers
    if (symbol.accessibility) {
      tags.push(symbol.accessibility);
    }

    return [...new Set(tags)];
  }

  private findParentClass(symbol: SymbolInfo, allSymbols: SymbolInfo[]): string | undefined {
    const classSymbols = allSymbols.filter(s => s.type === 'class');
    
    for (const classSymbol of classSymbols) {
      if (symbol.startPosition.row >= classSymbol.startPosition.row &&
          symbol.endPosition.row <= classSymbol.endPosition.row &&
          symbol !== classSymbol) {
        return classSymbol.name;
      }
    }

    return undefined;
  }

  private findParentFunction(symbol: SymbolInfo, allSymbols: SymbolInfo[]): string | undefined {
    const functionSymbols = allSymbols.filter(s => s.type === 'function' || s.type === 'method');
    
    for (const funcSymbol of functionSymbols) {
      if (symbol.startPosition.row >= funcSymbol.startPosition.row &&
          symbol.endPosition.row <= funcSymbol.endPosition.row &&
          symbol !== funcSymbol) {
        return funcSymbol.name;
      }
    }

    return undefined;
  }

  private async analyzeDependencies(
    imports: any[],
    filePath: string,
    rootPath: string
  ): Promise<ContextualDependency[]> {
    const dependencies: ContextualDependency[] = [];

    for (const importInfo of imports) {
      const type = this.categorizeImport(importInfo.source);
      const importedSymbols = importInfo.specifiers?.map((spec: any) => spec.name) || [];

      dependencies.push({
        source: importInfo.source,
        type,
        usage: 'direct',
        importedSymbols,
        usageContext: [],
        isCircular: false // TODO: Check with dependency analyzer
      });
    }

    return dependencies;
  }

  private categorizeImport(source: string): 'internal' | 'external' | 'builtin' {
    if (source.startsWith('.') || source.startsWith('/')) {
      return 'internal';
    }

    const builtinModules = ['fs', 'path', 'util', 'crypto', 'http', 'https', 'os', 'url'];
    if (builtinModules.includes(source)) {
      return 'builtin';
    }

    return 'external';
  }

  private async buildCodeRelationships(
    filePath: string,
    symbols: ContextualSymbol[],
    dependencies: ContextualDependency[],
    rootPath: string,
    maxRelatedFiles: number
  ): Promise<CodeRelationship[]> {
    const relationships: CodeRelationship[] = [];

    // Symbol relationships within file
    for (const symbol of symbols) {
      for (const relatedName of symbol.context.relatedSymbols) {
        const relatedSymbol = symbols.find(s => s.name === relatedName);
        if (relatedSymbol) {
          relationships.push({
            type: 'usage',
            source: symbol.name,
            target: relatedSymbol.name,
            strength: 0.8,
            description: `${symbol.name} uses ${relatedSymbol.name}`,
            evidence: [`Same file: ${path.basename(filePath)}`]
          });
        }
      }
    }

    // Dependency relationships
    for (const dep of dependencies) {
      if (dep.type === 'internal') {
        relationships.push({
          type: 'dependency',
          source: path.basename(filePath),
          target: dep.source,
          strength: 0.9,
          description: `File depends on ${dep.source}`,
          evidence: [`Import: ${dep.importedSymbols.join(', ')}`]
        });
      }
    }

    return relationships;
  }

  private async analyzeSemanticContext(
    filePath: string,
    symbols: ContextualSymbol[],
    dependencies: ContextualDependency[]
  ): Promise<SemanticContext> {
    const fileName = path.basename(filePath);
    const content = await ops.promises.readFile(filePath, 'utf-8');

    // Determine purpose
    const purpose = this.inferPurpose(fileName, symbols, content);

    // Extract domain
    const domain = this.extractDomain(filePath, symbols, dependencies);

    // Detect patterns
    const patterns = this.detectDesignPatterns(content, symbols);

    // Calculate complexity
    const complexity = this.calculateComplexityMetrics(content, symbols);

    // Assess quality
    const quality = this.assessQuality(content, symbols, dependencies);

    return {
      purpose,
      domain,
      patterns,
      complexity,
      quality
    };
  }

  private inferPurpose(fileName: string, symbols: ContextualSymbol[], content: string): string {
    const name = fileName.toLowerCase();
    
    if (name.includes('test') || name.includes('spec')) return 'testing';
    if (name.includes('config')) return 'configuration';
    if (name.includes('util') || name.includes('helper')) return 'utility';
    if (name.includes('service')) return 'service';
    if (name.includes('component')) return 'ui_component';
    if (name.includes('model')) return 'data_model';
    if (name.includes('controller')) return 'controller';
    if (name.includes('router') || name.includes('route')) return 'routing';

    // Analyze symbol types
    const functionCount = symbols.filter(s => s.type === 'function').length;
    const classCount = symbols.filter(s => s.type === 'class').length;
    const interfaceCount = symbols.filter(s => s.type === 'interface').length;

    if (interfaceCount > functionCount && interfaceCount > classCount) return 'type_definitions';
    if (classCount > functionCount) return 'object_oriented';
    if (functionCount > 0) return 'functional';

    return 'unknown';
  }

  private extractDomain(filePath: string, symbols: ContextualSymbol[], dependencies: ContextualDependency[]): string[] {
    const domains: string[] = [];
    const pathParts = filePath.split(path.sep);

    // Extract from path
    for (const part of pathParts) {
      if (['auth', 'user', 'authentication'].includes(part.toLowerCase())) {
        domains.push('authentication');
      }
      if (['api', 'rest', 'graphql'].includes(part.toLowerCase())) {
        domains.push('api');
      }
      if (['ui', 'component', 'view'].includes(part.toLowerCase())) {
        domains.push('ui');
      }
      if (['data', 'model', 'database'].includes(part.toLowerCase())) {
        domains.push('data');
      }
    }

    // Extract from dependencies
    for (const dep of dependencies) {
      if (dep.source.includes('react')) domains.push('react');
      if (dep.source.includes('express')) domains.push('web_server');
      if (dep.source.includes('database') || dep.source.includes('sql')) domains.push('database');
      if (dep.source.includes('test')) domains.push('testing');
    }

    return [...new Set(domains)];
  }

  private detectDesignPatterns(content: string, symbols: ContextualSymbol[]): DesignPattern[] {
    const patterns: DesignPattern[] = [];

    // Singleton pattern detection
    if (content.includes('getInstance') && symbols.some(s => s.type === 'class')) {
      patterns.push({
        name: 'Singleton',
        confidence: 0.7,
        evidence: ['getInstance method found'],
        location: { startLine: 0, endLine: 0 }
      });
    }

    // Factory pattern detection
    if (content.includes('create') && symbols.some(s => s.name.toLowerCase().includes('factory'))) {
      patterns.push({
        name: 'Factory',
        confidence: 0.8,
        evidence: ['Factory class with create method'],
        location: { startLine: 0, endLine: 0 }
      });
    }

    // Observer pattern detection
    if (content.includes('subscribe') || content.includes('addEventListener')) {
      patterns.push({
        name: 'Observer',
        confidence: 0.6,
        evidence: ['Event subscription methods found'],
        location: { startLine: 0, endLine: 0 }
      });
    }

    return patterns;
  }

  private calculateComplexityMetrics(content: string, symbols: ContextualSymbol[]): ComplexityMetrics {
    const lines = content.split('\n');
    
    // Simple complexity calculations
    let cyclomatic = 1; // Base complexity
    let cognitive = 0;
    let maxNesting = 0;
    let currentNesting = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Cyclomatic complexity
      if (trimmed.includes('if') || trimmed.includes('while') || trimmed.includes('for') ||
          trimmed.includes('switch') || trimmed.includes('catch')) {
        cyclomatic++;
      }

      // Nesting level
      if (trimmed.includes('{')) currentNesting++;
      if (trimmed.includes('}')) currentNesting--;
      maxNesting = Math.max(maxNesting, currentNesting);

      // Cognitive complexity (simplified)
      if (trimmed.includes('if') || trimmed.includes('while') || trimmed.includes('for')) {
        cognitive += currentNesting + 1;
      }
    }

    return {
      cyclomatic,
      cognitive,
      nesting: maxNesting,
      dependencies: symbols.length
    };
  }

  private assessQuality(content: string, symbols: ContextualSymbol[], dependencies: ContextualDependency[]): QualityMetrics {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('*'));
    
    // Simple quality metrics
    const commentRatio = commentLines.length / lines.length;
    const averageLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const functionCount = symbols.filter(s => s.type === 'function').length;
    const classCount = symbols.filter(s => s.type === 'class').length;

    const maintainability = Math.min(1, commentRatio * 2 + (functionCount > 0 ? 0.3 : 0));
    const readability = Math.max(0, 1 - (averageLineLength - 50) / 100);
    const testability = functionCount > classCount ? 0.8 : 0.5;
    const reusability = dependencies.filter(d => d.type === 'external').length > 0 ? 0.7 : 0.4;

    return {
      maintainability: Math.max(0, Math.min(1, maintainability)),
      readability: Math.max(0, Math.min(1, readability)),
      testability: Math.max(0, Math.min(1, testability)),
      reusability: Math.max(0, Math.min(1, reusability))
    };
  }

  private async calculateCodeMetrics(filePath: string, symbols: ContextualSymbol[]): Promise<CodeMetrics> {
    const content = await ops.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const codeLines = lines.filter(line => line.trim().length > 0 && !line.trim().startsWith('//'));

    // Calculate basic metrics
    const linesOfCode = codeLines.length;
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(content);
    const cognitiveComplexity = this.calculateCognitiveComplexity(content);

    // Maintainability Index (simplified Microsoft formula)
    const averageLineLength = codeLines.reduce((sum, line) => sum + line.length, 0) / codeLines.length;
    const maintainabilityIndex = Math.max(0, 
      171 - 5.2 * Math.log(averageLineLength) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(linesOfCode)
    );

    // Technical debt estimation (simplified)
    const technicalDebt = (cyclomaticComplexity - 10) * 0.1 + (cognitiveComplexity - 15) * 0.05;

    return {
      linesOfCode,
      cyclomaticComplexity,
      cognitiveComplexity,
      maintainabilityIndex,
      technicalDebt: Math.max(0, technicalDebt)
    };
  }

  private calculateCyclomaticComplexity(content: string): number {
    let complexity = 1; // Base complexity
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?'];
    
    for (const keyword of complexityKeywords) {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateCognitiveComplexity(content: string): number {
    let complexity = 0;
    let nestingLevel = 0;
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Track nesting
      if (trimmed.includes('{')) nestingLevel++;
      if (trimmed.includes('}')) nestingLevel = Math.max(0, nestingLevel - 1);

      // Add complexity for control structures
      if (trimmed.includes('if') || trimmed.includes('while') || trimmed.includes('for')) {
        complexity += nestingLevel + 1;
      }
      if (trimmed.includes('switch')) {
        complexity += nestingLevel + 1;
      }
      if (trimmed.includes('catch')) {
        complexity += nestingLevel + 1;
      }
    }

    return complexity;
  }

  getSchema() {
    return {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Path to the file to analyze for context"
        },
        rootPath: {
          type: "string",
          description: "Root path of the project",
          default: "current working directory"
        },
        includeRelationships: {
          type: "boolean",
          description: "Include code relationships analysis",
          default: true
        },
        includeMetrics: {
          type: "boolean",
          description: "Include code quality metrics",
          default: true
        },
        includeSemantics: {
          type: "boolean",
          description: "Include semantic analysis and patterns",
          default: true
        },
        maxRelatedFiles: {
          type: "integer",
          description: "Maximum number of related files to analyze",
          default: 10,
          minimum: 1,
          maximum: 50
        },
        contextDepth: {
          type: "integer",
          description: "Depth of context analysis",
          default: 2,
          minimum: 1,
          maximum: 5
        }
      },
      required: ["filePath"]
    };
  }
}