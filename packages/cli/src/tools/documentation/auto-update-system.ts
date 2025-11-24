import * as ops from 'fs-extra';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface AutoUpdateConfig {
  enabled: boolean;
  triggers: {
    keyFiles: boolean;
    tokenThreshold: number;
    sessionEnd: boolean;
    gitCommits: boolean;
  };
  keyFiles: string[];
  reminderStyle: 'gentle' | 'persistent' | 'off';
  autoPrompt: boolean;
  updateFrequency: 'manual' | 'smart' | 'aggressive';
}

export interface AutoUpdateTrigger {
  type: 'keyFiles' | 'tokenThreshold' | 'sessionEnd' | 'gitCommits';
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionSuggested: string;
}

export class AutoUpdateSystem {
  private config: AutoUpdateConfig;
  private rootPath: string;
  private tokenCount: number = 0;
  private lastUpdateTime: number = Date.now();

  constructor(rootPath: string, config?: Partial<AutoUpdateConfig>) {
    this.rootPath = rootPath;
    this.config = {
      enabled: true,
      triggers: {
        keyFiles: true,
        tokenThreshold: 1000,
        sessionEnd: true,
        gitCommits: true
      },
      keyFiles: [
        'package.json',
        'tsconfig.json',
        'src/**/*.ts',
        'README.md',
        '*.config.*',
        '.grok/**'
      ],
      reminderStyle: 'gentle',
      autoPrompt: true,
      updateFrequency: 'smart',
      ...config
    };
  }

  async loadConfigFromSettings(): Promise<void> {
    try {
      const settingsPath = path.join(this.rootPath, '.grok', 'settings.json');
      if (existsSync(settingsPath)) {
        const settings = JSON.parse(await ops.promises.readFile(settingsPath, 'utf-8'));
        if (settings.documentation?.autoUpdate) {
          this.config = { ...this.config, ...settings.documentation.autoUpdate };
        }
      }
    } catch (error) {
      // Use default config
    }
  }

  async saveConfigToSettings(): Promise<void> {
    try {
      const settingsPath = path.join(this.rootPath, '.grok', 'settings.json');
      let settings = {};
      
      if (existsSync(settingsPath)) {
        settings = JSON.parse(await ops.promises.readFile(settingsPath, 'utf-8'));
      }

      const updatedSettings = {
        ...settings,
        documentation: {
          ...((settings as any).documentation || {}),
          autoUpdate: this.config
        }
      };

      // Ensure .grok directory exists
      const xcliDir = path.join(this.rootPath, '.grok');
      if (!existsSync(xcliDir)) {
        await ops.mkdir(xcliDir, { recursive: true });
      }

      await ops.promises.writeFile(settingsPath, JSON.stringify(updatedSettings, null, 2));
    } catch (error) {
      // Fail silently for now
    }
  }

  updateTokenCount(count: number): void {
    this.tokenCount = count;
  }

  async checkTriggers(): Promise<AutoUpdateTrigger[]> {
    if (!this.config.enabled) {
      return [];
    }

    const triggers: AutoUpdateTrigger[] = [];

    // Check key file changes
    if (this.config.triggers.keyFiles) {
      const keyFileChanges = await this.checkKeyFileChanges();
      if (keyFileChanges) {
        triggers.push({
          type: 'keyFiles',
          message: '💡 Key files have been modified. Consider updating documentation?',
          priority: 'medium',
          actionSuggested: '/update-agent-docs'
        });
      }
    }

    // Check token threshold
    if (this.config.triggers.tokenThreshold && this.tokenCount >= this.config.triggers.tokenThreshold) {
      triggers.push({
        type: 'tokenThreshold',
        message: `🔢 Token threshold reached (${this.tokenCount}/${this.config.triggers.tokenThreshold}). Consider updating docs?`,
        priority: 'low',
        actionSuggested: '/update-agent-docs'
      });
    }

    // Check git commits
    if (this.config.triggers.gitCommits) {
      const recentCommits = await this.checkRecentCommits();
      if (recentCommits) {
        triggers.push({
          type: 'gitCommits',
          message: '📝 Recent commits detected. Update documentation to stay current?',
          priority: 'medium',
          actionSuggested: '/update-agent-docs'
        });
      }
    }

    return this.filterTriggersByFrequency(triggers);
  }

