import { expect, test } from "bun:test";
import { bool, created, integer, text, uuid } from "../src/core";

test("[text()] -- generates VARCHAR with length", () => {
  const col = text(100);
  expect(col.toSQL("name")).toBe("name VARCHAR(100)");
});

test("[text()] -- with unique and not nullable", () => {
  const col = text(255, { unique: true, nullable: false });
  expect(col.toSQL("email")).toBe("email VARCHAR(255) UNIQUE NOT NULL");
});

test("[integer()] -- with primary and autoIncrement", () => {
  const col = integer({ primary: true, autoIncrement: true });
  expect(col.toSQL("id")).toBe("id INTEGER PRIMARY KEY AUTOINCREMENT");
});

test("integer() throws if autoIncrement is set without primary", () => {
  expect(() => {
    integer({ autoIncrement: true }); // ❌ no primary
  }).toThrow("autoIncrement requires `primary: true`");
});

test("[bool()] -- with default false", () => {
  const col = bool({ default: false });
  expect(col.toSQL("done")).toBe("done BOOLEAN DEFAULT false");
});

test("[uuid()] -- uses TEXT with uuid() default", () => {
  const col = uuid();
  expect(col.toSQL("userId")).toBe("userId TEXT DEFAULT 'uuid()'");
});

test("[created()] -- uses CURRENT_TIMESTAMP default", () => {
  const col = created();
  expect(col.toSQL("createdAt")).toBe(
    "createdAt DATETIME DEFAULT 'CURRENT_TIMESTAMP'"
  );
});
