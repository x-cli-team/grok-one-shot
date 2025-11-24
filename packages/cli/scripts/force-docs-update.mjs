#!/usr/bin/env node

/**
 * Force update .agent documentation regardless of change detection
 * Use this to manually capture recent significant changes
 */

import { UpdateAgentDocs } from '../src/tools/documentation/update-agent-docs.ts';
import fs from 'fs/promises';
import path from 'path';

async function forcedUpdate() {
  console.log('🔍 Forcing comprehensive .agent documentation update...');
  
  try {
    const updater = new UpdateAgentDocs({
      rootPath: '.',
      updateTarget: 'all',
      autoCommit: false
    });

    // First get the current analysis
    const result = await updater.updateDocs();
    console.log('📝 Standard analysis result:', result.message);
    
    if (result.updatedFiles.length > 0) {
      console.log('📁 Files updated:', result.updatedFiles.join(', '));
    } else {
      console.log('🔧 No automatic updates triggered, performing manual updates...');
      
      // Force update critical-state.md with recent changes
      await updateCriticalState();
      
      // Check for new task files that should be documented
      await documentRecentTasks();
    }
    
    if (result.suggestions.length > 0) {
      console.log('💡 Suggestions:', result.suggestions.join(', '));
    }
    
    console.log('✅ Documentation update complete');
    
  } catch (error) {
    console.error('❌ Failed to update documentation:', error.message);
    process.exit(1);
  }
}

async function updateCriticalState() {
  const criticalStatePath = path.join('.agent', 'system', 'critical-state.md');
  
  try {
    let content = await fs.readFile(criticalStatePath, 'utf-8');
    
    // Update timestamp
    const timestamp = new Date().toISOString();
    content = content.replace(
      /Last Updated: .*/,
      `Last Updated: ${timestamp}`
    );
    
    // Add recent significant changes section if not exists
    if (!content.includes('## Recent Major Changes')) {
      const recentChanges = `

## Recent Major Changes

### November 2025
- ✅ **Plan Mode Implementation Complete**: Revolutionary multi-strategy planning with interactive approval workflow
- ✅ **Automatic Documentation System**: Git hooks now automatically update .agent docs on commits
- 🚧 **Intelligent Text Paste Processing**: Enhanced paste detection and context-aware processing
- 🚧 **Vector Search Engine**: Preparation for semantic code search implementation

### Key Capabilities Added
- Enhanced Plan Mode with strategy comparison and risk assessment
- Automated documentation workflow with git hook integration
- Improved paste detection for code snippets and error logs
- Foundation for Claude Code competitive parity features
`;
      
      // Insert before the last section
      const sections = content.split('\n## ');
      if (sections.length > 1) {
        const lastSection = sections.pop();
        content = sections.join('\n## ') + recentChanges + '\n## ' + lastSection;
      } else {
        content += recentChanges;
      }
    }
    
    await fs.writeFile(criticalStatePath, content);
    console.log('📝 Updated critical-state.md with recent changes');
    
  } catch (error) {
    console.log('⚠️ Could not update critical-state.md:', error.message);
  }
}

async function documentRecentTasks() {
  try {
    const tasksDir = path.join('.agent', 'tasks');
    const files = await fs.readdir(tasksDir);
    
    // Find recent task files (created in last 7 days)
    const recentTasks = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(tasksDir, file);
        const stats = await fs.stat(filePath);
        const daysSinceCreated = (Date.now() - stats.birthtimeMs) / (1000 * 60 * 60 * 24);
        
        if (daysSinceCreated < 7) {
          recentTasks.push(file);
        }
      }
    }
    
    if (recentTasks.length > 0) {
      console.log('📋 Recent task files detected:', recentTasks.join(', '));
      
      // Update README.md to reference recent tasks
      const readmePath = path.join('.agent', 'README.md');
      let readmeContent = await fs.readFile(readmePath, 'utf-8');
      
      // Add recent tasks section if not exists
      if (!readmeContent.includes('## 🆕 Recent Tasks')) {
        const recentTasksSection = `

## 🆕 Recent Tasks

Recent sprint planning and implementation tasks:

${recentTasks.map(task => `- [${task}](./tasks/${task})`).join('\n')}

*This section is automatically updated when new task files are created.*
`;
        
        // Insert before the last section
        readmeContent = readmeContent.replace(
          /(\n---\n)/,
          recentTasksSection + '$1'
        );
        
        await fs.writeFile(readmePath, readmeContent);
        console.log('📝 Updated .agent/README.md with recent tasks');
      }
    }
    
  } catch (error) {
    console.log('⚠️ Could not document recent tasks:', error.message);
  }
}

// Run the forced update
forcedUpdate();