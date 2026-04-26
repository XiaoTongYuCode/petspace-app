import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { getClerkSessionClaims, getClerkUser, getClerkUserId } from "@/lib/auth";
import { normalizeHandle } from "@/lib/format";
import { samplePosts, sampleProfile } from "@/lib/sample-data";
import type { FeedPost, PostComment, ProfileSummary } from "@/lib/types";
import { getDbOrNull } from "@/db";
import { isDatabaseReadFallbackError } from "@/db/errors";
import {
  postComments,
  postFavorites,
  postLikes,
  posts,
  postViews,
  users,
} from "@/db/schema";

type CreatePostInput = {
  caption: string;
  imageUrl: string;
  imageObjectKey?: string | null;
  category?: string;
  location?: string | null;
};

type CreateCommentInput = {
  postId: string;
  body: string;
  parentId?: string | null;
};

type ProfileUpdateInput = {
  displayName?: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string | null;
  avatarObjectKey?: string | null;
  coverUrl?: string | null;
  coverObjectKey?: string | null;
};

type AppUser = typeof users.$inferSelect;

type ClerkUserSnapshot = {
  email?: string | null;
  firstName?: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
  lastName?: string | null;
  username?: string | null;
};

function toIso(value: Date | string) {
  return new Date(value).toISOString();
}

function mapPostRow(row: {
  postId: string;
  caption: string;
  imageUrl: string;
  imageObjectKey: string | null;
  category: string;
  location: string | null;
  viewsCount: number;
  likesCount: number;
  favoritesCount: number;
  commentsCount: number;
  createdAt: Date | string;
  authorId: string;
  authorHandle: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  viewerHasLiked: boolean;
  viewerHasFavorited: boolean;
}): FeedPost {
  return {
    id: row.postId,
    caption: row.caption,
    imageUrl: row.imageUrl,
    imageObjectKey: row.imageObjectKey,
    category: row.category,
    location: row.location,
    viewsCount: row.viewsCount,
    likesCount: row.likesCount,
    favoritesCount: row.favoritesCount,
    commentsCount: row.commentsCount,
    createdAt: toIso(row.createdAt),
    author: {
      id: row.authorId,
      handle: row.authorHandle,
      displayName: row.authorDisplayName,
      avatarUrl: row.authorAvatarUrl,
    },
    viewerHasLiked: row.viewerHasLiked,
    viewerHasFavorited: row.viewerHasFavorited,
  };
}

function mapCommentRow(row: {
  commentId: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: Date | string;
  authorId: string;
  authorHandle: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
}): PostComment {
  return {
    id: row.commentId,
    postId: row.postId,
    parentId: row.parentId,
    body: row.body,
    createdAt: toIso(row.createdAt),
    author: {
      id: row.authorId,
      handle: row.authorHandle,
      displayName: row.authorDisplayName,
      avatarUrl: row.authorAvatarUrl,
    },
    replies: [],
  };
}

function buildCommentTree(comments: PostComment[]) {
  const commentsById = new Map<string, PostComment>();
  const roots: PostComment[] = [];

  for (const comment of comments) {
    commentsById.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of commentsById.values()) {
    if (comment.parentId) {
      const parent = commentsById.get(comment.parentId);

      if (parent) {
        parent.replies.push(comment);
        continue;
      }
    }

    roots.push(comment);
  }

  return roots;
}

async function getViewer() {
  const clerkUserId = await getClerkUserId();

  if (!clerkUserId) {
    return null;
  }

  const db = getDbOrNull();

  if (!db) {
    return null;
  }

  try {
    const [viewer] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    return viewer ?? null;
  } catch {
    return null;
  }
}

