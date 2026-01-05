## Self-Learning SDK Documentation

This document describes the self-learning SDK documentation system that automatically improves SDK files with learned constraints after the agent recovers from tool call errors.

### Purpose

When an agent fails to call a tool due to unclear or incomplete SDK documentation, and then successfully recovers, the system automatically:

1. Detects the error recovery
2. Prompts the model for a clarification explaining what constraint would have prevented the error
3. Appends a highly visible `@CC LEARNED CONSTRAINT` banner to the SDK file

**Note:** `@CC` stands for **"Codecall"** - the project name. This tag identifies constraints learned by the Codecall self-learning system.

This creates a **self-improving documentation system** where SDK files get better over time based on actual usage errors, preventing future agents from making the same mistakes.

### Why This Matters

Without this system:

- Agents repeatedly make the same mistakes
- SDK documentation remains incomplete
- Each agent session wastes tokens recovering from the same errors
- No institutional memory of learned constraints

With this system:

- **First agent** makes a mistake → learns → SDK file updated
- **Second agent** reads the improved SDK → avoids the mistake entirely
- Documentation improves organically through usage
- Future agents benefit from past learning

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENT EXECUTION FLOW                                 │
│                                                                             │
│  1. Agent calls executeCode()                                               │
│     └─> tools.todoist.findTasks({ searchText: "" })                        │
│                                                                             │
│  2. Tool call fails in sandbox                                             │
│     └─> Error: "At least one filter must be provided..."                    │
│     └─> Sandbox tracks: { sdkPath: "todoist/findTasks.ts", error, ... }   │
│                                                                             │
│  3. Error returned to agent                                                 │
│     └─> Agent reads SDK file again                                         │
│     └─> Agent fixes code: findProjects() first, then findTasks(projectId)  │
│                                                                             │
│  4. Agent retries executeCode() with fix                                   │
│     └─> Success!                                                            │
│                                                                             │
│  5. System detects recovery                                                 │
│     └─> Found pending recovery for "todoist/findTasks.ts"                  │
│     └─> Triggers clarification flow                                        │
│                                                                             │
│  6. Model provides clarification                                           │
│     └─> "Empty searchText does not count as a valid filter..."            │
│                                                                             │
│  7. System appends @CC banner to SDK file                                   │
│     └─> Highly visible banner inserted after main JSDoc comment            │
│                                                                             │
│  8. Next agent reads SDK file                                              │
│     └─> Sees @CC banner immediately                                        │
│     └─> Avoids the mistake entirely                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Security Model

**Critical Design Decision: No Exposed Tool**

This feature is **secure by design** because:

1. **No tool is exposed** - The model cannot call `updateSdkFile()` directly
2. **System-driven flow** - Only the system can trigger updates after detecting recovery
3. **Controlled input** - Model only provides clarification text, not full file content
4. **Validation** - System sanitizes and validates the clarification before writing
5. **Path safety** - Only SDK files can be updated, validated via `isPathSafe()`

The model cannot abuse this feature because it has no direct access to file writing. Updates only happen automatically after genuine error recovery.

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SANDBOX                                         │
│                                                                             │
│  - Tracks tool errors during executeCode() execution                        │
│  - Returns toolErrors[] array in ExecutionResult                           │
│  - Each error includes: { toolPath, sdkPath, errorMessage }                │
│                                                                             │
│  See: src/core/sandbox.ts (lines 112-120)                                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ ExecutionResult.toolErrors
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CODECALL AGENT                                      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  trackExecuteCodeResult()                                           │   │
│  │  - Records errors in pendingRecoveries Map                          │   │
│  │  - Key: sdkPath, Value: { sdkPath, errorMessage }                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  checkForRecovery()                                                 │   │
│  │  - Detects when executeCode succeeds after a previous error         │   │
│  │  - Returns true if pendingRecoveries.size > 0                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  triggerClarificationFlow()                                         │   │
│  │  - Injects system message asking for clarification                  │   │
│  │  - Includes full error message (no truncation)                      │   │
│  │  - Requests 2-4 sentences explaining the constraint                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  sanitizeConstraintText()                                           │   │
│  │  - Strips markdown (headers, bullets, code blocks)                  │   │
│  │  - Validates length (50-1500 chars)                                 │   │
│  │  - Rejects if still contains markdown after sanitization            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  See: src/agents/codecallAgent.ts (lines 371-464)                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ appendLearnedConstraint()
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INTERNAL TOOLS                                         │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  formatConstraintBanner()                                           │   │
│  │  - Creates highly visible box-drawing banner                        │   │
│  │  - Word-wraps long constraints                                      │   │
│  │  - Uses @CC LEARNED CONSTRAINT header                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  appendLearnedConstraint()                                          │   │
│  │  - Validates path safety                                            │   │
│  │  - Reads SDK file                                                    │   │
│  │  - Finds first JSDoc closing (*/)                                    │   │
│  │  - Inserts banner after JSDoc comment                               │   │
│  │  - Writes file back                                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  See: src/core/internalTools.ts (lines 113-181)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Flow

