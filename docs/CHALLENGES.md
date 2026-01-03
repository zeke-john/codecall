# Main Challenges

## 1. Output Schemas from Tools

MCP tool definitions include `inputSchema` (what you pass to a tool) but `outputSchema` is **optional** and most servers almost never provide it... This matters Codecall generates TypeScript code that chains tool calls together. Without knowing what a tool returns, the model has to guess the structure, leading to runtime errors.

**Example of the problem:**

```typescript
const tasks = await tools.todoist.getTasks({ filter: "today" });

for (const task of tasks) {
  console.log(task.title);  // BUG: actual property is "name", not "title"
}

if (task.dueDate === "2024-01-15") { ... }
// BUG: actual structure is task.due, not task.dueDate
```

The code looks correct but fails at runtime because the model hallucinated the return type based on common naming patterns...

## 2. Input/Output examples

**JSON Schema defines structure but not usage patterns.** Take that support ticket API example: the schema tells you `due_date` is a string, but not whether it wants `"2024-11-06"` or `"Nov 6, 2024"`. It says `reporter.id` is a string, but is that a UUID or `"USR-12345"`? When should `reporter.contact` be populated? How do `escalation.level` and `priority` interact? _(example from an anthropic article covering this)_

In traditional tool calling, the model can learn these patterns through **trial and error across multiple turns**. It tries something, gets an error or unexpected result, and adjusts for the rest... but with programmatic tool calling, the model writes a script that might call `create_ticket` 50 times in a loop for different users. If it misinterprets the date format or ID convention in the first call, **all 50 calls fail**, and so on.

**This issue is definitely amplified with programmatic tool calling.**

## 3. Tool Outputs Are Often Plain Strings

A second more fundamental challenge is that a lot of MCP servers return plain strings or markdown, not structured data...

In these cases:

- The output has no stable shape
- There are no fields to index into
- There is nothing meaningful to type beyond string

From Codecall’s perspective, this means:

- No reliable code generation beyond simple passthrough
- No safe composition of tool outputs
- No advantage over a traditional agent that directly interprets text

This is not a limitation of Codecall, but a reflection of how the tools were designed.

Because Codecall focuses on deterministic, type-safe code generation, its benefits disappear when tool outputs are unstructured. In those cases, interpretation must happen in the LLM itself, which moves the system back into standard agent behavior.

**Sadly, there is no reliable workaround when using external MCP servers: if you do not control the tool, you cannot enforce structured outputs.**

## What We've Tried (2 & 3)

Our initial approach to fix issues #2 and #3 were to auto discover the output schemas and generate examples by calling read only tools

The idea was to safely call only "read" tools (ones that don't create, modify, or delete data) to get real responses and infer output schemas and generate examples from them.

**Our initial approach**

1. Classify every tool into the 3 categories `read`, `write`, or `destructive`
2. For read-only tools, generate sample inputs from the inputSchema w/ Gemini 3 Flash
3. Call those tools to get an actual response
4. Infer the output schema from the actual response data
5. Generate the input and output examples from what was inputted and returned

and for write/destructive tools, require the user to provide output schemas manually

### Why this didn't work in practice

#### 1. You Cannot Reliably Guess Inputs Without Context

Many read tools require specific IDs or context that doesn't exist in a fresh environment:

```typescript
// Tool: get_task
// inputSchema: { taskId: string (required) }

// What ID do we use? The model would guess something like:
{
  taskId: "abc123";
} // Random guess - doesn't exist
{
  taskId: "task_1";
} // Made up - doesn't exist
{
  taskId: "12345";
} // Wrong format entirely
```

The call fails with "Task not found" and we get no output schema.

Even with read tools that don't require IDs, we have no prior context for how to construct valid inputs. The LLM has to guess filter values, date formats, or enum options without knowing what the API actually accepts:

```typescript
// Tool: find_activity
// inputSchema: { eventType?: string, objectType?: string, limit?: number }

// The LLM might guess:
{ eventType: "created", objectType: "task" }  // Wrong - API uses "added" not "created"
{ eventType: "update", objectType: "item" }   // Wrong - API uses "updated" and "task"
```

Without documentation or examples, the model picks plausible sounding values that don't match the API's actual expectations.

Even telling the LLM to "use the broadest possible query" doesn't help when:

- You don't know what filters the API supports
- Default values might be restrictive (e.g., "only show items from today")
- The API requires at least one filter parameter

#### 2. Empty Results Don't Reveal Schema Structure

Even when you guess inputs correctly and the API call succeeds (no error), that doesn't automatically mean we got the correct data for the output schema. If the user's account has no matching data, the API can sometimes return empty results, and the schema inference learns the wrong structure.

The problem is the LLM thinks that empty response is what the tool normally returns. The inferred schema is technically correct for that specific response, but useless for understanding the actual output structure.

Example ->

```typescript
// Tool: find_tasks with { filter: "pending" }
// Response: { tasks: [] }

// We can infer: { tasks: unknown[] }
// But we don't know what a Task object looks like
```

An example like this would go into the input and output example comments in the SDK files AND NOT the expected output schema.

### Conclusion

You cannot use a LLM to reliably guess tool inputs with no context. Without knowing what data exists in the user's account, what IDs are valid, or what the typical usage patterns are for the API, an attempt to auto discover schemas through tool calls will fail majority of the time.

The only reliable approaches are:

1. Require MCP servers to provide outputSchema (which they often don't) AND input/output examples (they don't have the option)
2. Require users to manually add output schemas and examples after generating the input schema

and we chose option 2.
