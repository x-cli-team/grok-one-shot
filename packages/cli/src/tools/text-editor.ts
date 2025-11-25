import * as ops from "fs";
import { createTwoFilesPatch } from "diff";

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


import { ToolResult, EditorCommand } from "../lib/types/index.js";
import { ConfirmationService } from "../lib/utils/confirmation-service.js";

// Session logging helper - use the main session log file
function logToSession(message: string, data?: any) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `\n[${timestamp}] 🔧 TEXT EDITOR TOOL - ${message}\n=====================================\n${data ? JSON.stringify(data, null, 2) : 'No additional data'}\n=====================================\n`;

    // Find the current session log file in the logs directory
    const workingDir = process.cwd();
    const logsDir = path.join(workingDir, 'logs');
    const fs = ops;
    if (fs.existsSync(logsDir)) {
      const sessionFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('session-') && f.endsWith('.log'));

      if (sessionFiles.length > 0) {
        // Use the most recent session file
        const sessionFile = path.join(logsDir, sessionFiles[sessionFiles.length - 1]);
        fs.appendFileSync(sessionFile, logEntry);
      }
    }
  } catch (error) {
    // Fallback to console if session logging fails
    console.log(`[TextEditorTool] ${message}`, data);
  }
}

export class TextEditorTool {
  private editHistory: EditorCommand[] = [];
  private confirmationService = ConfirmationService.getInstance();

