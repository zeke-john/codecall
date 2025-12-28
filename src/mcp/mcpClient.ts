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

export async function connectToMCP(
  config: MCPServerConfig
): Promise<ToolSource> {
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

  await client.close();

  return {
    name: serverName,
    version,
    tools,
  };
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
