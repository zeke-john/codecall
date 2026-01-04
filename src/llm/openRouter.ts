import {
  ChatMessage,
  OpenRouterTool,
  StreamCallbacks,
  StreamChunk,
  ToolCallRequest,
  AssistantMessage,
  ChatResult,
  UsageInfo,
} from "../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

export interface OpenRouterConfig {
  apiKey?: string;
  model?: string;
}

export class OpenRouterClient {
  private apiKey: string;
  private model: string;

  constructor(config: OpenRouterConfig = {}) {
    const apiKey = config.apiKey ?? process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is required");
    }
    this.apiKey = apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
  }

  async streamChat(
    messages: ChatMessage[],
    tools: OpenRouterTool[],
    callbacks: StreamCallbacks
  ): Promise<ChatResult> {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(
        `OpenRouter API error: ${response.status} - ${errorText}`
      );
      callbacks.onError?.(error);
      throw error;
    }

    if (!response.body) {
      const error = new Error("No response body");
      callbacks.onError?.(error);
      throw error;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullContent = "";
    let usage: UsageInfo = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };
    const toolCallsInProgress = new Map<
      number,
      {
        id: string;
        name: string;
        arguments: string;
      }
    >();

    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6);
          try {
            const chunk = JSON.parse(jsonStr) as StreamChunk;

            if (chunk.usage) {
              usage = chunk.usage;
            }

            const choice = chunk.choices[0];
            if (!choice) continue;

            const delta = choice.delta;

            if (delta.content) {
              fullContent += delta.content;
              callbacks.onText?.(delta.content);
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const existing = toolCallsInProgress.get(tc.index);
                if (!existing) {
                  toolCallsInProgress.set(tc.index, {
                    id: tc.id ?? "",
                    name: tc.function?.name ?? "",
                    arguments: tc.function?.arguments ?? "",
                  });
                } else {
                  if (tc.id) existing.id = tc.id;
                  if (tc.function?.name) existing.name = tc.function.name;
                  if (tc.function?.arguments) {
                    existing.arguments += tc.function.arguments;
                  }
                }
              }
            }

            if (choice.finish_reason === "tool_calls") {
              for (const [, tc] of toolCallsInProgress) {
                let parsedArgs: Record<string, unknown> = {};
                try {
                  parsedArgs = JSON.parse(tc.arguments);
                } catch {
                  parsedArgs = {};
                }
                const toolCall: ToolCallRequest = {
                  id: tc.id,
                  name: tc.name,
                  arguments: parsedArgs,
                };
                callbacks.onToolCall?.(toolCall);
              }
            }
          } catch {
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    callbacks.onComplete?.();

    const assistantMessage: AssistantMessage = {
      role: "assistant",
      content: fullContent || null,
    };

    if (toolCallsInProgress.size > 0) {
      assistantMessage.tool_calls = [];
      for (const [, tc] of toolCallsInProgress) {
        assistantMessage.tool_calls.push({
          id: tc.id,
          type: "function",
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        });
      }
    }

    return { message: assistantMessage, usage };
  }
}
