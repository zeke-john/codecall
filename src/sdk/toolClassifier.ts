import { ToolDefinition, ToolCategory } from "../types";
import { callOpenRouter } from "../llm/modelClient";

interface ClassificationResult {
  toolName: string;
  category: ToolCategory;
}

interface ClassificationResponse {
  classifications: ClassificationResult[];
}

const CLASSIFICATION_SYSTEM_PROMPT = `
Given MCP tool definitions, classify each tool into exactly one of these four categories:

**Read**: Retrieves or queries data without modifying system state. The tool's primary purpose is to return structured information that the caller will use. Examples: fetching user data, searching records, listing items, getting configuration.

**Write**: Creates, updates, or modifies data. The response is typically a success/failure confirmation or a simple acknowledgment, not structured data the caller needs for subsequent operations. Examples: updating settings, sending notifications, logging events.

**Destructive**: Permanently removes or irreversibly modifies data. These operations cannot be undone and should be handled with extra caution. Examples: deleting records, purging data, revoking access permanently.

**Write+Read** (use "write_read"): Modifies data AND returns structured information about what was created or modified. The caller needs the response data for subsequent operations (like getting an ID of a created resource). Examples: creating a new record and returning it, updating a user and returning the updated user object.

Analyze each tool holistically:
- Consider what the tool does semantically, not just its name
- Think about whether the response contains structured data the caller would need
- Consider whether calling the tool changes system state
- Consider whether the operation is reversible

Return ONLY valid JSON with no markdown formatting:
{
  "classifications": [
    { "toolName": "exact_tool_name", "category": "read" | "write" | "destructive" | "write_read" }
  ]
}`;

export async function classifyTools(
  tools: ToolDefinition[]
): Promise<Map<string, ToolCategory>> {
  const userPrompt = `Classify these tools:

${JSON.stringify(tools, null, 2)}

Return ONLY valid JSON, no markdown.`;

  const content = await callOpenRouter([
    { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);

  const cleanedContent = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed = JSON.parse(cleanedContent) as ClassificationResponse;

  const result = new Map<string, ToolCategory>();
  for (const classification of parsed.classifications) {
    result.set(classification.toolName, classification.category);
  }

  return result;
}

export function needsOutputSchema(category: ToolCategory): boolean {
  return category === "read" || category === "write_read";
}
