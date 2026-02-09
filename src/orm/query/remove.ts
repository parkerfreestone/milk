import { db } from "../../db/db";
import { getModel } from "../schema/modelRegistry";
import type { TableName } from "../../types/tableMap";
import { log } from "../../utils/log";
import { getTableName } from "../../utils/tableName";

export class DeleteBuilder<T extends TableName> {
  private filters: [string, any][] = [];
  private deleteAll = false;

  constructor(private tableName: T) {}

  where(conditions: Record<string, any>) {
    for (const [key, value] of Object.entries(conditions)) {
      this.filters.push([key, value]);
    }
    return this;
  }

  /**
   * Explicitly delete all rows. Required if no where() clause.
   */
  all() {
    this.deleteAll = true;
    return this.run();
  }

  run() {
    if (this.filters.length === 0 && !this.deleteAll) {
      throw new Error(
        "remove() requires .where() or explicit .all() to prevent accidental mass deletion"
      );
    }

    const model = getModel(this.tableName);
    if (!model) throw new Error(`Model "${this.tableName}" not found.`);

    const finalTableName = getTableName(model.tableName);

    let sql = `DELETE FROM "${finalTableName}"`;
    const values: any[] = [];

    if (this.filters.length > 0) {
      const whereClauses = this.filters
        .map(([key]) => `"${key}" = ?`)
        .join(" AND ");
      sql += ` WHERE ${whereClauses}`;
      values.push(...this.filters.map(([, value]) => value));
    }

    log(`DELETE FROM ${finalTableName}`, values);
    const result = db.query(sql).run(...(values as any[]));

    return { changes: result.changes };
  }
}

export const remove = <T extends TableName>(tableName: T) => {
  return new DeleteBuilder(tableName);
};