#### Step 1: Error Tracking in Sandbox

When a tool call fails during `executeCode()`:

```typescript
// src/core/sandbox.ts (lines 112-120)

if (msg.type === "call") {
  try {
    const result = await this.registry.call(msg.tool, msg.args);
    proc.stdin.write(JSON.stringify({ id: msg.id, result }) + "\n");
  } catch (err) {
    let error = serializeFullError(err);
    error = this.enhanceErrorMessage(error, msg.tool);
    toolErrors.push({
      toolPath: msg.tool, // e.g., "todoist.findTasks"
      sdkPath: toolPathToSdkPath(msg.tool), // e.g., "todoist/findTasks.ts"
      errorMessage: error, // Full error message
    });
    proc.stdin.write(JSON.stringify({ id: msg.id, error }) + "\n");
  }
}
```

The `toolErrors` array is included in the `ExecutionResult` returned to the agent.

#### Step 2: Error Recording in Agent

After `executeCode` returns, the agent tracks errors:

```typescript
// src/agents/codecallAgent.ts (lines 371-397)

private trackExecuteCodeResult(result: unknown): void {
  const execResult = result as { status?: string; toolErrors?: ToolError[] };

  if (execResult.status === "error" && execResult.toolErrors?.length > 0) {
    for (const toolError of execResult.toolErrors) {
      this.pendingRecoveries.set(toolError.sdkPath, {
        sdkPath: toolError.sdkPath,
        errorMessage: toolError.errorMessage,
      });
    }
  }
}
```

Errors are stored in `pendingRecoveries` Map, keyed by SDK path.

#### Step 3: Recovery Detection

After a subsequent successful `executeCode()`:

```typescript
// src/agents/codecallAgent.ts (lines 400-404)

private checkForRecovery(result: unknown): boolean {
  const execResult = result as { status?: string };
  return execResult.status === "success" && this.pendingRecoveries.size > 0;
}
```

If recovery is detected, `triggerClarificationFlow()` is called.

#### Step 4: Clarification Request

The system injects a hidden system message:

```typescript
// src/agents/codecallAgent.ts (lines 406-426)

const clarificationPrompt = `You just recovered from an error in \`${recovery.sdkPath}\`.

TASK: Write a learned constraint that will help future agents avoid this error.

RULES:
1. Write 2-4 sentences ONLY - plain text, no markdown, no headers, no bullet points
2. Include the exact error message or key phrase from it
3. Explain what parameter/value caused it and what the correct approach is
4. This will be inserted into the SDK file as a comment, so keep it clean

THE GOAL IS TO PREVENT THIS ERROR FROM HAPPENING AGAIN, SO IF YOU WERE TO DO THIS AGAIN, WHAT INFO WOULD YOU HAVE NEEDED FOR THIS ERROR TO NOT HAPPEN?

PUTTING IT IN THE SDK FILE AS A COMMENT WILL HELP FUTURE AGENTS AVOID THIS ERROR, MAKE SURE TO MAKE IT CLEAR AND CONCISE, BUT MOST IMPORTANTLY SO THEY UNDERSTAND WHAT TO DO TO AVOID THIS ERROR.

FULL ERROR:
${recovery.errorMessage}

Respond with the constraint text:`;
```

**Key points:**

- Full error message included (no truncation)
- Requests 2-4 sentences (not just 2)
- Emphasizes preventing the error
- Clear instructions to avoid markdown

#### Step 5: Response Sanitization

Before writing, the response is sanitized:

````typescript
// src/agents/codecallAgent.ts (lines 428-450)

private sanitizeConstraintText(text: string): string | null {
  let sanitized = text
    .replace(/^#+\s*.*/gm, "")      // Remove headers
    .replace(/^[-*]\s+/gm, "")      // Remove bullets
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]+`/g, (match) => match.slice(1, -1)) // Unwrap inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
    .replace(/\*([^*]+)\*/g, "$1")     // Remove italic
    .replace(/^---+$/gm, "")           // Remove horizontal rules
    .replace(/\n{3,}/g, "\n\n")        // Normalize newlines
    .trim();

  // Reject if still contains markdown or invalid length
  if (sanitized.includes("##") || sanitized.includes("**") ||
      sanitized.includes("```") || sanitized.length > 1500 ||
      sanitized.length < 50) {
    return null;
  }

  return sanitized;
}
````

