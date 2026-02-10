import { generateMigration } from "../db/migrations/generator";

export const migrateGenerate = async (): Promise<void> => {
  await generateMigration();
};
