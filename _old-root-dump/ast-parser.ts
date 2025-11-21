import { ToolResult } from "../../types/index.js";
import { parse as parseTS } from "@typescript-eslint/typescript-estree";

// Conditional tree-sitter imports for development compatibility
let Parser: any;
let JavaScript: any;
let TypeScript: any;
let Python: any;

try {
  Parser = require("tree-sitter");
  JavaScript = require("tree-sitter-javascript");
  TypeScript = require("tree-sitter-typescript");
  Python = require("tree-sitter-python");
} catch (error) {
  if (!process.env.GROK_QUIET_MODE) {
    console.warn("Tree-sitter modules not available, falling back to TypeScript-only parsing");
  }
}
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

export interface ASTNode {
  type: string;
  name?: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  text: string;
  children?: ASTNode[];
  metadata?: Record<string, any>;
}

export interface ParseResult {
  language: string;
  tree: ASTNode;
  symbols: SymbolInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  errors: ParseError[];
}

export interface SymbolInfo {
  name: string;
  type: 'function' | 'class' | 'variable' | 'interface' | 'enum' | 'type' | 'method' | 'property';
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  scope: string;
  accessibility?: 'public' | 'private' | 'protected';
  isStatic?: boolean;
  isAsync?: boolean;
  parameters?: ParameterInfo[];
  returnType?: string;
}

export interface ParameterInfo {
  name: string;
  type?: string;
  optional?: boolean;
  defaultValue?: string;
}

export interface ImportInfo {
  source: string;
  specifiers: ImportSpecifier[];
  isTypeOnly?: boolean;
  startPosition: { row: number; column: number };
}

export interface ImportSpecifier {
  name: string;
  alias?: string;
  isDefault?: boolean;
  isNamespace?: boolean;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'variable' | 'interface' | 'enum' | 'type' | 'default';
  startPosition: { row: number; column: number };
  isDefault?: boolean;
  source?: string; // For re-exports
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
}

export class ASTParserTool {
  name = "ast_parser";
  description = "Parse source code files to extract AST, symbols, imports, exports, and structural information";

  private parsers: Map<string, any> = new Map();

  constructor() {
    this.initializeParsers();
  }

