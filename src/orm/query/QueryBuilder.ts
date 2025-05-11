import { db } from "../../db/db";
import type { OrderByDirection } from "../../typeUtils";

export class QueryBuilder<T = any> {
  private filters: [string, any][] = [];
  private orderClause: string | null = null;
  private limitCount?: number;
  private offsetCount?: number;

  constructor(private tableName: string) {}

  filter(field: string, value: any) {
    this.filters.push([field, value]);
    return this;
  }

  private buildSql(): [string, any[]] {
    let sql = `SELECT * FROM ${this.tableName}`;
    const values: any[] = [];

    if (this.filters.length > 0) {
      const clauses = this.filters.map(([key]) => `"${key}" = ?`).join(" AND ");
      sql += ` WHERE ${clauses}`;
      values.push(...this.filters.map(([_, value]) => value));
    }

    if (this.orderClause) {
      sql += ` ${this.orderClause}`;
    }

    if (this.limitCount !== undefined) {
      sql += ` LIMIT ${this.limitCount}`;
    }

    if (this.offsetCount !== undefined) {
      sql += ` OFFSET ${this.offsetCount}`;
    }

    return [sql, values];
  }

  async where(conditions: Record<string, any>) {
    for (const [key, value] of Object.entries(conditions)) {
      this.filter(key, value);
    }
    return this;
  }

  orderBy(field: string, direction: OrderByDirection = "asc") {
    this.orderClause = `ORDER BY "${field}" ${direction.toUpperCase()}`;
    return this;
  }

  async all() {
    const [sql, values] = this.buildSql();
    console.info(`[MILK] - ${sql}`, values);
    return db.query(sql).all(...values);
  }

  async first() {
    const [sql, values] = this.buildSql();
    return db.query(sql + " LIMIT 1").get(...values);
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  offset(n: number) {
    this.offsetCount = n;
    return this;
  }

  then(resolve: (value: any) => void, reject?: (reason?: any) => void) {
    try {
      return this.all().then(resolve, reject);
    } catch (err) {
      return Promise.reject(err).then(resolve, reject);
    }
  }
}
