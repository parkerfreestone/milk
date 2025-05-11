import { config } from "../db";

const prefix = "🥛 [Milk] - ";

export const log = (...args: any[]) => {
  if (config.log) console.log(prefix, ...args);
};

export const warn = (...args: any[]) => {
  if (config.log) console.warn(prefix, ...args);
};

export const info = (...args: any[]) => {
  if (config.log) console.info(prefix, ...args);
};
