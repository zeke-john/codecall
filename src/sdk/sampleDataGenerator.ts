import { ToolDefinition, ToolCategory } from "../types";
import { callOpenRouter } from "../llm/modelClient";

interface SampleDataResult {
  toolName: string;
  sampleInput: Record<string, unknown>;
}

interface SampleDataResponse {
  samples: SampleDataResult[];
}

const SAMPLE_DATA_SYSTEM_PROMPT = `You are a test data generator. Given MCP tool definitions and their categories, generate sample input data that will return ACTUAL DATA from the API.

CRITICAL RULES FOR READ TOOLS:
- The goal is to get real data back so we can infer the output schema
- Use the BROADEST possible query - avoid restrictive filters
- Only include REQUIRED fields if possible
- If filters are required, use the most inclusive values (e.g., "all" instead of "today")
- DO NOT combine multiple filters - each filter narrows results
- DO NOT use high priority filters (priority 4 is rare) - use priority 1 or omit entirely
- If limit is optional, either omit it or set a reasonable value like 10
- Prefer empty objects {} if no fields are required

RULES FOR WRITE_READ TOOLS:
- Generate minimal test data with a unique identifiable name like "codecall_test_<timestamp>"
- Only include required fields plus fields needed to make the response interesting

GENERAL RULES:
- All values must satisfy inputSchema constraints (required fields, types, enums)
- Use safe values that won't cause harm

Return ONLY valid JSON with no markdown formatting:
{
  "samples": [
    { "toolName": "exact_tool_name", "sampleInput": { ...minimal input to get maximum data back... } }
  ]
}`;

export async function generateSampleInputs(
  tools: Array<{ tool: ToolDefinition; category: ToolCategory }>
): Promise<Map<string, Record<string, unknown>>> {
  if (tools.length === 0) {
    return new Map();
  }

  const toolsWithCategories = tools.map(({ tool, category }) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    category,
  }));

  const userPrompt = `Generate sample input data for these tools:

${JSON.stringify(toolsWithCategories, null, 2)}

Return ONLY valid JSON, no markdown.`;

  const content = await callOpenRouter([
    { role: "system", content: SAMPLE_DATA_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);

  const cleanedContent = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed = JSON.parse(cleanedContent) as SampleDataResponse;

  const result = new Map<string, Record<string, unknown>>();
  for (const sample of parsed.samples) {
    result.set(sample.toolName, sample.sampleInput);
  }

  return result;
}
