import { getMigrationStatus } from "../db/migrations/runner";
import { log } from "../utils/log";

export const migrateStatus = async (): Promise<void> => {
  const { applied, pending } = getMigrationStatus();

  if (applied.length === 0 && pending.length === 0) {
    log("No migrations found");
    return;
  }

  if (applied.length > 0) {
    log("Applied migrations:");
    for (const m of applied) {
      log(`  [${m.batch}] ${m.name} (${m.executed_at})`);
    }
  }

  if (pending.length > 0) {
    log("");
    log("Pending migrations:");
    for (const name of pending) {
      log(`  [ ] ${name}`);
    }
  }

  if (pending.length === 0) {
    log("");
    log("All migrations have been applied");
  }
};
