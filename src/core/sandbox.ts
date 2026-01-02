import { spawn } from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ToolRegistry } from "./toolRegistry";
import { ExecutionResult } from "../types/execution";

export { ExecutionResult };

export interface ExecuteOptions {
  onProgress?: (data: unknown) => void;
}

interface CallMessage {
  type: "call";
  id: number;
  tool: string;
  args: Record<string, unknown>;
}

interface ProgressMessage {
  type: "progress";
  data: unknown;
}

interface ReturnMessage {
  type: "return";
  data: unknown;
}

interface ErrorMessage {
  type: "error";
  message: string;
}

type SandboxMessage =
  | CallMessage
  | ProgressMessage
  | ReturnMessage
  | ErrorMessage;

export class Sandbox {
  constructor(
    private registry: ToolRegistry,
    private timeoutMs: number = 30000
  ) {}

  async execute(
    tsCode: string,
    options: ExecuteOptions = {}
  ): Promise<ExecutionResult> {
    const progressLogs: unknown[] = [];
    const wrappedCode = this.wrapCode(tsCode);
    const tempFile = path.join(
      os.tmpdir(),
      `codecall_sandbox_${Date.now()}_${Math.random().toString(36).slice(2)}.ts`
    );
    fs.writeFileSync(tempFile, wrappedCode);

    return new Promise((resolve) => {
      // deno 2 by default denies everything
      const proc = spawn(
        "deno",
        ["run", "--allow-read=" + tempFile, tempFile],
        {
          stdio: ["pipe", "pipe", "pipe"],
        }
      );

      let resolved = false;
      const finish = (result: ExecutionResult) => {
        if (resolved) return;
        resolved = true;
        proc.kill();
        try {
          fs.unlinkSync(tempFile);
        } catch {}
        resolve(result);
      };

      const timeout = setTimeout(() => {
        finish({ status: "error", error: "Execution timeout", progressLogs });
      }, this.timeoutMs);

      const rl = readline.createInterface({ input: proc.stdout });

      rl.on("line", async (line) => {
        let msg: SandboxMessage;
        try {
          msg = JSON.parse(line) as SandboxMessage;
        } catch {
          return;
        }

        if (msg.type === "call") {
          try {
            const result = await this.registry.call(msg.tool, msg.args);
            proc.stdin.write(JSON.stringify({ id: msg.id, result }) + "\n");
          } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            proc.stdin.write(JSON.stringify({ id: msg.id, error }) + "\n");
          }
        } else if (msg.type === "progress") {
          progressLogs.push(msg.data);
          if (options.onProgress) {
            options.onProgress(msg.data);
          }
        } else if (msg.type === "return") {
          clearTimeout(timeout);
          finish({ status: "success", output: msg.data, progressLogs });
        } else if (msg.type === "error") {
          clearTimeout(timeout);
          finish({ status: "error", error: msg.message, progressLogs });
        }
      });

      let stderr = "";
      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        clearTimeout(timeout);
        if (!resolved) {
          finish({
            status: "error",
            error: stderr || `Process exited with code ${code}`,
            progressLogs,
          });
        }
      });
    });
  }

  private wrapCode(userCode: string): string {
    return `
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
let callId = 0;

const decoder = new TextDecoder();

async function readLine(): Promise<string> {
  const buf = new Uint8Array(65536);
  let line = "";
  while (true) {
    const n = await Deno.stdin.read(buf);
    if (n === null) throw new Error("stdin closed");
    line += decoder.decode(buf.subarray(0, n));
    const idx = line.indexOf("\\n");
    if (idx !== -1) {
      const result = line.slice(0, idx);
      return result;
    }
  }
}

async function startResponseReader() {
  while (true) {
    try {
      const line = await readLine();
      const msg = JSON.parse(line);
      const p = pending.get(msg.id);
      if (p) {
        pending.delete(msg.id);
        if (msg.error) {
          p.reject(new Error(msg.error));
        } else {
          p.resolve(msg.result);
        }
      }
    } catch {
      break;
    }
  }
}

startResponseReader();

async function callTool(tool: string, args: Record<string, unknown>): Promise<unknown> {
  const id = callId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    console.log(JSON.stringify({ type: "call", id, tool, args }));
  });
}

const tools = new Proxy({} as Record<string, Record<string, (args?: Record<string, unknown>) => Promise<unknown>>>, {
  get(_, namespace: string) {
    return new Proxy({}, {
      get(_, method: string) {
        return (args: Record<string, unknown> = {}) => callTool(\`\${namespace}.\${method}\`, args);
      }
    });
  }
});

function progress(data: unknown): void {
  console.log(JSON.stringify({ type: "progress", data }));
}

function validateResult(value: unknown, path = "result"): void {
  if (value === undefined) {
    throw new Error(\`Undefined value at '\${path}'. This usually means you accessed a property that doesn't exist on the object.\`);
  }
  if (value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => validateResult(item, \`\${path}[\${i}]\`));
  } else if (typeof value === "object") {
    Object.entries(value).forEach(([k, v]) => validateResult(v, \`\${path}.\${k}\`));
  }
}

const USER_CODE = \`${userCode
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$")}\`;

(async () => {
  try {
    const result = await (async () => {
      ${userCode}
    })();
    validateResult(result);
    console.log(JSON.stringify({ type: "return", data: result }));
    Deno.exit(0);
  } catch (err) {
    const errorName = err instanceof Error ? err.constructor.name : "Error";
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error && err.stack ? err.stack : "";
    
    const numberedCode = USER_CODE.split("\\n")
      .map((line, i) => \`  \${String(i + 1).padStart(3, " ")} | \${line}\`)
      .join("\\n");
    
    const fullError = [
      \`=== ERROR ===\`,
      \`Type: \${errorName}\`,
      \`Message: \${message}\`,
      \`\`,
      \`=== STACK TRACE ===\`,
      stack,
      \`\`,
      \`=== CODE THAT FAILED ===\`,
      numberedCode,
    ].join("\\n");
    
    console.log(JSON.stringify({ type: "error", message: fullError }));
    Deno.exit(1);
  }
})();
`;
  }
}
