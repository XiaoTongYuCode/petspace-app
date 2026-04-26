"use client";

import { Bookmark, Eye, Heart, MapPin, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { compactNumber, formatDate } from "@/lib/format";
import type { FeedPost } from "@/lib/types";

type PostCardProps = {
  post: FeedPost;
  priority?: boolean;
};

export function PostCard({ post, priority = false }: PostCardProps) {
  const isSample = post.id.startsWith("sample-");
  const [liked, setLiked] = useState(post.viewerHasLiked);
  const [favorited, setFavorited] = useState(post.viewerHasFavorited);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [favoritesCount, setFavoritesCount] = useState(post.favoritesCount);
  const [viewsCount, setViewsCount] = useState(post.viewsCount);
  const [feedback, setFeedback] = useState<string | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (viewedRef.current || isSample) {
      return;
    }

    viewedRef.current = true;
    fetch(`/api/posts/${post.id}/view`, { method: "POST" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { count?: number } | null) => {
        if (typeof body?.count === "number") {
          setViewsCount(body.count);
        }
      })
      .catch(() => undefined);
  }, [isSample, post.id]);

  async function toggleLike() {
    setFeedback(null);

    if (isSample) {
      setLiked((current) => !current);
      setLikesCount((current) => current + (liked ? -1 : 1));
      return;
    }

    const response = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    const body = (await response.json().catch(() => null)) as
      | { liked?: boolean; count?: number; error?: string }
      | null;

    if (!response.ok) {
      setFeedback(body?.error ?? "点赞失败。");
      return;
    }

    setLiked(Boolean(body?.liked));
    setLikesCount(body?.count ?? likesCount);
  }

  async function toggleFavorite() {
    setFeedback(null);

    if (isSample) {
      setFavorited((current) => !current);
      setFavoritesCount((current) => current + (favorited ? -1 : 1));
      return;
    }

    const response = await fetch(`/api/posts/${post.id}/favorite`, {
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as
      | { favorited?: boolean; count?: number; error?: string }
      | null;

    if (!response.ok) {
      setFeedback(body?.error ?? "收藏失败。");
      return;
    }

    setFavorited(Boolean(body?.favorited));
    setFavoritesCount(body?.count ?? favoritesCount);
  }

  return (
    <article
      data-testid={`post-card-${post.id}`}
      className="overflow-hidden rounded-lg bg-white/72 shadow-sm ring-1 ring-black/10"
    >
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={post.author.avatarUrl} name={post.author.displayName} />
          <div className="min-w-0">
            <Link
              href={`/u/${post.author.handle}`}
              className="block truncate text-sm font-bold text-[#17120d] transition hover:text-[#d75d3f]"
            >
              {post.author.displayName}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#8a715b]">
              <span>@{post.author.handle}</span>
              <span>{formatDate(post.createdAt)}</span>
              {post.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {post.location}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <span className="rounded-full bg-[#fff3df] px-3 py-1 text-xs font-bold text-[#9a603f] ring-1 ring-black/5">
          {isSample ? `${post.category}` : post.category}
        </span>
      </div>

      <p className="px-4 pb-4 text-[15px] leading-7 text-[#3b3027] sm:px-5">
        {post.caption}
      </p>

      <Link href={`/post/${post.id}`} className="block bg-[#efd7b5]">
        <Image
          src={post.imageUrl}
          alt={post.caption}
          width={1200}
          height={560}
          priority={priority}
          className="aspect-[16/10] max-h-[420px] w-full object-cover transition duration-500 hover:scale-[1.015]"
        />
      </Link>

      <div className="grid grid-cols-4 border-t border-black/10 text-[13px] font-semibold text-[#5a493b]">
        <button
          type="button"
          onClick={toggleLike}
          data-testid={`like-${post.id}`}
          aria-label={liked ? "取消点赞" : "点赞"}
          className="flex h-12 items-center justify-center gap-2 transition hover:bg-[#fff8ed]"
          aria-pressed={liked}
        >
          <Heart
            className={`h-4 w-4 ${liked ? "fill-[#e46645] text-[#e46645]" : ""}`}
          />
          {compactNumber(likesCount)}
        </button>
        <Link
          href={`/post/${post.id}#comments`}
          data-testid={`comments-${post.id}`}
          aria-label="查看评论"
          className="flex h-12 items-center justify-center gap-2 transition hover:bg-[#fff8ed]"
        >
          <MessageCircle className="h-4 w-4" />
          {compactNumber(post.commentsCount)}
        </Link>
        <div className="flex h-12 items-center justify-center gap-2">
          <Eye className="h-4 w-4" />
          {compactNumber(viewsCount)}
        </div>
        <button
          type="button"
          onClick={toggleFavorite}
          data-testid={`favorite-${post.id}`}
          aria-label={favorited ? "取消收藏" : "收藏"}
          className="flex h-12 items-center justify-center gap-2 transition hover:bg-[#fff8ed]"
          aria-pressed={favorited}
        >
          <Bookmark
            className={`h-4 w-4 ${
              favorited ? "fill-[#f2b84b] text-[#b37b18]" : ""
            }`}
          />
          {compactNumber(favoritesCount)}
        </button>
      </div>

      {feedback ? (
        <p className="border-t border-black/10 px-5 py-3 text-sm font-medium text-[#b23b2b]">
          {feedback}
        </p>
      ) : null}
    </article>
  );
}
