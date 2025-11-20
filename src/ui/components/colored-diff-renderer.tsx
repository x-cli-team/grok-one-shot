import React from 'react';
import { Text } from 'ink';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface ColoredDiffRendererProps {
  content: string;
}

// Session logging helper - use the main session log file
function logToSession(message: string, data?: any) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `\n[${timestamp}] 🎨 COLORED DIFF RENDERER - ${message}\n=====================================\n${data ? JSON.stringify(data, null, 2) : 'No additional data'}\n=====================================\n`;

    // Find the current session log file in the logs directory
    const workingDir = process.cwd();
    const logsDir = path.join(workingDir, 'logs');
    const sessionFiles = fs.readdirSync(logsDir).filter(f => f.startsWith('session-') && f.endsWith('.log'));

    if (sessionFiles.length > 0) {
      // Use the most recent session file
      const sessionFile = path.join(logsDir, sessionFiles[sessionFiles.length - 1]);
      fs.appendFileSync(sessionFile, logEntry);
    } else {
      // Fallback to console if no session file found
      console.log(`[ColoredDiffRenderer] ${message}`, data);
    }
  } catch (error) {
    // Fallback to console if session logging fails
    console.log(`[ColoredDiffRenderer] ${message}`, data);
    console.error('[ColoredDiffRenderer] Session logging failed:', error);
  }
}

export function ColoredDiffRenderer({ content }: ColoredDiffRendererProps) {
  try {
    logToSession('Rendering content with ANSI codes', {
      contentLength: content.length,
      contentPreview: content.substring(0, 200),
      ansiCodes: content.match(/\x1b\[\d+m/g) || [],
      lineCount: content.split('\n').length
    });

    // Parse ANSI color codes and render with Ink colors
    const parseAnsiAndRender = (text: string) => {
      const parts: React.ReactNode[] = [];
      const lines = text.split('\n');

      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          parts.push('\n');
        }

        // Check for colored diff patterns
        if (line.includes('\x1b[32m') && line.includes(' +')) {
          // Green addition line
          const ansiEscape = String.fromCharCode(27);
          const cleanLine = line.replace(new RegExp(`${ansiEscape.replace(/[.*+?^${}()|\\[\\]\\\\]/g, '\\$&')}\\[\\d+m`, 'g'), '');
          parts.push(<Text key={`${lineIndex}-green`} color="green">{cleanLine}</Text>);
        } else if (line.includes('\x1b[31m') && line.includes(' -')) {
          // Red deletion line
          const ansiEscape = String.fromCharCode(27);
          const cleanLine = line.replace(new RegExp(`${ansiEscape.replace(/[.*+?^${}()|\\[\\]\\\\]/g, '\\$&')}\\[\\d+m`, 'g'), '');
          parts.push(<Text key={`${lineIndex}-red`} color="red">{cleanLine}</Text>);
        } else if (line.includes('\x1b[32m') && line.includes('✅')) {
          // Green summary line
          const ansiEscape = String.fromCharCode(27);
          const cleanLine = line.replace(new RegExp(`${ansiEscape.replace(/[.*+?^${}()|\\[\\]\\\\]/g, '\\$&')}\\[\\d+m`, 'g'), '');
          parts.push(<Text key={`${lineIndex}-summary`} color="green">{cleanLine}</Text>);
        } else if (line.includes('\x1b[36m')) {
          // Cyan header line
          const ansiEscape = String.fromCharCode(27);
          const cleanLine = line.replace(new RegExp(`${ansiEscape.replace(/[.*+?^${}()|\\[\\]\\\\]/g, '\\$&')}\\[\\d+m`, 'g'), '');
          parts.push(<Text key={`${lineIndex}-cyan`} color="cyan">{cleanLine}</Text>);
        } else {
          // Context line or other content
          const ansiEscape = String.fromCharCode(27);
          const cleanLine = line.replace(new RegExp(`${ansiEscape.replace(/[.*+?^${}()|\\[\\]\\\\]/g, '\\$&')}\\[\\d+m`, 'g'), '');
          parts.push(<Text key={`${lineIndex}-context`}>{cleanLine}</Text>);
        }
      });

      return parts;
    };

    return (
      <Text wrap="wrap" dimColor={false}>
        {parseAnsiAndRender(content)}
      </Text>
    );
  } catch (error: any) {
    // Fallback on rendering failure
    return (
      <Text wrap="wrap" dimColor={false} color="red">
        Error rendering colored diff: {error.message}
        {'\n'}
        {content}
      </Text>
    );
  }
}