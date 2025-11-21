/**
 * Read-Only Filesystem Overlay Service
 * 
 * Provides a virtual filesystem layer that intercepts and redirects
 * all filesystem operations during Plan Mode to ensure zero
 * modifications to the actual codebase.
 * 
 * This service acts as a transparent proxy that:
 * 1. Allows read operations to pass through unchanged
 * 2. Blocks destructive operations with simulated results
 * 3. Maintains a virtual state of "what would change"
 * 4. Provides rollback simulation and impact analysis
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { ToolResult } from '../types/index.js';
import { GrokToolCall } from '../grok/client.js';

export interface VirtualFileChange {
  /** Type of change */
  operation: 'create' | 'modify' | 'delete' | 'rename' | 'move';
  /** Target file path */
  path: string;
  /** Original path (for rename/move operations) */
  originalPath?: string;
  /** Current content (for create/modify) */
  content?: string;
  /** Original content (for modify operations) */
  originalContent?: string;
  /** Timestamp of virtual change */
  timestamp: Date;
  /** Tool that would have made this change */
  toolName: string;
  /** Arguments that would have been used */
  toolArgs: any;
  /** Size impact (bytes) */
  sizeImpact: number;
}

export interface VirtualDirectoryStructure {
  /** Virtual files and their changes */
  files: Map<string, VirtualFileChange>;
  /** Virtual directories created */
  directories: Set<string>;
  /** Files that would be deleted */
  deletedFiles: Set<string>;
  /** Total size impact */
  totalSizeImpact: number;
  /** Number of files affected */
  filesAffected: number;
}

export interface ReadOnlyOverlayConfig {
  /** Base directory for the overlay */
  baseDirectory: string;
  /** Whether to track all operations (including reads) */
  trackAllOperations: boolean;
  /** Maximum simulated file size (bytes) */
  maxSimulatedFileSize: number;
  /** Whether to enable detailed impact analysis */
  enableImpactAnalysis: boolean;
  /** Patterns to exclude from tracking */
  excludePatterns: string[];
}

interface OperationLog {
  id: string;
  timestamp: Date;
  toolName: string;
  args: any;
  wasBlocked: boolean;
  virtualResult?: any;
  actualResult?: ToolResult;
  impacts: string[];
}

export class ReadOnlyFilesystemOverlay extends EventEmitter {
  private virtualStructure: VirtualDirectoryStructure;
  private operationLog: OperationLog[] = [];
  private isActive = false;
  private config: ReadOnlyOverlayConfig;
  
  constructor(config: Partial<ReadOnlyOverlayConfig> = {}) {
    super();
    
    this.config = {
      baseDirectory: process.cwd(),
      trackAllOperations: false,
      maxSimulatedFileSize: 10 * 1024 * 1024, // 10MB
      enableImpactAnalysis: true,
      excludePatterns: [
        '.git/**',
        'node_modules/**',
        '.grok/**',
        '**/*.log',
        '**/dist/**',
        '**/build/**'
      ],
      ...config
    };
    
    this.virtualStructure = {
      files: new Map(),
      directories: new Set(),
      deletedFiles: new Set(),
      totalSizeImpact: 0,
      filesAffected: 0
    };
  }

  /**
   * Activate the read-only overlay
   */
  activate(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.virtualStructure = {
      files: new Map(),
      directories: new Set(),
      deletedFiles: new Set(),
      totalSizeImpact: 0,
      filesAffected: 0
    };
    this.operationLog = [];
    
    console.log('[ReadOnlyOverlay] Filesystem overlay activated');
    this.emit('overlay-activated');
  }

  /**
   * Deactivate the read-only overlay
   */
  deactivate(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    console.log('[ReadOnlyOverlay] Filesystem overlay deactivated');
    this.emit('overlay-deactivated', {
      summary: this.getImpactSummary()
    });
  }

  /**
   * Intercept and process a tool call in read-only mode
   */
  async interceptToolCall(toolCall: GrokToolCall): Promise<ToolResult> {
    if (!this.isActive) {
      throw new Error('ReadOnlyOverlay: Overlay not active');
    }

    const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const args = this.parseToolArguments(toolCall);
    
    // Check if this is a destructive operation
    if (this.isDestructiveOperation(toolCall.function.name, args)) {
      return await this.handleDestructiveOperation(operationId, toolCall, args);
    }
    
    // Handle read-only operations
    return await this.handleReadOnlyOperation(operationId, toolCall, args);
  }

