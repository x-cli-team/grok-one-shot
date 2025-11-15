/**
 * Tool Brevity Service - Claude Code Tool Display Parity
 * 
 * Provides ultra-compact tool output formatting to match Claude Code's
 * brief tool display style: "⎿ Read X lines (ctrl+r to expand)"
 */

export interface ToolBrevitySummary {
  toolName: string;
  summary: string;          // "Read 440 lines"
  expansionHint: string;    // "(ctrl+r to expand)" 
  hasContent: boolean;      // Can be expanded
  originalContent: string;  // Full content for expansion
  metadata: {
    lineCount?: number;     // For file operations
    matchCount?: number;    // For search operations  
    fileCount?: number;     // For directory operations
    status?: string;        // For command operations
    errorCount?: number;    // For operations with errors
  };
}

export type BrevityMode = 'brief' | 'normal' | 'verbose';

export class ToolBrevityService {
  
  /**
   * Format tool result based on brevity mode
   */
  static formatToolResult(
    toolName: string,
    result: string,
    mode: BrevityMode = 'normal'
  ): ToolBrevitySummary {
    const normalizedToolName = this.normalizeToolName(toolName);
    const metadata = this.extractMetadata(normalizedToolName, result);
    const summary = this.generateSummary(normalizedToolName, result, metadata);
    
    return {
      toolName: normalizedToolName,
      summary,
      expansionHint: result.length > 0 ? "(ctrl+r to expand)" : "",
      hasContent: result.length > 0,
      originalContent: result,
      metadata
    };
  }

  /**
   * Normalize tool names to handle MCP and special cases
   */
  private static normalizeToolName(toolName: string): string {
    // Handle MCP tools with mcp__servername__toolname format
    if (toolName.startsWith("mcp__")) {
      const parts = toolName.split("__");
      if (parts.length >= 3) {
        return parts[2]; // Extract actual tool name
      }
    }
    
    // Common tool name mappings
    const toolMappings: Record<string, string> = {
      'str_replace_editor': 'Edit',
      'bash': 'Bash', 
      'file_editor': 'Edit',
      'grep': 'Grep',
      'file_search': 'Search',
      'list_files': 'List',
      'read_file': 'Read',
      'write_file': 'Write'
    };

    return toolMappings[toolName] || this.capitalizeFirst(toolName);
  }

  /**
   * Extract metadata from tool result content
   */
  private static extractMetadata(
    toolName: string, 
    content: string
  ): ToolBrevitySummary['metadata'] {
    const metadata: ToolBrevitySummary['metadata'] = {};
    
    switch (toolName.toLowerCase()) {
      case 'read':
      case 'edit':
      case 'write':
        metadata.lineCount = this.countLines(content);
        break;
        
      case 'grep':
      case 'search':
        const { matchCount, fileCount } = this.parseGrepResults(content);
        metadata.matchCount = matchCount;
        metadata.fileCount = fileCount;
        break;
        
      case 'list':
        metadata.fileCount = this.countFileItems(content);
        break;
        
      case 'bash':
        metadata.status = this.determineBashStatus(content);
        break;
        
      default:
        metadata.lineCount = this.countLines(content);
    }
    
    return metadata;
  }

  /**
   * Generate tool-specific summary text
   */
  private static generateSummary(
    toolName: string,
    content: string, 
    metadata: ToolBrevitySummary['metadata']
  ): string {
    const tool = toolName.toLowerCase();
    
    // Handle empty/error content
    if (!content || content.trim().length === 0) {
      return `${this.capitalizeFirst(tool)} (no output)`;
    }
    
    switch (tool) {
      case 'read':
        return `Read ${metadata.lineCount || 0} lines`;
        
      case 'edit':
        return `Updated ${this.getFileName(content)} with ${metadata.lineCount || 0} lines`;
        
      case 'write':
        return `Created file (${metadata.lineCount || 0} lines)`;
        
      case 'grep':
      case 'search':
        if (metadata.matchCount === 0) {
          return "No matches found";
        }
        return `${metadata.matchCount} matches across ${metadata.fileCount || 1} files`;
        
      case 'list':
        return `Found ${metadata.fileCount || 0} items`;
        
      case 'bash':
        if (metadata.status === 'error') {
          return "Command failed";
        }
        return "Command completed successfully";
        
      case 'glob':
        return `Found ${this.countFileItems(content)} files`;
        
      case 'webfetch':
        return `Fetched content (${metadata.lineCount || 0} lines)`;
        
      case 'websearch':
        return `Search completed (${this.countSearchResults(content)} results)`;
        
      default:
        // Generic fallback
        const lines = metadata.lineCount || 0;
        return lines > 0 ? `${this.capitalizeFirst(tool)} (${lines} lines)` : this.capitalizeFirst(tool);
    }
  }

