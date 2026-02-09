import { config } from "../db/config";

/**
 * Gets the final table name with casing and pluralization applied.
 * This should be used everywhere we reference a table name in SQL.
 */
export const getTableName = (tableName: string): string => {
  return config.pluralize ? tableName + "s" : tableName;
};
