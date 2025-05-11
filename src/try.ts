// @ts-ignore
import "../milk/models/Example.ts";
import { sync } from "./db";
import { insert, select } from "./orm";

await sync();

const result = await insert("Example", { active: false });

console.log(result);

const rows = await select("Example").columns(["id", "createdAt"]);

console.log(rows);
