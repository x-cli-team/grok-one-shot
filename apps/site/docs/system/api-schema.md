# 🔌 API Schema

## Grok API Integration

### Base Configuration

```typescript
{
  baseURL: "https://api.x.ai/v1",
  defaultModel: "grok-4-fast-non-reasoning",
  apiKey: process.env.GROK_API_KEY
}
```

### Available Models

- **grok-4-latest**: Latest Grok model with enhanced capabilities
- **grok-code-fast-1**: Optimized for code generation (default)
- **grok-3-fast**: Fast general-purpose model
- **grok-4-fast-reasoning**: Fast reasoning model with 2M context
- **grok-4-fast-non-reasoning**: Fast non-reasoning model with 2M context
- **grok-4-0709**: Grok 4 model variant
- **grok-3-mini**: Mini general-purpose model with 131k context
- **grok-3**: Standard Grok 3 model with 131k context
- **grok-2-vision-1212us-east-1**: Vision model with 32k context (US East)
- **grok-2-vision-1212eu-west-1**: Vision model with 32k context (EU West)
- **grok-2-image-1212**: Image generation model

### Tool Integration Schema

Tools follow OpenAI function calling format:

```typescript
interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON stringified
  };
}

interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}
```

### MCP Server Schema

Model Context Protocol integration:

```typescript
interface MCPServerConfig {
  name: string;
  transport: {
    type: "stdio" | "http" | "sse" | "streamable_http";
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
    headers?: Record<string, string>;
  };
}
```

## Internal APIs

### Agent Interface

```typescript
interface GrokAgent {
  processUserMessageStream(input: string): AsyncGenerator<StreamChunk>;
  executeBashCommand(command: string): Promise<ToolResult>;
  setModel(model: string): void;
  getCurrentModel(): string;
}
```

### Tool Interface

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema7;
  execute(args: any): Promise<ToolResult>;
}
```

_Updated: 2025-10-11_
