import React from 'react';
import { Text } from 'ink';
import { ColoredDiffRenderer } from '../components/colored-diff-renderer.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Session logging helper - use the main session log file
function logToSession(message: string, data?: any) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `\n[${timestamp}] 🎨 MARKDOWN RENDERER - ${message}\n=====================================\n${data ? JSON.stringify(data, null, 2) : 'No additional data'}\n=====================================\n`;
    
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
      console.log(`[MarkdownRenderer] ${message}`, data);
    }
  } catch (error) {
    // Fallback to console if session logging fails
    console.log(`[MarkdownRenderer] ${message}`, data);
    console.error('[MarkdownRenderer] Session logging failed:', error);
  }
}

export function MarkdownRenderer({ content }: { content: string }) {
  try {
    // Check if content contains colored diff (ANSI escape codes)
    const ansiEscape = String.fromCharCode(27);
    const hasAnsiColors = new RegExp(`${ansiEscape.replace(/[.*+?^${}()|\\[\\]\\\\]/g, '\\$&')}\\[\\d+m`).test(content);
    const hasDiffMarkers = /^[\+\-\s].*$/m.test(content);
    
    // Enhanced debugging with session logging
    logToSession('Content analysis', {
      contentLength: content.length,
      contentPreview: content.substring(0, 200),
      hasAnsiColors,
      hasDiffMarkers,
      ansiEscapeUsed: ansiEscape.charCodeAt(0),
      regexPattern: `${ansiEscape.replace(/[.*+?^${}()|\\[\\]\\\\]/g, '\\$&')}\\[\\d+m`
    });
    
    if (hasAnsiColors && hasDiffMarkers) {
      logToSession('Using ColoredDiffRenderer for ANSI + diff content');
      // For colored diffs, use specialized renderer
      return <ColoredDiffRenderer content={content} />;
    }
    
    // Simple approach: just handle inline formatting, keep everything else natural
    return <InlineMarkdown content={content} />;
  } catch (error) {
    // Fallback to plain text if markdown parsing fails
    console.error('Markdown rendering error:', error);
    return <Text wrap="wrap" dimColor={false}>{content}</Text>;
  }
}

function InlineMarkdown({ content }: { content: string }) {
  // Split by lines first to preserve line breaks
  const lines = content.split('\n');
  
  return (
    <Text wrap="wrap" dimColor={false}>
      {lines.map((line, lineIndex) => {
        const parts = parseInlineMarkdown(line);
        // Convert empty lines to paragraph breaks for proper spacing
        if (parts.length === 0) {
          return (
            <React.Fragment key={lineIndex}>
              {lineIndex > 0 && '\n\n'}
            </React.Fragment>
          );
        }
        
        return (
          <React.Fragment key={lineIndex}>
            {lineIndex > 0 && '\n'}
            {parts.map((part, partIndex) => {
            if (part.type === 'header') {
              return <Text key={`${lineIndex}-${partIndex}`} bold color="white">{part.text}</Text>;
            }
            if (part.type === 'bold') {
              return <Text key={`${lineIndex}-${partIndex}`} bold color="white">{part.text}</Text>;
            }
            if (part.type === 'italic') {
              return <Text key={`${lineIndex}-${partIndex}`} italic color="gray">{part.text}</Text>;
            }
            if (part.type === 'code') {
              return <Text key={`${lineIndex}-${partIndex}`} color="cyan">{part.text}</Text>;
            }
            if (part.type === 'emoji') {
              // Color emojis based on type
              const emoji = part.text;
              if (emoji === '✅' || emoji === '✓') {
                return <Text key={`${lineIndex}-${partIndex}`} color="green">{emoji}</Text>;
              }
              if (emoji === '❌' || emoji === '✗') {
                return <Text key={`${lineIndex}-${partIndex}`} color="red">{emoji}</Text>;
              }
              if (emoji === '⚠️' || emoji === '⚠') {
                return <Text key={`${lineIndex}-${partIndex}`} color="yellow">{emoji}</Text>;
              }
              if (emoji === '💡' || emoji === 'ℹ️' || emoji === '🔍') {
                return <Text key={`${lineIndex}-${partIndex}`} color="blue">{emoji}</Text>;
              }
              return <Text key={`${lineIndex}-${partIndex}`} color="white">{emoji}</Text>;
            }
            if (part.type === 'metadata') {
              // Dim parenthetical info, version numbers, file counts
              return <Text key={`${lineIndex}-${partIndex}`} color="gray" dimColor>{part.text}</Text>;
            }
            if (part.type === 'version') {
              // Dim standalone version numbers and metrics
              return <Text key={`${lineIndex}-${partIndex}`} color="gray" dimColor>{part.text}</Text>;
            }
            if (part.type === 'section') {
              // Make section headers more prominent
              return <Text key={`${lineIndex}-${partIndex}`} bold color="cyan">{part.text}</Text>;
            }
            return <Text key={`${lineIndex}-${partIndex}`} color="white">{part.text}</Text>;
          })}
        </React.Fragment>
        );
      })}
    </Text>
  );
}

interface MarkdownPart {
  type: 'text' | 'bold' | 'italic' | 'header' | 'code' | 'emoji' | 'metadata' | 'version' | 'section';
  text: string;
  level?: number; // for headers
}

