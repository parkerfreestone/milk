import { QueryBuilder } from "../core/QueryBuilder";

export const select = (tableName: string) => {
  return new QueryBuilder(tableName);
};
