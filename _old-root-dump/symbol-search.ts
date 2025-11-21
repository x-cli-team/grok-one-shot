import { ToolResult } from "../../types/index.js";
import { ASTParserTool, SymbolInfo } from "./ast-parser.js";
import Fuse from "fuse.js";
import * as ops from "fs";

const _pathExists = async (filePath: string): Promise<boolean> => {
  try {
    await ops.promises.access(filePath, ops.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};



import _path from "path";
import { glob } from "glob";

export interface SymbolReference {
  symbol: SymbolInfo;
  filePath: string;
  usages: SymbolUsage[];
}

export interface SymbolUsage {
  line: number;
  column: number;
  context: string;
  type: 'definition' | 'call' | 'reference' | 'import' | 'export';
}

export interface SearchResult {
  query: string;
  totalMatches: number;
  symbols: SymbolReference[];
  searchTime: number;
  scope: {
    filesSearched: number;
    symbolsIndexed: number;
  };
}

export interface CrossReference {
  symbol: string;
  definitionFile: string;
  usageFiles: string[];
  importedBy: string[];
  exportedTo: string[];
}

export class SymbolSearchTool {
  name = "symbol_search";
  description = "Search for symbols (functions, classes, variables) across the codebase with fuzzy matching and cross-references";

  private astParser: ASTParserTool;
  private symbolIndex: Map<string, SymbolReference[]> = new Map();
  private lastIndexTime: number = 0;
  private indexCacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.astParser = new ASTParserTool();
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const {
        query,
        searchPath = process.cwd(),
        symbolTypes = ['function', 'class', 'variable', 'interface', 'enum', 'type'],
        includeUsages = false,
        fuzzyMatch = true,
        caseSensitive = false,
        maxResults = 50,
        filePatterns = ['**/*.{ts,tsx,js,jsx,py}'],
        excludePatterns = ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        indexCache = true
      } = args;

      if (!query) {
        throw new Error("Search query is required");
      }

      const startTime = Date.now();

      // Build or refresh symbol index
      if (!indexCache || this.shouldRebuildIndex()) {
        await this.buildSymbolIndex(searchPath, filePatterns, excludePatterns, symbolTypes);
      }

      // Perform search
      const results = await this.searchSymbols(
        query,
        symbolTypes,
        fuzzyMatch,
        caseSensitive,
        maxResults,
        includeUsages
      );

      const searchTime = Date.now() - startTime;

      return {
        success: true,
        output: JSON.stringify({
          ...results,
          searchTime
        }, null, 2)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private shouldRebuildIndex(): boolean {
    return Date.now() - this.lastIndexTime > this.indexCacheDuration;
  }

  private async buildSymbolIndex(
    searchPath: string,
    filePatterns: string[],
    excludePatterns: string[],
    symbolTypes: string[]
  ): Promise<void> {
    this.symbolIndex.clear();
    
    // Find all source files
    const allFiles: string[] = [];
    for (const pattern of filePatterns) {
      const files = await glob(pattern, {
        cwd: searchPath,
        absolute: true,
        ignore: excludePatterns
      });
      allFiles.push(...files);
    }

    // Parse each file and extract symbols
    for (const filePath of allFiles) {
      try {
        const parseResult = await this.astParser.execute({
          filePath,
          includeSymbols: true,
          includeImports: false,
          includeTree: false,
          symbolTypes
        });

        if (!parseResult.success || !parseResult.output) continue;
        const parsed = JSON.parse(parseResult.output);
        if (parsed.success && parsed.result.symbols) {
          const symbols = parsed.result.symbols as SymbolInfo[];
          
          for (const symbol of symbols) {
            const symbolRef: SymbolReference = {
              symbol,
              filePath,
              usages: []
            };

            // Index by symbol name
            const existing = this.symbolIndex.get(symbol.name) || [];
            existing.push(symbolRef);
            this.symbolIndex.set(symbol.name, existing);

            // Index by type for broader searches
            const typeKey = `type:${symbol.type}`;
            const typeExisting = this.symbolIndex.get(typeKey) || [];
            typeExisting.push(symbolRef);
            this.symbolIndex.set(typeKey, typeExisting);
          }
        }
      } catch (error) {
        // Skip files that can't be parsed
        console.warn(`Failed to parse ${filePath}: ${error}`);
      }
    }

    this.lastIndexTime = Date.now();
  }

  private async searchSymbols(
    query: string,
    symbolTypes: string[],
    fuzzyMatch: boolean,
    caseSensitive: boolean,
    maxResults: number,
    includeUsages: boolean
  ): Promise<SearchResult> {
    const allSymbols: SymbolReference[] = [];
    
    // Collect all indexed symbols
    for (const refs of this.symbolIndex.values()) {
      allSymbols.push(...refs);
    }

    // Filter by symbol types
    const filteredSymbols = allSymbols.filter(ref => 
      symbolTypes.includes(ref.symbol.type)
    );

    let matches: SymbolReference[] = [];

    if (fuzzyMatch) {
      // Use Fuse.js for fuzzy searching
      const fuse = new Fuse(filteredSymbols, {
        keys: [
          { name: 'symbol.name', weight: 0.7 },
          { name: 'symbol.type', weight: 0.2 },
          { name: 'filePath', weight: 0.1 }
        ],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
        isCaseSensitive: caseSensitive
      });

      const fuseResults = fuse.search(query);
      matches = fuseResults.map(result => result.item);
    } else {
      // Exact string matching
      const queryLower = caseSensitive ? query : query.toLowerCase();
      matches = filteredSymbols.filter(ref => {
        const symbolName = caseSensitive ? ref.symbol.name : ref.symbol.name.toLowerCase();
        return symbolName.includes(queryLower);
      });
    }

    // Limit results
    matches = matches.slice(0, maxResults);

    // Optionally find usages
    if (includeUsages) {
      for (const match of matches) {
        match.usages = await this.findSymbolUsages(match);
      }
    }

    return {
      query,
      totalMatches: matches.length,
      symbols: matches,
      searchTime: 0, // Will be set by caller
      scope: {
        filesSearched: this.getUniqueFiles(allSymbols).length,
        symbolsIndexed: allSymbols.length
      }
    };
  }

  private async findSymbolUsages(symbolRef: SymbolReference): Promise<SymbolUsage[]> {
    const usages: SymbolUsage[] = [];
    
    try {
      const content = await ops.promises.readFile(symbolRef.filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Simple text-based usage finding
      // TODO: Use AST analysis for more accurate results
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const symbolName = symbolRef.symbol.name;
        
        let index = 0;
        while ((index = line.indexOf(symbolName, index)) !== -1) {
          // Skip if this is the definition itself
          if (i === symbolRef.symbol.startPosition.row) {
            index += symbolName.length;
            continue;
          }

          // Determine usage type based on context
          let usageType: SymbolUsage['type'] = 'reference';
          
          if (line.includes('import') && line.includes(symbolName)) {
            usageType = 'import';
          } else if (line.includes('export') && line.includes(symbolName)) {
            usageType = 'export';
          } else if (line.includes(symbolName + '(')) {
            usageType = 'call';
          }

          usages.push({
            line: i,
            column: index,
            context: line.trim(),
            type: usageType
          });

          index += symbolName.length;
        }
      }
    } catch (_error) {
      // Skip if file can't be read
    }

    return usages;
  }

  private getUniqueFiles(symbols: SymbolReference[]): string[] {
    const files = new Set(symbols.map(ref => ref.filePath));
    return Array.from(files);
  }

  async findCrossReferences(symbolName: string, searchPath: string = process.cwd()): Promise<CrossReference[]> {
    const crossRefs: CrossReference[] = [];
    
    // Find all occurrences of the symbol
    const searchResult = await this.execute({
      query: symbolName,
      searchPath,
      includeUsages: true,
      fuzzyMatch: false,
      caseSensitive: true
    });

    if (!searchResult.success || !searchResult.output) return [];
    const parsed = JSON.parse(searchResult.output);
    if (parsed.success && parsed.result.symbols) {
      const symbols = parsed.result.symbols as SymbolReference[];
      
      for (const symbolRef of symbols) {
        if (symbolRef.symbol.name === symbolName) {
          const definitionFile = symbolRef.filePath;
          const usageFiles = symbolRef.usages
            .filter(usage => usage.type === 'reference' || usage.type === 'call')
            .map(() => symbolRef.filePath); // Simplified - should check other files

          const importedBy = symbolRef.usages
            .filter(usage => usage.type === 'import')
            .map(() => symbolRef.filePath);

          const exportedTo = symbolRef.usages
            .filter(usage => usage.type === 'export')
            .map(() => symbolRef.filePath);

          crossRefs.push({
            symbol: symbolName,
            definitionFile,
            usageFiles: [...new Set(usageFiles)],
            importedBy: [...new Set(importedBy)],
            exportedTo: [...new Set(exportedTo)]
          });
        }
      }
    }

    return crossRefs;
  }

  async findSimilarSymbols(symbolName: string, threshold: number = 0.6): Promise<SymbolReference[]> {
    const allSymbols: SymbolReference[] = [];
    
    for (const refs of this.symbolIndex.values()) {
      allSymbols.push(...refs);
    }

    const fuse = new Fuse(allSymbols, {
      keys: ['symbol.name'],
      threshold,
      includeScore: true
    });

    const results = fuse.search(symbolName);
    return results.map(result => result.item);
  }

  async getSymbolsByType(symbolType: string, searchPath: string = process.cwd()): Promise<SymbolReference[]> {
    if (!this.symbolIndex.has(`type:${symbolType}`)) {
      await this.buildSymbolIndex(
        searchPath,
        ['**/*.{ts,tsx,js,jsx,py}'],
        ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        [symbolType]
      );
    }

    return this.symbolIndex.get(`type:${symbolType}`) || [];
  }

  clearIndex(): void {
    this.symbolIndex.clear();
    this.lastIndexTime = 0;
  }

  getIndexStats(): { symbolCount: number; fileCount: number; lastUpdated: Date } {
    const allSymbols: SymbolReference[] = [];
    for (const refs of this.symbolIndex.values()) {
      allSymbols.push(...refs);
    }

    return {
      symbolCount: allSymbols.length,
      fileCount: this.getUniqueFiles(allSymbols).length,
      lastUpdated: new Date(this.lastIndexTime)
    };
  }

  getSchema() {
    return {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for symbol names"
        },
        searchPath: {
          type: "string",
          description: "Root path to search in",
          default: "current working directory"
        },
        symbolTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["function", "class", "variable", "interface", "enum", "type", "method", "property"]
          },
          description: "Types of symbols to search for",
          default: ["function", "class", "variable", "interface", "enum", "type"]
        },
        includeUsages: {
          type: "boolean",
          description: "Whether to find usages of matched symbols",
          default: false
        },
        fuzzyMatch: {
          type: "boolean",
          description: "Use fuzzy matching for symbol names",
          default: true
        },
        caseSensitive: {
          type: "boolean", 
          description: "Case sensitive search",
          default: false
        },
        maxResults: {
          type: "integer",
          description: "Maximum number of results to return",
          default: 50,
          minimum: 1,
          maximum: 1000
        },
        filePatterns: {
          type: "array",
          items: { type: "string" },
          description: "Glob patterns for files to search",
          default: ["**/*.{ts,tsx,js,jsx,py}"]
        },
        excludePatterns: {
          type: "array",
          items: { type: "string" },
          description: "Glob patterns for files to exclude",
          default: ["**/node_modules/**", "**/dist/**", "**/.git/**"]
        },
        indexCache: {
          type: "boolean",
          description: "Use cached symbol index if available",
          default: true
        }
      },
      required: ["query"]
    };
  }
}