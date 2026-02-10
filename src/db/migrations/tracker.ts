import { db } from "../db";

const MIGRATION_TABLE = "_milk_migrations";

export type MigrationRecord = {
  id: number;
  name: string;
  batch: number;
  executed_at: string;
};

export const ensureMigrationTable = (): void => {
  db.run(`
    CREATE TABLE IF NOT EXISTS "${MIGRATION_TABLE}" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      batch INTEGER NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const getAppliedMigrations = (): MigrationRecord[] => {
  ensureMigrationTable();
  return db
    .query<MigrationRecord, []>(
      `SELECT id, name, batch, executed_at FROM "${MIGRATION_TABLE}" ORDER BY id ASC`
    )
    .all();
};

export const getLastBatch = (): number => {
  ensureMigrationTable();
  const result = db
    .query<{ batch: number | null }, []>(
      `SELECT MAX(batch) as batch FROM "${MIGRATION_TABLE}"`
    )
    .get();
  return result?.batch ?? 0;
};

export const getMigrationsInBatch = (batch: number): MigrationRecord[] => {
  ensureMigrationTable();
  return db
    .query<MigrationRecord, [number]>(
      `SELECT id, name, batch, executed_at FROM "${MIGRATION_TABLE}" WHERE batch = ? ORDER BY id DESC`
    )
    .all(batch);
};

export const recordMigration = (name: string, batch: number): void => {
  ensureMigrationTable();
  db.run(
    `INSERT INTO "${MIGRATION_TABLE}" (name, batch) VALUES (?, ?)`,
    [name, batch]
  );
};

export const removeMigration = (name: string): void => {
  db.run(`DELETE FROM "${MIGRATION_TABLE}" WHERE name = ?`, [name]);
};
