import { bool, integer, text } from "../src/core";
import { Use } from "../src/decorators/use";
import { sync } from "../src/runtime/sync";
import { select } from "../src/runtime/select";
import { beforeAll, expect, test } from "bun:test";

import { db } from "../src/runtime/db";

@Use()
class TestSelect {
  title = text(100);
  done = bool({ default: false });
  order = integer();
}

beforeAll(() => {
  sync();

  db.run(`DELETE FROM "TestSelect"`);

  const stmt = db.prepare(
    `INSERT INTO "TestSelect" ("title", "done", "order") VALUES (?, ?, ?)`
  );

  stmt.run("A", false, 1);
  stmt.run("B", true, 2);
  stmt.run("C", false, 3);
});

test("[select] - all returns all rows", async () => {
  const rows = await select("TestSelect").all();
  expect(rows.length).toBe(3);
});

test("[select] - filter returns correct rows", async () => {
  const rows: any[] = await select("TestSelect").filter("done", false).all();
  expect(rows.length).toBe(2);
  expect(rows[0].done).toBe(0);
});

test("[select] - where returns matching rows", async () => {
  const rows: any[] = await select("TestSelect").where({
    title: "B",
    done: true,
  });
  expect(rows.length).toBe(1);
  expect(rows[0].title).toBe("B");
});

test("[select] - orderBy returns rows in correct order", async () => {
  const rows: any[] = await select("TestSelect").orderBy("order", "desc").all();
  expect(rows[0]?.title).toBe("C");
  expect(rows.length).toBe(3);
});

test("[select] - limit and offset work together", async () => {
  const rows: any[] = await select("TestSelect")
    .orderBy("order")
    .limit(1)
    .offset(1)
    .all();

  expect(rows.length).toBe(1);
  expect(rows[0].title).toBe("B");
});

test("[select] - first() returns first row", async () => {
  const rows: any = await select("TestSelect").first();
  expect(rows.title).toBe("A");
});

test("[select] - runs all() automatically", async () => {
  const rows: any[] = await select("TestSelect");
  expect(Array.isArray(rows)).toBe(true);
  expect(rows.length).toBe(3);
});