  private initializeParsers() {
    if (!Parser || !JavaScript || !TypeScript || !Python) {
      console.log("Tree-sitter parsers not available, using TypeScript-only parsing");
      return;
    }
    
    try {
      // JavaScript/JSX parser
      const jsParser = new Parser();
      jsParser.setLanguage(JavaScript as any);
      this.parsers.set('javascript', jsParser);
      this.parsers.set('js', jsParser);
      this.parsers.set('jsx', jsParser);

      // TypeScript/TSX parser
      const tsParser = new Parser();
      tsParser.setLanguage((TypeScript as any).typescript);
      this.parsers.set('typescript', tsParser);
      this.parsers.set('ts', tsParser);

      const tsxParser = new Parser();
      tsxParser.setLanguage((TypeScript as any).tsx);
      this.parsers.set('tsx', tsxParser);

      // Python parser
      const pyParser = new Parser();
      pyParser.setLanguage(Python as any);
      this.parsers.set('python', pyParser);
      this.parsers.set('py', pyParser);
    } catch (error) {
      console.warn('Failed to initialize some parsers:', error);
    }
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    
    switch (ext) {
      case 'js':
      case 'mjs':
      case 'cjs':
        return 'javascript';
      case 'jsx':
        return 'jsx';
      case 'ts':
        return 'typescript';
      case 'tsx':
        return 'tsx';
      case 'py':
      case 'pyw':
        return 'python';
      default:
        return 'javascript'; // Default fallback
    }
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { 
        filePath, 
        includeSymbols = true, 
        includeImports = true, 
        includeTree = false,
        symbolTypes = ['function', 'class', 'variable', 'interface', 'enum', 'type'],
        scope = 'all' // 'all', 'global', 'local'
      } = args;

      if (!filePath) {
        throw new Error("File path is required");
      }

      if (!await pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = await ops.promises.readFile(filePath, 'utf-8');
      const language = this.detectLanguage(filePath);
      
      let result: ParseResult;

      // Use TypeScript ESTree for better TypeScript analysis
      if (language === 'typescript' || language === 'tsx') {
        result = await this.parseWithTypeScript(content, language, filePath);
      } else {
        result = await this.parseWithTreeSitter(content, language, filePath);
      }

      // Filter results based on parameters
      if (!includeSymbols) {
        result.symbols = [];
      } else {
        result.symbols = result.symbols.filter(symbol => 
          symbolTypes.includes(symbol.type) && 
          (scope === 'all' || this.matchesScope(symbol, scope))
        );
      }

      if (!includeImports) {
        result.imports = [];
        result.exports = [];
      }

      if (!includeTree) {
        result.tree = { type: 'program', text: '', startPosition: { row: 0, column: 0 }, endPosition: { row: 0, column: 0 } };
      }

      return {
        success: true,
        output: JSON.stringify({
          filePath,
          language: result.language,
          symbolCount: result.symbols.length,
          importCount: result.imports.length,
          exportCount: result.exports.length,
          errorCount: result.errors.length,
          ...(includeSymbols && { symbols: result.symbols }),
          ...(includeImports && { 
            imports: result.imports,
            exports: result.exports 
          }),
          ...(includeTree && { tree: result.tree }),
          ...(result.errors.length > 0 && { errors: result.errors })
        }, null, 2)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async parseWithTypeScript(content: string, language: string, filePath: string): Promise<ParseResult> {
    const errors: ParseError[] = [];
    
    try {
      const ast = parseTS(content, {
        jsx: language === 'tsx',
        loc: true,
        range: true,
        comment: true,
        attachComments: true,
        errorOnUnknownASTType: false,
        errorOnTypeScriptSyntacticAndSemanticIssues: false
      });

      const symbols = this.extractTypeScriptSymbols(ast, content);
      const imports = this.extractTypeScriptImports(ast);
      const exports = this.extractTypeScriptExports(ast);
      const tree = this.convertTypeScriptAST(ast);

      return {
        language,
        tree,
        symbols,
        imports,
        exports,
        errors
      };
    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : String(error),
        line: 0,
        column: 0,
        severity: 'error'
      });

      // Fallback to tree-sitter
      return this.parseWithTreeSitter(content, language, filePath);
    }
  }

  private async parseWithTreeSitter(content: string, language: string, filePath: string): Promise<ParseResult> {
    const parser = this.parsers.get(language);
    if (!parser) {
      // Fall back to TypeScript parsing if tree-sitter parser not available
      if (language === 'typescript' || language === 'ts' || language === 'javascript' || language === 'js') {
        return await this.parseWithTypeScript(content, language, filePath);
      }
      throw new Error(`Unsupported language: ${language}`);
    }

    const tree = parser.parse(content);
    const symbols = this.extractTreeSitterSymbols(tree.rootNode, content, language);
    const imports = this.extractTreeSitterImports(tree.rootNode, content, language);
    const exports = this.extractTreeSitterExports(tree.rootNode, content, language);
    const astTree = this.convertTreeSitterAST(tree.rootNode, content);

    return {
      language,
      tree: astTree,
      symbols,
      imports,
      exports,
      errors: []
    };
  }

  private extractTypeScriptSymbols(ast: any, content: string): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const lines = content.split('\n');

    const visit = (node: any, scope = 'global') => {
      if (!node) return;

      const getPosition = (pos: any) => ({
        row: pos.line - 1,
        column: pos.column
      });

      switch (node.type) {
        case 'FunctionDeclaration':
          if (node.id?.name) {
            symbols.push({
              name: node.id.name,
              type: 'function',
              startPosition: getPosition(node.loc.start),
              endPosition: getPosition(node.loc.end),
              scope,
              isAsync: node.async,
              parameters: node.params?.map((param: any) => ({
                name: param.name || (param.left?.name) || 'unknown',
                type: param.typeAnnotation?.typeAnnotation?.type,
                optional: param.optional
              })) || []
            });
          }
          break;

        case 'ClassDeclaration':
          if (node.id?.name) {
            symbols.push({
              name: node.id.name,
              type: 'class',
              startPosition: getPosition(node.loc.start),
              endPosition: getPosition(node.loc.end),
              scope
            });
          }
          // Visit class methods
          node.body?.body?.forEach((member: any) => {
            if (member.type === 'MethodDefinition' && member.key?.name) {
              symbols.push({
                name: member.key.name,
                type: 'method',
                startPosition: getPosition(member.loc.start),
                endPosition: getPosition(member.loc.end),
                scope: `${node.id?.name || 'unknown'}.${member.key.name}`,
                accessibility: member.accessibility,
                isStatic: member.static,
                isAsync: member.value?.async
              });
            }
          });
          break;

        case 'VariableDeclaration':
          node.declarations?.forEach((decl: any) => {
            if (decl.id?.name) {
              symbols.push({
                name: decl.id.name,
                type: 'variable',
                startPosition: getPosition(decl.loc.start),
                endPosition: getPosition(decl.loc.end),
                scope
              });
            }
          });
          break;

        case 'TSInterfaceDeclaration':
          if (node.id?.name) {
            symbols.push({
              name: node.id.name,
              type: 'interface',
              startPosition: getPosition(node.loc.start),
              endPosition: getPosition(node.loc.end),
              scope
            });
          }
          break;

        case 'TSEnumDeclaration':
          if (node.id?.name) {
            symbols.push({
              name: node.id.name,
              type: 'enum',
              startPosition: getPosition(node.loc.start),
              endPosition: getPosition(node.loc.end),
              scope
            });
          }
          break;

        case 'TSTypeAliasDeclaration':
          if (node.id?.name) {
            symbols.push({
              name: node.id.name,
              type: 'type',
              startPosition: getPosition(node.loc.start),
              endPosition: getPosition(node.loc.end),
              scope
            });
          }
          break;
      }

      // Recursively visit children
      for (const key in node) {
        if (key !== 'parent' && key !== 'loc' && key !== 'range') {
          const child = node[key];
          if (Array.isArray(child)) {
            child.forEach(grandchild => {
              if (grandchild && typeof grandchild === 'object') {
                visit(grandchild, scope);
              }
            });
          } else if (child && typeof child === 'object') {
            visit(child, scope);
          }
        }
      }
    };

    visit(ast);
    return symbols;
  }

