import { bool, text } from "./core";
import { Use } from "./decorators/use";
import { insert } from "./runtime/insert";
import { select } from "./runtime/select";
import { sync } from "./runtime/sync";

@Use()
class Test {
  title = text();
  is_real_table = bool({ default: false });
}

sync();

// insert("Test", { title: "Test" });

const test = await select("Test");

console.log(test);
