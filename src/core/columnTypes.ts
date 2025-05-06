import type { CommonColumnOptions } from "./Column";

export type TextOptions = CommonColumnOptions & {
  length?: number;
};

export type IntOptions = CommonColumnOptions & {
  autoIncrement?: boolean;
};

export type BoolOptions = CommonColumnOptions;
export type UuidOptions = CommonColumnOptions;
export type DateOptions = CommonColumnOptions;
