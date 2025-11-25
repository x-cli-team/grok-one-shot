import React from "react";
import { Box } from "ink";
import { ChatEntry } from "../../agent/grok-agent.js";
import { ChatEntryRouter } from "./chat-entry-router.js";

interface ChatHistoryProps {
  entries: ChatEntry[];
  isConfirmationActive?: boolean;
  verbosityLevel?: 'quiet' | 'normal' | 'verbose';
  explainLevel?: 'off' | 'brief' | 'detailed';
}

// These helpers are now in the individual entry components where they're used

// Memoized ChatEntry component to prevent unnecessary re-renders
const MemoizedChatEntry = React.memo(
  ({ entry, verbosityLevel, explainLevel }: { entry: ChatEntry; verbosityLevel: 'quiet' | 'normal' | 'verbose'; explainLevel: 'off' | 'brief' | 'detailed' }) => {
    return <ChatEntryRouter entry={entry} verbosityLevel={verbosityLevel} explainLevel={explainLevel} />;
  }
);

MemoizedChatEntry.displayName = "MemoizedChatEntry";

export function ChatHistory({
  entries,
  isConfirmationActive = false,
  verbosityLevel = 'quiet',
  explainLevel = 'brief',
}: ChatHistoryProps) {
  // Filter out tool_call entries with "Executing..." when confirmation is active
  const filteredEntries = isConfirmationActive
    ? entries.filter(
        (entry) =>
          !(entry.type === "tool_call" && entry.content === "Executing...")
      )
    : entries;

  // Compact mode: show fewer entries to reduce rendering overhead
  const maxEntries = process.env.COMPACT === '1' ? 5 : 20;

  return (
    <Box flexDirection="column">
      {filteredEntries.slice(-maxEntries).map((entry, index) => (
        <MemoizedChatEntry
          key={`${entry.timestamp.getTime()}-${index}`}
          entry={entry}
          verbosityLevel={verbosityLevel}
          explainLevel={explainLevel}
        />
      ))}
    </Box>
  );
}
