import React from "react";
import { Box, Text } from "ink";

interface FileContentRendererProps {
  content: string;
}

export function FileContentRenderer({ content }: FileContentRendererProps) {
  const lines = content.split("\n");

  // Calculate minimum indentation like DiffRenderer does
  let baseIndentation = Infinity;
  for (const line of lines) {
    if (line.trim() === "") continue;
    const firstCharIndex = line.search(/\S/);
    const currentIndent = firstCharIndex === -1 ? 0 : firstCharIndex;
    baseIndentation = Math.min(baseIndentation, currentIndent);
  }
  if (!isFinite(baseIndentation)) {
    baseIndentation = 0;
  }

  return (
    <Box flexDirection="column">
      {lines.map((line, index) => {
        const displayContent = line.substring(baseIndentation);
        return (
          <Text key={index} color="gray">
            {displayContent}
          </Text>
        );
      })}
    </Box>
  );
}