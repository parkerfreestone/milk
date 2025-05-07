import { defineMilkConfig } from "./src/utils/defineMilkConfig";

export default defineMilkConfig({
  dbPath: "milk/milk.db",
  log: true,
  pluralize: false,
  tableCase: "title",
});
