/// <reference path="../../milk.d.ts" />

import type { TableMap } from "../../milk";

export type TableName = keyof TableMap;
export type TableRecord<T extends TableName> = TableMap[T];
