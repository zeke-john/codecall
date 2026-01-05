# Codecall

> An open source Typescript implementation of Programmatic Tool Calling for AI Agents.

Codecall changes how agents interact with tools by letting them **write and execute code** instead of making individual tool calls that bloat context, increase the price, and slow everything down

Works with **MCP servers** and **standard tool definitions**.

> [!NOTE] > **Before reading** :)
>
> Please keep in mind all of this is the **future plan** for Codecall and how it will work. Codecall is still a WIP and not production ready.
>
> If you're interested in contributing or following the project, check back soon or open an issue to discuss ideas!

## The Problem

Traditional tool calling has fundamental architectural issues that get worse at scale:

### 1. Context Bloat

Every tool definition lives in your system prompt. Connect a few MCP servers and you're burning tens of thousands of tokens before the conversation even starts.

```
GitHub MCP:        22 tools  →  ~44,000 tokens
Internal Tools:    12 tools  →  ~24,000 tokens
───────────────────────────────────────────────
Total:             34 tools  →  ~68,000 tokens (before any work happens)
```

### 2. Inference Overhead

Each tool call requires a full model inference pass. The entire conversation history gets sent back and forth every single time.

```
User: "Find all admin users and update their permissions"

Traditional approach:
  Turn 1: [8,000 tokens] → get_all_users()
  Turn 2: [18,000 tokens] → filter mentally, pick first admin
  Turn 3: [19,500 tokens] → update_user(id1, ...)
  Turn 4: [21,000 tokens] → update_user(id2, ...)
  Turn 5: [22,500 tokens] → update_user(id3, ...)
  ...
  Total: 150,000+ tokens, 12 inference passes
```

The problem also compounds because each tool call adds its output to the context, making every subsequent generation more expensive.

### 3. Models Are Bad at Data Lookup

Benchmarks show models have a **10-50% failure rate** when searching through large datasets in context. They hallucinate field names, miss entries, and get confused by similar data.

But doing this programmatically fixes this because it can just write code, as its deterministic (so 0% failure rate)

```typescript
users.filter((u) => u.role === "admin");
```

### 4. Models were never trained for tool calling

The special tokens used for tool calls (`<tool_call>`, `</tool_call>`) are synthetic training data. Models dont have much exposure to the tool calling syntax, and have only seen contrived examples from training sets... but they DO have:

- Millions of lines of real world TypeScript
- Lots of experience writing code to call APIs

> “Making an LLM perform tasks with tool calling is like putting Shakespeare through a month-long class in Mandarin and then asking him to write a play in it. It’s just not going to be his best work.”  
> — [Cloudflare Engineering](https://blog.cloudflare.com/code-mode/)

#### An example of a model that WAS trained to call tools

Even though Grok 4 was heavily trained on tool calling. Result? It hallucinates tool call XML syntax in the middle of responses, writing the format but not triggering actual execution. The model “knows” the syntax exists but doesn’t use it correctly.

## The Solution

Let models do what they're good at: **writing code**.

LLMs have enormous amounts of real-world TypeScript in their training data. They're significantly better at writing code to call APIs than they are at the arbitrary JSON matching that tool calling requires.

```typescript
// Instead of 12+ inference passes and 150+ tokens:
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

One inference pass. [~2,000 tokens. 98.7% reduction.](https://www.anthropic.com/engineering/code-execution-with-mcp)

## How Codecall Works (WIP)

Codecall gives the model 3 tools to work with so the model still controls the entire flow that decides what to read, what code to write, when to execute, and how to respond... so everything stays fully agentic.

Instead of exposing every tool directly to the LLM for it to call, Codecall:

- Converts your MCP definitions into TypeScript SDK files (types + function signatures)
- Shows the model a directory tree of available files
- Allows the model to selectively read SDK files to understand types and APIs
- Lets the model write code to accomplish the task
- Executes that code in a deno sandbox with access to your actual tools as functions
- Returns the execution result back (success/error)
- Lets the model produce a respond or continue

### The 3 Available Tools:

#### 1. `listFiles()`

Returns the SDK file tree showing all available tools as files

Example:

`listFiles()` ->

```
tools/
├─ users/
│ ├─ listAllUsers.ts
│ ├─ getUser.ts
│ ├─ updateUser.ts
│ └─ ...
├─ permissions/
│ ├─ revokeAccess.ts
│ ├─ grantAccess.ts
│ ├─ listPermissions.ts
│ └─ ...
├─ resources/
│ getSensitiveResources.ts
│ listResources.ts
└─ ...
```

#### 2. `readFile(path: string)`

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

#### 3. `executeCode(code: string)`

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

=== CODE THAT FAILED ===
    1 |     const users = await tools.users.listAllUsers();
    2 |     const names = users.map(u => u.nmae);
    3 |     return names;`,
  progressLogs: [{ step: "Loading users..." }]
}
```

The error includes the full stack trace and the numbered user code, giving the model maximum context to fix the issue.

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

## Progress Updates

The model can use `progress()` to provide real time feedback during longer running operations. This gives users visibility into what's happening without requiring multiple `executeCode()` calls like normal tools calls.

The sandbox uses stdout as an IPC channel and not a log stream, so each line is parsed as a JSON and routed based on its `type` field. A normal `console.log("hi")` isn't valid protocol JSON, so the sandbox ignores it.

`progress(data)` wraps your data in the correct format (`{ type: "progress", data }`) so it gets captured, stored in `progressLogs`, and forwarded to the `onProgress` callback.

### Example

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

This keeps the UX of a step-by-step agent with user-facing updates while still getting the cost and speed benefits of single-pass execution.

## Why TypeScript?

[Benchmarks](https://github.com/Tencent-Hunyuan/AutoCodeBenchmark?tab=readme-ov-file#experimental-results) show Claude Opus 4.1 performs:

- **42.3%** on Python
- **47.7%** on TypeScript

That's a 12% improvement just from language choice, and various other models show the same pattern.

TypeScript also gives you:

- Full type inference for SDK generation
- Compile time validation of tool schemas
- The model sees types and can use them correctly

## Main Challenges

Please reference [docs/CHALLENGES.md](https://github.com/zeke-john/codecall/blob/main/docs/CHALLENGES.md) for the codecall's main 3 challenges

Link to Hacker News post describing these -> https://news.ycombinator.com/item?id=46473471

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

- [x] **Add internal tools** - Expose `listFiles`, `readFile`, `executeCode` to LLM
- [x] **Normal agent loop** - handle LLM messages and tool calls w/ streaming, just a normal agent loop w/ open router
- [x] **System prompt** - guide the LLM to explore SDK files, write code and etc
- [] add warning for destrtive tools in code scripts the user can type y/n if they want to continue

### More stuff

- [ ] **Side By Side** - Using the same set of tools and a task, do a direct comparison w/ code call and a traditional agent
- [ ] **Documentation** - docs and usage examples
- [ ] **NPM Package** - an npm package for codecall (down the road)

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
