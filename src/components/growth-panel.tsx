"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CheckInStatus, FeedPost } from "@/lib/types";

type GrowthPanelProps = {
  posts: FeedPost[];
};

type CheckInCardProps = {
  initialStatus: CheckInStatus;
};

const FALLBACK_TIME_ZONE = "Asia/Hong_Kong";

function getBrowserTimeZone() {
  return (
    Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIME_ZONE
  );
}

export function CheckInCard({ initialStatus }: CheckInCardProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState(initialStatus);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRefreshKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const timeZone = getBrowserTimeZone();
    const signedIn = Boolean(isSignedIn);
    const needsRefresh =
      timeZone !== status.timeZone || signedIn !== status.authenticated;
    const refreshKey = `${status.scope}:${timeZone}:${signedIn ? "in" : "out"}`;

    if (!needsRefresh || lastRefreshKeyRef.current === refreshKey) {
      return;
    }

    lastRefreshKeyRef.current = refreshKey;

    const abortController = new AbortController();
    const params = new URLSearchParams({
      scope: status.scope,
      timeZone,
    });

    fetch(`/api/check-ins?${params.toString()}`, {
      credentials: "same-origin",
      signal: abortController.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: CheckInStatus | null) => {
        if (body) {
          setStatus(body);
        }
      })
      .catch(() => undefined);

    return () => abortController.abort();
  }, [
    isLoaded,
    isSignedIn,
    status.authenticated,
    status.scope,
    status.timeZone,
  ]);

  async function handleCheckIn() {
    if (
      isPending ||
      status.checkedInToday ||
      !status.authenticated ||
      !status.databaseReady
    ) {
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/check-ins", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scope: status.scope,
          timeZone: getBrowserTimeZone(),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | (CheckInStatus & { error?: string })
        | null;

      if (!response.ok) {
        setError(body?.error ?? "打卡失败。");
        return;
      }

      if (body) {
        setStatus(body);
      }
    } finally {
      setIsPending(false);
    }
  }

  const buttonLabel = status.checkedInToday
    ? "今日已打卡"
    : status.authenticated
      ? "今日打卡"
      : "登录后打卡";

  return (
    <section className="rounded-lg bg-white/82 p-4 shadow-sm ring-1 ring-black/10">
      <div className="text-center">
        <p className="text-xs font-bold text-[#9a603f]">连续打卡</p>
        <p className="mt-2 text-4xl font-black leading-none text-[#17120d]">
          {status.streak}
          <span className="ml-1 text-lg align-baseline">天</span>
        </p>
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={
            isPending ||
            status.checkedInToday ||
            !status.authenticated ||
            !status.databaseReady
          }
          className="mt-3 rounded-full bg-[#e46645] px-4 py-1 text-xs font-bold text-white transition hover:bg-[#d3583b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "打卡中" : buttonLabel}
        </button>
        {error ? (
          <p className="mt-2 text-xs font-semibold text-[#b23b2b]">{error}</p>
        ) : null}
      </div>

      <div className="mt-4 border-t border-black/10 pt-4">
        <p className="text-xs font-bold text-[#9a603f]">挑战话题</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["#7天打卡", "#遛弯地图", "#萌宠笑容挑战"].map((topic) => (
            <Link
              key={topic}
              href="/compose"
              className="rounded-full bg-[#fff3df] px-2.5 py-1 text-xs font-semibold text-[#8f6a22] transition hover:bg-[#ffe7bf]"
            >
              {topic}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GrowthPanel({ posts }: GrowthPanelProps) {
  const weeklyPicks = useMemo(() => {
    return [...posts]
      .sort(
        (a, b) =>
          b.likesCount +
          b.favoritesCount * 2 -
          (a.likesCount + a.favoritesCount * 2),
      )
      .slice(0, 3);
  }, [posts]);

  return (
    <aside className="space-y-4 rounded-lg bg-white/82 p-4 shadow-sm ring-1 ring-black/10">
      <section>
        <p className="text-xs font-bold text-[#9a603f]">每周精选</p>
        <ul className="mt-2 space-y-2">
          {weeklyPicks.map((post) => (
            <li
              key={post.id}
              className="rounded-md bg-[#fff7ea] p-2 text-xs text-[#4d3c2f] ring-1 ring-[#f0dec4]"
            >
              <Link
                href={`/post/${post.id}`}
                className="line-clamp-2 font-semibold hover:text-[#d75d3f]"
              >
                {post.caption}
              </Link>
              <p className="mt-1 text-[11px] text-[#896d53]">
                赞 {post.likesCount} · 收藏 {post.favoritesCount}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
