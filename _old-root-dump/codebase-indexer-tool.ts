/**
 * Codebase Indexer Tool
 * 
 * Provides AI access to comprehensive codebase indexing and search capabilities.
 * Enables intelligent project analysis, symbol search, and dependency mapping.
 */

import { z } from "zod";
import { CodebaseIndexer, IndexingProgress, CodeSymbol, DependencyInfo } from "../services/codebase-indexer.js";
import { ToolResult } from "../types/index.js";
import path from 'path';

// Schema for indexing a codebase
const IndexCodebaseSchema = z.object({
  path: z.string().optional().describe("Directory path to index (defaults to current working directory)"),
  maxFileSize: z.number().optional().describe("Maximum file size to index in bytes (default: 5MB)"),
  excludePatterns: z.array(z.string()).optional().describe("Additional patterns to exclude"),
  includePatterns: z.array(z.string()).optional().describe("Specific patterns to include"),
  extractSymbols: z.boolean().optional().describe("Whether to extract symbols (default: true)"),
  analyzeDependencies: z.boolean().optional().describe("Whether to analyze dependencies (default: true)")
});

// Schema for symbol search
const SearchSymbolsSchema = z.object({
  query: z.string().describe("Search query for symbols"),
  type: z.enum(['function', 'class', 'interface', 'variable', 'constant', 'type', 'enum', 'import', 'export']).optional().describe("Filter by symbol type"),
  fuzzy: z.boolean().optional().describe("Enable fuzzy matching (default: true)"),
  limit: z.number().optional().describe("Maximum number of results (default: 50)")
});

// Schema for finding symbol references
const FindReferencesSchema = z.object({
  symbolName: z.string().describe("Name of the symbol to find references for"),
  includeDefinition: z.boolean().optional().describe("Include the symbol definition (default: true)")
});

// Schema for dependency analysis
const GetDependenciesSchema = z.object({
  filePath: z.string().describe("File path to analyze dependencies for"),
  direction: z.enum(['incoming', 'outgoing', 'both']).optional().describe("Direction of dependencies (default: both)")
});

export class CodebaseIndexerTool {
  private indexer: CodebaseIndexer;
  private currentIndexPath: string | null = null;

  constructor() {
    this.indexer = new CodebaseIndexer();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.indexer.on('indexing-started', (data) => {
      console.log(`[CodebaseIndexer] Started indexing: ${data.projectRoot}`);
    });

    this.indexer.on('progress', (progress: IndexingProgress) => {
      const percent = Math.round((progress.filesProcessed / progress.totalFiles) * 100);
      console.log(`[CodebaseIndexer] ${progress.phase}: ${percent}% (${progress.currentFile})`);
    });

    this.indexer.on('indexing-completed', (data) => {
      console.log(`[CodebaseIndexer] Completed in ${data.duration}ms`);
    });
  }

