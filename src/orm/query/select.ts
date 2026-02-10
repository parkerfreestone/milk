import type { TableName, TableRecord } from "../../types/tableMap";
import { QueryBuilder } from "./QueryBuilder";

export const select = <T extends TableName>(
  tableName: T,
): QueryBuilder<TableRecord<T>> => {
  return new QueryBuilder(tableName);
};