async function makeUniqueHandle(base: string, currentClerkUserId: string) {
  const db = getDbOrNull();
  const cleanBase = normalizeHandle(base) || "petspace";
  let candidate = cleanBase.length >= 3 ? cleanBase : `${cleanBase}_pet`;

  if (!db) {
    return candidate;
  }

  try {
    for (let index = 0; index < 30; index += 1) {
      const [existing] = await db
        .select({
          id: users.id,
          clerkUserId: users.clerkUserId,
        })
        .from(users)
        .where(eq(users.handle, candidate))
        .limit(1);

      if (!existing || existing.clerkUserId === currentClerkUserId) {
        return candidate;
      }

      candidate = `${cleanBase.slice(0, 25)}_${index + 2}`;
    }
  } catch {
    return candidate;
  }

  return `${cleanBase.slice(0, 20)}_${Date.now().toString(36)}`;
}

async function getClerkUserSnapshot(): Promise<ClerkUserSnapshot | null> {
  const clerkUser = await getClerkUser();

  if (clerkUser) {
    return {
      email: clerkUser.emailAddresses.at(0)?.emailAddress ?? null,
      firstName: clerkUser.firstName,
      fullName: clerkUser.fullName,
      imageUrl: clerkUser.imageUrl,
      lastName: clerkUser.lastName,
      username: clerkUser.username,
    };
  }

  const claims = await getClerkSessionClaims();

  if (!claims) {
    return null;
  }

  const claimRecord = claims as Record<string, unknown>;
  const email =
    typeof claimRecord.email === "string"
      ? claimRecord.email
      : typeof claimRecord.primary_email_address === "string"
        ? claimRecord.primary_email_address
        : null;
  const firstName =
    typeof claimRecord.first_name === "string" ? claimRecord.first_name : null;
  const lastName =
    typeof claimRecord.last_name === "string" ? claimRecord.last_name : null;
  const fullName =
    typeof claimRecord.name === "string"
      ? claimRecord.name
      : [firstName, lastName].filter(Boolean).join(" ") || null;
  const username =
    typeof claimRecord.username === "string" ? claimRecord.username : null;
  const imageUrl =
    typeof claimRecord.image_url === "string"
      ? claimRecord.image_url
      : typeof claimRecord.picture === "string"
        ? claimRecord.picture
        : null;

  return {
    email,
    firstName,
    fullName,
    imageUrl,
    lastName,
    username,
  };
}

export async function ensureCurrentUser(): Promise<AppUser | null> {
  const clerkUserId = await getClerkUserId();

  if (!clerkUserId) {
    return null;
  }

  const db = getDbOrNull();

  if (!db) {
    return null;
  }

  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (existing) {
      return existing;
    }

    const clerkUser = await getClerkUserSnapshot();
    const baseHandle =
      clerkUser?.username ||
      clerkUser?.email?.split("@").at(0) ||
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join("_") ||
      `petspace_${clerkUserId.slice(-6)}`;
    const displayName =
      clerkUser?.fullName ||
      clerkUser?.firstName ||
      clerkUser?.email ||
      "Petspace 用户";
    const handle = await makeUniqueHandle(baseHandle, clerkUserId);

    const [created] = await db
      .insert(users)
      .values({
        clerkUserId,
        handle,
        displayName: displayName.slice(0, 80),
        avatarUrl: clerkUser?.imageUrl ?? null,
        bio: "正在 Petspace 分享宠物日常。",
      })
      .returning();

    return created ?? null;
  } catch {
    return null;
  }
}

