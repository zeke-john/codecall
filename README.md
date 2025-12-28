# Codecall

> An open source Typescript implementation of Programmatic Tool Calling for AI Agents.

Codecall changes how agents interact with tools by letting them **write and execute code** instead of making individual tool calls that bloat context, increase the price, and slow everything down

Works with **MCP servers** and **standard tool definitions**.

> [!NOTE]
> **Before reading** :)
>
> Please keep in mind all of this is the **future plan** for Codecall and how it will work. Codecall is still a WIP and not production ready.
>
> The README describes the vision and architecture for how the system will function once completed and worked on. Features, API design, and implementation details are subject to change.
>
> If you're interested in contributing or following the project, check back soon or open an issue to discuss ideas!

## The Problem

Traditional tool calling has fundamental architectural issues that get worse at scale:

### 1. Context Bloat

Every tool definition lives in your system prompt. Connect a few MCP servers and you're burning tens of thousands of tokens before the conversation even starts.

```
GitHub MCP:        16 tools  →  ~32,000 tokens
Internal Tools:    12 tools  →  ~24,000 tokens
───────────────────────────────────────────────
Total:             28 tools  →  ~56,000 tokens (before any work happens)
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

But you know what has a 0% failure rate?

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

### 5. Privacy

Every intermediate result flows through the model provider. That 10,000 row customer spreadsheet? That internal employee database? All of it goes into the model's context window and through the API provider's infrastructure.

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

One inference pass. ~2,000 tokens. 98.7% reduction.

## How Codecall Works (WIP)

Instead of exposing every tool directly to the LLM for it to call, Codecall:

- Converts your MCP definitions into TypeScript SDK files (types + function signatures)
- Shows the model a directory tree of available files
- Allows the model to selectively read SDK files to understand types and APIs
- Lets the model write code to accomplish the task
- Executes that code in a deno sandbox with access to your actual tools as functions
- Returns the execution result back to the same model in a 2nd request
- Lets the model produce the final user-facing response

Codecall uses two model requests per user turn: one to write code, and one to explain the execution result.

### SDK File Tree (What the Model Sees)

At the start of every request, the model is shown only the file tree, not the contents of each file.

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
└─ resources/
├─ getSensitiveResources.ts
├─ listResources.ts
└─ ...
```

This gives the model a high-level map of what capabilities exist without bloating the prompt with thousands of lines of schemas.

### Reading SDK Files (Discovering Tools)

When the model needs to understand how a specific tool works, it can explicitly request the contents of a file using a built in `readFile` tool:

```typescript
readFile({
  module: "users",
  name: "listAllUsers",
});
```

This returns the entire contents of that SDK file, and each file contains type definitions for that tool, for example:

```typescript
// /tools/users/listAllUsers.ts
// SDK stub for tool: "users.listAllUsers"

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

export async function listAllUsers(input: ListAllUsersInput): Promise<User[]> {
  return call("users.listAllUsers", input);
}
```

The model can read only the files it needs which it can infer from the filenames, just like a developer opening files in an editor, instead of having every tool definition injected into context upfront.

This keeps prompts small while still giving the model precise, typed knowledge of each tool before it writes code.

### Writing Code

After reading the relevant SDK files, the model writes a single TypeScript program like:

```typescript
const allUsers = await tools.users.listAllUsers({ limit: 1000 });
progress({ step: "Loaded all users", count: allUsers.length });

const adminUsers = allUsers.filter((u) => u.role === "admin");
progress({ step: "Identified admin users", count: adminUsers.length });

const sensitiveResources = await tools.resources.getSensitiveResources();
progress({
  step: "Loaded sensitive resources",
  count: sensitiveResources.length,
});

const revokedAccesses = [];
const failedAccesses = [];
let processed = 0;

for (const admin of adminUsers) {
  for (const resource of sensitiveResources) {
    processed++;
    try {
      const result = await tools.permissions.revokeAccess({
        userId: admin.id,
        resourceId: resource.id,
        reason: "security-audit",
      });

      if (result.success) {
        revokedAccesses.push({
          adminName: admin.name,
          adminEmail: admin.email,
          resourceName: resource.name,
          revokedAt: result.timestamp,
        });
      } else {
        failedAccesses.push({
          adminName: admin.name,
          resourceName: resource.name,
          reason: result.reason || "unknown",
        });
      }

      if (processed % 10 === 0) {
        progress({
          step: "Revoking access",
          processed,
          total: adminUsers.length * sensitiveResources.length,
        });
      }
    } catch (err) {
      failedAccesses.push({
        adminName: admin.name,
        resourceName: resource.name,
        error: err.message,
      });
    }
  }
}

return {
  summary: {
    totalAdminsAffected: adminUsers.length,
    totalResourcesAffected: sensitiveResources.length,
    totalAccessProcessed: processed,
    accessesRevoked: revokedAccesses.length,
    accessesFailed: failedAccesses.length,
    successRate: Math.round((revokedAccesses.length / processed) * 100),
  },
  revoked: revokedAccesses,
  failed: failedAccesses.slice(0, 20),
};
```

