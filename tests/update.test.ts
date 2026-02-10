import { beforeAll, beforeEach, expect, test } from "bun:test";
import { db } from "../src/db/db";
import { sync } from "../src/db/sync";
import { bool, identifier, select, text, update, Use } from "../src/orm";

@Use()
class UpdateTest {
  id = identifier();
  name = text(100);
  active = bool({ default: true });
}

beforeAll(async () => {
  await sync();
});

beforeEach(() => {
  db.run(`DELETE FROM "UpdateTest"`);
  // Insert test data
  db.run(`INSERT INTO "UpdateTest" (name, active) VALUES ('Alice', 1)`);
  db.run(`INSERT INTO "UpdateTest" (name, active) VALUES ('Bob', 1)`);
  db.run(`INSERT INTO "UpdateTest" (name, active) VALUES ('Charlie', 0)`);
});

test("[update] - updates a single record with where", async () => {
  const result = update("UpdateTest" as any)
    .set({ active: false })
    .where({ name: "Alice" })
    .run();

  expect(result.changes).toBe(1);

  const rows = await select("UpdateTest" as any)
    .where({ name: "Alice" })
    .all();
  expect((rows[0] as any).active).toBe(0); // SQLite stores bool as 0/1
});

test("[update] - updates multiple records with where", async () => {
  const result = update("UpdateTest" as any)
    .set({ active: false })
    .where({ active: true })
    .run();

  expect(result.changes).toBe(2); // Alice and Bob

  const rows = await select("UpdateTest" as any)
    .where({ active: false })
    .all();
  expect(rows.length).toBe(3); // All three now inactive
});

test("[update] - updates all with explicit .all()", async () => {
  const result = update("UpdateTest" as any)
    .set({ active: false })
    .all();

  expect(result.changes).toBe(3);
});

test("[update] - throws without where or all", () => {
  expect(() => {
    update("UpdateTest" as any)
      .set({ active: false })
      .run();
  }).toThrow("requires .where() or explicit .all()");
});

test("[update] - throws without set", () => {
  expect(() => {
    update("UpdateTest" as any)
      .where({ id: 1 })
      .run();
  }).toThrow("requires .set()");
});

test("[update] - throws for unknown model", () => {
  expect(() => {
    update("NonExistent" as any)
      .set({ foo: "bar" })
      .where({ id: 1 })
      .run();
  }).toThrow('Model "NonExistent" not found');
});

test("[update] - handles Date values", async () => {
  // Add a date column for this test (ignore if already exists)
  try {
    db.run(`ALTER TABLE "UpdateTest" ADD COLUMN "updatedAt" DATETIME`);
  } catch {
    // Column already exists from previous test run
  }

  const now = new Date();
  update("UpdateTest" as any)
    .set({ updatedAt: now } as any)
    .where({ name: "Alice" })
    .run();

  const rows = await select("UpdateTest" as any)
    .where({ name: "Alice" })
    .all();
  expect((rows[0] as any).updatedAt).toBe(now.toISOString());
});
