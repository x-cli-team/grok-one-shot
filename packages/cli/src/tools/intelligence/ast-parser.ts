import { ToolResult } from "../../lib/types/index.js";
import { parse as parseTS } from "@typescript-eslint/typescript-estree";

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
    // Tree-sitter parsers removed - using TypeScript-only parsing
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

      // Only TypeScript/TSX parsing supported (tree-sitter removed)
      if (language === 'typescript' || language === 'tsx' || language === 'javascript' || language === 'jsx') {
        result = await this.parseWithTypeScript(content, language, filePath);
      } else {
        throw new Error(`Unsupported language: ${language}. Only TypeScript, TSX, JavaScript, and JSX are supported.`);
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

      // Return with errors since tree-sitter fallback removed
      return {
        language,
        tree: { type: 'program', text: '', startPosition: { row: 0, column: 0 }, endPosition: { row: 0, column: 0 } },
        symbols: [],
        imports: [],
        exports: [],
        errors
      };
    }
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

  private convertTypeScriptAST(ast: any): ASTNode {
    const getPosition = (pos: any) => ({
      row: pos.line - 1,
      column: pos.column
    });

    const visit = (node: any): ASTNode => {
      if (!node || typeof node !== 'object') {
        return {
          type: 'unknown',
          text: '',
          startPosition: { row: 0, column: 0 },
          endPosition: { row: 0, column: 0 }
        };
      }

      const children: ASTNode[] = [];
      for (const key in node) {
        if (key !== 'parent' && key !== 'loc' && key !== 'range' && key !== '_babelType') {
          const child = node[key];
          if (Array.isArray(child)) {
            child.forEach(item => {
              if (item && typeof item === 'object' && item.loc) {
                children.push(visit(item));
              }
            });
          } else if (child && typeof child === 'object' && child.loc) {
            children.push(visit(child));
          }
        }
      }

      return {
        type: node.type || 'unknown',
        name: node.id?.name || node.name,
        startPosition: node.loc?.start ? getPosition(node.loc.start) : { row: 0, column: 0 },
        endPosition: node.loc?.end ? getPosition(node.loc.end) : { row: 0, column: 0 },
        text: '',
        children
      };
    };

    return visit(ast);
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