SDK files exist only for the model to get the types and discoverability.

Runtime execution never imports SDK files, it uses a tools bridge injected by Codecall.

### How Tool Calls Work at Runtime

When the generated code runs, Codecall injects a real `tools` object into the sandbox.

- `tools` is not a set of local functions, but it's a small runtime bridge provided by Codecall
- Each call to `tools.*` is forwarded to the real tool implementation

So when the sandbox executes:

```typescript
const result = await tools.permissions.revokeAccess({
  userId: admin.id,
  resourceId: resource.id,
  reason: "security-audit",
});
```

What actually happens is:

- The sandbox captures the tool name (`"communications.sendSecureMessage"`) and arguments
- Codecall forwards that request to the connected MCP server using `tools/call`
- The MCP server executes the real tool
- The result is returned back to the sandbox
- The script continues running

From the code’s perspective this behaves exactly like calling a normal async function.

### Code Execution & Sandboxing

When the model finishes writing the TypeScript code, Codecall executes that code inside a fresh, short-lived sandbox. Each sandbox is spun up using Deno and runs the code in isolation. Deno’s security model blocks access to sensitive capabilities unless explicitly allowed.

By default, the sandboxed code has no access to the filesystem, network, environment variables, or system processes. The only way it can interact with the outside world is by calling the tool functions exposed through tools (which are forwarded by Codecall to the MCP server).

Every execution is independent. Retries in the recovery loop run in a new sandbox if it errors, which keeps execution fast, predictable, and easy to reason about while preventing state from leaking between runs.

#### Sandbox Isolation Architecture

