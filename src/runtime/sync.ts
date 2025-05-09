import { getAllModels, getSchema } from "../core/modelRegistry";
import { config } from "./config";
import { db } from "./db";

export const sync = async () => {
  for (const [, meta] of getAllModels()) {
    const { instance, tableName } = meta;
    const schema = getSchema(instance);

    const columns = Object.entries(schema).map(([name, col]) =>
      col.toSQL(name)
    );

    const finalTableName = config.pluralize ? tableName + "s" : tableName;

    const sql = `CREATE TABLE IF NOT EXISTS ${finalTableName} (${columns.join(
      ", "
    )})`;

    if (config.log) console.log(`🥛 [milk] - ${sql}`);
    db.exec(sql);
  }

  return db;
};
