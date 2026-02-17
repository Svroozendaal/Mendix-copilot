export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LlmToolCall {
  id: string;
  name: string;
  argumentsJson: string;
}

export interface LlmAssistantToolCallMessage {
  role: "assistant";
  content: string | null;
  tool_calls: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface LlmToolResultMessage {
  role: "tool";
  tool_call_id: string;
  content: string;
}

export type LlmConversationMessage =
  | LlmMessage
  | LlmAssistantToolCallMessage
  | LlmToolResultMessage;

export interface LlmCompletionOptions {
  messages: LlmConversationMessage[];
  temperature?: number;
  onToken?: (token: string) => void;
}

export interface LlmCompletionWithToolsOptions {
  messages: LlmConversationMessage[];
  tools: LlmToolDefinition[];
  temperature?: number;
}

export type LlmCompletionWithToolsResult =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tool_calls";
      toolCalls: LlmToolCall[];
      assistantMessage: LlmAssistantToolCallMessage;
    };

interface LlmClientConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function readCompletionText(payload: unknown): string {
  const root = asRecord(payload);
  const choices = Array.isArray(root?.choices) ? root.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice?.message);
  const content = message?.content;

  if (typeof content === "string" && content.trim().length > 0) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const fragments = content
      .map((item) => {
        const fragment = asRecord(item);
        if (!fragment) {
          return "";
        }

        const text = fragment.text;
        if (typeof text === "string") {
          return text;
        }

        const nested = asRecord(text);
        const nestedValue = nested?.value;
        return typeof nestedValue === "string" ? nestedValue : "";
      })
      .filter((value) => value.length > 0);

    if (fragments.length > 0) {
      return fragments.join("").trim();
    }
  }

  throw new Error("LLM response bevat geen bruikbare tekst.");
}

function emitPseudoTokens(text: string, onToken: ((token: string) => void) | undefined): void {
  if (!onToken) {
    return;
  }

  const fragments = text.split(/(\s+)/).filter((fragment) => fragment.length > 0);
  for (const fragment of fragments) {
    onToken(fragment);
  }
}

function parseToolCalls(payload: unknown): LlmCompletionWithToolsResult | null {
  const root = asRecord(payload);
  const choices = Array.isArray(root?.choices) ? root.choices : [];
  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice?.message);
  const rawToolCalls = Array.isArray(message?.tool_calls) ? message.tool_calls : [];

  if (rawToolCalls.length === 0) {
    return null;
  }

  const parsedToolCalls: LlmToolCall[] = [];
  const assistantToolCalls: LlmAssistantToolCallMessage["tool_calls"] = [];

  for (const rawToolCall of rawToolCalls) {
    const rawCallRecord = asRecord(rawToolCall);
    const rawFunction = asRecord(rawCallRecord?.function);
    const id = typeof rawCallRecord?.id === "string" ? rawCallRecord.id : "";
    const name = typeof rawFunction?.name === "string" ? rawFunction.name : "";
    const argumentsJson =
      typeof rawFunction?.arguments === "string" ? rawFunction.arguments : "{}";
    if (!id || !name) {
      continue;
    }

    parsedToolCalls.push({
      id,
      name,
      argumentsJson,
    });
    assistantToolCalls.push({
      id,
      type: "function",
      function: {
        name,
        arguments: argumentsJson,
      },
    });
  }

  if (parsedToolCalls.length === 0) {
    return null;
  }

  const assistantContent =
    typeof message?.content === "string" ? message.content : null;

  return {
    type: "tool_calls",
    toolCalls: parsedToolCalls,
    assistantMessage: {
      role: "assistant",
      content: assistantContent,
      tool_calls: assistantToolCalls,
    },
  };
}

export class LlmClient {
  private readonly config: LlmClientConfig | null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      this.config = null;
      return;
    }

    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
    const baseUrl = trimTrailingSlash(
      process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
    );
    const timeoutMs = parsePositiveInteger(process.env.OPENAI_TIMEOUT_MS, 90_000);

    this.config = {
      apiKey,
      model,
      baseUrl,
      timeoutMs,
    };
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  async complete(options: LlmCompletionOptions): Promise<string> {
    if (!this.config) {
      throw new Error("OPENAI_API_KEY ontbreekt. Zet deze in .env om chat generatie te activeren.");
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.2,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const detail = errorBody.trim() || `${response.status} ${response.statusText}`;
        throw new Error(`LLM request failed: ${detail}`);
      }

      const payload = (await response.json()) as unknown;
      const text = readCompletionText(payload);
      emitPseudoTokens(text, options.onToken);
      return text;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`LLM request timeout na ${this.config.timeoutMs}ms.`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  async completeWithTools(
    options: LlmCompletionWithToolsOptions
  ): Promise<LlmCompletionWithToolsResult> {
    if (!this.config) {
      throw new Error("OPENAI_API_KEY ontbreekt. Zet deze in .env om chat generatie te activeren.");
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.1,
          tools: options.tools.map((tool) => ({
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            },
          })),
          tool_choice: "auto",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const detail = errorBody.trim() || `${response.status} ${response.statusText}`;
        throw new Error(`LLM request failed: ${detail}`);
      }

      const payload = (await response.json()) as unknown;
      const toolCallResponse = parseToolCalls(payload);
      if (toolCallResponse) {
        return toolCallResponse;
      }

      return {
        type: "text",
        text: readCompletionText(payload),
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`LLM request timeout na ${this.config.timeoutMs}ms.`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
