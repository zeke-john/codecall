/**
 * HOW TO CALL THIS TOOL:
 * await tools.todoistMcpServer.fetch({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 */

export interface FetchInput {
  /** Format \"task:{id}\" or \"project:{id}\". */
  id: string;
}

export async function fetch(input: FetchInput): Promise<any>;