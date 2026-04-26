import { BackendStatusPanel } from "@/components/backend-status-panel";
import { ComposeCard } from "@/components/compose-card";
import { PostCard } from "@/components/post-card";
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

  return (
    <div className="min-h-screen bg-[#fef5e7] pb-32 lg:pb-8">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8 lg:py-8 xl:grid-cols-[210px_minmax(0,680px)_320px]">
        <DesktopNav />
        <main className="min-w-0 space-y-5">
          <section className="rounded-lg border border-black/10 bg-[#17120d] px-5 py-5 text-[#fff7ea] sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#f2b84b]">Petspace</p>
                <h1 className="mt-2 text-2xl font-black tracking-normal sm:text-3xl">
                  分享今日
                </h1>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#f7dfbf]">
                用照片记录小家伙的日常小事，也把喜欢、浏览和收藏留给那些值得回看的瞬间 ~
              </p>
            </div>
          </section>

          <BackendStatusPanel status={backendStatus} />
          <ComposeCard disabledReason={composeDisabledReason} />

          <div className="space-y-5">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} priority={index === 0} />
            ))}
          </div>
        </main>
        <ProfileSummaryCard
          profile={profile}
          editable={Boolean(currentProfile)}
        />
      </div>
      <MobileNav />
    </div>
  );
}