An example with Internal Tools + an External MCP Server (Todoist)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         SANDBOX ISOLATION ARCHITECTURE                                              │
│                                                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                           CODECALL RUNTIME (Node.js)                                          │  │
│  │                                                                                                               │  │
│  │   ┌──────────────────┐          ┌───────────────────────────────────────────────────────────────────────────┐ │  │
│  │   │                  │          │                                                                           │ │  │
│  │   │  LLM-Generated   │          │                    DENO SANDBOX (Isolated Process)                        │ │  │
│  │   │  TypeScript Code │   spawn  │  ╔═══════════════════════════════════════════════════════════════════╗    │ │  │
│  │   │                  │ ────────▶│  ║                                                                   ║    │ │  │
│  │   │  ─────────────   │          │  ║   DENY-ALL PERMISSIONS                                            ║    │ │  │
│  │   │  const tasks =   │          │  ║   ─────────────────────────────────────────────────────────────   ║    │ │  │
│  │   │   await tools.   │          │  ║   ✗ --deny-read     (no filesystem access)                        ║    │ │  │
│  │   │   todoist.       │          │  ║   ✗ --deny-write    (no file writes)                              ║    │ │  │
│  │   │   getTasks();    │          │  ║   ✗ --deny-net      (no network access)                           ║    │ │  │
│  │   │  ...             │          │  ║   ✗ --deny-env      (no environment variables)                    ║    │ │  │
│  │   │                  │          │  ║   ✗ --deny-run      (no subprocess spawning)                      ║    │ │  │
│  │   └──────────────────┘          │  ║   ✗ --deny-ffi      (no foreign function interface)               ║    │ │  │
│  │                                 │  ║                                                                   ║    │ │  │
│  │                                 │  ╚═══════════════════════════════════════════════════════════════════╝    │ │  │
│  │                                 │                                                                           │ │  │
│  │                                 │     ┌───────────────────────────────────────────────────────────────┐     │ │  │
│  │                                 │     │                   INJECTED GLOBALS                            │     │ │  │
│  │                                 │     │                                                               │     │ │  │
│  │                                 │     │   tools.todoist.*  ───┐                                       │     │ │  │
│  │                                 │     │   tools.internal.* ───┼─── Only way to interact               │     │ │  │
│  │                                 │     │   progress()       ───┘    with outside world                 │     │ │  │
│  │                                 │     │                                                               │     │ │  │
│  │                                 │     └───────────────────────────────────────────────────────────────┘     │ │  │
│  │                                 │                          │                                                │ │  │
│  │                                 └──────────────────────────┼────────────────────────────────────────────────┘ │  │
│  │                                                            │                                                  │  │
│  │                                      ┌─────────────────────┴─────────────────────┐                            │  │
│  │                                      │                                           │                            │  │
│  │                                      ▼                                           ▼                            │  │
│  │   ┌─────────────────────────────────────────────────┐   ┌─────────────────────────────────────────────────┐   │  │
│  │   │                 TOOL BRIDGE                     │   │                 PROGRESS BRIDGE                 │   │  │
│  │   │─────────────────────────────────────────────────│   │─────────────────────────────────────────────────│   │  │
│  │   │                                                 │   │                                                 │   │  │
│  │   │   Intercepts tools.* calls from sandbox         │   │   Streams progress({ ... }) updates             │   │  │
│  │   │   Routes to appropriate handler:                │   │   to the UI in real-time                        │   │  │
│  │   │                                                 │   │                                                 │   │  │
│  │   │   ┌─────────────────┐  ┌─────────────────┐      │   │   progress({ step: "Loading tasks" })           │   │  │
│  │   │   │ tools.todoist   │  │ tools.internal  │      │   │            │                                    │   │  │
│  │   │   │ ├─ getTasks     │  │ ├─ searchDB     │      │   │            ▼                                    │   │  │
│  │   │   │ ├─ addTask      │  │ ├─ sendEmail    │      │   │   ┌─────────────────────┐                       │   │  │
│  │   │   │ └─ updateTask   │  │ └─ logAudit     │      │   │   │    Client / UI      │                       │   │  │
│  │   │   └────────┬────────┘  └────────┬────────┘      │   │   └─────────────────────┘                       │   │  │
│  │   │            │                    │               │   │                                                 │   │  │
│  │   └────────────┼────────────────────┼───────────────┘   └─────────────────────────────────────────────────┘   │  │
│  │                │                    │                                                                         │  │
│  └────────────────┼────────────────────┼─────────────────────────────────────────────────────────────────────────┘  │
│                   │                    │                                                                            │
│ ══════════════════╪════════════════════╪════════════════════════════════════════════════════════════════════════════│
│  EXTERNAL         │                    │  LOCAL                                                                     │
│                   │                    │                                                                            │
│                   ▼                    ▼                                                                            │
│  ┌────────────────────────────────┐   ┌────────────────────────────────────────────────────────────────────────┐    │
│  │        TODOIST MCP SERVER      │   │                      INTERNAL TOOL HANDLERS                            │    │
│  │────────────────────────────────│   │────────────────────────────────────────────────────────────────────────│    │
│  │                                │   │                                                                        │    │
│  │  Protocol: MCP (tools/call)    │   │  Direct function calls with tool definitions:                          │    │
│  │                                │   │                                                                        │    │
│  │  Available Tools:              │   │  ┌─────────────────────────────────────────────────────────────────┐   │    │
│  │  ├─ todoist.getTasks           │   │  │  searchDB: {                                                    │   │    │
│  │  ├─ todoist.addTask            │   │  │    input: { query: string, table: string }                      │   │    │
│  │  ├─ todoist.updateTask         │   │  │    output: Record<string, unknown>[]                            │   │    │
│  │  ├─ todoist.deleteTask         │   │  │    handler: (input) => db.query(input.query)                    │   │    │
│  │  ├─ todoist.getProjects        │   │  │  }                                                              │   │    │
│  │  └─ todoist.completeTask       │   │  └─────────────────────────────────────────────────────────────────┘   │    │
│  │                                │   │  ┌─────────────────────────────────────────────────────────────────┐   │    │
│  └────────────────────────────────┘   │  │  sendEmail: {                                                   │   │    │
│                                       │  │    input: { to: string, subject: string, body: string }         │   │    │
│                                       │  │    output: { success: boolean, messageId: string }              │   │    │
│                                       │  │    handler: (input) => emailService.send(input)                 │   │    │
│                                       │  │  }                                                              │   │    │
│                                       │  └─────────────────────────────────────────────────────────────────┘   │    │
│                                       │  ┌─────────────────────────────────────────────────────────────────┐   │    │
│                                       │  │  logAudit: {                                                    │   │    │
│                                       │  │    input: { action: string, details: object }                   │   │    │
│                                       │  │    output: { logged: boolean }                                  │   │    │
│                                       │  │    handler: (input) => auditLog.write(input)                    │   │    │
│                                       │  │  }                                                              │   │    │
│                                       │  └─────────────────────────────────────────────────────────────────┘   │    │
│                                       │                                                                        │    │
│                                       └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                                                     │
│                                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Sandbox Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SANDBOX LIFECYCLE                                          │
│                                                                                         │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐           │
│   │  SPAWN  │────▶│  INJECT │────▶│ EXECUTE │────▶│ CAPTURE │────▶│ DESTROY │           │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘           │
│        │               │               │               │               │                │
│        ▼               ▼               ▼               ▼               ▼                │
│   Fresh Deno      tools proxy     Run generated    Collect return   Terminate           │
│   process with    + progress()    TypeScript       value or error   process,            │
│   deny-all        injected        code             + exec trace     cleanup             │
│   permissions                                                                           │
│                                                                                         │
│                                                                                         │
│   ON ERROR:                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────────┐           │
│   │                                                                         │           │
│   │   Error + Trace + Original Code + User Request                          │           │
│   │                        │                                                │           │
│   │                        ▼                                                │           │
│   │              ┌─────────────────┐                                        │           │
│   │              │   Model (LLM)   │  Rewrites code to fix issue            │           │
│   │              └────────┬────────┘                                        │           │
│   │                       │                                                 │           │
│   │                       ▼                                                 │           │
│   │              NEW SANDBOX SPAWNED ───────────────────▶ Retry (max 3)     │           │
│   │                                                                         │           │
│   └─────────────────────────────────────────────────────────────────────────┘           │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DATA FLOW                                              │
│                                                                                         │
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

