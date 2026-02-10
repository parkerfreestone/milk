import fs from "fs";
import path from "path";
import {
  ensureMigrationTable,
  getAppliedMigrations,
  getLastBatch,
  getMigrationsInBatch,
  recordMigration,
  removeMigration,
  type MigrationRecord,
} from "./tracker";
import { config } from "../config";
import { db } from "../db";
import { log } from "../../utils/log";

export type Migration = {
  name: string;
  path: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
};

const getMigrationsDir = (): string => {
  return (config as any).migrationsDir || "milk/migrations";
};

const loadMigrationFile = async (filePath: string): Promise<Migration> => {
  const name = path.basename(filePath, ".ts");
  const mod = await import(path.resolve(filePath));

  if (typeof mod.up !== "function") {
    throw new Error(`Migration "${name}" is missing an up() function`);
  }

  if (typeof mod.down !== "function") {
    throw new Error(`Migration "${name}" is missing a down() function`);
  }

  return {
    name,
    path: filePath,
    up: mod.up,
    down: mod.down,
  };
};

const getMigrationFiles = (): string[] => {
  const dir = getMigrationsDir();
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .sort()
    .map((f) => path.join(dir, f));
};

const getPendingMigrations = async (): Promise<Migration[]> => {
  const files = getMigrationFiles();
  const applied = getAppliedMigrations();
  const appliedNames = new Set(applied.map((m) => m.name));

  const pending: Migration[] = [];
  for (const file of files) {
    const name = path.basename(file, ".ts");
    if (!appliedNames.has(name)) {
      pending.push(await loadMigrationFile(file));
    }
  }

  return pending;
};

export const runMigrations = async (): Promise<number> => {
  ensureMigrationTable();

  const pending = await getPendingMigrations();
  if (pending.length === 0) {
    log("No pending migrations");
    return 0;
  }

  const batch = getLastBatch() + 1;
  let count = 0;

  for (const migration of pending) {
    log(`Running: ${migration.name}`);

    try {
      db.run("BEGIN TRANSACTION");
      await migration.up();
      recordMigration(migration.name, batch);
      db.run("COMMIT");
      count++;
      log(`Completed: ${migration.name}`);
    } catch (error) {
      db.run("ROLLBACK");
      log(`Failed: ${migration.name}`);
      throw error;
    }
  }

  log(`Ran ${count} migration(s)`);
  return count;
};

export const rollbackMigrations = async (steps: number = 1): Promise<number> => {
  ensureMigrationTable();

  const lastBatch = getLastBatch();
  if (lastBatch === 0) {
    log("Nothing to rollback");
    return 0;
  }

  let count = 0;
  let currentBatch = lastBatch;
  let stepsRemaining = steps;

  while (stepsRemaining > 0 && currentBatch > 0) {
    const migrations = getMigrationsInBatch(currentBatch);
    if (migrations.length === 0) {
      currentBatch--;
      continue;
    }

    for (const record of migrations) {
      const filePath = path.join(getMigrationsDir(), `${record.name}.ts`);

      if (!fs.existsSync(filePath)) {
        log(`Warning: Migration file not found: ${record.name}`);
        removeMigration(record.name);
        count++;
        continue;
      }

      const migration = await loadMigrationFile(filePath);
      log(`Rolling back: ${migration.name}`);

      try {
        db.run("BEGIN TRANSACTION");
        await migration.down();
        removeMigration(migration.name);
        db.run("COMMIT");
        count++;
        log(`Rolled back: ${migration.name}`);
      } catch (error) {
        db.run("ROLLBACK");
        log(`Failed to rollback: ${migration.name}`);
        throw error;
      }
    }

    currentBatch--;
    stepsRemaining--;
  }

  log(`Rolled back ${count} migration(s)`);
  return count;
};

export const getMigrationStatus = (): {
  applied: MigrationRecord[];
  pending: string[];
} => {
  ensureMigrationTable();

  const applied = getAppliedMigrations();
  const files = getMigrationFiles();
  const appliedNames = new Set(applied.map((m) => m.name));

  const pending = files
    .map((f) => path.basename(f, ".ts"))
    .filter((name) => !appliedNames.has(name));

  return { applied, pending };
};