This prevents corrupted SDK files (like the one that occurred before this validation was added).

#### Step 6: Banner Formatting

The constraint is formatted into a highly visible banner:

```typescript
// src/core/internalTools.ts (lines 113-147)

function formatConstraintBanner(constraint: string): string {
  const maxLineLength = 78;
  const contentWidth = maxLineLength - 8;

  // Normalize whitespace and word-wrap
  const normalizedConstraint = constraint
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Word-wrap logic...

  // Create box-drawing banner
  const topBorder = " * ╔" + "═".repeat(maxLineLength - 2) + "╗";
  const headerLine =
    " * ║  @CC LEARNED CONSTRAINT" + " ".repeat(contentWidth - 21) + "║";
  const bottomBorder = " * ╚" + "═".repeat(maxLineLength - 2) + "╝";

  return [
    "/**",
    topBorder,
    headerLine,
    ...paddedLines,
    bottomBorder,
    " */",
  ].join("\n");
}
```

**Example output:**

```typescript
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  @CC LEARNED CONSTRAINT                                                   ║
 * ║  The `findTasks` tool requires "At least one filter must be provided:    ║
 * ║  searchText, projectId, sectionId, parentId, responsibleUser, or         ║
 * ║  labels" - you cannot call it with only `responsibleUserFiltering` or    ║
 * ║  `limit`. To get all tasks, you must iterate through all projects        ║
 * ║  using `projectId` as the required filter, or provide a non-empty         ║
 * ║  `searchText`.                                                           ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */
```

#### Step 7: File Update

The banner is inserted into the SDK file:

```typescript
// src/core/internalTools.ts (lines 149-181)

export function appendLearnedConstraint(
  toolsDir: string,
  sdkPath: string,
  constraint: string
): { success: boolean; error?: string } {
  // Path safety validation
  if (!isPathSafe(toolsDir, sdkPath)) {
    return { success: false, error: "Invalid path" };
  }

  const fullPath = path.join(toolsDir, sdkPath);
  const content = fs.readFileSync(fullPath, "utf-8");
  const banner = formatConstraintBanner(constraint);

  // Find first JSDoc closing
  const firstJsDocEnd = content.indexOf("*/");
  if (firstJsDocEnd === -1) {
    return { success: false, error: "Could not find JSDoc comment" };
  }

  // Insert banner after JSDoc comment
  const insertPosition = firstJsDocEnd + 2;
  const updatedContent =
    content.slice(0, insertPosition) +
    "\n\n" +
    banner +
    content.slice(insertPosition);

  fs.writeFileSync(fullPath, updatedContent, "utf-8");
  return { success: true };
}
```

The banner is placed **immediately after the main JSDoc comment**, ensuring it's the first thing agents see when reading the SDK file.

### Integration with Existing Systems

#### Sandbox Integration

The sandbox (see `SANDBOX_ARCHITECTURE.md`) was extended to track tool errors:

```typescript
// src/core/sandbox.ts

interface ToolError {
  toolPath: string; // e.g., "todoist.findTasks"
  sdkPath: string; // e.g., "todoist/findTasks.ts"
  errorMessage: string; // Full error message
}

export interface ExecutionResult {
  status: "success" | "error";
  output?: unknown;
  error?: string;
  progressLogs: unknown[];
  toolErrors: ToolError[]; // ← New field
}
```

This integrates seamlessly with the existing sandbox IPC protocol (see `SANDBOX_ARCHITECTURE.md` lines 110-128).

#### Tool Registry Integration

The tool registry (see `TOOL_REGISTRY.md`) doesn't need changes - errors bubble up naturally through the existing `call()` interface. The sandbox catches errors from `registry.call()` and tracks them.

#### Agent Loop Integration

The agent loop in `codecallAgent.ts` was extended to:

1. Track errors after each `executeCode` call
2. Detect recovery on subsequent successful calls
3. Trigger clarification flow automatically
4. Update SDK files without exposing a tool

This happens **transparently** - the model doesn't need to know about it.

### Why This Design?

#### Why Not Expose an `updateSdkFile` Tool?

**Security Risk:** If the model could call `updateSdkFile()` directly, users could:

- Inject malicious code into SDK files
- Corrupt SDK files with invalid syntax
- Overwrite legitimate constraints
- Abuse the system for arbitrary file writes

**Our Solution:** System-driven flow with validation ensures:

- Updates only happen after genuine error recovery
- Model only provides clarification text (validated)
- System controls what gets written (sanitized banner format)
- Path safety prevents writing outside SDK directory

#### Why Track Errors in Sandbox?

Errors must be tracked at the sandbox level because:

- Sandbox is where tool calls actually execute
- Sandbox has access to both `toolPath` and can derive `sdkPath`
- Sandbox already handles error serialization
- Single source of truth for execution errors

