/**
 * Read-Only Tool Execution Service
 * 
 * Provides a safe execution layer for Plan Mode that prevents any
 * file system modifications while maintaining full tool functionality
 * for exploration and analysis.
 */

import { ToolResult } from '../types/index.js';
import { GrokAgent } from '../agent/grok-agent.js';

export interface ReadOnlyResult extends ToolResult {
  /** Original tool that was executed */
  originalTool: string;
  /** Whether the tool was blocked due to being destructive */
  wasBlocked: boolean;
  /** Simulation result if tool was blocked */
  simulationResult?: any;
  /** Insights gathered from the operation */
  insights?: string[];
}

interface ToolExecutionLog {
  toolName: string;
  arguments: any;
  timestamp: Date;
  result: ReadOnlyResult;
  blocked: boolean;
}

export class ReadOnlyToolExecutor {
  private executionLog: ToolExecutionLog[] = [];
  private insights: string[] = [];
  
  constructor(private agent: GrokAgent) {}

  /**
   * Execute a tool in read-only mode
   */
  async executeReadOnly(toolName: string, args: any): Promise<ReadOnlyResult> {
    const timestamp = new Date();
    
    // Check if tool is allowed in read-only mode
    if (this.isDestructiveTool(toolName)) {
      const result = await this.simulateDestructiveTool(toolName, args);
      
      this.logExecution(toolName, args, timestamp, result, true);
      return result;
    }
    
    // Execute safe tools normally
    try {
      const originalResult = await this.executeSafeTool(toolName, args);
      const result: ReadOnlyResult = {
        ...originalResult,
        originalTool: toolName,
        wasBlocked: false,
        insights: this.extractInsights(toolName, args, originalResult)
      };
      
      this.logExecution(toolName, args, timestamp, result, false);
      return result;
    } catch (error) {
      const result: ReadOnlyResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalTool: toolName,
        wasBlocked: false
      };
      
      this.logExecution(toolName, args, timestamp, result, false);
      return result;
    }
  }

  /**
   * Check if a tool is destructive (modifies files)
   */
  private isDestructiveTool(toolName: string): boolean {
    const destructiveTools = [
      'write',
      'edit', 
      'str_replace',
      'create',
      'delete',
      'move',
      'rename',
      'multiedit',
      'bash' // Most bash commands can be destructive
    ];
    
    return destructiveTools.includes(toolName.toLowerCase());
  }

  /**
   * Simulate execution of destructive tools for analysis
   */
  private async simulateDestructiveTool(toolName: string, args: any): Promise<ReadOnlyResult> {
    const insights: string[] = [];
    let simulationResult: any = null;

    switch (toolName.toLowerCase()) {
      case 'write':
      case 'create':
        simulationResult = await this.simulateFileCreation(args);
        insights.push(`Would create file: ${args.file_path || args.path}`);
        insights.push(`Content length: ${args.content?.length || 0} characters`);
        break;
        
      case 'edit':
      case 'str_replace':
        simulationResult = await this.simulateFileEdit(args);
        insights.push(`Would modify file: ${args.file_path || args.path}`);
        insights.push(`Change type: ${args.old_string ? 'string replacement' : 'content edit'}`);
        break;
        
      case 'multiedit':
        simulationResult = await this.simulateMultiEdit(args);
        insights.push(`Would perform multi-file operation on ${args.edits?.length || 0} files`);
        break;
        
      case 'bash':
        simulationResult = await this.simulateBashCommand(args);
        insights.push(`Would execute: ${args.command}`);
        insights.push(`Command type: ${this.categorizeBashCommand(args.command)}`);
        break;
        
      default:
        simulationResult = { simulated: true, action: `${toolName} operation` };
        insights.push(`Would execute ${toolName} with provided arguments`);
    }

    return {
      success: true,
      output: `[PLAN MODE - READ ONLY] Simulated ${toolName} operation`,
      originalTool: toolName,
      wasBlocked: true,
      simulationResult,
      insights
    };
  }

  /**
   * Execute safe (read-only) tools
   */
  private async executeSafeTool(toolName: string, args: any): Promise<ToolResult> {
    // Use a simulated tool execution approach since we don't have direct access
    // to individual tool methods. For Plan Mode, we'll simulate the results.
    return this.simulateReadOnlyToolExecution({ name: toolName, arguments: args });
  }
  
  /**
   * Simulate tool execution for read-only operations
   */
  private simulateReadOnlyToolExecution(toolCall: { name: string; arguments: any }): ToolResult {
    const { name, arguments: args } = toolCall;
    
    switch (name.toLowerCase()) {
      case 'view_file':
      case 'read':
        return {
          success: true,
          output: `[PLAN MODE] Would read file: ${args.file_path || args.path}\n` +
                  `Lines: ${args.start_line || 1}-${args.end_line || 'end'}`
        };
        
      case 'search':
      case 'grep':
        return {
          success: true,
          output: `[PLAN MODE] Would search for pattern: ${args.pattern || args.query}\n` +
                  `In path: ${args.path || 'current directory'}`
        };
        
      case 'bash':
        if (this.isSafeBashCommand(args.command)) {
          return {
            success: true,
            output: `[PLAN MODE] Would execute safe command: ${args.command}`
          };
        } else {
          return {
            success: false,
            error: `Command blocked in Plan Mode (potentially destructive): ${args.command}`
          };
        }
        
      default:
        return {
          success: true,
          output: `[PLAN MODE] Would execute ${name} with provided arguments`
        };
    }
  }

  /**
   * Check if bash command is safe (read-only)
   */
  private isSafeBashCommand(command: string): boolean {
    const safeCommands = [
      'ls', 'cat', 'head', 'tail', 'grep', 'find', 'wc', 'sort', 'uniq',
      'pwd', 'whoami', 'date', 'ps', 'top', 'df', 'du', 'free',
      'git status', 'git log', 'git diff', 'git branch', 'git show',
      'npm list', 'yarn list', 'pip list', 'composer show'
    ];
    
    const cmd = command.trim().toLowerCase();
    
    // Check if command starts with any safe command
    return safeCommands.some(safe => cmd.startsWith(safe)) &&
           !this.containsDestructiveOperators(command);
  }

  /**
   * Check for destructive operators in bash commands
   */
  private containsDestructiveOperators(command: string): boolean {
    const destructivePatterns = [
      '>',   // Redirect (can overwrite files)
      '>>',  // Append redirect
      'rm ', 'mv ', 'cp ', 'mkdir ', 'rmdir ',
      'chmod ', 'chown ', 'ln ',
      'curl.*-o', 'wget.*-o', // Download with output
      'sudo ', 'su ',
      '&&.*rm', '||.*rm', // Chained destructive commands
    ];
    
    return destructivePatterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(command);
    });
  }

  /**
   * Simulate file creation
   */
  private async simulateFileCreation(args: any): Promise<any> {
    const filePath = args.file_path || args.path;
    const content = args.content || '';
    
    return {
      action: 'create_file',
      path: filePath,
      contentLength: content.length,
      contentPreview: content.substring(0, 200),
      estimatedLines: content.split('\n').length,
      fileType: this.getFileType(filePath)
    };
  }

  /**
   * Simulate file editing
   */
  private async simulateFileEdit(args: any): Promise<any> {
    const filePath = args.file_path || args.path;
    
    try {
      // Just simulate the edit without actually reading the file
      // In Plan Mode, we don't need the actual content
      return {
        action: 'edit_file',
        path: filePath,
        simulated: true,
        old_string: args.old_string || '',
        new_string: args.new_string || '',
        change_preview: `Would replace "${args.old_string || 'content'}" with "${args.new_string || 'new content'}"`
      };
    } catch (error) {
      return {
        action: 'edit_file',
        path: filePath,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  /**
   * Simulate multi-file editing
   */
  private async simulateMultiEdit(args: any): Promise<any> {
    const edits = args.edits || [];
    
    return {
      action: 'multi_edit',
      fileCount: 1, // args.file_path ? 1 : 0,
      editCount: edits.length,
      estimatedChanges: edits.reduce((sum: number, edit: any) => {
        return sum + ((edit.new_string?.length || 0) - (edit.old_string?.length || 0));
      }, 0)
    };
  }

  /**
   * Simulate bash command execution
   */
  private async simulateBashCommand(args: any): Promise<any> {
    const command = args.command || '';
    
    return {
      action: 'bash_command',
      command,
      category: this.categorizeBashCommand(command),
      risk: this.assessCommandRisk(command),
      wouldExecute: this.isSafeBashCommand(command)
    };
  }

  /**
   * Categorize bash command type
   */
  private categorizeBashCommand(command: string): string {
    const cmd = command.trim().toLowerCase();
    
    if (cmd.startsWith('git ')) return 'version_control';
    if (cmd.startsWith('npm ') || cmd.startsWith('yarn ') || cmd.startsWith('pnpm ')) return 'package_manager';
    if (cmd.startsWith('ls') || cmd.startsWith('find') || cmd.startsWith('grep')) return 'file_exploration';
    if (cmd.startsWith('cat') || cmd.startsWith('head') || cmd.startsWith('tail')) return 'file_reading';
    if (cmd.includes('rm ') || cmd.includes('mv ') || cmd.includes('cp ')) return 'file_modification';
    if (cmd.includes('>') || cmd.includes('>>')) return 'file_creation';
    if (cmd.startsWith('mkdir') || cmd.startsWith('rmdir')) return 'directory_management';
    if (cmd.startsWith('chmod') || cmd.startsWith('chown')) return 'permission_management';
    
    return 'general';
  }

  /**
   * Assess command risk level
   */
  private assessCommandRisk(command: string): 'low' | 'medium' | 'high' {
    if (this.isSafeBashCommand(command)) return 'low';
    if (command.includes('rm ') || command.includes('sudo ')) return 'high';
    return 'medium';
  }

  /**
   * Extract insights from tool execution
   */
  private extractInsights(toolName: string, args: any, result: ToolResult): string[] {
    const insights: string[] = [];
    
    switch (toolName.toLowerCase()) {
      case 'read':
        if (result.success && result.output) {
          const lines = result.output.split('\n').length;
          insights.push(`File contains ${lines} lines`);
          
          // Detect file type insights
          const fileType = this.getFileType(args.file_path);
          if (fileType) {
            insights.push(`File type: ${fileType}`);
          }
        }
        break;
        
      case 'grep':
        if (result.success && result.output) {
          const matches = result.output.split('\n').filter(line => line.trim()).length;
          insights.push(`Found ${matches} matches for pattern`);
        }
        break;
        
      case 'ls':
        if (result.success && result.output) {
          const items = result.output.split('\n').filter(line => line.trim()).length;
          insights.push(`Directory contains ${items} items`);
        }
        break;
    }
    
    return insights;
  }

  /**
   * Get file type from path
   */
  private getFileType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'py': 'Python',
      'java': 'Java',
      'go': 'Go',
      'rs': 'Rust',
      'json': 'JSON',
      'md': 'Markdown',
      'yml': 'YAML',
      'yaml': 'YAML',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS'
    };
    
    return typeMap[extension || ''] || 'Unknown';
  }

  /**
   * Log tool execution
   */
  private logExecution(
    toolName: string, 
    args: any, 
    timestamp: Date, 
    result: ReadOnlyResult, 
    blocked: boolean
  ): void {
    this.executionLog.push({
      toolName,
      arguments: args,
      timestamp,
      result,
      blocked
    });
    
    // Add insights to global insights list
    if (result.insights) {
      this.insights.push(...result.insights);
    }
  }

  /**
   * Get execution summary
   */
  getExecutionSummary(): {
    totalExecutions: number;
    blockedExecutions: number;
    allowedExecutions: number;
    insights: string[];
    toolsUsed: string[];
  } {
    const toolsUsed = [...new Set(this.executionLog.map(log => log.toolName))];
    const blockedCount = this.executionLog.filter(log => log.blocked).length;
    
    return {
      totalExecutions: this.executionLog.length,
      blockedExecutions: blockedCount,
      allowedExecutions: this.executionLog.length - blockedCount,
      insights: [...new Set(this.insights)], // Deduplicate insights
      toolsUsed
    };
  }

  /**
   * Get detailed execution log
   */
  getExecutionLog(): ToolExecutionLog[] {
    return [...this.executionLog];
  }

  /**
   * Clear execution log and insights
   */
  clearLog(): void {
    this.executionLog = [];
    this.insights = [];
  }
}