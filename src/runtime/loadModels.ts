import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";

let loaded = false;

export const loadModels = async () => {
  if (loaded) return;
  loaded = true;

  const modelsDir = path.resolve("milk/models");

  if (!fs.existsSync(modelsDir)) {
    console.warn("🥛 [Milk] - No models directory found at milk/models");
    return;
  }

  const files = fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith(".ts"));

  console.log("Loading models from:", modelsDir);

  for (const file of files) {
    const fullPath = pathToFileURL(path.join(modelsDir, file)).href;
    console.log("Importing:", fullPath);
    await import(fullPath);
  }
};
