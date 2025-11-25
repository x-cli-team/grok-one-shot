import * as ops from 'fs-extra';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface CommentsConfig {
  filePath: string;
  commentType: 'functions' | 'classes' | 'all';
  style: 'jsdoc' | 'inline' | 'auto';
}

export interface CodeAnalysis {
  language: string;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  hasExistingComments: boolean;
}

export interface FunctionInfo {
  name: string;
  line: number;
  parameters: string[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
}

export interface ClassInfo {
  name: string;
  line: number;
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  isExported: boolean;
}

export interface InterfaceInfo {
  name: string;
  line: number;
  properties: PropertyInfo[];
}

export interface PropertyInfo {
  name: string;
  type?: string;
  optional: boolean;
}

export class CommentsGenerator {
  private config: CommentsConfig;

  constructor(config: CommentsConfig) {
    this.config = config;
  }

  async generateComments(): Promise<{ success: boolean; message: string; modifiedContent?: string }> {
    try {
      if (!existsSync(this.config.filePath)) {
        return {
          success: false,
          message: 'File not found'
        };
      }

      const content = await ops.promises.readFile(this.config.filePath, 'utf-8');
      const analysis = this.analyzeCode(content);
      
      if (analysis.hasExistingComments) {
        return {
          success: false,
          message: 'File already has extensive comments. Use --force to override.'
        };
      }

      const modifiedContent = this.addComments(content, analysis);
      
      // Create backup
      const backupPath = this.config.filePath + '.backup';
      await ops.promises.writeFile(backupPath, content);
      
      // Write modified content
      await ops.promises.writeFile(this.config.filePath, modifiedContent);

      const commentCount = this.countAddedComments(analysis);
      
      return {
        success: true,
        message: `✅ Added ${commentCount} comments to ${path.basename(this.config.filePath)}\n📁 Backup created: ${path.basename(backupPath)}`,
        modifiedContent
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to add comments: ${error.message}`
      };
    }
  }

  private analyzeCode(content: string): CodeAnalysis {
    const lines = content.split('\n');
    const language = this.detectLanguage();
    
    const analysis: CodeAnalysis = {
      language,
      functions: [],
      classes: [],
      interfaces: [],
      hasExistingComments: this.hasExtensiveComments(content)
    };

    // Simple regex-based parsing (could be enhanced with AST)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect functions
      const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
      if (funcMatch) {
        const [, name, params] = funcMatch;
        analysis.functions.push({
          name,
          line: i + 1,
          parameters: params.split(',').map(p => p.trim()).filter(Boolean),
          isAsync: line.includes('async'),
          isExported: line.includes('export')
        });
      }

      // Detect arrow functions
      const arrowMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/);
      if (arrowMatch) {
        const [, name] = arrowMatch;
        analysis.functions.push({
          name,
          line: i + 1,
          parameters: [],
          isAsync: line.includes('async'),
          isExported: line.includes('export')
        });
      }

      // Detect classes
      const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        const [, name] = classMatch;
        analysis.classes.push({
          name,
          line: i + 1,
          methods: [],
          properties: [],
          isExported: line.includes('export')
        });
      }

      // Detect interfaces (TypeScript)
      const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/);
      if (interfaceMatch) {
        const [, name] = interfaceMatch;
        analysis.interfaces.push({
          name,
          line: i + 1,
          properties: []
        });
      }
    }

    return analysis;
  }

  private detectLanguage(): string {
    const ext = path.extname(this.config.filePath);
    switch (ext) {
      case '.ts': case '.tsx': return 'typescript';
      case '.js': case '.jsx': return 'javascript';
      case '.py': return 'python';
      case '.java': return 'java';
      case '.cpp': case '.cc': case '.cxx': return 'cpp';
      default: return 'unknown';
    }
  }

  private hasExtensiveComments(content: string): boolean {
    const lines = content.split('\n');
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || 
             trimmed.startsWith('/*') || 
             trimmed.startsWith('*') ||
             trimmed.startsWith('#') ||
             trimmed.includes('/**');
    });
    
    // Consider "extensive" if more than 20% of lines are comments
    return commentLines.length / lines.length > 0.2;
  }

  private addComments(content: string, analysis: CodeAnalysis): string {
    const lines = content.split('\n');
    let modifiedLines = [...lines];
    let insertOffset = 0;

    // Add comments to functions
    if (this.config.commentType === 'functions' || this.config.commentType === 'all') {
      for (const func of analysis.functions) {
        const commentLines = this.generateFunctionComment(func, analysis.language);
        const insertIndex = func.line - 1 + insertOffset;
        
        // Insert comment lines before function
        modifiedLines.splice(insertIndex, 0, ...commentLines);
        insertOffset += commentLines.length;
      }
    }

    // Add comments to classes
    if (this.config.commentType === 'classes' || this.config.commentType === 'all') {
      for (const cls of analysis.classes) {
        const commentLines = this.generateClassComment(cls, analysis.language);
        const insertIndex = cls.line - 1 + insertOffset;
        
        modifiedLines.splice(insertIndex, 0, ...commentLines);
        insertOffset += commentLines.length;
      }
    }

    return modifiedLines.join('\n');
  }

  private generateFunctionComment(func: FunctionInfo, language: string): string[] {
    const indent = this.getIndentation(func.line);
    
    if (language === 'typescript' || language === 'javascript') {
      const lines = [
        `${indent}/**`,
        `${indent} * ${this.generateFunctionDescription(func)}`,
      ];

      if (func.parameters.length > 0) {
        lines.push(`${indent} *`);
        func.parameters.forEach(param => {
          const cleanParam = param.split(':')[0].split('=')[0].trim();
          lines.push(`${indent} * @param {any} ${cleanParam} - Parameter description`);
        });
      }

      lines.push(`${indent} * @returns {${func.isAsync ? 'Promise<any>' : 'any'}} Return description`);
      lines.push(`${indent} */`);
      
      return lines;
    }

    return [`${indent}// ${this.generateFunctionDescription(func)}`];
  }

  private generateClassComment(cls: ClassInfo, language: string): string[] {
    const indent = this.getIndentation(cls.line);
    
    if (language === 'typescript' || language === 'javascript') {
      return [
        `${indent}/**`,
        `${indent} * ${cls.name} class`,
        `${indent} * `,
        `${indent} * @class ${cls.name}`,
        `${indent} */`
      ];
    }

    return [`${indent}// ${cls.name} class`];
  }

  private generateFunctionDescription(func: FunctionInfo): string {
    if (func.name === 'constructor') {
      return 'Creates an instance of the class';
    }
    
    // Generate smart descriptions based on function name
    const name = func.name.toLowerCase();
    
    if (name.startsWith('get')) {
      return `Gets ${name.substring(3).replace(/([A-Z])/g, ' $1').toLowerCase()}`;
    }
    if (name.startsWith('set')) {
      return `Sets ${name.substring(3).replace(/([A-Z])/g, ' $1').toLowerCase()}`;
    }
    if (name.startsWith('create')) {
      return `Creates a new ${name.substring(6).replace(/([A-Z])/g, ' $1').toLowerCase()}`;
    }
    if (name.startsWith('delete') || name.startsWith('remove')) {
      const target = name.startsWith('delete') ? name.substring(6) : name.substring(6);
      return `Deletes ${target.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
    }
    if (name.startsWith('update')) {
      return `Updates ${name.substring(6).replace(/([A-Z])/g, ' $1').toLowerCase()}`;
    }
    if (name.startsWith('is') || name.startsWith('has')) {
      return `Checks if ${name.substring(2).replace(/([A-Z])/g, ' $1').toLowerCase()}`;
    }
    if (name.includes('handle')) {
      return `Handles ${name.replace('handle', '').replace(/([A-Z])/g, ' $1').toLowerCase()}`;
    }
    
    return `${func.name} function`;
  }

  private getIndentation(lineNumber: number): string {
    // This would need access to the original line to detect indentation
    // For now, return empty string - could be enhanced
    return '';
  }

  private countAddedComments(analysis: CodeAnalysis): number {
    let count = 0;
    
    if (this.config.commentType === 'functions' || this.config.commentType === 'all') {
      count += analysis.functions.length;
    }
    
    if (this.config.commentType === 'classes' || this.config.commentType === 'all') {
      count += analysis.classes.length;
    }
    
    return count;
  }
}