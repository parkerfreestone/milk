import type {
  BoolOptions,
  DateOptions,
  IntOptions,
  TextOptions,
  UuidOptions,
} from "../types";
import { Column } from "./Column";

export const text = (length: number = 255, opts: TextOptions = {}) => {
  return new Column(`VARCHAR(${length})`, opts);
};

export const integer = (opts: IntOptions = {}) => {
  if (opts.autoIncrement && !opts.primary) {
    throw new Error("autoIncrement requires `primary: true`");
  }

  return new Column("INTEGER", opts);
};

export const bool = (opts: BoolOptions = {}) => {
  return new Column("BOOLEAN", opts);
};

export const uuid = (opts: UuidOptions = {}) => {
  return new Column("TEXT", { default: "uuid()", ...opts });
};

export const date = (opts: DateOptions) => {
  return new Column("DATETIME", opts);
};

export const timestamped = (opts: DateOptions = {}) => {
  return new Column("DATETIME", { default: "CURRENT_TIMESTAMP", ...opts });
};
