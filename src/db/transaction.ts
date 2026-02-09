import { db } from "./db";
import { log } from "../utils/log";

/**
 * Execute operations within a transaction.
 * Automatically commits on success, rolls back on error.
 *
 * @example
 * await transaction(async () => {
 *   await insert("User", { name: "Alice" });
 *   await insert("Profile", { userId: 1, bio: "Hello" });
 * });
 */
export const transaction = async <T>(fn: () => Promise<T>): Promise<T> => {
  db.run("BEGIN TRANSACTION");
  log("Transaction started");

  try {
    const result = await fn();
    db.run("COMMIT");
    log("Transaction committed");
    return result;
  } catch (error) {
    db.run("ROLLBACK");
    log("Transaction rolled back");
    throw error;
  }
};

/**
 * Execute operations within a transaction (sync version).
 * Automatically commits on success, rolls back on error.
 *
 * @example
 * transactionSync(() => {
 *   db.run("INSERT INTO users ...");
 *   db.run("INSERT INTO profiles ...");
 * });
 */
export const transactionSync = <T>(fn: () => T): T => {
  db.run("BEGIN TRANSACTION");
  log("Transaction started");

  try {
    const result = fn();
    db.run("COMMIT");
    log("Transaction committed");
    return result;
  } catch (error) {
    db.run("ROLLBACK");
    log("Transaction rolled back");
    throw error;
  }
};
