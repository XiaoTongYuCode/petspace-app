import { BackendStatusPanel } from "@/components/backend-status-panel";
import { ComposeCard } from "@/components/compose-card";
import { FeedList } from "@/components/feed-list";
import { GrowthPanel } from "@/components/growth-panel";
import { ProfileSummaryCard } from "@/components/profile-summary-card";
import { DesktopNav, MobileNav, SiteHeader } from "@/components/site-shell";
import { getBackendStatus } from "@/lib/backend-status";
import { getCurrentUserProfile, getFeedPosts } from "@/lib/data";
import { samplePosts, sampleProfile } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const backendStatus = await getBackendStatus({ checkDatabase: true });
  const canReadDatabase =
    backendStatus.configured.database &&
    backendStatus.database.reachable !== false &&
    backendStatus.database.schemaReady !== false;
  const [posts, currentProfile] = canReadDatabase
    ? await Promise.all([getFeedPosts(), getCurrentUserProfile()])
    : [samplePosts, null];
  const profile = currentProfile ?? sampleProfile;
  const composeDisabledReason = backendStatus.ready
    ? null
    : "发布功能暂时还在准备中，可以先浏览演示动态。";
  const feedCountLabel = `${posts.length}+`;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff5e6_0%,_#fef5e7_38%,_#f8ecdc_100%)] pb-32 lg:pb-8">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8 lg:py-8 xl:grid-cols-[210px_minmax(0,680px)_320px]">
        <DesktopNav />
        <main className="min-w-0 space-y-5">
          <section className="relative overflow-hidden rounded-xl border border-black/10 bg-[#17120d] px-5 py-5 text-[#fff7ea] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.85)] sm:px-6">
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
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold text-[#f8d9ac]">
                  <span className="rounded-full border border-[#f2b84b]/30 bg-[#f2b84b]/10 px-2.5 py-1">
                    动态 {feedCountLabel}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/8 px-2.5 py-1">
                    {backendStatus.ready ? "在线发布" : "演示模式"}
                  </span>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#f7dfbf]">
                用照片记录小家伙的日常小事，也把喜欢、浏览和收藏留给那些值得回看的瞬间 ~
              </p>
            </div>
          </section>

          <BackendStatusPanel status={backendStatus} />
          <ComposeCard disabledReason={composeDisabledReason} />

          <FeedList key={posts[0]?.id ?? "feed"} posts={posts} />
        </main>
        <aside className="space-y-5 xl:sticky xl:top-[84px] xl:h-fit">
          <ProfileSummaryCard
            profile={profile}
            editable={Boolean(currentProfile)}
          />
          <GrowthPanel posts={posts} />
        </aside>
      </div>
      <MobileNav />
    </div>
  );
}
