import { db } from "../db";
import { getAllModels, getSchema } from "../../orm/schema/modelRegistry";
import { getTableName } from "../../utils/tableName";
import { Column } from "../../orm/schema/Column";

export type DbColumnInfo = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
};

export type DbTableSchema = {
  tableName: string;
  columns: DbColumnInfo[];
};

export type ModelColumnSchema = {
  name: string;
  type: string;
  options: {
    primary?: boolean;
    autoIncrement?: boolean;
    unique?: boolean;
    nullable?: boolean;
    default?: string | number | boolean;
  };
};

export type ModelTableSchema = {
  tableName: string;
  columns: ModelColumnSchema[];
};

export const getDbTables = (): string[] => {
  const tables = db
    .query<{ name: string }, []>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_milk_%'`
    )
    .all();
  return tables.map((t) => t.name);
};

export const getDbTableSchema = (tableName: string): DbColumnInfo[] => {
  return db.query<DbColumnInfo, []>(`PRAGMA table_info("${tableName}")`).all();
};

export const getDbSchema = (): Map<string, DbTableSchema> => {
  const schema = new Map<string, DbTableSchema>();
  const tables = getDbTables();

  for (const tableName of tables) {
    const columns = getDbTableSchema(tableName);
    schema.set(tableName, { tableName, columns });
  }

  return schema;
};

export const getModelSchema = (): Map<string, ModelTableSchema> => {
  const schema = new Map<string, ModelTableSchema>();
  const models = getAllModels();

  for (const [, meta] of models) {
    const { instance, tableName } = meta;
    const finalTableName = getTableName(tableName);
    const modelSchema = getSchema(instance);

    const columns: ModelColumnSchema[] = Object.entries(modelSchema).map(
      ([name, col]) => ({
        name,
        type: col.type || "TEXT",
        options: {
          primary: col.options.primary,
          autoIncrement: col.options.autoIncrement,
          unique: col.options.unique,
          nullable: col.options.nullable,
          default: col.options.default,
        },
      })
    );

    schema.set(finalTableName, { tableName: finalTableName, columns });
  }

  return schema;
};

export const columnToSql = (col: ModelColumnSchema): string => {
  const parts = [`"${col.name}"`, col.type];

  if (col.options.primary) parts.push("PRIMARY KEY");
  if (col.options.autoIncrement) parts.push("AUTOINCREMENT");
  if (col.options.unique) parts.push("UNIQUE");
  if (col.options.nullable === false) parts.push("NOT NULL");
  if (col.options.default !== undefined) {
    const val = formatDefaultValue(col.options.default);
    parts.push(`DEFAULT ${val}`);
  }

  return parts.filter(Boolean).join(" ");
};

const SQL_KEYWORDS = [
  "CURRENT_TIMESTAMP",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "NULL",
];

const formatDefaultValue = (val: string | number | boolean): string => {
  if (typeof val === "string" && SQL_KEYWORDS.includes(val.toUpperCase())) {
    return val;
  }
  if (typeof val === "string") {
    return `'${val}'`;
  }
  return String(val);
};
