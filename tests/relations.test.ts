import { beforeAll, describe, expect, test } from "bun:test";
import { db } from "../src/db/db";
import { sync } from "../src/db/sync";
import {
  belongsTo,
  hasMany,
  hasOne,
  identifier,
  integer,
  select,
  text,
  Use,
} from "../src/orm";

// Define test models with relations

@Use()
class Author {
  id = identifier();
  name = text(100);
  posts = hasMany(() => Post);
  profile = hasOne(() => AuthorProfile);
}

@Use()
class Post {
  id = identifier();
  title = text(200);
  authorId = integer();
  author = belongsTo(() => Author, "authorId");
  comments = hasMany(() => Comment);
}

@Use()
class Comment {
  id = identifier();
  body = text(500);
  postId = integer();
  post = belongsTo(() => Post, "postId");
}

@Use()
class AuthorProfile {
  id = identifier();
  bio = text(500);
  authorId = integer();
  author = belongsTo(() => Author, "authorId");
}

let aliceId: number;
let bobId: number;
let charlieId: number;
let post1Id: number;
let post2Id: number;
let post3Id: number;

beforeAll(() => {
  sync();

  // Drop and recreate tables to reset autoincrement
  db.run(`DROP TABLE IF EXISTS "Comment"`);
  db.run(`DROP TABLE IF EXISTS "AuthorProfile"`);
  db.run(`DROP TABLE IF EXISTS "Post"`);
  db.run(`DROP TABLE IF EXISTS "Author"`);

  db.run(`CREATE TABLE "Author" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" VARCHAR(100))`);
  db.run(`CREATE TABLE "Post" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "title" VARCHAR(200), "authorId" INTEGER)`);
  db.run(`CREATE TABLE "Comment" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "body" VARCHAR(500), "postId" INTEGER)`);
  db.run(`CREATE TABLE "AuthorProfile" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "bio" VARCHAR(500), "authorId" INTEGER)`);

  // Insert test data and capture IDs
  aliceId = Number(db.run(`INSERT INTO "Author" ("name") VALUES (?)`, ["Alice"]).lastInsertRowid);
  bobId = Number(db.run(`INSERT INTO "Author" ("name") VALUES (?)`, ["Bob"]).lastInsertRowid);
  charlieId = Number(db.run(`INSERT INTO "Author" ("name") VALUES (?)`, ["Charlie"]).lastInsertRowid);

  post1Id = Number(db.run(`INSERT INTO "Post" ("title", "authorId") VALUES (?, ?)`, ["Alice Post 1", aliceId]).lastInsertRowid);
  post2Id = Number(db.run(`INSERT INTO "Post" ("title", "authorId") VALUES (?, ?)`, ["Alice Post 2", aliceId]).lastInsertRowid);
  post3Id = Number(db.run(`INSERT INTO "Post" ("title", "authorId") VALUES (?, ?)`, ["Bob Post 1", bobId]).lastInsertRowid);

  db.run(`INSERT INTO "Comment" ("body", "postId") VALUES (?, ?)`, ["Great post!", post1Id]);
  db.run(`INSERT INTO "Comment" ("body", "postId") VALUES (?, ?)`, ["Thanks!", post1Id]);
  db.run(`INSERT INTO "Comment" ("body", "postId") VALUES (?, ?)`, ["Nice work", post2Id]);

  db.run(`INSERT INTO "AuthorProfile" ("bio", "authorId") VALUES (?, ?)`, ["Alice is a writer", aliceId]);
  db.run(`INSERT INTO "AuthorProfile" ("bio", "authorId") VALUES (?, ?)`, ["Bob is a developer", bobId]);
});

