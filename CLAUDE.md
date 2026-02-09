# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Milk ORM is a lightweight, Bun-based ORM for SQLite. It uses decorator-based model registration and provides type-safe query operations. Currently in early preview (v0.2.6).

## Build & Test Commands

```bash
bun install           # Install dependencies
bun run build         # Build bun bundle + TypeScript declarations
bun test              # Run test suite
```

CLI commands (after build):
```bash
bunx @lactose/milk-orm init       # Generate boilerplate project
bunx @lactose/milk-orm sync       # Sync schema with database, generate types
bunx @lactose/milk-orm gen-types  # Generate milk.d.ts type definitions
```

## Architecture

### Core Modules

**ORM Layer (`/src/orm/`)**
- `schema/use.ts` - `@Use()` decorator that registers models
- `schema/Column.ts` - Column class with SQL generation
- `schema/columnHelpers.ts` - Factory functions: `text()`, `integer()`, `bool()`, `uuid()`, `date()`, `timestamped()`, `identifier()`
- `schema/modelRegistry.ts` - Central registry for all models
- `schema/loadModels.ts` - Dynamic model loader that scans `milk/models/`
- `query/QueryBuilder.ts` - SELECT query builder with chainable methods
- `query/insert.ts` - Type-safe INSERT operations

**Database Layer (`/src/db/`)**
- `db.ts` - Singleton SQLite database instance (uses `bun:sqlite`)
- `config.ts` - Config loader (merges `milk.config.ts` with defaults)
- `sync.ts` - Schema synchronization (creates tables)

**CLI (`/src/cli/`)**
- `init.ts` - Project initialization (copies from `/templates/init/`)
- `sync.ts` - Orchestrates model loading, schema sync, type generation
- `generate-types.ts` - Generates `milk.d.ts` from registered models

### Entry Points

- `src/index.ts` - Library exports
- `src/cli.ts` - CLI entry point (shebang script, maps to `milk` binary)

### Key Patterns

Model definition uses decorators and column factory functions:
```typescript
@Use()
export class Task {
  title = text(100, { unique: true });
  is_done = bool({ default: false });
  order = integer({ nullable: true });
}
```

Query chaining:
```typescript
select("Task").where({ is_done: false }).orderBy("order", "asc").limit(10).all();
```

### Configuration

Default config in `src/utils/defaultMilkConfig.ts`:
- `dbPath: "milk/milk.db"`
- `log: true` (logging with milk emoji prefix)
- `pluralize: false`
- `tableCase: "title"` (options: lowercase, uppercase, title)

## Important Implementation Notes

- Always call `loadModels()` before accessing models in CLI commands
- `milk.d.ts` must be regenerated after schema changes via `sync` command
- Uses prepared statements with `?` placeholders for SQL injection safety
- SQLite BOOLEAN stored as INTEGER (0/1)
- Requires `experimentalDecorators` and `emitDecoratorMetadata` in tsconfig.json
- Date objects automatically converted to ISO strings on insert

## Roadmap

Not yet implemented: `update()`, `remove()`, migrations, schema-aware validation.
