import { cache, Suspense } from "react";
import Image from "next/image";
import { BackendStatusPanel } from "@/components/backend-status-panel";
import { ComposeCard } from "@/components/compose-card";
import { FeedList } from "@/components/feed-list";
import { CheckInCard, GrowthPanel } from "@/components/growth-panel";
import { ProfileSummaryCard } from "@/components/profile-summary-card";
import { DesktopSidebar, MobileNav, SiteHeader } from "@/components/site-shell";
import { getBackendStatus } from "@/lib/backend-status";
import {
  getCurrentUserCheckInStatus,
  getCurrentUserProfile,
  getFeedPosts,
} from "@/lib/data";
import { samplePosts, sampleProfile } from "@/lib/sample-data";
import { JsonLd, buildPageMetadata, siteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = buildPageMetadata({
  title: "宠物广场",
  description:
    "在 Petspace 宠物广场浏览猫咪、狗狗和更多宠物的照片日常，记录养宠故事，发现值得收藏的温暖瞬间。",
  path: "/",
  image: "/samples/walk-dog.png",
});

const getHomeBackendStatus = cache(() =>
  getBackendStatus(),
);
const getHomeFeedPosts = cache(() => getFeedPosts());
const getHomeCurrentProfile = cache(() => getCurrentUserProfile());
const getHomeCheckInStatus = cache(() => getCurrentUserCheckInStatus());

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff5e6_0%,_#fef5e7_38%,_#f8ecdc_100%)] pb-32 lg:pb-8">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8 lg:py-8 xl:grid-cols-[210px_minmax(0,680px)_320px]">
        <DesktopSidebar>
          <Suspense fallback={<CheckInCardFallback />}>
            <HomeCheckInCard />
          </Suspense>
          <Suspense fallback={<WeeklyPicksFallback />}>
            <HomeWeeklyPicks />
          </Suspense>
        </DesktopSidebar>
        <main className="min-w-0 space-y-5">
          <JsonLd data={siteJsonLd()} />
          <HomeHero />

          <Suspense fallback={<ComposeFallback />}>
            <BackendStatusAndCompose />
          </Suspense>

          <Suspense fallback={<FeedFallback />}>
            <HomeFeed />
          </Suspense>
        </main>
        <aside className="hidden space-y-5 xl:sticky xl:top-[84px] xl:block xl:h-fit">
          <Suspense fallback={<HomeAsideFallback />}>
            <HomeAside />
          </Suspense>
        </aside>
      </div>
      <MobileNav />
    </div>
  );
}

function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-xl border border-black/10 bg-[#17120d] px-4 py-4 text-[#fff7ea] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.85)] sm:px-6">
      <div
        className="pointer-events-none absolute right-[-80px] top-[-105px] h-[210px] w-[210px] rounded-full bg-[#f2b84b]/15 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#f2b84b]">Petspace</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal sm:text-3xl">
            分享今日
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[#f7dfbf]">
          用照片记录小家伙的日常小事，也把喜欢、浏览和收藏留给那些值得回看的瞬间~
        </p>
      </div>
    </section>
  );
}

async function BackendStatusAndCompose() {
  const backendStatus = await getHomeBackendStatus();
  const composeDisabledReason = backendStatus.ready
    ? null
    : "发布功能暂时还在准备中，可以先浏览演示动态。";

  return (
    <>
      <BackendStatusPanel status={backendStatus} />
      <ComposeCard disabledReason={composeDisabledReason} />
    </>
  );
}

async function HomeFeed() {
  const posts = await getHomeFeedPosts();

  return <FeedList key={posts[0]?.id ?? "feed"} posts={posts} />;
}

async function HomeCheckInCard() {
  const status = await getHomeCheckInStatus();

  return <CheckInCard initialStatus={status} />;
}

async function HomeWeeklyPicks() {
  const posts = await getHomeFeedPosts();

  return <GrowthPanel posts={posts} />;
}

async function HomeAside() {
  const currentProfile = await getHomeCurrentProfile();
  const profile = currentProfile ?? sampleProfile;

  return (
    <>
      <ProfileSummaryCard
        profile={profile}
        editable={Boolean(currentProfile)}
        sticky={false}
      />
    </>
  );
}

