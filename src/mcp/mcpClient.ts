import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ToolSource, ToolDefinition, JSONSchema } from "../types";

export interface StdioServerConfig {
  type: "stdio";
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface HttpServerConfig {
  type: "http";
  url: string;
}

export type MCPServerConfig = StdioServerConfig | HttpServerConfig;

export interface ToolCallResult {
  success: boolean;
  content: unknown;
  error?: string;
}

function buildEnv(
  configEnv?: Record<string, string>
): Record<string, string> | undefined {
  if (!configEnv) return undefined;

  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return { ...env, ...configEnv };
}

export class MCPConnection {
  private client: Client;
  private serverName: string;
  private version?: string;
  private tools: ToolDefinition[];

  private constructor(
    client: Client,
    serverName: string,
    version: string | undefined,
    tools: ToolDefinition[]
  ) {
    this.client = client;
    this.serverName = serverName;
    this.version = version;
    this.tools = tools;
  }

  static async connect(config: MCPServerConfig): Promise<MCPConnection> {
    let transport;

    if (config.type === "stdio") {
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: buildEnv(config.env),
      });
    } else {
      transport = new StreamableHTTPClientTransport(new URL(config.url));
    }

    const client = new Client(
      { name: "codecall", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);

    const serverVersion = client.getServerVersion();
    const serverName = serverVersion?.name || "unknown-server";
    const version = serverVersion?.version;

    const response = await client.listTools();

    const tools: ToolDefinition[] = response.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as JSONSchema,
    }));

    return new MCPConnection(client, serverName, version, tools);
  }

  getToolSource(): ToolSource {
    return {
      name: this.serverName,
      version: this.version,
      tools: this.tools,
    };
  }

  async callTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResult> {
    try {
      const response = await this.client.callTool({
        name: toolName,
        arguments: args,
      });

      const contentArray = response.content as Array<{
        type: string;
        text?: string;
      }>;
      const textContent = contentArray.find(
        (c): c is { type: "text"; text: string } =>
          c.type === "text" && typeof c.text === "string"
      );

      if (response.isError) {
        return {
          success: false,
          content: null,
          error: textContent?.text || "Unknown error",
        };
      }

      let parsedContent: unknown = textContent?.text;
      if (textContent?.text) {
        try {
          parsedContent = JSON.parse(textContent.text);
        } catch {
          parsedContent = textContent.text;
        }
      }

      return {
        success: true,
        content: parsedContent,
      };
    } catch (error) {
      return {
        success: false,
        content: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

export async function connectToMCP(
  config: MCPServerConfig
): Promise<ToolSource> {
  const connection = await MCPConnection.connect(config);
  const source = connection.getToolSource();
  await connection.close();
  return source;
}

export function createInternalToolSource(
  name: string,
  tools: ToolDefinition[]
): ToolSource {
  return {
    name,
    tools,
  };
}
