import * as ops from 'fs-extra';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface ApiDocsConfig {
  rootPath: string;
  outputFormat: 'md' | 'html';
  includePrivate: boolean;
  scanPaths: string[];
}

export interface ApiDocumentation {
  modules: ModuleInfo[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  types: TypeInfo[];
}

export interface ModuleInfo {
  name: string;
  path: string;
  description?: string;
  exports: string[];
}

export interface FunctionInfo {
  name: string;
  module: string;
  signature: string;
  parameters: ParameterInfo[];
  returnType: string;
  description?: string;
  examples?: string[];
  isAsync: boolean;
  isExported: boolean;
}

export interface ClassInfo {
  name: string;
  module: string;
  description?: string;
  constructor?: FunctionInfo;
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  extends?: string;
  implements?: string[];
  isExported: boolean;
}

export interface InterfaceInfo {
  name: string;
  module: string;
  description?: string;
  properties: PropertyInfo[];
  extends?: string[];
  isExported: boolean;
}

export interface TypeInfo {
  name: string;
  module: string;
  definition: string;
  description?: string;
  isExported: boolean;
}

export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
  description?: string;
}

export interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
  description?: string;
}

export class ApiDocsGenerator {
  private config: ApiDocsConfig;

  constructor(config: ApiDocsConfig) {
    this.config = config;
  }

