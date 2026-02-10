import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { log, warn } from "../../utils/log";

let loaded = false;

export const loadModels = async () => {
  if (loaded) return;
  loaded = true;

  const modelsDir = path.join(process.cwd(), "milk/models");

  if (!fs.existsSync(modelsDir)) {
    warn("No models directory found at milk/models");
    return;
  }

  const files = fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith(".ts"));

  for (const file of files) {
    const fullPath = path.join(modelsDir, file);
    const url = pathToFileURL(fullPath).href;

    try {
      log("Importing model file:", fullPath);
      await import(url);
    } catch (err: any) {
      warn(`Failed to import model: ${err.message}`);
    }
  }
};
