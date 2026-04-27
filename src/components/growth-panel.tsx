"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FeedPost } from "@/lib/types";

type GrowthPanelProps = {
  posts: FeedPost[];
};

type CheckInState = {
  lastDate: string;
  streak: number;
};

const CHECK_IN_STORAGE_KEY = "petspace-checkin-v1";

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function GrowthPanel({ posts }: GrowthPanelProps) {
  const [checkInState, setCheckInState] = useState<CheckInState>(() => {
    if (typeof window === "undefined") {
      return { lastDate: "", streak: 0 };
    }
    const raw = window.localStorage.getItem(CHECK_IN_STORAGE_KEY);
    if (!raw) {
      return { lastDate: "", streak: 0 };
    }
    try {
      const parsed = JSON.parse(raw) as CheckInState;
      if (typeof parsed?.streak !== "number" || typeof parsed?.lastDate !== "string") {
        return { lastDate: "", streak: 0 };
      }
      return parsed;
    } catch {
      return { lastDate: "", streak: 0 };
    }
  });

  const weeklyPicks = useMemo(() => {
    return [...posts]
      .sort((a, b) => b.likesCount + b.favoritesCount * 2 - (a.likesCount + a.favoritesCount * 2))
      .slice(0, 3);
  }, [posts]);

  const isCheckedInToday = checkInState.lastDate === getTodayDateString();

  function handleCheckIn() {
    const today = getTodayDateString();
    if (checkInState.lastDate === today) {
      return;
    }
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    const nextState: CheckInState = {
      lastDate: today,
      streak: checkInState.lastDate === yesterday ? checkInState.streak + 1 : 1,
    };
    setCheckInState(nextState);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHECK_IN_STORAGE_KEY, JSON.stringify(nextState));
    }
  }

  return (
    <aside className="space-y-4 rounded-lg bg-white/82 p-4 shadow-sm ring-1 ring-black/10">
      <section className="rounded-md bg-[#fff7ea] p-3 ring-1 ring-[#f0dec4]">
        <p className="text-xs font-bold text-[#9a603f]">连续打卡</p>
        <p className="mt-1 text-lg font-black text-[#17120d]">{checkInState.streak} 天</p>
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={isCheckedInToday}
          className="mt-2 rounded-full bg-[#e46645] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#d3583b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCheckedInToday ? "今日已打卡" : "今日打卡"}
        </button>
      </section>

      <section>
        <p className="text-xs font-bold text-[#9a603f]">每周精选</p>
        <ul className="mt-2 space-y-2">
          {weeklyPicks.map((post) => (
            <li key={post.id} className="rounded-md bg-[#fff7ea] p-2 text-xs text-[#4d3c2f] ring-1 ring-[#f0dec4]">
              <Link href={`/post/${post.id}`} className="line-clamp-2 font-semibold hover:text-[#d75d3f]">
                {post.caption}
              </Link>
              <p className="mt-1 text-[11px] text-[#896d53]">
                👍 {post.likesCount} · ⭐ {post.favoritesCount}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
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
      </section>
    </aside>
  );
}
