# 🥛 @lactose/milk-orm

![npm](https://img.shields.io/npm/v/@lactose/milk-orm)
![Last Commit](https://img.shields.io/github/last-commit/parkerfreestone/milk)

🚩 MILK IS IS THE VERY VERY VERY EARLY STAGES I KNOW NO ONE IS READING THIS BUT PLEASE DO NOT USE

An ORM built with bun! Designed to work only with sqlite for now, and to be used only for very small lightweight projects that need a small database.

## Current Features

- Zero Config Setup
- String-based model access `insert("Task", {...})` -- intellisense on this soon LOL
- Smart field helpers `text(), uuid(), integer(), etc...`
- Declarative models using Typescript classes
- Powered by Bun and `bun:sqlite` :)

## Quick Start

```bash
bun add @lactose/milk-orm
```

`milk.config.ts` (Optional)

```typescript
import { defineMilkConfig } from "@lactose/milk-orm";

export default defineMilkConfig({
  dbPath: "milk/milk.db",
  log: true,
  pluralize: true,
  tableCase: "lowercase",
});
```

Define a Model

```typescript
import { Use } from "@lactose/milk-orm";
import { text, bool, integer } from "@lactose/milk-orm/core";

@Use()
export class Task {
  title = text(100, { unique: true });
  is_done = bool({ default: false });
  order = integer({ nullable: true });
}
```

Sync Schema

```typescript
import { sync } from "@lactose/milk-orm/runtime";

sync(); // auto-creates tables if needed
```

Insert Data

```typescript
import { insert } from "@lactose/milk-orm/core";

await insert("Task", {
  title: "Build Milk ORM",
  is_done: false,
});
```

Select Data (coming soon)

```typescript
const tasks = await select("Task", { where: { is_done: false } });
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

To run tests:

```bash
bun test
```
