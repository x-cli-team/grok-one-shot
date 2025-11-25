/**
 * Vector Search Engine (VSE) - Core semantic code search implementation
 * 
 * Provides Claude Code-level semantic search capabilities:
 * - "find authentication logic" 
 * - "locate error handling patterns"
 * - "show database connection code"
 * 
 * Integrates with existing AST parser and codebase explorer while maintaining
 * lightweight terminal performance.
 */

import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { ASTParserTool, SymbolInfo } from '../tools/intelligence/ast-parser.js';
import { CodebaseExplorer } from './codebase-explorer.js';
import { IncrementalIndexer, ChangeDetectionOptions } from './incremental-indexer.js';

export interface VectorSearchConfig {
  rootPath: string;
  maxFileSize: number;
  cacheEnabled: boolean;
  embeddingProvider: 'openai' | 'local';
  maxMemoryMB: number;
}

export interface CodeSymbol {
  id: string;
  name: string;
  type: 'function' | 'class' | 'interface' | 'variable' | 'import';
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  context: string;
  signature?: string;
  description?: string;
}

export interface SearchResult {
  symbol: CodeSymbol;
  similarity: number;
  explanation: string;
  filePath: string;
  line: number;
}

export interface IndexStats {
  totalSymbols: number;
  filesIndexed: number;
  memoryUsageMB: number;
  lastUpdated: Date;
  embeddingsGenerated: number;
}

/**
 * Core Vector Search Engine
 * 
 * Provides semantic code search by converting code symbols to vectors
 * and enabling similarity search across the codebase.
 */
export class VectorSearchEngine {
  private config: VectorSearchConfig;
  private astParser: ASTParserTool;
  private codebaseExplorer: CodebaseExplorer;
  private incrementalIndexer: IncrementalIndexer;
  private symbolCache = new Map<string, CodeSymbol>();
  private embeddingCache = new Map<string, Float32Array>();
  private isIndexed = false;
  private indexStats: IndexStats;

  constructor(config: Partial<VectorSearchConfig> = {}) {
    this.config = {
      rootPath: process.cwd(),
      maxFileSize: 1024 * 1024, // 1MB default
      cacheEnabled: true,
      embeddingProvider: 'openai',
      maxMemoryMB: 500,
      ...config
    };

    this.astParser = new ASTParserTool();
    this.codebaseExplorer = new CodebaseExplorer({
      maxExplorationDepth: 10,
      maxFileSize: this.config.maxFileSize,
      planGenerationTimeout: 30000,
      enableDetailedLogging: false,
      autoSavePlans: false,
      planSaveDirectory: '/tmp'
    });
    this.incrementalIndexer = new IncrementalIndexer();

    this.indexStats = {
      totalSymbols: 0,
      filesIndexed: 0,
      memoryUsageMB: 0,
      lastUpdated: new Date(),
      embeddingsGenerated: 0
    };
  }

