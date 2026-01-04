export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface ToolResultMessage {
  role: "tool";
  tool_call_id: string;
  content: string;
}

export interface SystemMessage {
  role: "system";
  content: string;
}

export type ChatMessage =
  | UserMessage
  | AssistantMessage
  | ToolResultMessage
  | SystemMessage;

export interface OpenRouterTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: object;
  };
}

export interface StreamDelta {
  content?: string;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: "function";
    function?: {
      name?: string;
      arguments?: string;
    };
  }>;
}

export interface StreamChoice {
  index: number;
  delta: StreamDelta;
  finish_reason: string | null;
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: StreamChoice[];
  usage?: UsageInfo;
}

export interface UsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResult {
  message: AssistantMessage;
  usage: UsageInfo;
}

export interface TurnStats {
  inferenceSteps: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  toolCallsCount: number;
}

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
  isError: boolean;
}

export interface StreamCallbacks {
  onText?: (text: string) => void;
  onToolCall?: (toolCall: ToolCallRequest) => void;
  onToolResult?: (result: ToolResult) => void;
  onProgress?: (data: unknown) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface AgentInterface {
  chat(
    message: string,
    callbacks: StreamCallbacks
  ): Promise<{ message: AssistantMessage | null; stats: TurnStats }>;
  getHistory(): ChatMessage[];
  clearHistory(): void;
}
