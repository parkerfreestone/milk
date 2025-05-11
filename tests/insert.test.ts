import { beforeAll, expect, test } from "bun:test";
import { bool, identifier, insert, text, timestamped, Use } from "../src/orm";
import { sync } from "../src/db/sync";
import { db } from "../src/db/db";

@Use()
class InsertExample {
  id = identifier();
  name = text(100);
  active = bool({ default: true });
  createdAt = timestamped();
}

beforeAll(() => {
  sync();
  db.run(`DELETE FROM "InsertExample"`);
});

test("[insert] - inserts a record without id", async () => {
  const result = await insert("InsertExample" as any, {
    name: "InsertTest",
    active: false,
    createdAt: new Date(),
  });
  expect(result).toHaveProperty("last_insert_rowid()");
});

test("[insert] - handles partial insert (uses default)", async () => {
  const result = await insert("InsertExample" as any, {
    name: "PartialTest",
  });
  expect(result).toHaveProperty("last_insert_rowid()");
});

test("[insert] - throws if model is not registered", async () => {
  await expect(
    insert("NotRegistered" as any, { anything: "test" })
  ).rejects.toThrow(`Model "NotRegistered" not found.`);
});
