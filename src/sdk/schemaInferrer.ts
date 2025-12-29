import { JSONSchema } from "../types";

export function inferSchemaFromValue(value: unknown): JSONSchema {
  if (value === null) {
    return { type: "null" };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: "array", items: {} };
    }
    const itemSchema = inferSchemaFromValue(value[0]);
    return { type: "array", items: itemSchema };
  }

  switch (typeof value) {
    case "string":
      return { type: "string" };
    case "number":
      return Number.isInteger(value) ? { type: "integer" } : { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "object": {
      const obj = value as Record<string, unknown>;
      const properties: Record<string, JSONSchema> = {};
      for (const [key, val] of Object.entries(obj)) {
        properties[key] = inferSchemaFromValue(val);
      }
      return {
        type: "object",
        properties,
      };
    }
    default:
      return {};
  }
}

export function inferSchemaFromResponse(response: unknown): JSONSchema {
  return inferSchemaFromValue(response);
}