  /**
   * Build semantic index with incremental support
   */
  async buildIndex(incremental = false): Promise<IndexStats> {
    console.log(`🔍 VSE: ${incremental ? 'Incrementally updating' : 'Building'} semantic index...`);
    const startTime = Date.now();

    try {
      let sourceFiles: string[];
      let filesToProcess: string[];

      if (incremental) {
        // Use incremental indexer to detect changes
        const changeOptions: ChangeDetectionOptions = {
          rootPath: this.config.rootPath,
          ignorePatterns: ['node_modules', '.git', 'dist', 'build'],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'],
          maxFileSize: this.config.maxFileSize,
          checksumEnabled: true
        };

        const changes = await this.incrementalIndexer.detectChanges(changeOptions);
        
        if (!changes.hasChanges) {
          console.log('📋 VSE: No changes detected, using existing index');
          return this.indexStats;
        }

        console.log(`📝 VSE: Detected ${changes.totalChanges} changes (${changes.addedFiles.length} added, ${changes.modifiedFiles.length} modified, ${changes.deletedFiles.length} deleted)`);

        // Remove symbols for deleted files
        for (const deletedFile of changes.deletedFiles) {
          this.removeSymbolsForFile(deletedFile);
        }

        // Process only changed files
        filesToProcess = [...changes.addedFiles, ...changes.modifiedFiles].map(f => f.filePath);
        sourceFiles = this.getSourceFiles(filesToProcess);
      } else {
        // Full indexing using codebase explorer with incremental support
        const explorationData = await this.codebaseExplorer.exploreCodebase({
          rootPath: this.config.rootPath,
          maxDepth: 10,
          ignorePatterns: ['node_modules', '.git', 'dist', 'build'],
          incremental: false,
          forceReindex: true
        });

        console.log(`📁 VSE: Found ${explorationData.projectStructure.totalFiles} files`);
        sourceFiles = this.getSourceFiles(explorationData.exploredPaths);
        filesToProcess = sourceFiles;
      }

      console.log(`⚙️  VSE: Processing ${filesToProcess.length} source files...`);

      // Process changed files
      let symbolCount = this.symbolCache.size; // Start with existing symbols
      for (const filePath of filesToProcess) {
        try {
          // Remove old symbols for this file if updating
          if (incremental) {
            this.removeSymbolsForFile(filePath);
          }

          const symbols = await this.extractSymbolsFromFile(filePath);
          for (const symbol of symbols) {
            this.symbolCache.set(symbol.id, symbol);
            symbolCount++;
          }
          
          // Memory management
          if (this.getMemoryUsageMB() > this.config.maxMemoryMB * 0.8) {
            console.log(`⚠️  VSE: Approaching memory limit, implementing LRU eviction...`);
            await this.evictLeastRecentlyUsed();
          }
          
        } catch (error) {
          console.warn(`⚠️  VSE: Failed to process ${filePath}:`, error);
          continue;
        }
      }

      // Generate embeddings for new/changed symbols
      if (incremental) {
        console.log(`🧠 VSE: Updating embeddings for ${filesToProcess.length} changed files...`);
        await this.generateEmbeddingsForFiles(filesToProcess);
      } else {
        console.log(`🧠 VSE: Generating embeddings for ${symbolCount} symbols...`);
        await this.generateEmbeddings();
      }

      // Update statistics
      this.indexStats = {
        totalSymbols: this.symbolCache.size,
        filesIndexed: incremental ? this.indexStats.filesIndexed : sourceFiles.length,
        memoryUsageMB: this.getMemoryUsageMB(),
        lastUpdated: new Date(),
        embeddingsGenerated: this.embeddingCache.size
      };

      this.isIndexed = true;
      const duration = Date.now() - startTime;
      
      console.log(`✅ VSE: ${incremental ? 'Incremental update' : 'Indexing'} complete in ${duration}ms`);
      console.log(`📊 VSE: ${this.symbolCache.size} symbols, ${this.indexStats.filesIndexed} files, ${this.getMemoryUsageMB()}MB memory`);
      
      return this.indexStats;

    } catch (error) {
      console.error('❌ VSE: Indexing failed:', error);
      throw error;
    }
  }

