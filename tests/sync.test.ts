import { beforeEach, expect, test } from "bun:test";
import { config } from "../src/db/config";
import { db } from "../src/db/db";
import { sync } from "../src/db/sync";
import { identifier, text, Use } from "../src/orm";

@Use()
class SyncTest {
  id = identifier();
  name = text(50);
}

beforeEach(() => {
  db.run(`DROP TABLE IF EXISTS "SyncTest"`);
});

test("[sync] - creates tables without error", async () => {
  await sync();

  const table = db
    .query<{ name: string }, []>(
      `
        SELECT name FROM sqlite_master WHERE type='table' AND name='SyncTest'
      `,
    )
    .get();

  expect(table?.name).toBe("SyncTest");
});

test("[sync] - can run multiple times safely", async () => {
  await sync();
  await sync();
});

test("[sync] - respects pluralize config", async () => {
  config.pluralize = true;

  await sync();

  const found = db
    .query<{ name: string }, []>(
      `
    SELECT name FROM sqlite_master WHERE type='table' AND name='SyncTests'
  `,
    )
    .get();

  expect(found?.name).toBe("SyncTests");

  config.pluralize = false;
});
