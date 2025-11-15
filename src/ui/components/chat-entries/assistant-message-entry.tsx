import React from "react";
import { Box, Text } from "ink";
import { ChatEntry } from "../../../agent/grok-agent.js";
import { MarkdownRenderer } from "../../utils/markdown-renderer.js";
import { inkColors } from "../../colors.js";

interface AssistantMessageEntryProps {
  entry: ChatEntry;
  verbosityLevel: 'quiet' | 'normal' | 'verbose';
}

// Helper to handle very long content that might cause rendering issues
const handleLongContent = (content: string, maxLength: number = 5000): { content: string; isTruncated: boolean } => {
  if (content.length <= maxLength) {
    return { content, isTruncated: false };
  }

  // For very long content, truncate and provide a summary
  const truncated = content.substring(0, maxLength);
  const summary = `\n\n[Content truncated - ${content.length - maxLength} characters remaining. Full content available in chat history.]`;

  return {
    content: truncated + summary,
    isTruncated: true
  };
};

export function AssistantMessageEntry({ entry, verbosityLevel: _verbosityLevel }: AssistantMessageEntryProps) {
  // Handle very long content to prevent rendering issues
  const { content: processedContent, isTruncated } = handleLongContent(entry.content);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="row" alignItems="flex-start">
        <Text color={inkColors.text}>⏺ </Text>
        <Box flexDirection="column" width="100%">
          <MarkdownRenderer content={processedContent.trim()} />
          {entry.isStreaming && <Text color="cyan">█</Text>}
          {isTruncated && (
            <Text color="yellow" italic>
              [Response truncated for performance - full content in session log]
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}