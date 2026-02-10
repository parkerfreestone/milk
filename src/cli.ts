#!/usr/bin/env bun

import { generateTypes } from "./cli/generate-types";
import { init } from "./cli/init";
import { migrateGenerate } from "./cli/migrate-generate";
import { migrateRollback } from "./cli/migrate-rollback";
import { migrateRun } from "./cli/migrate-run";
import { migrateStatus } from "./cli/migrate-status";
import { sync } from "./cli/sync";
import { loadModels } from "./orm/schema/loadModels";
import { log } from "./utils/log";

const command = process.argv[2];
const args = process.argv.slice(3);

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
  case "migrate:generate":
    await loadModels();
    await migrateGenerate();
    break;
  case "migrate:run":
    await migrateRun();
    break;
  case "migrate:rollback":
    const steps = args[0] ? parseInt(args[0], 10) : 1;
    await migrateRollback(steps);
    break;
  case "migrate:status":
    await migrateStatus();
    break;
  default:
    log(`Unknown command: ${command}`);
    log(
      "Available commands: init, sync, gen-types, migrate:generate, migrate:run, migrate:rollback, migrate:status",
    );
}
