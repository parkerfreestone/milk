import { fileURLToPath } from "url";
import path from "path";
import fs from "fs-extra";
import { log, warn } from "../utils/log";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function init() {
  const templateRoot = path.resolve(__dirname, "../templates/init");
  const projectRoot = process.cwd();

  const rootConfigPath = path.join(templateRoot, "milk.config.ts");
  const destConfigPath = path.join(projectRoot, "milk.config.ts");

  try {
    await fs.copy(rootConfigPath, destConfigPath, {
      overwrite: false,
      errorOnExist: false,
    });
    log("Created milk.config.ts");
  } catch (err: any) {
    warn("Could not copy milk.config.ts:", err.message);
  }

  const milkDirSource = path.join(templateRoot, "milk");
  const milkDirDest = path.join(projectRoot, "milk");

  try {
    await fs.copy(milkDirSource, milkDirDest, {
      overwrite: false,
      errorOnExist: false,
    });
    log("Milk initialized!");
  } catch (err: any) {
    warn("Failed to copy milk directory:", err.message);
  }
}
