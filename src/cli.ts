#!/usr/bin/env bun

import { generateTypes } from "./cli/generate-types";
import { init } from "./cli/init";
import { loadModels } from "./orm/schema/loadModels";

await loadModels();

const command = process.argv[2];

switch (command) {
  case "init":
    await init();
    break;
  case "gen-types":
    await generateTypes();
    break;
  default:
    console.log(`Unknown command: ${command}`);
    console.log("Try milk init");
}
