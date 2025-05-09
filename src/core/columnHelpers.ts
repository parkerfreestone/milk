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

export function integer(opts: IntOptions = {}) {
  if (opts.autoIncrement && !opts.primary) {
    throw new Error("autoIncrement requires `primary: true`");
  }

  return new Column("INTEGER", opts);
}

export function bool(opts: BoolOptions = {}) {
  return new Column("BOOLEAN", opts);
}

export function uuid(opts: UuidOptions = {}) {
  return new Column("TEXT", { default: "uuid()", ...opts });
}

export function created(opts: DateOptions = {}) {
  return new Column("DATETIME", { default: "CURRENT_TIMESTAMP", ...opts });
}