export async function getFeedPosts(limit = 20): Promise<FeedPost[]> {
  const db = getDbOrNull();

  if (!db) {
    return samplePosts;
  }

  try {
    const viewer = await getViewer();
    const viewerId = viewer?.id;

    const rows = await db
      .select({
        postId: posts.id,
        caption: posts.caption,
        imageUrl: posts.imageUrl,
        imageObjectKey: posts.imageObjectKey,
        category: posts.category,
        location: posts.location,
        viewsCount: posts.viewsCount,
        likesCount: posts.likesCount,
        favoritesCount: posts.favoritesCount,
        commentsCount: sql<number>`(select count(*)::int from ${postComments} where ${postComments.postId} = ${posts.id})`,
        createdAt: posts.createdAt,
        authorId: users.id,
        authorHandle: users.handle,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
        viewerHasLiked: viewerId
          ? sql<boolean>`exists(select 1 from ${postLikes} where ${postLikes.postId} = ${posts.id} and ${postLikes.userId} = ${viewerId})`
          : sql<boolean>`false`,
        viewerHasFavorited: viewerId
          ? sql<boolean>`exists(select 1 from ${postFavorites} where ${postFavorites.postId} = ${posts.id} and ${postFavorites.userId} = ${viewerId})`
          : sql<boolean>`false`,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    return rows.map(mapPostRow);
  } catch (error) {
    if (isDatabaseReadFallbackError(error)) {
      return samplePosts;
    }

    return samplePosts;
  }
}

export async function getPostById(postId: string): Promise<FeedPost | null> {
  const db = getDbOrNull();

  if (!db) {
    return samplePosts.find((post) => post.id === postId) ?? samplePosts[0] ?? null;
  }

  try {
    const viewer = await getViewer();
    const viewerId = viewer?.id;

    const [row] = await db
      .select({
        postId: posts.id,
        caption: posts.caption,
        imageUrl: posts.imageUrl,
        imageObjectKey: posts.imageObjectKey,
        category: posts.category,
        location: posts.location,
        viewsCount: posts.viewsCount,
        likesCount: posts.likesCount,
        favoritesCount: posts.favoritesCount,
        commentsCount: sql<number>`(select count(*)::int from ${postComments} where ${postComments.postId} = ${posts.id})`,
        createdAt: posts.createdAt,
        authorId: users.id,
        authorHandle: users.handle,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
        viewerHasLiked: viewerId
          ? sql<boolean>`exists(select 1 from ${postLikes} where ${postLikes.postId} = ${posts.id} and ${postLikes.userId} = ${viewerId})`
          : sql<boolean>`false`,
        viewerHasFavorited: viewerId
          ? sql<boolean>`exists(select 1 from ${postFavorites} where ${postFavorites.postId} = ${posts.id} and ${postFavorites.userId} = ${viewerId})`
          : sql<boolean>`false`,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, postId))
      .limit(1);

    return row ? mapPostRow(row) : null;
  } catch {
    return samplePosts.find((post) => post.id === postId) ?? samplePosts[0] ?? null;
  }
}

export async function getPostComments(postId: string): Promise<PostComment[]> {
  const db = getDbOrNull();

  if (!db || postId.startsWith("sample-")) {
    return [];
  }

  try {
    const rows = await db
      .select({
        commentId: postComments.id,
        postId: postComments.postId,
        parentId: postComments.parentId,
        body: postComments.body,
        createdAt: postComments.createdAt,
        authorId: users.id,
        authorHandle: users.handle,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.authorId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.createdAt));

    return buildCommentTree(rows.map(mapCommentRow));
  } catch {
    return [];
  }
}

export async function createPostComment(input: CreateCommentInput) {
  const db = getDbOrNull();
  const user = await ensureCurrentUser();

  if (!db || !user) {
    throw new Error("请先登录后再评论。");
  }

  const body = input.body.trim();

  if (!body) {
    throw new Error("请输入评论内容。");
  }

  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, input.postId))
    .limit(1);

  if (!post) {
    throw new Error("动态不存在。");
  }

  if (input.parentId) {
    const [parent] = await db
      .select({ postId: postComments.postId })
      .from(postComments)
      .where(eq(postComments.id, input.parentId))
      .limit(1);

    if (!parent || parent.postId !== input.postId) {
      throw new Error("回复的评论不存在。");
    }
  }

  await db.insert(postComments).values({
    postId: input.postId,
    authorId: user.id,
    parentId: input.parentId ?? null,
    body: body.slice(0, 500),
  });

  return getPostComments(input.postId);
}

