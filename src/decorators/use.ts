import { registerModel } from "../core/modelRegistry";
import { loadConfig, type MilkConfig } from "../utils/loaderConfig";

export const Use = () => {
  return async (target: any) => {
    const instance = new target();

    const config = await loadConfig();
    const tableName = formatTableName(target.name, config.tableCase);

    registerModel(tableName, instance);
  };
};

const formatTableName = (
  name: string,
  tableCase: MilkConfig["tableCase"]
): string => {
  switch (tableCase) {
    case "uppercase":
      return name.toUpperCase();
    case "lowercase":
      return name.toLowerCase();
    case "title":
      return name.charAt(0).toUpperCase() + name.slice(1);
    default:
      return name.toLowerCase();
  }
};
