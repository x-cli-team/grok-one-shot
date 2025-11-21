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
import { writeFile as writeFilePromise } from "fs/promises";
import { ToolResult } from "../../types/index.js";
import { ConfirmationService } from "../../utils/confirmation-service.js";

export interface FileOperation {
  type: 'create' | 'edit' | 'delete' | 'rename' | 'move';
  filePath: string;
  content?: string;
  oldContent?: string;
  newFilePath?: string; // For rename/move operations
  operations?: EditOperation[]; // For complex edits
}

export interface EditOperation {
  type: 'replace' | 'insert' | 'delete_lines';
  oldStr?: string;
  newStr?: string;
  startLine?: number;
  endLine?: number;
  content?: string;
}

export interface MultiFileTransaction {
  id: string;
  timestamp: Date;
  operations: FileOperation[];
  committed: boolean;
  rollbackData?: any[];
}

export class MultiFileEditorTool {
  private confirmationService = ConfirmationService.getInstance();
  private transactions: Map<string, MultiFileTransaction> = new Map();
  private currentTransactionId: string | null = null;

  /**
   * Begin a multi-file transaction
   */
  async beginTransaction(description?: string): Promise<ToolResult> {
    try {
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const transaction: MultiFileTransaction = {
        id: transactionId,
        timestamp: new Date(),
        operations: [],
        committed: false,
        rollbackData: []
      };

      this.transactions.set(transactionId, transaction);
      this.currentTransactionId = transactionId;

      return {
        success: true,
        output: `Transaction ${transactionId} started${description ? `: ${description}` : ''}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error starting transaction: ${error.message}`
      };
    }
  }

  /**
   * Add file operations to current transaction
   */
  async addOperations(operations: FileOperation[]): Promise<ToolResult> {
    try {
      if (!this.currentTransactionId) {
        return {
          success: false,
          error: "No active transaction. Use beginTransaction() first."
        };
      }

      const transaction = this.transactions.get(this.currentTransactionId);
      if (!transaction) {
        return {
          success: false,
          error: "Transaction not found"
        };
      }

      // Validate operations
      for (const op of operations) {
        const validation = await this.validateOperation(op);
        if (!validation.valid) {
          return {
            success: false,
            error: `Invalid operation on ${op.filePath}: ${validation.error}`
          };
        }
      }

      transaction.operations.push(...operations);

      return {
        success: true,
        output: `Added ${operations.length} operations to transaction ${this.currentTransactionId}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error adding operations: ${error.message}`
      };
    }
  }

