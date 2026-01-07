# Codecall

> An Open Source Typescript implementation of Programmatic Tool Calling for AI Agents.

Codecall changes how agents interact with tools by letting them **write and execute code** (in secured sandboxes) that orchestrates multiple tools programmatically (like an API) to do a task, rather than making individual tool calls that bloat the context and increase the token usage like in traditional agents. Codecall also has progressive tool discovery & error handling!

**Demo** →

Codecall vs a Traditional Agent performing the same task w/ the same tools

_74.7% fewer tokens · 92.3% fewer tool calls_

https://github.com/user-attachments/assets/6cfc44e4-784a-4258-97d6-6ae694ef4024

## Problems with Traditional Agents

Traditional tool calling in agents has many fundamental architectural issues that get worse at scale:

### 1. Context Bloat & Wasting Tokens

Traditional agents send EVERY tool definition with every request, so for 20 tools thats about 6k+ tokens of schema definitions in every inference call, even for questions like, "what can you do?" or "update the date for this" where they are not necessary. This issue scales with tool count and gets multiplied with every turn in a conversation.

### 2. N Inference Calls for N Tool Operations

Every tool operation requires a full inference round-trip, so "Delete all completed tasks" becomes: LLM calls `findTasks`, waits, calls `deleteTask` for task 1, waits, calls for task 2... Each call resends the entire conversation history including all previous tool results, so the tokens compound. For example those 20 steps = 20+ inference calls with exponentially growing context.

### 3. No Parallel Execution

Similar to #2, but traditional agents execute tools sequentially even when operations are independent. Ten API calls that could run simultaneously instead happen one at a time with the agent reasoning between each of them that wastes time, tokens, and unnecessarily sends info into the context window and through the API provider's infrastructure.

### 4. Models are not great at Lookup

