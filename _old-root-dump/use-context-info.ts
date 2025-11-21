/**
 * Context Information Hook
 * 
 * Provides workspace context information that can be shared
 * between the welcome banner and context tooltip.
 */

import { useState, useEffect } from 'react';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface ContextInfo {
  workspaceFiles: number;
  indexSize: string;
  sessionFiles: number;
  activeTokens: number;
  lastActivity: string;
  gitBranch?: string;
  projectName?: string;
  memoryPressure: 'low' | 'medium' | 'high';
  isLoading: boolean;
  // Enhanced context management fields
  tokenUsage?: {
    current: number;
    max: number;
    percent: number;
  };
  messagesCount: number;
  loadedFiles: Array<{
    path: string;
    tokens: number;
    lastAccessed: Date;
  }>;
  contextHealth: 'optimal' | 'degraded' | 'critical';
}

export function useContextInfo(agent?: any) {
  const [contextInfo, setContextInfo] = useState<ContextInfo>({
    workspaceFiles: 0,
    indexSize: "0 MB",
    sessionFiles: 0,
    activeTokens: 0,
    lastActivity: "Now",
    memoryPressure: 'low',
    isLoading: true,
    messagesCount: 0,
    loadedFiles: [],
    contextHealth: 'optimal',
  });

  // Update context information
  const updateContextInfo = async () => {
    try {
      // Get agent context data if agent is available
      let tokenUsage;
      let messagesCount = 0;
      let loadedFiles: ContextInfo['loadedFiles'] = [];
      let contextHealth: ContextInfo['contextHealth'] = 'optimal';

      if (agent) {
        // Get model information
        const modelName = agent.getCurrentModel?.() || "grok-4.1";
        const maxTokens = getMaxTokensForModel(modelName);

        // Get real data from agent
        const sessionTokens = agent.getSessionTokenCount?.() || 0;
        messagesCount = agent.getMessageCount?.() || 0;

        const tokenPercent = Math.round((sessionTokens / maxTokens) * 100);

        tokenUsage = {
          current: sessionTokens,
          max: maxTokens,
          percent: tokenPercent,
        };

        // Determine context health based on actual usage
        if (tokenPercent >= 95) contextHealth = 'critical';
        else if (tokenPercent >= 80) contextHealth = 'degraded';
        else contextHealth = 'optimal';

        // Get loaded files from chat history
        // TODO: Extract file references from chat history for better accuracy
        loadedFiles = [];
      }

      const info: ContextInfo = {
        workspaceFiles: await getWorkspaceFileCount(),
        indexSize: await getIndexSize(),
        sessionFiles: await getSessionFileCount(),
        activeTokens: tokenUsage?.current || 0,
        lastActivity: "Now",
        gitBranch: await getGitBranch(),
        projectName: await getProjectName(),
        memoryPressure: getMemoryPressure(),
        isLoading: false,
        tokenUsage,
        messagesCount,
        loadedFiles,
        contextHealth,
      };
      setContextInfo(info);
    } catch (error) {
      console.warn('[ContextInfo] Failed to update context:', error);
      setContextInfo(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Initial load and periodic updates
  useEffect(() => {
    updateContextInfo();
    const interval = setInterval(updateContextInfo, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  return {
    contextInfo,
    updateContextInfo,
    refreshContext: updateContextInfo
  };
}

// Helper functions for gathering context information
async function getWorkspaceFileCount(): Promise<number> {
  try {
    const cwd = process.cwd();
    const entries = await fs.promises.readdir(cwd, { withFileTypes: true });
    
    let count = 0;
    for (const entry of entries) {
      if (entry.isFile() && !shouldIgnoreFile(entry.name)) {
        count++;
      } else if (entry.isDirectory() && !shouldIgnoreDirectory(entry.name)) {
        try {
          const subEntries = await fs.promises.readdir(path.join(cwd, entry.name), { withFileTypes: true });
          count += subEntries.filter(sub => sub.isFile() && !shouldIgnoreFile(sub.name)).length;
        } catch {
          // Skip directories we can't read
        }
      }
    }
    
    return count;
  } catch {
    return 0;
  }
}

function shouldIgnoreFile(filename: string): boolean {
  return filename.startsWith('.') || 
         filename.endsWith('.log') ||
         filename.includes('.tmp');
}

function shouldIgnoreDirectory(dirname: string): boolean {
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
  return ignoreDirs.includes(dirname) || dirname.startsWith('.');
}

async function getIndexSize(): Promise<string> {
  try {
    const indexPath = path.join(process.cwd(), '.grok', 'index.json');
    if (fs.existsSync(indexPath)) {
      const stats = await fs.promises.stat(indexPath);
      const mb = stats.size / (1024 * 1024);
      return mb > 1 ? `${mb.toFixed(1)} MB` : `${(stats.size / 1024).toFixed(1)} KB`;
    }
  } catch {
    // Ignore errors
  }
  return "0 MB";
}

async function getSessionFileCount(): Promise<number> {
  try {
    const sessionPath = path.join(os.homedir(), '.grok', 'session.log');
    if (fs.existsSync(sessionPath)) {
      const content = await fs.promises.readFile(sessionPath, 'utf8');
      return content.split('\n').filter(line => line.trim()).length;
    }
  } catch {
    // Ignore errors
  }
  return 0;
}

async function getGitBranch(): Promise<string | undefined> {
  try {
    const gitPath = path.join(process.cwd(), '.git', 'HEAD');
    if (fs.existsSync(gitPath)) {
      const content = await fs.promises.readFile(gitPath, 'utf8');
      const match = content.match(/ref: refs\/heads\/(.+)/);
      return match ? match[1].trim() : 'detached';
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

async function getProjectName(): Promise<string | undefined> {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const content = await fs.promises.readFile(packagePath, 'utf8');
      const pkg = JSON.parse(content);
      return pkg.name;
    }
  } catch {
    // Ignore errors
  }
  
  // Fallback to directory name
  return path.basename(process.cwd());
}

function getMemoryPressure(): 'low' | 'medium' | 'high' {
  try {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 200) return 'high';
    if (heapUsedMB > 100) return 'medium';
    return 'low';
  } catch {
    return 'low';
  }
}

// Helper functions for agent context data
function getMaxTokensForModel(modelName: string): number {
  const modelLimits: Record<string, number> = {
    "grok-4.1": 128000,
    "grok-4-fast-reasoning": 200000,
    "grok-4-0709": 200000,
    "grok-4-latest": 200000,
    "grok-3-latest": 200000,
    "grok-3-fast": 128000,
    "grok-3-mini-fast": 64000,
    "claude-sonnet-4": 200000,
    "claude-opus-4": 200000,
    "gpt-4o": 128000,
    "gpt-4": 32000,
  };

  return modelLimits[modelName] || 128000; // Default fallback
}

function _extractLoadedFiles(_chatHistory: any[]): ContextInfo['loadedFiles'] {
  const fileMap = new Map<string, ContextInfo['loadedFiles'][0]>();

  // Extract file paths from chat history
  for (const entry of _chatHistory) {
    if (entry.type === "tool_result" && entry.toolCall) {
      const toolName = entry.toolCall.function?.name;
      const args = entry.toolCall.function?.arguments;

      if (toolName === "str_replace_editor" || toolName === "edit_file") {
        try {
          const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;
          const filePath = parsedArgs?.path || parsedArgs?.file_path;

          if (filePath && typeof filePath === "string") {
            // Estimate token count from content length
            const content = entry.content || "";
            const tokenCount = Math.round(content.length / 4); // Rough estimate

            fileMap.set(filePath, {
              path: filePath.replace(process.cwd(), "."),
              tokens: tokenCount,
              lastAccessed: entry.timestamp || new Date(),
            });
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }
  }

  // Return most recently accessed files
  return Array.from(fileMap.values())
    .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
    .slice(0, 10);
}