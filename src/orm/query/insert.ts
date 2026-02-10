import { db } from "../../db/db";
import type { TableName, TableRecord } from "../../types/tableMap";
import type { InsertInput } from "../../typeUtils";
import { log } from "../../utils/log";
import { getTableName } from "../../utils/tableName";
import { getModel, getSchema } from "../schema/modelRegistry";

const generateUuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const insert = async <T extends TableName>(
  tableName: T,
  data: InsertInput<TableRecord<T>>,
) => {
  const model = getModel(tableName);
  if (!model) throw new Error(`Model "${tableName}" not found.`);

  const schema = getSchema(model.instance);
  const keys = Object.keys(schema);

  // Include uuid fields even if not provided (we'll generate them)
  const fields = keys.filter((key) => {
    const col = schema[key];
    if (col?.options.autoIncrement && col?.options.primary) return false;
    if (col?.options._isUuid && !(key in data)) return true;
    return key in data;
  });

  const values = fields.map((key) => {
    const col = schema[key];
    // Generate UUID if this is a uuid column and no value provided
    if (col?.options._isUuid && !(key in data)) {
      return generateUuid();
    }
    const value = data[key as keyof TableRecord<T>];
    return value instanceof Date ? value.toISOString() : value;
  });

  const quotedFields = fields.map((field) => `"${field}"`).join(", ");
  const placeholders = fields.map(() => "?").join(", ");
  const finalTableName = getTableName(model.tableName);

  const sql = `INSERT INTO "${finalTableName}" (${quotedFields}) VALUES (${placeholders})`;

  db.query(sql).run(
    ...(values as (string | number | boolean | null | Uint8Array)[]),
  );

  log(`INSERT INTO ${finalTableName}`, values);

  return db.query("SELECT last_insert_rowid()").get();
};
