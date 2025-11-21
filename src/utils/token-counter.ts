import { get_encoding, encoding_for_model, Tiktoken } from 'tiktoken';

export class TokenCounter {
  private encoder: Tiktoken;
  private model: string;

  constructor(model: string = 'gpt-4') {
    this.model = model;
    try {
      // Try to get encoding for specific model
      this.encoder = encoding_for_model(model as any);
    } catch {
      // Fallback to cl100k_base (used by GPT-4 and most modern models)
      this.encoder = get_encoding('cl100k_base');
    }
  }

  /**
   * Count tokens in a string
   */
  countTokens(text: string): number {
    if (!text) return 0;
    return this.encoder.encode(text).length;
  }

  /**
   * Count tokens in messages array (for chat completions)
   */
  countMessageTokens(messages: Array<{ role: string; content: string | null; [key: string]: any }>): number {
    let totalTokens = 0;
    
    for (const message of messages) {
      // Every message follows <|start|>{role/name}\n{content}<|end|\>\n
      totalTokens += 3; // Base tokens per message
      
      if (message.content && typeof message.content === 'string') {
        totalTokens += this.countTokens(message.content);
      }
      
      if (message.role) {
        totalTokens += this.countTokens(message.role);
      }
      
      // Add extra tokens for tool calls if present
      if (message.tool_calls) {
        totalTokens += this.countTokens(JSON.stringify(message.tool_calls));
      }
    }
    
    totalTokens += 3; // Every reply is primed with <|start|>assistant<|message|>
    
    return totalTokens;
  }

  /**
   * Estimate tokens for streaming content
   * This is an approximation since we don't have the full response yet
   */
  estimateStreamingTokens(accumulatedContent: string): number {
    return this.countTokens(accumulatedContent);
  }

  /**
   * Get maximum context window tokens for the current model
   */
  getMaxTokens(): number {
    const modelName = this.model.toLowerCase();

    // Grok models
    if (modelName.includes('grok-2')) return 128000;
    if (modelName.includes('grok-1')) return 128000;
    if (modelName.includes('grok-beta')) return 128000;

    // OpenAI models (fallback)
    if (modelName.includes('gpt-4o')) return 128000;
    if (modelName.includes('gpt-4-turbo')) return 128000;
    if (modelName.includes('gpt-4')) return 8192;
    if (modelName.includes('gpt-3.5')) return 4096;

    // Default
    return 4096;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.encoder.free();
  }
}

/**
 * Format token count for display (e.g., 1.2k for 1200)
 */
export function formatTokenCount(count: number): string {
  if (count <= 999) {
    return count.toString();
  }
  
  if (count < 1_000_000) {
    const k = count / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  
  const m = count / 1_000_000;
  return m % 1 === 0 ? `${m}m` : `${m.toFixed(1)}m`;
}

/**
 * Create a token counter instance
 */
export function createTokenCounter(model?: string): TokenCounter {
  return new TokenCounter(model);
}