  /**
   * Preview changes without committing
   */
  async previewTransaction(): Promise<ToolResult> {
    try {
      if (!this.currentTransactionId) {
        return {
          success: false,
          error: "No active transaction"
        };
      }

      const transaction = this.transactions.get(this.currentTransactionId);
      if (!transaction) {
        return {
          success: false,
          error: "Transaction not found"
        };
      }

      let preview = `Transaction ${this.currentTransactionId} Preview:\n`;
      preview += `Operations: ${transaction.operations.length}\n\n`;

      for (const [index, op] of transaction.operations.entries()) {
        preview += `${index + 1}. ${op.type.toUpperCase()}: ${op.filePath}\n`;
        
        switch (op.type) {
          case 'create':
            preview += `   → Create new file with ${op.content?.split('\n').length || 0} lines\n`;
            break;
          case 'edit':
            if (op.operations) {
              preview += `   → ${op.operations.length} edit operation(s)\n`;
              for (const editOp of op.operations) {
                preview += `     - ${editOp.type}\n`;
              }
            }
            break;
          case 'delete':
            preview += `   → Delete file\n`;
            break;
          case 'rename':
            preview += `   → Rename to ${op.newFilePath}\n`;
            break;
          case 'move':
            preview += `   → Move to ${op.newFilePath}\n`;
            break;
        }
        preview += '\n';
      }

      return {
        success: true,
        output: preview
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error previewing transaction: ${error.message}`
      };
    }
  }

  /**
   * Commit the current transaction
   */
  async commitTransaction(): Promise<ToolResult> {
    try {
      if (!this.currentTransactionId) {
        return {
          success: false,
          error: "No active transaction"
        };
      }

      const transaction = this.transactions.get(this.currentTransactionId);
      if (!transaction) {
        return {
          success: false,
          error: "Transaction not found"
        };
      }

      if (transaction.committed) {
        return {
          success: false,
          error: "Transaction already committed"
        };
      }

      // Request confirmation for the entire transaction
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const preview = await this.previewTransaction();
        const confirmationResult = await this.confirmationService.requestConfirmation(
          {
            operation: `Multi-file transaction (${transaction.operations.length} operations)`,
            filename: transaction.operations.map(op => op.filePath).join(', '),
            showVSCodeOpen: false,
            content: preview.output || 'Multi-file transaction'
          },
          "file"
        );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "Transaction cancelled by user"
          };
        }
      }

      // Store rollback data before making changes
      const rollbackData: any[] = [];

      // Execute operations
      const results: string[] = [];
      
      for (const [index, op] of transaction.operations.entries()) {
        try {
          const rollbackInfo = await this.createRollbackInfo(op);
          rollbackData.push(rollbackInfo);

          const result = await this.executeOperation(op);
          if (!result.success) {
            // Rollback already executed operations
            await this.rollbackOperations(rollbackData.slice(0, index));
            return {
              success: false,
              error: `Operation ${index + 1} failed: ${result.error}`
            };
          }
          results.push(`✓ ${op.type}: ${op.filePath}`);
        } catch (error: any) {
          // Rollback already executed operations
          await this.rollbackOperations(rollbackData.slice(0, index));
          return {
            success: false,
            error: `Operation ${index + 1} failed: ${error.message}`
          };
        }
      }

      transaction.committed = true;
      transaction.rollbackData = rollbackData;
      this.currentTransactionId = null;

      return {
        success: true,
        output: `Transaction ${transaction.id} committed successfully:\n${results.join('\n')}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error committing transaction: ${error.message}`
      };
    }
  }

  /**
   * Rollback the current or specified transaction
   */
  async rollbackTransaction(transactionId?: string): Promise<ToolResult> {
    try {
      const txId = transactionId || this.currentTransactionId;
      if (!txId) {
        return {
          success: false,
          error: "No transaction specified"
        };
      }

      const transaction = this.transactions.get(txId);
      if (!transaction) {
        return {
          success: false,
          error: "Transaction not found"
        };
      }

      if (!transaction.committed) {
        // Just cancel the transaction
        this.transactions.delete(txId);
        if (this.currentTransactionId === txId) {
          this.currentTransactionId = null;
        }
        return {
          success: true,
          output: `Transaction ${txId} cancelled`
        };
      }

      if (!transaction.rollbackData) {
        return {
          success: false,
          error: "No rollback data available for this transaction"
        };
      }

      await this.rollbackOperations(transaction.rollbackData);

      this.transactions.delete(txId);

      return {
        success: true,
        output: `Transaction ${txId} rolled back successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error rolling back transaction: ${error.message}`
      };
    }
  }

  /**
   * Execute multiple file operations atomically
   */
  async executeMultiFileOperation(operations: FileOperation[], description?: string): Promise<ToolResult> {
    try {
      // Start transaction
      const beginResult = await this.beginTransaction(description);
      if (!beginResult.success) {
        return beginResult;
      }

      // Add operations
      const addResult = await this.addOperations(operations);
      if (!addResult.success) {
        await this.rollbackTransaction();
        return addResult;
      }

      // Commit transaction
      return await this.commitTransaction();
    } catch (error: any) {
      if (this.currentTransactionId) {
        await this.rollbackTransaction();
      }
      return {
        success: false,
        error: `Error executing multi-file operation: ${error.message}`
      };
    }
  }

  /**
   * Validate an operation before execution
   */
  private async validateOperation(operation: FileOperation): Promise<{ valid: boolean; error?: string }> {
    try {
      const resolvedPath = path.resolve(operation.filePath);

      switch (operation.type) {
        case 'create':
          if (await pathExists(resolvedPath)) {
            return { valid: false, error: "File already exists" };
          }
          if (!operation.content) {
            return { valid: false, error: "Content required for create operation" };
          }
          break;

        case 'edit':
          if (!(await pathExists(resolvedPath))) {
            return { valid: false, error: "File does not exist" };
          }
          if (!operation.operations || operation.operations.length === 0) {
            return { valid: false, error: "Edit operations required" };
          }
          break;

        case 'delete':
          if (!(await pathExists(resolvedPath))) {
            return { valid: false, error: "File does not exist" };
          }
          break;

        case 'rename':
        case 'move':
          if (!(await pathExists(resolvedPath))) {
            return { valid: false, error: "Source file does not exist" };
          }
          if (!operation.newFilePath) {
            return { valid: false, error: "Destination path required" };
          }
          const newResolvedPath = path.resolve(operation.newFilePath);
          if (await pathExists(newResolvedPath)) {
            return { valid: false, error: "Destination already exists" };
          }
          break;
      }

      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Create rollback information for an operation
   */
  private async createRollbackInfo(operation: FileOperation): Promise<any> {
    const resolvedPath = path.resolve(operation.filePath);

    switch (operation.type) {
      case 'create':
        return {
          type: 'delete_created',
          filePath: operation.filePath
        };

      case 'edit':
        const originalContent = await ops.promises.readFile(resolvedPath, 'utf-8');
        return {
          type: 'restore_content',
          filePath: operation.filePath,
          originalContent
        };

      case 'delete':
        const contentToRestore = await ops.promises.readFile(resolvedPath, 'utf-8');
        const stats = await ops.promises.stat(resolvedPath);
        return {
          type: 'restore_deleted',
          filePath: operation.filePath,
          content: contentToRestore,
          stats
        };

      case 'rename':
      case 'move':
        return {
          type: 'restore_move',
          oldPath: operation.filePath,
          newPath: operation.newFilePath
        };

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Execute a single operation
   */
  private async executeOperation(operation: FileOperation): Promise<ToolResult> {
    const resolvedPath = path.resolve(operation.filePath);

    switch (operation.type) {
      case 'create':
        const dir = path.dirname(resolvedPath);
        await ops.promises.mkdir(dir, { recursive: true });
        await writeFilePromise(resolvedPath, operation.content!, 'utf-8');
        return { success: true, output: `Created ${operation.filePath}` };

      case 'edit':
        let content = await ops.promises.readFile(resolvedPath, 'utf-8');
        
        for (const editOp of operation.operations!) {
          content = await this.applyEditOperation(content, editOp);
        }
        
        await writeFilePromise(resolvedPath, content, 'utf-8');
        return { success: true, output: `Edited ${operation.filePath}` };

      case 'delete':
        await ops.promises.rm(resolvedPath);
        return { success: true, output: `Deleted ${operation.filePath}` };

      case 'rename':
      case 'move':
        const newResolvedPath = path.resolve(operation.newFilePath!);
        const newDir = path.dirname(newResolvedPath);
        await ops.promises.mkdir(newDir, { recursive: true });
        await ops.move(resolvedPath, newResolvedPath);
        return { success: true, output: `${operation.type === 'rename' ? 'Renamed' : 'Moved'} ${operation.filePath} to ${operation.newFilePath}` };

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Apply an edit operation to content
   */
  private async applyEditOperation(content: string, operation: EditOperation): Promise<string> {
    switch (operation.type) {
      case 'replace':
        if (!operation.oldStr || operation.newStr === undefined) {
          throw new Error('oldStr and newStr required for replace operation');
        }
        return content.replace(operation.oldStr, operation.newStr);

      case 'insert':
        if (operation.startLine === undefined || !operation.content) {
          throw new Error('startLine and content required for insert operation');
        }
        const lines = content.split('\n');
        lines.splice(operation.startLine - 1, 0, operation.content);
        return lines.join('\n');

      case 'delete_lines':
        if (operation.startLine === undefined || operation.endLine === undefined) {
          throw new Error('startLine and endLine required for delete_lines operation');
        }
        const contentLines = content.split('\n');
        contentLines.splice(operation.startLine - 1, operation.endLine - operation.startLine + 1);
        return contentLines.join('\n');

      default:
        throw new Error(`Unknown edit operation type: ${operation.type}`);
    }
  }

  /**
   * Rollback operations using rollback data
   */
  private async rollbackOperations(rollbackData: any[]): Promise<void> {
    // Rollback in reverse order
    for (let i = rollbackData.length - 1; i >= 0; i--) {
      const rollback = rollbackData[i];
      
      switch (rollback.type) {
        case 'delete_created':
          const createdPath = path.resolve(rollback.filePath);
          if (await pathExists(createdPath)) {
            await ops.promises.rm(createdPath);
          }
          break;

        case 'restore_content':
          const editedPath = path.resolve(rollback.filePath);
          await writeFilePromise(editedPath, rollback.originalContent, 'utf-8');
          break;

        case 'restore_deleted':
          const deletedPath = path.resolve(rollback.filePath);
          const deletedDir = path.dirname(deletedPath);
          await ops.promises.mkdir(deletedDir, { recursive: true });
          await writeFilePromise(deletedPath, rollback.content, 'utf-8');
          break;

        case 'restore_move':
          const movedNewPath = path.resolve(rollback.newPath);
          const movedOldPath = path.resolve(rollback.oldPath);
          if (await pathExists(movedNewPath)) {
            const oldDir = path.dirname(movedOldPath);
            await ops.promises.mkdir(oldDir, { recursive: true });
            await ops.move(movedNewPath, movedOldPath);
          }
          break;
      }
    }
  }

  /**
   * List all transactions
   */
  async listTransactions(): Promise<ToolResult> {
    try {
      if (this.transactions.size === 0) {
        return {
          success: true,
          output: "No transactions found"
        };
      }

      let output = "Transactions:\n";
      for (const [id, tx] of this.transactions) {
        output += `${id}: ${tx.committed ? 'COMMITTED' : 'PENDING'} (${tx.operations.length} operations) - ${tx.timestamp.toISOString()}\n`;
      }

      return {
        success: true,
        output: output.trim()
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error listing transactions: ${error.message}`
      };
    }
  }

  /**
   * Get current transaction status
   */
  getCurrentTransactionId(): string | null {
    return this.currentTransactionId;
  }
}