import { ToolResult } from "../../types/index.js";
import { ASTParserTool, ImportInfo, ExportInfo } from "./ast-parser.js";
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
import { glob } from "glob";

export interface DependencyNode {
  filePath: string;
  absolutePath: string;
  imports: ImportInfo[];
  exports: ExportInfo[];
  dependencies: string[];
  dependents: string[];
  isEntryPoint: boolean;
  isLeaf: boolean;
  circularDependencies: string[][];
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  entryPoints: string[];
  leafNodes: string[];
  circularDependencies: CircularDependency[];
  unreachableFiles: string[];
  statistics: DependencyStatistics;
}

export interface CircularDependency {
  cycle: string[];
  severity: 'warning' | 'error';
  type: 'direct' | 'indirect';
}

export interface DependencyStatistics {
  totalFiles: number;
  totalDependencies: number;
  averageDependencies: number;
  maxDependencyDepth: number;
  circularDependencyCount: number;
  unreachableFileCount: number;
}

export interface ModuleAnalysis {
  filePath: string;
  externalDependencies: string[];
  internalDependencies: string[];
  circularImports: string[];
  unusedImports: string[];
  missingDependencies: string[];
  duplicateImports: string[];
}

export class DependencyAnalyzerTool {
  name = "dependency_analyzer";
  description = "Analyze import/export dependencies, detect circular dependencies, and generate dependency graphs";

  private astParser: ASTParserTool;

