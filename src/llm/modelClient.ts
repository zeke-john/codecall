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

const SDK_SYSTEM_PROMPT = `You are a TypeScript SDK generator. Your job is to extract EVERY PIECE OF INFORMATION from tool definitions and generate comprehensive, well-typed SDK files.

These SDK files are read by an LLM to understand available tools. The LLM writes executable code using ONLY this pattern:
  await tools.{folderName}.{functionName}(input)

This is the ONLY way to call these functions at runtime. The function declarations below are for type reference only.

## CRITICAL: EXTRACT ALL INFORMATION

You MUST extract and include ALL of the following from each tool definition:
- name, title, description
- inputSchema: ALL properties with types, descriptions, required fields, default values, enums, validation constraints (min/max, minLength/maxLength, pattern, format)
- outputSchema: The COMPLETE output structure including success AND error response patterns
- annotations: readOnlyHint, destructiveHint, idempotentHint, openWorldHint
- execution: taskSupport if present (forbidden/optional/required)

DO NOT OMIT ANY INFORMATION. Every property, every description, every type constraint, every validation rule must be captured.

## SDK FILE STRUCTURE RULES

1. EVERY file must start with a header comment block:
   /**
    * HOW TO CALL THIS TOOL:
    * await tools.{folderName}.{functionName}({ ...params })
    *
    * This is the ONLY way to invoke this tool in your code.
    * 
    * @title {title from tool definition}
    * @description {description from tool definition}
    * @readOnly {true/false}
    * @destructive {true/false}
    * @idempotent {true/false}
    * @openWorld {true/false}
    * @taskSupport {forbidden/optional/required} (if execution.taskSupport is present)
    */

2. Define ALL interfaces with JSDoc comments from descriptions
3. Convert JSON Schema types to TypeScript (string, number, boolean, arrays, objects)
4. Use union types for enums (e.g., status: "active" | "inactive")
5. Mark optional fields with ? based on the "required" array
6. Document defaults in JSDoc: /** @default "value" */
7. Document validation constraints in JSDoc: /** @minimum 1 @maximum 100 */ or /** @pattern ^[a-z]+$ */
8. Use camelCase for function/file names, PascalCase for interfaces

## OUTPUT SCHEMA HANDLING

When outputSchema IS provided, you MUST create complete type definitions for:
- The success response structure (usually { success: true, data: {...} })
- The error response structure (usually { success: false, error: { code, message } })
- Use union types to represent either success OR error: SuccessResponse | ErrorResponse

When outputSchema is NOT provided: Use Promise<unknown> as the return type.

## COMPLETE EXAMPLE SDK FILE

Here is an example of a WELL-GENERATED SDK file for a search tool with enums, defaults, and pagination (remember, this is just an example to use as a reference):

\`\`\`typescript
/**
 * HOW TO CALL THIS TOOL:
 * await tools.userManagement.searchUsers({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Search Users
 * @description Search users by name, email, address, or phone. Supports partial matching and pagination.
 * @readOnly true
 * @destructive false
 * @idempotent true
 * @openWorld false
 */

export type SearchField = "name" | "email" | "address" | "phone" | "all";

export interface User {
  id?: number;
  name: string;
  email: string;
  address: string;
  phone: string;
  favoriteColor?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SearchUsersInput {
  /** The search query string for partial matching */
  query: string;
  /** Which field to search in @default "all" */
  field?: SearchField;
  /** Maximum number of results to return @minimum 1 @maximum 100 */
  limit?: number;
  /** Number of results to skip for pagination @minimum 0 */
  offset?: number;
}

export interface SearchUsersSuccessData {
  /** Array of matching users */
  users: User[];
  /** Total number of matches (before pagination) */
  total: number;
  /** The limit that was applied */
  limit: number;
  /** The offset that was applied */
  offset: number;
  /** Whether there are more results beyond this page */
  hasMore: boolean;
}

export interface SearchUsersError {
  code: string;
  message: string;
}

export type SearchUsersOutput =
  | { success: true; data: SearchUsersSuccessData }
  | { success: false; error: SearchUsersError };

export async function searchUsers(input: SearchUsersInput): Promise<SearchUsersOutput>;
\`\`\`

## OUTPUT FORMAT

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
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    annotations: tool.annotations,
    execution: tool.execution,
  }));

  const userPrompt = `Source Name: "${source.name}"
Version: ${source.version || "unknown"}

Tool Definitions:
${JSON.stringify(toolsForPrompt, null, 2)}

CRITICAL INSTRUCTIONS:
1. Extract EVERY piece of information from each tool definition - do not omit anything
2. For each inputSchema property: include the type, description, whether it's required, any enums/defaults, and validation constraints (min/max, minLength/maxLength, pattern, format)
3. For each outputSchema: create complete TypeScript types for BOTH success and error responses
4. Include all annotations (readOnlyHint, destructiveHint, idempotentHint, openWorldHint) in the header comment
5. If execution.taskSupport is present, include it in the header comment as @taskSupport
6. Add JSDoc comments with descriptions for every interface property
7. Document defaults with @default and validation constraints with @minimum/@maximum/@pattern etc in JSDoc
8. For tools WITHOUT outputSchema, use Promise<unknown> as the return type

Generate comprehensive SDK files that capture ALL available type information.
Return ONLY valid JSON, no markdown.`;

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
