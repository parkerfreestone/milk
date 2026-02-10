import path from "path";
import type { MilkConfig } from "../typeUtils";
import { defaultMilkConfig } from "./defaultMilkConfig";

export const loadConfig = async (): Promise<MilkConfig> => {
  try {
    const configPath = path.resolve("milk.config.ts");
    const configModule = await import(configPath);
    return { ...defaultMilkConfig, ...configModule.default };
  } catch {
    return defaultMilkConfig;
  }
};
