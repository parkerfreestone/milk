import { bool, integer, text } from "./core";
import { Use } from "./decorators/use";
import { sync } from "./runtime/sync";

@Use()
class Task {
  title = text(100, { unique: true });
  is_done = bool({ default: false });
  order = integer({ nullable: true });
}

sync();
