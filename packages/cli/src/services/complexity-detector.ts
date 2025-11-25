export function detectComplexity(input: string): boolean {
  const complexPatterns = [
    /implement|run|build|refactor|sprint|workflow|add feature|create system/i,
    input.length > 50 // Fallback for long queries
  ];
  return complexPatterns.some(p => typeof p === 'boolean' ? p : p.test(input));
}