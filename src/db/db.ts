import Database from "bun:sqlite";
import fs from "fs";
import { config } from "./config";

const dbDir = config.dbPath && config.dbPath.split("/").slice(0, -1).join("/");
if (dbDir && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(config.dbPath);
