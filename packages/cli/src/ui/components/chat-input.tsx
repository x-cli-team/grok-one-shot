import React from "react";
import { Box, Text } from "ink";

interface ChatInputProps {
  input: string;
  cursorPosition: number;
  isProcessing: boolean;
  isStreaming: boolean;
}

// Global paste cache (now managed at input handler level)
declare global {
  var grokPasteCache: Map<string, string> | undefined;
  var grokPasteCounter: number | undefined;
}

export function ChatInput({
  input,
  cursorPosition,
  isProcessing,
  isStreaming,
}: ChatInputProps) {
  try {
    // Debug logging disabled
    // pasteLog('=== ChatInput render ===');

    // Use the input as provided - input handler now manages summary display properly
    let displayInput = input;

    const beforeCursor = displayInput.slice(0, Math.min(cursorPosition, displayInput.length));
    // afterCursor removed - not used in single line mode

    // Handle multiline input display - support different line endings  
    const lines = displayInput.split(/\r\n|\r|\n/);
    const isMultiline = lines.length > 1;
    
    // Debug logging disabled
  
  // Limit display to reasonable number of lines to prevent terminal overflow
  const MAX_DISPLAY_LINES = 10;
  const shouldTruncateDisplay = lines.length > MAX_DISPLAY_LINES;
  
  // Display handling for large content (paste summaries are now handled at input level)
  if (shouldTruncateDisplay) {
    console.log(`📄 Large content: ${lines.length} lines, showing truncated view`);
  }

  // Calculate cursor position across lines
  let currentLineIndex = 0;
  let currentCharIndex = 0;
  let totalChars = 0;

  for (let i = 0; i < lines.length; i++) {
    if (totalChars + lines[i].length >= cursorPosition) {
      currentLineIndex = i;
      currentCharIndex = cursorPosition - totalChars;
      break;
    }
    totalChars += lines[i].length + 1; // +1 for newline
  }

  const showCursor = !isProcessing && !isStreaming;
  const borderColor = isProcessing || isStreaming ? "yellow" : "blue";
  const promptColor = "cyan";

  // Display placeholder when input is empty
  const placeholderText = "Ask me anything...";
  const isPlaceholder = !input;

  if (isMultiline) {
    return (
      <Box
        borderStyle="round"
        borderColor={borderColor}
        paddingX={1}
        paddingY={0}
        marginTop={1}
        flexDirection="column"
      >
        <Text>
          {shouldTruncateDisplay ? (
            // Show Claude Code style paste summary but don't replace input
            `❯ [Pasted text #${globalThis.grokPasteCounter || 1} +${lines.length} lines]`
          ) : (
            // Normal multiline display for reasonable sizes
            lines.map((line, index) => {
              const isCurrentLine = index === currentLineIndex;
              const promptChar = index === 0 ? "❯ " : "  ";
              
              let lineText = promptChar + line;
              
              // Add cursor if this is the current line
              if (isCurrentLine && showCursor) {
                const cursorPos = promptChar.length + currentCharIndex;
                lineText = lineText.slice(0, cursorPos) + 
                          "█" + 
                          lineText.slice(cursorPos + 1);
              }
              
              return index === lines.length - 1 ? lineText : lineText + "\n";
            }).join("")
          )}
        </Text>
      </Box>
    );
  }

  // Single line input box
  const adjustedCursorPos = Math.min(cursorPosition, displayInput.length);
  const cursorChar = displayInput.slice(adjustedCursorPos, adjustedCursorPos + 1) || " ";
  const afterCursorText = displayInput.slice(adjustedCursorPos + 1);

  return (
    <Box
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      paddingY={0}
      marginTop={1}
    >
      <Box>
        <Text color={promptColor}>❯ </Text>
        {isPlaceholder ? (
          <>
            <Text color="gray" dimColor>
              {placeholderText}
            </Text>
            {showCursor && (
              <Text backgroundColor="white" color="black">
                {" "}
              </Text>
            )}
          </>
        ) : (
          <Text>
            {beforeCursor}
            {showCursor && (
              <Text backgroundColor="white" color="black">
                {cursorChar}
              </Text>
            )}
            {!showCursor && cursorChar !== " " && cursorChar}
            {afterCursorText}
          </Text>
        )}
      </Box>
    </Box>
  );
  } catch (error) {
    console.error('[ERROR] ChatInput component crashed:', error);
    console.error('[ERROR] Stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[ERROR] Input data:', { input: input?.slice(0, 100), cursorPosition, isProcessing, isStreaming });
    
    // Return a safe fallback UI
    return (
      <Box
        borderStyle="round"
        borderColor="red"
        paddingX={1}
        paddingY={0}
        marginTop={1}
      >
        <Text color="red">❯ [Input error - check console]</Text>
      </Box>
    );
  }
}