  private extractTypeScriptImports(ast: any): ImportInfo[] {
    const imports: ImportInfo[] = [];

    const visit = (node: any) => {
      if (node.type === 'ImportDeclaration') {
        const specifiers: ImportSpecifier[] = [];
        
        node.specifiers?.forEach((spec: any) => {
          switch (spec.type) {
            case 'ImportDefaultSpecifier':
              specifiers.push({
                name: spec.local.name,
                isDefault: true
              });
              break;
            case 'ImportNamespaceSpecifier':
              specifiers.push({
                name: spec.local.name,
                isNamespace: true
              });
              break;
            case 'ImportSpecifier':
              specifiers.push({
                name: spec.imported.name,
                alias: spec.local.name !== spec.imported.name ? spec.local.name : undefined
              });
              break;
          }
        });

        imports.push({
          source: node.source.value,
          specifiers,
          isTypeOnly: node.importKind === 'type',
          startPosition: {
            row: node.loc.start.line - 1,
            column: node.loc.start.column
          }
        });
      }

      // Recursively visit children
      for (const key in node) {
        if (key !== 'parent' && key !== 'loc' && key !== 'range') {
          const child = node[key];
          if (Array.isArray(child)) {
            child.forEach(grandchild => {
              if (grandchild && typeof grandchild === 'object') {
                visit(grandchild);
              }
            });
          } else if (child && typeof child === 'object') {
            visit(child);
          }
        }
      }
    };

    visit(ast);
    return imports;
  }

