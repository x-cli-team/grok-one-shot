/**
 * Codebase Explorer Service
 * 
 * Provides comprehensive codebase analysis capabilities with incremental indexing.
 * Safely explores project structure, dependencies, and patterns without
 * making any modifications. Enhanced with change detection for efficient updates.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { 
  ExplorationData, 
  ProjectStructure, 
  ComponentMap, 
  ComponentInfo,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  ComplexityMetrics,
  ArchitecturePattern,
  ExplorationInsight,
  PlanModeSettings
} from '../types/plan-mode.js';

interface ExplorationOptions {
  /** Root directory to explore */
  rootPath: string;
  /** Maximum depth to explore */
  maxDepth?: number;
  /** File size limit in bytes */
  maxFileSize?: number;
  /** Patterns to ignore */
  ignorePatterns?: string[];
  /** Focus on specific paths */
  focusPaths?: string[];
  /** Enable incremental indexing */
  incremental?: boolean;
  /** Force complete reindexing */
  forceReindex?: boolean;
}

interface FileInfo {
  path: string;
  name: string;
  size: number;
  extension: string;
  isDirectory: boolean;
  relativePath: string;
  lastModified?: number;
  checksum?: string;
}

interface LanguageStats {
  [language: string]: {
    fileCount: number;
    lineCount: number;
    fileSize: number;
  };
}

interface IndexCache {
  files: Map<string, FileInfo>;
  lastIndexed: number;
  explorationData?: ExplorationData;
}

export class CodebaseExplorer {
  private indexCache: IndexCache = {
    files: new Map(),
    lastIndexed: 0
  };

