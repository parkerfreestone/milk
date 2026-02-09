import { fileURLToPath } from "url";
import path from "path";
import fs from "fs-extra";
import { log, warn } from "../utils/log";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function init() {
  // After bundling, cli.js is at build/cli.js, so we go up one level to repo root
  const templateRoot = path.resolve(__dirname, "../templates/init");
  const projectRoot = process.cwd();

  const configSrc = path.join(templateRoot, "milk.config.template.ts");
  const configDest = path.join(projectRoot, "milk.config.ts");

  try {
    await fs.copy(configSrc, configDest, {
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
    await fs.ensureDir(milkDirDest);

    const entries = await fs.readdir(milkDirSource, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(milkDirSource, entry.name);
      const destPath = path.join(
        milkDirDest,
        entry.name.replace(".template.ts", ".ts")
      );

      if (entry.isFile()) {
        if (entry.name.endsWith(".template.ts")) {
          await fs.copy(srcPath, destPath, {
            overwrite: false,
            errorOnExist: false,
          });
          log(`Created ${path.relative(projectRoot, destPath)}`);
        } else {
          await fs.copy(srcPath, path.join(milkDirDest, entry.name), {
            overwrite: false,
            errorOnExist: false,
          });
        }
      } else if (entry.isDirectory()) {
        await fs.copy(srcPath, path.join(milkDirDest, entry.name), {
          overwrite: false,
          errorOnExist: false,
        });
      }
    }
    log("Milk successfully initialized!");
  } catch (err: any) {
    warn("Failed to copy milk directory:", err.message);
  }
}
