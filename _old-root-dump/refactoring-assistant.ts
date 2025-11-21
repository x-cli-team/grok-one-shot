import { ToolResult } from "../../types/index.js";
import { ASTParserTool, SymbolInfo } from "./ast-parser.js";
import { SymbolSearchTool, SymbolReference } from "./symbol-search.js";
import { MultiFileEditorTool } from "../advanced/multi-file-editor.js";
import { OperationHistoryTool } from "../advanced/operation-history.js";
import * as ops from "fs";

const pathExists = async (filePath: string): Promise<boolean> => {
  try {
    await ops.promises.access(filePath, ops.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};



import path from "path";

export interface RefactoringOperation {
  type: 'rename' | 'extract_function' | 'extract_variable' | 'inline_function' | 'inline_variable' | 'move_function' | 'move_class';
  description: string;
  files: RefactoringFileChange[];
  preview: string;
  safety: SafetyAnalysis;
  rollback?: string;
}

export interface RefactoringFileChange {
  filePath: string;
  changes: TextChange[];
  backup?: string;
}

export interface TextChange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  oldText: string;
  newText: string;
  type: 'replace' | 'insert' | 'delete';
}

export interface SafetyAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  potentialIssues: string[];
  affectedFiles: number;
  affectedSymbols: number;
  requiresTests: boolean;
  breakingChanges: boolean;
}

export interface RenameRequest {
  symbolName: string;
  newName: string;
  filePath?: string;
  scope: 'file' | 'project' | 'global';
  includeComments: boolean;
  includeStrings: boolean;
}

export interface ExtractFunctionRequest {
  filePath: string;
  startLine: number;
  endLine: number;
  functionName: string;
  parameters?: ExtractedParameter[];
  returnType?: string;
}

export interface ExtractedParameter {
  name: string;
  type?: string;
  defaultValue?: string;
}

export interface MoveRequest {
  symbolName: string;
  sourceFile: string;
  targetFile: string;
  createTargetFile?: boolean;
}

export interface InlineRequest {
  symbolName: string;
  filePath: string;
  preserveComments: boolean;
}

export class RefactoringAssistantTool {
  name = "refactoring_assistant";
  description = "Perform safe code refactoring operations including rename, extract, inline, and move operations";

  private astParser: ASTParserTool;
  private symbolSearch: SymbolSearchTool;
  private multiFileEditor: MultiFileEditorTool;
  private operationHistory: OperationHistoryTool;

