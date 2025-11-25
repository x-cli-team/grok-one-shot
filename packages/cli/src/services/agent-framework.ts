/**
 * Agent Framework Core
 *
 * Provides session memory, state persistence, learning capabilities,
 * and extensible plugin architecture for AI agents.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { AutonomousExecutor } from './autonomous-executor.js';

export interface AgentSession {
  id: string;
  userId: string;
  startTime: number;
  lastActivity: number;
  context: Map<string, any>;
  memory: AgentMemory;
  activeTasks: string[];
  learnedPatterns: Map<string, any>;
}

export interface AgentMemory {
  shortTerm: MemoryItem[];
  longTerm: Map<string, MemoryItem>;
  episodic: EpisodicMemory[];
  semantic: Map<string, any>;
}

export interface MemoryItem {
  id: string;
  type: 'task' | 'interaction' | 'pattern' | 'preference';
  content: any;
  timestamp: number;
  importance: number;
  accessCount: number;
  lastAccessed: number;
}

export interface EpisodicMemory {
  id: string;
  timestamp: number;
  context: string;
  action: string;
  outcome: 'success' | 'failure' | 'partial';
  lesson: string;
  confidence: number;
}

export interface AgentPlugin {
  name: string;
  version: string;
  description: string;
  capabilities: string[];

  initialize(agent: AgentFramework): Promise<void>;
  execute(context: PluginContext): Promise<PluginResult>;
  learn?(experience: Experience): Promise<void>;
}

export interface PluginContext {
  session: AgentSession;
  input: any;
  previousResults: any[];
}

export interface PluginResult {
  success: boolean;
  output: any;
  confidence: number;
  suggestions?: string[];
}

export interface Experience {
  context: string;
  action: string;
  outcome: any;
  reward: number;
  timestamp: number;
  parameters?: any;
}

/**
 * Agent Framework Core
 */
export class AgentFramework {
  private sessions = new Map<string, AgentSession>();
  private plugins = new Map<string, AgentPlugin>();
  private autonomousExecutor: AutonomousExecutor;
  private memoryPath: string;
  private pluginPath: string;

  constructor(
    autonomousExecutor: AutonomousExecutor,
    memoryPath = '/tmp/agent-memory',
    pluginPath = '/tmp/agent-plugins'
  ) {
    this.autonomousExecutor = autonomousExecutor;
    this.memoryPath = memoryPath;
    this.pluginPath = pluginPath;
  }

  /**
   * Initialize the agent framework
   */
  async initialize(): Promise<void> {
    await this.loadPersistedMemory();
    await this.loadPlugins();
    console.log(`🤖 Agent Framework initialized with ${this.plugins.size} plugins`);
  }

  /**
   * Create or resume an agent session
   */
  async createSession(userId: string, sessionId?: string): Promise<AgentSession> {
    const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let session = this.sessions.get(id);
    if (!session) {
      session = {
        id,
        userId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        context: new Map(),
        memory: {
          shortTerm: [],
          longTerm: new Map(),
          episodic: [],
          semantic: new Map()
        },
        activeTasks: [],
        learnedPatterns: new Map()
      };

      this.sessions.set(id, session);
      await this.loadSessionMemory(session);
    }

    session.lastActivity = Date.now();
    return session;
  }

  /**
   * Execute an action within an agent session
   */
  async executeInSession(sessionId: string, action: string, parameters: any = {}): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.lastActivity = Date.now();

