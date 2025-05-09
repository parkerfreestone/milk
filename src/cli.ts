#!/usr/bin/env bun

// WOWEEWOW THIS IS BAD WE NEED TO REVISIT
import { init } from "./cli/init";

const command = process.argv[2];

switch (command) {
  case "init":
    await init();
    break;
  default:
    console.log("Unknown command: ${command}");
    console.log("Try milk init");
}
