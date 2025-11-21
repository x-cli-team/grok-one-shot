import { Box, Text } from "ink";
import pkg from '../../../package.json' with { type: 'json' };
import { inkColors } from "../colors.js";
import { ContextStatus } from "./context-status.js";

// Enhanced Grok One-Shot ASCII art with color scheme
export const xcliBanner = `
_____/\\\\\\\\\\\\\\\\\\\\\\\\______/\\\\\\\\\\____        
 ___/\\\\\\\\//////////___/\\\\\\\\\\\\\\\\____       
  __/\\\\\\_____________\\\\/////\\\/\\\\\____    
   _\\\\/\\\\\\\\____/\\\\\\\\\\\\\\_____\\\\/\\\\\____     
    _\\\\/\\\\\\\\___\\\/////\\\\\\_____\\\\/\\\\____    
     _\\\\/\\\\\\_______\\\\/\\\\\\_____\\\\/\\\\\____   
      _\\\\/\\\\\\_______\\\\/\\\\\\_____\\\\/\\\\\____
       _\\\\//\\\\\\\\\\\\\\\\\\\\\\/________\\\\/\\\\\\\\__ 
        __\\\\////////////_________\\\\/\\//___ 
`;

// Logo-based banner (simplified for terminal)
export const xcliLogo = `
    ⭕ Grok One-Shot ⭕
   🔴🟡🟢🔵 v{VERSION}
`;

// Alternative minimal banner for --quiet mode
export const xcliMini = `
 ██████╗  ██╗
██╔════╝ ███║
██║  ███╗╚██║
██║   ██║ ██║
╚██████╔╝ ██║
 ╚═════╝  ╚═╝
`;

// Retro style banner
export const xcliRetro = `
╔═══════════════════════════════════════════════════════╗
║   ██████╗ ██████╗  ██████╗ ██╗  ██╗     ██████╗ ██╗   ║
║  ██╔════╝ ██╔══██╗██╔═══██╗██║ ██╔╝    ██╔════╝███║   ║
║  ██║  ███╗██████╔╝██║   ██║█████╔╝     ██║  ███╗╚██║   ║
║  ██║   ██║██╔══██╗██║   ██║██╔═██╗     ██║   ██║ ██║   ║
║  ╚██████╔╝██║  ██║╚██████╔╝██║  ██╗    ╚██████╔╝ ██║   ║
║   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝     ╚═════╝  ╚═╝   ║
╚═══════════════════════════════════════════════════════╝
`;

interface BannerProps {
  style?: 'default' | 'mini' | 'retro';
  showContext?: boolean;
  workspaceFiles?: number;
  indexSize?: string;
  sessionRestored?: boolean;
  asciiArt?: string;
}

export function Banner({ 
  style = 'default', 
  showContext = true,
  workspaceFiles = 0,
  indexSize = '0 MB',
  sessionRestored = false 
}: BannerProps) {
  const getBannerArt = () => {
    switch (style) {
      case 'mini': return xcliMini;
      case 'retro': return xcliRetro;
      default: return xcliBanner;
    }
  };

  const getContextStatus = () => {
    if (!showContext) return null;
    
    return (
      <Box marginTop={1}>
        <Text color={inkColors.muted}>Context: </Text>
        <ContextStatus
          workspaceFiles={workspaceFiles}
          indexSize={indexSize}
          sessionRestored={sessionRestored}
          showDetails={false}
        />
        <Text color={inkColors.muted}> · Press </Text>
        <Text color={inkColors.accent} bold>Ctrl+I</Text>
        <Text color={inkColors.muted}> for details</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" marginBottom={2}>
      {/* ASCII Art Banner */}
      <Text color={inkColors.accentBright}>
        {getBannerArt()}
      </Text>
      
      {/* Welcome Message */}
      <Box marginTop={1}>
        <Text color={inkColors.muted}>Welcome to </Text>
        <Text color={inkColors.primary} bold>Grok One-Shot</Text>
        <Text color={inkColors.muted}> </Text>
        <Text color={inkColors.warning}>v{pkg.version}</Text>
        <Text color={inkColors.muted}> ⚡</Text>
      </Box>
      
      {/* Claude Code-level Intelligence tagline */}
      <Box marginTop={1}>
        <Text color={inkColors.success} bold>
          🚀 Claude Code-level intelligence in your terminal!
        </Text>
      </Box>
      
      {/* Context Status Banner */}
      {getContextStatus()}
      
      {/* Ready indicator with pulsing effect simulation */}
      <Box marginTop={1}>
        <Text color={inkColors.successBright}>✔ Ready.</Text>
        <Text color={inkColors.muted}> Type your first command or paste code to begin.</Text>
      </Box>
    </Box>
  );
}

// Helper function for showing different banner styles
export function showBanner(options?: {
  style?: 'default' | 'mini' | 'retro';
  quiet?: boolean;
  workspaceFiles?: number;
  indexSize?: string;
  sessionRestored?: boolean;
}) {
  const { style = 'default', quiet = false, ...contextProps } = options || {};
  
  if (quiet) {
    return (
      <Box>
        <Text color={inkColors.primary} bold>Grok One-Shot</Text>
        <Text color={inkColors.muted}> v{pkg.version} ready ⚡</Text>
      </Box>
    );
  }
  
  return <Banner style={style} showContext={true} {...contextProps} />;
}

// Secret easter egg banner for grok-one-shot --ascii
export const easterEggBanner = `
${`
  ██████╗ ██████╗  ██████╗ ██╗  ██╗     ██████╗██╗     ██╗
 ██╔════╝ ██╔══██╗██╔═══██╗██║ ██╔╝    ██╔════╝██║     ██║
 ██║  ███╗██████╔╝██║   ██║█████╔╝     ██║     ██║     ██║
 ██║   ██║██╔══██╗██║   ██║██╔═██╗     ██║     ██║     ██║
 ╚██████╔╝██║  ██║╚██████╔╝██║  ██╗    ╚██████╗███████╗██║
  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝     ╚═════╝╚══════╝╚═╝
`}
    🌟 "Code at the speed of thought" 🌟
`;

export function EasterEggBanner() {
  return (
    <Box flexDirection="column" alignItems="center">
      <Text color="rainbow">{easterEggBanner}</Text>
      <Text color="gray" italic>You found the secret banner! 🎉</Text>
    </Box>
  );
}