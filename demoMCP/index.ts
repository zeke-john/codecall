import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { registerTools } from "./tools.js";

const mcpServer = new McpServer({
  name: "test",
  version: "1.0.0",
  description: "description here",
  tools: {},
  resources: {},
});

registerTools(mcpServer);

const app = express();
app.use(express.json());

app.all("/mcp", async (req, res) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
    });

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

const PORT = parseInt(process.env.MCP_PORT || process.env.PORT || "4001");
app
  .listen(PORT, () => {
    console.log(`MCP Server running on http://localhost:${PORT}/mcp`);
  })
  .on("error", (error) => {
    console.error("MCP HTTP server error:", error);
    process.exit(1);
  });
