import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat";
import fs from "fs";
import path from "path";

export type GrokMessage = ChatCompletionMessageParam;

export interface GrokTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface GrokToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface SearchParameters {
  mode?: "auto" | "on" | "off";
  // sources removed - let API use default sources to avoid format issues
}

export interface SearchOptions {
  search_parameters?: SearchParameters;
}

export interface GrokResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: GrokToolCall[];
    };
    finish_reason: string;
  }>;
}

export class GrokClient {
  private client: OpenAI;
  private currentModel: string = "grok-4.1";
  private defaultMaxTokens: number;

  constructor(apiKey?: string, model?: string, baseURL?: string) {
    apiKey = apiKey || process.env.OPENAI_API_KEY || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    this.client = new OpenAI({
      apiKey,
      baseURL: baseURL || process.env.GROK_BASE_URL || "https://api.x.ai/v1",
      timeout: 360000,
    });
    const envMax = Number(process.env.GROK_MAX_TOKENS);
    this.defaultMaxTokens = Number.isFinite(envMax) && envMax > 0 ? envMax : 8192;
    if (model) {
      this.currentModel = model;
    }
  }

  setModel(model: string): void {
    this.currentModel = model;
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  async chat(
    messages: GrokMessage[],
    tools?: GrokTool[],
    model?: string,
    searchOptions?: SearchOptions
  ): Promise<GrokResponse> {
    try {
      const requestPayload: any = {
        model: model || this.currentModel,
        messages,
        tools: tools || [],
        tool_choice: tools && tools.length > 0 ? "auto" : undefined,
        temperature: 0.7,
        max_tokens: this.defaultMaxTokens,
      };

      // Add search parameters if specified
      if (searchOptions?.search_parameters) {
        requestPayload.search_parameters = searchOptions.search_parameters;
      }

      const response =
        await this.client.chat.completions.create(requestPayload);

      // Log token usage for monitoring and optimization
      if (response.usage) {
        this.logTokenUsage(response.usage);
      }

      return response as GrokResponse;
    } catch (error: any) {
      throw new Error(`Grok API error: ${error.message}`);
    }
  }

  async *chatStream(
    messages: GrokMessage[],
    tools?: GrokTool[],
    model?: string,
    searchOptions?: SearchOptions,
    abortSignal?: AbortSignal
  ): AsyncGenerator<any, void, unknown> {
    try {
      const requestPayload: any = {
        model: model || this.currentModel,
        messages,
        tools: tools || [],
        tool_choice: tools && tools.length > 0 ? "auto" : undefined,
        temperature: 0.7,
        max_tokens: this.defaultMaxTokens,
        stream: true,
      };

      // Add search parameters if specified
      if (searchOptions?.search_parameters) {
        requestPayload.search_parameters = searchOptions.search_parameters;
      }

      const stream = (await this.client.chat.completions.create(
        requestPayload,
        { signal: abortSignal }
      )) as any;

      let finalUsage: any = null;
      for await (const chunk of stream) {
        // Capture usage data from final chunk if available
        if (chunk.usage) {
          finalUsage = chunk.usage;
        }
        yield chunk;
      }

      // Log token usage for streaming responses
      if (finalUsage) {
        this.logTokenUsage(finalUsage);
      }
    } catch (error: any) {
      throw new Error(`Grok API error: ${error.message}`);
    }
  }

  async search(
    query: string,
    searchParameters?: SearchParameters
  ): Promise<GrokResponse> {
    const searchMessage: GrokMessage = {
      role: "user",
      content: query,
    };

    const searchOptions: SearchOptions = {
      search_parameters: searchParameters || { mode: "on" },
    };

    return this.chat([searchMessage], [], undefined, searchOptions);
  }

  /**
   * Log token usage for monitoring and optimization
   */
  private logTokenUsage(usage: any): void {
    try {
      const tokenData = {
        timestamp: new Date().toISOString(),
        model: this.currentModel,
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
        reasoning_tokens: usage.reasoning_tokens || 0,
      };

      // Store in local JSON file for analysis (as specified in investigation)
      const logPath = process.env.XCLI_TOKEN_LOG || `${process.env.HOME}/.grok/token-usage.jsonl`;

      // Ensure directory exists
      const dir = path.dirname(logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Append to JSONL file
      const logLine = JSON.stringify(tokenData) + '\n';
      fs.appendFileSync(logPath, logLine);

    } catch (error) {
      // Silently ignore logging errors to not disrupt API calls
      console.warn('Failed to log token usage:', error);
    }
  }
}