  private readonly defaultIgnorePatterns = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'coverage',
    '.vscode',
    '.idea',
    '*.log',
    '.DS_Store',
    'Thumbs.db'
  ];

  private readonly languageExtensions = {
    'TypeScript': ['.ts', '.tsx'],
    'JavaScript': ['.js', '.jsx', '.mjs'],
    'Python': ['.py', '.pyx'],
    'Java': ['.java'],
    'C++': ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
    'C': ['.c', '.h'],
    'Go': ['.go'],
    'Rust': ['.rs'],
    'PHP': ['.php'],
    'Ruby': ['.rb'],
    'Swift': ['.swift'],
    'Kotlin': ['.kt'],
    'Dart': ['.dart'],
    'JSON': ['.json'],
    'YAML': ['.yml', '.yaml'],
    'XML': ['.xml'],
    'HTML': ['.html', '.htm'],
    'CSS': ['.css', '.scss', '.sass', '.less'],
    'Markdown': ['.md', '.mdx'],
    'Shell': ['.sh', '.bash', '.zsh'],
    'SQL': ['.sql'],
    'Dockerfile': ['Dockerfile', '.dockerfile']
  };

  private readonly configFilePatterns = [
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'requirements.txt',
    'Pipfile',
    'pyproject.toml',
    'setup.py',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'Makefile',
    'CMakeLists.txt',
    '.gitignore',
    '.env',
    '.env.example',
    'tsconfig.json',
    'jsconfig.json',
    'webpack.config.js',
    'vite.config.js',
    'next.config.js',
    'tailwind.config.js',
    'babel.config.js',
    'jest.config.js',
    'vitest.config.js',
    'eslint.config.js',
    '.eslintrc.*',
    'prettier.config.js',
    '.prettierrc.*'
  ];

  constructor(private settings: PlanModeSettings) {}

  /**
   * Explore the codebase with incremental indexing support
   */
  async exploreCodebase(options: ExplorationOptions): Promise<ExplorationData> {
    const startTime = Date.now();
    
    try {
      // Check if we can use incremental indexing
      const useIncremental = options.incremental && !options.forceReindex && this.hasValidCache();
      
      let files: FileInfo[];
      let changedFiles: FileInfo[] = [];
      
      if (useIncremental) {
        console.log(`[CodebaseExplorer] Using incremental indexing`);
        const changes = await this.detectChanges(options.rootPath, options);
        files = Array.from(this.indexCache.files.values());
        changedFiles = changes.changedFiles;
        
        // Update cache with changes
        this.updateCacheWithChanges(changes);
        
        // If too many changes, fallback to full scan
        if (changedFiles.length > files.length * 0.3) {
          console.log(`[CodebaseExplorer] Too many changes (${changedFiles.length}), performing full scan`);
          files = await this.scanDirectory(options.rootPath, options);
          this.updateCache(files);
        }
      } else {
        console.log(`[CodebaseExplorer] Performing full codebase scan`);
        files = await this.scanDirectory(options.rootPath, options);
        this.updateCache(files);
      }

      const exploredPaths = files.map(f => f.path);

      // Only re-analyze if we have significant changes or no cached data
      let explorationData: ExplorationData;
      
      if (!useIncremental || changedFiles.length > 0 || !this.indexCache.explorationData) {
        console.log(`[CodebaseExplorer] Analyzing ${useIncremental ? changedFiles.length : files.length} files`);
        
        // Analyze project structure
        const projectStructure = await this.analyzeProjectStructure(options.rootPath, files);
        
        // Build component map
        const componentMap = await this.buildComponentMap(files);
        
        // Analyze dependencies
        const dependencies = await this.analyzeDependencies(files);
        
        // Calculate complexity metrics
        const complexity = await this.calculateComplexityMetrics(files);
        
        // Detect architecture patterns
        const architecturePatterns = await this.detectArchitecturePatterns(files, projectStructure);
        
        // Generate insights
        const insights = await this.generateInsights(files, projectStructure, complexity);

        explorationData = {
          exploredPaths,
          projectStructure,
          keyComponents: componentMap,
          dependencies,
          complexity,
          architecturePatterns,
          insights
        };
        
        // Cache the results
        this.indexCache.explorationData = explorationData;
      } else {
        console.log(`[CodebaseExplorer] Using cached exploration data`);
        explorationData = this.indexCache.explorationData;
        explorationData.exploredPaths = exploredPaths; // Update paths
      }

      const duration = Date.now() - startTime;
      console.log(`[CodebaseExplorer] Exploration completed in ${duration}ms`);
      console.log(`[CodebaseExplorer] Analyzed ${files.length} files (${changedFiles.length} changed)`);

      return explorationData;
    } catch (error) {
      console.error('[CodebaseExplorer] Exploration failed:', error);
      throw error;
    }
  }

  /**
   * Scan directory structure recursively
   */
  private async scanDirectory(
    dirPath: string, 
    options: ExplorationOptions,
    currentDepth = 0
  ): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    const maxDepth = options.maxDepth ?? this.settings.maxExplorationDepth;
    
    if (currentDepth > maxDepth) {
      return files;
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(options.rootPath, fullPath);
        
        // Check ignore patterns
        if (this.shouldIgnore(relativePath, options.ignorePatterns)) {
          continue;
        }

        const fileInfo: FileInfo = {
          path: fullPath,
          name: entry.name,
          size: 0,
          extension: path.extname(entry.name),
          isDirectory: entry.isDirectory(),
          relativePath,
          lastModified: 0,
          checksum: undefined
        };

        if (entry.isDirectory()) {
          files.push(fileInfo);
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath, options, currentDepth + 1);
          files.push(...subFiles);
        } else {
          // Get file stats
          try {
            const stats = await fs.stat(fullPath);
            fileInfo.size = stats.size;
            fileInfo.lastModified = stats.mtimeMs;
            
            // Skip files that are too large
            if (fileInfo.size > this.settings.maxFileSize) {
              continue;
            }
            
            // Calculate checksum for source files for change detection
            if (this.isSourceFile(fileInfo)) {
              fileInfo.checksum = await this.calculateFileChecksum(fullPath);
            }
            
            files.push(fileInfo);
          } catch (_error) {
            // Skip files we can't read
            continue;
          }
        }
      }
    } catch (_error) {
      // Skip directories we can't read
      console.warn(`[CodebaseExplorer] Cannot read directory: ${dirPath}`);
    }

    return files;
  }

  /**
   * Analyze overall project structure
   */
  private async analyzeProjectStructure(rootPath: string, files: FileInfo[]): Promise<ProjectStructure> {
    const languageStats = this.calculateLanguageStats(files);
    const primaryLanguage = this.determinePrimaryLanguage(languageStats);
    const projectType = await this.detectProjectType(rootPath, files);
    
    const sourceFiles = files.filter(f => !f.isDirectory && this.isSourceFile(f));
    const configFiles = files.filter(f => !f.isDirectory && this.isConfigFile(f));
    const _testFiles = files.filter(f => !f.isDirectory && this.isTestFile(f));
    
    const entryPoints = await this.findEntryPoints(rootPath, files);
    const sourceDirectories = this.findSourceDirectories(files);
    const testDirectories = this.findTestDirectories(files);
    const buildDirectories = this.findBuildDirectories(files);
    
    const slocEstimate = await this.estimateSourceLines(sourceFiles);

    return {
      rootPath,
      primaryLanguage,
      projectType,
      entryPoints,
      configFiles: configFiles.map(f => f.relativePath),
      sourceDirectories,
      testDirectories,
      buildDirectories,
      totalFiles: files.filter(f => !f.isDirectory).length,
      slocEstimate
    };
  }

  /**
   * Build component map from analyzed files
   */
  private async buildComponentMap(files: FileInfo[]): Promise<ComponentMap> {
    const sourceFiles = files.filter(f => !f.isDirectory && this.isSourceFile(f));
    const components: ComponentInfo[] = [];

    for (const file of sourceFiles) {
      try {
        const component = await this.analyzeComponent(file);
        if (component) {
          components.push(component);
        }
      } catch (_error) {
        // Skip files we can't analyze
        continue;
      }
    }

    return {
      core: components.filter(c => c.type === 'class' || c.type === 'module'),
      utilities: components.filter(c => c.type === 'utility'),
      tests: components.filter(c => c.type === 'test'),
      config: components.filter(c => c.type === 'config'),
      external: [] // Will be populated from dependency analysis
    };
  }

  /**
   * Analyze dependencies between components
   */
  private async analyzeDependencies(files: FileInfo[]): Promise<DependencyGraph> {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const sourceFiles = files.filter(f => !f.isDirectory && this.isSourceFile(f));

    // Create nodes for each source file
    for (const file of sourceFiles) {
      nodes.push({
        id: file.relativePath,
        name: path.basename(file.name, file.extension),
        type: this.isExternalDependency(file) ? 'external' : 'internal',
        importance: this.calculateImportance(file)
      });
    }

    // Analyze import/require statements
    for (const file of sourceFiles) {
      try {
        const dependencies = await this.extractDependencies(file);
        for (const dep of dependencies) {
          edges.push({
            from: file.relativePath,
            to: dep.target,
            type: dep.type,
            strength: dep.strength
          });
        }
      } catch (_error) {
        // Skip files we can't analyze
        continue;
      }
    }

    const circularDependencies = this.detectCircularDependencies(nodes, edges);
    const criticalPath = this.findCriticalPath(nodes, edges);

    return {
      nodes,
      edges,
      circularDependencies,
      criticalPath
    };
  }

  /**
   * Calculate complexity metrics
   */
  private async calculateComplexityMetrics(files: FileInfo[]): Promise<ComplexityMetrics> {
    const sourceFiles = files.filter(f => !f.isDirectory && this.isSourceFile(f));
    let totalComplexity = 0;
    let totalCognitive = 0;
    let maintainabilitySum = 0;
    let fileCount = 0;
    const complexComponents: string[] = [];

    for (const file of sourceFiles) {
      try {
        const metrics = await this.analyzeFileComplexity(file);
        totalComplexity += metrics.cyclomatic;
        totalCognitive += metrics.cognitive;
        maintainabilitySum += metrics.maintainability;
        fileCount++;

        if (metrics.cyclomatic > 10) {
          complexComponents.push(file.relativePath);
        }
      } catch (_error) {
        // Skip files we can't analyze
        continue;
      }
    }

    const avgComplexity = fileCount > 0 ? totalComplexity / fileCount : 0;
    const avgCognitive = fileCount > 0 ? totalCognitive / fileCount : 0;
    const avgMaintainability = fileCount > 0 ? maintainabilitySum / fileCount : 100;

    return {
      overall: Math.min(10, Math.max(1, Math.round((avgComplexity + avgCognitive) / 2))),
      cyclomatic: avgComplexity,
      cognitive: avgCognitive,
      maintainability: avgMaintainability,
      technicalDebt: Math.max(0, 100 - avgMaintainability) / 100,
      complexComponents: complexComponents.slice(0, 10) // Top 10 most complex
    };
  }

  /**
   * Detect architecture patterns
   */
  private async detectArchitecturePatterns(
    files: FileInfo[], 
    structure: ProjectStructure
  ): Promise<ArchitecturePattern[]> {
    const patterns: ArchitecturePattern[] = [];

    // Detect common patterns based on project structure
    if (structure.projectType === 'react') {
      patterns.push({
        name: 'Component-Based Architecture',
        type: 'architectural',
        confidence: 0.9,
        components: files.filter(f => f.name.includes('component') || f.extension === '.tsx').map(f => f.relativePath),
        description: 'React component-based architecture with reusable UI components'
      });
    }

    if (structure.sourceDirectories.some(dir => dir.includes('service'))) {
      patterns.push({
        name: 'Service Layer Pattern',
        type: 'architectural',
        confidence: 0.8,
        components: files.filter(f => f.relativePath.includes('service')).map(f => f.relativePath),
        description: 'Business logic separated into service layer'
      });
    }

    // Add more pattern detection logic...
    
    return patterns;
  }

  /**
   * Generate insights about the codebase
   */
  private async generateInsights(
    files: FileInfo[],
    structure: ProjectStructure,
    complexity: ComplexityMetrics
  ): Promise<ExplorationInsight[]> {
    const insights: ExplorationInsight[] = [];

    // High complexity warning
    if (complexity.overall > 7) {
      insights.push({
        type: 'warning',
        title: 'High Code Complexity',
        description: `Average complexity is ${complexity.overall}/10. Consider refactoring complex components.`,
        components: complexity.complexComponents,
        confidence: 0.9,
        priority: 4
      });
    }

    // Large file warning
    const largeFiles = files.filter(f => f.size > 50000); // 50KB+
    if (largeFiles.length > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Large Files Detected',
        description: `Found ${largeFiles.length} large files. Consider breaking them into smaller modules.`,
        components: largeFiles.map(f => f.relativePath),
        confidence: 0.8,
        priority: 3
      });
    }

    // Missing tests
    const hasTests = structure.testDirectories.length > 0;
    if (!hasTests) {
      insights.push({
        type: 'opportunity',
        title: 'No Test Directory Found',
        description: 'Consider adding automated tests to improve code quality and reliability.',
        components: [],
        confidence: 0.95,
        priority: 5
      });
    }

    return insights;
  }

  // Utility methods
  private shouldIgnore(relativePath: string, customIgnorePatterns?: string[]): boolean {
    const patterns = [...this.defaultIgnorePatterns, ...(customIgnorePatterns || [])];
    return patterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(relativePath);
      }
      return relativePath.includes(pattern);
    });
  }

  private isSourceFile(file: FileInfo): boolean {
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c'];
    return sourceExtensions.includes(file.extension);
  }

  private isConfigFile(file: FileInfo): boolean {
    return this.configFilePatterns.some(pattern => 
      file.name === pattern || file.name.includes(pattern)
    );
  }

  private isTestFile(file: FileInfo): boolean {
    return file.relativePath.includes('test') || 
           file.relativePath.includes('spec') ||
           file.name.includes('.test.') ||
           file.name.includes('.spec.');
  }

  private calculateLanguageStats(files: FileInfo[]): LanguageStats {
    const stats: LanguageStats = {};
    
    for (const file of files) {
      if (file.isDirectory) continue;
      
      const language = this.getLanguageFromExtension(file.extension);
      if (language) {
        if (!stats[language]) {
          stats[language] = { fileCount: 0, lineCount: 0, fileSize: 0 };
        }
        stats[language].fileCount++;
        stats[language].fileSize += file.size;
      }
    }
    
    return stats;
  }

  private getLanguageFromExtension(extension: string): string | null {
    for (const [language, extensions] of Object.entries(this.languageExtensions)) {
      if (extensions.includes(extension)) {
        return language;
      }
    }
    return null;
  }

  private determinePrimaryLanguage(stats: LanguageStats): string {
    let maxFiles = 0;
    let primaryLanguage = 'Unknown';
    
    for (const [language, stat] of Object.entries(stats)) {
      if (stat.fileCount > maxFiles) {
        maxFiles = stat.fileCount;
        primaryLanguage = language;
      }
    }
    
    return primaryLanguage;
  }

  private async detectProjectType(rootPath: string, files: FileInfo[]): Promise<string> {
    const packageJsonPath = path.join(rootPath, 'package.json');
    
    try {
      const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(packageJson);
      
      if (pkg.dependencies?.react || pkg.devDependencies?.react) return 'react';
      if (pkg.dependencies?.vue || pkg.devDependencies?.vue) return 'vue';
      if (pkg.dependencies?.angular || pkg.devDependencies?.angular) return 'angular';
      if (pkg.dependencies?.next || pkg.devDependencies?.next) return 'nextjs';
      if (pkg.dependencies?.express || pkg.devDependencies?.express) return 'express';
      
      return 'node';
    } catch {
      // No package.json, check other indicators
      if (files.some(f => f.name === 'requirements.txt')) return 'python';
      if (files.some(f => f.name === 'Cargo.toml')) return 'rust';
      if (files.some(f => f.name === 'go.mod')) return 'go';
      if (files.some(f => f.name === 'pom.xml')) return 'java';
      
      return 'unknown';
    }
  }

  // Placeholder implementations for complex analysis methods
  private async analyzeComponent(file: FileInfo): Promise<ComponentInfo | null> {
    // TODO: Implement AST-based component analysis
    return {
      name: path.basename(file.name, file.extension),
      path: file.relativePath,
      type: this.inferComponentType(file),
      description: `${this.inferComponentType(file)} component`,
      complexity: Math.floor(Math.random() * 5) + 1, // Placeholder
      dependencies: [],
      dependents: [],
      lineCount: Math.floor(file.size / 50) // Rough estimate
    };
  }

  private inferComponentType(file: FileInfo): ComponentInfo['type'] {
    if (this.isTestFile(file)) return 'test';
    if (this.isConfigFile(file)) return 'config';
    if (file.relativePath.includes('util')) return 'utility';
    if (file.extension === '.tsx' || file.extension === '.jsx') return 'function';
    return 'module';
  }

  private async extractDependencies(_file: FileInfo): Promise<Array<{target: string, type: any, strength: number}>> {
    // TODO: Implement AST-based dependency extraction
    return [];
  }

  private detectCircularDependencies(_nodes: DependencyNode[], _edges: DependencyEdge[]): string[][] {
    // TODO: Implement cycle detection algorithm
    return [];
  }

  private findCriticalPath(_nodes: DependencyNode[], _edges: DependencyEdge[]): string[] {
    // TODO: Implement critical path analysis
    return [];
  }

  private async analyzeFileComplexity(_file: FileInfo): Promise<{cyclomatic: number, cognitive: number, maintainability: number}> {
    // TODO: Implement complexity analysis
    return {
      cyclomatic: Math.floor(Math.random() * 15) + 1,
      cognitive: Math.floor(Math.random() * 20) + 1,
      maintainability: Math.floor(Math.random() * 40) + 60
    };
  }

  private async findEntryPoints(rootPath: string, files: FileInfo[]): Promise<string[]> {
    const entryPoints: string[] = [];
    
    // Common entry point files
    const entryPatterns = ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts'];
    
    for (const pattern of entryPatterns) {
      const found = files.find(f => f.name === pattern && !f.isDirectory);
      if (found) {
        entryPoints.push(found.relativePath);
      }
    }
    
    return entryPoints;
  }

  private findSourceDirectories(files: FileInfo[]): string[] {
    const sourceDirs = new Set<string>();
    const sourcePatterns = ['src', 'lib', 'source'];
    
    for (const file of files) {
      if (file.isDirectory) {
        for (const pattern of sourcePatterns) {
          if (file.name === pattern || file.relativePath.includes(pattern)) {
            sourceDirs.add(file.relativePath);
          }
        }
      }
    }
    
    return Array.from(sourceDirs);
  }

  private findTestDirectories(files: FileInfo[]): string[] {
    const testDirs = new Set<string>();
    const testPatterns = ['test', 'tests', '__tests__', 'spec'];
    
    for (const file of files) {
      if (file.isDirectory) {
        for (const pattern of testPatterns) {
          if (file.name === pattern || file.relativePath.includes(pattern)) {
            testDirs.add(file.relativePath);
          }
        }
      }
    }
    
    return Array.from(testDirs);
  }

  private findBuildDirectories(files: FileInfo[]): string[] {
    const buildDirs = new Set<string>();
    const buildPatterns = ['dist', 'build', 'out', 'target'];
    
    for (const file of files) {
      if (file.isDirectory) {
        for (const pattern of buildPatterns) {
          if (file.name === pattern) {
            buildDirs.add(file.relativePath);
          }
        }
      }
    }
    
    return Array.from(buildDirs);
  }

  private async estimateSourceLines(files: FileInfo[]): Promise<number> {
    // Rough estimation: average 50 characters per line
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return Math.floor(totalSize / 50);
  }

  private isExternalDependency(file: FileInfo): boolean {
    return file.relativePath.includes('node_modules') || 
           file.relativePath.includes('vendor') ||
           file.relativePath.includes('third_party');
  }

  private calculateImportance(file: FileInfo): number {
    // Simple heuristic: larger files and entry points are more important
    let importance = Math.min(5, Math.floor(file.size / 10000) + 1);
    
    if (file.name.includes('index') || file.name.includes('main') || file.name.includes('app')) {
      importance = Math.min(5, importance + 2);
    }
    
    return importance;
  }

  // Incremental indexing methods

  /**
   * Check if we have a valid cache for incremental updates
   */
  private hasValidCache(): boolean {
    return this.indexCache.files.size > 0 && 
           this.indexCache.lastIndexed > 0 &&
           (Date.now() - this.indexCache.lastIndexed) < 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Update cache with new file information
   */
  private updateCache(files: FileInfo[]): void {
    this.indexCache.files.clear();
    for (const file of files) {
      this.indexCache.files.set(file.relativePath, file);
    }
    this.indexCache.lastIndexed = Date.now();
  }

  /**
   * Detect changes since last indexing
   */
  private async detectChanges(rootPath: string, options: ExplorationOptions): Promise<{
    changedFiles: FileInfo[];
    addedFiles: FileInfo[];
    removedFiles: string[];
  }> {
    const currentFiles = await this.scanDirectory(rootPath, options);
    const cachedFiles = this.indexCache.files;
    
    const changedFiles: FileInfo[] = [];
    const addedFiles: FileInfo[] = [];
    const removedFiles: string[] = [];

    // Check for new and changed files
    for (const file of currentFiles) {
      const cached = cachedFiles.get(file.relativePath);
      
      if (!cached) {
        addedFiles.push(file);
      } else if (this.hasFileChanged(file, cached)) {
        changedFiles.push(file);
      }
    }

    // Check for removed files
    for (const [relativePath] of cachedFiles) {
      if (!currentFiles.some(f => f.relativePath === relativePath)) {
        removedFiles.push(relativePath);
      }
    }

    console.log(`[CodebaseExplorer] Change detection: ${addedFiles.length} added, ${changedFiles.length} changed, ${removedFiles.length} removed`);

    return {
      changedFiles: [...changedFiles, ...addedFiles],
      addedFiles,
      removedFiles
    };
  }

  /**
   * Check if a file has changed since last indexing
   */
  private hasFileChanged(current: FileInfo, cached: FileInfo): boolean {
    if (current.size !== cached.size) return true;
    if (current.lastModified !== cached.lastModified) return true;
    if (current.checksum && cached.checksum && current.checksum !== cached.checksum) return true;
    return false;
  }

  /**
   * Update cache with detected changes
   */
  private updateCacheWithChanges(changes: {
    changedFiles: FileInfo[];
    addedFiles: FileInfo[];
    removedFiles: string[];
  }): void {
    // Add new and changed files to cache
    for (const file of changes.changedFiles) {
      this.indexCache.files.set(file.relativePath, file);
    }

    // Remove deleted files from cache
    for (const relativePath of changes.removedFiles) {
      this.indexCache.files.delete(relativePath);
    }

    this.indexCache.lastIndexed = Date.now();

    // Clear cached exploration data if we have significant changes
    if (changes.changedFiles.length > 0 || changes.removedFiles.length > 0) {
      this.indexCache.explorationData = undefined;
    }
  }

  /**
   * Calculate SHA-256 checksum for a file
   */
  private async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  /**
   * Clear the index cache
   */
  clearCache(): void {
    this.indexCache = {
      files: new Map(),
      lastIndexed: 0,
      explorationData: undefined
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    filesIndexed: number;
    lastIndexed: Date | null;
    hasExplorationData: boolean;
  } {
    return {
      filesIndexed: this.indexCache.files.size,
      lastIndexed: this.indexCache.lastIndexed > 0 ? new Date(this.indexCache.lastIndexed) : null,
      hasExplorationData: !!this.indexCache.explorationData
    };
  }
}