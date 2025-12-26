# Codecall

> TypeScript-first Programmatic Tool Calling for AI Agents. Stop wasting tokens and context & Start writing code.

Codecall changes how agents interact w/ tools by letting them **write and execute code** instead of making individual tool calls that bloat context, massively increase the price, and slow everything down

Works with **MCP servers** and **standard tool definitions**.

## The Problem

Traditional tool calling is fundamentally broken at scale:

### 1. Context Bloat

Every tool definition lives in your system prompt. Connect a few MCP servers and you're burning tens of thousands of tokens before the conversation even starts.

```
GitHub Server:     35 tools  →  ~15,000 tokens
Slack Server:      11 tools  →  ~8,000 tokens
Jira Server:       17 tools  →  ~17,000 tokens
Internal Tools:    25 tools  →  ~12,000 tokens
─────────────────────────────────────────────
Total:             88 tools  →  ~52,000 tokens (before any work happens)
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

### 3. Models Are Bad at Data Lookup

Benchmarks show models have a **10-50% failure rate** when searching through large datasets in context. They hallucinate field names, miss entries, and get confused by similar data.

But you know what has a 0% failure rate?

```typescript
users.filter((u) => u.role === "admin");
```

### 4. Privacy

Every intermediate result flows through the model provider. That 10,000 row customer spreadsheet? Now it's in Anthropic's context window.

## The Solution

Let models do what they're good at: **writing code**.

LLMs have enormous amounts of real-world TypeScript in their training data. They're significantly better at writing code to call APIs than they are at the arbitrary JSON matching that tool calling requires.

```typescript
// Instead of 12 inference passes and 150k tokens:
const users = await db.getUsers();
const admins = users.filter((u) => u.role === "admin");
await Promise.all(
  admins.map((u) => db.updateUser(u.id, { permissions: newPerms }))
);
return { updated: admins.length };
```

One inference pass. ~2,000 tokens. 98.7% reduction.

## How Codecall Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your Agent                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Codecall                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  SDK Generator  │  │ Sandbox Runtime │  │ Result Handler  │  │
│  │                 │  │                 │  │                 │  │
│  │ MCP Server ────►│  │ Executes agent- │  │ Filters output  │  │
│  │ Tool Defs ─────►│  │ generated code  │  │ before context  │  │
│  │       │         │  │ in isolation    │  │                 │  │
│  │       ▼         │  │                 │  │                 │  │
│  │  TypeScript     │  │                 │  │                 │  │
│  │  SDK + Types    │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌─────────────┐         ┌─────────────┐
            │ MCP Servers │         │ Local Tools │
            └─────────────┘         └─────────────┘
```

### Architecture

1. **SDK Generator**: Converts MCP server definitions and tool schemas into typed TypeScript SDKs that models can explore and use
2. **Sandbox Runtime**: Executes agent-generated code in an isolated environment (configurable: local, Daytona, Cloudflare Workers, etc.)
3. **Result Handler**: Filters, transforms, and sanitizes outputs before they enter the model's context

### The Flow

```
1. Agent receives task
2. Agent explores available SDKs (file tree of typed functions)
3. Agent writes TypeScript code to accomplish task
4. Codecall executes code in sandbox
5. Only final/filtered results return to agent context
6. Agent continues or completes
```

## Features

- **TypeScript-first**: Better model performance and full type safety
- **MCP Compatible**: Connect any MCP server and auto generate typed SDKs
- **Standard Tools**: Works w/ regular tool definitions too
- **Sandbox Execution**: Isolated runtime for agent generated code
- **Context Efficiency**: Only returns what matters to the model
- **Privacy**: Intermediate data doesn't hit the model

## Installation

```bash
npm install codecall
```

## Quick Start

### With MCP Servers

```typescript
import { CodeCall } from "codecall";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// Connect your MCP servers
const githubMcp = new Client({ name: "github", version: "1.0.0" });
await githubMcp.connect(githubTransport);

const slackMcp = new Client({ name: "slack", version: "1.0.0" });
await slackMcp.connect(slackTransport);

// Create codecall instance
const codecall = new CodeCall({
  mcpClients: [githubMcp, slackMcp],
  sandbox: "local", // or 'daytona', 'cloudflare', custom
});

// Generate SDKs (model sees these as explorable file trees)
const sdkContext = await codecall.generateSDKContext();

// Use with your agent
const response = await agent.run({
  systemPrompt: `
    You have access to tool SDKs. Write TypeScript code to accomplish tasks.
    
    Available SDKs:
    ${sdkContext.fileTree}
    
    To execute code, use the execute_code tool.
  `,
  tools: [codecall.getExecuteTool()],
  message: userMessage,
});
```