  async generateApiDocs(): Promise<{ success: boolean; message: string; outputPath?: string }> {
    try {
      // Scan for API files
      const documentation = await this.scanApiFiles();
      
      if (documentation.functions.length === 0 && documentation.classes.length === 0) {
        return {
          success: false,
          message: 'No API documentation found. Make sure you have TypeScript/JavaScript files with exported functions or classes.'
        };
      }

      // Generate documentation content
      const content = this.config.outputFormat === 'md' 
        ? this.generateMarkdown(documentation)
        : this.generateHtml(documentation);

      // Write documentation file
      const outputFileName = `api-docs.${this.config.outputFormat}`;
      const outputPath = path.join(this.config.rootPath, outputFileName);
      await ops.promises.writeFile(outputPath, content);

      const stats = this.getDocumentationStats(documentation);

      return {
        success: true,
        message: `✅ Generated API documentation: ${outputFileName}\n\n📊 **Documentation Stats:**\n${stats}`,
        outputPath
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to generate API docs: ${error.message}`
      };
    }
  }

  private async scanApiFiles(): Promise<ApiDocumentation> {
    const documentation: ApiDocumentation = {
      modules: [],
      functions: [],
      classes: [],
      interfaces: [],
      types: []
    };

    // Default scan paths if not specified
    const scanPaths = this.config.scanPaths.length > 0 
      ? this.config.scanPaths 
      : ['src/', 'lib/', './'];

    for (const scanPath of scanPaths) {
      const fullPath = path.join(this.config.rootPath, scanPath);
      if (existsSync(fullPath)) {
        await this.scanDirectory(fullPath, documentation);
      }
    }

    return documentation;
  }

  private async scanDirectory(dirPath: string, documentation: ApiDocumentation): Promise<void> {
    try {
      const entries = await ops.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await this.scanDirectory(fullPath, documentation);
        } else if (entry.isFile() && this.isApiFile(entry.name)) {
          await this.parseApiFile(fullPath, documentation);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  private isApiFile(fileName: string): boolean {
    const apiExtensions = ['.ts', '.js', '.tsx', '.jsx'];
    const ext = path.extname(fileName);
    return apiExtensions.includes(ext) && 
           !fileName.includes('.test.') && 
           !fileName.includes('.spec.') &&
           !fileName.includes('.d.ts');
  }

  private async parseApiFile(filePath: string, documentation: ApiDocumentation): Promise<void> {
    try {
      const content = await ops.promises.readFile(filePath, 'utf-8');
      const relativePath = path.relative(this.config.rootPath, filePath);
      const moduleName = this.getModuleName(relativePath);

      // Simple regex-based parsing (could be enhanced with TypeScript compiler API)
      const lines = content.split('\n');
      const moduleInfo: ModuleInfo = {
        name: moduleName,
        path: relativePath,
        exports: []
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Parse exported functions
        const funcMatch = line.match(/export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/);
        if (funcMatch) {
          const [, name, params, returnType] = funcMatch;
          const functionInfo: FunctionInfo = {
            name,
            module: moduleName,
            signature: line,
            parameters: this.parseParameters(params),
            returnType: returnType?.trim() || 'any',
            isAsync: line.includes('async'),
            isExported: true,
            description: this.extractPrecedingComment(lines, i)
          };
          documentation.functions.push(functionInfo);
          moduleInfo.exports.push(name);
        }

        // Parse exported classes
        const classMatch = line.match(/export\s+class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/);
        if (classMatch) {
          const [, name, extendsClass, implementsInterfaces] = classMatch;
          const classInfo: ClassInfo = {
            name,
            module: moduleName,
            description: this.extractPrecedingComment(lines, i),
            methods: [],
            properties: [],
            extends: extendsClass,
            implements: implementsInterfaces?.split(',').map(s => s.trim()),
            isExported: true,
            constructor: undefined
          };
          documentation.classes.push(classInfo);
          moduleInfo.exports.push(name);
        }

        // Parse interfaces
        const interfaceMatch = line.match(/export\s+interface\s+(\w+)(?:\s+extends\s+([^{]+))?/);
        if (interfaceMatch) {
          const [, name, extendsInterfaces] = interfaceMatch;
          const interfaceInfo: InterfaceInfo = {
            name,
            module: moduleName,
            description: this.extractPrecedingComment(lines, i),
            properties: [],
            extends: extendsInterfaces?.split(',').map(s => s.trim()),
            isExported: true
          };
          documentation.interfaces.push(interfaceInfo);
          moduleInfo.exports.push(name);
        }

        // Parse type aliases
        const typeMatch = line.match(/export\s+type\s+(\w+)\s*=\s*([^;]+)/);
        if (typeMatch) {
          const [, name, definition] = typeMatch;
          const typeInfo: TypeInfo = {
            name,
            module: moduleName,
            definition: definition.trim(),
            description: this.extractPrecedingComment(lines, i),
            isExported: true
          };
          documentation.types.push(typeInfo);
          moduleInfo.exports.push(name);
        }
      }

      if (moduleInfo.exports.length > 0) {
        documentation.modules.push(moduleInfo);
      }

    } catch (error) {
      // Skip files we can't parse
    }
  }

  private getModuleName(relativePath: string): string {
    const withoutExt = relativePath.replace(/\.[^/.]+$/, '');
    return withoutExt.replace(/[/\\]/g, '.');
  }

  private parseParameters(paramsString: string): ParameterInfo[] {
    if (!paramsString.trim()) return [];

    return paramsString.split(',').map(param => {
      const trimmed = param.trim();
      const parts = trimmed.split(':');
      const name = parts[0]?.trim() || '';
      const type = parts[1]?.trim() || 'any';
      
      return {
        name: name.replace(/[?=].*$/, ''), // Remove optional/default markers
        type,
        optional: name.includes('?') || name.includes('='),
        defaultValue: name.includes('=') ? name.split('=')[1]?.trim() : undefined
      };
    });
  }

  private extractPrecedingComment(lines: string[], lineIndex: number): string | undefined {
    // Look for JSDoc or single-line comments before the declaration
    let i = lineIndex - 1;
    const commentLines: string[] = [];

    while (i >= 0) {
      const line = lines[i].trim();
      if (line.startsWith('/**') || line.startsWith('/*')) {
        // JSDoc comment
        const jsdocLines = [];
        while (i >= 0 && !lines[i].includes('*/')) {
          jsdocLines.unshift(lines[i].trim());
          i--;
        }
        if (i >= 0) jsdocLines.unshift(lines[i].trim());
        return jsdocLines.join('\n').replace(/\/\*\*?|\*\/|\s*\*\s?/g, '').trim();
      } else if (line.startsWith('//')) {
        commentLines.unshift(line.replace(/^\s*\/\/\s?/, ''));
        i--;
      } else if (line === '') {
        i--;
      } else {
        break;
      }
    }

    return commentLines.length > 0 ? commentLines.join(' ') : undefined;
  }

  private generateMarkdown(documentation: ApiDocumentation): string {
    let content = `# API Documentation\n\n`;
    content += `Generated on: ${new Date().toISOString().split('T')[0]}\n\n`;

    // Table of Contents
    content += `## 📋 Table of Contents\n\n`;
    if (documentation.modules.length > 0) content += `- [Modules](#modules)\n`;
    if (documentation.functions.length > 0) content += `- [Functions](#functions)\n`;
    if (documentation.classes.length > 0) content += `- [Classes](#classes)\n`;
    if (documentation.interfaces.length > 0) content += `- [Interfaces](#interfaces)\n`;
    if (documentation.types.length > 0) content += `- [Types](#types)\n`;
    content += '\n';

    // Modules
    if (documentation.modules.length > 0) {
      content += `## 📦 Modules\n\n`;
      documentation.modules.forEach(module => {
        content += `### ${module.name}\n\n`;
        content += `**Path:** \`${module.path}\`\n\n`;
        if (module.description) content += `${module.description}\n\n`;
        content += `**Exports:** ${module.exports.join(', ')}\n\n`;
      });
    }

    // Functions
    if (documentation.functions.length > 0) {
      content += `## 🔧 Functions\n\n`;
      documentation.functions.forEach(func => {
        content += `### ${func.name}\n\n`;
        if (func.description) content += `${func.description}\n\n`;
        content += `**Module:** \`${func.module}\`\n\n`;
        content += `**Signature:**\n\`\`\`typescript\n${func.signature}\n\`\`\`\n\n`;
        
        if (func.parameters.length > 0) {
          content += `**Parameters:**\n`;
          func.parameters.forEach(param => {
            const optional = param.optional ? ' (optional)' : '';
            const defaultVal = param.defaultValue ? ` = ${param.defaultValue}` : '';
            content += `- \`${param.name}\`: \`${param.type}\`${optional}${defaultVal}\n`;
            if (param.description) content += `  - ${param.description}\n`;
          });
          content += '\n';
        }
        
        content += `**Returns:** \`${func.returnType}\`\n\n`;
        if (func.isAsync) content += `⚡ **Async function**\n\n`;
      });
    }

    // Classes
    if (documentation.classes.length > 0) {
      content += `## 🏗️ Classes\n\n`;
      documentation.classes.forEach(cls => {
        content += `### ${cls.name}\n\n`;
        if (cls.description) content += `${cls.description}\n\n`;
        content += `**Module:** \`${cls.module}\`\n\n`;
        if (cls.extends) content += `**Extends:** \`${cls.extends}\`\n\n`;
        if (cls.implements && cls.implements.length > 0) {
          content += `**Implements:** ${cls.implements.map(i => `\`${i}\``).join(', ')}\n\n`;
        }
      });
    }

    // Interfaces
    if (documentation.interfaces.length > 0) {
      content += `## 📋 Interfaces\n\n`;
      documentation.interfaces.forEach(iface => {
        content += `### ${iface.name}\n\n`;
        if (iface.description) content += `${iface.description}\n\n`;
        content += `**Module:** \`${iface.module}\`\n\n`;
        if (iface.extends && iface.extends.length > 0) {
          content += `**Extends:** ${iface.extends.map(e => `\`${e}\``).join(', ')}\n\n`;
        }
      });
    }

    // Types
    if (documentation.types.length > 0) {
      content += `## 🎯 Types\n\n`;
      documentation.types.forEach(type => {
        content += `### ${type.name}\n\n`;
        if (type.description) content += `${type.description}\n\n`;
        content += `**Module:** \`${type.module}\`\n\n`;
        content += `**Definition:**\n\`\`\`typescript\ntype ${type.name} = ${type.definition}\n\`\`\`\n\n`;
      });
    }

    content += `---\n*Generated by grok-one-shotDocumentation System*`;
    return content;
  }

  private generateHtml(documentation: ApiDocumentation): string {
    // Basic HTML template - could be enhanced with CSS
    return `<!DOCTYPE html>
<html>
<head>
    <title>API Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>API Documentation</h1>
    <p>Generated on: ${new Date().toISOString().split('T')[0]}</p>
    ${this.generateMarkdown(documentation).replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')}
</body>
</html>`;
  }

  private getDocumentationStats(documentation: ApiDocumentation): string {
    return `- **Modules:** ${documentation.modules.length}
- **Functions:** ${documentation.functions.length}
- **Classes:** ${documentation.classes.length}
- **Interfaces:** ${documentation.interfaces.length}
- **Types:** ${documentation.types.length}`;
  }
}