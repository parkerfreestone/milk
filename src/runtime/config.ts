import { existsSync } from "fs";
import path from "path";
import { defaultMilkConfig } from "../utils/defaultMilkConfig";
import type { MilkConfig } from "../types";

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