### With Standard Tool Definitions

```typescript
import { CodeCall, defineTool } from "codecall";

// Define your tools
const tools = [
  defineTool({
    name: "getUsers",
    description: "Fetch all users from the database",
    parameters: z.object({
      limit: z.number().optional(),
    }),
    returns: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        role: z.enum(["admin", "user", "guest"]),
        email: z.string(),
      })
    ),
    execute: async ({ limit }) => {
      return db.users.findMany({ take: limit });
    },
  }),

  defineTool({
    name: "updateUser",
    description: "Update a user record",
    parameters: z.object({
      id: z.string(),
      data: z.object({
        role: z.enum(["admin", "user", "guest"]).optional(),
        name: z.string().optional(),
      }),
    }),
    returns: z.object({ success: z.boolean() }),
    execute: async ({ id, data }) => {
      await db.users.update({ where: { id }, data });
      return { success: true };
    },
  }),
];

const codecall = new CodeCall({ tools });
```

### SDK File Tree (What the Model Sees)

```
/tools
  /github
    createPullRequest.ts
    listIssues.ts
    getRepository.ts
    ...
  /slack
    sendMessage.ts
    listChannels.ts
    ...
  /db
    getUsers.ts
    updateUser.ts
    ...
```

Each file contains typed function signatures:

```typescript
// /tools/db/getUsers.ts
import { call } from "codecall";

export interface GetUsersInput {
  limit?: number;
}

export interface User {
  id: string;
  name: string;
  role: "admin" | "user" | "guest";
  email: string;
}

export async function getUsers(input: GetUsersInput): Promise<User[]> {
  return call("db.getUsers", input);
}
```

## Handling Errors

Real-world API data is messy. If `getWeather()` returns an unexpected error (e.g., "City not found") or a format the agent didn't expect, a pre-written script will fail

So for complex workflows where you need to validate intermediate results, we need to address and handle the concern that pre-planned code can (and will) fail with messy real-world data

### The Recovery Loop

1. **Optimistic Execution**: Codecall tries to run the agent's generated code.
2. **Failure Capture**: If the code throws an error, we capture the full execution trace (inputs, outputs, and the specific error).
3. **Feedback Loop**: We feed this trace back to the model immediately.
4. **Correction**: The model sees exactly where and why it failed, adjusts its approach, and retries the remainder of the task.

### Example

**1. Agent writes optimistic code:**

```typescript
// Agent assumes getWeather accepts a city string
const location = await tools.getLocation(); // Returns "London"
const weather = await tools.getWeather(location);
```

**2. Execution fails. Codecall catches and returns:**

```typescript
{
  "status": "failed",
  "error": "ToolError: getWeather expected object { lat: number, long: number }, got string",
  "trace": [
    {
      "function": "getLocation",
      "input": {},
      "output": "London"
    },
    {
      "function": "getWeather",
      "input": "London",
      "error": "Invalid Argument Schema"
    }
  ],
  "message": "Your code failed at step 2. The API schema didn't match your input. Use the trace above to fix your code and retry."
}
```

**3. Agent self-corrects and retries:**

```typescript
// Agent sees the error and fixes the implementation
const location = await tools.getLocation(); // "London"
const coords = await tools.geocode(location); // Fetch coordinates first
const weather = await tools.getWeather({
  lat: coords.lat,
  long: coords.long,
});
return weather;
```

This removes the need for tracking every intermediate step, instead we let the runtime prove what works and what doesn't, using the error logs as feedback for the model to fix its own mistakes until it works

## Progress Updates

Codecall runs code in one shot, but you still want user-facing intermediate updates. The sandbox exposes a `progress()` helper and can also auto-log tool calls.

### Using `progress()` in Agent Code

```typescript
const SIX_MONTHS_AGO = new Date();
SIX_MONTHS_AGO.setMonth(SIX_MONTHS_AGO.getMonth() - 6);

progress({ step: "Loading patients..." });
const patients = await tools.patients.getPatients();

const diabeticPatients = patients.filter((p) =>
  p.conditions.includes("diabetes")
);
progress({
  step: "Filtered diabetic patients",
  count: diabeticPatients.length,
});

const needsReminder: typeof patients = [];

for (let i = 0; i < diabeticPatients.length; i++) {
  const patient = diabeticPatients[i];

  progress({
    step: "Checking lab results",
    current: i + 1,
    total: diabeticPatients.length,
    patient: patient.name,
  });

  const labs = await tools.records.getLabResults(patient.id);
  const recentA1C = labs.find(
    (lab) => lab.test === "A1C" && new Date(lab.date) > SIX_MONTHS_AGO
  );

  if (!recentA1C) {
    needsReminder.push(patient);
  }
}

progress({
  step: "Sending reminders",
  total: needsReminder.length,
});

for (let i = 0; i < needsReminder.length; i++) {
  const patient = needsReminder[i];

  progress({
    step: "Sending reminder",
    current: i + 1,
    total: needsReminder.length,
    patient: patient.name,
  });

  await tools.communications.sendAppointmentReminder(
    patient.id,
    `Hi ${
      patient.name.split(" ")[0]
    }, you're due for your A1C test. Please schedule an appointment.`
  );
}

