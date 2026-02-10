import { Column } from "./Column";
import { Relation } from "./Relation";
import type { ModelMetadata } from "../../typeUtils";
import { log } from "../../utils/log";

const models = new Map<string, ModelMetadata>();

export const registerModel = (
  className: string,
  instance: any,
  tableName: string
) => {
  log(`Model registered: ${className} -> ${tableName}`);
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

export const getRelations = (instance: any): Record<string, Relation> => {
  const relations: Record<string, Relation> = {};

  for (const key of Object.keys(instance)) {
    const val = instance[key];
    if (val instanceof Relation) relations[key] = val;
  }

  return relations;
};