function ComposeFallback() {
  return (
    <div
      aria-label="发布框加载中"
      className="rounded-lg bg-white/82 p-4 shadow-sm ring-1 ring-black/10"
    >
      <div className="flex gap-2">
        <div className="h-7 w-24 animate-pulse rounded-full bg-[#f0dec4]" />
        <div className="h-7 w-20 animate-pulse rounded-full bg-[#f0dec4]" />
      </div>
      <div className="mt-4 h-16 animate-pulse rounded-md bg-[#f4e4ce]" />
      <div className="mt-4 flex items-center justify-between">
        <div className="h-9 w-24 animate-pulse rounded-full bg-[#f4e4ce]" />
        <div className="h-8 w-20 animate-pulse rounded-full bg-[#e8b49d]" />
      </div>
    </div>
  );
}

function FeedFallback() {
  const previewPost = samplePosts[0];

  return (
    <div className="space-y-5" aria-label="动态加载中">
      <article className="overflow-hidden rounded-xl bg-white/78 shadow-[0_14px_28px_-24px_rgba(23,18,13,0.85)] ring-1 ring-black/10">
        <div className="flex items-center gap-3 p-4 sm:p-5">
          <div className="h-11 w-11 animate-pulse rounded-full bg-[#ecd8ba]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-[#ecd8ba]" />
            <div className="h-3 w-44 animate-pulse rounded bg-[#f2e2cc]" />
          </div>
        </div>
        <p className="px-4 pb-4 text-[15px] leading-7 text-[#3b3027] sm:px-5">
          {previewPost.caption}
        </p>
        <div className="bg-[#efd7b5]">
          <Image
            src={previewPost.imageUrl}
            alt=""
            width={1200}
            height={560}
            priority
            sizes="(max-width: 1024px) 100vw, 680px"
            className="aspect-[16/10] max-h-[420px] w-full object-cover"
          />
        </div>
      </article>
      <article className="overflow-hidden rounded-xl bg-white/78 shadow-[0_14px_28px_-24px_rgba(23,18,13,0.85)] ring-1 ring-black/10">
        <div className="flex items-center gap-3 p-4 sm:p-5">
          <div className="h-11 w-11 animate-pulse rounded-full bg-[#ecd8ba]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-[#ecd8ba]" />
            <div className="h-3 w-44 animate-pulse rounded bg-[#f2e2cc]" />
          </div>
        </div>
      </article>
    </div>
  );
}

function HomeAsideFallback() {
  return (
    <div
      aria-label="侧栏加载中"
      className="hidden space-y-5 xl:block"
    >
      <div className="overflow-hidden rounded-lg bg-white/60 ring-1 ring-black/10">
        <div className="relative h-28 bg-[#eecf9d]">
          <Image
            src={sampleProfile.coverUrl ?? "/samples/walk-dog.png"}
            alt=""
            fill
            priority
            sizes="360px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/40 to-transparent" />
        </div>
        <div className="space-y-4 px-5 pb-5 pt-4">
          <div className="h-5 w-36 animate-pulse rounded bg-[#ecd8ba]" />
          <div className="h-4 w-24 animate-pulse rounded bg-[#f2e2cc]" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-md bg-[#fffaf1] ring-1 ring-black/5"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyPicksFallback() {
  return (
    <div className="rounded-lg bg-white/82 p-4 shadow-sm ring-1 ring-black/10">
      <div className="h-4 w-20 animate-pulse rounded bg-[#ecd8ba]" />
      <div className="mt-3 space-y-2">
        <div className="h-12 animate-pulse rounded-md bg-[#fff7ea] ring-1 ring-[#f0dec4]" />
        <div className="h-12 animate-pulse rounded-md bg-[#fff7ea] ring-1 ring-[#f0dec4]" />
      </div>
    </div>
  );
}

function CheckInCardFallback() {
  return (
    <div className="rounded-lg bg-white/82 p-4 shadow-sm ring-1 ring-black/10">
      <div className="text-center">
        <div className="mx-auto h-4 w-20 animate-pulse rounded bg-[#ecd8ba]" />
        <div className="mx-auto mt-2 h-10 w-14 animate-pulse rounded bg-[#f2e2cc]" />
        <div className="mx-auto mt-3 h-7 w-20 animate-pulse rounded-full bg-[#e8b49d]" />
      </div>
      <div className="mt-4 border-t border-black/10 pt-4">
        <div className="h-4 w-20 animate-pulse rounded bg-[#ecd8ba]" />
        <div className="mt-2 flex flex-wrap gap-2">
          <div className="h-7 w-20 animate-pulse rounded-full bg-[#fff3df]" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-[#fff3df]" />
        </div>
      </div>
    </div>
  );
}