  /**
   * Semantic search across the codebase
   * 
   * @param query - Natural language query like "find authentication logic"
   * @param limit - Maximum number of results to return
   * @returns Ranked search results with similarity scores
   */
  async semanticSearch(query: string, limit = 10): Promise<SearchResult[]> {
    if (!this.isIndexed) {
      throw new Error('VSE: Codebase not indexed. Call buildIndex() first.');
    }

    console.log(`🔍 VSE: Searching for "${query}"...`);
    
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      // Find similar symbols using cosine similarity
      const similarities: Array<{symbol: CodeSymbol, similarity: number}> = [];
      
      for (const [symbolId, symbolEmbedding] of this.embeddingCache) {
        const similarity = this.cosineSimilarity(queryEmbedding, symbolEmbedding);
        const symbol = this.symbolCache.get(symbolId);
        
        if (symbol && similarity > 0.7) { // Threshold for relevance
          similarities.push({ symbol, similarity });
        }
      }
      
      // Sort by similarity and limit results
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topResults = similarities.slice(0, limit);
      
      // Format results with explanations
      const searchResults: SearchResult[] = topResults.map(({symbol, similarity}) => ({
        symbol,
        similarity,
        explanation: this.generateExplanation(query, symbol, similarity),
        filePath: symbol.filePath,
        line: symbol.startLine
      }));
      
      console.log(`✅ VSE: Found ${searchResults.length} relevant results`);
      return searchResults;
      
    } catch (error) {
      console.error('❌ VSE: Search failed:', error);
      throw error;
    }
  }

  /**
   * Update index for changed files (incremental indexing)
   */
  async updateIndex(changedFiles: string[]): Promise<void> {
    console.log(`🔄 VSE: Updating index for ${changedFiles.length} changed files...`);
    
    for (const filePath of changedFiles) {
      try {
        // Remove old symbols for this file
        const oldSymbolIds = Array.from(this.symbolCache.keys())
          .filter(id => this.symbolCache.get(id)?.filePath === filePath);
        
        for (const symbolId of oldSymbolIds) {
          this.symbolCache.delete(symbolId);
          this.embeddingCache.delete(symbolId);
        }
        
        // Add new symbols
        const newSymbols = await this.extractSymbolsFromFile(filePath);
        for (const symbol of newSymbols) {
          this.symbolCache.set(symbol.id, symbol);
        }
        
        // Generate embeddings for new symbols
        await this.generateEmbeddingsForSymbols(newSymbols);
        
      } catch (error) {
        console.warn(`⚠️  VSE: Failed to update ${filePath}:`, error);
      }
    }
    
    this.indexStats.lastUpdated = new Date();
    console.log(`✅ VSE: Index updated`);
  }

  /**
   * Get current indexing statistics
   */
  getStats(): IndexStats {
    return { ...this.indexStats };
  }

  /**
   * Clear all caches and reset index
   */
  async clearIndex(): Promise<void> {
    this.symbolCache.clear();
    this.embeddingCache.clear();
    this.isIndexed = false;
    this.indexStats = {
      totalSymbols: 0,
      filesIndexed: 0,
      memoryUsageMB: 0,
      lastUpdated: new Date(),
      embeddingsGenerated: 0
    };
    console.log('🗑️  VSE: Index cleared');
  }

  // Private implementation methods

  private getSourceFiles(paths: string[]): string[] {
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];
    return paths.filter(filePath => {
      const ext = path.extname(filePath);
      return sourceExtensions.includes(ext) && existsSync(filePath);
    });
  }

  private async extractSymbolsFromFile(filePath: string): Promise<CodeSymbol[]> {
    try {
      // Use existing AST parser
      const parseResult = await this.astParser.execute({
        filePath,
        includeSymbols: true,
        includeImports: true,
        includeTree: false
      });

      if (!parseResult.success || !parseResult.output) {
        return [];
      }

      const parsed = JSON.parse(parseResult.output);
      if (!parsed.success || !parsed.result?.symbols) {
        return [];
      }

      // Convert AST symbols to VSE format
      const symbols: CodeSymbol[] = [];
      const astSymbols = parsed.result.symbols as SymbolInfo[];
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const lines = fileContent.split('\n');

      for (const astSymbol of astSymbols) {
        const startLine = astSymbol.startPosition.row;
        const endLine = astSymbol.endPosition.row;
        const symbol: CodeSymbol = {
          id: `${filePath}:${astSymbol.name}:${startLine}`,
          name: astSymbol.name,
          type: this.mapSymbolType(astSymbol.type),
          filePath,
          startLine,
          endLine,
          content: this.extractSymbolContent(lines, startLine, endLine - startLine + 1),
          context: this.extractContext(lines, startLine),
          signature: this.buildSignature(astSymbol),
          description: `${astSymbol.type} in ${astSymbol.scope}`
        };
        symbols.push(symbol);
      }

      return symbols;

    } catch (error) {
      console.warn(`⚠️  VSE: Failed to extract symbols from ${filePath}:`, error);
      return [];
    }
  }

  private mapSymbolType(astType: string): CodeSymbol['type'] {
    const typeMap: Record<string, CodeSymbol['type']> = {
      'function': 'function',
      'method': 'function', 
      'class': 'class',
      'interface': 'interface',
      'variable': 'variable',
      'import': 'import',
      'const': 'variable',
      'let': 'variable',
      'var': 'variable'
    };
    return typeMap[astType] || 'variable';
  }

  private extractSymbolContent(lines: string[], startLine: number, length: number): string {
    const start = Math.max(0, startLine - 1);
    const end = Math.min(lines.length, start + length);
    return lines.slice(start, end).join('\n');
  }

  private extractContext(lines: string[], line: number, contextLines = 3): string {
    const start = Math.max(0, line - contextLines - 1);
    const end = Math.min(lines.length, line + contextLines);
    return lines.slice(start, end).join('\n');
  }

  private async generateEmbeddings(): Promise<void> {
    // For now, we'll implement a simple placeholder
    // In production, this would call OpenAI's embedding API
    console.log('🧠 VSE: Generating embeddings (placeholder implementation)...');
    
    for (const symbol of this.symbolCache.values()) {
      // Generate a simple hash-based embedding for development
      const embedding = this.generatePlaceholderEmbedding(symbol);
      this.embeddingCache.set(symbol.id, embedding);
    }
  }

  private async generateEmbeddingsForSymbols(symbols: CodeSymbol[]): Promise<void> {
    for (const symbol of symbols) {
      const embedding = this.generatePlaceholderEmbedding(symbol);
      this.embeddingCache.set(symbol.id, embedding);
    }
  }

  private async generateQueryEmbedding(query: string): Promise<Float32Array> {
    // Placeholder implementation - in production would use OpenAI
    return this.generatePlaceholderEmbedding({ content: query } as CodeSymbol);
  }

  private generatePlaceholderEmbedding(symbol: CodeSymbol | {content: string}): Float32Array {
    // Simple hash-based embedding for development
    const text = symbol.content + ('name' in symbol ? symbol.name || '' : '') + ('type' in symbol ? symbol.type || '' : '');
    const embedding = new Float32Array(384); // Standard embedding dimension
    
    for (let i = 0; i < 384; i++) {
      embedding[i] = Math.sin(this.hashCode(text + i) / 1000000);
    }
    
    return embedding;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateExplanation(query: string, symbol: CodeSymbol, similarity: number): string {
    const confidence = Math.round(similarity * 100);
    return `${confidence}% match: ${symbol.type} "${symbol.name}" - likely relevant to "${query}"`;
  }

  private getMemoryUsageMB(): number {
    const symbolSize = this.symbolCache.size * 1024; // Rough estimate
    const embeddingSize = this.embeddingCache.size * 384 * 4; // Float32Array bytes
    return Math.round((symbolSize + embeddingSize) / (1024 * 1024));
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    // Simple LRU eviction - remove 20% of oldest entries
    const entries = Array.from(this.symbolCache.entries());
    const toRemove = Math.floor(entries.length * 0.2);
    
    for (let i = 0; i < toRemove; i++) {
      const [symbolId] = entries[i];
      this.symbolCache.delete(symbolId);
      this.embeddingCache.delete(symbolId);
    }
    
    console.log(`🗑️  VSE: Evicted ${toRemove} symbols to free memory`);
  }

  /**
   * Build signature string from symbol info
   */
  private buildSignature(astSymbol: SymbolInfo): string {
    if (astSymbol.type === 'function' || astSymbol.type === 'method') {
      const params = astSymbol.parameters?.map(p => `${p.name}: ${p.type}`).join(', ') || '';
      const returnType = astSymbol.returnType || 'void';
      return `${astSymbol.name}(${params}): ${returnType}`;
    }
    return astSymbol.name;
  }

  /**
   * Remove all symbols for a specific file
   */
  private removeSymbolsForFile(filePath: string): void {
    const symbolsToRemove = Array.from(this.symbolCache.keys())
      .filter(id => this.symbolCache.get(id)?.filePath === filePath);
    
    for (const symbolId of symbolsToRemove) {
      this.symbolCache.delete(symbolId);
      this.embeddingCache.delete(symbolId);
    }
  }

  /**
   * Generate embeddings for symbols in specific files
   */
  private async generateEmbeddingsForFiles(filePaths: string[]): Promise<void> {
    const relevantSymbols = Array.from(this.symbolCache.values())
      .filter(symbol => filePaths.includes(symbol.filePath));
    
    for (const symbol of relevantSymbols) {
      const embedding = this.generatePlaceholderEmbedding(symbol);
      this.embeddingCache.set(symbol.id, embedding);
    }
  }

  /**
   * Get incremental indexer statistics
   */
  getIncrementalStats(): {
    hasSnapshot: boolean;
    snapshotTimestamp: Date | null;
    snapshotFileCount: number;
  } {
    const stats = this.incrementalIndexer.getSnapshotStats(this.config.rootPath);
    return {
      hasSnapshot: stats.exists,
      snapshotTimestamp: stats.timestamp,
      snapshotFileCount: stats.fileCount
    };
  }

  /**
   * Clear incremental indexer snapshots
   */
  clearIncrementalSnapshots(): void {
    this.incrementalIndexer.clearSnapshot(this.config.rootPath);
  }
}