  private extractTypeScriptExports(ast: any): ExportInfo[] {
    const exports: ExportInfo[] = [];

    const visit = (node: any) => {
      switch (node.type) {
        case 'ExportNamedDeclaration':
          if (node.declaration) {
            // Export declaration (export function foo() {})
            if (node.declaration.id?.name) {
              exports.push({
                name: node.declaration.id.name,
                type: this.getDeclarationType(node.declaration.type),
                startPosition: {
                  row: node.loc.start.line - 1,
                  column: node.loc.start.column
                }
              });
            }
          } else if (node.specifiers) {
            // Export specifiers (export { foo, bar })
            node.specifiers.forEach((spec: any) => {
              exports.push({
                name: spec.exported.name,
                type: 'variable', // Default to variable
                startPosition: {
                  row: node.loc.start.line - 1,
                  column: node.loc.start.column
                },
                source: node.source?.value
              });
            });
          }
          break;

        case 'ExportDefaultDeclaration':
          const name = node.declaration?.id?.name || 'default';
          exports.push({
            name,
            type: this.getDeclarationType(node.declaration?.type) || 'default',
            startPosition: {
              row: node.loc.start.line - 1,
              column: node.loc.start.column
            },
            isDefault: true
          });
          break;
      }

      // Recursively visit children
      for (const key in node) {
        if (key !== 'parent' && key !== 'loc' && key !== 'range') {
          const child = node[key];
          if (Array.isArray(child)) {
            child.forEach(grandchild => {
              if (grandchild && typeof grandchild === 'object') {
                visit(grandchild);
              }
            });
          } else if (child && typeof child === 'object') {
            visit(child);
          }
        }
      }
    };

    visit(ast);
    return exports;
  }

  private extractTreeSitterSymbols(node: any, content: string, language: string): SymbolInfo[] {
    const symbols: SymbolInfo[] = [];
    const lines = content.split('\n');

    const visit = (node: any, scope = 'global') => {
      const nodeText = content.slice(node.startIndex, node.endIndex);
      const startPos = { row: node.startPosition.row, column: node.startPosition.column };
      const endPos = { row: node.endPosition.row, column: node.endPosition.column };

      switch (node.type) {
        case 'function_declaration':
        case 'function_definition':
          const funcName = this.extractNodeName(node, 'name') || this.extractNodeName(node, 'identifier');
          if (funcName) {
            symbols.push({
              name: funcName,
              type: 'function',
              startPosition: startPos,
              endPosition: endPos,
              scope
            });
          }
          break;

        case 'class_declaration':
        case 'class_definition':
          const className = this.extractNodeName(node, 'name') || this.extractNodeName(node, 'identifier');
          if (className) {
            symbols.push({
              name: className,
              type: 'class',
              startPosition: startPos,
              endPosition: endPos,
              scope
            });
          }
          break;

        case 'variable_declaration':
        case 'lexical_declaration':
          node.children?.forEach((child: any) => {
            if (child.type === 'variable_declarator') {
              const varName = this.extractNodeName(child, 'name') || this.extractNodeName(child, 'identifier');
              if (varName) {
                symbols.push({
                  name: varName,
                  type: 'variable',
                  startPosition: { row: child.startPosition.row, column: child.startPosition.column },
                  endPosition: { row: child.endPosition.row, column: child.endPosition.column },
                  scope
                });
              }
            }
          });
          break;
      }

      // Recursively visit children
      node.children?.forEach((child: any) => visit(child, scope));
    };

    visit(node);
    return symbols;
  }

