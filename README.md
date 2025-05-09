# 🥛 @lactose/milk-orm

Milk is an ORM built with bun! It aim's to be very lightweight, and simple... It’s designed for small projects, quick dev tools, and anyone who needs a quick schema def.

> 🚩 **Early Preview**
> Milk is very, very early in development. Expect bugs and lots of missing features. Still - you're welcome to try it and help it grow! :)

![npm](https://img.shields.io/npm/v/@lactose/milk-orm)
![CI Status](https://img.shields.io/github/actions/workflow/status/parkerfreestone/milk/ci.yml)
![Last Commit](https://img.shields.io/github/last-commit/parkerfreestone/milk)

## Quick Start

### Install Milk

```bash
bun add @lactose/milk-orm
```

### Init project

```bash
bunx @lactose/milk-orm init
```

which will create:

```
milk.config.ts
milk/
├─ milk.db
├─ models/
│  └─ Example.ts
├─ seed.ts
```

Define a Model

```typescript
import { Use } from "@lactose/milk-orm";
import { text, bool, integer, timestamped } from "@lactose/milk-orm/core";

@Use()
export class Task {
  title = text(100, { unique: true });
  is_done = bool({ default: false });
  order = integer({ nullable: true });
  createdAt = timestamped();
}
```

Sync Schema

```typescript
import { sync } from "@lactose/milk-orm";

await sync(); // Creates tables if they don't exist
```

Insert Data

```typescript
import { insert } from "@lactose/milk-orm";

await insert("Task", {
  title: "Ship Milk ORM",
  is_done: false,
});
```

Select Data

```typescript
import { select } from "@lactose/milk-orm/runtime";

const openTasks = await select("Task").where({ is_done: false }).all();
```

## Roadmap

- `update()` and `remove()`
- `@Use()` to support custom plugins ex. `@Use(Timestamped, UUIDPrimaryKey)`
- Schema-aware validation
- Migrations (hopefully at some point)
- Type-safe `select()` and `insert()` and autocompletion

## License

MIT - feel free to use, fork, do as you please :)

## Contributing

HELLO, SO GLAD YOU'RE HERE 💖 -- I am not great at programming so feel free to suggest a full rework of anything.

### Local Setup

Open a PR!! Suggest a feature, my discord is `MrGandolfio` 🍥

```bash
git clone git@github.com:parkerfreestone/milk-orm.git
cd milk-orm
bun install

# Make sure build runs
bun run build

# Run tests
bun test
```
