/**
 * Regex utility functions for safe regex construction and escaping
 * Helps prevent regex errors like "Unterminated character class"
 */

export class RegexUtils {
  /**
   * Escapes all regex special characters in a string to make it safe for regex construction
   * @param input - The string to escape
   * @returns The escaped string safe for use in regex patterns
   */
  static escapeRegex(input: string): string {
    // Escape all regex special characters
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Creates a RegExp object safely with error handling
   * @param pattern - The regex pattern (should be pre-escaped if needed)
   * @param flags - Regex flags (default: 'i' for case-insensitive)
   * @returns RegExp object or null if creation fails
   */
  static createSafeRegex(pattern: string, flags: string = 'i'): RegExp | null {
    try {
      return new RegExp(pattern, flags);
    } catch (error: any) {
      console.warn(`[RegexUtils] Failed to create regex pattern: ${pattern}`, error.message);
      return null;
    }
  }

  /**
   * Performs fuzzy matching with multiple fallback strategies
   * @param content - The full text to search in
   * @param searchStr - The string to find (may contain special chars)
   * @returns The matched string or null if not found
   */
  static findFuzzyMatch(content: string, searchStr: string): string | null {
    try {
      // First try exact match
      if (content.includes(searchStr)) {
        return searchStr;
      }

      // Escape the search string for safe regex construction
      const escapedSearch = this.escapeRegex(searchStr);

      // Try fuzzy regex match with word boundaries and optional spaces
      const fuzzyPattern = escapedSearch
        .split(/\s+/)
        .map(word => this.escapeRegex(word)) // Extra safety
        .join('\\s*');

      const fuzzyRegex = this.createSafeRegex(`\\b${fuzzyPattern}\\b`, 'i');
      if (fuzzyRegex) {
        const match = content.match(fuzzyRegex);
        if (match) {
          return match[0];
        }
      }

      // Fallback: simple Levenshtein-like closest match
      return this.findClosestMatch(content, searchStr);

    } catch (error: any) {
      console.warn(`[RegexUtils] Fuzzy match failed for: ${searchStr.substring(0, 50)}`, error.message);
      return null;
    }
  }

  /**
   * Finds the closest matching line using Levenshtein distance
   * @param content - Text to search
   * @param target - Target string
   * @param maxDistance - Maximum allowed distance (default: min(length/2, 5))
   * @returns Closest matching line or null
   */
  private static findClosestMatch(content: string, target: string, maxDistance?: number): string | null {
    const lines = content.split('\n');
    let bestMatch: string | null = null;
    let bestDistance = Infinity;

    const threshold = maxDistance ?? Math.min(target.length / 2, 5);

    for (const line of lines) {
      const distance = this.levenshteinDistance(line.trim(), target);
      if (distance < bestDistance && distance <= threshold) {
        bestDistance = distance;
        bestMatch = line.trim();
      }
    }

    return bestMatch;
  }

  /**
   * Calculates Levenshtein distance between two strings
   * @param a - First string
   * @param b - Second string
   * @returns Edit distance
   */
  private static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Validates if a string contains potentially problematic regex characters
   * @param input - String to check
   * @returns true if contains regex special chars that might cause issues
   */
  static hasRegexSpecialChars(input: string): boolean {
    return /[.*+?^${}()|[\]\\]/.test(input);
  }
}