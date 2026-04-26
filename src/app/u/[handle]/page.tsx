import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { ProfileSummaryCard } from "@/components/profile-summary-card";
import { DesktopNav, MobileNav, SiteHeader } from "@/components/site-shell";
import { Avatar } from "@/components/avatar";
import { compactNumber } from "@/lib/format";
import { getProfileByHandle } from "@/lib/data";
import { DEFAULT_PROFILE_COVER_URL } from "@/lib/profile-defaults";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const result = await getProfileByHandle(handle);

  if (!result) {
    notFound();
  }

  const { profile, posts } = result;
  const coverUrl = profile.coverUrl ?? DEFAULT_PROFILE_COVER_URL;

  return (
    <div className="min-h-screen bg-[#fef5e7] pb-32 lg:pb-8">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:px-8 lg:py-8 xl:grid-cols-[210px_minmax(0,680px)_320px]">
        <DesktopNav />
        <main className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-lg bg-white/72 ring-1 ring-black/10">
            <div
              className="relative h-48 bg-cover bg-center"
              style={{
                backgroundImage: `url(${coverUrl})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent" />
            </div>
            <div className="p-5">
              <div className="relative z-10 -mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <Avatar src={profile.avatarUrl} name={profile.displayName} size="lg" />
                  <div className="pb-1">
                    <h1 className="text-2xl font-black text-[#17120d]">
                      {profile.displayName}
                    </h1>
                    <p className="text-sm font-semibold text-[#8a715b]">
                      @{profile.handle}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:min-w-72">
                  {[
                    ["总访问", profile.totalViews + profile.profileViews],
                    ["点赞", profile.totalLikes],
                    ["动态", profile.postsCount],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-md bg-[#fffaf1] px-3 py-2.5 text-center ring-1 ring-black/10"
                    >
                      <p className="font-black text-[#17120d]">
                        {compactNumber(Number(value))}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#8a715b]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#5a493b]">
                {profile.bio}
              </p>
            </div>
          </section>

          <div className="space-y-5">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} priority={index === 0} />
            ))}
          </div>
        </main>
        <ProfileSummaryCard profile={profile} />
      </div>
      <MobileNav />
    </div>
  );
}