export async function getPostsByAuthorId(authorId: string): Promise<FeedPost[]> {
  const db = getDbOrNull();

  if (!db) {
    return samplePosts;
  }

  try {
    const viewer = await getViewer();
    const viewerId = viewer?.id;

    const rows = await db
      .select({
        postId: posts.id,
        caption: posts.caption,
        imageUrl: posts.imageUrl,
        imageObjectKey: posts.imageObjectKey,
        category: posts.category,
        location: posts.location,
        viewsCount: posts.viewsCount,
        likesCount: posts.likesCount,
        favoritesCount: posts.favoritesCount,
        commentsCount: sql<number>`(select count(*)::int from ${postComments} where ${postComments.postId} = ${posts.id})`,
        createdAt: posts.createdAt,
        authorId: users.id,
        authorHandle: users.handle,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
        viewerHasLiked: viewerId
          ? sql<boolean>`exists(select 1 from ${postLikes} where ${postLikes.postId} = ${posts.id} and ${postLikes.userId} = ${viewerId})`
          : sql<boolean>`false`,
        viewerHasFavorited: viewerId
          ? sql<boolean>`exists(select 1 from ${postFavorites} where ${postFavorites.postId} = ${posts.id} and ${postFavorites.userId} = ${viewerId})`
          : sql<boolean>`false`,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.authorId, authorId))
      .orderBy(desc(posts.createdAt));

    return rows.map(mapPostRow);
  } catch {
    return samplePosts;
  }
}

export async function getCurrentUserProfile(): Promise<ProfileSummary | null> {
  const user = await ensureCurrentUser();

  if (!user) {
    return null;
  }

  return getProfileSummary(user);
}

export async function getProfileByHandle(handle: string) {
  const db = getDbOrNull();
  const cleanHandle = normalizeHandle(handle);

  if (!db) {
    return {
      profile: cleanHandle === "petspace" ? sampleProfile : sampleProfile,
      posts: samplePosts,
    };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.handle, cleanHandle))
      .limit(1);

    if (!user) {
      if (cleanHandle === "petspace") {
        return {
          profile: sampleProfile,
          posts: samplePosts,
        };
      }

      return null;
    }

    const [profile, authoredPosts] = await Promise.all([
      getProfileSummary(user),
      getPostsByAuthorId(user.id),
    ]);

    return { profile, posts: authoredPosts };
  } catch {
    return {
      profile: sampleProfile,
      posts: samplePosts,
    };
  }
}

async function getProfileSummary(user: AppUser): Promise<ProfileSummary> {
  const db = getDbOrNull();

  if (!db) {
    return sampleProfile;
  }

  const [stats] = await db
    .select({
      postsCount: count(posts.id),
      totalLikes: sql<number>`coalesce(sum(${posts.likesCount}), 0)::int`,
      totalViews: sql<number>`coalesce(sum(${posts.viewsCount}), 0)::int`,
    })
    .from(posts)
    .where(eq(posts.authorId, user.id))
    .catch((error) => {
      if (isDatabaseReadFallbackError(error)) {
        return [];
      }

      throw error;
    });

  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    avatarObjectKey: user.avatarObjectKey,
    coverUrl: user.coverUrl,
    coverObjectKey: user.coverObjectKey,
    profileViews: user.profileViews,
    postsCount: stats?.postsCount ?? 0,
    totalLikes: stats?.totalLikes ?? 0,
    totalViews: stats?.totalViews ?? 0,
    createdAt: toIso(user.createdAt),
  };
}

export async function createPost(input: CreatePostInput) {
  const db = getDbOrNull();
  const user = await ensureCurrentUser();

  if (!db || !user) {
    throw new Error("请先配置数据库和登录后再发布动态。");
  }

  const [created] = await db
    .insert(posts)
    .values({
      authorId: user.id,
      caption: input.caption.trim(),
      imageUrl: input.imageUrl,
      imageObjectKey: input.imageObjectKey ?? null,
      category: input.category ?? "daily",
      location: input.location?.trim() || null,
    })
    .returning({ id: posts.id });

  return created;
}

