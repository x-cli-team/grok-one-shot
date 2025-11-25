import { useEffect, useRef } from 'react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ChatEntry } from '../agent/grok-agent.js';

export function useSessionLogging(chatHistory: ChatEntry[]): void {
  const lastChatHistoryLength = useRef<number>(0);

  useEffect(() => {
    const newEntries = chatHistory.slice(lastChatHistoryLength.current);
    if (newEntries.length > 0) {
      const sessionFile = path.join(os.homedir(), '.grok', 'session.log');
      try {
        const dir = path.dirname(sessionFile);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const lines = newEntries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
        fs.appendFileSync(sessionFile, lines);
      } catch {
        // Silently ignore session logging errors
      }
    }
    lastChatHistoryLength.current = chatHistory.length;
  }, [chatHistory]);
}