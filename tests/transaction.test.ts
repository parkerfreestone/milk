import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { transaction } from "../src/db";
import { db } from "../src/db/db";
import { sync } from "../src/db/sync";
import { identifier, insert, select, text, Use } from "../src/orm";

@Use()
class TxTest {
  id = identifier();
  name = text(100);
}

beforeAll(async () => {
  await sync();
});

beforeEach(() => {
  db.run(`DELETE FROM "TxTest"`);
});

describe("transaction", () => {
  test("commits on success", async () => {
    await transaction(async () => {
      await insert("TxTest" as any, { name: "Alice" });
      await insert("TxTest" as any, { name: "Bob" });
    });

    const rows = await select("TxTest" as any).all();
    expect(rows.length).toBe(2);
  });

  test("rolls back on error", async () => {
    try {
      await transaction(async () => {
        await insert("TxTest" as any, { name: "Alice" });
        throw new Error("Simulated failure");
      });
    } catch (e) {
      // Expected
    }

    const rows = await select("TxTest" as any).all();
    expect(rows.length).toBe(0); // Should be rolled back
  });

  test("returns value from callback", async () => {
    const result = await transaction(async () => {
      await insert("TxTest" as any, { name: "Alice" });
      return "success";
    });

    expect(result).toBe("success");
  });

  test("propagates error from callback", async () => {
    await expect(
      transaction(async () => {
        throw new Error("Test error");
      }),
    ).rejects.toThrow("Test error");
  });

  test("handles multiple operations atomically", async () => {
    // Insert some initial data
    await insert("TxTest" as any, { name: "Initial" });

    try {
      await transaction(async () => {
        await insert("TxTest" as any, { name: "Second" });
        await insert("TxTest" as any, { name: "Third" });
        // This should fail due to some constraint or we throw manually
        throw new Error("Abort!");
      });
    } catch {
      // Expected
    }

    const rows = await select("TxTest" as any).all();
    expect(rows.length).toBe(1); // Only "Initial" should remain
    expect((rows[0] as any).name).toBe("Initial");
  });
});
