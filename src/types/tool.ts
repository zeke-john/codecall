export interface JSONSchemaProperty {
  type?: string | string[];
  description?: string;
  enum?: Array<string | number | boolean>;
  default?: unknown;
  items?: JSONSchema;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | JSONSchema;
  oneOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  allOf?: JSONSchema[];
  $ref?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

export interface JSONSchema extends JSONSchemaProperty {
  $schema?: string;
  definitions?: Record<string, JSONSchema>;
}

export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolIcon {
  size: string;
  uri: string;
  mimeType?: string;
}

export interface ToolExecution {
  taskSupport?: "forbidden" | "optional" | "required";
}

export interface ToolDefinition {
  name: string;
  title?: string;
  description?: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  annotations?: ToolAnnotations;
  execution?: ToolExecution;
  icons?: ToolIcon[];
  _meta?: Record<string, unknown>;
}

export interface ToolSource {
  name: string;
  version?: string;
  tools: ToolDefinition[];
}

export interface GeneratedSDKFile {
  fileName: string;
  content: string;
}

export interface GeneratedSDK {
  folderName: string;
  files: GeneratedSDKFile[];
}