  private async checkKeyFileChanges(): Promise<boolean> {
    try {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      for (const pattern of this.config.keyFiles) {
        const files = await this.expandGlobPattern(pattern);
        
        for (const file of files) {
          const fullPath = path.join(this.rootPath, file);
          if (existsSync(fullPath)) {
            const stats = await ops.promises.stat(fullPath);
            if (stats.mtime.getTime() > fiveMinutesAgo && stats.mtime.getTime() > this.lastUpdateTime) {
              return true;
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  private async expandGlobPattern(pattern: string): Promise<string[]> {
    // Simple glob expansion - could be enhanced with a proper glob library
    if (pattern.includes('**')) {
      return await this.findFilesRecursively(pattern);
    } else if (pattern.includes('*')) {
      return await this.findFilesWithWildcard(pattern);
    } else {
      return [pattern];
    }
  }

  private async findFilesRecursively(pattern: string): Promise<string[]> {
    const files: string[] = [];
    const basePath = pattern.split('**')[0];
    const extension = pattern.includes('.') ? pattern.split('.').pop() : '';

    const scanDir = async (dirPath: string): Promise<void> => {
      try {
        const entries = await ops.promises.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativePath = path.relative(this.rootPath, fullPath);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDir(fullPath);
          } else if (entry.isFile() && (!extension || entry.name.endsWith(`.${extension}`))) {
            files.push(relativePath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    const searchPath = path.join(this.rootPath, basePath);
    if (existsSync(searchPath)) {
      await scanDir(searchPath);
    }

    return files;
  }

  private async findFilesWithWildcard(pattern: string): Promise<string[]> {
    // Simple wildcard matching - just check if file exists for exact patterns
    if (existsSync(path.join(this.rootPath, pattern.replace('*', '')))) {
      return [pattern.replace('*', '')];
    }
    return [];
  }

  private async checkRecentCommits(): Promise<boolean> {
    try {
      const { execSync } = require('child_process');
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const commits = execSync(`git log --since="${oneHourAgo}" --oneline`, {
        cwd: this.rootPath,
        encoding: 'utf-8'
      });

      return commits.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  private filterTriggersByFrequency(triggers: AutoUpdateTrigger[]): AutoUpdateTrigger[] {
    switch (this.config.updateFrequency) {
      case 'manual':
        return []; // No automatic triggers
      case 'aggressive':
        return triggers; // All triggers
      case 'smart':
      default:
        // Filter to only medium/high priority or if multiple low priority
        const highPriority = triggers.filter(t => t.priority === 'high' || t.priority === 'medium');
        const lowPriority = triggers.filter(t => t.priority === 'low');
        
        if (highPriority.length > 0) {
          return highPriority;
        } else if (lowPriority.length >= 2) {
          return [lowPriority[0]]; // Show one low priority if multiple
        }
        return [];
    }
  }

  formatTriggerMessage(trigger: AutoUpdateTrigger): string {
    switch (this.config.reminderStyle) {
      case 'persistent':
        return `🔔 **${trigger.message}**\n\n💡 Run: \`${trigger.actionSuggested}\``;
      case 'gentle':
        return `${trigger.message}\n\n*Suggestion: \`${trigger.actionSuggested}\`*`;
      case 'off':
      default:
        return '';
    }
  }

  async markUpdateCompleted(): Promise<void> {
    this.lastUpdateTime = Date.now();
    this.tokenCount = 0; // Reset token count after update
  }

  // Configuration methods
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  setTrigger(trigger: keyof AutoUpdateConfig['triggers'], enabled: boolean | number): void {
    if (trigger === 'tokenThreshold' && typeof enabled === 'number') {
      this.config.triggers[trigger] = enabled;
    } else if (typeof enabled === 'boolean') {
      (this.config.triggers as any)[trigger] = enabled;
    }
  }

  setTokenThreshold(threshold: number): void {
    this.config.triggers.tokenThreshold = threshold;
  }

  setReminderStyle(style: AutoUpdateConfig['reminderStyle']): void {
    this.config.reminderStyle = style;
  }

  setUpdateFrequency(frequency: AutoUpdateConfig['updateFrequency']): void {
    this.config.updateFrequency = frequency;
  }

  addKeyFile(pattern: string): void {
    if (!this.config.keyFiles.includes(pattern)) {
      this.config.keyFiles.push(pattern);
    }
  }

  removeKeyFile(pattern: string): void {
    this.config.keyFiles = this.config.keyFiles.filter(f => f !== pattern);
  }

  getConfig(): AutoUpdateConfig {
    return { ...this.config };
  }

  getConfigSummary(): string {
    return `📊 **Auto-Update Configuration:**

**Status:** ${this.config.enabled ? '✅ Enabled' : '❌ Disabled'}
**Style:** ${this.config.reminderStyle}
**Frequency:** ${this.config.updateFrequency}

**Triggers:**
- Key files: ${this.config.triggers.keyFiles ? '✅' : '❌'}
- Token threshold: ${this.config.triggers.tokenThreshold} tokens
- Session end: ${this.config.triggers.sessionEnd ? '✅' : '❌'}
- Git commits: ${this.config.triggers.gitCommits ? '✅' : '❌'}

**Monitored files:** ${this.config.keyFiles.length} patterns`;
  }
}