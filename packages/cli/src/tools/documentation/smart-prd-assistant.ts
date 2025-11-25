import * as ops from 'fs-extra';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface PRDAnalysis {
  fileName: string;
  title: string;
  content: string;
  suggestions: PRDSuggestion[];
  conflicts: string[];
  similarTasks: string[];
  missingContext: string[];
  architectureImpact: string[];
}

export interface PRDSuggestion {
  type: 'context' | 'pattern' | 'dependency' | 'conflict' | 'architecture';
  priority: 'low' | 'medium' | 'high';
  message: string;
  reference?: string;
}

export interface ProjectContext {
  architecture: string[];
  patterns: string[];
  dependencies: string[];
  existingTasks: string[];
  systemConstraints: string[];
}

export class SmartPRDAssistant {
  private rootPath: string;
  private agentPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.agentPath = path.join(rootPath, '.agent');
  }

  async analyzePRD(prdPath: string): Promise<PRDAnalysis> {
    const fileName = path.basename(prdPath);
    const content = await ops.promises.readFile(prdPath, 'utf-8');
    const title = this.extractTitle(content);

    // Load project context
    const context = await this.loadProjectContext();

    // Analyze the PRD
    const analysis: PRDAnalysis = {
      fileName,
      title,
      content,
      suggestions: [],
      conflicts: [],
      similarTasks: [],
      missingContext: [],
      architectureImpact: []
    };

    // Generate suggestions
    analysis.suggestions = await this.generateSuggestions(content, context);
    analysis.conflicts = await this.detectConflicts(content, context);
    analysis.similarTasks = await this.findSimilarTasks(content, context);
    analysis.missingContext = this.detectMissingContext(content, context);
    analysis.architectureImpact = this.analyzeArchitectureImpact(content, context);

    return analysis;
  }

  async monitorTasksFolder(): Promise<{ newPRDs: string[]; analysisResults: PRDAnalysis[] }> {
    const tasksPath = path.join(this.agentPath, 'tasks');
    if (!existsSync(tasksPath)) {
      return { newPRDs: [], analysisResults: [] };
    }

    try {
      const files = await ops.promises.readdir(tasksPath);
      const prdFiles = files.filter(file => file.endsWith('.md') && !file.startsWith('example-'));
      
      const newPRDs: string[] = [];
      const analysisResults: PRDAnalysis[] = [];

      for (const file of prdFiles) {
        const filePath = path.join(tasksPath, file);
        const stats = await ops.promises.stat(filePath);
        
        // Check if file was created/modified in the last 10 minutes
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        if (stats.mtime.getTime() > tenMinutesAgo) {
          newPRDs.push(file);
          const analysis = await this.analyzePRD(filePath);
          analysisResults.push(analysis);
        }
      }

      return { newPRDs, analysisResults };
    } catch (error) {
      return { newPRDs: [], analysisResults: [] };
    }
  }

  private async loadProjectContext(): Promise<ProjectContext> {
    const context: ProjectContext = {
      architecture: [],
      patterns: [],
      dependencies: [],
      existingTasks: [],
      systemConstraints: []
    };

    try {
      // Load architecture info
      const archPath = path.join(this.agentPath, 'system', 'architecture.md');
      if (existsSync(archPath)) {
        const archContent = await ops.promises.readFile(archPath, 'utf-8');
        context.architecture = this.extractKeyPoints(archContent);
      }

      // Load critical state
      const statePath = path.join(this.agentPath, 'system', 'critical-state.md');
      if (existsSync(statePath)) {
        const stateContent = await ops.promises.readFile(statePath, 'utf-8');
        context.systemConstraints = this.extractKeyPoints(stateContent);
      }

      // Load existing SOPs for patterns
      const sopPath = path.join(this.agentPath, 'sop');
      if (existsSync(sopPath)) {
        const sopFiles = await ops.promises.readdir(sopPath);
        for (const file of sopFiles) {
          if (file.endsWith('.md')) {
            const sopContent = await ops.promises.readFile(path.join(sopPath, file), 'utf-8');
            context.patterns.push(...this.extractKeyPoints(sopContent));
          }
        }
      }

      // Load existing tasks
      const tasksPath = path.join(this.agentPath, 'tasks');
      if (existsSync(tasksPath)) {
        const taskFiles = await ops.promises.readdir(tasksPath);
        for (const file of taskFiles) {
          if (file.endsWith('.md') && !file.startsWith('example-')) {
            context.existingTasks.push(file);
          }
        }
      }

      // Load dependencies from package.json
      const packagePath = path.join(this.rootPath, 'package.json');
      if (existsSync(packagePath)) {
        const packageContent = await ops.promises.readFile(packagePath, 'utf-8');
        const packageData = JSON.parse(packageContent);
        context.dependencies = [
          ...Object.keys(packageData.dependencies || {}),
          ...Object.keys(packageData.devDependencies || {})
        ];
      }

    } catch (error) {
      // Continue with empty context if loading fails
    }

    return context;
  }

  private extractTitle(content: string): string {
    const titleMatch = content.match(/^#\s*(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : 'Untitled PRD';
  }

  private extractKeyPoints(content: string): string[] {
    const lines = content.split('\n');
    const keyPoints: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Extract bullet points, headings, and important statements
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || 
          trimmed.startsWith('#') || trimmed.includes('**')) {
        keyPoints.push(trimmed.replace(/[#*-]/g, '').trim());
      }
    }

    return keyPoints.filter(point => point.length > 10); // Filter out short points
  }

  private async generateSuggestions(content: string, context: ProjectContext): Promise<PRDSuggestion[]> {
    const suggestions: PRDSuggestion[] = [];

    // Check for missing architecture context
    if (context.architecture.length > 0) {
      const hasArchContext = context.architecture.some(arch => 
        content.toLowerCase().includes(arch.toLowerCase())
      );
      if (!hasArchContext) {
        suggestions.push({
          type: 'context',
          priority: 'medium',
          message: 'Consider referencing existing architecture patterns',
          reference: '.agent/system/architecture.md'
        });
      }
    }

    // Check for established patterns
    if (context.patterns.length > 0) {
      const hasPatterns = context.patterns.some(pattern =>
        content.toLowerCase().includes(pattern.toLowerCase())
      );
      if (!hasPatterns) {
        suggestions.push({
          type: 'pattern',
          priority: 'low',
          message: 'Review existing SOPs for established patterns',
          reference: '.agent/sop/'
        });
      }
    }

    // Check for dependency conflicts
    const mentionedDeps = context.dependencies.filter(dep =>
      content.toLowerCase().includes(dep.toLowerCase())
    );
    if (mentionedDeps.length > 0) {
      suggestions.push({
        type: 'dependency',
        priority: 'medium',
        message: `References existing dependencies: ${mentionedDeps.slice(0, 3).join(', ')}`,
        reference: 'package.json'
      });
    }

    // Check for system constraints
    const constraintConflicts = context.systemConstraints.filter(constraint =>
      this.hasConflict(content, constraint)
    );
    if (constraintConflicts.length > 0) {
      suggestions.push({
        type: 'conflict',
        priority: 'high',
        message: 'Potential conflicts with system constraints detected',
        reference: '.agent/system/critical-state.md'
      });
    }

    return suggestions;
  }

  private async detectConflicts(content: string, context: ProjectContext): Promise<string[]> {
    const conflicts: string[] = [];

    // Check against system constraints
    for (const constraint of context.systemConstraints) {
      if (this.hasConflict(content, constraint)) {
        conflicts.push(`Conflicts with: ${constraint}`);
      }
    }

    return conflicts;
  }

  private async findSimilarTasks(content: string, context: ProjectContext): Promise<string[]> {
    const similar: string[] = [];
    const contentWords = this.extractKeywords(content);

    // Load and analyze existing tasks
    const tasksPath = path.join(this.agentPath, 'tasks');
    if (existsSync(tasksPath)) {
      for (const taskFile of context.existingTasks) {
        try {
          const taskPath = path.join(tasksPath, taskFile);
          const taskContent = await ops.promises.readFile(taskPath, 'utf-8');
          const taskWords = this.extractKeywords(taskContent);
          
          const similarity = this.calculateSimilarity(contentWords, taskWords);
          if (similarity > 0.3) { // 30% similarity threshold
            similar.push(`${taskFile} (${Math.round(similarity * 100)}% similar)`);
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
    }

    return similar;
  }

  private detectMissingContext(content: string, context: ProjectContext): string[] {
    const missing: string[] = [];

    // Check for common PRD sections
    const requiredSections = [
      'objective', 'requirements', 'technical approach', 'success criteria'
    ];

    for (const section of requiredSections) {
      if (!content.toLowerCase().includes(section)) {
        missing.push(`Missing section: ${section}`);
      }
    }

    // Check for architecture considerations
    if (!content.toLowerCase().includes('architecture') && !content.toLowerCase().includes('component')) {
      missing.push('No architecture impact discussed');
    }

    // Check for dependency analysis
    if (!content.toLowerCase().includes('depend') && !content.toLowerCase().includes('integrat')) {
      missing.push('Dependencies not analyzed');
    }

    return missing;
  }

  private analyzeArchitectureImpact(content: string, context: ProjectContext): string[] {
    const impacts: string[] = [];

    // Detect potential architecture changes
    const architectureKeywords = [
      'new component', 'new service', 'new tool', 'new command',
      'refactor', 'restructure', 'migrate', 'breaking change'
    ];

    for (const keyword of architectureKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        impacts.push(`May require: ${keyword}`);
      }
    }

    // Check against current architecture
    if (context.architecture.some(arch => content.toLowerCase().includes(arch.toLowerCase()))) {
      impacts.push('Affects existing architecture components');
    }

    return impacts;
  }

  private hasConflict(content: string, constraint: string): boolean {
    // Simple conflict detection - could be enhanced with NLP
    const conflictKeywords = ['replace', 'remove', 'delete', 'deprecated', 'breaking'];
    const contentLower = content.toLowerCase();
    const constraintLower = constraint.toLowerCase();

    return conflictKeywords.some(keyword => 
      contentLower.includes(keyword) && contentLower.includes(constraintLower)
    );
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    // Remove common words
    const commonWords = ['this', 'that', 'will', 'should', 'could', 'would', 'need', 'want'];
    return words.filter(word => !commonWords.includes(word));
  }

  private calculateSimilarity(words1: string[], words2: string[]): number {
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  generateAnalysisReport(analysis: PRDAnalysis): string {
    let report = `📋 **PRD Analysis: ${analysis.title}**\n\n`;

    if (analysis.suggestions.length > 0) {
      report += `💡 **Suggestions:**\n`;
      analysis.suggestions.forEach(suggestion => {
        const priority = suggestion.priority === 'high' ? '🔴' : 
                        suggestion.priority === 'medium' ? '🟡' : '🟢';
        report += `${priority} ${suggestion.message}`;
        if (suggestion.reference) {
          report += ` (see: ${suggestion.reference})`;
        }
        report += '\n';
      });
      report += '\n';
    }

    if (analysis.conflicts.length > 0) {
      report += `⚠️ **Potential Conflicts:**\n`;
      analysis.conflicts.forEach(conflict => {
        report += `- ${conflict}\n`;
      });
      report += '\n';
    }

    if (analysis.similarTasks.length > 0) {
      report += `🔗 **Similar Tasks:**\n`;
      analysis.similarTasks.forEach(task => {
        report += `- ${task}\n`;
      });
      report += '\n';
    }

    if (analysis.architectureImpact.length > 0) {
      report += `🏗️ **Architecture Impact:**\n`;
      analysis.architectureImpact.forEach(impact => {
        report += `- ${impact}\n`;
      });
      report += '\n';
    }

    if (analysis.missingContext.length > 0) {
      report += `📝 **Consider Adding:**\n`;
      analysis.missingContext.forEach(missing => {
        report += `- ${missing}\n`;
      });
    }

    return report;
  }
}