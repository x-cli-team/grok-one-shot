import * as ops from 'fs-extra';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface UpdateConfig {
  rootPath: string;
  updateTarget: 'all' | 'system' | 'tasks' | 'sop';
  autoCommit: boolean;
}

export interface ChangeAnalysis {
  filesChanged: string[];
  newFiles: string[];
  deletedFiles: string[];
  gitCommits: string[];
  architectureChanges: boolean;
  configChanges: boolean;
  hasNewFeatures: boolean;
}

export interface UpdateResult {
  success: boolean;
  message: string;
  updatedFiles: string[];
  suggestions: string[];
}

export class UpdateAgentDocs {
  private config: UpdateConfig;

  constructor(config: UpdateConfig) {
    this.config = config;
  }

  async updateDocs(): Promise<UpdateResult> {
    try {
      // Check if .agent system exists
      const agentPath = path.join(this.config.rootPath, '.agent');
      if (!existsSync(agentPath)) {
        return {
          success: false,
          message: '❌ .agent documentation system not found. Run `/init-agent` first.',
          updatedFiles: [],
          suggestions: ['Run `/init-agent` to initialize the documentation system']
        };
      }

      // Analyze recent changes
      const analysis = await this.analyzeChanges();
      
      if (analysis.filesChanged.length === 0 && analysis.gitCommits.length === 0) {
        return {
          success: true,
          message: '✅ No significant changes detected. Documentation is up to date.',
          updatedFiles: [],
          suggestions: []
        };
      }

      // Update documentation based on analysis
      const updatedFiles: string[] = [];
      const suggestions: string[] = [];

      // Update system documentation if needed
      if (this.shouldUpdate('system') && (analysis.architectureChanges || analysis.configChanges)) {
        const systemUpdates = await this.updateSystemDocs(analysis);
        updatedFiles.push(...systemUpdates);
      }

      // Update critical state
      const criticalStateUpdate = await this.updateCriticalState(analysis);
      if (criticalStateUpdate) {
        updatedFiles.push('.agent/system/critical-state.md');
      }

      // Generate suggestions for manual updates
      suggestions.push(...this.generateSuggestions(analysis));

      const message = this.generateUpdateMessage(analysis, updatedFiles);

      return {
        success: true,
        message,
        updatedFiles,
        suggestions
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to update agent docs: ${error.message}`,
        updatedFiles: [],
        suggestions: []
      };
    }
  }

  private async analyzeChanges(): Promise<ChangeAnalysis> {
    const analysis: ChangeAnalysis = {
      filesChanged: [],
      newFiles: [],
      deletedFiles: [],
      gitCommits: [],
      architectureChanges: false,
      configChanges: false,
      hasNewFeatures: false
    };

    try {
      // Get git changes since last update
      const { execSync } = require('child_process');
      
      // Get recent commits (last 10)
      try {
        const commits = execSync('git log --oneline -10', { 
          cwd: this.config.rootPath, 
          encoding: 'utf-8' 
        });
        analysis.gitCommits = commits.trim().split('\n').filter(Boolean);
      } catch (error) {
        // Not a git repo or no commits
      }

      // Get changed files since last commit
      try {
        const changedFiles = execSync('git diff --name-only HEAD~5..HEAD', {
          cwd: this.config.rootPath,
          encoding: 'utf-8'
        });
        analysis.filesChanged = changedFiles.trim().split('\n').filter(Boolean);
      } catch (error) {
        // Use file system timestamps as fallback
        analysis.filesChanged = await this.getRecentlyModifiedFiles();
      }

      // Analyze types of changes
      analysis.architectureChanges = this.detectArchitectureChanges(analysis.filesChanged);
      analysis.configChanges = this.detectConfigChanges(analysis.filesChanged);
      analysis.hasNewFeatures = this.detectNewFeatures(analysis.gitCommits);

      return analysis;
    } catch (error) {
      return analysis;
    }
  }

  private async getRecentlyModifiedFiles(): Promise<string[]> {
    // Fallback: get files modified in last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentFiles: string[] = [];

    const scanDir = async (dirPath: string): Promise<void> => {
      try {
        const entries = await ops.promises.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDir(fullPath);
          } else if (entry.isFile()) {
            const stats = await ops.promises.stat(fullPath);
            if (stats.mtime.getTime() > oneDayAgo) {
              recentFiles.push(path.relative(this.config.rootPath, fullPath));
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await scanDir(this.config.rootPath);
    return recentFiles;
  }

  private detectArchitectureChanges(filesChanged: string[]): boolean {
    const architectureIndicators = [
      'src/tools/', 'src/commands/', 'src/ui/', 'src/agent/',
      'package.json', 'tsconfig.json', 'src/index.ts'
    ];
    
    return filesChanged.some(file => 
      architectureIndicators.some(indicator => file.includes(indicator))
    );
  }

  private detectConfigChanges(filesChanged: string[]): boolean {
    const configFiles = [
      'package.json', 'tsconfig.json', '.grok/', 'CLAUDE.md',
      '.env', '.gitignore', 'README.md'
    ];
    
    return filesChanged.some(file =>
      configFiles.some(config => file.includes(config))
    );
  }

  private detectNewFeatures(commits: string[]): boolean {
    const featureKeywords = ['feat:', 'add:', 'new:', 'feature:', 'implement:'];
    return commits.some(commit =>
      featureKeywords.some(keyword => commit.toLowerCase().includes(keyword))
    );
  }

  private shouldUpdate(target: string): boolean {
    return this.config.updateTarget === 'all' || this.config.updateTarget === target;
  }

  private async updateSystemDocs(analysis: ChangeAnalysis): Promise<string[]> {
    const updatedFiles: string[] = [];
    const systemPath = path.join(this.config.rootPath, '.agent', 'system');

    // Update architecture.md if architecture changed
    if (analysis.architectureChanges) {
      try {
        const archPath = path.join(systemPath, 'architecture.md');
        if (existsSync(archPath)) {
          const content = await ops.promises.readFile(archPath, 'utf-8');
          const updatedContent = await this.updateArchitectureDoc(content, analysis);
          await ops.promises.writeFile(archPath, updatedContent);
          updatedFiles.push('.agent/system/architecture.md');
        }
      } catch (error) {
        // Continue with other updates
      }
    }

    return updatedFiles;
  }

  private async updateCriticalState(analysis: ChangeAnalysis): Promise<boolean> {
    try {
      const criticalStatePath = path.join(this.config.rootPath, '.agent', 'system', 'critical-state.md');
      
      if (!existsSync(criticalStatePath)) {
        return false;
      }

      const content = await ops.promises.readFile(criticalStatePath, 'utf-8');
      
      // Update timestamp and recent changes
      const timestamp = new Date().toISOString();
      const changesSummary = this.generateChangesSummary(analysis);
      
      let updatedContent = content.replace(
        /Last Updated: .*/,
        `Last Updated: ${timestamp}`
      );

      // Add recent changes section if significant changes detected
      if (analysis.filesChanged.length > 0) {
        const recentChangesSection = `

## Recent Changes
${changesSummary}`;

        if (content.includes('## Recent Changes')) {
          updatedContent = updatedContent.replace(
            /## Recent Changes[\s\S]*?(?=##|$)/,
            recentChangesSection
          );
        } else {
          updatedContent = updatedContent.replace(
            /Last Updated: .*/,
            `Last Updated: ${timestamp}\nUpdated By: /update-agent-docs after detecting changes${recentChangesSection}`
          );
        }
      }

      await ops.promises.writeFile(criticalStatePath, updatedContent);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async updateArchitectureDoc(content: string, analysis: ChangeAnalysis): Promise<string> {
    // Simple update - add timestamp and recent changes note
    const timestamp = new Date().toISOString().split('T')[0];
    
    return content.replace(
      /\*Updated: .*/,
      `*Updated: ${timestamp} - Recent changes detected in: ${analysis.filesChanged.slice(0, 3).join(', ')}${analysis.filesChanged.length > 3 ? '...' : ''}*`
    );
  }

  private generateChangesSummary(analysis: ChangeAnalysis): string {
    const lines: string[] = [];
    
    if (analysis.gitCommits.length > 0) {
      lines.push(`**Recent Commits (${analysis.gitCommits.length}):**`);
      analysis.gitCommits.slice(0, 5).forEach(commit => {
        lines.push(`- ${commit}`);
      });
      if (analysis.gitCommits.length > 5) {
        lines.push(`- ... and ${analysis.gitCommits.length - 5} more`);
      }
    }

    if (analysis.filesChanged.length > 0) {
      lines.push(`\n**Files Modified (${analysis.filesChanged.length}):**`);
      analysis.filesChanged.slice(0, 10).forEach(file => {
        lines.push(`- ${file}`);
      });
      if (analysis.filesChanged.length > 10) {
        lines.push(`- ... and ${analysis.filesChanged.length - 10} more files`);
      }
    }

    if (analysis.architectureChanges) {
      lines.push('\n**⚠️ Architecture changes detected**');
    }
    
    if (analysis.configChanges) {
      lines.push('**⚙️ Configuration changes detected**');
    }

    return lines.join('\n');
  }

  private generateSuggestions(analysis: ChangeAnalysis): string[] {
    const suggestions: string[] = [];

    if (analysis.hasNewFeatures) {
      suggestions.push('📝 Consider adding new features to .agent/tasks/ as PRDs');
      suggestions.push('📖 Update README.md with new feature documentation');
    }

    if (analysis.architectureChanges) {
      suggestions.push('🏗️ Review and update .agent/system/architecture.md manually');
      suggestions.push('📋 Update API documentation if interfaces changed');
    }

    if (analysis.configChanges) {
      suggestions.push('⚙️ Review configuration changes in .agent/system/');
    }

    if (analysis.filesChanged.length > 20) {
      suggestions.push('🧹 Consider running /compact to optimize conversation history');
    }

    return suggestions;
  }

  private generateUpdateMessage(analysis: ChangeAnalysis, updatedFiles: string[]): string {
    let message = `✅ **Agent Documentation Updated**\n\n`;

    message += `📊 **Change Analysis:**\n`;
    message += `- Files changed: ${analysis.filesChanged.length}\n`;
    message += `- Recent commits: ${analysis.gitCommits.length}\n`;
    message += `- Architecture changes: ${analysis.architectureChanges ? '✅' : '❌'}\n`;
    message += `- Config changes: ${analysis.configChanges ? '✅' : '❌'}\n\n`;

    if (updatedFiles.length > 0) {
      message += `📝 **Updated Files:**\n`;
      updatedFiles.forEach(file => {
        message += `- ${file}\n`;
      });
      message += '\n';
    }

    return message;
  }
}