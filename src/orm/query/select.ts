import { QueryBuilder } from "./QueryBuilder";
import type { TableName, TableRecord } from "../../types/tableMap";

export const select = <T extends TableName>(
  tableName: T
): QueryBuilder<TableRecord<T>> => {
  return new QueryBuilder(tableName);
};
