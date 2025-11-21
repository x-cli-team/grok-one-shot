import * as ops from 'fs-extra';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface ChangelogConfig {
  rootPath: string;
  sinceVersion?: string;
  commitCount?: number;
  format: 'conventional' | 'simple';
  includeBreaking: boolean;
}

export interface CommitInfo {
  hash: string;
  date: string;
  author: string;
  message: string;
  type?: string;
  scope?: string;
  breaking: boolean;
  body?: string;
}

export interface ChangelogSection {
  title: string;
  commits: CommitInfo[];
}

export class ChangelogGenerator {
  private config: ChangelogConfig;

  constructor(config: ChangelogConfig) {
    this.config = config;
  }

  async generateChangelog(): Promise<{ success: boolean; message: string; content?: string }> {
    try {
      // Check if we're in a git repository
      const gitPath = path.join(this.config.rootPath, '.git');
      if (!existsSync(gitPath)) {
        return {
          success: false,
          message: 'Not a git repository. Changelog generation requires git history.'
        };
      }

      // Get git commits
      const commits = await this.getGitCommits();
      
      if (commits.length === 0) {
        return {
          success: false,
          message: 'No git commits found.'
        };
      }

      // Parse commits and organize by type
      const sections = this.organizeCommits(commits);
      
      // Generate changelog content
      const content = this.generateChangelogContent(sections);
      
      // Write to CHANGELOG.md
      const changelogPath = path.join(this.config.rootPath, 'CHANGELOG.md');
      const exists = existsSync(changelogPath);
      
      if (exists) {
        // Prepend to existing changelog
        const existingContent = await ops.promises.readFile(changelogPath, 'utf-8');
        const newContent = content + '\n\n' + existingContent;
        await ops.promises.writeFile(changelogPath, newContent);
      } else {
        // Create new changelog
        const fullContent = this.generateChangelogHeader() + content;
        await ops.promises.writeFile(changelogPath, fullContent);
      }

      return {
        success: true,
        message: exists 
          ? `✅ Updated CHANGELOG.md with ${commits.length} new entries`
          : `✅ Created CHANGELOG.md with ${commits.length} entries`,
        content
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to generate changelog: ${error.message}`
      };
    }
  }

  private async getGitCommits(): Promise<CommitInfo[]> {
    const { execSync } = require('child_process');
    
    try {
      let gitCommand = 'git log --pretty=format:"%H|%ad|%an|%s|%b" --date=short';
      
      if (this.config.sinceVersion) {
        gitCommand += ` ${this.config.sinceVersion}..HEAD`;
      } else if (this.config.commitCount) {
        gitCommand += ` -n ${this.config.commitCount}`;
      } else {
        gitCommand += ' -n 50'; // Default to last 50 commits
      }

      const output = execSync(gitCommand, { 
        cwd: this.config.rootPath,
        encoding: 'utf-8'
      });

      const lines = output.trim().split('\n').filter((line: string) => line.trim());
      
      return lines.map((line: string) => {
        const [hash, date, author, message, ...bodyParts] = line.split('|');
        const body = bodyParts.join('|').trim();
        
        return this.parseCommit({
          hash: hash.substring(0, 7), // Short hash
          date,
          author,
          message,
          body: body || undefined,
          breaking: false,
          type: undefined,
          scope: undefined
        });
      });
    } catch (error) {
      return [];
    }
  }

  private parseCommit(commit: CommitInfo): CommitInfo {
    if (this.config.format !== 'conventional') {
      return commit;
    }

    // Parse conventional commit format: type(scope): description
    const conventionalMatch = commit.message.match(/^(\w+)(?:\(([^)]+)\))?: (.+)/);
    
    if (conventionalMatch) {
      const [, type, scope, description] = conventionalMatch;
      commit.type = type;
      commit.scope = scope;
      commit.message = description;
    }

    // Check for breaking changes
    commit.breaking = commit.message.includes('BREAKING CHANGE') || 
                     commit.message.includes('!:') ||
                     Boolean(commit.body && commit.body.includes('BREAKING CHANGE'));

    return commit;
  }

  private organizeCommits(commits: CommitInfo[]): ChangelogSection[] {
    if (this.config.format === 'conventional') {
      return this.organizeConventionalCommits(commits);
    } else {
      return this.organizeSimpleCommits(commits);
    }
  }

  private organizeConventionalCommits(commits: CommitInfo[]): ChangelogSection[] {
    const sections: ChangelogSection[] = [];
    
    // Breaking changes (always first)
    const breaking = commits.filter(c => c.breaking);
    if (breaking.length > 0) {
      sections.push({
        title: '⚠️ BREAKING CHANGES',
        commits: breaking
      });
    }

    // Features
    const features = commits.filter(c => c.type === 'feat' && !c.breaking);
    if (features.length > 0) {
      sections.push({
        title: '✨ Features',
        commits: features
      });
    }

    // Bug fixes
    const fixes = commits.filter(c => c.type === 'fix' && !c.breaking);
    if (fixes.length > 0) {
      sections.push({
        title: '🐛 Bug Fixes',
        commits: fixes
      });
    }

    // Documentation
    const docs = commits.filter(c => c.type === 'docs');
    if (docs.length > 0) {
      sections.push({
        title: '📚 Documentation',
        commits: docs
      });
    }

    // Performance improvements
    const perf = commits.filter(c => c.type === 'perf');
    if (perf.length > 0) {
      sections.push({
        title: '⚡ Performance',
        commits: perf
      });
    }

    // Refactoring
    const refactor = commits.filter(c => c.type === 'refactor');
    if (refactor.length > 0) {
      sections.push({
        title: '♻️ Code Refactoring',
        commits: refactor
      });
    }

    // Tests
    const tests = commits.filter(c => c.type === 'test');
    if (tests.length > 0) {
      sections.push({
        title: '✅ Tests',
        commits: tests
      });
    }

    // Build/CI
    const build = commits.filter(c => ['build', 'ci', 'chore'].includes(c.type || ''));
    if (build.length > 0) {
      sections.push({
        title: '🔧 Build & CI',
        commits: build
      });
    }

    // Other changes
    const other = commits.filter(c => 
      !c.breaking && 
      !['feat', 'fix', 'docs', 'perf', 'refactor', 'test', 'build', 'ci', 'chore'].includes(c.type || '')
    );
    if (other.length > 0) {
      sections.push({
        title: '📝 Other Changes',
        commits: other
      });
    }

    return sections;
  }

  private organizeSimpleCommits(commits: CommitInfo[]): ChangelogSection[] {
    return [{
      title: '📝 Changes',
      commits
    }];
  }

  private generateChangelogHeader(): string {
    return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
  }

  private generateChangelogContent(sections: ChangelogSection[]): string {
    const version = this.generateVersionNumber();
    const date = new Date().toISOString().split('T')[0];
    
    let content = `## [${version}] - ${date}\n\n`;

    sections.forEach(section => {
      if (section.commits.length > 0) {
        content += `### ${section.title}\n\n`;
        
        section.commits.forEach(commit => {
          const scope = commit.scope ? `**${commit.scope}**: ` : '';
          const hash = `([${commit.hash}])`;
          
          if (this.config.format === 'conventional') {
            content += `- ${scope}${commit.message} ${hash}\n`;
          } else {
            content += `- ${commit.message} - ${commit.author} ${hash}\n`;
          }
          
          // Add breaking change details
          if (commit.breaking && commit.body) {
            const breakingDetails = this.extractBreakingChangeDetails(commit.body);
            if (breakingDetails) {
              content += `  - ⚠️ ${breakingDetails}\n`;
            }
          }
        });
        
        content += '\n';
      }
    });

    return content;
  }

  private generateVersionNumber(): string {
    // Simple version generation - could be enhanced to read from package.json
    // and increment based on commit types
    const now = new Date();
    return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
  }

  private extractBreakingChangeDetails(body: string): string | null {
    const match = body.match(/BREAKING CHANGE:\s*(.+)/);
    return match ? match[1].trim() : null;
  }
}