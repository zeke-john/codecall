/**
 * HOW TO CALL THIS TOOL:
 * await tools.test.exportUsersCsv({ ...params })
 *
 * This is the ONLY way to invoke this tool in your code.
 *
 * @title Export Users CSV
 * @description Export all users as a CSV formatted string.
 * @readOnly true
 * @destructive false
 * @idempotent true
 * @openWorld false
 * @taskSupport forbidden
 */

export interface ExportUsersCsvInput {
  includeInactive?: boolean;
}

export interface ExportUsersCsvSuccessData {
  csv: string;
  rowCount: number;
  includesInactive: boolean;
}

export type ExportUsersCsvOutput = {
  success: true;
  data: ExportUsersCsvSuccessData;
};

export async function exportUsersCsv(input?: ExportUsersCsvInput): Promise<ExportUsersCsvOutput>;