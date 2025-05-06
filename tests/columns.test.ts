import { expect, test } from "bun:test";
import { Column } from "../src/core";

test("[Column] -- with unique constraint", () => {
  const col = new Column("TEXT", { unique: true });
  expect(col.toSQL("email")).toBe("email TEXT UNIQUE");
});

test("[Column] -- with nullable = false", () => {
  const col = new Column("INTEGER", { nullable: false });
  expect(col.toSQL("age")).toBe("age INTEGER NOT NULL");
});

test("[Column] -- with primary key and auto increment", () => {
  const col = new Column("INTEGER", { primary: true });
  expect(col.toSQL("id")).toBe("id INTEGER PRIMARY KEY");
});

test("[Column] -- with default number value", () => {
  const col = new Column("INTEGER", { default: 42 });
  expect(col.toSQL("level")).toBe("level INTEGER DEFAULT 42");
});

test("[Column] -- with default string value", () => {
  const col = new Column("TEXT", { default: "active" });
  expect(col.toSQL("status")).toBe("status TEXT DEFAULT 'active'");
});

test("[Column] -- with all combined options", () => {
  const col = new Column("VARCHAR(255)", {
    unique: true,
    nullable: false,
    default: "guest",
    primary: true,
  });

  expect(col.toSQL("username")).toBe(
    "username VARCHAR(255) PRIMARY KEY UNIQUE NOT NULL DEFAULT 'guest'"
  );
});
