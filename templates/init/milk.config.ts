import { defineMilkConfig } from "@lactose/milk-orm";

// Pluralize currently just add's an S to your table so using sparingly
export default defineMilkConfig({
  dbPath: "milk/milk.db",
  log: true,
  pluralize: false,
  tableCase: "title",
});
