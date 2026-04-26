import { Heart, Pencil, Sparkles, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { compactNumber } from "@/lib/format";
import { DEFAULT_PROFILE_COVER_URL } from "@/lib/profile-defaults";
import type { ProfileSummary } from "@/lib/types";

type ProfileSummaryCardProps = {
  profile: ProfileSummary;
};

export function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  const coverUrl = profile.coverUrl ?? DEFAULT_PROFILE_COVER_URL;
  const stats = [
    { label: "总访问", value: profile.totalViews + profile.profileViews },
    { label: "点赞", value: profile.totalLikes },
    { label: "动态", value: profile.postsCount },
  ];

  return (
    <aside className="sticky top-[84px] hidden h-fit overflow-hidden rounded-lg bg-white/60 ring-1 ring-black/10 xl:block">
      <div className="relative h-28 bg-[#eecf9d]">
        <Image
          src={coverUrl}
          alt={`${profile.displayName} 的背景图`}
          fill
          sizes="360px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/40 to-transparent" />
      </div>
      <div className="px-5 pb-5">
        <div className="relative z-10 -mt-10 flex items-end justify-between">
          <Avatar src={profile.avatarUrl} name={profile.displayName} size="lg" />
          <Link
            href="/me"
            className="inline-flex h-8 items-center gap-2 rounded-full bg-[#17120d] px-3 text-xs font-semibold text-[#fff7ea] transition hover:bg-[#2a2119]"
          >
            <Pencil className="h-3.5 w-3.5" />
            编辑
          </Link>
        </div>
        <div className="mt-4">
          <Link
            href={`/u/${profile.handle}`}
            className="text-lg font-bold text-[#17120d] transition hover:text-[#d75d3f]"
          >
            {profile.displayName}
          </Link>
          <p className="text-sm font-medium text-[#8a715b]">@{profile.handle}</p>
          <p className="mt-3 text-sm leading-6 text-[#5a493b]">{profile.bio}</p>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-md bg-[#fffaf1] px-2 py-3 text-center ring-1 ring-black/5"
            >
              <p className="text-base font-black text-[#17120d]">
                {compactNumber(stat.value)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[#8a715b]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3 rounded-md bg-[#17120d] p-4 text-[#fff7ea]">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-[#f2b84b]" />
            今日灵感
          </div>
          <p className="text-sm leading-6 text-[#f7dfbf]">
            用一张照片记录宠物今天的小情绪，暖一点，近一点。
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#f7dfbf]">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-[#e46645]" />
              高互动
            </span>
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-[#8eaa70]" />
              生活分享
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
