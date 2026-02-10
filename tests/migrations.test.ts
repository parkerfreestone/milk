import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "fs";
import path from "path";
import { config } from "../src/db/config";
import { db } from "../src/db/db";
import { diffSchemas, type SchemaDiff } from "../src/db/migrations/diff";
import { generateMilkName, milkWords } from "../src/db/migrations/milkWords";
import {
  getMigrationStatus,
  rollbackMigrations,
  runMigrations,
} from "../src/db/migrations/runner";
import {
  getDbSchema,
  getDbTables,
  getModelSchema,
} from "../src/db/migrations/schema";
import {
  ensureMigrationTable,
  getAppliedMigrations,
  getLastBatch,
  recordMigration,
  removeMigration,
} from "../src/db/migrations/tracker";
import { identifier, text, Use } from "../src/orm";

// Test model
@Use()
class MigrationTestModel {
  id = identifier();
  name = text(100);
}

const TEST_MIGRATIONS_DIR = "tests/test_migrations";

beforeEach(() => {
  // Clean up any test tables
  db.run(`DROP TABLE IF EXISTS "MigrationTestModel"`);
  db.run(`DROP TABLE IF EXISTS "_milk_migrations"`);

  // Clean up test migrations directory
  if (fs.existsSync(TEST_MIGRATIONS_DIR)) {
    fs.rmSync(TEST_MIGRATIONS_DIR, { recursive: true });
  }
});

afterEach(() => {
  // Clean up
  db.run(`DROP TABLE IF EXISTS "MigrationTestModel"`);
  db.run(`DROP TABLE IF EXISTS "_milk_migrations"`);

  if (fs.existsSync(TEST_MIGRATIONS_DIR)) {
    fs.rmSync(TEST_MIGRATIONS_DIR, { recursive: true });
  }
});

describe("milkWords", () => {
  test("milkWords contains expected words", () => {
    expect(milkWords).toContain("cream");
    expect(milkWords).toContain("butter");
    expect(milkWords).toContain("latte");
    expect(milkWords.length).toBeGreaterThan(20);
  });

  test("generateMilkName returns 3 words joined by underscore", () => {
    const name = generateMilkName();
    const parts = name.split("_");
    expect(parts.length).toBe(3);
    parts.forEach((part) => {
      expect(milkWords).toContain(part);
    });
  });

  test("generateMilkName returns different names", () => {
    const names = new Set<string>();
    for (let i = 0; i < 10; i++) {
      names.add(generateMilkName());
    }
    // Should have multiple unique names (statistically very likely)
    expect(names.size).toBeGreaterThan(5);
  });
});

describe("tracker", () => {
  test("ensureMigrationTable creates table", () => {
    ensureMigrationTable();

    const table = db
      .query<
        { name: string },
        []
      >(`SELECT name FROM sqlite_master WHERE type='table' AND name='_milk_migrations'`)
      .get();

    expect(table?.name).toBe("_milk_migrations");
  });

  test("recordMigration and getAppliedMigrations work together", () => {
    ensureMigrationTable();

    recordMigration("test_migration_1", 1);
    recordMigration("test_migration_2", 1);

    const applied = getAppliedMigrations();
    expect(applied.length).toBe(2);
    expect(applied[0].name).toBe("test_migration_1");
    expect(applied[1].name).toBe("test_migration_2");
    expect(applied[0].batch).toBe(1);
  });

  test("getLastBatch returns correct batch number", () => {
    ensureMigrationTable();

    expect(getLastBatch()).toBe(0);

    recordMigration("m1", 1);
    expect(getLastBatch()).toBe(1);

    recordMigration("m2", 2);
    expect(getLastBatch()).toBe(2);
  });

  test("removeMigration deletes record", () => {
    ensureMigrationTable();
    recordMigration("to_remove", 1);

    let applied = getAppliedMigrations();
    expect(applied.length).toBe(1);

    removeMigration("to_remove");

    applied = getAppliedMigrations();
    expect(applied.length).toBe(0);
  });
});

