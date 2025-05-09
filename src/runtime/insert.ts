import { db } from "./db";
import { getModel, getSchema } from "../core/modelRegistry";
import type { TableName, TableRecord } from "../types/tableMap";

export const insert = async <T extends TableName>(
  tableName: T,
  data: TableRecord<T>
) => {
  const model = getModel(tableName);
  if (!model) throw new Error(`Model "${tableName}" not found.`);

  const schema = getSchema(model.instance);
  const keys = Object.keys(schema);

  const fields = keys.filter((key) => key in data);
  const values = fields.map((key) => data[key as keyof TableRecord<T>]);

  const quotedFields = fields.map((field) => `"${field}"`).join(", ");
  const placeholders = fields.map(() => "?").join(", ");

  const sql = `INSERT INTO "${model.tableName}" (${quotedFields}) VALUES (${placeholders})`;

  db.query(sql).run(
    ...(values as (string | number | boolean | null | Uint8Array)[])
  );
};
