/**
 * Vector Search Tool - CLI interface for semantic code search
 * 
 * Provides the user-facing interface for the Vector Search Engine,
 * enabling natural language queries like "find authentication logic"
 */

import { ToolResult } from '../../types/index.js';
import { VectorSearchEngine, VectorSearchConfig } from '../../services/vector-search-engine.js';

export interface VectorSearchArgs {
  query?: string;
  action?: 'search' | 'index' | 'stats' | 'clear' | 'incremental';
  rootPath?: string;
  limit?: number;
  forceReindex?: boolean;
  incremental?: boolean;
}

/**
 * Vector Search Tool
 * 
 * Enables semantic code search across the entire codebase using natural language queries.
 * This is the key differentiator that brings Claude Code-level search capabilities to the terminal.
 */
export class VectorSearchTool {
  name = 'vector_search';
  description = 'Semantic code search using natural language queries. Find code patterns, functions, and logic using descriptions like "authentication", "error handling", "database connections".';

  private engine: VectorSearchEngine | null = null;
  private isIndexing = false;

  async execute(args: VectorSearchArgs): Promise<ToolResult> {
    try {
      const {
        query,
        action = 'search',
        rootPath = process.cwd(),
        limit = 10,
        forceReindex = false
      } = args;

      // Initialize engine if needed
      if (!this.engine) {
        this.engine = new VectorSearchEngine({
          rootPath,
          maxFileSize: 1024 * 1024, // 1MB
          cacheEnabled: true,
          embeddingProvider: 'openai',
          maxMemoryMB: 500
        });
      }

      switch (action) {
        case 'index':
          return await this.handleIndex(forceReindex, false);
          
        case 'incremental':
          return await this.handleIndex(false, true);
          
        case 'search':
          if (!query) {
            return {
              success: false,
              error: 'Query is required for search action. Example: "find authentication logic"'
            };
          }
          return await this.handleSearch(query, limit);
          
        case 'stats':
          return await this.handleStats();
          
        case 'clear':
          return await this.handleClear();
          
        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Use: search, index, incremental, stats, or clear`
          };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async handleIndex(forceReindex: boolean, incremental: boolean): Promise<ToolResult> {
    if (this.isIndexing) {
      return {
        success: false,
        error: 'Indexing already in progress. Please wait for completion.'
      };
    }

    try {
      this.isIndexing = true;
      
      if (forceReindex && this.engine) {
        await this.engine.clearIndex();
        await this.engine.clearIncrementalSnapshots();
      }

      const stats = await this.engine!.buildIndex(incremental);
      const incrementalStats = this.engine!.getIncrementalStats();
      
      const indexType = incremental ? 'Incremental Update' : 'Full Index Build';
      const output = `🎯 Vector Search ${indexType} Completed Successfully

📊 **Index Statistics**:
- **Symbols Indexed**: ${stats.totalSymbols.toLocaleString()}
- **Files Processed**: ${stats.filesIndexed.toLocaleString()}  
- **Memory Usage**: ${stats.memoryUsageMB}MB
- **Embeddings Generated**: ${stats.embeddingsGenerated.toLocaleString()}
- **Last Updated**: ${stats.lastUpdated.toLocaleString()}

🔄 **Incremental Indexing**:
- **Snapshot Available**: ${incrementalStats.hasSnapshot ? '✅ Yes' : '❌ No'}
- **Snapshot Timestamp**: ${incrementalStats.snapshotTimestamp?.toLocaleString() || 'N/A'}
- **Tracked Files**: ${incrementalStats.snapshotFileCount.toLocaleString()}

✅ **Ready for Semantic Search**
Now you can search with natural language queries like:
- \`grok vector-search --query="find user authentication"\`
- \`grok vector-search --query="locate error handling patterns"\`
- \`grok vector-search --query="show database connection code"\`

💡 **Performance Tips**:
- Use \`--action=incremental\` for faster updates after code changes
- Full reindex with \`--action=index --forceReindex=true\` when needed

🚀 **Claude Code Parity**: Enhanced with incremental indexing for optimal performance!`;

      return {
        success: true,
        output
      };

    } catch (error) {
      return {
        success: false,
        error: `${incremental ? 'Incremental indexing' : 'Indexing'} failed: ${error instanceof Error ? error.message : String(error)}`
      };
    } finally {
      this.isIndexing = false;
    }
  }

  private async handleSearch(query: string, limit: number): Promise<ToolResult> {
    try {
      const results = await this.engine!.semanticSearch(query, limit);
      
      if (results.length === 0) {
        return {
          success: true,
          output: `🔍 No results found for "${query}"

💡 **Tips for better results**:
- Try broader terms: "auth" instead of "authentication middleware" 
- Use descriptive keywords: "error", "database", "validation"
- Check if codebase is indexed: \`grok vector-search --action=stats\`

Run \`grok vector-search --action=index\` if codebase isn't indexed yet.`
        };
      }

      let output = `🎯 Found ${results.length} relevant results for "${query}"\n\n`;
      
      results.forEach((result, index) => {
        const confidence = Math.round(result.similarity * 100);
        const relativePath = result.filePath.replace(process.cwd(), '.');
        
        output += `**${index + 1}. ${result.symbol.name}** (${confidence}% match)\n`;
        output += `   📁 \`${relativePath}:${result.line}\`\n`;
        output += `   🏷️  ${result.symbol.type}\n`;
        output += `   💬 ${result.explanation}\n`;
        
        if (result.symbol.signature) {
          output += `   📝 \`${result.symbol.signature}\`\n`;
        }
        
        output += '\n';
      });
      
      output += `\n💡 **Next Steps**:
- Open files with: \`grok read ${results[0].filePath}\`
- Get more context: \`grok search "${query}" --limit=20\`
- Refine search: Try related terms or be more specific`;

      return {
        success: true,
        output
      };

    } catch (error) {
      if (error instanceof Error && error.message.includes('not indexed')) {
        return {
          success: false,
          error: `Codebase not indexed yet. Run: \`grok vector-search --action=index\` first.`
        };
      }
      
      return {
        success: false,
        error: `Search failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async handleStats(): Promise<ToolResult> {
    if (!this.engine) {
      return {
        success: true,
        output: '📊 Vector Search Engine not initialized. Run indexing first.'
      };
    }

    const stats = this.engine.getStats();
    const incrementalStats = this.engine.getIncrementalStats();
    
    const output = `📊 **Vector Search Engine Statistics**

**Index Status**: ${stats.totalSymbols > 0 ? '✅ Ready' : '❌ Not Indexed'}
**Symbols Indexed**: ${stats.totalSymbols.toLocaleString()}
**Files Processed**: ${stats.filesIndexed.toLocaleString()}
**Memory Usage**: ${stats.memoryUsageMB}MB
**Embeddings**: ${stats.embeddingsGenerated.toLocaleString()}
**Last Updated**: ${stats.lastUpdated.toLocaleString()}

🔄 **Incremental Indexing**:
**Snapshot Available**: ${incrementalStats.hasSnapshot ? '✅ Yes' : '❌ No'}
**Snapshot Timestamp**: ${incrementalStats.snapshotTimestamp?.toLocaleString() || 'N/A'}
**Tracked Files**: ${incrementalStats.snapshotFileCount.toLocaleString()}

${stats.totalSymbols === 0 ? 
  '\n🚀 **Get Started**: Run `grok vector-search --action=index` to build the search index.' : 
  '\n✅ **Ready**: Search with `grok vector-search --query="your search here"`\n💡 **Tip**: Use `--action=incremental` for fast updates after code changes'}`;

    return {
      success: true,
      output
    };
  }

  private async handleClear(): Promise<ToolResult> {
    if (!this.engine) {
      return {
        success: true,
        output: '✅ No index to clear.'
      };
    }

    await this.engine.clearIndex();
    await this.engine.clearIncrementalSnapshots();
    
    return {
      success: true,
      output: `🗑️  **Vector Search Index Cleared**

All cached symbols, embeddings, and incremental snapshots have been removed.
Memory freed and ready for fresh indexing.

Run \`grok vector-search --action=index\` to rebuild the index.
Use \`--action=incremental\` for faster subsequent updates.`
    };
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query (e.g., "find authentication logic", "error handling patterns")'
        },
        action: {
          type: 'string',
          enum: ['search', 'index', 'incremental', 'stats', 'clear'],
          description: 'Action to perform: search (default), index, incremental, stats, or clear',
          default: 'search'
        },
        rootPath: {
          type: 'string',
          description: 'Root path for codebase indexing (defaults to current directory)'
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of search results to return',
          default: 10,
          minimum: 1,
          maximum: 50
        },
        forceReindex: {
          type: 'boolean',
          description: 'Force complete reindexing (clears existing index first)',
          default: false
        }
      }
    };
  }
}