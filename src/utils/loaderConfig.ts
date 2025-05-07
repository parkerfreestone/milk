import path from "path";

export type TableCase = "lowercase" | "uppercase" | "title";

export type MilkConfig = {
  dbPath?: string;
  log?: boolean;
  pluralize?: boolean;
  tableCase?: TableCase;
};

const defaultConfig: MilkConfig = {
  dbPath: "milk/milk.db",
  log: true,
  pluralize: true,
  tableCase: "title",
};

export const loadConfig = async (): Promise<MilkConfig> => {
  try {
    const configPath = path.resolve("milk.config.ts");
    const configModule = await import(configPath);
    return { ...defaultConfig, ...configModule.default };
  } catch {
    return defaultConfig;
  }
};
