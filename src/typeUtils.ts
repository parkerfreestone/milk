export type TableCase = "lowercase" | "uppercase" | "title";

export type OrderByDirection = "asc" | "desc";

export type MilkConfig = {
  dbPath?: string;
  log?: boolean;
  pluralize?: boolean;
  tableCase?: TableCase;
};

export type CommonColumnOptions = {
  autoIncrement?: boolean;
  default?: string | number | boolean;
  nullable?: boolean;
  primary?: boolean;
  unique?: boolean;
};

export type ModelMetadata = {
  tableName: string;
  instance: any;
};

export type InsertInput<T> = {
  [K in keyof T]: T[K] | (T[K] extends string ? Date : never);
};

//   Column Types
// +--------------+
export type TextOptions = CommonColumnOptions & {
  length?: number;
};

export type IntOptions = CommonColumnOptions;
export type BoolOptions = CommonColumnOptions;
export type UuidOptions = CommonColumnOptions;
export type DateOptions = CommonColumnOptions;
