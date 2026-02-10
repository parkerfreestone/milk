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

beforeAll(() => {
  sync();

  // Clean up tables
  db.run(`DELETE FROM "Author"`);
  db.run(`DELETE FROM "Post"`);
  db.run(`DELETE FROM "Comment"`);
  db.run(`DELETE FROM "AuthorProfile"`);

  // Insert test data
  const insertAuthor = db.prepare(`INSERT INTO "Author" ("name") VALUES (?)`);
  insertAuthor.run("Alice");
  insertAuthor.run("Bob");
  insertAuthor.run("Charlie");

  const insertPost = db.prepare(
    `INSERT INTO "Post" ("title", "authorId") VALUES (?, ?)`,
  );
  insertPost.run("Alice Post 1", 1);
  insertPost.run("Alice Post 2", 1);
  insertPost.run("Bob Post 1", 2);

  const insertComment = db.prepare(
    `INSERT INTO "Comment" ("body", "postId") VALUES (?, ?)`,
  );
  insertComment.run("Great post!", 1);
  insertComment.run("Thanks!", 1);
  insertComment.run("Nice work", 2);

  const insertProfile = db.prepare(
    `INSERT INTO "AuthorProfile" ("bio", "authorId") VALUES (?, ?)`,
  );
  insertProfile.run("Alice is a writer", 1);
  insertProfile.run("Bob is a developer", 2);
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
      .where({ id: 1 })
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

    const post1 = posts.find((p) => p.id === 1);
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
