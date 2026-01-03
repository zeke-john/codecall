import { MCPConnection } from "../mcp/mcpClient";
import { ToolDefinition } from "../types/tool";
import { ToolHandler, InternalToolDefinition } from "../types/registry";

function toCamelCase(str: string): string {
  return str.replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase());
}

export class ToolRegistry {
  private handlers = new Map<string, ToolHandler>();
  private toolDefinitions = new Map<string, ToolDefinition>();

  registerMCP(namespace: string, connection: MCPConnection): void {
    const source = connection.getToolSource();
    for (const tool of source.tools) {
      const camelName = toCamelCase(tool.name);
      const path = `${namespace}.${camelName}`;
      this.toolDefinitions.set(path, tool);
      this.handlers.set(path, async (args) => {
        const result = await connection.callTool(tool.name, args);
        if (!result.success) {
          throw new Error(result.error ?? "Tool call failed");
        }
        return result.content;
      });
    }
  }

  registerInternalTools(
    namespace: string,
    tools: InternalToolDefinition[]
  ): void {
    for (const tool of tools) {
      const path = `${namespace}.${tool.name}`;
      this.toolDefinitions.set(path, {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      });
      this.handlers.set(path, tool.handler);
    }
  }

  async call(
    toolPath: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const handler = this.handlers.get(toolPath);
    if (!handler) {
      throw new Error(`Unknown tool: ${toolPath}`);
    }
    return handler(args);
  }

  getRegisteredPaths(): string[] {
    return [...this.handlers.keys()];
  }

  hasPath(toolPath: string): boolean {
    return this.handlers.has(toolPath);
  }

  getToolDefinition(toolPath: string): ToolDefinition | undefined {
    return this.toolDefinitions.get(toolPath);
  }

  getAllToolDefinitions(): Map<string, ToolDefinition> {
    return new Map(this.toolDefinitions);
  }
}
