import { rollbackMigrations } from "../db/migrations/runner";

export const migrateRollback = async (steps: number = 1): Promise<void> => {
  await rollbackMigrations(steps);
};
