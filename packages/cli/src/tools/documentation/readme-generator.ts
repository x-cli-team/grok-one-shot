import * as ops from 'fs-extra';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface ReadmeConfig {
  projectName: string;
  rootPath: string;
  updateExisting: boolean;
  template: 'default' | 'api' | 'cli' | 'library';
}

export interface ProjectAnalysis {
  packageJson?: any;
  hasTypeScript: boolean;
  hasReact: boolean;
  hasTests: boolean;
  hasDocs: boolean;
  buildScripts: string[];
  dependencies: string[];
  devDependencies: string[];
  mainFiles: string[];
  framework?: string;
}

export class ReadmeGenerator {
  private config: ReadmeConfig;

  constructor(config: ReadmeConfig) {
    this.config = config;
  }

  async generateReadme(): Promise<{ success: boolean; message: string; content?: string }> {
    try {
      // Analyze project structure
      const analysis = await this.analyzeProject();
      
      // Check if README exists
      const readmePath = path.join(this.config.rootPath, 'README.md');
      const readmeExists = existsSync(readmePath);

      if (readmeExists && !this.config.updateExisting) {
        return {
          success: false,
          message: 'README.md already exists. Use --update flag to overwrite.'
        };
      }

      // Generate content based on analysis
      const content = this.generateReadmeContent(analysis);

      // Write file
      await ops.promises.writeFile(readmePath, content);

      return {
        success: true,
        message: readmeExists 
          ? '✅ Updated existing README.md with comprehensive documentation'
          : '✅ Created new README.md with project documentation',
        content
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to generate README: ${error.message}`
      };
    }
  }

  private async analyzeProject(): Promise<ProjectAnalysis> {
    const analysis: ProjectAnalysis = {
      hasTypeScript: false,
      hasReact: false,
      hasTests: false,
      hasDocs: false,
      buildScripts: [],
      dependencies: [],
      devDependencies: [],
      mainFiles: []
    };

    try {
      // Check package.json
      const packagePath = path.join(this.config.rootPath, 'package.json');
      if (existsSync(packagePath)) {
        const packageContent = await ops.promises.readFile(packagePath, 'utf-8');
        analysis.packageJson = JSON.parse(packageContent);
        
        // Extract dependencies
        analysis.dependencies = Object.keys(analysis.packageJson.dependencies || {});
        analysis.devDependencies = Object.keys(analysis.packageJson.devDependencies || {});
        
        // Detect technologies
        analysis.hasReact = analysis.dependencies.includes('react') || analysis.devDependencies.includes('react');
        analysis.hasTypeScript = analysis.devDependencies.includes('typescript') || existsSync(path.join(this.config.rootPath, 'tsconfig.json'));
        
        // Extract build scripts
        const scripts = analysis.packageJson.scripts || {};
        analysis.buildScripts = Object.keys(scripts).filter(script => 
          ['build', 'dev', 'start', 'test', 'lint', 'typecheck'].includes(script)
        );

        // Detect framework
        if (analysis.dependencies.includes('next')) analysis.framework = 'Next.js';
        else if (analysis.dependencies.includes('express')) analysis.framework = 'Express.js';
        else if (analysis.dependencies.includes('ink')) analysis.framework = 'Ink (Terminal)';
        else if (analysis.hasReact) analysis.framework = 'React';
      }

      // Check for common files
      const commonFiles = ['src/', 'lib/', 'docs/', 'test/', 'tests/', '__tests__/'];
      for (const file of commonFiles) {
        if (existsSync(path.join(this.config.rootPath, file))) {
          if (file.includes('test')) analysis.hasTests = true;
          if (file.includes('docs')) analysis.hasDocs = true;
          analysis.mainFiles.push(file);
        }
      }

      return analysis;
    } catch (error) {
      return analysis;
    }
  }

  private generateReadmeContent(analysis: ProjectAnalysis): string {
    const pkg = analysis.packageJson;
    const projectName = this.config.projectName || pkg?.name || 'Project';
    
    let content = `# ${projectName}\n\n`;

    // Description
    if (pkg?.description) {
      content += `${pkg.description}\n\n`;
    } else {
      content += `A ${analysis.framework || 'JavaScript'} project.\n\n`;
    }

    // Badges (if package.json exists)
    if (pkg) {
      content += this.generateBadges(analysis);
    }

    // Table of Contents
    content += `## 📋 Table of Contents\n\n`;
    content += `- [Installation](#installation)\n`;
    content += `- [Usage](#usage)\n`;
    if (analysis.buildScripts.length > 0) content += `- [Development](#development)\n`;
    if (analysis.hasTests) content += `- [Testing](#testing)\n`;
    if (pkg?.scripts?.build) content += `- [Building](#building)\n`;
    content += `- [Configuration](#configuration)\n`;
    content += `- [Contributing](#contributing)\n`;
    content += `- [License](#license)\n\n`;

    // Installation
    content += `## 🚀 Installation\n\n`;
    if (pkg?.bin) {
      content += `### Global Installation\n\`\`\`bash\nnpm install -g ${pkg.name}\n\`\`\`\n\n`;
    }
    content += `### Local Installation\n\`\`\`bash\n`;
    content += `# Clone the repository\ngit clone <repository-url>\n`;
    content += `cd ${pkg?.name || projectName.toLowerCase()}\n\n`;
    content += `# Install dependencies\nnpm install\n\`\`\`\n\n`;

    // Usage
    content += `## 💻 Usage\n\n`;
    if (pkg?.bin) {
      const binName = Object.keys(pkg.bin)[0];
      content += `### Command Line\n\`\`\`bash\n${binName} [options]\n\`\`\`\n\n`;
    }
    if (analysis.framework === 'Express.js') {
      content += `### API Server\n\`\`\`bash\nnpm start\n\`\`\`\n\nThe server will start on \`http://localhost:3000\`\n\n`;
    } else if (analysis.hasReact) {
      content += `### Development Server\n\`\`\`bash\nnpm run dev\n\`\`\`\n\nOpen [http://localhost:3000](http://localhost:3000) in your browser.\n\n`;
    }

    // Development section
    if (analysis.buildScripts.length > 0) {
      content += `## 🛠️ Development\n\n`;
      content += `### Available Scripts\n\n`;
      
      analysis.buildScripts.forEach(script => {
        const description = this.getScriptDescription(script);
        content += `- \`npm run ${script}\` - ${description}\n`;
      });
      content += '\n';
    }

    // Testing
    if (analysis.hasTests) {
      content += `## 🧪 Testing\n\n`;
      content += `\`\`\`bash\nnpm test\n\`\`\`\n\n`;
      if (analysis.buildScripts.includes('test:watch')) {
        content += `### Watch Mode\n\`\`\`bash\nnpm run test:watch\n\`\`\`\n\n`;
      }
    }

    // Building
    if (pkg?.scripts?.build) {
      content += `## 📦 Building\n\n`;
      content += `\`\`\`bash\nnpm run build\n\`\`\`\n\n`;
      if (analysis.hasTypeScript) {
        content += `This will compile TypeScript files and output to the \`dist/\` directory.\n\n`;
      }
    }

    // Technology Stack
    if (analysis.dependencies.length > 0) {
      content += `## 🔧 Technology Stack\n\n`;
      if (analysis.framework) content += `- **Framework**: ${analysis.framework}\n`;
      if (analysis.hasTypeScript) content += `- **Language**: TypeScript\n`;
      
      const keyDeps = analysis.dependencies.filter(dep => 
        ['react', 'express', 'next', 'ink', 'commander', 'chalk'].includes(dep)
      );
      if (keyDeps.length > 0) {
        content += `- **Key Dependencies**: ${keyDeps.join(', ')}\n`;
      }
      content += '\n';
    }

    // Configuration
    content += `## ⚙️ Configuration\n\n`;
    if (existsSync(path.join(this.config.rootPath, '.env.example'))) {
      content += `Copy \`.env.example\` to \`.env\` and configure your environment variables:\n\n`;
      content += `\`\`\`bash\ncp .env.example .env\n\`\`\`\n\n`;
    }
    if (analysis.hasTypeScript) {
      content += `### TypeScript Configuration\nTypeScript is configured via \`tsconfig.json\`.\n\n`;
    }

    // API Documentation (if applicable)
    if (analysis.framework === 'Express.js' || pkg?.main?.includes('api')) {
      content += `## 📖 API Documentation\n\n`;
      content += `API documentation is available at \`/docs\` when running the server.\n\n`;
    }

    // Contributing
    content += `## 🤝 Contributing\n\n`;
    content += `1. Fork the repository\n`;
    content += `2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)\n`;
    content += `3. Commit your changes (\`git commit -m 'Add amazing feature'\`)\n`;
    content += `4. Push to the branch (\`git push origin feature/amazing-feature\`)\n`;
    content += `5. Open a Pull Request\n\n`;

    // License
    content += `## 📄 License\n\n`;
    if (pkg?.license) {
      content += `This project is licensed under the ${pkg.license} License.\n\n`;
    } else {
      content += `This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.\n\n`;
    }

    // Generated footer
    content += `---\n*Generated by grok-one-shotDocumentation System*\n`;
    content += `*Last updated: ${new Date().toISOString().split('T')[0]}*`;

    return content;
  }

  private generateBadges(analysis: ProjectAnalysis): string {
    let badges = '';
    
    if (analysis.packageJson?.version) {
      badges += `![Version](https://img.shields.io/badge/version-${analysis.packageJson.version}-blue.svg)\n`;
    }
    
    if (analysis.hasTypeScript) {
      badges += `![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)\n`;
    }
    
    if (analysis.hasReact) {
      badges += `![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)\n`;
    }
    
    if (analysis.packageJson?.license) {
      badges += `![License](https://img.shields.io/badge/license-${analysis.packageJson.license}-green.svg)\n`;
    }

    return badges ? badges + '\n' : '';
  }

  private getScriptDescription(script: string): string {
    const descriptions: Record<string, string> = {
      'dev': 'Start development server',
      'build': 'Build for production',
      'start': 'Start production server',
      'test': 'Run test suite',
      'lint': 'Run linter',
      'typecheck': 'Run TypeScript type checking',
      'format': 'Format code with prettier'
    };
    return descriptions[script] || `Run ${script} script`;
  }
}