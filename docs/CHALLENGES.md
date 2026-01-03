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

# What We've Tried (2 & 3)

blah blah
