import { beforeAll, beforeEach, expect, test, describe } from "bun:test";
import { identifier, integer, select, text, Use } from "../src/orm";
import { sync } from "../src/db/sync";
import { db } from "../src/db/db";

@Use()
class QueryOpTest {
  id = identifier();
  name = text(100);
  age = integer();
  status = text(50);
}

beforeAll(async () => {
  await sync();
});

beforeEach(() => {
  db.run(`DELETE FROM "QueryOpTest"`);
  // Insert test data
  db.run(
    `INSERT INTO "QueryOpTest" (name, age, status) VALUES ('Alice', 25, 'active')`
  );
  db.run(
    `INSERT INTO "QueryOpTest" (name, age, status) VALUES ('Bob', 30, 'active')`
  );
  db.run(
    `INSERT INTO "QueryOpTest" (name, age, status) VALUES ('Charlie', 35, 'inactive')`
  );
  db.run(
    `INSERT INTO "QueryOpTest" (name, age, status) VALUES ('Diana', 40, 'pending')`
  );
  db.run(`INSERT INTO "QueryOpTest" (name, age, status) VALUES ('Eve', 22, NULL)`);
});

describe("comparison operators", () => {
  test("where with > operator", async () => {
    const rows = await select("QueryOpTest" as any)
      .where("age", ">", 30)
      .all();
    expect(rows.length).toBe(2); // Charlie (35), Diana (40)
  });

  test("where with >= operator", async () => {
    const rows = await select("QueryOpTest" as any)
      .where("age", ">=", 30)
      .all();
    expect(rows.length).toBe(3); // Bob (30), Charlie (35), Diana (40)
  });

  test("where with < operator", async () => {
    const rows = await select("QueryOpTest" as any)
      .where("age", "<", 25)
      .all();
    expect(rows.length).toBe(1); // Eve (22)
  });

  test("where with <= operator", async () => {
    const rows = await select("QueryOpTest" as any)
      .where("age", "<=", 25)
      .all();
    expect(rows.length).toBe(2); // Alice (25), Eve (22)
  });

  test("where with != operator", async () => {
    const rows = await select("QueryOpTest" as any)
      .where("status", "!=", "active")
      .all();
    // NULL != 'active' returns NULL in SQL, so Eve is excluded
    expect(rows.length).toBe(2); // Charlie (inactive), Diana (pending)
  });

  test("whereNot helper", async () => {
    const rows = await select("QueryOpTest" as any)
      .whereNot("status", "active")
      .all();
    expect(rows.length).toBe(2); // Charlie, Diana (Eve has NULL)
  });

  test("whereGt helper", async () => {
    const rows = await select("QueryOpTest" as any).whereGt("age", 30).all();
    expect(rows.length).toBe(2);
  });

  test("whereGte helper", async () => {
    const rows = await select("QueryOpTest" as any).whereGte("age", 30).all();
    expect(rows.length).toBe(3);
  });

  test("whereLt helper", async () => {
    const rows = await select("QueryOpTest" as any).whereLt("age", 25).all();
    expect(rows.length).toBe(1);
  });

  test("whereLte helper", async () => {
    const rows = await select("QueryOpTest" as any).whereLte("age", 25).all();
    expect(rows.length).toBe(2);
  });
});

describe("IN / NOT IN operators", () => {
  test("whereIn with multiple values", async () => {
    const rows = await select("QueryOpTest" as any)
      .whereIn("status", ["active", "pending"])
      .all();
    expect(rows.length).toBe(3); // Alice, Bob, Diana
  });

  test("whereIn with single value", async () => {
    const rows = await select("QueryOpTest" as any)
      .whereIn("name", ["Alice"])
      .all();
    expect(rows.length).toBe(1);
  });

  test("whereNotIn", async () => {
    const rows = await select("QueryOpTest" as any)
      .whereNotIn("status", ["active", "pending"])
      .all();
    expect(rows.length).toBe(1); // Charlie (inactive), Eve has NULL
  });
});

describe("LIKE operator", () => {
  test("whereLike with prefix match", async () => {
    const rows = await select("QueryOpTest" as any)
      .whereLike("name", "A%")
      .all();
    expect(rows.length).toBe(1); // Alice
  });

  test("whereLike with suffix match", async () => {
    const rows = await select("QueryOpTest" as any)
      .whereLike("name", "%e")
      .all();
    expect(rows.length).toBe(3); // Alice, Charlie, Eve
  });

  test("whereLike with contains match", async () => {
    const rows = await select("QueryOpTest" as any)
      .whereLike("name", "%li%")
      .all();
    expect(rows.length).toBe(2); // Alice, Charlie
  });
});

describe("NULL operators", () => {
  test("whereNull", async () => {
    const rows = await select("QueryOpTest" as any).whereNull("status").all();
    expect(rows.length).toBe(1); // Eve
    expect((rows[0] as any).name).toBe("Eve");
  });

  test("whereNotNull", async () => {
    const rows = await select("QueryOpTest" as any)
      .whereNotNull("status")
      .all();
    expect(rows.length).toBe(4); // Everyone except Eve
  });
});

describe("OR conditions", () => {
  test("orWhere with object syntax", async () => {
    const rows = await select("QueryOpTest" as any)
      .where({ status: "active" })
      .orWhere({ status: "pending" })
      .all();
    expect(rows.length).toBe(3); // Alice, Bob, Diana
  });

  test("orWhere with operator syntax", async () => {
    const rows = await select("QueryOpTest" as any)
      .where("age", "<", 25)
      .orWhere("age", ">", 35)
      .all();
    expect(rows.length).toBe(2); // Eve (22), Diana (40)
  });

  test("complex AND/OR combination", async () => {
    // (status = 'active' AND age > 25) OR status = 'pending'
    const rows = await select("QueryOpTest" as any)
      .where({ status: "active" })
      .where("age", ">", 25)
      .orWhere({ status: "pending" })
      .all();
    // Bob (active, 30), Diana (pending, 40)
    expect(rows.length).toBe(2);
  });
});

describe("chaining multiple conditions", () => {
  test("multiple where conditions (AND)", async () => {
    const rows = await select("QueryOpTest" as any)
      .where({ status: "active" })
      .where("age", ">", 25)
      .all();
    expect(rows.length).toBe(1); // Bob
    expect((rows[0] as any).name).toBe("Bob");
  });

  test("combining different operator types", async () => {
    const rows = await select("QueryOpTest" as any)
      .whereIn("status", ["active", "inactive"])
      .whereGte("age", 30)
      .all();
    expect(rows.length).toBe(2); // Bob (active, 30), Charlie (inactive, 35)
  });
});

describe("count()", () => {
  test("count all rows", async () => {
    const count = await select("QueryOpTest" as any).count();
    expect(count).toBe(5);
  });

  test("count with where", async () => {
    const count = await select("QueryOpTest" as any)
      .where({ status: "active" })
      .count();
    expect(count).toBe(2);
  });

  test("count with complex conditions", async () => {
    const count = await select("QueryOpTest" as any)
      .whereGt("age", 25)
      .whereNotNull("status")
      .count();
    expect(count).toBe(3); // Bob, Charlie, Diana
  });
});
