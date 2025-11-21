import { useEffect } from 'react';
import { GrokAgent, ChatEntry } from '../agent/grok-agent.js';
import { GrokToolCall } from '../grok/client.js';

export interface StreamingState {
  isProcessing: boolean;
  isStreaming: boolean;
  setIsProcessing: (processing: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setTokenCount: (count: number) => void;
  setChatHistory: (updater: (prev: ChatEntry[]) => ChatEntry[]) => void;
}

export function useStreaming(
  agent: GrokAgent | null,
  initialMessage: string | undefined,
  setChatHistory: (updater: (prev: ChatEntry[]) => ChatEntry[]) => void,
  streamingState: StreamingState
): void {
  const { setIsProcessing, setIsStreaming, setTokenCount } = streamingState;

  useEffect(() => {
    if (initialMessage && agent) {
      const userEntry: ChatEntry = {
        type: "user",
        content: initialMessage,
        timestamp: new Date(),
      };
      setChatHistory(() => [userEntry]);

      const processInitialMessage = async () => {
        setIsProcessing(true);
        setIsStreaming(true);

        try {
          let streamingEntry: ChatEntry | null = null;
          let accumulatedContent = "";
          let lastTokenCount = 0;
          let pendingToolCalls: GrokToolCall[] | null = null;
          let pendingToolResults: Array<{ toolCall: GrokToolCall; toolResult: any }> = [];
          let lastUpdateTime = Date.now();

          const flushUpdates = () => {
            const now = Date.now();
            if (now - lastUpdateTime < 50) return; // Reduced throttle for better responsiveness

            // Batch all chat history updates into a single setState call
            setChatHistory((prev) => {
              let newHistory = [...prev];

              // Update token count if changed
              if (lastTokenCount !== 0) {
                // Note: token count is handled separately, not in chat history
              }

              // Handle accumulated content
              if (accumulatedContent) {
                if (!streamingEntry) {
                  const newStreamingEntry = {
                    type: "assistant" as const,
                    content: accumulatedContent,
                    timestamp: new Date(),
                    isStreaming: true,
                  };
                  newHistory.push(newStreamingEntry);
                  streamingEntry = newStreamingEntry;
                } else {
                  const lastIdx = newHistory.length - 1;
                  if (lastIdx >= 0 && newHistory[lastIdx].isStreaming) {
                    const newContent = newHistory[lastIdx].content + accumulatedContent;
                    newHistory[lastIdx] = { ...newHistory[lastIdx], content: newContent };
                  }
                }
                accumulatedContent = "";
              }

              // Handle pending tool calls
              if (pendingToolCalls) {
                // Mark streaming entry as complete
                const streamingIdx = newHistory.findIndex(entry => entry.isStreaming);
                if (streamingIdx >= 0) {
                  newHistory[streamingIdx] = { ...newHistory[streamingIdx], isStreaming: false, toolCalls: pendingToolCalls };
                }
                streamingEntry = null;

                // Add individual tool call entries
                pendingToolCalls.forEach((toolCall) => {
                  const toolCallEntry: ChatEntry = {
                    type: "tool_call",
                    content: "Executing...",
                    timestamp: new Date(),
                    toolCall: toolCall,
                  };
                  newHistory.push(toolCallEntry);
                });
                pendingToolCalls = null;
              }

              // Handle pending tool results
              if (pendingToolResults.length > 0) {
                newHistory = newHistory.map((entry) => {
                  if (entry.isStreaming) {
                    return { ...entry, isStreaming: false };
                  }
                  // Update matching tool_call entries
                  const matchingResult = pendingToolResults.find(
                    (result) => entry.type === "tool_call" && entry.toolCall?.id === result.toolCall.id
                  );
                  if (matchingResult) {
                    return {
                      ...entry,
                      type: "tool_result",
                      content: matchingResult.toolResult.success
                        ? matchingResult.toolResult.output || "Success"
                        : matchingResult.toolResult.error || "Error occurred",
                      toolResult: matchingResult.toolResult,
                    };
                  }
                  return entry;
                });
                streamingEntry = null;
                pendingToolResults = [];
              }

              return newHistory;
            });

            // Update token count separately
            if (lastTokenCount !== 0) {
              setTokenCount(lastTokenCount);
            }

            lastUpdateTime = now;
          };

          for await (const chunk of agent.processUserMessageStream(initialMessage)) {
            switch (chunk.type) {
              case "content":
                if (chunk.content) {
                  accumulatedContent += chunk.content;
                }
                break;

              case "token_count":
                if (chunk.tokenCount !== undefined) {
                  lastTokenCount = chunk.tokenCount;
                }
                break;

              case "tool_calls":
                if (chunk.toolCalls) {
                  pendingToolCalls = chunk.toolCalls;
                }
                break;

              case "tool_result":
                if (chunk.toolCall && chunk.toolResult) {
                  pendingToolResults.push({ toolCall: chunk.toolCall, toolResult: chunk.toolResult });
                }
                break;

              case "done":
                // Flush all remaining updates
                flushUpdates();
                break;
            }

            // Flush updates periodically
            flushUpdates();
          }

          // Final flush and cleanup - ensure all content is displayed
          flushUpdates();
          // Force one more flush after a short delay to catch any remaining content
          setTimeout(() => {
            flushUpdates();
          }, 10);
          
          if (streamingEntry) {
            setChatHistory((prev) =>
              prev.map((entry) =>
                entry.isStreaming ? { ...entry, isStreaming: false } : entry
              )
            );
          }
          setIsStreaming(false);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorEntry: ChatEntry = {
            type: "assistant",
            content: `Error: ${errorMessage}`,
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, errorEntry]);
          setIsStreaming(false);
        }

        setIsProcessing(false);
      };

      processInitialMessage();
    }
  }, [initialMessage, agent, setChatHistory, setIsProcessing, setIsStreaming, setTokenCount]);
}