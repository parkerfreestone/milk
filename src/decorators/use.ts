import { type MilkConfig } from "../utils/loadConfig";
import { registerModel } from "../core/modelRegistry";
import { config } from "../runtime/config";

export const Use = () => {
  return (target: any) => {
    const instance = new target();
    const className = target.name;
    const tableName = formatTableName(target.name, config.tableCase);

    registerModel(className, instance, tableName);
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
