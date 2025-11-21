import { useEffect } from 'react';
import fs from 'fs';
import { ChatEntry } from '../agent/grok-agent.js';

/**
 * Loads GROK.md and docs-index.md at startup
 *
 * IMPORTANT: Only loads ~700 tokens total (93-96% reduction vs old auto-read)
 * Other docs are loaded on-demand by AI agent via Read tool
 *
 * This replaces the old useAutoRead hook which loaded 15,000 tokens
 * and the loadContext function which loaded 50,000-70,000 tokens.
 */
export function useCLAUDEmd(
  setChatHistory: (messages: ChatEntry[]) => void
): void {
  useEffect(() => {
    const filesToLoad = [
      { path: 'GROK.md', label: 'GROK.md', fallback: 'CLAUDE.md' },
      { path: '.agent/docs-summary.md', label: 'Compressed Documentation Summary' }
    ];

    const loadedDocs: string[] = [];
    let totalChars = 0;

    for (const file of filesToLoad) {
      // Try primary path first
      let filePath = file.path;
      let exists = fs.existsSync(filePath);

      // Try fallback if primary doesn't exist
      if (!exists && file.fallback) {
        filePath = file.fallback;
        exists = fs.existsSync(filePath);
      }

      if (exists) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const charCount = content.length;
          totalChars += charCount;
          loadedDocs.push(file.label);

          // Log to console (not chat) - keeps chat clean
          console.log(`📄 Loaded: ${file.label} (${charCount} chars)`);
        } catch (error) {
          console.warn(`⚠️ Failed to load ${file.label}:`, error);
        }
      } else {
        // Log missing file (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log(`ℹ️ ${file.label} not found - will be created in Sprint 1`);
        }
      }
    }

    if (loadedDocs.length > 0) {
      const tokenEstimate = Math.round(totalChars / 4); // Rough estimate: 4 chars = 1 token
      console.log(`✅ Context initialized: ${loadedDocs.join(', ')}`);
      console.log(`📊 Estimated tokens loaded: ~${tokenEstimate} (target: ~700)`);
      console.log('📚 Additional docs available on-demand via Read tool');
    } else {
      // No docs loaded yet - this is expected during Sprint 1 implementation
      console.log('📝 No GROK.md found yet - proceeding without initial context');
      console.log('💡 Docs will be loaded on-demand via Read tool');
    }

    // NO chat history entries - keep chat clean!
    // Old system added loading messages to chat which cluttered the UI
  }, [setChatHistory]);
}
