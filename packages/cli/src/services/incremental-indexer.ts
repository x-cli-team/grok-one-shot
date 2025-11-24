/**
 * Incremental Indexer Service
 * 
 * Provides intelligent file change detection and incremental indexing
 * capabilities for optimal performance on large codebases.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface FileChangeInfo {
  filePath: string;
  relativePath: string;
  changeType: 'added' | 'modified' | 'deleted';
  lastModified: number;
  size: number;
  checksum?: string;
}

export interface IndexSnapshot {
  timestamp: number;
  rootPath: string;
  files: Map<string, FileChangeInfo>;
  indexVersion: string;
}

export interface ChangeDetectionOptions {
  rootPath: string;
  ignorePatterns?: string[];
  extensions?: string[];
  maxFileSize?: number;
  checksumEnabled?: boolean;
}

export interface ChangeDetectionResult {
  hasChanges: boolean;
  addedFiles: FileChangeInfo[];
  modifiedFiles: FileChangeInfo[];
  deletedFiles: string[];
  totalChanges: number;
  snapshot: IndexSnapshot;
}

export class IncrementalIndexer {
  private snapshots = new Map<string, IndexSnapshot>();
  private readonly defaultIgnorePatterns = [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '*.log',
    '.DS_Store',
    'Thumbs.db'
  ];

  private readonly sourceExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.mjs',
    '.py', '.pyx',
    '.java',
    '.go',
    '.rs',
    '.cpp', '.cc', '.cxx', '.c', '.h', '.hpp',
    '.php',
    '.rb',
    '.swift',
    '.kt',
    '.dart'
  ];

  /**
   * Create or update a snapshot of the current codebase state
   */
  async createSnapshot(options: ChangeDetectionOptions): Promise<IndexSnapshot> {
    const startTime = Date.now();
    const files = new Map<string, FileChangeInfo>();
    
    console.log(`[IncrementalIndexer] Creating snapshot for ${options.rootPath}`);
    
    try {
      await this.scanDirectory(options.rootPath, options, files);
      
      const snapshot: IndexSnapshot = {
        timestamp: Date.now(),
        rootPath: options.rootPath,
        files,
        indexVersion: this.generateIndexVersion(files)
      };
      
      this.snapshots.set(options.rootPath, snapshot);
      
      const duration = Date.now() - startTime;
      console.log(`[IncrementalIndexer] Snapshot created: ${files.size} files in ${duration}ms`);
      
      return snapshot;
    } catch (error) {
      console.error('[IncrementalIndexer] Snapshot creation failed:', error);
      throw error;
    }
  }

  /**
   * Detect changes since the last snapshot
   */
  async detectChanges(options: ChangeDetectionOptions): Promise<ChangeDetectionResult> {
    const previousSnapshot = this.snapshots.get(options.rootPath);
    const currentSnapshot = await this.createSnapshot(options);
    
    if (!previousSnapshot) {
      // First time indexing - all files are "added"
      const addedFiles = Array.from(currentSnapshot.files.values());
      return {
        hasChanges: true,
        addedFiles,
        modifiedFiles: [],
        deletedFiles: [],
        totalChanges: addedFiles.length,
        snapshot: currentSnapshot
      };
    }
    
    const addedFiles: FileChangeInfo[] = [];
    const modifiedFiles: FileChangeInfo[] = [];
    const deletedFiles: string[] = [];
    
    // Check for new and modified files
    for (const [relativePath, currentFile] of currentSnapshot.files) {
      const previousFile = previousSnapshot.files.get(relativePath);
      
      if (!previousFile) {
        addedFiles.push({ ...currentFile, changeType: 'added' });
      } else if (this.hasFileChanged(currentFile, previousFile)) {
        modifiedFiles.push({ ...currentFile, changeType: 'modified' });
      }
    }
    
    // Check for deleted files
    for (const [relativePath] of previousSnapshot.files) {
      if (!currentSnapshot.files.has(relativePath)) {
        deletedFiles.push(relativePath);
      }
    }
    
    const totalChanges = addedFiles.length + modifiedFiles.length + deletedFiles.length;
    const hasChanges = totalChanges > 0;
    
    console.log(`[IncrementalIndexer] Change detection: ${addedFiles.length} added, ${modifiedFiles.length} modified, ${deletedFiles.length} deleted`);
    
    return {
      hasChanges,
      addedFiles,
      modifiedFiles,
      deletedFiles,
      totalChanges,
      snapshot: currentSnapshot
    };
  }

  /**
   * Get statistics about the current snapshot
   */
  getSnapshotStats(rootPath: string): {
    exists: boolean;
    timestamp: Date | null;
    fileCount: number;
    indexVersion: string | null;
  } {
    const snapshot = this.snapshots.get(rootPath);
    
    return {
      exists: !!snapshot,
      timestamp: snapshot ? new Date(snapshot.timestamp) : null,
      fileCount: snapshot ? snapshot.files.size : 0,
      indexVersion: snapshot ? snapshot.indexVersion : null
    };
  }

  /**
   * Clear snapshot for a specific path
   */
  clearSnapshot(rootPath: string): void {
    this.snapshots.delete(rootPath);
  }

  /**
   * Clear all snapshots
   */
  clearAllSnapshots(): void {
    this.snapshots.clear();
  }

  /**
   * Check if a file should be considered for change detection
   */
  shouldTrackFile(filePath: string, options: ChangeDetectionOptions): boolean {
    const relativePath = path.relative(options.rootPath, filePath);
    const extension = path.extname(filePath);
    
    // Check ignore patterns
    const ignorePatterns = [...this.defaultIgnorePatterns, ...(options.ignorePatterns || [])];
    for (const pattern of ignorePatterns) {
      if (this.matchesPattern(relativePath, pattern)) {
        return false;
      }
    }
    
    // Check extensions
    const allowedExtensions = options.extensions || this.sourceExtensions;
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
      return false;
    }
    
    return true;
  }

  // Private methods

  private async scanDirectory(
    dirPath: string,
    options: ChangeDetectionOptions,
    files: Map<string, FileChangeInfo>,
    depth = 0
  ): Promise<void> {
    if (depth > 10) return; // Prevent infinite recursion
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (!this.shouldTrackFile(fullPath, options)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, options, files, depth + 1);
        } else {
          try {
            const stats = await fs.stat(fullPath);
            
            // Skip files that are too large
            if (options.maxFileSize && stats.size > options.maxFileSize) {
              continue;
            }
            
            const relativePath = path.relative(options.rootPath, fullPath);
            const fileInfo: FileChangeInfo = {
              filePath: fullPath,
              relativePath,
              changeType: 'added', // Will be updated during change detection
              lastModified: stats.mtimeMs,
              size: stats.size
            };
            
            // Calculate checksum if enabled
            if (options.checksumEnabled && this.isSourceFile(fullPath)) {
              fileInfo.checksum = await this.calculateChecksum(fullPath);
            }
            
            files.set(relativePath, fileInfo);
          } catch (error) {
            // Skip files we can't read
            console.warn(`[IncrementalIndexer] Cannot read file ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`[IncrementalIndexer] Cannot read directory ${dirPath}:`, error);
    }
  }

  private hasFileChanged(current: FileChangeInfo, previous: FileChangeInfo): boolean {
    // Check size first (fastest)
    if (current.size !== previous.size) {
      return true;
    }
    
    // Check modification time
    if (Math.abs(current.lastModified - previous.lastModified) > 1000) { // 1 second tolerance
      return true;
    }
    
    // Check checksum if available (most accurate)
    if (current.checksum && previous.checksum) {
      return current.checksum !== previous.checksum;
    }
    
    return false;
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  private isSourceFile(filePath: string): boolean {
    const extension = path.extname(filePath);
    return this.sourceExtensions.includes(extension);
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    if (pattern.includes('**')) {
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filePath);
    }
    
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filePath);
    }
    
    return filePath.includes(pattern);
  }

  private generateIndexVersion(files: Map<string, FileChangeInfo>): string {
    // Generate a version hash based on file count and total size
    const fileCount = files.size;
    const totalSize = Array.from(files.values()).reduce((sum, file) => sum + file.size, 0);
    const versionString = `${fileCount}-${totalSize}-${Date.now()}`;
    
    return crypto.createHash('md5').update(versionString).digest('hex').substring(0, 8);
  }
}