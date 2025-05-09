import { Column } from "./Column";
import type { ModelMetadata } from "../types";

const models = new Map<string, ModelMetadata>();

export const registerModel = (
  className: string,
  instance: any,
  tableName: string
) => {
  console.log(`📦 Model registered: ${className} -> ${tableName}`);
  models.set(className, { tableName, instance });
};

export const getModel = (name: string) => models.get(name);

export const getAllModels = () => Array.from(models.entries());

export const getSchema = (instance: any): Record<string, Column> => {
  const schema: Record<string, Column> = {};

  for (const key of Object.keys(instance)) {
    const val = instance[key];
    if (val instanceof Column) schema[key] = val;
  }

  return schema;
};
