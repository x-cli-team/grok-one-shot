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
  
  // Enhanced: Handle comprehensive tech terms and code patterns
  result = result.replace(/(view_file|str_replace_editor|create_file|search|semantic_search|ast_parser|package\.json|README\.md|GROK\.md|install\.sh|docs-getter\.sh|dist\/|src\/|scripts\/|apps\/|node_modules|\.git|\.js|\.ts|\.json|\.sh|\.md|bun\s+install|npm\s+install|npm\s+start|bun\s+start|TypeScript|React|Ink|ESLint|Husky|tsup|Vercel|GitHub|API|CLI|MCP|tsconfig\.json|\.env|\.gitignore|\.npmrc|package-lock\.json|bun\.lock|docs-index\.md|\.github\/|\.husky\/|\/Users\/[^\s]+|Grok\s+API|xAI|x\.ai)/g, (match) => chalk.cyan(match));
  
  // Enhanced: Section headers more prominent
  result = result.replace(/\b(Overview|Key Features|Tech Stack|Current State|Purpose & Value|Structure)\b/g, (match) => chalk.bold.cyan(match));
  
  // Enhanced: Dim parenthetical metadata
  result = result.replace(/(\([^)]*(?:v\d+\.\d+\.\d+|v\d+\.\d+|\d+k?[+]?\s*(?:files?|lines?|items?|packages?|deps?|subdirs?|MB|KB|GB)|\d+\.\d+[xX]|~\d+[A-Z]*|dependencies?|scripts?|guides?|overview|project\s+docs?|source\s+code|detailed\s+setup|changelog|debugging|session\s+files?|build\s+artifacts|latest\s+release|current\s+Directory|for\s+CLI|via\s+Ink|xAI)[^)]*\))/g, (match) => chalk.gray.dim(match));
  
  // Enhanced: Dim standalone version numbers and metrics
  result = result.replace(/(\b(?:v\d+\.\d+\.\d+|v\d+\.\d+|~\d+[A-Z]+|\d+k?\+?\s*(?:files?|lines?|packages?|deps?|items?)|\d+\.\d+[xX])\b)/g, (match) => chalk.gray.dim(match));
  
  // Handle checkmarks and status indicators - make them green
  result = result.replace(/(✅|✓)/g, (match) => chalk.green(match));
  
  // Handle warning/error indicators - appropriate colors
  result = result.replace(/(❌|✗)/g, (match) => chalk.red(match));
  result = result.replace(/(⚠️|⚠)/g, (match) => chalk.yellow(match));
  
  // Handle info indicators - blue
  result = result.replace(/(ℹ️|💡|🔍)/g, (match) => chalk.blue(match));
  
  return result;
}