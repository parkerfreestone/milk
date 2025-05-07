import { db } from "./db";
import { getModel, getSchema } from "../core/modelRegistry";

export const insert = async (className: string, data: Record<string, any>) => {
  const model = getModel(className);
  if (!model) throw new Error(`Model "${className}" not found.`);

  const schema = getSchema(model.instance);
  const keys = Object.keys(schema);

  const fields = keys.filter((key) => key in data);
  const values = fields.map((key) => data[key]);

  const quotedFields = fields.map((field) => `"${field}"`).join(", ");
  const placeholders = fields.map(() => "?").join(", ");

  const sql = `INSERT INTO "${model.tableName}" (${quotedFields}) VALUES (${placeholders})`;

  db.query(sql).run(...values);
};