  /**
   * Count lines in content
   */
  private static countLines(content: string): number {
    if (!content) return 0;
    return content.split('\n').length;
  }

  /**
   * Parse grep/search results for match and file counts
   */
  private static parseGrepResults(content: string): { matchCount: number; fileCount: number } {
    if (!content) return { matchCount: 0, fileCount: 0 };
    
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const files = new Set();
    let matches = 0;
    
    for (const line of lines) {
      // Look for file paths (common grep output pattern)
      const fileMatch = line.match(/^([^:]+):/);
      if (fileMatch) {
        files.add(fileMatch[1]);
        matches++;
      } else if (line.includes(':')) {
        matches++;
      }
    }
    
    return {
      matchCount: matches || lines.length,
      fileCount: files.size || (matches > 0 ? 1 : 0)
    };
  }

  /**
   * Count file items in directory listing
   */
  private static countFileItems(content: string): number {
    if (!content) return 0;
    
    const lines = content.split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => !line.startsWith('total ')) // Exclude 'ls -l' total line
      .filter(line => !line.match(/^d.*\s+\.\s*$/)) // Exclude current dir entry
      .filter(line => !line.match(/^d.*\s+\.\.\s*$/)); // Exclude parent dir entry
      
    return lines.length;
  }

  /**
   * Determine bash command success/failure status
   */
  private static determineBashStatus(content: string): string {
    if (!content) return 'success';
    
    const errorIndicators = [
      'error:', 'Error:', 'ERROR:',
      'failed', 'Failed', 'FAILED',
      'permission denied', 'command not found',
      'no such file', 'cannot'
    ];
    
    const contentLower = content.toLowerCase();
    return errorIndicators.some(indicator => contentLower.includes(indicator.toLowerCase())) 
      ? 'error' 
      : 'success';
  }

  /**
   * Extract filename from edit/write operation content
   */
  private static getFileName(content: string): string {
    // Try to extract filename from common edit patterns
    const fileMatch = content.match(/(?:updated|edited|created)\s+([^\s]+)/i);
    if (fileMatch) return fileMatch[1];
    
    // Fallback patterns
    const pathMatch = content.match(/([^/]+)$/);
    return pathMatch ? pathMatch[1] : 'file';
  }

  /**
   * Count search results in web search content
   */
  private static countSearchResults(content: string): number {
    // Look for numbered results or result blocks
    const resultMatches = content.match(/result\s+\d+/gi);
    return resultMatches ? resultMatches.length : 1;
  }

  /**
   * Capitalize first letter of string
   */
  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Check if content should use compact display
   */
  static shouldUseCompactDisplay(mode: BrevityMode, contentLength: number): boolean {
    if (mode === 'brief') return true;
    if (mode === 'verbose') return false;
    
    // Normal mode: use compact for long content (>5 lines)
    const lineCount = contentLength > 0 ? contentLength.toString().split('\n').length : 0;
    return lineCount > 5;
  }

  /**
   * Format expansion hint with content preview
   */
  static formatExpansionHint(
    hasContent: boolean, 
    metadata: ToolBrevitySummary['metadata']
  ): string {
    if (!hasContent) return "";
    
    // Add context-specific hints
    if (metadata.lineCount && metadata.lineCount > 10) {
      return `(${metadata.lineCount} lines, ctrl+r to expand)`;
    }
    
    if (metadata.matchCount && metadata.matchCount > 5) {
      return `(${metadata.matchCount} matches, ctrl+r to expand)`;
    }
    
    return "(ctrl+r to expand)";
  }
}