# Codecall

> An open source Typescript implementation of Programmatic Tool Calling for AI Agents, based directly on `Code Mode` from Cloudflare.

Codecall changes how agents interact with tools by letting them **write and execute code** instead of making individual tool calls that bloat context, massively increase the price, and slow everything down

Works with **MCP servers** and **standard tool definitions**.

## The Problem

Traditional tool calling has fundamental architectural issues that get worse at scale:

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

The problem also compounds because each tool call adds its output to the context, making every subsequent generation more expensive.

### 3. Models Are Bad at Data Lookup

Benchmarks show models have a **10-50% failure rate** when searching through large datasets in context. They hallucinate field names, miss entries, and get confused by similar data.

But you know what has a 0% failure rate?

```typescript
users.filter((u) => u.role === "admin");
```

### 4. Models Were Never Trained for Tool Calling

The special tokens used for tool calls (`<tool_call>`, `</tool_call>`) are synthetic training data. Models dont have much exposure to the tool calling syntax,and have only seen contrived examples from training sets... but they DO have:

- Millions of lines of real world TypeScript
- Lots of experience writing code to call APIs

> “Making an LLM perform tasks with tool calling is like putting Shakespeare through a month-long class in Mandarin and then asking him to write a play in it. It’s just not going to be his best work.”  
> — Cloudflare Engineering

For example, Grok 4 & Gemini 3 were heavily trained on tool calling. Result? They hallucinates tool call XML syntax in the middle of responses, writing the format but not triggering actual execution. The model “knows” the syntax exists but doesn’t use it correctly.

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

## How Codecall Works (WIP)

Instead of exposing tools directly to the LLM for it to call, Codecall:

- Converts your tools into TypeScript SDK files
- Shows the model a file tree of available functions (just like a codebase)
- Lets the model write code to accomplish the task
- Executes that code in a sandbox with access to your actual tools as functions
- Returns only the final results to the model

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

(more to come here)

## Handling Errors

Real world API data is messy so pre-written code can and will fail. Codecall handles this with an automatic recovery loop:

### The Recovery Loop

1. **Optimistic Execution**: Codecall tries to run the agent's generated code
2. **Failure Capture**: If the code throws an error, we capture the full execution trace (inputs, outputs, and the specific error)
3. **Feedback Loop**: We feed this trace back to the model
4. **Correction**: The model sees exactly where and why it failed, adjusts its approach, and retries keeping the main task in mind

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

Codecall runs code in one shot, but you would still most likely want some user facing intermediate updates between the start and end of a equest. The sandbox exposes a `progress()` helper that can log the steps its taking

So for example, in your system prompt you can tell the model to use `progress()`:

```text
When writing code, use progress(...) to show meaningful updates. can see what is happening. For example:

  progress("Loading data...");
  progress({ step: "Processing", current: i, total });
  progress({ step: "Sending emails", done: count });
```

Agent Code Example

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

This keeps the UX of a "step by step" agent with user facing intermediate updates, while still getting the cost and speed benefits of single-pass execution.

## Why TypeScript?

Anthropic's own benchmarks show Claude Opus 4.1 performs:

- **42.3%** on Python
- **47.7%** on TypeScript

That's a 12% improvement just from language choice. TypeScript also gives you:

- Full type inference for SDK generation
- Compile time validation of tool schemas
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

wip

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

#### Articles

- Cloudflare – [Code mode: the better way to use MCP](https://blog.cloudflare.com/code-mode/)
- Anthropic – [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) & [Introducing advanced tool use on the Claude developer platform](https://www.anthropic.com/engineering/advanced-tool-use)
- Medium - [Your Agent Is Wasting Money On Tools. Code Execution With MCP Fixes It.](https://medium.com/genaius/your-agent-is-wasting-money-on-tools-code-execution-with-mcp-fixes-it-5c8d7b177bad)

## License

MIT
