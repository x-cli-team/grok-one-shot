/**
 * Centralized color palette for consistent UI styling
 * Based on Claude Code's design principles and terminal compatibility
 * Now with adaptive terminal theme detection
 */

/**
 * Detects terminal background and returns appropriate text color
 */
function detectTerminalTheme(): 'light' | 'dark' | 'auto' {
  // Check environment variables that terminals set
  const colorFgBg = process.env.COLORFGBG;
  const termBackground = process.env.TERM_BACKGROUND;
  const grokTextColor = process.env.GROK_TEXT_COLOR;
  
  // Allow manual override
  if (grokTextColor) {
    return grokTextColor.toLowerCase().includes('light') ? 'light' : 'dark';
  }
  
  // Check COLORFGBG (format: "foreground;background")
  if (colorFgBg) {
    const parts = colorFgBg.split(';');
    if (parts.length >= 2) {
      const bg = parseInt(parts[1]);
      // Background colors 0-7 are dark, 8-15 are light
      return bg >= 8 ? 'light' : 'dark';
    }
  }
  
  // Check TERM_BACKGROUND
  if (termBackground) {
    return termBackground.toLowerCase() === 'light' ? 'light' : 'dark';
  }
  
  // Check terminal type hints
  const term = process.env.TERM || '';
  const termProgram = process.env.TERM_PROGRAM || '';
  
  // Some terminals default to light themes
  if (termProgram.includes('Apple_Terminal') || 
      termProgram.includes('Terminal.app') ||
      term.includes('xterm-256color')) {
    // Default to dark for safety, but could be made smarter
    return 'dark';
  }
  
  // Default to dark theme (safer assumption)
  return 'dark';
}

/**
 * Get adaptive text color based on terminal theme
 */
function getAdaptiveTextColor(): string {
  const theme = detectTerminalTheme();
  
  // Debug info (can be enabled with GROK_DEBUG_COLORS=1)
  if (process.env.GROK_DEBUG_COLORS) {
    console.error(`[Color Debug] Theme: ${theme}, COLORFGBG: ${process.env.COLORFGBG}, TERM_BACKGROUND: ${process.env.TERM_BACKGROUND}, TERM_PROGRAM: ${process.env.TERM_PROGRAM}`);
  }
  
  switch (theme) {
    case 'light':
      return 'black';
    case 'dark':
      return 'white';
    default:
      // Auto mode - try to be smart
      return 'white'; // Most terminals are dark by default
  }
}

/**
 * Export for testing/debugging
 */
export const colorUtils = {
  detectTerminalTheme,
  getAdaptiveTextColor,
};

export const colors = {
  // Primary colors
  primary: '#0066CC',       // Claude blue
  accent: '#8B5CF6',        // Purple for special states
  
  // Status colors
  success: '#00A86B',       // Green - successful operations
  warning: '#FF8C00',       // Orange - warnings and processing
  error: '#FF4444',         // Red - errors and failures
  info: '#0066CC',          // Blue - informational content
  
  // UI colors
  muted: '#6B7280',         // Gray - secondary text
  text: '#000000',          // Black - primary text (force visible)
  background: '#000000',    // Black - background
  
  // Spinner and progress colors
  search: '#0066CC',        // Blue - searching/indexing operations
  process: '#FF8C00',       // Orange - processing/thinking
  write: '#00A86B',         // Green - writing/editing operations
  compact: '#8B5CF6',       // Purple - compacting/optimizing
  
  // Context awareness colors
  workspace: '#FFFF00',     // Yellow - workspace/file operations
  memory: '#8B5CF6',        // Magenta - memory/session operations
  index: '#00A86B',         // Green - indexing status
  session: '#FF8C00',       // Orange - session status
};

/**
 * Ink color names mapped to our palette
 * Use these with Ink's Text color prop
 */
export const inkColors = {
  primary: 'cyan',
  success: 'green', 
  warning: 'yellow',
  error: 'red',
  info: 'blue',
  muted: 'gray',
  accent: 'magenta',
  text: process.env.FORCE_TEXT_COLOR || getAdaptiveTextColor(), // Adaptive text color
  
  // Bright variants
  primaryBright: 'cyanBright',
  successBright: 'greenBright',
  warningBright: 'yellowBright',
  errorBright: 'redBright',
  infoBright: 'blueBright',
  accentBright: 'magentaBright',
} as const;

/**
 * Get appropriate color for spinner states
 */
export function getSpinnerColor(operation: string): keyof typeof inkColors {
  switch (operation.toLowerCase()) {
    case 'search':
    case 'indexing':
    case 'scanning':
      return 'info';
      
    case 'process':
    case 'thinking':
    case 'analyzing':
      return 'warning';
      
    case 'write':
    case 'edit':
    case 'create':
      return 'success';
      
    case 'compact':
    case 'optimize':
    case 'memory':
      return 'accent';
      
    default:
      return 'primary';
  }
}

/**
 * Context status colors for the startup banner
 */
export const contextColors = {
  dynamic: 'primary',
  onDemand: 'warning',
  indexed: 'success',
  notIndexed: 'muted',
  restored: 'accent',
  fresh: 'info',
} as const;