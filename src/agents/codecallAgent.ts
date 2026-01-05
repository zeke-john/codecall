import * as path from "path";
import { ToolRegistry } from "../core/toolRegistry";
import { Sandbox } from "../core/sandbox";
import {
  createInternalTools,
  generateFileTree,
  appendLearnedConstraint,
} from "../core/internalTools";
import { OpenRouterClient, OpenRouterConfig } from "../llm/openRouter";
import {
  ChatMessage,
  OpenRouterTool,
  StreamCallbacks,
  AssistantMessage,
  ToolCallRequest,
  AgentInterface,
  TurnStats,
  ToolError,
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

## ALWAYS call readFile() BEFORE executeCode()

You CANNOT call any tool in executeCode() without FIRST reading its SDK file using readFile().
This is NOT optional. This is NOT a suggestion. This is a REQUIREMENT.

You WILL get parameters wrong if you guess. The SDK file has the EXACT parameter names.

### CORRECT Workflow (NO EXCEPTIONS):
1. Identify which tools you need for the task
2. Call readFile() for EACH tool you will use (e.g., readFile("todoist/findTasks.ts"))
3. Read the SDK file contents carefully - note exact parameter names, required fields, constraints
4. ONLY THEN call executeCode() using the EXACT param names from the SDK

### WRONG Workflow (NEVER DO THIS):
1. Skip reading SDK files
2. Call executeCode() with guessed parameter names
3. Fail with "Invalid arguments" error
4. Then read SDK file
5. Fix and retry

This wastes time and tokens. ALWAYS read SDK files FIRST.


## How to Read SDK Files

Use readFile() with the path relative to tools/:
- readFile("folder/toolName.ts") - read the that tool's entire SDK file

When reading SDK files, pay close attention to:
1. The interface definition (exact parameter names and types)
2. Required vs optional fields (marked with ?)
3. @description comments (often contain hard constraints like "at least one filter required")
4. @CC LEARNED CONSTRAINT banners - these are critical constraints learned from past errors. "@CC" stands for "Codecall". Always read and follow these constraints to avoid known pitfalls.
5. Enum/union types for valid values

## Using progress()

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

Do NOT solve clearly semantic tasks in code using keywords or heuristics.
All classification, summarization, similarity, and judgment must be done by YOU outside executeCode().

### Multi-Step Execution

Use multi-step execution ONLY when reasoning is required.

Flexible Pattern:
1. executeCode() retrieves raw data
2. YOU reason over the data
3. executeCode() acts on the specific items you identified

Examples that would REQUIRE a multi-step flow:
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
1. Inspect the error message
2. Re-read the relevant SDK file
3. Correct the code based on EXACT SDK definitions
4. Retry

Never invent parameters. Always use what the SDK file defines.
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

interface PendingRecovery {
  sdkPath: string;
  errorMessage: string;
}

export class CodecallAgent implements AgentInterface {
  private internalRegistry: ToolRegistry;
  private client: OpenRouterClient;
  private history: ChatMessage[];
  private tools: OpenRouterTool[];
  private sdkDir: string;
  private currentCallbacks: StreamCallbacks | null = null;
  private readSdkPaths: Set<string>;
  private pendingRecoveries: Map<string, PendingRecovery> = new Map();

  constructor(config: CodecallAgentConfig) {
    const { mcpRegistry, sdkDir, openRouter, systemPrompt } = config;
    this.sdkDir = sdkDir;
    this.readSdkPaths = new Set<string>();

    const sandbox = new Sandbox(mcpRegistry, 10 * 60 * 1000);

    this.internalRegistry = new ToolRegistry();
    const internalTools = createInternalTools({
      sdkDir,
      sandbox,
      getProgressHandler: () => this.currentCallbacks?.onProgress,
      readSdkPaths: this.readSdkPaths,
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

      let shouldTriggerRecovery = false;
      if (registryPath === "codecall.executeCode") {
        this.trackExecuteCodeResult(result);
        shouldTriggerRecovery = this.checkForRecovery(result);
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

      if (shouldTriggerRecovery) {
        await this.triggerClarificationFlow(callbacks);
      }
    }

    return this.runAgentLoop(callbacks, stats);
  }

  private trackExecuteCodeResult(result: unknown): void {
    if (!result || typeof result !== "object") return;

    const execResult = result as { status?: string; toolErrors?: ToolError[] };

    if (
      execResult.status === "error" &&
      execResult.toolErrors &&
      execResult.toolErrors.length > 0
    ) {
      for (const toolError of execResult.toolErrors) {
        this.pendingRecoveries.set(toolError.sdkPath, {
          sdkPath: toolError.sdkPath,
          errorMessage: toolError.errorMessage,
        });
      }
    }
  }

  private checkForRecovery(result: unknown): boolean {
    if (!result || typeof result !== "object") return false;
    const execResult = result as { status?: string };
    return execResult.status === "success" && this.pendingRecoveries.size > 0;
  }

  private async triggerClarificationFlow(
    callbacks: StreamCallbacks
  ): Promise<void> {
    const recoveries = Array.from(this.pendingRecoveries.values());
    this.pendingRecoveries.clear();

    for (const recovery of recoveries) {
      const clarificationPrompt = `You just recovered from an error in \`${recovery.sdkPath}\`.

TASK: Write a learned constraint that will help future agents avoid this error.

RULES:
1. Write 2-4 sentences ONLY - plain text, no markdown, no headers, no bullet points
2. Include the exact error message or key phrase from it
3. Explain what parameter/value caused it and what the correct approach is
4. This will be inserted into the SDK file as a comment, so keep it clean

THE GOAL IS TO PREVENT THIS ERROR FROM HAPPENING AGAIN, SO IF YOU WERE TO DO THIS AGAIN, WHAT INFO WOULD YOU HAVE NEEDED FOR THIS ERROR TO NOT HAPPEN?

PUTTING IT IN THE SDK FILE AS A COMMENT WILL HELP FUTURE AGENTS AVOID THIS ERROR, MAKE SURE TO MAKE IT CLEAR AND CONCISE, BUT MOST IMPORTANTLY SO THEY UNDERSTAND WHAT TO DO TO AVOID THIS ERROR.

FULL ERROR:
${recovery.errorMessage}

Respond with the constraint text:`;

      this.history.push({
        role: "user",
        content: `[SYSTEM: SDK LEARNING] ${clarificationPrompt}`,
      });

      await this.requestClarificationAndUpdate(recovery.sdkPath, callbacks);
    }
  }

  private sanitizeConstraintText(text: string): string | null {
    let sanitized = text
      .replace(/^#+\s*.*/gm, "")
      .replace(/^[-*]\s+/gm, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]+`/g, (match) => match.slice(1, -1))
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^---+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (
      sanitized.includes("##") ||
      sanitized.includes("**") ||
      sanitized.includes("```") ||
      sanitized.length > 1500
    ) {
      return null;
    }

    if (sanitized.length < 50) {
      return null;
    }

    return sanitized;
  }

  private async requestClarificationAndUpdate(
    sdkPath: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const clarificationCallbacks: StreamCallbacks = {
      onText: () => {},
      onComplete: () => {},
    };

    const { message } = await this.client.streamChat(
      this.history,
      [],
      clarificationCallbacks
    );

    if (message && message.content) {
      this.history.push(message);

      const sanitized = this.sanitizeConstraintText(message.content);
      if (!sanitized) {
        return;
      }

      const toolsDir = path.join(this.sdkDir, "tools");
      const updateResult = appendLearnedConstraint(
        toolsDir,
        sdkPath,
        sanitized
      );

      if (updateResult.success) {
        const successMsg = `[SYSTEM] Updated ${sdkPath} with learned constraint.`;
        this.history.push({ role: "user", content: successMsg });
        callbacks.onToolResult?.({
          toolCallId: "sdk-update",
          toolName: "system.learnedConstraint",
          result: { updated: sdkPath, constraint: sanitized },
          isError: false,
        });
      }
    }
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
