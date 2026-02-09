import { beforeAll, beforeEach, expect, test } from "bun:test";
import { identifier, select, text, bool, remove, Use } from "../src/orm";
import { sync } from "../src/db/sync";
import { db } from "../src/db/db";

@Use()
class RemoveTest {
  id = identifier();
  name = text(100);
  active = bool({ default: true });
}

beforeAll(async () => {
  await sync();
});

beforeEach(() => {
  db.run(`DELETE FROM "RemoveTest"`);
  // Insert test data
  db.run(`INSERT INTO "RemoveTest" (name, active) VALUES ('Alice', 1)`);
  db.run(`INSERT INTO "RemoveTest" (name, active) VALUES ('Bob', 1)`);
  db.run(`INSERT INTO "RemoveTest" (name, active) VALUES ('Charlie', 0)`);
});

test("[remove] - deletes a single record with where", async () => {
  const result = remove("RemoveTest" as any).where({ name: "Alice" }).run();

  expect(result.changes).toBe(1);

  const rows = await select("RemoveTest" as any).all();
  expect(rows.length).toBe(2);
  expect(rows.map((r: any) => r.name)).not.toContain("Alice");
});

test("[remove] - deletes multiple records with where", async () => {
  const result = remove("RemoveTest" as any).where({ active: true }).run();

  expect(result.changes).toBe(2); // Alice and Bob

  const rows = await select("RemoveTest" as any).all();
  expect(rows.length).toBe(1);
  expect((rows[0] as any).name).toBe("Charlie");
});

test("[remove] - deletes all with explicit .all()", async () => {
  const result = remove("RemoveTest" as any).all();

  expect(result.changes).toBe(3);

  const rows = await select("RemoveTest" as any).all();
  expect(rows.length).toBe(0);
});

test("[remove] - throws without where or all", () => {
  expect(() => {
    remove("RemoveTest" as any).run();
  }).toThrow("requires .where() or explicit .all()");
});

test("[remove] - throws for unknown model", () => {
  expect(() => {
    remove("NonExistent" as any).where({ id: 1 }).run();
  }).toThrow('Model "NonExistent" not found');
});

test("[remove] - returns 0 changes when no rows match", () => {
  const result = remove("RemoveTest" as any)
    .where({ name: "DoesNotExist" })
    .run();

  expect(result.changes).toBe(0);
});
