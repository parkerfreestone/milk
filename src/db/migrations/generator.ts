import fs from "fs";
import path from "path";
import { generateMilkName } from "./milkWords";
import { diffSchemas, isDiffEmpty, type SchemaDiff } from "./diff";
import { getDbSchema, getModelSchema, columnToSql } from "./schema";
import { config } from "../config";
import { log } from "../../utils/log";

const getMigrationsDir = (): string => {
  return (config as any).migrationsDir || "milk/migrations";
};

const ensureMigrationsDir = (): void => {
  const dir = getMigrationsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const generateDescription = (diff: SchemaDiff): string => {
  const parts: string[] = [];

  if (diff.tablesToCreate.length === 1) {
    const table = diff.tablesToCreate[0];
    if (table) parts.push(`create_${table.tableName.toLowerCase()}`);
  } else if (diff.tablesToCreate.length > 1) {
    parts.push(`create_${diff.tablesToCreate.length}_tables`);
  }

  if (diff.tablesToDrop.length === 1) {
    const tableName = diff.tablesToDrop[0];
    if (tableName) parts.push(`drop_${tableName.toLowerCase()}`);
  } else if (diff.tablesToDrop.length > 1) {
    parts.push(`drop_${diff.tablesToDrop.length}_tables`);
  }

  if (diff.columnsToAdd.length > 0) {
    const tables = [...new Set(diff.columnsToAdd.map((c) => c.table))];
    const firstColumn = diff.columnsToAdd[0];
    const firstTable = tables[0];
    if (tables.length === 1 && diff.columnsToAdd.length === 1 && firstColumn && firstTable) {
      parts.push(
        `add_${firstColumn.column.name}_to_${firstTable.toLowerCase()}`
      );
    } else {
      parts.push(`add_columns`);
    }
  }

  if (diff.columnsToRemove.length > 0) {
    parts.push(`remove_columns`);
  }

  if (diff.columnsToModify.length > 0) {
    parts.push(`modify_columns`);
  }

  return parts.join("_") || "schema_update";
};

const generateUpCode = (diff: SchemaDiff): string => {
  const lines: string[] = [];

  // Create tables
  for (const table of diff.tablesToCreate) {
    const columns = table.columns.map((col) => columnToSql(col)).join(", ");
    lines.push(
      `  db.run(\`CREATE TABLE "${table.tableName}" (${columns})\`);`
    );
  }

  // Add columns (SQLite supports ADD COLUMN)
  for (const { table, column } of diff.columnsToAdd) {
    const colSql = columnToSql(column);
    lines.push(`  db.run(\`ALTER TABLE "${table}" ADD COLUMN ${colSql}\`);`);
  }

  // Remove columns (requires table recreation in SQLite)
  const tablesToRecreate = new Set([
    ...diff.columnsToRemove.map((c) => c.table),
    ...diff.columnsToModify.map((c) => c.table),
  ]);

  for (const tableName of tablesToRecreate) {
    lines.push(`  // TODO: SQLite requires table recreation to drop/modify columns`);
    lines.push(`  // See: https://www.sqlite.org/lang_altertable.html`);
    lines.push(`  // Table: ${tableName}`);
  }

  // Drop tables
  for (const tableName of diff.tablesToDrop) {
    lines.push(`  db.run(\`DROP TABLE "${tableName}"\`);`);
  }

  return lines.join("\n") || "  // No changes";
};

const generateDownCode = (diff: SchemaDiff): string => {
  const lines: string[] = [];

  // Reverse: Drop created tables
  for (const table of diff.tablesToCreate) {
    lines.push(`  db.run(\`DROP TABLE "${table.tableName}"\`);`);
  }

  // Reverse: Remove added columns (requires table recreation)
  if (diff.columnsToAdd.length > 0) {
    const tables = [...new Set(diff.columnsToAdd.map((c) => c.table))];
    for (const table of tables) {
      lines.push(`  // TODO: SQLite requires table recreation to drop columns`);
      lines.push(`  // Table: ${table}`);
    }
  }

  // Reverse: Re-add removed columns
  for (const { table, columnName } of diff.columnsToRemove) {
    lines.push(`  // TODO: Re-add column "${columnName}" to "${table}"`);
  }

  // Reverse: Recreate dropped tables
  for (const tableName of diff.tablesToDrop) {
    lines.push(`  // TODO: Recreate table "${tableName}" with original schema`);
  }

  return lines.join("\n") || "  // No changes to reverse";
};

const generateMigrationContent = (diff: SchemaDiff): string => {
  const upCode = generateUpCode(diff);
  const downCode = generateDownCode(diff);

  return `import { db } from "@lactose/milk-orm";

export const up = async () => {
${upCode}
};

export const down = async () => {
${downCode}
};
`;
};

export const generateMigration = async (): Promise<string | null> => {
  const modelSchema = getModelSchema();
  const dbSchema = getDbSchema();
  const diff = diffSchemas(modelSchema, dbSchema);

  if (isDiffEmpty(diff)) {
    log("No schema changes detected");
    return null;
  }

  ensureMigrationsDir();

  const milkName = generateMilkName();
  const description = generateDescription(diff);
  const timestamp = Date.now();
  const fileName = `${timestamp}_${milkName}_${description}.ts`;
  const filePath = path.join(getMigrationsDir(), fileName);

  const content = generateMigrationContent(diff);
  fs.writeFileSync(filePath, content);

  log(`Generated migration: ${fileName}`);
  return filePath;
};

export const getDiff = (): SchemaDiff => {
  const modelSchema = getModelSchema();
  const dbSchema = getDbSchema();
  return diffSchemas(modelSchema, dbSchema);
};
