import {
  ToolDefinition,
  ToolCategory,
  ClassifiedTool,
  ClassifiedToolSource,
  ToolSource,
} from "../types";
import { MCPConnection } from "../mcp/mcpClient";
import { classifyTools, needsOutputSchema } from "./toolClassifier";
import { generateSampleInputs } from "./sampleDataGenerator";
import { inferSchemaFromResponse } from "./schemaInferrer";

export interface DiscoveryResult {
  classifiedSource: ClassifiedToolSource;
  errors: Array<{ toolName: string; error: string }>;
}

export async function discoverOutputSchemas(
  connection: MCPConnection
): Promise<DiscoveryResult> {
  const source = connection.getToolSource();
  const errors: Array<{ toolName: string; error: string }> = [];

  console.log(`\nClassifying ${source.tools.length} tools...`);
  const classifications = await classifyTools(source.tools);

  console.log("\nTool classifications:");
  const toolsNeedingSchema: Array<{
    tool: ToolDefinition;
    category: ToolCategory;
  }> = [];

  for (const tool of source.tools) {
    const category = classifications.get(tool.name) || "write";
    const needsSchema = needsOutputSchema(category);
    console.log(
      `  ${tool.name}: ${category}${
        needsSchema ? " (needs output schema)" : ""
      }`
    );
    if (needsSchema) {
      toolsNeedingSchema.push({ tool, category });
    }
  }

  console.log(
    `\nFound ${toolsNeedingSchema.length} tools needing output schema discovery\n`
  );

  let sampleInputs = new Map<string, Record<string, unknown>>();
  if (toolsNeedingSchema.length > 0) {
    console.log("Generating sample inputs...");
    sampleInputs = await generateSampleInputs(toolsNeedingSchema);
  }

  const outputSchemas = new Map<
    string,
    ReturnType<typeof inferSchemaFromResponse>
  >();

  for (const { tool, category } of toolsNeedingSchema) {
    const sampleInput = sampleInputs.get(tool.name);
    if (!sampleInput) {
      console.log(`[SKIP] ${tool.name}: No sample input generated`);
      errors.push({
        toolName: tool.name,
        error: "No sample input generated",
      });
      continue;
    }

    console.log(`[CALL] ${tool.name} (${category})`);
    console.log(`  Input: ${JSON.stringify(sampleInput)}`);
    const result = await connection.callTool(tool.name, sampleInput);

    if (!result.success) {
      console.log(`[FAIL] ${tool.name}: ${result.error}`);
      console.log(`  This tool will be generated without output types.`);
      errors.push({
        toolName: tool.name,
        error: result.error || "Tool call failed",
      });
      continue;
    }

    console.log(`[OK] ${tool.name}: Got response`);
    console.log(`  Response:`);
    console.log(
      JSON.stringify(result.content, null, 2)
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n")
    );

    const schema = inferSchemaFromResponse(result.content);
    console.log(`  Inferred schema:`);
    console.log(
      JSON.stringify(schema, null, 2)
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n")
    );
    outputSchemas.set(tool.name, schema);
  }

  const classifiedTools: ClassifiedTool[] = source.tools.map((tool) => {
    const category = classifications.get(tool.name) || "write";
    const outputSchema = outputSchemas.get(tool.name);

    return {
      ...tool,
      category,
      outputSchema,
    };
  });

  return {
    classifiedSource: {
      name: source.name,
      version: source.version,
      tools: classifiedTools,
    },
    errors,
  };
}

export async function discoverFromToolSource(source: ToolSource): Promise<{
  classifiedSource: ClassifiedToolSource;
  errors: Array<{ toolName: string; error: string }>;
}> {
  const errors: Array<{ toolName: string; error: string }> = [];

  console.log(`Classifying ${source.tools.length} tools...`);
  const classifications = await classifyTools(source.tools);

  const classifiedTools: ClassifiedTool[] = source.tools.map((tool) => {
    const category = classifications.get(tool.name) || "write";
    return {
      ...tool,
      category,
      outputSchema: undefined,
    };
  });

  return {
    classifiedSource: {
      name: source.name,
      version: source.version,
      tools: classifiedTools,
    },
    errors,
  };
}