### Returning Results to the Model

After the sandbox finishes executing the generated code, Codecall returns the final result object, with the same conversation history as the original user request back to the same model so it can produce a user-facing response.

This happens in a second model request, so the flow looks like this:

1. Code Generation (Request 1)

   - Model sees the tool tree and reads SDK files as needed
   - Model writes a single TypeScript script to perform what action is needed

2. Sandbox Execution

   - Codecall runs the program in an isolated sandbox
   - Tools are invoked via `tools.*`
   - A final result object is produced

3. Response Generation (Request 2)
   - The result object is sent back to the same model in another request (#2)
   - The model explains the outcome to the user in natural language, which is the user-facing response

For example, after execution completes:

```typescript
{
  summary: {
    totalAdminsAffected: 12,
    totalResourcesAffected: 5,
    totalAccessProcessed: 60,
    accessesRevoked: 58,
    accessesFailed: 2,
    successRate: 97,
  },
  revoked: [
    { adminName: "Alice Chen", adminEmail: "alice@company.com", resourceName: "Production Database", revokedAt: "2025-12-27T18:05:32Z" },
    { adminName: "Bob Smith", adminEmail: "bob@company.com", resourceName: "Production Database", revokedAt: "2025-12-27T18:05:33Z" },
    // ... 56 more entries (you can modify how much data you want the llm to return with in your prompt)
  ],
  failed: [
    { adminName: "Charlie Davis", resourceName: "API Gateway", reason: "dependency-lock" },
    { adminName: "Diana Wong", resourceName: "Billing System", error: "timeout after 30s" },
  ],
}
```

The model receives that result and responds:

> “I successfully revoked admin access across the organization. Out of 60 total access permissions (12 admins across 5 sensitive resources), I revoked 58 successfully with a 97% success rate. 2 revocations failed due to system locks and timeouts that will need manual intervention. The revoked admins include Alice Chen, Bob Smith, and 10 others. Most failures occurred on the API Gateway and Billing System where there are active dependencies preventing immediate access removal.”

## Handling Errors (v2)

Real world API data is messy so pre-written code can (and will) fail. Codecall handles this with an automatic recovery loop:

### The Recovery Loop

1. **Optimistic Execution**: Codecall tries to run the agent's generated code
2. **Failure Capture**: If the code throws an error, we capture the full execution trace (inputs, outputs, and the specific error)
3. **Feedback Loop**: We feed this trace back to the model
4. **Correction**: The model sees exactly where and why it failed, adjusts its approach, and retries keeping the main task in mind

### Example

**1. Agent writes optimistic code:**

```typescript
const allUsers = await tools.users.listAllUsers();
progress({ step: "Loaded users", count: allUsers.length });

const adminUsers = allUsers.filter((u) => u.role === "admin");
const resources = await tools.resources.getSensitiveResources();
progress({ step: "Loaded resources", count: resources.length });

const revoked = [];
for (const admin of adminUsers) {
  for (const resource of resources) {
    await tools.permissions.revokeAccess(admin.id, resource.id);
    revoked.push({ admin: admin.name, resource: resource.name });
  }
}

return { totalRevoked: revoked.length };
```

**2. Execution fails. Codecall catches and returns:**

```typescript
{
  "status": "failed",
  "error": "ToolError: revokeAccess expected object { userId: string, resourceId: string }, got (string, string)",
  "executionTrace": [
    {
      "step": 1,
      "function": "listAllUsers",
      "input": {},
      "output": { "count": 47, "users": [{ "id": "admin-1", "name": "Alice", "role": "admin" }, ...] }
    },
    {
      "step": 2,
      "progress": "Loaded users",
      "data": { "count": 47 }
    },
    {
      "step": 3,
      "function": "getSensitiveResources",
      "input": {},
      "output": { "count": 5, "resources": [{ "id": "resource-db-prod", "name": "Production Database" }, ...] }
    },
    {
      "step": 4,
      "progress": "Loaded resources",
      "data": { "count": 5 }
    },
    {
      "step": 5,
      "function": "revokeAccess",
      "input": ["admin-1", "resource-db-prod"],
      "error": "Invalid Argument Schema. Expected { userId, resourceId }, got positional arguments"
    }
  ],
  "failurePoint": "step 5",
  "context": "The function revokeAccess was called with positional arguments instead of an object. The sandbox successfully loaded 47 users and 5 resources before failing on the first access revocation."
}
```

**3. Agent self-corrects and retries:**

```typescript
const allUsers = await tools.users.listAllUsers();
progress({ step: "Loaded users", count: allUsers.length });

const adminUsers = allUsers.filter((u) => u.role === "admin");
const resources = await tools.resources.getSensitiveResources();
progress({ step: "Loaded resources", count: resources.length });

const revokedAccesses = [];
const failedAccesses = [];
let processed = 0;

for (const admin of adminUsers) {
  for (const resource of resources) {
    processed++;
    try {
      const result = await tools.permissions.revokeAccess({
        userId: admin.id,
        resourceId: resource.id,
      });

      if (result.success) {
        revokedAccesses.push({
          adminName: admin.name,
          resourceName: resource.name,
        });
      } else {
        failedAccesses.push({
          adminName: admin.name,
          resourceName: resource.name,
          reason: result.reason,
        });
      }

      if (processed % 15 === 0) {
        progress({
          step: "Revoking access",
          processed,
          total: adminUsers.length * resources.length,
        });
      }
    } catch (err) {
      failedAccesses.push({
        adminName: admin.name,
        resourceName: resource.name,
        error: err.message,
      });
    }
  }
}

return {
  summary: {
    totalAdmins: adminUsers.length,
    totalResources: resources.length,
    processed,
    revoked: revokedAccesses.length,
    failed: failedAccesses.length,
  },
  revokedSample: revokedAccesses.slice(0, 10),
  failedDetails: failedAccesses,
};
```

On failure, Codecall returns the error, full execution trace, the TypeScript code which failed, and the original user request with the main task to the model. The sandbox is destroyed after each run, but the trace is preserved.

The model then rewrites the code (in another request) and Codecall reruns it in a fresh sandbox, retrying until it succeeds or hits a configurable limit (default 3). If the limit is reached, Codecall stops and returns a clear failure.

Finally, Codecall returns the user response: on success returns the result object from the code, and on failure it explains where and why it failed so we can let the user know.

## Progress Updates (v2)

Codecall runs code in one shot, but you would still most likely want some user facing intermediate updates between the start and end of a request. The sandbox exposes a `progress()` helper that can log the steps it's taking

So for example, in your system prompt you can tell the model to use `progress()`:

```text
When writing code, use progress(...) to show meaningful updates. can see what is happening. For example:

  progress("Loading data...");
  progress({ step: "Processing", current: i, total });
  progress({ step: "Sending emails", done: count });
```

Agent Code Example

```typescript
const allUsers = await tools.users.listAllUsers({ limit: 5000 });
progress({
  step: "Loaded all users",
  totalCount: allUsers.length,
  adminCount: allUsers.filter((u) => u.role === "admin").length,
});

const adminUsers = allUsers.filter((u) => u.role === "admin");
const sensitiveResources = await tools.resources.getSensitiveResources();
progress({
  step: "Loaded sensitive resources",
  resourceCount: sensitiveResources.length,
  resourceNames: sensitiveResources.map((r) => r.name),
});

const revokedAccesses = [];
const failedAccesses = [];

for (let i = 0; i < adminUsers.length; i++) {
  const admin = adminUsers[i];

  for (let j = 0; j < sensitiveResources.length; j++) {
    const resource = sensitiveResources[j];

    try {
      const result = await tools.permissions.revokeAccess({
        userId: admin.id,
        resourceId: resource.id,
        reason: "security-audit",
      });

      if (result.success) {
        revokedAccesses.push({
          admin: admin.name,
          email: admin.email,
          resource: resource.name,
          timestamp: result.timestamp,
        });
      } else {
        failedAccesses.push({
          admin: admin.name,
          resource: resource.name,
          reason: result.reason || "unknown",
        });
      }

      if (((i + 1) * (j + 1)) % 10 === 0) {
        progress({
          step: "Revoking access",
          admin: admin.name,
          resource: resource.name,
          processed: revokedAccesses.length + failedAccesses.length,
          revoked: revokedAccesses.length,
          failed: failedAccesses.length,
        });
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

progress({
  step: "Access revocation complete",
  revoked: revokedAccesses.length,
  failed: failedAccesses.length,
});

return {
  execution: {
    totalAdminsProcessed: adminUsers.length,
    totalResourcesAffected: sensitiveResources.length,
    totalAttempted: revokedAccesses.length + failedAccesses.length,
    accessesRevoked: revokedAccesses.length,
    accessesFailed: failedAccesses.length,
    successPercentage: Math.round(
      (revokedAccesses.length /
        (revokedAccesses.length + failedAccesses.length)) *
        100
    ),
  },
  revokedDetails: revokedAccesses.map((r) => ({
    ...r,
    status: "success",
  })),
  failureDetails: failedAccesses.slice(0, 25),
};
```

This keeps the UX of a "step by step" agent with user facing intermediate updates, while still getting the cost and speed benefits of single-pass execution.

## Why TypeScript?

[Benchmarks](https://github.com/Tencent-Hunyuan/AutoCodeBenchmark?tab=readme-ov-file#experimental-results) show Claude Opus 4.1 performs:

- **42.3%** on Python
- **47.7%** on TypeScript

That's a 12% improvement just from language choice. TypeScript also gives you:

- Full type inference for SDK generation
- Compile time validation of tool schemas
- The model sees types and can use them correctly

## Roadmap

WIP, Please check back soon or feel free to add here :)

Still working on how the high level architecture and how everything should work/flow together

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
