import * as ops from "fs";

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

export interface SearchOptions {
  pattern: string;
  isRegex?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  includeFiles?: string[]; // glob patterns
  excludeFiles?: string[]; // glob patterns
  maxResults?: number;
  showContext?: number; // lines of context
}

export interface ReplaceOptions extends SearchOptions {
  replacement: string;
  dryRun?: boolean;
}

export interface SearchResult {
  filePath: string;
  matches: SearchMatch[];
  totalMatches: number;
}

export interface SearchMatch {
  line: number;
  column: number;
  text: string;
  beforeContext?: string[];
  afterContext?: string[];
  matchedText: string;
}

export interface ReplaceResult {
  filePath: string;
  replacements: number;
  preview?: string;
  success: boolean;
  error?: string;
}

export class AdvancedSearchTool {
  private confirmationService = ConfirmationService.getInstance();

  /**
   * Search for patterns across files
   */
  async search(searchPath: string, options: SearchOptions): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(searchPath);
      
      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `Path not found: ${searchPath}`
        };
      }

      const stats = await ops.promises.stat(resolvedPath);
      const filesToSearch: string[] = [];

      if (stats.isFile()) {
        filesToSearch.push(resolvedPath);
      } else if (stats.isDirectory()) {
        const files = await this.getFilesRecursively(resolvedPath, options);
        filesToSearch.push(...files);
      }

      const results: SearchResult[] = [];
      let totalMatches = 0;

      for (const filePath of filesToSearch) {
        if (options.maxResults && totalMatches >= options.maxResults) {
          break;
        }

        const fileResult = await this.searchInFile(filePath, options);
        if (fileResult.matches.length > 0) {
          results.push(fileResult);
          totalMatches += fileResult.totalMatches;
        }
      }

      return {
        success: true,
        output: this.formatSearchResults(results, options)
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Search error: ${error.message}`
      };
    }
  }

  /**
   * Search and replace patterns across files
   */
  async searchAndReplace(searchPath: string, options: ReplaceOptions): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(searchPath);
      
      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `Path not found: ${searchPath}`
        };
      }

      const stats = await ops.promises.stat(resolvedPath);
      const filesToProcess: string[] = [];

      if (stats.isFile()) {
        filesToProcess.push(resolvedPath);
      } else if (stats.isDirectory()) {
        const files = await this.getFilesRecursively(resolvedPath, options);
        filesToProcess.push(...files);
      }

      const results: ReplaceResult[] = [];
      let totalReplacements = 0;

      // First pass: find all matches and prepare replacements
      for (const filePath of filesToProcess) {
        const replaceResult = await this.replaceInFile(filePath, options);
        if (replaceResult.replacements > 0) {
          results.push(replaceResult);
          totalReplacements += replaceResult.replacements;
        }
      }

      if (totalReplacements === 0) {
        return {
          success: true,
          output: "No matches found for replacement"
        };
      }

      // Show preview and request confirmation if not in dry run mode
      if (!options.dryRun) {
        const sessionFlags = this.confirmationService.getSessionFlags();
        if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
          const preview = this.formatReplaceResults(results, true);
          const confirmationResult = await this.confirmationService.requestConfirmation(
            {
              operation: `Replace in ${results.length} file(s) (${totalReplacements} replacements)`,
              filename: results.map(r => r.filePath).join(', '),
              showVSCodeOpen: false,
              content: preview
            },
            "file"
          );

          if (!confirmationResult.confirmed) {
            return {
              success: false,
              error: confirmationResult.feedback || "Replace operation cancelled by user"
            };
          }
        }

        // Actually perform replacements
        for (const result of results) {
          if (result.success && result.preview) {
            await ops.promises.writeFile(result.filePath, result.preview, 'utf-8');
          }
        }
      }

      return {
        success: true,
        output: this.formatReplaceResults(results, options.dryRun || false)
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Replace error: ${error.message}`
      };
    }
  }

  /**
   * Find files matching pattern
   */
  async findFiles(searchPath: string, pattern: string, options: { isRegex?: boolean; maxResults?: number } = {}): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(searchPath);
      
      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `Path not found: ${searchPath}`
        };
      }

      const allFiles = await this.getFilesRecursively(resolvedPath);
      const matchingFiles: string[] = [];

      const regex = options.isRegex ? new RegExp(pattern, 'i') : null;

      for (const filePath of allFiles) {
        if (options.maxResults && matchingFiles.length >= options.maxResults) {
          break;
        }

        const fileName = path.basename(filePath);
        const relativePath = path.relative(resolvedPath, filePath);

        let matches = false;
        if (regex) {
          matches = regex.test(fileName) || regex.test(relativePath);
        } else {
          matches = fileName.toLowerCase().includes(pattern.toLowerCase()) ||
                   relativePath.toLowerCase().includes(pattern.toLowerCase());
        }

        if (matches) {
          matchingFiles.push(relativePath);
        }
      }

      return {
        success: true,
        output: matchingFiles.length > 0 
          ? `Found ${matchingFiles.length} files:\n${matchingFiles.join('\n')}`
          : 'No matching files found'
      };
    } catch (error: any) {
      return {
        success: false,
        error: `File search error: ${error.message}`
      };
    }
  }

  /**
   * Search in a single file
   */
  private async searchInFile(filePath: string, options: SearchOptions): Promise<SearchResult> {
    const content = await ops.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const matches: SearchMatch[] = [];

    let pattern: RegExp;
    try {
      if (options.isRegex) {
        const flags = options.caseSensitive ? 'g' : 'gi';
        pattern = new RegExp(options.pattern, flags);
      } else {
        const escapedPattern = options.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordBoundary = options.wholeWord ? '\\b' : '';
        const flags = options.caseSensitive ? 'g' : 'gi';
        pattern = new RegExp(`${wordBoundary}${escapedPattern}${wordBoundary}`, flags);
      }
    } catch (_error) {
      throw new Error(`Invalid regex pattern: ${options.pattern}`);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;
      pattern.lastIndex = 0; // Reset regex state

      while ((match = pattern.exec(line)) !== null) {
        const searchMatch: SearchMatch = {
          line: i + 1,
          column: match.index + 1,
          text: line,
          matchedText: match[0]
        };

        // Add context if requested
        if (options.showContext && options.showContext > 0) {
          const contextStart = Math.max(0, i - options.showContext);
          const contextEnd = Math.min(lines.length, i + options.showContext + 1);
          
          searchMatch.beforeContext = lines.slice(contextStart, i);
          searchMatch.afterContext = lines.slice(i + 1, contextEnd);
        }

        matches.push(searchMatch);

        // Prevent infinite loop on zero-width matches
        if (match[0].length === 0) {
          pattern.lastIndex++;
        }
      }
    }

    return {
      filePath: path.relative(process.cwd(), filePath),
      matches,
      totalMatches: matches.length
    };
  }

  /**
   * Replace in a single file
   */
  private async replaceInFile(filePath: string, options: ReplaceOptions): Promise<ReplaceResult> {
    try {
      const content = await ops.promises.readFile(filePath, 'utf-8');
      
      let pattern: RegExp;
      try {
        if (options.isRegex) {
          const flags = options.caseSensitive ? 'g' : 'gi';
          pattern = new RegExp(options.pattern, flags);
        } else {
          const escapedPattern = options.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const wordBoundary = options.wholeWord ? '\\b' : '';
          const flags = options.caseSensitive ? 'g' : 'gi';
          pattern = new RegExp(`${wordBoundary}${escapedPattern}${wordBoundary}`, flags);
        }
      } catch (_error) {
        return {
          filePath: path.relative(process.cwd(), filePath),
          replacements: 0,
          success: false,
          error: `Invalid regex pattern: ${options.pattern}`
        };
      }

      const matches = content.match(pattern);
      const replacementCount = matches ? matches.length : 0;

      if (replacementCount === 0) {
        return {
          filePath: path.relative(process.cwd(), filePath),
          replacements: 0,
          success: true
        };
      }

      const newContent = content.replace(pattern, options.replacement);

      return {
        filePath: path.relative(process.cwd(), filePath),
        replacements: replacementCount,
        preview: newContent,
        success: true
      };
    } catch (error: any) {
      return {
        filePath: path.relative(process.cwd(), filePath),
        replacements: 0,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get files recursively with filtering
   */
  private async getFilesRecursively(dirPath: string, options?: SearchOptions): Promise<string[]> {
    const files: string[] = [];
    
    const walk = async (currentPath: string) => {
      const entries = await ops.promises.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip common directories that shouldn't be searched
          if (this.shouldSkipDirectory(entry.name)) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          if (this.shouldIncludeFile(fullPath, options)) {
            files.push(fullPath);
          }
        }
      }
    };

    await walk(dirPath);
    return files;
  }

  /**
   * Check if directory should be skipped
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      '.vscode',
      '.idea',
      'dist',
      'build',
      'coverage',
      '.next',
      '.nuxt',
      '__pycache__',
      '.pytest_cache',
      'vendor'
    ];
    
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  /**
   * Check if file should be included in search
   */
  private shouldIncludeFile(filePath: string, options?: SearchOptions): boolean {
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName);
    
    // Skip binary files and common non-text files
    const skipExtensions = [
      '.exe', '.dll', '.so', '.dylib', '.bin',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
      '.mp3', '.mp4', '.avi', '.mkv', '.mov',
      '.zip', '.tar', '.gz', '.rar', '.7z',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
    ];
    
    if (skipExtensions.includes(ext.toLowerCase())) {
      return false;
    }

    // Apply include/exclude patterns if specified
    if (options?.excludeFiles) {
      for (const pattern of options.excludeFiles) {
        if (this.matchesGlob(filePath, pattern)) {
          return false;
        }
      }
    }

    if (options?.includeFiles) {
      for (const pattern of options.includeFiles) {
        if (this.matchesGlob(filePath, pattern)) {
          return true;
        }
      }
      // If include patterns are specified but none match, exclude the file
      return false;
    }

    return true;
  }

  /**
   * Simple glob pattern matching
   */
  private matchesGlob(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(path.basename(filePath)) || regex.test(filePath);
  }

  /**
   * Format search results for display
   */
  private formatSearchResults(results: SearchResult[], options: SearchOptions): string {
    if (results.length === 0) {
      return 'No matches found';
    }

    let output = `Found ${results.reduce((sum, r) => sum + r.totalMatches, 0)} matches in ${results.length} files:\n\n`;

    for (const result of results) {
      output += `${result.filePath} (${result.totalMatches} matches):\n`;
      
      for (const match of result.matches) {
        output += `  ${match.line}:${match.column}: ${match.text.trim()}\n`;
        
        if (options.showContext && (match.beforeContext || match.afterContext)) {
          if (match.beforeContext) {
            for (const contextLine of match.beforeContext) {
              output += `    - ${contextLine}\n`;
            }
          }
          output += `    > ${match.text.trim()}\n`;
          if (match.afterContext) {
            for (const contextLine of match.afterContext) {
              output += `    + ${contextLine}\n`;
            }
          }
        }
      }
      output += '\n';
    }

    return output.trim();
  }

  /**
   * Format replace results for display
   */
  private formatReplaceResults(results: ReplaceResult[], isDryRun: boolean): string {
    const totalReplacements = results.reduce((sum, r) => sum + r.replacements, 0);
    const action = isDryRun ? 'Would replace' : 'Replaced';
    
    let output = `${action} ${totalReplacements} occurrences in ${results.length} files:\n\n`;

    for (const result of results) {
      if (result.success) {
        output += `${result.filePath}: ${result.replacements} replacements\n`;
      } else {
        output += `${result.filePath}: ERROR - ${result.error}\n`;
      }
    }

    return output.trim();
  }
}