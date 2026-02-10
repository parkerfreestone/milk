import type {
  DbTableSchema,
  ModelTableSchema,
  ModelColumnSchema,
  DbColumnInfo,
} from "./schema";

export type ColumnToAdd = {
  table: string;
  column: ModelColumnSchema;
};

export type ColumnToRemove = {
  table: string;
  columnName: string;
};

export type ColumnToModify = {
  table: string;
  column: ModelColumnSchema;
  oldColumn: DbColumnInfo;
};

export type SchemaDiff = {
  tablesToCreate: ModelTableSchema[];
  tablesToDrop: string[];
  columnsToAdd: ColumnToAdd[];
  columnsToRemove: ColumnToRemove[];
  columnsToModify: ColumnToModify[];
};

export const diffSchemas = (
  modelSchema: Map<string, ModelTableSchema>,
  dbSchema: Map<string, DbTableSchema>
): SchemaDiff => {
  const diff: SchemaDiff = {
    tablesToCreate: [],
    tablesToDrop: [],
    columnsToAdd: [],
    columnsToRemove: [],
    columnsToModify: [],
  };

  // Find tables to create (in model but not in DB)
  for (const [tableName, modelTable] of modelSchema) {
    if (!dbSchema.has(tableName)) {
      diff.tablesToCreate.push(modelTable);
    }
  }

  // Find tables to drop (in DB but not in model)
  for (const tableName of dbSchema.keys()) {
    if (!modelSchema.has(tableName)) {
      diff.tablesToDrop.push(tableName);
    }
  }

  // Find column changes for existing tables
  for (const [tableName, modelTable] of modelSchema) {
    const dbTable = dbSchema.get(tableName);
    if (!dbTable) continue;

    const dbColumnMap = new Map(dbTable.columns.map((c) => [c.name, c]));
    const modelColumnMap = new Map(modelTable.columns.map((c) => [c.name, c]));

    // Columns to add (in model but not in DB)
    for (const modelCol of modelTable.columns) {
      if (!dbColumnMap.has(modelCol.name)) {
        diff.columnsToAdd.push({ table: tableName, column: modelCol });
      }
    }

    // Columns to remove (in DB but not in model)
    for (const dbCol of dbTable.columns) {
      if (!modelColumnMap.has(dbCol.name)) {
        diff.columnsToRemove.push({ table: tableName, columnName: dbCol.name });
      }
    }

    // Columns to modify (type or constraints changed)
    for (const modelCol of modelTable.columns) {
      const dbCol = dbColumnMap.get(modelCol.name);
      if (dbCol && hasColumnChanged(modelCol, dbCol)) {
        diff.columnsToModify.push({
          table: tableName,
          column: modelCol,
          oldColumn: dbCol,
        });
      }
    }
  }

  return diff;
};

const hasColumnChanged = (
  modelCol: ModelColumnSchema,
  dbCol: DbColumnInfo
): boolean => {
  // Normalize types for comparison
  const normalizedModelType = normalizeType(modelCol.type);
  const normalizedDbType = normalizeType(dbCol.type);

  if (normalizedModelType !== normalizedDbType) {
    return true;
  }

  // Check nullable - SQLite PRAGMA returns 1 for NOT NULL
  const modelNotNull = modelCol.options.nullable === false;
  const dbNotNull = dbCol.notnull === 1;
  if (modelNotNull !== dbNotNull) {
    return true;
  }

  // Check primary key
  const modelPrimary = modelCol.options.primary === true;
  const dbPrimary = dbCol.pk === 1;
  if (modelPrimary !== dbPrimary) {
    return true;
  }

  return false;
};

const normalizeType = (type: string): string => {
  const upper = type.toUpperCase();
  // Normalize VARCHAR(n) to VARCHAR
  if (upper.startsWith("VARCHAR")) return "VARCHAR";
  // SQLite stores BOOLEAN as INTEGER
  if (upper === "BOOLEAN") return "INTEGER";
  return upper;
};

export const isDiffEmpty = (diff: SchemaDiff): boolean => {
  return (
    diff.tablesToCreate.length === 0 &&
    diff.tablesToDrop.length === 0 &&
    diff.columnsToAdd.length === 0 &&
    diff.columnsToRemove.length === 0 &&
    diff.columnsToModify.length === 0
  );
};
