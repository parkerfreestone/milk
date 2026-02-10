import { db } from "../../db/db";
import type { OrderByDirection } from "../../typeUtils";
import { info } from "../../utils/log";
import { getTableName } from "../../utils/tableName";
import { getModel, getRelations } from "../schema/modelRegistry";
import type { Relation } from "../schema/Relation";

type Operator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "LIKE" | "IN" | "NOT IN";

type Filter = {
  field: string;
  operator: Operator;
  value: any;
  connector: "AND" | "OR";
};

export class QueryBuilder<T extends Record<string, any> = any> {
  private filters: Filter[] = [];
  private orderClause: string | null = null;
  private limitCount?: number;
  private offsetCount?: number;
  private selectedFields?: (keyof T)[] | null = null;
  private withRelations: string[] = [];

  constructor(private tableName: string) {}

  private addFilter(
    field: string,
    operator: Operator,
    value: any,
    connector: "AND" | "OR" = "AND",
  ) {
    this.filters.push({ field, operator, value, connector });
    return this;
  }

  private buildSql(): [string, any[]] {
    const fields =
      this.selectedFields?.map((field) => `"${String(field)}"`).join(", ") ||
      "*";
    const finalTableName = getTableName(this.tableName);
    let sql = `SELECT ${fields} FROM "${finalTableName}"`;
    const values: any[] = [];

    if (this.filters.length > 0) {
      sql += " WHERE ";

      const clauses = this.filters.map((filter, index) => {
        const prefix = index === 0 ? "" : ` ${filter.connector} `;
        let clause: string;

        if (filter.operator === "IN" || filter.operator === "NOT IN") {
          const arr = filter.value as any[];
          const placeholders = arr.map(() => "?").join(", ");
          clause = `"${filter.field}" ${filter.operator} (${placeholders})`;
          values.push(...arr);
        } else if (filter.value === null) {
          // Handle NULL comparisons with IS NULL / IS NOT NULL
          clause =
            filter.operator === "="
              ? `"${filter.field}" IS NULL`
              : `"${filter.field}" IS NOT NULL`;
        } else {
          clause = `"${filter.field}" ${filter.operator} ?`;
          values.push(filter.value);
        }

        return prefix + clause;
      });

      sql += clauses.join("");
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

  /**
   * Add WHERE conditions (equality). Multiple calls are ANDed together.
   * @example .where({ status: "active", role: "admin" })
   */
  where(conditions: Record<string, any>): this;
  /**
   * Add WHERE condition with operator.
   * @example .where("age", ">", 18)
   */
  where(field: string, operator: Operator, value: any): this;
  where(
    fieldOrConditions: string | Record<string, any>,
    operator?: Operator,
    value?: any,
  ): this {
    if (typeof fieldOrConditions === "string") {
      return this.addFilter(fieldOrConditions, operator!, value, "AND");
    }
    for (const [key, val] of Object.entries(fieldOrConditions)) {
      this.addFilter(key, "=", val, "AND");
    }
    return this;
  }

  /**
   * Add OR WHERE conditions (equality).
   * @example .where({ status: "active" }).orWhere({ status: "pending" })
   */
  orWhere(conditions: Record<string, any>): this;
  /**
   * Add OR WHERE condition with operator.
   * @example .where("role", "=", "user").orWhere("role", "=", "admin")
   */
  orWhere(field: string, operator: Operator, value: any): this;
  orWhere(
    fieldOrConditions: string | Record<string, any>,
    operator?: Operator,
    value?: any,
  ): this {
    if (typeof fieldOrConditions === "string") {
      return this.addFilter(fieldOrConditions, operator!, value, "OR");
    }
    for (const [key, val] of Object.entries(fieldOrConditions)) {
      this.addFilter(key, "=", val, "OR");
    }
    return this;
  }

  /**
   * Add WHERE field IN (values) condition.
   * @example .whereIn("status", ["active", "pending"])
   */
  whereIn(field: string, values: any[]) {
    return this.addFilter(field, "IN", values, "AND");
  }

  /**
   * Add WHERE field NOT IN (values) condition.
   * @example .whereNotIn("status", ["deleted", "banned"])
   */
  whereNotIn(field: string, values: any[]) {
    return this.addFilter(field, "NOT IN", values, "AND");
  }

  /**
   * Add WHERE field LIKE pattern condition.
   * @example .whereLike("name", "%john%")
   */
  whereLike(field: string, pattern: string) {
    return this.addFilter(field, "LIKE", pattern, "AND");
  }

  /**
   * Add WHERE field != value condition.
   * @example .whereNot("status", "deleted")
   */
  whereNot(field: string, value: any) {
    return this.addFilter(field, "!=", value, "AND");
  }

  /**
   * Add WHERE field > value condition.
   * @example .whereGt("age", 18)
   */
  whereGt(field: string, value: any) {
    return this.addFilter(field, ">", value, "AND");
  }

  /**
   * Add WHERE field >= value condition.
   * @example .whereGte("age", 18)
   */
  whereGte(field: string, value: any) {
    return this.addFilter(field, ">=", value, "AND");
  }

  /**
   * Add WHERE field < value condition.
   * @example .whereLt("age", 65)
   */
  whereLt(field: string, value: any) {
    return this.addFilter(field, "<", value, "AND");
  }

  /**
   * Add WHERE field <= value condition.
   * @example .whereLte("age", 65)
   */
  whereLte(field: string, value: any) {
    return this.addFilter(field, "<=", value, "AND");
  }

  /**
   * Add WHERE field IS NULL condition.
   * @example .whereNull("deletedAt")
   */
  whereNull(field: string) {
    // Special case: NULL comparisons don't use placeholders
    this.filters.push({
      field,
      operator: "=" as Operator, // Will be handled specially
      value: null,
      connector: "AND",
    });
    return this;
  }

  /**
   * Add WHERE field IS NOT NULL condition.
   * @example .whereNotNull("email")
   */
  whereNotNull(field: string) {
    this.filters.push({
      field,
      operator: "!=" as Operator, // Will be handled specially
      value: null,
      connector: "AND",
    });
    return this;
  }

  orderBy(field: string, direction: OrderByDirection = "asc") {
    this.orderClause = `ORDER BY "${field}" ${direction.toUpperCase()}`;
    return this;
  }

  /**
   * Eager load specified relations.
   * @example select("User").with("posts").all()
   * @example select("Post").with("author", "comments").all()
   */
  with(...relations: string[]) {
    this.withRelations.push(...relations);
    return this;
  }

  async all() {
    const [sql, values] = this.buildSql();
    info(`[MILK] - ${sql}`, values);
    const rows = db.query(sql).all(...values) as any[];

    if (this.withRelations.length > 0 && rows.length > 0) {
      return this.loadRelations(rows);
    }

    return rows;
  }

  async first() {
    if (this.limitCount === undefined) {
      this.limitCount = 1;
    }
    const [sql, values] = this.buildSql();
    const row = db.query(sql).get(...values) as any;

    if (this.withRelations.length > 0 && row) {
      const [withRelations] = await this.loadRelations([row]);
      return withRelations;
    }

    return row;
  }

  private async loadRelations(rows: any[]): Promise<any[]> {
    const model = getModel(this.tableName);
    if (!model) return rows;

    const relations = getRelations(model.instance);

    for (const relationName of this.withRelations) {
      const relation = relations[relationName];
      if (!relation) {
        throw new Error(
          `Relation "${relationName}" not found on model "${this.tableName}"`,
        );
      }

      await this.loadRelation(rows, relationName, relation);
    }

    return rows;
  }

  private async loadRelation(
    rows: any[],
    relationName: string,
    relation: Relation,
  ): Promise<void> {
    const targetClass = relation.getTarget();
    const targetModelName = targetClass.name;
    const targetModel = getModel(targetModelName);

    if (!targetModel) {
      throw new Error(`Target model "${targetModelName}" not registered`);
    }

    const targetTableName = getTableName(targetModel.tableName);

    switch (relation.type) {
      case "belongsTo":
        await this.loadBelongsTo(rows, relationName, relation, targetTableName);
        break;
      case "hasMany":
        await this.loadHasMany(rows, relationName, relation, targetTableName);
        break;
      case "hasOne":
        await this.loadHasOne(rows, relationName, relation, targetTableName);
        break;
    }
  }

  private async loadBelongsTo(
    rows: any[],
    relationName: string,
    relation: Relation,
    targetTableName: string,
  ): Promise<void> {
    // Foreign key is on this model
    const targetClass = relation.getTarget();
    const foreignKey =
      relation.foreignKey ||
      targetClass.name.charAt(0).toLowerCase() +
        targetClass.name.slice(1) +
        "Id";
    const localKey = relation.localKey;

    // Collect unique foreign key values
    const fkValues = [
      ...new Set(rows.map((r) => r[foreignKey]).filter(Boolean)),
    ];
    if (fkValues.length === 0) {
      rows.forEach((r) => (r[relationName] = null));
      return;
    }

    // Query related records
    const placeholders = fkValues.map(() => "?").join(", ");
    const sql = `SELECT * FROM "${targetTableName}" WHERE "${localKey}" IN (${placeholders})`;
    info(`[MILK] - ${sql}`, fkValues);
    const related = db.query(sql).all(...fkValues) as any[];

    // Map by primary key
    const relatedMap = new Map<any, any>();
    related.forEach((r) => relatedMap.set(r[localKey], r));

    // Attach to rows
    rows.forEach((r) => {
      r[relationName] = relatedMap.get(r[foreignKey]) || null;
    });
  }

  private async loadHasMany(
    rows: any[],
    relationName: string,
    relation: Relation,
    targetTableName: string,
  ): Promise<void> {
    // Foreign key is on target model
    const foreignKey =
      relation.foreignKey ||
      this.tableName.charAt(0).toLowerCase() + this.tableName.slice(1) + "Id";
    const localKey = relation.localKey;

    // Collect unique local key values
    const pkValues = [...new Set(rows.map((r) => r[localKey]).filter(Boolean))];
    if (pkValues.length === 0) {
      rows.forEach((r) => (r[relationName] = []));
      return;
    }

    // Query related records
    const placeholders = pkValues.map(() => "?").join(", ");
    const sql = `SELECT * FROM "${targetTableName}" WHERE "${foreignKey}" IN (${placeholders})`;
    info(`[MILK] - ${sql}`, pkValues);
    const related = db.query(sql).all(...pkValues) as any[];

    // Group by foreign key
    const relatedMap = new Map<any, any[]>();
    related.forEach((r) => {
      const fk = r[foreignKey];
      if (!relatedMap.has(fk)) relatedMap.set(fk, []);
      relatedMap.get(fk)!.push(r);
    });

    // Attach to rows
    rows.forEach((r) => {
      r[relationName] = relatedMap.get(r[localKey]) || [];
    });
  }

  private async loadHasOne(
    rows: any[],
    relationName: string,
    relation: Relation,
    targetTableName: string,
  ): Promise<void> {
    // Foreign key is on target model (like hasMany but returns single)
    const foreignKey =
      relation.foreignKey ||
      this.tableName.charAt(0).toLowerCase() + this.tableName.slice(1) + "Id";
    const localKey = relation.localKey;

    // Collect unique local key values
    const pkValues = [...new Set(rows.map((r) => r[localKey]).filter(Boolean))];
    if (pkValues.length === 0) {
      rows.forEach((r) => (r[relationName] = null));
      return;
    }

    // Query related records
    const placeholders = pkValues.map(() => "?").join(", ");
    const sql = `SELECT * FROM "${targetTableName}" WHERE "${foreignKey}" IN (${placeholders})`;
    info(`[MILK] - ${sql}`, pkValues);
    const related = db.query(sql).all(...pkValues) as any[];

    // Map by foreign key (first match)
    const relatedMap = new Map<any, any>();
    related.forEach((r) => {
      const fk = r[foreignKey];
      if (!relatedMap.has(fk)) relatedMap.set(fk, r);
    });

    // Attach to rows
    rows.forEach((r) => {
      r[relationName] = relatedMap.get(r[localKey]) || null;
    });
  }

  /**
   * Get count of matching rows.
   * @example const count = await select("Task").where({ done: false }).count();
   */
  async count(): Promise<number> {
    const finalTableName = getTableName(this.tableName);
    let sql = `SELECT COUNT(*) as count FROM "${finalTableName}"`;
    const values: any[] = [];

    if (this.filters.length > 0) {
      sql += " WHERE ";

      const clauses = this.filters.map((filter, index) => {
        const prefix = index === 0 ? "" : ` ${filter.connector} `;
        let clause: string;

        if (filter.operator === "IN" || filter.operator === "NOT IN") {
          const arr = filter.value as any[];
          const placeholders = arr.map(() => "?").join(", ");
          clause = `"${filter.field}" ${filter.operator} (${placeholders})`;
          values.push(...arr);
        } else if (filter.value === null) {
          clause =
            filter.operator === "="
              ? `"${filter.field}" IS NULL`
              : `"${filter.field}" IS NOT NULL`;
        } else {
          clause = `"${filter.field}" ${filter.operator} ?`;
          values.push(filter.value);
        }

        return prefix + clause;
      });

      sql += clauses.join("");
    }

    const result = db.query(sql).get(...values) as { count: number };
    return result.count;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  offset(n: number) {
    this.offsetCount = n;
    return this;
  }

  columns<K extends keyof T>(fields: K[]) {
    this.selectedFields = fields;
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