  constructor() {
    this.astParser = new ASTParserTool();
    this.symbolSearch = new SymbolSearchTool();
    this.multiFileEditor = new MultiFileEditorTool();
    this.operationHistory = new OperationHistoryTool();
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { operation, ...operationArgs } = args;

      if (!operation) {
        throw new Error("Refactoring operation type is required");
      }

      let result: RefactoringOperation;

      switch (operation) {
        case 'rename':
          result = await this.performRename(operationArgs as RenameRequest);
          break;
        case 'extract_function':
          result = await this.performExtractFunction(operationArgs as ExtractFunctionRequest);
          break;
        case 'extract_variable':
          result = await this.performExtractVariable(operationArgs);
          break;
        case 'inline_function':
          result = await this.performInlineFunction(operationArgs as InlineRequest);
          break;
        case 'inline_variable':
          result = await this.performInlineVariable(operationArgs as InlineRequest);
          break;
        case 'move_function':
        case 'move_class':
          result = await this.performMove(operationArgs as MoveRequest);
          break;
        default:
          throw new Error(`Unsupported refactoring operation: ${operation}`);
      }

      return {
        success: true,
        output: JSON.stringify(result, null, 2)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async performRename(request: RenameRequest): Promise<RefactoringOperation> {
    const { symbolName, newName, filePath, scope, includeComments, includeStrings } = request;

    if (!symbolName || !newName) {
      throw new Error("Symbol name and new name are required for rename operation");
    }

    // Validate new name
    if (!this.isValidIdentifier(newName)) {
      throw new Error(`Invalid identifier: ${newName}`);
    }

    // Find all occurrences of the symbol
    const searchPath = scope === 'file' && filePath ? path.dirname(filePath) : process.cwd();
    const searchResult = await this.symbolSearch.execute({
      query: symbolName,
      searchPath,
      includeUsages: true,
      fuzzyMatch: false,
      caseSensitive: true
    });

    if (!searchResult.success || !searchResult.output) {
      throw new Error("Failed to find symbol occurrences");
    }
    const parsed = JSON.parse(searchResult.output);
    if (!parsed.success) {
      throw new Error("Failed to find symbol occurrences");
    }

    const symbolRefs = parsed.result.symbols as SymbolReference[];
    
    // Filter by scope
    const relevantRefs = scope === 'file' && filePath
      ? symbolRefs.filter(ref => ref.filePath === filePath)
      : symbolRefs;

    if (relevantRefs.length === 0) {
      throw new Error(`Symbol '${symbolName}' not found in specified scope`);
    }

    // Perform safety analysis
    const safety = await this.analyzeSafety(relevantRefs, 'rename');

    // Generate changes
    const fileChanges: RefactoringFileChange[] = [];
    const affectedFiles = new Set<string>();

    for (const ref of relevantRefs) {
      affectedFiles.add(ref.filePath);
      
      const changes = await this.generateRenameChanges(
        ref,
        symbolName,
        newName,
        includeComments,
        includeStrings
      );

      if (changes.length > 0) {
        fileChanges.push({
          filePath: ref.filePath,
          changes
        });
      }
    }

    // Generate preview
    const preview = this.generatePreview(fileChanges, 'rename', symbolName, newName);

    return {
      type: 'rename',
      description: `Rename '${symbolName}' to '${newName}' (${scope} scope)`,
      files: fileChanges,
      preview,
      safety
    };
  }

  private async performExtractFunction(request: ExtractFunctionRequest): Promise<RefactoringOperation> {
    const { filePath, startLine, endLine, functionName, parameters = [], returnType } = request;

    if (!filePath || startLine === undefined || endLine === undefined || !functionName) {
      throw new Error("File path, line range, and function name are required");
    }

    if (!await pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await ops.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    if (startLine < 0 || endLine >= lines.length || startLine > endLine) {
      throw new Error("Invalid line range");
    }

    // Extract the code block
    const extractedCode = lines.slice(startLine, endLine + 1);
    const extractedText = extractedCode.join('\n');

    // Analyze the extracted code for variables
    const analysis = await this.analyzeExtractedCode(extractedText, filePath);
    
    // Generate function signature
    const functionSignature = this.generateFunctionSignature(
      functionName,
      analysis.parameters.length > 0 ? analysis.parameters : parameters,
      returnType || analysis.inferredReturnType
    );

    // Create the new function
    const newFunction = this.createExtractedFunction(
      functionSignature,
      extractedText,
      analysis.localVariables
    );

    // Generate function call
    const functionCall = this.generateFunctionCall(
      functionName,
      analysis.parameters,
      analysis.returnVariable
    );

    // Create changes
    const changes: TextChange[] = [
      // Replace extracted code with function call
      {
        startLine,
        startColumn: 0,
        endLine,
        endColumn: lines[endLine].length,
        oldText: extractedText,
        newText: functionCall,
        type: 'replace'
      },
      // Insert new function (simplified - should find appropriate location)
      {
        startLine: endLine + 1,
        startColumn: 0,
        endLine: endLine + 1,
        endColumn: 0,
        oldText: '',
        newText: '\n' + newFunction + '\n',
        type: 'insert'
      }
    ];

    const safety: SafetyAnalysis = {
      riskLevel: 'medium',
      potentialIssues: [
        'Variable scope changes',
        'Side effects may be altered',
        'Error handling context may change'
      ],
      affectedFiles: 1,
      affectedSymbols: 1,
      requiresTests: true,
      breakingChanges: false
    };

    const fileChanges: RefactoringFileChange[] = [{
      filePath,
      changes
    }];

    const preview = this.generatePreview(fileChanges, 'extract_function', extractedText, functionName);

    return {
      type: 'extract_function',
      description: `Extract function '${functionName}' from lines ${startLine}-${endLine}`,
      files: fileChanges,
      preview,
      safety
    };
  }

  private async performExtractVariable(args: any): Promise<RefactoringOperation> {
    const { filePath, startLine, startColumn, endLine, endColumn, variableName, variableType } = args;

    if (!filePath || !variableName) {
      throw new Error("File path and variable name are required");
    }

    const content = await ops.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract expression
    const startLineContent = lines[startLine];
    const endLineContent = lines[endLine];
    
    let expression: string;
    if (startLine === endLine) {
      expression = startLineContent.substring(startColumn, endColumn);
    } else {
      expression = startLineContent.substring(startColumn) + '\n' +
                  lines.slice(startLine + 1, endLine).join('\n') + '\n' +
                  endLineContent.substring(0, endColumn);
    }

    // Generate variable declaration
    const indent = this.getIndentation(startLineContent);
    const varDeclaration = `${indent}const ${variableName}${variableType ? `: ${variableType}` : ''} = ${expression.trim()};`;

    const changes: TextChange[] = [
      // Insert variable declaration
      {
        startLine,
        startColumn: 0,
        endLine: startLine,
        endColumn: 0,
        oldText: '',
        newText: varDeclaration + '\n',
        type: 'insert'
      },
      // Replace expression with variable
      {
        startLine: startLine + 1, // Account for inserted line
        startColumn,
        endLine: endLine + 1,
        endColumn,
        oldText: expression,
        newText: variableName,
        type: 'replace'
      }
    ];

    const safety: SafetyAnalysis = {
      riskLevel: 'low',
      potentialIssues: ['Variable name conflicts'],
      affectedFiles: 1,
      affectedSymbols: 1,
      requiresTests: false,
      breakingChanges: false
    };

    const fileChanges: RefactoringFileChange[] = [{
      filePath,
      changes
    }];

    const preview = this.generatePreview(fileChanges, 'extract_variable', expression, variableName);

    return {
      type: 'extract_variable',
      description: `Extract variable '${variableName}' from expression`,
      files: fileChanges,
      preview,
      safety
    };
  }

  private async performInlineFunction(request: InlineRequest): Promise<RefactoringOperation> {
    const { symbolName, filePath, preserveComments } = request;

    // Find function definition
    const parseResult = await this.astParser.execute({
      filePath,
      includeSymbols: true,
      symbolTypes: ['function']
    });

    if (!parseResult.success || !parseResult.output) {
      throw new Error("Failed to parse file");
    }
    const parsed = JSON.parse(parseResult.output);
    if (!parsed.success) {
      throw new Error("Failed to parse file");
    }

    const symbols = parsed.result.symbols as SymbolInfo[];
    const functionSymbol = symbols.find(s => s.name === symbolName && s.type === 'function');

    if (!functionSymbol) {
      throw new Error(`Function '${symbolName}' not found`);
    }

    // Get function body
    const content = await ops.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const functionLines = lines.slice(functionSymbol.startPosition.row, functionSymbol.endPosition.row + 1);
    const functionBody = this.extractFunctionBody(functionLines.join('\n'));

    // Find all calls to this function
    const usageSearch = await this.symbolSearch.execute({
      query: symbolName,
      searchPath: path.dirname(filePath),
      includeUsages: true,
      fuzzyMatch: false
    });

    if (!usageSearch.success || !usageSearch.output) {
      throw new Error("Failed to find function usages");
    }
    const usageParsed = JSON.parse(usageSearch.output);
    if (!usageParsed.success) {
      throw new Error("Failed to find function usages");
    }

    const usages = usageParsed.result.symbols as SymbolReference[];
    const functionCalls = this.findFunctionCalls(usages, symbolName);

    // Generate inline replacements
    const fileChanges: RefactoringFileChange[] = [];
    const affectedFiles = new Set<string>();

    for (const call of functionCalls) {
      affectedFiles.add(call.filePath);
      const inlinedCode = this.inlineFunction(functionBody, call.arguments);
      
      // Add change to replace function call with inlined code
      const changes: TextChange[] = [{
        startLine: call.line,
        startColumn: call.column,
        endLine: call.line,
        endColumn: call.column + call.text.length,
        oldText: call.text,
        newText: inlinedCode,
        type: 'replace'
      }];

      fileChanges.push({
        filePath: call.filePath,
        changes
      });
    }

    // Remove function definition
    const definitionChanges: TextChange[] = [{
      startLine: functionSymbol.startPosition.row,
      startColumn: 0,
      endLine: functionSymbol.endPosition.row + 1,
      endColumn: 0,
      oldText: functionLines.join('\n'),
      newText: preserveComments ? this.extractComments(functionLines.join('\n')) : '',
      type: 'replace'
    }];

    fileChanges.push({
      filePath,
      changes: definitionChanges
    });

    const safety: SafetyAnalysis = {
      riskLevel: 'high',
      potentialIssues: [
        'Code duplication',
        'Variable scope changes',
        'Performance implications',
        'Debugging complexity'
      ],
      affectedFiles: affectedFiles.size,
      affectedSymbols: functionCalls.length + 1,
      requiresTests: true,
      breakingChanges: false
    };

    const preview = this.generatePreview(fileChanges, 'inline_function', symbolName, 'inlined code');

    return {
      type: 'inline_function',
      description: `Inline function '${symbolName}' at all call sites`,
      files: fileChanges,
      preview,
      safety
    };
  }

  private async performInlineVariable(_request: InlineRequest): Promise<RefactoringOperation> {
    // Similar to inline function but for variables
    throw new Error("Inline variable not yet implemented");
  }

  private async performMove(_request: MoveRequest): Promise<RefactoringOperation> {
    // Move function or class to different file
    throw new Error("Move operation not yet implemented");
  }

  // Helper methods

  private isValidIdentifier(name: string): boolean {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
  }

  private async analyzeSafety(refs: SymbolReference[], operation: string): Promise<SafetyAnalysis> {
    const affectedFiles = new Set(refs.map((ref: SymbolReference) => ref.filePath)).size;
    const affectedSymbols = refs.length;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const potentialIssues: string[] = [];

    if (affectedFiles > 5) {
      riskLevel = 'medium';
      potentialIssues.push('Many files affected');
    }

    if (affectedSymbols > 20) {
      riskLevel = 'high';
      potentialIssues.push('Many symbol occurrences');
    }

    if (operation === 'rename') {
      potentialIssues.push('Potential naming conflicts');
    }

    return {
      riskLevel,
      potentialIssues,
      affectedFiles,
      affectedSymbols,
      requiresTests: affectedFiles > 1,
      breakingChanges: false
    };
  }

  private async generateRenameChanges(
    ref: SymbolReference,
    oldName: string,
    newName: string,
    includeComments: boolean,
    includeStrings: boolean
  ): Promise<TextChange[]> {
    const changes: TextChange[] = [];
    const content = await ops.promises.readFile(ref.filePath, 'utf-8');
    const lines = content.split('\n');

    // Simple text replacement for now
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments and strings if not requested
      if (!includeComments && (line.trim().startsWith('//') || line.trim().startsWith('*'))) {
        continue;
      }
      
      if (!includeStrings && (line.includes('"') || line.includes("'"))) {
        continue;
      }

      // Find word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${oldName}\\b`, 'g');
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        changes.push({
          startLine: i,
          startColumn: match.index,
          endLine: i,
          endColumn: match.index + oldName.length,
          oldText: oldName,
          newText: newName,
          type: 'replace'
        });
      }
    }

    return changes;
  }

  private async analyzeExtractedCode(code: string, _filePath: string): Promise<any> {
    // Analyze variables, return statements, etc.
    const lines = code.split('\n');
    const parameters: ExtractedParameter[] = [];
    const localVariables: string[] = [];
    let inferredReturnType = 'void';
    let returnVariable: string | undefined;

    // Simple analysis - could be enhanced with AST parsing
    for (const line of lines) {
      if (line.includes('return ')) {
        const returnMatch = line.match(/return\s+([^;]+)/);
        if (returnMatch) {
          returnVariable = returnMatch[1].trim();
          inferredReturnType = 'any'; // Could infer better
        }
      }
    }

    return {
      parameters,
      localVariables,
      inferredReturnType,
      returnVariable
    };
  }

  private generateFunctionSignature(
    name: string,
    parameters: ExtractedParameter[],
    returnType: string
  ): string {
    const params = parameters.map(p => 
      `${p.name}${p.type ? `: ${p.type}` : ''}${p.defaultValue ? ` = ${p.defaultValue}` : ''}`
    ).join(', ');

    return `function ${name}(${params})${returnType !== 'void' ? `: ${returnType}` : ''}`;
  }

  private createExtractedFunction(
    signature: string,
    body: string,
    _localVars: string[]
  ): string {
    return `${signature} {\n${body}\n}`;
  }

  private generateFunctionCall(
    name: string,
    parameters: ExtractedParameter[],
    returnVar?: string
  ): string {
    const args = parameters.map(p => p.name).join(', ');
    const call = `${name}(${args})`;
    
    return returnVar ? `const ${returnVar} = ${call};` : `${call};`;
  }

  private getIndentation(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }

  private extractFunctionBody(functionCode: string): string {
    // Extract just the body content between { }
    const lines = functionCode.split('\n');
    const bodyStart = lines.findIndex(line => line.includes('{')) + 1;
    const bodyEnd = lines.length - 1; // Assume last line has }
    
    return lines.slice(bodyStart, bodyEnd).join('\n');
  }

  private findFunctionCalls(usages: SymbolReference[], _functionName: string): any[] {
    // Find actual function calls vs just references
    const calls: any[] = [];
    
    for (const usage of usages) {
      for (const u of usage.usages) {
        if (u.type === 'call') {
          calls.push({
            filePath: usage.filePath,
            line: u.line,
            column: u.column,
            text: u.context,
            arguments: [] // Would parse actual arguments
          });
        }
      }
    }

    return calls;
  }

  private inlineFunction(functionBody: string, _args: string[]): string {
    // Replace parameters with arguments in function body
    // This is a simplified implementation
    return functionBody;
  }

  private extractComments(code: string): string {
    const lines = code.split('\n');
    const comments = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('*') || 
      line.trim().startsWith('/*')
    );
    return comments.join('\n');
  }