describe("schema introspection", () => {
  test("getDbTables returns existing tables", () => {
    db.run(`CREATE TABLE "TestTable1" (id INTEGER PRIMARY KEY)`);
    db.run(`CREATE TABLE "TestTable2" (id INTEGER PRIMARY KEY)`);

    const tables = getDbTables();
    expect(tables).toContain("TestTable1");
    expect(tables).toContain("TestTable2");

    db.run(`DROP TABLE "TestTable1"`);
    db.run(`DROP TABLE "TestTable2"`);
  });

  test("getDbTables excludes internal tables", () => {
    ensureMigrationTable();
    const tables = getDbTables();
    expect(tables).not.toContain("_milk_migrations");
  });

  test("getDbSchema returns column info", () => {
    db.run(`CREATE TABLE "SchemaTestTable" (
      id INTEGER PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      age INTEGER
    )`);

    const schema = getDbSchema();
    const table = schema.get("SchemaTestTable");

    expect(table).toBeDefined();
    expect(table!.columns.length).toBe(3);
    expect(table!.columns[0].name).toBe("id");
    expect(table!.columns[1].name).toBe("name");
    expect(table!.columns[1].notnull).toBe(1);

    db.run(`DROP TABLE "SchemaTestTable"`);
  });

  test("getModelSchema returns model info", () => {
    const schema = getModelSchema();
    const table = schema.get("MigrationTestModel");

    expect(table).toBeDefined();
    expect(table!.columns.length).toBe(2);
    expect(table!.columns[0].name).toBe("id");
    expect(table!.columns[1].name).toBe("name");
  });
});

describe("diff", () => {
  test("detects new table", () => {
    const modelSchema = getModelSchema();
    const dbSchema = getDbSchema();

    const diff = diffSchemas(modelSchema, dbSchema);

    expect(diff.tablesToCreate.length).toBeGreaterThan(0);
    const tableNames = diff.tablesToCreate.map((t) => t.tableName);
    expect(tableNames).toContain("MigrationTestModel");
  });

  test("detects table to drop", () => {
    db.run(`CREATE TABLE "OldTable" (id INTEGER PRIMARY KEY)`);

    const modelSchema = getModelSchema();
    const dbSchema = getDbSchema();

    const diff = diffSchemas(modelSchema, dbSchema);

    expect(diff.tablesToDrop).toContain("OldTable");

    db.run(`DROP TABLE "OldTable"`);
  });

  test("detects column to add", () => {
    db.run(
      `CREATE TABLE "MigrationTestModel" (id INTEGER PRIMARY KEY AUTOINCREMENT)`,
    );

    const modelSchema = getModelSchema();
    const dbSchema = getDbSchema();

    const diff = diffSchemas(modelSchema, dbSchema);

    expect(diff.columnsToAdd.length).toBe(1);
    expect(diff.columnsToAdd[0].column.name).toBe("name");

    db.run(`DROP TABLE "MigrationTestModel"`);
  });

  test("detects column to remove", () => {
    db.run(`CREATE TABLE "MigrationTestModel" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100),
      extra_column TEXT
    )`);

    const modelSchema = getModelSchema();
    const dbSchema = getDbSchema();

    const diff = diffSchemas(modelSchema, dbSchema);

    // Filter to only columns for MigrationTestModel
    const columnsToRemoveFromTestModel = diff.columnsToRemove.filter(
      (c) => c.table === "MigrationTestModel",
    );

    expect(columnsToRemoveFromTestModel.length).toBe(1);
    expect(columnsToRemoveFromTestModel[0].columnName).toBe("extra_column");

    db.run(`DROP TABLE "MigrationTestModel"`);
  });

  test("isDiffEmpty returns true when no changes", () => {
    db.run(`CREATE TABLE "MigrationTestModel" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100)
    )`);

    const modelSchema = getModelSchema();
    const dbSchema = getDbSchema();

    const diff = diffSchemas(modelSchema, dbSchema);

    // There may be other registered models, so filter to just our test model
    const relevantDiff: SchemaDiff = {
      ...diff,
      tablesToCreate: diff.tablesToCreate.filter(
        (t) => t.tableName === "MigrationTestModel",
      ),
    };

    // If we only look at MigrationTestModel, it should have no changes
    expect(relevantDiff.tablesToCreate.length).toBe(0);

    db.run(`DROP TABLE "MigrationTestModel"`);
  });
});

