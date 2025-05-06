export type CommonColumnOptions = {
  default?: string | number | boolean;
  nullable?: boolean;
  primary?: boolean;
  unique?: boolean;
};

export class Column {
  constructor(
    public type: string | undefined,
    public options: CommonColumnOptions = {}
  ) {}

  toSQL(name: string): string {
    const parts = [name, this.type];

    if (this.options.primary) parts.push("PRIMARY KEY");
    if (this.options.unique) parts.push("UNIQUE");
    if (this.options.nullable === false) parts.push("NOT NULL");
    if (this.options.default !== undefined) {
      const val =
        typeof this.options.default === "string"
          ? `'${this.options.default}'`
          : this.options.default;
      parts.push(`DEFAULT ${val}`);
    }

    return parts.filter(Boolean).join(" ");
  }
}
