import { getAllModels, getSchema } from "../orm/schema/modelRegistry";
import { log } from "../utils/log";
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

    if (config.log) log(`${sql}`);
    db.exec(sql);
  }

  return db;
};
