/**
 * RegexHelper - Safe regex operations with error handling and logging
 * Prevents "Unterminated character class" and other regex errors
 */

export class RegexHelper {
  /**
   * Sanitize input strings for safe regex construction
   * Escapes all regex special characters to prevent pattern errors
   */
  static sanitizeForRegex(input: string): string {
    if (typeof input !== 'string') {
      console.log('RegexHelper.sanitizeForRegex: input is not a string', { input });
      return '';
    }

    // Escape all regex special characters
    const sanitized = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    console.log('RegexHelper.sanitizeForRegex completed', {
      originalLength: input.length,
      sanitizedLength: sanitized.length
    });

    return sanitized;
  }

  /**
   * Create a RegExp safely with error handling
   * Returns null if regex construction fails
   */
  static createSafeRegex(pattern: string, flags: string = 'i'): RegExp | null {
    try {
      const regex = new RegExp(pattern, flags);

      console.log('RegexHelper.createSafeRegex success', {
        pattern: pattern.substring(0, 50),
        flags
      });

      return regex;
    } catch (error: any) {
      console.log('RegexHelper.createSafeRegex failed', {
        pattern: pattern.substring(0, 50),
        flags,
        error: error.message,
        errorName: error.name
      });

      return null;
    }
  }

  /**
   * Find fuzzy match with multiple fallback strategies
   * Progressive fallbacks: exact match -> sanitized regex -> Levenshtein distance
   */
  static findFuzzyMatch(content: string, searchStr: string): string | null {
    if (typeof content !== 'string' || typeof searchStr !== 'string') {
      console.log('RegexHelper.findFuzzyMatch: invalid input types', {
        contentType: typeof content,
        searchStrType: typeof searchStr
      });
      return null;
    }

    console.log('RegexHelper.findFuzzyMatch started', {
      contentLength: content.length,
      searchStrLength: searchStr.length,
      searchStrPreview: searchStr.substring(0, 50)
    });

    try {
      // Strategy 1: Exact substring match (fastest)
      if (content.includes(searchStr)) {
        console.log('RegexHelper.findFuzzyMatch: exact match found');
        return searchStr;
      }

      // Strategy 2: Sanitized regex with word boundaries
      const sanitized = this.sanitizeForRegex(searchStr);
      const fuzzyPattern = sanitized
        .split(/\s+/)
        .map(word => this.sanitizeForRegex(word)) // Extra safety
        .join('\\s*'); // Allow flexible whitespace

      const regex = this.createSafeRegex(`\\b${fuzzyPattern}\\b`, 'i');
      if (regex) {
        const match = content.match(regex);
        if (match) {
          console.log('RegexHelper.findFuzzyMatch: fuzzy regex match found', {
            matched: match[0].substring(0, 50)
          });
          return match[0];
        }
      }

      // Strategy 3: Levenshtein distance fallback (slowest)
      const lines = content.split('\n');
      let bestMatch = null;
      let bestDistance = Infinity;
      const maxDistance = Math.min(searchStr.length / 2, 5); // Reasonable threshold

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) continue;

        const distance = this.levenshteinDistance(trimmed, searchStr);
        if (distance < bestDistance && distance <= maxDistance) {
          bestDistance = distance;
          bestMatch = trimmed;
        }
      }

      if (bestMatch) {
        console.log('RegexHelper.findFuzzyMatch: Levenshtein match found', {
          distance: bestDistance,
          matched: bestMatch.substring(0, 50)
        });
      } else {
        console.log('RegexHelper.findFuzzyMatch: no match found');
      }

      return bestMatch;
    } catch (error: any) {
      console.log('RegexHelper.findFuzzyMatch critical error', {
        error: error.message,
        errorName: error.name,
        errorStack: error.stack?.substring(0, 500),
        searchStrPreview: searchStr.substring(0, 50)
      });

      return null;
    }
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Used as fallback when regex fails
   */
  private static levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
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
   * Validate if a string contains potentially dangerous regex patterns
   * Useful for input validation before processing
   */
  static hasDangerousPatterns(input: string): boolean {
    // Check for unbalanced brackets that could cause "Unterminated character class"
    const openBrackets = (input.match(/\[/g) || []).length;
    const closeBrackets = (input.match(/\]/g) || []).length;

    if (openBrackets !== closeBrackets) {
      console.log('RegexHelper.hasDangerousPatterns: unbalanced brackets detected', {
        open: openBrackets,
        close: closeBrackets
      });
      return true;
    }

    // Check for other potentially problematic patterns
    const dangerousPatterns = [
      /\\[dws]/,  // Incomplete escape sequences
      /\(\?/,     // Incomplete lookbehind/lookahead
      /\{[^}]*$/, // Unclosed quantifier
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        console.log('RegexHelper.hasDangerousPatterns: dangerous pattern detected', {
          pattern: pattern.source,
          inputPreview: input.substring(0, 50)
        });
        return true;
      }
    }

    return false;
  }
}