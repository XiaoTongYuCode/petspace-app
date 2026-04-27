"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedPost } from "@/lib/types";
import { PostCard } from "@/components/post-card";

type FeedListProps = {
  posts: FeedPost[];
};

const INITIAL_BATCH = 4;
const BATCH_SIZE = 4;

export function FeedList({ posts }: FeedListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visiblePosts = useMemo(() => posts.slice(0, visibleCount), [posts, visibleCount]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        setVisibleCount((current) => Math.min(posts.length, current + BATCH_SIZE));
      },
      { rootMargin: "240px 0px", threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [posts.length]);

  return (
    <div className="space-y-5">
      {visiblePosts.map((post, index) => (
        <PostCard key={post.id} post={post} priority={index === 0} />
      ))}
      <div ref={sentinelRef} className="h-2" />
    </div>
  );
}
