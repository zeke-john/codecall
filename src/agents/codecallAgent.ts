import { ToolRegistry } from "../core/toolRegistry";
import { Sandbox } from "../core/sandbox";
import { createInternalTools, generateFileTree } from "../core/internalTools";
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

export interface CodecallAgentConfig {
  mcpRegistry: ToolRegistry;
  sdkDir: string;
  openRouter?: OpenRouterConfig;
  systemPrompt?: string;
}

// TODO: MAKE THIS WAY MORE CONCISE
function buildSystemPrompt(fileTree: string, customPrompt?: string): string {
  if (customPrompt) {
    return customPrompt;
  }

  return `
You are an assistant that completes tasks by executing actions programmatically when the user needs it.

## Available Tools

You have access to 2 tools:

1. readFile({ path }) - Read a specific SDK file to understand types and how to call tools
2. executeCode({ code }) - Execute TypeScript code that can call any tool via tools.namespace.method()

## Available SDK Files

Below is the file tree of all available tool SDK files. Each file contains the types and function signature for calling that tool:

${fileTree}

## Workflow

1. Look at the SDK file tree above to identify relevant tools
2. Use readFile() to read the SDK files and understand input/output types
3. Write comprehensive TypeScript code to accomplish the task in a SINGLE executeCode() call
4. Use progress() throughout your code to provide real-time updates to the user

## Using progress()

ALWAYS use progress() to show intermediate updates during code execution. This is critical for user experience:

progress("Loading users...");
progress({ step: "Processing", current: 5, total: 20 });
progress({ step: "Complete", processed: 20, failed: 0 });

Call progress() at meaningful checkpoints:
- Before/after loading data
- During loops (every N iterations)
- When completing major steps

## Code Execution Rules

- All tool calls are async: await tools.test.getUsers({})
- Handle errors with try/catch
- Return a structured result at the end that summarizes what happened
- Write comprehensive code that handles the entire task in one execution`;
}

function toApiName(path: string): string {
  return path.replace(/\./g, "_");
}

function toRegistryPath(apiName: string): string {
  const idx = apiName.indexOf("_");
  if (idx === -1) return apiName;
  return apiName.slice(0, idx) + "." + apiName.slice(idx + 1);
}

export class CodecallAgent implements AgentInterface {
  private internalRegistry: ToolRegistry;
  private client: OpenRouterClient;
  private history: ChatMessage[];
  private tools: OpenRouterTool[];
  private sdkDir: string;
  private currentCallbacks: StreamCallbacks | null = null;

  constructor(config: CodecallAgentConfig) {
    const { mcpRegistry, sdkDir, openRouter, systemPrompt } = config;
    this.sdkDir = sdkDir;

    const sandbox = new Sandbox(mcpRegistry);

    this.internalRegistry = new ToolRegistry();
    const internalTools = createInternalTools({
      sdkDir,
      sandbox,
      getProgressHandler: () => this.currentCallbacks?.onProgress,
    });
    this.internalRegistry.registerInternalTools("codecall", internalTools);

    this.client = new OpenRouterClient(openRouter);

    const fileTree = generateFileTree(sdkDir);
    const fullSystemPrompt = buildSystemPrompt(fileTree, systemPrompt);

    this.history = [
      {
        role: "system",
        content: fullSystemPrompt,
      },
    ];

    this.tools = this.buildToolDefinitions();
  }

  private buildToolDefinitions(): OpenRouterTool[] {
    const tools: OpenRouterTool[] = [];
    const allDefs = this.internalRegistry.getAllToolDefinitions();

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
    this.currentCallbacks = callbacks;

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
      let isError = false;
      try {
        result = await this.internalRegistry.call(
          registryPath,
          toolCall.arguments
        );
      } catch (error) {
        isError = true;
        result = {
          error: error instanceof Error ? error.message : String(error),
        };
      }

      callbacks.onToolResult?.({
        toolCallId: toolCall.id,
        toolName: registryPath,
        result,
        isError,
      });

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

  getSdkDir(): string {
    return this.sdkDir;
  }
}