export async function togglePostLike(postId: string) {
  const db = getDbOrNull();
  const user = await ensureCurrentUser();

  if (!db || !user) {
    throw new Error("请先登录后再点赞。");
  }

  const [existing] = await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)))
    .limit(1);

  if (existing) {
    await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)));
    await db
      .update(posts)
      .set({
        likesCount: sql`greatest(${posts.likesCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    const [updated] = await db
      .select({ count: posts.likesCount })
      .from(posts)
      .where(eq(posts.id, postId));
    return { liked: false, count: updated?.count ?? 0 };
  }

  const inserted = await db
    .insert(postLikes)
    .values({ postId, userId: user.id })
    .onConflictDoNothing()
    .returning({ postId: postLikes.postId });

  if (inserted.length > 0) {
    await db
      .update(posts)
      .set({
        likesCount: sql`${posts.likesCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));
  }

  const [updated] = await db
    .select({ count: posts.likesCount })
    .from(posts)
    .where(eq(posts.id, postId));
  return { liked: true, count: updated?.count ?? 0 };
}

export async function togglePostFavorite(postId: string) {
  const db = getDbOrNull();
  const user = await ensureCurrentUser();

  if (!db || !user) {
    throw new Error("请先登录后再收藏。");
  }

  const [existing] = await db
    .select({ postId: postFavorites.postId })
    .from(postFavorites)
    .where(and(eq(postFavorites.postId, postId), eq(postFavorites.userId, user.id)))
    .limit(1);

  if (existing) {
    await db
      .delete(postFavorites)
      .where(and(eq(postFavorites.postId, postId), eq(postFavorites.userId, user.id)));
    await db
      .update(posts)
      .set({
        favoritesCount: sql`greatest(${posts.favoritesCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    const [updated] = await db
      .select({ count: posts.favoritesCount })
      .from(posts)
      .where(eq(posts.id, postId));
    return { favorited: false, count: updated?.count ?? 0 };
  }

  const inserted = await db
    .insert(postFavorites)
    .values({ postId, userId: user.id })
    .onConflictDoNothing()
    .returning({ postId: postFavorites.postId });

  if (inserted.length > 0) {
    await db
      .update(posts)
      .set({
        favoritesCount: sql`${posts.favoritesCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));
  }

  const [updated] = await db
    .select({ count: posts.favoritesCount })
    .from(posts)
    .where(eq(posts.id, postId));
  return { favorited: true, count: updated?.count ?? 0 };
}

export async function recordPostView(postId: string, viewerKey: string) {
  const db = getDbOrNull();

  if (!db) {
    return { viewed: false, count: 0 };
  }

  try {
    const user = await getViewer();
    const inserted = await db
      .insert(postViews)
      .values({
        postId,
        userId: user?.id ?? null,
        viewerKey,
      })
      .onConflictDoNothing()
      .returning({ id: postViews.id });

    if (inserted.length > 0) {
      await db
        .update(posts)
        .set({
          viewsCount: sql`${posts.viewsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));
    }

    const [updated] = await db
      .select({ count: posts.viewsCount })
      .from(posts)
      .where(eq(posts.id, postId));

    return { viewed: inserted.length > 0, count: updated?.count ?? 0 };
  } catch (error) {
    if (isDatabaseReadFallbackError(error)) {
      return { viewed: false, count: 0 };
    }

    throw error;
  }
}

export async function updateCurrentProfile(input: ProfileUpdateInput) {
  const db = getDbOrNull();
  const user = await ensureCurrentUser();

  if (!db || !user) {
    throw new Error("请先配置数据库和登录后再编辑主页。");
  }

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (typeof input.displayName === "string") {
    updates.displayName = input.displayName.trim().slice(0, 80);
  }

  if (typeof input.bio === "string") {
    updates.bio = input.bio.trim().slice(0, 240);
  }

  if (typeof input.handle === "string") {
    const handle = normalizeHandle(input.handle);

    if (handle.length < 3) {
      throw new Error("用户名至少需要 3 个字符。");
    }

    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.handle, handle))
      .limit(1);

    if (conflict && conflict.id !== user.id) {
      throw new Error("这个用户名已经被使用。");
    }

    updates.handle = handle;
  }

  if ("avatarUrl" in input) {
    updates.avatarUrl = input.avatarUrl ?? null;
    updates.avatarObjectKey = input.avatarObjectKey ?? null;
  }

  if ("coverUrl" in input) {
    updates.coverUrl = input.coverUrl ?? null;
    updates.coverObjectKey = input.coverObjectKey ?? null;
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, user.id))
    .returning();

  return updated;
}