function parseInlineMarkdown(content: string): MarkdownPart[] {
  // Enhanced empty line detection - skip empty headers, whitespace, and symbol lines
  if (content.match(/^#+\s*$/) || content.trim() === '' || content.trim() === '⏺' || content.match(/^#+$/)) {
    return []; // Return empty array to skip rendering this line entirely
  }
  
  // First check if this is a header line with text
  const headerMatch = content.match(/^(#+)\s+(.*)$/);
  if (headerMatch) {
    const [, hashes, headerText] = headerMatch;
    return [{ type: 'header', text: headerText.trim(), level: hashes.length }];
  }
  
  const parts: MarkdownPart[] = [];
  let current = '';
  let i = 0;
  
  while (i < content.length) {
    // Handle code blocks (`code`) - improved detection
    if (content[i] === '`' && i < content.length - 1) {
      // Add current text if any
      if (current) {
        parts.push({ type: 'text', text: current });
        current = '';
      }
      
      // Find closing ` - ensure we don't match the same backtick
      const closeIndex = content.indexOf('`', i + 1);
      if (closeIndex !== -1 && closeIndex > i + 1) {
        const codeText = content.substring(i + 1, closeIndex);
        parts.push({ type: 'code', text: codeText });
        i = closeIndex + 1;
        continue;
      }
    }
    
    // Handle bold (**text**)
    if (content.substr(i, 2) === '**') {
      // Add current text if any
      if (current) {
        parts.push({ type: 'text', text: current });
        current = '';
      }
      
      // Find closing **
      const closeIndex = content.indexOf('**', i + 2);
      if (closeIndex !== -1) {
        const boldText = content.substring(i + 2, closeIndex);
        parts.push({ type: 'bold', text: boldText });
        i = closeIndex + 2;
        continue;
      }
    }
    
    // Handle italic (_text_)
    if (content[i] === '_' && content[i + 1] !== '_') {
      // Add current text if any
      if (current) {
        parts.push({ type: 'text', text: current });
        current = '';
      }
      
      // Find closing _
      const closeIndex = content.indexOf('_', i + 1);
      if (closeIndex !== -1) {
        const italicText = content.substring(i + 1, closeIndex);
        parts.push({ type: 'italic', text: italicText });
        i = closeIndex + 1;
        continue;
      }
    }
    
    // Handle emojis
    const char = content[i];
    if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(char)) {
      // Add current text if any
      if (current) {
        parts.push({ type: 'text', text: current });
        current = '';
      }
      
      // Check for specific emoji types for coloring
      parts.push({ type: 'emoji', text: char });
      i++;
      continue;
    }
    
    // Regular character
    current += content[i];
    i++;
  }
  
  // Add remaining text with enhanced code detection
  if (current) {
    // Enhanced: Detect common code patterns even without backticks  
    const codePattern = /(view_file|str_replace_editor|create_file|search|semantic_search|ast_parser|package\.json|README\.md|GROK\.md|install\.sh|docs-getter\.sh|dist\/|src\/|scripts\/|apps\/|node_modules|\.git|\.js|\.ts|\.json|\.sh|\.md|bun\s+install|npm\s+install|npm\s+start|bun\s+start|TypeScript|React|Ink|ESLint|Husky|tsup|Vercel|GitHub|API|CLI|MCP|tsconfig\.json|\.env|\.gitignore|\.npmrc|package-lock\.json|bun\.lock|docs-index\.md|\.github\/|\.husky\/|\/Users\/[^\s]+|Grok\s+API|xAI|x\.ai)/g;
    
    // Detect parenthetical metadata for dimming (enhanced)
    const metadataPattern = /(\([^)]*(?:v\d+\.\d+\.\d+|v\d+\.\d+|\d+k?[+]?\s*(?:files?|lines?|items?|packages?|deps?|subdirs?|MB|KB|GB)|\d+\.\d+[xX]|~\d+[A-Z]*|dependencies?|scripts?|guides?|overview|project\s+docs?|source\s+code|detailed\s+setup|changelog|debugging|session\s+files?|build\s+artifacts|latest\s+release|current\s+Directory|for\s+CLI|via\s+Ink|xAI)[^)]*\))/g;
    
    // Enhanced: Also detect standalone version numbers and metrics for dimming
    const versionPattern = /(\b(?:v\d+\.\d+\.\d+|v\d+\.\d+|~\d+[A-Z]+|\d+k?\+?\s*(?:files?|lines?|packages?|deps?|items?)|\d+\.\d+[xX])\b)/g;
    
    // Simplified single-pass pattern detection to fix duplication issues
    const enhancedParts: MarkdownPart[] = [];
    let processedText = current;
    let lastIndex = 0;
    let match;
    
    // Apply all patterns in one pass to avoid duplication
    const combinedPattern = new RegExp(`(${codePattern.source})|(${metadataPattern.source})|\\b(Overview|Key Features|Tech Stack|Current State|Purpose & Value|Structure)\\b`, 'g');
    
    while ((match = combinedPattern.exec(processedText)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        enhancedParts.push({ type: 'text', text: processedText.substring(lastIndex, match.index) });
      }
      
      // Determine match type and add appropriate part
      if (match[1]) {
        // Code pattern match
        enhancedParts.push({ type: 'code', text: match[1] });
      } else if (match[2]) {
        // Metadata pattern match  
        enhancedParts.push({ type: 'metadata', text: match[2] });
      } else if (match[3]) {
        // Section header match
        enhancedParts.push({ type: 'section', text: match[3] });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < processedText.length) {
      enhancedParts.push({ type: 'text', text: processedText.substring(lastIndex) });
    }
    
    const finalParts = enhancedParts;
    
    // Add final parts
    if (finalParts.length === 0) {
      parts.push({ type: 'text', text: current });
    } else {
      parts.push(...finalParts);
    }
  }
  
  return parts;
}