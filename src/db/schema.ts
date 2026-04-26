import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    handle: varchar("handle", { length: 32 }).notNull(),
    displayName: varchar("display_name", { length: 80 }).notNull(),
    bio: text("bio").default("").notNull(),
    avatarUrl: text("avatar_url"),
    avatarObjectKey: text("avatar_object_key"),
    coverUrl: text("cover_url"),
    coverObjectKey: text("cover_object_key"),
    profileViews: integer("profile_views").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_clerk_user_id_idx").on(table.clerkUserId),
    uniqueIndex("users_handle_idx").on(table.handle),
  ],
);

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  caption: text("caption").notNull(),
  imageUrl: text("image_url").notNull(),
  imageObjectKey: text("image_object_key"),
  category: varchar("category", { length: 32 }).default("daily").notNull(),
  location: varchar("location", { length: 80 }),
  viewsCount: integer("views_count").default(0).notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  favoritesCount: integer("favorites_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const postLikes = pgTable(
  "post_likes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.userId] })],
);

export const postFavorites = pgTable(
  "post_favorites",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.userId] })],
);

export const postViews = pgTable(
  "post_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    viewerKey: varchar("viewer_key", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("post_views_post_viewer_idx").on(table.postId, table.viewerKey)],
);

export const postComments = pgTable(
  "post_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references(
      (): AnyPgColumn => postComments.id,
      { onDelete: "cascade" },
    ),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("post_comments_post_created_idx").on(table.postId, table.createdAt),
    index("post_comments_parent_idx").on(table.parentId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  likes: many(postLikes),
  favorites: many(postFavorites),
  comments: many(postComments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  likes: many(postLikes),
  favorites: many(postFavorites),
  views: many(postViews),
  comments: many(postComments),
}));

export const postCommentsRelations = relations(postComments, ({ one, many }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [postComments.authorId],
    references: [users.id],
  }),
  parent: one(postComments, {
    fields: [postComments.parentId],
    references: [postComments.id],
    relationName: "commentReplies",
  }),
  replies: many(postComments, {
    relationName: "commentReplies",
  }),
}));
