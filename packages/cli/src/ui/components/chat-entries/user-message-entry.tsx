import React from "react";
import { Box, Text } from "ink";
import { ChatEntry } from "../../../agent/grok-agent.js";

interface UserMessageEntryProps {
  entry: ChatEntry;
  verbosityLevel: 'quiet' | 'normal' | 'verbose';
}

// Helper to truncate content in compact mode
const truncateContent = (content: string, maxLength: number = 100): string => {
  if (process.env.COMPACT !== '1') return content;
  return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
};

export function UserMessageEntry({ entry, verbosityLevel: _verbosityLevel }: UserMessageEntryProps) {
  const displayText = entry.isPasteSummary ? entry.displayContent || entry.content : entry.content;
  const textColor = entry.isPasteSummary ? "cyan" : "gray";

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text color={textColor}>
          {">"} {truncateContent(displayText)}
        </Text>
      </Box>
    </Box>
  );
}