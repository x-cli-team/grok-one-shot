import pkg from '../../package.json' with { type: 'json' };

export function printWelcomeBanner(_quiet = false): void {
  // Disabled: Welcome banner is now handled by React/Ink components in banner.tsx
  // This prevents duplicate banners from appearing on startup.
  return;
}

export function useConsoleSetup(_quiet = false): void {
  // Banner printing is now handled before React render in index.ts
  // This hook is kept for potential future use or to maintain API compatibility
}