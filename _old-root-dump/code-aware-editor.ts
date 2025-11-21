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

export interface CodeContext {
  language: string;
  imports: string[];
  exports: string[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  variables: VariableInfo[];
  types: TypeInfo[];
}

export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
}

export interface ClassInfo {
  name: string;
  startLine: number;
  endLine: number;
  methods: FunctionInfo[];
  properties: VariableInfo[];
  extends?: string;
  implements?: string[];
  isExported: boolean;
}

export interface VariableInfo {
  name: string;
  line: number;
  type?: string;
  isConst: boolean;
  isExported: boolean;
  scope: 'global' | 'function' | 'class' | 'block';
}

export interface TypeInfo {
  name: string;
  line: number;
  kind: 'interface' | 'type' | 'enum';
  isExported: boolean;
}

export interface RefactorOperation {
  type: 'rename' | 'extract_function' | 'extract_variable' | 'inline' | 'move_function' | 'add_import';
  target: string;
  newName?: string;
  startLine?: number;
  endLine?: number;
  destinationFile?: string;
  importPath?: string;
}

export class CodeAwareEditorTool {
  private confirmationService = ConfirmationService.getInstance();

  /**
   * Analyze code structure and context
   */
  async analyzeCode(filePath: string): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);
      
      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `File not found: ${filePath}`
        };
      }

      const content = await ops.promises.readFile(resolvedPath, 'utf-8');
      const language = this.detectLanguage(filePath);
      const context = await this.parseCodeContext(content, language);

      const output = this.formatCodeAnalysis(context, filePath);

      return {
        success: true,
        output
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error analyzing code: ${error.message}`
      };
    }
  }

  /**
   * Perform smart refactoring operations
   */
  async refactor(filePath: string, operation: RefactorOperation): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);
      
      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `File not found: ${filePath}`
        };
      }

      const content = await ops.promises.readFile(resolvedPath, 'utf-8');
      const language = this.detectLanguage(filePath);
      const context = await this.parseCodeContext(content, language);

      const result = await this.performRefactoring(content, context, operation, language);
      
      if (!result.success) {
        return result;
      }

      // Request confirmation
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const preview = this.generateRefactorPreview(content, result.newContent!, operation);
        const confirmationResult = await this.confirmationService.requestConfirmation(
          {
            operation: `Refactor: ${operation.type} (${operation.target})`,
            filename: filePath,
            showVSCodeOpen: false,
            content: preview
          },
          "file"
        );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "Refactoring cancelled by user"
          };
        }
      }

      // Apply changes
      await ops.promises.writeFile(resolvedPath, result.newContent!, 'utf-8');

      return {
        success: true,
        output: result.output!
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error performing refactoring: ${error.message}`
      };
    }
  }

  /**
   * Smart code insertion that preserves formatting and structure
   */
  async smartInsert(
    filePath: string, 
    code: string, 
    location: 'top' | 'bottom' | 'before_function' | 'after_function' | 'in_class',
    target?: string
  ): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);
      
      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `File not found: ${filePath}`
        };
      }

      const content = await ops.promises.readFile(resolvedPath, 'utf-8');
      const language = this.detectLanguage(filePath);
      const context = await this.parseCodeContext(content, language);

      const insertionPoint = this.findInsertionPoint(content, context, location, target);
      if (!insertionPoint.success) {
        return insertionPoint;
      }

      const formattedCode = this.formatCodeForInsertion(code, insertionPoint.indentation!, language);
      const lines = content.split('\n');
      
      lines.splice(insertionPoint.line!, 0, formattedCode);
      const newContent = lines.join('\n');

      // Request confirmation
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const preview = this.generateInsertionPreview(content, newContent, insertionPoint.line!);
        const confirmationResult = await this.confirmationService.requestConfirmation(
          {
            operation: `Insert code at ${location}${target ? ` (${target})` : ''}`,
            filename: filePath,
            showVSCodeOpen: false,
            content: preview
          },
          "file"
        );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "Code insertion cancelled by user"
          };
        }
      }

      await ops.promises.writeFile(resolvedPath, newContent, 'utf-8');

      return {
        success: true,
        output: `Code inserted at line ${insertionPoint.line! + 1} in ${filePath}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error inserting code: ${error.message}`
      };
    }
  }

  /**
   * Auto-format code while preserving logical structure
   */
  async formatCode(filePath: string, options: { preserveComments?: boolean; indentSize?: number } = {}): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);
      
      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `File not found: ${filePath}`
        };
      }

      const content = await ops.promises.readFile(resolvedPath, 'utf-8');
      const language = this.detectLanguage(filePath);
      
      const formattedContent = await this.formatCodeContent(content, language, options);

      if (formattedContent === content) {
        return {
          success: true,
          output: "No formatting changes needed"
        };
      }

      // Request confirmation
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const preview = this.generateFormatPreview(content, formattedContent);
        const confirmationResult = await this.confirmationService.requestConfirmation(
          {
            operation: "Format code",
            filename: filePath,
            showVSCodeOpen: false,
            content: preview
          },
          "file"
        );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "Code formatting cancelled by user"
          };
        }
      }

      await ops.promises.writeFile(resolvedPath, formattedContent, 'utf-8');

      return {
        success: true,
        output: `Code formatted in ${filePath}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error formatting code: ${error.message}`
      };
    }
  }

  /**
   * Add missing imports automatically
   */
  async addMissingImports(filePath: string, symbols: string[]): Promise<ToolResult> {
    try {
      const resolvedPath = path.resolve(filePath);
      
      if (!(await pathExists(resolvedPath))) {
        return {
          success: false,
          error: `File not found: ${filePath}`
        };
      }

      const content = await ops.promises.readFile(resolvedPath, 'utf-8');
      const language = this.detectLanguage(filePath);
      const context = await this.parseCodeContext(content, language);

      const missingImports = symbols.filter(symbol => 
        !context.imports.some(imp => imp.includes(symbol))
      );

      if (missingImports.length === 0) {
        return {
          success: true,
          output: "All symbols are already imported"
        };
      }

      const importsToAdd = await this.generateImportStatements(missingImports, language);
      const newContent = this.insertImports(content, importsToAdd, context, language);

      if (newContent === content) {
        return {
          success: true,
          output: "No imports to add"
        };
      }

      // Request confirmation
      const sessionFlags = this.confirmationService.getSessionFlags();
      if (!sessionFlags.fileOperations && !sessionFlags.allOperations) {
        const preview = `Adding imports for: ${missingImports.join(', ')}\n\n${importsToAdd.join('\n')}`;
        const confirmationResult = await this.confirmationService.requestConfirmation(
          {
            operation: `Add ${missingImports.length} missing imports`,
            filename: filePath,
            showVSCodeOpen: false,
            content: preview
          },
          "file"
        );

        if (!confirmationResult.confirmed) {
          return {
            success: false,
            error: confirmationResult.feedback || "Import addition cancelled by user"
          };
        }
      }

      await ops.promises.writeFile(resolvedPath, newContent, 'utf-8');

      return {
        success: true,
        output: `Added ${missingImports.length} missing imports to ${filePath}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error adding imports: ${error.message}`
      };
    }
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.cc': 'cpp',
      '.cxx': 'cpp',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala'
    };

    return languageMap[ext] || 'text';
  }

  /**
   * Parse code context based on language
   */
  private async parseCodeContext(content: string, language: string): Promise<CodeContext> {
    const context: CodeContext = {
      language,
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      variables: [],
      types: []
    };

    const lines = content.split('\n');

    switch (language) {
      case 'javascript':
      case 'typescript':
        this.parseJavaScriptTypeScript(lines, context);
        break;
      case 'python':
        this.parsePython(lines, context);
        break;
      case 'java':
        this.parseJava(lines, context);
        break;
      default:
        this.parseGeneric(lines, context);
    }

    return context;
  }

  /**
   * Parse JavaScript/TypeScript specific syntax
   */
  private parseJavaScriptTypeScript(lines: string[], context: CodeContext): void {
    let currentClass: ClassInfo | null = null;
    let currentFunction: FunctionInfo | null = null;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Parse imports
      if (line.startsWith('import ') || line.startsWith('const ') && line.includes('require(')) {
        context.imports.push(line);
      }

      // Parse exports
      if (line.startsWith('export ')) {
        context.exports.push(line);
      }

      // Parse types (TypeScript)
      if (line.startsWith('interface ') || line.startsWith('type ') || line.startsWith('enum ')) {
        const match = line.match(/(interface|type|enum)\s+(\w+)/);
        if (match) {
          context.types.push({
            name: match[2],
            line: lineNumber,
            kind: match[1] as 'interface' | 'type' | 'enum',
            isExported: line.includes('export')
          });
        }
      }

      // Parse classes
      if (line.includes('class ')) {
        const match = line.match(/class\s+(\w+)/);
        if (match) {
          currentClass = {
            name: match[1],
            startLine: lineNumber,
            endLine: lineNumber,
            methods: [],
            properties: [],
            isExported: line.includes('export')
          };
          context.classes.push(currentClass);
        }
      }

      // Parse functions
      if (line.includes('function ') || line.match(/\w+\s*\(/)) {
        const functionMatch = line.match(/(?:async\s+)?(?:function\s+)?(\w+)\s*\(/);
        if (functionMatch) {
          const func: FunctionInfo = {
            name: functionMatch[1],
            startLine: lineNumber,
            endLine: lineNumber,
            parameters: this.extractParameters(line),
            isAsync: line.includes('async'),
            isExported: line.includes('export')
          };

          if (currentClass) {
            currentClass.methods.push(func);
          } else {
            context.functions.push(func);
          }
          currentFunction = func;
        }
      }

      // Parse variables
      if (line.match(/^(const|let|var)\s+\w+/)) {
        const match = line.match(/(const|let|var)\s+(\w+)/);
        if (match) {
          context.variables.push({
            name: match[2],
            line: lineNumber,
            isConst: match[1] === 'const',
            isExported: line.includes('export'),
            scope: currentFunction ? 'function' : currentClass ? 'class' : 'global'
          });
        }
      }

      // Track brace depth for function/class end detection
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      if (braceDepth === 0 && currentFunction) {
        currentFunction.endLine = lineNumber;
        currentFunction = null;
      }

      if (braceDepth === 0 && currentClass) {
        currentClass.endLine = lineNumber;
        currentClass = null;
      }
    }
  }

  /**
   * Parse Python specific syntax
   */
  private parsePython(lines: string[], context: CodeContext): void {
    let currentClass: ClassInfo | null = null;
    let currentIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const lineNumber = i + 1;
      const indent = line.length - line.trimStart().length;

      // Reset context when indentation decreases
      if (indent <= currentIndent) {
        currentClass = null;
        currentIndent = indent;
      }

      // Parse imports
      if (trimmedLine.startsWith('import ') || trimmedLine.startsWith('from ')) {
        context.imports.push(trimmedLine);
      }

      // Parse classes
      if (trimmedLine.startsWith('class ')) {
        const match = trimmedLine.match(/class\s+(\w+)/);
        if (match) {
          currentClass = {
            name: match[1],
            startLine: lineNumber,
            endLine: lineNumber,
            methods: [],
            properties: [],
            isExported: true // Python doesn't have explicit exports
          };
          context.classes.push(currentClass);
          currentIndent = indent;
        }
      }

      // Parse functions
      if (trimmedLine.startsWith('def ')) {
        const match = trimmedLine.match(/def\s+(\w+)\s*\(/);
        if (match) {
          const func: FunctionInfo = {
            name: match[1],
            startLine: lineNumber,
            endLine: lineNumber,
            parameters: this.extractPythonParameters(trimmedLine),
            isAsync: trimmedLine.startsWith('async def'),
            isExported: true
          };

          if (currentClass) {
            currentClass.methods.push(func);
          } else {
            context.functions.push(func);
          }
        }
      }

      // Parse variables (basic detection)
      if (trimmedLine.match(/^\w+\s*=/) && !trimmedLine.startsWith('def ') && !trimmedLine.startsWith('class ')) {
        const match = trimmedLine.match(/^(\w+)\s*=/);
        if (match) {
          context.variables.push({
            name: match[1],
            line: lineNumber,
            isConst: false,
            isExported: true,
            scope: currentClass ? 'class' : 'global'
          });
        }
      }
    }
  }

  /**
   * Parse Java specific syntax
   */
  private parseJava(lines: string[], context: CodeContext): void {
    // Simplified Java parsing - can be extended
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Parse imports
      if (line.startsWith('import ')) {
        context.imports.push(line);
      }

      // Parse classes
      if (line.includes('class ')) {
        const match = line.match(/class\s+(\w+)/);
        if (match) {
          context.classes.push({
            name: match[1],
            startLine: lineNumber,
            endLine: lineNumber,
            methods: [],
            properties: [],
            isExported: line.includes('public')
          });
        }
      }
    }
  }

  /**
   * Generic parsing for unknown languages
   */
  private parseGeneric(lines: string[], context: CodeContext): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Look for function-like patterns
      const functionMatch = line.match(/(\w+)\s*\(/);
      if (functionMatch && !line.includes('if') && !line.includes('while') && !line.includes('for')) {
        context.functions.push({
          name: functionMatch[1],
          startLine: lineNumber,
          endLine: lineNumber,
          parameters: [],
          isAsync: false,
          isExported: false
        });
      }
    }
  }

  /**
   * Extract function parameters
   */
  private extractParameters(line: string): string[] {
    const match = line.match(/\(([^)]*)\)/);
    if (!match || !match[1]) return [];
    
    return match[1].split(',').map(param => param.trim()).filter(Boolean);
  }

  /**
   * Extract Python function parameters
   */
  private extractPythonParameters(line: string): string[] {
    const match = line.match(/\(([^)]*)\)/);
    if (!match || !match[1]) return [];
    
    return match[1].split(',')
      .map(param => param.trim().split(':')[0].split('=')[0].trim())
      .filter(Boolean);
  }

  /**
   * Format code analysis for display
   */
  private formatCodeAnalysis(context: CodeContext, filePath: string): string {
    let output = `Code Analysis for ${filePath} (${context.language}):\n\n`;

    if (context.imports.length > 0) {
      output += `Imports (${context.imports.length}):\n`;
      context.imports.slice(0, 5).forEach(imp => output += `  - ${imp}\n`);
      if (context.imports.length > 5) {
        output += `  ... and ${context.imports.length - 5} more\n`;
      }
      output += '\n';
    }

    if (context.functions.length > 0) {
      output += `Functions (${context.functions.length}):\n`;
      context.functions.forEach(func => {
        output += `  - ${func.name}(${func.parameters.join(', ')}) [line ${func.startLine}]${func.isAsync ? ' (async)' : ''}${func.isExported ? ' (exported)' : ''}\n`;
      });
      output += '\n';
    }

    if (context.classes.length > 0) {
      output += `Classes (${context.classes.length}):\n`;
      context.classes.forEach(cls => {
        output += `  - ${cls.name} [lines ${cls.startLine}-${cls.endLine}]${cls.isExported ? ' (exported)' : ''}\n`;
        if (cls.methods.length > 0) {
          output += `    Methods: ${cls.methods.map(m => m.name).join(', ')}\n`;
        }
      });
      output += '\n';
    }

    if (context.types.length > 0) {
      output += `Types (${context.types.length}):\n`;
      context.types.forEach(type => {
        output += `  - ${type.name} (${type.kind}) [line ${type.line}]${type.isExported ? ' (exported)' : ''}\n`;
      });
      output += '\n';
    }

    if (context.variables.length > 0) {
      output += `Variables (${context.variables.length}):\n`;
      context.variables.slice(0, 10).forEach(variable => {
        output += `  - ${variable.name} [line ${variable.line}] (${variable.scope})${variable.isConst ? ' (const)' : ''}${variable.isExported ? ' (exported)' : ''}\n`;
      });
      if (context.variables.length > 10) {
        output += `  ... and ${context.variables.length - 10} more\n`;
      }
    }

    return output.trim();
  }

  /**
   * Perform refactoring operation
   */
  private async performRefactoring(
    content: string, 
    context: CodeContext, 
    operation: RefactorOperation, 
    language: string
  ): Promise<{ success: boolean; newContent?: string; output?: string; error?: string }> {
    const lines = content.split('\n');

    switch (operation.type) {
      case 'rename':
        return this.performRename(lines, context, operation.target, operation.newName!);

      case 'extract_function':
        return this.performExtractFunction(lines, operation.startLine!, operation.endLine!, operation.newName!, language);

      case 'extract_variable':
        return this.performExtractVariable(lines, operation.startLine!, operation.target, operation.newName!, language);

      default:
        return {
          success: false,
          error: `Refactoring operation '${operation.type}' not yet implemented`
        };
    }
  }

  /**
   * Perform rename refactoring
   */
  private performRename(
    lines: string[], 
    context: CodeContext, 
    oldName: string, 
    newName: string
  ): { success: boolean; newContent?: string; output?: string; error?: string } {
    if (!this.isValidIdentifier(newName)) {
      return {
        success: false,
        error: `'${newName}' is not a valid identifier`
      };
    }

    let changes = 0;
    const newLines = lines.map(line => {
      const regex = new RegExp(`\\b${oldName}\\b`, 'g');
      const newLine = line.replace(regex, (_match) => {
        changes++;
        return newName;
      });
      return newLine;
    });

    return {
      success: true,
      newContent: newLines.join('\n'),
      output: `Renamed '${oldName}' to '${newName}' (${changes} occurrences)`
    };
  }

  /**
   * Perform extract function refactoring
   */
  private performExtractFunction(
    lines: string[], 
    startLine: number, 
    endLine: number, 
    functionName: string, 
    language: string
  ): { success: boolean; newContent?: string; output?: string; error?: string } {
    if (startLine < 1 || endLine > lines.length || startLine > endLine) {
      return {
        success: false,
        error: 'Invalid line range'
      };
    }

    const extractedLines = lines.slice(startLine - 1, endLine);
    const extractedCode = extractedLines.join('\n');

    // Create function declaration
    let functionDecl: string;
    switch (language) {
      case 'javascript':
      case 'typescript':
        functionDecl = `function ${functionName}() {\n${extractedCode}\n}`;
        break;
      case 'python':
        functionDecl = `def ${functionName}():\n${extractedCode.split('\n').map(line => '    ' + line).join('\n')}`;
        break;
      default:
        functionDecl = `// Extracted function\n${extractedCode}`;
    }

    // Replace extracted code with function call
    const functionCall = language === 'python' ? `${functionName}()` : `${functionName}();`;

    // Insert function and replace code
    const newLines = [
      ...lines.slice(0, startLine - 1),
      functionCall,
      ...lines.slice(endLine),
      '',
      functionDecl
    ];

    return {
      success: true,
      newContent: newLines.join('\n'),
      output: `Extracted function '${functionName}' from lines ${startLine}-${endLine}`
    };
  }

  /**
   * Perform extract variable refactoring
   */
  private performExtractVariable(
    lines: string[], 
    line: number, 
    expression: string, 
    variableName: string, 
    language: string
  ): { success: boolean; newContent?: string; output?: string; error?: string } {
    if (line < 1 || line > lines.length) {
      return {
        success: false,
        error: 'Invalid line number'
      };
    }

    const targetLine = lines[line - 1];
    if (!targetLine.includes(expression)) {
      return {
        success: false,
        error: `Expression '${expression}' not found on line ${line}`
      };
    }

    // Create variable declaration
    let variableDecl: string;
    switch (language) {
      case 'javascript':
      case 'typescript':
        variableDecl = `const ${variableName} = ${expression};`;
        break;
      case 'python':
        variableDecl = `${variableName} = ${expression}`;
        break;
      default:
        variableDecl = `${variableName} = ${expression}`;
    }

    // Replace expression with variable
    const newTargetLine = targetLine.replace(expression, variableName);

    const newLines = [
      ...lines.slice(0, line - 1),
      variableDecl,
      newTargetLine,
      ...lines.slice(line)
    ];

    return {
      success: true,
      newContent: newLines.join('\n'),
      output: `Extracted variable '${variableName}' for expression '${expression}'`
    };
  }

  /**
   * Find insertion point for code
   */
  private findInsertionPoint(
    content: string, 
    context: CodeContext, 
    location: string, 
    target?: string
  ): { success: boolean; line?: number; indentation?: string; error?: string } {
    const lines = content.split('\n');

    switch (location) {
      case 'top':
        // Insert after imports
        const lastImportLine = Math.max(...context.imports.map(imp => 
          lines.findIndex(line => line.trim() === imp.trim())
        ).filter(idx => idx !== -1));
        
        return {
          success: true,
          line: lastImportLine >= 0 ? lastImportLine + 2 : 0,
          indentation: ''
        };

      case 'bottom':
        return {
          success: true,
          line: lines.length,
          indentation: ''
        };

      case 'before_function':
      case 'after_function':
        if (!target) {
          return { success: false, error: 'Target function name required' };
        }

        const func = context.functions.find(f => f.name === target);
        if (!func) {
          return { success: false, error: `Function '${target}' not found` };
        }

        const insertLine = location === 'before_function' ? func.startLine - 1 : func.endLine;
        const referenceLine = lines[func.startLine - 1];
        const indentation = referenceLine.match(/^(\s*)/)?.[1] || '';

        return {
          success: true,
          line: insertLine,
          indentation
        };

      case 'in_class':
        if (!target) {
          return { success: false, error: 'Target class name required' };
        }

        const cls = context.classes.find(c => c.name === target);
        if (!cls) {
          return { success: false, error: `Class '${target}' not found` };
        }

        const classLine = lines[cls.startLine - 1];
        const classIndentation = classLine.match(/^(\s*)/)?.[1] || '';
        const methodIndentation = classIndentation + '  '; // Add two spaces for method indentation

        return {
          success: true,
          line: cls.endLine - 1,
          indentation: methodIndentation
        };

      default:
        return { success: false, error: `Unknown location: ${location}` };
    }
  }

  /**
   * Format code for insertion with proper indentation
   */
  private formatCodeForInsertion(code: string, indentation: string, _language: string): string {
    const lines = code.split('\n');
    return lines.map(line => {
      if (line.trim() === '') return '';
      return indentation + line;
    }).join('\n');
  }

  /**
   * Format code content (basic formatting)
   */
  private async formatCodeContent(
    content: string, 
    language: string, 
    options: { preserveComments?: boolean; indentSize?: number }
  ): Promise<string> {
    // This is a simplified formatter - in a real implementation,
    // you would integrate with language-specific formatters
    const indentSize = options.indentSize || 2;
    const indent = ' '.repeat(indentSize);
    
    const lines = content.split('\n');
    const formatted: string[] = [];
    let currentIndent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '') {
        formatted.push('');
        continue;
      }

      // Adjust indentation based on braces/brackets
      if (trimmed.includes('}') || trimmed.includes(']') || trimmed.includes(')')) {
        currentIndent = Math.max(0, currentIndent - 1);
      }

      formatted.push(indent.repeat(currentIndent) + trimmed);

      if (trimmed.includes('{') || trimmed.includes('[') || trimmed.includes('(')) {
        currentIndent++;
      }
    }

    return formatted.join('\n');
  }

  /**
   * Generate import statements for missing symbols
   */
  private async generateImportStatements(symbols: string[], language: string): Promise<string[]> {
    const imports: string[] = [];

    for (const symbol of symbols) {
      let importStatement: string;
      
      switch (language) {
        case 'javascript':
        case 'typescript':
          // This is simplified - in reality, you'd need symbol resolution
          importStatement = `import { ${symbol} } from './${symbol.toLowerCase()}';`;
          break;
        case 'python':
          importStatement = `from .${symbol.toLowerCase()} import ${symbol}`;
          break;
        default:
          importStatement = `// Import ${symbol}`;
      }

      imports.push(importStatement);
    }

    return imports;
  }

  /**
   * Insert imports into content
   */
  private insertImports(content: string, imports: string[], context: CodeContext, language: string): string {
    const lines = content.split('\n');
    
    // Find insertion point (after existing imports)
    let insertionPoint = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (language === 'javascript' || language === 'typescript') {
        if (line.startsWith('import ') || (line.startsWith('const ') && line.includes('require('))) {
          insertionPoint = i + 1;
        }
      } else if (language === 'python') {
        if (line.startsWith('import ') || line.startsWith('from ')) {
          insertionPoint = i + 1;
        }
      }
    }

    // Insert imports
    const newLines = [
      ...lines.slice(0, insertionPoint),
      ...imports,
      ...lines.slice(insertionPoint)
    ];

    return newLines.join('\n');
  }

  /**
   * Generate preview for refactoring
   */
  private generateRefactorPreview(oldContent: string, newContent: string, operation: RefactorOperation): string {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let preview = `Refactoring Preview: ${operation.type}\n`;
    preview += `Target: ${operation.target}\n`;
    if (operation.newName) {
      preview += `New name: ${operation.newName}\n`;
    }
    preview += '\n';

    // Show first few differences
    for (let i = 0; i < Math.min(oldLines.length, newLines.length, 20); i++) {
      if (oldLines[i] !== newLines[i]) {
        preview += `Line ${i + 1}:\n`;
        preview += `- ${oldLines[i]}\n`;
        preview += `+ ${newLines[i]}\n`;
      }
    }

    return preview;
  }

  /**
   * Generate preview for insertion
   */
  private generateInsertionPreview(oldContent: string, newContent: string, insertLine: number): string {
    const _oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let preview = `Code Insertion Preview:\n`;
    preview += `Insertion point: Line ${insertLine + 1}\n\n`;

    // Show context around insertion
    const start = Math.max(0, insertLine - 3);
    const end = Math.min(newLines.length, insertLine + 6);

    for (let i = start; i < end; i++) {
      const marker = i === insertLine ? '>>> ' : '    ';
      preview += `${marker}${i + 1}: ${newLines[i]}\n`;
    }

    return preview;
  }

  /**
   * Generate preview for formatting
   */
  private generateFormatPreview(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let preview = 'Formatting Preview:\n\n';
    let changes = 0;

    for (let i = 0; i < Math.min(oldLines.length, newLines.length); i++) {
      if (oldLines[i] !== newLines[i]) {
        if (changes < 10) { // Show first 10 changes
          preview += `Line ${i + 1}:\n`;
          preview += `- ${oldLines[i]}\n`;
          preview += `+ ${newLines[i]}\n`;
        }
        changes++;
      }
    }

    if (changes > 10) {
      preview += `... and ${changes - 10} more changes\n`;
    }

    return preview;
  }

  /**
   * Check if string is valid identifier
   */
  private isValidIdentifier(name: string): boolean {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
  }
}