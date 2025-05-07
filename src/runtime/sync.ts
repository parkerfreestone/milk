import { Database } from "bun:sqlite";
import { getModels, getSchema } from "../core/modelRegistry";
import { loadConfig } from "../utils/loaderConfig";
import fs from "fs";

let db: Database;

export const sync = async () => {
  const config = await loadConfig();

  const dbDir = config.dbPath.split("/").slice(0, -1).join("/");
  if (dbDir && !fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.dbPath);

  for (const [rawName, instance] of getModels()) {
    const tableName = config.pluralize ? rawName + "s" : rawName;
    const schema = getSchema(instance);

    const columns = Object.entries(schema).map(([name, col]) =>
      col.toSQL(name)
    );

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(
      ", "
    )})`;

    if (config.log) console.log(`🥛 [milk] - ${sql}`);
    db.exec(sql);
  }

  return db;
};
