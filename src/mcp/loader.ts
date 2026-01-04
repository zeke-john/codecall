import { MCPConnection, MCPServerConfig } from "./mcpClient";
import { ToolRegistry } from "../core/toolRegistry";

export interface MCPServerEntry {
  namespace: string;
  config: MCPServerConfig;
}

export interface LoadedMCPServers {
  registry: ToolRegistry;
  connections: MCPConnection[];
  close: () => Promise<void>;
}

function sanitizeNamespace(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "server";
}

export async function loadMCPServers(
  servers: MCPServerEntry[] | MCPServerConfig[]
): Promise<LoadedMCPServers> {
  const registry = new ToolRegistry();
  const connections: MCPConnection[] = [];

  for (let i = 0; i < servers.length; i++) {
    const entry = servers[i];
    let namespace: string | undefined;
    let config: MCPServerConfig;

    if ("namespace" in entry) {
      namespace = entry.namespace;
      config = entry.config;
    } else {
      config = entry;
    }

    const connection = await MCPConnection.connect(config);
    connections.push(connection);

    const finalNamespace =
      namespace ?? sanitizeNamespace(connection.getServerName());
    registry.registerMCP(finalNamespace, connection);
  }

  const close = async () => {
    await Promise.all(connections.map((c) => c.close()));
  };

  return { registry, connections, close };
}
