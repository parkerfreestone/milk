import { db } from "../../db/db";
import type { TableName, TableRecord } from "../../types/tableMap";
import { log } from "../../utils/log";
import { getTableName } from "../../utils/tableName";
import { getModel, getSchema } from "../schema/modelRegistry";

export class UpdateBuilder<T extends TableName> {
  private setData: Partial<TableRecord<T>> | null = null;
  private filters: [string, any][] = [];
  private updateAll = false;

  constructor(private tableName: T) {}

  set(data: Partial<TableRecord<T>>) {
    this.setData = data;
    return this;
  }

  where(conditions: Record<string, any>) {
    for (const [key, value] of Object.entries(conditions)) {
      this.filters.push([key, value]);
    }
    return this;
  }

  /**
   * Explicitly update all rows. Required if no where() clause.
   */
  all() {
    this.updateAll = true;
    return this.run();
  }

  run() {
    if (!this.setData || Object.keys(this.setData).length === 0) {
      throw new Error("update() requires .set() with at least one field");
    }

    if (this.filters.length === 0 && !this.updateAll) {
      throw new Error(
        "update() requires .where() or explicit .all() to prevent accidental mass updates",
      );
    }

    const model = getModel(this.tableName);
    if (!model) throw new Error(`Model "${this.tableName}" not found.`);

    const schema = getSchema(model.instance);
    const finalTableName = getTableName(model.tableName);

    // Build SET clause
    const setEntries = Object.entries(this.setData).filter(([key]) => {
      const col = schema[key];
      // Don't allow updating auto-increment primary keys
      return !(col?.options.autoIncrement && col?.options.primary);
    });

    const setClauses = setEntries.map(([key]) => `"${key}" = ?`).join(", ");
    const setValues = setEntries.map(([, value]) =>
      value instanceof Date ? value.toISOString() : value,
    );

    // Build WHERE clause
    let sql = `UPDATE "${finalTableName}" SET ${setClauses}`;
    const whereValues: any[] = [];

    if (this.filters.length > 0) {
      const whereClauses = this.filters
        .map(([key]) => `"${key}" = ?`)
        .join(" AND ");
      sql += ` WHERE ${whereClauses}`;
      whereValues.push(...this.filters.map(([, value]) => value));
    }

    const allValues = [...setValues, ...whereValues];

    log(`UPDATE ${finalTableName}`, allValues);
    const result = db.query(sql).run(...(allValues as any[]));

    return { changes: result.changes };
  }
}

export const update = <T extends TableName>(tableName: T) => {
  return new UpdateBuilder(tableName);
};