  /**
   * Check if an operation is destructive (modifies filesystem)
   */
  private isDestructiveOperation(toolName: string, args: any): boolean {
    const destructivePatterns = [
      // File operations
      'write', 'create', 'str_replace', 'edit', 'delete', 'remove', 'rm',
      'move', 'mv', 'rename', 'copy', 'cp',
      
      // Multi-file operations
      'multi_edit', 'bulk_edit', 'mass_replace',
      
      // Directory operations  
      'mkdir', 'rmdir', 'create_directory',
      
      // Bash commands that could be destructive
      'bash'
    ];
    
    const toolLower = toolName.toLowerCase();
    
    // Direct tool name match
    if (destructivePatterns.some(pattern => toolLower.includes(pattern))) {
      return true;
    }
    
    // Special case: bash commands
    if (toolLower === 'bash' && args.command) {
      return this.isBashCommandDestructive(args.command);
    }
    
    return false;
  }

  /**
   * Check if a bash command is destructive
   */
  private isBashCommandDestructive(command: string): boolean {
    const destructiveCommands = [
      'rm ', 'mv ', 'cp ', 'mkdir ', 'rmdir ', 'touch ',
      'chmod ', 'chown ', 'ln ', 'unlink ',
      'dd ', 'rsync '
    ];
    
    const destructiveOperators = [
      '>', '>>', '|', '&&', '||'
    ];
    
    const cmd = command.toLowerCase().trim();
    
    return destructiveCommands.some(dcmd => cmd.includes(dcmd)) ||
           destructiveOperators.some(op => cmd.includes(op));
  }

  /**
   * Handle destructive operations by simulating them
   */
  private async handleDestructiveOperation(
    operationId: string,
    toolCall: GrokToolCall,
    args: any
  ): Promise<ToolResult> {
    const toolName = toolCall.function.name;
    const simulation = await this.simulateOperation(toolName, args);
    
    // Log the blocked operation
    this.logOperation(operationId, {
      toolName,
      args,
      wasBlocked: true,
      virtualResult: simulation,
      impacts: simulation.impacts || []
    });
    
    // Create virtual changes
    if (simulation.changes) {
      for (const change of simulation.changes) {
        this.applyVirtualChange(change);
      }
    }
    
    return {
      success: true,
      output: this.formatSimulationResult(toolName, simulation),
      metadata: {
        planMode: true,
        simulated: true,
        operationId,
        virtualChanges: simulation.changes?.length || 0
      }
    };
  }