return {
  totalDiabetic: diabeticPatients.length,
  remindersSent: needsReminder.length,
};
```

### Sandbox-side Progress Streaming

```typescript
const codecall = new CodeCall({
  tools,
  sandbox: "local",
  onProgress: (event) => {
    // Stream progress to your UI or logs
    // event can be user-defined progress() data or auto tool-call logs
    ui.showProgress(event);
  },
});
```

In your system prompt, you can tell the model to use `progress()`:

```text
When writing code, call progress(...) at meaningful milestones so the user
can see what is happening. For example:

  progress("Loading data...");
  progress({ step: "Processing", current: i, total });
  progress({ step: "Sending emails", done: count });
```

This keeps the UX of a "step by step" agent, while still getting the cost and speed benefits of single-pass execution.

## Comparison

| Aspect                | Traditional Tool Calling   | Codecall                      |
| --------------------- | -------------------------- | ----------------------------- |
| Token usage           | 150,000+ for complex tasks | ~2,000 (98%+ reduction)       |
| Inference passes      | One per tool call          | One for code generation       |
| Data lookup accuracy  | 50-90% (model dependent)   | 100% (code is deterministic)  |
| Intermediate privacy  | All data hits model        | Stays in sandbox              |
| Multi-step operations | N round trips              | Single execution              |
| Model training fit    | Post-training fine-tune    | Pre-training (vast code data) |

## Why TypeScript?

Anthropic's own benchmarks show Claude Opus 4.1 performs:

- **42.3%** on Python
- **47.7%** on TypeScript

That's a 12% improvement just from language choice. TypeScript also gives you:

- Full type inference for SDK generation
- Compile-time validation of tool schemas
- The model sees types and can use them correctly

## Real World Example

In `USECASES.md` we walk through a hypothetical medical records agent, and handling the same task with both approaches:

**Task**: "Find all diabetic patients who haven't had an A1C test in the last 6 months and send them appointment reminders"

|                         | Traditional | Codecall     |
| ----------------------- | ----------- | ------------ |
| Inference passes        | 152         | 1            |
| Tokens                  | ~450,000    | ~2,500       |
| Cost                    | $6.75       | $0.04        |
| Time                    | ~3-6 min    | ~3-30 sec    |
| Sensitive data exposure | All records | Summary Only |

\+ Also an example of how it would work in multi-turn conversations, going back and forth sending messages and maintaining context.

[Read the full breakdown →](./USECASES.md)

## Roadmap

wip, check back soon! (feel free to add to here)

## Contributing

We welcome and encourage contributions from the community :)

Please feel free to open an issue, create pull requests, and leave feedback & requests!

## Acknowledgements

This project builds on ideas, critiques, and implementations from the community, and is directly inspired from the below:

#### Videos

- Yannic Kilcher – [What Cloudflare's code mode misses about MCP and tool calling](https://www.youtube.com/watch?v=0bpYCxv2qhw)
- Theo – [Anthropic admits that MCP sucks](https://www.youtube.com/watch?v=1piFEKA9XL0&t=201s)
- Theo – [Anthropic is trying SO hard to fix MCP...](https://www.youtube.com/watch?v=hPPTrsUzLA8&t=2s)
- Theo – [MCP is the wrong abstraction](https://www.youtube.com/watch?v=bAYZjVAodoo&t=2s)

#### Articles

- Cloudflare – [Code mode: the better way to use MCP](https://blog.cloudflare.com/code-mode/)
- Anthropic – [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp)
- Anthropic – [Introducing advanced tool use on the Claude developer platform](https://www.anthropic.com/engineering/advanced-tool-use)
- Medium - [Your Agent Is Wasting Money On Tools. Code Execution With MCP Fixes It.](https://medium.com/genaius/your-agent-is-wasting-money-on-tools-code-execution-with-mcp-fixes-it-5c8d7b177bad)

## License

MIT
