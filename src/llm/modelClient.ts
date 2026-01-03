import { ToolSource, GeneratedSDK } from "../types";

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

const SDK_SYSTEM_PROMPT = `You are a TypeScript SDK generator. Given tool definitions, generate clean, well-typed SDK files.

These SDK files are read by an LLM to understand available tools. The LLM writes executable code using ONLY this pattern:
  await tools.{folderName}.{functionName}(input)

This is the ONLY way to call these functions at runtime. The function declarations below are for type reference only.

RULES:
1. EVERY file must start with a header comment block showing the exact call pattern:
   /**
    * HOW TO CALL THIS TOOL:
    * await tools.{folderName}.{functionName}({ ...params })
    *
    * This is the ONLY way to invoke this tool in your code.
    */

2. Extract ALL information from the tool definition including inputSchema AND outputSchema when provided
3. Convert JSON Schema types to TypeScript (string, number, boolean, arrays, objects)
4. Use union types for enums (e.g., priority: 1 | 2 | 3 | 4)
5. Mark optional fields with ? based on the "required" array
6. Add JSDoc comments from descriptions
7. Use camelCase for function/file names, PascalCase for interfaces
8. Each file should have an Input interface and an async function DECLARATION (no body)
9. The function should be a declaration ending with semicolon: export async function name(input: Input): Promise<Output>;

OUTPUT SCHEMA HANDLING:
- When outputSchema IS provided: Create an Output interface from the schema and type the function return as Promise<Output>
- When outputSchema is NOT provided: Use Promise<unknown> as the return type

Return ONLY valid JSON with no markdown formatting, no code blocks, just raw JSON:
{
  "folderName": "short_clean_name_for_folder",
  "files": [
    { "fileName": "toolName.ts", "content": "full typescript file content with proper formatting and newlines" }
  ]
}`;

export async function generateSDKFromLLM(
  source: ToolSource
): Promise<GeneratedSDK> {
  const toolsForPrompt = source.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
  }));

  const userPrompt = `Source Name: "${source.name}"
Version: ${source.version || "unknown"}

Tool Definitions:
${JSON.stringify(toolsForPrompt, null, 2)}

Generate the SDK files. For tools with outputSchema, create properly typed Output interfaces.
For tools WITHOUT outputSchema, use Promise<unknown> as the return type.
Remember to return ONLY valid JSON, no markdown.`;

  const content = await callOpenRouter([
    { role: "system", content: SDK_SYSTEM_PROMPT },
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
