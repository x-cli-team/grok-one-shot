/**
 * Semantic Code Search Tool
 * 
 * Advanced semantic search capabilities for indexed codebases using
 * natural language queries and intelligent pattern recognition.
 */

import { z } from "zod";
import { SemanticCodeSearch, SemanticQuery, SemanticResult } from "../services/semantic-code-search.js";
import { CodebaseIndexer } from "../services/codebase-indexer.js";
import { ToolResult } from "../types/index.js";
import path from 'path';

// Schema for semantic search
const SemanticSearchSchema = z.object({
  query: z.string().describe("Natural language query (e.g., 'find authentication logic', 'how does user registration work')"),
  intent: z.enum(['find_function', 'understand_flow', 'locate_feature', 'trace_usage', 'find_patterns', 'general']).optional().describe("Search intent (auto-detected if not specified)"),
  scope: z.enum(['project', 'directory', 'file', 'function']).optional().describe("Search scope (default: project)"),
  scopePath: z.string().optional().describe("Path to scope to (for directory/file scope)"),
  confidence: z.number().min(0).max(1).optional().describe("Minimum confidence threshold (default: 0.3)"),
  maxResults: z.number().min(1).max(100).optional().describe("Maximum results to return (default: 20)")
});

// Schema for code flow tracing
const TraceFlowSchema = z.object({
  entryPoint: z.string().describe("Function or symbol name to start tracing from"),
  maxDepth: z.number().min(1).max(10).optional().describe("Maximum depth to trace (default: 5)")
});

// Schema for feature mapping
const MapFeaturesSchema = z.object({
  includeTestCoverage: z.boolean().optional().describe("Include test coverage analysis (default: false)"),
  complexityThreshold: z.enum(['low', 'medium', 'high']).optional().describe("Minimum complexity to include (default: low)")
});

// Schema for symbol relationships
const FindRelatedSchema = z.object({
  symbolName: z.string().describe("Symbol name to find relationships for"),
  includeUsage: z.boolean().optional().describe("Include usage patterns (default: true)"),
  maxRelated: z.number().min(1).max(50).optional().describe("Maximum related symbols (default: 20)")
});

export class SemanticSearchTool {
  private searchService: SemanticCodeSearch | null = null;
  private indexer: CodebaseIndexer | null = null;

  /**
   * Initialize the semantic search service with an indexer
   */
  private async ensureInitialized(): Promise<SemanticCodeSearch> {
    if (!this.searchService) {
      // Try to get indexer from codebase indexer tool
      try {
        const { codebaseIndexerTool } = await import('./codebase-indexer-tool.js');
        this.indexer = (codebaseIndexerTool as any).indexer;
        
        if (!this.indexer?.getIndex()) {
          throw new Error('No codebase index available. Please run index_codebase first.');
        }
        
        this.searchService = new SemanticCodeSearch(this.indexer);
      } catch (error) {
        throw new Error('Failed to initialize semantic search: ' + (error as Error).message);
      }
    }
    
    return this.searchService;
  }

