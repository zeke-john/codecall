import { ToolRegistry } from "../core/toolRegistry";
import { OpenRouterClient, OpenRouterConfig } from "../llm/openRouter";
import {
  ChatMessage,
  OpenRouterTool,
  StreamCallbacks,
  AssistantMessage,
  ToolCallRequest,
  AgentInterface,
  TurnStats,
} from "../types";

export interface TraditionalAgentConfig {
  registry: ToolRegistry;
  openRouter?: OpenRouterConfig;
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT = `
You are a helpful assistant with access to various tools. 
Use them when needed to help the user accomplish their tasks.`;

function toApiName(path: string): string {
  return path.replace(/\./g, "_");
}

function toRegistryPath(apiName: string): string {
  const idx = apiName.indexOf("_");
  if (idx === -1) return apiName;
  return apiName.slice(0, idx) + "." + apiName.slice(idx + 1);
}

export class TraditionalAgent implements AgentInterface {
  private registry: ToolRegistry;
  private client: OpenRouterClient;
  private history: ChatMessage[];
  private tools: OpenRouterTool[];

  constructor(config: TraditionalAgentConfig) {
    this.registry = config.registry;
    this.client = new OpenRouterClient(config.openRouter);
    this.history = [
      {
        role: "system",
        content: config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      },
    ];
    this.tools = this.buildToolDefinitions();
  }

  private buildToolDefinitions(): OpenRouterTool[] {
    const tools: OpenRouterTool[] = [];
    const allDefs = this.registry.getAllToolDefinitions();

    for (const [path, def] of allDefs) {
      tools.push({
        type: "function",
        function: {
          name: toApiName(path),
          description: def.description ?? `Tool: ${def.name}`,
          parameters: def.inputSchema,
        },
      });
    }

    return tools;
  }

  async chat(
    message: string,
    callbacks: StreamCallbacks
  ): Promise<{ message: AssistantMessage | null; stats: TurnStats }> {
    this.history.push({
      role: "user",
      content: message,
    });

    const stats: TurnStats = {
      inferenceSteps: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      toolCallsCount: 0,
    };

    const result = await this.runAgentLoop(callbacks, stats);
    return { message: result, stats };
  }

  private async runAgentLoop(
    callbacks: StreamCallbacks,
    stats: TurnStats
  ): Promise<AssistantMessage | null> {
    const pendingToolCalls: ToolCallRequest[] = [];

    const wrappedCallbacks: StreamCallbacks = {
      onText: callbacks.onText,
      onToolCall: (tc) => {
        const displayToolCall = {
          ...tc,
          name: toRegistryPath(tc.name),
        };
        pendingToolCalls.push(tc);
        callbacks.onToolCall?.(displayToolCall);
      },
      onComplete: () => {},
      onError: callbacks.onError,
    };

    const { message: assistantMessage, usage } = await this.client.streamChat(
      this.history,
      this.tools,
      wrappedCallbacks
    );

    stats.inferenceSteps++;
    stats.totalPromptTokens += usage.prompt_tokens;
    stats.totalCompletionTokens += usage.completion_tokens;
    stats.totalTokens += usage.total_tokens;

    this.history.push(assistantMessage);

    if (
      !assistantMessage.tool_calls ||
      assistantMessage.tool_calls.length === 0
    ) {
      callbacks.onComplete?.();
      return assistantMessage;
    }

    stats.toolCallsCount += pendingToolCalls.length;

    for (const toolCall of pendingToolCalls) {
      const registryPath = toRegistryPath(toolCall.name);
      let result: unknown;
      try {
        result = await this.registry.call(registryPath, toolCall.arguments);
      } catch (error) {
        result = {
          error: error instanceof Error ? error.message : String(error),
        };
      }

      this.history.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    return this.runAgentLoop(callbacks, stats);
  }

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  clearHistory(): void {
    const systemMessage = this.history[0];
    this.history = systemMessage ? [systemMessage] : [];
  }

  getToolCount(): number {
    return this.tools.length;
  }
}