#### Why Detect Recovery in Agent?

Recovery detection happens in the agent because:

- Agent orchestrates multiple `executeCode()` calls
- Agent maintains conversation state (`pendingRecoveries` Map)
- Agent can inject clarification requests into the conversation
- Agent controls when to trigger the learning flow

#### Why Highly Visible Banner?

The `@CC LEARNED CONSTRAINT` banner uses box-drawing characters because:

- **Impossible to miss** - stands out visually even when skimming
- **Easy to search** - `@CC` tag (stands for "Codecall") makes it grep-able
- **Preserves readability** - doesn't break SDK file structure
- **Professional appearance** - clear, structured format

**What is @CC?** The `@CC` prefix stands for **"Codecall"** - the project name. It serves as a namespace tag to identify constraints that were automatically learned by the Codecall self-learning system, distinguishing them from other documentation comments.

### Real-World Example

**Scenario:** Agent tries to get all tasks without a filter

**Error:**

```
Error: At least one filter must be provided: searchText, projectId,
sectionId, parentId, responsibleUser, or labels
```

**Recovery:** Agent calls `findProjects()` first, then iterates through projects calling `findTasks({ projectId })` for each.

**Learned Constraint Added:**

```typescript
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  @CC LEARNED CONSTRAINT                                                   ║
 * ║  The `findTasks` tool requires "At least one filter must be provided:    ║
 * ║  searchText, projectId, sectionId, parentId, responsibleUser, or         ║
 * ║  labels" - you cannot call it with only `responsibleUserFiltering` or    ║
 * ║  `limit`. To get all tasks, you must iterate through all projects        ║
 * ║  using `projectId` as the required filter, or provide a non-empty         ║
 * ║  `searchText`.                                                           ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */
```

**Next Agent:** Reads SDK file → sees banner immediately → uses `findProjects()` + `findTasks({ projectId })` pattern → avoids error entirely.

### Files Modified

| File                          | Changes                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `src/types/execution.ts`      | Added `ToolError` interface and `toolErrors: ToolError[]` to `ExecutionResult` |
| `src/core/sandbox.ts`         | Track tool errors during execution, include in `ExecutionResult`               |
| `src/core/internalTools.ts`   | Added `formatConstraintBanner()` and `appendLearnedConstraint()` functions     |
| `src/agents/codecallAgent.ts` | Added error tracking, recovery detection, clarification flow, and sanitization |

### Limitations

1. **Only triggers after recovery** - If agent never successfully recovers, no learning occurs
2. **Requires SDK file structure** - Needs JSDoc comment to insert banner after
3. **Single banner per file** - Multiple errors for same SDK file overwrite previous recovery
4. **No deduplication** - Same constraint might be added multiple times if different errors occur
5. **Model-dependent quality** - Quality of learned constraint depends on model's clarification

### Future Improvements

Potential enhancements:

1. **Constraint deduplication** - Check if similar constraint already exists before adding
2. **Multiple constraints** - Support multiple `@CC` banners per file
3. **Constraint expiration** - Remove outdated constraints after SDK regeneration
4. **Constraint validation** - Test if constraint actually prevents the error
5. **User review** - Allow users to approve/reject learned constraints before writing
6. **Constraint metrics** - Track how often constraints prevent errors

### Testing

To test this feature:

1. **Trigger an error:**

   ```typescript
   // Agent calls:
   await tools.todoist.findTasks({ searchText: "" });
   // Error: "At least one filter must be provided..."
   ```

2. **Recover:**

   ```typescript
   // Agent fixes and calls:
   const projects = await tools.todoist.findProjects({});
   for (const project of projects) {
     await tools.todoist.findTasks({ projectId: project.id });
   }
   // Success!
   ```

3. **Verify SDK file updated:**

   ```bash
   cat generatedSdks/tools/todoist/findTasks.ts
   # Should see @CC LEARNED CONSTRAINT banner
   ```

4. **Test next agent:**
   - New agent reads SDK file
   - Should see banner and avoid the mistake

### Related Documentation

- **`TOOL_REGISTRY.md`** - How tools are registered and called
- **`SANDBOX_ARCHITECTURE.md`** - How code execution works in the sandbox
- **`TRADITIONAL_AGENT.md`** - Alternative agent implementation (doesn't use this feature)

### Conclusion

The self-learning SDK system creates a **virtuous cycle**:

1. Agent makes mistake → learns → SDK improves
2. Next agent reads improved SDK → avoids mistake
3. System gets smarter over time
4. Documentation improves organically

This is a **force multiplier** - each error recovery improves the system for all future agents, creating institutional memory that compounds over time.