  private generatePreview(
    fileChanges: RefactoringFileChange[],
    operation: string,
    oldValue: string,
    newValue: string
  ): string {
    let preview = `${operation.toUpperCase()}: ${oldValue} → ${newValue}\n\n`;
    
    for (const fileChange of fileChanges) {
      preview += `File: ${fileChange.filePath}\n`;
      preview += `Changes: ${fileChange.changes.length}\n`;
      
      for (const change of fileChange.changes.slice(0, 3)) { // Show first 3 changes
        preview += `  Line ${change.startLine}: ${change.oldText} → ${change.newText}\n`;
      }
      
      if (fileChange.changes.length > 3) {
        preview += `  ... and ${fileChange.changes.length - 3} more changes\n`;
      }
      
      preview += '\n';
    }

    return preview;
  }

  getSchema() {
    return {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["rename", "extract_function", "extract_variable", "inline_function", "inline_variable", "move_function", "move_class"],
          description: "Type of refactoring operation to perform"
        },
        symbolName: {
          type: "string",
          description: "Name of symbol to refactor (for rename, inline, move operations)"
        },
        newName: {
          type: "string",
          description: "New name for symbol (for rename operation)"
        },
        filePath: {
          type: "string",
          description: "Path to file containing the symbol"
        },
        scope: {
          type: "string",
          enum: ["file", "project", "global"],
          description: "Scope of refactoring operation",
          default: "project"
        },
        includeComments: {
          type: "boolean",
          description: "Include comments in rename operation",
          default: false
        },
        includeStrings: {
          type: "boolean",
          description: "Include string literals in rename operation",
          default: false
        },
        startLine: {
          type: "integer",
          description: "Start line for extract operations"
        },
        endLine: {
          type: "integer",
          description: "End line for extract operations"
        },
        startColumn: {
          type: "integer",
          description: "Start column for extract variable operation"
        },
        endColumn: {
          type: "integer",
          description: "End column for extract variable operation"
        },
        functionName: {
          type: "string",
          description: "Name for extracted function"
        },
        variableName: {
          type: "string",
          description: "Name for extracted variable"
        },
        variableType: {
          type: "string",
          description: "Type annotation for extracted variable"
        },
        parameters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string" },
              defaultValue: { type: "string" }
            },
            required: ["name"]
          },
          description: "Parameters for extracted function"
        },
        returnType: {
          type: "string",
          description: "Return type for extracted function"
        },
        targetFile: {
          type: "string",
          description: "Target file for move operations"
        },
        createTargetFile: {
          type: "boolean",
          description: "Create target file if it doesn't exist",
          default: false
        },
        preserveComments: {
          type: "boolean",
          description: "Preserve comments in inline operations",
          default: true
        }
      },
      required: ["operation"]
    };
  }
}