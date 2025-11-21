import fs from "fs";
import path from "path";

// Session logger to capture full terminal state for testing
class SessionLogger {
  private logPath: string;
  private sessionId: string;
  
  constructor() {
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
    this.logPath = path.join(process.cwd(), 'logs', `session-${this.sessionId}.log`);
    this.init();
  }
  
  private init() {
    // Ensure logs directory exists
    fs.mkdirSync(path.dirname(this.logPath), { recursive: true });

    const header = `
=================================================================
🧪 GROK ONE-SHOT TESTING SESSION
Session ID: ${this.sessionId}
Started: ${new Date().toISOString()}
=================================================================

`;
    fs.writeFileSync(this.logPath, header);
  }
  
  logTerminalState(state: {
    input: string;
    cursorPosition: number;
    chatHistory: any[];
    isProcessing: boolean;
    isStreaming: boolean;
    action: string;
  }) {
    const timestamp = new Date().toISOString();
    const entry = `
[${timestamp}] 📺 TERMINAL STATE - ${state.action}
=====================================
INPUT FIELD: "${state.input}"
CURSOR POS: ${state.cursorPosition}
PROCESSING: ${state.isProcessing}
STREAMING: ${state.isStreaming}
CHAT ENTRIES: ${state.chatHistory.length}
LAST ENTRY: ${state.chatHistory.length > 0 ? JSON.stringify(state.chatHistory[state.chatHistory.length - 1], null, 2) : 'None'}
=====================================

`;
    fs.appendFileSync(this.logPath, entry);
  }
  
  logUserAction(action: string, details: any = {}) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] 👤 USER ACTION: ${action}\nDetails: ${JSON.stringify(details, null, 2)}\n\n`;
    fs.appendFileSync(this.logPath, entry);
  }
  
  logPasteEvent(event: {
    phase: 'start' | 'chunk' | 'complete';
    data: any;
  }) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] 📋 PASTE EVENT: ${event.phase}\nData: ${JSON.stringify(event.data, null, 2)}\n\n`;
    fs.appendFileSync(this.logPath, entry);
  }
  
  logTestResult(testName: string, result: 'PASS' | 'FAIL', details: string) {
    const timestamp = new Date().toISOString();
    const entry = `
[${timestamp}] ✅ TEST RESULT: ${testName}
Result: ${result}
Details: ${details}
=================================================================

`;
    fs.appendFileSync(this.logPath, entry);
  }
  
  getLogPath(): string {
    return this.logPath;
  }
}

// Global instance
let sessionLogger: SessionLogger | null = null;

export function getSessionLogger(): SessionLogger {
  if (!sessionLogger) {
    sessionLogger = new SessionLogger();
  }
  return sessionLogger;
}

export function logTerminalState(state: Parameters<SessionLogger['logTerminalState']>[0]) {
  getSessionLogger().logTerminalState(state);
}

export function logUserAction(action: string, details: any = {}) {
  getSessionLogger().logUserAction(action, details);
}

export function logPasteEvent(event: Parameters<SessionLogger['logPasteEvent']>[0]) {
  getSessionLogger().logPasteEvent(event);
}

export function logTestResult(testName: string, result: 'PASS' | 'FAIL', details: string) {
  getSessionLogger().logTestResult(testName, result, details);
}

export function getSessionLogPath(): string {
  return getSessionLogger().getLogPath();
}