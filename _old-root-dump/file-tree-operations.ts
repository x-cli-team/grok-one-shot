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

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  children?: FileTreeNode[];
}

export interface BulkOperation {
  type: 'copy' | 'move' | 'delete' | 'create_dir' | 'chmod' | 'rename';
  source: string;
  destination?: string;
  pattern?: string;
  recursive?: boolean;
  mode?: string; // for chmod
}

export interface TreeFilterOptions {
  includeHidden?: boolean;
  maxDepth?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  fileTypes?: string[];
}

export class FileTreeOperationsTool {
  private confirmationService = ConfirmationService.getInstance();

  /**
   * Generate a visual tree representation of directory structure
   */
  async generateTree(rootPath: string, options: TreeFilterOptions = {}): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(rootPath);
      
      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `Path not found: ${rootPath}`
        };
      }

      const tree = await this.buildTreeStructure(resolvedPath, options, 0);
      const treeString = this.formatTree(tree, '', true);

      return {
        success: true,
        output: `Directory tree for ${rootPath}:\n${treeString}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error generating tree: ${error.message}`
      };
    }
  }

  /**
   * Perform bulk operations on files/directories
   */
  async bulkOperations(operations: BulkOperation[]): Promise<ToolResult> {
    try {
      // Validate all operations first
      for (const [index, op] of operations.entries()) {
        const validation = await this.validateBulkOperation(op);
        if (!validation.valid) {
          return {
            success: false,
            error: `Operation ${index + 1} invalid: ${validation.error}`
          };
        }
      }

      // Preview operations
      const preview = this.generateOperationsPreview(operations);

      // Request confirmation
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const confirmationResult = await this.confirmationService.requestConfirmation(
          {
            operation: `Bulk operations (${operations.length} operations)`,
            filename: operations.map(op => op.source).join(', '),
            showVSCodeOpen: false,
            content: preview
          },
          "file"
        );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "Bulk operations cancelled by user"
          };
        }
      }

      // Execute operations
      const results: string[] = [];
      for (const [index, op] of operations.entries()) {
        try {
          const result = await this.executeBulkOperation(op);
          results.push(`✓ Operation ${index + 1}: ${result}`);
        } catch (error: any) {
          results.push(`✗ Operation ${index + 1}: ${error.message}`);
        }
      }

      return {
        success: true,
        output: `Bulk operations completed:\n${results.join('\n')}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error executing bulk operations: ${error.message}`
      };
    }
  }

  /**
   * Copy directory structure (optionally with files)
   */
  async copyStructure(
    sourcePath: string, 
    destinationPath: string, 
    options: { includeFiles?: boolean; overwrite?: boolean } = {}
  ): Promise<ToolResult> {
    try {
      const resolvedSource = path.resolve(sourcePath);
      const resolvedDest = path.resolve(destinationPath);

      if (!(await pathExists(resolvedSource))) {
        return {
          success: false,
          error: `Source path not found: ${sourcePath}`
        };
      }

      if (await pathExists(resolvedDest) && !options.overwrite) {
        return {
          success: false,
          error: `Destination already exists: ${destinationPath}`
        };
      }

      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const confirmationResult = await this.confirmationService.requestConfirmation(
          {
            operation: `Copy structure from ${sourcePath} to ${destinationPath}`,
            filename: `${sourcePath} → ${destinationPath}`,
            showVSCodeOpen: false,
            content: `Copy ${options.includeFiles ? 'structure and files' : 'structure only'}\nOverwrite: ${options.overwrite ? 'Yes' : 'No'}`
          },
          "file"
        );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "Copy structure cancelled by user"
          };
        }
      }

      await this.copyStructureRecursive(resolvedSource, resolvedDest, options);

      return {
        success: true,
        output: `Structure copied from ${sourcePath} to ${destinationPath}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error copying structure: ${error.message}`
      };
    }
  }

  /**
   * Find and organize files by type, size, or date
   */
  async organizeFiles(
    sourcePath: string,
    organizationType: 'type' | 'size' | 'date',
    destinationBase?: string
  ): Promise<ToolResult> {
    try {
      const resolvedSource = path.resolve(sourcePath);
      
      if (!(await pathExists(resolvedSource))) {
        return {
          success: false,
          error: `Source path not found: ${sourcePath}`
        };
      }

      const files = await this.getFilesRecursively(resolvedSource);
      const organization = await this.categorizeFiles(files, organizationType);

      const destBase = destinationBase ? path.resolve(destinationBase) : resolvedSource;
      
      // Preview organization
      let preview = `Organization plan (${organizationType}):\n`;
      for (const [category, fileList] of Object.entries(organization)) {
        preview += `\n${category}/\n`;
        fileList.slice(0, 5).forEach(file => {
          preview += `  - ${path.basename(file)}\n`;
        });
        if (fileList.length > 5) {
          preview += `  ... and ${fileList.length - 5} more files\n`;
        }
      }

      // Request confirmation
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const confirmationResult = await this.confirmationService.requestConfirmation(
          {
            operation: `Organize files by ${organizationType}`,
            filename: sourcePath,
            showVSCodeOpen: false,
            content: preview
          },
          "file"
        );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "File organization cancelled by user"
          };
        }
      }

      // Execute organization
      let movedFiles = 0;
      for (const [category, fileList] of Object.entries(organization)) {
        const categoryDir = path.join(destBase, category);
        await ops.promises.mkdir(categoryDir, { recursive: true });

        for (const filePath of fileList) {
          const fileName = path.basename(filePath);
          const destPath = path.join(categoryDir, fileName);
          await ops.move(filePath, destPath);
          movedFiles++;
        }
      }

      return {
        success: true,
        output: `Organized ${movedFiles} files into ${Object.keys(organization).length} categories by ${organizationType}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error organizing files: ${error.message}`
      };
    }
  }

  /**
   * Clean up empty directories
   */
  async cleanupEmptyDirectories(rootPath: string): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(rootPath);
      
      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `Path not found: ${rootPath}`
        };
      }

      const emptyDirs = await this.findEmptyDirectories(resolvedPath);
      
      if (emptyDirs.length === 0) {
        return {
          success: true,
          output: "No empty directories found"
        };
      }

      // Request confirmation
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const preview = `Empty directories to remove:\n${emptyDirs.map(dir => `- ${path.relative(rootPath, dir)}`).join('\n')}`;
        const confirmationResult = await this.confirmationService.requestConfirmation(
          {
            operation: `Remove ${emptyDirs.length} empty directories`,
            filename: rootPath,
            showVSCodeOpen: false,
            content: preview
          },
          "file"
        );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "Cleanup cancelled by user"
          };
        }
      }

      // Remove empty directories (deepest first)
      emptyDirs.sort((a, b) => b.length - a.length);
      for (const dir of emptyDirs) {
        await ops.rmdir(dir);
      }

      return {
        success: true,
        output: `Removed ${emptyDirs.length} empty directories`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error cleaning up directories: ${error.message}`
      };
    }
  }

  /**
   * Build tree structure recursively
   */
  private async buildTreeStructure(
    dirPath: string, 
    options: TreeFilterOptions, 
    currentDepth: number
  ): Promise<FileTreeNode> {
    const stats = await ops.promises.stat(dirPath);
    const name = path.basename(dirPath);
    
    const node: FileTreeNode = {
      name: name || path.basename(dirPath),
      path: dirPath,
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.size,
      modified: stats.mtime
    };

    if (stats.isDirectory() && (!options.maxDepth || currentDepth < options.maxDepth)) {
      node.children = [];
      
      try {
        const entries = await ops.promises.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          // Skip hidden files unless specified
          if (!options.includeHidden && entry.name.startsWith('.')) {
            continue;
          }

          const fullPath = path.join(dirPath, entry.name);
          
          // Apply filters
          if (!this.passesFilters(fullPath, entry, options)) {
            continue;
          }

          const childNode = await this.buildTreeStructure(fullPath, options, currentDepth + 1);
          node.children.push(childNode);
        }

        // Sort children: directories first, then files, both alphabetically
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      } catch (error) {
        // Skip directories we can't read
      }
    }

    return node;
  }

  /**
   * Format tree structure for display
   */
  private formatTree(node: FileTreeNode, prefix: string, isLast: boolean): string {
    const connector = isLast ? '└── ' : '├── ';
    let result = prefix + connector + node.name;
    
    if (node.type === 'file' && node.size) {
      result += ` (${this.formatFileSize(node.size)})`;
    }
    
    result += '\n';

    if (node.children) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const isLastChild = i === node.children.length - 1;
        result += this.formatTree(child, childPrefix, isLastChild);
      }
    }

    return result;
  }

  /**
   * Check if file/directory passes filters
   */
  private passesFilters(
    fullPath: string, 
    entry: ops.Dirent, 
    options: TreeFilterOptions
  ): boolean {
    const name = entry.name;
    const ext = path.extname(name).toLowerCase();

    // Include/exclude patterns
    if (options.excludePatterns) {
      for (const pattern of options.excludePatterns) {
        if (this.matchesPattern(name, pattern)) {
          return false;
        }
      }
    }

    if (options.includePatterns) {
      let matches = false;
      for (const pattern of options.includePatterns) {
        if (this.matchesPattern(name, pattern)) {
          matches = true;
          break;
        }
      }
      if (!matches) return false;
    }

    // File type filter
    if (options.fileTypes && entry.isFile()) {
      if (!options.fileTypes.includes(ext)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Simple pattern matching (supports * and ?)
   */
  private matchesPattern(text: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(text);
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  /**
   * Validate bulk operation
   */
  private async validateBulkOperation(operation: BulkOperation): Promise<{ valid: boolean; error?: string }> {
    try {
      const sourcePath = path.resolve(operation.source);

      switch (operation.type) {
        case 'copy':
        case 'move':
          if (!(await pathExists(sourcePath))) {
            return { valid: false, error: "Source path does not exist" };
          }
          if (!operation.destination) {
            return { valid: false, error: "Destination required for copy/move operations" };
          }
          break;

        case 'delete':
          if (!(await pathExists(sourcePath))) {
            return { valid: false, error: "Path does not exist" };
          }
          break;

        case 'create_dir':
          if (await pathExists(sourcePath)) {
            return { valid: false, error: "Directory already exists" };
          }
          break;

        case 'chmod':
          if (!(await pathExists(sourcePath))) {
            return { valid: false, error: "Path does not exist" };
          }
          if (!operation.mode) {
            return { valid: false, error: "Mode required for chmod operation" };
          }
          break;

        case 'rename':
          if (!(await pathExists(sourcePath))) {
            return { valid: false, error: "Source path does not exist" };
          }
          if (!operation.destination) {
            return { valid: false, error: "Destination required for rename operation" };
          }
          break;
      }

      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Execute a single bulk operation
   */
  private async executeBulkOperation(operation: BulkOperation): Promise<string> {
    const sourcePath = path.resolve(operation.source);

    switch (operation.type) {
      case 'copy':
        const copyDest = path.resolve(operation.destination!);
        await ops.copy(sourcePath, copyDest);
        return `Copied ${operation.source} to ${operation.destination}`;

      case 'move':
        const moveDest = path.resolve(operation.destination!);
        await ops.move(sourcePath, moveDest);
        return `Moved ${operation.source} to ${operation.destination}`;

      case 'delete':
        await ops.promises.rm(sourcePath);
        return `Deleted ${operation.source}`;

      case 'create_dir':
        await ops.promises.mkdir(sourcePath, { recursive: true });
        return `Created directory ${operation.source}`;

      case 'chmod':
        await ops.promises.chmod(sourcePath, operation.mode!);
        return `Changed permissions of ${operation.source} to ${operation.mode}`;

      case 'rename':
        const renameDest = path.resolve(operation.destination!);
        await ops.move(sourcePath, renameDest);
        return `Renamed ${operation.source} to ${operation.destination}`;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Generate preview of operations
   */
  private generateOperationsPreview(operations: BulkOperation[]): string {
    let preview = `Bulk Operations Preview (${operations.length} operations):\n\n`;
    
    for (const [index, op] of operations.entries()) {
      preview += `${index + 1}. ${op.type.toUpperCase()}: ${op.source}`;
      if (op.destination) {
        preview += ` → ${op.destination}`;
      }
      if (op.mode) {
        preview += ` (mode: ${op.mode})`;
      }
      preview += '\n';
    }

    return preview;
  }

  /**
   * Copy structure recursively
   */
  private async copyStructureRecursive(
    source: string, 
    destination: string, 
    options: { includeFiles?: boolean; overwrite?: boolean }
  ): Promise<void> {
    const stats = await ops.promises.stat(source);

    if (stats.isDirectory()) {
      await ops.promises.mkdir(destination, { recursive: true });
      
      const entries = await ops.promises.readdir(source);
      for (const entry of entries) {
        const srcPath = path.join(source, entry);
        const destPath = path.join(destination, entry);
        await this.copyStructureRecursive(srcPath, destPath, options);
      }
    } else if (options.includeFiles) {
      await ops.copy(source, destination, { overwrite: options.overwrite });
    }
  }

  /**
   * Get all files recursively
   */
  private async getFilesRecursively(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    const walk = async (currentPath: string) => {
      const entries = await ops.promises.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    };

    await walk(dirPath);
    return files;
  }

  /**
   * Categorize files for organization
   */
  private async categorizeFiles(
    files: string[], 
    organizationType: 'type' | 'size' | 'date'
  ): Promise<Record<string, string[]>> {
    const categories: Record<string, string[]> = {};

    for (const filePath of files) {
      let category: string;

      switch (organizationType) {
        case 'type':
          const ext = path.extname(filePath).toLowerCase();
          category = ext || 'no-extension';
          break;

        case 'size':
          const stats = await ops.promises.stat(filePath);
          if (stats.size < 1024) category = 'small (< 1KB)';
          else if (stats.size < 1024 * 1024) category = 'medium (< 1MB)';
          else if (stats.size < 1024 * 1024 * 10) category = 'large (< 10MB)';
          else category = 'very-large (> 10MB)';
          break;

        case 'date':
          const fileStats = await ops.promises.stat(filePath);
          const year = fileStats.mtime.getFullYear();
          const month = fileStats.mtime.getMonth() + 1;
          category = `${year}-${month.toString().padStart(2, '0')}`;
          break;

        default:
          category = 'misc';
      }

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(filePath);
    }

    return categories;
  }

  /**
   * Find empty directories recursively
   */
  private async findEmptyDirectories(dirPath: string): Promise<string[]> {
    const emptyDirs: string[] = [];

    const checkDirectory = async (currentPath: string): Promise<boolean> => {
      try {
        const entries = await ops.promises.readdir(currentPath);
        
        if (entries.length === 0) {
          emptyDirs.push(currentPath);
          return true;
        }

        let hasNonEmptyChildren = false;
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry);
          const stats = await ops.promises.stat(fullPath);
          
          if (stats.isDirectory()) {
            const isEmpty = await checkDirectory(fullPath);
            if (!isEmpty) {
              hasNonEmptyChildren = true;
            }
          } else {
            hasNonEmptyChildren = true;
          }
        }

        // If all children are empty directories, this directory is also considered empty
        if (!hasNonEmptyChildren) {
          emptyDirs.push(currentPath);
          return true;
        }

        return false;
      } catch (error) {
        return false;
      }
    };

    await checkDirectory(dirPath);
    return emptyDirs;
  }
}