import { Use } from "./decorators/use";
import { bool, integer, text } from "./core";
import { sync } from "./runtime/sync";
import { insert } from "./core/insert";

@Use()
class Task {
  title = text(100, { unique: true });
  is_done = bool({ default: false });
  order = integer({ nullable: true });
}

sync();

insert("Task", { title: "Ship Milk ORM", is_done: false, order: 1 });
