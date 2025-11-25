import React from "react";
import { ChatEntry } from "../../agent/grok-agent.js";
import { UserMessageEntry } from "./chat-entries/user-message-entry.js";
import { AssistantMessageEntry } from "./chat-entries/assistant-message-entry.js";
import { ToolCallEntry } from "./chat-entries/tool-call-entry.js";

interface ChatEntryRouterProps {
  entry: ChatEntry;
  verbosityLevel: 'quiet' | 'normal' | 'verbose';
  explainLevel: 'off' | 'brief' | 'detailed';
}

export function ChatEntryRouter({ entry, verbosityLevel, explainLevel }: ChatEntryRouterProps) {
  switch (entry.type) {
    case "user":
      return <UserMessageEntry entry={entry} verbosityLevel={verbosityLevel} />;

    case "assistant":
      return <AssistantMessageEntry entry={entry} verbosityLevel={verbosityLevel} />;

    case "tool_call":
    case "tool_result":
      return <ToolCallEntry entry={entry} verbosityLevel={verbosityLevel} explainLevel={explainLevel} />;

    default:
      return null;
  }
}