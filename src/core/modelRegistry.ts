import { Column } from "./Column";

const models: Record<string, any> = {};

export const registerModel = (name: string, instance: any) => {
  models[name] = instance;
};

export const getModels = () => {
  return Object.entries(models);
};

export const getModelSchema = (instance: any) => {
  const schema: Record<string, Column> = {};

  for (const key of Object.keys(instance)) {
    const val = instance[key];
    if (val instanceof Column) schema[key] = val;
  }

  return schema;
};
