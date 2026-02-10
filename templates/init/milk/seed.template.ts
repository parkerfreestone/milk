import { insert, sync } from "@lactose/milk-orm";

// Sync schema with database (creates tables if they don't exist)
await sync();

// Insert some example data
await insert("Example", {
  title: "My first task",
  completed: false,
});

console.log("Seeded database!");
