// Simple console markdown renderer for headless mode
// Converts markdown to ANSI-colored terminal output

import chalk from 'chalk';

export function renderMarkdownToConsole(content: string): string {
  let result = content;
  
  // Handle headers (convert to bold white text without the #) - CC style
  result = result.replace(/^#+\s+(.*)$/gm, (_, text) => chalk.bold.white(text));
  
  // Handle bold (**text**) - Primary emphasis in CC
  result = result.replace(/\*\*(.*?)\*\*/g, (_, text) => chalk.bold.white(text));
  
  // Handle italic (_text_) - Subtle emphasis in CC  
  result = result.replace(/_(.*?)_/g, (_, text) => chalk.italic.gray(text));
  
  // Handle code blocks (`code`) - CC uses cyan for commands
  result = result.replace(/`([^`]+)`/g, (_, text) => chalk.cyan(text));
  
  // Handle checkmarks and status indicators - make them green
  result = result.replace(/(✅|✓)/g, (match) => chalk.green(match));
  
  // Handle warning/error indicators - appropriate colors
  result = result.replace(/(❌|✗)/g, (match) => chalk.red(match));
  result = result.replace(/(⚠️|⚠)/g, (match) => chalk.yellow(match));
  
  // Handle info indicators - blue
  result = result.replace(/(ℹ️|💡|🔍)/g, (match) => chalk.blue(match));
  
  return result;
}