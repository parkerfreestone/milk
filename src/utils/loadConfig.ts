import { defaultMilkConfig } from "./defaultMilkConfig";
import path from "path";

export type TableCase = "lowercase" | "uppercase" | "title";

export type MilkConfig = {
  dbPath?: string;
  log?: boolean;
  pluralize?: boolean;
  tableCase?: TableCase;
};

export const loadConfig = async (): Promise<MilkConfig> => {
  try {
    const configPath = path.resolve("milk.config.ts");
    const configModule = await import(configPath);
    return { ...defaultMilkConfig, ...configModule.default };
  } catch {
    return defaultMilkConfig;
  }
};