describe("belongsTo relation", () => {
  test("loads single related record", async () => {
    const posts: any[] = await select("Post" as any)
      .with("author")
      .all();

    expect(posts.length).toBe(3);
    expect(posts[0].author).toBeDefined();
    expect(posts[0].author.name).toBe("Alice");
    expect(posts[2].author.name).toBe("Bob");
  });

  test("returns null when no related record exists", async () => {
    // Insert a post with no author
    db.run(`INSERT INTO "Post" ("title", "authorId") VALUES (?, ?)`, [
      "Orphan Post",
      999,
    ]);

    const posts: any[] = await select("Post" as any)
      .where({ title: "Orphan Post" })
      .with("author")
      .all();

    expect(posts.length).toBe(1);
    expect(posts[0].author).toBeNull();

    // Cleanup
    db.run(`DELETE FROM "Post" WHERE "title" = ?`, ["Orphan Post"]);
  });

  test("works with first()", async () => {
    const post: any = await select("Post" as any)
      .where({ id: post1Id })
      .with("author")
      .first();

    expect(post).toBeDefined();
    expect(post.author).toBeDefined();
    expect(post.author.name).toBe("Alice");
  });
});

describe("hasMany relation", () => {
  test("loads multiple related records", async () => {
    const authors: any[] = await select("Author" as any)
      .with("posts")
      .all();

    expect(authors.length).toBe(3);

    const alice = authors.find((a) => a.name === "Alice");
    expect(alice.posts.length).toBe(2);
    expect(alice.posts[0].title).toContain("Alice");

    const bob = authors.find((a) => a.name === "Bob");
    expect(bob.posts.length).toBe(1);

    const charlie = authors.find((a) => a.name === "Charlie");
    expect(charlie.posts).toEqual([]);
  });

  test("returns empty array when no related records exist", async () => {
    const authors: any[] = await select("Author" as any)
      .where({ name: "Charlie" })
      .with("posts")
      .all();

    expect(authors.length).toBe(1);
    expect(authors[0].posts).toEqual([]);
  });

  test("works with first()", async () => {
    const author: any = await select("Author" as any)
      .where({ name: "Alice" })
      .with("posts")
      .first();

    expect(author).toBeDefined();
    expect(author.posts.length).toBe(2);
  });
});

describe("hasOne relation", () => {
  test("loads single related record", async () => {
    const authors: any[] = await select("Author" as any)
      .with("profile")
      .all();

    const alice = authors.find((a) => a.name === "Alice");
    expect(alice.profile).toBeDefined();
    expect(alice.profile.bio).toBe("Alice is a writer");

    const bob = authors.find((a) => a.name === "Bob");
    expect(bob.profile).toBeDefined();
    expect(bob.profile.bio).toBe("Bob is a developer");
  });

  test("returns null when no related record exists", async () => {
    const authors: any[] = await select("Author" as any)
      .where({ name: "Charlie" })
      .with("profile")
      .all();

    expect(authors.length).toBe(1);
    expect(authors[0].profile).toBeNull();
  });
});

describe("multiple relations", () => {
  test("loads multiple relations at once", async () => {
    const authors: any[] = await select("Author" as any)
      .with("posts", "profile")
      .all();

    const alice = authors.find((a) => a.name === "Alice");
    expect(alice.posts.length).toBe(2);
    expect(alice.profile.bio).toBe("Alice is a writer");
  });

  test("nested relations on posts with comments", async () => {
    const posts: any[] = await select("Post" as any)
      .with("author", "comments")
      .all();

    const post1 = posts.find((p) => p.id === post1Id);
    expect(post1.author.name).toBe("Alice");
    expect(post1.comments.length).toBe(2);
    expect(post1.comments[0].body).toBe("Great post!");
  });
});

describe("error handling", () => {
  test("throws error for unknown relation", async () => {
    expect(
      select("Author" as any)
        .with("unknownRelation")
        .all(),
    ).rejects.toThrow('Relation "unknownRelation" not found on model "Author"');
  });
});

describe("edge cases", () => {
  test("with() without relations returns plain results", async () => {
    const authors: any[] = await select("Author" as any).all();
    expect(authors.length).toBe(3);
    expect(authors[0].posts).toBeUndefined();
  });

  test("empty result set with relations", async () => {
    const authors: any[] = await select("Author" as any)
      .where({ name: "NonExistent" })
      .with("posts")
      .all();

    expect(authors).toEqual([]);
  });
});
