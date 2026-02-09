#!/usr/bin/env bun

import { loadModels } from "./orm/schema/loadModels";
import { generateTypes } from "./cli/generate-types";
import { log } from "./utils/log";
import { init } from "./cli/init";
import { sync } from "./cli/sync";

const command = process.argv[2];

switch (command) {
  case "init":
    await init();
    break;
  case "sync":
    await loadModels();
    await sync();
    break;
  case "gen-types":
    await loadModels();
    await generateTypes();
    break;
  default:
    log(`Unknown command: ${command}`);
    log("Available commands: init, sync, gen-types");
}