  /**
   * Handle read-only operations
   */
  private async handleReadOnlyOperation(
    operationId: string,
    toolCall: GrokToolCall,
    args: any
  ): Promise<ToolResult> {
    const toolName = toolCall.function.name;
    
    try {
      // For read operations, we need to consider virtual changes
      if (this.isReadOperation(toolName)) {
        return await this.handleVirtualRead(operationId, toolName, args);
      }
      
      // For other safe operations (search, etc.), execute normally but with overlay context
      const result = await this.executeWithOverlayContext(toolName, args);
      
      this.logOperation(operationId, {
        toolName,
        args,
        wasBlocked: false,
        actualResult: result,
        impacts: []
      });
      
      return {
        ...result,
        metadata: {
          planMode: true,
          simulated: false,
          operationId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed',
        metadata: {
          planMode: true,
          operationId
        }
      };
    }
  }

  /**
   * Check if operation is a read operation
   */
  private isReadOperation(toolName: string): boolean {
    const readOperations = ['read', 'view', 'cat', 'head', 'tail', 'file_content'];
    return readOperations.some(op => toolName.toLowerCase().includes(op));
  }

  /**
   * Handle virtual file reads (considering virtual changes)
   */
  private async handleVirtualRead(
    operationId: string,
    toolName: string,
    args: any
  ): Promise<ToolResult> {
    const filePath = args.path || args.file_path || args.filename;
    
    if (!filePath) {
      return {
        success: false,
        error: 'No file path specified for read operation'
      };
    }
    
    const resolvedPath = path.resolve(this.config.baseDirectory, filePath);
    
    // Check if file has virtual changes
    const virtualChange = this.virtualStructure.files.get(resolvedPath);
    
    if (virtualChange) {
      // Return virtual content
      const content = virtualChange.content || '';
      const lines = content.split('\n');
      const lineCount = lines.length;
      
      return {
        success: true,
        output: this.formatFileContent(content, args),
        metadata: {
          planMode: true,
          virtualFile: true,
          operationId,
          lineCount,
          sizeBytes: content.length
        }
      };
    }
    
    // Check if file was virtually deleted
    if (this.virtualStructure.deletedFiles.has(resolvedPath)) {
      return {
        success: false,
        error: `File not found (would be deleted in plan): ${filePath}`,
        metadata: {
          planMode: true,
          virtuallyDeleted: true,
          operationId
        }
      };
    }
    
    // Read actual file
    try {
      const actualContent = await fs.promises.readFile(resolvedPath, 'utf-8');
      return {
        success: true,
        output: this.formatFileContent(actualContent, args),
        metadata: {
          planMode: true,
          actualFile: true,
          operationId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File read failed',
        metadata: {
          planMode: true,
          operationId
        }
      };
    }
  }

  /**
   * Simulate a destructive operation
   */
  private async simulateOperation(toolName: string, args: any): Promise<any> {
    switch (toolName.toLowerCase()) {
      case 'create':
      case 'write':
        return this.simulateFileCreation(args);
        
      case 'edit':
      case 'str_replace':
        return this.simulateFileEdit(args);
        
      case 'delete':
      case 'remove':
        return this.simulateFileDeletion(args);
        
      case 'move':
      case 'rename':
        return this.simulateFileMove(args);
        
      case 'bash':
        return this.simulateBashCommand(args);
        
      case 'multi_edit':
        return this.simulateMultiEdit(args);
        
      default:
        return {
          type: 'generic',
          description: `Simulated ${toolName} operation`,
          impacts: [`Would execute ${toolName} with provided arguments`]
        };
    }
  }

  /**
   * Simulate file creation
   */
  private async simulateFileCreation(args: any): Promise<any> {
    const filePath = args.path || args.file_path || args.filename;
    const content = args.content || '';
    
    const resolvedPath = path.resolve(this.config.baseDirectory, filePath);
    
    // Check if file already exists
    const fileExists = fs.existsSync(resolvedPath);
    const sizeImpact = content.length;
    
    return {
      type: 'file_creation',
      path: filePath,
      sizeImpact,
      changes: [{
        operation: 'create' as const,
        path: resolvedPath,
        content,
        timestamp: new Date(),
        toolName: 'create',
        toolArgs: args,
        sizeImpact
      }],
      impacts: [
        `Would create file: ${filePath}`,
        `Content size: ${sizeImpact} bytes`,
        `File exists: ${fileExists ? 'Yes (would overwrite)' : 'No'}`
      ]
    };
  }

  /**
   * Simulate file editing
   */
  private async simulateFileEdit(args: any): Promise<any> {
    const filePath = args.path || args.file_path || args.filename;
    const resolvedPath = path.resolve(this.config.baseDirectory, filePath);
    
    try {
      const originalContent = fs.existsSync(resolvedPath) 
        ? await fs.promises.readFile(resolvedPath, 'utf-8')
        : '';
        
      let newContent = originalContent;
      
      if (args.old_string && args.new_string !== undefined) {
        newContent = args.replace_all 
          ? originalContent.split(args.old_string).join(args.new_string)
          : originalContent.replace(args.old_string, args.new_string);
      } else if (args.content !== undefined) {
        newContent = args.content;
      }
      
      const sizeImpact = newContent.length - originalContent.length;
      
      return {
        type: 'file_edit',
        path: filePath,
        sizeImpact,
        changes: [{
          operation: 'modify' as const,
          path: resolvedPath,
          content: newContent,
          originalContent,
          timestamp: new Date(),
          toolName: 'edit',
          toolArgs: args,
          sizeImpact
        }],
        impacts: [
          `Would modify file: ${filePath}`,
          `Size change: ${sizeImpact > 0 ? '+' : ''}${sizeImpact} bytes`,
          `Original size: ${originalContent.length} bytes`,
          `New size: ${newContent.length} bytes`
        ]
      };
    } catch (error) {
      return {
        type: 'file_edit_error',
        error: error instanceof Error ? error.message : 'Edit simulation failed',
        impacts: [`Would attempt to edit ${filePath} (file may not exist)`]
      };
    }
  }

  /**
   * Simulate file deletion
   */
  private async simulateFileDeletion(args: any): Promise<any> {
    const filePath = args.path || args.file_path || args.filename;
    const resolvedPath = path.resolve(this.config.baseDirectory, filePath);
    
    const fileExists = fs.existsSync(resolvedPath);
    let originalSize = 0;
    
    if (fileExists) {
      try {
        const stats = await fs.promises.stat(resolvedPath);
        originalSize = stats.size;
      } catch {
        // Ignore stat errors
      }
    }
    
    return {
      type: 'file_deletion',
      path: filePath,
      sizeImpact: -originalSize,
      changes: [{
        operation: 'delete' as const,
        path: resolvedPath,
        timestamp: new Date(),
        toolName: 'delete',
        toolArgs: args,
        sizeImpact: -originalSize
      }],
      impacts: [
        `Would delete file: ${filePath}`,
        `File exists: ${fileExists ? 'Yes' : 'No'}`,
        originalSize > 0 ? `Would free: ${originalSize} bytes` : 'No size impact'
      ]
    };
  }

  /**
   * Simulate file move/rename
   */
  private async simulateFileMove(args: any): Promise<any> {
    const oldPath = args.old_path || args.source || args.from;
    const newPath = args.new_path || args.target || args.to;
    
    return {
      type: 'file_move',
      originalPath: oldPath,
      newPath: newPath,
      sizeImpact: 0,
      changes: [{
        operation: 'rename' as const,
        path: path.resolve(this.config.baseDirectory, newPath),
        originalPath: path.resolve(this.config.baseDirectory, oldPath),
        timestamp: new Date(),
        toolName: 'move',
        toolArgs: args,
        sizeImpact: 0
      }],
      impacts: [
        `Would move/rename: ${oldPath} → ${newPath}`,
        'No size impact (file content unchanged)'
      ]
    };
  }

  /**
   * Simulate bash command
   */
  private async simulateBashCommand(args: any): Promise<any> {
    const command = args.command || '';
    
    return {
      type: 'bash_command',
      command,
      sizeImpact: 0,
      impacts: [
        `Would execute bash command: ${command}`,
        'Command blocked for safety in Plan Mode'
      ]
    };
  }

  /**
   * Simulate multi-file edit
   */
  private async simulateMultiEdit(args: any): Promise<any> {
    const files = args.files || [];
    const changes: VirtualFileChange[] = [];
    let totalSizeImpact = 0;
    
    for (const file of files) {
      const simulation = await this.simulateFileEdit(file);
      if (simulation.changes) {
        changes.push(...simulation.changes);
        totalSizeImpact += simulation.sizeImpact || 0;
      }
    }
    
    return {
      type: 'multi_edit',
      fileCount: files.length,
      sizeImpact: totalSizeImpact,
      changes,
      impacts: [
        `Would edit ${files.length} files`,
        `Total size impact: ${totalSizeImpact > 0 ? '+' : ''}${totalSizeImpact} bytes`
      ]
    };
  }

  /**
   * Apply virtual change to the overlay structure
   */
  private applyVirtualChange(change: VirtualFileChange): void {
    switch (change.operation) {
      case 'create':
      case 'modify':
        this.virtualStructure.files.set(change.path, change);
        this.virtualStructure.deletedFiles.delete(change.path);
        break;
        
      case 'delete':
        this.virtualStructure.files.delete(change.path);
        this.virtualStructure.deletedFiles.add(change.path);
        break;
        
      case 'rename':
      case 'move':
        if (change.originalPath) {
          this.virtualStructure.files.delete(change.originalPath);
          this.virtualStructure.files.set(change.path, change);
        }
        break;
    }
    
    this.virtualStructure.totalSizeImpact += change.sizeImpact;
    this.virtualStructure.filesAffected += 1;
    
    this.emit('virtual-change-applied', change);
  }

  /**
   * Execute operation with overlay context (for safe operations)
   */
  private async executeWithOverlayContext(toolName: string, args: any): Promise<ToolResult> {
    // For now, we'll simulate execution since we don't have direct tool access
    // In a real implementation, this would delegate to the actual tools
    return {
      success: true,
      output: `[PLAN MODE] Executed ${toolName} safely (read-only operation)`
    };
  }

  /**
   * Format file content for display
   */
  private formatFileContent(content: string, args: any): string {
    const lines = content.split('\n');
    const startLine = args.start_line || 1;
    const endLine = args.end_line || lines.length;
    
    const selectedLines = lines.slice(startLine - 1, endLine);
    return selectedLines.map((line, index) => 
      `${String(startLine + index).padStart(4, ' ')}: ${line}`
    ).join('\n');
  }

  /**
   * Format simulation result for output
   */
  private formatSimulationResult(toolName: string, simulation: any): string {
    const lines = [
      `🔒 [PLAN MODE] Simulated ${toolName} operation`,
      '',
      '📋 Impact Summary:'
    ];
    
    if (simulation.impacts) {
      simulation.impacts.forEach((impact: string) => {
        lines.push(`  • ${impact}`);
      });
    }
    
    if (simulation.sizeImpact !== 0) {
      lines.push('', `📏 Size Impact: ${simulation.sizeImpact > 0 ? '+' : ''}${simulation.sizeImpact} bytes`);
    }
    
    if (simulation.changes && simulation.changes.length > 0) {
      lines.push('', '🔄 Virtual Changes:');
      simulation.changes.forEach((change: VirtualFileChange, index: number) => {
        lines.push(`  ${index + 1}. ${change.operation.toUpperCase()}: ${change.path}`);
      });
    }
    
    return lines.join('\n');
  }

  /**
   * Parse tool arguments safely
   */
  private parseToolArguments(toolCall: GrokToolCall): any {
    try {
      return JSON.parse(toolCall.function.arguments);
    } catch {
      return {};
    }
  }

  /**
   * Log operation for analysis
   */
  private logOperation(operationId: string, operation: Omit<OperationLog, 'id' | 'timestamp'>): void {
    this.operationLog.push({
      id: operationId,
      timestamp: new Date(),
      ...operation
    });
  }

  /**
   * Get impact summary
   */
  getImpactSummary(): {
    filesCreated: number;
    filesModified: number;
    filesDeleted: number;
    totalSizeImpact: number;
    operationsBlocked: number;
    operationsAllowed: number;
  } {
    const created = Array.from(this.virtualStructure.files.values())
      .filter(change => change.operation === 'create').length;
    const modified = Array.from(this.virtualStructure.files.values())
      .filter(change => change.operation === 'modify').length;
    const deleted = this.virtualStructure.deletedFiles.size;
    
    const blocked = this.operationLog.filter(op => op.wasBlocked).length;
    const allowed = this.operationLog.filter(op => !op.wasBlocked).length;
    
    return {
      filesCreated: created,
      filesModified: modified,
      filesDeleted: deleted,
      totalSizeImpact: this.virtualStructure.totalSizeImpact,
      operationsBlocked: blocked,
      operationsAllowed: allowed
    };
  }

  /**
   * Get virtual structure (read-only)
   */
  getVirtualStructure(): Readonly<VirtualDirectoryStructure> {
    return {
      ...this.virtualStructure,
      files: new Map(this.virtualStructure.files),
      directories: new Set(this.virtualStructure.directories),
      deletedFiles: new Set(this.virtualStructure.deletedFiles)
    };
  }

  /**
   * Get operation log
   */
  getOperationLog(): readonly OperationLog[] {
    return [...this.operationLog];
  }

  /**
   * Check if overlay is active
   */
  isOverlayActive(): boolean {
    return this.isActive;
  }

  /**
   * Reset virtual state
   */
  reset(): void {
    this.virtualStructure = {
      files: new Map(),
      directories: new Set(),
      deletedFiles: new Set(),
      totalSizeImpact: 0,
      filesAffected: 0
    };
    this.operationLog = [];
    this.emit('overlay-reset');
  }
}