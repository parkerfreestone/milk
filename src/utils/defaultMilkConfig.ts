import type { MilkConfig } from "./loadConfig";

export const defaultMilkConfig: MilkConfig = {
  dbPath: "milk/milk.db",
  log: true,
  pluralize: true,
  tableCase: "title",
};