  /**
   * Perform semantic search with natural language queries
   */
  async semanticSearch(args: z.infer<typeof SemanticSearchSchema>): Promise<ToolResult> {
    try {
      const searchService = await this.ensureInitialized();
      
      const results = await searchService.search(args.query, {
        intent: args.intent,
        scope: args.scope || 'project',
        scopePath: args.scopePath,
        confidence: args.confidence || 0.3,
        maxResults: args.maxResults || 20
      });

      if (results.length === 0) {
        return {
          success: true,
          output: `No results found for query: "${args.query}"\n\nTry:\n- Using different keywords\n- Lowering confidence threshold\n- Broadening the search scope`
        };
      }

      const formatResult = (result: SemanticResult, index: number) => {
        const confidence = Math.round(result.relevance * 100);
        
        if (result.symbol) {
          const relativePath = path.relative(process.cwd(), result.symbol.filePath);
          const location = `${relativePath}:${result.symbol.line}`;
          const typeInfo = result.symbol.type === 'function' && result.symbol.signature ? 
            `\n    Signature: ${result.symbol.signature}` : '';
          
          let output = `## ${index + 1}. ${result.symbol.name} (${result.symbol.type}) - ${confidence}%\n`;
          output += `   **Location**: ${location}\n`;
          output += `   **Reason**: ${result.reason}${typeInfo}\n`;
          
          if (result.context) {
            output += `   **Context**:\n\`\`\`\n${result.context}\n\`\`\`\n`;
          }
          
          if (result.relatedSymbols && result.relatedSymbols.length > 0) {
            const related = result.relatedSymbols.map(s => s.name).join(', ');
            output += `   **Related**: ${related}\n`;
          }
          
          return output;
        } else if (result.filePath) {
          const relativePath = path.relative(process.cwd(), result.filePath);
          
          let output = `## ${index + 1}. File Match - ${confidence}%\n`;
          output += `   **File**: ${relativePath}\n`;
          output += `   **Reason**: ${result.reason}\n`;
          
          if (result.context) {
            output += `   **Context**:\n\`\`\`\n${result.context}\n\`\`\`\n`;
          }
          
          return output;
        }
        
        return '';
      };

      const groupedResults = results.reduce((groups, result) => {
        const type = result.symbol?.type || 'file_content';
        if (!groups[type]) groups[type] = [];
        groups[type].push(result);
        return groups;
      }, {} as Record<string, SemanticResult[]>);

      let output = `# Semantic Search Results for "${args.query}" 🔍\n\n`;
      output += `Found ${results.length} results with confidence ≥ ${Math.round((args.confidence || 0.3) * 100)}%:\n\n`;

      // Show results grouped by type
      for (const [type, typeResults] of Object.entries(groupedResults)) {
        if (typeResults.length === 0) continue;
        
        const typeTitle = type === 'file_content' ? 'File Content' : 
                         `${type.charAt(0).toUpperCase() + type.slice(1)}s`;
        
        output += `# ${typeTitle} (${typeResults.length})\n\n`;
        output += typeResults.slice(0, 10).map(formatResult).join('\n');
        
        if (typeResults.length > 10) {
          output += `\n*... and ${typeResults.length - 10} more ${type} results*\n`;
        }
        output += '\n';
      }

      // Add search suggestions
      output += `\n## 💡 Related Searches\n`;
      output += `- **Trace flow**: Use \`trace_code_flow\` to understand execution paths\n`;
      output += `- **Find usage**: Use \`find_related_symbols\` for symbol relationships\n`;
      output += `- **Map features**: Use \`map_features\` for architectural overview\n`;

      return {
        success: true,
        output
      };

    } catch (error) {
      return {
        success: false,
        error: `Semantic search failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Trace code flow from an entry point
   */
  async traceCodeFlow(args: z.infer<typeof TraceFlowSchema>): Promise<ToolResult> {
    try {
      const searchService = await this.ensureInitialized();
      
      const flowTrace = await searchService.traceCodeFlow(args.entryPoint, args.maxDepth || 5);

      const entryPath = path.relative(process.cwd(), flowTrace.entryPoint.filePath);
      const entryLocation = `${entryPath}:${flowTrace.entryPoint.line}`;

      let output = `# Code Flow Trace for "${args.entryPoint}" 🔍\n\n`;
      output += `**Entry Point**: ${flowTrace.entryPoint.name} (${flowTrace.entryPoint.type})\n`;
      output += `**Location**: ${entryLocation}\n`;
      output += `**Complexity**: ${flowTrace.complexity}\n`;
      output += `**Steps**: ${flowTrace.steps.length}\n\n`;

      if (flowTrace.patterns.length > 0) {
        output += `**Patterns Detected**: ${flowTrace.patterns.join(', ')}\n\n`;
      }

      output += `## Execution Flow\n\n`;
      
      for (let i = 0; i < flowTrace.steps.length; i++) {
        const step = flowTrace.steps[i];
        const stepPath = path.relative(process.cwd(), step.symbol.filePath);
        const stepLocation = `${stepPath}:${step.symbol.line}`;
        const confidence = Math.round(step.confidence * 100);
        
        output += `${i + 1}. **${step.symbol.name}** (${step.type})\n`;
        output += `   Location: ${stepLocation}\n`;
        output += `   Confidence: ${confidence}%\n`;
        output += `   Description: ${step.description}\n`;
        
        if (step.nextSteps.length > 0) {
          const nextNames = step.nextSteps.map(s => s.name).slice(0, 3).join(', ');
          output += `   Next: ${nextNames}${step.nextSteps.length > 3 ? ` +${step.nextSteps.length - 3} more` : ''}\n`;
        }
        output += '\n';
      }

      if (flowTrace.steps.length === 0) {
        output += `No flow steps could be traced. The symbol might be:\n`;
        output += `- A leaf function with no further calls\n`;
        output += `- Using dynamic calls that can't be statically analyzed\n`;
        output += `- Part of external dependencies\n`;
      }

      return {
        success: true,
        output
      };

    } catch (error) {
      return {
        success: false,
        error: `Code flow tracing failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Map features and architectural components
   */
  async mapFeatures(args: z.infer<typeof MapFeaturesSchema>): Promise<ToolResult> {
    try {
      const searchService = await this.ensureInitialized();
      
      const features = await searchService.mapFeatures();
      
      if (features.length === 0) {
        return {
          success: true,
          output: "No distinct features detected in the codebase. This might indicate:\n" +
                 "- A small or simple project structure\n" +
                 "- Monolithic architecture without clear feature separation\n" +
                 "- Insufficient symbol extraction"
        };
      }

      // Filter by complexity if specified
      const filteredFeatures = args.complexityThreshold ?
        features.filter(f => {
          const levels = { low: 0, medium: 1, high: 2 };
          return levels[f.complexity] >= levels[args.complexityThreshold!];
        }) : features;

      let output = `# Feature Map 🗺️\n\n`;
      output += `Discovered ${filteredFeatures.length} architectural features:\n\n`;

      for (const feature of filteredFeatures) {
        const complexityIcon = {
          'low': '🟢',
          'medium': '🟡', 
          'high': '🔴'
        }[feature.complexity];

        output += `## ${feature.name} ${complexityIcon}\n`;
        output += `**Description**: ${feature.description}\n`;
        output += `**Complexity**: ${feature.complexity}\n`;
        output += `**Entry Points**: ${feature.entryPoints.length}\n`;
        output += `**Core Files**: ${feature.coreFiles.length}\n`;

        if (feature.entryPoints.length > 0) {
          const entryNames = feature.entryPoints.slice(0, 5).map(s => s.name).join(', ');
          output += `**Key Symbols**: ${entryNames}`;
          if (feature.entryPoints.length > 5) {
            output += ` +${feature.entryPoints.length - 5} more`;
          }
          output += '\n';
        }

        if (feature.coreFiles.length > 0) {
          const fileNames = feature.coreFiles.slice(0, 3).map(f => path.basename(f)).join(', ');
          output += `**Key Files**: ${fileNames}`;
          if (feature.coreFiles.length > 3) {
            output += ` +${feature.coreFiles.length - 3} more`;
          }
          output += '\n';
        }

        if (feature.relatedFeatures.length > 0) {
          output += `**Related Features**: ${feature.relatedFeatures.join(', ')}\n`;
        }

        if (args.includeTestCoverage && feature.testCoverage) {
          const coverage = feature.testCoverage;
          output += `**Test Coverage**: ${coverage.hasTests ? `${coverage.coverage}%` : 'No tests found'}\n`;
          if (coverage.testFiles.length > 0) {
            output += `**Test Files**: ${coverage.testFiles.slice(0, 3).join(', ')}\n`;
          }
        }

        output += '\n';
      }

      // Architecture insights
      output += `## 🏗️ Architecture Insights\n\n`;
      
      const complexityDistribution = features.reduce((dist, f) => {
        dist[f.complexity] = (dist[f.complexity] || 0) + 1;
        return dist;
      }, {} as Record<string, number>);

      output += `**Complexity Distribution**:\n`;
      for (const [level, count] of Object.entries(complexityDistribution)) {
        const percentage = Math.round((count / features.length) * 100);
        output += `- ${level}: ${count} features (${percentage}%)\n`;
      }

      const totalEntryPoints = features.reduce((sum, f) => sum + f.entryPoints.length, 0);
      const avgEntryPoints = Math.round(totalEntryPoints / features.length);
      
      output += `\n**Average Entry Points per Feature**: ${avgEntryPoints}\n`;

      // Recommendations
      output += `\n## 💡 Recommendations\n\n`;
      
      if (complexityDistribution.high > features.length / 2) {
        output += `- Consider refactoring high-complexity features for better maintainability\n`;
      }
      
      if (avgEntryPoints > 10) {
        output += `- Some features have many entry points - consider facade patterns\n`;
      }
      
      output += `- Use \`semantic_search\` to explore specific features in detail\n`;
      output += `- Use \`trace_code_flow\` to understand feature interactions\n`;

      return {
        success: true,
        output
      };

    } catch (error) {
      return {
        success: false,
        error: `Feature mapping failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Find related symbols and relationships
   */
  async findRelatedSymbols(args: z.infer<typeof FindRelatedSchema>): Promise<ToolResult> {
    try {
      const searchService = await this.ensureInitialized();
      
      const result = await searchService.findRelatedSymbols(args.symbolName);
      
      const targetPath = path.relative(process.cwd(), result.symbol.filePath);
      const targetLocation = `${targetPath}:${result.symbol.line}`;

      let output = `# Symbol Relationships for "${args.symbolName}" 🔗\n\n`;
      output += `**Target Symbol**: ${result.symbol.name} (${result.symbol.type})\n`;
      output += `**Location**: ${targetLocation}\n`;
      output += `**Visibility**: ${result.symbol.visibility}\n`;
      
      if (result.symbol.signature) {
        output += `**Signature**: \`${result.symbol.signature}\`\n`;
      }
      
      output += `\n**Related Symbols**: ${result.related.length}\n\n`;

      if (result.related.length === 0) {
        output += "No related symbols found. This might indicate:\n";
        output += "- An isolated symbol with minimal dependencies\n";
        output += "- Limited symbol extraction in the current index\n";
        output += "- The symbol might be primarily used externally\n";
        return {
          success: true,
          output
        };
      }

      // Group by relationship type
      const groupedRelated = result.related.reduce((groups, rel) => {
        if (!groups[rel.relationship]) groups[rel.relationship] = [];
        groups[rel.relationship].push(rel);
        return groups;
      }, {} as Record<string, typeof result.related>);

      for (const [relationshipType, relationships] of Object.entries(groupedRelated)) {
        const count = relationships.length;
        const avgStrength = Math.round(
          relationships.reduce((sum, r) => sum + r.strength, 0) / count * 100
        );

        output += `## ${relationshipType.replace(/_/g, ' ')} (${count}) - Avg Strength: ${avgStrength}%\n\n`;
        
        const maxResults = args.maxRelated ? Math.min(args.maxRelated, 10) : 10;
        
        for (let i = 0; i < Math.min(relationships.length, maxResults); i++) {
          const rel = relationships[i];
          const relPath = path.relative(process.cwd(), rel.symbol.filePath);
          const relLocation = `${relPath}:${rel.symbol.line}`;
          const strength = Math.round(rel.strength * 100);
          
          output += `${i + 1}. **${rel.symbol.name}** (${rel.symbol.type}) - ${strength}%\n`;
          output += `   Location: ${relLocation}\n`;
          
          if (rel.symbol.signature) {
            output += `   Signature: \`${rel.symbol.signature}\`\n`;
          }
          output += '\n';
        }
        
        if (relationships.length > maxResults) {
          output += `*... and ${relationships.length - maxResults} more ${relationshipType} relationships*\n\n`;
        }
      }

      // Relationship insights
      output += `## 🔍 Relationship Insights\n\n`;
      
      const strongRelationships = result.related.filter(r => r.strength > 0.7).length;
      const totalRelationships = result.related.length;
      
      output += `**Strong Relationships**: ${strongRelationships}/${totalRelationships} (${Math.round(strongRelationships/totalRelationships*100)}%)\n`;
      
      const uniqueFiles = new Set(result.related.map(r => r.symbol.filePath)).size;
      output += `**Files Involved**: ${uniqueFiles}\n`;
      
      const relationshipTypes = Object.keys(groupedRelated).length;
      output += `**Relationship Types**: ${relationshipTypes}\n`;

      // Recommendations
      output += `\n## 💡 Next Steps\n\n`;
      output += `- Use \`semantic_search\` to find symbols with similar functionality\n`;
      output += `- Use \`trace_code_flow\` to understand how "${args.symbolName}" fits in execution flows\n`;
      
      if (strongRelationships > 5) {
        output += `- Consider refactoring to reduce coupling (${strongRelationships} strong relationships)\n`;
      }

      return {
        success: true,
        output
      };

    } catch (error) {
      return {
        success: false,
        error: `Symbol relationship analysis failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Export schemas for tool registration
  static get schemas() {
    return {
      semantic_search: {
        description: "Search codebase using natural language queries with intelligent pattern recognition",
        parameters: SemanticSearchSchema
      },
      trace_code_flow: {
        description: "Trace execution flow from an entry point to understand code paths",
        parameters: TraceFlowSchema
      },
      map_features: {
        description: "Map architectural features and components in the codebase",
        parameters: MapFeaturesSchema
      },
      find_related_symbols: {
        description: "Find symbols related to a target symbol with relationship analysis",
        parameters: FindRelatedSchema
      }
    };
  }
}

// Export for use in tool registration
export const semanticSearchTool = new SemanticSearchTool();