    try {
      // Check if this action can be handled by a plugin
      const pluginResult = await this.tryExecuteWithPlugin(session, action, parameters);
      if (pluginResult) {
        await this.recordExperience(session, action, parameters, pluginResult, pluginResult.success ? 1 : -1);
        return pluginResult;
      }

      // Fallback to autonomous execution
      const result = await this.autonomousExecutor.executeTask(action, JSON.stringify(parameters));
      await this.recordExperience(session, action, parameters, result, result.status === 'completed' ? 1 : -0.5);

      return result;

    } catch (error) {
      await this.recordExperience(session, action, parameters, error, -1);
      throw error;
    }
  }

  /**
   * Learn from interactions and improve performance
   */
  async learnFromInteraction(sessionId: string, interaction: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Extract patterns from successful interactions
    if (interaction.outcome === 'success') {
      await this.extractPatterns(session, interaction);
    }

    // Update memory with new knowledge
    await this.consolidateMemory(session);

    // Persist updated memory
    await this.persistSessionMemory(session);
  }

  /**
   * Register a plugin
   */
  async registerPlugin(plugin: AgentPlugin): Promise<void> {
    this.plugins.set(plugin.name, plugin);
    await plugin.initialize(this);
    console.log(`🔌 Plugin registered: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Get session memory and context
   */
  getSessionContext(sessionId: string): AgentSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Clean up inactive sessions
   */
  async cleanupInactiveSessions(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity > maxAge) {
        await this.persistSessionMemory(session);
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.sessions.delete(id);
    }

    console.log(`🧹 Cleaned up ${toRemove.length} inactive sessions`);
  }

  /**
   * Try to execute action with registered plugins
   */
  private async tryExecuteWithPlugin(session: AgentSession, action: string, parameters: any): Promise<any> {
    for (const plugin of this.plugins.values()) {
      if (plugin.capabilities.includes(action) || plugin.capabilities.includes('general')) {
        try {
          const context: PluginContext = {
            session,
            input: { action, parameters },
            previousResults: this.getRecentResults(session)
          };

          const result = await plugin.execute(context);

          if (result.success) {
            return result;
          }
        } catch (error) {
          console.warn(`Plugin ${plugin.name} failed:`, error);
        }
      }
    }

    return null;
  }

  /**
   * Record experience for learning
   */
  private async recordExperience(session: AgentSession, action: string, parameters: any, result: any, reward: number): Promise<void> {
    const experience: Experience = {
      context: session.context.get('current_context') || 'general',
      action,
      outcome: result,
      reward,
      timestamp: Date.now()
    };

    // Add to episodic memory
    const episodicMemory: EpisodicMemory = {
      id: `epi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: experience.timestamp,
      context: experience.context,
      action: experience.action,
      outcome: reward > 0 ? 'success' : reward === 0 ? 'partial' : 'failure',
      lesson: this.extractLesson(experience),
      confidence: Math.abs(reward)
    };

    session.memory.episodic.push(episodicMemory);

    // Add to short-term memory
    const memoryItem: MemoryItem = {
      id: `mem_${Date.now()}`,
      type: 'interaction',
      content: experience,
      timestamp: Date.now(),
      importance: Math.abs(reward),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    session.memory.shortTerm.push(memoryItem);

    // Notify plugins of learning opportunity
    for (const plugin of this.plugins.values()) {
      if (plugin.learn) {
        try {
          await plugin.learn(experience);
        } catch (error) {
          console.warn(`Plugin ${plugin.name} learning failed:`, error);
        }
      }
    }
  }

  /**
   * Extract patterns from successful interactions
   */
  private async extractPatterns(session: AgentSession, interaction: any): Promise<void> {
    // Simple pattern extraction - can be enhanced with ML
    const patterns = session.learnedPatterns;

    if (interaction.action && interaction.parameters) {
      const actionKey = interaction.action.toLowerCase();
      const paramKeys = Object.keys(interaction.parameters);

      // Track successful parameter combinations
      if (!patterns.has(actionKey)) {
        patterns.set(actionKey, new Map());
      }

      const actionPatterns = patterns.get(actionKey);
      const paramHash = paramKeys.sort().join(',');

      actionPatterns.set(paramHash, (actionPatterns.get(paramHash) || 0) + 1);
    }
  }

  /**
   * Consolidate memory from short-term to long-term
   */
  private async consolidateMemory(session: AgentSession): Promise<void> {
    const now = Date.now();
    const consolidationThreshold = 5; // Access count threshold
    const ageThreshold = 60 * 60 * 1000; // 1 hour

    // Move important items to long-term memory
    const toMove: MemoryItem[] = [];

    for (const item of session.memory.shortTerm) {
      if (item.accessCount >= consolidationThreshold ||
          (now - item.timestamp) > ageThreshold) {
        toMove.push(item);
      }
    }

    for (const item of toMove) {
      session.memory.longTerm.set(item.id, item);
      session.memory.shortTerm = session.memory.shortTerm.filter(i => i.id !== item.id);
    }

    // Limit short-term memory size
    if (session.memory.shortTerm.length > 50) {
      session.memory.shortTerm = session.memory.shortTerm.slice(-50);
    }

    // Limit episodic memory
    if (session.memory.episodic.length > 100) {
      session.memory.episodic = session.memory.episodic.slice(-100);
    }
  }

  /**
   * Load persisted memory
   */
  private async loadPersistedMemory(): Promise<void> {
    try {
      await fs.mkdir(this.memoryPath, { recursive: true });
      const files = await fs.readdir(this.memoryPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(this.memoryPath, file), 'utf-8');
            const sessionData = JSON.parse(content);

            // Restore session
            const session: AgentSession = {
              ...sessionData,
              context: new Map(sessionData.context),
              memory: {
                shortTerm: sessionData.memory.shortTerm || [],
                longTerm: new Map(sessionData.memory.longTerm || []),
                episodic: sessionData.memory.episodic || [],
                semantic: new Map(sessionData.memory.semantic || [])
              },
              learnedPatterns: new Map(sessionData.learnedPatterns || [])
            };

            this.sessions.set(session.id, session);
          } catch (error) {
            console.warn(`Failed to load session ${file}:`, error);
          }
        }
      }

      console.log(`💾 Loaded ${this.sessions.size} persisted sessions`);
    } catch (error) {
      console.warn('Failed to load persisted memory:', error);
    }
  }

  /**
   * Persist session memory
   */
  private async persistSessionMemory(session: AgentSession): Promise<void> {
    try {
      const fileName = `session_${session.id}.json`;
      const filePath = path.join(this.memoryPath, fileName);

      const serializable = {
        ...session,
        context: Array.from(session.context.entries()),
        memory: {
          ...session.memory,
          longTerm: Array.from(session.memory.longTerm.entries()),
          semantic: Array.from(session.memory.semantic.entries())
        },
        learnedPatterns: Array.from(session.learnedPatterns.entries())
      };

      await fs.writeFile(filePath, JSON.stringify(serializable, null, 2), 'utf-8');
    } catch (error) {
      console.warn(`Failed to persist session ${session.id}:`, error);
    }
  }

  /**
   * Load session memory from disk
   */
  private async loadSessionMemory(session: AgentSession): Promise<void> {
    // Memory is loaded in loadPersistedMemory, this is a placeholder for additional loading logic
  }

  /**
   * Load plugins from plugin directory
   */
  private async loadPlugins(): Promise<void> {
    try {
      await fs.mkdir(this.pluginPath, { recursive: true });
      // In a real implementation, this would dynamically load plugins
      // For now, plugins are registered programmatically
    } catch (error) {
      console.warn('Failed to load plugins:', error);
    }
  }

  /**
   * Extract lesson from experience
   */
  private extractLesson(experience: Experience): string {
    if (experience.reward > 0) {
      return `Successful: ${experience.action} with parameters ${JSON.stringify(experience.parameters || {})}`;
    } else {
      return `Failed: ${experience.action} - avoid similar approaches`;
    }
  }

  /**
   * Get recent results from session memory
   */
  private getRecentResults(session: AgentSession): any[] {
    return session.memory.shortTerm
      .filter(item => item.type === 'interaction')
      .slice(-5)
      .map(item => item.content.outcome);
  }
}