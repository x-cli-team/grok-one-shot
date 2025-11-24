/**
 * Context Pack Interface
 *
 * Provides structured project context from .agent/ directory
 * Used to initialize AI agent with project-specific knowledge
 */

export interface TaskFile {
  filename: string;
  content: string;
}

export interface ContextPack {
  system: string;
  sop: string;
  tasks: TaskFile[];
}

/**
 * Load context from .agent/ directory (optional feature)
 *
 * NOTE: This is currently optional. The primary context loading
 * mechanism is via GROK.md + docs-index.md (see use-claude-md.ts)
 *
 * @returns ContextPack if .agent/ directory exists, undefined otherwise
 */
export function loadContextPack(): ContextPack | undefined {
  // TODO: Implement .agent/ directory loading if needed
  // Currently, context is loaded via GROK.md + docs-index.md (on-demand system)
  return undefined;
}