  async view(
    filePath: string,
    viewRange?: [number, number]
  ): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);

      if (await pathExists(resolvedPath)) {
        const stats = await ops.promises.stat(resolvedPath);

        if (stats.isDirectory()) {
          const files = await ops.promises.readdir(resolvedPath);
          return {
            success: true,
            output: `Directory contents of ${filePath}:\n${files.join("\n")}`,
          };
        }

        const content = await ops.promises.readFile(resolvedPath, "utf-8");
        const lines = content.split("\n");

        if (viewRange) {
          const [start, end] = viewRange;
          const selectedLines = lines.slice(start - 1, end);
          const numberedLines = selectedLines
            .map((line, idx) => `${start + idx}: ${line}`)
            .join("\n");

          return {
            success: true,
            output: `Lines ${start}-${end} of ${filePath}:\n${numberedLines}`,
          };
        }

        const totalLines = lines.length;
        const displayLines = totalLines > 10 ? lines.slice(0, 10) : lines;
        const numberedLines = displayLines
          .map((line, idx) => `${idx + 1}: ${line}`)
          .join("\n");
        const additionalLinesMessage =
          totalLines > 10 ? `\n... +${totalLines - 10} lines` : "";

        return {
          success: true,
          output: `Contents of ${filePath}:\n${numberedLines}${additionalLinesMessage}`,
        };
      } else {
        return {
          success: false,
          error: `File or directory not found: ${filePath}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Error viewing ${filePath}: ${error.message}`,
      };
    }
  }

  async strReplace(
    filePath: string,
    oldStr: string,
    newStr: string,
    replaceAll: boolean = false
  ): Promise<ToolResult> {
    try {
      if (oldStr === "") {
        return {
          success: false,
          error: "oldStr cannot be an empty string",
        };
      }

      const resolvedPath = path.resolve(filePath);

      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `File not found: ${filePath}`,
        };
      }

      const content = await ops.promises.readFile(resolvedPath, "utf-8");

      if (!content.includes(oldStr)) {
        if (oldStr.includes('\n')) {
          const fuzzyResult = this.findFuzzyMatch(content, oldStr);
          if (fuzzyResult) {
            oldStr = fuzzyResult;
          } else {
            return {
              success: false,
              error: `String not found in file. For multi-line replacements, consider using line-based editing.`,
            };
          }
        } else {
          return {
            success: false,
            error: `String not found in file: "${oldStr}"`,
          };
        }
      }

      const occurrences = (content.match(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const previewContent = replaceAll 
          ? content.split(oldStr).join(newStr)
          : content.replace(oldStr, newStr);
        const oldLines = content.split("\n");
        const newLines = previewContent.split("\n");
        const diffContent = this.generateDiff(oldLines, newLines, filePath);

        const confirmationResult =
          await this.confirmationService.requestConfirmation(
            {
              operation: `Edit file${replaceAll && occurrences > 1 ? ` (${occurrences} occurrences)` : ''}`,
              filename: filePath,
              showVSCodeOpen: false,
              content: diffContent,
            },
            "file"
          );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "File edit cancelled by user",
          };
        }
      }

      const newContent = replaceAll
        ? content.split(oldStr).join(newStr)
        : content.replace(oldStr, newStr);
      await writeFilePromise(resolvedPath, newContent, "utf-8");

      this.editHistory.push({
        command: "str_replace",
        path: filePath,
        old_str: oldStr,
        new_str: newStr,
      });

      const oldLines = content.split("\n");
      const newLines = newContent.split("\n");
      const diff = this.generateColoredDiff(oldLines, newLines, filePath);

      return {
        success: true,
        output: diff,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error replacing text in ${filePath}: ${error.message}`,
      };
    }
  }

  async create(filePath: string, content: string): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);

      if (await pathExists(resolvedPath)) {
        return {
          success: false,
          error: `File already exists: ${filePath}`,
        };
      }

      // Check if user has already accepted file operations for this session
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        // Create a diff-style preview for file creation
        const contentLines = content.split("\n");
        const diffContent = [
          `Created ${filePath}`,
          `--- /dev/null`,
          `+++ b/${filePath}`,
          `@@ -0,0 +1,${contentLines.length} @@`,
          ...contentLines.map((line) => `+${line}`),
        ].join("\n");

        const confirmationResult =
          await this.confirmationService.requestConfirmation(
            {
              operation: "Write",
              filename: filePath,
              showVSCodeOpen: false,
              content: diffContent,
            },
            "file"
          );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error:
              confirmationResult.feedback || "File creation cancelled by user",
          };
        }
      }

      const dir = path.dirname(resolvedPath);
      await ops.promises.mkdir(dir, { recursive: true });
      await writeFilePromise(resolvedPath, content, "utf-8");

      this.editHistory.push({
        command: "create",
        path: filePath,
        content,
      });

      // Generate diff output using the same method as str_replace
      const oldLines: string[] = []; // Empty for new files
      const newLines = content.split("\n");
      const diff = this.generateDiff(oldLines, newLines, filePath);

      return {
        success: true,
        output: diff,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error creating ${filePath}: ${error.message}`,
      };
    }
  }

  async replaceLines(
    filePath: string,
    startLine: number,
    endLine: number,
    newContent: string
  ): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);

      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `File not found: ${filePath}`,
        };
      }

      const fileContent = await ops.promises.readFile(resolvedPath, "utf-8");
      const lines = fileContent.split("\n");
      
      if (startLine < 1 || startLine > lines.length) {
        return {
          success: false,
          error: `Invalid start line: ${startLine}. File has ${lines.length} lines.`,
        };
      }
      
      if (endLine < startLine || endLine > lines.length) {
        return {
          success: false,
          error: `Invalid end line: ${endLine}. Must be between ${startLine} and ${lines.length}.`,
        };
      }

      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const newLines = [...lines];
        const replacementLines = newContent.split("\n");
        newLines.splice(startLine - 1, endLine - startLine + 1, ...replacementLines);
        
        const diffContent = this.generateDiff(lines, newLines, filePath);

        const confirmationResult =
          await this.confirmationService.requestConfirmation(
            {
              operation: `Replace lines ${startLine}-${endLine}`,
              filename: filePath,
              showVSCodeOpen: false,
              content: diffContent,
            },
            "file"
          );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "Line replacement cancelled by user",
          };
        }
      }

      const replacementLines = newContent.split("\n");
      lines.splice(startLine - 1, endLine - startLine + 1, ...replacementLines);
      const newFileContent = lines.join("\n");

      await writeFilePromise(resolvedPath, newFileContent, "utf-8");

      this.editHistory.push({
        command: "str_replace",
        path: filePath,
        old_str: `lines ${startLine}-${endLine}`,
        new_str: newContent,
      });

      const oldLines = fileContent.split("\n");
      const diff = this.generateDiff(oldLines, lines, filePath);

      return {
        success: true,
        output: diff,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error replacing lines in ${filePath}: ${error.message}`,
      };
    }
  }

  async insert(
    filePath: string,
    insertLine: number,
    content: string
  ): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);

      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `File not found: ${filePath}`,
        };
      }

      const fileContent = await ops.promises.readFile(resolvedPath, "utf-8");
      const lines = fileContent.split("\n");

      lines.splice(insertLine - 1, 0, content);
      const newContent = lines.join("\n");

      await writeFilePromise(resolvedPath, newContent, "utf-8");

      this.editHistory.push({
        command: "insert",
        path: filePath,
        insert_line: insertLine,
        content,
      });

      return {
        success: true,
        output: `Successfully inserted content at line ${insertLine} in ${filePath}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error inserting content in ${filePath}: ${error.message}`,
      };
    }
  }

  async undoEdit(): Promise<ToolResult> {
    if (this.editHistory.length === 0) {
      return {
        success: false,
        error: "No edits to undo",
      };
    }

    const lastEdit = this.editHistory.pop()!;

    try {
      switch (lastEdit.command) {
        case "str_replace":
          if (lastEdit.path && lastEdit.old_str && lastEdit.new_str) {
            const content = await ops.promises.readFile(lastEdit.path, "utf-8");
            const revertedContent = content.replace(
              lastEdit.new_str,
              lastEdit.old_str
            );
            await writeFilePromise(lastEdit.path, revertedContent, "utf-8");
          }
          break;

        case "create":
          if (lastEdit.path) {
            await ops.promises.rm(lastEdit.path);
          }
          break;

        case "insert":
          if (lastEdit.path && lastEdit.insert_line) {
            const content = await ops.promises.readFile(lastEdit.path, "utf-8");
            const lines = content.split("\n");
            lines.splice(lastEdit.insert_line - 1, 1);
            await writeFilePromise(lastEdit.path, lines.join("\n"), "utf-8");
          }
          break;
      }

      return {
        success: true,
        output: `Successfully undid ${lastEdit.command} operation`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error undoing edit: ${error.message}`,
      };
    }
  }

  private findFuzzyMatch(content: string, searchStr: string): string | null {
    const functionMatch = searchStr.match(/function\s+(\w+)/);
    if (!functionMatch) return null;
    
    const functionName = functionMatch[1];
    const contentLines = content.split('\n');
    
    let functionStart = -1;
    for (let i = 0; i < contentLines.length; i++) {
      if (contentLines[i].includes(`function ${functionName}`) && contentLines[i].includes('{')) {
        functionStart = i;
        break;
      }
    }
    
    if (functionStart === -1) return null;
    
    let braceCount = 0;
    let functionEnd = functionStart;
    
    for (let i = functionStart; i < contentLines.length; i++) {
      const line = contentLines[i];
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
      
      if (braceCount === 0 && i > functionStart) {
        functionEnd = i;
        break;
      }
    }
    
    const actualFunction = contentLines.slice(functionStart, functionEnd + 1).join('\n');
    
    const searchNormalized = this.normalizeForComparison(searchStr);
    const actualNormalized = this.normalizeForComparison(actualFunction);
    
    if (this.isSimilarStructure(searchNormalized, actualNormalized)) {
      return actualFunction;
    }
    
    return null;
  }
  
  private normalizeForComparison(str: string): string {
    return str
      .replace(/["'`]/g, '"')
      .replace(/\s+/g, ' ')
      .replace(/{\s+/g, '{ ')
      .replace(/\s+}/g, ' }')
      .replace(/;\s*/g, ';')
      .trim();
  }
  
  private isSimilarStructure(search: string, actual: string): boolean {
    const extractTokens = (str: string) => {
      const tokens = str.match(/\b(function|console\.log|return|if|else|for|while)\b/g) || [];
      return tokens;
    };
    
    const searchTokens = extractTokens(search);
    const actualTokens = extractTokens(actual);
    
    if (searchTokens.length !== actualTokens.length) return false;
    
    for (let i = 0; i < searchTokens.length; i++) {
      if (searchTokens[i] !== actualTokens[i]) return false;
    }
    
    return true;
  }

  private generateDiff(
    oldLines: string[],
    newLines: string[],
    filePath: string
  ): string {
    const CONTEXT_LINES = 3;
    
    const changes: Array<{
      oldStart: number;
      oldEnd: number;
      newStart: number;
      newEnd: number;
    }> = [];
    
    let i = 0, j = 0;
    
    while (i < oldLines.length || j < newLines.length) {
      while (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        i++;
        j++;
      }
      
      if (i < oldLines.length || j < newLines.length) {
        const changeStart = { old: i, new: j };
        
        let oldEnd = i;
        let newEnd = j;
        
        while (oldEnd < oldLines.length || newEnd < newLines.length) {
          let matchFound = false;
          let matchLength = 0;
          
          for (let k = 0; k < Math.min(2, oldLines.length - oldEnd, newLines.length - newEnd); k++) {
            if (oldEnd + k < oldLines.length && 
                newEnd + k < newLines.length && 
                oldLines[oldEnd + k] === newLines[newEnd + k]) {
              matchLength++;
            } else {
              break;
            }
          }
          
          if (matchLength >= 2 || (oldEnd >= oldLines.length && newEnd >= newLines.length)) {
            matchFound = true;
          }
          
          if (matchFound) {
            break;
          }
          
          if (oldEnd < oldLines.length) oldEnd++;
          if (newEnd < newLines.length) newEnd++;
        }
        
        changes.push({
          oldStart: changeStart.old,
          oldEnd: oldEnd,
          newStart: changeStart.new,
          newEnd: newEnd
        });
        
        i = oldEnd;
        j = newEnd;
      }
    }
    
    const hunks: Array<{
      oldStart: number;
      oldCount: number;
      newStart: number;
      newCount: number;
      lines: Array<{ type: '+' | '-' | ' '; content: string }>;
    }> = [];
    
    let accumulatedOffset = 0;
    
    for (let changeIdx = 0; changeIdx < changes.length; changeIdx++) {
      const change = changes[changeIdx];
      
      let contextStart = Math.max(0, change.oldStart - CONTEXT_LINES);
      let contextEnd = Math.min(oldLines.length, change.oldEnd + CONTEXT_LINES);
      
      if (hunks.length > 0) {
        const lastHunk = hunks[hunks.length - 1];
        const lastHunkEnd = lastHunk.oldStart + lastHunk.oldCount;
        
        if (lastHunkEnd >= contextStart) {
          const oldHunkEnd = lastHunk.oldStart + lastHunk.oldCount;
          const newContextEnd = Math.min(oldLines.length, change.oldEnd + CONTEXT_LINES);
          
          for (let idx = oldHunkEnd; idx < change.oldStart; idx++) {
            lastHunk.lines.push({ type: ' ', content: oldLines[idx] });
          }
          
          for (let idx = change.oldStart; idx < change.oldEnd; idx++) {
            lastHunk.lines.push({ type: '-', content: oldLines[idx] });
          }
          for (let idx = change.newStart; idx < change.newEnd; idx++) {
            lastHunk.lines.push({ type: '+', content: newLines[idx] });
          }
          
          for (let idx = change.oldEnd; idx < newContextEnd && idx < oldLines.length; idx++) {
            lastHunk.lines.push({ type: ' ', content: oldLines[idx] });
          }
          
          lastHunk.oldCount = newContextEnd - lastHunk.oldStart;
          lastHunk.newCount = lastHunk.oldCount + (change.newEnd - change.newStart) - (change.oldEnd - change.oldStart);
          
          continue;
        }
      }
      
      const hunk: typeof hunks[0] = {
        oldStart: contextStart + 1,
        oldCount: contextEnd - contextStart,
        newStart: contextStart + 1 + accumulatedOffset,
        newCount: contextEnd - contextStart + (change.newEnd - change.newStart) - (change.oldEnd - change.oldStart),
        lines: []
      };
      
      for (let idx = contextStart; idx < change.oldStart; idx++) {
        hunk.lines.push({ type: ' ', content: oldLines[idx] });
      }
      
      for (let idx = change.oldStart; idx < change.oldEnd; idx++) {
        hunk.lines.push({ type: '-', content: oldLines[idx] });
      }
      
      for (let idx = change.newStart; idx < change.newEnd; idx++) {
        hunk.lines.push({ type: '+', content: newLines[idx] });
      }
      
      for (let idx = change.oldEnd; idx < contextEnd && idx < oldLines.length; idx++) {
        hunk.lines.push({ type: ' ', content: oldLines[idx] });
      }
      
      hunks.push(hunk);
      
      accumulatedOffset += (change.newEnd - change.newStart) - (change.oldEnd - change.oldStart);
    }
    
    let addedLines = 0;
    let removedLines = 0;
    
    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (line.type === '+') addedLines++;
        if (line.type === '-') removedLines++;
      }
    }
    
    let summary = `Updated ${filePath}`;
    if (addedLines > 0 && removedLines > 0) {
      summary += ` with ${addedLines} addition${
        addedLines !== 1 ? "s" : ""
      } and ${removedLines} removal${removedLines !== 1 ? "s" : ""}`;
    } else if (addedLines > 0) {
      summary += ` with ${addedLines} addition${addedLines !== 1 ? "s" : ""}`;
    } else if (removedLines > 0) {
      summary += ` with ${removedLines} removal${
        removedLines !== 1 ? "s" : ""
      }`;
    } else if (changes.length === 0) {
      return `No changes in ${filePath}`;
    }
    
    let diff = summary + "\n";
    diff += `--- a/${filePath}\n`;
    diff += `+++ b/${filePath}\n`;
    
    for (const hunk of hunks) {
      diff += `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@\n`;
      
      for (const line of hunk.lines) {
        diff += `${line.type}${line.content}\n`;
      }
    }
    
    return diff.trim();
  }

  /**
   * Generate colored diff with ANSI color codes for terminal display
   */
  private generateColoredDiff(oldLines: string[], newLines: string[], filePath: string): string {
    logToSession('generateColoredDiff called', { filePath, oldLinesCount: oldLines.length, newLinesCount: newLines.length });

    // Handle empty content cases
    if (oldLines.length === 0 && newLines.length === 0) {
      return `No changes in ${filePath}`;
    }

    if (oldLines.length === 0 && newLines.length > 0) {
      // New file creation
      logToSession('Handling new file creation');
      const addedCount = newLines.length;
      let diff = `\x1b[32m✅ Created ${filePath} with ${addedCount} line${addedCount !== 1 ? 's' : ''}\x1b[0m\n\n`;
      diff += `\x1b[36m--- /dev/null\x1b[0m\n`;
      diff += `\x1b[36m+++ b/${filePath}\x1b[0m\n`;
      diff += `\x1b[36m@@ -0,0 +1,${addedCount} @@\x1b[0m\n`;

      newLines.forEach(line => {
        diff += `\x1b[32m+${line}\x1b[0m\n`;
      });

      return diff.trim();
    }

    try {
      logToSession('Generating unified diff with createTwoFilesPatch');
      // Generate unified diff using diff library
      const patch = createTwoFilesPatch(
        `a/${filePath}`,
        `b/${filePath}`,
        oldLines.join('\n'),
        newLines.join('\n'),
        '', // old header
        '', // new header
        { context: 3 }
      );
      logToSession('createTwoFilesPatch completed', { patchLength: patch.length });

      // Colorize the unified diff
      return this.colorizeUnifiedDiff(patch, filePath);
    } catch (error: any) {
      logToSession('CRITICAL: createTwoFilesPatch failed', {
        error: error.message,
        errorName: error.name,
        errorStack: error.stack?.substring(0, 500),
        filePath
      });
      // Fallback to simple summary on diff generation failure
      return `\x1b[32m✅ Updated ${filePath}\x1b[0m\n\x1b[32m+ (diff generation failed - ${error.message})\x1b[0m`;
    }
  }

  /**
   * Colorize unified diff output with ANSI color codes
   */
  private colorizeUnifiedDiff(diff: string, filePath: string): string {
    logToSession('colorizeUnifiedDiff called', { diffLength: diff.length });

    try {
      const lines = diff.split('\n');
      logToSession('Split into lines', { lineCount: lines.length });
      let colorizedLines: string[] = [];
      let addedLines = 0;
      let removedLines = 0;

      // Count changes for summary
      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) addedLines++;
        if (line.startsWith('-') && !line.startsWith('---')) removedLines++;
      }
      logToSession('Change counts', { added: addedLines, removed: removedLines });

      // Add colored summary
      if (addedLines > 0 || removedLines > 0) {
        let summary = `\x1b[32m✅ Updated ${filePath}\x1b[0m`;
        if (addedLines > 0 && removedLines > 0) {
          summary += ` with \x1b[32m${addedLines} addition${addedLines !== 1 ? 's' : ''}\x1b[0m and \x1b[31m${removedLines} removal${removedLines !== 1 ? 's' : ''}\x1b[0m`;
        } else if (addedLines > 0) {
          summary += ` with \x1b[32m${addedLines} addition${addedLines !== 1 ? 's' : ''}\x1b[0m`;
        } else if (removedLines > 0) {
          summary += ` with \x1b[31m${removedLines} removal${removedLines !== 1 ? 's' : ''}\x1b[0m`;
        }
        colorizedLines.push(summary);
        colorizedLines.push(''); // Empty line for spacing
      }

      // Parse diff and add line numbers like Claude Code
      let oldLineNum = 1;
      let newLineNum = 1;

      for (const line of lines) {
        if (line.startsWith('---') || line.startsWith('+++')) {
          // Skip file headers - don't show these with line numbers
          continue;
        } else if (line.startsWith('@@')) {
          // Parse hunk header to get starting line numbers
          logToSession('Processing hunk header', { header: line });
          const hunkMatch = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
          if (hunkMatch) {
            oldLineNum = parseInt(hunkMatch[1]);
            newLineNum = parseInt(hunkMatch[2]);
            logToSession('Parsed line numbers', { old: oldLineNum, new: newLineNum });
          } else {
            logToSession('Failed to parse hunk header', { header: line });
          }
          // Skip hunk headers in output
          continue;
        } else if (line.startsWith('+')) {
          // Addition: show new line number
          const content = line.substring(1); // Remove the '+'
          colorizedLines.push(`     \x1b[32m${newLineNum.toString().padStart(3)} +\x1b[0m  ${content}`);
          newLineNum++;
        } else if (line.startsWith('-')) {
          // Deletion: show old line number
          const content = line.substring(1); // Remove the '-'
          colorizedLines.push(`     \x1b[31m${oldLineNum.toString().padStart(3)} -\x1b[0m  ${content}`);
          oldLineNum++;
        } else if (line.startsWith(' ')) {
          // Context line: show line number without + or -
          const content = line.substring(1); // Remove the ' '
          colorizedLines.push(`     ${oldLineNum.toString().padStart(3)}    ${content}`);
          oldLineNum++;
          newLineNum++;
        } else if (line.trim() === '') {
          // Skip empty lines from diff header
          continue;
        }
      }

      const result = colorizedLines.join('\n');
      logToSession('colorizeUnifiedDiff completed', { resultLength: result.length });
      return result;
    } catch (error: any) {
      logToSession('CRITICAL: colorizeUnifiedDiff failed', {
        error: error.message,
        errorName: error.name,
        errorStack: error.stack?.substring(0, 500),
        filePath,
        diffPreview: diff.substring(0, 500)
      });
      // Fallback on colorization failure - include diff markers for detection
      return `\x1b[32m✅ Updated ${filePath}\x1b[0m\n\x1b[32m+ (diff colorization failed - ${error.message})\x1b[0m`;
    }
  }

  getEditHistory(): EditorCommand[] {
    return [...this.editHistory];
  }
}
