import { ToolSource, GeneratedSDK, ClassifiedToolSource } from "../types";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

export async function callOpenRouter(
  messages: OpenRouterMessage[]
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenRouter response");
  }

  return content;
}

export async function generateSDKFromLLM(
  source: ToolSource
): Promise<GeneratedSDK> {
  const systemPrompt = `You are a TypeScript SDK generator. Given raw MCP tool definitions, generate clean, well-typed SDK files.

RULES:
1. Extract ALL information from the tool definition
2. Convert JSON Schema types to TypeScript (string, number, boolean, arrays, objects)
3. Use union types for enums (e.g., priority: 1 | 2 | 3 | 4)
4. Mark optional fields with ? based on the "required" array
5. Add JSDoc comments from descriptions
6. Preserve the original tool name in the call() function
7. Use camelCase for function/file names, PascalCase for interfaces
8. DO NOT add any logic - just type definitions and the call() stub
9. Each file should have an Input interface and an async function
10. The function should return call("original_tool_name", input)

Return ONLY valid JSON with no markdown formatting, no code blocks, just raw JSON:
{
  "folderName": "short_clean_name_for_folder",
  "files": [
    { "fileName": "toolName.ts", "content": "full typescript file content with proper formatting and newlines" }
  ]
}`;

  const userPrompt = `Source Name: "${source.name}"
Version: ${source.version || "unknown"}

Tool Definitions:
${JSON.stringify(source.tools, null, 2)}

Generate the SDK files. Remember to return ONLY valid JSON, no markdown.`;

  const content = await callOpenRouter([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const cleanedContent = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleanedContent) as GeneratedSDK;

    if (!parsed.folderName || !Array.isArray(parsed.files)) {
      throw new Error("Invalid SDK structure from LLM");
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse LLM response:", cleanedContent);
    throw new Error(`Failed to parse LLM response as JSON: ${error}`);
  }
}

const CLASSIFIED_SDK_SYSTEM_PROMPT = `
You are a TypeScript SDK generator. Given MCP tool definitions with their classifications, output schemas, and real examples, generate clean, well-typed SDK files.

RULES:
1. Extract ALL information from the tool definition including inputSchema AND outputSchema when provided
2. Convert JSON Schema types to TypeScript (string, number, boolean, arrays, objects)
3. Use union types for enums (e.g., priority: 1 | 2 | 3 | 4)
4. Mark optional fields with ? based on the "required" array
5. Add JSDoc comments from descriptions
6. Preserve the original tool name in the call() function
7. Use camelCase for function/file names, PascalCase for interfaces
8. DO NOT add any logic - just type definitions and the call() stub
9. Each file should have an Input interface and an async function
10. The function should return call("original_tool_name", input)
11. When outputSchema is provided, create an Output interface and type the function return as Promise<Output>
12. For tools with category "read" or "write_read", the output type is critical - use the exact outputSchema structure
13. For tools with category "write" or "destructive", the return type can be Promise<void> or a simple success type
14. When sampleInput and sampleOutput are provided, include them as a clearly labeled comment block BEFORE the function definition
15. Format the examples as a multi-line comment with "INPUT EXAMPLE:" and "OUTPUT EXAMPLE:" labels so they are not confused
16. Pretty-print the JSON examples for readability (2-space indent)
17. Truncate very large output examples to first few items if the array is long (show first 2-3 items then add "// ... more items")

Return ONLY valid JSON with no markdown formatting, no code blocks, just raw JSON:
{
  "folderName": "short_clean_name_for_folder",
  "files": [
    { "fileName": "toolName.ts", "content": "full typescript file content with proper formatting and newlines" }
  ]
}`;

export async function generateSDKFromClassifiedSource(
  source: ClassifiedToolSource
): Promise<GeneratedSDK> {
  const toolsWithSchemas = source.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    category: tool.category,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    sampleInput: tool.sampleInput,
    sampleOutput: tool.sampleOutput,
  }));

  const userPrompt = `Source Name: "${source.name}"
Version: ${source.version || "unknown"}

Tool Definitions (with classifications, output schemas, and real examples from API calls):
${JSON.stringify(toolsWithSchemas, null, 2)}

Generate the SDK files. For tools with outputSchema, create properly typed Output interfaces.
For tools with sampleInput and sampleOutput, include them as clearly labeled comment blocks (INPUT EXAMPLE / OUTPUT EXAMPLE) before the function.
Remember to return ONLY valid JSON, no markdown.`;

  const content = await callOpenRouter([
    { role: "system", content: CLASSIFIED_SDK_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);

  const cleanedContent = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleanedContent) as GeneratedSDK;

    if (!parsed.folderName || !Array.isArray(parsed.files)) {
      throw new Error("Invalid SDK structure from LLM");
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse LLM response:", cleanedContent);
    throw new Error(`Failed to parse LLM response as JSON: ${error}`);
  }
}
