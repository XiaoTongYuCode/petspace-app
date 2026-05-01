import { Bookmark } from "lucide-react";
import Link from "next/link";
import { BackendStatusPanel } from "@/components/backend-status-panel";
import { FeedList } from "@/components/feed-list";
import { DesktopNav, MobileNav, SiteHeader } from "@/components/site-shell";
import { getBackendStatus } from "@/lib/backend-status";
import { getCurrentUserProfile, getFavoritePosts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const [backendStatus, profile, posts] = await Promise.all([
    getBackendStatus(),
    getCurrentUserProfile(),
    getFavoritePosts(),
  ]);
  const isPreview = !profile && posts.length > 0;

  return (
    <div className="min-h-screen bg-[#fef5e7] pb-32 lg:pb-8">
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8 lg:py-8">
        <DesktopNav />
        <main className="min-w-0 space-y-5">
          <BackendStatusPanel status={backendStatus} />
          <section className="rounded-xl border border-black/10 bg-[#17120d] px-4 py-4 text-[#fff7ea] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.85)] sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#f2b84b]">
                  <Bookmark className="h-4 w-4 fill-[#f2b84b]" />
                  我的收藏
                </p>
                <h1 className="text-2xl font-black tracking-normal sm:text-3xl">
                  留住想反复看的瞬间
                </h1>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#f7dfbf]">
                {posts.length > 0
                  ? `已收藏 ${posts.length} 条动态。`
                  : "收藏喜欢的照片和故事后，会集中出现在这里。"}
              </p>
            </div>
          </section>

          {posts.length > 0 ? (
            <FeedList key={posts[0]?.id ?? "favorites"} posts={posts} />
          ) : (
            <EmptyFavorites authenticated={Boolean(profile)} />
          )}

          {isPreview ? (
            <p className="rounded-lg bg-white/75 px-4 py-3 text-sm font-medium text-[#6b5847] ring-1 ring-black/10">
              当前展示的是预览收藏；接入数据库并登录后会显示你的真实收藏。
            </p>
          ) : null}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function EmptyFavorites({ authenticated }: { authenticated: boolean }) {
  return (
    <section className="rounded-xl bg-white/78 px-6 py-10 text-center shadow-[0_14px_28px_-24px_rgba(23,18,13,0.85)] ring-1 ring-black/10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff3df] text-[#b37b18] ring-1 ring-black/5">
        <Bookmark className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-black text-[#17120d]">
        {authenticated ? "还没有收藏动态" : "登录后查看我的收藏"}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6b5847]">
        {authenticated
          ? "在广场遇到喜欢的宠物日常，点亮书签后就能从这里快速回看。"
          : "收藏是跟随账号保存的内容，登录后可以查看和管理你的收藏动态。"}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-full bg-[#17120d] px-5 text-sm font-bold text-[#fff7ea] transition hover:bg-[#2a2119] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e46645]/40"
      >
        去宠物广场
      </Link>
    </section>
  );
}
