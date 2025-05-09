import path from "path";
import fs from "fs-extra";

export const init = async () => {
  const templateRoot = path.resolve(__dirname, "../../templates/init");
  const projectRoot = process.cwd();

  const rootConfigPath = path.join(templateRoot, "milk.config.ts");
  const destConfigPath = path.join(projectRoot, "milk.config.ts");

  if (!fs.existsSync(destConfigPath)) {
    await fs.copyFile(rootConfigPath, destConfigPath);
    console.log("📦 Created milk.config.ts");
  }

  const milkDirSource = path.join(templateRoot, "milk");
  const milkDirDest = path.join(projectRoot, "milk");

  await fs.copy(milkDirSource, milkDirDest, {
    overwrite: false,
    errorOnExist: false,
  });

  console.log("🥛 Milk initialized!");
};

init();