Benchmarks show models have a **[10-50% failure rate](https://github.com/toon-format/toon?tab=readme-ov-file#per-model-accuracy)** when searching through large datasets in context. They hallucinate field names, miss entries, and get confused by similar data.

But doing this programmatically fixes this because it can just write code, as its deterministic so 0% failure rate

```typescript
users.filter((u) => u.role === "admin");
```

## Our Approach

Let models do what they're good at: **writing code**.

LLMs have enormous amounts of real-world TypeScript in their training data. They're significantly better at writing code to call APIs than they are at the arbitrary JSON matching that tool calling requires.

Codecall ALSO only has 2 tools: `readFile` and `executeCode`, along with our SDK file tree of your tools (that we generate ahead of time) in context, so the agent only reads and gets the context it needs as needed based on the task, so this makes a 30 tool setup effectively have the same base context as a 5 tool setup (only the file tree gets larger)

```typescript
// Instead of 20+ inference passes and 90k+ tokens:
const allUsers = await tools.users.listAllUsers();
const adminUsers = allUsers.filter((u) => u.role === "admin");
const resources = await tools.resources.getSensitiveResources();

progress({
  step: "Data loaded",
  admins: adminUsers.length,
  resources: resources.length,
});

const revokedAccesses = [];
const failedAccesses = [];

for (const admin of adminUsers) {
  for (const resource of resources) {
    try {
      const result = await tools.permissions.revokeAccess({
        userId: admin.id,
        resourceId: resource.id,
      });
      if (result.success) {
        revokedAccesses.push({ admin: admin.name, resource: resource.name });
      }
    } catch (err) {
      failedAccesses.push({
        admin: admin.name,
        resource: resource.name,
        error: err.message,
      });
    }
  }
}

return {
  totalAdmins: adminUsers.length,
  resourcesAffected: resources.length,
  accessesRevoked: revokedAccesses.length,
  accessesFailed: failedAccesses.length,
};
```

Three inference passes. The code runs in a sandbox calling all 20 updates programmatically with step by step updates, only pulling the relevant context when it is needed, and returning only what is necessary. Saving tens of thousands worth of tokens, and doing everything more efficiently.

## Getting Started

### Prerequisites

- **Node.js** v20+ and npm
- **Deno** v2+ (for sandbox execution) - [Install Deno](https://docs.deno.com/runtime/getting_started/installation/)
- **OpenRouter API Key** (or any OpenRouter compatible provider)

### Clone the repo

```bash
git clone https://github.com/zeke-john/codecall.git
cd codecall
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
```

Optional variables:

```bash
TODOIST_API_KEY=your_todoist_api_key    # For Todoist the todoist MCP
MCP_PORT=4001                           # Custom port for demo MCP server
```

### Running the Demo MCP Server

Codecall includes a demo MCP server with user management tools for testing. Start it in a separate terminal:

```bash
npm run mcp
```

This starts an HTTP MCP server at `http://localhost:4001/mcp` with 18 user management tools (create, update, delete, search, etc.) that operate on `demoMCP/users.json`.

### Running the Codecall Agent

With the demo MCP server running:

```bash
npm run codecall
```

This starts an interactive chat session using the Codecall approach (2 internal tools + SDK file tree). The agent will read SDK files on-demand and write code to execute tasks in a sandbox.

### Running the Traditional Agent

For comparison, run the traditional agent that exposes all tools directly:

```bash
npm run traditional
```

### Chat Commands

Both agents support these commands:

- `/exit` or `/quit` - Exit the chat
- `/clear` - Clear conversation history
- `/tools` - List all available tools

### Connecting to Custom MCP Servers

#### Option 1: Command Line Arguments

Connect to stdio-based MCP servers:

```bash
npm run codecall -- --stdio namespace npx @some/mcp-server arg1 arg2
```

Connect to HTTP-based MCP servers:

```bash
npm run codecall -- --http namespace http://localhost:3000/mcp
```

Multiple servers:

```bash
npm run codecall -- \
  --stdio todoist npx @doist/todoist-ai \
  --http demo http://localhost:4001/mcp
```

#### Option 2: Modify Default Servers

Edit `scripts/chat.ts` and modify the `getDefaultServers()` function:

```typescript
function getDefaultServers(): MCPServerEntry[] {
  return [
    {
      namespace: "demo",
      config: {
        type: "http",
        url: "http://localhost:4001/mcp",
      },
    },
    {
      namespace: "github",
      config: {
        type: "stdio",
        command: "docker",
        args: ["run", "-i", "--rm", "ghcr.io/github/github-mcp-server"],
        env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN },
      },
    },
  ];
}
```

### Generating SDK Files from MCP Servers

Before using Codecall with a new MCP server, generate SDK files:

```bash
# From an HTTP MCP server
npm run test:mcp -- http http://localhost:4001/mcp

# From a stdio MCP server
npm run test:mcp -- stdio npx @doist/todoist-ai

# With environment variables
npm run test:mcp -- stdio npx @some/server --env API_KEY=xxx

# Custom output directory
npm run test:mcp -- http http://localhost:4001/mcp --output ./mysdks
```

SDK files are written to `generatedSdks/tools/{namespace}/`. see `docs/exampleSdkFile.ts` or any of the existing SDK files for the recommended format.

### Dev Scripts

For Observability & testing individual components:

```bash

# Debugs the demo MCP server using the MCP Inspector
npm run inspect

# Test the sandbox execution
npx tsx scripts/testSandbox.ts

# Test the tool registry
npx tsx scripts/testToolRegistry.ts
```

### Project Structure

```
codecall/
├── src/
│   ├── agents/           # Codecall and Traditional agent implementations
│   ├── core/             # Sandbox, tool registry, internal tools
│   ├── llm/              # OpenRouter client
│   ├── mcp/              # MCP client and loader
│   ├── sdk/              # SDK generator
│   └── types/            # TypeScript type definitions
├── scripts/              # CLI scripts for running agents
├── demoMCP/              # Demo MCP server with user tools
├── generatedSdks/        # Generated SDK files (tools/)
└── docs/                 # Example SDK file format (more coming soon)
```

## How Codecall Works

Codecall gives the model 2 tools + a file tree to work with so the model still controls the entire flow that decides what to read, what code to write, when to execute, and how to respond... so everything stays fully agentic.

Instead of exposing every tool directly to the LLM for it to call, Codecall:

- Converts your MCP definitions into TypeScript SDK files (types + function signatures)
- Shows the model a directory tree of available files
- Allows the model to selectively read SDK files to understand types and APIs
- Lets the model write code to accomplish the task
- Executes that code in a deno sandbox with access to your actual tools as functions
- Returns the execution result back (success/error)
- Lets the model produce a respond or continue

The system message by default has an SDK file tree showing all available tools as files, it just shows them the file tree and not the actual contents of each of the files, so it can progressively discover tools as it needs them for a certain task

Example:

```
tools/
├─ Database
│  ├─ checkEmailExists.ts
│  ├─ cloneUser.ts
│  ├─ createUser.ts
│  ├─ deactivateUsersByDomain.ts
│  ├─ deleteUser.ts
│  ├─ getUsersByFavoriteColor.ts
│  ├─ getUsersCreatedAfter.ts
│  ├─ getUserStats.ts
│  ├─ searchUsers.ts
│  ├─ setUserActiveStatus.ts
│  ├─ setUserFavoriteColor.ts
│  ├─ updateUser.ts
│  └─ validateEmailFormat.ts
└─ todoist
   ├─ addComments.ts
   ├─ addProjects.ts
   ├─ addSections.ts
   ├─ addTasks.ts
   ├─ manageAssignments.ts
   ├─ search.ts
   ├─ updateComments.ts
   ├─ updateProjects.ts
   ├─ updateSections.ts
   ├─ updateTasks.ts
   └─ userInfo.ts
```

### 1. `readFile(path: string)`

Returns the full contents of a specific SDK file, including type definitions, function signatures, and schemas.

Example:

`readFile({ path: "tools/users/listAllUsers.ts" });` ->

```typescript
/**
 * HOW TO CALL THIS TOOL:
 * await tools.users.listAllUsers({ limit: 100, offset: 0 })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface ListAllUsersInput {
  limit?: number;
  offset?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
  department: string;
  createdAt: string;
}

export async function listAllUsers(input: ListAllUsersInput): Promise<User[]>;
```

### 2. `executeCode(code: string)`

Executes TypeScript code in a Deno sandbox. Returns either the successful output or an error w/ the execution trace.

Example:

```typescript
executeCode(`
  const users = await tools.users.listAllUsers({ limit: 100 });
  return users.filter(u => u.role === "admin");
`);
```

Success returns:

```typescript
{
  status: "success",
  output: [
    { id: "1", name: "Alice", role: "admin", ... },
    { id: "2", name: "Bob", role: "admin", ... }
  ],
  progressLogs: [{ step: "Loading users..." }]
}
```

Error returns:

```typescript
{
  status: "error",
  error: `=== ERROR ===
Type: Error
Message: Undefined value at 'result[0]'. This usually means you accessed a property that doesn't exist.

=== STACK TRACE ===
Error: Undefined value at 'result[0]'...
    at validateResult (file:///.../sandbox.ts:68:11)
    at file:///.../sandbox.ts:99:5

progressLogs: [{ step: "Loading users..." }]
}
```

The error includes the full stack trace, giving the model maximum context to fix the issue and try again, then update the SDK file once fixed.

### Code Execution & Sandboxing

When the model calls `executeCode()`, Codecall runs that code inside a fresh, short-lived Deno sandbox. Each sandbox is spun up using Deno and runs the code in isolation. Deno’s security model blocks access to sensitive capabilities unless explicitly allowed.

By default, the sandboxed code has no access to the filesystem, network, environment variables, or system processes. The only way it can interact with the outside world is by calling the tool functions exposed through tools (which are forwarded by Codecall to the MCP server).

#### Sandbox Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│   ┌─────────┐       ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐         │
│   │  SPAWN  │────--▶│  INJECT │────▶│ EXECUTE │────▶│ CAPTURE │────▶│ DESTROY │         │
│   └─────────┘       └─────────┘     └─────────┘     └─────────┘     └─────────┘         │
│        │                 │               │               │               │              │
│        ▼                 ▼               ▼               ▼               ▼              │
│   Fresh Deno       tools proxy     Run generated    Collect return   Terminate          │
│   process with     + progress()    TypeScript       value or error   process,           │
│   deny-by-default  injected        code             + progress logs  cleanup            │
│   (Deno 2)                                                                              │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│    SANDBOX                        TOOL BRIDGE                         MCP SERVER        │
│       │                               │                                    │            │
│       │  tools.users.listAllUsers()   │                                    │            │
│       │ ─────────────────────────────▶│                                    │            │
│       │                               │                                    │            │
│       │                               │   tools/call: listAllUsers         │            │
│       │                               │ ──────────────────────────────────▶│            │
│       │                               │                                    │            │
│       │                               │          [{ id, name, role }, ...] │            │
│       │                               │ ◀──────────────────────────────────│            │
│       │                               │                                    │            │
│       │   Promise<User[]> resolved    │                                    │            │
│       │ ◀─────────────────────────────│                                    │            │
│       │                               │                                    │            │
│       │  (code continues execution)   │                                    │            │
│       │                               │                                    │            │
│       │  progress({ step: "Done" })   │                                    │            │
│       │ ─────────────────────────────▶│                                    │            │
│       │                               │                                    │            │
│       │                          Streams to UI                             │            │
│       │                               │                                    │            │
│       │  return { success: true }     │                                    │            │
│       │ ─────────────────────────────▶│                                    │            │
│       │                               │                                    │            │
│       │                     Result sent to Model                           │            │
│       │                     for response generation                        │            │
│       │                               │                                    │            │
│                                       ▼                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### How Tool Calls Work at Runtime

When the generated code runs, Codecall injects a `tools` Proxy into the sandbox.

- `tools` is not a set of local functions, but a Proxy that intercepts all property access
- Each call like `tools.namespace.method(args)` sends a JSON message via IPC to the host
- The host's `ToolRegistry` routes the call to the correct handler (MCP server or internal function)
- Results are sent back via IPC, and the Promise resolves in the sandbox

So when the the model calls `executeCode()` w/ tools:

```typescript
const result = await tools.permissions.revokeAccess({
  userId: admin.id,
  resourceId: resource.id,
  reason: "security-audit",
});
```

What actually happens is:

- The sandbox's `tools` Proxy intercepts the call and sends a JSON message to stdout: `{ type: "call", tool: "permissions.revokeAccess", args: {...} }`
- The host process (Node.js) receives this via IPC and routes it through the `ToolRegistry`
- The `ToolRegistry` looks up the handler (MCP connection or internal function) and executes it
- The result is sent back to the sandbox via stdin: `{ id: 1, result: {...} }`
- The sandbox resolves the Promise and code continues running

From the code's perspective this behaves exactly like calling a normal async function.

### Generating SDK's from Tool Definitions

As mentioned above, Codecall converts MCP tool definitions into TypeScript SDK files so it's clearer to reference when writing code. So when you connect an MCP server, Codecall:

1. Reads all tools from the MCP server, including their `inputSchema`, `outputSchema`, descriptions, annotations (readOnly, destructive, idempotent), and execution hints

2. Uses Gemini 3 Flash to the convert JSON Schema definitions into well-typed TypeScript files with:

   - Complete type definitions for inputs and outputs
   - JSDoc comments with descriptions, defaults, and validation constraints
   - Proper handling of enums, optional fields, and nested objects
   - Success/error response types when output schemas are provided

3. Groups tools into folders (e.g., `tools/database/`, `tools/todoist/`) based on the MCP server name

4. Saves all SDK files to `generatedSdks/tools/{namespace}/` for the agent to discover and read on-demand

This approach makes sure that the agent sees clean, well-typed TypeScript interfaces and schemas instead of raw JSON schemas, making it easier for the model to write correct code. The SDK files are also self-documenting with JSDoc comments that capture all the metadata from the original tool definitions, and that it can be edited in the future.

#### Progressive SDK Learning

Codecall also has a self-learning system that automatically improves the SDK documentation we generate when the agents recover from tool call errors. Unlike traditional agents that repeat the same mistakes across sessions, Codecall builds memory for what not to do that compounds over time by updating the actual SDK Files.

Because Codecall writes code that strings together multiple tool calls into a single script to do the user's task, it becomes a lot more important for the tools not to fail, because even small input schema issue, assuming the output shape it different, or guessing the wrong semantics would cause the entire script to fail, and for the agent to re-write it and fix it.

##### The Flow

**First agent** makes a mistake:

```typescript
// Agent calls: tools.todoist.findTasks({ })
// Error: "At least one filter must be provided..."
```

After fixing the issue in that run, the agent automatically updates the SDK file that was unclear (which led to the issue) with this at the top...

So in `todoist/findTasks.ts` it adds:

```typescript
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  @CC LEARNED CONSTRAINT                                                    ║
 * ║  The `findTasks` tool requires "At least one filter must be provided:      ║
 * ║  searchText, projectId, sectionId, parentId, responsibleUser, or           ║
 * ║  labels" - you cannot call it with only `responsibleUserFiltering` or      ║
 * ║  `limit`. To get all tasks, you must iterate through all projects          ║
 * ║  using `projectId` as the required filter, or provide a non-empty          ║
 * ║  `searchText`.                                                             ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */
```

**Next agent** reads that same SDK file, and sees the banner for the learned constraint immediately:

```typescript
// Agent reads: tools/todoist/findTasks.ts
// Sees the @CC LEARNED CONSTRAINT banner at the top
// Writes correct code from the start:
const tasks = await tools.todoist.findTasks({ projectId: "blah blah blah" });
```

So no error and no wasted inference. The learned constraint form the previous agent prevents the same mistake entirely.

### Progress Updates

The model uses `progress()` to provide real time feedback while a script in being executed. This gives users visibility into what's happening without requiring multiple `executeCode()` calls like normal tools calls.

The sandbox uses stdout as an IPC channel and not a log stream, so each line is parsed as a JSON and routed based on its `type` field. A normal `console.log("hi")` isn't valid protocol JSON, so the sandbox ignores it.

`progress(data)` wraps your data in the correct format: `{ type: "progress", data }` so it gets captured, stored in `progressLogs`, and forwarded to the `onProgress` callback.

#### Example

```typescript
const users = await tools.users.listAllUsers();
progress({ step: "Loaded users", count: users.length });

const admins = users.filter((u) => u.role === "admin");
progress({ step: "Filtered admins", count: admins.length });

for (let i = 0; i < admins.length; i++) {
  await tools.permissions.revokeAccess({ userId: admins[i].id });
  if ((i + 1) % 10 === 0) {
    progress({ step: "Revoking", processed: i + 1, total: admins.length });
  }
}

progress({ step: "Complete", revoked: admins.length });
return { adminsProcessed: admins.length };
```

This keeps the UX of a step by step agent with user facing updates while the script is running, while still getting the cost and speed benefits of a single pass execution.

## Why TypeScript?

[Benchmarks](https://github.com/Tencent-Hunyuan/AutoCodeBenchmark?tab=readme-ov-file#experimental-results) show Claude Opus 4.1 performs:

- **42.3%** on Python
- **47.7%** on TypeScript

That's a 12% improvement just from language choice, and various other models show the same pattern.

TypeScript also gives you:

- Full type inference for SDK generation
- Compile time validation of tool schemas
- The model sees types and can use them correctly

## Roadmap

- [x] **MCP Client** - connect to MCP servers via stdio/HTTP
- [x] **Tool Registry** - unified routing for MCP + internal tools
- [x] **Generate SDK Files** - For every tool, generate a well typed SDK file w/ the input & output schemas
- [x] **Deno Sandbox** - isolated TypeScript execution with an IPC tool bridge
- [x] **Tools Proxy** - intercept `tools.namespace.method()` calls in the deno sandbox
- [x] **Progress Streaming** - the Real time `onProgress` callback support is working
- [x] **Handling Errors** - the entire stack traces + numbered code on failure returns on error
- [x] **Result Validation** - Catch undefined values (property access errors) similar to the above

### Agent

- [x] **Add internal tools** - Expose the `readFile` and `executeCode` tools to Agent
- [x] **Normal agent loop** - handle LLM messages and tool calls w/ streaming, just a normal agent loop w/ open router
- [x] **System prompt** - guide the LLM to explore SDK files, write code and etc
- [ ] **"Are you sure" option w/ Reason** - add a warning for destructive tools in code scripts, the user can type y/n if they want to continue (we also give a reason)

### More stuff

- [x] **Side By Side** - Using the same set of tools and a task, do a direct comparison w/ code call and a traditional agent
- [x] **Add a Setup section** - In this readme add a section to see how to get started
- [ ] **Documentation** - docs, usage examples, use cases, when to and not to use, etc
- [ ] **NPM Package** - an npm package for codecall, down the road :)

## Contributing

We welcome contributions! Please Feel free to:

- Open issues for bugs or feature requests
- Submit PRs for improvements
- Share your use cases and feedback

## Acknowledgements

This project builds on ideas from the community and is directly inspired by:

#### Videos

- Yannic Kilcher – [What Cloudflare's code mode misses about MCP and tool calling](https://www.youtube.com/watch?v=0bpYCxv2qhw)
- Theo – [Anthropic admits that MCP sucks](https://www.youtube.com/watch?v=1piFEKA9XL0&t=201s) & [Anthropic is trying SO hard to fix MCP...](https://www.youtube.com/watch?v=hPPTrsUzLA8&t=2s)
- Boundary - [Using MCP server with 10000+ tools: 🦄 Ep #7](https://www.youtube.com/watch?v=P5wRLKF4bt8)

#### Articles

- Cloudflare – [Code mode: the better way to use MCP](https://blog.cloudflare.com/code-mode/)
- Anthropic – [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) & [Introducing advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use)
- Medium - [Your Agent Is Wasting Money On Tools. Code Execution With MCP Fixes It.](https://medium.com/genaius/your-agent-is-wasting-money-on-tools-code-execution-with-mcp-fixes-it-5c8d7b177bad)

## License

MIT
