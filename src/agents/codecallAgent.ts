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

function buildSystemPrompt(fileTree: string, customPrompt?: string): string {
  if (customPrompt) {
    return customPrompt;
  }

  return `
You are a helpful assistant that completes tasks by executing actions programmatically.

## Available SDK Files

Below is the file tree of all available tool SDK files.
Each file contains the types and function signature for calling that tool:

\`\`\`
${fileTree}
\`\`\`

## CRITICAL: Never Guess Tool Usage

You MUST read SDK files before writing any code that uses tools.

Never assume:
- Parameter names
- Required vs optional fields
- Input/output structure and parameter semantics
- Tool behavior beyond what is explicitly documented

What sounds plausible is often WRONG! When reading SDK files, pay close attention to:
1. Exact Input/Output Shapes and Schemas
2. @description (often contains hard constraints)
3. Required vs optional parameters (optional does NOT mean unconstrained)
4. Parameter semantics (what the value actually means)

## Required Workflow

1. Decide which tools (if any) are required for the task (If none → respond directly, no SDK reads, no code execution)
2. MANDATORY: Use readFile() to read EVERY SDK file for tools you will use
3. Only after reading SDKs, write executeCode() using the EXACT interface definitions, semantics, from the SDK file(s)
4. Use progress() throughout execution for user-visible updates

Skipping step 2 WILL result in incorrect parameters and failed execution.

## progress() Usage (Required)

Always use progress() to show intermediate updates during code execution. This is critical for user experience, like when:
- Before and after major steps
- During loops (every N iterations)
- On completion

Examples:
\`\`\`
progress("Loading data...");
progress({ step: "Processing", current: 5, total: 20 });
progress({ step: "Complete", processed: 20, failed: 0 });
\`\`\`

## Code Execution Rules

- All tool calls are async: await tools.namespace.functionName({ ... })
- Use ONLY parameters defined in SDK interfaces
- Do NOT perform semantic reasoning inside code
- Keep code simple, deterministic, and error-resistant
- Return a structured comprehensive summary result at the end

## Reasoning vs Execution

Code is for mechanics. YOU are for reasoning.

Do NOT solve clearly semantic required tasks in code using keywords or heuristics.
All classification, summarization, similarity, and judgment must be done by YOU outside executeCode().

### Multi-Step Execution

Use multi-step execution ONLY when reasoning is required.

Flexible Pattern:
1. executeCode() retrieves raw data
2. YOU reason over the data
3. executeCode() acts on the specific items you identified

Examples that REQUIRE multi-step and reasoning from YOU:
- "Delete all tasks that have NBA players in the name"
- "Summarize my tasks"
- "Find similar tasks"
- "Group my tasks by topic"
- "What tasks do i have that don't seem necessary for my life?"

Examples that do NOT require multi-step:
- "Create a task to buy groceries"
- "Delete all tasks with label workout"
- "Find tasks due today and tomorrow"
- "Count tasks per project"
- "Update all tasks with the label 'work' to have the label 'important' too"

Know when to complete a task in one code execution, and when to use a multi-step flow.

## Failure Handling

If executeCode() fails:
- Inspect the error
- Re-read the relevant SDK file if needed
- Correct the code based on the SDK
- Retry without guessing

Never invent parameters or fixes.
`;
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

    const sandbox = new Sandbox(mcpRegistry, 10 * 60 * 1000);

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
    // console.log(`\n${fullSystemPrompt}\n`);

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

    const turnStartIdx = this.history.length;

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

    this.compactTurnHistory(turnStartIdx);

    return { message: result, stats };
  }

  private compactTurnHistory(turnStartIdx: number): void {
    const finalIdx = this.history.length - 1;

    if (finalIdx <= turnStartIdx) {
      return;
    }

    let lastToolCallAssistantIdx = -1;
    for (let i = finalIdx - 1; i > turnStartIdx; i--) {
      const msg = this.history[i];
      if (
        msg.role === "assistant" &&
        "tool_calls" in msg &&
        msg.tool_calls &&
        msg.tool_calls.length > 0
      ) {
        lastToolCallAssistantIdx = i;
        break;
      }
    }

    if (lastToolCallAssistantIdx === -1) {
      return;
    }

    const userMessage = this.history[turnStartIdx];
    const lastToolCallAssistant = this.history[lastToolCallAssistantIdx];
    const finalMessage = this.history[finalIdx];

    const toolResults: ChatMessage[] = [];
    for (let i = lastToolCallAssistantIdx + 1; i < finalIdx; i++) {
      const msg = this.history[i];
      if (msg.role === "tool") {
        toolResults.push(msg);
      }
    }

    const baseHistory = this.history.slice(0, turnStartIdx);
    this.history = [
      ...baseHistory,
      userMessage,
      lastToolCallAssistant,
      ...toolResults,
      finalMessage,
    ];
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
