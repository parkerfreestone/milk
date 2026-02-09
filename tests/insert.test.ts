import { beforeAll, expect, test } from "bun:test";
import {
  bool,
  identifier,
  insert,
  select,
  text,
  timestamped,
  Use,
  uuid,
} from "../src/orm";
import { sync } from "../src/db/sync";
import { db } from "../src/db/db";

@Use()
class InsertExample {
  id = identifier();
  name = text(100);
  active = bool({ default: true });
  createdAt = timestamped();
}

@Use()
class UuidExample {
  id = uuid();
  name = text(100);
}

beforeAll(async () => {
  await sync();
  db.run(`DELETE FROM "InsertExample"`);
  db.run(`DELETE FROM "UuidExample"`);
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

test("[insert] - auto-generates UUID when not provided", async () => {
  await insert("UuidExample" as any, { name: "AutoUuid" });

  const rows = await select("UuidExample" as any).where({ name: "AutoUuid" }).all();
  expect(rows.length).toBe(1);

  const row = rows[0] as { id: string; name: string };
  expect(row.id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  );
});

test("[insert] - uses provided UUID if given", async () => {
  const customUuid = "11111111-2222-4333-8444-555555555555";
  await insert("UuidExample" as any, { id: customUuid, name: "CustomUuid" });

  const rows = await select("UuidExample" as any).where({ name: "CustomUuid" }).all();
  expect(rows.length).toBe(1);

  const row = rows[0] as { id: string; name: string };
  expect(row.id).toBe(customUuid);
});
