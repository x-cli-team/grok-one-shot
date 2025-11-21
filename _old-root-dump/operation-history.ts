import * as ops from "fs-extra";

const pathExists = async (filePath: string): Promise<boolean> => {
  try {
    await ops.promises.access(filePath, ops.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};



import * as path from "path";
import { ToolResult } from "../../types/index.js";
import { ConfirmationService } from "../../utils/confirmation-service.js";

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  operation: OperationType;
  description: string;
  rollbackData: RollbackData;
  metadata: OperationMetadata;
}

export interface OperationMetadata {
  user?: string;
  tool: string;
  sessionId?: string;
  filesAffected: string[];
  operationSize: 'small' | 'medium' | 'large';
  estimatedTime?: number;
}

export interface RollbackData {
  type: 'file_operations' | 'multi_file' | 'refactor' | 'search_replace';
  files: FileSnapshot[];
  directories?: DirectorySnapshot[];
  customData?: any;
}

export interface FileSnapshot {
  filePath: string;
  existed: boolean;
  content?: string;
  permissions?: string;
  lastModified?: Date;
  size?: number;
}

export interface DirectorySnapshot {
  dirPath: string;
  existed: boolean;
  permissions?: string;
  children?: string[];
}

export type OperationType = 
  | 'file_create' 
  | 'file_edit' 
  | 'file_delete' 
  | 'file_rename' 
  | 'file_move'
  | 'multi_file_edit'
  | 'refactor'
  | 'search_replace'
  | 'directory_create'
  | 'directory_delete'
  | 'bulk_operation';

export interface HistoryOptions {
  maxEntries?: number;
  maxAge?: number; // in milliseconds
  excludePatterns?: string[];
  autoCleanup?: boolean;
}

export class OperationHistoryTool {
  private history: HistoryEntry[] = [];
  private confirmationService = ConfirmationService.getInstance();
  private currentPosition = -1; // For undo/redo navigation
  private options: HistoryOptions;
  private historyFile: string;

  constructor(options: HistoryOptions = {}) {
    this.options = {
      maxEntries: 100,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      excludePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      autoCleanup: true,
      ...options
    };

    // History file in user's home directory
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    this.historyFile = path.join(homeDir, '.grok', 'operation-history.json');
    
    this.loadHistory();
    
    if (this.options.autoCleanup) {
      this.cleanupOldEntries();
    }
  }

  /**
   * Record a new operation in history
   */
  async recordOperation(
    operation: OperationType,
    description: string,
    files: string[],
    rollbackData: RollbackData,
    metadata: Partial<OperationMetadata> = {}
  ): Promise<ToolResult> {
    try {
      // Create snapshots of affected files before recording
      const fileSnapshots = await this.createFileSnapshots(files);
      
      const entry: HistoryEntry = {
        id: this.generateId(),
        timestamp: new Date(),
        operation,
        description,
        rollbackData: {
          ...rollbackData,
          files: fileSnapshots
        },
        metadata: {
          tool: 'grok-one-shot',
          filesAffected: files,
          operationSize: this.determineOperationSize(files, rollbackData),
          ...metadata
        }
      };

      // Remove any entries after current position (when undoing and then making new changes)
      if (this.currentPosition < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentPosition + 1);
      }

      this.history.push(entry);
      this.currentPosition = this.history.length - 1;

      // Enforce max entries limit
      if (this.history.length > this.options.maxEntries!) {
        this.history = this.history.slice(-this.options.maxEntries!);
        this.currentPosition = this.history.length - 1;
      }

      await this.saveHistory();

      return {
        success: true,
        output: `Operation recorded: ${description} (ID: ${entry.id})`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error recording operation: ${error.message}`
      };
    }
  }

  /**
   * Undo the last operation
   */
  async undo(): Promise<ToolResult> {
    try {
      if (this.currentPosition < 0) {
        return {
          success: false,
          error: "No operations to undo"
        };
      }

      const entry = this.history[this.currentPosition];
      
      // Request confirmation for potentially dangerous operations
      if (this.isDangerousOperation(entry.operation)) {
        const sessionFlags = this.confirmationService.getSessionFlags();
        if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
          const preview = this.generateUndoPreview(entry);
          const confirmationResult = await this.confirmationService.requestConfirmation(
            {
              operation: `Undo: ${entry.description}`,
              filename: entry.metadata.filesAffected.join(', '),
              showVSCodeOpen: false,
              content: preview
            },
            "file"
          );

          if (!confirmationResult.confirmed) {
            return {
              success: false,
              error: confirmationResult.feedback || "Undo operation cancelled by user"
            };
          }
        }
      }

      // Perform the undo
      const result = await this.performUndo(entry);
      if (!result.success) {
        return result;
      }

      this.currentPosition--;

      return {
        success: true,
        output: `Undone: ${entry.description} (${new Date(entry.timestamp).toLocaleString()})`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error during undo: ${error.message}`
      };
    }
  }

  /**
   * Redo the next operation
   */
  async redo(): Promise<ToolResult> {
    try {
      if (this.currentPosition >= this.history.length - 1) {
        return {
          success: false,
          error: "No operations to redo"
        };
      }

      const nextPosition = this.currentPosition + 1;
      const entry = this.history[nextPosition];

      // Request confirmation for potentially dangerous operations
      if (this.isDangerousOperation(entry.operation)) {
        const sessionFlags = this.confirmationService.getSessionFlags();
        if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
          const preview = this.generateRedoPreview(entry);
          const confirmationResult = await this.confirmationService.requestConfirmation(
            {
              operation: `Redo: ${entry.description}`,
              filename: entry.metadata.filesAffected.join(', '),
              showVSCodeOpen: false,
              content: preview
            },
            "file"
          );

          if (!confirmationResult.confirmed) {
            return {
              success: false,
              error: confirmationResult.feedback || "Redo operation cancelled by user"
            };
          }
        }
      }

      // Perform the redo (which is actually re-applying the original operation)
      const result = await this.performRedo(entry);
      if (!result.success) {
        return result;
      }

      this.currentPosition = nextPosition;

      return {
        success: true,
        output: `Redone: ${entry.description} (${new Date(entry.timestamp).toLocaleString()})`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error during redo: ${error.message}`
      };
    }
  }

  /**
   * Show operation history
   */
  async showHistory(limit: number = 10): Promise<ToolResult> {
    try {
      if (this.history.length === 0) {
        return {
          success: true,
          output: "No operations in history"
        };
      }

      const recentEntries = this.history.slice(-limit).reverse();
      let output = `Operation History (last ${Math.min(limit, this.history.length)} entries):\n\n`;

      for (const [index, entry] of recentEntries.entries()) {
        const position = this.history.length - index;
        const isCurrent = position - 1 === this.currentPosition;
        const marker = isCurrent ? '→ ' : '  ';
        
        output += `${marker}${position}. ${entry.description}\n`;
        output += `   ${entry.operation} | ${new Date(entry.timestamp).toLocaleString()}\n`;
        output += `   Files: ${entry.metadata.filesAffected.slice(0, 3).join(', ')}`;
        
        if (entry.metadata.filesAffected.length > 3) {
          output += ` (+${entry.metadata.filesAffected.length - 3} more)`;
        }
        
        output += `\n   ID: ${entry.id}\n\n`;
      }

      if (this.history.length > limit) {
        output += `... and ${this.history.length - limit} older entries\n`;
      }

      output += `\nCurrent position: ${this.currentPosition + 1}/${this.history.length}`;

      return {
        success: true,
        output: output.trim()
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error showing history: ${error.message}`
      };
    }
  }

  /**
   * Go to a specific point in history
   */
  async goToHistoryPoint(entryId: string): Promise<ToolResult> {
    try {
      const entryIndex = this.history.findIndex(entry => entry.id === entryId);
      if (entryIndex === -1) {
        return {
          success: false,
          error: `Operation with ID ${entryId} not found in history`
        };
      }

      const targetPosition = entryIndex;
      
      if (targetPosition === this.currentPosition) {
        return {
          success: true,
          output: "Already at the specified history point"
        };
      }

      // Determine if we need to undo or redo operations
      const operations: string[] = [];
      
      if (targetPosition < this.currentPosition) {
        // Need to undo operations
        for (let i = this.currentPosition; i > targetPosition; i--) {
          const undoResult = await this.undo();
          if (!undoResult.success) {
            return undoResult;
          }
          operations.push(`Undone: ${this.history[i].description}`);
        }
      } else {
        // Need to redo operations
        for (let i = this.currentPosition; i < targetPosition; i++) {
          const redoResult = await this.redo();
          if (!redoResult.success) {
            return redoResult;
          }
          operations.push(`Redone: ${this.history[i + 1].description}`);
        }
      }

      return {
        success: true,
        output: `Moved to history point ${entryId}:\n${operations.join('\n')}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error navigating to history point: ${error.message}`
      };
    }
  }

  /**
   * Clear operation history
   */
  async clearHistory(): Promise<ToolResult> {
    try {
      // Request confirmation
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const confirmationResult = await this.confirmationService.requestConfirmation(
          {
            operation: `Clear operation history (${this.history.length} entries)`,
            filename: 'operation history',
            showVSCodeOpen: false,
            content: `This will permanently delete all ${this.history.length} recorded operations.\nThis action cannot be undone.`
          },
          "file"
        );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "Clear history cancelled by user"
          };
        }
      }

      this.history = [];
      this.currentPosition = -1;
      await this.saveHistory();

      return {
        success: true,
        output: "Operation history cleared"
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error clearing history: ${error.message}`
      };
    }
  }

  /**
   * Create snapshots of files before operation
   */
  private async createFileSnapshots(files: string[]): Promise<FileSnapshot[]> {
    const snapshots: FileSnapshot[] = [];

    for (const filePath of files) {
      try {
        const resolvedPath = path.resolve(filePath);
        const exists = await pathExists(resolvedPath);

        const snapshot: FileSnapshot = {
          filePath: resolvedPath,
          existed: exists
        };

        if (exists) {
          const stats = await ops.promises.stat(resolvedPath);
          
          if (stats.isFile() && this.shouldSnapshotFile(resolvedPath)) {
            snapshot.content = await ops.promises.readFile(resolvedPath, 'utf-8');
            snapshot.size = stats.size;
            snapshot.lastModified = stats.mtime;
            snapshot.permissions = stats.mode.toString(8);
          }
        }

        snapshots.push(snapshot);
      } catch (_error) {
        // If we can't snapshot a file, record it as non-existent
        snapshots.push({
          filePath: path.resolve(filePath),
          existed: false
        });
      }
    }

    return snapshots;
  }

  /**
   * Check if file should be snapshotted (based on size and type)
   */
  private shouldSnapshotFile(filePath: string): boolean {
    // Skip large files (> 1MB)
    try {
      const stats = ops.statSync(filePath);
      if (stats.size > 1024 * 1024) {
        return false;
      }
    } catch {
      return false;
    }

    // Skip binary files
    const ext = path.extname(filePath).toLowerCase();
    const binaryExtensions = [
      '.exe', '.dll', '.so', '.dylib', '.bin',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico',
      '.mp3', '.mp4', '.avi', '.mkv', '.mov',
      '.zip', '.tar', '.gz', '.rar', '.7z',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx'
    ];

    if (binaryExtensions.includes(ext)) {
      return false;
    }

    // Skip files matching exclude patterns
    for (const pattern of this.options.excludePatterns || []) {
      if (this.matchesPattern(filePath, pattern)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Perform undo operation
   */
  private async performUndo(entry: HistoryEntry): Promise<ToolResult> {
    try {
      const rollbackData = entry.rollbackData;

      switch (rollbackData.type) {
        case 'file_operations':
          return await this.undoFileOperations(rollbackData.files);
        
        case 'multi_file':
          return await this.undoMultiFileOperation(rollbackData.files);
        
        case 'refactor':
          return await this.undoRefactorOperation(rollbackData.files, rollbackData.customData);
        
        case 'search_replace':
          return await this.undoSearchReplaceOperation(rollbackData.files);
        
        default:
          return {
            success: false,
            error: `Unknown rollback type: ${rollbackData.type}`
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Error performing undo: ${error.message}`
      };
    }
  }

  /**
   * Perform redo operation
   */
  private async performRedo(_entry: HistoryEntry): Promise<ToolResult> {
    // For redo, we need to re-apply the changes
    // This is complex because we need to store the "forward" changes as well
    // For now, this is a simplified implementation
    return {
      success: false,
      error: "Redo functionality requires storing forward changes - not yet implemented"
    };
  }

  /**
   * Undo file operations
   */
  private async undoFileOperations(fileSnapshots: FileSnapshot[]): Promise<ToolResult> {
    const restored: string[] = [];
    const errors: string[] = [];

    for (const snapshot of fileSnapshots) {
      try {
        const currentExists = await pathExists(snapshot.filePath);

        if (snapshot.existed && snapshot.content !== undefined) {
          // Restore file content
          await ops.ensureDir(path.dirname(snapshot.filePath));
          await ops.promises.writeFile(snapshot.filePath, snapshot.content, 'utf-8');
          
          if (snapshot.permissions) {
            await ops.promises.chmod(snapshot.filePath, parseInt(snapshot.permissions, 8));
          }
          
          restored.push(`Restored: ${snapshot.filePath}`);
        } else if (!snapshot.existed && currentExists) {
          // Remove file that didn't exist before
          await ops.promises.rm(snapshot.filePath);
          restored.push(`Removed: ${snapshot.filePath}`);
        }
      } catch (error: any) {
        errors.push(`Failed to restore ${snapshot.filePath}: ${error.message}`);
      }
    }

    if (errors.length > 0 && restored.length === 0) {
      return {
        success: false,
        error: `Undo failed:\n${errors.join('\n')}`
      };
    }

    let output = `Undo completed:\n${restored.join('\n')}`;
    if (errors.length > 0) {
      output += `\n\nWarnings:\n${errors.join('\n')}`;
    }

    return {
      success: true,
      output
    };
  }

  /**
   * Undo multi-file operation
   */
  private async undoMultiFileOperation(fileSnapshots: FileSnapshot[]): Promise<ToolResult> {
    // Similar to undoFileOperations but with transaction-like behavior
    return await this.undoFileOperations(fileSnapshots);
  }

  /**
   * Undo refactor operation
   */
  private async undoRefactorOperation(fileSnapshots: FileSnapshot[], _customData: any): Promise<ToolResult> {
    // Refactor operations can be more complex and might need custom undo logic
    return await this.undoFileOperations(fileSnapshots);
  }

  /**
   * Undo search and replace operation
   */
  private async undoSearchReplaceOperation(fileSnapshots: FileSnapshot[]): Promise<ToolResult> {
    return await this.undoFileOperations(fileSnapshots);
  }

  /**
   * Generate undo preview
   */
  private generateUndoPreview(entry: HistoryEntry): string {
    let preview = `Undo Preview: ${entry.description}\n`;
    preview += `Operation: ${entry.operation}\n`;
    preview += `Timestamp: ${new Date(entry.timestamp).toLocaleString()}\n`;
    preview += `Files affected: ${entry.metadata.filesAffected.length}\n\n`;

    preview += "Files to be restored:\n";
    for (const file of entry.rollbackData.files.slice(0, 10)) {
      if (file.existed) {
        preview += `  - Restore: ${file.filePath}\n`;
      } else {
        preview += `  - Remove: ${file.filePath}\n`;
      }
    }

    if (entry.rollbackData.files.length > 10) {
      preview += `  ... and ${entry.rollbackData.files.length - 10} more files\n`;
    }

    return preview;
  }

  /**
   * Generate redo preview
   */
  private generateRedoPreview(entry: HistoryEntry): string {
    let preview = `Redo Preview: ${entry.description}\n`;
    preview += `Operation: ${entry.operation}\n`;
    preview += `Timestamp: ${new Date(entry.timestamp).toLocaleString()}\n`;
    preview += `Files affected: ${entry.metadata.filesAffected.length}\n\n`;

    preview += "This will re-apply the original operation.\n";
    preview += "Files to be modified:\n";
    for (const filePath of entry.metadata.filesAffected.slice(0, 10)) {
      preview += `  - ${filePath}\n`;
    }

    if (entry.metadata.filesAffected.length > 10) {
      preview += `  ... and ${entry.metadata.filesAffected.length - 10} more files\n`;
    }

    return preview;
  }

  /**
   * Check if operation is potentially dangerous
   */
  private isDangerousOperation(operation: OperationType): boolean {
    const dangerousOps = ['file_delete', 'directory_delete', 'bulk_operation'];
    return dangerousOps.includes(operation);
  }

  /**
   * Determine operation size
   */
  private determineOperationSize(files: string[], _rollbackData: RollbackData): 'small' | 'medium' | 'large' {
    if (files.length <= 3) return 'small';
    if (files.length <= 10) return 'medium';
    return 'large';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Pattern matching utility
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(filePath);
  }

  /**
   * Clean up old entries
   */
  private cleanupOldEntries(): void {
    if (!this.options.maxAge) return;

    const cutoffTime = Date.now() - this.options.maxAge;
    const originalLength = this.history.length;
    
    this.history = this.history.filter(entry => 
      entry.timestamp.getTime() > cutoffTime
    );

    // Adjust current position
    const removedCount = originalLength - this.history.length;
    this.currentPosition = Math.max(-1, this.currentPosition - removedCount);
  }

  /**
   * Load history from file
   */
  private async loadHistory(): Promise<void> {
    try {
      if (await pathExists(this.historyFile)) {
        const data = await ops.promises.readFile(this.historyFile, 'utf-8');
        const parsed = JSON.parse(data);
        
        this.history = parsed.entries.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        
        this.currentPosition = parsed.currentPosition || this.history.length - 1;
      }
    } catch (_error) {
      // If we can't load history, start fresh
      this.history = [];
      this.currentPosition = -1;
    }
  }

  /**
   * Save history to file
   */
  private async saveHistory(): Promise<void> {
    try {
      await ops.ensureDir(path.dirname(this.historyFile));
      
      const data = {
        entries: this.history,
        currentPosition: this.currentPosition,
        lastUpdated: new Date().toISOString()
      };
      
      await ops.promises.writeFile(this.historyFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (_error) {
      // Silently ignore save errors to avoid disrupting operations
    }
  }

  /**
   * Get current history status
   */
  getStatus(): { totalEntries: number; currentPosition: number; canUndo: boolean; canRedo: boolean } {
    return {
      totalEntries: this.history.length,
      currentPosition: this.currentPosition,
      canUndo: this.currentPosition >= 0,
      canRedo: this.currentPosition < this.history.length - 1
    };
  }
}