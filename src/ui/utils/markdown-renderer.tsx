import React from 'react';
import { Text } from 'ink';

export function MarkdownRenderer({ content }: { content: string }) {
  try {
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
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          {lineIndex > 0 && '\n'}
          {parseInlineMarkdown(line).map((part, partIndex) => {
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
            return <Text key={`${lineIndex}-${partIndex}`} color="white">{part.text}</Text>;
          })}
        </React.Fragment>
      ))}
    </Text>
  );
}

interface MarkdownPart {
  type: 'text' | 'bold' | 'italic' | 'header' | 'code' | 'emoji' | 'metadata';
  text: string;
  level?: number; // for headers
}

function parseInlineMarkdown(content: string): MarkdownPart[] {
  // Handle empty header lines (just ### with no text) - skip them
  if (content.match(/^#+\s*$/)) {
    return []; // Return empty array to skip rendering this line
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
    const codePattern = /(view_file|str_replace_editor|create_file|search|semantic_search|ast_parser|package\.json|README\.md|GROK\.md|install\.sh|docs-getter\.sh|dist\/|src\/|scripts\/|apps\/|node_modules|\.git|\.js|\.ts|\.json|\.sh|\.md|bun\s+install|npm\s+install)/g;
    
    // Detect parenthetical metadata for dimming
    const metadataPattern = /(\([^)]*(?:v\d+\.\d+|\d+k?[+]?\s*(?:files?|lines?|items?)|\d+\.\d+[xX]|dependencies?|scripts?|guides?|overview|project\s+docs?|source\s+code|detailed\s+setup|changelog|debugging|session\s+files?|build\s+artifacts)[^)]*\))/g;
    
    const enhancedParts: MarkdownPart[] = [];
    let lastIndex = 0;
    let match;
    
    // Apply both patterns in order: code first, then metadata
    let processedText = current;
    const tempParts: MarkdownPart[] = [];
    
    // First pass: Handle code patterns
    lastIndex = 0;
    while ((match = codePattern.exec(processedText)) !== null) {
      if (match.index > lastIndex) {
        tempParts.push({ type: 'text', text: processedText.substring(lastIndex, match.index) });
      }
      tempParts.push({ type: 'code', text: match[0] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < processedText.length) {
      tempParts.push({ type: 'text', text: processedText.substring(lastIndex) });
    }
    
    // Second pass: Handle metadata in text parts only
    const finalParts: MarkdownPart[] = [];
    for (const part of tempParts) {
      if (part.type === 'text') {
        // Apply metadata detection to text parts
        lastIndex = 0;
        metadataPattern.lastIndex = 0; // Reset regex
        while ((match = metadataPattern.exec(part.text)) !== null) {
          if (match.index > lastIndex) {
            finalParts.push({ type: 'text', text: part.text.substring(lastIndex, match.index) });
          }
          finalParts.push({ type: 'metadata', text: match[0] });
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < part.text.length) {
          finalParts.push({ type: 'text', text: part.text.substring(lastIndex) });
        }
        if (finalParts.length === 0 || finalParts[finalParts.length - 1].text !== part.text) {
          // If no metadata found in this text part, add it as is
          if (finalParts.length === 0) {
            finalParts.push(part);
          }
        }
      } else {
        finalParts.push(part);
      }
    }
    
    // Add final parts
    if (finalParts.length === 0) {
      parts.push({ type: 'text', text: current });
    } else {
      parts.push(...finalParts);
    }
  }
  
  return parts;
}