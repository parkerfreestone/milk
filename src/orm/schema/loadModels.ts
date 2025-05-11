import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { warn } from "../../utils/log";

let loaded = false;

export const loadModels = async () => {
  if (loaded) return;
  loaded = true;

  const modelsDir = path.resolve("milk/models");

  if (!fs.existsSync(modelsDir)) {
    warn("No models directory found at milk/models");
    return;
  }

  const files = fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith(".ts"));

  for (const file of files) {
    const fullPath = pathToFileURL(path.join(modelsDir, file)).href;
    await import(fullPath);
  }
};