  /**
   * Index a codebase for comprehensive analysis
   */
  async indexCodebase(args: z.infer<typeof IndexCodebaseSchema>): Promise<ToolResult> {
    try {
      const targetPath = args.path ? path.resolve(args.path) : process.cwd();
      
      // Configure indexer options
      const options = {
        ...(args.maxFileSize && { maxFileSize: args.maxFileSize }),
        ...(args.excludePatterns && { excludePatterns: args.excludePatterns }),
        ...(args.includePatterns && { includePatterns: args.includePatterns }),
        ...(args.extractSymbols !== undefined && { extractSymbols: args.extractSymbols }),
        ...(args.analyzeDependencies !== undefined && { analyzeDependencies: args.analyzeDependencies })
      };

      // Create new indexer with options
      this.indexer = new CodebaseIndexer(options);
      this.setupEventHandlers();

      console.log(`[CodebaseIndexer] Starting indexing of: ${targetPath}`);
      const index = await this.indexer.indexCodebase(targetPath);
      this.currentIndexPath = targetPath;

      const summary = {
        projectRoot: index.projectRoot,
        projectType: index.structure.projectType,
        stats: {
          totalFiles: index.stats.totalFiles,
          totalLines: index.stats.totalLines,
          totalSymbols: index.stats.totalSymbols,
          totalDependencies: index.stats.totalDependencies,
          indexingDuration: `${(index.stats.indexingDuration / 1000).toFixed(2)}s`,
          languageDistribution: index.stats.languageDistribution,
          complexity: index.stats.complexity
        },
        structure: {
          configFiles: index.structure.configFiles.map(f => path.basename(f)),
          packageManagers: index.structure.packageManagers,
          entryPoints: index.structure.entryPoints.map(f => path.relative(targetPath, f)),
          topDirectories: index.structure.directories
            .sort((a, b) => b.fileCount - a.fileCount)
            .slice(0, 10)
            .map(d => ({
              path: path.relative(targetPath, d.path),
              purpose: d.purpose,
              fileCount: d.fileCount,
              totalSize: `${(d.totalSize / 1024).toFixed(1)} KB`
            }))
        }
      };

      return {
        success: true,
        output: `# Codebase Indexing Complete 🎯

## Project Overview
- **Root**: ${summary.projectRoot}
- **Type**: ${summary.projectType}
- **Duration**: ${summary.stats.indexingDuration}

## Statistics
- **Files**: ${summary.stats.totalFiles.toLocaleString()}
- **Lines**: ${summary.stats.totalLines.toLocaleString()}
- **Symbols**: ${summary.stats.totalSymbols.toLocaleString()}
- **Dependencies**: ${summary.stats.totalDependencies.toLocaleString()}

## Language Distribution
${Object.entries(summary.stats.languageDistribution)
  .map(([lang, count]) => `- **${lang}**: ${count} files`)
  .join('\n')}

## Project Structure
- **Config Files**: ${summary.structure.configFiles.join(', ')}
- **Package Managers**: ${summary.structure.packageManagers.join(', ')}
- **Entry Points**: ${summary.structure.entryPoints.join(', ')}

## Top Directories by File Count
${summary.structure.topDirectories
  .map(d => `- **${d.path}** (${d.purpose}): ${d.fileCount} files, ${d.totalSize}`)
  .join('\n')}

## Complexity Metrics
- **Avg File Size**: ${summary.stats.complexity.averageFileSize} bytes
- **Symbol Density**: ${summary.stats.complexity.symbolDensity} symbols/file
- **Dependency Complexity**: ${summary.stats.complexity.dependencyComplexity} deps/file

The codebase is now indexed and ready for advanced search and analysis operations.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to index codebase: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Search for symbols across the indexed codebase
   */
  async searchSymbols(args: z.infer<typeof SearchSymbolsSchema>): Promise<ToolResult> {
    try {
      const index = this.indexer.getIndex();
      if (!index) {
        return {
          success: false,
          error: "No codebase index available. Please run index_codebase first."
        };
      }

      const results = this.indexer.searchSymbols(args.query, {
        type: args.type,
        fuzzy: args.fuzzy ?? true,
        limit: args.limit ?? 50
      });

      if (results.length === 0) {
        return {
          success: true,
          output: `No symbols found matching "${args.query}".`
        };
      }

      const formatSymbol = (symbol: CodeSymbol) => {
        const relativePath = path.relative(index.projectRoot, symbol.filePath);
        const location = `${relativePath}:${symbol.line}`;
        const visibility = symbol.visibility !== 'internal' ? ` (${symbol.visibility})` : '';
        const parent = symbol.parent ? ` in ${symbol.parent}` : '';
        const signature = symbol.signature ? `\n    Signature: ${symbol.signature}` : '';
        const docs = symbol.documentation ? `\n    Docs: ${symbol.documentation}` : '';
        
        return `  **${symbol.name}** (${symbol.type})${visibility}${parent}
    Location: ${location}${signature}${docs}`;
      };

      const groupedResults = results.reduce((groups, symbol) => {
        if (!groups[symbol.type]) groups[symbol.type] = [];
        groups[symbol.type].push(symbol);
        return groups;
      }, {} as Record<string, CodeSymbol[]>);

      let output = `# Symbol Search Results for "${args.query}" 🔍\n\nFound ${results.length} symbols`;
      if (args.type) output += ` of type "${args.type}"`;
      output += ':\n\n';

      for (const [type, symbols] of Object.entries(groupedResults)) {
        output += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s (${symbols.length})\n\n`;
        output += symbols.slice(0, 20).map(formatSymbol).join('\n\n');
        if (symbols.length > 20) {
          output += `\n\n... and ${symbols.length - 20} more ${type}s`;
        }
        output += '\n\n';
      }

      return {
        success: true,
        output: output.trim()
      };

    } catch (error) {
      return {
        success: false,
        error: `Symbol search failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Find all references to a specific symbol
   */
  async findReferences(args: z.infer<typeof FindReferencesSchema>): Promise<ToolResult> {
    try {
      const index = this.indexer.getIndex();
      if (!index) {
        return {
          success: false,
          error: "No codebase index available. Please run index_codebase first."
        };
      }

      const references = this.indexer.findSymbolReferences(args.symbolName);

      if (references.length === 0) {
        return {
          success: true,
          output: `No references found for symbol "${args.symbolName}".`
        };
      }

      const groupedRefs = references.reduce((groups, ref) => {
        const relativePath = path.relative(index.projectRoot, ref.filePath);
        if (!groups[relativePath]) groups[relativePath] = [];
        groups[relativePath].push(ref);
        return groups;
      }, {} as Record<string, CodeSymbol[]>);

      let output = `# References for "${args.symbolName}" 📋\n\nFound ${references.length} references across ${Object.keys(groupedRefs).length} files:\n\n`;

      for (const [file, refs] of Object.entries(groupedRefs)) {
        output += `## ${file}\n\n`;
        refs.forEach(ref => {
          const type = ref.type === 'import' ? 'imported' : ref.type;
          output += `- Line ${ref.line}: **${ref.name}** (${type})`;
          if (ref.signature) output += ` - \`${ref.signature}\``;
          output += '\n';
        });
        output += '\n';
      }

      return {
        success: true,
        output: output.trim()
      };

    } catch (error) {
      return {
        success: false,
        error: `Reference search failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get dependency information for a file
   */
  async getDependencies(args: z.infer<typeof GetDependenciesSchema>): Promise<ToolResult> {
    try {
      const index = this.indexer.getIndex();
      if (!index) {
        return {
          success: false,
          error: "No codebase index available. Please run index_codebase first."
        };
      }

      const targetPath = path.resolve(args.filePath);
      const dependencies = this.indexer.getFileDependencies(targetPath);

      if (dependencies.length === 0) {
        return {
          success: true,
          output: `No dependencies found for "${args.filePath}".`
        };
      }

      const direction = args.direction ?? 'both';
      const filtered = dependencies.filter(dep => {
        if (direction === 'incoming') return dep.to === targetPath;
        if (direction === 'outgoing') return dep.from === targetPath;
        return true;
      });

      const incoming = filtered.filter(dep => dep.to === targetPath);
      const outgoing = filtered.filter(dep => dep.from === targetPath);

      let output = `# Dependencies for "${path.relative(index.projectRoot, targetPath)}" 📦\n\n`;

      if (direction === 'both' || direction === 'outgoing') {
        output += `## Outgoing Dependencies (${outgoing.length})\n`;
        output += 'Files and modules this file depends on:\n\n';
        
        if (outgoing.length === 0) {
          output += '*No outgoing dependencies*\n\n';
        } else {
          outgoing.forEach(dep => {
            const target = dep.isExternal ? dep.to : path.relative(index.projectRoot, dep.to);
            const external = dep.isExternal ? ' (external)' : '';
            output += `- **${target}**${external}\n`;
            if (dep.symbols.length > 0) {
              output += `  - Imports: ${dep.symbols.join(', ')}\n`;
            }
          });
          output += '\n';
        }
      }

      if (direction === 'both' || direction === 'incoming') {
        output += `## Incoming Dependencies (${incoming.length})\n`;
        output += 'Files that depend on this file:\n\n';
        
        if (incoming.length === 0) {
          output += '*No incoming dependencies*\n\n';
        } else {
          incoming.forEach(dep => {
            const source = path.relative(index.projectRoot, dep.from);
            output += `- **${source}**\n`;
            if (dep.symbols.length > 0) {
              output += `  - Uses: ${dep.symbols.join(', ')}\n`;
            }
          });
          output += '\n';
        }
      }

      // Circular dependencies warning
      const circular = outgoing.some(out => 
        incoming.some(inc => inc.from === out.to)
      );
      
      if (circular) {
        output += '⚠️ **Warning**: Potential circular dependencies detected!\n';
      }

      return {
        success: true,
        output: output.trim()
      };

    } catch (error) {
      return {
        success: false,
        error: `Dependency analysis failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get current index status and statistics
   */
  async getIndexStatus(): Promise<ToolResult> {
    try {
      const index = this.indexer.getIndex();
      
      if (!index) {
        return {
          success: true,
          output: "No codebase index available. Use index_codebase to create one."
        };
      }

      const age = Date.now() - index.createdAt.getTime();
      const ageStr = age < 60000 ? `${Math.round(age/1000)}s` :
                    age < 3600000 ? `${Math.round(age/60000)}m` :
                    `${Math.round(age/3600000)}h`;

      return {
        success: true,
        output: `# Codebase Index Status 📊

## Index Information
- **Project**: ${path.basename(index.projectRoot)}
- **Created**: ${index.createdAt.toLocaleString()} (${ageStr} ago)
- **Last Updated**: ${index.updatedAt.toLocaleString()}

## Statistics
- **Files Indexed**: ${index.stats.totalFiles.toLocaleString()}
- **Lines of Code**: ${index.stats.totalLines.toLocaleString()}
- **Symbols Extracted**: ${index.stats.totalSymbols.toLocaleString()}
- **Dependencies Mapped**: ${index.stats.totalDependencies.toLocaleString()}

## Available Operations
- **search_symbols**: Find functions, classes, variables across the codebase
- **find_references**: Locate all uses of a specific symbol
- **get_dependencies**: Analyze file dependencies and relationships

Index is ready for advanced code analysis and search operations.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Status check failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Export schemas for tool registration
  static get schemas() {
    return {
      index_codebase: {
        description: "Index a codebase for comprehensive analysis and search",
        parameters: IndexCodebaseSchema
      },
      search_symbols: {
        description: "Search for symbols (functions, classes, variables) across the codebase",
        parameters: SearchSymbolsSchema
      },
      find_references: {
        description: "Find all references to a specific symbol",
        parameters: FindReferencesSchema
      },
      get_dependencies: {
        description: "Get dependency information for a file",
        parameters: GetDependenciesSchema
      },
      get_index_status: {
        description: "Get current codebase index status and statistics",
        parameters: z.object({})
      }
    };
  }
}

// Export for use in tool registration
export const codebaseIndexerTool = new CodebaseIndexerTool();