  constructor() {
    this.astParser = new ASTParserTool();
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const {
        rootPath = process.cwd(),
        filePatterns = ['**/*.{ts,tsx,js,jsx}'],
        excludePatterns = ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        includeExternals = false,
        detectCircular = true,
        findUnreachable = true,
        generateGraph = false,
        entryPoints = [],
        maxDepth = 50
      } = args;

      if (!await pathExists(rootPath)) {
        throw new Error(`Root path does not exist: ${rootPath}`);
      }

      // Find all source files
      const sourceFiles = await this.findSourceFiles(rootPath, filePatterns, excludePatterns);
      
      // Build dependency graph
      const dependencyGraph = await this.buildDependencyGraph(
        sourceFiles,
        rootPath,
        includeExternals,
        maxDepth
      );

      // Detect circular dependencies
      if (detectCircular) {
        dependencyGraph.circularDependencies = this.detectCircularDependencies(dependencyGraph);
      }

      // Find unreachable files
      if (findUnreachable) {
        dependencyGraph.unreachableFiles = this.findUnreachableFiles(
          dependencyGraph,
          entryPoints.length > 0 ? entryPoints : this.inferEntryPoints(dependencyGraph)
        );
      }

      // Calculate statistics
      dependencyGraph.statistics = this.calculateStatistics(dependencyGraph);

      // Format response
      const result: any = {
        rootPath,
        totalFiles: sourceFiles.length,
        entryPoints: dependencyGraph.entryPoints,
        leafNodes: dependencyGraph.leafNodes,
        statistics: dependencyGraph.statistics
      };

      if (detectCircular) {
        result.circularDependencies = dependencyGraph.circularDependencies;
      }

      if (findUnreachable) {
        result.unreachableFiles = dependencyGraph.unreachableFiles;
      }

      if (generateGraph) {
        result.dependencyGraph = this.serializeDependencyGraph(dependencyGraph);
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

  private async findSourceFiles(
    rootPath: string,
    filePatterns: string[],
    excludePatterns: string[]
  ): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const pattern of filePatterns) {
      const files = await glob(pattern, {
        cwd: rootPath,
        absolute: true,
        ignore: excludePatterns
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)]; // Remove duplicates
  }

  private async buildDependencyGraph(
    sourceFiles: string[],
    rootPath: string,
    includeExternals: boolean,
    maxDepth: number
  ): Promise<DependencyGraph> {
    const graph: DependencyGraph = {
      nodes: new Map(),
      entryPoints: [],
      leafNodes: [],
      circularDependencies: [],
      unreachableFiles: [],
      statistics: {
        totalFiles: 0,
        totalDependencies: 0,
        averageDependencies: 0,
        maxDependencyDepth: 0,
        circularDependencyCount: 0,
        unreachableFileCount: 0
      }
    };

    // Parse each file and extract imports/exports
    for (const filePath of sourceFiles) {
      try {
        const parseResult = await this.astParser.execute({
          filePath,
          includeSymbols: false,
          includeImports: true,
          includeTree: false
        });

        if (!parseResult.success || !parseResult.output) continue;
        const parsed = JSON.parse(parseResult.output);
        if (parsed.success && parsed.result) {
          const imports = parsed.result.imports as ImportInfo[] || [];
          const exports = parsed.result.exports as ExportInfo[] || [];

          // Resolve import paths
          const dependencies = await this.resolveImportPaths(
            imports,
            filePath,
            rootPath,
            includeExternals
          );

          const node: DependencyNode = {
            filePath: path.relative(rootPath, filePath),
            absolutePath: filePath,
            imports,
            exports,
            dependencies,
            dependents: [],
            isEntryPoint: false,
            isLeaf: dependencies.length === 0,
            circularDependencies: []
          };

          graph.nodes.set(filePath, node);
        }
      } catch (error) {
        console.warn(`Failed to parse ${filePath}: ${error}`);
      }
    }

    // Build reverse dependencies (dependents)
    for (const [filePath, node] of graph.nodes) {
      for (const dependency of node.dependencies) {
        const depNode = graph.nodes.get(dependency);
        if (depNode) {
          depNode.dependents.push(filePath);
        }
      }
    }

    // Identify entry points and leaf nodes
    for (const [filePath, node] of graph.nodes) {
      node.isEntryPoint = node.dependents.length === 0;
      node.isLeaf = node.dependencies.length === 0;

      if (node.isEntryPoint) {
        graph.entryPoints.push(filePath);
      }
      if (node.isLeaf) {
        graph.leafNodes.push(filePath);
      }
    }

    return graph;
  }

  private async resolveImportPaths(
    imports: ImportInfo[],
    currentFile: string,
    rootPath: string,
    includeExternals: boolean
  ): Promise<string[]> {
    const dependencies: string[] = [];
    const currentDir = path.dirname(currentFile);

    for (const importInfo of imports) {
      let resolvedPath: string | null = null;

      if (importInfo.source.startsWith('.')) {
        // Relative import
        resolvedPath = await this.resolveRelativeImport(importInfo.source, currentDir);
      } else if (importInfo.source.startsWith('/')) {
        // Absolute import from root
        resolvedPath = await this.resolveAbsoluteImport(importInfo.source, rootPath);
      } else if (includeExternals) {
        // External module
        dependencies.push(importInfo.source);
        continue;
      } else {
        // Skip external modules if not including them
        continue;
      }

      if (resolvedPath && await pathExists(resolvedPath)) {
        dependencies.push(resolvedPath);
      }
    }

    return dependencies;
  }

  private async resolveRelativeImport(importPath: string, currentDir: string): Promise<string | null> {
    const basePath = path.resolve(currentDir, importPath);
    
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      if (await pathExists(fullPath)) {
        return fullPath;
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = path.join(basePath, `index${ext}`);
      if (await pathExists(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  private async resolveAbsoluteImport(importPath: string, rootPath: string): Promise<string | null> {
    const fullPath = path.join(rootPath, importPath.slice(1)); // Remove leading slash
    return await this.resolveRelativeImport('.', path.dirname(fullPath));
  }

  private detectCircularDependencies(graph: DependencyGraph): CircularDependency[] {
    const circularDeps: CircularDependency[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const dfs = (filePath: string, path: string[]): void => {
      if (visiting.has(filePath)) {
        // Found a cycle
        const cycleStart = path.indexOf(filePath);
        const cycle = path.slice(cycleStart).concat([filePath]);
        
        circularDeps.push({
          cycle: cycle.map(fp => graph.nodes.get(fp)?.filePath || fp),
          severity: cycle.length <= 2 ? 'error' : 'warning',
          type: cycle.length <= 2 ? 'direct' : 'indirect'
        });
        return;
      }

      if (visited.has(filePath)) {
        return;
      }

      visiting.add(filePath);
      const node = graph.nodes.get(filePath);
      
      if (node) {
        for (const dependency of node.dependencies) {
          if (graph.nodes.has(dependency)) {
            dfs(dependency, [...path, filePath]);
          }
        }
      }

      visiting.delete(filePath);
      visited.add(filePath);
    };

    for (const filePath of graph.nodes.keys()) {
      if (!visited.has(filePath)) {
        dfs(filePath, []);
      }
    }

    return circularDeps;
  }

  private findUnreachableFiles(graph: DependencyGraph, entryPoints: string[]): string[] {
    const reachable = new Set<string>();

    const dfs = (filePath: string): void => {
      if (reachable.has(filePath)) {
        return;
      }

      reachable.add(filePath);
      const node = graph.nodes.get(filePath);
      
      if (node) {
        for (const dependency of node.dependencies) {
          if (graph.nodes.has(dependency)) {
            dfs(dependency);
          }
        }
      }
    };

    // Start DFS from entry points
    for (const entryPoint of entryPoints) {
      if (graph.nodes.has(entryPoint)) {
        dfs(entryPoint);
      }
    }

    // Find unreachable files
    const unreachable: string[] = [];
    for (const filePath of graph.nodes.keys()) {
      if (!reachable.has(filePath)) {
        const node = graph.nodes.get(filePath);
        unreachable.push(node?.filePath || filePath);
      }
    }

    return unreachable;
  }

  private inferEntryPoints(graph: DependencyGraph): string[] {
    // If no explicit entry points, use files with no dependents
    if (graph.entryPoints.length > 0) {
      return graph.entryPoints;
    }

    // Look for common entry point patterns
    const commonEntryPatterns = [
      /index\.(ts|js|tsx|jsx)$/,
      /main\.(ts|js|tsx|jsx)$/,
      /app\.(ts|js|tsx|jsx)$/,
      /server\.(ts|js|tsx|jsx)$/
    ];

    const entryPoints: string[] = [];
    
    for (const [filePath, node] of graph.nodes) {
      const fileName = path.basename(filePath);
      
      if (node.dependents.length === 0 || 
          commonEntryPatterns.some(pattern => pattern.test(fileName))) {
        entryPoints.push(filePath);
      }
    }

    return entryPoints;
  }

  private calculateStatistics(graph: DependencyGraph): DependencyStatistics {
    const totalFiles = graph.nodes.size;
    let totalDependencies = 0;
    let maxDepth = 0;

    for (const node of graph.nodes.values()) {
      totalDependencies += node.dependencies.length;
      
      // Calculate depth from entry points
      const depth = this.calculateNodeDepth(node.absolutePath, graph);
      maxDepth = Math.max(maxDepth, depth);
    }

    return {
      totalFiles,
      totalDependencies,
      averageDependencies: totalFiles > 0 ? totalDependencies / totalFiles : 0,
      maxDependencyDepth: maxDepth,
      circularDependencyCount: graph.circularDependencies.length,
      unreachableFileCount: graph.unreachableFiles.length
    };
  }

  private calculateNodeDepth(filePath: string, graph: DependencyGraph): number {
    const visited = new Set<string>();
    
    const dfs = (currentPath: string, depth: number): number => {
      if (visited.has(currentPath)) {
        return depth;
      }
      
      visited.add(currentPath);
      const node = graph.nodes.get(currentPath);
      
      if (!node || node.dependencies.length === 0) {
        return depth;
      }

      let maxChildDepth = depth;
      for (const dependency of node.dependencies) {
        if (graph.nodes.has(dependency)) {
          const childDepth = dfs(dependency, depth + 1);
          maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
      }

      return maxChildDepth;
    };

    return dfs(filePath, 0);
  }

  private serializeDependencyGraph(graph: DependencyGraph): any {
    const nodes: any[] = [];
    
    for (const [filePath, node] of graph.nodes) {
      nodes.push({
        id: filePath,
        filePath: node.filePath,
        dependencies: node.dependencies,
        dependents: node.dependents,
        isEntryPoint: node.isEntryPoint,
        isLeaf: node.isLeaf,
        importCount: node.imports.length,
        exportCount: node.exports.length
      });
    }

    return {
      nodes,
      edges: this.generateEdges(graph)
    };
  }

  private generateEdges(graph: DependencyGraph): any[] {
    const edges: any[] = [];
    
    for (const [filePath, node] of graph.nodes) {
      for (const dependency of node.dependencies) {
        if (graph.nodes.has(dependency)) {
          edges.push({
            from: filePath,
            to: dependency,
            type: 'dependency'
          });
        }
      }
    }

    return edges;
  }

  // Additional utility methods
  async analyzeModule(filePath: string): Promise<ModuleAnalysis> {
    const parseResult = await this.astParser.execute({
      filePath,
      includeSymbols: false,
      includeImports: true,
      includeTree: false
    });

    if (!parseResult.success || !parseResult.output) {
      throw new Error(`Failed to parse module: ${filePath}`);
    }
    const parsed = JSON.parse(parseResult.output);
    if (!parsed.success) {
      throw new Error(`Failed to parse module: ${filePath}`);
    }

    const imports = parsed.result.imports as ImportInfo[] || [];
    const rootPath = process.cwd();
    
    const externalDependencies: string[] = [];
    const internalDependencies: string[] = [];
    const duplicateImports: string[] = [];
    const seenSources = new Set<string>();

    for (const importInfo of imports) {
      if (seenSources.has(importInfo.source)) {
        duplicateImports.push(importInfo.source);
      } else {
        seenSources.add(importInfo.source);
      }

      if (importInfo.source.startsWith('.') || importInfo.source.startsWith('/')) {
        const resolved = await this.resolveRelativeImport(
          importInfo.source,
          path.dirname(filePath)
        );
        if (resolved) {
          internalDependencies.push(resolved);
        }
      } else {
        externalDependencies.push(importInfo.source);
      }
    }

    return {
      filePath: path.relative(rootPath, filePath),
      externalDependencies,
      internalDependencies,
      circularImports: [], // TODO: Implement
      unusedImports: [], // TODO: Implement with symbol usage analysis
      missingDependencies: [], // TODO: Implement with file existence checks
      duplicateImports
    };
  }

  getSchema() {
    return {
      type: "object",
      properties: {
        rootPath: {
          type: "string",
          description: "Root path to analyze dependencies from",
          default: "current working directory"
        },
        filePatterns: {
          type: "array",
          items: { type: "string" },
          description: "Glob patterns for files to include",
          default: ["**/*.{ts,tsx,js,jsx}"]
        },
        excludePatterns: {
          type: "array",
          items: { type: "string" },
          description: "Glob patterns for files to exclude",
          default: ["**/node_modules/**", "**/dist/**", "**/.git/**"]
        },
        includeExternals: {
          type: "boolean",
          description: "Include external module dependencies",
          default: false
        },
        detectCircular: {
          type: "boolean",
          description: "Detect circular dependencies",
          default: true
        },
        findUnreachable: {
          type: "boolean",
          description: "Find unreachable files from entry points",
          default: true
        },
        generateGraph: {
          type: "boolean",
          description: "Generate serialized dependency graph",
          default: false
        },
        entryPoints: {
          type: "array",
          items: { type: "string" },
          description: "Explicit entry point files (if not provided, will be inferred)",
          default: []
        },
        maxDepth: {
          type: "integer",
          description: "Maximum dependency depth to analyze",
          default: 50,
          minimum: 1,
          maximum: 1000
        }
      }
    };
  }
}