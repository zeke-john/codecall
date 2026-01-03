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

export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
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
