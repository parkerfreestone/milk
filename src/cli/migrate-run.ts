import { runMigrations } from "../db/migrations/runner";

export const migrateRun = async (): Promise<void> => {
  await runMigrations();
};
