import { existsSync } from "fs";
import type { MilkConfig } from "../utils/loadConfig";
import path from "path";
import { defaultMilkConfig } from "../utils/defaultMilkConfig";

let userConfig: Partial<MilkConfig> = {};
try {
  const configPath = path.resolve("milk.config.ts");
  if (existsSync(configPath)) {
    const mod = require(configPath);
    userConfig = mod.default || {};
  }
} catch {
  userConfig = {};
}

export const config: MilkConfig = {
  ...defaultMilkConfig,
  ...userConfig,
};