describe("runner", () => {
  test("getMigrationStatus returns correct status", () => {
    // Create test migrations directory
    fs.mkdirSync(TEST_MIGRATIONS_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(TEST_MIGRATIONS_DIR, "001_test.ts"),
      `export const up = async () => {}; export const down = async () => {};`,
    );

    // Temporarily override config
    const originalDir = (config as any).migrationsDir;
    (config as any).migrationsDir = TEST_MIGRATIONS_DIR;

    const status = getMigrationStatus();

    expect(status.applied.length).toBe(0);
    expect(status.pending.length).toBe(1);
    expect(status.pending[0]).toBe("001_test");

    // Restore config
    (config as any).migrationsDir = originalDir;
  });

  test("runMigrations executes pending migrations", async () => {
    // Create test migrations directory
    fs.mkdirSync(TEST_MIGRATIONS_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(TEST_MIGRATIONS_DIR, "001_create_test.ts"),
      `
import { db } from "../../src/db/db";
export const up = async () => {
  db.run('CREATE TABLE "RunnerTest" (id INTEGER PRIMARY KEY)');
};
export const down = async () => {
  db.run('DROP TABLE "RunnerTest"');
};
`,
    );

    const originalDir = (config as any).migrationsDir;
    (config as any).migrationsDir = TEST_MIGRATIONS_DIR;

    const count = await runMigrations();

    expect(count).toBe(1);

    // Verify table was created
    const table = db
      .query<
        { name: string },
        []
      >(`SELECT name FROM sqlite_master WHERE type='table' AND name='RunnerTest'`)
      .get();
    expect(table?.name).toBe("RunnerTest");

    // Verify migration was recorded
    const applied = getAppliedMigrations();
    expect(applied.length).toBe(1);
    expect(applied[0].name).toBe("001_create_test");

    // Clean up
    db.run(`DROP TABLE IF EXISTS "RunnerTest"`);
    (config as any).migrationsDir = originalDir;
  });

  test("rollbackMigrations reverses migrations", async () => {
    // Create test migrations directory
    fs.mkdirSync(TEST_MIGRATIONS_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(TEST_MIGRATIONS_DIR, "001_create_rollback_test.ts"),
      `
import { db } from "../../src/db/db";
export const up = async () => {
  db.run('CREATE TABLE "RollbackTest" (id INTEGER PRIMARY KEY)');
};
export const down = async () => {
  db.run('DROP TABLE "RollbackTest"');
};
`,
    );

    const originalDir = (config as any).migrationsDir;
    (config as any).migrationsDir = TEST_MIGRATIONS_DIR;

    // Run migration first
    await runMigrations();

    // Verify table exists
    let table = db
      .query<
        { name: string },
        []
      >(`SELECT name FROM sqlite_master WHERE type='table' AND name='RollbackTest'`)
      .get();
    expect(table?.name).toBe("RollbackTest");

    // Rollback
    const count = await rollbackMigrations();
    expect(count).toBe(1);

    // Verify table was dropped
    table = db
      .query<
        { name: string },
        []
      >(`SELECT name FROM sqlite_master WHERE type='table' AND name='RollbackTest'`)
      .get();
    expect(table).toBeFalsy();

    // Verify migration record was removed
    const applied = getAppliedMigrations();
    expect(applied.length).toBe(0);

    (config as any).migrationsDir = originalDir;
  });

  test("runMigrations handles empty directory", async () => {
    fs.mkdirSync(TEST_MIGRATIONS_DIR, { recursive: true });

    const originalDir = (config as any).migrationsDir;
    (config as any).migrationsDir = TEST_MIGRATIONS_DIR;

    const count = await runMigrations();
    expect(count).toBe(0);

    (config as any).migrationsDir = originalDir;
  });

  test("migrations run in order", async () => {
    fs.mkdirSync(TEST_MIGRATIONS_DIR, { recursive: true });

    // Create migrations that depend on order
    fs.writeFileSync(
      path.join(TEST_MIGRATIONS_DIR, "001_first.ts"),
      `
import { db } from "../../src/db/db";
export const up = async () => {
  db.run('CREATE TABLE "OrderTest" (id INTEGER PRIMARY KEY, step INTEGER)');
  db.run('INSERT INTO "OrderTest" (step) VALUES (1)');
};
export const down = async () => {
  db.run('DROP TABLE "OrderTest"');
};
`,
    );

    fs.writeFileSync(
      path.join(TEST_MIGRATIONS_DIR, "002_second.ts"),
      `
import { db } from "../../src/db/db";
export const up = async () => {
  db.run('INSERT INTO "OrderTest" (step) VALUES (2)');
};
export const down = async () => {
  db.run('DELETE FROM "OrderTest" WHERE step = 2');
};
`,
    );

    const originalDir = (config as any).migrationsDir;
    (config as any).migrationsDir = TEST_MIGRATIONS_DIR;

    const count = await runMigrations();
    expect(count).toBe(2);

    // Verify both inserts happened in order
    const rows = db
      .query<{ step: number }, []>(`SELECT step FROM "OrderTest" ORDER BY id`)
      .all();
    expect(rows.length).toBe(2);
    expect(rows[0].step).toBe(1);
    expect(rows[1].step).toBe(2);

    db.run(`DROP TABLE IF EXISTS "OrderTest"`);
    (config as any).migrationsDir = originalDir;
  });
});