  private extractTreeSitterImports(node: any, content: string, language: string): ImportInfo[] {
    const imports: ImportInfo[] = [];

    const visit = (node: any) => {
      if (node.type === 'import_statement' || node.type === 'import_from_statement') {
        // Extract import details from tree-sitter node
        const sourceNode = node.children?.find((child: any) => 
          child.type === 'string' || child.type === 'string_literal'
        );
        
        if (sourceNode) {
          const source = content.slice(sourceNode.startIndex + 1, sourceNode.endIndex - 1); // Remove quotes
          
          imports.push({
            source,
            specifiers: [], // Simplified for tree-sitter
            startPosition: {
              row: node.startPosition.row,
              column: node.startPosition.column
            }
          });
        }
      }

      node.children?.forEach((child: any) => visit(child));
    };

    visit(node);
    return imports;
  }

  private extractTreeSitterExports(node: any, content: string, language: string): ExportInfo[] {
    const exports: ExportInfo[] = [];

    const visit = (node: any) => {
      if (node.type === 'export_statement') {
        // Simplified export extraction for tree-sitter
        const name = this.extractNodeName(node, 'name') || 'unknown';
        exports.push({
          name,
          type: 'variable',
          startPosition: {
            row: node.startPosition.row,
            column: node.startPosition.column
          }
        });
      }

      node.children?.forEach((child: any) => visit(child));
    };

    visit(node);
    return exports;
  }

  private convertTypeScriptAST(node: any): ASTNode {
    return {
      type: node.type,
      text: '',
      startPosition: { row: node.loc?.start?.line - 1 || 0, column: node.loc?.start?.column || 0 },
      endPosition: { row: node.loc?.end?.line - 1 || 0, column: node.loc?.end?.column || 0 },
      children: []
    };
  }

  private convertTreeSitterAST(node: any, content: string): ASTNode {
    const children: ASTNode[] = [];
    
    if (node.children) {
      for (const child of node.children) {
        children.push(this.convertTreeSitterAST(child, content));
      }
    }

    return {
      type: node.type,
      text: content.slice(node.startIndex, node.endIndex),
      startPosition: { row: node.startPosition.row, column: node.startPosition.column },
      endPosition: { row: node.endPosition.row, column: node.endPosition.column },
      children
    };
  }

  private extractNodeName(node: any, nameField: string): string | null {
    const nameNode = node.children?.find((child: any) => child.type === nameField);
    return nameNode ? nameNode.text : null;
  }

  private getDeclarationType(nodeType: string): ExportInfo['type'] {
    switch (nodeType) {
      case 'FunctionDeclaration':
        return 'function';
      case 'ClassDeclaration':
        return 'class';
      case 'TSInterfaceDeclaration':
        return 'interface';
      case 'TSEnumDeclaration':
        return 'enum';
      case 'TSTypeAliasDeclaration':
        return 'type';
      default:
        return 'variable';
    }
  }

  private matchesScope(symbol: SymbolInfo, scope: string): boolean {
    switch (scope) {
      case 'global':
        return symbol.scope === 'global';
      case 'local':
        return symbol.scope !== 'global';
      default:
        return true;
    }
  }

  getSchema() {
    return {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Path to the source code file to parse"
        },
        includeSymbols: {
          type: "boolean",
          description: "Whether to extract symbols (functions, classes, variables, etc.)",
          default: true
        },
        includeImports: {
          type: "boolean", 
          description: "Whether to extract import/export information",
          default: true
        },
        includeTree: {
          type: "boolean",
          description: "Whether to include the full AST tree in response",
          default: false
        },
        symbolTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["function", "class", "variable", "interface", "enum", "type", "method", "property"]
          },
          description: "Types of symbols to extract",
          default: ["function", "class", "variable", "interface", "enum", "type"]
        },
        scope: {
          type: "string",
          enum: ["all", "global", "local"],
          description: "Scope of symbols to extract",
          default: "all"
        }
      },
      required: ["filePath"]
    };
  }
}